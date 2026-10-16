# Proposal

## Why

Directors currently receive an empty activity table when no electoral process is selected because the authorized all-process query can time out, even though selecting one process returns records. The same scalability failure prevents the list-level Excel export from completing and can also turn an empty result into an unhandled client error.

## What Changes

- Preserve an empty electoral-process filter as the default Director view and return every active activity the Director is authorized to read across current and historical processes.
- Make unfiltered and filtered activity listing complete within a bounded response time without weakening row-level authorization.
- Make the list-level Excel export retrieve all records matching the active filters in bounded pages and produce one complete workbook.
- Distinguish an actual empty result from a request failure in the activity-list UI.
- Handle empty exports and database/export failures explicitly instead of leaving a loading dialog or producing an unhandled promise rejection.
- Add regression coverage for Director all-process visibility, filtered visibility, multi-page bulk export, empty results, and error cleanup.

## Capabilities

### New Capabilities

- `activity-report-export`: Defines reliable, filter-aware Excel export of the complete authorized activity result set, including empty and failure behavior.

### Modified Capabilities

- `process-scoped-activity-visibility`: Extends authorized visibility requirements so Directors can list all active activities across accessible processes when no process filter is selected, while process and jury filters continue to narrow the result.

## Impact

- Angular activity list, repository, Excel service, loading/error feedback, and component/service tests.
- Supabase activity-list query path, RLS-aware pagination/count behavior, and database performance verification.
- No permission broadening: exported and displayed rows remain limited to records already authorized by Supabase RLS.
- No change to single-activity participant export semantics.
