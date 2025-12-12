/**
 * Progressive Loader Module
 * Handles progressive loading of large datasets with chunking and lazy loading
 * 
 * **Feature: dashboard-analytics-kpi, Task 6.3: Caching and Performance Optimization**
 * **Validates: Requirements 6.1, 6.5, 8.1**
 */

class ProgressiveLoader {
    constructor(options = {}) {
        this.chunkSize = options.chunkSize || 100; // Records per chunk
        this.loadDelay = options.loadDelay || 50; // Delay between chunks (ms)
        this.maxConcurrentLoads = options.maxConcurrentLoads || 3;
        this.retryAttempts = options.retryAttempts || 3;
        this.retryDelay = options.retryDelay || 1000;
        
        // State management
        this.activeLoads = new Map();
        this.loadQueue = [];
        this.concurrentLoads = 0;
        
        // Performance metrics
        this.metrics = {
            totalLoads: 0,
            successfulLoads: 0,
            failedLoads: 0,
            totalRecordsLoaded: 0,
            averageLoadTime: 0,
            totalLoadTime: 0
        };
        
        // Bind methods
        this.loadData = this.loadData.bind(this);
        this.loadChunk = this.loadChunk.bind(this);
        this.processQueue = this.processQueue.bind(this);
    }

    /**
     * Load data progressively with chunking
     * @param {Object} config - Load configuration
     * @returns {Promise<Object>} Load result with data and metadata
     */
    async loadData(config) {
        const {
            dataSource,
            totalRecords,
            onProgress,
            onChunkLoaded,
            onComplete,
            onError,
            priority = 'normal',
            cacheKey = null
        } = config;
        
        const loadId = this.generateLoadId();
        const startTime = Date.now();
        
        try {
            // Initialize load state
            const loadState = {
                id: loadId,
                totalRecords,
                loadedRecords: 0,
                chunks: [],
                startTime,
                status: 'loading',
                progress: 0,
                config
            };
            
            this.activeLoads.set(loadId, loadState);
            this.metrics.totalLoads++;
            
            // Calculate number of chunks
            const totalChunks = Math.ceil(totalRecords / this.chunkSize);
            const chunks = [];
            
            // Create chunk loading promises
            for (let i = 0; i < totalChunks; i++) {
                const offset = i * this.chunkSize;
                const limit = Math.min(this.chunkSize, totalRecords - offset);
                
                chunks.push({
                    index: i,
                    offset,
                    limit,
                    status: 'pending',
                    data: null,
                    error: null
                });
            }
            
            loadState.chunks = chunks;
            
            // Load chunks progressively
            const results = await this.loadChunksProgressively(loadState, dataSource, {
                onProgress,
                onChunkLoaded,
                onError
            });
            
            // Combine results
            const combinedData = this.combineChunkData(results);
            const endTime = Date.now();
            const loadTime = endTime - startTime;
            
            // Update metrics
            this.updateMetrics(loadTime, totalRecords, true);
            
            // Update load state
            loadState.status = 'completed';
            loadState.progress = 100;
            loadState.loadTime = loadTime;
            
            const result = {
                loadId,
                data: combinedData,
                totalRecords: combinedData.length,
                loadTime,
                chunks: results.length,
                success: true
            };
            
            if (onComplete) {
                onComplete(result);
            }
            
            // Cleanup
            this.activeLoads.delete(loadId);
            
            return result;
            
        } catch (error) {
            console.error('Progressive load failed:', error);
            
            // Update metrics
            this.updateMetrics(Date.now() - startTime, 0, false);
            
            // Update load state
            const loadState = this.activeLoads.get(loadId);
            if (loadState) {
                loadState.status = 'failed';
                loadState.error = error.message;
            }
            
            if (onError) {
                onError(error);
            }
            
            // Cleanup
            this.activeLoads.delete(loadId);
            
            throw error;
        }
    }

    /**
     * Load chunks progressively with concurrency control
     * @param {Object} loadState - Load state object
     * @param {Function} dataSource - Data source function
     * @param {Object} callbacks - Callback functions
     * @returns {Promise<Array>} Array of loaded chunks
     */
    async loadChunksProgressively(loadState, dataSource, callbacks) {
        const { onProgress, onChunkLoaded, onError } = callbacks;
        const results = [];
        const promises = [];
        
        for (let i = 0; i < loadState.chunks.length; i++) {
            // Control concurrency
            if (promises.length >= this.maxConcurrentLoads) {
                await Promise.race(promises);
            }
            
            const chunk = loadState.chunks[i];
            const chunkPromise = this.loadChunkWithRetry(chunk, dataSource, loadState)
                .then(chunkData => {
                    // Update progress
                    loadState.loadedRecords += chunkData.length;
                    loadState.progress = Math.round((loadState.loadedRecords / loadState.totalRecords) * 100);
                    
                    // Store chunk data
                    chunk.data = chunkData;
                    chunk.status = 'completed';
                    results[chunk.index] = chunkData;
                    
                    // Notify progress
                    if (onProgress) {
                        onProgress({
                            loadId: loadState.id,
                            progress: loadState.progress,
                            loadedRecords: loadState.loadedRecords,
                            totalRecords: loadState.totalRecords,
                            chunksCompleted: i + 1,
                            totalChunks: loadState.chunks.length
                        });
                    }
                    
                    // Notify chunk loaded
                    if (onChunkLoaded) {
                        onChunkLoaded({
                            chunkIndex: chunk.index,
                            chunkData,
                            progress: loadState.progress
                        });
                    }
                    
                    return chunkData;
                })
                .catch(error => {
                    chunk.status = 'failed';
                    chunk.error = error.message;
                    
                    if (onError) {
                        onError(error);
                    }
                    
                    throw error;
                })
                .finally(() => {
                    // Remove from active promises
                    const index = promises.indexOf(chunkPromise);
                    if (index > -1) {
                        promises.splice(index, 1);
                    }
                });
            
            promises.push(chunkPromise);
            
            // Add delay between chunk initiations
            if (this.loadDelay > 0 && i < loadState.chunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, this.loadDelay));
            }
        }
        
        // Wait for all chunks to complete
        await Promise.all(promises);
        
        return results;
    }

    /**
     * Load single chunk with retry logic
     * @param {Object} chunk - Chunk configuration
     * @param {Function} dataSource - Data source function
     * @param {Object} loadState - Load state object
     * @returns {Promise<Array>} Chunk data
     */
    async loadChunkWithRetry(chunk, dataSource, loadState) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                chunk.status = 'loading';
                
                const chunkData = await dataSource({
                    offset: chunk.offset,
                    limit: chunk.limit,
                    chunkIndex: chunk.index
                });
                
                return Array.isArray(chunkData) ? chunkData : [];
                
            } catch (error) {
                lastError = error;
                console.warn(`Chunk ${chunk.index} load attempt ${attempt} failed:`, error.message);
                
                if (attempt < this.retryAttempts) {
                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
                }
            }
        }
        
        throw new Error(`Failed to load chunk ${chunk.index} after ${this.retryAttempts} attempts: ${lastError.message}`);
    }

    /**
     * Combine chunk data into single array
     * @param {Array} chunks - Array of chunk data arrays
     * @returns {Array} Combined data array
     */
    combineChunkData(chunks) {
        const combined = [];
        
        for (const chunk of chunks) {
            if (Array.isArray(chunk)) {
                combined.push(...chunk);
            }
        }
        
        return combined;
    }

    /**
     * Load data with lazy loading (on-demand)
     * @param {Object} config - Lazy load configuration
     * @returns {Function} Lazy loader function
     */
    createLazyLoader(config) {
        const {
            dataSource,
            cacheManager = null,
            cacheKey = null,
            cacheTTL = 5 * 60 * 1000
        } = config;
        
        let loaded = false;
        let loading = false;
        let data = null;
        let error = null;
        
        return async () => {
            // Return cached data if available
            if (loaded && data) {
                return data;
            }
            
            // Prevent concurrent loading
            if (loading) {
                // Wait for current load to complete
                while (loading) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                return data;
            }
            
            try {
                loading = true;
                
                // Check cache first
                if (cacheManager && cacheKey) {
                    const cachedData = cacheManager.get(cacheKey);
                    if (cachedData) {
                        data = cachedData;
                        loaded = true;
                        return data;
                    }
                }
                
                // Load data
                data = await dataSource();
                loaded = true;
                error = null;
                
                // Cache the result
                if (cacheManager && cacheKey) {
                    cacheManager.set(cacheKey, data, cacheTTL);
                }
                
                return data;
                
            } catch (err) {
                error = err;
                throw err;
            } finally {
                loading = false;
            }
        };
    }

    /**
     * Create virtual scrolling loader for large lists
     * @param {Object} config - Virtual scroll configuration
     * @returns {Object} Virtual scroll controller
     */
    createVirtualScrollLoader(config) {
        const {
            totalItems,
            itemHeight,
            containerHeight,
            dataSource,
            bufferSize = 10
        } = config;
        
        const visibleItems = Math.ceil(containerHeight / itemHeight);
        const loadedChunks = new Map();
        
        return {
            async getVisibleItems(scrollTop) {
                const startIndex = Math.floor(scrollTop / itemHeight);
                const endIndex = Math.min(startIndex + visibleItems + bufferSize, totalItems);
                
                const startChunk = Math.floor(startIndex / this.chunkSize);
                const endChunk = Math.floor(endIndex / this.chunkSize);
                
                const items = [];
                
                // Load required chunks
                for (let chunkIndex = startChunk; chunkIndex <= endChunk; chunkIndex++) {
                    if (!loadedChunks.has(chunkIndex)) {
                        const chunkData = await this.loadVirtualChunk(chunkIndex, dataSource);
                        loadedChunks.set(chunkIndex, chunkData);
                    }
                    
                    const chunkData = loadedChunks.get(chunkIndex);
                    items.push(...chunkData);
                }
                
                // Return only visible items
                const relativeStart = startIndex - (startChunk * this.chunkSize);
                const relativeEnd = relativeStart + (endIndex - startIndex);
                
                return {
                    items: items.slice(relativeStart, relativeEnd),
                    startIndex,
                    endIndex,
                    totalItems
                };
            },
            
            clearCache() {
                loadedChunks.clear();
            }
        };
    }

    /**
     * Load virtual scroll chunk
     * @param {number} chunkIndex - Chunk index
     * @param {Function} dataSource - Data source function
     * @returns {Promise<Array>} Chunk data
     */
    async loadVirtualChunk(chunkIndex, dataSource) {
        const offset = chunkIndex * this.chunkSize;
        const limit = this.chunkSize;
        
        return await dataSource({ offset, limit, chunkIndex });
    }

    /**
     * Get active load information
     * @param {string} loadId - Load ID (optional)
     * @returns {Object|Array} Load information
     */
    getLoadInfo(loadId = null) {
        if (loadId) {
            return this.activeLoads.get(loadId) || null;
        }
        
        return Array.from(this.activeLoads.values());
    }

    /**
     * Cancel active load
     * @param {string} loadId - Load ID to cancel
     * @returns {boolean} Success status
     */
    cancelLoad(loadId) {
        const loadState = this.activeLoads.get(loadId);
        if (loadState) {
            loadState.status = 'cancelled';
            this.activeLoads.delete(loadId);
            return true;
        }
        return false;
    }

    /**
     * Get performance metrics
     * @returns {Object} Performance metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            activeLoads: this.activeLoads.size,
            successRate: this.metrics.totalLoads > 0 
                ? ((this.metrics.successfulLoads / this.metrics.totalLoads) * 100).toFixed(2) + '%'
                : '0%'
        };
    }

    /**
     * Update performance metrics
     * @param {number} loadTime - Load time in milliseconds
     * @param {number} recordCount - Number of records loaded
     * @param {boolean} success - Success status
     */
    updateMetrics(loadTime, recordCount, success) {
        this.metrics.totalLoadTime += loadTime;
        this.metrics.totalRecordsLoaded += recordCount;
        
        if (success) {
            this.metrics.successfulLoads++;
        } else {
            this.metrics.failedLoads++;
        }
        
        this.metrics.averageLoadTime = this.metrics.totalLoads > 0 
            ? Math.round(this.metrics.totalLoadTime / this.metrics.totalLoads)
            : 0;
    }

    /**
     * Generate unique load ID
     * @returns {string} Unique load ID
     */
    generateLoadId() {
        return 'load_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Reset metrics
     */
    resetMetrics() {
        this.metrics = {
            totalLoads: 0,
            successfulLoads: 0,
            failedLoads: 0,
            totalRecordsLoaded: 0,
            averageLoadTime: 0,
            totalLoadTime: 0
        };
    }

    /**
     * Destroy progressive loader and cleanup resources
     */
    destroy() {
        // Cancel all active loads
        for (const loadId of this.activeLoads.keys()) {
            this.cancelLoad(loadId);
        }
        
        this.loadQueue = [];
        this.concurrentLoads = 0;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressiveLoader;
}