# Implementation Plan - Filter dan Hapus Jurnal

- [x] 1. Setup data structures and utility functions
  - Create data models for audit log, closed periods, and filter criteria
  - Implement utility functions for date calculations and preset periods
  - Add new fields to existing journal entry structure (reconciled, periodClosed, deletedAt, deletedBy, deletedReason)
  - Initialize default data structures in localStorage if not exists
  - _Requirements: 1.1, 4.1, 5.1, 6.2_

- [x] 1.1 Write property test for preset date calculations
  - **Property 13: Preset populates correct date range**
  - **Validates: Requirements 7.2**

- [x] 2. Implement date filter UI component
  - [x] 2.1 Create filter UI with start date, end date inputs
    - Add date filter controls to renderJurnal() function
    - Create HTML structure for filter section with date inputs
    - Add preset buttons (Hari Ini, Minggu Ini, Bulan Ini, Bulan Lalu)
    - Add clear filter button
    - Style filter section to match existing UI
    - _Requirements: 1.1, 7.1_

  - [x] 2.2 Implement date range validation
    - Write validateDateRange() function to check end date >= start date
    - Display validation error messages for invalid ranges
    - Prevent filter application when validation fails
    - _Requirements: 1.4_

  - [x] 2.3 Write property test for date range validation
    - **Property 3: Invalid date range shows error**
    - **Validates: Requirements 1.4**

  - [x] 2.4 Implement preset date calculator
    - Write setJurnalPreset() function for each preset type
    - Calculate date ranges for 'today', 'thisWeek', 'thisMonth', 'lastMonth'
    - Auto-populate date inputs when preset selected
    - Add visual indicator for active preset
    - _Requirements: 7.2_

  - [x] 2.5 Write property test for preset calculations
    - **Property 13: Preset populates correct date range**
    - **Validates: Requirements 7.2**

  - [x] 2.6 Implement manual date change handler
    - Detect manual changes to date inputs
    - Clear preset selection indicator when dates manually changed
    - _Requirements: 7.3_

  - [x] 2.7 Write property test for manual override
    - **Property 14: Manual date change clears preset**
    - **Validates: Requirements 7.3**

- [x] 3. Implement filter application logic
  - [x] 3.1 Create filter application function
    - Write applyJurnalDateFilter() to filter journal entries by date range
    - Filter entries where tanggal >= startDate AND tanggal <= endDate
    - Update journal table display with filtered results
    - Display count of filtered entries
    - _Requirements: 1.2, 1.5_

  - [x] 3.2 Write property test for filter range
    - **Property 1: Date filter returns only entries within range**
    - **Validates: Requirements 1.2**

  - [x] 3.3 Write property test for filtered count
    - **Property 4: Filtered count matches actual count**
    - **Validates: Requirements 1.5**

  - [x] 3.4 Implement clear filter function
    - Write clearJurnalDateFilter() to reset filter
    - Display all journal entries when filter cleared
    - Reset date inputs and preset selection
    - _Requirements: 1.3_

  - [x] 3.5 Write property test for clear filter
    - **Property 2: Clear filter shows all entries**
    - **Validates: Requirements 1.3**

- [x] 4. Implement session persistence
  - [x] 4.1 Create session storage functions
    - Write saveFilterToSession() to store filter criteria
    - Write loadFilterFromSession() to restore filter on page load
    - Store startDate, endDate, preset, and appliedAt timestamp
    - _Requirements: 4.1, 4.2_

  - [x] 4.2 Integrate session persistence with filter
    - Call saveFilterToSession() when filter applied
    - Call loadFilterFromSession() in renderJurnal()
    - Restore filter state when returning to jurnal menu
    - _Requirements: 4.2_

  - [x] 4.3 Write property test for session round-trip
    - **Property 10: Filter persists in session (round-trip)**
    - **Validates: Requirements 4.1, 4.2**

  - [x] 4.4 Clear session on logout



















    - Clear filter session storage when user logs out
    - Integrate with existing logout() function
    - _Requirements: 4.3_



- [x] 5. Implement delete button UI




  - [x] 5.1 Add delete button to journal table


    - Modify renderJurnal() to add delete button column
    - Add delete button for each journal entry row
    - Style delete button with appropriate icon and color
    - Show delete button only for users with permission
    - _Requirements: 2.1_

  - [x] 5.2 Wire up delete button click handler




    - Connect delete button to showDeleteJurnalConfirmation() function
    - Pass journal entry ID to confirmation dialog
    - _Requirements: 2.1_

- [x] 6. Implement permission validation
  - [x] 6.1 Create permission checker function
    - Write canDeleteJurnal() to check user permissions
    - Check if entry is reconciled (block deletion)
    - Check if entry is in closed period (require SuperAdmin)
    - Return permission result with error message if blocked
    - _Requirements: 6.1, 6.2_

  - [x] 6.2 Write property test for reconciled entry protection
    - **Property 11: Reconciled entries cannot be deleted**
    - **Validates: Requirements 6.1**

  - [x] 6.3 Write property test for closed period access control
    - **Property 12: Closed period entries require SuperAdmin**
    - **Validates: Requirements 6.2**

- [x] 7. Implement confirmation dialog
  - [x] 7.1 Create confirmation dialog UI
    - Write showDeleteJurnalConfirmation() function
    - Create modal dialog with Bootstrap
    - Display entry details: date, keterangan, accounts, debits, credits
    - Calculate and display balance impact per account
    - Add optional reason input field
    - Add confirm and cancel buttons
    - _Requirements: 2.2, 3.1, 3.2_

  - [x] 7.2 Write property test for dialog content
    - **Property 8: Confirmation dialog shows complete details**
    - **Validates: Requirements 3.1, 3.2**

  - [x] 7.3 Implement cancel handler
    - Close dialog without making changes
    - Maintain current state (no data changes)
    - _Requirements: 3.3_

  - [x] 7.4 Write property test for cancel preservation
    - **Property 9: Cancel maintains state**
    - **Validates: Requirements 3.3**

  - [x] 7.5 Add SuperAdmin extra confirmation
    - Show additional confirmation step for SuperAdmin deleting closed period entries
    - Display warning about deleting from closed period
    - _Requirements: 6.3_

- [x] 8. Implement reversal generation
  - [x] 8.1 Create reversal generator function
    - Write generateReversalEntries() to create reversal journal entries
    - For each entry in original journal, create opposite entry (swap debit/credit)
    - Set keterangan to indicate reversal with original entry reference
    - Generate unique IDs for reversal entries
    - _Requirements: 2.4_

  - [x] 8.2 Implement balance calculator
    - Write calculateBalanceImpact() to show how deletion affects account balances
    - Calculate per-account impact from original entries
    - Calculate per-account impact from reversal entries
    - Return net impact per account
    - _Requirements: 3.2_

  - [x] 8.3 Write property test for balanced reversals
    - **Property 7: Deletion creates balanced reversals**
    - **Validates: Requirements 2.4, 5.2**

- [x] 9. Implement audit logging
  - [x] 9.1 Create audit log structure
    - Initialize auditLog array in localStorage if not exists
    - Define audit log entry structure with all required fields
    - _Requirements: 5.1_

  - [x] 9.2 Implement audit logger function
    - Write createAuditLog() to create audit entries
    - Include timestamp, user info, action, priority, and details
    - Include reason if provided by user
    - Store audit log in localStorage
    - _Requirements: 5.1, 5.3_

  - [x] 9.3 Implement reversal linking
    - Write linkReversalToOriginal() to link reversal entries in audit log
    - Store reversal IDs in original entry's audit log
    - Store original ID in reversal entries' audit log
    - _Requirements: 5.2_

  - [x] 9.4 Write property test for audit logging
    - **Property 6: Deletion removes entry and creates audit log**
    - **Validates: Requirements 2.3, 5.1, 5.3**

- [ ] 10. Implement deletion execution
  - [ ] 10.1 Create main deletion function
    - Write deleteJurnalEntry() to orchestrate deletion process
    - Check permissions using canDeleteJurnal()
    - Generate reversal entries
    - Update COA balances (reverse original impact)
    - Mark original entry as deleted (soft delete) or remove (hard delete)
    - Create audit log entry
    - Link reversals in audit log
    - _Requirements: 2.3, 2.4_

  - [ ] 10.2 Implement COA balance updates
    - Reverse the balance changes from original journal entry
    - Apply balance changes from reversal entries
    - Ensure accounting equation remains balanced
    - _Requirements: 2.4_

  - [ ] 10.3 Add success notification and refresh
    - Display success message after deletion
    - Refresh journal list to show updated data
    - Maintain active filter after refresh
    - _Requirements: 2.5_

  - [ ] 10.4 Write property test for deletion and audit
    - **Property 6: Deletion removes entry and creates audit log**
    - **Validates: Requirements 2.3, 5.1, 5.3**

- [x] 11. Integrate all components
  - [x] 11.1 Update renderJurnal() function
    - Integrate date filter UI at top of journal page
    - Integrate delete buttons in journal table
    - Load filter from session on page load
    - Apply saved filter if exists
    - Wire up all event handlers
    - _Requirements: All_

  - [x] 11.2 Add error handling
    - Handle localStorage full errors
    - Handle sessionStorage unavailable
    - Handle missing COA accounts gracefully
    - Display user-friendly error messages
    - _Requirements: All_

- [x] 12. Create test file for property-based tests
  - Create __tests__/filterHapusJurnal.test.js
  - Set up fast-check library
  - Implement all property-based tests
  - Configure to run minimum 100 iterations per property
  - Tag each test with feature name and property number

- [ ] 13. Checkpoint - Run all tests
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Final integration and manual testing
  - Manually test complete filter and delete flow in browser
  - Test with different user roles (Admin, SuperAdmin, User)
  - Test edge cases (empty data, large datasets, unbalanced journals)
  - Verify all requirements are met
  - Test session persistence across page navigation
  - Test logout clears session filter
  - _Requirements: All_
