/**
 * Test untuk StockManager sistem transformasi barang
 * 
 * Test ini memverifikasi bahwa StockManager berfungsi dengan benar
 * untuk mengelola stok dan data persistence.
 */

// Import dependencies untuk testing
import fc from 'fast-check';

// Mock localStorage untuk testing
const localStorageMock = {
    data: {},
    getItem: function(key) {
        return this.data[key] || null;
    },
    setItem: function(key, value) {
        this.data[key] = value;
    },
    clear: function() {
        this.data = {};
    }
};

// Setup global localStorage mock
global.localStorage = localStorageMock;

// Import komponen yang akan ditest
import StockManager from '../../js/transformasi-barang/StockManager.js';

describe('Transformasi Barang - StockManager Tests', () => {
    let stockManager;

    beforeEach(() => {
        // Clear localStorage dan buat instance baru
        localStorage.clear();
        stockManager = new StockManager();
        
        // Setup sample data
        const sampleMasterBarang = [
            {
                kode: 'AQUA-DUS',
                nama: 'Aqua 1L DUS',
                kategori: 'minuman',
                satuan: 'dus',
                stok: 10,
                hargaBeli: 12000
            },
            {
                kode: 'AQUA-PCS',
                nama: 'Aqua 1L PCS',
                kategori: 'minuman',
                satuan: 'pcs',
                stok: 50,
                hargaBeli: 1000
            },
            {
                kode: 'BERAS-KG',
                nama: 'Beras Premium',
                kategori: 'sembako',
                satuan: 'kg',
                stok: 100,
                hargaBeli: 15000
            }
        ];
        
        localStorage.setItem('masterBarang', JSON.stringify(sampleMasterBarang));
        stockManager.initialize();
    });

    describe('Basic Functionality', () => {
        test('should initialize correctly', () => {
            expect(stockManager.initialized).toBe(true);
            expect(stockManager.stockCache.size).toBeGreaterThan(0);
        });

        test('should get stock balance correctly', async () => {
            const balance = await stockManager.getStockBalance('AQUA-DUS');
            expect(balance).toBe(10);
        });

        test('should update stock correctly', async () => {
            const result = await stockManager.updateStock('AQUA-DUS', 'dus', -2);
            
            expect(result.success).toBe(true);
            expect(result.previousStock).toBe(10);
            expect(result.newStock).toBe(8);
            expect(result.quantityChange).toBe(-2);
            
            // Verify stock was actually updated
            const newBalance = await stockManager.getStockBalance('AQUA-DUS');
            expect(newBalance).toBe(8);
        });

        test('should prevent negative stock', async () => {
            await expect(stockManager.updateStock('AQUA-DUS', 'dus', -15))
                .rejects.toThrow('Stok tidak mencukupi');
        });

        test('should check stock sufficiency correctly', async () => {
            const sufficient = await stockManager.isStockSufficient('AQUA-DUS', 5);
            expect(sufficient).toBe(true);
            
            const insufficient = await stockManager.isStockSufficient('AQUA-DUS', 15);
            expect(insufficient).toBe(false);
        });
    });

    describe('Atomic Operations', () => {
        test('should perform atomic transformation update', async () => {
            const sourceUpdate = { itemId: 'AQUA-DUS', quantityChange: -1 };
            const targetUpdate = { itemId: 'AQUA-PCS', quantityChange: 12 };
            
            const result = await stockManager.atomicTransformationUpdate(sourceUpdate, targetUpdate);
            
            expect(result.success).toBe(true);
            expect(result.sourceUpdate.newStock).toBe(9); // 10 - 1
            expect(result.targetUpdate.newStock).toBe(62); // 50 + 12
            
            // Verify both stocks were updated
            const sourceBalance = await stockManager.getStockBalance('AQUA-DUS');
            const targetBalance = await stockManager.getStockBalance('AQUA-PCS');
            expect(sourceBalance).toBe(9);
            expect(targetBalance).toBe(62);
        });

        test('should rollback stock changes', async () => {
            // Perform atomic update first
            const sourceUpdate = { itemId: 'AQUA-DUS', quantityChange: -1 };
            const targetUpdate = { itemId: 'AQUA-PCS', quantityChange: 12 };
            
            const result = await stockManager.atomicTransformationUpdate(sourceUpdate, targetUpdate);
            
            // Now rollback
            const rollbackSuccess = await stockManager.rollbackStockChanges(result.rollbackData);
            expect(rollbackSuccess).toBe(true);
            
            // Verify stocks were restored
            const sourceBalance = await stockManager.getStockBalance('AQUA-DUS');
            const targetBalance = await stockManager.getStockBalance('AQUA-PCS');
            expect(sourceBalance).toBe(10); // Original value
            expect(targetBalance).toBe(50); // Original value
        });
    });

    describe('Stock Validation', () => {
        test('should validate stock consistency', async () => {
            // Create a mock transformation record
            const transformationRecord = {
                sourceItem: {
                    id: 'AQUA-DUS',
                    quantity: 1,
                    stockBefore: 10,
                    stockAfter: 9
                },
                targetItem: {
                    id: 'AQUA-PCS',
                    quantity: 12,
                    stockBefore: 50,
                    stockAfter: 62
                },
                conversionRatio: 12
            };

            // Update stocks to match the record
            await stockManager.updateStock('AQUA-DUS', 'dus', -1);
            await stockManager.updateStock('AQUA-PCS', 'pcs', 12);

            const isConsistent = await stockManager.validateStockConsistency(transformationRecord);
            expect(isConsistent).toBe(true);
        });

        test('should detect inconsistent stock', async () => {
            const transformationRecord = {
                sourceItem: {
                    id: 'AQUA-DUS',
                    quantity: 1,
                    stockBefore: 10,
                    stockAfter: 8 // Wrong value
                },
                targetItem: {
                    id: 'AQUA-PCS',
                    quantity: 12,
                    stockBefore: 50,
                    stockAfter: 62
                },
                conversionRatio: 12
            };

            const isConsistent = await stockManager.validateStockConsistency(transformationRecord);
            expect(isConsistent).toBe(false);
        });
    });

    describe('Bulk Operations', () => {
        test('should get bulk stock balance', async () => {
            const itemIds = ['AQUA-DUS', 'AQUA-PCS', 'BERAS-KG'];
            const bulkBalance = await stockManager.getBulkStockBalance(itemIds);
            
            expect(bulkBalance['AQUA-DUS']).toBe(10);
            expect(bulkBalance['AQUA-PCS']).toBe(50);
            expect(bulkBalance['BERAS-KG']).toBe(100);
        });

        test('should get stock statistics', async () => {
            const stats = await stockManager.getStockStatistics();
            
            expect(stats.totalItems).toBe(3);
            expect(stats.itemsWithStock).toBe(3);
            expect(stats.itemsOutOfStock).toBe(0);
            expect(stats.totalStockValue).toBeGreaterThan(0);
        });
    });

    describe('Backup and Restore', () => {
        test('should create stock backup', async () => {
            const backup = await stockManager.createStockBackup();
            
            expect(backup.timestamp).toBeDefined();
            expect(backup.version).toBe('1.0');
            expect(backup.stockData).toHaveLength(3);
            expect(backup.stockData[0]).toHaveProperty('kode');
            expect(backup.stockData[0]).toHaveProperty('stok');
        });

        test('should restore from backup', async () => {
            // Create backup
            const backup = await stockManager.createStockBackup();
            
            // Modify stocks
            await stockManager.updateStock('AQUA-DUS', 'dus', -5);
            await stockManager.updateStock('AQUA-PCS', 'pcs', -20);
            
            // Restore from backup
            const restoreSuccess = await stockManager.restoreStockFromBackup(backup);
            expect(restoreSuccess).toBe(true);
            
            // Verify stocks were restored
            const aquaDusBalance = await stockManager.getStockBalance('AQUA-DUS');
            const aquaPcsBalance = await stockManager.getStockBalance('AQUA-PCS');
            expect(aquaDusBalance).toBe(10);
            expect(aquaPcsBalance).toBe(50);
        });
    });

    describe('Property-Based Tests', () => {
        test('Stock balance conservation property', () => {
            /**
             * Feature: transformasi-barang, Property 3: Stock Balance Conservation
             * Validates: Requirements 1.3
             */
            fc.assert(fc.property(
                fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[A-Z0-9-]+$/.test(s)),
                fc.integer({ min: 0, max: 1000 }),
                fc.integer({ min: -100, max: 100 }),
                async (itemId, initialStock, quantityChange) => {
                    try {
                        // Setup item with initial stock
                        const masterBarang = [{
                            kode: itemId,
                            nama: `Test Item ${itemId}`,
                            kategori: 'test',
                            satuan: 'pcs',
                            stok: initialStock,
                            hargaBeli: 1000
                        }];
                        
                        localStorage.setItem('masterBarang', JSON.stringify(masterBarang));
                        const testStockManager = new StockManager();
                        testStockManager.initialize();
                        
                        const originalBalance = await testStockManager.getStockBalance(itemId);
                        expect(originalBalance).toBe(initialStock);
                        
                        // Skip if update would result in negative stock
                        if (originalBalance + quantityChange < 0) {
                            await expect(testStockManager.updateStock(itemId, 'pcs', quantityChange))
                                .rejects.toThrow();
                            return;
                        }
                        
                        // Perform update
                        const result = await testStockManager.updateStock(itemId, 'pcs', quantityChange);
                        const newBalance = await testStockManager.getStockBalance(itemId);
                        
                        // Verify conservation
                        expect(result.success).toBe(true);
                        expect(newBalance).toBe(originalBalance + quantityChange);
                        expect(result.newStock).toBe(newBalance);
                    } catch (error) {
                        // Skip invalid test cases
                        if (error.message.includes('tidak ditemukan') || 
                            error.message.includes('tidak valid')) {
                            return;
                        }
                        throw error;
                    }
                }
            ), { numRuns: 30 });
        });

        test('Stock consistency validation property', () => {
            /**
             * Feature: transformasi-barang, Property 15: Stock Balance Equation Consistency
             * Validates: Requirements 3.5
             */
            fc.assert(fc.property(
                fc.record({
                    sourceId: fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[A-Z0-9-]+$/.test(s)),
                    targetId: fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[A-Z0-9-]+$/.test(s)),
                    sourceInitialStock: fc.integer({ min: 10, max: 100 }),
                    targetInitialStock: fc.integer({ min: 10, max: 100 }),
                    transformQuantity: fc.integer({ min: 1, max: 5 }),
                    conversionRatio: fc.integer({ min: 2, max: 20 })
                }),
                async (data) => {
                    try {
                        const { sourceId, targetId, sourceInitialStock, targetInitialStock, transformQuantity, conversionRatio } = data;
                        
                        // Skip if source and target are the same
                        fc.pre(sourceId !== targetId);
                        
                        // Setup items
                        const masterBarang = [
                            {
                                kode: sourceId,
                                nama: `Source ${sourceId}`,
                                kategori: 'test',
                                satuan: 'dus',
                                stok: sourceInitialStock,
                                hargaBeli: 1000
                            },
                            {
                                kode: targetId,
                                nama: `Target ${targetId}`,
                                kategori: 'test',
                                satuan: 'pcs',
                                stok: targetInitialStock,
                                hargaBeli: 100
                            }
                        ];
                        
                        localStorage.setItem('masterBarang', JSON.stringify(masterBarang));
                        const testStockManager = new StockManager();
                        testStockManager.initialize();
                        
                        // Perform atomic transformation
                        const sourceUpdate = { itemId: sourceId, quantityChange: -transformQuantity };
                        const targetUpdate = { itemId: targetId, quantityChange: transformQuantity * conversionRatio };
                        
                        const result = await testStockManager.atomicTransformationUpdate(sourceUpdate, targetUpdate);
                        
                        // Create transformation record for validation
                        const transformationRecord = {
                            sourceItem: {
                                id: sourceId,
                                quantity: transformQuantity,
                                stockBefore: sourceInitialStock,
                                stockAfter: sourceInitialStock - transformQuantity
                            },
                            targetItem: {
                                id: targetId,
                                quantity: transformQuantity * conversionRatio,
                                stockBefore: targetInitialStock,
                                stockAfter: targetInitialStock + (transformQuantity * conversionRatio)
                            },
                            conversionRatio: conversionRatio
                        };
                        
                        // Validate consistency
                        const isConsistent = await testStockManager.validateStockConsistency(transformationRecord);
                        expect(isConsistent).toBe(true);
                        expect(result.success).toBe(true);
                    } catch (error) {
                        // Skip invalid test cases
                        if (error.message.includes('tidak ditemukan') || 
                            error.message.includes('tidak valid')) {
                            return;
                        }
                        throw error;
                    }
                }
            ), { numRuns: 20 });
        });

        test('Atomic operation rollback property', () => {
            /**
             * Feature: transformasi-barang, Property StockManager-1: Atomic rollback consistency
             * Validates: Rollback operations restore original state
             */
            fc.assert(fc.property(
                fc.record({
                    sourceId: fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[A-Z0-9-]+$/.test(s)),
                    targetId: fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[A-Z0-9-]+$/.test(s)),
                    sourceStock: fc.integer({ min: 10, max: 100 }),
                    targetStock: fc.integer({ min: 10, max: 100 }),
                    sourceChange: fc.integer({ min: -5, max: -1 }),
                    targetChange: fc.integer({ min: 1, max: 20 })
                }),
                async (data) => {
                    try {
                        const { sourceId, targetId, sourceStock, targetStock, sourceChange, targetChange } = data;
                        
                        // Skip if source and target are the same
                        fc.pre(sourceId !== targetId);
                        
                        // Setup items
                        const masterBarang = [
                            {
                                kode: sourceId,
                                nama: `Source ${sourceId}`,
                                stok: sourceStock
                            },
                            {
                                kode: targetId,
                                nama: `Target ${targetId}`,
                                stok: targetStock
                            }
                        ];
                        
                        localStorage.setItem('masterBarang', JSON.stringify(masterBarang));
                        const testStockManager = new StockManager();
                        testStockManager.initialize();
                        
                        // Record original balances
                        const originalSourceBalance = await testStockManager.getStockBalance(sourceId);
                        const originalTargetBalance = await testStockManager.getStockBalance(targetId);
                        
                        // Perform atomic update
                        const sourceUpdate = { itemId: sourceId, quantityChange: sourceChange };
                        const targetUpdate = { itemId: targetId, quantityChange: targetChange };
                        
                        const result = await testStockManager.atomicTransformationUpdate(sourceUpdate, targetUpdate);
                        
                        // Verify update worked
                        expect(result.success).toBe(true);
                        
                        // Perform rollback
                        const rollbackSuccess = await testStockManager.rollbackStockChanges(result.rollbackData);
                        expect(rollbackSuccess).toBe(true);
                        
                        // Verify original balances are restored
                        const restoredSourceBalance = await testStockManager.getStockBalance(sourceId);
                        const restoredTargetBalance = await testStockManager.getStockBalance(targetId);
                        
                        expect(restoredSourceBalance).toBe(originalSourceBalance);
                        expect(restoredTargetBalance).toBe(originalTargetBalance);
                    } catch (error) {
                        // Skip invalid test cases
                        if (error.message.includes('tidak ditemukan') || 
                            error.message.includes('tidak valid')) {
                            return;
                        }
                        throw error;
                    }
                }
            ), { numRuns: 20 });
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid item ID', async () => {
            await expect(stockManager.getStockBalance('INVALID-ID'))
                .rejects.toThrow('tidak ditemukan');
        });

        test('should handle invalid input parameters', async () => {
            await expect(stockManager.updateStock('', 'pcs', 5))
                .rejects.toThrow('Item ID harus berupa string yang valid');
                
            await expect(stockManager.updateStock('AQUA-DUS', 'pcs', 'invalid'))
                .rejects.toThrow('Quantity change harus berupa angka yang valid');
        });

        test('should handle corrupted localStorage data', async () => {
            // Corrupt the data
            localStorage.setItem('masterBarang', 'invalid json');
            
            const corruptedStockManager = new StockManager();
            corruptedStockManager.initialize();
            
            // Should handle gracefully and return empty array
            const items = await corruptedStockManager.getItemsWithStock();
            expect(items).toEqual([]);
        });
    });
});