/**
 * Master Barang Komprehensif - Concurrent Access Manager
 * Manages concurrent access to resources with locking and queuing
 */

export class ConcurrentAccessManager {
    constructor() {
        this.locks = new Map();
        this.operationQueue = [];
        this.processing = false;
        this.maxQueueSize = 1000;
        this.lockTimeout = 30000; // 30 seconds
        this.statistics = {
            totalOperations: 0,
            queuedOperations: 0,
            lockedOperations: 0,
            timeoutOperations: 0,
            averageWaitTime: 0
        };
        this.waitTimes = [];
    }
    
    /**
     * Queue operation to prevent race conditions
     * @param {string} operationType - Type of operation
     * @param {string} resourceId - Resource identifier
     * @param {Function} operation - Operation to execute
     * @param {Object} options - Operation options
     * @returns {Promise} Operation result
     */
    async queueOperation(operationType, resourceId, operation, options = {}) {
        return new Promise((resolve, reject) => {
            const queuedOperation = {
                operationType,
                resourceId,
                operation,
                resolve,
                reject,
                timestamp: Date.now(),
                priority: options.priority || 0,
                timeout: options.timeout || this.lockTimeout,
                retryCount: 0,
                maxRetries: options.maxRetries || 3
            };
            
            // Check queue size
            if (this.operationQueue.length >= this.maxQueueSize) {
                reject(new Error('Operation queue is full'));
                return;
            }
            
            this.operationQueue.push(queuedOperation);
            this.statistics.queuedOperations++;
            
            // Sort queue by priority (higher priority first)
            this.operationQueue.sort((a, b) => b.priority - a.priority);
            
            this.processQueue();
        });
    }
    
    /**
     * Process operation queue
     */
    async processQueue() {
        if (this.processing || this.operationQueue.length === 0) {
            return;
        }
        
        this.processing = true;
        
        while (this.operationQueue.length > 0) {
            const queuedOperation = this.operationQueue.shift();
            
            try {
                // Check operation timeout
                const waitTime = Date.now() - queuedOperation.timestamp;
                if (waitTime > queuedOperation.timeout) {
                    this.statistics.timeoutOperations++;
                    queuedOperation.reject(new Error('Operation timeout'));
                    continue;
                }
                
                // Check if resource is locked
                if (this.isLocked(queuedOperation.resourceId)) {
                    // Check if we can retry
                    if (queuedOperation.retryCount < queuedOperation.maxRetries) {
                        queuedOperation.retryCount++;
                        this.operationQueue.unshift(queuedOperation); // Put back at front
                        await this.sleep(10); // Wait 10ms before retry
                        continue;
                    } else {
                        this.statistics.lockedOperations++;
                        queuedOperation.reject(new Error('Resource is locked and max retries exceeded'));
                        continue;
                    }
                }
                
                // Lock resource
                this.lock(queuedOperation.resourceId);
                
                try {
                    // Execute operation
                    const result = await queuedOperation.operation();
                    
                    // Track statistics
                    this.statistics.totalOperations++;
                    this.waitTimes.push(waitTime);
                    this.updateAverageWaitTime();
                    
                    // Resolve promise
                    queuedOperation.resolve(result);
                    
                } finally {
                    // Always unlock resource
                    this.unlock(queuedOperation.resourceId);
                }
                
            } catch (error) {
                // Unlock resource on error
                this.unlock(queuedOperation.resourceId);
                queuedOperation.reject(error);
            }
        }
        
        this.processing = false;
    }
    
    /**
     * Lock a resource
     * @param {string} resourceId - Resource identifier
     */
    lock(resourceId) {
        this.locks.set(resourceId, {
            timestamp: Date.now(),
            timeout: setTimeout(() => {
                this.unlock(resourceId);
                console.warn(`Lock timeout for resource: ${resourceId}`);
            }, this.lockTimeout)
        });
    }
    
    /**
     * Unlock a resource
     * @param {string} resourceId - Resource identifier
     */
    unlock(resourceId) {
        const lock = this.locks.get(resourceId);
        if (lock) {
            clearTimeout(lock.timeout);
            this.locks.delete(resourceId);
        }
    }
    
    /**
     * Check if resource is locked
     * @param {string} resourceId - Resource identifier
     * @returns {boolean} Lock status
     */
    isLocked(resourceId) {
        return this.locks.has(resourceId);
    }
    
    /**
     * Get lock information
     * @param {string} resourceId - Resource identifier
     * @returns {Object|null} Lock information
     */
    getLockInfo(resourceId) {
        const lock = this.locks.get(resourceId);
        if (lock) {
            return {
                resourceId: resourceId,
                lockedAt: lock.timestamp,
                lockDuration: Date.now() - lock.timestamp,
                isExpired: Date.now() - lock.timestamp > this.lockTimeout
            };
        }
        return null;
    }
    
    /**
     * Force unlock a resource (use with caution)
     * @param {string} resourceId - Resource identifier
     * @returns {boolean} Success status
     */
    forceUnlock(resourceId) {
        if (this.isLocked(resourceId)) {
            this.unlock(resourceId);
            console.warn(`Force unlocked resource: ${resourceId}`);
            return true;
        }
        return false;
    }
    
    /**
     * Clear expired locks
     * @returns {number} Number of locks cleared
     */
    clearExpiredLocks() {
        let clearedCount = 0;
        const now = Date.now();
        
        this.locks.forEach((lock, resourceId) => {
            if (now - lock.timestamp > this.lockTimeout) {
                this.unlock(resourceId);
                clearedCount++;
            }
        });
        
        return clearedCount;
    }
    
    /**
     * Get queue status
     * @returns {Object} Queue status information
     */
    getQueueStatus() {
        const queueByType = {};
        const queueByResource = {};
        
        this.operationQueue.forEach(op => {
            // Count by operation type
            queueByType[op.operationType] = (queueByType[op.operationType] || 0) + 1;
            
            // Count by resource
            queueByResource[op.resourceId] = (queueByResource[op.resourceId] || 0) + 1;
        });
        
        return {
            queueLength: this.operationQueue.length,
            processing: this.processing,
            activeLocks: this.locks.size,
            queueByType: queueByType,
            queueByResource: queueByResource,
            oldestOperation: this.operationQueue.length > 0 ? 
                Date.now() - this.operationQueue[this.operationQueue.length - 1].timestamp : 0
        };
    }
    
    /**
     * Get performance statistics
     * @returns {Object} Performance statistics
     */
    getStatistics() {
        return {
            ...this.statistics,
            currentQueueLength: this.operationQueue.length,
            activeLocks: this.locks.size,
            averageWaitTimeMs: this.statistics.averageWaitTime.toFixed(2),
            successRate: this.statistics.totalOperations > 0 ? 
                ((this.statistics.totalOperations - this.statistics.timeoutOperations - this.statistics.lockedOperations) / this.statistics.totalOperations * 100).toFixed(2) + '%' : '0%'
        };
    }
    
    /**
     * Update average wait time
     */
    updateAverageWaitTime() {
        if (this.waitTimes.length > 0) {
            const sum = this.waitTimes.reduce((a, b) => a + b, 0);
            this.statistics.averageWaitTime = sum / this.waitTimes.length;
            
            // Keep only recent wait times (last 100)
            if (this.waitTimes.length > 100) {
                this.waitTimes = this.waitTimes.slice(-100);
            }
        }
    }
    
    /**
     * Sleep utility function
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise} Sleep promise
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Execute operation with automatic retry
     * @param {string} operationType - Operation type
     * @param {string} resourceId - Resource ID
     * @param {Function} operation - Operation function
     * @param {Object} options - Retry options
     * @returns {Promise} Operation result
     */
    async executeWithRetry(operationType, resourceId, operation, options = {}) {
        const maxRetries = options.maxRetries || 3;
        const retryDelay = options.retryDelay || 100;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.queueOperation(operationType, resourceId, operation, {
                    ...options,
                    maxRetries: 1 // Don't retry within queueOperation
                });
            } catch (error) {
                if (attempt === maxRetries) {
                    throw error;
                }
                
                console.warn(`Operation attempt ${attempt} failed, retrying in ${retryDelay}ms:`, error.message);
                await this.sleep(retryDelay * attempt); // Exponential backoff
            }
        }
    }
    
    /**
     * Batch execute multiple operations
     * @param {Array} operations - Array of operation objects
     * @param {Object} options - Batch options
     * @returns {Promise<Array>} Array of results
     */
    async batchExecute(operations, options = {}) {
        const concurrent = options.concurrent || false;
        const results = [];
        
        if (concurrent) {
            // Execute all operations concurrently
            const promises = operations.map(op => 
                this.queueOperation(op.operationType, op.resourceId, op.operation, op.options)
            );
            
            return await Promise.allSettled(promises);
        } else {
            // Execute operations sequentially
            for (const op of operations) {
                try {
                    const result = await this.queueOperation(
                        op.operationType, 
                        op.resourceId, 
                        op.operation, 
                        op.options
                    );
                    results.push({ status: 'fulfilled', value: result });
                } catch (error) {
                    results.push({ status: 'rejected', reason: error });
                }
            }
            
            return results;
        }
    }
    
    /**
     * Clear all locks and queue (emergency use)
     */
    emergency_clear() {
        console.warn('Emergency clear: Clearing all locks and queue');
        
        // Clear all locks
        this.locks.forEach((lock, resourceId) => {
            clearTimeout(lock.timeout);
        });
        this.locks.clear();
        
        // Reject all queued operations
        this.operationQueue.forEach(op => {
            op.reject(new Error('Emergency clear: Operation cancelled'));
        });
        this.operationQueue = [];
        
        this.processing = false;
    }
    
    /**
     * Configure concurrent access manager
     * @param {Object} config - Configuration options
     */
    configure(config) {
        if (config.maxQueueSize !== undefined) {
            this.maxQueueSize = config.maxQueueSize;
        }
        if (config.lockTimeout !== undefined) {
            this.lockTimeout = config.lockTimeout;
        }
    }
}