# Tasks

## 1. Reproduce and Characterize

- [x] 1.1 Add a repository regression fixture with at least 1,681 authorized activity rows, repeated `created_at` values, and representative participant totals; verify the current export path reproduces the missing-download or retrieval failure boundary.
- [x] 1.2 Capture the production-equivalent Supabase error and measure the ordered `activity_list` export query with representative filters; verify the diagnostic identifies retrieval versus workbook generation and contains no activity data or credentials.

## 2. Deterministic Export Retrieval

- [x] 2.1 Implement bounded keyset pagination ordered by `created_at DESC, id DESC` with a default 500-row export chunk; verify repository tests return all 1,681+ rows exactly once, including rows with tied timestamps.
- [x] 2.2 Apply process, jury, and search filters consistently to every export page; verify repository tests include only matching authorized rows for each filter combination.
- [x] 2.3 Abort on any failed retrieval page with phase-aware safe diagnostics and no partial result; verify a later-page failure test rejects once and does not request or return subsequent pages.

## 3. Workbook and UI Completion

- [x] 3.1 Make Excel workbook generation return an awaited promise that settles after buffer creation and the save call; verify service tests cover one successful save, buffer failure, and preserved participant totals.
- [x] 3.2 Update export orchestration to retrieve all rows before invoking Excel generation and to handle zero rows explicitly; verify component tests produce exactly one workbook on success and no workbook for empty or failed retrieval.
- [x] 3.3 Preserve retrieval/workbook phase diagnostics while showing a safe Spanish message and closing loading state in every outcome; verify component tests cover success, empty result, retrieval failure, and workbook failure without unhandled promise rejections.

## 4. Database Safety and Performance

- [x] 4.1 Run authorization and query-plan checks for unfiltered Director and restricted-role exports; verify RLS scope is unchanged and each 500-row page completes within the established test-environment query budget.
- [x] 4.2 If and only if query evidence requires it, add an additive index or authenticated `SECURITY INVOKER` database path plus migration tests; verify `EXPLAIN (ANALYZE, BUFFERS)` improves the measured plan and cross-role SQL tests still pass.

## 5. End-to-End Verification

- [x] 5.1 Run focused Angular repository, component, and Excel-service tests plus Supabase reporting/authorization tests; verify all suites pass.
- [x] 5.2 Run the production build; verify it completes without new TypeScript, bundling, or size-budget failures attributable to the change.
- [ ] 5.3 In a production-like browser session as Director, export the unfiltered 1,681+ row result and a filtered result; verify each action downloads exactly one valid `.xlsx`, row counts match the authorized list, representative participant totals match, and loading returns to idle.
- [ ] 5.4 Record deployment and rollback evidence; verify the release requires no deletion or rewrite of registered activities and any database optimization is independently reversible by a forward migration.
