# Implementasi Task 4.1: Implement processPengembalian() Function

## Status: ✅ SELESAI

## Deskripsi
Implementasi fungsi `processPengembalian()` yang menangani proses lengkap pengembalian simpanan kepada anggota yang keluar dari koperasi. Fungsi ini terintegrasi penuh dengan sistem akuntansi double-entry dan mencakup validasi, pencatatan jurnal, update saldo, dan audit trail.

## Requirements yang Divalidasi
- **Requirement 3.2**: Mencatat transaksi pengembalian dengan tanggal, jumlah, dan metode pembayaran
- **Requirement 3.3**: Mengubah status pengembalian menjadi "Selesai"
- **Requirement 3.4**: Mengurangi saldo simpanan pokok menjadi nol
- **Requirement 3.5**: Mengurangi saldo simpanan wajib menjadi nol
- **Requirement 4.1**: Membuat jurnal debit pada akun "Simpanan Pokok Anggota"
- **Requirement 4.2**: Membuat jurnal kredit pada akun "Kas" atau "Bank"
- **Requirement 4.3**: Membuat jurnal debit pada akun "Simpanan Wajib Anggota"
- **Requirement 4.4**: Membuat jurnal kredit pada akun "Kas" atau "Bank"
- **Requirement 4.5**: Menyimpan referensi ke transaksi pengembalian dan ID anggota

## Implementasi

### Function Signature
```javascript
function processPengembalian(anggotaId, metodePembayaran, tanggalPembayaran, keterangan = '')
```

### Parameters
- `anggotaId` (string): ID anggota yang akan diproses pengembaliannya
- `metodePembayaran` (string): "Kas" atau "Transfer Bank"
- `tanggalPembayaran` (string): Tanggal pembayaran dalam format ISO (YYYY-MM-DD)
- `keterangan` (string, optional): Catatan tambahan

### Return Value
```javascript
{
    success: boolean,
    data: {
        pengembalianId: string,
        nomorReferensi: string,
        anggotaId: string,
        anggotaNama: string,
        simpananPokok: number,
        simpananWajib: number,
        totalPengembalian: number,
        metodePembayaran: string,
        tanggalPembayaran: string,
        jurnalId: string,
        status: string
    },
    message: string,
    error: object // jika success = false
}
```

### Alur Proses

#### 1. Create Snapshot (untuk Rollback)
```javascript
const snapshot = createSnapshot();
```
Menyimpan state localStorage sebelum proses dimulai untuk rollback jika terjadi error.

#### 2. Validasi Input Parameters
- Validasi `anggotaId` tidak null dan bertipe string
- Validasi `metodePembayaran` tidak null dan bertipe string
- Validasi `tanggalPembayaran` tidak null dan bertipe string

#### 3. Run Validation Checks
```javascript
const validation = validatePengembalian(anggotaId, metodePembayaran);
```
Menjalankan validasi lengkap:
- Tidak ada pinjaman aktif
- Saldo kas mencukupi
- Metode pembayaran valid

#### 4. Get Anggota dan Calculation Data
```javascript
const anggota = getAnggotaById(anggotaId);
const calculation = calculatePengembalian(anggotaId);
```
Mengambil data anggota dan menghitung total pengembalian.

#### 5. Create Pengembalian Record
```javascript
const pengembalianRecord = {
    id: pengembalianId,
    anggotaId: anggotaId,
    anggotaNama: anggota.nama,
    anggotaNIK: anggota.nik,
    simpananPokok: simpananPokok,
    simpananWajib: simpananWajib,
    totalSimpanan: simpananPokok + simpananWajib,
    kewajibanLain: calculation.data.kewajibanLain,
    keterangan: keterangan || '',
    totalPengembalian: totalPengembalian,
    metodePembayaran: metodePembayaran,
    tanggalPembayaran: tanggalPembayaran,
    nomorReferensi: nomorReferensi,
    status: 'Diproses',
    createdAt: new Date().toISOString(),
    createdBy: currentUser.id || 'system',
    processedAt: null,
    processedBy: null,
    jurnalId: null
};
```

Format nomor referensi: `PGM-YYYYMM-{8 digit ID}`
Contoh: `PGM-202412-a1b2c3d4`

#### 6. Generate Journal Entries (Double-Entry)

**Untuk Simpanan Pokok:**
```javascript
{
    akun: '2-1100', // Simpanan Pokok (Kewajiban)
    debit: simpananPokok,
    kredit: 0
}
```

**Untuk Simpanan Wajib:**
```javascript
{
    akun: '2-1200', // Simpanan Wajib (Kewajiban)
    debit: simpananWajib,
    kredit: 0
}
```

**Untuk Kas/Bank:**
```javascript
{
    akun: kasAccount, // '1-1000' (Kas) atau '1-1100' (Bank)
    debit: 0,
    kredit: totalPengembalian
}
```

**Validasi Balance:**
```javascript
const totalDebit = jurnalEntries.reduce((sum, e) => sum + e.debit, 0);
const totalKredit = jurnalEntries.reduce((sum, e) => sum + e.kredit, 0);

if (Math.abs(totalDebit - totalKredit) > 0.01) {
    throw new Error('Journal entries tidak seimbang');
}
```

#### 7. Save Journal Entries
Menggunakan fungsi `addJurnal()` yang sudah ada di `keuangan.js`:
```javascript
addJurnal(
    `Pengembalian Simpanan - ${anggota.nama} (${nomorReferensi})`,
    jurnalEntries,
    tanggalPembayaran
);
```

Fungsi ini otomatis:
- Menyimpan jurnal ke localStorage
- Update saldo COA sesuai tipe akun

#### 8. Update Simpanan Balances to Zero
Saldo simpanan menjadi nol secara otomatis melalui jurnal entries yang telah dibuat. Tidak perlu menghapus record simpanan, hanya jurnal yang mengupdate saldo COA.

#### 9. Update Pengembalian Status to "Selesai"
```javascript
pengembalianRecord.status = 'Selesai';
pengembalianRecord.processedAt = new Date().toISOString();
pengembalianRecord.processedBy = currentUser.id || 'system';
pengembalianRecord.jurnalId = jurnalId;
```

#### 10. Update Anggota Status
```javascript
anggotaList[anggotaIndex].pengembalianStatus = 'Selesai';
anggotaList[anggotaIndex].pengembalianId = pengembalianId;
```

#### 11. Create Audit Log Entry
```javascript
const auditLog = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    userId: currentUser.id || 'system',
    userName: currentUser.username || 'System',
    action: 'PROSES_PENGEMBALIAN',
    anggotaId: anggotaId,
    anggotaNama: anggota.nama,
    details: {
        pengembalianId: pengembalianId,
        nomorReferensi: nomorReferensi,
        simpananPokok: simpananPokok,
        simpananWajib: simpananWajib,
        totalPengembalian: totalPengembalian,
        metodePembayaran: metodePembayaran,
        tanggalPembayaran: tanggalPembayaran,
        jurnalId: jurnalId
    },
    ipAddress: null
};
```

### Transaction Rollback

Jika terjadi error pada step manapun, sistem akan melakukan rollback:

```javascript
try {
    // ... proses pengembalian ...
} catch (innerError) {
    restoreSnapshot(snapshot);
    throw innerError;
}
```

**Helper Functions:**

```javascript
function createSnapshot() {
    return {
        anggota: localStorage.getItem('anggota'),
        pengembalian: localStorage.getItem('pengembalian'),
        jurnal: localStorage.getItem('jurnal'),
        coa: localStorage.getItem('coa'),
        auditLogsAnggotaKeluar: localStorage.getItem('auditLogsAnggotaKeluar')
    };
}

function restoreSnapshot(snapshot) {
    if (snapshot.anggota) localStorage.setItem('anggota', snapshot.anggota);
    if (snapshot.pengembalian) localStorage.setItem('pengembalian', snapshot.pengembalian);
    if (snapshot.jurnal) localStorage.setItem('jurnal', snapshot.jurnal);
    if (snapshot.coa) localStorage.setItem('coa', snapshot.coa);
    if (snapshot.auditLogsAnggotaKeluar) localStorage.setItem('auditLogsAnggotaKeluar', snapshot.auditLogsAnggotaKeluar);
}
```

## COA Accounts yang Digunakan

| Kode | Nama | Tipe | Penggunaan |
|------|------|------|------------|
| 2-1100 | Simpanan Pokok | Kewajiban | Debit saat pengembalian |
| 2-1200 | Simpanan Wajib | Kewajiban | Debit saat pengembalian |
| 1-1000 | Kas | Aset | Kredit saat pembayaran tunai |
| 1-1100 | Bank | Aset | Kredit saat transfer bank |

## Contoh Journal Entry

### Skenario: Pengembalian Rp 5.000.000 (Pokok: Rp 3.000.000, Wajib: Rp 2.000.000) via Kas

```
Tanggal: 2024-12-04
Keterangan: Pengembalian Simpanan - John Doe (PGM-202412-a1b2c3d4)

Entries:
┌──────────┬────────────────────┬───────────────┬───────────────┐
│ Akun     │ Nama               │ Debit         │ Kredit        │
├──────────┼────────────────────┼───────────────┼───────────────┤
│ 2-1100   │ Simpanan Pokok     │ Rp 3.000.000  │ Rp 0          │
│ 2-1200   │ Simpanan Wajib     │ Rp 2.000.000  │ Rp 0          │
│ 1-1000   │ Kas                │ Rp 0          │ Rp 5.000.000  │
├──────────┼────────────────────┼───────────────┼───────────────┤
│ TOTAL    │                    │ Rp 5.000.000  │ Rp 5.000.000  │
└──────────┴────────────────────┴───────────────┴───────────────┘
```

**Penjelasan:**
- **Debit Simpanan Pokok**: Mengurangi kewajiban koperasi kepada anggota
- **Debit Simpanan Wajib**: Mengurangi kewajiban koperasi kepada anggota
- **Kredit Kas**: Mengurangi aset kas koperasi (uang keluar)

## Error Handling

### Error Codes

| Code | Message | Kondisi |
|------|---------|---------|
| INVALID_PARAMETER | ID anggota tidak valid | anggotaId null atau bukan string |
| INVALID_PARAMETER | Metode pembayaran tidak valid | metodePembayaran null atau bukan string |
| INVALID_PARAMETER | Tanggal pembayaran tidak valid | tanggalPembayaran null atau bukan string |
| VALIDATION_FAILED | Validasi gagal | Validasi pengembalian gagal (pinjaman aktif, saldo tidak cukup, dll) |
| ANGGOTA_NOT_FOUND | Anggota tidak ditemukan | Anggota dengan ID tersebut tidak ada |
| CALCULATION_FAILED | Gagal menghitung pengembalian | Error saat calculatePengembalian() |
| SYSTEM_ERROR | {error.message} | Error sistem lainnya |

### Validation Errors yang Dicek

1. **Active Loan**: Anggota memiliki pinjaman aktif
2. **Insufficient Balance**: Saldo kas tidak mencukupi
3. **Invalid Payment Method**: Metode pembayaran tidak valid

## Data Flow

```
Input: anggotaId, metodePembayaran, tanggalPembayaran, keterangan
  │
  ├─> Validate Input
  │
  ├─> Run Validation (validatePengembalian)
  │
  ├─> Get Anggota Data
  │
  ├─> Calculate Pengembalian
  │
  ├─> Create Pengembalian Record
  │
  ├─> Generate Journal Entries
  │     ├─> Debit: Simpanan Pokok (2-1100)
  │     ├─> Debit: Simpanan Wajib (2-1200)
  │     └─> Kredit: Kas/Bank (1-1000/1-1100)
  │
  ├─> Validate Double-Entry Balance
  │
  ├─> Save Journal (addJurnal)
  │     └─> Update COA Balances
  │
  ├─> Update Pengembalian Status → "Selesai"
  │
  ├─> Update Anggota Status
  │
  ├─> Create Audit Log
  │
  └─> Return Success
```

## Integration Points

### 1. validatePengembalian()
Digunakan untuk validasi sebelum proses:
```javascript
const validation = validatePengembalian(anggotaId, metodePembayaran);
if (!validation.valid) {
    return { success: false, error: { code: 'VALIDATION_FAILED', ... } };
}
```

### 2. calculatePengembalian()
Digunakan untuk mendapatkan breakdown pengembalian:
```javascript
const calculation = calculatePengembalian(anggotaId);
const { simpananPokok, simpananWajib, totalPengembalian } = calculation.data;
```

### 3. addJurnal() (keuangan.js)
Digunakan untuk menyimpan jurnal dan update COA:
```javascript
addJurnal(keterangan, jurnalEntries, tanggalPembayaran);
```

### 4. saveAuditLog()
Digunakan untuk mencatat audit trail:
```javascript
saveAuditLog(auditLog);
```

## Testing Strategy

Property-based tests akan diimplementasikan di task berikutnya:

- **Task 4.2**: Property 5 - Simpanan balance zeroing
- **Task 4.3**: Property 6 - Status transition consistency
- **Task 4.4**: Property 7 - Double-entry accounting balance
- **Task 4.5**: Property 8 - Journal reference integrity
- **Task 4.6**: Property 13 - Validation failure prevents processing

## Next Steps

1. ✅ Task 4.1 - Implement processPengembalian() function (SELESAI)
2. ⏭️ Task 4.2 - Write property test for balance zeroing
3. ⏭️ Task 4.3 - Write property test for status transition
4. ⏭️ Task 4.4 - Write property test for double-entry balance
5. ⏭️ Task 4.5 - Write property test for journal reference integrity
6. ⏭️ Task 4.6 - Write property test for validation failure preventing processing

## Files Modified

1. `js/anggotaKeluarManager.js` - Added processPengembalian(), createSnapshot(), restoreSnapshot()
2. `IMPLEMENTASI_TASK4.1_PROSES_PENGEMBALIAN.md` - Documentation (this file)

---

**Tanggal**: 2024-12-04
**Status**: SELESAI ✅
**Complexity**: HIGH (Accounting integration, transaction rollback, multi-step process)
