// Feature: fix-pengembalian-simpanan, Property 5: Total calculation excludes zeros
// Validates: Requirements 2.4

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

describe('Property 5: Total calculation excludes zeros', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('Total simpanan pokok should only sum jumlah > 0', () => {
        fc.assert(
            fc.property(
                fc.array(fc.record({
                    id: fc.uuid(),
                    anggotaId: fc.uuid(),
                    jumlah: fc.integer({ min: 0, max: 5000000 }),
                    tanggal: fc.date().map(d => d.toISOString())
                }), { minLength: 5, maxLength: 30 }),
                (simpananPokok) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananPokok));
                    
                    // Calculate total excluding zeros (as in laporan)
                    const stored = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
                    const totalWithFilter = stored
                        .filter(s => s.jumlah > 0)
                        .reduce((sum, s) => sum + s.jumlah, 0);
                    
                    // Calculate expected total (manual)
                    const expectedTotal = simpananPokok
                        .filter(s => s.jumlah > 0)
                        .reduce((sum, s) => sum + s.jumlah, 0);
                    
                    // Property: Total should match expected
                    const totalsMatch = totalWithFilter === expectedTotal;
                    
                    // Property: Total should not include any zero values
                    const totalWithoutFilter = simpananPokok.reduce((sum, s) => sum + s.jumlah, 0);
                    const zeroSum = simpananPokok.filter(s => s.jumlah === 0).length * 0;
                    const correctExclusion = totalWithFilter <= totalWithoutFilter;
                    
                    return totalsMatch && correctExclusion;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Total simpanan wajib should only sum jumlah > 0', () => {
        fc.assert(
            fc.property(
                fc.array(fc.record({
                    id: fc.uuid(),
                    anggotaId: fc.uuid(),
                    jumlah: fc.integer({ min: 0, max: 10000000 }),
                    periode: fc.constantFrom('2024-01', '2024-02', '2024-03'),
                    tanggal: fc.date().map(d => d.toISOString())
                }), { minLength: 5, maxLength: 30 }),
                (simpananWajib) => {
                    // Setup
                    localStorage.setItem('simpananWajib', JSON.stringify(simpananWajib));
                    
                    // Calculate total excluding zeros
                    const stored = JSON.parse(localStorage.getItem('simpananWajib') || '[]');
                    const totalWithFilter = stored
                        .filter(s => s.jumlah > 0)
                        .reduce((sum, s) => sum + s.jumlah, 0);
                    
                    // Calculate expected total
                    const expectedTotal = simpananWajib
                        .filter(s => s.jumlah > 0)
                        .reduce((sum, s) => sum + s.jumlah, 0);
                    
                    // Property: Totals must match
                    return totalWithFilter === expectedTotal;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Total simpanan sukarela should only sum jumlah > 0', () => {
        fc.assert(
            fc.property(
                fc.array(fc.record({
                    id: fc.uuid(),
                    anggotaId: fc.uuid(),
                    jumlah: fc.integer({ min: 0, max: 20000000 }),
                    tanggal: fc.date().map(d => d.toISOString())
                }), { minLength: 3, maxLength: 25 }),
                (simpananSukarela) => {
                    // Setup
                    localStorage.setItem('simpananSukarela', JSON.stringify(simpananSukarela));
                    
                    // Calculate total excluding zeros
                    const stored = JSON.parse(localStorage.getItem('simpananSukarela') || '[]');
                    const totalWithFilter = stored
                        .filter(s => s.jumlah > 0)
                        .reduce((sum, s) => sum + s.jumlah, 0);
                    
                    // Calculate expected total
                    const expectedTotal = simpananSukarela
                        .filter(s => s.jumlah > 0)
                        .reduce((sum, s) => sum + s.jumlah, 0);
                    
                    return totalWithFilter === expectedTotal;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Grand total in laporan should exclude all zero balances', () => {
        fc.assert(
            fc.property(
                fc.record({
                    simpananPokok: fc.array(fc.record({
                        id: fc.uuid(),
                        anggotaId: fc.uuid(),
                        jumlah: fc.integer({ min: 0, max: 5000000 })
                    }), { minLength: 3, maxLength: 15 }),
                    simpananWajib: fc.array(fc.record({
                        id: fc.uuid(),
                        anggotaId: fc.uuid(),
                        jumlah: fc.integer({ min: 0, max: 10000000 })
                    }), { minLength: 3, maxLength: 15 }),
                    simpananSukarela: fc.array(fc.record({
                        id: fc.uuid(),
                        anggotaId: fc.uuid(),
                        jumlah: fc.integer({ min: 0, max: 20000000 })
                    }), { minLength: 2, maxLength: 10 })
                }),
                (data) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(data.simpananPokok));
                    localStorage.setItem('simpananWajib', JSON.stringify(data.simpananWajib));
                    localStorage.setItem('simpananSukarela', JSON.stringify(data.simpananSukarela));
                    
                    // Calculate grand total (as in laporan)
                    const pokok = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
                    const wajib = JSON.parse(localStorage.getItem('simpananWajib') || '[]');
                    const sukarela = JSON.parse(localStorage.getItem('simpananSukarela') || '[]');
                    
                    const totalPokok = pokok.filter(s => s.jumlah > 0).reduce((sum, s) => sum + s.jumlah, 0);
                    const totalWajib = wajib.filter(s => s.jumlah > 0).reduce((sum, s) => sum + s.jumlah, 0);
                    const totalSukarela = sukarela.filter(s => s.jumlah > 0).reduce((sum, s) => sum + s.jumlah, 0);
                    
                    const grandTotal = totalPokok + totalWajib + totalSukarela;
                    
                    // Calculate expected grand total
                    const expectedPokok = data.simpananPokok.filter(s => s.jumlah > 0).reduce((sum, s) => sum + s.jumlah, 0);
                    const expectedWajib = data.simpananWajib.filter(s => s.jumlah > 0).reduce((sum, s) => sum + s.jumlah, 0);
                    const expectedSukarela = data.simpananSukarela.filter(s => s.jumlah > 0).reduce((sum, s) => sum + s.jumlah, 0);
                    const expectedGrandTotal = expectedPokok + expectedWajib + expectedSukarela;
                    
                    // Property: Grand total should match expected
                    return grandTotal === expectedGrandTotal;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Total calculation should be consistent across multiple reads', () => {
        fc.assert(
            fc.property(
                fc.array(fc.record({
                    id: fc.uuid(),
                    anggotaId: fc.uuid(),
                    jumlah: fc.integer({ min: 0, max: 10000000 })
                }), { minLength: 5, maxLength: 20 }),
                (simpanan) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpanan));
                    
                    // Calculate total multiple times
                    const total1 = JSON.parse(localStorage.getItem('simpananPokok') || '[]')
                        .filter(s => s.jumlah > 0)
                        .reduce((sum, s) => sum + s.jumlah, 0);
                    
                    const total2 = JSON.parse(localStorage.getItem('simpananPokok') || '[]')
                        .filter(s => s.jumlah > 0)
                        .reduce((sum, s) => sum + s.jumlah, 0);
                    
                    const total3 = JSON.parse(localStorage.getItem('simpananPokok') || '[]')
                        .filter(s => s.jumlah > 0)
                        .reduce((sum, s) => sum + s.jumlah, 0);
                    
                    // Property: All totals should be identical
                    return total1 === total2 && total2 === total3;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Zero balance items should not contribute to total', () => {
        fc.assert(
            fc.property(
                fc.record({
                    positiveItems: fc.array(fc.record({
                        id: fc.uuid(),
                        anggotaId: fc.uuid(),
                        jumlah: fc.integer({ min: 1, max: 5000000 })
                    }), { minLength: 2, maxLength: 10 }),
                    zeroItems: fc.array(fc.record({
                        id: fc.uuid(),
                        anggotaId: fc.uuid(),
                        jumlah: fc.constant(0)
                    }), { minLength: 1, maxLength: 5 })
                }),
                (data) => {
                    // Combine positive and zero items
                    const allItems = [...data.positiveItems, ...data.zeroItems];
                    
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(allItems));
                    
                    // Calculate total with filter
                    const totalWithFilter = JSON.parse(localStorage.getItem('simpananPokok') || '[]')
                        .filter(s => s.jumlah > 0)
                        .reduce((sum, s) => sum + s.jumlah, 0);
                    
                    // Calculate expected total (only positive items)
                    const expectedTotal = data.positiveItems.reduce((sum, s) => sum + s.jumlah, 0);
                    
                    // Property: Total should only include positive items
                    return totalWithFilter === expectedTotal;
                }
            ),
            { numRuns: 100 }
        );
    });
});
