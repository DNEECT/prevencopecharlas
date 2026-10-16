# Spec Delta

## Purpose

Defines reliable Excel reporting for the complete authorized activity result set while preserving active filters, access controls, and explicit failure behavior.

## ADDED Requirements

### Requirement: Bulk export contains every authorized matching activity

The system SHALL export one Excel row for every active activity authorized for the user that matches the filters currently applied to the activity list. Retrieval MAY use multiple bounded requests, but server page boundaries SHALL NOT omit or duplicate records in the workbook.

#### Scenario: Director exports without filters
- **WHEN** an active Director starts a bulk export with no electoral-process, jury, or search filter
- **THEN** the downloaded workbook contains every active activity the Director is authorized to read across accessible processes

#### Scenario: User exports filtered activities
- **WHEN** a user starts a bulk export with an electoral-process, jury, or search filter
- **THEN** the downloaded workbook contains every authorized active activity matching all applied filters
- **AND** it excludes authorized records that do not match those filters

#### Scenario: Export spans multiple retrieval pages
- **WHEN** the matching result contains more records than one bounded retrieval page
- **THEN** the system retrieves subsequent pages until the complete result is assembled
- **AND** each matching activity appears exactly once in the workbook

### Requirement: Bulk export terminates with an explicit outcome

The system SHALL close the export loading indicator after success, an empty result, or failure. It SHALL not emit an unhandled client error or leave the user without feedback.

#### Scenario: Export succeeds
- **WHEN** all matching activity pages are retrieved and workbook generation succeeds
- **THEN** the system downloads one valid `.xlsx` workbook
- **AND** closes the loading indicator

#### Scenario: Export has no matching activities
- **WHEN** the export query succeeds with zero matching activities
- **THEN** the system does not attempt to derive workbook columns from a missing row
- **AND** closes the loading indicator and informs the user that there are no records to export

#### Scenario: Export retrieval or workbook generation fails
- **WHEN** any export page request fails or workbook generation fails
- **THEN** the system does not download a partial workbook
- **AND** closes the loading indicator and displays an actionable error

### Requirement: Export authorization matches list authorization

The system SHALL enforce the same database authorization rules for bulk export as for activity listing. Client-side pagination or workbook generation SHALL NOT broaden the records available to the user.

#### Scenario: User attempts to export out-of-scope records
- **WHEN** a user starts an export whose filters could match activities outside that user's authorized scope
- **THEN** the workbook contains only records authorized by the database for that user
