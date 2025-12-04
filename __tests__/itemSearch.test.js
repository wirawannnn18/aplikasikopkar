/**
 * Property-Based Tests for Item Search Functionality
 * Using fast-check for property-based testing
 */

import fc from 'fast-check';

// Mock localStorage for testing
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock getCurrentUser function
global.getCurrentUser = jest.fn(() => ({ id: 'test-user' }));

// Import modules to test
import '../js/itemSearch.js';

describe('Item Search Property-Based Tests', () => {
    let itemSearchService;
    let searchHistory;
    let searchLogger;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        localStorageMock.getItem.mockReturnValue('[]');
        
        // Get global instances
        itemSearchService = global.itemSearchService;
        searchHistory = global.searchHistory;
        searchLogger = global.searchLogger;
    });

    describe('Property 1: Search matching behavior', () => {
        /**
         * Feature: pencarian-barang-pembelian, Property 1: Search matching behavior
         * For any search query and inventory data, all returned results should contain 
         * the search term (case-insensitive, partial matching) and match any specified category filter
         * Validates: Requirements 1.1, 2.1, 2.2, 5.1, 5.2, 5.3, 5.4, 5.5
         */
        test('should return results containing search term (case-insensitive, partial matching)', async () => {
            await fc.assert(fc.asyncProperty(
                fc.array(fc.record({
                    id: fc.string({ minLength: 1 }),
                    code: fc.string({ minLength: 1 }),
                    name: fc.string({ minLength: 1 }),
                    category: fc.string({ minLength: 1 }),
                    currentStock: fc.nat(),
                    unitPrice: fc.nat()
                }), { minLength: 1, maxLength: 50 }),
                fc.string({ minLength: 2, maxLength: 10 }),
                fc.option(fc.string(), { nil: 'all' }),
                async (inventory, searchTerm, categoryFilter) => {
                    // Setup mock inventory
                    localStorageMock.getItem.mockReturnValue(JSON.stringify(inventory));
                    
                    const query = {
                        term: searchTerm,
                        categoryId: categoryFilter,
                        caseSensitive: false
                    };
                    
                    const results = await itemSearchService.searchItems(query);
                    
                    // All results should contain search term in name or code (case-insensitive)
                    results.forEach(result => {
                        const nameMatch = result.name.toLowerCase().includes(searchTerm.toLowerCase());
                        const codeMatch = result.code.toLowerCase().includes(searchTerm.toLowerCase());
                        expect(nameMatch || codeMatch).toBe(true);
                        
                        // If category filter is specified, result should match category
                        if (categoryFilter && categoryFilter !== 'all') {
                            expect(result.category).toBe(categoryFilter);
                        }
                    });
                }
            ), { numRuns: 100 });
        });

        test('should handle special characters gracefully', async () => {
            await fc.assert(fc.asyncProperty(
                fc.array(fc.record({
                    id: fc.string({ minLength: 1 }),
                    code: fc.string({ minLength: 1 }),
                    name: fc.string({ minLength: 1 }),
                    category: fc.string({ minLength: 1 }),
                    currentStock: fc.nat(),
                    unitPrice: fc.nat()
                }), { minLength: 1, maxLength: 20 }),
                fc.string({ minLength: 2, maxLength: 10 }).filter(s => /[!@#$%^&*(),.?":{}|<>]/.test(s)),
                async (inventory, searchTermWithSpecialChars) => {
                    localStorageMock.getItem.mockReturnValue(JSON.stringify(inventory));
                    
                    const query = {
                        term: searchTermWithSpecialChars,
                        caseSensitive: false
                    };
                    
                    // Should not throw error
                    const results = await itemSearchService.searchItems(query);
                    expect(Array.isArray(results)).toBe(true);
                }
            ), { numRuns: 50 });
        });
    });

    describe('Property 2: Search result structure completeness', () => {
        /**
         * Feature: pencarian-barang-pembelian, Property 2: Search result structure completeness
         * For any search result, the result should contain all required fields 
         * (id, code, name, category, currentStock, unitPrice) with appropriate handling for missing data
         * Validates: Requirements 1.2, 4.1, 4.5
         */
        test('should return results with complete structure', async () => {
            await fc.assert(fc.asyncProperty(
                fc.array(fc.record({
                    id: fc.option(fc.string(), { nil: undefined }),
                    code: fc.option(fc.string(), { nil: undefined }),
                    name: fc.option(fc.string(), { nil: undefined }),
                    category: fc.option(fc.string(), { nil: undefined }),
                    currentStock: fc.option(fc.nat(), { nil: undefined }),
                    unitPrice: fc.option(fc.nat(), { nil: undefined })
                }), { minLength: 1, maxLength: 20 }),
                fc.string({ minLength: 2, maxLength: 5 }),
                async (inventoryWithMissingFields, searchTerm) => {
                    localStorageMock.getItem.mockReturnValue(JSON.stringify(inventoryWithMissingFields));
                    
                    const query = { term: searchTerm };
                    const results = await itemSearchService.searchItems(query);
                    
                    results.forEach(result => {
                        // All required fields should be present
                        expect(result).toHaveProperty('id');
                        expect(result).toHaveProperty('code');
                        expect(result).toHaveProperty('name');
                        expect(result).toHaveProperty('category');
                        expect(result).toHaveProperty('currentStock');
                        expect(result).toHaveProperty('unitPrice');
                        expect(result).toHaveProperty('isLowStock');
                        expect(result).toHaveProperty('isOutOfStock');
                        
                        // Fields should have default values for missing data
                        expect(typeof result.id).toBe('string');
                        expect(typeof result.code).toBe('string');
                        expect(typeof result.name).toBe('string');
                        expect(typeof result.category).toBe('string');
                        expect(typeof result.currentStock).toBe('number');
                        expect(typeof result.unitPrice).toBe('number');
                    });
                }
            ), { numRuns: 100 });
        });
    });

    describe('Property 3: Search result limiting', () => {
        /**
         * Feature: pencarian-barang-pembelian, Property 3: Search result limiting
         * For any search query, the number of returned results should not exceed 
         * the specified maximum limit (default 10)
         * Validates: Requirements 3.2
         */
        test('should limit results to maximum specified', async () => {
            await fc.assert(fc.asyncProperty(
                fc.array(fc.record({
                    id: fc.string({ minLength: 1 }),
                    code: fc.string({ minLength: 1 }),
                    name: fc.constant('test item'), // All items match search
                    category: fc.string({ minLength: 1 }),
                    currentStock: fc.nat(),
                    unitPrice: fc.nat()
                }), { minLength: 15, maxLength: 100 }), // More items than limit
                fc.integer({ min: 1, max: 20 }),
                async (largeInventory, maxResults) => {
                    localStorageMock.getItem.mockReturnValue(JSON.stringify(largeInventory));
                    
                    const query = {
                        term: 'test',
                        maxResults: maxResults
                    };
                    
                    const results = await itemSearchService.searchItems(query);
                    expect(results.length).toBeLessThanOrEqual(maxResults);
                }
            ), { numRuns: 100 });
        });
    });

    describe('Property 4: Minimum character threshold', () => {
        /**
         * Feature: pencarian-barang-pembelian, Property 4: Minimum character threshold
         * For any search input with less than 2 characters, the system should not display suggestions
         * Validates: Requirements 3.1
         */
        test('should return empty results for search terms below minimum length', async () => {
            await fc.assert(fc.asyncProperty(
                fc.array(fc.record({
                    id: fc.string({ minLength: 1 }),
                    code: fc.string({ minLength: 1 }),
                    name: fc.string({ minLength: 1 }),
                    category: fc.string({ minLength: 1 }),
                    currentStock: fc.nat(),
                    unitPrice: fc.nat()
                }), { minLength: 1, maxLength: 20 }),
                fc.string({ minLength: 0, maxLength: 1 }),
                async (inventory, shortSearchTerm) => {
                    localStorageMock.getItem.mockReturnValue(JSON.stringify(inventory));
                    
                    const query = { term: shortSearchTerm };
                    const results = await itemSearchService.searchItems(query);
                    
                    expect(results).toEqual([]);
                }
            ), { numRuns: 100 });
        });
    });

    describe('Property 7: Low stock indicator', () => {
        /**
         * Feature: pencarian-barang-pembelian, Property 7: Low stock indicator
         * For any item with stock below the defined threshold, the search result 
         * should display a low stock warning indicator
         * Validates: Requirements 4.2
         */
        test('should correctly identify low stock and out of stock items', async () => {
            await fc.assert(fc.asyncProperty(
                fc.array(fc.record({
                    id: fc.string({ minLength: 1 }),
                    code: fc.string({ minLength: 1 }),
                    name: fc.string({ minLength: 1 }),
                    category: fc.string({ minLength: 1 }),
                    currentStock: fc.nat({ max: 50 }),
                    unitPrice: fc.nat()
                }), { minLength: 1, maxLength: 20 }),
                fc.string({ minLength: 2, maxLength: 5 }),
                async (inventory, searchTerm) => {
                    localStorageMock.getItem.mockReturnValue(JSON.stringify(inventory));
                    
                    const query = { term: searchTerm };
                    const results = await itemSearchService.searchItems(query);
                    
                    results.forEach(result => {
                        // Check stock indicators are correctly set
                        if (result.currentStock <= 0) {
                            expect(result.isOutOfStock).toBe(true);
                            expect(result.isLowStock).toBe(false);
                        } else if (result.currentStock <= 10) { // Low stock threshold
                            expect(result.isLowStock).toBe(true);
                            expect(result.isOutOfStock).toBe(false);
                        } else {
                            expect(result.isLowStock).toBe(false);
                            expect(result.isOutOfStock).toBe(false);
                        }
                    });
                }
            ), { numRuns: 100 });
        });
    });

    describe('Property 9: Search history management', () => {
        /**
         * Feature: pencarian-barang-pembelian, Property 9: Search history management
         * For any search history, when the history exceeds 10 items, the oldest entries 
         * should be automatically removed, and deleted inventory items should be removed from history
         * Validates: Requirements 9.1, 9.2, 9.3, 9.5
         */
        test('should limit history size and remove oldest entries', async () => {
            await fc.assert(fc.asyncProperty(
                fc.array(fc.record({
                    searchTerm: fc.string({ minLength: 1 }),
                    selectedItem: fc.record({
                        id: fc.string({ minLength: 1 }),
                        name: fc.string({ minLength: 1 }),
                        code: fc.string({ minLength: 1 }),
                        category: fc.string({ minLength: 1 }),
                        currentStock: fc.nat(),
                        unitPrice: fc.nat()
                    })
                }), { minLength: 12, maxLength: 20 }), // More than max history size
                async (searchEntries) => {
                    // Clear history first
                    searchHistory.clearHistory();
                    
                    // Add entries one by one
                    for (const entry of searchEntries) {
                        searchHistory.addSearch(entry.searchTerm, entry.selectedItem);
                    }
                    
                    const history = searchHistory.getRecentSearches(20); // Get more than limit
                    
                    // History should not exceed maximum size
                    expect(history.length).toBeLessThanOrEqual(10);
                }
            ), { numRuns: 50 });
        });

        test('should remove deleted items from history', async () => {
            await fc.assert(fc.asyncProperty(
                fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }),
                fc.array(fc.record({
                    searchTerm: fc.string({ minLength: 1 }),
                    selectedItem: fc.record({
                        id: fc.string({ minLength: 1 }),
                        name: fc.string({ minLength: 1 }),
                        code: fc.string({ minLength: 1 }),
                        category: fc.string({ minLength: 1 }),
                        currentStock: fc.nat(),
                        unitPrice: fc.nat()
                    })
                }), { minLength: 1, maxLength: 10 }),
                async (deletedItemIds, searchEntries) => {
                    // Setup history
                    searchHistory.clearHistory();
                    for (const entry of searchEntries) {
                        searchHistory.addSearch(entry.searchTerm, entry.selectedItem);
                    }
                    
                    // Remove deleted items
                    searchHistory.removeDeletedItems(deletedItemIds);
                    
                    const history = searchHistory.getRecentSearches(20);
                    
                    // No history entry should contain deleted item IDs
                    history.forEach(entry => {
                        if (entry.selectedItem) {
                            expect(deletedItemIds).not.toContain(entry.selectedItem.id);
                        }
                    });
                }
            ), { numRuns: 50 });
        });
    });

    describe('Property 11: Comprehensive audit logging', () => {
        /**
         * Feature: pencarian-barang-pembelian, Property 11: Comprehensive audit logging
         * For any search operation, item selection, or error, the system should log 
         * appropriate details including search terms, results count, timestamps, and user information
         * Validates: Requirements 10.1, 10.2, 10.3, 10.5
         */
        test('should log search operations with required details', async () => {
            await fc.assert(fc.asyncProperty(
                fc.array(fc.record({
                    id: fc.string({ minLength: 1 }),
                    code: fc.string({ minLength: 1 }),
                    name: fc.string({ minLength: 1 }),
                    category: fc.string({ minLength: 1 }),
                    currentStock: fc.nat(),
                    unitPrice: fc.nat()
                }), { minLength: 1, maxLength: 20 }),
                fc.string({ minLength: 2, maxLength: 10 }),
                async (inventory, searchTerm) => {
                    localStorageMock.getItem.mockReturnValue(JSON.stringify(inventory));
                    
                    const query = { term: searchTerm };
                    await itemSearchService.searchItems(query);
                    
                    // Check that audit log was called
                    expect(localStorageMock.setItem).toHaveBeenCalledWith(
                        'auditLog',
                        expect.stringContaining(searchTerm)
                    );
                }
            ), { numRuns: 50 });
        });

        test('should log item selections with required details', async () => {
            await fc.assert(fc.asyncProperty(
                fc.record({
                    id: fc.string({ minLength: 1 }),
                    name: fc.string({ minLength: 1 }),
                    code: fc.string({ minLength: 1 }),
                    category: fc.string({ minLength: 1 }),
                    currentStock: fc.nat(),
                    unitPrice: fc.nat()
                }),
                fc.string({ minLength: 1, maxLength: 10 }),
                async (item, searchTerm) => {
                    searchLogger.logItemSelection(item, searchTerm);
                    
                    // Check that audit log was called with item selection
                    expect(localStorageMock.setItem).toHaveBeenCalledWith(
                        'auditLog',
                        expect.stringContaining('item_selection')
                    );
                }
            ), { numRuns: 50 });
        });
    });

    describe('Property 12: Graceful error handling', () => {
        /**
         * Feature: pencarian-barang-pembelian, Property 12: Graceful error handling
         * For any error condition (storage full, network issues, invalid input), 
         * the system should handle the error gracefully without breaking search functionality
         * Validates: Requirements 5.3, 7.4
         */
        test('should handle localStorage errors gracefully', async () => {
            await fc.assert(fc.asyncProperty(
                fc.string({ minLength: 2, maxLength: 10 }),
                async (searchTerm) => {
                    // Mock localStorage to throw error
                    localStorageMock.getItem.mockImplementation(() => {
                        throw new Error('Storage full');
                    });
                    
                    const query = { term: searchTerm };
                    
                    // Should not throw error, should return empty array
                    const results = await itemSearchService.searchItems(query);
                    expect(Array.isArray(results)).toBe(true);
                    expect(results).toEqual([]);
                }
            ), { numRuns: 50 });
        });

        test('should handle invalid JSON in localStorage gracefully', async () => {
            await fc.assert(fc.asyncProperty(
                fc.string({ minLength: 2, maxLength: 10 }),
                async (searchTerm) => {
                    // Mock localStorage to return invalid JSON
                    localStorageMock.getItem.mockReturnValue('invalid json {');
                    
                    const query = { term: searchTerm };
                    
                    // Should not throw error, should return empty array
                    const results = await itemSearchService.searchItems(query);
                    expect(Array.isArray(results)).toBe(true);
                    expect(results).toEqual([]);
                }
            ), { numRuns: 50 });
        });
    });
});