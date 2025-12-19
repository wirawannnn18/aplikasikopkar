/**
 * Error Handler - Comprehensive error handling framework for import tagihan
 * Requirements: 8.1, 8.2, 8.3, 8.5
 */

/**
 * Error categories as defined in design document
 */
const ERROR_CATEGORIES = {
    FILE_UPLOAD: 'FILE_UPLOAD',
    DATA_VALIDATION: 'DATA_VALIDATION', 
    PROCESSING: 'PROCESSING',
    SYSTEM: 'SYSTEM'
};

/**
 * Error codes for specific error types
 */
const ERROR_CODES = {
    // File Upload Errors
    INVALID_FILE_FORMAT: 'INVALID_FILE_FORMAT',
    FILE_SIZE_EXCEEDED: 'FILE_SIZE_EXCEEDED',
    CORRUPTED_FILE: 'CORRUPTED_FILE',
    MISSING_REQUIRED_COLUMNS: 'MISSING_REQUIRED_COLUMNS',
    
    // Data Validation Errors
    INVALID_MEMBER_NUMBER: 'INVALID_MEMBER_NUMBER',
    INVALID_PAYMENT_TYPE: 'INVALID_PAYMENT_TYPE',
    INVALID_AMOUNT_FORMAT: 'INVALID_AMOUNT_FORMAT',
    AMOUNT_EXCEEDS_BALANCE: 'AMOUNT_EXCEEDS_BALANCE',
    MEMBER_NOT_FOUND: 'MEMBER_NOT_FOUND',
    
    // Processing Errors
    DATABASE_CONNECTION_FAILURE: 'DATABASE_CONNECTION_FAILURE',
    JOURNAL_ENTRY_FAILURE: 'JOURNAL_ENTRY_FAILURE',
    BALANCE_UPDATE_FAILURE: 'BALANCE_UPDATE_FAILURE',
    SYSTEM_RESOURCE_EXHAUSTION: 'SYSTEM_RESOURCE_EXHAUSTION',
    
    // System Errors
    MEMORY_OVERFLOW: 'MEMORY_OVERFLOW',
    NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
    STORAGE_FAILURE: 'STORAGE_FAILURE',
    AUTHENTICATION_FAILURE: 'AUTHENTICATION_FAILURE'
};

/**
 * Error severity levels
 */
const ERROR_SEVERITY = {
    LOW: 'LOW',           // Non-critical errors that don't stop processing
    MEDIUM: 'MEDIUM',     // Errors that affect individual transactions
    HIGH: 'HIGH',         // Errors that affect batch processing
    CRITICAL: 'CRITICAL'  // Errors that require system rollback
};

/**
 * Custom error class for import tagihan operations
 */
class ImportTagihanError extends Error {
    constructor(message, code, category, severity = ERROR_SEVERITY.MEDIUM, details = {}) {
        super(message);
        this.name = 'ImportTagihanError';
        this.code = code;
        this.category = category;
        this.severity = severity;
        this.details = details;
        this.timestamp = new Date();
        this.recoverable = severity !== ERROR_SEVERITY.CRITICAL;
    }

    /**
     * Convert error to JSON for logging
     * @returns {Object} Error object
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            category: this.category,
            severity: this.severity,
            details: this.details,
            timestamp: this.timestamp,
            recoverable: this.recoverable,
            stack: this.stack
        };
    }
}

/**
 * Error handling framework for import tagihan operations
 * Provides graceful error handling, specific error messages, and system stability
 */
class ErrorHandler {
    constructor(auditLogger = null) {
        this.auditLogger = auditLogger;
        this.errorHistory = [];
        this.errorCallbacks = new Map();
        this.systemStable = true;
    }

    /**
     * Handle file upload errors
     * Requirements: 8.1, 8.2
     * @param {Error} error - Original error
     * @param {Object} context - Error context
     * @returns {ImportTagihanError} Handled error
     */
    handleFileUploadError(error, context = {}) {
        let code, message, severity;

        if (error.message.includes('format') || error.message.includes('type')) {
            code = ERROR_CODES.INVALID_FILE_FORMAT;
            message = 'Format file tidak didukung. Gunakan file CSV atau Excel (.xlsx).';
            severity = ERROR_SEVERITY.MEDIUM;
        } else if (error.message.includes('size') || error.message.includes('besar')) {
            code = ERROR_CODES.FILE_SIZE_EXCEEDED;
            message = 'Ukuran file melebihi batas maksimum 5MB. Silakan gunakan file yang lebih kecil.';
            severity = ERROR_SEVERITY.MEDIUM;
        } else if (error.message.includes('corrupt') || error.message.includes('rusak')) {
            code = ERROR_CODES.CORRUPTED_FILE;
            message = 'File rusak atau tidak dapat dibaca. Silakan periksa file dan coba lagi.';
            severity = ERROR_SEVERITY.MEDIUM;
        } else if (error.message.includes('column') || error.message.includes('kolom')) {
            code = ERROR_CODES.MISSING_REQUIRED_COLUMNS;
            message = 'File tidak memiliki kolom yang diperlukan. Pastikan file sesuai dengan template.';
            severity = ERROR_SEVERITY.MEDIUM;
        } else {
            code = ERROR_CODES.CORRUPTED_FILE;
            message = 'Terjadi kesalahan saat memproses file. Silakan periksa format file dan coba lagi.';
            severity = ERROR_SEVERITY.MEDIUM;
        }

        const handledError = new ImportTagihanError(
            message,
            code,
            ERROR_CATEGORIES.FILE_UPLOAD,
            severity,
            { originalError: error.message, ...context }
        );

        this._logError(handledError);
        return handledError;
    }

    /**
     * Handle data validation errors
     * Requirements: 8.1, 8.2
     * @param {Error} error - Original error
     * @param {Object} context - Error context (row data, etc.)
     * @returns {ImportTagihanError} Handled error
     */
    handleDataValidationError(error, context = {}) {
        let code, message, severity;

        if (error.message.includes('tidak ditemukan') || error.message.includes('not found')) {
            code = ERROR_CODES.MEMBER_NOT_FOUND;
            message = `Anggota dengan nomor ${context.memberNumber || 'tidak diketahui'} tidak ditemukan dalam database.`;
            severity = ERROR_SEVERITY.LOW;
        } else if (error.message.includes('jenis pembayaran') || error.message.includes('payment type')) {
            code = ERROR_CODES.INVALID_PAYMENT_TYPE;
            message = 'Jenis pembayaran harus "hutang" atau "piutang".';
            severity = ERROR_SEVERITY.LOW;
        } else if (error.message.includes('jumlah') && error.message.includes('format')) {
            code = ERROR_CODES.INVALID_AMOUNT_FORMAT;
            message = 'Format jumlah pembayaran tidak valid. Gunakan angka positif tanpa titik atau koma.';
            severity = ERROR_SEVERITY.LOW;
        } else if (error.message.includes('saldo') && error.message.includes('tidak mencukupi')) {
            code = ERROR_CODES.AMOUNT_EXCEEDS_BALANCE;
            message = `Jumlah pembayaran melebihi saldo yang tersedia. ${error.message}`;
            severity = ERROR_SEVERITY.LOW;
        } else {
            code = ERROR_CODES.INVALID_MEMBER_NUMBER;
            message = 'Data tidak valid. Silakan periksa format data dan coba lagi.';
            severity = ERROR_SEVERITY.LOW;
        }

        const handledError = new ImportTagihanError(
            message,
            code,
            ERROR_CATEGORIES.DATA_VALIDATION,
            severity,
            { originalError: error.message, rowNumber: context.rowNumber, ...context }
        );

        this._logError(handledError);
        return handledError;
    }

    /**
     * Handle processing errors
     * Requirements: 8.1, 8.3
     * @param {Error} error - Original error
     * @param {Object} context - Error context
     * @returns {ImportTagihanError} Handled error
     */
    handleProcessingError(error, context = {}) {
        let code, message, severity;

        if (error.message.includes('database') || error.message.includes('connection')) {
            code = ERROR_CODES.DATABASE_CONNECTION_FAILURE;
            message = 'Koneksi database bermasalah. Silakan coba lagi dalam beberapa saat.';
            severity = ERROR_SEVERITY.HIGH;
            this.systemStable = false;
        } else if (error.message.includes('jurnal') || error.message.includes('journal')) {
            code = ERROR_CODES.JOURNAL_ENTRY_FAILURE;
            message = 'Gagal mencatat jurnal akuntansi. Transaksi akan dibatalkan.';
            severity = ERROR_SEVERITY.HIGH;
        } else if (error.message.includes('saldo') || error.message.includes('balance')) {
            code = ERROR_CODES.BALANCE_UPDATE_FAILURE;
            message = 'Gagal memperbarui saldo anggota. Transaksi akan dibatalkan.';
            severity = ERROR_SEVERITY.HIGH;
        } else if (error.message.includes('memory') || error.message.includes('resource')) {
            code = ERROR_CODES.SYSTEM_RESOURCE_EXHAUSTION;
            message = 'Sistem kekurangan sumber daya. Silakan coba dengan file yang lebih kecil.';
            severity = ERROR_SEVERITY.HIGH;
            this.systemStable = false;
        } else {
            code = ERROR_CODES.BALANCE_UPDATE_FAILURE;
            message = 'Terjadi kesalahan saat memproses transaksi. Silakan coba lagi.';
            severity = ERROR_SEVERITY.HIGH;
        }

        const handledError = new ImportTagihanError(
            message,
            code,
            ERROR_CATEGORIES.PROCESSING,
            severity,
            { originalError: error.message, transactionId: context.transactionId, ...context }
        );

        this._logError(handledError);
        return handledError;
    }

    /**
     * Handle system errors
     * Requirements: 8.1, 8.3, 8.5
     * @param {Error} error - Original error
     * @param {Object} context - Error context
     * @returns {ImportTagihanError} Handled error
     */
    handleSystemError(error, context = {}) {
        let code, message, severity;

        if (error.message.includes('memory') || error.message.includes('heap')) {
            code = ERROR_CODES.MEMORY_OVERFLOW;
            message = 'Sistem kehabisan memori. Silakan tutup aplikasi lain dan coba lagi.';
            severity = ERROR_SEVERITY.CRITICAL;
        } else if (error.message.includes('network') || error.message.includes('timeout')) {
            code = ERROR_CODES.NETWORK_TIMEOUT;
            message = 'Koneksi jaringan terputus. Silakan periksa koneksi internet dan coba lagi.';
            severity = ERROR_SEVERITY.HIGH;
        } else if (error.message.includes('storage') || error.message.includes('localStorage')) {
            code = ERROR_CODES.STORAGE_FAILURE;
            message = 'Gagal menyimpan data. Silakan periksa ruang penyimpanan browser.';
            severity = ERROR_SEVERITY.CRITICAL;
        } else if (error.message.includes('auth') || error.message.includes('permission')) {
            code = ERROR_CODES.AUTHENTICATION_FAILURE;
            message = 'Sesi telah berakhir. Silakan login ulang.';
            severity = ERROR_SEVERITY.HIGH;
        } else {
            code = ERROR_CODES.STORAGE_FAILURE;
            message = 'Terjadi kesalahan sistem yang tidak terduga. Silakan hubungi administrator.';
            severity = ERROR_SEVERITY.CRITICAL;
        }

        this.systemStable = severity !== ERROR_SEVERITY.CRITICAL;

        const handledError = new ImportTagihanError(
            message,
            code,
            ERROR_CATEGORIES.SYSTEM,
            severity,
            { originalError: error.message, ...context }
        );

        this._logError(handledError);
        return handledError;
    }

    /**
     * Handle any error with automatic categorization
     * Requirements: 8.1, 8.2, 8.3
     * @param {Error} error - Original error
     * @param {Object} context - Error context
     * @returns {ImportTagihanError} Handled error
     */
    handleError(error, context = {}) {
        // If already an ImportTagihanError, just log and return
        if (error instanceof ImportTagihanError) {
            this._logError(error);
            return error;
        }

        // Categorize error based on context or message
        const category = this._categorizeError(error, context);

        switch (category) {
            case ERROR_CATEGORIES.FILE_UPLOAD:
                return this.handleFileUploadError(error, context);
            case ERROR_CATEGORIES.DATA_VALIDATION:
                return this.handleDataValidationError(error, context);
            case ERROR_CATEGORIES.PROCESSING:
                return this.handleProcessingError(error, context);
            case ERROR_CATEGORIES.SYSTEM:
                return this.handleSystemError(error, context);
            default:
                return this.handleSystemError(error, context);
        }
    }

    /**
     * Check if system is stable for continued operations
     * Requirements: 8.3, 8.5
     * @returns {boolean} System stability status
     */
    isSystemStable() {
        return this.systemStable;
    }

    /**
     * Reset system stability status
     * Requirements: 8.5
     */
    resetSystemStability() {
        this.systemStable = true;
    }

    /**
     * Get error statistics
     * Requirements: 8.5
     * @returns {Object} Error statistics
     */
    getErrorStatistics() {
        const stats = {
            total: this.errorHistory.length,
            byCategory: {},
            bySeverity: {},
            byCode: {},
            recent: this.errorHistory.slice(-10)
        };

        this.errorHistory.forEach(error => {
            // Count by category
            stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
            
            // Count by severity
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
            
            // Count by code
            stats.byCode[error.code] = (stats.byCode[error.code] || 0) + 1;
        });

        return stats;
    }

    /**
     * Register error callback for specific error types
     * Requirements: 8.1
     * @param {string} errorCode - Error code to listen for
     * @param {Function} callback - Callback function
     */
    onError(errorCode, callback) {
        if (!this.errorCallbacks.has(errorCode)) {
            this.errorCallbacks.set(errorCode, []);
        }
        this.errorCallbacks.get(errorCode).push(callback);
    }

    /**
     * Clear error history
     * Requirements: 8.5
     */
    clearErrorHistory() {
        this.errorHistory = [];
    }

    /**
     * Categorize error based on context and message
     * @private
     * @param {Error} error - Error to categorize
     * @param {Object} context - Error context
     * @returns {string} Error category
     */
    _categorizeError(error, context) {
        const message = error.message.toLowerCase();

        // Check context first
        if (context.stage === 'file_upload' || context.operation === 'upload') {
            return ERROR_CATEGORIES.FILE_UPLOAD;
        }
        if (context.stage === 'validation' || context.operation === 'validate') {
            return ERROR_CATEGORIES.DATA_VALIDATION;
        }
        if (context.stage === 'processing' || context.operation === 'process') {
            return ERROR_CATEGORIES.PROCESSING;
        }

        // Check message content
        if (message.includes('file') || message.includes('upload') || message.includes('format')) {
            return ERROR_CATEGORIES.FILE_UPLOAD;
        }
        if (message.includes('validasi') || message.includes('validation') || message.includes('invalid')) {
            return ERROR_CATEGORIES.DATA_VALIDATION;
        }
        if (message.includes('process') || message.includes('transaction') || message.includes('jurnal')) {
            return ERROR_CATEGORIES.PROCESSING;
        }

        return ERROR_CATEGORIES.SYSTEM;
    }

    /**
     * Log error to audit system and internal history
     * @private
     * @param {ImportTagihanError} error - Error to log
     */
    _logError(error) {
        // Add to internal history
        this.errorHistory.push(error);

        // Keep only last 100 errors to prevent memory issues
        if (this.errorHistory.length > 100) {
            this.errorHistory = this.errorHistory.slice(-100);
        }

        // Log to audit system if available
        if (this.auditLogger) {
            this.auditLogger.logError(error);
        }

        // Call registered callbacks
        if (this.errorCallbacks.has(error.code)) {
            this.errorCallbacks.get(error.code).forEach(callback => {
                try {
                    callback(error);
                } catch (callbackError) {
                    console.error('Error in error callback:', callbackError);
                }
            });
        }

        // Log to console for debugging
        console.error('ImportTagihan Error:', error.toJSON());
    }
}

// Export error classes and constants
const ImportTagihanErrorHandler = {
    ErrorHandler,
    ImportTagihanError,
    ERROR_CATEGORIES,
    ERROR_CODES,
    ERROR_SEVERITY
};

// Export for both browser and Node.js environments
if (typeof window !== 'undefined') {
    window.ImportTagihanErrorHandler = ImportTagihanErrorHandler;
}

// Browser compatibility - exports handled via window object

// CommonJS export for compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImportTagihanErrorHandler;
}