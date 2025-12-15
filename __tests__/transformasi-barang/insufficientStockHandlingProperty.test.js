/**
 * Property Test: Insufficient Stock Handling
 * Validates: Requirements 2.4
 * 
 * Property 9: Insufficient Stock Handling
 * System must gracefully handle and provide clear feedback for insufficient stock scenarios
 */

import fc from 'fast-check';
import ErrorHandler from '../../js/transformasi-barang/ErrorHandler.js';

describe('Property Test: Insufficient Stock Handling', () => {
    let errorHandler;

    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        
        errorHandler = new ErrorHandler();
        errorHandler.initialize();
    });

    afterEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    test('Property 9: Insufficient stock errors provide clear feedback and suggestions', () => {
        fc.assert(fc.property(
            fc.record({
                availableStock: fc.integer({ min: 0, max: 100 }),
                requestedQuantity: fc.integer({ min: 1, max: 200 }),
                itemName: fc.string({ minLength: 1, maxLength: 50 }),
                unit: fc.constantFrom('PCS', 'DUS', 'LUSIN', 'KG')
            }),
            (stockScenario) => {
                // Only test insufficient stock scenarios
                if (stockScenario.requestedQuantity <= stockScenario.availableStock) {
                    return; // Skip sufficient stock scenarios
                }

                // Create insufficient stock error
                const insufficientStockError = new Error(
                    `Stok ${stockScenario.itemName} tidak mencukupi. Stok tersedia: ${stockScenario.availableStock}, diminta: ${stockScenario.requestedQuantity}`
                );

                const context = {
                    itemName: stockScenario.itemName,
                    unit: stockScenario.unit,
                    availableStock: stockScenario.availableStock,
                    requestedQuantity: stockScenario.requestedQuantity,
                    operation: 'transformation'
                };

                // Handle the error
                const errorResponse = errorHandler.handleBusinessLogicError(insufficientStockError, context);

                // Verify error response structure
                expect(errorResponse.success).toBe(false);
                expect(errorResponse.category).toBe('business_logic');
                expect(errorResponse.severity).toBe('warning');
                expect(errorResponse.canRetry).toBe(true);

                // Verify message is user-friendly and informative
                expect(errorResponse.message).toBeDefined();
                expect(typeof errorResponse.message).toBe('string');
                expect(errorResponse.message.length).toBeGreaterThan(0);
                expect(errorResponse.message.toLowerCase()).toContain('stok');

                // Verify suggestions are provided
                expect(errorResponse.suggestions).toBeDefined();
                expect(Array.isArray(errorResponse.suggestions)).toBe(true);
                expect(errorResponse.suggestions.length).toBeGreaterThan(0);

                // Verify suggestions are relevant to stock issues
                const suggestionsText = errorResponse.suggestions.join(' ').toLowerCase();
                const hasRelevantSuggestions = 
                    suggestionsText.includes('stok') ||
                    suggestionsText.includes('kurangi') ||
                    suggestionsText.includes('jumlah') ||
                    suggestionsText.includes('periksa');
                expect(hasRelevantSuggestions).toBe(true);

                // Verify alternatives are provided when available
                if (errorResponse.alternatives) {
                    expect(Array.isArray(errorResponse.alternatives)).toBe(true);
                }

                // Verify timestamp is valid
                expect(errorResponse.timestamp).toBeDefined();
                expect(new Date(errorResponse.timestamp)).toBeInstanceOf(Date);
                expect(new Date(errorResponse.timestamp).getTime()).not.toBeNaN();
            }
        ), { numRuns: 30 });
    });

    test('Property 9.1: Stock error messages scale appropriately with shortage severity', () => {
        fc.assert(fc.property(
            fc.record({
                availableStock: fc.integer({ min: 0, max: 50 }),
                shortageMultiplier: fc.integer({ min: 2, max: 10 }),
                itemName: fc.string({ minLength: 1, maxLength: 30 })
            }),
            (scenario) => {
                const requestedQuantity = scenario.availableStock + (scenario.availableStock * scenario.shortageMultiplier);
                const shortage = requestedQuantity - scenario.availableStock;
                const shortagePercentage = scenario.availableStock > 0 ? (shortage / scenario.availableStock) * 100 : 100;

                const insufficientStockError = new Error(
                    `Stok ${scenario.itemName} tidak mencukupi. Stok tersedia: ${scenario.availableStock}, diminta: ${requestedQuantity}`
                );

                const context = {
                    itemName: scenario.itemName,
                    availableStock: scenario.availableStock,
                    requestedQuantity: requestedQuantity,
                    shortage: shortage,
                    shortagePercentage: shortagePercentage
                };

                const errorResponse = errorHandler.handleBusinessLogicError(insufficientStockError, context);

                // Verify error handling is consistent regardless of shortage severity
                expect(errorResponse.success).toBe(false);
                expect(errorResponse.category).toBe('business_logic');
                expect(errorResponse.canRetry).toBe(true);

                // Verify message quality doesn't degrade with larger shortages
                expect(errorResponse.message).toBeDefined();
                expect(errorResponse.message.length).toBeGreaterThan(10);
                expect(errorResponse.suggestions.length).toBeGreaterThan(0);

                // For zero stock, should have specific handling
                if (scenario.availableStock === 0) {
                    const messageText = errorResponse.message.toLowerCase();
                    expect(messageText).toContain('stok');
                }

                // For very large shortages, should still provide helpful suggestions
                if (shortagePercentage > 500) {
                    const suggestionsText = errorResponse.suggestions.join(' ').toLowerCase();
                    expect(suggestionsText.length).toBeGreaterThan(20); // Should have substantial suggestions
                }
            }
        ), { numRuns: 25 });
    });

    test('Property 9.2: Error handling maintains consistency across different stock scenarios', () => {
        fc.assert(fc.property(
            fc.array(
                fc.record({
                    itemName: fc.string({ minLength: 1, maxLength: 30 }),
                    availableStock: fc.integer({ min: 0, max: 100 }),
                    requestedQuantity: fc.integer({ min: 101, max: 200 }), // Always insufficient
                    unit: fc.constantFrom('PCS', 'DUS', 'LUSIN')
                }),
                { minLength: 2, maxLength: 10 }
            ),
            (stockScenarios) => {
                const errorResponses = [];

                // Process each stock scenario
                stockScenarios.forEach(scenario => {
                    const insufficientStockError = new Error(
                        `Stok ${scenario.itemName} tidak mencukupi. Stok tersedia: ${scenario.availableStock}, diminta: ${scenario.requestedQuantity}`
                    );

                    const context = {
                        itemName: scenario.itemName,
                        unit: scenario.unit,
                        availableStock: scenario.availableStock,
                        requestedQuantity: scenario.requestedQuantity
                    };

                    const errorResponse = errorHandler.handleBusinessLogicError(insufficientStockError, context);
                    errorResponses.push(errorResponse);
                });

                // Verify consistency across all responses
                errorResponses.forEach(response => {
                    // All should have same basic structure
                    expect(response.success).toBe(false);
                    expect(response.category).toBe('business_logic');
                    expect(response.severity).toBe('warning');
                    expect(response.canRetry).toBe(true);

                    // All should have required fields
                    expect(response.message).toBeDefined();
                    expect(response.suggestions).toBeDefined();
                    expect(response.timestamp).toBeDefined();

                    // All should have meaningful content
                    expect(response.message.length).toBeGreaterThan(0);
                    expect(response.suggestions.length).toBeGreaterThan(0);
                });

                // Verify message quality is consistent
                const messageLengths = errorResponses.map(r => r.message.length);
                const avgMessageLength = messageLengths.reduce((a, b) => a + b, 0) / messageLengths.length;
                
                // No message should be significantly shorter than average (quality consistency)
                messageLengths.forEach(length => {
                    expect(length).toBeGreaterThan(avgMessageLength * 0.5);
                });

                // Verify suggestion quality is consistent
                const suggestionCounts = errorResponses.map(r => r.suggestions.length);
                const avgSuggestionCount = suggestionCounts.reduce((a, b) => a + b, 0) / suggestionCounts.length;
                
                // All should have reasonable number of suggestions
                suggestionCounts.forEach(count => {
                    expect(count).toBeGreaterThan(0);
                    expect(count).toBeLessThanOrEqual(avgSuggestionCount * 2); // Not excessively many
                });
            }
        ), { numRuns: 20 });
    });

    test('Property 9.3: Stock error recovery suggestions are actionable and specific', () => {
        fc.assert(fc.property(
            fc.record({
                availableStock: fc.integer({ min: 0, max: 50 }),
                requestedQuantity: fc.integer({ min: 51, max: 200 }),
                itemName: fc.string({ minLength: 1, maxLength: 40 }),
                hasAlternatives: fc.boolean(),
                userRole: fc.constantFrom('kasir', 'admin', 'supervisor')
            }),
            (scenario) => {
                const insufficientStockError = new Error(
                    `Stok ${scenario.itemName} tidak mencukupi. Stok tersedia: ${scenario.availableStock}, diminta: ${scenario.requestedQuantity}`
                );

                const context = {
                    itemName: scenario.itemName,
                    availableStock: scenario.availableStock,
                    requestedQuantity: scenario.requestedQuantity,
                    hasAlternatives: scenario.hasAlternatives,
                    userRole: scenario.userRole
                };

                const errorResponse = errorHandler.handleBusinessLogicError(insufficientStockError, context);

                // Verify suggestions are actionable
                errorResponse.suggestions.forEach(suggestion => {
                    expect(typeof suggestion).toBe('string');
                    expect(suggestion.length).toBeGreaterThan(5);
                    
                    // Should contain action words
                    const actionWords = ['periksa', 'kurangi', 'pilih', 'coba', 'hubungi', 'pastikan'];
                    const hasActionWord = actionWords.some(word => 
                        suggestion.toLowerCase().includes(word)
                    );
                    expect(hasActionWord).toBe(true);
                });

                // Verify suggestions are specific to stock issues
                const allSuggestionsText = errorResponse.suggestions.join(' ').toLowerCase();
                const stockRelatedTerms = ['stok', 'jumlah', 'kurangi', 'tersedia'];
                const hasStockTerms = stockRelatedTerms.some(term => 
                    allSuggestionsText.includes(term)
                );
                expect(hasStockTerms).toBe(true);

                // If alternatives are available, should be mentioned
                if (scenario.hasAlternatives && errorResponse.alternatives) {
                    expect(errorResponse.alternatives.length).toBeGreaterThan(0);
                    errorResponse.alternatives.forEach(alternative => {
                        expect(typeof alternative).toBe('string');
                        expect(alternative.length).toBeGreaterThan(5);
                    });
                }

                // Verify no generic/unhelpful suggestions
                const genericPhrases = ['coba lagi', 'hubungi support', 'restart aplikasi'];
                errorResponse.suggestions.forEach(suggestion => {
                    const isGeneric = genericPhrases.some(phrase => 
                        suggestion.toLowerCase().includes(phrase)
                    );
                    // Generic suggestions should be minimal for stock errors
                    if (isGeneric) {
                        // Should have at least one specific suggestion too
                        const hasSpecificSuggestion = errorResponse.suggestions.some(s => 
                            s.toLowerCase().includes('stok') || 
                            s.toLowerCase().includes('jumlah') ||
                            s.toLowerCase().includes('kurangi')
                        );
                        expect(hasSpecificSuggestion).toBe(true);
                    }
                });
            }
        ), { numRuns: 25 });
    });

    test('Property 9.4: Error logging captures sufficient context for stock issues', () => {
        fc.assert(fc.property(
            fc.record({
                availableStock: fc.integer({ min: 0, max: 100 }),
                requestedQuantity: fc.integer({ min: 101, max: 300 }),
                itemName: fc.string({ minLength: 1, maxLength: 50 }),
                transactionId: fc.string({ minLength: 1, maxLength: 20 })
            }),
            (scenario) => {
                // Clear previous logs
                errorHandler.clearErrorLog();

                const insufficientStockError = new Error(
                    `Stok ${scenario.itemName} tidak mencukupi. Stok tersedia: ${scenario.availableStock}, diminta: ${scenario.requestedQuantity}`
                );

                const context = {
                    itemName: scenario.itemName,
                    availableStock: scenario.availableStock,
                    requestedQuantity: scenario.requestedQuantity,
                    transactionId: scenario.transactionId,
                    operation: 'stock_check'
                };

                // Handle the error
                errorHandler.handleBusinessLogicError(insufficientStockError, context);

                // Verify error was logged
                const errorLog = errorHandler.getErrorLog();
                expect(errorLog.length).toBe(1);

                const logEntry = errorLog[0];
                
                // Verify log structure
                expect(logEntry.category).toBe('business_logic');
                expect(logEntry.timestamp).toBeDefined();
                expect(logEntry.context).toBeDefined();
                expect(logEntry.originalError).toBeDefined();

                // Verify context information is preserved
                expect(logEntry.context.itemName).toBe(scenario.itemName);
                expect(logEntry.context.availableStock).toBe(scenario.availableStock);
                expect(logEntry.context.requestedQuantity).toBe(scenario.requestedQuantity);
                expect(logEntry.context.transactionId).toBe(scenario.transactionId);

                // Verify timestamp is valid and recent
                const logTime = new Date(logEntry.timestamp);
                const now = new Date();
                const timeDiff = now.getTime() - logTime.getTime();
                expect(timeDiff).toBeLessThan(5000); // Within 5 seconds

                // Verify original error is preserved
                expect(logEntry.originalError.message).toContain('tidak mencukupi');
                expect(logEntry.originalError.message).toContain(scenario.availableStock.toString());
                expect(logEntry.originalError.message).toContain(scenario.requestedQuantity.toString());
            }
        ), { numRuns: 20 });
    });
});