# Design Document

## Overview

Dokumen ini menjelaskan desain untuk mengintegrasikan semua menu di Aplikasi Koperasi Karyawan dengan sistem akuntansi double-entry. Sistem saat ini sudah memiliki berbagai fitur (POS, Simpanan, Pinjaman, Inventory, dll) namun belum semua transaksi tercatat dengan benar dalam jurnal akuntansi. Integrasi ini akan memastikan setiap transaksi dari menu manapun akan otomatis membuat jurnal entry yang sesuai, sehingga laporan keuangan selalu akurat dan balance.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                     │
│  (Dashboard, POS, Simpanan, Pinjaman, Inventory, Reports)   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  Business Logic Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Transaction  │  │  Validation  │  │   Reporting  │     │
│  │   Manager    │  │   Service    │  │   Service    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  Accounting Engine                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Journal    │  │     COA      │  │   Balance    │     │
│  │   Service    │  │   Manager    │  │  Validator   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   Data Storage Layer                         │
│              (LocalStorage - Browser)                        │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
User Action (e.g., Penjualan POS)
    │
    ▼
Transaction Manager
    │
    ├──> Validation Service (Validate input)
    │
    ├──> Update Business Data (penjualan, stok)
    │
    ├──> Journal Service (Create journal entries)
    │    │
    │    ├──> Balance Validator (Check debit = kredit)
    │    │
    │    └──> COA Manager (Update account balances)
    │
    └──> Audit Trail (Log transaction)
```

## Components and Interfaces

### 1. Journal Service

**Responsibility**: Mengelola pembuatan dan pengelolaan jurnal entry

**Interface**:
```javascript
class JournalService {
    /**
     * Create journal entry with validation
     * @param {string} description - Transaction description
     * @param {Array} entries - Array of {akun, debit, kredit}
     * @param {string} tanggal - Transaction date (ISO format)
     * @param {Object} metadata - Additional metadata (transactionId, type, etc)
     * @returns {Object} {success: boolean, journalId: string, errors: Array}
     */
    createJournal(description, entries, tanggal, metadata)
    
    /**
     * Create reversal journal entry
     * @param {string} originalJournalId - ID of journal to reverse
     * @param {string} reason - Reason for reversal
     * @returns {Object} {success: boolean, reversalJournalId: string}
     */
    createReversalJournal(originalJournalId, reason)
    
    /**
     * Get journal entries by filter
     * @param {Object} filter - {startDate, endDate, type, accountCode}
     * @returns {Array} Filtered journal entries
     */
    getJournals(filter)
    
    /**
     * Validate journal balance
     * @param {Array} entries - Journal entries
     * @returns {boolean} True if balanced
     */
    validateBalance(entries)
}
```

### 2. Transaction Manager

**Responsibility**: Mengkoordinasikan transaksi bisnis dengan jurnal akuntansi

**Interface**:
```javascript
class TransactionManager {
    /**
     * Process POS transaction
     * @param {Object} transaction - Transaction data
     * @returns {Object} {success: boolean, transactionId: string, journals: Array}
     */
    processPOSTransaction(transaction)
    
    /**
     * Process simpanan transaction
     * @param {Object} transaction - Simpanan data
     * @param {string} type - 'pokok'|'wajib'|'sukarela'
     * @param {string} action - 'setor'|'tarik'
     * @returns {Object} {success: boolean, transactionId: string, journalId: string}
     */
    processSimpananTransaction(transaction, type, action)
    
    /**
     * Process pinjaman transaction
     * @param {Object} transaction - Pinjaman data
     * @param {string} action - 'pencairan'|'angsuran'
     * @returns {Object} {success: boolean, transactionId: string, journalId: string}
     */
    processPinjamanTransaction(transaction, action)
    
    /**
     * Process pembelian transaction
     * @param {Object} transaction - Pembelian data
     * @returns {Object} {success: boolean, transactionId: string, journalId: string}
     */
    processPembelianTransaction(transaction)
    
    /**
     * Delete transaction with reversal
     * @param {string} transactionId - Transaction ID
     * @param {string} type - Transaction type
     * @param {string} reason - Deletion reason
     * @returns {Object} {success: boolean, reversalJournalId: string}
     */
    deleteTransaction(transactionId, type, reason)
}
```

### 3. COA Manager

**Responsibility**: Mengelola Chart of Accounts dan saldo akun

**Interface**:
```javascript
class COAManager {
    /**
     * Update account balance
     * @param {string} accountCode - Account code
     * @param {number} debit - Debit amount
     * @param {number} kredit - Kredit amount
     * @returns {Object} {success: boolean, newBalance: number}
     */
    updateBalance(accountCode, debit, kredit)
    
    /**
     * Get account balance
     * @param {string} accountCode - Account code
     * @returns {number} Current balance
     */
    getBalance(accountCode)
    
    /**
     * Get accounts by type
     * @param {string} type - 'Aset'|'Kewajiban'|'Modal'|'Pendapatan'|'Beban'
     * @returns {Array} Accounts of specified type
     */
    getAccountsByType(type)
    
    /**
     * Validate accounting equation
     * @returns {Object} {balanced: boolean, aset: number, kewajiban: number, modal: number}
     */
    validateAccountingEquation()
}
```

### 4. Balance Validator

**Responsibility**: Memvalidasi keseimbangan jurnal dan persamaan akuntansi

**Interface**:
```javascript
class BalanceValidator {
    /**
     * Validate journal entry balance
     * @param {Array} entries - Journal entries
     * @returns {Object} {valid: boolean, totalDebit: number, totalKredit: number, difference: number}
     */
    validateJournalBalance(entries)
    
    /**
     * Validate accounting equation (Aset = Kewajiban + Modal)
     * @returns {Object} {valid: boolean, aset: number, kewajiban: number, modal: number, difference: number}
     */
    validateAccountingEquation()
    
    /**
     * Check if account balance would go negative
     * @param {string} accountCode - Account code
     * @param {number} amount - Amount to deduct
     * @returns {boolean} True if balance would be valid
     */
    checkNegativeBalance(accountCode, amount)
}
```

### 5. Audit Trail Service

**Responsibility**: Mencatat semua aktivitas untuk audit

**Interface**:
```javascript
class AuditTrailService {
    /**
     * Log transaction activity
     * @param {Object} activity - Activity data
     * @returns {string} Activity log ID
     */
    logActivity(activity)
    
    /**
     * Get audit trail by filter
     * @param {Object} filter - {startDate, endDate, user, type}
     * @returns {Array} Audit trail entries
     */
    getAuditTrail(filter)
}
```

## Data Models

### Journal Entry Model
```javascript
{
    id: string,                    // Unique ID
    tanggal: string,              // ISO date
    keterangan: string,           // Description
    entries: [                    // Journal entries
        {
            akun: string,         // Account code
            debit: number,        // Debit amount
            kredit: number        // Kredit amount
        }
    ],
    metadata: {
        transactionId: string,    // Reference to source transaction
        transactionType: string,  // 'POS', 'Simpanan', 'Pinjaman', etc
        userId: string,           // User who created
        isReversal: boolean,      // Is this a reversal entry
        originalJournalId: string // If reversal, ID of original
    },
    createdAt: string,            // ISO timestamp
    createdBy: string             // User name
}
```

### Transaction Metadata Model
```javascript
{
    transactionId: string,        // Unique transaction ID
    transactionType: string,      // Type of transaction
    journalIds: Array<string>,    // Associated journal IDs
    status: string,               // 'active', 'deleted', 'reversed'
    createdAt: string,
    createdBy: string,
    deletedAt: string,            // If deleted
    deletedBy: string,            // Who deleted
    deletionReason: string        // Why deleted
}
```

### COA Account Model
```javascript
{
    kode: string,                 // Account code (e.g., '1-1000')
    nama: string,                 // Account name
    tipe: string,                 // 'Aset', 'Kewajiban', 'Modal', 'Pendapatan', 'Beban'
    saldo: number,                // Current balance
    normalBalance: string,        // 'debit' or 'kredit'
    isActive: boolean,            // Is account active
    parentCode: string            // Parent account code (for sub-accounts)
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Journal Balance Property
*For any* journal entry created by the system, the total debit amount must equal the total kredit amount.
**Validates: Requirements 8.1**

### Property 2: POS Cash Transaction Journal Property
*For any* POS cash transaction, the system must create exactly two journal entries: one for revenue (Debit Kas, Kredit Pendapatan) and one for HPP (Debit HPP, Kredit Persediaan).
**Validates: Requirements 1.1, 1.2**

### Property 3: POS Bon Transaction Journal Property
*For any* POS bon transaction, the system must create exactly two journal entries: one for revenue (Debit Piutang, Kredit Pendapatan) and one for HPP (Debit HPP, Kredit Persediaan).
**Validates: Requirements 1.3, 1.4**

### Property 4: Simpanan Pokok Journal Property
*For any* simpanan pokok transaction, the system must create a journal entry with Debit Kas and Kredit Simpanan Pokok with equal amounts.
**Validates: Requirements 2.1**

### Property 5: Simpanan Wajib Journal Property
*For any* simpanan wajib transaction, the system must create a journal entry with Debit Kas and Kredit Simpanan Wajib with equal amounts.
**Validates: Requirements 2.2**

### Property 6: Simpanan Sukarela Setor Journal Property
*For any* simpanan sukarela setoran, the system must create a journal entry with Debit Kas and Kredit Simpanan Sukarela with equal amounts.
**Validates: Requirements 2.3**

### Property 7: Simpanan Sukarela Tarik Journal Property
*For any* simpanan sukarela penarikan, the system must create a journal entry with Debit Simpanan Sukarela and Kredit Kas with equal amounts.
**Validates: Requirements 2.4**

### Property 8: Reversal Journal Property
*For any* deleted transaction, the system must create a reversal journal entry where all debits become kredits and all kredits become debits with the same amounts.
**Validates: Requirements 2.5, 10.1, 10.2, 10.3**

### Property 9: Pinjaman Pencairan Journal Property
*For any* pinjaman pencairan, the system must create a journal entry with Debit Piutang Pinjaman and Kredit Kas with equal amounts.
**Validates: Requirements 3.1**

### Property 10: Pinjaman Angsuran Pokok Journal Property
*For any* pinjaman angsuran payment, the system must create a journal entry for pokok with Debit Kas and Kredit Piutang Pinjaman.
**Validates: Requirements 3.2**

### Property 11: Pinjaman Angsuran Bunga Journal Property
*For any* pinjaman angsuran payment with bunga, the system must create a journal entry for bunga with Debit Kas and Kredit Pendapatan Bunga.
**Validates: Requirements 3.3**

### Property 12: Pembelian Cash Journal Property
*For any* pembelian cash transaction, the system must create a journal entry with Debit Persediaan Barang and Kredit Kas with equal amounts.
**Validates: Requirements 4.1**

### Property 13: Pembelian Kredit Journal Property
*For any* pembelian kredit transaction, the system must create a journal entry with Debit Persediaan Barang and Kredit Hutang Supplier with equal amounts.
**Validates: Requirements 4.2**

### Property 14: Modal Awal Journal Property
*For any* modal awal input, the system must create a journal entry with Debit Kas and Kredit Modal Koperasi with equal amounts.
**Validates: Requirements 5.1**

### Property 15: Saldo Awal Balance Property
*For any* saldo awal periode input, the total debit of all accounts must equal the total kredit of all accounts.
**Validates: Requirements 6.2**

### Property 16: Journal Metadata Property
*For any* automatically created journal entry, it must include transactionId, transactionType, and timestamp in metadata.
**Validates: Requirements 7.1, 7.2, 7.3**

### Property 17: Accounting Equation Property
*For any* state of the system, the accounting equation (Aset = Kewajiban + Modal) must hold true within a tolerance of 0.01.
**Validates: Requirements 8.3**

### Property 18: Negative Balance Prevention Property
*For any* transaction that would cause an account balance to become negative (except for specific accounts like Piutang), the system must reject the transaction.
**Validates: Requirements 10.5**

### Property 19: Laporan Laba Rugi Calculation Property
*For any* Laporan Laba Rugi, the laba bersih must equal total pendapatan minus total beban.
**Validates: Requirements 9.3**

### Property 20: Buku Besar Running Balance Property
*For any* account in Buku Besar, the running balance after each transaction must be correctly calculated based on account type and normal balance.
**Validates: Requirements 9.5**

## Error Handling

### Error Types

1. **Validation Errors**
   - Invalid journal entry (debit ≠ kredit)
   - Missing required fields
   - Invalid account codes
   - Negative balance violations

2. **Business Logic Errors**
   - Insufficient stock
   - Insufficient balance for withdrawal
   - Duplicate transaction IDs
   - Invalid transaction state

3. **Data Integrity Errors**
   - Accounting equation not balanced
   - Orphaned journal entries
   - Missing transaction references

### Error Handling Strategy

```javascript
try {
    // Validate input
    const validation = validateTransaction(transaction);
    if (!validation.valid) {
        return {
            success: false,
            errors: validation.errors,
            code: 'VALIDATION_ERROR'
        };
    }
    
    // Begin transaction (atomic operation)
    const result = processTransaction(transaction);
    
    // Validate accounting balance
    const balanceCheck = validateAccountingEquation();
    if (!balanceCheck.balanced) {
        // Rollback transaction
        rollbackTransaction(result.transactionId);
        return {
            success: false,
            errors: ['Accounting equation not balanced'],
            code: 'BALANCE_ERROR'
        };
    }
    
    return {
        success: true,
        data: result
    };
    
} catch (error) {
    // Log error for debugging
    console.error('Transaction error:', error);
    
    // Attempt rollback
    if (result && result.transactionId) {
        rollbackTransaction(result.transactionId);
    }
    
    return {
        success: false,
        errors: [error.message],
        code: 'SYSTEM_ERROR'
    };
}
```

## Testing Strategy

### Unit Testing

Unit tests akan fokus pada:
- Validasi input untuk setiap fungsi
- Perhitungan matematis (balance, totals)
- Format data output
- Error handling untuk edge cases

**Example Unit Tests**:
```javascript
// Test journal balance validation
test('validateJournalBalance returns true for balanced entries', () => {
    const entries = [
        { akun: '1-1000', debit: 100000, kredit: 0 },
        { akun: '4-1000', debit: 0, kredit: 100000 }
    ];
    expect(validateJournalBalance(entries)).toBe(true);
});

// Test negative balance prevention
test('withdrawal rejected when balance insufficient', () => {
    const result = processSimpananTransaction({
        type: 'sukarela',
        action: 'tarik',
        amount: 1000000,
        anggotaId: 'A001'
    });
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Saldo tidak mencukupi');
});
```

### Property-Based Testing

Property-based tests akan menggunakan **fast-check** library untuk JavaScript. Setiap correctness property akan diimplementasikan sebagai property-based test dengan minimum 100 iterations.

**Property Testing Framework**: fast-check (https://github.com/dubzzz/fast-check)

**Example Property Tests**:
```javascript
const fc = require('fast-check');

// Property 1: Journal Balance Property
test('Property 1: All journal entries must be balanced', () => {
    fc.assert(
        fc.property(
            fc.array(fc.record({
                akun: fc.string(),
                debit: fc.nat(),
                kredit: fc.nat()
            }), { minLength: 2 }),
            (entries) => {
                // Ensure entries are balanced
                const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
                const totalKredit = entries.reduce((sum, e) => sum + e.kredit, 0);
                
                if (totalDebit !== totalKredit) {
                    return true; // Skip unbalanced test data
                }
                
                const result = journalService.createJournal('Test', entries, new Date().toISOString(), {});
                return result.success === true;
            }
        ),
        { numRuns: 100 }
    );
});

// Property 2: POS Cash Transaction Journal Property
test('Property 2: POS cash creates two journal entries', () => {
    fc.assert(
        fc.property(
            fc.record({
                items: fc.array(fc.record({
                    id: fc.string(),
                    qty: fc.integer({ min: 1, max: 10 }),
                    harga: fc.integer({ min: 1000, max: 100000 }),
                    hpp: fc.integer({ min: 500, max: 50000 })
                }), { minLength: 1 }),
                metode: fc.constant('cash')
            }),
            (transaction) => {
                const result = transactionManager.processPOSTransaction(transaction);
                
                if (!result.success) return true; // Skip failed transactions
                
                // Should create exactly 2 journal entries
                return result.journals.length === 2;
            }
        ),
        { numRuns: 100 }
    );
});
```

### Integration Testing

Integration tests akan menguji:
- End-to-end transaction flows
- Multiple transactions in sequence
- Rollback scenarios
- Data consistency across modules

**Example Integration Tests**:
```javascript
test('Complete POS transaction flow updates all related data', async () => {
    // Setup
    const initialKas = getAccountBalance('1-1000');
    const initialStok = getBarangStok('B001');
    
    // Execute
    const transaction = {
        items: [{ id: 'B001', qty: 2, harga: 10000, hpp: 5000 }],
        metode: 'cash',
        total: 20000
    };
    
    const result = await processPOSTransaction(transaction);
    
    // Verify
    expect(result.success).toBe(true);
    expect(getAccountBalance('1-1000')).toBe(initialKas + 20000);
    expect(getBarangStok('B001')).toBe(initialStok - 2);
    expect(getJournalCount()).toBeGreaterThan(0);
});
```

### Test Coverage Goals

- Unit Test Coverage: > 80%
- Property Test Coverage: 100% of correctness properties
- Integration Test Coverage: All critical user flows
- Edge Case Coverage: All identified edge cases

## Implementation Notes

### Phase 1: Core Accounting Engine
1. Implement JournalService with validation
2. Implement COAManager
3. Implement BalanceValidator
4. Add comprehensive unit tests

### Phase 2: Transaction Integration
1. Refactor existing transaction functions to use TransactionManager
2. Integrate POS transactions
3. Integrate Simpanan transactions
4. Integrate Pinjaman transactions
5. Integrate Pembelian transactions
6. Add property-based tests for each integration

### Phase 3: Audit and Reporting
1. Implement AuditTrailService
2. Enhance reporting functions to use new accounting data
3. Add transaction deletion with reversal
4. Add integration tests

### Phase 4: Saldo Awal and Modal
1. Implement saldo awal periode functionality
2. Integrate modal awal with journal
3. Add validation for accounting equation
4. Add final integration tests

### Migration Strategy

Existing data will need to be migrated:
1. Analyze existing transactions without journal entries
2. Create migration script to generate historical journals
3. Validate migrated data
4. Provide rollback mechanism

### Performance Considerations

- LocalStorage has size limits (~5-10MB depending on browser)
- Implement data pagination for large datasets
- Consider archiving old transactions
- Optimize journal queries with indexing strategy
- Batch journal creation for bulk operations

### Browser Compatibility

- Target modern browsers (Chrome, Firefox, Edge, Safari)
- Use ES6+ features with appropriate polyfills if needed
- Test LocalStorage availability and quota
- Handle storage quota exceeded errors gracefully
