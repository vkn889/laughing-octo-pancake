// One-time generator: fetches all 1025 National Dex species from PokeAPI
// and emits src/lib/pokemonNationalDex.ts — placeholder physical-card
// entries (same shape as the hand-curated cards in src/lib/pokemon.ts) for
// every species NOT already covered by a curated card. Run with:
//   node scripts/generate-national-dex.mjs
//
// Rerunning is safe/resumable: raw API responses are cached to
// scripts/.dex-cache.json so a second run only fetches what's missing.

import { writeFile, readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = path.join(__dirname, ".dex-cache.json");
const OUT_PATH = path.join(__dirname, "../src/lib/pokemonNationalDex.ts");

const TOTAL = 1025;
const CONCURRENCY = 20;

// Species already represented by a hand-curated physical card in
// src/lib/pokemon.ts — skip generating a duplicate placeholder for these
// (see AGENTS note in that file for why the curated set is uneven).
const EXCLUDED_SPECIES = new Set([
  "bulbasaur", "charmander", "charmeleon", "charizard",
  "pichu", "pikachu", "raichu",
  "chimchar", "monferno", "infernape",
  "torchic", "combusken", "blaziken",
  "tepig", "pignite", "emboar",
  "snivy", "servine", "serperior",
  "quaxly", "quaxwell", "quaquaval",
  "sprigatito", "floragato", "meowscarada",
  "shinx", "luxio", "luxray",
  "popplio", "primarina",
  "litten", "dartrix",
  "froakie", "frogadier",
  "cyndaquil", "thwackey", "grotle",
  "chespin", "chesnaught",
  "dewott", "samurott",
  "raboot", "cinderace",
  "piplup", "empoleon",
  "ralts", "kirlia", "gardevoir",
  "fennekin", "zoroark", "loudred",
  "beldum", "metang", "metagross",
  "rookidee", "corvisquire", "corviknight",
  "gyarados",
  "ho-oh", "reshiram", "keldeo", "terrakion", "tapu-koko",
  "gouging-fire", "darkrai", "volcanion", "xerneas", "cobalion",
  "regirock", "regidrago", "regieleki", "roaring-moon", "raging-bolt",
  "mew", "mewtwo", "arceus", "dialga", "rayquaza", "lunala",
]);

// Display-name / accepted-answer overrides for species whose PokeAPI slug
// doesn't title-case cleanly (kept hyphens, punctuation, gender symbols).
const NAME_OVERRIDES = {
  "ho-oh": "Ho-Oh",
  "porygon-z": "Porygon-Z",
  "jangmo-o": "Jangmo-o",
  "hakamo-o": "Hakamo-o",
  "kommo-o": "Kommo-o",
  "chi-yu": "Chi-Yu",
  "chien-pao": "Chien-Pao",
  "ting-lu": "Ting-Lu",
  "wo-chien": "Wo-Chien",
  "type-null": "Type: Null",
  "mr-mime": "Mr. Mime",
  "mr-rime": "Mr. Rime",
  "mime-jr": "Mime Jr.",
  "farfetchd": "Farfetch'd",
  "sirfetchd": "Sirfetch'd",
  "nidoran-f": "Nidoran♀",
  "nidoran-m": "Nidoran♂",
  "flabebe": "Flabébé",
};

const EXTRA_ANSWERS = {
  "farfetchd": ["farfetch'd", "farfetchd"],
  "sirfetchd": ["sirfetch'd", "sirfetchd"],
  "nidoran-f": ["nidoran f", "nidoran"],
  "nidoran-m": ["nidoran m", "nidoran"],
  "mr-mime": ["mr mime", "mr. mime"],
  "mr-rime": ["mr rime", "mr. rime"],
  "type-null": ["type null", "type: null"],
  "flabebe": ["flabebe", "flabébé"],
};

function titleCase(slug) {
  if (NAME_OVERRIDES[slug]) return NAME_OVERRIDES[slug];
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function loadCache() {
  try {
    return JSON.parse(await readFile(CACHE_PATH, "utf8"));
  } catch {
    return {};
  }
}

async function saveCache(cache) {
  await writeFile(CACHE_PATH, JSON.stringify(cache));
}

async function fetchJson(url, attempt = 1) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return await res.json();
  } catch (err) {
    if (attempt >= 4) throw err;
    await new Promise((r) => setTimeout(r, 500 * attempt));
    return fetchJson(url, attempt + 1);
  }
}

async function fetchEntry(id, cache) {
  const key = String(id);
  if (cache[key]) return cache[key];
  const [species, pokemon] = await Promise.all([
    fetchJson(`https://pokeapi.co/api/v2/pokemon-species/${id}`),
    fetchJson(`https://pokeapi.co/api/v2/pokemon/${id}`),
  ]);
  const entry = { species, pokemon };
  cache[key] = entry;
  return entry;
}

async function runPool(ids, worker, onProgress) {
  let cursor = 0;
  let done = 0;
  async function next() {
    while (cursor < ids.length) {
      const id = ids[cursor++];
      await worker(id);
      done += 1;
      onProgress?.(done, ids.length);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, next));
}

function buildHintText({ types, genus, dexNumber }) {
  const typeText =
    types.length === 2 ? `${types[0]}/${types[1]} dual-type` : `${types[0]}-type`;
  const padded = String(dexNumber).padStart(4, "0");
  return `${typeText}, the "${genus}." National Dex #${padded}.`;
}

async function main() {
  const cache = await loadCache();
  const ids = Array.from({ length: TOTAL }, (_, i) => i + 1);

  let saveTimer = null;
  await runPool(
    ids,
    async (id) => {
      await fetchEntry(id, cache);
      if (!saveTimer) {
        saveTimer = setTimeout(async () => {
          saveTimer = null;
          await saveCache(cache);
        }, 2000);
      }
    },
    (done, total) => {
      if (done % 50 === 0 || done === total) {
        process.stderr.write(`fetched ${done}/${total}\n`);
      }
    }
  );
  await saveCache(cache);

  const entries = [];
  let placeholderIndex = 0;
  const SPOTS = [
    "Kitchen counter",
    "Living room bookshelf",
    "Bathroom cabinet",
    "Front porch",
    "Backyard tree",
    "Garage workbench",
    "Bedroom closet",
    "Hallway table",
    "Dining room chair",
    "Basement stairs",
    "Laundry room shelf",
    "Mailbox",
    "Under the couch",
    "Windowsill",
    "Coat closet",
  ];

  for (const id of ids) {
    const { species, pokemon } = cache[String(id)];
    const slug = species.name;
    if (EXCLUDED_SPECIES.has(slug)) continue;

    const genusEntry = species.genera.find((g) => g.language.name === "en");
    const genus = genusEntry ? genusEntry.genus : "Pokémon";
    const types = pokemon.types
      .sort((a, b) => a.slot - b.slot)
      .map((t) => t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1));
    const image =
      pokemon.sprites?.other?.["official-artwork"]?.front_default ??
      pokemon.sprites?.front_default ??
      null;
    if (!image) continue; // skip anything with no usable art at all

    const chainMatch = species.evolution_chain?.url?.match(/\/evolution-chain\/(\d+)\//);
    const lineId = chainMatch ? `dex-chain-${chainMatch[1]}` : `dex-${id}`;
    const isBasicStage = species.evolves_from_species === null;
    const rarity = species.is_legendary || species.is_mythical ? "legendary" : "normal";
    const points = rarity === "legendary" ? 15 : 5;

    const displayName = titleCase(slug);
    const acceptedAnswers = Array.from(
      new Set([
        slug.replace(/-/g, " "),
        displayName.toLowerCase(),
        ...(EXTRA_ANSWERS[slug] ?? []),
      ])
    );

    const spot = `${SPOTS[placeholderIndex % SPOTS.length]} (NATIONAL DEX #${id} - EDIT ME)`;
    placeholderIndex += 1;

    entries.push({
      id: `dex-${slug}`,
      name: displayName,
      lineId,
      isBasicStage,
      rarity,
      points,
      hintText: buildHintText({ types, genus, dexNumber: id }),
      image,
      hidingSpot: spot,
      acceptedAnswers,
    });
  }

  const header = `// AUTO-GENERATED by scripts/generate-national-dex.mjs — do not hand-edit.
// Regenerate with: node scripts/generate-national-dex.mjs
//
// One placeholder physical-card entry per National Dex species (1-1025)
// NOT already covered by a hand-curated card in src/lib/pokemon.ts.
// hintText is auto-built from type(s) + genus + dex number (factual,
// non-flavor-text) since hand-writing ~950 unique clues isn't practical.
// Every hidingSpot is a placeholder ("... - EDIT ME") — before using these
// for a real hunt, replace them with real locations, the same way the
// curated cards in pokemon.ts are meant to be edited.
// Artwork is loaded from the public PokeAPI/sprites CDN, not stored
// locally, so these cards need internet access at party time.

import type { PokemonClue } from "./pokemon";

export const NATIONAL_DEX_FILLER: PokemonClue[] = ${JSON.stringify(entries, null, 2)};
`;

  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, header);
  process.stderr.write(`Wrote ${entries.length} entries to ${OUT_PATH}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
