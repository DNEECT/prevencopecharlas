-- Keep the imported Monitor permission matrix unchanged. A separate role gives
-- the designated institutional administrator every active application action.
do $$
declare
  v_role_id uuid;
  v_profile_id uuid;
begin
  insert into public.roles (id, name, description, is_active)
  values (
    'a8f42e1c-9f7d-4f3c-8b5a-2d7e6c9a1042',
    'Administrador',
    'Acceso institucional completo a todos los módulos activos',
    true
  )
  on conflict (name) do update
    set description = excluded.description,
        is_active = true,
        updated_at = now()
  returning id into v_role_id;

  insert into public.role_modules (role_id, module_id, is_active)
  select v_role_id, m.id, true
  from public.modules m
  where m.is_active
  on conflict (role_id, module_id) do update
    set is_active = true,
        updated_at = now();

  insert into public.role_module_actions (
    module_id, role_module_id, module_action_id, is_active
  )
  select rm.module_id, rm.id, ma.id, true
  from public.role_modules rm
  join public.modules m on m.id = rm.module_id and m.is_active
  join public.module_actions ma on ma.module_id = rm.module_id and ma.is_active
  join public.actions a on a.id = ma.action_id and a.is_active
  where rm.role_id = v_role_id
  on conflict (role_module_id, module_action_id) do update
    set is_active = true,
        updated_at = now();

  select p.id into v_profile_id
  from public.profiles p
  where lower(p.email) = 'sfernandeza@jne.gob.pe';

  if v_profile_id is not null then
    insert into public.profile_roles (profile_id, role_id, is_active, granted_by)
    values (v_profile_id, v_role_id, true, v_profile_id)
    on conflict (profile_id, role_id) do update
      set is_active = true,
          granted_by = excluded.granted_by,
          updated_at = now();
  end if;
end;
$$;
