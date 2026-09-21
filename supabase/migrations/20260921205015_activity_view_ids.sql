-- Append the catalog IDs needed by the existing edit form, preserving the
-- original view column order and invoker RLS behavior.
create or replace view public.activity_list with (security_invoker = true) as
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
      and ae.is_active and ae.is_available order by ae.created_at desc limit 1) as photo_evidence_id,
  af.activity_type_id, af.next_number, ar.assistant_type_id,
  ar.target_audience_id, ar.electoral_process_id
from public.activity_registrations ar
join public.activity_formats af on af.id = ar.activity_format_id
join public.activity_types at on at.id = af.activity_type_id
join public.assistant_types ast on ast.id = ar.assistant_type_id
join public.target_audiences ta on ta.id = ar.target_audience_id
join public.electoral_processes ep on ep.id = ar.electoral_process_id
join public.special_juries sj on sj.id = ar.special_jury_id
where ar.is_active;
