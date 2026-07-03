-- RLS hardening
-- 1. upgrade_interest estava sem RLS: qualquer pessoa com a anon key podia ler
--    todos os emails de interessados. Habilita RLS, permite apenas INSERT por
--    usuários autenticados (leitura só via service_role).
alter table public.upgrade_interest enable row level security;

create policy "authenticated_can_register_interest"
  on public.upgrade_interest for insert
  to authenticated
  with check (true);

-- 2. user_organizations tinha RLS habilitado sem nenhuma policy, impedindo o
--    usuário de ler a própria associação via client. Permite SELECT das
--    próprias linhas.
create policy "select_own_membership"
  on public.user_organizations for select
  using (user_id = auth.uid());
