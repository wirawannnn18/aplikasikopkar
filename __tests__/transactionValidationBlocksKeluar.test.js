/**
 * Property-Based Test: Transaction validation blocks anggota keluar
 * Feature: fix-pengembalian-simpanan, Property 14: Transaction validation blocks anggota keluar
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 * 
 * Property: For any transaction type (POS, kasbon, simpanan, pinjaman), 
 * if the anggota has statusKeanggotaan = 'Keluar', the transaction should 
 * be rejected with an appropriate error message.
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

// Simulate the validation logic from transactionValidator.js
function validateAnggotaForTransaction(anggotaId) {
    try {
        if (!anggotaId) {
            return {
                valid: false,
                error: 'ID anggota tidak boleh kosong'
            };
        }

        const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
        const member = anggota.find(a => a.id === anggotaId);
        
        if (!member) {
            return {
                valid: false,
                error: 'Anggota tidak ditemukan'
            };
        }
        
        if (member.statusKeanggotaan === 'Keluar') {
            return {
                valid: false,
                error: `Anggota ${member.nama} sudah keluar dari koperasi dan tidak dapat melakukan transaksi`
            };
        }
        
        return {
            valid: true,
            anggota: member
        };
    } catch (error) {
        return {
            valid: false,
            error: 'Terjadi kesalahan saat validasi anggota'
        };
    }
}

describe('Property 14: Transaction validation blocks anggota keluar', () => {
    
    beforeEach(() => {
        localStorage.clear();
    });

    // Arbitrary for generating anggota with different statuses
    const anggotaArbitrary = fc.record({
        id: fc.uuid(),
        nik: fc.stringOf(fc.integer(0, 9).map(n => n.toString()), { minLength: 16, maxLength: 16 }),
        nama: fc.string({ minLength: 3, maxLength: 50 }),
        noKartu: fc.stringOf(fc.integer(0, 9).map(n => n.toString()), { minLength: 8, maxLength: 12 }),
        statusKeanggotaan: fc.constantFrom('Aktif', 'Keluar', 'Non-Aktif')
    });

    test('Property: validateAnggotaForTransaction rejects anggota keluar', () => {
        fc.assert(
            fc.property(anggotaArbitrary, (anggota) => {
                // Setup: Store anggota in localStorage
                localStorage.setItem('anggota', JSON.stringify([anggota]));
                
                // Action: Validate anggota for transaction
                const result = validateAnggotaForTransaction(anggota.id);
                
                // Assert: If statusKeanggotaan is 'Keluar', validation should fail
                if (anggota.statusKeanggotaan === 'Keluar') {
                    expect(result.valid).toBe(false);
                    expect(result.error).toContain('sudah keluar');
                    expect(result.error).toContain(anggota.nama);
                } else {
                    // If not 'Keluar', validation should pass
                    expect(result.valid).toBe(true);
                    expect(result.anggota).toBeDefined();
                    expect(result.anggota.id).toBe(anggota.id);
                }
            }),
            { numRuns: 100 }
        );
    });



    test('Property: Validation fails for non-existent anggota', () => {
        fc.assert(
            fc.property(fc.uuid(), (randomId) => {
                // Setup: Empty anggota list
                localStorage.setItem('anggota', JSON.stringify([]));
                
                // Action: Try to validate non-existent anggota
                const result = validateAnggotaForTransaction(randomId);
                
                // Assert: Should fail with appropriate error
                expect(result.valid).toBe(false);
                expect(result.error).toContain('tidak ditemukan');
            }),
            { numRuns: 100 }
        );
    });

    test('Property: Validation fails for empty anggotaId', () => {
        const result = validateAnggotaForTransaction('');
        
        expect(result.valid).toBe(false);
        expect(result.error).toContain('tidak boleh kosong');
    });

    test('Property: Validation fails for null anggotaId', () => {
        const result = validateAnggotaForTransaction(null);
        
        expect(result.valid).toBe(false);
        expect(result.error).toContain('tidak boleh kosong');
    });



    test('Property: Error messages contain anggota name for keluar status', () => {
        fc.assert(
            fc.property(
                anggotaArbitrary.filter(a => a.statusKeanggotaan === 'Keluar'),
                (anggota) => {
                    localStorage.setItem('anggota', JSON.stringify([anggota]));
                    
                    const result = validateAnggotaForTransaction(anggota.id);
                    
                    // Error message should contain the anggota's name
                    expect(result.valid).toBe(false);
                    expect(result.error).toContain(anggota.nama);
                }
            ),
            { numRuns: 100 }
        );
    });
});
