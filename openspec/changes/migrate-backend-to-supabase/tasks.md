# Tasks

## 1. Database Foundation

- [x] 1.1 Add the core migration with required extensions, protected helper schema, audit timestamp helpers, and explicit privilege defaults; verify a schema-only database reset completes without SQL errors.
- [x] 1.2 Add Auth-linked profiles with unique legacy user UUIDs; roles, hierarchical modules, actions, role-module-action grants, and profile-role membership; verify the source permission relationships and uniqueness constraints.
- [x] 1.3 Add activity types, assistant types, target audiences, electoral processes, juries, formats, registrations, participants, and evidence metadata using legacy business UUIDs and soft-active state; verify valid fixtures insert and invalid references fail without inventing a jury/process foreign key.
- [x] 1.4 Add archival safeguards, including protection against disabling or demoting the final active Monitor administrator; verify the last-Monitor operation is rejected while ordinary profile updates succeed.
- [x] 1.5 Add atomic activity-code generation using series plus a four-digit padded counter, transactional registration/participant RPCs, and invoker-security read views; verify concurrent calls cannot create duplicate codes and imported sequence state is respected.
- [x] 1.6 Seed the 42 source role/action grants, module hierarchy, Monitor/Gestor roles, and known non-sensitive catalogs; verify disabled grants remain disabled and repeated seeds do not duplicate rows.

## 2. Database and Storage Authorization

- [x] 2.1 Add protected active-profile, effective-action, Monitor-administrator, and Gestor-creator-scope helpers with fixed search paths; verify ordinary authenticated users cannot alter privileged helpers or spoof an actor.
- [x] 2.2 Revoke anonymous application privileges, enable RLS on every exposed application table, and add profile and authorization policies; verify an anonymous client and an authenticated identity without a profile receive no application rows.
- [x] 2.3 Add Monitor administrative/global policies and Gestor creator-scoped policies for catalogs, formats, registrations, participants, and evidence metadata; verify direct cross-user reads/writes and inactive grants follow the source matrix.
- [x] 2.4 Create the private `activity-evidence` bucket with 20 MiB and MIME restrictions plus path-based object policies; verify normal uploads, historical photographic PDF import, anonymous denial, creator scope, and authorized signed downloads.
- [x] 2.5 Add SQL verification scripts for constraints, grants, RLS, role changes, archival behavior, and storage policy helpers; verify all scripts pass against a freshly reset database.

## 3. Supabase Project Deployment

- [x] 3.1 Authenticate and link the Supabase CLI only to project `betgsxbtyckbbiepmols`, without changing the existing Vercel CLI session; verify `supabase projects list`, link metadata, and the isolated `vercel whoami` show the intended independent accounts.
- [x] 3.2 Preview the remote migration plan, apply the reviewed migrations and seeds, and verify the hosted migration history, tables, policies, private bucket, and project health.
- [x] 3.3 Bootstrap the first institutional Monitor administrator through a documented administrative flow and verify sign-in while role membership remains protected from browser self-editing.
- [x] 3.4 Run Supabase security and performance advisors after deployment, resolve findings introduced by this change, and record a clean or explained advisor result.

## 4. Angular Authentication and Data Access

- [x] 4.1 Configure the public Supabase project URL and publishable key through Angular environment handling without committing secrets; verify local and production builds contain no secret or service-role value.
- [x] 4.2 Replace legacy login, logout, session persistence, and password update calls with Supabase Auth and active-profile loading; verify valid, invalid, disabled-profile, refresh, and sign-out flows.
- [x] 4.3 Replace JWT parsing and permission guards with effective hierarchical module/action permissions while retaining database RLS as enforcement; verify navigation hides disabled grants and direct requests are still denied.
- [x] 4.4 Migrate catalog and activity-format repositories to typed Supabase queries and RPCs with Spanish interface mapping; verify list, create, edit, archive, and generated-code screens behave as before.
- [x] 4.5 Migrate registration and participant repositories to transactional Supabase operations and scoped read views; verify code search, optional jury filter, creator-scoped Gestor results, global Monitor results, detail, edit, and archive.
- [x] 4.6 Migrate evidence upload, signed download, replacement, and deletion to private Supabase Storage with metadata compensation on failure; verify file-type, size, creator scope, missing-object display, and orphan cleanup.
- [x] 4.7 Remove migrated Spring endpoints from the active Angular path, including user, role, action, and permission administration; verify the production build and end-to-end migrated flows do not call IONOS.
- [x] 4.8 Add an authenticated administrative Edge Function and transactional service-role-only RPCs for user lifecycle and role membership; verify local create, edit, deactivate, reactivate, and rollback behavior without sending invitations.

## 5. Legacy Import and Cutover

- [x] 5.1 Record the verified read-only dump inventory (19 tables, 92 users, 1,637 activities, 32,042 participants), source UUID/permission mappings, inactive state, and historical validation exceptions without committing source payloads or secrets.
- [x] 5.2 Locate the 2,632 referenced evidence objects or document their absence; reconcile name, kind, MIME type, and availability before claiming evidence parity.
- [x] 5.3 Add non-exposed staging and idempotent import tooling keyed by source UUID and Auth user mapping; verify a fixture import can be repeated without duplicate users, activities, participants, or evidence metadata.
- [x] 5.4 Run a legacy dry import and report inserts, updates, skips, historical-validation exceptions, unresolved relationships, and missing objects; block affected database rows on unresolved relationships and keep evidence parity incomplete while objects are absent.
- [ ] 5.5 Execute the approved production database import, invite or reset migrated users through Supabase Auth, and reconcile active/inactive counts, representative records, and the 42 role/action grants.
  - Production import and reconciliation completed on 22 September 2026. The 92 migrated identities have unknown random passwords; invitation/reset delivery and subsequent sign-in verification remain pending owner approval.
- [x] 5.6 Import recovered evidence through the controlled compatibility path, or explicitly record irrecoverable gaps; complete role and evidence parity testing before removing obsolete legacy backend URL configuration and migrated proxy endpoints.

## 6. Documentation and Delivery

- [x] 6.1 Update setup, environment, deployment, bootstrap, backup, restore, and incident recovery documentation; verify a maintainer can reproduce a fresh environment without undocumented secrets.
- [x] 6.2 Run OpenSpec strict validation, SQL verification, Angular tests, production build, dependency audit, and GitHub Actions; verify every required check passes or has a documented accepted limitation.
