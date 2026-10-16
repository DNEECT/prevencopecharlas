# Activity Report Export Specification

## Purpose

Defines reliable Excel reporting for the complete authorized activity result set while preserving active filters, access controls, and explicit failure behavior.

## Requirements

### Requirement: Bulk export contains every authorized matching activity

The system SHALL export one Excel row for every active activity authorized for the user that matches the filters currently applied to the activity list. Retrieval MAY use multiple bounded requests, but server response limits and page boundaries SHALL NOT omit or duplicate records in the workbook, including when the result is larger than the database API's maximum response page.

#### Scenario: Director exports without filters

- **WHEN** an active Director starts a bulk export with no electoral-process, jury, or search filter
- **THEN** the downloaded workbook contains every active activity the Director is authorized to read across accessible processes

#### Scenario: User exports filtered activities

- **WHEN** a user starts a bulk export with an electoral-process, jury, or search filter
- **THEN** the downloaded workbook contains every authorized active activity matching all applied filters
- **AND** it excludes authorized records that do not match those filters

#### Scenario: Export spans multiple retrieval pages

- **WHEN** the matching result is larger than one database API response page
- **THEN** the system retrieves subsequent pages until the complete result is assembled
- **AND** each matching activity appears exactly once in the workbook

#### Scenario: Export preserves report values at production scale

- **WHEN** an authorized result contains at least 1,681 activities and includes activities with participants
- **THEN** the system downloads exactly one workbook containing the complete result
- **AND** each exported participant total matches the corresponding activity-list value

### Requirement: Bulk export terminates with an explicit outcome

The system SHALL close the export loading indicator after success, an empty result, or failure. It SHALL not emit an unhandled client error or leave the user without feedback, and it SHALL retain non-sensitive diagnostic detail that identifies whether retrieval or workbook generation failed.

#### Scenario: Export succeeds

- **WHEN** all matching activity pages are retrieved and workbook generation succeeds
- **THEN** the system downloads one valid `.xlsx` workbook
- **AND** closes the loading indicator

#### Scenario: Export has no matching activities

- **WHEN** the export query succeeds with zero matching activities
- **THEN** the system does not attempt to derive workbook columns from a missing row
- **AND** closes the loading indicator and informs the user that there are no records to export

#### Scenario: Export retrieval fails

- **WHEN** any export page request fails
- **THEN** the system does not generate or download a partial workbook
- **AND** closes the loading indicator and displays an actionable error
- **AND** records non-sensitive diagnostic context identifying the retrieval phase

#### Scenario: Workbook generation fails

- **WHEN** all export rows are retrieved but workbook generation fails
- **THEN** the system does not report a successful download
- **AND** closes the loading indicator and displays an actionable error
- **AND** records non-sensitive diagnostic context identifying the workbook phase

#### Scenario: Export retrieval or workbook generation fails

- **WHEN** any export page request fails or workbook generation fails
- **THEN** the system does not download a partial workbook
- **AND** closes the loading indicator and displays an actionable error
- **AND** retains non-sensitive diagnostic context identifying the failing phase

### Requirement: Export authorization matches list authorization

The system SHALL enforce the same database authorization rules for bulk export as for activity listing. Client-side pagination or workbook generation SHALL NOT broaden the records available to the user.

#### Scenario: User attempts to export out-of-scope records
- **WHEN** a user starts an export whose filters could match activities outside that user's authorized scope
- **THEN** the workbook contains only records authorized by the database for that user
