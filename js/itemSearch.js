/**
 * Item Search Module for Purchase Transactions
 * Provides search functionality for items without barcodes
 */

/**
 * @typedef {Object} SearchQuery
 * @property {string} term - Search term
 * @property {string} [categoryId] - Category filter (optional)
 * @property {number} [minLength=2] - Minimum characters (default: 2)
 * @property {number} [maxResults=10] - Maximum results (default: 10)
 * @property {boolean} [caseSensitive=false] - Case sensitivity (default: false)
 */

/**
 * @typedef {Object} SearchResult
 * @property {string} id - Item ID
 * @property {string} code - Item code
 * @property {string} name - Item name
 * @property {string} category - Item category
 * @property {number} currentStock - Current stock level
 * @property {number} unitPrice - Unit price
 * @property {boolean} isLowStock - Low stock indicator
 * @property {boolean} isOutOfStock - Out of stock indicator
 * @property {number} relevanceScore - Search relevance score
 */

/**
 * @typedef {Object} SearchHistoryEntry
 * @property {string} id - Entry ID
 * @property {string} searchTerm - Search term used
 * @property {SearchResult} selectedItem - Item that was selected
 * @property {Date} timestamp - When the search occurred
 * @property {string} userId - User who performed the search
 * @property {number} frequency - How often this item is selected
 */

/**
 * Core search service for item searching functionality
 */
class ItemSearchService {
    constructor() {
        this.searchCache = new Map();
        this.debounceTimeout = null;
        this.lowStockThreshold = 10; // Items with stock <= 10 are considered low stock
    }

    /**
     * Search items based on query and filters
     * @param {SearchQuery} query - Search parameters
     * @returns {Promise<SearchResult[]>} Search results
     */
    async searchItems(query) {
        const startTime = performance.now();
        
        try {
            // Validate input
            if (!query.term || query.term.length < (query.minLength || 2)) {
                return [];
            }

            // Get inventory data
            const inventory = this.getInventoryData();
            
            // Apply search filters
            let results = this.filterItems(inventory, query);
            
            // Sort by relevance
            results = this.sortByRelevance(results, query.term);
            
            // Limit results
            const maxResults = query.maxResults || 10;
            results = results.slice(0, maxResults);
            
            // Add stock indicators
            results = results.map(item => this.addStockIndicators(item));
            
            // Log search performance
            const responseTime = performance.now() - startTime;
            this.logSearchOperation(query.term, results.length, responseTime);
            
            return results;
        } catch (error) {
            console.error('Search error:', error);
            this.logSearchError(query.term, error);
            return [];
        }
    }

    /**
     * Get items by category
     * @param {string} categoryId - Category ID
     * @returns {SearchResult[]} Items in category
     */
    getItemsByCategory(categoryId) {
        const inventory = this.getInventoryData();
        
        if (!categoryId || categoryId === 'all') {
            return inventory.map(item => this.addStockIndicators(item));
        }
        
        return inventory
            .filter(item => item.category === categoryId)
            .map(item => this.addStockIndicators(item));
    }

    /**
     * Filter items based on search criteria
     * @param {Object[]} inventory - Inventory data
     * @param {SearchQuery} query - Search query
     * @returns {SearchResult[]} Filtered results
     */
    filterItems(inventory, query) {
        const searchTerm = query.caseSensitive ? query.term : query.term.toLowerCase();
        const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);
        
        return inventory.filter(item => {
            // Category filter
            if (query.categoryId && query.categoryId !== 'all' && item.category !== query.categoryId) {
                return false;
            }
            
            // Name search
            const itemName = query.caseSensitive ? item.name : item.name.toLowerCase();
            const itemCode = query.caseSensitive ? item.code : item.code.toLowerCase();
            
            // Check if all search words are found in name or code
            return searchWords.every(word => 
                itemName.includes(word) || itemCode.includes(word)
            );
        });
    }

    /**
     * Sort results by relevance
     * @param {SearchResult[]} results - Search results
     * @param {string} searchTerm - Original search term
     * @returns {SearchResult[]} Sorted results
     */
    sortByRelevance(results, searchTerm) {
        const term = searchTerm.toLowerCase();
        
        return results.map(item => {
            let score = 0;
            const name = item.name.toLowerCase();
            const code = item.code.toLowerCase();
            
            // Exact match gets highest score
            if (name === term || code === term) score += 100;
            
            // Starts with search term
            if (name.startsWith(term) || code.startsWith(term)) score += 50;
            
            // Contains search term
            if (name.includes(term) || code.includes(term)) score += 25;
            
            // Frequency bonus from search history
            const frequency = this.getItemFrequency(item.id);
            score += frequency * 5;
            
            return { ...item, relevanceScore: score };
        }).sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    /**
     * Add stock indicators to item
     * @param {Object} item - Item data
     * @returns {SearchResult} Item with stock indicators
     */
    addStockIndicators(item) {
        return {
            ...item,
            isOutOfStock: item.currentStock <= 0,
            isLowStock: item.currentStock > 0 && item.currentStock <= this.lowStockThreshold
        };
    }

    /**
     * Get inventory data from storage
     * @returns {Object[]} Inventory items
     */
    getInventoryData() {
        try {
            const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
            return inventory.map(item => ({
                id: item.id || '',
                code: item.kode || item.code || '',
                name: item.nama || item.name || '',
                category: item.kategori || item.category || 'Uncategorized',
                currentStock: parseInt(item.stok || item.stock || item.currentStock || 0),
                unitPrice: parseFloat(item.harga || item.price || item.unitPrice || 0)
            }));
        } catch (error) {
            console.error('Error loading inventory:', error);
            return [];
        }
    }

    /**
     * Get item frequency from search history
     * @param {string} itemId - Item ID
     * @returns {number} Frequency count
     */
    getItemFrequency(itemId) {
        try {
            const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
            const entry = history.find(h => h.selectedItem && h.selectedItem.id === itemId);
            return entry ? entry.frequency : 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Log search operation for audit
     * @param {string} searchTerm - Search term
     * @param {number} resultCount - Number of results
     * @param {number} responseTime - Response time in ms
     */
    logSearchOperation(searchTerm, resultCount, responseTime) {
        try {
            const logEntry = {
                type: 'search',
                searchTerm,
                resultCount,
                responseTime,
                timestamp: new Date().toISOString(),
                userId: getCurrentUser()?.id || 'anonymous'
            };
            
            this.addToAuditLog(logEntry);
        } catch (error) {
            console.error('Error logging search operation:', error);
        }
    }

    /**
     * Log search error for troubleshooting
     * @param {string} searchTerm - Search term that caused error
     * @param {Error} error - Error object
     */
    logSearchError(searchTerm, error) {
        try {
            const logEntry = {
                type: 'search_error',
                searchTerm,
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString(),
                userId: getCurrentUser()?.id || 'anonymous'
            };
            
            this.addToAuditLog(logEntry);
        } catch (logError) {
            console.error('Error logging search error:', logError);
        }
    }

    /**
     * Add entry to audit log
     * @param {Object} logEntry - Log entry to add
     */
    addToAuditLog(logEntry) {
        try {
            const auditLog = JSON.parse(localStorage.getItem('auditLog') || '[]');
            auditLog.push(logEntry);
            
            // Keep only last 1000 entries to prevent storage overflow
            if (auditLog.length > 1000) {
                auditLog.splice(0, auditLog.length - 1000);
            }
            
            localStorage.setItem('auditLog', JSON.stringify(auditLog));
        } catch (error) {
            console.error('Error adding to audit log:', error);
        }
    }
}

/**
 * Search history management
 */
class SearchHistory {
    constructor() {
        this.maxHistorySize = 10;
    }

    /**
     * Add search to history
     * @param {string} searchTerm - Search term
     * @param {SearchResult} selectedItem - Selected item
     */
    addSearch(searchTerm, selectedItem) {
        try {
            const history = this.getHistory();
            const userId = getCurrentUser()?.id || 'anonymous';
            
            // Find existing entry for this item
            const existingIndex = history.findIndex(entry => 
                entry.selectedItem && entry.selectedItem.id === selectedItem.id
            );
            
            if (existingIndex >= 0) {
                // Update existing entry
                history[existingIndex].frequency += 1;
                history[existingIndex].timestamp = new Date();
                history[existingIndex].searchTerm = searchTerm;
            } else {
                // Add new entry
                const newEntry = {
                    id: Date.now().toString(),
                    searchTerm,
                    selectedItem,
                    timestamp: new Date(),
                    userId,
                    frequency: 1
                };
                
                history.unshift(newEntry);
            }
            
            // Limit history size
            if (history.length > this.maxHistorySize) {
                history.splice(this.maxHistorySize);
            }
            
            localStorage.setItem('searchHistory', JSON.stringify(history));
        } catch (error) {
            console.error('Error adding to search history:', error);
        }
    }

    /**
     * Get recent searches
     * @param {number} limit - Maximum number of entries
     * @returns {SearchHistoryEntry[]} Recent searches
     */
    getRecentSearches(limit = 5) {
        try {
            const history = this.getHistory();
            return history
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, limit);
        } catch (error) {
            console.error('Error getting recent searches:', error);
            return [];
        }
    }

    /**
     * Get frequently used items
     * @param {number} limit - Maximum number of items
     * @returns {SearchHistoryEntry[]} Frequently used items
     */
    getFrequentItems(limit = 5) {
        try {
            const history = this.getHistory();
            return history
                .sort((a, b) => b.frequency - a.frequency)
                .slice(0, limit);
        } catch (error) {
            console.error('Error getting frequent items:', error);
            return [];
        }
    }

    /**
     * Clear search history
     */
    clearHistory() {
        try {
            localStorage.removeItem('searchHistory');
        } catch (error) {
            console.error('Error clearing search history:', error);
        }
    }

    /**
     * Remove deleted items from history
     * @param {string[]} deletedItemIds - Array of deleted item IDs
     */
    removeDeletedItems(deletedItemIds) {
        try {
            const history = this.getHistory();
            const filteredHistory = history.filter(entry => 
                !entry.selectedItem || !deletedItemIds.includes(entry.selectedItem.id)
            );
            
            localStorage.setItem('searchHistory', JSON.stringify(filteredHistory));
        } catch (error) {
            console.error('Error removing deleted items from history:', error);
        }
    }

    /**
     * Get search history from storage
     * @returns {SearchHistoryEntry[]} Search history
     */
    getHistory() {
        try {
            return JSON.parse(localStorage.getItem('searchHistory') || '[]');
        } catch (error) {
            console.error('Error loading search history:', error);
            return [];
        }
    }
}

/**
 * Search logger for audit purposes
 */
class SearchLogger {
    /**
     * Log item selection
     * @param {SearchResult} item - Selected item
     * @param {string} searchTerm - Search term used
     */
    logItemSelection(item, searchTerm) {
        try {
            const logEntry = {
                type: 'item_selection',
                itemId: item.id,
                itemName: item.name,
                searchTerm,
                timestamp: new Date().toISOString(),
                userId: getCurrentUser()?.id || 'anonymous'
            };
            
            this.addToAuditLog(logEntry);
        } catch (error) {
            console.error('Error logging item selection:', error);
        }
    }

    /**
     * Export audit logs
     * @returns {Object[]} Audit log entries
     */
    exportLogs() {
        try {
            const auditLog = JSON.parse(localStorage.getItem('auditLog') || '[]');
            return auditLog.filter(entry => 
                entry.type === 'search' || 
                entry.type === 'item_selection' || 
                entry.type === 'search_error'
            );
        } catch (error) {
            console.error('Error exporting logs:', error);
            return [];
        }
    }

    /**
     * Add entry to audit log
     * @param {Object} logEntry - Log entry to add
     */
    addToAuditLog(logEntry) {
        try {
            const auditLog = JSON.parse(localStorage.getItem('auditLog') || '[]');
            auditLog.push(logEntry);
            
            // Keep only last 1000 entries
            if (auditLog.length > 1000) {
                auditLog.splice(0, auditLog.length - 1000);
            }
            
            localStorage.setItem('auditLog', JSON.stringify(auditLog));
        } catch (error) {
            console.error('Error adding to audit log:', error);
        }
    }
}

// Global instances
window.itemSearchService = new ItemSearchService();
window.searchHistory = new SearchHistory();
window.searchLogger = new SearchLogger();

// Helper function to get current user (integrate with existing auth system)
function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('currentUser') || 'null');
    } catch (error) {
        return null;
    }
}