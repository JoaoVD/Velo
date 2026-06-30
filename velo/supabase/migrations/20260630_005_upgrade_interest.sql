create table if not exists public.upgrade_interest (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  current_plan text default 'starter',
  target_plan text not null,
  created_at timestamptz default now()
);
