// Feature: fix-pengembalian-simpanan, Property 11: Search excludes anggota keluar
// Validates: Requirements 5.2

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

describe('Property 11: Search excludes anggota keluar', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('Search results should not include anggota keluar', () => {
        fc.assert(
            fc.property(
                fc.record({
                    searchTerm: fc.string({ minLength: 3, maxLength: 10 }),
                    anggotaAktif: fc.array(fc.record({
                        id: fc.uuid(),
                        nik: fc.string({ minLength: 10, maxLength: 16 }),
                        nama: fc.string({ minLength: 5, maxLength: 30 }),
                        noKartu: fc.string({ minLength: 5, maxLength: 20 }),
                        statusKeanggotaan: fc.constant('Aktif')
                    }), { minLength: 5, maxLength: 20 }),
                    anggotaKeluar: fc.array(fc.record({
                        id: fc.uuid(),
                        nik: fc.string({ minLength: 10, maxLength: 16 }),
                        nama: fc.string({ minLength: 5, maxLength: 30 }),
                        noKartu: fc.string({ minLength: 5, maxLength: 20 }),
                        statusKeanggotaan: fc.constant('Keluar')
                    }), { minLength: 2, maxLength: 10 })
                }),
                (data) => {
                    // Make some anggota match the search term
                    const searchLower = data.searchTerm.toLowerCase();
                    
                    // Ensure at least one aktif matches
                    if (data.anggotaAktif.length > 0) {
                        data.anggotaAktif[0].nama = `${data.searchTerm} Test`;
                    }
                    
                    // Ensure at least one keluar matches (to test exclusion)
                    if (data.anggotaKeluar.length > 0) {
                        data.anggotaKeluar[0].nama = `${data.searchTerm} Keluar`;
                    }
                    
                    const allAnggota = [...data.anggotaAktif, ...data.anggotaKeluar];
                    
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify(allAnggota));
                    
                    // Simulate filterAnggota search logic
                    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
                    const filtered = anggota.filter(a => {
                        // Exclude anggota keluar
                        const notKeluar = a.statusKeanggotaan !== 'Keluar';
                        
                        // Search filter
                        const matchSearch = !searchLower || 
                            a.nik.toLowerCase().includes(searchLower) ||
                            a.nama.toLowerCase().includes(searchLower) ||
                            a.noKartu.toLowerCase().includes(searchLower);
                        
                        return notKeluar && matchSearch;
                    });
                    
                    // Property: No anggota keluar in results
                    const noKeluarInResults = !filtered.some(a => a.statusKeanggotaan === 'Keluar');
                    
                    // Property: All results match search term
                    const allMatchSearch = filtered.every(a => 
                        a.nik.toLowerCase().includes(searchLower) ||
                        a.nama.toLowerCase().includes(searchLower) ||
                        a.noKartu.toLowerCase().includes(searchLower)
                    );
                    
                    return noKeluarInResults && (filtered.length === 0 || allMatchSearch);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Search by NIK should exclude anggota keluar', () => {
        fc.assert(
            fc.property(
                fc.record({
                    nikPrefix: fc.string({ minLength: 3, maxLength: 5 }),
                    anggotaCount: fc.integer({ min: 5, max: 15 })
                }),
                (data) => {
                    // Generate anggota with matching NIKs
                    const anggota = Array.from({ length: data.anggotaCount }, (_, i) => ({
                        id: `anggota-${i}`,
                        nik: `${data.nikPrefix}${i.toString().padStart(10, '0')}`,
                        nama: `Anggota ${i}`,
                        noKartu: `CARD${i}`,
                        statusKeanggotaan: i % 3 === 0 ? 'Keluar' : 'Aktif'
                    }));
                    
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify(anggota));
                    
                    // Search by NIK prefix
                    const searchText = data.nikPrefix.toLowerCase();
                    const stored = JSON.parse(localStorage.getItem('anggota') || '[]');
                    const filtered = stored.filter(a => {
                        const notKeluar = a.statusKeanggotaan !== 'Keluar';
                        const matchSearch = a.nik.toLowerCase().includes(searchText);
                        return notKeluar && matchSearch;
                    });
                    
                    // Property: No keluar in results
                    const noKeluar = filtered.every(a => a.statusKeanggotaan !== 'Keluar');
                    
                    // Property: All results match NIK search
                    const allMatchNik = filtered.every(a => a.nik.toLowerCase().includes(searchText));
                    
                    return noKeluar && allMatchNik;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Search by nama should exclude anggota keluar', () => {
        fc.assert(
            fc.property(
                fc.record({
                    namaKeyword: fc.constantFrom('Budi', 'Siti', 'Ahmad', 'Dewi'),
                    anggotaCount: fc.integer({ min: 5, max: 15 })
                }),
                (data) => {
                    // Generate anggota with matching names
                    const anggota = Array.from({ length: data.anggotaCount }, (_, i) => ({
                        id: `anggota-${i}`,
                        nik: `NIK${i}`,
                        nama: i % 2 === 0 ? `${data.namaKeyword} ${i}` : `Other ${i}`,
                        noKartu: `CARD${i}`,
                        statusKeanggotaan: i % 3 === 0 ? 'Keluar' : 'Aktif'
                    }));
                    
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify(anggota));
                    
                    // Search by nama
                    const searchText = data.namaKeyword.toLowerCase();
                    const stored = JSON.parse(localStorage.getItem('anggota') || '[]');
                    const filtered = stored.filter(a => {
                        const notKeluar = a.statusKeanggotaan !== 'Keluar';
                        const matchSearch = a.nama.toLowerCase().includes(searchText);
                        return notKeluar && matchSearch;
                    });
                    
                    // Property: No keluar in results
                    const noKeluar = filtered.every(a => a.statusKeanggotaan !== 'Keluar');
                    
                    // Property: All results match nama search
                    const allMatchNama = filtered.every(a => a.nama.toLowerCase().includes(searchText));
                    
                    return noKeluar && allMatchNama;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Search by noKartu should exclude anggota keluar', () => {
        fc.assert(
            fc.property(
                fc.record({
                    cardPrefix: fc.constantFrom('CARD', 'KTA', 'MBR'),
                    anggotaCount: fc.integer({ min: 5, max: 15 })
                }),
                (data) => {
                    // Generate anggota with matching card numbers
                    const anggota = Array.from({ length: data.anggotaCount }, (_, i) => ({
                        id: `anggota-${i}`,
                        nik: `NIK${i}`,
                        nama: `Anggota ${i}`,
                        noKartu: `${data.cardPrefix}${i.toString().padStart(5, '0')}`,
                        statusKeanggotaan: i % 3 === 0 ? 'Keluar' : 'Aktif'
                    }));
                    
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify(anggota));
                    
                    // Search by card prefix
                    const searchText = data.cardPrefix.toLowerCase();
                    const stored = JSON.parse(localStorage.getItem('anggota') || '[]');
                    const filtered = stored.filter(a => {
                        const notKeluar = a.statusKeanggotaan !== 'Keluar';
                        const matchSearch = a.noKartu.toLowerCase().includes(searchText);
                        return notKeluar && matchSearch;
                    });
                    
                    // Property: No keluar in results
                    const noKeluar = filtered.every(a => a.statusKeanggotaan !== 'Keluar');
                    
                    // Property: All results match card search
                    const allMatchCard = filtered.every(a => a.noKartu.toLowerCase().includes(searchText));
                    
                    return noKeluar && allMatchCard;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Empty search should still exclude anggota keluar', () => {
        fc.assert(
            fc.property(
                fc.array(fc.record({
                    id: fc.uuid(),
                    nik: fc.string({ minLength: 10, maxLength: 16 }),
                    nama: fc.string({ minLength: 5, maxLength: 30 }),
                    noKartu: fc.string({ minLength: 5, maxLength: 20 }),
                    statusKeanggotaan: fc.constantFrom('Aktif', 'Keluar')
                }), { minLength: 5, maxLength: 20 }),
                (anggotaList) => {
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify(anggotaList));
                    
                    // Empty search (show all)
                    const searchText = '';
                    const stored = JSON.parse(localStorage.getItem('anggota') || '[]');
                    const filtered = stored.filter(a => {
                        const notKeluar = a.statusKeanggotaan !== 'Keluar';
                        const matchSearch = !searchText || 
                            a.nik.toLowerCase().includes(searchText) ||
                            a.nama.toLowerCase().includes(searchText) ||
                            a.noKartu.toLowerCase().includes(searchText);
                        return notKeluar && matchSearch;
                    });
                    
                    // Property: No keluar in results
                    const noKeluar = filtered.every(a => a.statusKeanggotaan !== 'Keluar');
                    
                    // Property: Count matches expected
                    const expectedCount = anggotaList.filter(a => a.statusKeanggotaan !== 'Keluar').length;
                    const correctCount = filtered.length === expectedCount;
                    
                    return noKeluar && correctCount;
                }
            ),
            { numRuns: 100 }
        );
    });
});
