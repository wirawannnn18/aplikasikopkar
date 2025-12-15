/**
 * Property Test: Missing Ratio Error Handling
 * Validates: Requirements 2.5
 * 
 * Property 10: Missing Ratio Error Handling
 * System must provide clear guidance when conversion ratios are missing or undefined
 */

import fc from 'fast-check';
import ErrorHandler from '../../js/transformasi-barang/ErrorHandler.js';

describe('Property Test: Missing Ratio Error Handling', () => {
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

    test('Property 10: Missing conversion ratio errors provide clear guidance and alternatives', () => {
        fc.assert(fc.property(
            fc.record({
                sourceUnit: fc.constantFrom('PCS', 'DUS', 'LUSIN', 'KG', 'LITER'),
                targetUnit: fc.constantFrom('PCS', 'DUS', 'LUSIN', 'KG', 'LITER'),
                productName: fc.string({ minLength: 1, maxLength: 50 }),
                baseProduct: fc.string({ minLength: 1, maxLength: 30 })
            }),
            (ratioScenario) => {
                // Only test scenarios where units are different (conversion needed)
                if (ratioScenario.sourceUnit === ratioScenario.targetUnit) {
                    return; // Skip same unit scenarios
                }

                // Create missing ratio error
                const missingRatioError = new Error(
                    `Rasio konversi dari ${ratioScenario.sourceUnit} ke ${ratioScenario.targetUnit} belum dikonfigurasi untuk produk ${ratioScenario.productName}`
                );

                const context = {
                    sourceUnit: ratioScenario.sourceUnit,
                    targetUnit: ratioScenario.targetUnit,
                    productName: ratioScenario.productName,
                    baseProduct: ratioScenario.baseProduct,
                    operation: 'conversion_ratio_lookup'
                };

                // Handle the error
                const errorResponse = errorHandler.handleBusinessLogicError(missingRatioError, context);

                // Verify error response structure
                expect(errorResponse.success).toBe(false);
                expect(errorResponse.category).toBe('business_logic');
                expect(errorResponse.severity).toBe('warning');
                expect(errorResponse.canRetry).toBe(true);

                // Verify message is informative about missing ratio
                expect(errorResponse.message).toBeDefined();
                expect(typeof errorResponse.message).toBe('string');
                expect(errorResponse.message.length).toBeGreaterThan(0);
                
                const messageText = errorResponse.message.toLowerCase();
                const hasRatioTerms = 
                    messageText.includes('rasio') ||
                    messageText.includes('konversi') ||
                    messageText.includes('konfigurasi');
                expect(hasRatioTerms).toBe(true);

                // Verify suggestions are provided and relevant
                expect(errorResponse.suggestions).toBeDefined();
                expect(Array.isArray(errorResponse.suggestions)).toBe(true);
                expect(errorResponse.suggestions.length).toBeGreaterThan(0);

                // Verify suggestions are relevant to ratio configuration
                const suggestionsText = errorResponse.suggestions.join(' ').toLowerCase();
                const hasRelevantSuggestions = 
                    suggestionsText.includes('administrator') ||
                    suggestionsText.includes('konfigurasi') ||
                    suggestionsText.includes('rasio') ||
                    suggestionsText.includes('kombinasi');
                expect(hasRelevantSuggestions).toBe(true);

                // Verify alternatives are provided when available
                if (errorResponse.alternatives) {
                    expect(Array.isArray(errorResponse.alternatives)).toBe(true);
                    if (errorResponse.alternatives.length > 0) {
                        errorResponse.alternatives.forEach(alternative => {
                            expect(typeof alternative).toBe('string');
                            expect(alternative.length).toBeGreaterThan(0);
                        });
                    }
                }

                // Verify timestamp is valid
                expect(errorResponse.timestamp).toBeDefined();
                expect(new Date(errorResponse.timestamp)).toBeInstanceOf(Date);
                expect(new Date(errorResponse.timestamp).getTime()).not.toBeNaN();
            }
        ), { numRuns: 30 });
    });

    test('Property 10.1: Ratio error messages distinguish between different missing ratio scenarios', () => {
        fc.assert(fc.property(
            fc.record({
                scenarios: fc.array(
                    fc.record({
                        sourceUnit: fc.constantFrom('PCS', 'DUS', 'LUSIN'),
                        targetUnit: fc.constantFrom('PCS', 'DUS', 'LUSIN'),
                        productName: fc.string({ minLength: 1, maxLength: 30 }),
                        errorType: fc.constantFrom('missing_ratio', 'invalid_ratio', 'corrupted_config')
                    }),
                    { minLength: 2, maxLength: 6 }
                )
            }),
            ({ scenarios }) => {
                // Filter to only different unit combinations
                const validScenarios = scenarios.filter(s => s.sourceUnit !== s.targetUnit);
                if (validScenarios.length < 2) return;

                const errorResponses = [];

                validScenarios.forEach(scenario => {
                    let errorMessage = '';
                    switch (scenario.errorType) {
                        case 'missing_ratio':
                            errorMessage = `Rasio konversi dari ${scenario.sourceUnit} ke ${scenario.targetUnit} belum dikonfigurasi`;
                            break;
                        case 'invalid_ratio':
                            errorMessage = `Rasio konversi dari ${scenario.sourceUnit} ke ${scenario.targetUnit} tidak valid`;
                            break;
                        case 'corrupted_config':
                            errorMessage = `Konfigurasi rasio konversi untuk ${scenario.productName} rusak atau tidak dapat dibaca`;
                            break;
                    }

                    const ratioError = new Error(errorMessage);
                    const context = {
                        sourceUnit: scenario.sourceUnit,
                        targetUnit: scenario.targetUnit,
                        productName: scenario.productName,
                        errorType: scenario.errorType
                    };

                    const errorResponse = errorHandler.handleBusinessLogicError(ratioError, context);
                    errorResponses.push({ scenario, response: errorResponse });
                });

                // Verify all responses have consistent structure
                errorResponses.forEach(({ response }) => {
                    expect(response.success).toBe(false);
                    expect(response.category).toBe('business_logic');
                    expect(response.canRetry).toBe(true);
                    expect(response.message).toBeDefined();
                    expect(response.suggestions).toBeDefined();
                });

                // Verify messages are contextually appropriate
                errorResponses.forEach(({ scenario, response }) => {
                    const messageText = response.message.toLowerCase();
                    
                    // Should mention ratio/conversion
                    expect(
                        messageText.includes('rasio') || 
                        messageText.includes('konversi')
                    ).toBe(true);

                    // Should be specific to error type when possible
                    if (scenario.errorType === 'missing_ratio') {
                        const hasMissingTerms = 
                            messageText.includes('belum') ||
                            messageText.includes('tidak') ||
                            messageText.includes('konfigurasi');
                        expect(hasMissingTerms).toBe(true);
                    }
                });

                // Verify suggestions are appropriate for ratio issues
                errorResponses.forEach(({ response }) => {
                    const suggestionsText = response.suggestions.join(' ').toLowerCase();
                    
                    // Should suggest contacting administrator or checking configuration
                    const hasAdminSuggestion = 
                        suggestionsText.includes('administrator') ||
                        suggestionsText.includes('admin') ||
                        suggestionsText.includes('konfigurasi');
                    expect(hasAdminSuggestion).toBe(true);
                });
            }
        ), { numRuns: 20 });
    });

    test('Property 10.2: Missing ratio errors provide actionable recovery steps', () => {
        fc.assert(fc.property(
            fc.record({
                sourceUnit: fc.constantFrom('PCS', 'DUS', 'LUSIN'),
                targetUnit: fc.constantFrom('PCS', 'DUS', 'LUSIN'),
                productName: fc.string({ minLength: 1, maxLength: 40 }),
                userRole: fc.constantFrom('kasir', 'admin', 'supervisor'),
                hasAlternativeRatios: fc.boolean()
            }),
            (scenario) => {
                if (scenario.sourceUnit === scenario.targetUnit) return;

                const missingRatioError = new Error(
                    `Rasio konversi dari ${scenario.sourceUnit} ke ${scenario.targetUnit} belum dikonfigurasi untuk produk ${scenario.productName}`
                );

                const context = {
                    sourceUnit: scenario.sourceUnit,
                    targetUnit: scenario.targetUnit,
                    productName: scenario.productName,
                    userRole: scenario.userRole,
                    hasAlternativeRatios: scenario.hasAlternativeRatios
                };

                const errorResponse = errorHandler.handleBusinessLogicError(missingRatioError, context);

                // Verify suggestions are actionable
                expect(errorResponse.suggestions.length).toBeGreaterThan(0);
                
                errorResponse.suggestions.forEach(suggestion => {
                    expect(typeof suggestion).toBe('string');
                    expect(suggestion.length).toBeGreaterThan(10);
                    
                    // Should contain actionable verbs
                    const actionVerbs = ['hubungi', 'pilih', 'periksa', 'coba', 'gunakan', 'konfigurasi'];
                    const hasActionVerb = actionVerbs.some(verb => 
                        suggestion.toLowerCase().includes(verb)
                    );
                    expect(hasActionVerb).toBe(true);
                });

                // Verify suggestions are specific to ratio issues
                const allSuggestionsText = errorResponse.suggestions.join(' ').toLowerCase();
                const ratioSpecificTerms = ['rasio', 'konversi', 'konfigurasi', 'administrator', 'kombinasi'];
                const hasRatioSpecificTerms = ratioSpecificTerms.some(term => 
                    allSuggestionsText.includes(term)
                );
                expect(hasRatioSpecificTerms).toBe(true);

                // If alternatives exist, should be mentioned
                if (scenario.hasAlternativeRatios && errorResponse.alternatives) {
                    expect(errorResponse.alternatives.length).toBeGreaterThan(0);
                    
                    const alternativesText = errorResponse.alternatives.join(' ').toLowerCase();
                    const hasAlternativeGuidance = 
                        alternativesText.includes('kombinasi') ||
                        alternativesText.includes('pilih') ||
                        alternativesText.includes('unit');
                    expect(hasAlternativeGuidance).toBe(true);
                }

                // Should not suggest impossible actions for regular users
                if (scenario.userRole === 'kasir') {
                    const suggestionsText = allSuggestionsText;
                    // Kasir shouldn't be told to configure ratios themselves
                    const suggestsDirectConfig = suggestionsText.includes('atur rasio') || 
                                               suggestionsText.includes('tambah konfigurasi');
                    expect(suggestsDirectConfig).toBe(false);
                }
            }
        ), { numRuns: 25 });
    });

    test('Property 10.3: Ratio error handling maintains consistency across unit combinations', () => {
        fc.assert(fc.property(
            fc.array(
                fc.record({
                    sourceUnit: fc.constantFrom('PCS', 'DUS', 'LUSIN'),
                    targetUnit: fc.constantFrom('PCS', 'DUS', 'LUSIN'),
                    productName: fc.string({ minLength: 1, maxLength: 30 })
                }),
                { minLength: 3, maxLength: 8 }
            ),
            (unitCombinations) => {
                // Filter to only different unit combinations
                const validCombinations = unitCombinations.filter(combo => 
                    combo.sourceUnit !== combo.targetUnit
                );
                
                if (validCombinations.length < 2) return;

                const errorResponses = [];

                validCombinations.forEach(combo => {
                    const missingRatioError = new Error(
                        `Rasio konversi dari ${combo.sourceUnit} ke ${combo.targetUnit} belum dikonfigurasi untuk produk ${combo.productName}`
                    );

                    const context = {
                        sourceUnit: combo.sourceUnit,
                        targetUnit: combo.targetUnit,
                        productName: combo.productName
                    };

                    const errorResponse = errorHandler.handleBusinessLogicError(missingRatioError, context);
                    errorResponses.push(errorResponse);
                });

                // Verify consistency across all responses
                errorResponses.forEach(response => {
                    expect(response.success).toBe(false);
                    expect(response.category).toBe('business_logic');
                    expect(response.severity).toBe('warning');
                    expect(response.canRetry).toBe(true);
                    
                    expect(response.message).toBeDefined();
                    expect(response.suggestions).toBeDefined();
                    expect(response.timestamp).toBeDefined();
                });

                // Verify message quality consistency
                const messageLengths = errorResponses.map(r => r.message.length);
                const avgMessageLength = messageLengths.reduce((a, b) => a + b, 0) / messageLengths.length;
                
                messageLengths.forEach(length => {
                    expect(length).toBeGreaterThan(avgMessageLength * 0.7); // Reasonable consistency
                    expect(length).toBeLessThan(avgMessageLength * 1.5);
                });

                // Verify suggestion quality consistency
                const suggestionCounts = errorResponses.map(r => r.suggestions.length);
                const avgSuggestionCount = suggestionCounts.reduce((a, b) => a + b, 0) / suggestionCounts.length;
                
                suggestionCounts.forEach(count => {
                    expect(count).toBeGreaterThan(0);
                    expect(count).toBeLessThanOrEqual(Math.max(5, avgSuggestionCount * 1.5)); // Not excessive
                });

                // Verify all responses mention ratio/conversion concepts
                errorResponses.forEach(response => {
                    const messageText = response.message.toLowerCase();
                    const suggestionsText = response.suggestions.join(' ').toLowerCase();
                    const allText = messageText + ' ' + suggestionsText;
                    
                    const hasRatioConcepts = 
                        allText.includes('rasio') ||
                        allText.includes('konversi') ||
                        allText.includes('konfigurasi');
                    expect(hasRatioConcepts).toBe(true);
                });
            }
        ), { numRuns: 20 });
    });

    test('Property 10.4: Ratio error logging captures configuration context', () => {
        fc.assert(fc.property(
            fc.record({
                sourceUnit: fc.constantFrom('PCS', 'DUS', 'LUSIN'),
                targetUnit: fc.constantFrom('PCS', 'DUS', 'LUSIN'),
                productName: fc.string({ minLength: 1, maxLength: 40 }),
                baseProduct: fc.string({ minLength: 1, maxLength: 30 }),
                configurationState: fc.constantFrom('missing', 'corrupted', 'partial')
            }),
            (scenario) => {
                if (scenario.sourceUnit === scenario.targetUnit) return;

                // Clear previous logs
                errorHandler.clearErrorLog();

                const missingRatioError = new Error(
                    `Rasio konversi dari ${scenario.sourceUnit} ke ${scenario.targetUnit} belum dikonfigurasi untuk produk ${scenario.productName}`
                );

                const context = {
                    sourceUnit: scenario.sourceUnit,
                    targetUnit: scenario.targetUnit,
                    productName: scenario.productName,
                    baseProduct: scenario.baseProduct,
                    configurationState: scenario.configurationState,
                    operation: 'ratio_lookup',
                    attemptedConversion: `${scenario.sourceUnit}_to_${scenario.targetUnit}`
                };

                // Handle the error
                errorHandler.handleBusinessLogicError(missingRatioError, context);

                // Verify error was logged with proper context
                const errorLog = errorHandler.getErrorLog();
                expect(errorLog.length).toBe(1);

                const logEntry = errorLog[0];
                
                // Verify log structure
                expect(logEntry.category).toBe('business_logic');
                expect(logEntry.timestamp).toBeDefined();
                expect(logEntry.context).toBeDefined();
                expect(logEntry.originalError).toBeDefined();

                // Verify configuration context is preserved
                expect(logEntry.context.sourceUnit).toBe(scenario.sourceUnit);
                expect(logEntry.context.targetUnit).toBe(scenario.targetUnit);
                expect(logEntry.context.productName).toBe(scenario.productName);
                expect(logEntry.context.baseProduct).toBe(scenario.baseProduct);
                expect(logEntry.context.configurationState).toBe(scenario.configurationState);
                expect(logEntry.context.attemptedConversion).toBe(`${scenario.sourceUnit}_to_${scenario.targetUnit}`);

                // Verify original error details are preserved
                expect(logEntry.originalError.message).toContain('rasio konversi');
                expect(logEntry.originalError.message).toContain(scenario.sourceUnit);
                expect(logEntry.originalError.message).toContain(scenario.targetUnit);
                expect(logEntry.originalError.message).toContain(scenario.productName);

                // Verify timestamp is recent and valid
                const logTime = new Date(logEntry.timestamp);
                const now = new Date();
                const timeDiff = now.getTime() - logTime.getTime();
                expect(timeDiff).toBeLessThan(5000); // Within 5 seconds
                expect(logTime.getTime()).not.toBeNaN();
            }
        ), { numRuns: 20 });
    });
});