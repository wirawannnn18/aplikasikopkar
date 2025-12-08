# Design Document

## Overview

Dokumen ini merancang solusi untuk menghapus permanen data anggota keluar setelah surat pengunduran diri di-print. Fitur ini memberikan opsi kepada admin untuk membersihkan data anggota yang sudah keluar dari sistem, sambil tetap mempertahankan jurnal akuntansi dan audit trail untuk keperluan audit.

**Tujuan:**
- Memberikan opsi untuk menghapus permanen data anggota keluar
- Mempertahankan integritas jurnal akuntansi dan audit trail
- Mencegah penghapusan data yang tidak disengaja dengan validasi ketat
- Membersihkan storage dari data yang tidak diperlukan lagi

**Prinsip Desain:**
- **Safety First**: Validasi ketat dan konfirmasi eksplisit sebelum penghapusan
- **Audit Trail**: Jurnal dan audit log tetap tersimpan
- **Optional**: Admin bisa memilih untuk tidak menghapus data
- **Atomic**: Penghapusan dilakukan secara atomic dengan rollback jika error

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         UI Layer                             │
├─────────────────────────────────────────────────────────────┤
│  - Tombol "Hapus Data Permanen" (setelah print surat)      │
│  - Modal Konfirmasi Penghapusan                             │
│  - Notifikasi Sukses/Error                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                      │
├─────────────────────────────────────────────────────────────┤
│  - validateDeletion() - Validasi kelayakan hapus           │
│  - deleteAnggotaKeluarPermanent() - Hapus data permanen    │
│  - createDeletionAuditLog() - Catat ke audit log           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
├─────────────────────────────────────────────────────────────┤
│  - localStorage: anggota (DIHAPUS)                          │
│  - localStorage: simpananPokok (DIHAPUS)                    │
│  - localStorage: simpananWajib (DIHAPUS)                    │
│  - localStorage: simpananSukarela (DIHAPUS)                 │
│  - localStorage: penjualan (DIHAPUS jika terkait)           │
│  - localStorage: pinjaman (DIHAPUS jika lunas)              │
│  - localStorage: jurnal (DIPERTAHANKAN)                     │
│  - localStorage: pengembalian (DIPERTAHANKAN)               │
│  - localStorage: auditLogsAnggotaKeluar (DIPERTAHANKAN)     │
└─────────────────────────────────────────────────────────────┘
```


### Component Interaction Flow

```
User Action: Klik "Hapus Data Permanen"
        │
        ▼
┌──────────────────────┐
│ Validasi Penghapusan │
│ validateDeletion()   │
└──────────────────────┘
        │
        ├─── Check: pengembalianStatus = 'Selesai'
        ├─── Check: Tidak ada pinjaman aktif
        ├─── Check: Tidak ada hutang POS
        │
        ▼
┌──────────────────────┐
│ Tampilkan Konfirmasi │
│ Modal dengan detail  │
└──────────────────────┘
        │
        ▼ (User ketik "HAPUS")
┌──────────────────────┐
│ deleteAnggotaKeluar  │
│ Permanent()          │
└──────────────────────┘
        │
        ├─── 1. Create Snapshot (rollback)
        ├─── 2. Delete from anggota
        ├─── 3. Delete from simpananPokok
        ├─── 4. Delete from simpananWajib
        ├─── 5. Delete from simpananSukarela
        ├─── 6. Delete from penjualan (if any)
        ├─── 7. Delete from pinjaman (if lunas)
        ├─── 8. Delete from pembayaranHutangPiutang
        ├─── 9. Create Audit Log
        └─── 10. Invalidate Cache
        │
        ▼
┌──────────────────────┐
│ Notifikasi Sukses    │
│ Refresh UI           │
└──────────────────────┘
```

## Components and Interfaces

### 1. New: `validateDeletion()` Function

**Location:** `js/anggotaKeluarManager.js`

**Purpose:** Validasi kelayakan penghapusan data anggota keluar

**Signature:**
```javascript
function validateDeletion(anggotaId)
```

**Implementation:**
```javascript
/**
 * Validate if anggota keluar data can be permanently deleted
 * @param {string} anggotaId - ID of the anggota
 * @returns {object} Validation result
 */
function validateDeletion(anggotaId) {
    try {
        // Validate input
        if (!anggotaId || typeof anggotaId !== 'string') {
            return {
                valid: false,
                error: {
                    code: 'INVALID_PARAMETER',
                    message: 'ID anggota tidak valid'
                }
            };
        }
        
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
        
        // Validation 1: Check pengembalianStatus = 'Selesai'
        if (anggota.pengembalianStatus !== 'Selesai') {
            return {
                valid: false,
                error: {
                    code: 'PENGEMBALIAN_NOT_COMPLETED',
                    message: 'Penghapusan hanya bisa dilakukan setelah pengembalian selesai'
                }
            };
        }
        
        // Validation 2: Check for active loans
        const pinjamanAktif = getPinjamanAktif(anggotaId);
        if (pinjamanAktif.length > 0) {
            return {
                valid: false,
                error: {
                    code: 'ACTIVE_LOAN_EXISTS',
                    message: `Anggota masih memiliki ${pinjamanAktif.length} pinjaman aktif`
                }
            };
        }
        
        // Validation 3: Check for outstanding hutang POS
        const hutangPOS = getKewajibanLain(anggotaId);
        if (hutangPOS > 0) {
            return {
                valid: false,
                error: {
                    code: 'OUTSTANDING_DEBT_EXISTS',
                    message: `Anggota masih memiliki hutang POS sebesar Rp ${hutangPOS.toLocaleString('id-ID')}`
                }
            };
        }
        
        // All validations passed
        return {
            valid: true,
            data: {
                anggotaId: anggotaId,
                anggotaNama: anggota.nama,
                anggotaNIK: anggota.nik
            }
        };
        
    } catch (error) {
        console.error('Error in validateDeletion:', error);
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


### 2. New: `deleteAnggotaKeluarPermanent()` Function

**Location:** `js/anggotaKeluarManager.js`

**Purpose:** Menghapus permanen data anggota keluar dan semua data terkait

**Signature:**
```javascript
function deleteAnggotaKeluarPermanent(anggotaId)
```

**Implementation:**
```javascript
/**
 * Permanently delete anggota keluar data and all related records
 * @param {string} anggotaId - ID of the anggota
 * @returns {object} Deletion result
 */
function deleteAnggotaKeluarPermanent(anggotaId) {
    try {
        // Create snapshot for rollback
        const snapshot = createDeletionSnapshot();
        
        try {
            // Step 1: Validate deletion eligibility
            const validation = validateDeletion(anggotaId);
            if (!validation.valid) {
                return {
                    success: false,
                    error: validation.error
                };
            }
            
            // Step 2: Get anggota data for audit log
            const anggota = getAnggotaById(anggotaId);
            const deletedData = {
                anggota: { ...anggota },
                simpananPokok: [],
                simpananWajib: [],
                simpananSukarela: [],
                penjualan: [],
                pinjaman: [],
                pembayaran: []
            };
            
            // Step 3: Delete from anggota
            let anggotaList = JSON.parse(localStorage.getItem('anggota') || '[]');
            anggotaList = anggotaList.filter(a => a.id !== anggotaId);
            localStorage.setItem('anggota', JSON.stringify(anggotaList));
            
            // Step 4: Delete from simpananPokok
            let simpananPokok = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
            deletedData.simpananPokok = simpananPokok.filter(s => s.anggotaId === anggotaId);
            simpananPokok = simpananPokok.filter(s => s.anggotaId !== anggotaId);
            localStorage.setItem('simpananPokok', JSON.stringify(simpananPokok));
            
            // Step 5: Delete from simpananWajib
            let simpananWajib = JSON.parse(localStorage.getItem('simpananWajib') || '[]');
            deletedData.simpananWajib = simpananWajib.filter(s => s.anggotaId === anggotaId);
            simpananWajib = simpananWajib.filter(s => s.anggotaId !== anggotaId);
            localStorage.setItem('simpananWajib', JSON.stringify(simpananWajib));
            
            // Step 6: Delete from simpananSukarela
            let simpananSukarela = JSON.parse(localStorage.getItem('simpananSukarela') || '[]');
            deletedData.simpananSukarela = simpananSukarela.filter(s => s.anggotaId === anggotaId);
            simpananSukarela = simpananSukarela.filter(s => s.anggotaId !== anggotaId);
            localStorage.setItem('simpananSukarela', JSON.stringify(simpananSukarela));
            
            // Step 7: Delete from penjualan (POS transactions)
            let penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
            deletedData.penjualan = penjualan.filter(p => p.anggotaId === anggotaId);
            penjualan = penjualan.filter(p => p.anggotaId !== anggotaId);
            localStorage.setItem('penjualan', JSON.stringify(penjualan));
            
            // Step 8: Delete from pinjaman (only if lunas)
            let pinjaman = JSON.parse(localStorage.getItem('pinjaman') || '[]');
            deletedData.pinjaman = pinjaman.filter(p => 
                p.anggotaId === anggotaId && 
                p.status && 
                p.status.toLowerCase() === 'lunas'
            );
            pinjaman = pinjaman.filter(p => 
                !(p.anggotaId === anggotaId && p.status && p.status.toLowerCase() === 'lunas')
            );
            localStorage.setItem('pinjaman', JSON.stringify(pinjaman));
            
            // Step 9: Delete from pembayaranHutangPiutang
            let pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
            deletedData.pembayaran = pembayaran.filter(p => p.anggotaId === anggotaId);
            pembayaran = pembayaran.filter(p => p.anggotaId !== anggotaId);
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaran));
            
            // Step 10: Create audit log
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const auditLog = {
                id: generateId(),
                timestamp: new Date().toISOString(),
                userId: currentUser.id || 'system',
                userName: currentUser.username || 'System',
                action: 'DELETE_ANGGOTA_KELUAR_PERMANENT',
                anggotaId: anggotaId,
                anggotaNama: anggota.nama,
                details: {
                    deletedData: {
                        anggotaNIK: anggota.nik,
                        simpananPokokCount: deletedData.simpananPokok.length,
                        simpananWajibCount: deletedData.simpananWajib.length,
                        simpananSukarelaCount: deletedData.simpananSukarela.length,
                        penjualanCount: deletedData.penjualan.length,
                        pinjamanCount: deletedData.pinjaman.length,
                        pembayaranCount: deletedData.pembayaran.length
                    },
                    reason: 'Permanent deletion after pengembalian completed'
                },
                ipAddress: null,
                severity: 'WARNING'
            };
            
            saveAuditLog(auditLog);
            
            // Step 11: Invalidate cache
            if (typeof AnggotaKeluarCache !== 'undefined') {
                AnggotaKeluarCache.invalidateAll();
            }
            
            // Return success
            return {
                success: true,
                data: {
                    anggotaId: anggotaId,
                    anggotaNama: anggota.nama,
                    deletedRecords: {
                        simpananPokok: deletedData.simpananPokok.length,
                        simpananWajib: deletedData.simpananWajib.length,
                        simpananSukarela: deletedData.simpananSukarela.length,
                        penjualan: deletedData.penjualan.length,
                        pinjaman: deletedData.pinjaman.length,
                        pembayaran: deletedData.pembayaran.length
                    }
                },
                message: `Data anggota ${anggota.nama} berhasil dihapus permanen`
            };
            
        } catch (innerError) {
            // Rollback on error
            console.error('Error during deletion, rolling back:', innerError);
            restoreDeletionSnapshot(snapshot);
            throw innerError;
        }
        
    } catch (error) {
        console.error('Error in deleteAnggotaKeluarPermanent:', error);
        return {
            success: false,
            error: {
                code: 'SYSTEM_ERROR',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };
    }
}
```


### 3. New: Snapshot Functions for Deletion Rollback

**Location:** `js/anggotaKeluarManager.js`

**Purpose:** Create and restore snapshots for rollback on deletion errors

**Implementation:**
```javascript
/**
 * Create snapshot of all data that will be deleted
 * @returns {object} Snapshot of localStorage state
 */
function createDeletionSnapshot() {
    return {
        anggota: localStorage.getItem('anggota'),
        simpananPokok: localStorage.getItem('simpananPokok'),
        simpananWajib: localStorage.getItem('simpananWajib'),
        simpananSukarela: localStorage.getItem('simpananSukarela'),
        penjualan: localStorage.getItem('penjualan'),
        pinjaman: localStorage.getItem('pinjaman'),
        pembayaranHutangPiutang: localStorage.getItem('pembayaranHutangPiutang')
    };
}

/**
 * Restore snapshot to rollback deletion
 * @param {object} snapshot - Snapshot to restore
 */
function restoreDeletionSnapshot(snapshot) {
    if (snapshot.anggota) localStorage.setItem('anggota', snapshot.anggota);
    if (snapshot.simpananPokok) localStorage.setItem('simpananPokok', snapshot.simpananPokok);
    if (snapshot.simpananWajib) localStorage.setItem('simpananWajib', snapshot.simpananWajib);
    if (snapshot.simpananSukarela) localStorage.setItem('simpananSukarela', snapshot.simpananSukarela);
    if (snapshot.penjualan) localStorage.setItem('penjualan', snapshot.penjualan);
    if (snapshot.pinjaman) localStorage.setItem('pinjaman', snapshot.pinjaman);
    if (snapshot.pembayaranHutangPiutang) localStorage.setItem('pembayaranHutangPiutang', snapshot.pembayaranHutangPiutang);
}
```

### 4. Modified: UI Component - Add Delete Button

**Location:** `js/anggotaKeluarUI.js`

**Purpose:** Add "Hapus Data Permanen" button after print surat

**Implementation:**
```javascript
/**
 * Show delete confirmation modal
 * @param {string} anggotaId - ID of the anggota
 */
function showDeleteConfirmationModal(anggotaId) {
    // Validate deletion eligibility first
    const validation = validateDeletion(anggotaId);
    
    if (!validation.valid) {
        showAlert(validation.error.message, 'error');
        return;
    }
    
    const anggota = validation.data;
    
    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="deleteConfirmModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title">⚠️ Konfirmasi Penghapusan Permanen</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-danger">
                            <strong>PERINGATAN:</strong> Data yang dihapus tidak dapat dipulihkan!
                        </div>
                        
                        <h6>Data yang akan dihapus:</h6>
                        <table class="table table-sm">
                            <tr>
                                <td><strong>Nama:</strong></td>
                                <td>${anggota.anggotaNama}</td>
                            </tr>
                            <tr>
                                <td><strong>NIK:</strong></td>
                                <td>${anggota.anggotaNIK}</td>
                            </tr>
                        </table>
                        
                        <p class="mb-2"><strong>Data yang akan dihapus:</strong></p>
                        <ul>
                            <li>Data anggota</li>
                            <li>Semua data simpanan (pokok, wajib, sukarela)</li>
                            <li>Transaksi POS terkait</li>
                            <li>Data pinjaman yang sudah lunas</li>
                            <li>Riwayat pembayaran hutang/piutang</li>
                        </ul>
                        
                        <p class="mb-2"><strong>Data yang TETAP tersimpan:</strong></p>
                        <ul>
                            <li>Jurnal akuntansi</li>
                            <li>Data pengembalian simpanan</li>
                            <li>Audit log</li>
                        </ul>
                        
                        <div class="mt-3">
                            <label class="form-label">
                                Ketik <strong>HAPUS</strong> untuk konfirmasi:
                            </label>
                            <input type="text" class="form-control" id="deleteConfirmInput" 
                                   placeholder="Ketik HAPUS">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            Batal
                        </button>
                        <button type="button" class="btn btn-danger" id="btnConfirmDelete">
                            Hapus Permanen
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('deleteConfirmModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    modal.show();
    
    // Handle confirm button
    document.getElementById('btnConfirmDelete').addEventListener('click', function() {
        const confirmInput = document.getElementById('deleteConfirmInput').value;
        
        if (confirmInput !== 'HAPUS') {
            showAlert('Ketik "HAPUS" untuk konfirmasi penghapusan', 'warning');
            return;
        }
        
        // Disable button to prevent double click
        this.disabled = true;
        this.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Menghapus...';
        
        // Execute deletion
        const result = deleteAnggotaKeluarPermanent(anggotaId);
        
        if (result.success) {
            modal.hide();
            showAlert(result.message, 'success');
            
            // Refresh anggota keluar list
            if (typeof renderAnggotaKeluar === 'function') {
                renderAnggotaKeluar();
            }
            
            // Close detail modal if open
            const detailModal = document.getElementById('modalDetailAnggotaKeluar');
            if (detailModal) {
                const bsModal = bootstrap.Modal.getInstance(detailModal);
                if (bsModal) {
                    bsModal.hide();
                }
            }
        } else {
            showAlert(result.error.message, 'error');
            this.disabled = false;
            this.innerHTML = 'Hapus Permanen';
        }
    });
}
```


### 5. Modified: Add Delete Button to Surat Print Window

**Location:** `js/anggotaKeluarUI.js` - `generateSuratPengunduranDiri()` function

**Purpose:** Add delete button after print surat

**Modification:**
```javascript
// In the surat HTML, after print button, add delete button
<div class="no-print" style="margin-top: 30px; text-align: center;">
    <button onclick="window.print()" class="btn btn-primary">Cetak</button>
    <button onclick="window.close()" class="btn btn-secondary">Tutup</button>
    
    <!-- NEW: Delete button (only if pengembalianStatus = 'Selesai') -->
    <button onclick="handleDeleteAfterPrint('${anggotaId}')" 
            class="btn btn-danger" 
            id="btnDeleteAfterPrint">
        Hapus Data Permanen
    </button>
</div>

<script>
function handleDeleteAfterPrint(anggotaId) {
    // Close print window
    window.close();
    
    // Call delete function in parent window
    if (window.opener && typeof window.opener.showDeleteConfirmationModal === 'function') {
        window.opener.showDeleteConfirmationModal(anggotaId);
    }
}
</script>
```

## Data Models

### Audit Log Entry for Deletion

```javascript
{
    id: string,
    timestamp: string, // ISO date
    userId: string,
    userName: string,
    action: 'DELETE_ANGGOTA_KELUAR_PERMANENT',
    anggotaId: string,
    anggotaNama: string,
    details: {
        deletedData: {
            anggotaNIK: string,
            simpananPokokCount: number,
            simpananWajibCount: number,
            simpananSukarelaCount: number,
            penjualanCount: number,
            pinjamanCount: number,
            pembayaranCount: number
        },
        reason: string
    },
    ipAddress: string | null,
    severity: 'WARNING'
}
```

### Data Preserved After Deletion

**Jurnal Akuntansi** - Tetap tersimpan dengan referensi nama anggota
```javascript
{
    id: string,
    tanggal: string,
    keterangan: string, // Contains anggota name
    entries: array,
    // ... other fields
}
```

**Pengembalian Record** - Tetap tersimpan untuk referensi historis
```javascript
{
    id: string,
    anggotaId: string, // ID will be orphaned but kept for reference
    anggotaNama: string, // Name preserved
    anggotaNIK: string, // NIK preserved
    // ... other fields
}
```

## Error Handling

### Validation Errors

```javascript
// Error when pengembalian not completed
{
    code: 'PENGEMBALIAN_NOT_COMPLETED',
    message: 'Penghapusan hanya bisa dilakukan setelah pengembalian selesai'
}

// Error when active loans exist
{
    code: 'ACTIVE_LOAN_EXISTS',
    message: 'Anggota masih memiliki N pinjaman aktif'
}

// Error when outstanding debt exists
{
    code: 'OUTSTANDING_DEBT_EXISTS',
    message: 'Anggota masih memiliki hutang POS sebesar Rp X'
}
```

### Deletion Errors

```javascript
// Error during deletion process
{
    code: 'SYSTEM_ERROR',
    message: error.message,
    timestamp: ISO string
}
```

### Rollback on Error

All deletions are wrapped in try-catch with snapshot/restore:

```javascript
try {
    const snapshot = createDeletionSnapshot();
    try {
        // Delete data
    } catch (innerError) {
        restoreDeletionSnapshot(snapshot);
        throw innerError;
    }
} catch (error) {
    return { success: false, error: {...} };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Deletion only after pengembalian completed

*For any* anggota keluar, deletion should only be allowed if pengembalianStatus = 'Selesai'.

**Validates: Requirements 4.1**

### Property 2: Deletion blocks with active obligations

*For any* anggota keluar with active pinjaman or outstanding hutang POS, deletion should be rejected.

**Validates: Requirements 6.4, 6.5**

### Property 3: Anggota data removed after deletion

*For any* successful deletion, the anggota record should not exist in localStorage anggota.

**Validates: Requirements 1.2**

### Property 4: Simpanan data removed after deletion

*For any* successful deletion, all simpanan records (pokok, wajib, sukarela) for that anggota should not exist in their respective localStorage.

**Validates: Requirements 1.3, 1.4, 1.5**

### Property 5: Jurnal preserved after deletion

*For any* successful deletion, all jurnal entries should remain unchanged in localStorage jurnal.

**Validates: Requirements 2.1**

### Property 6: Pengembalian record preserved after deletion

*For any* successful deletion, the pengembalian record should remain in localStorage pengembalian.

**Validates: Requirements 2.2**

### Property 7: Audit log preserved after deletion

*For any* successful deletion, all audit log entries should remain in localStorage auditLogsAnggotaKeluar.

**Validates: Requirements 2.3**

### Property 8: Deletion creates audit log entry

*For any* successful deletion, a new audit log entry with action 'DELETE_ANGGOTA_KELUAR_PERMANENT' should be created.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 9: Confirmation required for deletion

*For any* deletion attempt, the user must type "HAPUS" in the confirmation input before deletion proceeds.

**Validates: Requirements 5.4**

### Property 10: Rollback on deletion error

*For any* deletion process that encounters an error, all data should be restored to the state before deletion started.

**Validates: Requirements 7.4**

## Testing Strategy

### Unit Tests

1. **Test `validateDeletion()` blocks incomplete pengembalian**
   - Input: anggotaId with pengembalianStatus != 'Selesai'
   - Expected: valid = false

2. **Test `validateDeletion()` blocks active loans**
   - Input: anggotaId with active pinjaman
   - Expected: valid = false

3. **Test `validateDeletion()` blocks outstanding debt**
   - Input: anggotaId with hutang POS > 0
   - Expected: valid = false

4. **Test `deleteAnggotaKeluarPermanent()` removes anggota**
   - Input: valid anggotaId
   - Expected: anggota not in localStorage

5. **Test `deleteAnggotaKeluarPermanent()` removes simpanan**
   - Input: valid anggotaId
   - Expected: no simpanan records for anggotaId

6. **Test `deleteAnggotaKeluarPermanent()` preserves jurnal**
   - Input: valid anggotaId
   - Expected: jurnal unchanged

7. **Test `deleteAnggotaKeluarPermanent()` creates audit log**
   - Input: valid anggotaId
   - Expected: new audit log entry created

### Integration Tests

1. **Test complete deletion flow**
   - Mark anggota keluar → process pengembalian → print surat → delete data
   - Verify all data removed except jurnal and audit

2. **Test deletion rollback on error**
   - Inject error during deletion
   - Verify all data restored

3. **Test UI confirmation flow**
   - Click delete button → enter "HAPUS" → confirm
   - Verify deletion executed

4. **Test UI rejection flow**
   - Click delete button → enter wrong text → confirm
   - Verify deletion not executed

### Property-Based Testing

**Framework:** fast-check (JavaScript property-based testing library)

**Configuration:** Each property test should run a minimum of 100 iterations.

**Test Tagging:** Each property-based test must include a comment tag:
```javascript
// Feature: hapus-data-anggota-keluar-setelah-print, Property X: [property description]
```

## Security Considerations

1. **Authorization**: Only admin users should have access to delete button
2. **Confirmation**: Explicit confirmation required with "HAPUS" text
3. **Validation**: Multiple validation checks before deletion
4. **Audit Trail**: All deletions logged with user ID and timestamp
5. **Rollback**: Automatic rollback on any error during deletion
6. **Data Preservation**: Critical data (jurnal, audit log) never deleted

## Performance Considerations

1. **Atomic Operation**: All deletions happen in single transaction
2. **Cache Invalidation**: Clear all caches after deletion
3. **Snapshot Size**: Snapshot only includes data that will be deleted
4. **UI Feedback**: Show loading spinner during deletion process

## Migration Notes

- No data migration required
- Feature is additive (adds new functionality)
- Existing data structure unchanged
- Backward compatible with existing code
