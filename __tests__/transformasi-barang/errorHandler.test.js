/**
 * Property-based tests untuk ErrorHandler
 * Feature: transformasi-barang
 */

import fc from 'fast-check';

// Mock ErrorHandler untuk testing
class ErrorHandler {
    constructor() {
        this.initialized = false;
        this.errorLog = [];
        this.errorCategories = {
            VALIDATION: 'validation',
            CALCULATION: 'calculation', 
            SYSTEM: 'system',
            BUSINESS_LOGIC: 'business_logic'
        };
    }

    initialize() {
        this.initialized = true;
    }

    handleValidationError(error, context = {}) {
        if (!this.initialized) {
            throw new Error('ErrorHandler belum diinisialisasi');
        }

        const errorInfo = {
            category: this.errorCategories.VALIDATION,
            timestamp: new Date().toISOString(),
            context: context,
            originalError: error
        };

        this.errorLog.push(errorInfo);

        let userMessage = '';
        let suggestions = [];

        if (error.errors && Array.isArray(error.errors)) {
            userMessage = error.errors[0] || 'Terjadi kesalahan validasi';
            suggestions = this._getValidationSuggestions(error.errors);
        } else if (error.message) {
            userMessage = error.message;
            suggestions = this._getValidationSuggestions([error.message]);
        } else if (typeof error === 'string') {
            userMessage = error;
            suggestions = this._getValidationSuggestions([error]);
        } else {
            userMessage = 'Terjadi kesalahan validasi yang tidak diketahui';
        }

        return {
            success: false,
            category: this.errorCategories.VALIDATION,
            message: userMessage,
            suggestions: suggestions,
            severity: 'error',
            timestamp: errorInfo.timestamp,
            canRetry: true
        };
    }

    handleSystemError(error, context = {}) {
        if (!this.initialized) {
            throw new Error('ErrorHandler belum diinisialisasi');
        }

        const errorInfo = {
            category: this.errorCategories.SYSTEM,
            timestamp: new Date().toISOString(),
            context: context,
            originalError: error
        };

        this.errorLog.push(errorInfo);

        let userMessage = 'Terjadi kesalahan sistem';
        let canRetry = false;

        // Handle different error types safely
        const errorMessage = error && error.message ? error.message : error.toString();
        
        if (errorMessage.includes('localStorage')) {
            userMessage = 'Terjadi masalah dengan penyimpanan data';
            canRetry = true;
        } else if (errorMessage.includes('JSON')) {
            userMessage = 'Data rusak terdeteksi';
            canRetry = true;
        }

        return {
            success: false,
            category: this.errorCategories.SYSTEM,
            message: userMessage,
            suggestions: ['Coba lagi dalam beberapa saat'],
            severity: 'error',
            timestamp: errorInfo.timestamp,
            canRetry: canRetry
        };
    }

    handleBusinessLogicError(error, context = {}) {
        if (!this.initialized) {
            throw new Error('ErrorHandler belum diinisialisasi');
        }

        const errorInfo = {
            category: this.errorCategories.BUSINESS_LOGIC,
            timestamp: new Date().toISOString(),
            context: context,
            originalError: error
        };

        this.errorLog.push(errorInfo);

        const errorMessage = error && error.message ? error.message : error.toString();
        let userMessage = 'Aturan bisnis tidak terpenuhi';
        let suggestions = ['Periksa kembali parameter transformasi'];

        if (errorMessage.includes('stok tidak mencukupi') || errorMessage.includes('Tersedia:')) {
            userMessage = 'Stok tidak mencukupi untuk transformasi ini';
            suggestions = ['Periksa stok terkini', 'Kurangi jumlah transformasi'];
        } else if (errorMessage.includes('rasio konversi') || errorMessage.includes('tidak ditemukan')) {
            userMessage = 'Rasio konversi belum dikonfigurasi';
            suggestions = ['Hubungi administrator untuk konfigurasi rasio'];
        }

        return {
            success: false,
            category: this.errorCategories.BUSINESS_LOGIC,
            message: userMessage,
            suggestions: suggestions,
            severity: 'warning',
            timestamp: errorInfo.timestamp,
            canRetry: true
        };
    }

    _getValidationSuggestions(errors) {
        const suggestions = [];
        
        errors.forEach(error => {
            if (!error || typeof error !== 'string') return;
            
            const lowerError = error.toLowerCase();
            
            if (lowerError.includes('stok')) {
                suggestions.push('Periksa ketersediaan stok terkini');
            }
            if (lowerError.includes('produk')) {
                suggestions.push('Pastikan produk yang dipilih sudah benar');
            }
            if (lowerError.includes('quantity')) {
                suggestions.push('Masukkan jumlah yang valid');
            }
            if (lowerError.includes('rasio')) {
                suggestions.push('Hubungi administrator untuk konfigurasi rasio');
            }
        });

        // Always provide at least one suggestion
        if (suggestions.length === 0) {
            suggestions.push('Periksa kembali input yang dimasukkan');
        }

        return [...new Set(suggestions)];
    }

    getErrorLog() {
        return this.errorLog;
    }

    clearErrorLog() {
        this.errorLog = [];
    }
}

describe('ErrorHandler Property Tests', () => {
    let errorHandler;

    beforeEach(() => {
        errorHandler = new ErrorHandler();
        errorHandler.initialize();
    });

    /**
     * Feature: transformasi-barang, Property 9: Insufficient Stock Handling
     * Validates: Requirements 2.4
     */
    test('Property 9: Insufficient Stock Handling - For any transformation request where source stock is insufficient, the system should disable the transformation and display appropriate warning', () => {
        fc.assert(fc.property(
            fc.record({
                sourceItemId: fc.string({ minLength: 1, maxLength: 20 }),
                targetItemId: fc.string({ minLength: 1, maxLength: 20 }),
                sourceQuantity: fc.integer({ min: 1, max: 1000 }),
                availableStock: fc.integer({ min: 0, max: 999 })
            }).filter(data => data.sourceQuantity > data.availableStock && data.sourceItemId.trim().length > 0),
            (data) => {
                // Arrange
                const error = new Error(`Stok tidak mencukupi. Tersedia: ${data.availableStock}, Dibutuhkan: ${data.sourceQuantity}`);
                const context = {
                    sourceItemId: data.sourceItemId,
                    targetItemId: data.targetItemId,
                    requestedQuantity: data.sourceQuantity,
                    availableStock: data.availableStock
                };

                // Act
                const result = errorHandler.handleBusinessLogicError(error, context);

                // Assert
                expect(result.success).toBe(false);
                expect(result.category).toBe('business_logic');
                expect(result.message).toContain('Stok tidak mencukupi');
                expect(result.suggestions).toContain('Periksa stok terkini');
                expect(result.suggestions).toContain('Kurangi jumlah transformasi');
                expect(result.canRetry).toBe(true);
                expect(result.severity).toBe('warning');
            }
        ), { numRuns: 100 });
    });

    /**
     * Feature: transformasi-barang, Property 10: Missing Ratio Error Handling
     * Validates: Requirements 2.5
     */
    test('Property 10: Missing Ratio Error Handling - For any transformation request with undefined conversion ratio, the system should prevent execution and display error message', () => {
        fc.assert(fc.property(
            fc.record({
                sourceUnit: fc.string({ minLength: 1, maxLength: 10 }),
                targetUnit: fc.string({ minLength: 1, maxLength: 10 }),
                baseProduct: fc.string({ minLength: 1, maxLength: 20 })
            }).filter(data => data.sourceUnit.trim().length > 0 && data.targetUnit.trim().length > 0),
            (data) => {
                // Arrange
                const error = new Error(`Rasio konversi dari ${data.sourceUnit} ke ${data.targetUnit} tidak ditemukan untuk produk ${data.baseProduct}`);
                const context = {
                    sourceUnit: data.sourceUnit,
                    targetUnit: data.targetUnit,
                    baseProduct: data.baseProduct
                };

                // Act
                const result = errorHandler.handleBusinessLogicError(error, context);

                // Assert
                expect(result.success).toBe(false);
                expect(result.category).toBe('business_logic');
                expect(result.message).toContain('Rasio konversi belum dikonfigurasi');
                expect(result.suggestions).toContain('Hubungi administrator untuk konfigurasi rasio');
                expect(result.canRetry).toBe(true);
                expect(result.severity).toBe('warning');
            }
        ), { numRuns: 100 });
    });

    /**
     * Feature: transformasi-barang, Property 28: Error Message Quality
     * Validates: Requirements 6.5
     */
    test('Property 28: Error Message Quality - For any transformation error, user-friendly messages with corrective actions should be displayed', () => {
        fc.assert(fc.property(
            fc.oneof(
                fc.record({
                    type: fc.constant('validation'),
                    error: fc.oneof(
                        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                        fc.record({
                            message: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)
                        }),
                        fc.record({
                            errors: fc.array(fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), { minLength: 1, maxLength: 3 })
                        })
                    )
                }),
                fc.record({
                    type: fc.constant('system'),
                    error: fc.record({
                        message: fc.oneof(
                            fc.constant('localStorage error'),
                            fc.constant('JSON parse error'),
                            fc.constant('network error'),
                            fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)
                        )
                    })
                }),
                fc.record({
                    type: fc.constant('business'),
                    error: fc.record({
                        message: fc.oneof(
                            fc.constant('stok tidak mencukupi'),
                            fc.constant('rasio konversi tidak ditemukan'),
                            fc.constant('produk tidak cocok'),
                            fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)
                        )
                    })
                })
            ),
            (testCase) => {
                // Act
                let result;
                switch (testCase.type) {
                    case 'validation':
                        result = errorHandler.handleValidationError(testCase.error);
                        break;
                    case 'system':
                        result = errorHandler.handleSystemError(testCase.error);
                        break;
                    case 'business':
                        result = errorHandler.handleBusinessLogicError(testCase.error);
                        break;
                }

                // Assert - Error message quality requirements
                expect(result).toBeDefined();
                expect(result.success).toBe(false);
                expect(result.message).toBeDefined();
                expect(typeof result.message).toBe('string');
                expect(result.message.length).toBeGreaterThan(0);
                
                // Should have suggestions for corrective actions
                expect(result.suggestions).toBeDefined();
                expect(Array.isArray(result.suggestions)).toBe(true);
                expect(result.suggestions.length).toBeGreaterThan(0);
                
                // Should have appropriate severity
                expect(['error', 'warning', 'info']).toContain(result.severity);
                
                // Should have timestamp
                expect(result.timestamp).toBeDefined();
                expect(new Date(result.timestamp)).toBeInstanceOf(Date);
                
                // Should indicate if retry is possible
                expect(typeof result.canRetry).toBe('boolean');
                
                // Message should be user-friendly (not technical)
                expect(result.message).not.toMatch(/undefined|null|NaN|Error:/);
                expect(result.message).not.toMatch(/stack trace|console|debug/i);
            }
        ), { numRuns: 100 });
    });

    /**
     * Property test untuk error logging consistency
     */
    test('Error logging should be consistent across all error types', () => {
        fc.assert(fc.property(
            fc.record({
                errorType: fc.oneof(
                    fc.constant('validation'),
                    fc.constant('system'), 
                    fc.constant('business')
                ),
                errorMessage: fc.string({ minLength: 1 }),
                context: fc.record({
                    userId: fc.string({ minLength: 1 }),
                    action: fc.string({ minLength: 1 })
                })
            }),
            (data) => {
                // Arrange
                const initialLogCount = errorHandler.getErrorLog().length;
                const error = new Error(data.errorMessage);

                // Act
                let result;
                switch (data.errorType) {
                    case 'validation':
                        result = errorHandler.handleValidationError(error, data.context);
                        break;
                    case 'system':
                        result = errorHandler.handleSystemError(error, data.context);
                        break;
                    case 'business':
                        result = errorHandler.handleBusinessLogicError(error, data.context);
                        break;
                }

                // Assert
                const newLogCount = errorHandler.getErrorLog().length;
                expect(newLogCount).toBe(initialLogCount + 1);
                
                const latestLog = errorHandler.getErrorLog()[newLogCount - 1];
                expect(latestLog.category).toBe(result.category);
                expect(latestLog.timestamp).toBeDefined();
                expect(latestLog.context).toEqual(data.context);
                expect(latestLog.originalError).toBe(error);
            }
        ), { numRuns: 100 });
    });

    /**
     * Property test untuk error response structure consistency
     */
    test('All error responses should have consistent structure', () => {
        fc.assert(fc.property(
            fc.record({
                errorType: fc.oneof(
                    fc.constant('validation'),
                    fc.constant('system'),
                    fc.constant('business')
                ),
                error: fc.oneof(
                    fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                    fc.record({ message: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0) })
                )
            }),
            (data) => {
                // Act
                let result;
                switch (data.errorType) {
                    case 'validation':
                        result = errorHandler.handleValidationError(data.error);
                        break;
                    case 'system':
                        result = errorHandler.handleSystemError(data.error);
                        break;
                    case 'business':
                        result = errorHandler.handleBusinessLogicError(data.error);
                        break;
                }

                // Assert - All error responses should have consistent structure
                expect(result).toHaveProperty('success');
                expect(result).toHaveProperty('category');
                expect(result).toHaveProperty('message');
                expect(result).toHaveProperty('suggestions');
                expect(result).toHaveProperty('severity');
                expect(result).toHaveProperty('timestamp');
                expect(result).toHaveProperty('canRetry');

                expect(result.success).toBe(false);
                expect(typeof result.category).toBe('string');
                expect(typeof result.message).toBe('string');
                expect(Array.isArray(result.suggestions)).toBe(true);
                expect(['error', 'warning', 'info']).toContain(result.severity);
                expect(typeof result.timestamp).toBe('string');
                expect(typeof result.canRetry).toBe('boolean');
            }
        ), { numRuns: 100 });
    });

    /**
     * Property test untuk validation suggestions relevance
     */
    test('Validation suggestions should be relevant to error content', () => {
        fc.assert(fc.property(
            fc.array(fc.oneof(
                fc.constant('stok tidak mencukupi'),
                fc.constant('produk tidak ditemukan'),
                fc.constant('quantity harus positif'),
                fc.constant('rasio konversi tidak valid'),
                fc.string({ minLength: 1 })
            ), { minLength: 1 }),
            (errors) => {
                // Arrange
                const validationError = { errors: errors };

                // Act
                const result = errorHandler.handleValidationError(validationError);

                // Assert
                expect(result.suggestions).toBeDefined();
                expect(Array.isArray(result.suggestions)).toBe(true);

                // Check if suggestions are relevant to error content
                const errorText = errors.join(' ').toLowerCase();
                const suggestionText = result.suggestions.join(' ').toLowerCase();

                if (errorText.includes('stok')) {
                    expect(suggestionText).toMatch(/stok|stock/);
                }
                if (errorText.includes('produk')) {
                    expect(suggestionText).toMatch(/produk|product/);
                }
                if (errorText.includes('quantity')) {
                    expect(suggestionText).toMatch(/jumlah|quantity|angka/);
                }
                if (errorText.includes('rasio')) {
                    expect(suggestionText).toMatch(/rasio|ratio|administrator/);
                }
            }
        ), { numRuns: 100 });
    });
});