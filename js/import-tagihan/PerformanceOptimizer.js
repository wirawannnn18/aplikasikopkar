/**
 * Performance Optimizer - Handles performance optimizations for import processing
 * Requirements: 2.3, 5.1
 */

/**
 * Performance optimization utilities for large file processing and batch operations
 * Implements memory-efficient processing and progress indicators
 */
class PerformanceOptimizer {
    constructor() {
        this.chunkSize = 1000; // Process data in chunks of 1000 rows
        this.memoryThreshold = 50 * 1024 * 1024; // 50MB memory threshold
        this.progressUpdateInterval = 100; // Update progress every 100ms
        this.lastProgressUpdate = 0;
        this.memoryMonitor = null;
        this.performanceMetrics = {
            startTime: null,
            endTime: null,
            memoryUsage: [],
            processingTimes: [],
            chunkSizes: []
        };
    }

    /**
     * Optimize large file processing with chunked reading
     * Requirements: 2.3 - Optimize large file processing
     * @param {File} file - Large file to process
     * @param {Function} processor - Processing function for each chunk
     * @param {Function} progressCallback - Progress update callback
     * @returns {Promise<Array>} Processed results
     */
    async optimizeFileProcessing(file, processor, progressCallback) {
        this.performanceMetrics.startTime = performance.now();
        this.startMemoryMonitoring();

        try {
            // For very large files, use streaming approach
            if (file.size > 10 * 1024 * 1024) { // 10MB+
                return await this._processLargeFileInChunks(file, processor, progressCallback);
            } else {
                // For smaller files, use standard processing with optimization
                return await this._processStandardFile(file, processor, progressCallback);
            }
        } finally {
            this.stopMemoryMonitoring();
            this.performanceMetrics.endTime = performance.now();
        }
    }

    /**
     * Optimize batch processing with memory-efficient chunking
     * Requirements: 5.1 - Implement memory-efficient batch processing
     * @param {Array} data - Data to process in batches
     * @param {Function} processor - Processing function for each batch
     * @param {Function} progressCallback - Progress update callback
     * @returns {Promise<Array>} Processing results
     */
    async optimizeBatchProcessing(data, processor, progressCallback) {
        if (!Array.isArray(data) || data.length === 0) {
            return [];
        }

        this.performanceMetrics.startTime = performance.now();
        this.startMemoryMonitoring();

        const results = [];
        const totalItems = data.length;
        let processedItems = 0;

        try {
            // Calculate optimal chunk size based on data size and memory
            const optimalChunkSize = this._calculateOptimalChunkSize(data);
            
            // Process data in chunks to prevent memory overflow
            for (let i = 0; i < data.length; i += optimalChunkSize) {
                const chunk = data.slice(i, i + optimalChunkSize);
                const chunkStartTime = performance.now();

                // Check memory usage before processing chunk
                await this._checkMemoryUsage();

                // Process chunk
                const chunkResults = await processor(chunk, i, optimalChunkSize);
                results.push(...(Array.isArray(chunkResults) ? chunkResults : [chunkResults]));

                processedItems += chunk.length;
                
                // Record performance metrics
                const chunkProcessingTime = performance.now() - chunkStartTime;
                this.performanceMetrics.processingTimes.push(chunkProcessingTime);
                this.performanceMetrics.chunkSizes.push(chunk.length);

                // Update progress with throttling
                this._throttledProgressUpdate(progressCallback, processedItems, totalItems, 
                    `Memproses batch ${Math.ceil(i / optimalChunkSize) + 1}...`);

                // Allow UI to update between chunks
                await this._yieldToUI();
            }

            return results;

        } finally {
            this.stopMemoryMonitoring();
            this.performanceMetrics.endTime = performance.now();
        }
    }

    /**
     * Create optimized progress indicator with throttling
     * Requirements: 5.1 - Add progress indicators for long operations
     * @param {Function} callback - Progress callback function
     * @param {number} current - Current progress
     * @param {number} total - Total items
     * @param {string} status - Status message
     * @param {Object} additionalData - Additional progress data
     */
    createOptimizedProgressIndicator(callback, current, total, status, additionalData = {}) {
        const now = performance.now();
        
        // Throttle progress updates to prevent UI flooding
        if (now - this.lastProgressUpdate < this.progressUpdateInterval) {
            return;
        }

        this.lastProgressUpdate = now;

        const progressData = {
            current,
            total,
            percentage: total > 0 ? (current / total * 100).toFixed(1) : 0,
            status,
            timestamp: new Date().toISOString(),
            estimatedTimeRemaining: this._calculateEstimatedTime(current, total),
            memoryUsage: this._getCurrentMemoryUsage(),
            processingSpeed: this._calculateProcessingSpeed(current),
            ...additionalData
        };

        if (callback && typeof callback === 'function') {
            callback(progressData);
        }
    }

    /**
     * Monitor and optimize memory usage during processing
     * Requirements: 2.3 - Memory-efficient processing
     * @returns {Object} Memory usage statistics
     */
    getMemoryUsageStats() {
        const memoryInfo = this._getCurrentMemoryUsage();
        
        return {
            current: memoryInfo,
            peak: Math.max(...this.performanceMetrics.memoryUsage.map(m => m.usedJSHeapSize || 0)),
            average: this._calculateAverageMemoryUsage(),
            threshold: this.memoryThreshold,
            isNearThreshold: memoryInfo.usedJSHeapSize > (this.memoryThreshold * 0.8)
        };
    }

    /**
     * Get performance metrics for the last operation
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        const totalTime = this.performanceMetrics.endTime - this.performanceMetrics.startTime;
        const avgChunkTime = this.performanceMetrics.processingTimes.length > 0 
            ? this.performanceMetrics.processingTimes.reduce((a, b) => a + b, 0) / this.performanceMetrics.processingTimes.length
            : 0;

        return {
            totalProcessingTime: totalTime,
            averageChunkProcessingTime: avgChunkTime,
            chunksProcessed: this.performanceMetrics.processingTimes.length,
            averageChunkSize: this.performanceMetrics.chunkSizes.length > 0 
                ? this.performanceMetrics.chunkSizes.reduce((a, b) => a + b, 0) / this.performanceMetrics.chunkSizes.length
                : 0,
            memoryStats: this.getMemoryUsageStats(),
            efficiency: totalTime > 0 ? (this.performanceMetrics.chunkSizes.reduce((a, b) => a + b, 0) / totalTime) : 0
        };
    }

    /**
     * Reset performance metrics
     */
    resetMetrics() {
        this.performanceMetrics = {
            startTime: null,
            endTime: null,
            memoryUsage: [],
            processingTimes: [],
            chunkSizes: []
        };
    }

    // Private methods

    /**
     * Process large files in chunks to prevent memory issues
     * @private
     */
    async _processLargeFileInChunks(file, processor, progressCallback) {
        const fileSize = file.size;
        const chunkSize = Math.min(1024 * 1024, fileSize / 10); // 1MB chunks or 1/10 of file
        const results = [];
        let offset = 0;

        while (offset < fileSize) {
            const chunk = file.slice(offset, offset + chunkSize);
            const chunkResult = await processor(chunk);
            results.push(...(Array.isArray(chunkResult) ? chunkResult : [chunkResult]));

            offset += chunkSize;
            
            this._throttledProgressUpdate(progressCallback, offset, fileSize, 
                `Memproses file chunk ${Math.ceil(offset / chunkSize)}...`);

            // Allow UI to update
            await this._yieldToUI();
        }

        return results;
    }

    /**
     * Process standard files with optimization
     * @private
     */
    async _processStandardFile(file, processor, progressCallback) {
        this._throttledProgressUpdate(progressCallback, 0, 100, 'Memulai pemrosesan file...');
        
        const result = await processor(file);
        
        this._throttledProgressUpdate(progressCallback, 100, 100, 'File berhasil diproses');
        
        return Array.isArray(result) ? result : [result];
    }

    /**
     * Calculate optimal chunk size based on data characteristics
     * @private
     */
    _calculateOptimalChunkSize(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return this.chunkSize;
        }

        // Estimate memory usage per item
        const sampleItem = data[0];
        const estimatedItemSize = JSON.stringify(sampleItem).length * 2; // Rough estimate
        
        // Calculate chunk size to stay under memory threshold
        const maxItemsForMemory = Math.floor(this.memoryThreshold / estimatedItemSize);
        
        // Use smaller of default chunk size or memory-based limit
        const optimalSize = Math.min(this.chunkSize, maxItemsForMemory, data.length);
        
        return Math.max(1, optimalSize); // Ensure at least 1 item per chunk
    }

    /**
     * Check current memory usage and trigger garbage collection if needed
     * @private
     */
    async _checkMemoryUsage() {
        const memoryInfo = this._getCurrentMemoryUsage();
        
        if (memoryInfo.usedJSHeapSize > this.memoryThreshold) {
            // Force garbage collection if available
            if (window.gc) {
                window.gc();
            }
            
            // Yield to allow cleanup
            await this._yieldToUI();
        }
    }

    /**
     * Get current memory usage information
     * @private
     */
    _getCurrentMemoryUsage() {
        if (performance.memory) {
            return {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                timestamp: performance.now()
            };
        }
        
        // Fallback for environments without performance.memory
        return {
            usedJSHeapSize: 0,
            totalJSHeapSize: 0,
            jsHeapSizeLimit: 0,
            timestamp: performance.now()
        };
    }

    /**
     * Start monitoring memory usage
     * @private
     */
    startMemoryMonitoring() {
        if (this.memoryMonitor) {
            clearInterval(this.memoryMonitor);
        }

        this.memoryMonitor = setInterval(() => {
            const memoryInfo = this._getCurrentMemoryUsage();
            this.performanceMetrics.memoryUsage.push(memoryInfo);
            
            // Keep only last 100 measurements to prevent memory leak
            if (this.performanceMetrics.memoryUsage.length > 100) {
                this.performanceMetrics.memoryUsage.shift();
            }
        }, 1000); // Monitor every second
    }

    /**
     * Stop monitoring memory usage
     * @private
     */
    stopMemoryMonitoring() {
        if (this.memoryMonitor) {
            clearInterval(this.memoryMonitor);
            this.memoryMonitor = null;
        }
    }

    /**
     * Calculate average memory usage
     * @private
     */
    _calculateAverageMemoryUsage() {
        if (this.performanceMetrics.memoryUsage.length === 0) {
            return this._getCurrentMemoryUsage();
        }

        const totalUsed = this.performanceMetrics.memoryUsage.reduce((sum, mem) => sum + mem.usedJSHeapSize, 0);
        const avgUsed = totalUsed / this.performanceMetrics.memoryUsage.length;

        return {
            usedJSHeapSize: avgUsed,
            totalJSHeapSize: this.performanceMetrics.memoryUsage[this.performanceMetrics.memoryUsage.length - 1].totalJSHeapSize,
            jsHeapSizeLimit: this.performanceMetrics.memoryUsage[this.performanceMetrics.memoryUsage.length - 1].jsHeapSizeLimit
        };
    }

    /**
     * Calculate estimated time remaining
     * @private
     */
    _calculateEstimatedTime(current, total) {
        if (current === 0 || !this.performanceMetrics.startTime) {
            return null;
        }

        const elapsed = performance.now() - this.performanceMetrics.startTime;
        const rate = current / elapsed;
        const remaining = (total - current) / rate;

        return {
            milliseconds: remaining,
            seconds: Math.ceil(remaining / 1000),
            formatted: this._formatTime(remaining)
        };
    }

    /**
     * Calculate processing speed
     * @private
     */
    _calculateProcessingSpeed(current) {
        if (!this.performanceMetrics.startTime || current === 0) {
            return 0;
        }

        const elapsed = performance.now() - this.performanceMetrics.startTime;
        return (current / elapsed) * 1000; // Items per second
    }

    /**
     * Format time duration
     * @private
     */
    _formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}j ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Throttled progress update to prevent UI flooding
     * @private
     */
    _throttledProgressUpdate(callback, current, total, status, additionalData = {}) {
        this.createOptimizedProgressIndicator(callback, current, total, status, additionalData);
    }

    /**
     * Yield control to UI thread
     * @private
     */
    async _yieldToUI() {
        return new Promise(resolve => {
            if (typeof requestIdleCallback !== 'undefined') {
                requestIdleCallback(resolve);
            } else {
                setTimeout(resolve, 0);
            }
        });
    }
}

// Export for both browser and Node.js environments
if (typeof window !== 'undefined') {
    window.PerformanceOptimizer = PerformanceOptimizer;
}

// ES Module export
export { PerformanceOptimizer };

// CommonJS export for compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PerformanceOptimizer };
}