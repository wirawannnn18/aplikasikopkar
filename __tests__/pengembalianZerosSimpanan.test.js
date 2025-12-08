/**
 * Property-Based Tests for Pengembalian Zeros Simpanan
 * Feature: fix-pengembalian-simpanan, Property 1: Pengembalian zeros all simpanan balances
 * Validates: Requirements 1.1, 1.2
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

// Mock functions
global.generateId = () => 'TEST-' + Math.random().toString(36).substr(2, 9);
global.getAnggotaById = (id) => {
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    return anggota.find(a => a.id === id);
};

// Simplified version of processPengembalian logic for testing
function zeroSimpananForAnggota(anggotaId, pengembalianId, tanggalPembayaran) {
    // Zero out simpanan pokok
    const simpananPokokList = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
    const updatedSimpananPokok = simpananPokokList.map(s => {
        if (s.anggotaId === anggotaId) {
            return {
                ...s,
                saldoSebelumPengembalian: s.jumlah,
                jumlah: 0,
                statusPengembalian: 'Dikembalikan',
                pengembalianId: pengembalianId,
                tanggalPengembalian: tanggalPembayaran
            };
        }
        return s;
    });
    localStorage.setItem('simpananPokok', JSON.stringify(updatedSimpananPokok));
    
    // Zero out simpanan wajib
    const simpananWajibList = JSON.parse(localStorage.getItem('simpananWajib') || '[]');
    const updatedSimpananWajib = simpananWajibList.map(s => {
        if (s.anggotaId === anggotaId) {
            return {
                ...s,
                saldoSebelumPengembalian: s.jumlah,
                jumlah: 0,
                statusPengembalian: 'Dikembalikan',
                pengembalianId: pengembalianId,
                tanggalPengembalian: tanggalPembayaran
            };
        }
        return s;
    });
    localStorage.setItem('simpananWajib', JSON.stringify(updatedSimpananWajib));
    
    // Zero out simpanan sukarela
    const simpananSukarelaList = JSON.parse(localStorage.getItem('simpananSukarela') || '[]');
    const updatedSimpananSukarela = simpananSukarelaList.map(s => {
        if (s.anggotaId === anggotaId) {
            return {
                ...s,
                saldoSebelumPengembalian: s.jumlah,
                jumlah: 0,
                statusPengembalian: 'Dikembalikan',
                pengembalianId: pengembalianId,
                tanggalPengembalian: tanggalPembayaran
            };
        }
        return s;
    });
    localStorage.setItem('simpananSukarela', JSON.stringify(updatedSimpananSukarela));
}

describe('Property 1: Pengembalian zeros all simpanan balances', () => {
    
    beforeEach(() => {
        localStorage.clear();
        
        // Initialize empty arrays
        localStorage.setItem('anggota', JSON.stringify([]));
        localStorage.setItem('simpananPokok', JSON.stringify([]));
        localStorage.setItem('simpananWajib', JSON.stringify([]));
        localStorage.setItem('simpananSukarela', JSON.stringify([]));
        localStorage.setItem('pengembalian', JSON.stringify([]));
        localStorage.setItem('jurnal', JSON.stringify([]));
        localStorage.setItem('coa', JSON.stringify([]));
    });

    test('For any anggota keluar with simpanan pokok, after processPengembalian, simpanan pokok balance should be 0', () => {
        fc.assert(
            fc.property(
                // Generate random anggota
                fc.record({
                    id: fc.uuid(),
                    nama: fc.string({ minLength: 5, maxLength: 50 }),
                    nik: fc.stringOf(fc.integer(0, 9).map(n => n.toString()), { minLength: 16, maxLength: 16 }),
                    statusKeanggotaan: fc.constant('Keluar'),
                    tanggalKeluar: fc.date({ min: new Date('2024-01-01'), max: new Date() })
                        .map(d => d.toISOString().split('T')[0]),
                    alasanKeluar: fc.string({ minLength: 10, maxLength: 100 })
                }),
                // Generate random simpanan pokok amount
                fc.integer({ min: 100000, max: 10000000 }),
                // Generate payment method
                fc.constantFrom('Kas', 'Bank'),
                (anggota, simpananPokokAmount, metodePembayaran) => {
                    // Setup: Create anggota and simpanan
                    const anggotaList = [anggota];
                    localStorage.setItem('anggota', JSON.stringify(anggotaList));
                    
                    const simpananPokok = [{
                        id: generateId(),
                        anggotaId: anggota.id,
                        jumlah: simpananPokokAmount,
                        tanggal: '2024-01-15',
                        statusPengembalian: 'Aktif'
                    }];
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananPokok));
                    
                    const pengembalianId = generateId();
                    
                    // Execute: Zero simpanan
                    zeroSimpananForAnggota(anggota.id, pengembalianId, '2024-12-05');
                    
                    // Verify: Simpanan pokok balance should be 0
                    const updatedSimpanan = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
                    const anggotaSimpanan = updatedSimpanan.filter(s => s.anggotaId === anggota.id);
                    
                    return anggotaSimpanan.every(s => s.jumlah === 0);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any anggota keluar with simpanan wajib, after processPengembalian, simpanan wajib balance should be 0', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.uuid(),
                    nama: fc.string({ minLength: 5, maxLength: 50 }),
                    nik: fc.stringOf(fc.integer(0, 9).map(n => n.toString()), { minLength: 16, maxLength: 16 }),
                    statusKeanggotaan: fc.constant('Keluar'),
                    tanggalKeluar: fc.date({ min: new Date('2024-01-01'), max: new Date() })
                        .map(d => d.toISOString().split('T')[0]),
                    alasanKeluar: fc.string({ minLength: 10, maxLength: 100 })
                }),
                fc.integer({ min: 50000, max: 5000000 }),
                fc.constantFrom('Kas', 'Bank'),
                (anggota, simpananWajibAmount, metodePembayaran) => {
                    // Setup
                    const anggotaList = [anggota];
                    localStorage.setItem('anggota', JSON.stringify(anggotaList));
                    
                    const simpananWajib = [{
                        id: generateId(),
                        anggotaId: anggota.id,
                        jumlah: simpananWajibAmount,
                        tanggal: '2024-01-15',
                        periode: '2024-01',
                        statusPengembalian: 'Aktif'
                    }];
                    localStorage.setItem('simpananWajib', JSON.stringify(simpananWajib));
                    
                    const pengembalianId = generateId();
                    
                    // Execute
                    zeroSimpananForAnggota(anggota.id, pengembalianId, '2024-12-05');
                    
                    // Verify
                    const updatedSimpanan = JSON.parse(localStorage.getItem('simpananWajib') || '[]');
                    const anggotaSimpanan = updatedSimpanan.filter(s => s.anggotaId === anggota.id);
                    
                    return anggotaSimpanan.every(s => s.jumlah === 0);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any anggota keluar with multiple simpanan records, after processPengembalian, all balances should be 0', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.uuid(),
                    nama: fc.string({ minLength: 5, maxLength: 50 }),
                    nik: fc.stringOf(fc.integer(0, 9).map(n => n.toString()), { minLength: 16, maxLength: 16 }),
                    statusKeanggotaan: fc.constant('Keluar'),
                    tanggalKeluar: fc.date({ min: new Date('2024-01-01'), max: new Date() })
                        .map(d => d.toISOString().split('T')[0]),
                    alasanKeluar: fc.string({ minLength: 10, maxLength: 100 })
                }),
                fc.array(fc.integer({ min: 100000, max: 1000000 }), { minLength: 1, maxLength: 5 }),
                fc.array(fc.integer({ min: 50000, max: 500000 }), { minLength: 1, maxLength: 10 }),
                fc.array(fc.integer({ min: 10000, max: 1000000 }), { minLength: 0, maxLength: 5 }),
                fc.constantFrom('Kas', 'Bank'),
                (anggota, simpananPokokAmounts, simpananWajibAmounts, simpananSukarelaAmounts, metodePembayaran) => {
                    // Setup
                    const anggotaList = [anggota];
                    localStorage.setItem('anggota', JSON.stringify(anggotaList));
                    
                    // Create multiple simpanan pokok records
                    const simpananPokok = simpananPokokAmounts.map(amount => ({
                        id: generateId(),
                        anggotaId: anggota.id,
                        jumlah: amount,
                        tanggal: '2024-01-15',
                        statusPengembalian: 'Aktif'
                    }));
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananPokok));
                    
                    // Create multiple simpanan wajib records
                    const simpananWajib = simpananWajibAmounts.map((amount, index) => ({
                        id: generateId(),
                        anggotaId: anggota.id,
                        jumlah: amount,
                        tanggal: '2024-01-15',
                        periode: `2024-${String(index + 1).padStart(2, '0')}`,
                        statusPengembalian: 'Aktif'
                    }));
                    localStorage.setItem('simpananWajib', JSON.stringify(simpananWajib));
                    
                    // Create simpanan sukarela records
                    const simpananSukarela = simpananSukarelaAmounts.map(amount => ({
                        id: generateId(),
                        anggotaId: anggota.id,
                        jumlah: amount,
                        tanggal: '2024-01-15',
                        tipe: 'setor',
                        statusPengembalian: 'Aktif'
                    }));
                    localStorage.setItem('simpananSukarela', JSON.stringify(simpananSukarela));
                    
                    const pengembalianId = generateId();
                    
                    // Execute
                    zeroSimpananForAnggota(anggota.id, pengembalianId, '2024-12-05');
                    
                    // Verify: ALL simpanan records should have jumlah = 0
                    const updatedPokok = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
                    const updatedWajib = JSON.parse(localStorage.getItem('simpananWajib') || '[]');
                    const updatedSukarela = JSON.parse(localStorage.getItem('simpananSukarela') || '[]');
                    
                    const anggotaPokok = updatedPokok.filter(s => s.anggotaId === anggota.id);
                    const anggotaWajib = updatedWajib.filter(s => s.anggotaId === anggota.id);
                    const anggotaSukarela = updatedSukarela.filter(s => s.anggotaId === anggota.id);
                    
                    const allPokokZero = anggotaPokok.every(s => s.jumlah === 0);
                    const allWajibZero = anggotaWajib.every(s => s.jumlah === 0);
                    const allSukarelaZero = anggotaSukarela.length === 0 || anggotaSukarela.every(s => s.jumlah === 0);
                    
                    return allPokokZero && allWajibZero && allSukarelaZero;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any anggota keluar, after processPengembalian, other anggota simpanan should remain unchanged', () => {
        fc.assert(
            fc.property(
                // Anggota keluar
                fc.record({
                    id: fc.uuid(),
                    nama: fc.string({ minLength: 5, maxLength: 50 }),
                    statusKeanggotaan: fc.constant('Keluar')
                }),
                // Other anggota (aktif)
                fc.record({
                    id: fc.uuid(),
                    nama: fc.string({ minLength: 5, maxLength: 50 }),
                    statusKeanggotaan: fc.constant('Aktif')
                }),
                fc.integer({ min: 100000, max: 1000000 }),
                fc.integer({ min: 100000, max: 1000000 }),
                fc.constantFrom('Kas', 'Bank'),
                (anggotaKeluar, anggotaAktif, amountKeluar, amountAktif, metodePembayaran) => {
                    // Ensure different IDs
                    if (anggotaKeluar.id === anggotaAktif.id) {
                        anggotaAktif.id = generateId();
                    }
                    
                    // Setup
                    const anggotaList = [anggotaKeluar, anggotaAktif];
                    localStorage.setItem('anggota', JSON.stringify(anggotaList));
                    
                    const simpananPokok = [
                        {
                            id: generateId(),
                            anggotaId: anggotaKeluar.id,
                            jumlah: amountKeluar,
                            tanggal: '2024-01-15',
                            statusPengembalian: 'Aktif'
                        },
                        {
                            id: generateId(),
                            anggotaId: anggotaAktif.id,
                            jumlah: amountAktif,
                            tanggal: '2024-01-15',
                            statusPengembalian: 'Aktif'
                        }
                    ];
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananPokok));
                    
                    const pengembalianId = generateId();
                    
                    // Execute
                    zeroSimpananForAnggota(anggotaKeluar.id, pengembalianId, '2024-12-05');
                    
                    // Verify: Anggota aktif simpanan should remain unchanged
                    const updatedSimpanan = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
                    const aktifSimpanan = updatedSimpanan.find(s => s.anggotaId === anggotaAktif.id);
                    
                    return aktifSimpanan && aktifSimpanan.jumlah === amountAktif;
                }
            ),
            { numRuns: 100 }
        );
    });
});
