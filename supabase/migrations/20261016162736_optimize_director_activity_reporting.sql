-- Director scope is constant for a request. Check it once before falling back
-- to the row-correlated helpers used by restricted roles.
drop policy if exists electoral_processes_read on public.electoral_processes;
create policy electoral_processes_read on public.electoral_processes
  for select to authenticated
  using (
    is_active
    and (
      (select private.has_director_scope())
      or (select private.can_access_process(id))
    )
  );

drop policy if exists special_juries_read on public.special_juries;
create policy special_juries_read on public.special_juries
  for select to authenticated
  using (
    is_active
    and (
      (select private.has_director_scope())
      or (select private.can_access_jury(id))
    )
  );

create index if not exists activity_registrations_active_created_id_idx
  on public.activity_registrations (created_at desc, id desc)
  where is_active;

create or replace function public.count_authorized_activities(
  p_process_id uuid default null,
  p_jury_id uuid default null,
  p_search text default null
)
returns bigint
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  select count(*)
  from public.activity_registrations ar
  where ar.is_active
    and (p_process_id is null or ar.electoral_process_id = p_process_id)
    and (p_jury_id is null or ar.special_jury_id = p_jury_id)
    and (
      nullif(btrim(p_search), '') is null
      or ar.code ilike '%' || btrim(p_search) || '%'
    );
$$;

revoke all on function public.count_authorized_activities(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.count_authorized_activities(uuid, uuid, text)
  to authenticated;
