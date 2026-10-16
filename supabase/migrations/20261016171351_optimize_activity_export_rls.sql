-- Resolve child-row visibility through the parent activity's existing RLS
-- policy. This preserves the same authorization boundary while avoiding a
-- SECURITY DEFINER helper call for every participant/evidence row materialized
-- by activity_list (notably participant_count during large exports).
drop policy if exists activity_participants_read on public.activity_participants;
create policy activity_participants_read on public.activity_participants
  for select to authenticated
  using (
    is_active
    and exists (
      select 1
      from public.activity_registrations ar
      where ar.id = activity_participants.activity_id
    )
  );

drop policy if exists activity_evidence_read on public.activity_evidence;
create policy activity_evidence_read on public.activity_evidence
  for select to authenticated
  using (
    is_active
    and exists (
      select 1
      from public.activity_registrations ar
      where ar.id = activity_evidence.activity_id
    )
  );
