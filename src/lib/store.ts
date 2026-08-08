// Shared persistent key-value storage (SRD 2.1 / 2.2), implemented as a
// single JSON file on disk. This is intentionally NOT a database: the app
// is meant to run as one persistent `next start` process on the host's
// laptop for the duration of the party (see README), so a plain file plus
// an in-process async mutex satisfies "shared storage" + "first write wins"
// (SRD 2.7) without any external service.

import { promises as fs } from "fs";
import path from "path";
import { POKEMON, POKEMON_BY_ID, type PokemonClue } from "./pokemon";
import { TEAMS, TEAM_BY_ID, type TeamConfig } from "./teams";
import { isGuessCorrect } from "./match";

export type TeamStatus = "unclaimed" | "guessing" | "awaiting_handoff" | "finished";

export type TeamState = {
  teamId: string;
  status: TeamStatus;
  clueOrder: string[]; // pokemon ids, shuffled once at claim time
  currentIndex: number; // 0-6
  startTime: number | null;
  finishTime: number | null;
  wrongGuesses: number;
};

type StoreShape = {
  teams: Record<string, TeamState>;
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "state.json");
const TOTAL_CLUES = POKEMON.length;

function defaultTeamState(teamId: string): TeamState {
  return {
    teamId,
    status: "unclaimed",
    clueOrder: [],
    currentIndex: 0,
    startTime: null,
    finishTime: null,
    wrongGuesses: 0,
  };
}

function defaultStore(): StoreShape {
  return {
    teams: Object.fromEntries(TEAMS.map((t) => [t.id, defaultTeamState(t.id)])),
  };
}

// --- In-process mutex --------------------------------------------------
// Serializes every read-modify-write so two simultaneous requests (e.g.
// two devices tapping the same team) can't race each other.
let mutexQueue: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const result = mutexQueue.then(fn, fn);
  // Swallow errors for chaining purposes only; the real error still
  // propagates to the caller via `result`.
  mutexQueue = result.catch(() => undefined);
  return result;
}

async function ensureDataFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(defaultStore(), null, 2), "utf-8");
  }
}

async function readStore(): Promise<StoreShape> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  const parsed = JSON.parse(raw) as StoreShape;

  // Backfill any teams missing from an older data file (e.g. roster changed).
  for (const t of TEAMS) {
    if (!parsed.teams[t.id]) parsed.teams[t.id] = defaultTeamState(t.id);
  }
  return parsed;
}

async function writeStore(store: StoreShape): Promise<void> {
  // Write to a temp file then rename, so a crash mid-write never corrupts
  // the main file.
  const tmpFile = `${DATA_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmpFile, JSON.stringify(store, null, 2), "utf-8");
  await fs.rename(tmpFile, DATA_FILE);
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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
  hintText: string | null;
  hintImage: string | null;
  wrongGuesses: number;
  startTime: number | null;
  finishTime: number | null;
};

export type HostTeamView = TeamState & {
  teamName: string;
  color: string;
  currentPokemonName: string | null;
  currentHidingSpot: string | null;
};

function toPlayerView(team: TeamState, config: TeamConfig): PlayerTeamView {
  const currentPokemonId = team.clueOrder[team.currentIndex];
  const currentPokemon: PokemonClue | undefined = currentPokemonId
    ? POKEMON_BY_ID[currentPokemonId]
    : undefined;

  const showClue = team.status === "guessing" && currentPokemon;

  return {
    teamId: team.teamId,
    teamName: config.name,
    color: config.color,
    status: team.status,
    currentClueNumber: Math.min(team.currentIndex + 1, TOTAL_CLUES),
    totalClues: TOTAL_CLUES,
    hintText: showClue ? currentPokemon!.hintText : null,
    hintImage: showClue ? currentPokemon!.image : null,
    wrongGuesses: team.wrongGuesses,
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
    currentPokemonName: currentPokemon?.name ?? null,
    currentHidingSpot: currentPokemon?.hidingSpot ?? null,
  };
}

// --- Public API -----------------------------------------------------------

export async function listPublicTeams(): Promise<PublicTeamSummary[]> {
  const store = await readStore();
  return TEAMS.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    claimed: store.teams[t.id].status !== "unclaimed",
  }));
}

export async function getPlayerTeamView(teamId: string): Promise<PlayerTeamView | null> {
  const config = TEAM_BY_ID[teamId];
  if (!config) return null;
  const store = await readStore();
  return toPlayerView(store.teams[teamId], config);
}

export async function getHostState(): Promise<HostTeamView[]> {
  const store = await readStore();
  return TEAMS.map((t) => toHostView(store.teams[t.id], t));
}

type ClaimResult =
  | { ok: true; team: PlayerTeamView }
  | { ok: false; error: "unknown_team" | "already_claimed" };

export async function claimTeam(teamId: string): Promise<ClaimResult> {
  const config = TEAM_BY_ID[teamId];
  if (!config) return { ok: false, error: "unknown_team" };

  return withLock(async () => {
    const store = await readStore();
    const team = store.teams[teamId];
    if (team.status !== "unclaimed") {
      return { ok: false, error: "already_claimed" };
    }
    team.clueOrder = shuffle(POKEMON.map((p) => p.id));
    team.currentIndex = 0;
    team.status = "guessing";
    team.startTime = Date.now();
    team.finishTime = null;
    team.wrongGuesses = 0;
    await writeStore(store);
    return { ok: true, team: toPlayerView(team, config) };
  });
}

type GuessResult =
  | { ok: true; correct: boolean; team: PlayerTeamView }
  | { ok: false; error: "unknown_team" | "not_guessing" };

export async function submitGuess(teamId: string, guess: string): Promise<GuessResult> {
  const config = TEAM_BY_ID[teamId];
  if (!config) return { ok: false, error: "unknown_team" };

  return withLock(async () => {
    const store = await readStore();
    const team = store.teams[teamId];
    if (team.status !== "guessing") {
      return { ok: false, error: "not_guessing" };
    }
    const currentPokemon = POKEMON_BY_ID[team.clueOrder[team.currentIndex]];
    const correct = isGuessCorrect(guess, currentPokemon.acceptedAnswers);

    if (correct) {
      team.status = "awaiting_handoff";
    } else {
      team.wrongGuesses += 1;
    }
    await writeStore(store);
    return { ok: true, correct, team: toPlayerView(team, config) };
  });
}

type ConfirmResult =
  | { ok: true; team: HostTeamView }
  | { ok: false; error: "unknown_team" | "not_awaiting_handoff" };

export async function confirmHandoff(teamId: string): Promise<ConfirmResult> {
  const config = TEAM_BY_ID[teamId];
  if (!config) return { ok: false, error: "unknown_team" };

  return withLock(async () => {
    const store = await readStore();
    const team = store.teams[teamId];
    if (team.status !== "awaiting_handoff") {
      return { ok: false, error: "not_awaiting_handoff" };
    }
    team.currentIndex += 1;
    if (team.currentIndex >= TOTAL_CLUES) {
      team.status = "finished";
      team.finishTime = Date.now();
    } else {
      team.status = "guessing";
    }
    await writeStore(store);
    return { ok: true, team: toHostView(team, config) };
  });
}

/** Testing/host utility: wipe all progress and re-lock every team. */
export async function resetAllTeams(): Promise<void> {
  await withLock(async () => {
    await writeStore(defaultStore());
  });
}
