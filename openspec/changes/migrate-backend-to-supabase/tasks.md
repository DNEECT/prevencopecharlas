# Tasks

## 1. Database Foundation

- [x] 1.1 Add the core migration with required extensions, protected helper schema, audit timestamp helpers, and explicit privilege defaults; verify a schema-only database reset completes without SQL errors.
- [x] 1.2 Add Auth-linked profiles with unique legacy user UUIDs; roles, hierarchical modules, actions, role-module-action grants, and profile-role membership; verify the source permission relationships and uniqueness constraints.
- [x] 1.3 Add activity types, assistant types, target audiences, electoral processes, juries, formats, registrations, participants, and evidence metadata using legacy business UUIDs and soft-active state; verify valid fixtures insert and invalid references fail without inventing a jury/process foreign key.
- [x] 1.4 Add archival safeguards, including protection against disabling or demoting the final active Monitor administrator; verify the last-Monitor operation is rejected while ordinary profile updates succeed.
- [x] 1.5 Add atomic activity-code generation using series plus a four-digit padded counter, transactional registration/participant RPCs, and invoker-security read views; verify concurrent calls cannot create duplicate codes and imported sequence state is respected.
- [x] 1.6 Seed the 42 source role/action grants, module hierarchy, Monitor/Gestor roles, and known non-sensitive catalogs; verify disabled grants remain disabled and repeated seeds do not duplicate rows.
- [x] 1.7 Add the ERM 2026 topic, seven process-specific target audiences, 91 JEE, and explicit process relationships while preserving General 2026 historical catalogs.
- [x] 1.8 Standardize the 61 General 2026 JEE display names to the ERM 2026 Spanish title style, including applicable accents, without changing identifiers or historical activity relationships.
- [x] 1.9 Replace the ERM 2026 target-audience catalog with the 12 approved options and add a controlled internal No aplica assistant type without changing historical General 2026 values.

## 2. Database and Storage Authorization

- [x] 2.1 Add protected active-profile, effective-action, Monitor-administrator, and Gestor-creator-scope helpers with fixed search paths; verify ordinary authenticated users cannot alter privileged helpers or spoof an actor.
- [x] 2.2 Revoke anonymous application privileges, enable RLS on every exposed application table, and add profile and authorization policies; verify an anonymous client and an authenticated identity without a profile receive no application rows.
- [x] 2.3 Add Monitor administrative/global policies and Gestor creator-scoped policies for catalogs, formats, registrations, participants, and evidence metadata; verify direct cross-user reads/writes and inactive grants follow the source matrix.
- [x] 2.4 Create the private `activity-evidence` bucket with 20 MiB and MIME restrictions plus path-based object policies; verify normal uploads, historical photographic PDF import, anonymous denial, creator scope, and authorized signed downloads.
- [x] 2.5 Add SQL verification scripts for constraints, grants, RLS, role changes, archival behavior, and storage policy helpers; verify all scripts pass against a freshly reset database.
- [x] 2.6 Enforce ERM 2026 JEE assignments for GPCC and Monitor accounts, retain Administrator global visibility, and make General 2026 historical records read-only and invisible to Gestores and non-administrator Monitors.
- [x] 2.7 Evaluate activity-list RLS against the current row instead of looking it up again for every result; verify the Administrator historical count completes without a statement timeout and Gestor scope remains unchanged.
- [x] 2.8 Restrict the historical General 2026 process, catalogs, JEE, registrations, participants, and evidence to active Administrator or Director roles; verify Monitor and Gestor identities receive only current ERM 2026 data for assigned JEE.

## 3. Supabase Project Deployment

- [x] 3.1 Authenticate and link the Supabase CLI only to project `betgsxbtyckbbiepmols`, without changing the existing Vercel CLI session; verify `supabase projects list`, link metadata, and the isolated `vercel whoami` show the intended independent accounts.
- [x] 3.2 Preview the remote migration plan, apply the reviewed migrations and seeds, and verify the hosted migration history, tables, policies, private bucket, and project health.
- [x] 3.3 Bootstrap the first institutional Monitor administrator through a documented administrative flow and verify sign-in while role membership remains protected from browser self-editing.
- [x] 3.4 Run Supabase security and performance advisors after deployment, resolve findings introduced by this change, and record a clean or explained advisor result.
- [x] 3.5 Provision and verify the dedicated `pruebasdneect@jne.gob.pe` account with the same Monitor and Administrador roles as the designated institutional administrator, store its temporary credential outside Git, and send no invitation or password-reset email.

## 4. Angular Authentication and Data Access

- [x] 4.1 Configure the public Supabase project URL and publishable key through Angular environment handling without committing secrets; verify local and production builds contain no secret or service-role value.
- [x] 4.2 Replace legacy login, logout, session persistence, and password update calls with Supabase Auth and active-profile loading; verify valid, invalid, disabled-profile, refresh, and sign-out flows.
- [x] 4.3 Replace JWT parsing and permission guards with effective hierarchical module/action permissions while retaining database RLS as enforcement; verify navigation hides disabled grants and direct requests are still denied.
- [x] 4.4 Migrate catalog and activity-format repositories to typed Supabase queries and RPCs with Spanish interface mapping; verify list, create, edit, archive, and generated-code screens behave as before.
- [x] 4.5 Migrate registration and participant repositories to transactional Supabase operations and scoped read views; verify code search, optional jury filter, creator-scoped Gestor results, global Monitor results, detail, edit, and archive.
- [x] 4.6 Migrate evidence upload, signed download, replacement, and deletion to private Supabase Storage with metadata compensation on failure; verify file-type, size, creator scope, missing-object display, and orphan cleanup.
- [x] 4.7 Remove migrated Spring endpoints from the active Angular path, including user, role, action, and permission administration; verify the production build and end-to-end migrated flows do not call IONOS.
- [x] 4.8 Add an authenticated administrative Edge Function and transactional service-role-only RPCs for user lifecycle and role membership; verify local create, edit, deactivate, reactivate, and rollback behavior without sending invitations.
- [x] 4.9 Add a dedicated Administrator role without modifying the imported Monitor matrix, assign it only to the designated institutional Monitor, and verify all active views and actions are effective.
- [x] 4.10 Restore the legacy grouped header by returning authorized Administración and Seguridad parent containers, hide non-functional route-less modules, and verify desktop and mobile navigation retain only permitted child routes.
- [x] 4.11 Add Elecciones Regionales Municipales 2026 to the active process catalog, mark it as the single current default, and verify new registrations preselect it without changing edit-form values.
- [x] 4.12 Filter registration catalogs by the selected electoral process, active role, and current user's JEE assignments; render General 2026 records through a read-only detail path for Administrator or Director roles only.
- [x] 4.13 Add an electoral-process filter to the activity list, show all processes authorized for the user's role and JEE assignments by default, and scope the JEE options and filtered results to a selected process so historical and current JEE names are not duplicated.
- [x] 4.14 Require only username, institutional email, and at least one role in administrative user creation and editing; keep document number, names, surnames, birth date, and address optional in both Angular and the administrative Edge Function.
- [x] 4.15 Preselect ERM 2026 in the activity list when it is the only process authorized for a Monitor or Gestor, while leaving the Administrator or Director process filter empty so all authorized records are shown initially.
- [x] 4.16 Hide Tipo de asistente on ERM 2026 create and edit forms, set its internal No aplica value automatically, and retain the field when displaying historical General 2026 records.
- [x] 4.17 Link the PREVENCOPE logo and Inicio breadcrumb to the signed-in user's first authorized screen, preferring the activity register when available, and refresh that route from the live permission menu.

## 5. Legacy Import and Cutover

- [x] 5.1 Record the verified read-only dump inventory (19 tables, 92 users, 1,637 activities, 32,042 participants), source UUID/permission mappings, inactive state, and historical validation exceptions without committing source payloads or secrets.
- [x] 5.2 Locate the 2,632 referenced evidence objects or document their absence; reconcile name, kind, MIME type, and availability before claiming evidence parity.
- [x] 5.3 Add non-exposed staging and idempotent import tooling keyed by source UUID and Auth user mapping; verify a fixture import can be repeated without duplicate users, activities, participants, or evidence metadata.
- [x] 5.4 Run a legacy dry import and report inserts, updates, skips, historical-validation exceptions, unresolved relationships, and missing objects; block affected database rows on unresolved relationships and keep evidence parity incomplete while objects are absent.
- [ ] 5.5 Execute the approved production database import, invite or reset migrated users through Supabase Auth, and reconcile active/inactive counts, representative records, and the 42 role/action grants.
  - Production import and reconciliation completed on 22 September 2026. The 92 migrated identities initially had unknown random passwords.
  - On 26 September 2026, the approved directory reconciliation activated 90 Gestor accounts. Individual recovery links were generated and accepted by the institutional mail relay for all 90 accounts, with zero skips or failures and without storing recovery tokens. The designated institutional administrator separately completed the recovery flow and a successful sign-in. Representative sign-in verification for the Gestor batch remains pending before this task can be closed.
  - Later that day, `gpccoxaperm2026@jne.gob.pe` reported that its original batch recovery link had expired. A new individual recovery link was generated, Supabase recorded the issuance, and the institutional relay accepted the replacement message at 14:45:39 (America/Lima). The earlier link is obsolete, and neither recovery link nor token was retained.
  - Also on 26 September 2026, the existing `ahuamana@jne.gob.pe` identity was activated with the same Monitor and Administrador memberships as the designated institutional administrator. An initially provisioned misspelled `ahuaman@jne.gob.pe` identity was removed after verification, and its recovery link became unusable with that deletion. A replacement recovery message for the correct address was accepted by the institutional relay; neither generated link nor any bootstrap password was retained.
  - Following the expired-link report, the hosted Email OTP expiration was increased from 3,600 to 86,400 seconds. A replacement batch was then accepted by the institutional relay for 92 unique recipients: the 90 approved Gestor accounts plus `sfernandeza@jne.gob.pe` and `ahuamana@jne.gob.pe`, both retaining active Monitor and Administrador memberships. Every message states that the newest single-use link remains valid for 24 hours and supersedes earlier messages; the batch completed with zero skips or failures and retained no links or tokens.
  - The designated administrator subsequently reproduced a mobile direct-link failure: Supabase exchanged the valid link at 15:37:11 (America/Lima), but the change-password page did not have the recovery session when the form was submitted. Production now supports trusted `token_hash` links and explicitly preserves older direct-link session parameters before automatic URL cleanup. A corrected 24-hour `token_hash` message for `sfernandeza@jne.gob.pe` was accepted at 15:47:57. A broader corrective resend was stopped at the owner's request after 34 additional messages were accepted, including `ahuamana@jne.gob.pe`; the remaining 57 recipients can use their earlier direct links through the compatibility path. No further messages were sent, and no links or tokens were retained.
  - Supabase custom SMTP was saved and enabled on 26 September 2026 with the institutional sender and `smtp.office365.com:587`. Three controlled `/recover` tests for the designated administrator reached Supabase Auth but ended after about 10 seconds with HTTP 504, `request_timeout`, and `context deadline exceeded`; no successful self-service recovery delivery was verified. A compatible transactional SMTP provider or an OGTI-managed relay remains required before closing this task.
- [x] 5.6 Import recovered evidence through the controlled compatibility path, or explicitly record irrecoverable gaps; complete role and evidence parity testing before removing obsolete legacy backend URL configuration and migrated proxy endpoints.
- [x] 5.7 Recover the newly reachable legacy evidence through the authenticated legacy Vercel proxy, validate file signatures, sizes, and SHA-256 checksums against all 2,632 dump references, import verified objects into private Supabase Storage, and reconcile evidence metadata before declaring evidence parity.
  - On 24 September 2026, 2,187 verified objects (1,520,460,330 bytes) were imported and reconciled; 442 references remained unavailable and three responses were rejected because their byte signatures contradicted the stored extensions. These 445 rows remain explicitly unavailable, so full historical evidence parity is not claimed.
- [x] 5.8 Reconcile the approved ERM 2026 workbook without sending email: create missing identities with unknown random passwords, activate Monitor/Gestor roles, assign each GPCC to one JEE and each Monitor to the JEE listed under their supervision, and skip contractor accounts whose name or DNI is pending.
  - On 28 September 2026, the approved two-sheet directory produced 91 ERM JEE, 11 new Monitor identities, and 180 active JEE assignments (89 staffed GPCC assignments plus 91 Monitor-to-JEE assignments). Urubamba and Lima Centro remained loaded without a GPCC assignment because their contractor names and DNI are pending. No invitation, recovery, or onboarding email was sent.

## 6. Documentation and Delivery

- [x] 6.1 Update setup, environment, deployment, bootstrap, backup, restore, and incident recovery documentation; verify a maintainer can reproduce a fresh environment without undocumented secrets.
- [x] 6.2 Run OpenSpec strict validation, SQL verification, Angular tests, production build, dependency audit, and GitHub Actions; verify every required check passes or has a documented accepted limitation.
