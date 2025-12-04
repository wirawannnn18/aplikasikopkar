/**
 * Integration Tests for Item Search with Inventory and Purchase Systems
 */

// Mock DOM environment
import { JSDOM } from 'jsdom';

const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<body>
    <div id="itemSearchContainer"></div>
    <div id="categoryFilterContainer"></div>
    <div id="itemPembelianList"></div>
    <div id="totalPembelian">Rp 0</div>
</body>
</html>
`);

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

// Mock Bootstrap
global.bootstrap = {
    Modal: jest.fn().mockImplementation(() => ({
        show: jest.fn(),
        hide: jest.fn()
    }))
};

// Mock global functions
global.getCurrentUser = jest.fn(() => ({ id: 'test-user' }));
global.showNotification = jest.fn();
global.showAlert = jest.fn();
global.formatRupiah = jest.fn((amount) => `Rp ${amount.toLocaleString('id-ID')}`);

// Import modules
import '../js/itemSearch.js';
import '../js/itemSearchUI.js';

// Mock inventory functions that would be in inventory.js
global.itemsPembelian = [];
global.updateItemPembelianList = jest.fn();
global.updatePurchaseTable = jest.fn();

describe('Item Search Integration Tests', () => {
    let searchUI;
    let itemSearchService;
    let searchHistory;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        localStorageMock.getItem.mockReturnValue('[]');
        
        // Reset global variables
        global.itemsPembelian = [];
        
        // Get global instances
        searchUI = global.searchUI;
        itemSearchService = global.itemSearchService;
        searchHistory = global.searchHistory;
    });

    describe('Search Integration with Inventory System', () => {
        test('should search and display inventory items correctly', async () => {
            // Setup mock inventory data
            const mockInventory = [
                {
                    id: 'item1',
                    kode: 'ITM001',
                    nama: 'Laptop Dell',
                    kategori: 'Electronics',
                    stok: 5,
                    harga: 8000000
                },
                {
                    id: 'item2',
                    kode: 'ITM002',
                    nama: 'Mouse Wireless',
                    kategori: 'Electronics',
                    stok: 15,
                    harga: 150000
                },
                {
                    id: 'item3',
                    kode: 'ITM003',
                    nama: 'Buku Programming',
                    kategori: 'Books',
                    stok: 0,
                    harga: 75000
                }
            ];
            
            localStorageMock.getItem.mockImplementation((key) => {
                if (key === 'inventory') {
                    return JSON.stringify(mockInventory);
                }
                return '[]';
            });
            
            // Initialize search UI
            searchUI.renderSearchField('itemSearchContainer');
            searchUI.renderCategoryFilter('categoryFilterContainer');
            
            // Perform search
            await searchUI.performSearch('laptop');
            
            // Check results
            const dropdown = document.getElementById('searchDropdown');
            expect(dropdown.style.display).toBe('block');
            
            const resultItems = dropdown.querySelectorAll('.search-result-item');
            expect(resultItems.length).toBe(1);
            expect(resultItems[0].textContent).toContain('Laptop Dell');
            expect(resultItems[0].textContent).toContain('ITM001');
        });

        test('should filter by category correctly', async () => {
            const mockInventory = [
                {
                    id: 'item1',
                    kode: 'ITM001',
                    nama: 'Laptop Dell',
                    kategori: 'Electronics',
                    stok: 5,
                    harga: 8000000
                },
                {
                    id: 'item2',
                    kode: 'ITM002',
                    nama: 'Buku Programming',
                    kategori: 'Books',
                    stok: 10,
                    harga: 75000
                }
            ];
            
            localStorageMock.getItem.mockImplementation((key) => {
                if (key === 'inventory') {
                    return JSON.stringify(mockInventory);
                }
                return '[]';
            });
            
            searchUI.renderSearchField('itemSearchContainer');
            searchUI.renderCategoryFilter('categoryFilterContainer');
            
            // Set category filter
            const categorySelect = document.getElementById('categoryFilter');
            categorySelect.value = 'Electronics';
            
            // Perform search
            await searchUI.performSearch('item');
            
            const dropdown = document.getElementById('searchDropdown');
            const resultItems = dropdown.querySelectorAll('.search-result-item');
            
            // Should only show Electronics items
            expect(resultItems.length).toBe(1);
            expect(resultItems[0].textContent).toContain('Laptop Dell');
        });

        test('should handle real-time inventory updates', async () => {
            let mockInventory = [
                {
                    id: 'item1',
                    kode: 'ITM001',
                    nama: 'Test Item',
                    kategori: 'Electronics',
                    stok: 5,
                    harga: 100000
                }
            ];
            
            localStorageMock.getItem.mockImplementation((key) => {
                if (key === 'inventory') {
                    return JSON.stringify(mockInventory);
                }
                return '[]';
            });
            
            searchUI.renderSearchField('itemSearchContainer');
            
            // Initial search
            await searchUI.performSearch('test');
            let dropdown = document.getElementById('searchDropdown');
            let resultItems = dropdown.querySelectorAll('.search-result-item');
            expect(resultItems.length).toBe(1);
            
            // Update inventory (simulate item deletion)
            mockInventory = [];
            
            // Search again
            await searchUI.performSearch('test');
            dropdown = document.getElementById('searchDropdown');
            expect(dropdown.textContent).toContain('Tidak ada barang yang ditemukan');
        });
    });

    describe('Purchase Transaction Integration', () => {
        test('should add item to purchase transaction correctly', () => {
            const mockItem = {
                id: 'item1',
                code: 'ITM001',
                name: 'Test Item',
                category: 'Electronics',
                currentStock: 10,
                unitPrice: 100000
            };
            
            // Mock empty purchase items
            localStorageMock.getItem.mockImplementation((key) => {
                if (key === 'currentPurchaseItems') {
                    return '[]';
                }
                return '[]';
            });
            
            searchUI.handleItemSelection(mockItem);
            
            // Check that item was added to localStorage
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'currentPurchaseItems',
                expect.stringContaining(mockItem.id)
            );
            
            const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
            expect(savedData).toHaveLength(1);
            expect(savedData[0].id).toBe(mockItem.id);
            expect(savedData[0].quantity).toBe(1);
            expect(savedData[0].total).toBe(mockItem.unitPrice);
        });

        test('should increment quantity for duplicate items', () => {
            const mockItem = {
                id: 'item1',
                code: 'ITM001',
                name: 'Test Item',
                category: 'Electronics',
                currentStock: 10,
                unitPrice: 100000
            };
            
            // Mock existing purchase items
            const existingItems = [{
                id: 'item1',
                code: 'ITM001',
                name: 'Test Item',
                category: 'Electronics',
                unitPrice: 100000,
                quantity: 2,
                total: 200000
            }];
            
            localStorageMock.getItem.mockImplementation((key) => {
                if (key === 'currentPurchaseItems') {
                    return JSON.stringify(existingItems);
                }
                return '[]';
            });
            
            searchUI.handleItemSelection(mockItem);
            
            const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
            expect(savedData).toHaveLength(1);
            expect(savedData[0].quantity).toBe(3);
            expect(savedData[0].total).toBe(300000);
        });

        test('should trigger custom event for purchase update', () => {
            const mockItem = {
                id: 'item1',
                code: 'ITM001',
                name: 'Test Item',
                category: 'Electronics',
                currentStock: 10,
                unitPrice: 100000
            };
            
            localStorageMock.getItem.mockReturnValue('[]');
            
            // Mock event listener
            const eventListener = jest.fn();
            document.addEventListener('itemAddedToPurchase', eventListener);
            
            searchUI.handleItemSelection(mockItem);
            
            expect(eventListener).toHaveBeenCalled();
            const eventData = eventListener.mock.calls[0][0].detail;
            expect(eventData.item).toEqual(mockItem);
        });
    });

    describe('Search History Integration', () => {
        test('should add search to history when item is selected', () => {
            const mockItem = {
                id: 'item1',
                code: 'ITM001',
                name: 'Test Item',
                category: 'Electronics',
                currentStock: 10,
                unitPrice: 100000
            };
            
            localStorageMock.getItem.mockReturnValue('[]');
            
            // Mock search input
            const searchInput = document.createElement('input');
            searchInput.id = 'itemSearchInput';
            searchInput.value = 'test search';
            document.body.appendChild(searchInput);
            
            searchUI.handleItemSelection(mockItem);
            
            // Check that search history was updated
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'searchHistory',
                expect.any(String)
            );
            
            document.body.removeChild(searchInput);
        });

        test('should show recent searches on focus', () => {
            const mockRecentSearches = [
                {
                    searchTerm: 'laptop',
                    selectedItem: {
                        id: 'item1',
                        name: 'Laptop Dell',
                        code: 'ITM001',
                        category: 'Electronics',
                        currentStock: 5,
                        unitPrice: 8000000
                    },
                    timestamp: new Date(),
                    frequency: 3
                }
            ];
            
            localStorageMock.getItem.mockImplementation((key) => {
                if (key === 'searchHistory') {
                    return JSON.stringify(mockRecentSearches);
                }
                return '[]';
            });
            
            searchUI.renderSearchField('itemSearchContainer');
            searchUI.showRecentSearches();
            
            const dropdown = document.getElementById('searchDropdown');
            expect(dropdown.style.display).toBe('block');
            expect(dropdown.textContent).toContain('Sering Digunakan');
            expect(dropdown.textContent).toContain('Laptop Dell');
        });
    });

    describe('Audit Logging Integration', () => {
        test('should log search operations', async () => {
            const mockInventory = [
                {
                    id: 'item1',
                    kode: 'ITM001',
                    nama: 'Test Item',
                    kategori: 'Electronics',
                    stok: 5,
                    harga: 100000
                }
            ];
            
            localStorageMock.getItem.mockImplementation((key) => {
                if (key === 'inventory') {
                    return JSON.stringify(mockInventory);
                }
                return '[]';
            });
            
            await itemSearchService.searchItems({ term: 'test' });
            
            // Check that audit log was updated
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'auditLog',
                expect.stringContaining('search')
            );
        });

        test('should log item selections', () => {
            const mockItem = {
                id: 'item1',
                name: 'Test Item',
                code: 'ITM001',
                category: 'Electronics',
                currentStock: 10,
                unitPrice: 100000
            };
            
            localStorageMock.getItem.mockReturnValue('[]');
            
            // Mock search input for search term
            const searchInput = document.createElement('input');
            searchInput.id = 'itemSearchInput';
            searchInput.value = 'test';
            document.body.appendChild(searchInput);
            
            searchUI.handleItemSelection(mockItem);
            
            // Check that item selection was logged
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'auditLog',
                expect.stringContaining('item_selection')
            );
            
            document.body.removeChild(searchInput);
        });
    });

    describe('Error Handling Integration', () => {
        test('should handle inventory loading errors gracefully', async () => {
            // Mock localStorage to throw error
            localStorageMock.getItem.mockImplementation(() => {
                throw new Error('Storage error');
            });
            
            const results = await itemSearchService.searchItems({ term: 'test' });
            
            // Should return empty array instead of throwing
            expect(results).toEqual([]);
        });

        test('should handle purchase transaction errors gracefully', () => {
            const mockItem = {
                id: 'item1',
                code: 'ITM001',
                name: 'Test Item',
                category: 'Electronics',
                currentStock: 10,
                unitPrice: 100000
            };
            
            // Mock localStorage to throw error on setItem
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('Storage full');
            });
            
            // Should not throw error
            expect(() => searchUI.handleItemSelection(mockItem)).not.toThrow();
            
            // Should show error message
            expect(global.showAlert).toHaveBeenCalledWith(
                expect.stringContaining('Gagal'),
                'danger'
            );
        });
    });

    describe('Performance Integration', () => {
        test('should handle large inventory datasets efficiently', async () => {
            // Create large inventory dataset
            const largeInventory = Array.from({ length: 1000 }, (_, i) => ({
                id: `item${i}`,
                kode: `ITM${String(i).padStart(3, '0')}`,
                nama: `Test Item ${i}`,
                kategori: i % 2 === 0 ? 'Electronics' : 'Books',
                stok: Math.floor(Math.random() * 100),
                harga: Math.floor(Math.random() * 1000000)
            }));
            
            localStorageMock.getItem.mockImplementation((key) => {
                if (key === 'inventory') {
                    return JSON.stringify(largeInventory);
                }
                return '[]';
            });
            
            const startTime = performance.now();
            const results = await itemSearchService.searchItems({ term: 'test' });
            const endTime = performance.now();
            
            // Should complete within reasonable time (< 200ms as per requirements)
            expect(endTime - startTime).toBeLessThan(200);
            
            // Should limit results to maximum
            expect(results.length).toBeLessThanOrEqual(10);
        });

        test('should debounce rapid search inputs', (done) => {
            searchUI.renderSearchField('itemSearchContainer');
            const searchInput = document.getElementById('itemSearchInput');
            
            // Mock performSearch to track calls
            const originalPerformSearch = searchUI.performSearch;
            searchUI.performSearch = jest.fn();
            
            // Simulate rapid typing
            for (let i = 0; i < 10; i++) {
                searchInput.value = `test${i}`;
                searchInput.dispatchEvent(new Event('input'));
            }
            
            // Should not call search immediately
            expect(searchUI.performSearch).not.toHaveBeenCalled();
            
            // Should call search only once after debounce
            setTimeout(() => {
                expect(searchUI.performSearch).toHaveBeenCalledTimes(1);
                searchUI.performSearch = originalPerformSearch;
                done();
            }, 350);
        });
    });
});