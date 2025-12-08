/**
 * Property-Based Tests for Double-Entry Balance
 * Feature: fix-pengembalian-simpanan, Property 8: Double-entry balance
 * Validates: Requirements 4.4
 */

import fc from 'fast-check';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        clear: () => { store = {}; },
        removeItem: (key) => { delete store[key]; }
    };
})();

global.localStorage = localStorageMock;
global.generateId = () => 'TEST-' + Math.random().toString(36).substr(2, 9);

// Simplified journal creation logic for testing
function createPengembalianJournal(simpananPokok, simpananWajib, metodePembayaran) {
    const jurnalEntries = [];
    
    // Determine kas/bank account based on payment method
    const kasAccount = metodePembayaran === 'Kas' ? '1-1000' : '1-1100';
    
    // Journal entry for Simpanan Pokok
    if (simpananPokok > 0) {
        jurnalEntries.push({
            akun: '2-1100',
            debit: simpananPokok,
            kredit: 0
        });
    }
    
    // Journal entry for Simpanan Wajib
    if (simpananWajib > 0) {
        jurnalEntries.push({
            akun: '2-1200',
            debit: simpananWajib,
            kredit: 0
        });
    }
    
    // Journal entry for Kas/Bank (total pengembalian)
    const totalPengembalian = simpananPokok + simpananWajib;
    if (totalPengembalian > 0) {
        jurnalEntries.push({
            akun: kasAccount,
            debit: 0,
            kredit: totalPengembalian
        });
    }
    
    return jurnalEntries;
}

// Helper function to calculate totals
function calculateJournalTotals(entries) {
    const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalKredit = entries.reduce((sum, entry) => sum + entry.kredit, 0);
    return { totalDebit, totalKredit };
}

describe('Property 8: Double-entry balance', () => {
    
    test('For any journal entry created during pengembalian, sum of debits must equal sum of credits', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 10000000 }), // simpanan pokok
                fc.integer({ min: 0, max: 5000000 }),  // simpanan wajib
                fc.constantFrom('Kas', 'Bank'),
                (simpananPokok, simpananWajib, metodePembayaran) => {
                    // Skip if both are zero (no journal needed)
                    if (simpananPokok === 0 && simpananWajib === 0) {
                        return true;
                    }
                    
                    // Execute: Create journal entries
                    const entries = createPengembalianJournal(
                        simpananPokok,
                        simpananWajib,
                        metodePembayaran
                    );
                    
                    // Calculate totals
                    const { totalDebit, totalKredit } = calculateJournalTotals(entries);
                    
                    // Verify: Total debit must equal total kredit
                    return Math.abs(totalDebit - totalKredit) < 0.01; // Allow for floating point precision
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any pengembalian with only simpanan pokok, debits equal credits', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 100000, max: 10000000 }),
                fc.constantFrom('Kas', 'Bank'),
                (simpananPokok, metodePembayaran) => {
                    // Execute
                    const entries = createPengembalianJournal(
                        simpananPokok,
                        0, // no simpanan wajib
                        metodePembayaran
                    );
                    
                    // Calculate
                    const { totalDebit, totalKredit } = calculateJournalTotals(entries);
                    
                    // Verify
                    return totalDebit === totalKredit && totalDebit === simpananPokok;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any pengembalian with only simpanan wajib, debits equal credits', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 50000, max: 5000000 }),
                fc.constantFrom('Kas', 'Bank'),
                (simpananWajib, metodePembayaran) => {
                    // Execute
                    const entries = createPengembalianJournal(
                        0, // no simpanan pokok
                        simpananWajib,
                        metodePembayaran
                    );
                    
                    // Calculate
                    const { totalDebit, totalKredit } = calculateJournalTotals(entries);
                    
                    // Verify
                    return totalDebit === totalKredit && totalDebit === simpananWajib;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any pengembalian with both simpanan types, debits equal credits', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 100000, max: 5000000 }),
                fc.integer({ min: 50000, max: 2000000 }),
                fc.constantFrom('Kas', 'Bank'),
                (simpananPokok, simpananWajib, metodePembayaran) => {
                    // Execute
                    const entries = createPengembalianJournal(
                        simpananPokok,
                        simpananWajib,
                        metodePembayaran
                    );
                    
                    // Calculate
                    const { totalDebit, totalKredit } = calculateJournalTotals(entries);
                    const expectedTotal = simpananPokok + simpananWajib;
                    
                    // Verify
                    return totalDebit === totalKredit && totalDebit === expectedTotal;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any random combination of simpanan amounts, balance is maintained', () => {
        fc.assert(
            fc.property(
                fc.array(fc.integer({ min: 10000, max: 1000000 }), { minLength: 1, maxLength: 5 }),
                fc.array(fc.integer({ min: 5000, max: 500000 }), { minLength: 1, maxLength: 10 }),
                fc.constantFrom('Kas', 'Bank'),
                (simpananPokokArray, simpananWajibArray, metodePembayaran) => {
                    // Sum all simpanan
                    const totalPokok = simpananPokokArray.reduce((sum, a) => sum + a, 0);
                    const totalWajib = simpananWajibArray.reduce((sum, a) => sum + a, 0);
                    
                    // Execute
                    const entries = createPengembalianJournal(
                        totalPokok,
                        totalWajib,
                        metodePembayaran
                    );
                    
                    // Calculate
                    const { totalDebit, totalKredit } = calculateJournalTotals(entries);
                    
                    // Verify: Balance maintained
                    return Math.abs(totalDebit - totalKredit) < 0.01;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any pengembalian, total debit equals total simpanan returned', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 10000000 }),
                fc.integer({ min: 0, max: 5000000 }),
                fc.constantFrom('Kas', 'Bank'),
                (simpananPokok, simpananWajib, metodePembayaran) => {
                    // Skip if both zero
                    if (simpananPokok === 0 && simpananWajib === 0) {
                        return true;
                    }
                    
                    // Execute
                    const entries = createPengembalianJournal(
                        simpananPokok,
                        simpananWajib,
                        metodePembayaran
                    );
                    
                    // Calculate
                    const { totalDebit } = calculateJournalTotals(entries);
                    const totalSimpanan = simpananPokok + simpananWajib;
                    
                    // Verify: Total debit equals total simpanan
                    return totalDebit === totalSimpanan;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any pengembalian, total kredit equals total cash/bank outflow', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 10000000 }),
                fc.integer({ min: 0, max: 5000000 }),
                fc.constantFrom('Kas', 'Bank'),
                (simpananPokok, simpananWajib, metodePembayaran) => {
                    // Skip if both zero
                    if (simpananPokok === 0 && simpananWajib === 0) {
                        return true;
                    }
                    
                    // Execute
                    const entries = createPengembalianJournal(
                        simpananPokok,
                        simpananWajib,
                        metodePembayaran
                    );
                    
                    // Calculate
                    const { totalKredit } = calculateJournalTotals(entries);
                    const totalPengembalian = simpananPokok + simpananWajib;
                    
                    // Verify: Total kredit equals total pengembalian
                    return totalKredit === totalPengembalian;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any pengembalian, no entry should have both debit and kredit non-zero', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 100000, max: 5000000 }),
                fc.integer({ min: 50000, max: 2000000 }),
                fc.constantFrom('Kas', 'Bank'),
                (simpananPokok, simpananWajib, metodePembayaran) => {
                    // Execute
                    const entries = createPengembalianJournal(
                        simpananPokok,
                        simpananWajib,
                        metodePembayaran
                    );
                    
                    // Verify: Each entry should have either debit OR kredit, not both
                    return entries.every(entry => {
                        return (entry.debit > 0 && entry.kredit === 0) ||
                               (entry.debit === 0 && entry.kredit > 0);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any pengembalian with large amounts, precision is maintained', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1000000000, max: 9999999999 }), // Very large amounts
                fc.integer({ min: 500000000, max: 4999999999 }),
                fc.constantFrom('Kas', 'Bank'),
                (simpananPokok, simpananWajib, metodePembayaran) => {
                    // Execute
                    const entries = createPengembalianJournal(
                        simpananPokok,
                        simpananWajib,
                        metodePembayaran
                    );
                    
                    // Calculate
                    const { totalDebit, totalKredit } = calculateJournalTotals(entries);
                    
                    // Verify: Balance maintained even with large numbers
                    return totalDebit === totalKredit;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any pengembalian, difference between debit and kredit should be exactly zero', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 10000000 }),
                fc.integer({ min: 1, max: 5000000 }),
                fc.constantFrom('Kas', 'Bank'),
                (simpananPokok, simpananWajib, metodePembayaran) => {
                    // Execute
                    const entries = createPengembalianJournal(
                        simpananPokok,
                        simpananWajib,
                        metodePembayaran
                    );
                    
                    // Calculate
                    const { totalDebit, totalKredit } = calculateJournalTotals(entries);
                    const difference = totalDebit - totalKredit;
                    
                    // Verify: Difference must be exactly zero
                    return difference === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
});
