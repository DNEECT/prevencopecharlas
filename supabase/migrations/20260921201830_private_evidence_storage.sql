insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
) values (
  'activity-evidence', 'activity-evidence', false, 20 * 1024 * 1024,
  array[
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png', 'image/jpeg'
  ]
) on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function private.evidence_path_activity(p_name text)
returns uuid
language sql immutable
set search_path = pg_catalog
as $$
  select case when split_part(p_name, '/', 1) ~
    '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then split_part(p_name, '/', 1)::uuid else null end;
$$;

create or replace function private.valid_evidence_path(p_name text)
returns boolean
language sql immutable
set search_path = pg_catalog
as $$
  select p_name ~
    '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/(attendance-list|photographic-record)/[^/]+$';
$$;

revoke all on function private.evidence_path_activity(text) from public, anon, authenticated;
revoke all on function private.valid_evidence_path(text) from public, anon, authenticated;
grant execute on function private.evidence_path_activity(text) to authenticated;
grant execute on function private.valid_evidence_path(text) to authenticated;

create policy activity_evidence_objects_read on storage.objects
  for select to authenticated using (
    bucket_id = 'activity-evidence'
    and private.valid_evidence_path(name)
    and private.can_access_activity(private.evidence_path_activity(name), 'LIST')
  );

create policy activity_evidence_objects_insert on storage.objects
  for insert to authenticated with check (
    bucket_id = 'activity-evidence'
    and private.valid_evidence_path(name)
    and private.can_access_activity(private.evidence_path_activity(name), 'EDIT')
    and (
      ((storage.foldername(name))[2] = 'photographic-record'
        and lower(storage.extension(name)) in ('png', 'jpg', 'jpeg'))
      or ((storage.foldername(name))[2] = 'attendance-list'
        and lower(storage.extension(name)) in ('pdf', 'xls', 'xlsx', 'png', 'jpg', 'jpeg'))
    )
  );

create policy activity_evidence_objects_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'activity-evidence'
    and private.valid_evidence_path(name)
    and private.can_access_activity(private.evidence_path_activity(name), 'EDIT')
  )
  with check (
    bucket_id = 'activity-evidence'
    and private.valid_evidence_path(name)
    and private.can_access_activity(private.evidence_path_activity(name), 'EDIT')
    and (
      ((storage.foldername(name))[2] = 'photographic-record'
        and lower(storage.extension(name)) in ('png', 'jpg', 'jpeg'))
      or ((storage.foldername(name))[2] = 'attendance-list'
        and lower(storage.extension(name)) in ('pdf', 'xls', 'xlsx', 'png', 'jpg', 'jpeg'))
    )
  );

create policy activity_evidence_objects_delete on storage.objects
  for delete to authenticated using (
    bucket_id = 'activity-evidence'
    and private.valid_evidence_path(name)
    and private.can_access_activity(private.evidence_path_activity(name), 'EDIT')
  );
