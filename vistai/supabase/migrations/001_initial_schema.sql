create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'starter' check (plan in ('starter', 'pro', 'agency')),
  created_at timestamptz default now()
);

create table brands (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  website text,
  created_at timestamptz default now()
);

create table keywords (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade not null,
  term text not null,
  created_at timestamptz default now(),
  unique(brand_id, term)
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'running', 'done', 'failed')),
  scheduled_for timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  attempt_count int not null default 0,
  created_at timestamptz default now()
);

create table query_results (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade not null,
  keyword_id uuid references keywords(id) on delete cascade not null,
  engine text not null check (engine in ('chatgpt', 'gemini')),
  prompt_used text not null,
  raw_response text not null,
  created_at timestamptz default now()
);

create table scores (
  id uuid primary key default gen_random_uuid(),
  keyword_id uuid references keywords(id) on delete cascade not null,
  engine text not null check (engine in ('chatgpt', 'gemini')),
  date date not null default current_date,
  mention_score numeric(5,2) not null,
  position_score numeric(5,2) not null,
  sentiment_score numeric(5,2) not null,
  frequency_score numeric(5,2) not null,
  geo_score numeric(5,2) not null,
  created_at timestamptz default now(),
  unique(keyword_id, engine, date)
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade not null,
  period_start date not null,
  period_end date not null,
  content_md text not null,
  pdf_url text,
  created_at timestamptz default now()
);

create table action_plans (
  id uuid primary key default gen_random_uuid(),
  keyword_id uuid references keywords(id) on delete cascade not null,
  engine text not null check (engine in ('chatgpt', 'gemini')),
  recommendation text not null,
  priority text not null check (priority in ('high', 'medium', 'low')),
  created_at timestamptz default now()
);

create table user_organizations (
  user_id uuid references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  primary key (user_id, organization_id)
);

-- Enable RLS
alter table organizations enable row level security;
alter table brands enable row level security;
alter table keywords enable row level security;
alter table jobs enable row level security;
alter table query_results enable row level security;
alter table scores enable row level security;
alter table reports enable row level security;
alter table action_plans enable row level security;
alter table user_organizations enable row level security;

-- RLS policies
create policy "select_own_org" on organizations for select
  using (id in (select organization_id from user_organizations where user_id = auth.uid()));

create policy "select_own_brands" on brands for select
  using (organization_id in (select organization_id from user_organizations where user_id = auth.uid()));

create policy "select_own_keywords" on keywords for select
  using (brand_id in (
    select b.id from brands b
    join user_organizations uo on uo.organization_id = b.organization_id
    where uo.user_id = auth.uid()
  ));

create policy "select_own_scores" on scores for select
  using (keyword_id in (
    select k.id from keywords k
    join brands b on b.id = k.brand_id
    join user_organizations uo on uo.organization_id = b.organization_id
    where uo.user_id = auth.uid()
  ));

create policy "select_own_reports" on reports for select
  using (brand_id in (
    select b.id from brands b
    join user_organizations uo on uo.organization_id = b.organization_id
    where uo.user_id = auth.uid()
  ));

create policy "select_own_action_plans" on action_plans for select
  using (keyword_id in (
    select k.id from keywords k
    join brands b on b.id = k.brand_id
    join user_organizations uo on uo.organization_id = b.organization_id
    where uo.user_id = auth.uid()
  ));
