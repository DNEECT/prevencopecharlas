-- Core objects are deliberately separate from the exposed Data API schema.
-- Every later public table must explicitly revoke inherited grants, enable RLS,
-- and grant only its intended authenticated operations.
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
revoke create on schema public from public;

-- New projects may no longer auto-grant Data API access. Keep local defaults
-- restrictive too; later migrations still revoke privileges per object because
-- existing hosted projects can carry older global default grants.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema private
  revoke execute on functions from public, anon, authenticated;

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.touch_updated_at() from public, anon, authenticated;
