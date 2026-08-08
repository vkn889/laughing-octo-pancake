// Picks the storage backend once, at module load: Supabase when its env
// vars are present (i.e. on Vercel once you've set them), otherwise the
// local JSON file (i.e. running with `next dev`/`next start` on a laptop
// with nothing extra configured). See README for setup either way.

import { fileBackend } from "./fileBackend";
import { isSupabaseConfigured, supabaseBackend } from "./supabaseBackend";
import type { StorageBackend } from "./types";

export const backend: StorageBackend = isSupabaseConfigured() ? supabaseBackend : fileBackend;

export type { StorageBackend, TeamState, TeamStatus } from "./types";
export { defaultTeamState } from "./types";
