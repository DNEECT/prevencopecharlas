# PREVENCOPE Charlas: Supabase migration runbook

The Angular client is moving from Spring/IONOS to Vercel and Supabase project
`betgsxbtyckbbiepmols`. The legacy proxy is retained for explicitly unresolved
DNI/RUC lookups and user administration while those flows are migrated. Do not
declare a production cutover until the OpenSpec checklist, legacy import, and
evidence reconciliation are complete.

## Local development

Use Node.js 20 or later, Docker Desktop, and `npm ci`. The dedicated local
Supabase stack uses ports 55321 (API), 55322 (Postgres), and 55323 (Studio),
leaving the unrelated `gptcg` stack and its Vercel CLI identities alone.

1. Run `npm run supabase:start` and `npx supabase db reset --local --no-seed`.
2. Read `PUBLISHABLE_KEY` and `API_URL` from `npx supabase status --output json`
   without pasting the complete status output into logs. Set
   `SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_URL` in the shell or a local ignored
   `.env` loader. The build script rejects secret and service-role keys.
3. Run `npm start`. The `prestart` script generates the ignored
   `src/environments/supabase.generated.ts`; production builds use the same
   public-only configuration through `prebuild`.
4. From a fresh reset, run the transactional SQL fixture
   `supabase/tests/authorization.sql` through the local `supabase_db_prevencopecharlas`
   container. Run `node supabase/tests/auth-catalog-flow.mjs` or
   `node supabase/tests/storage-flow.mjs` independently after another fresh
   reset; these HTTP checks commit disposable fixtures. Reset once more after
   testing.

The source dump, account passwords, service-role key, database password, and
external lookup tokens must never be committed or included in browser builds.
The publishable key is browser-public; RLS is the authorization boundary.

## Hosted project and Vercel

Use the institutional Supabase account with access to
`betgsxbtyckbbiepmols`. The Supabase CLI is authenticated as
`jne.dneect@jne.gob.pe` and this repository is linked to that project.
On 21 September 2026, `supabase projects list` showed the expected project,
the hosted project was healthy, and `supabase migration list --linked` showed
none of the 12 local migrations applied. `supabase db push --dry-run --linked
--skip-vault` listed all 12 for application. This was a preview only; the
source-derived seed and legacy import are still pending. Recheck the remote
history and preview before applying `supabase db push`. Check
tables, explicit grants, RLS, the private `activity-evidence` bucket, and
security/performance advisors after application. The reviewed source-derived
seed is still a prerequisite. The Codex Supabase connector remains connected
to a different account and reports insufficient permission for this project;
use the institutional CLI for project checks. Do not
run `vercel login`, `vercel link`, or alter the separate
`patrickcast`/`gamersproject`/`gptcg` CLI session.

In the institutional Vercel project set `SUPABASE_URL` to
`https://betgsxbtyckbbiepmols.supabase.co` and
`SUPABASE_PUBLISHABLE_KEY` to an active `sb_publishable_` key from that same
project. Set them for the intended environments before deploying; `prebuild`
fails on Vercel when the publishable key is absent. Do not use the secret or
service-role key in Vercel's Angular build. If a trusted import job needs one,
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

## Import and evidence

Use [LEGACY_INVENTORY.md](LEGACY_INVENTORY.md) as the reconciliation baseline.
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
