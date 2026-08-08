// Vercel-compatible backend: Upstash Redis over its REST API (works from
// any serverless/edge runtime, no persistent connection needed). Selected
// automatically by src/lib/storage/index.ts when Redis env vars are
// present; see README for how to connect a store from the Vercel
// dashboard.
//
// Each team is one Redis string key holding its JSON-encoded state.
// claimTeam uses a Lua script so the "is it still unclaimed?" check and
// the write happen as one atomic operation on the Redis server, which is
// what actually guarantees first-write-wins (SRD 2.7) when multiple
// serverless instances could be handling requests at once, unlike the
// file backend's in-process mutex.

import { Redis } from "@upstash/redis";
import { defaultTeamState, type StorageBackend, type TeamState } from "./types";

const KEY_PREFIX = "pokehunt:team:";

function teamKey(teamId: string): string {
  return `${KEY_PREFIX}${teamId}`;
}

// Prefer Vercel's native "Connect Store" env var names; fall back to a
// manually-configured Upstash project's own names.
function readRedisConfig(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

export function isRedisConfigured(): boolean {
  return readRedisConfig() !== null;
}

let client: Redis | null = null;
function getClient(): Redis {
  if (client) return client;
  const config = readRedisConfig();
  if (!config) {
    throw new Error(
      "Redis backend selected but KV_REST_API_URL/TOKEN (or UPSTASH_REDIS_REST_URL/TOKEN) are not set."
    );
  }
  // Disabled so every value we get/set is exactly the JSON string we wrote,
  // with no implicit (de)serialization guessing to reason about across
  // get/mget/eval.
  client = new Redis({ ...config, automaticDeserialization: false });
  return client;
}

// Atomic compare-and-set: only overwrite if the key is missing (never
// claimed) or its stored status is "unclaimed".
const CLAIM_SCRIPT = `
local current = redis.call('GET', KEYS[1])
if current then
  local decoded = cjson.decode(current)
  if decoded['status'] ~= 'unclaimed' then
    return 0
  end
end
redis.call('SET', KEYS[1], ARGV[1])
return 1
`;

function parseTeam(teamId: string, raw: string | null): TeamState {
  if (!raw) return defaultTeamState(teamId);
  try {
    return JSON.parse(raw) as TeamState;
  } catch {
    return defaultTeamState(teamId);
  }
}

export const redisBackend: StorageBackend = {
  async getTeam(teamId) {
    const raw = await getClient().get<string>(teamKey(teamId));
    return parseTeam(teamId, raw);
  },

  async getAllTeams(teamIds) {
    if (teamIds.length === 0) return [];
    const keys = teamIds.map(teamKey);
    const results = await getClient().mget<string[]>(...keys);
    return teamIds.map((id, i) => parseTeam(id, results[i] ?? null));
  },

  async claimTeam(teamId, newState) {
    const result = await getClient().eval(
      CLAIM_SCRIPT,
      [teamKey(teamId)],
      [JSON.stringify(newState)]
    );
    return result === 1;
  },

  async writeTeam(teamId, teamState) {
    await getClient().set(teamKey(teamId), JSON.stringify(teamState));
  },
};
