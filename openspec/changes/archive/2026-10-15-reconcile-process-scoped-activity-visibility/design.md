# Design

## Context

See `proposal.md` for motivation. Production already uses process-specific formats, audiences, juries, and jury assignments. Authorization evaluates an activity's stored process and jury, so a legacy activity that retained an identically named jury ID from another process is structurally valid under the original independent foreign keys but invisible to the Monitor assigned to the correct process-local jury.

Four active activities have this jury/process mismatch. Those same rows reference historical target-audience classifications for which the current process has no exact semantic equivalent. Current registration RPCs validate process-scoped catalogs, but independent table foreign keys do not protect alternate database write paths.

## Goals / Non-Goals

**Goals:**

- Correct deterministic historical jury mismatches atomically.
- Make jury/process and format/process alignment database invariants.
- Preserve truthful historical audience classifications while making accessible activities renderable.
- Keep authorization scoped to existing process, role, permission, creator, and jury-assignment rules.
- Make deployment safe to rehearse and validate before committing production data changes.

**Non-Goals:**

- Infer or invent a new target-audience classification for historical records.
- Change role memberships, jury assignments, permissions, or account credentials.
- Broaden Monitor access to all juries or historical processes.
- Change Angular screens or public RPC signatures.
- Complete the separate backend migration change's pending invitation and password-reset work.

## Decisions

### Reconcile juries by a guarded process-and-name match

For each mismatched activity, select an active jury in the activity's process whose trimmed, case-normalized name equals the old jury name. Abort the migration if the candidate count is not exactly one, then perform one set-based update and assert that no mismatch remains.

This uses the only verified cross-process business key while preventing silent guesses. Alternatives rejected:

- Hard-coded activity-to-jury IDs would fix the known rows but would not safely handle equivalent drift in another environment.
- Matching only by jury code is unsuitable because process-specific catalog generation and historical normalization do not establish it as a stable cross-process key.
- Leaving the rows unchanged would preserve the visibility defect.

### Enforce composite process ownership for juries and formats

Create unique composite keys on `(id, electoral_process_id)` for juries and formats, then reference them from each activity using composite foreign keys. Add the jury/process constraint only after guarded reconciliation; add each constraint as not validated and validate it explicitly after the data check.

This makes the invariant independent of the client or RPC used to write. Keeping only RPC validation was rejected because direct SQL, imports, and future write paths could reintroduce invalid pairs. Triggers were rejected because declarative constraints are simpler, visible to schema tooling, and checked consistently.

Target audiences deliberately do not receive the same composite foreign key in this change because verified historical classifications have no exact current-process equivalent.

### Authorize legacy audience reads through accessible active activities

Retain the normal active-process audience rule and add a second read path: a target-audience row is visible when an active activity references it and the caller can list that activity under the existing authorization boundary. Index activity audience references to support the correlated lookup.

This preserves the original label and prevents an inaccurate data rewrite. Broadly exposing all historical audiences was rejected because it would bypass process scope. Duplicating legacy labels into the current process was rejected because it would create unsupported catalog semantics and change stored classifications.

### Keep activity authorization unchanged

The correction changes catalog identity, not authorization policy. Activity access continues to require an active profile, effective action permission, active activity, eligible process, and the existing creator, director, or active Monitor jury-assignment scope. Verification impersonates the affected Monitor and also tests a non-assigned scope.

## Risks / Trade-offs

- [A jury name is ambiguous or missing in a target process] → Abort before updating any row and require an explicit data decision.
- [Composite constraints reveal additional invalid production data] → Rehearse the full migration in a transaction and query mismatch counts before deployment.
- [Legacy audience lookup increases RLS work] → Index the referencing foreign key and limit the exception to active activities already authorized for the caller.
- [Rollback removes guardrails after data has been corrected] → Prefer a forward corrective migration; if emergency rollback is required, drop only the new policies, constraints, and indexes while retaining corrected foreign keys unless a verified reverse mapping exists.
- [Future catalog renames undermine name-based reconciliation] → Use name matching only for this guarded historical migration; the resulting composite constraints prevent recurrence.

## Migration Plan

1. Rehearse the jury candidate-count guard, update, residual-mismatch assertion, composite keys, constraints, and policy replacement inside a transaction that is rolled back.
2. Confirm every mismatch has exactly one active same-name jury in its activity process and that all current format/process pairs are aligned.
3. Apply the jury reconciliation migration, then validate the jury/process composite foreign key.
4. Apply the audience-read policy and format/process composite foreign key migration.
5. Verify zero jury/process and format/process mismatches, validated constraints, and unchanged historical target-audience references.
6. Simulate the affected Monitor session and verify the reported activity is visible, unassigned-jury activities remain hidden, and the historical audience label resolves only through an accessible active activity.
7. Run schema lint plus security and performance advisors, and confirm local and remote migration histories match.

Rollback is forward-only for data: publish a new migration that restores the prior audience policy and drops the composite foreign keys if necessary. Do not attempt to restore old cross-process jury IDs without an explicit, verified reverse mapping.
