/**
 * Batch Processing System for Excel Upload
 * Handles chunked data processing for performance optimization
 * 
 * Requirements: 1.5, 5.1, 5.2
 */

class BatchProcessor {
    constructor(options = {}) {
        this.chunkSize = options.chunkSize || 50; // Process 50 records at a time
        this.delayBetweenChunks = options.delayBetweenChunks || 10; // 10ms delay
        this.maxConcurrentChunks = options.maxConcurrentChunks || 3;
        this.progressCallback = options.progressCallback || null;
        this.errorCallback = options.errorCallback || null;
        
        this.isProcessing = false;
        this.isPaused = false;
        this.isCancelled = false;
        this.currentProgress = 0;
        this.totalRecords = 0;
        this.processedRecords = 0;
        this.failedRecords = 0;
        this.successfulRecords = 0;
        this.processingStartTime = null;
        this.estimatedTimeRemaining = 0;
        
        // Processing state
        this.currentChunk = 0;
        this.totalChunks = 0;
        this.processingQueue = [];
        this.results = [];
        this.errors = [];
        
        // Performance monitoring
        this.performanceMetrics = {
            recordsPerSecond: 0,
            averageChunkTime: 0,
            totalProcessingTime: 0,
            memoryUsage: 0
        };
    }

    /**
     * Process data in chunks with progress tracking
     * @param {Array} data - Array of data records to process
     * @param {Function} processingFunction - Function to process each chunk
     * @param {Object} options - Processing options
     */
    async processData(data, processingFunction, options = {}) {
        if (this.isProcessing) {
            throw new Error('Batch processor is already running');
        }

        try {
            this.initializeProcessing(data, options);
            
            // Create chunks
            const chunks = this.createChunks(data);
            this.totalChunks = chunks.length;
            
            this.updateProgress(0, 'Memulai pemrosesan batch...');
            
            // Process chunks
            const results = await this.processChunks(chunks, processingFunction);
            
            // Finalize processing
            this.finalizeProcessing();
            
            return {
                success: true,
                totalRecords: this.totalRecords,
                processedRecords: this.processedRecords,
                successfulRecords: this.successfulRecords,
                failedRecords: this.failedRecords,
                results: results,
                errors: this.errors,
                performanceMetrics: this.performanceMetrics
            };
            
        } catch (error) {
            this.handleProcessingError(error);
            throw error;
        } finally {
            this.cleanup();
        }
    }

    /**
     * Initialize processing state
     * @param {Array} data - Data to process
     * @param {Object} options - Processing options
     */
    initializeProcessing(data, options) {
        this.isProcessing = true;
        this.isPaused = false;
        this.isCancelled = false;
        this.currentProgress = 0;
        this.totalRecords = data.length;
        this.processedRecords = 0;
        this.failedRecords = 0;
        this.successfulRecords = 0;
        this.processingStartTime = Date.now();
        this.estimatedTimeRemaining = 0;
        
        this.currentChunk = 0;
        this.totalChunks = 0;
        this.processingQueue = [];
        this.results = [];
        this.errors = [];
        
        // Override default settings if provided
        if (options.chunkSize) this.chunkSize = options.chunkSize;
        if (options.delayBetweenChunks !== undefined) this.delayBetweenChunks = options.delayBetweenChunks;
        if (options.maxConcurrentChunks) this.maxConcurrentChunks = options.maxConcurrentChunks;
        
        console.log(`Batch processing initialized: ${this.totalRecords} records, chunk size: ${this.chunkSize}`);
    }

    /**
     * Create data chunks for processing
     * @param {Array} data - Data to chunk
     * @returns {Array} Array of chunks
     */
    createChunks(data) {
        const chunks = [];
        
        for (let i = 0; i < data.length; i += this.chunkSize) {
            const chunk = {
                id: Math.floor(i / this.chunkSize),
                startIndex: i,
                endIndex: Math.min(i + this.chunkSize, data.length),
                data: data.slice(i, i + this.chunkSize),
                size: Math.min(this.chunkSize, data.length - i)
            };
            chunks.push(chunk);
        }
        
        return chunks;
    }

    /**
     * Process chunks with concurrency control
     * @param {Array} chunks - Chunks to process
     * @param {Function} processingFunction - Processing function
     * @returns {Array} Processing results
     */
    async processChunks(chunks, processingFunction) {
        const results = [];
        const concurrentPromises = [];
        
        for (let i = 0; i < chunks.length; i++) {
            if (this.isCancelled) {
                break;
            }
            
            // Wait if paused
            while (this.isPaused && !this.isCancelled) {
                await this.sleep(100);
            }
            
            const chunk = chunks[i];
            
            // Process chunk
            const chunkPromise = this.processChunk(chunk, processingFunction, i);
            concurrentPromises.push(chunkPromise);
            
            // Control concurrency
            if (concurrentPromises.length >= this.maxConcurrentChunks || i === chunks.length - 1) {
                const chunkResults = await Promise.allSettled(concurrentPromises);
                
                // Process results
                chunkResults.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        results.push(result.value);
                        this.successfulRecords += result.value.successCount || 0;
                        this.failedRecords += result.value.failureCount || 0;
                    } else {
                        this.errors.push({
                            chunkId: concurrentPromises[index].chunkId,
                            error: result.reason,
                            timestamp: new Date().toISOString()
                        });
                        this.failedRecords += chunk.size;
                    }
                });
                
                // Clear processed promises
                concurrentPromises.length = 0;
                
                // Update progress
                this.processedRecords = Math.min(
                    (i + 1) * this.chunkSize, 
                    this.totalRecords
                );
                this.updateProgressMetrics();
                
                // Add delay between batches
                if (this.delayBetweenChunks > 0 && i < chunks.length - 1) {
                    await this.sleep(this.delayBetweenChunks);
                }
            }
        }
        
        return results;
    }

    /**
     * Process individual chunk
     * @param {Object} chunk - Chunk to process
     * @param {Function} processingFunction - Processing function
     * @param {number} chunkIndex - Chunk index
     * @returns {Object} Chunk processing result
     */
    async processChunk(chunk, processingFunction, chunkIndex) {
        const chunkStartTime = Date.now();
        
        try {
            this.updateProgress(
                (chunkIndex / this.totalChunks) * 100,
                `Memproses chunk ${chunkIndex + 1} dari ${this.totalChunks}...`
            );
            
            // Process the chunk data
            const result = await processingFunction(chunk.data, chunk.id, {
                startIndex: chunk.startIndex,
                endIndex: chunk.endIndex,
                chunkSize: chunk.size,
                totalRecords: this.totalRecords
            });
            
            // Calculate chunk processing time
            const chunkProcessingTime = Date.now() - chunkStartTime;
            this.updateChunkMetrics(chunkProcessingTime, chunk.size);
            
            return {
                chunkId: chunk.id,
                startIndex: chunk.startIndex,
                endIndex: chunk.endIndex,
                successCount: result.successCount || chunk.size,
                failureCount: result.failureCount || 0,
                processingTime: chunkProcessingTime,
                result: result
            };
            
        } catch (error) {
            const chunkProcessingTime = Date.now() - chunkStartTime;
            this.updateChunkMetrics(chunkProcessingTime, chunk.size);
            
            console.error(`Error processing chunk ${chunk.id}:`, error);
            
            if (this.errorCallback) {
                this.errorCallback(error, chunk);
            }
            
            throw {
                chunkId: chunk.id,
                error: error,
                processingTime: chunkProcessingTime
            };
        }
    }

    /**
     * Update progress metrics and call progress callback
     */
    updateProgressMetrics() {
        const currentTime = Date.now();
        const elapsedTime = currentTime - this.processingStartTime;
        
        // Calculate progress percentage
        this.currentProgress = (this.processedRecords / this.totalRecords) * 100;
        
        // Calculate records per second
        this.performanceMetrics.recordsPerSecond = this.processedRecords / (elapsedTime / 1000);
        
        // Estimate time remaining
        if (this.processedRecords > 0) {
            const recordsRemaining = this.totalRecords - this.processedRecords;
            this.estimatedTimeRemaining = (recordsRemaining / this.performanceMetrics.recordsPerSecond) * 1000;
        }
        
        // Update memory usage (approximate)
        if (performance && performance.memory) {
            this.performanceMetrics.memoryUsage = performance.memory.usedJSHeapSize;
        }
        
        // Call progress callback
        if (this.progressCallback) {
            this.progressCallback({
                progress: this.currentProgress,
                processedRecords: this.processedRecords,
                totalRecords: this.totalRecords,
                successfulRecords: this.successfulRecords,
                failedRecords: this.failedRecords,
                currentChunk: this.currentChunk,
                totalChunks: this.totalChunks,
                estimatedTimeRemaining: this.estimatedTimeRemaining,
                performanceMetrics: { ...this.performanceMetrics }
            });
        }
    }

    /**
     * Update chunk-specific metrics
     * @param {number} processingTime - Time taken to process chunk
     * @param {number} chunkSize - Size of processed chunk
     */
    updateChunkMetrics(processingTime, chunkSize) {
        // Update average chunk time
        const totalChunksProcessed = this.currentChunk + 1;
        this.performanceMetrics.averageChunkTime = 
            (this.performanceMetrics.averageChunkTime * this.currentChunk + processingTime) / totalChunksProcessed;
        
        this.currentChunk++;
    }

    /**
     * Update progress with message
     * @param {number} percentage - Progress percentage
     * @param {string} message - Progress message
     */
    updateProgress(percentage, message) {
        this.currentProgress = Math.min(100, Math.max(0, percentage));
        
        if (this.progressCallback) {
            this.progressCallback({
                progress: this.currentProgress,
                message: message,
                processedRecords: this.processedRecords,
                totalRecords: this.totalRecords,
                successfulRecords: this.successfulRecords,
                failedRecords: this.failedRecords,
                estimatedTimeRemaining: this.estimatedTimeRemaining,
                performanceMetrics: { ...this.performanceMetrics }
            });
        }
    }

    /**
     * Finalize processing and calculate final metrics
     */
    finalizeProcessing() {
        const totalProcessingTime = Date.now() - this.processingStartTime;
        
        this.performanceMetrics.totalProcessingTime = totalProcessingTime;
        this.performanceMetrics.recordsPerSecond = this.totalRecords / (totalProcessingTime / 1000);
        
        this.updateProgress(100, 'Pemrosesan batch selesai');
        
        console.log('Batch processing completed:', {
            totalRecords: this.totalRecords,
            processedRecords: this.processedRecords,
            successfulRecords: this.successfulRecords,
            failedRecords: this.failedRecords,
            totalTime: totalProcessingTime,
            recordsPerSecond: this.performanceMetrics.recordsPerSecond
        });
    }

    /**
     * Handle processing errors
     * @param {Error} error - Processing error
     */
    handleProcessingError(error) {
        console.error('Batch processing error:', error);
        
        this.errors.push({
            type: 'processing_error',
            error: error.message,
            timestamp: new Date().toISOString(),
            context: {
                currentChunk: this.currentChunk,
                processedRecords: this.processedRecords,
                totalRecords: this.totalRecords
            }
        });
        
        if (this.errorCallback) {
            this.errorCallback(error, {
                type: 'batch_processing_error',
                currentProgress: this.currentProgress,
                processedRecords: this.processedRecords
            });
        }
    }

    /**
     * Cleanup processing state
     */
    cleanup() {
        this.isProcessing = false;
        this.isPaused = false;
        this.isCancelled = false;
    }

    /**
     * Pause processing
     */
    pause() {
        if (this.isProcessing) {
            this.isPaused = true;
            this.updateProgress(this.currentProgress, 'Pemrosesan dijeda...');
        }
    }

    /**
     * Resume processing
     */
    resume() {
        if (this.isProcessing && this.isPaused) {
            this.isPaused = false;
            this.updateProgress(this.currentProgress, 'Melanjutkan pemrosesan...');
        }
    }

    /**
     * Cancel processing
     */
    cancel() {
        if (this.isProcessing) {
            this.isCancelled = true;
            this.updateProgress(this.currentProgress, 'Membatalkan pemrosesan...');
        }
    }

    /**
     * Get current processing status
     * @returns {Object} Current status
     */
    getStatus() {
        return {
            isProcessing: this.isProcessing,
            isPaused: this.isPaused,
            isCancelled: this.isCancelled,
            currentProgress: this.currentProgress,
            processedRecords: this.processedRecords,
            totalRecords: this.totalRecords,
            successfulRecords: this.successfulRecords,
            failedRecords: this.failedRecords,
            estimatedTimeRemaining: this.estimatedTimeRemaining,
            performanceMetrics: { ...this.performanceMetrics }
        };
    }

    /**
     * Estimate processing time for given data size
     * @param {number} recordCount - Number of records to process
     * @returns {number} Estimated time in milliseconds
     */
    estimateProcessingTime(recordCount) {
        if (this.performanceMetrics.recordsPerSecond > 0) {
            return (recordCount / this.performanceMetrics.recordsPerSecond) * 1000;
        }
        
        // Default estimate: 10 records per second
        return (recordCount / 10) * 1000;
    }

    /**
     * Optimize chunk size based on performance
     * @param {number} targetProcessingTime - Target time per chunk in ms
     */
    optimizeChunkSize(targetProcessingTime = 100) {
        if (this.performanceMetrics.averageChunkTime > 0 && this.chunkSize > 0) {
            const currentTimePerRecord = this.performanceMetrics.averageChunkTime / this.chunkSize;
            const optimalChunkSize = Math.floor(targetProcessingTime / currentTimePerRecord);
            
            // Keep chunk size within reasonable bounds
            this.chunkSize = Math.max(10, Math.min(200, optimalChunkSize));
            
            console.log(`Optimized chunk size to: ${this.chunkSize}`);
        }
    }

    /**
     * Sleep utility for delays
     * @param {number} ms - Milliseconds to sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Process data with automatic retry on failure
     * @param {Array} data - Data to process
     * @param {Function} processingFunction - Processing function
     * @param {Object} options - Processing options
     * @returns {Object} Processing result
     */
    async processWithRetry(data, processingFunction, options = {}) {
        const maxRetries = options.maxRetries || 3;
        const retryDelay = options.retryDelay || 1000;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.processData(data, processingFunction, options);
            } catch (error) {
                console.warn(`Batch processing attempt ${attempt} failed:`, error);
                
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // Wait before retry
                await this.sleep(retryDelay * attempt);
                
                // Reset state for retry
                this.cleanup();
            }
        }
    }
}

// Export for use in other modules
export default BatchProcessor;