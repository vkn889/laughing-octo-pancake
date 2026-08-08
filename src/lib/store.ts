// Shared persistent key-value storage (SRD 2.1 / 2.2). The actual reads
// and writes go through a pluggable backend (src/lib/storage) so this file
// stays the same whether it's running as a local JSON file on your laptop
// or Redis on Vercel; see src/lib/storage/index.ts for how the backend is
// chosen, and README for how to connect one on Vercel.

import { POKEMON, POKEMON_BY_ID, type CardRarity, type PokemonClue } from "./pokemon";
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

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Sum of points for every card a team has already caught (indices before
 * currentIndex — currentIndex only advances once the host confirms a
 * handoff). Finding more stages of one line adds up naturally: 2 stages
 * = 10, a complete 3-stage line = 15, no separate multiplier needed.
 */
function computeScore(team: TeamState): number {
  let total = 0;
  for (let i = 0; i < team.currentIndex; i++) {
    const pokemon = POKEMON_BY_ID[team.clueOrder[i]];
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
  currentClueNumber: number; // 1-indexed, for display
  totalClues: number;
  score: number;
  hintText: string | null;
  /** Silhouette hint image — only set for basic-stage cards. */
  hintImage: string | null;
  /** Non-basic-stage cards get a "Play Cry" button instead of an image;
   *  this seeds its (synthesized, non-real-cry) pitch. */
  hintAudioSeed: string | null;
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
  currentPokemonName: string | null;
  currentHidingSpot: string | null;
  currentPoints: number | null;
  currentRarity: CardRarity | null;
};

function toPlayerView(team: TeamState, config: TeamConfig): PlayerTeamView {
  const currentPokemonId = team.clueOrder[team.currentIndex];
  const currentPokemon: PokemonClue | undefined = currentPokemonId
    ? POKEMON_BY_ID[currentPokemonId]
    : undefined;

  const showClue = team.status === "guessing" && currentPokemon;
  const showReveal = team.status === "awaiting_handoff" && currentPokemon;

  return {
    teamId: team.teamId,
    teamName: config.name,
    color: config.color,
    status: team.status,
    currentClueNumber: Math.min(team.currentIndex + 1, TOTAL_CLUES),
    totalClues: TOTAL_CLUES,
    score: computeScore(team),
    hintText: showClue ? currentPokemon!.hintText : null,
    hintImage: showClue && currentPokemon!.isBasicStage ? currentPokemon!.image : null,
    hintAudioSeed: showClue && !currentPokemon!.isBasicStage ? currentPokemon!.id : null,
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
  const currentPokemonId = team.clueOrder[team.currentIndex];
  const currentPokemon = currentPokemonId ? POKEMON_BY_ID[currentPokemonId] : undefined;
  return {
    ...team,
    teamName: config.name,
    color: config.color,
    score: computeScore(team),
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
  const team = await backend.getTeam(teamId);
  return toPlayerView(team, config);
}

export async function getHostState(): Promise<HostTeamView[]> {
  const teams = await backend.getAllTeams(ALL_TEAM_IDS);
  return TEAMS.map((t, i) => toHostView(teams[i], t));
}

type ClaimResult =
  | { ok: true; team: PlayerTeamView }
  | { ok: false; error: "unknown_team" | "already_claimed" };

export async function claimTeam(teamId: string): Promise<ClaimResult> {
  const config = TEAM_BY_ID[teamId];
  if (!config) return { ok: false, error: "unknown_team" };

  const newState: TeamState = {
    teamId,
    clueOrder: shuffle(POKEMON.map((p) => p.id)),
    currentIndex: 0,
    status: "guessing",
    startTime: Date.now(),
    finishTime: null,
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

  const team = await backend.getTeam(teamId);
  if (team.status !== "guessing") {
    return { ok: false, error: "not_guessing" };
  }
  const currentPokemon = POKEMON_BY_ID[team.clueOrder[team.currentIndex]];
  const correct = isGuessCorrect(guess, currentPokemon.acceptedAnswers);

  const updated: TeamState = correct
    ? { ...team, status: "awaiting_handoff" }
    : { ...team, wrongGuesses: team.wrongGuesses + 1 };

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
  if (team.status !== "awaiting_handoff") {
    return { ok: false, error: "not_awaiting_handoff" };
  }

  const nextIndex = team.currentIndex + 1;
  const finished = nextIndex >= TOTAL_CLUES;
  const updated: TeamState = {
    ...team,
    currentIndex: nextIndex,
    status: finished ? "finished" : "guessing",
    finishTime: finished ? Date.now() : team.finishTime,
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
