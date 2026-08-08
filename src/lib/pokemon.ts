// Pokémon clue set for the scavenger hunt (PRD 1.7 / SRD 2.2).
//
// ⚠️ FIELD-TEST CONTENT: hintText and hidingSpot below are placeholders
// written for testing the app end-to-end. Before the real party, edit
// hintText (riddle-style, never say the name) and hidingSpot (host-only
// reference, never shown to players) for your actual venue.
//
// image is the official artwork stored locally in /public/pokemon — the
// clue screen renders it as a black silhouette ("Who's That Pokémon?"
// style) so it hints at the shape without giving away colors/name.

export type PokemonClue = {
  id: string;
  name: string;
  hintText: string;
  image: string;
  /** Host-only reference — never sent to player-facing API responses. */
  hidingSpot: string;
  acceptedAnswers: string[];
};

export const POKEMON: PokemonClue[] = [
  {
    id: "torchic",
    name: "Torchic",
    hintText:
      "I'm a round little chick with a flame not yet ablaze. Peck around the kitchen — you might find my hiding place.",
    image: "/pokemon/torchic.png",
    hidingSpot: "Kitchen counter, behind the fruit bowl",
    acceptedAnswers: ["torchic"],
  },
  {
    id: "combusken",
    name: "Combusken",
    hintText:
      "I've grown legs for kicking, my feathers turning red. My chick days are behind me — fire's in my head.",
    image: "/pokemon/combusken.png",
    hidingSpot: "Living room, under the couch cushions",
    acceptedAnswers: ["combusken"],
  },
  {
    id: "blaziken",
    name: "Blaziken",
    hintText:
      "Flame-kissed fists, standing tall, ready for a fight. My final form burns brightest — find me before night.",
    image: "/pokemon/blaziken.png",
    hidingSpot: "Backyard, tied to the tree",
    acceptedAnswers: ["blaziken"],
  },
  {
    id: "rayquaza",
    name: "Rayquaza",
    hintText:
      "I coil through the sky where the ozone layer breaks. No wings, no fins — just endless emerald scales.",
    image: "/pokemon/rayquaza.png",
    hidingSpot: "Bookshelf, top shelf",
    acceptedAnswers: ["rayquaza"],
  },
  {
    id: "froakie",
    name: "Froakie",
    hintText:
      "Bubbles cling to my back like a frothy little coat. I'm small and I'm quick — frogs like me don't float, we hop.",
    image: "/pokemon/froakie.png",
    hidingSpot: "Bathroom, behind the sink",
    acceptedAnswers: ["froakie"],
  },
  {
    id: "frogadier",
    name: "Frogadier",
    hintText:
      "My aim is deadly with pebbles thrown at speed. Blue and white, mid-leap — between tadpole and the final creed.",
    image: "/pokemon/frogadier.png",
    hidingSpot: "Front porch mailbox",
    acceptedAnswers: ["frogadier"],
  },
  {
    id: "greninja",
    name: "Greninja",
    hintText:
      "Silent as water, quick as a falling star. Ninjas wish they moved like me — striking from afar.",
    image: "/pokemon/greninja.png",
    hidingSpot: "Garage, on the workbench",
    acceptedAnswers: ["greninja"],
  },
];

export const POKEMON_BY_ID: Record<string, PokemonClue> = Object.fromEntries(
  POKEMON.map((p) => [p.id, p])
);
