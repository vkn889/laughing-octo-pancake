# Who's That Pokémon? — Scavenger Hunt

A mobile-first, Pokédex-themed "Who's That Pokémon?" scavenger hunt for a
birthday party. Built from the PRD/SRD in `pokemon-scavenger-hunt-prd-srd.md`.

**Field-test roster (7 Pokémon):** Torchic → Combusken → Blaziken,
Rayquaza, Froakie → Frogadier → Greninja.

## How it works

- 7 fixed teams (Team Red / Blue / Yellow / Green / Orange / Purple / Pink)
  each claim a spot on `/` from their own phone.
- Each team gets a random order of the 7 Pokémon, one clue at a time. A
  correct guess (typo-tolerant) locks them into "bring the card to the
  host" until the host taps **Confirm** for that team on `/host`.
- All state lives in one JSON file on the machine running the server
  (`data/state.json`, auto-created, gitignored) — no external database, no
  accounts. Every screen polls that shared state every ~2s, so progress
  survives a phone refresh or backgrounding.

## Running it for the party

This app needs to stay running as **one continuous process** for the whole
event (state lives in server memory/disk, not in a database), and your
phones need to reach it over the network. Simplest option: run it on your
laptop and have everyone join over the same WiFi.

```bash
npm install
npm run build
npm run start        # runs on port 3000 by default
```

Then find your laptop's LAN IP:

```bash
# macOS
ipconfig getifaddr en0    # or en1 if you're on Wi-Fi via a different adapter
```

Share `http://<that-ip>:3000` — the QR code on `/host` already encodes
whatever origin you loaded it from, so open `http://<that-ip>:3000/host` on
the host device (not `localhost`) and the printed QR will point phones to
the right address.

> Make sure your laptop's firewall allows incoming connections on the port,
> and that phones are on the *same* WiFi network (guest networks that
> isolate clients from each other won't work).

Alternatively, run `npm run dev` for local testing on one machine only —
fine for the walkthrough below, but `next start` is the one you want live.

## Before the real party — edit the content

Everything content-related lives in two files, no code changes needed:

- **`src/lib/pokemon.ts`** — for each of the 7 Pokémon: `hintText` (riddle,
  never say the name), `hidingSpot` (host-only reference, shown only on
  `/host`), and `acceptedAnswers`. The current hints are **placeholders**
  written for testing — swap them for your real riddles and hiding spots.
- **`src/lib/teams.ts`** — team names/colors if you want something other
  than the 7 color names.

Hint images are the official artwork in `public/pokemon/*.png`, rendered as
a black silhouette on the clue screen (classic "Who's That Pokémon?"
look) so they hint at shape without spoiling color/name.

## Testing without a full party

- `/host` has a **Reset All** button (with a confirm step) that wipes every
  team back to unclaimed so you can replay the whole hunt solo.
- Open `/` in one tab per "team" (or use incognito windows) and `/host` in
  another to run through the flow yourself.

## Stack

Next.js App Router + TypeScript + Tailwind v4. Route Handlers under
`src/app/api/**` are the "backend"; `src/lib/store.ts` is the file-backed
shared store with an in-process mutex (first write wins on simultaneous
team claims). No external services required.
