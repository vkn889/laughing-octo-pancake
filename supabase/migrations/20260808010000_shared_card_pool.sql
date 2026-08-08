-- Applied to the live project via the Supabase MCP tool; checked in here
-- as documentation and so a fresh Supabase project can be set up
-- identically.
--
-- Move from a fixed per-team clue_order/current_index to a shared card
-- pool: caught_ids tracks what each team has actually confirmed caught,
-- current_card_id is the one card dynamically assigned to them right now.
-- Cards are picked from whatever the whole roster minus every team's
-- caught_ids leaves available, so once any team catches a card it's gone
-- for everyone else (see src/lib/store.ts pickNextCard/reconcileTeam).

alter table public.teams
  drop column clue_order,
  drop column current_index,
  add column caught_ids jsonb not null default '[]'::jsonb,
  add column current_card_id text;

-- Reset all 7 teams back to unclaimed for the new pool mechanic.
update public.teams set
  status = 'unclaimed',
  caught_ids = '[]'::jsonb,
  current_card_id = null,
  start_time = null,
  finish_time = null,
  wrong_guesses = 0;
