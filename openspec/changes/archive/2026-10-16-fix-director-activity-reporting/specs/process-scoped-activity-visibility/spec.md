# Spec Delta

## ADDED Requirements

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
