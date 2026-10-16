# Spec Delta

## Purpose

Defines private, authorized storage and retrieval of attendance lists and photographic evidence associated with PREVENCOPE activity registrations.

## ADDED Requirements

### Requirement: Evidence is stored privately
The system SHALL store activity evidence in a private bucket and SHALL NOT expose public object URLs. Object access SHALL require an authenticated active profile with access to the related activity.

#### Scenario: Authorized evidence download
- **WHEN** an authorized user requests evidence for an accessible activity
- **THEN** the system returns the object or a short-lived signed URL

#### Scenario: Anonymous evidence request
- **WHEN** an unauthenticated client requests an evidence object
- **THEN** the system denies access

### Requirement: Evidence paths identify the owning activity
Every evidence object SHALL use a server-validated path containing the activity identifier and evidence kind. File metadata SHALL link the storage object to the activity, uploader, original file name, MIME type, size, and creation timestamp.

#### Scenario: Upload attendance list
- **WHEN** an authorized user uploads an attendance list to an accessible activity
- **THEN** the object and metadata are stored under that activity's attendance-list path

#### Scenario: Path references inaccessible activity
- **WHEN** a user attempts to upload under an activity outside the user's scope
- **THEN** the storage policy rejects the upload

### Requirement: Evidence types and sizes are constrained
The system SHALL accept new attendance-list files in PDF, XLS, XLSX, PNG, or JPEG format and new photographic evidence in PNG or JPEG format. Each new object MUST be no larger than 20 MiB. A controlled legacy import SHALL preserve recovered photographic PDF files as historical evidence without making PDF a valid format for new photographic uploads.

#### Scenario: Unsupported executable upload
- **WHEN** a user uploads an executable or a MIME type outside the allowed set
- **THEN** the system rejects the object and creates no metadata row

#### Scenario: Oversized upload
- **WHEN** an evidence object exceeds 20 MiB
- **THEN** the system rejects the upload

#### Scenario: Recovered legacy photographic PDF
- **WHEN** the importer verifies a photographic PDF referenced by a legacy activity
- **THEN** the system stores it as historical evidence and makes it available only under the activity's normal authorization policy

### Requirement: Evidence changes follow activity authorization
Monitor users SHALL manage evidence for all activities. Gestor users SHALL manage evidence only for activities they created. Removing an evidence reference SHALL remove or quarantine its object so inaccessible orphan files are not retained indefinitely.

#### Scenario: Gestor deletes evidence from another creator's activity
- **WHEN** a Gestor attempts to delete evidence for an activity created by another user
- **THEN** the system rejects the operation

### Requirement: Missing legacy objects remain explicit
The system SHALL distinguish a legacy attachment reference from a verified stored object. It SHALL not offer a download URL for an unresolved reference and SHALL report unresolved file counts during import reconciliation.

#### Scenario: Referenced file is absent
- **WHEN** an imported registration refers to an attachment that has not been recovered
- **THEN** the system records the unresolved reference for reconciliation and does not offer a download
