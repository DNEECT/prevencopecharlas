-- Auth owns credentials. This table holds only application identity and legacy mapping.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  legacy_user_id uuid unique,
  username varchar(20) not null,
  email varchar(100) not null,
  first_names varchar(100) not null,
  last_names varchar(100) not null,
  document_number varchar(50),
  document_type_legacy_id uuid,
  address varchar(100),
  birth_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  constraint profiles_username_not_blank check (length(btrim(username)) > 0),
  constraint profiles_email_not_blank check (length(btrim(email)) > 0)
);
create unique index profiles_username_casefold_key on public.profiles (lower(username));
create unique index profiles_email_casefold_key on public.profiles (lower(email));

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name varchar(50) not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  constraint roles_name_not_blank check (length(btrim(name)) > 0)
);

create table public.actions (
  id uuid primary key default gen_random_uuid(),
  abbreviation varchar(30) not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.modules(id) on delete restrict,
  abbreviation varchar(30) not null unique,
  name varchar(100) not null,
  route varchar(200),
  icon varchar(100),
  sort_order integer,
  is_functional boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  constraint modules_not_own_parent check (id is distinct from parent_id)
);
create index modules_parent_id_idx on public.modules(parent_id);

create table public.module_actions (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete restrict,
  action_id uuid not null references public.actions(id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  unique (module_id, action_id),
  unique (id, module_id)
);
create index module_actions_action_id_idx on public.module_actions(action_id);

create table public.role_modules (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles(id) on delete restrict,
  module_id uuid not null references public.modules(id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  unique (role_id, module_id),
  unique (id, module_id)
);
create index role_modules_module_id_idx on public.role_modules(module_id);

create table public.role_module_actions (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null,
  role_module_id uuid not null,
  module_action_id uuid not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  foreign key (role_module_id, module_id) references public.role_modules(id, module_id) on delete restrict,
  foreign key (module_action_id, module_id) references public.module_actions(id, module_id) on delete restrict,
  unique (role_module_id, module_action_id)
);
create index role_module_actions_module_action_id_idx on public.role_module_actions(module_action_id);

create table public.profile_roles (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict,
  is_active boolean not null default true,
  granted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (profile_id, role_id)
);
create index profile_roles_role_id_idx on public.profile_roles(role_id);

-- A newly created table must not become a Data API endpoint before its policy
-- and explicit grant are installed in a later migration.
revoke all on public.profiles, public.roles, public.actions, public.modules,
  public.module_actions, public.role_modules, public.role_module_actions,
  public.profile_roles from public, anon, authenticated;

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.actions enable row level security;
alter table public.modules enable row level security;
alter table public.module_actions enable row level security;
alter table public.role_modules enable row level security;
alter table public.role_module_actions enable row level security;
alter table public.profile_roles enable row level security;

create trigger profiles_touch_updated_at before update on public.profiles
  for each row execute function private.touch_updated_at();
create trigger roles_touch_updated_at before update on public.roles
  for each row execute function private.touch_updated_at();
create trigger actions_touch_updated_at before update on public.actions
  for each row execute function private.touch_updated_at();
create trigger modules_touch_updated_at before update on public.modules
  for each row execute function private.touch_updated_at();
create trigger module_actions_touch_updated_at before update on public.module_actions
  for each row execute function private.touch_updated_at();
create trigger role_modules_touch_updated_at before update on public.role_modules
  for each row execute function private.touch_updated_at();
create trigger role_module_actions_touch_updated_at before update on public.role_module_actions
  for each row execute function private.touch_updated_at();
create trigger profile_roles_touch_updated_at before update on public.profile_roles
  for each row execute function private.touch_updated_at();
