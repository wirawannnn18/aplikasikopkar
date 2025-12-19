/**
 * Error Handler Tests - Property-based and unit tests for error handling framework
 * Requirements: 8.1, 8.2, 8.3, 8.5
 */

import fc from 'fast-check';

// Mock localStorage for Node.js environment
const localStorageMock = {
    data: {},
    getItem: function(key) {
        return this.data[key] || null;
    },
    setItem: function(key, value) {
        this.data[key] = value;
    },
    clear: function() {
        this.data = {};
    }
};

// Set up global localStorage mock
global.localStorage = localStorageMock;

// Import the modules
let ImportTagihanErrorHandler, ERROR_CATEGORIES, ERROR_CODES, ERROR_SEVERITY, AuditLogger;

beforeAll(async () => {
    // Dynamic import to handle ES modules
    const errorModule = await import('../../js/import-tagihan/ErrorHandler.js');
    const auditModule = await import('../../js/import-tagihan/AuditLogger.js');
    
    ImportTagihanErrorHandler = errorModule.ImportTagihanErrorHandler;
    AuditLogger = auditModule.AuditLogger;
    
    // Extract constants from the error module
    ERROR_CATEGORIES = errorModule.ERROR_CATEGORIES;
    ERROR_CODES = errorModule.ERROR_CODES;
    ERROR_SEVERITY = errorModule.ERROR_SEVERITY;
});

describe('ErrorHandler', () => {
    let errorHandler;
    let auditLogger;

    beforeEach(() => {
        // Clear localStorage before each test
        localStorageMock.clear();
        
        // Create fresh instances
        auditLogger = new AuditLogger();
        errorHandler = new ImportTagihanErrorHandler(auditLogger);
    });

    describe('ImportTagihanError', () => {
        test('should create error with all properties', () => {
            const error = new ImportTagihanError(
                'Test error message',
                ERROR_CODES.INVALID_FILE_FORMAT,
                ERROR_CATEGORIES.FILE_UPLOAD,
                ERROR_SEVERITY.MEDIUM,
                { testDetail: 'test value' }
            );

            expect(error.message).toBe('Test error message');
            expect(error.code).toBe(ERROR_CODES.INVALID_FILE_FORMAT);
            expect(error.category).toBe(ERROR_CATEGORIES.FILE_UPLOAD);
            expect(error.severity).toBe(ERROR_SEVERITY.MEDIUM);
            expect(error.details.testDetail).toBe('test value');
            expect(error.recoverable).toBe(true);
            expect(error.timestamp).toBeInstanceOf(Date);
        });

        test('should mark critical errors as non-recoverable', () => {
            const error = new ImportTagihanError(
                'Critical error',
                ERROR_CODES.MEMORY_OVERFLOW,
                ERROR_CATEGORIES.SYSTEM,
                ERROR_SEVERITY.CRITICAL
            );

            expect(error.recoverable).toBe(false);
        });

        test('should convert to JSON properly', () => {
            const error = new ImportTagihanError(
                'Test error',
                ERROR_CODES.INVALID_FILE_FORMAT,
                ERROR_CATEGORIES.FILE_UPLOAD
            );

            const json = error.toJSON();
            expect(json.name).toBe('ImportTagihanError');
            expect(json.message).toBe('Test error');
            expect(json.code).toBe(ERROR_CODES.INVALID_FILE_FORMAT);
            expect(json.category).toBe(ERROR_CATEGORIES.FILE_UPLOAD);
        });
    });

    describe('Error Handling Framework', () => {
        test('should handle file upload errors correctly', () => {
            const originalError = new Error('Invalid file format');
            const context = { fileName: 'test.txt' };

            const handledError = errorHandler.handleFileUploadError(originalError, context);

            expect(handledError).toBeInstanceOf(ImportTagihanError);
            expect(handledError.category).toBe(ERROR_CATEGORIES.FILE_UPLOAD);
            expect(handledError.code).toBe(ERROR_CODES.INVALID_FILE_FORMAT);
            expect(handledError.message).toContain('Format file tidak didukung');
            expect(handledError.details.fileName).toBe('test.txt');
        });

        test('should handle data validation errors correctly', () => {
            const originalError = new Error('Member tidak ditemukan');
            const context = { memberNumber: '12345', rowNumber: 1 };

            const handledError = errorHandler.handleDataValidationError(originalError, context);

            expect(handledError).toBeInstanceOf(ImportTagihanError);
            expect(handledError.category).toBe(ERROR_CATEGORIES.DATA_VALIDATION);
            expect(handledError.code).toBe(ERROR_CODES.MEMBER_NOT_FOUND);
            expect(handledError.message).toContain('12345');
            expect(handledError.details.rowNumber).toBe(1);
        });

        test('should handle processing errors correctly', () => {
            const originalError = new Error('Database connection failed');
            const context = { transactionId: 'TXN123' };

            const handledError = errorHandler.handleProcessingError(originalError, context);

            expect(handledError).toBeInstanceOf(ImportTagihanError);
            expect(handledError.category).toBe(ERROR_CATEGORIES.PROCESSING);
            expect(handledError.code).toBe(ERROR_CODES.DATABASE_CONNECTION_FAILURE);
            expect(handledError.severity).toBe(ERROR_SEVERITY.HIGH);
            expect(errorHandler.isSystemStable()).toBe(false);
        });

        test('should handle system errors correctly', () => {
            const originalError = new Error('Memory overflow detected');
            const context = { operation: 'batch_processing' };

            const handledError = errorHandler.handleSystemError(originalError, context);

            expect(handledError).toBeInstanceOf(ImportTagihanError);
            expect(handledError.category).toBe(ERROR_CATEGORIES.SYSTEM);
            expect(handledError.code).toBe(ERROR_CODES.MEMORY_OVERFLOW);
            expect(handledError.severity).toBe(ERROR_SEVERITY.CRITICAL);
            expect(handledError.recoverable).toBe(false);
            expect(errorHandler.isSystemStable()).toBe(false);
        });

        test('should auto-categorize errors correctly', () => {
            const fileError = new Error('File upload failed');
            const validationError = new Error('Invalid data format');
            const processingError = new Error('Transaction processing failed');

            const handledFileError = errorHandler.handleError(fileError, { stage: 'file_upload' });
            const handledValidationError = errorHandler.handleError(validationError, { stage: 'validation' });
            const handledProcessingError = errorHandler.handleError(processingError, { stage: 'processing' });

            expect(handledFileError.category).toBe(ERROR_CATEGORIES.FILE_UPLOAD);
            expect(handledValidationError.category).toBe(ERROR_CATEGORIES.DATA_VALIDATION);
            expect(handledProcessingError.category).toBe(ERROR_CATEGORIES.PROCESSING);
        });

        test('should maintain error history', () => {
            const error1 = new Error('First error');
            const error2 = new Error('Second error');

            errorHandler.handleError(error1);
            errorHandler.handleError(error2);

            const stats = errorHandler.getErrorStatistics();
            expect(stats.total).toBe(2);
            expect(stats.recent).toHaveLength(2);
        });

        test('should support error callbacks', () => {
            const callback = jest.fn();
            errorHandler.onError(ERROR_CODES.INVALID_FILE_FORMAT, callback);

            const error = new Error('Invalid format');
            errorHandler.handleFileUploadError(error);

            expect(callback).toHaveBeenCalled();
        });

        test('should reset system stability', () => {
            const criticalError = new Error('Memory overflow');
            errorHandler.handleSystemError(criticalError);
            
            expect(errorHandler.isSystemStable()).toBe(false);
            
            errorHandler.resetSystemStability();
            expect(errorHandler.isSystemStable()).toBe(true);
        });

        test('should clear error history', () => {
            const error = new Error('Test error');
            errorHandler.handleError(error);
            
            expect(errorHandler.getErrorStatistics().total).toBe(1);
            
            errorHandler.clearErrorHistory();
            expect(errorHandler.getErrorStatistics().total).toBe(0);
        });
    });

    /**
     * Property-Based Test: Error handling graceful degradation
     * Feature: import-tagihan-pembayaran, Property 9: Error handling graceful degradation
     * Validates: Requirements 8.1
     * 
     * For any system error during import processing, the system should display clear error messages,
     * prevent data corruption, and maintain system stability
     */
    describe('Property 9: Error handling graceful degradation', () => {
        test('should gracefully handle any error without system crash', () => {
            fc.assert(fc.property(
                fc.record({
                    message: fc.string({ minLength: 1, maxLength: 200 }),
                    errorType: fc.constantFrom('file', 'validation', 'processing', 'system'),
                    context: fc.record({
                        fileName: fc.option(fc.string()),
                        memberNumber: fc.option(fc.string()),
                        rowNumber: fc.option(fc.integer({ min: 1, max: 1000 })),
                        transactionId: fc.option(fc.string()),
                        batchId: fc.option(fc.string())
                    })
                }),
                (errorData) => {
                    // Create error based on type
                    const originalError = new Error(errorData.message);
                    let handledError;

                    // Test that error handling doesn't throw
                    expect(() => {
                        switch (errorData.errorType) {
                            case 'file':
                                handledError = errorHandler.handleFileUploadError(originalError, errorData.context);
                                break;
                            case 'validation':
                                handledError = errorHandler.handleDataValidationError(originalError, errorData.context);
                                break;
                            case 'processing':
                                handledError = errorHandler.handleProcessingError(originalError, errorData.context);
                                break;
                            case 'system':
                                handledError = errorHandler.handleSystemError(originalError, errorData.context);
                                break;
                        }
                    }).not.toThrow();

                    // Verify error is properly handled
                    expect(handledError).toBeInstanceOf(ImportTagihanError);
                    expect(handledError.message).toBeTruthy();
                    expect(handledError.code).toBeTruthy();
                    expect(handledError.category).toBeTruthy();
                    expect(handledError.severity).toBeTruthy();
                    expect(handledError.timestamp).toBeInstanceOf(Date);

                    // Verify error message is user-friendly (in Indonesian)
                    expect(handledError.message).toMatch(/^[A-Za-z\s\.\,\-\(\)0-9]+$/);
                    expect(handledError.message.length).toBeGreaterThan(10);

                    // Verify system stability is tracked correctly
                    if (handledError.severity === ERROR_SEVERITY.CRITICAL) {
                        expect(handledError.recoverable).toBe(false);
                    } else {
                        expect(handledError.recoverable).toBe(true);
                    }

                    // Verify error is logged to history
                    const stats = errorHandler.getErrorStatistics();
                    expect(stats.total).toBeGreaterThan(0);
                    expect(stats.byCategory[handledError.category]).toBeGreaterThan(0);
                    expect(stats.bySeverity[handledError.severity]).toBeGreaterThan(0);
                    expect(stats.byCode[handledError.code]).toBeGreaterThan(0);

                    return true;
                }
            ), { numRuns: 100 });
        });

        test('should maintain error context and details', () => {
            fc.assert(fc.property(
                fc.record({
                    message: fc.string({ minLength: 1 }),
                    context: fc.record({
                        fileName: fc.option(fc.string()),
                        memberNumber: fc.option(fc.string()),
                        rowNumber: fc.option(fc.integer({ min: 1 })),
                        transactionId: fc.option(fc.string()),
                        batchId: fc.option(fc.string()),
                        customData: fc.option(fc.object())
                    })
                }),
                (errorData) => {
                    const originalError = new Error(errorData.message);
                    const handledError = errorHandler.handleError(originalError, errorData.context);

                    // Verify context is preserved
                    expect(handledError.details).toBeDefined();
                    expect(handledError.details.originalError).toBe(errorData.message);

                    // Verify specific context fields are preserved when provided
                    if (errorData.context.fileName) {
                        expect(handledError.details.fileName).toBe(errorData.context.fileName);
                    }
                    if (errorData.context.memberNumber) {
                        expect(handledError.details.memberNumber).toBe(errorData.context.memberNumber);
                    }
                    if (errorData.context.rowNumber) {
                        expect(handledError.details.rowNumber).toBe(errorData.context.rowNumber);
                    }
                    if (errorData.context.transactionId) {
                        expect(handledError.details.transactionId).toBe(errorData.context.transactionId);
                    }

                    return true;
                }
            ), { numRuns: 100 });
        });

        test('should handle error callback registration and execution', () => {
            fc.assert(fc.property(
                fc.record({
                    errorCode: fc.constantFrom(...Object.values(ERROR_CODES)),
                    callbackCount: fc.integer({ min: 1, max: 5 }),
                    errorMessage: fc.string({ minLength: 1 })
                }),
                (testData) => {
                    const callbacks = [];
                    
                    // Register multiple callbacks for the same error code
                    for (let i = 0; i < testData.callbackCount; i++) {
                        const callback = jest.fn();
                        callbacks.push(callback);
                        errorHandler.onError(testData.errorCode, callback);
                    }

                    // Create an error that will trigger the callbacks
                    const error = new ImportTagihanError(
                        testData.errorMessage,
                        testData.errorCode,
                        ERROR_CATEGORIES.SYSTEM
                    );

                    // Handle the error (should trigger callbacks)
                    errorHandler.handleError(error);

                    // Verify all callbacks were called
                    callbacks.forEach(callback => {
                        expect(callback).toHaveBeenCalledWith(error);
                    });

                    return true;
                }
            ), { numRuns: 50 });
        });

        test('should prevent error history overflow', () => {
            fc.assert(fc.property(
                fc.integer({ min: 101, max: 200 }),
                (errorCount) => {
                    // Generate more errors than the maximum history size (100)
                    for (let i = 0; i < errorCount; i++) {
                        const error = new Error(`Error ${i}`);
                        errorHandler.handleError(error);
                    }

                    const stats = errorHandler.getErrorStatistics();
                    
                    // Verify history is capped at 100 entries
                    expect(stats.total).toBeLessThanOrEqual(100);
                    expect(stats.recent.length).toBeLessThanOrEqual(10);

                    return true;
                }
            ), { numRuns: 10 });
        });
    });

    describe('Error Statistics and Reporting', () => {
        test('should provide accurate error statistics', () => {
            const fileError = new Error('File error');
            const validationError = new Error('Validation error');
            const processingError = new Error('Processing error');

            errorHandler.handleFileUploadError(fileError);
            errorHandler.handleDataValidationError(validationError);
            errorHandler.handleProcessingError(processingError);

            const stats = errorHandler.getErrorStatistics();

            expect(stats.total).toBe(3);
            expect(stats.byCategory[ERROR_CATEGORIES.FILE_UPLOAD]).toBe(1);
            expect(stats.byCategory[ERROR_CATEGORIES.DATA_VALIDATION]).toBe(1);
            expect(stats.byCategory[ERROR_CATEGORIES.PROCESSING]).toBe(1);
        });

        test('should track system stability correctly', () => {
            expect(errorHandler.isSystemStable()).toBe(true);

            // Non-critical error should not affect stability
            const minorError = new Error('Minor validation error');
            errorHandler.handleDataValidationError(minorError);
            expect(errorHandler.isSystemStable()).toBe(true);

            // Critical error should affect stability
            const criticalError = new Error('Memory overflow');
            errorHandler.handleSystemError(criticalError);
            expect(errorHandler.isSystemStable()).toBe(false);
        });
    });

    describe('Integration with AuditLogger', () => {
        test('should log errors to audit system', () => {
            const logErrorSpy = jest.spyOn(auditLogger, 'logError');
            
            const error = new Error('Test error for audit');
            errorHandler.handleError(error);

            expect(logErrorSpy).toHaveBeenCalled();
        });
    });
});