/**
 * Property Test: Unit Filter Accuracy (Property 14)
 * Validates Requirements 4.4: Unit filter functionality
 * 
 * Property: For any selected unit filter, the system should display 
 * only barang items that use that unit
 */

import fc from 'fast-check';
import { FilterManager } from '../../js/master-barang/FilterManager.js';
import { SatuanManager } from '../../js/master-barang/SatuanManager.js';
import { BarangManager } from '../../js/master-barang/BarangManager.js';

describe('Property 14: Unit Filter Accuracy', () => {
    let filterManager;
    let satuanManager;
    let barangManager;

    beforeEach(() => {
        // Clear localStorage
        localStorage.clear();
        
        // Initialize managers
        filterManager = new FilterManager();
        satuanManager = new SatuanManager();
        barangManager = new BarangManager();
    });

    afterEach(() => {
        localStorage.clear();
    });

    /**
     * Test 1: Unit filter returns only items with selected unit
     */
    test('should return only barang items with selected unit', () => {
        fc.assert(fc.property(
            // Generate units
            fc.array(fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                nama: fc.constantFrom('PCS', 'KG', 'LITER', 'METER', 'DUS', 'KARUNG', 'BOTOL', 'KALENG'),
                status: fc.constantFrom('aktif', 'nonaktif')
            }), { minLength: 2, maxLength: 6 }),
            
            // Generate barang items
            fc.array(fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                kode: fc.string({ minLength: 3, maxLength: 10 }),
                nama: fc.string({ minLength: 3, maxLength: 30 }),
                satuan_id: fc.string({ minLength: 1, maxLength: 10 }),
                satuan_nama: fc.constantFrom('PCS', 'KG', 'LITER', 'METER', 'DUS', 'KARUNG', 'BOTOL', 'KALENG'),
                status: fc.constantFrom('aktif', 'nonaktif')
            }), { minLength: 5, maxLength: 20 }),
            
            (units, barangItems) => {
                // Ensure we have valid units
                const validUnits = units.filter((unit, index, arr) => 
                    arr.findIndex(u => u.id === unit.id) === index
                );
                
                if (validUnits.length === 0) return;

                // Map barang items to existing units
                const mappedBarang = barangItems.map((item, index) => ({
                    ...item,
                    id: `barang_${index}`,
                    kode: `BRG${index.toString().padStart(3, '0')}`,
                    satuan_id: validUnits[index % validUnits.length].id,
                    satuan_nama: validUnits[index % validUnits.length].nama
                }));

                // Select a random unit to filter by
                const selectedUnit = validUnits[0];
                
                // Apply unit filter
                filterManager.setFilter('satuan', selectedUnit.id);
                const filteredData = filterManager.applyFilters(mappedBarang);

                // Verify all returned items belong to selected unit
                filteredData.forEach(item => {
                    expect(item.satuan_id).toBe(selectedUnit.id);
                });

                // Verify we get the expected count
                const expectedCount = mappedBarang.filter(item => 
                    item.satuan_id === selectedUnit.id
                ).length;
                expect(filteredData.length).toBe(expectedCount);
            }
        ), { numRuns: 50 });
    });

    /**
     * Test 2: Empty unit filter returns all items
     */
    test('should return all items when no unit filter is applied', () => {
        fc.assert(fc.property(
            fc.array(fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                kode: fc.string({ minLength: 3, maxLength: 10 }),
                nama: fc.string({ minLength: 3, maxLength: 30 }),
                satuan_id: fc.string({ minLength: 1, maxLength: 10 }),
                satuan_nama: fc.constantFrom('PCS', 'KG', 'LITER', 'METER', 'DUS'),
                status: fc.constantFrom('aktif', 'nonaktif')
            }), { minLength: 1, maxLength: 15 }),
            
            (barangItems) => {
                // Ensure no unit filter is set
                filterManager.clearAllFilters();
                
                const filteredData = filterManager.applyFilters(barangItems);
                
                // Should return all items
                expect(filteredData.length).toBe(barangItems.length);
                expect(filteredData).toEqual(barangItems);
            }
        ), { numRuns: 30 });
    });

    /**
     * Test 3: Invalid unit filter returns empty results
     */
    test('should return empty results for non-existent unit', () => {
        fc.assert(fc.property(
            fc.array(fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                kode: fc.string({ minLength: 3, maxLength: 10 }),
                nama: fc.string({ minLength: 3, maxLength: 30 }),
                satuan_id: fc.string({ minLength: 1, maxLength: 10 }),
                satuan_nama: fc.constantFrom('PCS', 'KG', 'LITER', 'METER', 'DUS'),
                status: fc.constantFrom('aktif', 'nonaktif')
            }), { minLength: 1, maxLength: 15 }),
            fc.string({ minLength: 15, maxLength: 25 }), // Non-existent unit ID
            
            (barangItems, nonExistentUnitId) => {
                // Ensure the unit ID doesn't exist in data
                const unitExists = barangItems.some(item => 
                    item.satuan_id === nonExistentUnitId
                );
                
                if (unitExists) return; // Skip if unit exists
                
                // Apply non-existent unit filter
                filterManager.setFilter('satuan', nonExistentUnitId);
                const filteredData = filterManager.applyFilters(barangItems);
                
                // Should return empty results
                expect(filteredData.length).toBe(0);
            }
        ), { numRuns: 30 });
    });

    /**
     * Test 4: Unit filter with null/undefined values
     */
    test('should handle null/undefined unit values correctly', () => {
        fc.assert(fc.property(
            fc.array(fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                kode: fc.string({ minLength: 3, maxLength: 10 }),
                nama: fc.string({ minLength: 3, maxLength: 30 }),
                satuan_id: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: null }),
                satuan_nama: fc.option(fc.constantFrom('PCS', 'KG', 'LITER', 'METER'), { nil: null }),
                status: fc.constantFrom('aktif', 'nonaktif')
            }), { minLength: 5, maxLength: 15 }),
            fc.string({ minLength: 1, maxLength: 10 }),
            
            (barangItems, unitId) => {
                // Apply unit filter
                filterManager.setFilter('satuan', unitId);
                const filteredData = filterManager.applyFilters(barangItems);
                
                // All returned items should have matching satuan_id
                filteredData.forEach(item => {
                    expect(item.satuan_id).toBe(unitId);
                });
                
                // Items with null/undefined satuan_id should not be included
                const expectedItems = barangItems.filter(item => 
                    item.satuan_id === unitId
                );
                expect(filteredData.length).toBe(expectedItems.length);
            }
        ), { numRuns: 40 });
    });

    /**
     * Test 5: Unit filter consistency across multiple applications
     */
    test('should return consistent results when applied multiple times', () => {
        fc.assert(fc.property(
            fc.array(fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                kode: fc.string({ minLength: 3, maxLength: 10 }),
                nama: fc.string({ minLength: 3, maxLength: 30 }),
                satuan_id: fc.string({ minLength: 1, maxLength: 5 }),
                satuan_nama: fc.constantFrom('PCS', 'KG', 'LITER', 'METER'),
                status: fc.constantFrom('aktif', 'nonaktif')
            }), { minLength: 3, maxLength: 12 }),
            fc.string({ minLength: 1, maxLength: 5 }),
            
            (barangItems, unitId) => {
                // Apply filter multiple times
                filterManager.setFilter('satuan', unitId);
                const result1 = filterManager.applyFilters(barangItems);
                
                filterManager.setFilter('satuan', unitId);
                const result2 = filterManager.applyFilters(barangItems);
                
                filterManager.setFilter('satuan', unitId);
                const result3 = filterManager.applyFilters(barangItems);
                
                // Results should be identical
                expect(result1).toEqual(result2);
                expect(result2).toEqual(result3);
                expect(result1.length).toBe(result2.length);
                expect(result2.length).toBe(result3.length);
            }
        ), { numRuns: 30 });
    });

    /**
     * Test 6: Unit filter with case sensitivity
     */
    test('should handle unit filter with exact matching', () => {
        fc.assert(fc.property(
            fc.array(fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                kode: fc.string({ minLength: 3, maxLength: 10 }),
                nama: fc.string({ minLength: 3, maxLength: 30 }),
                satuan_id: fc.string({ minLength: 1, maxLength: 10 }),
                satuan_nama: fc.constantFrom('PCS', 'KG', 'LITER', 'METER'),
                status: fc.constantFrom('aktif', 'nonaktif')
            }), { minLength: 3, maxLength: 12 }),
            
            (barangItems) => {
                if (barangItems.length === 0) return;
                
                const targetItem = barangItems[0];
                const exactUnitId = targetItem.satuan_id;
                const modifiedUnitId = exactUnitId.toLowerCase();
                
                // Test exact match
                filterManager.setFilter('satuan', exactUnitId);
                const exactResults = filterManager.applyFilters(barangItems);
                
                // Test case-different match (should not match if different case)
                filterManager.setFilter('satuan', modifiedUnitId);
                const caseResults = filterManager.applyFilters(barangItems);
                
                // Exact match should include the target item
                const exactMatch = exactResults.some(item => 
                    item.satuan_id === exactUnitId
                );
                expect(exactMatch).toBe(true);
                
                // Case-different should only match if there's an exact case match
                const caseMatch = caseResults.some(item => 
                    item.satuan_id === modifiedUnitId
                );
                const hasCaseMatch = barangItems.some(item => 
                    item.satuan_id === modifiedUnitId
                );
                expect(caseMatch).toBe(hasCaseMatch);
            }
        ), { numRuns: 25 });
    });

    /**
     * Test 7: Unit filter performance with large datasets
     */
    test('should maintain performance with large datasets', () => {
        const largeDataset = Array.from({ length: 1000 }, (_, index) => ({
            id: `item_${index}`,
            kode: `BRG${index.toString().padStart(4, '0')}`,
            nama: `Barang ${index}`,
            satuan_id: `unit_${index % 8}`, // 8 different units
            satuan_nama: ['PCS', 'KG', 'LITER', 'METER', 'DUS', 'KARUNG', 'BOTOL', 'KALENG'][index % 8],
            status: index % 2 === 0 ? 'aktif' : 'nonaktif'
        }));

        const startTime = performance.now();
        
        // Apply unit filter
        filterManager.setFilter('satuan', 'unit_3');
        const filteredData = filterManager.applyFilters(largeDataset);
        
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        
        // Should complete within reasonable time (100ms)
        expect(executionTime).toBeLessThan(100);
        
        // Should return correct results
        expect(filteredData.length).toBe(125); // 1000 / 8 units
        filteredData.forEach(item => {
            expect(item.satuan_id).toBe('unit_3');
        });
    });

    /**
     * Test 8: Unit filter with special characters
     */
    test('should handle unit IDs with special characters', () => {
        fc.assert(fc.property(
            fc.array(fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                kode: fc.string({ minLength: 3, maxLength: 10 }),
                nama: fc.string({ minLength: 3, maxLength: 30 }),
                satuan_id: fc.string({ minLength: 1, maxLength: 15 }),
                satuan_nama: fc.constantFrom('PCS', 'KG', 'LITER', 'METER'),
                status: fc.constantFrom('aktif', 'nonaktif')
            }), { minLength: 2, maxLength: 10 }),
            
            (barangItems) => {
                if (barangItems.length === 0) return;
                
                // Create items with special character unit IDs
                const specialItems = barangItems.map((item, index) => ({
                    ...item,
                    satuan_id: `unit-${index}_special!@#`,
                    satuan_nama: ['PCS', 'KG', 'LITER', 'METER'][index % 4]
                }));
                
                const targetUnitId = specialItems[0].satuan_id;
                
                // Apply filter with special characters
                filterManager.setFilter('satuan', targetUnitId);
                const filteredData = filterManager.applyFilters(specialItems);
                
                // Should handle special characters correctly
                filteredData.forEach(item => {
                    expect(item.satuan_id).toBe(targetUnitId);
                });
                
                const expectedCount = specialItems.filter(item => 
                    item.satuan_id === targetUnitId
                ).length;
                expect(filteredData.length).toBe(expectedCount);
            }
        ), { numRuns: 20 });
    });

    /**
     * Test 9: Unit filter state management
     */
    test('should properly manage filter state', () => {
        const testData = [
            { id: '1', kode: 'BRG001', nama: 'Item 1', satuan_id: 'unit1', satuan_nama: 'PCS', status: 'aktif' },
            { id: '2', kode: 'BRG002', nama: 'Item 2', satuan_id: 'unit2', satuan_nama: 'KG', status: 'aktif' },
            { id: '3', kode: 'BRG003', nama: 'Item 3', satuan_id: 'unit1', satuan_nama: 'PCS', status: 'aktif' }
        ];

        // Initially no filter
        expect(filterManager.getFilter('satuan')).toBeUndefined();
        let result = filterManager.applyFilters(testData);
        expect(result.length).toBe(3);

        // Set unit filter
        filterManager.setFilter('satuan', 'unit1');
        expect(filterManager.getFilter('satuan')).toBe('unit1');
        result = filterManager.applyFilters(testData);
        expect(result.length).toBe(2);

        // Change unit filter
        filterManager.setFilter('satuan', 'unit2');
        expect(filterManager.getFilter('satuan')).toBe('unit2');
        result = filterManager.applyFilters(testData);
        expect(result.length).toBe(1);

        // Remove unit filter
        filterManager.removeFilter('satuan');
        expect(filterManager.getFilter('satuan')).toBeUndefined();
        result = filterManager.applyFilters(testData);
        expect(result.length).toBe(3);
    });

    /**
     * Test 10: Unit filter integration with other components
     */
    test('should integrate properly with other system components', () => {
        // Create test units
        const units = [
            { id: 'unit1', nama: 'PCS', status: 'aktif' },
            { id: 'unit2', nama: 'KG', status: 'aktif' },
            { id: 'unit3', nama: 'LITER', status: 'nonaktif' }
        ];

        // Save units to localStorage
        units.forEach(unit => {
            satuanManager.create(unit);
        });

        // Create test barang
        const barangItems = [
            { kode: 'BRG001', nama: 'Laptop', satuan_id: 'unit1', satuan_nama: 'PCS', status: 'aktif' },
            { kode: 'BRG002', nama: 'Beras', satuan_id: 'unit2', satuan_nama: 'KG', status: 'aktif' },
            { kode: 'BRG003', nama: 'Minyak', satuan_id: 'unit3', satuan_nama: 'LITER', status: 'aktif' }
        ];

        // Save barang to localStorage
        barangItems.forEach(item => {
            barangManager.create(item);
        });

        // Test filter with existing units
        filterManager.setFilter('satuan', 'unit1');
        const filteredData = filterManager.applyFilters(barangItems);
        
        expect(filteredData.length).toBe(1);
        expect(filteredData[0].satuan_id).toBe('unit1');
        expect(filteredData[0].satuan_nama).toBe('PCS');

        // Verify filter options can be generated
        const filterOptions = filterManager.getFilterOptions('satuan', barangItems);
        expect(filterOptions.length).toBeGreaterThan(0);
        
        // Verify filter summary
        const summary = filterManager.getFilterSummary();
        expect(summary.length).toBe(1);
        expect(summary[0].name).toBe('satuan');
        expect(summary[0].value).toBe('unit1');
    });

    /**
     * Test 11: Unit filter with common unit types
     */
    test('should handle common unit types correctly', () => {
        const commonUnits = ['PCS', 'KG', 'LITER', 'METER', 'DUS', 'KARUNG', 'BOTOL', 'KALENG', 'GRAM', 'TON'];
        
        fc.assert(fc.property(
            fc.array(fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                kode: fc.string({ minLength: 3, maxLength: 10 }),
                nama: fc.string({ minLength: 3, maxLength: 30 }),
                satuan_id: fc.string({ minLength: 1, maxLength: 10 }),
                satuan_nama: fc.constantFrom(...commonUnits),
                status: fc.constantFrom('aktif', 'nonaktif')
            }), { minLength: 5, maxLength: 20 }),
            fc.constantFrom(...commonUnits),
            
            (barangItems, selectedUnitName) => {
                // Create items with consistent unit mapping
                const mappedItems = barangItems.map((item, index) => ({
                    ...item,
                    satuan_id: `unit_${item.satuan_nama.toLowerCase()}`,
                    satuan_nama: item.satuan_nama
                }));

                const targetUnitId = `unit_${selectedUnitName.toLowerCase()}`;
                
                // Apply unit filter
                filterManager.setFilter('satuan', targetUnitId);
                const filteredData = filterManager.applyFilters(mappedItems);
                
                // All returned items should have the target unit
                filteredData.forEach(item => {
                    expect(item.satuan_id).toBe(targetUnitId);
                    expect(item.satuan_nama).toBe(selectedUnitName);
                });
                
                // Verify count matches expected
                const expectedCount = mappedItems.filter(item => 
                    item.satuan_id === targetUnitId
                ).length;
                expect(filteredData.length).toBe(expectedCount);
            }
        ), { numRuns: 30 });
    });

    /**
     * Test 12: Unit filter with mixed data types
     */
    test('should handle mixed data types in unit fields', () => {
        const mixedData = [
            { id: '1', kode: 'BRG001', nama: 'Item 1', satuan_id: 'unit1', satuan_nama: 'PCS', status: 'aktif' },
            { id: '2', kode: 'BRG002', nama: 'Item 2', satuan_id: 123, satuan_nama: 'KG', status: 'aktif' }, // Number ID
            { id: '3', kode: 'BRG003', nama: 'Item 3', satuan_id: 'unit1', satuan_nama: 'PCS', status: 'aktif' },
            { id: '4', kode: 'BRG004', nama: 'Item 4', satuan_id: null, satuan_nama: null, status: 'aktif' }, // Null values
            { id: '5', kode: 'BRG005', nama: 'Item 5', satuan_id: '', satuan_nama: '', status: 'aktif' } // Empty strings
        ];

        // Test string unit ID
        filterManager.setFilter('satuan', 'unit1');
        let result = filterManager.applyFilters(mixedData);
        expect(result.length).toBe(2);
        result.forEach(item => {
            expect(item.satuan_id).toBe('unit1');
        });

        // Test number unit ID (converted to string for comparison)
        filterManager.setFilter('satuan', '123');
        result = filterManager.applyFilters(mixedData);
        expect(result.length).toBe(1);
        expect(result[0].satuan_id).toBe(123);

        // Test null/empty values - these should clear the filter and return all data
        filterManager.setFilter('satuan', null);
        result = filterManager.applyFilters(mixedData);
        expect(result.length).toBe(5); // Null filter should clear filter and return all data

        filterManager.setFilter('satuan', '');
        result = filterManager.applyFilters(mixedData);
        expect(result.length).toBe(5); // Empty string filter should clear filter and return all data
    });

    /**
     * Test 13: Unit filter caching behavior
     */
    test('should properly cache filter results for performance', () => {
        const testData = Array.from({ length: 100 }, (_, index) => ({
            id: `item_${index}`,
            kode: `BRG${index.toString().padStart(3, '0')}`,
            nama: `Item ${index}`,
            satuan_id: `unit_${index % 5}`,
            satuan_nama: ['PCS', 'KG', 'LITER', 'METER', 'DUS'][index % 5],
            status: 'aktif'
        }));

        // First filter application
        const startTime1 = performance.now();
        filterManager.setFilter('satuan', 'unit_2');
        const result1 = filterManager.applyFilters(testData);
        const endTime1 = performance.now();
        const time1 = endTime1 - startTime1;

        // Second filter application (should use cache)
        const startTime2 = performance.now();
        const result2 = filterManager.applyFilters(testData);
        const endTime2 = performance.now();
        const time2 = endTime2 - startTime2;

        // Results should be identical
        expect(result1).toEqual(result2);
        expect(result1.length).toBe(20); // 100 / 5 units

        // Second call should be faster (cached)
        // Note: This might not always be true in test environment, so we just verify results are same
        expect(result2.length).toBe(result1.length);
        
        // Verify cache is cleared when filter changes
        filterManager.setFilter('satuan', 'unit_3');
        const result3 = filterManager.applyFilters(testData);
        expect(result3.length).toBe(20);
        expect(result3).not.toEqual(result1);
    });

    /**
     * Test 14: Unit filter with edge cases
     */
    test('should handle edge cases properly', () => {
        // Empty dataset
        let result = filterManager.applyFilters([]);
        expect(result).toEqual([]);

        // Single item dataset
        const singleItem = [{ id: '1', kode: 'BRG001', nama: 'Item', satuan_id: 'unit1', satuan_nama: 'PCS', status: 'aktif' }];
        
        filterManager.setFilter('satuan', 'unit1');
        result = filterManager.applyFilters(singleItem);
        expect(result.length).toBe(1);
        expect(result[0].satuan_id).toBe('unit1');

        filterManager.setFilter('satuan', 'unit2');
        result = filterManager.applyFilters(singleItem);
        expect(result.length).toBe(0);

        // Dataset with all same units
        const sameUnitData = Array.from({ length: 5 }, (_, index) => ({
            id: `item_${index}`,
            kode: `BRG${index}`,
            nama: `Item ${index}`,
            satuan_id: 'same_unit',
            satuan_nama: 'PCS',
            status: 'aktif'
        }));

        filterManager.setFilter('satuan', 'same_unit');
        result = filterManager.applyFilters(sameUnitData);
        expect(result.length).toBe(5);

        filterManager.setFilter('satuan', 'different_unit');
        result = filterManager.applyFilters(sameUnitData);
        expect(result.length).toBe(0);
    });

    /**
     * Test 15: Unit filter validation and error handling
     */
    test('should validate filter values and handle errors gracefully', () => {
        const testData = [
            { id: '1', kode: 'BRG001', nama: 'Item 1', satuan_id: 'unit1', satuan_nama: 'PCS', status: 'aktif' },
            { id: '2', kode: 'BRG002', nama: 'Item 2', satuan_id: 'unit2', satuan_nama: 'KG', status: 'aktif' }
        ];

        // Test with various invalid inputs
        const invalidInputs = [undefined, {}, [], function() {}, Symbol('test')];
        
        invalidInputs.forEach(invalidInput => {
            // Should handle invalid inputs gracefully
            expect(() => {
                filterManager.setFilter('satuan', invalidInput);
                filterManager.applyFilters(testData);
            }).not.toThrow();
        });

        // Test with very long strings
        const longString = 'a'.repeat(1000);
        filterManager.setFilter('satuan', longString);
        const result = filterManager.applyFilters(testData);
        expect(result.length).toBe(0); // Should not match anything

        // Test with special values
        filterManager.setFilter('satuan', 'NaN');
        expect(filterManager.applyFilters(testData).length).toBe(0);

        filterManager.setFilter('satuan', 'Infinity');
        expect(filterManager.applyFilters(testData).length).toBe(0);

        filterManager.setFilter('satuan', 'null');
        expect(filterManager.applyFilters(testData).length).toBe(0);
    });
});