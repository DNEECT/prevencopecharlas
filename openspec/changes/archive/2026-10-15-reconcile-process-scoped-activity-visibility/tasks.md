# Tasks

## 1. Audit and Reconcile Historical Juries

- [x] 1.1 Query active activities for jury/process mismatches, confirm each mismatch has exactly one active same-name jury in its activity process, and record the mismatch and candidate counts.
- [x] 1.2 Implement a guarded set-based jury reconciliation that aborts on missing or ambiguous candidates, rehearse it inside a rolled-back transaction, and verify the rehearsal leaves zero mismatches before rollback.
- [x] 1.3 Add and validate the composite jury/process key and activity foreign key, then verify a cross-process jury write is rejected while an aligned write remains valid.

## 2. Preserve Historical Catalog Meaning

- [x] 2.1 Identify activities whose historical target audience is outside the activity process, confirm there is no exact approved replacement, and verify their stored audience references remain unchanged.
- [x] 2.2 Update target-audience read authorization so an audience is readable through an active activity the caller can list, add the supporting reference index, and verify an unauthorized caller cannot read the same audience through an inaccessible activity.
- [x] 2.3 Add and validate the composite format/process key and activity foreign key, then verify a cross-process format write is rejected and existing activities remain valid.

## 3. Deploy and Verify Authorization

- [x] 3.1 Apply the migrations to the linked Supabase project in dependency order and verify local and remote migration histories contain the same versions.
- [x] 3.2 Simulate the affected Monitor's authenticated scope and verify the reported Canchis activity and its historical audience label are visible while unassigned-jury and archived activities remain excluded.
- [x] 3.3 Verify zero jury/process and format/process mismatches, four intentionally preserved legacy audience references, and validated composite foreign-key constraints after deployment.
- [x] 3.4 Run linked schema lint plus security and performance advisors, verify no schema or performance errors were introduced, and document any pre-existing security warnings separately from this change.

## 4. Change Validation

- [x] 4.1 Run strict OpenSpec validation for `reconcile-process-scoped-activity-visibility` and verify the change passes with all required planning artifacts present.
