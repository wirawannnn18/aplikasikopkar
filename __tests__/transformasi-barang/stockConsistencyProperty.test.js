/**
 * Property Test: Stock Balance Equation Consistency
 * 
 * Validates Requirements 3.5:
 * - Stock balance equations must remain consistent
 * - System state must be coherent across all operations
 * - Data integrity must be maintained
 */

import fc from 'fast-check';
import StockManager from '../../js/transformasi-barang/StockManager.js';

describe('Property Test: Stock Balance Equation Consistency', () => {
    let stockManager;

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        
        stockManager = new StockManager();
        stockManager.initialize();
    });

    /**
     * Property 15: Stock Balance Equation Consistency
     * 
     * The stock balance equation must remain consistent:
     * Final Stock = Initial Stock + Stock Changes
     */
    test('Property 15: Stock balance equation consistency', async () => {
        await fc.assert(fc.asyncProperty(
            fc.record({
                transformations: fc.array(
                    fc.record({
                        sourceItem: fc.record({
                            id: fc.string({ minLength: 1, maxLength: 8 }),
                            initialStock: fc.integer({ min: 20, max: 200 }),
                            quantityUsed: fc.integer({ min: 1, max: 10 })
                        }),
                        targetItem: fc.record({
                            id: fc.string({ minLength: 1, maxLength: 8 }),
                            initialStock: fc.integer({ min: 0, max: 100 })
                        }),
                        conversionRatio: fc.float({ min: Math.fround(0.5), max: Math.fround(5.0), noNaN: true })
                    }).filter(t => 
                        t.sourceItem.id !== t.targetItem.id &&
                        t.sourceItem.quantityUsed <= t.sourceItem.initialStock
                    ),
                    { minLength: 1, maxLength: 3 }
                ).filter(transformations => {
                    // Ensure unique item IDs across all transformations
                    const allIds = new Set();
                    for (const t of transformations) {
                        if (allIds.has(t.sourceItem.id) || allIds.has(t.targetItem.id)) {
                            return false;
                        }
                        allIds.add(t.sourceItem.id);
                        allIds.add(t.targetItem.id);
                    }
                    return true;
                })
            }),
            
            async (testData) => {
                const { transformations } = testData;
                
                // Setup test data for all items
                const mockMasterBarang = [];
                const itemStockHistory = new Map();
                
                transformations.forEach(t => {
                    // Add source item
                    mockMasterBarang.push({
                        kode: t.sourceItem.id,
                        nama: `Source ${t.sourceItem.id}`,
                        stok: t.sourceItem.initialStock,
                        unit: 'pcs'
                    });
                    itemStockHistory.set(t.sourceItem.id, [t.sourceItem.initialStock]);
                    
                    // Add target item
                    mockMasterBarang.push({
                        kode: t.targetItem.id,
                        nama: `Target ${t.targetItem.id}`,
                        stok: t.targetItem.initialStock,
                        unit: 'box'
                    });
                    itemStockHistory.set(t.targetItem.id, [t.targetItem.initialStock]);
                });

                localStorage.setItem('masterBarang', JSON.stringify(mockMasterBarang));

                // Record initial state
                const initialStocks = new Map();
                for (const t of transformations) {
                    initialStocks.set(t.sourceItem.id, await stockManager.getStockBalance(t.sourceItem.id));
                    initialStocks.set(t.targetItem.id, await stockManager.getStockBalance(t.targetItem.id));
                }

                // Perform transformations and track changes
                const stockChanges = new Map();
                
                for (const t of transformations) {
                    const sourceChange = -t.sourceItem.quantityUsed;
                    const targetChange = Math.floor(t.sourceItem.quantityUsed * t.conversionRatio);
                    
                    // Initialize change tracking
                    if (!stockChanges.has(t.sourceItem.id)) {
                        stockChanges.set(t.sourceItem.id, 0);
                    }
                    if (!stockChanges.has(t.targetItem.id)) {
                        stockChanges.set(t.targetItem.id, 0);
                    }
                    
                    // Accumulate changes
                    stockChanges.set(t.sourceItem.id, stockChanges.get(t.sourceItem.id) + sourceChange);
                    stockChanges.set(t.targetItem.id, stockChanges.get(t.targetItem.id) + targetChange);
                    
                    // Perform atomic transformation
                    const result = await stockManager.atomicTransformationUpdate(
                        {
                            itemId: t.sourceItem.id,
                            quantityChange: sourceChange
                        },
                        {
                            itemId: t.targetItem.id,
                            quantityChange: targetChange
                        }
                    );

                    expect(result.success).toBe(true);
                    
                    // Record stock history
                    itemStockHistory.get(t.sourceItem.id).push(result.sourceUpdate.newStock);
                    itemStockHistory.get(t.targetItem.id).push(result.targetUpdate.newStock);
                }

                // Property: Stock Balance Equation Consistency
                // For each item: Final Stock = Initial Stock + Total Changes
                for (const [itemId, initialStock] of initialStocks) {
                    const finalStock = await stockManager.getStockBalance(itemId);
                    const totalChanges = stockChanges.get(itemId) || 0;
                    
                    // Main consistency equation
                    expect(finalStock).toBe(initialStock + totalChanges);
                    
                    // Verify stock history is consistent
                    const history = itemStockHistory.get(itemId);
                    expect(history[0]).toBe(initialStock); // First entry is initial
                    expect(history[history.length - 1]).toBe(finalStock); // Last entry is final
                    
                    // Each step in history should be consistent
                    for (let i = 1; i < history.length; i++) {
                        expect(history[i]).toBeGreaterThanOrEqual(0); // No negative stock
                    }
                }
            }
        ), { numRuns: 30 });
    });

    /**
     * Property: Transformation record consistency
     * 
     * Transformation records should accurately reflect actual stock changes
     */
    test('Property: Transformation record reflects actual stock changes', async () => {
        await fc.assert(fc.asyncProperty(
            fc.record({
                sourceItem: fc.record({
                    id: fc.string({ minLength: 1, maxLength: 10 }),
                    initialStock: fc.integer({ min: 50, max: 500 }),
                    quantityUsed: fc.integer({ min: 1, max: 20 })
                }),
                targetItem: fc.record({
                    id: fc.string({ minLength: 1, maxLength: 10 }),
                    initialStock: fc.integer({ min: 0, max: 100 })
                }),
                conversionRatio: fc.float({ min: Math.fround(0.1), max: Math.fround(10.0), noNaN: true })
            }).filter(data => 
                data.sourceItem.id !== data.targetItem.id &&
                data.sourceItem.quantityUsed <= data.sourceItem.initialStock
            ),
            
            async (testData) => {
                const { sourceItem, targetItem, conversionRatio } = testData;
                
                // Setup test data
                const mockMasterBarang = [
                    {
                        kode: sourceItem.id,
                        nama: `Source ${sourceItem.id}`,
                        stok: sourceItem.initialStock,
                        unit: 'pcs'
                    },
                    {
                        kode: targetItem.id,
                        nama: `Target ${targetItem.id}`,
                        stok: targetItem.initialStock,
                        unit: 'box'
                    }
                ];

                localStorage.setItem('masterBarang', JSON.stringify(mockMasterBarang));

                // Record initial stocks
                const initialSourceStock = await stockManager.getStockBalance(sourceItem.id);
                const initialTargetStock = await stockManager.getStockBalance(targetItem.id);

                // Calculate expected changes
                const expectedSourceChange = -sourceItem.quantityUsed;
                const expectedTargetChange = Math.floor(sourceItem.quantityUsed * conversionRatio);

                // Perform transformation
                const result = await stockManager.atomicTransformationUpdate(
                    {
                        itemId: sourceItem.id,
                        quantityChange: expectedSourceChange
                    },
                    {
                        itemId: targetItem.id,
                        quantityChange: expectedTargetChange
                    }
                );

                expect(result.success).toBe(true);

                // Create transformation record for validation
                const transformationRecord = {
                    sourceItem: {
                        id: sourceItem.id,
                        quantity: sourceItem.quantityUsed,
                        stockBefore: initialSourceStock,
                        stockAfter: result.sourceUpdate.newStock
                    },
                    targetItem: {
                        id: targetItem.id,
                        quantity: expectedTargetChange,
                        stockBefore: initialTargetStock,
                        stockAfter: result.targetUpdate.newStock
                    },
                    conversionRatio: conversionRatio
                };

                // Property: Transformation record consistency
                const isConsistent = await stockManager.validateStockConsistency(transformationRecord);
                expect(isConsistent).toBe(true);

                // Verify individual consistency checks
                expect(transformationRecord.sourceItem.stockBefore - transformationRecord.sourceItem.stockAfter)
                    .toBe(transformationRecord.sourceItem.quantity);
                
                expect(transformationRecord.targetItem.stockAfter - transformationRecord.targetItem.stockBefore)
                    .toBe(transformationRecord.targetItem.quantity);

                // Verify conversion calculation
                const calculatedTargetQuantity = transformationRecord.sourceItem.quantity * conversionRatio;
                expect(Math.abs(transformationRecord.targetItem.quantity - Math.floor(calculatedTargetQuantity)))
                    .toBeLessThanOrEqual(1); // Allow for rounding
            }
        ), { numRuns: 50 });
    });

    /**
     * Property: Cache consistency
     * 
     * Cached values should always match actual stored values
     */
    test('Property: Cache consistency with storage', async () => {
        await fc.assert(fc.asyncProperty(
            fc.record({
                itemId: fc.string({ minLength: 1, maxLength: 10 }),
                initialStock: fc.integer({ min: 0, max: 1000 }),
                operations: fc.array(
                    fc.integer({ min: -20, max: 50 }),
                    { minLength: 1, maxLength: 5 }
                )
            }),
            
            async (testData) => {
                const { itemId, initialStock, operations } = testData;
                
                // Filter operations to ensure stock never goes negative
                let runningStock = initialStock;
                const validOperations = [];
                
                for (const op of operations) {
                    if (runningStock + op >= 0) {
                        validOperations.push(op);
                        runningStock += op;
                    }
                }

                if (validOperations.length === 0) return;

                // Setup test data
                const mockMasterBarang = [{
                    kode: itemId,
                    nama: `Test Item ${itemId}`,
                    stok: initialStock,
                    unit: 'pcs'
                }];

                localStorage.setItem('masterBarang', JSON.stringify(mockMasterBarang));

                // Perform operations with cache consistency checks
                let expectedStock = initialStock;
                
                for (const operation of validOperations) {
                    // Get stock before operation (should use cache if available)
                    const stockBefore = await stockManager.getStockBalance(itemId);
                    expect(stockBefore).toBe(expectedStock);
                    
                    // Perform operation
                    const result = await stockManager.updateStock(itemId, 'pcs', operation);
                    expect(result.success).toBe(true);
                    
                    expectedStock += operation;
                    
                    // Get stock after operation (should reflect update)
                    const stockAfter = await stockManager.getStockBalance(itemId);
                    expect(stockAfter).toBe(expectedStock);
                    
                    // Refresh cache and verify consistency
                    stockManager.refreshStockCache();
                    const stockAfterRefresh = await stockManager.getStockBalance(itemId);
                    expect(stockAfterRefresh).toBe(expectedStock);
                }

                // Property: Final consistency check
                const finalStock = await stockManager.getStockBalance(itemId);
                const totalChange = validOperations.reduce((sum, op) => sum + op, 0);
                expect(finalStock).toBe(initialStock + totalChange);
            }
        ), { numRuns: 30 });
    });
});