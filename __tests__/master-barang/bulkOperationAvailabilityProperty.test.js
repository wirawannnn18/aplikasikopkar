/**
 * Property-Based Test: Bulk Operation Availability
 * Feature: master-barang-komprehensif, Property 19: Bulk operation availability
 * 
 * Tests that for any multiple barang selection, the system provides 
 * appropriate bulk operation options (delete, update category, update unit).
 */

import { BulkOperationsManager } from '../../js/master-barang/BulkOperationsManager.js';

describe('Property Test: Bulk Operation Availability', () => {
    let bulkOperationsManager;

    beforeEach(() => {
        bulkOperationsManager = new BulkOperationsManager();
        
        // Mock DOM methods
        global.document = {
            createElement: () => ({
                id: '',
                className: '',
                innerHTML: '',
                style: {},
                addEventListener: () => {},
                insertAdjacentElement: () => {},
                insertAdjacentHTML: () => {},
                appendChild: () => {},
                querySelector: () => null,
                querySelectorAll: () => []
            }),
            body: {
                insertAdjacentHTML: () => {}
            },
            getElementById: () => ({
                textContent: '',
                innerHTML: '',
                value: '',
                checked: false,
                classList: {
                    add: () => {},
                    remove: () => {},
                    contains: () => false
                },
                addEventListener: () => {}
            }),
            querySelector: () => null,
            querySelectorAll: () => [],
            addEventListener: () => {}
        };

        global.bootstrap = {
            Modal: function() {
                return {
                    show: () => {},
                    hide: () => {},
                    getInstance: () => ({
                        hide: () => {}
                    })
                };
            }
        };

        global.localStorage = {
            getItem: () => '[]',
            setItem: () => {}
        };
    });

    afterEach(() => {
        // Reset state
        bulkOperationsManager.selectedItems.clear();
    });

    /**
     * Property 19: Bulk operation availability
     * For any multiple barang selection, the system should provide 
     * appropriate bulk operation options (delete, update category, update unit)
     */
    test('should provide bulk operations when items are selected', () => {
        // Test with different selection sizes
        const selectionSizes = [1, 2, 5, 10, 50];

        selectionSizes.forEach(size => {
            // Clear previous selection
            bulkOperationsManager.selectedItems.clear();

            // Add items to selection
            for (let i = 0; i < size; i++) {
                bulkOperationsManager.selectedItems.add(`item-${i}`);
            }

            // Check if bulk operations are available
            const isAvailable = bulkOperationsManager.isBulkOperationAvailable();
            expect(isAvailable).toBe(true);

            // Get available options
            const options = bulkOperationsManager.getBulkOperationOptions();
            
            // Should have bulk operation options
            expect(options.length).toBeGreaterThan(0);
            
            // Should include required operations
            const optionIds = options.map(opt => opt.id);
            expect(optionIds).toContain('bulk_delete');
            expect(optionIds).toContain('bulk_update_category');
            expect(optionIds).toContain('bulk_update_unit');

            // Each option should have required properties
            options.forEach(option => {
                expect(option).toHaveProperty('id');
                expect(option).toHaveProperty('label');
                expect(option).toHaveProperty('icon');
                expect(option).toHaveProperty('class');
                expect(option).toHaveProperty('available');
                
                expect(typeof option.id).toBe('string');
                expect(typeof option.label).toBe('string');
                expect(typeof option.icon).toBe('string');
                expect(typeof option.class).toBe('string');
                expect(typeof option.available).toBe('boolean');
                
                expect(option.id).toBeTruthy();
                expect(option.label).toBeTruthy();
                expect(option.icon).toBeTruthy();
                expect(option.class).toBeTruthy();
            });
        });
    });

    test('should not provide bulk operations when no items are selected', () => {
        // Ensure no items are selected
        bulkOperationsManager.selectedItems.clear();

        // Check if bulk operations are available
        const isAvailable = bulkOperationsManager.isBulkOperationAvailable();
        expect(isAvailable).toBe(false);

        // Get available options
        const options = bulkOperationsManager.getBulkOperationOptions();
        
        // Should have no options when nothing is selected
        expect(options.length).toBe(0);
    });

    test('should handle selection changes correctly', () => {
        const testItems = ['item1', 'item2', 'item3', 'item4', 'item5'];

        // Test adding items one by one
        testItems.forEach((itemId, index) => {
            bulkOperationsManager.selectedItems.add(itemId);
            
            const isAvailable = bulkOperationsManager.isBulkOperationAvailable();
            const options = bulkOperationsManager.getBulkOperationOptions();
            
            expect(isAvailable).toBe(true);
            expect(options.length).toBeGreaterThan(0);
            expect(bulkOperationsManager.selectedItems.size).toBe(index + 1);
        });

        // Test removing items one by one
        testItems.forEach((itemId, index) => {
            bulkOperationsManager.selectedItems.delete(itemId);
            
            const remainingCount = testItems.length - index - 1;
            const isAvailable = bulkOperationsManager.isBulkOperationAvailable();
            const options = bulkOperationsManager.getBulkOperationOptions();
            
            if (remainingCount > 0) {
                expect(isAvailable).toBe(true);
                expect(options.length).toBeGreaterThan(0);
            } else {
                expect(isAvailable).toBe(false);
                expect(options.length).toBe(0);
            }
            
            expect(bulkOperationsManager.selectedItems.size).toBe(remainingCount);
        });
    });

    test('should provide consistent bulk operation options regardless of selection content', () => {
        const testSelections = [
            ['barang1'],
            ['barang1', 'barang2'],
            ['item-a', 'item-b', 'item-c'],
            Array.from({length: 10}, (_, i) => `bulk-item-${i}`),
            Array.from({length: 100}, (_, i) => `large-set-${i}`)
        ];

        testSelections.forEach(selection => {
            // Clear and set new selection
            bulkOperationsManager.selectedItems.clear();
            selection.forEach(item => bulkOperationsManager.selectedItems.add(item));

            const options = bulkOperationsManager.getBulkOperationOptions();
            
            // Should always have the same set of operations available
            expect(options.length).toBe(3); // delete, update category, update unit
            
            const optionIds = options.map(opt => opt.id).sort();
            expect(optionIds).toEqual(['bulk_delete', 'bulk_update_category', 'bulk_update_unit']);
            
            // All options should be available
            options.forEach(option => {
                expect(option.available).toBe(true);
            });
        });
    });

    test('should handle edge cases in selection management', () => {
        // Test with duplicate additions
        bulkOperationsManager.selectedItems.add('item1');
        bulkOperationsManager.selectedItems.add('item1'); // duplicate
        expect(bulkOperationsManager.selectedItems.size).toBe(1);
        expect(bulkOperationsManager.isBulkOperationAvailable()).toBe(true);

        // Test with non-existent item removal
        bulkOperationsManager.selectedItems.delete('non-existent');
        expect(bulkOperationsManager.selectedItems.size).toBe(1);
        expect(bulkOperationsManager.isBulkOperationAvailable()).toBe(true);

        // Test clearing selection
        bulkOperationsManager.selectedItems.clear();
        expect(bulkOperationsManager.selectedItems.size).toBe(0);
        expect(bulkOperationsManager.isBulkOperationAvailable()).toBe(false);
    });

    test('should provide correct operation metadata', () => {
        // Add some items to selection
        bulkOperationsManager.selectedItems.add('test1');
        bulkOperationsManager.selectedItems.add('test2');

        const options = bulkOperationsManager.getBulkOperationOptions();
        
        // Check delete operation
        const deleteOp = options.find(op => op.id === 'bulk_delete');
        expect(deleteOp).toBeDefined();
        expect(deleteOp.label).toContain('Hapus');
        expect(deleteOp.icon).toContain('trash');
        expect(deleteOp.class).toContain('danger');

        // Check update category operation
        const updateCategoryOp = options.find(op => op.id === 'bulk_update_category');
        expect(updateCategoryOp).toBeDefined();
        expect(updateCategoryOp.label).toContain('Kategori');
        expect(updateCategoryOp.class).toContain('warning');

        // Check update unit operation
        const updateUnitOp = options.find(op => op.id === 'bulk_update_unit');
        expect(updateUnitOp).toBeDefined();
        expect(updateUnitOp.label).toContain('Satuan');
        expect(updateUnitOp.class).toContain('warning');
    });

    test('should maintain selection state consistency', () => {
        const items = ['a', 'b', 'c', 'd', 'e'];
        
        // Add items in different orders
        const addOrder1 = [0, 2, 4, 1, 3];
        const addOrder2 = [4, 3, 2, 1, 0];
        
        // Test first order
        bulkOperationsManager.selectedItems.clear();
        addOrder1.forEach(index => {
            bulkOperationsManager.selectedItems.add(items[index]);
        });
        
        const options1 = bulkOperationsManager.getBulkOperationOptions();
        expect(options1.length).toBe(3);
        expect(bulkOperationsManager.selectedItems.size).toBe(5);
        
        // Test second order
        bulkOperationsManager.selectedItems.clear();
        addOrder2.forEach(index => {
            bulkOperationsManager.selectedItems.add(items[index]);
        });
        
        const options2 = bulkOperationsManager.getBulkOperationOptions();
        expect(options2.length).toBe(3);
        expect(bulkOperationsManager.selectedItems.size).toBe(5);
        
        // Options should be identical regardless of selection order
        expect(options1.map(o => o.id).sort()).toEqual(options2.map(o => o.id).sort());
    });
});