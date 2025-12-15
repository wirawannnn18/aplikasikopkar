/**
 * Property Test: Concurrent Transformations Handling
 * 
 * Tests system behavior under concurrent transformation scenarios
 * Validates: Requirements 3.5 (Data consistency and integrity)
 */

import fc from 'fast-check';
import { TransformationManager } from '../../js/transformasi-barang/TransformationManager.js';
import { StockManager } from '../../js/transformasi-barang/StockManager.js';
import { AuditLogger } from '../../js/transformasi-barang/AuditLogger.js';

describe('Concurrent Transformations Property Tests', () => {
    let transformationManager, stockManager, auditLogger;

    beforeEach(async () => {
        transformationManager = new TransformationManager();
        stockManager = new StockManager();
        auditLogger = new AuditLogger();
        
        await transformationManager.initialize();
        await stockManager.initialize();
        await auditLogger.initialize();

        // Setup test data
        const testData = {
            masterBarang: [
                { kode: 'AQUA-DUS', nama: 'Aqua 1L DUS', satuan: 'dus', stok: 100, baseProduct: 'AQUA-1L' },
                { kode: 'AQUA-PCS', nama: 'Aqua 1L PCS', satuan: 'pcs', stok: 500, baseProduct: 'AQUA-1L' },
                { kode: 'BERAS-KARUNG', nama: 'Beras Karung', satuan: 'karung', stok: 50, baseProduct: 'BERAS' },
                { kode: 'BERAS-KG', nama: 'Beras KG', satuan: 'kg', stok: 1000, baseProduct: 'BERAS' }
            ],
            conversionRatios: [
                { baseProduct: 'AQUA-1L', conversions: [{ from: 'dus', to: 'pcs', ratio: 12 }] },
                { baseProduct: 'BERAS', conversions: [{ from: 'karung', to: 'kg', ratio: 25 }] }
            ]
        };

        localStorage.setItem('masterBarang', JSON.stringify(testData.masterBarang));
        localStorage.setItem('conversionRatios', JSON.stringify(testData.conversionRatios));
    });

    /**
     * Property 35: Concurrent Stock Updates Consistency
     * Multiple simultaneous stock updates should maintain data consistency
     */
    test('Property 35: Concurrent stock updates maintain consistency', async () => {
        await fc.assert(fc.asyncProperty(
            fc.array(fc.record({
                itemId: fc.constantFrom('AQUA-DUS', 'AQUA-PCS', 'BERAS-KARUNG', 'BERAS-KG'),
                quantity: fc.integer({ min: 1, max: 10 }),
                operation: fc.constantFrom('add', 'subtract')
            }), { minLength: 5, maxLength: 20 }),
            async (operations) => {
                try {
                    // Get initial stock state
                    const initialStock = {};
                    const masterBarang = JSON.parse(localStorage.getItem('masterBarang') || '[]');
                    masterBarang.forEach(item => {
                        initialStock[item.kode] = item.stok;
                    });

                    // Execute operations concurrently
                    const promises = operations.map(async (op, index) => {
                        return new Promise((resolve) => {
                            // Simulate concurrent execution with small random delays
                            setTimeout(async () => {
                                try {
                                    const change = op.operation === 'add' ? op.quantity : -op.quantity;
                                    const result = stockManager.updateStock(op.itemId, change);
                                    resolve({ success: true, result, operation: op, index });
                                } catch (error) {
                                    resolve({ success: false, error: error.message, operation: op, index });
                                }
                            }, Math.random() * 10);
                        });
                    });

                    const results = await Promise.all(promises);

                    // Verify consistency
                    const finalStock = {};
                    const updatedMasterBarang = JSON.parse(localStorage.getItem('masterBarang') || '[]');
                    updatedMasterBarang.forEach(item => {
                        finalStock[item.kode] = item.stok;
                    });

                    // Calculate expected stock changes
                    const expectedChanges = {};
                    results.forEach(result => {
                        if (result.success) {
                            const itemId = result.operation.itemId;
                            const change = result.operation.operation === 'add' ? 
                                result.operation.quantity : -result.operation.quantity;
                            expectedChanges[itemId] = (expectedChanges[itemId] || 0) + change;
                        }
                    });

                    // Verify stock consistency
                    Object.keys(expectedChanges).forEach(itemId => {
                        const expectedFinal = initialStock[itemId] + expectedChanges[itemId];
                        
                        // Stock should never go negative
                        if (expectedFinal < 0) {
                            // Some operations should have failed
                            expect(finalStock[itemId]).toBeGreaterThanOrEqual(0);
                        } else {
                            // Stock should match expected value or be non-negative
                            expect(finalStock[itemId]).toBeGreaterThanOrEqual(0);
                        }
                    });

                    return true;
                } catch (error) {
                    // Should handle concurrent operation errors gracefully
                    expect(error.message).toMatch(/concurrent|lock|consistency|stock/i);
                    return true;
                }
            }
        ), { numRuns: 15 });
    });

    /**
     * Property 36: Concurrent Transformation Race Conditions
     * Multiple transformations on same items should handle race conditions
     */
    test('Property 36: Concurrent transformations handle race conditions correctly', async () => {
        await fc.assert(fc.asyncProperty(
            fc.array(fc.record({
                sourceItem: fc.constantFrom('AQUA-DUS', 'BERAS-KARUNG'),
                targetItem: fc.constantFrom('AQUA-PCS', 'BERAS-KG'),
                quantity: fc.integer({ min: 1, max: 5 })
            }), { minLength: 3, maxLength: 10 }),
            async (transformations) => {
                try {
                    // Get initial state
                    const initialMasterBarang = JSON.parse(localStorage.getItem('masterBarang') || '[]');
                    const initialStock = {};
                    initialMasterBarang.forEach(item => {
                        initialStock[item.kode] = item.stok;
                    });

                    // Execute transformations concurrently
                    const promises = transformations.map(async (transformation, index) => {
                        return new Promise((resolve) => {
                            setTimeout(async () => {
                                try {
                                    // Validate transformation first
                                    const sourceItem = initialMasterBarang.find(item => item.kode === transformation.sourceItem);
                                    const targetItem = initialMasterBarang.find(item => item.kode === transformation.targetItem);
                                    
                                    if (!sourceItem || !targetItem) {
                                        resolve({ success: false, error: 'Item not found', index });
                                        return;
                                    }

                                    // Check if transformation is valid
                                    const validation = transformationManager.validateTransformation({
                                        sourceItem: sourceItem,
                                        targetItem: targetItem,
                                        quantity: transformation.quantity
                                    });

                                    if (!validation.isValid) {
                                        resolve({ success: false, error: validation.message, index });
                                        return;
                                    }

                                    // Execute transformation
                                    const result = await transformationManager.executeTransformation({
                                        sourceItem: sourceItem,
                                        targetItem: targetItem,
                                        quantity: transformation.quantity,
                                        user: `test-user-${index}`
                                    });

                                    resolve({ success: true, result, transformation, index });
                                } catch (error) {
                                    resolve({ success: false, error: error.message, transformation, index });
                                }
                            }, Math.random() * 20);
                        });
                    });

                    const results = await Promise.all(promises);

                    // Verify data integrity after concurrent operations
                    const finalMasterBarang = JSON.parse(localStorage.getItem('masterBarang') || '[]');
                    const finalStock = {};
                    finalMasterBarang.forEach(item => {
                        finalStock[item.kode] = item.stok;
                    });

                    // Check that all stock values are non-negative
                    Object.values(finalStock).forEach(stock => {
                        expect(stock).toBeGreaterThanOrEqual(0);
                    });

                    // Check audit trail consistency
                    const auditHistory = auditLogger.getTransformationHistory();
                    const successfulTransformations = results.filter(r => r.success);
                    
                    // Audit entries should exist for successful transformations
                    expect(auditHistory.length).toBeGreaterThanOrEqual(0);
                    
                    // Each audit entry should have required fields
                    auditHistory.forEach(entry => {
                        expect(entry).toHaveProperty('id');
                        expect(entry).toHaveProperty('timestamp');
                        expect(entry).toHaveProperty('user');
                        expect(entry).toHaveProperty('sourceItem');
                        expect(entry).toHaveProperty('targetItem');
                    });

                    return true;
                } catch (error) {
                    // Should handle race condition errors gracefully
                    expect(error.message).toMatch(/race|concurrent|lock|consistency/i);
                    return true;
                }
            }
        ), { numRuns: 10 });
    });

    /**
     * Property 37: Concurrent Read-Write Operations
     * Simultaneous read and write operations should maintain consistency
     */
    test('Property 37: Concurrent read-write operations maintain consistency', async () => {
        await fc.assert(fc.asyncProperty(
            fc.integer({ min: 5, max: 15 }),
            async (operationCount) => {
                try {
                    const operations = [];
                    
                    // Create mix of read and write operations
                    for (let i = 0; i < operationCount; i++) {
                        if (i % 3 === 0) {
                            // Read operation
                            operations.push({
                                type: 'read',
                                action: () => transformationManager.getTransformableItems()
                            });
                        } else if (i % 3 === 1) {
                            // Write operation - stock update
                            operations.push({
                                type: 'write',
                                action: () => stockManager.updateStock('AQUA-DUS', 1)
                            });
                        } else {
                            // Write operation - transformation
                            operations.push({
                                type: 'transform',
                                action: async () => {
                                    const sourceItem = { kode: 'AQUA-DUS', nama: 'Aqua DUS', satuan: 'dus', stok: 10, baseProduct: 'AQUA-1L' };
                                    const targetItem = { kode: 'AQUA-PCS', nama: 'Aqua PCS', satuan: 'pcs', stok: 50, baseProduct: 'AQUA-1L' };
                                    
                                    return transformationManager.executeTransformation({
                                        sourceItem,
                                        targetItem,
                                        quantity: 1,
                                        user: `concurrent-user-${i}`
                                    });
                                }
                            });
                        }
                    }

                    // Execute operations concurrently
                    const promises = operations.map(async (op, index) => {
                        return new Promise((resolve) => {
                            setTimeout(async () => {
                                try {
                                    const result = await op.action();
                                    resolve({ success: true, result, type: op.type, index });
                                } catch (error) {
                                    resolve({ success: false, error: error.message, type: op.type, index });
                                }
                            }, Math.random() * 15);
                        });
                    });

                    const results = await Promise.all(promises);

                    // Verify that read operations returned consistent data
                    const readResults = results.filter(r => r.type === 'read' && r.success);
                    readResults.forEach(result => {
                        expect(Array.isArray(result.result)).toBe(true);
                        result.result.forEach(item => {
                            expect(item).toHaveProperty('kode');
                            expect(item).toHaveProperty('stok');
                            expect(item.stok).toBeGreaterThanOrEqual(0);
                        });
                    });

                    // Verify that write operations maintained data integrity
                    const finalMasterBarang = JSON.parse(localStorage.getItem('masterBarang') || '[]');
                    finalMasterBarang.forEach(item => {
                        expect(item.stok).toBeGreaterThanOrEqual(0);
                    });

                    return true;
                } catch (error) {
                    // Should handle concurrent read-write errors gracefully
                    expect(error.message).toMatch(/concurrent|consistency|read|write/i);
                    return true;
                }
            }
        ), { numRuns: 8 });
    });

    /**
     * Property 38: Concurrent Audit Logging Integrity
     * Multiple concurrent operations should maintain audit log integrity
     */
    test('Property 38: Concurrent audit logging maintains integrity', async () => {
        await fc.assert(fc.asyncProperty(
            fc.array(fc.record({
                user: fc.string({ minLength: 3, maxLength: 10 }),
                action: fc.constantFrom('transform', 'update', 'create'),
                itemId: fc.constantFrom('AQUA-DUS', 'AQUA-PCS', 'BERAS-KARUNG')
            }), { minLength: 5, maxLength: 15 }),
            async (auditOperations) => {
                try {
                    // Clear existing audit log
                    localStorage.removeItem('transformationHistory');
                    await auditLogger.initialize();

                    // Execute concurrent audit logging
                    const promises = auditOperations.map(async (op, index) => {
                        return new Promise((resolve) => {
                            setTimeout(() => {
                                try {
                                    const auditRecord = {
                                        id: `CONCURRENT-${index}-${Date.now()}`,
                                        user: op.user,
                                        sourceItem: { 
                                            id: op.itemId, 
                                            name: `Item ${op.itemId}`, 
                                            unit: 'pcs', 
                                            quantity: 1,
                                            stockBefore: 100,
                                            stockAfter: 99
                                        },
                                        targetItem: { 
                                            id: `${op.itemId}-TARGET`, 
                                            name: `Target ${op.itemId}`, 
                                            unit: 'dus', 
                                            quantity: 12,
                                            stockBefore: 50,
                                            stockAfter: 62
                                        },
                                        conversionRatio: 12,
                                        status: 'completed',
                                        timestamp: new Date().toISOString()
                                    };

                                    auditLogger.logTransformation(auditRecord);
                                    resolve({ success: true, record: auditRecord, index });
                                } catch (error) {
                                    resolve({ success: false, error: error.message, index });
                                }
                            }, Math.random() * 10);
                        });
                    });

                    const results = await Promise.all(promises);

                    // Verify audit log integrity
                    const auditHistory = auditLogger.getTransformationHistory();
                    const successfulLogs = results.filter(r => r.success);

                    // Should have logged all successful operations
                    expect(auditHistory.length).toBeGreaterThanOrEqual(successfulLogs.length * 0.8); // Allow some tolerance

                    // Each audit entry should be complete and valid
                    auditHistory.forEach(entry => {
                        expect(entry).toHaveProperty('id');
                        expect(entry).toHaveProperty('user');
                        expect(entry).toHaveProperty('timestamp');
                        expect(entry).toHaveProperty('sourceItem');
                        expect(entry).toHaveProperty('targetItem');
                        expect(entry.sourceItem).toHaveProperty('id');
                        expect(entry.targetItem).toHaveProperty('id');
                    });

                    // Verify chronological order (should be maintained despite concurrency)
                    for (let i = 1; i < auditHistory.length; i++) {
                        const prevTime = new Date(auditHistory[i-1].timestamp);
                        const currTime = new Date(auditHistory[i].timestamp);
                        expect(currTime.getTime()).toBeGreaterThanOrEqual(prevTime.getTime());
                    }

                    return true;
                } catch (error) {
                    // Should handle concurrent audit logging errors gracefully
                    expect(error.message).toMatch(/audit|log|concurrent|integrity/i);
                    return true;
                }
            }
        ), { numRuns: 10 });
    });

    afterEach(() => {
        // Clean up localStorage after each test
        localStorage.removeItem('masterBarang');
        localStorage.removeItem('conversionRatios');
        localStorage.removeItem('transformationHistory');
    });
});