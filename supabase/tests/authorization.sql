-- Run with: docker exec -i supabase_db_prevencopecharlas psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres < authorization.sql
-- All fixture data is rolled back, so this can run repeatedly on a local reset.
begin;

insert into auth.users(id,email) values
  ('00000000-0000-4000-8000-000000000201','monitor@example.invalid'),
  ('00000000-0000-4000-8000-000000000202','gestor-a@example.invalid'),
  ('00000000-0000-4000-8000-000000000203','gestor-b@example.invalid'),
  ('00000000-0000-4000-8000-000000000204','unprofiled@example.invalid');
insert into public.profiles(id,username,email,first_names,last_names) values
  ('00000000-0000-4000-8000-000000000201','test-monitor','monitor@example.invalid','Test','Monitor'),
  ('00000000-0000-4000-8000-000000000202','test-gestor-a','gestor-a@example.invalid','Test','Gestor A'),
  ('00000000-0000-4000-8000-000000000203','test-gestor-b','gestor-b@example.invalid','Test','Gestor B');
insert into public.roles(id,name) values
  ('00000000-0000-4000-8000-000000000205','Monitor'),
  ('00000000-0000-4000-8000-000000000206','Gestor');
insert into public.profile_roles(profile_id,role_id) values
  ('00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000205'),
  ('00000000-0000-4000-8000-000000000202','00000000-0000-4000-8000-000000000206'),
  ('00000000-0000-4000-8000-000000000203','00000000-0000-4000-8000-000000000206');
insert into public.modules(id,abbreviation,name) values
  ('00000000-0000-4000-8000-000000000207','GREGACT','Registration'),
  ('00000000-0000-4000-8000-000000000208','GTIPACT','Activity type');
insert into public.modules(id,abbreviation,name,is_functional) values
  ('00000000-0000-4000-8000-000000000301','GADM','Administration',true),
  ('00000000-0000-4000-8000-000000000302','GTOD','All',false);
update public.modules
set parent_id='00000000-0000-4000-8000-000000000301'
where id='00000000-0000-4000-8000-000000000208';
insert into public.actions(id,abbreviation) values
  ('00000000-0000-4000-8000-000000000209','LIST'),
  ('00000000-0000-4000-8000-000000000210','ADD'),
  ('00000000-0000-4000-8000-000000000211','EDIT'),
  ('00000000-0000-4000-8000-000000000212','DELETE');
insert into public.module_actions(id,module_id,action_id) values
  ('00000000-0000-4000-8000-000000000213','00000000-0000-4000-8000-000000000207','00000000-0000-4000-8000-000000000209'),
  ('00000000-0000-4000-8000-000000000214','00000000-0000-4000-8000-000000000207','00000000-0000-4000-8000-000000000210'),
  ('00000000-0000-4000-8000-000000000215','00000000-0000-4000-8000-000000000207','00000000-0000-4000-8000-000000000211'),
  ('00000000-0000-4000-8000-000000000216','00000000-0000-4000-8000-000000000207','00000000-0000-4000-8000-000000000212'),
  ('00000000-0000-4000-8000-000000000217','00000000-0000-4000-8000-000000000208','00000000-0000-4000-8000-000000000210'),
  ('00000000-0000-4000-8000-000000000303','00000000-0000-4000-8000-000000000208','00000000-0000-4000-8000-000000000209'),
  ('00000000-0000-4000-8000-000000000304','00000000-0000-4000-8000-000000000302','00000000-0000-4000-8000-000000000209');
insert into public.role_modules(id,role_id,module_id) values
  ('00000000-0000-4000-8000-000000000218','00000000-0000-4000-8000-000000000205','00000000-0000-4000-8000-000000000207'),
  ('00000000-0000-4000-8000-000000000219','00000000-0000-4000-8000-000000000205','00000000-0000-4000-8000-000000000208'),
  ('00000000-0000-4000-8000-000000000220','00000000-0000-4000-8000-000000000206','00000000-0000-4000-8000-000000000207'),
  ('00000000-0000-4000-8000-000000000305','00000000-0000-4000-8000-000000000205','00000000-0000-4000-8000-000000000302');
insert into public.role_module_actions(id,module_id,role_module_id,module_action_id,is_active) values
  ('00000000-0000-4000-8000-000000000221','00000000-0000-4000-8000-000000000207','00000000-0000-4000-8000-000000000218','00000000-0000-4000-8000-000000000213',true),
  ('00000000-0000-4000-8000-000000000222','00000000-0000-4000-8000-000000000207','00000000-0000-4000-8000-000000000218','00000000-0000-4000-8000-000000000214',true),
  ('00000000-0000-4000-8000-000000000223','00000000-0000-4000-8000-000000000207','00000000-0000-4000-8000-000000000218','00000000-0000-4000-8000-000000000215',true),
  ('00000000-0000-4000-8000-000000000224','00000000-0000-4000-8000-000000000207','00000000-0000-4000-8000-000000000220','00000000-0000-4000-8000-000000000213',true),
  ('00000000-0000-4000-8000-000000000225','00000000-0000-4000-8000-000000000207','00000000-0000-4000-8000-000000000220','00000000-0000-4000-8000-000000000214',true),
  ('00000000-0000-4000-8000-000000000226','00000000-0000-4000-8000-000000000207','00000000-0000-4000-8000-000000000220','00000000-0000-4000-8000-000000000215',true),
  ('00000000-0000-4000-8000-000000000227','00000000-0000-4000-8000-000000000207','00000000-0000-4000-8000-000000000220','00000000-0000-4000-8000-000000000216',false),
  ('00000000-0000-4000-8000-000000000228','00000000-0000-4000-8000-000000000208','00000000-0000-4000-8000-000000000219','00000000-0000-4000-8000-000000000217',true),
  ('00000000-0000-4000-8000-000000000306','00000000-0000-4000-8000-000000000208','00000000-0000-4000-8000-000000000219','00000000-0000-4000-8000-000000000303',true),
  ('00000000-0000-4000-8000-000000000307','00000000-0000-4000-8000-000000000302','00000000-0000-4000-8000-000000000305','00000000-0000-4000-8000-000000000304',true);

insert into public.activity_types(id,name) values ('00000000-0000-4000-8000-000000000229','Type');
insert into public.assistant_types(id,name) values ('00000000-0000-4000-8000-000000000230','Assistant');
insert into public.target_audiences(id,name) values ('00000000-0000-4000-8000-000000000231','Audience');
insert into public.electoral_processes(id,name) values ('00000000-0000-4000-8000-000000000232','Process');
insert into public.special_juries(id,jury_name) values ('00000000-0000-4000-8000-000000000233','Jury');
insert into public.activity_formats(id,activity_type_id,topic,series) values
  ('00000000-0000-4000-8000-000000000234','00000000-0000-4000-8000-000000000229','Topic','FIX');
insert into public.activity_registrations(id,code,activity_format_id,assistant_type_id,target_audience_id,electoral_process_id,special_jury_id,place,activity_date,activity_time,created_by) values
  ('00000000-0000-4000-8000-000000000235','FIX0001','00000000-0000-4000-8000-000000000234','00000000-0000-4000-8000-000000000230','00000000-0000-4000-8000-000000000231','00000000-0000-4000-8000-000000000232','00000000-0000-4000-8000-000000000233','Place A','2026-09-21','12:00','00000000-0000-4000-8000-000000000202'),
  ('00000000-0000-4000-8000-000000000236','FIX0002','00000000-0000-4000-8000-000000000234','00000000-0000-4000-8000-000000000230','00000000-0000-4000-8000-000000000231','00000000-0000-4000-8000-000000000232','00000000-0000-4000-8000-000000000233','Place B','2026-09-21','13:00','00000000-0000-4000-8000-000000000203');
insert into public.activity_participants(activity_id,dni,full_name) values
  ('00000000-0000-4000-8000-000000000235','12345678','One'),
  ('00000000-0000-4000-8000-000000000236','87654321','Two');
insert into public.activity_evidence(activity_id,kind,legacy_reference) values
  ('00000000-0000-4000-8000-000000000235','attendance-list','one.pdf'),
  ('00000000-0000-4000-8000-000000000236','attendance-list','two.pdf');

-- Exercise constraints and administration safeguards without changing the fixture.
do $$ begin
  begin
    insert into public.activity_formats(activity_type_id,topic,series) values
      ('00000000-0000-4000-8000-000000000229','Duplicate','FIX');
    raise exception 'duplicate active series was accepted';
  exception when unique_violation then null;
  end;
  begin
    insert into public.activity_registrations(code,activity_format_id,assistant_type_id,
      target_audience_id,electoral_process_id,special_jury_id,place,activity_date,activity_time,created_by)
      values ('FIX0001','00000000-0000-4000-8000-000000000234',
        '00000000-0000-4000-8000-000000000230',
        '00000000-0000-4000-8000-000000000231',
        '00000000-0000-4000-8000-000000000232',
        '00000000-0000-4000-8000-000000000233','Place','2026-09-21','14:00',
        '00000000-0000-4000-8000-000000000202');
    raise exception 'duplicate activity code was accepted';
  exception when unique_violation then null;
  end;
  begin
    insert into public.role_module_actions(module_id,role_module_id,module_action_id)
      values ('00000000-0000-4000-8000-000000000208',
        '00000000-0000-4000-8000-000000000220',
        '00000000-0000-4000-8000-000000000217');
    raise exception 'mismatched module/action relationship was accepted';
  exception when foreign_key_violation then null;
  end;
  begin
    update public.profiles set is_active=false
      where id='00000000-0000-4000-8000-000000000201';
    raise exception 'last Monitor profile was disabled';
  exception when check_violation then null;
  end;
  begin
    update public.profile_roles set is_active=false
      where profile_id='00000000-0000-4000-8000-000000000201';
    raise exception 'last Monitor role was disabled';
  exception when check_violation then null;
  end;
  begin
    update public.roles set is_active=false where name='Monitor';
    raise exception 'Monitor role was disabled';
  exception when check_violation then null;
  end;
  update public.profiles set last_names='Gestor A Updated'
    where id='00000000-0000-4000-8000-000000000202';
end $$;

do $$ begin
  if has_table_privilege('anon','public.activity_registrations','SELECT')
    or has_table_privilege('anon','public.profiles','SELECT')
    or has_table_privilege('authenticated','public.profile_roles','UPDATE')
    or has_table_privilege('authenticated','public.roles','INSERT')
    or has_function_privilege('authenticated','private.protect_last_monitor()','EXECUTE') then
    raise exception 'anonymous table grant detected';
  end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000204',true);
do $$ begin
  if (select count(*) from public.activity_registrations) <> 0
    or (select count(*) from public.profiles) <> 0
    or (select count(*) from public.activity_types) <> 0
    or (select count(*) from public.my_permissions()) <> 0
    or (select count(*) from public.my_roles()) <> 0 then
    raise exception 'unprofiled identity saw application rows';
  end if;
end $$;

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000202',true);
do $$ declare affected integer; begin
  if (select count(*) from public.activity_registrations) <> 1
    or (select count(*) from public.activity_list) <> 1
    or (select count(*) from public.activity_participants) <> 1
    or (select count(*) from public.activity_evidence) <> 1
    or (select count(*) from public.my_roles()) <> 1
    or private.has_action('GREGACT','DELETE') then
    raise exception 'Gestor scope or inactive grant mismatch';
  end if;
  begin
    insert into public.activity_types(name) values ('Unauthorized');
    raise exception 'Gestor catalog write was allowed';
  exception when insufficient_privilege then null;
  end;
  update public.profiles set first_names='Updated' where id=auth.uid();
  if not exists (select 1 from public.profiles where id=auth.uid() and first_names='Updated') then
    raise exception 'self profile update failed';
  end if;
  update public.profiles set first_names='Unauthorized'
    where id='00000000-0000-4000-8000-000000000203';
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'cross-user profile update succeeded';
  end if;
  begin
    insert into public.activity_evidence(activity_id,kind,object_path,original_name,mime_type,byte_size,is_available)
      values ('00000000-0000-4000-8000-000000000236','attendance-list',
        '00000000-0000-4000-8000-000000000236/attendance-list/other.pdf',
        'other.pdf','application/pdf',100,true);
    raise exception 'Gestor cross-user evidence write was allowed';
  exception when insufficient_privilege then null;
  end;
  insert into public.activity_evidence(activity_id,kind,object_path,original_name,mime_type,byte_size,is_available)
    values ('00000000-0000-4000-8000-000000000235','attendance-list',
      '00000000-0000-4000-8000-000000000235/attendance-list/own.pdf',
      'own.pdf','application/pdf',100,true);
end $$;

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000201',true);
do $$ begin
  if (select count(*) from public.activity_registrations) <> 2
    or (select count(*) from public.activity_list) <> 2
    or (select count(*) from public.activity_participants) <> 2
    or (select count(*) from public.activity_evidence) <> 3 then
    raise exception 'Monitor did not see all activities';
  end if;
  if not exists (
      select 1 from public.my_permissions()
      where module_abbreviation='GADM' and action_abbreviation='LIST'
    ) or not exists (
      select 1 from public.my_permissions()
      where module_abbreviation='GTIPACT'
        and parent_module_id='00000000-0000-4000-8000-000000000301'
        and action_abbreviation='LIST'
    ) or exists (
      select 1 from public.my_permissions() where module_abbreviation='GTOD'
    ) then
    raise exception 'navigation hierarchy or non-functional filtering mismatch';
  end if;
  insert into public.activity_types(name) values ('Authorized');
  if not exists (select 1 from public.activity_types
      where name = 'Authorized' and created_by = auth.uid()) then
    raise exception 'Monitor catalog write or audit actor failed';
  end if;
  insert into public.activity_evidence(activity_id,kind,object_path,original_name,mime_type,byte_size,is_available)
    values ('00000000-0000-4000-8000-000000000236','photographic-record',
      '00000000-0000-4000-8000-000000000236/photographic-record/monitor.jpg',
      'monitor.jpg','image/jpeg',100,true);
end $$;

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000202',true);
do $$ begin
  insert into storage.objects(bucket_id,name) values
    ('activity-evidence','00000000-0000-4000-8000-000000000235/attendance-list/own.pdf');
  begin
    insert into storage.objects(bucket_id,name) values
      ('activity-evidence','00000000-0000-4000-8000-000000000236/attendance-list/other.pdf');
    raise exception 'cross-user object upload was allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into storage.objects(bucket_id,name) values
      ('activity-evidence','00000000-0000-4000-8000-000000000235/photographic-record/new.pdf');
    raise exception 'new photographic PDF upload was allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into storage.objects(bucket_id,name) values
      ('activity-evidence','00000000-0000-4000-8000-000000000235/attendance-list/unsafe.exe');
    raise exception 'unsupported extension was allowed';
  exception when insufficient_privilege then null;
  end;
  if (select count(*) from storage.objects where bucket_id='activity-evidence') <> 1 then
    raise exception 'Gestor object scope failed';
  end if;
end $$;

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000201',true);
do $$ begin
  insert into storage.objects(bucket_id,name) values
    ('activity-evidence','00000000-0000-4000-8000-000000000236/photographic-record/monitor.jpg');
  if (select count(*) from storage.objects where bucket_id='activity-evidence') <> 2 then
    raise exception 'Monitor object scope failed';
  end if;
end $$;

set local role anon;
do $$ begin
  if (select count(*) from storage.objects where bucket_id='activity-evidence') <> 0 then
    raise exception 'anonymous object read was allowed';
  end if;
end $$;

-- POST-STORAGE SQL VERIFICATION: the HTTP test commits the fixture before this section.
reset role;
update public.role_module_actions set is_active=true
  where id='00000000-0000-4000-8000-000000000227';
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000202',true);
do $$ begin
  begin
    perform public.archive_activity('00000000-0000-4000-8000-000000000236');
    raise exception 'Gestor archived another creator activity';
  exception when insufficient_privilege then null;
  end;
  perform public.archive_activity('00000000-0000-4000-8000-000000000235');
  if exists (select 1 from public.activity_registrations
      where id='00000000-0000-4000-8000-000000000235')
    or exists (select 1 from public.activity_participants
      where activity_id='00000000-0000-4000-8000-000000000235') then
    raise exception 'archived activity remained visible to Gestor';
  end if;
end $$;

reset role;
insert into public.modules(id,abbreviation,name) values
  ('00000000-0000-4000-8000-000000000239','GFORACT','Format');
insert into public.module_actions(id,module_id,action_id) values
  ('00000000-0000-4000-8000-000000000237',
    '00000000-0000-4000-8000-000000000208','00000000-0000-4000-8000-000000000212'),
  ('00000000-0000-4000-8000-000000000240',
    '00000000-0000-4000-8000-000000000239','00000000-0000-4000-8000-000000000212');
insert into public.role_modules(id,role_id,module_id) values
  ('00000000-0000-4000-8000-000000000241',
    '00000000-0000-4000-8000-000000000205','00000000-0000-4000-8000-000000000239');
insert into public.role_module_actions(id,module_id,role_module_id,module_action_id) values
  ('00000000-0000-4000-8000-000000000238',
    '00000000-0000-4000-8000-000000000208',
    '00000000-0000-4000-8000-000000000219',
    '00000000-0000-4000-8000-000000000237'),
  ('00000000-0000-4000-8000-000000000242',
    '00000000-0000-4000-8000-000000000239',
    '00000000-0000-4000-8000-000000000241',
    '00000000-0000-4000-8000-000000000240');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000201',true);
select public.archive_activity_format('00000000-0000-4000-8000-000000000234');
select public.archive_activity_type('00000000-0000-4000-8000-000000000229');
reset role;
do $$ begin
  if exists (select 1 from public.activity_formats
      where id='00000000-0000-4000-8000-000000000234' and is_active)
    or exists (select 1 from public.activity_types
      where id='00000000-0000-4000-8000-000000000229' and is_active) then
    raise exception 'catalog archive RPC did not persist';
  end if;
end $$;

rollback;
