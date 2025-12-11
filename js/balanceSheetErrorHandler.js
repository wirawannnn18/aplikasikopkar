/**
 * Balance Sheet Error Handler
 * Task 6: Add error handling and user feedback
 * Requirements: 4.1, 4.2, 4.3
 */

/**
 * Balance Sheet Error Types
 */
const BalanceSheetErrorTypes = {
    NO_DATA: 'NO_DATA',
    INVALID_PERIOD: 'INVALID_PERIOD',
    COA_MISSING: 'COA_MISSING',
    COA_INVALID: 'COA_INVALID',
    CALCULATION_ERROR: 'CALCULATION_ERROR',
    EXPORT_ERROR: 'EXPORT_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    PERFORMANCE_ERROR: 'PERFORMANCE_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    SYSTEM_ERROR: 'SYSTEM_ERROR'
};

/**
 * Balance Sheet Error Handler Class
 * Centralized error handling for balance sheet operations
 */
class BalanceSheetErrorHandler {
    constructor() {
        this.errorLog = [];
        this.retryAttempts = new Map();
        this.maxRetryAttempts = 3;
        this.performanceThresholds = {
            calculation: 5000, // 5 seconds
            export: 10000,     // 10 seconds
            display: 3000      // 3 seconds
        };
    }

    /**
     * Handle balance sheet errors with appropriate user feedback
     * Requirements: 4.2, 4.3
     * @param {Error} error - The error object
     * @param {string} operation - The operation that failed
     * @param {Object} context - Additional context information
     * @returns {Object} Error handling result
     */
    handleError(error, operation, context = {}) {
        const errorInfo = this.categorizeError(error, operation, context);
        this.logError(errorInfo);
        
        const userFeedback = this.generateUserFeedback(errorInfo);
        const recoveryOptions = this.getRecoveryOptions(errorInfo);
        
        return {
            errorInfo,
            userFeedback,
            recoveryOptions,
            canRetry: this.canRetry(operation),
            shouldCache: this.shouldCacheResult(errorInfo)
        };
    }

    /**
     * Categorize error based on type and context
     * @param {Error} error - The error object
     * @param {string} operation - The operation that failed
     * @param {Object} context - Additional context
     * @returns {Object} Categorized error information
     */
    categorizeError(error, operation, context) {
        const errorMessage = error.message || error.toString();
        let errorType = BalanceSheetErrorTypes.SYSTEM_ERROR;
        let severity = 'error';
        let isRecoverable = true;

        // Categorize based on error message patterns
        if (errorMessage.includes('Chart of Accounts') || errorMessage.includes('COA')) {
            errorType = errorMessage.includes('tidak tersedia') ? 
                BalanceSheetErrorTypes.COA_MISSING : 
                BalanceSheetErrorTypes.COA_INVALID;
        } else if (errorMessage.includes('No data') || errorMessage.includes('Tidak ada data')) {
            errorType = BalanceSheetErrorTypes.NO_DATA;
        } else if (errorMessage.includes('Invalid') || errorMessage.includes('validation')) {
            errorType = BalanceSheetErrorTypes.VALIDATION_ERROR;
        } else if (errorMessage.includes('period') || errorMessage.includes('periode')) {
            errorType = BalanceSheetErrorTypes.INVALID_PERIOD;
        } else if (errorMessage.includes('export') || errorMessage.includes('PDF') || errorMessage.includes('Excel')) {
            errorType = BalanceSheetErrorTypes.EXPORT_ERROR;
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
            errorType = BalanceSheetErrorTypes.NETWORK_ERROR;
        } else if (operation.includes('calculate')) {
            errorType = BalanceSheetErrorTypes.CALCULATION_ERROR;
        }

        // Determine severity
        if (errorType === BalanceSheetErrorTypes.COA_MISSING || 
            errorType === BalanceSheetErrorTypes.SYSTEM_ERROR) {
            severity = 'critical';
            isRecoverable = false;
        } else if (errorType === BalanceSheetErrorTypes.NETWORK_ERROR ||
                   errorType === BalanceSheetErrorTypes.PERFORMANCE_ERROR) {
            severity = 'warning';
        }

        return {
            type: errorType,
            severity,
            message: errorMessage,
            operation,
            context,
            timestamp: new Date(),
            isRecoverable,
            originalError: error
        };
    }

    /**
     * Generate user-friendly feedback messages
     * Requirements: 4.2
     * @param {Object} errorInfo - Categorized error information
     * @returns {Object} User feedback object
     */
    generateUserFeedback(errorInfo) {
        const feedbackMessages = {
            [BalanceSheetErrorTypes.NO_DATA]: {
                title: 'Tidak Ada Data',
                message: 'Tidak ada data untuk periode yang dipilih. Silakan pilih periode lain atau periksa data COA dan jurnal.',
                icon: 'bi-info-circle',
                type: 'info',
                suggestions: [
                    'Pilih periode yang memiliki data transaksi',
                    'Periksa pengaturan Chart of Accounts (COA)',
                    'Pastikan data jurnal sudah diinput'
                ]
            },
            [BalanceSheetErrorTypes.COA_MISSING]: {
                title: 'COA Tidak Tersedia',
                message: 'Chart of Accounts (COA) belum diinisialisasi. Silakan setup COA terlebih dahulu.',
                icon: 'bi-exclamation-triangle',
                type: 'error',
                suggestions: [
                    'Buka menu Master COA untuk setup akun',
                    'Import data COA dari file Excel',
                    'Hubungi administrator sistem'
                ]
            },
            [BalanceSheetErrorTypes.COA_INVALID]: {
                title: 'COA Tidak Valid',
                message: 'Struktur Chart of Accounts (COA) tidak valid atau rusak.',
                icon: 'bi-exclamation-triangle',
                type: 'warning',
                suggestions: [
                    'Periksa struktur akun di Master COA',
                    'Validasi tipe akun (Aset, Kewajiban, Modal)',
                    'Reset dan setup ulang COA jika perlu'
                ]
            },
            [BalanceSheetErrorTypes.INVALID_PERIOD]: {
                title: 'Periode Tidak Valid',
                message: 'Periode yang dipilih tidak valid atau di luar rentang data yang tersedia.',
                icon: 'bi-calendar-x',
                type: 'warning',
                suggestions: [
                    'Pilih tanggal dalam rentang data yang tersedia',
                    'Periksa format tanggal yang diinput',
                    'Gunakan saran periode alternatif'
                ]
            },
            [BalanceSheetErrorTypes.CALCULATION_ERROR]: {
                title: 'Error Perhitungan',
                message: 'Terjadi kesalahan dalam perhitungan neraca. Data mungkin tidak konsisten.',
                icon: 'bi-calculator',
                type: 'error',
                suggestions: [
                    'Periksa konsistensi data jurnal',
                    'Validasi saldo awal akun',
                    'Coba generate ulang laporan'
                ]
            },
            [BalanceSheetErrorTypes.EXPORT_ERROR]: {
                title: 'Error Export',
                message: 'Gagal mengexport laporan. Periksa pengaturan browser atau coba lagi.',
                icon: 'bi-download',
                type: 'error',
                suggestions: [
                    'Pastikan popup tidak diblokir browser',
                    'Periksa ruang penyimpanan yang tersedia',
                    'Coba export dengan format lain'
                ]
            },
            [BalanceSheetErrorTypes.NETWORK_ERROR]: {
                title: 'Masalah Koneksi',
                message: 'Terjadi masalah koneksi. Laporan akan menggunakan data cache jika tersedia.',
                icon: 'bi-wifi-off',
                type: 'warning',
                suggestions: [
                    'Periksa koneksi internet',
                    'Coba refresh halaman',
                    'Gunakan data offline jika tersedia'
                ]
            },
            [BalanceSheetErrorTypes.PERFORMANCE_ERROR]: {
                title: 'Performa Lambat',
                message: 'Pemrosesan data memakan waktu lama. Sistem akan mengoptimalkan performa.',
                icon: 'bi-speedometer2',
                type: 'warning',
                suggestions: [
                    'Gunakan filter periode untuk mengurangi data',
                    'Tunggu hingga proses selesai',
                    'Pertimbangkan untuk menggunakan data cache'
                ]
            }
        };

        const defaultFeedback = {
            title: 'Terjadi Kesalahan',
            message: errorInfo.message || 'Terjadi kesalahan sistem yang tidak diketahui.',
            icon: 'bi-exclamation-triangle',
            type: 'error',
            suggestions: [
                'Coba refresh halaman',
                'Periksa data input',
                'Hubungi administrator jika masalah berlanjut'
            ]
        };

        return feedbackMessages[errorInfo.type] || defaultFeedback;
    }

    /**
     * Get recovery options for different error types
     * Requirements: 4.3
     * @param {Object} errorInfo - Categorized error information
     * @returns {Array} Array of recovery options
     */
    getRecoveryOptions(errorInfo) {
        const recoveryOptions = [];

        switch (errorInfo.type) {
            case BalanceSheetErrorTypes.NO_DATA:
                recoveryOptions.push(
                    { action: 'suggestPeriods', label: 'Saran Periode Lain', icon: 'bi-lightbulb' },
                    { action: 'resetPeriod', label: 'Reset Periode', icon: 'bi-arrow-clockwise' },
                    { action: 'checkData', label: 'Periksa Data', icon: 'bi-search' }
                );
                break;

            case BalanceSheetErrorTypes.COA_MISSING:
                recoveryOptions.push(
                    { action: 'setupCOA', label: 'Setup COA', icon: 'bi-gear' },
                    { action: 'importCOA', label: 'Import COA', icon: 'bi-upload' }
                );
                break;

            case BalanceSheetErrorTypes.INVALID_PERIOD:
                recoveryOptions.push(
                    { action: 'resetPeriod', label: 'Reset Periode', icon: 'bi-arrow-clockwise' },
                    { action: 'suggestPeriods', label: 'Saran Periode', icon: 'bi-lightbulb' }
                );
                break;

            case BalanceSheetErrorTypes.CALCULATION_ERROR:
            case BalanceSheetErrorTypes.EXPORT_ERROR:
                if (this.canRetry(errorInfo.operation)) {
                    recoveryOptions.push(
                        { action: 'retry', label: 'Coba Lagi', icon: 'bi-arrow-repeat' }
                    );
                }
                recoveryOptions.push(
                    { action: 'resetReport', label: 'Reset Laporan', icon: 'bi-arrow-clockwise' }
                );
                break;

            case BalanceSheetErrorTypes.NETWORK_ERROR:
                recoveryOptions.push(
                    { action: 'useCache', label: 'Gunakan Data Cache', icon: 'bi-archive' },
                    { action: 'retry', label: 'Coba Lagi', icon: 'bi-arrow-repeat' }
                );
                break;

            default:
                if (errorInfo.isRecoverable) {
                    recoveryOptions.push(
                        { action: 'retry', label: 'Coba Lagi', icon: 'bi-arrow-repeat' },
                        { action: 'reset', label: 'Reset', icon: 'bi-arrow-clockwise' }
                    );
                }
        }

        return recoveryOptions;
    }

    /**
     * Check if operation can be retried
     * @param {string} operation - The operation name
     * @returns {boolean} Whether retry is allowed
     */
    canRetry(operation) {
        const currentAttempts = this.retryAttempts.get(operation) || 0;
        return currentAttempts < this.maxRetryAttempts;
    }

    /**
     * Increment retry counter for operation
     * @param {string} operation - The operation name
     */
    incrementRetry(operation) {
        const currentAttempts = this.retryAttempts.get(operation) || 0;
        this.retryAttempts.set(operation, currentAttempts + 1);
    }

    /**
     * Reset retry counter for operation
     * @param {string} operation - The operation name
     */
    resetRetry(operation) {
        this.retryAttempts.delete(operation);
    }

    /**
     * Determine if result should be cached
     * Requirements: 4.5
     * @param {Object} errorInfo - Error information
     * @returns {boolean} Whether to cache the result
     */
    shouldCacheResult(errorInfo) {
        return errorInfo.type === BalanceSheetErrorTypes.NETWORK_ERROR ||
               errorInfo.type === BalanceSheetErrorTypes.PERFORMANCE_ERROR;
    }

    /**
     * Log error for debugging and monitoring
     * @param {Object} errorInfo - Error information to log
     */
    logError(errorInfo) {
        this.errorLog.push(errorInfo);
        
        // Keep only last 100 errors
        if (this.errorLog.length > 100) {
            this.errorLog = this.errorLog.slice(-100);
        }

        // Console logging for development
        console.error('Balance Sheet Error:', {
            type: errorInfo.type,
            operation: errorInfo.operation,
            message: errorInfo.message,
            timestamp: errorInfo.timestamp
        });
    }

    /**
     * Get error statistics for monitoring
     * @returns {Object} Error statistics
     */
    getErrorStats() {
        const stats = {
            total: this.errorLog.length,
            byType: {},
            byOperation: {},
            recent: this.errorLog.slice(-10)
        };

        this.errorLog.forEach(error => {
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
            stats.byOperation[error.operation] = (stats.byOperation[error.operation] || 0) + 1;
        });

        return stats;
    }

    /**
     * Clear error log
     */
    clearErrorLog() {
        this.errorLog = [];
        this.retryAttempts.clear();
    }
}

// Global instance
const balanceSheetErrorHandler = new BalanceSheetErrorHandler();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BalanceSheetErrorHandler, balanceSheetErrorHandler, BalanceSheetErrorTypes };
}