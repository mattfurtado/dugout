-- Run this in the Supabase SQL editor

create table lineup_rankings (
  season_id uuid references seasons(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  rankings jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (season_id)
);

alter table lineup_rankings enable row level security;

create policy "lineup_own" on lineup_rankings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
