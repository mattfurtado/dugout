-- Run this in the Supabase SQL editor

-- 1. Season members: links invited coaches (with their own auth accounts) to a season
create table season_members (
  season_id uuid references seasons(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  invited_by uuid references auth.users(id) not null,
  joined_at timestamptz not null default now(),
  primary key (season_id, user_id)
);
alter table season_members enable row level security;

-- Season owner can manage all members for their seasons
create policy "members_owner" on season_members for all
  using (exists (select 1 from seasons where id = season_id and user_id = auth.uid()))
  with check (exists (select 1 from seasons where id = season_id and user_id = auth.uid()));

-- Members can read their own membership rows (so the app knows which seasons they belong to)
create policy "members_self_read" on season_members for select
  using (auth.uid() = user_id);


-- 2. Update lineup_rankings: change PK from (season_id) to (season_id, user_id)
--    This preserves existing rows (head coach's rankings stay as-is under their user_id)
alter table lineup_rankings drop constraint lineup_rankings_pkey;
alter table lineup_rankings add primary key (season_id, user_id);

-- Update RLS: owner can read ALL rankings for their seasons; each coach manages their own
drop policy if exists "lineup_own" on lineup_rankings;

create policy "lineup_owner_read" on lineup_rankings for select
  using (exists (select 1 from seasons where id = season_id and user_id = auth.uid()));

create policy "lineup_member_own" on lineup_rankings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- 3. Allow season members to read seasons and players they've been invited to
create policy "seasons_member_read" on seasons for select
  using (exists (select 1 from season_members where season_id = id and user_id = auth.uid()));

create policy "players_member_read" on players for select
  using (exists (select 1 from season_members where season_id = players.season_id and user_id = auth.uid()));


-- 4. Update accept_coach_invite: now requires auth (coaches must have a Dugout account)
--    Old version accepted anonymous form submissions — replace it
drop function if exists accept_coach_invite(uuid, text, text, text, text);

create or replace function accept_coach_invite(invite_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  v_season_id uuid;
  v_invited_by uuid;
  v_user_id uuid;
  v_name text;
  v_email text;
begin
  select season_id, user_id into v_season_id, v_invited_by
  from season_invites where id = invite_id;
  if v_season_id is null then raise exception 'Invalid or expired invite link'; end if;

  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'You must be signed in to accept an invite'; end if;

  -- Pull name and email from the accepting user's auth profile
  select coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email), email
  into v_name, v_email
  from auth.users where id = v_user_id;

  -- Add to season_members (idempotent — safe to call again if already a member)
  insert into season_members (season_id, user_id, invited_by)
  values (v_season_id, v_user_id, v_invited_by)
  on conflict (season_id, user_id) do nothing;

  -- Add to the head coach's coaches directory (using head coach's user_id for RLS ownership)
  insert into coaches (season_id, user_id, name, role, email)
  values (v_season_id, v_invited_by, v_name, 'Assistant Coach', v_email)
  on conflict do nothing;

  return v_season_id;
end;
$$;


-- 5. Update get_invite_details to also return season_id (needed for post-accept redirect)
drop function if exists get_invite_details(uuid);
create or replace function get_invite_details(invite_id uuid)
returns table(season_id uuid, team_name text, season_name text, age_group text, year int)
language plpgsql
security definer
as $$
begin
  return query
  select s.id, s.team_name, s.name, s.age_group, s.year
  from season_invites i
  join seasons s on s.id = i.season_id
  where i.id = invite_id;
end;
$$;
