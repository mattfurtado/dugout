-- Allow a coach to update their own record (matched by email) in seasons they belong to
create policy "coaches_self_update" on coaches for update
  using (
    coaches.email = auth.jwt() ->> 'email'
    and exists (
      select 1 from season_members
      where season_members.season_id = coaches.season_id
        and season_members.user_id = auth.uid()
    )
  )
  with check (
    coaches.email = auth.jwt() ->> 'email'
    and exists (
      select 1 from season_members
      where season_members.season_id = coaches.season_id
        and season_members.user_id = auth.uid()
    )
  );
