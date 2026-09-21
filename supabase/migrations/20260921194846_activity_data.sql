-- The original business keys are already UUIDs. Explicit IDs on import keep
-- registration, participant, catalog, and jury relationships stable.
create table public.activity_types (
  id uuid primary key default gen_random_uuid(),
  name varchar(50) not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null
);

create table public.assistant_types (
  id uuid primary key default gen_random_uuid(),
  name varchar(50) not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null
);

create table public.target_audiences (
  id uuid primary key default gen_random_uuid(),
  name varchar(50) not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null
);

create table public.electoral_processes (
  id uuid primary key default gen_random_uuid(),
  name varchar(50) not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null
);

-- The legacy integer process code is metadata, not a foreign key to the
-- UUID electoral_processes table. A registration references both separately.
create table public.special_juries (
  id uuid primary key default gen_random_uuid(),
  jury_code integer,
  jury_name varchar(200) not null,
  source_process_code integer,
  department varchar(100),
  province varchar(100),
  ubigeo varchar(20),
  initials varchar(30),
  address text,
  phone varchar(50),
  office_hours text,
  opened_on date,
  jurisdiction_closed_on date,
  administratively_closed_on date,
  closure_record text,
  source_status_code integer,
  source_closed_parameter integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null
);
create index special_juries_process_code_idx on public.special_juries(source_process_code);

create table public.activity_formats (
  id uuid primary key default gen_random_uuid(),
  activity_type_id uuid not null references public.activity_types(id) on delete restrict,
  topic text not null,
  series varchar(20) not null,
  next_number integer not null default 1 check (next_number >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  constraint activity_formats_series_not_blank check (length(btrim(series)) > 0)
);
create unique index activity_formats_active_series_key
  on public.activity_formats (lower(series)) where is_active;
create index activity_formats_activity_type_id_idx on public.activity_formats(activity_type_id);

create table public.activity_registrations (
  id uuid primary key default gen_random_uuid(),
  code varchar(50) not null unique,
  activity_format_id uuid not null references public.activity_formats(id) on delete restrict,
  assistant_type_id uuid not null references public.assistant_types(id) on delete restrict,
  target_audience_id uuid not null references public.target_audiences(id) on delete restrict,
  electoral_process_id uuid not null references public.electoral_processes(id) on delete restrict,
  special_jury_id uuid not null references public.special_juries(id) on delete restrict,
  place text not null,
  activity_date date not null,
  activity_time time without time zone not null,
  observations text,
  questions text,
  recommendations text,
  legacy_attendance_path varchar(500),
  legacy_photo_path varchar(500),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete set null
);
create index activity_registrations_creator_active_idx
  on public.activity_registrations(created_by, created_at desc) where is_active;
create index activity_registrations_jury_active_idx
  on public.activity_registrations(special_jury_id, created_at desc) where is_active;
create index activity_registrations_format_idx
  on public.activity_registrations(activity_format_id);

-- Base columns tolerate the documented blank legacy values. A transactional
-- write function applies stricter validation to newly entered participants.
create table public.activity_participants (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activity_registrations(id) on delete restrict,
  dni varchar(8) not null,
  full_name varchar(200) not null,
  sex varchar(10),
  age integer,
  organization varchar(50),
  position varchar(50),
  phone varchar(20),
  email varchar(100),
  population varchar(100),
  legacy_validation_exceptions text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null
);
create index activity_participants_activity_active_idx
  on public.activity_participants(activity_id) where is_active;
create index activity_participants_dni_idx on public.activity_participants(dni);

create table public.activity_evidence (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activity_registrations(id) on delete restrict,
  kind text not null check (kind in ('attendance-list', 'photographic-record')),
  object_path text unique,
  original_name text,
  mime_type text,
  byte_size bigint check (byte_size is null or byte_size >= 0),
  legacy_reference varchar(500),
  is_available boolean not null default false,
  is_active boolean not null default true,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  constraint available_evidence_has_object check (not is_available or (object_path is not null and mime_type is not null and byte_size is not null))
);
create index activity_evidence_activity_kind_active_idx
  on public.activity_evidence(activity_id, kind) where is_active;

revoke all on public.activity_types, public.assistant_types, public.target_audiences,
  public.electoral_processes, public.special_juries, public.activity_formats,
  public.activity_registrations, public.activity_participants,
  public.activity_evidence from public, anon, authenticated;

alter table public.activity_types enable row level security;
alter table public.assistant_types enable row level security;
alter table public.target_audiences enable row level security;
alter table public.electoral_processes enable row level security;
alter table public.special_juries enable row level security;
alter table public.activity_formats enable row level security;
alter table public.activity_registrations enable row level security;
alter table public.activity_participants enable row level security;
alter table public.activity_evidence enable row level security;

create trigger activity_types_touch_updated_at before update on public.activity_types
  for each row execute function private.touch_updated_at();
create trigger assistant_types_touch_updated_at before update on public.assistant_types
  for each row execute function private.touch_updated_at();
create trigger target_audiences_touch_updated_at before update on public.target_audiences
  for each row execute function private.touch_updated_at();
create trigger electoral_processes_touch_updated_at before update on public.electoral_processes
  for each row execute function private.touch_updated_at();
create trigger special_juries_touch_updated_at before update on public.special_juries
  for each row execute function private.touch_updated_at();
create trigger activity_formats_touch_updated_at before update on public.activity_formats
  for each row execute function private.touch_updated_at();
create trigger activity_registrations_touch_updated_at before update on public.activity_registrations
  for each row execute function private.touch_updated_at();
create trigger activity_participants_touch_updated_at before update on public.activity_participants
  for each row execute function private.touch_updated_at();
create trigger activity_evidence_touch_updated_at before update on public.activity_evidence
  for each row execute function private.touch_updated_at();
