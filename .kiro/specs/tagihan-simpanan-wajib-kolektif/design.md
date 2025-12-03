# Design Document

## Overview

Sistem tagihan dan pembayaran simpanan wajib kolektif dirancang untuk mengotomatisasi proses pembuatan tagihan bulanan dan memfasilitasi pembayaran massal yang efisien. Sistem ini terdiri dari tiga komponen utama: scheduler untuk pembuatan tagihan otomatis, modul manajemen tagihan untuk CRUD operations, dan modul pembayaran kolektif yang terintegrasi dengan sistem akuntansi.

Fitur ini akan diimplementasikan sebagai bagian dari aplikasi koperasi berbasis web yang sudah ada, menggunakan localStorage untuk penyimpanan data dan JavaScript vanilla untuk logika bisnis.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Tagihan Page │  │ Anggota Page │  │ Dashboard    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                     Business Logic Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Billing      │  │ Payment      │  │ Scheduler    │      │
│  │ Manager      │  │ Processor    │  │ Service      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Data Access Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Billing      │  │ Member       │  │ Journal      │      │
│  │ Repository   │  │ Repository   │  │ Repository   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Storage Layer (localStorage)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ billings     │  │ members      │  │ journals     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **Tagihan Otomatis**: Scheduler → Billing Manager → Member Repository → Billing Repository
2. **Pembayaran Kolektif**: UI → Payment Processor → Billing Repository → Journal Repository → Member Repository
3. **Simpanan Pokok**: Member Registration → Billing Manager → Billing Repository

## Components and Interfaces

### 1. BillingManager

Mengelola logika bisnis untuk pembuatan dan pengelolaan tagihan.

```javascript
class BillingManager {
  /**
   * Membuat tagihan simpanan wajib untuk semua anggota aktif
   * @param {string} period - Format: "YYYY-MM"
   * @returns {Object} { success: boolean, created: number, skipped: number }
   */
  createMonthlyBillings(period)

  /**
   * Membuat tagihan simpanan pokok untuk anggota baru
   * @param {string} memberId - ID anggota
   * @returns {Object} { success: boolean, billingId: string }
   */
  createInitialSavingBilling(memberId)

  /**
   * Mendapatkan daftar tagihan dengan filter
   * @param {Object} filters - { status, period, search }
   * @returns {Array} Array of billing objects
   */
  getBillings(filters)

  /**
   * Menghapus tagihan yang belum dibayar
   * @param {string} billingId - ID tagihan
   * @returns {Object} { success: boolean, message: string }
   */
  deleteBilling(billingId)

  /**
   * Mendapatkan riwayat pembayaran anggota
   * @param {string} memberId - ID anggota
   * @param {Object} filters - { startDate, endDate }
   * @returns {Array} Array of paid billings
   */
  getMemberPaymentHistory(memberId, filters)
}
```

### 2. PaymentProcessor

Menangani proses pembayaran kolektif dan integrasi dengan jurnal.

```javascript
class PaymentProcessor {
  /**
   * Memproses pembayaran kolektif
   * @param {Array} billingIds - Array of billing IDs
   * @param {string} paymentDate - ISO date string
   * @returns {Object} { success: boolean, totalAmount: number, count: number }
   */
  processCollectivePayment(billingIds, paymentDate)

  /**
   * Membayar simpanan pokok individual
   * @param {string} billingId - ID tagihan simpanan pokok
   * @param {string} paymentDate - ISO date string
   * @returns {Object} { success: boolean, amount: number }
   */
  payInitialSaving(billingId, paymentDate)

  /**
   * Rollback pembayaran jika terjadi error
   * @param {Array} billingIds - Array of billing IDs to rollback
   * @returns {void}
   */
  rollbackPayment(billingIds)
}
```

### 3. SchedulerService

Mengelola penjadwalan pembuatan tagihan otomatis.

```javascript
class SchedulerService {
  /**
   * Memeriksa apakah perlu membuat tagihan hari ini
   * @returns {boolean}
   */
  shouldCreateBillings()

  /**
   * Mendapatkan periode tagihan saat ini
   * @returns {string} Format: "YYYY-MM"
   */
  getCurrentPeriod()

  /**
   * Menjalankan proses pembuatan tagihan otomatis
   * @returns {Object} { success: boolean, created: number }
   */
  runScheduledBillingCreation()

  /**
   * Menyimpan log eksekusi scheduler
   * @param {Object} result - Hasil eksekusi
   * @returns {void}
   */
  logSchedulerExecution(result)
}
```

### 4. BillingRepository

Mengelola akses data tagihan ke localStorage.

```javascript
class BillingRepository {
  /**
   * Menyimpan tagihan baru
   * @param {Object} billing - Billing object
   * @returns {string} Billing ID
   */
  save(billing)

  /**
   * Mendapatkan tagihan berdasarkan ID
   * @param {string} id - Billing ID
   * @returns {Object|null}
   */
  findById(id)

  /**
   * Mendapatkan semua tagihan
   * @returns {Array}
   */
  findAll()

  /**
   * Update tagihan
   * @param {string} id - Billing ID
   * @param {Object} updates - Fields to update
   * @returns {boolean}
   */
  update(id, updates)

  /**
   * Hapus tagihan
   * @param {string} id - Billing ID
   * @returns {boolean}
   */
  delete(id)

  /**
   * Cek apakah tagihan sudah ada untuk periode tertentu
   * @param {string} memberId - Member ID
   * @param {string} period - Format: "YYYY-MM"
   * @returns {boolean}
   */
  existsByMemberAndPeriod(memberId, period)
}
```

## Data Models

### Billing Model

```javascript
{
  id: string,              // UUID
  memberId: string,        // Reference to member
  memberName: string,      // Denormalized for display
  type: string,           // "simpanan_wajib" | "simpanan_pokok"
  period: string,         // "YYYY-MM" for simpanan_wajib, null for simpanan_pokok
  amount: number,         // Nominal tagihan
  status: string,         // "belum_dibayar" | "dibayar"
  createdAt: string,      // ISO date string
  paidAt: string|null,    // ISO date string when paid
  paidBy: string|null,    // Admin user ID who processed payment
  journalId: string|null, // Reference to journal entry
  notes: string|null      // Optional notes
}
```

### SchedulerLog Model

```javascript
{
  id: string,           // UUID
  executedAt: string,   // ISO date string
  period: string,       // "YYYY-MM"
  created: number,      // Number of billings created
  skipped: number,      // Number of members skipped
  errors: Array,        // Array of error messages
  duration: number      // Execution time in ms
}
```

### Payment Transaction Model (Temporary)

```javascript
{
  billingIds: Array,    // Array of billing IDs being paid
  totalAmount: number,  // Total payment amount
  paymentDate: string,  // ISO date string
  processedBy: string,  // Admin user ID
  status: string        // "processing" | "completed" | "failed"
}
```

## Correctnes
s Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


Property 1: Tagihan dibuat untuk semua anggota aktif
*For any* set of active members on the 20th of any month, the system should create a billing for each active member
**Validates: Requirements 1.1, 8.1, 8.2**

Property 2: Format periode tagihan konsisten
*For any* created simpanan wajib billing, the period field should match the format "YYYY-MM"
**Validates: Requirements 1.2**

Property 3: Status awal tagihan adalah belum dibayar
*For any* newly created billing (simpanan wajib or simpanan pokok), the status should be "belum_dibayar"
**Validates: Requirements 1.3, 5.2**

Property 4: Nominal tagihan sesuai pengaturan anggota
*For any* member with a simpanan wajib amount setting, the created billing amount should equal that setting
**Validates: Requirements 1.4**

Property 5: Tidak ada tagihan duplikat per periode
*For any* member and period combination, after multiple billing creation attempts, only one billing should exist
**Validates: Requirements 1.5**

Property 6: Daftar tagihan menampilkan semua field wajib
*For any* set of billings, the rendered display should contain member name, period, amount, and status for each billing
**Validates: Requirements 2.1**

Property 7: Filter status mengembalikan hasil yang sesuai
*For any* status filter value and any set of billings, all returned billings should have the specified status
**Validates: Requirements 2.2**

Property 8: Filter periode mengembalikan hasil yang sesuai
*For any* period filter value and any set of billings, all returned billings should have the specified period
**Validates: Requirements 2.3**

Property 9: Pencarian nama anggota mengembalikan hasil yang relevan
*For any* search term and any set of billings, all returned billings should have member names containing the search term
**Validates: Requirements 2.4**

Property 10: Daftar tagihan terurut berdasarkan tanggal pembuatan
*For any* set of billings, the returned list should be sorted by createdAt in descending order
**Validates: Requirements 2.5**

Property 11: Konfirmasi pembayaran menampilkan total yang benar
*For any* set of selected billings, the confirmation should show a total amount equal to the sum of all billing amounts and the correct count
**Validates: Requirements 3.2**

Property 12: Pembayaran kolektif mengubah status semua tagihan
*For any* set of unpaid billings, after successful collective payment, all should have status "dibayar"
**Validates: Requirements 3.3**

Property 13: Pembayaran mencatat tanggal untuk semua tagihan
*For any* successful payment, all paid billings should have a non-null paidAt timestamp
**Validates: Requirements 3.4**

Property 14: Pembayaran menambah saldo anggota dengan benar
*For any* payment, each member's simpanan wajib balance should increase by exactly their billing amount
**Validates: Requirements 3.5**

Property 15: Jurnal pembayaran memiliki struktur akun yang benar
*For any* collective payment, the created journal should have a debit entry to kas account and credit entry to simpanan wajib account
**Validates: Requirements 4.1**

Property 16: Nominal jurnal sama dengan total pembayaran
*For any* collective payment, the journal transaction amount should equal the sum of all paid billing amounts
**Validates: Requirements 4.2**

Property 17: Deskripsi jurnal mencantumkan informasi lengkap
*For any* collective payment journal, the description should contain the member count and period information
**Validates: Requirements 4.3**

Property 18: Tanggal jurnal konsisten dengan tanggal pembayaran
*For any* payment, the journal transaction date should equal the payment date
**Validates: Requirements 4.4**

Property 19: Rollback pembayaran gagal tidak meninggalkan jejak
*For any* failed payment, no journal entry should exist and all billings should remain with status "belum_dibayar"
**Validates: Requirements 4.5**

Property 20: Anggota baru mendapat tagihan simpanan pokok 250 ribu
*For any* newly registered member, a simpanan pokok billing with amount 250000 should be created
**Validates: Requirements 5.1**

Property 21: Pembayaran simpanan pokok mengubah status
*For any* simpanan pokok billing, after payment the status should be "dibayar"
**Validates: Requirements 5.3**

Property 22: Pembayaran simpanan pokok menambah saldo 250 ribu
*For any* simpanan pokok payment, the member's simpanan pokok balance should increase by exactly 250000
**Validates: Requirements 5.4**

Property 23: Jurnal simpanan pokok memiliki struktur yang benar
*For any* simpanan pokok payment, the journal should have debit to kas and credit to simpanan pokok account
**Validates: Requirements 5.5**

Property 24: Tagihan terhapus tidak ada di storage
*For any* unpaid billing that is deleted, the billing should not exist in the storage after deletion
**Validates: Requirements 6.2**

Property 25: Tagihan yang sudah dibayar tidak dapat dihapus
*For any* billing with status "dibayar", deletion attempts should fail with an error message
**Validates: Requirements 6.3**

Property 26: Penghapusan tagihan mencatat audit log
*For any* deleted billing, an audit log entry should exist with the admin ID and deletion timestamp
**Validates: Requirements 6.4**

Property 27: Riwayat pembayaran menampilkan semua pembayaran anggota
*For any* member, the payment history should include all billings with status "dibayar" for that member
**Validates: Requirements 7.1**

Property 28: Riwayat pembayaran terurut berdasarkan periode
*For any* member's payment history, the results should be sorted by period in descending order
**Validates: Requirements 7.2**

Property 29: Filter tanggal riwayat mengembalikan hasil dalam rentang
*For any* date range filter and any member, all returned payments should have paidAt within the specified range
**Validates: Requirements 7.3**

Property 30: Total riwayat pembayaran dihitung dengan benar
*For any* member's payment history, the displayed total should equal the sum of all paid billing amounts
**Validates: Requirements 7.4**

## Error Handling

### Error Categories

1. **Validation Errors**
   - Invalid billing data (missing required fields, invalid amounts)
   - Invalid payment data (empty billing list, invalid date)
   - Invalid filter parameters

2. **Business Logic Errors**
   - Duplicate billing creation attempts
   - Payment of already paid billings
   - Deletion of paid billings
   - Insufficient member data for billing creation

3. **Storage Errors**
   - localStorage quota exceeded
   - Data corruption or invalid JSON
   - Concurrent modification conflicts

4. **Integration Errors**
   - Journal creation failures
   - Member balance update failures
   - Audit log creation failures

### Error Handling Strategy

```javascript
// Validation errors - return immediately with error message
if (!isValid(data)) {
  return { success: false, error: "Validation failed: " + reason };
}

// Business logic errors - return with specific error codes
if (billingExists(memberId, period)) {
  return { success: false, error: "DUPLICATE_BILLING", message: "..." };
}

// Storage errors - retry once, then fail gracefully
try {
  localStorage.setItem(key, value);
} catch (e) {
  if (e.name === 'QuotaExceededError') {
    // Attempt cleanup and retry
    cleanupOldData();
    try {
      localStorage.setItem(key, value);
    } catch (e2) {
      return { success: false, error: "STORAGE_FULL" };
    }
  }
}

// Integration errors - rollback and return error
try {
  updateBillings(billingIds);
  createJournal(journalData);
  updateBalances(memberIds);
} catch (e) {
  rollbackBillings(billingIds);
  return { success: false, error: "PAYMENT_FAILED", details: e.message };
}
```

### Error Messages

All error messages should be user-friendly and in Indonesian:

- `"Tagihan untuk periode ini sudah ada"` - Duplicate billing
- `"Tagihan yang sudah dibayar tidak dapat dihapus"` - Cannot delete paid billing
- `"Tidak ada tagihan yang dipilih"` - No billings selected for payment
- `"Gagal menyimpan data. Ruang penyimpanan penuh"` - Storage quota exceeded
- `"Pembayaran gagal. Silakan coba lagi"` - Payment processing failed

## Testing Strategy

### Unit Testing

Unit tests will focus on individual functions and edge cases:

1. **BillingManager Tests**
   - Creating billings with valid/invalid data
   - Filtering and searching billings
   - Deleting unpaid vs paid billings
   - Edge case: empty member list
   - Edge case: member without simpanan wajib setting

2. **PaymentProcessor Tests**
   - Processing payment with single billing
   - Processing payment with multiple billings
   - Rollback on journal creation failure
   - Edge case: payment with empty billing list
   - Edge case: payment with already paid billings

3. **SchedulerService Tests**
   - Date checking logic (20th vs other dates)
   - Period format generation
   - Scheduler execution logging

4. **Repository Tests**
   - CRUD operations
   - Duplicate detection
   - Query filtering
   - Edge case: corrupted data in localStorage

### Property-Based Testing

Property-based testing will verify universal properties using **fast-check** library for JavaScript. Each property test will run a minimum of 100 iterations.

**Test Configuration:**
```javascript
import fc from 'fast-check';

// Run each property test with 100 iterations
fc.assert(
  fc.property(/* generators */, /* test function */),
  { numRuns: 100 }
);
```

**Property Test Examples:**

1. **Property 5: No duplicate billings**
   ```javascript
   // Generate random member, period, and multiple creation attempts
   // Verify only one billing exists after all attempts
   fc.property(
     fc.uuid(), // memberId
     fc.date(), // period
     fc.integer({ min: 2, max: 10 }), // number of attempts
     (memberId, period, attempts) => {
       // Test implementation
     }
   );
   ```

2. **Property 14: Balance updates correctly**
   ```javascript
   // Generate random billings and verify balance changes
   fc.property(
     fc.array(billingArbitrary, { minLength: 1, maxLength: 20 }),
     (billings) => {
       const initialBalances = getBalances(billings.map(b => b.memberId));
       processPayment(billings);
       const finalBalances = getBalances(billings.map(b => b.memberId));
       // Verify each balance increased by billing amount
     }
   );
   ```

3. **Property 19: Rollback leaves no trace**
   ```javascript
   // Generate random payment that will fail
   // Verify no journal exists and billings are unpaid
   fc.property(
     fc.array(billingArbitrary, { minLength: 1 }),
     (billings) => {
       // Force failure during journal creation
       const result = processPaymentWithFailure(billings);
       // Verify rollback completed
     }
   );
   ```

**Generator Strategies:**

- **Member Generator**: Create members with random IDs, names, status (active/inactive), and simpanan wajib amounts
- **Billing Generator**: Create billings with random IDs, types, periods, amounts, and statuses
- **Date Generator**: Generate dates with specific constraints (e.g., 20th of month, date ranges)
- **Filter Generator**: Generate random filter combinations (status, period, search terms)

Each property-based test will be tagged with a comment referencing the design document property:

```javascript
// Feature: tagihan-simpanan-wajib-kolektif, Property 5: Tidak ada tagihan duplikat per periode
test('no duplicate billings per member-period', () => {
  fc.assert(/* property test */);
});
```

### Integration Testing

Integration tests will verify end-to-end workflows:

1. **Complete Billing Cycle**
   - Create monthly billings → Display in UI → Filter/search → Pay collectively → Verify journal and balances

2. **New Member Registration**
   - Register member → Verify simpanan pokok billing created → Pay billing → Verify balance updated

3. **Payment Rollback Scenario**
   - Start payment → Simulate journal failure → Verify rollback completed

4. **Scheduler Execution**
   - Set date to 20th → Run scheduler → Verify billings created → Run again → Verify no duplicates

### Manual Testing Checklist

- [ ] Scheduler runs automatically on 20th of month
- [ ] UI displays all billings correctly
- [ ] Filters and search work as expected
- [ ] Collective payment processes multiple billings
- [ ] Payment confirmation shows correct totals
- [ ] Journal entries are created correctly
- [ ] Member balances update correctly
- [ ] Cannot delete paid billings
- [ ] Audit logs are created for deletions
- [ ] Payment history displays correctly
- [ ] Error messages are user-friendly
- [ ] System handles localStorage quota exceeded gracefully

## Performance Considerations

### Optimization Strategies

1. **Batch Operations**
   - Process billings in batches of 50 to avoid blocking UI
   - Use setTimeout to yield control between batches

2. **Indexing**
   - Maintain in-memory index of billings by memberId and period
   - Rebuild index on page load from localStorage

3. **Lazy Loading**
   - Load billing list in pages (50 per page)
   - Load payment history on demand when viewing member details

4. **Caching**
   - Cache filtered/searched results for 30 seconds
   - Invalidate cache on data modifications

5. **Data Cleanup**
   - Archive paid billings older than 2 years to separate storage key
   - Provide admin tool to restore archived data if needed

### Performance Targets

- Billing creation for 1000 members: < 5 seconds
- Collective payment for 100 billings: < 2 seconds
- Filter/search on 1000 billings: < 500ms
- Page load with 500 billings: < 1 second

## Security Considerations

### Access Control

- Only admin users can create, view, and manage billings
- Verify user role before any billing operation
- Log all administrative actions with user ID and timestamp

### Data Validation

- Validate all input data before processing
- Sanitize search terms to prevent injection attacks
- Validate date formats and ranges
- Ensure amounts are positive numbers

### Audit Trail

- Log all billing creations with timestamp and creator
- Log all payments with timestamp, admin ID, and billing IDs
- Log all deletions with timestamp, admin ID, and reason
- Maintain immutable audit log (append-only)

## Deployment Considerations

### Database Migration

Since this is a new feature, no migration is needed. However, we need to:

1. Initialize billing storage key on first use
2. Create system settings for simpanan wajib default amount
3. Add simpanan wajib amount field to existing member records (default: 0)

### Rollout Strategy

1. **Phase 1**: Deploy billing creation and display features
2. **Phase 2**: Deploy payment processing features
3. **Phase 3**: Deploy scheduler for automatic billing creation
4. **Phase 4**: Deploy payment history and reporting features

### Monitoring

- Track scheduler execution success/failure rates
- Monitor localStorage usage
- Track payment processing times
- Alert on repeated payment failures

## Future Enhancements

1. **Email Notifications**: Send email reminders to members with unpaid billings
2. **SMS Integration**: Send SMS notifications for new billings
3. **Payment Plans**: Allow members to pay in installments
4. **Auto-payment**: Allow members to set up automatic payments
5. **Reporting**: Generate monthly reports of billing and payment statistics
6. **Export**: Export billing data to Excel/CSV
7. **Mobile App**: Mobile interface for members to view and pay billings
