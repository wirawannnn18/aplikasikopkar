/**
 * Master Barang Komprehensif - Optimized Storage Manager
 * Provides optimized localStorage operations with caching and batch processing
 */

export class OptimizedStorageManager {
    constructor() {
        this.cache = new Map();
        this.batchOperations = [];
        this.batchTimeout = null;
        this.compressionEnabled = true;
        this.cacheEnabled = true;
        this.batchDelay = 10; // ms
        this.maxCacheSize = 1000;
        this.statistics = {
            cacheHits: 0,
            cacheMisses: 0,
            batchOperations: 0,
            compressionSavings: 0
        };
    }
    
    /**
     * Batch write operation for better performance
     * @param {string} key - Storage key
     * @param {*} data - Data to store
     */
    batchWrite(key, data) {
        this.batchOperations.push({ type: 'write', key, data });
        
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
        }
        
        this.batchTimeout = setTimeout(() => {
            this.flushBatch();
        }, this.batchDelay);
    }
    
    /**
     * Batch delete operation
     * @param {string} key - Storage key
     */
    batchDelete(key) {
        this.batchOperations.push({ type: 'delete', key });
        
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
        }
        
        this.batchTimeout = setTimeout(() => {
            this.flushBatch();
        }, this.batchDelay);
    }
    
    /**
     * Flush all batched operations
     */
    flushBatch() {
        if (this.batchOperations.length === 0) return;
        
        const operations = [...this.batchOperations];
        this.batchOperations = [];
        this.statistics.batchOperations += operations.length;
        
        operations.forEach(op => {
            try {
                if (op.type === 'write') {
                    const originalSize = JSON.stringify(op.data).length;
                    const serialized = this.compressionEnabled ? 
                        this.compress(JSON.stringify(op.data)) : 
                        JSON.stringify(op.data);
                    
                    localStorage.setItem(op.key, serialized);
                    
                    // Update cache
                    if (this.cacheEnabled) {
                        this.updateCache(op.key, op.data);
                    }
                    
                    // Track compression savings
                    if (this.compressionEnabled) {
                        this.statistics.compressionSavings += originalSize - serialized.length;
                    }
                    
                } else if (op.type === 'delete') {
                    localStorage.removeItem(op.key);
                    
                    // Remove from cache
                    if (this.cacheEnabled) {
                        this.cache.delete(op.key);
                    }
                }
            } catch (error) {
                console.error(`Batch operation failed for key ${op.key}:`, error);
            }
        });
    }
    
    /**
     * Read data with caching support
     * @param {string} key - Storage key
     * @returns {*} Stored data or null
     */
    read(key) {
        // Check cache first
        if (this.cacheEnabled && this.cache.has(key)) {
            this.statistics.cacheHits++;
            return this.cache.get(key);
        }
        
        this.statistics.cacheMisses++;
        
        const stored = localStorage.getItem(key);
        if (stored) {
            try {
                const decompressed = this.compressionEnabled ? 
                    this.decompress(stored) : stored;
                const data = JSON.parse(decompressed);
                
                // Update cache
                if (this.cacheEnabled) {
                    this.updateCache(key, data);
                }
                
                return data;
            } catch (error) {
                console.error('Error reading from storage:', error);
                return null;
            }
        }
        return null;
    }
    
    /**
     * Synchronous write operation (bypasses batching)
     * @param {string} key - Storage key
     * @param {*} data - Data to store
     * @returns {boolean} Success status
     */
    write(key, data) {
        try {
            const originalSize = JSON.stringify(data).length;
            const serialized = this.compressionEnabled ? 
                this.compress(JSON.stringify(data)) : 
                JSON.stringify(data);
            
            localStorage.setItem(key, serialized);
            
            // Update cache
            if (this.cacheEnabled) {
                this.updateCache(key, data);
            }
            
            // Track compression savings
            if (this.compressionEnabled) {
                this.statistics.compressionSavings += originalSize - serialized.length;
            }
            
            return true;
        } catch (error) {
            console.error('Error writing to storage:', error);
            return false;
        }
    }
    
    /**
     * Delete data
     * @param {string} key - Storage key
     * @returns {boolean} Success status
     */
    delete(key) {
        try {
            localStorage.removeItem(key);
            
            // Remove from cache
            if (this.cacheEnabled) {
                this.cache.delete(key);
            }
            
            return true;
        } catch (error) {
            console.error('Error deleting from storage:', error);
            return false;
        }
    }
    
    /**
     * Update cache with size management
     * @param {string} key - Cache key
     * @param {*} data - Data to cache
     */
    updateCache(key, data) {
        // Manage cache size
        if (this.cache.size >= this.maxCacheSize) {
            // Remove oldest entry (simple LRU)
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, data);
    }
    
    /**
     * Simple compression for large datasets
     * @param {string} data - Data to compress
     * @returns {string} Compressed data
     */
    compress(data) {
        // Basic compression - remove extra whitespace and common patterns
        return data
            .replace(/\s+/g, ' ')
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']')
            .replace(/{\s*/g, '{')
            .replace(/\[\s*/g, '[')
            .trim();
    }
    
    /**
     * Decompress data
     * @param {string} data - Compressed data
     * @returns {string} Decompressed data
     */
    decompress(data) {
        // For basic compression, no decompression needed
        return data;
    }
    
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
    
    /**
     * Clear all storage and cache
     */
    clearAll() {
        localStorage.clear();
        this.cache.clear();
        this.batchOperations = [];
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
            this.batchTimeout = null;
        }
    }
    
    /**
     * Get storage statistics
     * @returns {Object} Storage statistics
     */
    getStatistics() {
        const cacheHitRate = this.statistics.cacheHits + this.statistics.cacheMisses > 0 ?
            (this.statistics.cacheHits / (this.statistics.cacheHits + this.statistics.cacheMisses)) * 100 : 0;
        
        return {
            ...this.statistics,
            cacheHitRate: cacheHitRate.toFixed(2) + '%',
            cacheSize: this.cache.size,
            pendingBatchOperations: this.batchOperations.length,
            storageSize: this.getStorageSize(),
            compressionSavingsKB: (this.statistics.compressionSavings / 1024).toFixed(2)
        };
    }
    
    /**
     * Get total localStorage size
     * @returns {number} Size in bytes
     */
    getStorageSize() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        return total;
    }
    
    /**
     * Get cache efficiency metrics
     * @returns {Object} Cache efficiency data
     */
    getCacheEfficiency() {
        const totalRequests = this.statistics.cacheHits + this.statistics.cacheMisses;
        
        return {
            totalRequests: totalRequests,
            cacheHits: this.statistics.cacheHits,
            cacheMisses: this.statistics.cacheMisses,
            hitRate: totalRequests > 0 ? (this.statistics.cacheHits / totalRequests) * 100 : 0,
            cacheUtilization: (this.cache.size / this.maxCacheSize) * 100
        };
    }
    
    /**
     * Optimize storage by cleaning up and defragmenting
     * @returns {Object} Optimization results
     */
    optimize() {
        const beforeSize = this.getStorageSize();
        const beforeCacheSize = this.cache.size;
        
        // Flush any pending batch operations
        this.flushBatch();
        
        // Clean up expired or invalid entries
        const keysToRemove = [];
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                try {
                    const data = this.read(key);
                    if (data === null || data === undefined) {
                        keysToRemove.push(key);
                    }
                } catch (error) {
                    keysToRemove.push(key);
                }
            }
        }
        
        // Remove invalid keys
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            this.cache.delete(key);
        });
        
        const afterSize = this.getStorageSize();
        const afterCacheSize = this.cache.size;
        
        return {
            success: true,
            beforeSize: beforeSize,
            afterSize: afterSize,
            sizeSaved: beforeSize - afterSize,
            beforeCacheSize: beforeCacheSize,
            afterCacheSize: afterCacheSize,
            invalidKeysRemoved: keysToRemove.length
        };
    }
    
    /**
     * Configure storage manager settings
     * @param {Object} config - Configuration options
     */
    configure(config) {
        if (config.compressionEnabled !== undefined) {
            this.compressionEnabled = config.compressionEnabled;
        }
        if (config.cacheEnabled !== undefined) {
            this.cacheEnabled = config.cacheEnabled;
        }
        if (config.batchDelay !== undefined) {
            this.batchDelay = config.batchDelay;
        }
        if (config.maxCacheSize !== undefined) {
            this.maxCacheSize = config.maxCacheSize;
        }
    }
}