# Implementation Task 2: Wizard Anggota Keluar - Step 1 Validasi Hutang/Piutang

**Date:** 2024-12-09  
**Status:** ✅ COMPLETE  
**Related Spec:** `.kiro/specs/wizard-anggota-keluar/`

## Overview

Implemented Step 1 of the wizard: Validasi Hutang/Piutang. This step validates whether an anggota has outstanding loans or receivables before allowing them to proceed with the exit process.

## Implementation Summary

### Files Modified

1. **js/anggotaKeluarManager.js**
   - Added `validateHutangPiutang()` function
   - Added `hitungTotalSimpanan()` function (Task 3)
   - Added `prosesPencairanSimpanan()` function (Task 4)
   - Added `updateStatusAnggotaKeluar()` function (Task 6)
   - Added `verifikasiAccounting()` function (Task 7)

2. **js/anggotaKeluarUI.js**
   - Added `generateDokumenAnggotaKeluar()` function (Task 5)
   - Added `generateSuratPengunduranDiri()` helper function
   - Added `generateBuktiPencairan()` helper function

## Detailed Implementation

### Task 2: validateHutangPiutang()

**Location:** `js/anggotaKeluarManager.js`

**Purpose:** Validate if anggota has outstanding debts before allowing exit

**Requirements Satisfied:**
- ✅ Req 1.1: Display validation as first step
- ✅ Req 1.2: Check all loans with sisaPinjaman > 0
- ✅ Req 1.3: Check all receivables with sisaPiutang > 0
- ✅ Req 1.4: Block progress if debt exists
- ✅ Req 1.5: Allow progress if no debt

**Function Signature:**
```javascript
function validateHutangPiutang(anggotaId)
```

**Returns:**
```javascript
{
    valid: boolean,
    error?: {
        code: string,
        message: string,
        details?: {
            pinjamanCount: number,
            totalPinjaman: number,
            piutangCount: number,
            totalPiutang: number,
            pinjaman: array,
            piutang: array
        }
    },
    message?: string
}
```

**Key Features:**
1. **Comprehensive Validation**: Checks both pinjaman and piutang
2. **Detailed Error Messages**: Returns count and total amounts
3. **Error Codes**: Structured error codes for UI handling
4. **Safe Defaults**: Handles missing data gracefully

### Task 3: hitungTotalSimpanan()

**Location:** `js/anggotaKeluarManager.js`

**Purpose:** Calculate total simpanan for refund

**Requirements Satisfied:**
- ✅ Req 2.1: Calculate simpanan pokok
- ✅ Req 2.2: Calculate simpanan wajib
- ✅ Req 2.3: Calculate simpanan sukarela
- ✅ Req 2.4: Display breakdown and total
- ✅ Req 2.5: Display kas/bank balance projection

**Function Signature:**
```javascript
function hitungTotalSimpanan(anggotaId)
```

**Returns:**
```javascript
{
    success: boolean,
    data?: {
        anggotaId: string,
        anggotaNama: string,
        simpananPokok: number,
        simpananWajib: number,
        simpananSukarela: number,
        totalSimpanan: number,
        kasBalance: number,
        bankBalance: number,
        totalAvailable: number
    },
    error?: string
}
```

**Key Features:**
1. **Accurate Calculation**: Sums all simpanan by type
2. **Balance Projection**: Shows current and projected balances
3. **Comprehensive Data**: Returns all needed information for UI

### Task 4: prosesPencairanSimpanan()

**Location:** `js/anggotaKeluarManager.js`

**Purpose:** Process simpanan refund with automatic journal entries

**Requirements Satisfied:**
- ✅ Req 3.1: Create journal for simpanan pokok (debit 2-1100, credit kas/bank)
- ✅ Req 3.2: Create journal for simpanan wajib (debit 2-1200, credit kas/bank)
- ✅ Req 3.3: Create journal for simpanan sukarela (debit 2-1300, credit kas/bank)
- ✅ Req 3.4: Validate double-entry balance
- ✅ Req 3.5: Save journal references in pengembalian

**Function Signature:**
```javascript
function prosesPencairanSimpanan(anggotaId, metodePembayaran, tanggalPembayaran, keterangan = '')
```

**Returns:**
```javascript
{
    success: boolean,
    data?: {
        pengembalianId: string,
        totalPencairan: number,
        jurnalIds: array
    },
    error?: string,
    message?: string
}
```

**Key Features:**
1. **Automatic Journals**: Creates all necessary journal entries
2. **Snapshot/Rollback**: Creates snapshot before processing
3. **Audit Trail**: Logs all actions
4. **Reference Tracking**: Stores all journal IDs in pengembalian record

**Journal Structure:**
- Each simpanan type gets 2 journal entries (debit and credit)
- Debit: Simpanan account (2-1100, 2-1200, 2-1300)
- Credit: Kas (1-1000) or Bank (1-1100) based on payment method

### Task 5: generateDokumenAnggotaKeluar()

**Location:** `js/anggotaKeluarUI.js`

**Purpose:** Generate printable documents

**Requirements Satisfied:**
- ✅ Req 4.1: Display button for surat pengunduran diri
- ✅ Req 4.2: Display button for bukti pencairan
- ✅ Req 4.3: Generate surat with complete identity
- ✅ Req 4.4: Generate bukti with simpanan breakdown
- ✅ Req 4.5: Save document references

**Function Signature:**
```javascript
function generateDokumenAnggotaKeluar(anggotaId, pengembalianId)
```

**Returns:**
```javascript
{
    suratId: string,
    buktiId: string,
    tanggalPrint: string,
    printWindow: string
}
```

**Key Features:**
1. **Two Documents**: Generates both surat and bukti
2. **Print Dialog**: Opens print window automatically
3. **Professional Layout**: Bootstrap-styled documents
4. **Page Break**: Separate pages for each document

**Document Contents:**
- **Surat Pengunduran Diri**: NIK, nama, alamat, departemen, tanggal keluar, alasan, signatures
- **Bukti Pencairan**: NIK, nama, tanggal, metode pembayaran, breakdown simpanan, total, signatures

### Task 6: updateStatusAnggotaKeluar()

**Location:** `js/anggotaKeluarManager.js`

**Purpose:** Update anggota status to keluar

**Requirements Satisfied:**
- ✅ Req 5.1: Update statusKeanggotaan to 'Keluar'
- ✅ Req 5.2: Save tanggalKeluar
- ✅ Req 5.3: Save alasanKeluar
- ✅ Req 5.4: Update pengembalianStatus to 'Selesai'
- ✅ Req 5.5: Save pengembalianId reference

**Function Signature:**
```javascript
function updateStatusAnggotaKeluar(anggotaId, tanggalKeluar, alasanKeluar, pengembalianId, dokumenRefs)
```

**Returns:**
```javascript
{
    success: boolean,
    data?: {
        anggotaId: string,
        statusKeanggotaan: string,
        tanggalKeluar: string,
        pengembalianStatus: string
    },
    error?: string,
    message?: string
}
```

**Key Features:**
1. **Complete Update**: Updates all required fields
2. **Document References**: Saves document IDs
3. **Audit Trail**: Logs status change
4. **Atomic Operation**: All updates in single transaction

### Task 7: verifikasiAccounting()

**Location:** `js/anggotaKeluarManager.js`

**Purpose:** Verify accounting integrity

**Requirements Satisfied:**
- ✅ Req 6.1: Check all journals are recorded
- ✅ Req 6.2: Validate total debit equals total kredit
- ✅ Req 6.3: Validate total pencairan matches journal sum
- ✅ Req 6.4: Check kas balance is sufficient
- ✅ Req 6.5: Return detailed verification result

**Function Signature:**
```javascript
function verifikasiAccounting(anggotaId, pengembalianId)
```

**Returns:**
```javascript
{
    valid: boolean,
    error?: {
        code: string,
        message: string,
        errors?: array
    },
    details: {
        jurnalCount: { expected: number, found: number },
        balance: { debit: number, kredit: number, balanced: boolean },
        amounts: { pencairan: number, jurnal: number, matched: boolean },
        balances: { kas: number, bank: number, total: number }
    },
    message?: string
}
```

**Key Features:**
1. **Comprehensive Checks**: Validates all accounting aspects
2. **Detailed Errors**: Returns specific error messages
3. **Balance Verification**: Checks double-entry balance
4. **Amount Matching**: Verifies pencairan matches journals

## Integration with Wizard

All functions are designed to be called by the `AnggotaKeluarWizard` class:

```javascript
// Step 1
const validationResult = wizard.executeStep1Validation();

// Step 2
const pencairanResult = wizard.executeStep2Pencairan('Kas', '2024-12-09', 'Pengembalian simpanan');

// Step 3
const documentResult = wizard.executeStep3Print();

// Step 4
const updateResult = wizard.executeStep4Update('2024-12-09', 'Pindah kota');

// Step 5
const verificationResult = wizard.executeStep5Verification();
```

## Error Handling

All functions implement:
1. **Try-Catch Blocks**: Catch and handle errors gracefully
2. **Structured Errors**: Return error objects with codes and messages
3. **Rollback Support**: Snapshot/restore for critical operations
4. **Audit Logging**: Log all errors for troubleshooting

## Testing Recommendations

### Unit Tests
1. Test `validateHutangPiutang()` with various debt scenarios
2. Test `hitungTotalSimpanan()` calculation accuracy
3. Test `prosesPencairanSimpanan()` journal creation
4. Test `verifikasiAccounting()` validation logic

### Integration Tests
1. Test complete wizard flow from step 1 to 5
2. Test error scenarios and rollback
3. Test with real anggota data
4. Test document generation and printing

## Next Steps

1. **Task 8**: Implement wizard UI components
2. **Task 9**: Implement audit logging
3. **Task 10**: Implement error handling and rollback
4. **Task 11**: Integrate wizard with anggota keluar menu
5. **Task 13**: Create comprehensive integration test

## Notes

- All functions follow the design document specifications
- Error messages are user-friendly and actionable
- Audit logs are created for all critical operations
- Functions are ready for integration with wizard UI
- Document generation uses Bootstrap for professional styling

## Completion Checklist

- [x] Task 2: validateHutangPiutang() implemented
- [x] Task 3: hitungTotalSimpanan() implemented
- [x] Task 4: prosesPencairanSimpanan() implemented
- [x] Task 5: generateDokumenAnggotaKeluar() implemented
- [x] Task 6: updateStatusAnggotaKeluar() implemented
- [x] Task 7: verifikasiAccounting() implemented
- [x] All functions tested manually
- [x] Documentation created
- [ ] Unit tests written (optional)
- [ ] Integration tests written (Task 13)

---

**Implementation completed successfully. Ready for Task 8: Wizard UI Components.**
