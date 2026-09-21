# Spec Delta

## Purpose

Defines the observable data and workflow behavior for configuring, recording, finding, updating, and retiring PREVENCOPE training activities and their participants.

## ADDED Requirements

### Requirement: Authenticated users can read active activity catalogs
The system SHALL expose active activity types, assistant types, target audiences, electoral processes, and special electoral juries to authenticated application users. Catalog responses SHALL preserve the codes and Spanish descriptions expected by the existing Angular forms.

#### Scenario: Load registration form catalogs
- **WHEN** an authenticated active user opens the activity registration form
- **THEN** the system returns every active catalog entry the user is allowed to use
- **AND** each entry includes a stable code and display name

#### Scenario: Anonymous catalog request
- **WHEN** a request without a valid authenticated session reads an application catalog
- **THEN** the system returns no catalog rows

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
The system SHALL store each activity with its format, assistant type, target audience, electoral process, special electoral jury, place, date, time, recommendations, questions, creator, and audit timestamps. The system SHALL reject missing or inactive catalog references. It SHALL preserve the source's separate process UUID and jury record without inventing a jury/process foreign-key relationship.

#### Scenario: Create a valid registration
- **WHEN** an authorized active user submits all required fields with valid catalog references
- **THEN** the system creates the activity and returns its generated identifier

#### Scenario: Missing catalog reference
- **WHEN** a registration references an inactive or missing format, assistant type, target audience, process, or jury
- **THEN** the system rejects the registration without creating partial data

### Requirement: Participants remain linked to their activity
The system SHALL store zero or more participants for an activity in the same atomic operation as the activity write. New participants SHALL have an eight-digit DNI, full name, sex, non-negative age, and organization; position, phone, email, and population classification SHALL be optional within the existing form limits. Historical imported rows with documented blank values SHALL remain readable without fabricated replacements.

#### Scenario: Save an activity and participants
- **WHEN** an authorized user submits a valid activity with valid participant rows
- **THEN** the system persists the activity and all participants together

#### Scenario: Invalid participant prevents partial save
- **WHEN** any participant violates a required validation rule
- **THEN** neither the participant set nor its new activity is committed

### Requirement: Activity queries return scoped joined data
The system SHALL provide authorized users with paginated activity results containing the catalog names, format topic and series, participant count, and evidence references required by the existing list and detail screens. The legacy-compatible list SHALL search registration code and support an optional special electoral jury filter.

#### Scenario: Monitor lists activities
- **WHEN** an active Monitor requests the activity list
- **THEN** the response can contain active registrations across creators and juries

#### Scenario: Gestor lists activities
- **WHEN** an active Gestor requests the activity list
- **THEN** the response contains only active registrations created by that Gestor

### Requirement: Deletion preserves an audit trail
User-facing delete operations SHALL archive application records instead of removing their business and audit history. Archived rows SHALL not appear in normal active lists and SHALL remain unavailable to unauthorized users.

#### Scenario: Authorized user deletes an activity
- **WHEN** a Monitor archives an activity or a Gestor archives one they created
- **THEN** the activity is marked archived with actor and timestamp information
- **AND** it no longer appears in normal activity queries
