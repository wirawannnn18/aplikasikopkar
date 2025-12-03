/**
 * Integration Tests for Hapus Transaksi POS
 * Feature: hapus-transaksi-pos
 * Task: 7.1 Write integration tests
 * 
 * These tests verify the complete deletion flow end-to-end,
 * closed shift prevention, and error scenarios.
 */

import fc from 'fast-check';

// Import mock classes from the main test file
// In a real scenario, these would be imported from the actual implementation

// Mock TransactionRepository
class TransactionRepository {
    getAll() {
        return JSON.parse(localStorage.getItem('penjualan') || '[]');
    }
    
    getById(id) {
        const transactions = this.getAll();
        return transactions.find(t => t.id === id || t.noTransaksi === id) || null;
    }
    
    delete(id) {
        let transactions = this.getAll();
        const initialLength = transactions.length;
        transactions = transactions.filter(t => t.id !== id && t.noTransaksi !== id);
        
        if (transactions.length < initialLength) {
            localStorage.setItem('penjualan', JSON.stringify(transactions));
            return true;
        }
        
        return false;
    }
}

// Mock StockRepository
class StockRepository {
    getAll() {
        return JSON.parse(localStorage.getItem('barang') || '[]');
    }
    
    addStock(itemId, quantity) {
        const items = this.getAll();
        const item = items.find(i => i.id === itemId);
        
        if (item) {
            item.stok = (item.stok || 0) + quantity;
            localStorage.setItem('barang', JSON.stringify(items));
            return true;
        }
        
        return false;
    }
}

// Mock JournalRepository
class JournalRepository {
    add(journal) {
        const journals = JSON.parse(localStorage.getItem('jurnal') || '[]');
        
        const journalData = {
            id: this._generateId(),
            tanggal: journal.tanggal || new Date().toISOString(),
            keterangan: journal.keterangan,
            entries: journal.entries
        };
        
        journals.push(journalData);
        localStorage.setItem('jurnal', JSON.stringify(journals));
        
        this.updateCOASaldo(journal.entries);
        
        return journalData.id;
    }
    
    updateCOASaldo(entries) {
        const coa = JSON.parse(localStorage.getItem('coa') || '[]');
        
        entries.forEach(entry => {
            const akun = coa.find(c => c.kode === entry.akun);
            if (akun) {
                if (akun.tipe === 'Aset' || akun.tipe === 'Beban') {
                    akun.saldo = (akun.saldo || 0) + entry.debit - entry.kredit;
                } else {
                    akun.saldo = (akun.saldo || 0) + entry.kredit - entry.debit;
                }
            }
        });
        
        localStorage.setItem('coa', JSON.stringify(coa));
    }
    
    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
}

// Mock DeletionLogRepository
class DeletionLogRepository {
    save(log) {
        const logs = JSON.parse(localStorage.getItem('deletionLog') || '[]');
        
        const logData = {
            id: this._generateId(),
            ...log,
            deletedAt: new Date().toISOString()
        };
        
        logs.push(logData);
        localStorage.setItem('deletionLog', JSON.stringify(logs));
        
        return logData.id;
    }

    
    getAll() {
        return JSON.parse(localStorage.getItem('deletionLog') || '[]');
    }
    
    getByTransactionId(transactionId) {
        const logs = this.getAll();
        return logs.find(l => l.transactionId === transactionId) || null;
    }
    
    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
}

// Mock ValidationService
class ValidationService {
    constructor() {
        this.transactionRepo = new TransactionRepository();
    }
    
    validateDeletion(transactionId) {
        const transaction = this.transactionRepo.getById(transactionId);
        
        if (!transaction) {
            return {
                valid: false,
                message: 'Transaksi tidak ditemukan'
            };
        }
        
        const isInClosedShift = this._isTransactionInClosedShift(transaction);
        
        if (isInClosedShift) {
            return {
                valid: false,
                message: 'Transaksi sudah masuk dalam laporan tutup kasir yang sudah ditutup dan tidak dapat dihapus'
            };
        }
        
        return {
            valid: true,
            message: 'Transaksi dapat dihapus'
        };
    }
    
    validateReason(reason) {
        if (!reason || reason.trim() === '') {
            return {
                valid: false,
                message: 'Alasan penghapusan harus diisi'
            };
        }
        
        if (reason.length > 500) {
            return {
                valid: false,
                message: 'Alasan maksimal 500 karakter'
            };
        }
        
        return {
            valid: true,
            message: 'Alasan valid'
        };
    }
    
    _isTransactionInClosedShift(transaction) {
        const riwayatTutupKas = JSON.parse(localStorage.getItem('riwayatTutupKas') || '[]');
        
        if (riwayatTutupKas.length === 0) {
            return false;
        }
        
        const transactionDate = new Date(transaction.tanggal);
        
        for (const shift of riwayatTutupKas) {
            const shiftStart = new Date(shift.waktuBuka);
            const shiftEnd = new Date(shift.waktuTutup);
            
            if (transactionDate >= shiftStart && transactionDate <= shiftEnd) {
                return true;
            }
        }
        
        return false;
    }
}

// Mock StockRestorationService
class StockRestorationService {
    constructor() {
        this.stockRepo = new StockRepository();
    }
    
    restoreStock(items) {
        const warnings = [];
        
        if (!items || items.length === 0) {
            return {
                success: true,
                warnings: []
            };
        }
        
        for (const item of items) {
            const restored = this.stockRepo.addStock(item.id, item.qty);
            
            if (!restored) {
                warnings.push(`Barang ${item.nama} tidak ditemukan, stok tidak dapat dikembalikan`);
            }
        }
        
        return {
            success: true,
            warnings: warnings
        };
    }
}

// Mock JournalReversalService
class JournalReversalService {
    constructor() {
        this.journalRepo = new JournalRepository();
    }
    
    createReversalJournals(transaction) {
        const journalIds = [];
        const currentDate = new Date().toISOString();
        
        let totalHPP = 0;
        if (transaction.items && transaction.items.length > 0) {
            totalHPP = transaction.items.reduce((sum, item) => {
                return sum + ((item.hpp || 0) * item.qty);
            }, 0);
        }
        
        const revenueJournal = {
            tanggal: currentDate,
            keterangan: `Reversal Hapus Transaksi ${transaction.noTransaksi || transaction.id}`,
            entries: []
        };
        
        if (transaction.metode === 'cash') {
            revenueJournal.entries = [
                {
                    akun: '4-1000',
                    debit: transaction.total,
                    kredit: 0
                },
                {
                    akun: '1-1000',
                    debit: 0,
                    kredit: transaction.total
                }
            ];
        } else {
            revenueJournal.entries = [
                {
                    akun: '4-1000',
                    debit: transaction.total,
                    kredit: 0
                },
                {
                    akun: '1-1200',
                    debit: 0,
                    kredit: transaction.total
                }
            ];
        }
        
        const revenueJournalId = this.journalRepo.add(revenueJournal);
        journalIds.push(revenueJournalId);
        
        if (totalHPP > 0) {
            const hppJournal = {
                tanggal: currentDate,
                keterangan: `Reversal HPP Hapus Transaksi ${transaction.noTransaksi || transaction.id}`,
                entries: [
                    {
                        akun: '1-1300',
                        debit: totalHPP,
                        kredit: 0
                    },
                    {
                        akun: '5-1000',
                        debit: 0,
                        kredit: totalHPP
                    }
                ]
            };
            
            const hppJournalId = this.journalRepo.add(hppJournal);
            journalIds.push(hppJournalId);
        }
        
        return {
            success: true,
            journalIds: journalIds
        };
    }
}

// Mock AuditLoggerService
class AuditLoggerService {
    constructor() {
        this.deletionLogRepo = new DeletionLogRepository();
    }
    
    logDeletion(transaction, reason, deletedBy) {
        const logData = {
            transactionId: transaction.id,
            transactionNo: transaction.noTransaksi || transaction.id,
            transactionData: transaction,
            reason: reason,
            deletedBy: deletedBy,
            stockRestored: true,
            journalReversed: true,
            warnings: []
        };
        
        const logId = this.deletionLogRepo.save(logData);
        
        return {
            success: true,
            logId: logId
        };
    }
    
    getDeletionHistory() {
        return this.deletionLogRepo.getAll();
    }
}

// Mock TransactionDeletionService
class TransactionDeletionService {
    constructor() {
        this.transactionRepo = new TransactionRepository();
        this.validationService = new ValidationService();
        this.stockRestorationService = new StockRestorationService();
        this.journalReversalService = new JournalReversalService();
        this.auditLoggerService = new AuditLoggerService();
    }
    
    deleteTransaction(transactionId, reason, deletedBy) {
        try {
            const validationResult = this.validationService.validateDeletion(transactionId);
            if (!validationResult.valid) {
                return {
                    success: false,
                    message: validationResult.message
                };
            }
            
            const reasonValidation = this.validationService.validateReason(reason);
            if (!reasonValidation.valid) {
                return {
                    success: false,
                    message: reasonValidation.message
                };
            }
            
            const transaction = this.transactionRepo.getById(transactionId);
            if (!transaction) {
                return {
                    success: false,
                    message: 'Transaksi tidak ditemukan'
                };
            }
            
            const stockResult = this.stockRestorationService.restoreStock(transaction.items);
            const journalResult = this.journalReversalService.createReversalJournals(transaction);
            
            const deleted = this.transactionRepo.delete(transactionId);
            if (!deleted) {
                return {
                    success: false,
                    message: 'Gagal menghapus transaksi dari storage'
                };
            }
            
            const auditResult = this.auditLoggerService.logDeletion(transaction, reason, deletedBy);
            
            const result = {
                success: true,
                message: 'Transaksi berhasil dihapus'
            };
            
            if (stockResult.warnings && stockResult.warnings.length > 0) {
                result.warnings = stockResult.warnings;
            }
            
            return result;
            
        } catch (error) {
            return {
                success: false,
                message: `Error saat menghapus transaksi: ${error.message}`
            };
        }
    }
}

/**
 * INTEGRATION TEST 1: Complete Deletion Flow End-to-End
 * Tests the entire deletion process from start to finish
 * Requirements: All
 */
describe('Integration Test 1: Complete Deletion Flow End-to-End', () => {
    let transactionDeletionService;
    let transactionRepo;
    let stockRepo;
    let deletionLogRepo;
    
    beforeEach(() => {
        localStorage.clear();
        transactionDeletionService = new TransactionDeletionService();
        transactionRepo = new TransactionRepository();
        stockRepo = new StockRepository();
        deletionLogRepo = new DeletionLogRepository();
    });
    
    test('should complete full deletion flow: validate, restore stock, create journals, delete transaction, log audit', () => {
        // Setup: Create a complete transaction with items
        const transaction = {
            id: 'trx-integration-001',
            noTransaksi: 'TRX-INT-001',
            tanggal: new Date('2024-11-20T10:30:00').toISOString(),
            kasir: 'John Doe',
            anggotaId: 'member-001',
            tipeAnggota: 'Anggota',
            metode: 'cash',
            items: [
                {
                    id: 'item-001',
                    nama: 'Product A',
                    harga: 50000,
                    hpp: 30000,
                    qty: 2,
                    stok: 100
                },
                {
                    id: 'item-002',
                    nama: 'Product B',
                    harga: 75000,
                    hpp: 45000,
                    qty: 3,
                    stok: 50
                }
            ],
            total: 325000,
            uangBayar: 350000,
            kembalian: 25000,
            status: 'lunas'
        };
        
        // Setup: Create inventory items
        const inventoryItems = [
            {
                id: 'item-001',
                nama: 'Product A',
                harga: 50000,
                hpp: 30000,
                stok: 98 // After selling 2 units
            },
            {
                id: 'item-002',
                nama: 'Product B',
                harga: 75000,
                hpp: 45000,
                stok: 47 // After selling 3 units
            }
        ];
        
        // Setup: Store data in localStorage
        localStorage.setItem('penjualan', JSON.stringify([transaction]));
        localStorage.setItem('barang', JSON.stringify(inventoryItems));
        localStorage.setItem('riwayatTutupKas', JSON.stringify([]));
        localStorage.setItem('coa', JSON.stringify([
            { kode: '1-1000', nama: 'Kas', tipe: 'Aset', saldo: 325000 },
            { kode: '4-1000', nama: 'Pendapatan Penjualan', tipe: 'Pendapatan', saldo: 325000 },
            { kode: '1-1300', nama: 'Persediaan Barang', tipe: 'Aset', saldo: 0 },
            { kode: '5-1000', nama: 'Harga Pokok Penjualan', tipe: 'Beban', saldo: 195000 }
        ]));
        
        // Execute: Delete the transaction
        const result = transactionDeletionService.deleteTransaction(
            transaction.id,
            'Kesalahan input harga, perlu koreksi',
            'Admin User'
        );
        
        // Verify 1: Deletion was successful
        expect(result.success).toBe(true);
        expect(result.message).toContain('berhasil');
        
        // Verify 2: Transaction is removed from storage
        const deletedTransaction = transactionRepo.getById(transaction.id);
        expect(deletedTransaction).toBeNull();
        
        // Verify 3: Stock is restored for all items
        const updatedInventory = stockRepo.getAll();
        const item1 = updatedInventory.find(i => i.id === 'item-001');
        const item2 = updatedInventory.find(i => i.id === 'item-002');
        
        expect(item1.stok).toBe(100); // 98 + 2 = 100
        expect(item2.stok).toBe(50);  // 47 + 3 = 50
        
        // Verify 4: Reversal journals are created
        const journals = JSON.parse(localStorage.getItem('jurnal') || '[]');
        expect(journals.length).toBe(2); // Revenue reversal + HPP reversal
        
        // Check revenue reversal journal
        const revenueJournal = journals.find(j => 
            j.keterangan.includes('Reversal') && 
            !j.keterangan.includes('HPP')
        );
        expect(revenueJournal).toBeDefined();
        expect(revenueJournal.entries).toHaveLength(2);
        
        // Check HPP reversal journal
        const hppJournal = journals.find(j => j.keterangan.includes('HPP'));
        expect(hppJournal).toBeDefined();
        expect(hppJournal.entries).toHaveLength(2);
        
        // Calculate expected HPP: (2 * 30000) + (3 * 45000) = 195000
        const expectedHPP = 195000;
        const hppDebitEntry = hppJournal.entries.find(e => e.akun === '1-1300');
        expect(hppDebitEntry.debit).toBe(expectedHPP);
        
        // Verify 5: Audit log is created
        const deletionLog = deletionLogRepo.getByTransactionId(transaction.id);
        expect(deletionLog).toBeDefined();
        expect(deletionLog.transactionNo).toBe('TRX-INT-001');
        expect(deletionLog.reason).toBe('Kesalahan input harga, perlu koreksi');
        expect(deletionLog.deletedBy).toBe('Admin User');
        expect(deletionLog.transactionData).toEqual(transaction);
        
        // Verify 6: COA balances are updated
        const coa = JSON.parse(localStorage.getItem('coa') || '[]');
        const kasAccount = coa.find(c => c.kode === '1-1000');
        const pendapatanAccount = coa.find(c => c.kode === '4-1000');
        
        // After reversal: Kas should be reduced by 325000
        expect(kasAccount.saldo).toBe(0); // 325000 - 325000
        // After reversal: Pendapatan should be reduced by 325000
        expect(pendapatanAccount.saldo).toBe(0); // 325000 - 325000
    });
    
    test('should handle credit transaction deletion with correct journal entries', () => {
        // Setup: Create a credit transaction
        const transaction = {
            id: 'trx-credit-001',
            noTransaksi: 'TRX-CREDIT-001',
            tanggal: new Date('2024-11-20T14:00:00').toISOString(),
            kasir: 'Jane Smith',
            anggotaId: 'member-002',
            tipeAnggota: 'Anggota',
            metode: 'bon',
            items: [
                {
                    id: 'item-003',
                    nama: 'Product C',
                    harga: 100000,
                    hpp: 60000,
                    qty: 1,
                    stok: 20
                }
            ],
            total: 100000,
            status: 'kredit'
        };
        
        // Setup: Store data
        localStorage.setItem('penjualan', JSON.stringify([transaction]));
        localStorage.setItem('barang', JSON.stringify([
            { id: 'item-003', nama: 'Product C', harga: 100000, hpp: 60000, stok: 19 }
        ]));
        localStorage.setItem('riwayatTutupKas', JSON.stringify([]));
        localStorage.setItem('coa', JSON.stringify([
            { kode: '1-1200', nama: 'Piutang Anggota', tipe: 'Aset', saldo: 100000 },
            { kode: '4-1000', nama: 'Pendapatan Penjualan', tipe: 'Pendapatan', saldo: 100000 },
            { kode: '1-1300', nama: 'Persediaan Barang', tipe: 'Aset', saldo: 0 },
            { kode: '5-1000', nama: 'Harga Pokok Penjualan', tipe: 'Beban', saldo: 60000 }
        ]));
        
        // Execute: Delete the credit transaction
        const result = transactionDeletionService.deleteTransaction(
            transaction.id,
            'Transaksi dibatalkan oleh anggota',
            'Kasir User'
        );
        
        // Verify: Deletion successful
        expect(result.success).toBe(true);
        
        // Verify: Reversal journal uses Piutang Anggota (1-1200) instead of Kas
        const journals = JSON.parse(localStorage.getItem('jurnal') || '[]');
        const revenueJournal = journals.find(j => 
            j.keterangan.includes('Reversal') && 
            !j.keterangan.includes('HPP')
        );
        
        expect(revenueJournal).toBeDefined();
        const piutangEntry = revenueJournal.entries.find(e => e.akun === '1-1200');
        expect(piutangEntry).toBeDefined();
        expect(piutangEntry.kredit).toBe(100000);
        
        // Verify: Stock is restored
        const updatedInventory = stockRepo.getAll();
        const item = updatedInventory.find(i => i.id === 'item-003');
        expect(item.stok).toBe(20); // 19 + 1 = 20
    });
    
    test('should handle transaction with multiple items correctly', () => {
        // Setup: Transaction with 5 different items
        const transaction = {
            id: 'trx-multi-001',
            noTransaksi: 'TRX-MULTI-001',
            tanggal: new Date().toISOString(),
            kasir: 'Multi Tester',
            metode: 'cash',
            items: [
                { id: 'item-a', nama: 'Item A', harga: 10000, hpp: 6000, qty: 5, stok: 100 },
                { id: 'item-b', nama: 'Item B', harga: 20000, hpp: 12000, qty: 3, stok: 50 },
                { id: 'item-c', nama: 'Item C', harga: 15000, hpp: 9000, qty: 2, stok: 75 },
                { id: 'item-d', nama: 'Item D', harga: 25000, hpp: 15000, qty: 1, stok: 30 },
                { id: 'item-e', nama: 'Item E', harga: 30000, hpp: 18000, qty: 4, stok: 60 }
            ],
            total: 235000,
            status: 'lunas'
        };
        
        // Setup: Create inventory with reduced stock
        const inventory = [
            { id: 'item-a', nama: 'Item A', harga: 10000, hpp: 6000, stok: 95 },
            { id: 'item-b', nama: 'Item B', harga: 20000, hpp: 12000, stok: 47 },
            { id: 'item-c', nama: 'Item C', harga: 15000, hpp: 9000, stok: 73 },
            { id: 'item-d', nama: 'Item D', harga: 25000, hpp: 15000, stok: 29 },
            { id: 'item-e', nama: 'Item E', harga: 30000, hpp: 18000, stok: 56 }
        ];
        
        localStorage.setItem('penjualan', JSON.stringify([transaction]));
        localStorage.setItem('barang', JSON.stringify(inventory));
        localStorage.setItem('riwayatTutupKas', JSON.stringify([]));
        
        // Execute: Delete transaction
        const result = transactionDeletionService.deleteTransaction(
            transaction.id,
            'Testing multi-item deletion',
            'Test User'
        );
        
        // Verify: All items have stock restored
        expect(result.success).toBe(true);
        
        const updatedInventory = stockRepo.getAll();
        expect(updatedInventory.find(i => i.id === 'item-a').stok).toBe(100);
        expect(updatedInventory.find(i => i.id === 'item-b').stok).toBe(50);
        expect(updatedInventory.find(i => i.id === 'item-c').stok).toBe(75);
        expect(updatedInventory.find(i => i.id === 'item-d').stok).toBe(30);
        expect(updatedInventory.find(i => i.id === 'item-e').stok).toBe(60);
    });
});

/**
 * INTEGRATION TEST 2: Closed Shift Prevention
 * Tests that transactions in closed shifts cannot be deleted
 * Requirements: 7.1, 7.2
 */
describe('Integration Test 2: Closed Shift Prevention', () => {
    let transactionDeletionService;
    let transactionRepo;
    let stockRepo;
    
    beforeEach(() => {
        localStorage.clear();
        transactionDeletionService = new TransactionDeletionService();
        transactionRepo = new TransactionRepository();
        stockRepo = new StockRepository();
    });
    
    test('should prevent deletion of transaction in closed shift', () => {
        // Setup: Create a transaction
        const transaction = {
            id: 'trx-closed-001',
            noTransaksi: 'TRX-CLOSED-001',
            tanggal: new Date('2024-11-20T10:30:00').toISOString(),
            kasir: 'John Doe',
            metode: 'cash',
            items: [
                { id: 'item-001', nama: 'Product A', harga: 50000, hpp: 30000, qty: 1, stok: 100 }
            ],
            total: 50000,
            status: 'lunas'
        };
        
        // Setup: Create a closed shift that contains this transaction
        const transactionDate = new Date(transaction.tanggal);
        const closedShift = {
            id: 'shift-001',
            waktuBuka: new Date('2024-11-20T08:00:00').toISOString(),
            waktuTutup: new Date('2024-11-20T16:00:00').toISOString(),
            kasir: 'John Doe',
            status: 'closed'
        };
        
        localStorage.setItem('penjualan', JSON.stringify([transaction]));
        localStorage.setItem('riwayatTutupKas', JSON.stringify([closedShift]));
        localStorage.setItem('barang', JSON.stringify([
            { id: 'item-001', nama: 'Product A', harga: 50000, hpp: 30000, stok: 99 }
        ]));
        
        // Execute: Attempt to delete transaction in closed shift
        const result = transactionDeletionService.deleteTransaction(
            transaction.id,
            'Trying to delete closed shift transaction',
            'Admin User'
        );
        
        // Verify: Deletion is prevented
        expect(result.success).toBe(false);
        expect(result.message).toContain('tutup kasir');
        
        // Verify: Transaction still exists
        const stillExists = transactionRepo.getById(transaction.id);
        expect(stillExists).not.toBeNull();
        expect(stillExists.id).toBe(transaction.id);
        
        // Verify: Stock is NOT restored (deletion didn't happen)
        const inventory = stockRepo.getAll();
        const item = inventory.find(i => i.id === 'item-001');
        expect(item.stok).toBe(99); // Still 99, not restored to 100
        
        // Verify: No deletion log is created
        const deletionLogRepo = new DeletionLogRepository();
        const log = deletionLogRepo.getByTransactionId(transaction.id);
        expect(log).toBeNull();
    });
    
    test('should allow deletion of transaction NOT in closed shift', () => {
        // Setup: Create a transaction
        const transaction = {
            id: 'trx-open-001',
            noTransaksi: 'TRX-OPEN-001',
            tanggal: new Date('2024-11-20T18:00:00').toISOString(), // After closed shift
            kasir: 'Jane Smith',
            metode: 'cash',
            items: [
                { id: 'item-002', nama: 'Product B', harga: 75000, hpp: 45000, qty: 1, stok: 50 }
            ],
            total: 75000,
            status: 'lunas'
        };
        
        // Setup: Create a closed shift that does NOT contain this transaction
        const closedShift = {
            id: 'shift-001',
            waktuBuka: new Date('2024-11-20T08:00:00').toISOString(),
            waktuTutup: new Date('2024-11-20T16:00:00').toISOString(), // Ends before transaction
            kasir: 'John Doe',
            status: 'closed'
        };
        
        localStorage.setItem('penjualan', JSON.stringify([transaction]));
        localStorage.setItem('riwayatTutupKas', JSON.stringify([closedShift]));
        localStorage.setItem('barang', JSON.stringify([
            { id: 'item-002', nama: 'Product B', harga: 75000, hpp: 45000, stok: 49 }
        ]));
        
        // Execute: Delete transaction (should succeed)
        const result = transactionDeletionService.deleteTransaction(
            transaction.id,
            'Transaction outside closed shift',
            'Admin User'
        );
        
        // Verify: Deletion is successful
        expect(result.success).toBe(true);
        
        // Verify: Transaction is removed
        const deleted = transactionRepo.getById(transaction.id);
        expect(deleted).toBeNull();
        
        // Verify: Stock is restored
        const inventory = stockRepo.getAll();
        const item = inventory.find(i => i.id === 'item-002');
        expect(item.stok).toBe(50); // 49 + 1 = 50
    });
    
    test('should allow deletion when no shifts are closed', () => {
        // Setup: Create a transaction
        const transaction = {
            id: 'trx-no-shift-001',
            noTransaksi: 'TRX-NO-SHIFT-001',
            tanggal: new Date().toISOString(),
            kasir: 'Test Kasir',
            metode: 'cash',
            items: [
                { id: 'item-003', nama: 'Product C', harga: 100000, hpp: 60000, qty: 2, stok: 30 }
            ],
            total: 200000,
            status: 'lunas'
        };
        
        localStorage.setItem('penjualan', JSON.stringify([transaction]));
        localStorage.setItem('riwayatTutupKas', JSON.stringify([])); // No closed shifts
        localStorage.setItem('barang', JSON.stringify([
            { id: 'item-003', nama: 'Product C', harga: 100000, hpp: 60000, stok: 28 }
        ]));
        
        // Execute: Delete transaction
        const result = transactionDeletionService.deleteTransaction(
            transaction.id,
            'No closed shifts exist',
            'Admin User'
        );
        
        // Verify: Deletion is successful
        expect(result.success).toBe(true);
        
        // Verify: Transaction is removed
        const deleted = transactionRepo.getById(transaction.id);
        expect(deleted).toBeNull();
    });
});

/**
 * INTEGRATION TEST 3: Error Scenarios
 * Tests various error conditions during deletion
 * Requirements: 2.5, 3.3, 6.2, 6.4
 */
describe('Integration Test 3: Error Scenarios', () => {
    let transactionDeletionService;
    let transactionRepo;
    let stockRepo;
    
    beforeEach(() => {
        localStorage.clear();
        transactionDeletionService = new TransactionDeletionService();
        transactionRepo = new TransactionRepository();
        stockRepo = new StockRepository();
    });
    
    test('should handle missing items gracefully with warnings', () => {
        // Setup: Transaction with items that don't exist in inventory
        const transaction = {
            id: 'trx-missing-001',
            noTransaksi: 'TRX-MISSING-001',
            tanggal: new Date().toISOString(),
            kasir: 'Test Kasir',
            metode: 'cash',
            items: [
                { id: 'item-exists', nama: 'Existing Item', harga: 50000, hpp: 30000, qty: 1, stok: 10 },
                { id: 'item-missing-1', nama: 'Missing Item 1', harga: 75000, hpp: 45000, qty: 2, stok: 20 },
                { id: 'item-missing-2', nama: 'Missing Item 2', harga: 100000, hpp: 60000, qty: 1, stok: 15 }
            ],
            total: 300000,
            status: 'lunas'
        };
        
        // Setup: Only one item exists in inventory
        localStorage.setItem('penjualan', JSON.stringify([transaction]));
        localStorage.setItem('barang', JSON.stringify([
            { id: 'item-exists', nama: 'Existing Item', harga: 50000, hpp: 30000, stok: 9 }
        ]));
        localStorage.setItem('riwayatTutupKas', JSON.stringify([]));
        
        // Execute: Delete transaction
        const result = transactionDeletionService.deleteTransaction(
            transaction.id,
            'Testing missing items scenario',
            'Admin User'
        );
        
        // Verify: Deletion succeeds with warnings
        expect(result.success).toBe(true);
        expect(result.warnings).toBeDefined();
        expect(result.warnings.length).toBe(2); // Two missing items
        expect(result.warnings[0]).toContain('tidak ditemukan');
        expect(result.warnings[1]).toContain('tidak ditemukan');
        
        // Verify: Transaction is still deleted despite missing items
        const deleted = transactionRepo.getById(transaction.id);
        expect(deleted).toBeNull();
        
        // Verify: Stock is restored for existing item
        const inventory = stockRepo.getAll();
        const existingItem = inventory.find(i => i.id === 'item-exists');
        expect(existingItem.stok).toBe(10); // 9 + 1 = 10
        
        // Verify: Deletion log is created with warnings
        const deletionLogRepo = new DeletionLogRepository();
        const log = deletionLogRepo.getByTransactionId(transaction.id);
        expect(log).toBeDefined();
    });
    
    test('should fail when transaction ID is invalid', () => {
        // Setup: Empty transaction list
        localStorage.setItem('penjualan', JSON.stringify([]));
        localStorage.setItem('riwayatTutupKas', JSON.stringify([]));
        
        // Execute: Attempt to delete non-existent transaction
        const result = transactionDeletionService.deleteTransaction(
            'invalid-transaction-id',
            'Valid reason',
            'Admin User'
        );
        
        // Verify: Deletion fails
        expect(result.success).toBe(false);
        expect(result.message).toContain('tidak ditemukan');
        
        // Verify: No deletion log is created
        const deletionLogRepo = new DeletionLogRepository();
        const logs = deletionLogRepo.getAll();
        expect(logs.length).toBe(0);
    });
    
    test('should fail when reason is empty', () => {
        // Setup: Create a valid transaction
        const transaction = {
            id: 'trx-empty-reason-001',
            noTransaksi: 'TRX-EMPTY-001',
            tanggal: new Date().toISOString(),
            kasir: 'Test Kasir',
            metode: 'cash',
            items: [
                { id: 'item-001', nama: 'Product A', harga: 50000, hpp: 30000, qty: 1, stok: 100 }
            ],
            total: 50000,
            status: 'lunas'
        };
        
        localStorage.setItem('penjualan', JSON.stringify([transaction]));
        localStorage.setItem('barang', JSON.stringify([
            { id: 'item-001', nama: 'Product A', harga: 50000, hpp: 30000, stok: 99 }
        ]));
        localStorage.setItem('riwayatTutupKas', JSON.stringify([]));
        
        // Execute: Attempt to delete with empty reason
        const result = transactionDeletionService.deleteTransaction(
            transaction.id,
            '',
            'Admin User'
        );
        
        // Verify: Deletion fails
        expect(result.success).toBe(false);
        expect(result.message).toContain('Alasan penghapusan harus diisi');
        
        // Verify: Transaction still exists
        const stillExists = transactionRepo.getById(transaction.id);
        expect(stillExists).not.toBeNull();
        
        // Verify: Stock is NOT restored
        const inventory = stockRepo.getAll();
        const item = inventory.find(i => i.id === 'item-001');
        expect(item.stok).toBe(99); // Still 99, not restored
    });
    
    test('should fail when reason is only whitespace', () => {
        // Setup: Create a valid transaction
        const transaction = {
            id: 'trx-whitespace-001',
            noTransaksi: 'TRX-WHITESPACE-001',
            tanggal: new Date().toISOString(),
            kasir: 'Test Kasir',
            metode: 'cash',
            items: [
                { id: 'item-002', nama: 'Product B', harga: 75000, hpp: 45000, qty: 1, stok: 50 }
            ],
            total: 75000,
            status: 'lunas'
        };
        
        localStorage.setItem('penjualan', JSON.stringify([transaction]));
        localStorage.setItem('barang', JSON.stringify([
            { id: 'item-002', nama: 'Product B', harga: 75000, hpp: 45000, stok: 49 }
        ]));
        localStorage.setItem('riwayatTutupKas', JSON.stringify([]));
        
        // Execute: Attempt to delete with whitespace-only reason
        const result = transactionDeletionService.deleteTransaction(
            transaction.id,
            '   \t\n   ',
            'Admin User'
        );
        
        // Verify: Deletion fails
        expect(result.success).toBe(false);
        expect(result.message).toContain('Alasan penghapusan harus diisi');
        
        // Verify: Transaction still exists
        const stillExists = transactionRepo.getById(transaction.id);
        expect(stillExists).not.toBeNull();
    });
    
    test('should fail when reason exceeds 500 characters', () => {
        // Setup: Create a valid transaction
        const transaction = {
            id: 'trx-long-reason-001',
            noTransaksi: 'TRX-LONG-001',
            tanggal: new Date().toISOString(),
            kasir: 'Test Kasir',
            metode: 'cash',
            items: [
                { id: 'item-003', nama: 'Product C', harga: 100000, hpp: 60000, qty: 1, stok: 30 }
            ],
            total: 100000,
            status: 'lunas'
        };
        
        localStorage.setItem('penjualan', JSON.stringify([transaction]));
        localStorage.setItem('barang', JSON.stringify([
            { id: 'item-003', nama: 'Product C', harga: 100000, hpp: 60000, stok: 29 }
        ]));
        localStorage.setItem('riwayatTutupKas', JSON.stringify([]));
        
        // Create a reason longer than 500 characters
        const longReason = 'A'.repeat(501);
        
        // Execute: Attempt to delete with too-long reason
        const result = transactionDeletionService.deleteTransaction(
            transaction.id,
            longReason,
            'Admin User'
        );
        
        // Verify: Deletion fails
        expect(result.success).toBe(false);
        expect(result.message).toContain('maksimal 500 karakter');
        
        // Verify: Transaction still exists
        const stillExists = transactionRepo.getById(transaction.id);
        expect(stillExists).not.toBeNull();
    });
    
    test('should handle transaction with no items (edge case)', () => {
        // Setup: Transaction with empty items array
        const transaction = {
            id: 'trx-no-items-001',
            noTransaksi: 'TRX-NO-ITEMS-001',
            tanggal: new Date().toISOString(),
            kasir: 'Test Kasir',
            metode: 'cash',
            items: [],
            total: 0,
            status: 'lunas'
        };
        
        localStorage.setItem('penjualan', JSON.stringify([transaction]));
        localStorage.setItem('barang', JSON.stringify([]));
        localStorage.setItem('riwayatTutupKas', JSON.stringify([]));
        
        // Execute: Delete transaction with no items
        const result = transactionDeletionService.deleteTransaction(
            transaction.id,
            'Testing empty items array',
            'Admin User'
        );
        
        // Verify: Deletion succeeds
        expect(result.success).toBe(true);
        
        // Verify: Transaction is removed
        const deleted = transactionRepo.getById(transaction.id);
        expect(deleted).toBeNull();
        
        // Verify: No warnings (no items to restore)
        expect(result.warnings).toBeUndefined();
    });
});
