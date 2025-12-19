/**
 * Audit Logger - Comprehensive audit logging system for import tagihan pembayaran
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 * 
 * This class handles all audit logging for the import tagihan feature including:
 * - File upload logging with metadata
 * - Validation results and processing steps
 * - Individual transactions and batch results
 * - Error logging for troubleshooting
 */

/**
 * Audit Logger class for comprehensive import tagihan audit trail
 * Logs all activities for tracking and compliance purposes
 */
class AuditLogger {
    constructor() {
        this.logStorage = 'import_tagihan_audit_logs';
        this.maxLogEntries = 10000; // Maximum number of log entries to keep
        this.logLevel = 'INFO'; // LOG_LEVEL: DEBUG, INFO, WARN, ERROR
        this.sessionId = this._generateSessionId();
        
        // Initialize storage if not exists
        this._initializeStorage();
    }

    /**
     * Log file upload with metadata
     * Requirements: 7.1
     * @param {Object} uploadData - Upload information
     * @param {string} uploadData.fileName - Original filename
     * @param {number} uploadData.fileSize - File size in bytes
     * @param {string} uploadData.fileType - File MIME type
     * @param {string} uploadData.userId - User who uploaded
     * @param {string} uploadData.userName - User name
     * @param {string} [uploadData.batchId] - Generated batch ID
     * @param {Object} [uploadData.metadata] - Additional metadata
     */
    logFileUpload(uploadData) {
        const logEntry = {
            id: this._generateLogId(),
            action: 'FILE_UPLOAD',
            category: 'UPLOAD',
            userId: uploadData.userId,
            userName: uploadData.userName,
            timestamp: new Date(),
            sessionId: this.sessionId,
            batchId: uploadData.batchId || null,
            details: {
                fileName: uploadData.fileName,
                fileSize: uploadData.fileSize,
                fileType: uploadData.fileType,
                fileSizeFormatted: this._formatFileSize(uploadData.fileSize),
                metadata: uploadData.metadata || {}
            },
            level: 'INFO'
        };

        this._writeLog(logEntry);
        console.log(`[AUDIT] File uploaded: ${uploadData.fileName} (${logEntry.details.fileSizeFormatted}) by ${uploadData.userName}`);
    }

    /**
     * Log validation results and processing steps
     * Requirements: 7.2
     * @param {Object} validationData - Validation information
     * @param {string} validationData.batchId - Batch identifier
     * @param {number} validationData.totalRows - Total rows processed
     * @param {number} validationData.validRows - Number of valid rows
     * @param {number} validationData.invalidRows - Number of invalid rows
     * @param {Array} validationData.errorSummary - Summary of validation errors
     * @param {string} validationData.userId - User performing validation
     * @param {string} validationData.userName - User name
     * @param {number} [validationData.processingTimeMs] - Processing time in milliseconds
     */
    logValidationResults(validationData) {
        const logEntry = {
            id: this._generateLogId(),
            action: 'VALIDATION_COMPLETED',
            category: 'VALIDATION',
            userId: validationData.userId,
            userName: validationData.userName,
            timestamp: new Date(),
            sessionId: this.sessionId,
            batchId: validationData.batchId,
            details: {
                totalRows: validationData.totalRows,
                validRows: validationData.validRows,
                invalidRows: validationData.invalidRows,
                validPercentage: ((validationData.validRows / validationData.totalRows) * 100).toFixed(2),
                errorSummary: validationData.errorSummary || [],
                processingTimeMs: validationData.processingTimeMs || null,
                processingTimeFormatted: validationData.processingTimeMs ? `${validationData.processingTimeMs}ms` : null
            },
            level: validationData.invalidRows > 0 ? 'WARN' : 'INFO'
        };

        this._writeLog(logEntry);
        console.log(`[AUDIT] Validation completed for batch ${validationData.batchId}: ${validationData.validRows}/${validationData.totalRows} valid rows`);
    }

    /**
     * Log individual transaction processing
     * Requirements: 7.3
     * @param {string} batchId - Batch identifier
     * @param {Object} transaction - Transaction data
     * @param {string} status - Transaction status ('success' or 'failed')
     * @param {string} [errorMessage] - Error message if failed
     */
    logBatchTransaction(batchId, transaction, status, errorMessage = null) {
        const logEntry = {
            id: this._generateLogId(),
            action: 'TRANSACTION_PROCESSED',
            category: 'TRANSACTION',
            userId: transaction.kasirId || 'system',
            userName: transaction.kasirNama || 'System',
            timestamp: new Date(),
            sessionId: this.sessionId,
            batchId: batchId,
            transactionId: transaction.id || null,
            details: {
                memberNumber: transaction.anggotaNIK || transaction.memberNumber,
                memberName: transaction.anggotaNama || transaction.memberName,
                paymentType: transaction.jenis || transaction.paymentType,
                amount: transaction.jumlah || transaction.amount,
                formattedAmount: this._formatCurrency(transaction.jumlah || transaction.amount),
                status: status,
                errorMessage: errorMessage,
                balanceBefore: transaction.saldoSebelum || null,
                balanceAfter: transaction.saldoSesudah || null,
                description: transaction.keterangan || transaction.description
            },
            level: status === 'success' ? 'INFO' : 'ERROR'
        };

        this._writeLog(logEntry);
        
        if (status === 'success') {
            console.log(`[AUDIT] Transaction processed: ${transaction.anggotaNama || transaction.memberName} - ${logEntry.details.formattedAmount}`);
        } else {
            console.error(`[AUDIT] Transaction failed: ${transaction.anggotaNama || transaction.memberName} - ${errorMessage}`);
        }
    }

    /**
     * Log batch processing completion
     * Requirements: 7.4
     * @param {string} batchId - Batch identifier
     * @param {Object} results - Processing results
     * @param {Date} startTime - Processing start time
     */
    logBatchCompletion(batchId, results, startTime) {
        const endTime = new Date();
        const processingTimeMs = endTime.getTime() - startTime.getTime();
        
        const logEntry = {
            id: this._generateLogId(),
            action: 'BATCH_COMPLETED',
            category: 'BATCH',
            userId: results.userId || 'system',
            userName: results.userName || 'System',
            timestamp: endTime,
            sessionId: this.sessionId,
            batchId: batchId,
            details: {
                totalProcessed: results.totalProcessed,
                successCount: results.successCount,
                failureCount: results.failureCount,
                successRate: ((results.successCount / results.totalProcessed) * 100).toFixed(2),
                totalAmount: results.summary?.totalAmount || 0,
                totalHutang: results.summary?.totalHutang || 0,
                totalPiutang: results.summary?.totalPiutang || 0,
                formattedTotalAmount: this._formatCurrency(results.summary?.totalAmount || 0),
                processingTimeMs: processingTimeMs,
                processingTimeFormatted: this._formatDuration(processingTimeMs),
                startTime: startTime,
                endTime: endTime
            },
            level: results.failureCount > 0 ? 'WARN' : 'INFO'
        };

        this._writeLog(logEntry);
        console.log(`[AUDIT] Batch ${batchId} completed: ${results.successCount}/${results.totalProcessed} successful (${logEntry.details.processingTimeFormatted})`);
    }

    /**
     * Log transaction rollback
     * Requirements: 7.3, 7.5
     * @param {string} batchId - Batch identifier
     * @param {string} transactionId - Transaction identifier
     * @param {string} status - Rollback status ('success' or 'failed')
     * @param {string} [errorMessage] - Error message if failed
     */
    logTransactionRollback(batchId, transactionId, status, errorMessage = null) {
        const logEntry = {
            id: this._generateLogId(),
            action: 'TRANSACTION_ROLLBACK',
            category: 'ROLLBACK',
            userId: 'system',
            userName: 'System',
            timestamp: new Date(),
            sessionId: this.sessionId,
            batchId: batchId,
            transactionId: transactionId,
            details: {
                status: status,
                errorMessage: errorMessage
            },
            level: status === 'success' ? 'INFO' : 'ERROR'
        };

        this._writeLog(logEntry);
        
        if (status === 'success') {
            console.log(`[AUDIT] Transaction ${transactionId} rolled back successfully`);
        } else {
            console.error(`[AUDIT] Transaction ${transactionId} rollback failed: ${errorMessage}`);
        }
    }

    /**
     * Log batch rollback completion
     * Requirements: 7.4, 7.5
     * @param {string} batchId - Batch identifier
     * @param {number} rolledBackCount - Number of transactions rolled back
     * @param {Array} rollbackErrors - Array of rollback errors
     */
    logBatchRollback(batchId, rolledBackCount, rollbackErrors) {
        const logEntry = {
            id: this._generateLogId(),
            action: 'BATCH_ROLLBACK',
            category: 'ROLLBACK',
            userId: 'system',
            userName: 'System',
            timestamp: new Date(),
            sessionId: this.sessionId,
            batchId: batchId,
            details: {
                rolledBackCount: rolledBackCount,
                errorCount: rollbackErrors.length,
                errors: rollbackErrors,
                status: rollbackErrors.length === 0 ? 'success' : 'partial_failure'
            },
            level: rollbackErrors.length === 0 ? 'INFO' : 'ERROR'
        };

        this._writeLog(logEntry);
        console.log(`[AUDIT] Batch ${batchId} rollback completed: ${rolledBackCount} transactions rolled back, ${rollbackErrors.length} errors`);
    }

    /**
     * Log system errors for troubleshooting
     * Requirements: 7.5
     * @param {Object} errorData - Error information
     * @param {string} errorData.action - Action that caused error
     * @param {Error} errorData.error - Error object
     * @param {string} [errorData.batchId] - Related batch ID
     * @param {string} [errorData.transactionId] - Related transaction ID
     * @param {Object} [errorData.context] - Additional context
     */
    logSystemError(errorData) {
        const logEntry = {
            id: this._generateLogId(),
            action: 'SYSTEM_ERROR',
            category: 'ERROR',
            userId: 'system',
            userName: 'System',
            timestamp: new Date(),
            sessionId: this.sessionId,
            batchId: errorData.batchId || null,
            transactionId: errorData.transactionId || null,
            details: {
                action: errorData.action,
                errorMessage: errorData.error.message,
                errorStack: errorData.error.stack,
                errorName: errorData.error.name,
                context: errorData.context || {}
            },
            level: 'ERROR'
        };

        this._writeLog(logEntry);
        console.error(`[AUDIT] System error in ${errorData.action}:`, errorData.error.message);
    }

    /**
     * Log ImportTagihanError instances
     * Requirements: 8.1, 8.5
     * @param {ImportTagihanError} error - ImportTagihan error instance
     */
    logError(error) {
        const logEntry = {
            id: this._generateLogId(),
            action: 'ERROR_HANDLED',
            category: 'ERROR',
            userId: 'system',
            userName: 'System',
            timestamp: new Date(),
            sessionId: this.sessionId,
            batchId: error.details?.batchId || null,
            transactionId: error.details?.transactionId || null,
            details: {
                errorCode: error.code,
                errorCategory: error.category,
                errorSeverity: error.severity,
                errorMessage: error.message,
                recoverable: error.recoverable,
                originalError: error.details?.originalError,
                context: error.details || {}
            },
            level: error.severity === 'CRITICAL' ? 'ERROR' : 'WARN'
        };

        this._writeLog(logEntry);
        console.error(`[AUDIT] ${error.category} Error [${error.code}]:`, error.message);
    }

    /**
     * General purpose logging method
     * @param {Object} logData - Log data
     * @param {string} logData.action - Action performed
     * @param {Object} [logData.details] - Additional details
     * @param {string} [logData.userId] - User ID
     * @param {string} [logData.userName] - User name
     * @param {string} [logData.batchId] - Batch ID
     * @param {string} [logData.level] - Log level
     */
    log(logData) {
        const logEntry = {
            id: this._generateLogId(),
            action: logData.action,
            category: 'GENERAL',
            userId: logData.userId || 'system',
            userName: logData.userName || 'System',
            timestamp: new Date(),
            sessionId: this.sessionId,
            batchId: logData.batchId || null,
            details: logData.details || {},
            level: logData.level || 'INFO'
        };

        this._writeLog(logEntry);
        console.log(`[AUDIT] ${logData.action}:`, logData.details);
    }

    /**
     * Get audit logs with filtering options
     * @param {Object} [filters] - Filter options
     * @param {string} [filters.batchId] - Filter by batch ID
     * @param {string} [filters.userId] - Filter by user ID
     * @param {string} [filters.action] - Filter by action
     * @param {string} [filters.category] - Filter by category
     * @param {Date} [filters.startDate] - Filter by start date
     * @param {Date} [filters.endDate] - Filter by end date
     * @param {number} [filters.limit] - Limit number of results
     * @returns {Array} Filtered audit logs
     */
    getLogs(filters = {}) {
        const logs = this._readLogs();
        let filteredLogs = logs;

        // Apply filters
        if (filters.batchId) {
            filteredLogs = filteredLogs.filter(log => log.batchId === filters.batchId);
        }
        
        if (filters.userId) {
            filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
        }
        
        if (filters.action) {
            filteredLogs = filteredLogs.filter(log => log.action === filters.action);
        }
        
        if (filters.category) {
            filteredLogs = filteredLogs.filter(log => log.category === filters.category);
        }
        
        if (filters.startDate) {
            filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= filters.startDate);
        }
        
        if (filters.endDate) {
            filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= filters.endDate);
        }

        // Sort by timestamp (newest first)
        filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Apply limit
        if (filters.limit) {
            filteredLogs = filteredLogs.slice(0, filters.limit);
        }

        return filteredLogs;
    }

    /**
     * Get audit log statistics
     * @param {string} [batchId] - Optional batch ID filter
     * @returns {Object} Audit statistics
     */
    getAuditStatistics(batchId = null) {
        const logs = batchId ? this.getLogs({ batchId }) : this._readLogs();
        
        const stats = {
            totalLogs: logs.length,
            categories: {},
            actions: {},
            levels: {},
            timeRange: {
                earliest: null,
                latest: null
            },
            batchCount: new Set(),
            userCount: new Set()
        };

        logs.forEach(log => {
            // Count categories
            stats.categories[log.category] = (stats.categories[log.category] || 0) + 1;
            
            // Count actions
            stats.actions[log.action] = (stats.actions[log.action] || 0) + 1;
            
            // Count levels
            stats.levels[log.level] = (stats.levels[log.level] || 0) + 1;
            
            // Track time range
            const logTime = new Date(log.timestamp);
            if (!stats.timeRange.earliest || logTime < stats.timeRange.earliest) {
                stats.timeRange.earliest = logTime;
            }
            if (!stats.timeRange.latest || logTime > stats.timeRange.latest) {
                stats.timeRange.latest = logTime;
            }
            
            // Track unique batches and users
            if (log.batchId) stats.batchCount.add(log.batchId);
            if (log.userId) stats.userCount.add(log.userId);
        });

        // Convert sets to counts
        stats.uniqueBatches = stats.batchCount.size;
        stats.uniqueUsers = stats.userCount.size;
        delete stats.batchCount;
        delete stats.userCount;

        return stats;
    }

    /**
     * Log configuration changes
     * Requirements: 9.5
     * @param {string} adminUser - Admin user making the change
     * @param {Object} newConfig - New configuration settings
     * @param {Object} [oldConfig] - Previous configuration settings
     */
    logConfigurationChange(adminUser, newConfig, oldConfig = null) {
        const logEntry = {
            id: this._generateLogId(),
            action: 'CONFIGURATION_CHANGE',
            category: 'ADMIN',
            userId: adminUser,
            userName: adminUser,
            timestamp: new Date(),
            sessionId: this.sessionId,
            level: 'INFO',
            details: {
                newConfiguration: {
                    maxFileSize: newConfig.maxFileSize,
                    maxBatchSize: newConfig.maxBatchSize,
                    importEnabled: newConfig.importEnabled,
                    previewRowLimit: newConfig.previewRowLimit || null
                },
                oldConfiguration: oldConfig ? {
                    maxFileSize: oldConfig.maxFileSize,
                    maxBatchSize: oldConfig.maxBatchSize,
                    importEnabled: oldConfig.importEnabled,
                    previewRowLimit: oldConfig.previewRowLimit || null
                } : null,
                changes: this._detectConfigurationChanges(oldConfig, newConfig)
            },
            message: `Configuration updated by admin: ${adminUser}`
        };

        this._writeLog(logEntry);
        console.log(`[AUDIT] Configuration change logged for admin: ${adminUser}`);
    }

    /**
     * Detect changes between old and new configuration
     * @private
     * @param {Object} oldConfig - Old configuration
     * @param {Object} newConfig - New configuration
     * @returns {Array} Array of changes
     */
    _detectConfigurationChanges(oldConfig, newConfig) {
        if (!oldConfig) {
            return ['Initial configuration set'];
        }

        const changes = [];
        
        if (oldConfig.maxFileSize !== newConfig.maxFileSize) {
            changes.push(`Max file size: ${this._formatFileSize(oldConfig.maxFileSize)} → ${this._formatFileSize(newConfig.maxFileSize)}`);
        }
        
        if (oldConfig.maxBatchSize !== newConfig.maxBatchSize) {
            changes.push(`Max batch size: ${oldConfig.maxBatchSize} → ${newConfig.maxBatchSize}`);
        }
        
        if (oldConfig.importEnabled !== newConfig.importEnabled) {
            changes.push(`Import enabled: ${oldConfig.importEnabled ? 'Yes' : 'No'} → ${newConfig.importEnabled ? 'Yes' : 'No'}`);
        }
        
        if (oldConfig.previewRowLimit !== newConfig.previewRowLimit) {
            changes.push(`Preview row limit: ${oldConfig.previewRowLimit || 'N/A'} → ${newConfig.previewRowLimit || 'N/A'}`);
        }

        return changes.length > 0 ? changes : ['No changes detected'];
    }

    /**
     * Clear old audit logs to prevent storage overflow
     * @param {number} [daysToKeep=30] - Number of days to keep logs
     */
    cleanupOldLogs(daysToKeep = 30) {
        const logs = this._readLogs();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const filteredLogs = logs.filter(log => new Date(log.timestamp) >= cutoffDate);
        const removedCount = logs.length - filteredLogs.length;

        if (removedCount > 0) {
            this._writeLogs(filteredLogs);
            console.log(`[AUDIT] Cleaned up ${removedCount} old log entries (older than ${daysToKeep} days)`);
        }

        return removedCount;
    }

    // Private helper methods

    /**
     * Initialize storage if not exists
     * @private
     */
    _initializeStorage() {
        if (!localStorage.getItem(this.logStorage)) {
            localStorage.setItem(this.logStorage, JSON.stringify([]));
        }
    }

    /**
     * Generate unique log ID
     * @private
     * @returns {string} Unique log ID
     */
    _generateLogId() {
        return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate unique session ID
     * @private
     * @returns {string} Unique session ID
     */
    _generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Write log entry to storage
     * @private
     * @param {Object} logEntry - Log entry to write
     */
    _writeLog(logEntry) {
        try {
            const logs = this._readLogs();
            logs.push(logEntry);

            // Maintain maximum log entries
            if (logs.length > this.maxLogEntries) {
                logs.splice(0, logs.length - this.maxLogEntries);
            }

            this._writeLogs(logs);
        } catch (error) {
            console.error('Failed to write audit log:', error);
        }
    }

    /**
     * Read logs from storage
     * @private
     * @returns {Array} Array of log entries
     */
    _readLogs() {
        try {
            const logsJson = localStorage.getItem(this.logStorage);
            return logsJson ? JSON.parse(logsJson) : [];
        } catch (error) {
            console.error('Failed to read audit logs:', error);
            return [];
        }
    }

    /**
     * Write logs array to storage
     * @private
     * @param {Array} logs - Array of log entries
     */
    _writeLogs(logs) {
        try {
            localStorage.setItem(this.logStorage, JSON.stringify(logs));
        } catch (error) {
            console.error('Failed to write audit logs:', error);
        }
    }

    /**
     * Format file size in human readable format
     * @private
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    _formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Format currency amount
     * @private
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency
     */
    _formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    /**
     * Format duration in human readable format
     * @private
     * @param {number} milliseconds - Duration in milliseconds
     * @returns {string} Formatted duration
     */
    _formatDuration(milliseconds) {
        if (milliseconds < 1000) {
            return `${milliseconds}ms`;
        } else if (milliseconds < 60000) {
            return `${(milliseconds / 1000).toFixed(1)}s`;
        } else {
            const minutes = Math.floor(milliseconds / 60000);
            const seconds = ((milliseconds % 60000) / 1000).toFixed(1);
            return `${minutes}m ${seconds}s`;
        }
    }
}

// Export for both browser and Node.js environments
if (typeof window !== 'undefined') {
    window.AuditLogger = AuditLogger;
}

// CommonJS export for compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuditLogger };
}

// Browser compatibility - exports handled via window object