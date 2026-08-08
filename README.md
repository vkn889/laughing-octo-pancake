# Who's That Pokémon? Scavenger Hunt

A mobile-first, Pokédex-themed "Who's That Pokémon?" scavenger hunt for a
birthday party. Built from the PRD/SRD in `pokemon-scavenger-hunt-prd-srd.md`.

**Field-test roster (7 Pokémon):** Torchic → Combusken → Blaziken,
Rayquaza, Froakie → Frogadier → Greninja.

## How it works

- 7 fixed teams (Team Alpha / Magma / Aqua / Ball / Pegasus / Touch / Doom)
  each claim a spot on `/` from their own phone.
- Each team gets a random order of the 7 Pokémon, one clue at a time. A
  correct guess (typo-tolerant) locks them into "bring the card to the
  host" until the host taps **Confirm** for that team on `/host`.
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
the app automatically switches to a Supabase-backed store instead. No
code changes needed, just point it at a Supabase project:

1. A dedicated project (`pokemon-scavenger-hunt`, org `vkn889's Org`) has
   already been created and migrated, see
   `supabase/migrations/20260807221900_create_teams_table.sql` for the
   schema (a `teams` table, seeded with the 7-team roster, with Row Level
   Security scoping the app's anon key to read/update only).
2. Push this repo to GitHub (or run `vercel` from the CLI) and import it
   as a new Vercel project.
3. In the project's **Settings -> Environment Variables**, set
   `SUPABASE_URL` and `SUPABASE_ANON_KEY` (Supabase project ->
   Settings -> API). See `.env.example`.
4. Deploy. Every clue guess, handoff confirmation, and the host dashboard
   now read/write through Supabase instead of a local file.

Setting up your own Supabase project from scratch instead? Run the SQL in
`supabase/migrations/20260807221900_create_teams_table.sql` against it
(SQL Editor, or `supabase db push`), then use that project's URL/anon key.

## Before the real party, edit the content

Everything content-related lives in two files, no code changes needed:

- **`src/lib/pokemon.ts`**: for each of the 7 Pokémon, `hintText` (riddle,
  never say the name), `hidingSpot` (host-only reference, shown only on
  `/host`), and `acceptedAnswers`. Swap `hidingSpot` for your real venue;
  `hintText` is already built from real Pokédex facts (type,
  classification, canonical traits) rather than made-up riddles.
- **`src/lib/teams.ts`**: team names/colors if you want something other
  than Alpha/Magma/Aqua/Ball/Pegasus/Touch/Doom.

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
`src/app/api/**` are the "backend"; `src/lib/store.ts` is the shared-state
API, backed by `src/lib/storage/fileBackend.ts` (local JSON file, guarded
by an in-process mutex) or `src/lib/storage/supabaseBackend.ts` (Postgres
via `@supabase/supabase-js`, using an atomic conditional `UPDATE ... WHERE
status = 'unclaimed'` so simultaneous team claims still resolve to exactly
one winner across serverless instances). No other external services
required.
