# Who's That Pokémon? Scavenger Hunt

A mobile-first, Pokédex-themed "Who's That Pokémon?" scavenger hunt for a
birthday party. Built from the PRD/SRD in `pokemon-scavenger-hunt-prd-srd.md`.

**Current roster: 53 cards**, matching an actual physical card collection
(hence uneven evolutionary lines — some skip a stage, some are one card,
Mewtwo appears as two separate card variants). See `src/lib/pokemon.ts`
for the full list. Rayquaza (planned as a 100-point card) isn't in yet.

> With 7 teams sharing one 53-card pool (see below), the hunt ends itself
> once the pool runs out — no need to set a time limit. How many cards
> each team ends up with depends on how the draws fall, not a fixed split.

## How it works

- 7 fixed teams (Team Alpha / Magma / Aqua / Ball / Pegasus / Touch / Doom)
  each claim a spot on `/` from their own phone.
- **Shared card pool, not a fixed order per team:** there's one physical
  copy of each of the 53 cards, so once any team catches one, it's gone
  for everyone else. Each team is dynamically assigned a random
  still-available card, one at a time; the moment any team confirms a
  catch, every other team's pool of *possible* next cards shrinks by one.
  If a team happens to be actively chasing a card another team catches
  first, they get swapped onto a fresh one automatically, typically
  within one poll cycle (~2s) — see `pickNextCard`/`reconcileTeam` in
  `src/lib/store.ts` if you want the mechanics. A team is "finished" once
  the shared pool has nothing left to assign them, not when they've
  personally caught all 53 (with 7 teams pulling from one pool, nobody
  will).
- A correct guess (typo-tolerant) locks a team into "bring the card to
  the host" until the host taps **Confirm** for that team on `/host`.
- **Rarity & scoring:** each card is worth 5 points ("normal") or 15
  ("legendary" — Mew, Mewtwo x2, Arceus, Dialga for now). A team's score
  is just the sum of points for everything they've caught; finding more
  stages of one line adds up on its own (2 stages = 10, a complete line =
  15), no separate bonus logic. Shown on the clue screen, the reveal
  screen, and as a live-sorted leaderboard on `/host`.
- **Silhouette vs. cry:** only basic-stage cards (the first form of a
  line, e.g. Charmander, Bulbasaur, Torchic) show the black silhouette
  hint image. Every other card (evolved forms, legendaries) shows no
  image during guessing — just a "Play Cry" button — and reveals in full
  color only once guessed correctly, on the "bring it to the host"
  screen.
- **Audio:** a music toggle (🔊/🔇) and all sound effects are original,
  synthesized in-browser at runtime via the Web Audio API
  (`src/lib/chiptune.ts`) — a reveal chime, a wrong-guess blip, the
  "Play Cry" button, and a background loop. None of it is real Pokémon
  game audio: that's copyrighted Nintendo/Game Freak/Creatures material,
  not something to source and embed. If you want the actual games' music
  or cries, that's audio you'd need to add yourself from something you
  own the rights to use — drop files in `public/audio/` and wire them
  into `src/lib/chiptune.ts`'s callers.
- All state is shared, key-value storage read/written through
  `src/lib/store.ts`, which is backend-agnostic: it goes through whichever
  storage backend is active (`src/lib/storage/index.ts`), so the same code
  runs locally and on Vercel.

## Two ways to run it

### Option A: Local, for one laptop at the party

No setup, no accounts. State lives in a JSON file
(`data/state.json`, auto-created, gitignored) on whatever machine runs the
process.

```bash
npm install
npm run build
npm run start        # runs on port 3000 by default
```

Find your laptop's LAN IP and share `http://<that-ip>:3000` with players:

```bash
# macOS
ipconfig getifaddr en0    # or en1 if you're on Wi-Fi via a different adapter
```

Open `http://<that-ip>:3000/host` (not `localhost`) on the host device;
the QR code there encodes whatever origin you loaded it from, so it'll
point phones at the right address.

> This mode needs the app to stay running as **one continuous process**
> for the whole event, and every phone on the **same** WiFi network (guest
> networks that isolate clients from each other won't work). `npm run dev`
> works too, for testing on one machine.

### Option B: Deploy to Vercel (a real, always-on URL)

Vercel's functions are stateless and don't share a filesystem across
invocations, so the JSON file above only works for Option A. On Vercel,
the app automatically switches to a Supabase-backed store instead.

This is already wired up and live:

- A dedicated Supabase project (`pokemon-scavenger-hunt`, org `vkn889's
  Org`) has been created and migrated, see
  `supabase/migrations/20260807221900_create_teams_table.sql` for the
  schema (a `teams` table, seeded with the 7-team roster, with Row Level
  Security scoping the app's anon key to read/update only).
- This repo's `origin` remote (`github.com/vkn889/laughing-octo-pancake`)
  is connected to a Vercel project via its GitHub integration, which
  auto-deploys on every push. `git push` is all that's needed.
- `.env.production` (committed, not gitignored) carries `SUPABASE_URL`
  and the Supabase **anon/publishable** key, so the Vercel build picks up
  Supabase config with no manual dashboard step. This is intentional, not
  an oversight: the anon key is meant to be public (it's what client-side
  Supabase apps ship in their JS bundle everywhere) and is safe to expose
  because Row Level Security is what actually gates access, not key
  secrecy, see the RLS policies in the migration above. The
  `service_role` key (which *would* need to stay secret) is never used
  anywhere in this app.

Setting up your own Supabase project from scratch, or preferring Vercel's
dashboard env vars over the committed file? Run the migration SQL in
`supabase/migrations/20260807221900_create_teams_table.sql` against your
project (SQL Editor, or `supabase db push`), then either set
`SUPABASE_URL`/`SUPABASE_ANON_KEY` in **Settings -> Environment
Variables** (which takes precedence over `.env.production`) or edit that
file directly.

## Before the real party, edit the content

Everything content-related lives in two files, no code changes needed:

- **`src/lib/pokemon.ts`**: for each of the 53 cards, `hintText` (never
  says the name), `hidingSpot` (host-only reference, shown only on
  `/host`, currently placeholders like "Kitchen counter (EDIT ME #3)"),
  and `acceptedAnswers`. With 53 hiding spots you'll want a real
  spreadsheet while you're physically hiding cards, not just this file.
  `points`/`rarity`/`isBasicStage`/`lineId` drive the scoring and
  silhouette-vs-cry behavior described above; edit them if your actual
  card collection differs from what's modeled here.
- **`src/lib/teams.ts`**: team names/colors if you want something other
  than Alpha/Magma/Aqua/Ball/Pegasus/Touch/Doom.

Hint images are official artwork in `public/pokemon/*.png`, shown as a
black silhouette (classic "Who's That Pokémon?" look) for basic-stage
cards only, and in full color for every card once guessed correctly.

## Testing without a full party

- `/host` has a **Reset All** button (with a confirm step) that wipes every
  team back to unclaimed so you can replay the whole hunt solo.
- Open `/` in one tab per "team" (or use incognito windows) and `/host` in
  another to run through the flow yourself.

## Stack

Next.js App Router + TypeScript + Tailwind v4. Route Handlers under
`src/app/api/**` are the "backend"; `src/lib/store.ts` is the shared-state
API, backed by `src/lib/storage/fileBackend.ts` (local JSON file, guarded
by an in-process mutex) or `src/lib/storage/supabaseBackend.ts` (Postgres
via `@supabase/supabase-js`, using an atomic conditional `UPDATE ... WHERE
status = 'unclaimed'` so simultaneous team claims still resolve to exactly
one winner across serverless instances). No other external services
required.
