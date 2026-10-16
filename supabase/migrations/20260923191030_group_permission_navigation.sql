-- Return authorized functional routes together with their hierarchy-only
-- parent modules. The legacy header groups configuration below
-- Administracion and user administration below Seguridad. Non-functional
-- grants such as Todos remain available to the permission model but are not
-- rendered as dead navigation links.
create or replace function public.my_permissions()
returns table (
  module_id uuid, parent_module_id uuid, module_abbreviation text,
  module_name text, route text, icon text, sort_order integer,
  action_abbreviation text
)
language sql stable security definer
set search_path = pg_catalog
as $$
  with effective_actions as (
    select distinct m.id, m.parent_id, m.abbreviation, m.name, m.route,
      m.icon, m.sort_order, m.is_functional, a.abbreviation as action_abbreviation
    from public.profile_roles pr
    join public.roles r on r.id = pr.role_id and r.is_active
    join public.role_modules rm on rm.role_id = r.id and rm.is_active
    join public.modules m on m.id = rm.module_id and m.is_active
    join public.role_module_actions rma
      on rma.role_module_id = rm.id and rma.is_active
    join public.module_actions ma
      on ma.id = rma.module_action_id and ma.is_active and ma.module_id = m.id
    join public.actions a on a.id = ma.action_id and a.is_active
    where pr.profile_id = (select auth.uid())
      and pr.is_active
      and private.active_profile()
  ), navigation_rows as (
    select ea.id, ea.parent_id, ea.abbreviation, ea.name, ea.route, ea.icon,
      ea.sort_order, ea.action_abbreviation
    from effective_actions ea
    where ea.is_functional

    union

    select parent.id, parent.parent_id, parent.abbreviation, parent.name,
      parent.route, parent.icon, parent.sort_order, 'LIST'
    from effective_actions child
    join public.modules parent
      on parent.id = child.parent_id and parent.is_active and parent.is_functional
    where child.action_abbreviation = 'LIST'
  )
  select nr.id, nr.parent_id, nr.abbreviation::text, nr.name::text,
    nr.route::text, nr.icon::text, nr.sort_order,
    nr.action_abbreviation::text
  from navigation_rows nr;
$$;

revoke all on function public.my_permissions() from public, anon, authenticated;
grant execute on function public.my_permissions() to authenticated;
