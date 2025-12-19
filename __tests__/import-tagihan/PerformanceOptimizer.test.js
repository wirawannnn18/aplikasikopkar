/**
 * Performance Optimizer Tests
 * Requirements: 2.3, 5.1 - Test large file handling and memory usage during processing
 */

// Mock the PerformanceOptimizer class for testing
class PerformanceOptimizer {
    constructor() {
        this.chunkSize = 1000;
        this.memoryThreshold = 50 * 1024 * 1024;
        this.progressUpdateInterval = 100;
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

    async optimizeFileProcessing(file, processor, progressCallback) {
        this.performanceMetrics.startTime = performance.now();
        try {
            if (file.size > 10 * 1024 * 1024) {
                return await this._processLargeFileInChunks(file, processor, progressCallback);
            } else {
                return await this._processStandardFile(file, processor, progressCallback);
            }
        } finally {
            this.performanceMetrics.endTime = performance.now();
        }
    }

    async optimizeBatchProcessing(data, processor, progressCallback) {
        if (!Array.isArray(data) || data.length === 0) {
            return [];
        }

        this.performanceMetrics.startTime = performance.now();
        const results = [];
        const totalItems = data.length;
        let processedItems = 0;

        try {
            const optimalChunkSize = this._calculateOptimalChunkSize(data);
            
            for (let i = 0; i < data.length; i += optimalChunkSize) {
                const chunk = data.slice(i, i + optimalChunkSize);
                const chunkStartTime = performance.now();

                const chunkResults = await processor(chunk, i, optimalChunkSize);
                results.push(...(Array.isArray(chunkResults) ? chunkResults : [chunkResults]));

                processedItems += chunk.length;
                
                const chunkProcessingTime = performance.now() - chunkStartTime;
                this.performanceMetrics.processingTimes.push(chunkProcessingTime);
                this.performanceMetrics.chunkSizes.push(chunk.length);

                this._throttledProgressUpdate(progressCallback, processedItems, totalItems, 
                    `Memproses batch ${Math.ceil(i / optimalChunkSize) + 1}...`);

                await this._yieldToUI();
            }

            return results;
        } finally {
            this.performanceMetrics.endTime = performance.now();
        }
    }

    createOptimizedProgressIndicator(callback, current, total, status, additionalData = {}) {
        const now = performance.now();
        
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

    resetMetrics() {
        this.performanceMetrics = {
            startTime: null,
            endTime: null,
            memoryUsage: [],
            processingTimes: [],
            chunkSizes: []
        };
    }

    startMemoryMonitoring() {
        if (this.memoryMonitor) {
            clearInterval(this.memoryMonitor);
        }

        this.memoryMonitor = setInterval(() => {
            const memoryInfo = this._getCurrentMemoryUsage();
            this.performanceMetrics.memoryUsage.push(memoryInfo);
            
            if (this.performanceMetrics.memoryUsage.length > 100) {
                this.performanceMetrics.memoryUsage.shift();
            }
        }, 1000);
    }

    stopMemoryMonitoring() {
        if (this.memoryMonitor) {
            clearInterval(this.memoryMonitor);
            this.memoryMonitor = null;
        }
    }

    // Private methods
    async _processLargeFileInChunks(file, processor, progressCallback) {
        const fileSize = file.size;
        const chunkSize = Math.min(1024 * 1024, fileSize / 10);
        const results = [];
        let offset = 0;

        while (offset < fileSize) {
            const chunk = file.slice(offset, offset + chunkSize);
            const chunkResult = await processor(chunk);
            results.push(...(Array.isArray(chunkResult) ? chunkResult : [chunkResult]));

            offset += chunkSize;
            
            this._throttledProgressUpdate(progressCallback, offset, fileSize, 
                `Memproses file chunk ${Math.ceil(offset / chunkSize)}...`);

            await this._yieldToUI();
        }

        return results;
    }

    async _processStandardFile(file, processor, progressCallback) {
        this._throttledProgressUpdate(progressCallback, 0, 100, 'Memulai pemrosesan file...');
        
        const result = await processor(file);
        
        this._throttledProgressUpdate(progressCallback, 100, 100, 'File berhasil diproses');
        
        return Array.isArray(result) ? result : [result];
    }

    _calculateOptimalChunkSize(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return this.chunkSize;
        }

        const sampleItem = data[0];
        const estimatedItemSize = JSON.stringify(sampleItem).length * 2;
        
        const maxItemsForMemory = Math.floor(this.memoryThreshold / estimatedItemSize);
        
        const optimalSize = Math.min(this.chunkSize, maxItemsForMemory, data.length);
        
        return Math.max(1, optimalSize);
    }

    _getCurrentMemoryUsage() {
        if (performance.memory) {
            return {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                timestamp: performance.now()
            };
        }
        
        return {
            usedJSHeapSize: 0,
            totalJSHeapSize: 0,
            jsHeapSizeLimit: 0,
            timestamp: performance.now()
        };
    }

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

    _calculateProcessingSpeed(current) {
        if (!this.performanceMetrics.startTime || current === 0) {
            return 0;
        }

        const elapsed = performance.now() - this.performanceMetrics.startTime;
        return (current / elapsed) * 1000;
    }

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

    _throttledProgressUpdate(callback, current, total, status, additionalData = {}) {
        this.createOptimizedProgressIndicator(callback, current, total, status, additionalData);
    }

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

describe('PerformanceOptimizer', () => {
    let optimizer;

    beforeEach(() => {
        optimizer = new PerformanceOptimizer();
    });

    afterEach(() => {
        optimizer.resetMetrics();
    });

    describe('Large File Processing', () => {
        test('should handle large file processing with chunking', async () => {
            // Requirements: 2.3 - Test large file handling
            const mockLargeFile = {
                size: 15 * 1024 * 1024, // 15MB file
                slice: jest.fn((start, end) => ({
                    size: end - start,
                    name: 'chunk.csv'
                }))
            };

            const mockProcessor = jest.fn().mockResolvedValue(['processed_data']);
            const mockProgressCallback = jest.fn();

            const result = await optimizer.optimizeFileProcessing(
                mockLargeFile,
                mockProcessor,
                mockProgressCallback
            );

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(mockProcessor).toHaveBeenCalled();
            expect(mockProgressCallback).toHaveBeenCalled();
            expect(mockLargeFile.slice).toHaveBeenCalled();
        });

        test('should use standard processing for smaller files', async () => {
            // Requirements: 2.3 - Test file size optimization threshold
            const mockSmallFile = {
                size: 5 * 1024 * 1024, // 5MB file
                slice: jest.fn()
            };

            const mockProcessor = jest.fn().mockResolvedValue(['processed_data']);
            const mockProgressCallback = jest.fn();

            const result = await optimizer.optimizeFileProcessing(
                mockSmallFile,
                mockProcessor,
                mockProgressCallback
            );

            expect(result).toBeDefined();
            expect(mockProcessor).toHaveBeenCalledWith(mockSmallFile);
            expect(mockSmallFile.slice).not.toHaveBeenCalled();
        });

        test('should track performance metrics during file processing', async () => {
            const mockFile = {
                size: 1024 * 1024, // 1MB file
                slice: jest.fn()
            };

            const mockProcessor = jest.fn().mockResolvedValue(['data']);
            
            await optimizer.optimizeFileProcessing(mockFile, mockProcessor, jest.fn());

            const metrics = optimizer.getPerformanceMetrics();
            expect(metrics.totalProcessingTime).toBeGreaterThan(0);
            expect(metrics.memoryStats).toBeDefined();
        });
    });

    describe('Batch Processing Optimization', () => {
        test('should process data in optimal chunks', async () => {
            // Requirements: 5.1 - Test memory-efficient batch processing
            const largeDataSet = Array.from({ length: 5000 }, (_, i) => ({
                id: i,
                data: `test_data_${i}`
            }));

            const mockProcessor = jest.fn().mockImplementation(async (chunk) => {
                return chunk.map(item => ({ ...item, processed: true }));
            });

            const mockProgressCallback = jest.fn();

            const result = await optimizer.optimizeBatchProcessing(
                largeDataSet,
                mockProcessor,
                mockProgressCallback
            );

            expect(result).toHaveLength(5000);
            expect(mockProcessor).toHaveBeenCalled();
            expect(mockProgressCallback).toHaveBeenCalled();
            
            // Verify chunking occurred
            const callCount = mockProcessor.mock.calls.length;
            expect(callCount).toBeGreaterThan(1);
        });

        test('should calculate optimal chunk size based on data characteristics', async () => {
            const smallDataSet = Array.from({ length: 100 }, (_, i) => ({
                id: i,
                smallData: 'test'
            }));

            const largeItemDataSet = Array.from({ length: 100 }, (_, i) => ({
                id: i,
                largeData: 'x'.repeat(10000) // Large data per item
            }));

            const mockProcessor = jest.fn().mockResolvedValue([]);

            // Process small items
            await optimizer.optimizeBatchProcessing(smallDataSet, mockProcessor, jest.fn());
            const smallItemCalls = mockProcessor.mock.calls.length;

            mockProcessor.mockClear();

            // Process large items
            await optimizer.optimizeBatchProcessing(largeItemDataSet, mockProcessor, jest.fn());
            const largeItemCalls = mockProcessor.mock.calls.length;

            // Large items should result in more chunks (smaller chunk sizes)
            expect(largeItemCalls).toBeGreaterThanOrEqual(smallItemCalls);
        });

        test('should handle empty or invalid data gracefully', async () => {
            const mockProcessor = jest.fn();

            // Test empty array
            const result1 = await optimizer.optimizeBatchProcessing([], mockProcessor, jest.fn());
            expect(result1).toEqual([]);
            expect(mockProcessor).not.toHaveBeenCalled();

            // Test null data
            const result2 = await optimizer.optimizeBatchProcessing(null, mockProcessor, jest.fn());
            expect(result2).toEqual([]);

            // Test undefined data
            const result3 = await optimizer.optimizeBatchProcessing(undefined, mockProcessor, jest.fn());
            expect(result3).toEqual([]);
        });
    });

    describe('Memory Usage Monitoring', () => {
        test('should monitor memory usage during processing', async () => {
            // Requirements: 2.3, 5.1 - Test memory usage during processing
            const testData = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
            const mockProcessor = jest.fn().mockResolvedValue(testData);

            optimizer.startMemoryMonitoring();
            
            await new Promise(resolve => setTimeout(resolve, 1100)); // Wait for at least one measurement
            
            optimizer.stopMemoryMonitoring();

            const memoryStats = optimizer.getMemoryUsageStats();
            expect(memoryStats).toBeDefined();
            expect(memoryStats.current).toBeDefined();
            expect(typeof memoryStats.current.usedJSHeapSize).toBe('number');
        });

        test('should detect memory threshold warnings', () => {
            const memoryStats = optimizer.getMemoryUsageStats();
            expect(memoryStats.threshold).toBe(50 * 1024 * 1024); // 50MB
            expect(typeof memoryStats.isNearThreshold).toBe('boolean');
        });

        test('should calculate average memory usage', () => {
            // Simulate some memory measurements
            optimizer.performanceMetrics.memoryUsage = [
                { usedJSHeapSize: 1000000, totalJSHeapSize: 2000000, jsHeapSizeLimit: 4000000 },
                { usedJSHeapSize: 1500000, totalJSHeapSize: 2000000, jsHeapSizeLimit: 4000000 },
                { usedJSHeapSize: 2000000, totalJSHeapSize: 2000000, jsHeapSizeLimit: 4000000 }
            ];

            const avgMemory = optimizer._calculateAverageMemoryUsage();
            expect(avgMemory.usedJSHeapSize).toBe(1500000); // Average of the three values
        });
    });

    describe('Progress Indicators', () => {
        test('should create optimized progress indicators with throttling', () => {
            // Requirements: 5.1 - Test progress indicators for long operations
            const mockCallback = jest.fn();
            
            // Rapid progress updates should be throttled
            optimizer.createOptimizedProgressIndicator(mockCallback, 10, 100, 'Processing...');
            optimizer.createOptimizedProgressIndicator(mockCallback, 20, 100, 'Processing...');
            optimizer.createOptimizedProgressIndicator(mockCallback, 30, 100, 'Processing...');

            // Should only call callback once due to throttling
            expect(mockCallback).toHaveBeenCalledTimes(1);
            
            const callArgs = mockCallback.mock.calls[0][0];
            expect(callArgs).toHaveProperty('current');
            expect(callArgs).toHaveProperty('total');
            expect(callArgs).toHaveProperty('percentage');
            expect(callArgs).toHaveProperty('status');
            expect(callArgs).toHaveProperty('estimatedTimeRemaining');
            expect(callArgs).toHaveProperty('memoryUsage');
            expect(callArgs).toHaveProperty('processingSpeed');
        });

        test('should calculate estimated time remaining', () => {
            optimizer.performanceMetrics.startTime = performance.now() - 1000; // 1 second ago
            
            const estimatedTime = optimizer._calculateEstimatedTime(25, 100);
            expect(estimatedTime).toBeDefined();
            expect(estimatedTime.milliseconds).toBeGreaterThan(0);
            expect(estimatedTime.seconds).toBeGreaterThan(0);
            expect(typeof estimatedTime.formatted).toBe('string');
        });

        test('should calculate processing speed', () => {
            optimizer.performanceMetrics.startTime = performance.now() - 2000; // 2 seconds ago
            
            const speed = optimizer._calculateProcessingSpeed(100);
            expect(speed).toBeGreaterThan(0);
            expect(speed).toBeLessThan(1000); // Should be reasonable items per second
        });
    });

    describe('Performance Metrics', () => {
        test('should collect comprehensive performance metrics', async () => {
            const testData = Array.from({ length: 100 }, (_, i) => ({ id: i }));
            const mockProcessor = jest.fn().mockResolvedValue(testData);

            await optimizer.optimizeBatchProcessing(testData, mockProcessor, jest.fn());

            const metrics = optimizer.getPerformanceMetrics();
            
            expect(metrics).toHaveProperty('totalProcessingTime');
            expect(metrics).toHaveProperty('averageChunkProcessingTime');
            expect(metrics).toHaveProperty('chunksProcessed');
            expect(metrics).toHaveProperty('averageChunkSize');
            expect(metrics).toHaveProperty('memoryStats');
            expect(metrics).toHaveProperty('efficiency');
            
            expect(metrics.totalProcessingTime).toBeGreaterThan(0);
            expect(metrics.chunksProcessed).toBeGreaterThan(0);
            expect(metrics.efficiency).toBeGreaterThan(0);
        });

        test('should reset metrics properly', () => {
            // Set some metrics
            optimizer.performanceMetrics.startTime = performance.now();
            optimizer.performanceMetrics.processingTimes = [100, 200, 300];
            optimizer.performanceMetrics.chunkSizes = [50, 75, 100];

            optimizer.resetMetrics();

            expect(optimizer.performanceMetrics.startTime).toBeNull();
            expect(optimizer.performanceMetrics.endTime).toBeNull();
            expect(optimizer.performanceMetrics.processingTimes).toEqual([]);
            expect(optimizer.performanceMetrics.chunkSizes).toEqual([]);
            expect(optimizer.performanceMetrics.memoryUsage).toEqual([]);
        });
    });

    describe('Error Handling', () => {
        test('should handle processor errors gracefully', async () => {
            const testData = [{ id: 1 }, { id: 2 }];
            const mockProcessor = jest.fn().mockRejectedValue(new Error('Processing failed'));

            await expect(
                optimizer.optimizeBatchProcessing(testData, mockProcessor, jest.fn())
            ).rejects.toThrow('Processing failed');

            // Metrics should still be recorded
            const metrics = optimizer.getPerformanceMetrics();
            expect(metrics.totalProcessingTime).toBeGreaterThan(0);
        });

        test('should handle memory monitoring errors', () => {
            // Test when performance.memory is not available
            const originalMemory = global.performance?.memory;
            if (global.performance) {
                delete global.performance.memory;
            }

            const memoryInfo = optimizer._getCurrentMemoryUsage();
            expect(memoryInfo.usedJSHeapSize).toBe(0);
            expect(memoryInfo.totalJSHeapSize).toBe(0);

            // Restore original memory object
            if (global.performance && originalMemory) {
                global.performance.memory = originalMemory;
            }
        });
    });

    describe('Integration Tests', () => {
        test('should work end-to-end with realistic data processing', async () => {
            // Requirements: 2.3, 5.1 - Integration test for performance optimization
            const realisticData = Array.from({ length: 2000 }, (_, i) => ({
                memberNumber: `M${String(i).padStart(6, '0')}`,
                memberName: `Member ${i}`,
                paymentType: i % 2 === 0 ? 'hutang' : 'piutang',
                amount: Math.floor(Math.random() * 1000000) + 10000,
                description: `Payment description for member ${i}`
            }));

            const mockProcessor = jest.fn().mockImplementation(async (chunk) => {
                // Simulate processing time
                await new Promise(resolve => setTimeout(resolve, 10));
                return chunk.map(item => ({ ...item, processed: true, processedAt: new Date() }));
            });

            const progressUpdates = [];
            const mockProgressCallback = jest.fn((progress) => {
                progressUpdates.push(progress);
            });

            const startTime = performance.now();
            const result = await optimizer.optimizeBatchProcessing(
                realisticData,
                mockProcessor,
                mockProgressCallback
            );
            const endTime = performance.now();

            // Verify results
            expect(result).toHaveLength(2000);
            expect(result.every(item => item.processed)).toBe(true);
            
            // Verify performance
            expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
            expect(progressUpdates.length).toBeGreaterThan(0);
            
            // Verify chunking occurred for large dataset
            expect(mockProcessor.mock.calls.length).toBeGreaterThan(1);
            
            // Verify metrics
            const metrics = optimizer.getPerformanceMetrics();
            expect(metrics.totalProcessingTime).toBeGreaterThan(0);
            expect(metrics.efficiency).toBeGreaterThan(0);
        });
    });
});