/**
 * Property-Based Tests for Journal Reversal with Special Tag
 * Task 5.1: Write property test for journal reversal with special tag
 * 
 * Properties tested:
 * - Property 7: Reversal journal with special tag
 * - Property 8: Reversal journal date correctness
 * - Property 9: Cash transaction reversal for closed shift
 * - Property 10: Credit transaction reversal for closed shift
 * - Property 11: HPP reversal for closed shift
 * 
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import fc from 'fast-check';

// Import the module under test
import '../js/hapusTransaksiTutupKasir.js';

// Get ClosedShiftDeletionService from global scope
const ClosedShiftDeletionService = global.ClosedShiftDeletionService || window.ClosedShiftDeletionService;

describe('Hapus Transaksi Tutup Kasir - Journal Reversal with Special Tag', () => {
    
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        
        // Setup test users
        const users = [
            { id: 1, username: 'admin', password: 'admin123', role: 'administrator', name: 'Admin User' }
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

    /**
     * Property 7: Reversal journal with special tag
     * Feature: hapus-transaksi-tutup-kasir, Property 7: Reversal journal with special tag
     * Validates: Requirements 5.1, 5.6
     * 
     * For any closed transaction deletion, the system should create reversal journals
     * with tag "CLOSED_SHIFT_REVERSAL"
     */
    describe('Property 7: Reversal journal with special tag', () => {
        test('should create journals with CLOSED_SHIFT_REVERSAL tag', () => {
            fc.assert(
                fc.property(
                    // Generate random closed transaction
                    fc.record({
                        id: fc.string({ minLength: 5, maxLength: 20 }),
                        noTransaksi: fc.string({ minLength: 5, maxLength: 20 }),
                        tanggal: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
                        total: fc.float({ min: 100, max: 500000, noNaN: true }),
                        metode: fc.constantFrom('cash', 'bon'),
                        kasir: fc.string({ minLength: 3, maxLength: 20 }),
                        items: fc.array(
                            fc.record({
                                id: fc.string({ minLength: 3, maxLength: 20 }),
                                nama: fc.string({ minLength: 3, maxLength: 30 }),
                                qty: fc.integer({ min: 1, max: 10 }),
                                harga: fc.float({ min: 1000, max: 100000, noNaN: true }),
                                hpp: fc.float({ min: 500, max: 50000, noNaN: true })
                            }),
                            { minLength: 1, maxLength: 5 }
                        )
                    }),
                    (transaction) => {
                        // Clear state between iterations
                        localStorage.removeItem('passwordVerificationTracking');
                        localStorage.removeItem('rateLimitTracking');
                        localStorage.removeItem('closedShiftDeletionLog');
                        localStorage.removeItem('journals');
                        
                        // Setup: Create shift and save transaction
                        const shift = {
                            id: 'shift-123',
                            tanggalTutup: transaction.tanggal,
                            totalPenjualan: 1000000,
                            totalKas: 800000,
                            totalPiutang: 200000,
                            kasir: 'kasir1'
                        };
                        localStorage.setItem('riwayatTutupKas', JSON.stringify([shift]));
                        localStorage.setItem('posTransactions', JSON.stringify([transaction]));
                        
                        // Setup barang (stock)
                        const barang = transaction.items.map(item => ({
                            id: item.id,
                            nama: item.nama,
                            stok: 100,
                            harga: item.harga
                        }));
                        localStorage.setItem('barang', JSON.stringify(barang));

                        // Execute: Delete closed transaction
                        const service = new ClosedShiftDeletionService();
                        const deletionData = {
                            category: 'Kesalahan Input',
                            reason: 'Test reversal journal with special tag for property testing',
                            username: 'admin',
                            password: 'admin123',
                            user: { username: 'admin', role: 'administrator' }
                        };
                        
                        const result = service.deleteClosedTransaction(transaction.id, deletionData);
                        
                        // Property: Deletion should succeed
                        expect(result.success).toBe(true);
                        
                        // Property: Journals should be created
                        const journals = JSON.parse(localStorage.getItem('journals') || '[]');
                        expect(journals.length).toBeGreaterThan(0);
                        
                        // Property: All journals should have CLOSED_SHIFT_REVERSAL tag
                        const reversalJournals = journals.filter(j => 
                            j.deskripsi && j.deskripsi.includes('Transaksi Tertutup')
                        );
                        expect(reversalJournals.length).toBeGreaterThan(0);
                        
                        reversalJournals.forEach(journal => {
                            expect(journal.tag).toBe('CLOSED_SHIFT_REVERSAL');
                        });
                        
                        // Property: Should have at least revenue reversal journal
                        const revenueJournal = reversalJournals.find(j => 
                            j.deskripsi.includes('Reversal Transaksi Tertutup') && 
                            !j.deskripsi.includes('HPP')
                        );
                        expect(revenueJournal).toBeDefined();
                        expect(revenueJournal.tag).toBe('CLOSED_SHIFT_REVERSAL');
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    /**
     * Property 8: Reversal journal date correctness
     * Feature: hapus-transaksi-tutup-kasir, Property 8: Reversal journal date correctness
     * Validates: Requirements 5.2
     * 
     * For any closed transaction deletion, the reversal journal date should be
     * the deletion date, not the original transaction date
     */
    describe('Property 8: Reversal journal date correctness', () => {
        test('should use deletion date not transaction date', () => {
            fc.assert(
                fc.property(
                    // Generate transaction with past date
                    fc.record({
                        id: fc.string({ minLength: 5, maxLength: 20 }),
                        noTransaksi: fc.string({ minLength: 5, maxLength: 20 }),
                        tanggal: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-30') }).map(d => d.toISOString()),
                        total: fc.float({ min: 100, max: 500000, noNaN: true }),
                        metode: fc.constant('cash'),
                        kasir: fc.string({ minLength: 3, maxLength: 20 }),
                        items: fc.array(
                            fc.record({
                                id: fc.string({ minLength: 3, maxLength: 20 }),
                                nama: fc.string({ minLength: 3, maxLength: 30 }),
                                qty: fc.integer({ min: 1, max: 10 }),
                                harga: fc.float({ min: 1000, max: 100000, noNaN: true }),
                                hpp: fc.float({ min: 500, max: 50000, noNaN: true })
                            }),
                            { minLength: 1, maxLength: 3 }
                        )
                    }),
                    (transaction) => {
                        // Clear state between iterations
                        localStorage.removeItem('passwordVerificationTracking');
                        localStorage.removeItem('rateLimitTracking');
                        localStorage.removeItem('closedShiftDeletionLog');
                        localStorage.removeItem('journals');
                        
                        // Setup
                        const shift = {
                            id: 'shift-123',
                            tanggalTutup: transaction.tanggal,
                            totalPenjualan: 1000000,
                            totalKas: 800000,
                            kasir: 'kasir1'
                        };
                        localStorage.setItem('riwayatTutupKas', JSON.stringify([shift]));
                        localStorage.setItem('posTransactions', JSON.stringify([transaction]));
                        
                        const barang = transaction.items.map(item => ({
                            id: item.id,
                            nama: item.nama,
                            stok: 100,
                            harga: item.harga
                        }));
                        localStorage.setItem('barang', JSON.stringify(barang));

                        // Record deletion time
                        const deletionTime = new Date();
                        
                        // Execute deletion
                        const service = new ClosedShiftDeletionService();
                        const deletionData = {
                            category: 'Kesalahan Input',
                            reason: 'Test journal date should be deletion date not transaction date',
                            username: 'admin',
                            password: 'admin123',
                            user: { username: 'admin', role: 'administrator' }
                        };
                        
                        const result = service.deleteClosedTransaction(transaction.id, deletionData);
                        
                        // Property: Deletion should succeed
                        expect(result.success).toBe(true);
                        
                        // Property: Journal dates should be close to deletion time, not transaction time
                        const journals = JSON.parse(localStorage.getItem('journals') || '[]');
                        const reversalJournals = journals.filter(j => 
                            j.tag === 'CLOSED_SHIFT_REVERSAL'
                        );
                        
                        expect(reversalJournals.length).toBeGreaterThan(0);
                        
                        reversalJournals.forEach(journal => {
                            const journalDate = new Date(journal.tanggal);
                            const transactionDate = new Date(transaction.tanggal);
                            
                            // Property: Journal date should NOT be the transaction date
                            expect(journalDate.toDateString()).not.toBe(transactionDate.toDateString());
                            
                            // Property: Journal date should be close to deletion time (within 1 minute)
                            const timeDiff = Math.abs(journalDate - deletionTime);
                            expect(timeDiff).toBeLessThan(60000); // 60 seconds
                        });
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    /**
     * Property 9: Cash transaction reversal for closed shift
     * Feature: hapus-transaksi-tutup-kasir, Property 9: Cash transaction reversal for closed shift
     * Validates: Requirements 5.3
     * 
     * For any closed cash transaction deletion, the system should create reversal journal:
     * Debit Pendapatan Penjualan, Kredit Kas
     */
    describe('Property 9: Cash transaction reversal for closed shift', () => {
        test('should create correct journal entries for cash transactions', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        id: fc.string({ minLength: 5, maxLength: 20 }),
                        noTransaksi: fc.string({ minLength: 5, maxLength: 20 }),
                        tanggal: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
                        total: fc.float({ min: 100, max: 500000, noNaN: true }),
                        metode: fc.constant('cash'),
                        kasir: fc.string({ minLength: 3, maxLength: 20 }),
                        items: fc.array(
                            fc.record({
                                id: fc.string({ minLength: 3, maxLength: 20 }),
                                nama: fc.string({ minLength: 3, maxLength: 30 }),
                                qty: fc.integer({ min: 1, max: 10 }),
                                harga: fc.float({ min: 1000, max: 100000, noNaN: true }),
                                hpp: fc.float({ min: 500, max: 50000, noNaN: true })
                            }),
                            { minLength: 1, maxLength: 3 }
                        )
                    }),
                    (transaction) => {
                        // Clear state between iterations
                        localStorage.removeItem('passwordVerificationTracking');
                        localStorage.removeItem('rateLimitTracking');
                        localStorage.removeItem('closedShiftDeletionLog');
                        localStorage.removeItem('journals');
                        
                        // Setup
                        const shift = {
                            id: 'shift-123',
                            tanggalTutup: transaction.tanggal,
                            totalPenjualan: 1000000,
                            totalKas: 800000,
                            kasir: 'kasir1'
                        };
                        localStorage.setItem('riwayatTutupKas', JSON.stringify([shift]));
                        localStorage.setItem('posTransactions', JSON.stringify([transaction]));
                        
                        const barang = transaction.items.map(item => ({
                            id: item.id,
                            nama: item.nama,
                            stok: 100,
                            harga: item.harga
                        }));
                        localStorage.setItem('barang', JSON.stringify(barang));

                        // Execute deletion
                        const service = new ClosedShiftDeletionService();
                        const deletionData = {
                            category: 'Kesalahan Input',
                            reason: 'Test cash transaction reversal journal entries for closed shift',
                            username: 'admin',
                            password: 'admin123',
                            user: { username: 'admin', role: 'administrator' }
                        };
                        
                        const result = service.deleteClosedTransaction(transaction.id, deletionData);
                        
                        // Property: Deletion should succeed
                        expect(result.success).toBe(true);
                        
                        // Property: Should find revenue reversal journal for cash
                        const journals = JSON.parse(localStorage.getItem('journals') || '[]');
                        const revenueJournal = journals.find(j => 
                            j.tag === 'CLOSED_SHIFT_REVERSAL' && 
                            j.deskripsi.includes('Reversal Transaksi Tertutup') &&
                            !j.deskripsi.includes('HPP')
                        );
                        
                        expect(revenueJournal).toBeDefined();
                        expect(revenueJournal.entries).toBeDefined();
                        expect(revenueJournal.entries.length).toBe(2);
                        
                        // Property: First entry should be Debit Pendapatan Penjualan
                        const pendapatanEntry = revenueJournal.entries.find(e => e.akun === '4-1000');
                        expect(pendapatanEntry).toBeDefined();
                        expect(pendapatanEntry.debit).toBeCloseTo(transaction.total, 2);
                        expect(pendapatanEntry.kredit).toBe(0);
                        
                        // Property: Second entry should be Kredit Kas
                        const kasEntry = revenueJournal.entries.find(e => e.akun === '1-1000');
                        expect(kasEntry).toBeDefined();
                        expect(kasEntry.debit).toBe(0);
                        expect(kasEntry.kredit).toBeCloseTo(transaction.total, 2);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    /**
     * Property 10: Credit transaction reversal for closed shift
     * Feature: hapus-transaksi-tutup-kasir, Property 10: Credit transaction reversal for closed shift
     * Validates: Requirements 5.4
     * 
     * For any closed credit transaction deletion, the system should create reversal journal:
     * Debit Pendapatan Penjualan, Kredit Piutang
     */
    describe('Property 10: Credit transaction reversal for closed shift', () => {
        test('should create correct journal entries for credit transactions', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        id: fc.string({ minLength: 5, maxLength: 20 }),
                        noTransaksi: fc.string({ minLength: 5, maxLength: 20 }),
                        tanggal: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
                        total: fc.float({ min: 100, max: 500000, noNaN: true }),
                        metode: fc.constantFrom('bon', 'kredit'),
                        kasir: fc.string({ minLength: 3, maxLength: 20 }),
                        items: fc.array(
                            fc.record({
                                id: fc.string({ minLength: 3, maxLength: 20 }),
                                nama: fc.string({ minLength: 3, maxLength: 30 }),
                                qty: fc.integer({ min: 1, max: 10 }),
                                harga: fc.float({ min: 1000, max: 100000, noNaN: true }),
                                hpp: fc.float({ min: 500, max: 50000, noNaN: true })
                            }),
                            { minLength: 1, maxLength: 3 }
                        )
                    }),
                    (transaction) => {
                        // Clear state between iterations
                        localStorage.removeItem('passwordVerificationTracking');
                        localStorage.removeItem('rateLimitTracking');
                        localStorage.removeItem('closedShiftDeletionLog');
                        localStorage.removeItem('journals');
                        
                        // Setup
                        const shift = {
                            id: 'shift-123',
                            tanggalTutup: transaction.tanggal,
                            totalPenjualan: 1000000,
                            totalPiutang: 500000,
                            kasir: 'kasir1'
                        };
                        localStorage.setItem('riwayatTutupKas', JSON.stringify([shift]));
                        localStorage.setItem('posTransactions', JSON.stringify([transaction]));
                        
                        const barang = transaction.items.map(item => ({
                            id: item.id,
                            nama: item.nama,
                            stok: 100,
                            harga: item.harga
                        }));
                        localStorage.setItem('barang', JSON.stringify(barang));

                        // Execute deletion
                        const service = new ClosedShiftDeletionService();
                        const deletionData = {
                            category: 'Kesalahan Input',
                            reason: 'Test credit transaction reversal journal entries for closed shift',
                            username: 'admin',
                            password: 'admin123',
                            user: { username: 'admin', role: 'administrator' }
                        };
                        
                        const result = service.deleteClosedTransaction(transaction.id, deletionData);
                        
                        // Property: Deletion should succeed
                        expect(result.success).toBe(true);
                        
                        // Property: Should find revenue reversal journal for credit
                        const journals = JSON.parse(localStorage.getItem('journals') || '[]');
                        const revenueJournal = journals.find(j => 
                            j.tag === 'CLOSED_SHIFT_REVERSAL' && 
                            j.deskripsi.includes('Reversal Transaksi Tertutup') &&
                            !j.deskripsi.includes('HPP')
                        );
                        
                        expect(revenueJournal).toBeDefined();
                        expect(revenueJournal.entries).toBeDefined();
                        expect(revenueJournal.entries.length).toBe(2);
                        
                        // Property: First entry should be Debit Pendapatan Penjualan
                        const pendapatanEntry = revenueJournal.entries.find(e => e.akun === '4-1000');
                        expect(pendapatanEntry).toBeDefined();
                        expect(pendapatanEntry.debit).toBeCloseTo(transaction.total, 2);
                        expect(pendapatanEntry.kredit).toBe(0);
                        
                        // Property: Second entry should be Kredit Piutang Anggota
                        const piutangEntry = revenueJournal.entries.find(e => e.akun === '1-1200');
                        expect(piutangEntry).toBeDefined();
                        expect(piutangEntry.debit).toBe(0);
                        expect(piutangEntry.kredit).toBeCloseTo(transaction.total, 2);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    /**
     * Property 11: HPP reversal for closed shift
     * Feature: hapus-transaksi-tutup-kasir, Property 11: HPP reversal for closed shift
     * Validates: Requirements 5.5
     * 
     * For any closed transaction deletion, the system should create HPP reversal journal:
     * Debit Persediaan, Kredit HPP
     */
    describe('Property 11: HPP reversal for closed shift', () => {
        test('should create HPP reversal journal entries', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        id: fc.string({ minLength: 5, maxLength: 20 }),
                        noTransaksi: fc.string({ minLength: 5, maxLength: 20 }),
                        tanggal: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
                        total: fc.float({ min: 100, max: 500000, noNaN: true }),
                        metode: fc.constantFrom('cash', 'bon'),
                        kasir: fc.string({ minLength: 3, maxLength: 20 }),
                        items: fc.array(
                            fc.record({
                                id: fc.string({ minLength: 3, maxLength: 20 }),
                                nama: fc.string({ minLength: 3, maxLength: 30 }),
                                qty: fc.integer({ min: 1, max: 10 }),
                                harga: fc.float({ min: 1000, max: 100000, noNaN: true }),
                                hpp: fc.float({ min: 500, max: 50000, noNaN: true })
                            }),
                            { minLength: 1, maxLength: 5 }
                        )
                    }),
                    (transaction) => {
                        // Clear state between iterations
                        localStorage.removeItem('passwordVerificationTracking');
                        localStorage.removeItem('rateLimitTracking');
                        localStorage.removeItem('closedShiftDeletionLog');
                        localStorage.removeItem('journals');
                        
                        // Calculate total HPP
                        const totalHPP = transaction.items.reduce((sum, item) => 
                            sum + (item.hpp * item.qty), 0
                        );
                        
                        // Setup
                        const shift = {
                            id: 'shift-123',
                            tanggalTutup: transaction.tanggal,
                            totalPenjualan: 1000000,
                            totalKas: 800000,
                            kasir: 'kasir1'
                        };
                        localStorage.setItem('riwayatTutupKas', JSON.stringify([shift]));
                        localStorage.setItem('posTransactions', JSON.stringify([transaction]));
                        
                        const barang = transaction.items.map(item => ({
                            id: item.id,
                            nama: item.nama,
                            stok: 100,
                            harga: item.harga
                        }));
                        localStorage.setItem('barang', JSON.stringify(barang));

                        // Execute deletion
                        const service = new ClosedShiftDeletionService();
                        const deletionData = {
                            category: 'Kesalahan Input',
                            reason: 'Test HPP reversal journal entries for closed shift deletion',
                            username: 'admin',
                            password: 'admin123',
                            user: { username: 'admin', role: 'administrator' }
                        };
                        
                        const result = service.deleteClosedTransaction(transaction.id, deletionData);
                        
                        // Property: Deletion should succeed
                        expect(result.success).toBe(true);
                        
                        // Property: Should find HPP reversal journal
                        const journals = JSON.parse(localStorage.getItem('journals') || '[]');
                        const hppJournal = journals.find(j => 
                            j.tag === 'CLOSED_SHIFT_REVERSAL' && 
                            j.deskripsi.includes('HPP')
                        );
                        
                        expect(hppJournal).toBeDefined();
                        expect(hppJournal.entries).toBeDefined();
                        expect(hppJournal.entries.length).toBe(2);
                        
                        // Property: First entry should be Debit Persediaan Barang
                        const persediaanEntry = hppJournal.entries.find(e => e.akun === '1-1300');
                        expect(persediaanEntry).toBeDefined();
                        expect(persediaanEntry.debit).toBeCloseTo(totalHPP, 2);
                        expect(persediaanEntry.kredit).toBe(0);
                        
                        // Property: Second entry should be Kredit HPP
                        const hppEntry = hppJournal.entries.find(e => e.akun === '5-1000');
                        expect(hppEntry).toBeDefined();
                        expect(hppEntry.debit).toBe(0);
                        expect(hppEntry.kredit).toBeCloseTo(totalHPP, 2);
                    }
                ),
                { numRuns: 100 }
            );
        });
        
        test('should not create HPP journal when HPP is zero', () => {
            const transaction = {
                id: 'trans-123',
                noTransaksi: 'TRX-123',
                tanggal: new Date().toISOString(),
                total: 50000,
                metode: 'cash',
                kasir: 'kasir1',
                items: [
                    { id: 'item-1', nama: 'Item 1', qty: 2, harga: 25000, hpp: 0 }
                ]
            };
            
            const shift = {
                id: 'shift-123',
                tanggalTutup: transaction.tanggal,
                totalPenjualan: 1000000,
                totalKas: 800000,
                kasir: 'kasir1'
            };
            localStorage.setItem('riwayatTutupKas', JSON.stringify([shift]));
            localStorage.setItem('posTransactions', JSON.stringify([transaction]));
            localStorage.setItem('barang', JSON.stringify([
                { id: 'item-1', nama: 'Item 1', stok: 100, harga: 25000 }
            ]));
            
            const service = new ClosedShiftDeletionService();
            const deletionData = {
                category: 'Kesalahan Input',
                reason: 'Test that no HPP journal is created when HPP is zero',
                username: 'admin',
                password: 'admin123',
                user: { username: 'admin', role: 'administrator' }
            };
            
            const result = service.deleteClosedTransaction(transaction.id, deletionData);
            
            expect(result.success).toBe(true);
            
            // Property: Should not create HPP journal when total HPP is 0
            const journals = JSON.parse(localStorage.getItem('journals') || '[]');
            const hppJournal = journals.find(j => 
                j.tag === 'CLOSED_SHIFT_REVERSAL' && 
                j.deskripsi.includes('HPP')
            );
            
            expect(hppJournal).toBeUndefined();
        });
    });
});
