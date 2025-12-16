/**
 * Master Barang Komprehensif - Audit Exporter
 * Handles exporting audit data in various formats
 */

import { BaseManager } from './BaseManager.js';
import { AuditLogger } from './AuditLogger.js';

export class AuditExporter extends BaseManager {
    constructor() {
        super();
        this.auditLogger = new AuditLogger();
    }

    /**
     * Export audit logs to CSV format
     * @param {Object} options - Export options
     * @returns {Object} Export result
     */
    exportToCSV(options = {}) {
        const {
            filters = {},
            includeHeaders = true,
            dateFormat = 'iso',
            filename = null
        } = options;

        try {
            // Get audit logs with filters
            const result = this.auditLogger.getAuditLogs({ 
                ...filters, 
                limit: 50000 // Large limit for export
            });
            const logs = result.data || [];

            // Define CSV headers
            const headers = [
                'ID',
                'Timestamp',
                'Table Name',
                'Action',
                'Record ID',
                'User ID',
                'User Name',
                'IP Address',
                'User Agent',
                'Old Data',
                'New Data',
                'Additional Info'
            ];

            const csvRows = [];

            // Add headers if requested
            if (includeHeaders) {
                csvRows.push(headers.join(','));
            }

            // Process each log entry
            logs.forEach(log => {
                const row = [
                    this.escapeCsvField(log.id),
                    this.escapeCsvField(this.formatDate(log.timestamp, dateFormat)),
                    this.escapeCsvField(log.table_name),
                    this.escapeCsvField(log.action),
                    this.escapeCsvField(log.record_id),
                    this.escapeCsvField(log.user_id),
                    this.escapeCsvField(log.user_name),
                    this.escapeCsvField(log.ip_address),
                    this.escapeCsvField(log.user_agent),
                    this.escapeCsvField(log.old_data ? JSON.stringify(log.old_data) : ''),
                    this.escapeCsvField(log.new_data ? JSON.stringify(log.new_data) : ''),
                    this.escapeCsvField(JSON.stringify(log.additional_info))
                ];
                csvRows.push(row.join(','));
            });

            const csvContent = csvRows.join('\n');
            const exportFilename = filename || this.generateExportFilename('csv', filters);

            return {
                success: true,
                content: csvContent,
                filename: exportFilename,
                recordCount: logs.length,
                format: 'csv'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                recordCount: 0
            };
        }
    }

    /**
     * Export audit logs to JSON format
     * @param {Object} options - Export options
     * @returns {Object} Export result
     */
    exportToJSON(options = {}) {
        const {
            filters = {},
            pretty = true,
            filename = null
        } = options;

        try {
            // Get audit logs with filters
            const auditResult = this.auditLogger.getAuditLogs({ 
                ...filters, 
                limit: 50000 // Large limit for export
            });
            const logs = auditResult.data || [];

            const exportData = {
                export_info: {
                    timestamp: new Date().toISOString(),
                    total_records: logs.length,
                    filters_applied: filters,
                    exported_by: this.getCurrentUser().name
                },
                audit_logs: logs
            };

            const jsonContent = pretty ? 
                JSON.stringify(exportData, null, 2) : 
                JSON.stringify(exportData);

            const exportFilename = filename || this.generateExportFilename('json', filters);

            return {
                success: true,
                content: jsonContent,
                filename: exportFilename,
                recordCount: logs.length,
                format: 'json'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                recordCount: 0
            };
        }
    }

    /**
     * Export audit logs to Excel format (simplified as CSV with .xlsx extension)
     * @param {Object} options - Export options
     * @returns {Object} Export result
     */
    exportToExcel(options = {}) {
        const csvResult = this.exportToCSV(options);
        
        if (csvResult.success) {
            const excelFilename = csvResult.filename.replace('.csv', '.xlsx');
            return {
                ...csvResult,
                filename: excelFilename,
                format: 'excel'
            };
        }

        return csvResult;
    }

    /**
     * Escape CSV field content
     * @param {string} field - Field content
     * @returns {string} Escaped field
     */
    escapeCsvField(field) {
        if (field === null || field === undefined) {
            return '';
        }
        
        const stringField = String(field);
        
        // If field contains comma, quote, or newline, wrap in quotes and escape quotes
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
            return `"${stringField.replace(/"/g, '""')}"`;
        }
        
        return stringField;
    }

    /**
     * Format date according to specified format
     * @param {number} timestamp - Timestamp
     * @param {string} format - Date format ('iso', 'local', 'short')
     * @returns {string} Formatted date
     */
    formatDate(timestamp, format = 'iso') {
        const date = new Date(timestamp);
        
        switch (format) {
            case 'iso':
                return date.toISOString();
            case 'local':
                return date.toLocaleString();
            case 'short':
                return date.toLocaleDateString();
            default:
                return date.toISOString();
        }
    }

    /**
     * Generate export filename
     * @param {string} format - File format
     * @param {Object} filters - Applied filters
     * @returns {string} Generated filename
     */
    generateExportFilename(format, filters = {}) {
        const timestamp = new Date().toISOString().split('T')[0];
        const filterSuffix = Object.keys(filters).length > 0 ? '_filtered' : '';
        return `audit_logs_${timestamp}${filterSuffix}.${format}`;
    }

    /**
     * Validate export options
     * @param {Object} options - Export options
     * @returns {Object} Validation result
     */
    validateExportOptions(options) {
        const errors = [];
        
        if (options.format && !['csv', 'json', 'excel'].includes(options.format)) {
            errors.push('Invalid format. Supported formats: csv, json, excel');
        }
        
        if (options.dateFormat && !['iso', 'local', 'short'].includes(options.dateFormat)) {
            errors.push('Invalid date format. Supported formats: iso, local, short');
        }
        
        if (options.days && (typeof options.days !== 'number' || options.days < 1)) {
            errors.push('Days must be a positive number');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Export summary report
     * @param {Object} options - Report options
     * @returns {Object} Summary report result
     */
    exportSummaryReport(options = {}) {
        const {
            days = 30,
            format = 'json',
            filename = null
        } = options;

        try {
            // Calculate date range
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            // Get logs within date range
            const logs = this.auditLogger.getAuditLogs({
                date_from: startDate.getTime(),
                date_to: endDate.getTime(),
                limit: 50000
            }).data;

            // Generate summary statistics
            const summary = {
                report_info: {
                    generated_at: new Date().toISOString(),
                    period_days: days,
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString(),
                    total_records: logs.length
                },
                statistics: {
                    actions: this.summarizeByField(logs, 'action'),
                    tables: this.summarizeByField(logs, 'table_name'),
                    users: this.summarizeByField(logs, 'user_name'),
                    daily_activity: this.summarizeByDay(logs)
                }
            };

            const exportFilename = filename || `audit_summary_${days}days_${new Date().toISOString().split('T')[0]}.${format}`;

            if (format === 'json') {
                return {
                    success: true,
                    content: JSON.stringify(summary, null, 2),
                    filename: exportFilename,
                    recordCount: logs.length,
                    format: 'json'
                };
            } else if (format === 'csv') {
                // Convert summary to CSV format
                const csvContent = this.summaryToCSV(summary);
                return {
                    success: true,
                    content: csvContent,
                    filename: exportFilename,
                    recordCount: logs.length,
                    format: 'csv'
                };
            }

            return {
                success: false,
                error: 'Unsupported format for summary report',
                recordCount: 0
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                recordCount: 0
            };
        }
    }

    /**
     * Summarize logs by field
     * @param {Array} logs - Audit logs
     * @param {string} field - Field to summarize by
     * @returns {Object} Summary by field
     */
    summarizeByField(logs, field) {
        const summary = {};
        logs.forEach(log => {
            const value = log[field] || 'Unknown';
            summary[value] = (summary[value] || 0) + 1;
        });
        return summary;
    }

    /**
     * Summarize logs by day
     * @param {Array} logs - Audit logs
     * @returns {Object} Daily activity summary
     */
    summarizeByDay(logs) {
        const dailySummary = {};
        logs.forEach(log => {
            const date = new Date(log.timestamp).toISOString().split('T')[0];
            dailySummary[date] = (dailySummary[date] || 0) + 1;
        });
        return dailySummary;
    }

    /**
     * Convert summary to CSV format
     * @param {Object} summary - Summary data
     * @returns {string} CSV content
     */
    summaryToCSV(summary) {
        const csvRows = [];
        
        // Add report info
        csvRows.push('Report Information');
        csvRows.push(`Generated At,${summary.report_info.generated_at}`);
        csvRows.push(`Period Days,${summary.report_info.period_days}`);
        csvRows.push(`Total Records,${summary.report_info.total_records}`);
        csvRows.push('');
        
        // Add statistics sections
        Object.keys(summary.statistics).forEach(section => {
            csvRows.push(section.charAt(0).toUpperCase() + section.slice(1));
            csvRows.push('Item,Count');
            
            Object.entries(summary.statistics[section]).forEach(([key, value]) => {
                csvRows.push(`${this.escapeCsvField(key)},${value}`);
            });
            csvRows.push('');
        });
        
        return csvRows.join('\n');
    }

    /**
     * Get export statistics
     * @returns {Object} Export statistics
     */
    getExportStatistics() {
        const totalLogs = this.auditLogger.data.length;
        const statistics = this.auditLogger.getStatistics();
        
        return {
            total_logs_available: totalLogs,
            oldest_log: statistics.oldest_log,
            newest_log: statistics.newest_log,
            supported_formats: ['csv', 'json', 'excel'],
            max_export_limit: 50000
        };
    }
}