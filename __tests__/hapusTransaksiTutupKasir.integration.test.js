/**
 * Integration Tests for Hapus Transaksi Tutup Kasir
 * Feature: hapus-transaksi-tutup-kasir
 * Task: 12.1 Write integration tests
 * 
 * These tests verify the complete closed shift deletion flow end-to-end,
 * including rollback scenarios, rate limiting, password blocking, unauthorized access,
 * and validation failures.
 * 
 * Requirements: All
 */

import fc from 'fast-check';

// Import the module under test
import '../js/hapusTransaksiTutupKasir.js';

// Get services from global scope
const ClosedShiftDeletionService = global.ClosedShiftDeletionService || window.ClosedShiftDeletionService;
const RoleValidator = global.RoleValidator || window.RoleValidator;
const PasswordVerificationService = global.PasswordVerificationService || window.PasswordVerificationService;
const RateLimiterService = global.RateLimiterService || window.RateLimiterService;
const TutupKasirAdjustmentService = global.TutupKasirAdjustmentService || window.TutupKasirAdjustmentService;
const CriticalAuditLoggerService = global.CriticalAuditLoggerService || window.CriticalAuditLoggerService;
const DataIntegrityValidator = global.DataIntegrityValidator || window.DataIntegrityValidator;

/**
 * INTEGRATION TEST 1: Complete Closed Shift Deletion Flow End-to-End
 * Tests the entire deletion process from start to finish
 * Requirements: All
 */
describe('Integration Test 1: Complete Closed Shift Deletion Flow End-to-End', () => {
    
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        
        // Setup test users
        const users = [
            { id: 1, username: 'admin', password: 'admin123', role: 'administrator', name: 'Admin User' },
            { id: 2, username: 'kasir1', password: 'kasir123', role: 'kasir', name: 'Kasir User' }
        ];
        localStorage.setItem('users', JSON.stringify(users));
        
        // Setup COA (Chart of Accounts)
        const coa = [
            { kode: '1-1000', nama: 'Kas', tipe: 'Aset', saldo: 1000000 },
            { kode: '1-1200', nama: 'Piutang Anggota', tipe: 'Aset', saldo: 500000 },
            { kode: '1-1300', nama: 'Persediaan Barang', tipe: 'Aset', saldo: 2000000 },
            { kode: '4-1000', nama: 'Pendapatan Penjualan', tipe: 'Pendapatan', saldo: 5000000 },
            { kode: '5-1000', nama: 'Harga Pokok Penjualan', tipe: 'Beban', saldo: 2000000 }
        ];
        localStorage.setItem('coa', JSON.stringify(coa));
    });
    
    afterEach(() => {
        localStorage.clear();
    });

    test('should complete full deletion flow for cash transaction', () => {
        // Setup: Create a closed shift with a cash transaction
        const shift = {
            id: 'shift-001',
            tanggalTutup: new Date('2024-01-15T18:00:00').toISOString(),
            totalPenjualan: 500000,
            totalKas: 400000,
            totalPiutang: 100000,
            kasir: 'kasir1'
        };
        
        const transaction = {
            id: 'trans-001',
            noTransaksi: 'TRX-001',
            tanggal: new Date('2024-01-15T15:30:00').toISOString(),
            total: 50000,
            metode: 'cash',
            kasir: 'kasir1',
            items: [
                { id: 'item-001', nama: 'Produk A', qty: 2, harga: 25000, hpp: 15000 }
            ]
        };
        
        const barang = [
            { id: 'item-001', nama: 'Produk A', stok: 100, harga: 25000 }
        ];
        
        localStorage.setItem('riwayatTutupKas', JSON.stringify([shift]));
        localStorage.setItem('posTransactions', JSON.stringify([transaction]));
        localStorage.setItem('barang', JSON.stringify(barang));
        
        // Execute: Delete closed transaction
        const service = new ClosedShiftDeletionService();
        const deletionData = {
            category: 'Kesalahan Input',
            reason: 'Integration test: Complete deletion flow for cash transaction',
            username: 'admin',
            password: 'admin123',
            user: { username: 'admin', role: 'administrator' }
        };
        
        const result = service.deleteClosedTransaction(transaction.id, deletionData);
        
        // Verify: Deletion succeeded
        expect(result.success).toBe(true);
        expect(result.auditId).toBeDefined();
        expect(result.auditId).toMatch(/^AUDIT-CLOSED-\d{8}-\d{4}$/);
        
        // Verify: Transaction is deleted
        const transactions = JSON.parse(localStorage.getItem('posTransactions') || '[]');
        expect(transactions.length).toBe(0);
        
        // Verify: Stock is restored
        const updatedBarang = JSON.parse(localStorage.getItem('barang') || '[]');
        const restoredItem = updatedBarang.find(b => b.id === 'item-001');
        expect(restoredItem.stok).toBe(102); // 100 + 2
        
        // Verify: Tutup kasir is adjusted
        const shifts = JSON.parse(localStorage.getItem('riwayatTutupKas') || '[]');
        const adjustedShift = shifts.find(s => s.id === 'shift-001');
        expect(adjustedShift.totalPenjualan).toBe(450000); // 500000 - 50000
        expect(adjustedShift.totalKas).toBe(350000); // 400000 - 50000
        expect(adjustedShift.adjustments).toBeDefined();
        expect(adjustedShift.adjustments.length).toBe(1);
        expect(adjustedShift.adjustments[0].transactionNo).toBe('TRX-001');
        
        // Verify: Reversal journals are created with special tag
        const journals = JSON.parse(localStorage.getItem('journals') || '[]');
        const reversalJournals = journals.filter(j => j.tag === 'CLOSED_SHIFT_REVERSAL');
        expect(reversalJournals.length).toBeGreaterThan(0);
        
        // Verify revenue reversal journal
        const revenueJournal = reversalJournals.find(j => 
            j.deskripsi.includes('Reversal Transaksi Tertutup') && !j.deskripsi.includes('HPP')
        );
        expect(revenueJournal).toBeDefined();
        expect(revenueJournal.entries.length).toBe(2);
        
        const pendapatanEntry = revenueJournal.entries.find(e => e.akun === '4-1000');
        expect(pendapatanEntry.debit).toBe(50000);
        expect(pendapatanEntry.kredit).toBe(0);
        
        const kasEntry = revenueJournal.entries.find(e => e.akun === '1-1000');
        expect(kasEntry.debit).toBe(0);
        expect(kasEntry.kredit).toBe(50000);
        
        // Verify HPP reversal journal
        const hppJournal = reversalJournals.find(j => j.deskripsi.includes('HPP'));
        expect(hppJournal).toBeDefined();
        expect(hppJournal.entries.length).toBe(2);
        
        const persediaanEntry = hppJournal.entries.find(e => e.akun === '1-1300');
        expect(persediaanEntry.debit).toBe(30000); // 2 * 15000
        expect(persediaanEntry.kredit).toBe(0);
        
        const hppEntry = hppJournal.entries.find(e => e.akun === '5-1000');
        expect(hppEntry.debit).toBe(0);
        expect(hppEntry.kredit).toBe(30000);
        
        // Verify: Critical audit log is created
        const auditService = new CriticalAuditLoggerService();
        const auditLogs = auditService.getCriticalHistory();
        expect(auditLogs.length).toBe(1);
        
        const auditLog = auditLogs[0];
        expect(auditLog.level).toBe('CRITICAL');
        expect(auditLog.auditId).toBe(result.auditId);
        expect(auditLog.transactionId).toBe(transaction.id);
        expect(auditLog.category).toBe('Kesalahan Input');
        expect(auditLog.deletedBy).toBe('admin');
        expect(auditLog.transactionSnapshot).toBeDefined();
        expect(auditLog.shiftSnapshot).toBeDefined();
        expect(auditLog.shiftSnapshot.before).toBeDefined();
        expect(auditLog.shiftSnapshot.after).toBeDefined();
        expect(auditLog.journalEntries).toBeDefined();
        expect(auditLog.journalEntries.length).toBeGreaterThan(0);
    });

    test('should complete full deletion flow for credit transaction', () => {
        // Setup: Create a closed shift with a credit transaction
        const shift = {
            id: 'shift-002',
            tanggalTutup: new Date('2024-01-16T18:00:00').toISOString(),
            totalPenjualan: 600000,
            totalKas: 300000,
            totalPiutang: 300000,
            kasir: 'kasir1'
        };
        
        const transaction = {
            id: 'trans-002',
            noTransaksi: 'TRX-002',
            tanggal: new Date('2024-01-16T14:20:00').toISOString(),
            total: 75000,
            metode: 'bon',
            kasir: 'kasir1',
            items: [
                { id: 'item-002', nama: 'Produk B', qty: 3, harga: 25000, hpp: 12000 }
            ]
        };
        
        const barang = [
            { id: 'item-002', nama: 'Produk B', stok: 50, harga: 25000 }
        ];
        
        localStorage.setItem('riwayatTutupKas', JSON.stringify([shift]));
        localStorage.setItem('posTransactions', JSON.stringify([transaction]));
        localStorage.setItem('barang', JSON.stringify(barang));
        
        // Execute: Delete closed transaction
        const service = new ClosedShiftDeletionService();
        const deletionData = {
            category: 'Transaksi Duplikat',
            reason: 'Integration test: Complete deletion flow for credit transaction',
            username: 'admin',
            password: 'admin123',
            user: { username: 'admin', role: 'administrator' }
        };
        
        const result = service.deleteClosedTransaction(transaction.id, deletionData);
        
        // Verify: Deletion succeeded
        expect(result.success).toBe(true);
        
        // Verify: Transaction is deleted
        const transactions = JSON.parse(localStorage.getItem('posTransactions') || '[]');
        expect(transactions.length).toBe(0);
        
        // Verify: Stock is restored
        const updatedBarang = JSON.parse(localStorage.getItem('barang') || '[]');
        const restoredItem = updatedBarang.find(b => b.id === 'item-002');
        expect(restoredItem.stok).toBe(53); // 50 + 3
        
        // Verify: Tutup kasir is adjusted for credit
        const shifts = JSON.parse(localStorage.getItem('riwayatTutupKas') || '[]');
        const adjustedShift = shifts.find(s => s.id === 'shift-002');
        expect(adjustedShift.totalPenjualan).toBe(525000); // 600000 - 75000
        expect(adjustedShift.totalPiutang).toBe(225000); // 300000 - 75000
        expect(adjustedShift.totalKas).toBe(300000); // Unchanged for credit transaction
        
        // Verify: Reversal journals are created with piutang
        const journals = JSON.parse(localStorage.getItem('journals') || '[]');
        const reversalJournals = journals.filter(j => j.tag === 'CLOSED_SHIFT_REVERSAL');
        
        const revenueJournal = reversalJournals.find(j => 
            j.deskripsi.includes('Reversal Transaksi Tertutup') && !j.deskripsi.includes('HPP')
        );
        expect(revenueJournal).toBeDefined();
        
        const pendapatanEntry = revenueJournal.entries.find(e => e.akun === '4-1000');
        expect(pendapatanEntry.debit).toBe(75000);
        
        const piutangEntry = revenueJournal.entries.find(e => e.akun === '1-1200');
        expect(piutangEntry.kredit).toBe(75000);
        
        // Verify: Critical audit log is created
        const auditService = new CriticalAuditLoggerService();
        const auditLogs = auditService.getCriticalHistory();
        expect(auditLogs.length).toBe(1);
        expect(auditLogs[0].category).toBe('Transaksi Duplikat');
    });
});

/**
 * INTEGRATION TEST 2: Rollback Scenario When Journal Creation Fails
 * Tests that the system properly rolls back all changes when journal creation fails
 * Requirements: 9.3, 9.4, 9.5
 */
describe('Integration Test 2: Rollback Scenario When Journal Creation Fails', () => {
    
    beforeEach(() => {
        localStorage.clear();
        
        const users = [
            { id: 1, username: 'admin', password: 'admin123', role: 'administrator', name: 'Admin User' }
        ];
        localStorage.setItem('users', JSON.stringify(users));
        
        // Setup COA - but make it incomplete to trigger journal failure
        const coa = [
            { kode: '1-1000', nama: 'Kas', tipe: 'Aset', saldo: 1000000 }
            // Missing other accounts to cause journal creation to fail
        ];
        localStorage.setItem('coa', JSON.stringify(coa));
    });
    
    afterEach(() => {
        localStorage.clear();
    });

    test('should rollback all changes when validation fails', () => {
        // Setup: Create a closed shift with a transaction
        const shift = {
            id: 'shift-rollback',
            tanggalTutup: new Date('2024-01-17T18:00:00').toISOString(),
            totalPenjualan: 400000,
            totalKas: 400000,
            totalPiutang: 0,
            kasir: 'kasir1'
        };
        
        const transaction = {
            id: 'trans-rollback',
            noTransaksi: 'TRX-ROLLBACK',
            tanggal: new Date('2024-01-17T16:00:00').toISOString(),
            total: 60000,
            metode: 'cash',
            kasir: 'kasir1',
            items: [
                { id: 'item-rollback', nama: 'Produk C', qty: 1, harga: 60000, hpp: 30000 }
            ]
        };
        
        const barang = [
            { id: 'item-rollback', nama: 'Produk C', stok: 20, harga: 60000 }
        ];
        
        // Save original state
        const originalShift = JSON.parse(JSON.stringify(shift));
        const originalTransaction = JSON.parse(JSON.stringify(transaction));
        const originalBarang = JSON.parse(JSON.stringify(barang));
        
        localStorage.setItem('riwayatTutupKas', JSON.stringify([shift]));
        localStorage.setItem('posTransactions', JSON.stringify([transaction]));
        localStorage.setItem('barang', JSON.stringify(barang));
        
        // Execute: Try to delete (should fail due to incomplete COA)
        const service = new ClosedShiftDeletionService();
        const deletionData = {
            category: 'Kesalahan Input',
            reason: 'Integration test: Rollback scenario when journal creation fails',
            username: 'admin',
            password: 'admin123',
            user: { username: 'admin', role: 'administrator' }
        };
        
        const result = service.deleteClosedTransaction(transaction.id, deletionData);
        
        // Verify: Deletion failed
        expect(result.success).toBe(false);
        expect(result.message).toBeDefined();
        
        // Verify: Transaction still exists (rollback successful)
        const transactions = JSON.parse(localStorage.getItem('posTransactions') || '[]');
        expect(transactions.length).toBe(1);
        expect(transactions[0].id).toBe(transaction.id);
        expect(transactions[0].noTransaksi).toBe(transaction.noTransaksi);
        
        // Verify: Stock unchanged (rollback successful)
        const currentBarang = JSON.parse(localStorage.getItem('barang') || '[]');
        const item = currentBarang.find(b => b.id === 'item-rollback');
        expect(item.stok).toBe(originalBarang[0].stok);
        
        // Verify: Tutup kasir unchanged (rollback successful)
        const shifts = JSON.parse(localStorage.getItem('riwayatTutupKas') || '[]');
        const currentShift = shifts.find(s => s.id === 'shift-rollback');
        expect(currentShift.totalPenjualan).toBe(originalShift.totalPenjualan);
        expect(currentShift.totalKas).toBe(originalShift.totalKas);
        expect(currentShift.adjustments).toBeUndefined();
        
        // Verify: No journals created
        const journals = JSON.parse(localStorage.getItem('journals') || '[]');
        expect(journals.length).toBe(0);
        
        // Verify: No critical audit log created (since deletion failed)
        const auditService = new CriticalAuditLoggerService();
        const auditLogs = auditService.getCriticalHistory();
        expect(auditLogs.length).toBe(0);
    });
});

/**
 * INTEGRATION TEST 3: Rate Limiting Scenario
 * Tests rate limiting at 5 deletions (warning) and 10 deletions (block)
 * Requirements: 10.2, 10.3, 10.4
 */
describe('Integration Test 3: Rate Limiting Scenario', () => {
    
    beforeEach(() => {
        localStorage.clear();
        
        const users = [
            { id: 1, username: 'admin', password: 'admin123', role: 'administrator', name: 'Admin User' }
        ];
        localStorage.setItem('users', JSON.stringify(users));
        
        const coa = [
            { kode: '1-1000', nama: 'Kas', tipe: 'Aset', saldo: 1000000 },
            { kode: '1-1200', nama: 'Piutang Anggota', tipe: 'Aset', saldo: 500000 },
            { kode: '1-1300', nama: 'Persediaan Barang', tipe: 'Aset', saldo: 2000000 },
            { kode: '4-1000', nama: 'Pendapatan Penjualan', tipe: 'Pendapatan', saldo: 5000000 },
            { kode: '5-1000', nama: 'Harga Pokok Penjualan', tipe: 'Beban', saldo: 2000000 }
        ];
        localStorage.setItem('coa', JSON.stringify(coa));
    });
    
    afterEach(() => {
        localStorage.clear();
    });

    test('should show warning at 5 deletions', () => {
        const service = new ClosedShiftDeletionService();
        const deletionData = {
            category: 'Kesalahan Input',
            reason: 'Integration test: Rate limiting warning at 5 deletions',
            username: 'admin',
            password: 'admin123',
            user: { username: 'admin', role: 'administrator' }
        };
        
        // Delete 5 transactions
        for (let i = 0; i < 5; i++) {
            const shift = {
                id: `shift-${i}`,
                tanggalTutup: new Date().toISOString(),
                totalPenjualan: 100000,
                totalKas: 100000,
                kasir: 'kasir1'
            };
            
            const transaction = {
                id: `trans-${i}`,
                noTransaksi: `TRX-${i}`,
                tanggal: new Date().toISOString(),
                total: 10000,
                metode: 'cash',
                kasir: 'kasir1',
                items: [
                    { id: `item-${i}`, nama: `Item ${i}`, qty: 1, harga: 10000, hpp: 5000 }
                ]
            };
            
            const barang = [
                { id: `item-${i}`, nama: `Item ${i}`, stok: 100, harga: 10000 }
            ];
            
            localStorage.setItem('riwayatTutupKas', JSON.stringify([shift]));
            localStorage.setItem('posTransactions', JSON.stringify([transaction]));
            localStorage.setItem('barang', JSON.stringify(barang));
            
            const result = service.deleteClosedTransaction(transaction.id, deletionData);
            expect(result.success).toBe(true);
        }
        
        // Try 6th deletion - should succeed but with warning
        const shift6 = {
            id: 'shift-6',
            tanggalTutup: new Date().toISOString(),
            totalPenjualan: 100000,
            totalKas: 100000,
            kasir: 'kasir1'
        };
        
        const transaction6 = {
            id: 'trans-6',
            noTransaksi: 'TRX-6',
            tanggal: new Date().toISOString(),
            total: 10000,
            metode: 'cash',
            kasir: 'kasir1',
            items: [
                { id: 'item-6', nama: 'Item 6', qty: 1, harga: 10000, hpp: 5000 }
            ]
        };
        
        const barang6 = [
            { id: 'item-6', nama: 'Item 6', stok: 100, harga: 10000 }
        ];
        
        localStorage.setItem('riwayatTutupKas', JSON.stringify([shift6]));
        localStorage.setItem('posTransactions', JSON.stringify([transaction6]));
        localStorage.setItem('barang', JSON.stringify(barang6));
        
        const result6 = service.deleteClosedTransaction(transaction6.id, deletionData);
        
        // Verify: Deletion succeeded but with warning
        expect(result6.success).toBe(true);
        expect(result6.warnings).toBeDefined();
        expect(Array.isArray(result6.warnings)).toBe(true);
        expect(result6.warnings.length).toBeGreaterThan(0);
        expect(result6.warnings[0]).toContain('Peringatan');
        expect(result6.warnings[0]).toContain('5');
    });

    test('should block at 10 deletions', () => {
        const service = new ClosedShiftDeletionService();
        const deletionData = {
            category: 'Kesalahan Input',
            reason: 'Integration test: Rate limiting blocking at 10 deletions',
            username: 'admin',
            password: 'admin123',
            user: { username: 'admin', role: 'administrator' }
        };
        
        // Delete 10 transactions successfully
        for (let i = 0; i < 10; i++) {
            const shift = {
                id: `shift-${i}`,
                tanggalTutup: new Date().toISOString(),
                totalPenjualan: 100000,
                totalKas: 100000,
                kasir: 'kasir1'
            };
            
            const transaction = {
                id: `trans-${i}`,
                noTransaksi: `TRX-${i}`,
                tanggal: new Date().toISOString(),
                total: 10000,
                metode: 'cash',
                kasir: 'kasir1',
                items: [
                    { id: `item-${i}`, nama: `Item ${i}`, qty: 1, harga: 10000, hpp: 5000 }
                ]
            };
            
            const barang = [
                { id: `item-${i}`, nama: `Item ${i}`, stok: 100, harga: 10000 }
            ];
            
            localStorage.setItem('riwayatTutupKas', JSON.stringify([shift]));
            localStorage.setItem('posTransactions', JSON.stringify([transaction]));
            localStorage.setItem('barang', JSON.stringify(barang));
            
            const result = service.deleteClosedTransaction(transaction.id, deletionData);
            expect(result.success).toBe(true);
        }
        
        // Try 11th deletion - should be blocked
        const shift11 = {
            id: 'shift-11',
            tanggalTutup: new Date().toISOString(),
            totalPenjualan: 100000,
            totalKas: 100000,
            kasir: 'kasir1'
        };
        
        const transaction11 = {
            id: 'trans-11',
            noTransaksi: 'TRX-11',
            tanggal: new Date().toISOString(),
            total: 10000,
            metode: 'cash',
            kasir: 'kasir1',
            items: [
                { id: 'item-11', nama: 'Item 11', qty: 1, harga: 10000, hpp: 5000 }
            ]
        };
        
        const barang11 = [
            { id: 'item-11', nama: 'Item 11', stok: 100, harga: 10000 }
        ];
        
        localStorage.setItem('riwayatTutupKas', JSON.stringify([shift11]));
        localStorage.setItem('posTransactions', JSON.stringify([transaction11]));
        localStorage.setItem('barang', JSON.stringify(barang11));
        
        const result11 = service.deleteClosedTransaction(transaction11.id, deletionData);
        
        // Verify: Deletion blocked
        expect(result11.success).toBe(false);
        expect(result11.level).toBe('block');
        expect(result11.message).toContain('Batas maksimal');
        expect(result11.message).toContain('10');
        
        // Verify: Transaction still exists
        const transactions = JSON.parse(localStorage.getItem('posTransactions') || '[]');
        expect(transactions.length).toBe(1);
        expect(transactions[0].id).toBe('trans-11');
    });
});
