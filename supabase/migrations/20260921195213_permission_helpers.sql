-- These predicates derive the actor exclusively from auth.uid(). They return
-- only the current caller's authorization booleans, never another user's data.
-- The private schema is absent from the Data API's exposed schema list.
create or replace function private.active_profile()
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_active
  );
$$;

create or replace function private.has_action(p_module text, p_action text)
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select private.active_profile() and exists (
    select 1
    from public.profile_roles pr
    join public.roles r on r.id = pr.role_id
    join public.role_modules rm on rm.role_id = r.id
    join public.modules m on m.id = rm.module_id
    join public.role_module_actions rma on rma.role_module_id = rm.id
    join public.module_actions ma on ma.id = rma.module_action_id and ma.module_id = m.id
    join public.actions a on a.id = ma.action_id
    where pr.profile_id = (select auth.uid())
      and pr.is_active and r.is_active and rm.is_active and m.is_active
      and rma.is_active and ma.is_active and a.is_active
      and m.abbreviation = p_module and a.abbreviation = p_action
  );
$$;

create or replace function private.is_monitor()
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select private.active_profile() and exists (
    select 1 from public.profile_roles pr
    join public.roles r on r.id = pr.role_id
    where pr.profile_id = (select auth.uid())
      and pr.is_active and r.is_active and r.name = 'Monitor'
  );
$$;

create or replace function private.can_access_activity(p_activity_id uuid, p_action text)
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select private.has_action('GREGACT', p_action) and exists (
    select 1 from public.activity_registrations ar
    where ar.id = p_activity_id and ar.is_active
      and (private.is_monitor() or ar.created_by = (select auth.uid()))
  );
$$;

revoke all on function private.active_profile() from public, anon, authenticated;
revoke all on function private.has_action(text, text) from public, anon, authenticated;
revoke all on function private.is_monitor() from public, anon, authenticated;
revoke all on function private.can_access_activity(uuid, text) from public, anon, authenticated;

-- Only policy predicates need these EXECUTE grants. No privileged mutation
-- function receives a direct authenticated grant.
grant usage on schema private to authenticated;
grant execute on function private.active_profile() to authenticated;
grant execute on function private.has_action(text, text) to authenticated;
grant execute on function private.is_monitor() to authenticated;
grant execute on function private.can_access_activity(uuid, text) to authenticated;
