-- Meter Tracker database setup
-- Paste this whole file into Supabase → SQL Editor → New query → Run.

-- 1. Tables ---------------------------------------------------------------

-- A meter balance someone checked
create table readings (
  id uuid primary key default gen_random_uuid(),
  taken_at timestamp not null,                       -- local Lagos time, e.g. 2026-11-09 08:30
  units numeric(10, 2) not null check (units >= 0),  -- units left on the meter
  created_by uuid default auth.uid() references auth.users on delete set null,
  created_at timestamptz not null default now()
);

-- Units someone bought
create table recharges (
  id uuid primary key default gen_random_uuid(),
  taken_at timestamp not null,
  units numeric(10, 2) not null check (units > 0),     -- units added
  amount numeric(12, 2) not null check (amount >= 0),  -- naira paid
  created_by uuid default auth.uid() references auth.users on delete set null,
  created_at timestamptz not null default now()
);

-- 2. Security (Row Level Security) ------------------------------------------
-- With RLS on, nobody can touch a row unless a policy below allows it.
-- "authenticated" = anyone signed in. Sign-ups will be turned off, so the only
-- people who can sign in are the household members you add yourself.

alter table readings enable row level security;
alter table recharges enable row level security;

grant select, insert, delete on readings, recharges to authenticated;

create policy "Household can view readings"
  on readings for select to authenticated using (true);
create policy "Household can add readings"
  on readings for insert to authenticated with check (true);
create policy "Household can delete readings"
  on readings for delete to authenticated using (true);

create policy "Household can view recharges"
  on recharges for select to authenticated using (true);
create policy "Household can add recharges"
  on recharges for insert to authenticated with check (true);
create policy "Household can delete recharges"
  on recharges for delete to authenticated using (true);
