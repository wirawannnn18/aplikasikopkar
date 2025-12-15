/**
 * Test untuk ValidationEngine sistem transformasi barang
 * 
 * Test ini memverifikasi bahwa ValidationEngine berfungsi dengan benar
 * dan menerapkan business rules yang tepat.
 */

// Import dependencies untuk testing
import fc from 'fast-check';

// Import komponen yang akan ditest
import { ValidationEngine } from '../../js/transformasi-barang/ValidationEngine.js';

describe('Transformasi Barang - ValidationEngine Tests', () => {
    let validationEngine;

    beforeEach(() => {
        // Clear localStorage
        localStorage.clear();
        
        // Setup mock data
        const mockMasterBarang = [
            {
                kode: 'AQUA-DUS',
                nama: 'Aqua 1L DUS',
                baseProduct: 'AQUA-1L',
                kategori: 'minuman',
                satuan: 'dus',
                stok: 10,
                hargaBeli: 12000
            },
            {
                kode: 'AQUA-PCS',
                nama: 'Aqua 1L PCS',
                baseProduct: 'AQUA-1L',
                kategori: 'minuman',
                satuan: 'pcs',
                stok: 5,
                hargaBeli: 1000
            },
            {
                kode: 'COCA-DUS',
                nama: 'Coca Cola 1L DUS',
                baseProduct: 'COCA-1L',
                kategori: 'minuman',
                satuan: 'dus',
                stok: 8,
                hargaBeli: 15000
            }
        ];

        const mockConversionRatios = [
            {
                baseProduct: 'AQUA-1L',
                conversions: [
                    { from: 'dus', to: 'pcs', ratio: 12 },
                    { from: 'pcs', to: 'dus', ratio: 0.0833 }
                ]
            },
            {
                baseProduct: 'COCA-1L',
                conversions: [
                    { from: 'dus', to: 'pcs', ratio: 24 }
                ]
            }
        ];

        localStorage.setItem('masterBarang', JSON.stringify(mockMasterBarang));
        localStorage.setItem('conversionRatios', JSON.stringify(mockConversionRatios));

        // Create and initialize ValidationEngine
        validationEngine = new ValidationEngine();
        validationEngine.initialize();
    });

    describe('Initialization', () => {
        test('should initialize successfully', () => {
            expect(validationEngine.initialized).toBe(true);
        });

        test('should throw error when not initialized', () => {
            const uninitializedEngine = new ValidationEngine();
            expect(() => uninitializedEngine.validateInputData({}))
                .toThrow('ValidationEngine belum diinisialisasi');
        });
    });

    describe('Input Data Validation', () => {
        test('should validate correct input data', () => {
            const validData = {
                sourceItemId: 'AQUA-DUS',
                targetItemId: 'AQUA-PCS',
                sourceQuantity: 1,
                user: 'kasir01'
            };

            const result = validationEngine.validateInputData(validData);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('should reject invalid input data', () => {
            const invalidData = {
                sourceItemId: '',
                targetItemId: null,
                sourceQuantity: -1,
                user: ''
            };

            const result = validationEngine.validateInputData(invalidData);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        test('should handle null data', () => {
            const result = validationEngine.validateInputData(null);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Data transformasi tidak boleh kosong');
        });
    });

    describe('Product Match Validation', () => {
        test('should validate matching products', () => {
            const sourceItem = {
                baseProduct: 'AQUA-1L',
                satuan: 'dus',
                nama: 'Aqua 1L DUS'
            };
            const targetItem = {
                baseProduct: 'AQUA-1L',
                satuan: 'pcs',
                nama: 'Aqua 1L PCS'
            };

            const result = validationEngine.validateProductMatch(sourceItem, targetItem);
            expect(result.isValid).toBe(true);
        });

        test('should reject different base products', () => {
            const sourceItem = {
                baseProduct: 'AQUA-1L',
                satuan: 'dus',
                nama: 'Aqua 1L DUS'
            };
            const targetItem = {
                baseProduct: 'COCA-1L',
                satuan: 'dus',
                nama: 'Coca Cola 1L DUS'
            };

            const result = validationEngine.validateProductMatch(sourceItem, targetItem);
            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toContain('AQUA-1L ≠ COCA-1L');
        });

        test('should reject same units', () => {
            const sourceItem = {
                baseProduct: 'AQUA-1L',
                satuan: 'dus',
                nama: 'Aqua 1L DUS'
            };
            const targetItem = {
                baseProduct: 'AQUA-1L',
                satuan: 'dus',
                nama: 'Aqua 1L DUS'
            };

            const result = validationEngine.validateProductMatch(sourceItem, targetItem);
            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toContain('unit yang sama');
        });

        test('should handle missing base product', () => {
            const sourceItem = { satuan: 'dus', nama: 'Test' };
            const targetItem = { satuan: 'pcs', nama: 'Test' };

            const result = validationEngine.validateProductMatch(sourceItem, targetItem);
            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toContain('base product');
        });
    });

    describe('Stock Availability Validation', () => {
        test('should validate sufficient stock', () => {
            const sourceItem = { nama: 'Aqua DUS', satuan: 'dus', stok: 10 };
            const quantity = 5;

            const result = validationEngine.validateStockAvailability(sourceItem, quantity);
            expect(result.isValid).toBe(true);
        });

        test('should reject insufficient stock', () => {
            const sourceItem = { nama: 'Aqua DUS', satuan: 'dus', stok: 3 };
            const quantity = 5;

            const result = validationEngine.validateStockAvailability(sourceItem, quantity);
            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toContain('Stok tidak mencukupi');
        });

        test('should reject zero stock', () => {
            const sourceItem = { nama: 'Aqua DUS', satuan: 'dus', stok: 0 };
            const quantity = 1;

            const result = validationEngine.validateStockAvailability(sourceItem, quantity);
            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toContain('habis');
        });

        test('should warn about low remaining stock', () => {
            const sourceItem = { nama: 'Aqua DUS', satuan: 'dus', stok: 5 };
            const quantity = 3;

            const result = validationEngine.validateStockAvailability(sourceItem, quantity);
            expect(result.isValid).toBe(true);
            expect(result.warnings[0]).toContain('tersisa sedikit');
        });

        test('should warn about large quantity transformation', () => {
            const sourceItem = { nama: 'Aqua DUS', satuan: 'dus', stok: 10 };
            const quantity = 8; // More than 50%

            const result = validationEngine.validateStockAvailability(sourceItem, quantity);
            expect(result.isValid).toBe(true);
            expect(result.warnings[0]).toContain('jumlah besar');
        });
    });

    describe('Conversion Ratio Validation', () => {
        test('should validate existing conversion ratio', () => {
            const result = validationEngine.validateConversionRatio('dus', 'pcs', 'AQUA-1L');
            expect(result.isValid).toBe(true);
        });

        test('should reject missing conversion ratio', () => {
            const result = validationEngine.validateConversionRatio('dus', 'liter', 'AQUA-1L');
            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toContain('tidak ditemukan');
        });

        test('should reject same units', () => {
            const result = validationEngine.validateConversionRatio('dus', 'dus', 'AQUA-1L');
            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toContain('tidak boleh sama');
        });

        test('should handle missing base product', () => {
            const result = validationEngine.validateConversionRatio('dus', 'pcs', 'UNKNOWN-PRODUCT');
            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toContain('tidak ditemukan');
        });
    });

    describe('Quantity Calculation Validation', () => {
        test('should validate correct calculation', () => {
            const result = validationEngine.validateQuantityCalculation(1, 12, 12);
            expect(result.isValid).toBe(true);
        });

        test('should reject incorrect calculation', () => {
            const result = validationEngine.validateQuantityCalculation(1, 10, 12);
            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toContain('tidak akurat');
        });

        test('should reject non-integer results', () => {
            const result = validationEngine.validateQuantityCalculation(1, 12.5, 12.5);
            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toContain('bilangan bulat');
        });

        test('should warn about very large results', () => {
            const result = validationEngine.validateQuantityCalculation(1000, 12000, 12);
            expect(result.isValid).toBe(true);
            expect(result.warnings[0]).toContain('sangat besar');
        });
    });

    describe('Comprehensive Transformation Request Validation', () => {
        test('should validate complete valid request', async () => {
            const request = {
                sourceItemId: 'AQUA-DUS',
                targetItemId: 'AQUA-PCS',
                sourceQuantity: 1,
                user: 'kasir01'
            };

            const result = await validationEngine.validateTransformationRequest(request);
            expect(result.isValid).toBe(true);
        });

        test('should reject request with invalid source item', async () => {
            const request = {
                sourceItemId: 'INVALID-ITEM',
                targetItemId: 'AQUA-PCS',
                sourceQuantity: 1,
                user: 'kasir01'
            };

            const result = await validationEngine.validateTransformationRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.includes('tidak ditemukan'))).toBe(true);
        });

        test('should reject request with insufficient stock', async () => {
            const request = {
                sourceItemId: 'AQUA-DUS',
                targetItemId: 'AQUA-PCS',
                sourceQuantity: 20, // More than available (10)
                user: 'kasir01'
            };

            const result = await validationEngine.validateTransformationRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.includes('tidak mencukupi'))).toBe(true);
        });
    });

    describe('System Configuration Validation', () => {
        test('should validate proper system configuration', () => {
            const result = validationEngine.validateSystemConfiguration();
            expect(result.isValid).toBe(true);
        });

        test('should detect missing master barang', () => {
            localStorage.removeItem('masterBarang');
            const result = validationEngine.validateSystemConfiguration();
            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toContain('master barang kosong');
        });

        test('should detect missing conversion ratios', () => {
            localStorage.removeItem('conversionRatios');
            const result = validationEngine.validateSystemConfiguration();
            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toContain('rasio konversi tidak ditemukan');
        });
    });

    describe('Property-Based Tests for ValidationEngine', () => {
        test('Product validation should be consistent', () => {
            /**
             * Feature: transformasi-barang, Property 1: Product Validation Consistency
             * Validates: Requirements 1.1
             */
            fc.assert(fc.property(
                fc.record({
                    baseProduct: fc.string({ minLength: 1 }),
                    satuan: fc.string({ minLength: 1 }),
                    nama: fc.string({ minLength: 1 })
                }),
                fc.record({
                    baseProduct: fc.string({ minLength: 1 }),
                    satuan: fc.string({ minLength: 1 }),
                    nama: fc.string({ minLength: 1 })
                }),
                (sourceItem, targetItem) => {
                    const result = validationEngine.validateProductMatch(sourceItem, targetItem);
                    
                    // If base products are the same and units are different, should be valid
                    if (sourceItem.baseProduct === targetItem.baseProduct && 
                        sourceItem.satuan !== targetItem.satuan) {
                        expect(result.isValid).toBe(true);
                    }
                    
                    // If base products are different, should be invalid
                    if (sourceItem.baseProduct !== targetItem.baseProduct) {
                        expect(result.isValid).toBe(false);
                    }
                    
                    // If units are the same, should be invalid
                    if (sourceItem.satuan === targetItem.satuan) {
                        expect(result.isValid).toBe(false);
                    }
                }
            ), { numRuns: 100 });
        });

        test('Stock validation should be consistent', () => {
            /**
             * Feature: transformasi-barang, Property 11: Stock Availability Validation
             * Validates: Requirements 3.1
             */
            fc.assert(fc.property(
                fc.record({
                    nama: fc.string({ minLength: 1 }),
                    satuan: fc.string({ minLength: 1 }),
                    stok: fc.integer({ min: 0, max: 1000 })
                }),
                fc.integer({ min: 1, max: 100 }),
                (sourceItem, quantity) => {
                    const result = validationEngine.validateStockAvailability(sourceItem, quantity);
                    
                    // If stock is sufficient, should be valid
                    if (sourceItem.stok >= quantity) {
                        expect(result.isValid).toBe(true);
                    }
                    
                    // If stock is insufficient, should be invalid
                    if (sourceItem.stok < quantity) {
                        expect(result.isValid).toBe(false);
                    }
                    
                    // Should always have proper error/warning structure
                    expect(Array.isArray(result.errors)).toBe(true);
                    expect(Array.isArray(result.warnings)).toBe(true);
                }
            ), { numRuns: 100 });
        });

        test('Quantity calculation validation should be mathematically consistent', () => {
            /**
             * Feature: transformasi-barang, Property 12: Whole Number Conversion
             * Validates: Requirements 3.2
             */
            fc.assert(fc.property(
                fc.integer({ min: 1, max: 100 }),
                fc.integer({ min: 1, max: 50 }),
                (sourceQty, ratio) => {
                    const targetQty = sourceQty * ratio;
                    const result = validationEngine.validateQuantityCalculation(sourceQty, targetQty, ratio);
                    
                    // Correct calculation should always be valid
                    expect(result.isValid).toBe(true);
                    
                    // Should not have calculation errors
                    expect(result.errors.some(e => e.includes('tidak akurat'))).toBe(false);
                }
            ), { numRuns: 100 });
        });
    });
});