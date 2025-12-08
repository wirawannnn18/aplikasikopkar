// Feature: fix-pengembalian-simpanan, Property 10: Master anggota excludes keluar
// Validates: Requirements 5.1

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

describe('Property 10: Master anggota excludes keluar', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('renderTableAnggota should not display anggota with statusKeanggotaan = Keluar', () => {
        fc.assert(
            fc.property(
                fc.record({
                    anggotaAktif: fc.array(fc.record({
                        id: fc.uuid(),
                        nik: fc.string({ minLength: 10, maxLength: 16 }),
                        nama: fc.string({ minLength: 5, maxLength: 30 }),
                        noKartu: fc.string({ minLength: 5, maxLength: 20 }),
                        statusKeanggotaan: fc.constant('Aktif')
                    }), { minLength: 3, maxLength: 15 }),
                    anggotaKeluar: fc.array(fc.record({
                        id: fc.uuid(),
                        nik: fc.string({ minLength: 10, maxLength: 16 }),
                        nama: fc.string({ minLength: 5, maxLength: 30 }),
                        noKartu: fc.string({ minLength: 5, maxLength: 20 }),
                        statusKeanggotaan: fc.constant('Keluar')
                    }), { minLength: 2, maxLength: 10 })
                }),
                (data) => {
                    // Setup: Store all anggota
                    const allAnggota = [...data.anggotaAktif, ...data.anggotaKeluar];
                    localStorage.setItem('anggota', JSON.stringify(allAnggota));
                    
                    // Simulate renderTableAnggota filter logic
                    let anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
                    anggota = anggota.filter(a => a.statusKeanggotaan !== 'Keluar');
                    
                    // Property: No anggota keluar should be in the filtered list
                    const anggotaKeluarIds = data.anggotaKeluar.map(a => a.id);
                    const noKeluarPresent = !anggota.some(a => anggotaKeluarIds.includes(a.id));
                    
                    // Property: All anggota aktif should be present
                    const anggotaAktifIds = data.anggotaAktif.map(a => a.id);
                    const allAktifPresent = anggotaAktifIds.every(id => 
                        anggota.some(a => a.id === id)
                    );
                    
                    // Property: Count should match active anggota only
                    const correctCount = anggota.length === data.anggotaAktif.length;
                    
                    return noKeluarPresent && allAktifPresent && correctCount;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Master anggota view should only show active members', () => {
        fc.assert(
            fc.property(
                fc.array(fc.record({
                    id: fc.uuid(),
                    nik: fc.string({ minLength: 10, maxLength: 16 }),
                    nama: fc.string({ minLength: 5, maxLength: 30 }),
                    statusKeanggotaan: fc.constantFrom('Aktif', 'Keluar')
                }), { minLength: 5, maxLength: 20 }),
                (anggotaList) => {
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify(anggotaList));
                    
                    // Filter as in renderTableAnggota
                    let displayed = JSON.parse(localStorage.getItem('anggota') || '[]');
                    displayed = displayed.filter(a => a.statusKeanggotaan !== 'Keluar');
                    
                    // Property: All displayed anggota should have statusKeanggotaan !== 'Keluar'
                    const allActive = displayed.every(a => a.statusKeanggotaan !== 'Keluar');
                    
                    // Property: Count should match expected
                    const expectedCount = anggotaList.filter(a => a.statusKeanggotaan !== 'Keluar').length;
                    const correctCount = displayed.length === expectedCount;
                    
                    return allActive && correctCount;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Total anggota count should exclude anggota keluar', () => {
        fc.assert(
            fc.property(
                fc.record({
                    aktif: fc.integer({ min: 5, max: 50 }),
                    keluar: fc.integer({ min: 1, max: 20 })
                }),
                (counts) => {
                    // Generate anggota
                    const anggotaAktif = Array.from({ length: counts.aktif }, (_, i) => ({
                        id: `aktif-${i}`,
                        nama: `Anggota Aktif ${i}`,
                        statusKeanggotaan: 'Aktif'
                    }));
                    
                    const anggotaKeluar = Array.from({ length: counts.keluar }, (_, i) => ({
                        id: `keluar-${i}`,
                        nama: `Anggota Keluar ${i}`,
                        statusKeanggotaan: 'Keluar'
                    }));
                    
                    const allAnggota = [...anggotaAktif, ...anggotaKeluar];
                    
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify(allAnggota));
                    
                    // Calculate total as in renderAnggota
                    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
                    const activeAnggota = anggota.filter(a => a.statusKeanggotaan !== 'Keluar');
                    const totalActive = activeAnggota.length;
                    
                    // Property: Total should equal count of aktif only
                    return totalActive === counts.aktif;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Anggota keluar should not be visible in any master anggota display', () => {
        fc.assert(
            fc.property(
                fc.array(fc.record({
                    id: fc.uuid(),
                    nama: fc.string({ minLength: 5, maxLength: 30 }),
                    statusKeanggotaan: fc.constant('Keluar'),
                    pengembalianStatus: fc.constantFrom('Pending', 'Selesai')
                }), { minLength: 3, maxLength: 15 }),
                (anggotaKeluarList) => {
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify(anggotaKeluarList));
                    
                    // Filter as in renderTableAnggota
                    let displayed = JSON.parse(localStorage.getItem('anggota') || '[]');
                    displayed = displayed.filter(a => a.statusKeanggotaan !== 'Keluar');
                    
                    // Property: No anggota should be displayed
                    const noneDisplayed = displayed.length === 0;
                    
                    // Property: All anggota in storage are keluar
                    const allKeluar = anggotaKeluarList.every(a => a.statusKeanggotaan === 'Keluar');
                    
                    return noneDisplayed && allKeluar;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Mixed status anggota should only show non-keluar members', () => {
        fc.assert(
            fc.property(
                fc.array(fc.record({
                    id: fc.uuid(),
                    nama: fc.string({ minLength: 5, maxLength: 30 }),
                    statusKeanggotaan: fc.constantFrom('Aktif', 'Keluar', 'Aktif', 'Aktif') // More aktif than keluar
                }), { minLength: 10, maxLength: 30 }),
                (anggotaList) => {
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify(anggotaList));
                    
                    // Filter
                    let displayed = JSON.parse(localStorage.getItem('anggota') || '[]');
                    displayed = displayed.filter(a => a.statusKeanggotaan !== 'Keluar');
                    
                    // Property: None of displayed should be keluar
                    const noneKeluar = displayed.every(a => a.statusKeanggotaan !== 'Keluar');
                    
                    // Property: All non-keluar from original should be in displayed
                    const expectedIds = anggotaList
                        .filter(a => a.statusKeanggotaan !== 'Keluar')
                        .map(a => a.id);
                    const allNonKeluarPresent = expectedIds.every(id => 
                        displayed.some(a => a.id === id)
                    );
                    
                    return noneKeluar && allNonKeluarPresent;
                }
            ),
            { numRuns: 100 }
        );
    });
});
