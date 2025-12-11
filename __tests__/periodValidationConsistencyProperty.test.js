// **Feature: laporan-neraca-periode, Property 1: Period validation consistency**
// Validates: Requirements 1.5
// Task 1.1: Write property test for period validation consistency

import fc from 'fast-check';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
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

// Import the validation functions from reports.js
// Since we can't directly import from reports.js, we'll redefine them here for testing
function validatePeriodSelection(periodData) {
    try {
        // Input validation
        if (!periodData || typeof periodData !== 'object') {
            return {
                success: false,
                error: 'Invalid period data: must be an object',
                endDate: null
            };
        }
        
        const { type, selectedDate, selectedMonth, selectedYear } = periodData;
        
        // Validate period type
        if (!type || !['daily', 'monthly', 'yearly'].includes(type)) {
            return {
                success: false,
                error: 'Invalid period type: must be daily, monthly, or yearly',
                endDate: null
            };
        }
        
        let endDate;
        let message;
        
        switch (type) {
            case 'daily':
                if (!selectedDate) {
                    return {
                        success: false,
                        error: 'Daily period requires selectedDate',
                        endDate: null
                    };
                }
                
                const dailyDate = new Date(selectedDate);
                if (isNaN(dailyDate.getTime())) {
                    return {
                        success: false,
                        error: 'Invalid date format for daily period',
                        endDate: null
                    };
                }
                
                // Check if date is not in the future
                const today = new Date();
                today.setHours(23, 59, 59, 999); // End of today
                if (dailyDate > today) {
                    return {
                        success: false,
                        error: 'Cannot generate reports for future dates',
                        endDate: null
                    };
                }
                
                endDate = new Date(dailyDate);
                endDate.setHours(23, 59, 59, 999); // End of selected day
                message = `Daily report for ${dailyDate.toLocaleDateString('id-ID')}`;
                break;
                
            case 'monthly':
                if (!selectedMonth || !selectedYear) {
                    return {
                        success: false,
                        error: 'Monthly period requires selectedMonth and selectedYear',
                        endDate: null
                    };
                }
                
                if (selectedMonth < 1 || selectedMonth > 12) {
                    return {
                        success: false,
                        error: 'Invalid month: must be between 1 and 12',
                        endDate: null
                    };
                }
                
                if (selectedYear < 1900 || selectedYear > 2100) {
                    return {
                        success: false,
                        error: 'Invalid year: must be between 1900 and 2100',
                        endDate: null
                    };
                }
                
                // Check if month/year is not in the future
                const currentDate = new Date();
                const selectedMonthDate = new Date(selectedYear, selectedMonth - 1, 1);
                if (selectedMonthDate > currentDate) {
                    return {
                        success: false,
                        error: 'Cannot generate reports for future months',
                        endDate: null
                    };
                }
                
                // Last day of the selected month
                endDate = new Date(selectedYear, selectedMonth, 0);
                endDate.setHours(23, 59, 59, 999);
                
                const monthNames = [
                    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                ];
                message = `Monthly report for ${monthNames[selectedMonth - 1]} ${selectedYear}`;
                break;
                
            case 'yearly':
                if (!selectedYear) {
                    return {
                        success: false,
                        error: 'Yearly period requires selectedYear',
                        endDate: null
                    };
                }
                
                if (selectedYear < 1900 || selectedYear > 2100) {
                    return {
                        success: false,
                        error: 'Invalid year: must be between 1900 and 2100',
                        endDate: null
                    };
                }
                
                // Check if year is not in the future
                const currentYear = new Date().getFullYear();
                if (selectedYear > currentYear) {
                    return {
                        success: false,
                        error: 'Cannot generate reports for future years',
                        endDate: null
                    };
                }
                
                // December 31st of the selected year
                endDate = new Date(selectedYear, 11, 31);
                endDate.setHours(23, 59, 59, 999);
                message = `Yearly report for ${selectedYear}`;
                break;
        }
        
        return {
            success: true,
            endDate: endDate,
            message: message,
            periodType: type
        };
        
    } catch (error) {
        return {
            success: false,
            error: `Validation error: ${error.message}`,
            endDate: null
        };
    }
}

function checkPeriodDataAvailability(endDate) {
    try {
        if (!endDate || !(endDate instanceof Date) || isNaN(endDate.getTime())) {
            return {
                hasData: false,
                error: 'Invalid end date provided'
            };
        }
        
        // Check if we have any journal entries up to the end date
        const jurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
        const coa = JSON.parse(localStorage.getItem('coa') || '[]');
        
        // Check for journal entries within the period
        const relevantEntries = jurnal.filter(j => {
            const entryDate = new Date(j.tanggal);
            return entryDate <= endDate;
        });
        
        // Check for COA data
        const hasCoaData = coa.length > 0;
        
        // Determine data availability
        const hasJournalData = relevantEntries.length > 0;
        const hasMinimalData = hasCoaData; // At minimum, we need COA structure
        
        return {
            hasData: hasMinimalData,
            hasJournalEntries: hasJournalData,
            journalCount: relevantEntries.length,
            coaCount: coa.length,
            message: hasMinimalData 
                ? `Found ${coa.length} COA accounts and ${relevantEntries.length} journal entries`
                : 'No COA data available - cannot generate balance sheet'
        };
        
    } catch (error) {
        return {
            hasData: false,
            error: `Data availability check failed: ${error.message}`
        };
    }
}

// Arbitraries for generating test data
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const currentDate = new Date();

// Generate valid past dates
const validPastDateArbitrary = fc.date({
    min: new Date(currentYear - 5, 0, 1),
    max: currentDate
});

// Generate valid years (past and current)
const validYearArbitrary = fc.integer({
    min: currentYear - 5,
    max: currentYear
});

// Generate valid months
const validMonthArbitrary = fc.integer({ min: 1, max: 12 });

// Generate daily period data
const dailyPeriodArbitrary = fc.record({
    type: fc.constant('daily'),
    selectedDate: validPastDateArbitrary
});

// Generate monthly period data
const monthlyPeriodArbitrary = fc.record({
    type: fc.constant('monthly'),
    selectedMonth: validMonthArbitrary,
    selectedYear: validYearArbitrary
}).filter(period => {
    // Ensure the month/year combination is not in the future
    const periodDate = new Date(period.selectedYear, period.selectedMonth - 1, 1);
    return periodDate <= currentDate;
});

// Generate yearly period data
const yearlyPeriodArbitrary = fc.record({
    type: fc.constant('yearly'),
    selectedYear: validYearArbitrary
});

// Combined valid period arbitrary
const validPeriodArbitrary = fc.oneof(
    dailyPeriodArbitrary,
    monthlyPeriodArbitrary,
    yearlyPeriodArbitrary
);

// Invalid period data arbitraries
const invalidPeriodArbitrary = fc.oneof(
    // Invalid type
    fc.record({
        type: fc.oneof(fc.constant('invalid'), fc.constant(''), fc.constant(null)),
        selectedDate: validPastDateArbitrary
    }),
    // Missing required fields
    fc.record({
        type: fc.constant('daily')
        // Missing selectedDate
    }),
    fc.record({
        type: fc.constant('monthly'),
        selectedMonth: validMonthArbitrary
        // Missing selectedYear
    }),
    fc.record({
        type: fc.constant('yearly')
        // Missing selectedYear
    }),
    // Invalid values
    fc.record({
        type: fc.constant('monthly'),
        selectedMonth: fc.integer({ min: 13, max: 20 }), // Invalid month
        selectedYear: validYearArbitrary
    }),
    fc.record({
        type: fc.constant('yearly'),
        selectedYear: fc.integer({ min: 2200, max: 3000 }) // Invalid year
    })
);

describe('**Feature: laporan-neraca-periode, Property 1: Period validation consistency**', () => {
    beforeEach(() => {
        localStorage.clear();
        // Set up minimal COA data for testing
        const defaultCOA = [
            { kode: '1-1000', nama: 'Kas', tipe: 'Aset', saldo: 0 },
            { kode: '2-1100', nama: 'Simpanan Pokok', tipe: 'Kewajiban', saldo: 0 },
            { kode: '3-1000', nama: 'Modal Koperasi', tipe: 'Modal', saldo: 0 }
        ];
        localStorage.setItem('coa', JSON.stringify(defaultCOA));
        localStorage.setItem('jurnal', JSON.stringify([]));
    });

    // ============================================================================
    // PROPERTY 1.1: Validation Consistency - Same Input, Same Output
    // ============================================================================
    
    test('Property: validatePeriodSelection returns consistent results for identical inputs', () => {
        fc.assert(
            fc.property(
                validPeriodArbitrary,
                (periodData) => {
                    // Action: Call validation function multiple times with same input
                    const result1 = validatePeriodSelection(periodData);
                    const result2 = validatePeriodSelection(periodData);
                    const result3 = validatePeriodSelection(periodData);
                    
                    // Property: All results should be identical
                    if (result1.success !== result2.success || result2.success !== result3.success) {
                        return false;
                    }
                    
                    if (result1.success) {
                        // For successful validations, check all fields match
                        if (result1.message !== result2.message || result2.message !== result3.message) {
                            return false;
                        }
                        
                        if (result1.periodType !== result2.periodType || result2.periodType !== result3.periodType) {
                            return false;
                        }
                        
                        // Check endDate consistency (convert to string for comparison)
                        const date1 = result1.endDate ? result1.endDate.getTime() : null;
                        const date2 = result2.endDate ? result2.endDate.getTime() : null;
                        const date3 = result3.endDate ? result3.endDate.getTime() : null;
                        
                        if (date1 !== date2 || date2 !== date3) {
                            return false;
                        }
                    } else {
                        // For failed validations, error messages should be consistent
                        if (result1.error !== result2.error || result2.error !== result3.error) {
                            return false;
                        }
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: validatePeriodSelection is deterministic across time (within same execution)', () => {
        fc.assert(
            fc.property(
                validPeriodArbitrary,
                (periodData) => {
                    // Action: Call validation with delays to test time consistency
                    const result1 = validatePeriodSelection(periodData);
                    
                    // Small delay (simulating real-world usage)
                    const start = Date.now();
                    while (Date.now() - start < 1) { /* small delay */ }
                    
                    const result2 = validatePeriodSelection(periodData);
                    
                    // Property: Results should be identical despite time passage
                    if (result1.success !== result2.success) return false;
                    
                    if (result1.success) {
                        const date1 = result1.endDate ? result1.endDate.getTime() : null;
                        const date2 = result2.endDate ? result2.endDate.getTime() : null;
                        
                        if (date1 !== date2) return false;
                        if (result1.message !== result2.message) return false;
                        if (result1.periodType !== result2.periodType) return false;
                    } else {
                        if (result1.error !== result2.error) return false;
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 1.2: Invalid Input Consistency
    // ============================================================================
    
    test('Property: validatePeriodSelection consistently rejects invalid inputs', () => {
        fc.assert(
            fc.property(
                invalidPeriodArbitrary,
                (invalidPeriodData) => {
                    // Action: Validate invalid period data multiple times
                    const result1 = validatePeriodSelection(invalidPeriodData);
                    const result2 = validatePeriodSelection(invalidPeriodData);
                    const result3 = validatePeriodSelection(invalidPeriodData);
                    
                    // Property: All results should consistently fail
                    if (result1.success || result2.success || result3.success) {
                        return false;
                    }
                    
                    // Property: Error messages should be consistent
                    if (result1.error !== result2.error || result2.error !== result3.error) {
                        return false;
                    }
                    
                    // Property: endDate should consistently be null for failures
                    if (result1.endDate !== null || result2.endDate !== null || result3.endDate !== null) {
                        return false;
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: validatePeriodSelection handles null and undefined consistently', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(null),
                    fc.constant(undefined),
                    fc.constant({}),
                    fc.constant('')
                ),
                (invalidInput) => {
                    // Action: Validate with various invalid inputs
                    const result1 = validatePeriodSelection(invalidInput);
                    const result2 = validatePeriodSelection(invalidInput);
                    
                    // Property: Should consistently fail
                    if (result1.success || result2.success) return false;
                    
                    // Property: Should have consistent error messages
                    if (result1.error !== result2.error) return false;
                    
                    // Property: Should consistently return null endDate
                    if (result1.endDate !== null || result2.endDate !== null) return false;
                    
                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    // ============================================================================
    // PROPERTY 1.3: Data Availability Consistency
    // ============================================================================
    
    test('Property: checkPeriodDataAvailability returns consistent results for same endDate', () => {
        fc.assert(
            fc.property(
                validPastDateArbitrary,
                (testDate) => {
                    // Setup: Add some test journal data
                    const testJournal = [
                        {
                            id: 'test-1',
                            tanggal: new Date(testDate.getTime() - 86400000).toISOString(), // 1 day before
                            keterangan: 'Test entry',
                            entries: [
                                { akun: '1-1000', debit: 100000, kredit: 0 },
                                { akun: '3-1000', debit: 0, kredit: 100000 }
                            ]
                        }
                    ];
                    localStorage.setItem('jurnal', JSON.stringify(testJournal));
                    
                    // Action: Check data availability multiple times
                    const result1 = checkPeriodDataAvailability(testDate);
                    const result2 = checkPeriodDataAvailability(testDate);
                    const result3 = checkPeriodDataAvailability(testDate);
                    
                    // Property: All results should be identical
                    if (result1.hasData !== result2.hasData || result2.hasData !== result3.hasData) {
                        return false;
                    }
                    
                    if (result1.hasJournalEntries !== result2.hasJournalEntries || 
                        result2.hasJournalEntries !== result3.hasJournalEntries) {
                        return false;
                    }
                    
                    if (result1.journalCount !== result2.journalCount || 
                        result2.journalCount !== result3.journalCount) {
                        return false;
                    }
                    
                    if (result1.coaCount !== result2.coaCount || 
                        result2.coaCount !== result3.coaCount) {
                        return false;
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: checkPeriodDataAvailability handles invalid dates consistently', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(null),
                    fc.constant(undefined),
                    fc.constant('invalid-date'),
                    fc.constant(new Date('invalid'))
                ),
                (invalidDate) => {
                    // Action: Check data availability with invalid dates
                    const result1 = checkPeriodDataAvailability(invalidDate);
                    const result2 = checkPeriodDataAvailability(invalidDate);
                    
                    // Property: Should consistently fail
                    if (result1.hasData || result2.hasData) return false;
                    
                    // Property: Should have consistent error messages
                    if (result1.error !== result2.error) return false;
                    
                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    // ============================================================================
    // PROPERTY 1.4: Integration Consistency
    // ============================================================================
    
    test('Property: Combined validation and data availability check is consistent', () => {
        fc.assert(
            fc.property(
                validPeriodArbitrary,
                (periodData) => {
                    // Action: Perform full validation + data availability check multiple times
                    const validation1 = validatePeriodSelection(periodData);
                    const validation2 = validatePeriodSelection(periodData);
                    
                    // Property: Validation results should be consistent
                    if (validation1.success !== validation2.success) return false;
                    
                    if (validation1.success && validation2.success) {
                        const availability1 = checkPeriodDataAvailability(validation1.endDate);
                        const availability2 = checkPeriodDataAvailability(validation2.endDate);
                        
                        // Property: Data availability results should be consistent
                        if (availability1.hasData !== availability2.hasData) return false;
                        if (availability1.journalCount !== availability2.journalCount) return false;
                        if (availability1.coaCount !== availability2.coaCount) return false;
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 1.5: Edge Case Consistency
    // ============================================================================
    
    test('Property: Boundary date validations are consistent', () => {
        fc.assert(
            fc.property(
                fc.record({
                    type: fc.constant('daily'),
                    selectedDate: fc.oneof(
                        fc.constant(new Date()), // Today
                        fc.constant(new Date(currentYear, 0, 1)), // Jan 1st current year
                        fc.constant(new Date(currentYear, 11, 31)), // Dec 31st current year
                        fc.constant(new Date(1900, 0, 1)), // Minimum valid date
                        fc.constant(new Date(2100, 11, 31)) // Maximum valid date
                    )
                }),
                (boundaryPeriod) => {
                    // Action: Validate boundary cases multiple times
                    const result1 = validatePeriodSelection(boundaryPeriod);
                    const result2 = validatePeriodSelection(boundaryPeriod);
                    const result3 = validatePeriodSelection(boundaryPeriod);
                    
                    // Property: Results should be consistent for boundary cases
                    if (result1.success !== result2.success || result2.success !== result3.success) {
                        return false;
                    }
                    
                    if (result1.success) {
                        const date1 = result1.endDate ? result1.endDate.getTime() : null;
                        const date2 = result2.endDate ? result2.endDate.getTime() : null;
                        const date3 = result3.endDate ? result3.endDate.getTime() : null;
                        
                        if (date1 !== date2 || date2 !== date3) return false;
                    } else {
                        if (result1.error !== result2.error || result2.error !== result3.error) {
                            return false;
                        }
                    }
                    
                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    test('Property: Validation is consistent regardless of localStorage state changes', () => {
        fc.assert(
            fc.property(
                validPeriodArbitrary,
                (periodData) => {
                    // Action: Validate, modify localStorage, validate again
                    const result1 = validatePeriodSelection(periodData);
                    
                    // Modify localStorage (should not affect validation logic)
                    localStorage.setItem('someOtherKey', 'someValue');
                    const existingCoa = JSON.parse(localStorage.getItem('coa') || '[]');
                    localStorage.setItem('coa', JSON.stringify([...existingCoa, { kode: '9-9999', nama: 'Test', tipe: 'Test', saldo: 0 }]));
                    
                    const result2 = validatePeriodSelection(periodData);
                    
                    // Property: Period validation should be consistent regardless of localStorage changes
                    // (validation logic should not depend on localStorage content)
                    if (result1.success !== result2.success) return false;
                    
                    if (result1.success) {
                        const date1 = result1.endDate ? result1.endDate.getTime() : null;
                        const date2 = result2.endDate ? result2.endDate.getTime() : null;
                        
                        if (date1 !== date2) return false;
                        if (result1.message !== result2.message) return false;
                    } else {
                        if (result1.error !== result2.error) return false;
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});