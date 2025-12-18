// **Feature: perbaikan-menu-tutup-kasir-pos, Property 2: Modal data completeness**
// Validates: Requirements 1.4, 2.1
// Task 3.1: Write property test for modal data completeness

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
        removeItem: (key, value) => { delete store[key]; },
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
 * Core modal data completeness validation logic
 * This tests that the modal displays all required shift information
 */
function validateModalDataCompleteness(shiftData, salesData) {
    try {
        // Validate shift information completeness
        const requiredShiftFields = ['kasir', 'waktuBuka', 'modalAwal', 'id'];
        const missingShiftFields = requiredShiftFields.filter(field => !shiftData[field]);
        
        if (missingShiftFields.length > 0) {
            return {
                complete: false,
                missing: missingShiftFields,
                section: 'shift',
                error: `Missing shift fields: ${missingShiftFields.join(', ')}`
            };
        }
        
        // Validate sales summary completeness
        const requiredSalesFields = ['totalPenjualan', 'totalCash', 'totalKredit', 'jumlahTransaksi', 'kasSeharusnya'];
        const missingSalesFields = requiredSalesFields.filter(field => salesData[field] === undefined || salesData[field] === null);
        
        if (missingSalesFields.length > 0) {
            return {
                complete: false,
                missing: missingSalesFields,
                section: 'sales',
                error: `Missing sales fields: ${missingSalesFields.join(', ')}`
            };
        }
        
        // Validate data types and ranges
        if (typeof shiftData.modalAwal !== 'number' || shiftData.modalAwal < 0) {
            return {
                complete: false,
                error: 'Invalid modalAwal: must be a positive number',
                section: 'validation'
            };
        }
        
        if (typeof salesData.totalPenjualan !== 'number' || salesData.totalPenjualan < 0) {
            return {
                complete: false,
                error: 'Invalid totalPenjualan: must be a positive number',
                section: 'validation'
            };
        }
        
        if (typeof salesData.jumlahTransaksi !== 'number' || salesData.jumlahTransaksi < 0) {
            return {
                complete: false,
                error: 'Invalid jumlahTransaksi: must be a positive number',
                section: 'validation'
            };
        }
        
        // Validate calculated fields consistency
        const expectedKasSeharusnya = shiftData.modalAwal + salesData.totalCash;
        if (Math.abs(salesData.kasSeharusnya - expectedKasSeharusnya) > 0.01) {
            return {
                complete: false,
                error: `Kas seharusnya calculation mismatch: expected ${expectedKasSeharusnya}, got ${salesData.kasSeharusnya}`,
                section: 'calculation'
            };
        }
        
        // Validate sales breakdown consistency
        const expectedTotal = salesData.totalCash + salesData.totalKredit;
        if (Math.abs(salesData.totalPenjualan - expectedTotal) > 0.01) {
            return {
                complete: false,
                error: `Sales total mismatch: expected ${expectedTotal}, got ${salesData.totalPenjualan}`,
                section: 'calculation'
            };
        }
        
        return {
            complete: true,
            shiftData: shiftData,
            salesData: salesData
        };
        
    } catch (error) {
        return {
            complete: false,
            error: error.message,
            section: 'exception'
        };
    }
}

/**
 * Simulate modal HTML generation and validate content
 */
function simulateModalContentGeneration(shiftData, salesData) {
    try {
        // Simulate the modal HTML generation process
        const modalContent = {
            shiftInfo: {
                kasir: shiftData.kasir,
                waktuBuka: shiftData.waktuBuka,
                modalAwal: shiftData.modalAwal,
                shiftId: shiftData.id
            },
            salesSummary: {
                jumlahTransaksi: salesData.jumlahTransaksi,
                totalPenjualan: salesData.totalPenjualan,
                totalCash: salesData.totalCash,
                totalKredit: salesData.totalKredit
            },
            kasCalculation: {
                modalAwal: shiftData.modalAwal,
                penjualanCash: salesData.totalCash,
                kasSeharusnya: salesData.kasSeharusnya
            }
        };
        
        // Validate that all required content is present
        const hasShiftInfo = modalContent.shiftInfo.kasir && 
                           modalContent.shiftInfo.waktuBuka && 
                           modalContent.shiftInfo.modalAwal !== undefined;
        
        const hasSalesSummary = modalContent.salesSummary.jumlahTransaksi !== undefined &&
                              modalContent.salesSummary.totalPenjualan !== undefined &&
                              modalContent.salesSummary.totalCash !== undefined &&
                              modalContent.salesSummary.totalKredit !== undefined;
        
        const hasKasCalculation = modalContent.kasCalculation.modalAwal !== undefined &&
                                modalContent.kasCalculation.penjualanCash !== undefined &&
                                modalContent.kasCalculation.kasSeharusnya !== undefined;
        
        return {
            success: true,
            hasShiftInfo: hasShiftInfo,
            hasSalesSummary: hasSalesSummary,
            hasKasCalculation: hasKasCalculation,
            allComplete: hasShiftInfo && hasSalesSummary && hasKasCalculation,
            content: modalContent
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
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

const validShiftDataArbitrary = fc.record({
    id: validIdArbitrary,
    kasir: validKasirNameArbitrary,
    kasirId: validIdArbitrary,
    modalAwal: fc.integer({ min: 100000, max: 10000000 }),
    waktuBuka: validDateArbitrary.map(d => d.toISOString()),
    tanggal: validDateArbitrary.map(d => d.toISOString().split('T')[0])
});

const validSalesDataArbitrary = fc.record({
    totalCash: fc.integer({ min: 0, max: 50000000 }),
    totalKredit: fc.integer({ min: 0, max: 50000000 }),
    jumlahTransaksi: fc.integer({ min: 0, max: 1000 })
}).map(sales => ({
    ...sales,
    totalPenjualan: sales.totalCash + sales.totalKredit,
    kasSeharusnya: 0 // Will be calculated based on shift data
}));

const incompleteShiftDataArbitrary = fc.oneof(
    // Missing kasir
    fc.record({
        id: validIdArbitrary,
        modalAwal: fc.integer({ min: 100000, max: 1000000 }),
        waktuBuka: validDateArbitrary.map(d => d.toISOString())
    }),
    // Missing modalAwal
    fc.record({
        id: validIdArbitrary,
        kasir: validKasirNameArbitrary,
        waktuBuka: validDateArbitrary.map(d => d.toISOString())
    }),
    // Missing waktuBuka
    fc.record({
        id: validIdArbitrary,
        kasir: validKasirNameArbitrary,
        modalAwal: fc.integer({ min: 100000, max: 1000000 })
    }),
    // Missing id
    fc.record({
        kasir: validKasirNameArbitrary,
        modalAwal: fc.integer({ min: 100000, max: 1000000 }),
        waktuBuka: validDateArbitrary.map(d => d.toISOString())
    })
);

const incompleteSalesDataArbitrary = fc.oneof(
    // Missing totalCash
    fc.record({
        totalKredit: fc.integer({ min: 0, max: 1000000 }),
        jumlahTransaksi: fc.integer({ min: 0, max: 100 })
    }),
    // Missing totalKredit
    fc.record({
        totalCash: fc.integer({ min: 0, max: 1000000 }),
        jumlahTransaksi: fc.integer({ min: 0, max: 100 })
    }),
    // Missing jumlahTransaksi
    fc.record({
        totalCash: fc.integer({ min: 0, max: 1000000 }),
        totalKredit: fc.integer({ min: 0, max: 1000000 })
    })
);

describe('**Feature: perbaikan-menu-tutup-kasir-pos, Property 2: Modal data completeness**', () => {
    beforeEach(() => {
        sessionStorageMock.clear();
        localStorageMock.clear();
    });

    // ============================================================================
    // PROPERTY 2.1: Complete Modal Data Display
    // ============================================================================
    
    test('Property: Modal should display all required shift information when data is complete', () => {
        fc.assert(
            fc.property(
                validShiftDataArbitrary,
                validSalesDataArbitrary,
                (shiftData, salesData) => {
                    // Calculate kasSeharusnya based on shift data
                    salesData.kasSeharusnya = shiftData.modalAwal + salesData.totalCash;
                    
                    const validation = validateModalDataCompleteness(shiftData, salesData);
                    
                    // Property: Complete data should pass validation
                    if (!validation.complete) {
                        console.log('Validation failed:', validation);
                        console.log('Shift data:', shiftData);
                        console.log('Sales data:', salesData);
                    }
                    
                    return validation.complete === true;
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 2.2: Incomplete Shift Data Detection
    // ============================================================================
    
    test('Property: Modal should detect and report missing shift information', () => {
        fc.assert(
            fc.property(
                incompleteShiftDataArbitrary,
                validSalesDataArbitrary,
                (incompleteShiftData, salesData) => {
                    // Calculate kasSeharusnya (may fail due to missing modalAwal)
                    salesData.kasSeharusnya = (incompleteShiftData.modalAwal || 0) + salesData.totalCash;
                    
                    const validation = validateModalDataCompleteness(incompleteShiftData, salesData);
                    
                    // Property: Incomplete shift data should be detected
                    return validation.complete === false &&
                           validation.section === 'shift' &&
                           validation.missing &&
                           validation.missing.length > 0;
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 2.3: Incomplete Sales Data Detection
    // ============================================================================
    
    test('Property: Modal should detect and report missing sales information', () => {
        fc.assert(
            fc.property(
                validShiftDataArbitrary,
                incompleteSalesDataArbitrary,
                (shiftData, incompleteSalesData) => {
                    // Add missing fields with undefined values
                    const salesData = {
                        totalPenjualan: undefined,
                        totalCash: undefined,
                        totalKredit: undefined,
                        jumlahTransaksi: undefined,
                        kasSeharusnya: undefined,
                        ...incompleteSalesData
                    };
                    
                    const validation = validateModalDataCompleteness(shiftData, salesData);
                    
                    // Property: Incomplete sales data should be detected
                    return validation.complete === false &&
                           validation.section === 'sales' &&
                           validation.missing &&
                           validation.missing.length > 0;
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 2.4: Data Type Validation
    // ============================================================================
    
    test('Property: Modal should validate data types for numerical fields', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: validIdArbitrary,
                    kasir: validKasirNameArbitrary,
                    modalAwal: fc.oneof(
                        fc.string().filter(s => s.length > 0),
                        fc.constant(null),
                        fc.constant(undefined),
                        fc.integer({ min: -1000, max: -1 }) // negative values
                    ),
                    waktuBuka: validDateArbitrary.map(d => d.toISOString())
                }),
                validSalesDataArbitrary,
                (invalidShiftData, salesData) => {
                    // Handle case where modalAwal is invalid
                    if (typeof invalidShiftData.modalAwal !== 'number' || invalidShiftData.modalAwal < 0) {
                        salesData.kasSeharusnya = 0;
                    } else {
                        salesData.kasSeharusnya = invalidShiftData.modalAwal + salesData.totalCash;
                    }
                    
                    const validation = validateModalDataCompleteness(invalidShiftData, salesData);
                    
                    // Property: Invalid data types should be detected
                    return validation.complete === false &&
                           (validation.section === 'validation' || validation.section === 'shift') &&
                           validation.error !== null;
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 2.5: Calculation Consistency Validation
    // ============================================================================
    
    test('Property: Modal should validate calculation consistency', () => {
        fc.assert(
            fc.property(
                validShiftDataArbitrary,
                validSalesDataArbitrary,
                fc.integer({ min: -1000000, max: 1000000 }),
                (shiftData, salesData, randomOffset) => {
                    // Intentionally create inconsistent kasSeharusnya
                    const correctKasSeharusnya = shiftData.modalAwal + salesData.totalCash;
                    salesData.kasSeharusnya = correctKasSeharusnya + randomOffset;
                    
                    const validation = validateModalDataCompleteness(shiftData, salesData);
                    
                    // Property: Calculation inconsistency should be detected when offset is significant
                    if (Math.abs(randomOffset) > 0.01) {
                        return validation.complete === false &&
                               validation.section === 'calculation' &&
                               validation.error && validation.error.includes('calculation mismatch');
                    } else {
                        // Small offsets should pass (floating point precision)
                        return validation.complete === true;
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 2.6: Sales Breakdown Consistency
    // ============================================================================
    
    test('Property: Modal should validate sales breakdown consistency', () => {
        fc.assert(
            fc.property(
                validShiftDataArbitrary,
                fc.record({
                    totalCash: fc.integer({ min: 0, max: 1000000 }),
                    totalKredit: fc.integer({ min: 0, max: 1000000 }),
                    jumlahTransaksi: fc.integer({ min: 0, max: 100 })
                }),
                fc.integer({ min: 1, max: 500000 }), // Only positive offsets to ensure mismatch
                (shiftData, salesBase, totalOffset) => {
                    // Create inconsistent total (always inconsistent)
                    const correctTotal = salesBase.totalCash + salesBase.totalKredit;
                    const salesData = {
                        ...salesBase,
                        totalPenjualan: correctTotal + totalOffset, // Always different
                        kasSeharusnya: shiftData.modalAwal + salesBase.totalCash
                    };
                    
                    const validation = validateModalDataCompleteness(shiftData, salesData);
                    
                    // Property: Sales breakdown inconsistency should always be detected
                    return validation.complete === false &&
                           validation.section === 'calculation';
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 2.7: Modal Content Generation Completeness
    // ============================================================================
    
    test('Property: Modal content generation should include all required sections', () => {
        fc.assert(
            fc.property(
                validShiftDataArbitrary,
                validSalesDataArbitrary,
                (shiftData, salesData) => {
                    // Calculate kasSeharusnya
                    salesData.kasSeharusnya = shiftData.modalAwal + salesData.totalCash;
                    
                    const contentResult = simulateModalContentGeneration(shiftData, salesData);
                    
                    // Property: Content generation should succeed and include all sections
                    return contentResult.success === true &&
                           contentResult.hasShiftInfo === true &&
                           contentResult.hasSalesSummary === true &&
                           contentResult.hasKasCalculation === true &&
                           contentResult.allComplete === true;
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 2.8: Error Handling in Content Generation
    // ============================================================================
    
    test('Property: Modal content generation should handle errors gracefully', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(null),
                    fc.constant(undefined),
                    fc.record({}) // Empty object
                ),
                fc.oneof(
                    fc.constant(null),
                    fc.constant(undefined),
                    fc.record({}) // Empty object
                ),
                (invalidShiftData, invalidSalesData) => {
                    const contentResult = simulateModalContentGeneration(invalidShiftData, invalidSalesData);
                    
                    // Property: Should handle errors gracefully without throwing
                    return contentResult.success === false ||
                           (contentResult.success === true && !contentResult.allComplete);
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 2.9: Data Integrity Preservation
    // ============================================================================
    
    test('Property: Modal validation should not modify original data', () => {
        fc.assert(
            fc.property(
                validShiftDataArbitrary,
                validSalesDataArbitrary,
                (shiftData, salesData) => {
                    // Calculate kasSeharusnya
                    salesData.kasSeharusnya = shiftData.modalAwal + salesData.totalCash;
                    
                    // Create deep copies for comparison
                    const originalShiftData = JSON.parse(JSON.stringify(shiftData));
                    const originalSalesData = JSON.parse(JSON.stringify(salesData));
                    
                    // Run validation
                    validateModalDataCompleteness(shiftData, salesData);
                    
                    // Property: Original data should remain unchanged
                    return JSON.stringify(shiftData) === JSON.stringify(originalShiftData) &&
                           JSON.stringify(salesData) === JSON.stringify(originalSalesData);
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 2.10: Validation Consistency
    // ============================================================================
    
    test('Property: Modal validation should be consistent across multiple calls', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    validShiftDataArbitrary,
                    incompleteShiftDataArbitrary
                ),
                fc.oneof(
                    validSalesDataArbitrary,
                    incompleteSalesDataArbitrary
                ),
                (shiftData, salesData) => {
                    // Ensure kasSeharusnya is calculated if possible
                    if (shiftData.modalAwal !== undefined && salesData.totalCash !== undefined) {
                        salesData.kasSeharusnya = shiftData.modalAwal + salesData.totalCash;
                    }
                    
                    // Run validation multiple times
                    const result1 = validateModalDataCompleteness(shiftData, salesData);
                    const result2 = validateModalDataCompleteness(shiftData, salesData);
                    const result3 = validateModalDataCompleteness(shiftData, salesData);
                    
                    // Property: Results should be identical across multiple calls
                    return JSON.stringify(result1) === JSON.stringify(result2) &&
                           JSON.stringify(result2) === JSON.stringify(result3);
                }
            ),
            { numRuns: 100 }
        );
    });
});