-- Historical Elecciones Generales 2026 data belongs to the Director-level
-- review scope. Operational Monitor and Gestor accounts work only with the
-- current process and the JEE assigned to their profile.

create or replace function private.has_director_scope()
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select private.active_profile() and exists (
    select 1
    from public.profile_roles pr
    join public.roles r on r.id = pr.role_id
    where pr.profile_id = (select auth.uid())
      and pr.is_active
      and r.is_active
      and r.name in ('Administrador', 'Director')
  );
$$;

create or replace function private.can_access_process(p_process_id uuid)
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select private.active_profile() and exists (
    select 1
    from public.electoral_processes ep
    where ep.id = p_process_id
      and ep.is_active
      and (
        private.has_director_scope()
        or (
          ep.accepts_registrations
          and (
            not ep.requires_jury_assignment
            or exists (
              select 1
              from public.profile_jury_assignments pja
              join public.special_juries sj on sj.id = pja.special_jury_id
              where pja.profile_id = (select auth.uid())
                and pja.is_active
                and sj.is_active
                and sj.electoral_process_id = ep.id
            )
          )
        )
      )
  );
$$;

create or replace function private.can_access_jury(p_jury_id uuid)
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select private.active_profile() and exists (
    select 1
    from public.special_juries sj
    join public.electoral_processes ep on ep.id = sj.electoral_process_id
    where sj.id = p_jury_id
      and sj.is_active
      and ep.is_active
      and (
        private.has_director_scope()
        or (
          ep.accepts_registrations
          and (
            not ep.requires_jury_assignment
            or exists (
              select 1
              from public.profile_jury_assignments pja
              where pja.profile_id = (select auth.uid())
                and pja.special_jury_id = sj.id
                and pja.is_active
            )
          )
        )
      )
  );
$$;

create or replace function private.can_access_activity(p_activity_id uuid, p_action text)
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select private.has_action('GREGACT', p_action) and exists (
    select 1
    from public.activity_registrations ar
    join public.electoral_processes ep on ep.id = ar.electoral_process_id
    where ar.id = p_activity_id
      and ar.is_active
      and ep.is_active
      and (
        (
          not ep.accepts_registrations
          and p_action = 'LIST'
          and private.has_director_scope()
        )
        or (
          ep.accepts_registrations
          and (
            ar.created_by = (select auth.uid())
            or private.has_director_scope()
            or (
              private.is_monitor()
              and (
                not ep.requires_jury_assignment
                or exists (
                  select 1
                  from public.profile_jury_assignments pja
                  where pja.profile_id = (select auth.uid())
                    and pja.special_jury_id = ar.special_jury_id
                    and pja.is_active
                )
              )
            )
          )
        )
      )
  );
$$;

revoke all on function private.has_director_scope() from public, anon, authenticated;
revoke all on function private.can_access_process(uuid) from public, anon, authenticated;
revoke all on function private.can_access_jury(uuid) from public, anon, authenticated;
revoke all on function private.can_access_activity(uuid,text) from public, anon, authenticated;
grant execute on function private.has_director_scope() to authenticated;
grant execute on function private.can_access_process(uuid) to authenticated;
grant execute on function private.can_access_jury(uuid) to authenticated;
grant execute on function private.can_access_activity(uuid,text) to authenticated;

drop policy if exists electoral_processes_read on public.electoral_processes;
create policy electoral_processes_read on public.electoral_processes
  for select to authenticated
  using (is_active and (select private.can_access_process(id)));

drop policy if exists activity_formats_read on public.activity_formats;
create policy activity_formats_read on public.activity_formats
  for select to authenticated
  using (is_active and (select private.can_access_process(electoral_process_id)));

drop policy if exists target_audiences_read on public.target_audiences;
create policy target_audiences_read on public.target_audiences
  for select to authenticated
  using (is_active and (select private.can_access_process(electoral_process_id)));

drop policy if exists special_juries_read on public.special_juries;
create policy special_juries_read on public.special_juries
  for select to authenticated
  using (is_active and (select private.can_access_jury(id)));

drop policy if exists activity_registrations_read on public.activity_registrations;
create policy activity_registrations_read on public.activity_registrations
  for select to authenticated
  using (
    is_active
    and (select private.has_action('GREGACT', 'LIST'))
    and exists (
      select 1
      from public.electoral_processes ep
      where ep.id = activity_registrations.electoral_process_id
        and ep.is_active
        and (
          (
            not ep.accepts_registrations
            and (select private.has_director_scope())
          )
          or (
            ep.accepts_registrations
            and (
              activity_registrations.created_by = (select auth.uid())
              or (select private.has_director_scope())
              or (
                (select private.is_monitor())
                and (
                  not ep.requires_jury_assignment
                  or exists (
                    select 1
                    from public.profile_jury_assignments pja
                    where pja.profile_id = (select auth.uid())
                      and pja.special_jury_id = activity_registrations.special_jury_id
                      and pja.is_active
                  )
                )
              )
            )
          )
        )
    )
  );
