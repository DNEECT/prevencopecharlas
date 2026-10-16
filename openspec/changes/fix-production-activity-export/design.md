# Design

## Context

See `proposal.md` for motivation and the `activity-report-export` delta for required behavior. The production Director list now returns 1,681 authorized activities and correct participant totals, confirming that the RLS-aware `activity_list` view can serve the data. The bulk export, however, performs sequential range requests in 100-row chunks and catches failures without preserving their cause. At current volume this means 17 serialized database requests before Excel generation; the production browser returns to idle without a workbook or useful diagnostics.

The database remains the authorization boundary. Export must use the authenticated Supabase session and the existing security-invoker/RLS path unless query evidence proves a database-side optimization is needed. No privileged credential may be introduced in the browser.

## Goals / Non-Goals

**Goals:**

- Retrieve production-scale export results in a bounded number of deterministic requests.
- Prevent omissions or duplicates across export pages.
- Generate one workbook only after the complete result has been assembled.
- Preserve participant totals and all active filters.
- Make the failing phase diagnosable without exposing record data or secrets.

**Non-Goals:**

- Change which activities any role is authorized to read.
- Delete, rewrite, or migrate registered activity data.
- Change the interactive table pagination or the single-activity participant export.
- Add participant-level personal data to the list-level workbook.

## Decisions

### Use keyset pagination for full export

The export repository path will request bounded chunks ordered by `created_at DESC, id DESC`. Each request after the first will continue strictly after the last row's composite cursor; retrieval ends when a page is shorter than the configured export chunk size. The default chunk will be 500 rows so the current 1,681-row result requires four requests rather than seventeen.

Keyset pagination is chosen over increasing one range request because Supabase/PostgREST response limits remain relevant as data grows. It is chosen over deep offset pagination because concurrent inserts before an offset can otherwise duplicate or skip rows. The existing filter builder and row mapper remain shared with the list path so filter and participant-count semantics stay aligned.

### Keep database optimization evidence-driven and additive

Before adding SQL, implementation will capture the actual Supabase failure and run representative query-plan checks for the ordered, filtered export query. If the existing security-invoker view and indexes satisfy the bounded request target, no migration will be added. If not, an additive index or authenticated `SECURITY INVOKER` export function may be introduced only with cross-role authorization tests and `EXPLAIN (ANALYZE, BUFFERS)` evidence.

This avoids speculative database changes and rules out a service-role or security-definer shortcut, either of which could bypass the intended authorization boundary.

### Separate retrieval completion from workbook generation

The component will await complete retrieval first, then await a single workbook-generation call. Empty results will be handled before invoking the Excel service. A failure on any retrieval page aborts the sequence and no partial workbook is produced.

The Excel service will return a promise that settles only after the workbook buffer is produced and the save call is issued. This gives the component one controlled success/failure boundary and prevents fire-and-forget promise failures from escaping the existing `try/catch/finally` flow.

### Preserve phase-aware diagnostics

Errors will be normalized with a phase (`retrieval` or `workbook`) and logged with safe technical context such as Supabase error code/message and the page/cursor position. Filters may be logged only as identifiers already visible to the authenticated user; activity rows, participant data, tokens, and credentials will not be logged. The user continues to receive a concise Spanish error message, and the loading state closes in `finally` for every outcome.

### Verify the downloaded artifact, not only method calls

Repository tests will cover keyset continuation, tied timestamps, short-page termination, filters, and a later-page failure. Component and Excel-service tests will cover empty data, exactly one save, workbook failure, participant values, and loading cleanup. A production-like browser test with at least 1,681 authorized activities will inspect the generated workbook's data-row count and representative participant totals.

## Risks / Trade-offs

- [Rows are edited during export] → Keyset ordering prevents offset drift; document that field values reflect the time each page was read rather than a database-wide snapshot.
- [Composite cursor filtering is encoded incorrectly] → Add tied-`created_at` fixtures and assert that IDs are neither skipped nor repeated across boundaries.
- [A 500-row chunk still exceeds the production latency budget] → Keep chunk size configurable within a safe bound and use query-plan evidence before lowering it or adding SQL optimization.
- [Browser memory grows with future datasets] → Current volume is safe; retain bounded retrieval and record streaming/server-generated export as a future option if observed volume makes client-side workbook generation unsafe.
- [Diagnostics expose sensitive data] → Log only phase, error metadata, and cursor/page identifiers; never log returned rows or authentication material.

## Migration Plan

1. Add failing repository, component, and workbook regression tests, including a 1,681-row fixture.
2. Implement keyset export retrieval and awaited workbook generation without changing database authorization.
3. Run focused Angular tests, the production build, and Supabase authorization/performance checks.
4. Add a forward-only database migration only if measured query evidence requires an index or invoker function; validate it in a non-production environment first.
5. Deploy the frontend and any required additive migration, then verify the Director's unfiltered export and compare workbook row and participant counts with the authorized list.

Rollback by restoring the previous frontend deployment. Any database optimization must be additive and independently reversible with a forward migration; no rollback step deletes or rewrites registered records.
