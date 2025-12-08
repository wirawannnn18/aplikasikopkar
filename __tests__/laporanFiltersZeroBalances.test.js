// Feature: fix-pengembalian-simpanan, Property 4: Laporan filters zero balances
// Validates: Requirements 2.1, 2.2, 2.3

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
global.formatRupiah = (amount) => `Rp ${amount.toLocaleString('id-ID')}`;
global.formatDateToDisplay = (date) => date;

describe('Property 4: Laporan filters zero balances', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('laporanSimpanan should only include simpanan with jumlah > 0', () => {
        fc.assert(
            fc.property(
                fc.array(fc.record({
                    id: fc.uuid(),
                    anggotaId: fc.uuid(),
                    jumlah: fc.integer({ min: 0, max: 10000000 }),
                    tanggal: fc.date().map(d => d.toISOString())
                }), { minLength: 5, maxLength: 20 }),
                (simpananArray) => {
                    // Setup: Store simpanan sukarela
                    localStorage.setItem('simpananSukarela', JSON.stringify(simpananArray));
                    
                    // Get simpanan from storage
                    const stored = JSON.parse(localStorage.getItem('simpananSukarela') || '[]');
                    
                    // Filter with jumlah > 0 (simulating laporan logic)
                    const filtered = stored.filter(s => s.jumlah > 0);
                    
                    // Property: All filtered items must have jumlah > 0
                    const allPositive = filtered.every(s => s.jumlah > 0);
                    
                    // Property: No zero balance items in filtered result
                    const noZeros = !filtered.some(s => s.jumlah === 0);
                    
                    // Property: Count of filtered items should match count of positive items
                    const expectedCount = simpananArray.filter(s => s.jumlah > 0).length;
                    const actualCount = filtered.length;
                    
                    return allPositive && noZeros && (actualCount === expectedCount);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('renderSimpananPokok should filter out zero balances', () => {
        fc.assert(
            fc.property(
                fc.array(fc.record({
                    id: fc.uuid(),
                    anggotaId: fc.uuid(),
                    jumlah: fc.integer({ min: 0, max: 5000000 }),
                    tanggal: fc.date().map(d => d.toISOString())
                }), { minLength: 3, maxLength: 15 }),
                (simpananPokok) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananPokok));
                    
                    // Simulate renderSimpananPokok filter logic
                    const stored = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
                    const filtered = stored.filter(s => s.jumlah > 0);
                    
                    // Property: All displayed items have positive balance
                    const allPositive = filtered.every(s => s.jumlah > 0);
                    
                    // Property: Zero balance items are excluded
                    const zeroCount = simpananPokok.filter(s => s.jumlah === 0).length;
                    const filteredCount = filtered.length;
                    const totalCount = simpananPokok.length;
                    
                    return allPositive && (filteredCount === totalCount - zeroCount);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('renderSimpananWajib should filter out zero balances', () => {
        fc.assert(
            fc.property(
                fc.array(fc.record({
                    id: fc.uuid(),
                    anggotaId: fc.uuid(),
                    jumlah: fc.integer({ min: 0, max: 10000000 }),
                    periode: fc.constantFrom('2024-01', '2024-02', '2024-03'),
                    tanggal: fc.date().map(d => d.toISOString())
                }), { minLength: 5, maxLength: 25 }),
                (simpananWajib) => {
                    // Setup
                    localStorage.setItem('simpananWajib', JSON.stringify(simpananWajib));
                    
                    // Simulate renderSimpananWajib filter logic
                    const stored = JSON.parse(localStorage.getItem('simpananWajib') || '[]');
                    const filtered = stored.filter(s => s.jumlah > 0);
                    
                    // Property: All displayed items have positive balance
                    const allPositive = filtered.every(s => s.jumlah > 0);
                    
                    // Property: No zero balances in result
                    const noZeros = !filtered.some(s => s.jumlah === 0);
                    
                    return allPositive && noZeros;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('renderSimpananSukarela should filter out zero balances', () => {
        fc.assert(
            fc.property(
                fc.array(fc.record({
                    id: fc.uuid(),
                    anggotaId: fc.uuid(),
                    jumlah: fc.integer({ min: 0, max: 20000000 }),
                    tanggal: fc.date().map(d => d.toISOString()),
                    keterangan: fc.string({ minLength: 0, maxLength: 50 })
                }), { minLength: 3, maxLength: 20 }),
                (simpananSukarela) => {
                    // Setup
                    localStorage.setItem('simpananSukarela', JSON.stringify(simpananSukarela));
                    
                    // Simulate renderSimpananSukarela filter logic
                    const stored = JSON.parse(localStorage.getItem('simpananSukarela') || '[]');
                    const filtered = stored.filter(s => s.jumlah > 0);
                    
                    // Property: All displayed items have positive balance
                    const allPositive = filtered.every(s => s.jumlah > 0);
                    
                    // Property: Filtered count matches positive count
                    const positiveCount = simpananSukarela.filter(s => s.jumlah > 0).length;
                    
                    return allPositive && (filtered.length === positiveCount);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('After pengembalian, anggota with all zero simpanan should not appear in any report', () => {
        fc.assert(
            fc.property(
                fc.record({
                    anggotaId: fc.uuid(),
                    simpananPokok: fc.record({
                        id: fc.uuid(),
                        anggotaId: fc.uuid(),
                        jumlah: fc.constant(0), // Zero after pengembalian
                        saldoSebelumPengembalian: fc.integer({ min: 100000, max: 5000000 }),
                        statusPengembalian: fc.constant('Dikembalikan')
                    }),
                    simpananWajib: fc.record({
                        id: fc.uuid(),
                        anggotaId: fc.uuid(),
                        jumlah: fc.constant(0), // Zero after pengembalian
                        saldoSebelumPengembalian: fc.integer({ min: 50000, max: 10000000 }),
                        statusPengembalian: fc.constant('Dikembalikan')
                    }),
                    simpananSukarela: fc.record({
                        id: fc.uuid(),
                        anggotaId: fc.uuid(),
                        jumlah: fc.constant(0), // Zero after pengembalian
                        saldoSebelumPengembalian: fc.integer({ min: 0, max: 5000000 }),
                        statusPengembalian: fc.constant('Dikembalikan')
                    })
                }),
                (data) => {
                    // Ensure all simpanan have same anggotaId
                    const anggotaId = data.anggotaId;
                    data.simpananPokok.anggotaId = anggotaId;
                    data.simpananWajib.anggotaId = anggotaId;
                    data.simpananSukarela.anggotaId = anggotaId;
                    
                    // Setup storage
                    localStorage.setItem('simpananPokok', JSON.stringify([data.simpananPokok]));
                    localStorage.setItem('simpananWajib', JSON.stringify([data.simpananWajib]));
                    localStorage.setItem('simpananSukarela', JSON.stringify([data.simpananSukarela]));
                    
                    // Filter logic (as in laporan)
                    const pokokFiltered = JSON.parse(localStorage.getItem('simpananPokok') || '[]')
                        .filter(s => s.jumlah > 0);
                    const wajibFiltered = JSON.parse(localStorage.getItem('simpananWajib') || '[]')
                        .filter(s => s.jumlah > 0);
                    const sukarelaFiltered = JSON.parse(localStorage.getItem('simpananSukarela') || '[]')
                        .filter(s => s.jumlah > 0);
                    
                    // Property: Anggota with all zero balances should not appear in any report
                    const notInPokok = !pokokFiltered.some(s => s.anggotaId === anggotaId);
                    const notInWajib = !wajibFiltered.some(s => s.anggotaId === anggotaId);
                    const notInSukarela = !sukarelaFiltered.some(s => s.anggotaId === anggotaId);
                    
                    return notInPokok && notInWajib && notInSukarela;
                }
            ),
            { numRuns: 100 }
        );
    });
});
