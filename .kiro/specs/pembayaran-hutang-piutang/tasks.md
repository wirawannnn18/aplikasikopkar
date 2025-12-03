# Implementation Plan - Pembayaran Hutang Piutang Anggota

## Task List

- [ ] 1. Setup project structure and core module
  - Create `js/pembayaranHutangPiutang.js` file
  - Add menu item to sidebar navigation in `index.html`
  - Setup module initialization and routing
  - _Requirements: 6.1_

- [ ] 2. Implement saldo calculation functions
  - [ ] 2.1 Create `hitungSaldoHutang(anggotaId)` function
    - Calculate total kredit from POS transactions
    - Subtract total payments already made
    - Return current hutang balance
    - _Requirements: 1.1_
  
  - [ ] 2.2 Create `hitungSaldoPiutang(anggotaId)` function
    - Calculate piutang balance for anggota
    - Return current piutang balance
    - _Requirements: 2.1_
  
  - [ ] 2.3 Write property test for saldo calculation
    - **Property 1: Hutang saldo display accuracy**
    - **Property 5: Piutang saldo display accuracy**
    - **Validates: Requirements 1.1, 2.1**

- [ ] 3. Implement main UI rendering
  - [ ] 3.1 Create `renderPembayaranHutangPiutang()` function
    - Render main page layout with tabs for hutang and piutang
    - Display summary cards for total hutang and piutang
    - Add navigation buttons
    - _Requirements: 6.1_
  
  - [ ] 3.2 Create form pembayaran UI
    - Render form with anggota search field
    - Add jenis pembayaran selector (hutang/piutang)
    - Add jumlah pembayaran input
    - Add keterangan textarea
    - Display current saldo
    - _Requirements: 6.1, 6.4_
  
  - [ ] 3.3 Write unit tests for UI rendering
    - Test form structure is correct
    - Test all required fields are present
    - _Requirements: 6.1_

- [ ] 4. Implement autocomplete anggota search
  - [ ] 4.1 Create `searchAnggota(query)` function
    - Filter anggota by NIK or nama
    - Return matching results
    - Limit to 10 suggestions
    - _Requirements: 6.2_
  
  - [ ] 4.2 Create `renderAnggotaSuggestions(results)` function
    - Display autocomplete dropdown
    - Handle click selection
    - Update form with selected anggota
    - _Requirements: 6.2, 6.3_
  
  - [ ] 4.3 Implement debounce for search input
    - Add 300ms debounce to prevent excessive searches
    - _Requirements: 6.2_
  
  - [ ] 4.4 Write property test for autocomplete
    - **Property 18: Autocomplete matching**
    - **Validates: Requirements 6.2**

- [ ] 5. Implement validation logic
  - [ ] 5.1 Create `validatePembayaran(data)` function
    - Validate anggota is selected
    - Validate jumlah > 0
    - Validate jumlah <= saldo
    - Return validation result with error messages
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ] 5.2 Write property tests for validation
    - **Property 2: Hutang payment validation**
    - **Property 6: Piutang payment validation**
    - **Validates: Requirements 1.2, 2.2, 3.1, 3.2, 3.3, 3.4**

- [ ] 6. Implement payment processing
  - [ ] 6.1 Create `prosesPembayaran()` function
    - Validate input data
    - Calculate saldo before and after
    - Create payment transaction record
    - Call journal recording function
    - Handle errors with rollback
    - Show success/error message
    - _Requirements: 1.3, 1.5, 2.3, 2.5, 7.4, 7.5_
  
  - [ ] 6.2 Create `savePembayaran(data)` function
    - Generate unique transaction ID
    - Save to localStorage
    - Return transaction object
    - _Requirements: 1.3, 2.3_
  
  - [ ] 6.3 Create `rollbackPembayaran(transaksiId)` function
    - Remove transaction from localStorage
    - Restore previous state
    - _Requirements: 7.4_
  
  - [ ] 6.4 Write property tests for payment processing
    - **Property 3: Hutang saldo reduction**
    - **Property 7: Piutang saldo reduction**
    - **Property 24: Transaction rollback on error**
    - **Property 25: Atomic transaction completion**
    - **Validates: Requirements 1.3, 2.3, 7.4, 7.5**

- [ ] 7. Implement journal entry recording
  - [ ] 7.1 Create `createJurnalPembayaranHutang(data)` function
    - Generate journal entry for hutang payment
    - Debit: Kas (1-1000)
    - Kredit: Hutang Anggota (2-1000)
    - Call `addJurnal()` with entries
    - _Requirements: 1.4, 7.1, 7.3_
  
  - [ ] 7.2 Create `createJurnalPembayaranPiutang(data)` function
    - Generate journal entry for piutang payment
    - Debit: Piutang Anggota (1-1200)
    - Kredit: Kas (1-1000)
    - Call `addJurnal()` with entries
    - _Requirements: 2.4, 7.2, 7.3_
  
  - [ ] 7.3 Write property tests for journal entries
    - **Property 4: Hutang journal structure**
    - **Property 8: Piutang journal structure**
    - **Property 21: Hutang journal balance**
    - **Property 22: Piutang journal balance**
    - **Property 23: Account balance consistency**
    - **Validates: Requirements 1.4, 2.4, 7.1, 7.2, 7.3**

- [ ] 8. Implement audit logging
  - [ ] 8.1 Create `saveAuditLog(action, details)` function
    - Generate audit log entry
    - Include user, timestamp, action, details
    - Save to localStorage
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [ ] 8.2 Add audit logging to payment process
    - Log successful payments
    - Log failed payments with error details
    - Log print actions
    - _Requirements: 5.1, 5.2, 5.3, 8.5_
  
  - [ ] 8.3 Write property tests for audit logging
    - **Property 14: Audit log creation**
    - **Property 15: Audit log completeness**
    - **Property 16: Error logging**
    - **Property 17: Audit log persistence**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [ ] 9. Implement transaction history display
  - [ ] 9.1 Create `renderRiwayatPembayaran()` function
    - Load all payment transactions
    - Render table with all transactions
    - Display required fields (tanggal, anggota, jenis, jumlah, kasir)
    - _Requirements: 4.1, 4.2_
  
  - [ ] 9.2 Implement filter by jenis pembayaran
    - Add filter dropdown
    - Filter transactions by selected jenis
    - Update table display
    - _Requirements: 4.3_
  
  - [ ] 9.3 Implement filter by date range
    - Add date range inputs
    - Filter transactions by date range
    - Update table display
    - _Requirements: 4.4_
  
  - [ ] 9.4 Implement filter by anggota
    - Add anggota filter dropdown
    - Filter transactions by selected anggota
    - Update table display
    - _Requirements: 4.5_
  
  - [ ] 9.5 Write property tests for filtering
    - **Property 9: Complete transaction display**
    - **Property 10: Required fields in display**
    - **Property 11: Jenis filter correctness**
    - **Property 12: Date range filter correctness**
    - **Property 13: Member filter correctness**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

- [ ] 10. Implement receipt printing
  - [ ] 10.1 Create `cetakBuktiPembayaran(transaksiId)` function
    - Load transaction data
    - Generate receipt HTML with all required fields
    - Open print dialog
    - Log print action to audit
    - _Requirements: 8.1, 8.2, 8.3, 8.5_
  
  - [ ] 10.2 Create receipt template
    - Include koperasi header with logo
    - Display transaction details
    - Include nomor transaksi, tanggal, anggota, jenis, jumlah
    - Display saldo before and after
    - Include kasir name
    - Add footer with timestamp
    - _Requirements: 8.2, 8.3_
  
  - [ ] 10.3 Write property tests for receipt
    - **Property 26: Receipt completeness**
    - **Property 27: Print action logging**
    - **Validates: Requirements 8.2, 8.3, 8.5**

- [ ] 11. Implement UI interaction enhancements
  - [ ] 11.1 Add automatic saldo display on anggota selection
    - Update saldo display when anggota is selected
    - Show both hutang and piutang saldo
    - _Requirements: 6.3_
  
  - [ ] 11.2 Add dynamic saldo display based on jenis
    - Highlight relevant saldo based on selected jenis
    - Enable/disable jumlah input based on saldo availability
    - _Requirements: 6.4_
  
  - [ ] 11.3 Add form validation feedback
    - Show real-time validation messages
    - Enable/disable submit button based on validation
    - _Requirements: 6.5_
  
  - [ ] 11.4 Write property tests for UI interactions
    - **Property 19: Automatic saldo display**
    - **Property 20: Relevant saldo display by jenis**
    - **Validates: Requirements 6.3, 6.4, 6.5**

- [ ] 12. Add confirmation dialogs and user feedback
  - [ ] 12.1 Add confirmation dialog before processing payment
    - Show payment summary
    - Require user confirmation
    - _Requirements: 1.5, 2.5_
  
  - [ ] 12.2 Add success notification with details
    - Display payment confirmation
    - Show updated saldo
    - Offer option to print receipt
    - _Requirements: 1.5, 2.5_
  
  - [ ] 12.3 Add error handling with user-friendly messages
    - Display clear error messages
    - Provide guidance for resolution
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 13. Implement security and access control
  - [ ] 13.1 Add role-based access validation
    - Check user role before allowing operations
    - Kasir can process payments
    - Admin can view all history
    - _Requirements: All_
  
  - [ ] 13.2 Add input sanitization
    - Sanitize text inputs to prevent XSS
    - Validate numeric inputs
    - Validate date formats
    - _Requirements: All_

- [ ] 14. Create test file and setup
  - [ ] 14.1 Create `__tests__/pembayaranHutangPiutang.test.js`
    - Setup Jest test environment
    - Mock localStorage
    - Mock existing functions (addJurnal, showAlert, etc.)
    - _Requirements: All_
  
  - [ ] 14.2 Setup fast-check for property-based testing
    - Install fast-check library
    - Create custom generators for test data
    - Setup test utilities
    - _Requirements: All_

- [ ] 15. Integration testing and bug fixes
  - [ ] 15.1 Test complete payment flow end-to-end
    - Test hutang payment flow
    - Test piutang payment flow
    - Verify journal entries are correct
    - Verify saldo updates are correct
    - _Requirements: All_
  
  - [ ] 15.2 Test error scenarios
    - Test validation errors
    - Test journal recording errors
    - Test rollback functionality
    - _Requirements: 3.1-3.5, 7.4_
  
  - [ ] 15.3 Test with real data scenarios
    - Import sample anggota data
    - Create sample transactions
    - Test filtering and search
    - Test receipt printing
    - _Requirements: All_

- [ ] 16. Documentation and user guide
  - [ ] 16.1 Create user manual
    - Document how to process hutang payment
    - Document how to process piutang payment
    - Document how to view history
    - Document how to print receipts
    - _Requirements: All_
  
  - [ ] 16.2 Create technical documentation
    - Document API functions
    - Document data structures
    - Document integration points
    - _Requirements: All_

- [ ] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
