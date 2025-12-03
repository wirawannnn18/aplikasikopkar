# Dokumen Design - Saldo Awal Periode Akuntansi Koperasi

## Overview

Fitur Saldo Awal Periode Akuntansi adalah modul yang memungkinkan administrator koperasi untuk menginput data keuangan awal pada permulaan periode akuntansi baru (biasanya awal tahun buku). Fitur ini terintegrasi penuh dengan sistem Chart of Accounts (COA) dan jurnal yang sudah ada, menggunakan mekanisme double-entry bookkeeping yang konsisten sesuai dengan standar akuntansi koperasi Indonesia.

Modul ini akan menambahkan menu baru di sidebar aplikasi dan menggunakan fungsi-fungsi yang sudah ada seperti `addJurnal()` untuk memastikan semua transaksi tercatat dengan benar dan laporan keuangan tetap akurat. Sistem ini dirancang untuk memberikan titik awal yang akurat untuk periode berjalan dan memastikan kontinuitas pencatatan akuntansi dari periode sebelumnya.

**Design Rationale:** Integrasi penuh dengan sistem existing (COA dan jurnal) dipilih untuk memastikan konsistensi data dan menghindari duplikasi logika. Dengan menggunakan `addJurnal()` yang sudah ada, semua mekanisme update saldo otomatis dan audit trail akan berfungsi dengan baik tanpa perlu implementasi ulang.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Form Input   │  │  Ringkasan   │  │   Import     │      │
│  │ Saldo Awal   │  │  & Validasi  │  │   CSV/Excel  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Saldo Awal Module (saldoAwal.js)                    │   │
│  │  - Input & Validasi                                  │   │
│  │  - Perhitungan Balance                               │   │
│  │  - Integrasi dengan addJurnal()                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ localStorage │  │   COA Array  │  │ Jurnal Array │      │
│  │   Manager    │  │   (Existing) │  │  (Existing)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Integration Points

1. **COA Integration**: Membaca dan memperbarui field `saldo` pada array COA di localStorage
2. **Jurnal Integration**: Menggunakan fungsi `addJurnal()` yang sudah ada di `keuangan.js`
3. **Menu Integration**: Menambahkan menu "Saldo Awal Periode" di sidebar
4. **Report Integration**: Laporan keuangan otomatis memperhitungkan saldo awal

## Components and Interfaces

### 1. Saldo Awal Module (`js/saldoAwal.js`)

File JavaScript baru yang berisi semua fungsi untuk mengelola saldo awal periode.

**Design Rationale:** Modul terpisah dipilih untuk memisahkan concern dan memudahkan maintenance. Semua fungsi terkait saldo awal periode dikelompokkan dalam satu file untuk kohesi yang lebih baik.

#### Main Functions

```javascript
// Render halaman utama saldo awal periode
function renderSaldoAwal()

// Menampilkan form input saldo awal
function showFormSaldoAwal()

// Menyimpan saldo awal periode
function saveSaldoAwal()

// Validasi balance (Debit = Kredit)
function validateBalance(entries)

// Validasi persamaan akuntansi (Aset = Kewajiban + Modal)
function validateAccountingEquation()

// Validasi tanggal periode unik
function validateUniquePeriodDate(tanggal)

// Menampilkan ringkasan saldo awal
function showRingkasanSaldoAwal()

// Import dari CSV/Excel
function importSaldoAwal()

// Edit/Koreksi saldo awal
function editSaldoAwal()

// Generate jurnal pembuka
function generateJurnalPembuka(saldoAwalData)

// Generate jurnal koreksi
function generateJurnalKoreksi(saldoLama, saldoBaru, keterangan)

// Lock/Unlock periode
function togglePeriodeLock()

// Export ke CSV
function exportSaldoAwalCSV()
```

### 2. Data Models

#### SaldoAwalPeriode Object

**Design Rationale:** Object structure dirancang untuk menyimpan semua data saldo awal dalam satu object yang terstruktur, memudahkan export/import dan audit.

```javascript
{
  id: string,                    // ID unik periode (generated)
  tanggalMulai: string,          // ISO date string (Requirements 1.1, 1.2)
  tanggalSelesai: string,        // ISO date string (optional, untuk periode tutup)
  status: string,                // 'aktif' | 'tutup' (Requirements 10.1)
  createdAt: string,             // ISO date string (timestamp pembuatan)
  createdBy: string,             // User ID (untuk audit trail)
  locked: boolean,               // Flag untuk mencegah edit (Requirements 10.5, 11.1)
  jurnalId: string,              // ID jurnal pembuka yang dicatat (Requirements 1.3)
  
  // Saldo per kategori
  kas: number,                   // Saldo kas awal (Requirements 3.1)
  bank: number,                  // Saldo bank awal (Requirements 3.2)
  
  piutangAnggota: Array<{        // Detail piutang per anggota (Requirements 4.2)
    anggotaId: string,
    nama: string,
    nik: string,
    jumlah: number
  }>,
  
  hutangSupplier: Array<{        // Detail hutang per supplier (Requirements 5.2)
    id: string,
    namaSupplier: string,
    jumlah: number
  }>,
  
  persediaan: Array<{            // Detail persediaan per barang (Requirements 6.1, 6.2)
    barangId: string,
    namaBarang: string,
    stok: number,
    hpp: number,                 // Harga pokok per unit
    total: number                // stok × hpp (Requirements 6.3)
  }>,
  
  simpananAnggota: Array<{       // Detail simpanan per anggota (Requirements 7.1)
    anggotaId: string,
    nama: string,
    nik: string,
    simpananPokok: number,       // Requirements 7.2
    simpananWajib: number,       // Requirements 7.3
    simpananSukarela: number     // Requirements 7.4
  }>,
  
  pinjamanAnggota: Array<{       // Detail pinjaman per anggota (Requirements 8.2)
    anggotaId: string,
    nama: string,
    nik: string,
    jumlahPokok: number,
    bunga: number,
    tenor: number,               // dalam bulan
    tanggalJatuhTempo: string,   // ISO date string
    status: string               // 'Aktif' (Requirements 8.6)
  }>,
  
  modalKoperasi: number,         // Modal awal koperasi (Requirements 2.1)
  
  // Summary (calculated fields)
  totalAset: number,             // Sum of all aset accounts (Requirements 10.2)
  totalKewajiban: number,        // Sum of all kewajiban accounts (Requirements 10.2)
  totalModal: number,            // Sum of all modal accounts (Requirements 10.2)
  balance: boolean,              // true jika Aset = Kewajiban + Modal (Requirements 9.5)
  
  // Koreksi history (untuk audit trail)
  koreksi: Array<{               // History koreksi (Requirements 11.2, 11.4)
    tanggal: string,             // ISO date string
    keterangan: string,          // Alasan koreksi
    jurnalId: string,            // ID jurnal koreksi
    userId: string               // User yang melakukan koreksi
  }>
}
```

#### Jurnal Entry Format (Existing)

```javascript
{
  id: string,
  tanggal: string,               // ISO date string
  keterangan: string,
  entries: Array<{
    akun: string,                // Kode akun dari COA
    debit: number,
    kredit: number
  }>
}
```

### 3. UI Components

**Design Rationale:** Form wizard dipilih untuk memecah proses input yang kompleks menjadi langkah-langkah yang lebih mudah dikelola. Setiap step fokus pada satu kategori akun untuk mengurangi cognitive load pada administrator.

#### Form Input Saldo Awal

Form wizard dengan beberapa step:
1. **Step 1**: Input tanggal periode dan modal awal
   - Validasi tanggal unik (tidak duplikat dengan periode sebelumnya)
   - Validasi modal positif (> 0)
2. **Step 2**: Input kas, bank, dan persediaan
   - Daftar barang dari localStorage untuk input stok
   - Perhitungan otomatis nilai persediaan (stok × hpp)
3. **Step 3**: Input piutang anggota
   - Daftar anggota dari localStorage
   - Input per anggota dengan NIK, nama, dan jumlah
4. **Step 4**: Input hutang supplier
   - Form dinamis untuk menambah multiple supplier
   - Input nama supplier dan jumlah hutang
5. **Step 5**: Input simpanan anggota
   - Daftar anggota dengan kolom simpanan pokok, wajib, sukarela
   - Perhitungan otomatis total per jenis simpanan
6. **Step 6**: Input pinjaman anggota
   - Form untuk menambah pinjaman per anggota
   - Input detail: NIK, jumlah pokok, bunga, tenor, tanggal jatuh tempo
7. **Step 7**: Ringkasan dan validasi balance
   - Tampilan summary semua input
   - Validasi double-entry (Debit = Kredit)
   - Validasi persamaan akuntansi (Aset = Kewajiban + Modal)
   - Tampilan selisih jika tidak balance

#### Ringkasan Saldo Awal

Dashboard yang menampilkan:
- Informasi periode (tanggal mulai, tanggal selesai, status aktif/tutup)
- Summary cards (Total Aset, Kewajiban, Modal)
- Tabel rincian per kategori akun dengan saldo dari COA:
  - Kas (1-1000)
  - Bank (1-1100)
  - Piutang Anggota (1-1200)
  - Persediaan (1-1300)
  - Hutang Supplier (2-1000)
  - Simpanan Pokok/Wajib/Sukarela (2-1100/2-1200/2-1300)
  - Modal Koperasi (3-1000)
- Indikator balance (✓ Balance / ✗ Tidak Balance)
- Tombol aksi (Edit, Lock/Unlock, Export CSV)

#### Import CSV/Excel

**Design Rationale:** Import feature dirancang untuk mempercepat input data dalam jumlah besar, dengan preview dan validasi untuk mencegah kesalahan.

- Upload file interface (support CSV dan Excel)
- Validasi format file dan struktur kolom (kode akun, nama akun, tipe, saldo)
- Preview data dalam bentuk tabel sebelum import
- Validasi per baris (kode akun harus ada di COA)
- Progress indicator saat processing
- Summary hasil import:
  - Jumlah data berhasil
  - Jumlah data gagal
  - Daftar error dengan detail baris dan alasan kegagalan

## Integration with Existing Systems

**Design Rationale:** Integrasi penuh dengan sistem existing memastikan data consistency dan menghindari data silos. Semua perubahan saldo awal akan otomatis tercermin di semua laporan.

### Integration dengan Jurnal System (Requirements 13.1, 13.2, 13.3, 13.7)

- **Jurnal Pembuka**: Menggunakan `addJurnal()` dari `keuangan.js` untuk mencatat semua saldo awal
- **Keterangan**: Jurnal pembuka menggunakan keterangan "Saldo Awal Periode"
- **Jurnal Koreksi**: Menggunakan `addJurnal()` dengan keterangan "Koreksi Saldo Awal" + alasan
- **Audit Trail**: Semua perubahan tercatat di array jurnal untuk audit trail
- **Automatic COA Update**: addJurnal() otomatis update field saldo di COA

### Integration dengan COA System (Requirements 1.4, 13.2)

- **Read COA**: Membaca daftar akun dari array COA di localStorage
- **Update Saldo**: Memperbarui field saldo pada akun melalui addJurnal()
- **Specific Accounts**: 
  - Kas: 1-1000
  - Bank: 1-1100
  - Piutang Anggota: 1-1200
  - Persediaan: 1-1300
  - Hutang Supplier: 2-1000
  - Simpanan Pokok: 2-1100
  - Simpanan Wajib: 2-1200
  - Simpanan Sukarela: 2-1300
  - Modal Koperasi: 3-1000
  - Piutang Pinjaman: (dynamic, created if not exists)

### Integration dengan Laporan Keuangan (Requirements 13.4, 13.5, 13.6)

- **Buku Besar**: Transaksi saldo awal muncul sebagai baris pertama per akun
- **Jurnal Harian**: Jurnal pembuka muncul bersama jurnal transaksi lainnya
- **Laporan Laba Rugi**: Menghitung pendapatan dan beban dengan memperhitungkan saldo awal dari COA
- **Laporan SHU**: Menggunakan modal awal dari saldo awal periode
- **Neraca**: Menampilkan total aset, kewajiban, dan modal dari saldo COA

### Integration dengan Data Anggota (Requirements 7.2, 7.3, 7.4)

- **Read Anggota**: Membaca daftar anggota dari localStorage
- **Update Simpanan**: Memperbarui field simpananPokok, simpananWajib, simpananSukarela
- **Piutang Awal**: Menyimpan detail piutang per anggota ke array piutangAwal
- **Pinjaman**: Menyimpan detail pinjaman ke array pinjaman dengan status "Aktif"

### Integration dengan Data Barang (Requirements 6.2)

- **Read Barang**: Membaca daftar barang dari array produk
- **Update Stok**: Memperbarui field stok pada setiap produk
- **Nilai Persediaan**: Menghitung total nilai (stok × hpp) dan update akun Persediaan

## Data Models

### localStorage Keys

```javascript
// Key baru yang ditambahkan
'saldoAwalPeriode'      // Object SaldoAwalPeriode
'periodeAktif'          // Boolean flag
'piutangAwal'           // Array piutang awal per anggota
'hutangAwal'            // Array hutang awal per supplier

// Key yang sudah ada (digunakan)
'coa'                   // Array Chart of Accounts
'jurnal'                // Array jurnal entries
'anggota'               // Array data anggota
'barang'                // Array data barang
'koperasi'              // Object data koperasi
```

### COA Structure (Existing)

```javascript
{
  kode: string,          // e.g., '1-1000'
  nama: string,          // e.g., 'Kas'
  tipe: string,          // 'Aset' | 'Kewajiban' | 'Modal' | 'Pendapatan' | 'Beban'
  saldo: number          // Saldo akun (akan diupdate oleh saldo awal)
}
```

## Error Handling

**Design Rationale:** Error handling dirancang dengan prinsip fail-fast untuk mencegah data yang tidak valid masuk ke sistem. Setiap validasi memberikan feedback yang jelas kepada user tentang masalah dan cara memperbaikinya.

### Validation Errors

1. **Tanggal Periode Duplikat** (Requirements 1.2)
   - Error: "Periode dengan tanggal ini sudah ada"
   - Action: Tampilkan alert, prevent save, highlight field tanggal
   - Validation: Check localStorage untuk tanggal periode yang sudah ada

2. **Balance Tidak Seimbang** (Requirements 9.2, 9.4)
   - Error: "Total Debit tidak sama dengan Total Kredit. Selisih: Rp X"
   - Action: Tampilkan alert dengan detail selisih, prevent pemanggilan addJurnal()
   - Validation: Hitung total debit dan kredit dari entries jurnal pembuka

3. **Persamaan Akuntansi Tidak Terpenuhi** (Requirements 9.5)
   - Error: "Aset ≠ Kewajiban + Modal. Selisih: Rp X"
   - Action: Tampilkan alert dengan detail, prevent save
   - Validation: Hitung total saldo per tipe akun dari COA

4. **Nilai Tidak Positif** (Requirements 2.2, 3.3)
   - Error: "Nilai harus positif atau nol"
   - Action: Tampilkan alert, reset field, focus ke field yang error
   - Validation: Check semua input saldo (kas, bank, modal, piutang, hutang, persediaan, simpanan, pinjaman)

5. **Akun COA Tidak Ditemukan** (Requirements 12.7)
   - Error: "Akun dengan kode X tidak ditemukan di COA"
   - Action: Tampilkan alert, skip entry tersebut, catat di error log
   - Validation: Check kode akun di array COA localStorage

6. **Format File Import Salah** (Requirements 12.2)
   - Error: "Format file tidak valid. Gunakan template yang disediakan"
   - Action: Tampilkan alert, reject upload, tampilkan link download template
   - Validation: Check struktur kolom (kode akun, nama akun, tipe, saldo)

### Runtime Errors

1. **localStorage Full**
   - Error: "Penyimpanan penuh. Hapus data lama atau export ke file"
   - Action: Tampilkan alert dengan saran, offer export option
   - Recovery: Provide export functionality untuk backup data

2. **Data Corruption**
   - Error: "Data rusak. Restore dari backup atau input ulang"
   - Action: Tampilkan alert, offer reset option
   - Recovery: Provide option untuk clear corrupted data

3. **addJurnal() Failure**
   - Error: "Gagal mencatat jurnal. Coba lagi atau hubungi administrator"
   - Action: Tampilkan alert, rollback changes, log error
   - Recovery: Ensure data consistency dengan rollback mechanism

### User Errors

1. **Edit Periode yang Sudah Dikunci** (Requirements 11.3)
   - Warning: "Periode sudah dikunci. Yakin ingin membuka kunci?"
   - Action: Tampilkan konfirmasi dialog dengan penjelasan konsekuensi
   - Validation: Check flag periodeAktif dari localStorage

2. **Input Nilai Negatif**
   - Error: "Nilai tidak boleh negatif"
   - Action: Tampilkan alert, reset field, focus ke field yang error
   - Validation: Check nilai input sebelum processing

3. **Koreksi Tanpa Keterangan** (Requirements 11.4)
   - Warning: "Masukkan keterangan alasan koreksi"
   - Action: Tampilkan prompt untuk input keterangan
   - Validation: Require keterangan untuk audit trail

## Testing Strategy

### Unit Testing

Unit tests akan menggunakan framework testing JavaScript seperti Jest atau Mocha untuk memverifikasi fungsi-fungsi individual.

**Test Cases:**

1. **Test Input Validation**
   - Test bahwa tanggal periode tidak boleh duplikat
   - Test bahwa nilai saldo harus positif atau nol
   - Test bahwa format tanggal valid

2. **Test Balance Calculation**
   - Test perhitungan total debit dan kredit
   - Test validasi balance (debit = kredit)
   - Test perhitungan persamaan akuntansi (Aset = Kewajiban + Modal)

3. **Test Data Persistence**
   - Test penyimpanan ke localStorage
   - Test pembacaan dari localStorage
   - Test update data yang sudah ada

4. **Test Integration dengan COA**
   - Test update saldo akun di COA
   - Test pencarian akun berdasarkan kode
   - Test handling akun yang tidak ditemukan

5. **Test Integration dengan Jurnal**
   - Test pemanggilan fungsi addJurnal()
   - Test format entries jurnal yang benar
   - Test jurnal koreksi

6. **Test Import CSV**
   - Test parsing file CSV valid
   - Test handling file dengan format salah
   - Test handling baris dengan data invalid

### Property-Based Testing

Property-based tests akan menggunakan library seperti **fast-check** untuk JavaScript untuk memverifikasi properti universal yang harus berlaku di semua kondisi.

**Configuration:**
- Minimum 100 iterations per property test
- Setiap test akan diberi tag dengan format: `**Feature: saldo-awal-periode, Property X: [property text]**`



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Double-Entry Balance

*For any* saldo awal periode yang disimpan, total debit harus sama dengan total kredit dalam jurnal pembuka yang dihasilkan.

**Validates: Requirements 9.1, 9.2, 9.3**

### Property 2: Accounting Equation Balance

*For any* saldo awal periode yang valid, persamaan akuntansi harus terpenuhi: Total Aset = Total Kewajiban + Total Modal (dengan mengambil saldo dari array COA).

**Validates: Requirements 9.5**

### Property 3: COA Synchronization

*For any* akun yang diinput dalam saldo awal, field saldo pada akun tersebut di array COA localStorage harus sama dengan nilai yang diinput.

**Validates: Requirements 1.4, 2.3, 3.1, 3.2, 4.3, 5.3, 6.4, 7.5, 8.4**

### Property 4: Jurnal Integration

*For any* saldo awal periode yang disimpan, harus ada jurnal entry di array jurnal localStorage dengan keterangan "Saldo Awal Periode" yang dicatat menggunakan fungsi addJurnal().

**Validates: Requirements 1.3, 13.1**

### Property 5: Positive Value Validation

*For any* input nilai saldo (kas, bank, modal, piutang, hutang, persediaan, simpanan, pinjaman), sistem harus menolak nilai negatif dan hanya menerima nilai positif atau nol.

**Validates: Requirements 2.2, 3.3**

### Property 6: Unique Period Date

*For any* tanggal periode yang diinput, jika tanggal tersebut sudah digunakan untuk periode sebelumnya, sistem harus menolak input dan menampilkan error.

**Validates: Requirements 1.2**

### Property 7: Piutang Aggregation

*For any* kumpulan piutang per anggota yang diinput, total piutang harus sama dengan saldo akun Piutang Anggota (1-1200) di array COA.

**Validates: Requirements 4.3**

### Property 8: Hutang Aggregation

*For any* kumpulan hutang per supplier yang diinput, total hutang harus sama dengan saldo akun Hutang Supplier (2-1000) di array COA.

**Validates: Requirements 5.3**

### Property 9: Persediaan Calculation

*For any* kumpulan barang dengan stok awal, total nilai persediaan (sum of stok × hpp per barang) harus sama dengan saldo akun Persediaan Barang (1-1300) di array COA.

**Validates: Requirements 6.3, 6.4**

### Property 10: Simpanan Aggregation

*For any* kumpulan simpanan anggota yang diinput, total simpanan pokok harus sama dengan saldo akun Simpanan Pokok (2-1100), total simpanan wajib harus sama dengan saldo akun Simpanan Wajib (2-1200), dan total simpanan sukarela harus sama dengan saldo akun Simpanan Sukarela (2-1300) di array COA.

**Validates: Requirements 7.5**

### Property 11: Correction Journal Audit Trail

*For any* perubahan saldo awal yang dilakukan setelah periode aktif, sistem harus membuat jurnal koreksi menggunakan addJurnal() dengan keterangan "Koreksi Saldo Awal" dan menghitung selisih antara saldo lama dan baru.

**Validates: Requirements 2.5, 11.2, 11.4, 13.7**

### Property 12: Import Data Integrity

*For any* file CSV/Excel yang diimport, setiap baris dengan kode akun yang valid harus memperbarui saldo akun tersebut di COA, dan baris dengan kode akun tidak valid harus ditolak dengan error message yang jelas.

**Validates: Requirements 12.2, 12.4, 12.7**

### Property 13: Report Integration Consistency

*For any* saldo awal periode yang disimpan, laporan Laba Rugi harus menampilkan modal awal yang sama dengan yang tersimpan, dan laporan SHU harus menggunakan modal awal dari saldo awal periode.

**Validates: Requirements 2.4, 13.5, 13.6**

### Property 14: Locked Period Protection

*For any* periode yang sudah dikunci (periodeAktif = true), sistem harus mencegah perubahan langsung pada saldo awal dan hanya mengizinkan perubahan melalui jurnal koreksi.

**Validates: Requirements 10.5, 11.1, 11.3**

### Property 15: Stok Update Synchronization

*For any* barang yang diinput stok awalnya, field stok pada objek barang di array produk localStorage harus terupdate sesuai dengan nilai stok awal yang diinput.

**Validates: Requirements 6.2**

### Property 16: Simpanan Field Update

*For any* anggota yang diinput simpanannya, field simpananPokok, simpananWajib, dan simpananSukarela pada objek anggota di array anggota localStorage harus terupdate sesuai dengan nilai yang diinput.

**Validates: Requirements 7.2, 7.3, 7.4**

### Property 17: Pinjaman Data Persistence

*For any* pinjaman anggota yang diinput sebagai saldo awal, detail pinjaman (NIK, jumlah pokok, bunga, tenor, tanggal jatuh tempo) harus tersimpan lengkap di array pinjaman localStorage dengan status "Aktif".

**Validates: Requirements 8.2, 8.6**

### Property 18: Import Batch Processing

*For any* file import yang valid, sistem harus memproses semua baris, mencatat jurnal pembuka menggunakan addJurnal() dengan entries dari semua akun, dan menampilkan ringkasan jumlah data yang berhasil dan gagal.

**Validates: Requirements 12.4, 12.5, 12.6**

### Property 19: Buku Besar First Entry

*For any* akun yang memiliki saldo awal, ketika administrator melihat Buku Besar, transaksi saldo awal harus muncul sebagai baris pertama untuk akun tersebut.

**Validates: Requirements 13.4**

### Property 20: Jurnal Harian Visibility

*For any* jurnal pembuka saldo awal yang dicatat, ketika administrator melihat menu Jurnal Harian, jurnal tersebut harus muncul bersama dengan jurnal transaksi lainnya dari array jurnal localStorage.

**Validates: Requirements 13.3**



**Property-Based Testing Library:**
- **fast-check** untuk JavaScript/Node.js environment
- Minimum 100 iterations per property test
- Setiap property test akan diberi tag dengan format: `**Feature: saldo-awal-periode, Property X: [property text]**`

**Test Tagging Convention:**
```javascript
// Example:
test('**Feature: saldo-awal-periode, Property 1: Double-Entry Balance**', () => {
  fc.assert(
    fc.property(fc.array(fc.record({...})), (entries) => {
      // Test implementation
    }),
    { numRuns: 100 }
  );
});
```

**Property Test Coverage:**
- Property 1-20 akan diimplementasikan sebagai property-based tests
- Setiap property akan memiliki generator yang menghasilkan random test data
- Generator akan menghasilkan data yang valid dan edge cases

**Unit Test Coverage:**
- Form validation functions
- Balance calculation functions
- Data transformation functions
- CSV/Excel parsing functions
- Error handling scenarios

**Integration Test Coverage:**
- Integration dengan addJurnal()
- Integration dengan COA updates
- Integration dengan laporan keuangan
- End-to-end flow dari input sampai laporan

## Implementation Notes

**Design Rationale:** Implementation dibagi dalam fase-fase untuk memastikan core functionality stabil sebelum menambahkan fitur advanced. Setiap fase dapat di-test secara independen.

### Phase 1: Core Functionality
1. Create `js/saldoAwal.js` file
2. Add menu "Saldo Awal Periode" to sidebar
3. Implement basic form wizard (7 steps)
4. Implement data structures (SaldoAwalPeriode object)
5. Initialize localStorage keys (saldoAwalPeriode, periodeAktif, piutangAwal, hutangAwal)
6. Implement COA integration (read and update saldo field)
7. Implement jurnal integration using addJurnal() from keuangan.js

**Key Decision:** Menggunakan addJurnal() yang sudah ada memastikan konsistensi dengan sistem existing dan menghindari duplikasi logika update saldo.

### Phase 2: Validation & Balance
1. Implement validateBalance() untuk double-entry validation (Requirements 9.1, 9.2, 9.3)
2. Implement validateAccountingEquation() untuk persamaan akuntansi (Requirements 9.5)
3. Implement validateUniquePeriodDate() untuk tanggal unik (Requirements 1.2)
4. Implement positive value validation untuk semua input (Requirements 2.2, 3.3)
5. Implement error handling dengan clear error messages
6. Implement user feedback (alerts, highlights, focus management)

**Key Decision:** Validasi dilakukan di client-side untuk immediate feedback, dengan fail-fast approach untuk mencegah data invalid.

### Phase 3: Input Components
1. Implement input modal awal (Requirements 2.1-2.5)
2. Implement input kas dan bank (Requirements 3.1-3.5)
3. Implement input persediaan dengan stok update (Requirements 6.1-6.6)
4. Implement input piutang anggota (Requirements 4.1-4.6)
5. Implement input hutang supplier (Requirements 5.1-5.6)
6. Implement input simpanan anggota (Requirements 7.1-7.7)
7. Implement input pinjaman anggota (Requirements 8.1-8.6)

**Key Decision:** Setiap kategori input memperbarui field spesifik di localStorage (stok di produk, simpanan di anggota, dll) untuk sinkronisasi data.

### Phase 4: Advanced Features
1. Implement ringkasan dan summary (Requirements 10.1-10.5)
2. Implement edit/correction dengan jurnal koreksi (Requirements 11.1-11.5)
3. Implement period locking mechanism (Requirements 10.5, 11.1, 11.3)
4. Implement export CSV (Requirements 10.4)
5. Implement import CSV/Excel dengan preview dan validasi (Requirements 12.1-12.7)

**Key Decision:** Edit menggunakan jurnal koreksi untuk maintain audit trail, bukan direct update saldo.

### Phase 5: Integration & Reports
1. Verify integration dengan Laporan Laba Rugi (Requirements 2.4, 13.5)
2. Verify integration dengan Laporan SHU (Requirements 13.6)
3. Verify integration dengan Jurnal Harian (Requirements 13.3)
4. Verify integration dengan Buku Besar (Requirements 13.4)
5. Update report functions jika diperlukan untuk better integration

**Key Decision:** Laporan existing sudah membaca dari COA dan jurnal, sehingga minimal changes diperlukan.

### Phase 6: Testing
1. Write unit tests untuk validation functions
2. Write property-based tests untuk 20 correctness properties
3. Write integration tests untuk end-to-end flows
4. Test edge cases (nilai 0, nilai besar, banyak anggota, dll)
5. Test error handling scenarios

### Dependencies

**External Libraries:**
- Bootstrap 5.3.0 (already included) - untuk UI components
- Bootstrap Icons (already included) - untuk icons
- fast-check (for property-based testing) - untuk testing correctness properties

**Internal Dependencies:**
- `js/keuangan.js` - untuk fungsi addJurnal() (Requirements 13.1, 13.2)
- `js/app.js` - untuk utility functions (formatRupiah, formatDate, generateId, showAlert)
- localStorage - untuk data persistence semua data

**Design Rationale:** Dependency pada addJurnal() dipilih untuk memastikan semua jurnal tercatat dengan mekanisme yang sama, sehingga update saldo COA otomatis dan konsisten.

### Browser Compatibility

- Modern browsers with localStorage support (Chrome, Firefox, Edge, Safari)
- FileReader API support for CSV/Excel import (Requirements 12.3)
- ES6+ JavaScript features (arrow functions, template literals, destructuring)

### Performance Considerations

**Design Rationale:** Performance optimization fokus pada localStorage management dan rendering efficiency untuk handling data dalam jumlah besar.

1. **localStorage Limits**: 
   - Monitor localStorage usage (typical limit 5-10MB)
   - Implement data cleanup untuk old periods
   - Provide export functionality untuk archiving

2. **Large Imports** (Requirements 12.4):
   - Process CSV/Excel in chunks (batch size 100 rows)
   - Show progress indicator untuk user feedback
   - Implement cancellation mechanism

3. **COA Updates**:
   - Batch update COA to minimize localStorage writes
   - Use single addJurnal() call dengan multiple entries instead of multiple calls

4. **Rendering**:
   - Use pagination untuk large data tables (50 rows per page)
   - Implement lazy loading untuk daftar anggota/barang
   - Use document fragments untuk batch DOM updates

### Security Considerations

**Design Rationale:** Security measures fokus pada input validation dan data integrity untuk mencegah corruption dan XSS attacks.

1. **Input Validation** (Requirements 2.2, 3.3, 9.1-9.5):
   - Validate all user inputs before processing
   - Check data types (number, string, date)
   - Validate ranges (positive values, valid dates)
   - Sanitize string inputs

2. **XSS Prevention**:
   - Sanitize all user inputs before rendering to DOM
   - Use textContent instead of innerHTML where possible
   - Escape special characters in user-provided strings

3. **Data Integrity**:
   - Validate data structure before saving to localStorage
   - Implement checksums untuk detect corruption
   - Provide rollback mechanism on errors

4. **Access Control**:
   - Check user role before allowing saldo awal operations
   - Implement period locking untuk prevent unauthorized changes (Requirements 10.5, 11.3)
   - Log all changes untuk audit trail (Requirements 11.4, 13.7)

### Accessibility

**Design Rationale:** Accessibility features memastikan aplikasi dapat digunakan oleh semua user termasuk yang menggunakan assistive technologies.

1. **Keyboard Navigation**: 
   - Ensure all forms are keyboard accessible (Tab, Enter, Escape)
   - Implement keyboard shortcuts untuk common actions
   - Proper tab order dalam wizard steps

2. **Screen Reader Support**: 
   - Add proper ARIA labels untuk form fields
   - Use semantic HTML elements
   - Provide ARIA live regions untuk dynamic content

3. **Error Messages**: 
   - Provide clear, descriptive error messages
   - Associate error messages dengan form fields
   - Use color + text untuk indicate errors (not color alone)

4. **Focus Management**: 
   - Manage focus properly in modals and forms
   - Return focus to trigger element when closing modals
   - Highlight focused elements clearly

### Localization

**Design Rationale:** Aplikasi menggunakan format Indonesia untuk memudahkan user lokal memahami data keuangan.

- All text in Indonesian (Bahasa Indonesia)
- Currency format: Indonesian Rupiah (IDR) - Rp 1.000.000,00
- Date format: Indonesian format (DD/MM/YYYY or DD MMMM YYYY)
- Number format: Indonesian format (1.000.000,00)
- Decimal separator: comma (,)
- Thousand separator: period (.)

## Key Design Decisions Summary

1. **Full Integration with Existing Systems**: Menggunakan `addJurnal()` yang sudah ada untuk semua pencatatan jurnal memastikan konsistensi data dan audit trail yang baik. Semua update saldo COA dilakukan melalui mekanisme existing.

2. **Form Wizard Approach**: Memecah input kompleks menjadi 7 steps yang fokus pada satu kategori per step mengurangi cognitive load dan memudahkan validasi per step.

3. **Double-Entry Validation**: Implementasi validasi double-entry (Debit = Kredit) dan persamaan akuntansi (Aset = Kewajiban + Modal) sebelum save memastikan data integrity sejak awal.

4. **Period Locking Mechanism**: Flag `periodeAktif` dan `locked` mencegah perubahan langsung pada periode aktif, memaksa penggunaan jurnal koreksi untuk maintain audit trail.

5. **Correction via Journal Entries**: Semua koreksi dilakukan melalui jurnal koreksi (bukan direct update) untuk maintain complete audit trail sesuai standar akuntansi.

6. **Data Synchronization**: Update field spesifik di berbagai localStorage arrays (stok di produk, simpanan di anggota) memastikan sinkronisasi data across modules.

7. **Import with Preview**: Import CSV/Excel dengan preview dan validasi per-row mencegah kesalahan massal dan memberikan feedback yang jelas tentang data yang bermasalah.

8. **Fail-Fast Validation**: Validasi dilakukan di setiap step dengan immediate feedback mencegah user melanjutkan dengan data yang invalid.

9. **Property-Based Testing**: Menggunakan fast-check untuk test 20 correctness properties dengan minimum 100 iterations memastikan robustness across berbagai input scenarios.

10. **Comprehensive Error Handling**: Error handling yang detail dengan clear messages dan recovery options membantu user memperbaiki masalah dengan cepat.

