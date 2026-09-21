-- Import provenance is private and never an application Data API resource.
-- Raw source payloads and legacy credentials must stay outside this schema.
create schema legacy_import;
revoke all on schema legacy_import from public, anon, authenticated;
grant usage on schema legacy_import to service_role;

create table legacy_import.batches (
  id uuid primary key default gen_random_uuid(),
  source_sha256 text not null check (source_sha256 ~ '^[0-9a-f]{64}$'),
  source_label text not null,
  state text not null default 'prepared'
    check (state in ('prepared', 'applied', 'failed')),
  source_counts jsonb not null default '{}'::jsonb
    check (jsonb_typeof(source_counts) = 'object'),
  result_counts jsonb not null default '{}'::jsonb
    check (jsonb_typeof(result_counts) = 'object'),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table legacy_import.auth_user_map (
  legacy_user_id uuid primary key,
  auth_user_id uuid not null unique references auth.users(id) on delete restrict,
  batch_id uuid not null references legacy_import.batches(id) on delete restrict,
  mapped_at timestamptz not null default now()
);

create table legacy_import.record_ledger (
  source_table text not null check (source_table in (
    'usuario', 'usuariorol', 'registroactividad',
    'registroactividadparticipante', 'evidence'
  )),
  source_id uuid not null,
  destination_table text not null check (destination_table in (
    'profiles', 'profile_roles', 'activity_registrations',
    'activity_participants', 'activity_evidence'
  )),
  destination_id uuid,
  source_sha256 text not null check (source_sha256 ~ '^[0-9a-f]{64}$'),
  last_batch_id uuid not null references legacy_import.batches(id) on delete restrict,
  outcome text not null check (outcome in ('inserted', 'updated', 'skipped', 'blocked')),
  exception_classes text[] not null default '{}',
  reconciled_at timestamptz not null default now(),
  primary key (source_table, source_id),
  unique (destination_table, destination_id),
  check ((outcome = 'blocked') = (destination_id is null))
);
create index record_ledger_last_batch_idx
  on legacy_import.record_ledger(last_batch_id);

revoke all on all tables in schema legacy_import from public, anon, authenticated;
grant all on all tables in schema legacy_import to service_role;
alter default privileges in schema legacy_import revoke all on tables
  from public, anon, authenticated;

alter table legacy_import.batches enable row level security;
alter table legacy_import.auth_user_map enable row level security;
alter table legacy_import.record_ledger enable row level security;
