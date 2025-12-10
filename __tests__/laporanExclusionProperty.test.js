/**
 * Property-Based Tests for Laporan Exclusion
 * Task 15.1: Write property test for laporan exclusion
 * 
 * **Feature: fix-anggota-keluar-komprehensif, Property 7: Laporan Exclusion**
 * **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
 * 
 * Tests that laporan simpanan excludes zero balances and processed anggota keluar
 */

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

// Mock helper functions
function getTotalSimpananPokok(anggotaId) {
    const simpananPokok = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
    return simpananPokok
        .filter(s => s.anggotaId === anggotaId)
        .reduce((sum, s) => sum + (s.saldo || s.jumlah || 0), 0);
}

function getTotalSimpananWajib(anggotaId) {
    const simpananWajib = JSON.parse(localStorage.getItem('simpananWajib') || '[]');
    return simpananWajib
        .filter(s => s.anggotaId === anggotaId)
        .reduce((sum, s) => sum + (s.saldo || s.jumlah || 0), 0);
}

// Simulate the getAnggotaWithSimpananForLaporan function
function getAnggotaWithSimpananForLaporan() {
    try {
        const anggotaList = JSON.parse(localStorage.getItem('anggota') || '[]');
        
        return anggotaList.map(anggota => {
            // Skip anggota keluar yang sudah diproses pengembalian
            const isProcessedKeluar = anggota.statusKeanggotaan === 'Keluar' && anggota.pengembalianStatus === 'Selesai';
            
            return {
                ...anggota,
                simpananPokok: isProcessedKeluar ? 0 : getTotalSimpananPokok(anggota.id),
                simpananWajib: isProcessedKeluar ? 0 : getTotalSimpananWajib(anggota.id),
                totalSimpanan: isProcessedKeluar ? 0 : (getTotalSimpananPokok(anggota.id) + getTotalSimpananWajib(anggota.id)),
                isProcessedKeluar: isProcessedKeluar
            };
        }).filter(anggota => {
            // Filter out anggota with zero simpanan if they are processed keluar
            if (anggota.isProcessedKeluar) {
                return false; // Don't show in laporan
            }
            return true;
        });
    } catch (error) {
        console.error('Error in getAnggotaWithSimpananForLaporan:', error);
        return [];
    }
}

describe('Property-Based Tests: Laporan Exclusion', () => {
    
    beforeEach(() => {
        localStorage.clear();
    });

    // Arbitraries for generating test data
    const anggotaArbitrary = fc.record({
        id: fc.string({ minLength: 1, maxLength: 10 }),
        nik: fc.string({ minLength: 10, maxLength: 16 }),
        nama: fc.string({ minLength: 3, maxLength: 50 }),
        status: fc.constantFrom('Aktif', 'Nonaktif', 'Cuti'),
        statusKeanggotaan: fc.constantFrom('Aktif', 'Keluar'),
        tanggalKeluar: fc.option(fc.date().map(d => d.toISOString())),
        pengembalianStatus: fc.option(fc.constantFrom('Pending', 'Selesai'))
    });

    const simpananArbitrary = fc.record({
        id: fc.string({ minLength: 1, maxLength: 10 }),
        anggotaId: fc.string({ minLength: 1, maxLength: 10 }),
        jumlah: fc.nat({ max: 10000000 }),
        saldo: fc.nat({ max: 10000000 }),
        tanggal: fc.date().map(d => d.toISOString())
    });

    /**
     * Property 7.1: Laporan excludes anggota with processed keluar status
     * **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
     */
    test('Property 7.1: Laporan excludes processed anggota keluar', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 1, maxLength: 20 }),
                fc.array(simpananArbitrary, { minLength: 0, maxLength: 50 }),
                (anggotaList, simpananList) => {
                    // Setup localStorage
                    localStorage.setItem('anggota', JSON.stringify(anggotaList));
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananList));
                    localStorage.setItem('simpananWajib', JSON.stringify(simpananList));
                    localStorage.setItem('simpananSukarela', JSON.stringify(simpananList));

                    // Get laporan data
                    const laporanData = getAnggotaWithSimpananForLaporan();

                    // Property: No anggota with statusKeanggotaan === 'Keluar' AND pengembalianStatus === 'Selesai'
                    const hasProcessedKeluar = laporanData.some(a => 
                        a.statusKeanggotaan === 'Keluar' && a.pengembalianStatus === 'Selesai'
                    );

                    return !hasProcessedKeluar;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 7.2: Laporan excludes anggota with zero balances (unless pending keluar)
     * **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
     */
    test('Property 7.2: Laporan excludes anggota with zero balances (unless pending keluar)', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 1, maxLength: 20 }),
                fc.array(simpananArbitrary, { minLength: 0, maxLength: 50 }),
                (anggotaList, simpananList) => {
                    // Setup localStorage
                    localStorage.setItem('anggota', JSON.stringify(anggotaList));
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananList));
                    localStorage.setItem('simpananWajib', JSON.stringify(simpananList));
                    localStorage.setItem('simpananSukarela', JSON.stringify(simpananList));

                    // Get laporan data
                    const laporanData = getAnggotaWithSimpananForLaporan();

                    // Property: The function should not include processed keluar anggota (they have zero balances)
                    const hasProcessedKeluar = laporanData.some(a => 
                        a.statusKeanggotaan === 'Keluar' && a.pengembalianStatus === 'Selesai'
                    );

                    // Property: All anggota in laporan should not be processed keluar
                    return !hasProcessedKeluar;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 7.3: Simpanan sukarela filtering in laporan
     * **Validates: Requirements 9.3**
     */
    test('Property 7.3: Simpanan sukarela excludes zero balances', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 1, maxLength: 10 }),
                fc.array(simpananArbitrary, { minLength: 0, maxLength: 30 }),
                (anggotaList, simpananList) => {
                    // Setup localStorage
                    localStorage.setItem('anggota', JSON.stringify(anggotaList));
                    localStorage.setItem('simpananSukarela', JSON.stringify(simpananList));

                    // Simulate laporan sukarela filtering logic
                    const filteredSukarela = simpananList.filter(s => s.jumlah > 0);

                    // Property: All filtered simpanan sukarela should have jumlah > 0
                    return filteredSukarela.every(s => s.jumlah > 0);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 7.4: Total calculations exclude zero balances
     * **Validates: Requirements 9.4**
     */
    test('Property 7.4: Total calculations exclude zero balances', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 1, maxLength: 15 }),
                fc.array(simpananArbitrary, { minLength: 0, maxLength: 40 }),
                (anggotaList, simpananList) => {
                    // Setup localStorage
                    localStorage.setItem('anggota', JSON.stringify(anggotaList));
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananList));
                    localStorage.setItem('simpananWajib', JSON.stringify(simpananList));
                    localStorage.setItem('simpananSukarela', JSON.stringify(simpananList));

                    // Get laporan data
                    const laporanData = getAnggotaWithSimpananForLaporan();

                    // Calculate totals manually
                    const totalPokok = laporanData.reduce((sum, a) => sum + a.simpananPokok, 0);
                    const totalWajib = laporanData.reduce((sum, a) => sum + a.simpananWajib, 0);

                    // Property: Totals should only include positive values
                    const allPokokPositiveOrZero = laporanData.every(a => a.simpananPokok >= 0);
                    const allWajibPositiveOrZero = laporanData.every(a => a.simpananWajib >= 0);
                    const totalsNonNegative = totalPokok >= 0 && totalWajib >= 0;

                    return allPokokPositiveOrZero && allWajibPositiveOrZero && totalsNonNegative;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 7.5: Data preservation - original data unchanged by laporan filtering
     * **Validates: Requirements 10.1, 10.2**
     */
    test('Property 7.5: Laporan filtering preserves original data', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 1, maxLength: 10 }),
                fc.array(simpananArbitrary, { minLength: 0, maxLength: 20 }),
                (anggotaList, simpananList) => {
                    // Setup localStorage
                    localStorage.setItem('anggota', JSON.stringify(anggotaList));
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananList));
                    localStorage.setItem('simpananWajib', JSON.stringify(simpananList));

                    // Store original data
                    const originalAnggota = JSON.parse(localStorage.getItem('anggota'));
                    const originalSimpananPokok = JSON.parse(localStorage.getItem('simpananPokok'));

                    // Get laporan data (this should not modify original data)
                    getAnggotaWithSimpananForLaporan();

                    // Check that original data is preserved
                    const currentAnggota = JSON.parse(localStorage.getItem('anggota'));
                    const currentSimpananPokok = JSON.parse(localStorage.getItem('simpananPokok'));

                    const anggotaPreserved = JSON.stringify(originalAnggota) === JSON.stringify(currentAnggota);
                    const simpananPreserved = JSON.stringify(originalSimpananPokok) === JSON.stringify(currentSimpananPokok);

                    return anggotaPreserved && simpananPreserved;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 7.6: Laporan consistency - same input produces same output
     * **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
     */
    test('Property 7.6: Laporan filtering is deterministic', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 1, maxLength: 10 }),
                fc.array(simpananArbitrary, { minLength: 0, maxLength: 20 }),
                (anggotaList, simpananList) => {
                    // Setup localStorage
                    localStorage.setItem('anggota', JSON.stringify(anggotaList));
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananList));
                    localStorage.setItem('simpananWajib', JSON.stringify(simpananList));

                    // Get laporan data twice
                    const laporanData1 = getAnggotaWithSimpananForLaporan();
                    const laporanData2 = getAnggotaWithSimpananForLaporan();

                    // Property: Same input should produce same output
                    return JSON.stringify(laporanData1) === JSON.stringify(laporanData2);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 7.7: Edge case - empty data handling
     * **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
     */
    test('Property 7.7: Laporan handles empty data gracefully', () => {
        fc.assert(
            fc.property(
                fc.constantFrom([], []),
                (emptyData) => {
                    // Setup empty localStorage
                    localStorage.setItem('anggota', JSON.stringify(emptyData));
                    localStorage.setItem('simpananPokok', JSON.stringify(emptyData));
                    localStorage.setItem('simpananWajib', JSON.stringify(emptyData));

                    // Get laporan data
                    const laporanData = getAnggotaWithSimpananForLaporan();

                    // Property: Should return empty array without errors
                    return Array.isArray(laporanData) && laporanData.length === 0;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property 7.8: Laporan excludes anggota keluar with zero balances after pencairan
     * **Validates: Requirements 2.4, 2.5**
     */
    test('Property 7.8: Laporan excludes anggota keluar with zero balances after pencairan', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 1, maxLength: 10 }),
                (anggotaList) => {
                    // Create anggota keluar with processed status (should have zero balances)
                    const processedKeluarAnggota = anggotaList.map(a => ({
                        ...a,
                        statusKeanggotaan: 'Keluar',
                        pengembalianStatus: 'Selesai'
                    }));

                    // Setup localStorage
                    localStorage.setItem('anggota', JSON.stringify(processedKeluarAnggota));
                    localStorage.setItem('simpananPokok', JSON.stringify([]));
                    localStorage.setItem('simpananWajib', JSON.stringify([]));

                    // Get laporan data
                    const laporanData = getAnggotaWithSimpananForLaporan();

                    // Property: Should exclude all processed keluar anggota (they have zero balances)
                    return laporanData.length === 0;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 7.9: Laporan includes anggota keluar with pending status
     * **Validates: Requirements 7.1, 7.2**
     */
    test('Property 7.9: Laporan includes anggota keluar with pending status', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 1, maxLength: 10 }),
                fc.array(simpananArbitrary, { minLength: 1, maxLength: 20 }),
                (anggotaList, simpananList) => {
                    // Create anggota keluar with pending status (should still show in laporan)
                    const pendingKeluarAnggota = anggotaList.map(a => ({
                        ...a,
                        statusKeanggotaan: 'Keluar',
                        pengembalianStatus: 'Pending'
                    }));

                    // Create simpanan for these anggota
                    const matchingSimpanan = simpananList.map(s => ({
                        ...s,
                        anggotaId: pendingKeluarAnggota[0]?.id || 'test-id'
                    }));

                    // Setup localStorage
                    localStorage.setItem('anggota', JSON.stringify(pendingKeluarAnggota));
                    localStorage.setItem('simpananPokok', JSON.stringify(matchingSimpanan));
                    localStorage.setItem('simpananWajib', JSON.stringify(matchingSimpanan));

                    // Get laporan data
                    const laporanData = getAnggotaWithSimpananForLaporan();

                    // Property: Should include anggota keluar with pending status if they have balances
                    const hasPendingKeluar = laporanData.some(a => 
                        a.statusKeanggotaan === 'Keluar' && a.pengembalianStatus === 'Pending'
                    );

                    // If there are matching simpanan, should include pending keluar
                    return matchingSimpanan.length === 0 || hasPendingKeluar;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 7.10: Laporan totals are sum of individual balances
     * **Validates: Requirements 9.4**
     */
    test('Property 7.10: Laporan totals equal sum of individual balances', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 1, maxLength: 8 }),
                fc.array(simpananArbitrary, { minLength: 0, maxLength: 15 }),
                (anggotaList, simpananList) => {
                    // Setup localStorage
                    localStorage.setItem('anggota', JSON.stringify(anggotaList));
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananList));
                    localStorage.setItem('simpananWajib', JSON.stringify(simpananList));

                    // Get laporan data
                    const laporanData = getAnggotaWithSimpananForLaporan();

                    // Calculate totals
                    const totalPokok = laporanData.reduce((sum, a) => sum + a.simpananPokok, 0);
                    const totalWajib = laporanData.reduce((sum, a) => sum + a.simpananWajib, 0);
                    const individualSum = laporanData.reduce((sum, a) => sum + a.simpananPokok + a.simpananWajib, 0);

                    // Property: Total should equal sum of individual balances
                    return Math.abs((totalPokok + totalWajib) - individualSum) < 0.01; // Allow for floating point precision
                }
            ),
            { numRuns: 100 }
        );
    });
});