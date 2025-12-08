# Migration Guide: Simpanan Pengembalian Fields

## Overview

Dokumen ini menjelaskan perubahan data model untuk simpanan dan bagaimana existing data akan di-handle setelah implementasi fitur pengembalian simpanan anggota keluar.

## Changes to Data Model

### New Fields Added

Semua jenis simpanan (Pokok, Wajib, Sukarela) akan mendapatkan 4 field baru:

1. **saldoSebelumPengembalian** (number, optional)
   - Menyimpan saldo original sebelum pengembalian
   - Null untuk simpanan yang belum dikembalikan
   - Diisi saat proses pengembalian

2. **statusPengembalian** (string, optional)
   - Values: 'Aktif' | 'Dikembalikan'
   - Default: 'Aktif' untuk data baru
   - Null/undefined untuk existing data (treated as 'Aktif')

3. **pengembalianId** (string, optional)
   - Reference ke record pengembalian
   - Null untuk simpanan yang belum dikembalikan

4. **tanggalPengembalian** (string, optional)
   - Tanggal saat pengembalian diproses (ISO format)
   - Null untuk simpanan yang belum dikembalikan

## Backward Compatibility

### Existing Data Handling

**IMPORTANT:** Existing simpanan records yang tidak memiliki field baru akan tetap berfungsi normal.

```javascript
// Existing record (before migration)
{
  id: "SP-001",
  anggotaId: "ANG-001",
  jumlah: 500000,
  tanggal: "2024-01-15"
}

// System will treat this as:
{
  id: "SP-001",
  anggotaId: "ANG-001",
  jumlah: 500000,
  tanggal: "2024-01-15",
  statusPengembalian: undefined  // Treated as 'Aktif'
}
```

### Safe Field Access

Semua kode yang mengakses field baru harus menggunakan safe access:

```javascript
// ✅ CORRECT - Safe access
const status = simpanan.statusPengembalian || 'Aktif';
const isReturned = simpanan.statusPengembalian === 'Dikembalikan';

// ✅ CORRECT - Check before using
if (simpanan.saldoSebelumPengembalian !== null && simpanan.saldoSebelumPengembalian !== undefined) {
    console.log('Original balance:', simpanan.saldoSebelumPengembalian);
}

// ❌ WRONG - Direct access without check
console.log(simpanan.saldoSebelumPengembalian.toFixed(2)); // May error on existing data
```

## Migration Strategy

### No Automatic Migration Required

**Keputusan:** Tidak ada automatic migration untuk existing data.

**Alasan:**
1. Field baru bersifat optional
2. Existing data tetap valid tanpa field baru
3. Field baru hanya diisi saat proses pengembalian
4. Backward compatibility terjaga

### When Fields Are Populated

Field baru akan diisi **hanya** saat:
1. Proses pengembalian simpanan anggota keluar
2. Fungsi `processPengembalian()` dipanggil
3. Simpanan di-zero-kan

## Code Changes Required

### 1. Update `saveSimpananPokok()` Function

```javascript
function saveSimpananPokok() {
    const simpanan = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
    
    const data = {
        id: generateId(),
        anggotaId: document.getElementById('anggotaPokok').value,
        jumlah: parseFloat(document.getElementById('jumlahPokok').value),
        tanggal: document.getElementById('tanggalPokok').value,
        // NEW: Initialize pengembalian fields
        statusPengembalian: 'Aktif',
        saldoSebelumPengembalian: null,
        pengembalianId: null,
        tanggalPengembalian: null
    };
    
    // ... rest of code
}
```

### 2. Update `saveSimpananWajib()` Function

```javascript
function saveSimpananWajib() {
    const simpanan = JSON.parse(localStorage.getItem('simpananWajib') || '[]');
    
    const data = {
        id: generateId(),
        anggotaId: document.getElementById('anggotaWajib').value,
        jumlah: parseFloat(document.getElementById('jumlahWajib').value),
        tanggal: document.getElementById('tanggalWajib').value,
        periode: document.getElementById('periodeWajib').value,
        // NEW: Initialize pengembalian fields
        statusPengembalian: 'Aktif',
        saldoSebelumPengembalian: null,
        pengembalianId: null,
        tanggalPengembalian: null
    };
    
    // ... rest of code
}
```

### 3. Update `saveSimpananSukarela()` Function

```javascript
function saveSimpananSukarela() {
    const simpanan = JSON.parse(localStorage.getItem('simpananSukarela') || '[]');
    
    const data = {
        id: generateId(),
        anggotaId: document.getElementById('anggotaSukarela').value,
        jumlah: parseFloat(document.getElementById('jumlahSukarela').value),
        tanggal: document.getElementById('tanggalSukarela').value,
        jenis: document.getElementById('jenisSukarela').value,
        // NEW: Initialize pengembalian fields
        statusPengembalian: 'Aktif',
        saldoSebelumPengembalian: null,
        pengembalianId: null,
        tanggalPengembalian: null
    };
    
    // ... rest of code
}
```

### 4. Update Laporan Functions

All laporan functions should filter out zero balances:

```javascript
function renderLaporanSimpananPokok() {
    const simpanan = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
    
    // NEW: Filter only active simpanan with balance > 0
    const activeSimpanan = simpanan.filter(s => s.jumlah > 0);
    
    // Render activeSimpanan instead of all simpanan
    // ...
}
```

## Testing Existing Data

### Test Scenarios

1. **Existing simpanan without new fields**
   - Should display normally in reports
   - Should be included in calculations
   - Should not cause errors

2. **New simpanan with fields initialized**
   - Should have statusPengembalian = 'Aktif'
   - Should have null values for other fields

3. **Simpanan after pengembalian**
   - Should have jumlah = 0
   - Should have saldoSebelumPengembalian populated
   - Should have statusPengembalian = 'Dikembalikan'
   - Should not appear in reports (filtered by jumlah > 0)

## Rollback Plan

If issues occur, rollback is simple:

1. **Code rollback:** Remove field initialization from save functions
2. **Data:** No cleanup needed - extra fields are harmless
3. **Reports:** Will continue to work with or without new fields

## Summary

✅ **No breaking changes**
✅ **Backward compatible**
✅ **No automatic migration needed**
✅ **Existing data continues to work**
✅ **New fields only populated when needed**

## Requirements Validated

- ✅ Requirement 1.3: Historical data preservation (saldoSebelumPengembalian)
- ✅ Requirement 1.4: Timestamp recording (tanggalPengembalian)
- ✅ Requirement 1.5: Pengembalian ID tracking (pengembalianId)
