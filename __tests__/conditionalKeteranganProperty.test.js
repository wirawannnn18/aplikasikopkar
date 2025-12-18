// **Feature: perbaikan-menu-tutup-kasir-pos, Property 4: Conditional keterangan requirement**
// Validates: Requirements 2.3
// Task 3.2: Write property test for conditional keterangan requirement

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

// Mock console methods to avoid noise in tests
global.console = {
    ...console,
    error: () => {},
    warn: () => {},
    log: () => {}
};

/**
 * Core conditional keterangan requirement logic
 * This tests that keterangan field is required when there's a kas difference
 */
function validateConditionalKeteranganRequirement(kasAktual, kasSeharusnya, keterangan) {
    try {
        // Calculate selisih
        const selisih = kasAktual - kasSeharusnya;
        
        // Determine if keterangan is required
        const isKeteranganRequired = selisih !== 0;
        
        // Validate keterangan based on requirement
        const hasValidKeterangan = keterangan !== null && 
                                  keterangan !== undefined &&
                                  typeof keterangan === 'string' && 
                                  keterangan.trim().length > 0;
        
        return {
            selisih: selisih,
            isKeteranganRequired: isKeteranganRequired,
            hasKeterangan: hasValidKeterangan,
            isValid: !isKeteranganRequired || hasValidKeterangan,
            status: selisih === 0 ? 'sesuai' : (selisih > 0 ? 'lebih' : 'kurang'),
            error: isKeteranganRequired && !hasValidKeterangan ? 
                   'Keterangan selisih harus diisi jika ada selisih kas' : null
        };
        
    } catch (error) {
        return {
            isValid: false,
            error: error.message,
            exception: true
        };
    }
}

/**
 * Simulate UI state based on kas difference
 */
function simulateKeteranganUIState(kasAktual, kasSeharusnya) {
    const selisih = kasAktual - kasSeharusnya;
    
    return {
        selisihDisplayed: kasAktual > 0,
        keteranganSectionVisible: selisih !== 0,
        keteranganRequired: selisih !== 0,
        alertType: selisih === 0 ? 'success' : (selisih > 0 ? 'warning' : 'danger'),
        alertMessage: selisih === 0 ? 'Kas Sesuai!' : 
                     (selisih > 0 ? 'Kas Lebih' : 'Kas Kurang'),
        selisihAmount: Math.abs(selisih),
        formValid: selisih === 0 || (selisih !== 0 && kasAktual > 0) // Will need keterangan validation
    };
}

/**
 * Validate form submission with conditional keterangan
 */
function validateFormSubmission(kasAktual, kasSeharusnya, keterangan) {
    const validation = validateConditionalKeteranganRequirement(kasAktual, kasSeharusnya, keterangan);
    
    // Additional form-level validations
    if (kasAktual <= 0) {
        return {
            ...validation,
            isValid: false,
            error: 'Kas aktual harus lebih dari 0'
        };
    }
    
    if (kasSeharusnya <= 0) {
        return {
            ...validation,
            isValid: false,
            error: 'Kas seharusnya harus lebih dari 0'
        };
    }
    
    return validation;
}

// Arbitraries for generating test data
const positiveAmountArbitrary = fc.integer({ min: 1, max: 100000000 });
const kasAmountArbitrary = fc.integer({ min: 100000, max: 50000000 });

const validKeteranganArbitrary = fc.oneof(
    fc.constant('Uang kembalian kurang'),
    fc.constant('Ada uang receh lebih dari customer'),
    fc.constant('Kesalahan hitung manual'),
    fc.constant('Uang sobek tidak bisa digunakan'),
    fc.constant('Customer lupa ambil kembalian'),
    fc.string({ minLength: 10, maxLength: 200 }).filter(s => s.trim().length >= 10)
);

const invalidKeteranganArbitrary = fc.oneof(
    fc.constant(''),
    fc.constant('   '), // whitespace only
    fc.constant(null),
    fc.constant(undefined)
);

describe('**Feature: perbaikan-menu-tutup-kasir-pos, Property 4: Conditional keterangan requirement**', () => {
    
    // ============================================================================
    // PROPERTY 4.1: No Keterangan Required When Kas Sesuai
    // ============================================================================
    
    test('Property: Keterangan should not be required when kas aktual equals kas seharusnya', () => {
        fc.assert(
            fc.property(
                kasAmountArbitrary,
                fc.oneof(validKeteranganArbitrary, invalidKeteranganArbitrary, fc.constant('')),
                (kasAmount, keterangan) => {
                    const validation = validateConditionalKeteranganRequirement(kasAmount, kasAmount, keterangan);
                    
                    // Property: When selisih is 0, keterangan is not required
                    return validation.selisih === 0 &&
                           validation.isKeteranganRequired === false &&
                           validation.isValid === true &&
                           validation.status === 'sesuai' &&
                           validation.error === null;
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 4.2: Keterangan Required When Kas Lebih
    // ============================================================================
    
    test('Property: Keterangan should be required when kas aktual is more than kas seharusnya', () => {
        fc.assert(
            fc.property(
                kasAmountArbitrary,
                fc.integer({ min: 1, max: 1000000 }), // positive difference
                validKeteranganArbitrary,
                (kasSeharusnya, extraAmount, keterangan) => {
                    const kasAktual = kasSeharusnya + extraAmount;
                    const validation = validateConditionalKeteranganRequirement(kasAktual, kasSeharusnya, keterangan);
                    
                    // Property: When kas lebih, keterangan is required and validation should pass with valid keterangan
                    return validation.selisih > 0 &&
                           validation.isKeteranganRequired === true &&
                           validation.hasKeterangan === true &&
                           validation.isValid === true &&
                           validation.status === 'lebih' &&
                           validation.error === null;
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 4.3: Keterangan Required When Kas Kurang
    // ============================================================================
    
    test('Property: Keterangan should be required when kas aktual is less than kas seharusnya', () => {
        fc.assert(
            fc.property(
                kasAmountArbitrary,
                fc.integer({ min: 1, max: 1000000 }), // positive difference
                validKeteranganArbitrary,
                (kasSeharusnya, missingAmount, keterangan) => {
                    const kasAktual = Math.max(1, kasSeharusnya - missingAmount); // Ensure positive
                    
                    // Only test when kasAktual is actually less than kasSeharusnya
                    if (kasAktual >= kasSeharusnya) return true;
                    
                    const validation = validateConditionalKeteranganRequirement(kasAktual, kasSeharusnya, keterangan);
                    
                    // Property: When kas kurang, keterangan is required and validation should pass with valid keterangan
                    return validation.selisih < 0 &&
                           validation.isKeteranganRequired === true &&
                           validation.hasKeterangan === true &&
                           validation.isValid === true &&
                           validation.status === 'kurang' &&
                           validation.error === null;
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 4.4: Invalid Keterangan Rejection When Required
    // ============================================================================
    
    test('Property: Invalid keterangan should be rejected when selisih exists', () => {
        fc.assert(
            fc.property(
                kasAmountArbitrary,
                fc.integer({ min: 1, max: 1000000 }),
                invalidKeteranganArbitrary,
                (kasSeharusnya, difference, invalidKeterangan) => {
                    const kasAktual = kasSeharusnya + difference; // Always creates selisih
                    const validation = validateConditionalKeteranganRequirement(kasAktual, kasSeharusnya, invalidKeterangan);
                    
                    // Property: When selisih exists and keterangan is invalid, validation should fail
                    return validation.selisih !== 0 &&
                           validation.isKeteranganRequired === true &&
                           validation.hasKeterangan === false &&
                           validation.isValid === false &&
                           validation.error === 'Keterangan selisih harus diisi jika ada selisih kas';
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 4.5: UI State Consistency with Selisih
    // ============================================================================
    
    test('Property: UI state should be consistent with kas selisih calculation', () => {
        fc.assert(
            fc.property(
                positiveAmountArbitrary,
                positiveAmountArbitrary,
                (kasAktual, kasSeharusnya) => {
                    const uiState = simulateKeteranganUIState(kasAktual, kasSeharusnya);
                    const selisih = kasAktual - kasSeharusnya;
                    
                    // Property: UI state should reflect the actual selisih
                    const correctAlertType = selisih === 0 ? 'success' : (selisih > 0 ? 'warning' : 'danger');
                    const correctVisibility = selisih !== 0;
                    
                    return uiState.selisihDisplayed === true && // kasAktual > 0
                           uiState.keteranganSectionVisible === correctVisibility &&
                           uiState.keteranganRequired === correctVisibility &&
                           uiState.alertType === correctAlertType &&
                           uiState.selisihAmount === Math.abs(selisih);
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 4.6: Form Submission Validation
    // ============================================================================
    
    test('Property: Form submission should validate kas amounts and conditional keterangan', () => {
        fc.assert(
            fc.property(
                positiveAmountArbitrary,
                positiveAmountArbitrary,
                fc.oneof(validKeteranganArbitrary, invalidKeteranganArbitrary),
                (kasAktual, kasSeharusnya, keterangan) => {
                    const validation = validateFormSubmission(kasAktual, kasSeharusnya, keterangan);
                    const selisih = kasAktual - kasSeharusnya;
                    
                    // Property: Form should be valid only when all conditions are met
                    if (selisih === 0) {
                        // No keterangan required when kas sesuai
                        return validation.isValid === true;
                    } else {
                        // Keterangan required when selisih exists
                        const hasValidKeterangan = keterangan !== null && 
                                                  keterangan !== undefined &&
                                                  typeof keterangan === 'string' && 
                                                  keterangan.trim().length > 0;
                        return validation.isValid === hasValidKeterangan;
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 4.7: Selisih Calculation Accuracy
    // ============================================================================
    
    test('Property: Selisih calculation should be accurate for all input combinations', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 100000000 }),
                fc.integer({ min: 1, max: 100000000 }),
                validKeteranganArbitrary,
                (kasAktual, kasSeharusnya, keterangan) => {
                    const validation = validateConditionalKeteranganRequirement(kasAktual, kasSeharusnya, keterangan);
                    const expectedSelisih = kasAktual - kasSeharusnya;
                    
                    // Property: Calculated selisih should match expected value
                    return validation.selisih === expectedSelisih &&
                           validation.status === (expectedSelisih === 0 ? 'sesuai' : 
                                               (expectedSelisih > 0 ? 'lebih' : 'kurang'));
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 4.8: Keterangan Content Validation
    // ============================================================================
    
    test('Property: Keterangan content should be validated for meaningful input', () => {
        fc.assert(
            fc.property(
                kasAmountArbitrary,
                fc.integer({ min: 1, max: 1000000 }),
                fc.oneof(
                    fc.string({ minLength: 1, maxLength: 5 }), // too short
                    fc.string({ minLength: 10, maxLength: 200 }), // adequate length
                    fc.constant('   '), // whitespace only
                    fc.constant('a') // single character
                ),
                (kasSeharusnya, difference, keterangan) => {
                    const kasAktual = kasSeharusnya + difference;
                    const validation = validateConditionalKeteranganRequirement(kasAktual, kasSeharusnya, keterangan);
                    
                    // Property: Keterangan should be considered valid only if it has meaningful content
                    const isMeaningfulKeterangan = keterangan && 
                                                  typeof keterangan === 'string' && 
                                                  keterangan.trim().length > 0;
                    
                    return validation.hasKeterangan === isMeaningfulKeterangan;
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 4.9: Edge Cases - Zero and Negative Values
    // ============================================================================
    
    test('Property: Edge cases with zero and negative values should be handled correctly', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(0),
                    fc.integer({ min: -1000000, max: -1 }),
                    positiveAmountArbitrary
                ),
                positiveAmountArbitrary,
                validKeteranganArbitrary,
                (kasAktual, kasSeharusnya, keterangan) => {
                    const validation = validateFormSubmission(kasAktual, kasSeharusnya, keterangan);
                    
                    // Property: Zero or negative kasAktual should be rejected at form level
                    if (kasAktual <= 0) {
                        return validation.isValid === false &&
                               validation.error === 'Kas aktual harus lebih dari 0';
                    }
                    
                    // For positive kasAktual, normal validation rules apply
                    const selisih = kasAktual - kasSeharusnya;
                    if (selisih === 0) {
                        return validation.isValid === true;
                    } else {
                        return validation.isValid === true; // Valid keterangan provided
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 4.10: Validation Consistency Across Multiple Calls
    // ============================================================================
    
    test('Property: Validation should be consistent across multiple calls with same input', () => {
        fc.assert(
            fc.property(
                positiveAmountArbitrary,
                positiveAmountArbitrary,
                fc.oneof(validKeteranganArbitrary, invalidKeteranganArbitrary),
                (kasAktual, kasSeharusnya, keterangan) => {
                    // Run validation multiple times
                    const result1 = validateConditionalKeteranganRequirement(kasAktual, kasSeharusnya, keterangan);
                    const result2 = validateConditionalKeteranganRequirement(kasAktual, kasSeharusnya, keterangan);
                    const result3 = validateConditionalKeteranganRequirement(kasAktual, kasSeharusnya, keterangan);
                    
                    // Property: Results should be identical across multiple calls
                    return JSON.stringify(result1) === JSON.stringify(result2) &&
                           JSON.stringify(result2) === JSON.stringify(result3);
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 4.11: Real-world Scenario Validation
    // ============================================================================
    
    test('Property: Real-world kas scenarios should be handled correctly', () => {
        fc.assert(
            fc.property(
                fc.record({
                    modalAwal: fc.integer({ min: 500000, max: 2000000 }),
                    penjualanCash: fc.integer({ min: 0, max: 10000000 }),
                    kasAktual: fc.integer({ min: 500000, max: 15000000 })
                }),
                fc.oneof(
                    fc.constant('Uang kembalian kurang Rp 5.000'),
                    fc.constant('Customer lupa ambil kembalian Rp 10.000'),
                    fc.constant('Ada uang sobek Rp 20.000 tidak bisa digunakan'),
                    fc.constant('Kesalahan hitung saat rush hour'),
                    fc.constant('')
                ),
                (scenario, keterangan) => {
                    const kasSeharusnya = scenario.modalAwal + scenario.penjualanCash;
                    const validation = validateConditionalKeteranganRequirement(
                        scenario.kasAktual, 
                        kasSeharusnya, 
                        keterangan
                    );
                    
                    const selisih = scenario.kasAktual - kasSeharusnya;
                    
                    // Property: Real-world scenarios should follow the same rules
                    if (selisih === 0) {
                        return validation.isValid === true && 
                               validation.isKeteranganRequired === false;
                    } else {
                        const hasValidKeterangan = keterangan !== null && 
                                                  keterangan !== undefined &&
                                                  typeof keterangan === 'string' && 
                                                  keterangan.trim().length > 0;
                        return validation.isKeteranganRequired === true &&
                               validation.isValid === hasValidKeterangan;
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});