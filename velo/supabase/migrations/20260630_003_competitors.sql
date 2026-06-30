create table if not exists public.competitors (
  id uuid default gen_random_uuid() primary key,
  brand_id uuid references public.brands(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now(),
  unique(brand_id, name)
);

alter table public.competitors enable row level security;

create policy "org members can manage competitors"
  on public.competitors
  using (
    brand_id in (
      select b.id from public.brands b
      join public.user_organizations uo on uo.organization_id = b.organization_id
      where uo.user_id = auth.uid()
    )
  );
