/**
 * Property Test: Stock Display Accuracy
 * Validates: Requirements 2.2
 * 
 * Property 7: Stock Display Accuracy
 * Stock levels displayed in transformation options must accurately reflect current inventory
 */

import fc from 'fast-check';
import TransformationManager from '../../js/transformasi-barang/TransformationManager.js';
import { ValidationEngine } from '../../js/transformasi-barang/ValidationEngine.js';
import ConversionCalculator from '../../js/transformasi-barang/ConversionCalculator.js';
import StockManager from '../../js/transformasi-barang/StockManager.js';
import AuditLogger from '../../js/transformasi-barang/AuditLogger.js';

describe('Property Test: Stock Display Accuracy', () => {
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

    test('Property 7: Stock levels in transformation options match current inventory', () => {
        fc.assert(fc.property(
            fc.array(
                fc.record({
                    baseProduct: fc.constantFrom('PROD_A', 'PROD_B', 'PROD_C'),
                    units: fc.array(
                        fc.record({
                            unit: fc.constantFrom('PCS', 'DUS', 'LUSIN'),
                            stock: fc.integer({ min: 0, max: 1000 }),
                            name: fc.string({ minLength: 1, maxLength: 50 })
                        }),
                        { minLength: 2, maxLength: 4 }
                    )
                }),
                { minLength: 1, maxLength: 5 }
            ),
            async (productGroups) => {
                // Create master barang and conversion ratios
                const masterBarang = [];
                const conversionRatios = [];

                productGroups.forEach((group, groupIndex) => {
                    // Ensure unique units per product
                    const uniqueUnits = [...new Set(group.units.map(u => u.unit))];
                    const filteredUnits = uniqueUnits.map(unit => 
                        group.units.find(u => u.unit === unit)
                    );

                    if (filteredUnits.length < 2) return; // Skip single unit products

                    filteredUnits.forEach((unitData, unitIndex) => {
                        masterBarang.push({
                            kode: `${group.baseProduct}_${unitData.unit}_${groupIndex}`,
                            nama: unitData.name,
                            satuan: unitData.unit,
                            stok: unitData.stock,
                            baseProduct: group.baseProduct
                        });
                    });

                    // Create conversion ratios
                    const conversions = [];
                    for (let i = 0; i < filteredUnits.length - 1; i++) {
                        conversions.push({
                            from: filteredUnits[i].unit,
                            to: filteredUnits[i + 1].unit,
                            ratio: 12
                        });
                        conversions.push({
                            from: filteredUnits[i + 1].unit,
                            to: filteredUnits[i].unit,
                            ratio: 1/12
                        });
                    }

                    conversionRatios.push({
                        baseProduct: group.baseProduct,
                        conversions
                    });
                });

                if (masterBarang.length === 0) return; // Skip if no valid products

                // Store test data
                localStorage.setItem('masterBarang', JSON.stringify(masterBarang));
                localStorage.setItem('conversionRatios', JSON.stringify(conversionRatios));

                // Get transformable items
                const transformableItems = await transformationManager.getTransformableItems();

                // Verify stock accuracy in transformable items
                transformableItems.forEach(transformableGroup => {
                    transformableGroup.items.forEach(item => {
                        // Find corresponding item in master barang
                        const masterItem = masterBarang.find(master => master.kode === item.id);
                        expect(masterItem).toBeDefined();

                        // Verify stock matches exactly
                        expect(item.stock).toBe(masterItem.stok);
                        expect(item.name).toBe(masterItem.nama);
                        expect(item.unit).toBe(masterItem.satuan);
                        expect(item.baseProduct).toBe(masterItem.baseProduct);
                    });
                });

                // Test conversion options for each base product
                for (const transformableGroup of transformableItems) {
                    const conversionOptions = await transformationManager.getConversionOptions(transformableGroup.baseProduct);
                    
                    conversionOptions.forEach(option => {
                        // Verify from item stock accuracy
                        const fromMasterItem = masterBarang.find(item => item.satuan === option.from.unit && item.baseProduct === transformableGroup.baseProduct);
                        expect(fromMasterItem).toBeDefined();
                        expect(option.from.stock).toBe(fromMasterItem.stok);
                        expect(option.from.item.stok).toBe(fromMasterItem.stok);

                        // Verify to item stock accuracy
                        const toMasterItem = masterBarang.find(item => item.satuan === option.to.unit && item.baseProduct === transformableGroup.baseProduct);
                        expect(toMasterItem).toBeDefined();
                        expect(option.to.stock).toBe(toMasterItem.stok);
                        expect(option.to.item.stok).toBe(toMasterItem.stok);

                        // Verify availability flag
                        expect(option.available).toBe(fromMasterItem.stok > 0);
                    });
                }
            }
        ), { numRuns: 20 });
    });

    test('Property 7.1: Stock accuracy maintained after stock updates', () => {
        fc.assert(fc.property(
            fc.record({
                initialStock: fc.integer({ min: 100, max: 1000 }),
                stockChanges: fc.array(
                    fc.record({
                        itemUnit: fc.constantFrom('PCS', 'DUS'),
                        change: fc.integer({ min: -50, max: 50 })
                    }),
                    { minLength: 1, maxLength: 5 }
                )
            }),
            async ({ initialStock, stockChanges }) => {
                // Setup test data with known stock levels
                const masterBarang = [
                    {
                        kode: 'TEST_PCS',
                        nama: 'Test Product',
                        satuan: 'PCS',
                        stok: initialStock,
                        baseProduct: 'TEST_PROD'
                    },
                    {
                        kode: 'TEST_DUS',
                        nama: 'Test Product',
                        satuan: 'DUS',
                        stok: Math.floor(initialStock / 12),
                        baseProduct: 'TEST_PROD'
                    }
                ];

                const conversionRatios = [{
                    baseProduct: 'TEST_PROD',
                    conversions: [
                        { from: 'DUS', to: 'PCS', ratio: 12 },
                        { from: 'PCS', to: 'DUS', ratio: 1/12 }
                    ]
                }];

                localStorage.setItem('masterBarang', JSON.stringify(masterBarang));
                localStorage.setItem('conversionRatios', JSON.stringify(conversionRatios));

                // Apply stock changes
                let currentMasterBarang = [...masterBarang];
                for (const change of stockChanges) {
                    const itemIndex = currentMasterBarang.findIndex(item => item.satuan === change.itemUnit);
                    if (itemIndex !== -1) {
                        const newStock = Math.max(0, currentMasterBarang[itemIndex].stok + change.change);
                        currentMasterBarang[itemIndex].stok = newStock;
                        
                        // Update localStorage to simulate stock change
                        localStorage.setItem('masterBarang', JSON.stringify(currentMasterBarang));
                        
                        // Get fresh transformable items after stock change
                        const transformableItems = await transformationManager.getTransformableItems();
                        
                        // Verify stock accuracy after change
                        const testGroup = transformableItems.find(group => group.baseProduct === 'TEST_PROD');
                        if (testGroup) {
                            const changedItem = testGroup.items.find(item => item.unit === change.itemUnit);
                            if (changedItem) {
                                expect(changedItem.stock).toBe(newStock);
                            }
                        }

                        // Verify conversion options reflect updated stock
                        const conversionOptions = await transformationManager.getConversionOptions('TEST_PROD');
                        conversionOptions.forEach(option => {
                            if (option.from.unit === change.itemUnit) {
                                expect(option.from.stock).toBe(newStock);
                                expect(option.available).toBe(newStock > 0);
                            }
                            if (option.to.unit === change.itemUnit) {
                                expect(option.to.stock).toBe(newStock);
                            }
                        });
                    }
                }
            }
        ), { numRuns: 15 });
    });

    test('Property 7.2: Preview shows accurate current and resulting stock levels', () => {
        fc.assert(fc.property(
            fc.record({
                sourceStock: fc.integer({ min: 50, max: 500 }),
                targetStock: fc.integer({ min: 10, max: 100 }),
                transformQuantity: fc.integer({ min: 1, max: 20 })
            }),
            async ({ sourceStock, targetStock, transformQuantity }) => {
                // Setup test data
                const masterBarang = [
                    {
                        kode: 'SOURCE_DUS',
                        nama: 'Test Product',
                        satuan: 'DUS',
                        stok: sourceStock,
                        baseProduct: 'TEST_PROD'
                    },
                    {
                        kode: 'TARGET_PCS',
                        nama: 'Test Product',
                        satuan: 'PCS',
                        stok: targetStock,
                        baseProduct: 'TEST_PROD'
                    }
                ];

                const conversionRatios = [{
                    baseProduct: 'TEST_PROD',
                    conversions: [
                        { from: 'DUS', to: 'PCS', ratio: 12 }
                    ]
                }];

                localStorage.setItem('masterBarang', JSON.stringify(masterBarang));
                localStorage.setItem('conversionRatios', JSON.stringify(conversionRatios));

                // Only test if we have enough source stock
                if (transformQuantity <= sourceStock) {
                    // Get transformation preview
                    const preview = await transformationManager.getTransformationPreview(
                        'SOURCE_DUS', 
                        'TARGET_PCS', 
                        transformQuantity
                    );

                    // Verify current stock accuracy
                    expect(preview.sourceItem.currentStock).toBe(sourceStock);
                    expect(preview.targetItem.currentStock).toBe(targetStock);

                    // Verify transformation quantities
                    expect(preview.sourceItem.transformQuantity).toBe(transformQuantity);
                    expect(preview.targetItem.transformQuantity).toBe(transformQuantity * 12);

                    // Verify resulting stock calculations
                    expect(preview.sourceItem.resultingStock).toBe(sourceStock - transformQuantity);
                    expect(preview.targetItem.resultingStock).toBe(targetStock + (transformQuantity * 12));

                    // Verify conversion ratio
                    expect(preview.conversionRatio).toBe(12);

                    // Verify item details
                    expect(preview.sourceItem.id).toBe('SOURCE_DUS');
                    expect(preview.sourceItem.unit).toBe('DUS');
                    expect(preview.targetItem.id).toBe('TARGET_PCS');
                    expect(preview.targetItem.unit).toBe('PCS');
                }
            }
        ), { numRuns: 25 });
    });

    test('Property 7.3: Stock display consistency across different access methods', () => {
        fc.assert(fc.property(
            fc.array(
                fc.record({
                    kode: fc.string({ minLength: 1, maxLength: 20 }),
                    nama: fc.string({ minLength: 1, maxLength: 50 }),
                    satuan: fc.constantFrom('PCS', 'DUS'),
                    stok: fc.integer({ min: 0, max: 500 }),
                    baseProduct: fc.constantFrom('PROD_A', 'PROD_B')
                }),
                { minLength: 4, maxLength: 8 }
            ),
            async (items) => {
                // Ensure we have both units for each product
                const prodAItems = items.filter(item => item.baseProduct === 'PROD_A');
                const prodBItems = items.filter(item => item.baseProduct === 'PROD_B');

                const masterBarang = [
                    { kode: 'PROD_A_PCS', nama: 'Product A', satuan: 'PCS', stok: 100, baseProduct: 'PROD_A' },
                    { kode: 'PROD_A_DUS', nama: 'Product A', satuan: 'DUS', stok: 20, baseProduct: 'PROD_A' },
                    { kode: 'PROD_B_PCS', nama: 'Product B', satuan: 'PCS', stok: 200, baseProduct: 'PROD_B' },
                    { kode: 'PROD_B_DUS', nama: 'Product B', satuan: 'DUS', stok: 15, baseProduct: 'PROD_B' }
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

                localStorage.setItem('masterBarang', JSON.stringify(masterBarang));
                localStorage.setItem('conversionRatios', JSON.stringify(conversionRatios));

                // Get stock information through different methods
                const transformableItems = await transformationManager.getTransformableItems();
                
                for (const baseProduct of ['PROD_A', 'PROD_B']) {
                    const conversionOptions = await transformationManager.getConversionOptions(baseProduct);
                    
                    // Find transformable group for this base product
                    const transformableGroup = transformableItems.find(group => group.baseProduct === baseProduct);
                    expect(transformableGroup).toBeDefined();

                    // Compare stock information across methods
                    transformableGroup.items.forEach(transformableItem => {
                        // Find corresponding item in master barang
                        const masterItem = masterBarang.find(item => item.kode === transformableItem.id);
                        expect(masterItem).toBeDefined();

                        // Stock should match in transformable items
                        expect(transformableItem.stock).toBe(masterItem.stok);

                        // Stock should match in conversion options
                        const relatedOptions = conversionOptions.filter(option => 
                            option.from.unit === transformableItem.unit || 
                            option.to.unit === transformableItem.unit
                        );

                        relatedOptions.forEach(option => {
                            if (option.from.unit === transformableItem.unit) {
                                expect(option.from.stock).toBe(masterItem.stok);
                                expect(option.from.item.stok).toBe(masterItem.stok);
                            }
                            if (option.to.unit === transformableItem.unit) {
                                expect(option.to.stock).toBe(masterItem.stok);
                                expect(option.to.item.stok).toBe(masterItem.stok);
                            }
                        });
                    });
                }
            }
        ), { numRuns: 15 });
    });
});