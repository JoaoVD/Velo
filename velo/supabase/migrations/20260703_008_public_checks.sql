-- Rate limit do checker gratuito da landing (IP hasheado com salt, sem dado pessoal em claro)
create table if not exists public.public_checks (
  ip_hash text not null,
  date date not null default current_date,
  count int not null default 1,
  created_at timestamptz default now(),
  primary key (ip_hash, date)
);

-- RLS sem policies: acesso apenas via service role (backend)
alter table public.public_checks enable row level security;
