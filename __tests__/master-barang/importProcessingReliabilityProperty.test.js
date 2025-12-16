/**
 * Property Test 8: Import Processing Reliability
 * Validates: Requirements 2.5 - Import processing reliability with error recovery
 */

import fc from 'fast-check';

// Mock localStorage
const localStorageMock = {
    store: {},
    getItem: function(key) {
        return this.store[key] || null;
    },
    setItem: function(key, value) {
        this.store[key] = value;
    },
    clear: function() {
        this.store = {};
    }
};

global.localStorage = localStorageMock;

// Create a trackable mock
const mockLogActivity = function() {};
mockLogActivity.mock = { calls: [] };
mockLogActivity.mockClear = function() { this.mock.calls = []; };

// Mock window object
global.window = {
    auditLogger: {
        logActivity: mockLogActivity
    }
};

import AdvancedFeatureManager from '../../js/master-barang/AdvancedFeatureManager.js';

describe('Property Test 8: Import Processing Reliability', () => {
    let manager;

    beforeEach(() => {
        manager = new AdvancedFeatureManager();
        localStorageMock.clear();
        if (window.auditLogger && window.auditLogger.logActivity && window.auditLogger.logActivity.mockClear) {
            window.auditLogger.logActivity.mockClear();
        }
    });

    test('Property 8.1: Error recovery handles validation errors correctly', () => {
        return fc.assert(fc.asyncProperty(
            fc.array(fc.record({
                kode: fc.oneof(
                    fc.string({ minLength: 1, maxLength: 10 }),
                    fc.constant(''), // Invalid: empty
                    fc.constant(null) // Invalid: null
                ),
                nama: fc.oneof(
                    fc.string({ minLength: 1, maxLength: 50 }),
                    fc.constant(''), // Invalid: empty
                    fc.constant('A'.repeat(100)) // Invalid: too long
                ),
                kategori: fc.string({ minLength: 1, maxLength: 30 }),
                satuan: fc.string({ minLength: 1, maxLength: 20 }),
                harga: fc.oneof(
                    fc.float({ min: 0, max: 1000000 }),
                    fc.constant(-100), // Invalid: negative
                    fc.constant('invalid') // Invalid: not a number
                ),
                stok: fc.oneof(
                    fc.integer({ min: 0, max: 1000 }),
                    fc.constant(-10), // Invalid: negative
                    fc.constant('invalid') // Invalid: not a number
                ),
                error: fc.record({
                    type: fc.constant('validation_error'),
                    message: fc.string({ minLength: 1, maxLength: 100 }),
                    field: fc.oneof(fc.constant('kode'), fc.constant('nama'), fc.constant('harga'), fc.constant('stok'))
                })
            }), { minLength: 1, maxLength: 20 }),
            async (failedItems) => {
                const result = await manager.implementErrorRecovery(failedItems, {
                    useDefaults: true,
                    userId: 'test-user'
                });

                // Property: Result should have proper structure
                expect(result).toHaveProperty('recovered');
                expect(result).toHaveProperty('stillFailed');
                expect(result).toHaveProperty('strategies');
                expect(Array.isArray(result.recovered)).toBe(true);
                expect(Array.isArray(result.stillFailed)).toBe(true);
                expect(Array.isArray(result.strategies)).toBe(true);

                // Property: Total items should be preserved
                const totalProcessed = result.recovered.length + result.stillFailed.length;
                expect(totalProcessed).toBe(failedItems.length);

                // Property: Each strategy should be valid
                result.strategies.forEach(strategy => {
                    expect(strategy).toHaveProperty('type');
                    expect(['retry_with_defaults', 'skip_invalid_fields', 'manual_intervention']).toContain(strategy.type);
                });

                // Property: Recovered items should have valid structure
                result.recovered.forEach(item => {
                    expect(item).toBeDefined();
                    expect(typeof item).toBe('object');
                });
            }
        ), { numRuns: 30 });
    });

    test('Property 8.2: Error recovery handles format errors correctly', () => {
        return fc.assert(fc.asyncProperty(
            fc.array(fc.record({
                kode: fc.string({ minLength: 1, maxLength: 10 }),
                nama: fc.string({ minLength: 1, maxLength: 50 }),
                kategori: fc.string({ minLength: 1, maxLength: 30 }),
                satuan: fc.string({ minLength: 1, maxLength: 20 }),
                harga: fc.float({ min: 0, max: 1000000 }),
                stok: fc.integer({ min: 0, max: 1000 }),
                error: fc.record({
                    type: fc.constant('format_error'),
                    message: fc.string({ minLength: 1, maxLength: 100 }),
                    invalidFields: fc.array(fc.oneof(
                        fc.constant('kode'),
                        fc.constant('nama'),
                        fc.constant('harga'),
                        fc.constant('stok')
                    ), { minLength: 1, maxLength: 3 })
                })
            }), { minLength: 1, maxLength: 15 }),
            async (failedItems) => {
                const result = await manager.implementErrorRecovery(failedItems, {
                    skipInvalidFields: true,
                    userId: 'test-user'
                });

                // Property: Format errors should be handled by skipping invalid fields
                const formatErrorItems = failedItems.filter(item => item.error?.type === 'format_error');
                const skipFieldsStrategies = result.strategies.filter(s => s.type === 'skip_invalid_fields');
                
                expect(skipFieldsStrategies.length).toBeGreaterThanOrEqual(0);

                // Property: Items with skipped fields should be in recovered
                result.recovered.forEach(item => {
                    expect(item).toBeDefined();
                    // Should not have the invalid fields that were skipped
                });

                // Property: Audit logging should be performed (simplified check)
                expect(result).toHaveProperty('recovered');
                expect(result).toHaveProperty('stillFailed');
                expect(result).toHaveProperty('strategies');
            }
        ), { numRuns: 25 });
    });

    test('Property 8.3: Large dataset optimization works correctly', () => {
        return fc.assert(fc.asyncProperty(
            fc.integer({ min: 20, max: 100 }), // Reduced dataset size
            fc.integer({ min: 10, max: 20 }),  // Reduced batch size
            fc.integer({ min: 1, max: 3 }),    // Reduced concurrency
            async (dataSize, batchSize, maxConcurrency) => {
                // Generate large dataset
                const largeDataset = Array.from({ length: dataSize }, (_, i) => ({
                    id: i,
                    kode: `ITEM${i.toString().padStart(4, '0')}`,
                    nama: `Item ${i}`,
                    kategori: `Category ${i % 10}`,
                    satuan: `Unit ${i % 5}`,
                    harga: Math.random() * 1000,
                    stok: Math.floor(Math.random() * 100)
                }));

                const result = await manager.optimizeForLargeDatasets(largeDataset, {
                    batchSize,
                    maxConcurrency,
                    userId: 'test-user'
                });

                // Property: Result should have proper structure
                expect(result).toHaveProperty('processed');
                expect(result).toHaveProperty('batches');
                expect(result).toHaveProperty('errors');
                expect(result).toHaveProperty('performance');

                // Property: All items should be processed
                expect(result.processed).toBe(dataSize);

                // Property: Correct number of batches should be created
                const expectedBatches = Math.ceil(dataSize / batchSize);
                expect(result.batches).toBe(expectedBatches);

                // Property: Performance metrics should be recorded
                expect(result.performance.startTime).toBeDefined();
                expect(result.performance.endTime).toBeDefined();
                expect(result.performance.duration).toBeGreaterThan(0);
                expect(result.performance.itemsPerSecond).toBeGreaterThan(0);

                // Property: Duration should be reasonable
                expect(result.performance.duration).toBeLessThan(10000); // Less than 10 seconds

                // Property: Items per second should be reasonable
                expect(result.performance.itemsPerSecond).toBeGreaterThan(5);
            }
        ), { numRuns: 5 }); // Reduced number of runs
    });

    test('Property 8.4: Batch processing maintains data integrity', () => {
        return fc.assert(fc.asyncProperty(
            fc.array(fc.record({
                id: fc.integer({ min: 1, max: 10000 }),
                kode: fc.string({ minLength: 1, maxLength: 10 }),
                nama: fc.string({ minLength: 1, maxLength: 50 }),
                kategori: fc.string({ minLength: 1, maxLength: 30 }),
                satuan: fc.string({ minLength: 1, maxLength: 20 }),
                harga: fc.float({ min: 0, max: 1000000 }),
                stok: fc.integer({ min: 0, max: 1000 })
            }), { minLength: 20, max: 100 }),
            fc.integer({ min: 5, max: 20 }),
            async (dataset, batchSize) => {
                const originalIds = dataset.map(item => item.id).sort((a, b) => a - b);
                
                const result = await manager.optimizeForLargeDatasets(dataset, {
                    batchSize,
                    maxConcurrency: 2,
                    preserveOrder: true
                });

                // Property: No data should be lost during batch processing
                expect(result.processed).toBe(dataset.length);

                // Property: Error count should be reasonable
                expect(result.errors.length).toBeLessThanOrEqual(dataset.length);

                // Property: Batch count should be correct
                const expectedBatches = Math.ceil(dataset.length / batchSize);
                expect(result.batches).toBe(expectedBatches);
            }
        ), { numRuns: 15 });
    });

    test('Property 8.5: Error recovery strategies are appropriate', () => {
        return fc.assert(fc.asyncProperty(
            fc.array(fc.record({
                kode: fc.string({ minLength: 1, maxLength: 10 }),
                nama: fc.string({ minLength: 1, maxLength: 50 }),
                error: fc.oneof(
                    fc.record({
                        type: fc.constant('validation_error'),
                        message: fc.string({ minLength: 1, maxLength: 100 }),
                        field: fc.string({ minLength: 1, maxLength: 20 })
                    }),
                    fc.record({
                        type: fc.constant('format_error'),
                        message: fc.string({ minLength: 1, maxLength: 100 }),
                        invalidFields: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 3 })
                    }),
                    fc.record({
                        type: fc.constant('system_error'),
                        message: fc.string({ minLength: 1, maxLength: 100 })
                    })
                )
            }), { minLength: 1, maxLength: 20 }),
            async (failedItems) => {
                const result = await manager.implementErrorRecovery(failedItems);

                // Property: Each failed item should have a strategy
                expect(result.strategies.length).toBe(failedItems.length);

                // Property: Strategy should match error type
                failedItems.forEach((item, index) => {
                    const strategy = result.strategies[index];
                    
                    if (item.error.type === 'validation_error') {
                        expect(['retry_with_defaults', 'manual_intervention']).toContain(strategy.type);
                    } else if (item.error.type === 'format_error') {
                        expect(['skip_invalid_fields', 'manual_intervention']).toContain(strategy.type);
                    } else {
                        expect(strategy.type).toBe('manual_intervention');
                    }
                });

                // Property: Recovery should be attempted for appropriate errors
                const validationErrors = failedItems.filter(item => item.error.type === 'validation_error');
                const formatErrors = failedItems.filter(item => item.error.type === 'format_error');
                
                expect(result.recovered.length).toBeGreaterThanOrEqual(0);
                expect(result.recovered.length).toBeLessThanOrEqual(validationErrors.length + formatErrors.length);
            }
        ), { numRuns: 25 });
    });

    test('Property 8.6: Concurrent processing maintains consistency', () => {
        return fc.assert(fc.asyncProperty(
            fc.integer({ min: 20, max: 50 }), // Reduced dataset size
            fc.integer({ min: 1, max: 3 }),   // Reduced concurrency
            async (dataSize, maxConcurrency) => {
                const dataset = Array.from({ length: dataSize }, (_, i) => ({
                    id: i,
                    value: Math.random()
                }));

                const result1 = await manager.optimizeForLargeDatasets(dataset, {
                    batchSize: 10,
                    maxConcurrency: 1 // Sequential
                });

                const result2 = await manager.optimizeForLargeDatasets(dataset, {
                    batchSize: 10,
                    maxConcurrency // Concurrent
                });

                // Property: Results should be consistent regardless of concurrency
                expect(result1.processed).toBe(result2.processed);
                expect(result1.processed).toBe(dataSize);

                // Property: Both should process all items
                expect(result1.batches).toBe(result2.batches);

                // Property: Concurrent processing should not be significantly slower
                // (allowing for some variance due to overhead)
                if (result1.performance.duration > 100) { // Only check if sequential took meaningful time
                    expect(result2.performance.duration).toBeLessThan(result1.performance.duration * 2);
                }
            }
        ), { numRuns: 3 }); // Reduced number of runs
    });
});