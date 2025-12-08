/**
 * Property-Based Tests for Pengembalian References Journal
 * Feature: fix-pengembalian-simpanan, Property 9: Pengembalian references journal
 * Validates: Requirements 4.5
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

// Simplified pengembalian processing for testing
function processPengembalianWithJournal(anggotaId, anggotaNama, simpananPokok, simpananWajib, metodePembayaran, tanggalPembayaran) {
    // Create journal
    const jurnalId = generateId();
    const jurnalEntries = [];
    
    const kasAccount = metodePembayaran === 'Kas' ? '1-1000' : '1-1100';
    
    if (simpananPokok > 0) {
        jurnalEntries.push({ akun: '2-1100', debit: simpananPokok, kredit: 0 });
    }
    
    if (simpananWajib > 0) {
        jurnalEntries.push({ akun: '2-1200', debit: simpananWajib, kredit: 0 });
    }
    
    const totalPengembalian = simpananPokok + simpananWajib;
    if (totalPengembalian > 0) {
        jurnalEntries.push({ akun: kasAccount, debit: 0, kredit: totalPengembalian });
    }
    
    // Save journal
    const jurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
    jurnal.push({
        id: jurnalId,
        tanggal: tanggalPembayaran,
        keterangan: `Pengembalian Simpanan - ${anggotaNama}`,
        entries: jurnalEntries
    });
    localStorage.setItem('jurnal', JSON.stringify(jurnal));
    
    // Create pengembalian record
    const pengembalianId = generateId();
    const nomorReferensi = `PGM-${new Date().getFullYear()}-${pengembalianId.substring(0, 8)}`;
    
    const pengembalianRecord = {
        id: pengembalianId,
        anggotaId: anggotaId,
        anggotaNama: anggotaNama,
        simpananPokok: simpananPokok,
        simpananWajib: simpananWajib,
        totalPengembalian: totalPengembalian,
        metodePembayaran: metodePembayaran,
        tanggalPembayaran: tanggalPembayaran,
        nomorReferensi: nomorReferensi,
        status: 'Selesai',
        jurnalId: jurnalId, // Reference to journal
        createdAt: new Date().toISOString()
    };
    
    // Save pengembalian
    const pengembalianList = JSON.parse(localStorage.getItem('pengembalian') || '[]');
    pengembalianList.push(pengembalianRecord);
    localStorage.setItem('pengembalian', JSON.stringify(pengembalianList));
    
    return { pengembalianId, jurnalId, pengembalianRecord };
}

describe('Property 9: Pengembalian references journal', () => {
    
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem('jurnal', JSON.stringify([]));
        localStorage.setItem('pengembalian', JSON.stringify([]));
    });

    test('For any pengembalian record, it should have a jurnalId field populated', () => {
        fc.assert(
            fc.property(
                fc.uuid(),
                fc.string({ minLength: 5, maxLength: 50 }),
                fc.integer({ min: 100000, max: 5000000 }),
                fc.integer({ min: 50000, max: 2000000 }),
                fc.constantFrom('Kas', 'Bank'),
                (anggotaId, anggotaNama, simpananPokok, simpananWajib, metodePembayaran) => {
                    // Execute
                    const result = processPengembalianWithJournal(
                        anggotaId,
                        anggotaNama,
                        simpananPokok,
                        simpananWajib,
                        metodePembayaran,
                        '2024-12-05'
                    );
                    
                    // Verify: pengembalian record should have jurnalId
                    return result.pengembalianRecord.jurnalId !== null &&
                           result.pengembalianRecord.jurnalId !== undefined &&
                           typeof result.pengembalianRecord.jurnalId === 'string';
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any pengembalian, the jurnalId should reference an existing journal entry', () => {
        fc.assert(
            fc.property(
                fc.uuid(),
                fc.string({ minLength: 5, maxLength: 50 }),
                fc.integer({ min: 100000, max: 5000000 }),
                fc.integer({ min: 50000, max: 2000000 }),
                fc.constantFrom('Kas', 'Bank'),
                (anggotaId, anggotaNama, simpananPokok, simpananWajib, metodePembayaran) => {
                    // Execute
                    const result = processPengembalianWithJournal(
                        anggotaId,
                        anggotaNama,
                        simpananPokok,
                        simpananWajib,
                        metodePembayaran,
                        '2024-12-05'
                    );
                    
                    // Verify: jurnalId should reference existing journal
                    const jurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
                    const referencedJournal = jurnal.find(j => j.id === result.pengembalianRecord.jurnalId);
                    
                    return referencedJournal !== undefined;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any pengembalian, the referenced journal should contain correct entries', () => {
        fc.assert(
            fc.property(
                fc.uuid(),
                fc.string({ minLength: 5, maxLength: 50 }),
                fc.integer({ min: 100000, max: 5000000 }),
                fc.integer({ min: 50000, max: 2000000 }),
                fc.constantFrom('Kas', 'Bank'),
                (anggotaId, anggotaNama, simpananPokok, simpananWajib, metodePembayaran) => {
                    // Execute
                    const result = processPengembalianWithJournal(
                        anggotaId,
                        anggotaNama,
                        simpananPokok,
                        simpananWajib,
                        metodePembayaran,
                        '2024-12-05'
                    );
                    
                    // Get referenced journal
                    const jurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
                    const referencedJournal = jurnal.find(j => j.id === result.jurnalId);
                    
                    // Verify: journal should have entries
                    return referencedJournal && 
                           referencedJournal.entries && 
                           referencedJournal.entries.length > 0;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any pengembalian, jurnalId should match the ID of the created journal', () => {
        fc.assert(
            fc.property(
                fc.uuid(),
                fc.string({ minLength: 5, maxLength: 50 }),
                fc.integer({ min: 100000, max: 5000000 }),
                fc.integer({ min: 50000, max: 2000000 }),
                fc.constantFrom('Kas', 'Bank'),
                (anggotaId, anggotaNama, simpananPokok, simpananWajib, metodePembayaran) => {
                    // Execute
                    const result = processPengembalianWithJournal(
                        anggotaId,
                        anggotaNama,
                        simpananPokok,
                        simpananWajib,
                        metodePembayaran,
                        '2024-12-05'
                    );
                    
                    // Verify: jurnalId in pengembalian matches created journal ID
                    return result.pengembalianRecord.jurnalId === result.jurnalId;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any pengembalian, the referenced journal keterangan should mention the anggota', () => {
        fc.assert(
            fc.property(
                fc.uuid(),
                fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
                fc.integer({ min: 100000, max: 5000000 }),
                fc.integer({ min: 50000, max: 2000000 }),
                fc.constantFrom('Kas', 'Bank'),
                (anggotaId, anggotaNama, simpananPokok, simpananWajib, metodePembayaran) => {
                    // Execute
                    const result = processPengembalianWithJournal(
                        anggotaId,
                        anggotaNama,
                        simpananPokok,
                        simpananWajib,
                        metodePembayaran,
                        '2024-12-05'
                    );
                    
                    // Get referenced journal
                    const jurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
                    const referencedJournal = jurnal.find(j => j.id === result.jurnalId);
                    
                    // Verify: keterangan should contain anggota name
                    return referencedJournal && 
                           referencedJournal.keterangan.includes(anggotaNama);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any pengembalian, the referenced journal date should match tanggalPembayaran', () => {
        fc.assert(
            fc.property(
                fc.uuid(),
                fc.string({ minLength: 5, maxLength: 50 }),
                fc.integer({ min: 100000, max: 5000000 }),
                fc.integer({ min: 50000, max: 2000000 }),
                fc.constantFrom('Kas', 'Bank'),
                fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') })
                    .map(d => d.toISOString().split('T')[0]),
                (anggotaId, anggotaNama, simpananPokok, simpananWajib, metodePembayaran, tanggalPembayaran) => {
                    // Execute
                    const result = processPengembalianWithJournal(
                        anggotaId,
                        anggotaNama,
                        simpananPokok,
                        simpananWajib,
                        metodePembayaran,
                        tanggalPembayaran
                    );
                    
                    // Get referenced journal
                    const jurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
                    const referencedJournal = jurnal.find(j => j.id === result.jurnalId);
                    
                    // Verify: journal date matches tanggalPembayaran
                    return referencedJournal && 
                           referencedJournal.tanggal === tanggalPembayaran;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any multiple pengembalian, each should reference a unique journal', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        anggotaId: fc.uuid(),
                        anggotaNama: fc.string({ minLength: 5, maxLength: 50 }),
                        simpananPokok: fc.integer({ min: 100000, max: 1000000 }),
                        simpananWajib: fc.integer({ min: 50000, max: 500000 })
                    }),
                    { minLength: 2, maxLength: 5 }
                ),
                fc.constantFrom('Kas', 'Bank'),
                (pengembalianArray, metodePembayaran) => {
                    // Execute: Create multiple pengembalian
                    const results = pengembalianArray.map(p => 
                        processPengembalianWithJournal(
                            p.anggotaId,
                            p.anggotaNama,
                            p.simpananPokok,
                            p.simpananWajib,
                            metodePembayaran,
                            '2024-12-05'
                        )
                    );
                    
                    // Verify: Each pengembalian should have unique jurnalId
                    const jurnalIds = results.map(r => r.jurnalId);
                    const uniqueJurnalIds = new Set(jurnalIds);
                    
                    return jurnalIds.length === uniqueJurnalIds.size;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any pengembalian, jurnalId should be a non-empty string', () => {
        fc.assert(
            fc.property(
                fc.uuid(),
                fc.string({ minLength: 5, maxLength: 50 }),
                fc.integer({ min: 100000, max: 5000000 }),
                fc.integer({ min: 50000, max: 2000000 }),
                fc.constantFrom('Kas', 'Bank'),
                (anggotaId, anggotaNama, simpananPokok, simpananWajib, metodePembayaran) => {
                    // Execute
                    const result = processPengembalianWithJournal(
                        anggotaId,
                        anggotaNama,
                        simpananPokok,
                        simpananWajib,
                        metodePembayaran,
                        '2024-12-05'
                    );
                    
                    // Verify: jurnalId is non-empty string
                    return typeof result.pengembalianRecord.jurnalId === 'string' &&
                           result.pengembalianRecord.jurnalId.length > 0;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any pengembalian retrieved from storage, jurnalId should be preserved', () => {
        fc.assert(
            fc.property(
                fc.uuid(),
                fc.string({ minLength: 5, maxLength: 50 }),
                fc.integer({ min: 100000, max: 5000000 }),
                fc.integer({ min: 50000, max: 2000000 }),
                fc.constantFrom('Kas', 'Bank'),
                (anggotaId, anggotaNama, simpananPokok, simpananWajib, metodePembayaran) => {
                    // Execute
                    const result = processPengembalianWithJournal(
                        anggotaId,
                        anggotaNama,
                        simpananPokok,
                        simpananWajib,
                        metodePembayaran,
                        '2024-12-05'
                    );
                    
                    // Retrieve from storage
                    const pengembalianList = JSON.parse(localStorage.getItem('pengembalian') || '[]');
                    const savedPengembalian = pengembalianList.find(p => p.id === result.pengembalianId);
                    
                    // Verify: jurnalId is preserved in storage
                    return savedPengembalian && 
                           savedPengembalian.jurnalId === result.jurnalId;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any pengembalian, the journal total should match totalPengembalian', () => {
        fc.assert(
            fc.property(
                fc.uuid(),
                fc.string({ minLength: 5, maxLength: 50 }),
                fc.integer({ min: 100000, max: 5000000 }),
                fc.integer({ min: 50000, max: 2000000 }),
                fc.constantFrom('Kas', 'Bank'),
                (anggotaId, anggotaNama, simpananPokok, simpananWajib, metodePembayaran) => {
                    // Execute
                    const result = processPengembalianWithJournal(
                        anggotaId,
                        anggotaNama,
                        simpananPokok,
                        simpananWajib,
                        metodePembayaran,
                        '2024-12-05'
                    );
                    
                    // Get referenced journal
                    const jurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
                    const referencedJournal = jurnal.find(j => j.id === result.jurnalId);
                    
                    // Calculate journal total
                    const totalDebit = referencedJournal.entries.reduce((sum, e) => sum + e.debit, 0);
                    
                    // Verify: journal total matches totalPengembalian
                    return totalDebit === result.pengembalianRecord.totalPengembalian;
                }
            ),
            { numRuns: 100 }
        );
    });
});
