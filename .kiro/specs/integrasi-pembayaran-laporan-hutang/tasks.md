# Implementation Plan

- [ ] 1. Create shared utility functions for hutang calculation
  - Create or update `js/utils.js` with shared calculation functions
  - Move `hitungSaldoHutang()` from pembayaranHutangPiutang.js to utils.js
  - Create `hitungTotalPembayaranHutang()` function
  - Create `getPembayaranHutangHistory()` function
  - Ensure functions handle edge cases (missing data, invalid IDs)
  - _Requirements: 5.1, 5.2_

- [ ] 1.1 Write property test for saldo calculation accuracy
  - **Property 1: Saldo hutang calculation accuracy**
  - **Validates: Requirements 1.1, 1.2**

- [ ] 2. Update pembayaranHutangPiutang.js to use shared functions
  - Replace local `hitungSaldoHutang()` with import from utils.js
  - Update all references to use the shared function
  - Verify existing functionality still works
  - _Requirements: 5.1, 5.3_

- [ ] 2.1 Write unit tests for pembayaran module integration
  - Test that pembayaran module correctly uses shared functions
  - Test saldo calculation before and after payment
  - _Requirements: 1.2_

- [ ] 3. Update reports.js to integrate payment data
  - [ ] 3.1 Update laporanHutangPiutang() to use hitungSaldoHutang()
    - Import shared calculation functions
    - Replace direct credit calculation with hitungSaldoHutang()
    - Calculate totalPembayaran for each anggota
    - Update data structure to include totalKredit, totalPembayaran, saldoHutang
    - _Requirements: 1.1, 1.3, 3.1, 3.2_

  - [ ] 3.2 Add payment columns to report table
    - Add "Total Kredit" column to show original credit amount
    - Add "Total Pembayaran" column to show payments made
    - Update "Total Hutang" column to show saldoHutang (after payments)
    - Update table headers and styling
    - _Requirements: 1.3, 3.1_

  - [ ] 3.3 Update status determination logic
    - Use saldoHutang instead of totalKredit for status
    - Show "Lunas" when saldoHutang <= 0
    - Show "Belum Lunas" when saldoHutang > 0
    - _Requirements: 1.4, 1.5_

- [ ] 3.4 Write property test for status determination
  - **Property 2: Status determination based on saldo**
  - **Validates: Requirements 1.4, 1.5**

- [ ] 3.5 Write property test for report display consistency
  - **Property 3: Report display consistency**
  - **Validates: Requirements 1.3**

- [ ] 4. Add payment history detail view
  - [ ] 4.1 Create expandable row or modal for payment history
    - Add click handler to anggota rows
    - Create UI to display payment history
    - Show tanggal, jumlah, kasir for each payment
    - Handle empty state with "Belum ada pembayaran" message
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 4.2 Implement getPembayaranHutangHistory() display
    - Fetch payment history for selected anggota
    - Format dates and amounts for display
    - Sort by date (newest first)
    - _Requirements: 2.1, 2.2_

- [ ] 4.3 Write property test for payment history completeness
  - **Property 4: Payment history completeness**
  - **Validates: Requirements 2.1, 2.2**

- [ ] 5. Update CSV export functionality
  - [ ] 5.1 Add payment columns to CSV export
    - Add "Total Kredit" column to CSV
    - Add "Total Pembayaran" column to CSV
    - Update "Total Hutang" to show saldoHutang
    - Ensure UTF-8 BOM for Excel compatibility
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 5.2 Update downloadHutangPiutangCSV() function
    - Modify CSV headers to include new columns
    - Update data rows to include totalKredit, totalPembayaran, saldoHutang
    - Test CSV opens correctly in Excel
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 5.3 Write unit tests for CSV export
  - Test CSV includes all required columns
  - Test CSV data matches report data
  - Test UTF-8 BOM is included
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 6. Update filter functionality
  - Ensure department filter works with new data structure
  - Ensure filtered data shows correct saldo calculations
  - Update count displays to reflect filtered data
  - _Requirements: 1.3_

- [ ] 6.1 Write property test for total pembayaran calculation
  - **Property 5: Total pembayaran calculation**
  - **Validates: Requirements 3.2**

- [ ] 7. Add property-based tests
  - [ ] 7.1 Write property test for calculation consistency
    - **Property 6: Calculation consistency across modules**
    - **Validates: Requirements 5.2, 5.3**

  - [ ] 7.2 Write integration tests
    - Test full flow: credit transaction → payment → report update
    - Test cross-module consistency
    - Test edge cases: zero saldo, no payments, multiple payments
    - _Requirements: 1.1, 1.2, 1.3, 5.3_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Update documentation
  - Update user guide with new report columns
  - Document payment history feature
  - Add screenshots of updated report
  - _Requirements: All_

- [ ] 10. Final integration testing
  - Test with real-world data scenarios
  - Verify performance with large datasets
  - Test all user workflows end-to-end
  - Verify backward compatibility
  - _Requirements: All_
