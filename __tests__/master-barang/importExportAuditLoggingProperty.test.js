/**
 * Property-Based Test: Import/Export Audit Logging
 * Feature: master-barang-komprehensif, Property 30: Import/export audit logging
 * 
 * Tests that for any import or export operation, the audit logger records
 * activity with data count and status.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import fc from 'fast-check';
import { AuditLogger } from '../../js/master-barang/AuditLogger.js';

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock navigator is handled by jsdom

describe('Property Test: Import/Export Audit Logging', () => {
    let auditLogger;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(JSON.stringify([]));
        
        // Initialize audit logger
        auditLogger = new AuditLogger();
        
        // Mock getCurrentUser and getCurrentTimestamp
        auditLogger.getCurrentUser = jest.fn().mockReturnValue({
            id: 'test-user-id',
            name: 'Test User'
        });
        auditLogger.getCurrentTimestamp = jest.fn().mockReturnValue(Date.now());
        auditLogger.getClientIP = jest.fn().mockReturnValue('10.0.0.1');
    });

    // Generator for import operation data
    const importInfoArbitrary = fc.record({
        fileName: fc.string({ minLength: 5, maxLength: 50 }).map(s => s + '.csv'),
        fileSize: fc.integer({ min: 1024, max: 10485760 }), // 1KB to 10MB
        totalRecords: fc.integer({ min: 1, max: 10000 }),
        successCount: fc.integer({ min: 0, max: 10000 }),
        failedCount: fc.integer({ min: 0, max: 1000 }),
        errors: fc.array(fc.string({ minLength: 10, maxLength: 100 }), { maxLength: 10 })
    }).filter(info => info.successCount + info.failedCount <= info.totalRecords);

    // Generator for export operation data
    const exportInfoArbitrary = fc.record({
        fileName: fc.string({ minLength: 5, maxLength: 50 }).map(s => s + '.xlsx'),
        format: fc.constantFrom('csv', 'excel', 'json'),
        totalRecords: fc.integer({ min: 0, max: 50000 }),
        filtersApplied: fc.record({
            kategori: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
            status: fc.option(fc.constantFrom('aktif', 'nonaktif')),
            dateRange: fc.option(fc.record({
                from: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
                to: fc.date({ min: new Date('2020-01-01'), max: new Date() })
            }))
        })
    });

    test('Property: Import operations are logged with complete data count and status', () => {
        fc.assert(fc.property(
            fc.constantFrom('barang', 'kategori', 'satuan'),
            importInfoArbitrary,
            (tableName, importInfo) => {
                // Clear previous logs
                auditLogger.data = [];

                // Log import operation
                const logEntry = auditLogger.logImport(tableName, importInfo);

                // Verify log entry exists and has correct structure
                expect(logEntry).toBeDefined();
                expect(logEntry.id).toBeDefined();
                expect(logEntry.table_name).toBe(tableName);
                expect(logEntry.record_id).toBe('bulk_import');
                expect(logEntry.action).toBe('import');

                // Verify timestamp and user information
                expect(logEntry.timestamp).toBeDefined();
                expect(typeof logEntry.timestamp).toBe('number');
                expect(logEntry.user_id).toBe('test-user-id');
                expect(logEntry.user_name).toBe('Test User');
                expect(logEntry.ip_address).toBe('10.0.0.1');

                // Verify import-specific information is logged
                expect(logEntry.additional_info.file_name).toBe(importInfo.fileName);
                expect(logEntry.additional_info.file_size).toBe(importInfo.fileSize);
                expect(logEntry.additional_info.total_records).toBe(importInfo.totalRecords);
                expect(logEntry.additional_info.success_count).toBe(importInfo.successCount);
                expect(logEntry.additional_info.failed_count).toBe(importInfo.failedCount);
                expect(logEntry.additional_info.errors).toEqual(importInfo.errors);

                // Verify data consistency
                expect(logEntry.additional_info.success_count + logEntry.additional_info.failed_count)
                    .toBeLessThanOrEqual(logEntry.additional_info.total_records);

                // Verify log is stored
                expect(auditLogger.data).toHaveLength(1);
                expect(auditLogger.data[0]).toEqual(logEntry);

                return true;
            }
        ), { numRuns: 100 });
    });

    test('Property: Export operations are logged with complete data count and filters', () => {
        fc.assert(fc.property(
            fc.constantFrom('barang', 'kategori', 'satuan'),
            exportInfoArbitrary,
            (tableName, exportInfo) => {
                // Clear previous logs
                auditLogger.data = [];

                // Log export operation
                const logEntry = auditLogger.logExport(tableName, exportInfo);

                // Verify log entry exists and has correct structure
                expect(logEntry).toBeDefined();
                expect(logEntry.id).toBeDefined();
                expect(logEntry.table_name).toBe(tableName);
                expect(logEntry.record_id).toBe('bulk_export');
                expect(logEntry.action).toBe('export');

                // Verify timestamp and user information
                expect(logEntry.timestamp).toBeDefined();
                expect(typeof logEntry.timestamp).toBe('number');
                expect(logEntry.user_id).toBe('test-user-id');
                expect(logEntry.user_name).toBe('Test User');
                expect(logEntry.ip_address).toBe('10.0.0.1');

                // Verify export-specific information is logged
                expect(logEntry.additional_info.file_name).toBe(exportInfo.fileName);
                expect(logEntry.additional_info.format).toBe(exportInfo.format);
                expect(logEntry.additional_info.total_records).toBe(exportInfo.totalRecords);
                expect(logEntry.additional_info.filters_applied).toEqual(exportInfo.filtersApplied);

                // Verify log is stored
                expect(auditLogger.data).toHaveLength(1);
                expect(auditLogger.data[0]).toEqual(logEntry);

                return true;
            }
        ), { numRuns: 100 });
    });

    test('Property: Multiple import/export operations create separate log entries', () => {
        fc.assert(fc.property(
            fc.array(fc.record({
                type: fc.constantFrom('import', 'export'),
                tableName: fc.constantFrom('barang', 'kategori', 'satuan'),
                importInfo: importInfoArbitrary,
                exportInfo: exportInfoArbitrary
            }), { minLength: 2, maxLength: 8 }),
            (operations) => {
                // Clear previous logs
                auditLogger.data = [];

                const logEntries = [];

                // Perform multiple operations
                operations.forEach((operation, index) => {
                    // Mock different timestamps for each operation
                    auditLogger.getCurrentTimestamp = jest.fn().mockReturnValue(Date.now() + index * 1000);

                    let logEntry;
                    if (operation.type === 'import') {
                        logEntry = auditLogger.logImport(operation.tableName, operation.importInfo);
                    } else {
                        logEntry = auditLogger.logExport(operation.tableName, operation.exportInfo);
                    }

                    logEntries.push(logEntry);
                });

                // Verify all operations are logged
                expect(auditLogger.data).toHaveLength(operations.length);
                expect(logEntries).toHaveLength(operations.length);

                // Verify each log entry has unique ID and correct data
                const logIds = new Set();
                logEntries.forEach((logEntry, index) => {
                    const operation = operations[index];

                    expect(logEntry.id).toBeDefined();
                    expect(logIds.has(logEntry.id)).toBe(false);
                    logIds.add(logEntry.id);

                    expect(logEntry.table_name).toBe(operation.tableName);
                    expect(logEntry.action).toBe(operation.type);
                    expect(logEntry.user_id).toBe('test-user-id');
                    expect(logEntry.user_name).toBe('Test User');

                    // Verify operation-specific data
                    if (operation.type === 'import') {
                        expect(logEntry.record_id).toBe('bulk_import');
                        expect(logEntry.additional_info.file_name).toBe(operation.importInfo.fileName);
                        expect(logEntry.additional_info.total_records).toBe(operation.importInfo.totalRecords);
                        expect(logEntry.additional_info.success_count).toBe(operation.importInfo.successCount);
                        expect(logEntry.additional_info.failed_count).toBe(operation.importInfo.failedCount);
                    } else {
                        expect(logEntry.record_id).toBe('bulk_export');
                        expect(logEntry.additional_info.file_name).toBe(operation.exportInfo.fileName);
                        expect(logEntry.additional_info.format).toBe(operation.exportInfo.format);
                        expect(logEntry.additional_info.total_records).toBe(operation.exportInfo.totalRecords);
                    }
                });

                return true;
            }
        ), { numRuns: 50 });
    });

    test('Property: Import error information is properly captured', () => {
        fc.assert(fc.property(
            importInfoArbitrary.filter(info => info.failedCount > 0),
            (importInfo) => {
                // Clear previous logs
                auditLogger.data = [];

                // Log import operation with errors
                const logEntry = auditLogger.logImport('barang', importInfo);

                // Verify error information is captured
                expect(logEntry.additional_info.failed_count).toBeGreaterThan(0);
                expect(logEntry.additional_info.errors).toBeDefined();
                expect(Array.isArray(logEntry.additional_info.errors)).toBe(true);
                expect(logEntry.additional_info.errors).toEqual(importInfo.errors);

                // Verify success/failure ratio makes sense
                const totalProcessed = logEntry.additional_info.success_count + logEntry.additional_info.failed_count;
                expect(totalProcessed).toBeLessThanOrEqual(logEntry.additional_info.total_records);

                // If there are errors, failed count should match error array length (if errors are per-record)
                if (logEntry.additional_info.errors.length > 0) {
                    expect(logEntry.additional_info.failed_count).toBeGreaterThan(0);
                }

                return true;
            }
        ), { numRuns: 50 });
    });

    test('Property: Export filter information is accurately logged', () => {
        fc.assert(fc.property(
            exportInfoArbitrary.filter(info => 
                info.filtersApplied.kategori !== null || 
                info.filtersApplied.status !== null || 
                info.filtersApplied.dateRange !== null
            ),
            (exportInfo) => {
                // Clear previous logs
                auditLogger.data = [];

                // Log export operation with filters
                const logEntry = auditLogger.logExport('barang', exportInfo);

                // Verify filter information is captured
                expect(logEntry.additional_info.filters_applied).toBeDefined();
                expect(typeof logEntry.additional_info.filters_applied).toBe('object');
                expect(logEntry.additional_info.filters_applied).toEqual(exportInfo.filtersApplied);

                // Verify specific filter types are preserved
                if (exportInfo.filtersApplied.kategori) {
                    expect(logEntry.additional_info.filters_applied.kategori).toBe(exportInfo.filtersApplied.kategori);
                }
                if (exportInfo.filtersApplied.status) {
                    expect(logEntry.additional_info.filters_applied.status).toBe(exportInfo.filtersApplied.status);
                }
                if (exportInfo.filtersApplied.dateRange) {
                    expect(logEntry.additional_info.filters_applied.dateRange).toEqual(exportInfo.filtersApplied.dateRange);
                }

                return true;
            }
        ), { numRuns: 50 });
    });

    test('Property: Import/export logs can be filtered and retrieved by operation type', () => {
        fc.assert(fc.property(
            fc.array(fc.record({
                type: fc.constantFrom('import', 'export'),
                tableName: fc.constantFrom('barang', 'kategori', 'satuan'),
                importInfo: importInfoArbitrary,
                exportInfo: exportInfoArbitrary
            }), { minLength: 5, maxLength: 15 }),
            (operations) => {
                // Clear previous logs
                auditLogger.data = [];

                // Perform mixed operations
                operations.forEach((operation, index) => {
                    auditLogger.getCurrentTimestamp = jest.fn().mockReturnValue(Date.now() + index * 100);

                    if (operation.type === 'import') {
                        auditLogger.logImport(operation.tableName, operation.importInfo);
                    } else {
                        auditLogger.logExport(operation.tableName, operation.exportInfo);
                    }
                });

                // Filter logs by import operations
                const importLogs = auditLogger.getAuditLogs({
                    action: 'import',
                    limit: 1000
                });

                // Filter logs by export operations
                const exportLogs = auditLogger.getAuditLogs({
                    action: 'export',
                    limit: 1000
                });

                // Verify filtering works correctly
                const expectedImportCount = operations.filter(op => op.type === 'import').length;
                const expectedExportCount = operations.filter(op => op.type === 'export').length;

                expect(importLogs.data).toHaveLength(expectedImportCount);
                expect(exportLogs.data).toHaveLength(expectedExportCount);

                // Verify all import logs have correct action
                importLogs.data.forEach(log => {
                    expect(log.action).toBe('import');
                    expect(log.record_id).toBe('bulk_import');
                    expect(log.additional_info.file_name).toBeDefined();
                    expect(log.additional_info.total_records).toBeDefined();
                });

                // Verify all export logs have correct action
                exportLogs.data.forEach(log => {
                    expect(log.action).toBe('export');
                    expect(log.record_id).toBe('bulk_export');
                    expect(log.additional_info.file_name).toBeDefined();
                    expect(log.additional_info.format).toBeDefined();
                });

                return true;
            }
        ), { numRuns: 30 });
    });

    test('Property: Large import/export operations are logged with accurate counts', () => {
        fc.assert(fc.property(
            fc.record({
                totalRecords: fc.integer({ min: 10000, max: 100000 }),
                successRate: fc.float({ min: Math.fround(0.7), max: Math.fround(1.0) }).filter(rate => !isNaN(rate) && isFinite(rate))
            }),
            (params) => {
                // Ensure successRate is valid
                const validSuccessRate = isNaN(params.successRate) || !isFinite(params.successRate) ? 1.0 : params.successRate;
                const successCount = Math.floor(params.totalRecords * validSuccessRate);
                const failedCount = params.totalRecords - successCount;

                const largeImportInfo = {
                    fileName: 'large_import.csv',
                    fileSize: params.totalRecords * 100, // Approximate file size
                    totalRecords: params.totalRecords,
                    successCount: successCount,
                    failedCount: failedCount,
                    errors: failedCount > 0 ? ['Validation error', 'Duplicate key'] : []
                };

                // Clear previous logs
                auditLogger.data = [];

                // Log large import operation
                const logEntry = auditLogger.logImport('barang', largeImportInfo);

                // Verify large numbers are handled correctly
                expect(logEntry.additional_info.total_records).toBe(params.totalRecords);
                expect(logEntry.additional_info.success_count).toBe(successCount);
                expect(logEntry.additional_info.failed_count).toBe(failedCount);

                // Verify arithmetic consistency
                expect(logEntry.additional_info.success_count + logEntry.additional_info.failed_count)
                    .toBe(logEntry.additional_info.total_records);

                // Verify success rate is within expected range
                const actualSuccessRate = logEntry.additional_info.success_count / logEntry.additional_info.total_records;
                expect(actualSuccessRate).toBeCloseTo(validSuccessRate, 2);

                return true;
            }
        ), { numRuns: 30 });
    });
});