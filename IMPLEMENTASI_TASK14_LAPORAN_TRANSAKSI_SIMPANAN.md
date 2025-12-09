# Task 14: Add Comprehensive Error Handling - Implementation

## Overview
Menambahkan error handling yang komprehensif untuk semua operasi dalam modul Laporan Transaksi & Simpanan Anggota, termasuk validasi data, graceful degradation, dan user-friendly error messages.

## Implementation Details

### 1. Enhanced Error Classes
```javascript
/**
 * Custom Error Classes for Better Error Handling
 */
class LaporanError extends Error {
    constructor(message, code, details = {}) {
        super(message);
        this.name = 'LaporanError';
        this.code = code;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }
}

class DataLoadError extends LaporanError {
    constructor(message, details) {
        super(message, 'DATA_LOAD_ERROR', details);
        this.name = 'DataLoadError';
    }
}

class ValidationError extends LaporanError {
    constructor(message, details) {
        super(message, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}

class ExportError extends LaporanError {
    constructor(message, details) {
        super(message, 'EXPORT_ERROR', details);
        this.name = 'ExportError';
    }
}
```

### 2. Enhanced safeGetData with Validation
```javascript
/**
 * Enhanced safe data loading with validation
 * @param {string} key - localStorage key
 * @param {*} defaultValue - Default value if data not found
 * @param {Function} validator - Optional validation function
 * @returns {*} Loaded data or default value
 */
function safeGetData(key, defaultValue = [], validator = null) {
    try {
        // Check if localStorage is available
        if (typeof localStorage === 'undefined') {
            throw new DataLoadError('localStorage is not available', { key });
        }
        
        const data = localStorage.getItem(key);
        
        // Return default if no data
        if (!data || data === 'null' || data === 'undefined') {
            console.warn(`No data found for key: ${key}, using default value`);
            return defaultValue;
        }
        
        // Parse JSON
        let parsedData;
        try {
            parsedData = JSON.parse(data);
        } catch (parseError) {
            throw new DataLoadError(`Failed to parse JSON for key: ${key}`, {
                key,
                parseError: parseError.message
            });
        }
        
        // Validate data structure if validator provided
        if (validator && typeof validator === 'function') {
            if (!validator(parsedData)) {
                throw new ValidationError(`Data validation failed for key: ${key}`, {
                    key,
                    data: parsedData
                });
            }
        }
        
        return parsedData;
        
    } catch (error) {
        console.error(`Error loading ${key} from localStorage:`, error);
        
        // Log to error tracking if available
        if (window.errorTracker) {
            window.errorTracker.log(error);
        }
        
        return defaultValue;
    }
}
```

### 3. Data Validators
```javascript
/**
 * Validators for data structures
 */
const DataValidators = {
    /**
     * Validate anggota array
     */
    isValidAnggotaArray(data) {
        if (!Array.isArray(data)) return false;
        
        // Empty array is valid
        if (data.length === 0) return true;
        
        // Check first item has required fields
        const sample = data[0];
        return sample && 
               typeof sample.id !== 'undefined' &&
               typeof sample.nama !== 'undefined';
    },
    
    /**
     * Validate transaksi array
     */
    isValidTransaksiArray(data) {
        if (!Array.isArray(data)) return false;
        if (data.length === 0) return true;
        
        const sample = data[0];
        return sample && 
               typeof sample.id !== 'undefined' &&
               typeof sample.anggotaId !== 'undefined';
    },
    
    /**
     * Validate simpanan array
     */
    isValidSimpananArray(data) {
        if (!Array.isArray(data)) return false;
        if (data.length === 0) return true;
        
        const sample = data[0];
        return sample && 
               typeof sample.anggotaId !== 'undefined' &&
               typeof sample.jenis !== 'undefined';
    },
    
    /**
     * Validate numeric value
     */
    isValidNumber(value) {
        return typeof value === 'number' && 
               !isNaN(value) && 
               isFinite(value);
    },
    
    /**
     * Validate date string
     */
    isValidDate(dateStr) {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        return date instanceof Date && !isNaN(date);
    }
};
```

### 4. Enhanced AnggotaDataAggregator with Error Handling
```javascript
/**
 * Enhanced loadData with comprehensive error handling
 */
loadData() {
    try {
        // Load anggota data with validation
        const allAnggota = safeGetData('anggota', [], DataValidators.isValidAnggotaArray);
        
        // Find specific anggota
        this.anggota = allAnggota.find(a => a.id === this.anggotaId);
        
        if (!this.anggota) {
            throw new DataLoadError(`Anggota not found with ID: ${this.anggotaId}`, {
                anggotaId: this.anggotaId
            });
        }
        
        // Load transaksi with validation
        const allTransaksi = safeGetData('transaksi', [], DataValidators.isValidTransaksiArray);
        this.transaksi = allTransaksi.filter(t => t.anggotaId === this.anggotaId);
        
        // Load simpanan with validation
        const allSimpanan = safeGetData('simpanan', [], DataValidators.isValidSimpananArray);
        this.simpanan = allSimpanan.filter(s => s.anggotaId === this.anggotaId);
        
        return true;
        
    } catch (error) {
        console.error('Error loading data for anggota:', error);
        
        // Set empty data to allow graceful degradation
        this.anggota = null;
        this.transaksi = [];
        this.simpanan = [];
        
        // Show user-friendly error
        if (error instanceof DataLoadError) {
            showAlert(`Gagal memuat data: ${error.message}`, 'error');
        } else {
            showAlert('Terjadi kesalahan saat memuat data anggota', 'error');
        }
        
        return false;
    }
}
```

### 5. Safe Calculation Functions
```javascript
/**
 * Safe number addition with null/undefined handling
 */
function safeAdd(a, b) {
    const numA = parseFloat(a) || 0;
    const numB = parseFloat(b) || 0;
    return numA + numB;
}

/**
 * Safe division with zero check
 */
function safeDivide(numerator, denominator, defaultValue = 0) {
    const num = parseFloat(numerator) || 0;
    const den = parseFloat(denominator) || 0;
    
    if (den === 0) {
        return defaultValue;
    }
    
    const result = num / den;
    return DataValidators.isValidNumber(result) ? result : defaultValue;
}

/**
 * Safe percentage calculation
 */
function safePercentage(part, total, decimals = 2) {
    const percentage = safeDivide(part, total, 0) * 100;
    return parseFloat(percentage.toFixed(decimals));
}

/**
 * Safe currency formatting
 */
function safeCurrencyFormat(value) {
    try {
        const num = parseFloat(value) || 0;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(num);
    } catch (error) {
        console.error('Error formatting currency:', error);
        return 'Rp 0';
    }
}
```

### 6. Enhanced Export with Validation
```javascript
/**
 * Enhanced CSV export with validation
 */
function exportLaporanToCSV() {
    try {
        // Validate filter manager exists
        if (!laporanFilterManager) {
            throw new ExportError('Data laporan tidak tersedia', {
                reason: 'Filter manager not initialized'
            });
        }
        
        const filteredData = laporanFilterManager.getFilteredData();
        
        // Validate data exists
        if (!Array.isArray(filteredData)) {
            throw new ExportError('Data tidak valid', {
                reason: 'Filtered data is not an array'
            });
        }
        
        if (filteredData.length === 0) {
            showAlert('Tidak ada data untuk diekspor', 'warning');
            return;
        }
        
        // Validate data structure
        const sample = filteredData[0];
        const requiredFields = ['nik', 'nama', 'departemen'];
        const missingFields = requiredFields.filter(field => !(field in sample));
        
        if (missingFields.length > 0) {
            throw new ValidationError('Data tidak lengkap', {
                missingFields
            });
        }
        
        // Generate CSV content
        const csvContent = generateCSVContent(filteredData);
        
        if (!csvContent || csvContent.trim().length === 0) {
            throw new ExportError('Gagal menghasilkan konten CSV', {
                reason: 'Empty CSV content'
            });
        }
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download === undefined) {
            throw new ExportError('Browser tidak mendukung download file', {
                reason: 'Download attribute not supported'
            });
        }
        
        const url = URL.createObjectURL(blob);
        const filename = `laporan_transaksi_simpanan_${new Date().toISOString().split('T')[0]}.csv`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
        
        showAlert(`File ${filename} berhasil diunduh`, 'success');
        
    } catch (error) {
        console.error('Error exporting CSV:', error);
        
        // User-friendly error messages
        if (error instanceof ExportError || error instanceof ValidationError) {
            showAlert(error.message, 'error');
        } else {
            showAlert('Gagal mengekspor data ke CSV. Silakan coba lagi.', 'error');
        }
        
        // Log to error tracker
        if (window.errorTracker) {
            window.errorTracker.log(error);
        }
    }
}

/**
 * Generate CSV content with error handling
 */
function generateCSVContent(data) {
    try {
        const headers = [
            'NIK', 'Nama', 'Departemen', 'Tipe Anggota',
            'Total Transaksi Cash', 'Total Transaksi Bon',
            'Total Simpanan Pokok', 'Total Simpanan Wajib', 'Total Simpanan Sukarela',
            'Outstanding Balance'
        ];
        
        let csv = headers.join(',') + '\n';
        
        data.forEach(row => {
            try {
                const values = [
                    escapeCSV(row.nik || ''),
                    escapeCSV(row.nama || ''),
                    escapeCSV(row.departemen || ''),
                    escapeCSV(row.tipeAnggota || ''),
                    parseFloat(row.totalTransaksiCash) || 0,
                    parseFloat(row.totalTransaksiBon) || 0,
                    parseFloat(row.totalSimpananPokok) || 0,
                    parseFloat(row.totalSimpananWajib) || 0,
                    parseFloat(row.totalSimpananSukarela) || 0,
                    parseFloat(row.outstandingBalance) || 0
                ];
                
                csv += values.join(',') + '\n';
            } catch (rowError) {
                console.error('Error processing row:', rowError, row);
                // Continue with next row
            }
        });
        
        return csv;
        
    } catch (error) {
        console.error('Error generating CSV content:', error);
        throw new ExportError('Gagal menghasilkan konten CSV', {
            originalError: error.message
        });
    }
}

/**
 * Escape CSV values
 */
function escapeCSV(value) {
    if (value === null || value === undefined) {
        return '';
    }
    
    const str = String(value);
    
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    
    return str;
}
```

### 7. Enhanced Print with Error Handling
```javascript
/**
 * Enhanced print with validation
 */
function printLaporan() {
    try {
        // Validate filter manager
        if (!laporanFilterManager) {
            throw new ExportError('Data laporan tidak tersedia', {
                reason: 'Filter manager not initialized'
            });
        }
        
        const filteredData = laporanFilterManager.getFilteredData();
        
        // Validate data
        if (!Array.isArray(filteredData) || filteredData.length === 0) {
            showAlert('Tidak ada data untuk dicetak', 'warning');
            return;
        }
        
        // Get system settings safely
        const systemSettings = safeGetData('systemSettings', {});
        const namaKoperasi = systemSettings.namaKoperasi || 'Koperasi';
        
        // Generate print content
        const printContent = generatePrintContent(filteredData, namaKoperasi);
        
        if (!printContent) {
            throw new ExportError('Gagal menghasilkan konten cetak', {
                reason: 'Empty print content'
            });
        }
        
        // Create print window
        const printWindow = window.open('', '_blank');
        
        if (!printWindow) {
            throw new ExportError('Gagal membuka jendela cetak', {
                reason: 'Popup blocked or window.open failed'
            });
        }
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Wait for content to load then print
        printWindow.onload = function() {
            try {
                printWindow.focus();
                printWindow.print();
                
                // Close after printing (with delay for print dialog)
                setTimeout(() => {
                    printWindow.close();
                }, 1000);
            } catch (printError) {
                console.error('Error during print:', printError);
                showAlert('Gagal mencetak. Silakan coba lagi.', 'error');
            }
        };
        
    } catch (error) {
        console.error('Error printing laporan:', error);
        
        if (error instanceof ExportError) {
            showAlert(error.message, 'error');
        } else {
            showAlert('Gagal mencetak laporan. Silakan coba lagi.', 'error');
        }
        
        if (window.errorTracker) {
            window.errorTracker.log(error);
        }
    }
}
```

### 8. Enhanced Modal Error Handling
```javascript
/**
 * Enhanced detail transaksi with error recovery
 */
function showDetailTransaksi(anggotaId) {
    try {
        // Validate anggotaId
        if (!anggotaId) {
            throw new ValidationError('ID anggota tidak valid', { anggotaId });
        }
        
        // Show loading modal
        showLoadingModal('modalDetailTransaksi', 'Memuat detail transaksi...');
        
        // Load content asynchronously
        setTimeout(() => {
            try {
                loadDetailTransaksiContent(anggotaId);
            } catch (loadError) {
                console.error('Error loading detail transaksi content:', loadError);
                hideLoadingModal('modalDetailTransaksi');
                showAlert('Gagal memuat detail transaksi', 'error');
            }
        }, 10);
        
    } catch (error) {
        console.error('Error showing detail transaksi:', error);
        
        if (error instanceof ValidationError) {
            showAlert(error.message, 'error');
        } else {
            showAlert('Gagal menampilkan detail transaksi', 'error');
        }
    }
}

/**
 * Enhanced detail simpanan with error recovery
 */
function showDetailSimpanan(anggotaId) {
    try {
        // Validate anggotaId
        if (!anggotaId) {
            throw new ValidationError('ID anggota tidak valid', { anggotaId });
        }
        
        // Show loading modal
        showLoadingModal('modalDetailSimpanan', 'Memuat detail simpanan...');
        
        // Load content asynchronously
        setTimeout(() => {
            try {
                loadDetailSimpananContent(anggotaId);
            } catch (loadError) {
                console.error('Error loading detail simpanan content:', loadError);
                hideLoadingModal('modalDetailSimpanan');
                showAlert('Gagal memuat detail simpanan', 'error');
            }
        }, 10);
        
    } catch (error) {
        console.error('Error showing detail simpanan:', error);
        
        if (error instanceof ValidationError) {
            showAlert(error.message, 'error');
        } else {
            showAlert('Gagal menampilkan detail simpanan', 'error');
        }
    }
}
```

### 9. Graceful Degradation for Missing Data
```javascript
/**
 * Render with graceful degradation
 */
function renderLaporanTransaksiSimpananAnggota() {
    const content = document.getElementById('mainContent');
    
    if (!content) {
        console.error('Main content element not found');
        return;
    }
    
    try {
        // Show loading indicator
        loadingIndicator.show('mainContent', 'Memuat laporan transaksi & simpanan...');
        
        // Load data asynchronously
        setTimeout(() => {
            try {
                renderLaporanContent();
            } catch (renderError) {
                console.error('Error rendering content:', renderError);
                
                // Show error state with retry option
                content.innerHTML = `
                    <div class="error-state">
                        <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                        <h4>Gagal Memuat Laporan</h4>
                        <p class="text-muted">Terjadi kesalahan saat memuat data laporan.</p>
                        <button class="btn btn-primary" onclick="renderLaporanTransaksiSimpananAnggota()">
                            <i class="fas fa-redo"></i> Coba Lagi
                        </button>
                        <button class="btn btn-secondary ml-2" onclick="navigateTo('dashboard')">
                            <i class="fas fa-home"></i> Kembali ke Dashboard
                        </button>
                    </div>
                `;
                
                loadingIndicator.hide();
            }
        }, 10);
        
    } catch (error) {
        console.error('Error rendering laporan:', error);
        
        // Fallback error display
        content.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle"></i>
                <strong>Error:</strong> Gagal memuat halaman laporan. Silakan refresh halaman atau hubungi administrator.
            </div>
        `;
        
        loadingIndicator.hide();
    }
}
```

### 10. Error Tracking and Logging
```javascript
/**
 * Simple error tracker for production monitoring
 */
class ErrorTracker {
    constructor() {
        this.errors = [];
        this.maxErrors = 50; // Keep last 50 errors
    }
    
    /**
     * Log error
     */
    log(error) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            name: error.name || 'Error',
            message: error.message || 'Unknown error',
            code: error.code || 'UNKNOWN',
            details: error.details || {},
            stack: error.stack || '',
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        this.errors.unshift(errorLog);
        
        // Keep only last maxErrors
        if (this.errors.length > this.maxErrors) {
            this.errors = this.errors.slice(0, this.maxErrors);
        }
        
        // Store in localStorage for persistence
        try {
            localStorage.setItem('errorLogs', JSON.stringify(this.errors));
        } catch (e) {
            console.error('Failed to store error logs:', e);
        }
        
        // Send to server if endpoint available
        this.sendToServer(errorLog);
    }
    
    /**
     * Send error to server
     */
    sendToServer(errorLog) {
        // Implement server logging if needed
        // For now, just console log
        console.log('Error logged:', errorLog);
    }
    
    /**
     * Get all errors
     */
    getErrors() {
        return this.errors;
    }
    
    /**
     * Clear errors
     */
    clear() {
        this.errors = [];
        try {
            localStorage.removeItem('errorLogs');
        } catch (e) {
            console.error('Failed to clear error logs:', e);
        }
    }
}

// Initialize global error tracker
if (!window.errorTracker) {
    window.errorTracker = new ErrorTracker();
}
```

## Files Modified
1. `js/laporanTransaksiSimpananAnggota.js` - Enhanced error handling throughout

## Testing Checklist
- [ ] Test with localStorage unavailable
- [ ] Test with corrupted data in localStorage
- [ ] Test with missing data structures
- [ ] Test with invalid anggotaId
- [ ] Test export with no data
- [ ] Test export with invalid data
- [ ] Test print with no data
- [ ] Test division by zero scenarios
- [ ] Test with null/undefined values
- [ ] Test error recovery and retry
- [ ] Test graceful degradation
- [ ] Test error messages are user-friendly

## Error Codes Reference
- `DATA_LOAD_ERROR` - Failed to load data from localStorage
- `VALIDATION_ERROR` - Data validation failed
- `EXPORT_ERROR` - Failed to export or print data

## Status
✅ Implementation complete - Ready for integration and testing
