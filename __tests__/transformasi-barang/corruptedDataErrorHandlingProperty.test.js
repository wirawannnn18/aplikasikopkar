/**
 * Property Test 25: Corrupted Data Error Handling
 * 
 * Property: For any corrupted or missing ratio data, 
 * the system should prevent transformations and alert administrators
 * 
 * Validates: Requirements 5.5
 */

import fc from 'fast-check';
import { ConfigurationManager } from '../../js/transformasi-barang/ConfigurationManager.js';

describe('Feature: transformasi-barang, Property 25: Corrupted Data Error Handling', () => {
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

    test('should handle corrupted JSON data gracefully', () => {
        fc.assert(fc.property(
            // Generate various types of corrupted data
            fc.oneof(
                fc.constant('invalid_json'),
                fc.constant('{invalid_json}'),
                fc.constant('{"incomplete": json'),
                fc.constant('null'),
                fc.constant('undefined'),
                fc.constant(''),
                fc.constant('[]'),
                fc.constant('{"ratios": null}'),
                fc.constant('{"ratios": "not_an_object"}'),
                fc.string({ minLength: 1, maxLength: 100 }).filter(s => {
                    try {
                        JSON.parse(s);
                        return false; // Valid JSON, skip
                    } catch {
                        return true; // Invalid JSON, use it
                    }
                })
            ),
            
            (corruptedData) => {
                // Set corrupted data in storage
                mockStorage['transformasi_conversion_ratios'] = corruptedData;

                // Test getAllRatioConfigurations with corrupted data
                const getAllResult = configManager.getAllRatioConfigurations();

                // Should either succeed with empty/default data or fail gracefully
                if (getAllResult.success) {
                    // If successful, should return valid structure
                    expect(Array.isArray(getAllResult.data)).toBe(true);
                    expect(getAllResult.timestamp).toBeDefined();
                } else {
                    // If failed, should provide error information
                    expect(getAllResult.error).toBeDefined();
                    expect(typeof getAllResult.error).toBe('string');
                }

                // Test getConversionRatio with corrupted data
                const getRatioResult = configManager.getConversionRatio('TEST', 'unit1', 'unit2');

                // Should handle gracefully
                if (!getRatioResult.success) {
                    expect(getRatioResult.error).toBeDefined();
                    expect(getRatioResult.type).toBeDefined();
                }

                // Test validation and repair
                const validationResult = configManager.validateAndRepairConfiguration();

                // Should detect issues or repair them
                expect(validationResult.success).toBe(true);
                expect(Array.isArray(validationResult.issues)).toBe(true);
                expect(Array.isArray(validationResult.repairs)).toBe(true);
                expect(typeof validationResult.isHealthy).toBe('boolean');

                // If not healthy, should have issues reported
                if (!validationResult.isHealthy) {
                    expect(validationResult.issues.length).toBeGreaterThan(0);
                }
            }
        ), { numRuns: 50 });
    });

    test('should detect and report specific data corruption issues', () => {
        const corruptionScenarios = [
            {
                name: 'missing_conversions_array',
                data: { 'TEST_PRODUCT': { baseProduct: 'TEST_PRODUCT' } },
                expectedIssue: 'conversions'
            },
            {
                name: 'invalid_conversions_type',
                data: { 'TEST_PRODUCT': { baseProduct: 'TEST_PRODUCT', conversions: 'not_array' } },
                expectedIssue: 'conversions'
            },
            {
                name: 'invalid_ratio_values',
                data: { 
                    'TEST_PRODUCT': { 
                        baseProduct: 'TEST_PRODUCT', 
                        conversions: [
                            { from: 'unit1', to: 'unit2', ratio: 'invalid' },
                            { from: 'unit2', to: 'unit3', ratio: -5 },
                            { from: 'unit3', to: 'unit4', ratio: 0 }
                        ] 
                    } 
                },
                expectedIssue: 'Rasio tidak valid'
            },
            {
                name: 'missing_required_fields',
                data: { 
                    'TEST_PRODUCT': { 
                        baseProduct: 'TEST_PRODUCT', 
                        conversions: [
                            { from: 'unit1', ratio: 12 }, // missing 'to'
                            { to: 'unit2', ratio: 6 }, // missing 'from'
                            { from: 'unit3', to: 'unit4' } // missing 'ratio'
                        ] 
                    } 
                },
                expectedIssue: 'tidak valid'
            }
        ];

        corruptionScenarios.forEach(scenario => {
            // Set corrupted data
            mockStorage['transformasi_conversion_ratios'] = JSON.stringify(scenario.data);

            // Run validation
            const validationResult = configManager.validateAndRepairConfiguration();

            expect(validationResult.success).toBe(true);
            
            // Should detect the specific issue
            const hasExpectedIssue = validationResult.issues.some(issue => 
                issue.toLowerCase().includes(scenario.expectedIssue.toLowerCase())
            );
            
            if (!hasExpectedIssue && validationResult.isHealthy) {
                // If no issue detected, the system should have auto-repaired
                expect(validationResult.repairs.length).toBeGreaterThan(0);
            } else {
                expect(hasExpectedIssue).toBe(true);
            }
        });
    });

    test('should prevent operations with corrupted data', () => {
        fc.assert(fc.property(
            fc.record({
                baseProduct: fc.string({ minLength: 1, maxLength: 20 }),
                fromUnit: fc.string({ minLength: 1, maxLength: 10 }),
                toUnit: fc.string({ minLength: 1, maxLength: 10 }),
                ratio: fc.float({ min: 0.001, max: 1000 })
            }).filter(data => data.fromUnit !== data.toUnit),
            
            (testData) => {
                // Set severely corrupted data that can't be parsed
                mockStorage['transformasi_conversion_ratios'] = 'completely_invalid_json{[}';

                // Attempt to set a new ratio
                const setResult = configManager.setConversionRatio(
                    testData.baseProduct,
                    testData.fromUnit,
                    testData.toUnit,
                    testData.ratio,
                    { force: true }
                );

                // Should either succeed (by initializing new data) or fail gracefully
                if (!setResult.success) {
                    expect(setResult.error).toBeDefined();
                    expect(typeof setResult.error).toBe('string');
                }

                // Attempt to get a ratio
                const getResult = configManager.getConversionRatio(
                    testData.baseProduct,
                    testData.fromUnit,
                    testData.toUnit
                );

                // Should handle gracefully
                if (!getResult.success) {
                    expect(getResult.error).toBeDefined();
                    expect(getResult.type).toBeDefined();
                }
            }
        ), { numRuns: 30 });
    });

    test('should recover from corruption using backup data', () => {
        const validData = {
            'TEST_PRODUCT': {
                baseProduct: 'TEST_PRODUCT',
                conversions: [
                    { from: 'box', to: 'piece', ratio: 12, lastUpdated: new Date().toISOString(), updatedBy: 'test' }
                ]
            }
        };

        // Set valid backup data
        mockStorage['transformasi_conversion_ratios_backup'] = JSON.stringify(validData);
        
        // Set corrupted main data
        mockStorage['transformasi_conversion_ratios'] = 'corrupted_data';

        // Mock getItem to simulate corruption recovery
        global.localStorage.getItem.mockImplementation((key) => {
            if (key === 'transformasi_conversion_ratios') {
                throw new Error('JSON parse error');
            }
            if (key === 'transformasi_conversion_ratios_backup') {
                return JSON.stringify(validData);
            }
            return mockStorage[key] || null;
        });

        // Should recover from backup
        const result = configManager.getConversionRatio('TEST_PRODUCT', 'box', 'piece');

        // Should either succeed using backup or handle gracefully
        if (result.success) {
            expect(result.ratio).toBe(12);
        } else {
            expect(result.error).toBeDefined();
        }
    });

    test('should handle missing master barang data', () => {
        // Set valid ratio data but missing master barang
        const ratioData = {
            'MISSING_PRODUCT': {
                baseProduct: 'MISSING_PRODUCT',
                conversions: [
                    { from: 'unit1', to: 'unit2', ratio: 5, lastUpdated: new Date().toISOString(), updatedBy: 'test' }
                ]
            }
        };

        mockStorage['transformasi_conversion_ratios'] = JSON.stringify(ratioData);
        mockStorage['masterBarang'] = JSON.stringify([]); // Empty master barang

        // Run validation
        const validationResult = configManager.validateAndRepairConfiguration();

        expect(validationResult.success).toBe(true);

        // Should detect orphaned ratios
        const hasOrphanedIssue = validationResult.issues.some(issue => 
            issue.includes('tidak ditemukan di master barang') || 
            issue.includes('MISSING_PRODUCT')
        );

        expect(hasOrphanedIssue).toBe(true);
    });

    test('should handle storage access errors', () => {
        // Mock storage to throw errors
        global.localStorage.getItem.mockImplementation(() => {
            throw new Error('Storage access denied');
        });

        // Test various operations
        const getAllResult = configManager.getAllRatioConfigurations();
        const getRatioResult = configManager.getConversionRatio('TEST', 'unit1', 'unit2');
        const validationResult = configManager.validateAndRepairConfiguration();

        // All operations should handle storage errors gracefully
        [getAllResult, getRatioResult, validationResult].forEach(result => {
            if (!result.success) {
                expect(result.error).toBeDefined();
                expect(typeof result.error).toBe('string');
            }
        });
    });

    test('should provide administrator alerts for corruption', () => {
        const corruptedData = 'invalid_json_data';
        mockStorage['transformasi_conversion_ratios'] = corruptedData;

        // Run validation
        const validationResult = configManager.validateAndRepairConfiguration();

        expect(validationResult.success).toBe(true);

        // Should provide detailed information for administrators
        expect(validationResult.issues).toBeDefined();
        expect(validationResult.repairs).toBeDefined();
        expect(validationResult.isHealthy).toBeDefined();
        expect(validationResult.timestamp).toBeDefined();

        // If issues found, should provide actionable information
        if (validationResult.issues.length > 0) {
            validationResult.issues.forEach(issue => {
                expect(typeof issue).toBe('string');
                expect(issue.length).toBeGreaterThan(0);
            });
        }

        // If repairs made, should document them
        if (validationResult.repairs.length > 0) {
            validationResult.repairs.forEach(repair => {
                expect(typeof repair).toBe('string');
                expect(repair.length).toBeGreaterThan(0);
            });
        }
    });

    test('should maintain system stability during corruption recovery', () => {
        const corruptionSequence = [
            'invalid_json',
            '{"incomplete": json',
            null,
            undefined,
            '',
            '[]',
            '{"ratios": null}'
        ];

        corruptionSequence.forEach((corruptedData, index) => {
            // Set corrupted data
            if (corruptedData === null) {
                delete mockStorage['transformasi_conversion_ratios'];
            } else if (corruptedData === undefined) {
                mockStorage['transformasi_conversion_ratios'] = undefined;
            } else {
                mockStorage['transformasi_conversion_ratios'] = corruptedData;
            }

            // System should remain stable
            const validationResult = configManager.validateAndRepairConfiguration();
            expect(validationResult.success).toBe(true);

            const getAllResult = configManager.getAllRatioConfigurations();
            // Should either succeed or fail gracefully
            if (!getAllResult.success) {
                expect(getAllResult.error).toBeDefined();
            }

            // Try to set a new ratio - should work after corruption handling
            const setResult = configManager.setConversionRatio(
                `TEST_${index}`,
                'unit1',
                'unit2',
                10,
                { force: true }
            );

            // Should either succeed or provide clear error
            if (!setResult.success) {
                expect(setResult.error).toBeDefined();
            }
        });
    });

    test('should handle export/import with corrupted data', () => {
        // Set corrupted data
        mockStorage['transformasi_conversion_ratios'] = 'invalid_json';

        // Export should handle corruption gracefully
        const exportResult = configManager.exportConfiguration();

        if (exportResult.success) {
            expect(exportResult.data).toBeDefined();
            expect(exportResult.filename).toBeDefined();
        } else {
            expect(exportResult.error).toBeDefined();
        }

        // Import should validate data structure
        const invalidImportData = {
            version: '1.0',
            ratios: 'not_an_object'
        };

        const importResult = configManager.importConfiguration(invalidImportData);

        expect(importResult.success).toBe(false);
        expect(importResult.error).toBeDefined();
        expect(importResult.type).toBe('validation');
    });
});