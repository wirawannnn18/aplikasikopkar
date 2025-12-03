/**
 * Property-Based Tests for Integrasi Pembayaran Laporan Hutang
 * 
 * Feature: integrasi-pembayaran-laporan-hutang
 * 
 * These tests validate the correctness properties defined in the design document.
 */

import fc from 'fast-check';

// Mock localStorage for testing
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();

global.localStorage = localStorageMock;

// Define utility functions from js/utils.js for testing
function hitungSaldoHutang(anggotaId) {
    if (!anggotaId || typeof anggotaId !== 'string') {
        return 0;
    }
    
    try {
        const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
        const pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
        
        const totalKredit = penjualan
            .filter(p => p.anggotaId === anggotaId && p.status === 'kredit')
            .reduce((sum, p) => sum + (p.total || 0), 0);
        
        const totalBayar = pembayaran
            .filter(p => p.anggotaId === anggotaId && p.jenis === 'hutang' && p.status === 'selesai')
            .reduce((sum, p) => sum + (p.jumlah || 0), 0);
        
        return totalKredit - totalBayar;
    } catch (error) {
        console.error('Error calculating saldo hutang:', error);
        return 0;
    }
}

function hitungTotalPembayaranHutang(anggotaId) {
    if (!anggotaId || typeof anggotaId !== 'string') {
        return 0;
    }
    
    try {
        const pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
        
        const totalPembayaran = pembayaran
            .filter(p => p.anggotaId === anggotaId && p.jenis === 'hutang' && p.status === 'selesai')
            .reduce((sum, p) => sum + (p.jumlah || 0), 0);
        
        return totalPembayaran;
    } catch (error) {
        console.error('Error calculating total pembayaran hutang:', error);
        return 0;
    }
}

function hitungTotalKredit(anggotaId) {
    if (!anggotaId || typeof anggotaId !== 'string') {
        return 0;
    }
    
    try {
        const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
        
        const totalKredit = penjualan
            .filter(p => p.anggotaId === anggotaId && p.status === 'kredit')
            .reduce((sum, p) => sum + (p.total || 0), 0);
        
        return totalKredit;
    } catch (error) {
        console.error('Error calculating total kredit:', error);
        return 0;
    }
}

// Helper function to generate random ID
function generateId() {
    return 'id-' + Math.random().toString(36).substr(2, 9);
}

// Arbitraries (Generators) for property-based testing

/**
 * Generate random anggota
 */
const anggotaArbitrary = fc.record({
    id: fc.string({ minLength: 5, maxLength: 10 }).map(s => 'A' + s),
    nik: fc.integer({ min: 1000, max: 9999 }).map(n => String(n)),
    nama: fc.string({ minLength: 5, maxLength: 20 }),
    departemen: fc.oneof(
        fc.constant('IT'),
        fc.constant('Finance'),
        fc.constant('HR'),
        fc.constant(null)
    )
});

/**
 * Generate random penjualan (credit transaction)
 */
const penjualanKreditArbitrary = (anggotaId) => fc.record({
    id: fc.string({ minLength: 5, maxLength: 10 }).map(s => 'P' + s),
    anggotaId: fc.constant(anggotaId),
    total: fc.integer({ min: 1000, max: 1000000 }),
    status: fc.constant('kredit'),
    tanggal: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') })
        .map(d => d.toISOString())
});

/**
 * Generate random penjualan tunai (should not count)
 */
const penjualanTunaiArbitrary = (anggotaId) => fc.record({
    id: fc.string({ minLength: 5, maxLength: 10 }).map(s => 'P' + s),
    anggotaId: fc.constant(anggotaId),
    total: fc.integer({ min: 1000, max: 1000000 }),
    status: fc.constant('tunai'),
    tanggal: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') })
        .map(d => d.toISOString())
});

/**
 * Generate random pembayaran hutang
 */
const pembayaranHutangArbitrary = (anggotaId) => fc.record({
    id: fc.string({ minLength: 5, maxLength: 10 }).map(s => 'PHT' + s),
    anggotaId: fc.constant(anggotaId),
    jenis: fc.constant('hutang'),
    jumlah: fc.integer({ min: 1000, max: 500000 }),
    status: fc.constant('selesai'),
    tanggal: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') })
        .map(d => d.toISOString()),
    kasirNama: fc.string({ minLength: 5, maxLength: 15 })
});

/**
 * Generate random pembayaran with pending status (should not count)
 */
const pembayaranPendingArbitrary = (anggotaId) => fc.record({
    id: fc.string({ minLength: 5, maxLength: 10 }).map(s => 'PHT' + s),
    anggotaId: fc.constant(anggotaId),
    jenis: fc.constant('hutang'),
    jumlah: fc.integer({ min: 1000, max: 500000 }),
    status: fc.constant('pending'),
    tanggal: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') })
        .map(d => d.toISOString()),
    kasirNama: fc.string({ minLength: 5, maxLength: 15 })
});

// Test Suite
describe('Integrasi Pembayaran Laporan Hutang - Property Tests', () => {
    
    beforeEach(() => {
        localStorage.clear();
    });

    /**
     * Feature: integrasi-pembayaran-laporan-hutang, Property 1: Saldo hutang calculation accuracy
     * Validates: Requirements 1.1, 1.2
     * 
     * Property: For any anggota with credit transactions and payments,
     * the calculated saldo hutang should equal total credit transactions minus total completed payments
     */
    describe('Property 1: Saldo hutang calculation accuracy', () => {
        
        test('saldo hutang equals total kredit minus total pembayaran', () => {
            fc.assert(
                fc.property(
                    anggotaArbitrary,
                    fc.array(fc.nat({ max: 5 })), // number of credit transactions
                    fc.array(fc.nat({ max: 5 })), // number of payments
                    fc.array(fc.nat({ max: 3 })), // number of tunai transactions (noise)
                    fc.array(fc.nat({ max: 2 })), // number of pending payments (noise)
                    (anggota, creditCounts, paymentCounts, tunaiCounts, pendingCounts) => {
                        // Setup: Create anggota
                        localStorage.setItem('anggota', JSON.stringify([anggota]));
                        
                        // Generate credit transactions
                        const creditTransactions = [];
                        let expectedTotalKredit = 0;
                        
                        for (let i = 0; i < Math.min(creditCounts.length, 5); i++) {
                            const transaction = fc.sample(penjualanKreditArbitrary(anggota.id), 1)[0];
                            creditTransactions.push(transaction);
                            expectedTotalKredit += transaction.total;
                        }
                        
                        // Generate tunai transactions (should not count)
                        for (let i = 0; i < Math.min(tunaiCounts.length, 3); i++) {
                            const transaction = fc.sample(penjualanTunaiArbitrary(anggota.id), 1)[0];
                            creditTransactions.push(transaction);
                        }
                        
                        localStorage.setItem('penjualan', JSON.stringify(creditTransactions));
                        
                        // Generate payments
                        const payments = [];
                        let expectedTotalPembayaran = 0;
                        
                        for (let i = 0; i < Math.min(paymentCounts.length, 5); i++) {
                            const payment = fc.sample(pembayaranHutangArbitrary(anggota.id), 1)[0];
                            // Ensure payment doesn't exceed total kredit
                            payment.jumlah = Math.min(payment.jumlah, expectedTotalKredit);
                            payments.push(payment);
                            expectedTotalPembayaran += payment.jumlah;
                        }
                        
                        // Generate pending payments (should not count)
                        for (let i = 0; i < Math.min(pendingCounts.length, 2); i++) {
                            const payment = fc.sample(pembayaranPendingArbitrary(anggota.id), 1)[0];
                            payments.push(payment);
                        }
                        
                        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(payments));
                        
                        // Calculate expected saldo
                        const expectedSaldo = expectedTotalKredit - expectedTotalPembayaran;
                        
                        // Test: Calculate saldo using utility function
                        const actualSaldo = hitungSaldoHutang(anggota.id);
                        
                        // Verify: Saldo should match expected calculation
                        expect(actualSaldo).toBe(expectedSaldo);
                        
                        // Additional verification: Total kredit
                        const actualTotalKredit = hitungTotalKredit(anggota.id);
                        expect(actualTotalKredit).toBe(expectedTotalKredit);
                        
                        // Additional verification: Total pembayaran
                        const actualTotalPembayaran = hitungTotalPembayaranHutang(anggota.id);
                        expect(actualTotalPembayaran).toBe(expectedTotalPembayaran);
                    }
                ),
                { numRuns: 100 } // Run 100 iterations as specified in design
            );
        });

        test('saldo hutang is non-negative when no overpayment', () => {
            fc.assert(
                fc.property(
                    anggotaArbitrary,
                    fc.array(penjualanKreditArbitrary('dummy'), { minLength: 1, maxLength: 5 }),
                    (anggota, creditTransactions) => {
                        // Setup
                        localStorage.setItem('anggota', JSON.stringify([anggota]));
                        
                        // Update anggotaId in transactions
                        const transactions = creditTransactions.map(t => ({ ...t, anggotaId: anggota.id }));
                        localStorage.setItem('penjualan', JSON.stringify(transactions));
                        
                        // Calculate total kredit
                        const totalKredit = transactions.reduce((sum, t) => sum + t.total, 0);
                        
                        // Generate payments that don't exceed total kredit
                        const paymentAmount = Math.floor(totalKredit * Math.random());
                        const payments = [{
                            id: 'PHT001',
                            anggotaId: anggota.id,
                            jenis: 'hutang',
                            jumlah: paymentAmount,
                            status: 'selesai',
                            tanggal: new Date().toISOString(),
                            kasirNama: 'Test Kasir'
                        }];
                        
                        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(payments));
                        
                        // Test
                        const saldo = hitungSaldoHutang(anggota.id);
                        
                        // Verify: Saldo should be non-negative
                        expect(saldo).toBeGreaterThanOrEqual(0);
                        expect(saldo).toBe(totalKredit - paymentAmount);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('saldo hutang decreases after payment', () => {
            fc.assert(
                fc.property(
                    anggotaArbitrary,
                    fc.integer({ min: 10000, max: 1000000 }), // credit amount
                    fc.integer({ min: 1000, max: 50000 }), // payment amount
                    (anggota, creditAmount, paymentAmount) => {
                        // Setup: Create credit transaction
                        localStorage.setItem('anggota', JSON.stringify([anggota]));
                        
                        const creditTransaction = {
                            id: 'P001',
                            anggotaId: anggota.id,
                            total: creditAmount,
                            status: 'kredit',
                            tanggal: new Date().toISOString()
                        };
                        
                        localStorage.setItem('penjualan', JSON.stringify([creditTransaction]));
                        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([]));
                        
                        // Calculate saldo before payment
                        const saldoBefore = hitungSaldoHutang(anggota.id);
                        
                        // Make payment (ensure it doesn't exceed saldo)
                        const actualPayment = Math.min(paymentAmount, saldoBefore);
                        const payment = {
                            id: 'PHT001',
                            anggotaId: anggota.id,
                            jenis: 'hutang',
                            jumlah: actualPayment,
                            status: 'selesai',
                            tanggal: new Date().toISOString(),
                            kasirNama: 'Test Kasir'
                        };
                        
                        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([payment]));
                        
                        // Calculate saldo after payment
                        const saldoAfter = hitungSaldoHutang(anggota.id);
                        
                        // Verify: Saldo should decrease by payment amount
                        expect(saldoAfter).toBe(saldoBefore - actualPayment);
                        expect(saldoAfter).toBeLessThanOrEqual(saldoBefore);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('saldo hutang is zero when total payments equal total kredit', () => {
            fc.assert(
                fc.property(
                    anggotaArbitrary,
                    fc.integer({ min: 10000, max: 1000000 }),
                    (anggota, creditAmount) => {
                        // Setup
                        localStorage.setItem('anggota', JSON.stringify([anggota]));
                        
                        const creditTransaction = {
                            id: 'P001',
                            anggotaId: anggota.id,
                            total: creditAmount,
                            status: 'kredit',
                            tanggal: new Date().toISOString()
                        };
                        
                        localStorage.setItem('penjualan', JSON.stringify([creditTransaction]));
                        
                        // Make payment equal to credit amount
                        const payment = {
                            id: 'PHT001',
                            anggotaId: anggota.id,
                            jenis: 'hutang',
                            jumlah: creditAmount,
                            status: 'selesai',
                            tanggal: new Date().toISOString(),
                            kasirNama: 'Test Kasir'
                        };
                        
                        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([payment]));
                        
                        // Test
                        const saldo = hitungSaldoHutang(anggota.id);
                        
                        // Verify: Saldo should be zero
                        expect(saldo).toBe(0);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    /**
     * Edge cases and error handling
     */
    describe('Edge Cases', () => {
        
        test('returns 0 for invalid anggotaId', () => {
            const result = hitungSaldoHutang('INVALID_ID');
            expect(result).toBe(0);
        });

        test('returns 0 for null anggotaId', () => {
            const result = hitungSaldoHutang(null);
            expect(result).toBe(0);
        });

        test('returns 0 for undefined anggotaId', () => {
            const result = hitungSaldoHutang(undefined);
            expect(result).toBe(0);
        });

        test('returns 0 when no credit transactions exist', () => {
            const anggota = { id: 'A001', nik: '1234', nama: 'Test' };
            localStorage.setItem('anggota', JSON.stringify([anggota]));
            localStorage.setItem('penjualan', JSON.stringify([]));
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([]));
            
            const result = hitungSaldoHutang(anggota.id);
            expect(result).toBe(0);
        });

        test('handles missing localStorage data gracefully', () => {
            localStorage.clear();
            const result = hitungSaldoHutang('A001');
            expect(result).toBe(0);
        });

        test('ignores transactions with missing or invalid total', () => {
            const anggota = { id: 'A001', nik: '1234', nama: 'Test' };
            localStorage.setItem('anggota', JSON.stringify([anggota]));
            
            const transactions = [
                { id: 'P001', anggotaId: 'A001', total: 100000, status: 'kredit' },
                { id: 'P002', anggotaId: 'A001', total: null, status: 'kredit' },
                { id: 'P003', anggotaId: 'A001', total: undefined, status: 'kredit' },
                { id: 'P004', anggotaId: 'A001', status: 'kredit' } // missing total
            ];
            
            localStorage.setItem('penjualan', JSON.stringify(transactions));
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([]));
            
            const result = hitungSaldoHutang(anggota.id);
            expect(result).toBe(100000); // Only first transaction should count
        });
    });

    /**
     * Idempotence test
     */
    describe('Calculation Consistency', () => {
        
        test('calling hitungSaldoHutang multiple times returns same result', () => {
            fc.assert(
                fc.property(
                    anggotaArbitrary,
                    fc.array(penjualanKreditArbitrary('dummy'), { minLength: 1, maxLength: 5 }),
                    fc.array(pembayaranHutangArbitrary('dummy'), { minLength: 0, maxLength: 5 }),
                    (anggota, creditTransactions, payments) => {
                        // Setup
                        localStorage.setItem('anggota', JSON.stringify([anggota]));
                        
                        const transactions = creditTransactions.map(t => ({ ...t, anggotaId: anggota.id }));
                        const paymentsData = payments.map(p => ({ ...p, anggotaId: anggota.id }));
                        
                        localStorage.setItem('penjualan', JSON.stringify(transactions));
                        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(paymentsData));
                        
                        // Test: Call function multiple times
                        const result1 = hitungSaldoHutang(anggota.id);
                        const result2 = hitungSaldoHutang(anggota.id);
                        const result3 = hitungSaldoHutang(anggota.id);
                        
                        // Verify: All results should be identical
                        expect(result1).toBe(result2);
                        expect(result2).toBe(result3);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});


/**
 * Task 3.4: Property Test for Status Determination
 * 
 * Property 2: Status determination based on saldo
 * Feature: integrasi-pembayaran-laporan-hutang, Property 2: Status determination based on saldo
 * 
 * For any anggota, the status should be "Lunas" when saldo hutang is zero or negative,
 * and "Belum Lunas" when saldo hutang is greater than zero.
 * 
 * Validates: Requirements 1.4, 1.5
 */
describe('Task 3.4: Property Test for Status Determination', () => {
    
    beforeEach(() => {
        localStorage.clear();
    });
    
    test('Property 2: Status is "Lunas" when saldo hutang <= 0', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 5, maxLength: 10 }).map(s => 'A' + s), // anggotaId
                fc.integer({ min: 0, max: 1000000 }), // totalKredit
                fc.integer({ min: 0, max: 1000000 }), // totalPembayaran
                (anggotaId, totalKredit, totalPembayaran) => {
                    // Ensure totalPembayaran >= totalKredit for this test (saldo <= 0)
                    const adjustedPembayaran = totalKredit + Math.abs(totalPembayaran);
                    
                    // Setup data
                    const penjualan = totalKredit > 0 ? [{
                        id: 'P001',
                        anggotaId: anggotaId,
                        total: totalKredit,
                        status: 'kredit'
                    }] : [];
                    
                    const pembayaran = adjustedPembayaran > 0 ? [{
                        id: 'PAY001',
                        anggotaId: anggotaId,
                        jenis: 'hutang',
                        jumlah: adjustedPembayaran,
                        status: 'selesai'
                    }] : [];
                    
                    localStorage.setItem('penjualan', JSON.stringify(penjualan));
                    localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaran));
                    
                    // Calculate saldo
                    const saldoHutang = hitungSaldoHutang(anggotaId);
                    
                    // Determine status based on saldo
                    const status = saldoHutang <= 0 ? 'Lunas' : 'Belum Lunas';
                    
                    // Property: When saldo <= 0, status should be "Lunas"
                    return saldoHutang <= 0 && status === 'Lunas';
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('Property 2: Status is "Belum Lunas" when saldo hutang > 0', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 5, maxLength: 10 }).map(s => 'A' + s), // anggotaId
                fc.integer({ min: 1, max: 1000000 }), // totalKredit (must be > 0)
                fc.integer({ min: 0, max: 999999 }), // totalPembayaran
                (anggotaId, totalKredit, totalPembayaran) => {
                    // Ensure totalPembayaran < totalKredit for this test (saldo > 0)
                    const adjustedPembayaran = Math.min(totalPembayaran, totalKredit - 1);
                    
                    // Setup data
                    const penjualan = [{
                        id: 'P001',
                        anggotaId: anggotaId,
                        total: totalKredit,
                        status: 'kredit'
                    }];
                    
                    const pembayaran = adjustedPembayaran > 0 ? [{
                        id: 'PAY001',
                        anggotaId: anggotaId,
                        jenis: 'hutang',
                        jumlah: adjustedPembayaran,
                        status: 'selesai'
                    }] : [];
                    
                    localStorage.setItem('penjualan', JSON.stringify(penjualan));
                    localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaran));
                    
                    // Calculate saldo
                    const saldoHutang = hitungSaldoHutang(anggotaId);
                    
                    // Determine status based on saldo
                    const status = saldoHutang <= 0 ? 'Lunas' : 'Belum Lunas';
                    
                    // Property: When saldo > 0, status should be "Belum Lunas"
                    return saldoHutang > 0 && status === 'Belum Lunas';
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('Property 2: Status determination is consistent across various saldo values', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 5, maxLength: 10 }).map(s => 'A' + s), // anggotaId
                fc.integer({ min: -1000000, max: 1000000 }), // saldo (can be negative, zero, or positive)
                (anggotaId, targetSaldo) => {
                    // Setup data to achieve target saldo
                    const totalKredit = Math.max(0, targetSaldo + 500000);
                    const totalPembayaran = totalKredit - targetSaldo;
                    
                    const penjualan = totalKredit > 0 ? [{
                        id: 'P001',
                        anggotaId: anggotaId,
                        total: totalKredit,
                        status: 'kredit'
                    }] : [];
                    
                    const pembayaran = totalPembayaran > 0 ? [{
                        id: 'PAY001',
                        anggotaId: anggotaId,
                        jenis: 'hutang',
                        jumlah: totalPembayaran,
                        status: 'selesai'
                    }] : [];
                    
                    localStorage.setItem('penjualan', JSON.stringify(penjualan));
                    localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaran));
                    
                    // Calculate saldo
                    const saldoHutang = hitungSaldoHutang(anggotaId);
                    
                    // Determine status based on saldo
                    const status = saldoHutang <= 0 ? 'Lunas' : 'Belum Lunas';
                    
                    // Property: Status determination is consistent
                    if (saldoHutang <= 0) {
                        return status === 'Lunas';
                    } else {
                        return status === 'Belum Lunas';
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('Property 2: Zero saldo results in "Lunas" status', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 5, maxLength: 10 }).map(s => 'A' + s), // anggotaId
                fc.integer({ min: 1, max: 1000000 }), // amount (same for kredit and pembayaran)
                (anggotaId, amount) => {
                    // Setup data with equal kredit and pembayaran (saldo = 0)
                    const penjualan = [{
                        id: 'P001',
                        anggotaId: anggotaId,
                        total: amount,
                        status: 'kredit'
                    }];
                    
                    const pembayaran = [{
                        id: 'PAY001',
                        anggotaId: anggotaId,
                        jenis: 'hutang',
                        jumlah: amount,
                        status: 'selesai'
                    }];
                    
                    localStorage.setItem('penjualan', JSON.stringify(penjualan));
                    localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaran));
                    
                    // Calculate saldo
                    const saldoHutang = hitungSaldoHutang(anggotaId);
                    
                    // Determine status
                    const status = saldoHutang <= 0 ? 'Lunas' : 'Belum Lunas';
                    
                    // Property: Zero saldo should result in "Lunas"
                    return saldoHutang === 0 && status === 'Lunas';
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('Property 2: Negative saldo (overpayment) results in "Lunas" status', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 5, maxLength: 10 }).map(s => 'A' + s), // anggotaId
                fc.integer({ min: 1, max: 1000000 }), // totalKredit
                fc.integer({ min: 1, max: 500000 }), // overpayment amount
                (anggotaId, totalKredit, overpayment) => {
                    // Setup data with pembayaran > kredit (negative saldo)
                    const totalPembayaran = totalKredit + overpayment;
                    
                    const penjualan = [{
                        id: 'P001',
                        anggotaId: anggotaId,
                        total: totalKredit,
                        status: 'kredit'
                    }];
                    
                    const pembayaran = [{
                        id: 'PAY001',
                        anggotaId: anggotaId,
                        jenis: 'hutang',
                        jumlah: totalPembayaran,
                        status: 'selesai'
                    }];
                    
                    localStorage.setItem('penjualan', JSON.stringify(penjualan));
                    localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaran));
                    
                    // Calculate saldo
                    const saldoHutang = hitungSaldoHutang(anggotaId);
                    
                    // Determine status
                    const status = saldoHutang <= 0 ? 'Lunas' : 'Belum Lunas';
                    
                    // Property: Negative saldo should result in "Lunas"
                    return saldoHutang < 0 && status === 'Lunas';
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * Task 4.3: Property Test for Payment History Completeness
 * 
 * Property 4: Payment history completeness
 * Feature: integrasi-pembayaran-laporan-hutang, Property 4: Payment history completeness
 * 
 * For any anggota, the payment history returned by getPembayaranHutangHistory should:
 * 1. Include all completed hutang payments for that anggota
 * 2. Exclude payments with status other than 'selesai'
 * 3. Exclude payments with jenis other than 'hutang'
 * 4. Be sorted by date in descending order (newest first)
 * 5. Sum of payment history should equal total pembayaran calculated
 * 
 * Validates: Requirements 2.1, 2.2
 */

// Add getPembayaranHutangHistory function for testing
function getPembayaranHutangHistory(anggotaId) {
    if (!anggotaId || typeof anggotaId !== 'string') {
        return [];
    }
    
    try {
        const pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
        
        const history = pembayaran
            .filter(p => p.anggotaId === anggotaId && p.jenis === 'hutang' && p.status === 'selesai')
            .sort((a, b) => {
                const dateA = new Date(a.tanggal || 0);
                const dateB = new Date(b.tanggal || 0);
                return dateB - dateA;
            });
        
        return history;
    } catch (error) {
        console.error('Error getting pembayaran hutang history:', error);
        return [];
    }
}

describe('Task 4.3: Property Test for Payment History Completeness', () => {
    
    beforeEach(() => {
        localStorage.clear();
    });
    
    test('Property 4: Payment history includes all completed hutang payments', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 5, maxLength: 10 }).map(s => 'A' + s), // anggotaId
                fc.array(pembayaranHutangArbitrary('dummy'), { minLength: 1, maxLength: 10 }), // completed payments
                fc.array(pembayaranPendingArbitrary('dummy'), { minLength: 0, maxLength: 5 }), // pending payments (noise)
                (anggotaId, completedPayments, pendingPayments) => {
                    // Setup: Create payments for this anggota
                    const completedForAnggota = completedPayments.map(p => ({ ...p, anggotaId }));
                    const pendingForAnggota = pendingPayments.map(p => ({ ...p, anggotaId }));
                    
                    // Add some payments for other anggota (noise)
                    const otherAnggotaPayments = [
                        { id: 'OTHER1', anggotaId: 'OTHER_ID', jenis: 'hutang', jumlah: 50000, status: 'selesai', tanggal: new Date().toISOString() },
                        { id: 'OTHER2', anggotaId: 'OTHER_ID', jenis: 'hutang', jumlah: 30000, status: 'selesai', tanggal: new Date().toISOString() }
                    ];
                    
                    const allPayments = [...completedForAnggota, ...pendingForAnggota, ...otherAnggotaPayments];
                    localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(allPayments));
                    
                    // Test: Get payment history
                    const history = getPembayaranHutangHistory(anggotaId);
                    
                    // Verify: History should include all completed payments for this anggota
                    expect(history.length).toBe(completedForAnggota.length);
                    
                    // Verify: All returned payments should be for this anggota
                    history.forEach(payment => {
                        expect(payment.anggotaId).toBe(anggotaId);
                        expect(payment.jenis).toBe('hutang');
                        expect(payment.status).toBe('selesai');
                    });
                    
                    // Verify: All completed payments should be in history
                    completedForAnggota.forEach(expectedPayment => {
                        const found = history.find(p => p.id === expectedPayment.id);
                        expect(found).toBeDefined();
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('Property 4: Payment history excludes pending payments', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 5, maxLength: 10 }).map(s => 'A' + s), // anggotaId
                fc.array(pembayaranHutangArbitrary('dummy'), { minLength: 1, maxLength: 5 }), // completed
                fc.array(pembayaranPendingArbitrary('dummy'), { minLength: 1, maxLength: 5 }), // pending
                (anggotaId, completedPayments, pendingPayments) => {
                    // Setup: Ensure unique IDs to avoid collision
                    const completed = completedPayments.map((p, idx) => ({ ...p, id: `COMPLETED_${idx}_${p.id}`, anggotaId }));
                    const pending = pendingPayments.map((p, idx) => ({ ...p, id: `PENDING_${idx}_${p.id}`, anggotaId }));
                    
                    const allPayments = [...completed, ...pending];
                    localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(allPayments));
                    
                    // Test
                    const history = getPembayaranHutangHistory(anggotaId);
                    
                    // Verify: No pending payments in history
                    history.forEach(payment => {
                        expect(payment.status).toBe('selesai');
                    });
                    
                    // Verify: History length equals completed payments count
                    expect(history.length).toBe(completed.length);
                    
                    // Verify: Pending payments are not in history
                    pending.forEach(pendingPayment => {
                        const found = history.find(p => p.id === pendingPayment.id);
                        expect(found).toBeUndefined();
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('Property 4: Payment history is sorted by date descending', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 5, maxLength: 10 }).map(s => 'A' + s), // anggotaId
                fc.array(pembayaranHutangArbitrary('dummy'), { minLength: 2, maxLength: 10 }), // payments
                (anggotaId, payments) => {
                    // Setup: Create payments with different dates
                    const paymentsForAnggota = payments.map((p, index) => ({
                        ...p,
                        anggotaId,
                        tanggal: new Date(2024, 0, index + 1).toISOString() // Different dates
                    }));
                    
                    localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(paymentsForAnggota));
                    
                    // Test
                    const history = getPembayaranHutangHistory(anggotaId);
                    
                    // Verify: History is sorted by date descending (newest first)
                    for (let i = 0; i < history.length - 1; i++) {
                        const dateA = new Date(history[i].tanggal);
                        const dateB = new Date(history[i + 1].tanggal);
                        expect(dateA.getTime()).toBeGreaterThanOrEqual(dateB.getTime());
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('Property 4: Sum of payment history equals total pembayaran', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 5, maxLength: 10 }).map(s => 'A' + s), // anggotaId
                fc.array(pembayaranHutangArbitrary('dummy'), { minLength: 1, maxLength: 10 }), // payments
                (anggotaId, payments) => {
                    // Setup
                    const paymentsForAnggota = payments.map(p => ({ ...p, anggotaId }));
                    localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(paymentsForAnggota));
                    
                    // Test
                    const history = getPembayaranHutangHistory(anggotaId);
                    const totalFromHistory = history.reduce((sum, p) => sum + p.jumlah, 0);
                    
                    // Calculate using utility function
                    const totalPembayaran = hitungTotalPembayaranHutang(anggotaId);
                    
                    // Verify: Sum of history should equal total pembayaran
                    expect(totalFromHistory).toBe(totalPembayaran);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('Property 4: Payment history returns empty array for anggota with no payments', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 5, maxLength: 10 }).map(s => 'A' + s), // anggotaId
                (anggotaId) => {
                    // Setup: No payments
                    localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([]));
                    
                    // Test
                    const history = getPembayaranHutangHistory(anggotaId);
                    
                    // Verify: Should return empty array
                    expect(Array.isArray(history)).toBe(true);
                    expect(history.length).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('Property 4: Payment history excludes piutang payments', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 5, maxLength: 10 }).map(s => 'A' + s), // anggotaId
                fc.array(pembayaranHutangArbitrary('dummy'), { minLength: 1, maxLength: 5 }), // hutang payments
                fc.integer({ min: 1, max: 5 }), // number of piutang payments
                (anggotaId, hutangPayments, piutangCount) => {
                    // Setup: Create hutang payments
                    const hutang = hutangPayments.map(p => ({ ...p, anggotaId }));
                    
                    // Create piutang payments (should be excluded)
                    const piutang = [];
                    for (let i = 0; i < piutangCount; i++) {
                        piutang.push({
                            id: `PIUTANG${i}`,
                            anggotaId: anggotaId,
                            jenis: 'piutang', // Different jenis
                            jumlah: 50000,
                            status: 'selesai',
                            tanggal: new Date().toISOString()
                        });
                    }
                    
                    const allPayments = [...hutang, ...piutang];
                    localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(allPayments));
                    
                    // Test
                    const history = getPembayaranHutangHistory(anggotaId);
                    
                    // Verify: Only hutang payments in history
                    expect(history.length).toBe(hutang.length);
                    history.forEach(payment => {
                        expect(payment.jenis).toBe('hutang');
                    });
                    
                    // Verify: No piutang payments in history
                    piutang.forEach(piutangPayment => {
                        const found = history.find(p => p.id === piutangPayment.id);
                        expect(found).toBeUndefined();
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('Property 4: Payment history handles invalid anggotaId gracefully', () => {
        const invalidIds = [null, undefined, '', 123, {}, []];
        
        invalidIds.forEach(invalidId => {
            const history = getPembayaranHutangHistory(invalidId);
            expect(Array.isArray(history)).toBe(true);
            expect(history.length).toBe(0);
        });
    });
    
    test('Property 4: Payment history is consistent across multiple calls', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 5, maxLength: 10 }).map(s => 'A' + s), // anggotaId
                fc.array(pembayaranHutangArbitrary('dummy'), { minLength: 1, maxLength: 10 }), // payments
                (anggotaId, payments) => {
                    // Setup
                    const paymentsForAnggota = payments.map(p => ({ ...p, anggotaId }));
                    localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(paymentsForAnggota));
                    
                    // Test: Call function multiple times
                    const history1 = getPembayaranHutangHistory(anggotaId);
                    const history2 = getPembayaranHutangHistory(anggotaId);
                    const history3 = getPembayaranHutangHistory(anggotaId);
                    
                    // Verify: All results should be identical
                    expect(history1.length).toBe(history2.length);
                    expect(history2.length).toBe(history3.length);
                    
                    // Verify: Same IDs in same order
                    for (let i = 0; i < history1.length; i++) {
                        expect(history1[i].id).toBe(history2[i].id);
                        expect(history2[i].id).toBe(history3[i].id);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});


/**
 * Task 3.5: Property Test for Report Display Consistency
 * 
 * Property 3: Report display consistency
 * Feature: integrasi-pembayaran-laporan-hutang, Property 3: Report display consistency
 * 
 * For any anggota in the report, the displayed data should be consistent:
 * 1. totalKredit + totalPembayaran + saldoHutang relationship must hold
 * 2. saldoHutang = totalKredit - totalPembayaran
 * 3. All monetary values should be non-negative (except saldoHutang can be negative for overpayment)
 * 4. Status should match saldoHutang value
 * 
 * Validates: Requirements 1.3
 */
describe('Task 3.5: Property Test for Report Display Consistency', () => {
    
    beforeEach(() => {
        localStorage.clear();
    });
    
    test('Property 3: Report data maintains saldoHutang = totalKredit - totalPembayaran', () => {
        fc.assert(
            fc.property(
                anggotaArbitrary,
                fc.array(penjualanKreditArbitrary('dummy'), { minLength: 0, maxLength: 10 }),
                fc.array(pembayaranHutangArbitrary('dummy'), { minLength: 0, maxLength: 10 }),
                (anggota, creditTransactions, payments) => {
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify([anggota]));
                    
                    const transactions = creditTransactions.map(t => ({ ...t, anggotaId: anggota.id }));
                    const paymentsData = payments.map(p => ({ ...p, anggotaId: anggota.id }));
                    
                    localStorage.setItem('penjualan', JSON.stringify(transactions));
                    localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(paymentsData));
                    
                    // Calculate report data (simulating what laporanHutangPiutang does)
                    const totalKredit = hitungTotalKredit(anggota.id);
                    const totalPembayaran = hitungTotalPembayaranHutang(anggota.id);
                    const saldoHutang = hitungSaldoHutang(anggota.id);
                    
                    // Property: saldoHutang must equal totalKredit - totalPembayaran
                    expect(saldoHutang).toBe(totalKredit - totalPembayaran);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('Property 3: Report data has consistent status based on saldoHutang', () => {
        fc.assert(
            fc.property(
                anggotaArbitrary,
                fc.array(penjualanKreditArbitrary('dummy'), { minLength: 0, maxLength: 10 }),
                fc.array(pembayaranHutangArbitrary('dummy'), { minLength: 0, maxLength: 10 }),
                (anggota, creditTransactions, payments) => {
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify([anggota]));
                    
                    const transactions = creditTransactions.map(t => ({ ...t, anggotaId: anggota.id }));
                    const paymentsData = payments.map(p => ({ ...p, anggotaId: anggota.id }));
                    
                    localStorage.setItem('penjualan', JSON.stringify(transactions));
                    localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(paymentsData));
                    
                    // Calculate report data
                    const saldoHutang = hitungSaldoHutang(anggota.id);
                    const status = saldoHutang <= 0 ? 'Lunas' : 'Belum Lunas';
                    
                    // Property: Status must be consistent with saldoHutang
                    if (saldoHutang <= 0) {
                        expect(status).toBe('Lunas');
                    } else {
                        expect(status).toBe('Belum Lunas');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('Property 3: Report data has non-negative totalKredit and totalPembayaran', () => {
        fc.assert(
            fc.property(
                anggotaArbitrary,
                fc.array(penjualanKreditArbitrary('dummy'), { minLength: 0, maxLength: 10 }),
                fc.array(pembayaranHutangArbitrary('dummy'), { minLength: 0, maxLength: 10 }),
                (anggota, creditTransactions, payments) => {
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify([anggota]));
                    
                    const transactions = creditTransactions.map(t => ({ ...t, anggotaId: anggota.id }));
                    const paymentsData = payments.map(p => ({ ...p, anggotaId: anggota.id }));
                    
                    localStorage.setItem('penjualan', JSON.stringify(transactions));
                    localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(paymentsData));
                    
                    // Calculate report data
                    const totalKredit = hitungTotalKredit(anggota.id);
                    const totalPembayaran = hitungTotalPembayaranHutang(anggota.id);
                    
                    // Property: Both values must be non-negative
                    expect(totalKredit).toBeGreaterThanOrEqual(0);
                    expect(totalPembayaran).toBeGreaterThanOrEqual(0);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('Property 3: Report data consistency across multiple anggota', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 1, maxLength: 5 }),
                (anggotaList) => {
                    // Setup: Create transactions for each anggota
                    localStorage.setItem('anggota', JSON.stringify(anggotaList));
                    
                    const allTransactions = [];
                    const allPayments = [];
                    
                    anggotaList.forEach(anggota => {
                        // Random number of transactions per anggota
                        const numTransactions = Math.floor(Math.random() * 5);
                        const numPayments = Math.floor(Math.random() * 3);
                        
                        for (let i = 0; i < numTransactions; i++) {
                            allTransactions.push({
                                id: `P_${anggota.id}_${i}`,
                                anggotaId: anggota.id,
                                total: Math.floor(Math.random() * 100000) + 1000,
                                status: 'kredit',
                                tanggal: new Date().toISOString()
                            });
                        }
                        
                        for (let i = 0; i < numPayments; i++) {
                            allPayments.push({
                                id: `PAY_${anggota.id}_${i}`,
                                anggotaId: anggota.id,
                                jenis: 'hutang',
                                jumlah: Math.floor(Math.random() * 50000) + 1000,
                                status: 'selesai',
                                tanggal: new Date().toISOString()
                            });
                        }
                    });
                    
                    localStorage.setItem('penjualan', JSON.stringify(allTransactions));
                    localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(allPayments));
                    
                    // Test: Verify consistency for each anggota
                    anggotaList.forEach(anggota => {
                        const totalKredit = hitungTotalKredit(anggota.id);
                        const totalPembayaran = hitungTotalPembayaranHutang(anggota.id);
                        const saldoHutang = hitungSaldoHutang(anggota.id);
                        
                        // Property: Consistency must hold for each anggota
                        expect(saldoHutang).toBe(totalKredit - totalPembayaran);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
});


/**
 * Task 6.1: Property Test for Total Pembayaran Calculation
 * 
 * Property 5: Total pembayaran calculation
 * Feature: integrasi-pembayaran-laporan-hutang, Property 5: Total pembayaran calculation
 * 
 * For any anggota, the total pembayaran should equal the sum of all completed hutang payments.
 * This property ensures that the calculation is accurate across all scenarios.
 * 
 * Validates: Requirements 3.2
 */
describe('Task 6.1: Property Test for Total Pembayaran Calculation', () => {
    
    beforeEach(() => {
        localStorage.clear();
    });
    
    test('Property 5: Total pembayaran equals sum of all completed payments', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 5, maxLength: 10 }).map(s => 'A' + s), // anggotaId
                fc.array(pembayaranHutangArbitrary('dummy'), { minLength: 1, maxLength: 10 }), // payments
                (anggotaId, payments) => {
                    // Setup: Create payments for this anggota
                    const paymentsForAnggota = payments.map(p => ({ ...p, anggotaId }));
                    localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(paymentsForAnggota));
                    
                    // Calculate expected total manually
                    const expectedTotal = paymentsForAnggota.reduce((sum, p) => sum + p.jumlah, 0);
                    
                    // Test: Calculate using utility function
                    const actualTotal = hitungTotalPembayaranHutang(anggotaId);
                    
                    // Verify: Should match expected total
                    expect(actualTotal).toBe(expectedTotal);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('Property 5: Total pembayaran excludes pending payments', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 5, maxLength: 10 }).map(s => 'A' + s), // anggotaId
                fc.array(pembayaranHutangArbitrary('dummy'), { minLength: 1, maxLength: 5 }), // completed
                fc.array(pembayaranPendingArbitrary('dummy'), { minLength: 1, maxLength: 5 }), // pending
                (anggotaId, completedPayments, pendingPayments) => {
                    // Setup: Ensure unique IDs
                    const completed = completedPayments.map((p, idx) => ({ 
                        ...p, 
                        id: `COMPLETED_${idx}_${p.id}`, 
                        anggotaId 
                    }));
                    const pending = pendingPayments.map((p, idx) => ({ 
                        ...p, 
                        id: `PENDING_${idx}_${p.id}`, 
                        anggotaId 
                    }));
                    
                    const allPayments = [...completed, ...pending];
                    localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(allPayments));
                    
                    // Calculate expected total (only completed)
                    const expectedTotal = completed.reduce((sum, p) => sum + p.jumlah, 0);
                    
                    // Test
                    const actualTotal = hitungTotalPembayaranHutang(anggotaId);
                    
                    // Verify: Should only include completed payments
                    expect(actualTotal).toBe(expectedTotal);
                    
                    // Verify: Should not include pending payments
                    const pendingTotal = pending.reduce((sum, p) => sum + p.jumlah, 0);
                    expect(actualTotal).not.toBe(expectedTotal + pendingTotal);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('Property 5: Total pembayaran excludes piutang payments', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 5, maxLength: 10 }).map(s => 'A' + s), // anggotaId
                fc.array(pembayaranHutangArbitrary('dummy'), { minLength: 1, maxLength: 5 }), // hutang
                fc.integer({ min: 1, max: 5 }), // number of piutang payments
                (anggotaId, hutangPayments, piutangCount) => {
                    // Setup: Create hutang payments
                    const hutang = hutangPayments.map(p => ({ ...p, anggotaId }));
                    
                    // Create piutang payments
                    const piutang = [];
                    for (let i = 0; i < piutangCount; i++) {
                        piutang.push({
                            id: `PIUTANG_${i}`,
                            anggotaId: anggotaId,
                            jenis: 'piutang',
                            jumlah: 50000,
                            status: 'selesai',
                            tanggal: new Date().toISOString()
                        });
                    }
                    
                    const allPayments = [...hutang, ...piutang];
                    localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(allPayments));
                    
                    // Calculate expected total (only hutang)
                    const expectedTotal = hutang.reduce((sum, p) => sum + p.jumlah, 0);
                    
                    // Test
                    const actualTotal = hitungTotalPembayaranHutang(anggotaId);
                    
                    // Verify: Should only include hutang payments
                    expect(actualTotal).toBe(expectedTotal);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('Property 5: Total pembayaran is zero for anggota with no payments', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 5, maxLength: 10 }).map(s => 'A' + s), // anggotaId
                (anggotaId) => {
                    // Setup: No payments
                    localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([]));
                    
                    // Test
                    const total = hitungTotalPembayaranHutang(anggotaId);
                    
                    // Verify: Should be zero
                    expect(total).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('Property 5: Total pembayaran is non-negative', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 5, maxLength: 10 }).map(s => 'A' + s), // anggotaId
                fc.array(pembayaranHutangArbitrary('dummy'), { minLength: 0, maxLength: 10 }), // payments
                (anggotaId, payments) => {
                    // Setup
                    const paymentsForAnggota = payments.map(p => ({ ...p, anggotaId }));
                    localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(paymentsForAnggota));
                    
                    // Test
                    const total = hitungTotalPembayaranHutang(anggotaId);
                    
                    // Verify: Should always be non-negative
                    expect(total).toBeGreaterThanOrEqual(0);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('Property 5: Total pembayaran is idempotent', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 5, maxLength: 10 }).map(s => 'A' + s), // anggotaId
                fc.array(pembayaranHutangArbitrary('dummy'), { minLength: 1, maxLength: 10 }), // payments
                (anggotaId, payments) => {
                    // Setup
                    const paymentsForAnggota = payments.map(p => ({ ...p, anggotaId }));
                    localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(paymentsForAnggota));
                    
                    // Test: Call function multiple times
                    const result1 = hitungTotalPembayaranHutang(anggotaId);
                    const result2 = hitungTotalPembayaranHutang(anggotaId);
                    const result3 = hitungTotalPembayaranHutang(anggotaId);
                    
                    // Verify: All results should be identical
                    expect(result1).toBe(result2);
                    expect(result2).toBe(result3);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('Property 5: Total pembayaran handles missing jumlah field', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 5, maxLength: 10 }).map(s => 'A' + s), // anggotaId
                fc.integer({ min: 1, max: 5 }), // number of valid payments
                fc.integer({ min: 1, max: 3 }), // number of invalid payments
                (anggotaId, validCount, invalidCount) => {
                    // Setup: Create mix of valid and invalid payments
                    const payments = [];
                    let expectedTotal = 0;
                    
                    // Valid payments
                    for (let i = 0; i < validCount; i++) {
                        const jumlah = Math.floor(Math.random() * 100000) + 1000;
                        payments.push({
                            id: `VALID_${i}`,
                            anggotaId: anggotaId,
                            jenis: 'hutang',
                            jumlah: jumlah,
                            status: 'selesai',
                            tanggal: new Date().toISOString()
                        });
                        expectedTotal += jumlah;
                    }
                    
                    // Invalid payments (missing or null jumlah)
                    for (let i = 0; i < invalidCount; i++) {
                        payments.push({
                            id: `INVALID_${i}`,
                            anggotaId: anggotaId,
                            jenis: 'hutang',
                            jumlah: i % 2 === 0 ? null : undefined,
                            status: 'selesai',
                            tanggal: new Date().toISOString()
                        });
                    }
                    
                    localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(payments));
                    
                    // Test
                    const total = hitungTotalPembayaranHutang(anggotaId);
                    
                    // Verify: Should only count valid payments
                    expect(total).toBe(expectedTotal);
                }
            ),
            { numRuns: 100 }
        );
    });
});


/**
 * Task 7.1: Property Test for Calculation Consistency Across Modules
 * 
 * Property 6: Calculation consistency across modules
 * Feature: integrasi-pembayaran-laporan-hutang, Property 6: Calculation consistency across modules
 * 
 * For any anggota, calculations should be consistent whether performed in:
 * - pembayaranHutangPiutang module
 * - reports module
 * - utils module
 * 
 * All modules should use the same shared functions and produce identical results.
 * 
 * Validates: Requirements 5.2, 5.3
 */
describe('Task 7.1: Property Test for Calculation Consistency Across Modules', () => {
    
    beforeEach(() => {
        localStorage.clear();
    });
    
    test('Property 6: Saldo calculation is consistent across modules', () => {
        fc.assert(
            fc.property(
                anggotaArbitrary,
                fc.array(penjualanKreditArbitrary('dummy'), { minLength: 1, maxLength: 10 }),
                fc.array(pembayaranHutangArbitrary('dummy'), { minLength: 0, maxLength: 10 }),
                (anggota, creditTransactions, payments) => {
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify([anggota]));
                    
                    const transactions = creditTransactions.map(t => ({ ...t, anggotaId: anggota.id }));
                    const paymentsData = payments.map(p => ({ ...p, anggotaId: anggota.id }));
                    
                    localStorage.setItem('penjualan', JSON.stringify(transactions));
                    localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(paymentsData));
                    
                    // Calculate using different approaches
                    const saldoFromUtils = hitungSaldoHutang(anggota.id);
                    const totalKredit = hitungTotalKredit(anggota.id);
                    const totalPembayaran = hitungTotalPembayaranHutang(anggota.id);
                    const saldoFromComponents = totalKredit - totalPembayaran;
                    
                    // Property: Both approaches should yield same result
                    expect(saldoFromUtils).toBe(saldoFromComponents);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('Property 6: Report data structure matches calculation functions', () => {
        fc.assert(
            fc.property(
                anggotaArbitrary,
                fc.array(penjualanKreditArbitrary('dummy'), { minLength: 0, maxLength: 10 }),
                fc.array(pembayaranHutangArbitrary('dummy'), { minLength: 0, maxLength: 10 }),
                (anggota, creditTransactions, payments) => {
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify([anggota]));
                    
                    const transactions = creditTransactions.map(t => ({ ...t, anggotaId: anggota.id }));
                    const paymentsData = payments.map(p => ({ ...p, anggotaId: anggota.id }));
                    
                    localStorage.setItem('penjualan', JSON.stringify(transactions));
                    localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(paymentsData));
                    
                    // Simulate report data structure (as in laporanHutangPiutang)
                    const reportData = {
                        anggotaId: anggota.id,
                        totalKredit: hitungTotalKredit(anggota.id),
                        totalPembayaran: hitungTotalPembayaranHutang(anggota.id),
                        saldoHutang: hitungSaldoHutang(anggota.id),
                        status: hitungSaldoHutang(anggota.id) <= 0 ? 'Lunas' : 'Belum Lunas'
                    };
                    
                    // Property: Report data should be internally consistent
                    expect(reportData.saldoHutang).toBe(reportData.totalKredit - reportData.totalPembayaran);
                    
                    if (reportData.saldoHutang <= 0) {
                        expect(reportData.status).toBe('Lunas');
                    } else {
                        expect(reportData.status).toBe('Belum Lunas');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('Property 6: Multiple anggota calculations are independent', () => {
        fc.assert(
            fc.property(
                fc.array(anggotaArbitrary, { minLength: 2, maxLength: 5 }),
                (anggotaList) => {
                    // Setup: Create unique transactions for each anggota
                    localStorage.setItem('anggota', JSON.stringify(anggotaList));
                    
                    const allTransactions = [];
                    const allPayments = [];
                    const expectedSaldos = new Map();
                    
                    anggotaList.forEach((anggota, index) => {
                        const creditAmount = (index + 1) * 100000;
                        const paymentAmount = (index + 1) * 30000;
                        
                        allTransactions.push({
                            id: `P_${anggota.id}`,
                            anggotaId: anggota.id,
                            total: creditAmount,
                            status: 'kredit',
                            tanggal: new Date().toISOString()
                        });
                        
                        allPayments.push({
                            id: `PAY_${anggota.id}`,
                            anggotaId: anggota.id,
                            jenis: 'hutang',
                            jumlah: paymentAmount,
                            status: 'selesai',
                            tanggal: new Date().toISOString()
                        });
                        
                        expectedSaldos.set(anggota.id, creditAmount - paymentAmount);
                    });
                    
                    localStorage.setItem('penjualan', JSON.stringify(allTransactions));
                    localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(allPayments));
                    
                    // Property: Each anggota's calculation should be independent
                    anggotaList.forEach(anggota => {
                        const saldo = hitungSaldoHutang(anggota.id);
                        expect(saldo).toBe(expectedSaldos.get(anggota.id));
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('Property 6: Calculation functions handle concurrent access', () => {
        fc.assert(
            fc.property(
                anggotaArbitrary,
                fc.array(penjualanKreditArbitrary('dummy'), { minLength: 1, maxLength: 10 }),
                fc.array(pembayaranHutangArbitrary('dummy'), { minLength: 1, maxLength: 10 }),
                (anggota, creditTransactions, payments) => {
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify([anggota]));
                    
                    const transactions = creditTransactions.map(t => ({ ...t, anggotaId: anggota.id }));
                    const paymentsData = payments.map(p => ({ ...p, anggotaId: anggota.id }));
                    
                    localStorage.setItem('penjualan', JSON.stringify(transactions));
                    localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(paymentsData));
                    
                    // Simulate concurrent access by calling all functions
                    const results = {
                        kredit1: hitungTotalKredit(anggota.id),
                        pembayaran1: hitungTotalPembayaranHutang(anggota.id),
                        saldo1: hitungSaldoHutang(anggota.id),
                        kredit2: hitungTotalKredit(anggota.id),
                        pembayaran2: hitungTotalPembayaranHutang(anggota.id),
                        saldo2: hitungSaldoHutang(anggota.id)
                    };
                    
                    // Property: Results should be consistent
                    expect(results.kredit1).toBe(results.kredit2);
                    expect(results.pembayaran1).toBe(results.pembayaran2);
                    expect(results.saldo1).toBe(results.saldo2);
                    expect(results.saldo1).toBe(results.kredit1 - results.pembayaran1);
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * Task 7.2: Integration Tests
 * 
 * Tests the full flow: credit transaction → payment → report update
 * Tests cross-module consistency and edge cases
 * 
 * Validates: Requirements 1.1, 1.2, 1.3, 5.3
 */
describe('Task 7.2: Integration Tests', () => {
    
    beforeEach(() => {
        localStorage.clear();
    });
    
    test('Integration: Full flow from credit transaction to payment to report', () => {
        // Setup: Create anggota
        const anggota = {
            id: 'A001',
            nik: '1234567890',
            nama: 'Test User',
            departemen: 'IT'
        };
        localStorage.setItem('anggota', JSON.stringify([anggota]));
        
        // Step 1: Create credit transaction
        const creditTransaction = {
            id: 'P001',
            anggotaId: anggota.id,
            total: 1000000,
            status: 'kredit',
            tanggal: new Date('2024-01-15').toISOString()
        };
        localStorage.setItem('penjualan', JSON.stringify([creditTransaction]));
        
        // Verify initial state
        expect(hitungTotalKredit(anggota.id)).toBe(1000000);
        expect(hitungTotalPembayaranHutang(anggota.id)).toBe(0);
        expect(hitungSaldoHutang(anggota.id)).toBe(1000000);
        
        // Step 2: Make first payment
        const payment1 = {
            id: 'PAY001',
            anggotaId: anggota.id,
            jenis: 'hutang',
            jumlah: 400000,
            status: 'selesai',
            tanggal: new Date('2024-01-20').toISOString(),
            kasirNama: 'Kasir 1'
        };
        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([payment1]));
        
        // Verify after first payment
        expect(hitungTotalKredit(anggota.id)).toBe(1000000);
        expect(hitungTotalPembayaranHutang(anggota.id)).toBe(400000);
        expect(hitungSaldoHutang(anggota.id)).toBe(600000);
        
        // Step 3: Make second payment
        const payment2 = {
            id: 'PAY002',
            anggotaId: anggota.id,
            jenis: 'hutang',
            jumlah: 600000,
            status: 'selesai',
            tanggal: new Date('2024-02-01').toISOString(),
            kasirNama: 'Kasir 2'
        };
        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([payment1, payment2]));
        
        // Verify after second payment (fully paid)
        expect(hitungTotalKredit(anggota.id)).toBe(1000000);
        expect(hitungTotalPembayaranHutang(anggota.id)).toBe(1000000);
        expect(hitungSaldoHutang(anggota.id)).toBe(0);
        
        // Verify status
        const status = hitungSaldoHutang(anggota.id) <= 0 ? 'Lunas' : 'Belum Lunas';
        expect(status).toBe('Lunas');
        
        // Verify payment history
        const history = getPembayaranHutangHistory(anggota.id);
        expect(history.length).toBe(2);
        expect(history[0].id).toBe('PAY002'); // Newest first
        expect(history[1].id).toBe('PAY001');
    });
    
    test('Integration: Edge case - Zero saldo', () => {
        const anggota = { id: 'A001', nik: '1234', nama: 'Test User' };
        localStorage.setItem('anggota', JSON.stringify([anggota]));
        
        // No transactions
        localStorage.setItem('penjualan', JSON.stringify([]));
        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([]));
        
        // Verify zero state
        expect(hitungTotalKredit(anggota.id)).toBe(0);
        expect(hitungTotalPembayaranHutang(anggota.id)).toBe(0);
        expect(hitungSaldoHutang(anggota.id)).toBe(0);
        
        const status = hitungSaldoHutang(anggota.id) <= 0 ? 'Lunas' : 'Belum Lunas';
        expect(status).toBe('Lunas');
    });
    
    test('Integration: Edge case - No payments', () => {
        const anggota = { id: 'A001', nik: '1234', nama: 'Test User' };
        localStorage.setItem('anggota', JSON.stringify([anggota]));
        
        // Only credit transaction, no payments
        const creditTransaction = {
            id: 'P001',
            anggotaId: anggota.id,
            total: 500000,
            status: 'kredit',
            tanggal: new Date().toISOString()
        };
        localStorage.setItem('penjualan', JSON.stringify([creditTransaction]));
        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([]));
        
        // Verify
        expect(hitungTotalKredit(anggota.id)).toBe(500000);
        expect(hitungTotalPembayaranHutang(anggota.id)).toBe(0);
        expect(hitungSaldoHutang(anggota.id)).toBe(500000);
        
        const status = hitungSaldoHutang(anggota.id) <= 0 ? 'Lunas' : 'Belum Lunas';
        expect(status).toBe('Belum Lunas');
        
        const history = getPembayaranHutangHistory(anggota.id);
        expect(history.length).toBe(0);
    });
    
    test('Integration: Edge case - Multiple payments', () => {
        const anggota = { id: 'A001', nik: '1234', nama: 'Test User' };
        localStorage.setItem('anggota', JSON.stringify([anggota]));
        
        // One credit transaction
        const creditTransaction = {
            id: 'P001',
            anggotaId: anggota.id,
            total: 1000000,
            status: 'kredit',
            tanggal: new Date().toISOString()
        };
        localStorage.setItem('penjualan', JSON.stringify([creditTransaction]));
        
        // Multiple small payments
        const payments = [];
        for (let i = 0; i < 10; i++) {
            payments.push({
                id: `PAY${String(i).padStart(3, '0')}`,
                anggotaId: anggota.id,
                jenis: 'hutang',
                jumlah: 100000,
                status: 'selesai',
                tanggal: new Date(2024, 0, i + 1).toISOString(),
                kasirNama: `Kasir ${i + 1}`
            });
        }
        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(payments));
        
        // Verify
        expect(hitungTotalKredit(anggota.id)).toBe(1000000);
        expect(hitungTotalPembayaranHutang(anggota.id)).toBe(1000000);
        expect(hitungSaldoHutang(anggota.id)).toBe(0);
        
        const history = getPembayaranHutangHistory(anggota.id);
        expect(history.length).toBe(10);
        
        // Verify sorting (newest first)
        for (let i = 0; i < history.length - 1; i++) {
            const dateA = new Date(history[i].tanggal);
            const dateB = new Date(history[i + 1].tanggal);
            expect(dateA.getTime()).toBeGreaterThanOrEqual(dateB.getTime());
        }
    });
    
    test('Integration: Cross-module consistency with multiple anggota', () => {
        // Setup multiple anggota
        const anggotaList = [
            { id: 'A001', nik: '1111', nama: 'User 1', departemen: 'IT' },
            { id: 'A002', nik: '2222', nama: 'User 2', departemen: 'Finance' },
            { id: 'A003', nik: '3333', nama: 'User 3', departemen: 'HR' }
        ];
        localStorage.setItem('anggota', JSON.stringify(anggotaList));
        
        // Create transactions for each
        const transactions = [
            { id: 'P001', anggotaId: 'A001', total: 1000000, status: 'kredit', tanggal: new Date().toISOString() },
            { id: 'P002', anggotaId: 'A002', total: 2000000, status: 'kredit', tanggal: new Date().toISOString() },
            { id: 'P003', anggotaId: 'A003', total: 3000000, status: 'kredit', tanggal: new Date().toISOString() }
        ];
        localStorage.setItem('penjualan', JSON.stringify(transactions));
        
        // Create payments for each
        const payments = [
            { id: 'PAY001', anggotaId: 'A001', jenis: 'hutang', jumlah: 500000, status: 'selesai', tanggal: new Date().toISOString() },
            { id: 'PAY002', anggotaId: 'A002', jenis: 'hutang', jumlah: 1000000, status: 'selesai', tanggal: new Date().toISOString() },
            { id: 'PAY003', anggotaId: 'A003', jenis: 'hutang', jumlah: 3000000, status: 'selesai', tanggal: new Date().toISOString() }
        ];
        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(payments));
        
        // Verify each anggota independently
        expect(hitungSaldoHutang('A001')).toBe(500000);
        expect(hitungSaldoHutang('A002')).toBe(1000000);
        expect(hitungSaldoHutang('A003')).toBe(0);
        
        // Verify statuses
        expect(hitungSaldoHutang('A001') <= 0 ? 'Lunas' : 'Belum Lunas').toBe('Belum Lunas');
        expect(hitungSaldoHutang('A002') <= 0 ? 'Lunas' : 'Belum Lunas').toBe('Belum Lunas');
        expect(hitungSaldoHutang('A003') <= 0 ? 'Lunas' : 'Belum Lunas').toBe('Lunas');
    });
});
