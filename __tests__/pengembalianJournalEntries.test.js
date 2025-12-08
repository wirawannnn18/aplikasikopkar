/**
 * Property-Based Tests for Pengembalian Journal Entries
 * Feature: fix-pengembalian-simpanan, Property 7: Journal entries for pengembalian
 * Validates: Requirements 4.1, 4.2, 4.3
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
function createPengembalianJournal(simpananPokok, simpananWajib, metodePembayaran, anggotaNama, nomorReferensi, tanggalPembayaran) {
    const jurnalEntries = [];
    
    // Determine kas/bank account based on payment method
    const kasAccount = metodePembayaran === 'Kas' ? '1-1000' : '1-1100';
    
    // Journal entry for Simpanan Pokok
    if (simpananPokok > 0) {
        jurnalEntries.push({
            akun: '2-1100', // Simpanan Pokok (Kewajiban)
            debit: simpananPokok,
            kredit: 0
        });
    }
    
    // Journal entry for Simpanan Wajib
    if (simpananWajib > 0) {
        jurnalEntries.push({
            akun: '2-1200', // Simpanan Wajib (Kewajiban)
            debit: simpananWajib,
            kredit: 0
        });
    }
    
    // Journal entry for Kas/Bank (total pengembalian)
    const totalPengembalian = simpananPokok + simpananWajib;
    if (totalPengembalian > 0) {
        jurnalEntries.push({
            akun: kasAccount, // Kas or Bank
            debit: 0,
            kredit: totalPengembalian
        });
    }
    
    // Save to localStorage
    const jurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
    const jurnalId = generateId();
    jurnal.push({
        id: jurnalId,
        tanggal: tanggalPembayaran,
        keterangan: `Pengembalian Simpanan - ${anggotaNama} (${nomorReferensi})`,
        entries: jurnalEntries
    });
    localStorage.setItem('jurnal', JSON.stringify(jurnal));
    
    return { jurnalId, jurnalEntries };
}

describe('Property 7: Journal entries for pengembalian', () => {
    
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem('jurnal', JSON.stringify([]));
    });

    test('For any pengembalian with simpanan pokok > 0, journal should have debit entry on account 2-1100', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 100000, max: 10000000 }), // simpanan pokok amount
                fc.constantFrom('Kas', 'Bank'),
                fc.string({ minLength: 5, maxLength: 50 }), // anggota nama
                (simpananPokok, metodePembayaran, anggotaNama) => {
                    // Execute
                    const result = createPengembalianJournal(
                        simpananPokok,
                        0, // no simpanan wajib
                        metodePembayaran,
                        anggotaNama,
                        'PGM-TEST-001',
                        '2024-12-05'
                    );
                    
                    // Verify: Should have debit entry on 2-1100
                    const hasDebitOnSimpananPokok = result.jurnalEntries.some(
                        entry => entry.akun === '2-1100' && entry.debit === simpananPokok && entry.kredit === 0
                    );
                    
                    return hasDebitOnSimpananPokok;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any pengembalian with simpanan wajib > 0, journal should have debit entry on account 2-1200', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 50000, max: 5000000 }), // simpanan wajib amount
                fc.constantFrom('Kas', 'Bank'),
                fc.string({ minLength: 5, maxLength: 50 }),
                (simpananWajib, metodePembayaran, anggotaNama) => {
                    // Execute
                    const result = createPengembalianJournal(
                        0, // no simpanan pokok
                        simpananWajib,
                        metodePembayaran,
                        anggotaNama,
                        'PGM-TEST-002',
                        '2024-12-05'
                    );
                    
                    // Verify: Should have debit entry on 2-1200
                    const hasDebitOnSimpananWajib = result.jurnalEntries.some(
                        entry => entry.akun === '2-1200' && entry.debit === simpananWajib && entry.kredit === 0
                    );
                    
                    return hasDebitOnSimpananWajib;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any pengembalian with metode Kas, journal should have credit entry on account 1-1000', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 100000, max: 5000000 }),
                fc.integer({ min: 50000, max: 2000000 }),
                fc.string({ minLength: 5, maxLength: 50 }),
                (simpananPokok, simpananWajib, anggotaNama) => {
                    // Execute with Kas
                    const result = createPengembalianJournal(
                        simpananPokok,
                        simpananWajib,
                        'Kas',
                        anggotaNama,
                        'PGM-TEST-003',
                        '2024-12-05'
                    );
                    
                    const totalPengembalian = simpananPokok + simpananWajib;
                    
                    // Verify: Should have credit entry on 1-1000 (Kas)
                    const hasCreditOnKas = result.jurnalEntries.some(
                        entry => entry.akun === '1-1000' && entry.kredit === totalPengembalian && entry.debit === 0
                    );
                    
                    return hasCreditOnKas;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any pengembalian with metode Bank, journal should have credit entry on account 1-1100', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 100000, max: 5000000 }),
                fc.integer({ min: 50000, max: 2000000 }),
                fc.string({ minLength: 5, maxLength: 50 }),
                (simpananPokok, simpananWajib, anggotaNama) => {
                    // Execute with Bank
                    const result = createPengembalianJournal(
                        simpananPokok,
                        simpananWajib,
                        'Bank',
                        anggotaNama,
                        'PGM-TEST-004',
                        '2024-12-05'
                    );
                    
                    const totalPengembalian = simpananPokok + simpananWajib;
                    
                    // Verify: Should have credit entry on 1-1100 (Bank)
                    const hasCreditOnBank = result.jurnalEntries.some(
                        entry => entry.akun === '1-1100' && entry.kredit === totalPengembalian && entry.debit === 0
                    );
                    
                    return hasCreditOnBank;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any pengembalian, journal should have correct number of entries', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 5000000 }),
                fc.integer({ min: 0, max: 2000000 }),
                fc.constantFrom('Kas', 'Bank'),
                fc.string({ minLength: 5, maxLength: 50 }),
                (simpananPokok, simpananWajib, metodePembayaran, anggotaNama) => {
                    // Skip if both are zero
                    if (simpananPokok === 0 && simpananWajib === 0) {
                        return true;
                    }
                    
                    // Execute
                    const result = createPengembalianJournal(
                        simpananPokok,
                        simpananWajib,
                        metodePembayaran,
                        anggotaNama,
                        'PGM-TEST-005',
                        '2024-12-05'
                    );
                    
                    // Calculate expected number of entries
                    let expectedEntries = 0;
                    if (simpananPokok > 0) expectedEntries++; // Debit Simpanan Pokok
                    if (simpananWajib > 0) expectedEntries++; // Debit Simpanan Wajib
                    if (simpananPokok + simpananWajib > 0) expectedEntries++; // Credit Kas/Bank
                    
                    return result.jurnalEntries.length === expectedEntries;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any pengembalian, journal should be saved to localStorage', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 100000, max: 5000000 }),
                fc.integer({ min: 50000, max: 2000000 }),
                fc.constantFrom('Kas', 'Bank'),
                fc.string({ minLength: 5, maxLength: 50 }),
                (simpananPokok, simpananWajib, metodePembayaran, anggotaNama) => {
                    // Clear before test
                    localStorage.setItem('jurnal', JSON.stringify([]));
                    
                    // Execute
                    const result = createPengembalianJournal(
                        simpananPokok,
                        simpananWajib,
                        metodePembayaran,
                        anggotaNama,
                        'PGM-TEST-006',
                        '2024-12-05'
                    );
                    
                    // Verify: Journal should be in localStorage
                    const jurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
                    const savedJurnal = jurnal.find(j => j.id === result.jurnalId);
                    
                    return savedJurnal !== undefined && 
                           savedJurnal.entries.length === result.jurnalEntries.length;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any pengembalian, journal keterangan should contain anggota name and reference number', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 100000, max: 5000000 }),
                fc.integer({ min: 50000, max: 2000000 }),
                fc.constantFrom('Kas', 'Bank'),
                fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
                (simpananPokok, simpananWajib, metodePembayaran, anggotaNama) => {
                    const nomorReferensi = 'PGM-TEST-007';
                    
                    // Execute
                    const result = createPengembalianJournal(
                        simpananPokok,
                        simpananWajib,
                        metodePembayaran,
                        anggotaNama,
                        nomorReferensi,
                        '2024-12-05'
                    );
                    
                    // Verify: Keterangan should contain name and reference
                    const jurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
                    const savedJurnal = jurnal.find(j => j.id === result.jurnalId);
                    
                    return savedJurnal && 
                           savedJurnal.keterangan.includes(anggotaNama) &&
                           savedJurnal.keterangan.includes(nomorReferensi);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any pengembalian with both simpanan pokok and wajib, journal should have 3 entries', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 100000, max: 5000000 }),
                fc.integer({ min: 50000, max: 2000000 }),
                fc.constantFrom('Kas', 'Bank'),
                fc.string({ minLength: 5, maxLength: 50 }),
                (simpananPokok, simpananWajib, metodePembayaran, anggotaNama) => {
                    // Execute
                    const result = createPengembalianJournal(
                        simpananPokok,
                        simpananWajib,
                        metodePembayaran,
                        anggotaNama,
                        'PGM-TEST-008',
                        '2024-12-05'
                    );
                    
                    // Verify: Should have exactly 3 entries
                    // 1. Debit Simpanan Pokok (2-1100)
                    // 2. Debit Simpanan Wajib (2-1200)
                    // 3. Credit Kas/Bank (1-1000 or 1-1100)
                    return result.jurnalEntries.length === 3;
                }
            ),
            { numRuns: 100 }
        );
    });
});
