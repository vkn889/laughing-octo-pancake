// Picks the storage backend once, at module load: Redis when its env vars
// are present (i.e. on Vercel once you've connected a store), otherwise
// the local JSON file (i.e. running with `next dev`/`next start` on a
// laptop with nothing extra configured). See README for setup either way.

import { fileBackend } from "./fileBackend";
import { isRedisConfigured, redisBackend } from "./redisBackend";
import type { StorageBackend } from "./types";

export const backend: StorageBackend = isRedisConfigured() ? redisBackend : fileBackend;

export type { StorageBackend, TeamState, TeamStatus } from "./types";
export { defaultTeamState } from "./types";
