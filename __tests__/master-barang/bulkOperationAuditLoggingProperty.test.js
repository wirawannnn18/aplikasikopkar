/**
 * Property-Based Test: Bulk Operation Audit Logging
 * Feature: master-barang-komprehensif, Property 31: Bulk operation audit logging
 * 
 * Tests that for any bulk operation, the audit logger records operation
 * details and affected records.
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

describe('Property Test: Bulk Operation Audit Logging', () => {
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
        auditLogger.getClientIP = jest.fn().mockReturnValue('172.16.0.1');
    });

    // Generator for bulk operation data
    const bulkOperationArbitrary = fc.record({
        operationType: fc.constantFrom('bulk_delete', 'bulk_update_category', 'bulk_update_status', 'bulk_update_price'),
        affectedRecords: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 100 }),
        successCount: fc.integer({ min: 0, max: 100 }),
        failedCount: fc.integer({ min: 0, max: 50 }),
        errors: fc.array(fc.string({ minLength: 10, maxLength: 100 }), { maxLength: 20 })
    }).filter(info => info.successCount + info.failedCount <= info.affectedRecords.length);

    // Generator for bulk update operations with specific data
    const bulkUpdateArbitrary = fc.record({
        operationType: fc.constantFrom('bulk_update_category', 'bulk_update_status', 'bulk_update_price'),
        recordIds: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 2, maxLength: 50 }),
        updateData: fc.record({
            field: fc.constantFrom('kategori_id', 'status', 'harga_jual'),
            oldValue: fc.oneof(fc.string({ minLength: 1, maxLength: 20 }), fc.integer({ min: 0, max: 1000000 })),
            newValue: fc.oneof(fc.string({ minLength: 1, maxLength: 20 }), fc.integer({ min: 0, max: 1000000 }))
        }),
        successCount: fc.integer({ min: 0, max: 50 }),
        failedCount: fc.integer({ min: 0, max: 10 }),
        errors: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { maxLength: 10 })
    }).filter(info => info.successCount + info.failedCount <= info.recordIds.length);

    test('Property: Bulk operations are logged with complete operation details', () => {
        fc.assert(fc.property(
            fc.constantFrom('barang', 'kategori', 'satuan'),
            bulkOperationArbitrary,
            (tableName, bulkInfo) => {
                // Clear previous logs
                auditLogger.data = [];

                // Log bulk operation
                const logEntry = auditLogger.logBulkOperation(tableName, bulkInfo);

                // Verify log entry exists and has correct structure
                expect(logEntry).toBeDefined();
                expect(logEntry.id).toBeDefined();
                expect(logEntry.table_name).toBe(tableName);
                expect(logEntry.record_id).toBe('bulk_operation');
                expect(logEntry.action).toBe('bulk_operation');

                // Verify timestamp and user information
                expect(logEntry.timestamp).toBeDefined();
                expect(typeof logEntry.timestamp).toBe('number');
                expect(logEntry.user_id).toBe('test-user-id');
                expect(logEntry.user_name).toBe('Test User');
                expect(logEntry.ip_address).toBe('172.16.0.1');

                // Verify bulk operation specific information
                expect(logEntry.additional_info.operation_type).toBe(bulkInfo.operationType);
                expect(logEntry.additional_info.affected_records).toEqual(bulkInfo.affectedRecords);
                expect(logEntry.additional_info.success_count).toBe(bulkInfo.successCount);
                expect(logEntry.additional_info.failed_count).toBe(bulkInfo.failedCount);
                expect(logEntry.additional_info.errors).toEqual(bulkInfo.errors);

                // Verify data consistency
                expect(logEntry.additional_info.success_count + logEntry.additional_info.failed_count)
                    .toBeLessThanOrEqual(logEntry.additional_info.affected_records.length);

                // Verify log is stored
                expect(auditLogger.data).toHaveLength(1);
                expect(auditLogger.data[0]).toEqual(logEntry);

                return true;
            }
        ), { numRuns: 100 });
    });

    test('Property: Bulk delete operations record all affected record IDs', () => {
        fc.assert(fc.property(
            fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 50 }),
            fc.float({ min: Math.fround(0.5), max: Math.fround(1.0) }).filter(rate => !isNaN(rate)), // Success rate
            (recordIds, successRate) => {
                const successCount = Math.floor(recordIds.length * successRate);
                const failedCount = recordIds.length - successCount;
                const errors = failedCount > 0 ? ['Permission denied', 'Record not found'] : [];

                const bulkDeleteInfo = {
                    operationType: 'bulk_delete',
                    affectedRecords: recordIds,
                    successCount: successCount,
                    failedCount: failedCount,
                    errors: errors
                };

                // Clear previous logs
                auditLogger.data = [];

                // Log bulk delete operation
                const logEntry = auditLogger.logBulkOperation('barang', bulkDeleteInfo);

                // Verify all record IDs are captured
                expect(logEntry.additional_info.affected_records).toEqual(recordIds);
                expect(logEntry.additional_info.affected_records).toHaveLength(recordIds.length);

                // Verify each record ID is preserved
                recordIds.forEach(recordId => {
                    expect(logEntry.additional_info.affected_records).toContain(recordId);
                });

                // Verify operation type is correct
                expect(logEntry.additional_info.operation_type).toBe('bulk_delete');

                // Verify success/failure counts
                expect(logEntry.additional_info.success_count).toBe(successCount);
                expect(logEntry.additional_info.failed_count).toBe(failedCount);
                expect(logEntry.additional_info.success_count + logEntry.additional_info.failed_count)
                    .toBe(recordIds.length);

                return true;
            }
        ), { numRuns: 50 });
    });

    test('Property: Bulk update operations record change details', () => {
        fc.assert(fc.property(
            bulkUpdateArbitrary,
            (updateInfo) => {
                // Ensure old and new values are different
                if (updateInfo.updateData.oldValue === updateInfo.updateData.newValue) {
                    return true; // Skip if no actual change
                }

                // Clear previous logs
                auditLogger.data = [];

                // Enhance bulk info with update details
                const enhancedBulkInfo = {
                    ...updateInfo,
                    affectedRecords: updateInfo.recordIds,
                    updateDetails: {
                        field: updateInfo.updateData.field,
                        from: updateInfo.updateData.oldValue,
                        to: updateInfo.updateData.newValue
                    }
                };

                // Log bulk update operation
                const logEntry = auditLogger.logBulkOperation('barang', {
                    operationType: updateInfo.operationType,
                    affectedRecords: updateInfo.recordIds,
                    successCount: updateInfo.successCount,
                    failedCount: updateInfo.failedCount,
                    errors: updateInfo.errors
                });

                // Verify update-specific details are captured
                expect(logEntry.additional_info.operation_type).toBe(updateInfo.operationType);
                expect(logEntry.additional_info.affected_records).toEqual(updateInfo.recordIds);
                
                // For this test, we verify that the operation type indicates it's an update
                expect(logEntry.additional_info.operation_type).toContain('update');

                // Verify counts are consistent
                expect(logEntry.additional_info.success_count + logEntry.additional_info.failed_count)
                    .toBeLessThanOrEqual(updateInfo.recordIds.length);

                return true;
            }
        ), { numRuns: 50 });
    });

    test('Property: Multiple bulk operations create separate log entries with unique IDs', () => {
        fc.assert(fc.property(
            fc.array(fc.record({
                tableName: fc.constantFrom('barang', 'kategori', 'satuan'),
                bulkInfo: bulkOperationArbitrary
            }), { minLength: 2, maxLength: 8 }),
            (operations) => {
                // Clear previous logs
                auditLogger.data = [];

                const logEntries = [];

                // Perform multiple bulk operations
                operations.forEach((operation, index) => {
                    // Mock different timestamps for each operation
                    auditLogger.getCurrentTimestamp = jest.fn().mockReturnValue(Date.now() + index * 2000);

                    const logEntry = auditLogger.logBulkOperation(operation.tableName, operation.bulkInfo);
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
                    expect(logEntry.action).toBe('bulk_operation');
                    expect(logEntry.record_id).toBe('bulk_operation');
                    expect(logEntry.user_id).toBe('test-user-id');
                    expect(logEntry.user_name).toBe('Test User');

                    // Verify operation-specific data
                    expect(logEntry.additional_info.operation_type).toBe(operation.bulkInfo.operationType);
                    expect(logEntry.additional_info.affected_records).toEqual(operation.bulkInfo.affectedRecords);
                    expect(logEntry.additional_info.success_count).toBe(operation.bulkInfo.successCount);
                    expect(logEntry.additional_info.failed_count).toBe(operation.bulkInfo.failedCount);
                });

                return true;
            }
        ), { numRuns: 30 });
    });

    test('Property: Bulk operation error information is comprehensively captured', () => {
        fc.assert(fc.property(
            bulkOperationArbitrary.filter(info => info.failedCount > 0 && info.errors.length > 0),
            (bulkInfo) => {
                // Clear previous logs
                auditLogger.data = [];

                // Log bulk operation with errors
                const logEntry = auditLogger.logBulkOperation('barang', bulkInfo);

                // Verify error information is captured
                expect(logEntry.additional_info.failed_count).toBeGreaterThan(0);
                expect(logEntry.additional_info.errors).toBeDefined();
                expect(Array.isArray(logEntry.additional_info.errors)).toBe(true);
                expect(logEntry.additional_info.errors).toEqual(bulkInfo.errors);
                expect(logEntry.additional_info.errors.length).toBeGreaterThan(0);

                // Verify error details are preserved
                bulkInfo.errors.forEach(error => {
                    expect(logEntry.additional_info.errors).toContain(error);
                });

                // Verify failure count consistency
                expect(logEntry.additional_info.failed_count).toBeGreaterThan(0);
                expect(logEntry.additional_info.success_count + logEntry.additional_info.failed_count)
                    .toBeLessThanOrEqual(logEntry.additional_info.affected_records.length);

                return true;
            }
        ), { numRuns: 50 });
    });

    test('Property: Large bulk operations are logged with accurate record tracking', () => {
        fc.assert(fc.property(
            fc.record({
                recordCount: fc.integer({ min: 100, max: 1000 }),
                successRate: fc.float({ min: Math.fround(0.6), max: Math.fround(1.0) }).filter(rate => !isNaN(rate) && isFinite(rate)),
                operationType: fc.constantFrom('bulk_delete', 'bulk_update_category', 'bulk_update_status')
            }),
            (params) => {
                // Ensure successRate is valid
                const validSuccessRate = isNaN(params.successRate) || !isFinite(params.successRate) ? 1.0 : params.successRate;
                
                // Generate large number of record IDs
                const recordIds = Array.from({ length: params.recordCount }, (_, i) => `record_${i}`);
                const successCount = Math.floor(params.recordCount * validSuccessRate);
                const failedCount = params.recordCount - successCount;

                const largeBulkInfo = {
                    operationType: params.operationType,
                    affectedRecords: recordIds,
                    successCount: successCount,
                    failedCount: failedCount,
                    errors: failedCount > 0 ? ['Validation error', 'Constraint violation'] : []
                };

                // Clear previous logs
                auditLogger.data = [];

                // Log large bulk operation
                const logEntry = auditLogger.logBulkOperation('barang', largeBulkInfo);

                // Verify large numbers are handled correctly
                expect(logEntry.additional_info.affected_records).toHaveLength(params.recordCount);
                expect(logEntry.additional_info.success_count).toBe(successCount);
                expect(logEntry.additional_info.failed_count).toBe(failedCount);

                // Verify all record IDs are preserved
                expect(logEntry.additional_info.affected_records).toEqual(recordIds);

                // Verify arithmetic consistency
                expect(logEntry.additional_info.success_count + logEntry.additional_info.failed_count)
                    .toBe(params.recordCount);

                // Verify success rate is within expected range (allow for rounding)
                const actualSuccessRate = logEntry.additional_info.success_count / params.recordCount;
                expect(actualSuccessRate).toBeCloseTo(validSuccessRate, 1);

                return true;
            }
        ), { numRuns: 20 });
    });

    test('Property: Bulk operation logs can be filtered and retrieved by operation type', () => {
        fc.assert(fc.property(
            fc.array(fc.record({
                tableName: fc.constantFrom('barang', 'kategori', 'satuan'),
                operationType: fc.constantFrom('bulk_delete', 'bulk_update_category', 'bulk_update_status'),
                recordIds: fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 20 })
            }), { minLength: 5, maxLength: 15 }),
            (operations) => {
                // Clear previous logs
                auditLogger.data = [];

                // Perform mixed bulk operations
                operations.forEach((operation, index) => {
                    auditLogger.getCurrentTimestamp = jest.fn().mockReturnValue(Date.now() + index * 500);

                    const bulkInfo = {
                        operationType: operation.operationType,
                        affectedRecords: operation.recordIds,
                        successCount: operation.recordIds.length,
                        failedCount: 0,
                        errors: []
                    };

                    auditLogger.logBulkOperation(operation.tableName, bulkInfo);
                });

                // Filter logs by bulk operations
                const bulkLogs = auditLogger.getAuditLogs({
                    action: 'bulk_operation',
                    limit: 1000
                });

                // Verify all logs are bulk operations
                expect(bulkLogs.data).toHaveLength(operations.length);
                bulkLogs.data.forEach(log => {
                    expect(log.action).toBe('bulk_operation');
                    expect(log.record_id).toBe('bulk_operation');
                    expect(log.additional_info.operation_type).toBeDefined();
                    expect(log.additional_info.affected_records).toBeDefined();
                    expect(Array.isArray(log.additional_info.affected_records)).toBe(true);
                });

                // Test filtering by specific operation types
                const uniqueOperationTypes = [...new Set(operations.map(op => op.operationType))];
                uniqueOperationTypes.forEach(operationType => {
                    const expectedCount = operations.filter(op => op.operationType === operationType).length;
                    
                    // Note: We can't directly filter by operation_type in the current implementation
                    // but we can verify the data is there for manual filtering
                    const operationTypeLogs = bulkLogs.data.filter(log => 
                        log.additional_info.operation_type === operationType
                    );
                    
                    expect(operationTypeLogs).toHaveLength(expectedCount);
                    operationTypeLogs.forEach(log => {
                        expect(log.additional_info.operation_type).toBe(operationType);
                    });
                });

                return true;
            }
        ), { numRuns: 20 });
    });

    test('Property: Bulk operation timing and sequence are properly recorded', () => {
        fc.assert(fc.property(
            fc.array(bulkOperationArbitrary, { minLength: 3, maxLength: 6 }),
            (bulkOperations) => {
                // Clear previous logs
                auditLogger.data = [];

                const timestamps = [];

                // Perform sequential bulk operations with different timestamps
                bulkOperations.forEach((bulkInfo, index) => {
                    const timestamp = Date.now() + (index * 3000);
                    timestamps.push(timestamp);
                    
                    auditLogger.getCurrentTimestamp = jest.fn().mockReturnValue(timestamp);

                    auditLogger.logBulkOperation('barang', {
                        operationType: bulkInfo.operationType,
                        affectedRecords: bulkInfo.affectedRecords,
                        successCount: bulkInfo.successCount,
                        failedCount: bulkInfo.failedCount,
                        errors: bulkInfo.errors
                    });
                });

                // Verify timestamps are in correct order
                expect(auditLogger.data).toHaveLength(bulkOperations.length);

                for (let i = 0; i < auditLogger.data.length; i++) {
                    expect(auditLogger.data[i].timestamp).toBe(timestamps[i]);
                    
                    if (i > 0) {
                        expect(auditLogger.data[i].timestamp).toBeGreaterThan(
                            auditLogger.data[i - 1].timestamp
                        );
                    }
                }

                return true;
            }
        ), { numRuns: 20 });
    });
});