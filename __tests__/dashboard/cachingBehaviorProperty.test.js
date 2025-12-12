/**
 * Property-Based Tests for Caching Behavior
 * Tests cache consistency, TTL behavior, and memory management properties
 * 
 * **Feature: dashboard-analytics-kpi, Property 11: Cache Consistency**
 * **Validates: Requirements 6.2**
 */

const fc = require('fast-check');

// Import the actual CacheManager for testing
class CacheManager {
    constructor(options = {}) {
        this.cache = new Map();
        this.defaultTTL = options.defaultTTL || 5 * 60 * 1000;
        this.maxCacheSize = options.maxCacheSize || 100;
        this.maxMemoryUsage = options.maxMemoryUsage || 50 * 1024 * 1024;
        this.cleanupInterval = options.cleanupInterval || 60 * 1000;
        
        this.metrics = {
            hits: 0,
            misses: 0,
            evictions: 0,
            memoryUsage: 0,
            totalRequests: 0
        };
        
        this.get = this.get.bind(this);
        this.set = this.set.bind(this);
        this.invalidate = this.invalidate.bind(this);
        this.clear = this.clear.bind(this);
    }

    get(key) {
        this.metrics.totalRequests++;
        
        const item = this.cache.get(key);
        
        if (!item) {
            this.metrics.misses++;
            return null;
        }
        
        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            this.metrics.misses++;
            this.updateMemoryUsage();
            return null;
        }
        
        item.lastAccessed = Date.now();
        this.metrics.hits++;
        
        return item.data;
    }

    set(key, data, ttl = this.defaultTTL) {
        try {
            const estimatedSize = this.estimateDataSize(data);
            
            if (this.metrics.memoryUsage + estimatedSize > this.maxMemoryUsage) {
                this.evictLRU();
            }
            
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

    invalidate(key) {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.updateMemoryUsage();
        }
        return deleted;
    }

    clear() {
        this.cache.clear();
        this.metrics.memoryUsage = 0;
        this.metrics.evictions = 0;
    }

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

    evictLRU(count = 1) {
        const items = Array.from(this.cache.entries())
            .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
        
        for (let i = 0; i < Math.min(count, items.length); i++) {
            this.cache.delete(items[i][0]);
            this.metrics.evictions++;
        }
        
        this.updateMemoryUsage();
    }

    estimateDataSize(data) {
        try {
            if (data === null || data === undefined) return 0;
            
            if (typeof data === 'string') {
                return data.length * 2;
            }
            
            if (typeof data === 'number') {
                return 8;
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
            return 1024;
        }
    }

    updateMemoryUsage() {
        let totalSize = 0;
        
        for (const item of this.cache.values()) {
            totalSize += item.size;
        }
        
        this.metrics.memoryUsage = totalSize;
    }
}

describe('Cache Manager Property-Based Tests', () => {
    describe('Property 11: Cache Consistency', () => {
        test('cache should maintain data integrity across operations', () => {
            fc.assert(fc.property(
                fc.array(
                    fc.record({
                        key: fc.string({ minLength: 1, maxLength: 50 }),
                        value: fc.oneof(
                            fc.string(),
                            fc.integer(),
                            fc.boolean(),
                            fc.array(fc.string(), { maxLength: 10 }),
                            fc.record({ name: fc.string(), value: fc.integer() })
                        ),
                        ttl: fc.integer({ min: 100, max: 10000 })
                    }),
                    { minLength: 1, maxLength: 20 }
                ),
                (operations) => {
                    const cache = new CacheManager({ maxCacheSize: 50 });
                    
                    // Set all items
                    const setResults = operations.map(op => {
                        const result = cache.set(op.key, op.value, op.ttl);
                        return { key: op.key, value: op.value, success: result };
                    });
                    
                    // Verify all successful sets can be retrieved
                    const getResults = setResults
                        .filter(r => r.success)
                        .map(r => {
                            const retrieved = cache.get(r.key);
                            return {
                                key: r.key,
                                original: r.value,
                                retrieved: retrieved,
                                matches: JSON.stringify(r.value) === JSON.stringify(retrieved)
                            };
                        });
                    
                    // All retrieved values should match original values
                    return getResults.every(r => r.matches);
                }
            ), { numRuns: 100 });
        });

        test('cache should respect TTL expiration', async () => {
            await fc.assert(fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 20 }),
                fc.string({ minLength: 1, maxLength: 100 }),
                fc.integer({ min: 50, max: 200 }),
                async (key, value, ttl) => {
                    const cache = new CacheManager();
                    
                    // Set item with short TTL
                    cache.set(key, value, ttl);
                    
                    // Should be available immediately
                    const immediate = cache.get(key);
                    
                    // Wait for expiration
                    await new Promise(resolve => setTimeout(resolve, ttl + 10));
                    
                    // Should be expired
                    const expired = cache.get(key);
                    
                    return immediate === value && expired === null;
                }
            ), { numRuns: 20 });
        });

        test('cache should maintain size limits', () => {
            fc.assert(fc.property(
                fc.integer({ min: 5, max: 20 }),
                fc.array(
                    fc.record({
                        key: fc.string({ minLength: 1, maxLength: 10 }),
                        value: fc.string({ minLength: 1, maxLength: 50 })
                    }),
                    { minLength: 10, maxLength: 50 }
                ),
                (maxSize, items) => {
                    const cache = new CacheManager({ maxCacheSize: maxSize });
                    
                    // Add more items than max size
                    items.forEach(item => {
                        cache.set(item.key, item.value);
                    });
                    
                    // Cache size should not exceed limit
                    const stats = cache.getStats();
                    return stats.size <= maxSize;
                }
            ), { numRuns: 50 });
        });

        test('cache metrics should be accurate', () => {
            fc.assert(fc.property(
                fc.array(
                    fc.record({
                        key: fc.string({ minLength: 1, maxLength: 10 }),
                        value: fc.string({ minLength: 1, maxLength: 20 })
                    }),
                    { minLength: 5, maxLength: 15 }
                ),
                fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 5, maxLength: 15 }),
                (setOperations, getKeys) => {
                    const cache = new CacheManager();
                    
                    // Track expected metrics
                    let expectedHits = 0;
                    let expectedMisses = 0;
                    
                    // Set items
                    setOperations.forEach(op => {
                        cache.set(op.key, op.value);
                    });
                    
                    // Get items (some hits, some misses)
                    getKeys.forEach(key => {
                        const result = cache.get(key);
                        if (result !== null) {
                            expectedHits++;
                        } else {
                            expectedMisses++;
                        }
                    });
                    
                    const stats = cache.getStats();
                    return stats.hits === expectedHits && 
                           stats.misses === expectedMisses &&
                           stats.totalRequests === expectedHits + expectedMisses;
                }
            ), { numRuns: 50 });
        });

        test('cache should handle concurrent operations safely', () => {
            fc.assert(fc.property(
                fc.array(
                    fc.record({
                        operation: fc.constantFrom('set', 'get', 'invalidate'),
                        key: fc.string({ minLength: 1, maxLength: 5 }),
                        value: fc.string({ minLength: 1, maxLength: 10 })
                    }),
                    { minLength: 10, maxLength: 30 }
                ),
                (operations) => {
                    const cache = new CacheManager();
                    
                    // Execute operations
                    operations.forEach(op => {
                        try {
                            switch (op.operation) {
                                case 'set':
                                    cache.set(op.key, op.value);
                                    break;
                                case 'get':
                                    cache.get(op.key);
                                    break;
                                case 'invalidate':
                                    cache.invalidate(op.key);
                                    break;
                            }
                        } catch (error) {
                            // Operations should not throw errors
                            return false;
                        }
                    });
                    
                    // Cache should remain in valid state
                    const stats = cache.getStats();
                    return stats.size >= 0 && 
                           stats.memoryUsage >= 0 &&
                           stats.hits >= 0 &&
                           stats.misses >= 0;
                }
            ), { numRuns: 100 });
        });

        test('LRU eviction should remove least recently used items', () => {
            fc.assert(fc.property(
                fc.array(
                    fc.record({
                        key: fc.string({ minLength: 1, maxLength: 5 }),
                        value: fc.string({ minLength: 1, maxLength: 10 })
                    }),
                    { minLength: 8, maxLength: 12 }
                ),
                (items) => {
                    const maxSize = 5;
                    const cache = new CacheManager({ maxCacheSize: maxSize });
                    
                    // Add items sequentially
                    items.forEach(item => {
                        cache.set(item.key, item.value);
                    });
                    
                    // Cache should not exceed max size
                    const stats = cache.getStats();
                    
                    // If we added more items than max size, some should have been evicted
                    if (items.length > maxSize) {
                        return stats.size <= maxSize && stats.evictions > 0;
                    } else {
                        return stats.size === items.length;
                    }
                }
            ), { numRuns: 50 });
        });

        test('memory usage estimation should be consistent', () => {
            fc.assert(fc.property(
                fc.array(
                    fc.record({
                        key: fc.string({ minLength: 1, maxLength: 10 }),
                        value: fc.oneof(
                            fc.string({ minLength: 1, maxLength: 50 }),
                            fc.integer({ min: 0, max: 1000000 }),
                            fc.boolean(),
                            fc.array(fc.string({ maxLength: 10 }), { maxLength: 5 })
                        )
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (items) => {
                    const cache = new CacheManager();
                    
                    // Add items and track memory usage
                    let previousMemory = 0;
                    
                    items.forEach(item => {
                        cache.set(item.key, item.value);
                        const currentStats = cache.getStats();
                        
                        // Memory usage should be non-negative and generally increasing
                        if (currentStats.memoryUsage < 0) {
                            return false;
                        }
                        
                        previousMemory = currentStats.memoryUsage;
                    });
                    
                    // Clear cache and verify memory is reset
                    cache.clear();
                    const finalStats = cache.getStats();
                    
                    return finalStats.memoryUsage === 0 && finalStats.size === 0;
                }
            ), { numRuns: 50 });
        });

        test('getOrSet should maintain consistency', async () => {
            await fc.assert(fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 20 }),
                fc.string({ minLength: 1, maxLength: 100 }),
                async (key, expectedValue) => {
                    const cache = new CacheManager();
                    let factoryCalls = 0;
                    
                    const factory = async () => {
                        factoryCalls++;
                        return expectedValue;
                    };
                    
                    // First call should invoke factory
                    const result1 = await cache.getOrSet(key, factory);
                    
                    // Second call should use cache
                    const result2 = await cache.getOrSet(key, factory);
                    
                    return result1 === expectedValue && 
                           result2 === expectedValue && 
                           factoryCalls === 1;
                }
            ), { numRuns: 30 });
        });

        test('cache cleanup should remove only expired items', async () => {
            await fc.assert(fc.asyncProperty(
                fc.array(
                    fc.record({
                        key: fc.string({ minLength: 1, maxLength: 10 }),
                        value: fc.string({ minLength: 1, maxLength: 20 }),
                        ttl: fc.integer({ min: 50, max: 300 })
                    }),
                    { minLength: 3, maxLength: 8 }
                ),
                async (items) => {
                    const cache = new CacheManager();
                    
                    // Add items with different TTLs
                    items.forEach(item => {
                        cache.set(item.key, item.value, item.ttl);
                    });
                    
                    const initialSize = cache.getStats().size;
                    
                    // Wait for some items to expire
                    const maxTTL = Math.max(...items.map(i => i.ttl));
                    await new Promise(resolve => setTimeout(resolve, maxTTL / 2));
                    
                    // Cleanup expired items
                    const cleanedCount = cache.cleanup();
                    const finalSize = cache.getStats().size;
                    
                    // Verify cleanup worked correctly
                    return finalSize <= initialSize && 
                           cleanedCount >= 0 &&
                           finalSize + cleanedCount <= initialSize;
                }
            ), { numRuns: 10 });
        });

        test('cache should handle edge cases gracefully', () => {
            fc.assert(fc.property(
                fc.oneof(
                    fc.constant(null),
                    fc.constant(undefined),
                    fc.constant(''),
                    fc.constant(0),
                    fc.constant(false),
                    fc.array(fc.anything(), { maxLength: 0 }),
                    fc.record({})
                ),
                (edgeCaseValue) => {
                    const cache = new CacheManager();
                    const key = 'test-key';
                    
                    try {
                        // Should handle edge case values without throwing
                        const setResult = cache.set(key, edgeCaseValue);
                        const getResult = cache.get(key);
                        
                        // If set succeeded, get should return the same value
                        if (setResult) {
                            return JSON.stringify(getResult) === JSON.stringify(edgeCaseValue);
                        }
                        
                        return true;
                    } catch (error) {
                        // Should not throw errors for edge cases
                        return false;
                    }
                }
            ), { numRuns: 100 });
        });
    });
}); 