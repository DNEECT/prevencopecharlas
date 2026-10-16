# Verification Evidence

Verified against the linked Supabase project on 2026-10-15.

## Data reconciliation and constraints

- Pre-migration audit: four active activities referenced a jury from another electoral process; each had exactly one active same-name jury in its own process.
- The reconciliation was rehearsed in a transaction and rolled back before deployment; the guarded migration left zero jury/process mismatches in the rehearsal.
- Post-deployment counts:
  - Jury/process mismatches: `0`
  - Format/process mismatches: `0`
  - Intentionally preserved cross-process target-audience references: `4`
- The four preserved references have no exact active same-name audience in their activity process:
  - `ACT0091642`: `Organización de Mujeres`
  - `SP-ERM20260001`: `Otros`
  - `SP-ERM20260002`: `Otros`
  - `SP-ERM20260003`: `Otros`
- Both `activity_registrations_jury_process_fkey` and `activity_registrations_format_process_fkey` report `convalidated = true`.
- Transaction-rolled-back write tests confirmed that cross-process jury and format updates are rejected and aligned updates are accepted.

## Authorization

The affected Monitor account `dneect054` was simulated with the authenticated database role:

- Visible activities: `7`
- Visible reported activity `ACT0091642`: `1`
- Visible historical audience for the reported activity: `1`
- Visible activities for unassigned juries: `0`
- Visible archived activities: `0`

An unrelated active Gestor was simulated as a negative control:

- Visible reported activity: `0`
- Visible historical audience referenced by that inaccessible activity: `0`

## Deployment and database checks

- Local and remote migration histories match through:
  - `20261015173755_align_activity_juries_with_electoral_process.sql`
  - `20261015174055_preserve_legacy_target_visibility.sql`
- Linked schema lint for `public` and `private`: no schema errors.
- Performance advisor: no issues found.
- Security advisor: no warnings introduced by this change. The pre-existing warnings remain:
  - Eight intentionally exposed authenticated `SECURITY DEFINER` RPCs require a separate privilege-design review before changing their execution model.
  - Authentication OTP expiry exceeds the recommended threshold.
  - Leaked-password protection is disabled.

## OpenSpec

- `openspec validate reconcile-process-scoped-activity-visibility --strict` passes.
