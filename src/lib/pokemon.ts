// Pokémon clue set for the scavenger hunt (PRD 1.7 / SRD 2.2), expanded
// to match an actual physical card collection (hence uneven evolutionary
// lines: some skip a middle stage, some are single cards, some are two
// card variants of the same species — that's intentional, not a bug).
//
// hintText is built from each Pokémon's real Pokédex facts (type,
// classification, canonical traits) in original wording, not the
// verbatim official flavor text (that's Nintendo/Game Freak/The Pokémon
// Company's copyrighted game text) and not invented fluff either. The
// name is never stated outright, so it still works as a guessing clue.
//
// Rarity/points: normal card = 5, legendary/mythical = 15, chase = 100
// (currently just Mega Rayquaza — the flagship card of this round). A
// team's running score is just the sum of points for every card they've
// caught (see computeScore in store.ts) — finding more stages of one
// line adds up naturally (2 stages = 10, 3 stages = 15), no separate
// multiplier logic needed.
//
// isBasicStage drives the clue screen: true shows the classic silhouette
// image; false hides the image entirely and offers a "Play Cry" button
// instead (src/lib/chiptune.ts — an original synthesized sound, not a
// real game cry). Both cases reveal the full-color image once guessed
// correctly.
//
// ⚠️ FIELD-TEST CONTENT: hidingSpot below is a placeholder for testing the
// app end-to-end. Before the real party, edit hidingSpot (host-only
// reference, never shown to players) for your actual venue — with 53
// cards you'll want a real spreadsheet, not just this file, to keep
// track while hiding them.
//
// image is official artwork stored locally in /public/pokemon; the clue
// screen renders it as a black silhouette ("Who's That Pokémon?" style)
// for basic-stage entries only, and always shows it in full color once a
// team guesses correctly.

export type CardRarity = "normal" | "legendary" | "chase";

export type PokemonClue = {
  id: string;
  name: string; // display name, includes card variant e.g. "Charizard (Ex)"
  /** Groups multi-card evolutionary lines together; null for legendaries
   *  (they don't participate in the line-grouping, just flat points). */
  lineId: string | null;
  isBasicStage: boolean;
  rarity: CardRarity;
  points: number;
  hintText: string;
  image: string;
  /** Host-only reference, never sent to player-facing API responses. */
  hidingSpot: string;
  acceptedAnswers: string[];
};

const HIDING_SPOTS = [
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

// Cycled deterministically per entry below so every card gets *a*
// placeholder without hand-writing 53 of them — replace all of these.
let spotIndex = 0;
function nextSpot(): string {
  const spot = `${HIDING_SPOTS[spotIndex % HIDING_SPOTS.length]} (EDIT ME #${spotIndex + 1})`;
  spotIndex += 1;
  return spot;
}

function normal(
  fields: Omit<PokemonClue, "rarity" | "points" | "hidingSpot" | "image"> & { image?: string }
): PokemonClue {
  return {
    ...fields,
    image: fields.image ?? `/pokemon/${fields.id}.png`,
    rarity: "normal",
    points: 5,
    hidingSpot: nextSpot(),
  };
}

function legendary(
  fields: Omit<PokemonClue, "rarity" | "points" | "hidingSpot" | "image" | "lineId" | "isBasicStage"> & {
    image?: string;
  }
): PokemonClue {
  return {
    ...fields,
    lineId: null,
    isBasicStage: false,
    image: fields.image ?? `/pokemon/${fields.id}.png`,
    rarity: "legendary",
    points: 15,
    hidingSpot: nextSpot(),
  };
}

/** The single flagship "chase card" of this round — Mega Rayquaza. */
function chase(
  fields: Omit<PokemonClue, "rarity" | "points" | "hidingSpot" | "image" | "lineId" | "isBasicStage"> & {
    image?: string;
  }
): PokemonClue {
  return {
    ...fields,
    lineId: null,
    isBasicStage: false,
    image: fields.image ?? `/pokemon/${fields.id}.png`,
    rarity: "chase",
    points: 100,
    hidingSpot: nextSpot(),
  };
}

export const POKEMON: PokemonClue[] = [
  // --- Charmander line (Kanto starter) ---
  normal({
    id: "charmander",
    name: "Charmander",
    lineId: "charmander-line",
    isBasicStage: true,
    hintText:
      "Fire-type, the \"Lizard Pokémon.\" A small flame burns at the tip of its tail that never goes out; legend says this Pokémon dies if that flame is ever extinguished.",
    acceptedAnswers: ["charmander"],
  }),
  normal({
    id: "charmeleon",
    name: "Charmeleon",
    lineId: "charmander-line",
    isBasicStage: false,
    hintText:
      "Fire-type, mid-stage of that same Kanto starter line. Quick-tempered, and the flame on its tail burns hotter and more intensely the harder it fights.",
    acceptedAnswers: ["charmeleon"],
  }),
  normal({
    id: "charizard-ex",
    name: "Charizard (Ex)",
    lineId: "charmander-line",
    isBasicStage: false,
    hintText:
      "Fire/Flying dual-type, the \"Flame Pokémon,\" final stage of a Kanto starter line. Breathes fire hot enough to melt boulders and can soar higher than 4,000 feet.",
    acceptedAnswers: ["charizard"],
  }),
  normal({
    id: "mega-charizard-x-ex",
    name: "Mega Charizard X (Ex)",
    lineId: "charmander-line",
    isBasicStage: false,
    hintText:
      "A Mega Evolved form of that same Kanto starter's final stage. Mega Evolution shifts its typing to Dragon, turns its scales blue-black, and makes its flame burn so hot it's invisible.",
    acceptedAnswers: ["mega charizard x", "mega charizard", "charizard x"],
  }),

  // --- Bulbasaur (standalone, Kanto starter) ---
  normal({
    id: "bulbasaur",
    name: "Bulbasaur",
    lineId: "bulbasaur-line",
    isBasicStage: true,
    hintText:
      "Grass/Poison dual-type, the \"Seed Pokémon\" and a Kanto starter. Carries a plant bulb on its back that grows larger the more sunlight it soaks up.",
    acceptedAnswers: ["bulbasaur"],
  }),

  // --- Pichu line ---
  normal({
    id: "pichu",
    name: "Pichu",
    lineId: "pichu-line",
    isBasicStage: true,
    hintText:
      "Electric-type, the pre-evolved form of a very famous mouse Pokémon. Still learning to control its own charge, so its cheeks spark on their own when it's startled.",
    acceptedAnswers: ["pichu"],
  }),
  normal({
    id: "pikachu",
    name: "Pikachu",
    lineId: "pichu-line",
    isBasicStage: false,
    hintText:
      "Electric-type \"Mouse Pokémon.\" Stores electricity in the pouches on its cheeks and releases it in a burst when startled or threatened.",
    acceptedAnswers: ["pikachu"],
  }),
  normal({
    id: "raichu",
    name: "Raichu",
    lineId: "pichu-line",
    isBasicStage: false,
    hintText:
      "Electric-type, final evolution of that same mouse line. Its tail works like a grounding rod, discharging any extra electricity safely into the earth.",
    acceptedAnswers: ["raichu"],
  }),

  // --- Chimchar line (Sinnoh starter) ---
  normal({
    id: "chimchar",
    name: "Chimchar",
    lineId: "chimchar-line",
    isBasicStage: true,
    hintText:
      "Fire-type Sinnoh starter, the \"Chimp Pokémon.\" A flame burns on its rear end that goes out if it ever gets wet, and it grips branches with its tail.",
    acceptedAnswers: ["chimchar"],
  }),
  normal({
    id: "monferno",
    name: "Monferno",
    lineId: "chimchar-line",
    isBasicStage: false,
    hintText:
      "Fire/Fighting dual-type, mid-stage of that Sinnoh starter line. Fights with acrobatic kicks fueled by the flame burning on its tail.",
    acceptedAnswers: ["monferno"],
  }),
  normal({
    id: "infernape",
    name: "Infernape",
    lineId: "chimchar-line",
    isBasicStage: false,
    hintText:
      "Fire/Fighting dual-type, final stage of that Sinnoh starter line. Fire crowns the top of its head like a flame, and it fights using a martial-arts style with all four limbs.",
    acceptedAnswers: ["infernape"],
  }),

  // --- Torchic line (Hoenn starter) ---
  normal({
    id: "torchic",
    name: "Torchic",
    lineId: "torchic-line",
    isBasicStage: true,
    hintText:
      "Fire-type, the \"Chick Pokémon.\" A sac inside its body keeps a flame burning, so it's always warm to the touch, and it's known for bonding closely with its Trainer right from the start.",
    acceptedAnswers: ["torchic"],
  }),
  normal({
    id: "combusken",
    name: "Combusken",
    lineId: "torchic-line",
    isBasicStage: false,
    hintText:
      "Fire/Fighting dual-type, the \"Young Fowl Pokémon.\" Its legs have grown strong enough to keep it running all day without tiring, and its punches can spark with flame.",
    acceptedAnswers: ["combusken"],
  }),
  normal({
    id: "blaziken",
    name: "Blaziken",
    lineId: "torchic-line",
    isBasicStage: false,
    hintText:
      "Fire/Fighting dual-type, the \"Blaze Pokémon,\" the final stage of a Hoenn starter line. Its powerful legs can reportedly clear a 30-story building in a single jump, and fire wreathes its fists mid-punch.",
    acceptedAnswers: ["blaziken"],
  }),

  // --- Tepig line (Unova starter) ---
  normal({
    id: "tepig",
    name: "Tepig",
    lineId: "tepig-line",
    isBasicStage: true,
    hintText:
      "Fire-type Unova starter, the \"Fire Pig Pokémon.\" Roasts berries with fire snorted from its nose before eating them.",
    acceptedAnswers: ["tepig"],
  }),
  normal({
    id: "pignite",
    name: "Pignite",
    lineId: "tepig-line",
    isBasicStage: false,
    hintText:
      "Fire/Fighting dual-type, mid-stage of that Unova line. Roughly doubles in size and power from its previous stage, fueled by fire building in its belly.",
    acceptedAnswers: ["pignite"],
  }),
  normal({
    id: "emboar",
    name: "Emboar",
    lineId: "tepig-line",
    isBasicStage: false,
    hintText:
      "Fire/Fighting dual-type, final stage of that Unova starter line. A blazing chin \"beard\" fuels punches hot enough to scorch an opponent.",
    acceptedAnswers: ["emboar"],
  }),

  // --- Snivy line (Unova starter) ---
  normal({
    id: "snivy",
    name: "Snivy",
    lineId: "snivy-line",
    isBasicStage: true,
    hintText:
      "Grass-type Unova starter, the \"Grass Snake Pokémon.\" Photosynthesizes through its tail and skin, and moves gracefully without making a sound.",
    acceptedAnswers: ["snivy"],
  }),
  normal({
    id: "servine",
    name: "Servine",
    lineId: "snivy-line",
    isBasicStage: false,
    hintText:
      "Grass-type, mid-stage of that Unova line. Whips vines fast enough to kick up a small windstorm around itself.",
    acceptedAnswers: ["servine"],
  }),
  normal({
    id: "serperior",
    name: "Serperior",
    lineId: "snivy-line",
    isBasicStage: false,
    hintText:
      "Grass-type, final stage of that Unova starter line. Its motions look slow and calm, but it can move at blinding speed by precisely controlling its own center of gravity.",
    acceptedAnswers: ["serperior"],
  }),

  // --- Quaxly line (Paldea starter) ---
  normal({
    id: "quaxly",
    name: "Quaxly",
    lineId: "quaxly-line",
    isBasicStage: true,
    hintText:
      "Water-type Paldea starter, the \"Duckling Pokémon.\" Meticulously preens the down on its head into a neat, slicked-back style.",
    acceptedAnswers: ["quaxly"],
  }),
  normal({
    id: "quaxwell",
    name: "Quaxwell",
    lineId: "quaxly-line",
    isBasicStage: false,
    hintText:
      "Water/Fighting dual-type, mid-stage of that Paldea line. Trains its legs constantly by kicking and dancing, and is prized for its footwork.",
    acceptedAnswers: ["quaxwell"],
  }),
  normal({
    id: "quaquaval",
    name: "Quaquaval",
    lineId: "quaxly-line",
    isBasicStage: false,
    hintText:
      "Water/Fighting dual-type, final stage of that Paldea starter line. Performs an intense, spinning dance in battle, kicking up waves with every step.",
    acceptedAnswers: ["quaquaval"],
  }),

  // --- Sprigatito line (Paldea starter) ---
  normal({
    id: "sprigatito",
    name: "Sprigatito",
    lineId: "sprigatito-line",
    isBasicStage: true,
    hintText:
      "Grass-type Paldea starter, the \"Grass Cat Pokémon.\" The sweet scent radiating from its body is said to relax anyone who gets close.",
    acceptedAnswers: ["sprigatito"],
  }),
  normal({
    id: "floragato",
    name: "Floragato",
    lineId: "sprigatito-line",
    isBasicStage: false,
    hintText:
      "Grass-type, mid-stage of that Paldea line. Rubs its head against Trainers it trusts, marking them with scent from nectar coating its head.",
    acceptedAnswers: ["floragato"],
  }),
  normal({
    id: "meowscarada",
    name: "Meowscarada",
    lineId: "sprigatito-line",
    isBasicStage: false,
    hintText:
      "Grass/Dark dual-type, final stage of that Paldea starter line. Wears a magician's-cape-like ruff and can seem to vanish into tall grass.",
    acceptedAnswers: ["meowscarada"],
  }),

  // --- Shinx line ---
  normal({
    id: "shinx",
    name: "Shinx",
    lineId: "shinx-line",
    isBasicStage: true,
    hintText:
      "Electric-type, the \"Flash Pokémon.\" Its fur glows brighter the more electricity it builds up inside its body.",
    acceptedAnswers: ["shinx"],
  }),
  normal({
    id: "luxio",
    name: "Luxio",
    lineId: "shinx-line",
    isBasicStage: false,
    hintText:
      "Electric-type, mid-stage of that line. Its claws crackle with electricity strong enough to leave an opponent's whole body numb.",
    acceptedAnswers: ["luxio"],
  }),
  normal({
    id: "luxray",
    name: "Luxray",
    lineId: "shinx-line",
    isBasicStage: false,
    hintText:
      "Electric-type, final stage of that same line. Said to see through walls and darkness by sensing the aura of everything around it.",
    acceptedAnswers: ["luxray"],
  }),

  // --- Popplio line (Alola starter, missing middle stage) ---
  normal({
    id: "popplio",
    name: "Popplio",
    lineId: "popplio-line",
    isBasicStage: true,
    hintText:
      "Water-type Alola starter, the \"Sea Lion Pokémon.\" Blows bubbles from its nose that get bouncier the more it practices.",
    acceptedAnswers: ["popplio"],
  }),
  normal({
    id: "primarina",
    name: "Primarina",
    lineId: "popplio-line",
    isBasicStage: false,
    hintText:
      "Water/Fairy dual-type, final stage of that Alola starter line. Sings and dances to control balloon-like bubbles that can burst with real force.",
    acceptedAnswers: ["primarina"],
  }),

  // --- Litten (standalone, Alola starter) ---
  normal({
    id: "litten",
    name: "Litten",
    lineId: "litten-line",
    isBasicStage: true,
    hintText:
      "Fire-type Alola starter, the \"Fire Cat Pokémon.\" Grooms itself constantly, and the fur it swallows while doing so fuels the fire in its stomach.",
    acceptedAnswers: ["litten"],
  }),

  // --- Dartrix (standalone, mid-stage of a different Alola starter) ---
  normal({
    id: "dartrix",
    name: "Dartrix",
    lineId: "dartrix-line",
    isBasicStage: false,
    hintText:
      "Grass/Flying dual-type, mid-stage of an Alola starter line. Preens its feathers into razor-sharp blades that it flings at opponents.",
    acceptedAnswers: ["dartrix"],
  }),

  // --- Froakie line (Kalos starter, final stage removed) ---
  normal({
    id: "froakie",
    name: "Froakie",
    lineId: "froakie-line",
    isBasicStage: true,
    hintText:
      "Water-type Kalos starter, the \"Bubble Frog Pokémon.\" Bubbles covering its chest and back cushion impacts, so it barely feels a fall or a hit.",
    acceptedAnswers: ["froakie"],
  }),
  normal({
    id: "frogadier",
    name: "Frogadier",
    lineId: "froakie-line",
    isBasicStage: false,
    hintText:
      "Water-type, the middle stage of that Kalos starter line. Famous for pinpoint accuracy flinging foam-coated pebbles, and agile enough to scale walls with ease.",
    acceptedAnswers: ["frogadier"],
  }),

  // --- Cyndaquil (standalone, Johto starter) ---
  normal({
    id: "cyndaquil",
    name: "Cyndaquil",
    lineId: "cyndaquil-line",
    isBasicStage: true,
    hintText:
      "Fire-type Johto starter, the \"Fire Mouse Pokémon.\" Flames burst from its back when it's scared or excited; it's not very good at aiming them yet.",
    acceptedAnswers: ["cyndaquil"],
  }),

  // --- Thwackey (standalone, mid-stage of a Galar starter) ---
  normal({
    id: "thwackey",
    name: "Thwackey",
    lineId: "thwackey-line",
    isBasicStage: false,
    hintText:
      "Grass-type, mid-stage of a Galar starter line. Drums out its own beat on a pair of sticks, and the rhythm is said to lift its allies' mood in battle.",
    acceptedAnswers: ["thwackey"],
  }),

  // --- Grotle (standalone, mid-stage of a Sinnoh starter) ---
  normal({
    id: "grotle",
    name: "Grotle",
    lineId: "grotle-line",
    isBasicStage: false,
    hintText:
      "Grass-type, mid-stage of a Sinnoh starter line. Slow-moving, with a garden's worth of trees growing on its shell that shelter smaller Pokémon.",
    acceptedAnswers: ["grotle"],
  }),

  // --- Chespin line (Kalos starter, missing middle stage) ---
  normal({
    id: "chespin",
    name: "Chespin",
    lineId: "chespin-line",
    isBasicStage: true,
    hintText:
      "Grass-type Kalos starter, the \"Spiny Nut Pokémon.\" Its quills are soft, but the shell covering its head is hard enough to shrug off a direct hit.",
    acceptedAnswers: ["chespin"],
  }),
  normal({
    id: "chesnaught",
    name: "Chesnaught",
    lineId: "chespin-line",
    isBasicStage: false,
    hintText:
      "Grass/Fighting dual-type, final stage of that Kalos starter line. Interlocks the spines on its arms into a shield tough enough to block a cannonball.",
    acceptedAnswers: ["chesnaught"],
  }),

  // --- Oshawott line (Unova starter, basic stage not in this collection) ---
  normal({
    id: "dewott-illustration-rare",
    name: "Dewott (Illustration Rare)",
    lineId: "oshawott-line",
    isBasicStage: false,
    hintText:
      "Water-type, mid-stage of a Unova starter line. Trains daily with a pair of scalchops, practicing sword techniques.",
    acceptedAnswers: ["dewott"],
  }),
  normal({
    id: "samurott",
    name: "Samurott",
    lineId: "oshawott-line",
    isBasicStage: false,
    hintText:
      "Water-type, final stage of that same Unova starter line. Draws seamitars made of solidified water from the fur on its forelegs.",
    acceptedAnswers: ["samurott"],
  }),

  // --- Raboot line (Galar starter, basic stage not in this collection) ---
  normal({
    id: "raboot",
    name: "Raboot",
    lineId: "raboot-line",
    isBasicStage: false,
    hintText:
      "Fire-type, mid-stage of a Galar starter line. Kicks loose embers from the fur on its legs, leaving scorch marks wherever it runs.",
    acceptedAnswers: ["raboot"],
  }),
  normal({
    id: "cinderace",
    name: "Cinderace",
    lineId: "raboot-line",
    isBasicStage: false,
    hintText:
      "Fire-type, final stage of that Galar starter line. Compresses fire into a single blazing kick, aimed with soccer-star precision.",
    acceptedAnswers: ["cinderace"],
  }),

  // --- Piplup line (Sinnoh starter, missing middle stage) ---
  normal({
    id: "piplup",
    name: "Piplup",
    lineId: "piplup-line",
    isBasicStage: true,
    hintText:
      "Water-type Sinnoh starter, the \"Penguin Pokémon.\" Proud and stubborn, it refuses to be fed and hates accepting help from its Trainer early on.",
    acceptedAnswers: ["piplup"],
  }),
  normal({
    id: "empoleon",
    name: "Empoleon",
    lineId: "piplup-line",
    isBasicStage: false,
    hintText:
      "Water/Steel dual-type, final stage of that Sinnoh starter line. Its steel, trident-shaped beak is sharp enough to slice through drift ice.",
    acceptedAnswers: ["empoleon"],
  }),

  // --- Ralts line ---
  normal({
    id: "ralts",
    name: "Ralts",
    lineId: "ralts-line",
    isBasicStage: true,
    hintText:
      "Psychic/Fairy dual-type, the \"Feeling Pokémon.\" Senses the emotions of everyone nearby through the horns on its head, and hides the moment it feels hostility.",
    acceptedAnswers: ["ralts"],
  }),
  normal({
    id: "kirlia",
    name: "Kirlia",
    lineId: "ralts-line",
    isBasicStage: false,
    hintText:
      "Psychic/Fairy dual-type, mid-stage of that line. Said to dance and spin whenever its Trainer is happy.",
    acceptedAnswers: ["kirlia"],
  }),
  normal({
    id: "gardevoir-ex",
    name: "Gardevoir (Ex)",
    lineId: "ralts-line",
    isBasicStage: false,
    hintText:
      "Psychic/Fairy dual-type, final stage of that same line. Said to be able to glimpse the future, and to bend space itself to shield its Trainer from harm.",
    acceptedAnswers: ["gardevoir"],
  }),

  // --- Fennekin (standalone, Kalos starter) ---
  normal({
    id: "fennekin",
    name: "Fennekin",
    lineId: "fennekin-line",
    isBasicStage: true,
    hintText:
      "Fire-type Kalos starter, the \"Fox Pokémon.\" Snacks on twigs, and the heat radiating from its flame rises whenever it gets angry.",
    acceptedAnswers: ["fennekin"],
  }),

  // --- Zoroark (standalone, final stage of an illusion-casting line) ---
  normal({
    id: "zoroark",
    name: "Zoroark",
    lineId: "zoroark-line",
    isBasicStage: false,
    hintText:
      "Dark-type, final stage of an illusion-casting line. Conjures convincing illusions of people and Pokémon to protect its den from intruders.",
    acceptedAnswers: ["zoroark"],
  }),

  // --- Loudred (standalone, mid-stage of a Hoenn line) ---
  normal({
    id: "loudred",
    name: "Loudred",
    lineId: "loudred-line",
    isBasicStage: false,
    hintText:
      "Normal-type, mid-stage of a Hoenn line. The orifices covering its body amplify its voice into a roar loud enough to be heard over a mile away.",
    acceptedAnswers: ["loudred"],
  }),

  // --- Beldum line (full 3-stage) ---
  normal({
    id: "beldum",
    name: "Beldum",
    lineId: "beldum-line",
    isBasicStage: true,
    hintText:
      "Steel/Psychic dual-type, the \"Iron Ball Pokémon.\" Its whole body works like a magnet, and it hovers by generating a weak magnetic field.",
    acceptedAnswers: ["beldum"],
  }),
  normal({
    id: "metang",
    name: "Metang",
    lineId: "beldum-line",
    isBasicStage: false,
    hintText:
      "Steel/Psychic dual-type, mid-stage of that line, formed when a pair of the previous stage fuse magnetically into one body.",
    acceptedAnswers: ["metang"],
  }),
  normal({
    id: "metagross",
    name: "Metagross",
    lineId: "beldum-line",
    isBasicStage: false,
    hintText:
      "Steel/Psychic dual-type, final stage of that line, formed by a pair of the previous stage fusing together. Its brain is said to out-calculate a supercomputer.",
    acceptedAnswers: ["metagross"],
  }),

  // --- Rookidee line (full 3-stage) ---
  normal({
    id: "rookidee",
    name: "Rookidee",
    lineId: "rookidee-line",
    isBasicStage: true,
    hintText:
      "Flying-type, the \"Tiny Bird Pokémon,\" basic stage of a Galar line. Small but fearless, willing to challenge opponents many times its size.",
    acceptedAnswers: ["rookidee"],
  }),
  normal({
    id: "corvisquire",
    name: "Corvisquire",
    lineId: "rookidee-line",
    isBasicStage: false,
    hintText:
      "Flying-type, mid-stage of that Galar line. Fiercely territorial, driving off intruders by pelting them with pebbles from above.",
    acceptedAnswers: ["corvisquire"],
  }),
  normal({
    id: "corviknight",
    name: "Corviknight",
    lineId: "rookidee-line",
    isBasicStage: false,
    hintText:
      "Flying/Steel dual-type, final stage of that Galar line. Its body is armored enough, and its wings strong enough, that it's used as an informal taxi service back home.",
    acceptedAnswers: ["corviknight"],
  }),

  // --- Gyarados (standalone, dramatic evolution of a much calmer fish) ---
  normal({
    id: "gyarados",
    name: "Gyarados",
    lineId: "gyarados-line",
    isBasicStage: false,
    hintText:
      "Water/Flying dual-type, famous for an explosive temper, once described in old records as capable of leveling a whole village in a rage.",
    acceptedAnswers: ["gyarados"],
  }),

  // --- Legendaries / Mythicals (15 pts, no evolutionary line grouping) ---
  legendary({
    id: "ho-oh",
    name: "Ho-Oh (Reverse Holo)",
    hintText:
      "Fire/Flying Legendary, the \"Rainbow Pokémon.\" Said to bring lasting happiness to whoever sees it, with wings said to hold every color there is.",
    acceptedAnswers: ["ho-oh", "ho oh", "hooh"],
  }),
  legendary({
    id: "reshiram",
    name: "Reshiram",
    hintText:
      "Dragon/Fire Legendary, said to scorch the world in fire in the name of its ideals, one half of a duo bound to an old hero's legend.",
    acceptedAnswers: ["reshiram"],
  }),
  legendary({
    id: "keldeo-ex",
    name: "Keldeo (EX)",
    hintText:
      "Water-type Mythical, one of a quartet of sword-wielding Legendaries. Trains under a waterfall to sharpen the horn on its head into a blade.",
    acceptedAnswers: ["keldeo"],
  }),
  legendary({
    id: "terrakion",
    name: "Terrakion",
    hintText:
      "Rock/Fighting Legendary, another of that same sword-wielding quartet. Charges through anything in its path, said to be strong enough to topple a castle wall.",
    acceptedAnswers: ["terrakion"],
  }),
  legendary({
    id: "tapu-koko",
    name: "Tapu Koko",
    hintText:
      "Electric/Fairy Legendary, guardian deity of one of the Alola islands. Vanishes in a flash of lightning the instant a fight is over.",
    acceptedAnswers: ["tapu koko", "tapu-koko"],
  }),
  legendary({
    id: "gouging-fire",
    name: "Gouging Fire",
    hintText:
      "Fire/Dragon-type, an ancient species with paradoxical traits, pulled forward through time from a distant past. Burning gases spill constantly from vents along its body.",
    acceptedAnswers: ["gouging fire"],
  }),
  legendary({
    id: "darkrai",
    name: "Darkrai",
    hintText:
      "Dark-type Mythical, said to lure people and Pokémon into deep, nightmare-filled sleep just by appearing nearby.",
    acceptedAnswers: ["darkrai"],
  }),
  legendary({
    id: "volcanion-ex",
    name: "Volcanion (Ex)",
    hintText:
      "Fire/Water dual-type Mythical, blasts scalding steam from the vents on its back with enough force to blow a mountain apart.",
    acceptedAnswers: ["volcanion"],
  }),
  legendary({
    id: "xerneas-ex",
    name: "Xerneas (EX)",
    hintText:
      "Fairy-type Legendary, said to be able to share eternal life, its antlers glowing every color of the rainbow while active.",
    acceptedAnswers: ["xerneas"],
  }),
  legendary({
    id: "cobalion",
    name: "Cobalion",
    hintText:
      "Steel/Fighting Legendary, leader of that same sword-wielding quartet. Said to have led an army of Pokémon to shield others from a war long ago.",
    acceptedAnswers: ["cobalion"],
  }),
  legendary({
    id: "regirock-ex",
    name: "Regirock (Ex)",
    hintText:
      "Rock-type Legendary, its entire body assembled from stones gathered at the site where it was born, said to repair itself using rocks from that same place.",
    acceptedAnswers: ["regirock"],
  }),
  legendary({
    id: "regidrago-vstar",
    name: "Regidrago (Vstar)",
    hintText:
      "Dragon-type Legendary, its body formed from solidified draconic energy rather than any known material.",
    acceptedAnswers: ["regidrago"],
  }),
  legendary({
    id: "regieleki-v",
    name: "Regieleki (V)",
    hintText:
      "Electric-type Legendary, said to be the fastest of all Pokémon, discharging enough electricity to black out an entire town.",
    acceptedAnswers: ["regieleki"],
  }),
  legendary({
    id: "roaring-moon-ex",
    name: "Roaring Moon (Ex)",
    hintText:
      "Dragon/Dark-type, an ancient species with paradoxical traits, pulled forward through time from a distant past. Its roar is said to carry to the next mountain over.",
    acceptedAnswers: ["roaring moon"],
  }),
  legendary({
    id: "raging-bolt-ex",
    name: "Raging Bolt (Ex)",
    hintText:
      "Electric/Dragon-type, an ancient species with paradoxical traits, pulled forward through time from a distant past. Trails crackling electricity behind it as it moves.",
    acceptedAnswers: ["raging bolt"],
  }),
  legendary({
    id: "mew-vmax",
    name: "Mew (Vmax)",
    hintText:
      "Psychic-type Mythical, said to carry the genetic code of every Pokémon within its body and to be the ancestor many species eventually descended from.",
    acceptedAnswers: ["mew"],
  }),
  legendary({
    id: "mewtwo",
    name: "Mewtwo",
    hintText:
      "Psychic-type Legendary, created through genetic manipulation of that Mythical's DNA in a lab, engineered to become the most powerful Pokémon.",
    acceptedAnswers: ["mewtwo"],
  }),
  legendary({
    id: "mewtwo-xy",
    name: "Mewtwo (XY Evolutions)",
    hintText:
      "The same lab-engineered Psychic-type Legendary as another card in this hunt, this one capable of Mega Evolving into two very different forms.",
    acceptedAnswers: ["mewtwo"],
  }),
  legendary({
    id: "arceus-vstar",
    name: "Arceus (VStar)",
    hintText:
      "Normal-type Mythical said to have shaped the universe itself, sometimes called \"The Original One.\"",
    acceptedAnswers: ["arceus"],
  }),
  legendary({
    id: "dialga",
    name: "Dialga",
    hintText:
      "Steel/Dragon Legendary said to control the flow of time itself, with a body said to resemble a diamond.",
    acceptedAnswers: ["dialga"],
  }),

  // --- Chase card (100 pts, the flagship pull of this round) ---
  chase({
    id: "mega-rayquaza",
    name: "Mega Rayquaza",
    hintText:
      "Dragon/Flying Legendary, said to have lived for hundreds of millions of years in the ozone layer. Mega Evolves without a stone, through sheer force of will alone, into a form with no visible limbs at all, just an endless coiled body.",
    acceptedAnswers: ["mega rayquaza", "rayquaza"],
  }),
  chase({
    id: "mega-charizard-x-chase",
    name: "Mega Charizard X (Ex) (Chase Print)",
    image: "/pokemon/mega-charizard-x-ex.png",
    hintText:
      "A second copy of the Mega Evolved form of a Kanto starter's final stage, Dragon-typed and blue-black, its flame burning hot enough to be invisible against a night sky. This one's a special pull.",
    acceptedAnswers: ["mega charizard x", "mega charizard", "charizard x"],
  }),
  chase({
    id: "lunala-rainbow-rare-gx",
    name: "Lunala (Rainbow Rare GX)",
    hintText:
      "Psychic/Ghost Legendary, said to be able to travel between dimensions by tearing open a wormhole with the crescent shape on its chest.",
    acceptedAnswers: ["lunala"],
  }),
];

export const POKEMON_BY_ID: Record<string, PokemonClue> = Object.fromEntries(
  POKEMON.map((p) => [p.id, p])
);
