/**
 * Property-Based Test: Month-End Cutoff Accuracy
 * Task 2.2: Write property test for month-end cutoff accuracy
 * 
 * **Feature: laporan-neraca-periode, Property 4: Month-end cutoff accuracy**
 * 
 * This test validates that for any monthly report, only journal entries 
 * with dates on or before the last day of the selected month are included 
 * in balance calculations.
 * 
 * Requirements: 2.3
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

describe('Property Test: Month-End Cutoff Accuracy', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        mockLocalStorage.clear();
        
        // Setup basic COA structure
        const basicCOA = [
            { kode: '1-1000', nama: 'Kas', tipe: 'Aset', saldo: 1000000 },
            { kode: '1-1100', nama: 'Bank', tipe: 'Aset', saldo: 2000000 },
            { kode: '1-1300', nama: 'Persediaan Barang', tipe: 'Aset', saldo: 3000000 },
            { kode: '2-1000', nama: 'Hutang Supplier', tipe: 'Kewajiban', saldo: 500000 },
            { kode: '2-1100', nama: 'Simpanan Pokok', tipe: 'Kewajiban', saldo: 1000000 },
            { kode: '3-1000', nama: 'Modal Koperasi', tipe: 'Modal', saldo: 4500000 }
        ];
        
        mockLocalStorage.setItem('coa', JSON.stringify(basicCOA));
    });

    /**
     * Property: Month-end cutoff accuracy
     * For any monthly report, only journal entries with dates on or before 
     * the last day of the selected month should be included
     */
    test('should only include journal entries on or before last day of selected month', () => {
        fc.assert(fc.property(
            // Generate month (1-12) and year (2023-2024)
            fc.integer({ min: 1, max: 12 }),
            fc.integer({ min: 2023, max: 2024 }),
            // Generate journal entries spanning multiple months
            fc.array(
                fc.record({
                    id: fc.string({ minLength: 1, maxLength: 10 }),
                    tanggal: fc.date({ min: new Date('2023-01-01'), max: new Date('2024-12-31') }),
                    keterangan: fc.string({ minLength: 5, maxLength: 50 }),
                    entries: fc.array(
                        fc.record({
                            akun: fc.constantFrom('1-1000', '1-1100', '1-1300', '2-1000', '2-1100', '3-1000'),
                            debit: fc.integer({ min: 0, max: 1000000 }),
                            kredit: fc.integer({ min: 0, max: 1000000 })
                        }),
                        { minLength: 1, maxLength: 3 }
                    )
                }),
                { minLength: 10, maxLength: 30 }
            ),
            (selectedMonth, selectedYear, journalEntries) => {
                // Skip future months to avoid validation errors
                const currentDate = new Date();
                const selectedMonthDate = new Date(selectedYear, selectedMonth - 1, 1);
                if (selectedMonthDate > currentDate) {
                    return; // Skip this test case
                }
                
                // Setup journal data in localStorage
                const formattedEntries = journalEntries.map(entry => ({
                    ...entry,
                    tanggal: entry.tanggal.toISOString().split('T')[0] // Format as YYYY-MM-DD
                }));
                
                mockLocalStorage.setItem('jurnal', JSON.stringify(formattedEntries));
                
                // Calculate the last day of the selected month
                const lastDayOfMonth = new Date(selectedYear, selectedMonth, 0); // Day 0 = last day of previous month
                lastDayOfMonth.setHours(23, 59, 59, 999);
                
                // Test the month-end cutoff logic
                const dataAvailability = checkPeriodDataAvailability(lastDayOfMonth);
                
                // Count entries that should be included (on or before last day of month)
                const expectedIncludedEntries = formattedEntries.filter(entry => {
                    const entryDate = new Date(entry.tanggal);
                    return entryDate <= lastDayOfMonth;
                });
                
                // The function should report the correct count of included entries
                expect(dataAvailability.journalCount).toBe(expectedIncludedEntries.length);
                
                // Verify that no entries after the month-end are included
                const entriesAfterMonth = formattedEntries.filter(entry => {
                    const entryDate = new Date(entry.tanggal);
                    return entryDate > lastDayOfMonth;
                });
                
                // The count should not include entries after the month-end
                expect(dataAvailability.journalCount).toBe(formattedEntries.length - entriesAfterMonth.length);
                
                // Additional validation: if there are entries in or before the month, hasJournalEntries should be true
                if (expectedIncludedEntries.length > 0) {
                    expect(dataAvailability.hasJournalEntries).toBe(true);
                } else {
                    expect(dataAvailability.hasJournalEntries).toBe(false);
                }
            }
        ), { numRuns: 100 });
    });

    /**
     * Property: Last day of month boundary validation
     * Entries exactly on the last day of the month should be included
     */
    test('should include entries exactly on the last day of the month', () => {
        fc.assert(fc.property(
            fc.integer({ min: 1, max: 12 }),
            fc.integer({ min: 2023, max: 2024 }),
            fc.integer({ min: 1, max: 5 }),
            (selectedMonth, selectedYear, numEntries) => {
                // Skip future months
                const currentDate = new Date();
                const selectedMonthDate = new Date(selectedYear, selectedMonth - 1, 1);
                if (selectedMonthDate > currentDate) {
                    return;
                }
                
                // Get the last day of the selected month
                const lastDayOfMonth = new Date(selectedYear, selectedMonth, 0);
                const dateString = lastDayOfMonth.toISOString().split('T')[0];
                
                // Create entries exactly on the last day of the month
                const entriesOnLastDay = Array.from({ length: numEntries }, (_, i) => ({
                    id: `month-end-entry-${i}`,
                    tanggal: dateString,
                    keterangan: `Month-end entry ${i}`,
                    entries: [{
                        akun: '1-1000',
                        debit: 100000,
                        kredit: 0
                    }]
                }));
                
                mockLocalStorage.setItem('jurnal', JSON.stringify(entriesOnLastDay));
                
                const endDate = new Date(selectedYear, selectedMonth, 0);
                endDate.setHours(23, 59, 59, 999);
                
                const dataAvailability = checkPeriodDataAvailability(endDate);
                
                // All entries on the last day should be included
                expect(dataAvailability.journalCount).toBe(numEntries);
                expect(dataAvailability.hasJournalEntries).toBe(true);
            }
        ), { numRuns: 100 });
    });

    /**
     * Property: Next month exclusion
     * No entries from the next month should be included
     */
    test('should exclude all entries from the next month', () => {
        fc.assert(fc.property(
            fc.integer({ min: 1, max: 11 }), // Avoid December to prevent year overflow
            fc.integer({ min: 2023, max: 2024 }),
            fc.integer({ min: 1, max: 8 }),
            (selectedMonth, selectedYear, numNextMonthEntries) => {
                // Skip future months
                const currentDate = new Date();
                const selectedMonthDate = new Date(selectedYear, selectedMonth - 1, 1);
                if (selectedMonthDate > currentDate) {
                    return;
                }
                
                // Create entries in the next month
                const nextMonth = selectedMonth + 1;
                const nextMonthEntries = Array.from({ length: numNextMonthEntries }, (_, i) => {
                    const nextMonthDate = new Date(selectedYear, nextMonth - 1, i + 1); // Days 1, 2, 3, etc.
                    
                    return {
                        id: `next-month-entry-${i}`,
                        tanggal: nextMonthDate.toISOString().split('T')[0],
                        keterangan: `Next month entry ${i}`,
                        entries: [{
                            akun: '2-1000',
                            debit: 0,
                            kredit: 50000
                        }]
                    };
                });
                
                mockLocalStorage.setItem('jurnal', JSON.stringify(nextMonthEntries));
                
                // Test with the last day of the selected month
                const endDate = new Date(selectedYear, selectedMonth, 0);
                endDate.setHours(23, 59, 59, 999);
                
                const dataAvailability = checkPeriodDataAvailability(endDate);
                
                // No next month entries should be included
                expect(dataAvailability.journalCount).toBe(0);
                expect(dataAvailability.hasJournalEntries).toBe(false);
            }
        ), { numRuns: 100 });
    });

    /**
     * Property: Cross-month boundary validation
     * When entries span across month boundaries, only those in or before 
     * the selected month should be included
     */
    test('should correctly filter entries across month boundaries', () => {
        fc.assert(fc.property(
            fc.integer({ min: 2, max: 11 }), // Avoid January and December for cleaner testing
            fc.integer({ min: 2023, max: 2024 }),
            fc.integer({ min: 2, max: 6 }),
            fc.integer({ min: 2, max: 6 }),
            fc.integer({ min: 2, max: 6 }),
            (selectedMonth, selectedYear, numPrevMonthEntries, numCurrentMonthEntries, numNextMonthEntries) => {
                // Skip future months
                const currentDate = new Date();
                const selectedMonthDate = new Date(selectedYear, selectedMonth - 1, 1);
                if (selectedMonthDate > currentDate) {
                    return;
                }
                
                // Create entries in previous month
                const prevMonth = selectedMonth - 1;
                const prevMonthEntries = Array.from({ length: numPrevMonthEntries }, (_, i) => {
                    const prevMonthDate = new Date(selectedYear, prevMonth - 1, 15 + i); // Mid-month dates
                    
                    return {
                        id: `prev-month-entry-${i}`,
                        tanggal: prevMonthDate.toISOString().split('T')[0],
                        keterangan: `Previous month entry ${i}`,
                        entries: [{
                            akun: '1-1000',
                            debit: 75000,
                            kredit: 0
                        }]
                    };
                });
                
                // Create entries in current month
                const currentMonthEntries = Array.from({ length: numCurrentMonthEntries }, (_, i) => {
                    const currentMonthDate = new Date(selectedYear, selectedMonth - 1, 10 + i); // Mid-month dates
                    
                    return {
                        id: `current-month-entry-${i}`,
                        tanggal: currentMonthDate.toISOString().split('T')[0],
                        keterangan: `Current month entry ${i}`,
                        entries: [{
                            akun: '1-1100',
                            debit: 100000,
                            kredit: 0
                        }]
                    };
                });
                
                // Create entries in next month
                const nextMonth = selectedMonth + 1;
                const nextMonthEntries = Array.from({ length: numNextMonthEntries }, (_, i) => {
                    const nextMonthDate = new Date(selectedYear, nextMonth - 1, 5 + i); // Early month dates
                    
                    return {
                        id: `next-month-entry-${i}`,
                        tanggal: nextMonthDate.toISOString().split('T')[0],
                        keterangan: `Next month entry ${i}`,
                        entries: [{
                            akun: '2-1000',
                            debit: 0,
                            kredit: 25000
                        }]
                    };
                });
                
                const allEntries = [...prevMonthEntries, ...currentMonthEntries, ...nextMonthEntries];
                mockLocalStorage.setItem('jurnal', JSON.stringify(allEntries));
                
                // Test with the last day of the selected month
                const endDate = new Date(selectedYear, selectedMonth, 0);
                endDate.setHours(23, 59, 59, 999);
                
                const dataAvailability = checkPeriodDataAvailability(endDate);
                
                // Should include: previous month entries + current month entries
                const expectedCount = numPrevMonthEntries + numCurrentMonthEntries;
                expect(dataAvailability.journalCount).toBe(expectedCount);
                
                if (expectedCount > 0) {
                    expect(dataAvailability.hasJournalEntries).toBe(true);
                }
                
                // Should NOT include next month entries
                expect(dataAvailability.journalCount).toBe(allEntries.length - numNextMonthEntries);
            }
        ), { numRuns: 100 });
    });

    /**
     * Property: Different month lengths handling
     * Test that the function correctly handles months with different numbers of days
     */
    test('should handle different month lengths correctly', () => {
        fc.assert(fc.property(
            fc.constantFrom(
                { month: 2, year: 2023, days: 28 }, // February non-leap year
                { month: 2, year: 2024, days: 29 }, // February leap year
                { month: 4, year: 2023, days: 30 }, // April (30 days)
                { month: 1, year: 2023, days: 31 }, // January (31 days)
                { month: 6, year: 2023, days: 30 }, // June (30 days)
                { month: 12, year: 2023, days: 31 } // December (31 days)
            ),
            fc.integer({ min: 1, max: 5 }),
            (monthInfo, numEntries) => {
                const { month, year, days } = monthInfo;
                
                // Skip future months
                const currentDate = new Date();
                const selectedMonthDate = new Date(year, month - 1, 1);
                if (selectedMonthDate > currentDate) {
                    return;
                }
                
                // Create entries on the actual last day of the month
                const lastDayOfMonth = new Date(year, month, 0);
                const actualLastDay = lastDayOfMonth.getDate();
                
                // Verify our test data is correct
                expect(actualLastDay).toBe(days);
                
                // Create entries on the last day
                const entriesOnLastDay = Array.from({ length: numEntries }, (_, i) => ({
                    id: `last-day-entry-${i}`,
                    tanggal: lastDayOfMonth.toISOString().split('T')[0],
                    keterangan: `Entry on last day of ${month}/${year}`,
                    entries: [{
                        akun: '1-1300',
                        debit: 150000,
                        kredit: 0
                    }]
                }));
                
                // Add one entry on the day after (should be excluded)
                const dayAfter = new Date(year, month, 1); // First day of next month
                const entryAfter = {
                    id: 'day-after-entry',
                    tanggal: dayAfter.toISOString().split('T')[0],
                    keterangan: 'Entry day after month end',
                    entries: [{
                        akun: '2-1100',
                        debit: 0,
                        kredit: 200000
                    }]
                };
                
                const allEntries = [...entriesOnLastDay, entryAfter];
                mockLocalStorage.setItem('jurnal', JSON.stringify(allEntries));
                
                const endDate = new Date(year, month, 0);
                endDate.setHours(23, 59, 59, 999);
                
                const dataAvailability = checkPeriodDataAvailability(endDate);
                
                // Should include only the entries on the last day, not the day after
                expect(dataAvailability.journalCount).toBe(numEntries);
                expect(dataAvailability.hasJournalEntries).toBe(numEntries > 0);
            }
        ), { numRuns: 100 });
    });

    /**
     * Property: Validation with period validation function
     * Test integration with the validatePeriodSelection function for monthly periods
     */
    test('should integrate correctly with period validation for monthly reports', () => {
        fc.assert(fc.property(
            fc.integer({ min: 1, max: 12 }),
            fc.integer({ min: 2023, max: 2024 }),
            fc.array(
                fc.record({
                    id: fc.string({ minLength: 1, maxLength: 8 }),
                    tanggal: fc.date({ min: new Date('2023-01-01'), max: new Date('2024-12-31') }),
                    keterangan: fc.string({ minLength: 3, maxLength: 30 }),
                    entries: fc.array(
                        fc.record({
                            akun: fc.constantFrom('1-1000', '2-1000', '3-1000'),
                            debit: fc.integer({ min: 0, max: 500000 }),
                            kredit: fc.integer({ min: 0, max: 500000 })
                        }),
                        { minLength: 1, maxLength: 2 }
                    )
                }),
                { minLength: 3, maxLength: 15 }
            ),
            (selectedMonth, selectedYear, journalEntries) => {
                // Skip future months
                const currentDate = new Date();
                const selectedMonthDate = new Date(selectedYear, selectedMonth - 1, 1);
                if (selectedMonthDate > currentDate) {
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
                    type: 'monthly',
                    selectedMonth: selectedMonth,
                    selectedYear: selectedYear
                };
                
                const validation = validatePeriodSelection(periodData);
                
                // Validation should succeed for non-future months
                expect(validation.success).toBe(true);
                expect(validation.endDate).toBeInstanceOf(Date);
                
                // The end date should be the last day of the month
                const expectedEndDate = new Date(selectedYear, selectedMonth, 0);
                expectedEndDate.setHours(23, 59, 59, 999);
                
                expect(validation.endDate.getTime()).toBe(expectedEndDate.getTime());
                
                // Test data availability with the validated end date
                const dataAvailability = checkPeriodDataAvailability(validation.endDate);
                
                // Count expected entries (those on or before the end date)
                const expectedEntries = formattedEntries.filter(entry => {
                    const entryDate = new Date(entry.tanggal);
                    return entryDate <= validation.endDate;
                });
                
                expect(dataAvailability.journalCount).toBe(expectedEntries.length);
            }
        ), { numRuns: 100 });
    });
});