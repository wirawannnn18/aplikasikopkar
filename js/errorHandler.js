/**
 * Comprehensive Error Handler Module
 * Provides centralized error handling, logging, and user-friendly error messages
 * for the Anggota Keluar feature implementation
 */

// ===== Error Logging and Debugging =====

/**
 * Enhanced error logger with context and stack trace
 * @param {string} context - Context where error occurred (e.g., 'filterActiveAnggota')
 * @param {Error|string} error - Error object or message
 * @param {object} additionalData - Additional context data
 */
function logError(context, error, additionalData = {}) {
    const timestamp = new Date().toISOString();
    const errorInfo = {
        timestamp,
        context,
        error: error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
        } : error,
        additionalData,
        userAgent: navigator.userAgent,
        url: window.location.href
    };
    
    // Log to console with structured format
    console.group(`🚨 Error in ${context} at ${timestamp}`);
    console.error('Error Details:', errorInfo);
    if (error instanceof Error && error.stack) {
        console.error('Stack Trace:', error.stack);
    }
    if (Object.keys(additionalData).length > 0) {
        console.error('Additional Context:', additionalData);
    }
    console.groupEnd();
    
    // Store error in localStorage for debugging (keep last 50 errors)
    try {
        const errorLog = JSON.parse(localStorage.getItem('errorLog') || '[]');
        errorLog.unshift(errorInfo);
        
        // Keep only last 50 errors to prevent localStorage bloat
        if (errorLog.length > 50) {
            errorLog.splice(50);
        }
        
        localStorage.setItem('errorLog', JSON.stringify(errorLog));
    } catch (logStorageError) {
        console.warn('Failed to store error in localStorage:', logStorageError);
    }
}

/**
 * Get error log for debugging
 * @returns {Array} Array of error log entries
 */
function getErrorLog() {
    try {
        return JSON.parse(localStorage.getItem('errorLog') || '[]');
    } catch (error) {
        console.warn('Failed to retrieve error log:', error);
        return [];
    }
}

/**
 * Clear error log
 */
function clearErrorLog() {
    try {
        localStorage.removeItem('errorLog');
        console.log('Error log cleared');
    } catch (error) {
        console.warn('Failed to clear error log:', error);
    }
}

// ===== User-Friendly Error Messages =====

/**
 * Error message mappings for user-friendly display
 */
const ERROR_MESSAGES = {
    // Data access errors
    'localStorage_not_available': 'Penyimpanan data tidak tersedia. Pastikan browser mendukung localStorage.',
    'data_corrupted': 'Data rusak atau tidak valid. Silakan refresh halaman atau hubungi administrator.',
    'data_not_found': 'Data tidak ditemukan. Pastikan data sudah tersimpan dengan benar.',
    
    // Anggota-related errors
    'anggota_not_found': 'Anggota tidak ditemukan dalam sistem.',
    'anggota_already_keluar': 'Anggota sudah keluar dari koperasi dan tidak dapat melakukan transaksi.',
    'anggota_nonaktif': 'Anggota berstatus non-aktif dan tidak dapat melakukan transaksi.',
    'anggota_cuti': 'Anggota sedang cuti dan tidak dapat melakukan transaksi.',
    'anggota_in_exit_process': 'Anggota sedang dalam proses keluar dan tidak dapat melakukan transaksi.',
    
    // Transaction errors
    'invalid_amount': 'Jumlah tidak valid. Pastikan memasukkan angka yang benar.',
    'insufficient_balance': 'Saldo tidak mencukupi untuk transaksi ini.',
    'transaction_already_processed': 'Transaksi sudah diproses sebelumnya.',
    
    // Validation errors
    'required_field_empty': 'Field yang wajib diisi tidak boleh kosong.',
    'invalid_date': 'Format tanggal tidak valid.',
    'invalid_format': 'Format data tidak sesuai.',
    
    // System errors
    'system_error': 'Terjadi kesalahan sistem. Silakan coba lagi atau hubungi administrator.',
    'network_error': 'Terjadi kesalahan jaringan. Periksa koneksi internet Anda.',
    'permission_denied': 'Akses ditolak. Anda tidak memiliki izin untuk melakukan operasi ini.'
};

/**
 * Get user-friendly error message
 * @param {string} errorCode - Error code
 * @param {string} fallbackMessage - Fallback message if code not found
 * @returns {string} User-friendly error message
 */
function getUserFriendlyMessage(errorCode, fallbackMessage = 'Terjadi kesalahan yang tidak diketahui.') {
    return ERROR_MESSAGES[errorCode] || fallbackMessage;
}

/**
 * Show user-friendly error alert
 * @param {string} errorCode - Error code or custom message
 * @param {string} context - Context for debugging
 * @param {object} additionalData - Additional data for logging
 */
function showUserError(errorCode, context = 'unknown', additionalData = {}) {
    const message = ERROR_MESSAGES[errorCode] || errorCode;
    
    // Log the error for debugging
    logError(context, errorCode, additionalData);
    
    // Show user-friendly alert
    if (typeof showAlert === 'function') {
        showAlert(message, 'error');
    } else {
        alert(message);
    }
}

// ===== Input Validation Helpers =====

/**
 * Validate anggota ID
 * @param {string} anggotaId - Anggota ID to validate
 * @returns {object} Validation result
 */
function validateAnggotaId(anggotaId) {
    if (!anggotaId || typeof anggotaId !== 'string') {
        return {
            valid: false,
            error: 'required_field_empty',
            message: 'ID anggota tidak boleh kosong'
        };
    }
    
    if (anggotaId.trim().length === 0) {
        return {
            valid: false,
            error: 'required_field_empty',
            message: 'ID anggota tidak boleh kosong'
        };
    }
    
    return { valid: true };
}

/**
 * Validate amount/jumlah
 * @param {number|string} amount - Amount to validate
 * @returns {object} Validation result
 */
function validateAmount(amount) {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount)) {
        return {
            valid: false,
            error: 'invalid_amount',
            message: 'Jumlah harus berupa angka yang valid'
        };
    }
    
    if (numAmount <= 0) {
        return {
            valid: false,
            error: 'invalid_amount',
            message: 'Jumlah harus lebih dari 0'
        };
    }
    
    if (numAmount > 999999999999) { // 999 billion limit
        return {
            valid: false,
            error: 'invalid_amount',
            message: 'Jumlah terlalu besar'
        };
    }
    
    return { valid: true, amount: numAmount };
}

/**
 * Validate array input
 * @param {any} input - Input to validate as array
 * @param {string} fieldName - Name of the field for error messages
 * @returns {object} Validation result
 */
function validateArray(input, fieldName = 'data') {
    if (!Array.isArray(input)) {
        return {
            valid: false,
            error: 'invalid_format',
            message: `${fieldName} harus berupa array`,
            fallback: []
        };
    }
    
    return { valid: true, array: input };
}

// ===== Safe Data Access Helpers =====

/**
 * Safely get data from localStorage with error handling
 * @param {string} key - localStorage key
 * @param {any} defaultValue - Default value if key doesn't exist or is invalid
 * @returns {any} Parsed data or default value
 */
function safeGetLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        if (item === null) {
            return defaultValue;
        }
        return JSON.parse(item);
    } catch (error) {
        logError('safeGetLocalStorage', error, { key, defaultValue });
        return defaultValue;
    }
}

/**
 * Safely set data to localStorage with error handling
 * @param {string} key - localStorage key
 * @param {any} value - Value to store
 * @returns {boolean} Success status
 */
function safeSetLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        logError('safeSetLocalStorage', error, { key, valueType: typeof value });
        
        // Try to handle quota exceeded error
        if (error.name === 'QuotaExceededError') {
            showUserError('Penyimpanan penuh. Silakan hapus data yang tidak diperlukan.', 'localStorage_quota');
        } else {
            showUserError('system_error', 'localStorage_set');
        }
        
        return false;
    }
}

/**
 * Safely find anggota by ID with comprehensive error handling
 * @param {string} anggotaId - ID of anggota to find
 * @returns {object} Result with anggota data or error
 */
function safeFindAnggota(anggotaId) {
    try {
        // Validate input
        const validation = validateAnggotaId(anggotaId);
        if (!validation.valid) {
            return {
                success: false,
                error: validation.error,
                message: validation.message
            };
        }
        
        // Get anggota data safely
        const anggotaList = safeGetLocalStorage('anggota', []);
        if (!Array.isArray(anggotaList)) {
            return {
                success: false,
                error: 'data_corrupted',
                message: 'Data anggota rusak atau tidak valid'
            };
        }
        
        // Find anggota
        const anggota = anggotaList.find(a => a && a.id === anggotaId);
        if (!anggota) {
            return {
                success: false,
                error: 'anggota_not_found',
                message: 'Anggota tidak ditemukan dalam sistem'
            };
        }
        
        return {
            success: true,
            anggota: anggota
        };
    } catch (error) {
        logError('safeFindAnggota', error, { anggotaId });
        return {
            success: false,
            error: 'system_error',
            message: 'Terjadi kesalahan saat mencari data anggota'
        };
    }
}

// ===== Recovery Mechanisms =====

/**
 * Attempt to recover corrupted localStorage data
 * @param {string} key - localStorage key to recover
 * @param {any} backupValue - Backup value to use if recovery fails
 * @returns {any} Recovered or backup data
 */
function recoverLocalStorageData(key, backupValue = []) {
    try {
        const item = localStorage.getItem(key);
        if (item === null) {
            logError('recoverLocalStorageData', `Key ${key} not found`, { key });
            return backupValue;
        }
        
        // Try to parse the data
        const parsed = JSON.parse(item);
        
        // Validate the parsed data structure
        if (Array.isArray(parsed)) {
            // Filter out any null or invalid entries
            const cleaned = parsed.filter(item => item !== null && typeof item === 'object');
            if (cleaned.length !== parsed.length) {
                logError('recoverLocalStorageData', `Cleaned ${parsed.length - cleaned.length} invalid entries from ${key}`);
                // Save the cleaned data back
                safeSetLocalStorage(key, cleaned);
            }
            return cleaned;
        }
        
        return parsed;
    } catch (error) {
        logError('recoverLocalStorageData', error, { key });
        
        // Attempt to backup corrupted data
        try {
            const corruptedData = localStorage.getItem(key);
            if (corruptedData) {
                localStorage.setItem(`${key}_corrupted_backup_${Date.now()}`, corruptedData);
            }
        } catch (backupError) {
            logError('recoverLocalStorageData', 'Failed to backup corrupted data', { key, backupError });
        }
        
        return backupValue;
    }
}

/**
 * Check localStorage health and attempt repairs
 * @returns {object} Health check results
 */
function checkLocalStorageHealth() {
    const results = {
        healthy: true,
        issues: [],
        repairs: []
    };
    
    const keysToCheck = ['anggota', 'simpananPokok', 'simpananWajib', 'simpananSukarela', 'jurnal'];
    
    keysToCheck.forEach(key => {
        try {
            const data = localStorage.getItem(key);
            if (data === null) {
                results.issues.push(`${key}: Data tidak ditemukan`);
                // Initialize with empty array
                safeSetLocalStorage(key, []);
                results.repairs.push(`${key}: Diinisialisasi dengan array kosong`);
            } else {
                const parsed = JSON.parse(data);
                if (!Array.isArray(parsed)) {
                    results.issues.push(`${key}: Data bukan array`);
                    results.healthy = false;
                }
            }
        } catch (error) {
            results.issues.push(`${key}: ${error.message}`);
            results.healthy = false;
            
            // Attempt recovery
            const recovered = recoverLocalStorageData(key, []);
            results.repairs.push(`${key}: Dipulihkan dengan ${recovered.length} item`);
        }
    });
    
    return results;
}

// ===== Export for use in other modules =====

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        logError,
        getErrorLog,
        clearErrorLog,
        getUserFriendlyMessage,
        showUserError,
        validateAnggotaId,
        validateAmount,
        validateArray,
        safeGetLocalStorage,
        safeSetLocalStorage,
        safeFindAnggota,
        recoverLocalStorageData,
        checkLocalStorageHealth
    };
}

// ===== Global Error Handler =====

// Catch unhandled errors
window.addEventListener('error', function(event) {
    logError('window.error', event.error || event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
});

// Catch unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    logError('unhandledrejection', event.reason, {
        promise: event.promise
    });
});

console.log('✅ Comprehensive Error Handler loaded successfully');