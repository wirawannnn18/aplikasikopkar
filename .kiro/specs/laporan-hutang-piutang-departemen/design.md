# Design Document: Laporan Hutang Piutang dengan Departemen

## Overview

This design document outlines the enhancement of the existing hutang piutang (accounts receivable) report to include department information from the master anggota data. The enhancement will add department visibility, filtering, summary statistics, and improved export capabilities to help administrators analyze debt patterns across organizational departments.

## Architecture

The enhancement will modify the existing `laporanHutangPiutang()` function in `js/reports.js` and add supporting functions for filtering, sorting, and summary calculations. The architecture follows the existing pattern of client-side data processing using localStorage.

### Component Interaction Flow

```
User Action → UI Event Handler → Data Retrieval (localStorage) 
→ Data Processing (join, filter, aggregate) → UI Rendering → Display
```

### Key Components

1. **Data Layer**: Retrieve and join data from `anggota`, `penjualan`, and `departemen` localStorage
2. **Processing Layer**: Filter, sort, and aggregate data based on user selections
3. **Presentation Layer**: Render enhanced report with department information
4. **Export Layer**: Generate CSV with department data

## Components and Interfaces

### 1. Enhanced Report Rendering Function

**Function**: `laporanHutangPiutang()`

**Responsibilities**:
- Retrieve member, sales, and department data
- Join member data with department information
- Calculate debt totals per member
- Render enhanced report UI with department column
- Initialize filter and sort functionality

**Interface**:
```javascript
function laporanHutangPiutang()
// No parameters
// Returns: void (renders to DOM)
```

### 2. Department Filter Function

**Function**: `filterHutangPiutangByDepartemen(departemenId)`

**Responsibilities**:
- Filter report data by selected department
- Re-render report table with filtered data
- Update summary statistics

**Interface**:
```javascript
function filterHutangPiutangByDepartemen(departemenId)
// Parameters:
//   departemenId: string - ID of department to filter, or empty string for all
// Returns: void (updates DOM)
```

### 3. Department Summary Calculator

**Function**: `calculateDepartmentDebtSummary(reportData)`

**Responsibilities**:
- Group debt data by department
- Calculate total debt per department
- Count members with debt per department
- Sort departments by total debt

**Interface**:
```javascript
function calculateDepartmentDebtSummary(reportData)
// Parameters:
//   reportData: Array<{anggotaId, nama, nik, departemen, departemenId, totalHutang}>
// Returns: Array<{departemen, totalHutang, jumlahAnggota}>
```

### 4. Table Sorting Function

**Function**: `sortHutangPiutangTable(column, direction)`

**Responsibilities**:
- Sort report data by specified column
- Handle different data types (string, number)
- Re-render table with sorted data

**Interface**:
```javascript
function sortHutangPiutangTable(column, direction)
// Parameters:
//   column: string - Column name to sort by ('nik', 'nama', 'departemen', 'hutang')
//   direction: string - Sort direction ('asc' or 'desc')
// Returns: void (updates DOM)
```

### 5. Enhanced CSV Export Function

**Function**: `downloadHutangPiutangCSV()`

**Responsibilities**:
- Generate CSV content with department column
- Apply current filters to export
- Format data for CSV
- Trigger download

**Interface**:
```javascript
function downloadHutangPiutangCSV()
// No parameters
// Returns: void (triggers file download)
```

## Data Models

### Enhanced Report Data Structure

```javascript
{
  anggotaId: string,        // Member ID
  nik: string,              // Member NIK
  nama: string,             // Member name
  departemen: string,       // Department name (from master anggota)
  departemenId: string,     // Department ID (for filtering)
  totalHutang: number,      // Total outstanding debt
  status: string            // 'Lunas' or 'Belum Lunas'
}
```

### Department Summary Structure

```javascript
{
  departemen: string,       // Department name
  departemenId: string,     // Department ID
  totalHutang: number,      // Total debt for department
  jumlahAnggota: number     // Count of members with debt
}
```

### Filter State

```javascript
{
  selectedDepartemen: string,  // Currently selected department ID (empty = all)
  sortColumn: string,          // Current sort column
  sortDirection: string        // Current sort direction ('asc' or 'desc')
}
```

## Data Flow

### 1. Report Loading Flow

```
1. User navigates to Hutang Piutang report
2. System retrieves data from localStorage:
   - anggota (members)
   - penjualan (sales transactions)
   - departemen (departments)
3. System joins member data with department data
4. System calculates debt per member from kredit sales
5. System generates department summary statistics
6. System renders:
   - Department filter dropdown
   - Department summary cards
   - Detailed report table with department column
```

### 2. Filter Application Flow

```
1. User selects department from filter dropdown
2. System filters report data by departemenId
3. System recalculates summary for filtered data
4. System re-renders summary and table
5. System maintains filter state for export
```

### 3. Sort Application Flow

```
1. User clicks sortable column header
2. System determines sort column and direction
3. System sorts report data array
4. System re-renders table with sorted data
5. System updates sort indicator in header
```

### 4. Export Flow

```
1. User clicks "Download CSV" button
2. System retrieves current filtered/sorted data
3. System formats data as CSV with headers
4. System generates filename with current date
5. System triggers browser download
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Department Column Completeness

*For any* member displayed in the hutang piutang report, the rendered row should contain a department value that either matches the member's department from master anggota data or displays "-" for members without departments.

**Validates: Requirements 1.1, 1.3**

### Property 2: Department Data Join Correctness

*For any* set of members with assigned departments, retrieving and joining department information should result in each member having the correct department name from the departemen master data.

**Validates: Requirements 1.3**

### Property 3: Row Structure Completeness

*For any* member with outstanding debt, the rendered table row should contain all required fields: NIK, member name, department, total debt amount, and payment status.

**Validates: Requirements 1.4**

### Property 4: Department Formatting Consistency

*For any* report containing multiple members, all department values should follow consistent formatting rules where missing departments are represented uniformly (either all use "-" or all use "Tidak Ada Departemen").

**Validates: Requirements 1.5**

### Property 5: Filter Dropdown Population

*For any* set of members in master anggota data, the department filter dropdown should contain exactly the unique set of departments present in that data, plus an "All Departments" option.

**Validates: Requirements 2.2**

### Property 6: Department Filter Correctness

*For any* selected department from the filter, all members displayed in the filtered report should belong to that specific department.

**Validates: Requirements 2.3**

### Property 7: Show All Filter Completeness

*For any* dataset of members, selecting "Semua Departemen" in the filter should display the complete set of members without exclusions.

**Validates: Requirements 2.4**

### Property 8: Filter Application Responsiveness

*For any* filter selection change, the report table should update in the DOM without triggering a full page reload.

**Validates: Requirements 2.5**

### Property 9: Department Debt Aggregation Correctness

*For any* set of members with outstanding debts, the sum of individual member debts within each department should equal the total debt shown in that department's summary.

**Validates: Requirements 3.2**

### Property 10: Summary Structure Completeness

*For any* department appearing in the summary section, the summary data should include department name, total debt amount, and count of members with debt.

**Validates: Requirements 3.3**

### Property 11: Zero Debt Department Exclusion

*For any* department where all members have zero outstanding debt, that department should not appear in the summary section.

**Validates: Requirements 3.4**

### Property 12: Summary Sort Order

*For any* set of department summaries, they should be ordered by total debt amount in descending order (highest debt first).

**Validates: Requirements 3.5**

### Property 13: CSV Content Completeness

*For any* visible report data at the time of export, the generated CSV file should contain exactly the same set of members and their data.

**Validates: Requirements 4.1**

### Property 14: CSV Column Structure

*For any* generated CSV file, it should contain columns for NIK, member name, department, total debt, and status in that order.

**Validates: Requirements 4.2**

### Property 15: CSV Filter Consistency

*For any* active department filter, the exported CSV should contain only the members visible in the filtered report view.

**Validates: Requirements 4.3**

### Property 16: CSV Encoding Preservation

*For any* member data containing Indonesian characters (e.g., names with special characters), those characters should be correctly preserved in the exported CSV file using UTF-8 encoding.

**Validates: Requirements 4.4**

### Property 17: CSV Filename Format

*For any* CSV download operation, the generated filename should match the pattern "laporan_hutang_piutang_YYYYMMDD.csv" where YYYYMMDD represents the current date.

**Validates: Requirements 4.5**

### Property 18: Column Sort Ascending

*For any* sortable column and dataset, clicking the column header should sort the table data by that column in ascending order.

**Validates: Requirements 5.2**

### Property 19: Sort Direction Toggle

*For any* column that is currently sorted ascending, clicking the same column header again should reverse the sort to descending order.

**Validates: Requirements 5.3**

### Property 20: Department Alphabetical Sort

*For any* set of department names, when sorted by the department column, they should appear in alphabetical order (A-Z for ascending, Z-A for descending).

**Validates: Requirements 5.4**

### Property 21: Debt Numerical Sort

*For any* set of debt amounts, when sorted by the total debt column, they should appear in numerical order (lowest to highest for ascending, highest to lowest for descending).

**Validates: Requirements 5.5**

## Error Handling

### Missing Department Data

**Scenario**: Member has no department assigned or department not found

**Handling**:
- Display "-" or "Tidak Ada Departemen" in department column
- Group these members under "Tanpa Departemen" in summary
- Allow filtering by "Tanpa Departemen" option

### Empty Report Data

**Scenario**: No members have outstanding debt

**Handling**:
- Display message "Tidak ada data hutang piutang"
- Show empty summary section
- Disable export button

### Data Inconsistency

**Scenario**: Member references non-existent department

**Handling**:
- Log warning to console
- Display "-" for department
- Continue processing other members

## Testing Strategy

### Unit Tests

1. **Test Department Data Join**
   - Input: Member with valid departemenId
   - Expected: Department name correctly populated
   - Input: Member with invalid departemenId
   - Expected: Department shows "-"

2. **Test Debt Calculation**
   - Input: Member with multiple kredit sales
   - Expected: Total debt correctly summed
   - Input: Member with no kredit sales
   - Expected: Total debt is 0

3. **Test Filter Function**
   - Input: Filter by specific department
   - Expected: Only members from that department shown
   - Input: Filter by "Semua Departemen"
   - Expected: All members shown

4. **Test Summary Calculation**
   - Input: Multiple members across departments
   - Expected: Correct totals per department
   - Expected: Departments sorted by debt descending

5. **Test Sort Function**
   - Input: Sort by department ascending
   - Expected: Alphabetical order A-Z
   - Input: Sort by hutang descending
   - Expected: Numerical order high to low

6. **Test CSV Export**
   - Input: Report with department data
   - Expected: CSV contains all columns including department
   - Expected: UTF-8 encoding preserved
   - Expected: Filename includes date

### Integration Tests

1. **Test Complete Report Flow**
   - Load report → verify all data displayed
   - Apply filter → verify filtered results
   - Sort table → verify sort applied
   - Export CSV → verify file contents

2. **Test Filter + Sort Combination**
   - Apply department filter
   - Apply column sort
   - Verify both operations work together

3. **Test Data Refresh**
   - Modify member department in master data
   - Reload report
   - Verify updated department shown

## UI/UX Considerations

### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│ Laporan Hutang Piutang Anggota                      │
├─────────────────────────────────────────────────────┤
│ Filter: [Departemen Dropdown ▼] [Reset Button]     │
├─────────────────────────────────────────────────────┤
│ Summary Cards:                                       │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│ │ Dept A   │ │ Dept B   │ │ Dept C   │            │
│ │ Rp 5.5M  │ │ Rp 3.2M  │ │ Rp 1.8M  │            │
│ │ 12 org   │ │ 8 org    │ │ 5 org    │            │
│ └──────────┘ └──────────┘ └──────────┘            │
├─────────────────────────────────────────────────────┤
│ Table:                                               │
│ NIK ↕ | Nama ↕ | Departemen ↕ | Hutang ↕ | Status  │
│ ─────────────────────────────────────────────────── │
│ 001   | Ahmad  | IT           | Rp 500K  | Belum   │
│ 002   | Budi   | Finance      | Rp 300K  | Belum   │
│ ...                                                  │
├─────────────────────────────────────────────────────┤
│ [Download CSV Button]                                │
└─────────────────────────────────────────────────────┘
```

### Visual Design

- Use Bootstrap card components for summary
- Use Bootstrap table with hover effects
- Add sort indicators (↑↓) to column headers
- Use badge colors for status (warning/success)
- Responsive design for mobile viewing

### User Interactions

1. **Filter Dropdown**: Instant filtering on selection change
2. **Column Headers**: Click to sort, click again to reverse
3. **Summary Cards**: Visual hierarchy with color coding
4. **Export Button**: Clear labeling with icon

## Performance Considerations

### Data Volume

- Expected: 100-1000 members
- Approach: Client-side processing acceptable
- If > 5000 members: Consider pagination

### Optimization Strategies

1. **Memoization**: Cache department lookup results
2. **Lazy Rendering**: Render table rows in batches if needed
3. **Debouncing**: Debounce filter changes if typing search
4. **Efficient Sorting**: Use native Array.sort() with optimized comparators

## Implementation Notes

### Existing Code Modification

The current `laporanHutangPiutang()` function will be enhanced, not replaced. Key changes:

1. Add department data retrieval
2. Join member and department data
3. Add department column to table
4. Add filter UI above table
5. Add summary section above table
6. Enhance CSV export

### Backward Compatibility

- Existing report functionality preserved
- No breaking changes to data structures
- Graceful handling of missing department data

### Dependencies

- Requires `departemen` data in localStorage
- Requires `anggota` data with `departemen` field
- Uses existing `formatRupiah()` helper function
- Uses Bootstrap 5 for UI components

## Security Considerations

### Data Access

- All data from localStorage (client-side)
- No server-side API calls required
- No sensitive data exposure beyond existing report

### Input Validation

- Validate department filter selection
- Sanitize data before CSV export
- Prevent XSS in rendered HTML

## Future Enhancements

1. **Advanced Filtering**: Multiple filter criteria (status + department)
2. **Date Range Filter**: Filter by debt transaction date
3. **Payment History**: Show payment history per member
4. **Email Reports**: Send report via email
5. **Chart Visualization**: Add pie/bar charts for department comparison
6. **Print Layout**: Optimized print stylesheet
