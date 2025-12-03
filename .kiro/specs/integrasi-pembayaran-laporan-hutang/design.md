# Design Document

## Overview

Dokumen ini menjelaskan desain untuk mengintegrasikan sistem pembayaran hutang piutang dengan laporan hutang anggota. Saat ini, laporan hutang piutang hanya menghitung total transaksi kredit tanpa memperhitungkan pembayaran yang sudah dilakukan. Integrasi ini akan memastikan bahwa saldo hutang yang ditampilkan di laporan akurat dan real-time dengan mengurangi total pembayaran dari total hutang.

## Architecture

### Current State
- **Modul Pembayaran Hutang** (`js/pembayaranHutangPiutang.js`): Memiliki fungsi `hitungSaldoHutang()` yang sudah menghitung saldo dengan benar (total kredit - total pembayaran)
- **Modul Laporan** (`js/reports.js`): Fungsi `laporanHutangPiutang()` hanya menghitung total kredit tanpa mengurangi pembayaran

### Target State
- Modul Laporan akan menggunakan fungsi perhitungan yang sama dengan modul Pembayaran
- Fungsi `hitungSaldoHutang()` akan dipindahkan ke modul utility yang dapat diakses oleh kedua modul
- Laporan akan menampilkan kolom tambahan: Total Pembayaran dan Saldo Hutang

## Components and Interfaces

### 1. Shared Utility Functions

Fungsi-fungsi berikut akan dipindahkan atau dibuat di file utility yang dapat diakses oleh semua modul:

```javascript
/**
 * Calculate hutang balance for an anggota
 * @param {string} anggotaId - ID of the anggota
 * @returns {number} Current hutang balance
 */
function hitungSaldoHutang(anggotaId)

/**
 * Calculate total pembayaran hutang for an anggota
 * @param {string} anggotaId - ID of the anggota
 * @returns {number} Total pembayaran hutang
 */
function hitungTotalPembayaranHutang(anggotaId)

/**
 * Get pembayaran hutang history for an anggota
 * @param {string} anggotaId - ID of the anggota
 * @returns {Array} List of pembayaran transactions
 */
function getPembayaranHutangHistory(anggotaId)
```

### 2. Updated Report Module

Fungsi `laporanHutangPiutang()` akan diperbarui untuk:
- Menggunakan `hitungSaldoHutang()` untuk menghitung saldo
- Menampilkan kolom "Total Pembayaran"
- Menampilkan kolom "Saldo Hutang" (yang sudah dikurangi pembayaran)
- Menampilkan detail pembayaran saat anggota diklik

### 3. Report Data Structure

```javascript
{
  anggotaId: string,
  nik: string,
  nama: string,
  departemen: string,
  totalKredit: number,        // Total transaksi kredit
  totalPembayaran: number,    // Total pembayaran hutang
  saldoHutang: number,        // totalKredit - totalPembayaran
  status: string              // "Lunas" or "Belum Lunas"
}
```

## Data Models

### Pembayaran Hutang Piutang (Existing)
```javascript
{
  id: string,
  tanggal: string (ISO 8601),
  anggotaId: string,
  anggotaNama: string,
  anggotaNIK: string,
  jenis: string,              // "hutang" or "piutang"
  jumlah: number,
  saldoSebelum: number,
  saldoSesudah: number,
  keterangan: string,
  kasirId: string,
  kasirNama: string,
  status: string,             // "selesai"
  createdAt: string (ISO 8601)
}
```

### Penjualan (Existing)
```javascript
{
  id: string,
  tanggal: string,
  anggotaId: string,
  total: number,
  status: string,             // "kredit" or "tunai"
  // ... other fields
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

Sebelum mendefinisikan properties, mari kita identifikasi redundansi:

- Property 1.1 (saldo calculation) dan Property 1.2 (saldo update after payment) dapat digabungkan menjadi satu property yang lebih komprehensif tentang perhitungan saldo
- Property 1.3 (display consistency) sudah mencakup verifikasi bahwa display menggunakan perhitungan yang benar
- Property 2.1 (display payment list) dan Property 2.2 (display required fields) dapat digabungkan menjadi satu property tentang kelengkapan data yang ditampilkan
- Property 5.2 (idempotence) dan Property 5.3 (cross-module consistency) dapat digabungkan menjadi satu property tentang konsistensi perhitungan

Setelah eliminasi redundansi, kita akan fokus pada properties yang memberikan nilai validasi unik.

### Correctness Properties

Property 1: Saldo hutang calculation accuracy
*For any* anggota with credit transactions and payments, the calculated saldo hutang should equal total credit transactions minus total completed payments
**Validates: Requirements 1.1, 1.2**

Property 2: Status determination based on saldo
*For any* anggota, the status should be "Lunas" when saldo hutang is zero or negative, and "Belum Lunas" when saldo hutang is greater than zero
**Validates: Requirements 1.4, 1.5**

Property 3: Report display consistency
*For any* anggota in the report, the displayed saldo hutang should match the result from the saldo calculation function
**Validates: Requirements 1.3**

Property 4: Payment history completeness
*For any* anggota with payment history, the displayed payment list should include all completed payments with tanggal, jumlah, and kasir information
**Validates: Requirements 2.1, 2.2**

Property 5: Total pembayaran calculation
*For any* anggota, the total pembayaran should equal the sum of all payment transactions with status "selesai" for that anggota
**Validates: Requirements 3.2**

Property 6: Calculation consistency across modules
*For any* anggota, calling the saldo calculation function multiple times should return the same result, and the result should be consistent across all modules that use it
**Validates: Requirements 5.2, 5.3**

## Error Handling

### Invalid Data Scenarios
1. **Missing anggotaId**: Return 0 for saldo calculation
2. **Invalid payment status**: Only count payments with status "selesai"
3. **Negative amounts**: Validate that payment amounts are positive
4. **Missing localStorage data**: Handle gracefully with empty arrays

### Error Messages
- "Data anggota tidak ditemukan" - when anggotaId is invalid
- "Belum ada pembayaran" - when payment history is empty
- "Gagal memuat data pembayaran" - when localStorage access fails

## Testing Strategy

### Unit Testing
Unit tests will cover:
- Individual calculation functions (hitungSaldoHutang, hitungTotalPembayaranHutang)
- Data retrieval functions (getPembayaranHutangHistory)
- Status determination logic
- Edge cases: empty data, zero saldo, no payments

### Property-Based Testing
Property-based tests will use **fast-check** library (already configured in package.json) with minimum 100 iterations per test.

Each property-based test will be tagged with the format: `**Feature: integrasi-pembayaran-laporan-hutang, Property {number}: {property_text}**`

Properties to test:
1. Saldo calculation accuracy across random credit and payment data
2. Status determination for various saldo values
3. Display consistency between calculation and rendered output
4. Payment history completeness for various payment counts
5. Total pembayaran calculation with mixed payment statuses
6. Calculation idempotence and cross-module consistency

### Integration Testing
- Test full flow: create credit transaction → make payment → verify report shows updated saldo
- Test CSV export includes all required columns with correct data
- Test filter functionality works with integrated payment data

## Implementation Notes

### Code Organization
1. Create or update `js/utils.js` to include shared calculation functions
2. Update `js/pembayaranHutangPiutang.js` to use shared functions
3. Update `js/reports.js` to use shared functions and display payment data
4. Ensure all modules load utils.js before using the functions

### Performance Considerations
- Cache calculation results when rendering large reports
- Use efficient array filtering for payment history
- Consider pagination for large payment histories

### Backward Compatibility
- Existing payment data structure remains unchanged
- Existing report filters continue to work
- New columns are additive, not replacing existing ones

## Migration Plan

1. **Phase 1**: Create shared utility functions
2. **Phase 2**: Update report module to use new calculations
3. **Phase 3**: Add payment history display
4. **Phase 4**: Update CSV export
5. **Phase 5**: Add property-based tests
6. **Phase 6**: Integration testing and validation
