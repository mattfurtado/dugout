-- Run this in the Supabase SQL editor

create table coaches (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  role text not null default 'Assistant Coach',
  phone text,
  email text,
  created_at timestamptz not null default now()
);

alter table coaches enable row level security;

create policy "coaches_own" on coaches for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
