// Pokémon clue set for the scavenger hunt (PRD 1.7 / SRD 2.2).
//
// hintText is built from each Pokémon's real Pokédex facts (type,
// classification, canonical traits) in original wording, not the
// verbatim official flavor text (that's Nintendo/Game Freak/The Pokémon
// Company's copyrighted game text, not something to embed wholesale into
// a shipped app) and not invented fluff either. The name is never stated
// outright, so it still works as a guessing clue.
//
// ⚠️ FIELD-TEST CONTENT: hidingSpot below is a placeholder for testing the
// app end-to-end. Before the real party, edit hidingSpot (host-only
// reference, never shown to players) for your actual venue.
//
// image is the official artwork stored locally in /public/pokemon; the
// clue screen renders it as a black silhouette ("Who's That Pokémon?"
// style) so it hints at the shape without giving away colors/name.

export type PokemonClue = {
  id: string;
  name: string;
  hintText: string;
  image: string;
  /** Host-only reference, never sent to player-facing API responses. */
  hidingSpot: string;
  acceptedAnswers: string[];
};

export const POKEMON: PokemonClue[] = [
  {
    id: "torchic",
    name: "Torchic",
    hintText:
      "Fire-type, the \"Chick Pokémon.\" A sac inside its body keeps a flame burning, so it's always warm to the touch, and it's known for bonding closely with its Trainer right from the start.",
    image: "/pokemon/torchic.png",
    hidingSpot: "Kitchen counter, behind the fruit bowl",
    acceptedAnswers: ["torchic"],
  },
  {
    id: "combusken",
    name: "Combusken",
    hintText:
      "Fire/Fighting dual-type, the \"Young Fowl Pokémon.\" Its legs have grown strong enough to keep it running all day without tiring, and its punches can spark with flame.",
    image: "/pokemon/combusken.png",
    hidingSpot: "Living room, under the couch cushions",
    acceptedAnswers: ["combusken"],
  },
  {
    id: "blaziken",
    name: "Blaziken",
    hintText:
      "Fire/Fighting dual-type, the \"Blaze Pokémon,\" the final stage of a Hoenn starter line. Its powerful legs can reportedly clear a 30-story building in a single jump, and fire wreathes its fists mid-punch.",
    image: "/pokemon/blaziken.png",
    hidingSpot: "Backyard, tied to the tree",
    acceptedAnswers: ["blaziken"],
  },
  {
    id: "rayquaza",
    name: "Rayquaza",
    hintText:
      "Dragon/Flying Legendary, the \"Sky High Pokémon.\" Said to have lived for hundreds of millions of years high in the ozone layer, it's the one that calmed the fight between Hoenn's other two Legendaries.",
    image: "/pokemon/rayquaza.png",
    hidingSpot: "Bookshelf, top shelf",
    acceptedAnswers: ["rayquaza"],
  },
  {
    id: "froakie",
    name: "Froakie",
    hintText:
      "Water-type Kalos starter, the \"Bubble Frog Pokémon.\" Bubbles covering its chest and back cushion impacts, so it barely feels a fall or a hit.",
    image: "/pokemon/froakie.png",
    hidingSpot: "Bathroom, behind the sink",
    acceptedAnswers: ["froakie"],
  },
  {
    id: "frogadier",
    name: "Frogadier",
    hintText:
      "Water-type, the middle stage of a Kalos starter line. Famous for pinpoint accuracy, flinging foam-coated pebbles at distant targets, and agile enough to scale walls with ease.",
    image: "/pokemon/frogadier.png",
    hidingSpot: "Front porch mailbox",
    acceptedAnswers: ["frogadier"],
  },
  {
    id: "greninja",
    name: "Greninja",
    hintText:
      "Water/Dark dual-type, the \"Ninja Pokémon,\" the final evolution of a Kalos starter line. It compresses water into throwing stars, moves faster than the eye can follow, and wears its long tongue like a scarf.",
    image: "/pokemon/greninja.png",
    hidingSpot: "Garage, on the workbench",
    acceptedAnswers: ["greninja"],
  },
];

export const POKEMON_BY_ID: Record<string, PokemonClue> = Object.fromEntries(
  POKEMON.map((p) => [p.id, p])
);
