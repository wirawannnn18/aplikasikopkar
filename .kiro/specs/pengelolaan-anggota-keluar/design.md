# Design Document

## Overview

Fitur pengelolaan anggota keluar adalah sistem yang menangani proses formal ketika anggota memutuskan untuk keluar dari koperasi. Sistem ini mencakup pencatatan status keluar, perhitungan pengembalian simpanan (pokok dan wajib), validasi kewajiban, pemrosesan pengembalian dana, pencatatan jurnal akuntansi otomatis, dan pelaporan lengkap.

Fitur ini terintegrasi penuh dengan sistem akuntansi double-entry yang sudah ada, memastikan setiap transaksi pengembalian tercatat dengan benar dan laporan keuangan tetap akurat dan seimbang.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         UI Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Anggota List │  │ Detail Modal │  │ Laporan Page │      │
│  │   + Button   │  │  Pengembalian│  │ Anggota Keluar│     │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  anggotaKeluarManager.js                             │   │
│  │  - markAnggotaKeluar()                               │   │
│  │  - calculatePengembalian()                           │   │
│  │  - validatePengembalian()                            │   │
│  │  - processPengembalian()                             │   │
│  │  - cancelStatusKeluar()                              │   │
│  │  - generateBuktiPengembalian()                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  anggota     │  │ simpananPokok│  │ simpananWajib│      │
│  │ localStorage │  │ localStorage │  │ localStorage │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  pinjaman    │  │    jurnal    │  │     coa      │      │
│  │ localStorage │  │ localStorage │  │ localStorage │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐                                            │
│  │pengembalian  │                                            │
│  │ localStorage │                                            │
│  └──────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
```

### Integration Points

1. **Modul Anggota (koperasi.js)**: Menambahkan status "Keluar" dan tombol aksi
2. **Modul Simpanan (simpanan.js)**: Membaca saldo simpanan pokok dan wajib
3. **Modul Pinjaman (pinjaman.js)**: Validasi pinjaman aktif
4. **Modul Akuntansi (keuangan.js)**: Pencatatan jurnal pengembalian
5. **Modul Laporan (reports.js)**: Laporan anggota keluar dan pengembalian

## Components and Interfaces

### 1. anggotaKeluarManager.js

Modul utama yang mengelola logika bisnis anggota keluar.

```javascript
// Core Functions
function markAnggotaKeluar(anggotaId, tanggalKeluar, alasanKeluar)
function calculatePengembalian(anggotaId)
function validatePengembalian(anggotaId)
function processPengembalian(anggotaId, metodePembayaran, tanggalPembayaran)
function cancelStatusKeluar(anggotaId)
function generateBuktiPengembalian(pengembalianId)

// Helper Functions
function getTotalSimpananPokok(anggotaId)
function getTotalSimpananWajib(anggotaId)
function getPinjamanAktif(anggotaId)
function getKewajibanLain(anggotaId)
```

### 2. anggotaKeluarUI.js

Modul untuk rendering UI dan interaksi pengguna.

```javascript
// UI Rendering
function renderAnggotaKeluarButton(anggotaId)
function showAnggotaKeluarModal(anggotaId)
function showPengembalianModal(anggotaId)
function renderLaporanAnggotaKeluar()

// Event Handlers
function handleMarkKeluar(event)
function handleProsesPengembalian(event)
function handleCancelKeluar(event)
function handleCetakBukti(event)
```

### 3. anggotaKeluarRepository.js

Modul untuk akses data dan persistensi.

```javascript
// Data Access
function getAnggotaKeluar()
function saveAnggotaKeluar(data)
function getPengembalianByAnggota(anggotaId)
function savePengembalian(data)
function updateAnggotaStatus(anggotaId, status, metadata)
```

## Data Models

### 1. Anggota (Extended)

Menambahkan field baru ke model anggota yang sudah ada:

```javascript
{
  id: string,
  nik: string,
  nama: string,
  // ... field existing lainnya
  
  // Field baru untuk anggota keluar
  statusKeanggotaan: string, // "Aktif" | "Keluar"
  tanggalKeluar: string | null, // ISO date format
  alasanKeluar: string | null,
  pengembalianStatus: string | null, // "Pending" | "Diproses" | "Selesai"
  pengembalianId: string | null // Reference ke record pengembalian
}
```

### 2. Pengembalian Simpanan

Model baru untuk mencatat transaksi pengembalian:

```javascript
{
  id: string,
  anggotaId: string,
  anggotaNama: string,
  anggotaNIK: string,
  
  // Rincian simpanan
  simpananPokok: number,
  simpananWajib: number,
  totalSimpanan: number,
  
  // Potongan (jika ada)
  kewajibanLain: number,
  keterangan: string,
  
  // Total pengembalian
  totalPengembalian: number,
  
  // Detail pembayaran
  metodePembayaran: string, // "Kas" | "Transfer Bank"
  tanggalPembayaran: string, // ISO date
  nomorReferensi: string,
  
  // Status dan audit
  status: string, // "Pending" | "Diproses" | "Selesai"
  createdAt: string,
  createdBy: string,
  processedAt: string | null,
  processedBy: string | null,
  
  // Jurnal reference
  jurnalId: string | null
}
```

### 3. Audit Log Entry

Untuk tracking perubahan status:

```javascript
{
  id: string,
  timestamp: string,
  userId: string,
  userName: string,
  action: string, // "MARK_KELUAR" | "PROSES_PENGEMBALIAN" | "CANCEL_KELUAR"
  anggotaId: string,
  anggotaNama: string,
  details: object,
  ipAddress: string | null
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Status change preserves historical data

*For any* anggota record, when the status is changed to "Keluar", all existing historical data (simpanan history, transaction history, personal information) should remain unchanged and accessible.

**Validates: Requirements 1.4**

### Property 2: Blocked transactions for exited members

*For any* anggota with statusKeanggotaan = "Keluar", attempting to create new transactions (penjualan, simpanan, pinjaman) should be rejected by the system.

**Validates: Requirements 1.5**

### Property 3: Total pengembalian calculation accuracy

*For any* anggota, the calculated totalPengembalian should equal (totalSimpananPokok + totalSimpananWajib - kewajibanLain).

**Validates: Requirements 2.3, 2.5**

### Property 4: Active loan validation

*For any* anggota with active pinjaman (status != "Lunas"), attempting to process pengembalian should be rejected with a clear error message.

**Validates: Requirements 2.4, 6.1**

### Property 5: Simpanan balance zeroing

*For any* anggota, after pengembalian is processed successfully, both simpananPokok balance and simpananWajib balance for that anggota should equal zero.

**Validates: Requirements 3.4, 3.5**

### Property 6: Status transition consistency

*For any* pengembalian record, when processPengembalian() completes successfully, the status field should transition to "Selesai" and processedAt timestamp should be set.

**Validates: Requirements 3.3**

### Property 7: Double-entry accounting balance

*For any* pengembalian transaction, the sum of debit entries should equal the sum of kredit entries in the generated journal entries.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 8: Journal reference integrity

*For any* pengembalian record with status "Selesai", there should exist a corresponding jurnal entry with matching anggotaId and transaction amount, and the pengembalian record should store the jurnalId reference.

**Validates: Requirements 4.5**

### Property 9: Report filtering accuracy

*For any* date range filter (startDate, endDate), the laporan anggota keluar should include only anggota where tanggalKeluar falls within that range (inclusive).

**Validates: Requirements 5.4**

### Property 10: CSV export completeness

*For any* set of anggota keluar records, the exported CSV file should contain all required fields (NIK, nama, tanggalKeluar, status pengembalian, total pengembalian) for each record.

**Validates: Requirements 5.5**

### Property 11: Sufficient balance validation

*For any* pengembalian amount, if the current kas/bank balance is less than the totalPengembalian, the validation should fail and prevent processing.

**Validates: Requirements 6.2**

### Property 12: Payment method validation

*For any* pengembalian submission, if metodePembayaran is null or empty, the validation should fail with an appropriate error message.

**Validates: Requirements 6.3**

### Property 13: Validation failure prevents processing

*For any* pengembalian that fails validation (active loan, insufficient balance, missing payment method), the system should not create any jurnal entries or modify any balances.

**Validates: Requirements 6.4**

### Property 14: Bukti document completeness

*For any* generated bukti pengembalian document, it should contain all required fields: anggota nama, NIK, tanggalKeluar, rincian simpanan (pokok, wajib), total pengembalian, metodePembayaran, nomorReferensi, and signature area.

**Validates: Requirements 7.3, 7.4, 7.5**

### Property 15: Cancellation state guard

*For any* anggota with pengembalianStatus = "Selesai", attempting to cancel the status keluar should be rejected by the system.

**Validates: Requirements 8.4**

### Property 16: Cancellation audit trail

*For any* successful cancellation of status keluar, an audit log entry with action = "CANCEL_KELUAR" should be created with the anggotaId, timestamp, and user information.

**Validates: Requirements 8.5**

### Property 17: Status restoration on cancellation

*For any* anggota with statusKeanggotaan = "Keluar" and pengembalianStatus != "Selesai", when cancellation is confirmed, the statusKeanggotaan should be set back to "Aktif" and all keluar-related fields (tanggalKeluar, alasanKeluar, pengembalianStatus) should be cleared.

**Validates: Requirements 8.3**

## Error Handling

### Error Categories

1. **Validation Errors**
   - Active loan exists
   - Insufficient kas/bank balance
   - Missing required fields
   - Invalid date formats
   - Anggota not found

2. **State Errors**
   - Anggota already has status "Keluar"
   - Pengembalian already processed
   - Cannot cancel after processing
   - Transaction blocked for exited member

3. **Data Integrity Errors**
   - Journal entry creation failed
   - Balance update failed
   - Concurrent modification detected

4. **System Errors**
   - localStorage quota exceeded
   - Network errors (if applicable)
   - Permission denied

### Error Handling Strategy

```javascript
// Consistent error response format
{
  success: false,
  error: {
    code: string,      // e.g., "ACTIVE_LOAN_EXISTS"
    message: string,   // User-friendly message
    details: object,   // Additional context
    timestamp: string
  }
}

// Success response format
{
  success: true,
  data: object,
  message: string
}
```

### Error Recovery

1. **Validation Errors**: Display clear message, allow user to correct input
2. **State Errors**: Refresh data, show current state, guide user to correct action
3. **Data Integrity Errors**: Rollback changes, log error, notify admin
4. **System Errors**: Retry mechanism, fallback to safe state, log for debugging

### Transaction Rollback

For critical operations (processPengembalian), implement rollback mechanism:

```javascript
function processPengembalian(data) {
  const snapshot = createSnapshot();
  
  try {
    // 1. Validate
    // 2. Create journal entries
    // 3. Update balances
    // 4. Update status
    // 5. Create audit log
    
    return { success: true, data: result };
  } catch (error) {
    restoreSnapshot(snapshot);
    logError(error);
    return { success: false, error: formatError(error) };
  }
}
```

## Testing Strategy

### Unit Testing

Unit tests will verify individual functions and components:

1. **Calculation Functions**
   - `calculatePengembalian()` with various simpanan amounts
   - `getTotalSimpananPokok()` with multiple transactions
   - `getTotalSimpananWajib()` with different periods

2. **Validation Functions**
   - `validatePengembalian()` with different scenarios
   - `getPinjamanAktif()` with various loan states
   - Input validation for dates, amounts, required fields

3. **State Management**
   - `markAnggotaKeluar()` status transitions
   - `cancelStatusKeluar()` state restoration
   - Status guards and permissions

4. **Data Access**
   - Repository CRUD operations
   - Data filtering and querying
   - localStorage operations

### Property-Based Testing

Property-based tests will verify universal properties across many randomly generated inputs using **fast-check** library for JavaScript.

Each property test will:
- Run a minimum of 100 iterations
- Generate random but valid test data
- Verify the property holds for all generated inputs
- Be tagged with the corresponding design property number

**Property Test Examples:**

1. **Property 3: Total calculation**
   ```javascript
   // Feature: pengelolaan-anggota-keluar, Property 3: Total pengembalian calculation accuracy
   fc.assert(
     fc.property(
       fc.nat(), // simpananPokok
       fc.nat(), // simpananWajib
       fc.nat(), // kewajibanLain
       (pokok, wajib, kewajiban) => {
         const result = calculatePengembalian({ pokok, wajib, kewajiban });
         return result.total === (pokok + wajib - kewajiban);
       }
     ),
     { numRuns: 100 }
   );
   ```

2. **Property 5: Balance zeroing**
   ```javascript
   // Feature: pengelolaan-anggota-keluar, Property 5: Simpanan balance zeroing
   fc.assert(
     fc.property(
       generateAnggotaWithSimpanan(),
       (anggota) => {
         processPengembalian(anggota.id, 'Kas', new Date());
         const pokokBalance = getTotalSimpananPokok(anggota.id);
         const wajibBalance = getTotalSimpananWajib(anggota.id);
         return pokokBalance === 0 && wajibBalance === 0;
       }
     ),
     { numRuns: 100 }
   );
   ```

3. **Property 7: Double-entry balance**
   ```javascript
   // Feature: pengelolaan-anggota-keluar, Property 7: Double-entry accounting balance
   fc.assert(
     fc.property(
       fc.nat(1, 10000000), // pengembalian amount
       (amount) => {
         const jurnal = createPengembalianJurnal(amount);
         const totalDebit = jurnal.entries.reduce((sum, e) => sum + e.debit, 0);
         const totalKredit = jurnal.entries.reduce((sum, e) => sum + e.kredit, 0);
         return totalDebit === totalKredit;
       }
     ),
     { numRuns: 100 }
   );
   ```

### Integration Testing

Integration tests will verify interactions between components:

1. **End-to-End Flows**
   - Complete anggota keluar process from marking to pengembalian
   - Cancellation flow with state restoration
   - Report generation with filtering

2. **Cross-Module Integration**
   - Anggota status affecting transaction modules
   - Journal entries updating COA balances
   - Report data aggregation from multiple sources

3. **UI Integration**
   - Modal interactions and form submissions
   - Button state changes based on data
   - Error message display and handling

### Test Data Generators

For property-based testing, create generators for:

```javascript
// Generate valid anggota with simpanan
function generateAnggotaWithSimpanan() {
  return fc.record({
    id: fc.uuid(),
    nik: fc.string(16, 16),
    nama: fc.string(5, 50),
    simpananPokok: fc.array(fc.record({
      jumlah: fc.nat(100000, 5000000),
      tanggal: fc.date()
    })),
    simpananWajib: fc.array(fc.record({
      jumlah: fc.nat(50000, 500000),
      periode: fc.string(),
      tanggal: fc.date()
    }))
  });
}

// Generate pengembalian data
function generatePengembalianData() {
  return fc.record({
    anggotaId: fc.uuid(),
    metodePembayaran: fc.constantFrom('Kas', 'Transfer Bank'),
    tanggalPembayaran: fc.date(),
    keterangan: fc.string(0, 200)
  });
}
```

## Security Considerations

### Access Control

1. **Role-Based Permissions**
   - Only `administrator` and `super_admin` can mark anggota keluar
   - Only `administrator`, `super_admin`, and `keuangan` can process pengembalian
   - All roles can view laporan (read-only)

2. **Action Validation**
   - Verify user role before allowing critical operations
   - Log all administrative actions with user information
   - Implement confirmation dialogs for irreversible actions

### Data Protection

1. **Sensitive Data**
   - Mask NIK in logs (show only last 4 digits)
   - Encrypt bukti pengembalian if contains sensitive info
   - Limit access to financial details

2. **Audit Trail**
   - Log all status changes with timestamp and user
   - Track all pengembalian transactions
   - Maintain immutable audit log

### Input Validation

1. **Sanitization**
   - Sanitize all text inputs to prevent XSS
   - Validate date formats and ranges
   - Validate numeric inputs (positive, within limits)

2. **Business Rules**
   - Enforce state machine for status transitions
   - Prevent duplicate processing
   - Validate referential integrity

## Performance Considerations

### Optimization Strategies

1. **Data Loading**
   - Lazy load anggota keluar list
   - Paginate large reports
   - Cache frequently accessed data

2. **Calculations**
   - Memoize expensive calculations (total simpanan)
   - Batch process multiple pengembalian
   - Index data by anggotaId for fast lookup

3. **UI Responsiveness**
   - Show loading indicators for long operations
   - Debounce search and filter inputs
   - Use virtual scrolling for large lists

### Scalability

1. **Data Volume**
   - Current localStorage limit: ~5-10MB
   - Estimated capacity: ~1000 anggota keluar records
   - Consider migration to IndexedDB if needed

2. **Future Enhancements**
   - Backend API integration for larger datasets
   - Server-side filtering and pagination
   - Real-time sync across multiple users

## UI/UX Design

### User Flows

#### Flow 1: Mark Anggota Keluar

```
1. Admin navigates to Master Anggota
2. Admin clicks "Anggota Keluar" button for specific anggota
3. System shows confirmation modal with anggota details
4. Admin enters tanggal keluar and alasan
5. Admin clicks "Simpan"
6. System validates and updates status
7. System shows success message
8. UI updates to show new status
```

#### Flow 2: Process Pengembalian

```
1. Admin navigates to anggota with status "Keluar"
2. Admin clicks "Proses Pengembalian" button
3. System calculates and displays:
   - Total simpanan pokok
   - Total simpanan wajib
   - Kewajiban (if any)
   - Total pengembalian
4. Admin selects metode pembayaran
5. Admin confirms pengembalian
6. System validates (no active loans, sufficient balance)
7. System processes:
   - Creates journal entries
   - Updates balances
   - Updates status
8. System shows success message with option to print bukti
```

#### Flow 3: View Laporan

```
1. Admin navigates to Laporan > Anggota Keluar
2. System displays list of all anggota keluar
3. Admin applies filters (date range, status)
4. System updates list based on filters
5. Admin clicks "Export CSV"
6. System generates and downloads CSV file
```

### UI Components

1. **Anggota Keluar Button**
   - Location: Master Anggota table, action column
   - Style: Warning button with icon
   - Tooltip: "Tandai anggota keluar dari koperasi"

2. **Pengembalian Modal**
   - Title: "Proses Pengembalian Simpanan"
   - Sections:
     - Anggota info (read-only)
     - Rincian simpanan (calculated, read-only)
     - Metode pembayaran (dropdown)
     - Keterangan (textarea, optional)
   - Actions: Cancel, Proses

3. **Laporan Page**
   - Filters: Date range, status pengembalian
   - Table: NIK, Nama, Tanggal Keluar, Status, Total, Actions
   - Export button: CSV download

4. **Bukti Pengembalian**
   - Format: Printable HTML/PDF
   - Header: Koperasi logo and info
   - Body: Anggota details, rincian, total
   - Footer: Signature areas, reference number

### Responsive Design

- Mobile: Stack form fields vertically, simplify tables
- Tablet: 2-column layout for forms, scrollable tables
- Desktop: Full layout with side-by-side panels

## Implementation Notes

### Dependencies

- **Existing Modules**: koperasi.js, simpanan.js, keuangan.js, utils.js
- **New Modules**: anggotaKeluarManager.js, anggotaKeluarUI.js, anggotaKeluarRepository.js
- **Libraries**: Bootstrap 5 (UI), fast-check (property testing)

### Migration Strategy

1. **Phase 1**: Add new fields to anggota model (backward compatible)
2. **Phase 2**: Implement core business logic (anggotaKeluarManager)
3. **Phase 3**: Add UI components and integrate with existing pages
4. **Phase 4**: Implement reporting and export features
5. **Phase 5**: Add property-based tests and validation

### Backward Compatibility

- Existing anggota records without new fields will default to:
  - `statusKeanggotaan`: "Aktif"
  - `tanggalKeluar`: null
  - `alasanKeluar`: null
  - `pengembalianStatus`: null

### Data Migration

No migration needed for existing data. New fields are optional and will be populated as anggota are marked keluar.

## Future Enhancements

1. **Automated Notifications**
   - Email notification to anggota when marked keluar
   - SMS notification when pengembalian is processed

2. **Approval Workflow**
   - Multi-level approval for large pengembalian amounts
   - Supervisor review before final processing

3. **Partial Pengembalian**
   - Allow installment-based pengembalian
   - Track partial payments over time

4. **Integration with Bank**
   - Direct bank transfer integration
   - Automatic reconciliation

5. **Advanced Reporting**
   - Trend analysis of anggota keluar
   - Reasons analysis dashboard
   - Financial impact reports
