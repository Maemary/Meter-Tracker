-- Meter Tracker: step 2 — one private meter per account
-- Run AFTER schema.sql. Paste this whole file into Supabase → SQL Editor → Run.
--
-- What changes:
--   * new `meters` table: each account owns one meter (number + DisCo)
--   * readings/recharges get a `meter_id`, filled in automatically
--   * security: you only ever see entries for YOUR meter
--   * entries you saved before this (with no meter) are attached to your
--     meter automatically the moment you create it

-- 1. Meters ---------------------------------------------------------------

create table meters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique default auth.uid()
    references auth.users on delete cascade,          -- unique = one meter per account
  meter_number text not null check (meter_number ~ '^[0-9]{11,13}$'),
  disco text not null check (disco in (
    'ABA', 'AEDC', 'BEDC', 'EEDC', 'EKEDC', 'IBEDC',
    'IKEDC', 'JED', 'KAEDCO', 'KEDCO', 'PHED', 'YEDC'
  )),
  nickname text check (char_length(nickname) <= 40),
  created_at timestamptz not null default now()
);

alter table meters enable row level security;
grant select, insert, update on meters to authenticated;

create policy "Own meter: view"
  on meters for select to authenticated using (owner_id = auth.uid());
create policy "Own meter: create"
  on meters for insert to authenticated with check (owner_id = auth.uid());
create policy "Own meter: edit"
  on meters for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- 2. Helper: "which meter is mine?" ---------------------------------------

create or replace function public.my_meter_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from meters where owner_id = auth.uid()
$$;

grant execute on function public.my_meter_id() to authenticated;

-- 3. Link entries to a meter ------------------------------------------------
-- The default means the app never has to send meter_id: the database
-- fills in the signed-in person's meter automatically.

alter table readings
  add column meter_id uuid references meters on delete cascade
  default public.my_meter_id();
alter table recharges
  add column meter_id uuid references meters on delete cascade
  default public.my_meter_id();

create index readings_meter_id_idx on readings (meter_id);
create index recharges_meter_id_idx on recharges (meter_id);

-- 4. Replace the old "any signed-in user" rules with "own meter only" -------

drop policy "Household can view readings" on readings;
drop policy "Household can add readings" on readings;
drop policy "Household can delete readings" on readings;
drop policy "Household can view recharges" on recharges;
drop policy "Household can add recharges" on recharges;
drop policy "Household can delete recharges" on recharges;

create policy "Own meter: view readings"
  on readings for select to authenticated using (meter_id = public.my_meter_id());
create policy "Own meter: add readings"
  on readings for insert to authenticated with check (meter_id = public.my_meter_id());
create policy "Own meter: delete readings"
  on readings for delete to authenticated using (meter_id = public.my_meter_id());

create policy "Own meter: view recharges"
  on recharges for select to authenticated using (meter_id = public.my_meter_id());
create policy "Own meter: add recharges"
  on recharges for insert to authenticated with check (meter_id = public.my_meter_id());
create policy "Own meter: delete recharges"
  on recharges for delete to authenticated using (meter_id = public.my_meter_id());

-- 5. Keep entries saved before you had a meter ------------------------------

create or replace function public.claim_existing_entries()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update readings set meter_id = new.id
    where created_by = new.owner_id and meter_id is null;
  update recharges set meter_id = new.id
    where created_by = new.owner_id and meter_id is null;
  return new;
end;
$$;

create trigger claim_entries_after_meter_created
  after insert on meters
  for each row execute function public.claim_existing_entries();
