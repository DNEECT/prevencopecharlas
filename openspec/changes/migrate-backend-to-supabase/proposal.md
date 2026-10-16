# Proposal

## Why

PREVENCOPE Charlas currently depends on a Spring Boot and PostgreSQL backend hosted through paid IONOS infrastructure, while the institutional account does not have access to that paid service. The application needs an institution-owned, reproducible backend on Supabase that can run with the Angular frontend on Vercel and enforce the existing Monitor and Gestor access model without exposing privileged credentials to the browser.

## What Changes

- Add versioned Supabase migrations for user profiles, roles, permissions, activity catalogs, activity formats, electoral processes, special electoral juries, activity registrations, participants, and file metadata.
- Replace legacy password and JWT ownership with Supabase Auth identities linked one-to-one to application profiles.
- Preserve the verified Monitor administration and Gestor activity-registration permission matrix with database-managed role membership, explicit grants, and row-level security on every exposed application table.
- Add a private Supabase Storage bucket for attendance lists and photographic evidence, with policies tied to authenticated users and activity access.
- Add stable database functions and views needed by the Angular application for generated activity codes, joined display data, and permission checks.
- Seed non-sensitive role, permission, and lookup catalog data required for a fresh environment.
- Adapt the Angular data and authentication layer to Supabase while preserving the current user-facing workflows and Spanish field semantics.
- Replace the legacy proxy with authenticated Supabase data access and a narrow administrative Edge Function, then remove the IONOS URL and proxy implementation after parity verification.
- Add validation for migration replay, RLS isolation, role permissions, storage access, and the production Angular build.
- Use the now-readable legacy PostgreSQL dump and Spring Boot source as the migration contract. The dump has 19 tables, 92 users, 1,637 activities, and 32,042 participants. Recover referenced evidence objects separately: 2,632 distinct attachment names occur in the dump, but none of the corresponding files is present in the supplied source tree.

## Capabilities

### New Capabilities

- `activity-management`: Defines the catalogs, formats, registrations, participants, generated identifiers, joined read models, and lifecycle rules used by PREVENCOPE Charlas.
- `identity-and-access`: Defines Supabase Auth profile linkage, the legacy module/action permission matrix, Monitor administration, creator-scoped Gestor access, and table RLS behavior.
- `evidence-storage`: Defines private storage of attendance lists and photographic evidence, metadata linkage, file constraints, and authorized access.
- `legacy-data-import`: Defines a repeatable, auditable import contract for the available PostgreSQL dump and for attachment files if they are recovered.

### Modified Capabilities

None. This repository does not yet contain baseline OpenSpec capabilities.

## Impact

- Adds Supabase SQL migrations, seed data, storage policies, generated database types, and migration verification scripts.
- Changes Angular authentication, repositories, guards, environment configuration, and upload/download behavior.
- Affects the Supabase project `betgsxbtyckbbiepmols` and the GitHub repository `DNEECT/prevencopecharlas`.
- Leaves the unrelated Vercel CLI account and `gamersproject/gptcg` project unchanged.
- The dump is currently accessible on the network share. Attachment objects still require recovery and reconciliation before evidence migration can be declared complete.
