-- Local browser-test cleanup. Pass the same director_id used by setup.
\if :{?director_id}
\else
  \quit
\endif

delete from public.activity_registrations
where created_by = :'director_id' and code like 'E2E-REPORT-%';
delete from public.profiles where id = :'director_id';
