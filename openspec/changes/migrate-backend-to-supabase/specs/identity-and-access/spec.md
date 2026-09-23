# Spec Delta

## Purpose

Defines authentication, application profiles, the verified Monitor and Gestor module/action permissions, and database-enforced isolation for every PREVENCOPE user.

## ADDED Requirements

### Requirement: Supabase Auth owns credentials and sessions

The system SHALL authenticate users through Supabase Auth and SHALL NOT store application passwords or issue a second application JWT. Each application profile SHALL link to exactly one authenticated identity.

#### Scenario: Valid institutional sign-in

- **WHEN** an enabled user signs in with valid Supabase Auth credentials
- **THEN** the application establishes a Supabase session and loads the linked active profile

#### Scenario: Authenticated identity lacks a profile

- **WHEN** an authenticated identity has no active application profile
- **THEN** application data access is denied

### Requirement: Roles come from protected database membership

The system SHALL determine Gestor and Monitor authorization from protected database role membership. Users SHALL NOT be able to grant roles to themselves through profile metadata, JWT user metadata, or direct browser writes.

#### Scenario: User edits authentication metadata

- **WHEN** a user changes editable authentication metadata to claim a privileged role
- **THEN** the user's database permissions remain unchanged

#### Scenario: Monitor assigns a role

- **WHEN** an active Monitor with user-administration permission assigns an allowed role to a profile
- **THEN** the new membership is recorded with the assigning actor and timestamp

### Requirement: Monitor has administrative scope

An active Monitor SHALL be authorized to manage application profiles, activity catalogs, formats, and all activity registrations according to the active module/action permission matrix. The seeded legacy matrix SHALL preserve the Monitor registration actions LIST, ADD, EDIT, DELETE, APROVE, and OBSERVE; format, type, and user actions LIST, ADD, EDIT, and DELETE; and the disabled permission-management actions. At least one active Monitor administrator SHALL remain after any administrative change.

#### Scenario: Disable the last Monitor administrator

- **WHEN** an administrator attempts to disable or demote the final active Monitor administrator
- **THEN** the system rejects the operation

### Requirement: A designated Monitor can receive complete institutional administration

The system SHALL support a separate Administrator role for an explicitly designated active Monitor without changing the reconciled Monitor grants for other accounts. Administrator SHALL grant every active module/action pair, including access to the Permissions view. Global record scope SHALL continue to require the designated account's Monitor membership.

#### Scenario: Grant complete administration to the designated Monitor

- **WHEN** the approved Monitor receives active Administrator membership
- **THEN** effective permissions include every active module/action pair while other Monitor memberships and grants remain unchanged

### Requirement: Gestor access is restricted to created activities

An active Gestor SHALL be authorized to read the catalogs needed for registration and to list, create, edit, and archive their own activity registrations. A Gestor SHALL NOT administer configuration or users, approve or observe activities, or read or change another creator's activity. No jury assignment SHALL be required for either role.

#### Scenario: Gestor accesses own activity

- **WHEN** a Gestor reads or updates an activity they created
- **THEN** the database permits the operation allowed by the Gestor permission set

#### Scenario: Gestor accesses another creator's activity

- **WHEN** a Gestor requests an activity created by another user
- **THEN** the database returns no row or rejects the write

### Requirement: Disabled profiles lose application access immediately

Application policies SHALL require both a valid authenticated identity and an active application profile for every exposed data operation.

#### Scenario: Session remains valid after profile disablement

- **WHEN** a profile is disabled while its Supabase Auth session is still valid
- **THEN** subsequent application reads and writes are denied

### Requirement: Row-level security defaults to denial

Every application table exposed through the Data API SHALL have row-level security enabled and explicit policies for permitted authenticated operations. Anonymous users SHALL receive no application-table privileges.

#### Scenario: New unauthenticated request

- **WHEN** an anonymous client queries or mutates an application table
- **THEN** no application data is returned or changed

#### Scenario: Authenticated request without a matching policy

- **WHEN** an authenticated request performs an operation not granted by an applicable policy
- **THEN** the database denies the operation

### Requirement: Permission checks are consistent across UI and database

The system SHALL expose the effective hierarchical modules and actions for the signed-in user while retaining database policies as the enforcement authority. It SHALL preserve the source's active role-module-action grants and action names for list, add, edit, delete, approve, and observe; a disabled grant SHALL never authorize the corresponding operation.

#### Scenario: UI loads authorized navigation

- **WHEN** an active user loads the application shell
- **THEN** the system returns only modules and actions granted to that user's roles

#### Scenario: UI preserves the legacy navigation hierarchy

- **WHEN** an active user can list a child module below Administración or Seguridad
- **THEN** the header groups that route below its authorized parent menu
- **AND** a non-functional module without a route is not rendered as a navigation item

#### Scenario: Disabled permission grant

- **WHEN** a user invokes an action whose role-module-action grant is inactive
- **THEN** the database rejects the operation even if the client displays that action
