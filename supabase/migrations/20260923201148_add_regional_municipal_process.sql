alter table public.electoral_processes
  add column is_default boolean not null default false;

alter table public.electoral_processes
  add constraint electoral_processes_default_is_active
  check (not is_default or is_active);

insert into public.electoral_processes (
  id, name, description, is_active, is_default
)
select
  '57e96d43-5283-482b-a916-e21d72c7d605',
  'Elecciones Regionales Municipales 2026',
  'Elecciones Regionales Municipales 2026',
  true,
  false
where not exists (
  select 1
  from public.electoral_processes
  where lower(name) = lower('Elecciones Regionales Municipales 2026')
);

update public.electoral_processes
set is_default = false
where is_default;

update public.electoral_processes
set is_active = true,
    is_default = true
where lower(name) = lower('Elecciones Regionales Municipales 2026');

create unique index electoral_processes_single_default_idx
  on public.electoral_processes (is_default)
  where is_default;
