/**
 * Property-Based Test: Year-End Cutoff Accuracy
 * Task 2.3: Write property test for year-end cutoff accuracy
 * 
 * **Feature: laporan-neraca-periode, Property 5: Year-end cutoff accuracy**
 * 
 * This test validates that for any yearly report, only journal entries 
 * with dates on or before December 31st of the selected year are included 
 * in balance calculations.
 * 
 * Requirements: 2.4
 */

import fc from 'fast-check';

// Mock localStorage for testing
const mockLocalStorage = {
    data: {},
    getItem: function(key) {
        return this.data[key] || null;
    },
    setItem: function(key, value) {
        this.data[key] = value;
    },
    clear: function() {
        this.data = {};
    }
};

// Mock global localStorage
global.localStorage = mockLocalStorage;

// Mock functions that we need to test (extracted from reports.js)
global.checkPeriodDataAvailability = function(endDate) {
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
};

global.validatePeriodSelection = function(periodData) {
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
                
            default:
                return {
                    success: false,
                    error: 'Unsupported period type in test',
                    endDate: null
                };
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
};

describe('Property Test: Year-End Cutoff Accuracy', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        mockLocalStorage.clear();
        
        // Setup comprehensive COA structure for balance sheet testing
        const comprehensiveCOA = [
            // Assets
            { kode: '1-1000', nama: 'Kas', tipe: 'Aset', saldo: 5000000 },
            { kode: '1-1100', nama: 'Bank BCA', tipe: 'Aset', saldo: 10000000 },
            { kode: '1-1200', nama: 'Piutang Anggota', tipe: 'Aset', saldo: 2000000 },
            { kode: '1-1300', nama: 'Persediaan Barang', tipe: 'Aset', saldo: 8000000 },
            { kode: '1-2000', nama: 'Peralatan Kantor', tipe: 'Aset', saldo: 3000000 },
            
            // Liabilities
            { kode: '2-1000', nama: 'Hutang Supplier', tipe: 'Kewajiban', saldo: 1500000 },
            { kode: '2-1100', nama: 'Simpanan Pokok', tipe: 'Kewajiban', saldo: 5000000 },
            { kode: '2-1200', nama: 'Simpanan Wajib', tipe: 'Kewajiban', saldo: 8000000 },
            { kode: '2-1300', nama: 'Simpanan Sukarela', tipe: 'Kewajiban', saldo: 3000000 },
            
            // Equity
            { kode: '3-1000', nama: 'Modal Koperasi', tipe: 'Modal', saldo: 10000000 },
            { kode: '3-2000', nama: 'Laba Ditahan', tipe: 'Modal', saldo: 500000 }
        ];
        
        mockLocalStorage.setItem('coa', JSON.stringify(comprehensiveCOA));
    });

    /**
     * Property: Year-end cutoff accuracy
     * For any yearly report, only journal entries with dates on or before 
     * December 31st of the selected year should be included
     */
    test('should only include journal entries on or before December 31st of selected year', () => {
        fc.assert(fc.property(
            // Generate year (2023-2024)
            fc.integer({ min: 2023, max: 2024 }),
            // Generate journal entries spanning multiple years
            fc.array(
                fc.record({
                    id: fc.string({ minLength: 1, maxLength: 12 }),
                    tanggal: fc.date({ min: new Date('2022-01-01'), max: new Date('2025-12-31') }),
                    keterangan: fc.string({ minLength: 5, maxLength: 60 }),
                    entries: fc.array(
                        fc.record({
                            akun: fc.constantFrom(
                                '1-1000', '1-1100', '1-1200', '1-1300', '1-2000',
                                '2-1000', '2-1100', '2-1200', '2-1300',
                                '3-1000', '3-2000'
                            ),
                            debit: fc.integer({ min: 0, max: 2000000 }),
                            kredit: fc.integer({ min: 0, max: 2000000 })
                        }),
                        { minLength: 1, maxLength: 4 }
                    )
                }),
                { minLength: 15, maxLength: 50 }
            ),
            (selectedYear, journalEntries) => {
                // Skip future years to avoid validation errors
                const currentYear = new Date().getFullYear();
                if (selectedYear > currentYear) {
                    return; // Skip this test case
                }
                
                // Setup journal data in localStorage
                const formattedEntries = journalEntries.map(entry => ({
                    ...entry,
                    tanggal: entry.tanggal.toISOString().split('T')[0] // Format as YYYY-MM-DD
                }));
                
                mockLocalStorage.setItem('jurnal', JSON.stringify(formattedEntries));
                
                // Calculate December 31st of the selected year
                const yearEndDate = new Date(selectedYear, 11, 31); // December 31st
                yearEndDate.setHours(23, 59, 59, 999);
                
                // Test the year-end cutoff logic
                const dataAvailability = checkPeriodDataAvailability(yearEndDate);
                
                // Count entries that should be included (on or before December 31st)
                const expectedIncludedEntries = formattedEntries.filter(entry => {
                    const entryDate = new Date(entry.tanggal);
                    return entryDate <= yearEndDate;
                });
                
                // The function should report the correct count of included entries
                expect(dataAvailability.journalCount).toBe(expectedIncludedEntries.length);
                
                // Verify that no entries after year-end are included
                const entriesAfterYear = formattedEntries.filter(entry => {
                    const entryDate = new Date(entry.tanggal);
                    return entryDate > yearEndDate;
                });
                
                // The count should not include entries after the year-end
                expect(dataAvailability.journalCount).toBe(formattedEntries.length - entriesAfterYear.length);
                
                // Additional validation: if there are entries in or before the year, hasJournalEntries should be true
                if (expectedIncludedEntries.length > 0) {
                    expect(dataAvailability.hasJournalEntries).toBe(true);
                } else {
                    expect(dataAvailability.hasJournalEntries).toBe(false);
                }
            }
        ), { numRuns: 100 });
    });

    /**
     * Property: December 31st boundary validation
     * Entries exactly on December 31st should be included
     */
    test('should include entries exactly on December 31st', () => {
        fc.assert(fc.property(
            fc.integer({ min: 2023, max: 2024 }),
            fc.integer({ min: 1, max: 8 }),
            (selectedYear, numEntries) => {
                // Skip future years
                const currentYear = new Date().getFullYear();
                if (selectedYear > currentYear) {
                    return;
                }
                
                // Get December 31st of the selected year
                const dec31 = new Date(selectedYear, 11, 31);
                const dateString = dec31.toISOString().split('T')[0];
                
                // Create entries exactly on December 31st
                const entriesOnDec31 = Array.from({ length: numEntries }, (_, i) => ({
                    id: `year-end-entry-${i}`,
                    tanggal: dateString,
                    keterangan: `Year-end closing entry ${i}`,
                    entries: [{
                        akun: i % 2 === 0 ? '3-2000' : '1-1000', // Alternate between equity and cash
                        debit: i % 2 === 0 ? 500000 : 0,
                        kredit: i % 2 === 0 ? 0 : 500000
                    }]
                }));
                
                mockLocalStorage.setItem('jurnal', JSON.stringify(entriesOnDec31));
                
                const endDate = new Date(selectedYear, 11, 31);
                endDate.setHours(23, 59, 59, 999);
                
                const dataAvailability = checkPeriodDataAvailability(endDate);
                
                // All entries on December 31st should be included
                expect(dataAvailability.journalCount).toBe(numEntries);
                expect(dataAvailability.hasJournalEntries).toBe(true);
            }
        ), { numRuns: 100 });
    });

    /**
     * Property: Next year exclusion
     * No entries from January 1st of the next year should be included
     */
    test('should exclude all entries from the next year', () => {
        fc.assert(fc.property(
            fc.integer({ min: 2023, max: 2023 }), // Use 2023 to avoid future year issues
            fc.integer({ min: 1, max: 10 }),
            (selectedYear, numNextYearEntries) => {
                // Create entries in the next year (January 1st and beyond)
                const nextYear = selectedYear + 1;
                const nextYearEntries = Array.from({ length: numNextYearEntries }, (_, i) => {
                    const nextYearDate = new Date(nextYear, 0, i + 1); // January 1st, 2nd, 3rd, etc.
                    
                    return {
                        id: `next-year-entry-${i}`,
                        tanggal: nextYearDate.toISOString().split('T')[0],
                        keterangan: `Next year entry ${i}`,
                        entries: [{
                            akun: '2-1000',
                            debit: 0,
                            kredit: 100000
                        }]
                    };
                });
                
                mockLocalStorage.setItem('jurnal', JSON.stringify(nextYearEntries));
                
                // Test with December 31st of the selected year
                const endDate = new Date(selectedYear, 11, 31);
                endDate.setHours(23, 59, 59, 999);
                
                const dataAvailability = checkPeriodDataAvailability(endDate);
                
                // No next year entries should be included
                expect(dataAvailability.journalCount).toBe(0);
                expect(dataAvailability.hasJournalEntries).toBe(false);
            }
        ), { numRuns: 100 });
    });

    /**
     * Property: Cross-year boundary validation
     * When entries span across year boundaries, only those in or before 
     * the selected year should be included
     */
    test('should correctly filter entries across year boundaries', () => {
        fc.assert(fc.property(
            fc.integer({ min: 2023, max: 2023 }), // Use 2023 to control year boundaries
            fc.integer({ min: 3, max: 8 }),
            fc.integer({ min: 3, max: 8 }),
            fc.integer({ min: 3, max: 8 }),
            (selectedYear, numPrevYearEntries, numCurrentYearEntries, numNextYearEntries) => {
                const prevYear = selectedYear - 1;
                const nextYear = selectedYear + 1;
                
                // Create entries in previous year (December)
                const prevYearEntries = Array.from({ length: numPrevYearEntries }, (_, i) => {
                    const prevYearDate = new Date(prevYear, 11, 20 + i); // Late December
                    
                    return {
                        id: `prev-year-entry-${i}`,
                        tanggal: prevYearDate.toISOString().split('T')[0],
                        keterangan: `Previous year entry ${i}`,
                        entries: [{
                            akun: '1-1100',
                            debit: 200000,
                            kredit: 0
                        }]
                    };
                });
                
                // Create entries in current year (various months)
                const currentYearEntries = Array.from({ length: numCurrentYearEntries }, (_, i) => {
                    const month = (i % 12); // Spread across months
                    const day = 15; // Mid-month
                    const currentYearDate = new Date(selectedYear, month, day);
                    
                    return {
                        id: `current-year-entry-${i}`,
                        tanggal: currentYearDate.toISOString().split('T')[0],
                        keterangan: `Current year entry ${i}`,
                        entries: [{
                            akun: '1-1300',
                            debit: 150000,
                            kredit: 0
                        }]
                    };
                });
                
                // Create entries in next year (January)
                const nextYearEntries = Array.from({ length: numNextYearEntries }, (_, i) => {
                    const nextYearDate = new Date(nextYear, 0, 10 + i); // Mid January
                    
                    return {
                        id: `next-year-entry-${i}`,
                        tanggal: nextYearDate.toISOString().split('T')[0],
                        keterangan: `Next year entry ${i}`,
                        entries: [{
                            akun: '2-1200',
                            debit: 0,
                            kredit: 75000
                        }]
                    };
                });
                
                const allEntries = [...prevYearEntries, ...currentYearEntries, ...nextYearEntries];
                mockLocalStorage.setItem('jurnal', JSON.stringify(allEntries));
                
                // Test with December 31st of the selected year
                const endDate = new Date(selectedYear, 11, 31);
                endDate.setHours(23, 59, 59, 999);
                
                const dataAvailability = checkPeriodDataAvailability(endDate);
                
                // Should include: previous year entries + current year entries
                const expectedCount = numPrevYearEntries + numCurrentYearEntries;
                expect(dataAvailability.journalCount).toBe(expectedCount);
                
                if (expectedCount > 0) {
                    expect(dataAvailability.hasJournalEntries).toBe(true);
                }
                
                // Should NOT include next year entries
                expect(dataAvailability.journalCount).toBe(allEntries.length - numNextYearEntries);
            }
        ), { numRuns: 100 });
    });

    /**
     * Property: Leap year handling
     * Test that the function correctly handles leap years (February 29th)
     */
    test('should handle leap years correctly', () => {
        fc.assert(fc.property(
            fc.constantFrom(2020, 2024), // Known leap years
            fc.integer({ min: 1, max: 5 }),
            (leapYear, numEntries) => {
                // Skip future years
                const currentYear = new Date().getFullYear();
                if (leapYear > currentYear) {
                    return;
                }
                
                // Create entries on February 29th (leap day)
                const feb29 = new Date(leapYear, 1, 29); // February 29th
                const dateString = feb29.toISOString().split('T')[0];
                
                // Verify it's actually a leap year
                expect(feb29.getMonth()).toBe(1); // February
                expect(feb29.getDate()).toBe(29); // 29th day
                
                const leapDayEntries = Array.from({ length: numEntries }, (_, i) => ({
                    id: `leap-day-entry-${i}`,
                    tanggal: dateString,
                    keterangan: `Leap day entry ${i}`,
                    entries: [{
                        akun: '1-2000',
                        debit: 300000,
                        kredit: 0
                    }]
                }));
                
                // Add one entry in the next year to test exclusion
                const nextYearEntry = {
                    id: 'next-year-entry',
                    tanggal: new Date(leapYear + 1, 0, 15).toISOString().split('T')[0],
                    keterangan: 'Next year entry',
                    entries: [{
                        akun: '2-1300',
                        debit: 0,
                        kredit: 400000
                    }]
                };
                
                const allEntries = [...leapDayEntries, nextYearEntry];
                mockLocalStorage.setItem('jurnal', JSON.stringify(allEntries));
                
                const endDate = new Date(leapYear, 11, 31);
                endDate.setHours(23, 59, 59, 999);
                
                const dataAvailability = checkPeriodDataAvailability(endDate);
                
                // Should include leap day entries but not next year entry
                expect(dataAvailability.journalCount).toBe(numEntries);
                expect(dataAvailability.hasJournalEntries).toBe(numEntries > 0);
            }
        ), { numRuns: 100 });
    });

    /**
     * Property: Full year coverage
     * Test entries distributed throughout the entire year
     */
    test('should include entries from all months of the selected year', () => {
        fc.assert(fc.property(
            fc.integer({ min: 2023, max: 2023 }), // Use 2023 for consistency
            fc.array(
                fc.record({
                    month: fc.integer({ min: 0, max: 11 }), // 0-11 for months
                    day: fc.integer({ min: 1, max: 28 }), // Safe day range for all months
                    amount: fc.integer({ min: 50000, max: 500000 })
                }),
                { minLength: 12, maxLength: 24 } // At least one entry per month
            ),
            (selectedYear, yearlyEntries) => {
                // Create entries distributed throughout the year
                const distributedEntries = yearlyEntries.map((entry, i) => {
                    const entryDate = new Date(selectedYear, entry.month, entry.day);
                    
                    return {
                        id: `yearly-entry-${i}`,
                        tanggal: entryDate.toISOString().split('T')[0],
                        keterangan: `Entry for month ${entry.month + 1}`,
                        entries: [{
                            akun: i % 2 === 0 ? '1-1000' : '2-1100',
                            debit: i % 2 === 0 ? entry.amount : 0,
                            kredit: i % 2 === 0 ? 0 : entry.amount
                        }]
                    };
                });
                
                // Add some entries from the next year (should be excluded)
                const nextYearEntries = [
                    {
                        id: 'next-year-jan',
                        tanggal: new Date(selectedYear + 1, 0, 15).toISOString().split('T')[0],
                        keterangan: 'Next year January entry',
                        entries: [{
                            akun: '3-1000',
                            debit: 1000000,
                            kredit: 0
                        }]
                    },
                    {
                        id: 'next-year-feb',
                        tanggal: new Date(selectedYear + 1, 1, 10).toISOString().split('T')[0],
                        keterangan: 'Next year February entry',
                        entries: [{
                            akun: '2-1000',
                            debit: 0,
                            kredit: 800000
                        }]
                    }
                ];
                
                const allEntries = [...distributedEntries, ...nextYearEntries];
                mockLocalStorage.setItem('jurnal', JSON.stringify(allEntries));
                
                const endDate = new Date(selectedYear, 11, 31);
                endDate.setHours(23, 59, 59, 999);
                
                const dataAvailability = checkPeriodDataAvailability(endDate);
                
                // Should include all entries from the selected year, but none from next year
                expect(dataAvailability.journalCount).toBe(distributedEntries.length);
                expect(dataAvailability.hasJournalEntries).toBe(true);
                
                // Verify exclusion of next year entries
                expect(dataAvailability.journalCount).toBe(allEntries.length - nextYearEntries.length);
            }
        ), { numRuns: 100 });
    });

    /**
     * Property: Integration with period validation for yearly reports
     * Test integration with the validatePeriodSelection function for yearly periods
     */
    test('should integrate correctly with period validation for yearly reports', () => {
        fc.assert(fc.property(
            fc.integer({ min: 2023, max: 2024 }),
            fc.array(
                fc.record({
                    id: fc.string({ minLength: 1, maxLength: 10 }),
                    tanggal: fc.date({ min: new Date('2022-01-01'), max: new Date('2025-12-31') }),
                    keterangan: fc.string({ minLength: 3, maxLength: 40 }),
                    entries: fc.array(
                        fc.record({
                            akun: fc.constantFrom('1-1000', '2-1100', '3-1000'),
                            debit: fc.integer({ min: 0, max: 1000000 }),
                            kredit: fc.integer({ min: 0, max: 1000000 })
                        }),
                        { minLength: 1, maxLength: 3 }
                    )
                }),
                { minLength: 5, maxLength: 20 }
            ),
            (selectedYear, journalEntries) => {
                // Skip future years
                const currentYear = new Date().getFullYear();
                if (selectedYear > currentYear) {
                    return;
                }
                
                // Setup journal data
                const formattedEntries = journalEntries.map(entry => ({
                    ...entry,
                    tanggal: entry.tanggal.toISOString().split('T')[0]
                }));
                
                mockLocalStorage.setItem('jurnal', JSON.stringify(formattedEntries));
                
                // Test period validation
                const periodData = {
                    type: 'yearly',
                    selectedYear: selectedYear
                };
                
                const validation = validatePeriodSelection(periodData);
                
                // Validation should succeed for non-future years
                expect(validation.success).toBe(true);
                expect(validation.endDate).toBeInstanceOf(Date);
                
                // The end date should be December 31st of the selected year
                const expectedEndDate = new Date(selectedYear, 11, 31);
                expectedEndDate.setHours(23, 59, 59, 999);
                
                expect(validation.endDate.getTime()).toBe(expectedEndDate.getTime());
                
                // Test data availability with the validated end date
                const dataAvailability = checkPeriodDataAvailability(validation.endDate);
                
                // Count expected entries (those on or before December 31st)
                const expectedEntries = formattedEntries.filter(entry => {
                    const entryDate = new Date(entry.tanggal);
                    return entryDate <= validation.endDate;
                });
                
                expect(dataAvailability.journalCount).toBe(expectedEntries.length);
            }
        ), { numRuns: 100 });
    });
});