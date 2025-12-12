/**
 * Cache Manager Module
 * Handles intelligent data caching with TTL, performance optimization, and memory management
 * 
 * **Feature: dashboard-analytics-kpi, Task 6.3: Caching and Performance Optimization**
 * **Validates: Requirements 6.1, 6.5, 8.1**
 */

class CacheManager {
    constructor(options = {}) {
        this.cache = new Map();
        this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5 minutes default
        this.maxCacheSize = options.maxCacheSize || 100; // Maximum number of cached items
        this.maxMemoryUsage = options.maxMemoryUsage || 50 * 1024 * 1024; // 50MB default
        this.cleanupInterval = options.cleanupInterval || 60 * 1000; // 1 minute cleanup interval
        
        // Performance metrics
        this.metrics = {
            hits: 0,
            misses: 0,
            evictions: 0,
            memoryUsage: 0,
            totalRequests: 0
        };
        
        // Start automatic cleanup
        this.startCleanupTimer();
        
        // Bind methods for proper context
        this.get = this.get.bind(this);
        this.set = this.set.bind(this);
        this.invalidate = this.invalidate.bind(this);
        this.clear = this.clear.bind(this);
    }

    /**
     * Get cached data by key
     * @param {string} key - Cache key
     * @returns {any|null} Cached data or null if not found/expired
     */
    get(key) {
        this.metrics.totalRequests++;
        
        const item = this.cache.get(key);
        
        if (!item) {
            this.metrics.misses++;
            return null;
        }
        
        // Check if item has expired
        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            this.metrics.misses++;
            this.updateMemoryUsage();
            return null;
        }
        
        // Update access time for LRU
        item.lastAccessed = Date.now();
        this.metrics.hits++;
        
        return item.data;
    }

    /**
     * Set cached data with TTL
     * @param {string} key - Cache key
     * @param {any} data - Data to cache
     * @param {number} ttl - Time to live in milliseconds (optional)
     * @returns {boolean} Success status
     */
    set(key, data, ttl = this.defaultTTL) {
        try {
            // Check memory constraints before adding
            const estimatedSize = this.estimateDataSize(data);
            
            if (this.metrics.memoryUsage + estimatedSize > this.maxMemoryUsage) {
                this.evictLRU();
            }
            
            // Check cache size constraints
            if (this.cache.size >= this.maxCacheSize) {
                this.evictLRU();
            }
            
            const now = Date.now();
            const item = {
                data: data,
                createdAt: now,
                lastAccessed: now,
                expiresAt: now + ttl,
                size: estimatedSize,
                ttl: ttl
            };
            
            this.cache.set(key, item);
            this.updateMemoryUsage();
            
            return true;
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    }

    /**
     * Invalidate specific cache key
     * @param {string} key - Cache key to invalidate
     * @returns {boolean} Success status
     */
    invalidate(key) {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.updateMemoryUsage();
        }
        return deleted;
    }

    /**
     * Invalidate cache keys matching pattern
     * @param {string|RegExp} pattern - Pattern to match keys
     * @returns {number} Number of keys invalidated
     */
    invalidatePattern(pattern) {
        let count = 0;
        const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
        
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
                count++;
            }
        }
        
        if (count > 0) {
            this.updateMemoryUsage();
        }
        
        return count;
    }

    /**
     * Clear all cached data
     */
    clear() {
        this.cache.clear();
        this.metrics.memoryUsage = 0;
        this.metrics.evictions = 0;
    }

    /**
     * Get or set cached data with a factory function
     * @param {string} key - Cache key
     * @param {Function} factory - Function to generate data if not cached
     * @param {number} ttl - Time to live in milliseconds (optional)
     * @returns {Promise<any>} Cached or generated data
     */
    async getOrSet(key, factory, ttl = this.defaultTTL) {
        let data = this.get(key);
        
        if (data !== null) {
            return data;
        }
        
        try {
            data = await factory();
            this.set(key, data, ttl);
            return data;
        } catch (error) {
            console.error('Cache factory error:', error);
            throw error;
        }
    }

    /**
     * Preload data into cache
     * @param {Array} preloadItems - Array of {key, factory, ttl} objects
     * @returns {Promise<Array>} Results of preload operations
     */
    async preload(preloadItems) {
        const results = [];
        
        for (const item of preloadItems) {
            try {
                const data = await this.getOrSet(item.key, item.factory, item.ttl);
                results.push({ key: item.key, success: true, data });
            } catch (error) {
                results.push({ key: item.key, success: false, error: error.message });
            }
        }
        
        return results;
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache performance metrics
     */
    getStats() {
        const hitRate = this.metrics.totalRequests > 0 
            ? (this.metrics.hits / this.metrics.totalRequests * 100).toFixed(2)
            : 0;
            
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            memoryUsage: this.metrics.memoryUsage,
            maxMemoryUsage: this.maxMemoryUsage,
            memoryUsagePercent: ((this.metrics.memoryUsage / this.maxMemoryUsage) * 100).toFixed(2),
            hits: this.metrics.hits,
            misses: this.metrics.misses,
            hitRate: hitRate + '%',
            evictions: this.metrics.evictions,
            totalRequests: this.metrics.totalRequests
        };
    }

    /**
     * Get detailed cache information
     * @returns {Array} Array of cache items with metadata
     */
    getCacheInfo() {
        const items = [];
        const now = Date.now();
        
        for (const [key, item] of this.cache.entries()) {
            items.push({
                key,
                size: item.size,
                age: now - item.createdAt,
                ttl: item.ttl,
                timeToExpire: Math.max(0, item.expiresAt - now),
                lastAccessed: now - item.lastAccessed,
                expired: now > item.expiresAt
            });
        }
        
        return items.sort((a, b) => b.lastAccessed - a.lastAccessed);
    }

    /**
     * Cleanup expired items
     * @returns {number} Number of items cleaned up
     */
    cleanup() {
        let cleaned = 0;
        const now = Date.now();
        
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiresAt) {
                this.cache.delete(key);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            this.updateMemoryUsage();
        }
        
        return cleaned;
    }

    /**
     * Evict least recently used items
     * @param {number} count - Number of items to evict (default: 1)
     */
    evictLRU(count = 1) {
        const items = Array.from(this.cache.entries())
            .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
        
        for (let i = 0; i < Math.min(count, items.length); i++) {
            this.cache.delete(items[i][0]);
            this.metrics.evictions++;
        }
        
        this.updateMemoryUsage();
    }

    /**
     * Estimate data size in bytes
     * @param {any} data - Data to estimate
     * @returns {number} Estimated size in bytes
     */
    estimateDataSize(data) {
        try {
            if (data === null || data === undefined) return 0;
            
            if (typeof data === 'string') {
                return data.length * 2; // UTF-16 encoding
            }
            
            if (typeof data === 'number') {
                return 8; // 64-bit number
            }
            
            if (typeof data === 'boolean') {
                return 4;
            }
            
            if (data instanceof Date) {
                return 8;
            }
            
            if (Array.isArray(data)) {
                return data.reduce((size, item) => size + this.estimateDataSize(item), 0);
            }
            
            if (typeof data === 'object') {
                return JSON.stringify(data).length * 2;
            }
            
            return 0;
        } catch (error) {
            // Fallback estimation
            return 1024; // 1KB default
        }
    }

    /**
     * Update memory usage metrics
     */
    updateMemoryUsage() {
        let totalSize = 0;
        
        for (const item of this.cache.values()) {
            totalSize += item.size;
        }
        
        this.metrics.memoryUsage = totalSize;
    }

    /**
     * Start automatic cleanup timer
     */
    startCleanupTimer() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        
        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, this.cleanupInterval);
    }

    /**
     * Stop automatic cleanup timer
     */
    stopCleanupTimer() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
    }

    /**
     * Destroy cache manager and cleanup resources
     */
    destroy() {
        this.stopCleanupTimer();
        this.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CacheManager;
}