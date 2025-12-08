# Implementation Plan: Wizard Anggota Keluar

## Overview

This implementation plan converts the wizard design into actionable coding tasks. The wizard will guide admins through a 5-step process to properly handle member exits with financial validation, refund processing, document generation, status updates, and accounting verification.

---

## Tasks

- [x] 1. Create wizard controller class
  - Create `js/anggotaKeluarWizard.js` file
  - Implement `AnggotaKeluarWizard` class with state management
  - Add navigation methods (nextStep, previousStep, goToStep)
  - Add validation methods (canNavigateNext, canNavigatePrevious)
  - Add snapshot/rollback methods for error handling
  - _Requirements: 7.1, 8.1, 8.2, 10.1_

- [ ]* 1.1 Write property test for wizard navigation
  - **Property 8: Step indicator accuracy**
  - **Validates: Requirements 7.2, 7.3, 7.4**
  - Test that step indicator reflects current state correctly
  - _Requirements: 7.2, 7.3, 7.4_

- [ ]* 1.2 Write property test for sequential validation
  - **Property 9: Sequential validation enforcement**
  - **Validates: Requirements 8.1, 8.2, 8.3**
  - Test that navigation enforces sequential completion
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 2. Implement Step 1: Validasi Hutang/Piutang
  - Create `validateHutangPiutang()` function in `js/anggotaKeluarManager.js`
  - Check for active loans (sisaPinjaman > 0)
  - Check for active receivables (sisaPiutang > 0)
  - Return validation result with detailed error messages
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - **Status:** ✅ COMPLETE - See `IMPLEMENTASI_TASK2_WIZARD_ANGGOTA_KELUAR.md`

- [ ]* 2.1 Write property test for validation blocking
  - **Property 1: Validation blocks progress when debt exists**
  - **Validates: Requirements 1.4, 1.5**
  - Test that wizard blocks when debt exists
  - _Requirements: 1.4, 1.5_

- [x] 3. Implement Step 2: Pencairan Simpanan
  - Create `hitungTotalSimpanan()` function in `js/anggotaKeluarManager.js`
  - Calculate simpanan pokok, wajib, sukarela totals
  - Get current kas and bank balances
  - Display breakdown and balance projection
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - **Status:** ✅ COMPLETE - See `IMPLEMENTASI_TASK2_WIZARD_ANGGOTA_KELUAR.md`

- [ ]* 3.1 Write property test for simpanan calculation
  - **Property 2: Simpanan calculation accuracy**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
  - Test that total equals sum of components
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 4. Implement automatic journal creation
  - Create `prosesPencairanSimpanan()` function in `js/anggotaKeluarManager.js`
  - Create journal for simpanan pokok (debit 2-1100, credit kas/bank)
  - Create journal for simpanan wajib (debit 2-1200, credit kas/bank)
  - Create journal for simpanan sukarela (debit 2-1300, credit kas/bank)
  - Validate double-entry balance
  - Save pengembalian record with journal references
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - **Status:** ✅ COMPLETE - See `IMPLEMENTASI_TASK2_WIZARD_ANGGOTA_KELUAR.md`

- [ ]* 4.1 Write property test for journal balance
  - **Property 3: Journal double-entry balance**
  - **Validates: Requirements 3.4**
  - Test that debit equals credit for all journals
  - _Requirements: 3.4_

- [ ]* 4.2 Write property test for journal references
  - **Property 4: Journal references completeness**
  - **Validates: Requirements 3.5**
  - Test that pengembalian has all journal IDs
  - _Requirements: 3.5_

- [x] 5. Implement Step 3: Print Dokumen
  - Create `generateDokumenAnggotaKeluar()` function in `js/anggotaKeluarUI.js`
  - Generate surat pengunduran diri with anggota identity
  - Generate bukti pencairan with simpanan breakdown
  - Open print dialog for both documents
  - Save document references
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - **Status:** ✅ COMPLETE - See `IMPLEMENTASI_TASK2_WIZARD_ANGGOTA_KELUAR.md`

- [ ]* 5.1 Write property test for document completeness
  - **Property 5: Document generation completeness**
  - **Validates: Requirements 4.3, 4.4, 4.5**
  - Test that document refs include all required IDs
  - _Requirements: 4.3, 4.4, 4.5_

- [x] 6. Implement Step 4: Update Status
  - Create `updateStatusAnggotaKeluar()` function in `js/anggotaKeluarManager.js`
  - Update statusKeanggotaan to 'Keluar'
  - Set tanggalKeluar, alasanKeluar
  - Set pengembalianStatus to 'Selesai'
  - Set pengembalianId reference
  - Save document references
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - **Status:** ✅ COMPLETE - See `IMPLEMENTASI_TASK2_WIZARD_ANGGOTA_KELUAR.md`

- [ ]* 6.1 Write property test for status update
  - **Property 6: Status update completeness**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
  - Test that all status fields are populated
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 7. Implement Step 5: Verifikasi Accounting
  - Create `verifikasiAccounting()` function in `js/anggotaKeluarManager.js`
  - Verify all journals are recorded
  - Validate total debit equals total kredit
  - Validate total pencairan matches journal sum
  - Check kas balance is sufficient
  - Return verification result with details
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - **Status:** ✅ COMPLETE - See `IMPLEMENTASI_TASK2_WIZARD_ANGGOTA_KELUAR.md`

- [ ]* 7.1 Write property test for accounting verification
  - **Property 7: Accounting verification accuracy**
  - **Validates: Requirements 6.2, 6.3**
  - Test that journal sum equals pencairan amount
  - _Requirements: 6.2, 6.3_

- [x] 8. Implement wizard UI components
  - Create wizard modal HTML structure in `js/anggotaKeluarUI.js`
  - Implement step indicator component
  - Implement step content rendering for each step
  - Implement navigation buttons (Kembali, Batal, Lanjut, Selesai)
  - Add confirmation dialog for cancel action
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.4, 8.5_
  - **Status:** ✅ COMPLETE - See `IMPLEMENTASI_TASK8_WIZARD_UI.md`

- [x] 9. Implement audit logging
  - Add audit log for wizard start
  - Add audit log for each step completion
  - Add audit log for pencairan with amount details
  - Add audit log for status update
  - Add audit log for wizard completion or cancellation
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  - **Status:** ✅ COMPLETE - See `IMPLEMENTASI_TASK9_AUDIT_LOGGING_WIZARD.md`

- [ ]* 9.1 Write property test for audit log completeness
  - **Property 10: Audit log completeness**
  - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**
  - Test that all wizard events are logged
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 10. Implement error handling and rollback
  - Create `createSnapshot()` function for state backup
  - Create `restoreSnapshot()` function for rollback
  - Wrap critical operations in try-catch with rollback
  - Display clear error messages to user
  - Log errors to audit log
  - Add recovery instructions for critical failures
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  - **Status:** ✅ COMPLETE - See `IMPLEMENTASI_TASK10_ERROR_HANDLING_WIZARD.md`

- [ ]* 10.1 Write property test for rollback consistency
  - **Property 11: Rollback data consistency**
  - **Validates: Requirements 10.1, 10.2, 10.3**
  - Test that rollback restores original state
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 11. Integrate wizard with anggota keluar menu
  - Add "Proses Keluar (Wizard)" button in anggota keluar list
  - Replace existing flow with wizard flow
  - Update menu navigation to open wizard
  - Ensure backward compatibility with existing data
  - _Requirements: All_
  - **Status:** ✅ COMPLETE - See `IMPLEMENTASI_TASK11_INTEGRASI_WIZARD.md`

- [x] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - **Status:** ✅ COMPLETE - See `CHECKPOINT_TASK12_WIZARD_ANGGOTA_KELUAR.md`

- [x] 13. Create comprehensive integration test
  - Test complete wizard flow from start to finish
  - Test wizard with anggota having debts (should block)
  - Test wizard with anggota having no debts (should complete)
  - Test error scenarios and rollback
  - Test UI rendering and navigation
  - Test audit log creation
  - _Requirements: All_
  - **Status:** ✅ COMPLETE - See `IMPLEMENTASI_TASK13_INTEGRATION_TESTING_WIZARD.md`

- [x] 14. Update documentation
  - Add JSDoc comments to all new functions
  - Update inline comments for wizard logic
  - Create user guide for wizard usage
  - Document error codes and recovery procedures
  - _Requirements: All_
  - **Status:** ✅ COMPLETE - See `IMPLEMENTASI_TASK14_DOCUMENTATION_WIZARD.md`

---

## Notes

- All property-based tests should run minimum 100 iterations
- Use fast-check library for property-based testing
- Each property test must reference the correctness property from design doc
- Wizard state should be saved to allow resuming if interrupted
- All critical operations must have rollback capability
- UI should be responsive and provide clear feedback at each step
- Error messages should be user-friendly and actionable
- Audit logs are critical for compliance and troubleshooting
