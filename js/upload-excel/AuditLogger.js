/**
 * AuditLogger - Comprehensive audit logging for compliance and tracking
 * 
 * This class provides complete audit trail functionality including
 * activity logging, data change tracking, and rollback information.
 */

class AuditLogger {
    constructor() {
        /** @type {string} */
        this.auditKey = 'uploadAuditLog';
        
        /** @type {string} */
        this.rollbackKey = 'uploadRollbackData';
        
        /** @type {number} */
        this.maxLogEntries = 1000; // Limit log size
    }

    /**
     * Log the start of an upload operation
     * @param {string} user - Username performing upload
     * @param {string} fileName - Name of uploaded file
     * @param {number} recordCount - Number of records in file
     * @returns {string} Log entry ID
     */
    logUploadStart(user, fileName, recordCount) {
        const entry = {
            id: this.generateLogId(),
            timestamp: new Date().toISOString(),
            user,
            action: 'upload',
            details: {
                fileName,
                recordCount,
                status: 'started'
            },
            sessionId: this.generateSessionId()
        };

        this.addLogEntry(entry);
        return entry.id;
    }

    /**
     * Log validation results
     * @param {ValidationError[]} errors - Validation errors
     * @param {ValidationError[]} warnings - Validation warnings
     * @param {string} sessionId - Associated session ID
     */
    logValidationResults(errors, warnings, sessionId = null) {
        const entry = {
            id: this.generateLogId(),
            timestamp: new Date().toISOString(),
            user: this.getCurrentUser(),
            action: 'validate',
            details: {
                errorCount: errors.length,
                warningCount: warnings.length,
                errors: errors.slice(0, 10), // Limit to first 10 for storage
                warnings: warnings.slice(0, 10),
                hasMoreErrors: errors.length > 10,
                hasMoreWarnings: warnings.length > 10
            },
            sessionId
        };

        this.addLogEntry(entry);
    }

    /**
     * Log data changes during import
     * @param {Object[]} oldData - Previous data state
     * @param {Object[]} newData - New data state
     * @param {string} sessionId - Associated session ID
     */
    logDataChanges(oldData, newData, sessionId = null) {
        // Store detailed change information for rollback
        const changeDetails = this.calculateDataChanges(oldData, newData);
        
        const entry = {
            id: this.generateLogId(),
            timestamp: new Date().toISOString(),
            user: this.getCurrentUser(),
            action: 'import',
            details: {
                changesCount: changeDetails.changes.length,
                createdCount: changeDetails.created.length,
                updatedCount: changeDetails.updated.length,
                deletedCount: changeDetails.deleted.length
            },
            oldData: oldData.slice(0, 5), // Sample for audit
            newData: newData.slice(0, 5), // Sample for audit
            sessionId
        };

        this.addLogEntry(entry);
        
        // Store rollback data separately
        this.storeRollbackData(sessionId, {
            originalData: oldData,
            changes: changeDetails,
            timestamp: entry.timestamp
        });
    }

    /**
     * Log successful import completion
     * @param {ImportResults} results - Import results
     * @param {string} sessionId - Associated session ID
     */
    logImportComplete(results, sessionId = null) {
        const entry = {
            id: this.generateLogId(),
            timestamp: new Date().toISOString(),
            user: this.getCurrentUser(),
            action: 'import',
            details: {
                status: 'completed',
                created: results.created,
                updated: results.updated,
                failed: results.failed,
                totalProcessed: results.totalProcessed,
                successRate: ((results.created + results.updated) / results.totalProcessed * 100).toFixed(2)
            },
            sessionId
        };

        this.addLogEntry(entry);
    }

    /**
     * Log error occurrences
     * @param {Error} error - Error object
     * @param {Object} context - Additional context information
     */
    logError(error, context = {}) {
        const entry = {
            id: this.generateLogId(),
            timestamp: new Date().toISOString(),
            user: this.getCurrentUser(),
            action: 'error',
            details: {
                errorMessage: error.message,
                errorStack: error.stack,
                errorType: error.constructor.name,
                context
            },
            sessionId: context.sessionId || null
        };

        this.addLogEntry(entry);
    }

    /**
     * Log rollback operations
     * @param {string} sessionId - Session ID being rolled back
     * @param {string} user - User performing rollback
     */
    logRollback(sessionId, user) {
        const entry = {
            id: this.generateLogId(),
            timestamp: new Date().toISOString(),
            user,
            action: 'rollback',
            details: {
                rolledBackSessionId: sessionId,
                status: 'completed'
            },
            sessionId: this.generateSessionId()
        };

        this.addLogEntry(entry);
    }

    /**
     * Get audit trail with optional filtering
     * @param {Object} filters - Filter options
     * @returns {AuditEntry[]} Filtered audit entries
     */
    getAuditTrail(filters = {}) {
        const allEntries = this.getAllLogEntries();
        let filteredEntries = allEntries;

        // Apply filters
        if (filters.user) {
            filteredEntries = filteredEntries.filter(entry => 
                entry.user === filters.user
            );
        }

        if (filters.action) {
            filteredEntries = filteredEntries.filter(entry => 
                entry.action === filters.action
            );
        }

        if (filters.sessionId) {
            filteredEntries = filteredEntries.filter(entry => 
                entry.sessionId === filters.sessionId
            );
        }

        if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom);
            filteredEntries = filteredEntries.filter(entry => 
                new Date(entry.timestamp) >= fromDate
            );
        }

        if (filters.dateTo) {
            const toDate = new Date(filters.dateTo);
            filteredEntries = filteredEntries.filter(entry => 
                new Date(entry.timestamp) <= toDate
            );
        }

        // Sort by timestamp (newest first)
        return filteredEntries.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
    }

    /**
     * Export audit log in specified format
     * @param {string} format - Export format (json|csv)
     * @param {Object} filters - Filter options
     * @returns {string} Exported data
     */
    exportAuditLog(format = 'json', filters = {}) {
        const entries = this.getAuditTrail(filters);

        if (format === 'csv') {
            return this.exportAsCSV(entries);
        } else {
            return JSON.stringify(entries, null, 2);
        }
    }

    /**
     * Get rollback data for a specific session
     * @param {string} sessionId - Session ID
     * @returns {RollbackData|null} Rollback data or null
     */
    getRollbackData(sessionId) {
        try {
            const rollbackData = localStorage.getItem(this.rollbackKey);
            if (!rollbackData) return null;

            const allRollbackData = JSON.parse(rollbackData);
            return allRollbackData[sessionId] || null;
            
        } catch (error) {
            console.error('Error reading rollback data:', error);
            return null;
        }
    }

    /**
     * Clean up old audit entries to prevent storage overflow
     */
    cleanupOldEntries() {
        try {
            const entries = this.getAllLogEntries();
            
            if (entries.length > this.maxLogEntries) {
                // Keep only the most recent entries
                const sortedEntries = entries.sort((a, b) => 
                    new Date(b.timestamp) - new Date(a.timestamp)
                );
                
                const keptEntries = sortedEntries.slice(0, this.maxLogEntries);
                localStorage.setItem(this.auditKey, JSON.stringify(keptEntries));
                
                console.log(`Cleaned up ${entries.length - this.maxLogEntries} old audit entries`);
            }
            
        } catch (error) {
            console.error('Error cleaning up audit entries:', error);
        }
    }

    /**
     * Add a log entry to storage
     * @param {AuditEntry} entry - Log entry to add
     * @private
     */
    addLogEntry(entry) {
        try {
            const entries = this.getAllLogEntries();
            entries.push(entry);
            
            localStorage.setItem(this.auditKey, JSON.stringify(entries));
            
            // Cleanup if needed
            if (entries.length > this.maxLogEntries + 100) {
                this.cleanupOldEntries();
            }
            
        } catch (error) {
            console.error('Error adding log entry:', error);
        }
    }

    /**
     * Get all log entries from storage
     * @returns {AuditEntry[]} All audit entries
     * @private
     */
    getAllLogEntries() {
        try {
            const data = localStorage.getItem(this.auditKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading audit log:', error);
            return [];
        }
    }

    /**
     * Store rollback data for a session
     * @param {string} sessionId - Session ID
     * @param {Object} rollbackData - Rollback information
     * @private
     */
    storeRollbackData(sessionId, rollbackData) {
        try {
            const existingData = localStorage.getItem(this.rollbackKey);
            const allRollbackData = existingData ? JSON.parse(existingData) : {};
            
            allRollbackData[sessionId] = rollbackData;
            
            localStorage.setItem(this.rollbackKey, JSON.stringify(allRollbackData));
            
        } catch (error) {
            console.error('Error storing rollback data:', error);
        }
    }

    /**
     * Calculate detailed changes between old and new data
     * @param {Object[]} oldData - Previous data
     * @param {Object[]} newData - New data
     * @returns {Object} Change details
     * @private
     */
    calculateDataChanges(oldData, newData) {
        const changes = {
            created: [],
            updated: [],
            deleted: [],
            changes: []
        };

        const oldMap = new Map(oldData.map(item => [item.kode, item]));
        const newMap = new Map(newData.map(item => [item.kode, item]));

        // Find created items
        newMap.forEach((item, kode) => {
            if (!oldMap.has(kode)) {
                changes.created.push(kode);
                changes.changes.push({
                    type: 'created',
                    kode,
                    newData: item
                });
            }
        });

        // Find updated items
        oldMap.forEach((oldItem, kode) => {
            if (newMap.has(kode)) {
                const newItem = newMap.get(kode);
                if (JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
                    changes.updated.push(kode);
                    changes.changes.push({
                        type: 'updated',
                        kode,
                        oldData: oldItem,
                        newData: newItem
                    });
                }
            }
        });

        // Find deleted items
        oldMap.forEach((item, kode) => {
            if (!newMap.has(kode)) {
                changes.deleted.push(kode);
                changes.changes.push({
                    type: 'deleted',
                    kode,
                    oldData: item
                });
            }
        });

        return changes;
    }

    /**
     * Export entries as CSV format
     * @param {AuditEntry[]} entries - Entries to export
     * @returns {string} CSV formatted data
     * @private
     */
    exportAsCSV(entries) {
        const headers = ['ID', 'Timestamp', 'User', 'Action', 'Details', 'Session ID'];
        const csvLines = [headers.join(',')];

        entries.forEach(entry => {
            const row = [
                entry.id,
                entry.timestamp,
                entry.user,
                entry.action,
                JSON.stringify(entry.details).replace(/"/g, '""'),
                entry.sessionId || ''
            ];
            csvLines.push(row.map(field => `"${field}"`).join(','));
        });

        return csvLines.join('\n');
    }

    /**
     * Generate unique log entry ID
     * @returns {string} Log entry ID
     * @private
     */
    generateLogId() {
        return 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Generate unique session ID
     * @returns {string} Session ID
     * @private
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get current user (placeholder - should integrate with auth system)
     * @returns {string} Current username
     * @private
     */
    getCurrentUser() {
        // TODO: Integrate with actual authentication system
        return 'admin';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuditLogger;
}