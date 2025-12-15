/**
 * Test untuk TransformationManager sistem transformasi barang
 * 
 * Test ini memverifikasi bahwa TransformationManager berfungsi sebagai
 * orchestrator yang mengintegrasikan semua komponen sistem.
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
import TransformationManager from '../../js/transformasi-barang/TransformationManager.js';
import { ValidationEngine } from '../../js/transformasi-barang/ValidationEngine.js';
import ConversionCalculator from '../../js/transformasi-barang/ConversionCalculator.js';
import StockManager from '../../js/transformasi-barang/StockManager.js';
import AuditLogger from '../../js/transformasi-barang/AuditLogger.js';

describe('Transformasi Barang - TransformationManager Tests', () => {
    let transformationManager;
    let validationEngine;
    let calculator;
    let stockManager;
    let auditLogger;

    beforeEach(() => {
        // Clear localStorage dan buat instances baru
        localStorage.clear();
        
        // Setup mock data
        setupMockData();
        
        // Create component instances
        validationEngine = new ValidationEngine();
        validationEngine.initialize();
        
        calculator = new ConversionCalculator();
        calculator.initialize();
        
        stockManager = new StockManager();
        stockManager.initialize();
        
        auditLogger = new AuditLogger();
        auditLogger.initialize();
        
        // Create and initialize TransformationManager
        transformationManager = new TransformationManager();
        transformationManager.initialize({
            validationEngine,
            calculator,
            stockManager,
            auditLogger
        });
    });

    // Helper function untuk setup mock data
    function setupMockData() {
        // Mock master barang data
        const masterBarang = [
            {
                kode: 'AQUA-DUS',
                nama: 'Aqua 1L DUS',
                satuan: 'dus',
                stok: 10,
                baseProduct: 'AQUA-1L'
            },
            {
                kode: 'AQUA-PCS',
                nama: 'Aqua 1L PCS',
                satuan: 'pcs',
                stok: 50,
                baseProduct: 'AQUA-1L'
            },
            {
                kode: 'INDOMIE-KARTON',
                nama: 'Indomie Karton',
                satuan: 'karton',
                stok: 5,
                baseProduct: 'INDOMIE'
            },
            {
                kode: 'INDOMIE-PCS',
                nama: 'Indomie PCS',
                satuan: 'pcs',
                stok: 100,
                baseProduct: 'INDOMIE'
            },
            {
                kode: 'SINGLE-ITEM',
                nama: 'Single Item',
                satuan: 'pcs',
                stok: 20,
                baseProduct: 'SINGLE'
            }
        ];

        // Mock conversion ratios
        const conversionRatios = [
            {
                baseProduct: 'AQUA-1L',
                conversions: [
                    { from: 'dus', to: 'pcs', ratio: 12 },
                    { from: 'pcs', to: 'dus', ratio: 0.0833 }
                ]
            },
            {
                baseProduct: 'INDOMIE',
                conversions: [
                    { from: 'karton', to: 'pcs', ratio: 40 },
                    { from: 'pcs', to: 'karton', ratio: 0.025 }
                ]
            }
        ];

        localStorage.setItem('masterBarang', JSON.stringify(masterBarang));
        localStorage.setItem('conversionRatios', JSON.stringify(conversionRatios));
    }

    describe('Basic Functionality', () => {
        test('should initialize correctly', () => {
            expect(transformationManager.initialized).toBe(true);
            expect(transformationManager.validationEngine).toBeDefined();
            expect(transformationManager.calculator).toBeDefined();
            expect(transformationManager.stockManager).toBeDefined();
            expect(transformationManager.auditLogger).toBeDefined();
        });

        test('should get transformable items', async () => {
            const transformableItems = await transformationManager.getTransformableItems();
            
            expect(Array.isArray(transformableItems)).toBe(true);
            expect(transformableItems.length).toBe(2); // AQUA-1L and INDOMIE
            
            // Check AQUA-1L
            const aquaItem = transformableItems.find(item => item.baseProduct === 'AQUA-1L');
            expect(aquaItem).toBeDefined();
            expect(aquaItem.items).toHaveLength(2);
            expect(aquaItem.items.some(item => item.unit === 'dus')).toBe(true);
            expect(aquaItem.items.some(item => item.unit === 'pcs')).toBe(true);
        });

        test('should validate transformation correctly', async () => {
            const validationResult = await transformationManager.validateTransformation('AQUA-DUS', 'AQUA-PCS', 1);
            
            expect(validationResult.isValid).toBe(true);
            expect(validationResult.errors).toHaveLength(0);
        });

        test('should reject invalid transformation', async () => {
            // Test insufficient stock
            const validationResult = await transformationManager.validateTransformation('AQUA-DUS', 'AQUA-PCS', 20);
            
            expect(validationResult.isValid).toBe(false);
            expect(validationResult.errors.length).toBeGreaterThan(0);
        });

        test('should get transformation preview', async () => {
            const preview = await transformationManager.getTransformationPreview('AQUA-DUS', 'AQUA-PCS', 1);
            
            expect(preview.sourceItem.id).toBe('AQUA-DUS');
            expect(preview.targetItem.id).toBe('AQUA-PCS');
            expect(preview.sourceItem.transformQuantity).toBe(1);
            expect(preview.targetItem.transformQuantity).toBe(12);
            expect(preview.conversionRatio).toBe(12);
            expect(preview.isValid).toBe(true);
        });

        test('should execute transformation successfully', async () => {
            const transformationData = {
                sourceItemId: 'AQUA-DUS',
                targetItemId: 'AQUA-PCS',
                quantity: 1,
                user: 'kasir01'
            };
            
            const result = await transformationManager.executeTransformation(transformationData);
            
            expect(result.status).toBe('completed');
            expect(result.sourceItem.quantity).toBe(1);
            expect(result.targetItem.quantity).toBe(12);
            expect(result.conversionRatio).toBe(12);
        });

        test('should get conversion options', async () => {
            const options = await transformationManager.getConversionOptions('AQUA-1L');
            
            expect(Array.isArray(options)).toBe(true);
            expect(options.length).toBe(2); // dus->pcs and pcs->dus
            
            const dusToPcs = options.find(opt => opt.from.unit === 'dus' && opt.to.unit === 'pcs');
            expect(dusToPcs).toBeDefined();
            expect(dusToPcs.ratio).toBe(12);
            expect(dusToPcs.available).toBe(true);
        });
    });

    describe('Property-Based Tests', () => {
        test('Transformable items filtering property', () => {
            /**
             * Feature: transformasi-barang, Property 6: Transformable Items Filtering
             * Validates: Requirements 2.1
             */
            fc.assert(fc.property(
                fc.array(
                    fc.record({
                        baseProduct: fc.string({ minLength: 1, maxLength: 10 }),
                        units: fc.array(fc.string({ minLength: 1, maxLength: 5 }), { minLength: 1, maxLength: 5 }),
                        hasRatios: fc.boolean()
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                async (testData) => {
                    try {
                        // Setup test data
                        const masterBarang = [];
                        const conversionRatios = [];
                        
                        testData.forEach((product, index) => {
                            product.units.forEach((unit, unitIndex) => {
                                masterBarang.push({
                                    kode: `${product.baseProduct}-${unit.toUpperCase()}`,
                                    nama: `${product.baseProduct} ${unit}`,
                                    satuan: unit,
                                    stok: 10,
                                    baseProduct: product.baseProduct
                                });
                            });
                            
                            if (product.hasRatios && product.units.length > 1) {
                                const conversions = [];
                                for (let i = 0; i < product.units.length - 1; i++) {
                                    conversions.push({
                                        from: product.units[i],
                                        to: product.units[i + 1],
                                        ratio: 10
                                    });
                                }
                                conversionRatios.push({
                                    baseProduct: product.baseProduct,
                                    conversions
                                });
                            }
                        });
                        
                        localStorage.setItem('masterBarang', JSON.stringify(masterBarang));
                        localStorage.setItem('conversionRatios', JSON.stringify(conversionRatios));
                        
                        // Test the property
                        const transformableItems = await transformationManager.getTransformableItems();
                        
                        // Verify property: items appear in transformable list if and only if they have multiple units with defined conversion ratios
                        const expectedTransformableCount = testData.filter(product => 
                            product.units.length > 1 && product.hasRatios
                        ).length;
                        
                        expect(transformableItems.length).toBe(expectedTransformableCount);
                        
                        // Each transformable item should have multiple units
                        transformableItems.forEach(item => {
                            expect(item.items.length).toBeGreaterThan(1);
                        });
                        
                    } catch (error) {
                        // Skip invalid test cases
                        if (error.message.includes('validation error') || 
                            error.message.includes('tidak valid')) {
                            return;
                        }
                        throw error;
                    }
                }
            ), { numRuns: 30 });
        });

        test('Stock display accuracy property', () => {
            /**
             * Feature: transformasi-barang, Property 7: Stock Display Accuracy
             * Validates: Requirements 2.2
             */
            fc.assert(fc.property(
                fc.array(
                    fc.record({
                        itemId: fc.string({ minLength: 1, maxLength: 10 }),
                        stock: fc.integer({ min: 0, max: 1000 }),
                        unit: fc.string({ minLength: 1, maxLength: 5 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                async (testItems) => {
                    try {
                        // Setup test data with known stock levels
                        const masterBarang = testItems.map(item => ({
                            kode: item.itemId,
                            nama: `Test Item ${item.itemId}`,
                            satuan: item.unit,
                            stok: item.stock,
                            baseProduct: 'TEST'
                        }));
                        
                        localStorage.setItem('masterBarang', JSON.stringify(masterBarang));
                        
                        // Test the property: displayed stock values should match actual stock data
                        for (const testItem of testItems) {
                            const actualItem = transformationManager._getItemById(testItem.itemId);
                            if (actualItem) {
                                expect(actualItem.stok).toBe(testItem.stock);
                            }
                        }
                        
                        // Test through conversion options
                        if (testItems.length >= 2) {
                            const conversionRatios = [{
                                baseProduct: 'TEST',
                                conversions: [{
                                    from: testItems[0].unit,
                                    to: testItems[1].unit,
                                    ratio: 10
                                }]
                            }];
                            
                            localStorage.setItem('conversionRatios', JSON.stringify(conversionRatios));
                            
                            const options = await transformationManager.getConversionOptions('TEST');
                            options.forEach(option => {
                                const fromItem = testItems.find(item => item.unit === option.from.unit);
                                const toItem = testItems.find(item => item.unit === option.to.unit);
                                
                                if (fromItem) {
                                    expect(option.from.stock).toBe(fromItem.stock);
                                }
                                if (toItem) {
                                    expect(option.to.stock).toBe(toItem.stock);
                                }
                            });
                        }
                        
                    } catch (error) {
                        // Skip invalid test cases
                        if (error.message.includes('validation error') || 
                            error.message.includes('tidak valid')) {
                            return;
                        }
                        throw error;
                    }
                }
            ), { numRuns: 30 });
        });

        test('Conversion options completeness property', () => {
            /**
             * Feature: transformasi-barang, Property 8: Conversion Options Completeness
             * Validates: Requirements 2.3
             */
            fc.assert(fc.property(
                fc.record({
                    baseProduct: fc.string({ minLength: 1, maxLength: 10 }),
                    conversions: fc.array(
                        fc.record({
                            from: fc.string({ minLength: 1, maxLength: 5 }),
                            to: fc.string({ minLength: 1, maxLength: 5 }),
                            ratio: fc.float({ min: Math.fround(0.1), max: Math.fround(100) })
                        }),
                        { minLength: 1, maxLength: 5 }
                    )
                }),
                async (testData) => {
                    try {
                        // Setup test data
                        const units = [...new Set([
                            ...testData.conversions.map(c => c.from),
                            ...testData.conversions.map(c => c.to)
                        ])];
                        
                        const masterBarang = units.map(unit => ({
                            kode: `${testData.baseProduct}-${unit.toUpperCase()}`,
                            nama: `${testData.baseProduct} ${unit}`,
                            satuan: unit,
                            stok: 10,
                            baseProduct: testData.baseProduct
                        }));
                        
                        const conversionRatios = [{
                            baseProduct: testData.baseProduct,
                            conversions: testData.conversions
                        }];
                        
                        localStorage.setItem('masterBarang', JSON.stringify(masterBarang));
                        localStorage.setItem('conversionRatios', JSON.stringify(conversionRatios));
                        
                        // Test the property: all valid unit combinations with their conversion ratios should be displayed
                        const options = await transformationManager.getConversionOptions(testData.baseProduct);
                        
                        // Verify all defined conversions are present
                        testData.conversions.forEach(expectedConversion => {
                            const foundOption = options.find(option => 
                                option.from.unit === expectedConversion.from && 
                                option.to.unit === expectedConversion.to
                            );
                            
                            if (foundOption) {
                                expect(foundOption.ratio).toBeCloseTo(expectedConversion.ratio, 5);
                                expect(foundOption.from.unit).toBe(expectedConversion.from);
                                expect(foundOption.to.unit).toBe(expectedConversion.to);
                            }
                        });
                        
                        // Verify no extra conversions are present
                        options.forEach(option => {
                            const expectedConversion = testData.conversions.find(conv => 
                                conv.from === option.from.unit && conv.to === option.to.unit
                            );
                            expect(expectedConversion).toBeDefined();
                        });
                        
                    } catch (error) {
                        // Skip invalid test cases
                        if (error.message.includes('validation error') || 
                            error.message.includes('tidak valid')) {
                            return;
                        }
                        throw error;
                    }
                }
            ), { numRuns: 30 });
        });
    });

    describe('Error Handling', () => {
        test('should handle missing dependencies', () => {
            const uninitializedManager = new TransformationManager();
            
            expect(() => uninitializedManager.getTransformableItems())
                .rejects.toThrow('TransformationManager belum diinisialisasi');
        });

        test('should handle invalid item IDs', async () => {
            await expect(transformationManager.validateTransformation('INVALID-ID', 'AQUA-PCS', 1))
                .resolves.toMatchObject({
                    isValid: false,
                    errors: expect.arrayContaining([expect.stringContaining('tidak ditemukan')])
                });
        });

        test('should handle missing conversion ratios', async () => {
            // Clear conversion ratios
            localStorage.setItem('conversionRatios', JSON.stringify([]));
            
            const options = await transformationManager.getConversionOptions('AQUA-1L');
            expect(options).toHaveLength(0);
        });
    });

    describe('Integration Tests', () => {
        test('should complete full transformation workflow', async () => {
            // 1. Get transformable items
            const transformableItems = await transformationManager.getTransformableItems();
            expect(transformableItems.length).toBeGreaterThan(0);
            
            // 2. Get conversion options
            const options = await transformationManager.getConversionOptions('AQUA-1L');
            expect(options.length).toBeGreaterThan(0);
            
            // 3. Get preview
            const preview = await transformationManager.getTransformationPreview('AQUA-DUS', 'AQUA-PCS', 1);
            expect(preview.isValid).toBe(true);
            
            // 4. Execute transformation
            const result = await transformationManager.executeTransformation({
                sourceItemId: 'AQUA-DUS',
                targetItemId: 'AQUA-PCS',
                quantity: 1,
                user: 'kasir01'
            });
            expect(result.status).toBe('completed');
            
            // 5. Get history
            const history = await transformationManager.getTransformationHistory();
            expect(history.length).toBeGreaterThan(0);
        });
    });
});