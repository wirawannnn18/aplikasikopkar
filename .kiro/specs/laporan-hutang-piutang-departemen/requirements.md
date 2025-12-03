# Requirements Document

## Introduction

This document specifies the requirements for enhancing the existing Hutang Piutang (Accounts Receivable) report by adding department information from the member master data. The enhancement will provide better visibility and analysis capabilities by showing which department each member with outstanding debt belongs to, enabling department-level debt tracking and management.

## Glossary

- **Hutang Piutang Report**: A report showing accounts receivable (debt) from cooperative members
- **Member (Anggota)**: A registered member of the cooperative
- **Department (Departemen)**: An organizational unit to which members belong
- **Master Anggota**: The master data table containing member information including department assignment
- **Kredit Status**: Credit sales that have not been fully paid
- **Total Hutang**: The total outstanding debt amount for a member

## Requirements

### Requirement 1

**User Story:** As a cooperative administrator, I want to see department information in the hutang piutang report, so that I can analyze debt patterns by department and identify which departments have higher outstanding debts.

#### Acceptance Criteria

1. WHEN the system displays the hutang piutang report THEN the system SHALL include a department column showing the department name for each member
2. WHEN a member has no department assigned THEN the system SHALL display a dash "-" or "Tidak Ada Departemen" in the department column
3. WHEN the report is rendered THEN the system SHALL retrieve department information from the master anggota data for each member
4. WHEN displaying member information THEN the system SHALL show NIK, member name, department, total debt, and payment status in a single row
5. WHEN the report contains multiple members THEN the system SHALL maintain consistent formatting for all department values

### Requirement 2

**User Story:** As a cooperative administrator, I want to filter the hutang piutang report by department, so that I can focus on debt analysis for specific departments.

#### Acceptance Criteria

1. WHEN the hutang piutang report page loads THEN the system SHALL display a department filter dropdown above the report table
2. WHEN the department filter dropdown is displayed THEN the system SHALL populate it with all unique departments from the master anggota data
3. WHEN a user selects a specific department from the filter THEN the system SHALL display only members belonging to that department
4. WHEN a user selects "Semua Departemen" option THEN the system SHALL display all members regardless of department
5. WHEN the filter is applied THEN the system SHALL update the report table immediately without page reload

### Requirement 3

**User Story:** As a cooperative administrator, I want to see department-level debt summaries, so that I can quickly identify which departments have the highest total outstanding debts.

#### Acceptance Criteria

1. WHEN the hutang piutang report is displayed THEN the system SHALL show a summary section above the detailed table
2. WHEN the summary section is rendered THEN the system SHALL calculate total debt grouped by department
3. WHEN displaying department summaries THEN the system SHALL show department name, total debt amount, and number of members with debt for each department
4. WHEN a department has no members with outstanding debt THEN the system SHALL exclude that department from the summary
5. WHEN the summary is displayed THEN the system SHALL sort departments by total debt amount in descending order

### Requirement 4

**User Story:** As a cooperative administrator, I want to export the hutang piutang report with department information to CSV, so that I can perform further analysis in spreadsheet applications.

#### Acceptance Criteria

1. WHEN a user clicks the "Download CSV" button THEN the system SHALL generate a CSV file containing all visible report data
2. WHEN the CSV file is generated THEN the system SHALL include columns for NIK, member name, department, total debt, and status
3. WHEN a department filter is active THEN the system SHALL export only the filtered data
4. WHEN the CSV is downloaded THEN the system SHALL use UTF-8 encoding to support Indonesian characters
5. WHEN the file is saved THEN the system SHALL name it with format "laporan_hutang_piutang_YYYYMMDD.csv" including the current date

### Requirement 5

**User Story:** As a cooperative administrator, I want to sort the hutang piutang report by different columns including department, so that I can organize the data according to my analysis needs.

#### Acceptance Criteria

1. WHEN column headers are displayed THEN the system SHALL make NIK, name, department, and total debt columns sortable
2. WHEN a user clicks a sortable column header THEN the system SHALL sort the table by that column in ascending order
3. WHEN a user clicks the same column header again THEN the system SHALL toggle the sort direction to descending order
4. WHEN sorting by department THEN the system SHALL use alphabetical order for department names
5. WHEN sorting by total debt THEN the system SHALL use numerical order for debt amounts
