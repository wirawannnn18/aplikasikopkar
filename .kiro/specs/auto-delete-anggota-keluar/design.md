# Design Document

## Overview

Dokumen ini merancang solusi untuk mengubah desain sistem dari menyimpan anggota keluar dengan `statusKeanggotaan = 'Keluar'` menjadi **menghapus otomatis** data anggota setelah pengembalian selesai. Perubahan ini akan membersihkan database dari data yang tidak diperlukan dan menyederhanakan logika aplikasi.

**Tujuan:**
- Menghapus otomatis data anggota setelah pengembalian selesai
- Mengubah status anggota menjadi "Nonaktif" sebelum dihapus untuk audit trail
- Menghapus field `statusKeanggotaan` dari data model
- Mempertahankan menu "Anggota Keluar" menggunakan data dari tabel pengembalian
- Mempertahankan integritas jurnal akuntansi dan audit trail

**Prinsip Desain:**
- **Auto-Delete**: Penghapusan otomatis tanpa intervensi manual
- **Audit Trail**: Semua perubahan dicatat dengan lengkap
- **Data Integrity**: Jurnal dan audit log tetap tersimpan
- **Backward Compatible**: Migrasi data lama dengan aman

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Current Design (OLD)                      │
├─────────────────────────────────────────────────────────────┤
│  Anggota Table:                                             │
│  - id, nama, nik, status, statusKeanggotaan, ...           │
│  - statusKeanggotaan = 'Keluar' (kept in database)         │
│                                                             │
│  Master Anggota View:                                       │
│  - Filter: statusKeanggotaan !== 'Keluar'                  │
│                                                             │
│  Anggota Keluar View:                                       │
│  - Filter: statusKeanggotaan === 'Keluar'                  │
└─────────────────────────────────────────────────────────────┘

                            ▼ MIGRATION ▼

┌─────────────────────────────────────────────────────────────┐
│                     New Design (NEW)                         │
├─────────────────────────────────────────────────────────────┤
│  Anggota Table:                                             │
│  - id, nama, nik, status, ... (NO statusKeanggotaan)       │
│  - Anggota keluar DELETED from table                        │
│                                                             │
│  Master Anggota View:                                       │
│  - No filter needed (keluar already deleted)                │
│                                                             │
│  Anggota Keluar View:                                       │
│  - Data from Pengembalian table (historical)                │
└─────────────────────────────────────────────────────────────┘
```


### Component Interaction Flow

```
User Action: Proses Pengembalian Simpanan
        │
        ▼
┌──────────────────────────┐
│ 1. Ubah Status Nonaktif  │
│    status = 'Nonaktif'   │
└──────────────────────────┘
        │
        ▼
┌──────────────────────────┐
│ 2. Proses Pengembalian   │
│    - Kembalikan simpanan │
│    - Buat jurnal         │
└──────────────────────────┘
        │
        ▼
┌──────────────────────────┐
│ 3. Validasi Penghapusan  │
│    - Cek pinjaman aktif  │
│    - Cek hutang POS      │
└──────────────────────────┘
        │
        ▼ (All validations passed)
┌──────────────────────────┐
│ 4. Auto-Delete Anggota   │
│    - Delete from anggota │
│    - Delete simpanan     │
│    - Delete transaksi    │
│    - Create audit log    │
└──────────────────────────┘
        │
        ▼
┌──────────────────────────┐
│ 5. Notifikasi Sukses     │
│    Refresh UI            │
└──────────────────────────┘
```

## Components and Interfaces

### 1. Modified: `markAnggotaKeluar()` Function

**Location:** `js/anggotaKeluarManager.js`

**Purpose:** Mengubah status anggota menjadi "Nonaktif" saat ditandai keluar

**Changes:**
- Remove: `statusKeanggotaan = 'Keluar'`
- Add: `status = 'Nonaktif'`
- Add: Audit log untuk perubahan status

**New Implementation:**
```javascript
function markAnggotaKeluar(anggotaId, tanggalKeluar, alasanKeluar) {
    try {
        // Get anggota data
        const anggota = getAnggotaById(anggotaId);
        if (!anggota) {
            return {
                success: false,
                error: { code: 'ANGGOTA_NOT_FOUND', message: 'Anggota tidak ditemukan' }
            };
        }
        
        // Update status to Nonaktif (instead of statusKeanggotaan = 'Keluar')
        const oldStatus = anggota.status;
        anggota.status = 'Nonaktif';
        anggota.tanggalKeluar = tanggalKeluar;
        anggota.alasanKeluar = alasanKeluar;
        anggota.pengembalianStatus = 'Pending';
        
        // Save to localStorage
        let anggotaList = JSON.parse(localStorage.getItem('anggota') || '[]');
        const index = anggotaList.findIndex(a => a.id === anggotaId);
        if (index !== -1) {
            anggotaList[index] = anggota;
            localStorage.setItem('anggota', JSON.stringify(anggotaList));
        }
        
        // Create audit log for status change
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const auditLog = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            userId: currentUser.id || 'system',
            userName: currentUser.username || 'System',
            action: 'MARK_ANGGOTA_KELUAR',
            anggotaId: anggotaId,
            anggotaNama: anggota.nama,
            details: {
                oldStatus: oldStatus,
                newStatus: 'Nonaktif',
                tanggalKeluar: tanggalKeluar,
                alasanKeluar: alasanKeluar
            },
            severity: 'INFO'
        };
        saveAuditLog(auditLog);
        
        return {
            success: true,
            data: { anggotaId, anggotaNama: anggota.nama }
        };
        
    } catch (error) {
        console.error('Error in markAnggotaKeluar:', error);
        return {
            success: false,
            error: { code: 'SYSTEM_ERROR', message: error.message }
        };
    }
}
```


### 2. Modified: `prosesPengembalianSimpanan()` Function

**Location:** `js/anggotaKeluarManager.js`

**Purpose:** Menghapus otomatis data anggota setelah pengembalian selesai

**Changes:**
- Add: Auto-delete logic after pengembalian selesai
- Add: Validation before delete
- Add: Audit log for deletion

**New Implementation:**
```javascript
function prosesPengembalianSimpanan(anggotaId, metodePembayaran, catatanPengembalian) {
    try {
        // ... existing pengembalian logic ...
        
        // After pengembalian selesai, auto-delete anggota
        if (pengembalianStatus === 'Selesai') {
            // Validate deletion eligibility
            const validation = validateDeletionEligibility(anggotaId);
            if (!validation.valid) {
                // If validation fails, keep anggota but log warning
                console.warn('Cannot auto-delete anggota:', validation.error);
                const auditLog = {
                    id: generateId(),
                    timestamp: new Date().toISOString(),
                    userId: currentUser.id || 'system',
                    userName: currentUser.username || 'System',
                    action: 'AUTO_DELETE_FAILED',
                    anggotaId: anggotaId,
                    anggotaNama: anggota.nama,
                    details: {
                        reason: validation.error.message
                    },
                    severity: 'WARNING'
                };
                saveAuditLog(auditLog);
            } else {
                // Auto-delete anggota
                const deleteResult = autoDeleteAnggotaKeluar(anggotaId);
                if (!deleteResult.success) {
                    console.error('Auto-delete failed:', deleteResult.error);
                }
            }
        }
        
        return {
            success: true,
            data: { /* pengembalian data */ }
        };
        
    } catch (error) {
        console.error('Error in prosesPengembalianSimpanan:', error);
        return {
            success: false,
            error: { code: 'SYSTEM_ERROR', message: error.message }
        };
    }
}
```

### 3. New: `validateDeletionEligibility()` Function

**Location:** `js/anggotaKeluarManager.js`

**Purpose:** Validasi apakah anggota bisa dihapus

**Implementation:**
```javascript
function validateDeletionEligibility(anggotaId) {
    try {
        // Get anggota data
        const anggota = getAnggotaById(anggotaId);
        if (!anggota) {
            return {
                valid: false,
                error: { code: 'ANGGOTA_NOT_FOUND', message: 'Anggota tidak ditemukan' }
            };
        }
        
        // Check for active loans
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
        
        // Check for outstanding hutang POS
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
        
        return { valid: true };
        
    } catch (error) {
        console.error('Error in validateDeletionEligibility:', error);
        return {
            valid: false,
            error: { code: 'SYSTEM_ERROR', message: error.message }
        };
    }
}
```


### 4. New: `autoDeleteAnggotaKeluar()` Function

**Location:** `js/anggotaKeluarManager.js`

**Purpose:** Menghapus otomatis data anggota dan semua data terkait

**Implementation:**
```javascript
function autoDeleteAnggotaKeluar(anggotaId) {
    try {
        // Create snapshot for rollback
        const snapshot = createDeletionSnapshot();
        
        try {
            // Get anggota data for audit log
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
            
            // Delete from anggota
            let anggotaList = JSON.parse(localStorage.getItem('anggota') || '[]');
            anggotaList = anggotaList.filter(a => a.id !== anggotaId);
            localStorage.setItem('anggota', JSON.stringify(anggotaList));
            
            // Delete from simpananPokok
            let simpananPokok = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
            deletedData.simpananPokok = simpananPokok.filter(s => s.anggotaId === anggotaId);
            simpananPokok = simpananPokok.filter(s => s.anggotaId !== anggotaId);
            localStorage.setItem('simpananPokok', JSON.stringify(simpananPokok));
            
            // Delete from simpananWajib
            let simpananWajib = JSON.parse(localStorage.getItem('simpananWajib') || '[]');
            deletedData.simpananWajib = simpananWajib.filter(s => s.anggotaId === anggotaId);
            simpananWajib = simpananWajib.filter(s => s.anggotaId !== anggotaId);
            localStorage.setItem('simpananWajib', JSON.stringify(simpananWajib));
            
            // Delete from simpananSukarela
            let simpananSukarela = JSON.parse(localStorage.getItem('simpananSukarela') || '[]');
            deletedData.simpananSukarela = simpananSukarela.filter(s => s.anggotaId === anggotaId);
            simpananSukarela = simpananSukarela.filter(s => s.anggotaId !== anggotaId);
            localStorage.setItem('simpananSukarela', JSON.stringify(simpananSukarela));
            
            // Delete from penjualan (POS transactions)
            let penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
            deletedData.penjualan = penjualan.filter(p => p.anggotaId === anggotaId);
            penjualan = penjualan.filter(p => p.anggotaId !== anggotaId);
            localStorage.setItem('penjualan', JSON.stringify(penjualan));
            
            // Delete from pinjaman (only if lunas)
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
            
            // Delete from pembayaranHutangPiutang
            let pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
            deletedData.pembayaran = pembayaran.filter(p => p.anggotaId === anggotaId);
            pembayaran = pembayaran.filter(p => p.anggotaId !== anggotaId);
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaran));
            
            // Create audit log
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const auditLog = {
                id: generateId(),
                timestamp: new Date().toISOString(),
                userId: currentUser.id || 'system',
                userName: currentUser.username || 'System',
                action: 'AUTO_DELETE_ANGGOTA_KELUAR',
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
                    reason: 'Auto-delete after pengembalian completed'
                },
                ipAddress: null,
                severity: 'WARNING'
            };
            saveAuditLog(auditLog);
            
            // Invalidate cache
            if (typeof AnggotaKeluarCache !== 'undefined') {
                AnggotaKeluarCache.invalidateAll();
            }
            
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
                message: `Data anggota ${anggota.nama} berhasil dihapus otomatis`
            };
            
        } catch (innerError) {
            // Rollback on error
            console.error('Error during auto-delete, rolling back:', innerError);
            restoreDeletionSnapshot(snapshot);
            throw innerError;
        }
        
    } catch (error) {
        console.error('Error in autoDeleteAnggotaKeluar:', error);
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


### 5. Modified: `renderAnggota()` Function

**Location:** `js/koperasi.js`

**Purpose:** Menghapus filter `statusKeanggotaan !== 'Keluar'` karena sudah tidak diperlukan

**Changes:**
- Remove: Filter `statusKeanggotaan !== 'Keluar'`
- Simplify: Tidak perlu filter lagi karena anggota keluar sudah dihapus

**New Implementation:**
```javascript
function renderAnggota() {
    const content = document.getElementById('mainContent');
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    
    // NO NEED TO FILTER - anggota keluar already deleted
    const totalActive = anggota.length;
    
    // ... rest of the function remains the same ...
}

function renderTableAnggota(filteredData = null) {
    let anggota = filteredData || JSON.parse(localStorage.getItem('anggota') || '[]');
    
    // NO NEED TO FILTER - anggota keluar already deleted
    // REMOVE THIS LINE: anggota = anggota.filter(a => a.statusKeanggotaan !== 'Keluar');
    
    const tbody = document.getElementById('tbodyAnggota');
    
    // ... rest of the function remains the same ...
}
```

### 6. Modified: `filterAnggota()` Function

**Location:** `js/koperasi.js`

**Purpose:** Menghapus filter `statusKeanggotaan !== 'Keluar'`

**Changes:**
- Remove: Filter `statusKeanggotaan !== 'Keluar'`

**New Implementation:**
```javascript
function filterAnggota() {
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const searchText = document.getElementById('searchAnggota').value.toLowerCase();
    const filterDept = document.getElementById('filterDepartemen').value;
    const filterTipe = document.getElementById('filterTipe').value;
    const filterStatus = document.getElementById('filterStatus').value;
    const filterTanggalDari = document.getElementById('filterTanggalDari').value;
    const filterTanggalSampai = document.getElementById('filterTanggalSampai').value;
    
    let filtered = anggota.filter(a => {
        // NO NEED TO FILTER statusKeanggotaan - already deleted
        // REMOVE THIS LINE: const notKeluar = a.statusKeanggotaan !== 'Keluar';
        
        // Search filter
        const matchSearch = !searchText || 
            a.nik.toLowerCase().includes(searchText) ||
            a.nama.toLowerCase().includes(searchText) ||
            a.noKartu.toLowerCase().includes(searchText);
        
        // Departemen filter
        const matchDept = !filterDept || a.departemen === filterDept;
        
        // Tipe filter
        const matchTipe = !filterTipe || a.tipeAnggota === filterTipe;
        
        // Status filter
        const matchStatus = !filterStatus || a.status === filterStatus;
        
        // Date range filter
        let matchDate = true;
        if (filterTanggalDari || filterTanggalSampai) {
            const tanggalDaftar = a.tanggalDaftar;
            if (tanggalDaftar) {
                if (filterTanggalDari && tanggalDaftar < filterTanggalDari) {
                    matchDate = false;
                }
                if (filterTanggalSampai && tanggalDaftar > filterTanggalSampai) {
                    matchDate = false;
                }
            } else {
                matchDate = false;
            }
        }
        
        return matchSearch && matchDept && matchTipe && matchStatus && matchDate;
    });
    
    // Update count
    document.getElementById('countFiltered').textContent = filtered.length;
    
    // Render filtered data
    renderTableAnggota(filtered);
}
```


### 7. Modified: `renderAnggotaKeluar()` Function

**Location:** `js/anggotaKeluarUI.js`

**Purpose:** Menggunakan data dari tabel pengembalian, bukan dari tabel anggota

**Changes:**
- Change: Get data from `pengembalian` table instead of `anggota` table
- Remove: Filter `statusKeanggotaan === 'Keluar'`

**New Implementation:**
```javascript
function renderAnggotaKeluar() {
    const content = document.getElementById('mainContent');
    
    // Get data from pengembalian table (not anggota table)
    const pengembalianList = JSON.parse(localStorage.getItem('pengembalian') || '[]');
    
    // Sort by tanggal keluar (newest first)
    pengembalianList.sort((a, b) => {
        const dateA = new Date(a.tanggalKeluar || 0);
        const dateB = new Date(b.tanggalKeluar || 0);
        return dateB - dateA;
    });
    
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 style="color: #2d6a4f; font-weight: 700;">
                <i class="bi bi-box-arrow-right me-2"></i>Anggota Keluar
            </h2>
            <span class="badge" style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); font-size: 1rem;">
                Total: ${pengembalianList.length} Anggota Keluar
            </span>
        </div>
        
        <!-- Filter dan Pencarian -->
        <div class="card mb-3">
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">
                            <i class="bi bi-search me-1"></i>Pencarian
                        </label>
                        <input type="text" class="form-control" id="searchAnggotaKeluar" 
                            placeholder="Cari NIK atau Nama..." 
                            onkeyup="filterAnggotaKeluar()">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">
                            <i class="bi bi-calendar-range me-1"></i>Tanggal Keluar Dari
                        </label>
                        <input type="date" class="form-control" id="filterTanggalKeluarDari" onchange="filterAnggotaKeluar()">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">
                            <i class="bi bi-calendar-range me-1"></i>Tanggal Keluar Sampai
                        </label>
                        <input type="date" class="form-control" id="filterTanggalKeluarSampai" onchange="filterAnggotaKeluar()">
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <i class="bi bi-table me-2"></i>Daftar Anggota Keluar (Riwayat Pengembalian)
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>NIK</th>
                                <th>Nama</th>
                                <th>Tanggal Keluar</th>
                                <th>Total Pengembalian</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="tbodyAnggotaKeluar">
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    // Render table
    renderTableAnggotaKeluar(pengembalianList);
}

function renderTableAnggotaKeluar(data) {
    const tbody = document.getElementById('tbodyAnggotaKeluar');
    
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <i class="bi bi-inbox me-2"></i>Tidak ada data anggota keluar
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = data.map(p => {
        const statusBadge = p.pengembalianStatus === 'Selesai' ? 
            '<span class="badge bg-success">Selesai</span>' : 
            '<span class="badge bg-warning">Pending</span>';
        
        const totalPengembalian = (p.totalSimpananPokok || 0) + 
                                 (p.totalSimpananWajib || 0) + 
                                 (p.totalSimpananSukarela || 0);
        
        return `
            <tr>
                <td>${p.anggotaNIK || '-'}</td>
                <td>${p.anggotaNama || '-'}</td>
                <td>${formatDateToDisplay(p.tanggalKeluar) || '-'}</td>
                <td>Rp ${totalPengembalian.toLocaleString('id-ID')}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="showDetailPengembalian('${p.id}')" title="Lihat Detail">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="cetakSuratPengunduranDiri('${p.id}')" title="Cetak Surat">
                        <i class="bi bi-printer"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}
```


### 8. New: Data Migration Script

**Location:** `js/dataMigration.js` (new file)

**Purpose:** Migrasi data lama yang masih memiliki `statusKeanggotaan = 'Keluar'`

**Implementation:**
```javascript
/**
 * Migrate old data with statusKeanggotaan = 'Keluar'
 * This function should be run once when updating to new design
 */
function migrateAnggotaKeluarData() {
    try {
        console.log('Starting data migration for anggota keluar...');
        
        // Create backup
        const backup = {
            anggota: localStorage.getItem('anggota'),
            simpananPokok: localStorage.getItem('simpananPokok'),
            simpananWajib: localStorage.getItem('simpananWajib'),
            simpananSukarela: localStorage.getItem('simpananSukarela'),
            penjualan: localStorage.getItem('penjualan'),
            pinjaman: localStorage.getItem('pinjaman'),
            pembayaranHutangPiutang: localStorage.getItem('pembayaranHutangPiutang'),
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('migration_backup', JSON.stringify(backup));
        console.log('Backup created');
        
        // Get all anggota
        let anggotaList = JSON.parse(localStorage.getItem('anggota') || '[]');
        const anggotaKeluarList = anggotaList.filter(a => a.statusKeanggotaan === 'Keluar');
        
        console.log(`Found ${anggotaKeluarList.length} anggota with statusKeanggotaan = 'Keluar'`);
        
        let deletedCount = 0;
        let skippedCount = 0;
        
        // Process each anggota keluar
        for (const anggota of anggotaKeluarList) {
            // Check if pengembalian is completed
            if (anggota.pengembalianStatus === 'Selesai') {
                // Validate deletion eligibility
                const validation = validateDeletionEligibility(anggota.id);
                if (validation.valid) {
                    // Delete anggota and related data
                    const deleteResult = autoDeleteAnggotaKeluar(anggota.id);
                    if (deleteResult.success) {
                        deletedCount++;
                        console.log(`Deleted anggota: ${anggota.nama} (${anggota.nik})`);
                    } else {
                        skippedCount++;
                        console.warn(`Failed to delete anggota: ${anggota.nama} (${anggota.nik})`, deleteResult.error);
                    }
                } else {
                    skippedCount++;
                    console.warn(`Skipped anggota: ${anggota.nama} (${anggota.nik})`, validation.error);
                }
            } else {
                // Pengembalian not completed, just remove statusKeanggotaan field
                delete anggota.statusKeanggotaan;
                anggota.status = 'Nonaktif';
                skippedCount++;
                console.log(`Updated anggota to Nonaktif: ${anggota.nama} (${anggota.nik})`);
            }
        }
        
        // Save updated anggota list
        anggotaList = anggotaList.filter(a => a.statusKeanggotaan !== 'Keluar');
        localStorage.setItem('anggota', JSON.stringify(anggotaList));
        
        // Create migration audit log
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const auditLog = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            userId: currentUser.id || 'system',
            userName: currentUser.username || 'System',
            action: 'DATA_MIGRATION',
            details: {
                migrationType: 'anggota_keluar_auto_delete',
                totalFound: anggotaKeluarList.length,
                deleted: deletedCount,
                skipped: skippedCount,
                backupKey: 'migration_backup'
            },
            severity: 'INFO'
        };
        saveAuditLog(auditLog);
        
        console.log('Migration completed successfully');
        console.log(`Total: ${anggotaKeluarList.length}, Deleted: ${deletedCount}, Skipped: ${skippedCount}`);
        
        return {
            success: true,
            data: {
                totalFound: anggotaKeluarList.length,
                deleted: deletedCount,
                skipped: skippedCount
            }
        };
        
    } catch (error) {
        console.error('Migration failed:', error);
        
        // Restore from backup
        const backup = JSON.parse(localStorage.getItem('migration_backup') || '{}');
        if (backup.anggota) {
            localStorage.setItem('anggota', backup.anggota);
            localStorage.setItem('simpananPokok', backup.simpananPokok);
            localStorage.setItem('simpananWajib', backup.simpananWajib);
            localStorage.setItem('simpananSukarela', backup.simpananSukarela);
            localStorage.setItem('penjualan', backup.penjualan);
            localStorage.setItem('pinjaman', backup.pinjaman);
            localStorage.setItem('pembayaranHutangPiutang', backup.pembayaranHutangPiutang);
            console.log('Backup restored');
        }
        
        return {
            success: false,
            error: {
                code: 'MIGRATION_FAILED',
                message: error.message
            }
        };
    }
}

// Run migration on app load (only once)
function checkAndRunMigration() {
    const migrationCompleted = localStorage.getItem('migration_anggota_keluar_completed');
    if (!migrationCompleted) {
        console.log('Running data migration...');
        const result = migrateAnggotaKeluarData();
        if (result.success) {
            localStorage.setItem('migration_anggota_keluar_completed', 'true');
            showAlert(`Migrasi data selesai: ${result.data.deleted} anggota dihapus, ${result.data.skipped} dilewati`, 'success');
        } else {
            showAlert('Migrasi data gagal: ' + result.error.message, 'error');
        }
    }
}
```


## Data Models

### Anggota Model (Modified)

**Before (OLD):**
```javascript
{
    id: string,
    nik: string,
    nama: string,
    noKartu: string,
    departemen: string,
    tipeAnggota: string,
    status: string, // 'Aktif', 'Nonaktif', 'Cuti'
    statusKeanggotaan: string, // 'Aktif', 'Keluar' <- REMOVED
    tanggalDaftar: string,
    tanggalKeluar: string, // Only if statusKeanggotaan = 'Keluar'
    alasanKeluar: string, // Only if statusKeanggotaan = 'Keluar'
    pengembalianStatus: string, // 'Pending', 'Selesai'
    // ... other fields
}
```

**After (NEW):**
```javascript
{
    id: string,
    nik: string,
    nama: string,
    noKartu: string,
    departemen: string,
    tipeAnggota: string,
    status: string, // 'Aktif', 'Nonaktif', 'Cuti'
    // statusKeanggotaan: REMOVED
    tanggalDaftar: string,
    // tanggalKeluar: REMOVED (moved to pengembalian table)
    // alasanKeluar: REMOVED (moved to pengembalian table)
    // pengembalianStatus: REMOVED (moved to pengembalian table)
    // ... other fields
}
```

### Pengembalian Model (Enhanced)

**Purpose:** Store historical data of anggota keluar

```javascript
{
    id: string,
    anggotaId: string, // ID will be orphaned after anggota deleted
    anggotaNIK: string, // Preserved for reference
    anggotaNama: string, // Preserved for reference
    tanggalKeluar: string,
    alasanKeluar: string,
    totalSimpananPokok: number,
    totalSimpananWajib: number,
    totalSimpananSukarela: number,
    totalPengembalian: number,
    metodePembayaran: string,
    catatanPengembalian: string,
    pengembalianStatus: string, // 'Pending', 'Selesai'
    tanggalPengembalian: string,
    userId: string,
    userName: string,
    // ... other fields
}
```

### Audit Log Entry for Auto-Delete

```javascript
{
    id: string,
    timestamp: string, // ISO date
    userId: string,
    userName: string,
    action: 'AUTO_DELETE_ANGGOTA_KELUAR',
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

## Error Handling

### Validation Errors

```javascript
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

### Property 1: Status changed to Nonaktif before deletion

*For any* anggota that is marked keluar, the status should be changed to 'Nonaktif' before any deletion occurs.

**Validates: Requirements 2.1**

### Property 2: Auto-delete only after pengembalian completed

*For any* anggota keluar, auto-deletion should only occur if pengembalianStatus = 'Selesai'.

**Validates: Requirements 5.3**

### Property 3: Auto-delete blocks with active obligations

*For any* anggota keluar with active pinjaman or outstanding hutang POS, auto-deletion should be blocked.

**Validates: Requirements 5.4, 5.5, 6.4, 6.5**

### Property 4: Anggota data removed after auto-delete

*For any* successful auto-deletion, the anggota record should not exist in localStorage anggota.

**Validates: Requirements 1.2**

### Property 5: Simpanan data removed after auto-delete

*For any* successful auto-deletion, all simpanan records (pokok, wajib, sukarela) for that anggota should not exist in their respective localStorage.

**Validates: Requirements 1.3**

### Property 6: Jurnal preserved after auto-delete

*For any* successful auto-deletion, all jurnal entries should remain unchanged in localStorage jurnal.

**Validates: Requirements 3.1**

### Property 7: Pengembalian record preserved after auto-delete

*For any* successful auto-deletion, the pengembalian record should remain in localStorage pengembalian.

**Validates: Requirements 3.2**

### Property 8: Audit log preserved after auto-delete

*For any* successful auto-deletion, all audit log entries should remain in localStorage auditLogsAnggotaKeluar.

**Validates: Requirements 3.3**

### Property 9: Auto-delete creates audit log entry

*For any* successful auto-deletion, a new audit log entry with action 'AUTO_DELETE_ANGGOTA_KELUAR' should be created.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 10: Rollback on deletion error

*For any* auto-deletion process that encounters an error, all data should be restored to the state before deletion started.

**Validates: Requirements 7.4**

### Property 11: No statusKeanggotaan field in new data

*For any* anggota record created after migration, the statusKeanggotaan field should not exist.

**Validates: Requirements 8.1, 8.2**

### Property 12: Master anggota shows all active members

*For any* anggota in localStorage, they should appear in master anggota view without any statusKeanggotaan filter.

**Validates: Requirements 8.3**

### Property 13: Anggota keluar view uses pengembalian data

*For any* anggota keluar displayed in the anggota keluar view, the data should come from the pengembalian table, not the anggota table.

**Validates: Requirements 9.1, 9.2**

### Property 14: Migration deletes completed pengembalian

*For any* anggota with statusKeanggotaan = 'Keluar' and pengembalianStatus = 'Selesai', migration should delete the anggota record.

**Validates: Requirements 10.3**

### Property 15: Migration creates backup before changes

*For any* migration execution, a backup of all affected data should be created before any changes are made.

**Validates: Requirements 10.2**

## Testing Strategy

### Unit Tests

1. **Test `markAnggotaKeluar()` changes status to Nonaktif**
   - Input: anggotaId with status = 'Aktif'
   - Expected: status = 'Nonaktif', no statusKeanggotaan field

2. **Test `validateDeletionEligibility()` blocks active loans**
   - Input: anggotaId with active pinjaman
   - Expected: valid = false

3. **Test `validateDeletionEligibility()` blocks outstanding debt**
   - Input: anggotaId with hutang POS > 0
   - Expected: valid = false

4. **Test `autoDeleteAnggotaKeluar()` removes anggota**
   - Input: valid anggotaId
   - Expected: anggota not in localStorage

5. **Test `autoDeleteAnggotaKeluar()` removes simpanan**
   - Input: valid anggotaId
   - Expected: no simpanan records for anggotaId

6. **Test `autoDeleteAnggotaKeluar()` preserves jurnal**
   - Input: valid anggotaId
   - Expected: jurnal unchanged

7. **Test `autoDeleteAnggotaKeluar()` creates audit log**
   - Input: valid anggotaId
   - Expected: new audit log entry created

8. **Test `renderAnggota()` shows all anggota**
   - Input: anggota list without statusKeanggotaan filter
   - Expected: all anggota displayed

9. **Test `renderAnggotaKeluar()` uses pengembalian data**
   - Input: pengembalian list
   - Expected: data from pengembalian table, not anggota table

10. **Test `migrateAnggotaKeluarData()` creates backup**
    - Input: anggota list with statusKeanggotaan = 'Keluar'
    - Expected: backup created in localStorage

### Integration Tests

1. **Test complete auto-delete flow**
   - Mark anggota keluar → process pengembalian → verify auto-delete
   - Verify all data removed except jurnal and audit

2. **Test auto-delete rollback on error**
   - Inject error during deletion
   - Verify all data restored

3. **Test migration flow**
   - Create test data with statusKeanggotaan = 'Keluar'
   - Run migration
   - Verify data deleted or updated

4. **Test anggota keluar view after migration**
   - Verify view uses pengembalian data
   - Verify no errors when anggota deleted

### Property-Based Testing

**Framework:** fast-check (JavaScript property-based testing library)

**Configuration:** Each property test should run a minimum of 100 iterations.

**Test Tagging:** Each property-based test must include a comment tag:
```javascript
// Feature: auto-delete-anggota-keluar, Property X: [property description]
```

## Security Considerations

1. **Authorization**: Only admin users should have access to mark anggota keluar
2. **Validation**: Multiple validation checks before auto-deletion
3. **Audit Trail**: All deletions logged with user ID and timestamp
4. **Rollback**: Automatic rollback on any error during deletion
5. **Data Preservation**: Critical data (jurnal, audit log, pengembalian) never deleted
6. **Migration Safety**: Backup created before migration, rollback on error

## Performance Considerations

1. **Atomic Operation**: All deletions happen in single transaction
2. **Cache Invalidation**: Clear all caches after deletion
3. **Migration**: Run once on app load, mark as completed
4. **Lazy Loading**: Load pengembalian data only when needed for anggota keluar view

## Migration Plan

### Phase 1: Preparation
1. Create backup of all data
2. Test migration script on test data
3. Verify rollback mechanism works

### Phase 2: Migration
1. Run migration script on app load
2. Delete anggota with statusKeanggotaan = 'Keluar' and pengembalianStatus = 'Selesai'
3. Update anggota with statusKeanggotaan = 'Keluar' and pengembalianStatus = 'Pending' to status = 'Nonaktif'
4. Remove statusKeanggotaan field from all anggota

### Phase 3: Verification
1. Verify master anggota shows all active members
2. Verify anggota keluar view uses pengembalian data
3. Verify no errors in console
4. Verify audit log contains migration entry

### Phase 4: Cleanup
1. Remove old code that filters statusKeanggotaan
2. Remove old tests that check statusKeanggotaan
3. Update documentation

## Backward Compatibility

### Data Compatibility
- Old data with `statusKeanggotaan = 'Keluar'` will be migrated automatically
- Migration script handles both completed and pending pengembalian
- Backup created before migration for safety

### Code Compatibility
- Old code that checks `statusKeanggotaan` will be removed
- New code does not use `statusKeanggotaan` field
- Pengembalian table structure remains compatible

## Deployment Steps

1. **Backup Production Data**
   - Export all localStorage data
   - Save to file for recovery if needed

2. **Deploy New Code**
   - Update all JavaScript files
   - Include migration script

3. **Run Migration**
   - Migration runs automatically on first load
   - Monitor console for migration status

4. **Verify Deployment**
   - Check master anggota view
   - Check anggota keluar view
   - Check audit log for migration entry

5. **Monitor**
   - Watch for errors in console
   - Check audit log for any issues
   - Verify user reports

## Rollback Plan

If migration fails or causes issues:

1. **Restore from Backup**
   - Use backup created by migration script
   - Restore all localStorage data

2. **Revert Code**
   - Deploy previous version of code
   - Remove migration script

3. **Verify Rollback**
   - Check all views work correctly
   - Check data integrity

4. **Investigate Issue**
   - Review error logs
   - Fix migration script
   - Test on staging environment
