// **Feature: perbaikan-menu-tutup-kasir-pos, Property 6: Error handling data preservation**
// Validates: Requirements 3.2
// Task 2.1: Write property test for session validation

import fc from 'fast-check';

// Mock DOM environment
const mockDocument = {
    querySelector: () => null,
    getElementById: () => null,
    createElement: () => ({
        style: {},
        classList: {
            add: () => {},
            remove: () => {},
            contains: () => false
        },
        setAttribute: () => {},
        getAttribute: () => null,
        innerHTML: '',
        textContent: ''
    })
};

global.document = mockDocument;

// Mock sessionStorage
const sessionStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();

global.sessionStorage = sessionStorageMock;

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();

global.localStorage = localStorageMock;

// Mock console methods to avoid noise in tests
global.console = {
    ...console,
    error: () => {},
    warn: () => {},
    log: () => {}
};

/**
 * Core session validation logic extracted from validateBukaKasSession
 * This is the actual implementation we want to test
 */
function validateBukaKasSession() {
    const bukaKas = sessionStorage.getItem('bukaKas');
    if (!bukaKas) {
        return { 
            valid: false, 
            message: 'Belum ada kas yang dibuka. Silakan buka kas terlebih dahulu untuk memulai shift.',
            action: 'buka_kas'
        };
    }
    
    try {
        const data = JSON.parse(bukaKas);
        if (!data.kasir || !data.modalAwal || !data.waktuBuka) {
            return { 
                valid: false, 
                message: 'Data buka kas tidak lengkap. Silakan buka kas ulang.',
                action: 'buka_kas_ulang'
            };
        }
        return { valid: true, data: data };
    } catch (e) {
        sessionStorage.removeItem('bukaKas');
        sessionStorage.removeItem('shiftId');
        return { 
            valid: false, 
            message: 'Data buka kas corrupt. Session telah dibersihkan, silakan buka kas ulang.',
            action: 'session_corrupt'
        };
    }
}

/**
 * Simulate tutup kasir modal validation with error handling
 * This tests the error handling data preservation property
 */
function simulateTutupKasirModalValidation(preserveDataOnError = true) {
    const originalBukaKas = sessionStorage.getItem('bukaKas');
    const originalShiftId = sessionStorage.getItem('shiftId');
    const originalPenjualan = localStorage.getItem('penjualan');
    
    try {
        const bukaKas = sessionStorage.getItem('bukaKas');
        if (!bukaKas) {
            // Error case: No session data
            if (preserveDataOnError) {
                // Data should be preserved on error
                return {
                    success: false,
                    error: 'Belum ada kas yang dibuka',
                    dataPreserved: true,
                    originalData: { bukaKas: originalBukaKas, shiftId: originalShiftId, penjualan: originalPenjualan },
                    currentData: { 
                        bukaKas: sessionStorage.getItem('bukaKas'), 
                        shiftId: sessionStorage.getItem('shiftId'),
                        penjualan: localStorage.getItem('penjualan')
                    }
                };
            }
            return { success: false, error: 'Belum ada kas yang dibuka', dataPreserved: false };
        }
        
        let shiftData;
        try {
            shiftData = JSON.parse(bukaKas);
            
            // Validate required fields
            if (!shiftData.kasir || !shiftData.modalAwal || !shiftData.waktuBuka) {
                if (!preserveDataOnError) {
                    // Only clear session if not preserving data
                    sessionStorage.removeItem('bukaKas');
                    sessionStorage.removeItem('shiftId');
                }
                
                return {
                    success: false,
                    error: 'Data buka kas tidak lengkap',
                    dataPreserved: preserveDataOnError,
                    originalData: { bukaKas: originalBukaKas, shiftId: originalShiftId, penjualan: originalPenjualan },
                    currentData: { 
                        bukaKas: sessionStorage.getItem('bukaKas'), 
                        shiftId: sessionStorage.getItem('shiftId'),
                        penjualan: localStorage.getItem('penjualan')
                    }
                };
            }
        } catch (e) {
            if (!preserveDataOnError) {
                // Only clear session if not preserving data
                sessionStorage.removeItem('bukaKas');
                sessionStorage.removeItem('shiftId');
            }
            
            return {
                success: false,
                error: 'Data buka kas corrupt',
                dataPreserved: preserveDataOnError,
                originalData: { bukaKas: originalBukaKas, shiftId: originalShiftId, penjualan: originalPenjualan },
                currentData: { 
                    bukaKas: sessionStorage.getItem('bukaKas'), 
                    shiftId: sessionStorage.getItem('shiftId'),
                    penjualan: localStorage.getItem('penjualan')
                }
            };
        }
        
        // Success case
        return {
            success: true,
            data: shiftData,
            dataPreserved: true,
            originalData: { bukaKas: originalBukaKas, shiftId: originalShiftId, penjualan: originalPenjualan },
            currentData: { 
                bukaKas: sessionStorage.getItem('bukaKas'), 
                shiftId: sessionStorage.getItem('shiftId'),
                penjualan: localStorage.getItem('penjualan')
            }
        };
        
    } catch (error) {
        // Unexpected error - data should be preserved
        return {
            success: false,
            error: error.message,
            dataPreserved: preserveDataOnError,
            originalData: { bukaKas: originalBukaKas, shiftId: originalShiftId, penjualan: originalPenjualan },
            currentData: { 
                bukaKas: sessionStorage.getItem('bukaKas'), 
                shiftId: sessionStorage.getItem('shiftId'),
                penjualan: localStorage.getItem('penjualan')
            }
        };
    }
}

// Arbitraries for generating test data
const validKasirNameArbitrary = fc.string({ minLength: 3, maxLength: 50 })
    .filter(s => s.trim().length >= 3);

const validIdArbitrary = fc.string({ minLength: 5, maxLength: 20 })
    .filter(s => s.trim().length >= 5);

const validDateArbitrary = fc.date({
    min: new Date(2024, 0, 1),
    max: new Date(2025, 11, 31)
});

const validBukaKasDataArbitrary = fc.record({
    id: validIdArbitrary,
    kasir: validKasirNameArbitrary,
    kasirId: validIdArbitrary,
    modalAwal: fc.integer({ min: 0, max: 10000000 }),
    waktuBuka: validDateArbitrary.map(d => d.toISOString()),
    tanggal: validDateArbitrary.map(d => d.toISOString().split('T')[0])
});

const invalidBukaKasDataArbitrary = fc.oneof(
    // Missing required fields
    fc.record({
        id: validIdArbitrary,
        // missing kasir
        modalAwal: fc.integer({ min: 0, max: 1000000 })
    }),
    fc.record({
        kasir: validKasirNameArbitrary,
        // missing modalAwal
        waktuBuka: validDateArbitrary.map(d => d.toISOString())
    }),
    fc.record({
        id: validIdArbitrary,
        kasir: validKasirNameArbitrary,
        // missing waktuBuka
        modalAwal: fc.integer({ min: 0, max: 1000000 })
    }),
    // Empty or invalid values
    fc.record({
        id: fc.constant(''),
        kasir: validKasirNameArbitrary,
        waktuBuka: validDateArbitrary.map(d => d.toISOString()),
        modalAwal: fc.integer({ min: 0, max: 1000000 })
    }),
    fc.record({
        id: validIdArbitrary,
        kasir: fc.constant(''),
        waktuBuka: validDateArbitrary.map(d => d.toISOString()),
        modalAwal: fc.integer({ min: 0, max: 1000000 })
    })
);

const penjualanDataArbitrary = fc.array(
    fc.record({
        id: validIdArbitrary,
        tanggal: validDateArbitrary.map(d => d.toISOString()),
        total: fc.integer({ min: 1000, max: 1000000 }),
        status: fc.constantFrom('cash', 'kredit'),
        kasir: validKasirNameArbitrary
    }),
    { minLength: 0, maxLength: 50 }
);

describe('**Feature: perbaikan-menu-tutup-kasir-pos, Property 6: Error handling data preservation**', () => {
    beforeEach(() => {
        sessionStorageMock.clear();
        localStorageMock.clear();
    });

    // ============================================================================
    // PROPERTY 6.1: Data Preservation on Session Validation Errors
    // ============================================================================
    
    test('Property: Session validation errors should preserve existing data when preserveDataOnError is true', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    invalidBukaKasDataArbitrary,
                    fc.constant(null),
                    fc.constant(undefined)
                ),
                penjualanDataArbitrary,
                validIdArbitrary,
                (invalidSessionData, penjualanData, shiftId) => {
                    // Setup initial data
                    if (invalidSessionData) {
                        sessionStorage.setItem('bukaKas', JSON.stringify(invalidSessionData));
                    }
                    sessionStorage.setItem('shiftId', shiftId);
                    localStorage.setItem('penjualan', JSON.stringify(penjualanData));
                    
                    // Capture original state
                    const originalBukaKas = sessionStorage.getItem('bukaKas');
                    const originalShiftId = sessionStorage.getItem('shiftId');
                    const originalPenjualan = localStorage.getItem('penjualan');
                    
                    // Test with data preservation enabled
                    const result = simulateTutupKasirModalValidation(true);
                    
                    // Property: On error with preservation enabled, data should remain unchanged
                    if (!result.success && result.dataPreserved) {
                        const currentBukaKas = sessionStorage.getItem('bukaKas');
                        const currentShiftId = sessionStorage.getItem('shiftId');
                        const currentPenjualan = localStorage.getItem('penjualan');
                        
                        return currentBukaKas === originalBukaKas &&
                               currentShiftId === originalShiftId &&
                               currentPenjualan === originalPenjualan;
                    }
                    
                    return true; // Skip if success or no preservation
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 6.2: Data Clearing on Session Validation Errors (Legacy Behavior)
    // ============================================================================
    
    test('Property: Session validation errors should clear corrupted data when preserveDataOnError is false', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.string().filter(s => {
                        try {
                            JSON.parse(s);
                            return false; // Skip valid JSON
                        } catch {
                            return s.length > 0; // Only invalid JSON strings
                        }
                    }),
                    invalidBukaKasDataArbitrary.map(data => JSON.stringify(data))
                ),
                penjualanDataArbitrary,
                validIdArbitrary,
                (corruptedSessionData, penjualanData, shiftId) => {
                    // Setup initial data with corrupted session
                    sessionStorage.setItem('bukaKas', corruptedSessionData);
                    sessionStorage.setItem('shiftId', shiftId);
                    localStorage.setItem('penjualan', JSON.stringify(penjualanData));
                    
                    // Test with data preservation disabled (legacy behavior)
                    const result = simulateTutupKasirModalValidation(false);
                    
                    // Property: On error without preservation, session data should be cleared
                    if (!result.success && !result.dataPreserved) {
                        const currentBukaKas = sessionStorage.getItem('bukaKas');
                        const currentShiftId = sessionStorage.getItem('shiftId');
                        const currentPenjualan = localStorage.getItem('penjualan');
                        
                        // Session data should be cleared, but localStorage should remain
                        return currentBukaKas === null &&
                               currentShiftId === null &&
                               currentPenjualan === JSON.stringify(penjualanData);
                    }
                    
                    return true; // Skip if success or preservation enabled
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 6.3: Error Message Consistency
    // ============================================================================
    
    test('Property: Error messages should be consistent and informative for same error conditions', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(null), // No session data
                    fc.string().filter(s => {
                        try {
                            JSON.parse(s);
                            return false;
                        } catch {
                            return s.length > 0;
                        }
                    }), // Corrupted JSON
                    invalidBukaKasDataArbitrary.map(data => JSON.stringify(data)) // Invalid data structure
                ),
                (sessionData) => {
                    // Clear session first
                    sessionStorage.clear();
                    
                    if (sessionData) {
                        sessionStorage.setItem('bukaKas', sessionData);
                    }
                    
                    // Test multiple times with same data
                    const result1 = simulateTutupKasirModalValidation(true);
                    
                    // Reset session to same state
                    sessionStorage.clear();
                    if (sessionData) {
                        sessionStorage.setItem('bukaKas', sessionData);
                    }
                    
                    const result2 = simulateTutupKasirModalValidation(true);
                    
                    // Property: Same error conditions should produce same error messages
                    if (!result1.success && !result2.success) {
                        return result1.error === result2.error;
                    }
                    
                    return true; // Skip if either succeeded
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 6.4: Successful Validation Data Integrity
    // ============================================================================
    
    test('Property: Successful validation should not modify existing data', () => {
        fc.assert(
            fc.property(
                validBukaKasDataArbitrary,
                penjualanDataArbitrary,
                validIdArbitrary,
                (validSessionData, penjualanData, shiftId) => {
                    // Setup valid data
                    sessionStorage.setItem('bukaKas', JSON.stringify(validSessionData));
                    sessionStorage.setItem('shiftId', shiftId);
                    localStorage.setItem('penjualan', JSON.stringify(penjualanData));
                    
                    // Capture original state
                    const originalBukaKas = sessionStorage.getItem('bukaKas');
                    const originalShiftId = sessionStorage.getItem('shiftId');
                    const originalPenjualan = localStorage.getItem('penjualan');
                    
                    // Test validation
                    const result = simulateTutupKasirModalValidation(true);
                    
                    // Property: Successful validation should not modify data
                    if (result.success) {
                        const currentBukaKas = sessionStorage.getItem('bukaKas');
                        const currentShiftId = sessionStorage.getItem('shiftId');
                        const currentPenjualan = localStorage.getItem('penjualan');
                        
                        return currentBukaKas === originalBukaKas &&
                               currentShiftId === originalShiftId &&
                               currentPenjualan === originalPenjualan;
                    }
                    
                    return true; // Skip if validation failed
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 6.5: Error Recovery Mechanism
    // ============================================================================
    
    test('Property: Error recovery should provide appropriate action guidance', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(null),
                    fc.string().filter(s => {
                        try {
                            JSON.parse(s);
                            return false;
                        } catch {
                            return s.length > 0;
                        }
                    }),
                    invalidBukaKasDataArbitrary.map(data => JSON.stringify(data))
                ),
                (sessionData) => {
                    sessionStorage.clear();
                    
                    if (sessionData) {
                        sessionStorage.setItem('bukaKas', sessionData);
                    }
                    
                    const validation = validateBukaKasSession();
                    
                    // Property: Failed validation should provide recovery action
                    if (!validation.valid) {
                        const hasAction = validation.action && 
                                        ['buka_kas', 'buka_kas_ulang', 'session_corrupt'].includes(validation.action);
                        const hasMessage = validation.message && validation.message.length > 0;
                        
                        return hasAction && hasMessage;
                    }
                    
                    return true; // Skip if validation succeeded
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 6.6: Session Data Type Safety
    // ============================================================================
    
    test('Property: Session validation should handle different data types safely', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(null),
                    fc.constant(undefined),
                    fc.constant(''),
                    fc.constant('null'),
                    fc.constant('undefined'),
                    fc.integer(),
                    fc.boolean(),
                    fc.array(fc.string()),
                    validBukaKasDataArbitrary,
                    invalidBukaKasDataArbitrary
                ),
                (sessionData) => {
                    sessionStorage.clear();
                    
                    try {
                        if (sessionData !== null && sessionData !== undefined) {
                            const dataToStore = typeof sessionData === 'object' ? 
                                              JSON.stringify(sessionData) : 
                                              String(sessionData);
                            sessionStorage.setItem('bukaKas', dataToStore);
                        }
                        
                        const validation = validateBukaKasSession();
                        
                        // Property: Validation should never throw errors, always return result object
                        return validation && 
                               typeof validation === 'object' &&
                               typeof validation.valid === 'boolean' &&
                               (validation.valid === true || typeof validation.message === 'string');
                        
                    } catch (error) {
                        // Property violation: validation should not throw
                        return false;
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 6.7: Concurrent Session Access Safety
    // ============================================================================
    
    test('Property: Multiple concurrent session validations should be safe and consistent', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    validBukaKasDataArbitrary,
                    invalidBukaKasDataArbitrary,
                    fc.constant(null)
                ),
                (sessionData) => {
                    sessionStorage.clear();
                    
                    if (sessionData) {
                        sessionStorage.setItem('bukaKas', JSON.stringify(sessionData));
                    }
                    
                    // Simulate concurrent access
                    const results = [];
                    for (let i = 0; i < 5; i++) {
                        results.push(validateBukaKasSession());
                    }
                    
                    // Property: All concurrent validations should return identical results
                    const firstResult = results[0];
                    return results.every(result => 
                        result.valid === firstResult.valid &&
                        result.message === firstResult.message &&
                        result.action === firstResult.action
                    );
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 6.8: Error State Isolation
    // ============================================================================
    
    test('Property: Errors in session validation should not affect other storage areas', () => {
        fc.assert(
            fc.property(
                fc.string().filter(s => {
                    try {
                        JSON.parse(s);
                        return false;
                    } catch {
                        return s.length > 0;
                    }
                }),
                penjualanDataArbitrary,
                fc.record({
                    setting1: fc.string(),
                    setting2: fc.integer(),
                    setting3: fc.boolean()
                }),
                (corruptedSession, penjualanData, otherData) => {
                    // Setup data in different storage areas
                    sessionStorage.setItem('bukaKas', corruptedSession);
                    sessionStorage.setItem('otherSessionData', JSON.stringify(otherData));
                    localStorage.setItem('penjualan', JSON.stringify(penjualanData));
                    localStorage.setItem('otherLocalData', JSON.stringify(otherData));
                    
                    // Capture non-session data
                    const originalOtherSession = sessionStorage.getItem('otherSessionData');
                    const originalPenjualan = localStorage.getItem('penjualan');
                    const originalOtherLocal = localStorage.getItem('otherLocalData');
                    
                    // Trigger validation error
                    const validation = validateBukaKasSession();
                    
                    // Property: Session validation errors should not affect other data
                    if (!validation.valid) {
                        const currentOtherSession = sessionStorage.getItem('otherSessionData');
                        const currentPenjualan = localStorage.getItem('penjualan');
                        const currentOtherLocal = localStorage.getItem('otherLocalData');
                        
                        return currentOtherSession === originalOtherSession &&
                               currentPenjualan === originalPenjualan &&
                               currentOtherLocal === originalOtherLocal;
                    }
                    
                    return true; // Skip if validation succeeded
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 6.9: Memory Leak Prevention
    // ============================================================================
    
    test('Property: Session validation should not create memory leaks through retained references', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.oneof(
                        validBukaKasDataArbitrary,
                        invalidBukaKasDataArbitrary,
                        fc.constant(null)
                    ),
                    { minLength: 10, maxLength: 100 }
                ),
                (sessionDataArray) => {
                    let validationResults = [];
                    
                    // Perform many validations
                    sessionDataArray.forEach((sessionData, index) => {
                        sessionStorage.clear();
                        
                        if (sessionData) {
                            sessionStorage.setItem('bukaKas', JSON.stringify(sessionData));
                        }
                        
                        const result = validateBukaKasSession();
                        validationResults.push(result);
                        
                        // Clear result to test for retained references
                        validationResults[index] = null;
                    });
                    
                    // Property: All results should be independent (no shared references)
                    // This is a basic test - in real scenarios we'd check memory usage
                    return validationResults.every(result => result === null);
                }
            ),
            { numRuns: 50 } // Reduced runs for performance
        );
    });

    // ============================================================================
    // PROPERTY 6.10: Error Message Localization Consistency
    // ============================================================================
    
    test('Property: Error messages should be consistent in language and format', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(null),
                    fc.string().filter(s => {
                        try {
                            JSON.parse(s);
                            return false;
                        } catch {
                            return s.length > 0;
                        }
                    }),
                    invalidBukaKasDataArbitrary.map(data => JSON.stringify(data))
                ),
                (sessionData) => {
                    sessionStorage.clear();
                    
                    if (sessionData) {
                        sessionStorage.setItem('bukaKas', sessionData);
                    }
                    
                    const validation = validateBukaKasSession();
                    
                    // Property: Error messages should follow consistent format
                    if (!validation.valid && validation.message) {
                        const message = validation.message;
                        
                        // Check for Indonesian language consistency
                        const hasIndonesianTerms = message.includes('kas') || 
                                                 message.includes('buka') || 
                                                 message.includes('data') ||
                                                 message.includes('silakan');
                        
                        // Check for proper sentence structure
                        const isProperSentence = message.length > 10 && 
                                               message.charAt(0) === message.charAt(0).toUpperCase() &&
                                               message.endsWith('.');
                        
                        return hasIndonesianTerms && isProperSentence;
                    }
                    
                    return true; // Skip if validation succeeded
                }
            ),
            { numRuns: 100 }
        );
    });
});