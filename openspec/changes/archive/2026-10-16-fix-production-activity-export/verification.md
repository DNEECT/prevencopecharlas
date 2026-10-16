# Production Verification

Verified on 2026-10-16 as an authenticated Director at `https://prevencopecharlas.vercel.app/registro-actividad`.

## Deployment evidence

- Pull request: `https://github.com/DNEECT/prevencopecharlas/pull/3`
- Merge commit on `main`: `92d01576e6bf50ec59bcc04511d38c0820532083`
- Production frontend bundle after promotion: `main-SLSOEHXT.js`
- Applied Supabase migration: `20261016171351_optimize_activity_export_rls.sql`
- The migration was applied with `supabase db push --linked --skip-vault --yes`; the CLI reported that this was the only pending migration and that it completed successfully.

## Browser and workbook evidence

- With process, jury, and search filters empty, the Director list reported 1,681 authorized activities. One export action produced one valid workbook with 1,681 data rows, 1,681 unique activity codes, and no blank activity codes.
- With `Elecciones Regionales Municipales 2026` selected, the list reported 226 activities. One export action produced one valid workbook with 226 data rows, 226 unique activity codes, and only the selected process.
- Representative list/workbook participant totals matched: `SP-ERM20260226 = 1`, `SP-ERM20260225 = 9`, `SP-ERM20260224 = 12`, `SP-ERM20260223 = 78`, and `SP-ERM20260222 = 36`.
- The unfiltered workbook contained 35,860 total participants across 1,681 non-zero rows. The filtered workbook contained 4,411 total participants across 226 non-zero rows.
- Both actions displayed `Reporte exportado correctamente.` and returned the Export button to its idle state.

## Data safety and rollback

- The release does not delete, rewrite, or migrate any `activity_registrations`, participant, or evidence records.
- Frontend rollback is restoring the prior Vercel production deployment.
- Database rollback is an independent forward migration that drops the two optimized SELECT policies and recreates their prior definitions using `is_active and private.can_access_activity(activity_id, 'LIST')` from `20260921201529_rls_policies.sql`.
- Frontend and database rollback can be performed independently. Neither rollback path deletes or rewrites registered activity data.
