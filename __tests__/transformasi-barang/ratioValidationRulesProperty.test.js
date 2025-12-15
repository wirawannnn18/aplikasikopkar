/**
 * Property Test 22: Ratio Validation Rules
 * 
 * Property: For any new transformation ratio setup, 
 * the system should validate mathematical consistency and positive values
 * 
 * Validates: Requirements 5.2
 */

import fc from 'fast-check';
import { ConfigurationManager } from '../../js/transformasi-barang/ConfigurationManager.js';

describe('Feature: transformasi-barang, Property 22: Ratio Validation Rules', () => {
    let configManager;
    let originalLocalStorage;

    beforeEach(() => {
        // Mock localStorage
        originalLocalStorage = global.localStorage;
        global.localStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn()
        };

        configManager = new ConfigurationManager();
    });

    afterEach(() => {
        global.localStorage = originalLocalStorage;
    });

    test('should validate mathematical consistency and positive values', () => {
        fc.assert(fc.property(
            // Generate test inputs
            fc.record({
                baseProduct: fc.oneof(
                    fc.string({ minLength: 1, maxLength: 20 }),
                    fc.constant(''), // Invalid: empty string
                    fc.constant(null), // Invalid: null
                    fc.constant(undefined) // Invalid: undefined
                ),
                fromUnit: fc.oneof(
                    fc.string({ minLength: 1, maxLength: 10 }),
                    fc.constant(''), // Invalid: empty string
                    fc.constant(null), // Invalid: null
                    fc.constant(undefined) // Invalid: undefined
                ),
                toUnit: fc.oneof(
                    fc.string({ minLength: 1, maxLength: 10 }),
                    fc.constant(''), // Invalid: empty string
                    fc.constant(null), // Invalid: null
                    fc.constant(undefined) // Invalid: undefined
                ),
                ratio: fc.oneof(
                    fc.float({ min: 0.000001, max: 10000 }), // Valid: positive numbers
                    fc.constant(0), // Invalid: zero
                    fc.float({ min: -1000, max: -0.000001 }), // Invalid: negative
                    fc.constant(Infinity), // Invalid: infinity
                    fc.constant(-Infinity), // Invalid: negative infinity
                    fc.constant(NaN), // Invalid: NaN
                    fc.constant(null), // Invalid: null
                    fc.constant(undefined), // Invalid: undefined
                    fc.string() // Invalid: string
                )
            }),
            
            (testInput) => {
                // Mock localStorage to return empty data
                global.localStorage.getItem.mockReturnValue(JSON.stringify({}));

                // Determine if input should be valid
                const isValidBaseProduct = typeof testInput.baseProduct === 'string' && testInput.baseProduct.length > 0;
                const isValidFromUnit = typeof testInput.fromUnit === 'string' && testInput.fromUnit.length > 0;
                const isValidToUnit = typeof testInput.toUnit === 'string' && testInput.toUnit.length > 0;
                const unitsAreDifferent = testInput.fromUnit !== testInput.toUnit;
                const isValidRatio = typeof testInput.ratio === 'number' && 
                                   testInput.ratio > 0 && 
                                   isFinite(testInput.ratio);

                const shouldBeValid = isValidBaseProduct && 
                                    isValidFromUnit && 
                                    isValidToUnit && 
                                    unitsAreDifferent && 
                                    isValidRatio;

                // Test the validation
                const result = configManager.setConversionRatio(
                    testInput.baseProduct,
                    testInput.fromUnit,
                    testInput.toUnit,
                    testInput.ratio,
                    { force: true }
                );

                // Property verification
                if (shouldBeValid) {
                    // Valid input should succeed (or require confirmation for other reasons)
                    if (!result.success && result.type === 'validation') {
                        throw new Error(`Valid input was rejected: ${JSON.stringify(testInput)} - ${result.error}`);
                    }
                } else {
                    // Invalid input should fail with validation error
                    expect(result.success).toBe(false);
                    
                    // Should provide meaningful error message
                    expect(result.error).toBeDefined();
                    expect(typeof result.error).toBe('string');
                    expect(result.error.length).toBeGreaterThan(0);
                }
            }
        ), { numRuns: 200 });
    });

    test('should reject same from and to units', () => {
        fc.assert(fc.property(
            fc.string({ minLength: 1, maxLength: 10 }),
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.float({ min: 0.001, max: 1000 }),
            
            (unit, baseProduct, ratio) => {
                global.localStorage.getItem.mockReturnValue(JSON.stringify({}));

                const result = configManager.setConversionRatio(
                    baseProduct,
                    unit, // Same unit for both from and to
                    unit,
                    ratio,
                    { force: true }
                );

                // Should fail validation
                expect(result.success).toBe(false);
                expect(result.error).toContain('tidak boleh sama');
            }
        ), { numRuns: 50 });
    });

    test('should validate positive ratio values specifically', () => {
        const testCases = [
            { ratio: 0, shouldFail: true, description: 'zero' },
            { ratio: -1, shouldFail: true, description: 'negative' },
            { ratio: -0.5, shouldFail: true, description: 'negative decimal' },
            { ratio: Infinity, shouldFail: true, description: 'infinity' },
            { ratio: -Infinity, shouldFail: true, description: 'negative infinity' },
            { ratio: NaN, shouldFail: true, description: 'NaN' },
            { ratio: 0.000001, shouldFail: false, description: 'very small positive' },
            { ratio: 1, shouldFail: false, description: 'one' },
            { ratio: 12.5, shouldFail: false, description: 'positive decimal' },
            { ratio: 1000, shouldFail: false, description: 'large positive' }
        ];

        global.localStorage.getItem.mockReturnValue(JSON.stringify({}));

        testCases.forEach(testCase => {
            const result = configManager.setConversionRatio(
                'TEST_PRODUCT',
                'from_unit',
                'to_unit',
                testCase.ratio,
                { force: true }
            );

            if (testCase.shouldFail) {
                expect(result.success).toBe(false);
                expect(result.error).toBeDefined();
            } else {
                // Should not fail due to ratio validation
                if (!result.success && result.type === 'validation' && result.error.includes('angka positif')) {
                    throw new Error(`Valid ratio ${testCase.description} was rejected: ${result.error}`);
                }
            }
        });
    });

    test('should validate string parameters', () => {
        const invalidStringCases = [
            { field: 'baseProduct', value: '', error: 'Base product' },
            { field: 'baseProduct', value: null, error: 'Base product' },
            { field: 'baseProduct', value: undefined, error: 'Base product' },
            { field: 'fromUnit', value: '', error: 'Unit asal' },
            { field: 'fromUnit', value: null, error: 'Unit asal' },
            { field: 'fromUnit', value: undefined, error: 'Unit asal' },
            { field: 'toUnit', value: '', error: 'Unit tujuan' },
            { field: 'toUnit', value: null, error: 'Unit tujuan' },
            { field: 'toUnit', value: undefined, error: 'Unit tujuan' }
        ];

        global.localStorage.getItem.mockReturnValue(JSON.stringify({}));

        invalidStringCases.forEach(testCase => {
            const params = {
                baseProduct: 'TEST_PRODUCT',
                fromUnit: 'from_unit',
                toUnit: 'to_unit',
                ratio: 12
            };

            params[testCase.field] = testCase.value;

            const result = configManager.setConversionRatio(
                params.baseProduct,
                params.fromUnit,
                params.toUnit,
                params.ratio,
                { force: true }
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain(testCase.error);
        });
    });

    test('should handle mathematical edge cases', () => {
        global.localStorage.getItem.mockReturnValue(JSON.stringify({}));

        const edgeCases = [
            { ratio: Number.MIN_VALUE, shouldPass: true },
            { ratio: Number.MAX_VALUE, shouldPass: true },
            { ratio: 1e-10, shouldPass: true },
            { ratio: 1e10, shouldPass: true },
            { ratio: Math.PI, shouldPass: true },
            { ratio: Math.E, shouldPass: true }
        ];

        edgeCases.forEach(testCase => {
            const result = configManager.setConversionRatio(
                'TEST_PRODUCT',
                'from_unit',
                'to_unit',
                testCase.ratio,
                { force: true }
            );

            if (testCase.shouldPass) {
                // Should not fail due to ratio validation
                if (!result.success && result.type === 'validation' && result.error.includes('angka positif')) {
                    throw new Error(`Valid edge case ratio ${testCase.ratio} was rejected: ${result.error}`);
                }
            }
        });
    });
});