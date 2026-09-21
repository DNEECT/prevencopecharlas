-- Only operations that remove an existing active Monitor membership are
-- checked. This allows the first institutional Monitor to be bootstrapped.
create or replace function private.protect_last_monitor()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  removed_monitor boolean := false;
begin
  if tg_table_name = 'profiles' then
    removed_monitor := old.is_active and not new.is_active and exists (
      select 1 from public.profile_roles pr
      join public.roles r on r.id = pr.role_id
      where pr.profile_id = old.id and pr.is_active and r.is_active and r.name = 'Monitor'
    );
  elsif tg_table_name = 'profile_roles' then
    if tg_op = 'DELETE' then
      removed_monitor := old.is_active;
    else
      removed_monitor := old.is_active and (
        not new.is_active or new.profile_id is distinct from old.profile_id
        or new.role_id is distinct from old.role_id
      );
    end if;
    if removed_monitor then
      removed_monitor := exists (
        select 1 from public.roles r
        where r.id = old.role_id and r.is_active and r.name = 'Monitor'
      );
    end if;
  elsif tg_table_name = 'roles' then
    removed_monitor := old.is_active and old.name = 'Monitor'
      and (not new.is_active or new.name is distinct from old.name);
  end if;

  if removed_monitor and not exists (
    select 1 from public.profile_roles pr
    join public.profiles p on p.id = pr.profile_id
    join public.roles r on r.id = pr.role_id
    where p.is_active and pr.is_active and r.is_active and r.name = 'Monitor'
  ) then
    raise exception 'The last active Monitor administrator cannot be disabled or demoted'
      using errcode = '23514';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function private.protect_last_monitor() from public, anon, authenticated;

create trigger profiles_protect_last_monitor
  after update of is_active on public.profiles
  for each row execute function private.protect_last_monitor();
create trigger profile_roles_protect_last_monitor_update
  after update of is_active, profile_id, role_id on public.profile_roles
  for each row execute function private.protect_last_monitor();
create trigger profile_roles_protect_last_monitor_delete
  after delete on public.profile_roles
  for each row execute function private.protect_last_monitor();
create trigger roles_protect_last_monitor
  after update of is_active, name on public.roles
  for each row execute function private.protect_last_monitor();
