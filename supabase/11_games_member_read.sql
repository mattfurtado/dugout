-- Allow coaches who are members of a season to read that season's games
create policy "games_member_read" on games for select
  using (
    exists (
      select 1 from season_members
      where season_members.season_id = games.season_id
        and season_members.user_id = auth.uid()
    )
  );
