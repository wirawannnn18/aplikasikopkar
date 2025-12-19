/**
 * Integration Tests for Import Tagihan System
 * Requirements: All requirements - Test end-to-end import workflow, payment system integration, accounting module integration
 */

// Mock localStorage
const localStorageMock = {
    data: {},
    getItem: (key) => localStorageMock.data[key] || null,
    setItem: (key, value) => {
        localStorageMock.data[key] = value;
    },
    removeItem: (key) => {
        delete localStorageMock.data[key];
    },
    clear: () => {
        localStorageMock.data = {};
    }
};

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Import components - using CommonJS exports
const { ImportTagihanManager } = require('../../js/import-tagihan/ImportTagihanManager.js');
const { PaymentSystemIntegration } = require('../../js/import-tagihan/PaymentSystemIntegration.js');
const { AccountingIntegration } = require('../../js/import-tagihan/AccountingIntegration.js');
const { BatchProcessor } = require('../../js/import-tagihan/BatchProcessor.js');
const { ValidationEngine } = require('../../js/import-tagihan/ValidationEngine.js');

describe('Import Tagihan Integration Tests', () => {
    let importManager;
    let paymentIntegration;
    let accountingIntegration;
    let batchProcessor;
    let validationEngine;

    // Sample test data
    const sampleAnggota = [
        {
            id: 'ANG001',
            nik: '001',
            nama: 'John Doe',
            status: 'Aktif',
            statusKeanggotaan: 'Aktif'
        },
        {
            id: 'ANG002',
            nik: '002',
            nama: 'Jane Smith',
            status: 'Aktif',
            statusKeanggotaan: 'Aktif'
        }
    ];

    const samplePenjualan = [
        {
            id: 'POS001',
            anggotaId: 'ANG001',
            metodePembayaran: 'Kredit',
            total: 500000
        }
    ];

    const sampleSimpanan = [
        {
            id: 'SIM001',
            anggotaId: 'ANG002',
            statusPengembalian: 'pending',
            saldo: 300000
        }
    ];

    const sampleCurrentUser = {
        id: 'USER001',
        nama: 'Test Kasir',
        role: 'kasir'
    };

    const sampleUsers = [
        {
            id: 'USER001',
            nama: 'Test Kasir',
            role: 'kasir',
            active: true
        }
    ];

    beforeEach(() => {
        // Clear localStorage mock
        localStorageMock.clear();
        jest.clearAllMocks();

        // Setup test data
        localStorage.setItem('anggota', JSON.stringify(sampleAnggota));
        localStorage.setItem('penjualan', JSON.stringify(samplePenjualan));
        localStorage.setItem('simpanan', JSON.stringify(sampleSimpanan));
        localStorage.setItem('currentUser', JSON.stringify(sampleCurrentUser));
        localStorage.setItem('users', JSON.stringify(sampleUsers));
        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([]));
        localStorage.setItem('jurnal', JSON.stringify([]));

        // Initialize components
        paymentIntegration = new PaymentSystemIntegration();
        accountingIntegration = new AccountingIntegration();
        batchProcessor = new BatchProcessor(null, null);
        validationEngine = new ValidationEngine();
        importManager = new ImportTagihanManager(null, null);
    });

    describe('Payment System Integration', () => {
        test('should integrate with existing balance calculation functions', () => {
            // Requirements: 11.1 - Ensure compatibility with existing payment processing
            
            // Test hutang balance calculation
            const hutangBalance = paymentIntegration.hitungSaldoHutang('ANG001');
            expect(hutangBalance).toBe(500000); // From sample POS transaction

            // Test piutang balance calculation
            const piutangBalance = paymentIntegration.hitungSaldoPiutang('ANG002');
            expect(piutangBalance).toBe(300000); // From sample simpanan
        });

        test('should validate anggota using existing validation logic', () => {
            // Requirements: 11.1 - Reuse existing validation and journal logic
            
            const validAnggota = paymentIntegration.validateAnggotaForHutangPiutang('ANG001');
            expect(validAnggota.valid).toBe(true);
            expect(validAnggota.anggota.nama).toBe('John Doe');

            const invalidAnggota = paymentIntegration.validateAnggotaForHutangPiutang('INVALID');
            expect(invalidAnggota.valid).toBe(false);
            expect(invalidAnggota.error).toContain('tidak ditemukan');
        });

        test('should validate payment data using existing validation', () => {
            // Requirements: 11.1 - Reuse existing validation and journal logic
            
            const validPayment = {
                anggotaId: 'ANG001',
                jenis: 'hutang',
                jumlah: 100000
            };

            const validation = paymentIntegration.validatePembayaran(validPayment);
            expect(validation.valid).toBe(true);

            const invalidPayment = {
                anggotaId: 'ANG001',
                jenis: 'hutang',
                jumlah: 600000 // Exceeds balance
            };

            const invalidValidation = paymentIntegration.validatePembayaran(invalidPayment);
            expect(invalidValidation.valid).toBe(false);
            expect(invalidValidation.message).toContain('melebihi saldo');
        });

        test('should process single payment with proper integration', async () => {
            // Requirements: 11.1 - Ensure compatibility with existing payment processing
            
            const paymentData = {
                anggotaId: 'ANG001',
                anggotaNama: 'John Doe',
                anggotaNIK: '001',
                jenis: 'hutang',
                jumlah: 100000,
                keterangan: 'Test payment',
                batchId: 'BATCH_TEST'
            };

            const transaction = await paymentIntegration.processSinglePayment(paymentData);
            
            expect(transaction).toBeDefined();
            expect(transaction.anggotaId).toBe('ANG001');
            expect(transaction.jenis).toBe('hutang');
            expect(transaction.jumlah).toBe(100000);
            expect(transaction.saldoSebelum).toBe(500000);
            expect(transaction.saldoSesudah).toBe(400000);

            // Verify transaction was saved
            const pembayaranList = JSON.parse(localStorage.getItem('pembayaranHutangPiutang'));
            expect(pembayaranList).toHaveLength(1);
            expect(pembayaranList[0].id).toBe(transaction.id);
        });
    });

    describe('Accounting Module Integration', () => {
        test('should create journal entries following existing patterns', () => {
            // Requirements: 11.2 - Ensure journal entries follow existing patterns
            
            const transaction = {
                id: 'TXN001',
                tanggal: '2024-01-15',
                anggotaNama: 'John Doe',
                jenis: 'hutang',
                jumlah: 100000,
                batchId: 'BATCH_TEST',
                kasirId: 'USER001'
            };

            const journalEntry = accountingIntegration.createJournalEntry(transaction, true);
            
            expect(journalEntry).toBeDefined();
            expect(journalEntry.keterangan).toContain('Batch Pembayaran Hutang Anggota (Import)');
            expect(journalEntry.keterangan).toContain('John Doe');
            expect(journalEntry.entries).toHaveLength(2);

            // Check double-entry bookkeeping
            const totalDebits = journalEntry.entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
            const totalCredits = journalEntry.entries.reduce((sum, entry) => sum + (entry.kredit || 0), 0);
            expect(totalDebits).toBe(totalCredits);
            expect(totalDebits).toBe(100000);

            // Verify journal was saved
            const jurnalList = JSON.parse(localStorage.getItem('jurnal'));
            expect(jurnalList).toHaveLength(1);
        });

        test('should maintain chart of accounts consistency', () => {
            // Requirements: 11.2 - Maintain chart of accounts consistency
            
            const validation = accountingIntegration.validateChartOfAccountsConsistency();
            expect(validation.valid).toBe(true);
            expect(validation.accountCount).toBeGreaterThan(0);
            expect(validation.issues).toHaveLength(0);
        });

        test('should preserve double-entry bookkeeping rules', () => {
            // Requirements: 11.2 - Preserve double-entry bookkeeping rules
            
            const hutangTransaction = {
                id: 'TXN001',
                tanggal: '2024-01-15',
                anggotaNama: 'John Doe',
                jenis: 'hutang',
                jumlah: 100000,
                kasirId: 'USER001'
            };

            const piutangTransaction = {
                id: 'TXN002',
                tanggal: '2024-01-15',
                anggotaNama: 'Jane Smith',
                jenis: 'piutang',
                jumlah: 50000,
                kasirId: 'USER001'
            };

            accountingIntegration.createJournalEntry(hutangTransaction, false);
            accountingIntegration.createJournalEntry(piutangTransaction, false);

            const stats = accountingIntegration.getJournalStatistics();
            expect(stats.isBalanced).toBe(true);
            expect(stats.totalDebitAmount).toBe(stats.totalCreditAmount);
            expect(stats.totalEntries).toBe(2);
        });

        test('should rollback journal entries correctly', () => {
            // Requirements: 11.2 - Integrate with accounting module
            
            const transaction = {
                id: 'TXN001',
                tanggal: '2024-01-15',
                anggotaNama: 'John Doe',
                jenis: 'hutang',
                jumlah: 100000,
                batchId: 'BATCH_TEST',
                kasirId: 'USER001'
            };

            // Create journal entry
            accountingIntegration.createJournalEntry(transaction, true);
            
            let jurnalList = JSON.parse(localStorage.getItem('jurnal'));
            expect(jurnalList).toHaveLength(1);

            // Rollback journal entry
            const rollbackResult = accountingIntegration.rollbackJournalEntry('TXN001');
            expect(rollbackResult).toBe(true);

            jurnalList = JSON.parse(localStorage.getItem('jurnal'));
            expect(jurnalList).toHaveLength(0);
        });

        test('should rollback batch journal entries', () => {
            // Requirements: 11.2 - Integrate with accounting module
            
            const transactions = [
                {
                    id: 'TXN001',
                    tanggal: '2024-01-15',
                    anggotaNama: 'John Doe',
                    jenis: 'hutang',
                    jumlah: 100000,
                    batchId: 'BATCH_TEST',
                    kasirId: 'USER001'
                },
                {
                    id: 'TXN002',
                    tanggal: '2024-01-15',
                    anggotaNama: 'Jane Smith',
                    jenis: 'piutang',
                    jumlah: 50000,
                    batchId: 'BATCH_TEST',
                    kasirId: 'USER001'
                }
            ];

            // Create journal entries
            transactions.forEach(transaction => {
                accountingIntegration.createJournalEntry(transaction, true);
            });

            let jurnalList = JSON.parse(localStorage.getItem('jurnal'));
            expect(jurnalList).toHaveLength(2);

            // Rollback batch
            const rollbackResult = accountingIntegration.rollbackBatchJournalEntries('BATCH_TEST');
            expect(rollbackResult.success).toBe(true);
            expect(rollbackResult.rolledBackCount).toBe(2);

            jurnalList = JSON.parse(localStorage.getItem('jurnal'));
            expect(jurnalList).toHaveLength(0);
        });
    });

    describe('End-to-End Import Workflow Integration', () => {
        test('should execute complete import workflow with payment system integration', async () => {
            // Requirements: All requirements - Test end-to-end import workflow
            
            // Mock file data
            const mockFileData = [
                {
                    nomor_anggota: '001',
                    nama_anggota: 'John Doe',
                    jenis_pembayaran: 'hutang',
                    jumlah_pembayaran: '100000',
                    keterangan: 'Test payment 1'
                },
                {
                    nomor_anggota: '002',
                    nama_anggota: 'Jane Smith',
                    jenis_pembayaran: 'piutang',
                    jumlah_pembayaran: '50000',
                    keterangan: 'Test payment 2'
                }
            ];

            // Step 1: Validate data using integrated validation
            const validatedRows = [];
            for (const rowData of mockFileData) {
                const validatedRow = await validationEngine.validateRow(rowData, validatedRows.length + 1);
                validatedRows.push(validatedRow);
            }

            expect(validatedRows).toHaveLength(2);
            expect(validatedRows[0].isValid).toBe(true);
            expect(validatedRows[1].isValid).toBe(true);

            // Step 2: Process batch using integrated batch processor
            const results = await batchProcessor.processPayments(validatedRows);

            expect(results.successCount).toBe(2);
            expect(results.failureCount).toBe(0);
            expect(results.totalProcessed).toBe(2);

            // Verify transactions were saved
            const pembayaranList = JSON.parse(localStorage.getItem('pembayaranHutangPiutang'));
            expect(pembayaranList).toHaveLength(2);

            // Verify journal entries were created
            const jurnalList = JSON.parse(localStorage.getItem('jurnal'));
            expect(jurnalList).toHaveLength(2);

            // Verify balances were updated correctly
            const hutangBalance = paymentIntegration.hitungSaldoHutang('ANG001');
            expect(hutangBalance).toBe(400000); // 500000 - 100000

            const piutangBalance = paymentIntegration.hitungSaldoPiutang('ANG002');
            expect(piutangBalance).toBe(250000); // 300000 - 50000
        });

        test('should handle validation errors with integrated validation', async () => {
            // Requirements: All requirements - Test integration with payment system
            
            const mockFileData = [
                {
                    nomor_anggota: '001',
                    nama_anggota: 'John Doe',
                    jenis_pembayaran: 'hutang',
                    jumlah_pembayaran: '600000', // Exceeds balance
                    keterangan: 'Invalid payment'
                },
                {
                    nomor_anggota: 'INVALID',
                    nama_anggota: 'Invalid User',
                    jenis_pembayaran: 'hutang',
                    jumlah_pembayaran: '100000',
                    keterangan: 'Invalid member'
                }
            ];

            const validatedRows = [];
            for (const rowData of mockFileData) {
                const validatedRow = await validationEngine.validateRow(rowData, validatedRows.length + 1);
                validatedRows.push(validatedRow);
            }

            expect(validatedRows).toHaveLength(2);
            expect(validatedRows[0].isValid).toBe(false);
            expect(validatedRows[0].validationErrors[0]).toContain('melebihi saldo');
            expect(validatedRows[1].isValid).toBe(false);
            expect(validatedRows[1].validationErrors[0]).toContain('tidak ditemukan');

            // Process batch - should skip invalid rows
            const results = await batchProcessor.processPayments(validatedRows);

            expect(results.successCount).toBe(0);
            expect(results.failureCount).toBe(0); // Invalid rows are not processed
            expect(results.totalProcessed).toBe(0);
        });

        test('should handle rollback with integrated accounting system', async () => {
            // Requirements: All requirements - Test integration with accounting module
            
            const mockFileData = [
                {
                    nomor_anggota: '001',
                    nama_anggota: 'John Doe',
                    jenis_pembayaran: 'hutang',
                    jumlah_pembayaran: '100000',
                    keterangan: 'Test payment'
                }
            ];

            // Process transaction
            const validatedRow = await validationEngine.validateRow(mockFileData[0], 1);
            const results = await batchProcessor.processPayments([validatedRow]);

            expect(results.successCount).toBe(1);

            // Verify data was created
            let pembayaranList = JSON.parse(localStorage.getItem('pembayaranHutangPiutang'));
            let jurnalList = JSON.parse(localStorage.getItem('jurnal'));
            expect(pembayaranList).toHaveLength(1);
            expect(jurnalList).toHaveLength(1);

            // Rollback the batch
            const rollbackResult = await batchProcessor.rollbackBatch(results.batchId);
            expect(rollbackResult.success).toBe(true);
            expect(rollbackResult.rolledBackCount).toBeGreaterThan(0);

            // Verify data was rolled back
            pembayaranList = JSON.parse(localStorage.getItem('pembayaranHutangPiutang'));
            jurnalList = JSON.parse(localStorage.getItem('jurnal'));
            expect(pembayaranList).toHaveLength(0);
            expect(jurnalList).toHaveLength(0);
        });
    });

    describe('Integration Status and Health Checks', () => {
        test('should report payment system integration status', () => {
            // Requirements: 11.1 - Ensure compatibility with existing payment processing
            
            const status = paymentIntegration.getIntegrationStatus();
            
            expect(status).toHaveProperty('paymentSystemAvailable');
            expect(status).toHaveProperty('validationAvailable');
            expect(status).toHaveProperty('journalSystemAvailable');
            expect(status).toHaveProperty('auditSystemAvailable');
            expect(status).toHaveProperty('accountingIntegrationAvailable');
            expect(status.currentUser).toEqual(sampleCurrentUser);
        });

        test('should report accounting integration status', () => {
            // Requirements: 11.2 - Integrate with accounting module
            
            const status = accountingIntegration.getIntegrationStatus();
            
            expect(status.chartOfAccountsLoaded).toBe(true);
            expect(status.chartOfAccountsValid).toBe(true);
            expect(status.journalPatternsLoaded).toBe(true);
            expect(status.storageAvailable).toBe(true);
        });

        test('should validate system consistency across integrations', () => {
            // Requirements: All requirements - Test integration consistency
            
            // Test payment integration
            const paymentStatus = paymentIntegration.getIntegrationStatus();
            expect(paymentStatus.accountingIntegrationAvailable).toBe(true);

            // Test accounting integration
            const accountingStatus = accountingIntegration.getIntegrationStatus();
            expect(accountingStatus.chartOfAccountsValid).toBe(true);

            // Test batch processor integration
            expect(batchProcessor.paymentIntegration).toBeDefined();
            expect(batchProcessor.rollbackManager).toBeDefined();

            // Test validation engine integration
            expect(validationEngine.paymentIntegration).toBeDefined();
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should handle missing integration components gracefully', () => {
            // Requirements: All requirements - Test graceful degradation
            
            // Create components without integration
            const standaloneProcessor = new BatchProcessor(null, null);
            standaloneProcessor.paymentIntegration = null;

            const standaloneValidation = new ValidationEngine();
            standaloneValidation.paymentIntegration = null;

            // Should not throw errors
            expect(() => {
                standaloneProcessor.hitungSaldoHutang('ANG001');
                standaloneValidation.validateAmountAgainstBalance('001', 'hutang', 100000);
            }).not.toThrow();
        });

        test('should handle corrupted data gracefully', async () => {
            // Requirements: All requirements - Test error handling
            
            // Corrupt localStorage data
            localStorage.setItem('anggota', 'invalid json');
            
            const validationResult = await validationEngine.validateRow({
                nomor_anggota: '001',
                nama_anggota: 'John Doe',
                jenis_pembayaran: 'hutang',
                jumlah_pembayaran: '100000',
                keterangan: 'Test'
            }, 1);

            expect(validationResult.isValid).toBe(false);
            expect(validationResult.validationErrors.length).toBeGreaterThan(0);
        });

        test('should maintain data consistency during partial failures', async () => {
            // Requirements: All requirements - Test data consistency
            
            const mockFileData = [
                {
                    nomor_anggota: '001',
                    nama_anggota: 'John Doe',
                    jenis_pembayaran: 'hutang',
                    jumlah_pembayaran: '100000',
                    keterangan: 'Valid payment'
                },
                {
                    nomor_anggota: '002',
                    nama_anggota: 'Jane Smith',
                    jenis_pembayaran: 'piutang',
                    jumlah_pembayaran: '400000', // Exceeds balance
                    keterangan: 'Invalid payment'
                }
            ];

            const validatedRows = [];
            for (const rowData of mockFileData) {
                const validatedRow = await validationEngine.validateRow(rowData, validatedRows.length + 1);
                validatedRows.push(validatedRow);
            }

            // Only first row should be valid
            expect(validatedRows[0].isValid).toBe(true);
            expect(validatedRows[1].isValid).toBe(false);

            // Process batch - should only process valid rows
            const results = await batchProcessor.processPayments(validatedRows);

            expect(results.successCount).toBe(1);
            expect(results.failureCount).toBe(0); // Invalid rows are not processed

            // Verify only valid transaction was saved
            const pembayaranList = JSON.parse(localStorage.getItem('pembayaranHutangPiutang'));
            expect(pembayaranList).toHaveLength(1);
            expect(pembayaranList[0].anggotaNama).toBe('John Doe');

            // Verify journal consistency
            const jurnalList = JSON.parse(localStorage.getItem('jurnal'));
            expect(jurnalList).toHaveLength(1);

            const stats = accountingIntegration.getJournalStatistics();
            expect(stats.isBalanced).toBe(true);
        });
    });
});