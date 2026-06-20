-- Run this in the Supabase SQL editor to set up your schema

create table seasons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  year integer not null,
  team_name text not null default '',
  age_group text not null,
  created_at timestamptz not null default now()
);

create table games (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  date text not null,
  time text not null default '',
  opponent text not null,
  location text not null default '',
  is_home boolean not null default true,
  result text check (result in ('W', 'L', 'T')),
  my_score integer,
  opponent_score integer,
  notes text,
  created_at timestamptz not null default now()
);

create table players (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  first_name text not null,
  last_name text not null,
  number integer,
  positions text[] not null default '{}',
  parent_name text,
  parent_phone text,
  parent_email text,
  notes text,
  created_at timestamptz not null default now()
);

-- Row Level Security: users can only access their own data
alter table seasons enable row level security;
alter table games enable row level security;
alter table players enable row level security;

create policy "seasons_own" on seasons for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "games_own" on games for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "players_own" on players for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
