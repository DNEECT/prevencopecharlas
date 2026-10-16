-- ERM 2026 no longer asks users to classify the assistant type. Keep the
-- required relational value internally so historical General 2026 data and
-- the existing reporting schema remain intact.
insert into public.assistant_types (id, name, description, is_active)
values (
  'f2ca6657-8c06-4440-b0a9-d4321424b97e',
  'No aplica',
  'Valor interno para actividades ERM 2026; no se solicita al usuario.',
  true
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = true;

update public.target_audiences
set name = 'Gremios Empresariales',
    description = 'Gremios Empresariales',
    is_active = true
where id = '5b3857bf-f6dc-4a2e-a472-71514433e60c'
  and electoral_process_id = '57e96d43-5283-482b-a916-e21d72c7d605';

update public.target_audiences
set name = 'Organizaciones sociales y sociedad civil',
    description = 'Organizaciones sociales y sociedad civil',
    is_active = true
where id = '1bc4d952-e31f-4b41-bd59-72a26178f96e'
  and electoral_process_id = '57e96d43-5283-482b-a916-e21d72c7d605';

insert into public.target_audiences (
  id, name, description, is_active, electoral_process_id
) values
  ('a3bbc272-21d8-4317-960d-a2894465fa22', 'Asociaciones', 'Asociaciones', true, '57e96d43-5283-482b-a916-e21d72c7d605'),
  ('0f180a96-0ae2-48c8-a29f-2c9d3831185a', 'Estudiantes', 'Estudiantes', true, '57e96d43-5283-482b-a916-e21d72c7d605'),
  ('8164e6d3-7aaa-45d6-9090-d0c0bcf7c626', 'Organizaciones políticas', 'Organizaciones políticas', true, '57e96d43-5283-482b-a916-e21d72c7d605'),
  ('6b624d6b-c817-4633-9dfd-ad60ab99eba6', 'Sindicatos', 'Sindicatos', true, '57e96d43-5283-482b-a916-e21d72c7d605'),
  ('14a30514-e661-4c6c-a02d-4fc1206c7fed', 'Usuarios de programas sociales', 'Usuarios de programas sociales', true, '57e96d43-5283-482b-a916-e21d72c7d605')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = true,
  electoral_process_id = excluded.electoral_process_id;

update public.target_audiences
set is_active = false
where electoral_process_id = '57e96d43-5283-482b-a916-e21d72c7d605'
  and id not in (
    '1bc4d952-e31f-4b41-bd59-72a26178f96e',
    '6bf75462-dcf1-4e04-8d02-5f0fae670c08',
    'f6aaaf83-839b-4d0b-9a3c-ece408d53fe1',
    '71502eaf-6807-4e34-8aa7-a18abc72b05e',
    'f5ec0b4b-fd6d-4ce9-88ef-8f3b897e922e',
    '2cea6257-946c-418b-92ed-9403f82da392',
    '5b3857bf-f6dc-4a2e-a472-71514433e60c',
    'a3bbc272-21d8-4317-960d-a2894465fa22',
    '0f180a96-0ae2-48c8-a29f-2c9d3831185a',
    '8164e6d3-7aaa-45d6-9090-d0c0bcf7c626',
    '6b624d6b-c817-4633-9dfd-ad60ab99eba6',
    '14a30514-e661-4c6c-a02d-4fc1206c7fed'
  );

create or replace function private.assert_activity_catalogs(
  p_format_id uuid, p_assistant_id uuid, p_target_id uuid,
  p_process_id uuid, p_jury_id uuid
)
returns void
language plpgsql
set search_path = pg_catalog
as $$
begin
  if not exists (
    select 1 from public.activity_formats af
    join public.activity_types at on at.id = af.activity_type_id and at.is_active
    where af.id = p_format_id and af.is_active
      and af.electoral_process_id = p_process_id
  ) or not exists (select 1 from public.assistant_types where id = p_assistant_id and is_active)
    or not exists (
      select 1 from public.target_audiences
      where id = p_target_id and is_active and electoral_process_id = p_process_id
    ) or not exists (
      select 1 from public.electoral_processes
      where id = p_process_id and is_active and accepts_registrations
    )
    or not exists (
      select 1 from public.special_juries
      where id = p_jury_id and is_active and electoral_process_id = p_process_id
    )
    or (
      p_process_id = '57e96d43-5283-482b-a916-e21d72c7d605'
      and p_assistant_id <> 'f2ca6657-8c06-4440-b0a9-d4321424b97e'
    ) then
    raise exception 'Missing, inactive, or mismatched activity catalog reference'
      using errcode = '23503';
  end if;
end;
$$;

revoke all on function private.assert_activity_catalogs(uuid,uuid,uuid,uuid,uuid)
  from public, anon, authenticated;
