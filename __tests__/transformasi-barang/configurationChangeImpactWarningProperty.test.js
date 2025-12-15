/**
 * Property Test 23: Configuration Change Impact Warning
 * 
 * Property: For any ratio update, 
 * the system should warn about potential impacts on existing calculations
 * 
 * Validates: Requirements 5.3
 */

import fc from 'fast-check';
import { ConfigurationManager } from '../../js/transformasi-barang/ConfigurationManager.js';

describe('Feature: transformasi-barang, Property 23: Configuration Change Impact Warning', () => {
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

    test('should warn about impacts when updating existing ratios', () => {
        fc.assert(fc.property(
            // Generate test scenarios
            fc.record({
                baseProduct: fc.string({ minLength: 1, maxLength: 20 }),
                fromUnit: fc.string({ minLength: 1, maxLength: 10 }),
                toUnit: fc.string({ minLength: 1, maxLength: 10 }),
                originalRatio: fc.float({ min: 0.001, max: 1000 }),
                newRatio: fc.float({ min: 0.001, max: 1000 })
            }).filter(data => 
                data.fromUnit !== data.toUnit && 
                Math.abs(data.originalRatio - data.newRatio) > 0.001
            ),
            
            (testData) => {
                // Setup existing ratio configuration
                const existingRatios = {
                    [testData.baseProduct]: {
                        baseProduct: testData.baseProduct,
                        conversions: [
                            {
                                from: testData.fromUnit,
                                to: testData.toUnit,
                                ratio: testData.originalRatio,
                                lastUpdated: new Date().toISOString(),
                                updatedBy: 'test'
                            }
                        ]
                    }
                };

                mockStorage['transformasi_conversion_ratios'] = JSON.stringify(existingRatios);

                // Attempt to update the ratio without force flag
                const result = configManager.setConversionRatio(
                    testData.baseProduct,
                    testData.fromUnit,
                    testData.toUnit,
                    testData.newRatio,
                    { force: false }
                );

                // Property verification: Should require confirmation for existing ratio updates
                expect(result.success).toBe(false);
                expect(result.requiresConfirmation).toBe(true);
                expect(result.warning).toBeDefined();
                expect(typeof result.warning).toBe('string');
                expect(result.warning.length).toBeGreaterThan(0);

                // Should provide impact analysis
                expect(result.impacts).toBeDefined();
                expect(Array.isArray(result.impacts)).toBe(true);
                expect(result.impacts.length).toBeGreaterThan(0);

                // Should have ratio change impact
                const hasRatioChangeImpact = result.impacts.some(impact => 
                    impact.type === 'ratio_change' &&
                    impact.description.includes(testData.originalRatio.toString()) &&
                    impact.description.includes(testData.newRatio.toString())
                );
                expect(hasRatioChangeImpact).toBe(true);

                // Test with force flag - should succeed
                const forceResult = configManager.setConversionRatio(
                    testData.baseProduct,
                    testData.fromUnit,
                    testData.toUnit,
                    testData.newRatio,
                    { force: true }
                );

                expect(forceResult.success).toBe(true);
            }
        ), { numRuns: 50 });
    });

    test('should warn about consistency issues with reverse ratios', () => {
        fc.assert(fc.property(
            fc.record({
                baseProduct: fc.string({ minLength: 1, maxLength: 20 }),
                unit1: fc.string({ minLength: 1, maxLength: 10 }),
                unit2: fc.string({ minLength: 1, maxLength: 10 }),
                ratio1to2: fc.float({ min: 0.1, max: 100 }),
                inconsistentReverseRatio: fc.float({ min: 0.001, max: 1000 })
            }).filter(data => 
                data.unit1 !== data.unit2 &&
                Math.abs(data.inconsistentReverseRatio - (1 / data.ratio1to2)) > 0.01
            ),
            
            (testData) => {
                // Setup existing ratios with inconsistent reverse ratio
                const existingRatios = {
                    [testData.baseProduct]: {
                        baseProduct: testData.baseProduct,
                        conversions: [
                            {
                                from: testData.unit2,
                                to: testData.unit1,
                                ratio: testData.inconsistentReverseRatio,
                                lastUpdated: new Date().toISOString(),
                                updatedBy: 'test'
                            }
                        ]
                    }
                };

                mockStorage['transformasi_conversion_ratios'] = JSON.stringify(existingRatios);

                // Attempt to set ratio that would be inconsistent with existing reverse ratio
                const result = configManager.setConversionRatio(
                    testData.baseProduct,
                    testData.unit1,
                    testData.unit2,
                    testData.ratio1to2,
                    { force: false }
                );

                // Should warn about consistency issues
                expect(result.success).toBe(false);
                expect(result.requiresConfirmation).toBe(true);
                expect(result.impacts).toBeDefined();

                // Should have consistency warning
                const hasConsistencyWarning = result.impacts.some(impact => 
                    impact.type === 'consistency_warning' &&
                    impact.severity === 'high'
                );
                expect(hasConsistencyWarning).toBe(true);
            }
        ), { numRuns: 30 });
    });

    test('should not require confirmation for new ratios', () => {
        fc.assert(fc.property(
            fc.record({
                baseProduct: fc.string({ minLength: 1, maxLength: 20 }),
                fromUnit: fc.string({ minLength: 1, maxLength: 10 }),
                toUnit: fc.string({ minLength: 1, maxLength: 10 }),
                ratio: fc.float({ min: 0.001, max: 1000 })
            }).filter(data => data.fromUnit !== data.toUnit),
            
            (testData) => {
                // Setup empty ratio configuration
                mockStorage['transformasi_conversion_ratios'] = JSON.stringify({});

                // Set new ratio
                const result = configManager.setConversionRatio(
                    testData.baseProduct,
                    testData.fromUnit,
                    testData.toUnit,
                    testData.ratio,
                    { force: false }
                );

                // New ratios should not require confirmation (unless there are other issues)
                if (!result.success && result.requiresConfirmation) {
                    // If confirmation is required, it should not be due to ratio change
                    const hasRatioChangeImpact = result.impacts.some(impact => 
                        impact.type === 'ratio_change'
                    );
                    expect(hasRatioChangeImpact).toBe(false);
                }
            }
        ), { numRuns: 50 });
    });

    test('should provide detailed impact descriptions', () => {
        const testData = {
            baseProduct: 'TEST_PRODUCT',
            fromUnit: 'box',
            toUnit: 'piece',
            originalRatio: 12,
            newRatio: 24
        };

        // Setup existing ratio
        const existingRatios = {
            [testData.baseProduct]: {
                baseProduct: testData.baseProduct,
                conversions: [
                    {
                        from: testData.fromUnit,
                        to: testData.toUnit,
                        ratio: testData.originalRatio,
                        lastUpdated: new Date().toISOString(),
                        updatedBy: 'test'
                    }
                ]
            }
        };

        mockStorage['transformasi_conversion_ratios'] = JSON.stringify(existingRatios);

        const result = configManager.setConversionRatio(
            testData.baseProduct,
            testData.fromUnit,
            testData.toUnit,
            testData.newRatio,
            { force: false }
        );

        expect(result.requiresConfirmation).toBe(true);
        expect(result.impacts).toBeDefined();

        // Check impact description quality
        result.impacts.forEach(impact => {
            expect(impact.type).toBeDefined();
            expect(impact.description).toBeDefined();
            expect(typeof impact.description).toBe('string');
            expect(impact.description.length).toBeGreaterThan(10);
            expect(impact.severity).toMatch(/^(low|medium|high)$/);
        });
    });

    test('should handle removal impact warnings', () => {
        fc.assert(fc.property(
            fc.record({
                baseProduct: fc.string({ minLength: 1, maxLength: 20 }),
                fromUnit: fc.string({ minLength: 1, maxLength: 10 }),
                toUnit: fc.string({ minLength: 1, maxLength: 10 }),
                ratio: fc.float({ min: 0.001, max: 1000 })
            }).filter(data => data.fromUnit !== data.toUnit),
            
            (testData) => {
                // Setup existing ratio
                const existingRatios = {
                    [testData.baseProduct]: {
                        baseProduct: testData.baseProduct,
                        conversions: [
                            {
                                from: testData.fromUnit,
                                to: testData.toUnit,
                                ratio: testData.ratio,
                                lastUpdated: new Date().toISOString(),
                                updatedBy: 'test'
                            }
                        ]
                    }
                };

                mockStorage['transformasi_conversion_ratios'] = JSON.stringify(existingRatios);

                // Attempt to remove ratio without force
                const result = configManager.removeConversionRatio(
                    testData.baseProduct,
                    testData.fromUnit,
                    testData.toUnit,
                    { force: false }
                );

                // Should warn about removal impacts
                expect(result.success).toBe(false);
                expect(result.requiresConfirmation).toBe(true);
                expect(result.warning).toBeDefined();
                expect(result.impacts).toBeDefined();
                expect(result.impacts.length).toBeGreaterThan(0);

                // Should have transformation disabled impact
                const hasTransformationDisabledImpact = result.impacts.some(impact => 
                    impact.type === 'transformation_disabled'
                );
                expect(hasTransformationDisabledImpact).toBe(true);
            }
        ), { numRuns: 30 });
    });

    test('should allow bypassing warnings with force flag', () => {
        const testData = {
            baseProduct: 'TEST_PRODUCT',
            fromUnit: 'box',
            toUnit: 'piece',
            originalRatio: 12,
            newRatio: 24
        };

        // Setup existing ratio
        const existingRatios = {
            [testData.baseProduct]: {
                baseProduct: testData.baseProduct,
                conversions: [
                    {
                        from: testData.fromUnit,
                        to: testData.toUnit,
                        ratio: testData.originalRatio,
                        lastUpdated: new Date().toISOString(),
                        updatedBy: 'test'
                    }
                ]
            }
        };

        mockStorage['transformasi_conversion_ratios'] = JSON.stringify(existingRatios);

        // Without force - should require confirmation
        const resultWithoutForce = configManager.setConversionRatio(
            testData.baseProduct,
            testData.fromUnit,
            testData.toUnit,
            testData.newRatio,
            { force: false }
        );

        expect(resultWithoutForce.requiresConfirmation).toBe(true);

        // With force - should succeed
        const resultWithForce = configManager.setConversionRatio(
            testData.baseProduct,
            testData.fromUnit,
            testData.toUnit,
            testData.newRatio,
            { force: true }
        );

        expect(resultWithForce.success).toBe(true);
        expect(resultWithForce.requiresConfirmation).toBeFalsy();
    });
});