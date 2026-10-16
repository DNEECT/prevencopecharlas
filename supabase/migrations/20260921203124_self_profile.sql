-- Expose only the current actor's active roles. Membership remains protected.
create function public.my_roles()
returns table (id uuid, name text, description text)
language sql stable security definer
set search_path = pg_catalog
as $$
  select r.id, r.name::text, r.description
  from public.profile_roles pr
  join public.roles r on r.id = pr.role_id and r.is_active
  where pr.profile_id = (select auth.uid()) and pr.is_active
    and private.active_profile();
$$;
revoke all on function public.my_roles() from public, anon, authenticated;
grant execute on function public.my_roles() to authenticated;

-- Self-service fields never include role membership, activation, username,
-- email, legacy mapping, or audit fields.
grant update (first_names, last_names, document_number, address, birth_date)
  on public.profiles to authenticated;
create policy profiles_self_update on public.profiles for update to authenticated
  using (id = (select auth.uid()) and is_active)
  with check (id = (select auth.uid()) and is_active);
