# Implementation Plan: Laporan Hutang Piutang dengan Departemen

## Task List

- [ ] 1. Enhance data retrieval and join member with department data
  - Modify `laporanHutangPiutang()` function to retrieve departemen data from localStorage
  - Implement logic to join anggota data with departemen data based on departemen field
  - Handle cases where member has no department (display "-" or "Tidak Ada Departemen")
  - Calculate total hutang per member from penjualan with status 'kredit'
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 1.1 Write property test for department data join
  - **Property 2: Department Data Join Correctness**
  - **Validates: Requirements 1.3**

- [ ] 2. Add department column to report table UI
  - Update HTML template in `laporanHutangPiutang()` to include department column header
  - Add department data cell to each table row
  - Ensure consistent formatting for department values (use "-" for missing departments)
  - Update table structure to show: NIK, Nama, Departemen, Total Hutang, Status
  - _Requirements: 1.1, 1.4, 1.5_

- [ ] 2.1 Write property test for row structure completeness
  - **Property 3: Row Structure Completeness**
  - **Validates: Requirements 1.4**

- [ ] 2.2 Write property test for department formatting consistency
  - **Property 4: Department Formatting Consistency**
  - **Validates: Requirements 1.5**

- [ ] 3. Implement department filter functionality
  - [ ] 3.1 Create department filter dropdown UI
    - Add filter dropdown above report table
    - Populate dropdown with unique departments from anggota data
    - Include "Semua Departemen" option as default
    - _Requirements: 2.1, 2.2_

  - [ ] 3.2 Implement filter function `filterHutangPiutangByDepartemen()`
    - Create function to filter report data by selected department
    - Update report table display with filtered data
    - Maintain filter state for export functionality
    - _Requirements: 2.3, 2.4, 2.5_

- [ ] 3.3 Write property test for filter dropdown population
  - **Property 5: Filter Dropdown Population**
  - **Validates: Requirements 2.2**

- [ ] 3.4 Write property test for department filter correctness
  - **Property 6: Department Filter Correctness**
  - **Validates: Requirements 2.3**

- [ ] 3.5 Write property test for show all filter
  - **Property 7: Show All Filter Completeness**
  - **Validates: Requirements 2.4**

- [ ] 4. Implement department summary section
  - [ ] 4.1 Create summary calculation function `calculateDepartmentDebtSummary()`
    - Group debt data by department
    - Calculate total debt per department
    - Count members with debt per department
    - Sort departments by total debt descending
    - _Requirements: 3.2, 3.4, 3.5_

  - [ ] 4.2 Render summary cards UI
    - Create summary section above report table
    - Display department name, total debt, and member count for each department
    - Use Bootstrap card components for visual presentation
    - Exclude departments with zero debt from summary
    - _Requirements: 3.1, 3.3_

- [ ] 4.3 Write property test for debt aggregation correctness
  - **Property 9: Department Debt Aggregation Correctness**
  - **Validates: Requirements 3.2**

- [ ] 4.4 Write property test for summary structure
  - **Property 10: Summary Structure Completeness**
  - **Validates: Requirements 3.3**

- [ ] 4.5 Write property test for zero debt exclusion
  - **Property 11: Zero Debt Department Exclusion**
  - **Validates: Requirements 3.4**

- [ ] 4.6 Write property test for summary sort order
  - **Property 12: Summary Sort Order**
  - **Validates: Requirements 3.5**

- [ ] 5. Implement table sorting functionality
  - [ ] 5.1 Create sort function `sortHutangPiutangTable()`
    - Implement sorting logic for different column types (string, number)
    - Handle sort direction toggle (ascending/descending)
    - Update sort state and re-render table
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

  - [ ] 5.2 Add sortable column headers
    - Make NIK, Nama, Departemen, and Total Hutang columns sortable
    - Add click event listeners to column headers
    - Display sort indicators (↑↓) in headers
    - _Requirements: 5.1_

- [ ] 5.3 Write property test for column sort ascending
  - **Property 18: Column Sort Ascending**
  - **Validates: Requirements 5.2**

- [ ] 5.4 Write property test for sort direction toggle
  - **Property 19: Sort Direction Toggle**
  - **Validates: Requirements 5.3**

- [ ] 5.5 Write property test for department alphabetical sort
  - **Property 20: Department Alphabetical Sort**
  - **Validates: Requirements 5.4**

- [ ] 5.6 Write property test for debt numerical sort
  - **Property 21: Debt Numerical Sort**
  - **Validates: Requirements 5.5**

- [ ] 6. Enhance CSV export functionality
  - [ ] 6.1 Update CSV export function `downloadHutangPiutangCSV()`
    - Modify existing CSV export to include department column
    - Apply current filter state to exported data
    - Use UTF-8 encoding with BOM for Indonesian character support
    - Generate filename with format "laporan_hutang_piutang_YYYYMMDD.csv"
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 6.2 Update download button handler
    - Replace existing `downloadCSV()` call with `downloadHutangPiutangCSV()`
    - Ensure button triggers correct export function
    - _Requirements: 4.1_

- [ ] 6.3 Write property test for CSV content completeness
  - **Property 13: CSV Content Completeness**
  - **Validates: Requirements 4.1**

- [ ] 6.4 Write property test for CSV column structure
  - **Property 14: CSV Column Structure**
  - **Validates: Requirements 4.2**

- [ ] 6.5 Write property test for CSV filter consistency
  - **Property 15: CSV Filter Consistency**
  - **Validates: Requirements 4.3**

- [ ] 6.6 Write property test for CSV encoding preservation
  - **Property 16: CSV Encoding Preservation**
  - **Validates: Requirements 4.4**

- [ ] 6.7 Write property test for CSV filename format
  - **Property 17: CSV Filename Format**
  - **Validates: Requirements 4.5**

- [ ] 7. Add responsive design and styling
  - Apply Bootstrap classes for responsive table
  - Style summary cards with color coding
  - Add hover effects to table rows
  - Ensure mobile-friendly layout
  - _Requirements: All (UI/UX enhancement)_

- [ ] 8. Handle edge cases and error scenarios
  - Add handling for members with missing department data
  - Display appropriate messages for empty report data
  - Log warnings for data inconsistencies
  - Test with various data scenarios (empty, single department, multiple departments)
  - _Requirements: All (Error handling)_

- [ ] 8.1 Write unit tests for edge cases
  - Test member with no department assigned
  - Test report with no outstanding debts
  - Test member referencing non-existent department
  - Test empty anggota or penjualan data

- [ ] 9. Integration testing and validation
  - Test complete report flow: load → filter → sort → export
  - Test filter + sort combination
  - Verify data refresh when master data changes
  - Test with realistic data volumes (100-1000 members)
  - _Requirements: All (Integration testing)_

- [ ] 9.1 Write integration tests
  - Test complete report workflow
  - Test filter and sort combination
  - Test data refresh scenarios

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including property-based tests are required for comprehensive implementation
- Focus on implementing features with their corresponding tests together
- UI enhancements (task 7) can be done incrementally
- Integration tests (task 9) should be performed after core features are complete
- All code should follow existing patterns in `js/reports.js`
- Use existing helper functions like `formatRupiah()` and `formatDate()`
