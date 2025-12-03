# Implementation Plan - Hapus Data Jurnal

## Task List

- [x] 1. Setup project structure and repository classes
  - Create `js/hapusDataJurnal.js` file
  - Implement JournalRepository class with CRUD operations
  - Implement COARepository class for account balance management
  - Implement AuditLogRepository class for deletion logging
  - Implement PeriodRepository class for period status checks
  - _Requirements: 1.1, 2.1, 3.1, 4.5, 5.3_

- [x] 1.1 Write property test for repository operations
  - **Property 14: Journal list display completeness**
  - **Validates: Requirements 1.1, 2.1, 3.1, 1.4**

- [x] 2. Implement validation services
  - Create ValidationService class
  - Implement role-based authorization check (super admin only)
  - Implement period status validation (open/closed)
  - Implement reference checking (detect linked transactions)
  - Implement reason validation (non-empty, max 500 chars)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 2.1 Write property test for role authorization
  - **Property 3: Role-based deletion authorization**
  - **Validates: Requirements 5.1**

- [x] 2.2 Write property test for closed period protection
  - **Property 4: Closed period protection**
  - **Validates: Requirements 5.3, 5.4**

- [x] 2.3 Write property test for referential integrity
  - **Property 2: Referential integrity protection**
  - **Validates: Requirements 1.5, 3.5, 5.2**

- [x] 2.4 Write property test for reason validation
  - **Property 15: Reason validation**
  - **Validates: Requirements 5.5**

- [ ] 3. Implement balance adjustment service
  - Create BalanceAdjustmentService class
  - Implement balance reversal logic for journal entries
  - Implement COA balance update with proper debit/credit handling
  - Implement balance consistency validation
  - Handle different account types (Aset, Kewajiban, Modal, Pendapatan, Beban)
  - _Requirements: 2.3, 2.4, 9.1, 9.2, 9.5_

- [ ]* 3.1 Write property test for balance reversal
  - **Property 1: Journal deletion with balance reversal**
  - **Validates: Requirements 1.3, 2.3, 3.3, 9.1, 9.2, 9.3**

- [ ]* 3.2 Write property test for negative balance prevention
  - **Property 13: Negative balance prevention**
  - **Validates: Requirements 2.5**

- [ ]* 3.3 Write property test for post-deletion consistency
  - **Property 11: Post-deletion consistency validation**
  - **Validates: Requirements 9.5**

- [ ] 4. Implement impact analysis service
  - Create ImpactAnalysisService class
  - Implement affected accounts identification
  - Calculate before/after balance changes
  - Identify related transactions
  - Generate warnings for potential issues
  - Determine if deletion is safe (canDelete flag)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 4.1 Write property test for impact preview completeness
  - **Property 9: Impact preview completeness**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

- [ ] 5. Implement audit logging service
  - Create AuditLoggerService class
  - Implement comprehensive audit log creation with all required fields
  - Generate unique audit IDs with format AUDIT-JOURNAL-YYYYMMDD-NNNN
  - Capture complete journal snapshot before deletion
  - Record user information, timestamp, reason, and impact analysis
  - Implement audit history retrieval
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 5.1 Write property test for audit logging completeness
  - **Property 5: Comprehensive audit logging**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

- [ ] 6. Implement main deletion orchestration service
  - Create JournalDeletionService class
  - Orchestrate complete deletion workflow
  - Implement snapshot/rollback mechanism for error recovery
  - Coordinate validation, balance adjustment, deletion, and audit logging
  - Handle errors and rollback on failure
  - Return structured result with success status and messages
  - _Requirements: 1.3, 2.3, 3.3, 9.4_

- [ ]* 6.1 Write property test for atomic rollback
  - **Property 10: Atomic rollback on failure**
  - **Validates: Requirements 9.4**

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement UI filter panel
  - Create renderFilterPanel() function
  - Implement search input (journal number, description)
  - Implement type filter dropdown (umum, kas, pembelian)
  - Implement date range filters (start date, end date)
  - Implement account code filter
  - Add reset filters button
  - Attach event listeners for real-time filtering
  - _Requirements: 7.1, 7.2, 7.3_

- [ ]* 8.1 Write property test for filter accuracy
  - **Property 7: Filter result accuracy**
  - **Validates: Requirements 7.4**

- [ ]* 8.2 Write property test for search relevance
  - **Property 8: Search result relevance**
  - **Validates: Requirements 7.5**

- [ ] 9. Implement journal table display
  - Create renderJournalTable() function
  - Display journals with all required fields (date, number, type, description, debit/credit totals)
  - Implement sorting by date (newest first)
  - Add action buttons (View Detail, Delete)
  - Handle empty state (no journals found)
  - Implement pagination (20 items per page)
  - _Requirements: 1.1, 1.4, 2.1, 3.1_

- [ ] 10. Implement impact preview modal
  - Create showImpactPreview() function
  - Display before/after balance comparison for affected accounts
  - Show list of affected accounts with balance changes
  - Display related transactions warnings
  - Show specific warnings for cash balance or stock changes
  - Add visual indicators for balance increases/decreases
  - _Requirements: 6.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 11. Implement double confirmation dialogs
  - Create showFirstConfirmation() function with journal details
  - Create showSecondConfirmation() function with impact warnings
  - Implement reason input field (mandatory)
  - Add cancel handlers at each confirmation level
  - Ensure sequential flow (first → second → deletion)
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ]* 11.1 Write property test for double confirmation flow
  - **Property 6: Double confirmation requirement**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [ ] 12. Implement notification system
  - Create showNotification() function
  - Implement success notifications with journal details
  - Implement error notifications with specific error messages
  - Implement warning notifications for validation failures
  - Add manual dismiss option
  - Style notifications with appropriate colors (success=green, error=red, warning=yellow)
  - _Requirements: 1.4, 10.1, 10.2, 10.3, 10.5_

- [ ]* 12.1 Write property test for notification accuracy
  - **Property 12: Notification accuracy**
  - **Validates: Requirements 10.1, 10.2, 10.3, 10.5**

- [ ] 13. Implement main page render function
  - Create renderHapusDataJurnal() function as entry point
  - Set up page structure with filter panel and journal table
  - Initialize filter state
  - Load and display journals
  - Integrate all UI components
  - _Requirements: 1.1, 2.1, 3.1_

- [ ] 14. Integrate with navigation menu
  - Add "Hapus Data Jurnal" menu item in index.html
  - Add menu item only for super admin users
  - Link menu item to renderHapusDataJurnal() function
  - Add appropriate icon (trash icon)
  - _Requirements: 5.1_

- [ ] 15. Implement audit history viewer
  - Create renderAuditHistory() function
  - Display all deletion logs in table format
  - Show audit ID, journal number, deleted by, deleted at, reason
  - Add detail view for each audit log
  - Implement date range filter for audit history
  - Add export to CSV functionality
  - _Requirements: 4.5_

- [ ] 16. Add error handling and user feedback
  - Implement try-catch blocks in all service methods
  - Map technical errors to user-friendly messages
  - Add loading indicators during deletion process
  - Implement confirmation success feedback
  - Add validation error highlighting in forms
  - _Requirements: 5.5, 10.2, 10.3_

- [ ] 17. Checkpoint - Final testing
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 18. Write integration tests
  - Test complete deletion flow from UI to storage
  - Test validation flow with various invalid states
  - Test filter and search flow
  - Test error recovery and rollback flow
  - _Requirements: All_

- [ ]* 19. Create manual testing documentation
  - Document manual test cases for all requirements
  - Create test data setup instructions
  - Document expected results for each test case
  - _Requirements: All_

## Notes

- All property-based tests should use fast-check library
- Each property test should run minimum 100 iterations
- Tasks marked with * are optional (tests, documentation)
- Checkpoint tasks ensure quality gates before proceeding
- Tests should be written alongside implementation for early bug detection

## Current Status

**Completed:**
- ✅ Repository layer (JournalRepository, COARepository, AuditLogRepository, PeriodRepository)
- ✅ Validation service (JournalValidationService) with all validation methods
- ✅ Property tests for validation (authorization, period, references, reason)
- ✅ Property test for repository operations (journal list display)

**In Progress:**
- None

**Remaining:**
- Balance adjustment service
- Impact analysis service
- Audit logging service
- Main deletion orchestration service
- All UI components (filter panel, journal table, modals, notifications)
- Integration with navigation menu
- Audit history viewer
- Error handling and user feedback
