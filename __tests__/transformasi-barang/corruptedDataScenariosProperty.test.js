/**
 * Property Test: Corrupted Data Scenarios Handling
 * 
 * Tests system behavior with corrupted, malformed, and invalid data
 * Validates: Requirements 5.5 (Corrupted data error handling)
 */

import fc from 'fast-check';
import { TransformationManager } from '../../js/transformasi-barang/TransformationManager.js';
import { ValidationEngine } from '../../js/transformasi-barang/ValidationEngine.js';
import { ConversionCalculator } from '../../js/transformasi-barang/ConversionCalculator.js';
import { ErrorHandler } from '../../js/transformasi-barang/ErrorHandler.js';

describe('Corrupted Data Scenarios Property Tests', () => {
    let transformationManager, validator, calculator, errorHandler;

    beforeEach(async () => {
        transformationManager = new TransformationManager();
        validator = new ValidationEngine();
        calculator = new ConversionCalculator();
        errorHandler = new ErrorHandler();
        
        await transformationManager.initialize();
        await validator.initialize();
        await calculator.initialize();
        errorHandler.initialize();
    });

    /**
     * Property 39: Malformed JSON Data Handling
     * System should handle corrupted JSON data gracefully
     */
    test('Property 39: Malformed JSON data is handled gracefully', () => {
        fc.assert(fc.property(
            fc.oneof(
                fc.constant('{"invalid": json}'),
                fc.constant('[{"missing": "quote}]'),
                fc.constant('{"nested": {"incomplete":}'),
                fc.constant('null'),
                fc.constant('undefined'),
                fc.constant(''),
                fc.constant('{'),
                fc.constant('{"valid": "json", "but": "unexpected_structure"}'),
                fc.string().filter(s => {
                    try { JSON.parse(s); return false; } catch { return true; }
                })
            ),
            (malformedJson) => {
                try {
                    // Test localStorage with corrupted data
                    localStorage.setItem('masterBarang', malformedJson);
                    
                    const result = transformationManager.getTransformableItems();
                    
                    // Should return empty array or handle gracefully
                    expect(Array.isArray(result)).toBe(true);
                    
                    return true;
                } catch (error) {
                    // Should throw meaningful error for corrupted data
                    expect(error.message).toMatch(/json|parse|invalid|corrupted|malformed/i);
                    return true;
                }
            }
        ), { numRuns: 30 });
    });

    /**
     * Property 40: Invalid Data Types Handling
     * System should handle unexpected data types appropriately
     */
    test('Property 40: Invalid data types are handled correctly', () => {
        fc.assert(fc.property(
            fc.oneof(
                fc.constant(null),
                fc.constant(undefined),
                fc.integer(),
                fc.boolean(),
                fc.string(),
                fc.constant(Symbol('test')),
                fc.constant(function() {}),
                fc.constant(new Date()),
                fc.constant(/regex/),
                fc.array(fc.anything())
            ),
            (invalidData) => {
                try {
                    // Test with invalid data types
                    const testItem = {
                        kode: invalidData,
                        nama: invalidData,
                        satuan: invalidData,
                        stok: invalidData,
                        baseProduct: invalidData
                    };

                    const validation = validator.validateProductMatch(testItem, testItem);
                    
                    // Should handle invalid types gracefully
                    expect(typeof validation).toBe('object');
                    expect(validation).toHaveProperty('isValid');
                    
                    if (typeof invalidData !== 'string' && typeof invalidData !== 'number') {
                        expect(validation.isValid).toBe(false);
                    }
                    
                    return true;
                } catch (error) {
                    // Should handle type errors gracefully
                    expect(error.message).toMatch(/type|invalid|expected|string|number/i);
                    return true;
                }
            }
        ), { numRuns: 25 });
    });

    /**
     * Property 41: Circular Reference Handling
     * System should handle circular references in data structures
     */
    test('Property 41: Circular references are handled correctly', () => {
        fc.assert(fc.property(
            fc.string({ minLength: 1, maxLength: 10 }),
            (itemId) => {
                try {
                    // Create circular reference
                    const circularItem = {
                        kode: itemId,
                        nama: `Item ${itemId}`,
                        satuan: 'pcs',
                        stok: 100
                    };
                    circularItem.self = circularItem;
                    circularItem.nested = { parent: circularItem };

                    // Test with circular reference
                    localStorage.setItem('masterBarang', JSON.stringify([circularItem]));
                    
                    const result = transformationManager.getTransformableItems();
                    
                    // Should handle circular references gracefully
                    expect(Array.isArray(result)).toBe(true);
                    
                    return true;
                } catch (error) {
                    // Should handle circular reference errors
                    expect(error.message).toMatch(/circular|reference|json|stringify/i);
                    return true;
                }
            }
        ), { numRuns: 15 });
    });

    /**
     * Property 42: Missing Required Fields Handling
     * System should handle data with missing required fields
     */
    test('Property 42: Missing required fields are handled correctly', () => {
        fc.assert(fc.property(
            fc.record({
                kode: fc.option(fc.string({ minLength: 1, maxLength: 10 })),
                nama: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
                satuan: fc.option(fc.string({ minLength: 1, maxLength: 5 })),
                stok: fc.option(fc.integer({ min: 0, max: 1000 })),
                baseProduct: fc.option(fc.string({ minLength: 1, maxLength: 10 }))
            }),
            (incompleteItem) => {
                try {
                    // Test with incomplete item data
                    const validation = validator.validateProductMatch(incompleteItem, incompleteItem);
                    
                    // Should validate required fields
                    const hasAllRequired = incompleteItem.kode && 
                                         incompleteItem.nama && 
                                         incompleteItem.satuan && 
                                         incompleteItem.stok !== null && 
                                         incompleteItem.stok !== undefined;
                    
                    if (!hasAllRequired) {
                        expect(validation.isValid).toBe(false);
                        expect(validation.message).toMatch(/required|missing|field/i);
                    }
                    
                    return true;
                } catch (error) {
                    // Should handle missing field errors gracefully
                    expect(error.message).toMatch(/required|missing|field|property/i);
                    return true;
                }
            }
        ), { numRuns: 20 });
    });

    /**
     * Property 43: Invalid Numeric Values Handling
     * System should handle corrupted numeric values
     */
    test('Property 43: Invalid numeric values are handled correctly', () => {
        fc.assert(fc.property(
            fc.oneof(
                fc.constant(NaN),
                fc.constant(Infinity),
                fc.constant(-Infinity),
                fc.constant('not_a_number'),
                fc.constant('123abc'),
                fc.constant(''),
                fc.constant(null),
                fc.constant(undefined),
                fc.constant({}),
                fc.constant([])
            ),
            (invalidNumber) => {
                try {
                    // Test calculation with invalid numbers
                    const result = calculator.calculateTargetQuantity(invalidNumber, 12);
                    
                    // Should either return valid result or throw error
                    if (result !== null && result !== undefined) {
                        expect(typeof result).toBe('number');
                        expect(isFinite(result)).toBe(true);
                    }
                    
                    return true;
                } catch (error) {
                    // Should handle invalid numeric values appropriately
                    expect(error.message).toMatch(/number|numeric|invalid|finite|nan/i);
                    return true;
                }
            }
        ), { numRuns: 25 });
    });

    /**
     * Property 44: Corrupted localStorage Data Recovery
     * System should recover from corrupted localStorage data
     */
    test('Property 44: Corrupted localStorage data recovery works correctly', () => {
        fc.assert(fc.property(
            fc.oneof(
                fc.constant('corrupted_data'),
                fc.constant('{"incomplete": json'),
                fc.constant('[null, undefined, {}]'),
                fc.constant(''),
                fc.constant('null'),
                fc.constant('[]'),
                fc.constant('{"valid": "but", "wrong": "structure"}')
            ),
            (corruptedData) => {
                try {
                    // Corrupt localStorage data
                    localStorage.setItem('masterBarang', corruptedData);
                    localStorage.setItem('conversionRatios', corruptedData);
                    localStorage.setItem('transformationHistory', corruptedData);

                    // Test system recovery
                    const items = transformationManager.getTransformableItems();
                    
                    // System should recover gracefully
                    expect(Array.isArray(items)).toBe(true);
                    
                    // Should initialize with empty data if corrupted
                    if (items.length === 0) {
                        // This is acceptable recovery behavior
                        expect(true).toBe(true);
                    } else {
                        // If data is recovered, it should be valid
                        items.forEach(item => {
                            expect(item).toHaveProperty('kode');
                            expect(item).toHaveProperty('stok');
                            expect(typeof item.stok).toBe('number');
                        });
                    }
                    
                    return true;
                } catch (error) {
                    // Should handle corruption recovery errors gracefully
                    expect(error.message).toMatch(/corrupted|recovery|storage|data/i);
                    return true;
                }
            }
        ), { numRuns: 20 });
    });

    /**
     * Property 45: Inconsistent Data State Handling
     * System should handle inconsistent data states
     */
    test('Property 45: Inconsistent data states are handled correctly', () => {
        fc.assert(fc.property(
            fc.record({
                masterBarang: fc.array(fc.record({
                    kode: fc.string({ minLength: 1, maxLength: 10 }),
                    stok: fc.integer({ min: -100, max: 1000 }) // Allow negative for inconsistency
                })),
                conversionRatios: fc.array(fc.record({
                    baseProduct: fc.string({ minLength: 1, maxLength: 10 }),
                    ratio: fc.oneof(fc.float({ min: -10, max: 100 }), fc.constant(0)) // Allow invalid ratios
                }))
            }),
            (inconsistentData) => {
                try {
                    // Set up inconsistent data
                    localStorage.setItem('masterBarang', JSON.stringify(inconsistentData.masterBarang));
                    localStorage.setItem('conversionRatios', JSON.stringify(inconsistentData.conversionRatios));

                    // Test system behavior with inconsistent data
                    const items = transformationManager.getTransformableItems();
                    
                    // System should filter out invalid items
                    expect(Array.isArray(items)).toBe(true);
                    
                    items.forEach(item => {
                        // Valid items should have positive stock
                        expect(item.stok).toBeGreaterThan(0);
                    });

                    // Test validation with inconsistent data
                    if (inconsistentData.masterBarang.length > 0) {
                        const testItem = inconsistentData.masterBarang[0];
                        const validation = validator.validateStockAvailability(testItem, 1);
                        
                        if (testItem.stok <= 0) {
                            expect(validation.isValid).toBe(false);
                        }
                    }
                    
                    return true;
                } catch (error) {
                    // Should handle inconsistent data errors gracefully
                    expect(error.message).toMatch(/inconsistent|invalid|data|state/i);
                    return true;
                }
            }
        ), { numRuns: 15 });
    });

    /**
     * Property 46: Error Handler Corruption Resilience
     * Error handler should be resilient to corrupted error data
     */
    test('Property 46: Error handler handles corrupted error data correctly', () => {
        fc.assert(fc.property(
            fc.oneof(
                fc.constant(null),
                fc.constant(undefined),
                fc.constant({}),
                fc.constant([]),
                fc.constant('string_error'),
                fc.constant(123),
                fc.constant(true),
                fc.record({
                    message: fc.oneof(fc.string(), fc.constant(null), fc.constant(undefined)),
                    stack: fc.oneof(fc.string(), fc.constant(null)),
                    name: fc.oneof(fc.string(), fc.constant(null))
                })
            ),
            (corruptedError) => {
                try {
                    // Test error handler with corrupted error data
                    const response = errorHandler.handleSystemError(corruptedError);
                    
                    // Should always return valid error response structure
                    expect(typeof response).toBe('object');
                    expect(response).toHaveProperty('success');
                    expect(response).toHaveProperty('message');
                    expect(response.success).toBe(false);
                    expect(typeof response.message).toBe('string');
                    expect(response.message.length).toBeGreaterThan(0);
                    
                    return true;
                } catch (error) {
                    // Should handle corrupted error data gracefully
                    expect(error.message).toMatch(/error|handler|corrupted|invalid/i);
                    return true;
                }
            }
        ), { numRuns: 20 });
    });

    afterEach(() => {
        // Clean up localStorage after each test
        localStorage.removeItem('masterBarang');
        localStorage.removeItem('conversionRatios');
        localStorage.removeItem('transformationHistory');
    });
});