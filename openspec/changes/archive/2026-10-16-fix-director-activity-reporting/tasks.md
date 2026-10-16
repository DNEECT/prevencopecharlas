# Tasks

## 1. Baseline and Regression Coverage

- [x] 1.1 Reconcile the implementation branch with the current remote activity-list/process-filter code while preserving unrelated working-tree changes, and verify the resulting diff contains no accidental user-file changes.
- [x] 1.2 Add repository tests that reproduce an unfiltered Director page, a filtered page, and a multi-page export aggregation, and verify the new tests fail against the current implementation for the expected reasons.
- [x] 1.3 Repair the Angular test bootstrap and activity-list stubs needed by the focused suite, and verify the targeted tests run in Edge/Chrome Headless instead of failing on missing `zone.js/testing` or incomplete mocks.

## 2. Authorized Query Performance

- [x] 2.1 Capture the concrete Supabase error and query plan for filtered and unfiltered Director activity-list requests at representative historical volume, and record the confirmed bottleneck without exposing participant data or credentials.
- [x] 2.2 Add the minimum RLS-helper, view, RPC, or index migration needed for bounded unfiltered pages while preserving invoker execution, and verify SQL tests return all authorized Director rows and exclude restricted, inactive, and out-of-scope rows.
- [x] 2.3 Add a database performance regression check for the unfiltered first page and bounded export pages, and verify it completes below the configured statement timeout on representative historical volume.

## 3. Listing and Export Implementation

- [x] 3.1 Separate interactive page retrieval from full export retrieval while sharing filter construction and row mapping, and verify the UI path returns one page with paginator metadata.
- [x] 3.2 Implement deterministic bounded export pagination without repeated exact counts, and verify a result spanning multiple chunks contains every matching activity exactly once in stable `created_at`/`id` order.
- [x] 3.3 Preserve a null process filter for the Director initial view and pass selected process, jury, and search filters unchanged, and verify component tests cover unfiltered and filtered calls.
- [x] 3.4 Add distinct successful-empty and failed-query states to the activity list, and verify failures stop loading and display an error instead of `No hay resultados`.
- [x] 3.5 Guard empty Excel input and await workbook generation inside the export flow, and verify empty, retrieval-failure, generation-failure, and success cases always close the loading dialog with the correct user feedback.

## 4. End-to-End Verification and Release Readiness

- [x] 4.1 Run the focused Angular tests, repository tests, SQL authorization/performance checks, and production build, and verify all pass or document any unrelated pre-existing failure separately.
- [x] 4.2 In a production-like authenticated browser session, verify an unfiltered Director sees records across accessible processes, selecting a process narrows the list, and the list-level export downloads a valid workbook whose data-row count matches the authorized query count.
- [x] 4.3 Document the database-before-frontend rollout order and rollback procedure, and verify the release checklist does not require elevated browser credentials or weaken RLS.
