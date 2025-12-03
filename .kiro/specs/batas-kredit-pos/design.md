# Design Document

## Overview

Fitur batas kredit POS adalah sistem pembatasan kredit untuk transaksi Point of Sales yang mencegah anggota melakukan belanja kredit melebihi batas Rp 2.000.000 selama masih memiliki tagihan yang belum dilunasi. Sistem ini terintegrasi dengan modul POS yang sudah ada dan menggunakan localStorage sebagai mekanisme penyimpanan data.

Fitur ini dirancang untuk:
- Mengelola risiko kredit koperasi
- Memberikan visibilitas real-time tentang status kredit anggota
- Mencegah tunggakan berlebihan
- Memudahkan kasir dalam memvalidasi transaksi kredit

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                     POS Interface                        │
│  - Member Selection                                      │
│  - Cart Management                                       │
│  - Payment Processing                                    │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│              CreditLimitValidator                        │
│  - Calculate Outstanding Balance                        │
│  - Validate Credit Transaction                          │
│  - Get Available Credit                                 │
│  - Get Credit Status                                    │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                   localStorage                           │
│  - penjualan: Array<Transaction>                        │
│  - anggota: Array<Member>                               │
└─────────────────────────────────────────────────────────┘
```

### Integration Points

1. **POS Module (js/pos.js)**
   - Existing module that handles point of sales transactions
   - Integration point: `processPayment()` function
   - Integration point: Member selection dropdown
   - Integration point: Credit info display section

2. **Credit Limit Module (js/creditLimit.js)**
   - New standalone module
   - Provides validation and calculation services
   - No dependencies on other modules
   - Singleton pattern for global access

3. **Data Layer (localStorage)**
   - Existing storage mechanism
   - No schema changes required
   - Uses existing `penjualan` and `anggota` collections

## Components and Interfaces

### CreditLimitValidator Class

```javascript
class CreditLimitValidator {
    /**
     * Calculate total outstanding balance for a member
     * @param {string} anggotaId - Member ID
     * @returns {number} Total outstanding balance
     */
    calculateOutstandingBalance(anggotaId): number
    
    /**
     * Validate if a credit transaction can proceed
     * @param {string} anggotaId - Member ID
     * @param {number} transactionAmount - New transaction amount
     * @returns {ValidationResult}
     */
    validateCreditTransaction(anggotaId, transactionAmount): ValidationResult
    
    /**
     * Get available credit for a member
     * @param {string} anggotaId - Member ID
     * @returns {number} Available credit amount
     */
    getAvailableCredit(anggotaId): number
    
    /**
     * Get credit status with visual indicator
     * @param {string} anggotaId - Member ID
     * @returns {CreditStatus}
     */
    getCreditStatus(anggotaId): CreditStatus
    
    /**
     * Get list of unpaid credit transactions for a member
     * @param {string} anggotaId - Member ID
     * @returns {Array<UnpaidTransaction>}
     */
    getUnpaidTransactions(anggotaId): Array<UnpaidTransaction>
}
```

### POS Module Integration

```javascript
// New function in pos.js
function updateCreditInfo(): void

// Modified function in pos.js
function processPayment(): void // Add credit validation before processing
```

### UI Components

1. **Credit Info Section**
   - Displays when member is selected
   - Shows outstanding balance
   - Shows available credit
   - Shows status indicator with color coding

2. **Member Selection Dropdown**
   - Triggers credit info update on change
   - Existing component, add event listener

3. **Payment Processing**
   - Validates credit before processing bon transactions
   - Shows error message if limit exceeded
   - Existing component, add validation logic

## Data Models

### Transaction (Existing)

```javascript
{
    id: string,                    // Unique transaction ID
    noTransaksi: string,           // Human-readable transaction number
    tanggal: string (ISO8601),     // Transaction timestamp
    kasir: string,                 // Cashier name
    anggotaId: string | null,      // Member ID (null for cash customers)
    tipeAnggota: string,           // Member type
    metode: 'cash' | 'bon',        // Payment method
    items: Array<CartItem>,        // Transaction items
    total: number,                 // Total transaction amount
    uangBayar: number,             // Amount paid (for cash)
    kembalian: number,             // Change (for cash)
    status: 'lunas' | 'kredit'     // Payment status
}
```

### Member (Existing)

```javascript
{
    id: string,                    // Unique member ID
    nama: string,                  // Member name
    nik: string,                   // Member NIK
    tipeAnggota: string,           // Member type (e.g., 'Umum', 'Tetap')
    status: string                 // Member status (e.g., 'Aktif')
}
```

### ValidationResult (New)

```javascript
{
    valid: boolean,                // Whether transaction can proceed
    message: string,               // User-friendly message
    details: {
        outstandingBalance: number,
        transactionAmount: number,
        totalExposure: number,
        creditLimit: number,
        exceededBy?: number,       // Only if invalid
        remainingCredit?: number   // Only if valid
    }
}
```

### CreditStatus (New)

```javascript
{
    status: 'safe' | 'warning' | 'critical',
    color: string,                 // CSS color for text
    bgColor: string,               // CSS color for background
    icon: string,                  // Bootstrap icon class
    percentage: number,            // Credit usage percentage
    message: string                // Status message
}
```

### UnpaidTransaction (New)

```javascript
{
    id: string,
    noTransaksi: string,
    tanggal: string (ISO8601),
    total: number,
    kasir: string
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Outstanding balance calculation correctness

*For any* member and any set of transactions, the calculated outstanding balance should equal the sum of all unpaid credit transactions (where metode='bon' and status='kredit') for that member.

**Validates: Requirements 1.1**

### Property 2: Total exposure calculation correctness

*For any* member with an outstanding balance and any new transaction amount, the total exposure should equal the outstanding balance plus the new transaction amount.

**Validates: Requirements 2.1**

### Property 3: Transactions exceeding limit are rejected

*For any* member and transaction amount where the total exposure (outstanding balance + transaction amount) exceeds Rp 2.000.000, the validation should return valid=false.

**Validates: Requirements 2.2**

### Property 4: Rejection includes required information

*For any* rejected transaction, the validation result should contain the outstanding balance, transaction amount, total exposure, credit limit, and exceeded amount in the details object.

**Validates: Requirements 2.4**

### Property 5: Transactions at or below limit are accepted

*For any* member and transaction amount where the total exposure (outstanding balance + transaction amount) is less than or equal to Rp 2.000.000, the validation should return valid=true.

**Validates: Requirements 2.5**

### Property 6: Cash transactions bypass validation

*For any* member regardless of outstanding balance, cash transactions should not be subject to credit limit validation in the credit limit module (validation is handled at POS level).

**Validates: Requirements 3.1**

### Property 7: Only unpaid credit transactions are counted

*For any* member with a mix of transaction statuses, the outstanding balance calculation should only include transactions where metode='bon' AND status='kredit', excluding all transactions with status='lunas'.

**Validates: Requirements 4.2**

### Property 8: Available credit calculation correctness

*For any* member, the available credit should equal Rp 2.000.000 minus the outstanding balance, with a minimum value of 0 (never negative).

**Validates: Requirements 5.2**

### Property 9: Unpaid transactions list completeness

*For any* member, the list of unpaid transactions should contain all and only transactions where anggotaId matches the member AND metode='bon' AND status='kredit'.

**Validates: Requirements 5.3**

## Error Handling

### Input Validation

1. **Missing Member ID**
   - Scenario: anggotaId is null, undefined, or empty string
   - Response: Return validation failure with message "Pilih anggota untuk transaksi kredit"
   - Applies to: validateCreditTransaction()

2. **Invalid Transaction Amount**
   - Scenario: transactionAmount is null, undefined, zero, or negative
   - Response: Return validation failure with message "Jumlah transaksi tidak valid"
   - Applies to: validateCreditTransaction()

3. **Missing Member ID for Queries**
   - Scenario: anggotaId is null, undefined, or empty string
   - Response: Return 0 for balance calculations, empty array for transaction lists
   - Applies to: calculateOutstandingBalance(), getUnpaidTransactions()

### Data Layer Errors

1. **localStorage Access Failure**
   - Scenario: localStorage.getItem() throws exception
   - Response: Catch exception, log error, return safe default (0 for numbers, [] for arrays)
   - Applies to: All methods that read from localStorage

2. **JSON Parse Failure**
   - Scenario: JSON.parse() throws exception due to corrupted data
   - Response: Catch exception, log error, return safe default (empty array)
   - Applies to: All methods that parse localStorage data

3. **Missing Data Collections**
   - Scenario: 'penjualan' or 'anggota' not found in localStorage
   - Response: Treat as empty array, continue processing
   - Applies to: All methods that read collections

### Business Logic Errors

1. **Negative Outstanding Balance**
   - Scenario: Calculation results in negative value (data inconsistency)
   - Response: Return 0 instead of negative value
   - Applies to: calculateOutstandingBalance()

2. **Negative Available Credit**
   - Scenario: Outstanding balance exceeds credit limit
   - Response: Return 0 instead of negative value (Math.max(0, result))
   - Applies to: getAvailableCredit()

### Error Response Format

All validation methods return structured error information:

```javascript
{
    valid: false,
    message: "User-friendly error message in Indonesian",
    details: {
        // Relevant context for debugging
    }
}
```

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

1. **Edge Cases**
   - Member with no transactions (outstanding balance = 0)
   - Member with only cash transactions (outstanding balance = 0)
   - Member with only paid transactions (outstanding balance = 0)
   - Transaction exactly at limit (Rp 2.000.000)
   - Transaction at Rp 0
   - Empty member ID
   - Invalid transaction amounts (negative, zero, null)

2. **Boundary Conditions**
   - Outstanding balance = Rp 1.999.999, transaction = Rp 1 (should pass)
   - Outstanding balance = Rp 2.000.000, transaction = Rp 1 (should fail)
   - Outstanding balance = Rp 0, transaction = Rp 2.000.000 (should pass)
   - Outstanding balance = Rp 0, transaction = Rp 2.000.001 (should fail)

3. **Error Handling**
   - Corrupted localStorage data
   - Missing localStorage data
   - Invalid input types

### Property-Based Testing

Property-based tests will verify universal properties across many randomly generated inputs using **fast-check** library for JavaScript.

**Configuration:**
- Minimum 100 iterations per property test
- Use fast-check's built-in generators for primitives
- Create custom generators for domain objects (members, transactions)

**Test Tagging:**
Each property-based test must include a comment with this format:
```javascript
// Feature: batas-kredit-pos, Property X: [property description]
```

**Property Test Implementation:**

1. **Property 1: Outstanding balance calculation**
   - Generate: Random member ID, random array of transactions with mixed statuses and methods
   - Verify: Calculated balance equals manual sum of unpaid credit transactions
   - Tag: `Feature: batas-kredit-pos, Property 1: Outstanding balance calculation correctness`

2. **Property 2: Total exposure calculation**
   - Generate: Random outstanding balance, random transaction amount
   - Verify: Total exposure = outstanding + transaction
   - Tag: `Feature: batas-kredit-pos, Property 2: Total exposure calculation correctness`

3. **Property 3: Rejection above limit**
   - Generate: Random member, random transaction where total > 2000000
   - Verify: validation.valid === false
   - Tag: `Feature: batas-kredit-pos, Property 3: Transactions exceeding limit are rejected`

4. **Property 4: Rejection details**
   - Generate: Random member, random transaction where total > 2000000
   - Verify: validation.details contains all required fields
   - Tag: `Feature: batas-kredit-pos, Property 4: Rejection includes required information`

5. **Property 5: Acceptance at or below limit**
   - Generate: Random member, random transaction where total <= 2000000
   - Verify: validation.valid === true
   - Tag: `Feature: batas-kredit-pos, Property 5: Transactions at or below limit are accepted`

6. **Property 6: Cash bypass** (Note: This is handled at POS level, not in credit module)
   - This property is validated through integration testing in the POS module
   - Tag: N/A (integration test)

7. **Property 7: Only unpaid counted**
   - Generate: Random member, random transactions with mixed statuses
   - Verify: Only status='kredit' AND metode='bon' are counted
   - Tag: `Feature: batas-kredit-pos, Property 7: Only unpaid credit transactions are counted`

8. **Property 8: Available credit calculation**
   - Generate: Random member with random outstanding balance
   - Verify: available = max(0, 2000000 - outstanding)
   - Tag: `Feature: batas-kredit-pos, Property 8: Available credit calculation correctness`

9. **Property 9: Unpaid list completeness**
   - Generate: Random member, random transactions
   - Verify: Returned list contains all and only unpaid credit transactions for that member
   - Tag: `Feature: batas-kredit-pos, Property 9: Unpaid transactions list completeness`

**Custom Generators:**

```javascript
// Generator for transaction objects
const transactionGenerator = fc.record({
    id: fc.uuid(),
    anggotaId: fc.uuid(),
    metode: fc.constantFrom('cash', 'bon'),
    status: fc.constantFrom('lunas', 'kredit'),
    total: fc.integer({ min: 1000, max: 5000000 }),
    tanggal: fc.date().map(d => d.toISOString())
});

// Generator for member IDs
const memberIdGenerator = fc.uuid();

// Generator for transaction amounts
const amountGenerator = fc.integer({ min: 1000, max: 3000000 });
```

### Integration Testing

Integration tests will verify the interaction between CreditLimitValidator and POS module:

1. **POS Integration**
   - Test credit info display updates when member is selected
   - Test validation is called during bon payment processing
   - Test error messages are displayed correctly
   - Test cash transactions bypass validation

2. **Data Persistence**
   - Test that calculations use actual localStorage data
   - Test that multiple transactions accumulate correctly
   - Test that status changes affect outstanding balance

### Manual Testing

Manual testing checklist for QA:

1. Select member → Verify credit info appears
2. Member with no transactions → Verify Rp 2.000.000 available
3. Add items, select bon → Verify validation occurs
4. Transaction below limit → Verify success
5. Transaction above limit → Verify rejection with clear message
6. Transaction exactly at limit → Verify success
7. Cash transaction with high outstanding → Verify success (bypass)
8. Visual indicators: green (<80%), yellow (80-94%), red (≥95%)

## Implementation Notes

### Technology Stack

- **Language**: JavaScript (ES6+)
- **Storage**: localStorage (browser-based)
- **UI Framework**: Bootstrap 5
- **Icons**: Bootstrap Icons
- **Testing**: Jest + fast-check

### Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- IE11: Not supported (ES6 features required)

### Performance Considerations

1. **Calculation Efficiency**
   - Outstanding balance calculation is O(n) where n = number of transactions
   - Expected to be < 10ms for typical datasets (< 1000 transactions)
   - No caching implemented (calculations are fast enough)

2. **UI Updates**
   - Credit info updates on member selection (event-driven)
   - No polling or continuous updates
   - Minimal DOM manipulation

3. **Memory Usage**
   - Singleton pattern for validator (one instance)
   - No data caching in memory
   - Reads from localStorage on demand

### Security Considerations

1. **Client-Side Validation**
   - All validation occurs in browser
   - No server-side enforcement (suitable for single-user desktop app)
   - Data stored in localStorage (not encrypted)

2. **Input Sanitization**
   - All inputs validated for type and range
   - No SQL injection risk (no database)
   - No XSS risk (no user-generated HTML)

### Deployment

- No build step required (vanilla JavaScript)
- No external dependencies
- No API endpoints
- Files to deploy:
  - js/creditLimit.js (new)
  - js/pos.js (modified)
  - index.html (modified to include script)

### Future Enhancements

1. **Configurable Credit Limits**
   - Allow different limits per member type
   - Admin UI to set custom limits

2. **Payment Processing**
   - UI for recording partial payments
   - Automatic status updates

3. **Credit Reports**
   - Member credit usage analytics
   - Overdue payment tracking

4. **Notifications**
   - Alert when approaching limit
   - Reminder for overdue payments

5. **Credit History**
   - Track payment behavior over time
   - Credit score calculation
