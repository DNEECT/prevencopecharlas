# Supabase migration

This repository starts from the Angular frontend formerly connected to the
Spring Boot service at `prevencope.actividades.api.fordevs.pe`. The legacy
proxy remains temporarily so each module can be migrated and verified without
an all-at-once cutover.

## Target architecture

- Angular static frontend on Vercel.
- Supabase Auth for sessions and password management.
- Supabase Postgres and Data API for application data.
- Supabase Storage with a private bucket for evidence files.
- Authenticated Edge Functions for DNI/RUC lookups and other secret-bearing
  integrations.

## Local setup

1. Use Node.js 20 or later.
2. Run `npm ci`.
3. Run `npm run supabase:start` with Docker Desktop running.
4. Add the local project URL and publishable key reported by
   `npm run supabase:status` to both Angular environment files.
5. Run `npm start`.

Never place a Supabase secret key, service-role key, database password, or
third-party API token in Angular code. Browser code may contain only the
project URL and publishable key, protected by database and Storage RLS.

## Migration sequence

1. Recover and inspect the PostgreSQL dump without committing it.
2. Create migrations for the existing tables, relationships, and seed data.
3. Map legacy users to Supabase Auth and require password resets.
4. Implement role and permission policies for Monitor and Gestor users.
5. Migrate lookup catalogs and validate read-only screens.
6. Migrate activity formats and activity registrations.
7. Move evidence files into a private Storage bucket.
8. Move DNI/RUC calls into an authenticated Edge Function.
9. Remove the Vercel proxy and all Spring backend URLs after parity testing.

## Security rules

- Require explicit grants for every table exposed through the Data API.
- Enable RLS on every exposed table and Storage bucket.
- Base authorization on `auth.uid()` and database role membership.
- Do not use user-editable metadata for authorization.
- Keep privileged functions outside exposed schemas and grant execution only
  to the roles that require them.
- Keep database dumps, exports, logs, and `.env` files out of Git.
