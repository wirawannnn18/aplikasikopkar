/**
 * Property-Based Test: Failure Logging Completeness
 * Feature: upload-master-barang-excel, Property 19: Failure Logging Completeness
 * 
 * Tests that for any import failure, the system logs detailed error information
 * and failure causes for troubleshooting.
 * 
 * Validates: Requirements 6.3
 */

import fc from 'fast-check';
import AuditLogger from '../../js/upload-excel/AuditLogger.js';

describe('Property Test: Failure Logging Completeness', () => {
    let auditLogger;
    let sessionId;

    beforeEach(() => {
        localStorage.clear();
        auditLogger = new AuditLogger();
        sessionId = 'test_session_' + Date.now();
    });

    afterEach(() => {
        localStorage.clear();
    });

    // Generator for error objects
    const errorArb = fc.record({
        name: fc.constantFrom('ValidationError', 'TypeError', 'ReferenceError', 'SyntaxError', 'NetworkError'),
        message: fc.string({ minLength: 1, maxLength: 200 }),
        stack: fc.option(fc.string({ maxLength: 500 }))
    }).map(errorData => {
        const error = new Error(errorData.message);
        error.name = errorData.name;
        if (errorData.stack) {
            error.stack = errorData.stack;
        }
        return error;
    });

    // Generator for context objects
    const contextArb = fc.record({
        severity: fc.constantFrom('error', 'warning', 'critical'),
        recoverable: fc.boolean(),
        rowNumber: fc.option(fc.integer({ min: 1, max: 10000 })),
        fieldName: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
        operation: fc.constantFrom('validation', 'parsing', 'import', 'processing'),
        additionalInfo: fc.option(fc.string({ maxLength: 100 }))
    });

    test('should log complete error information for any failure', () => {
        fc.assert(fc.property(
            errorArb, // error
            contextArb, // context
            (error, context) => {
                // Act: Log error
                auditLogger.logError(sessionId, error, context);

                // Assert: Verify error entry exists
                const auditTrail = auditLogger.getAuditTrail({ sessionId });
                expect(auditTrail.length).toBe(1);

                const errorEntry = auditTrail[0];
                
                // Assert: Verify complete error information is logged
                expect(errorEntry.action).toBe('error');
                expect(errorEntry.sessionId).toBe(sessionId);
                
                // Assert: Verify error details completeness
                expect(errorEntry.details).toBeDefined();
                expect(errorEntry.details.errorType).toBe(error.name);
                expect(errorEntry.details.errorMessage).toBe(error.message);
                expect(errorEntry.details.context).toEqual(context);
                expect(errorEntry.details.severity).toBe(context.severity);
                expect(errorEntry.details.recoverable).toBe(context.recoverable);
                
                // Assert: Verify stack trace is logged when available
                if (error.stack) {
                    expect(errorEntry.details.errorStack).toBe(error.stack);
                } else {
                    expect(errorEntry.details.errorStack).toBeNull();
                }
                
                // Assert: Verify timestamp and user are logged
                expect(errorEntry.timestamp).toBeDefined();
                expect(errorEntry.user).toBeDefined();
                expect(() => new Date(errorEntry.timestamp)).not.toThrow();
            }
        ), { numRuns: 100 });
    });

    test('should handle errors without context gracefully', () => {
        fc.assert(fc.property(
            errorArb, // error
            (error) => {
                // Act: Log error without context
                auditLogger.logError(sessionId, error);

                // Assert: Verify error is still logged completely
                const auditTrail = auditLogger.getAuditTrail({ sessionId });
                expect(auditTrail.length).toBe(1);

                const errorEntry = auditTrail[0];
                
                // Assert: Verify error details with default context
                expect(errorEntry.details.errorType).toBe(error.name);
                expect(errorEntry.details.errorMessage).toBe(error.message);
                expect(errorEntry.details.context).toEqual({});
                expect(errorEntry.details.severity).toBe('error');
                expect(errorEntry.details.recoverable).toBe(false);
            }
        ), { numRuns: 50 });
    });

    test('should log multiple failures in sequence with complete details', () => {
        fc.assert(fc.property(
            fc.array(fc.record({
                error: errorArb,
                context: contextArb
            }), { minLength: 2, maxLength: 10 }),
            (failures) => {
                // Act: Log multiple failures
                failures.forEach(failure => {
                    auditLogger.logError(sessionId, failure.error, failure.context);
                });

                // Assert: Verify all failures are logged
                const auditTrail = auditLogger.getAuditTrail({ sessionId });
                expect(auditTrail.length).toBe(failures.length);

                // Assert: Verify each failure has complete information
                failures.forEach((failure, index) => {
                    const errorEntry = auditTrail.find(entry => 
                        entry.details.errorMessage === failure.error.message &&
                        entry.details.errorType === failure.error.name
                    );
                    
                    expect(errorEntry).toBeDefined();
                    expect(errorEntry.details.context).toEqual(failure.context);
                });
            }
        ), { numRuns: 50 });
    });

    test('should preserve error information integrity', () => {
        fc.assert(fc.property(
            errorArb, // error
            contextArb, // context
            (error, context) => {
                const originalMessage = error.message;
                const originalContext = { ...context };

                // Act: Log error
                auditLogger.logError(sessionId, error, context);

                // Modify original error and context after logging
                error.message = 'Modified message';
                context.severity = 'modified';

                // Assert: Verify logged information is preserved
                const auditTrail = auditLogger.getAuditTrail({ sessionId });
                const errorEntry = auditTrail[0];
                
                expect(errorEntry.details.errorMessage).toBe(originalMessage);
                expect(errorEntry.details.context.severity).toBe(originalContext.severity);
                expect(errorEntry.details.errorMessage).not.toBe('Modified message');
            }
        ), { numRuns: 50 });
    });

    test('should handle unknown error types gracefully', () => {
        fc.assert(fc.property(
            fc.string({ minLength: 1, maxLength: 200 }), // message
            (message) => {
                // Create error without name property
                const error = { message };

                // Act: Log malformed error
                auditLogger.logError(sessionId, error, {});

                // Assert: Verify error is handled gracefully
                const auditTrail = auditLogger.getAuditTrail({ sessionId });
                expect(auditTrail.length).toBe(1);

                const errorEntry = auditTrail[0];
                expect(errorEntry.details.errorType).toBe('UnknownError');
                expect(errorEntry.details.errorMessage).toBe(message);
            }
        ), { numRuns: 50 });
    });

    test('should log contextual data for troubleshooting', () => {
        fc.assert(fc.property(
            errorArb, // error
            fc.record({
                oldData: fc.option(fc.record({
                    kode: fc.string(),
                    nama: fc.string()
                })),
                newData: fc.option(fc.record({
                    kode: fc.string(),
                    nama: fc.string()
                })),
                severity: fc.constantFrom('error', 'warning'),
                recoverable: fc.boolean()
            }), // context with data
            (error, context) => {
                // Act: Log error with contextual data
                auditLogger.logError(sessionId, error, context);

                // Assert: Verify contextual data is preserved
                const auditTrail = auditLogger.getAuditTrail({ sessionId });
                const errorEntry = auditTrail[0];
                
                expect(errorEntry.oldData).toEqual(context.oldData);
                expect(errorEntry.newData).toEqual(context.newData);
                expect(errorEntry.details.context.severity).toBe(context.severity);
                expect(errorEntry.details.context.recoverable).toBe(context.recoverable);
            }
        ), { numRuns: 50 });
    });

    test('should maintain error log chronological order', () => {
        fc.assert(fc.property(
            fc.array(errorArb, { minLength: 3, maxLength: 5 }),
            (errors) => {
                const timestamps = [];

                // Act: Log errors with small delays
                errors.forEach((error, index) => {
                    // Small delay to ensure different timestamps
                    const start = Date.now();
                    while (Date.now() - start < 1) { /* wait */ }
                    
                    auditLogger.logError(sessionId, error, { index });
                    timestamps.push(Date.now());
                });

                // Assert: Verify chronological order in audit trail
                const auditTrail = auditLogger.getAuditTrail({ sessionId });
                expect(auditTrail.length).toBe(errors.length);

                // Audit trail should be sorted newest first
                for (let i = 0; i < auditTrail.length - 1; i++) {
                    const currentTime = new Date(auditTrail[i].timestamp);
                    const nextTime = new Date(auditTrail[i + 1].timestamp);
                    expect(currentTime.getTime()).toBeGreaterThanOrEqual(nextTime.getTime());
                }
            }
        ), { numRuns: 30 });
    });
});