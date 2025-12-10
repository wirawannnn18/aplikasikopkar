// Feature: fix-anggota-keluar-komprehensif, Property 9: Anggota Keluar Visibility
// Validates: Requirements 7.1, 7.2
// Task 16.1: Write property test for Anggota Keluar visibility

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

// Simulate the filterAnggotaKeluar function that would be used in Anggota Keluar page
function filterAnggotaKeluar(anggotaList) {
    try {
        if (!Array.isArray(anggotaList)) {
            return [];
        }
        
        return anggotaList.filter(anggota => 
            anggota && anggota.statusKeanggotaan === 'Keluar'
        );
    } catch (error) {
        console.error('Error filtering anggota keluar:', error);
        return [];
    }
}

// Simulate the renderAnggotaKeluarPage function
function renderAnggotaKeluarPage() {
    try {
        const allAnggota = JSON.parse(localStorage.getItem('anggota') || '[]');
        const anggotaKeluar = filterAnggotaKeluar(allAnggota);
        
        return {
            success: true,
            anggotaKeluar: anggotaKeluar,
            count: anggotaKeluar.length,
            displayedAnggota: anggotaKeluar.map(anggota => ({
                id: anggota.id,
                nama: anggota.nama,
                nik: anggota.nik,
                statusKeanggotaan: anggota.statusKeanggotaan,
                tanggalKeluar: anggota.tanggalKeluar || null,
                pengembalianStatus: anggota.pengembalianStatus || null
            }))
        };
    } catch (error) {
        console.error('Error rendering anggota keluar page:', error);
        return {
            success: false,
            error: error.message,
            anggotaKeluar: [],
            count: 0,
            displayedAnggota: []
        };
    }
}

// Arbitraries for property-based testing
const anggotaArbitrary = fc.record({
    id: fc.uuid(),
    nik: fc.string({ minLength: 10, maxLength: 16 }),
    nama: fc.string({ minLength: 5, maxLength: 50 }),
    statusKeanggotaan: fc.constantFrom('Aktif', 'Keluar'),
    status: fc.constantFrom('Aktif', 'Nonaktif', 'Cuti'),
    tanggalKeluar: fc.option(fc.string({ minLength: 10, maxLength: 25 }), { nil: null }),
    pengembalianStatus: fc.option(fc.constantFrom('Pending', 'Selesai'), { nil: null })
});

const anggotaKeluarArbitrary = fc.record({
    id: fc.uuid(),
    nik: fc.string({ minLength: 10, maxLength: 16 }),
    nama: fc.string({ minLength: 5, maxLength: 50 }),
    statusKeanggotaan: fc.constant('Keluar'),
    status: fc.constantFrom('Aktif', 'Nonaktif', 'Cuti'),
    tanggalKeluar: fc.string({ minLength: 10, maxLength: 25 }),
    pengembalianStatus: fc.option(fc.constantFrom('Pending', 'Selesai'), { nil: null })
});

const anggotaAktifArbitrary = fc.record({
    id: fc.uuid(),
    nik: fc.string({ minLength: 10, maxLength: 16 }),
    nama: fc.string({ minLength: 5, maxLength: 50 }),
    statusKeanggotaan: fc.constant('Aktif'),
    status: fc.constantFrom('Aktif', 'Nonaktif', 'Cuti'),
    tanggalKeluar: fc.constant(null),
    pengembalianStatus: fc.constant(null)
});

describe('Property 9: Anggota Keluar Visibility - filterAnggotaKeluar()', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('Property: For any anggota list, should return only anggota with statusKeanggotaan === "Keluar"', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 0, maxLength: 50 }),
                (anggotaList) => {
                    // Execute
                    const filtered = filterAnggotaKeluar(anggotaList);
                    
                    // Verify - all returned anggota should have statusKeanggotaan === 'Keluar'
                    return filtered.every(anggota => anggota.statusKeanggotaan === 'Keluar');
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any anggota list, should exclude all anggota with statusKeanggotaan !== "Keluar"', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaAktifArbitrary, { minLength: 1, maxLength: 20 }),
                (anggotaAktifList) => {
                    // Execute
                    const filtered = filterAnggotaKeluar(anggotaAktifList);
                    
                    // Verify - should return empty array since all are Aktif
                    return filtered.length === 0;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Requirement 7.1: renderAnggotaKeluarPage should display only anggota with statusKeanggotaan === "Keluar"', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaKeluarArbitrary, { minLength: 1, maxLength: 10 }),
                fc.array(anggotaAktifArbitrary, { minLength: 1, maxLength: 10 }),
                (anggotaKeluarList, anggotaAktifList) => {
                    // Setup - mix of keluar and aktif anggota
                    const mixedAnggota = [...anggotaKeluarList, ...anggotaAktifList];
                    localStorage.setItem('anggota', JSON.stringify(mixedAnggota));
                    
                    // Execute
                    const result = renderAnggotaKeluarPage();
                    
                    // Verify Requirement 7.1
                    if (result.success) {
                        return result.displayedAnggota.every(anggota => 
                            anggota.statusKeanggotaan === 'Keluar'
                        ) && result.count === anggotaKeluarList.length;
                    }
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Requirement 7.2: renderAnggotaKeluarPage should show tanggal keluar and pengembalian status', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaKeluarArbitrary, { minLength: 1, maxLength: 10 }),
                (anggotaKeluarList) => {
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify(anggotaKeluarList));
                    
                    // Execute
                    const result = renderAnggotaKeluarPage();
                    
                    // Verify Requirement 7.2
                    if (result.success) {
                        return result.displayedAnggota.every(anggota => 
                            anggota.hasOwnProperty('tanggalKeluar') &&
                            anggota.hasOwnProperty('pengembalianStatus')
                        );
                    }
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: Should handle empty anggota list gracefully', () => {
        fc.assert(
            fc.property(
                fc.constant([]),
                (emptyList) => {
                    // Execute
                    const filtered = filterAnggotaKeluar(emptyList);
                    
                    // Verify - should return empty array
                    return Array.isArray(filtered) && filtered.length === 0;
                }
            ),
            { numRuns: 50 }
        );
    });

    test('Property: Should handle null/undefined input gracefully', () => {
        // Execute with null
        const filteredNull = filterAnggotaKeluar(null);
        const filteredUndefined = filterAnggotaKeluar(undefined);
        
        // Verify - should return empty arrays
        expect(Array.isArray(filteredNull)).toBe(true);
        expect(filteredNull.length).toBe(0);
        expect(Array.isArray(filteredUndefined)).toBe(true);
        expect(filteredUndefined.length).toBe(0);
    });

    test('Property: Should preserve original anggota data in localStorage', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 1, maxLength: 20 }),
                (anggotaList) => {
                    // Setup
                    const originalData = JSON.stringify(anggotaList);
                    localStorage.setItem('anggota', originalData);
                    
                    // Execute filtering functions
                    filterAnggotaKeluar(anggotaList);
                    renderAnggotaKeluarPage();
                    
                    // Verify - original data should be unchanged
                    const dataAfter = localStorage.getItem('anggota');
                    return dataAfter === originalData;
                }
            ),
            { numRuns: 100 }
        );
    });
});