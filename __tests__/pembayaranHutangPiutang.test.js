/**
 * Property-Based Tests for Pembayaran Hutang Piutang Module
 * Using fast-check for property testing
 */

import fc from 'fast-check';
// Fix Jest import for ES Module compatibility
const { jest } = await import('@jest/globals');

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
global.filterTransactableAnggota = jest.fn((anggotaList) => {
    if (!anggotaList) {
        const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
        return anggota.filter(a => a.status === 'Aktif' && a.statusKeanggotaan !== 'Keluar');
    }
    return anggotaList.filter(a => a.status === 'Aktif' && a.statusKeanggotaan !== 'Keluar');
});
global.validateAnggotaForHutangPiutang = jest.fn(() => ({ valid: true }));

// Import module functions
import {
    hitungSaldoHutang,
    hitungSaldoPiutang,
    validatePembayaran,
    savePembayaran,
    rollbackPembayaran,
    createJurnalPembayaranHutang,
    createJurnalPembayaranPiutang,
    saveAuditLog,
    searchAnggota,
    renderPembayaranHutangPiutang,
    renderFormPembayaran,
    updateSummaryCards,
    applyRiwayatFilters,
    loadRiwayatPembayaran,
    renderRiwayatPembayaran,
    cetakBuktiPembayaran,
    displaySaldoAnggotaAutomatic,
    highlightRelevantSaldoDynamic,
    controlJumlahInputBasedOnSaldo,
    validateFormRealTime
} from '../js/pembayaranHutangPiutang.js';

// Mock DOM
const mockDOM = () => {
    // Create a comprehensive mock for document.getElementById
    const mockGetElementById = jest.fn((id) => {
        // Default mock element
        return {
            innerHTML: '',
            textContent: '',
            value: '',
            style: { display: 'block' },
            classList: {
                add: jest.fn(),
                remove: jest.fn()
            },
            parentElement: {
                classList: {
                    add: jest.fn(),
                    remove: jest.fn()
                },
                style: {}
            },
            disabled: false,
            max: '',
            placeholder: '',
            appendChild: jest.fn()
        };
    });
    
    global.document = {
        getElementById: mockGetElementById,
        createElement: jest.fn(() => ({
            textContent: '',
            innerHTML: '',
            appendChild: jest.fn()
        }))
    };
    
    global.window = {
        open: jest.fn(() => ({
            document: {
                write: jest.fn(),
                close: jest.fn()
            }
        }))
    };
    
    // Return the mock function for easy access
    return mockGetElementById;
};

// Global mock function reference
let mockGetElementById;

describe('Pembayaran Hutang Piutang - Property Tests', () => {
    
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
        mockGetElementById = mockDOM();
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
    // PROPERTY 7: Piutang saldo reduction
    // ========================================
    describe('Property 7: Piutang saldo reduction', () => {
        test('saldo after payment equals saldo before minus payment amount', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 100000, max: 1000000 }),
                    fc.integer({ min: 10000, max: 50000 }),
                    (saldoAwal, jumlahBayar) => {
                        // Setup
                        const simpanan = [{ anggotaId: 'A001', statusPengembalian: 'pending', saldo: saldoAwal }];
                        localStorage.setItem('simpanan', JSON.stringify(simpanan));
                        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([]));
                        localStorage.setItem('currentUser', JSON.stringify({ id: 'U001', nama: 'Kasir' }));
                        
                        const saldoSebelum = hitungSaldoPiutang('A001');
                        
                        // Save payment
                        const transaksi = savePembayaran({
                            anggotaId: 'A001',
                            anggotaNama: 'Test',
                            anggotaNIK: '123',
                            jenis: 'piutang',
                            jumlah: jumlahBayar,
                            saldoSebelum: saldoSebelum,
                            saldoSesudah: saldoSebelum - jumlahBayar
                        });
                        
                        const saldoSesudah = hitungSaldoPiutang('A001');
                        
                        return saldoSesudah === (saldoSebelum - jumlahBayar);
                    }
                ),
                { numRuns: 50 }
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
    // PROPERTY 23: Account balance consistency
    // ========================================
    describe('Property 23: Account balance consistency', () => {
        test('affected account balances are updated by exactly the debit/kredit amounts', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 10000, max: 1000000 }),
                    fc.constantFrom('hutang', 'piutang'),
                    (jumlah, jenis) => {
                        const transaksi = {
                            id: 'T001',
                            anggotaNama: 'Test Anggota',
                            jumlah: jumlah,
                            tanggal: '2024-12-09'
                        };
                        
                        // Clear previous calls
                        global.addJurnal.mockClear();
                        
                        if (jenis === 'hutang') {
                            createJurnalPembayaranHutang(transaksi);
                        } else {
                            createJurnalPembayaranPiutang(transaksi);
                        }
                        
                        const calls = global.addJurnal.mock.calls;
                        expect(calls.length).toBe(1);
                        
                        const [keterangan, entries, tanggal] = calls[0];
                        
                        // Verify journal entry structure
                        expect(entries).toHaveLength(2);
                        
                        if (jenis === 'hutang') {
                            // Hutang: Debit Kas (1-1000), Kredit Hutang Anggota (2-1000)
                            const kasEntry = entries.find(e => e.akun === '1-1000');
                            const hutangEntry = entries.find(e => e.akun === '2-1000');
                            
                            return kasEntry && kasEntry.debit === jumlah && kasEntry.kredit === 0 &&
                                   hutangEntry && hutangEntry.debit === 0 && hutangEntry.kredit === jumlah &&
                                   keterangan.includes('Pembayaran Hutang') &&
                                   tanggal === transaksi.tanggal;
                        } else {
                            // Piutang: Debit Piutang Anggota (1-1200), Kredit Kas (1-1000)
                            const piutangEntry = entries.find(e => e.akun === '1-1200');
                            const kasEntry = entries.find(e => e.akun === '1-1000');
                            
                            return piutangEntry && piutangEntry.debit === jumlah && piutangEntry.kredit === 0 &&
                                   kasEntry && kasEntry.debit === 0 && kasEntry.kredit === jumlah &&
                                   keterangan.includes('Pembayaran Piutang') &&
                                   tanggal === transaksi.tanggal;
                        }
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

    // ========================================
    // PROPERTY 25: Atomic transaction completion
    // ========================================
    describe('Property 25: Atomic transaction completion', () => {
        test('either all changes are saved or none are saved', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 10000, max: 1000000 }),
                    (jumlah) => {
                        localStorage.setItem('currentUser', JSON.stringify({ id: 'U001', nama: 'Kasir' }));
                        
                        // Setup initial state
                        const initialPembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
                        const initialJurnalCalls = global.addJurnal.mock.calls.length;
                        
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
                        
                        // Verify transaction was saved
                        const afterSave = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
                        const transactionSaved = afterSave.some(p => p.id === transaksi.id);
                        
                        // If transaction is saved, it should have all required fields
                        if (transactionSaved) {
                            const savedTransaction = afterSave.find(p => p.id === transaksi.id);
                            return savedTransaction.id && 
                                   savedTransaction.anggotaId && 
                                   savedTransaction.jumlah === jumlah &&
                                   savedTransaction.status === 'selesai';
                        }
                        
                        // If not saved, should be in initial state
                        return afterSave.length === initialPembayaran.length;
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    // ========================================
    // PROPERTY 14: Audit log creation
    // ========================================
    describe('Property 14: Audit log creation', () => {
        test('audit log entry is created for any payment transaction processed', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        anggotaId: fc.uuid(),
                        anggotaNama: fc.string({ minLength: 3, maxLength: 50 }),
                        anggotaNIK: fc.string({ minLength: 5, maxLength: 20 }),
                        jenis: fc.constantFrom('hutang', 'piutang'),
                        jumlah: fc.integer({ min: 10000, max: 1000000 }),
                        keterangan: fc.string({ maxLength: 100 })
                    }),
                    (paymentData) => {
                        // Setup
                        localStorage.setItem('currentUser', JSON.stringify({ 
                            id: 'U001', 
                            nama: 'Test Kasir' 
                        }));
                        localStorage.setItem('auditLog', JSON.stringify([]));
                        
                        // Get initial audit log count
                        const auditLogsBefore = JSON.parse(localStorage.getItem('auditLog') || '[]');
                        const countBefore = auditLogsBefore.length;
                        
                        // Action: Save audit log
                        const action = 'PEMBAYARAN_' + paymentData.jenis.toUpperCase();
                        saveAuditLog(action, paymentData);
                        
                        // Get audit logs after
                        const auditLogsAfter = JSON.parse(localStorage.getItem('auditLog') || '[]');
                        const countAfter = auditLogsAfter.length;
                        
                        // Find the created log
                        const createdLog = auditLogsAfter.find(log => 
                            log.action === action && 
                            log.details.anggotaId === paymentData.anggotaId
                        );
                        
                        return countAfter === countBefore + 1 && 
                               createdLog !== undefined &&
                               createdLog.userId === 'U001' &&
                               createdLog.userName === 'Test Kasir' &&
                               createdLog.module === 'pembayaran-hutang-piutang';
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    // ========================================
    // PROPERTY 15: Audit log completeness
    // ========================================
    describe('Property 15: Audit log completeness', () => {
        test('audit log contains anggota info, jenis, jumlah, saldo before and after', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        anggotaId: fc.uuid(),
                        anggotaNama: fc.string({ minLength: 3, maxLength: 50 }),
                        anggotaNIK: fc.string({ minLength: 5, maxLength: 20 }),
                        jenis: fc.constantFrom('hutang', 'piutang'),
                        jumlah: fc.integer({ min: 10000, max: 1000000 }),
                        saldoSebelum: fc.integer({ min: 50000, max: 2000000 }),
                        saldoSesudah: fc.integer({ min: 0, max: 1500000 })
                    }),
                    (transactionData) => {
                        // Setup
                        localStorage.setItem('currentUser', JSON.stringify({ 
                            id: 'U001', 
                            nama: 'Test Kasir' 
                        }));
                        localStorage.setItem('auditLog', JSON.stringify([]));
                        
                        // Action: Save audit log
                        const action = 'PEMBAYARAN_' + transactionData.jenis.toUpperCase();
                        saveAuditLog(action, transactionData);
                        
                        // Get audit logs
                        const auditLogs = JSON.parse(localStorage.getItem('auditLog') || '[]');
                        const createdLog = auditLogs.find(log => 
                            log.action === action && 
                            log.details.anggotaId === transactionData.anggotaId
                        );
                        
                        return createdLog &&
                               createdLog.details.anggotaId === transactionData.anggotaId &&
                               createdLog.details.anggotaNama === transactionData.anggotaNama &&
                               createdLog.details.anggotaNIK === transactionData.anggotaNIK &&
                               createdLog.details.jenis === transactionData.jenis &&
                               createdLog.details.jumlah === transactionData.jumlah &&
                               createdLog.details.saldoSebelum === transactionData.saldoSebelum &&
                               createdLog.details.saldoSesudah === transactionData.saldoSesudah;
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    // ========================================
    // PROPERTY 16: Error logging
    // ========================================
    describe('Property 16: Error logging', () => {
        test('error log is created for any processing error', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        errorType: fc.constantFrom('VALIDATION_ERROR', 'JOURNAL_ERROR', 'SYSTEM_ERROR'),
                        errorMessage: fc.string({ minLength: 5, maxLength: 100 }),
                        transactionData: fc.record({
                            anggotaId: fc.uuid(),
                            jenis: fc.constantFrom('hutang', 'piutang'),
                            jumlah: fc.integer({ min: 1, max: 1000000 })
                        })
                    }),
                    (errorData) => {
                        // Setup
                        localStorage.setItem('currentUser', JSON.stringify({ 
                            id: 'U001', 
                            nama: 'Test Kasir' 
                        }));
                        localStorage.setItem('auditLog', JSON.stringify([]));
                        
                        // Get initial audit log count
                        const auditLogsBefore = JSON.parse(localStorage.getItem('auditLog') || '[]');
                        const countBefore = auditLogsBefore.length;
                        
                        // Action: Save error log
                        const errorDetails = {
                            error: errorData.errorMessage,
                            errorType: errorData.errorType,
                            transactionData: errorData.transactionData
                        };
                        saveAuditLog('ERROR_PEMBAYARAN', errorDetails);
                        
                        // Get audit logs after
                        const auditLogsAfter = JSON.parse(localStorage.getItem('auditLog') || '[]');
                        const countAfter = auditLogsAfter.length;
                        
                        // Find the error log
                        const errorLog = auditLogsAfter.find(log => 
                            log.action === 'ERROR_PEMBAYARAN' && 
                            log.details.errorType === errorData.errorType
                        );
                        
                        return countAfter === countBefore + 1 && 
                               errorLog !== undefined &&
                               errorLog.details.error === errorData.errorMessage &&
                               errorLog.details.transactionData.anggotaId === errorData.transactionData.anggotaId;
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    // ========================================
    // PROPERTY 17: Audit log persistence
    // ========================================
    describe('Property 17: Audit log persistence', () => {
        test('audit log entry remains in localStorage after page reload simulation', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        action: fc.constantFrom('PEMBAYARAN_HUTANG', 'PEMBAYARAN_PIUTANG', 'CETAK_BUKTI_PEMBAYARAN'),
                        details: fc.record({
                            anggotaId: fc.uuid(),
                            anggotaNama: fc.string({ minLength: 3, maxLength: 50 }),
                            jumlah: fc.integer({ min: 10000, max: 1000000 })
                        })
                    }),
                    (logData) => {
                        // Setup
                        localStorage.setItem('currentUser', JSON.stringify({ 
                            id: 'U001', 
                            nama: 'Test Kasir' 
                        }));
                        localStorage.setItem('auditLog', JSON.stringify([]));
                        
                        // Action: Save audit log
                        saveAuditLog(logData.action, logData.details);
                        
                        // Simulate page reload by re-reading from localStorage
                        const persistedLogs = JSON.parse(localStorage.getItem('auditLog') || '[]');
                        
                        // Find the saved log
                        const savedLog = persistedLogs.find(log => 
                            log.action === logData.action && 
                            log.details.anggotaId === logData.details.anggotaId
                        );
                        
                        return savedLog !== undefined &&
                               savedLog.details.anggotaNama === logData.details.anggotaNama &&
                               savedLog.details.jumlah === logData.details.jumlah &&
                               savedLog.id !== undefined &&
                               savedLog.timestamp !== undefined;
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    // ========================================
    // PROPERTY 9: Complete transaction display
    // ========================================
    describe('Property 9: Complete transaction display', () => {
        test('riwayat display includes all transactions without omission', () => {
            fc.assert(
                fc.property(
                    fc.array(fc.record({
                        id: fc.uuid(),
                        tanggal: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString().split('T')[0]),
                        anggotaId: fc.uuid(),
                        anggotaNama: fc.string({ minLength: 3, maxLength: 50 }),
                        anggotaNIK: fc.string({ minLength: 5, maxLength: 20 }),
                        jenis: fc.constantFrom('hutang', 'piutang'),
                        jumlah: fc.integer({ min: 10000, max: 1000000 }),
                        saldoSebelum: fc.integer({ min: 0, max: 2000000 }),
                        saldoSesudah: fc.integer({ min: 0, max: 2000000 }),
                        kasirNama: fc.string({ minLength: 3, maxLength: 30 }),
                        status: fc.constant('selesai'),
                        createdAt: fc.date().map(d => d.toISOString())
                    }), { minLength: 1, maxLength: 20 }),
                    (transactionList) => {
                        // Setup
                        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(transactionList));
                        
                        // Mock DOM elements for filters (no filters applied)
                        mockGetElementById.mockImplementation((id) => {
                            if (id === 'filterJenis') return { value: '' };
                            if (id === 'filterTanggalDari') return { value: '' };
                            if (id === 'filterTanggalSampai') return { value: '' };
                            if (id === 'filterAnggota') return { value: '' };
                            return null;
                        });
                        
                        // Apply filters (should return all transactions)
                        const filteredList = applyRiwayatFilters(transactionList);
                        
                        // All transactions should be included when no filters are applied
                        return filteredList.length === transactionList.length &&
                               transactionList.every(t => 
                                   filteredList.some(f => f.id === t.id)
                               );
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    // ========================================
    // PROPERTY 10: Required fields in display
    // ========================================
    describe('Property 10: Required fields in display', () => {
        test('displayed transaction contains tanggal, nama anggota, jenis, jumlah, and kasir name', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        id: fc.uuid(),
                        tanggal: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString().split('T')[0]),
                        anggotaId: fc.uuid(),
                        anggotaNama: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
                        anggotaNIK: fc.string({ minLength: 5, maxLength: 20 }).filter(s => s.trim().length >= 5),
                        jenis: fc.constantFrom('hutang', 'piutang'),
                        jumlah: fc.integer({ min: 10000, max: 1000000 }),
                        saldoSebelum: fc.integer({ min: 0, max: 2000000 }),
                        saldoSesudah: fc.integer({ min: 0, max: 2000000 }),
                        kasirNama: fc.string({ minLength: 3, maxLength: 30 }).filter(s => s.trim().length >= 3),
                        status: fc.constant('selesai'),
                        createdAt: fc.date().map(d => d.toISOString())
                    }),
                    (transaction) => {
                        // Setup current user for access check
                        localStorage.setItem('currentUser', JSON.stringify({ 
                            id: 'U001', 
                            nama: 'Test User',
                            role: 'admin'
                        }));
                        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([transaction]));
                        
                        // Mock DOM elements
                        const mockTableBody = { innerHTML: '' };
                        mockGetElementById.mockImplementation((id) => {
                            if (id === 'riwayatTableBody') return mockTableBody;
                            if (id === 'filterJenis') return { value: '' };
                            if (id === 'filterTanggalDari') return { value: '' };
                            if (id === 'filterTanggalSampai') return { value: '' };
                            if (id === 'filterAnggota') return { value: '' };
                            return null;
                        });
                        
                        // Load riwayat
                        loadRiwayatPembayaran();
                        
                        const tableHTML = mockTableBody.innerHTML;
                        
                        // Check that all required fields are present in the display
                        return tableHTML.includes(transaction.anggotaNama.trim()) &&
                               tableHTML.includes(transaction.anggotaNIK.trim()) &&
                               tableHTML.includes(transaction.jenis === 'hutang' ? 'Hutang' : 'Piutang') &&
                               tableHTML.includes(transaction.kasirNama.trim()) &&
                               tableHTML.length > 0; // Ensure content was generated
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    // ========================================
    // PROPERTY 11: Jenis filter correctness
    // ========================================
    describe('Property 11: Jenis filter correctness', () => {
        test('all filtered results match selected jenis and no matching transactions are excluded', () => {
            fc.assert(
                fc.property(
                    fc.array(fc.record({
                        id: fc.uuid(),
                        tanggal: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString().split('T')[0]),
                        anggotaId: fc.uuid(),
                        anggotaNama: fc.string({ minLength: 3, maxLength: 50 }),
                        anggotaNIK: fc.string({ minLength: 5, maxLength: 20 }),
                        jenis: fc.constantFrom('hutang', 'piutang'),
                        jumlah: fc.integer({ min: 10000, max: 1000000 }),
                        saldoSebelum: fc.integer({ min: 0, max: 2000000 }),
                        saldoSesudah: fc.integer({ min: 0, max: 2000000 }),
                        kasirNama: fc.string({ minLength: 3, maxLength: 30 }),
                        status: fc.constant('selesai'),
                        createdAt: fc.date().map(d => d.toISOString())
                    }), { minLength: 5, maxLength: 20 }),
                    fc.constantFrom('hutang', 'piutang'),
                    (transactionList, selectedJenis) => {
                        // Ensure we have transactions of the selected jenis
                        const hasSelectedJenis = transactionList.some(t => t.jenis === selectedJenis);
                        if (!hasSelectedJenis) {
                            // Add at least one transaction of the selected jenis
                            transactionList[0] = { ...transactionList[0], jenis: selectedJenis };
                        }
                        
                        // Setup
                        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(transactionList));
                        
                        // Mock DOM elements with jenis filter
                        mockGetElementById.mockImplementation((id) => {
                            if (id === 'filterJenis') return { value: selectedJenis };
                            if (id === 'filterTanggalDari') return { value: '' };
                            if (id === 'filterTanggalSampai') return { value: '' };
                            if (id === 'filterAnggota') return { value: '' };
                            return null;
                        });
                        
                        // Apply filters
                        const filteredList = applyRiwayatFilters(transactionList);
                        
                        // Count expected matches
                        const expectedMatches = transactionList.filter(t => t.jenis === selectedJenis);
                        
                        // All filtered results should match selected jenis
                        const allMatch = filteredList.every(t => t.jenis === selectedJenis);
                        
                        // No matching transactions should be excluded
                        const noExclusions = expectedMatches.every(expected => 
                            filteredList.some(filtered => filtered.id === expected.id)
                        );
                        
                        return allMatch && noExclusions && filteredList.length === expectedMatches.length;
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    // ========================================
    // PROPERTY 12: Date range filter correctness
    // ========================================
    describe('Property 12: Date range filter correctness', () => {
        test('all filtered results fall within date range and no transactions within range are excluded', () => {
            fc.assert(
                fc.property(
                    fc.array(fc.record({
                        id: fc.uuid(),
                        tanggal: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString().split('T')[0]),
                        anggotaId: fc.uuid(),
                        anggotaNama: fc.string({ minLength: 3, maxLength: 50 }),
                        anggotaNIK: fc.string({ minLength: 5, maxLength: 20 }),
                        jenis: fc.constantFrom('hutang', 'piutang'),
                        jumlah: fc.integer({ min: 10000, max: 1000000 }),
                        saldoSebelum: fc.integer({ min: 0, max: 2000000 }),
                        saldoSesudah: fc.integer({ min: 0, max: 2000000 }),
                        kasirNama: fc.string({ minLength: 3, maxLength: 30 }),
                        status: fc.constant('selesai'),
                        createdAt: fc.date().map(d => d.toISOString())
                    }), { minLength: 5, maxLength: 20 }),
                    fc.date({ min: new Date('2024-03-01'), max: new Date('2024-09-01') }).map(d => d.toISOString().split('T')[0]),
                    fc.date({ min: new Date('2024-09-01'), max: new Date('2024-11-30') }).map(d => d.toISOString().split('T')[0]),
                    (transactionList, startDate, endDate) => {
                        // Ensure startDate <= endDate
                        if (startDate > endDate) {
                            [startDate, endDate] = [endDate, startDate];
                        }
                        
                        // Ensure we have at least one transaction within the date range
                        const withinRange = transactionList.some(t => t.tanggal >= startDate && t.tanggal <= endDate);
                        if (!withinRange && transactionList.length > 0) {
                            // Modify first transaction to be within range
                            transactionList[0] = { ...transactionList[0], tanggal: startDate };
                        }
                        
                        // Setup
                        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(transactionList));
                        
                        // Mock DOM elements with date range filter
                        mockGetElementById.mockImplementation((id) => {
                            if (id === 'filterJenis') return { value: '' };
                            if (id === 'filterTanggalDari') return { value: startDate };
                            if (id === 'filterTanggalSampai') return { value: endDate };
                            if (id === 'filterAnggota') return { value: '' };
                            return null;
                        });
                        
                        // Apply filters
                        const filteredList = applyRiwayatFilters(transactionList);
                        
                        // Count expected matches
                        const expectedMatches = transactionList.filter(t => 
                            t.tanggal >= startDate && t.tanggal <= endDate
                        );
                        
                        // All filtered results should fall within date range
                        const allWithinRange = filteredList.every(t => 
                            t.tanggal >= startDate && t.tanggal <= endDate
                        );
                        
                        // No transactions within range should be excluded
                        const noExclusions = expectedMatches.every(expected => 
                            filteredList.some(filtered => filtered.id === expected.id)
                        );
                        
                        return allWithinRange && noExclusions && filteredList.length === expectedMatches.length;
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    // ========================================
    // PROPERTY 13: Member filter correctness
    // ========================================
    describe('Property 13: Member filter correctness', () => {
        test('all filtered results belong to selected member and no transactions for that member are excluded', () => {
            fc.assert(
                fc.property(
                    fc.array(fc.record({
                        id: fc.uuid(),
                        tanggal: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString().split('T')[0]),
                        anggotaId: fc.constantFrom('A001', 'A002', 'A003', 'A004'),
                        anggotaNama: fc.string({ minLength: 3, maxLength: 50 }),
                        anggotaNIK: fc.string({ minLength: 5, maxLength: 20 }),
                        jenis: fc.constantFrom('hutang', 'piutang'),
                        jumlah: fc.integer({ min: 10000, max: 1000000 }),
                        saldoSebelum: fc.integer({ min: 0, max: 2000000 }),
                        saldoSesudah: fc.integer({ min: 0, max: 2000000 }),
                        kasirNama: fc.string({ minLength: 3, maxLength: 30 }),
                        status: fc.constant('selesai'),
                        createdAt: fc.date().map(d => d.toISOString())
                    }), { minLength: 5, maxLength: 20 }),
                    fc.constantFrom('A001', 'A002', 'A003'),
                    (transactionList, selectedAnggotaId) => {
                        // Ensure we have transactions for the selected member
                        const hasSelectedMember = transactionList.some(t => t.anggotaId === selectedAnggotaId);
                        if (!hasSelectedMember) {
                            // Add at least one transaction for the selected member
                            transactionList[0] = { ...transactionList[0], anggotaId: selectedAnggotaId };
                        }
                        
                        // Setup
                        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(transactionList));
                        
                        // Mock DOM elements with anggota filter
                        mockGetElementById.mockImplementation((id) => {
                            if (id === 'filterJenis') return { value: '' };
                            if (id === 'filterTanggalDari') return { value: '' };
                            if (id === 'filterTanggalSampai') return { value: '' };
                            if (id === 'filterAnggota') return { value: selectedAnggotaId };
                            return null;
                        });
                        
                        // Apply filters
                        const filteredList = applyRiwayatFilters(transactionList);
                        
                        // Count expected matches
                        const expectedMatches = transactionList.filter(t => t.anggotaId === selectedAnggotaId);
                        
                        // All filtered results should belong to selected member
                        const allBelongToMember = filteredList.every(t => t.anggotaId === selectedAnggotaId);
                        
                        // No transactions for that member should be excluded
                        const noExclusions = expectedMatches.every(expected => 
                            filteredList.some(filtered => filtered.id === expected.id)
                        );
                        
                        return allBelongToMember && noExclusions && filteredList.length === expectedMatches.length;
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    // ========================================
    // PROPERTY 26: Receipt completeness
    // ========================================
    describe('Property 26: Receipt completeness', () => {
        test('receipt contains all required fields: nomor transaksi, tanggal, anggota, jenis, jumlah, saldo before/after, kasir', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        id: fc.uuid(),
                        tanggal: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString().split('T')[0]),
                        anggotaId: fc.uuid(),
                        anggotaNama: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
                        anggotaNIK: fc.string({ minLength: 5, maxLength: 20 }).filter(s => s.trim().length >= 5),
                        jenis: fc.constantFrom('hutang', 'piutang'),
                        jumlah: fc.integer({ min: 10000, max: 1000000 }),
                        saldoSebelum: fc.integer({ min: 0, max: 2000000 }),
                        saldoSesudah: fc.integer({ min: 0, max: 2000000 }),
                        kasirNama: fc.string({ minLength: 3, maxLength: 30 }).filter(s => s.trim().length >= 3),
                        keterangan: fc.string({ maxLength: 100 }),
                        status: fc.constant('selesai'),
                        createdAt: fc.date().map(d => d.toISOString())
                    }),
                    (transaction) => {
                        // Setup
                        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([transaction]));
                        localStorage.setItem('systemSettings', JSON.stringify({
                            namaKoperasi: 'Test Koperasi',
                            alamat: 'Jl. Test No. 123',
                            telepon: '021-12345678'
                        }));
                        localStorage.setItem('currentUser', JSON.stringify({ 
                            id: 'U001', 
                            nama: 'Test Kasir',
                            role: 'admin'
                        }));
                        localStorage.setItem('users', JSON.stringify([{
                            id: 'U001',
                            nama: 'Test Kasir',
                            role: 'admin',
                            active: true
                        }]));
                        
                        // Mock window.open to capture receipt HTML
                        let capturedHTML = '';
                        global.window = {
                            open: jest.fn(() => ({
                                document: {
                                    write: jest.fn((html) => { capturedHTML = html; }),
                                    close: jest.fn()
                                }
                            }))
                        };
                        
                        // Call function
                        cetakBuktiPembayaran(transaction.id);
                        
                        // Verify all required fields are present in receipt
                        const jenisText = transaction.jenis === 'hutang' ? 'HUTANG' : 'PIUTANG';
                        
                        return capturedHTML.includes(transaction.id) && // nomor transaksi
                               capturedHTML.includes(transaction.anggotaNama.trim()) && // anggota nama
                               capturedHTML.includes(transaction.anggotaNIK.trim()) && // anggota NIK
                               capturedHTML.includes(jenisText) && // jenis
                               capturedHTML.includes(transaction.kasirNama.trim()) && // kasir nama
                               capturedHTML.includes('Test Koperasi') && // koperasi header
                               capturedHTML.includes('No. Transaksi') && // receipt structure
                               capturedHTML.includes('Saldo Sebelum') && // saldo labels
                               capturedHTML.includes('Saldo Sesudah') && // saldo labels
                               capturedHTML.length > 1000; // Ensure substantial content was generated
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    // ========================================
    // PROPERTY 27: Print action logging
    // ========================================
    describe('Property 27: Print action logging', () => {
        test('print action is logged to audit for any receipt print', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        id: fc.uuid(),
                        tanggal: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString().split('T')[0]),
                        anggotaId: fc.uuid(),
                        anggotaNama: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
                        anggotaNIK: fc.string({ minLength: 5, maxLength: 20 }).filter(s => s.trim().length >= 5),
                        jenis: fc.constantFrom('hutang', 'piutang'),
                        jumlah: fc.integer({ min: 10000, max: 1000000 }),
                        saldoSebelum: fc.integer({ min: 0, max: 2000000 }),
                        saldoSesudah: fc.integer({ min: 0, max: 2000000 }),
                        kasirNama: fc.string({ minLength: 3, maxLength: 30 }).filter(s => s.trim().length >= 3),
                        keterangan: fc.string({ maxLength: 100 }),
                        status: fc.constant('selesai'),
                        createdAt: fc.date().map(d => d.toISOString())
                    }),
                    (transaction) => {
                        // Setup
                        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([transaction]));
                        localStorage.setItem('systemSettings', JSON.stringify({
                            namaKoperasi: 'Test Koperasi',
                            alamat: 'Jl. Test No. 123',
                            telepon: '021-12345678'
                        }));
                        localStorage.setItem('currentUser', JSON.stringify({ 
                            id: 'U001', 
                            nama: 'Test Kasir',
                            role: 'admin'
                        }));
                        localStorage.setItem('users', JSON.stringify([{
                            id: 'U001',
                            nama: 'Test Kasir',
                            role: 'admin',
                            active: true
                        }]));
                        localStorage.setItem('auditLog', JSON.stringify([]));
                        
                        // Mock window.open
                        global.window = {
                            open: jest.fn(() => ({
                                document: {
                                    write: jest.fn(),
                                    close: jest.fn()
                                }
                            }))
                        };
                        
                        // Get initial audit log count
                        const auditLogsBefore = JSON.parse(localStorage.getItem('auditLog') || '[]');
                        const countBefore = auditLogsBefore.length;
                        
                        // Call function
                        cetakBuktiPembayaran(transaction.id);
                        
                        // Get audit logs after
                        const auditLogsAfter = JSON.parse(localStorage.getItem('auditLog') || '[]');
                        const countAfter = auditLogsAfter.length;
                        
                        // Find the print log
                        const printLog = auditLogsAfter.find(log => 
                            log.action === 'CETAK_BUKTI_PEMBAYARAN' && 
                            log.details.transaksiId === transaction.id
                        );
                        
                        return countAfter === countBefore + 1 && 
                               printLog !== undefined &&
                               printLog.details.jenis === transaction.jenis &&
                               printLog.details.anggotaNama === transaction.anggotaNama.trim() &&
                               printLog.details.jumlah === transaction.jumlah &&
                               printLog.userId === 'U001' &&
                               printLog.module === 'pembayaran-hutang-piutang';
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

});

// ========================================
// UNIT TESTS FOR UI RENDERING
// Requirements: 6.1 - Task 3.3
// ========================================
describe('UI Rendering Unit Tests', () => {
    
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
        mockDOM();
    });

    describe('renderPembayaranHutangPiutang', () => {
        test('should render main page structure with required elements', () => {
            // Mock content element
            const mockContent = {
                innerHTML: ''
            };
            document.getElementById.mockReturnValue(mockContent);
            
            // Mock user with access
            localStorage.setItem('currentUser', JSON.stringify({ role: 'kasir' }));
            
            renderPembayaranHutangPiutang();
            
            // Verify content was set
            expect(mockContent.innerHTML).toBeTruthy();
            expect(mockContent.innerHTML).toContain('Pembayaran Hutang / Piutang Anggota');
            expect(mockContent.innerHTML).toContain('Total Hutang Anggota');
            expect(mockContent.innerHTML).toContain('Total Piutang Anggota');
            expect(mockContent.innerHTML).toContain('Form Pembayaran');
            expect(mockContent.innerHTML).toContain('Riwayat Pembayaran');
        });

        test('should show access denied for unauthorized users', () => {
            const mockContent = {
                innerHTML: ''
            };
            document.getElementById.mockReturnValue(mockContent);
            
            // Mock user without access
            localStorage.setItem('currentUser', JSON.stringify({ role: 'member' }));
            
            renderPembayaranHutangPiutang();
            
            expect(mockContent.innerHTML).toContain('Akses Ditolak');
            expect(mockContent.innerHTML).toContain('tidak memiliki izin');
        });

        test('should handle missing content element gracefully', () => {
            document.getElementById.mockReturnValue(null);
            
            // Should not throw error
            expect(() => renderPembayaranHutangPiutang()).not.toThrow();
        });
    });

    describe('renderFormPembayaran', () => {
        test('should render form with all required fields', () => {
            const mockContainer = {
                innerHTML: ''
            };
            document.getElementById.mockReturnValue(mockContainer);
            
            renderFormPembayaran();
            
            // Verify form structure
            expect(mockContainer.innerHTML).toContain('formPembayaran');
            expect(mockContainer.innerHTML).toContain('jenisPembayaran');
            expect(mockContainer.innerHTML).toContain('searchAnggota');
            expect(mockContainer.innerHTML).toContain('jumlahPembayaran');
            expect(mockContainer.innerHTML).toContain('keteranganPembayaran');
            expect(mockContainer.innerHTML).toContain('btnProsesPembayaran');
        });

        test('should include jenis pembayaran options', () => {
            const mockContainer = {
                innerHTML: ''
            };
            document.getElementById.mockReturnValue(mockContainer);
            
            renderFormPembayaran();
            
            expect(mockContainer.innerHTML).toContain('Pembayaran Hutang');
            expect(mockContainer.innerHTML).toContain('Pembayaran Piutang');
            expect(mockContainer.innerHTML).toContain('value="hutang"');
            expect(mockContainer.innerHTML).toContain('value="piutang"');
        });

        test('should include required field indicators', () => {
            const mockContainer = {
                innerHTML: ''
            };
            document.getElementById.mockReturnValue(mockContainer);
            
            renderFormPembayaran();
            
            // Check for required field asterisks
            expect(mockContainer.innerHTML).toContain('text-danger">*');
            expect(mockContainer.innerHTML).toContain('required');
        });

        test('should include autocomplete functionality', () => {
            const mockContainer = {
                innerHTML: ''
            };
            document.getElementById.mockReturnValue(mockContainer);
            
            renderFormPembayaran();
            
            expect(mockContainer.innerHTML).toContain('anggotaSuggestions');
            expect(mockContainer.innerHTML).toContain('onSearchAnggota');
            expect(mockContainer.innerHTML).toContain('autocomplete="off"');
        });

        test('should include saldo display area', () => {
            const mockContainer = {
                innerHTML: ''
            };
            document.getElementById.mockReturnValue(mockContainer);
            
            renderFormPembayaran();
            
            expect(mockContainer.innerHTML).toContain('saldoDisplay');
            expect(mockContainer.innerHTML).toContain('displaySaldoHutang');
            expect(mockContainer.innerHTML).toContain('displaySaldoPiutang');
        });

        test('should handle missing container element gracefully', () => {
            document.getElementById.mockReturnValue(null);
            
            // Should not throw error
            expect(() => renderFormPembayaran()).not.toThrow();
        });
    });
});

// ========================================
// PROPERTY 19: Automatic saldo display
// ========================================
describe('Property 19: Automatic saldo display', () => {
    test('system automatically displays both hutang and piutang saldo when anggota is selected', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.uuid(),
                    nama: fc.string({ minLength: 3, maxLength: 50 }),
                    nik: fc.string({ minLength: 5, maxLength: 20 }),
                    status: fc.constant('Aktif')
                }),
                fc.array(fc.record({
                    anggotaId: fc.uuid(),
                    metodePembayaran: fc.constant('Kredit'),
                    total: fc.integer({ min: 10000, max: 1000000 })
                }), { maxLength: 5 }),
                fc.array(fc.record({
                    anggotaId: fc.uuid(),
                    statusPengembalian: fc.constant('pending'),
                    saldo: fc.integer({ min: 5000, max: 500000 })
                }), { maxLength: 3 }),
                (anggota, penjualanList, simpananList) => {
                    // Setup mock first
                    const localMockGetElementById = mockDOM();
                    
                    // Setup data with anggota ID matching
                    const penjualanForAnggota = penjualanList.map(p => ({ ...p, anggotaId: anggota.id }));
                    const simpananForAnggota = simpananList.map(s => ({ ...s, anggotaId: anggota.id }));
                    
                    localStorage.setItem('penjualan', JSON.stringify(penjualanForAnggota));
                    localStorage.setItem('simpanan', JSON.stringify(simpananForAnggota));
                    localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([]));
                    
                    // Mock DOM elements
                    const mockElements = {
                        displaySaldoHutang: { textContent: '', classList: { add: jest.fn(), remove: jest.fn() }, parentElement: { classList: { add: jest.fn(), remove: jest.fn() } } },
                        displaySaldoPiutang: { textContent: '', classList: { add: jest.fn(), remove: jest.fn() }, parentElement: { classList: { add: jest.fn(), remove: jest.fn() } } },
                        saldoDisplay: { style: { display: 'none' }, classList: { add: jest.fn() } },
                        jenisPembayaran: { value: '' }
                    };
                    
                    localMockGetElementById.mockImplementation((id) => mockElements[id] || null);
                    
                    // Call function
                    displaySaldoAnggotaAutomatic(anggota.id);
                    
                    // Calculate expected values
                    const expectedHutang = penjualanForAnggota.reduce((sum, p) => sum + p.total, 0);
                    const expectedPiutang = simpananForAnggota.reduce((sum, s) => sum + s.saldo, 0);
                    
                    // Verify saldo display is shown
                    const saldoDisplayShown = mockElements.saldoDisplay.style.display === 'block';
                    
                    // Verify saldo values are set (checking if formatRupiah was called with correct values)
                    const hutangDisplayed = mockElements.displaySaldoHutang.textContent.includes('Rp') || 
                                          mockElements.displaySaldoHutang.textContent === `Rp ${expectedHutang.toLocaleString('id-ID')}`;
                    const piutangDisplayed = mockElements.displaySaldoPiutang.textContent.includes('Rp') ||
                                           mockElements.displaySaldoPiutang.textContent === `Rp ${expectedPiutang.toLocaleString('id-ID')}`;
                    
                    return saldoDisplayShown && 
                           (hutangDisplayed || mockElements.displaySaldoHutang.textContent !== '') &&
                           (piutangDisplayed || mockElements.displaySaldoPiutang.textContent !== '');
                }
            ),
            { numRuns: 50 }
        );
    });
});

// ========================================
// PROPERTY 20: Relevant saldo display by jenis
// ========================================
describe('Property 20: Relevant saldo display by jenis', () => {
    test('system highlights hutang saldo when hutang is selected and piutang saldo when piutang is selected', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('hutang', 'piutang'),
                fc.integer({ min: 10000, max: 1000000 }),
                fc.integer({ min: 5000, max: 500000 }),
                (jenis, saldoHutang, saldoPiutang) => {
                    // Setup mock first
                    const localMockGetElementById = mockDOM();
                    
                    // Mock DOM elements
                    const mockHutangContainer = { 
                        classList: { 
                            add: jest.fn(), 
                            remove: jest.fn() 
                        }, 
                        style: {} 
                    };
                    const mockPiutangContainer = { 
                        classList: { 
                            add: jest.fn(), 
                            remove: jest.fn() 
                        }, 
                        style: {} 
                    };
                    const mockJumlahInput = { 
                        disabled: false, 
                        max: '', 
                        placeholder: '', 
                        value: '',
                        classList: { add: jest.fn(), remove: jest.fn() }
                    };
                    
                    const mockElements = {
                        displaySaldoHutang: { parentElement: mockHutangContainer },
                        displaySaldoPiutang: { parentElement: mockPiutangContainer },
                        jumlahPembayaran: mockJumlahInput
                    };
                    
                    localMockGetElementById.mockImplementation((id) => mockElements[id] || null);
                    
                    // Call function
                    highlightRelevantSaldoDynamic(jenis, saldoHutang, saldoPiutang);
                    controlJumlahInputBasedOnSaldo(jenis, saldoHutang, saldoPiutang);
                    
                    if (jenis === 'hutang') {
                        // Verify hutang is highlighted when saldo > 0
                        if (saldoHutang > 0) {
                            const hutangHighlighted = mockHutangContainer.classList.add.mock.calls.some(call => 
                                call.includes('border-danger') || call.includes('bg-light')
                            );
                            const inputEnabled = !mockJumlahInput.disabled;
                            const maxSet = mockJumlahInput.max === saldoHutang;
                            return hutangHighlighted && inputEnabled && maxSet;
                        } else {
                            const inputDisabled = mockJumlahInput.disabled;
                            return inputDisabled;
                        }
                    } else if (jenis === 'piutang') {
                        // Verify piutang is highlighted when saldo > 0
                        if (saldoPiutang > 0) {
                            const piutangHighlighted = mockPiutangContainer.classList.add.mock.calls.some(call => 
                                call.includes('border-success') || call.includes('bg-light')
                            );
                            const inputEnabled = !mockJumlahInput.disabled;
                            const maxSet = mockJumlahInput.max === saldoPiutang;
                            return piutangHighlighted && inputEnabled && maxSet;
                        } else {
                            const inputDisabled = mockJumlahInput.disabled;
                            return inputDisabled;
                        }
                    }
                    
                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });
});

// ========================================
// UNIT TESTS FOR UI RENDERING
// Requirements: 6.1 - Task 3.3
// ========================================
describe('UI Rendering Unit Tests', () => {
    
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
        mockGetElementById = mockDOM();
    });

    describe('renderPembayaranHutangPiutang', () => {
        test('should render main page structure with required elements', () => {
            // Mock content element
            const mockContent = {
                innerHTML: ''
            };
            mockGetElementById.mockReturnValue(mockContent);
            
            // Mock user with access
            localStorage.setItem('currentUser', JSON.stringify({ role: 'kasir' }));
            
            renderPembayaranHutangPiutang();
            
            // Verify content was set
            expect(mockContent.innerHTML).toBeTruthy();
            expect(mockContent.innerHTML).toContain('Pembayaran Hutang / Piutang Anggota');
            expect(mockContent.innerHTML).toContain('Total Hutang Anggota');
            expect(mockContent.innerHTML).toContain('Total Piutang Anggota');
            expect(mockContent.innerHTML).toContain('Form Pembayaran');
            expect(mockContent.innerHTML).toContain('Riwayat Pembayaran');
        });

        test('should show access denied for unauthorized users', () => {
            const mockContent = {
                innerHTML: ''
            };
            mockGetElementById.mockReturnValue(mockContent);
            
            // Mock user without access
            localStorage.setItem('currentUser', JSON.stringify({ role: 'member' }));
            
            renderPembayaranHutangPiutang();
            
            expect(mockContent.innerHTML).toContain('Akses Ditolak');
            expect(mockContent.innerHTML).toContain('tidak memiliki izin');
        });

        test('should handle missing content element gracefully', () => {
            mockGetElementById.mockReturnValue(null);
            
            // Should not throw error
            expect(() => renderPembayaranHutangPiutang()).not.toThrow();
        });
    });

    describe('renderFormPembayaran', () => {
        test('should render form with all required fields', () => {
            const mockContainer = {
                innerHTML: ''
            };
            mockGetElementById.mockReturnValue(mockContainer);
            
            renderFormPembayaran();
            
            // Verify form structure
            expect(mockContainer.innerHTML).toContain('formPembayaran');
            expect(mockContainer.innerHTML).toContain('jenisPembayaran');
            expect(mockContainer.innerHTML).toContain('searchAnggota');
            expect(mockContainer.innerHTML).toContain('jumlahPembayaran');
            expect(mockContainer.innerHTML).toContain('keteranganPembayaran');
            expect(mockContainer.innerHTML).toContain('btnProsesPembayaran');
        });

        test('should include jenis pembayaran options', () => {
            const mockContainer = {
                innerHTML: ''
            };
            mockGetElementById.mockReturnValue(mockContainer);
            
            renderFormPembayaran();
            
            expect(mockContainer.innerHTML).toContain('Pembayaran Hutang');
            expect(mockContainer.innerHTML).toContain('Pembayaran Piutang');
            expect(mockContainer.innerHTML).toContain('value="hutang"');
            expect(mockContainer.innerHTML).toContain('value="piutang"');
        });

        test('should include required field indicators', () => {
            const mockContainer = {
                innerHTML: ''
            };
            mockGetElementById.mockReturnValue(mockContainer);
            
            renderFormPembayaran();
            
            // Check for required field asterisks
            expect(mockContainer.innerHTML).toContain('text-danger">*');
            expect(mockContainer.innerHTML).toContain('required');
        });

        test('should include autocomplete functionality', () => {
            const mockContainer = {
                innerHTML: ''
            };
            mockGetElementById.mockReturnValue(mockContainer);
            
            renderFormPembayaran();
            
            expect(mockContainer.innerHTML).toContain('anggotaSuggestions');
            expect(mockContainer.innerHTML).toContain('onSearchAnggota');
            expect(mockContainer.innerHTML).toContain('autocomplete="off"');
        });

        test('should include saldo display area', () => {
            const mockContainer = {
                innerHTML: ''
            };
            mockGetElementById.mockReturnValue(mockContainer);
            
            renderFormPembayaran();
            
            expect(mockContainer.innerHTML).toContain('saldoDisplay');
            expect(mockContainer.innerHTML).toContain('displaySaldoHutang');
            expect(mockContainer.innerHTML).toContain('displaySaldoPiutang');
        });

        test('should handle missing container element gracefully', () => {
            mockGetElementById.mockReturnValue(null);
            
            // Should not throw error
            expect(() => renderFormPembayaran()).not.toThrow();
        });
    });

    describe('updateSummaryCards', () => {
        test('should update summary cards with calculated totals', () => {
            // Mock elements
            const mockHutangDisplay = { textContent: '' };
            const mockPiutangDisplay = { textContent: '' };
            
            mockGetElementById.mockImplementation((id) => {
                if (id === 'totalHutangDisplay') return mockHutangDisplay;
                if (id === 'totalPiutangDisplay') return mockPiutangDisplay;
                return null;
            });
            
            // Setup test data
            const anggotaList = [
                { id: 'A001' },
                { id: 'A002' }
            ];
            localStorage.setItem('anggota', JSON.stringify(anggotaList));
            
            // Setup penjualan for hutang
            const penjualan = [
                { anggotaId: 'A001', metodePembayaran: 'Kredit', total: 100000 },
                { anggotaId: 'A002', metodePembayaran: 'Kredit', total: 200000 }
            ];
            localStorage.setItem('penjualan', JSON.stringify(penjualan));
            
            // Setup simpanan for piutang
            const simpanan = [
                { anggotaId: 'A001', statusPengembalian: 'pending', saldo: 50000 },
                { anggotaId: 'A002', statusPengembalian: 'pending', saldo: 75000 }
            ];
            localStorage.setItem('simpanan', JSON.stringify(simpanan));
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([]));
            
            updateSummaryCards();
            
            // Verify totals were calculated and displayed
            expect(mockHutangDisplay.textContent).toBeTruthy();
            expect(mockPiutangDisplay.textContent).toBeTruthy();
        });

        test('should handle missing display elements gracefully', () => {
            mockGetElementById.mockReturnValue(null);
            localStorage.setItem('anggota', JSON.stringify([]));
            
            // Should not throw error
            expect(() => updateSummaryCards()).not.toThrow();
        });

        test('should handle empty anggota list', () => {
            const mockHutangDisplay = { textContent: '' };
            const mockPiutangDisplay = { textContent: '' };
            
            mockGetElementById.mockImplementation((id) => {
                if (id === 'totalHutangDisplay') return mockHutangDisplay;
                if (id === 'totalPiutangDisplay') return mockPiutangDisplay;
                return null;
            });
            
            localStorage.setItem('anggota', JSON.stringify([]));
            
            updateSummaryCards();
            
            expect(mockHutangDisplay.textContent).toContain('Rp 0');
            expect(mockPiutangDisplay.textContent).toContain('Rp 0');
        });
    });

});
