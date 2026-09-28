-- Evaluate the current activity row directly. The previous helper looked the row
-- up again for every RLS check, which made exact-count list queries time out on
-- the 1,455 historical registrations.
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
            and (
              (select private.is_monitor())
              or (select private.is_administrator())
            )
          )
          or (
            ep.accepts_registrations
            and (
              activity_registrations.created_by = (select auth.uid())
              or (select private.is_administrator())
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
