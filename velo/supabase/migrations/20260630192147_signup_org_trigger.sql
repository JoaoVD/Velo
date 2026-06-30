-- Migration: auto-create organization and link user on signup
-- Uses SECURITY DEFINER (required: trigger fires before session exists)
-- Kept in `private` schema + REVOKE from PUBLIC per Supabase security guidelines

create schema if not exists private;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_id uuid;
  v_org_name text;
begin
  -- org_name is passed via supabase.auth.signUp({ options: { data: { org_name } } })
  -- raw_user_meta_data is user-supplied; only used here for display init, NOT for authz
  v_org_name := coalesce(
    nullif(trim((new.raw_user_meta_data->>'org_name')::text), ''),
    split_part(new.email, '@', 1)
  );

  insert into public.organizations (name)
  values (v_org_name)
  returning id into v_org_id;

  insert into public.user_organizations (user_id, organization_id)
  values (new.id, v_org_id);

  return new;
end;
$$;

-- Revoke EXECUTE from PUBLIC (SECURITY DEFINER functions grant PUBLIC by default)
revoke execute on function private.handle_new_user() from public;

-- Drop + recreate trigger for idempotency
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure private.handle_new_user();
