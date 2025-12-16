/**
 * Property-Based Test: Audit Logging Completeness
 * Feature: master-barang-komprehensif, Property 4: Audit logging completeness
 * 
 * Tests that for any edit or delete operation, the audit logger records
 * the activity with timestamp and user information.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import fc from 'fast-check';
import { AuditLogger } from '../../js/master-barang/AuditLogger.js';
import { BarangManager } from '../../js/master-barang/BarangManager.js';

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
global.localStorage = localStorageMock;

describe('Property Test: Audit Logging Completeness', () => {
    let auditLogger;
    let barangManager;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(JSON.stringify([]));
        
        // Initialize managers
        auditLogger = new AuditLogger();
        barangManager = new BarangManager();
        
        // Mock getCurrentUser and getCurrentTimestamp
        auditLogger.getCurrentUser = jest.fn().mockReturnValue({
            id: 'test-user-id',
            name: 'Test User'
        });
        auditLogger.getCurrentTimestamp = jest.fn().mockReturnValue(Date.now());
        auditLogger.getClientIP = jest.fn().mockReturnValue('127.0.0.1');
    });

    // Generator for barang data
    const barangArbitrary = fc.record({
        id: fc.string({ minLength: 1, maxLength: 20 }),
        kode: fc.string({ minLength: 1, maxLength: 10 }),
        nama: fc.string({ minLength: 1, maxLength: 50 }),
        kategori_id: fc.string({ minLength: 1, maxLength: 20 }),
        kategori_nama: fc.string({ minLength: 1, maxLength: 30 }),
        satuan_id: fc.string({ minLength: 1, maxLength: 20 }),
        satuan_nama: fc.string({ minLength: 1, maxLength: 20 }),
        harga_beli: fc.integer({ min: 0, max: 1000000 }),
        harga_jual: fc.integer({ min: 0, max: 1000000 }),
        stok: fc.integer({ min: 0, max: 10000 }),
        stok_minimum: fc.integer({ min: 0, max: 100 }),
        deskripsi: fc.string({ maxLength: 100 }),
        status: fc.constantFrom('aktif', 'nonaktif')
    });

    test('Property: Edit operations are completely logged with required fields', () => {
        fc.assert(fc.property(
            barangArbitrary,
            barangArbitrary,
            (originalData, updatedData) => {
                // Ensure different data for update
                const oldData = { ...originalData };
                const newData = { 
                    ...updatedData, 
                    id: originalData.id, // Keep same ID
                    kode: originalData.kode + '_updated' // Ensure different
                };

                // Clear previous logs
                auditLogger.data = [];

                // Perform update operation with audit logging
                const logEntry = auditLogger.logUpdate(
                    'barang',
                    originalData.id,
                    oldData,
                    newData,
                    { operation: 'manual_edit' }
                );

                // Verify log entry exists
                expect(logEntry).toBeDefined();
                expect(logEntry.id).toBeDefined();

                // Verify required audit fields are present
                expect(logEntry.table_name).toBe('barang');
                expect(logEntry.record_id).toBe(originalData.id);
                expect(logEntry.action).toBe('update');
                expect(logEntry.old_data).toEqual(oldData);
                expect(logEntry.new_data).toEqual(newData);

                // Verify timestamp and user information
                expect(logEntry.timestamp).toBeDefined();
                expect(typeof logEntry.timestamp).toBe('number');
                expect(logEntry.user_id).toBe('test-user-id');
                expect(logEntry.user_name).toBe('Test User');
                expect(logEntry.ip_address).toBe('127.0.0.1');
                expect(logEntry.user_agent).toBeDefined();

                // Verify additional info
                expect(logEntry.additional_info).toEqual({ operation: 'manual_edit' });

                // Verify log is stored in audit logger
                const storedLogs = auditLogger.data;
                expect(storedLogs).toHaveLength(1);
                expect(storedLogs[0]).toEqual(logEntry);

                return true;
            }
        ), { numRuns: 100 });
    });

    test('Property: Delete operations are completely logged with required fields', () => {
        fc.assert(fc.property(
            barangArbitrary,
            (barangData) => {
                // Clear previous logs
                auditLogger.data = [];

                // Perform delete operation with audit logging
                const logEntry = auditLogger.logDelete(
                    'barang',
                    barangData.id,
                    barangData,
                    { operation: 'manual_delete', reason: 'user_request' }
                );

                // Verify log entry exists
                expect(logEntry).toBeDefined();
                expect(logEntry.id).toBeDefined();

                // Verify required audit fields are present
                expect(logEntry.table_name).toBe('barang');
                expect(logEntry.record_id).toBe(barangData.id);
                expect(logEntry.action).toBe('delete');
                expect(logEntry.old_data).toEqual(barangData);
                expect(logEntry.new_data).toBeNull();

                // Verify timestamp and user information
                expect(logEntry.timestamp).toBeDefined();
                expect(typeof logEntry.timestamp).toBe('number');
                expect(logEntry.user_id).toBe('test-user-id');
                expect(logEntry.user_name).toBe('Test User');
                expect(logEntry.ip_address).toBe('127.0.0.1');
                expect(logEntry.user_agent).toBeDefined();

                // Verify additional info
                expect(logEntry.additional_info).toEqual({ 
                    operation: 'manual_delete', 
                    reason: 'user_request' 
                });

                // Verify log is stored in audit logger
                const storedLogs = auditLogger.data;
                expect(storedLogs).toHaveLength(1);
                expect(storedLogs[0]).toEqual(logEntry);

                return true;
            }
        ), { numRuns: 100 });
    });

    test('Property: Multiple operations create separate log entries', () => {
        fc.assert(fc.property(
            fc.array(barangArbitrary, { minLength: 2, maxLength: 5 }),
            (barangArray) => {
                // Clear previous logs
                auditLogger.data = [];

                const logEntries = [];

                // Perform multiple operations
                barangArray.forEach((barang, index) => {
                    if (index % 2 === 0) {
                        // Even index: create operation
                        const logEntry = auditLogger.logCreate(
                            'barang',
                            barang.id,
                            barang,
                            { batch_operation: true, index }
                        );
                        logEntries.push(logEntry);
                    } else {
                        // Odd index: delete operation
                        const logEntry = auditLogger.logDelete(
                            'barang',
                            barang.id,
                            barang,
                            { batch_operation: true, index }
                        );
                        logEntries.push(logEntry);
                    }
                });

                // Verify all operations are logged
                expect(auditLogger.data).toHaveLength(barangArray.length);
                expect(logEntries).toHaveLength(barangArray.length);

                // Verify each log entry has unique ID and correct data
                const logIds = new Set();
                logEntries.forEach((logEntry, index) => {
                    expect(logEntry.id).toBeDefined();
                    expect(logIds.has(logEntry.id)).toBe(false);
                    logIds.add(logEntry.id);

                    expect(logEntry.record_id).toBe(barangArray[index].id);
                    expect(logEntry.user_id).toBe('test-user-id');
                    expect(logEntry.user_name).toBe('Test User');
                    expect(logEntry.additional_info.batch_operation).toBe(true);
                    expect(logEntry.additional_info.index).toBe(index);
                });

                return true;
            }
        ), { numRuns: 50 });
    });

    test('Property: Audit logs maintain chronological order', () => {
        fc.assert(fc.property(
            fc.array(barangArbitrary, { minLength: 3, maxLength: 10 }),
            (barangArray) => {
                // Clear previous logs
                auditLogger.data = [];

                const timestamps = [];
                
                // Perform operations with slight delays to ensure different timestamps
                barangArray.forEach((barang, index) => {
                    // Mock different timestamps
                    const timestamp = Date.now() + index * 1000;
                    auditLogger.getCurrentTimestamp = jest.fn().mockReturnValue(timestamp);
                    timestamps.push(timestamp);

                    auditLogger.logCreate('barang', barang.id, barang);
                });

                // Verify logs are stored with correct timestamps
                expect(auditLogger.data).toHaveLength(barangArray.length);

                // Check chronological order
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
        ), { numRuns: 30 });
    });

    test('Property: Audit logs can be filtered and retrieved correctly', () => {
        fc.assert(fc.property(
            fc.array(barangArbitrary, { minLength: 5, maxLength: 15 }),
            fc.constantFrom('barang', 'kategori', 'satuan'),
            fc.constantFrom('create', 'update', 'delete'),
            (barangArray, tableName, actionType) => {
                // Clear previous logs
                auditLogger.data = [];

                // Create mixed logs
                barangArray.forEach((barang, index) => {
                    const currentTable = index % 2 === 0 ? tableName : 'other_table';
                    const currentAction = index % 3 === 0 ? actionType : 'other_action';
                    
                    auditLogger.logActivity({
                        table_name: currentTable,
                        record_id: barang.id,
                        action: currentAction,
                        new_data: barang
                    });
                });

                // Filter logs by table and action
                const filteredLogs = auditLogger.getAuditLogs({
                    table_name: tableName,
                    action: actionType,
                    limit: 1000
                });

                // Verify filtering works correctly
                expect(filteredLogs.data).toBeDefined();
                expect(Array.isArray(filteredLogs.data)).toBe(true);

                // All returned logs should match the filter criteria
                filteredLogs.data.forEach(log => {
                    expect(log.table_name).toBe(tableName);
                    expect(log.action).toBe(actionType);
                    expect(log.user_id).toBe('test-user-id');
                    expect(log.user_name).toBe('Test User');
                });

                // Count should match expected filtered results
                const expectedCount = barangArray.filter((_, index) => 
                    index % 2 === 0 && index % 3 === 0
                ).length;
                expect(filteredLogs.data).toHaveLength(expectedCount);

                return true;
            }
        ), { numRuns: 30 });
    });
});