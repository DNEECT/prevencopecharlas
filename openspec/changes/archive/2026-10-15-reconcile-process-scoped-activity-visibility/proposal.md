# Proposal

## Why

Process-scoped ERM catalogs and jury assignments were introduced after some activities had already been recorded with EG catalog identifiers. Those mismatched references cause assignment-based row-level security and joined catalog reads to hide otherwise authorized activities from the responsible Monitor.

## What Changes

- Reconcile an activity whose jury belongs to another electoral process only when exactly one active jury with the same normalized name exists in the activity's process; fail safely when the mapping is ambiguous or absent.
- Enforce process alignment between activities and their selected jury and activity format at the database boundary.
- Preserve historical target-audience classifications when the active process has no exact equivalent, while allowing an authorized user to resolve the referenced audience when reading an accessible activity.
- Verify that assignment-scoped Monitors regain access to corrected activities without broadening access to unrelated juries, creators, or archived records.
- Keep the public activity API and stored historical classifications unchanged.

## Capabilities

### New Capabilities

- `process-scoped-activity-visibility`: Defines catalog-reference integrity and authorized visibility for activities in electoral processes that require jury assignments, including safe treatment of historical catalog references.

### Modified Capabilities

None. No main capability specs are currently archived; this focused capability complements the in-flight backend migration change without rewriting its historical intent.

## Impact

- Supabase schema migrations for `activity_registrations`, `special_juries`, and `activity_formats`.
- Row-level security for `target_audiences` and the existing `private.can_access_activity` authorization boundary.
- Existing data with cross-process jury references is corrected; future cross-process jury or format writes are rejected.
- No Angular route, component, or public RPC signature changes are required.
