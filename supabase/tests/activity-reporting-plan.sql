-- Diagnostic only: creates synthetic historical volume in a transaction and rolls it back.
-- Run with:
-- docker exec -i supabase_db_prevencopecharlas psql -X -v ON_ERROR_STOP=1 \
--   -U postgres -d postgres < supabase/tests/activity-reporting-plan.sql
begin;

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000501', 'activity-report-director@example.invalid');

insert into public.profiles (id, username, email, first_names, last_names) values
  ('00000000-0000-4000-8000-000000000501', 'report-director',
   'activity-report-director@example.invalid', 'Activity Report', 'Director');

insert into public.profile_roles (profile_id, role_id) values
  ('00000000-0000-4000-8000-000000000501',
   'a8f42e1c-9f7d-4f3c-8b5a-2d7e6c9a1042');

insert into public.activity_registrations (
  code, activity_format_id, assistant_type_id, target_audience_id,
  electoral_process_id, special_jury_id, place, activity_date, activity_time,
  created_at, created_by
)
select
  'PERF' || lpad(series::text, 6, '0'),
  af.id,
  ast.id,
  ta.id,
  ep.id,
  sj.id,
  'Synthetic performance fixture',
  date '2026-01-01' + (series % 250),
  time '09:00',
  timestamptz '2026-10-01 12:00:00+00' - (series * interval '1 second'),
  '00000000-0000-4000-8000-000000000501'
from generate_series(1, 1500) series
cross join lateral (
  select id from public.electoral_processes
  where is_active order by accepts_registrations, id limit 1
) ep
cross join lateral (
  select id from public.activity_formats
  where is_active and electoral_process_id = ep.id order by id limit 1
) af
cross join lateral (
  select id from public.assistant_types where is_active order by id limit 1
) ast
cross join lateral (
  select id from public.target_audiences
  where is_active and electoral_process_id = ep.id order by id limit 1
) ta
cross join lateral (
  select id from public.special_juries
  where is_active and electoral_process_id = ep.id order by id limit 1
) sj;

insert into public.activity_participants (activity_id, dni, full_name)
select ar.id, lpad(participant::text, 8, '0'), 'Synthetic participant'
from public.activity_registrations ar
cross join generate_series(1, 3) participant
where ar.code like 'PERF%';

analyze public.activity_registrations;
analyze public.activity_participants;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000501',
  true
);

\timing on

savepoint expected_timeout;
set local statement_timeout = '500ms';
\set ON_ERROR_STOP off
\set VERBOSITY verbose
select *
from public.activity_list
order by created_at desc, id desc
limit 5;
\set VERBOSITY default
rollback to savepoint expected_timeout;
\set ON_ERROR_STOP on

explain (analyze, buffers, settings)
select *
from public.activity_list
order by created_at desc, id desc
limit 5;

explain (analyze, buffers, settings)
select count(*)
from public.activity_list;

explain (analyze, buffers, settings)
select *
from public.activity_list
where electoral_process_id = '29dc3419-0606-4a86-a816-9012a9414743'
order by created_at desc, id desc
limit 5;

rollback;
