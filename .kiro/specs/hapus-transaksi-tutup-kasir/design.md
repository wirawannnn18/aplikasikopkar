# Design Document

## Overview

Fitur hapus transaksi tutup kasir adalah extension dari fitur hapus transaksi POS yang memungkinkan super admin untuk menghapus transaksi yang sudah masuk dalam laporan tutup kasir yang telah ditutup. Fitur ini dirancang dengan kontrol keamanan berlapis dan audit trail yang sangat detail untuk menjaga integritas data dan mencegah penyalahgunaan.

Fitur ini akan menggunakan komponen yang sudah ada dari fitur hapus transaksi POS, dengan menambahkan layer keamanan tambahan, validasi khusus, dan mekanisme adjustment untuk laporan tutup kasir.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Security & Authorization Layer              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Role Check   │  │ Password     │  │ Rate Limiter     │  │
│  │ (Super Admin)│  │ Verification │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Closed Shift │  │ Warning      │  │ Password         │  │
│  │ Indicator    │  │ Dialog       │  │ Confirmation     │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Closed Shift │  │ Tutup Kasir  │  │ Critical Audit   │  │
│  │ Deletion     │  │ Adjustment   │  │ Logger           │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Existing Deletion Services (Reused)             │
│  • TransactionDeletionService  • StockRestorationService    │
│  • JournalReversalService      • AuditLoggerService         │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Security Components

#### RoleValidator
Validasi role user untuk akses fitur.

```javascript
class RoleValidator {
    /**
     * Cek apakah user adalah super admin
     * @param {Object} user - User object
     * @returns {boolean}
     */
    isSuperAdmin(user) {
        return user && user.role === 'administrator';
    }
}
```


#### PasswordVerificationService
Service untuk verifikasi password user.

```javascript
class PasswordVerificationService {
    /**
     * Verifikasi password user
     * @param {string} username - Username
     * @param {string} password - Password to verify
     * @returns {Object} { valid: boolean, message: string }
     */
    verifyPassword(username, password) {
        // 1. Ambil user dari localStorage
        // 2. Hash password dan compare
        // 3. Track failed attempts
        // 4. Return hasil
    }
    
    /**
     * Cek apakah user sedang diblokir
     * @param {string} username - Username
     * @returns {Object} { blocked: boolean, remainingTime: number }
     */
    isBlocked(username) {
        // 1. Cek failed attempts
        // 2. Cek timestamp block
        // 3. Return status
    }
    
    /**
     * Reset failed attempts
     * @param {string} username - Username
     */
    resetFailedAttempts(username) {
        // Clear failed attempts counter
    }
}
```

#### RateLimiterService
Service untuk membatasi frekuensi penghapusan.

```javascript
class RateLimiterService {
    /**
     * Cek apakah user sudah melebihi rate limit
     * @param {string} username - Username
     * @returns {Object} { allowed: boolean, count: number, message: string }
     */
    checkRateLimit(username) {
        // 1. Ambil deletion history hari ini
        // 2. Hitung jumlah deletion
        // 3. Cek threshold (5 = warning, 10 = block)
        // 4. Return hasil
    }
    
    /**
     * Record deletion untuk rate limiting
     * @param {string} username - Username
     */
    recordDeletion(username) {
        // Simpan timestamp deletion
    }
}
```

### 2. Business Logic Services

#### ClosedShiftDeletionService
Service utama untuk menghapus transaksi tertutup.

```javascript
class ClosedShiftDeletionService {
    /**
     * Hapus transaksi yang sudah tutup kasir
     * @param {string} transactionId - Transaction ID
     * @param {Object} deletionData - Deletion data (reason, category, user, password)
     * @returns {Object} { success: boolean, message: string, auditId: string }
     */
    deleteClosedTransaction(transactionId, deletionData) {
        // 1. Validate role (super admin only)
        // 2. Verify password
        // 3. Check rate limit
        // 4. Pre-deletion validation
        // 5. Get transaction and shift data
        // 6. Delete transaction (reuse existing service)
        // 7. Adjust tutup kasir report
        // 8. Create reversal journals with special tag
        // 9. Log critical audit
        // 10. Post-deletion validation
        // 11. Return result with audit ID
    }
}
```


#### TutupKasirAdjustmentService
Service untuk adjustment laporan tutup kasir.

```javascript
class TutupKasirAdjustmentService {
    /**
     * Adjust laporan tutup kasir setelah transaksi dihapus
     * @param {Object} transaction - Transaction data
     * @param {string} shiftId - Shift ID
     * @returns {Object} { success: boolean, adjustmentData: Object }
     */
    adjustTutupKasir(transaction, shiftId) {
        // 1. Ambil laporan tutup kasir
        // 2. Simpan snapshot before
        // 3. Kurangi total penjualan
        // 4. Kurangi kas/piutang sesuai metode
        // 5. Tambahkan catatan adjustment
        // 6. Simpan perubahan
        // 7. Return snapshot before/after
    }
    
    /**
     * Identifikasi shift dari transaksi
     * @param {Object} transaction - Transaction data
     * @returns {Object|null} Shift data or null
     */
    identifyShift(transaction) {
        // 1. Ambil semua riwayat tutup kas
        // 2. Cari shift yang mencakup tanggal transaksi
        // 3. Return shift data
    }
}
```

#### CriticalAuditLoggerService
Service untuk audit trail level critical.

```javascript
class CriticalAuditLoggerService {
    /**
     * Log penghapusan transaksi tertutup
     * @param {Object} data - Complete audit data
     * @returns {string} Audit ID
     */
    logCriticalDeletion(data) {
        // 1. Generate unique audit ID (AUDIT-CLOSED-YYYYMMDD-NNNN)
        // 2. Collect system info (IP, browser, timestamp)
        // 3. Create comprehensive log entry:
        //    - Audit ID
        //    - Level: CRITICAL
        //    - User info
        //    - Password verification timestamp
        //    - Category & reason
        //    - Transaction snapshot
        //    - Shift snapshot (before/after)
        //    - Journal entries
        //    - System info
        // 4. Save to separate storage (closedShiftDeletionLog)
        // 5. Return audit ID
    }
    
    /**
     * Get critical deletion history
     * @returns {Array} Array of critical logs
     */
    getCriticalHistory() {
        return JSON.parse(localStorage.getItem('closedShiftDeletionLog') || '[]');
    }
    
    /**
     * Export audit log to PDF-ready format
     * @param {string} auditId - Audit ID
     * @returns {Object} Formatted data for PDF
     */
    exportToPDF(auditId) {
        // Format data untuk export PDF
    }
}
```

#### DataIntegrityValidator
Service untuk validasi integritas data.

```javascript
class DataIntegrityValidator {
    /**
     * Validasi sebelum penghapusan
     * @param {string} transactionId - Transaction ID
     * @returns {Object} { valid: boolean, errors: Array }
     */
    preDeleteValidation(transactionId) {
        // 1. Cek transaksi exists
        // 2. Cek shift exists
        // 3. Cek referential integrity
        // 4. Return hasil
    }
    
    /**
     * Validasi setelah penghapusan
     * @param {Object} context - Deletion context
     * @returns {Object} { valid: boolean, errors: Array }
     */
    postDeleteValidation(context) {
        // 1. Cek transaksi sudah terhapus
        // 2. Cek stok sudah dikembalikan
        // 3. Cek jurnal sudah dibuat
        // 4. Cek tutup kasir sudah di-adjust
        // 5. Cek audit log sudah tersimpan
        // 6. Return hasil
    }
}
```


### 3. UI Components

#### ClosedShiftIndicator
Komponen untuk menampilkan indikator transaksi tertutup.

```javascript
function renderClosedShiftIndicator(transaction) {
    // Tampilkan badge "Shift Tertutup" jika transaksi sudah tutup kasir
    // Warna merah untuk menarik perhatian
}
```

#### WarningDialog
Dialog warning sebelum penghapusan transaksi tertutup.

```javascript
function showClosedShiftWarning(transaction, shiftData) {
    // Tampilkan modal dengan:
    // - Judul: "PERINGATAN: Hapus Transaksi Tertutup"
    // - Daftar dampak yang akan terjadi
    // - Checkbox "Saya memahami konsekuensi"
    // - Tombol lanjutkan (disabled sampai checkbox dicentang)
}
```

#### PasswordConfirmationDialog
Dialog untuk konfirmasi password.

```javascript
function showPasswordConfirmation(callback) {
    // Tampilkan modal dengan:
    // - Input password (type password)
    // - Peringatan failed attempts
    // - Tombol konfirmasi
    // - Callback setelah password terverifikasi
}
```

#### CategoryReasonDialog
Dialog untuk input kategori dan alasan.

```javascript
function showCategoryReasonDialog(transaction) {
    // Tampilkan modal dengan:
    // - Dropdown kategori kesalahan
    // - Textarea alasan (min 20, max 1000 karakter)
    // - Character counter
    // - Ringkasan transaksi
    // - Tombol konfirmasi
}
```

#### CriticalHistoryPage
Halaman riwayat penghapusan transaksi tertutup.

```javascript
function renderCriticalHistory() {
    // Render halaman dengan:
    // - Tab "Transaksi Tertutup" (terpisah dari riwayat biasa)
    // - Tabel dengan badge CRITICAL
    // - Filter dan pencarian
    // - Tombol export PDF
}
```

## Data Models

### Closed Shift Deletion Log Model
```javascript
{
    auditId: string,                      // AUDIT-CLOSED-YYYYMMDD-NNNN
    level: "CRITICAL",                    // Log level
    transactionId: string,                // Original transaction ID
    transactionNo: string,                // Original transaction number
    transactionSnapshot: Object,          // Complete transaction data
    shiftId: string,                      // Shift ID
    shiftSnapshot: {                      // Shift data before/after
        before: Object,
        after: Object
    },
    category: string,                     // Error category
    reason: string,                       // Detailed reason
    deletedBy: string,                    // User who deleted
    deletedAt: string (ISO),              // Deletion timestamp
    passwordVerifiedAt: string (ISO),     // Password verification timestamp
    systemInfo: {                         // System information
        userAgent: string,
        ipAddress: string,
        timestamp: string
    },
    journalEntries: Array,                // Reversal journals created
    adjustmentData: Object,               // Tutup kasir adjustment data
    validationResults: {                  // Validation results
        preDelete: Object,
        postDelete: Object
    },
    stockRestored: boolean,               // Stock restoration status
    warnings: Array<string>               // Any warnings
}
```

### Rate Limit Tracking Model
```javascript
{
    username: string,
    deletions: [
        {
            timestamp: string (ISO),
            transactionId: string,
            auditId: string
        }
    ],
    dailyCount: number,
    lastDeletion: string (ISO)
}
```

### Password Verification Tracking Model
```javascript
{
    username: string,
    failedAttempts: number,
    lastFailedAt: string (ISO),
    blockedUntil: string (ISO) | null
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Super admin role requirement
*For any* deletion attempt of a closed transaction, the system should only allow users with 'administrator' role to proceed.
**Validates: Requirements 2.1**

### Property 2: Password verification requirement
*For any* closed transaction deletion, the system should require password verification before proceeding.
**Validates: Requirements 2.2, 2.3, 2.4**

### Property 3: Failed password attempt blocking
*For any* user with 3 consecutive failed password attempts, the system should block access for 5 minutes.
**Validates: Requirements 2.5**

### Property 4: Category and reason requirement
*For any* closed transaction deletion, the system should require both a category selection and a reason with minimum 20 characters.
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 5: Tutup kasir adjustment correctness
*For any* closed transaction deletion, the system should adjust the related tutup kasir report by subtracting the transaction total from the appropriate fields (kas for cash, piutang for credit).
**Validates: Requirements 4.2, 4.3, 4.4**

### Property 6: Adjustment note creation
*For any* tutup kasir adjustment, the system should add a note referencing the deleted transaction number.
**Validates: Requirements 4.5**

### Property 7: Reversal journal with special tag
*For any* closed transaction deletion, the system should create reversal journals with tag "CLOSED_SHIFT_REVERSAL".
**Validates: Requirements 5.1, 5.6**

### Property 8: Reversal journal date correctness
*For any* closed transaction deletion, the reversal journal date should be the deletion date, not the original transaction date.
**Validates: Requirements 5.2**

### Property 9: Cash transaction reversal for closed shift
*For any* closed cash transaction deletion, the system should create reversal journal: Debit Pendapatan Penjualan, Kredit Kas.
**Validates: Requirements 5.3**

### Property 10: Credit transaction reversal for closed shift
*For any* closed credit transaction deletion, the system should create reversal journal: Debit Pendapatan Penjualan, Kredit Piutang.
**Validates: Requirements 5.4**

### Property 11: HPP reversal for closed shift
*For any* closed transaction deletion, the system should create HPP reversal journal: Debit Persediaan, Kredit HPP.
**Validates: Requirements 5.5**

### Property 12: Critical audit log creation
*For any* closed transaction deletion, the system should create an audit log with level "CRITICAL" and unique audit ID format "AUDIT-CLOSED-YYYYMMDD-NNNN".
**Validates: Requirements 6.1, 6.6**

### Property 13: Audit log completeness
*For any* critical audit log, it should contain: user info, password verification timestamp, category, reason, transaction snapshot, shift snapshots (before/after), journal entries, and system info.
**Validates: Requirements 6.2, 6.3, 6.4, 6.5**

### Property 14: Critical history separation
*For any* deletion history display, closed transaction deletions should appear in a separate "Transaksi Tertutup" tab with CRITICAL badge.
**Validates: Requirements 7.1, 7.2**

### Property 15: History display completeness
*For any* critical history entry, it should display: Audit ID, transaction number, transaction date, tutup kasir date, deletion date, user, category, and adjustment status.
**Validates: Requirements 7.3**

### Property 16: Detail view completeness
*For any* critical history detail view, it should display all audit information including before/after snapshots.
**Validates: Requirements 7.4**

### Property 17: Warning dialog requirement
*For any* closed transaction deletion attempt, the system should display a warning dialog with impact list and require checkbox confirmation.
**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

### Property 18: Pre-deletion validation
*For any* closed transaction deletion, the system should perform pre-deletion validation and prevent deletion if validation fails.
**Validates: Requirements 9.1, 9.2**

### Property 19: Post-deletion validation with rollback
*For any* closed transaction deletion, the system should perform post-deletion validation and rollback if validation fails.
**Validates: Requirements 9.3, 9.4, 9.5**

### Property 20: Rate limit warning at 5 deletions
*For any* user who has deleted 5 closed transactions in one day, the system should display a warning on the next deletion attempt.
**Validates: Requirements 10.2, 10.3**

### Property 21: Rate limit blocking at 10 deletions
*For any* user who has deleted 10 closed transactions in one day, the system should block further deletions and log to system.
**Validates: Requirements 10.4**


## Error Handling

### Security Errors

1. **Unauthorized Access Error**
   - Condition: Non-admin user attempts to delete closed transaction
   - Response: "Akses ditolak. Hanya Super Admin yang dapat menghapus transaksi tertutup."
   - Action: Prevent access, log attempt

2. **Password Verification Failed**
   - Condition: Incorrect password entered
   - Response: "Password salah. Sisa percobaan: X"
   - Action: Increment failed attempts counter

3. **Account Temporarily Blocked**
   - Condition: 3 failed password attempts
   - Response: "Akses diblokir sementara selama 5 menit karena terlalu banyak percobaan gagal."
   - Action: Block access, set unblock timestamp

4. **Rate Limit Warning**
   - Condition: 5 deletions in one day
   - Response: "Peringatan: Anda telah menghapus 5 transaksi tertutup hari ini. Harap berhati-hati."
   - Action: Show warning, allow continuation with justification

5. **Rate Limit Exceeded**
   - Condition: 10 deletions in one day
   - Response: "Batas maksimal penghapusan transaksi tertutup tercapai (10 per hari). Akses diblokir."
   - Action: Block access, log to system, notify admin

### Validation Errors

1. **Category Not Selected**
   - Condition: User doesn't select error category
   - Response: "Kategori kesalahan harus dipilih"
   - Action: Prevent deletion, highlight field

2. **Reason Too Short**
   - Condition: Reason less than 20 characters
   - Response: "Alasan harus minimal 20 karakter (saat ini: X karakter)"
   - Action: Prevent deletion, show character count

3. **Reason Too Long**
   - Condition: Reason exceeds 1000 characters
   - Response: "Alasan maksimal 1000 karakter"
   - Action: Prevent deletion, truncate input

4. **Checkbox Not Confirmed**
   - Condition: Warning checkbox not checked
   - Response: Disable confirmation button
   - Action: Keep button disabled

5. **Pre-Deletion Validation Failed**
   - Condition: Data integrity check fails before deletion
   - Response: "Validasi gagal: [detail error]. Penghapusan dibatalkan."
   - Action: Prevent deletion, show error details

### System Errors

1. **Shift Not Found**
   - Condition: Cannot identify related tutup kasir
   - Response: "Laporan tutup kasir tidak ditemukan untuk transaksi ini"
   - Action: Prevent deletion, log error

2. **Adjustment Failed**
   - Condition: Failed to adjust tutup kasir report
   - Response: "Gagal melakukan adjustment laporan tutup kasir"
   - Action: Rollback deletion, log error

3. **Journal Creation Failed**
   - Condition: Failed to create reversal journals
   - Response: "Gagal membuat jurnal pembalik"
   - Action: Rollback all changes, log error

4. **Post-Deletion Validation Failed**
   - Condition: Data integrity check fails after deletion
   - Response: "Validasi integritas data gagal. Melakukan rollback..."
   - Action: Automatic rollback, log error, notify user

5. **Audit Log Failed**
   - Condition: Failed to save critical audit log
   - Response: "CRITICAL: Gagal menyimpan audit log. Operasi dibatalkan."
   - Action: Rollback all changes, escalate to system admin

### Error Recovery Strategy

All operations must be atomic with comprehensive rollback:

1. Begin transaction context
2. Validate all preconditions
3. Save snapshots of all data to be modified
4. Perform all operations in sequence
5. Validate post-conditions
6. If any step fails:
   - Restore all snapshots
   - Log detailed error
   - Notify user with clear message
7. If all succeed:
   - Commit changes
   - Save audit log
   - Notify user of success


## Testing Strategy

### Unit Testing

Unit tests will verify individual security and business logic components:

1. **Security Components**
   - Test `RoleValidator.isSuperAdmin()` with various user roles
   - Test `PasswordVerificationService.verifyPassword()` with correct/incorrect passwords
   - Test `PasswordVerificationService.isBlocked()` with various failed attempt scenarios
   - Test `RateLimiterService.checkRateLimit()` with different deletion counts

2. **Business Logic Services**
   - Test `TutupKasirAdjustmentService.adjustTutupKasir()` with cash and credit transactions
   - Test `TutupKasirAdjustmentService.identifyShift()` with various transaction dates
   - Test `CriticalAuditLoggerService.logCriticalDeletion()` with complete data
   - Test `DataIntegrityValidator.preDeleteValidation()` with valid/invalid scenarios
   - Test `DataIntegrityValidator.postDeleteValidation()` with various states

3. **UI Components**
   - Test closed shift indicator displays correctly
   - Test warning dialog shows all impact items
   - Test password confirmation handles failed attempts
   - Test category/reason dialog validates input correctly

### Property-Based Testing

Property-based tests will verify universal properties using **fast-check** library. Each test will run a minimum of 100 iterations.

1. **Security Properties**
   - Generate random users with various roles
   - Verify Property 1: Super admin role requirement
   - Verify Property 2: Password verification requirement
   - Verify Property 3: Failed password attempt blocking

2. **Validation Properties**
   - Generate random categories and reasons
   - Verify Property 4: Category and reason requirement
   - Verify Property 17: Warning dialog requirement

3. **Adjustment Properties**
   - Generate random closed transactions
   - Verify Property 5: Tutup kasir adjustment correctness
   - Verify Property 6: Adjustment note creation

4. **Journal Properties**
   - Generate random cash and credit closed transactions
   - Verify Property 7: Reversal journal with special tag
   - Verify Property 8: Reversal journal date correctness
   - Verify Property 9: Cash transaction reversal for closed shift
   - Verify Property 10: Credit transaction reversal for closed shift
   - Verify Property 11: HPP reversal for closed shift

5. **Audit Properties**
   - Generate random deletion scenarios
   - Verify Property 12: Critical audit log creation
   - Verify Property 13: Audit log completeness
   - Verify Property 14: Critical history separation
   - Verify Property 15: History display completeness
   - Verify Property 16: Detail view completeness

6. **Integrity Properties**
   - Generate random deletion contexts
   - Verify Property 18: Pre-deletion validation
   - Verify Property 19: Post-deletion validation with rollback

7. **Rate Limit Properties**
   - Generate random deletion sequences
   - Verify Property 20: Rate limit warning at 5 deletions
   - Verify Property 21: Rate limit blocking at 10 deletions

### Integration Testing

Integration tests will verify the complete closed shift deletion flow:

1. **Complete Closed Shift Deletion Flow**
   - Create a transaction in a shift
   - Close the shift (tutup kasir)
   - Attempt deletion as non-admin (should fail)
   - Attempt deletion as admin with wrong password (should fail)
   - Attempt deletion as admin with correct password
   - Verify transaction is deleted
   - Verify tutup kasir is adjusted
   - Verify reversal journals are created with special tag
   - Verify critical audit log is created
   - Verify all data integrity checks pass

2. **Rollback Scenario**
   - Create a transaction in a closed shift
   - Simulate journal creation failure during deletion
   - Verify automatic rollback occurs
   - Verify transaction still exists
   - Verify tutup kasir is unchanged
   - Verify error is logged

3. **Rate Limiting Scenario**
   - Delete 5 closed transactions (should show warning)
   - Delete 5 more closed transactions (should block)
   - Verify block is enforced
   - Verify system log is created

4. **Password Blocking Scenario**
   - Attempt deletion with wrong password 3 times
   - Verify account is blocked
   - Wait 5 minutes (or simulate time passage)
   - Verify access is restored

### Test Data Generators

For property-based testing, create generators for:

1. **Closed Transaction Generator**
   ```javascript
   fc.record({
       id: fc.string(),
       noTransaksi: fc.string(),
       tanggal: fc.date(),
       kasir: fc.string(),
       metode: fc.constantFrom('cash', 'bon'),
       items: fc.array(itemGenerator),
       total: fc.nat(),
       shiftId: fc.string(),
       isClosed: fc.constant(true)
   })
   ```

2. **Deletion Data Generator**
   ```javascript
   fc.record({
       category: fc.constantFrom('Kesalahan Input', 'Transaksi Duplikat', 'Fraud', 'Koreksi Akuntansi', 'Lainnya'),
       reason: fc.string({ minLength: 20, maxLength: 1000 }),
       password: fc.string(),
       user: userGenerator
   })
   ```

3. **User Generator**
   ```javascript
   fc.record({
       username: fc.string(),
       role: fc.constantFrom('administrator', 'kasir', 'user'),
       password: fc.string()
   })
   ```

## Security Considerations

1. **Multi-Layer Authorization**
   - Role-based access control (super admin only)
   - Password re-verification for every deletion
   - Rate limiting to prevent abuse
   - Failed attempt tracking and temporary blocking

2. **Comprehensive Audit Trail**
   - Separate storage for critical deletions
   - Immutable audit logs
   - Complete snapshots (before/after)
   - System information capture (IP, browser, timestamp)
   - Unique audit IDs for tracking

3. **Data Integrity Protection**
   - Pre-deletion validation
   - Post-deletion validation with automatic rollback
   - Atomic operations with transaction-like behavior
   - Referential integrity checks

4. **Abuse Prevention**
   - Rate limiting (5 warning, 10 block per day)
   - Frequency monitoring
   - System-level logging for suspicious activity
   - Export capability for external audit

## Performance Considerations

1. **Validation Performance**
   - Cache shift data to avoid repeated lookups
   - Optimize integrity checks to run in parallel where possible
   - Use indexed lookups for transaction and shift identification

2. **Audit Log Storage**
   - Separate storage for critical logs to avoid bloating main storage
   - Consider archiving old logs after certain period
   - Implement pagination for history display

3. **Rollback Performance**
   - Use snapshots instead of recalculating state
   - Minimize number of localStorage operations
   - Batch updates where possible

## Migration from Existing Feature

This feature extends the existing hapus-transaksi-pos feature:

1. **Reuse Existing Components**
   - TransactionRepository
   - StockRepository
   - JournalRepository
   - TransactionDeletionService (with modifications)
   - StockRestorationService
   - JournalReversalService

2. **New Components**
   - All security layer components
   - TutupKasirAdjustmentService
   - CriticalAuditLoggerService
   - DataIntegrityValidator
   - New UI components for closed shift handling

3. **Integration Points**
   - Modify existing hapus transaksi page to show closed shift indicator
   - Add new route for closed shift deletion
   - Extend existing audit log with critical level
   - Add new tab in riwayat page for critical deletions
