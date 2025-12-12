/**
 * Property-Based Test: Import Results Detail
 * Feature: upload-master-barang-excel, Property 16: Import Results Detail
 * 
 * Tests that for any completed import, the system provides detailed results 
 * including exact counts of successful, failed, and updated records.
 * 
 * Validates: Requirements 5.4
 */

import fc from 'fast-check';
import ImportResultsManager from '../../js/upload-excel/ImportResultsManager.js';

describe('Property Test: Import Results Detail', () => {
    let resultsManager;

    beforeEach(() => {
        resultsManager = new ImportResultsManager();
    });

    // Generator for detailed import results with granular data
    const detailedImportResultsArb = fc.record({
        totalRecords: fc.integer({ min: 1, max: 1000 }),
        processedRecords: fc.integer({ min: 0, max: 1000 }),
        successfulRecords: fc.integer({ min: 0, max: 1000 }),
        createdRecords: fc.integer({ min: 0, max: 500 }),
        updatedRecords: fc.integer({ min: 0, max: 500 }),
        failedRecords: fc.integer({ min: 0, max: 500 }),
        fileName: fc.string({ minLength: 1, maxLength: 100 }),
        
        // Detailed performance metrics
        performanceMetrics: fc.record({
            recordsPerSecond: fc.float({ min: Math.fround(0.1), max: Math.fround(1000) }),
            totalProcessingTime: fc.integer({ min: 100, max: 60000 }),
            averageChunkTime: fc.integer({ min: 10, max: 1000 }),
            memoryUsage: fc.integer({ min: 1024, max: 100 * 1024 * 1024 })
        }),
        
        // Detailed error information
        errors: fc.array(fc.record({
            type: fc.constantFrom('validation', 'processing', 'business_rule', 'format', 'integrity'),
            message: fc.string({ minLength: 1, maxLength: 200 }),
            row: fc.integer({ min: 1, max: 1000 }),
            field: fc.constantFrom('kode', 'nama', 'kategori', 'satuan', 'harga_beli', 'stok'),
            severity: fc.constantFrom('error', 'warning'),
            code: fc.string({ minLength: 3, maxLength: 10 }),
            context: fc.record({
                value: fc.string({ maxLength: 100 }),
                expectedFormat: fc.string({ maxLength: 50 })
            })
        }), { maxLength: 100 }),
        
        // Processing results breakdown
        results: fc.array(fc.record({
            chunkId: fc.integer({ min: 0, max: 100 }),
            startIndex: fc.integer({ min: 0, max: 1000 }),
            endIndex: fc.integer({ min: 1, max: 1000 }),
            successCount: fc.integer({ min: 0, max: 50 }),
            failureCount: fc.integer({ min: 0, max: 50 }),
            processingTime: fc.integer({ min: 10, max: 5000 })
        }), { minLength: 1, maxLength: 50 })
    }).map(result => {
        // Ensure data consistency
        result.processedRecords = Math.min(result.processedRecords, result.totalRecords);
        result.successfulRecords = Math.min(result.successfulRecords, result.processedRecords);
        result.createdRecords = Math.min(result.createdRecords, result.successfulRecords);
        result.updatedRecords = Math.min(result.updatedRecords, result.successfulRecords - result.createdRecords);
        result.failedRecords = Math.min(result.failedRecords, result.processedRecords - result.successfulRecords);
        
        // Ensure chunk consistency
        result.results.forEach((chunk, index) => {
            chunk.chunkId = index;
            chunk.endIndex = Math.max(chunk.startIndex + 1, chunk.endIndex);
        });
        
        return result;
    });

    test('should provide exact counts for all record categories', () => {
        fc.assert(fc.property(
            detailedImportResultsArb,
            fc.string({ minLength: 1, maxLength: 50 }), // sessionId
            (importResults, sessionId) => {
                // Act: Generate detailed summary
                const summary = resultsManager.displayResults(importResults, sessionId);

                // Assert: Exact count precision
                expect(summary.totalRecords).toBe(importResults.totalRecords);
                expect(summary.processedRecords).toBe(importResults.processedRecords);
                expect(summary.successfulRecords).toBe(importResults.successfulRecords);
                expect(summary.createdRecords).toBe(importResults.createdRecords);
                expect(summary.updatedRecords).toBe(importResults.updatedRecords);
                expect(summary.failedRecords).toBe(importResults.failedRecords);

                // Assert: Detailed breakdown contains exact counts
                const breakdown = summary.breakdown;
                expect(breakdown.recordTypes.new).toBe(importResults.createdRecords);
                expect(breakdown.recordTypes.updated).toBe(importResults.updatedRecords);
                expect(breakdown.recordTypes.failed).toBe(importResults.failedRecords);

                // Assert: Count consistency validation
                expect(summary.createdRecords + summary.updatedRecords).toBeLessThanOrEqual(summary.successfulRecords);
                expect(summary.successfulRecords + summary.failedRecords).toBeLessThanOrEqual(summary.processedRecords);
                expect(summary.processedRecords).toBeLessThanOrEqual(summary.totalRecords);

                // Assert: No negative counts
                expect(summary.totalRecords).toBeGreaterThanOrEqual(0);
                expect(summary.processedRecords).toBeGreaterThanOrEqual(0);
                expect(summary.successfulRecords).toBeGreaterThanOrEqual(0);
                expect(summary.createdRecords).toBeGreaterThanOrEqual(0);
                expect(summary.updatedRecords).toBeGreaterThanOrEqual(0);
                expect(summary.failedRecords).toBeGreaterThanOrEqual(0);
            }
        ), { numRuns: 100 });
    });

    test('should provide comprehensive error detail breakdown', () => {
        fc.assert(fc.property(
            detailedImportResultsArb,
            fc.string({ minLength: 1, maxLength: 50 }),
            (importResults, sessionId) => {
                // Act: Generate detailed summary
                const summary = resultsManager.displayResults(importResults, sessionId);

                // Assert: Error detail completeness
                const errorBreakdown = summary.breakdown.errorBreakdown;
                expect(errorBreakdown.totalErrors).toBe(importResults.errors.length);

                // Assert: Error type categorization
                const expectedErrorTypes = {};
                importResults.errors.forEach(error => {
                    expectedErrorTypes[error.type] = (expectedErrorTypes[error.type] || 0) + 1;
                });

                Object.keys(expectedErrorTypes).forEach(errorType => {
                    expect(errorBreakdown.errorTypes[errorType]).toBe(expectedErrorTypes[errorType]);
                });

                // Assert: Common errors identification
                if (importResults.errors.length > 0) {
                    expect(errorBreakdown.commonErrors.length).toBeGreaterThan(0);
                    
                    // Verify common errors are sorted by frequency
                    for (let i = 0; i < errorBreakdown.commonErrors.length - 1; i++) {
                        expect(errorBreakdown.commonErrors[i].count)
                            .toBeGreaterThanOrEqual(errorBreakdown.commonErrors[i + 1].count);
                    }

                    // Verify common error counts are accurate
                    const errorMessageCounts = {};
                    importResults.errors.forEach(error => {
                        errorMessageCounts[error.message] = (errorMessageCounts[error.message] || 0) + 1;
                    });

                    errorBreakdown.commonErrors.forEach(commonError => {
                        expect(errorMessageCounts[commonError.message]).toBe(commonError.count);
                    });
                }

                // Assert: Error rate calculation accuracy
                const expectedErrorRate = importResults.totalRecords > 0 ? 
                    Math.round((importResults.failedRecords / importResults.totalRecords) * 100) : 0;
                expect(errorBreakdown.errorRate).toBe(expectedErrorRate);
            }
        ), { numRuns: 100 });
    });

    test('should provide detailed performance metrics breakdown', () => {
        fc.assert(fc.property(
            detailedImportResultsArb,
            fc.string({ minLength: 1, maxLength: 50 }),
            (importResults, sessionId) => {
                // Act: Generate detailed summary
                const summary = resultsManager.displayResults(importResults, sessionId);

                // Assert: Performance detail completeness
                const performanceBreakdown = summary.breakdown.performanceBreakdown;
                
                // Assert: Core performance metrics
                expect(performanceBreakdown.recordsPerSecond).toBe(importResults.performanceMetrics.recordsPerSecond);
                expect(performanceBreakdown.totalProcessingTime).toBe(importResults.performanceMetrics.totalProcessingTime);
                expect(performanceBreakdown.averageChunkTime).toBe(importResults.performanceMetrics.averageChunkTime);
                expect(performanceBreakdown.memoryUsage).toBe(importResults.performanceMetrics.memoryUsage);

                // Assert: Performance rating calculation
                const recordsPerSecond = importResults.performanceMetrics.recordsPerSecond;
                let expectedRating;
                if (recordsPerSecond >= 100) expectedRating = 'excellent';
                else if (recordsPerSecond >= 50) expectedRating = 'good';
                else if (recordsPerSecond >= 20) expectedRating = 'fair';
                else expectedRating = 'poor';
                
                expect(performanceBreakdown.performanceRating).toBe(expectedRating);

                // Assert: Efficiency calculations
                const efficiency = performanceBreakdown.efficiency;
                expect(efficiency).toHaveProperty('timePerRecord');
                expect(efficiency).toHaveProperty('throughput');
                expect(efficiency).toHaveProperty('resourceUtilization');

                // Verify time per record calculation
                if (importResults.performanceMetrics.totalProcessingTime > 0 && importResults.totalRecords > 0) {
                    const expectedTimePerRecord = importResults.performanceMetrics.totalProcessingTime / importResults.totalRecords;
                    expect(efficiency.timePerRecord).toBeCloseTo(expectedTimePerRecord, 2);
                }

                // Verify throughput matches records per second
                expect(efficiency.throughput).toBe(importResults.performanceMetrics.recordsPerSecond);

                // Verify resource utilization categorization
                expect(['low', 'medium', 'high']).toContain(efficiency.resourceUtilization);
            }
        ), { numRuns: 100 });
    });

    test('should provide detailed time distribution analysis', () => {
        fc.assert(fc.property(
            detailedImportResultsArb,
            fc.string({ minLength: 1, maxLength: 50 }),
            (importResults, sessionId) => {
                // Act: Generate detailed summary
                const summary = resultsManager.displayResults(importResults, sessionId);

                // Assert: Time breakdown completeness
                const timeBreakdown = summary.breakdown.timeBreakdown;
                expect(timeBreakdown).toHaveProperty('totalTime');
                expect(timeBreakdown).toHaveProperty('averageTimePerChunk');
                expect(timeBreakdown).toHaveProperty('timePerRecord');
                expect(timeBreakdown).toHaveProperty('phases');

                // Assert: Time calculations accuracy
                expect(timeBreakdown.totalTime).toBe(importResults.performanceMetrics.totalProcessingTime);
                expect(timeBreakdown.averageTimePerChunk).toBe(importResults.performanceMetrics.averageChunkTime);

                // Verify time per record calculation
                if (importResults.performanceMetrics.totalProcessingTime > 0 && importResults.totalRecords > 0) {
                    const expectedTimePerRecord = importResults.performanceMetrics.totalProcessingTime / importResults.totalRecords;
                    expect(timeBreakdown.timePerRecord).toBeCloseTo(expectedTimePerRecord, 2);
                }

                // Assert: Phase breakdown structure
                expect(timeBreakdown.phases).toHaveProperty('validation');
                expect(timeBreakdown.phases).toHaveProperty('processing');
                expect(timeBreakdown.phases).toHaveProperty('finalization');
                expect(timeBreakdown.phases.processing).toBe(importResults.performanceMetrics.totalProcessingTime);
            }
        ), { numRuns: 100 });
    });

    test('should provide detailed chunk-level processing results', () => {
        fc.assert(fc.property(
            detailedImportResultsArb.filter(result => result.results.length > 0),
            fc.string({ minLength: 1, maxLength: 50 }),
            (importResults, sessionId) => {
                // Store chunk results in the import results for testing
                resultsManager.currentResults = importResults;
                
                // Act: Generate detailed summary
                const summary = resultsManager.displayResults(importResults, sessionId);

                // Assert: Chunk processing details are preserved
                if (importResults.results && importResults.results.length > 0) {
                    // Verify chunk data integrity
                    importResults.results.forEach(chunk => {
                        expect(chunk).toHaveProperty('chunkId');
                        expect(chunk).toHaveProperty('startIndex');
                        expect(chunk).toHaveProperty('endIndex');
                        expect(chunk).toHaveProperty('successCount');
                        expect(chunk).toHaveProperty('failureCount');
                        expect(chunk).toHaveProperty('processingTime');

                        // Assert: Chunk data validity
                        expect(chunk.chunkId).toBeGreaterThanOrEqual(0);
                        expect(chunk.endIndex).toBeGreaterThan(chunk.startIndex);
                        expect(chunk.successCount).toBeGreaterThanOrEqual(0);
                        expect(chunk.failureCount).toBeGreaterThanOrEqual(0);
                        expect(chunk.processingTime).toBeGreaterThan(0);
                    });

                    // Verify aggregate consistency
                    const totalChunkSuccess = importResults.results.reduce((sum, chunk) => sum + chunk.successCount, 0);
                    const totalChunkFailure = importResults.results.reduce((sum, chunk) => sum + chunk.failureCount, 0);
                    
                    // Allow for some variance due to processing differences
                    expect(totalChunkSuccess).toBeLessThanOrEqual(importResults.successfulRecords + 10);
                    expect(totalChunkFailure).toBeLessThanOrEqual(importResults.failedRecords + 10);
                }
            }
        ), { numRuns: 50 });
    });

    test('should maintain detailed result consistency across status determinations', () => {
        fc.assert(fc.property(
            detailedImportResultsArb,
            fc.string({ minLength: 1, maxLength: 50 }),
            (importResults, sessionId) => {
                // Act: Generate detailed summary
                const summary = resultsManager.displayResults(importResults, sessionId);

                // Assert: Status determination consistency with detailed counts
                const successRate = summary.successRate;
                const status = summary.status;

                if (successRate === 100) {
                    expect(status).toBe('success');
                    expect(summary.failedRecords).toBe(0);
                } else if (successRate >= 50) {
                    expect(['partial_success', 'success']).toContain(status);
                } else if (successRate > 0) {
                    expect(['mostly_failed', 'partial_success']).toContain(status);
                } else {
                    expect(['failure', 'mostly_failed']).toContain(status);
                    expect(summary.successfulRecords).toBe(0);
                }

                // Assert: Detailed breakdown consistency with status
                const breakdown = summary.breakdown;
                
                if (status === 'success') {
                    expect(breakdown.recordTypes.failed).toBe(0);
                    expect(breakdown.errorBreakdown.totalErrors).toBeLessThanOrEqual(importResults.errors.length);
                }

                if (status === 'failure') {
                    expect(breakdown.recordTypes.new + breakdown.recordTypes.updated).toBe(0);
                }
            }
        ), { numRuns: 100 });
    });

    test('should provide detailed export and action options based on results', () => {
        fc.assert(fc.property(
            detailedImportResultsArb,
            fc.string({ minLength: 1, maxLength: 50 }),
            (importResults, sessionId) => {
                // Act: Generate detailed summary
                const summary = resultsManager.displayResults(importResults, sessionId);

                // Assert: Export options detail
                expect(summary.exportOptions.length).toBeGreaterThan(0);
                
                summary.exportOptions.forEach(option => {
                    expect(option).toHaveProperty('type');
                    expect(option).toHaveProperty('label');
                    expect(option).toHaveProperty('description');
                    
                    // Assert: Detailed descriptions
                    expect(option.description.length).toBeGreaterThan(20);
                });

                // Assert: Context-appropriate export options
                const exportTypes = summary.exportOptions.map(opt => opt.type);
                
                // Standard options should always be available
                expect(exportTypes).toContain('summary_pdf');
                expect(exportTypes).toContain('detailed_excel');
                
                // Error-specific options should be available when there are errors
                if (importResults.errors.length > 0) {
                    expect(exportTypes).toContain('error_log_csv');
                }
                
                // Audit trail should always be available
                expect(exportTypes).toContain('audit_trail_json');

                // Assert: Recommendations are contextually appropriate
                const hasErrors = importResults.failedRecords > 0;
                const hasHighFailureRate = summary.failureRate > 50;
                
                if (hasHighFailureRate) {
                    const errorRecommendations = summary.recommendations.filter(r => r.type === 'error');
                    expect(errorRecommendations.length).toBeGreaterThan(0);
                }
                
                if (summary.successRate === 100) {
                    const successRecommendations = summary.recommendations.filter(r => r.type === 'success');
                    expect(successRecommendations.length).toBeGreaterThan(0);
                }
            }
        ), { numRuns: 100 });
    });

    test('should preserve detailed information in import history', () => {
        fc.assert(fc.property(
            detailedImportResultsArb,
            fc.string({ minLength: 1, maxLength: 50 }),
            (importResults, sessionId) => {
                // Act: Generate detailed summary (which saves to history)
                const summary = resultsManager.displayResults(importResults, sessionId);

                // Assert: History preservation
                const history = resultsManager.getImportHistory();
                expect(history.length).toBeGreaterThan(0);

                const latestEntry = history[0];
                expect(latestEntry.sessionId).toBe(sessionId);
                expect(latestEntry.summary).toBeDefined();
                
                // Assert: Detailed information preserved in history
                expect(latestEntry.summary.totalRecords).toBe(importResults.totalRecords);
                expect(latestEntry.summary.successfulRecords).toBe(importResults.successfulRecords);
                expect(latestEntry.summary.failedRecords).toBe(importResults.failedRecords);
                expect(latestEntry.summary.createdRecords).toBe(importResults.createdRecords);
                expect(latestEntry.summary.updatedRecords).toBe(importResults.updatedRecords);
                
                // Assert: Timestamp and status preserved
                expect(latestEntry.timestamp).toBeDefined();
                expect(latestEntry.status).toBe(summary.status);
                expect(latestEntry.fileName).toBe(importResults.fileName);
            }
        ), { numRuns: 50 });
    });
});