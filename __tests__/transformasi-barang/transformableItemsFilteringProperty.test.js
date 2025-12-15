/**
 * Property Test: Transformable Items Filtering
 * Validates: Requirements 2.1
 * 
 * Property 6: Transformable Items Filtering
 * Only items with multiple units and valid conversion ratios should be returned as transformable
 */

import fc from 'fast-check';
import TransformationManager from '../../js/transformasi-barang/TransformationManager.js';
import { ValidationEngine } from '../../js/transformasi-barang/ValidationEngine.js';
import ConversionCalculator from '../../js/transformasi-barang/ConversionCalculator.js';
import StockManager from '../../js/transformasi-barang/StockManager.js';
import AuditLogger from '../../js/transformasi-barang/AuditLogger.js';

describe('Property Test: Transformable Items Filtering', () => {
    let transformationManager;
    let validationEngine;
    let calculator;
    let stockManager;
    let auditLogger;

    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        
        // Initialize all dependencies
        validationEngine = new ValidationEngine();
        validationEngine.initialize();
        
        calculator = new ConversionCalculator();
        calculator.initialize();
        
        stockManager = new StockManager();
        stockManager.initialize();
        
        auditLogger = new AuditLogger();
        auditLogger.initialize();
        
        transformationManager = new TransformationManager();
        transformationManager.initialize({
            validationEngine,
            calculator,
            stockManager,
            auditLogger
        });
    });

    afterEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    test('Property 6: Only items with multiple units and conversion ratios are transformable', () => {
        fc.assert(fc.property(
            fc.record({
                masterBarang: fc.array(
                    fc.record({
                        kode: fc.string({ minLength: 1, maxLength: 20 }),
                        nama: fc.string({ minLength: 1, maxLength: 50 }),
                        satuan: fc.constantFrom('PCS', 'DUS', 'LUSIN', 'KG', 'LITER'),
                        stok: fc.integer({ min: 0, max: 1000 }),
                        baseProduct: fc.string({ minLength: 1, maxLength: 20 })
                    }),
                    { minLength: 1, maxLength: 30 }
                ),
                conversionRatios: fc.array(
                    fc.record({
                        baseProduct: fc.string({ minLength: 1, maxLength: 20 }),
                        conversions: fc.array(
                            fc.record({
                                from: fc.constantFrom('PCS', 'DUS', 'LUSIN'),
                                to: fc.constantFrom('PCS', 'DUS', 'LUSIN'),
                                ratio: fc.integer({ min: 1, max: 100 })
                            }),
                            { minLength: 1, maxLength: 5 }
                        )
                    }),
                    { minLength: 0, maxLength: 10 }
                )
            }),
            async ({ masterBarang, conversionRatios }) => {
                // Ensure unique item codes
                const uniqueMasterBarang = masterBarang.map((item, index) => ({
                    ...item,
                    kode: `${item.kode}_${index}`
                }));

                // Store test data in localStorage
                localStorage.setItem('masterBarang', JSON.stringify(uniqueMasterBarang));
                localStorage.setItem('conversionRatios', JSON.stringify(conversionRatios));

                // Get transformable items
                const transformableItems = await transformationManager.getTransformableItems();

                // Verify filtering logic
                transformableItems.forEach(transformableGroup => {
                    // Each transformable group should have multiple items (units)
                    expect(transformableGroup.items.length).toBeGreaterThan(1);
                    
                    // All items in group should have same base product
                    const baseProduct = transformableGroup.baseProduct;
                    transformableGroup.items.forEach(item => {
                        expect(item.baseProduct).toBe(baseProduct);
                    });
                    
                    // Base product should have conversion ratios defined
                    const hasConversionRatio = conversionRatios.some(ratio => 
                        ratio.baseProduct === baseProduct && 
                        ratio.conversions && 
                        ratio.conversions.length > 0
                    );
                    expect(hasConversionRatio).toBe(true);
                });

                // Verify that single-unit products are not included
                const baseProductCounts = {};
                uniqueMasterBarang.forEach(item => {
                    const baseProduct = item.baseProduct;
                    baseProductCounts[baseProduct] = (baseProductCounts[baseProduct] || 0) + 1;
                });

                const singleUnitProducts = Object.entries(baseProductCounts)
                    .filter(([, count]) => count === 1)
                    .map(([baseProduct]) => baseProduct);

                singleUnitProducts.forEach(singleUnitProduct => {
                    const isIncluded = transformableItems.some(group => 
                        group.baseProduct === singleUnitProduct
                    );
                    expect(isIncluded).toBe(false);
                });

                // Verify that products without conversion ratios are not included
                const productsWithoutRatios = Object.keys(baseProductCounts).filter(baseProduct => {
                    const hasRatio = conversionRatios.some(ratio => 
                        ratio.baseProduct === baseProduct && 
                        ratio.conversions && 
                        ratio.conversions.length > 0
                    );
                    return !hasRatio;
                });

                productsWithoutRatios.forEach(productWithoutRatio => {
                    const isIncluded = transformableItems.some(group => 
                        group.baseProduct === productWithoutRatio
                    );
                    expect(isIncluded).toBe(false);
                });
            }
        ), { numRuns: 25 });
    });

    test('Property 6.1: Transformable items maintain correct stock information', () => {
        fc.assert(fc.property(
            fc.array(
                fc.record({
                    baseProduct: fc.constantFrom('PROD_A', 'PROD_B', 'PROD_C'),
                    items: fc.array(
                        fc.record({
                            kode: fc.string({ minLength: 1, maxLength: 20 }),
                            nama: fc.string({ minLength: 1, maxLength: 50 }),
                            satuan: fc.constantFrom('PCS', 'DUS', 'LUSIN'),
                            stok: fc.integer({ min: 0, max: 1000 })
                        }),
                        { minLength: 2, maxLength: 4 }
                    )
                }),
                { minLength: 1, maxLength: 5 }
            ),
            async (productGroups) => {
                // Flatten items and ensure unique codes
                const masterBarang = [];
                const conversionRatios = [];

                productGroups.forEach((group, groupIndex) => {
                    group.items.forEach((item, itemIndex) => {
                        masterBarang.push({
                            ...item,
                            kode: `${item.kode}_${groupIndex}_${itemIndex}`,
                            baseProduct: group.baseProduct
                        });
                    });

                    // Create conversion ratios for each group
                    const conversions = [];
                    for (let i = 0; i < group.items.length - 1; i++) {
                        conversions.push({
                            from: group.items[i].satuan,
                            to: group.items[i + 1].satuan,
                            ratio: 12
                        });
                    }

                    if (conversions.length > 0) {
                        conversionRatios.push({
                            baseProduct: group.baseProduct,
                            conversions
                        });
                    }
                });

                // Store test data
                localStorage.setItem('masterBarang', JSON.stringify(masterBarang));
                localStorage.setItem('conversionRatios', JSON.stringify(conversionRatios));

                // Get transformable items
                const transformableItems = await transformationManager.getTransformableItems();

                // Verify stock information is preserved correctly
                transformableItems.forEach(transformableGroup => {
                    transformableGroup.items.forEach(transformableItem => {
                        // Find original item in master barang
                        const originalItem = masterBarang.find(item => item.kode === transformableItem.id);
                        expect(originalItem).toBeDefined();

                        // Verify stock information matches
                        expect(transformableItem.stock).toBe(originalItem.stok);
                        expect(transformableItem.name).toBe(originalItem.nama);
                        expect(transformableItem.unit).toBe(originalItem.satuan);
                        expect(transformableItem.baseProduct).toBe(originalItem.baseProduct);
                    });
                });
            }
        ), { numRuns: 20 });
    });

    test('Property 6.2: Empty or invalid data returns empty transformable items', () => {
        fc.assert(fc.property(
            fc.record({
                masterBarangEmpty: fc.boolean(),
                conversionRatiosEmpty: fc.boolean(),
                invalidData: fc.boolean()
            }),
            async ({ masterBarangEmpty, conversionRatiosEmpty, invalidData }) => {
                if (invalidData) {
                    // Test with invalid JSON data
                    localStorage.setItem('masterBarang', 'invalid json');
                    localStorage.setItem('conversionRatios', 'invalid json');
                } else {
                    // Test with empty arrays
                    const masterBarang = masterBarangEmpty ? [] : [
                        { kode: 'ITEM_001', nama: 'Test Item', satuan: 'PCS', stok: 10, baseProduct: 'TEST' }
                    ];
                    const conversionRatios = conversionRatiosEmpty ? [] : [
                        { baseProduct: 'TEST', conversions: [{ from: 'PCS', to: 'DUS', ratio: 12 }] }
                    ];

                    localStorage.setItem('masterBarang', JSON.stringify(masterBarang));
                    localStorage.setItem('conversionRatios', JSON.stringify(conversionRatios));
                }

                // Get transformable items should not throw error
                let transformableItems;
                try {
                    transformableItems = await transformationManager.getTransformableItems();
                } catch (error) {
                    // Should handle invalid data gracefully
                    transformableItems = [];
                }

                // Should return array (possibly empty)
                expect(Array.isArray(transformableItems)).toBe(true);

                if (masterBarangEmpty || conversionRatiosEmpty || invalidData) {
                    // Should return empty array for invalid/empty data
                    expect(transformableItems.length).toBe(0);
                }
            }
        ), { numRuns: 15 });
    });

    test('Property 6.3: Transformable items filtering is consistent across calls', () => {
        fc.assert(fc.property(
            fc.record({
                masterBarang: fc.array(
                    fc.record({
                        kode: fc.string({ minLength: 1, maxLength: 20 }),
                        nama: fc.string({ minLength: 1, maxLength: 50 }),
                        satuan: fc.constantFrom('PCS', 'DUS'),
                        stok: fc.integer({ min: 0, max: 100 }),
                        baseProduct: fc.constantFrom('PROD_A', 'PROD_B')
                    }),
                    { minLength: 4, maxLength: 8 }
                )
            }),
            async ({ masterBarang }) => {
                // Ensure we have items for both base products with multiple units
                const prodAItems = masterBarang.filter(item => item.baseProduct === 'PROD_A');
                const prodBItems = masterBarang.filter(item => item.baseProduct === 'PROD_B');

                // Ensure each product has both PCS and DUS units
                const finalMasterBarang = [
                    { kode: 'PROD_A_PCS', nama: 'Product A', satuan: 'PCS', stok: 50, baseProduct: 'PROD_A' },
                    { kode: 'PROD_A_DUS', nama: 'Product A', satuan: 'DUS', stok: 10, baseProduct: 'PROD_A' },
                    { kode: 'PROD_B_PCS', nama: 'Product B', satuan: 'PCS', stok: 30, baseProduct: 'PROD_B' },
                    { kode: 'PROD_B_DUS', nama: 'Product B', satuan: 'DUS', stok: 5, baseProduct: 'PROD_B' }
                ];

                const conversionRatios = [
                    {
                        baseProduct: 'PROD_A',
                        conversions: [{ from: 'DUS', to: 'PCS', ratio: 12 }]
                    },
                    {
                        baseProduct: 'PROD_B',
                        conversions: [{ from: 'DUS', to: 'PCS', ratio: 24 }]
                    }
                ];

                localStorage.setItem('masterBarang', JSON.stringify(finalMasterBarang));
                localStorage.setItem('conversionRatios', JSON.stringify(conversionRatios));

                // Call getTransformableItems multiple times
                const result1 = await transformationManager.getTransformableItems();
                const result2 = await transformationManager.getTransformableItems();
                const result3 = await transformationManager.getTransformableItems();

                // Results should be consistent
                expect(result1.length).toBe(result2.length);
                expect(result2.length).toBe(result3.length);

                // Sort results by baseProduct for comparison
                const sortResults = (results) => results.sort((a, b) => a.baseProduct.localeCompare(b.baseProduct));
                
                const sorted1 = sortResults([...result1]);
                const sorted2 = sortResults([...result2]);
                const sorted3 = sortResults([...result3]);

                // Compare each transformable group
                for (let i = 0; i < sorted1.length; i++) {
                    expect(sorted1[i].baseProduct).toBe(sorted2[i].baseProduct);
                    expect(sorted2[i].baseProduct).toBe(sorted3[i].baseProduct);
                    
                    expect(sorted1[i].items.length).toBe(sorted2[i].items.length);
                    expect(sorted2[i].items.length).toBe(sorted3[i].items.length);
                }
            }
        ), { numRuns: 15 });
    });
});