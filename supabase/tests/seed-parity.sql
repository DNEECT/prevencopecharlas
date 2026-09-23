-- Run after a normal (seeded) local reset. This checks the reviewed source
-- permission matrix and lookup counts; it does not load personal records.
do $$
declare
  bad_rows integer;
begin
  if (select count(*) from public.roles where name in ('Monitor', 'Gestor')) <> 2
    or (select count(*) from public.actions) <> 6
    or (select count(*) from public.modules) <> 8
    or (select count(*) from public.module_actions) <> 21
    or (select count(*) from public.role_modules rm join public.roles r on r.id = rm.role_id where r.name in ('Monitor', 'Gestor')) <> 12
    or (select count(*) from public.role_module_actions rma join public.role_modules rm on rm.id = rma.role_module_id join public.roles r on r.id = rm.role_id where r.name in ('Monitor', 'Gestor')) <> 42
    or (select count(*) from public.role_module_actions rma join public.role_modules rm on rm.id = rma.role_module_id join public.roles r on r.id = rm.role_id where r.name in ('Monitor', 'Gestor') and not rma.is_active) <> 18 then
    raise exception 'Source role/action counts or inactive grants differ';
  end if;

  with actual as (
    select r.name as role_name, m.abbreviation as module_code,
      string_agg(a.abbreviation || '=' || case when g.is_active then 'on' else 'off' end,
        ';' order by a.abbreviation) as actions
    from public.role_module_actions g
    join public.role_modules rm on rm.id = g.role_module_id
    join public.roles r on r.id = rm.role_id
    join public.modules m on m.id = rm.module_id
    join public.module_actions ma on ma.id = g.module_action_id
    join public.actions a on a.id = ma.action_id
    where r.name in ('Monitor', 'Gestor')
    group by r.name, m.abbreviation
  ), expected(role_name, module_code, actions) as (values
    ('Monitor','GREGACT','ADD=on;APROVE=on;DELETE=on;EDIT=on;LIST=on;OBSERVE=on'),
    ('Monitor','GFORACT','ADD=on;DELETE=on;EDIT=on;LIST=on'),
    ('Monitor','GTIPACT','ADD=on;DELETE=on;EDIT=on;LIST=on'),
    ('Monitor','GUSU','ADD=on;DELETE=on;EDIT=on;LIST=on'),
    ('Monitor','GPRM','ADD=off;LIST=off'),
    ('Monitor','GTOD','LIST=on'),
    ('Gestor','GREGACT','ADD=on;APROVE=off;DELETE=on;EDIT=on;LIST=on;OBSERVE=off'),
    ('Gestor','GFORACT','ADD=off;DELETE=off;EDIT=off;LIST=off'),
    ('Gestor','GTIPACT','ADD=off;DELETE=off;EDIT=off;LIST=off'),
    ('Gestor','GUSU','ADD=off;DELETE=off;EDIT=off;LIST=off'),
    ('Gestor','GPRM','ADD=off;LIST=off'),
    ('Gestor','GTOD','LIST=on')
  )
  select count(*) into bad_rows from (
    (select * from actual except select * from expected)
    union all
    (select * from expected except select * from actual)
  ) differences;
  if bad_rows <> 0 then
    raise exception 'Source role/module/action matrix differs in % groups', bad_rows;
  end if;

  if not exists (
    select 1 from public.roles
    where id = 'a8f42e1c-9f7d-4f3c-8b5a-2d7e6c9a1042'
      and name = 'Administrador' and is_active
  ) or (
    select count(*)
    from public.role_module_actions rma
    join public.role_modules rm on rm.id = rma.role_module_id and rm.is_active
    join public.module_actions ma on ma.id = rma.module_action_id and ma.is_active
    join public.actions a on a.id = ma.action_id and a.is_active
    where rm.role_id = 'a8f42e1c-9f7d-4f3c-8b5a-2d7e6c9a1042'
      and rma.is_active
  ) <> 21 then
    raise exception 'Administrator role does not have every active module action';
  end if;

  if (select count(*) from public.activity_types) <> 1
    or (select count(*) from public.assistant_types) <> 7
    or (select count(*) from public.target_audiences) <> 11
    or (select count(*) from public.electoral_processes) <> 1
    or (select count(*) from public.activity_formats) <> 1
    or (select count(*) from public.special_juries) <> 61 then
    raise exception 'Source lookup catalog counts differ';
  end if;
  if not exists (
    select 1 from public.activity_formats
    where series = 'ACT009' and next_number = 1642
      and id = 'dfbfe5d6-d5c8-4224-a4ce-d840cc579e85'
  ) then
    raise exception 'Source format sequence differs from the highest imported code';
  end if;
  if not exists (
    select 1 from public.modules child join public.modules parent on parent.id = child.parent_id
    where child.abbreviation = 'GUSU' and parent.abbreviation = 'GSEG'
  ) or not exists (
    select 1 from public.modules child join public.modules parent on parent.id = child.parent_id
    where child.abbreviation = 'GFORACT' and parent.abbreviation = 'GADM'
  ) then
    raise exception 'Source module hierarchy differs';
  end if;
end $$;
