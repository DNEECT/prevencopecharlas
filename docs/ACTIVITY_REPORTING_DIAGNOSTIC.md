# Activity reporting query diagnostic

## Reproduction

The authenticated Director page was tested on 2026-10-16 with the electoral-process,
jury, and search filters empty. The request remained pending for approximately 55
seconds and the current component then rendered `No hay resultados`. The frontend did
not retain or display the Supabase error payload, so the empty-state message is not
evidence of an empty database.

The local diagnostic in `supabase/tests/activity-reporting-plan.sql` creates 1,500
synthetic active activities and 4,500 synthetic participants inside a transaction. It
runs as an authenticated Director and rolls every fixture back. No production rows,
credentials, participant names, or document numbers are recorded.

With a representative 500 ms statement limit, the current unfiltered first-page query
fails with:

```text
SQLSTATE 57014: canceling statement due to statement timeout
CONTEXT: SQL function "can_access_jury" statement 1
```

Without that artificial limit, the captured local plans measured approximately:

- 0.79 seconds for an unfiltered five-row page;
- 0.71 seconds for the exact count over the same authorized result;
- 0.54 seconds for the process-filtered five-row page.

These are local warm-cache timings, not production service-level targets. They are used
to identify plan shape and relative work.

## Confirmed bottleneck

The page plan scans and sorts all 1,500 authorized activity rows before returning five.
More importantly, invoker-RLS checks on joined catalog tables are correlated with each
row:

- `private.can_access_process(...)` is evaluated thousands of times through electoral
  process and process-scoped catalog policies;
- `private.can_access_jury(...)` is evaluated once per joined jury row and is the
  function named by the timeout;
- participant counts call `private.can_access_activity(...)` for each participant row;
- there is no active-row `(created_at, id)` index supporting the stable list order.

The Director decision is constant for the request but is recomputed inside correlated
helpers. The fix therefore needs a statement-cached Director fast path in the relevant
read policies, a stable active-row sort index, and a lightweight authorized count path.
The browser must continue using the authenticated invoker role; a service-role or
security-definer reporting endpoint would weaken the existing authorization boundary
and is not acceptable.
