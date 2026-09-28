-- Assigned Gestores may select their JEE in the form, but activity rows remain
-- creator-scoped. Assigned Monitors supervise all activities for their JEE.
create or replace function private.can_access_activity(p_activity_id uuid, p_action text)
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select private.has_action('GREGACT', p_action) and exists (
    select 1
    from public.activity_registrations ar
    join public.electoral_processes ep on ep.id = ar.electoral_process_id
    where ar.id = p_activity_id and ar.is_active
      and (
        (
          not ep.accepts_registrations
          and p_action = 'LIST'
          and (private.is_monitor() or private.is_administrator())
        )
        or (
          ep.accepts_registrations
          and (
            ar.created_by = (select auth.uid())
            or private.is_administrator()
            or (
              private.is_monitor()
              and (
                not ep.requires_jury_assignment
                or exists (
                  select 1 from public.profile_jury_assignments pja
                  where pja.profile_id = (select auth.uid())
                    and pja.special_jury_id = ar.special_jury_id and pja.is_active
                )
              )
            )
          )
        )
      )
  );
$$;

revoke all on function private.can_access_activity(uuid,text)
  from public, anon, authenticated;
grant execute on function private.can_access_activity(uuid,text) to authenticated;
