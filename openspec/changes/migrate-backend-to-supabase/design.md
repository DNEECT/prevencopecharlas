# Design

## Context

See `proposal.md` for motivation. The network share now exposes the Spring Boot source, `modelo_charlas`, and a readable PostgreSQL custom dump. The dump contains 19 tables: application users and roles; hierarchical modules, actions, paths, and their permission bridges; activity catalogs and formats; electoral processes and special electoral juries; registrations and participants. It contains 92 users (11 Monitor, 81 Gestor), 1,637 registrations (1,455 active), and 32,042 participants. The database references 2,632 distinct attachment names, but none of those objects is in the supplied source tree. The destination Supabase project is `betgsxbtyckbbiepmols`, connected to `DNEECT/prevencopecharlas`. The unrelated `patrickcast` / `gamersproject` Vercel CLI session must remain unchanged.

The Spring seed matrix gives Monitor administration of activities, formats, types, and users. Gestor can list, create, edit, and archive registrations but cannot approve or observe them or administer configuration. The registration list service filters Gestor to the creator's records; Monitor can monitor registrations across creators. No user-to-jury assignment table exists. The legacy jury's integer `codprocesoelectoral` does not reference the UUID primary key of `procesoelectoral`, so a process/jury compatibility rule cannot be inferred from the source.

## Goals / Non-Goals

**Goals:**

- Reproduce the verified registration, catalog, module/action, and role behavior while moving credentials, data, and attachments to institution-owned services.
- Make Auth, explicit grants, RLS, and private Storage policies the security boundary for the Angular client.
- Preserve legacy business UUIDs, activity codes, inactive records, audit data, and import provenance for deterministic reconciliation.
- Keep new writes valid while allowing documented exceptions in historical participant records to import without fabricating values.

**Non-Goals:**

- Reuse legacy password hashes, application JWTs, or the old attachment path as a browser URL.
- Invent missing evidence files or infer jury assignments and process relationships absent from the dump.
- Commit the dump, participant payloads, passwords, tokens, or service-role keys.
- Move the secret-bearing DNI/RUC integration into the browser or relink the existing Vercel CLI account.

## Decisions

### Preserve business UUIDs and map Auth identities explicitly

The legacy business tables already use UUID primary keys. Keep these IDs for catalogs, formats, juries, registrations, and participants, and record import source/batch provenance separately. `profiles.id` instead references `auth.users.id` and has a unique `legacy_user_id` for mapping the 92 legacy `usuario.codigousuario` values. Audit creator/updater references resolve through that mapping. This avoids rewriting every business relationship or relying on display codes as keys. The alternative of assigning all-new business UUIDs would require a full cross-reference table for every imported foreign key without improving the client contract.

### Map the real schema without exposing obsolete authentication tables

Application tables cover `procesoelectoral`, `publicoobjetivo`, `tipoactividad`, `formatoactividad`, `tipoasistentes`, `juradonacionalespecial`, `registroactividad`, and `registroactividadparticipante`. Preserve the original string-based date (`YYYY-MM-DD`) and time (`HH:MM`) values as parsed `date` and `time` fields; retain audit timestamps and soft-active state. Keep jury source process codes as integer metadata. Do not require a jury/process match on new registrations until an authoritative mapping exists. The empty `parametro` table needs no production seed, but an import inventory records it.

The source also contains `accion`, `path`, `rol`, `usuariorol`, hierarchical `modulo`, `moduloaccion`, `moduloaccionpath`, `rolmodulo`, and `moduloaccionrol`. Model their effective module/action permissions relationally, retaining source IDs and the active flags needed by the Angular navigation and backend authorization contract. Legacy API path mappings can be retained in import staging or a protected mapping table for audit; browser authorization uses database policies rather than copied HTTP route strings. This is more faithful than flattening permissions to a simple role name check.

### Preserve the verified Monitor and Gestor scopes

Monitor is the administrative role: global registration access plus the active seeded actions for configuration and user management. Gestor has registration list/add/edit/delete actions only and sees or changes registrations it created. Both roles can read the active catalogs needed to enter a registration. A protected permission helper reads active profile, role, module, and action records; RLS combines that action grant with creator ownership for Gestor. No `profile_jury_assignments` table is created. Protect the final active Monitor administrator from demotion or disablement. Role administration is performed through a narrow authenticated administrative function or trusted server flow; arbitrary browser writes to membership tables are denied.

JWT user metadata is not an authorization source because it is editable or stale. Helper functions in a non-exposed schema have fixed search paths and narrowly scoped execution grants. Any required security-definer function checks the current actor and action explicitly. Exposed views use invoker security so underlying RLS applies. `UPDATE` policies include both read visibility and `USING`/`WITH CHECK` predicates.

### Generate the legacy code atomically

`formatoactividad` has a unique active `serie`, a topic, and a `numeracion` counter. The legacy code is `serie + numeracion` padded to at least four digits; the counter advances after a registration is created. A transactional RPC locks the selected format, generates the code, inserts the registration and participant set, and advances the counter as one operation. Existing imported codes and the next counter value are reconciled before enabling new writes. Angular never guesses the next code. Registration codes remain unique, including across archived rows.

### Separate new-write validation from historical import exceptions

New participant writes require an eight-digit DNI, name, sex, non-negative age, and organization; cargo, phone, email, and population are optional according to the current Angular validators. The legacy dump has 53 participants with blank sex, one with blank organization, 5,248 with blank cargo, 25,657 with blank email, and 26,494 with blank population. Import preserves these historical values and marks validation exceptions for review; it does not substitute invented values. New-write validation is enforced at the transactional API boundary, while base columns can represent historical blanks. Imported rows remain subject to normal read/write authorization.

### Store evidence privately and reconcile missing source objects

Use one private `activity-evidence` bucket with paths `<activity-id>/<attendance-list|photographic-record>/<uuid>-<sanitized-name>` and metadata linked to the activity and uploader. Storage policies derive the activity ID from the path and call the same action/ownership helper used for evidence metadata. New attendance uploads accept PDF, XLS, XLSX, PNG, or JPEG; new photographic uploads accept PNG or JPEG, each up to 20 MiB. The dump's photographic references include 77 PDFs; recovered legacy files of this type are imported through a controlled compatibility path, not accepted as new photographic uploads. The importer records unresolved attachment references and never presents a signed URL for an object that does not exist.

### Preserve Angular behavior through typed repositories

Angular authentication moves to Supabase Auth. Repositories call RLS-safe tables, invoker views, and narrow RPCs through `SupabaseService`, mapping snake_case fields to the existing Spanish interfaces. Registration listing keeps active-only rows, pagination, code search, optional JEE filtering, and the actor's permitted creator scope. Module/action permissions drive navigation; direct database requests remain protected independently of the UI. The legacy proxy remains only for secret-bearing external lookups until that integration has its own migration.

### Import through staging and reconciliation

Read the custom dump outside the repository into a non-exposed staging schema. Import ordered parent tables, users/Auth mappings, permissions, registrations, and participants by stable source UUID. An import ledger records source, batch, source ID, destination ID, outcome, and exception class. A dry run reports inserts, updates, skips, invalid rows, unresolved foreign keys, and attachment availability without printing personal data. The 2,632 unresolved attachment names are a separate recovery gate; database import can proceed with null or unavailable evidence metadata, but evidence parity cannot be claimed until files are recovered and reconciled. Legacy passwords and secrets are excluded; users receive new Supabase Auth credentials through an administrative invitation/reset flow.

## Risks / Trade-offs

- [A copied permission row could broaden access] → Compare the 42 source role/action rows with seeded destination grants and test both roles against direct Data API calls.
- [Historical blank participant fields conflict with new validation] → Preserve them with explicit import exception markers and restrict the stricter validation to new writes.
- [Evidence files may be permanently unavailable] → Report all unresolved paths and keep references non-downloadable until objects are verified; do not fabricate evidence.
- [A browser upload can leave an orphan object] → Delete the object if metadata creation fails and reconcile remaining orphans periodically.
- [Supabase free-tier storage, egress, and pausing affect continuity] → Document backup, recovery, and usage monitoring before cutover.
- [Complex RLS can expose or hide records] → Use default-deny grants, cross-user tests, invoker views, and security-advisor checks as release gates.

## Migration Plan

1. Add versioned schema, helper functions, explicit grants, RLS, private bucket, role/action seeds, and verification SQL.
2. Replay migrations in a disposable environment; test Monitor administration, creator-scoped Gestor access, concurrent code allocation, and private object access.
3. Apply reviewed migrations to `betgsxbtyckbbiepmols`, verify policies and advisors, and bootstrap the first institutional Monitor administrator.
4. Migrate Angular Auth and repositories in dependency order, verifying the existing list, create, edit, archive, and evidence flows.
5. Dry-run the available dump, resolve mapping and historical-validation exceptions, import approved database rows, and reconcile counts and representative records.
6. Locate and import evidence files if available, reconcile all 2,632 references, and report any irrecoverable gaps before declaring evidence parity or removing the legacy backend path.

Before production import, rollback can reset the empty destination from tested migrations. After records exist, use corrective forward migrations and preserve Supabase data; the old frontend path remains available only until the migrated flows are verified.

## Open Questions

- The location and recoverability of the 2,632 attachment objects remain unknown. This affects evidence parity and cutover, not the database schema or initial migration tasks.
- The institution can choose its invitation and password-reset procedure before onboarding migrated users without changing the schema.
