/**
 * Property-Based Tests for Pembayaran Hutang Piutang Module
 * Using fast-check for property testing
 */

import fc from 'fast-check';
import { jest } from '@jest/globals';

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
global.formatRupiah = (amount) => `Rp ${amount.toLocaleString('id-ID')}`;
global.showAlert = jest.fn();
global.generateId = () => 'TEST-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
global.addJurnal = jest.fn();

// Import module functions
import {
    hitungSaldoHutang,
    hitungSaldoPiutang,
    validatePembayaran,
    savePembayaran,
    rollbackPembayaran,
    createJurnalPembayaranHutang,
    createJurnalPembayaranPiutang,
    searchAnggota
} from '../js/pembayaranHutangPiutang.js';

describe('Pembayaran Hutang Piutang - Property Tests', () => {
    
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    // ========================================
    // PROPERTY 1: Hutang saldo display accuracy
    // ========================================
    describe('Property 1: Hutang saldo display accuracy', () => {
        test('displayed hutang saldo equals calculated total kredit minus payments', () => {
            fc.assert(
                fc.property(
                    fc.array(fc.record({
                        anggotaId: fc.constant('A001'),
                        metodePembayaran: fc.constant('Kredit'),
                        total: fc.integer({ min: 10000, max: 1000000 })
                    }), { minLength: 1, maxLength: 10 }),
                    fc.array(fc.record({
                        anggotaId: fc.constant('A001'),
                        jenis: fc.constant('hutang'),
                        status: fc.constant('selesai'),
                        jumlah: fc.integer({ min: 5000, max: 500000 })
                    }), { maxLength: 5 }),
                    (penjualanList, pembayaranList) => {
                        // Setup
                        localStorage.setItem('penjualan', JSON.stringify(penjualanList));
                        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaranList));
                        
                        // Calculate expected
                        const totalKredit = penjualanList.reduce((sum, p) => sum + p.total, 0);
                        const totalBayar = pembayaranList.reduce((sum, p) => sum + p.jumlah, 0);
                        const expected = totalKredit - totalBayar;
                        
                        // Test
                        const result = hitungSaldoHutang('A001');
                        
                        return result === expected;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    // ========================================
    // PROPERTY 2: Hutang payment validation
    // ========================================
    describe('Property 2: Hutang payment validation', () => {
        test('rejects payments exceeding saldo and accepts payments within saldo', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 10000, max: 1000000 }),
                    fc.integer({ min: 1, max: 2000000 }),
                    (saldo, jumlah) => {
                        // Setup anggota with hutang
                        const penjualan = [{ anggotaId: 'A001', metodePembayaran: 'Kredit', total: saldo }];
                        localStorage.setItem('penjualan', JSON.stringify(penjualan));
                        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([]));
                        
                        const data = {
                            anggotaId: 'A001',
                            jenis: 'hutang',
                            jumlah: jumlah
                        };
                        
                        const validation = validatePembayaran(data);
                        
                        if (jumlah > saldo) {
                            return !validation.valid && validation.message.includes('melebihi');
                        } else if (jumlah > 0) {
                            return validation.valid;
                        } else {
                            return !validation.valid;
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    // ========================================
    // PROPERTY 3: Hutang saldo reduction
    // ========================================
    describe('Property 3: Hutang saldo reduction', () => {
        test('saldo after payment equals saldo before minus payment amount', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 100000, max: 1000000 }),
                    fc.integer({ min: 10000, max: 50000 }),
                    (saldoAwal, jumlahBayar) => {
                        // Setup
                        const penjualan = [{ anggotaId: 'A001', metodePembayaran: 'Kredit', total: saldoAwal }];
                        localStorage.setItem('penjualan', JSON.stringify(penjualan));
                        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([]));
                        localStorage.setItem('currentUser', JSON.stringify({ id: 'U001', nama: 'Kasir' }));
                        
                        const saldoSebelum = hitungSaldoHutang('A001');
                        
                        // Save payment
                        const transaksi = savePembayaran({
                            anggotaId: 'A001',
                            anggotaNama: 'Test',
                            anggotaNIK: '123',
                            jenis: 'hutang',
                            jumlah: jumlahBayar,
                            saldoSebelum: saldoSebelum,
                            saldoSesudah: saldoSebelum - jumlahBayar
                        });
                        
                        const saldoSesudah = hitungSaldoHutang('A001');
                        
                        return saldoSesudah === (saldoSebelum - jumlahBayar);
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    // ========================================
    // PROPERTY 4: Hutang journal structure
    // ========================================
    describe('Property 4: Hutang journal structure', () => {
        test('journal entry has correct debit/kredit structure', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 10000, max: 1000000 }),
                    (jumlah) => {
                        const transaksi = {
                            id: 'T001',
                            anggotaNama: 'Test Anggota',
                            jumlah: jumlah,
                            tanggal: '2024-12-09'
                        };
                        
                        createJurnalPembayaranHutang(transaksi);
                        
                        const calls = global.addJurnal.mock.calls;
                        expect(calls.length).toBeGreaterThan(0);
                        
                        const lastCall = calls[calls.length - 1];
                        const entries = lastCall[1];
                        
                        // Check structure
                        const kasEntry = entries.find(e => e.akun === '1-1000');
                        const hutangEntry = entries.find(e => e.akun === '2-1000');
                        
                        return kasEntry && kasEntry.debit === jumlah && kasEntry.kredit === 0 &&
                               hutangEntry && hutangEntry.debit === 0 && hutangEntry.kredit === jumlah;
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    // ========================================
    // PROPERTY 5: Piutang saldo display accuracy
    // ========================================
    describe('Property 5: Piutang saldo display accuracy', () => {
        test('displayed piutang saldo equals calculated balance', () => {
            fc.assert(
                fc.property(
                    fc.array(fc.record({
                        anggotaId: fc.constant('A001'),
                        statusPengembalian: fc.constant('pending'),
                        saldo: fc.integer({ min: 10000, max: 500000 })
                    }), { minLength: 1, maxLength: 5 }),
                    fc.array(fc.record({
                        anggotaId: fc.constant('A001'),
                        jenis: fc.constant('piutang'),
                        status: fc.constant('selesai'),
                        jumlah: fc.integer({ min: 5000, max: 100000 })
                    }), { maxLength: 3 }),
                    (simpananList, pembayaranList) => {
                        // Setup
                        localStorage.setItem('simpanan', JSON.stringify(simpananList));
                        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaranList));
                        
                        // Calculate expected
                        const totalPiutang = simpananList.reduce((sum, s) => sum + s.saldo, 0);
                        const totalBayar = pembayaranList.reduce((sum, p) => sum + p.jumlah, 0);
                        const expected = totalPiutang - totalBayar;
                        
                        // Test
                        const result = hitungSaldoPiutang('A001');
                        
                        return result === expected;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    // ========================================
    // PROPERTY 6: Piutang payment validation
    // ========================================
    describe('Property 6: Piutang payment validation', () => {
        test('rejects payments exceeding saldo and accepts payments within saldo', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 10000, max: 1000000 }),
                    fc.integer({ min: 1, max: 2000000 }),
                    (saldo, jumlah) => {
                        // Setup anggota with piutang
                        const simpanan = [{ anggotaId: 'A001', statusPengembalian: 'pending', saldo: saldo }];
                        localStorage.setItem('simpanan', JSON.stringify(simpanan));
                        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([]));
                        
                        const data = {
                            anggotaId: 'A001',
                            jenis: 'piutang',
                            jumlah: jumlah
                        };
                        
                        const validation = validatePembayaran(data);
                        
                        if (jumlah > saldo) {
                            return !validation.valid && validation.message.includes('melebihi');
                        } else if (jumlah > 0) {
                            return validation.valid;
                        } else {
                            return !validation.valid;
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    // ========================================
    // PROPERTY 8: Piutang journal structure
    // ========================================
    describe('Property 8: Piutang journal structure', () => {
        test('journal entry has correct debit/kredit structure', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 10000, max: 1000000 }),
                    (jumlah) => {
                        const transaksi = {
                            id: 'T001',
                            anggotaNama: 'Test Anggota',
                            jumlah: jumlah,
                            tanggal: '2024-12-09'
                        };
                        
                        createJurnalPembayaranPiutang(transaksi);
                        
                        const calls = global.addJurnal.mock.calls;
                        expect(calls.length).toBeGreaterThan(0);
                        
                        const lastCall = calls[calls.length - 1];
                        const entries = lastCall[1];
                        
                        // Check structure
                        const piutangEntry = entries.find(e => e.akun === '1-1200');
                        const kasEntry = entries.find(e => e.akun === '1-1000');
                        
                        return piutangEntry && piutangEntry.debit === jumlah && piutangEntry.kredit === 0 &&
                               kasEntry && kasEntry.debit === 0 && kasEntry.kredit === jumlah;
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    // ========================================
    // PROPERTY 18: Autocomplete matching
    // ========================================
    describe('Property 18: Autocomplete matching', () => {
        test('autocomplete includes all anggota whose name or NIK contains search string', () => {
            fc.assert(
                fc.property(
                    fc.array(fc.record({
                        id: fc.uuid(),
                        nama: fc.constantFrom('Ahmad', 'Budi', 'Citra', 'Dewi', 'Eko'),
                        nik: fc.constantFrom('001', '002', '003', '004', '005'),
                        status: fc.constant('Aktif')
                    }), { minLength: 5, maxLength: 20 }),
                    fc.constantFrom('ah', 'bu', 'ci', '00'),
                    (anggotaList, searchQuery) => {
                        // Setup
                        localStorage.setItem('anggota', JSON.stringify(anggotaList));
                        
                        // Search
                        const results = searchAnggota(searchQuery);
                        
                        // Verify all results match
                        const allMatch = results.every(a => 
                            a.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            a.nik.toLowerCase().includes(searchQuery.toLowerCase())
                        );
                        
                        // Verify no false negatives (within limit of 10)
                        const expectedMatches = anggotaList.filter(a =>
                            (a.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             a.nik.toLowerCase().includes(searchQuery.toLowerCase())) &&
                            a.status !== 'Nonaktif'
                        ).slice(0, 10);
                        
                        return allMatch && results.length === expectedMatches.length;
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    // ========================================
    // PROPERTY 21: Hutang journal balance
    // ========================================
    describe('Property 21: Hutang journal balance', () => {
        test('total debit equals total kredit in hutang journal entry', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1000, max: 10000000 }),
                    (jumlah) => {
                        const transaksi = {
                            id: 'T001',
                            anggotaNama: 'Test',
                            jumlah: jumlah,
                            tanggal: '2024-12-09'
                        };
                        
                        createJurnalPembayaranHutang(transaksi);
                        
                        const calls = global.addJurnal.mock.calls;
                        const lastCall = calls[calls.length - 1];
                        const entries = lastCall[1];
                        
                        const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
                        const totalKredit = entries.reduce((sum, e) => sum + e.kredit, 0);
                        
                        return totalDebit === totalKredit && totalDebit === jumlah;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    // ========================================
    // PROPERTY 22: Piutang journal balance
    // ========================================
    describe('Property 22: Piutang journal balance', () => {
        test('total debit equals total kredit in piutang journal entry', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1000, max: 10000000 }),
                    (jumlah) => {
                        const transaksi = {
                            id: 'T001',
                            anggotaNama: 'Test',
                            jumlah: jumlah,
                            tanggal: '2024-12-09'
                        };
                        
                        createJurnalPembayaranPiutang(transaksi);
                        
                        const calls = global.addJurnal.mock.calls;
                        const lastCall = calls[calls.length - 1];
                        const entries = lastCall[1];
                        
                        const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
                        const totalKredit = entries.reduce((sum, e) => sum + e.kredit, 0);
                        
                        return totalDebit === totalKredit && totalDebit === jumlah;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    // ========================================
    // PROPERTY 24: Transaction rollback on error
    // ========================================
    describe('Property 24: Transaction rollback on error', () => {
        test('transaction is removed on rollback', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 10000, max: 1000000 }),
                    (jumlah) => {
                        localStorage.setItem('currentUser', JSON.stringify({ id: 'U001', nama: 'Kasir' }));
                        
                        // Save transaction
                        const transaksi = savePembayaran({
                            anggotaId: 'A001',
                            anggotaNama: 'Test',
                            anggotaNIK: '123',
                            jenis: 'hutang',
                            jumlah: jumlah,
                            saldoSebelum: jumlah,
                            saldoSesudah: 0
                        });
                        
                        // Verify saved
                        let list = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
                        const savedExists = list.some(p => p.id === transaksi.id);
                        
                        // Rollback
                        rollbackPembayaran(transaksi.id);
                        
                        // Verify removed
                        list = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
                        const removedExists = list.some(p => p.id === transaksi.id);
                        
                        return savedExists && !removedExists;
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

});
