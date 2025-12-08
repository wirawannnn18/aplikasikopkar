# Implementation Plan: Filter Anggota Keluar dari Master Anggota

## Overview

This implementation plan converts the design into actionable coding tasks to filter anggota keluar from Master Anggota displays while preserving data in localStorage.

---

## Tasks

- [x] 1. Create core filtering function
  - Create `filterActiveAnggota()` function in js/koperasi.js
  - Create `getActiveAnggotaCount()` helper function
  - Add JSDoc comments explaining purpose and usage
  - _Requirements: 1.1, 1.2, 5.1_

- [ ]* 1.1 Write property test for filtering exclusion
  - **Property 1: Master Anggota Exclusion**
  - **Validates: Requirements 1.1**
  - Test that filtered result excludes all anggota with statusKeanggotaan === 'Keluar'
  - Use fast-check to generate random anggota arrays
  - _Requirements: 1.1_

- [ ]* 1.2 Write property test for count consistency
  - **Property 2: Count Consistency**
  - **Validates: Requirements 1.2, 1.3**
  - Test that count matches filtered length
  - Use fast-check to generate random anggota arrays
  - _Requirements: 1.2, 1.3_

- [ ]* 1.3 Write property test for data preservation
  - **Property 5: Data Preservation**
  - **Validates: Requirements 1.4**
  - Test that localStorage preserves all data after filtering
  - Use fast-check to generate random anggota arrays
  - _Requirements: 1.4_

- [x] 2. Update Master Anggota rendering
  - Modify `renderAnggota()` to use `filterActiveAnggota()`
  - Update total count badge to show active anggota only
  - Update "Menampilkan X dari Y" text to show active count
  - Remove old comment about auto-delete
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. Update table rendering function
  - Modify `renderTableAnggota()` to apply `filterActiveAnggota()`
  - Replace comment "No need to filter" with proper filtering
  - Ensure filteredData parameter also gets filtered
  - _Requirements: 1.1_

- [x] 4. Update filter function
  - Modify `filterAnggota()` to start with active anggota only
  - Apply `filterActiveAnggota()` before other filters
  - Update filtered count display
  - _Requirements: 1.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 4.1 Write property test for filter preservation
  - **Property 4: Filter Preservation**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
  - Test that filter operations exclude keluar
  - Test with search, departemen, tipe, status filters
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. Update sort function
  - Modify `sortAnggotaByDate()` to start with active anggota only
  - Apply `filterActiveAnggota()` before sorting
  - Maintain exclusion in both ascending and descending sort
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 5.1 Write property test for sort preservation
  - **Property 7: Sort Preservation**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**
  - Test that sorted results exclude keluar
  - Test both ascending and descending sort
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 6. Update export function
  - Modify `exportAnggota()` to export active anggota only
  - Add comment explaining exclusion
  - Update export filename to indicate "active" members
  - _Requirements: 5.4_

- [x] 7. Update simpanan dropdowns
  - Modify `renderSimpananPokok()` dropdown to use `filterActiveAnggota()`
  - Modify `renderSimpananWajib()` dropdown to use `filterActiveAnggota()`
  - Modify `renderSimpananSukarela()` dropdown to use `filterActiveAnggota()`
  - Replace inline filters with function call
  - _Requirements: 2.1, 2.2, 2.3_

- [ ]* 7.1 Write property test for dropdown exclusion
  - **Property 3: Dropdown Exclusion**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
  - Test that dropdown options exclude keluar
  - Test for simpanan pokok, wajib, sukarela
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Update documentation
  - Add JSDoc comments to `filterActiveAnggota()` function
  - Update inline comments in modified functions
  - Add explanation comments for filtering logic
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 10. Integration testing
  - Test Master Anggota rendering with mixed data
  - Test dropdown population with mixed data
  - Test filter interaction with mixed data
  - Test sort interaction with mixed data
  - Test export function with mixed data
  - _Requirements: All_

---

## Notes

- All property-based tests should run minimum 100 iterations
- Use fast-check library for property-based testing
- Each property test must reference the correctness property from design doc
- Core filtering function should be reusable across all modules
- No data migration needed - statusKeanggotaan field already exists
- Filtering is applied at display time, not storage time
- Data preservation is critical for audit and historical reporting
