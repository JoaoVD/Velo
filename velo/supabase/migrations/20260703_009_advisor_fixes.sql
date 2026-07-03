-- Correções dos warnings do Supabase advisors:
-- 1. Policy duplicada em user_organizations (select_own_membership era idêntica
--    a user_orgs_select_own). Mantém uma só, com (select auth.uid()) para evitar
--    re-avaliação por linha (auth_rls_initplan).
drop policy if exists "select_own_membership" on public.user_organizations;
drop policy if exists "user_orgs_select_own" on public.user_organizations;
create policy "user_orgs_select_own" on public.user_organizations for select
  to authenticated
  using (user_id = (select auth.uid()));

-- 2. auth_rls_initplan em competitors: usa (select auth.uid()) e restringe a authenticated.
drop policy if exists "org members can manage competitors" on public.competitors;
create policy "org members can manage competitors"
  on public.competitors
  to authenticated
  using (
    brand_id in (
      select b.id from public.brands b
      join public.user_organizations uo on uo.organization_id = b.organization_id
      where uo.user_id = (select auth.uid())
    )
  );

-- 3. auth_rls_initplan em competitor_scores.
drop policy if exists "select_own_competitor_scores" on public.competitor_scores;
create policy "select_own_competitor_scores" on public.competitor_scores for select
  to authenticated
  using (
    competitor_id in (
      select c.id from public.competitors c
      join public.brands b on b.id = c.brand_id
      join public.user_organizations uo on uo.organization_id = b.organization_id
      where uo.user_id = (select auth.uid())
    )
  );

-- 4. handle_new_user() é SECURITY DEFINER e estava executável via REST por
--    anon/authenticated. Só o trigger de auth.users deve chamá-la.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
