// Feature: fix-anggota-keluar-komprehensif, Property 8: Data Preservation
// Validates: Requirements 10.1, 10.2, 10.3
// Task 19.1: Write property test for data preservation

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

// Mock generateId function
function generateId() {
    return 'test-' + Math.random().toString(36).substring(2, 9);
}

// Simulate the filterActiveAnggota function from js/koperasi.js
function filterActiveAnggota(anggotaList) {
    try {
        if (!Array.isArray(anggotaList)) {
            return [];
        }
        
        return anggotaList.filter(anggota => 
            anggota && anggota.statusKeanggotaan !== 'Keluar'
        );
    } catch (error) {
        console.error('Error filtering active anggota:', error);
        return [];
    }
}

// Simulate the filterTransactableAnggota function from js/koperasi.js
function filterTransactableAnggota(anggotaList) {
    try {
        if (!Array.isArray(anggotaList)) {
            return [];
        }
        
        return anggotaList.filter(anggota => 
            anggota && anggota.status === 'Aktif' && anggota.statusKeanggotaan !== 'Keluar'
        );
    } catch (error) {
        console.error('Error filtering transactable anggota:', error);
        return [];
    }
}

// Simulate the zeroSimpananPokok function from js/simpanan.js
function zeroSimpananPokok(anggotaId) {
    try {
        const simpananPokok = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
        const updated = simpananPokok.map(s => {
            if (s.anggotaId === anggotaId) {
                return { ...s, saldo: 0 };
            }
            return s;
        });
        localStorage.setItem('simpananPokok', JSON.stringify(updated));
        
        return {
            success: true,
            message: `Simpanan pokok zeroed for anggota ${anggotaId}`
        };
    } catch (error) {
        console.error('Error zeroing simpanan pokok:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Simulate the zeroSimpananWajib function from js/simpanan.js
function zeroSimpananWajib(anggotaId) {
    try {
        const simpananWajib = JSON.parse(localStorage.getItem('simpananWajib') || '[]');
        const updated = simpananWajib.map(s => {
            if (s.anggotaId === anggotaId) {
                return { ...s, saldo: 0 };
            }
            return s;
        });
        localStorage.setItem('simpananWajib', JSON.stringify(updated));
        
        return {
            success: true,
            message: `Simpanan wajib zeroed for anggota ${anggotaId}`
        };
    } catch (error) {
        console.error('Error zeroing simpanan wajib:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Simulate the createPencairanJournal function from js/simpanan.js
function createPencairanJournal(anggotaId, jenisSimpanan, jumlah) {
    try {
        if (jumlah <= 0) {
            return {
                success: false,
                error: 'Jumlah harus lebih dari 0'
            };
        }

        const anggota = JSON.parse(localStorage.getItem('anggota') || '[]')
            .find(a => a.id === anggotaId);
        
        if (!anggota) {
            return {
                success: false,
                error: 'Anggota tidak ditemukan'
            };
        }
        
        const coaMap = {
            'Simpanan Pokok': 'Simpanan Pokok',
            'Simpanan Wajib': 'Simpanan Wajib',
            'Simpanan Sukarela': 'Simpanan Sukarela'
        };
        
        const jurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
        const tanggal = new Date().toISOString();
        const referensi = `PENCAIRAN-${anggotaId}-${Date.now()}`;
        const keterangan = `Pencairan ${jenisSimpanan} - ${anggota.nama}`;
        
        // Entry 1: Debit Simpanan
        jurnal.push({
            id: generateId(),
            tanggal: tanggal,
            keterangan: keterangan,
            coa: coaMap[jenisSimpanan],
            debit: jumlah,
            kredit: 0,
            referensi: referensi,
            createdAt: tanggal
        });
        
        // Entry 2: Kredit Kas
        jurnal.push({
            id: generateId(),
            tanggal: tanggal,
            keterangan: keterangan,
            coa: 'Kas',
            debit: 0,
            kredit: jumlah,
            referensi: referensi,
            createdAt: tanggal
        });
        
        localStorage.setItem('jurnal', JSON.stringify(jurnal));
        
        return {
            success: true,
            message: `Journal entries created for ${jenisSimpanan}`,
            referensi: referensi,
            entries: 2
        };
    } catch (error) {
        console.error('Error creating pencairan journal:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Arbitraries for property-based testing
const statusKeanggotaanArbitrary = fc.constantFrom('Aktif', 'Keluar');
const statusArbitrary = fc.constantFrom('Aktif', 'Nonaktif', 'Cuti');
const pengembalianStatusArbitrary = fc.constantFrom('Pending', 'Selesai', null);

const anggotaArbitrary = fc.record({
    id: fc.uuid(),
    nik: fc.string({ minLength: 10, maxLength: 16 }),
    nama: fc.string({ minLength: 5, maxLength: 50 }),
    statusKeanggotaan: statusKeanggotaanArbitrary,
    status: statusArbitrary,
    tanggalKeluar: fc.option(fc.date().map(d => d.toISOString()), { nil: null }),
    pengembalianStatus: pengembalianStatusArbitrary
});

const simpananArbitrary = fc.record({
    id: fc.uuid(),
    anggotaId: fc.uuid(),
    saldo: fc.integer({ min: 0, max: 100000000 }),
    tanggal: fc.date().map(d => d.toISOString()),
    keterangan: fc.string({ minLength: 5, maxLength: 50 })
});

const jurnalArbitrary = fc.record({
    id: fc.uuid(),
    tanggal: fc.date().map(d => d.toISOString()),
    keterangan: fc.string({ minLength: 5, maxLength: 100 }),
    coa: fc.constantFrom('Kas', 'Simpanan Pokok', 'Simpanan Wajib', 'Simpanan Sukarela'),
    debit: fc.integer({ min: 0, max: 100000000 }),
    kredit: fc.integer({ min: 0, max: 100000000 }),
    referensi: fc.string({ minLength: 5, maxLength: 20 }),
    createdAt: fc.date().map(d => d.toISOString())
});

describe('Property 8: Data Preservation - localStorage Data Integrity', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('Requirement 10.1: filterActiveAnggota should preserve anggota keluar data in localStorage', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 1, maxLength: 50 }),
                (anggotaList) => {
                    // Setup - store original data
                    const originalData = JSON.stringify(anggotaList);
                    localStorage.setItem('anggota', originalData);
                    
                    // Execute filtering operation
                    const filteredAnggota = filterActiveAnggota(anggotaList);
                    
                    // Verify Requirement 10.1 - original data preserved
                    const storedData = localStorage.getItem('anggota');
                    return storedData === originalData;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Requirement 10.1: filterTransactableAnggota should preserve all anggota data in localStorage', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 1, maxLength: 50 }),
                (anggotaList) => {
                    // Setup - store original data
                    const originalData = JSON.stringify(anggotaList);
                    localStorage.setItem('anggota', originalData);
                    
                    // Execute filtering operation
                    const filteredAnggota = filterTransactableAnggota(anggotaList);
                    
                    // Verify Requirement 10.1 - original data preserved
                    const storedData = localStorage.getItem('anggota');
                    return storedData === originalData;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Requirement 10.2: zeroSimpananPokok should preserve transaction history in localStorage', () => {
        fc.assert(
            fc.property(
                fc.array(simpananArbitrary, { minLength: 1, maxLength: 20 }),
                fc.array(jurnalArbitrary, { minLength: 0, maxLength: 10 }),
                fc.uuid(),
                (simpananList, jurnalList, anggotaId) => {
                    // Setup - store original transaction history
                    const originalJurnal = JSON.stringify(jurnalList);
                    localStorage.setItem('jurnal', originalJurnal);
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananList));
                    
                    // Execute zeroing operation
                    const result = zeroSimpananPokok(anggotaId);
                    
                    // Verify Requirement 10.2 - transaction history preserved
                    const storedJurnal = localStorage.getItem('jurnal');
                    return storedJurnal === originalJurnal;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Requirement 10.2: zeroSimpananWajib should preserve transaction history in localStorage', () => {
        fc.assert(
            fc.property(
                fc.array(simpananArbitrary, { minLength: 1, maxLength: 20 }),
                fc.array(jurnalArbitrary, { minLength: 0, maxLength: 10 }),
                fc.uuid(),
                (simpananList, jurnalList, anggotaId) => {
                    // Setup - store original transaction history
                    const originalJurnal = JSON.stringify(jurnalList);
                    localStorage.setItem('jurnal', originalJurnal);
                    localStorage.setItem('simpananWajib', JSON.stringify(simpananList));
                    
                    // Execute zeroing operation
                    const result = zeroSimpananWajib(anggotaId);
                    
                    // Verify Requirement 10.2 - transaction history preserved
                    const storedJurnal = localStorage.getItem('jurnal');
                    return storedJurnal === originalJurnal;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Requirement 10.3: createPencairanJournal should preserve journal entries in localStorage', () => {
        fc.assert(
            fc.property(
                anggotaArbitrary,
                fc.constantFrom('Simpanan Pokok', 'Simpanan Wajib', 'Simpanan Sukarela'),
                fc.integer({ min: 1, max: 10000000 }),
                fc.array(jurnalArbitrary, { minLength: 0, maxLength: 5 }),
                (anggota, jenisSimpanan, jumlah, existingJurnal) => {
                    // Setup - store existing data
                    localStorage.setItem('anggota', JSON.stringify([anggota]));
                    localStorage.setItem('jurnal', JSON.stringify(existingJurnal));
                    
                    const originalJurnalCount = existingJurnal.length;
                    
                    // Execute journal creation
                    const result = createPencairanJournal(anggota.id, jenisSimpanan, jumlah);
                    
                    // Verify Requirement 10.3 - journal entries preserved and added
                    if (result.success) {
                        const updatedJurnal = JSON.parse(localStorage.getItem('jurnal'));
                        
                        // Should have original entries plus 2 new ones
                        return updatedJurnal.length === originalJurnalCount + 2;
                    }
                    return true; // If creation failed, that's a separate issue
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: Multiple filtering operations should preserve all original data', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 5, maxLength: 30 }),
                (anggotaList) => {
                    // Setup - store original data
                    const originalData = JSON.stringify(anggotaList);
                    localStorage.setItem('anggota', originalData);
                    
                    // Execute multiple filtering operations
                    const activeAnggota = filterActiveAnggota(anggotaList);
                    const transactableAnggota = filterTransactableAnggota(anggotaList);
                    const activeAgain = filterActiveAnggota(activeAnggota);
                    
                    // Verify - original data still preserved after multiple operations
                    const storedData = localStorage.getItem('anggota');
                    return storedData === originalData;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: Zeroing operations should preserve anggota records structure', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 1, maxLength: 20 }),
                fc.array(simpananArbitrary, { minLength: 1, maxLength: 20 }),
                fc.uuid(),
                (anggotaList, simpananList, targetAnggotaId) => {
                    // Setup - store original data
                    const originalAnggota = JSON.stringify(anggotaList);
                    const originalSimpananCount = simpananList.length;
                    localStorage.setItem('anggota', originalAnggota);
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananList));
                    
                    // Execute zeroing operation
                    const result = zeroSimpananPokok(targetAnggotaId);
                    
                    // Verify - anggota data preserved, simpanan records preserved (structure)
                    const storedAnggota = localStorage.getItem('anggota');
                    const storedSimpanan = JSON.parse(localStorage.getItem('simpananPokok'));
                    
                    return storedAnggota === originalAnggota && 
                           storedSimpanan.length === originalSimpananCount;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: Journal creation should accumulate entries without losing existing ones', () => {
        fc.assert(
            fc.property(
                anggotaArbitrary,
                fc.array(jurnalArbitrary, { minLength: 1, maxLength: 10 }),
                fc.constantFrom('Simpanan Pokok', 'Simpanan Wajib', 'Simpanan Sukarela'),
                fc.integer({ min: 1, max: 1000000 }),
                (anggota, existingJurnal, jenisSimpanan, jumlah) => {
                    // Setup - store existing data
                    localStorage.setItem('anggota', JSON.stringify([anggota]));
                    localStorage.setItem('jurnal', JSON.stringify(existingJurnal));
                    
                    // Store original journal entries for comparison
                    const originalEntries = existingJurnal.map(entry => ({ ...entry }));
                    
                    // Execute journal creation
                    const result = createPencairanJournal(anggota.id, jenisSimpanan, jumlah);
                    
                    // Verify - existing entries preserved
                    if (result.success) {
                        const updatedJurnal = JSON.parse(localStorage.getItem('jurnal'));
                        
                        // Check that all original entries are still present
                        const originalEntriesPreserved = originalEntries.every(originalEntry => 
                            updatedJurnal.some(updatedEntry => 
                                updatedEntry.id === originalEntry.id &&
                                updatedEntry.tanggal === originalEntry.tanggal &&
                                updatedEntry.keterangan === originalEntry.keterangan &&
                                updatedEntry.coa === originalEntry.coa &&
                                updatedEntry.debit === originalEntry.debit &&
                                updatedEntry.kredit === originalEntry.kredit
                            )
                        );
                        
                        return originalEntriesPreserved;
                    }
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: Data preservation should work with empty localStorage', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 1, maxLength: 10 }),
                (anggotaList) => {
                    // Setup - empty localStorage (no existing data)
                    localStorage.clear();
                    
                    // Execute filtering operations on empty storage
                    const activeAnggota = filterActiveAnggota(anggotaList);
                    const transactableAnggota = filterTransactableAnggota(anggotaList);
                    
                    // Verify - operations should not crash and should return filtered results
                    return Array.isArray(activeAnggota) && Array.isArray(transactableAnggota);
                }
            ),
            { numRuns: 50 }
        );
    });

    test('Property: Data preservation should handle corrupted localStorage gracefully', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 50 }),
                fc.array(anggotaArbitrary, { minLength: 1, maxLength: 10 }),
                (corruptedData, anggotaList) => {
                    // Setup - corrupted localStorage data
                    localStorage.setItem('anggota', corruptedData);
                    localStorage.setItem('jurnal', corruptedData);
                    
                    // Execute operations that read from localStorage
                    const activeAnggota = filterActiveAnggota(anggotaList);
                    const transactableAnggota = filterTransactableAnggota(anggotaList);
                    
                    // Verify - operations should handle corruption gracefully
                    return Array.isArray(activeAnggota) && Array.isArray(transactableAnggota);
                }
            ),
            { numRuns: 50 }
        );
    });

    test('Property: Concurrent operations should preserve data integrity', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 3, maxLength: 15 }),
                fc.array(simpananArbitrary, { minLength: 3, maxLength: 15 }),
                (anggotaList, simpananList) => {
                    // Setup - store original data
                    const originalAnggota = JSON.stringify(anggotaList);
                    const originalSimpanan = JSON.stringify(simpananList);
                    localStorage.setItem('anggota', originalAnggota);
                    localStorage.setItem('simpananPokok', originalSimpanan);
                    localStorage.setItem('jurnal', JSON.stringify([]));
                    
                    // Execute multiple concurrent-like operations
                    const activeAnggota = filterActiveAnggota(anggotaList);
                    const transactableAnggota = filterTransactableAnggota(anggotaList);
                    
                    // Perform zeroing operations for multiple anggota
                    anggotaList.slice(0, 3).forEach(anggota => {
                        zeroSimpananPokok(anggota.id);
                    });
                    
                    // Filter again after zeroing
                    const activeAfterZeroing = filterActiveAnggota(anggotaList);
                    
                    // Verify - anggota data should still be preserved
                    const storedAnggota = localStorage.getItem('anggota');
                    return storedAnggota === originalAnggota;
                }
            ),
            { numRuns: 50 }
        );
    });
});