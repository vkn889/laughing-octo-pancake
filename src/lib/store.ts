// Shared persistent key-value storage (SRD 2.1 / 2.2). The actual reads
// and writes go through a pluggable backend (src/lib/storage) so this file
// stays the same whether it's running as a local JSON file on your laptop
// or Supabase on Vercel; see src/lib/storage/index.ts for how the backend
// is chosen, and README for how to connect one on Vercel.
//
// Cards are a SHARED pool across all 7 teams, not a fixed per-team
// shuffle: once any team catches a card, it's gone for everyone else.
// pickNextCard/reconcileTeam below are what make that work.

import { POKEMON, POKEMON_BY_ID, type CardRarity } from "./pokemon";
import { TEAMS, TEAM_BY_ID, type TeamConfig } from "./teams";
import { isGuessCorrect } from "./match";
import {
  backend,
  defaultTeamState,
  type TeamState,
  type TeamStatus,
} from "./storage";

export type { TeamState, TeamStatus };

const TOTAL_CLUES = POKEMON.length;
const ALL_TEAM_IDS = TEAMS.map((t) => t.id);

/**
 * Picks a random still-available card for `forTeamId`. "Available" means
 * not yet caught by any team; a card another team currently has as their
 * active clue is avoided where possible too (so two teams don't usually
 * end up chasing the same not-yet-caught card), but falls back to
 * allowing that overlap once the pool gets small enough that avoiding it
 * entirely isn't possible. Returns null once the whole 53-card roster has
 * been caught across all teams.
 */
function pickNextCard(allTeams: TeamState[], forTeamId: string): string | null {
  const caughtGlobally = new Set(allTeams.flatMap((t) => t.caughtIds));
  // A card another team is "awaiting_handoff" on is effectively already
  // spoken for (they guessed it correctly, just haven't been confirmed
  // yet), not just one they're actively "guessing" — both count.
  const inProgressElsewhere = new Set(
    allTeams
      .filter(
        (t) =>
          t.teamId !== forTeamId &&
          (t.status === "guessing" || t.status === "awaiting_handoff") &&
          t.currentCardId
      )
      .map((t) => t.currentCardId as string)
  );

  const uncontested = POKEMON.filter(
    (p) => !caughtGlobally.has(p.id) && !inProgressElsewhere.has(p.id)
  );
  const pool = uncontested.length > 0
    ? uncontested
    : POKEMON.filter((p) => !caughtGlobally.has(p.id));

  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)].id;
}

/**
 * Self-healing: a team can end up holding a card (as their active clue,
 * or even already "awaiting_handoff" on it) that another team catches
 * first — two teams can both be assigned the same not-yet-caught card
 * when the pool is small (see pickNextCard's fallback), or two writes can
 * race. Rather than requiring a distributed lock across all 7 teams for
 * every catch, this just checks and fixes it on every read: called from
 * getPlayerTeamView/getHostState, so a team gets swapped onto a fresh
 * card (or told the hunt's over, if nothing's left) within one poll cycle
 * of losing the race, instead of sitting on a "bring it to the host"
 * screen for something that's already gone. confirmHandoff has its own
 * last-instant version of this same check too, in case the host taps
 * Confirm in the narrow window before the next poll would have caught it.
 */
async function reconcileTeam(team: TeamState, allTeams: TeamState[]): Promise<TeamState> {
  const isActive = team.status === "guessing" || team.status === "awaiting_handoff";
  if (!isActive || !team.currentCardId) return team;

  const caughtGlobally = new Set(
    allTeams.filter((t) => t.teamId !== team.teamId).flatMap((t) => t.caughtIds)
  );
  if (!caughtGlobally.has(team.currentCardId)) return team;

  const nextId = pickNextCard(allTeams, team.teamId);
  const updated: TeamState = nextId
    ? { ...team, currentCardId: nextId, status: "guessing" }
    : { ...team, currentCardId: null, status: "finished", finishTime: Date.now() };
  await backend.writeTeam(team.teamId, updated);
  return updated;
}

/**
 * Sum of points for every card a team has actually caught. Finding more
 * stages of one line adds up naturally: 2 stages = 10, a complete
 * 3-stage line = 15, no separate multiplier needed.
 */
function computeScore(team: TeamState): number {
  let total = 0;
  for (const id of team.caughtIds) {
    const pokemon = POKEMON_BY_ID[id];
    if (pokemon) total += pokemon.points;
  }
  return total;
}

// --- Public shapes returned to clients ----------------------------------

export type PublicTeamSummary = {
  id: string;
  name: string;
  color: string;
  claimed: boolean;
};

export type PlayerTeamView = {
  teamId: string;
  teamName: string;
  color: string;
  status: TeamStatus;
  caughtCount: number;
  totalClues: number; // full roster size, for "N of 53" context
  score: number;
  hintText: string | null;
  /** Silhouette hint image, shown for every card while guessing. */
  hintImage: string | null;
  hintPoints: number | null;
  hintRarity: CardRarity | null;
  wrongGuesses: number;
  /** Set only right after a correct guess (status "awaiting_handoff"):
   *  the full-color reveal, shown instead of the silhouette. */
  revealImage: string | null;
  revealName: string | null;
  revealPoints: number | null;
  revealRarity: CardRarity | null;
  startTime: number | null;
  finishTime: number | null;
};

export type HostTeamView = TeamState & {
  teamName: string;
  color: string;
  score: number;
  caughtCount: number;
  currentPokemonName: string | null;
  currentHidingSpot: string | null;
  currentPoints: number | null;
  currentRarity: CardRarity | null;
};

function toPlayerView(team: TeamState, config: TeamConfig): PlayerTeamView {
  const currentPokemon = team.currentCardId ? POKEMON_BY_ID[team.currentCardId] : undefined;
  const showClue = team.status === "guessing" && currentPokemon;
  const showReveal = team.status === "awaiting_handoff" && currentPokemon;

  return {
    teamId: team.teamId,
    teamName: config.name,
    color: config.color,
    status: team.status,
    caughtCount: team.caughtIds.length,
    totalClues: TOTAL_CLUES,
    score: computeScore(team),
    hintText: showClue ? currentPokemon!.hintText : null,
    hintImage: showClue ? currentPokemon!.image : null,
    hintPoints: showClue ? currentPokemon!.points : null,
    hintRarity: showClue ? currentPokemon!.rarity : null,
    wrongGuesses: team.wrongGuesses,
    revealImage: showReveal ? currentPokemon!.image : null,
    revealName: showReveal ? currentPokemon!.name : null,
    revealPoints: showReveal ? currentPokemon!.points : null,
    revealRarity: showReveal ? currentPokemon!.rarity : null,
    startTime: team.startTime,
    finishTime: team.finishTime,
  };
}

function toHostView(team: TeamState, config: TeamConfig): HostTeamView {
  const currentPokemon = team.currentCardId ? POKEMON_BY_ID[team.currentCardId] : undefined;
  return {
    ...team,
    teamName: config.name,
    color: config.color,
    score: computeScore(team),
    caughtCount: team.caughtIds.length,
    currentPokemonName: currentPokemon?.name ?? null,
    currentHidingSpot: currentPokemon?.hidingSpot ?? null,
    currentPoints: currentPokemon?.points ?? null,
    currentRarity: currentPokemon?.rarity ?? null,
  };
}

// --- Public API -----------------------------------------------------------

export async function listPublicTeams(): Promise<PublicTeamSummary[]> {
  const teams = await backend.getAllTeams(ALL_TEAM_IDS);
  return TEAMS.map((t, i) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    claimed: teams[i].status !== "unclaimed",
  }));
}

export async function getPlayerTeamView(teamId: string): Promise<PlayerTeamView | null> {
  const config = TEAM_BY_ID[teamId];
  if (!config) return null;
  const allTeams = await backend.getAllTeams(ALL_TEAM_IDS);
  const team = allTeams.find((t) => t.teamId === teamId);
  if (!team) return null;
  const reconciled = await reconcileTeam(team, allTeams);
  return toPlayerView(reconciled, config);
}

export async function getHostState(): Promise<HostTeamView[]> {
  const allTeams = await backend.getAllTeams(ALL_TEAM_IDS);
  const reconciled = await Promise.all(allTeams.map((t) => reconcileTeam(t, allTeams)));
  return TEAMS.map((t, i) => toHostView(reconciled[i], t));
}

type ClaimResult =
  | { ok: true; team: PlayerTeamView }
  | { ok: false; error: "unknown_team" | "already_claimed" };

export async function claimTeam(teamId: string): Promise<ClaimResult> {
  const config = TEAM_BY_ID[teamId];
  if (!config) return { ok: false, error: "unknown_team" };

  const allTeams = await backend.getAllTeams(ALL_TEAM_IDS);
  const firstCard = pickNextCard(allTeams, teamId);
  const now = Date.now();

  const newState: TeamState = {
    teamId,
    caughtIds: [],
    currentCardId: firstCard,
    status: firstCard ? "guessing" : "finished",
    startTime: now,
    finishTime: firstCard ? null : now,
    wrongGuesses: 0,
  };

  const won = await backend.claimTeam(teamId, newState);
  if (!won) return { ok: false, error: "already_claimed" };
  return { ok: true, team: toPlayerView(newState, config) };
}

type GuessResult =
  | { ok: true; correct: boolean; team: PlayerTeamView }
  | { ok: false; error: "unknown_team" | "not_guessing" };

export async function submitGuess(teamId: string, guess: string): Promise<GuessResult> {
  const config = TEAM_BY_ID[teamId];
  if (!config) return { ok: false, error: "unknown_team" };

  const allTeams = await backend.getAllTeams(ALL_TEAM_IDS);
  const team = allTeams.find((t) => t.teamId === teamId);
  if (!team) return { ok: false, error: "unknown_team" };

  // Reconcile first: don't score a guess against a card another team
  // already caught out from under this one.
  const current = await reconcileTeam(team, allTeams);
  if (current.status !== "guessing" || !current.currentCardId) {
    return { ok: false, error: "not_guessing" };
  }

  const currentPokemon = POKEMON_BY_ID[current.currentCardId];
  const correct = isGuessCorrect(guess, currentPokemon.acceptedAnswers);

  const updated: TeamState = correct
    ? { ...current, status: "awaiting_handoff" }
    : { ...current, wrongGuesses: current.wrongGuesses + 1 };

  await backend.writeTeam(teamId, updated);
  return { ok: true, correct, team: toPlayerView(updated, config) };
}

type ConfirmResult =
  | { ok: true; team: HostTeamView }
  | { ok: false; error: "unknown_team" | "not_awaiting_handoff" };

export async function confirmHandoff(teamId: string): Promise<ConfirmResult> {
  const config = TEAM_BY_ID[teamId];
  if (!config) return { ok: false, error: "unknown_team" };

  const team = await backend.getTeam(teamId);
  if (team.status !== "awaiting_handoff" || !team.currentCardId) {
    return { ok: false, error: "not_awaiting_handoff" };
  }

  // Re-read fresh so the next card picked accounts for anything any other
  // team has caught since this team's card was assigned.
  const allTeams = await backend.getAllTeams(ALL_TEAM_IDS);

  // Defensive: in a rare race, two teams could both end up "awaiting
  // handoff" on the same not-yet-caught card (see pickNextCard's
  // fallback). If someone else already caught this exact card in the
  // meantime, don't double-award it — treat this confirm as "nothing to
  // hand off" and give the team a fresh card instead.
  const alreadyCaughtElsewhere = allTeams.some(
    (t) => t.teamId !== teamId && t.caughtIds.includes(team.currentCardId as string)
  );
  if (alreadyCaughtElsewhere) {
    const nextId = pickNextCard(allTeams, teamId);
    const bumped: TeamState = {
      ...team,
      currentCardId: nextId,
      status: nextId ? "guessing" : "finished",
      finishTime: nextId ? team.finishTime : Date.now(),
    };
    await backend.writeTeam(teamId, bumped);
    return { ok: true, team: toHostView(bumped, config) };
  }

  const caughtIds = [...team.caughtIds, team.currentCardId];
  const withThisCatch = allTeams.map((t) => (t.teamId === teamId ? { ...t, caughtIds } : t));
  const nextId = pickNextCard(withThisCatch, teamId);

  const updated: TeamState = {
    ...team,
    caughtIds,
    currentCardId: nextId,
    status: nextId ? "guessing" : "finished",
    finishTime: nextId ? team.finishTime : Date.now(),
  };

  await backend.writeTeam(teamId, updated);
  return { ok: true, team: toHostView(updated, config) };
}

/** Testing/host utility: wipe all progress and re-lock every team. */
export async function resetAllTeams(): Promise<void> {
  await Promise.all(
    TEAMS.map((t) => backend.writeTeam(t.id, defaultTeamState(t.id)))
  );
}
