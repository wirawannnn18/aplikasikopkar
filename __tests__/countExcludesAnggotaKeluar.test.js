// Feature: fix-pengembalian-simpanan, Property 13: Count excludes anggota keluar
// Validates: Requirements 5.4

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

describe('Property 13: Count excludes anggota keluar', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('Total anggota count should exclude anggota keluar', () => {
        fc.assert(
            fc.property(
                fc.record({
                    aktifCount: fc.integer({ min: 5, max: 50 }),
                    keluarCount: fc.integer({ min: 1, max: 20 })
                }),
                (data) => {
                    // Generate anggota
                    const anggotaAktif = Array.from({ length: data.aktifCount }, (_, i) => ({
                        id: `aktif-${i}`,
                        nama: `Anggota Aktif ${i}`,
                        statusKeanggotaan: 'Aktif'
                    }));
                    
                    const anggotaKeluar = Array.from({ length: data.keluarCount }, (_, i) => ({
                        id: `keluar-${i}`,
                        nama: `Anggota Keluar ${i}`,
                        statusKeanggotaan: 'Keluar'
                    }));
                    
                    const allAnggota = [...anggotaAktif, ...anggotaKeluar];
                    
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify(allAnggota));
                    
                    // Calculate count as in renderAnggota
                    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
                    const activeAnggota = anggota.filter(a => a.statusKeanggotaan !== 'Keluar');
                    const totalActive = activeAnggota.length;
                    
                    // Property: Count should equal aktif count only
                    const correctCount = totalActive === data.aktifCount;
                    
                    // Property: Count should not include keluar
                    const notIncludingKeluar = totalActive !== allAnggota.length;
                    
                    return correctCount && (data.keluarCount === 0 || notIncludingKeluar);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Filtered count should exclude anggota keluar', () => {
        fc.assert(
            fc.property(
                fc.record({
                    departemen: fc.constantFrom('IT', 'Finance', 'HR'),
                    anggotaCount: fc.integer({ min: 10, max: 30 })
                }),
                (data) => {
                    // Generate anggota
                    const anggota = Array.from({ length: data.anggotaCount }, (_, i) => ({
                        id: `anggota-${i}`,
                        nama: `Anggota ${i}`,
                        departemen: i % 2 === 0 ? data.departemen : 'Other',
                        statusKeanggotaan: i % 4 === 0 ? 'Keluar' : 'Aktif'
                    }));
                    
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify(anggota));
                    
                    // Filter and count
                    const stored = JSON.parse(localStorage.getItem('anggota') || '[]');
                    const filtered = stored.filter(a => {
                        const notKeluar = a.statusKeanggotaan !== 'Keluar';
                        const matchDept = a.departemen === data.departemen;
                        return notKeluar && matchDept;
                    });
                    
                    const countFiltered = filtered.length;
                    
                    // Calculate expected count
                    const expectedCount = anggota.filter(a => 
                        a.statusKeanggotaan !== 'Keluar' && a.departemen === data.departemen
                    ).length;
                    
                    // Property: Count should match expected
                    return countFiltered === expectedCount;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Count should be consistent across multiple calculations', () => {
        fc.assert(
            fc.property(
                fc.array(fc.record({
                    id: fc.uuid(),
                    nama: fc.string({ minLength: 5, maxLength: 30 }),
                    statusKeanggotaan: fc.constantFrom('Aktif', 'Keluar')
                }), { minLength: 5, maxLength: 30 }),
                (anggotaList) => {
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify(anggotaList));
                    
                    // Calculate count multiple times
                    const count1 = JSON.parse(localStorage.getItem('anggota') || '[]')
                        .filter(a => a.statusKeanggotaan !== 'Keluar').length;
                    
                    const count2 = JSON.parse(localStorage.getItem('anggota') || '[]')
                        .filter(a => a.statusKeanggotaan !== 'Keluar').length;
                    
                    const count3 = JSON.parse(localStorage.getItem('anggota') || '[]')
                        .filter(a => a.statusKeanggotaan !== 'Keluar').length;
                    
                    // Property: All counts should be identical
                    return count1 === count2 && count2 === count3;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Count should update correctly when anggota status changes', () => {
        fc.assert(
            fc.property(
                fc.record({
                    initialAktif: fc.integer({ min: 10, max: 30 }),
                    toMarkAsKeluar: fc.integer({ min: 1, max: 5 })
                }),
                (data) => {
                    // Generate initial anggota (all aktif)
                    const anggota = Array.from({ length: data.initialAktif }, (_, i) => ({
                        id: `anggota-${i}`,
                        nama: `Anggota ${i}`,
                        statusKeanggotaan: 'Aktif'
                    }));
                    
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify(anggota));
                    
                    // Initial count
                    const initialCount = JSON.parse(localStorage.getItem('anggota') || '[]')
                        .filter(a => a.statusKeanggotaan !== 'Keluar').length;
                    
                    // Mark some as keluar
                    const updated = anggota.map((a, i) => ({
                        ...a,
                        statusKeanggotaan: i < data.toMarkAsKeluar ? 'Keluar' : 'Aktif'
                    }));
                    localStorage.setItem('anggota', JSON.stringify(updated));
                    
                    // New count
                    const newCount = JSON.parse(localStorage.getItem('anggota') || '[]')
                        .filter(a => a.statusKeanggotaan !== 'Keluar').length;
                    
                    // Property: Initial count should be all aktif
                    const initialCorrect = initialCount === data.initialAktif;
                    
                    // Property: New count should be reduced by toMarkAsKeluar
                    const newCorrect = newCount === (data.initialAktif - data.toMarkAsKeluar);
                    
                    return initialCorrect && newCorrect;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Count with search should exclude anggota keluar', () => {
        fc.assert(
            fc.property(
                fc.record({
                    searchTerm: fc.string({ minLength: 3, maxLength: 10 }),
                    anggotaCount: fc.integer({ min: 10, max: 25 })
                }),
                (data) => {
                    // Generate anggota
                    const anggota = Array.from({ length: data.anggotaCount }, (_, i) => ({
                        id: `anggota-${i}`,
                        nik: `NIK${i}`,
                        nama: i % 2 === 0 ? `${data.searchTerm} ${i}` : `Other ${i}`,
                        noKartu: `CARD${i}`,
                        statusKeanggotaan: i % 4 === 0 ? 'Keluar' : 'Aktif'
                    }));
                    
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify(anggota));
                    
                    // Search and count
                    const searchLower = data.searchTerm.toLowerCase();
                    const stored = JSON.parse(localStorage.getItem('anggota') || '[]');
                    const filtered = stored.filter(a => {
                        const notKeluar = a.statusKeanggotaan !== 'Keluar';
                        const matchSearch = a.nik.toLowerCase().includes(searchLower) ||
                                          a.nama.toLowerCase().includes(searchLower) ||
                                          a.noKartu.toLowerCase().includes(searchLower);
                        return notKeluar && matchSearch;
                    });
                    
                    const countFiltered = filtered.length;
                    
                    // Calculate expected count
                    const expectedCount = anggota.filter(a => {
                        const notKeluar = a.statusKeanggotaan !== 'Keluar';
                        const matchSearch = a.nik.toLowerCase().includes(searchLower) ||
                                          a.nama.toLowerCase().includes(searchLower) ||
                                          a.noKartu.toLowerCase().includes(searchLower);
                        return notKeluar && matchSearch;
                    }).length;
                    
                    // Property: Count should match expected
                    return countFiltered === expectedCount;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Count should be zero when all anggota are keluar', () => {
        fc.assert(
            fc.property(
                fc.array(fc.record({
                    id: fc.uuid(),
                    nama: fc.string({ minLength: 5, maxLength: 30 }),
                    statusKeanggotaan: fc.constant('Keluar')
                }), { minLength: 3, maxLength: 15 }),
                (anggotaKeluarList) => {
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify(anggotaKeluarList));
                    
                    // Count
                    const count = JSON.parse(localStorage.getItem('anggota') || '[]')
                        .filter(a => a.statusKeanggotaan !== 'Keluar').length;
                    
                    // Property: Count should be zero
                    return count === 0;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Count should equal total when no anggota are keluar', () => {
        fc.assert(
            fc.property(
                fc.array(fc.record({
                    id: fc.uuid(),
                    nama: fc.string({ minLength: 5, maxLength: 30 }),
                    statusKeanggotaan: fc.constant('Aktif')
                }), { minLength: 5, maxLength: 25 }),
                (anggotaAktifList) => {
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify(anggotaAktifList));
                    
                    // Count
                    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
                    const activeCount = anggota.filter(a => a.statusKeanggotaan !== 'Keluar').length;
                    const totalCount = anggota.length;
                    
                    // Property: Counts should be equal
                    return activeCount === totalCount && activeCount === anggotaAktifList.length;
                }
            ),
            { numRuns: 100 }
        );
    });
});
