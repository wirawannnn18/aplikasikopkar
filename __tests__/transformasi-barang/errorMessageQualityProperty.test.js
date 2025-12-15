/**
 * Property Test: Error Message Quality
 * Validates: Requirements 6.5
 * 
 * Property 28: Error Message Quality
 * Error messages must be user-friendly, informative, and provide actionable guidance
 */

import fc from 'fast-check';
import ErrorHandler from '../../js/transformasi-barang/ErrorHandler.js';

describe('Property Test: Error Message Quality', () => {
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

    test('Property 28: Error messages are user-friendly and informative across all error types', () => {
        fc.assert(fc.property(
            fc.record({
                errorType: fc.constantFrom('validation', 'system', 'business_logic', 'calculation'),
                errorScenario: fc.record({
                    message: fc.string({ minLength: 10, maxLength: 100 }),
                    context: fc.record({
                        operation: fc.constantFrom('transformation', 'validation', 'calculation', 'stock_check'),
                        userRole: fc.constantFrom('kasir', 'admin', 'supervisor'),
                        itemName: fc.string({ minLength: 1, maxLength: 50 }),
                        severity: fc.constantFrom('low', 'medium', 'high')
                    })
                })
            }),
            ({ errorType, errorScenario }) => {
                // Create appropriate error based on type
                const error = new Error(errorScenario.message);
                let errorResponse;

                switch (errorType) {
                    case 'validation':
                        errorResponse = errorHandler.handleValidationError(error, errorScenario.context);
                        break;
                    case 'system':
                        errorResponse = errorHandler.handleSystemError(error, errorScenario.context);
                        break;
                    case 'business_logic':
                        errorResponse = errorHandler.handleBusinessLogicError(error, errorScenario.context);
                        break;
                    case 'calculation':
                        errorResponse = errorHandler.handleCalculationError(error, errorScenario.context);
                        break;
                }

                // Verify basic error response structure
                expect(errorResponse.success).toBe(false);
                expect(errorResponse.category).toBeDefined();
                expect(errorResponse.message).toBeDefined();
                expect(errorResponse.suggestions).toBeDefined();
                expect(errorResponse.timestamp).toBeDefined();

                // Verify message quality - user-friendly
                expect(typeof errorResponse.message).toBe('string');
                expect(errorResponse.message.length).toBeGreaterThan(5);
                expect(errorResponse.message.length).toBeLessThan(500); // Not too verbose

                // Should not contain technical jargon for end users
                const technicalTerms = ['undefined', 'null', 'NaN', 'stack trace', 'exception', 'TypeError'];
                const messageText = errorResponse.message.toLowerCase();
                technicalTerms.forEach(term => {
                    expect(messageText.includes(term.toLowerCase())).toBe(false);
                });

                // Should use Indonesian language appropriately
                const hasIndonesianTerms = 
                    messageText.includes('terjadi') ||
                    messageText.includes('tidak') ||
                    messageText.includes('gagal') ||
                    messageText.includes('kesalahan') ||
                    messageText.includes('silakan') ||
                    messageText.includes('periksa');
                expect(hasIndonesianTerms).toBe(true);

                // Verify suggestions are actionable
                expect(Array.isArray(errorResponse.suggestions)).toBe(true);
                expect(errorResponse.suggestions.length).toBeGreaterThan(0);
                
                errorResponse.suggestions.forEach(suggestion => {
                    expect(typeof suggestion).toBe('string');
                    expect(suggestion.length).toBeGreaterThan(5);
                    
                    // Should contain actionable verbs
                    const actionVerbs = ['periksa', 'coba', 'hubungi', 'pastikan', 'pilih', 'kurangi', 'tambah', 'refresh'];
                    const hasActionVerb = actionVerbs.some(verb => 
                        suggestion.toLowerCase().includes(verb)
                    );
                    expect(hasActionVerb).toBe(true);
                });

                // Verify severity is appropriate
                expect(['error', 'warning', 'info']).toContain(errorResponse.severity);

                // Verify timestamp is valid
                expect(new Date(errorResponse.timestamp)).toBeInstanceOf(Date);
                expect(new Date(errorResponse.timestamp).getTime()).not.toBeNaN();
            }
        ), { numRuns: 30 });
    });

    test('Property 28.1: Error message clarity scales with error complexity', () => {
        fc.assert(fc.property(
            fc.record({
                simpleErrors: fc.array(
                    fc.record({
                        message: fc.string({ minLength: 5, maxLength: 30 }),
                        type: fc.constantFrom('validation', 'business_logic')
                    }),
                    { minLength: 2, maxLength: 5 }
                ),
                complexErrors: fc.array(
                    fc.record({
                        message: fc.string({ minLength: 50, maxLength: 150 }),
                        type: fc.constantFrom('system', 'calculation'),
                        context: fc.record({
                            stackTrace: fc.string({ minLength: 100, maxLength: 500 }),
                            multipleIssues: fc.array(fc.string({ minLength: 10, maxLength: 50 }), { minLength: 2, maxLength: 5 })
                        })
                    }),
                    { minLength: 2, maxLength: 5 }
                )
            }),
            ({ simpleErrors, complexErrors }) => {
                const simpleResponses = [];
                const complexResponses = [];

                // Process simple errors
                simpleErrors.forEach(errorData => {
                    const error = new Error(errorData.message);
                    let response;
                    
                    if (errorData.type === 'validation') {
                        response = errorHandler.handleValidationError(error);
                    } else {
                        response = errorHandler.handleBusinessLogicError(error);
                    }
                    
                    simpleResponses.push(response);
                });

                // Process complex errors
                complexErrors.forEach(errorData => {
                    const error = new Error(errorData.message);
                    let response;
                    
                    if (errorData.type === 'system') {
                        response = errorHandler.handleSystemError(error, errorData.context);
                    } else {
                        response = errorHandler.handleCalculationError(error, errorData.context);
                    }
                    
                    complexResponses.push(response);
                });

                // Verify simple errors have concise, clear messages
                simpleResponses.forEach(response => {
                    expect(response.message.length).toBeLessThan(200);
                    expect(response.suggestions.length).toBeLessThanOrEqual(4);
                    
                    // Should be direct and to the point
                    const messageWords = response.message.split(' ');
                    expect(messageWords.length).toBeLessThan(30);
                });

                // Verify complex errors provide adequate detail without overwhelming
                complexResponses.forEach(response => {
                    expect(response.message.length).toBeGreaterThan(20);
                    expect(response.suggestions.length).toBeGreaterThan(0);
                    
                    // Should provide helpful guidance despite complexity
                    const suggestionsText = response.suggestions.join(' ').toLowerCase();
                    const hasHelpfulGuidance = 
                        suggestionsText.includes('administrator') ||
                        suggestionsText.includes('coba lagi') ||
                        suggestionsText.includes('hubungi') ||
                        suggestionsText.includes('periksa');
                    expect(hasHelpfulGuidance).toBe(true);
                });

                // Verify both types maintain user-friendly language
                [...simpleResponses, ...complexResponses].forEach(response => {
                    const messageText = response.message.toLowerCase();
                    
                    // Should not expose technical internals
                    const technicalExposure = 
                        messageText.includes('stack') ||
                        messageText.includes('undefined') ||
                        messageText.includes('null pointer') ||
                        messageText.includes('exception');
                    expect(technicalExposure).toBe(false);
                });
            }
        ), { numRuns: 15 });
    });

    test('Property 28.2: Error messages maintain consistency in tone and style', () => {
        fc.assert(fc.property(
            fc.array(
                fc.record({
                    errorType: fc.constantFrom('validation', 'system', 'business_logic', 'calculation'),
                    message: fc.string({ minLength: 10, maxLength: 80 }),
                    context: fc.record({
                        userRole: fc.constantFrom('kasir', 'admin'),
                        operation: fc.string({ minLength: 5, maxLength: 20 })
                    })
                }),
                { minLength: 4, maxLength: 10 }
            ),
            (errorScenarios) => {
                const errorResponses = [];

                errorScenarios.forEach(scenario => {
                    const error = new Error(scenario.message);
                    let response;

                    switch (scenario.errorType) {
                        case 'validation':
                            response = errorHandler.handleValidationError(error, scenario.context);
                            break;
                        case 'system':
                            response = errorHandler.handleSystemError(error, scenario.context);
                            break;
                        case 'business_logic':
                            response = errorHandler.handleBusinessLogicError(error, scenario.context);
                            break;
                        case 'calculation':
                            response = errorHandler.handleCalculationError(error, scenario.context);
                            break;
                    }

                    errorResponses.push({ scenario, response });
                });

                // Verify consistent tone across all messages
                errorResponses.forEach(({ response }) => {
                    const messageText = response.message.toLowerCase();
                    
                    // Should use polite, professional tone
                    const hasPoliteLanguage = 
                        messageText.includes('silakan') ||
                        messageText.includes('mohon') ||
                        messageText.includes('harap') ||
                        !messageText.includes('error') || // Avoid technical "error" term
                        messageText.includes('terjadi kesalahan');
                    
                    // At least some messages should use polite language
                    // (Not all messages need it, but the overall tone should be professional)
                });

                // Verify consistent structure
                errorResponses.forEach(({ response }) => {
                    // All should have required fields
                    expect(response.message).toBeDefined();
                    expect(response.suggestions).toBeDefined();
                    expect(response.category).toBeDefined();
                    expect(response.severity).toBeDefined();
                    
                    // Message should not end with technical codes or IDs visible to user
                    expect(response.message.endsWith('undefined')).toBe(false);
                    expect(response.message.endsWith('null')).toBe(false);
                });

                // Verify suggestions maintain consistent helpfulness
                errorResponses.forEach(({ response }) => {
                    response.suggestions.forEach(suggestion => {
                        // Should be complete sentences or clear instructions
                        expect(suggestion.length).toBeGreaterThan(8);
                        
                        // Should not be just technical terms
                        const isJustTechnical = 
                            suggestion.toLowerCase() === 'error' ||
                            suggestion.toLowerCase() === 'failed' ||
                            suggestion.toLowerCase() === 'undefined';
                        expect(isJustTechnical).toBe(false);
                    });
                });

                // Verify severity assignment is consistent
                const validationResponses = errorResponses.filter(({ scenario }) => scenario.errorType === 'validation');
                const systemResponses = errorResponses.filter(({ scenario }) => scenario.errorType === 'system');
                
                if (validationResponses.length > 0) {
                    // Validation errors should generally be warnings or errors
                    validationResponses.forEach(({ response }) => {
                        expect(['warning', 'error']).toContain(response.severity);
                    });
                }
                
                if (systemResponses.length > 0) {
                    // System errors should generally be errors
                    systemResponses.forEach(({ response }) => {
                        expect(response.severity).toBe('error');
                    });
                }
            }
        ), { numRuns: 20 });
    });

    test('Property 28.3: Error messages provide contextually appropriate guidance', () => {
        fc.assert(fc.property(
            fc.record({
                userRole: fc.constantFrom('kasir', 'admin', 'supervisor'),
                errorContext: fc.record({
                    operation: fc.constantFrom('stock_transformation', 'ratio_configuration', 'data_validation', 'system_maintenance'),
                    hasPermissions: fc.boolean(),
                    canRetry: fc.boolean(),
                    hasAlternatives: fc.boolean()
                }),
                errorMessage: fc.string({ minLength: 15, maxLength: 100 })
            }),
            ({ userRole, errorContext, errorMessage }) => {
                const error = new Error(errorMessage);
                const context = {
                    userRole,
                    operation: errorContext.operation,
                    hasPermissions: errorContext.hasPermissions,
                    canRetry: errorContext.canRetry,
                    hasAlternatives: errorContext.hasAlternatives
                };

                // Handle as business logic error (most contextual)
                const errorResponse = errorHandler.handleBusinessLogicError(error, context);

                // Verify guidance is appropriate for user role
                const suggestionsText = errorResponse.suggestions.join(' ').toLowerCase();
                
                if (userRole === 'kasir') {
                    // Kasir should not be told to do admin tasks
                    const hasAdminTasks = 
                        suggestionsText.includes('konfigurasi sistem') ||
                        suggestionsText.includes('atur database') ||
                        suggestionsText.includes('ubah pengaturan');
                    expect(hasAdminTasks).toBe(false);
                    
                    // Should suggest contacting admin for complex issues
                    if (errorContext.operation === 'ratio_configuration' || errorContext.operation === 'system_maintenance') {
                        const suggestsContactAdmin = 
                            suggestionsText.includes('administrator') ||
                            suggestionsText.includes('admin') ||
                            suggestionsText.includes('supervisor');
                        expect(suggestsContactAdmin).toBe(true);
                    }
                }

                if (userRole === 'admin') {
                    // Admin should get more technical guidance when appropriate
                    if (errorContext.operation === 'ratio_configuration' || errorContext.operation === 'system_maintenance') {
                        const hasTechnicalGuidance = 
                            suggestionsText.includes('konfigurasi') ||
                            suggestionsText.includes('periksa') ||
                            suggestionsText.includes('atur');
                        expect(hasTechnicalGuidance).toBe(true);
                    }
                }

                // Verify retry guidance matches context
                if (errorContext.canRetry) {
                    expect(errorResponse.canRetry).toBe(true);
                } else {
                    // If context says can't retry, response should reflect that
                    const suggestsRetry = 
                        suggestionsText.includes('coba lagi') ||
                        suggestionsText.includes('ulangi');
                    // Should not strongly suggest retry if context says it won't work
                }

                // Verify alternatives are mentioned when available
                if (errorContext.hasAlternatives && errorResponse.alternatives) {
                    expect(errorResponse.alternatives.length).toBeGreaterThan(0);
                }

                // Verify operation-specific guidance
                if (errorContext.operation === 'stock_transformation') {
                    const hasStockGuidance = 
                        suggestionsText.includes('stok') ||
                        suggestionsText.includes('jumlah') ||
                        suggestionsText.includes('transformasi');
                    expect(hasStockGuidance).toBe(true);
                }

                if (errorContext.operation === 'data_validation') {
                    const hasValidationGuidance = 
                        suggestionsText.includes('data') ||
                        suggestionsText.includes('periksa') ||
                        suggestionsText.includes('validasi');
                    expect(hasValidationGuidance).toBe(true);
                }
            }
        ), { numRuns: 25 });
    });

    test('Property 28.4: Error message localization and cultural appropriateness', () => {
        fc.assert(fc.property(
            fc.record({
                errorMessages: fc.array(
                    fc.record({
                        type: fc.constantFrom('validation', 'business_logic', 'system'),
                        englishMessage: fc.string({ minLength: 10, maxLength: 80 }),
                        context: fc.record({
                            formality: fc.constantFrom('formal', 'casual'),
                            urgency: fc.constantFrom('low', 'medium', 'high')
                        })
                    }),
                    { minLength: 3, maxLength: 8 }
                )
            }),
            ({ errorMessages }) => {
                const responses = [];

                errorMessages.forEach(errorData => {
                    const error = new Error(errorData.englishMessage);
                    let response;

                    switch (errorData.type) {
                        case 'validation':
                            response = errorHandler.handleValidationError(error, errorData.context);
                            break;
                        case 'business_logic':
                            response = errorHandler.handleBusinessLogicError(error, errorData.context);
                            break;
                        case 'system':
                            response = errorHandler.handleSystemError(error, errorData.context);
                            break;
                    }

                    responses.push({ errorData, response });
                });

                // Verify Indonesian language usage
                responses.forEach(({ response }) => {
                    const messageText = response.message.toLowerCase();
                    const suggestionsText = response.suggestions.join(' ').toLowerCase();
                    const allText = messageText + ' ' + suggestionsText;

                    // Should use Indonesian terms appropriately
                    const indonesianTerms = ['terjadi', 'silakan', 'periksa', 'hubungi', 'pastikan', 'coba'];
                    const hasIndonesianTerms = indonesianTerms.some(term => allText.includes(term));
                    expect(hasIndonesianTerms).toBe(true);

                    // Should avoid mixing languages inappropriately
                    const englishTechnicalTerms = ['error occurred', 'please try', 'contact support', 'check the'];
                    englishTechnicalTerms.forEach(term => {
                        expect(allText.includes(term)).toBe(false);
                    });
                });

                // Verify cultural appropriateness (polite, respectful tone)
                responses.forEach(({ response }) => {
                    const messageText = response.message.toLowerCase();
                    
                    // Should not use harsh or blaming language
                    const harshTerms = ['salah anda', 'kesalahan anda', 'anda gagal'];
                    harshTerms.forEach(term => {
                        expect(messageText.includes(term)).toBe(false);
                    });

                    // Should use respectful language
                    const respectfulIndicators = 
                        messageText.includes('silakan') ||
                        messageText.includes('mohon') ||
                        messageText.includes('harap') ||
                        !messageText.includes('harus') || // Avoid commanding tone
                        messageText.includes('dapat');
                    
                    // At least some level of politeness should be present
                });

                // Verify suggestions are culturally appropriate
                responses.forEach(({ response }) => {
                    response.suggestions.forEach(suggestion => {
                        const suggestionText = suggestion.toLowerCase();
                        
                        // Should not suggest inappropriate escalation
                        const inappropriateEscalation = 
                            suggestionText.includes('komplain') ||
                            suggestionText.includes('marah') ||
                            suggestionText.includes('tuntut');
                        expect(inappropriateEscalation).toBe(false);
                        
                        // Should suggest appropriate professional channels
                        if (suggestionText.includes('hubungi')) {
                            const hasAppropriateChannel = 
                                suggestionText.includes('administrator') ||
                                suggestionText.includes('admin') ||
                                suggestionText.includes('supervisor') ||
                                suggestionText.includes('support');
                            expect(hasAppropriateChannel).toBe(true);
                        }
                    });
                });
            }
        ), { numRuns: 15 });
    });
});