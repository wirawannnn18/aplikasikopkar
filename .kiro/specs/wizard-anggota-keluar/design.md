# Design Document

## Overview

Dokumen ini merancang wizard 5-tahap untuk proses anggota keluar yang terstruktur dan terintegrasi dengan sistem accounting. Wizard ini akan memastikan bahwa:

1. Semua kewajiban finansial diselesaikan sebelum anggota keluar
2. Pencairan simpanan dilakukan dengan jurnal accounting otomatis
3. Dokumen resmi dicetak untuk arsip
4. Status anggota diupdate dengan benar
5. Tidak ada selisih keuangan

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      UI Layer (Wizard)                       │
├─────────────────────────────────────────────────────────────┤
│  Step 1: Validasi Hutang/Piutang                            │
│  Step 2: Pencairan Simpanan                                 │
│  Step 3: Print Dokumen                                       │
│  Step 4: Update Status                                       │
│  Step 5: Verifikasi Accounting                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Business Logic Layer                        │
├─────────────────────────────────────────────────────────────┤
│  - WizardController: Manages wizard state and navigation    │
│  - ValidationService: Validates each step                   │
│  - PencairanService: Processes refund with journals         │
│  - DocumentService: Generates printable documents           │
│  - AccountingService: Verifies accounting integrity         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
├─────────────────────────────────────────────────────────────┤
│  - localStorage: anggota, pinjaman, piutang                 │
│  - localStorage: simpananPokok, simpananWajib, sukarela     │
│  - localStorage: jurnal, pengembalian                       │
│  - localStorage: auditLog                                   │
└─────────────────────────────────────────────────────────────┘
```

### Wizard State Machine

```
┌──────────────┐
│   INITIAL    │
└──────┬───────┘
       │
       ▼
┌──────────────┐     Validation Failed
│   STEP 1     │────────────────────────┐
│  Validasi    │                        │
└──────┬───────┘                        │
       │ Validation OK                  │
       ▼                                │
┌──────────────┐                        │
│   STEP 2     │                        │
│  Pencairan   │                        │
└──────┬───────┘                        │
       │ Pencairan OK                   │
       ▼                                │
┌──────────────┐                        │
│   STEP 3     │                        │
│    Print     │                        │
└──────┬───────┘                        │
       │ Print OK                       │
       ▼                                │
┌──────────────┐                        │
│   STEP 4     │                        │
│   Update     │                        │
└──────┬───────┘                        │
       │ Update OK                      │
       ▼                                │
┌──────────────┐                        │
│   STEP 5     │                        │
│  Verifikasi  │                        │
└──────┬───────┘                        │
       │ Verification OK                │
       ▼                                │
┌──────────────┐                        │
│  COMPLETED   │                        │
└──────────────┘                        │
       │                                │
       └────────────────────────────────┘
                  ERROR
```

## Components and Interfaces

### 1. New: `AnggotaKeluarWizard` Class

**Location:** `js/anggotaKeluarWizard.js` (new file)

**Purpose:** Main wizard controller that manages state and navigation

**Interface:**
```javascript
class AnggotaKeluarWizard {
    constructor(anggotaId) {
        this.anggotaId = anggotaId;
        this.currentStep = 1;
        this.maxStep = 5;
        this.wizardData = {
            validationResult: null,
            pencairanData: null,
            documentRefs: null,
            updateResult: null,
            verificationResult: null
        };
        this.snapshot = null;
    }
    
    // Navigation methods
    nextStep()
    previousStep()
    goToStep(stepNumber)
    canNavigateNext()
    canNavigatePrevious()
    
    // Step execution methods
    executeStep1Validation()
    executeStep2Pencairan(metodePembayaran, tanggalPembayaran)
    executeStep3Print()
    executeStep4Update()
    executeStep5Verification()
    
    // State management
    saveSnapshot()
    rollback()
    getWizardState()
    
    // UI rendering
    renderStepIndicator()
    renderCurrentStep()
    renderNavigationButtons()
}
```

### 2. New: `validateHutangPiutang()` Function

**Location:** `js/anggotaKeluarManager.js`

**Purpose:** Validate if anggota has outstanding debts

**Signature:**
```javascript
function validateHutangPiutang(anggotaId)
```

**Implementation:**
```javascript
/**
 * Validate if anggota has outstanding loans or receivables
 * @param {string} anggotaId - ID of the anggota
 * @returns {object} Validation result with details
 */
function validateHutangPiutang(anggotaId) {
    try {
        // Get anggota data
        const anggota = getAnggotaById(anggotaId);
        if (!anggota) {
            return {
                valid: false,
                error: {
                    code: 'ANGGOTA_NOT_FOUND',
                    message: 'Anggota tidak ditemukan'
                }
            };
        }
        
        // Check for active loans
        const pinjaman = JSON.parse(localStorage.getItem('pinjaman') || '[]');
        const pinjamanAktif = pinjaman.filter(p => 
            p.anggotaId === anggotaId && 
            (p.sisaPinjaman || 0) > 0
        );
        
        // Check for active receivables
        const piutang = JSON.parse(localStorage.getItem('piutang') || '[]');
        const piutangAktif = piutang.filter(p => 
            p.anggotaId === anggotaId && 
            (p.sisaPiutang || 0) > 0
        );
        
        // Calculate totals
        const totalPinjaman = pinjamanAktif.reduce((sum, p) => sum + (p.sisaPinjaman || 0), 0);
        const totalPiutang = piutangAktif.reduce((sum, p) => sum + (p.sisaPiutang || 0), 0);
        
        const hasDebt = pinjamanAktif.length > 0 || piutangAktif.length > 0;
        
        if (hasDebt) {
            return {
                valid: false,
                error: {
                    code: 'OUTSTANDING_DEBT_EXISTS',
                    message: 'Anggota masih memiliki kewajiban finansial yang belum diselesaikan',
                    details: {
                        pinjamanCount: pinjamanAktif.length,
                        totalPinjaman: totalPinjaman,
                        piutangCount: piutangAktif.length,
                        totalPiutang: totalPiutang,
                        pinjaman: pinjamanAktif,
                        piutang: piutangAktif
                    }
                }
            };
        }
        
        return {
            valid: true,
            message: 'Validasi berhasil, tidak ada kewajiban finansial'
        };
        
    } catch (error) {
        console.error('Error in validateHutangPiutang:', error);
        return {
            valid: false,
            error: {
                code: 'SYSTEM_ERROR',
                message: error.message
            }
        };
    }
}
```

### 3. New: `hitungTotalSimpanan()` Function

**Location:** `js/anggotaKeluarManager.js`

**Purpose:** Calculate total simpanan for refund

**Signature:**
```javascript
function hitungTotalSimpanan(anggotaId)
```

**Implementation:**
```javascript
/**
 * Calculate total simpanan for an anggota
 * @param {string} anggotaId - ID of the anggota
 * @returns {object} Calculation result with breakdown
 */
function hitungTotalSimpanan(anggotaId) {
    try {
        const anggota = getAnggotaById(anggotaId);
        if (!anggota) {
            return {
                success: false,
                error: 'Anggota tidak ditemukan'
            };
        }
        
        // Get simpanan data
        const simpananPokok = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
        const simpananWajib = JSON.parse(localStorage.getItem('simpananWajib') || '[]');
        const simpananSukarela = JSON.parse(localStorage.getItem('simpananSukarela') || '[]');
        
        // Calculate totals
        const totalPokok = simpananPokok
            .filter(s => s.anggotaId === anggotaId && (s.jumlah || 0) > 0)
            .reduce((sum, s) => sum + (s.jumlah || 0), 0);
        
        const totalWajib = simpananWajib
            .filter(s => s.anggotaId === anggotaId && (s.jumlah || 0) > 0)
            .reduce((sum, s) => sum + (s.jumlah || 0), 0);
        
        const totalSukarela = simpananSukarela
            .filter(s => s.anggotaId === anggotaId && (s.jumlah || 0) > 0)
            .reduce((sum, s) => sum + (s.jumlah || 0), 0);
        
        const total = totalPokok + totalWajib + totalSukarela;
        
        // Get current kas and bank balance
        const jurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
        const kasBalance = jurnal
            .filter(j => j.akun === '1-1000')
            .reduce((sum, j) => sum + (j.debit || 0) - (j.kredit || 0), 0);
        
        const bankBalance = jurnal
            .filter(j => j.akun === '1-1100')
            .reduce((sum, j) => sum + (j.debit || 0) - (j.kredit || 0), 0);
        
        return {
            success: true,
            data: {
                anggotaId: anggotaId,
                anggotaNama: anggota.nama,
                simpananPokok: totalPokok,
                simpananWajib: totalWajib,
                simpananSukarela: totalSukarela,
                totalSimpanan: total,
                kasBalance: kasBalance,
                bankBalance: bankBalance,
                totalAvailable: kasBalance + bankBalance
            }
        };
        
    } catch (error) {
        console.error('Error in hitungTotalSimpanan:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
```

### 4. New: `prosesPencairanSimpanan()` Function

**Location:** `js/anggotaKeluarManager.js`

**Purpose:** Process simpanan refund with automatic journal entries

**Signature:**
```javascript
function prosesPencairanSimpanan(anggotaId, metodePembayaran, tanggalPembayaran, keterangan = '')
```

**Implementation:**
```javascript
/**
 * Process simpanan refund with automatic journal entries
 * @param {string} anggotaId - ID of the anggota
 * @param {string} metodePembayaran - Payment method (Kas/Transfer Bank)
 * @param {string} tanggalPembayaran - Payment date (YYYY-MM-DD)
 * @param {string} keterangan - Optional notes
 * @returns {object} Processing result
 */
function prosesPencairanSimpanan(anggotaId, metodePembayaran, tanggalPembayaran, keterangan = '') {
    try {
        // Create snapshot for rollback
        const snapshot = createSnapshot();
        
        try {
            // Get anggota and calculate simpanan
            const anggota = getAnggotaById(anggotaId);
            const calculation = hitungTotalSimpanan(anggotaId);
            
            if (!calculation.success) {
                throw new Error(calculation.error);
            }
            
            const data = calculation.data;
            const akunKas = metodePembayaran === 'Kas' ? '1-1000' : '1-1100';
            const jurnalIds = [];
            
            // Create journal for simpanan pokok
            if (data.simpananPokok > 0) {
                const jurnalPokok = {
                    id: generateId(),
                    tanggal: tanggalPembayaran,
                    keterangan: `Pencairan Simpanan Pokok - ${anggota.nama}`,
                    entries: [
                        { akun: '2-1100', debit: data.simpananPokok, kredit: 0 },
                        { akun: akunKas, debit: 0, kredit: data.simpananPokok }
                    ]
                };
                saveJurnal(jurnalPokok);
                jurnalIds.push(jurnalPokok.id);
            }
            
            // Create journal for simpanan wajib
            if (data.simpananWajib > 0) {
                const jurnalWajib = {
                    id: generateId(),
                    tanggal: tanggalPembayaran,
                    keterangan: `Pencairan Simpanan Wajib - ${anggota.nama}`,
                    entries: [
                        { akun: '2-1200', debit: data.simpananWajib, kredit: 0 },
                        { akun: akunKas, debit: 0, kredit: data.simpananWajib }
                    ]
                };
                saveJurnal(jurnalWajib);
                jurnalIds.push(jurnalWajib.id);
            }
            
            // Create journal for simpanan sukarela
            if (data.simpananSukarela > 0) {
                const jurnalSukarela = {
                    id: generateId(),
                    tanggal: tanggalPembayaran,
                    keterangan: `Pencairan Simpanan Sukarela - ${anggota.nama}`,
                    entries: [
                        { akun: '2-1300', debit: data.simpananSukarela, kredit: 0 },
                        { akun: akunKas, debit: 0, kredit: data.simpananSukarela }
                    ]
                };
                saveJurnal(jurnalSukarela);
                jurnalIds.push(jurnalSukarela.id);
            }
            
            // Create pengembalian record
            const pengembalianId = generateId();
            const pengembalian = {
                id: pengembalianId,
                anggotaId: anggotaId,
                anggotaNama: anggota.nama,
                anggotaNIK: anggota.nik,
                simpananPokok: data.simpananPokok,
                simpananWajib: data.simpananWajib,
                simpananSukarela: data.simpananSukarela,
                totalPengembalian: data.totalSimpanan,
                metodePembayaran: metodePembayaran,
                tanggalPembayaran: tanggalPembayaran,
                keterangan: keterangan,
                jurnalIds: jurnalIds,
                nomorReferensi: `PGM-${Date.now()}`,
                createdAt: new Date().toISOString(),
                createdBy: getCurrentUser().username
            };
            
            // Save pengembalian
            let pengembalianList = JSON.parse(localStorage.getItem('pengembalian') || '[]');
            pengembalianList.push(pengembalian);
            localStorage.setItem('pengembalian', JSON.stringify(pengembalianList));
            
            // Create audit log
            saveAuditLog({
                id: generateId(),
                timestamp: new Date().toISOString(),
                userId: getCurrentUser().id,
                userName: getCurrentUser().username,
                action: 'PROSES_PENCAIRAN_SIMPANAN',
                anggotaId: anggotaId,
                anggotaNama: anggota.nama,
                details: {
                    totalPencairan: data.totalSimpanan,
                    metodePembayaran: metodePembayaran,
                    jurnalIds: jurnalIds
                },
                severity: 'INFO'
            });
            
            return {
                success: true,
                data: {
                    pengembalianId: pengembalianId,
                    totalPencairan: data.totalSimpanan,
                    jurnalIds: jurnalIds
                },
                message: 'Pencairan simpanan berhasil diproses'
            };
            
        } catch (innerError) {
            // Rollback on error
            restoreSnapshot(snapshot);
            throw innerError;
        }
        
    } catch (error) {
        console.error('Error in prosesPencairanSimpanan:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
```

### 5. New: `generateDokumenAnggotaKeluar()` Function

**Location:** `js/anggotaKeluarUI.js`

**Purpose:** Generate printable documents

**Signature:**
```javascript
function generateDokumenAnggotaKeluar(anggotaId, pengembalianId)
```

**Returns:** Object with document references

### 6. New: `updateStatusAnggotaKeluar()` Function

**Location:** `js/anggotaKeluarManager.js`

**Purpose:** Update anggota status to keluar

**Signature:**
```javascript
function updateStatusAnggotaKeluar(anggotaId, tanggalKeluar, alasanKeluar, pengembalianId, dokumenRefs)
```

### 7. New: `verifikasiAccounting()` Function

**Location:** `js/anggotaKeluarManager.js`

**Purpose:** Verify accounting integrity

**Signature:**
```javascript
function verifikasiAccounting(anggotaId, pengembalianId)
```

## Data Models

### New: WizardState Data Structure

```javascript
{
    anggotaId: string,
    currentStep: number,
    maxStep: number,
    wizardData: {
        validationResult: {
            valid: boolean,
            error: object | null
        },
        pencairanData: {
            pengembalianId: string,
            totalPencairan: number,
            jurnalIds: array
        },
        documentRefs: {
            suratId: string,
            buktiId: string,
            tanggalPrint: string
        },
        updateResult: {
            success: boolean,
            anggotaId: string
        },
        verificationResult: {
            valid: boolean,
            details: object
        }
    },
    createdAt: string,
    completedAt: string | null
}
```

## Error Handling

### Validation Errors

```javascript
{
    code: 'OUTSTANDING_DEBT_EXISTS',
    message: 'Anggota masih memiliki kewajiban finansial',
    details: {
        pinjamanCount: number,
        totalPinjaman: number,
        piutangCount: number,
        totalPiutang: number
    }
}
```

### Rollback Mechanism

All critical operations wrapped in try-catch with snapshot/restore:

```javascript
const snapshot = createSnapshot();
try {
    // Execute operations
} catch (error) {
    restoreSnapshot(snapshot);
    throw error;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Validation blocks progress when debt exists

*For any* anggota with outstanding loans or receivables, the wizard should block navigation to step 2.

**Validates: Requirements 1.4, 1.5**

### Property 2: Simpanan calculation accuracy

*For any* anggota, the total simpanan should equal the sum of simpanan pokok, wajib, and sukarela.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 3: Journal double-entry balance

*For any* journal entry created during pencairan, total debit must equal total kredit.

**Validates: Requirements 3.4**

### Property 4: Journal references completeness

*For any* pengembalian record, it should have jurnalIds array with all created journal IDs.

**Validates: Requirements 3.5**

### Property 5: Document generation completeness

*For any* completed wizard, document references should include both surat and bukti IDs.

**Validates: Requirements 4.3, 4.4, 4.5**

### Property 6: Status update completeness

*For any* completed wizard, anggota should have statusKeanggotaan = 'Keluar', tanggalKeluar, alasanKeluar, and pengembalianId populated.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

### Property 7: Accounting verification accuracy

*For any* pengembalian, the sum of journal entries should equal the total pencairan amount.

**Validates: Requirements 6.2, 6.3**

### Property 8: Step indicator accuracy

*For any* wizard state, the step indicator should correctly reflect current, completed, and pending steps.

**Validates: Requirements 7.2, 7.3, 7.4**

### Property 9: Sequential validation enforcement

*For any* wizard, navigation to step N should only be allowed if steps 1 through N-1 are completed.

**Validates: Requirements 8.1, 8.2, 8.3**

### Property 10: Audit log completeness

*For any* wizard execution, audit logs should exist for start, each step completion, and final result.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

### Property 11: Rollback data consistency

*For any* wizard that encounters an error, all data should be restored to the state before the wizard started.

**Validates: Requirements 10.1, 10.2, 10.3**

## Testing Strategy

### Unit Tests

1. **Test `validateHutangPiutang()` blocks when debt exists**
2. **Test `hitungTotalSimpanan()` calculates correctly**
3. **Test `prosesPencairanSimpanan()` creates journals**
4. **Test wizard navigation logic**
5. **Test rollback mechanism**

### Property-Based Testing

**Framework:** fast-check (JavaScript property-based testing library)

**Configuration:** Each property test should run a minimum of 100 iterations.

**Test Tagging:** Each property-based test must include a comment tag:
```javascript
// Feature: wizard-anggota-keluar, Property X: [property description]
```

### Integration Tests

1. **Test complete wizard flow from start to finish**
2. **Test wizard with various anggota scenarios**
3. **Test error handling and rollback**
4. **Test UI rendering and navigation**
