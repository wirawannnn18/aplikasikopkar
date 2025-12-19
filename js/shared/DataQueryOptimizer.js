/**
 * Data Query Optimizer
 * Requirements: 4.1, 5.1 - Optimize unified data queries and transaction history pagination
 * 
 * Provides efficient database queries, caching for frequently accessed data,
 * and optimized transaction history pagination for the integrated payment interface.
 */

class DataQueryOptimizer {
    constructor(sharedServices) {
        this.sharedServices = sharedServices;
        
        // Query cache with LRU eviction
        this.queryCache = new Map();
        this.cacheAccessOrder = [];
        this.maxCacheSize = 100;
        this.defaultCacheTimeout = 5 * 60 * 1000; // 5 minutes
        
        // Index cache for fast lookups
        this.indexCache = new Map();
        
        // Query performance tracking
        this.performanceMetrics = {
            queryCount: 0,
            cacheHits: 0,
            cacheMisses: 0,
            averageQueryTime: 0,
            slowQueries: []
        };
        
        // Pagination cache
        this.paginationCache = new Map();
        this.defaultPageSize = 20;
        
        // Background optimization
        this.optimizationQueue = [];
        this.isOptimizing = false;
        
        console.log('DataQueryOptimizer initialized');
        
        // Start background optimization
        this._startBackgroundOptimization();
    }

    /**
     * Get optimized transaction history with caching and pagination
     * Requirements: 4.1 - Efficient database queries and pagination
     * @param {Object} filters - Query filters
     * @param {Object} options - Query options (pagination, sorting)
     * @returns {Object} Paginated transaction results
     */
    getTransactionHistory(filters = {}, options = {}) {
        const startTime = performance.now();
        
        try {
            // Normalize options
            const normalizedOptions = this._normalizeQueryOptions(options);
            
            // Generate cache key
            const cacheKey = this._generateCacheKey('transactions', filters, normalizedOptions);
            
            // Check cache first
            const cachedResult = this._getCachedQuery(cacheKey);
            if (cachedResult) {
                this.performanceMetrics.cacheHits++;
                return cachedResult;
            }
            
            this.performanceMetrics.cacheMisses++;
            
            // Get all transactions (with basic caching)
            const allTransactions = this._getAllTransactions();
            
            // Apply filters efficiently
            const filteredTransactions = this._applyFiltersOptimized(allTransactions, filters);
            
            // Apply sorting
            const sortedTransactions = this._applySorting(filteredTransactions, normalizedOptions.sort);
            
            // Apply pagination
            const paginatedResult = this._applyPagination(sortedTransactions, normalizedOptions.pagination);
            
            // Add metadata
            const result = {
                data: paginatedResult.data,
                pagination: {
                    ...paginatedResult.pagination,
                    totalRecords: filteredTransactions.length,
                    totalPages: Math.ceil(filteredTransactions.length / normalizedOptions.pagination.pageSize)
                },
                filters: filters,
                performance: {
                    queryTime: performance.now() - startTime,
                    cacheHit: false,
                    recordsProcessed: allTransactions.length,
                    recordsFiltered: filteredTransactions.length
                }
            };
            
            // Cache the result
            this._setCachedQuery(cacheKey, result);
            
            // Track performance
            this._trackQueryPerformance(startTime, result);
            
            return result;
            
        } catch (error) {
            console.error('Error in optimized transaction history query:', error);
            
            // Fallback to basic query
            return this._getFallbackTransactionHistory(filters, options);
        }
    }

    /**
     * Get optimized transaction statistics with caching
     * Requirements: 5.1 - Efficient data aggregation
     * @param {Object} filters - Query filters
     * @returns {Object} Transaction statistics
     */
    getTransactionStatistics(filters = {}) {
        const startTime = performance.now();
        
        try {
            // Generate cache key for statistics
            const cacheKey = this._generateCacheKey('statistics', filters);
            
            // Check cache first
            const cachedStats = this._getCachedQuery(cacheKey);
            if (cachedStats) {
                this.performanceMetrics.cacheHits++;
                return cachedStats;
            }
            
            this.performanceMetrics.cacheMisses++;
            
            // Get filtered transactions
            const transactions = this._getAllTransactions();
            const filteredTransactions = this._applyFiltersOptimized(transactions, filters);
            
            // Calculate statistics efficiently
            const statistics = this._calculateStatisticsOptimized(filteredTransactions);
            
            // Add performance metadata
            statistics.performance = {
                queryTime: performance.now() - startTime,
                cacheHit: false,
                recordsProcessed: filteredTransactions.length
            };
            
            // Cache the result
            this._setCachedQuery(cacheKey, statistics, 2 * 60 * 1000); // 2 minutes for stats
            
            return statistics;
            
        } catch (error) {
            console.error('Error in optimized statistics query:', error);
            return this._getFallbackStatistics(filters);
        }
    }

    /**
     * Get anggota data with optimized search
     * @param {string} searchTerm - Search term
     * @param {Object} options - Search options
     * @returns {Array} Matching anggota records
     */
    searchAnggota(searchTerm, options = {}) {
        const startTime = performance.now();
        
        try {
            if (!searchTerm || searchTerm.length < 2) {
                return [];
            }
            
            // Generate cache key
            const cacheKey = this._generateCacheKey('anggota-search', { searchTerm, options });
            
            // Check cache
            const cachedResult = this._getCachedQuery(cacheKey);
            if (cachedResult) {
                return cachedResult;
            }
            
            // Get anggota data with index
            const anggotaList = this._getAnggotaWithIndex();
            
            // Perform optimized search
            const results = this._performOptimizedSearch(anggotaList, searchTerm, options);
            
            // Cache results
            this._setCachedQuery(cacheKey, results, 10 * 60 * 1000); // 10 minutes
            
            return results;
            
        } catch (error) {
            console.error('Error in optimized anggota search:', error);
            return [];
        }
    }

    /**
     * Invalidate cache for specific data types
     * @param {string|Array} dataTypes - Data types to invalidate
     */
    invalidateCache(dataTypes = null) {
        if (!dataTypes) {
            // Clear all cache
            this.queryCache.clear();
            this.cacheAccessOrder.length = 0;
            this.paginationCache.clear();
            console.log('All query cache cleared');
            return;
        }
        
        const typesToClear = Array.isArray(dataTypes) ? dataTypes : [dataTypes];
        
        for (const [key, value] of this.queryCache.entries()) {
            for (const type of typesToClear) {
                if (key.startsWith(type)) {
                    this.queryCache.delete(key);
                    const index = this.cacheAccessOrder.indexOf(key);
                    if (index > -1) {
                        this.cacheAccessOrder.splice(index, 1);
                    }
                }
            }
        }
        
        console.log(`Cache invalidated for types: ${typesToClear.join(', ')}`);
    }

    /**
     * Get performance metrics
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        const totalQueries = this.performanceMetrics.queryCount;
        const cacheHitRate = totalQueries > 0 
            ? (this.performanceMetrics.cacheHits / totalQueries * 100).toFixed(2)
            : 0;
        
        return {
            ...this.performanceMetrics,
            cacheHitRate: `${cacheHitRate}%`,
            cacheSize: this.queryCache.size,
            indexCacheSize: this.indexCache.size
        };
    }

    // ===== PRIVATE METHODS =====

    /**
     * Get all transactions with basic caching
     * @private
     * @returns {Array} All transactions
     */
    _getAllTransactions() {
        const cacheKey = 'all-transactions';
        let transactions = this._getCachedQuery(cacheKey);
        
        if (!transactions) {
            // Load from localStorage
            transactions = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
            
            // Ensure all transactions have mode field for backward compatibility
            transactions = transactions.map(transaction => ({
                ...transaction,
                mode: transaction.mode || 'manual' // Default to manual for existing transactions
            }));
            
            // Cache for 1 minute (short cache for data that changes frequently)
            this._setCachedQuery(cacheKey, transactions, 60 * 1000);
        }
        
        return transactions;
    }

    /**
     * Get anggota data with search index
     * @private
     * @returns {Array} Anggota data with index
     */
    _getAnggotaWithIndex() {
        let anggotaData = this.indexCache.get('anggota-indexed');
        
        if (!anggotaData) {
            const rawData = JSON.parse(localStorage.getItem('anggotaList') || '[]');
            
            // Create search index
            anggotaData = rawData.map(anggota => ({
                ...anggota,
                searchText: `${anggota.nama || ''} ${anggota.nik || ''} ${anggota.id || ''}`.toLowerCase()
            }));
            
            this.indexCache.set('anggota-indexed', anggotaData);
            
            // Clear index cache after 10 minutes
            setTimeout(() => {
                this.indexCache.delete('anggota-indexed');
            }, 10 * 60 * 1000);
        }
        
        return anggotaData;
    }

    /**
     * Apply filters with optimization
     * @private
     * @param {Array} transactions - Transactions to filter
     * @param {Object} filters - Filters to apply
     * @returns {Array} Filtered transactions
     */
    _applyFiltersOptimized(transactions, filters) {
        if (!filters || Object.keys(filters).length === 0) {
            return transactions;
        }
        
        return transactions.filter(transaction => {
            // Mode filter
            if (filters.mode && transaction.mode !== filters.mode) {
                return false;
            }
            
            // Date range filter
            if (filters.startDate || filters.endDate) {
                const transactionDate = new Date(transaction.tanggal);
                
                if (filters.startDate && transactionDate < new Date(filters.startDate)) {
                    return false;
                }
                
                if (filters.endDate && transactionDate > new Date(filters.endDate)) {
                    return false;
                }
            }
            
            // Jenis filter
            if (filters.jenis && transaction.jenisPembayaran !== filters.jenis) {
                return false;
            }
            
            // Anggota filter
            if (filters.anggotaId && transaction.anggotaId !== filters.anggotaId) {
                return false;
            }
            
            // Amount range filter
            if (filters.minAmount && transaction.jumlah < filters.minAmount) {
                return false;
            }
            
            if (filters.maxAmount && transaction.jumlah > filters.maxAmount) {
                return false;
            }
            
            // Search term filter
            if (filters.searchTerm) {
                const searchTerm = filters.searchTerm.toLowerCase();
                const searchableText = `${transaction.anggotaNama || ''} ${transaction.keterangan || ''}`.toLowerCase();
                
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }
            
            return true;
        });
    }

    /**
     * Apply sorting with optimization
     * @private
     * @param {Array} transactions - Transactions to sort
     * @param {Object} sortOptions - Sort options
     * @returns {Array} Sorted transactions
     */
    _applySorting(transactions, sortOptions) {
        if (!sortOptions || !sortOptions.field) {
            // Default sort by date descending
            return transactions.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        }
        
        const { field, direction = 'desc' } = sortOptions;
        const multiplier = direction === 'asc' ? 1 : -1;
        
        return transactions.sort((a, b) => {
            let valueA = a[field];
            let valueB = b[field];
            
            // Handle different data types
            if (field === 'tanggal') {
                valueA = new Date(valueA);
                valueB = new Date(valueB);
            } else if (field === 'jumlah') {
                valueA = parseFloat(valueA) || 0;
                valueB = parseFloat(valueB) || 0;
            } else if (typeof valueA === 'string') {
                valueA = valueA.toLowerCase();
                valueB = (valueB || '').toLowerCase();
            }
            
            if (valueA < valueB) return -1 * multiplier;
            if (valueA > valueB) return 1 * multiplier;
            return 0;
        });
    }

    /**
     * Apply pagination with optimization
     * @private
     * @param {Array} transactions - Transactions to paginate
     * @param {Object} paginationOptions - Pagination options
     * @returns {Object} Paginated result
     */
    _applyPagination(transactions, paginationOptions) {
        const { page = 1, pageSize = this.defaultPageSize } = paginationOptions;
        
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        
        const paginatedData = transactions.slice(startIndex, endIndex);
        
        return {
            data: paginatedData,
            pagination: {
                currentPage: page,
                pageSize: pageSize,
                startIndex: startIndex,
                endIndex: Math.min(endIndex, transactions.length),
                hasNextPage: endIndex < transactions.length,
                hasPreviousPage: page > 1
            }
        };
    }

    /**
     * Calculate statistics with optimization
     * @private
     * @param {Array} transactions - Transactions to analyze
     * @returns {Object} Statistics
     */
    _calculateStatisticsOptimized(transactions) {
        const stats = {
            totalTransactions: transactions.length,
            totalAmount: 0,
            hutangTotal: 0,
            piutangTotal: 0,
            manualCount: 0,
            importCount: 0,
            byMode: {
                manual: { count: 0, amount: 0 },
                import: { count: 0, amount: 0 }
            },
            byJenis: {
                hutang: { count: 0, amount: 0 },
                piutang: { count: 0, amount: 0 }
            },
            dailyStats: new Map(),
            monthlyStats: new Map()
        };
        
        // Single pass calculation for efficiency
        for (const transaction of transactions) {
            const amount = parseFloat(transaction.jumlah) || 0;
            const mode = transaction.mode || 'manual';
            const jenis = transaction.jenisPembayaran;
            const date = new Date(transaction.tanggal);
            const dayKey = date.toISOString().split('T')[0];
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            // Total calculations
            stats.totalAmount += amount;
            
            // Mode statistics
            stats.byMode[mode].count++;
            stats.byMode[mode].amount += amount;
            
            if (mode === 'manual') stats.manualCount++;
            if (mode === 'import') stats.importCount++;
            
            // Jenis statistics
            if (jenis === 'hutang') {
                stats.hutangTotal += amount;
                stats.byJenis.hutang.count++;
                stats.byJenis.hutang.amount += amount;
            } else if (jenis === 'piutang') {
                stats.piutangTotal += amount;
                stats.byJenis.piutang.count++;
                stats.byJenis.piutang.amount += amount;
            }
            
            // Daily statistics
            if (!stats.dailyStats.has(dayKey)) {
                stats.dailyStats.set(dayKey, { count: 0, amount: 0 });
            }
            const dayStats = stats.dailyStats.get(dayKey);
            dayStats.count++;
            dayStats.amount += amount;
            
            // Monthly statistics
            if (!stats.monthlyStats.has(monthKey)) {
                stats.monthlyStats.set(monthKey, { count: 0, amount: 0 });
            }
            const monthStats = stats.monthlyStats.get(monthKey);
            monthStats.count++;
            monthStats.amount += amount;
        }
        
        // Convert Maps to Objects for JSON serialization
        stats.dailyStats = Object.fromEntries(stats.dailyStats);
        stats.monthlyStats = Object.fromEntries(stats.monthlyStats);
        
        // Calculate averages
        stats.averageAmount = stats.totalTransactions > 0 
            ? stats.totalAmount / stats.totalTransactions 
            : 0;
        
        return stats;
    }

    /**
     * Perform optimized search on anggota data
     * @private
     * @param {Array} anggotaList - Anggota data with index
     * @param {string} searchTerm - Search term
     * @param {Object} options - Search options
     * @returns {Array} Search results
     */
    _performOptimizedSearch(anggotaList, searchTerm, options) {
        const { limit = 10, includeInactive = false } = options;
        const term = searchTerm.toLowerCase();
        
        const results = [];
        
        for (const anggota of anggotaList) {
            // Skip inactive if not included
            if (!includeInactive && anggota.status === 'inactive') {
                continue;
            }
            
            // Check if search term matches
            if (anggota.searchText.includes(term)) {
                results.push({
                    id: anggota.id,
                    nama: anggota.nama,
                    nik: anggota.nik,
                    status: anggota.status
                });
                
                // Limit results for performance
                if (results.length >= limit) {
                    break;
                }
            }
        }
        
        return results;
    }

    /**
     * Normalize query options
     * @private
     * @param {Object} options - Raw options
     * @returns {Object} Normalized options
     */
    _normalizeQueryOptions(options) {
        return {
            pagination: {
                page: Math.max(1, parseInt(options.page) || 1),
                pageSize: Math.min(100, Math.max(1, parseInt(options.pageSize) || this.defaultPageSize))
            },
            sort: {
                field: options.sortField || 'tanggal',
                direction: ['asc', 'desc'].includes(options.sortDirection) ? options.sortDirection : 'desc'
            }
        };
    }

    /**
     * Generate cache key for query
     * @private
     * @param {string} type - Query type
     * @param {Object} filters - Filters
     * @param {Object} options - Options
     * @returns {string} Cache key
     */
    _generateCacheKey(type, filters, options = {}) {
        const keyParts = [type];
        
        // Add filters to key
        if (filters && Object.keys(filters).length > 0) {
            keyParts.push(JSON.stringify(filters));
        }
        
        // Add options to key
        if (options && Object.keys(options).length > 0) {
            keyParts.push(JSON.stringify(options));
        }
        
        return keyParts.join('|');
    }

    /**
     * Get cached query result
     * @private
     * @param {string} key - Cache key
     * @returns {*} Cached result or null
     */
    _getCachedQuery(key) {
        const cached = this.queryCache.get(key);
        
        if (!cached) {
            return null;
        }
        
        // Check expiry
        if (cached.expiry && Date.now() > cached.expiry) {
            this.queryCache.delete(key);
            const index = this.cacheAccessOrder.indexOf(key);
            if (index > -1) {
                this.cacheAccessOrder.splice(index, 1);
            }
            return null;
        }
        
        // Update access order for LRU
        const index = this.cacheAccessOrder.indexOf(key);
        if (index > -1) {
            this.cacheAccessOrder.splice(index, 1);
        }
        this.cacheAccessOrder.push(key);
        
        return cached.data;
    }

    /**
     * Set cached query result
     * @private
     * @param {string} key - Cache key
     * @param {*} data - Data to cache
     * @param {number} timeout - Cache timeout in ms
     */
    _setCachedQuery(key, data, timeout = this.defaultCacheTimeout) {
        // Implement LRU eviction
        if (this.queryCache.size >= this.maxCacheSize) {
            const oldestKey = this.cacheAccessOrder.shift();
            if (oldestKey) {
                this.queryCache.delete(oldestKey);
            }
        }
        
        this.queryCache.set(key, {
            data: data,
            expiry: timeout ? Date.now() + timeout : null,
            createdAt: Date.now()
        });
        
        this.cacheAccessOrder.push(key);
    }

    /**
     * Track query performance
     * @private
     * @param {number} startTime - Query start time
     * @param {Object} result - Query result
     */
    _trackQueryPerformance(startTime, result) {
        const queryTime = performance.now() - startTime;
        
        this.performanceMetrics.queryCount++;
        
        // Update average query time
        const totalTime = this.performanceMetrics.averageQueryTime * (this.performanceMetrics.queryCount - 1) + queryTime;
        this.performanceMetrics.averageQueryTime = totalTime / this.performanceMetrics.queryCount;
        
        // Track slow queries (> 100ms)
        if (queryTime > 100) {
            this.performanceMetrics.slowQueries.push({
                queryTime: queryTime,
                timestamp: new Date().toISOString(),
                recordsProcessed: result.performance?.recordsProcessed || 0
            });
            
            // Keep only last 10 slow queries
            if (this.performanceMetrics.slowQueries.length > 10) {
                this.performanceMetrics.slowQueries.shift();
            }
        }
    }

    /**
     * Start background optimization
     * @private
     */
    _startBackgroundOptimization() {
        // Clean expired cache every 5 minutes
        setInterval(() => {
            this._cleanExpiredCache();
        }, 5 * 60 * 1000);
        
        // Optimize indexes every 10 minutes
        setInterval(() => {
            this._optimizeIndexes();
        }, 10 * 60 * 1000);
    }

    /**
     * Clean expired cache entries
     * @private
     */
    _cleanExpiredCache() {
        const now = Date.now();
        const keysToDelete = [];
        
        for (const [key, cached] of this.queryCache.entries()) {
            if (cached.expiry && now > cached.expiry) {
                keysToDelete.push(key);
            }
        }
        
        for (const key of keysToDelete) {
            this.queryCache.delete(key);
            const index = this.cacheAccessOrder.indexOf(key);
            if (index > -1) {
                this.cacheAccessOrder.splice(index, 1);
            }
        }
        
        if (keysToDelete.length > 0) {
            console.log(`Cleaned ${keysToDelete.length} expired cache entries`);
        }
    }

    /**
     * Optimize search indexes
     * @private
     */
    _optimizeIndexes() {
        // Clear and rebuild anggota index if it's old
        const anggotaIndex = this.indexCache.get('anggota-indexed');
        if (anggotaIndex) {
            this.indexCache.delete('anggota-indexed');
            console.log('Anggota search index cleared for rebuild');
        }
    }

    /**
     * Fallback transaction history query
     * @private
     * @param {Object} filters - Filters
     * @param {Object} options - Options
     * @returns {Object} Basic result
     */
    _getFallbackTransactionHistory(filters, options) {
        try {
            const transactions = this.sharedServices.getTransactionHistory(filters);
            return {
                data: transactions,
                pagination: {
                    currentPage: 1,
                    pageSize: transactions.length,
                    totalRecords: transactions.length,
                    totalPages: 1
                },
                performance: {
                    queryTime: 0,
                    cacheHit: false,
                    fallback: true
                }
            };
        } catch (error) {
            console.error('Fallback query also failed:', error);
            return {
                data: [],
                pagination: { currentPage: 1, pageSize: 0, totalRecords: 0, totalPages: 0 },
                performance: { queryTime: 0, cacheHit: false, fallback: true, error: true }
            };
        }
    }

    /**
     * Fallback statistics query
     * @private
     * @param {Object} filters - Filters
     * @returns {Object} Basic statistics
     */
    _getFallbackStatistics(filters) {
        return {
            totalTransactions: 0,
            totalAmount: 0,
            performance: { queryTime: 0, cacheHit: false, fallback: true, error: true }
        };
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataQueryOptimizer };
} else if (typeof window !== 'undefined') {
    window.DataQueryOptimizer = DataQueryOptimizer;
}