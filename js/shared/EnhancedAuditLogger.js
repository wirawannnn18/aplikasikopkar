/**
 * Enhanced Audit Logger with Mode Tracking
 * Requirements: 6.3, 8.3 - Enhanced audit logging for mode tracking
 * 
 * Provides backward-compatible audit logging with enhanced mode tracking capabilities
 */

/**
 * Enhanced Audit Logger Class
 * Extends existing audit logging with mode tracking and enhanced features
 */
class EnhancedAuditLogger {
    constructor() {
        this.currentUser = this._initializeUserContext();
        this._sessionId = null;
    }

    /**
     * Enhanced audit logging with mode tracking (backward compatible)
     * Requirements: 6.3, 8.3
     * @param {string} action - Action type
     * @param {Object} details - Action details
     * @param {string} mode - Payment mode ('manual' or 'import') - optional for backward compatibility
     * @param {string} module - Module name - optional
     */
    saveAuditLog(action, details, mode = null, module = null) {
        try {
            const logEntry = {
                id: this._generateId(),
                timestamp: new Date().toISOString(),
                userId: this.currentUser?.id || '',
                userName: this.currentUser?.nama || '',
                action: action,
                details: {
                    ...details,
                    // Enhanced tracking fields
                    mode: mode || details.mode || 'unknown',
                    sessionId: this._getSessionId(),
                    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
                    ipAddress: this._getClientIP(),
                    timestamp: new Date().toISOString()
                },
                module: module || details.module || 'unknown',
                // New fields for enhanced tracking
                mode: mode || details.mode || 'unknown',
                sessionId: this._getSessionId(),
                version: '2.0' // Version to distinguish enhanced logs
            };
            
            // Save to localStorage
            this._saveToStorage(logEntry);
            
            // Also call original saveAuditLog if available for backward compatibility
            if (typeof window.saveAuditLog === 'function' && window.saveAuditLog !== this.saveAuditLog) {
                window.saveAuditLog(action, details);
            }
            
        } catch (error) {
            console.error('Error saving enhanced audit log:', error);
            // Fallback to basic logging
            this._fallbackAuditLog(action, details, mode);
        }
    }

    /**
     * Log payment transaction with mode tracking
     * Requirements: 6.3, 8.3
     * @param {string} action - Action type
     * @param {Object} transactionData - Transaction data
     * @param {string} mode - Payment mode
     */
    logPaymentTransaction(action, transactionData, mode) {
        const enhancedDetails = {
            ...transactionData,
            paymentMode: mode,
            transactionType: 'payment',
            amount: transactionData.jumlah,
            memberInfo: {
                id: transactionData.anggotaId,
                name: transactionData.anggotaNama,
                nik: transactionData.anggotaNIK
            }
        };
        
        this.saveAuditLog(action, enhancedDetails, mode, 'payment-system');
    }

    /**
     * Log batch processing with detailed tracking
     * Requirements: 6.3, 8.3
     * @param {string} action - Action type
     * @param {Object} batchData - Batch processing data
     * @param {string} mode - Processing mode (should be 'import')
     */
    logBatchProcessing(action, batchData, mode = 'import') {
        const enhancedDetails = {
            ...batchData,
            batchMode: mode,
            processingType: 'batch',
            batchSize: batchData.total || batchData.length || 0,
            successRate: batchData.successful && batchData.total 
                ? (batchData.successful / batchData.total * 100).toFixed(2) + '%'
                : 'N/A'
        };
        
        this.saveAuditLog(action, enhancedDetails, mode, 'batch-processor');
    }

    /**
     * Log journal entry creation with mode tracking
     * Requirements: 6.3, 8.3
     * @param {string} jurnalId - Journal ID
     * @param {Object} transactionData - Transaction data
     * @param {string} mode - Payment mode
     */
    logJournalCreation(jurnalId, transactionData, mode) {
        const enhancedDetails = {
            jurnalId,
            transactionId: transactionData.id,
            paymentType: transactionData.jenis,
            amount: transactionData.jumlah,
            memberName: transactionData.anggotaNama,
            journalMode: mode,
            accountingPeriod: new Date().toISOString().slice(0, 7) // YYYY-MM
        };
        
        this.saveAuditLog('JOURNAL_CREATED', enhancedDetails, mode, 'accounting-system');
    }

    /**
     * Log saldo update with mode tracking
     * Requirements: 6.3, 8.3
     * @param {string} anggotaId - Member ID
     * @param {string} jenis - Payment type
     * @param {number} amount - Amount
     * @param {number} saldoSebelum - Balance before
     * @param {number} saldoSesudah - Balance after
     * @param {string} mode - Payment mode
     */
    logSaldoUpdate(anggotaId, jenis, amount, saldoSebelum, saldoSesudah, mode) {
        const enhancedDetails = {
            anggotaId,
            paymentType: jenis,
            amount,
            balanceChange: {
                before: saldoSebelum,
                after: saldoSesudah,
                difference: saldoSebelum - saldoSesudah
            },
            saldoMode: mode
        };
        
        this.saveAuditLog(`SALDO_${jenis.toUpperCase()}_UPDATED`, enhancedDetails, mode, 'saldo-management');
    }

    /**
     * Log tab switching in integrated interface
     * Requirements: 6.3, 8.3
     * @param {string} fromTab - Previous tab
     * @param {string} toTab - New tab
     * @param {Object} context - Additional context
     */
    logTabSwitch(fromTab, toTab, context = {}) {
        const enhancedDetails = {
            navigation: {
                from: fromTab,
                to: toTab,
                timestamp: new Date().toISOString()
            },
            context,
            interfaceMode: 'integrated'
        };
        
        this.saveAuditLog('TAB_SWITCH', enhancedDetails, 'integrated', 'ui-navigation');
    }

    /**
     * Log user access attempts with enhanced security tracking
     * Requirements: 8.3
     * @param {string} action - Access action
     * @param {Object} accessDetails - Access details
     * @param {string} result - Access result ('granted' or 'denied')
     */
    logAccessAttempt(action, accessDetails, result) {
        const enhancedDetails = {
            ...accessDetails,
            accessResult: result,
            securityLevel: 'access-control',
            riskLevel: result === 'denied' ? 'medium' : 'low'
        };
        
        this.saveAuditLog(`ACCESS_${result.toUpperCase()}`, enhancedDetails, null, 'security');
    }

    /**
     * Log error events with enhanced error tracking
     * Requirements: 6.3, 8.3
     * @param {string} errorType - Type of error
     * @param {Error} error - Error object
     * @param {Object} context - Error context
     * @param {string} mode - Mode when error occurred
     */
    logError(errorType, error, context = {}, mode = null) {
        const enhancedDetails = {
            errorType,
            errorMessage: error.message,
            errorStack: error.stack,
            context,
            errorMode: mode,
            severity: this._determineSeverity(errorType, error),
            timestamp: new Date().toISOString()
        };
        
        this.saveAuditLog(`ERROR_${errorType.toUpperCase()}`, enhancedDetails, mode, 'error-tracking');
    }

    /**
     * Get audit logs with enhanced filtering
     * Requirements: 8.3
     * @param {Object} filters - Filter options
     * @returns {Array} Filtered audit logs
     */
    getAuditLogs(filters = {}) {
        try {
            const auditLog = JSON.parse(localStorage.getItem('auditLog') || '[]');
            
            let filteredLogs = auditLog;
            
            // Filter by mode
            if (filters.mode) {
                filteredLogs = filteredLogs.filter(log => 
                    log.mode === filters.mode || 
                    log.details?.mode === filters.mode ||
                    log.details?.paymentMode === filters.mode
                );
            }
            
            // Filter by module
            if (filters.module) {
                filteredLogs = filteredLogs.filter(log => log.module === filters.module);
            }
            
            // Filter by action
            if (filters.action) {
                filteredLogs = filteredLogs.filter(log => 
                    log.action.toLowerCase().includes(filters.action.toLowerCase())
                );
            }
            
            // Filter by date range
            if (filters.dateFrom) {
                filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.dateFrom);
            }
            
            if (filters.dateTo) {
                filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.dateTo);
            }
            
            // Filter by user
            if (filters.userId) {
                filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
            }
            
            // Sort by timestamp descending
            filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            return filteredLogs;
            
        } catch (error) {
            console.error('Error getting audit logs:', error);
            return [];
        }
    }

    /**
     * Export audit logs for reporting
     * Requirements: 8.3
     * @param {Object} filters - Filter options
     * @param {string} format - Export format ('json' or 'csv')
     * @returns {string} Exported data
     */
    exportAuditLogs(filters = {}, format = 'json') {
        try {
            const logs = this.getAuditLogs(filters);
            
            if (format === 'csv') {
                return this._exportToCSV(logs);
            } else {
                return JSON.stringify(logs, null, 2);
            }
            
        } catch (error) {
            console.error('Error exporting audit logs:', error);
            return '';
        }
    }

    // ===== PRIVATE HELPER METHODS =====

    /**
     * Initialize user context
     * @private
     */
    _initializeUserContext() {
        if (typeof localStorage !== 'undefined') {
            try {
                const currentUser = localStorage.getItem('currentUser');
                if (currentUser) {
                    return JSON.parse(currentUser);
                }
            } catch (error) {
                console.warn('Failed to initialize user context:', error);
            }
        }
        return null;
    }

    /**
     * Save audit log to storage
     * @private
     */
    _saveToStorage(logEntry) {
        try {
            const auditLog = JSON.parse(localStorage.getItem('auditLog') || '[]');
            auditLog.push(logEntry);
            
            // Keep only last 10000 entries to prevent storage overflow
            if (auditLog.length > 10000) {
                auditLog.splice(0, auditLog.length - 10000);
            }
            
            localStorage.setItem('auditLog', JSON.stringify(auditLog));
        } catch (error) {
            console.error('Failed to save audit log to storage:', error);
        }
    }

    /**
     * Fallback audit logging
     * @private
     */
    _fallbackAuditLog(action, details, mode) {
        try {
            const basicEntry = {
                id: this._generateId(),
                timestamp: new Date().toISOString(),
                action,
                details,
                mode: mode || 'unknown',
                fallback: true
            };
            
            const auditLog = JSON.parse(localStorage.getItem('auditLog') || '[]');
            auditLog.push(basicEntry);
            localStorage.setItem('auditLog', JSON.stringify(auditLog));
        } catch (error) {
            console.error('Fallback audit logging failed:', error);
        }
    }

    /**
     * Determine error severity
     * @private
     */
    _determineSeverity(errorType, error) {
        const criticalErrors = ['PAYMENT_ERROR', 'JOURNAL_ERROR', 'SALDO_ERROR', 'BATCH_ERROR'];
        const warningErrors = ['VALIDATION_ERROR', 'ACCESS_DENIED', 'SESSION_ERROR'];
        
        if (criticalErrors.some(type => errorType.includes(type))) {
            return 'critical';
        } else if (warningErrors.some(type => errorType.includes(type))) {
            return 'warning';
        } else {
            return 'info';
        }
    }

    /**
     * Export logs to CSV format
     * @private
     */
    _exportToCSV(logs) {
        if (logs.length === 0) return '';
        
        const headers = ['Timestamp', 'User', 'Action', 'Mode', 'Module', 'Details'];
        const csvRows = [headers.join(',')];
        
        logs.forEach(log => {
            const row = [
                log.timestamp,
                log.userName || log.userId,
                log.action,
                log.mode || 'unknown',
                log.module || 'unknown',
                JSON.stringify(log.details).replace(/"/g, '""')
            ];
            csvRows.push(row.map(field => `"${field}"`).join(','));
        });
        
        return csvRows.join('\n');
    }

    /**
     * Get client IP address (best effort)
     * @private
     */
    _getClientIP() {
        // This is a placeholder - in a real application, you'd get this from the server
        return 'client-side-unknown';
    }

    /**
     * Generate unique ID
     * @private
     */
    _generateId() {
        if (typeof window !== 'undefined' && typeof window.generateId === 'function') {
            return window.generateId();
        }
        
        return `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    /**
     * Get session ID
     * @private
     */
    _getSessionId() {
        if (!this._sessionId) {
            this._sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        }
        return this._sessionId;
    }
}

/**
 * Enhanced saveAuditLog function with backward compatibility
 * Requirements: 6.3, 8.3 - Ensure backward compatibility with existing logs
 * @param {string} action - Action type
 * @param {Object} details - Action details
 * @param {string} mode - Payment mode (optional for backward compatibility)
 * @param {string} module - Module name (optional)
 */
function saveAuditLogEnhanced(action, details, mode = null, module = null) {
    // Create enhanced logger instance if not exists
    if (!window._enhancedAuditLogger) {
        window._enhancedAuditLogger = new EnhancedAuditLogger();
    }
    
    // Use enhanced logging
    window._enhancedAuditLogger.saveAuditLog(action, details, mode, module);
}

/**
 * Update existing audit functions to accept mode parameter
 * Requirements: 6.3, 8.3 - Update existing audit functions to accept mode parameter
 */
function updateExistingAuditFunctions() {
    // Store original function if it exists
    if (typeof window.saveAuditLog === 'function' && !window._originalSaveAuditLog) {
        window._originalSaveAuditLog = window.saveAuditLog;
    }
    
    // Replace with enhanced version
    window.saveAuditLog = function(action, details, mode = null, module = null) {
        // Call enhanced version
        saveAuditLogEnhanced(action, details, mode, module);
        
        // Also call original for backward compatibility if it exists and is different
        if (window._originalSaveAuditLog && window._originalSaveAuditLog !== window.saveAuditLog) {
            try {
                window._originalSaveAuditLog(action, details);
            } catch (error) {
                console.warn('Original audit log function failed:', error);
            }
        }
    };
}

// Initialize enhanced audit logging
if (typeof window !== 'undefined') {
    // Export classes and functions
    window.EnhancedAuditLogger = EnhancedAuditLogger;
    window.saveAuditLogEnhanced = saveAuditLogEnhanced;
    
    // Update existing functions
    updateExistingAuditFunctions();
    
    // Create global enhanced logger instance
    window._enhancedAuditLogger = new EnhancedAuditLogger();
}

// ES6 export for modern environments
export { EnhancedAuditLogger, saveAuditLogEnhanced };

// CommonJS export for compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EnhancedAuditLogger, saveAuditLogEnhanced };
}