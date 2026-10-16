# Spec Delta

## Purpose

Defines a repeatable and auditable process for importing legacy PREVENCOPE PostgreSQL records and evidence without exposing secrets or corrupting the new Supabase model.

## ADDED Requirements

### Requirement: Import requires an explicit source inventory
Before mutating production data, the import process SHALL inventory source tables, row counts, relationships, users, catalog values, and evidence references or files and SHALL report mappings or conflicts against the destination model. The currently readable dump has 19 tables, 92 users, 1,637 registrations, and 32,042 participants; 2,632 distinct referenced attachment names have no matching objects in the supplied source tree.

#### Scenario: Attachment source is unavailable
- **WHEN** the database dump is readable but referenced evidence objects cannot be found
- **THEN** the database inventory remains usable while evidence parity is marked incomplete
- **AND** the import does not create guessed objects or working download links

### Requirement: Import is repeatable and traceable
Imported business records SHALL retain their existing UUID identifiers and source/batch provenance sufficient to detect duplicates. Application profiles SHALL map legacy user UUIDs to new Supabase Auth identities. Re-running the same approved import SHALL not create duplicate profiles, activities, participants, or evidence metadata.

#### Scenario: Repeat an import batch
- **WHEN** an already completed source batch is executed again
- **THEN** existing mapped records are reconciled without duplication

### Requirement: Historical state and exceptions are retained
The importer SHALL preserve active and inactive record state, registration codes, creator and updater links, and the source's recorded participant values. It SHALL report historical blanks that violate new-entry validation without inventing replacements. New-entry validation SHALL continue to apply to registrations created after cutover.

#### Scenario: Historical participant has a blank required field
- **WHEN** a legacy participant has a blank sex or organization value
- **THEN** the importer retains the historical row, marks the exception for review, and does not fabricate a value

#### Scenario: Inactive activity is imported
- **WHEN** a legacy activity is marked inactive
- **THEN** its history and relationships are retained but it is absent from normal active lists

### Requirement: Credentials and secrets are never migrated as application data
The import SHALL NOT copy legacy password hashes, JWT secrets, database credentials, external API tokens, or private dump files into the repository or browser-accessible tables. Migrated users SHALL receive Supabase Auth identities through an administrative invitation or reset flow.

#### Scenario: Source contains a password hash
- **WHEN** a legacy user row includes password material
- **THEN** the importer ignores that material and records no password value in application tables

### Requirement: Production import is gated by reconciliation
The import process SHALL support a dry run that reports expected inserts, updates, skips, historical-validation exceptions, unresolved foreign keys, and missing files. A production run SHALL produce a reconciliation report comparing source and destination counts. Unresolved database relationships SHALL block the affected import; missing attachment objects SHALL block evidence parity and final cutover until recovered or explicitly accepted as irrecoverable.

#### Scenario: Dry run finds unresolved relationships
- **WHEN** source activities reference unknown catalogs, users, processes, or juries
- **THEN** the dry run reports each unresolved reference and production import remains blocked

#### Scenario: Successful production import
- **WHEN** the approved batch contains no blocking validation errors
- **THEN** the system imports the batch transactionally where possible and emits a reconciliation report

### Requirement: Imported rows obey current authorization
After import, legacy records SHALL be subject to the same active-profile, module/action, creator-ownership, row-level security, and storage policies as newly created records.

#### Scenario: Gestor reads another creator's imported activity
- **WHEN** a Gestor queries an imported activity created by another user
- **THEN** the database does not expose the imported row
