/**
 * Property Test 24: Immediate Configuration Application
 * 
 * Property: For any saved ratio configuration, 
 * changes should apply immediately to all future transformations
 * 
 * Validates: Requirements 5.4
 */

import fc from 'fast-check';
import { ConfigurationManager } from '../../js/transformasi-barang/ConfigurationManager.js';

describe('Feature: transformasi-barang, Property 24: Immediate Configuration Application', () => {
    let configManager;
    let originalLocalStorage;
    let mockStorage;

    beforeEach(() => {
        // Mock localStorage
        originalLocalStorage = global.localStorage;
        mockStorage = {};
        
        global.localStorage = {
            getItem: jest.fn((key) => mockStorage[key] || null),
            setItem: jest.fn((key, value) => { mockStorage[key] = value; }),
            removeItem: jest.fn((key) => { delete mockStorage[key]; })
        };

        configManager = new ConfigurationManager();
    });

    afterEach(() => {
        global.localStorage = originalLocalStorage;
    });

    test('should apply configuration changes immediately', () => {
        fc.assert(fc.property(
            // Generate test scenarios
            fc.record({
                baseProduct: fc.string({ minLength: 1, maxLength: 20 }),
                fromUnit: fc.string({ minLength: 1, maxLength: 10 }),
                toUnit: fc.string({ minLength: 1, maxLength: 10 }),
                initialRatio: fc.float({ min: 0.001, max: 1000 }),
                updatedRatio: fc.float({ min: 0.001, max: 1000 })
            }).filter(data => 
                data.fromUnit !== data.toUnit &&
                Math.abs(data.initialRatio - data.updatedRatio) > 0.001
            ),
            
            (testData) => {
                // Clear storage
                mockStorage = {};

                // Set initial ratio
                const setResult = configManager.setConversionRatio(
                    testData.baseProduct,
                    testData.fromUnit,
                    testData.toUnit,
                    testData.initialRatio,
                    { force: true, user: 'test_user' }
                );

                expect(setResult.success).toBe(true);

                // Immediately verify the ratio is available
                const getResult1 = configManager.getConversionRatio(
                    testData.baseProduct,
                    testData.fromUnit,
                    testData.toUnit
                );

                expect(getResult1.success).toBe(true);
                expect(getResult1.ratio).toBeCloseTo(testData.initialRatio, 6);
                expect(getResult1.lastUpdated).toBeDefined();
                expect(getResult1.updatedBy).toBe('test_user');

                // Update the ratio
                const updateResult = configManager.setConversionRatio(
                    testData.baseProduct,
                    testData.fromUnit,
                    testData.toUnit,
                    testData.updatedRatio,
                    { force: true, user: 'test_user_2' }
                );

                expect(updateResult.success).toBe(true);

                // Immediately verify the updated ratio is available
                const getResult2 = configManager.getConversionRatio(
                    testData.baseProduct,
                    testData.fromUnit,
                    testData.toUnit
                );

                expect(getResult2.success).toBe(true);
                expect(getResult2.ratio).toBeCloseTo(testData.updatedRatio, 6);
                expect(getResult2.updatedBy).toBe('test_user_2');

                // Verify the change is reflected in getAllRatioConfigurations
                const allConfigsResult = configManager.getAllRatioConfigurations();
                expect(allConfigsResult.success).toBe(true);

                const productConfig = allConfigsResult.data.find(config => 
                    config.baseProduct === testData.baseProduct
                );
                expect(productConfig).toBeDefined();

                const ratioConfig = productConfig.ratios.conversions.find(conv => 
                    conv.from === testData.fromUnit && conv.to === testData.toUnit
                );
                expect(ratioConfig).toBeDefined();
                expect(ratioConfig.ratio).toBeCloseTo(testData.updatedRatio, 6);
            }
        ), { numRuns: 50 });
    });

    test('should persist changes across multiple operations', () => {
        fc.assert(fc.property(
            fc.array(fc.record({
                baseProduct: fc.string({ minLength: 1, maxLength: 20 }),
                fromUnit: fc.string({ minLength: 1, maxLength: 10 }),
                toUnit: fc.string({ minLength: 1, maxLength: 10 }),
                ratio: fc.float({ min: 0.001, max: 1000 })
            }).filter(data => data.fromUnit !== data.toUnit), { minLength: 1, maxLength: 10 }),
            
            (ratioOperations) => {
                // Clear storage
                mockStorage = {};

                const appliedRatios = new Map();

                // Apply all ratio operations sequentially
                ratioOperations.forEach((operation, index) => {
                    const result = configManager.setConversionRatio(
                        operation.baseProduct,
                        operation.fromUnit,
                        operation.toUnit,
                        operation.ratio,
                        { force: true, user: `user_${index}` }
                    );

                    expect(result.success).toBe(true);

                    // Track the applied ratio
                    const key = `${operation.baseProduct}:${operation.fromUnit}:${operation.toUnit}`;
                    appliedRatios.set(key, {
                        ratio: operation.ratio,
                        user: `user_${index}`
                    });
                });

                // Verify all ratios are immediately available and correct
                appliedRatios.forEach((expectedData, key) => {
                    const [baseProduct, fromUnit, toUnit] = key.split(':');
                    
                    const getResult = configManager.getConversionRatio(baseProduct, fromUnit, toUnit);
                    
                    expect(getResult.success).toBe(true);
                    expect(getResult.ratio).toBeCloseTo(expectedData.ratio, 6);
                    expect(getResult.updatedBy).toBe(expectedData.user);
                });

                // Verify persistence by checking getAllRatioConfigurations
                const allConfigsResult = configManager.getAllRatioConfigurations();
                expect(allConfigsResult.success).toBe(true);

                appliedRatios.forEach((expectedData, key) => {
                    const [baseProduct, fromUnit, toUnit] = key.split(':');
                    
                    const productConfig = allConfigsResult.data.find(config => 
                        config.baseProduct === baseProduct
                    );
                    expect(productConfig).toBeDefined();

                    const ratioConfig = productConfig.ratios.conversions.find(conv => 
                        conv.from === fromUnit && conv.to === toUnit
                    );
                    expect(ratioConfig).toBeDefined();
                    expect(ratioConfig.ratio).toBeCloseTo(expectedData.ratio, 6);
                    expect(ratioConfig.updatedBy).toBe(expectedData.user);
                });
            }
        ), { numRuns: 20 });
    });

    test('should handle removal operations immediately', () => {
        fc.assert(fc.property(
            fc.record({
                baseProduct: fc.string({ minLength: 1, maxLength: 20 }),
                fromUnit: fc.string({ minLength: 1, maxLength: 10 }),
                toUnit: fc.string({ minLength: 1, maxLength: 10 }),
                ratio: fc.float({ min: 0.001, max: 1000 })
            }).filter(data => data.fromUnit !== data.toUnit),
            
            (testData) => {
                // Clear storage
                mockStorage = {};

                // Set a ratio
                const setResult = configManager.setConversionRatio(
                    testData.baseProduct,
                    testData.fromUnit,
                    testData.toUnit,
                    testData.ratio,
                    { force: true }
                );

                expect(setResult.success).toBe(true);

                // Verify it exists
                const getResult1 = configManager.getConversionRatio(
                    testData.baseProduct,
                    testData.fromUnit,
                    testData.toUnit
                );

                expect(getResult1.success).toBe(true);

                // Remove the ratio
                const removeResult = configManager.removeConversionRatio(
                    testData.baseProduct,
                    testData.fromUnit,
                    testData.toUnit,
                    { force: true }
                );

                expect(removeResult.success).toBe(true);

                // Immediately verify it's no longer available
                const getResult2 = configManager.getConversionRatio(
                    testData.baseProduct,
                    testData.fromUnit,
                    testData.toUnit
                );

                expect(getResult2.success).toBe(false);
                expect(getResult2.type).toBe('not_found');

                // Verify removal is reflected in getAllRatioConfigurations
                const allConfigsResult = configManager.getAllRatioConfigurations();
                expect(allConfigsResult.success).toBe(true);

                const productConfig = allConfigsResult.data.find(config => 
                    config.baseProduct === testData.baseProduct
                );

                if (productConfig) {
                    const ratioConfig = productConfig.ratios.conversions.find(conv => 
                        conv.from === testData.fromUnit && conv.to === testData.toUnit
                    );
                    expect(ratioConfig).toBeUndefined();
                }
            }
        ), { numRuns: 30 });
    });

    test('should maintain timestamp accuracy for immediate application', () => {
        const testData = {
            baseProduct: 'TEST_PRODUCT',
            fromUnit: 'box',
            toUnit: 'piece',
            ratio: 12
        };

        // Clear storage
        mockStorage = {};

        const beforeSet = new Date();
        
        // Set ratio
        const setResult = configManager.setConversionRatio(
            testData.baseProduct,
            testData.fromUnit,
            testData.toUnit,
            testData.ratio,
            { force: true, user: 'test_user' }
        );

        const afterSet = new Date();

        expect(setResult.success).toBe(true);
        expect(setResult.timestamp).toBeDefined();

        const setTimestamp = new Date(setResult.timestamp);
        expect(setTimestamp.getTime()).toBeGreaterThanOrEqual(beforeSet.getTime());
        expect(setTimestamp.getTime()).toBeLessThanOrEqual(afterSet.getTime());

        // Immediately get the ratio
        const getResult = configManager.getConversionRatio(
            testData.baseProduct,
            testData.fromUnit,
            testData.toUnit
        );

        expect(getResult.success).toBe(true);
        expect(getResult.lastUpdated).toBeDefined();

        const getTimestamp = new Date(getResult.lastUpdated);
        expect(getTimestamp.getTime()).toBeGreaterThanOrEqual(beforeSet.getTime());
        expect(getTimestamp.getTime()).toBeLessThanOrEqual(afterSet.getTime());

        // Timestamps should match
        expect(getResult.lastUpdated).toBe(setResult.timestamp);
    });

    test('should handle concurrent-like operations correctly', () => {
        const testData = {
            baseProduct: 'CONCURRENT_TEST',
            fromUnit: 'unit1',
            toUnit: 'unit2'
        };

        // Clear storage
        mockStorage = {};

        const ratioSequence = [1, 2, 3, 4, 5];
        const results = [];

        // Perform rapid sequential updates
        ratioSequence.forEach((ratio, index) => {
            const result = configManager.setConversionRatio(
                testData.baseProduct,
                testData.fromUnit,
                testData.toUnit,
                ratio,
                { force: true, user: `user_${index}` }
            );

            expect(result.success).toBe(true);
            results.push(result);

            // Immediately verify the current ratio
            const getResult = configManager.getConversionRatio(
                testData.baseProduct,
                testData.fromUnit,
                testData.toUnit
            );

            expect(getResult.success).toBe(true);
            expect(getResult.ratio).toBe(ratio);
            expect(getResult.updatedBy).toBe(`user_${index}`);
        });

        // Final verification - should have the last ratio
        const finalResult = configManager.getConversionRatio(
            testData.baseProduct,
            testData.fromUnit,
            testData.toUnit
        );

        expect(finalResult.success).toBe(true);
        expect(finalResult.ratio).toBe(ratioSequence[ratioSequence.length - 1]);
        expect(finalResult.updatedBy).toBe(`user_${ratioSequence.length - 1}`);
    });

    test('should handle storage errors gracefully while maintaining immediacy', () => {
        const testData = {
            baseProduct: 'ERROR_TEST',
            fromUnit: 'unit1',
            toUnit: 'unit2',
            ratio: 10
        };

        // Mock storage error on setItem
        const originalSetItem = global.localStorage.setItem;
        global.localStorage.setItem = jest.fn(() => {
            throw new Error('Storage quota exceeded');
        });

        try {
            const result = configManager.setConversionRatio(
                testData.baseProduct,
                testData.fromUnit,
                testData.toUnit,
                testData.ratio,
                { force: true }
            );

            // Should fail gracefully
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();

        } finally {
            // Restore original setItem
            global.localStorage.setItem = originalSetItem;
        }

        // After restoring storage, operations should work immediately again
        const retryResult = configManager.setConversionRatio(
            testData.baseProduct,
            testData.fromUnit,
            testData.toUnit,
            testData.ratio,
            { force: true }
        );

        expect(retryResult.success).toBe(true);

        // Should be immediately available
        const getResult = configManager.getConversionRatio(
            testData.baseProduct,
            testData.fromUnit,
            testData.toUnit
        );

        expect(getResult.success).toBe(true);
        expect(getResult.ratio).toBe(testData.ratio);
    });
});