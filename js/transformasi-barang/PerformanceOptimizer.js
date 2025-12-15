/**
 * PerformanceOptimizer - Optimasi performa untuk sistem transformasi barang
 * 
 * Kelas ini menyediakan berbagai optimasi performa termasuk caching,
 * debouncing, lazy loading, dan batch processing.
 */

class PerformanceOptimizer {
    constructor() {
        this.cache = new Map();
        this.debounceTimers = new Map();
        this.batchQueue = new Map();
        this.initialized = false;
        
        // Performance monitoring
        this.performanceMetrics = {
            cacheHits: 0,
            cacheMisses: 0,
            operationTimes: [],
            memoryUsage: []
        };
    }

    /**
     * Initialize PerformanceOptimizer
     */
    initialize() {
        this.initialized = true;
        this._startPerformanceMonitoring();
    }

    /**
     * Cache dengan TTL (Time To Live)
     * @param {string} key - Cache key
     * @param {Function} dataProvider - Function yang menyediakan data jika cache miss
     * @param {number} ttl - Time to live dalam milliseconds (default: 5 menit)
     * @returns {Promise<any>} Cached atau fresh data
     */
    async getCachedData(key, dataProvider, ttl = 300000) {
        this._ensureInitialized();
        
        const now = Date.now();
        const cached = this.cache.get(key);

        // Cache hit - return cached data if not expired
        if (cached && (now - cached.timestamp) < ttl) {
            this.performanceMetrics.cacheHits++;
            return cached.data;
        }

        // Cache miss - fetch fresh data
        this.performanceMetrics.cacheMisses++;
        
        try {
            const startTime = performance.now();
            const freshData = await dataProvider();
            const endTime = performance.now();
            
            // Store in cache
            this.cache.set(key, {
                data: freshData,
                timestamp: now
            });

            // Record performance metric
            this.performanceMetrics.operationTimes.push({
                operation: key,
                duration: endTime - startTime,
                timestamp: now
            });

            return freshData;
        } catch (error) {
            console.error(`Error fetching data for cache key ${key}:`, error);
            throw error;
        }
    }

    /**
     * Invalidate cache untuk key tertentu atau semua cache
     * @param {string} [key] - Specific key to invalidate, atau undefined untuk clear all
     */
    invalidateCache(key = null) {
        this._ensureInitialized();
        
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    }

    /**
     * Debounce function calls untuk mengurangi excessive operations
     * @param {string} key - Unique key untuk debounce timer
     * @param {Function} func - Function yang akan di-debounce
     * @param {number} delay - Delay dalam milliseconds (default: 300ms)
     * @returns {Promise} Promise yang resolve dengan hasil function
     */
    debounce(key, func, delay = 300) {
        this._ensureInitialized();
        
        return new Promise((resolve, reject) => {
            // Clear existing timer
            if (this.debounceTimers.has(key)) {
                clearTimeout(this.debounceTimers.get(key));
            }

            // Set new timer
            const timer = setTimeout(async () => {
                try {
                    const result = await func();
                    resolve(result);
                } catch (error) {
                    reject(error);
                } finally {
                    this.debounceTimers.delete(key);
                }
            }, delay);

            this.debounceTimers.set(key, timer);
        });
    }

    /**
     * Batch processing untuk mengurangi individual operations
     * @param {string} batchKey - Key untuk batch group
     * @param {any} item - Item yang akan di-batch
     * @param {Function} processor - Function untuk memproses batch
     * @param {number} batchSize - Maximum batch size (default: 10)
     * @param {number} maxWait - Maximum wait time dalam ms (default: 1000ms)
     * @returns {Promise} Promise yang resolve ketika item diproses
     */
    addToBatch(batchKey, item, processor, batchSize = 10, maxWait = 1000) {
        this._ensureInitialized();
        
        return new Promise((resolve, reject) => {
            // Get or create batch
            if (!this.batchQueue.has(batchKey)) {
                this.batchQueue.set(batchKey, {
                    items: [],
                    promises: [],
                    timer: null,
                    processor: processor
                });
            }

            const batch = this.batchQueue.get(batchKey);
            
            // Add item and promise to batch
            batch.items.push(item);
            batch.promises.push({ resolve, reject });

            // Process batch if it reaches size limit
            if (batch.items.length >= batchSize) {
                this._processBatch(batchKey);
                return;
            }

            // Set timer for maximum wait time
            if (!batch.timer) {
                batch.timer = setTimeout(() => {
                    this._processBatch(batchKey);
                }, maxWait);
            }
        });
    }

    /**
     * Lazy loading untuk data yang tidak immediately needed
     * @param {Function} dataLoader - Function untuk load data
     * @param {Object} options - Options untuk lazy loading
     * @returns {Function} Lazy loader function
     */
    createLazyLoader(dataLoader, options = {}) {
        this._ensureInitialized();
        
        const {
            cacheKey = null,
            ttl = 300000,
            retryCount = 3,
            retryDelay = 1000
        } = options;

        let loadPromise = null;
        let loaded = false;

        return async () => {
            // Return cached result if already loaded
            if (loaded && cacheKey && this.cache.has(cacheKey)) {
                return this.getCachedData(cacheKey, dataLoader, ttl);
            }

            // Return existing promise if already loading
            if (loadPromise) {
                return loadPromise;
            }

            // Start loading
            loadPromise = this._loadWithRetry(dataLoader, retryCount, retryDelay);
            
            try {
                const result = await loadPromise;
                loaded = true;
                
                // Cache result if cache key provided
                if (cacheKey) {
                    this.cache.set(cacheKey, {
                        data: result,
                        timestamp: Date.now()
                    });
                }
                
                return result;
            } catch (error) {
                loadPromise = null; // Reset promise on error
                throw error;
            }
        };
    }

    /**
     * Throttle function untuk limit execution frequency
     * @param {string} key - Unique key untuk throttle
     * @param {Function} func - Function yang akan di-throttle
     * @param {number} limit - Limit dalam milliseconds
     * @returns {Promise|null} Promise atau null jika throttled
     */
    throttle(key, func, limit = 1000) {
        this._ensureInitialized();
        
        const now = Date.now();
        const lastExecution = this.cache.get(`throttle_${key}`);

        if (lastExecution && (now - lastExecution.timestamp) < limit) {
            return null; // Throttled
        }

        // Update last execution time
        this.cache.set(`throttle_${key}`, {
            timestamp: now
        });

        return func();
    }

    /**
     * Memory optimization - cleanup unused cache entries
     * @param {number} maxCacheSize - Maximum cache entries (default: 1000)
     * @param {number} maxAge - Maximum age dalam ms (default: 1 hour)
     */
    optimizeMemory(maxCacheSize = 1000, maxAge = 3600000) {
        this._ensureInitialized();
        
        const now = Date.now();
        const entries = Array.from(this.cache.entries());

        // Remove expired entries
        const validEntries = entries.filter(([key, value]) => {
            const age = now - (value.timestamp || 0);
            return age < maxAge;
        });

        // Remove oldest entries if over size limit
        if (validEntries.length > maxCacheSize) {
            validEntries.sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0));
            validEntries.splice(maxCacheSize);
        }

        // Rebuild cache
        this.cache.clear();
        validEntries.forEach(([key, value]) => {
            this.cache.set(key, value);
        });

        // Record memory usage
        this.performanceMetrics.memoryUsage.push({
            timestamp: now,
            cacheSize: this.cache.size,
            entriesRemoved: entries.length - validEntries.length
        });
    }

    /**
     * Get performance metrics
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        this._ensureInitialized();
        
        const totalOperations = this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses;
        const cacheHitRate = totalOperations > 0 ? (this.performanceMetrics.cacheHits / totalOperations) * 100 : 0;
        
        const recentOperations = this.performanceMetrics.operationTimes.slice(-100);
        const avgOperationTime = recentOperations.length > 0 
            ? recentOperations.reduce((sum, op) => sum + op.duration, 0) / recentOperations.length 
            : 0;

        return {
            cacheHitRate: Math.round(cacheHitRate * 100) / 100,
            totalCacheHits: this.performanceMetrics.cacheHits,
            totalCacheMisses: this.performanceMetrics.cacheMisses,
            currentCacheSize: this.cache.size,
            averageOperationTime: Math.round(avgOperationTime * 100) / 100,
            recentOperations: recentOperations.slice(-10), // Last 10 operations
            memoryOptimizations: this.performanceMetrics.memoryUsage.slice(-5) // Last 5 optimizations
        };
    }

    /**
     * Reset performance metrics
     */
    resetMetrics() {
        this._ensureInitialized();
        
        this.performanceMetrics = {
            cacheHits: 0,
            cacheMisses: 0,
            operationTimes: [],
            memoryUsage: []
        };
    }

    /**
     * Preload data untuk improve perceived performance
     * @param {Array} preloadTasks - Array of {key, dataProvider} objects
     * @returns {Promise} Promise yang resolve ketika semua preload selesai
     */
    async preloadData(preloadTasks) {
        this._ensureInitialized();
        
        const preloadPromises = preloadTasks.map(async ({ key, dataProvider, ttl = 300000 }) => {
            try {
                await this.getCachedData(key, dataProvider, ttl);
            } catch (error) {
                console.warn(`Preload failed for ${key}:`, error);
            }
        });

        await Promise.allSettled(preloadPromises);
    }

    /**
     * Process batch queue
     * @param {string} batchKey - Batch key to process
     * @private
     */
    async _processBatch(batchKey) {
        const batch = this.batchQueue.get(batchKey);
        if (!batch || batch.items.length === 0) return;

        // Clear timer
        if (batch.timer) {
            clearTimeout(batch.timer);
        }

        // Extract batch data
        const items = [...batch.items];
        const promises = [...batch.promises];
        
        // Clear batch
        batch.items = [];
        batch.promises = [];
        batch.timer = null;

        try {
            // Process batch
            const results = await batch.processor(items);
            
            // Resolve all promises
            promises.forEach((promise, index) => {
                promise.resolve(results[index]);
            });
        } catch (error) {
            // Reject all promises
            promises.forEach(promise => {
                promise.reject(error);
            });
        }
    }

    /**
     * Load data with retry mechanism
     * @param {Function} dataLoader - Data loader function
     * @param {number} retryCount - Number of retries
     * @param {number} retryDelay - Delay between retries
     * @returns {Promise} Promise dengan hasil atau error
     * @private
     */
    async _loadWithRetry(dataLoader, retryCount, retryDelay) {
        let lastError;
        
        for (let attempt = 0; attempt <= retryCount; attempt++) {
            try {
                return await dataLoader();
            } catch (error) {
                lastError = error;
                
                if (attempt < retryCount) {
                    // Wait before retry with exponential backoff
                    const delay = retryDelay * Math.pow(2, attempt);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Start performance monitoring
     * @private
     */
    _startPerformanceMonitoring() {
        // Auto memory optimization every 10 minutes
        setInterval(() => {
            this.optimizeMemory();
        }, 600000);

        // Performance metrics cleanup every hour
        setInterval(() => {
            // Keep only last 1000 operation times
            if (this.performanceMetrics.operationTimes.length > 1000) {
                this.performanceMetrics.operationTimes = 
                    this.performanceMetrics.operationTimes.slice(-1000);
            }

            // Keep only last 100 memory usage records
            if (this.performanceMetrics.memoryUsage.length > 100) {
                this.performanceMetrics.memoryUsage = 
                    this.performanceMetrics.memoryUsage.slice(-100);
            }
        }, 3600000);
    }

    /**
     * Memastikan PerformanceOptimizer sudah diinisialisasi
     * @private
     */
    _ensureInitialized() {
        if (!this.initialized) {
            throw new Error('PerformanceOptimizer belum diinisialisasi. Panggil initialize() terlebih dahulu.');
        }
    }
}

// Export untuk browser dan Node.js
if (typeof window !== 'undefined') {
    window.PerformanceOptimizer = PerformanceOptimizer;
}

// ES6 module export (commented out for browser compatibility)
// export default PerformanceOptimizer;