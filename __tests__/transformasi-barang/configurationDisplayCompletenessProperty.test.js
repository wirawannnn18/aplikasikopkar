/**
 * Property Test 21: Configuration Display Completeness
 * 
 * Property: For any admin access to ratio configuration, 
 * all products with their unit relationships and ratios should be displayed
 * 
 * Validates: Requirements 5.1
 */

import fc from 'fast-check';
import { ConfigurationManager } from '../../js/transformasi-barang/ConfigurationManager.js';

describe('Feature: transformasi-barang, Property 21: Configuration Display Completeness', () => {
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

    test('should display all products with unit relationships and ratios', () => {
        fc.assert(fc.property(
            // Generate test data
            fc.array(fc.record({
                baseProduct: fc.string({ minLength: 1, maxLength: 20 }),
                items: fc.array(fc.record({
                    kode: fc.string({ minLength: 1, maxLength: 20 }),
                    nama: fc.string({ minLength: 1, maxLength: 50 }),
                    satuan: fc.string({ minLength: 1, maxLength: 10 }),
                    stok: fc.nat({ max: 1000 })
                }), { minLength: 2, maxLength: 5 }),
                ratios: fc.array(fc.record({
                    from: fc.string({ minLength: 1, maxLength: 10 }),
                    to: fc.string({ minLength: 1, maxLength: 10 }),
                    ratio: fc.float({ min: 0.001, max: 1000 })
                }), { minLength: 0, maxLength: 10 })
            }), { minLength: 1, maxLength: 10 }),
            
            (testProducts) => {
                // Setup mock data
                const masterBarang = [];
                const ratioConfig = {};

                testProducts.forEach(product => {
                    // Create master barang entries
                    product.items.forEach(item => {
                        masterBarang.push({
                            kode: item.kode,
                            nama: item.nama,
                            baseProduct: product.baseProduct,
                            satuan: item.satuan,
                            stok: item.stok
                        });
                    });

                    // Create ratio configuration
                    if (product.ratios.length > 0) {
                        ratioConfig[product.baseProduct] = {
                            baseProduct: product.baseProduct,
                            conversions: product.ratios.map(ratio => ({
                                from: ratio.from,
                                to: ratio.to,
                                ratio: ratio.ratio,
                                lastUpdated: new Date().toISOString(),
                                updatedBy: 'test'
                            }))
                        };
                    }
                });

                // Mock localStorage responses
                global.localStorage.getItem.mockImplementation((key) => {
                    if (key === 'masterBarang') {
                        return JSON.stringify(masterBarang);
                    }
                    if (key === 'transformasi_conversion_ratios') {
                        return JSON.stringify(ratioConfig);
                    }
                    return null;
                });

                // Test the property
                const result = configManager.getAllRatioConfigurations();

                // Property verification
                expect(result.success).toBe(true);
                expect(Array.isArray(result.data)).toBe(true);

                // Verify all base products are represented
                const expectedBaseProducts = [...new Set(masterBarang.map(item => item.baseProduct))];
                const displayedBaseProducts = result.data.map(config => config.baseProduct);

                expectedBaseProducts.forEach(baseProduct => {
                    expect(displayedBaseProducts).toContain(baseProduct);
                });

                // Verify each configuration contains all items for that base product
                result.data.forEach(config => {
                    const expectedItems = masterBarang.filter(item => item.baseProduct === config.baseProduct);
                    
                    expect(config.items).toHaveLength(expectedItems.length);
                    
                    expectedItems.forEach(expectedItem => {
                        const foundItem = config.items.find(item => item.kode === expectedItem.kode);
                        expect(foundItem).toBeDefined();
                        expect(foundItem.nama).toBe(expectedItem.nama);
                        expect(foundItem.satuan).toBe(expectedItem.satuan);
                        expect(foundItem.stok).toBe(expectedItem.stok);
                    });
                });

                // Verify ratio information is included
                result.data.forEach(config => {
                    if (ratioConfig[config.baseProduct]) {
                        expect(config.ratios.conversions).toEqual(ratioConfig[config.baseProduct].conversions);
                    } else {
                        expect(config.ratios.conversions).toEqual([]);
                    }
                });

                // Verify timestamp is present
                expect(result.timestamp).toBeDefined();
                expect(new Date(result.timestamp)).toBeInstanceOf(Date);
            }
        ), { numRuns: 100 });
    });

    test('should handle empty master barang gracefully', () => {
        global.localStorage.getItem.mockImplementation((key) => {
            if (key === 'masterBarang') {
                return JSON.stringify([]);
            }
            if (key === 'transformasi_conversion_ratios') {
                return JSON.stringify({});
            }
            return null;
        });

        const result = configManager.getAllRatioConfigurations();

        expect(result.success).toBe(true);
        expect(result.data).toEqual([]);
    });

    test('should handle missing localStorage data gracefully', () => {
        global.localStorage.getItem.mockReturnValue(null);

        const result = configManager.getAllRatioConfigurations();

        expect(result.success).toBe(true);
        expect(Array.isArray(result.data)).toBe(true);
    });

    test('should handle corrupted localStorage data', () => {
        global.localStorage.getItem.mockImplementation((key) => {
            if (key === 'masterBarang') {
                return 'invalid_json';
            }
            return null;
        });

        const result = configManager.getAllRatioConfigurations();

        // Should either succeed with empty data or fail gracefully
        if (result.success) {
            expect(Array.isArray(result.data)).toBe(true);
        } else {
            expect(result.error).toBeDefined();
        }
    });
});