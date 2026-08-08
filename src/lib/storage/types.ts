// Shared team-state shape + storage interface. Two backends implement
// this: a local JSON file (fileBackend.ts, for `next dev`/`next start` on
// a laptop) and Redis (redisBackend.ts, for Vercel). src/lib/storage/index.ts
// picks one based on environment variables so the rest of the app never
// needs to know which is active.

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

export function defaultTeamState(teamId: string): TeamState {
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

export interface StorageBackend {
  /** Fetch one team's state, defaulting to "unclaimed" if never written. */
  getTeam(teamId: string): Promise<TeamState>;
  /** Fetch every listed team's state, in one round trip where possible. */
  getAllTeams(teamIds: string[]): Promise<TeamState[]>;
  /**
   * Atomically claim a team: only writes `newState` if the team is
   * currently "unclaimed" (or has never been written). Returns whether
   * this call won the race, so simultaneous taps resolve to first write
   * wins (SRD 2.7) regardless of how many server instances are involved.
   */
  claimTeam(teamId: string, newState: TeamState): Promise<boolean>;
  /** Unconditional overwrite, used for guesses/confirms/reset. */
  writeTeam(teamId: string, state: TeamState): Promise<void>;
}
