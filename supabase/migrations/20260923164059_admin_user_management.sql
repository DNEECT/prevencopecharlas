-- Edge Functions use the service role for Auth administration. These narrow
-- RPCs keep application profile and role changes transactional while checking
-- the already-authenticated actor's live permission matrix.
create or replace function private.actor_has_action(
  p_actor uuid, p_module text, p_action text
)
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select p_actor is not null and exists (
    select 1
    from public.profiles p
    join public.profile_roles pr on pr.profile_id = p.id and pr.is_active
    join public.roles r on r.id = pr.role_id and r.is_active
    join public.role_modules rm on rm.role_id = r.id and rm.is_active
    join public.modules m on m.id = rm.module_id and m.is_active
    join public.role_module_actions rma on rma.role_module_id = rm.id and rma.is_active
    join public.module_actions ma on ma.id = rma.module_action_id
      and ma.module_id = m.id and ma.is_active
    join public.actions a on a.id = ma.action_id and a.is_active
    where p.id = p_actor and p.is_active
      and m.abbreviation = p_module and a.abbreviation = p_action
  );
$$;

create or replace function private.assert_admin_roles(p_role_ids uuid[])
returns void
language plpgsql security definer
set search_path = pg_catalog
as $$
begin
  if coalesce(cardinality(p_role_ids), 0) = 0
    or exists (select 1 from unnest(p_role_ids) as selected(id) where selected.id is null)
    or exists (
      select 1
      from (select distinct id from unnest(p_role_ids) as selected(id)) selected
      left join public.roles r on r.id = selected.id and r.is_active
      where r.id is null
    ) then
    raise exception 'Select at least one active role' using errcode = '22023';
  end if;
end;
$$;

revoke all on function private.actor_has_action(uuid, text, text)
  from public, anon, authenticated, service_role;
revoke all on function private.assert_admin_roles(uuid[])
  from public, anon, authenticated, service_role;

create or replace function public.service_create_user_profile(
  p_actor uuid,
  p_user_id uuid,
  p_document_number text,
  p_first_names text,
  p_last_names text,
  p_username text,
  p_email text,
  p_address text,
  p_birth_date date,
  p_role_ids uuid[]
)
returns void
language plpgsql security definer
set search_path = pg_catalog
as $$
begin
  if not private.actor_has_action(p_actor, 'GUSU', 'ADD') then
    raise exception 'Not authorized to create users' using errcode = '42501';
  end if;
  perform private.assert_admin_roles(p_role_ids);
  if not exists (
    select 1 from auth.users u
    where u.id = p_user_id and lower(u.email) = lower(btrim(p_email))
  ) then
    raise exception 'Auth identity does not match the requested profile'
      using errcode = '22023';
  end if;

  insert into public.profiles (
    id, username, email, first_names, last_names, document_number,
    address, birth_date, is_active, created_by, updated_by
  ) values (
    p_user_id, btrim(p_username), lower(btrim(p_email)), btrim(p_first_names),
    btrim(p_last_names), nullif(btrim(p_document_number), ''),
    nullif(btrim(p_address), ''), p_birth_date, true, p_actor, p_actor
  );

  insert into public.profile_roles (profile_id, role_id, is_active, granted_by)
  select p_user_id, selected.id, true, p_actor
  from (select distinct id from unnest(p_role_ids) as role_id(id)) selected;
end;
$$;

create or replace function public.service_update_user_profile(
  p_actor uuid,
  p_user_id uuid,
  p_document_number text,
  p_first_names text,
  p_last_names text,
  p_username text,
  p_email text,
  p_address text,
  p_birth_date date,
  p_role_ids uuid[]
)
returns void
language plpgsql security definer
set search_path = pg_catalog
as $$
begin
  if not private.actor_has_action(p_actor, 'GUSU', 'EDIT') then
    raise exception 'Not authorized to update users' using errcode = '42501';
  end if;
  perform private.assert_admin_roles(p_role_ids);
  if not exists (
    select 1 from auth.users u
    where u.id = p_user_id and lower(u.email) = lower(btrim(p_email))
  ) then
    raise exception 'Auth identity does not match the requested profile'
      using errcode = '22023';
  end if;

  update public.profiles
  set username = btrim(p_username), email = lower(btrim(p_email)),
      first_names = btrim(p_first_names), last_names = btrim(p_last_names),
      document_number = nullif(btrim(p_document_number), ''),
      address = nullif(btrim(p_address), ''), birth_date = p_birth_date,
      updated_by = p_actor
  where id = p_user_id;
  if not found then
    raise exception 'User profile not found' using errcode = 'P0002';
  end if;

  insert into public.profile_roles (profile_id, role_id, is_active, granted_by)
  select p_user_id, selected.id, true, p_actor
  from (select distinct id from unnest(p_role_ids) as role_id(id)) selected
  on conflict (profile_id, role_id) do update
    set is_active = true, granted_by = excluded.granted_by, updated_at = now();

  update public.profile_roles
  set is_active = false, granted_by = p_actor, updated_at = now()
  where profile_id = p_user_id and is_active
    and not (role_id = any(p_role_ids));
end;
$$;

create or replace function public.service_set_user_active(
  p_actor uuid, p_user_id uuid, p_active boolean
)
returns void
language plpgsql security definer
set search_path = pg_catalog
as $$
begin
  if not private.actor_has_action(p_actor, 'GUSU', 'DELETE') then
    raise exception 'Not authorized to change user status' using errcode = '42501';
  end if;
  update public.profiles
  set is_active = p_active, updated_by = p_actor
  where id = p_user_id;
  if not found then
    raise exception 'User profile not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.service_create_user_profile(
  uuid, uuid, text, text, text, text, text, text, date, uuid[]
) from public, anon, authenticated;
revoke all on function public.service_update_user_profile(
  uuid, uuid, text, text, text, text, text, text, date, uuid[]
) from public, anon, authenticated;
revoke all on function public.service_set_user_active(uuid, uuid, boolean)
  from public, anon, authenticated;

grant execute on function public.service_create_user_profile(
  uuid, uuid, text, text, text, text, text, text, date, uuid[]
) to service_role;
grant execute on function public.service_update_user_profile(
  uuid, uuid, text, text, text, text, text, text, date, uuid[]
) to service_role;
grant execute on function public.service_set_user_active(uuid, uuid, boolean)
  to service_role;
