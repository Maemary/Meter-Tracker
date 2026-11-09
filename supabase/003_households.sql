-- Meter Tracker: step 3 — households (several people, one meter)
-- Run AFTER 002_meters.sql. Paste this whole file into Supabase → SQL Editor → Run.
--
-- What changes:
--   * every meter gets an 8-character invite code (e.g. K7QM-4XPA)
--   * new `meter_members` table: who belongs to which meter (owner/member)
--   * "my meter" now means "the meter I'm a member of", so everyone in a
--     household sees and adds to the same readings and recharges
--   * functions to join (code + meter number), list members, leave,
--     remove someone (owner only) and get a fresh code (owner only)
-- Existing owners become the "owner" member of their meter automatically.

-- 1. Invite codes -------------------------------------------------------------
-- No 0/O or 1/I so codes are easy to read out over the phone.

create or replace function public.new_invite_code()
returns text
language sql
volatile
as $$
  select string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1),
    ''
  )
  from generate_series(1, 8)
$$;

alter table meters
  add column invite_code text unique default public.new_invite_code();
update meters set invite_code = public.new_invite_code() where invite_code is null;
alter table meters alter column invite_code set not null;

-- 2. Members ----------------------------------------------------------------

create table meter_members (
  meter_id uuid not null references meters on delete cascade,
  user_id uuid not null unique references auth.users on delete cascade, -- one meter per account
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (meter_id, user_id)
);

insert into meter_members (meter_id, user_id, role)
select id, owner_id, 'owner' from meters;

-- Whoever creates a meter becomes its owner-member automatically
create or replace function public.add_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into meter_members (meter_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger add_owner_after_meter_created
  after insert on meters
  for each row execute function public.add_owner_membership();

-- 3. "Which meter is mine?" now means "which meter am I a member of?" --------

create or replace function public.my_meter_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select meter_id from meter_members where user_id = auth.uid()
$$;

-- (readings/recharges policies from 002 already use my_meter_id(), so they
--  now cover the whole household with no further changes)

alter table meter_members enable row level security;
grant select on meter_members to authenticated;
create policy "Household: view members"
  on meter_members for select to authenticated
  using (meter_id = public.my_meter_id());

drop policy "Own meter: view" on meters;
create policy "Household: view meter"
  on meters for select to authenticated
  using (owner_id = auth.uid() or id = public.my_meter_id());

-- 4. Join a household ---------------------------------------------------------
-- Needs BOTH the invite code and the meter number, so a leaked code alone
-- isn't enough. If you already set up an EMPTY meter of your own (no entries,
-- nobody else in it), it's replaced; otherwise you must leave it first.

create or replace function public.join_meter(p_code text, p_meter_number text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
  current_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Please log in first.';
  end if;

  select id into target_id
  from meters
  where invite_code = upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'))
    and meter_number = regexp_replace(coalesce(p_meter_number, ''), '[^0-9]', '', 'g');

  if target_id is null then
    raise exception 'That invite code and meter number don''t match a household.';
  end if;

  select meter_id into current_id from meter_members where user_id = auth.uid();
  if current_id = target_id then
    return target_id; -- already in
  end if;

  if current_id is not null then
    if exists (select 1 from readings where meter_id = current_id)
       or exists (select 1 from recharges where meter_id = current_id)
       or (select count(*) from meter_members where meter_id = current_id) > 1 then
      raise exception 'Your account already tracks a meter with entries. Leave it first.';
    end if;
    delete from meter_members where user_id = auth.uid();
    delete from meters where id = current_id and owner_id = auth.uid();
  end if;

  insert into meter_members (meter_id, user_id, role)
  values (target_id, auth.uid(), 'member');
  return target_id;
end;
$$;

-- 5. Who's in my household? ---------------------------------------------------

create or replace function public.household_members()
returns table (user_id uuid, display_name text, email text, role text, joined_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select m.user_id,
         u.raw_user_meta_data ->> 'display_name',
         u.email::text,
         m.role,
         m.joined_at
  from meter_members m
  join auth.users u on u.id = m.user_id
  where m.meter_id = public.my_meter_id()
  order by (m.role = 'owner') desc, m.joined_at
$$;

-- 6. Leave / remove / new code ------------------------------------------------

create or replace function public.leave_household()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from meter_members where user_id = auth.uid() and role = 'owner') then
    raise exception 'The owner can''t leave their own meter.';
  end if;
  delete from meter_members where user_id = auth.uid();
end;
$$;

create or replace function public.remove_member(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from meter_members where user_id = auth.uid() and role = 'owner'
  ) then
    raise exception 'Only the meter owner can remove people.';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'You can''t remove yourself.';
  end if;
  delete from meter_members
  where user_id = p_user_id and meter_id = public.my_meter_id();
end;
$$;

create or replace function public.reset_invite_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  code text;
begin
  update meters
  set invite_code = public.new_invite_code()
  where id = public.my_meter_id() and owner_id = auth.uid()
  returning invite_code into code;

  if code is null then
    raise exception 'Only the meter owner can change the invite code.';
  end if;
  return code;
end;
$$;

-- 7. Only signed-in people may call these -------------------------------------

revoke execute on function public.join_meter(text, text) from public, anon;
revoke execute on function public.household_members() from public, anon;
revoke execute on function public.leave_household() from public, anon;
revoke execute on function public.remove_member(uuid) from public, anon;
revoke execute on function public.reset_invite_code() from public, anon;

grant execute on function public.join_meter(text, text) to authenticated;
grant execute on function public.household_members() to authenticated;
grant execute on function public.leave_household() to authenticated;
grant execute on function public.remove_member(uuid) to authenticated;
grant execute on function public.reset_invite_code() to authenticated;
