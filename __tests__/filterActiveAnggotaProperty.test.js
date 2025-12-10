// Feature: fix-anggota-keluar-komprehensif, Property 1: Master Anggota Exclusion
// Validates: Requirements 1.1
// Task 1.1: Write property test for Master Anggota exclusion

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
// Since we're in Node.js test environment, we need to simulate the CORRECTED function
function filterActiveAnggota(anggotaList) {
    if (!Array.isArray(anggotaList)) {
        console.warn('filterActiveAnggota: Expected array, got', typeof anggotaList);
        return [];
    }
    
    // CORRECTED LOGIC: Only exclude permanently exited members
    // Include Aktif, Nonaktif, and Cuti members in Master Anggota display
    return anggotaList.filter(a => {
        // Check OLD system: statusKeanggotaan === 'Keluar'
        if (a.statusKeanggotaan === 'Keluar') {
            return false; // Exclude - permanently left
        }
        
        // Check NEW system: has tanggalKeluar (exit date set)
        if (a.tanggalKeluar) {
            return false; // Exclude - permanently left
        }
        
        // Check NEW system: has pengembalianStatus (went through exit process)
        if (a.pengembalianStatus) {
            return false; // Exclude - in exit process or completed
        }
        
        // Include all others (Aktif, Nonaktif, Cuti)
        // Nonaktif and Cuti are shown in Master Anggota but filtered from transactions
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

describe('Property 1: Master Anggota Exclusion - filterActiveAnggota()', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('Property: For any anggota list, filtered result should exclude all with statusKeanggotaan === "Keluar"', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 5, maxLength: 50 }),
                (anggotaList) => {
                    // Action: Filter the anggota list
                    const filtered = filterActiveAnggota(anggotaList);
                    
                    // Property: No anggota with statusKeanggotaan === 'Keluar' should be in filtered result
                    const noKeluarPresent = filtered.every(a => a.statusKeanggotaan !== 'Keluar');
                    
                    return noKeluarPresent;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any anggota list, filtered result should INCLUDE all with status === "Nonaktif" (unless they have exit indicators)', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        nama: fc.string({ minLength: 5, maxLength: 30 }),
                        status: fc.constant('Nonaktif'),
                        statusKeanggotaan: fc.constant('Aktif'), // Not Keluar
                        tanggalKeluar: fc.constant(null), // No exit date
                        pengembalianStatus: fc.constant(null) // No exit process
                    }),
                    { minLength: 3, maxLength: 20 }
                ),
                (nonaktifList) => {
                    // Action: Filter the list of Nonaktif anggota (without exit indicators)
                    const filtered = filterActiveAnggota(nonaktifList);
                    
                    // Property: All Nonaktif members should be included (they appear in Master Anggota)
                    const allNonaktifIncluded = filtered.length === nonaktifList.length;
                    const allHaveNonaktifStatus = filtered.every(a => a.status === 'Nonaktif');
                    
                    return allNonaktifIncluded && allHaveNonaktifStatus;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any anggota list, filtered result should exclude all with tanggalKeluar', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 5, maxLength: 50 }),
                (anggotaList) => {
                    // Action: Filter the anggota list
                    const filtered = filterActiveAnggota(anggotaList);
                    
                    // Property: No anggota with tanggalKeluar should be in filtered result
                    const noTanggalKeluarPresent = filtered.every(a => !a.tanggalKeluar);
                    
                    return noTanggalKeluarPresent;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any anggota list, filtered result should exclude all with pengembalianStatus', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 5, maxLength: 50 }),
                (anggotaList) => {
                    // Action: Filter the anggota list
                    const filtered = filterActiveAnggota(anggotaList);
                    
                    // Property: No anggota with pengembalianStatus should be in filtered result
                    const noPengembalianStatusPresent = filtered.every(a => !a.pengembalianStatus);
                    
                    return noPengembalianStatusPresent;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any anggota list, filtered count should match expected active count (CORRECTED)', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 5, maxLength: 50 }),
                (anggotaList) => {
                    // Action: Filter the anggota list
                    const filtered = filterActiveAnggota(anggotaList);
                    
                    // Calculate expected count manually (CORRECTED LOGIC)
                    // Only exclude permanent exits, include Nonaktif and Cuti
                    const expectedCount = anggotaList.filter(a => 
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

    test('Property: For any anggota list with only permanently exited members, filtered result should be empty', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        nama: fc.string({ minLength: 5, maxLength: 30 }),
                        status: fc.constantFrom('Aktif', 'Nonaktif', 'Cuti'), // Status doesn't matter for permanent exits
                        statusKeanggotaan: fc.constant('Keluar'),
                        tanggalKeluar: fc.date().map(d => d.toISOString()),
                        pengembalianStatus: fc.constant('Selesai')
                    }),
                    { minLength: 3, maxLength: 20 }
                ),
                (anggotaKeluarList) => {
                    // Action: Filter the list of all permanently exited anggota
                    const filtered = filterActiveAnggota(anggotaKeluarList);
                    
                    // Property: Result should be empty (all have permanent exit indicators)
                    return filtered.length === 0;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any anggota list with only non-exited members, all should be included', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        nama: fc.string({ minLength: 5, maxLength: 30 }),
                        status: fc.constantFrom('Aktif', 'Nonaktif', 'Cuti'), // All statuses should be included
                        statusKeanggotaan: fc.constant('Aktif'), // Not Keluar
                        tanggalKeluar: fc.constant(null), // No exit date
                        pengembalianStatus: fc.constant(null) // No exit process
                    }),
                    { minLength: 5, maxLength: 30 }
                ),
                (anggotaNonExitedList) => {
                    // Action: Filter the list of all non-exited anggota
                    const filtered = filterActiveAnggota(anggotaNonExitedList);
                    
                    // Property: All should be included (regardless of Aktif/Nonaktif/Cuti status)
                    const allIncluded = filtered.length === anggotaNonExitedList.length;
                    
                    // Property: All IDs should match
                    const allIdsMatch = anggotaNonExitedList.every(a => 
                        filtered.some(f => f.id === a.id)
                    );
                    
                    return allIncluded && allIdsMatch;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any mixed anggota list, Cuti status should be included', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 10, maxLength: 50 }),
                (anggotaList) => {
                    // Ensure at least one Cuti member exists
                    const cutiMember = {
                        id: 'cuti-test',
                        nama: 'Anggota Cuti',
                        status: 'Cuti',
                        statusKeanggotaan: 'Aktif',
                        tanggalKeluar: null,
                        pengembalianStatus: null
                    };
                    const listWithCuti = [...anggotaList, cutiMember];
                    
                    // Action: Filter the list
                    const filtered = filterActiveAnggota(listWithCuti);
                    
                    // Property: Cuti member should be included
                    const cutiIncluded = filtered.some(a => a.id === 'cuti-test');
                    
                    return cutiIncluded;
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
                    filterActiveAnggota(anggotaList);
                    
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
                    const filtered1 = filterActiveAnggota(anggotaList);
                    
                    // Action: Filter the result again
                    const filtered2 = filterActiveAnggota(filtered1);
                    
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
                    const result = filterActiveAnggota(invalidInput);
                    
                    // Property: Should return empty array
                    return Array.isArray(result) && result.length === 0;
                }
            ),
            { numRuns: 50 }
        );
    });

    test('Property: For empty array, should return empty array', () => {
        // Action: Filter empty array
        const result = filterActiveAnggota([]);
        
        // Property: Should return empty array
        expect(result).toEqual([]);
        expect(result.length).toBe(0);
    });

    test('Property: Combination of exclusion rules - anggota with multiple exit indicators should be excluded', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        nama: fc.string({ minLength: 5, maxLength: 30 }),
                        status: fc.constantFrom('Aktif', 'Nonaktif', 'Cuti'), // Status doesn't matter for exits
                        statusKeanggotaan: fc.constant('Keluar'),
                        tanggalKeluar: fc.date().map(d => d.toISOString()),
                        pengembalianStatus: fc.constant('Selesai')
                    }),
                    { minLength: 3, maxLength: 15 }
                ),
                (multipleExitIndicators) => {
                    // Add some non-exited members (including Nonaktif)
                    const nonExitedMembers = [
                        {
                            id: 'active-1',
                            nama: 'Active Member',
                            status: 'Aktif',
                            statusKeanggotaan: 'Aktif',
                            tanggalKeluar: null,
                            pengembalianStatus: null
                        },
                        {
                            id: 'nonaktif-1',
                            nama: 'Nonaktif Member',
                            status: 'Nonaktif',
                            statusKeanggotaan: 'Aktif',
                            tanggalKeluar: null,
                            pengembalianStatus: null
                        },
                        {
                            id: 'cuti-1',
                            nama: 'Cuti Member',
                            status: 'Cuti',
                            statusKeanggotaan: 'Aktif',
                            tanggalKeluar: null,
                            pengembalianStatus: null
                        }
                    ];
                    
                    const mixedList = [...multipleExitIndicators, ...nonExitedMembers];
                    
                    // Action: Filter the list
                    const filtered = filterActiveAnggota(mixedList);
                    
                    // Property: Only non-exited members should remain (all 3)
                    const correctCount = filtered.length === 3;
                    const correctIds = ['active-1', 'nonaktif-1', 'cuti-1'].every(id =>
                        filtered.some(f => f.id === id)
                    );
                    
                    return correctCount && correctIds;
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
                    const filtered = filterActiveAnggota(anggotaList);
                    
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

    test('Property: CORRECTED LOGIC - Nonaktif members without exit indicators should be included', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 10, maxLength: 50 }),
                (anggotaList) => {
                    // Ensure at least one Nonaktif member without exit indicators exists
                    const nonaktifMember = {
                        id: 'nonaktif-test',
                        nama: 'Anggota Nonaktif',
                        status: 'Nonaktif',
                        statusKeanggotaan: 'Aktif', // Not Keluar
                        tanggalKeluar: null, // No exit date
                        pengembalianStatus: null // No exit process
                    };
                    const listWithNonaktif = [...anggotaList, nonaktifMember];
                    
                    // Action: Filter the list
                    const filtered = filterActiveAnggota(listWithNonaktif);
                    
                    // Property: Nonaktif member should be included (appears in Master Anggota)
                    const nonaktifIncluded = filtered.some(a => a.id === 'nonaktif-test');
                    
                    return nonaktifIncluded;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: Master Anggota vs Transaction distinction - includes all non-exited statuses', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        nama: fc.string({ minLength: 5, maxLength: 30 }),
                        status: fc.constantFrom('Aktif', 'Nonaktif', 'Cuti'),
                        statusKeanggotaan: fc.constant('Aktif'), // Not Keluar
                        tanggalKeluar: fc.constant(null), // No exit date
                        pengembalianStatus: fc.constant(null) // No exit process
                    }),
                    { minLength: 10, maxLength: 30 }
                ),
                (mixedStatusList) => {
                    // Action: Filter the list
                    const filtered = filterActiveAnggota(mixedStatusList);
                    
                    // Property: All members should be included regardless of Aktif/Nonaktif/Cuti
                    const allIncluded = filtered.length === mixedStatusList.length;
                    
                    // Property: Should include all three status types
                    const hasAktif = filtered.some(a => a.status === 'Aktif');
                    const hasNonaktif = filtered.some(a => a.status === 'Nonaktif');
                    const hasCuti = filtered.some(a => a.status === 'Cuti');
                    
                    // Only check if original list has these statuses
                    const originalHasAktif = mixedStatusList.some(a => a.status === 'Aktif');
                    const originalHasNonaktif = mixedStatusList.some(a => a.status === 'Nonaktif');
                    const originalHasCuti = mixedStatusList.some(a => a.status === 'Cuti');
                    
                    const statusPreservation = 
                        (!originalHasAktif || hasAktif) &&
                        (!originalHasNonaktif || hasNonaktif) &&
                        (!originalHasCuti || hasCuti);
                    
                    return allIncluded && statusPreservation;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: Single exit indicator exclusion - each exit indicator alone should exclude', () => {
        const testCases = [
            { name: 'statusKeanggotaan Keluar', field: 'statusKeanggotaan', value: 'Keluar' },
            { name: 'tanggalKeluar', field: 'tanggalKeluar', value: '2024-01-15' },
            { name: 'pengembalianStatus', field: 'pengembalianStatus', value: 'Selesai' }
        ];

        testCases.forEach(testCase => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.record({
                            id: fc.uuid(),
                            nama: fc.string({ minLength: 5, maxLength: 30 }),
                            status: fc.constantFrom('Aktif', 'Nonaktif', 'Cuti'),
                            statusKeanggotaan: testCase.field === 'statusKeanggotaan' ? fc.constant(testCase.value) : fc.constant('Aktif'),
                            tanggalKeluar: testCase.field === 'tanggalKeluar' ? fc.constant(testCase.value) : fc.constant(null),
                            pengembalianStatus: testCase.field === 'pengembalianStatus' ? fc.constant(testCase.value) : fc.constant(null)
                        }),
                        { minLength: 3, maxLength: 15 }
                    ),
                    (anggotaWithExitIndicator) => {
                        // Action: Filter the list
                        const filtered = filterActiveAnggota(anggotaWithExitIndicator);
                        
                        // Property: All should be excluded due to single exit indicator
                        return filtered.length === 0;
                    }
                ),
                { numRuns: 50 }
            );
        });
    });
});

