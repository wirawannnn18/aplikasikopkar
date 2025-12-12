/**
 * Property-Based Test: Progress Display Consistency
 * Feature: upload-master-barang-excel, Property 14: Progress Display Consistency
 * 
 * Tests that for any running import process, the system displays real-time progress 
 * indicators and status updates without blocking the UI.
 * 
 * Validates: Requirements 5.2
 */

import fc from 'fast-check';
import BatchProcessor from '../../js/upload-excel/BatchProcessor.js';

describe('Property Test: Progress Display Consistency', () => {
    let batchProcessor;

    beforeEach(() => {
        batchProcessor = new BatchProcessor();
    });

    afterEach(() => {
        if (batchProcessor.isProcessing) {
            batchProcessor.cancel();
        }
    });

    test('should display consistent progress indicators for any import process', () => {
        fc.assert(fc.property(
            fc.array(fc.record({
                kode: fc.string({ minLength: 1, maxLength: 20 }),
                nama: fc.string({ minLength: 1, maxLength: 100 }),
                kategori: fc.string({ minLength: 1, maxLength: 50 }),
                satuan: fc.string({ minLength: 1, maxLength: 20 }),
                harga_beli: fc.float({ min: Math.fround(0.01), max: Math.fround(10000) }),
                stok: fc.integer({ min: 0, max: 1000 })
            }), { minLength: 10, maxLength: 100 }),
            fc.integer({ min: 5, max: 20 }), // chunkSize
            async (testData, chunkSize) => {
                const progressUpdates = [];
                let lastProgress = -1;
                let uiBlocked = false;
                let progressInconsistency = false;

                // Mock processing function that simulates work
                const mockProcessingFunction = async (chunk) => {
                    // Simulate processing time without blocking
                    await new Promise(resolve => {
                        setTimeout(() => {
                            // Check if UI would be blocked (synchronous operation > 16ms)
                            const start = Date.now();
                            // Simulate some work
                            let sum = 0;
                            for (let i = 0; i < 1000; i++) {
                                sum += Math.random();
                            }
                            const processingTime = Date.now() - start;
                            
                            if (processingTime > 16) { // 60fps = 16ms per frame
                                uiBlocked = true;
                            }
                            
                            resolve();
                        }, 1);
                    });

                    return {
                        successCount: chunk.length,
                        failureCount: 0
                    };
                };

                // Configure batch processor with progress tracking
                const processor = new BatchProcessor({
                    chunkSize: chunkSize,
                    delayBetweenChunks: 1,
                    progressCallback: (progressInfo) => {
                        progressUpdates.push({
                            ...progressInfo,
                            timestamp: Date.now()
                        });

                        // Check progress consistency
                        if (progressInfo.progress < lastProgress) {
                            progressInconsistency = true;
                        }
                        lastProgress = progressInfo.progress;
                    }
                });

                // Act: Process data
                const result = await processor.processData(testData, mockProcessingFunction);

                // Assert: Progress display consistency
                expect(progressUpdates.length).toBeGreaterThan(0);
                expect(progressInconsistency).toBe(false);
                expect(uiBlocked).toBe(false);

                // Assert: Progress values are within valid range
                progressUpdates.forEach(update => {
                    expect(update.progress).toBeGreaterThanOrEqual(0);
                    expect(update.progress).toBeLessThanOrEqual(100);
                    expect(update.processedRecords).toBeLessThanOrEqual(update.totalRecords);
                });

                // Assert: Final progress should be 100%
                const finalUpdate = progressUpdates[progressUpdates.length - 1];
                expect(finalUpdate.progress).toBe(100);
                expect(finalUpdate.processedRecords).toBe(testData.length);

                // Assert: Progress updates are chronologically ordered
                for (let i = 1; i < progressUpdates.length; i++) {
                    expect(progressUpdates[i].timestamp).toBeGreaterThanOrEqual(
                        progressUpdates[i - 1].timestamp
                    );
                }

                // Assert: Processing completed successfully
                expect(result.success).toBe(true);
                expect(result.totalRecords).toBe(testData.length);
            }
        ), { numRuns: 30 });
    });

    test('should maintain progress consistency during pause and resume operations', () => {
        fc.assert(fc.property(
            fc.array(fc.record({
                kode: fc.string({ minLength: 1, maxLength: 20 }),
                nama: fc.string({ minLength: 1, maxLength: 100 })
            }), { minLength: 20, maxLength: 50 }),
            async (testData) => {
                const progressUpdates = [];
                let pauseTriggered = false;
                let resumeTriggered = false;

                const mockProcessingFunction = async (chunk) => {
                    // Trigger pause after processing some chunks
                    if (!pauseTriggered && progressUpdates.length > 2) {
                        pauseTriggered = true;
                        setTimeout(() => {
                            processor.pause();
                            setTimeout(() => {
                                resumeTriggered = true;
                                processor.resume();
                            }, 10);
                        }, 5);
                    }

                    await new Promise(resolve => setTimeout(resolve, 5));
                    return {
                        successCount: chunk.length,
                        failureCount: 0
                    };
                };

                const processor = new BatchProcessor({
                    chunkSize: 5,
                    delayBetweenChunks: 2,
                    progressCallback: (progressInfo) => {
                        progressUpdates.push({
                            ...progressInfo,
                            isPaused: processor.isPaused,
                            timestamp: Date.now()
                        });
                    }
                });

                // Act: Process with pause/resume
                const result = await processor.processData(testData, mockProcessingFunction);

                // Assert: Progress consistency maintained during pause/resume
                expect(pauseTriggered).toBe(true);
                expect(resumeTriggered).toBe(true);

                // Check that progress never decreases
                let maxProgress = 0;
                progressUpdates.forEach(update => {
                    expect(update.progress).toBeGreaterThanOrEqual(maxProgress);
                    maxProgress = Math.max(maxProgress, update.progress);
                });

                // Assert: Final completion
                expect(result.success).toBe(true);
                expect(result.totalRecords).toBe(testData.length);
            }
        ), { numRuns: 20 });
    });

    test('should provide accurate time estimates throughout processing', () => {
        fc.assert(fc.property(
            fc.array(fc.record({
                kode: fc.string({ minLength: 1, maxLength: 20 }),
                nama: fc.string({ minLength: 1, maxLength: 100 })
            }), { minLength: 30, maxLength: 60 }),
            async (testData) => {
                const progressUpdates = [];
                const startTime = Date.now();

                const mockProcessingFunction = async (chunk) => {
                    // Consistent processing time per chunk
                    await new Promise(resolve => setTimeout(resolve, 10));
                    return {
                        successCount: chunk.length,
                        failureCount: 0
                    };
                };

                const processor = new BatchProcessor({
                    chunkSize: 10,
                    delayBetweenChunks: 1,
                    progressCallback: (progressInfo) => {
                        progressUpdates.push({
                            ...progressInfo,
                            actualElapsed: Date.now() - startTime
                        });
                    }
                });

                // Act: Process data
                await processor.processData(testData, mockProcessingFunction);

                // Assert: Time estimates become more accurate over time
                const midPointUpdates = progressUpdates.filter(u => u.progress > 25 && u.progress < 75);
                
                if (midPointUpdates.length > 0) {
                    midPointUpdates.forEach(update => {
                        // Estimated time remaining should be reasonable
                        expect(update.estimatedTimeRemaining).toBeGreaterThan(0);
                        
                        // Records per second should be calculated
                        if (update.performanceMetrics) {
                            expect(update.performanceMetrics.recordsPerSecond).toBeGreaterThan(0);
                        }
                    });
                }

                // Assert: Performance metrics are provided
                const finalUpdate = progressUpdates[progressUpdates.length - 1];
                expect(finalUpdate.performanceMetrics).toBeDefined();
                expect(finalUpdate.performanceMetrics.recordsPerSecond).toBeGreaterThan(0);
            }
        ), { numRuns: 20 });
    });

    test('should handle error scenarios without breaking progress display', () => {
        fc.assert(fc.property(
            fc.array(fc.record({
                kode: fc.string({ minLength: 1, maxLength: 20 }),
                nama: fc.string({ minLength: 1, maxLength: 100 }),
                shouldFail: fc.boolean()
            }), { minLength: 15, maxLength: 30 }),
            async (testData) => {
                const progressUpdates = [];
                let errorOccurred = false;

                const mockProcessingFunction = async (chunk) => {
                    // Simulate random failures
                    const failingItems = chunk.filter(item => item.shouldFail);
                    if (failingItems.length > 0) {
                        errorOccurred = true;
                        // Simulate partial failure
                        return {
                            successCount: chunk.length - failingItems.length,
                            failureCount: failingItems.length
                        };
                    }

                    await new Promise(resolve => setTimeout(resolve, 5));
                    return {
                        successCount: chunk.length,
                        failureCount: 0
                    };
                };

                const processor = new BatchProcessor({
                    chunkSize: 8,
                    delayBetweenChunks: 1,
                    progressCallback: (progressInfo) => {
                        progressUpdates.push(progressInfo);
                    },
                    errorCallback: (error, context) => {
                        // Error callback should not break progress tracking
                        expect(context).toBeDefined();
                    }
                });

                // Act: Process data with potential errors
                const result = await processor.processData(testData, mockProcessingFunction);

                // Assert: Progress display continues despite errors
                expect(progressUpdates.length).toBeGreaterThan(0);

                // Progress should still reach 100% even with failures
                const finalUpdate = progressUpdates[progressUpdates.length - 1];
                expect(finalUpdate.progress).toBe(100);

                // Total processed should equal total records
                expect(finalUpdate.processedRecords).toBe(testData.length);

                // Success + failure counts should match total
                expect(result.successfulRecords + result.failedRecords).toBe(testData.length);

                // If errors occurred, they should be tracked
                if (errorOccurred) {
                    expect(result.failedRecords).toBeGreaterThan(0);
                }
            }
        ), { numRuns: 25 });
    });

    test('should maintain UI responsiveness with different chunk sizes', () => {
        fc.assert(fc.property(
            fc.array(fc.record({
                kode: fc.string({ minLength: 1, maxLength: 20 }),
                nama: fc.string({ minLength: 1, maxLength: 100 })
            }), { minLength: 50, maxLength: 100 }),
            fc.integer({ min: 1, max: 50 }), // chunkSize
            async (testData, chunkSize) => {
                const progressUpdates = [];
                const frameTimes = [];
                let maxFrameTime = 0;

                const mockProcessingFunction = async (chunk) => {
                    const frameStart = Date.now();
                    
                    // Simulate processing work
                    await new Promise(resolve => setTimeout(resolve, 1));
                    
                    const frameTime = Date.now() - frameStart;
                    frameTimes.push(frameTime);
                    maxFrameTime = Math.max(maxFrameTime, frameTime);

                    return {
                        successCount: chunk.length,
                        failureCount: 0
                    };
                };

                const processor = new BatchProcessor({
                    chunkSize: chunkSize,
                    delayBetweenChunks: 0,
                    progressCallback: (progressInfo) => {
                        progressUpdates.push(progressInfo);
                    }
                });

                // Act: Process data
                await processor.processData(testData, mockProcessingFunction);

                // Assert: UI responsiveness maintained
                // No single frame should take longer than 50ms (20fps minimum)
                expect(maxFrameTime).toBeLessThan(50);

                // Progress updates should be frequent enough
                const expectedMinUpdates = Math.ceil(testData.length / chunkSize);
                expect(progressUpdates.length).toBeGreaterThanOrEqual(expectedMinUpdates);

                // All progress values should be valid
                progressUpdates.forEach(update => {
                    expect(update.progress).toBeGreaterThanOrEqual(0);
                    expect(update.progress).toBeLessThanOrEqual(100);
                    expect(Number.isFinite(update.progress)).toBe(true);
                });
            }
        ), { numRuns: 20 });
    });
});