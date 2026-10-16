# Process-Scoped Activity Visibility Specification

## Purpose

Defines how process-scoped activity catalog references remain internally consistent while authorized users retain accurate visibility of current and historical activity data.

## Requirements

### Requirement: Activity juries and formats belong to the activity process

The system SHALL require every activity's special electoral jury and activity format to belong to the same electoral process as the activity. This invariant SHALL be enforced for every database write path, including paths that bypass the application form.

#### Scenario: Create an activity with aligned references
- **WHEN** an authorized user creates an activity whose jury and format belong to the selected electoral process
- **THEN** the system accepts those catalog references subject to the remaining registration validations

#### Scenario: Write an activity with a jury from another process
- **WHEN** any write attempts to associate an activity with a jury from a different electoral process
- **THEN** the database rejects the write without changing the activity

#### Scenario: Write an activity with a format from another process
- **WHEN** any write attempts to associate an activity with a format from a different electoral process
- **THEN** the database rejects the write without changing the activity

### Requirement: Historical jury mismatches are reconciled without guessing

The system SHALL reconcile a historical activity whose jury belongs to another process only when exactly one active jury in the activity's process has the same name after trimming and case normalization. The reconciliation SHALL stop without partially applying changes if any mismatched activity has no such jury or has more than one candidate.

#### Scenario: Unique process-local jury match
- **WHEN** a historical activity references a jury from another process and exactly one active same-name jury exists in the activity's process
- **THEN** reconciliation replaces the reference with that process-local jury
- **AND** the activity's remaining business data is unchanged

#### Scenario: Missing or ambiguous jury match
- **WHEN** any mismatched historical activity has zero or multiple active same-name juries in its process
- **THEN** reconciliation fails before changing any historical jury reference

### Requirement: Assignment-scoped activity visibility follows the corrected jury

For a process that requires jury assignments, the system SHALL allow an active Monitor with the required list permission to read active activities for an actively assigned jury. Correcting a cross-process jury reference SHALL restore this access without granting the Monitor access to activities for unassigned juries or to archived activities.

#### Scenario: Monitor reads a corrected assigned-jury activity
- **WHEN** an active Monitor lists activities after a historical activity is aligned to a jury actively assigned to that Monitor
- **THEN** the corrected active activity is included in the authorized results

#### Scenario: Monitor requests an unassigned jury activity
- **WHEN** an active Monitor requests an activity whose jury is not actively assigned to that Monitor in an assignment-required process
- **THEN** the system returns no activity row or rejects the request

#### Scenario: Monitor requests an archived assigned-jury activity
- **WHEN** an active Monitor requests an archived activity for an assigned jury
- **THEN** the activity is excluded from normal authorized reads

### Requirement: Accessible activities retain readable historical audience classifications

The system SHALL preserve a historical activity's target-audience reference when the activity's process has no exact equivalent classification. An authenticated user SHALL be able to read that referenced audience only when the user can read at least one active activity that references it, or when the audience is otherwise within the user's authorized active process scope.

#### Scenario: Authorized user reads a legacy audience through an activity
- **WHEN** an authenticated user can read an active activity that references a historical target audience outside the activity's current process catalog
- **THEN** the system returns the referenced audience needed to render the activity accurately
- **AND** the stored classification is not remapped to a different audience

#### Scenario: User cannot read any referencing activity
- **WHEN** an authenticated user lacks access to every active activity that references an out-of-scope historical target audience
- **THEN** the historical target-audience row is not visible to that user

### Requirement: Directors can list activities across accessible processes

The system SHALL allow an active Director with activity-list permission to list every active activity authorized for that Director when no electoral-process filter is selected. Supplying an electoral-process or jury filter SHALL narrow the authorized result and SHALL NOT be required to make records visible.

#### Scenario: Director opens the activity list without a process filter
- **WHEN** an active Director with activity-list permission opens the activity list and no electoral process is selected
- **THEN** the system returns the first page of active activities from every process the Director is authorized to read
- **AND** the process filter remains empty

#### Scenario: Director selects an electoral process
- **WHEN** the Director selects an electoral process
- **THEN** the system returns only authorized active activities belonging to that process

#### Scenario: Director selects a jury within a process
- **WHEN** the Director selects an electoral process and an electoral jury
- **THEN** the system returns only authorized active activities matching both filters

### Requirement: Activity-list failures are distinguishable from empty results

The system SHALL display an empty-result state only after a successful query returns zero authorized activities. A failed or timed-out query SHALL end the loading state and display an actionable error without representing the failure as an empty database.

#### Scenario: Successful query has no records
- **WHEN** an activity-list query succeeds with zero matching records
- **THEN** the interface displays the no-results state
- **AND** no request-failure message is displayed

#### Scenario: Activity-list query fails
- **WHEN** an activity-list query fails or exceeds the configured request limit
- **THEN** the interface stops loading and displays a request-failure message
- **AND** it does not claim that no records exist
