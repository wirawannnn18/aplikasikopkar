/**
 * Property-Based Test: Import Summary Completeness
 * Feature: upload-master-barang-excel, Property 13: Import Summary Completeness
 * 
 * Tests that for any successful upload, the system displays a complete summary 
 * including counts of created, updated, and failed records.
 * 
 * Validates: Requirements 4.5
 */

import fc from 'fast-check';
import ImportResultsManager from '../../js/upload-excel/ImportResultsManager.js';

describe('Property Test: Import Summary Completeness', () => {
    let resultsManager;

    beforeEach(() => {
        resultsManager = new ImportResultsManager();
    });

    // Generator for import results
    const importResultsArb = fc.record({
        totalRecords: fc.integer({ min: 1, max: 1000 }),
        processedRecords: fc.integer({ min: 0, max: 1000 }),
        successfulRecords: fc.integer({ min: 0, max: 1000 }),
        createdRecords: fc.integer({ min: 0, max: 500 }),
        updatedRecords: fc.integer({ min: 0, max: 500 }),
        failedRecords: fc.integer({ min: 0, max: 500 }),
        fileName: fc.string({ minLength: 1, maxLength: 100 }),
        performanceMetrics: fc.record({
            recordsPerSecond: fc.float({ min: Math.fround(0.1), max: Math.fround(1000) }),
            totalProcessingTime: fc.integer({ min: 100, max: 60000 }),
            averageChunkTime: fc.integer({ min: 10, max: 1000 }),
            memoryUsage: fc.integer({ min: 1024, max: 100 * 1024 * 1024 })
        }),
        errors: fc.array(fc.record({
            type: fc.constantFrom('validation', 'processing', 'business_rule'),
            message: fc.string({ minLength: 1, maxLength: 200 }),
            row: fc.integer({ min: 1, max: 1000 }),
            field: fc.string({ minLength: 1, maxLength: 50 })
        }), { maxLength: 50 })
    }).map(result => {
        // Ensure data consistency
        result.processedRecords = Math.min(result.processedRecords, result.totalRecords);
        result.successfulRecords = Math.min(result.successfulRecords, result.processedRecords);
        result.createdRecords = Math.min(result.createdRecords, result.successfulRecords);
        result.updatedRecords = Math.min(result.updatedRecords, result.successfulRecords - result.createdRecords);
        result.failedRecords = Math.min(result.failedRecords, result.processedRecords - result.successfulRecords);
        
        return result;
    });

    test('should generate complete summary for any import results', () => {
        fc.assert(fc.property(
            importResultsArb,
            fc.string({ minLength: 1, maxLength: 50 }), // sessionId
            (importResults, sessionId) => {
                // Act: Generate summary
                const summary = resultsManager.displayResults(importResults, sessionId);

                // Assert: Summary completeness
                expect(summary).toBeDefined();
                expect(summary).toHaveProperty('totalRecords');
                expect(summary).toHaveProperty('processedRecords');
                expect(summary).toHaveProperty('successfulRecords');
                expect(summary).toHaveProperty('createdRecords');
                expect(summary).toHaveProperty('updatedRecords');
                expect(summary).toHaveProperty('failedRecords');

                // Assert: All counts are present and valid
                expect(summary.totalRecords).toBe(importResults.totalRecords);
                expect(summary.processedRecords).toBe(importResults.processedRecords);
                expect(summary.successfulRecords).toBe(importResults.successfulRecords);
                expect(summary.createdRecords).toBe(importResults.createdRecords);
                expect(summary.updatedRecords).toBe(importResults.updatedRecords);
                expect(summary.failedRecords).toBe(importResults.failedRecords);

                // Assert: Calculated percentages are present
                expect(summary).toHaveProperty('successRate');
                expect(summary).toHaveProperty('failureRate');
                expect(summary).toHaveProperty('updateRate');

                // Assert: Percentages are valid (0-100)
                expect(summary.successRate).toBeGreaterThanOrEqual(0);
                expect(summary.successRate).toBeLessThanOrEqual(100);
                expect(summary.failureRate).toBeGreaterThanOrEqual(0);
                expect(summary.failureRate).toBeLessThanOrEqual(100);
                expect(summary.updateRate).toBeGreaterThanOrEqual(0);
                expect(summary.updateRate).toBeLessThanOrEqual(100);

                // Assert: Status determination
                expect(summary).toHaveProperty('status');
                expect(['success', 'partial_success', 'mostly_failed', 'failure', 'unknown'])
                    .toContain(summary.status);

                // Assert: Session information
                expect(summary.sessionId).toBe(sessionId);
                expect(summary.timestamp).toBeDefined();
                expect(() => new Date(summary.timestamp)).not.toThrow();

                // Assert: Performance metrics included
                expect(summary).toHaveProperty('performanceMetrics');
                expect(summary.performanceMetrics).toBeDefined();

                // Assert: Detailed breakdown included
                expect(summary).toHaveProperty('breakdown');
                expect(summary.breakdown).toHaveProperty('recordTypes');
                expect(summary.breakdown).toHaveProperty('errorBreakdown');
                expect(summary.breakdown).toHaveProperty('performanceBreakdown');

                // Assert: Recommendations included
                expect(summary).toHaveProperty('recommendations');
                expect(Array.isArray(summary.recommendations)).toBe(true);

                // Assert: Export options included
                expect(summary).toHaveProperty('exportOptions');
                expect(Array.isArray(summary.exportOptions)).toBe(true);
                expect(summary.exportOptions.length).toBeGreaterThan(0);
            }
        ), { numRuns: 100 });
    });

    test('should maintain mathematical consistency in summary calculations', () => {
        fc.assert(fc.property(
            importResultsArb,
            fc.string({ minLength: 1, maxLength: 50 }),
            (importResults, sessionId) => {
                // Act: Generate summary
                const summary = resultsManager.displayResults(importResults, sessionId);

                // Assert: Mathematical consistency
                // Success rate + failure rate should account for all processed records
                const calculatedSuccessful = Math.round((summary.successRate / 100) * summary.totalRecords);
                const calculatedFailed = Math.round((summary.failureRate / 100) * summary.totalRecords);
                
                // Allow for rounding differences
                expect(Math.abs(calculatedSuccessful - summary.successfulRecords)).toBeLessThanOrEqual(1);
                expect(Math.abs(calculatedFailed - summary.failedRecords)).toBeLessThanOrEqual(1);

                // Created + updated should equal successful (or be close due to rounding)
                expect(summary.createdRecords + summary.updatedRecords).toBeLessThanOrEqual(summary.successfulRecords);

                // Processed records should not exceed total records
                expect(summary.processedRecords).toBeLessThanOrEqual(summary.totalRecords);

                // Successful + failed should not exceed processed
                expect(summary.successfulRecords + summary.failedRecords).toBeLessThanOrEqual(summary.processedRecords);

                // Update rate calculation consistency
                if (summary.successfulRecords > 0) {
                    const expectedUpdateRate = Math.round((summary.updatedRecords / summary.successfulRecords) * 100);
                    expect(summary.updateRate).toBe(expectedUpdateRate);
                } else {
                    expect(summary.updateRate).toBe(0);
                }
            }
        ), { numRuns: 100 });
    });

    test('should provide comprehensive error breakdown for any error patterns', () => {
        fc.assert(fc.property(
            importResultsArb,
            fc.string({ minLength: 1, maxLength: 50 }),
            (importResults, sessionId) => {
                // Act: Generate summary
                const summary = resultsManager.displayResults(importResults, sessionId);

                // Assert: Error breakdown completeness
                const errorBreakdown = summary.breakdown.errorBreakdown;
                expect(errorBreakdown).toBeDefined();
                expect(errorBreakdown).toHaveProperty('totalErrors');
                expect(errorBreakdown).toHaveProperty('errorTypes');
                expect(errorBreakdown).toHaveProperty('commonErrors');
                expect(errorBreakdown).toHaveProperty('errorRate');

                // Assert: Error count consistency
                expect(errorBreakdown.totalErrors).toBe(importResults.errors.length);

                // Assert: Error rate consistency
                expect(errorBreakdown.errorRate).toBe(summary.failureRate);

                // Assert: Common errors structure
                expect(Array.isArray(errorBreakdown.commonErrors)).toBe(true);
                errorBreakdown.commonErrors.forEach(error => {
                    expect(error).toHaveProperty('message');
                    expect(error).toHaveProperty('count');
                    expect(error.count).toBeGreaterThan(0);
                });

                // Assert: Error types structure
                expect(typeof errorBreakdown.errorTypes).toBe('object');
                
                // If there are errors, verify error type counts
                if (importResults.errors.length > 0) {
                    const totalErrorTypeCount = Object.values(errorBreakdown.errorTypes)
                        .reduce((sum, count) => sum + count, 0);
                    expect(totalErrorTypeCount).toBe(importResults.errors.length);
                }
            }
        ), { numRuns: 100 });
    });

    test('should provide accurate performance breakdown for any performance metrics', () => {
        fc.assert(fc.property(
            importResultsArb,
            fc.string({ minLength: 1, maxLength: 50 }),
            (importResults, sessionId) => {
                // Act: Generate summary
                const summary = resultsManager.displayResults(importResults, sessionId);

                // Assert: Performance breakdown completeness
                const performanceBreakdown = summary.breakdown.performanceBreakdown;
                expect(performanceBreakdown).toBeDefined();
                expect(performanceBreakdown).toHaveProperty('recordsPerSecond');
                expect(performanceBreakdown).toHaveProperty('totalProcessingTime');
                expect(performanceBreakdown).toHaveProperty('averageChunkTime');
                expect(performanceBreakdown).toHaveProperty('performanceRating');
                expect(performanceBreakdown).toHaveProperty('efficiency');

                // Assert: Performance metrics consistency
                expect(performanceBreakdown.recordsPerSecond).toBe(importResults.performanceMetrics.recordsPerSecond);
                expect(performanceBreakdown.totalProcessingTime).toBe(importResults.performanceMetrics.totalProcessingTime);
                expect(performanceBreakdown.averageChunkTime).toBe(importResults.performanceMetrics.averageChunkTime);

                // Assert: Performance rating validity
                expect(['excellent', 'good', 'fair', 'poor']).toContain(performanceBreakdown.performanceRating);

                // Assert: Efficiency metrics structure
                expect(performanceBreakdown.efficiency).toHaveProperty('timePerRecord');
                expect(performanceBreakdown.efficiency).toHaveProperty('throughput');
                expect(performanceBreakdown.efficiency).toHaveProperty('resourceUtilization');

                // Assert: Efficiency calculations
                if (importResults.performanceMetrics.totalProcessingTime > 0 && importResults.totalRecords > 0) {
                    const expectedTimePerRecord = importResults.performanceMetrics.totalProcessingTime / importResults.totalRecords;
                    expect(performanceBreakdown.efficiency.timePerRecord).toBeCloseTo(expectedTimePerRecord, 2);
                }

                expect(performanceBreakdown.efficiency.throughput).toBe(importResults.performanceMetrics.recordsPerSecond);
                expect(['low', 'medium', 'high']).toContain(performanceBreakdown.efficiency.resourceUtilization);
            }
        ), { numRuns: 100 });
    });

    test('should generate appropriate recommendations based on import results', () => {
        fc.assert(fc.property(
            importResultsArb,
            fc.string({ minLength: 1, maxLength: 50 }),
            (importResults, sessionId) => {
                // Act: Generate summary
                const summary = resultsManager.displayResults(importResults, sessionId);

                // Assert: Recommendations structure
                expect(Array.isArray(summary.recommendations)).toBe(true);
                
                summary.recommendations.forEach(recommendation => {
                    expect(recommendation).toHaveProperty('type');
                    expect(recommendation).toHaveProperty('title');
                    expect(recommendation).toHaveProperty('message');
                    expect(recommendation).toHaveProperty('action');
                    expect(recommendation).toHaveProperty('priority');

                    // Assert: Valid recommendation types
                    expect(['error', 'warning', 'info', 'success']).toContain(recommendation.type);

                    // Assert: Valid priorities
                    expect(['high', 'medium', 'low', 'info']).toContain(recommendation.priority);

                    // Assert: Non-empty strings
                    expect(recommendation.title.length).toBeGreaterThan(0);
                    expect(recommendation.message.length).toBeGreaterThan(0);
                });

                // Assert: Recommendation logic consistency
                const successRate = summary.successRate;
                
                if (successRate < 50) {
                    // Should have high priority error recommendation
                    const highPriorityErrors = summary.recommendations.filter(r => 
                        r.type === 'error' && r.priority === 'high'
                    );
                    expect(highPriorityErrors.length).toBeGreaterThan(0);
                } else if (successRate === 100) {
                    // Should have success recommendation
                    const successRecommendations = summary.recommendations.filter(r => 
                        r.type === 'success'
                    );
                    expect(successRecommendations.length).toBeGreaterThan(0);
                }
            }
        ), { numRuns: 100 });
    });

    test('should provide complete export options for any import results', () => {
        fc.assert(fc.property(
            importResultsArb,
            fc.string({ minLength: 1, maxLength: 50 }),
            (importResults, sessionId) => {
                // Act: Generate summary
                const summary = resultsManager.displayResults(importResults, sessionId);

                // Assert: Export options completeness
                expect(Array.isArray(summary.exportOptions)).toBe(true);
                expect(summary.exportOptions.length).toBeGreaterThan(0);

                summary.exportOptions.forEach(option => {
                    expect(option).toHaveProperty('type');
                    expect(option).toHaveProperty('label');
                    expect(option).toHaveProperty('description');

                    // Assert: Non-empty strings
                    expect(option.type.length).toBeGreaterThan(0);
                    expect(option.label.length).toBeGreaterThan(0);
                    expect(option.description.length).toBeGreaterThan(0);
                });

                // Assert: Standard export options are available
                const exportTypes = summary.exportOptions.map(option => option.type);
                expect(exportTypes).toContain('summary_pdf');
                expect(exportTypes).toContain('detailed_excel');
                expect(exportTypes).toContain('error_log_csv');
                expect(exportTypes).toContain('audit_trail_json');
            }
        ), { numRuns: 50 });
    });

    test('should maintain summary consistency across multiple calls', () => {
        fc.assert(fc.property(
            importResultsArb,
            fc.string({ minLength: 1, maxLength: 50 }),
            (importResults, sessionId) => {
                // Act: Generate summary multiple times
                const summary1 = resultsManager.displayResults(importResults, sessionId);
                const summary2 = resultsManager.displayResults(importResults, sessionId);

                // Assert: Consistency across calls
                expect(summary1.totalRecords).toBe(summary2.totalRecords);
                expect(summary1.successfulRecords).toBe(summary2.successfulRecords);
                expect(summary1.failedRecords).toBe(summary2.failedRecords);
                expect(summary1.successRate).toBe(summary2.successRate);
                expect(summary1.failureRate).toBe(summary2.failureRate);
                expect(summary1.status).toBe(summary2.status);

                // Assert: Performance metrics consistency
                expect(summary1.breakdown.performanceBreakdown.recordsPerSecond)
                    .toBe(summary2.breakdown.performanceBreakdown.recordsPerSecond);
                expect(summary1.breakdown.performanceBreakdown.performanceRating)
                    .toBe(summary2.breakdown.performanceBreakdown.performanceRating);

                // Assert: Error breakdown consistency
                expect(summary1.breakdown.errorBreakdown.totalErrors)
                    .toBe(summary2.breakdown.errorBreakdown.totalErrors);
                expect(summary1.breakdown.errorBreakdown.errorRate)
                    .toBe(summary2.breakdown.errorBreakdown.errorRate);
            }
        ), { numRuns: 50 });
    });
});