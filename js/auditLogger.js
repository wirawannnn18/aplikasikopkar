/**
 * Audit Logger
 * Handles logging of all system operations for audit trail
 */

class AuditLogger {
    constructor() {
        this.storageKey = 'auditLogs';
        this.maxLogsBeforeArchive = 1000;
        this.archiveKey = 'auditLogsArchive';
    }

    /**
     * Initialize audit logger
     */
    init() {
        // Ensure audit logs exist
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
        
        // Check if archiving is needed
        this.checkAndArchive();
    }

    /**
     * Log an operation
     */
    logOperation(operation, entityType, entityId, details = {}) {
        const user = AuditUtils.getCurrentUser();
        const log = {
            id: AuditUtils.generateId('AUD'),
            timestamp: AuditUtils.formatDate(),
            userId: user.username,
            userName: user.nama || user.username,
            operation: operation,
            entityType: entityType,
            entityId: entityId,
            details: details
        };

        this._addLog(log);
        console.log('[AUDIT]', operation, entityType, entityId);
        return log;
    }

    /**
     * Log a deletion with reason
     */
    logDeletion(entityType, entityId, reason, entityData = {}) {
        const user = AuditUtils.getCurrentUser();
        const log = {
            id: AuditUtils.generateId('AUD'),
            timestamp: AuditUtils.formatDate(),
            userId: user.username,
            userName: user.nama || user.username,
            operation: 'DELETE',
            entityType: entityType,
            entityId: entityId,
            reason: reason,
            details: {
                deletedData: entityData,
                reason: reason
            }
        };

        this._addLog(log);
        console.log('[AUDIT DELETE]', entityType, entityId, reason);
        return log;
    }

    /**
     * Get audit logs with optional filtering
     */
    getAuditLogs(filter = {}) {
        const logs = this._getAllLogs();
        
        let filtered = logs;

        // Filter by date range
        if (filter.startDate) {
            const startDate = new Date(filter.startDate);
            filtered = filtered.filter(log => new Date(log.timestamp) >= startDate);
        }
        if (filter.endDate) {
            const endDate = new Date(filter.endDate);
            filtered = filtered.filter(log => new Date(log.timestamp) <= endDate);
        }

        // Filter by user
        if (filter.userId) {
            filtered = filtered.filter(log => log.userId === filter.userId);
        }

        // Filter by operation
        if (filter.operation) {
            filtered = filtered.filter(log => log.operation === filter.operation);
        }

        // Filter by entity type
        if (filter.entityType) {
            filtered = filtered.filter(log => log.entityType === filter.entityType);
        }

        // Sort by timestamp (newest first)
        filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return filtered;
    }

    /**
     * Get recent logs (last N logs)
     */
    getRecentLogs(count = 10) {
        const logs = this._getAllLogs();
        return logs
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, count);
    }

    /**
     * Archive old logs
     */
    archiveLogs(beforeDate) {
        const logs = this._getAllLogs();
        const cutoffDate = new Date(beforeDate);

        const toArchive = logs.filter(log => new Date(log.timestamp) < cutoffDate);
        const toKeep = logs.filter(log => new Date(log.timestamp) >= cutoffDate);

        if (toArchive.length > 0) {
            // Get existing archive
            const archive = this._getArchive();
            
            // Add to archive
            archive.push(...toArchive);
            
            // Save archive
            localStorage.setItem(this.archiveKey, JSON.stringify(archive));
            
            // Update active logs
            localStorage.setItem(this.storageKey, JSON.stringify(toKeep));

            console.log(`[AUDIT] Archived ${toArchive.length} logs`);
            return {
                success: true,
                archivedCount: toArchive.length,
                remainingCount: toKeep.length
            };
        }

        return {
            success: true,
            archivedCount: 0,
            remainingCount: logs.length
        };
    }

    /**
     * Check and auto-archive if needed
     */
    checkAndArchive() {
        const logs = this._getAllLogs();
        
        if (logs.length > this.maxLogsBeforeArchive) {
            // Archive logs older than 90 days
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            
            this.archiveLogs(ninetyDaysAgo);
        }
    }

    /**
     * Detect suspicious activity
     */
    detectSuspiciousActivity() {
        const logs = this.getRecentLogs(100);
        const suspicious = [];

        // Group by user
        const byUser = AuditUtils.groupBy(logs, 'userId');

        for (const [userId, userLogs] of Object.entries(byUser)) {
            // Check for rapid deletions
            const deletions = userLogs.filter(log => log.operation === 'DELETE');
            if (deletions.length > 10) {
                suspicious.push({
                    type: 'RAPID_DELETIONS',
                    userId: userId,
                    count: deletions.length,
                    severity: 'HIGH',
                    message: `User ${userId} melakukan ${deletions.length} penghapusan dalam waktu singkat`
                });
            }

            // Check for failed login attempts (if tracked)
            const failedLogins = userLogs.filter(log => 
                log.operation === 'LOGIN_FAILED'
            );
            if (failedLogins.length > 5) {
                suspicious.push({
                    type: 'MULTIPLE_FAILED_LOGINS',
                    userId: userId,
                    count: failedLogins.length,
                    severity: 'MEDIUM',
                    message: `User ${userId} gagal login ${failedLogins.length} kali`
                });
            }
        }

        return suspicious;
    }

    /**
     * Export logs to JSON
     */
    exportLogs(filter = {}) {
        const logs = this.getAuditLogs(filter);
        const dataStr = JSON.stringify(logs, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    /**
     * Clear all logs (use with caution!)
     */
    clearAllLogs() {
        localStorage.setItem(this.storageKey, JSON.stringify([]));
        console.log('[AUDIT] All logs cleared');
    }

    /**
     * Get statistics
     */
    getStatistics() {
        const logs = this._getAllLogs();
        const archive = this._getArchive();

        const byOperation = AuditUtils.groupBy(logs, 'operation');
        const byEntityType = AuditUtils.groupBy(logs, 'entityType');
        const byUser = AuditUtils.groupBy(logs, 'userId');

        return {
            totalLogs: logs.length,
            archivedLogs: archive.length,
            byOperation: Object.keys(byOperation).map(op => ({
                operation: op,
                count: byOperation[op].length
            })),
            byEntityType: Object.keys(byEntityType).map(type => ({
                entityType: type,
                count: byEntityType[type].length
            })),
            byUser: Object.keys(byUser).map(user => ({
                userId: user,
                count: byUser[user].length
            })),
            oldestLog: logs.length > 0 ? logs[logs.length - 1].timestamp : null,
            newestLog: logs.length > 0 ? logs[0].timestamp : null
        };
    }

    // Private methods

    _addLog(log) {
        const logs = this._getAllLogs();
        logs.unshift(log); // Add to beginning
        localStorage.setItem(this.storageKey, JSON.stringify(logs));
    }

    _getAllLogs() {
        const logsStr = localStorage.getItem(this.storageKey);
        return AuditUtils.safeJsonParse(logsStr, []);
    }

    _getArchive() {
        const archiveStr = localStorage.getItem(this.archiveKey);
        return AuditUtils.safeJsonParse(archiveStr, []);
    }
}

// Create global instance
const auditLogger = new AuditLogger();
auditLogger.init();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuditLogger;
}
