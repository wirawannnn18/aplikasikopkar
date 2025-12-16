# Troubleshooting Guide - Master Barang Komprehensif

## Daftar Isi
1. [Masalah Umum](#masalah-umum)
2. [Import/Export Issues](#importexport-issues)
3. [Performance Issues](#performance-issues)
4. [Data Validation Errors](#data-validation-errors)
5. [Browser Compatibility](#browser-compatibility)
6. [Storage Issues](#storage-issues)
7. [Debug Tools](#debug-tools)

## Masalah Umum

### 1. Halaman Tidak Memuat
**Gejala**: Halaman master barang tidak memuat atau menampilkan error

**Penyebab Umum**:
- JavaScript disabled
- Browser tidak kompatibel
- File JavaScript corrupt atau missing

**Solusi**:
```javascript
// 1. Periksa console browser (F12)
console.log('Master Barang System Status');

// 2. Periksa localStorage
if (typeof(Storage) !== "undefined") {
    console.log("localStorage supported");
} else {
    console.log("localStorage NOT supported");
}

// 3. Test basic functionality
try {
    const testData = { test: 'value' };
    localStorage.setItem('test', JSON.stringify(testData));
    localStorage.removeItem('test');
    console.log("localStorage working");
} catch (e) {
    console.error("localStorage error:", e);
}
```

### 2. Data Tidak Tersimpan
**Gejala**: Data yang diinput tidak tersimpan setelah refresh

**Penyebab Umum**:
- localStorage penuh
- Browser dalam mode private/incognito
- Validation error tidak terlihat

**Solusi**:
```javascript
// Periksa quota localStorage
function checkStorageQuota() {
    let total = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            total += localStorage[key].length;
        }
    }
    console.log(`localStorage used: ${(total / 1024).toFixed(2)} KB`);
    
    // Test write capability
    try {
        localStorage.setItem('quota_test', 'x'.repeat(1024));
        localStorage.removeItem('quota_test');
        console.log("localStorage write OK");
    } catch (e) {
        console.error("localStorage write failed:", e);
    }
}
```

### 3. Search Tidak Berfungsi
**Gejala**: Pencarian tidak mengembalikan hasil yang diharapkan

**Solusi**:
```javascript
// Debug search function
function debugSearch(query) {
    console.log('Search query:', query);
    const data = JSON.parse(localStorage.getItem('master_barang_data') || '{}');
    console.log('Available data:', data.barang?.length || 0, 'items');
    
    // Test search manually
    const results = data.barang?.filter(item => 
        item.nama.toLowerCase().includes(query.toLowerCase()) ||
        item.kode.toLowerCase().includes(query.toLowerCase())
    );
    console.log('Search results:', results?.length || 0, 'items');
}
```

## Import/Export Issues

### 1. Import File Gagal
**Gejala**: File Excel/CSV tidak bisa diimport

**Penyebab dan Solusi**:

#### File Format Tidak Didukung
```javascript
// Periksa format file yang didukung
const supportedFormats = ['.xlsx', '.xls', '.csv'];
function validateFileFormat(filename) {
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return supportedFormats.includes(extension);
}
```

#### File Terlalu Besar
```javascript
// Periksa ukuran file
function validateFileSize(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        console.error(`File too large: ${file.size} bytes (max: ${maxSize})`);
        return false;
    }
    return true;
}
```

#### Data Format Salah
```javascript
// Validasi format data
function validateImportData(data) {
    const requiredColumns = ['nama', 'kategori', 'satuan'];
    const headers = Object.keys(data[0] || {});
    
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
        console.error('Missing columns:', missingColumns);
        return false;
    }
    return true;
}
```

### 2. Export Tidak Berfungsi
**Gejala**: Export file tidak berhasil atau file kosong

**Solusi**:
```javascript
// Debug export function
function debugExport() {
    const data = JSON.parse(localStorage.getItem('master_barang_data') || '{}');
    console.log('Export data:', {
        barang: data.barang?.length || 0,
        kategori: data.kategori?.length || 0,
        satuan: data.satuan?.length || 0
    });
    
    // Test browser download capability
    const testBlob = new Blob(['test'], { type: 'text/plain' });
    const testUrl = URL.createObjectURL(testBlob);
    console.log('Test download URL:', testUrl);
}
```

## Performance Issues

### 1. Loading Lambat
**Gejala**: Sistem lambat saat memuat data banyak

**Solusi**:
```javascript
// Implementasi pagination
function implementPagination(data, page = 1, limit = 50) {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return {
        data: data.slice(startIndex, endIndex),
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(data.length / limit),
            totalItems: data.length,
            hasNext: endIndex < data.length,
            hasPrev: page > 1
        }
    };
}

// Debounce search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
```

### 2. Memory Usage Tinggi
**Gejala**: Browser menjadi lambat atau crash

**Solusi**:
```javascript
// Monitor memory usage
function monitorMemory() {
    if (performance.memory) {
        console.log('Memory usage:', {
            used: Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB',
            total: Math.round(performance.memory.totalJSHeapSize / 1048576) + ' MB',
            limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + ' MB'
        });
    }
}

// Cleanup function
function cleanup() {
    // Clear unused variables
    // Remove event listeners
    // Clear intervals/timeouts
}
```

## Data Validation Errors

### 1. Kode Barang Duplikat
**Gejala**: Error "Kode barang sudah ada"

**Solusi**:
```javascript
// Check duplicate codes
function findDuplicateCodes() {
    const data = JSON.parse(localStorage.getItem('master_barang_data') || '{}');
    const codes = data.barang?.map(item => item.kode) || [];
    const duplicates = codes.filter((code, index) => codes.indexOf(code) !== index);
    
    if (duplicates.length > 0) {
        console.log('Duplicate codes found:', duplicates);
        return duplicates;
    }
    return [];
}

// Auto-generate unique code
function generateUniqueCode(prefix = 'MB') {
    const data = JSON.parse(localStorage.getItem('master_barang_data') || '{}');
    const existingCodes = data.barang?.map(item => item.kode) || [];
    
    let counter = 1;
    let newCode;
    do {
        newCode = `${prefix}${counter.toString().padStart(3, '0')}`;
        counter++;
    } while (existingCodes.includes(newCode));
    
    return newCode;
}
```

### 2. Validation Rules
**Gejala**: Data tidak lolos validasi

**Solusi**:
```javascript
// Comprehensive validation
function validateBarangData(data) {
    const errors = [];
    
    // Required fields
    if (!data.nama || data.nama.trim() === '') {
        errors.push('Nama barang wajib diisi');
    }
    
    // Numeric validations
    if (data.hargaBeli && (isNaN(data.hargaBeli) || data.hargaBeli < 0)) {
        errors.push('Harga beli harus berupa angka positif');
    }
    
    if (data.hargaJual && (isNaN(data.hargaJual) || data.hargaJual < 0)) {
        errors.push('Harga jual harus berupa angka positif');
    }
    
    if (data.stok && (isNaN(data.stok) || data.stok < 0)) {
        errors.push('Stok harus berupa angka positif atau nol');
    }
    
    // Business rules
    if (data.hargaBeli && data.hargaJual && data.hargaJual < data.hargaBeli) {
        errors.push('Harga jual tidak boleh lebih kecil dari harga beli');
    }
    
    return errors;
}
```

## Browser Compatibility

### 1. Browser Tidak Didukung
**Gejala**: Fitur tidak berfungsi di browser tertentu

**Solusi**:
```javascript
// Browser compatibility check
function checkBrowserCompatibility() {
    const features = {
        localStorage: typeof(Storage) !== "undefined",
        fetch: typeof(fetch) !== "undefined",
        promise: typeof(Promise) !== "undefined",
        arrow: (() => { try { eval('() => {}'); return true; } catch(e) { return false; } })(),
        const: (() => { try { eval('const x = 1'); return true; } catch(e) { return false; } })()
    };
    
    console.log('Browser compatibility:', features);
    
    const unsupported = Object.keys(features).filter(key => !features[key]);
    if (unsupported.length > 0) {
        console.warn('Unsupported features:', unsupported);
        return false;
    }
    return true;
}
```

### 2. Polyfills
```javascript
// Polyfill untuk browser lama
if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement) {
        return this.indexOf(searchElement) !== -1;
    };
}

if (!String.prototype.padStart) {
    String.prototype.padStart = function(targetLength, padString) {
        targetLength = targetLength >> 0;
        padString = String(padString || ' ');
        if (this.length > targetLength) {
            return String(this);
        } else {
            targetLength = targetLength - this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength / padString.length);
            }
            return padString.slice(0, targetLength) + String(this);
        }
    };
}
```

## Storage Issues

### 1. localStorage Penuh
**Gejala**: Error "QuotaExceededError"

**Solusi**:
```javascript
// Clean up old data
function cleanupStorage() {
    try {
        // Remove old audit logs
        const auditData = JSON.parse(localStorage.getItem('master_barang_audit') || '[]');
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const filteredAudit = auditData.filter(log => 
            new Date(log.timestamp) > thirtyDaysAgo
        );
        
        localStorage.setItem('master_barang_audit', JSON.stringify(filteredAudit));
        
        console.log(`Cleaned up ${auditData.length - filteredAudit.length} old audit logs`);
    } catch (e) {
        console.error('Cleanup failed:', e);
    }
}

// Check storage usage
function getStorageUsage() {
    let total = 0;
    const usage = {};
    
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            const size = localStorage[key].length;
            usage[key] = size;
            total += size;
        }
    }
    
    return {
        total: total,
        totalKB: (total / 1024).toFixed(2),
        breakdown: usage
    };
}
```

## Debug Tools

### 1. Enable Debug Mode
```javascript
// Enable debug mode
localStorage.setItem('master_barang_debug', 'true');

// Debug logger
function debugLog(message, data = null) {
    if (localStorage.getItem('master_barang_debug') === 'true') {
        console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, data);
    }
}
```

### 2. System Health Check
```javascript
function systemHealthCheck() {
    const health = {
        timestamp: new Date().toISOString(),
        browser: navigator.userAgent,
        storage: {
            available: typeof(Storage) !== "undefined",
            usage: getStorageUsage()
        },
        data: {
            barang: 0,
            kategori: 0,
            satuan: 0,
            audit: 0
        },
        errors: []
    };
    
    try {
        const data = JSON.parse(localStorage.getItem('master_barang_data') || '{}');
        health.data.barang = data.barang?.length || 0;
        health.data.kategori = data.kategori?.length || 0;
        health.data.satuan = data.satuan?.length || 0;
        
        const audit = JSON.parse(localStorage.getItem('master_barang_audit') || '[]');
        health.data.audit = audit.length;
    } catch (e) {
        health.errors.push(`Data parsing error: ${e.message}`);
    }
    
    console.log('System Health Check:', health);
    return health;
}
```

### 3. Reset System
```javascript
// DANGER: This will delete all data
function resetSystem() {
    if (confirm('PERINGATAN: Ini akan menghapus semua data. Lanjutkan?')) {
        const keys = Object.keys(localStorage).filter(key => 
            key.startsWith('master_barang_')
        );
        
        keys.forEach(key => localStorage.removeItem(key));
        
        console.log('System reset completed');
        location.reload();
    }
}
```

## Kontak Support

Jika masalah tidak dapat diselesaikan dengan panduan ini:

1. **Kumpulkan informasi**:
   - Screenshot error
   - Console log (F12 → Console)
   - System health check result
   - Langkah reproduksi masalah

2. **Hubungi tim IT** dengan informasi lengkap

3. **Emergency reset**: Gunakan fungsi `resetSystem()` hanya sebagai langkah terakhir

---

*Panduan troubleshooting ini akan terus diperbarui berdasarkan masalah yang ditemukan di lapangan.*