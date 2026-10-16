# Activity reporting release checklist

## Rollout order

1. Apply `20261016162736_optimize_director_activity_reporting.sql` to the target Supabase environment before deploying the frontend. The new frontend calls `public.count_authorized_activities`, so deploying it first would make list requests fail until the function exists.
2. Verify the migration created the active-row ordering index and that `public.count_authorized_activities` remains `SECURITY INVOKER`, is executable by `authenticated`, and is not executable by `anon` or `public`.
3. Run the activity reporting SQL authorization/performance checks against the migrated database. Confirm Director access spans current and historical processes while restricted, inactive, and out-of-scope records remain excluded.
4. Deploy the compatible frontend build.
5. Smoke-test with an ordinary authenticated Director account:
   - Leave Proceso electoral empty and confirm the first page shows authorized records across processes.
   - Select a process and confirm the result narrows to that process.
   - Clear the process and export; confirm the workbook opens and its data-row count matches the authorized unfiltered count.
   - Confirm an empty export and a failed request both stop loading and display different messages.

No service-role key, privileged browser session, policy bypass, or weakened RLS is required for rollout or verification.

## Rollback

1. If the frontend behavior regresses, roll the frontend back to the preceding deployment first. The database migration is backward-compatible and may remain applied while the issue is investigated.
2. If the database changes themselves must be removed, use a reviewed forward migration. Revoke and drop `public.count_authorized_activities`, drop `idx_activities_active_created_at_id`, and restore the exact prior `electoral_processes_read` and `special_juries_read` policy definitions from version control.
3. Re-run the authorization suite after any database rollback. Do not disable RLS, loosen policies, delete historical records, or expose elevated credentials as part of recovery.

## Verification record

- Focused Angular repository, component, and Excel tests: 28 passing.
- Production Angular build: passing.
- `supabase db lint --local --level error --fail-on error`: passing.
- `supabase/tests/erm2026-scope.sql`: passing.
- `supabase/tests/activity-reporting.sql`: passing, including the 1,500-row bounded performance case.
- Authenticated browser smoke test: the unfiltered Director view showed 224 records, the selected-process view showed 112, clearing the process restored 224, and the downloaded workbook contained 224 data rows on sheet `Datos`.
- Existing `supabase/tests/authorization.sql`: blocked before the change-specific assertions by its pre-existing duplicate seeded role name (`Monitor`). This fixture collision is unrelated to activity reporting and is recorded separately rather than treated as a regression introduced by this change.
