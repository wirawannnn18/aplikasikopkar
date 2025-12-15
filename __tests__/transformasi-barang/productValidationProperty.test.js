/**
 * Property-based tests untuk Product Validation - Transformasi Barang
 * 
 * Property 1: Product Validation Consistency
 * Validates: Requirements 1.1
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

describe('Feature: transformasi-barang, Property 1: Product Validation Consistency', () => {
    
    let validator;
    
    beforeEach(() => {
        validator = new ValidationEngine();
        validator.initialize();
    });

    // Generator untuk item dengan baseProduct yang sama
    const sameBaseProductItemsArb = fc.tuple(
        fc.string({ minLength: 3 }), // baseProduct
        fc.string({ minLength: 1 }), // unit1
        fc.string({ minLength: 1 })  // unit2
    ).chain(([baseProduct, unit1, unit2]) => 
        fc.tuple(
            fc.record({
                kode: fc.string({ minLength: 1 }),
                nama: fc.string({ minLength: 1 }),
                baseProduct: fc.constant(baseProduct),
                satuan: fc.constant(unit1),
                stok: fc.nat({ max: 1000 }),
                kategori: fc.string({ minLength: 1 })
            }),
            fc.record({
                kode: fc.string({ minLength: 1 }),
                nama: fc.string({ minLength: 1 }),
                baseProduct: fc.constant(baseProduct),
                satuan: fc.constant(unit2),
                stok: fc.nat({ max: 1000 }),
                kategori: fc.string({ minLength: 1 })
            })
        ).filter(([item1, item2]) => item1.satuan !== item2.satuan) // Ensure different units
    );

    // Generator untuk item dengan baseProduct yang berbeda
    const differentBaseProductItemsArb = fc.tuple(
        fc.record({
            kode: fc.string({ minLength: 1 }),
            nama: fc.string({ minLength: 1 }),
            baseProduct: fc.string({ minLength: 3 }),
            satuan: fc.string({ minLength: 1 }),
            stok: fc.nat({ max: 1000 }),
            kategori: fc.string({ minLength: 1 })
        }),
        fc.record({
            kode: fc.string({ minLength: 1 }),
            nama: fc.string({ minLength: 1 }),
            baseProduct: fc.string({ minLength: 3 }),
            satuan: fc.string({ minLength: 1 }),
            stok: fc.nat({ max: 1000 }),
            kategori: fc.string({ minLength: 1 })
        })
    ).filter(([item1, item2]) => item1.baseProduct !== item2.baseProduct);

    // Generator untuk item dengan unit yang sama
    const sameUnitItemsArb = fc.tuple(
        fc.string({ minLength: 3 }), // baseProduct
        fc.string({ minLength: 1 })  // unit
    ).chain(([baseProduct, unit]) => 
        fc.tuple(
            fc.record({
                kode: fc.string({ minLength: 1 }),
                nama: fc.string({ minLength: 1 }),
                baseProduct: fc.constant(baseProduct),
                satuan: fc.constant(unit),
                stok: fc.nat({ max: 1000 }),
                kategori: fc.string({ minLength: 1 })
            }),
            fc.record({
                kode: fc.string({ minLength: 1 }),
                nama: fc.string({ minLength: 1 }),
                baseProduct: fc.constant(baseProduct),
                satuan: fc.constant(unit),
                stok: fc.nat({ max: 1000 }),
                kategori: fc.string({ minLength: 1 })
            })
        )
    );

    test('Property 1.1: Items with same baseProduct and different units should be valid for transformation', () => {
        fc.assert(fc.property(sameBaseProductItemsArb, ([sourceItem, targetItem]) => {
            const result = validator.validateProductMatch(sourceItem, targetItem);
            
            // Should be valid since they have same baseProduct but different units
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        }), { numRuns: 100 });
    });

    test('Property 1.2: Items with different baseProduct should be invalid for transformation', () => {
        fc.assert(fc.property(differentBaseProductItemsArb, ([sourceItem, targetItem]) => {
            const result = validator.validateProductMatch(sourceItem, targetItem);
            
            // Should be invalid since they have different baseProduct
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(error => error.includes('tidak dapat ditransformasi'))).toBe(true);
        }), { numRuns: 100 });
    });

    test('Property 1.3: Items with same unit should be invalid for transformation', () => {
        fc.assert(fc.property(sameUnitItemsArb, ([sourceItem, targetItem]) => {
            const result = validator.validateProductMatch(sourceItem, targetItem);
            
            // Should be invalid since they have same unit
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(error => error.includes('unit yang sama'))).toBe(true);
        }), { numRuns: 100 });
    });

    test('Property 1.4: Null or undefined items should be invalid', () => {
        const invalidItemsArb = fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.record({}) // Empty object
        );

        fc.assert(fc.property(invalidItemsArb, invalidItemsArb, (sourceItem, targetItem) => {
            const result = validator.validateProductMatch(sourceItem, targetItem);
            
            // Should be invalid for null/undefined items
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        }), { numRuns: 50 });
    });

    test('Property 1.5: Items without baseProduct should be invalid', () => {
        const itemWithoutBaseProductArb = fc.record({
            kode: fc.string({ minLength: 1 }),
            nama: fc.string({ minLength: 1 }),
            satuan: fc.string({ minLength: 1 }),
            stok: fc.nat({ max: 1000 })
            // No baseProduct field
        });

        fc.assert(fc.property(itemWithoutBaseProductArb, itemWithoutBaseProductArb, (sourceItem, targetItem) => {
            const result = validator.validateProductMatch(sourceItem, targetItem);
            
            // Should be invalid without baseProduct
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(error => error.includes('base product'))).toBe(true);
        }), { numRuns: 50 });
    });

    test('Property 1.6: Validation should be symmetric', () => {
        fc.assert(fc.property(sameBaseProductItemsArb, ([item1, item2]) => {
            const result1 = validator.validateProductMatch(item1, item2);
            const result2 = validator.validateProductMatch(item2, item1);
            
            // Validation should be symmetric - same result regardless of order
            expect(result1.isValid).toBe(result2.isValid);
            
            if (!result1.isValid) {
                expect(result1.errors.length).toBeGreaterThan(0);
                expect(result2.errors.length).toBeGreaterThan(0);
            }
        }), { numRuns: 100 });
    });

    test('Property 1.7: Warning should be generated for very different product names', () => {
        const differentNameItemsArb = fc.tuple(
            fc.string({ minLength: 3 }), // baseProduct
            fc.string({ minLength: 1 }), // unit1
            fc.string({ minLength: 1 })  // unit2
        ).chain(([baseProduct, unit1, unit2]) => 
            fc.tuple(
                fc.record({
                    kode: fc.string({ minLength: 1 }),
                    nama: fc.constant('Completely Different Product Name A'),
                    baseProduct: fc.constant(baseProduct),
                    satuan: fc.constant(unit1),
                    stok: fc.nat({ max: 1000 }),
                    kategori: fc.string({ minLength: 1 })
                }),
                fc.record({
                    kode: fc.string({ minLength: 1 }),
                    nama: fc.constant('Totally Unrelated Product Name B'),
                    baseProduct: fc.constant(baseProduct),
                    satuan: fc.constant(unit2),
                    stok: fc.nat({ max: 1000 }),
                    kategori: fc.string({ minLength: 1 })
                })
            ).filter(([item1, item2]) => item1.satuan !== item2.satuan)
        );

        fc.assert(fc.property(differentNameItemsArb, ([sourceItem, targetItem]) => {
            const result = validator.validateProductMatch(sourceItem, targetItem);
            
            // Should be valid but with warnings for very different names
            expect(result.isValid).toBe(true);
            expect(result.warnings.length).toBeGreaterThan(0);
            expect(result.warnings.some(warning => warning.includes('nama produk'))).toBe(true);
        }), { numRuns: 50 });
    });

    test('Property 1.8: Similar product names should not generate warnings', () => {
        const similarNameItemsArb = fc.tuple(
            fc.string({ minLength: 3 }), // baseProduct
            fc.string({ minLength: 1 }), // unit1
            fc.string({ minLength: 1 }), // unit2
            fc.string({ minLength: 3 })  // common word
        ).chain(([baseProduct, unit1, unit2, commonWord]) => 
            fc.tuple(
                fc.record({
                    kode: fc.string({ minLength: 1 }),
                    nama: fc.constant(`${commonWord} Product DUS`),
                    baseProduct: fc.constant(baseProduct),
                    satuan: fc.constant(unit1),
                    stok: fc.nat({ max: 1000 }),
                    kategori: fc.string({ minLength: 1 })
                }),
                fc.record({
                    kode: fc.string({ minLength: 1 }),
                    nama: fc.constant(`${commonWord} Product PCS`),
                    baseProduct: fc.constant(baseProduct),
                    satuan: fc.constant(unit2),
                    stok: fc.nat({ max: 1000 }),
                    kategori: fc.string({ minLength: 1 })
                })
            ).filter(([item1, item2]) => item1.satuan !== item2.satuan)
        );

        fc.assert(fc.property(similarNameItemsArb, ([sourceItem, targetItem]) => {
            const result = validator.validateProductMatch(sourceItem, targetItem);
            
            // Should be valid without name-related warnings
            expect(result.isValid).toBe(true);
            
            // Should not have warnings about different names
            const hasNameWarning = result.warnings.some(warning => 
                warning.includes('nama produk') && warning.includes('berbeda')
            );
            expect(hasNameWarning).toBe(false);
        }), { numRuns: 50 });
    });

    test('Property 1.9: Validation result should have consistent structure', () => {
        fc.assert(fc.property(sameBaseProductItemsArb, ([sourceItem, targetItem]) => {
            const result = validator.validateProductMatch(sourceItem, targetItem);
            
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
});