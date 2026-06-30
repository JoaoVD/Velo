alter table public.action_plans
  add constraint action_plans_keyword_engine_unique
  unique (keyword_id, engine);
