-- Local browser-test fixture. Pass director_id from a local Auth Admin-created user.
\if :{?director_id}
\else
  \quit
\endif

insert into public.profiles (id, username, email, first_names, last_names)
values (
  :'director_id', 'report-e2e', 'director-e2e@example.invalid',
  'Report', 'E2E Director'
);

insert into public.profile_roles (profile_id, role_id)
values (:'director_id', 'a8f42e1c-9f7d-4f3c-8b5a-2d7e6c9a1042');

insert into public.activity_registrations (
  code, activity_format_id, assistant_type_id, target_audience_id,
  electoral_process_id, special_jury_id, place, activity_date, activity_time,
  created_at, created_by
)
select
  'E2E-REPORT-' || lpad(series::text, 4, '0'),
  af.id, ast.id, ta.id, ep.id, sj.id,
  'Synthetic browser fixture', date '2026-01-01' + (series % 250), time '09:00',
  timestamptz '2026-10-01 12:00:00+00' - (series * interval '1 second'),
  :'director_id'
from generate_series(1, 224) series
join public.electoral_processes ep on ep.id = case
  when series <= 112 then '29dc3419-0606-4a86-a816-9012a9414743'::uuid
  else '57e96d43-5283-482b-a916-e21d72c7d605'::uuid
end
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
