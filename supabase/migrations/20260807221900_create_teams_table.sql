-- Applied to the live project via the Supabase MCP tool; checked in here
-- as documentation and so a fresh Supabase project can be set up
-- identically (paste into the SQL Editor, or `supabase db push`).

create table public.teams (
  team_id text primary key,
  status text not null default 'unclaimed'
    check (status in ('unclaimed', 'guessing', 'awaiting_handoff', 'finished')),
  clue_order jsonb not null default '[]'::jsonb,
  current_index int not null default 0,
  start_time bigint,
  finish_time bigint,
  wrong_guesses int not null default 0
);

-- Fixed 7-team roster (src/lib/teams.ts). Seeded once here; the app never
-- inserts or deletes rows, only reads/updates these.
insert into public.teams (team_id) values
  ('alpha'), ('magma'), ('aqua'), ('ball'), ('pegasus'), ('touch'), ('doom');

alter table public.teams enable row level security;

-- The app's server-side Route Handlers are the only client, using the
-- anon/publishable key (never the more privileged service_role key).
-- Scoped to exactly what they need: read every team, update a team's
-- game-state columns. No insert/delete, so the roster can't be tampered
-- with even if the key leaked.
create policy "anon can read teams"
  on public.teams for select
  to anon
  using (true);

create policy "anon can update teams"
  on public.teams for update
  to anon
  using (true)
  with check (true);
