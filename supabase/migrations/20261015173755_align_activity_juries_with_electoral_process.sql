-- The process-scoping migration created process-specific JEE rows after some
-- ERM activities had already been registered. Those activities retained the
-- identically named EG 2026 JEE ID, so assignment-based RLS hid them from the
-- corresponding ERM monitors. Resolve the historical IDs by process and name,
-- then enforce the relationship at the database boundary.

do $$
begin
  if exists (
    select 1
    from public.activity_registrations ar
    join public.special_juries old_sj on old_sj.id = ar.special_jury_id
    left join lateral (
      select count(*) as candidate_count
      from public.special_juries candidate_sj
      where candidate_sj.electoral_process_id = ar.electoral_process_id
        and lower(btrim(candidate_sj.jury_name)) = lower(btrim(old_sj.jury_name))
        and candidate_sj.is_active
    ) candidate on true
    where old_sj.electoral_process_id is distinct from ar.electoral_process_id
      and candidate.candidate_count <> 1
  ) then
    raise exception
      'Cannot align activity juries: every mismatched activity must have exactly one active jury with the same name in its electoral process';
  end if;
end;
$$;

update public.activity_registrations ar
set special_jury_id = candidate_sj.id
from public.special_juries old_sj,
     public.special_juries candidate_sj
where old_sj.id = ar.special_jury_id
  and old_sj.electoral_process_id is distinct from ar.electoral_process_id
  and candidate_sj.electoral_process_id = ar.electoral_process_id
  and lower(btrim(candidate_sj.jury_name)) = lower(btrim(old_sj.jury_name))
  and candidate_sj.is_active;

do $$
begin
  if exists (
    select 1
    from public.activity_registrations ar
    join public.special_juries sj on sj.id = ar.special_jury_id
    where sj.electoral_process_id is distinct from ar.electoral_process_id
  ) then
    raise exception 'Activity jury alignment left mismatched records';
  end if;
end;
$$;

create unique index if not exists special_juries_id_process_key
  on public.special_juries(id, electoral_process_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.special_juries'::regclass
      and conname = 'special_juries_id_process_key'
  ) then
    alter table public.special_juries
      add constraint special_juries_id_process_key
      unique using index special_juries_id_process_key;
  end if;
end;
$$;

create index if not exists activity_registrations_jury_process_idx
  on public.activity_registrations(special_jury_id, electoral_process_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.activity_registrations'::regclass
      and conname = 'activity_registrations_jury_process_fkey'
  ) then
    alter table public.activity_registrations
      add constraint activity_registrations_jury_process_fkey
      foreign key (special_jury_id, electoral_process_id)
      references public.special_juries(id, electoral_process_id)
      on delete restrict
      not valid;
  end if;
end;
$$;

alter table public.activity_registrations
  validate constraint activity_registrations_jury_process_fkey;
