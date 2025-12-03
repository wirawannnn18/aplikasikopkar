# Design Document - Pembayaran Hutang Piutang Anggota

## Overview

Fitur pembayaran hutang piutang anggota memungkinkan kasir untuk mencatat transaksi pembayaran hutang dari anggota (pelunasan kredit POS) dan pembayaran piutang kepada anggota (pengembalian dana). Sistem ini terintegrasi penuh dengan modul akuntansi double-entry, mencatat jurnal otomatis, dan memperbarui saldo anggota secara real-time.

Fitur ini menggunakan pola yang sudah ada dalam aplikasi:
- Struktur COA (Chart of Accounts) dengan kode akun standar
- Fungsi `addJurnal()` untuk pencatatan jurnal double-entry
- LocalStorage untuk persistensi data
- Bootstrap 5 untuk UI
- Audit trail untuk tracking perubahan

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    UI Layer (HTML/Bootstrap)                 │
│  - Form Pembayaran Hutang/Piutang                           │
│  - Riwayat Transaksi                                        │
│  - Bukti Pembayaran                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Business Logic Layer (JavaScript)               │
│  - Validasi Input                                           │
│  - Perhitungan Saldo                                        │
│  - Proses Pembayaran                                        │
│  - Generate Bukti                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                 Data Access Layer                            │
│  - addJurnal() - Pencatatan jurnal                          │
│  - updateSaldoAnggota() - Update saldo                      │
│  - saveAuditLog() - Audit trail                             │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Persistence Layer (LocalStorage)                │
│  - pembayaranHutangPiutang[]                                │
│  - jurnal[]                                                 │
│  - coa[]                                                    │
│  - anggota[]                                                │
│  - auditLog[]                                               │
└─────────────────────────────────────────────────────────────┘
```

### Integration Points

1. **COA (Chart of Accounts)**
   - `1-1000`: Kas (Aset)
   - `1-1200`: Piutang Anggota (Aset)
   - `2-1000`: Hutang Anggota (Kewajiban)

2. **Existing Functions**
   - `addJurnal(keterangan, entries, tanggal)`: Mencatat jurnal
   - `formatRupiah(amount)`: Format currency
   - `showAlert(message, type)`: Notifikasi
   - `generateId()`: Generate unique ID

3. **Data Sources**
   - `anggota[]`: Master data anggota
   - `penjualan[]`: Transaksi POS untuk hitung hutang

## Components and Interfaces

### 1. Main Module: `pembayaranHutangPiutang.js`

```javascript
// Core Functions
function renderPembayaranHutangPiutang()
function showFormPembayaran(jenis) // 'hutang' atau 'piutang'
function prosesPembayaran()
function validatePembayaran(data)
function hitungSaldoHutang(anggotaId)
function hitungSaldoPiutang(anggotaId)
function renderRiwayatPembayaran()
function cetakBuktiPembayaran(transaksiId)
```

### 2. Data Models

#### PembayaranHutangPiutang
```javascript
{
  id: string,              // Unique ID
  tanggal: string,         // ISO date
  anggotaId: string,       // Reference to anggota
  anggotaNama: string,     // Cached for display
  anggotaNIK: string,      // Cached for display
  jenis: string,           // 'hutang' | 'piutang'
  jumlah: number,          // Amount paid
  saldoSebelum: number,    // Balance before
  saldoSesudah: number,    // Balance after
  keterangan: string,      // Notes
  kasirId: string,         // User who processed
  kasirNama: string,       // Cached for display
  jurnalId: string,        // Reference to journal entry
  status: string,          // 'selesai' | 'dibatalkan'
  createdAt: string,       // ISO timestamp
  updatedAt: string        // ISO timestamp
}
```

#### Journal Entry Structure
```javascript
// Pembayaran Hutang (Anggota bayar ke koperasi)
{
  keterangan: "Pembayaran Hutang - [Nama Anggota]",
  entries: [
    { akun: '1-1000', debit: jumlah, kredit: 0 },    // Kas bertambah
    { akun: '2-1000', debit: 0, kredit: jumlah }     // Hutang berkurang
  ]
}

// Pembayaran Piutang (Koperasi bayar ke anggota)
{
  keterangan: "Pembayaran Piutang - [Nama Anggota]",
  entries: [
    { akun: '1-1200', debit: jumlah, kredit: 0 },    // Piutang berkurang
    { akun: '1-1000', debit: 0, kredit: jumlah }     // Kas berkurang
  ]
}
```

### 3. UI Components

#### Form Pembayaran
```html
<div class="card">
  <div class="card-header">Form Pembayaran [Hutang/Piutang]</div>
  <div class="card-body">
    <!-- Autocomplete Anggota -->
    <input type="text" id="searchAnggota" placeholder="Cari NIK atau Nama...">
    <div id="anggotaSuggestions"></div>
    
    <!-- Display Saldo -->
    <div class="alert alert-info">
      Saldo [Hutang/Piutang]: <strong id="displaySaldo">Rp 0</strong>
    </div>
    
    <!-- Input Jumlah -->
    <input type="number" id="jumlahPembayaran" placeholder="Jumlah Pembayaran">
    
    <!-- Keterangan -->
    <textarea id="keterangan" placeholder="Keterangan (opsional)"></textarea>
    
    <!-- Buttons -->
    <button onclick="prosesPembayaran()">Proses Pembayaran</button>
  </div>
</div>
```

#### Riwayat Pembayaran
```html
<div class="card">
  <div class="card-header">
    Riwayat Pembayaran
    <!-- Filters -->
    <select id="filterJenis">
      <option value="">Semua</option>
      <option value="hutang">Hutang</option>
      <option value="piutang">Piutang</option>
    </select>
    <input type="date" id="filterTanggalDari">
    <input type="date" id="filterTanggalSampai">
  </div>
  <div class="card-body">
    <table class="table">
      <thead>
        <tr>
          <th>Tanggal</th>
          <th>Anggota</th>
          <th>Jenis</th>
          <th>Jumlah</th>
          <th>Kasir</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody id="riwayatTableBody"></tbody>
    </table>
  </div>
</div>
```

## Data Models

### LocalStorage Keys

```javascript
'pembayaranHutangPiutang'  // Array of payment transactions
'jurnal'                    // Existing journal entries
'coa'                       // Existing chart of accounts
'anggota'                   // Existing member data
'penjualan'                 // Existing sales data (for hutang calculation)
'auditLog'                  // Existing audit trail
```

### Saldo Calculation Logic

#### Hutang Anggota
```javascript
// Hutang = Total kredit POS yang belum dibayar
function hitungSaldoHutang(anggotaId) {
  const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
  const pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
  
  // Total kredit dari POS
  const totalKredit = penjualan
    .filter(p => p.anggotaId === anggotaId && p.status === 'kredit')
    .reduce((sum, p) => sum + p.total, 0);
  
  // Total pembayaran hutang
  const totalBayar = pembayaran
    .filter(p => p.anggotaId === anggotaId && p.jenis === 'hutang' && p.status === 'selesai')
    .reduce((sum, p) => sum + p.jumlah, 0);
  
  return totalKredit - totalBayar;
}
```

#### Piutang Anggota
```javascript
// Piutang = Hak anggota untuk menerima pembayaran
// (Untuk implementasi awal, bisa dari simpanan yang ditarik)
function hitungSaldoPiutang(anggotaId) {
  const pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
  
  // Untuk fase 1: piutang manual entry
  // Fase 2: bisa integrate dengan penarikan simpanan
  const totalPiutang = pembayaran
    .filter(p => p.anggotaId === anggotaId && p.jenis === 'piutang' && p.status === 'selesai')
    .reduce((sum, p) => sum + p.jumlah, 0);
  
  return totalPiutang;
}
```

## Error Handling

### Validation Rules

1. **Anggota Selection**
   - Error: Anggota tidak dipilih
   - Message: "Silakan pilih anggota terlebih dahulu"

2. **Jumlah Pembayaran**
   - Error: Jumlah kosong atau 0
   - Message: "Jumlah pembayaran harus lebih dari 0"
   - Error: Jumlah negatif
   - Message: "Jumlah pembayaran tidak boleh negatif"
   - Error: Jumlah > saldo hutang
   - Message: "Jumlah pembayaran melebihi saldo hutang (Rp X)"
   - Error: Jumlah > saldo piutang
   - Message: "Jumlah pembayaran melebihi saldo piutang (Rp X)"

3. **Saldo Validation**
   - Error: Anggota tidak memiliki hutang
   - Message: "Anggota tidak memiliki hutang yang perlu dibayar"
   - Error: Anggota tidak memiliki piutang
   - Message: "Anggota tidak memiliki piutang yang perlu dibayar"

4. **Journal Entry**
   - Error: Gagal mencatat jurnal
   - Action: Rollback transaction
   - Message: "Gagal mencatat jurnal. Transaksi dibatalkan."

5. **Data Integrity**
   - Error: COA tidak lengkap
   - Message: "Akun tidak ditemukan. Hubungi administrator."

### Error Recovery

```javascript
function prosesPembayaran() {
  try {
    // 1. Validate input
    const validation = validatePembayaran(data);
    if (!validation.valid) {
      showAlert(validation.message, 'warning');
      return;
    }
    
    // 2. Save transaction
    const transaksi = savePembayaran(data);
    
    // 3. Record journal (atomic operation)
    try {
      addJurnal(keterangan, entries);
    } catch (error) {
      // Rollback transaction
      rollbackPembayaran(transaksi.id);
      throw error;
    }
    
    // 4. Save audit log
    saveAuditLog({
      action: 'PEMBAYARAN_' + data.jenis.toUpperCase(),
      details: transaksi
    });
    
    // 5. Success
    showAlert('Pembayaran berhasil diproses', 'success');
    renderRiwayatPembayaran();
    
  } catch (error) {
    console.error('Error proses pembayaran:', error);
    showAlert('Terjadi kesalahan: ' + error.message, 'danger');
  }
}
```

## Testing Strategy

### Unit Testing

Menggunakan Jest untuk unit testing dengan fokus pada:

1. **Validation Functions**
   - Test valid input
   - Test invalid input (empty, negative, exceeds balance)
   - Test edge cases (zero balance, exact balance)

2. **Calculation Functions**
   - Test `hitungSaldoHutang()` dengan berbagai skenario
   - Test `hitungSaldoPiutang()` dengan berbagai skenario
   - Test dengan data kosong
   - Test dengan multiple transactions

3. **Journal Entry Generation**
   - Test correct debit/credit for hutang payment
   - Test correct debit/credit for piutang payment
   - Test journal entry structure

4. **Data Integrity**
   - Test rollback on error
   - Test atomic operations
   - Test concurrent transactions

### Property-Based Testing

Menggunakan fast-check library untuk property-based testing.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Payment Processing Properties

**Property 1: Hutang saldo display accuracy**
*For any* anggota with hutang, when selected, the displayed saldo should equal the calculated total kredit minus total payments.
**Validates: Requirements 1.1**

**Property 2: Hutang payment validation**
*For any* payment amount and hutang saldo, the system should reject payments exceeding saldo and accept payments within saldo.
**Validates: Requirements 1.2**

**Property 3: Hutang saldo reduction**
*For any* valid hutang payment, the saldo after payment should equal saldo before payment minus payment amount.
**Validates: Requirements 1.3**

**Property 4: Hutang journal structure**
*For any* hutang payment amount, the journal entry should have debit to Kas (1-1000) and kredit to Hutang Anggota (2-1000) with equal amounts.
**Validates: Requirements 1.4**

**Property 5: Piutang saldo display accuracy**
*For any* anggota with piutang, when selected, the displayed saldo should equal the calculated piutang balance.
**Validates: Requirements 2.1**

**Property 6: Piutang payment validation**
*For any* payment amount and piutang saldo, the system should reject payments exceeding saldo and accept payments within saldo.
**Validates: Requirements 2.2**

**Property 7: Piutang saldo reduction**
*For any* valid piutang payment, the saldo after payment should equal saldo before payment minus payment amount.
**Validates: Requirements 2.3**

**Property 8: Piutang journal structure**
*For any* piutang payment amount, the journal entry should have debit to Piutang Anggota (1-1200) and kredit to Kas (1-1000) with equal amounts.
**Validates: Requirements 2.4**

### Reporting and Filtering Properties

**Property 9: Complete transaction display**
*For any* list of payment transactions, the riwayat display should include all transactions without omission.
**Validates: Requirements 4.1**

**Property 10: Required fields in display**
*For any* payment transaction displayed, the output should contain tanggal, nama anggota, jenis pembayaran, jumlah, and kasir name.
**Validates: Requirements 4.2**

**Property 11: Jenis filter correctness**
*For any* transaction list and jenis filter value, all filtered results should match the selected jenis and no matching transactions should be excluded.
**Validates: Requirements 4.3**

**Property 12: Date range filter correctness**
*For any* transaction list and date range, all filtered results should fall within the range and no transactions within range should be excluded.
**Validates: Requirements 4.4**

**Property 13: Member filter correctness**
*For any* transaction list and selected member, all filtered results should belong to that member and no transactions for that member should be excluded.
**Validates: Requirements 4.5**

### Audit Trail Properties

**Property 14: Audit log creation**
*For any* payment transaction processed, an audit log entry should be created with user, timestamp, and transaction details.
**Validates: Requirements 5.1**

**Property 15: Audit log completeness**
*For any* audit log entry, it should contain anggota info, jenis pembayaran, jumlah, saldo before, and saldo after.
**Validates: Requirements 5.2**

**Property 16: Error logging**
*For any* processing error, an error log should be created with error details.
**Validates: Requirements 5.3**

**Property 17: Audit log persistence**
*For any* audit log entry saved, it should remain in localStorage after page reload.
**Validates: Requirements 5.4**

### UI Interaction Properties

**Property 18: Autocomplete matching**
*For any* search string input, the autocomplete suggestions should include all anggota whose name or NIK contains the search string.
**Validates: Requirements 6.2**

**Property 19: Automatic saldo display**
*For any* anggota selection, the system should automatically display both hutang and piutang saldo for that anggota.
**Validates: Requirements 6.3**

**Property 20: Relevant saldo display by jenis**
*For any* jenis pembayaran selection, the system should display hutang saldo when 'hutang' is selected and piutang saldo when 'piutang' is selected.
**Validates: Requirements 6.4**

### Accounting Integrity Properties

**Property 21: Hutang journal balance**
*For any* hutang payment, the total debit should equal total kredit in the journal entry.
**Validates: Requirements 7.1**

**Property 22: Piutang journal balance**
*For any* piutang payment, the total debit should equal total kredit in the journal entry.
**Validates: Requirements 7.2**

**Property 23: Account balance consistency**
*For any* journal entry recorded, the affected account balances (Kas, Hutang Anggota, Piutang Anggota) should be updated by exactly the debit/kredit amounts.
**Validates: Requirements 7.3**

**Property 24: Transaction rollback on error**
*For any* journal recording error, the transaction should be rolled back and all balances should return to their state before the transaction attempt.
**Validates: Requirements 7.4**

**Property 25: Atomic transaction completion**
*For any* successful transaction, either all changes (payment record, journal entry, balance updates) are saved or none are saved.
**Validates: Requirements 7.5**

### Receipt Properties

**Property 26: Receipt completeness**
*For any* payment transaction, the printed receipt should contain nomor transaksi, tanggal, nama anggota, jenis pembayaran, jumlah, saldo terbaru, and nama kasir.
**Validates: Requirements 8.2, 8.3**

**Property 27: Print action logging**
*For any* receipt print action, an audit log entry should be created recording the print event.
**Validates: Requirements 8.5**



## Implementation Notes

### File Structure

```
js/
  pembayaranHutangPiutang.js    // Main module
  
__tests__/
  pembayaranHutangPiutang.test.js    // Unit & property tests
  
index.html                       // Add menu item
```

### Menu Integration

Add to sidebar navigation:
```html
<li class="nav-item">
  <a class="nav-link" href="#" onclick="navigateTo('pembayaranHutangPiutang')">
    <i class="bi bi-cash-coin"></i> Pembayaran Hutang/Piutang
  </a>
</li>
```

### COA Requirements

Ensure these accounts exist in COA:
- `1-1000`: Kas (Aset)
- `1-1200`: Piutang Anggota (Aset)
- `2-1000`: Hutang Anggota (Kewajiban)

### Security Considerations

1. **Role-Based Access**
   - Kasir: Can process payments
   - Admin: Can view all history and audit logs
   - Validate user role before allowing operations

2. **Input Sanitization**
   - Sanitize all text inputs to prevent XSS
   - Validate numeric inputs are actual numbers
   - Validate dates are valid ISO format

3. **Audit Trail**
   - Log all payment operations
   - Log all failed attempts
   - Include user ID and timestamp
   - Store immutable audit records

### Performance Considerations

1. **Autocomplete**
   - Debounce search input (300ms)
   - Limit suggestions to 10 results
   - Cache anggota list in memory

2. **Transaction History**
   - Implement pagination (50 records per page)
   - Index by date for faster filtering
   - Lazy load transaction details

3. **LocalStorage**
   - Monitor storage size
   - Implement data archiving for old transactions
   - Compress audit logs if needed

### Accessibility

1. **Keyboard Navigation**
   - Tab order follows logical flow
   - Enter key submits form
   - Escape key closes modals

2. **Screen Reader Support**
   - ARIA labels on all form fields
   - ARIA live regions for dynamic content
   - Descriptive button labels

3. **Visual Indicators**
   - Clear focus states
   - Color contrast meets WCAG AA
   - Error messages are visible and clear

## Future Enhancements

### Phase 2 Features

1. **Partial Payments**
   - Allow installment payments
   - Track payment schedule
   - Send payment reminders

2. **Bulk Payments**
   - Process multiple payments at once
   - Import from CSV
   - Batch journal entries

3. **Payment Methods**
   - Support transfer bank
   - Support e-wallet
   - Integrate with payment gateway

4. **Reporting**
   - Payment aging report
   - Collection effectiveness
   - Cash flow analysis

5. **Integration**
   - Link with simpanan withdrawal
   - Auto-deduct from salary
   - SMS/Email notifications

### Technical Debt

1. **Refactoring**
   - Extract validation logic to separate module
   - Create reusable autocomplete component
   - Standardize error handling

2. **Testing**
   - Increase test coverage to 90%
   - Add E2E tests with Playwright
   - Performance testing for large datasets

3. **Documentation**
   - API documentation
   - User manual
   - Video tutorials
