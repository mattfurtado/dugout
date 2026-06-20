-- Fix: accept_coach_invite was inserting a new coaches row on every invite acceptance,
-- duplicating any coach the head coach had already added manually.
-- The coaches directory is managed by the head coach via the Roster page;
-- the invite flow only needs to grant season access (season_members).

create or replace function accept_coach_invite(invite_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  v_season_id uuid;
  v_invited_by uuid;
  v_user_id uuid;
begin
  select season_id, user_id into v_season_id, v_invited_by
  from season_invites where id = invite_id;
  if v_season_id is null then raise exception 'Invalid or expired invite link'; end if;

  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'You must be signed in to accept an invite'; end if;

  -- Grant season access (idempotent)
  insert into season_members (season_id, user_id, invited_by)
  values (v_season_id, v_user_id, v_invited_by)
  on conflict (season_id, user_id) do nothing;

  return v_season_id;
end;
$$;

-- Remove duplicate coaches rows created by prior invite acceptances.
-- Keeps the oldest row (the one manually added by the head coach) per season+name.
delete from coaches
where id in (
  select id from (
    select id,
           row_number() over (partition by season_id, lower(name) order by created_at asc) as rn
    from coaches
  ) ranked
  where rn > 1
);
