// Vercel-compatible backend: Supabase Postgres. Selected automatically by
// src/lib/storage/index.ts when SUPABASE_URL/SUPABASE_ANON_KEY are set;
// see README for setup. Uses only the anon/publishable key (never the
// more privileged service_role key) since Row Level Security on the
// `teams` table scopes anon to exactly what this app needs: read every
// team, update a team's game-state columns. No insert/delete policy
// exists for anon, so the fixed 7-team roster (seeded once via migration)
// can't be tampered with even if this key leaked.
//
// claimTeam relies on Postgres executing `UPDATE ... WHERE status =
// 'unclaimed'` as a single atomic statement: only the request whose
// WHERE clause still matches at execution time gets a row back, so
// simultaneous claims on the same team resolve to exactly one winner
// (SRD 2.7) no matter how many serverless instances are involved.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { defaultTeamState, type StorageBackend, type TeamState } from "./types";

function readConfig(): { url: string; key: string } | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  return readConfig() !== null;
}

let client: SupabaseClient | null = null;
function getClient(): SupabaseClient {
  if (client) return client;
  const config = readConfig();
  if (!config) {
    throw new Error("Supabase backend selected but SUPABASE_URL/SUPABASE_ANON_KEY are not set.");
  }
  client = createClient(config.url, config.key, {
    auth: { persistSession: false },
  });
  return client;
}

type TeamRow = {
  team_id: string;
  status: TeamState["status"];
  caught_ids: string[];
  current_card_id: string | null;
  start_time: number | null;
  finish_time: number | null;
  wrong_guesses: number;
};

function rowToTeamState(row: TeamRow): TeamState {
  return {
    teamId: row.team_id,
    status: row.status,
    caughtIds: row.caught_ids,
    currentCardId: row.current_card_id,
    startTime: row.start_time,
    finishTime: row.finish_time,
    wrongGuesses: row.wrong_guesses,
  };
}

function teamStateToRow(state: TeamState): Omit<TeamRow, "team_id"> {
  return {
    status: state.status,
    caught_ids: state.caughtIds,
    current_card_id: state.currentCardId,
    start_time: state.startTime,
    finish_time: state.finishTime,
    wrong_guesses: state.wrongGuesses,
  };
}

export const supabaseBackend: StorageBackend = {
  async getTeam(teamId) {
    const { data, error } = await getClient()
      .from("teams")
      .select("*")
      .eq("team_id", teamId)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToTeamState(data as TeamRow) : defaultTeamState(teamId);
  },

  async getAllTeams(teamIds) {
    if (teamIds.length === 0) return [];
    const { data, error } = await getClient().from("teams").select("*").in("team_id", teamIds);
    if (error) throw error;
    const byId = new Map((data as TeamRow[]).map((row) => [row.team_id, rowToTeamState(row)]));
    return teamIds.map((id) => byId.get(id) ?? defaultTeamState(id));
  },

  async claimTeam(teamId, newState) {
    const { data, error } = await getClient()
      .from("teams")
      .update(teamStateToRow(newState))
      .eq("team_id", teamId)
      .eq("status", "unclaimed")
      .select("team_id");
    if (error) throw error;
    return (data?.length ?? 0) > 0;
  },

  async writeTeam(teamId, teamState) {
    const { error } = await getClient()
      .from("teams")
      .update(teamStateToRow(teamState))
      .eq("team_id", teamId);
    if (error) throw error;
  },
};
