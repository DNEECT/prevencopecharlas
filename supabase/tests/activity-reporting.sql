-- Run after a local reset. All synthetic fixtures are rolled back.
begin;

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000511', 'report-director@example.invalid'),
  ('00000000-0000-4000-8000-000000000512', 'report-gestor@example.invalid');

insert into public.profiles (id, username, email, first_names, last_names) values
  ('00000000-0000-4000-8000-000000000511', 'report-director',
   'report-director@example.invalid', 'Report', 'Director'),
  ('00000000-0000-4000-8000-000000000512', 'report-gestor',
   'report-gestor@example.invalid', 'Report', 'Gestor');

insert into public.profile_roles (profile_id, role_id) values
  ('00000000-0000-4000-8000-000000000511',
   'a8f42e1c-9f7d-4f3c-8b5a-2d7e6c9a1042'),
  ('00000000-0000-4000-8000-000000000512',
   '636e220a-a80a-4f02-912b-642d2579a99d');

insert into public.profile_jury_assignments (profile_id, special_jury_id)
select '00000000-0000-4000-8000-000000000512', id
from public.special_juries
where electoral_process_id = '57e96d43-5283-482b-a916-e21d72c7d605'
order by jury_code
limit 1;

insert into public.activity_registrations (
  id, code, activity_format_id, assistant_type_id, target_audience_id,
  electoral_process_id, special_jury_id, place, activity_date, activity_time,
  is_active, created_by
)
select
  fixture.id, fixture.code, af.id, ast.id, ta.id, ep.id, sj.id,
  'Synthetic authorization fixture', date '2026-10-01', time '09:00',
  fixture.is_active, fixture.created_by
from (
  values
    ('00000000-0000-4000-8000-000000000521'::uuid, 'REPORT-HIST',
     '29dc3419-0606-4a86-a816-9012a9414743'::uuid,
     '00000000-0000-4000-8000-000000000511'::uuid, true),
    ('00000000-0000-4000-8000-000000000522'::uuid, 'REPORT-GESTOR',
     '57e96d43-5283-482b-a916-e21d72c7d605'::uuid,
     '00000000-0000-4000-8000-000000000512'::uuid, true),
    ('00000000-0000-4000-8000-000000000523'::uuid, 'REPORT-OTHER',
     '57e96d43-5283-482b-a916-e21d72c7d605'::uuid,
     '00000000-0000-4000-8000-000000000511'::uuid, true),
    ('00000000-0000-4000-8000-000000000524'::uuid, 'REPORT-INACTIVE',
     '57e96d43-5283-482b-a916-e21d72c7d605'::uuid,
     '00000000-0000-4000-8000-000000000511'::uuid, false)
) fixture(id, code, process_id, created_by, is_active)
join public.electoral_processes ep on ep.id = fixture.process_id
cross join lateral (
  select id from public.activity_formats
  where electoral_process_id = ep.id and is_active order by id limit 1
) af
cross join lateral (
  select id from public.assistant_types where is_active order by id limit 1
) ast
cross join lateral (
  select id from public.target_audiences
  where electoral_process_id = ep.id and is_active order by id limit 1
) ta
cross join lateral (
  select id from public.special_juries
  where electoral_process_id = ep.id and is_active order by jury_code limit 1
) sj;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000511', true);

do $$
begin
  if public.count_authorized_activities(null, null, null) <> 3 then
    raise exception 'Director did not receive every authorized active activity';
  end if;
  if public.count_authorized_activities(
      '29dc3419-0606-4a86-a816-9012a9414743', null, null) <> 1 then
    raise exception 'Director historical-process filter returned an incorrect count';
  end if;
  if public.count_authorized_activities(null, null, 'REPORT-INACTIVE') <> 0 then
    raise exception 'Inactive activity was included in reporting';
  end if;
  if (select count(*) from public.activity_list where code like 'REPORT-%') <> 3 then
    raise exception 'Director list visibility differs from report count visibility';
  end if;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000512', true);

do $$
begin
  if public.count_authorized_activities(null, null, null) <> 1 then
    raise exception 'Restricted user received an out-of-scope or historical activity';
  end if;
  if public.count_authorized_activities(null, null, 'REPORT-GESTOR') <> 1 then
    raise exception 'Restricted user could not count its authorized activity';
  end if;
  if exists (
    select 1 from public.activity_list
    where code in ('REPORT-HIST', 'REPORT-OTHER', 'REPORT-INACTIVE')
  ) then
    raise exception 'Restricted list exposed historical, inactive, or out-of-scope rows';
  end if;
end $$;

reset role;

-- Representative historical volume for bounded list/export performance.
insert into public.activity_registrations (
  code, activity_format_id, assistant_type_id, target_audience_id,
  electoral_process_id, special_jury_id, place, activity_date, activity_time,
  created_at, created_by
)
select
  'REPORT-PERF-' || lpad(series::text, 6, '0'),
  af.id, ast.id, ta.id, ep.id, sj.id,
  'Synthetic performance fixture', date '2026-01-01' + (series % 250), time '09:00',
  timestamptz '2026-10-01 12:00:00+00' - (series * interval '1 second'),
  '00000000-0000-4000-8000-000000000511'
from generate_series(1, 1500) series
join public.electoral_processes ep
  on ep.id = '29dc3419-0606-4a86-a816-9012a9414743'
cross join lateral (
  select id from public.activity_formats
  where electoral_process_id = ep.id and is_active order by id limit 1
) af
cross join lateral (
  select id from public.assistant_types where is_active order by id limit 1
) ast
cross join lateral (
  select id from public.target_audiences
  where electoral_process_id = ep.id and is_active order by id limit 1
) ta
cross join lateral (
  select id from public.special_juries
  where electoral_process_id = ep.id and is_active order by jury_code limit 1
) sj;

analyze public.activity_registrations;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000511', true);
set local statement_timeout = '2s';

do $$
declare
  page_rows integer;
  export_rows integer;
  total_rows bigint;
begin
  select count(*) into page_rows from (
    select id from public.activity_list
    order by created_at desc, id desc
    limit 5
  ) page;
  select count(*) into export_rows from (
    select id from public.activity_list
    order by created_at desc, id desc
    limit 100
  ) export_page;
  total_rows := public.count_authorized_activities(null, null, null);

  if page_rows <> 5 or export_rows <> 100 or total_rows <> 1503 then
    raise exception 'Reporting performance fixture returned %, %, %',
      page_rows, export_rows, total_rows;
  end if;
end $$;

rollback;
