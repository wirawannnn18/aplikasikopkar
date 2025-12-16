/**
 * Property-Based Test: Data Change Audit Logging
 * Feature: master-barang-komprehensif, Property 29: Data change audit logging
 * 
 * Tests that for any barang data modification, the audit logger records
 * timestamp, user, and change details.
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

describe('Property Test: Data Change Audit Logging', () => {
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
        auditLogger.getClientIP = jest.fn().mockReturnValue('192.168.1.100');
    });

    // Generator for barang data changes
    const barangChangeArbitrary = fc.record({
        id: fc.string({ minLength: 1, maxLength: 20 }),
        field: fc.constantFrom('nama', 'harga_beli', 'harga_jual', 'stok', 'kategori_id', 'satuan_id'),
        oldValue: fc.oneof(
            fc.string({ minLength: 1, maxLength: 50 }),
            fc.integer({ min: 0, max: 1000000 })
        ),
        newValue: fc.oneof(
            fc.string({ minLength: 1, maxLength: 50 }),
            fc.integer({ min: 0, max: 1000000 })
        )
    });

    // Generator for complete barang data
    const barangDataArbitrary = fc.record({
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
        status: fc.constantFrom('aktif', 'nonaktif'),
        created_at: fc.integer({ min: 1600000000000, max: Date.now() }),
        updated_at: fc.integer({ min: 1600000000000, max: Date.now() }),
        created_by: fc.string({ minLength: 1, maxLength: 20 }),
        updated_by: fc.string({ minLength: 1, maxLength: 20 })
    });

    test('Property: Data modifications are logged with complete change details', () => {
        fc.assert(fc.property(
            barangDataArbitrary,
            barangChangeArbitrary,
            (originalData, change) => {
                // Create modified data
                const modifiedData = {
                    ...originalData,
                    [change.field]: change.newValue,
                    updated_at: Date.now(),
                    updated_by: 'test-user-id'
                };

                // Ensure old and new values are different
                if (originalData[change.field] === change.newValue) {
                    return true; // Skip if no actual change
                }

                // Clear previous logs
                auditLogger.data = [];

                // Log the data change
                const logEntry = auditLogger.logUpdate(
                    'barang',
                    originalData.id,
                    originalData,
                    modifiedData,
                    { 
                        changed_field: change.field,
                        change_type: 'field_update',
                        source: 'user_interface'
                    }
                );

                // Verify log entry contains complete change details
                expect(logEntry).toBeDefined();
                expect(logEntry.id).toBeDefined();
                expect(logEntry.table_name).toBe('barang');
                expect(logEntry.record_id).toBe(originalData.id);
                expect(logEntry.action).toBe('update');

                // Verify timestamp is recorded
                expect(logEntry.timestamp).toBeDefined();
                expect(typeof logEntry.timestamp).toBe('number');
                expect(logEntry.timestamp).toBeGreaterThan(0);

                // Verify user information is recorded
                expect(logEntry.user_id).toBe('test-user-id');
                expect(logEntry.user_name).toBe('Test User');
                expect(logEntry.ip_address).toBe('192.168.1.100');
                expect(logEntry.user_agent).toBeDefined();

                // Verify old and new data are recorded
                expect(logEntry.old_data).toEqual(originalData);
                expect(logEntry.new_data).toEqual(modifiedData);

                // Verify additional change details
                expect(logEntry.additional_info.changed_field).toBe(change.field);
                expect(logEntry.additional_info.change_type).toBe('field_update');
                expect(logEntry.additional_info.source).toBe('user_interface');

                // Verify the change is detectable from the logged data
                expect(logEntry.old_data[change.field]).not.toEqual(logEntry.new_data[change.field]);

                return true;
            }
        ), { numRuns: 100 });
    });

    test('Property: Multiple field changes in single update are properly logged', () => {
        fc.assert(fc.property(
            barangDataArbitrary,
            fc.array(barangChangeArbitrary, { minLength: 2, maxLength: 5 }),
            (originalData, changes) => {
                // Apply all changes to create modified data
                let modifiedData = { ...originalData };
                const changedFields = [];

                changes.forEach(change => {
                    if (modifiedData[change.field] !== change.newValue) {
                        modifiedData[change.field] = change.newValue;
                        changedFields.push(change.field);
                    }
                });

                // Skip if no actual changes
                if (changedFields.length === 0) {
                    return true;
                }

                modifiedData.updated_at = Date.now();
                modifiedData.updated_by = 'test-user-id';

                // Clear previous logs
                auditLogger.data = [];

                // Log the multi-field update
                const logEntry = auditLogger.logUpdate(
                    'barang',
                    originalData.id,
                    originalData,
                    modifiedData,
                    { 
                        changed_fields: changedFields,
                        change_count: changedFields.length,
                        change_type: 'multi_field_update'
                    }
                );

                // Verify all change details are captured
                expect(logEntry.old_data).toEqual(originalData);
                expect(logEntry.new_data).toEqual(modifiedData);
                expect(logEntry.additional_info.changed_fields).toEqual(changedFields);
                expect(logEntry.additional_info.change_count).toBe(changedFields.length);

                // Verify each changed field is different between old and new data
                changedFields.forEach(field => {
                    expect(logEntry.old_data[field]).not.toEqual(logEntry.new_data[field]);
                });

                // Verify unchanged fields remain the same
                Object.keys(originalData).forEach(field => {
                    if (!changedFields.includes(field) && field !== 'updated_at' && field !== 'updated_by') {
                        expect(logEntry.old_data[field]).toEqual(logEntry.new_data[field]);
                    }
                });

                return true;
            }
        ), { numRuns: 50 });
    });

    test('Property: User context is consistently recorded across all changes', () => {
        fc.assert(fc.property(
            fc.array(barangDataArbitrary, { minLength: 3, maxLength: 8 }),
            fc.record({
                userId: fc.string({ minLength: 1, maxLength: 20 }),
                userName: fc.string({ minLength: 1, maxLength: 30 }),
                ipAddress: fc.string({ minLength: 7, maxLength: 15 })
            }),
            (barangArray, userContext) => {
                // Set up user context
                auditLogger.getCurrentUser = jest.fn().mockReturnValue({
                    id: userContext.userId,
                    name: userContext.userName
                });
                auditLogger.getClientIP = jest.fn().mockReturnValue(userContext.ipAddress);

                // Clear previous logs
                auditLogger.data = [];

                // Perform multiple changes with the same user context
                barangArray.forEach((barang, index) => {
                    const modifiedBarang = {
                        ...barang,
                        nama: `${barang.nama}_modified_${index}`,
                        updated_at: Date.now() + index,
                        updated_by: userContext.userId
                    };

                    auditLogger.logUpdate(
                        'barang',
                        barang.id,
                        barang,
                        modifiedBarang,
                        { modification_index: index }
                    );
                });

                // Verify all logs have consistent user context
                expect(auditLogger.data).toHaveLength(barangArray.length);

                auditLogger.data.forEach((logEntry, index) => {
                    expect(logEntry.user_id).toBe(userContext.userId);
                    expect(logEntry.user_name).toBe(userContext.userName);
                    expect(logEntry.ip_address).toBe(userContext.ipAddress);
                    expect(logEntry.user_agent).toBeDefined();
                    expect(logEntry.additional_info.modification_index).toBe(index);
                });

                return true;
            }
        ), { numRuns: 30 });
    });

    test('Property: Timestamp ordering reflects actual change sequence', () => {
        fc.assert(fc.property(
            fc.array(barangDataArbitrary, { minLength: 3, maxLength: 6 }),
            (barangArray) => {
                // Clear previous logs
                auditLogger.data = [];

                const timestamps = [];

                // Perform sequential changes with incrementing timestamps
                barangArray.forEach((barang, index) => {
                    const timestamp = Date.now() + (index * 1000);
                    timestamps.push(timestamp);
                    
                    auditLogger.getCurrentTimestamp = jest.fn().mockReturnValue(timestamp);

                    const modifiedBarang = {
                        ...barang,
                        stok: barang.stok + index + 1,
                        updated_at: timestamp
                    };

                    auditLogger.logUpdate(
                        'barang',
                        barang.id,
                        barang,
                        modifiedBarang,
                        { sequence_number: index }
                    );
                });

                // Verify timestamps are in correct order
                expect(auditLogger.data).toHaveLength(barangArray.length);

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

    test('Property: Change details enable data reconstruction', () => {
        fc.assert(fc.property(
            barangDataArbitrary,
            fc.array(barangChangeArbitrary, { minLength: 1, maxLength: 3 }),
            (originalData, changes) => {
                // Apply changes sequentially and log each step
                let currentData = { ...originalData };
                const logEntries = [];

                // Clear previous logs
                auditLogger.data = [];

                changes.forEach((change, index) => {
                    const previousData = { ...currentData };
                    
                    // Apply change if it's actually different
                    if (currentData[change.field] !== change.newValue) {
                        currentData[change.field] = change.newValue;
                        currentData.updated_at = Date.now() + index;

                        const logEntry = auditLogger.logUpdate(
                            'barang',
                            originalData.id,
                            previousData,
                            { ...currentData },
                            { step: index, field_changed: change.field }
                        );

                        logEntries.push(logEntry);
                    }
                });

                // Skip if no actual changes were made
                if (logEntries.length === 0) {
                    return true;
                }

                // Verify we can reconstruct the change history
                let reconstructedData = { ...originalData };

                logEntries.forEach(logEntry => {
                    // Verify the old_data matches our current reconstruction
                    expect(logEntry.old_data).toEqual(reconstructedData);
                    
                    // Apply the change from the log
                    reconstructedData = { ...logEntry.new_data };
                });

                // Final reconstructed data should match the final current data
                expect(reconstructedData).toEqual(currentData);

                // Verify each log entry has the required audit information
                logEntries.forEach(logEntry => {
                    expect(logEntry.timestamp).toBeDefined();
                    expect(logEntry.user_id).toBe('test-user-id');
                    expect(logEntry.user_name).toBe('Test User');
                    expect(logEntry.old_data).toBeDefined();
                    expect(logEntry.new_data).toBeDefined();
                });

                return true;
            }
        ), { numRuns: 50 });
    });
});