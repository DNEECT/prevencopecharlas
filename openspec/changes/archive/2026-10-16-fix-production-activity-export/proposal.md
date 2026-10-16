# Proposal

## Why

The production activity list now loads all authorized records for Directors, but exporting the same unfiltered result silently finishes without downloading a workbook. The export must remain reliable at the current production volume (1,681 records and growing) so the requested database report can be delivered.

## What Changes

- Make the activity export retrieve the complete authorized result set reliably when it exceeds a single Supabase response page.
- Guarantee deterministic, duplicate-free pagination while preserving the active process, jury, and search filters.
- Generate and download exactly one valid workbook after all pages are retrieved, including correct participant totals.
- Preserve Supabase row-level authorization throughout export retrieval.
- Surface a safe user-facing failure and retain diagnostic detail when retrieval or workbook generation fails, while always closing the loading state.
- Add repository, component, and production-scale regression coverage for unfiltered and filtered exports.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `activity-report-export`: Strengthens complete-export and explicit-outcome requirements for production-scale, server-paginated results and diagnostic failure handling.

## Impact

- Angular activity repository pagination, export orchestration, error reporting, and tests.
- Supabase activity export query path and performance verification; a database migration is required only if query analysis shows that an RLS-aware function or index is necessary.
- Excel workbook verification for row completeness and participant totals.
- No permission broadening, record deletion, or change to registered activity data.
