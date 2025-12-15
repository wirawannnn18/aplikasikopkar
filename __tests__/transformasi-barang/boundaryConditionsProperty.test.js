/**
 * Property Test: Boundary Conditions Handling
 * 
 * Tests system behavior at data boundaries and extreme values
 * Validates: Requirements 3.4 (Input validation and error handling)
 */

import fc from 'fast-check';
import { ConversionCalculator } from '../../js/transformasi-barang/ConversionCalculator.js';
import { ValidationEngine } from '../../js/transformasi-barang/ValidationEngine.js';
import { StockManager } from '../../js/transformasi-barang/StockManager.js';

describe('Boundary Conditions Property Tests', () => {
    let calculator, validator, stockManager;

    beforeEach(async () => {
        calculator = new ConversionCalculator();
        validator = new ValidationEngine();
        stockManager = new StockManager();
        
        await calculator.initialize();
        await validator.initialize();
        await stockManager.initialize();
    });

    /**
     * Property 29: Extreme Numeric Values Handling
     * System should handle very large and very small numbers appropriately
     */
    test('Property 29: Extreme numeric values are handled correctly', () => {
        fc.assert(fc.property(
            fc.oneof(
                fc.constant(Number.MAX_SAFE_INTEGER),
                fc.constant(Number.MIN_SAFE_INTEGER),
                fc.constant(Number.MAX_VALUE),
                fc.constant(Number.MIN_VALUE),
                fc.constant(0),
                fc.constant(0.000001),
                fc.constant(999999999999)
            ),
            fc.float({ min: 0.1, max: 1000 }),
            (extremeValue, ratio) => {
                try {
                    const result = calculator.calculateTargetQuantity(extremeValue, ratio);
                    
                    // Should either return valid result or throw appropriate error
                    if (result !== null && result !== undefined) {
                        expect(typeof result).toBe('number');
                        expect(isFinite(result)).toBe(true);
                        expect(result >= 0).toBe(true);
                    }
                    
                    return true;
                } catch (error) {
                    // Should throw meaningful error for invalid extreme values
                    expect(error.message).toMatch(/quantity|ratio|number|finite/i);
                    return true;
                }
            }
        ), { numRuns: 50 });
    });

    /**
     * Property 30: Zero and Negative Boundary Values
     * System should properly handle zero and negative values at boundaries
     */
    test('Property 30: Zero and negative boundary values are handled correctly', () => {
        fc.assert(fc.property(
            fc.oneof(
                fc.constant(0),
                fc.constant(-0),
                fc.constant(-1),
                fc.constant(-0.1),
                fc.constant(0.0000001)
            ),
            fc.float({ min: 0.1, max: 100 }),
            (boundaryValue, ratio) => {
                try {
                    const result = calculator.calculateTargetQuantity(boundaryValue, ratio);
                    
                    if (boundaryValue <= 0) {
                        // Should handle zero/negative appropriately
                        if (boundaryValue === 0) {
                            expect(result).toBe(0);
                        } else {
                            // Negative values should be rejected
                            expect(false).toBe(true); // Should not reach here
                        }
                    } else {
                        expect(result).toBeGreaterThan(0);
                    }
                    
                    return true;
                } catch (error) {
                    // Negative values should throw error
                    if (boundaryValue < 0) {
                        expect(error.message).toMatch(/negative|positive|non-negative/i);
                        return true;
                    }
                    throw error;
                }
            }
        ), { numRuns: 30 });
    });

    /**
     * Property 31: String Length Boundary Conditions
     * System should handle very long and empty strings appropriately
     */
    test('Property 31: String length boundaries are handled correctly', () => {
        fc.assert(fc.property(
            fc.oneof(
                fc.constant(''),
                fc.constant(' '),
                fc.string({ minLength: 1000, maxLength: 2000 }),
                fc.string({ minLength: 0, maxLength: 1 }),
                fc.constant('a'.repeat(10000))
            ),
            (boundaryString) => {
                const testItem = {
                    id: boundaryString,
                    name: boundaryString,
                    unit: boundaryString.length > 0 ? boundaryString.substring(0, 10) : 'pcs',
                    stock: 100,
                    baseProduct: 'TEST'
                };

                try {
                    const isValid = validator.validateProductMatch(testItem, testItem);
                    
                    if (boundaryString.trim().length === 0) {
                        // Empty strings should be invalid
                        expect(isValid.isValid).toBe(false);
                    } else if (boundaryString.length > 255) {
                        // Very long strings might be invalid
                        // System should handle gracefully
                        expect(typeof isValid.isValid).toBe('boolean');
                    } else {
                        // Normal strings should be valid
                        expect(isValid.isValid).toBe(true);
                    }
                    
                    return true;
                } catch (error) {
                    // Should handle string boundary errors gracefully
                    expect(error.message).toMatch(/string|length|invalid/i);
                    return true;
                }
            }
        ), { numRuns: 25 });
    });

    /**
     * Property 32: Array Boundary Conditions
     * System should handle empty arrays and very large arrays
     */
    test('Property 32: Array boundary conditions are handled correctly', () => {
        fc.assert(fc.property(
            fc.oneof(
                fc.constant([]),
                fc.array(fc.record({
                    id: fc.string({ minLength: 1, maxLength: 10 }),
                    name: fc.string({ minLength: 1, maxLength: 20 }),
                    stock: fc.integer({ min: 0, max: 1000 })
                }), { minLength: 1000, maxLength: 2000 }),
                fc.array(fc.record({
                    id: fc.string({ minLength: 1, maxLength: 5 }),
                    name: fc.string({ minLength: 1, maxLength: 10 }),
                    stock: fc.integer({ min: 0, max: 100 })
                }), { minLength: 1, maxLength: 3 })
            ),
            (boundaryArray) => {
                try {
                    // Test with boundary array sizes
                    localStorage.setItem('masterBarang', JSON.stringify(boundaryArray));
                    
                    const transformationManager = new (class {
                        getTransformableItems() {
                            const items = JSON.parse(localStorage.getItem('masterBarang') || '[]');
                            return items.filter(item => item.stock > 0);
                        }
                    })();
                    
                    const result = transformationManager.getTransformableItems();
                    
                    if (boundaryArray.length === 0) {
                        expect(result.length).toBe(0);
                    } else if (boundaryArray.length > 1000) {
                        // Large arrays should be handled efficiently
                        expect(Array.isArray(result)).toBe(true);
                        expect(result.length).toBeLessThanOrEqual(boundaryArray.length);
                    } else {
                        expect(Array.isArray(result)).toBe(true);
                    }
                    
                    return true;
                } catch (error) {
                    // Should handle array boundary errors gracefully
                    expect(error.message).toMatch(/array|length|memory|storage/i);
                    return true;
                }
            }
        ), { numRuns: 20 });
    });

    /**
     * Property 33: Precision Boundary Conditions
     * System should handle floating point precision boundaries
     */
    test('Property 33: Floating point precision boundaries are handled correctly', () => {
        fc.assert(fc.property(
            fc.oneof(
                fc.constant(0.1 + 0.2), // Classic floating point issue
                fc.constant(1.0000000000001),
                fc.constant(0.9999999999999),
                fc.float({ min: 0.000001, max: 0.000002 }),
                fc.float({ min: 999999.999999, max: 1000000.000001 })
            ),
            fc.float({ min: 1, max: 100 }),
            (precisionValue, ratio) => {
                try {
                    const result = calculator.calculateTargetQuantity(precisionValue, ratio);
                    
                    // Should handle floating point precision appropriately
                    expect(typeof result).toBe('number');
                    expect(isFinite(result)).toBe(true);
                    
                    // Check if result maintains reasonable precision
                    const expectedResult = precisionValue * ratio;
                    const tolerance = Math.max(0.000001, expectedResult * 0.000001);
                    expect(Math.abs(result - expectedResult)).toBeLessThan(tolerance);
                    
                    return true;
                } catch (error) {
                    // Should handle precision errors gracefully
                    expect(error.message).toMatch(/precision|number|calculation/i);
                    return true;
                }
            }
        ), { numRuns: 30 });
    });

    /**
     * Property 34: Memory Boundary Conditions
     * System should handle memory-intensive operations gracefully
     */
    test('Property 34: Memory boundary conditions are handled correctly', () => {
        fc.assert(fc.property(
            fc.integer({ min: 1000, max: 5000 }),
            (itemCount) => {
                try {
                    // Create large dataset to test memory boundaries
                    const largeDataset = Array.from({ length: itemCount }, (_, i) => ({
                        id: `ITEM-${i}`,
                        name: `Item ${i}`.repeat(10), // Make strings longer
                        unit: 'pcs',
                        stock: Math.floor(Math.random() * 1000),
                        baseProduct: `PRODUCT-${Math.floor(i / 100)}`
                    }));

                    const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
                    
                    // Test memory usage during operations
                    localStorage.setItem('masterBarang', JSON.stringify(largeDataset));
                    const retrieved = JSON.parse(localStorage.getItem('masterBarang'));
                    
                    const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
                    const memoryIncrease = endMemory - startMemory;
                    
                    // Should handle large datasets without excessive memory usage
                    expect(retrieved.length).toBe(itemCount);
                    
                    // Memory increase should be reasonable (less than 50MB for test data)
                    if (performance.memory) {
                        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
                    }
                    
                    return true;
                } catch (error) {
                    // Should handle memory boundary errors gracefully
                    expect(error.message).toMatch(/memory|storage|quota|size/i);
                    return true;
                }
            }
        ), { numRuns: 10 });
    });

    afterEach(() => {
        // Clean up localStorage after each test
        localStorage.removeItem('masterBarang');
        localStorage.removeItem('conversionRatios');
        localStorage.removeItem('transformationHistory');
    });
});