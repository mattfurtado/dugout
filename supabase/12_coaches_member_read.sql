-- Allow coaches who are members of a season to read that season's coaches
create policy "coaches_member_read" on coaches for select
  using (
    exists (
      select 1 from season_members
      where season_members.season_id = coaches.season_id
        and season_members.user_id = auth.uid()
    )
  );
