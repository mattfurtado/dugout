-- Fix circular RLS reference:
-- seasons_member_read → season_members → members_owner → seasons → seasons_member_read (loop!)
-- Solution: members_owner uses invited_by directly (no seasons join)

drop policy if exists "members_owner" on season_members;

create policy "members_owner" on season_members for all
  using (auth.uid() = invited_by)
  with check (auth.uid() = invited_by);
