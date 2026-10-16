-- Run against a seeded local reset with psql -v ON_ERROR_STOP=1.
-- All synthetic import provenance is rolled back.
begin;

insert into auth.users(id, email) values
  ('00000000-0000-4000-8000-000000000301', 'import-fixture@example.invalid');
insert into legacy_import.batches(id, source_sha256, source_label) values
  ('00000000-0000-4000-8000-000000000302', repeat('a', 64), 'fixture');

insert into legacy_import.auth_user_map(legacy_user_id, auth_user_id, batch_id) values
  ('00000000-0000-4000-8000-000000000303',
   '00000000-0000-4000-8000-000000000301',
   '00000000-0000-4000-8000-000000000302')
on conflict (legacy_user_id) do update
  set auth_user_id = excluded.auth_user_id, batch_id = excluded.batch_id;
insert into legacy_import.auth_user_map(legacy_user_id, auth_user_id, batch_id) values
  ('00000000-0000-4000-8000-000000000303',
   '00000000-0000-4000-8000-000000000301',
   '00000000-0000-4000-8000-000000000302')
on conflict (legacy_user_id) do update
  set auth_user_id = excluded.auth_user_id, batch_id = excluded.batch_id;

insert into legacy_import.record_ledger(
  source_table, source_id, destination_table, destination_id,
  source_sha256, last_batch_id, outcome
) values (
  'usuario', '00000000-0000-4000-8000-000000000303', 'profiles',
  '00000000-0000-4000-8000-000000000301', repeat('a', 64),
  '00000000-0000-4000-8000-000000000302', 'inserted'
)
on conflict (source_table, source_id) do update
  set destination_id = excluded.destination_id,
      last_batch_id = excluded.last_batch_id,
      outcome = 'skipped';
insert into legacy_import.record_ledger(
  source_table, source_id, destination_table, destination_id,
  source_sha256, last_batch_id, outcome
) values (
  'usuario', '00000000-0000-4000-8000-000000000303', 'profiles',
  '00000000-0000-4000-8000-000000000301', repeat('a', 64),
  '00000000-0000-4000-8000-000000000302', 'inserted'
)
on conflict (source_table, source_id) do update
  set destination_id = excluded.destination_id,
      last_batch_id = excluded.last_batch_id,
      outcome = 'skipped';

do $$
begin
  if (select count(*) from legacy_import.auth_user_map) <> 1
    or (select count(*) from legacy_import.record_ledger) <> 1
    or (select outcome from legacy_import.record_ledger
        where source_table = 'usuario') <> 'skipped' then
    raise exception 'Repeated import provenance was not idempotent';
  end if;
  if has_schema_privilege('anon', 'legacy_import', 'USAGE')
    or has_schema_privilege('authenticated', 'legacy_import', 'USAGE')
    or has_table_privilege('authenticated', 'legacy_import.record_ledger', 'SELECT') then
    raise exception 'Import provenance is browser-accessible';
  end if;
end $$;

rollback;
