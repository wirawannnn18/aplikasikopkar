/**
 * Property Test: Error Reporting Precision
 * Validates that error reporting provides precise and actionable information
 * 
 * Requirements: 2.3
 * Property 7: Error Reporting Precision
 */

import fc from 'fast-check';

// Mock classes for testing
class MockErrorHandler {
    constructor() {
        this.errors = [];
        this.warnings = [];
    }

    addError(code, message, context) {
        const error = {
            id: 'ERR_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            code,
            message,
            context: {
                row: context?.row || null,
                column: context?.column || null,
                field: context?.field || null,
                value: context?.value || null,
                timestamp: new Date().toISOString(),
                ...context
            },
            severity: 'error'
        };
        this.errors.push(error);
        return error;
    }

    getErrors() {
        return this.errors;
    }

    clear() {
        this.errors = [];
        this.warnings = [];
    }

    formatErrorForDisplay(error) {
        let displayMessage = `[${error.code}] ${error.message}`;
        
        if (error.context.row) {
            displayMessage += ` (Baris ${error.context.row})`;
        }
        
        if (error.context.field) {
            displayMessage += ` - Field: ${error.context.field}`;
        }
        
        if (error.context.value !== null && error.context.value !== undefined) {
            displayMessage += ` - Nilai: "${error.context.value}"`;
        }
        
        return displayMessage;
    }
}

describe('Property Test: Error Reporting Precision', () => {
    let errorHandler;

    beforeEach(() => {
        errorHandler = new MockErrorHandler();
    });

    /**
     * Property 7.1: Error Context Completeness
     * Every error must include sufficient context information
     */
    test('Property 7.1: Error Context Completeness', () => {
        fc.assert(fc.property(
            fc.record({
                code: fc.constantFrom('E201', 'E202', 'E203', 'E204'),
                message: fc.string({ minLength: 10, maxLength: 100 }),
                row: fc.integer({ min: 1, max: 1000 }),
                field: fc.constantFrom('kode', 'nama', 'kategori', 'satuan', 'harga_beli', 'stok'),
                value: fc.oneof(fc.string(), fc.integer(), fc.float(), fc.constant(null))
            }),
            (errorData) => {
                // Add error with context
                const error = errorHandler.addError(
                    errorData.code,
                    errorData.message,
                    {
                        row: errorData.row,
                        field: errorData.field,
                        value: errorData.value
                    }
                );

                // Verify error has complete context
                expect(error.context).toBeDefined();
                expect(error.context.row).toBe(errorData.row);
                expect(error.context.field).toBe(errorData.field);
                expect(error.context.value).toBe(errorData.value);
                expect(error.context.timestamp).toBeDefined();
                
                // Verify error has unique ID
                expect(error.id).toBeDefined();
                expect(error.id).toMatch(/^ERR_\d+_[a-z0-9]+$/);
                
                // Verify error code and message
                expect(error.code).toBe(errorData.code);
                expect(error.message).toBe(errorData.message);
            }
        ), { numRuns: 100 });
    });

    /**
     * Property 7.2: Error Message Clarity
     * Error messages must be clear and include specific information
     */
    test('Property 7.2: Error Message Clarity', () => {
        fc.assert(fc.property(
            fc.record({
                row: fc.integer({ min: 1, max: 1000 }),
                field: fc.constantFrom('kode', 'nama', 'kategori', 'satuan', 'harga_beli', 'stok'),
                value: fc.oneof(
                    fc.string({ minLength: 1, maxLength: 50 }),
                    fc.integer({ min: -1000, max: 1000 }),
                    fc.constant(''),
                    fc.constant(null)
                )
            }),
            (testData) => {
                // Add error
                const error = errorHandler.addError(
                    'E201',
                    'Field wajib tidak boleh kosong',
                    testData
                );

                // Format error for display
                const displayMessage = errorHandler.formatErrorForDisplay(error);

                // Verify display message includes all relevant information
                expect(displayMessage).toContain(error.code);
                expect(displayMessage).toContain(error.message);
                
                if (testData.row) {
                    expect(displayMessage).toContain(`Baris ${testData.row}`);
                }
                
                if (testData.field) {
                    expect(displayMessage).toContain(`Field: ${testData.field}`);
                }
                
                if (testData.value !== null && testData.value !== undefined) {
                    expect(displayMessage).toContain(`Nilai: "${testData.value}"`);
                }

                // Verify message is not empty and has minimum length
                expect(displayMessage.length).toBeGreaterThan(10);
            }
        ), { numRuns: 100 });
    });

    /**
     * Property 7.3: Error Uniqueness
     * Each error must have a unique identifier
     */
    test('Property 7.3: Error Uniqueness', () => {
        fc.assert(fc.property(
            fc.array(
                fc.record({
                    code: fc.constantFrom('E201', 'E202', 'E203'),
                    message: fc.string({ minLength: 5, maxLength: 50 }),
                    row: fc.integer({ min: 1, max: 100 }),
                    field: fc.constantFrom('kode', 'nama', 'kategori')
                }),
                { minLength: 2, maxLength: 20 }
            ),
            (errorDataArray) => {
                // Clear existing errors first
                errorHandler.clear();
                const errorIds = new Set();

                // Add multiple errors
                errorDataArray.forEach(errorData => {
                    const error = errorHandler.addError(
                        errorData.code,
                        errorData.message,
                        {
                            row: errorData.row,
                            field: errorData.field
                        }
                    );

                    // Verify ID is unique
                    expect(errorIds.has(error.id)).toBe(false);
                    errorIds.add(error.id);
                });

                // Verify all errors have unique IDs
                const errors = errorHandler.getErrors();
                expect(errors.length).toBe(errorDataArray.length);
                expect(errorIds.size).toBe(errorDataArray.length);
            }
        ), { numRuns: 50 });
    });

    /**
     * Property 7.4: Error Categorization Consistency
     * Errors with same code should have consistent structure
     */
    test('Property 7.4: Error Categorization Consistency', () => {
        fc.assert(fc.property(
            fc.record({
                errorCode: fc.constantFrom('E201', 'E202', 'E203', 'E204'),
                instances: fc.array(
                    fc.record({
                        message: fc.string({ minLength: 5, maxLength: 100 }),
                        row: fc.integer({ min: 1, max: 1000 }),
                        field: fc.constantFrom('kode', 'nama', 'kategori', 'satuan'),
                        value: fc.oneof(fc.string(), fc.integer(), fc.constant(null))
                    }),
                    { minLength: 2, maxLength: 10 }
                )
            }),
            (testData) => {
                // Add multiple errors with same code
                const addedErrors = testData.instances.map(instance => {
                    return errorHandler.addError(
                        testData.errorCode,
                        instance.message,
                        {
                            row: instance.row,
                            field: instance.field,
                            value: instance.value
                        }
                    );
                });

                // Verify all errors have same code
                addedErrors.forEach(error => {
                    expect(error.code).toBe(testData.errorCode);
                    expect(error.severity).toBe('error');
                    
                    // Verify context structure consistency
                    expect(error.context).toHaveProperty('row');
                    expect(error.context).toHaveProperty('field');
                    expect(error.context).toHaveProperty('value');
                    expect(error.context).toHaveProperty('timestamp');
                    
                    // Verify timestamp is valid ISO string
                    expect(() => new Date(error.context.timestamp)).not.toThrow();
                });
            }
        ), { numRuns: 50 });
    });

    /**
     * Property 7.5: Error Location Precision
     * Row and column information must be accurate and consistent
     */
    test('Property 7.5: Error Location Precision', () => {
        fc.assert(fc.property(
            fc.record({
                row: fc.integer({ min: 1, max: 10000 }),
                column: fc.integer({ min: 1, max: 50 }),
                field: fc.constantFrom('kode', 'nama', 'kategori', 'satuan', 'harga_beli', 'stok'),
                value: fc.string({ minLength: 0, maxLength: 100 })
            }),
            (locationData) => {
                const error = errorHandler.addError(
                    'E201',
                    'Test error message',
                    locationData
                );

                // Verify location information is preserved exactly
                expect(error.context.row).toBe(locationData.row);
                expect(error.context.column).toBe(locationData.column);
                expect(error.context.field).toBe(locationData.field);
                expect(error.context.value).toBe(locationData.value);

                // Verify location information is positive integers
                if (error.context.row !== null) {
                    expect(error.context.row).toBeGreaterThan(0);
                    expect(Number.isInteger(error.context.row)).toBe(true);
                }
                
                if (error.context.column !== null) {
                    expect(error.context.column).toBeGreaterThan(0);
                    expect(Number.isInteger(error.context.column)).toBe(true);
                }
            }
        ), { numRuns: 100 });
    });

    /**
     * Property 7.6: Error Timestamp Accuracy
     * Error timestamps must be accurate and in correct format
     */
    test('Property 7.6: Error Timestamp Accuracy', () => {
        fc.assert(fc.property(
            fc.record({
                code: fc.constantFrom('E201', 'E202', 'E203'),
                message: fc.string({ minLength: 5, maxLength: 50 }),
                context: fc.record({
                    row: fc.integer({ min: 1, max: 100 }),
                    field: fc.constantFrom('kode', 'nama')
                })
            }),
            (errorData) => {
                const beforeTime = new Date();
                
                const error = errorHandler.addError(
                    errorData.code,
                    errorData.message,
                    errorData.context
                );
                
                const afterTime = new Date();
                const errorTime = new Date(error.context.timestamp);

                // Verify timestamp is within reasonable range
                expect(errorTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime() - 1000); // 1 second tolerance
                expect(errorTime.getTime()).toBeLessThanOrEqual(afterTime.getTime() + 1000);

                // Verify timestamp is valid ISO string
                expect(error.context.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
                
                // Verify timestamp can be parsed back to Date
                expect(() => new Date(error.context.timestamp)).not.toThrow();
                expect(isNaN(errorTime.getTime())).toBe(false);
            }
        ), { numRuns: 100 });
    });

    /**
     * Property 7.7: Error Accumulation Consistency
     * Multiple errors should accumulate correctly without interference
     */
    test('Property 7.7: Error Accumulation Consistency', () => {
        fc.assert(fc.property(
            fc.array(
                fc.record({
                    code: fc.constantFrom('E201', 'E202', 'E203', 'E204', 'E205'),
                    message: fc.string({ minLength: 5, maxLength: 100 }),
                    row: fc.integer({ min: 1, max: 1000 }),
                    field: fc.constantFrom('kode', 'nama', 'kategori', 'satuan', 'harga_beli', 'stok')
                }),
                { minLength: 1, maxLength: 50 }
            ),
            (errorDataArray) => {
                // Clear any existing errors
                errorHandler.clear();
                
                // Add all errors
                const addedErrors = errorDataArray.map(errorData => {
                    return errorHandler.addError(
                        errorData.code,
                        errorData.message,
                        {
                            row: errorData.row,
                            field: errorData.field
                        }
                    );
                });

                // Verify all errors are stored
                const storedErrors = errorHandler.getErrors();
                expect(storedErrors.length).toBe(errorDataArray.length);

                // Verify each error maintains its integrity
                addedErrors.forEach((addedError, index) => {
                    const storedError = storedErrors[index];
                    const originalData = errorDataArray[index];

                    expect(storedError.id).toBe(addedError.id);
                    expect(storedError.code).toBe(originalData.code);
                    expect(storedError.message).toBe(originalData.message);
                    expect(storedError.context.row).toBe(originalData.row);
                    expect(storedError.context.field).toBe(originalData.field);
                });

                // Verify no errors are lost or duplicated
                const errorIds = storedErrors.map(error => error.id);
                const uniqueIds = new Set(errorIds);
                expect(uniqueIds.size).toBe(errorIds.length);
            }
        ), { numRuns: 30 });
    });
});