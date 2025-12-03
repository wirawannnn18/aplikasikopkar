/**
 * Property-Based Tests for Rate Limiting
 * Task 5.2: Write property test for rate limiting
 * 
 * Properties tested:
 * - Property 20: Rate limit warning at 5 deletions
 * - Property 21: Rate limit blocking at 10 deletions
 * 
 * Validates: Requirements 10.2, 10.3, 10.4
 */

import fc from 'fast-check';

// Import the module under test
import '../js/hapusTransaksiTutupKasir.js';

// Get services from global scope
const RateLimiterService = global.RateLimiterService || window.RateLimiterService;
const ClosedShiftDeletionService = global.ClosedShiftDeletionService || window.ClosedShiftDeletionService;

describe('Hapus Transaksi Tutup Kasir - Rate Limiting', () => {
    
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        
        // Setup test users
        const users = [
            { id: 1, username: 'admin', password: 'admin123', role: 'administrator', name: 'Admin User' }
        ];
        localStorage.setItem('users', JSON.stringify(users));
        
        // Setup COA
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
     * Property 20: Rate limit warning at 5 deletions
     * Feature: hapus-transaksi-tutup-kasir, Property 20: Rate limit warning at 5 deletions
     * Validates: Requirements 10.2, 10.3
     * 
     * For any user who has deleted 5 closed transactions in one day,
     * the system should display a warning on the next deletion attempt
     */
    describe('Property 20: Rate limit warning at 5 deletions', () => {
        test('should show warning at 5 deletions', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 3, maxLength: 20 }),
                    (username) => {
                        // Clear rate limit tracking
                        localStorage.removeItem('rateLimitTracking');
                        
                        const service = new RateLimiterService();
                        
                        // Record exactly 5 deletions
                        for (let i = 0; i < 5; i++) {
                            service.recordDeletion(username, `trans-${i}`, `audit-${i}`);
                        }
                        
                        // Check rate limit
                        const result = service.checkRateLimit(username);
                        
                        // Property: Should be allowed but with warning
                        expect(result.allowed).toBe(true);
                        expect(result.level).toBe('warning');
                        expect(result.count).toBe(5);
                        expect(result.message).toContain('Peringatan');
                        expect(result.message).toContain('5');
                    }
                ),
                { numRuns: 100 }
            );
        });
        
        test('should show warning for any count >= 5 and < 10', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 5, max: 9 }),
                    fc.string({ minLength: 3, maxLength: 20 }),
                    (deletionCount, username) => {
                        // Clear rate limit tracking
                        localStorage.removeItem('rateLimitTracking');
                        
                        const service = new RateLimiterService();
                        
                        // Record N deletions (5-9)
                        for (let i = 0; i < deletionCount; i++) {
                            service.recordDeletion(username, `trans-${i}`, `audit-${i}`);
                        }
                        
                        // Check rate limit
                        const result = service.checkRateLimit(username);
                        
                        // Property: Should be allowed but with warning
                        expect(result.allowed).toBe(true);
                        expect(result.level).toBe('warning');
                        expect(result.count).toBe(deletionCount);
                        expect(result.message).toContain('Peringatan');
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should not show warning for less than 5 deletions', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 4 }),
                    fc.string({ minLength: 3, maxLength: 20 }),
                    (deletionCount, username) => {
                        // Clear rate limit tracking
                        localStorage.removeItem('rateLimitTracking');
                        
                        const service = new RateLimiterService();
                        
                        // Record N deletions (0-4)
                        for (let i = 0; i < deletionCount; i++) {
                            service.recordDeletion(username, `trans-${i}`, `audit-${i}`);
                        }
                        
                        // Check rate limit
                        const result = service.checkRateLimit(username);
                        
                        // Property: Should be allowed without warning
                        expect(result.allowed).toBe(true);
                        expect(result.level).toBe('ok');
                        expect(result.count).toBe(deletionCount);
                    }
                ),
                { numRuns: 100 }
            );
        });
        
        test('should include warning in deletion result', () => {
            // Setup: Create transactions and shifts
            const transactions = [];
            const shifts = [];
            const barang = [];
            
            for (let i = 0; i < 6; i++) {
                const transaction = {
                    id: `trans-${i}`,
                    noTransaksi: `TRX-${i}`,
                    tanggal: new Date().toISOString(),
                    total: 50000,
                    metode: 'cash',
                    kasir: 'kasir1',
                    items: [
                        { id: `item-${i}`, nama: `Item ${i}`, qty: 1, harga: 50000, hpp: 25000 }
                    ]
                };
                transactions.push(transaction);
                
                const shift = {
                    id: `shift-${i}`,
                    tanggalTutup: transaction.tanggal,
                    totalPenjualan: 1000000,
                    totalKas: 800000,
                    kasir: 'kasir1'
                };
                shifts.push(shift);
                
                barang.push({
                    id: `item-${i}`,
                    nama: `Item ${i}`,
                    stok: 100,
                    harga: 50000
                });
            }
            
            localStorage.setItem('riwayatTutupKas', JSON.stringify(shifts));
            localStorage.setItem('barang', JSON.stringify(barang));
            
            const service = new ClosedShiftDeletionService();
            const deletionData = {
                category: 'Kesalahan Input',
                reason: 'Test rate limit warning in deletion result',
                username: 'admin',
                password: 'admin123',
                user: { username: 'admin', role: 'administrator' }
            };
            
            // Delete 6 transactions
            for (let i = 0; i < 6; i++) {
                localStorage.setItem('posTransactions', JSON.stringify([transactions[i]]));
                const result = service.deleteClosedTransaction(transactions[i].id, deletionData);
                
                if (i === 5) {
                    // Property: 6th deletion should include warning (after 5 previous deletions)
                    expect(result.success).toBe(true);
                    expect(result.warnings).toBeDefined();
                    expect(Array.isArray(result.warnings)).toBe(true);
                    expect(result.warnings.length).toBeGreaterThan(0);
                    expect(result.warnings[0]).toContain('Peringatan');
                }
            }
        });
    });

    /**
     * Property 21: Rate limit blocking at 10 deletions
     * Feature: hapus-transaksi-tutup-kasir, Property 21: Rate limit blocking at 10 deletions
     * Validates: Requirements 10.4
     * 
     * For any user who has deleted 10 closed transactions in one day,
     * the system should block further deletions and log to system
     */
    describe('Property 21: Rate limit blocking at 10 deletions', () => {
        test('should block at 10 deletions', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 3, maxLength: 20 }),
                    (username) => {
                        // Clear rate limit tracking
                        localStorage.removeItem('rateLimitTracking');
                        
                        const service = new RateLimiterService();
                        
                        // Record exactly 10 deletions
                        for (let i = 0; i < 10; i++) {
                            service.recordDeletion(username, `trans-${i}`, `audit-${i}`);
                        }
                        
                        // Check rate limit
                        const result = service.checkRateLimit(username);
                        
                        // Property: Should be blocked
                        expect(result.allowed).toBe(false);
                        expect(result.level).toBe('block');
                        expect(result.count).toBe(10);
                        expect(result.message).toContain('Batas maksimal');
                        expect(result.message).toContain('10');
                    }
                ),
                { numRuns: 100 }
            );
        });
        
        test('should block for any count >= 10', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 10, max: 20 }),
                    fc.string({ minLength: 3, maxLength: 20 }),
                    (deletionCount, username) => {
                        // Clear rate limit tracking
                        localStorage.removeItem('rateLimitTracking');
                        
                        const service = new RateLimiterService();
                        
                        // Record N deletions (10+)
                        for (let i = 0; i < deletionCount; i++) {
                            service.recordDeletion(username, `trans-${i}`, `audit-${i}`);
                        }
                        
                        // Check rate limit
                        const result = service.checkRateLimit(username);
                        
                        // Property: Should be blocked
                        expect(result.allowed).toBe(false);
                        expect(result.level).toBe('block');
                        expect(result.count).toBe(deletionCount);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should prevent deletion when rate limit reached', () => {
            // Setup: Create 10 transactions and shifts
            const transactions = [];
            const shifts = [];
            const barang = [];
            
            for (let i = 0; i < 11; i++) {
                const transaction = {
                    id: `trans-${i}`,
                    noTransaksi: `TRX-${i}`,
                    tanggal: new Date().toISOString(),
                    total: 50000,
                    metode: 'cash',
                    kasir: 'kasir1',
                    items: [
                        { id: `item-${i}`, nama: `Item ${i}`, qty: 1, harga: 50000, hpp: 25000 }
                    ]
                };
                transactions.push(transaction);
                
                const shift = {
                    id: `shift-${i}`,
                    tanggalTutup: transaction.tanggal,
                    totalPenjualan: 1000000,
                    totalKas: 800000,
                    kasir: 'kasir1'
                };
                shifts.push(shift);
                
                barang.push({
                    id: `item-${i}`,
                    nama: `Item ${i}`,
                    stok: 100,
                    harga: 50000
                });
            }
            
            localStorage.setItem('riwayatTutupKas', JSON.stringify(shifts));
            localStorage.setItem('barang', JSON.stringify(barang));
            
            const service = new ClosedShiftDeletionService();
            const deletionData = {
                category: 'Kesalahan Input',
                reason: 'Test rate limit blocking prevents deletion',
                username: 'admin',
                password: 'admin123',
                user: { username: 'admin', role: 'administrator' }
            };
            
            // Delete 10 transactions successfully
            for (let i = 0; i < 10; i++) {
                localStorage.setItem('posTransactions', JSON.stringify([transactions[i]]));
                const result = service.deleteClosedTransaction(transactions[i].id, deletionData);
                expect(result.success).toBe(true);
            }
            
            // Try to delete 11th transaction - should be blocked
            localStorage.setItem('posTransactions', JSON.stringify([transactions[10]]));
            const result = service.deleteClosedTransaction(transactions[10].id, deletionData);
            
            // Property: 11th deletion should be blocked
            expect(result.success).toBe(false);
            expect(result.message).toContain('Batas maksimal');
            expect(result.level).toBe('block');
            
            // Property: Transaction should still exist (not deleted)
            const remainingTransactions = JSON.parse(localStorage.getItem('posTransactions') || '[]');
            expect(remainingTransactions.length).toBe(1);
            expect(remainingTransactions[0].id).toBe(transactions[10].id);
        });
        
        test('should track deletions only for current day', () => {
            const service = new RateLimiterService();
            
            // Simulate old deletions (more than 30 days ago)
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 31);
            
            const tracking = {
                'admin': {
                    deletions: [
                        {
                            timestamp: oldDate.toISOString(),
                            transactionId: 'old-trans-1',
                            auditId: 'old-audit-1'
                        }
                    ]
                }
            };
            localStorage.setItem('rateLimitTracking', JSON.stringify(tracking));
            
            // Record new deletion
            service.recordDeletion('admin', 'new-trans-1', 'new-audit-1');
            
            // Check rate limit
            const result = service.checkRateLimit('admin');
            
            // Property: Old deletions should not count
            expect(result.count).toBe(1); // Only today's deletion
            expect(result.level).toBe('ok');
        });
        
        test('should track deletions independently per user', () => {
            fc.assert(
                fc.property(
                    fc.tuple(
                        fc.string({ minLength: 3, maxLength: 20 }),
                        fc.string({ minLength: 3, maxLength: 20 })
                    ).filter(([user1, user2]) => user1 !== user2),
                    fc.integer({ min: 5, max: 9 }),
                    fc.integer({ min: 10, max: 15 }),
                    ([user1, user2], count1, count2) => {
                        // Clear rate limit tracking
                        localStorage.removeItem('rateLimitTracking');
                        
                        const service = new RateLimiterService();
                        
                        // Record deletions for user1
                        for (let i = 0; i < count1; i++) {
                            service.recordDeletion(user1, `trans-${i}`, `audit-${i}`);
                        }
                        
                        // Record deletions for user2
                        for (let i = 0; i < count2; i++) {
                            service.recordDeletion(user2, `trans-${i}`, `audit-${i}`);
                        }
                        
                        // Check rate limits
                        const result1 = service.checkRateLimit(user1);
                        const result2 = service.checkRateLimit(user2);
                        
                        // Property: Each user should have independent limits
                        expect(result1.count).toBe(count1);
                        expect(result2.count).toBe(count2);
                        
                        // Property: User1 should be at warning level
                        expect(result1.level).toBe('warning');
                        expect(result1.allowed).toBe(true);
                        
                        // Property: User2 should be blocked
                        expect(result2.level).toBe('block');
                        expect(result2.allowed).toBe(false);
                    }
                ),
                { numRuns: 50 }
            );
        });
    });
});
