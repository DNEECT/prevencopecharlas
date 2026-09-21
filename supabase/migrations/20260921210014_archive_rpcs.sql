-- Soft archive crosses a read policy that intentionally hides inactive rows.
-- Narrow RPCs authorize the actor and perform the transition atomically.
revoke update (is_active) on public.activity_types,
  public.activity_formats, public.activity_evidence from authenticated;

create function public.archive_activity_type(p_id uuid)
returns void language plpgsql security definer set search_path = pg_catalog as $$
begin
  if not private.has_action('GTIPACT', 'DELETE') then
    raise exception 'Not authorized to archive activity types' using errcode='42501';
  end if;
  update public.activity_types set is_active=false, updated_by=auth.uid()
    where id=p_id and is_active;
  if not found then raise exception 'Activity type unavailable' using errcode='P0002'; end if;
end;
$$;

create function public.archive_activity_format(p_id uuid)
returns void language plpgsql security definer set search_path = pg_catalog as $$
begin
  if not private.has_action('GFORACT', 'DELETE') then
    raise exception 'Not authorized to archive activity formats' using errcode='42501';
  end if;
  update public.activity_formats set is_active=false, updated_by=auth.uid()
    where id=p_id and is_active;
  if not found then raise exception 'Activity format unavailable' using errcode='P0002'; end if;
end;
$$;

create function public.archive_evidence(p_activity_id uuid, p_object_path text)
returns void language plpgsql security definer set search_path = pg_catalog as $$
begin
  if not private.can_access_activity(p_activity_id, 'EDIT') then
    raise exception 'Not authorized to archive evidence' using errcode='42501';
  end if;
  update public.activity_evidence set is_active=false, updated_by=auth.uid()
    where activity_id=p_activity_id and object_path=p_object_path and is_active;
  if not found then raise exception 'Evidence unavailable' using errcode='P0002'; end if;
end;
$$;

revoke all on function public.archive_activity_type(uuid),
  public.archive_activity_format(uuid), public.archive_evidence(uuid,text)
  from public, anon, authenticated;
grant execute on function public.archive_activity_type(uuid),
  public.archive_activity_format(uuid), public.archive_evidence(uuid,text)
  to authenticated;
