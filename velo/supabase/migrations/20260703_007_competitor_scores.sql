create table if not exists public.competitor_scores (
  id uuid primary key default gen_random_uuid(),
  competitor_id uuid references public.competitors(id) on delete cascade not null,
  keyword_id uuid references public.keywords(id) on delete cascade not null,
  engine text not null check (engine in ('chatgpt', 'gemini')),
  date date not null default current_date,
  frequency_score numeric(5,2) not null,
  position_score numeric(5,2) not null,
  created_at timestamptz default now(),
  unique(competitor_id, keyword_id, engine, date)
);

alter table public.competitor_scores enable row level security;

create policy "select_own_competitor_scores" on public.competitor_scores for select
  using (competitor_id in (
    select c.id from public.competitors c
    join public.brands b on b.id = c.brand_id
    join public.user_organizations uo on uo.organization_id = b.organization_id
    where uo.user_id = auth.uid()
  ));
