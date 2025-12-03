# Design Document - Hapus Data Jurnal

## Overview

Fitur hapus data jurnal memungkinkan super admin untuk menghapus entri jurnal akuntansi (jurnal umum, jurnal kas, jurnal pembelian) dengan validasi ketat dan audit trail lengkap. Sistem ini dirancang untuk menjaga integritas data akuntansi sambil memberikan fleksibilitas untuk koreksi kesalahan.

Fitur ini mengadopsi arsitektur yang sama dengan fitur hapus transaksi existing, dengan penambahan validasi khusus untuk data jurnal dan penyesuaian saldo akun.

## Architecture

### Layered Architecture

```
┌─────────────────────────────────────────┐
│         UI Layer (Presentation)         │
│  - Filter Panel                         │
│  - Journal Table                        │
│  - Confirmation Dialogs                 │
│  - Impact Preview                       │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      Service Layer (Business Logic)     │
│  - JournalDeletionService               │
│  - ValidationService                    │
│  - BalanceAdjustmentService             │
│  - AuditLoggerService                   │
│  - ImpactAnalysisService                │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│    Repository Layer (Data Access)       │
│  - JournalRepository                    │
│  - COARepository                        │
│  - AuditLogRepository                   │
│  - PeriodRepository                     │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         localStorage (Storage)          │
│  - jurnal                               │
│  - coa                                  │
│  - journalDeletionLog                   │
│  - accountingPeriods                    │
└─────────────────────────────────────────┘
```

### Security Architecture

```
┌──────────────────────────────────────────┐
│         Authentication Layer             │
│  - Role Validation (Super Admin Only)   │
│  - Session Verification                  │
└──────────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────────┐
│         Authorization Layer              │
│  - Permission Check                      │
│  - Period Status Check                   │
│  - Reference Validation                  │
└──────────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────────┐
│         Confirmation Layer               │
│  - First Confirmation (Detail Review)    │
│  - Second Confirmation (Impact Warning)  │
│  - Reason Input (Mandatory)              │
└──────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Repository Classes

#### JournalRepository
```javascript
class JournalRepository {
    getAll(): Array<Journal>
    getById(id: string): Journal | null
    getByType(type: string): Array<Journal>
    filter(filters: FilterCriteria): Array<Journal>
    delete(id: string): boolean
    hasReferences(id: string): boolean
}
```

#### COARepository
```javascript
class COARepository {
    getAll(): Array<Account>
    getByCode(code: string): Account | null
    updateBalance(code: string, amount: number, type: string): boolean
    getAffectedAccounts(journalId: string): Array<Account>
}
```

#### AuditLogRepository
```javascript
class AuditLogRepository {
    save(log: DeletionLog): string
    getAll(): Array<DeletionLog>
    getByJournalId(journalId: string): DeletionLog | null
    getByDateRange(start: Date, end: Date): Array<DeletionLog>
}
```

#### PeriodRepository
```javascript
class PeriodRepository {
    getCurrentPeriod(): Period | null
    isPeriodClosed(date: Date): boolean
    getByDate(date: Date): Period | null
}
```

### 2. Service Classes

#### JournalDeletionService
```javascript
class JournalDeletionService {
    deleteJournal(journalId: string, reason: string, deletedBy: string): DeletionResult
    // Orchestrates the entire deletion process
}
```

#### ValidationService
```javascript
class ValidationService {
    validateDeletion(journalId: string): ValidationResult
    validateReason(reason: string): ValidationResult
    validatePeriodStatus(journalDate: Date): ValidationResult
    checkReferences(journalId: string): ReferenceCheckResult
}
```

#### BalanceAdjustmentService
```javascript
class BalanceAdjustmentService {
    adjustBalances(journal: Journal): AdjustmentResult
    reverseJournalEntries(journal: Journal): Array<Entry>
    validateBalanceConsistency(): ConsistencyResult
}
```

#### ImpactAnalysisService
```javascript
class ImpactAnalysisService {
    analyzeImpact(journalId: string): ImpactAnalysis
    getAffectedAccounts(journalId: string): Array<AccountImpact>
    calculateBalanceChanges(journalId: string): BalanceChanges
    getRelatedTransactions(journalId: string): Array<Transaction>
}
```

#### AuditLoggerService
```javascript
class AuditLoggerService {
    logDeletion(journal: Journal, reason: string, deletedBy: string, impact: ImpactAnalysis): string
    getDeletionHistory(): Array<DeletionLog>
    exportLog(auditId: string): ExportData
}
```

### 3. UI Components

#### FilterPanel
- Search by journal number, description
- Filter by journal type (umum, kas, pembelian)
- Filter by date range
- Filter by account code
- Reset filters button

#### JournalTable
- Display filtered journals
- Show journal details (date, number, description, total debit/credit)
- Action buttons (View Detail, Delete)
- Pagination support
- Sort by date, number, amount

#### ConfirmationDialog
- First confirmation: Show journal details
- Second confirmation: Show impact analysis
- Reason input field (mandatory)
- Cancel and Confirm buttons

#### ImpactPreviewModal
- Before/after balance comparison
- List of affected accounts
- Related transactions warning
- Balance consistency check

## Data Models

### Journal
```javascript
{
    id: string,                    // Unique identifier
    tanggal: string,               // ISO date string
    nomorJurnal: string,           // Journal number (auto-generated)
    tipe: string,                  // 'umum' | 'kas' | 'pembelian'
    keterangan: string,            // Description
    entries: Array<JournalEntry>,  // Journal entries (debit/credit)
    totalDebit: number,            // Total debit amount
    totalKredit: number,           // Total credit amount
    createdBy: string,             // Username who created
    createdAt: string,             // ISO timestamp
    referensi: {                   // Optional reference to source transaction
        tipe: string,              // 'transaksi_pos' | 'pembelian' | 'manual'
        id: string                 // Reference ID
    } | null
}
```

### JournalEntry
```javascript
{
    akun: string,      // Account code (COA)
    namaAkun: string,  // Account name
    debit: number,     // Debit amount
    kredit: number     // Credit amount
}
```

### Account (COA)
```javascript
{
    kode: string,      // Account code
    nama: string,      // Account name
    tipe: string,      // 'Aset' | 'Kewajiban' | 'Modal' | 'Pendapatan' | 'Beban'
    saldo: number,     // Current balance
    parent: string     // Parent account code (for hierarchy)
}
```

### DeletionLog
```javascript
{
    id: string,                        // Unique audit ID
    journalId: string,                 // Deleted journal ID
    journalSnapshot: Journal,          // Complete journal data before deletion
    reason: string,                    // Deletion reason
    category: string,                  // Error category
    deletedBy: string,                 // Username
    deletedAt: string,                 // ISO timestamp
    impactAnalysis: {
        affectedAccounts: Array<{
            kode: string,
            nama: string,
            saldoBefore: number,
            saldoAfter: number,
            difference: number
        }>,
        relatedTransactions: Array<string>,
        warnings: Array<string>
    },
    balanceAdjustments: Array<{
        accountCode: string,
        accountName: string,
        adjustmentAmount: number,
        adjustmentType: string  // 'debit' | 'credit'
    }>,
    validationResults: {
        preDelete: ValidationResult,
        postDelete: ValidationResult
    },
    success: boolean,
    errors: Array<string>
}
```

### Period
```javascript
{
    id: string,           // Period ID
    nama: string,         // Period name (e.g., "Januari 2024")
    startDate: string,    // ISO date string
    endDate: string,      // ISO date string
    status: string,       // 'open' | 'closed'
    closedBy: string,     // Username who closed
    closedAt: string      // ISO timestamp
}
```

### FilterCriteria
```javascript
{
    search: string,       // Search query
    tipe: string,         // Journal type filter
    startDate: string,    // Start date (ISO)
    endDate: string,      // End date (ISO)
    accountCode: string   // Account code filter
}
```

### ValidationResult
```javascript
{
    valid: boolean,
    message: string,
    errors: Array<string>
}
```

### DeletionResult
```javascript
{
    success: boolean,
    message: string,
    auditId: string,
    warnings: Array<string>
}
```

### ImpactAnalysis
```javascript
{
    affectedAccounts: Array<AccountImpact>,
    balanceChanges: BalanceChanges,
    relatedTransactions: Array<Transaction>,
    warnings: Array<string>,
    canDelete: boolean,
    blockingReasons: Array<string>
}
```

### AccountImpact
```javascript
{
    kode: string,
    nama: string,
    tipe: string,
    saldoBefore: number,
    saldoAfter: number,
    difference: number,
    percentageChange: number
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After reviewing all testable properties from the prework analysis, I've identified several areas where properties can be consolidated to eliminate redundancy:

**Consolidation Opportunities:**
1. Properties 1.1, 2.1, 3.1 (UI display for different journal types) can be combined into one comprehensive property about journal list display
2. Properties 1.2, 2.2, 3.2 (detail display) can be combined into one property about journal detail display
3. Properties 1.3, 2.3, 3.3 (deletion with adjustments) share core deletion logic and can be unified
4. Properties 4.1, 4.2, 4.3, 4.4 (audit trail fields) can be combined into one comprehensive audit logging property
5. Properties 7.1, 7.2, 7.3 (filter availability) are redundant with 7.4 (filter functionality)
6. Properties 8.1, 8.2, 8.3, 8.4, 8.5 (impact display) can be combined into one comprehensive impact preview property
7. Properties 10.1, 10.2, 10.3 (notification display) can be combined into one notification property

**Retained Properties:**
- Core deletion and balance adjustment (consolidated from 1.3, 2.3, 3.3, 9.1, 9.2, 9.3)
- Referential integrity validation (1.5, 3.5, 5.2)
- Role-based access control (5.1)
- Period validation (5.3, 5.4)
- Double confirmation flow (6.1, 6.2, 6.3, 6.4)
- Filter and search functionality (7.4, 7.5)
- Audit trail completeness (consolidated from 4.1-4.5)
- Rollback on error (9.4)
- Data consistency validation (9.5)

This consolidation reduces redundancy while maintaining comprehensive coverage of all requirements.

### Correctness Properties

Property 1: Journal deletion with balance reversal
*For any* journal entry, when it is deleted, all affected account balances should be adjusted by reversing the original debit and credit entries, and the journal should no longer exist in storage
**Validates: Requirements 1.3, 2.3, 3.3, 9.1, 9.2, 9.3**

Property 2: Referential integrity protection
*For any* journal that has references to other transactions (POS, purchases, payments), deletion attempts should be blocked and return an error message indicating the reference
**Validates: Requirements 1.5, 3.5, 5.2**

Property 3: Role-based deletion authorization
*For any* user attempting to delete a journal, the operation should only proceed if the user has super admin role, otherwise it should be blocked with an authorization error
**Validates: Requirements 5.1**

Property 4: Closed period protection
*For any* journal in a closed accounting period, deletion attempts should be blocked and return an error message indicating the period is closed
**Validates: Requirements 5.3, 5.4**

Property 5: Comprehensive audit logging
*For any* journal deletion, an audit log entry should be created containing the complete journal snapshot, deletion timestamp, user information, reason, and impact analysis
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

Property 6: Double confirmation requirement
*For any* journal deletion attempt, the system should require two sequential confirmations before proceeding with the deletion, and cancellation at any point should abort the operation
**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

Property 7: Filter result accuracy
*For any* filter criteria applied to the journal list (date range, type, account code), all returned journals should match the specified criteria
**Validates: Requirements 7.4**

Property 8: Search result relevance
*For any* search query on journal number or description, all returned results should contain the search term in either the journal number or description field
**Validates: Requirements 7.5**

Property 9: Impact preview completeness
*For any* journal selected for deletion, the impact preview should display before/after balances for all affected accounts, list of related transactions, and any warnings about potential issues
**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

Property 10: Atomic rollback on failure
*For any* journal deletion that encounters an error during processing, all changes (balance adjustments, audit logs, related updates) should be rolled back to maintain data consistency
**Validates: Requirements 9.4**

Property 11: Post-deletion consistency validation
*For any* completed journal deletion, the system should validate that total debits equal total credits across all accounts and that no orphaned references exist
**Validates: Requirements 9.5**

Property 12: Notification accuracy
*For any* deletion operation result (success, failure, validation error), the system should display a notification with accurate status and relevant details about the operation
**Validates: Requirements 10.1, 10.2, 10.3, 10.5**

Property 13: Negative balance prevention
*For any* cash journal deletion that would result in a negative cash balance, the deletion should be blocked with a warning message
**Validates: Requirements 2.5** (Edge Case)

Property 14: Journal list display completeness
*For any* journal displayed in the list view, all required fields (date, number, description, type, total debit/credit) should be present and correctly formatted
**Validates: Requirements 1.1, 2.1, 3.1, 1.4**

Property 15: Reason validation
*For any* deletion attempt, a non-empty reason string (max 500 characters) must be provided, otherwise the deletion should be blocked
**Validates: Requirements 5.5**

## Error Handling

### Error Categories

1. **Validation Errors**
   - Invalid journal ID
   - Empty or invalid reason
   - User not authorized (not super admin)
   - Period closed
   - Journal has references
   - Would cause negative balance

2. **Data Integrity Errors**
   - Journal not found
   - Account not found
   - Inconsistent balance after deletion
   - Failed balance adjustment

3. **System Errors**
   - Storage access failure
   - Rollback failure
   - Audit log save failure

### Error Handling Strategy

```javascript
try {
    // 1. Validate user authorization
    if (!isSuperAdmin(user)) {
        throw new AuthorizationError('Hanya super admin yang dapat menghapus jurnal');
    }
    
    // 2. Validate journal exists
    const journal = journalRepo.getById(journalId);
    if (!journal) {
        throw new NotFoundError('Jurnal tidak ditemukan');
    }
    
    // 3. Validate period status
    if (isPeriodClosed(journal.tanggal)) {
        throw new ValidationError('Periode akuntansi sudah ditutup');
    }
    
    // 4. Check references
    if (hasReferences(journalId)) {
        throw new ReferenceError('Jurnal memiliki referensi ke transaksi lain');
    }
    
    // 5. Validate reason
    if (!reason || reason.trim() === '') {
        throw new ValidationError('Alasan penghapusan harus diisi');
    }
    
    // 6. Analyze impact
    const impact = impactAnalysisService.analyzeImpact(journalId);
    if (!impact.canDelete) {
        throw new ValidationError(impact.blockingReasons.join(', '));
    }
    
    // 7. Begin transaction (pseudo-transaction for localStorage)
    const snapshot = createSnapshot();
    
    try {
        // 8. Adjust balances
        balanceAdjustmentService.adjustBalances(journal);
        
        // 9. Delete journal
        journalRepo.delete(journalId);
        
        // 10. Create audit log
        auditLoggerService.logDeletion(journal, reason, user.username, impact);
        
        // 11. Validate consistency
        const consistencyCheck = balanceAdjustmentService.validateBalanceConsistency();
        if (!consistencyCheck.valid) {
            throw new IntegrityError('Validasi konsistensi gagal');
        }
        
        return {
            success: true,
            message: 'Jurnal berhasil dihapus',
            auditId: auditId
        };
        
    } catch (error) {
        // Rollback all changes
        restoreSnapshot(snapshot);
        throw error;
    }
    
} catch (error) {
    return {
        success: false,
        message: error.message,
        errorType: error.constructor.name
    };
}
```

### User-Friendly Error Messages

| Error Type | Technical Message | User Message |
|------------|------------------|--------------|
| AuthorizationError | User role is not administrator | Anda tidak memiliki akses untuk menghapus jurnal. Hubungi administrator. |
| NotFoundError | Journal with ID X not found | Jurnal tidak ditemukan. Mungkin sudah dihapus sebelumnya. |
| ValidationError | Period is closed | Periode akuntansi sudah ditutup. Jurnal tidak dapat dihapus. |
| ReferenceError | Journal has references | Jurnal memiliki referensi ke transaksi lain dan tidak dapat dihapus. |
| IntegrityError | Balance consistency check failed | Terjadi kesalahan konsistensi data. Operasi dibatalkan. |
| StorageError | Failed to access localStorage | Terjadi kesalahan sistem. Silakan coba lagi. |

## Testing Strategy

### Unit Testing

Unit tests will verify individual components and functions:

**Repository Tests:**
- JournalRepository CRUD operations
- COARepository balance updates
- AuditLogRepository save and retrieve
- PeriodRepository status checks

**Service Tests:**
- ValidationService authorization and validation logic
- BalanceAdjustmentService balance calculation
- ImpactAnalysisService impact calculation
- AuditLoggerService log formatting

**UI Component Tests:**
- FilterPanel filter state management
- JournalTable rendering and sorting
- ConfirmationDialog user interaction flow
- ImpactPreviewModal data display

### Property-Based Testing

Property-based tests will use **fast-check** library for JavaScript to verify universal properties across randomly generated inputs. Each test will run a minimum of 100 iterations.

**Test Configuration:**
```javascript
import fc from 'fast-check';

// Configure to run 100 iterations per property
const testConfig = { numRuns: 100 };
```

**Property Test Examples:**

1. **Balance Reversal Property (Property 1)**
```javascript
// Feature: hapus-data-jurnal, Property 1: Journal deletion with balance reversal
fc.assert(
    fc.property(
        journalArbitrary(),
        (journal) => {
            // Setup: Create journal and record initial balances
            const initialBalances = getAccountBalances(journal.entries);
            journalRepo.save(journal);
            
            // Action: Delete journal
            const result = deletionService.deleteJournal(journal.id, 'test', 'admin');
            
            // Verify: Journal deleted and balances reversed
            const journalExists = journalRepo.getById(journal.id) !== null;
            const finalBalances = getAccountBalances(journal.entries);
            const balancesReversed = checkBalancesReversed(initialBalances, finalBalances, journal.entries);
            
            return !journalExists && balancesReversed;
        }
    ),
    testConfig
);
```

2. **Referential Integrity Property (Property 2)**
```javascript
// Feature: hapus-data-jurnal, Property 2: Referential integrity protection
fc.assert(
    fc.property(
        journalWithReferenceArbitrary(),
        (journal) => {
            // Setup: Create journal with reference
            journalRepo.save(journal);
            
            // Action: Attempt to delete
            const result = deletionService.deleteJournal(journal.id, 'test', 'admin');
            
            // Verify: Deletion blocked
            const journalStillExists = journalRepo.getById(journal.id) !== null;
            const errorIndicatesReference = result.message.includes('referensi');
            
            return !result.success && journalStillExists && errorIndicatesReference;
        }
    ),
    testConfig
);
```

3. **Role Authorization Property (Property 3)**
```javascript
// Feature: hapus-data-jurnal, Property 3: Role-based deletion authorization
fc.assert(
    fc.property(
        journalArbitrary(),
        userArbitrary(),
        (journal, user) => {
            // Setup
            journalRepo.save(journal);
            
            // Action: Attempt deletion
            const result = deletionService.deleteJournal(journal.id, 'test', user.username);
            
            // Verify: Success only if super admin
            const isSuperAdmin = user.role === 'administrator';
            const journalDeleted = journalRepo.getById(journal.id) === null;
            
            if (isSuperAdmin) {
                return result.success && journalDeleted;
            } else {
                return !result.success && !journalDeleted;
            }
        }
    ),
    testConfig
);
```

4. **Filter Accuracy Property (Property 7)**
```javascript
// Feature: hapus-data-jurnal, Property 7: Filter result accuracy
fc.assert(
    fc.property(
        fc.array(journalArbitrary(), { minLength: 10, maxLength: 50 }),
        filterCriteriaArbitrary(),
        (journals, filters) => {
            // Setup: Save all journals
            journals.forEach(j => journalRepo.save(j));
            
            // Action: Apply filters
            const results = journalRepo.filter(filters);
            
            // Verify: All results match filter criteria
            return results.every(journal => matchesFilter(journal, filters));
        }
    ),
    testConfig
);
```

5. **Audit Logging Property (Property 5)**
```javascript
// Feature: hapus-data-jurnal, Property 5: Comprehensive audit logging
fc.assert(
    fc.property(
        journalArbitrary(),
        fc.string({ minLength: 10, maxLength: 200 }),
        (journal, reason) => {
            // Setup
            journalRepo.save(journal);
            
            // Action: Delete journal
            const result = deletionService.deleteJournal(journal.id, reason, 'admin');
            
            // Verify: Audit log created with all required fields
            const auditLog = auditLogRepo.getByJournalId(journal.id);
            
            return auditLog !== null &&
                   auditLog.journalSnapshot !== null &&
                   auditLog.deletedAt !== null &&
                   auditLog.deletedBy === 'admin' &&
                   auditLog.reason === reason &&
                   auditLog.impactAnalysis !== null;
        }
    ),
    testConfig
);
```

6. **Rollback Property (Property 10)**
```javascript
// Feature: hapus-data-jurnal, Property 10: Atomic rollback on failure
fc.assert(
    fc.property(
        journalArbitrary(),
        (journal) => {
            // Setup: Create journal and inject failure
            journalRepo.save(journal);
            const initialState = captureSystemState();
            injectFailure('balance_adjustment'); // Simulate failure
            
            // Action: Attempt deletion (will fail)
            const result = deletionService.deleteJournal(journal.id, 'test', 'admin');
            
            // Verify: All changes rolled back
            const finalState = captureSystemState();
            const journalStillExists = journalRepo.getById(journal.id) !== null;
            const stateUnchanged = compareStates(initialState, finalState);
            
            return !result.success && journalStillExists && stateUnchanged;
        }
    ),
    testConfig
);
```

**Arbitraries (Generators):**

```javascript
// Generate random journal entries
function journalArbitrary() {
    return fc.record({
        id: fc.uuid(),
        tanggal: fc.date().map(d => d.toISOString()),
        nomorJurnal: fc.string({ minLength: 5, maxLength: 20 }),
        tipe: fc.constantFrom('umum', 'kas', 'pembelian'),
        keterangan: fc.string({ minLength: 10, maxLength: 100 }),
        entries: fc.array(journalEntryArbitrary(), { minLength: 2, maxLength: 10 }),
        referensi: fc.option(fc.record({
            tipe: fc.constantFrom('transaksi_pos', 'pembelian', 'manual'),
            id: fc.uuid()
        }), { nil: null })
    }).map(journal => {
        // Ensure balanced entries
        const totalDebit = journal.entries.reduce((sum, e) => sum + e.debit, 0);
        const totalKredit = journal.entries.reduce((sum, e) => sum + e.kredit, 0);
        journal.totalDebit = totalDebit;
        journal.totalKredit = totalKredit;
        return journal;
    });
}

// Generate balanced journal entries
function journalEntryArbitrary() {
    return fc.record({
        akun: fc.constantFrom('1-1000', '1-1200', '4-1000', '5-1000'),
        debit: fc.nat({ max: 1000000 }),
        kredit: fc.nat({ max: 1000000 })
    }).filter(entry => entry.debit === 0 || entry.kredit === 0); // One must be zero
}

// Generate user with random role
function userArbitrary() {
    return fc.record({
        username: fc.string({ minLength: 5, maxLength: 20 }),
        role: fc.constantFrom('administrator', 'kasir', 'user')
    });
}

// Generate filter criteria
function filterCriteriaArbitrary() {
    return fc.record({
        search: fc.option(fc.string({ minLength: 3, maxLength: 20 }), { nil: '' }),
        tipe: fc.option(fc.constantFrom('umum', 'kas', 'pembelian'), { nil: 'all' }),
        startDate: fc.option(fc.date().map(d => d.toISOString()), { nil: '' }),
        endDate: fc.option(fc.date().map(d => d.toISOString()), { nil: '' }),
        accountCode: fc.option(fc.constantFrom('1-1000', '1-1200', '4-1000'), { nil: '' })
    });
}
```

### Integration Testing

Integration tests will verify end-to-end workflows:

1. **Complete Deletion Flow**
   - User authentication → Authorization check → Journal selection → Impact preview → Double confirmation → Deletion → Balance adjustment → Audit logging

2. **Validation Flow**
   - Attempt deletion with various invalid states (closed period, has references, unauthorized user)

3. **Filter and Search Flow**
   - Apply multiple filters → Verify results → Clear filters → Search → Verify results

4. **Error Recovery Flow**
   - Trigger error during deletion → Verify rollback → Verify system state unchanged

### Manual Testing Checklist

- [ ] Login as super admin and verify access to delete journal feature
- [ ] Login as non-admin and verify access is denied
- [ ] Delete journal umum and verify balance adjustment
- [ ] Delete journal kas and verify cash balance update
- [ ] Delete journal pembelian and verify stock restoration
- [ ] Attempt to delete journal with references (should be blocked)
- [ ] Attempt to delete journal in closed period (should be blocked)
- [ ] Verify double confirmation dialogs appear
- [ ] Cancel deletion at first confirmation
- [ ] Cancel deletion at second confirmation
- [ ] Verify impact preview shows correct information
- [ ] Apply date filter and verify results
- [ ] Apply type filter and verify results
- [ ] Search by journal number and verify results
- [ ] Search by description and verify results
- [ ] Verify audit log entry is created after deletion
- [ ] View audit history and verify all fields are present
- [ ] Attempt deletion without reason (should be blocked)
- [ ] Verify success notification after successful deletion
- [ ] Verify error notification after failed deletion
- [ ] Verify warning notification for validation errors

## Implementation Notes

### localStorage Keys

- `jurnal`: Array of journal entries
- `coa`: Chart of accounts with balances
- `journalDeletionLog`: Audit trail for journal deletions
- `accountingPeriods`: Accounting period status
- `users`: User accounts with roles

### Performance Considerations

1. **Large Journal Lists**: Implement pagination (20 items per page)
2. **Filter Performance**: Index journals by date and type for faster filtering
3. **Balance Calculation**: Cache account balances to avoid recalculation
4. **Audit Log Size**: Implement log rotation (keep last 1000 entries)

### Security Considerations

1. **Role Verification**: Always verify user role on server-side (when backend is implemented)
2. **Input Sanitization**: Sanitize reason input to prevent XSS
3. **Audit Integrity**: Audit logs should be append-only and immutable
4. **Session Validation**: Verify user session before allowing deletion

### Future Enhancements

1. **Batch Deletion**: Allow deleting multiple journals at once
2. **Undo Functionality**: Implement undo within a time window
3. **Export Audit Log**: Export audit trail to PDF/Excel
4. **Advanced Filters**: Add more filter options (amount range, created by)
5. **Notification History**: Keep history of all notifications
6. **Email Notifications**: Send email alerts for critical deletions
