# Design

## Context

See `proposal.md` for motivation and the capability deltas for required behavior. The Angular list currently uses one repository method for both interactive pagination and full export. Interactive requests ask Supabase for an exact count through the `activity_list` security-invoker view, while export requests use a nominal 500-row range and also request an exact count. The production test showed that a process-scoped page can return 224 records, but the corresponding bulk export fails after prolonged loading; a single-record participant export succeeds and produces a valid workbook. An unfiltered Director request traverses current and historical rows under RLS and is currently surfaced as `No hay resultados` when it fails.

The database remains the authorization boundary. Client changes must not replace RLS filtering or use privileged credentials. The working branch also contains unrelated local edits, so implementation must be rebased or reconciled with the current remote branch before editing overlapping activity files.

## Goals / Non-Goals

**Goals:**

- Keep the Director process filter empty on initial load and make the all-process result reliable.
- Separate UI-page retrieval from complete export retrieval so each path has an appropriate pagination and counting strategy.
- Guarantee loading cleanup and user-visible outcomes for success, empty results, query errors, and workbook errors.
- Verify the behavior against realistic historical volume and role scopes.

**Non-Goals:**

- Broaden any role's RLS scope or introduce a service-role export path.
- Add participant-level data to the list-level activity report.
- Change the existing single-activity participant export format.
- Redesign the activity-list filters or general table component.

## Decisions

### Preserve the empty Director process filter

The list will continue to pass a null process identifier when a Director has not selected a process. The repository and database path must support that query as the canonical all-accessible-process view. Automatically choosing the current process would hide historical records and contradict the reporting requirement.

The alternative of forcing a default process was rejected because it changes the meaning of the Director dashboard and the requested report.

### Split paged listing from complete export retrieval

The repository will expose distinct observable behavior for a UI page and for iterating all export rows, while sharing filter construction and row mapping. Interactive listing will request only the selected page plus the count needed by the paginator. Bulk export will retrieve deterministic, bounded chunks ordered by `created_at` and `id`, avoid repeating an exact count on every chunk, and continue until a short/empty page terminates the sequence.

The chunk size will be chosen below the production timeout threshold and covered by a multi-page test. Stable two-column ordering is required so adjacent pages cannot duplicate or skip rows when timestamps match. Loading all rows with one larger range was rejected because that is the reproduced failure mode.

### Optimize the authorized all-process database path before increasing timeouts

Implementation will capture the failing Supabase error and compare filtered and unfiltered query plans at representative historical volume. Any database change will retain invoker/RLS behavior and focus on statement-cached role checks, eliminating repeated row lookups, and indexes supporting active-row filtering plus the stable sort/filter columns. A dedicated invoker RPC may be introduced only if the view plus RLS path cannot meet the bounded page requirement; it must return the same authorized rows and must not be security-definer.

Increasing client or platform timeouts alone was rejected because it would preserve an inefficient query and an indefinite user experience.

### Treat empty results and failures as different states

The component will set the no-results state only from a successful zero-row response. Query failures will clear loading UI through `finalize`, retain an explicit failure state, and show a snackbar or equivalent actionable message. Export will await workbook creation inside the controlled async flow so generation failures are caught rather than discarded by `.then()`.

The Excel service will reject or explicitly handle an empty dataset without evaluating `Object.keys(data[0])`. The component owns the user-facing “no records to export” outcome because it has filter and dialog context.

### Verify at component, repository, and browser boundaries

Tests will cover filter arguments, paged aggregation, stable termination, zero rows, mid-page failure, workbook failure, and loading cleanup. Database verification will exercise a Director with access to current and historical processes and a restricted user to prove authorization did not broaden. A production-like browser test must confirm an unfiltered list renders records and the downloaded workbook row count matches the authorized query count.

## Risks / Trade-offs

- [Rows change while a multi-page export is running, causing drift] → Use deterministic ordering and document that the export is a read-time snapshot; prefer keyset continuation if offset tests demonstrate duplication under concurrent inserts.
- [Smaller chunks increase request count] → Avoid per-chunk exact counts and select only report columns so each request remains bounded without excessive database work.
- [RLS optimization accidentally broadens visibility] → Retain invoker execution and add cross-role SQL tests for Director, restricted assignments, inactive rows, and out-of-scope processes.
- [Errors remain opaque in production] → Normalize Supabase and workbook errors into user-safe messages while logging enough non-sensitive context to diagnose the failing boundary.
- [Local branch divergence causes an implementation conflict] → Reconcile with the current remote activity-list implementation before applying code changes; preserve unrelated working-tree edits.

## Migration Plan

1. Add failing Angular and database regression tests for unfiltered Director listing and multi-page export.
2. Apply and verify any RLS/query/index migration in a disposable Supabase environment using representative historical volume.
3. Implement split list/export retrieval, empty handling, awaited workbook generation, and explicit UI error states.
4. Run SQL authorization/performance checks, focused Angular tests, production build, and browser download verification.
5. Deploy the database migration before or atomically with the compatible frontend release, then verify unfiltered listing and workbook row counts with the Director test account.

Rollback the frontend to the prior deployment if the new retrieval flow regresses. Database optimizations must be additive or restored with a forward migration; do not remove authorization policies or historical data during rollback.
