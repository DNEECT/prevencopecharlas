-- Run after a local reset. All fixtures are rolled back.
begin;

insert into auth.users(id,email) values
  ('00000000-0000-4000-8000-000000000401','erm-gestor@example.invalid'),
  ('00000000-0000-4000-8000-000000000402','erm-monitor@example.invalid'),
  ('00000000-0000-4000-8000-000000000403','erm-admin@example.invalid');
insert into public.profiles(id,username,email,first_names,last_names) values
  ('00000000-0000-4000-8000-000000000401','erm-gestor','erm-gestor@example.invalid','ERM','Gestor'),
  ('00000000-0000-4000-8000-000000000402','erm-monitor','erm-monitor@example.invalid','ERM','Monitor'),
  ('00000000-0000-4000-8000-000000000403','erm-admin','erm-admin@example.invalid','ERM','Admin');
insert into public.profile_roles(profile_id,role_id) values
  ('00000000-0000-4000-8000-000000000401','636e220a-a80a-4f02-912b-642d2579a99d'),
  ('00000000-0000-4000-8000-000000000402','c943392f-1485-464d-a564-e1867cc9886c'),
  ('00000000-0000-4000-8000-000000000403','c943392f-1485-464d-a564-e1867cc9886c'),
  ('00000000-0000-4000-8000-000000000403','a8f42e1c-9f7d-4f3c-8b5a-2d7e6c9a1042');

insert into public.profile_jury_assignments(profile_id,special_jury_id)
select '00000000-0000-4000-8000-000000000401', id
from public.special_juries
where electoral_process_id='57e96d43-5283-482b-a916-e21d72c7d605'
order by jury_code limit 1;
insert into public.profile_jury_assignments(profile_id,special_jury_id)
select '00000000-0000-4000-8000-000000000402', id
from public.special_juries
where electoral_process_id='57e96d43-5283-482b-a916-e21d72c7d605'
order by jury_code limit 1;

insert into public.activity_registrations(
  id,code,activity_format_id,assistant_type_id,target_audience_id,
  electoral_process_id,special_jury_id,place,activity_date,activity_time,created_by
)
select
  '00000000-0000-4000-8000-000000000410','HIST-TEST',
  (select id from public.activity_formats where electoral_process_id='29dc3419-0606-4a86-a816-9012a9414743' limit 1),
  'd518206d-3aea-49f3-95c3-bf93d43b82a9',
  (select id from public.target_audiences where electoral_process_id='29dc3419-0606-4a86-a816-9012a9414743' limit 1),
  '29dc3419-0606-4a86-a816-9012a9414743',
  (select id from public.special_juries where electoral_process_id='29dc3419-0606-4a86-a816-9012a9414743' limit 1),
  'Historical place','2026-09-01','09:00','00000000-0000-4000-8000-000000000401';

insert into public.activity_registrations(
  id,code,activity_format_id,assistant_type_id,target_audience_id,
  electoral_process_id,special_jury_id,place,activity_date,activity_time,created_by
)
select
  '00000000-0000-4000-8000-000000000411','ERM-A-TEST',
  (select id from public.activity_formats where electoral_process_id='57e96d43-5283-482b-a916-e21d72c7d605' limit 1),
  'd518206d-3aea-49f3-95c3-bf93d43b82a9',
  (select id from public.target_audiences where electoral_process_id='57e96d43-5283-482b-a916-e21d72c7d605' limit 1),
  '57e96d43-5283-482b-a916-e21d72c7d605',
  (select id from public.special_juries where electoral_process_id='57e96d43-5283-482b-a916-e21d72c7d605' order by jury_code limit 1),
  'ERM place A','2026-09-28','10:00','00000000-0000-4000-8000-000000000401';

insert into public.activity_registrations(
  id,code,activity_format_id,assistant_type_id,target_audience_id,
  electoral_process_id,special_jury_id,place,activity_date,activity_time,created_by
)
select
  '00000000-0000-4000-8000-000000000412','ERM-B-TEST',
  (select id from public.activity_formats where electoral_process_id='57e96d43-5283-482b-a916-e21d72c7d605' limit 1),
  'd518206d-3aea-49f3-95c3-bf93d43b82a9',
  (select id from public.target_audiences where electoral_process_id='57e96d43-5283-482b-a916-e21d72c7d605' limit 1),
  '57e96d43-5283-482b-a916-e21d72c7d605',
  (select id from public.special_juries where electoral_process_id='57e96d43-5283-482b-a916-e21d72c7d605' order by jury_code offset 1 limit 1),
  'ERM place B','2026-09-28','11:00','00000000-0000-4000-8000-000000000403';

insert into public.activity_registrations(
  id,code,activity_format_id,assistant_type_id,target_audience_id,
  electoral_process_id,special_jury_id,place,activity_date,activity_time,created_by
)
select
  '00000000-0000-4000-8000-000000000413','ERM-A-OTHER',
  (select id from public.activity_formats where electoral_process_id='57e96d43-5283-482b-a916-e21d72c7d605' limit 1),
  'd518206d-3aea-49f3-95c3-bf93d43b82a9',
  (select id from public.target_audiences where electoral_process_id='57e96d43-5283-482b-a916-e21d72c7d605' limit 1),
  '57e96d43-5283-482b-a916-e21d72c7d605',
  (select id from public.special_juries where electoral_process_id='57e96d43-5283-482b-a916-e21d72c7d605' order by jury_code limit 1),
  'ERM place A other','2026-09-28','11:30','00000000-0000-4000-8000-000000000403';

set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000401',true);
do $$ begin
  if exists (select 1 from public.activity_registrations where code='HIST-TEST') then
    raise exception 'Gestor saw a historical General 2026 record';
  end if;
  if exists (select 1 from public.activity_registrations where code='ERM-A-OTHER') then
    raise exception 'Gestor saw another creator activity in the assigned JEE';
  end if;
  if (select count(*) from public.special_juries
      where electoral_process_id='57e96d43-5283-482b-a916-e21d72c7d605') <> 1 then
    raise exception 'Gestor did not receive exactly its assigned ERM JEE';
  end if;
  if exists (select 1 from public.special_juries
      where electoral_process_id='29dc3419-0606-4a86-a816-9012a9414743') then
    raise exception 'Gestor saw historical General 2026 JEE';
  end if;
  begin
    perform public.create_activity(
      (select id from public.activity_formats where series='ACT009'),
      'd518206d-3aea-49f3-95c3-bf93d43b82a9',
      (select id from public.target_audiences where electoral_process_id='29dc3419-0606-4a86-a816-9012a9414743' limit 1),
      '29dc3419-0606-4a86-a816-9012a9414743',
      (select id from public.special_juries where electoral_process_id='29dc3419-0606-4a86-a816-9012a9414743' limit 1),
      'Forbidden','2026-09-28','12:00',null,null,null,'[]'::jsonb
    );
    raise exception 'Gestor created an activity in the historical process';
  exception when foreign_key_violation then null;
  end;
end $$;

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000402',true);
do $$ begin
  if not exists (select 1 from public.activity_registrations where code='HIST-TEST')
    or not exists (select 1 from public.activity_registrations where code='ERM-A-TEST')
    or not exists (select 1 from public.activity_registrations where code='ERM-A-OTHER')
    or exists (select 1 from public.activity_registrations where code='ERM-B-TEST') then
    raise exception 'Monitor historical or assigned-JEE read scope is incorrect';
  end if;
  begin
    perform public.archive_activity('00000000-0000-4000-8000-000000000410');
    raise exception 'Monitor modified a historical General 2026 record';
  exception when insufficient_privilege then null;
  end;
end $$;

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000403',true);
do $$ begin
  if (select count(*) from public.activity_registrations
      where code in ('HIST-TEST','ERM-A-TEST','ERM-B-TEST','ERM-A-OTHER')) <> 4 then
    raise exception 'Administrator did not retain global read scope';
  end if;
end $$;

rollback;
