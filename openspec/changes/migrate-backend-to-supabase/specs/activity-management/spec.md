# Spec Delta

## Purpose

Defines the observable data and workflow behavior for configuring, recording, finding, updating, and retiring PREVENCOPE training activities and their participants.

## ADDED Requirements

### Requirement: Authenticated users can read active activity catalogs
The system SHALL expose active activity types, assistant types, target audiences, electoral processes, and special electoral juries to authenticated application users. Catalog responses SHALL preserve the codes and Spanish descriptions expected by the existing Angular forms. Historical Elecciones Generales 2026 and current ERM 2026 JEE display names SHALL use the same Spanish title style, including applicable accents, without changing their stable identifiers.

#### Scenario: Load registration form catalogs
- **WHEN** an authenticated active user opens the activity registration form
- **THEN** the system returns the active formats, target audiences, and special electoral juries for the selected process that the user is allowed to use
- **AND** each entry includes a stable code and display name

#### Scenario: Load the ERM 2026 target audiences

- **WHEN** an authorized user opens an ERM 2026 activity form
- **THEN** Público objetivo contains exactly Asociaciones, Comunidades campesinas o nativas, Estudiantes, Gremios Empresariales, Jueces de paz, Organizaciones políticas, Organizaciones sociales y sociedad civil, Prefecturas y Subprefecturas, Rondas campesinas, Sindicatos, Tenientes gobernadores, and Usuarios de programas sociales

#### Scenario: Default the current electoral process on a new registration

- **WHEN** an authenticated active user opens a new activity registration
- **THEN** the active catalog entry marked as the default process is preselected
- **AND** opening an existing activity retains its stored electoral process

#### Scenario: Anonymous catalog request
- **WHEN** a request without a valid authenticated session reads an application catalog
- **THEN** the system returns no catalog rows

#### Scenario: Display historical and current JEE catalogs
- **WHEN** an authorized Administrator or Director selects Elecciones Generales 2026 or ERM 2026
- **THEN** every JEE name uses consistent Spanish title capitalization and applicable accents
- **AND** the normalization does not change the JEE identifier or any linked activity

### Requirement: Monitor users manage activity configuration
The system SHALL allow active Monitor users to create, update, archive, and list activity types and activity formats. A format SHALL reference an active activity type and SHALL contain a topic compatible with the existing form and a series of at most 20 characters. Active formats SHALL have case-insensitively unique series.

#### Scenario: Create an activity format
- **WHEN** an active Monitor submits a valid activity type, topic, and series
- **THEN** the system creates one format with a stable identifier and initial sequence state

#### Scenario: Gestor attempts configuration change
- **WHEN** a Gestor attempts to create, update, or archive an activity type or format
- **THEN** the system rejects the write regardless of client-side controls

### Requirement: Activity identifiers are generated atomically
The system SHALL generate registration identifiers as the selected format's series followed by its current sequence number padded to at least four digits, then advance that sequence atomically with registration creation. Concurrent registrations for the same format MUST receive different identifiers.

#### Scenario: Concurrent registrations
- **WHEN** two authorized users create registrations for the same format concurrently
- **THEN** each registration receives a unique sequential number and code

### Requirement: Authorized users record complete activities
The system SHALL store each activity with its format, internal assistant type, target audience, electoral process, special electoral jury, place, date, time, recommendations, questions, creator, and audit timestamps. The system SHALL reject missing, inactive, closed, or cross-process catalog references. Formats, target audiences, and special electoral juries configured for ERM 2026 SHALL reference that process explicitly. The ERM 2026 form SHALL hide Tipo de asistente and persist the controlled internal value No aplica; historical records SHALL retain their original assistant type.

#### Scenario: Create a valid registration
- **WHEN** an authorized active user submits all required fields with valid catalog references
- **THEN** the system creates the activity and returns its generated identifier

#### Scenario: Create or edit an ERM 2026 registration

- **WHEN** an authorized user creates or edits an ERM 2026 activity
- **THEN** the form does not display Tipo de asistente
- **AND** the database stores No aplica as its internal assistant type
- **AND** a direct request using a different assistant type is rejected

#### Scenario: Missing catalog reference
- **WHEN** a registration references an inactive, missing, closed, or different-process format, target audience, process, or jury
- **THEN** the system rejects the registration without creating partial data

#### Scenario: Historical General 2026 registration attempt

- **WHEN** any user attempts to create, edit, or archive an Elecciones Generales 2026 activity
- **THEN** the system rejects the write because that process is historical and read-only

### Requirement: Participants remain linked to their activity
The system SHALL store zero or more participants for an activity in the same atomic operation as the activity write. New participants SHALL have an eight-digit DNI, full name, sex, non-negative age, and organization; position, phone, email, and population classification SHALL be optional within the existing form limits. Historical imported rows with documented blank values SHALL remain readable without fabricated replacements.

#### Scenario: Save an activity and participants
- **WHEN** an authorized user submits a valid activity with valid participant rows
- **THEN** the system persists the activity and all participants together

#### Scenario: Invalid participant prevents partial save
- **WHEN** any participant violates a required validation rule
- **THEN** neither the participant set nor its new activity is committed

### Requirement: Activity queries return scoped joined data
The system SHALL provide authorized users with paginated activity results containing the catalog names, format topic and series, participant count, and evidence references required by the existing list and detail screens. The legacy-compatible list SHALL search registration code and support optional electoral-process and special-electoral-jury filters. The JEE selector SHALL contain only entries from the selected process so identically named historical and current JEE are not presented as duplicates.

#### Scenario: Filter the list by electoral process and JEE

- **WHEN** an authorized user opens the activity list
- **THEN** the list contains registrations from every electoral process authorized for that user
- **AND** the process filter includes only the processes allowed by the user's active roles and JEE assignments
- **AND** a Monitor or Gestor with ERM 2026 access starts with ERM 2026 selected
- **AND** an Administrator or Director starts with no process selected and sees all authorized registrations
- **AND** the JEE selector remains empty until a process is selected
- **WHEN** the user selects a different process
- **THEN** the JEE selection is cleared and replaced with that process's JEE catalog
- **AND** the activity results are filtered by the selected process

#### Scenario: Monitor lists activities
- **WHEN** an active Monitor requests the activity list
- **THEN** the response contains only ERM 2026 registrations for the JEE assigned to that Monitor
- **AND** the process selector and response contain no Elecciones Generales 2026 historical data unless that profile also has an active Administrator or Director role

#### Scenario: Gestor lists activities
- **WHEN** an active Gestor requests the activity list
- **THEN** the response contains only active ERM 2026 registrations created by that Gestor for the assigned JEE
- **AND** it contains no Elecciones Generales 2026 historical registration

#### Scenario: Director lists activities

- **WHEN** the active Director or Administrator requests the activity list
- **THEN** the response can contain all historical and current registrations across JEE

### Requirement: Deletion preserves an audit trail
User-facing delete operations SHALL archive application records instead of removing their business and audit history. Archived rows SHALL not appear in normal active lists and SHALL remain unavailable to unauthorized users.

#### Scenario: Authorized user deletes an activity
- **WHEN** a Monitor archives an activity or a Gestor archives one they created
- **THEN** the activity is marked archived with actor and timestamp information
- **AND** it no longer appears in normal activity queries
