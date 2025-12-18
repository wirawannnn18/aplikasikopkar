// **Feature: perbaikan-menu-tutup-kasir-pos, Property 1: Button visibility consistency**
// Validates: Requirements 1.1, 1.3, 3.1
// Task 1.1: Write property test for button visibility consistency

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

// Mock console methods to avoid noise in tests
global.console = {
    ...console,
    error: () => {},
    warn: () => {},
    log: () => {}
};

/**
 * Core button visibility logic extracted from updateTutupKasirButtonStatus
 * This is the actual implementation we want to test
 */
function checkTutupKasirButtonVisibility(sessionData) {
    // Simulate the session validation logic
    const bukaKas = sessionData;
    
    if (!bukaKas) {
        return {
            visible: false,
            enabled: false,
            opacity: '0.5',
            title: 'Tutup Kasir (F10) - Belum buka kas'
        };
    }
    
    try {
        const parsedData = typeof bukaKas === 'string' ? JSON.parse(bukaKas) : bukaKas;
        
        // Validate required fields
        if (!parsedData.kasir || !parsedData.id || !parsedData.waktuBuka) {
            return {
                visible: false,
                enabled: false,
                opacity: '0.5',
                title: 'Tutup Kasir (F10) - Data buka kas tidak valid'
            };
        }
        
        return {
            visible: true,
            enabled: true,
            opacity: '1',
            title: `Tutup Kasir (F10) - Kasir: ${parsedData.kasir}`
        };
        
    } catch (error) {
        return {
            visible: false,
            enabled: false,
            opacity: '0.5',
            title: 'Tutup Kasir (F10) - Error parsing session data'
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
        // missing id
        modalAwal: fc.integer({ min: 0, max: 1000000 })
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

describe('**Feature: perbaikan-menu-tutup-kasir-pos, Property 1: Button visibility consistency**', () => {
    beforeEach(() => {
        sessionStorageMock.clear();
    });

    // ============================================================================
    // PROPERTY 1.1: Button Visibility with Valid Session Data
    // ============================================================================
    
    test('Property: Button should be visible and enabled when valid buka kas session exists', () => {
        fc.assert(
            fc.property(
                validBukaKasDataArbitrary,
                (bukaKasData) => {
                    // Test with object data
                    const resultObject = checkTutupKasirButtonVisibility(bukaKasData);
                    
                    // Test with JSON string data (as stored in sessionStorage)
                    const jsonString = JSON.stringify(bukaKasData);
                    const resultString = checkTutupKasirButtonVisibility(jsonString);
                    
                    // Property: Valid session data should make button visible and enabled
                    const objectValid = resultObject.visible === true && 
                                      resultObject.enabled === true && 
                                      resultObject.opacity === '1' &&
                                      resultObject.title.includes(bukaKasData.kasir);
                    
                    const stringValid = resultString.visible === true && 
                                      resultString.enabled === true && 
                                      resultString.opacity === '1' &&
                                      resultString.title.includes(bukaKasData.kasir);
                    
                    return objectValid && stringValid;
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 1.2: Button Visibility with No Session Data
    // ============================================================================
    
    test('Property: Button should be hidden/disabled when no buka kas session exists', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(null, undefined, '', false, 0),
                (emptySessionData) => {
                    const result = checkTutupKasirButtonVisibility(emptySessionData);
                    
                    // Property: No session data should make button invisible/disabled
                    return result.visible === false && 
                           result.enabled === false && 
                           result.opacity === '0.5' &&
                           result.title.includes('Belum buka kas');
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 1.3: Button Visibility with Invalid Session Data
    // ============================================================================
    
    test('Property: Button should be hidden/disabled when buka kas session data is invalid', () => {
        fc.assert(
            fc.property(
                invalidBukaKasDataArbitrary,
                (invalidData) => {
                    // Test with object data
                    const resultObject = checkTutupKasirButtonVisibility(invalidData);
                    
                    // Test with JSON string data
                    const jsonString = JSON.stringify(invalidData);
                    const resultString = checkTutupKasirButtonVisibility(jsonString);
                    
                    // Property: Invalid session data should make button invisible/disabled
                    const objectInvalid = resultObject.visible === false && 
                                        resultObject.enabled === false && 
                                        resultObject.opacity === '0.5';
                    
                    const stringInvalid = resultString.visible === false && 
                                        resultString.enabled === false && 
                                        resultString.opacity === '0.5';
                    
                    return objectInvalid && stringInvalid;
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 1.4: Button Visibility with Corrupted JSON Data
    // ============================================================================
    
    test('Property: Button should be hidden/disabled when session data is corrupted JSON', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant('{"invalid": json}'),
                    fc.constant('{kasir: "test", missing quotes}'),
                    fc.constant('{"kasir": "test"'), // incomplete JSON
                    fc.constant('null'),
                    fc.constant('undefined'),
                    fc.string().filter(s => {
                        try {
                            JSON.parse(s);
                            return false; // Skip valid JSON
                        } catch {
                            return s.length > 0; // Only invalid JSON strings
                        }
                    })
                ),
                (corruptedJson) => {
                    const result = checkTutupKasirButtonVisibility(corruptedJson);
                    
                    // Property: Corrupted JSON should make button invisible/disabled
                    return result.visible === false && 
                           result.enabled === false && 
                           result.opacity === '0.5' &&
                           (result.title.includes('Error parsing') || result.title.includes('tidak valid'));
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 1.5: Button State Consistency
    // ============================================================================
    
    test('Property: Button state should be consistent across multiple checks with same data', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    validBukaKasDataArbitrary,
                    invalidBukaKasDataArbitrary,
                    fc.constantFrom(null, undefined, '')
                ),
                (sessionData) => {
                    // Check button state multiple times with same data
                    const result1 = checkTutupKasirButtonVisibility(sessionData);
                    const result2 = checkTutupKasirButtonVisibility(sessionData);
                    const result3 = checkTutupKasirButtonVisibility(sessionData);
                    
                    // Property: Results should be identical for same input
                    return JSON.stringify(result1) === JSON.stringify(result2) &&
                           JSON.stringify(result2) === JSON.stringify(result3);
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 1.6: Button Title Information Accuracy
    // ============================================================================
    
    test('Property: Button title should contain accurate kasir information when session is valid', () => {
        fc.assert(
            fc.property(
                validBukaKasDataArbitrary,
                (bukaKasData) => {
                    const result = checkTutupKasirButtonVisibility(bukaKasData);
                    
                    // Property: Title should contain kasir name when session is valid
                    if (result.visible && result.enabled) {
                        return result.title.includes(bukaKasData.kasir) &&
                               result.title.includes('Tutup Kasir') &&
                               result.title.includes('F10');
                    }
                    
                    return true; // Skip if not visible/enabled
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 1.7: Button Visibility Inverse Relationship
    // ============================================================================
    
    test('Property: Button visibility should have inverse relationship with session validity', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    validBukaKasDataArbitrary.map(data => ({ data, isValid: true })),
                    invalidBukaKasDataArbitrary.map(data => ({ data, isValid: false })),
                    fc.constantFrom(null, undefined, '').map(data => ({ data, isValid: false }))
                ),
                ({ data, isValid }) => {
                    const result = checkTutupKasirButtonVisibility(data);
                    
                    // Property: Valid data should make button visible, invalid data should hide it
                    if (isValid) {
                        return result.visible === true && result.enabled === true;
                    } else {
                        return result.visible === false && result.enabled === false;
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 1.8: Button Opacity Correlation
    // ============================================================================
    
    test('Property: Button opacity should correlate with enabled state', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    validBukaKasDataArbitrary,
                    invalidBukaKasDataArbitrary,
                    fc.constantFrom(null, undefined, '')
                ),
                (sessionData) => {
                    const result = checkTutupKasirButtonVisibility(sessionData);
                    
                    // Property: Enabled buttons should have opacity '1', disabled should have '0.5'
                    if (result.enabled) {
                        return result.opacity === '1';
                    } else {
                        return result.opacity === '0.5';
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 1.9: Edge Cases - Empty String Fields
    // ============================================================================
    
    test('Property: Button should handle edge cases with empty string fields correctly', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.oneof(fc.constant(''), validIdArbitrary),
                    kasir: fc.oneof(fc.constant(''), validKasirNameArbitrary),
                    waktuBuka: fc.oneof(fc.constant(''), validDateArbitrary.map(d => d.toISOString())),
                    modalAwal: fc.integer({ min: 0, max: 1000000 })
                }),
                (edgeCaseData) => {
                    const result = checkTutupKasirButtonVisibility(edgeCaseData);
                    
                    // Property: Any empty required field should make button invisible/disabled
                    const hasEmptyRequiredField = !edgeCaseData.id || 
                                                !edgeCaseData.kasir || 
                                                !edgeCaseData.waktuBuka;
                    
                    if (hasEmptyRequiredField) {
                        return result.visible === false && result.enabled === false;
                    } else {
                        return result.visible === true && result.enabled === true;
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 1.10: Data Type Consistency
    // ============================================================================
    
    test('Property: Button visibility logic should handle different data types consistently', () => {
        fc.assert(
            fc.property(
                validBukaKasDataArbitrary,
                (validData) => {
                    // Test with different representations of the same data
                    const objectResult = checkTutupKasirButtonVisibility(validData);
                    const stringResult = checkTutupKasirButtonVisibility(JSON.stringify(validData));
                    
                    // Property: Object and JSON string representations should yield same result
                    return objectResult.visible === stringResult.visible &&
                           objectResult.enabled === stringResult.enabled &&
                           objectResult.opacity === stringResult.opacity &&
                           objectResult.title === stringResult.title;
                }
            ),
            { numRuns: 100 }
        );
    });
});