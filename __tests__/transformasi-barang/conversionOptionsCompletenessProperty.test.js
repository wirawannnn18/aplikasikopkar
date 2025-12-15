/**
 * Property Test: Conversion Options Completeness
 * Validates: Requirements 2.3
 * 
 * Property 8: Conversion Options Completeness
 * All valid conversion combinations with their ratios must be displayed for each base product
 */

import fc from 'fast-check';
import TransformationManager from '../../js/transformasi-barang/TransformationManager.js';
import { ValidationEngine } from '../../js/transformasi-barang/ValidationEngine.js';
import ConversionCalculator from '../../js/transformasi-barang/ConversionCalculator.js';
import StockManager from '../../js/transformasi-barang/StockManager.js';
import AuditLogger from '../../js/transformasi-barang/AuditLogger.js';

describe('Property Test: Conversion Options Completeness', () => {
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

    test('Property 8: All valid conversion combinations are displayed with correct ratios', () => {
        fc.assert(fc.property(
            fc.record({
                baseProduct: fc.string({ minLength: 1, maxLength: 20 }),
                units: fc.array(
                    fc.record({
                        unit: fc.constantFrom('PCS', 'DUS', 'LUSIN', 'KG'),
                        stock: fc.integer({ min: 0, max: 1000 })
                    }),
                    { minLength: 2, maxLength: 4 }
                ),
                conversions: fc.array(
                    fc.record({
                        from: fc.constantFrom('PCS', 'DUS', 'LUSIN', 'KG'),
                        to: fc.constantFrom('PCS', 'DUS', 'LUSIN', 'KG'),
                        ratio: fc.integer({ min: 1, max: 100 })
                    }),
                    { minLength: 1, maxLength: 10 }
                )
            }),
            async ({ baseProduct, units, conversions }) => {
                // Ensure unique units
                const uniqueUnits = units.reduce((acc, unit) => {
                    if (!acc.find(u => u.unit === unit.unit)) {
                        acc.push(unit);
                    }
                    return acc;
                }, []);

                if (uniqueUnits.length < 2) return; // Skip if less than 2 units

                // Create master barang
                const masterBarang = uniqueUnits.map((unitData, index) => ({
                    kode: `${baseProduct}_${unitData.unit}_${index}`,
                    nama: `Product ${baseProduct}`,
                    satuan: unitData.unit,
                    stok: unitData.stock,
                    baseProduct: baseProduct
                }));

                // Filter conversions to only include units that exist
                const availableUnits = uniqueUnits.map(u => u.unit);
                const validConversions = conversions.filter(conv => 
                    availableUnits.includes(conv.from) && 
                    availableUnits.includes(conv.to) &&
                    conv.from !== conv.to
                );

                if (validConversions.length === 0) return; // Skip if no valid conversions

                const conversionRatios = [{
                    baseProduct: baseProduct,
                    conversions: validConversions
                }];

                // Store test data
                localStorage.setItem('masterBarang', JSON.stringify(masterBarang));
                localStorage.setItem('conversionRatios', JSON.stringify(conversionRatios));

                // Get conversion options
                const conversionOptions = await transformationManager.getConversionOptions(baseProduct);

                // Verify all valid conversions are included
                validConversions.forEach(expectedConversion => {
                    const foundOption = conversionOptions.find(option => 
                        option.from.unit === expectedConversion.from && 
                        option.to.unit === expectedConversion.to
                    );

                    expect(foundOption).toBeDefined();
                    if (foundOption) {
                        // Verify ratio matches
                        expect(foundOption.ratio).toBe(expectedConversion.ratio);

                        // Verify from item details
                        const fromMasterItem = masterBarang.find(item => item.satuan === expectedConversion.from);
                        expect(foundOption.from.item.kode).toBe(fromMasterItem.kode);
                        expect(foundOption.from.item.nama).toBe(fromMasterItem.nama);
                        expect(foundOption.from.stock).toBe(fromMasterItem.stok);

                        // Verify to item details
                        const toMasterItem = masterBarang.find(item => item.satuan === expectedConversion.to);
                        expect(foundOption.to.item.kode).toBe(toMasterItem.kode);
                        expect(foundOption.to.item.nama).toBe(toMasterItem.nama);
                        expect(foundOption.to.stock).toBe(toMasterItem.stok);

                        // Verify availability flag
                        expect(foundOption.available).toBe(fromMasterItem.stok > 0);
                    }
                });

                // Verify no invalid conversions are included
                conversionOptions.forEach(option => {
                    const isValidConversion = validConversions.some(conv => 
                        conv.from === option.from.unit && conv.to === option.to.unit
                    );
                    expect(isValidConversion).toBe(true);
                });
            }
        ), { numRuns: 20 });
    });

    test('Property 8.1: Conversion options include all bidirectional conversions when defined', () => {
        fc.assert(fc.property(
            fc.record({
                baseProduct: fc.string({ minLength: 1, maxLength: 20 }),
                bidirectionalConversions: fc.array(
                    fc.record({
                        unitA: fc.constantFrom('PCS', 'DUS', 'LUSIN'),
                        unitB: fc.constantFrom('PCS', 'DUS', 'LUSIN'),
                        ratioAtoB: fc.integer({ min: 1, max: 50 }),
                        ratioBtoA: fc.integer({ min: 1, max: 50 }),
                        stockA: fc.integer({ min: 0, max: 500 }),
                        stockB: fc.integer({ min: 0, max: 500 })
                    }),
                    { minLength: 1, maxLength: 3 }
                )
            }),
            async ({ baseProduct, bidirectionalConversions }) => {
                // Filter to ensure different units
                const validConversions = bidirectionalConversions.filter(conv => conv.unitA !== conv.unitB);
                if (validConversions.length === 0) return;

                // Create master barang for all units
                const allUnits = new Set();
                validConversions.forEach(conv => {
                    allUnits.add(conv.unitA);
                    allUnits.add(conv.unitB);
                });

                const masterBarang = Array.from(allUnits).map((unit, index) => {
                    const convWithThisUnit = validConversions.find(conv => conv.unitA === unit || conv.unitB === unit);
                    const stock = convWithThisUnit.unitA === unit ? convWithThisUnit.stockA : convWithThisUnit.stockB;
                    
                    return {
                        kode: `${baseProduct}_${unit}_${index}`,
                        nama: `Product ${baseProduct}`,
                        satuan: unit,
                        stok: stock,
                        baseProduct: baseProduct
                    };
                });

                // Create bidirectional conversion ratios
                const conversions = [];
                validConversions.forEach(conv => {
                    conversions.push({
                        from: conv.unitA,
                        to: conv.unitB,
                        ratio: conv.ratioAtoB
                    });
                    conversions.push({
                        from: conv.unitB,
                        to: conv.unitA,
                        ratio: conv.ratioBtoA
                    });
                });

                const conversionRatios = [{
                    baseProduct: baseProduct,
                    conversions: conversions
                }];

                // Store test data
                localStorage.setItem('masterBarang', JSON.stringify(masterBarang));
                localStorage.setItem('conversionRatios', JSON.stringify(conversionRatios));

                // Get conversion options
                const conversionOptions = await transformationManager.getConversionOptions(baseProduct);

                // Verify both directions are available for each bidirectional conversion
                validConversions.forEach(conv => {
                    // Check A to B conversion
                    const atoBOption = conversionOptions.find(option => 
                        option.from.unit === conv.unitA && option.to.unit === conv.unitB
                    );
                    expect(atoBOption).toBeDefined();
                    if (atoBOption) {
                        expect(atoBOption.ratio).toBe(conv.ratioAtoB);
                    }

                    // Check B to A conversion
                    const btoAOption = conversionOptions.find(option => 
                        option.from.unit === conv.unitB && option.to.unit === conv.unitA
                    );
                    expect(btoAOption).toBeDefined();
                    if (btoAOption) {
                        expect(btoAOption.ratio).toBe(conv.ratioBtoA);
                    }
                });

                // Verify total number of options matches expected bidirectional pairs
                const expectedOptionsCount = validConversions.length * 2;
                expect(conversionOptions.length).toBe(expectedOptionsCount);
            }
        ), { numRuns: 15 });
    });

    test('Property 8.2: Conversion options correctly reflect availability based on stock', () => {
        fc.assert(fc.property(
            fc.record({
                conversions: fc.array(
                    fc.record({
                        fromUnit: fc.constantFrom('PCS', 'DUS'),
                        toUnit: fc.constantFrom('PCS', 'DUS'),
                        fromStock: fc.integer({ min: 0, max: 100 }),
                        toStock: fc.integer({ min: 0, max: 100 }),
                        ratio: fc.integer({ min: 1, max: 24 })
                    }),
                    { minLength: 1, maxLength: 4 }
                )
            }),
            async ({ conversions }) => {
                // Filter to ensure different units
                const validConversions = conversions.filter(conv => conv.fromUnit !== conv.toUnit);
                if (validConversions.length === 0) return;

                const baseProduct = 'TEST_PROD';

                // Create master barang
                const units = new Set();
                validConversions.forEach(conv => {
                    units.add(conv.fromUnit);
                    units.add(conv.toUnit);
                });

                const masterBarang = Array.from(units).map((unit, index) => {
                    // Find a conversion that uses this unit to get stock level
                    const convWithThisUnit = validConversions.find(conv => 
                        conv.fromUnit === unit || conv.toUnit === unit
                    );
                    const stock = convWithThisUnit.fromUnit === unit ? 
                        convWithThisUnit.fromStock : convWithThisUnit.toStock;

                    return {
                        kode: `${baseProduct}_${unit}_${index}`,
                        nama: `Test Product`,
                        satuan: unit,
                        stok: stock,
                        baseProduct: baseProduct
                    };
                });

                const conversionRatios = [{
                    baseProduct: baseProduct,
                    conversions: validConversions.map(conv => ({
                        from: conv.fromUnit,
                        to: conv.toUnit,
                        ratio: conv.ratio
                    }))
                }];

                // Store test data
                localStorage.setItem('masterBarang', JSON.stringify(masterBarang));
                localStorage.setItem('conversionRatios', JSON.stringify(conversionRatios));

                // Get conversion options
                const conversionOptions = await transformationManager.getConversionOptions(baseProduct);

                // Verify availability flags
                conversionOptions.forEach(option => {
                    const fromMasterItem = masterBarang.find(item => item.satuan === option.from.unit);
                    expect(fromMasterItem).toBeDefined();

                    // Availability should be true if and only if from stock > 0
                    expect(option.available).toBe(fromMasterItem.stok > 0);

                    // Stock levels should match
                    expect(option.from.stock).toBe(fromMasterItem.stok);
                    
                    const toMasterItem = masterBarang.find(item => item.satuan === option.to.unit);
                    expect(toMasterItem).toBeDefined();
                    expect(option.to.stock).toBe(toMasterItem.stok);
                });
            }
        ), { numRuns: 20 });
    });

    test('Property 8.3: Empty or missing conversion ratios return empty options', () => {
        fc.assert(fc.property(
            fc.record({
                baseProduct: fc.string({ minLength: 1, maxLength: 20 }),
                hasItems: fc.boolean(),
                hasConversions: fc.boolean(),
                emptyConversions: fc.boolean()
            }),
            async ({ baseProduct, hasItems, hasConversions, emptyConversions }) => {
                // Create master barang if hasItems is true
                const masterBarang = hasItems ? [
                    {
                        kode: `${baseProduct}_PCS`,
                        nama: 'Test Product',
                        satuan: 'PCS',
                        stok: 100,
                        baseProduct: baseProduct
                    },
                    {
                        kode: `${baseProduct}_DUS`,
                        nama: 'Test Product',
                        satuan: 'DUS',
                        stok: 10,
                        baseProduct: baseProduct
                    }
                ] : [];

                // Create conversion ratios based on flags
                let conversionRatios = [];
                if (hasConversions) {
                    if (emptyConversions) {
                        conversionRatios = [{
                            baseProduct: baseProduct,
                            conversions: []
                        }];
                    } else {
                        conversionRatios = [{
                            baseProduct: baseProduct,
                            conversions: [
                                { from: 'DUS', to: 'PCS', ratio: 12 }
                            ]
                        }];
                    }
                }

                // Store test data
                localStorage.setItem('masterBarang', JSON.stringify(masterBarang));
                localStorage.setItem('conversionRatios', JSON.stringify(conversionRatios));

                // Get conversion options
                const conversionOptions = await transformationManager.getConversionOptions(baseProduct);

                // Verify results based on test conditions
                if (!hasItems || !hasConversions || emptyConversions) {
                    // Should return empty array
                    expect(conversionOptions).toEqual([]);
                } else {
                    // Should return valid options
                    expect(conversionOptions.length).toBeGreaterThan(0);
                    conversionOptions.forEach(option => {
                        expect(option.from).toBeDefined();
                        expect(option.to).toBeDefined();
                        expect(option.ratio).toBeDefined();
                        expect(typeof option.available).toBe('boolean');
                    });
                }
            }
        ), { numRuns: 15 });
    });

    test('Property 8.4: Conversion options maintain referential integrity with master data', () => {
        fc.assert(fc.property(
            fc.array(
                fc.record({
                    baseProduct: fc.constantFrom('PROD_A', 'PROD_B'),
                    fromUnit: fc.constantFrom('PCS', 'DUS', 'LUSIN'),
                    toUnit: fc.constantFrom('PCS', 'DUS', 'LUSIN'),
                    ratio: fc.integer({ min: 1, max: 50 }),
                    fromStock: fc.integer({ min: 0, max: 200 }),
                    toStock: fc.integer({ min: 0, max: 200 })
                }),
                { minLength: 2, maxLength: 8 }
            ),
            async (conversionSpecs) => {
                // Filter valid conversions (different units)
                const validSpecs = conversionSpecs.filter(spec => spec.fromUnit !== spec.toUnit);
                if (validSpecs.length === 0) return;

                // Group by base product
                const productGroups = {};
                validSpecs.forEach(spec => {
                    if (!productGroups[spec.baseProduct]) {
                        productGroups[spec.baseProduct] = [];
                    }
                    productGroups[spec.baseProduct].push(spec);
                });

                // Create master barang and conversion ratios
                const masterBarang = [];
                const conversionRatios = [];

                Object.entries(productGroups).forEach(([baseProduct, specs]) => {
                    // Get all unique units for this product
                    const units = new Set();
                    specs.forEach(spec => {
                        units.add(spec.fromUnit);
                        units.add(spec.toUnit);
                    });

                    // Create items for each unit
                    Array.from(units).forEach((unit, index) => {
                        const specWithThisUnit = specs.find(spec => 
                            spec.fromUnit === unit || spec.toUnit === unit
                        );
                        const stock = specWithThisUnit.fromUnit === unit ? 
                            specWithThisUnit.fromStock : specWithThisUnit.toStock;

                        masterBarang.push({
                            kode: `${baseProduct}_${unit}_${index}`,
                            nama: `Product ${baseProduct}`,
                            satuan: unit,
                            stok: stock,
                            baseProduct: baseProduct
                        });
                    });

                    // Create conversion ratios
                    conversionRatios.push({
                        baseProduct: baseProduct,
                        conversions: specs.map(spec => ({
                            from: spec.fromUnit,
                            to: spec.toUnit,
                            ratio: spec.ratio
                        }))
                    });
                });

                // Store test data
                localStorage.setItem('masterBarang', JSON.stringify(masterBarang));
                localStorage.setItem('conversionRatios', JSON.stringify(conversionRatios));

                // Test each base product
                for (const baseProduct of Object.keys(productGroups)) {
                    const conversionOptions = await transformationManager.getConversionOptions(baseProduct);

                    conversionOptions.forEach(option => {
                        // Verify from item referential integrity
                        const fromMasterItem = masterBarang.find(item => 
                            item.satuan === option.from.unit && 
                            item.baseProduct === baseProduct
                        );
                        expect(fromMasterItem).toBeDefined();
                        expect(option.from.item.kode).toBe(fromMasterItem.kode);
                        expect(option.from.item.nama).toBe(fromMasterItem.nama);
                        expect(option.from.item.satuan).toBe(fromMasterItem.satuan);
                        expect(option.from.item.stok).toBe(fromMasterItem.stok);

                        // Verify to item referential integrity
                        const toMasterItem = masterBarang.find(item => 
                            item.satuan === option.to.unit && 
                            item.baseProduct === baseProduct
                        );
                        expect(toMasterItem).toBeDefined();
                        expect(option.to.item.kode).toBe(toMasterItem.kode);
                        expect(option.to.item.nama).toBe(toMasterItem.nama);
                        expect(option.to.item.satuan).toBe(toMasterItem.satuan);
                        expect(option.to.item.stok).toBe(toMasterItem.stok);

                        // Verify conversion ratio matches specification
                        const matchingSpec = validSpecs.find(spec => 
                            spec.baseProduct === baseProduct &&
                            spec.fromUnit === option.from.unit &&
                            spec.toUnit === option.to.unit
                        );
                        expect(matchingSpec).toBeDefined();
                        expect(option.ratio).toBe(matchingSpec.ratio);
                    });
                }
            }
        ), { numRuns: 15 });
    });
});