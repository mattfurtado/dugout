-- Run this after coach_rankings_v2.sql

-- Allow season members to read ALL lineup rankings for their seasons (for the aggregate view)
create policy "lineup_member_read" on lineup_rankings for select
  using (exists (select 1 from season_members where season_id = lineup_rankings.season_id and user_id = auth.uid()));
