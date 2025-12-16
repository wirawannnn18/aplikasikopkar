/**
 * Property Test: Category Filter Accuracy (Property 13)
 * Validates Requirements 4.3: Category filter functionality
 * 
 * Property: For any selected category filter, the system should display 
 * only barang items that belong to that category
 */

import fc from 'fast-check';
import { FilterManager } from '../../js/master-barang/FilterManager.js';
import { KategoriManager } from '../../js/master-barang/KategoriManager.js';
import { BarangManager } from '../../js/master-barang/BarangManager.js';

describe('Property 13: Category Filter Accuracy', () => {
    let filterManager;
    let kategoriManager;
    let barangManager;

    beforeEach(() => {
        // Clear localStorage
        localStorage.clear();
        
        // Initialize managers
        filterManager = new FilterManager();
        kategoriManager = new KategoriManager();
        barangManager = new BarangManager();
    });

    afterEach(() => {
        localStorage.clear();
    });

    /**
     * Test 1: Category filter returns only items from selected category
     */
    test('should return only barang items from selected category', () => {
        fc.assert(fc.property(
            // Generate categories
            fc.array(fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                nama: fc.string({ minLength: 3, maxLength: 20 }),
                status: fc.constantFrom('aktif', 'nonaktif')
            }), { minLength: 2, maxLength: 5 }),
            
            // Generate barang items
            fc.array(fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                kode: fc.string({ minLength: 3, maxLength: 10 }),
                nama: fc.string({ minLength: 3, maxLength: 30 }),
                kategori_id: fc.string({ minLength: 1, maxLength: 10 }),
                kategori_nama: fc.string({ minLength: 3, maxLength: 20 }),
                status: fc.constantFrom('aktif', 'nonaktif')
            }), { minLength: 5, maxLength: 20 }),
            
            (categories, barangItems) => {
                // Ensure we have valid categories
                const validCategories = categories.filter((cat, index, arr) => 
                    arr.findIndex(c => c.id === cat.id) === index
                );
                
                if (validCategories.length === 0) return;

                // Map barang items to existing categories
                const mappedBarang = barangItems.map((item, index) => ({
                    ...item,
                    id: `barang_${index}`,
                    kode: `BRG${index.toString().padStart(3, '0')}`,
                    kategori_id: validCategories[index % validCategories.length].id,
                    kategori_nama: validCategories[index % validCategories.length].nama
                }));

                // Select a random category to filter by
                const selectedCategory = validCategories[0];
                
                // Apply category filter
                filterManager.setFilter('kategori', selectedCategory.id);
                const filteredData = filterManager.applyFilters(mappedBarang);

                // Verify all returned items belong to selected category
                filteredData.forEach(item => {
                    expect(item.kategori_id).toBe(selectedCategory.id);
                });

                // Verify we get the expected count
                const expectedCount = mappedBarang.filter(item => 
                    item.kategori_id === selectedCategory.id
                ).length;
                expect(filteredData.length).toBe(expectedCount);
            }
        ), { numRuns: 50 });
    });

    /**
     * Test 2: Empty category filter returns all items
     */
    test('should return all items when no category filter is applied', () => {
        fc.assert(fc.property(
            fc.array(fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                kode: fc.string({ minLength: 3, maxLength: 10 }),
                nama: fc.string({ minLength: 3, maxLength: 30 }),
                kategori_id: fc.string({ minLength: 1, maxLength: 10 }),
                kategori_nama: fc.string({ minLength: 3, maxLength: 20 }),
                status: fc.constantFrom('aktif', 'nonaktif')
            }), { minLength: 1, maxLength: 15 }),
            
            (barangItems) => {
                // Ensure no category filter is set
                filterManager.clearAllFilters();
                
                const filteredData = filterManager.applyFilters(barangItems);
                
                // Should return all items
                expect(filteredData.length).toBe(barangItems.length);
                expect(filteredData).toEqual(barangItems);
            }
        ), { numRuns: 30 });
    });

    /**
     * Test 3: Invalid category filter returns empty results
     */
    test('should return empty results for non-existent category', () => {
        fc.assert(fc.property(
            fc.array(fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                kode: fc.string({ minLength: 3, maxLength: 10 }),
                nama: fc.string({ minLength: 3, maxLength: 30 }),
                kategori_id: fc.string({ minLength: 1, maxLength: 10 }),
                kategori_nama: fc.string({ minLength: 3, maxLength: 20 }),
                status: fc.constantFrom('aktif', 'nonaktif')
            }), { minLength: 1, maxLength: 15 }),
            fc.string({ minLength: 15, maxLength: 25 }), // Non-existent category ID
            
            (barangItems, nonExistentCategoryId) => {
                // Ensure the category ID doesn't exist in data
                const categoryExists = barangItems.some(item => 
                    item.kategori_id === nonExistentCategoryId
                );
                
                if (categoryExists) return; // Skip if category exists
                
                // Apply non-existent category filter
                filterManager.setFilter('kategori', nonExistentCategoryId);
                const filteredData = filterManager.applyFilters(barangItems);
                
                // Should return empty results
                expect(filteredData.length).toBe(0);
            }
        ), { numRuns: 30 });
    });

    /**
     * Test 4: Category filter with null/undefined values
     */
    test('should handle null/undefined category values correctly', () => {
        fc.assert(fc.property(
            fc.array(fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                kode: fc.string({ minLength: 3, maxLength: 10 }),
                nama: fc.string({ minLength: 3, maxLength: 30 }),
                kategori_id: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: null }),
                kategori_nama: fc.option(fc.string({ minLength: 3, maxLength: 20 }), { nil: null }),
                status: fc.constantFrom('aktif', 'nonaktif')
            }), { minLength: 5, maxLength: 15 }),
            fc.string({ minLength: 1, maxLength: 10 }),
            
            (barangItems, categoryId) => {
                // Apply category filter
                filterManager.setFilter('kategori', categoryId);
                const filteredData = filterManager.applyFilters(barangItems);
                
                // All returned items should have matching category_id
                filteredData.forEach(item => {
                    expect(item.kategori_id).toBe(categoryId);
                });
                
                // Items with null/undefined category_id should not be included
                const expectedItems = barangItems.filter(item => 
                    item.kategori_id === categoryId
                );
                expect(filteredData.length).toBe(expectedItems.length);
            }
        ), { numRuns: 40 });
    });

    /**
     * Test 5: Category filter consistency across multiple applications
     */
    test('should return consistent results when applied multiple times', () => {
        fc.assert(fc.property(
            fc.array(fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                kode: fc.string({ minLength: 3, maxLength: 10 }),
                nama: fc.string({ minLength: 3, maxLength: 30 }),
                kategori_id: fc.string({ minLength: 1, maxLength: 5 }),
                kategori_nama: fc.string({ minLength: 3, maxLength: 20 }),
                status: fc.constantFrom('aktif', 'nonaktif')
            }), { minLength: 3, maxLength: 12 }),
            fc.string({ minLength: 1, maxLength: 5 }),
            
            (barangItems, categoryId) => {
                // Apply filter multiple times
                filterManager.setFilter('kategori', categoryId);
                const result1 = filterManager.applyFilters(barangItems);
                
                filterManager.setFilter('kategori', categoryId);
                const result2 = filterManager.applyFilters(barangItems);
                
                filterManager.setFilter('kategori', categoryId);
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
     * Test 6: Category filter with case sensitivity
     */
    test('should handle category filter with exact matching', () => {
        fc.assert(fc.property(
            fc.array(fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                kode: fc.string({ minLength: 3, maxLength: 10 }),
                nama: fc.string({ minLength: 3, maxLength: 30 }),
                kategori_id: fc.string({ minLength: 1, maxLength: 10 }),
                kategori_nama: fc.string({ minLength: 3, maxLength: 20 }),
                status: fc.constantFrom('aktif', 'nonaktif')
            }), { minLength: 3, maxLength: 12 }),
            
            (barangItems) => {
                if (barangItems.length === 0) return;
                
                const targetItem = barangItems[0];
                const exactCategoryId = targetItem.kategori_id;
                const modifiedCategoryId = exactCategoryId.toUpperCase();
                
                // Test exact match
                filterManager.setFilter('kategori', exactCategoryId);
                const exactResults = filterManager.applyFilters(barangItems);
                
                // Test case-different match (should not match if different case)
                filterManager.setFilter('kategori', modifiedCategoryId);
                const caseResults = filterManager.applyFilters(barangItems);
                
                // Exact match should include the target item
                const exactMatch = exactResults.some(item => 
                    item.kategori_id === exactCategoryId
                );
                expect(exactMatch).toBe(true);
                
                // Case-different should only match if there's an exact case match
                const caseMatch = caseResults.some(item => 
                    item.kategori_id === modifiedCategoryId
                );
                const hasCaseMatch = barangItems.some(item => 
                    item.kategori_id === modifiedCategoryId
                );
                expect(caseMatch).toBe(hasCaseMatch);
            }
        ), { numRuns: 25 });
    });

    /**
     * Test 7: Category filter performance with large datasets
     */
    test('should maintain performance with large datasets', () => {
        const largeDataset = Array.from({ length: 1000 }, (_, index) => ({
            id: `item_${index}`,
            kode: `BRG${index.toString().padStart(4, '0')}`,
            nama: `Barang ${index}`,
            kategori_id: `cat_${index % 10}`, // 10 different categories
            kategori_nama: `Kategori ${index % 10}`,
            status: index % 2 === 0 ? 'aktif' : 'nonaktif'
        }));

        const startTime = performance.now();
        
        // Apply category filter
        filterManager.setFilter('kategori', 'cat_5');
        const filteredData = filterManager.applyFilters(largeDataset);
        
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        
        // Should complete within reasonable time (100ms)
        expect(executionTime).toBeLessThan(100);
        
        // Should return correct results
        expect(filteredData.length).toBe(100); // 1000 / 10 categories
        filteredData.forEach(item => {
            expect(item.kategori_id).toBe('cat_5');
        });
    });

    /**
     * Test 8: Category filter with special characters
     */
    test('should handle category IDs with special characters', () => {
        fc.assert(fc.property(
            fc.array(fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                kode: fc.string({ minLength: 3, maxLength: 10 }),
                nama: fc.string({ minLength: 3, maxLength: 30 }),
                kategori_id: fc.string({ minLength: 1, maxLength: 15 }),
                kategori_nama: fc.string({ minLength: 3, maxLength: 20 }),
                status: fc.constantFrom('aktif', 'nonaktif')
            }), { minLength: 2, maxLength: 10 }),
            
            (barangItems) => {
                if (barangItems.length === 0) return;
                
                // Create items with special character category IDs
                const specialItems = barangItems.map((item, index) => ({
                    ...item,
                    kategori_id: `cat-${index}_special!@#`,
                    kategori_nama: `Category ${index} Special`
                }));
                
                const targetCategoryId = specialItems[0].kategori_id;
                
                // Apply filter with special characters
                filterManager.setFilter('kategori', targetCategoryId);
                const filteredData = filterManager.applyFilters(specialItems);
                
                // Should handle special characters correctly
                filteredData.forEach(item => {
                    expect(item.kategori_id).toBe(targetCategoryId);
                });
                
                const expectedCount = specialItems.filter(item => 
                    item.kategori_id === targetCategoryId
                ).length;
                expect(filteredData.length).toBe(expectedCount);
            }
        ), { numRuns: 20 });
    });

    /**
     * Test 9: Category filter state management
     */
    test('should properly manage filter state', () => {
        const testData = [
            { id: '1', kode: 'BRG001', nama: 'Item 1', kategori_id: 'cat1', kategori_nama: 'Category 1', status: 'aktif' },
            { id: '2', kode: 'BRG002', nama: 'Item 2', kategori_id: 'cat2', kategori_nama: 'Category 2', status: 'aktif' },
            { id: '3', kode: 'BRG003', nama: 'Item 3', kategori_id: 'cat1', kategori_nama: 'Category 1', status: 'aktif' }
        ];

        // Initially no filter
        expect(filterManager.getFilter('kategori')).toBeUndefined();
        let result = filterManager.applyFilters(testData);
        expect(result.length).toBe(3);

        // Set category filter
        filterManager.setFilter('kategori', 'cat1');
        expect(filterManager.getFilter('kategori')).toBe('cat1');
        result = filterManager.applyFilters(testData);
        expect(result.length).toBe(2);

        // Change category filter
        filterManager.setFilter('kategori', 'cat2');
        expect(filterManager.getFilter('kategori')).toBe('cat2');
        result = filterManager.applyFilters(testData);
        expect(result.length).toBe(1);

        // Remove category filter
        filterManager.removeFilter('kategori');
        expect(filterManager.getFilter('kategori')).toBeUndefined();
        result = filterManager.applyFilters(testData);
        expect(result.length).toBe(3);
    });

    /**
     * Test 10: Category filter integration with other components
     */
    test('should integrate properly with other system components', () => {
        // Create test categories
        const categories = [
            { id: 'cat1', nama: 'Elektronik', status: 'aktif' },
            { id: 'cat2', nama: 'Makanan', status: 'aktif' },
            { id: 'cat3', nama: 'Pakaian', status: 'nonaktif' }
        ];

        // Save categories to localStorage
        categories.forEach(cat => {
            kategoriManager.create(cat);
        });

        // Create test barang
        const barangItems = [
            { kode: 'BRG001', nama: 'Laptop', kategori_id: 'cat1', kategori_nama: 'Elektronik', status: 'aktif' },
            { kode: 'BRG002', nama: 'Roti', kategori_id: 'cat2', kategori_nama: 'Makanan', status: 'aktif' },
            { kode: 'BRG003', nama: 'Baju', kategori_id: 'cat3', kategori_nama: 'Pakaian', status: 'aktif' }
        ];

        // Save barang to localStorage
        barangItems.forEach(item => {
            barangManager.create(item);
        });

        // Test filter with existing categories
        filterManager.setFilter('kategori', 'cat1');
        const filteredData = filterManager.applyFilters(barangItems);
        
        expect(filteredData.length).toBe(1);
        expect(filteredData[0].kategori_id).toBe('cat1');
        expect(filteredData[0].kategori_nama).toBe('Elektronik');

        // Verify filter options can be generated
        const filterOptions = filterManager.getFilterOptions('kategori', barangItems);
        expect(filterOptions.length).toBeGreaterThan(0);
        
        // Verify filter summary
        const summary = filterManager.getFilterSummary();
        expect(summary.length).toBe(1);
        expect(summary[0].name).toBe('kategori');
        expect(summary[0].value).toBe('cat1');
    });
});