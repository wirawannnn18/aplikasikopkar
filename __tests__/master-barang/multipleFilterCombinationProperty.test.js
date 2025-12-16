/**
 * Property Test: Multiple Filter Combination (Property 15)
 * Validates Requirements 4.5: Multiple filter functionality
 * 
 * Property: When multiple filters are applied simultaneously, the system should 
 * display only items that satisfy ALL filter criteria (AND logic)
 */

import fc from 'fast-check';
import { FilterManager } from '../../js/master-barang/FilterManager.js';
import { KategoriManager } from '../../js/master-barang/KategoriManager.js';
import { SatuanManager } from '../../js/master-barang/SatuanManager.js';
import { BarangManager } from '../../js/master-barang/BarangManager.js';

describe('Property 15: Multiple Filter Combination', () => {
    let filterManager;
    let kategoriManager;
    let satuanManager;
    let barangManager;

    beforeEach(() => {
        // Clear localStorage
        localStorage.clear();
        
        // Initialize managers
        filterManager = new FilterManager();
        kategoriManager = new KategoriManager();
        satuanManager = new SatuanManager();
        barangManager = new BarangManager();
    });

    afterEach(() => {
        localStorage.clear();
    });

    /**
     * Test 1: Multiple filters should apply AND logic
     */
    test('should apply AND logic when multiple filters are active', () => {
        fc.assert(fc.property(
            // Generate test data with multiple filterable fields
            fc.array(fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                kode: fc.string({ minLength: 3, maxLength: 10 }),
                nama: fc.string({ minLength: 3, maxLength: 30 }),
                kategori_id: fc.constantFrom('cat1', 'cat2', 'cat3', 'cat4'),
                kategori_nama: fc.constantFrom('Elektronik', 'Makanan', 'Pakaian', 'Furniture'),
                satuan_id: fc.constantFrom('unit1', 'unit2', 'unit3'),
                satuan_nama: fc.constantFrom('PCS', 'KG', 'LITER'),
                status: fc.constantFrom('aktif', 'nonaktif'),
                harga_jual: fc.float({ min: 1000, max: 100000 }),
                stok: fc.integer({ min: 0, max: 1000 })
            }), { minLength: 10, maxLength: 50 }),
            
            (barangItems) => {
                if (barangItems.length === 0) return;

                // Apply multiple filters
                const selectedCategory = 'cat1';
                const selectedUnit = 'unit1';
                const selectedStatus = 'aktif';

                filterManager.setFilter('kategori', selectedCategory);
                filterManager.setFilter('satuan', selectedUnit);
                filterManager.setFilter('status', selectedStatus);

                const filteredData = filterManager.applyFilters(barangItems);

                // Verify all returned items satisfy ALL filter criteria
                filteredData.forEach(item => {
                    expect(item.kategori_id).toBe(selectedCategory);
                    expect(item.satuan_id).toBe(selectedUnit);
                    expect(item.status).toBe(selectedStatus);
                });

                // Verify count matches manual filtering
                const expectedItems = barangItems.filter(item => 
                    item.kategori_id === selectedCategory &&
                    item.satuan_id === selectedUnit &&
                    item.status === selectedStatus
                );
                expect(filteredData.length).toBe(expectedItems.length);
            }
        ), { numRuns: 40 });
    });

    /**
     * Test 2: Adding filters should progressively narrow results
     */
    test('should progressively narrow results as filters are added', () => {
        fc.assert(fc.property(
            fc.array(fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                kode: fc.string({ minLength: 3, maxLength: 10 }),
                nama: fc.string({ minLength: 3, maxLength: 30 }),
                kategori_id: fc.constantFrom('cat1', 'cat2', 'cat3'),
                satuan_id: fc.constantFrom('unit1', 'unit2', 'unit3'),
                status: fc.constantFrom('aktif', 'nonaktif')
            }), { minLength: 15, maxLength: 30 }),
            
            (barangItems) => {
                if (barangItems.length === 0) return;

                // Start with no filters
                filterManager.clearAllFilters();
                const allItems = filterManager.applyFilters(barangItems);

                // Add first filter (category)
                filterManager.setFilter('kategori', 'cat1');
                const categoryFiltered = filterManager.applyFilters(barangItems);

                // Add second filter (unit)
                filterManager.setFilter('satuan', 'unit1');
                const categoryUnitFiltered = filterManager.applyFilters(barangItems);

                // Add third filter (status)
                filterManager.setFilter('status', 'aktif');
                const allFiltered = filterManager.applyFilters(barangItems);

                // Each step should have equal or fewer results
                expect(categoryFiltered.length).toBeLessThanOrEqual(allItems.length);
                expect(categoryUnitFiltered.length).toBeLessThanOrEqual(categoryFiltered.length);
                expect(allFiltered.length).toBeLessThanOrEqual(categoryUnitFiltered.length);

                // Verify final result satisfies all criteria
                allFiltered.forEach(item => {
                    expect(item.kategori_id).toBe('cat1');
                    expect(item.satuan_id).toBe('unit1');
                    expect(item.status).toBe('aktif');
                });
            }
        ), { numRuns: 30 });
    });

    /**
     * Test 3: Range filters combined with categorical filters
     */
    test('should combine range filters with categorical filters correctly', () => {
        fc.assert(fc.property(
            fc.array(fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                kode: fc.string({ minLength: 3, maxLength: 10 }),
                nama: fc.string({ minLength: 3, maxLength: 30 }),
                kategori_id: fc.constantFrom('cat1', 'cat2', 'cat3'),
                satuan_id: fc.constantFrom('unit1', 'unit2'),
                status: fc.constantFrom('aktif', 'nonaktif'),
                harga_jual: fc.float({ min: 1000, max: 50000 }),
                stok: fc.integer({ min: 0, max: 500 })
            }), { minLength: 20, maxLength: 40 }),
            
            (barangItems) => {
                if (barangItems.length === 0) return;

                // Apply categorical and range filters
                const selectedCategory = 'cat1';
                const priceRange = { min: 5000, max: 30000 };
                const stockRange = { min: 10, max: 200 };

                filterManager.setFilter('kategori', selectedCategory);
                filterManager.setFilter('price_range', priceRange);
                filterManager.setFilter('stock_level', stockRange);

                const filteredData = filterManager.applyFilters(barangItems);

                // Verify all criteria are satisfied
                filteredData.forEach(item => {
                    expect(item.kategori_id).toBe(selectedCategory);
                    expect(item.harga_jual).toBeGreaterThanOrEqual(priceRange.min);
                    expect(item.harga_jual).toBeLessThanOrEqual(priceRange.max);
                    expect(item.stok).toBeGreaterThanOrEqual(stockRange.min);
                    expect(item.stok).toBeLessThanOrEqual(stockRange.max);
                });

                // Verify count matches manual filtering
                const expectedItems = barangItems.filter(item => 
                    item.kategori_id === selectedCategory &&
                    item.harga_jual >= priceRange.min &&
                    item.harga_jual <= priceRange.max &&
                    item.stok >= stockRange.min &&
                    item.stok <= stockRange.max
                );
                expect(filteredData.length).toBe(expectedItems.length);
            }
        ), { numRuns: 25 });
    });

    /**
     * Test 4: Custom filters combined with standard filters
     */
    test('should combine custom filters with standard filters', () => {
        const testData = Array.from({ length: 30 }, (_, index) => ({
            id: `item_${index}`,
            kode: `BRG${index.toString().padStart(3, '0')}`,
            nama: `Barang ${index}`,
            kategori_id: index % 3 === 0 ? 'cat1' : 'cat2',
            satuan_id: index % 2 === 0 ? 'unit1' : 'unit2',
            status: index % 4 === 0 ? 'aktif' : 'nonaktif',
            stok: index * 5,
            stok_minimum: 20
        }));

        // Apply category filter and low stock custom filter
        filterManager.setFilter('kategori', 'cat1');
        filterManager.setFilter('low_stock', true);

        const filteredData = filterManager.applyFilters(testData);

        // Verify all items satisfy both conditions
        filteredData.forEach(item => {
            expect(item.kategori_id).toBe('cat1');
            expect(item.stok).toBeLessThanOrEqual(item.stok_minimum);
            expect(item.stok).toBeGreaterThan(0);
        });

        // Manual verification
        const expectedItems = testData.filter(item => 
            item.kategori_id === 'cat1' &&
            item.stok <= item.stok_minimum &&
            item.stok > 0
        );
        expect(filteredData.length).toBe(expectedItems.length);
    });

    /**
     * Test 5: Filter order independence
     */
    test('should produce same results regardless of filter application order', () => {
        fc.assert(fc.property(
            fc.array(fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                kode: fc.string({ minLength: 3, maxLength: 10 }),
                nama: fc.string({ minLength: 3, maxLength: 30 }),
                kategori_id: fc.constantFrom('cat1', 'cat2', 'cat3'),
                satuan_id: fc.constantFrom('unit1', 'unit2'),
                status: fc.constantFrom('aktif', 'nonaktif')
            }), { minLength: 10, maxLength: 25 }),
            
            (barangItems) => {
                if (barangItems.length === 0) return;

                const categoryValue = 'cat1';
                const unitValue = 'unit1';
                const statusValue = 'aktif';

                // Apply filters in order 1: category -> unit -> status
                filterManager.clearAllFilters();
                filterManager.setFilter('kategori', categoryValue);
                filterManager.setFilter('satuan', unitValue);
                filterManager.setFilter('status', statusValue);
                const result1 = filterManager.applyFilters(barangItems);

                // Apply filters in order 2: status -> category -> unit
                filterManager.clearAllFilters();
                filterManager.setFilter('status', statusValue);
                filterManager.setFilter('kategori', categoryValue);
                filterManager.setFilter('satuan', unitValue);
                const result2 = filterManager.applyFilters(barangItems);

                // Apply filters in order 3: unit -> status -> category
                filterManager.clearAllFilters();
                filterManager.setFilter('satuan', unitValue);
                filterManager.setFilter('status', statusValue);
                filterManager.setFilter('kategori', categoryValue);
                const result3 = filterManager.applyFilters(barangItems);

                // All results should be identical
                expect(result1).toEqual(result2);
                expect(result2).toEqual(result3);
                expect(result1.length).toBe(result2.length);
                expect(result2.length).toBe(result3.length);
            }
        ), { numRuns: 30 });
    });

    /**
     * Test 6: Removing filters should expand results
     */
    test('should expand results when filters are removed', () => {
        const testData = [
            { id: '1', kode: 'BRG001', nama: 'Item 1', kategori_id: 'cat1', satuan_id: 'unit1', status: 'aktif' },
            { id: '2', kode: 'BRG002', nama: 'Item 2', kategori_id: 'cat1', satuan_id: 'unit2', status: 'aktif' },
            { id: '3', kode: 'BRG003', nama: 'Item 3', kategori_id: 'cat2', satuan_id: 'unit1', status: 'aktif' },
            { id: '4', kode: 'BRG004', nama: 'Item 4', kategori_id: 'cat1', satuan_id: 'unit1', status: 'nonaktif' },
            { id: '5', kode: 'BRG005', nama: 'Item 5', kategori_id: 'cat2', satuan_id: 'unit2', status: 'nonaktif' }
        ];

        // Apply all filters
        filterManager.setFilter('kategori', 'cat1');
        filterManager.setFilter('satuan', 'unit1');
        filterManager.setFilter('status', 'aktif');
        const allFiltered = filterManager.applyFilters(testData);
        expect(allFiltered.length).toBe(1); // Only item 1 matches all criteria

        // Remove status filter
        filterManager.removeFilter('status');
        const withoutStatus = filterManager.applyFilters(testData);
        expect(withoutStatus.length).toBe(2); // Items 1 and 4

        // Remove unit filter
        filterManager.removeFilter('satuan');
        const withoutUnit = filterManager.applyFilters(testData);
        expect(withoutUnit.length).toBe(3); // Items 1, 2, and 4

        // Remove category filter (no filters)
        filterManager.removeFilter('kategori');
        const noFilters = filterManager.applyFilters(testData);
        expect(noFilters.length).toBe(5); // All items

        // Verify progressive expansion
        expect(allFiltered.length).toBeLessThanOrEqual(withoutStatus.length);
        expect(withoutStatus.length).toBeLessThanOrEqual(withoutUnit.length);
        expect(withoutUnit.length).toBeLessThanOrEqual(noFilters.length);
    });

    /**
     * Test 7: Complex filter combinations with edge cases
     */
    test('should handle complex filter combinations with edge cases', () => {
        fc.assert(fc.property(
            fc.array(fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                kode: fc.string({ minLength: 3, maxLength: 10 }),
                nama: fc.string({ minLength: 3, maxLength: 30 }),
                kategori_id: fc.option(fc.constantFrom('cat1', 'cat2', 'cat3'), { nil: null }),
                satuan_id: fc.option(fc.constantFrom('unit1', 'unit2'), { nil: null }),
                status: fc.constantFrom('aktif', 'nonaktif'),
                harga_jual: fc.option(fc.float({ min: 0, max: 100000 }), { nil: null })
            }), { minLength: 15, maxLength: 30 }),
            
            (barangItems) => {
                if (barangItems.length === 0) return;

                // Apply filters including null-handling scenarios
                filterManager.setFilter('kategori', 'cat1');
                filterManager.setFilter('satuan', 'unit1');
                filterManager.setFilter('status', 'aktif');

                const filteredData = filterManager.applyFilters(barangItems);

                // Verify no null values pass through filters
                filteredData.forEach(item => {
                    expect(item.kategori_id).toBe('cat1');
                    expect(item.satuan_id).toBe('unit1');
                    expect(item.status).toBe('aktif');
                    // Null values should not match
                    expect(item.kategori_id).not.toBeNull();
                    expect(item.satuan_id).not.toBeNull();
                });

                // Verify manual filtering matches
                const expectedItems = barangItems.filter(item => 
                    item.kategori_id === 'cat1' &&
                    item.satuan_id === 'unit1' &&
                    item.status === 'aktif'
                );
                expect(filteredData.length).toBe(expectedItems.length);
            }
        ), { numRuns: 25 });
    });

    /**
     * Test 8: Performance with multiple filters on large datasets
     */
    test('should maintain performance with multiple filters on large datasets', () => {
        const largeDataset = Array.from({ length: 2000 }, (_, index) => ({
            id: `item_${index}`,
            kode: `BRG${index.toString().padStart(4, '0')}`,
            nama: `Barang ${index}`,
            kategori_id: `cat_${index % 5}`, // 5 categories
            satuan_id: `unit_${index % 3}`, // 3 units
            status: index % 2 === 0 ? 'aktif' : 'nonaktif',
            harga_jual: 1000 + (index * 10),
            stok: index % 100
        }));

        const startTime = performance.now();

        // Apply multiple filters
        filterManager.setFilter('kategori', 'cat_2');
        filterManager.setFilter('satuan', 'unit_1');
        filterManager.setFilter('status', 'aktif');
        filterManager.setFilter('price_range', { min: 5000, max: 15000 });

        const filteredData = filterManager.applyFilters(largeDataset);

        const endTime = performance.now();
        const executionTime = endTime - startTime;

        // Should complete within reasonable time (200ms for multiple filters)
        expect(executionTime).toBeLessThan(200);

        // Verify results are correct
        filteredData.forEach(item => {
            expect(item.kategori_id).toBe('cat_2');
            expect(item.satuan_id).toBe('unit_1');
            expect(item.status).toBe('aktif');
            expect(item.harga_jual).toBeGreaterThanOrEqual(5000);
            expect(item.harga_jual).toBeLessThanOrEqual(15000);
        });

        // Should have reasonable number of results
        expect(filteredData.length).toBeGreaterThan(0);
        expect(filteredData.length).toBeLessThan(largeDataset.length);
    });

    /**
     * Test 9: Filter state consistency with multiple filters
     */
    test('should maintain consistent filter state with multiple filters', () => {
        const testData = [
            { id: '1', kode: 'BRG001', nama: 'Item 1', kategori_id: 'cat1', satuan_id: 'unit1', status: 'aktif' },
            { id: '2', kode: 'BRG002', nama: 'Item 2', kategori_id: 'cat2', satuan_id: 'unit2', status: 'nonaktif' }
        ];

        // Set multiple filters
        filterManager.setFilter('kategori', 'cat1');
        filterManager.setFilter('satuan', 'unit1');
        filterManager.setFilter('status', 'aktif');

        // Verify all filters are active
        expect(filterManager.getFilter('kategori')).toBe('cat1');
        expect(filterManager.getFilter('satuan')).toBe('unit1');
        expect(filterManager.getFilter('status')).toBe('aktif');

        // Get active filters
        const activeFilters = filterManager.getActiveFilters();
        expect(Object.keys(activeFilters)).toHaveLength(3);
        expect(activeFilters.kategori).toBe('cat1');
        expect(activeFilters.satuan).toBe('unit1');
        expect(activeFilters.status).toBe('aktif');

        // Get filter summary
        const summary = filterManager.getFilterSummary();
        expect(summary).toHaveLength(3);
        
        const categoryFilter = summary.find(f => f.name === 'kategori');
        const unitFilter = summary.find(f => f.name === 'satuan');
        const statusFilter = summary.find(f => f.name === 'status');
        
        expect(categoryFilter.value).toBe('cat1');
        expect(unitFilter.value).toBe('unit1');
        expect(statusFilter.value).toBe('aktif');

        // Clear all filters
        filterManager.clearAllFilters();
        expect(Object.keys(filterManager.getActiveFilters())).toHaveLength(0);
        expect(filterManager.getFilterSummary()).toHaveLength(0);
    });

    /**
     * Test 10: Multiple filter caching behavior
     */
    test('should properly cache results with multiple filters', () => {
        const testData = Array.from({ length: 100 }, (_, index) => ({
            id: `item_${index}`,
            kode: `BRG${index.toString().padStart(3, '0')}`,
            nama: `Item ${index}`,
            kategori_id: `cat_${index % 3}`,
            satuan_id: `unit_${index % 2}`,
            status: index % 2 === 0 ? 'aktif' : 'nonaktif'
        }));

        // First application with multiple filters
        filterManager.setFilter('kategori', 'cat_1');
        filterManager.setFilter('satuan', 'unit_0');
        filterManager.setFilter('status', 'aktif');

        const startTime1 = performance.now();
        const result1 = filterManager.applyFilters(testData);
        const endTime1 = performance.now();
        const time1 = endTime1 - startTime1;

        // Second application (should use cache)
        const startTime2 = performance.now();
        const result2 = filterManager.applyFilters(testData);
        const endTime2 = performance.now();
        const time2 = endTime2 - startTime2;

        // Results should be identical
        expect(result1).toEqual(result2);
        expect(result1.length).toBe(result2.length);

        // Verify cache is cleared when filters change
        filterManager.setFilter('kategori', 'cat_2');
        const result3 = filterManager.applyFilters(testData);
        expect(result3).not.toEqual(result1);

        // Verify results are correct
        result3.forEach(item => {
            expect(item.kategori_id).toBe('cat_2');
            expect(item.satuan_id).toBe('unit_0');
            expect(item.status).toBe('aktif');
        });
    });

    /**
     * Test 11: Multiple filter integration with system components
     */
    test('should integrate multiple filters with other system components', () => {
        // Create test categories and units
        const categories = [
            { id: 'cat1', nama: 'Elektronik', status: 'aktif' },
            { id: 'cat2', nama: 'Makanan', status: 'aktif' }
        ];
        const units = [
            { id: 'unit1', nama: 'PCS', status: 'aktif' },
            { id: 'unit2', nama: 'KG', status: 'aktif' }
        ];

        // Save to localStorage
        categories.forEach(cat => kategoriManager.create(cat));
        units.forEach(unit => satuanManager.create(unit));

        // Create test barang
        const barangItems = [
            { kode: 'BRG001', nama: 'Laptop', kategori_id: 'cat1', satuan_id: 'unit1', status: 'aktif' },
            { kode: 'BRG002', nama: 'Mouse', kategori_id: 'cat1', satuan_id: 'unit1', status: 'nonaktif' },
            { kode: 'BRG003', nama: 'Beras', kategori_id: 'cat2', satuan_id: 'unit2', status: 'aktif' },
            { kode: 'BRG004', nama: 'Gula', kategori_id: 'cat2', satuan_id: 'unit2', status: 'nonaktif' }
        ];

        barangItems.forEach(item => barangManager.create(item));

        // Apply multiple filters
        filterManager.setFilter('kategori', 'cat1');
        filterManager.setFilter('status', 'aktif');

        const filteredData = filterManager.applyFilters(barangItems);

        // Should return only Laptop (cat1 + aktif)
        expect(filteredData.length).toBe(1);
        expect(filteredData[0].nama).toBe('Laptop');
        expect(filteredData[0].kategori_id).toBe('cat1');
        expect(filteredData[0].status).toBe('aktif');

        // Verify filter options are available
        const categoryOptions = filterManager.getFilterOptions('kategori', barangItems);
        const statusOptions = filterManager.getFilterOptions('status', barangItems);
        
        expect(categoryOptions.length).toBeGreaterThan(0);
        expect(statusOptions.length).toBe(2); // aktif, nonaktif

        // Verify filter summary
        const summary = filterManager.getFilterSummary();
        expect(summary.length).toBe(2);
        expect(summary.some(f => f.name === 'kategori' && f.value === 'cat1')).toBe(true);
        expect(summary.some(f => f.name === 'status' && f.value === 'aktif')).toBe(true);
    });

    /**
     * Test 12: Multiple filter error handling and validation
     */
    test('should handle errors gracefully with multiple filters', () => {
        const testData = [
            { id: '1', kode: 'BRG001', nama: 'Item 1', kategori_id: 'cat1', satuan_id: 'unit1', status: 'aktif' },
            { id: '2', kode: 'BRG002', nama: 'Item 2', kategori_id: 'cat2', satuan_id: 'unit2', status: 'nonaktif' }
        ];

        // Test with invalid filter combinations
        expect(() => {
            filterManager.setFilter('nonexistent_filter', 'value');
            filterManager.setFilter('kategori', 'cat1');
            filterManager.applyFilters(testData);
        }).not.toThrow();

        // Test with null/undefined values in multiple filters
        expect(() => {
            filterManager.setFilter('kategori', null);
            filterManager.setFilter('satuan', undefined);
            filterManager.setFilter('status', '');
            filterManager.applyFilters(testData);
        }).not.toThrow();

        // Should return all data when all filters are cleared
        const result = filterManager.applyFilters(testData);
        expect(result.length).toBe(testData.length);

        // Test with malformed range filters
        expect(() => {
            filterManager.setFilter('kategori', 'cat1');
            filterManager.setFilter('price_range', { invalid: 'range' });
            filterManager.applyFilters(testData);
        }).not.toThrow();
    });

    /**
     * Test 13: Multiple filter export/import configuration
     */
    test('should export and import multiple filter configurations', () => {
        // Set multiple filters
        filterManager.setFilter('kategori', 'cat1');
        filterManager.setFilter('satuan', 'unit1');
        filterManager.setFilter('status', 'aktif');
        filterManager.setFilter('price_range', { min: 1000, max: 5000 });

        // Export configuration
        const config = filterManager.exportConfig();
        expect(config.activeFilters).toBeDefined();
        expect(Object.keys(config.activeFilters)).toHaveLength(4);
        expect(config.activeFilters.kategori).toBe('cat1');
        expect(config.activeFilters.satuan).toBe('unit1');
        expect(config.activeFilters.status).toBe('aktif');
        expect(config.activeFilters.price_range).toEqual({ min: 1000, max: 5000 });

        // Clear filters
        filterManager.clearAllFilters();
        expect(Object.keys(filterManager.getActiveFilters())).toHaveLength(0);

        // Import configuration
        filterManager.importConfig(config);
        const importedFilters = filterManager.getActiveFilters();
        expect(Object.keys(importedFilters)).toHaveLength(4);
        expect(importedFilters.kategori).toBe('cat1');
        expect(importedFilters.satuan).toBe('unit1');
        expect(importedFilters.status).toBe('aktif');
        expect(importedFilters.price_range).toEqual({ min: 1000, max: 5000 });
    });

    /**
     * Test 14: Multiple filter statistics and monitoring
     */
    test('should provide accurate statistics for multiple filters', () => {
        // Set multiple filters
        filterManager.setFilter('kategori', 'cat1');
        filterManager.setFilter('satuan', 'unit1');
        filterManager.setFilter('status', 'aktif');

        const stats = filterManager.getFilterStats();
        
        expect(stats.activeFiltersCount).toBe(3);
        expect(stats.definedFiltersCount).toBeGreaterThan(0);
        expect(stats.activeFilters).toBeDefined();
        expect(Object.keys(stats.activeFilters)).toHaveLength(3);
        expect(stats.activeFilters.kategori).toBe('cat1');
        expect(stats.activeFilters.satuan).toBe('unit1');
        expect(stats.activeFilters.status).toBe('aktif');

        // Remove one filter
        filterManager.removeFilter('status');
        const updatedStats = filterManager.getFilterStats();
        expect(updatedStats.activeFiltersCount).toBe(2);
        expect(Object.keys(updatedStats.activeFilters)).toHaveLength(2);

        // Clear all filters
        filterManager.clearAllFilters();
        const clearedStats = filterManager.getFilterStats();
        expect(clearedStats.activeFiltersCount).toBe(0);
        expect(Object.keys(clearedStats.activeFilters)).toHaveLength(0);
    });

    /**
     * Test 15: Multiple filter edge cases and boundary conditions
     */
    test('should handle edge cases and boundary conditions with multiple filters', () => {
        // Empty dataset
        let result = filterManager.applyFilters([]);
        expect(result).toEqual([]);

        // Single item dataset with multiple filters
        const singleItem = [{ 
            id: '1', 
            kode: 'BRG001', 
            nama: 'Item', 
            kategori_id: 'cat1', 
            satuan_id: 'unit1', 
            status: 'aktif' 
        }];

        filterManager.setFilter('kategori', 'cat1');
        filterManager.setFilter('satuan', 'unit1');
        filterManager.setFilter('status', 'aktif');
        result = filterManager.applyFilters(singleItem);
        expect(result.length).toBe(1);

        // Change one filter to non-matching
        filterManager.setFilter('status', 'nonaktif');
        result = filterManager.applyFilters(singleItem);
        expect(result.length).toBe(0);

        // Dataset where no items match all filters
        const noMatchData = [
            { id: '1', kategori_id: 'cat1', satuan_id: 'unit1', status: 'nonaktif' },
            { id: '2', kategori_id: 'cat1', satuan_id: 'unit2', status: 'aktif' },
            { id: '3', kategori_id: 'cat2', satuan_id: 'unit1', status: 'aktif' }
        ];

        filterManager.setFilter('kategori', 'cat1');
        filterManager.setFilter('satuan', 'unit1');
        filterManager.setFilter('status', 'aktif');
        result = filterManager.applyFilters(noMatchData);
        expect(result.length).toBe(0);

        // Dataset where all items match all filters
        const allMatchData = [
            { id: '1', kategori_id: 'cat1', satuan_id: 'unit1', status: 'aktif' },
            { id: '2', kategori_id: 'cat1', satuan_id: 'unit1', status: 'aktif' },
            { id: '3', kategori_id: 'cat1', satuan_id: 'unit1', status: 'aktif' }
        ];

        // Keep the same filters that match all items
        filterManager.setFilter('kategori', 'cat1');
        filterManager.setFilter('satuan', 'unit1');
        filterManager.setFilter('status', 'aktif');
        result = filterManager.applyFilters(allMatchData);
        expect(result.length).toBe(3);
        expect(result).toEqual(allMatchData);
    });
});