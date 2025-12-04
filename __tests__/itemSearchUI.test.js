/**
 * Unit Tests for Item Search UI Components
 */

// Mock DOM environment
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;
global.HTMLElement = dom.window.HTMLElement;
global.Event = dom.window.Event;
global.CustomEvent = dom.window.CustomEvent;

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock Bootstrap Modal
global.bootstrap = {
    Modal: jest.fn().mockImplementation(() => ({
        show: jest.fn(),
        hide: jest.fn()
    }))
};

// Mock global functions
global.getCurrentUser = jest.fn(() => ({ id: 'test-user' }));
global.showNotification = jest.fn();
global.updatePurchaseTable = jest.fn();

// Import modules to test
import '../js/itemSearch.js';
import '../js/itemSearchUI.js';

describe('Item Search UI Tests', () => {
    let searchUI;
    let container;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        localStorageMock.getItem.mockReturnValue('[]');
        
        // Create test container
        container = document.createElement('div');
        container.id = 'testContainer';
        document.body.appendChild(container);
        
        // Get global instance
        searchUI = global.searchUI;
    });

    afterEach(() => {
        // Clean up
        if (container.parentNode) {
            container.parentNode.removeChild(container);
        }
    });

    describe('Search Field Rendering', () => {
        test('should render search field with correct structure', () => {
            const searchField = searchUI.renderSearchField('testContainer');
            
            expect(searchField).toBeTruthy();
            expect(searchField.id).toBe('itemSearchInput');
            expect(searchField.type).toBe('text');
            expect(searchField.placeholder).toContain('Cari barang');
            
            // Check for required elements
            const clearBtn = document.getElementById('clearSearchBtn');
            const dropdown = document.getElementById('searchDropdown');
            const helpText = document.getElementById('searchHelp');
            
            expect(clearBtn).toBeTruthy();
            expect(dropdown).toBeTruthy();
            expect(helpText).toBeTruthy();
        });

        test('should handle missing container gracefully', () => {
            const result = searchUI.renderSearchField('nonExistentContainer');
            expect(result).toBeNull();
        });
    });

    describe('Category Filter Rendering', () => {
        test('should render category filter with options', () => {
            // Mock inventory data with categories
            const mockInventory = [
                { id: '1', name: 'Item 1', category: 'Electronics', currentStock: 10, unitPrice: 100 },
                { id: '2', name: 'Item 2', category: 'Books', currentStock: 5, unitPrice: 50 },
                { id: '3', name: 'Item 3', category: 'Electronics', currentStock: 0, unitPrice: 200 }
            ];
            localStorageMock.getItem.mockReturnValue(JSON.stringify(mockInventory));
            
            const categoryFilter = searchUI.renderCategoryFilter('testContainer');
            
            expect(categoryFilter).toBeTruthy();
            expect(categoryFilter.id).toBe('categoryFilter');
            
            // Should have "All Categories" option plus category options
            const options = categoryFilter.querySelectorAll('option');
            expect(options.length).toBeGreaterThan(1);
            expect(options[0].value).toBe('all');
            expect(options[0].textContent).toBe('Semua Kategori');
        });
    });

    describe('Search Input Handling', () => {
        test('should show clear button when input has value', () => {
            const searchField = searchUI.renderSearchField('testContainer');
            const clearBtn = document.getElementById('clearSearchBtn');
            
            // Initially hidden
            expect(clearBtn.style.display).toBe('none');
            
            // Type in search field
            searchField.value = 'test';
            searchField.dispatchEvent(new Event('input'));
            
            // Should show clear button
            expect(clearBtn.style.display).toBe('block');
        });

        test('should debounce search input', (done) => {
            const searchField = searchUI.renderSearchField('testContainer');
            
            // Mock search function
            const originalPerformSearch = searchUI.performSearch;
            searchUI.performSearch = jest.fn();
            
            // Type multiple characters quickly
            searchField.value = 't';
            searchField.dispatchEvent(new Event('input'));
            
            searchField.value = 'te';
            searchField.dispatchEvent(new Event('input'));
            
            searchField.value = 'tes';
            searchField.dispatchEvent(new Event('input'));
            
            // Should not call search immediately
            expect(searchUI.performSearch).not.toHaveBeenCalled();
            
            // Should call search after debounce delay
            setTimeout(() => {
                expect(searchUI.performSearch).toHaveBeenCalledTimes(1);
                expect(searchUI.performSearch).toHaveBeenCalledWith('tes');
                
                // Restore original function
                searchUI.performSearch = originalPerformSearch;
                done();
            }, 350); // Slightly more than debounce delay
        });
    });

    describe('Keyboard Navigation', () => {
        test('should handle arrow key navigation', () => {
            const searchField = searchUI.renderSearchField('testContainer');
            
            // Mock dropdown with items
            const dropdown = document.getElementById('searchDropdown');
            dropdown.innerHTML = `
                <div class="search-result-item" data-index="0" data-item-id="1">Item 1</div>
                <div class="search-result-item" data-index="1" data-item-id="2">Item 2</div>
                <div class="search-result-item" data-index="2" data-item-id="3">Item 3</div>
            `;
            dropdown.style.display = 'block';
            searchUI.isDropdownVisible = true;
            
            const items = dropdown.querySelectorAll('.search-result-item');
            
            // Press arrow down
            const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            searchField.dispatchEvent(arrowDownEvent);
            
            expect(searchUI.selectedIndex).toBe(0);
            expect(items[0].classList.contains('selected')).toBe(true);
            
            // Press arrow down again
            searchField.dispatchEvent(arrowDownEvent);
            
            expect(searchUI.selectedIndex).toBe(1);
            expect(items[1].classList.contains('selected')).toBe(true);
            expect(items[0].classList.contains('selected')).toBe(false);
        });

        test('should handle escape key to close dropdown', () => {
            const searchField = searchUI.renderSearchField('testContainer');
            const dropdown = document.getElementById('searchDropdown');
            
            // Show dropdown
            dropdown.style.display = 'block';
            searchUI.isDropdownVisible = true;
            
            // Press escape
            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
            searchField.dispatchEvent(escapeEvent);
            
            expect(dropdown.style.display).toBe('none');
            expect(searchUI.isDropdownVisible).toBe(false);
        });

        test('should handle Ctrl+F to focus search field', () => {
            const searchField = searchUI.renderSearchField('testContainer');
            
            // Mock focus method
            searchField.focus = jest.fn();
            
            // Press Ctrl+F
            const ctrlFEvent = new KeyboardEvent('keydown', { 
                key: 'f', 
                ctrlKey: true 
            });
            document.dispatchEvent(ctrlFEvent);
            
            expect(searchField.focus).toHaveBeenCalled();
        });
    });

    describe('Search Results Rendering', () => {
        test('should render search results with correct structure', () => {
            searchUI.renderSearchField('testContainer');
            
            const mockResults = [
                {
                    id: '1',
                    code: 'ITM001',
                    name: 'Test Item 1',
                    category: 'Electronics',
                    currentStock: 10,
                    unitPrice: 100000,
                    isLowStock: false,
                    isOutOfStock: false
                },
                {
                    id: '2',
                    code: 'ITM002',
                    name: 'Test Item 2',
                    category: 'Books',
                    currentStock: 2,
                    unitPrice: 50000,
                    isLowStock: true,
                    isOutOfStock: false
                }
            ];
            
            searchUI.renderSearchResults(mockResults);
            
            const dropdown = document.getElementById('searchDropdown');
            expect(dropdown.style.display).toBe('block');
            
            const resultItems = dropdown.querySelectorAll('.search-result-item');
            expect(resultItems.length).toBe(2);
            
            // Check first item structure
            const firstItem = resultItems[0];
            expect(firstItem.dataset.itemId).toBe('1');
            expect(firstItem.querySelector('.item-name').textContent).toBe('Test Item 1');
            expect(firstItem.querySelector('.item-code').textContent).toBe('ITM001');
            
            // Check low stock indicator
            const secondItem = resultItems[1];
            expect(secondItem.classList.contains('low-stock')).toBe(true);
        });

        test('should show no results message when empty', () => {
            searchUI.renderSearchField('testContainer');
            searchUI.renderSearchResults([]);
            
            const dropdown = document.getElementById('searchDropdown');
            expect(dropdown.style.display).toBe('block');
            expect(dropdown.querySelector('.search-no-results')).toBeTruthy();
            expect(dropdown.textContent).toContain('Tidak ada barang yang ditemukan');
        });
    });

    describe('Item Selection', () => {
        test('should handle item selection correctly', () => {
            const mockItem = {
                id: '1',
                code: 'ITM001',
                name: 'Test Item',
                category: 'Electronics',
                currentStock: 10,
                unitPrice: 100000
            };
            
            // Mock localStorage for purchase items
            localStorageMock.getItem.mockReturnValue('[]');
            
            searchUI.handleItemSelection(mockItem);
            
            // Should save to localStorage
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'currentPurchaseItems',
                expect.stringContaining(mockItem.id)
            );
        });

        test('should increment quantity for duplicate items', () => {
            const mockItem = {
                id: '1',
                code: 'ITM001',
                name: 'Test Item',
                category: 'Electronics',
                currentStock: 10,
                unitPrice: 100000
            };
            
            // Mock existing purchase items
            const existingItems = [{
                id: '1',
                code: 'ITM001',
                name: 'Test Item',
                category: 'Electronics',
                unitPrice: 100000,
                quantity: 1,
                total: 100000
            }];
            localStorageMock.getItem.mockReturnValue(JSON.stringify(existingItems));
            
            searchUI.handleItemSelection(mockItem);
            
            // Should update quantity
            const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
            expect(savedData[0].quantity).toBe(2);
            expect(savedData[0].total).toBe(200000);
        });
    });

    describe('Recent Searches', () => {
        test('should show recent searches when field is focused', () => {
            searchUI.renderSearchField('testContainer');
            
            // Mock recent searches
            const mockRecentSearches = [
                {
                    searchTerm: 'test',
                    selectedItem: {
                        id: '1',
                        name: 'Test Item',
                        code: 'ITM001',
                        category: 'Electronics',
                        currentStock: 10,
                        unitPrice: 100000
                    },
                    timestamp: new Date(),
                    frequency: 1
                }
            ];
            
            global.searchHistory.getRecentSearches = jest.fn(() => mockRecentSearches);
            global.searchHistory.getFrequentItems = jest.fn(() => []);
            
            searchUI.showRecentSearches();
            
            const dropdown = document.getElementById('searchDropdown');
            expect(dropdown.style.display).toBe('block');
            expect(dropdown.textContent).toContain('Pencarian Terakhir');
            expect(dropdown.textContent).toContain('Test Item');
        });
    });

    describe('Error Handling', () => {
        test('should handle search errors gracefully', async () => {
            searchUI.renderSearchField('testContainer');
            
            // Mock search service to throw error
            global.itemSearchService.searchItems = jest.fn().mockRejectedValue(new Error('Search failed'));
            
            await searchUI.performSearch('test');
            
            // Should not throw error and should show error message
            expect(searchUI.showErrorMessage).toBeDefined();
        });

        test('should handle missing elements gracefully', () => {
            // Try to clear search without rendered field
            expect(() => searchUI.clearSearch()).not.toThrow();
            
            // Try to hide dropdown without rendered field
            expect(() => searchUI.hideDropdown()).not.toThrow();
        });
    });

    describe('Utility Functions', () => {
        test('should format currency correctly', () => {
            const formatted = searchUI.formatCurrency(100000);
            expect(formatted).toContain('100.000');
            expect(formatted).toContain('Rp');
        });

        test('should highlight search terms correctly', () => {
            // Mock search input
            const searchField = document.createElement('input');
            searchField.id = 'itemSearchInput';
            searchField.value = 'test';
            document.body.appendChild(searchField);
            
            const highlighted = searchUI.highlightSearchTerm('This is a test item');
            expect(highlighted).toContain('<mark>test</mark>');
            
            document.body.removeChild(searchField);
        });

        test('should find items by ID correctly', () => {
            const mockResults = [
                { id: '1', name: 'Item 1' },
                { id: '2', name: 'Item 2' }
            ];
            searchUI.currentResults = mockResults;
            
            const found = searchUI.findItemById('1');
            expect(found).toBeTruthy();
            expect(found.name).toBe('Item 1');
            
            const notFound = searchUI.findItemById('999');
            expect(notFound).toBeNull();
        });
    });
});