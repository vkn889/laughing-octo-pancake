// Local dev/laptop-hosting backend: one JSON file on disk, guarded by an
// in-process async mutex. This only works correctly as a single persistent
// Node process (`next dev` or `next start`) since the mutex and the file
// handle both live in that one process's memory. Do not use this on Vercel
// or any multi-instance/serverless host; use redisBackend.ts there instead
// (selected automatically by src/lib/storage/index.ts).

import { promises as fs } from "fs";
import path from "path";
import { defaultTeamState, type StorageBackend, type TeamState } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "state.json");

type FileShape = { teams: Record<string, TeamState> };

// Serializes every read-modify-write so two simultaneous requests (e.g.
// two devices tapping the same team) can't race each other.
let mutexQueue: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const result = mutexQueue.then(fn, fn);
  mutexQueue = result.catch(() => undefined);
  return result;
}

async function ensureDataFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({ teams: {} }, null, 2), "utf-8");
  }
}

async function readFileState(): Promise<FileShape> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw) as FileShape;
}

async function writeFileState(state: FileShape): Promise<void> {
  // Write to a temp file then rename, so a crash mid-write never corrupts
  // the main file.
  const tmpFile = `${DATA_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmpFile, JSON.stringify(state, null, 2), "utf-8");
  await fs.rename(tmpFile, DATA_FILE);
}

export const fileBackend: StorageBackend = {
  async getTeam(teamId) {
    const state = await readFileState();
    return state.teams[teamId] ?? defaultTeamState(teamId);
  },

  async getAllTeams(teamIds) {
    const state = await readFileState();
    return teamIds.map((id) => state.teams[id] ?? defaultTeamState(id));
  },

  async claimTeam(teamId, newState) {
    return withLock(async () => {
      const state = await readFileState();
      const current = state.teams[teamId] ?? defaultTeamState(teamId);
      if (current.status !== "unclaimed") return false;
      state.teams[teamId] = newState;
      await writeFileState(state);
      return true;
    });
  },

  async writeTeam(teamId, teamState) {
    return withLock(async () => {
      const state = await readFileState();
      state.teams[teamId] = teamState;
      await writeFileState(state);
    });
  },
};
