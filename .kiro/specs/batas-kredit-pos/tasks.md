# Implementation Plan

- [ ] 1. Create CreditLimitValidator module with core calculation methods
  - Create js/creditLimit.js file with CreditLimitValidator class
  - Implement calculateOutstandingBalance() method to sum unpaid credit transactions
  - Implement getAvailableCredit() method to calculate remaining credit
  - Implement getUnpaidTransactions() method to retrieve unpaid transaction list
  - Add error handling for localStorage access failures
  - Add input validation for all methods
  - Create singleton instance for global access
  - _Requirements: 1.1, 1.2, 1.3, 5.2, 5.3_

- [ ] 1.1 Write property test for outstanding balance calculation
  - **Property 1: Outstanding balance calculation correctness**
  - **Validates: Requirements 1.1**

- [ ] 1.2 Write property test for available credit calculation
  - **Property 8: Available credit calculation correctness**
  - **Validates: Requirements 5.2**

- [ ] 1.3 Write property test for unpaid transactions list
  - **Property 9: Unpaid transactions list completeness**
  - **Validates: Requirements 5.3**

- [ ] 1.4 Write property test for only unpaid transactions counted
  - **Property 7: Only unpaid credit transactions are counted**
  - **Validates: Requirements 4.2**

- [ ] 2. Implement credit validation logic
  - Implement validateCreditTransaction() method with limit checking
  - Implement getCreditStatus() method with visual indicators
  - Add validation for total exposure calculation
  - Add logic to reject transactions exceeding Rp 2.000.000
  - Add logic to accept transactions at or below limit
  - Return structured validation results with detailed information
  - _Requirements: 2.1, 2.2, 2.4, 2.5_

- [ ] 2.1 Write property test for total exposure calculation
  - **Property 2: Total exposure calculation correctness**
  - **Validates: Requirements 2.1**

- [ ] 2.2 Write property test for rejection above limit
  - **Property 3: Transactions exceeding limit are rejected**
  - **Validates: Requirements 2.2**

- [ ] 2.3 Write property test for rejection details
  - **Property 4: Rejection includes required information**
  - **Validates: Requirements 2.4**

- [ ] 2.4 Write property test for acceptance at or below limit
  - **Property 5: Transactions at or below limit are accepted**
  - **Validates: Requirements 2.5**

- [ ] 3. Integrate credit info display into POS interface
  - Add credit info section HTML to POS cart area
  - Create updateCreditInfo() function to fetch and display credit data
  - Add event listener to member selection dropdown
  - Display outstanding balance and available credit
  - Display credit status indicator with color coding
  - Hide credit info section when "Umum (Cash)" is selected
  - _Requirements: 1.4, 5.1, 5.2_

- [ ] 4. Integrate credit validation into payment processing
  - Modify processPayment() function to validate bon transactions
  - Add validation check before processing bon payments
  - Display error message when transaction exceeds limit
  - Show outstanding balance and transaction amount in error
  - Allow cash transactions to bypass validation
  - Ensure validation only applies to bon (credit) transactions
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 3.1, 3.2_

- [ ] 5. Add creditLimit.js script to index.html
  - Add script tag for js/creditLimit.js in index.html
  - Ensure script is loaded before pos.js
  - Verify no console errors on page load
  - _Requirements: All_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Write unit tests for edge cases
  - Test member with no transactions (outstanding = 0)
  - Test member with only cash transactions (outstanding = 0)
  - Test member with only paid transactions (outstanding = 0)
  - Test transaction exactly at Rp 2.000.000 limit
  - Test empty member ID handling
  - Test invalid transaction amounts (negative, zero, null)
  - Test corrupted localStorage data handling
  - _Requirements: 1.3, 2.2, 2.5_

- [ ] 8. Write integration tests for POS module
  - Test credit info display updates on member selection
  - Test validation is called during bon payment
  - Test error messages display correctly
  - Test cash transactions bypass validation
  - Test visual indicators (green, yellow, red)
  - _Requirements: 1.4, 2.3, 3.1, 5.1_
