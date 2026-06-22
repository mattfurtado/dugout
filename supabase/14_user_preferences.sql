create table user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'dark'
);

alter table user_preferences enable row level security;

create policy "preferences_own" on user_preferences for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
