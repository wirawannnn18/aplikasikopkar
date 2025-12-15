/**
 * Property Test: Stock Balance Conservation
 * 
 * Validates Requirements 1.3:
 * - WHEN stock is updated THEN the total stock balance SHALL be conserved
 * - Stock changes must follow conservation principles
 * - No stock should be lost or created without proper accounting
 */

import fc from 'fast-check';
import StockManager from '../../js/transformasi-barang/StockManager.js';

describe('Property Test: Stock Balance Conservation', () => {
    let stockManager;

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        
        stockManager = new StockManager();
        stockManager.initialize();
    });

    /**
     * Property 3: Stock Balance Conservation
     * 
     * For any transformation operation, the total stock value should be conserved
     * according to the conversion ratio.
     */
    test('Property 3: Stock balance is conserved during transformations', async () => {
        await fc.assert(fc.asyncProperty(
            // Generate test data
            fc.record({
                sourceItem: fc.record({
                    id: fc.string({ minLength: 1, maxLength: 10 }),
                    initialStock: fc.integer({ min: 10, max: 1000 }),
                    quantityToTransform: fc.integer({ min: 1, max: 50 })
                }),
                targetItem: fc.record({
                    id: fc.string({ minLength: 1, maxLength: 10 }),
                    initialStock: fc.integer({ min: 0, max: 1000 })
                }),
                conversionRatio: fc.float({ min: Math.fround(0.1), max: Math.fround(10), noNaN: true })
            }).filter(data => 
                data.sourceItem.id !== data.targetItem.id &&
                data.sourceItem.quantityToTransform <= data.sourceItem.initialStock
            ),
            
            async (testData) => {
                const { sourceItem, targetItem, conversionRatio } = testData;
                
                // Setup test data
                const mockMasterBarang = [
                    {
                        kode: sourceItem.id,
                        nama: `Source Item ${sourceItem.id}`,
                        stok: sourceItem.initialStock,
                        unit: 'pcs'
                    },
                    {
                        kode: targetItem.id,
                        nama: `Target Item ${targetItem.id}`,
                        stok: targetItem.initialStock,
                        unit: 'box'
                    }
                ];

                localStorage.setItem('masterBarang', JSON.stringify(mockMasterBarang));

                // Calculate expected quantities
                const sourceQuantityChange = -sourceItem.quantityToTransform;
                const targetQuantityChange = Math.floor(sourceItem.quantityToTransform * conversionRatio);

                // Perform atomic transformation
                const result = await stockManager.atomicTransformationUpdate(
                    {
                        itemId: sourceItem.id,
                        quantityChange: sourceQuantityChange
                    },
                    {
                        itemId: targetItem.id,
                        quantityChange: targetQuantityChange
                    }
                );

                // Verify operation succeeded
                expect(result.success).toBe(true);

                // Property: Stock balance conservation
                // Each individual stock change should be exact
                expect(result.sourceUpdate.previousStock).toBe(sourceItem.initialStock);
                expect(result.targetUpdate.previousStock).toBe(targetItem.initialStock);
                expect(result.sourceUpdate.quantityChange).toBe(sourceQuantityChange);
                expect(result.targetUpdate.quantityChange).toBe(targetQuantityChange);

                // Additional verification: Final stocks should match expected
                expect(result.sourceUpdate.newStock).toBe(sourceItem.initialStock + sourceQuantityChange);
                expect(result.targetUpdate.newStock).toBe(targetItem.initialStock + targetQuantityChange);

                // Verify no stock went negative
                expect(result.sourceUpdate.newStock).toBeGreaterThanOrEqual(0);
                expect(result.targetUpdate.newStock).toBeGreaterThanOrEqual(0);
            }
        ), { numRuns: 50 });
    });

    /**
     * Property: Single item stock conservation
     * 
     * For single item updates, stock should change exactly by the specified amount
     */
    test('Property: Single item stock updates are conserved exactly', async () => {
        await fc.assert(fc.asyncProperty(
            fc.record({
                itemId: fc.string({ minLength: 1, maxLength: 10 }),
                initialStock: fc.integer({ min: 0, max: 1000 }),
                stockChange: fc.integer({ min: -50, max: 100 })
            }).filter(data => data.initialStock + data.stockChange >= 0),
            
            async (testData) => {
                const { itemId, initialStock, stockChange } = testData;
                
                // Setup test data
                const mockMasterBarang = [{
                    kode: itemId,
                    nama: `Test Item ${itemId}`,
                    stok: initialStock,
                    unit: 'pcs'
                }];

                localStorage.setItem('masterBarang', JSON.stringify(mockMasterBarang));

                // Get initial stock
                const initialStockFromSystem = await stockManager.getStockBalance(itemId);
                expect(initialStockFromSystem).toBe(initialStock);

                // Perform stock update
                const result = await stockManager.updateStock(itemId, 'pcs', stockChange);

                // Verify operation succeeded
                expect(result.success).toBe(true);

                // Property: Exact conservation
                expect(result.newStock).toBe(initialStock + stockChange);
                expect(result.previousStock).toBe(initialStock);
                expect(result.quantityChange).toBe(stockChange);

                // Verify system state
                const finalStockFromSystem = await stockManager.getStockBalance(itemId);
                expect(finalStockFromSystem).toBe(initialStock + stockChange);
            }
        ), { numRuns: 50 });
    });

    /**
     * Property: Rollback conservation
     * 
     * After rollback, stock should return to original values
     */
    test('Property: Rollback restores exact original stock levels', async () => {
        await fc.assert(fc.asyncProperty(
            fc.record({
                sourceItem: fc.record({
                    id: fc.string({ minLength: 1, maxLength: 10 }),
                    initialStock: fc.integer({ min: 10, max: 1000 })
                }),
                targetItem: fc.record({
                    id: fc.string({ minLength: 1, maxLength: 10 }),
                    initialStock: fc.integer({ min: 0, max: 1000 })
                }),
                sourceChange: fc.integer({ min: -50, max: 50 }),
                targetChange: fc.integer({ min: -50, max: 50 })
            }).filter(data => 
                data.sourceItem.id !== data.targetItem.id &&
                data.sourceItem.initialStock + data.sourceChange >= 0 &&
                data.targetItem.initialStock + data.targetChange >= 0 &&
                (data.sourceChange !== 0 || data.targetChange !== 0) // Avoid no-change operations
            ),
            
            async (testData) => {
                const { sourceItem, targetItem, sourceChange, targetChange } = testData;
                
                // Setup test data
                const mockMasterBarang = [
                    {
                        kode: sourceItem.id,
                        nama: `Source Item ${sourceItem.id}`,
                        stok: sourceItem.initialStock,
                        unit: 'pcs'
                    },
                    {
                        kode: targetItem.id,
                        nama: `Target Item ${targetItem.id}`,
                        stok: targetItem.initialStock,
                        unit: 'box'
                    }
                ];

                localStorage.setItem('masterBarang', JSON.stringify(mockMasterBarang));

                // Record initial stocks
                const initialSourceStock = await stockManager.getStockBalance(sourceItem.id);
                const initialTargetStock = await stockManager.getStockBalance(targetItem.id);

                // Perform atomic transformation
                const result = await stockManager.atomicTransformationUpdate(
                    {
                        itemId: sourceItem.id,
                        quantityChange: sourceChange
                    },
                    {
                        itemId: targetItem.id,
                        quantityChange: targetChange
                    }
                );

                expect(result.success).toBe(true);

                // Verify stocks changed
                const changedSourceStock = await stockManager.getStockBalance(sourceItem.id);
                const changedTargetStock = await stockManager.getStockBalance(targetItem.id);

                expect(changedSourceStock).toBe(initialSourceStock + sourceChange);
                expect(changedTargetStock).toBe(initialTargetStock + targetChange);

                // Perform rollback
                const rollbackSuccess = await stockManager.rollbackStockChanges(result.rollbackData);
                expect(rollbackSuccess).toBe(true);

                // Property: Exact restoration
                const restoredSourceStock = await stockManager.getStockBalance(sourceItem.id);
                const restoredTargetStock = await stockManager.getStockBalance(targetItem.id);

                expect(restoredSourceStock).toBe(initialSourceStock);
                expect(restoredTargetStock).toBe(initialTargetStock);
            }
        ), { numRuns: 30 });
    });
});