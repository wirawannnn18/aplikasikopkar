# Implementation Plan - Reset Data Koperasi

- [x] 1. Setup project structure and core interfaces
  - Create js/resetDataKoperasi.js file for main reset functionality
  - Define TypeScript-style JSDoc interfaces for all data models (ResetRequest, CategoryInfo, ResetResult, etc.)
  - Setup integration points with existing BackupService and AuditLogger
  - _Requirements: All_

- [x] 2. Implement CategoryManager class
  - [x] 2.1 Create CategoryManager with category definitions
    - Define all data categories with groups (Master Data, Transaction Data, System Settings)
    - Map each category to its localStorage keys
    - Implement getAllCategories() to return categories with current counts
    - Implement getCategoryGroups() for grouped display
    - _Requirements: 2.1, 2.2, 2.3_

  - [x]* 2.2 Write property test for category key mapping
    - **Property 10: Category-specific key deletion**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

  - [x] 2.3 Implement size calculation and dependencies
    - Implement calculateSize() for selected categories
    - Implement getKeysForCategory() to get all keys for a category
    - Implement getDependencies() for category relationships
    - _Requirements: 6.1, 6.2, 6.3_

  - [x]* 2.4 Write property test for size calculation
    - **Property 10: Category-specific key deletion (size verification)**
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 3. Implement ResetValidationService class
  - [x] 3.1 Create validation methods
    - Implement validatePermissions() to check user role (super_admin only)
    - Implement validateCategorySelection() to ensure at least one category selected
    - Implement validateConfirmation() for confirmation text matching
    - Implement checkDependencies() to warn about dependent categories
    - _Requirements: 2.5, 4.3, 4.4_

  - [x]* 3.2 Write property test for confirmation validation
    - **Property 6: Confirmation sequence integrity (text validation)**
    - **Validates: Requirements 4.3, 4.4**

- [x] 4. Implement ResetService class - Core functionality
  - [x] 4.1 Create ResetService with constructor and dependencies
    - Initialize CategoryManager, BackupService, AuditLogger, ValidationService
    - Implement getAvailableCategories() method
    - Implement validateResetRequest() method
    - _Requirements: 2.1, 2.5_

  - [x] 4.2 Implement backup creation before reset
    - Integrate with existing BackupService
    - Create automatic backup before any deletion
    - Handle backup failures and cancel reset if backup fails
    - Download backup file automatically
    - _Requirements: 3.1, 3.3, 3.4, 3.5_

  - [x]* 4.3 Write property test for backup before reset
    - **Property 3: Backup creation before reset**
    - **Validates: Requirements 3.1, 3.3, 3.5**

  - [x]* 4.4 Write property test for backup timestamp format
    - **Property 4: Backup timestamp format**
    - **Validates: Requirements 3.2**

  - [x]* 4.5 Write property test for reset cancellation on backup failure
    - **Property 5: Reset cancellation on backup failure**
    - **Validates: Requirements 3.4**

- [x] 5. Implement ResetService - Deletion logic
  - [x] 5.1 Implement executeReset() method
    - Create progress tracking with callbacks
    - Iterate through selected categories
    - Delete localStorage keys for each category
    - Preserve current session data
    - Handle errors and stop on failure
    - _Requirements: 5.1, 5.2, 5.5, 6.1, 6.2, 6.3, 6.5_

  - [x]* 5.2 Write property test for session preservation
    - **Property 11: Session preservation in full reset**
    - **Validates: Requirements 6.5**

  - [x] 5.3 Implement verifyResetCompletion() method
    - Check that all selected keys are deleted
    - Verify session key still exists
    - Return verification result with details
    - _Requirements: 6.4_

  - [x]* 5.4 Write property test for deletion verification
    - **Property 10: Category-specific key deletion (verification)**
    - **Validates: Requirements 6.4**

  - [x] 5.5 Implement error handling with rollback
    - Stop deletion on first error
    - Log which categories succeeded/failed
    - Return detailed error information
    - _Requirements: 5.5_

  - [x]* 5.6 Write property test for error handling
    - **Property 9: Error handling with rollback**
    - **Validates: Requirements 5.5**

- [x] 6. Implement ResetService - Audit logging
  - [x] 6.1 Integrate audit logging throughout reset process
    - Log at reset start (user, timestamp, categories)
    - Log each category deletion (category name, count)
    - Log at reset completion (status, duration, total deleted)
    - Log backup creation (filename, size)
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x]* 6.2 Write property test for comprehensive audit trail
    - **Property 12: Comprehensive audit trail**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

  - [x]* 6.3 Write property test for audit log exportability
    - **Property 13: Audit log exportability**
    - **Validates: Requirements 7.5**

- [x] 7. Implement dry-run (test mode) functionality
  - [x] 7.1 Implement performDryRun() method
    - Simulate reset without actual deletion
    - Calculate what would be deleted
    - Generate detailed simulation report
    - Return dry-run results
    - _Requirements: 10.1, 10.2, 10.3_

  - [x]* 7.2 Write property test for dry-run non-destructive behavior
    - **Property 21: Dry-run non-destructive**
    - **Validates: Requirements 10.1, 10.2, 10.3**

- [x] 8. Implement SetupWizardService class
  - [x] 8.1 Create SetupWizardService with setup steps
    - Define all setup steps (nama koperasi, periode akuntansi, COA, dll)
    - Implement getSetupSteps() to return steps with completion status
    - Implement isStepCompleted() to check individual step
    - Implement completeStep() to mark step as done
    - Implement getProgress() to calculate overall progress
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ]* 8.2 Write property test for setup completion tracking
    - **Property 19: Setup completion tracking**
    - **Validates: Requirements 9.4**

- [ ] 9. Implement Reset UI - Main page
  - [ ] 9.1 Create renderResetDataPage() function
    - Add menu item in system settings with warning icon
    - Create reset page layout with warning messages
    - Display available categories grouped by type
    - Show statistics (total records, size estimate)
    - Add radio buttons for full/selective reset
    - _Requirements: 1.1, 1.2, 1.3, 2.1_

  - [ ] 9.2 Implement category selection UI
    - Show/hide category checkboxes based on reset type
    - Implement "Select All" and "Deselect All" buttons
    - Update size estimate when selection changes
    - Enable/disable reset button based on selection
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

  - [ ]* 9.3 Write property test for selective reset UI state
    - **Property 1: Selective reset UI state consistency**
    - **Validates: Requirements 2.2, 2.3, 2.5**

  - [ ]* 9.4 Write property test for full reset auto-selection
    - **Property 2: Full reset auto-selection**
    - **Validates: Requirements 2.4**

- [ ] 10. Implement Reset UI - Confirmation dialogs
  - [ ] 10.1 Create first confirmation dialog
    - Show list of categories to be deleted
    - Display estimated records and size
    - Show warning about data loss
    - Add "Cancel" and "Continue" buttons
    - _Requirements: 4.1_

  - [ ] 10.2 Create second confirmation dialog
    - Show critical warning message
    - Add text input for confirmation keyword
    - Validate input in real-time
    - Enable/disable confirm button based on input
    - Style confirm button as danger (red)
    - _Requirements: 4.2, 4.3, 4.4_

  - [ ]* 10.3 Write property test for confirmation sequence
    - **Property 6: Confirmation sequence integrity**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

  - [ ] 10.4 Implement confirmation flow handler
    - Connect first dialog to second dialog
    - Connect second dialog to reset execution
    - Handle dialog cancellation
    - _Requirements: 4.5_

- [ ] 11. Implement Reset UI - Progress tracking
  - [ ] 11.1 Create progress modal
    - Show progress bar with percentage
    - Display current category being processed
    - Show processed/total categories count
    - Disable all UI interactions during reset
    - Prevent page navigation during reset
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 11.2 Write property test for progress tracking
    - **Property 7: Progress tracking completeness**
    - **Validates: Requirements 5.1, 5.2, 5.4**

  - [ ]* 11.3 Write property test for UI locking
    - **Property 8: UI locking during reset**
    - **Validates: Requirements 5.3**

  - [ ] 11.4 Create result summary modal
    - Show success/failure status
    - Display deleted categories with counts
    - Show backup file information
    - Display any warnings or errors
    - Add button to proceed to setup wizard
    - _Requirements: 5.4, 5.5_

- [ ] 12. Implement Setup Wizard UI
  - [ ] 12.1 Create renderSetupWizard() function
    - Display welcome message after reset
    - Show checklist of setup steps
    - Mark completed steps with checkmarks
    - Show progress indicator
    - _Requirements: 9.1, 9.2_

  - [ ] 12.2 Implement setup step navigation
    - Make each checklist item clickable
    - Navigate to corresponding configuration page
    - Track which steps are completed
    - Update progress when returning to wizard
    - _Requirements: 9.3, 9.4_

  - [ ]* 12.3 Write property test for setup wizard navigation
    - **Property 18: Setup wizard navigation**
    - **Validates: Requirements 9.3**

  - [ ] 12.3 Implement post-reset login message
    - Store reset flag in localStorage
    - Check flag on login page
    - Display reset notification message
    - Clear flag after showing message
    - _Requirements: 9.5_

  - [ ]* 12.4 Write property test for post-reset login message
    - **Property 20: Post-reset login message**
    - **Validates: Requirements 9.5**

- [ ] 13. Implement test mode functionality
  - [ ] 13.1 Add test mode toggle in UI
    - Add toggle switch in reset page header
    - Show "TEST MODE" badge when active
    - Require admin confirmation to enable/disable
    - Persist test mode state in session
    - _Requirements: 10.4, 10.5_

  - [ ]* 13.2 Write property test for test mode indicator
    - **Property 22: Test mode indicator**
    - **Validates: Requirements 10.4**

  - [ ]* 13.3 Write property test for test mode deactivation
    - **Property 23: Test mode deactivation confirmation**
    - **Validates: Requirements 10.5**

  - [ ] 13.4 Integrate dry-run with UI
    - Call performDryRun() instead of executeReset() in test mode
    - Display simulation results in modal
    - Show detailed log of what would be deleted
    - Add button to download simulation report
    - _Requirements: 10.1, 10.2, 10.3_

- [ ] 14. Implement restore integration
  - [ ] 14.1 Add restore page link from reset page
    - Add "Restore from Backup" button
    - Navigate to existing backup/restore page
    - Ensure backup list shows reset-related backups
    - _Requirements: 8.1_

  - [ ] 14.2 Enhance backup preview for reset backups
    - Show if backup was created before reset
    - Display reset metadata if available
    - Highlight pre-reset backups
    - _Requirements: 8.2_

  - [ ]* 14.3 Write property test for backup preview accuracy
    - **Property 14: Backup preview accuracy**
    - **Validates: Requirements 8.2**

  - [ ]* 14.4 Write property test for restore data integrity
    - **Property 15: Restore data integrity**
    - **Validates: Requirements 8.3, 8.4**

  - [ ]* 14.5 Write property test for restore failure safety
    - **Property 16: Restore failure safety**
    - **Validates: Requirements 8.5**

- [ ] 15. Add security and rate limiting
  - [ ] 15.1 Implement permission checks
    - Verify super_admin role before showing reset page
    - Re-verify permissions before executing reset
    - Show access denied message for non-admin users
    - _Requirements: All_

  - [ ] 15.2 Implement rate limiting
    - Track reset operations per user
    - Enforce cooldown period between resets (e.g., 5 minutes)
    - Log suspicious activity (multiple rapid attempts)
    - Display cooldown message if limit reached
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 16. Create user documentation
  - [ ] 16.1 Create PANDUAN_RESET_DATA_KOPERASI.md
    - Document when to use reset feature
    - Explain full vs selective reset
    - Provide step-by-step instructions with screenshots
    - Include troubleshooting section
    - Add FAQ section
    - _Requirements: All_

  - [ ] 16.2 Add inline help and tooltips
    - Add help icons with explanations
    - Add tooltips for each category
    - Add warning tooltips for dangerous actions
    - _Requirements: 1.3, 2.1, 2.2_

- [ ] 17. Final checkpoint - Integration testing
  - Test complete full reset flow end-to-end
  - Test selective reset with various category combinations
  - Test error scenarios (backup failure, deletion failure)
  - Test test mode (dry-run) functionality
  - Test setup wizard after reset
  - Test restore after reset
  - Verify all audit logs are created correctly
  - Test with different user roles
  - Test rate limiting
  - Ensure all tests pass, ask the user if questions arise
  - _Requirements: All_

