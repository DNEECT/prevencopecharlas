create or replace function private.insert_activity_participants(
  p_activity_id uuid, p_participants jsonb, p_actor uuid
)
returns void
language plpgsql
set search_path = pg_catalog
as $$
declare
  item jsonb;
  v_dni text;
  v_name text;
  v_sex text;
  v_organization text;
  v_age integer;
begin
  if p_participants is null or jsonb_typeof(p_participants) <> 'array' then
    raise exception 'Participants must be an array' using errcode = '22023';
  end if;

  for item in select value from jsonb_array_elements(p_participants) loop
    if jsonb_typeof(item) <> 'object' then
      raise exception 'Each participant must be an object' using errcode = '22023';
    end if;
    v_dni := nullif(btrim(item->>'dni'), '');
    v_name := nullif(btrim(item->>'nombresCompletos'), '');
    v_sex := nullif(btrim(item->>'sexo'), '');
    v_organization := nullif(btrim(item->>'organizacion'), '');
    v_age := (item->>'edad')::integer;
    if v_dni is null or v_dni !~ '^[0-9]{8}$'
      or v_name is null or v_sex is null or v_age is null or v_age < 0
      or v_organization is null then
      raise exception 'Invalid required participant fields' using errcode = '22023';
    end if;
    if nullif(btrim(item->>'correo'), '') is not null
      and (item->>'correo') !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
      raise exception 'Invalid participant email' using errcode = '22023';
    end if;

    insert into public.activity_participants (
      activity_id, dni, full_name, sex, age, organization, position,
      phone, email, population, created_by
    ) values (
      p_activity_id, v_dni, v_name, v_sex, v_age, v_organization,
      nullif(btrim(item->>'cargo'), ''), nullif(btrim(item->>'telefono'), ''),
      nullif(btrim(item->>'correo'), ''), nullif(btrim(item->>'poblacion'), ''), p_actor
    );
  end loop;
end;
$$;
revoke all on function private.insert_activity_participants(uuid, jsonb, uuid)
  from public, anon, authenticated;

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
  ) or not exists (select 1 from public.assistant_types where id = p_assistant_id and is_active)
    or not exists (select 1 from public.target_audiences where id = p_target_id and is_active)
    or not exists (select 1 from public.electoral_processes where id = p_process_id and is_active)
    or not exists (select 1 from public.special_juries where id = p_jury_id and is_active) then
    raise exception 'Missing or inactive activity catalog reference' using errcode = '23503';
  end if;
end;
$$;
revoke all on function private.assert_activity_catalogs(uuid, uuid, uuid, uuid, uuid)
  from public, anon, authenticated;

create or replace function public.create_activity(
  p_format_id uuid, p_assistant_id uuid, p_target_id uuid,
  p_process_id uuid, p_jury_id uuid, p_place text, p_date date, p_time time,
  p_observations text default null, p_questions text default null,
  p_recommendations text default null, p_participants jsonb default '[]'::jsonb
)
returns table(activity_id uuid, activity_code text)
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  actor uuid := auth.uid();
  v_series text;
  v_number integer;
  v_id uuid;
  v_code text;
begin
  if actor is null or not private.has_action('GREGACT', 'ADD') then
    raise exception 'Not authorized to register an activity' using errcode = '42501';
  end if;
  if nullif(btrim(p_place), '') is null or p_date is null or p_time is null then
    raise exception 'Place, date and time are required' using errcode = '22023';
  end if;

  perform private.assert_activity_catalogs(
    p_format_id, p_assistant_id, p_target_id, p_process_id, p_jury_id
  );
  select af.series, af.next_number into v_series, v_number
    from public.activity_formats af where af.id = p_format_id and af.is_active
    for update;
  if not found then
    raise exception 'Activity format is unavailable' using errcode = '23503';
  end if;
  v_code := v_series || lpad(v_number::text, greatest(4, length(v_number::text)), '0');

  insert into public.activity_registrations (
    code, activity_format_id, assistant_type_id, target_audience_id,
    electoral_process_id, special_jury_id, place, activity_date,
    activity_time, observations, questions, recommendations, created_by
  ) values (
    v_code, p_format_id, p_assistant_id, p_target_id,
    p_process_id, p_jury_id, btrim(p_place), p_date,
    p_time, p_observations, p_questions, p_recommendations, actor
  ) returning id into v_id;

  perform private.insert_activity_participants(v_id, p_participants, actor);
  update public.activity_formats set next_number = v_number + 1,
    updated_by = actor where id = p_format_id;
  return query select v_id, v_code;
end;
$$;

create or replace function public.replace_activity(
  p_activity_id uuid, p_format_id uuid, p_assistant_id uuid, p_target_id uuid,
  p_process_id uuid, p_jury_id uuid, p_place text, p_date date, p_time time,
  p_observations text default null, p_questions text default null,
  p_recommendations text default null, p_participants jsonb default '[]'::jsonb
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare actor uuid := auth.uid();
begin
  if actor is null or not private.can_access_activity(p_activity_id, 'EDIT') then
    raise exception 'Not authorized to edit this activity' using errcode = '42501';
  end if;
  if nullif(btrim(p_place), '') is null or p_date is null or p_time is null then
    raise exception 'Place, date and time are required' using errcode = '22023';
  end if;
  perform private.assert_activity_catalogs(
    p_format_id, p_assistant_id, p_target_id, p_process_id, p_jury_id
  );
  update public.activity_registrations set
    activity_format_id = p_format_id, assistant_type_id = p_assistant_id,
    target_audience_id = p_target_id, electoral_process_id = p_process_id,
    special_jury_id = p_jury_id, place = btrim(p_place),
    activity_date = p_date, activity_time = p_time,
    observations = p_observations, questions = p_questions,
    recommendations = p_recommendations, updated_by = actor
  where id = p_activity_id and is_active;
  update public.activity_participants set is_active = false, updated_by = actor
    where activity_id = p_activity_id and is_active;
  perform private.insert_activity_participants(p_activity_id, p_participants, actor);
end;
$$;

create or replace function public.archive_activity(p_activity_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if auth.uid() is null or not private.can_access_activity(p_activity_id, 'DELETE') then
    raise exception 'Not authorized to archive this activity' using errcode = '42501';
  end if;
  update public.activity_registrations set is_active = false,
    updated_by = auth.uid() where id = p_activity_id and is_active;
end;
$$;

revoke all on function public.create_activity(uuid,uuid,uuid,uuid,uuid,text,date,time,text,text,text,jsonb)
  from public, anon, authenticated;
revoke all on function public.replace_activity(uuid,uuid,uuid,uuid,uuid,uuid,text,date,time,text,text,text,jsonb)
  from public, anon, authenticated;
revoke all on function public.archive_activity(uuid) from public, anon, authenticated;
grant execute on function public.create_activity(uuid,uuid,uuid,uuid,uuid,text,date,time,text,text,text,jsonb)
  to authenticated;
grant execute on function public.replace_activity(uuid,uuid,uuid,uuid,uuid,uuid,text,date,time,text,text,text,jsonb)
  to authenticated;
grant execute on function public.archive_activity(uuid) to authenticated;

create view public.activity_list with (security_invoker = true) as
select ar.id, ar.code, ar.place, ar.activity_date, ar.activity_time,
  ar.is_active, ar.created_at, ar.created_by, ar.special_jury_id,
  ar.activity_format_id, af.topic, af.series,
  at.name as activity_type_name, ast.name as assistant_type_name,
  ta.name as target_audience_name, ep.name as electoral_process_name,
  sj.jury_name,
  (select count(*) from public.activity_participants ap
    where ap.activity_id = ar.id and ap.is_active) as participant_count,
  (select ae.id from public.activity_evidence ae
    where ae.activity_id = ar.id and ae.kind = 'attendance-list'
      and ae.is_active and ae.is_available order by ae.created_at desc limit 1) as attendance_evidence_id,
  (select ae.id from public.activity_evidence ae
    where ae.activity_id = ar.id and ae.kind = 'photographic-record'
      and ae.is_active and ae.is_available order by ae.created_at desc limit 1) as photo_evidence_id
from public.activity_registrations ar
join public.activity_formats af on af.id = ar.activity_format_id
join public.activity_types at on at.id = af.activity_type_id
join public.assistant_types ast on ast.id = ar.assistant_type_id
join public.target_audiences ta on ta.id = ar.target_audience_id
join public.electoral_processes ep on ep.id = ar.electoral_process_id
join public.special_juries sj on sj.id = ar.special_jury_id
where ar.is_active;

revoke all on public.activity_list from public, anon, authenticated;
