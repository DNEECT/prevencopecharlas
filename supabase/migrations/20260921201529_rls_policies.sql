-- Current-actor permissions are readable without exposing the membership
-- tables or accepting an actor ID supplied by a client.
create or replace function public.my_permissions()
returns table (
  module_id uuid, parent_module_id uuid, module_abbreviation text,
  module_name text, route text, icon text, sort_order integer,
  action_abbreviation text
)
language sql stable security definer
set search_path = pg_catalog
as $$
  select distinct m.id, m.parent_id, m.abbreviation::text,
    m.name::text, m.route::text, m.icon::text, m.sort_order,
    a.abbreviation::text
  from public.profile_roles pr
  join public.roles r on r.id = pr.role_id and r.is_active
  join public.role_modules rm on rm.role_id = r.id and rm.is_active
  join public.modules m on m.id = rm.module_id and m.is_active
  join public.role_module_actions rma on rma.role_module_id = rm.id and rma.is_active
  join public.module_actions ma on ma.id = rma.module_action_id and ma.is_active
    and ma.module_id = m.id
  join public.actions a on a.id = ma.action_id and a.is_active
  where pr.profile_id = (select auth.uid()) and pr.is_active
    and private.active_profile();
$$;
revoke all on function public.my_permissions() from public, anon, authenticated;
grant execute on function public.my_permissions() to authenticated;

grant select on public.profiles to authenticated;
create policy profiles_read on public.profiles for select to authenticated
  using ((select private.active_profile()) and (
    id = (select auth.uid()) or
    ((select private.is_monitor()) and (select private.has_action('GUSU','LIST')))
  ));

-- Reference data is visible to active application users. Only the seeded
-- Monitor actions authorize edits to types and formats.
grant select on public.activity_types, public.activity_formats,
  public.assistant_types, public.target_audiences,
  public.electoral_processes, public.special_juries to authenticated;

create policy activity_types_read on public.activity_types for select to authenticated
  using (is_active and (select private.active_profile()));
create policy activity_formats_read on public.activity_formats for select to authenticated
  using (is_active and (select private.active_profile()));
create policy assistant_types_read on public.assistant_types for select to authenticated
  using (is_active and (select private.active_profile()));
create policy target_audiences_read on public.target_audiences for select to authenticated
  using (is_active and (select private.active_profile()));
create policy electoral_processes_read on public.electoral_processes for select to authenticated
  using (is_active and (select private.active_profile()));
create policy special_juries_read on public.special_juries for select to authenticated
  using (is_active and (select private.active_profile()));

create or replace function private.stamp_catalog_actor()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
declare actor uuid := auth.uid();
begin
  if actor is not null then
    if tg_op = 'INSERT' then
      new.created_by := actor;
    else
      new.created_by := old.created_by;
    end if;
    new.updated_by := actor;
  end if;
  return new;
end;
$$;
revoke all on function private.stamp_catalog_actor() from public, anon, authenticated;
create trigger activity_types_stamp_actor before insert or update on public.activity_types
  for each row execute function private.stamp_catalog_actor();
create trigger activity_formats_stamp_actor before insert or update on public.activity_formats
  for each row execute function private.stamp_catalog_actor();

grant insert (name, description) on public.activity_types to authenticated;
grant update (name, description, is_active) on public.activity_types to authenticated;
create policy activity_types_add on public.activity_types for insert to authenticated
  with check ((select private.has_action('GTIPACT','ADD')));
create policy activity_types_edit on public.activity_types for update to authenticated
  using (is_active and ((select private.has_action('GTIPACT','EDIT'))
    or (select private.has_action('GTIPACT','DELETE'))))
  with check ((is_active and (select private.has_action('GTIPACT','EDIT')))
    or (not is_active and (select private.has_action('GTIPACT','DELETE'))));

grant insert (activity_type_id, topic, series) on public.activity_formats to authenticated;
grant update (activity_type_id, topic, series, is_active) on public.activity_formats to authenticated;
create policy activity_formats_add on public.activity_formats for insert to authenticated
  with check ((select private.has_action('GFORACT','ADD')) and exists (
    select 1 from public.activity_types at where at.id = activity_type_id and at.is_active
  ));
create policy activity_formats_edit on public.activity_formats for update to authenticated
  using (is_active and ((select private.has_action('GFORACT','EDIT'))
    or (select private.has_action('GFORACT','DELETE'))))
  with check (((is_active and (select private.has_action('GFORACT','EDIT')))
    or (not is_active and (select private.has_action('GFORACT','DELETE'))))
    and exists (select 1 from public.activity_types at
      where at.id = activity_type_id and at.is_active));

grant select on public.activity_registrations, public.activity_participants,
  public.activity_evidence, public.activity_list to authenticated;
create policy activity_registrations_read on public.activity_registrations
  for select to authenticated using (
    is_active and (select private.has_action('GREGACT','LIST'))
    and ((select private.is_monitor()) or created_by = (select auth.uid()))
  );
create policy activity_participants_read on public.activity_participants
  for select to authenticated using (
    is_active and private.can_access_activity(activity_id, 'LIST')
  );
create policy activity_evidence_read on public.activity_evidence
  for select to authenticated using (
    is_active and private.can_access_activity(activity_id, 'LIST')
  );

-- Evidence metadata has column-limited writes; Storage object policies are
-- added separately. Clients cannot insert legacy references or set audit IDs.
create or replace function private.stamp_evidence_actor()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
declare actor uuid := auth.uid();
begin
  if actor is not null then
    if tg_op = 'INSERT' then
      new.created_by := actor;
      new.uploaded_by := actor;
    else
      new.created_by := old.created_by;
      new.uploaded_by := old.uploaded_by;
    end if;
    new.updated_by := actor;
  end if;
  return new;
end;
$$;
revoke all on function private.stamp_evidence_actor() from public, anon, authenticated;
create trigger activity_evidence_stamp_actor
  before insert or update on public.activity_evidence
  for each row execute function private.stamp_evidence_actor();

grant insert (activity_id, kind, object_path, original_name, mime_type,
  byte_size, is_available) on public.activity_evidence to authenticated;
grant update (is_active) on public.activity_evidence to authenticated;
create policy activity_evidence_add on public.activity_evidence
  for insert to authenticated with check (
    is_active and is_available and object_path like activity_id::text || '/' || kind || '/%'
    and private.can_access_activity(activity_id, 'EDIT')
  );
create policy activity_evidence_archive on public.activity_evidence
  for update to authenticated
  using (is_active and private.can_access_activity(activity_id, 'EDIT'))
  with check (private.can_access_activity(activity_id, 'EDIT'));
