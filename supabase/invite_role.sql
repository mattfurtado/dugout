-- Add has_head_coach to get_invite_details so the UI can disable that option
drop function if exists get_invite_details(uuid);
create or replace function get_invite_details(invite_id uuid)
returns table(season_id uuid, team_name text, season_name text, age_group text, year int, has_head_coach boolean)
language plpgsql security definer as $$
begin
  return query
    select
      si.season_id,
      s.team_name,
      s.name,
      s.age_group,
      s.year,
      exists(
        select 1 from coaches c
        where c.season_id = si.season_id and c.role = 'Head Coach'
      ) as has_head_coach
    from season_invites si
    join seasons s on s.id = si.season_id
    where si.id = invite_id;
end;
$$;

-- Accept invite with role; upsert coaches record matched by email to avoid duplicates
create or replace function accept_coach_invite(invite_id uuid, coach_role text default 'Assistant Coach')
returns uuid
language plpgsql security definer as $$
declare
  v_season_id  uuid;
  v_invited_by uuid;
  v_user_id    uuid;
  v_name       text;
  v_email      text;
begin
  select season_id, user_id into v_season_id, v_invited_by
  from season_invites where id = invite_id;
  if v_season_id is null then raise exception 'Invalid or expired invite link'; end if;

  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'You must be signed in to accept an invite'; end if;

  select coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email), email
  into v_name, v_email
  from auth.users where id = v_user_id;

  -- Grant season access (idempotent)
  insert into season_members (season_id, user_id, invited_by)
  values (v_season_id, v_user_id, v_invited_by)
  on conflict (season_id, user_id) do nothing;

  -- Upsert coaches record: update role if email matches an existing row, else insert
  if v_email is not null then
    update coaches
    set role = coach_role, name = coalesce(v_name, name)
    where season_id = v_season_id and lower(email) = lower(v_email);

    if not found then
      insert into coaches (season_id, user_id, name, role, email)
      values (v_season_id, v_invited_by, v_name, coach_role, v_email);
    end if;
  else
    insert into coaches (season_id, user_id, name, role)
    values (v_season_id, v_invited_by, v_name, coach_role);
  end if;

  return v_season_id;
end;
$$;
