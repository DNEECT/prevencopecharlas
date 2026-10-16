-- ERM process scoping was introduced after four activities had already been
-- registered with historical target-audience values that are not present in
-- the final ERM catalog. Preserve those classifications instead of silently
-- mapping them to a different audience, while allowing authorized users to
-- resolve the catalog row when rendering an activity they can access.

create index if not exists activity_registrations_target_audience_idx
  on public.activity_registrations(target_audience_id);

drop policy if exists target_audiences_read on public.target_audiences;
create policy target_audiences_read on public.target_audiences
  for select to authenticated
  using (
    (
      is_active
      and (select private.can_access_process(electoral_process_id))
    )
    or exists (
      select 1
      from public.activity_registrations ar
      where ar.target_audience_id = target_audiences.id
        and ar.is_active
        and private.can_access_activity(ar.id, 'LIST')
    )
  );

-- Formats are process-specific and every current activity already has a
-- matching format. Enforce that invariant for all future write paths, not only
-- the registration RPC validation.
create unique index if not exists activity_formats_id_process_key
  on public.activity_formats(id, electoral_process_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.activity_formats'::regclass
      and conname = 'activity_formats_id_process_key'
  ) then
    alter table public.activity_formats
      add constraint activity_formats_id_process_key
      unique using index activity_formats_id_process_key;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.activity_registrations'::regclass
      and conname = 'activity_registrations_format_process_fkey'
  ) then
    alter table public.activity_registrations
      add constraint activity_registrations_format_process_fkey
      foreign key (activity_format_id, electoral_process_id)
      references public.activity_formats(id, electoral_process_id)
      on delete restrict
      not valid;
  end if;
end;
$$;

alter table public.activity_registrations
  validate constraint activity_registrations_format_process_fkey;
