/**
 * Master Barang Komprehensif - Audit Logger
 * Manages audit logging for all operations
 */

import { BaseManager } from './BaseManager.js';
import { STORAGE_KEYS } from './types.js';

export class AuditLogger extends BaseManager {
    constructor() {
        super(STORAGE_KEYS.AUDIT_LOGS);
    }

    /**
     * Log an activity
     * @param {Object} logData - Log data
     * @returns {Object} Created log entry
     */
    logActivity(logData) {
        const user = this.getCurrentUser();
        const timestamp = this.getCurrentTimestamp();

        const logEntry = {
            id: this.generateId(),
            table_name: logData.table_name,
            record_id: logData.record_id,
            action: logData.action,
            old_data: logData.old_data || null,
            new_data: logData.new_data || null,
            user_id: user.id,
            user_name: user.name,
            timestamp: timestamp,
            ip_address: this.getClientIP(),
            user_agent: navigator.userAgent,
            additional_info: logData.additional_info || {}
        };

        this.data.push(logEntry);
        this.saveData();

        return logEntry;
    }

    /**
     * Log create operation
     * @param {string} tableName - Table name
     * @param {string} recordId - Record ID
     * @param {Object} newData - New data
     * @param {Object} additionalInfo - Additional info
     * @returns {Object} Created log entry
     */
    logCreate(tableName, recordId, newData, additionalInfo = {}) {
        return this.logActivity({
            table_name: tableName,
            record_id: recordId,
            action: 'create',
            new_data: newData,
            additional_info: additionalInfo
        });
    }

    /**
     * Log update operation
     * @param {string} tableName - Table name
     * @param {string} recordId - Record ID
     * @param {Object} oldData - Old data
     * @param {Object} newData - New data
     * @param {Object} additionalInfo - Additional info
     * @returns {Object} Created log entry
     */
    logUpdate(tableName, recordId, oldData, newData, additionalInfo = {}) {
        return this.logActivity({
            table_name: tableName,
            record_id: recordId,
            action: 'update',
            old_data: oldData,
            new_data: newData,
            additional_info: additionalInfo
        });
    }

    /**
     * Log delete operation
     * @param {string} tableName - Table name
     * @param {string} recordId - Record ID
     * @param {Object} oldData - Old data
     * @param {Object} additionalInfo - Additional info
     * @returns {Object} Created log entry
     */
    logDelete(tableName, recordId, oldData, additionalInfo = {}) {
        return this.logActivity({
            table_name: tableName,
            record_id: recordId,
            action: 'delete',
            old_data: oldData,
            additional_info: additionalInfo
        });
    }

    /**
     * Log import operation
     * @param {string} tableName - Table name
     * @param {Object} importInfo - Import information
     * @returns {Object} Created log entry
     */
    logImport(tableName, importInfo) {
        return this.logActivity({
            table_name: tableName,
            record_id: 'bulk_import',
            action: 'import',
            additional_info: {
                file_name: importInfo.fileName,
                file_size: importInfo.fileSize,
                total_records: importInfo.totalRecords,
                success_count: importInfo.successCount,
                failed_count: importInfo.failedCount,
                errors: importInfo.errors || []
            }
        });
    }

    /**
     * Log export operation
     * @param {string} tableName - Table name
     * @param {Object} exportInfo - Export information
     * @returns {Object} Created log entry
     */
    logExport(tableName, exportInfo) {
        return this.logActivity({
            table_name: tableName,
            record_id: 'bulk_export',
            action: 'export',
            additional_info: {
                file_name: exportInfo.fileName,
                format: exportInfo.format,
                total_records: exportInfo.totalRecords,
                filters_applied: exportInfo.filtersApplied || {}
            }
        });
    }

    /**
     * Log bulk operation
     * @param {string} tableName - Table name
     * @param {Object} bulkInfo - Bulk operation information
     * @returns {Object} Created log entry
     */
    logBulkOperation(tableName, bulkInfo) {
        return this.logActivity({
            table_name: tableName,
            record_id: 'bulk_operation',
            action: 'bulk_operation',
            additional_info: {
                operation_type: bulkInfo.operationType,
                affected_records: bulkInfo.affectedRecords,
                success_count: bulkInfo.successCount,
                failed_count: bulkInfo.failedCount,
                errors: bulkInfo.errors || []
            }
        });
    }

    /**
     * Get audit logs with filtering
     * @param {Object} filters - Filter options
     * @returns {Object} Paginated audit logs
     */
    getAuditLogs(filters = {}) {
        const {
            table_name,
            action,
            user_id,
            date_from,
            date_to,
            record_id,
            ...paginationOptions
        } = filters;

        // Override getAll to include audit-specific filters
        const originalGetAll = this.getAll.bind(this);
        this.getAll = (baseFilters) => {
            let result = originalGetAll(baseFilters);

            // Apply table filter
            if (table_name) {
                result = result.filter(item => item.table_name === table_name);
            }

            // Apply action filter
            if (action) {
                result = result.filter(item => item.action === action);
            }

            // Apply user filter
            if (user_id) {
                result = result.filter(item => item.user_id === user_id);
            }

            // Apply record filter
            if (record_id) {
                result = result.filter(item => item.record_id === record_id);
            }

            // Apply date range filter
            if (date_from) {
                const fromTimestamp = new Date(date_from).getTime();
                result = result.filter(item => item.timestamp >= fromTimestamp);
            }
            if (date_to) {
                const toTimestamp = new Date(date_to).getTime() + (24 * 60 * 60 * 1000 - 1); // End of day
                result = result.filter(item => item.timestamp <= toTimestamp);
            }

            return result;
        };

        const paginatedResult = this.getPaginated({
            sortBy: 'timestamp',
            sortOrder: 'desc',
            ...paginationOptions
        });

        // Restore original getAll method
        this.getAll = originalGetAll;

        return paginatedResult;
    }

    /**
     * Get audit logs for specific record
     * @param {string} tableName - Table name
     * @param {string} recordId - Record ID
     * @returns {Array} Array of audit logs
     */
    getRecordHistory(tableName, recordId) {
        return this.data
            .filter(log => log.table_name === tableName && log.record_id === recordId)
            .sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Get user activity summary
     * @param {string} userId - User ID
     * @param {number} days - Number of days to look back
     * @returns {Object} Activity summary
     */
    getUserActivitySummary(userId, days = 30) {
        const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
        const userLogs = this.data.filter(log => 
            log.user_id === userId && log.timestamp >= cutoffDate
        );

        const summary = {
            total_activities: userLogs.length,
            by_action: {},
            by_table: {},
            by_date: {}
        };

        userLogs.forEach(log => {
            // Count by action
            summary.by_action[log.action] = (summary.by_action[log.action] || 0) + 1;
            
            // Count by table
            summary.by_table[log.table_name] = (summary.by_table[log.table_name] || 0) + 1;
            
            // Count by date
            const dateKey = new Date(log.timestamp).toISOString().split('T')[0];
            summary.by_date[dateKey] = (summary.by_date[dateKey] || 0) + 1;
        });

        return summary;
    }

    /**
     * Get system activity summary
     * @param {number} days - Number of days to look back
     * @returns {Object} System activity summary
     */
    getSystemActivitySummary(days = 7) {
        const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
        const recentLogs = this.data.filter(log => log.timestamp >= cutoffDate);

        const summary = {
            total_activities: recentLogs.length,
            by_action: {},
            by_table: {},
            by_user: {},
            by_date: {}
        };

        recentLogs.forEach(log => {
            // Count by action
            summary.by_action[log.action] = (summary.by_action[log.action] || 0) + 1;
            
            // Count by table
            summary.by_table[log.table_name] = (summary.by_table[log.table_name] || 0) + 1;
            
            // Count by user
            summary.by_user[log.user_name] = (summary.by_user[log.user_name] || 0) + 1;
            
            // Count by date
            const dateKey = new Date(log.timestamp).toISOString().split('T')[0];
            summary.by_date[dateKey] = (summary.by_date[dateKey] || 0) + 1;
        });

        return summary;
    }

    /**
     * Export audit logs to CSV format
     * @param {Object} filters - Filter options
     * @returns {string} CSV content
     */
    exportToCSV(filters = {}) {
        const logs = this.getAuditLogs({ ...filters, limit: 10000 }).data;
        
        const headers = [
            'Timestamp',
            'Table',
            'Action',
            'Record ID',
            'User',
            'IP Address',
            'Details'
        ];

        const csvRows = [headers.join(',')];

        logs.forEach(log => {
            const row = [
                new Date(log.timestamp).toISOString(),
                log.table_name,
                log.action,
                log.record_id,
                log.user_name,
                log.ip_address,
                JSON.stringify(log.additional_info).replace(/"/g, '""')
            ];
            csvRows.push(row.map(field => `"${field}"`).join(','));
        });

        return csvRows.join('\n');
    }

    /**
     * Get client IP address (placeholder)
     * @returns {string} IP address
     */
    getClientIP() {
        // In a real application, this would get the actual client IP
        // For now, return a placeholder
        return '127.0.0.1';
    }

    /**
     * Clean old audit logs
     * @param {number} daysToKeep - Number of days to keep
     * @returns {Object} Cleanup result
     */
    cleanOldLogs(daysToKeep = 365) {
        const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
        const initialCount = this.data.length;
        
        this.data = this.data.filter(log => log.timestamp >= cutoffDate);
        this.saveData();
        
        const removedCount = initialCount - this.data.length;
        
        return {
            success: true,
            removed_count: removedCount,
            remaining_count: this.data.length
        };
    }

    /**
     * Get audit statistics
     * @returns {Object} Audit statistics
     */
    getStatistics() {
        const allLogs = this.data;
        const last30Days = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const recentLogs = allLogs.filter(log => log.timestamp >= last30Days);
        
        return {
            total_logs: allLogs.length,
            recent_logs: recentLogs.length,
            oldest_log: allLogs.length > 0 ? Math.min(...allLogs.map(log => log.timestamp)) : null,
            newest_log: allLogs.length > 0 ? Math.max(...allLogs.map(log => log.timestamp)) : null,
            unique_users: new Set(allLogs.map(log => log.user_id)).size,
            tables_tracked: new Set(allLogs.map(log => log.table_name)).size
        };
    }
}