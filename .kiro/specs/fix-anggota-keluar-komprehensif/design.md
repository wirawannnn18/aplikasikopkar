# Design Document: Perbaikan Komprehensif Anggota Keluar

## Overview

This design implements a comprehensive solution to fix three critical issues with anggota keluar:
1. Filtering anggota keluar from Master Anggota and all active displays
2. Zeroing simpanan balances after pencairan and updating accounting journals
3. Preventing anggota keluar and non-aktif from appearing in transaction searches and dropdowns

The solution ensures data integrity by preserving all data in localStorage while applying filtering at display and transaction validation layers.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                      │
├─────────────────────────────────────────────────────────────┤
│  Master Anggota  │  Dropdowns  │  Search  │  Anggota Keluar │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                       │
├─────────────────────────────────────────────────────────────┤
│  • filterActiveAnggota()                                     │
│  • filterTransactableAnggota()                              │
│  • validateAnggotaForTransaction()                          │
│  • processPencairanSimpanan()                               │
│  • zeroSimpananBalance()                                    │
│  • createPencairanJournal()                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Storage Layer                        │
├─────────────────────────────────────────────────────────────┤
│  localStorage.anggota                                        │
│  localStorage.simpananPokok                                  │
│  localStorage.simpananWajib                                  │
│  localStorage.simpananSukarela                              │
│  localStorage.jurnal                                         │
└─────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Data Preservation**: Never delete anggota keluar or transaction history from localStorage
2. **View Filtering**: Apply filtering at display/render time
3. **Transaction Validation**: Validate anggota status before processing transactions
4. **Balance Zeroing**: Set simpanan balances to zero after pencairan
5. **Journal Accuracy**: Create proper debit/credit entries for pencairan

## Components and Interfaces

### 1. Core Filtering Functions

#### `filterActiveAnggota(anggotaList)`

Filters out anggota with statusKeanggotaan === 'Keluar'.

**Location:** `js/koperasi.js`

**Signature:**
```javascript
function filterActiveAnggota(anggotaList) {
    return anggotaList.filter(a => a.statusKeanggotaan !== 'Keluar');
}
```

**Parameters:**
- `anggotaList` (Array): Array of anggota objects

**Returns:**
- Array of anggota objects excluding those with statusKeanggotaan === 'Keluar'

---

#### `filterTransactableAnggota(anggotaList)`

Filters anggota who can participate in transactions (Aktif status AND not Keluar).

**Location:** `js/koperasi.js`

**Signature:**
```javascript
function filterTransactableAnggota(anggotaList) {
    return anggotaList.filter(a => 
        a.status === 'Aktif' && a.statusKeanggotaan !== 'Keluar'
    );
}
```

**Parameters:**
- `anggotaList` (Array): Array of anggota objects

**Returns:**
- Array of anggota objects with status === 'Aktif' AND statusKeanggotaan !== 'Keluar'

---

#### `validateAnggotaForTransaction(anggotaId)`

Validates if anggota can participate in new transactions.

**Location:** `js/koperasi.js`

**Signature:**
```javascript
function validateAnggotaForTransaction(anggotaId) {
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]')
        .find(a => a.id === anggotaId);
    
    if (!anggota) {
        return { valid: false, error: 'Anggota tidak ditemukan' };
    }
    
    if (anggota.statusKeanggotaan === 'Keluar') {
        return { valid: false, error: 'Anggota sudah keluar, tidak dapat melakukan transaksi' };
    }
    
    if (anggota.status === 'Nonaktif') {
        return { valid: false, error: 'Anggota non-aktif, tidak dapat melakukan transaksi' };
    }
    
    return { valid: true };
}
```

**Parameters:**
- `anggotaId` (string): ID of anggota to validate

**Returns:**
- Object: `{ valid: boolean, error?: string }`

---

### 2. Simpanan Balance Zeroing Functions

#### `zeroSimpananPokok(anggotaId)`

Sets simpanan pokok balance to zero for anggota keluar.

**Location:** `js/simpanan.js`

**Signature:**
```javascript
function zeroSimpananPokok(anggotaId) {
    const simpananPokok = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
    const updated = simpananPokok.map(s => {
        if (s.anggotaId === anggotaId) {
            return { ...s, saldo: 0 };
        }
        return s;
    });
    localStorage.setItem('simpananPokok', JSON.stringify(updated));
}
```

**Parameters:**
- `anggotaId` (string): ID of anggota

**Returns:**
- void

---

#### `zeroSimpananWajib(anggotaId)`

Sets simpanan wajib balance to zero for anggota keluar.

**Location:** `js/simpanan.js`

**Signature:**
```javascript
function zeroSimpananWajib(anggotaId) {
    const simpananWajib = JSON.parse(localStorage.getItem('simpananWajib') || '[]');
    const updated = simpananWajib.map(s => {
        if (s.anggotaId === anggotaId) {
            return { ...s, saldo: 0 };
        }
        return s;
    });
    localStorage.setItem('simpananWajib', JSON.stringify(updated));
}
```

**Parameters:**
- `anggotaId` (string): ID of anggota

**Returns:**
- void

---

#### `zeroSimpananSukarela(anggotaId)`

Sets simpanan sukarela balance to zero for anggota keluar.

**Location:** `js/simpanan.js`

**Signature:**
```javascript
function zeroSimpananSukarela(anggotaId) {
    const simpananSukarela = JSON.parse(localStorage.getItem('simpananSukarela') || '[]');
    const updated = simpananSukarela.map(s => {
        if (s.anggotaId === anggotaId) {
            return { ...s, saldo: 0 };
        }
        return s;
    });
    localStorage.setItem('simpananSukarela', JSON.stringify(updated));
}
```

**Parameters:**
- `anggotaId` (string): ID of anggota

**Returns:**
- void

---

### 3. Pencairan Journal Functions

#### `createPencairanJournal(anggotaId, jenisSimpanan, jumlah)`

Creates accounting journal entry for pencairan simpanan.

**Location:** `js/simpanan.js`

**Signature:**
```javascript
function createPencairanJournal(anggotaId, jenisSimpanan, jumlah) {
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]')
        .find(a => a.id === anggotaId);
    
    const coaMap = {
        'Simpanan Pokok': 'Simpanan Pokok',
        'Simpanan Wajib': 'Simpanan Wajib',
        'Simpanan Sukarela': 'Simpanan Sukarela'
    };
    
    const jurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
    
    // Debit: Simpanan (mengurangi kewajiban)
    jurnal.push({
        id: generateId(),
        tanggal: new Date().toISOString(),
        keterangan: `Pencairan ${jenisSimpanan} - ${anggota.nama}`,
        coa: coaMap[jenisSimpanan],
        debit: jumlah,
        kredit: 0,
        referensi: `PENCAIRAN-${anggotaId}`,
        createdAt: new Date().toISOString()
    });
    
    // Kredit: Kas (mengurangi aset)
    jurnal.push({
        id: generateId(),
        tanggal: new Date().toISOString(),
        keterangan: `Pencairan ${jenisSimpanan} - ${anggota.nama}`,
        coa: 'Kas',
        debit: 0,
        kredit: jumlah,
        referensi: `PENCAIRAN-${anggotaId}`,
        createdAt: new Date().toISOString()
    });
    
    localStorage.setItem('jurnal', JSON.stringify(jurnal));
}
```

**Parameters:**
- `anggotaId` (string): ID of anggota
- `jenisSimpanan` (string): Type of simpanan ('Simpanan Pokok', 'Simpanan Wajib', 'Simpanan Sukarela')
- `jumlah` (number): Amount to return

**Returns:**
- void

---

#### `processPencairanSimpanan(anggotaId)`

Main function to process complete pencairan for anggota keluar.

**Location:** `js/simpanan.js`

**Signature:**
```javascript
function processPencairanSimpanan(anggotaId) {
    // Get current balances
    const simpananPokok = JSON.parse(localStorage.getItem('simpananPokok') || '[]')
        .find(s => s.anggotaId === anggotaId);
    const simpananWajib = JSON.parse(localStorage.getItem('simpananWajib') || '[]')
        .find(s => s.anggotaId === anggotaId);
    const simpananSukarela = JSON.parse(localStorage.getItem('simpananSukarela') || '[]')
        .find(s => s.anggotaId === anggotaId);
    
    // Create journals for non-zero balances
    if (simpananPokok && simpananPokok.saldo > 0) {
        createPencairanJournal(anggotaId, 'Simpanan Pokok', simpananPokok.saldo);
        zeroSimpananPokok(anggotaId);
    }
    
    if (simpananWajib && simpananWajib.saldo > 0) {
        createPencairanJournal(anggotaId, 'Simpanan Wajib', simpananWajib.saldo);
        zeroSimpananWajib(anggotaId);
    }
    
    if (simpananSukarela && simpananSukarela.saldo > 0) {
        createPencairanJournal(anggotaId, 'Simpanan Sukarela', simpananSukarela.saldo);
        zeroSimpananSukarela(anggotaId);
    }
    
    // Update anggota pengembalianStatus
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const updated = anggota.map(a => {
        if (a.id === anggotaId) {
            return { ...a, pengembalianStatus: 'Selesai' };
        }
        return a;
    });
    localStorage.setItem('anggota', JSON.stringify(updated));
}
```

**Parameters:**
- `anggotaId` (string): ID of anggota keluar

**Returns:**
- void

---

### 4. Modified Display Functions

#### `renderAnggota()`

**Location:** `js/koperasi.js`

**Changes:**
- Apply `filterActiveAnggota()` to exclude anggota keluar
- Update count badge to show only active anggota

**Before:**
```javascript
const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
```

**After:**
```javascript
const allAnggota = JSON.parse(localStorage.getItem('anggota') || '[]');
const anggota = filterActiveAnggota(allAnggota);
```

---

#### `renderSimpananPokok()` / `renderSimpananWajib()` / `renderSimpananSukarela()`

**Location:** `js/simpanan.js`

**Changes:**
- Apply `filterTransactableAnggota()` to dropdown options
- Validate anggota before processing transaction

**Before:**
```javascript
${anggota.map(a => `<option value="${a.id}">${a.nama}</option>`).join('')}
```

**After:**
```javascript
${filterTransactableAnggota(anggota).map(a => `<option value="${a.id}">${a.nama}</option>`).join('')}
```

---

#### `renderLaporanSimpanan()`

**Location:** `js/simpanan.js`

**Changes:**
- Filter out anggota with zero balances
- Exclude anggota keluar from totals

**Before:**
```javascript
const simpananPokok = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
```

**After:**
```javascript
const simpananPokok = JSON.parse(localStorage.getItem('simpananPokok') || '[]')
    .filter(s => s.saldo > 0);
```

---

### 5. Transaction Validation Integration

All transaction functions must call `validateAnggotaForTransaction()` before processing:

**Example in `submitSimpananPokok()`:**

```javascript
function submitSimpananPokok() {
    const anggotaId = document.getElementById('anggotaIdSimpananPokok').value;
    
    // Validate anggota
    const validation = validateAnggotaForTransaction(anggotaId);
    if (!validation.valid) {
        alert(validation.error);
        return;
    }
    
    // Continue with transaction...
}
```

---

## Data Models

### Anggota Object

```javascript
{
    id: string,
    nik: string,
    nama: string,
    status: 'Aktif' | 'Nonaktif' | 'Cuti',
    statusKeanggotaan: 'Aktif' | 'Keluar',
    tanggalKeluar: string (ISO) | null,
    pengembalianStatus: 'Pending' | 'Selesai' | null,
    // ... other fields
}
```

### Simpanan Object

```javascript
{
    id: string,
    anggotaId: string,
    saldo: number,  // Will be 0 after pencairan
    // ... other fields
}
```

### Journal Entry Object

```javascript
{
    id: string,
    tanggal: string (ISO),
    keterangan: string,
    coa: string,
    debit: number,
    kredit: number,
    referensi: string,
    createdAt: string (ISO)
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Master Anggota Exclusion

*For any* anggota list retrieved from localStorage, when rendered in Master Anggota, all anggota with statusKeanggotaan equal to 'Keluar' should be excluded.

**Validates: Requirements 1.1**

---

### Property 2: Transaction Dropdown Exclusion

*For any* transaction dropdown, all options should exclude anggota with statusKeanggotaan equal to 'Keluar' OR status equal to 'Nonaktif'.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3**

---

### Property 3: Balance Zeroing After Pencairan

*For any* anggota keluar after pencairan, all simpanan balances (pokok, wajib, sukarela) should equal zero.

**Validates: Requirements 2.1, 2.2, 2.3**

---

### Property 4: Journal Entry Correctness

*For any* pencairan transaction, the system should create exactly two journal entries: one debit to Simpanan account and one credit to Kas account with equal amounts.

**Validates: Requirements 3.1, 3.2, 3.3**

---

### Property 5: Kas Balance Reduction

*For any* pencairan transaction with amount X, the Kas balance should decrease by X.

**Validates: Requirements 3.4, 3.5**

---

### Property 6: Transaction Validation Rejection

*For any* transaction attempt for anggota with statusKeanggotaan equal to 'Keluar', the system should reject the transaction.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

---

### Property 7: Laporan Exclusion

*For any* laporan simpanan, all anggota with zero balances should be excluded from the report.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

---

### Property 8: Data Preservation

*For any* filtering or zeroing operation, the original anggota and transaction records should remain in localStorage.

**Validates: Requirements 10.1, 10.2, 10.3**

---

### Property 9: Anggota Keluar Visibility

*For any* anggota with statusKeanggotaan equal to 'Keluar', it should be visible only in Anggota Keluar page and not in Master Anggota.

**Validates: Requirements 7.1, 7.2**

---

### Property 10: Search Exclusion

*For any* search operation in transaction contexts, results should exclude anggota with status equal to 'Nonaktif' OR statusKeanggotaan equal to 'Keluar'.

**Validates: Requirements 5.4, 5.5**

---

## Error Handling

### Validation Errors

1. **Anggota Keluar Transaction Attempt:**
   - Error: "Anggota sudah keluar, tidak dapat melakukan transaksi"
   - Action: Reject transaction, show alert

2. **Anggota Non-Aktif Transaction Attempt:**
   - Error: "Anggota non-aktif, tidak dapat melakukan transaksi"
   - Action: Reject transaction, show alert

3. **Anggota Not Found:**
   - Error: "Anggota tidak ditemukan"
   - Action: Reject transaction, show alert

### Data Integrity Errors

1. **Missing Simpanan Record:**
   - Handle gracefully, assume zero balance
   - Log warning for investigation

2. **Corrupted localStorage:**
   - Catch JSON parse errors
   - Show error message to user
   - Provide option to restore from backup

### Edge Cases

1. **Pencairan with Zero Balance:**
   - Skip journal creation
   - Update pengembalianStatus to 'Selesai'

2. **Multiple Pencairan Attempts:**
   - Check pengembalianStatus before processing
   - Prevent duplicate pencairan

3. **All Anggota are Keluar:**
   - Display "Tidak ada data anggota" in Master Anggota
   - Show all in Anggota Keluar page

---

## Testing Strategy

### Unit Tests

1. **Test `filterActiveAnggota()`:**
   - Input: Array with mixed statusKeanggotaan
   - Expected: Only anggota with statusKeanggotaan !== 'Keluar'

2. **Test `filterTransactableAnggota()`:**
   - Input: Array with mixed status and statusKeanggotaan
   - Expected: Only anggota with status === 'Aktif' AND statusKeanggotaan !== 'Keluar'

3. **Test `validateAnggotaForTransaction()`:**
   - Input: Various anggota IDs
   - Expected: Correct validation results

4. **Test `zeroSimpananPokok()`:**
   - Input: Anggota ID with non-zero balance
   - Expected: Balance becomes 0

5. **Test `createPencairanJournal()`:**
   - Input: Anggota ID, jenis simpanan, jumlah
   - Expected: Two journal entries created

### Property-Based Tests

Property-based tests will use `fast-check` library to generate random test data.

#### Test 1: Master Anggota Exclusion

**Property 1: Master Anggota Exclusion**

```javascript
fc.assert(
    fc.property(
        fc.array(anggotaArbitrary),
        (anggotaList) => {
            const filtered = filterActiveAnggota(anggotaList);
            return filtered.every(a => a.statusKeanggotaan !== 'Keluar');
        }
    )
);
```

**Validates: Requirements 1.1**

---

#### Test 2: Transaction Dropdown Exclusion

**Property 2: Transaction Dropdown Exclusion**

```javascript
fc.assert(
    fc.property(
        fc.array(anggotaArbitrary),
        (anggotaList) => {
            const filtered = filterTransactableAnggota(anggotaList);
            return filtered.every(a => 
                a.status === 'Aktif' && a.statusKeanggotaan !== 'Keluar'
            );
        }
    )
);
```

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3**

---

#### Test 3: Balance Zeroing

**Property 3: Balance Zeroing After Pencairan**

```javascript
fc.assert(
    fc.property(
        anggotaArbitrary,
        fc.nat(),
        (anggota, balance) => {
            // Setup
            const simpananPokok = [{ anggotaId: anggota.id, saldo: balance }];
            localStorage.setItem('simpananPokok', JSON.stringify(simpananPokok));
            
            // Execute
            zeroSimpananPokok(anggota.id);
            
            // Verify
            const updated = JSON.parse(localStorage.getItem('simpananPokok'));
            const record = updated.find(s => s.anggotaId === anggota.id);
            return record.saldo === 0;
        }
    )
);
```

**Validates: Requirements 2.1, 2.2, 2.3**

---

#### Test 4: Journal Entry Correctness

**Property 4: Journal Entry Correctness**

```javascript
fc.assert(
    fc.property(
        anggotaArbitrary,
        fc.nat({ min: 1, max: 10000000 }),
        (anggota, jumlah) => {
            // Setup
            localStorage.setItem('anggota', JSON.stringify([anggota]));
            localStorage.setItem('jurnal', JSON.stringify([]));
            
            // Execute
            createPencairanJournal(anggota.id, 'Simpanan Pokok', jumlah);
            
            // Verify
            const jurnal = JSON.parse(localStorage.getItem('jurnal'));
            const debitEntry = jurnal.find(j => j.debit === jumlah);
            const kreditEntry = jurnal.find(j => j.kredit === jumlah);
            
            return jurnal.length === 2 &&
                   debitEntry && debitEntry.coa === 'Simpanan Pokok' &&
                   kreditEntry && kreditEntry.coa === 'Kas';
        }
    )
);
```

**Validates: Requirements 3.1, 3.2, 3.3**

---

#### Test 5: Transaction Validation Rejection

**Property 6: Transaction Validation Rejection**

```javascript
fc.assert(
    fc.property(
        anggotaArbitrary,
        (anggota) => {
            // Setup anggota keluar
            anggota.statusKeanggotaan = 'Keluar';
            localStorage.setItem('anggota', JSON.stringify([anggota]));
            
            // Execute
            const validation = validateAnggotaForTransaction(anggota.id);
            
            // Verify
            return !validation.valid;
        }
    )
);
```

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

---

#### Test 6: Data Preservation

**Property 8: Data Preservation**

```javascript
fc.assert(
    fc.property(
        fc.array(anggotaArbitrary),
        (anggotaList) => {
            // Setup
            localStorage.setItem('anggota', JSON.stringify(anggotaList));
            
            // Execute filtering
            filterActiveAnggota(JSON.parse(localStorage.getItem('anggota')));
            
            // Verify original data preserved
            const stored = JSON.parse(localStorage.getItem('anggota'));
            return stored.length === anggotaList.length;
        }
    )
);
```

**Validates: Requirements 10.1, 10.2, 10.3**

---

### Integration Tests

1. **Test complete pencairan flow:**
   - Create anggota keluar with balances
   - Process pencairan
   - Verify balances zeroed, journals created, Kas reduced

2. **Test Master Anggota rendering:**
   - Create mixed anggota data
   - Render Master Anggota
   - Verify only active anggota shown

3. **Test transaction dropdown:**
   - Create mixed anggota data
   - Render transaction form
   - Verify dropdown excludes keluar and non-aktif

4. **Test transaction validation:**
   - Attempt transaction for anggota keluar
   - Verify rejection with error message

5. **Test laporan simpanan:**
   - Create anggota with zero and non-zero balances
   - Generate laporan
   - Verify only non-zero balances shown

---

## Performance Considerations

### Optimization Strategies

1. **Caching:**
   - Cache filtered anggota lists
   - Invalidate cache on data changes

2. **Batch Operations:**
   - Process multiple pencairan in single operation
   - Batch journal entry creation

3. **Lazy Loading:**
   - Load anggota data on demand
   - Paginate large lists

### Performance Metrics

- Filter operations: < 10ms for 1000 anggota
- Pencairan processing: < 100ms per anggota
- Journal creation: < 50ms per entry
- Rendering: < 100ms for 100 visible anggota

---

## Migration Strategy

### Data Migration

1. **Check existing anggota keluar:**
   - Identify anggota with statusKeanggotaan === 'Keluar'
   - Check if balances already zeroed

2. **Process pending pencairan:**
   - For anggota keluar with pengembalianStatus === 'Pending'
   - Run `processPencairanSimpanan()` for each

3. **Verify data integrity:**
   - Check all anggota keluar have zero balances
   - Verify journal entries created

### Code Migration

1. **Add new functions:**
   - Add filtering functions to koperasi.js
   - Add zeroing functions to simpanan.js
   - Add validation functions to koperasi.js

2. **Update existing functions:**
   - Update renderAnggota() to use filterActiveAnggota()
   - Update dropdown renders to use filterTransactableAnggota()
   - Update transaction functions to call validateAnggotaForTransaction()

3. **Test thoroughly:**
   - Run all unit tests
   - Run all property-based tests
   - Run all integration tests

### Rollback Plan

If issues arise:
1. Remove new filtering calls
2. Revert to previous inline filtering
3. Keep data intact (no data changes made)
4. Investigate and fix issues
5. Re-deploy with fixes

---

## Security Considerations

1. **Data Access:**
   - Filtering is client-side only
   - No sensitive data exposed

2. **Data Integrity:**
   - Filtering does not modify localStorage
   - Original data preserved for audit

3. **Authorization:**
   - Existing role-based access remains
   - No authorization changes needed

4. **Audit Trail:**
   - All pencairan creates journal entries
   - Transaction history preserved

---

## Documentation

### User Documentation

1. **Admin Guide:**
   - Explain anggota keluar hidden from Master Anggota
   - Show how to access Anggota Keluar menu
   - Explain pencairan process

2. **Kasir Guide:**
   - Explain why some anggota not in dropdowns
   - Show error messages for invalid transactions
   - Explain validation rules

### Developer Documentation

1. **Function Documentation:**
   - Document all new functions with JSDoc
   - Explain parameters and return values
   - Provide usage examples

2. **Integration Guide:**
   - Explain how to use filtering functions
   - Show validation integration
   - Provide code examples

---

## Deployment Plan

### Pre-Deployment

1. **Backup data:**
   - Export all localStorage data
   - Save backup file

2. **Test in staging:**
   - Deploy to test environment
   - Run all tests
   - Verify functionality

### Deployment Steps

1. **Deploy code:**
   - Update JavaScript files
   - Clear browser cache

2. **Run migration:**
   - Process pending pencairan
   - Verify data integrity

3. **Verify deployment:**
   - Test Master Anggota display
   - Test transaction dropdowns
   - Test validation

### Post-Deployment

1. **Monitor:**
   - Check for errors
   - Monitor user feedback

2. **Support:**
   - Provide user support
   - Fix issues quickly

3. **Document:**
   - Update user guides
   - Update developer docs
