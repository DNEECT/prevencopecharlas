-- A trusted import/bootstrap process uses the service role. BYPASSRLS alone
-- does not supply table privileges after explicit default-deny revokes.
grant all on public.profiles, public.roles, public.actions, public.modules,
  public.module_actions, public.role_modules, public.role_module_actions,
  public.profile_roles, public.activity_types, public.assistant_types,
  public.target_audiences, public.electoral_processes, public.special_juries,
  public.activity_formats, public.activity_registrations,
  public.activity_participants, public.activity_evidence to service_role;
grant select on public.activity_list to service_role;
