/**
 * Master Barang Komprehensif - Search Engine
 * Handles real-time search functionality for barang data
 */

export class SearchEngine {
    constructor() {
        this.searchFields = ['kode', 'nama', 'kategori_nama', 'satuan_nama', 'deskripsi'];
        this.searchCache = new Map();
        this.lastSearchTerm = '';
        this.lastSearchResults = [];
    }

    /**
     * Perform search on barang data
     * @param {Array} data - Array of barang items
     * @param {string} searchTerm - Search term
     * @param {Object} options - Search options
     * @returns {Array} Filtered results
     */
    search(data, searchTerm, options = {}) {
        if (!searchTerm || searchTerm.trim() === '') {
            return data;
        }

        const normalizedTerm = this.normalizeSearchTerm(searchTerm);
        
        // Check cache for performance
        const cacheKey = `${normalizedTerm}_${data.length}`;
        if (this.searchCache.has(cacheKey)) {
            return this.searchCache.get(cacheKey);
        }

        const searchOptions = {
            caseSensitive: false,
            exactMatch: false,
            searchFields: this.searchFields,
            ...options
        };

        const results = this.performSearch(data, normalizedTerm, searchOptions);
        
        // Cache results for performance
        this.searchCache.set(cacheKey, results);
        this.lastSearchTerm = normalizedTerm;
        this.lastSearchResults = results;

        return results;
    }

    /**
     * Perform the actual search operation
     * @param {Array} data - Data to search
     * @param {string} searchTerm - Normalized search term
     * @param {Object} options - Search options
     * @returns {Array} Search results
     */
    performSearch(data, searchTerm, options) {
        const { caseSensitive, exactMatch, searchFields } = options;
        
        return data.filter(item => {
            return searchFields.some(field => {
                const fieldValue = this.getFieldValue(item, field);
                if (!fieldValue) return false;

                const normalizedValue = caseSensitive ? 
                    fieldValue.toString() : 
                    fieldValue.toString().toLowerCase();

                const normalizedSearch = caseSensitive ? 
                    searchTerm : 
                    searchTerm.toLowerCase();

                if (exactMatch) {
                    return normalizedValue === normalizedSearch;
                } else {
                    return normalizedValue.includes(normalizedSearch);
                }
            });
        });
    }

    /**
     * Get field value from item with nested field support
     * @param {Object} item - Data item
     * @param {string} field - Field name (supports dot notation)
     * @returns {any} Field value
     */
    getFieldValue(item, field) {
        if (!item || !field) return null;

        // Support dot notation for nested fields
        const fieldParts = field.split('.');
        let value = item;

        for (const part of fieldParts) {
            if (value && typeof value === 'object' && part in value) {
                value = value[part];
            } else {
                return null;
            }
        }

        return value;
    }

    /**
     * Normalize search term for consistent searching
     * @param {string} term - Raw search term
     * @returns {string} Normalized search term
     */
    normalizeSearchTerm(term) {
        if (typeof term !== 'string') return '';
        
        return term
            .trim()
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .toLowerCase();
    }

    /**
     * Perform advanced search with multiple criteria
     * @param {Array} data - Data to search
     * @param {Object} criteria - Search criteria
     * @returns {Array} Search results
     */
    advancedSearch(data, criteria) {
        const {
            searchTerm = '',
            fields = this.searchFields,
            caseSensitive = false,
            exactMatch = false,
            minLength = 1
        } = criteria;

        if (searchTerm.length < minLength) {
            return data;
        }

        const options = {
            caseSensitive,
            exactMatch,
            searchFields: fields
        };

        return this.search(data, searchTerm, options);
    }

    /**
     * Search with highlighting for UI display
     * @param {Array} data - Data to search
     * @param {string} searchTerm - Search term
     * @param {Object} options - Search options
     * @returns {Array} Results with highlighted matches
     */
    searchWithHighlight(data, searchTerm, options = {}) {
        const results = this.search(data, searchTerm, options);
        
        if (!searchTerm || searchTerm.trim() === '') {
            return results.map(item => ({ ...item, _highlights: {} }));
        }

        const normalizedTerm = this.normalizeSearchTerm(searchTerm);
        
        return results.map(item => {
            const highlights = {};
            
            this.searchFields.forEach(field => {
                const fieldValue = this.getFieldValue(item, field);
                if (fieldValue) {
                    const highlighted = this.highlightMatches(
                        fieldValue.toString(), 
                        normalizedTerm,
                        options.caseSensitive
                    );
                    if (highlighted !== fieldValue.toString()) {
                        highlights[field] = highlighted;
                    }
                }
            });

            return {
                ...item,
                _highlights: highlights
            };
        });
    }

    /**
     * Highlight search matches in text
     * @param {string} text - Text to highlight
     * @param {string} searchTerm - Search term
     * @param {boolean} caseSensitive - Case sensitive search
     * @returns {string} Text with highlighted matches
     */
    highlightMatches(text, searchTerm, caseSensitive = false) {
        if (!text || !searchTerm) return text;

        const flags = caseSensitive ? 'g' : 'gi';
        const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedTerm})`, flags);

        return text.replace(regex, '<mark>$1</mark>');
    }

    /**
     * Get search suggestions based on existing data
     * @param {Array} data - Data for suggestions
     * @param {string} searchTerm - Current search term
     * @param {number} maxSuggestions - Maximum suggestions to return
     * @returns {Array} Array of suggestions
     */
    getSuggestions(data, searchTerm, maxSuggestions = 5) {
        if (!searchTerm || searchTerm.length < 2) {
            return [];
        }

        const normalizedTerm = this.normalizeSearchTerm(searchTerm);
        const suggestions = new Set();

        data.forEach(item => {
            this.searchFields.forEach(field => {
                const fieldValue = this.getFieldValue(item, field);
                if (fieldValue) {
                    const value = fieldValue.toString().toLowerCase();
                    if (value.includes(normalizedTerm) && value !== normalizedTerm) {
                        suggestions.add(fieldValue.toString());
                    }
                }
            });
        });

        return Array.from(suggestions)
            .slice(0, maxSuggestions)
            .sort((a, b) => {
                // Prioritize suggestions that start with the search term
                const aStarts = a.toLowerCase().startsWith(normalizedTerm);
                const bStarts = b.toLowerCase().startsWith(normalizedTerm);
                
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;
                
                return a.length - b.length; // Shorter suggestions first
            });
    }

    /**
     * Clear search cache
     */
    clearCache() {
        this.searchCache.clear();
        this.lastSearchTerm = '';
        this.lastSearchResults = [];
    }

    /**
     * Get search statistics
     * @returns {Object} Search statistics
     */
    getSearchStats() {
        return {
            cacheSize: this.searchCache.size,
            lastSearchTerm: this.lastSearchTerm,
            lastResultsCount: this.lastSearchResults.length,
            searchFields: this.searchFields
        };
    }

    /**
     * Configure search fields
     * @param {Array} fields - Array of field names to search
     */
    setSearchFields(fields) {
        if (Array.isArray(fields) && fields.length > 0) {
            this.searchFields = fields;
            this.clearCache(); // Clear cache when fields change
        }
    }

    /**
     * Add search field
     * @param {string} field - Field name to add
     */
    addSearchField(field) {
        if (field && !this.searchFields.includes(field)) {
            this.searchFields.push(field);
            this.clearCache();
        }
    }

    /**
     * Remove search field
     * @param {string} field - Field name to remove
     */
    removeSearchField(field) {
        const index = this.searchFields.indexOf(field);
        if (index > -1) {
            this.searchFields.splice(index, 1);
            this.clearCache();
        }
    }
}