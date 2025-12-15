/**
 * Property-based tests untuk Stock Validation - Transformasi Barang
 * 
 * Property 11: Stock Availability Validation
 * Validates: Requirements 3.1
 */

import fc from 'fast-check';

// Import ValidationEngine
import { ValidationEngine } from '../../js/transformasi-barang/ValidationEngine.js';

// Mock localStorage untuk testing
const mockLocalStorage = {
    data: {},
    getItem: function(key) { return this.data[key] || null; },
    setItem: function(key, value) { this.data[key] = value; },
    removeItem: function(key) { delete this.data[key]; }
};

// Setup localStorage mock
if (typeof global !== 'undefined') {
    global.localStorage = mockLocalStorage;
} else if (typeof window !== 'undefined') {
    window.localStorage = mockLocalStorage;
}

describe('Feature: transformasi-barang, Property 11: Stock Availability Validation', () => {
    
    let validator;
    
    beforeEach(() => {
        validator = new ValidationEngine();
        validator.initialize();
    });

    // Generator untuk item dengan stok yang cukup
    const itemWithSufficientStockArb = fc.record({
        kode: fc.string({ minLength: 1 }),
        nama: fc.string({ minLength: 1 }),
        satuan: fc.string({ minLength: 1 }),
        stok: fc.integer({ min: 10, max: 1000 }),
        kategori: fc.string({ minLength: 1 })
    });

    // Generator untuk item dengan stok kosong atau sedikit
    const itemWithInsufficientStockArb = fc.record({
        kode: fc.string({ minLength: 1 }),
        nama: fc.string({ minLength: 1 }),
        satuan: fc.string({ minLength: 1 }),
        stok: fc.integer({ min: 0, max: 5 }),
        kategori: fc.string({ minLength: 1 })
    });

    // Generator untuk quantity yang valid
    const validQuantityArb = fc.integer({ min: 1, max: 100 });

    // Generator untuk quantity yang invalid
    const invalidQuantityArb = fc.oneof(
        fc.integer({ max: 0 }),
        fc.constant(null),
        fc.constant(undefined),
        fc.constant('invalid'),
        fc.constant(NaN),
        fc.constant(Infinity)
    );

    test('Property 11.1: Sufficient stock should allow transformation', () => {
        fc.assert(fc.property(itemWithSufficientStockArb, validQuantityArb, (item, quantity) => {
            // Ensure quantity is less than or equal to stock
            const adjustedQuantity = Math.min(quantity, item.stok);
            
            const result = validator.validateStockAvailability(item, adjustedQuantity);
            
            // Should be valid when stock is sufficient
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        }), { numRuns: 100 });
    });

    test('Property 11.2: Insufficient stock should prevent transformation', () => {
        fc.assert(fc.property(itemWithSufficientStockArb, validQuantityArb, (item, quantity) => {
            // Ensure quantity is greater than stock
            const excessiveQuantity = item.stok + quantity + 1;
            
            const result = validator.validateStockAvailability(item, excessiveQuantity);
            
            // Should be invalid when quantity exceeds stock
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(error => error.includes('tidak mencukupi'))).toBe(true);
        }), { numRuns: 100 });
    });

    test('Property 11.3: Zero or negative stock should prevent transformation', () => {
        fc.assert(fc.property(validQuantityArb, (quantity) => {
            const itemWithZeroStock = {
                kode: 'TEST-001',
                nama: 'Test Item',
                satuan: 'pcs',
                stok: 0,
                kategori: 'test'
            };
            
            const result = validator.validateStockAvailability(itemWithZeroStock, quantity);
            
            // Should be invalid when stock is zero
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(error => error.includes('habis'))).toBe(true);
        }), { numRuns: 50 });
    });

    test('Property 11.4: Invalid quantity should be rejected', () => {
        fc.assert(fc.property(itemWithSufficientStockArb, invalidQuantityArb, (item, invalidQuantity) => {
            const result = validator.validateStockAvailability(item, invalidQuantity);
            
            // Should be invalid for invalid quantities
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(error => error.includes('angka positif'))).toBe(true);
        }), { numRuns: 50 });
    });

    test('Property 11.5: Null or undefined item should be rejected', () => {
        const invalidItemsArb = fc.oneof(
            fc.constant(null),
            fc.constant(undefined)
        );

        fc.assert(fc.property(invalidItemsArb, validQuantityArb, (invalidItem, quantity) => {
            const result = validator.validateStockAvailability(invalidItem, quantity);
            
            // Should be invalid for null/undefined items
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(error => error.includes('harus disediakan'))).toBe(true);
        }), { numRuns: 50 });
    });

    test('Property 11.6: Transformation that empties stock should generate warning', () => {
        fc.assert(fc.property(itemWithSufficientStockArb, (item) => {
            // Use exact stock amount to empty the stock
            const result = validator.validateStockAvailability(item, item.stok);
            
            // Should be valid but with warning about emptying stock
            expect(result.isValid).toBe(true);
            expect(result.warnings.length).toBeGreaterThan(0);
            expect(result.warnings.some(warning => warning.includes('habis'))).toBe(true);
        }), { numRuns: 100 });
    });

    test('Property 11.7: Large quantity transformation should generate warning', () => {
        fc.assert(fc.property(itemWithSufficientStockArb, (item) => {
            // Use more than 50% of stock
            const largeQuantity = Math.floor(item.stok * 0.8);
            
            if (largeQuantity > 0) {
                const result = validator.validateStockAvailability(item, largeQuantity);
                
                // Should be valid but with warning about large quantity
                expect(result.isValid).toBe(true);
                expect(result.warnings.length).toBeGreaterThan(0);
                expect(result.warnings.some(warning => warning.includes('jumlah besar'))).toBe(true);
            }
        }), { numRuns: 100 });
    });

    test('Property 11.8: Low remaining stock should generate warning', () => {
        fc.assert(fc.property(itemWithSufficientStockArb, (item) => {
            // Calculate quantity that leaves very little stock
            const quantityLeavingLittleStock = Math.max(1, item.stok - 3);
            
            if (quantityLeavingLittleStock > 0 && quantityLeavingLittleStock < item.stok) {
                const result = validator.validateStockAvailability(item, quantityLeavingLittleStock);
                
                // Should be valid but with warning about low remaining stock
                expect(result.isValid).toBe(true);
                
                const remainingStock = item.stok - quantityLeavingLittleStock;
                if (remainingStock < 5 && remainingStock > 0) {
                    expect(result.warnings.length).toBeGreaterThan(0);
                    expect(result.warnings.some(warning => warning.includes('tersisa sedikit'))).toBe(true);
                }
            }
        }), { numRuns: 100 });
    });

    test('Property 11.9: Validation result should have consistent structure', () => {
        fc.assert(fc.property(itemWithSufficientStockArb, validQuantityArb, (item, quantity) => {
            const adjustedQuantity = Math.min(quantity, item.stok);
            const result = validator.validateStockAvailability(item, adjustedQuantity);
            
            // Result should always have required properties
            expect(result).toHaveProperty('isValid');
            expect(result).toHaveProperty('errors');
            expect(result).toHaveProperty('warnings');
            
            expect(typeof result.isValid).toBe('boolean');
            expect(Array.isArray(result.errors)).toBe(true);
            expect(Array.isArray(result.warnings)).toBe(true);
            
            // If invalid, should have at least one error
            if (!result.isValid) {
                expect(result.errors.length).toBeGreaterThan(0);
            }
        }), { numRuns: 100 });
    });

    test('Property 11.10: Stock validation should be deterministic', () => {
        fc.assert(fc.property(itemWithSufficientStockArb, validQuantityArb, (item, quantity) => {
            const adjustedQuantity = Math.min(quantity, item.stok);
            
            // Run validation multiple times
            const result1 = validator.validateStockAvailability(item, adjustedQuantity);
            const result2 = validator.validateStockAvailability(item, adjustedQuantity);
            
            // Results should be identical
            expect(result1.isValid).toBe(result2.isValid);
            expect(result1.errors).toEqual(result2.errors);
            expect(result1.warnings).toEqual(result2.warnings);
        }), { numRuns: 100 });
    });

    test('Property 11.11: Edge case - exactly matching stock should be valid', () => {
        fc.assert(fc.property(itemWithSufficientStockArb, (item) => {
            const result = validator.validateStockAvailability(item, item.stok);
            
            // Should be valid when quantity exactly matches stock
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        }), { numRuns: 100 });
    });

    test('Property 11.12: Edge case - one unit more than stock should be invalid', () => {
        fc.assert(fc.property(itemWithSufficientStockArb, (item) => {
            const result = validator.validateStockAvailability(item, item.stok + 1);
            
            // Should be invalid when quantity is one more than stock
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(error => error.includes('tidak mencukupi'))).toBe(true);
        }), { numRuns: 100 });
    });

    test('Property 11.13: Item with undefined or null stock should be treated as zero stock', () => {
        const itemWithUndefinedStockArb = fc.record({
            kode: fc.string({ minLength: 1 }),
            nama: fc.string({ minLength: 1 }),
            satuan: fc.string({ minLength: 1 }),
            kategori: fc.string({ minLength: 1 })
            // No stok property
        });

        fc.assert(fc.property(itemWithUndefinedStockArb, validQuantityArb, (item, quantity) => {
            const result = validator.validateStockAvailability(item, quantity);
            
            // Should be invalid when stock is undefined (treated as 0)
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(error => error.includes('habis'))).toBe(true);
        }), { numRuns: 50 });
    });
});