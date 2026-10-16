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

#### Scenario: Self-service recovery transport is unavailable

- **WHEN** password-recovery email delivery has not been verified with the configured SMTP service
- **THEN** the login screen does not display a self-service recovery link
- **AND** a direct request to the self-service recovery route returns to login
- **AND** the password-update route remains available for controlled 24-hour links already delivered by the institutional process

#### Scenario: Recovery link opened with another persisted session

- **WHEN** a user opens a controlled recovery link in a browser that already has an application session
- **THEN** the password-update page verifies the recovery artifact from the URL before updating credentials
- **AND** the persisted session cannot redirect the password change to a different identity

### Requirement: Roles come from protected database membership

The system SHALL determine Gestor and Monitor authorization from protected database role membership. Users SHALL NOT be able to grant roles to themselves through profile metadata, JWT user metadata, or direct browser writes.

#### Scenario: User edits authentication metadata

- **WHEN** a user changes editable authentication metadata to claim a privileged role
- **THEN** the user's database permissions remain unchanged

#### Scenario: Monitor assigns a role

- **WHEN** an active Monitor with user-administration permission assigns an allowed role to a profile
- **THEN** the new membership is recorded with the assigning actor and timestamp

### Requirement: Monitor has administrative scope

An active Monitor SHALL be authorized to manage application profiles, activity catalogs, formats, and current activity registrations according to the active module/action permission matrix. For a process that requires JEE assignments, process, catalog, and registration row scope SHALL be limited to that Monitor's assigned JEE. Elecciones Generales 2026 SHALL be hidden from a Monitor unless the same profile also has an active Administrator or Director role. The seeded legacy matrix SHALL preserve the Monitor registration actions LIST, ADD, EDIT, DELETE, APROVE, and OBSERVE; format, type, and user actions LIST, ADD, EDIT, and DELETE; and the disabled permission-management actions. At least one active Monitor administrator SHALL remain after any administrative change.

Administrative profile creation and editing SHALL require username, institutional email, and at least one role. Document number, names, surnames, birth date, and address SHALL remain optional because migrated and institutional service accounts may not have that personal information.

#### Scenario: Edit a migrated account without optional personal data

- **WHEN** an authorized administrator edits a profile that has no document number, names, surnames, birth date, or address
- **THEN** the form remains valid when username, institutional email, and at least one role are present
- **AND** the administrative service stores missing optional values as null without changing the account's identity or role memberships

#### Scenario: Disable the last Monitor administrator

- **WHEN** an administrator attempts to disable or demote the final active Monitor administrator
- **THEN** the system rejects the operation

### Requirement: A designated Monitor can receive complete institutional administration

The system SHALL support a separate Administrator role for an explicitly designated active Monitor without changing the reconciled Monitor grants for other accounts. Administrator SHALL grant every active module/action pair, including access to the Permissions view. An active Administrator or Director role SHALL be required to read the historical Elecciones Generales 2026 process, catalogs, JEE, registrations, participants, and evidence. Administrator membership SHALL bypass current-process JEE assignments for institutional supervision.

#### Scenario: Grant complete administration to the designated Monitor

- **WHEN** the approved Monitor receives active Administrator membership
- **THEN** effective permissions include every active module/action pair while other Monitor memberships and grants remain unchanged

### Requirement: Gestor access is restricted to assigned current-process activities

An active Gestor SHALL be authorized to read the current-process catalogs and JEE explicitly assigned to that profile and to list, create, edit, and archive their own ERM 2026 activity registrations for that JEE. A Gestor SHALL NOT administer configuration or users, approve or observe activities, access a different JEE, or read Elecciones Generales 2026 historical records.

#### Scenario: Gestor accesses own activity

- **WHEN** a Gestor reads or updates an ERM 2026 activity they created for their assigned JEE
- **THEN** the database permits the operation allowed by the Gestor permission set

#### Scenario: Gestor accesses another creator's activity

- **WHEN** a Gestor requests an activity created by another user
- **THEN** the database returns no row or rejects the write

#### Scenario: Gestor requests a non-assigned JEE or historical record

- **WHEN** a Gestor requests an ERM 2026 JEE outside their assignment or an Elecciones Generales 2026 record
- **THEN** the database returns no row and rejects any write

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

#### Scenario: Home controls open the first authorized screen

- **WHEN** an active user selects the PREVENCOPE logo or the Inicio breadcrumb
- **THEN** the application navigates to that user's first authorized screen
- **AND** the activity register is preferred when that module is authorized

#### Scenario: Disabled permission grant

- **WHEN** a user invokes an action whose role-module-action grant is inactive
- **THEN** the database rejects the operation even if the client displays that action

#### Scenario: Controlled institutional test account

- **WHEN** a dedicated test account is provisioned before general user onboarding
- **THEN** it uses an institutional email identity and only the explicitly approved roles
- **AND** its temporary credential is retained outside source control without sending an invitation or password-reset email
