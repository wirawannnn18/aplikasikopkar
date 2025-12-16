/**
 * Master Barang Komprehensif - Query Builder
 * Builds search queries and combines search with filters
 */

import { SearchEngine } from './SearchEngine.js';
import { FilterManager } from './FilterManager.js';

export class QueryBuilder {
    constructor() {
        this.searchEngine = new SearchEngine();
        this.filterManager = new FilterManager();
        this.queryCache = new Map();
        this.sortOptions = {
            field: 'nama',
            order: 'asc'
        };
        this.paginationOptions = {
            page: 1,
            limit: 20
        };
    }

    /**
     * Execute complete query with search, filters, sorting, and pagination
     * @param {Array} data - Source data
     * @param {Object} queryOptions - Query options
     * @returns {Object} Query results with metadata
     */
    executeQuery(data, queryOptions = {}) {
        const {
            searchTerm = '',
            filters = {},
            sortBy = 'nama',
            sortOrder = 'asc',
            page = 1,
            limit = 20,
            useCache = true
        } = queryOptions;

        // Generate cache key
        const cacheKey = this.generateQueryCacheKey(data, queryOptions);
        
        if (useCache && this.queryCache.has(cacheKey)) {
            return this.queryCache.get(cacheKey);
        }

        // Step 1: Apply search
        let results = this.applySearch(data, searchTerm);

        // Step 2: Apply filters
        results = this.applyFilters(results, filters);

        // Step 3: Apply sorting
        results = this.applySorting(results, sortBy, sortOrder);

        // Step 4: Calculate pagination metadata
        const totalItems = results.length;
        const totalPages = Math.ceil(totalItems / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        // Step 5: Apply pagination
        const paginatedResults = results.slice(startIndex, endIndex);

        const queryResult = {
            data: paginatedResults,
            pagination: {
                page: page,
                limit: limit,
                totalItems: totalItems,
                totalPages: totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
                startIndex: startIndex + 1,
                endIndex: Math.min(endIndex, totalItems)
            },
            query: {
                searchTerm: searchTerm,
                filters: filters,
                sortBy: sortBy,
                sortOrder: sortOrder
            },
            metadata: {
                searchResultsCount: this.getSearchResultsCount(data, searchTerm),
                filterResultsCount: this.getFilterResultsCount(data, filters),
                executionTime: Date.now()
            }
        };

        // Cache result
        if (useCache) {
            this.queryCache.set(cacheKey, queryResult);
        }

        return queryResult;
    }

    /**
     * Apply search to data
     * @param {Array} data - Source data
     * @param {string} searchTerm - Search term
     * @returns {Array} Search results
     */
    applySearch(data, searchTerm) {
        if (!searchTerm || searchTerm.trim() === '') {
            return data;
        }

        return this.searchEngine.search(data, searchTerm);
    }

    /**
     * Apply filters to data
     * @param {Array} data - Source data
     * @param {Object} filters - Filter options
     * @returns {Array} Filtered results
     */
    applyFilters(data, filters) {
        if (!filters || Object.keys(filters).length === 0) {
            return data;
        }

        // Set filters in filter manager
        Object.entries(filters).forEach(([filterName, value]) => {
            this.filterManager.setFilter(filterName, value);
        });

        return this.filterManager.applyFilters(data);
    }

    /**
     * Apply sorting to data
     * @param {Array} data - Source data
     * @param {string} sortBy - Field to sort by
     * @param {string} sortOrder - Sort order (asc/desc)
     * @returns {Array} Sorted results
     */
    applySorting(data, sortBy, sortOrder) {
        if (!sortBy) {
            return data;
        }

        return [...data].sort((a, b) => {
            const aValue = this.getFieldValue(a, sortBy);
            const bValue = this.getFieldValue(b, sortBy);

            let comparison = 0;

            // Handle null/undefined values
            if (aValue === null || aValue === undefined) {
                comparison = bValue === null || bValue === undefined ? 0 : 1;
            } else if (bValue === null || bValue === undefined) {
                comparison = -1;
            } else {
                // Compare values based on type
                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    comparison = aValue - bValue;
                } else if (typeof aValue === 'string' && typeof bValue === 'string') {
                    comparison = aValue.localeCompare(bValue, 'id', { numeric: true });
                } else {
                    // Convert to string for comparison
                    comparison = aValue.toString().localeCompare(bValue.toString(), 'id', { numeric: true });
                }
            }

            return sortOrder === 'desc' ? -comparison : comparison;
        });
    }

    /**
     * Get field value with nested field support
     * @param {Object} item - Data item
     * @param {string} field - Field name
     * @returns {any} Field value
     */
    getFieldValue(item, field) {
        if (!item || !field) return null;

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
     * Build query for specific search criteria
     * @param {Object} criteria - Search criteria
     * @returns {Object} Built query
     */
    buildQuery(criteria) {
        const {
            searchTerm = '',
            kategori_id = null,
            satuan_id = null,
            status = null,
            lowStock = false,
            priceRange = null,
            stockRange = null,
            dateRange = null
        } = criteria;

        const query = {
            searchTerm: searchTerm,
            filters: {}
        };

        // Add filters based on criteria
        if (kategori_id) {
            query.filters.kategori = kategori_id;
        }

        if (satuan_id) {
            query.filters.satuan = satuan_id;
        }

        if (status) {
            query.filters.status = status;
        }

        if (lowStock) {
            query.filters.low_stock = true;
        }

        if (priceRange && (priceRange.min !== undefined || priceRange.max !== undefined)) {
            query.filters.price_range = priceRange;
        }

        if (stockRange && (stockRange.min !== undefined || stockRange.max !== undefined)) {
            query.filters.stock_level = stockRange;
        }

        if (dateRange && (dateRange.start || dateRange.end)) {
            query.filters.created_date = dateRange;
        }

        return query;
    }

    /**
     * Get search suggestions
     * @param {Array} data - Source data
     * @param {string} searchTerm - Current search term
     * @param {number} maxSuggestions - Maximum suggestions
     * @returns {Array} Search suggestions
     */
    getSearchSuggestions(data, searchTerm, maxSuggestions = 5) {
        return this.searchEngine.getSuggestions(data, searchTerm, maxSuggestions);
    }

    /**
     * Get filter options for UI
     * @param {string} filterName - Filter name
     * @param {Array} data - Source data
     * @returns {Array} Filter options
     */
    getFilterOptions(filterName, data) {
        return this.filterManager.getFilterOptions(filterName, data);
    }

    /**
     * Get active filters summary
     * @returns {Array} Active filters summary
     */
    getActiveFiltersSummary() {
        return this.filterManager.getFilterSummary();
    }

    /**
     * Clear specific filter
     * @param {string} filterName - Filter name
     */
    clearFilter(filterName) {
        this.filterManager.removeFilter(filterName);
        this.clearQueryCache();
    }

    /**
     * Clear all filters
     */
    clearAllFilters() {
        this.filterManager.clearAllFilters();
        this.clearQueryCache();
    }

    /**
     * Set sort options
     * @param {string} field - Field to sort by
     * @param {string} order - Sort order (asc/desc)
     */
    setSortOptions(field, order) {
        this.sortOptions = { field, order };
        this.clearQueryCache();
    }

    /**
     * Set pagination options
     * @param {number} page - Page number
     * @param {number} limit - Items per page
     */
    setPaginationOptions(page, limit) {
        this.paginationOptions = { page, limit };
        this.clearQueryCache();
    }

    /**
     * Get search results count without pagination
     * @param {Array} data - Source data
     * @param {string} searchTerm - Search term
     * @returns {number} Results count
     */
    getSearchResultsCount(data, searchTerm) {
        if (!searchTerm || searchTerm.trim() === '') {
            return data.length;
        }
        return this.searchEngine.search(data, searchTerm).length;
    }

    /**
     * Get filter results count without pagination
     * @param {Array} data - Source data
     * @param {Object} filters - Filters
     * @returns {number} Results count
     */
    getFilterResultsCount(data, filters) {
        if (!filters || Object.keys(filters).length === 0) {
            return data.length;
        }
        return this.applyFilters(data, filters).length;
    }

    /**
     * Generate cache key for query
     * @param {Array} data - Source data
     * @param {Object} queryOptions - Query options
     * @returns {string} Cache key
     */
    generateQueryCacheKey(data, queryOptions) {
        const keyParts = [
            `data:${data.length}`,
            `search:${queryOptions.searchTerm || ''}`,
            `filters:${JSON.stringify(queryOptions.filters || {})}`,
            `sort:${queryOptions.sortBy || 'nama'}:${queryOptions.sortOrder || 'asc'}`,
            `page:${queryOptions.page || 1}:${queryOptions.limit || 20}`
        ];

        return keyParts.join('|');
    }

    /**
     * Clear query cache
     */
    clearQueryCache() {
        this.queryCache.clear();
        this.searchEngine.clearCache();
        this.filterManager.clearCache();
    }

    /**
     * Get query statistics
     * @returns {Object} Query statistics
     */
    getQueryStats() {
        return {
            queryCacheSize: this.queryCache.size,
            searchStats: this.searchEngine.getSearchStats(),
            filterStats: this.filterManager.getFilterStats(),
            sortOptions: this.sortOptions,
            paginationOptions: this.paginationOptions
        };
    }

    /**
     * Validate query options
     * @param {Object} queryOptions - Query options to validate
     * @returns {Object} Validation result
     */
    validateQueryOptions(queryOptions) {
        const errors = [];
        const warnings = [];

        // Validate pagination
        if (queryOptions.page && (queryOptions.page < 1 || !Number.isInteger(queryOptions.page))) {
            errors.push('Page number must be a positive integer');
        }

        if (queryOptions.limit && (queryOptions.limit < 1 || queryOptions.limit > 1000)) {
            errors.push('Limit must be between 1 and 1000');
        }

        // Validate sort order
        if (queryOptions.sortOrder && !['asc', 'desc'].includes(queryOptions.sortOrder)) {
            errors.push('Sort order must be "asc" or "desc"');
        }

        // Validate search term length
        if (queryOptions.searchTerm && queryOptions.searchTerm.length > 100) {
            warnings.push('Search term is very long, consider shortening it');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Export query configuration
     * @returns {Object} Query configuration
     */
    exportConfig() {
        return {
            sortOptions: this.sortOptions,
            paginationOptions: this.paginationOptions,
            filterConfig: this.filterManager.exportConfig(),
            searchFields: this.searchEngine.searchFields
        };
    }

    /**
     * Import query configuration
     * @param {Object} config - Query configuration
     */
    importConfig(config) {
        if (config.sortOptions) {
            this.sortOptions = config.sortOptions;
        }

        if (config.paginationOptions) {
            this.paginationOptions = config.paginationOptions;
        }

        if (config.filterConfig) {
            this.filterManager.importConfig(config.filterConfig);
        }

        if (config.searchFields) {
            this.searchEngine.setSearchFields(config.searchFields);
        }

        this.clearQueryCache();
    }
}