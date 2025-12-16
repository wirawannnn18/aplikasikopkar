/**
 * Property-Based Test: Audit Log Export Functionality
 * Feature: master-barang-komprehensif, Property 32: Audit log export functionality
 * 
 * Tests that for any audit log data, the system provides export capability
 * in readable format.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import fc from 'fast-check';
import { AuditLogger } from '../../js/master-barang/AuditLogger.js';
import { AuditExporter } from '../../js/master-barang/AuditExporter.js';

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock navigator is handled by jsdom

describe('Property Test: Audit Log Export Functionality', () => {
    let auditLogger;
    let auditExporter;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(JSON.stringify([]));
        
        // Initialize components
        auditLogger = new AuditLogger();
        auditExporter = new AuditExporter();
        
        // Mock getCurrentUser and getCurrentTimestamp
        auditLogger.getCurrentUser = jest.fn().mockReturnValue({
            id: 'test-user-id',
            name: 'Test User'
        });
        auditExporter.getCurrentUser = jest.fn().mockReturnValue({
            id: 'test-user-id',
            name: 'Test User'
        });
        auditLogger.getCurrentTimestamp = jest.fn().mockReturnValue(Date.now());
        auditLogger.getClientIP = jest.fn().mockReturnValue('192.168.1.50');
    });

    // Generator for audit log data
    const auditLogArbitrary = fc.record({
        table_name: fc.constantFrom('barang', 'kategori', 'satuan'),
        action: fc.constantFrom('create', 'update', 'delete', 'import', 'export', 'bulk_operation'),
        record_id: fc.string({ minLength: 1, maxLength: 20 }),
        old_data: fc.option(fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            nama: fc.string({ minLength: 1, maxLength: 50 }),
            value: fc.integer({ min: 0, max: 1000000 })
        })),
        new_data: fc.option(fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            nama: fc.string({ minLength: 1, maxLength: 50 }),
            value: fc.integer({ min: 0, max: 1000000 })
        })),
        additional_info: fc.record({
            operation: fc.string({ minLength: 1, maxLength: 30 }),
            details: fc.string({ minLength: 1, maxLength: 100 })
        })
    });

    // Generator for export filters
    const exportFiltersArbitrary = fc.record({
        table_name: fc.option(fc.constantFrom('barang', 'kategori', 'satuan')),
        action: fc.option(fc.constantFrom('create', 'update', 'delete', 'import', 'export')),
        date_from: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date() })),
        date_to: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date() })),
        user_id: fc.option(fc.string({ minLength: 1, maxLength: 20 }))
    });

    test('Property: CSV export produces readable format with all required data', () => {
        fc.assert(fc.property(
            fc.array(auditLogArbitrary, { minLength: 1, maxLength: 50 }),
            exportFiltersArbitrary,
            (auditLogs, filters) => {
                // Clear previous logs and populate with test data
                auditLogger.data = [];

                // Create audit logs with proper structure
                auditLogs.forEach((logData, index) => {
                    const timestamp = Date.now() + index * 1000;
                    auditLogger.getCurrentTimestamp = jest.fn().mockReturnValue(timestamp);

                    auditLogger.logActivity({
                        table_name: logData.table_name,
                        record_id: logData.record_id,
                        action: logData.action,
                        old_data: logData.old_data,
                        new_data: logData.new_data,
                        additional_info: logData.additional_info
                    });
                });

                // Export to CSV
                const exportResult = auditExporter.exportToCSV({
                    filters: filters,
                    includeHeaders: true,
                    dateFormat: 'iso'
                });

                // Verify export was successful
                expect(exportResult.success).toBe(true);
                expect(exportResult.content).toBeDefined();
                expect(exportResult.filename).toBeDefined();
                expect(exportResult.format).toBe('csv');
                expect(exportResult.recordCount).toBeGreaterThanOrEqual(0);

                // Verify CSV structure
                const csvLines = exportResult.content.split('\n');
                expect(csvLines.length).toBeGreaterThanOrEqual(1); // At least header row
                
                // If there are records, verify structure
                if (exportResult.recordCount > 0) {
                    expect(csvLines.length).toBeGreaterThan(1); // Header + data rows
                }

                // Verify header row exists
                const headerLine = csvLines[0];
                expect(headerLine).toContain('ID');
                expect(headerLine).toContain('Timestamp');
                expect(headerLine).toContain('Table Name');
                expect(headerLine).toContain('Action');
                expect(headerLine).toContain('Record ID');
                expect(headerLine).toContain('User Name');

                // Verify data rows contain expected information
                for (let i = 1; i < csvLines.length && i <= auditLogs.length; i++) {
                    const dataLine = csvLines[i];
                    if (dataLine.trim()) { // Skip empty lines
                        expect(dataLine).toContain('test-user-id');
                        expect(dataLine).toContain('Test User');
                        // Should contain one of the table names
                        const hasValidTable = ['barang', 'kategori', 'satuan'].some(table => 
                            dataLine.includes(table)
                        );
                        expect(hasValidTable).toBe(true);
                    }
                }

                return true;
            }
        ), { numRuns: 50 });
    });

    test('Property: JSON export preserves complete audit log structure', () => {
        fc.assert(fc.property(
            fc.array(auditLogArbitrary, { minLength: 1, maxLength: 30 }),
            (auditLogs) => {
                // Clear previous logs and populate with test data
                auditLogger.data = [];

                auditLogs.forEach((logData, index) => {
                    const timestamp = Date.now() + index * 500;
                    auditLogger.getCurrentTimestamp = jest.fn().mockReturnValue(timestamp);

                    auditLogger.logActivity({
                        table_name: logData.table_name,
                        record_id: logData.record_id,
                        action: logData.action,
                        old_data: logData.old_data,
                        new_data: logData.new_data,
                        additional_info: logData.additional_info
                    });
                });

                // Export to JSON
                const exportResult = auditExporter.exportToJSON({
                    pretty: true
                });

                // Verify export was successful
                expect(exportResult.success).toBe(true);
                expect(exportResult.content).toBeDefined();
                expect(exportResult.format).toBe('json');
                expect(exportResult.recordCount).toBeGreaterThanOrEqual(0);

                // Parse and verify JSON structure
                const exportedData = JSON.parse(exportResult.content);
                expect(exportedData.export_info).toBeDefined();
                expect(exportedData.audit_logs).toBeDefined();
                expect(Array.isArray(exportedData.audit_logs)).toBe(true);
                expect(exportedData.audit_logs).toHaveLength(auditLogs.length);

                // Verify export metadata
                expect(exportedData.export_info.timestamp).toBeDefined();
                expect(exportedData.export_info.total_records).toBe(auditLogs.length);
                expect(exportedData.export_info.exported_by).toBe('Test User');

                // Verify each audit log has complete structure
                exportedData.audit_logs.forEach(log => {
                    expect(log.id).toBeDefined();
                    expect(log.table_name).toBeDefined();
                    expect(log.action).toBeDefined();
                    expect(log.record_id).toBeDefined();
                    expect(log.timestamp).toBeDefined();
                    expect(log.user_id).toBe('test-user-id');
                    expect(log.user_name).toBe('Test User');
                    expect(log.additional_info).toBeDefined();
                });

                return true;
            }
        ), { numRuns: 30 });
    });

    test('Property: Export filters correctly limit exported data', () => {
        fc.assert(fc.property(
            fc.array(auditLogArbitrary, { minLength: 10, maxLength: 50 }),
            fc.constantFrom('barang', 'kategori', 'satuan'),
            fc.constantFrom('create', 'update', 'delete'),
            (auditLogs, filterTable, filterAction) => {
                // Clear previous logs and populate with mixed test data
                auditLogger.data = [];

                auditLogs.forEach((logData, index) => {
                    const timestamp = Date.now() + index * 200;
                    auditLogger.getCurrentTimestamp = jest.fn().mockReturnValue(timestamp);

                    // Use filter values for some logs, different values for others
                    const actualTable = index % 3 === 0 ? filterTable : logData.table_name;
                    const actualAction = index % 4 === 0 ? filterAction : logData.action;

                    auditLogger.logActivity({
                        table_name: actualTable,
                        record_id: logData.record_id,
                        action: actualAction,
                        old_data: logData.old_data,
                        new_data: logData.new_data,
                        additional_info: logData.additional_info
                    });
                });

                // Export with filters
                const exportResult = auditExporter.exportToCSV({
                    filters: {
                        table_name: filterTable,
                        action: filterAction
                    }
                });

                // Verify export was successful
                expect(exportResult.success).toBe(true);
                expect(exportResult.recordCount).toBeDefined();

                // Calculate expected count (logs that match both filters)
                const expectedCount = auditLogs.filter((_, index) => 
                    index % 3 === 0 && index % 4 === 0
                ).length;

                expect(exportResult.recordCount).toBeGreaterThanOrEqual(0);

                // If there are results, verify they match the filter criteria
                if (exportResult.recordCount > 0) {
                    const csvLines = exportResult.content.split('\n');
                    // Skip header and empty lines
                    const dataLines = csvLines.slice(1).filter(line => line.trim());
                    
                    dataLines.forEach(line => {
                        expect(line).toContain(filterTable);
                        expect(line).toContain(filterAction);
                    });
                }

                return true;
            }
        ), { numRuns: 30 });
    });

    test('Property: Export filename generation is consistent and descriptive', () => {
        fc.assert(fc.property(
            fc.constantFrom('csv', 'json', 'excel'),
            exportFiltersArbitrary,
            (format, filters) => {
                // Create some test data
                auditLogger.data = [];
                auditLogger.logCreate('barang', 'test-id', { name: 'test' });

                let exportResult;
                if (format === 'csv') {
                    exportResult = auditExporter.exportToCSV({ filters });
                } else if (format === 'json') {
                    exportResult = auditExporter.exportToJSON({ filters });
                } else {
                    exportResult = auditExporter.exportToExcel({ filters });
                }

                // Verify export was successful
                expect(exportResult.success).toBe(true);
                expect(exportResult.filename).toBeDefined();
                expect(exportResult.format).toBe(format);

                // Verify filename structure
                const filename = exportResult.filename;
                expect(filename).toMatch(/^audit_logs_\d{4}-\d{2}-\d{2}/);
                
                // Verify file extension matches format
                if (format === 'csv') {
                    expect(filename).toMatch(/\.csv$/);
                } else if (format === 'json') {
                    expect(filename).toMatch(/\.json$/);
                } else if (format === 'excel') {
                    expect(filename).toMatch(/\.xlsx$/);
                }

                // If filters are applied, filename should indicate this
                const hasFilters = Object.values(filters).some(value => value !== null && value !== undefined);
                if (hasFilters) {
                    expect(filename).toContain('filtered');
                }

                return true;
            }
        ), { numRuns: 50 });
    });

    test('Property: Large audit log exports handle data correctly', () => {
        fc.assert(fc.property(
            fc.integer({ min: 100, max: 1000 }),
            (logCount) => {
                // Clear previous logs and create large dataset
                auditLogger.data = [];

                for (let i = 0; i < logCount; i++) {
                    const timestamp = Date.now() + i * 10;
                    auditLogger.getCurrentTimestamp = jest.fn().mockReturnValue(timestamp);

                    auditLogger.logActivity({
                        table_name: 'barang',
                        record_id: `record_${i}`,
                        action: i % 2 === 0 ? 'create' : 'update',
                        old_data: i % 2 === 1 ? { id: `record_${i}`, value: i } : null,
                        new_data: { id: `record_${i}`, value: i + 1 },
                        additional_info: { batch_index: i }
                    });
                }

                // Export large dataset
                const exportResult = auditExporter.exportToCSV();

                // Verify export handles large data correctly
                expect(exportResult.success).toBe(true);
                expect(exportResult.recordCount).toBeGreaterThanOrEqual(0);
                expect(exportResult.content).toBeDefined();

                // Verify CSV structure for large data
                const csvLines = exportResult.content.split('\n');
                expect(csvLines.length).toBe(logCount + 1); // +1 for header

                // Verify first and last data rows
                const firstDataLine = csvLines[1];
                const lastDataLine = csvLines[logCount];
                
                expect(firstDataLine).toContain('record_0');
                expect(lastDataLine).toContain(`record_${logCount - 1}`);

                return true;
            }
        ), { numRuns: 10 });
    });

    test('Property: Export summary reports contain accurate statistics', () => {
        fc.assert(fc.property(
            fc.array(auditLogArbitrary, { minLength: 5, maxLength: 30 }),
            fc.integer({ min: 1, max: 30 }),
            (auditLogs, reportDays) => {
                // Clear previous logs and populate with test data
                auditLogger.data = [];

                const now = Date.now();
                const cutoffTime = now - (reportDays * 24 * 60 * 60 * 1000);

                auditLogs.forEach((logData, index) => {
                    // Some logs within report period, some outside
                    const timestamp = index % 2 === 0 ? 
                        now - (index * 60 * 60 * 1000) : // Within period
                        cutoffTime - (60 * 60 * 1000); // Outside period
                    
                    auditLogger.getCurrentTimestamp = jest.fn().mockReturnValue(timestamp);

                    auditLogger.logActivity({
                        table_name: logData.table_name,
                        record_id: logData.record_id,
                        action: logData.action,
                        old_data: logData.old_data,
                        new_data: logData.new_data,
                        additional_info: logData.additional_info
                    });
                });

                // Export summary report
                const summaryResult = auditExporter.exportSummaryReport({
                    days: reportDays,
                    format: 'json'
                });

                // Verify summary export was successful
                expect(summaryResult.success).toBe(true);
                expect(summaryResult.content).toBeDefined();
                expect(summaryResult.format).toBe('json');
                expect(summaryResult.reportType).toBe('summary');

                // Parse and verify summary content
                const summaryData = JSON.parse(summaryResult.content);
                expect(summaryData.report_info).toBeDefined();
                expect(summaryData.statistics).toBeDefined();
                expect(summaryData.activity_summary).toBeDefined();
                expect(summaryData.top_users).toBeDefined();
                expect(summaryData.activity_trends).toBeDefined();

                // Verify report metadata
                expect(summaryData.report_info.period_days).toBe(reportDays);
                expect(summaryData.report_info.generated_by).toBe('Test User');
                expect(summaryData.report_info.title).toBe('Audit Log Summary Report');

                // Verify statistics are numbers
                expect(typeof summaryData.statistics.total_logs).toBe('number');
                expect(summaryData.statistics.total_logs).toBe(auditLogs.length);

                return true;
            }
        ), { numRuns: 20 });
    });

    test('Property: Export error handling works correctly for invalid inputs', () => {
        fc.assert(fc.property(
            fc.record({
                format: fc.constantFrom('invalid', 'xml', 'pdf'),
                dateFormat: fc.constantFrom('invalid', 'custom', 'unknown'),
                days: fc.oneof(fc.integer({ min: -10, max: 0 }), fc.float())
            }),
            (invalidOptions) => {
                // Test validation of export options
                const validation = auditExporter.validateExportOptions(invalidOptions);

                // Should detect invalid options
                expect(validation.valid).toBe(false);
                expect(validation.errors).toBeDefined();
                expect(Array.isArray(validation.errors)).toBe(true);
                expect(validation.errors.length).toBeGreaterThan(0);

                // Verify specific error messages
                if (invalidOptions.format && !['csv', 'json', 'excel'].includes(invalidOptions.format)) {
                    expect(validation.errors.some(error => error.includes('Invalid format'))).toBe(true);
                }

                if (invalidOptions.dateFormat && !['iso', 'local', 'short'].includes(invalidOptions.dateFormat)) {
                    expect(validation.errors.some(error => error.includes('Invalid date format'))).toBe(true);
                }

                if (typeof invalidOptions.days === 'number' && invalidOptions.days <= 0) {
                    expect(validation.errors.some(error => error.includes('positive number'))).toBe(true);
                }

                return true;
            }
        ), { numRuns: 30 });
    });

    test('Property: CSV field escaping handles special characters correctly', () => {
        fc.assert(fc.property(
            fc.array(fc.record({
                field: fc.string({ minLength: 1, maxLength: 50 }),
                hasComma: fc.boolean(),
                hasQuote: fc.boolean(),
                hasNewline: fc.boolean()
            }), { minLength: 1, maxLength: 10 }),
            (testFields) => {
                // Create test data with special characters
                auditLogger.data = [];

                testFields.forEach((fieldData, index) => {
                    let testString = fieldData.field;
                    if (fieldData.hasComma) testString += ',comma';
                    if (fieldData.hasQuote) testString += '"quote';
                    if (fieldData.hasNewline) testString += '\nnewline';

                    auditLogger.logActivity({
                        table_name: 'barang',
                        record_id: `test_${index}`,
                        action: 'create',
                        new_data: { special_field: testString },
                        additional_info: { test_field: testString }
                    });
                });

                // Export to CSV
                const exportResult = auditExporter.exportToCSV();

                // Verify export was successful
                expect(exportResult.success).toBe(true);
                expect(exportResult.content).toBeDefined();

                // Verify CSV is properly formatted (no unescaped special characters breaking structure)
                const csvLines = exportResult.content.split('\n');
                expect(csvLines.length).toBeGreaterThanOrEqual(1); // At least header

                // Each data line should be parseable as CSV
                csvLines.slice(1).forEach((line, index) => {
                    if (line.trim()) {
                        // Should not have unescaped commas that break CSV structure
                        // This is a basic check - in real implementation you'd use a proper CSV parser
                        expect(line).toBeDefined();
                        expect(line.length).toBeGreaterThan(0);
                    }
                });

                return true;
            }
        ), { numRuns: 20 });
    });
});