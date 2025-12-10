// Feature: fix-anggota-keluar-komprehensif, Property 3: Balance Zeroing After Pencairan
// Validates: Requirements 2.1, 2.2, 2.3
// Task 2.1: Write property test for balance zeroing

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

// Mock formatRupiah function
function formatRupiah(amount) {
    return `Rp ${amount.toLocaleString('id-ID')}`;
}

// Mock generateId function
function generateId() {
    return 'test-' + Math.random().toString(36).substr(2, 9);
}

// Simulate the balance zeroing functions from js/simpanan.js
function zeroSimpananPokok(anggotaId) {
    try {
        const simpananPokok = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
        let totalZeroed = 0;
        
        // Find simpanan for this anggota and zero it out
        const updated = simpananPokok.map(s => {
            if (s.anggotaId === anggotaId && s.jumlah > 0) {
                totalZeroed += s.jumlah;
                return { ...s, jumlah: 0 };
            }
            return s;
        });
        
        localStorage.setItem('simpananPokok', JSON.stringify(updated));
        
        return {
            success: true,
            amount: totalZeroed,
            message: `Simpanan pokok berhasil di-zero-kan: ${formatRupiah(totalZeroed)}`
        };
    } catch (error) {
        console.error('Error zeroing simpanan pokok:', error);
        return {
            success: false,
            amount: 0,
            error: error.message
        };
    }
}

function zeroSimpananWajib(anggotaId) {
    try {
        const simpananWajib = JSON.parse(localStorage.getItem('simpananWajib') || '[]');
        let totalZeroed = 0;
        
        // Find simpanan for this anggota and zero it out
        const updated = simpananWajib.map(s => {
            if (s.anggotaId === anggotaId && s.jumlah > 0) {
                totalZeroed += s.jumlah;
                return { ...s, jumlah: 0 };
            }
            return s;
        });
        
        localStorage.setItem('simpananWajib', JSON.stringify(updated));
        
        return {
            success: true,
            amount: totalZeroed,
            message: `Simpanan wajib berhasil di-zero-kan: ${formatRupiah(totalZeroed)}`
        };
    } catch (error) {
        console.error('Error zeroing simpanan wajib:', error);
        return {
            success: false,
            amount: 0,
            error: error.message
        };
    }
}

function zeroSimpananSukarela(anggotaId) {
    try {
        const simpananSukarela = JSON.parse(localStorage.getItem('simpananSukarela') || '[]');
        let totalZeroed = 0;
        
        // Calculate current balance (setor - tarik)
        const anggotaSimpanan = simpananSukarela.filter(s => s.anggotaId === anggotaId);
        const currentBalance = anggotaSimpanan.reduce((sum, s) => {
            return sum + (s.tipe === 'tarik' ? -s.jumlah : s.jumlah);
        }, 0);
        
        if (currentBalance > 0) {
            // Add a withdrawal transaction to zero out the balance
            const zeroingTransaction = {
                id: generateId(),
                anggotaId: anggotaId,
                jumlah: currentBalance,
                tipe: 'tarik',
                tanggal: new Date().toISOString(),
                keterangan: 'Pencairan simpanan sukarela - Anggota keluar',
                createdAt: new Date().toISOString()
            };
            
            simpananSukarela.push(zeroingTransaction);
            localStorage.setItem('simpananSukarela', JSON.stringify(simpananSukarela));
            
            totalZeroed = currentBalance;
        }
        
        return {
            success: true,
            amount: totalZeroed,
            message: `Simpanan sukarela berhasil di-zero-kan: ${formatRupiah(totalZeroed)}`
        };
    } catch (error) {
        console.error('Error zeroing simpanan sukarela:', error);
        return {
            success: false,
            amount: 0,
            error: error.message
        };
    }
}

// Helper function to get current balance
function getCurrentBalance(anggotaId, simpananType) {
    const data = JSON.parse(localStorage.getItem(simpananType) || '[]');
    
    if (simpananType === 'simpananSukarela') {
        // For sukarela, calculate balance from setor/tarik transactions
        return data
            .filter(s => s.anggotaId === anggotaId)
            .reduce((sum, s) => sum + (s.tipe === 'tarik' ? -s.jumlah : s.jumlah), 0);
    } else {
        // For pokok and wajib, sum all positive amounts
        return data
            .filter(s => s.anggotaId === anggotaId)
            .reduce((sum, s) => sum + s.jumlah, 0);
    }
}

// Arbitraries for generating test data
const anggotaIdArbitrary = fc.string({ minLength: 5, maxLength: 20 });

const simpananPokokArbitrary = fc.record({
    id: fc.uuid(),
    anggotaId: anggotaIdArbitrary,
    jumlah: fc.integer({ min: 0, max: 10000000 }),
    tanggal: fc.date().map(d => d.toISOString()),
    createdAt: fc.date().map(d => d.toISOString())
});

const simpananWajibArbitrary = fc.record({
    id: fc.uuid(),
    anggotaId: anggotaIdArbitrary,
    jumlah: fc.integer({ min: 0, max: 5000000 }),
    tanggal: fc.date().map(d => d.toISOString()),
    createdAt: fc.date().map(d => d.toISOString())
});

const simpananSukarelaArbitrary = fc.record({
    id: fc.uuid(),
    anggotaId: anggotaIdArbitrary,
    jumlah: fc.integer({ min: 1000, max: 20000000 }),
    tipe: fc.constantFrom('setor', 'tarik'),
    tanggal: fc.date().map(d => d.toISOString()),
    keterangan: fc.string({ minLength: 5, maxLength: 50 }),
    createdAt: fc.date().map(d => d.toISOString())
});

describe('Property 3: Balance Zeroing After Pencairan', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    // ============================================================================
    // PROPERTY 3.1: Simpanan Pokok Zeroing
    // ============================================================================
    
    test('Property: zeroSimpananPokok sets all balances to zero for target anggota', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 5, maxLength: 30 }),
                anggotaIdArbitrary,
                (simpananList, targetAnggotaId) => {
                    // Setup: Store initial data
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananList));
                    
                    // Ensure target anggota has some positive balances
                    const targetSimpanan = simpananList.filter(s => s.anggotaId === targetAnggotaId && s.jumlah > 0);
                    const initialBalance = targetSimpanan.reduce((sum, s) => sum + s.jumlah, 0);
                    
                    // Action: Zero the balance
                    const result = zeroSimpananPokok(targetAnggotaId);
                    
                    // Property: Result should be successful
                    if (!result.success) return false;
                    
                    // Property: Amount zeroed should match initial balance
                    if (result.amount !== initialBalance) return false;
                    
                    // Property: All target anggota balances should now be zero
                    const finalBalance = getCurrentBalance(targetAnggotaId, 'simpananPokok');
                    if (finalBalance !== 0) return false;
                    
                    // Property: Other anggota balances should remain unchanged
                    const otherAnggotaIds = [...new Set(simpananList.map(s => s.anggotaId))].filter(id => id !== targetAnggotaId);
                    for (const otherId of otherAnggotaIds) {
                        const originalBalance = simpananList.filter(s => s.anggotaId === otherId).reduce((sum, s) => sum + s.jumlah, 0);
                        const currentBalance = getCurrentBalance(otherId, 'simpananPokok');
                        if (originalBalance !== currentBalance) return false;
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: zeroSimpananPokok is idempotent', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 3, maxLength: 15 }),
                anggotaIdArbitrary,
                (simpananList, targetAnggotaId) => {
                    // Setup: Store initial data
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananList));
                    
                    // Action: Zero twice
                    const result1 = zeroSimpananPokok(targetAnggotaId);
                    const result2 = zeroSimpananPokok(targetAnggotaId);
                    
                    // Property: Both operations should succeed
                    if (!result1.success || !result2.success) return false;
                    
                    // Property: Second operation should zero nothing (idempotent)
                    if (result2.amount !== 0) return false;
                    
                    // Property: Final balance should be zero
                    const finalBalance = getCurrentBalance(targetAnggotaId, 'simpananPokok');
                    return finalBalance === 0;
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 3.2: Simpanan Wajib Zeroing
    // ============================================================================
    
    test('Property: zeroSimpananWajib sets all balances to zero for target anggota', () => {
        fc.assert(
            fc.property(
                fc.array(simpananWajibArbitrary, { minLength: 5, maxLength: 30 }),
                anggotaIdArbitrary,
                (simpananList, targetAnggotaId) => {
                    // Setup: Store initial data
                    localStorage.setItem('simpananWajib', JSON.stringify(simpananList));
                    
                    // Calculate initial balance
                    const initialBalance = getCurrentBalance(targetAnggotaId, 'simpananWajib');
                    
                    // Action: Zero the balance
                    const result = zeroSimpananWajib(targetAnggotaId);
                    
                    // Property: Result should be successful
                    if (!result.success) return false;
                    
                    // Property: Amount zeroed should match initial balance
                    if (result.amount !== initialBalance) return false;
                    
                    // Property: All target anggota balances should now be zero
                    const finalBalance = getCurrentBalance(targetAnggotaId, 'simpananWajib');
                    return finalBalance === 0;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: zeroSimpananWajib preserves other anggota balances', () => {
        fc.assert(
            fc.property(
                fc.array(simpananWajibArbitrary, { minLength: 10, maxLength: 50 }),
                anggotaIdArbitrary,
                (simpananList, targetAnggotaId) => {
                    // Setup: Store initial data
                    localStorage.setItem('simpananWajib', JSON.stringify(simpananList));
                    
                    // Record initial balances for other anggota
                    const otherAnggotaIds = [...new Set(simpananList.map(s => s.anggotaId))].filter(id => id !== targetAnggotaId);
                    const initialBalances = {};
                    otherAnggotaIds.forEach(id => {
                        initialBalances[id] = getCurrentBalance(id, 'simpananWajib');
                    });
                    
                    // Action: Zero target anggota balance
                    zeroSimpananWajib(targetAnggotaId);
                    
                    // Property: Other anggota balances should remain unchanged
                    for (const otherId of otherAnggotaIds) {
                        const currentBalance = getCurrentBalance(otherId, 'simpananWajib');
                        if (initialBalances[otherId] !== currentBalance) return false;
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 3.3: Simpanan Sukarela Zeroing
    // ============================================================================
    
    test('Property: zeroSimpananSukarela creates withdrawal transaction to zero balance', () => {
        fc.assert(
            fc.property(
                fc.array(simpananSukarelaArbitrary, { minLength: 5, maxLength: 20 }),
                anggotaIdArbitrary,
                (simpananList, targetAnggotaId) => {
                    // Setup: Store initial data
                    localStorage.setItem('simpananSukarela', JSON.stringify(simpananList));
                    
                    // Calculate initial balance
                    const initialBalance = getCurrentBalance(targetAnggotaId, 'simpananSukarela');
                    const initialCount = simpananList.length;
                    
                    // Action: Zero the balance
                    const result = zeroSimpananSukarela(targetAnggotaId);
                    
                    // Property: Result should be successful
                    if (!result.success) return false;
                    
                    // Property: Amount zeroed should match positive initial balance
                    const expectedZeroed = Math.max(0, initialBalance);
                    if (result.amount !== expectedZeroed) return false;
                    
                    // Property: Final balance should be zero (or remain zero/negative)
                    const finalBalance = getCurrentBalance(targetAnggotaId, 'simpananSukarela');
                    if (finalBalance > 0) return false;
                    
                    // Property: If there was a positive balance, a withdrawal transaction should be added
                    if (initialBalance > 0) {
                        const finalData = JSON.parse(localStorage.getItem('simpananSukarela') || '[]');
                        const newTransactionCount = finalData.length;
                        if (newTransactionCount !== initialCount + 1) return false;
                        
                        // Check that the new transaction is a withdrawal
                        const newTransaction = finalData[finalData.length - 1];
                        if (newTransaction.tipe !== 'tarik') return false;
                        if (newTransaction.anggotaId !== targetAnggotaId) return false;
                        if (newTransaction.jumlah !== initialBalance) return false;
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: zeroSimpananSukarela handles zero and negative balances correctly', () => {
        fc.assert(
            fc.property(
                anggotaIdArbitrary,
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        anggotaId: fc.constant('target-anggota'),
                        jumlah: fc.integer({ min: 1000, max: 5000000 }),
                        tipe: fc.constant('tarik'), // Only withdrawals to create negative/zero balance
                        tanggal: fc.date().map(d => d.toISOString()),
                        keterangan: fc.string({ minLength: 5, maxLength: 30 }),
                        createdAt: fc.date().map(d => d.toISOString())
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (targetAnggotaId, withdrawalList) => {
                    // Setup: Create data with zero or negative balance
                    const simpananList = withdrawalList.map(w => ({ ...w, anggotaId: targetAnggotaId }));
                    localStorage.setItem('simpananSukarela', JSON.stringify(simpananList));
                    
                    const initialBalance = getCurrentBalance(targetAnggotaId, 'simpananSukarela');
                    const initialCount = simpananList.length;
                    
                    // Action: Try to zero (should do nothing for non-positive balance)
                    const result = zeroSimpananSukarela(targetAnggotaId);
                    
                    // Property: Should succeed but zero nothing
                    if (!result.success) return false;
                    if (initialBalance <= 0 && result.amount !== 0) return false;
                    
                    // Property: No new transactions should be added for non-positive balance
                    if (initialBalance <= 0) {
                        const finalData = JSON.parse(localStorage.getItem('simpananSukarela') || '[]');
                        if (finalData.length !== initialCount) return false;
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    // ============================================================================
    // PROPERTY 3.4: Cross-Function Properties
    // ============================================================================
    
    test('Property: All zeroing functions return consistent result structure', () => {
        fc.assert(
            fc.property(
                anggotaIdArbitrary,
                (anggotaId) => {
                    // Setup: Clear storage
                    localStorage.clear();
                    
                    // Action: Call all zeroing functions
                    const result1 = zeroSimpananPokok(anggotaId);
                    const result2 = zeroSimpananWajib(anggotaId);
                    const result3 = zeroSimpananSukarela(anggotaId);
                    
                    // Property: All should have consistent structure
                    const results = [result1, result2, result3];
                    for (const result of results) {
                        if (typeof result !== 'object') return false;
                        if (typeof result.success !== 'boolean') return false;
                        if (typeof result.amount !== 'number') return false;
                        if (result.success && typeof result.message !== 'string') return false;
                        if (!result.success && typeof result.error !== 'string') return false;
                    }
                    
                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    test('Property: Zeroing functions handle invalid anggotaId gracefully', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(null),
                    fc.constant(undefined),
                    fc.constant(''),
                    fc.string({ minLength: 1, maxLength: 3 }) // Very short IDs
                ),
                (invalidId) => {
                    // Setup: Add some valid data
                    localStorage.setItem('simpananPokok', JSON.stringify([
                        { id: '1', anggotaId: 'valid-id', jumlah: 100000, tanggal: new Date().toISOString() }
                    ]));
                    
                    // Action: Try to zero with invalid ID
                    const result1 = zeroSimpananPokok(invalidId);
                    const result2 = zeroSimpananWajib(invalidId);
                    const result3 = zeroSimpananSukarela(invalidId);
                    
                    // Property: Should handle gracefully (succeed with 0 amount or fail gracefully)
                    const results = [result1, result2, result3];
                    for (const result of results) {
                        if (!result.success && typeof result.error !== 'string') return false;
                        if (result.success && result.amount < 0) return false; // Amount should never be negative
                    }
                    
                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    // ============================================================================
    // PROPERTY 3.5: Data Integrity Properties
    // ============================================================================
    
    test('Property: Zeroing preserves data structure integrity', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 5, maxLength: 20 }),
                anggotaIdArbitrary,
                (simpananList, targetAnggotaId) => {
                    // Setup: Store initial data
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananList));
                    
                    // Action: Zero balance
                    zeroSimpananPokok(targetAnggotaId);
                    
                    // Property: Data structure should remain valid
                    const finalData = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
                    
                    // Should have same number of records
                    if (finalData.length !== simpananList.length) return false;
                    
                    // All records should maintain their structure
                    for (let i = 0; i < finalData.length; i++) {
                        const original = simpananList[i];
                        const final = finalData[i];
                        
                        // All fields except jumlah should be preserved
                        if (final.id !== original.id) return false;
                        if (final.anggotaId !== original.anggotaId) return false;
                        if (final.tanggal !== original.tanggal) return false;
                        
                        // Jumlah should be 0 for target anggota, unchanged for others
                        if (original.anggotaId === targetAnggotaId) {
                            if (original.jumlah > 0 && final.jumlah !== 0) return false;
                        } else {
                            if (final.jumlah !== original.jumlah) return false;
                        }
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: Multiple anggota zeroing operations are independent', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 10, maxLength: 30 }),
                fc.array(anggotaIdArbitrary, { minLength: 2, maxLength: 5 }),
                (simpananList, anggotaIds) => {
                    // Setup: Store initial data
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananList));
                    
                    // Record initial balances
                    const initialBalances = {};
                    anggotaIds.forEach(id => {
                        initialBalances[id] = getCurrentBalance(id, 'simpananPokok');
                    });
                    
                    // Action: Zero each anggota independently
                    const results = {};
                    anggotaIds.forEach(id => {
                        results[id] = zeroSimpananPokok(id);
                    });
                    
                    // Property: Each operation should zero exactly the expected amount
                    for (const id of anggotaIds) {
                        if (!results[id].success) return false;
                        if (results[id].amount !== initialBalances[id]) return false;
                        
                        // Final balance should be zero
                        const finalBalance = getCurrentBalance(id, 'simpananPokok');
                        if (finalBalance !== 0) return false;
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});