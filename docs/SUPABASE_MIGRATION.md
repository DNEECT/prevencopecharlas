# PREVENCOPE Charlas: Supabase migration runbook

The Angular client is moving from Spring/IONOS to Vercel and Supabase project
`betgsxbtyckbbiepmols`. The legacy proxy is retained for explicitly unresolved
DNI/RUC lookups and user administration while those flows are migrated. Do not
declare a production cutover until the OpenSpec checklist, legacy import, and
evidence reconciliation are complete.

The active activity-type, assistant-type, target-audience, process, jury,
format, registration, participant, authentication, permission-navigation, and
evidence paths use Supabase directly. Their former Spring route constants have
been removed. The remaining legacy URL is referenced only by the documented
DNI lookup and unfinished user/role administration repositories; it is not
used by migrated activity or evidence flows.

## Local development

Use Node.js 20 or later, Docker Desktop, and `npm ci`. The dedicated local
Supabase stack uses ports 55321 (API), 55322 (Postgres), and 55323 (Studio),
leaving the unrelated `gptcg` stack and its Vercel CLI identities alone.

1. Run `npm run supabase:start` and `npx supabase db reset --local` to replay
   migrations and the reviewed non-sensitive source seed.
2. Read `PUBLISHABLE_KEY` and `API_URL` from `npx supabase status --output json`
   without pasting the complete status output into logs. Set
   `SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_URL` in the shell or a local ignored
   `.env` loader. The build script rejects secret and service-role keys.
3. Run `npm start`. The `prestart` script generates the ignored
   `src/environments/supabase.generated.ts`; production builds use the same
   public-only configuration through `prebuild`.
4. Run `supabase/tests/seed-parity.sql` against the seeded local database and
   execute `supabase/seed.sql` a second time to verify zero duplicate inserts.
   For the older synthetic authorization fixture, reset with `--no-seed`, then run
   the transactional SQL fixture
   `supabase/tests/authorization.sql` through the local `supabase_db_prevencopecharlas`
   container. Run `supabase/tests/import-ledger.sql` the same way to check
   private import provenance and repeated mappings. Run
   `node supabase/tests/auth-catalog-flow.mjs` or
   `node supabase/tests/storage-flow.mjs` independently after another fresh
   reset; these HTTP checks commit disposable fixtures. Reset once more after
   testing.

The source dump, account passwords, service-role key, database password, and
external lookup tokens must never be committed or included in browser builds.
The publishable key is browser-public; RLS is the authorization boundary.

### Fresh maintainer bootstrap

From a new checkout, a maintainer can reproduce the current non-production
environment without any private legacy payload:

1. Install Node.js 20 or later, Docker Desktop, and Supabase CLI 2.117.0 or a
   reviewed compatible version. Run `npm ci`.
2. Run `npm run supabase:start`, then `npx supabase db reset --local`. Confirm
   the local API is on port 55321 before running any destructive local test.
3. Read the local public `API_URL` and `PUBLISHABLE_KEY` from
   `npx supabase status --output json`. Export them as `SUPABASE_URL` and
   `SUPABASE_PUBLISHABLE_KEY`; do not export the service-role key to Angular.
4. Run `npm start` for development or `npm run build` for the production
   bundle. The generated environment file is ignored by Git and recreated by
   the prestart/prebuild script.
5. Run the verification commands in this document on disposable local data,
   then reset with `npx supabase db reset --local` to restore the standard
   non-sensitive seed.

For hosted deployment, the institutional GitHub repository can be managed in
the Vercel dashboard or with `npm run vercel:cli -- <command>`. The wrapper uses
a PREVENCOPE-only credential directory (`%APPDATA%\com.vercel.cli-prevencope`
on Windows, or `PREVENCOPE_VERCEL_CONFIG_DIR` when explicitly overridden), so
it does not read or replace the separate `patrickcast` / `gamersproject` /
`gptcg` CLI credentials. The project-local `.vercel` metadata and `.env.local`
OIDC token are ignored by Git.

## Hosted project and Vercel

Use the institutional Supabase account with access to
`betgsxbtyckbbiepmols`. The Supabase CLI is authenticated as
`jne.dneect@jne.gob.pe` and this repository is linked to that project.
On 22 September 2026, `supabase projects list` showed the linked, healthy
`prevencopecharlas` project, while the isolated Vercel CLI reported user
`jnedneect-9144`, team `charlas` (`CHARLAS`), and linked project
`charlas/prevencopecharlas`. The default Vercel credential directory remains
separate and still resolves to `patrickcast`; it was not repointed to the
institutional account. Run `npm run vercel:cli -- whoami` and
`npm run vercel:cli -- projects ls --scope charlas` to recheck that identity
before any deployment. The Vercel project currently resolves to
`https://prevencopecharlas.vercel.app`.

On 21 September 2026, `supabase projects list` showed the linked project and
the hosted project was healthy. A `supabase db push --dry-run --linked
--include-seed --skip-vault` preview listed all 12 reviewed migrations and
`supabase/seed.sql`; the subsequent push applied them. A later empty private
`legacy_import` ledger migration also passed local replay and was pushed, so
`supabase migration list --linked` shows all 13 local and remote versions
matched. The ledger stores batch IDs, source hashes, user UUID mappings, and
record outcomes; it contains no staged legacy records yet. Hosted
read-only checks found 17 public tables, all 17 with RLS, and 17 public
policies. The seed contains 2 roles, 8 modules, 6 actions, 42 role/action
grants (18 inactive), 61 juries, and one `ACT009` format with next number 1642. The `activity-evidence` bucket is private, has a 20 MB limit and MIME
restrictions, and currently contains no objects. The hosted activity and
participant tables each contain zero rows: the legacy personal-data import
and evidence reconciliation remain separate cutover gates. The Codex Supabase
connector remains connected to a different account and reports insufficient
permission for this project; use the institutional CLI for project checks.
Run Vercel commands only through the repository's
`npm run vercel:cli -- ...` wrapper; do not run the global `vercel` command or
alter the separate `patrickcast`/`gamersproject`/`gptcg` credential directory.

The post-deployment Supabase advisors reported zero security errors, zero
performance errors, and zero performance warnings. The eight security warnings
are the intentionally authenticated, `SECURITY DEFINER` RPCs
`archive_activity`, `archive_activity_format`, `archive_activity_type`,
`archive_evidence`, `create_activity`, `my_permissions`, `my_roles`, and
`replace_activity`. These expose only the current actor's roles/permissions or
perform authorized mutations across RLS-hidden rows; their bodies derive the
actor from `auth.uid()`, check active profile and/or specific action/ownership,
use a fixed `search_path`, and grant execution only to `authenticated`.
`supabase/tests/authorization.sql` and the HTTP flow tests cover actor scope,
disabled grants, and denial of unauthorized calls. Reassess these warnings if
any RPC body or grant changes. Seven informational security suggestions are
RLS-enabled permission tables intentionally lacking direct client policies;
clients use the scoped `my_roles()` and `my_permissions()` RPCs instead.
Of 51 informational performance suggestions, 38 are uncovered foreign keys
(predominantly audit-user references) and 13 are indexes not yet used by the
small seeded workload. Review query plans and foreign-key
delete/update costs after import before adding indexes solely to silence
informational advice; retain the existing lookup/creator indexes for intended
activity searches. `supabase db query --linked` stalled during this check, so
the hosted counts and bucket state were verified in the dashboard SQL Editor
and Storage settings.

The institutional Vercel project now has `SUPABASE_URL` set to
`https://betgsxbtyckbbiepmols.supabase.co` and
`SUPABASE_PUBLISHABLE_KEY` set to the active `sb_publishable_` key from that
same project for Production, Preview, and Development. Earlier preview builds
failed at `prebuild` because those variables were absent; the failure confirmed
that incomplete deployments stop before compiling. No secret or service-role
key is present in Vercel's Angular build. If a trusted import job needs one,
run it separately from the frontend deployment with narrowly managed secrets.
Verify the deployed browser bundle contains only the project URL and
publishable key, and test real Monitor/Gestor accounts before changing traffic.

## First administrator and user onboarding

Create or invite the first institutional user through Supabase Auth's trusted
administration flow. With its returned `auth.users.id`, insert an active
`profiles` row and active `profile_roles` membership for the seeded Monitor
role in one controlled administrative transaction. Never expose service-role
credentials to Angular. The final active Monitor cannot be disabled or
demoted. Invite migrated users or issue password resets; legacy hashes and
JWTs are not reusable. Verify sign-in, active profile, and `my_permissions()`
for each role. Keep browser writes to role membership denied.

The repeatable bootstrap command is `npm run supabase:bootstrap-monitor`. Pass
`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`,
`BOOTSTRAP_MONITOR_EMAIL`, `BOOTSTRAP_MONITOR_USERNAME`, and a temporary
`BOOTSTRAP_MONITOR_PASSWORD` of at least 20 characters through the process
environment. Optional `BOOTSTRAP_MONITOR_FIRST_NAMES` and
`BOOTSTRAP_MONITOR_LAST_NAMES` values populate the display name. The command is
restricted to the reviewed PREVENCOPE project and `@jne.gob.pe` addresses. It
creates no invitation, verifies password sign-in and effective permissions,
and confirms that the browser session cannot edit its role membership. Keep
the temporary password outside Git and replace it after first use.

On 22 September 2026, the first institutional Monitor was bootstrapped with
this command. The hosted verification confirmed an active Auth identity,
active profile and Monitor membership, 19 effective permissions, successful
password sign-in, and denial of browser role-membership updates. No invitation
or password-reset email was sent. The temporary credential is stored outside
the repository in the local restricted PREVENCOPE credentials directory and
must be changed after first use.

## Import and evidence

Use [LEGACY_INVENTORY.md](LEGACY_INVENTORY.md) as the reconciliation baseline.
The owner confirmed the 27 August 2026 dump (SHA-256
`388f1f5c054cc4e682261a8fc3b09b23d141c65ec2e9a19232ee9b15b2d67c8a`)
as the final legacy database snapshot. Run the read-only planner with
`python -B scripts/plan-legacy-import.py --dump <reviewed-dump>
--pg-restore <pg-restore-executable>`. It checks the checksum, expected source
counts, source foreign keys, duplicate keys, destination field lengths and
required values, inactive flags, historical blanks, and evidence references.
An optional private `--auth-map <csv>` has exactly the columns
`legacy_user_id,auth_user_id`; keep this CSV outside Git. The planner never
prints personal rows. Its Auth mapping is only a proposal: verify every mapped
Auth ID exists in the institutional project and that its email corresponds to
the legacy user before importing. Its projected insert counts assume an empty
destination and are not a destination-aware insert/update/skip report.
For an offline account review, run `python -B scripts/prepare-legacy-onboarding.py
--dump <reviewed-dump> --pg-restore <pg-restore-executable> --output
<private-path-outside-repository>`. The output contains legacy UUIDs, emails,
usernames, roles, and proposed invite flags. It deliberately excludes password
hashes. Review recipients and institutional ownership before using an Auth
administration flow; this command sends no email and makes no database change.

The confirmed snapshot's dry run found 92 users (89 active), 92 role
memberships, 1,637 activities (1,455 active), and 32,042 participants, with
zero broken source relationships or destination field-limit violations. It
found 53 blank sex values, one blank organization, 5,248 blank positions,
25,657 blank emails, and 26,494 blank population values in historical
participants. None of the 92 users has a verified Auth mapping yet. The dry
run made no hosted changes; it does not complete the destination-aware import
or establish evidence parity.
An aggregate read-only query in the institutional dashboard on 21 September
2026 returned zero rows in `auth.users`, `public.profiles`, and
`legacy_import.auth_user_map`. No onboarding invitations have been sent.

### Private SQL import rehearsal

`scripts/build-legacy-import.py` creates a transactional SQL file outside Git.
It stages only allowlisted source fields in temporary tables; the source
`password` field is excluded. It verifies every mapped Auth ID and matching
email, seeded roles and catalogs, and existing row consistency before writing
business rows. It preserves source UUIDs, activity codes, inactive state,
audit links and timestamps, and historical participant blanks. Every missing
attachment becomes unavailable metadata with no object path or download URL.
The SQL records a private batch and per-record ledger; a repeated run skips
the same records. A conflicting existing row blocks the transaction instead
of silently overwriting it. No invitation or Auth user is created.

First create a **private** CSV outside this repository with exactly
`legacy_user_id,auth_user_id` columns. Verify the 92 identities and email
matches in the intended Supabase project. Until that mapping exists, the
builder refuses to generate import SQL. Generate a rehearsal file in a private
directory with:

```powershell
python -B scripts/build-legacy-import.py --dump <reviewed-dump> `
  --pg-restore <pg-restore-executable> --auth-map <private-auth-map.csv> `
  --output <private-dry-run.sql> --mode dry-run
```

Review the aggregate planner result and the target project before running the
file with a trusted direct PostgreSQL connection:

```powershell
psql -X -q -t -A -v ON_ERROR_STOP=1 <database-url> -f <private-dry-run.sql>
```

The last SQL result is an aggregate reconciliation report; `dry-run` rolls
everything back. After reviewing it, generate a fresh output path with
`--mode apply` and execute that SQL once. The apply transaction fails closed
if any Auth identity, email, role, catalog, or pre-existing record conflicts.
Store and delete the generated SQL as sensitive personal data. Never commit
the SQL, Auth map, dump, or database URL. On local Supabase only, run
`scripts/test-build-legacy-import.py` with `PREVENCOPE_LOCAL_DB_URL` pointing
to port 55322 and `PREVENCOPE_PSQL` set to the psql executable; it checks a
dry run, two consecutive applies, and cleanup using synthetic rows.

The builder reports zero updates because this final snapshot is immutable.
An existing row with different values requires review and a corrective
transaction, not an automatic overwrite. Production execution and account
invitations remain separate approval and onboarding steps.

The Auth flow can be verified against the local stack with
`scripts/test-local-auth.mjs`. Supply the local API URL, publishable key, and
service-role key as `PREVENCOPE_LOCAL_SUPABASE_URL`,
`PREVENCOPE_LOCAL_PUBLISHABLE_KEY`, and `PREVENCOPE_LOCAL_SECRET_KEY` from
`supabase status`. The script refuses non-local port 55321, creates a
disposable local account without sending an invitation, checks valid/invalid
login, refresh, password update, disabled-profile RLS, and sign-out, then
removes the account. Never supply hosted service-role credentials to this
test or to Angular.

On 22 September 2026, the local Auth smoke test also passed a Gestor
activity create/list/edit/archive flow, including generated code and
participant count. The separate unseeded `supabase/tests/auth-catalog-flow.mjs`
passed its catalog, grant, and activity RPC exercise. An initial Storage run
failed with PostgreSQL `42P10`: CLI 2.117.0 expected Storage API v1.77.5, but
Docker still had the healthy yet stale v1.72.1 container. `supabase stop`
followed by `supabase start` recreated it at v1.77.5. The clean Storage flow
then passed private access, role scope, kind and 20 MiB limits, signed download,
replacement/removal, and controlled historical photographic PDF import. The
local database was reset to the standard seed afterward. The local security
advisor found no error after the new audit-link migration. The hosted migration
history includes that migration; the hosted security-advisor CLI stalled and
the connected advisor returned a permission error, so the post-change hosted
advisor result remains unavailable.

The Angular Supabase repository contract suite covers active catalog and
format mapping, pagination, create/edit/archive payloads, generated-code
delegation, activity code and optional-jury filters, detail and participant
mapping, transactional create/edit/archive RPCs, missing legacy evidence, file
kind and 20 MiB checks, signed downloads, replacement/removal, and compensation
when metadata or replacement fails. All 19 focused checks passed together, and
the production Angular build completed. The older full Angular suite still
mixes zoneless Angular 20 setup with Zone.js-only `fakeAsync` tests; those old
specs fail in their test harness before assertions. This is an accepted
delivery limitation for the migration branch because the 19 focused Supabase
repository tests pass; repair the global test harness before treating all 127
legacy specs as a release gate. ESLint 9 likewise cannot load the repository's
legacy `.eslintrc.json` until it is migrated to flat config.

Final local delivery checks on 22 September 2026 passed OpenSpec strict
validation, schema replay, seed parity, authorization SQL, import-ledger SQL,
the focused Angular repository suite, the Auth/Data API flow, the private
Storage flow, and the production build. GitHub Actions `Validate` run 18 passed
commit `815e4e6`. `npm audit --omit=dev --audit-level=high` reported no high or
critical findings. It reported two moderate findings in ExcelJS's transitive
`uuid` package; npm offers only a breaking ExcelJS downgrade, and the affected
buffer-taking UUID v3/v5/v6 APIs are not used by this application, so the
moderate transitive finding is accepted pending an upstream ExcelJS update.
The full development audit now also reports 2 low, 9 moderate, 20 high, and 1
critical advisory in the official Vercel CLI 59.25.2 dependency graph. That CLI
is pinned as a development-only dependency and is excluded from the deployed
Angular bundle; `npm audit --omit=dev --audit-level=high` still exits successfully
with no high or critical production finding. Retest the full audit when Vercel
publishes a CLI release with updated transitive packages.

For a full local rehearsal before institutional Auth onboarding, run
`python -B scripts/rehearse-legacy-import.py --dump <reviewed-dump>
--pg-restore <pg-restore-executable> --psql <psql-executable>
--db-url <local-supabase-database-url>`. It accepts only localhost port 55322,
creates disposable local Auth identities, runs the dry SQL, removes those
identities, and prints aggregate counts only. The verified 22 September 2026
result is recorded in [LEGACY_DRY_RUN.md](LEGACY_DRY_RUN.md).

Run `scripts/audit-legacy-evidence.py --dump <reviewed-dump> --pg-restore
<pg-restore-executable> --evidence-root <candidate-directory>` for aggregate
name, kind, extension-derived MIME, and availability counts. A filename match
is only a candidate until its bytes and provenance are verified; the supplied
Charlas source tree yielded zero matches across 2,632 references. The Spring
backend's configured upload directory is `/var/www/files/ventas/public/images`
on the legacy host, outside that shared source tree.
Stage the dump in a non-exposed schema outside Git, map source UUIDs and Auth
users, preserve inactive flags and historical validation exceptions, and dry
run twice to prove idempotency. Reconcile each format's next number against
existing activity codes before new registration writes. The 2,632 evidence
references require object recovery or an explicit unavailable result; a
database-only import is not evidence parity. New private objects use
`<activity-uuid>/<attendance-list|photographic-record>/<uuid>-<name>` and
20 MiB kind-specific limits. A controlled service-role import may retain
historical photographic PDFs. Archive old metadata on replacement, delete
old objects, and periodically compare active metadata paths with bucket
objects to identify orphaned uploads or deletions that failed.
The activity edit form shows a historical filename as "Archivo histórico no
disponible" when an active evidence record has `is_available = false`, or when
the imported registration retains a `legacy_attendance_path` or
`legacy_photo_path` without a verified available Storage object. It exposes no
download action for that reference and allows an authorized user to upload a
replacement. Preserve the legacy path fields during the pending activity
import; the hosted project has no historical activity rows yet, so the status
will appear only after those rows are imported.

## Backup and recovery

Before importing production data, make an encrypted database backup and
separate private Storage backup outside the repository. Record migration
versions, object counts, and a checksum manifest. Restore into a disposable
project first and verify representative users, roles, activities, participants,
and evidence downloads. A pre-import empty destination can be recreated from
the tested migrations. Once records exist, use forward corrective migrations
and preserve the hosted database; do not reset it. If Auth, Data API, or Storage
is unavailable, suspend writes in the frontend, preserve error logs without
personal data, assess project status and quotas, restore from the verified
backup if required, and reconcile writes before resuming. Monitor free-tier
usage and project pause behavior for continuity.
