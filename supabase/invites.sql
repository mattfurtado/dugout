-- Run this in the Supabase SQL editor

create table season_invites (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id) on delete cascade not null unique,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz not null default now()
);

alter table season_invites enable row level security;

create policy "invites_owner" on season_invites for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Returns basic season info for the invite accept page (callable by anon)
create or replace function get_invite_details(invite_id uuid)
returns table(team_name text, season_name text, age_group text, year int)
language plpgsql
security definer
as $$
begin
  return query
  select s.team_name, s.name, s.age_group, s.year
  from season_invites i
  join seasons s on s.id = i.season_id
  where i.id = invite_id;
end;
$$;

-- Inserts coach record as the season owner (callable by anon, bypasses RLS)
create or replace function accept_coach_invite(
  invite_id uuid,
  coach_name text,
  coach_role text,
  coach_phone text default null,
  coach_email text default null
) returns void
language plpgsql
security definer
as $$
declare
  v_season_id uuid;
  v_user_id uuid;
begin
  select season_id, user_id into v_season_id, v_user_id
  from season_invites
  where id = invite_id;

  if v_season_id is null then
    raise exception 'Invalid or expired invite link';
  end if;

  insert into coaches (season_id, user_id, name, role, phone, email)
  values (v_season_id, v_user_id, coach_name, coach_role, coach_phone, coach_email);
end;
$$;
