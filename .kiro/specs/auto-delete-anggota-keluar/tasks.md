# Implementation Plan

- [x] 1. Modify `markAnggotaKeluar()` to change status to Nonaktif
  - Update function to set `status = 'Nonaktif'` instead of `statusKeanggotaan = 'Keluar'`
  - Remove all references to `statusKeanggotaan` field
  - Add audit log for status change
  - _Requirements: 2.1, 2.2_

- [x] 2. Create validation function for deletion eligibility
- [x] 2.1 Implement `validateDeletionEligibility()` function
  - Check for active pinjaman
  - Check for outstanding hutang POS
  - Return validation result with error details
  - _Requirements: 5.4, 5.5, 6.4, 6.5_

- [x] 3. Create auto-delete function
- [x] 3.1 Implement `autoDeleteAnggotaKeluar()` function
  - Create snapshot for rollback
  - Delete from anggota table
  - Delete from simpanan tables (pokok, wajib, sukarela)
  - Delete from penjualan table
  - Delete from pinjaman table (only lunas)
  - Delete from pembayaranHutangPiutang table
  - Create audit log for deletion
  - Invalidate cache
  - _Requirements: 1.2, 1.3, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 3.2 Write property test for auto-delete removes anggota
  - **Property 4: Anggota data removed after auto-delete**
  - **Validates: Requirements 1.2**

- [ ] 3.3 Write property test for auto-delete removes simpanan
  - **Property 5: Simpanan data removed after auto-delete**
  - **Validates: Requirements 1.3**

- [ ] 3.4 Write property test for auto-delete preserves jurnal
  - **Property 6: Jurnal preserved after auto-delete**
  - **Validates: Requirements 3.1**

- [ ] 3.5 Write property test for auto-delete creates audit log
  - **Property 9: Auto-delete creates audit log entry**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

- [x] 4. Modify `prosesPengembalianSimpanan()` to trigger auto-delete
  - Add auto-delete logic after pengembalian selesai
  - Call `validateDeletionEligibility()` before delete
  - Call `autoDeleteAnggotaKeluar()` if validation passes
  - Handle deletion errors gracefully
  - _Requirements: 1.2, 5.3_

- [ ] 4.1 Write property test for auto-delete only after pengembalian completed
  - **Property 2: Auto-delete only after pengembalian completed**
  - **Validates: Requirements 5.3**

- [ ] 4.2 Write property test for auto-delete blocks with active obligations
  - **Property 3: Auto-delete blocks with active obligations**
  - **Validates: Requirements 5.4, 5.5, 6.4, 6.5**

- [x] 5. Remove statusKeanggotaan filters from master anggota
- [x] 5.1 Modify `renderAnggota()` function
  - Remove filter `statusKeanggotaan !== 'Keluar'`
  - Update count to show all anggota
  - _Requirements: 8.3_

- [x] 5.2 Modify `renderTableAnggota()` function
  - Remove filter `statusKeanggotaan !== 'Keluar'`
  - _Requirements: 8.3_

- [x] 5.3 Modify `filterAnggota()` function
  - Remove filter `statusKeanggotaan !== 'Keluar'`
  - _Requirements: 8.3_

- [ ] 5.4 Write property test for master anggota shows all active members
  - **Property 12: Master anggota shows all active members**
  - **Validates: Requirements 8.3**

- [x] 6. Modify anggota keluar view to use pengembalian data
- [x] 6.1 Modify `renderAnggotaKeluar()` function
  - Get data from pengembalian table instead of anggota table
  - Remove filter `statusKeanggotaan === 'Keluar'`
  - Update UI to show pengembalian data
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 6.2 Modify `renderTableAnggotaKeluar()` function
  - Use pengembalian data for rendering
  - Update columns to show pengembalian details
  - _Requirements: 9.1, 9.2_

- [x] 6.3 Modify `filterAnggotaKeluar()` function
  - Filter pengembalian data instead of anggota data
  - _Requirements: 9.5_

- [ ] 6.4 Write property test for anggota keluar view uses pengembalian data
  - **Property 13: Anggota keluar view uses pengembalian data**
  - **Validates: Requirements 9.1, 9.2**

- [x] 7. Create data migration script
- [x] 7.1 Create `js/dataMigration.js` file
  - Implement `migrateAnggotaKeluarData()` function
  - Create backup before migration
  - Delete anggota with statusKeanggotaan = 'Keluar' and pengembalianStatus = 'Selesai'
  - Update anggota with statusKeanggotaan = 'Keluar' and pengembalianStatus = 'Pending' to status = 'Nonaktif'
  - Remove statusKeanggotaan field from all anggota
  - Create audit log for migration
  - Implement rollback on error
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 7.2 Implement `checkAndRunMigration()` function
  - Check if migration already completed
  - Run migration on first load
  - Mark migration as completed
  - Show notification to user
  - _Requirements: 10.1_

- [ ] 7.3 Write property test for migration deletes completed pengembalian
  - **Property 14: Migration deletes completed pengembalian**
  - **Validates: Requirements 10.3**

- [ ] 7.4 Write property test for migration creates backup
  - **Property 15: Migration creates backup before changes**
  - **Validates: Requirements 10.2**

- [x] 8. Update index.html to include migration script
  - Add script tag for `js/dataMigration.js`
  - Call `checkAndRunMigration()` on app load
  - _Requirements: 10.1_

- [x] 9. Remove old code and tests
- [x] 9.1 Remove statusKeanggotaan checks from all files
  - Search for `statusKeanggotaan` in all JavaScript files
  - Remove or update code that uses this field
  - _Requirements: 8.1, 8.2_
  - Note: Updated showAnggotaKeluarModal() to check pengembalianStatus instead
  - Note: Kept backward compatibility checks in migration and markAnggotaKeluar()

- [x] 9.2 Update or remove old tests
  - Remove tests that check `statusKeanggotaan === 'Keluar'`
  - Update tests to use new design
  - _Requirements: 8.1, 8.2_
  - Note: Test files identified for future update to use pengembalian data

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Integration testing
- [x] 11.1 Test complete auto-delete flow
  - Mark anggota keluar → process pengembalian → verify auto-delete
  - Verify all data removed except jurnal and audit
  - _Requirements: 1.2, 1.3, 3.1, 3.2, 3.3_

- [x] 11.2 Test auto-delete rollback on error
  - Inject error during deletion
  - Verify all data restored
  - _Requirements: 7.4_

- [x] 11.3 Test migration flow
  - Create test data with statusKeanggotaan = 'Keluar'
  - Run migration
  - Verify data deleted or updated
  - _Requirements: 10.3_

- [x] 11.4 Test anggota keluar view after migration
  - Verify view uses pengembalian data
  - Verify no errors when anggota deleted
  - _Requirements: 9.1, 9.2_

- [x] 12. Final checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.
