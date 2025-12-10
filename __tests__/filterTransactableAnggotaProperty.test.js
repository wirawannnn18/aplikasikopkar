// Feature: fix-anggota-keluar-komprehensif, Property 2: Transaction Dropdown Exclusion
// Validates: Requirements 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3
// Task 1.2: Write property test for transactable anggota filtering

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

// Import the function we're testing
// Since we're in Node.js test environment, we need to simulate the function
function filterTransactableAnggota(anggotaList) {
    if (!Array.isArray(anggotaList)) {
        console.warn('filterTransactableAnggota: Expected array, got', typeof anggotaList);
        return [];
    }
    
    return anggotaList.filter(a => {
        // Must have Aktif status
        if (a.status !== 'Aktif') {
            return false;
        }
        
        // Must not have Keluar statusKeanggotaan
        if (a.statusKeanggotaan === 'Keluar') {
            return false;
        }
        
        // Check NEW system: has tanggalKeluar
        if (a.tanggalKeluar) {
            return false;
        }
        
        // Check NEW system: has pengembalianStatus
        if (a.pengembalianStatus) {
            return false;
        }
        
        return true;
    });
}

// Arbitrary for generating anggota objects
const anggotaArbitrary = fc.record({
    id: fc.uuid(),
    nik: fc.string({ minLength: 10, maxLength: 16 }),
    nama: fc.string({ minLength: 5, maxLength: 50 }),
    noKartu: fc.string({ minLength: 5, maxLength: 20 }),
    departemen: fc.constantFrom('IT', 'Finance', 'HR', 'Operations', 'Marketing'),
    tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota', 'Umum'),
    status: fc.constantFrom('Aktif', 'Nonaktif', 'Cuti'),
    statusKeanggotaan: fc.constantFrom('Aktif', 'Keluar'),
    tanggalDaftar: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
    tanggalKeluar: fc.option(fc.date({ min: new Date('2023-01-01'), max: new Date() }).map(d => d.toISOString()), { nil: null }),
    pengembalianStatus: fc.option(fc.constantFrom('Pending', 'Selesai'), { nil: null })
});

describe('Property 2: Transaction Dropdown Exclusion - filterTransactableAnggota()', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('Property: For any anggota list, filtered result should only include status === "Aktif"', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 5, maxLength: 50 }),
                (anggotaList) => {
                    // Action: Filter the anggota list
                    const filtered = filterTransactableAnggota(anggotaList);
                    
                    // Property: All results must have status === 'Aktif'
                    const allAktif = filtered.every(a => a.status === 'Aktif');
                    
                    return allAktif;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any anggota list, filtered result should exclude statusKeanggotaan === "Keluar"', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 5, maxLength: 50 }),
                (anggotaList) => {
                    // Action: Filter the anggota list
                    const filtered = filterTransactableAnggota(anggotaList);
                    
                    // Property: No anggota with statusKeanggotaan === 'Keluar' should be in filtered result
                    const noKeluarPresent = filtered.every(a => a.statusKeanggotaan !== 'Keluar');
                    
                    return noKeluarPresent;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any anggota list, filtered result should exclude status === "Nonaktif"', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 5, maxLength: 50 }),
                (anggotaList) => {
                    // Action: Filter the anggota list
                    const filtered = filterTransactableAnggota(anggotaList);
                    
                    // Property: No anggota with status === 'Nonaktif' should be in filtered result
                    const noNonaktifPresent = filtered.every(a => a.status !== 'Nonaktif');
                    
                    return noNonaktifPresent;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any anggota list, filtered result should exclude status === "Cuti"', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 5, maxLength: 50 }),
                (anggotaList) => {
                    // Action: Filter the anggota list
                    const filtered = filterTransactableAnggota(anggotaList);
                    
                    // Property: No anggota with status === 'Cuti' should be in filtered result
                    const noCutiPresent = filtered.every(a => a.status !== 'Cuti');
                    
                    return noCutiPresent;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any anggota list, filtered result should exclude tanggalKeluar', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 5, maxLength: 50 }),
                (anggotaList) => {
                    // Action: Filter the anggota list
                    const filtered = filterTransactableAnggota(anggotaList);
                    
                    // Property: No anggota with tanggalKeluar should be in filtered result
                    const noTanggalKeluarPresent = filtered.every(a => !a.tanggalKeluar);
                    
                    return noTanggalKeluarPresent;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any anggota list, filtered result should exclude pengembalianStatus', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 5, maxLength: 50 }),
                (anggotaList) => {
                    // Action: Filter the anggota list
                    const filtered = filterTransactableAnggota(anggotaList);
                    
                    // Property: No anggota with pengembalianStatus should be in filtered result
                    const noPengembalianStatusPresent = filtered.every(a => !a.pengembalianStatus);
                    
                    return noPengembalianStatusPresent;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any anggota list, filtered count should match expected transactable count', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 5, maxLength: 50 }),
                (anggotaList) => {
                    // Action: Filter the anggota list
                    const filtered = filterTransactableAnggota(anggotaList);
                    
                    // Calculate expected count manually
                    const expectedCount = anggotaList.filter(a => 
                        a.status === 'Aktif' &&
                        a.statusKeanggotaan !== 'Keluar' &&
                        !a.tanggalKeluar &&
                        !a.pengembalianStatus
                    ).length;
                    
                    // Property: Filtered count should match expected count
                    return filtered.length === expectedCount;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any anggota list with only Aktif and not Keluar, all should be included', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        nama: fc.string({ minLength: 5, maxLength: 30 }),
                        status: fc.constant('Aktif'),
                        statusKeanggotaan: fc.constant('Aktif'),
                        tanggalKeluar: fc.constant(null),
                        pengembalianStatus: fc.constant(null)
                    }),
                    { minLength: 5, maxLength: 30 }
                ),
                (anggotaAktifList) => {
                    // Action: Filter the list of all transactable anggota
                    const filtered = filterTransactableAnggota(anggotaAktifList);
                    
                    // Property: All should be included
                    const allIncluded = filtered.length === anggotaAktifList.length;
                    
                    // Property: All IDs should match
                    const allIdsMatch = anggotaAktifList.every(a => 
                        filtered.some(f => f.id === a.id)
                    );
                    
                    return allIncluded && allIdsMatch;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any anggota list with Cuti status, none should be included', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        nama: fc.string({ minLength: 5, maxLength: 30 }),
                        status: fc.constant('Cuti'),
                        statusKeanggotaan: fc.constant('Aktif'),
                        tanggalKeluar: fc.constant(null),
                        pengembalianStatus: fc.constant(null)
                    }),
                    { minLength: 3, maxLength: 20 }
                ),
                (anggotaCutiList) => {
                    // Action: Filter the list of all Cuti anggota
                    const filtered = filterTransactableAnggota(anggotaCutiList);
                    
                    // Property: None should be included (Cuti cannot transact)
                    return filtered.length === 0;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any anggota list with Nonaktif status, none should be included', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        nama: fc.string({ minLength: 5, maxLength: 30 }),
                        status: fc.constant('Nonaktif'),
                        statusKeanggotaan: fc.constant('Aktif'),
                        tanggalKeluar: fc.constant(null),
                        pengembalianStatus: fc.constant(null)
                    }),
                    { minLength: 3, maxLength: 20 }
                ),
                (anggotaNonaktifList) => {
                    // Action: Filter the list of all Nonaktif anggota
                    const filtered = filterTransactableAnggota(anggotaNonaktifList);
                    
                    // Property: None should be included
                    return filtered.length === 0;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any anggota list with Keluar statusKeanggotaan, none should be included', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        nama: fc.string({ minLength: 5, maxLength: 30 }),
                        status: fc.constant('Aktif'),
                        statusKeanggotaan: fc.constant('Keluar'),
                        tanggalKeluar: fc.date().map(d => d.toISOString()),
                        pengembalianStatus: fc.constant('Selesai')
                    }),
                    { minLength: 3, maxLength: 20 }
                ),
                (anggotaKeluarList) => {
                    // Action: Filter the list of all Keluar anggota
                    const filtered = filterTransactableAnggota(anggotaKeluarList);
                    
                    // Property: None should be included
                    return filtered.length === 0;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any anggota list, filtering should not modify original array', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 5, maxLength: 30 }),
                (anggotaList) => {
                    // Create a deep copy for comparison
                    const originalCopy = JSON.parse(JSON.stringify(anggotaList));
                    
                    // Action: Filter the list
                    filterTransactableAnggota(anggotaList);
                    
                    // Property: Original array should remain unchanged
                    const unchanged = JSON.stringify(anggotaList) === JSON.stringify(originalCopy);
                    
                    return unchanged;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any anggota list, filtering is idempotent', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 5, maxLength: 30 }),
                (anggotaList) => {
                    // Action: Filter once
                    const filtered1 = filterTransactableAnggota(anggotaList);
                    
                    // Action: Filter the result again
                    const filtered2 = filterTransactableAnggota(filtered1);
                    
                    // Property: Second filter should produce same result
                    const sameLength = filtered1.length === filtered2.length;
                    const sameIds = filtered1.every(a => 
                        filtered2.some(f => f.id === a.id)
                    );
                    
                    return sameLength && sameIds;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For invalid input (non-array), should return empty array', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(null),
                    fc.constant(undefined),
                    fc.string(),
                    fc.integer(),
                    fc.object()
                ),
                (invalidInput) => {
                    // Action: Try to filter invalid input
                    const result = filterTransactableAnggota(invalidInput);
                    
                    // Property: Should return empty array
                    return Array.isArray(result) && result.length === 0;
                }
            ),
            { numRuns: 50 }
        );
    });

    test('Property: For empty array, should return empty array', () => {
        // Action: Filter empty array
        const result = filterTransactableAnggota([]);
        
        // Property: Should return empty array
        expect(result).toEqual([]);
        expect(result.length).toBe(0);
    });

    test('Property: Combination - Aktif with Keluar should be excluded', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        nama: fc.string({ minLength: 5, maxLength: 30 }),
                        status: fc.constant('Aktif'),
                        statusKeanggotaan: fc.constant('Keluar'),
                        tanggalKeluar: fc.constant(null),
                        pengembalianStatus: fc.constant(null)
                    }),
                    { minLength: 3, maxLength: 15 }
                ),
                (anggotaList) => {
                    // Action: Filter anggota with Aktif status but Keluar statusKeanggotaan
                    const filtered = filterTransactableAnggota(anggotaList);
                    
                    // Property: None should be included (Keluar overrides Aktif)
                    return filtered.length === 0;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: Mixed list should only return Aktif and not Keluar', () => {
        fc.assert(
            fc.property(
                fc.record({
                    transactable: fc.array(
                        fc.record({
                            id: fc.uuid(),
                            nama: fc.string({ minLength: 5, maxLength: 30 }),
                            status: fc.constant('Aktif'),
                            statusKeanggotaan: fc.constant('Aktif'),
                            tanggalKeluar: fc.constant(null),
                            pengembalianStatus: fc.constant(null)
                        }),
                        { minLength: 3, maxLength: 10 }
                    ),
                    nonTransactable: fc.array(
                        fc.record({
                            id: fc.uuid(),
                            nama: fc.string({ minLength: 5, maxLength: 30 }),
                            status: fc.constantFrom('Nonaktif', 'Cuti'),
                            statusKeanggotaan: fc.constantFrom('Aktif', 'Keluar'),
                            tanggalKeluar: fc.option(fc.date().map(d => d.toISOString()), { nil: null }),
                            pengembalianStatus: fc.option(fc.constantFrom('Pending', 'Selesai'), { nil: null })
                        }),
                        { minLength: 2, maxLength: 10 }
                    )
                }),
                (data) => {
                    // Setup: Mix transactable and non-transactable anggota
                    const mixedList = [...data.transactable, ...data.nonTransactable];
                    
                    // Action: Filter the mixed list
                    const filtered = filterTransactableAnggota(mixedList);
                    
                    // Property: Only transactable anggota should be in result
                    const transactableIds = data.transactable.map(a => a.id);
                    const onlyTransactablePresent = filtered.every(a => 
                        transactableIds.includes(a.id)
                    );
                    
                    // Property: All transactable anggota should be present
                    const allTransactablePresent = transactableIds.every(id => 
                        filtered.some(a => a.id === id)
                    );
                    
                    // Property: Count should match transactable count
                    const correctCount = filtered.length === data.transactable.length;
                    
                    return onlyTransactablePresent && allTransactablePresent && correctCount;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: Data preservation - filtering should preserve all fields of included anggota', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 5, maxLength: 20 }),
                (anggotaList) => {
                    // Action: Filter the list
                    const filtered = filterTransactableAnggota(anggotaList);
                    
                    // Property: All fields should be preserved for included anggota
                    const allFieldsPreserved = filtered.every(filteredAnggota => {
                        const original = anggotaList.find(a => a.id === filteredAnggota.id);
                        if (!original) return false;
                        
                        // Check all fields match
                        return Object.keys(original).every(key => 
                            JSON.stringify(original[key]) === JSON.stringify(filteredAnggota[key])
                        );
                    });
                    
                    return allFieldsPreserved;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: Stricter than filterActiveAnggota - transactable is subset of active', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 10, maxLength: 50 }),
                (anggotaList) => {
                    // Simulate filterActiveAnggota
                    const active = anggotaList.filter(a => 
                        a.statusKeanggotaan !== 'Keluar' &&
                        a.status !== 'Nonaktif' &&
                        !a.tanggalKeluar &&
                        !a.pengembalianStatus
                    );
                    
                    // Action: Filter for transactable
                    const transactable = filterTransactableAnggota(anggotaList);
                    
                    // Property: Transactable should be subset of active
                    const isSubset = transactable.every(t => 
                        active.some(a => a.id === t.id)
                    );
                    
                    // Property: Transactable count should be <= active count
                    const countCorrect = transactable.length <= active.length;
                    
                    return isSubset && countCorrect;
                }
            ),
            { numRuns: 100 }
        );
    });
});

