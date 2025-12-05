// Anggota Keluar Security Module
// Handles role-based access control, audit logging, and input sanitization

// ===== Role-Based Access Control =====

/**
 * Check if current user can mark anggota keluar
 * @returns {boolean} True if user has permission
 */
function canMarkAnggotaKeluar() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (!currentUser || !currentUser.role) {
        return false;
    }
    
    // Only Admin and Super Admin can mark anggota keluar
    const allowedRoles = ['admin', 'super_admin', 'administrator'];
    return allowedRoles.includes(currentUser.role);
}

/**
 * Check if current user can process pengembalian
 * @returns {boolean} True if user has permission
 */
function canProcessPengembalian() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (!currentUser || !currentUser.role) {
        return false;
    }
    
    // Only Admin and Super Admin can process pengembalian
    const allowedRoles = ['admin', 'super_admin', 'administrator'];
    return allowedRoles.includes(currentUser.role);
}

/**
 * Check if current user can cancel status keluar
 * @returns {boolean} True if user has permission
 */
function canCancelStatusKeluar() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (!currentUser || !currentUser.role) {
        return false;
    }
    
    // Only Admin and Super Admin can cancel status keluar
    const allowedRoles = ['admin', 'super_admin', 'administrator'];
    return allowedRoles.includes(currentUser.role);
}

/**
 * Check if current user can view laporan anggota keluar
 * @returns {boolean} True if user has permission
 */
function canViewLaporanAnggotaKeluar() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (!currentUser || !currentUser.role) {
        return false;
    }
    
    // All authenticated users can view reports (read-only)
    return true;
}

/**
 * Check if current user can export CSV
 * @returns {boolean} True if user has permission
 */
function canExportCSV() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (!currentUser || !currentUser.role) {
        return false;
    }
    
    // All authenticated users can export CSV
    return true;
}

/**
 * Get current user info
 * @returns {object} Current user object or null
 */
function getCurrentUser() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        return currentUser.id ? currentUser : null;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

// ===== Audit Logging =====

/**
 * Log anggota keluar action to audit trail
 * @param {string} action - Action type (MARK_KELUAR, PROSES_PENGEMBALIAN, CANCEL_KELUAR, etc.)
 * @param {object} details - Action details
 * @returns {boolean} Success status
 */
function logAnggotaKeluarAction(action, details) {
    try {
        const currentUser = getCurrentUser();
        
        if (!currentUser) {
            console.warn('Cannot log action: No current user');
            return false;
        }
        
        // Create audit log entry
        const auditLog = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            userId: currentUser.id,
            userName: currentUser.username || currentUser.nama || 'Unknown',
            userRole: currentUser.role || 'unknown',
            action: action,
            module: 'ANGGOTA_KELUAR',
            details: details,
            ipAddress: null, // Can be added if available
            userAgent: navigator.userAgent || null
        };
        
        // Get existing audit logs
        const auditLogs = JSON.parse(localStorage.getItem('auditLogsAnggotaKeluar') || '[]');
        
        // Add new log
        auditLogs.push(auditLog);
        
        // Save back to localStorage
        localStorage.setItem('auditLogsAnggotaKeluar', JSON.stringify(auditLogs));
        
        // Also log to console for debugging
        console.log('[AUDIT]', action, details);
        
        return true;
    } catch (error) {
        console.error('Error logging audit action:', error);
        return false;
    }
}

/**
 * Get audit logs for anggota keluar
 * @param {object} filters - Optional filters (userId, action, startDate, endDate)
 * @returns {array} Array of audit log entries
 */
function getAnggotaKeluarAuditLogs(filters = {}) {
    try {
        let auditLogs = JSON.parse(localStorage.getItem('auditLogsAnggotaKeluar') || '[]');
        
        // Apply filters
        if (filters.userId) {
            auditLogs = auditLogs.filter(log => log.userId === filters.userId);
        }
        
        if (filters.action) {
            auditLogs = auditLogs.filter(log => log.action === filters.action);
        }
        
        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            auditLogs = auditLogs.filter(log => new Date(log.timestamp) >= startDate);
        }
        
        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999);
            auditLogs = auditLogs.filter(log => new Date(log.timestamp) <= endDate);
        }
        
        // Sort by timestamp descending (newest first)
        auditLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return auditLogs;
    } catch (error) {
        console.error('Error getting audit logs:', error);
        return [];
    }
}

// ===== Input Sanitization =====

/**
 * Sanitize text input to prevent XSS attacks
 * @param {string} input - Raw input string
 * @returns {string} Sanitized string
 */
function sanitizeText(input) {
    if (typeof input !== 'string') {
        return '';
    }
    
    // Create a temporary div element
    const div = document.createElement('div');
    div.textContent = input;
    
    // Get the sanitized text
    let sanitized = div.innerHTML;
    
    // Additional sanitization: remove any remaining script tags
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
    
    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    return sanitized.trim();
}

/**
 * Validate and sanitize date input
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {object} Validation result with valid flag and sanitized date
 */
function validateDate(dateString) {
    if (!dateString || typeof dateString !== 'string') {
        return {
            valid: false,
            sanitized: null,
            error: 'Tanggal tidak valid'
        };
    }
    
    // Check format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
        return {
            valid: false,
            sanitized: null,
            error: 'Format tanggal harus YYYY-MM-DD'
        };
    }
    
    // Parse date
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
        return {
            valid: false,
            sanitized: null,
            error: 'Tanggal tidak valid'
        };
    }
    
    // Check if date is not in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date > today) {
        return {
            valid: false,
            sanitized: null,
            error: 'Tanggal tidak boleh di masa depan'
        };
    }
    
    return {
        valid: true,
        sanitized: dateString,
        error: null
    };
}

/**
 * Validate and sanitize numeric input
 * @param {any} input - Numeric input
 * @param {object} options - Validation options (min, max, allowNegative, allowDecimal)
 * @returns {object} Validation result with valid flag and sanitized number
 */
function validateNumber(input, options = {}) {
    const {
        min = null,
        max = null,
        allowNegative = false,
        allowDecimal = true
    } = options;
    
    // Convert to number
    const num = parseFloat(input);
    
    // Check if valid number
    if (isNaN(num)) {
        return {
            valid: false,
            sanitized: null,
            error: 'Input harus berupa angka'
        };
    }
    
    // Check negative
    if (!allowNegative && num < 0) {
        return {
            valid: false,
            sanitized: null,
            error: 'Angka tidak boleh negatif'
        };
    }
    
    // Check decimal
    if (!allowDecimal && num % 1 !== 0) {
        return {
            valid: false,
            sanitized: null,
            error: 'Angka harus bulat (tidak boleh desimal)'
        };
    }
    
    // Check min
    if (min !== null && num < min) {
        return {
            valid: false,
            sanitized: null,
            error: `Angka minimal ${min}`
        };
    }
    
    // Check max
    if (max !== null && num > max) {
        return {
            valid: false,
            sanitized: null,
            error: `Angka maksimal ${max}`
        };
    }
    
    return {
        valid: true,
        sanitized: num,
        error: null
    };
}

/**
 * Sanitize and validate anggota keluar form data
 * @param {object} formData - Raw form data
 * @returns {object} Validation result with valid flag, sanitized data, and errors
 */
function sanitizeAnggotaKeluarData(formData) {
    const errors = [];
    const sanitized = {};
    
    // Sanitize anggotaId
    if (!formData.anggotaId || typeof formData.anggotaId !== 'string') {
        errors.push({
            field: 'anggotaId',
            message: 'ID anggota tidak valid'
        });
    } else {
        sanitized.anggotaId = formData.anggotaId.trim();
    }
    
    // Validate and sanitize tanggalKeluar
    const dateValidation = validateDate(formData.tanggalKeluar);
    if (!dateValidation.valid) {
        errors.push({
            field: 'tanggalKeluar',
            message: dateValidation.error
        });
    } else {
        sanitized.tanggalKeluar = dateValidation.sanitized;
    }
    
    // Sanitize alasanKeluar
    if (!formData.alasanKeluar || typeof formData.alasanKeluar !== 'string') {
        errors.push({
            field: 'alasanKeluar',
            message: 'Alasan keluar harus diisi'
        });
    } else {
        const sanitizedAlasan = sanitizeText(formData.alasanKeluar);
        if (sanitizedAlasan.length < 10) {
            errors.push({
                field: 'alasanKeluar',
                message: 'Alasan keluar minimal 10 karakter'
            });
        } else {
            sanitized.alasanKeluar = sanitizedAlasan;
        }
    }
    
    return {
        valid: errors.length === 0,
        sanitized: sanitized,
        errors: errors
    };
}

/**
 * Sanitize and validate pengembalian form data
 * @param {object} formData - Raw form data
 * @returns {object} Validation result with valid flag, sanitized data, and errors
 */
function sanitizePengembalianData(formData) {
    const errors = [];
    const sanitized = {};
    
    // Sanitize anggotaId
    if (!formData.anggotaId || typeof formData.anggotaId !== 'string') {
        errors.push({
            field: 'anggotaId',
            message: 'ID anggota tidak valid'
        });
    } else {
        sanitized.anggotaId = formData.anggotaId.trim();
    }
    
    // Validate metodePembayaran
    const validMethods = ['Kas', 'Transfer Bank'];
    if (!formData.metodePembayaran || !validMethods.includes(formData.metodePembayaran)) {
        errors.push({
            field: 'metodePembayaran',
            message: 'Metode pembayaran tidak valid'
        });
    } else {
        sanitized.metodePembayaran = formData.metodePembayaran;
    }
    
    // Validate and sanitize tanggalPembayaran
    const dateValidation = validateDate(formData.tanggalPembayaran);
    if (!dateValidation.valid) {
        errors.push({
            field: 'tanggalPembayaran',
            message: dateValidation.error
        });
    } else {
        sanitized.tanggalPembayaran = dateValidation.sanitized;
    }
    
    // Sanitize keterangan (optional)
    if (formData.keterangan) {
        sanitized.keterangan = sanitizeText(formData.keterangan);
    } else {
        sanitized.keterangan = '';
    }
    
    return {
        valid: errors.length === 0,
        sanitized: sanitized,
        errors: errors
    };
}

/**
 * Check access and show error if denied
 * @param {string} permission - Permission to check (markKeluar, processPengembalian, etc.)
 * @returns {boolean} True if access granted
 */
function checkAccessOrDeny(permission) {
    let hasAccess = false;
    
    switch (permission) {
        case 'markKeluar':
            hasAccess = canMarkAnggotaKeluar();
            break;
        case 'processPengembalian':
            hasAccess = canProcessPengembalian();
            break;
        case 'cancelKeluar':
            hasAccess = canCancelStatusKeluar();
            break;
        case 'viewLaporan':
            hasAccess = canViewLaporanAnggotaKeluar();
            break;
        case 'exportCSV':
            hasAccess = canExportCSV();
            break;
        default:
            hasAccess = false;
    }
    
    if (!hasAccess) {
        const currentUser = getCurrentUser();
        const userRole = currentUser ? currentUser.role : 'tidak login';
        
        showToast(
            `Akses ditolak. Anda tidak memiliki izin untuk melakukan tindakan ini.<br>` +
            `<small>Role Anda: ${userRole}</small>`,
            'error',
            7000
        );
        
        // Log access denial
        logAnggotaKeluarAction('ACCESS_DENIED', {
            permission: permission,
            userRole: userRole,
            timestamp: new Date().toISOString()
        });
    }
    
    return hasAccess;
}
