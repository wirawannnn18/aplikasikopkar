# Implementation Plan: Fix Status Anggota Keluar

- [x] 1. Implement data migration function
  - Add `migrateAnggotaKeluarStatus()` function to `js/dataMigration.js`
  - Function should detect anggota with inconsistent status
  - Fix `status` field to 'Nonaktif' for anggota with `tanggalKeluar`
  - Remove legacy `statusKeanggotaan` field
  - Return migration statistics (total checked, fixed count)
  - _Requirements: 1.4, 1.5, 2.1, 2.2, 2.4, 2.5_

- [x]* 1.1 Write property test for migration idempotence
  - **Property 5: Migration idempotence**
  - **Validates: Requirements 1.4, 2.5**
  - Generate random anggota list with mixed status
  - Run migration twice
  - Verify second run changes nothing (idempotent)

- [x]* 1.2 Write property test for status consistency
  - **Property 1: Status consistency for exited members**
  - **Validates: Requirements 1.2, 2.1**
  - Generate random anggota with `tanggalKeluar`
  - Run migration
  - Verify `status` is always 'Nonaktif'

- [x]* 1.3 Write property test for legacy field removal
  - **Property 2: Legacy field removal**
  - **Validates: Requirements 2.2, 2.3**
  - Generate random anggota with `statusKeanggotaan`
  - Run migration
  - Verify `statusKeanggotaan` field is removed

- [x] 2. Integrate migration into renderAnggota
  - Modify `renderAnggota()` in `js/koperasi.js`
  - Call `migrateAnggotaKeluarStatus()` before rendering
  - Log migration results to console if any fixes were made
  - Ensure migration doesn't block UI rendering
  - _Requirements: 1.1, 1.4_

- [x] 3. Enhance display logic for status
  - Modify `renderTableAnggota()` in `js/koperasi.js`
  - Add fallback logic: if `tanggalKeluar` exists, force status to 'Nonaktif'
  - Ensure status badge color matches actual status
  - Update status badge rendering to use consistent logic
  - _Requirements: 1.1, 1.2, 1.3, 3.5_

- [ ]* 3.1 Write property test for display status correctness
  - **Property 3: Display status correctness**
  - **Validates: Requirements 1.1, 3.5**
  - Generate random anggota with `tanggalKeluar`
  - Render display HTML
  - Verify badge shows 'Nonaktif' with grey color (bg-secondary)

- [x] 4. Fix filter logic for status
  - Modify `filterAnggota()` in `js/koperasi.js`
  - Ensure "Nonaktif" filter includes all anggota with `status = 'Nonaktif'`
  - Ensure "Aktif" filter excludes anggota with `tanggalKeluar`
  - Update filter to use migrated data
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ]* 4.1 Write property test for filter consistency
  - **Property 4: Filter consistency**
  - **Validates: Requirements 3.1, 3.4**
  - Generate random anggota list with mixed status
  - Apply filter 'Nonaktif'
  - Verify all results have `status = 'Nonaktif'`

- [x] 5. Add error handling and logging
  - Add try-catch blocks in migration function
  - Log errors to console with descriptive messages
  - Handle invalid anggota objects gracefully
  - Add warning message if migration fails
  - _Requirements: 2.5_

- [ ]* 5.1 Write unit tests for error handling
  - Test migration with invalid data structure
  - Test migration with localStorage errors
  - Verify errors are logged and don't crash app

- [x] 6. Checkpoint - Ensure all tests pass
  - All property-based tests pass (21 tests, 3 test suites)

- [ ] 7. Update public folder files
  - Copy updated `js/dataMigration.js` to `public/js/`
  - Copy updated `js/koperasi.js` to `public/js/`
  - Ensure both folders are in sync
  - _Requirements: All_

- [ ]* 7.1 Write integration test
  - Test complete flow: load page → migration runs → display correct
  - Test filter functionality with migrated data
  - Test persistence after page reload

- [ ] 8. Final verification
  - Manually test Master Anggota page
  - Verify anggota keluar show "Nonaktif" status
  - Verify filter works correctly
  - Check console for migration logs
  - _Requirements: All_
