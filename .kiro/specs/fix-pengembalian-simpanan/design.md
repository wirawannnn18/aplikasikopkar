# Design Document

## Overview

Dokumen ini merancang solusi untuk memperbaiki proses pengembalian simpanan anggota keluar. Saat ini, sistem memiliki beberapa masalah:

1. Saldo simpanan anggota keluar tidak di-zero-kan setelah pengembalian
2. Anggota keluar masih muncul di master anggota
3. Anggota keluar masih bisa melakukan transaksi
4. Tidak ada surat bukti pengunduran diri yang bisa di-print

Solusi yang dirancang akan:
- Mengupdate saldo simpanan menjadi 0 setelah pengembalian diproses
- Memfilter anggota keluar dari master anggota
- Menambahkan validasi untuk mencegah transaksi anggota keluar
- Menyediakan fitur cetak surat pengunduran diri

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         UI Layer                             │
├─────────────────────────────────────────────────────────────┤
│  - Master Anggota (Filter Keluar)                           │
│  - Anggota Keluar Menu                                       │
│  - Pengembalian Simpanan Form                                │
│  - Surat Pengunduran Diri (Print)                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                      │
├─────────────────────────────────────────────────────────────┤
│  - processPengembalian() - Update saldo simpanan            │
│  - validateTransaction() - Cek status anggota               │
│  - generateSuratPengunduranDiri() - Generate dokumen        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
├─────────────────────────────────────────────────────────────┤
│  - localStorage: anggota                                     │
│  - localStorage: simpananPokok                               │
│  - localStorage: simpananWajib                               │
│  - localStorage: simpananSukarela                            │
│  - localStorage: pengembalian                                │
│  - localStorage: jurnal                                      │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
User Action: Proses Pengembalian
        │
        ▼
┌──────────────────────┐
│ Pengembalian Form    │
│ (UI)                 │
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│ processPengembalian()│ ──────┐
│ (Business Logic)     │       │
└──────────────────────┘       │
        │                       │
        ├─── 1. Validate       │
        ├─── 2. Calculate      │
        ├─── 3. Create Jurnal  │
        ├─── 4. Zero Saldo ────┤ Update simpananPokok
        ├─── 5. Update Status  │ Update simpananWajib
        └─── 6. Save Record    │ Update simpananSukarela
                               │
                               ▼
                    ┌──────────────────────┐
                    │ localStorage         │
                    └──────────────────────┘
```

## Components and Interfaces

### 1. Modified: `processPengembalian()` Function

**Location:** `js/anggotaKeluarManager.js`

**Purpose:** Memproses pengembalian simpanan dan meng-zero-kan saldo

**Signature:**
```javascript
function processPengembalian(anggotaId, metodePembayaran, tanggalPembayaran, keterangan = '')
```

**New Logic:**
```javascript
// After creating journal entries (existing code)
// NEW: Zero out simpanan balances

// 1. Zero simpanan pokok
const simpananPokok = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
const updatedSimpananPokok = simpananPokok.map(s => {
    if (s.anggotaId === anggotaId) {
        return {
            ...s,
            saldoSebelumPengembalian: s.jumlah, // Save historical data
            jumlah: 0, // Zero out balance
            statusPengembalian: 'Dikembalikan',
            pengembalianId: pengembalianId,
            tanggalPengembalian: tanggalPembayaran
        };
    }
    return s;
});
localStorage.setItem('simpananPokok', JSON.stringify(updatedSimpananPokok));

// 2. Zero simpanan wajib
const simpananWajib = JSON.parse(localStorage.getItem('simpananWajib') || '[]');
const updatedSimpananWajib = simpananWajib.map(s => {
    if (s.anggotaId === anggotaId) {
        return {
            ...s,
            saldoSebelumPengembalian: s.jumlah,
            jumlah: 0,
            statusPengembalian: 'Dikembalikan',
            pengembalianId: pengembalianId,
            tanggalPengembalian: tanggalPembayaran
        };
    }
    return s;
});
localStorage.setItem('simpananWajib', JSON.stringify(updatedSimpananWajib));

// 3. Zero simpanan sukarela (if any)
const simpananSukarela = JSON.parse(localStorage.getItem('simpananSukarela') || '[]');
const updatedSimpananSukarela = simpananSukarela.map(s => {
    if (s.anggotaId === anggotaId) {
        return {
            ...s,
            saldoSebelumPengembalian: s.jumlah,
            jumlah: 0,
            statusPengembalian: 'Dikembalikan',
            pengembalianId: pengembalianId,
            tanggalPengembalian: tanggalPembayaran
        };
    }
    return s;
});
localStorage.setItem('simpananSukarela', JSON.stringify(updatedSimpananSukarela));
```

### 2. Modified: `renderTableAnggota()` Function

**Location:** `js/koperasi.js`

**Purpose:** Filter anggota keluar dari master anggota

**Signature:**
```javascript
function renderTableAnggota(filteredData = null)
```

**New Logic:**
```javascript
function renderTableAnggota(filteredData = null) {
    let anggota = filteredData || JSON.parse(localStorage.getItem('anggota') || '[]');
    
    // NEW: Filter out anggota keluar
    anggota = anggota.filter(a => a.statusKeanggotaan !== 'Keluar');
    
    const tbody = document.getElementById('tbodyAnggota');
    // ... rest of existing code
}
```

### 3. Modified: `filterAnggota()` Function

**Location:** `js/koperasi.js`

**Purpose:** Ensure filter also excludes anggota keluar

**New Logic:**
```javascript
function filterAnggota() {
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    
    // ... existing filter logic
    
    let filtered = anggota.filter(a => {
        // NEW: Exclude anggota keluar
        const notKeluar = a.statusKeanggotaan !== 'Keluar';
        
        // ... existing filters
        
        return notKeluar && matchSearch && matchDept && matchTipe && matchStatus && matchDateRange;
    });
    
    // ... rest of existing code
}
```

### 4. New: `validateAnggotaForTransaction()` Function

**Location:** `js/transactionValidator.js` (new file)

**Purpose:** Validate anggota status before any transaction

**Signature:**
```javascript
function validateAnggotaForTransaction(anggotaId)
```

**Implementation:**
```javascript
/**
 * Validate if anggota can perform transactions
 * @param {string} anggotaId - ID of the anggota
 * @returns {object} Validation result
 */
function validateAnggotaForTransaction(anggotaId) {
    try {
        const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
        const member = anggota.find(a => a.id === anggotaId);
        
        if (!member) {
            return {
                valid: false,
                error: 'Anggota tidak ditemukan'
            };
        }
        
        if (member.statusKeanggotaan === 'Keluar') {
            return {
                valid: false,
                error: `Anggota ${member.nama} sudah keluar dari koperasi dan tidak dapat melakukan transaksi`
            };
        }
        
        return {
            valid: true,
            anggota: member
        };
    } catch (error) {
        return {
            valid: false,
            error: 'Terjadi kesalahan saat validasi anggota'
        };
    }
}
```

### 5. Integration Points for Transaction Validation

**Locations to add validation:**

1. **POS Transaction** (`js/koperasi.js` - `addToCart()`)
2. **Kasbon Payment** (`js/koperasi.js` - `saveKasbon()`)
3. **Simpanan** (`js/koperasi.js` - `saveSimpanan()`)
4. **Pinjaman** (`js/koperasi.js` - `savePinjaman()`)

**Example Integration:**
```javascript
function addToCart() {
    const anggotaId = document.getElementById('anggotaSelect').value;
    
    // NEW: Validate anggota status
    const validation = validateAnggotaForTransaction(anggotaId);
    if (!validation.valid) {
        showAlert(validation.error, 'error');
        return;
    }
    
    // ... existing code
}
```

### 6. New: `generateSuratPengunduranDiri()` Function

**Location:** `js/anggotaKeluarUI.js`

**Purpose:** Generate printable resignation letter

**Signature:**
```javascript
function generateSuratPengunduranDiri(anggotaId, pengembalianId)
```

**Implementation:**
```javascript
/**
 * Generate surat pengunduran diri for printing
 * @param {string} anggotaId - ID of the anggota
 * @param {string} pengembalianId - ID of the pengembalian record
 */
function generateSuratPengunduranDiri(anggotaId, pengembalianId) {
    try {
        // Get data
        const anggota = getAnggotaById(anggotaId);
        const pengembalian = JSON.parse(localStorage.getItem('pengembalian') || '[]')
            .find(p => p.id === pengembalianId);
        const koperasi = JSON.parse(localStorage.getItem('koperasi') || '{}');
        
        if (!anggota || !pengembalian) {
            showAlert('Data tidak ditemukan', 'error');
            return;
        }
        
        // Generate HTML for printing
        const suratHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Surat Pengunduran Diri - ${anggota.nama}</title>
                <style>
                    @media print {
                        body { margin: 0; padding: 20mm; }
                        .no-print { display: none; }
                    }
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .logo { max-width: 100px; margin-bottom: 10px; }
                    .title { font-size: 18px; font-weight: bold; text-decoration: underline; }
                    .content { margin: 20px 0; }
                    .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    .table td { padding: 8px; border: 1px solid #ddd; }
                    .table td:first-child { width: 40%; font-weight: bold; }
                    .signature { margin-top: 50px; display: flex; justify-content: space-between; }
                    .signature-box { text-align: center; width: 40%; }
                    .signature-line { border-top: 1px solid #000; margin-top: 80px; padding-top: 5px; }
                </style>
            </head>
            <body>
                <div class="header">
                    ${koperasi.logo ? `<img src="${koperasi.logo}" class="logo" alt="Logo">` : ''}
                    <h2>${koperasi.nama || 'KOPERASI'}</h2>
                    <p>${koperasi.alamat || ''}</p>
                    <p>Telp: ${koperasi.telepon || '-'}</p>
                    <hr>
                    <h3 class="title">SURAT KETERANGAN PENGUNDURAN DIRI</h3>
                    <p>No: ${pengembalian.nomorReferensi}</p>
                </div>
                
                <div class="content">
                    <p>Yang bertanda tangan di bawah ini, Pengurus ${koperasi.nama || 'Koperasi'}, menerangkan bahwa:</p>
                    
                    <table class="table">
                        <tr>
                            <td>Nama</td>
                            <td>${anggota.nama}</td>
                        </tr>
                        <tr>
                            <td>NIK</td>
                            <td>${anggota.nik}</td>
                        </tr>
                        <tr>
                            <td>No. Kartu Anggota</td>
                            <td>${anggota.noKartu}</td>
                        </tr>
                        <tr>
                            <td>Departemen</td>
                            <td>${anggota.departemen || '-'}</td>
                        </tr>
                        <tr>
                            <td>Tanggal Keluar</td>
                            <td>${formatDateToDisplay(anggota.tanggalKeluar)}</td>
                        </tr>
                        <tr>
                            <td>Alasan Keluar</td>
                            <td>${anggota.alasanKeluar || '-'}</td>
                        </tr>
                    </table>
                    
                    <p>Telah mengundurkan diri sebagai anggota koperasi dan telah menerima pengembalian simpanan dengan rincian sebagai berikut:</p>
                    
                    <table class="table">
                        <tr>
                            <td>Simpanan Pokok</td>
                            <td>${formatRupiah(pengembalian.simpananPokok)}</td>
                        </tr>
                        <tr>
                            <td>Simpanan Wajib</td>
                            <td>${formatRupiah(pengembalian.simpananWajib)}</td>
                        </tr>
                        <tr>
                            <td><strong>Total Pengembalian</strong></td>
                            <td><strong>${formatRupiah(pengembalian.totalPengembalian)}</strong></td>
                        </tr>
                        <tr>
                            <td>Metode Pembayaran</td>
                            <td>${pengembalian.metodePembayaran}</td>
                        </tr>
                        <tr>
                            <td>Tanggal Pembayaran</td>
                            <td>${formatDateToDisplay(pengembalian.tanggalPembayaran)}</td>
                        </tr>
                    </table>
                    
                    <p>Demikian surat keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.</p>
                </div>
                
                <div class="signature">
                    <div class="signature-box">
                        <p>Yang Menerima,</p>
                        <div class="signature-line">
                            ${anggota.nama}
                        </div>
                    </div>
                    <div class="signature-box">
                        <p>Pengurus Koperasi,</p>
                        <div class="signature-line">
                            (.................................)
                        </div>
                    </div>
                </div>
                
                <div class="no-print" style="margin-top: 30px; text-align: center;">
                    <button onclick="window.print()" class="btn btn-primary">Cetak</button>
                    <button onclick="window.close()" class="btn btn-secondary">Tutup</button>
                </div>
            </body>
            </html>
        `;
        
        // Open in new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(suratHTML);
        printWindow.document.close();
        
    } catch (error) {
        console.error('Error generating surat:', error);
        showAlert('Gagal membuat surat pengunduran diri', 'error');
    }
}
```

### 7. Modified: Laporan Simpanan Functions

**Location:** `js/koperasi.js`

**Purpose:** Filter out anggota with zero balance

**Functions to modify:**
- `renderLaporanSimpananPokok()`
- `renderLaporanSimpananWajib()`
- `renderLaporanSimpananSukarela()`

**Example:**
```javascript
function renderLaporanSimpananPokok() {
    const simpanan = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
    
    // NEW: Filter only non-zero balances
    const activeSimpanan = simpanan.filter(s => s.jumlah > 0);
    
    // ... render activeSimpanan
}
```

## Data Models

### Modified: Simpanan Data Structure

**Before:**
```javascript
{
    id: string,
    anggotaId: string,
    jumlah: number,
    tanggal: string
}
```

**After:**
```javascript
{
    id: string,
    anggotaId: string,
    jumlah: number, // Will be 0 after pengembalian
    tanggal: string,
    // NEW FIELDS:
    saldoSebelumPengembalian: number, // Historical data
    statusPengembalian: string, // 'Aktif' | 'Dikembalikan'
    pengembalianId: string, // Reference to pengembalian record
    tanggalPengembalian: string // ISO date when returned
}
```

### Existing: Anggota Data Structure

```javascript
{
    id: string,
    nik: string,
    nama: string,
    noKartu: string,
    departemen: string,
    tipeAnggota: string,
    status: string,
    statusKeanggotaan: string, // 'Aktif' | 'Keluar'
    tanggalKeluar: string, // ISO date
    alasanKeluar: string,
    pengembalianStatus: string, // 'Pending' | 'Selesai'
    pengembalianId: string
}
```

### Existing: Pengembalian Data Structure

```javascript
{
    id: string,
    anggotaId: string,
    anggotaNama: string,
    anggotaNIK: string,
    simpananPokok: number,
    simpananWajib: number,
    totalSimpanan: number,
    kewajibanLain: number,
    totalPengembalian: number,
    metodePembayaran: string,
    tanggalPembayaran: string,
    nomorReferensi: string,
    status: string,
    createdAt: string,
    createdBy: string,
    processedAt: string,
    processedBy: string,
    jurnalId: string
}
```

## Error Handling

### Transaction Validation Errors

```javascript
// Error when anggota keluar tries to transact
{
    code: 'ANGGOTA_KELUAR',
    message: 'Anggota [nama] sudah keluar dari koperasi dan tidak dapat melakukan transaksi',
    timestamp: ISO string
}
```

### Pengembalian Processing Errors

```javascript
// Error during pengembalian processing
{
    code: 'PENGEMBALIAN_FAILED',
    message: 'Gagal memproses pengembalian',
    details: error details,
    timestamp: ISO string
}
```

### Rollback on Error

All modifications in `processPengembalian()` are wrapped in try-catch with snapshot/restore:

```javascript
try {
    const snapshot = createSnapshot();
    try {
        // Process pengembalian
        // Zero simpanan
        // Update status
    } catch (innerError) {
        restoreSnapshot(snapshot);
        throw innerError;
    }
} catch (error) {
    return { success: false, error: {...} };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Pengembalian zeros all simpanan balances

*For any* anggota keluar with simpanan, when pengembalian is processed, all simpanan balances (pokok, wajib, sukarela) should be set to 0.

**Validates: Requirements 1.1, 1.2**

### Property 2: Historical data preservation

*For any* simpanan record that is zeroed during pengembalian, the original balance should be preserved in the saldoSebelumPengembalian field.

**Validates: Requirements 1.3**

### Property 3: Pengembalian metadata completeness

*For any* simpanan record after pengembalian, it should have tanggalPengembalian and pengembalianId fields populated.

**Validates: Requirements 1.4, 1.5**

### Property 4: Laporan filters zero balances

*For any* simpanan report (pokok, wajib, sukarela), only records with jumlah > 0 should be displayed.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 5: Total calculation excludes zeros

*For any* collection of simpanan records, the total sum should only include records where jumlah > 0.

**Validates: Requirements 2.4**

### Property 6: Pengembalian makes anggota invisible in reports

*For any* anggota keluar who has received pengembalian, their simpanan records should have jumlah = 0, therefore they should not appear in simpanan reports.

**Validates: Requirements 2.5**

### Property 7: Journal entries for pengembalian

*For any* pengembalian processed, the system should create journal entries with debit on Simpanan Pokok (2-1100) and Simpanan Wajib (2-1200), and credit on Kas or Bank account.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 8: Double-entry balance

*For any* journal entry created during pengembalian, the sum of debit amounts must equal the sum of credit amounts.

**Validates: Requirements 4.4**

### Property 9: Pengembalian references journal

*For any* pengembalian record, it should have a jurnalId field that references the created journal entry.

**Validates: Requirements 4.5**

### Property 10: Master anggota excludes keluar

*For any* set of anggota displayed in master anggota view, none should have statusKeanggotaan = 'Keluar'.

**Validates: Requirements 5.1**

### Property 11: Search excludes anggota keluar

*For any* search query in master anggota, the results should not include any anggota with statusKeanggotaan = 'Keluar'.

**Validates: Requirements 5.2**

### Property 12: Filter excludes anggota keluar

*For any* filter criteria applied in master anggota, the results should not include any anggota with statusKeanggotaan = 'Keluar'.

**Validates: Requirements 5.3**

### Property 13: Count excludes anggota keluar

*For any* anggota collection in master anggota, the total count should exclude those with statusKeanggotaan = 'Keluar'.

**Validates: Requirements 5.4**

### Property 14: Transaction validation blocks anggota keluar

*For any* transaction type (POS, kasbon, simpanan, pinjaman), if the anggota has statusKeanggotaan = 'Keluar', the transaction should be rejected with an appropriate error message.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

### Property 15: Surat contains anggota identity

*For any* surat pengunduran diri generated, the document should contain the anggota's nama, NIK, and noKartu.

**Validates: Requirements 7.2**

### Property 16: Surat contains exit details

*For any* surat pengunduran diri generated, the document should contain tanggalKeluar and alasanKeluar.

**Validates: Requirements 7.3**

### Property 17: Surat contains pengembalian breakdown

*For any* surat pengunduran diri generated, the document should contain simpananPokok, simpananWajib, and totalPengembalian amounts.

**Validates: Requirements 7.4**

### Property 18: Surat contains payment details

*For any* surat pengunduran diri generated, the document should contain nomorReferensi, tanggalPembayaran, and metodePembayaran.

**Validates: Requirements 7.5**

### Property 19: Surat contains koperasi branding

*For any* surat pengunduran diri generated, the document should contain the koperasi logo (if available) and nama koperasi.

**Validates: Requirements 7.6**

### Property 20: Surat contains signature areas

*For any* surat pengunduran diri generated, the HTML should contain designated areas for anggota and koperasi signatures.

**Validates: Requirements 7.7**

### Property 21: Rollback on error preserves data

*For any* pengembalian process that encounters an error, all data (anggota, simpanan, jurnal) should be restored to the state before the process started.

**Validates: Requirements 8.1, 8.2, 8.3**

### Property 22: Failed pengembalian creates audit log

*For any* pengembalian process that fails, an audit log entry should be created documenting the error.

**Validates: Requirements 8.5**

## Testing Strategy

### Unit Tests

1. **Test `processPengembalian()` zeros simpanan**
   - Input: anggotaId with simpanan
   - Expected: All simpanan jumlah = 0

2. **Test `validateAnggotaForTransaction()` blocks keluar**
   - Input: anggotaId with statusKeanggotaan = 'Keluar'
   - Expected: valid = false

3. **Test `renderTableAnggota()` filters keluar**
   - Input: anggota array with some keluar
   - Expected: Only non-keluar rendered

4. **Test `generateSuratPengunduranDiri()` creates document**
   - Input: valid anggotaId and pengembalianId
   - Expected: HTML document generated

### Property-Based Testing

**Framework:** fast-check (JavaScript property-based testing library)

**Configuration:** Each property test should run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Test Tagging:** Each property-based test must include a comment tag in the format:
```javascript
// Feature: fix-pengembalian-simpanan, Property X: [property description]
```

**Implementation Approach:**
- Property tests will be written using fast-check library
- Tests will generate random but valid input data
- Each correctness property will be implemented as a single property-based test
- Tests will verify that properties hold across all generated inputs

