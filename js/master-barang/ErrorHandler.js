/**
 * Master Barang Komprehensif - Error Handler
 * Comprehensive error handling and user experience improvements
 */

import { ERROR_MESSAGES } from './types.js';

export class ErrorHandler {
    constructor() {
        this.errorQueue = [];
        this.isProcessing = false;
        this.retryAttempts = new Map();
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second
        
        // Initialize error tracking
        this.errorStats = {
            total: 0,
            byType: {},
            byComponent: {},
            resolved: 0
        };
        
        // Bind methods
        this.handleError = this.handleError.bind(this);
        this.handleValidationError = this.handleValidationError.bind(this);
        this.handleNetworkError = this.handleNetworkError.bind(this);
        this.handleStorageError = this.handleStorageError.bind(this);
    }

    /**
     * Handle general errors with context
     * @param {Error|string} error - Error object or message
     * @param {Object} context - Error context
     * @returns {Object} Error handling result
     */
    handleError(error, context = {}) {
        const errorInfo = this.normalizeError(error, context);
        
        // Track error statistics
        this.trackError(errorInfo);
        
        // Determine error handling strategy
        const strategy = this.determineStrategy(errorInfo);
        
        // Execute error handling strategy
        return this.executeStrategy(errorInfo, strategy);
    }

    /**
     * Handle validation errors with field-specific feedback
     * @param {Object} validationResult - Validation result with errors
     * @param {string} formId - Form ID for targeting specific fields
     * @returns {Object} Validation error handling result
     */
    handleValidationError(validationResult, formId = null) {
        if (!validationResult || validationResult.isValid) {
            return { success: true };
        }

        const errors = validationResult.errors || [];
        const warnings = validationResult.warnings || [];
        
        // Clear previous validation states
        this.clearValidationStates(formId);
        
        // Display field-specific errors
        errors.forEach(error => {
            this.displayFieldError(error, formId);
        });
        
        // Display warnings
        warnings.forEach(warning => {
            this.displayFieldWarning(warning, formId);
        });
        
        // Show summary if multiple errors
        if (errors.length > 1) {
            this.showValidationSummary(errors, warnings);
        }
        
        // Focus on first error field
        this.focusFirstErrorField(formId);
        
        return {
            success: false,
            errorCount: errors.length,
            warningCount: warnings.length
        };
    }

    /**
     * Handle network-related errors with retry logic
     * @param {Error} error - Network error
     * @param {Function} retryFunction - Function to retry
     * @param {Object} context - Error context
     * @returns {Promise<Object>} Network error handling result
     */
    async handleNetworkError(error, retryFunction = null, context = {}) {
        const errorInfo = this.normalizeError(error, {
            ...context,
            type: 'network',
            retryable: true
        });
        
        // Check if we should retry
        if (retryFunction && this.shouldRetry(errorInfo)) {
            return await this.retryWithBackoff(retryFunction, errorInfo);
        }
        
        // Show network error message
        this.showNetworkErrorMessage(errorInfo);
        
        return {
            success: false,
            error: errorInfo,
            retryable: !!retryFunction
        };
    }

    /**
     * Handle storage-related errors
     * @param {Error} error - Storage error
     * @param {Object} context - Error context
     * @returns {Object} Storage error handling result
     */
    handleStorageError(error, context = {}) {
        const errorInfo = this.normalizeError(error, {
            ...context,
            type: 'storage'
        });
        
        // Check storage availability
        const storageStatus = this.checkStorageStatus();
        
        if (!storageStatus.available) {
            this.showStorageUnavailableMessage(storageStatus);
            return {
                success: false,
                error: errorInfo,
                storageStatus
            };
        }
        
        // Try to recover storage
        const recoveryResult = this.attemptStorageRecovery(errorInfo);
        
        if (!recoveryResult.success) {
            this.showStorageErrorMessage(errorInfo);
        }
        
        return {
            success: recoveryResult.success,
            error: errorInfo,
            recovery: recoveryResult
        };
    }

    /**
     * Normalize error into consistent format
     * @param {Error|string} error - Error to normalize
     * @param {Object} context - Additional context
     * @returns {Object} Normalized error info
     */
    normalizeError(error, context = {}) {
        let message, stack, name;
        
        if (error instanceof Error) {
            message = error.message;
            stack = error.stack;
            name = error.name;
        } else if (typeof error === 'string') {
            message = error;
            name = 'StringError';
        } else {
            message = 'Unknown error occurred';
            name = 'UnknownError';
        }
        
        return {
            message,
            stack,
            name,
            timestamp: Date.now(),
            id: this.generateErrorId(),
            context: {
                component: 'master-barang',
                ...context
            }
        };
    }

    /**
     * Determine error handling strategy
     * @param {Object} errorInfo - Normalized error info
     * @returns {string} Strategy name
     */
    determineStrategy(errorInfo) {
        const { context } = errorInfo;
        
        if (context.type === 'validation') {
            return 'validation';
        } else if (context.type === 'network') {
            return 'network';
        } else if (context.type === 'storage') {
            return 'storage';
        } else if (context.critical) {
            return 'critical';
        } else {
            return 'standard';
        }
    }

    /**
     * Execute error handling strategy
     * @param {Object} errorInfo - Error information
     * @param {string} strategy - Strategy to execute
     * @returns {Object} Strategy execution result
     */
    executeStrategy(errorInfo, strategy) {
        switch (strategy) {
            case 'validation':
                return this.executeValidationStrategy(errorInfo);
            case 'network':
                return this.executeNetworkStrategy(errorInfo);
            case 'storage':
                return this.executeStorageStrategy(errorInfo);
            case 'critical':
                return this.executeCriticalStrategy(errorInfo);
            default:
                return this.executeStandardStrategy(errorInfo);
        }
    }

    /**
     * Execute validation error strategy
     * @param {Object} errorInfo - Error information
     * @returns {Object} Strategy result
     */
    executeValidationStrategy(errorInfo) {
        this.showValidationError(errorInfo.message);
        return {
            success: false,
            strategy: 'validation',
            userNotified: true
        };
    }

    /**
     * Execute network error strategy
     * @param {Object} errorInfo - Error information
     * @returns {Object} Strategy result
     */
    executeNetworkStrategy(errorInfo) {
        this.showNetworkErrorMessage(errorInfo);
        return {
            success: false,
            strategy: 'network',
            retryable: true,
            userNotified: true
        };
    }

    /**
     * Execute storage error strategy
     * @param {Object} errorInfo - Error information
     * @returns {Object} Strategy result
     */
    executeStorageStrategy(errorInfo) {
        const recovery = this.attemptStorageRecovery(errorInfo);
        if (!recovery.success) {
            this.showStorageErrorMessage(errorInfo);
        }
        return {
            success: recovery.success,
            strategy: 'storage',
            recovery,
            userNotified: true
        };
    }

    /**
     * Execute critical error strategy
     * @param {Object} errorInfo - Error information
     * @returns {Object} Strategy result
     */
    executeCriticalStrategy(errorInfo) {
        this.showCriticalErrorMessage(errorInfo);
        this.logCriticalError(errorInfo);
        return {
            success: false,
            strategy: 'critical',
            requiresAttention: true,
            userNotified: true
        };
    }

    /**
     * Execute standard error strategy
     * @param {Object} errorInfo - Error information
     * @returns {Object} Strategy result
     */
    executeStandardStrategy(errorInfo) {
        this.showStandardErrorMessage(errorInfo);
        return {
            success: false,
            strategy: 'standard',
            userNotified: true
        };
    }

    /**
     * Show validation error with field highlighting
     * @param {string} message - Error message
     */
    showValidationError(message) {
        this.showUserMessage('error', message, {
            icon: 'fas fa-exclamation-triangle',
            dismissible: true,
            timeout: 8000
        });
    }

    /**
     * Show network error message
     * @param {Object} errorInfo - Error information
     */
    showNetworkErrorMessage(errorInfo) {
        const message = this.getNetworkErrorMessage(errorInfo);
        this.showUserMessage('warning', message, {
            icon: 'fas fa-wifi',
            dismissible: true,
            timeout: 10000,
            actions: [{
                text: 'Coba Lagi',
                action: () => this.retryLastOperation(errorInfo)
            }]
        });
    }

    /**
     * Show storage error message
     * @param {Object} errorInfo - Error information
     */
    showStorageErrorMessage(errorInfo) {
        const message = 'Terjadi masalah dengan penyimpanan data. Silakan refresh halaman atau hubungi administrator.';
        this.showUserMessage('danger', message, {
            icon: 'fas fa-database',
            dismissible: true,
            timeout: 15000,
            actions: [{
                text: 'Refresh Halaman',
                action: () => window.location.reload()
            }]
        });
    }

    /**
     * Show critical error message
     * @param {Object} errorInfo - Error information
     */
    showCriticalErrorMessage(errorInfo) {
        const message = 'Terjadi kesalahan sistem yang serius. Silakan hubungi administrator.';
        this.showUserMessage('danger', message, {
            icon: 'fas fa-exclamation-circle',
            dismissible: false,
            persistent: true,
            actions: [{
                text: 'Laporkan Masalah',
                action: () => this.reportError(errorInfo)
            }]
        });
    }

    /**
     * Show standard error message
     * @param {Object} errorInfo - Error information
     */
    showStandardErrorMessage(errorInfo) {
        const message = errorInfo.message || 'Terjadi kesalahan yang tidak terduga.';
        this.showUserMessage('warning', message, {
            icon: 'fas fa-info-circle',
            dismissible: true,
            timeout: 6000
        });
    }

    /**
     * Show user message with options
     * @param {string} type - Message type (success, info, warning, danger)
     * @param {string} message - Message text
     * @param {Object} options - Display options
     */
    showUserMessage(type, message, options = {}) {
        const {
            icon = null,
            dismissible = true,
            timeout = 5000,
            persistent = false,
            actions = []
        } = options;

        // Use existing showAlert function if available, otherwise create our own
        if (typeof window.showAlert === 'function') {
            window.showAlert(type, message);
        } else {
            this.createAndShowAlert(type, message, { icon, dismissible, timeout, persistent, actions });
        }
    }

    /**
     * Create and show custom alert
     * @param {string} type - Alert type
     * @param {string} message - Message text
     * @param {Object} options - Alert options
     */
    createAndShowAlert(type, message, options = {}) {
        const {
            icon = null,
            dismissible = true,
            timeout = 5000,
            persistent = false,
            actions = []
        } = options;

        const alertContainer = document.getElementById('alert-container') || document.body;
        const alertId = 'error-alert-' + Date.now();
        
        let iconHtml = '';
        if (icon) {
            iconHtml = `<i class="${icon} me-2"></i>`;
        }
        
        let actionsHtml = '';
        if (actions.length > 0) {
            actionsHtml = '<div class="mt-2">';
            actions.forEach((action, index) => {
                actionsHtml += `<button type="button" class="btn btn-sm btn-outline-${type} me-2" onclick="window.errorHandler.executeAction('${alertId}', ${index})">${action.text}</button>`;
            });
            actionsHtml += '</div>';
        }
        
        const dismissButton = dismissible ? 
            '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>' : '';
        
        const alertHtml = `
            <div id="${alertId}" class="alert alert-${type} ${dismissible ? 'alert-dismissible' : ''} fade show" role="alert">
                ${iconHtml}${message}
                ${actionsHtml}
                ${dismissButton}
            </div>
        `;
        
        alertContainer.insertAdjacentHTML('beforeend', alertHtml);
        
        // Store actions for later execution
        if (actions.length > 0) {
            this.alertActions = this.alertActions || {};
            this.alertActions[alertId] = actions;
        }
        
        // Auto-dismiss if not persistent
        if (!persistent && timeout > 0) {
            setTimeout(() => {
                const alert = document.getElementById(alertId);
                if (alert && typeof bootstrap !== 'undefined') {
                    const bsAlert = new bootstrap.Alert(alert);
                    bsAlert.close();
                }
            }, timeout);
        }
    }

    /**
     * Execute alert action
     * @param {string} alertId - Alert ID
     * @param {number} actionIndex - Action index
     */
    executeAction(alertId, actionIndex) {
        if (this.alertActions && this.alertActions[alertId] && this.alertActions[alertId][actionIndex]) {
            const action = this.alertActions[alertId][actionIndex];
            if (typeof action.action === 'function') {
                action.action();
            }
        }
    }

    /**
     * Clear validation states from form
     * @param {string} formId - Form ID
     */
    clearValidationStates(formId) {
        const form = formId ? document.getElementById(formId) : document;
        if (!form) return;
        
        // Remove validation classes
        const inputs = form.querySelectorAll('.is-invalid, .is-valid');
        inputs.forEach(input => {
            input.classList.remove('is-invalid', 'is-valid');
        });
        
        // Clear error messages
        const errorMessages = form.querySelectorAll('.invalid-feedback, .valid-feedback');
        errorMessages.forEach(msg => {
            if (msg.remove) {
                msg.remove();
            } else if (msg.parentNode) {
                msg.parentNode.removeChild(msg);
            }
        });
    }

    /**
     * Display field-specific error
     * @param {string} error - Error message
     * @param {string} formId - Form ID
     */
    displayFieldError(error, formId) {
        // Extract field name from error message if possible
        const fieldName = this.extractFieldName(error);
        if (!fieldName) return;
        
        const form = formId ? document.getElementById(formId) : document;
        if (!form) return;
        
        const field = form.querySelector(`[name="${fieldName}"], #${fieldName}`);
        if (!field) return;
        
        // Add invalid class
        field.classList.add('is-invalid');
        field.classList.remove('is-valid');
        
        // Add error message
        const existingFeedback = field.parentNode.querySelector('.invalid-feedback');
        if (existingFeedback) {
            existingFeedback.textContent = error;
        } else {
            const feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            feedback.textContent = error;
            field.parentNode.appendChild(feedback);
        }
    }

    /**
     * Display field-specific warning
     * @param {string} warning - Warning message
     * @param {string} formId - Form ID
     */
    displayFieldWarning(warning, formId) {
        // Similar to displayFieldError but with warning styling
        const fieldName = this.extractFieldName(warning);
        if (!fieldName) return;
        
        const form = formId ? document.getElementById(formId) : document;
        if (!form) return;
        
        const field = form.querySelector(`[name="${fieldName}"], #${fieldName}`);
        if (!field) return;
        
        // Add warning class (custom)
        field.classList.add('is-warning');
        
        // Add warning message
        const feedback = document.createElement('div');
        feedback.className = 'warning-feedback text-warning small';
        feedback.innerHTML = `<i class="fas fa-exclamation-triangle me-1"></i>${warning}`;
        field.parentNode.appendChild(feedback);
    }

    /**
     * Show validation summary
     * @param {Array} errors - Array of errors
     * @param {Array} warnings - Array of warnings
     */
    showValidationSummary(errors, warnings) {
        const totalIssues = errors.length + warnings.length;
        const message = `Ditemukan ${errors.length} kesalahan${warnings.length > 0 ? ` dan ${warnings.length} peringatan` : ''} pada form.`;
        
        this.showUserMessage('warning', message, {
            icon: 'fas fa-list-ul',
            dismissible: true,
            timeout: 10000
        });
    }

    /**
     * Focus on first error field
     * @param {string} formId - Form ID
     */
    focusFirstErrorField(formId) {
        const form = formId ? document.getElementById(formId) : document;
        if (!form) return;
        
        const firstErrorField = form.querySelector('.is-invalid');
        if (firstErrorField) {
            firstErrorField.focus();
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    /**
     * Extract field name from error message
     * @param {string} error - Error message
     * @returns {string|null} Field name
     */
    extractFieldName(error) {
        // Try to extract field name from common error patterns
        const patterns = [
            /^(\w+)\s+/,  // "fieldname is required"
            /\((\w+)\)$/  // "Error message (fieldname)"
        ];
        
        for (const pattern of patterns) {
            const match = error.match(pattern);
            if (match) {
                return match[1].toLowerCase();
            }
        }
        
        return null;
    }

    /**
     * Check if error should be retried
     * @param {Object} errorInfo - Error information
     * @returns {boolean} Should retry
     */
    shouldRetry(errorInfo) {
        const attempts = this.retryAttempts.get(errorInfo.id) || 0;
        return attempts < this.maxRetries && errorInfo.context.retryable;
    }

    /**
     * Retry operation with exponential backoff
     * @param {Function} operation - Operation to retry
     * @param {Object} errorInfo - Error information
     * @returns {Promise<Object>} Retry result
     */
    async retryWithBackoff(operation, errorInfo) {
        const attempts = this.retryAttempts.get(errorInfo.id) || 0;
        this.retryAttempts.set(errorInfo.id, attempts + 1);
        
        const delay = this.retryDelay * Math.pow(2, attempts);
        
        // Show retry message
        this.showUserMessage('info', `Mencoba lagi dalam ${delay / 1000} detik...`, {
            icon: 'fas fa-redo',
            timeout: delay
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        try {
            const result = await operation();
            this.retryAttempts.delete(errorInfo.id);
            return { success: true, result };
        } catch (error) {
            if (this.shouldRetry(errorInfo)) {
                return await this.retryWithBackoff(operation, errorInfo);
            } else {
                return { success: false, error };
            }
        }
    }

    /**
     * Check storage status
     * @returns {Object} Storage status
     */
    checkStorageStatus() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            
            return {
                available: true,
                type: 'localStorage',
                quota: this.getStorageQuota()
            };
        } catch (error) {
            return {
                available: false,
                error: error.message,
                fallback: 'memory'
            };
        }
    }

    /**
     * Get storage quota information
     * @returns {Object} Quota information
     */
    getStorageQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            return navigator.storage.estimate();
        }
        return null;
    }

    /**
     * Attempt storage recovery
     * @param {Object} errorInfo - Error information
     * @returns {Object} Recovery result
     */
    attemptStorageRecovery(errorInfo) {
        try {
            // Try to clear some space
            this.clearOldData();
            
            // Test storage again
            const status = this.checkStorageStatus();
            
            return {
                success: status.available,
                method: 'cleanup',
                status
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Clear old data to free storage space
     */
    clearOldData() {
        const keys = Object.keys(localStorage);
        const oldDataKeys = keys.filter(key => {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                if (data && data.timestamp) {
                    const age = Date.now() - data.timestamp;
                    return age > 7 * 24 * 60 * 60 * 1000; // 7 days
                }
            } catch (e) {
                // Invalid JSON, might be old data
                return true;
            }
            return false;
        });
        
        oldDataKeys.forEach(key => {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                // Ignore removal errors
            }
        });
    }

    /**
     * Get network error message
     * @param {Object} errorInfo - Error information
     * @returns {string} User-friendly message
     */
    getNetworkErrorMessage(errorInfo) {
        const { message } = errorInfo;
        
        if (message.includes('fetch')) {
            return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
        } else if (message.includes('timeout')) {
            return 'Koneksi timeout. Server mungkin sedang sibuk.';
        } else if (message.includes('404')) {
            return 'Data yang diminta tidak ditemukan.';
        } else if (message.includes('500')) {
            return 'Terjadi kesalahan pada server. Silakan coba lagi nanti.';
        } else {
            return 'Terjadi masalah jaringan. Silakan periksa koneksi Anda.';
        }
    }

    /**
     * Track error for statistics
     * @param {Object} errorInfo - Error information
     */
    trackError(errorInfo) {
        this.errorStats.total++;
        
        const type = errorInfo.context.type || 'unknown';
        this.errorStats.byType[type] = (this.errorStats.byType[type] || 0) + 1;
        
        const component = errorInfo.context.component || 'unknown';
        this.errorStats.byComponent[component] = (this.errorStats.byComponent[component] || 0) + 1;
    }

    /**
     * Generate unique error ID
     * @returns {string} Error ID
     */
    generateErrorId() {
        return 'err_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Log critical error
     * @param {Object} errorInfo - Error information
     */
    logCriticalError(errorInfo) {
        console.error('CRITICAL ERROR:', errorInfo);
        
        // Could send to external logging service
        if (window.errorReporting) {
            window.errorReporting.logError(errorInfo);
        }
    }

    /**
     * Report error to support
     * @param {Object} errorInfo - Error information
     */
    reportError(errorInfo) {
        const reportData = {
            error: errorInfo,
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            stats: this.errorStats
        };
        
        // Could open support form or send to support system
        console.log('Error report:', reportData);
        
        this.showUserMessage('info', 'Laporan kesalahan telah disiapkan. Silakan hubungi administrator dengan informasi ini.', {
            icon: 'fas fa-paper-plane',
            timeout: 8000
        });
    }

    /**
     * Get error statistics
     * @returns {Object} Error statistics
     */
    getErrorStats() {
        return { ...this.errorStats };
    }

    /**
     * Reset error statistics
     */
    resetErrorStats() {
        this.errorStats = {
            total: 0,
            byType: {},
            byComponent: {},
            resolved: 0
        };
    }
}

// Make ErrorHandler available globally
if (typeof window !== 'undefined') {
    window.ErrorHandler = ErrorHandler;
}