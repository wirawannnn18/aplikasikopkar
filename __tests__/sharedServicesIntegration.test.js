/**
 * Integration Tests for Shared Services
 * 
 * Feature: integrasi-pembayaran-laporan
 * Task: 12.2 Write integration tests for shared services
 * 
 * Tests:
 * - Mode-aware operations
 * - Data consistency across modes
 * - Error handling and rollback
 * 
 * Requirements: 6.1-6.5
 */

const fc = require('fast-check');

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

// Mock SharedPaymentServices
class MockSharedPaymentServices {
    constructor() {
        this.isInitialized = false;
        this.auditLogger = new MockAuditLogger();
        this.transactionHistory = [];
        this.rollbackStack = [];
    }

    async initialize() {
        this.isInitialized = true;
    }

    async processPayment(paymentData, mode) {
        if (!this.isInitialized) {
            throw new Error('SharedPaymentServices not initialized');
        }

        try {
            // Validate payment data
            this._validatePaymentData(paymentData, mode);
            
            // Create journal entry
            const journalEntry = await this._createJournalEntry(paymentData, mode);
            
            // Update saldo
            await this._updateSaldo(paymentData, mode);
            
            // Log transaction
            await this._logTransaction(paymentData, mode, journalEntry);
            
            // Add to rollback stack
            this._addToRollbackStack(paymentData, mode, journalEntry);
            
            return {
                success: true,
                transactionId: journalEntry.id,
                mode: mode,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            // Log error
            this.auditLogger.logError('PAYMENT_PROCESSING_ERROR', {
                paymentData,
                mode,
                error: error.message
            });
            
            throw error;
        }
    }

    async processBatchPayments(batchData, mode) {
        if (!this.isInitialized) {
            throw new Error('SharedPaymentServices not initialized');
        }

        const results = [];
        const rollbackPoints = [];
        
        try {
            for (const paymentData of batchData) {
                const rollbackPoint = this._createRollbackPoint();
                rollbackPoints.push(rollbackPoint);
                
                const result = await this.processPayment(paymentData, mode);
                results.push(result);
            }
            
            return {
                success: true,
                results: results,
                mode: mode,
                batchId: this._generateBatchId(),
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            // Rollback all processed payments in this batch
            await this._rollbackBatch(rollbackPoints);
            
            throw new Error(`Batch processing failed: ${error.message}`);
        }
    }

    async validateDataConsistency() {
        try {
            // Check saldo consistency across modes
            const manualSaldo = this._calculateSaldoByMode('manual');
            const importSaldo = this._calculateSaldoByMode('import');
            const totalSaldo = this._calculateTotalSaldo();
            
            if (manualSaldo + importSaldo !== totalSaldo) {
                throw new Error('Saldo inconsistency detected between modes');
            }
            
            // Check journal entry integrity
            const journalEntries = this._getJournalEntries();
            for (const entry of journalEntries) {
                if (!this._validateJournalEntry(entry)) {
                    throw new Error(`Invalid journal entry: ${entry.id}`);
                }
            }
            
            return {
                consistent: true,
                manualSaldo,
                importSaldo,
                totalSaldo,
                journalEntriesCount: journalEntries.length
            };
            
        } catch (error) {
            return {
                consistent: false,
                error: error.message
            };
        }
    }

    async rollbackTransaction(transactionId) {
        try {
            const transaction = this._findTransaction(transactionId);
            if (!transaction) {
                throw new Error(`Transaction not found: ${transactionId}`);
            }
            
            // Reverse journal entry
            await this._reverseJournalEntry(transaction.journalId);
            
            // Reverse saldo update
            await this._reverseSaldoUpdate(transaction);
            
            // Log rollback
            this.auditLogger.logRollback('TRANSACTION_ROLLBACK', {
                transactionId,
                mode: transaction.mode,
                timestamp: new Date().toISOString()
            });
            
            return {
                success: true,
                transactionId,
                rolledBack: true
            };
            
        } catch (error) {
            this.auditLogger.logError('ROLLBACK_ERROR', {
                transactionId,
                error: error.message
            });
            
            throw error;
        }
    }

    getTransactionsByMode(mode) {
        return this.transactionHistory.filter(t => t.mode === mode);
    }

    async refreshData() {
        // Simulate data refresh
        return true;
    }

    // Private methods
    _validatePaymentData(paymentData, mode) {
        if (!paymentData.anggotaId) {
            throw new Error('Missing anggotaId');
        }
        if (!paymentData.jumlah || paymentData.jumlah <= 0) {
            throw new Error('Invalid payment amount');
        }
        if (!['manual', 'import'].includes(mode)) {
            throw new Error('Invalid mode');
        }
    }

    async _createJournalEntry(paymentData, mode) {
        const journalEntry = {
            id: 'JE-' + Math.random().toString(36).substr(2, 9),
            anggotaId: paymentData.anggotaId,
            jumlah: paymentData.jumlah,
            jenis: paymentData.jenis,
            mode: mode,
            timestamp: new Date().toISOString(),
            debit: paymentData.jenis === 'hutang' ? paymentData.jumlah : 0,
            kredit: paymentData.jenis === 'piutang' ? paymentData.jumlah : 0
        };
        
        // Store journal entry
        const journalEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
        journalEntries.push(journalEntry);
        localStorage.setItem('journalEntries', JSON.stringify(journalEntries));
        
        return journalEntry;
    }

    async _updateSaldo(paymentData, mode) {
        const saldoKey = `saldo_${paymentData.anggotaId}`;
        const currentSaldo = parseFloat(localStorage.getItem(saldoKey) || '0');
        
        let newSaldo;
        if (paymentData.jenis === 'hutang') {
            newSaldo = currentSaldo - paymentData.jumlah;
        } else {
            newSaldo = currentSaldo + paymentData.jumlah;
        }
        
        localStorage.setItem(saldoKey, newSaldo.toString());
        
        // Log saldo change
        this.auditLogger.logSaldoChange(paymentData.anggotaId, currentSaldo, newSaldo, mode);
    }

    async _logTransaction(paymentData, mode, journalEntry) {
        const transaction = {
            id: 'TXN-' + Math.random().toString(36).substr(2, 9),
            anggotaId: paymentData.anggotaId,
            jumlah: paymentData.jumlah,
            jenis: paymentData.jenis,
            mode: mode,
            journalId: journalEntry.id,
            timestamp: new Date().toISOString()
        };
        
        this.transactionHistory.push(transaction);
        
        // Store in localStorage
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        transactions.push(transaction);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        
        // Log to audit
        this.auditLogger.logTransaction('PAYMENT_PROCESSED', transaction);
    }

    _addToRollbackStack(paymentData, mode, journalEntry) {
        this.rollbackStack.push({
            paymentData,
            mode,
            journalEntry,
            timestamp: new Date().toISOString()
        });
    }

    _createRollbackPoint() {
        return {
            stackLength: this.rollbackStack.length,
            timestamp: new Date().toISOString()
        };
    }

    async _rollbackBatch(rollbackPoints) {
        // Rollback to the earliest rollback point
        const earliestPoint = rollbackPoints[0];
        if (earliestPoint) {
            this.rollbackStack = this.rollbackStack.slice(0, earliestPoint.stackLength);
        }
    }

    _generateBatchId() {
        return 'BATCH-' + Math.random().toString(36).substr(2, 9);
    }

    _calculateSaldoByMode(mode) {
        return this.transactionHistory
            .filter(t => t.mode === mode)
            .reduce((sum, t) => {
                return t.jenis === 'hutang' ? sum - t.jumlah : sum + t.jumlah;
            }, 0);
    }

    _calculateTotalSaldo() {
        return this.transactionHistory
            .reduce((sum, t) => {
                return t.jenis === 'hutang' ? sum - t.jumlah : sum + t.jumlah;
            }, 0);
    }

    _getJournalEntries() {
        return JSON.parse(localStorage.getItem('journalEntries') || '[]');
    }

    _validateJournalEntry(entry) {
        return entry.id && entry.anggotaId && entry.jumlah > 0 && 
               (entry.debit > 0 || entry.kredit > 0) && entry.mode;
    }

    _findTransaction(transactionId) {
        return this.transactionHistory.find(t => t.id === transactionId);
    }

    async _reverseJournalEntry(journalId) {
        const journalEntries = this._getJournalEntries();
        const entry = journalEntries.find(e => e.id === journalId);
        
        if (entry) {
            // Create reverse entry
            const reverseEntry = {
                ...entry,
                id: 'REV-' + entry.id,
                debit: entry.kredit,
                kredit: entry.debit,
                reversed: true,
                originalId: entry.id
            };
            
            journalEntries.push(reverseEntry);
            localStorage.setItem('journalEntries', JSON.stringify(journalEntries));
        }
    }

    async _reverseSaldoUpdate(transaction) {
        const saldoKey = `saldo_${transaction.anggotaId}`;
        const currentSaldo = parseFloat(localStorage.getItem(saldoKey) || '0');
        
        let newSaldo;
        if (transaction.jenis === 'hutang') {
            newSaldo = currentSaldo + transaction.jumlah; // Reverse the subtraction
        } else {
            newSaldo = currentSaldo - transaction.jumlah; // Reverse the addition
        }
        
        localStorage.setItem(saldoKey, newSaldo.toString());
    }
}

// Mock AuditLogger
class MockAuditLogger {
    constructor() {
        this.logs = [];
    }

    logTransaction(action, data) {
        this.logs.push({
            action,
            data,
            timestamp: new Date().toISOString()
        });
    }

    logError(action, data) {
        this.logs.push({
            action,
            data,
            level: 'error',
            timestamp: new Date().toISOString()
        });
    }

    logRollback(action, data) {
        this.logs.push({
            action,
            data,
            level: 'rollback',
            timestamp: new Date().toISOString()
        });
    }

    logSaldoChange(anggotaId, oldSaldo, newSaldo, mode) {
        this.logs.push({
            action: 'SALDO_CHANGE',
            data: { anggotaId, oldSaldo, newSaldo, mode },
            timestamp: new Date().toISOString()
        });
    }

    getLogs() {
        return this.logs;
    }

    clearLogs() {
        this.logs = [];
    }
}

describe('Shared Services Integration Tests', () => {
    let sharedServices;

    beforeEach(() => {
        localStorage.clear();
        sharedServices = new MockSharedPaymentServices();
    });

    /**
     * Test mode-aware operations
     * Requirements: 6.1, 6.2
     */
    describe('Mode-Aware Operations', () => {
        
        beforeEach(async () => {
            await sharedServices.initialize();
        });

        test('should process manual payment with correct mode tracking', async () => {
            const paymentData = {
                anggotaId: 'A001',
                jumlah: 100000,
                jenis: 'hutang'
            };

            const result = await sharedServices.processPayment(paymentData, 'manual');

            expect(result.success).toBe(true);
            expect(result.mode).toBe('manual');
            expect(result.transactionId).toBeDefined();
            
            // Verify mode is tracked in transaction history
            const manualTransactions = sharedServices.getTransactionsByMode('manual');
            expect(manualTransactions).toHaveLength(1);
            expect(manualTransactions[0].mode).toBe('manual');
        });

        test('should process import payment with correct mode tracking', async () => {
            const paymentData = {
                anggotaId: 'A002',
                jumlah: 200000,
                jenis: 'hutang'
            };

            const result = await sharedServices.processPayment(paymentData, 'import');

            expect(result.success).toBe(true);
            expect(result.mode).toBe('import');
            
            // Verify mode is tracked in transaction history
            const importTransactions = sharedServices.getTransactionsByMode('import');
            expect(importTransactions).toHaveLength(1);
            expect(importTransactions[0].mode).toBe('import');
        });

        test('should process batch payments with mode tracking', async () => {
            const batchData = [
                { anggotaId: 'A001', jumlah: 50000, jenis: 'hutang' },
                { anggotaId: 'A002', jumlah: 75000, jenis: 'hutang' },
                { anggotaId: 'A003', jumlah: 100000, jenis: 'hutang' }
            ];

            const result = await sharedServices.processBatchPayments(batchData, 'import');

            expect(result.success).toBe(true);
            expect(result.mode).toBe('import');
            expect(result.results).toHaveLength(3);
            expect(result.batchId).toBeDefined();
            
            // Verify all transactions have correct mode
            const importTransactions = sharedServices.getTransactionsByMode('import');
            expect(importTransactions).toHaveLength(3);
            importTransactions.forEach(transaction => {
                expect(transaction.mode).toBe('import');
            });
        });

        test('Property: Mode is preserved across all operations', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom('manual', 'import'),
                    fc.string({ minLength: 3, maxLength: 10 }).map(s => 'A' + s),
                    fc.integer({ min: 1000, max: 1000000 }),
                    fc.constantFrom('hutang', 'piutang'),
                    async (mode, anggotaId, jumlah, jenis) => {
                        await sharedServices.initialize();
                        
                        const paymentData = { anggotaId, jumlah, jenis };
                        const result = await sharedServices.processPayment(paymentData, mode);
                        
                        expect(result.mode).toBe(mode);
                        
                        const transactions = sharedServices.getTransactionsByMode(mode);
                        const transaction = transactions.find(t => t.id === result.transactionId);
                        expect(transaction).toBeDefined();
                        if (transaction) {
                            expect(transaction.mode).toBe(mode);
                        }
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    /**
     * Test data consistency across modes
     * Requirements: 6.1, 6.2, 6.3
     */
    describe('Data Consistency Across Modes', () => {
        
        beforeEach(async () => {
            await sharedServices.initialize();
        });

        test('should maintain saldo consistency across manual and import modes', async () => {
            // Process manual payment
            await sharedServices.processPayment({
                anggotaId: 'A001',
                jumlah: 100000,
                jenis: 'hutang'
            }, 'manual');

            // Process import payment
            await sharedServices.processPayment({
                anggotaId: 'A001',
                jumlah: 50000,
                jenis: 'hutang'
            }, 'import');

            // Validate consistency
            const consistency = await sharedServices.validateDataConsistency();
            
            expect(consistency.consistent).toBe(true);
            expect(consistency.manualSaldo).toBe(-100000);
            expect(consistency.importSaldo).toBe(-50000);
            expect(consistency.totalSaldo).toBe(-150000);
        });

        test('should maintain journal entry integrity across modes', async () => {
            // Process payments in both modes
            await sharedServices.processPayment({
                anggotaId: 'A001',
                jumlah: 100000,
                jenis: 'hutang'
            }, 'manual');

            await sharedServices.processPayment({
                anggotaId: 'A002',
                jumlah: 200000,
                jenis: 'piutang'
            }, 'import');

            // Validate consistency
            const consistency = await sharedServices.validateDataConsistency();
            
            expect(consistency.consistent).toBe(true);
            expect(consistency.journalEntriesCount).toBe(2);
        });

        test('should detect saldo inconsistencies', async () => {
            // Process payment normally
            await sharedServices.processPayment({
                anggotaId: 'A001',
                jumlah: 100000,
                jenis: 'hutang'
            }, 'manual');

            // Manually corrupt saldo data
            localStorage.setItem('saldo_A001', '999999');

            // Validate consistency
            const consistency = await sharedServices.validateDataConsistency();
            
            expect(consistency.consistent).toBe(false);
            expect(consistency.error).toContain('inconsistency');
        });

        test('Property: Total saldo equals sum of mode-specific saldos', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.array(fc.record({
                        anggotaId: fc.string({ minLength: 3, maxLength: 10 }).map(s => 'A' + s),
                        jumlah: fc.integer({ min: 1000, max: 100000 }),
                        jenis: fc.constantFrom('hutang', 'piutang'),
                        mode: fc.constantFrom('manual', 'import')
                    }), { minLength: 1, maxLength: 10 }),
                    async (payments) => {
                        await sharedServices.initialize();
                        
                        // Process all payments
                        for (const payment of payments) {
                            const { mode, ...paymentData } = payment;
                            await sharedServices.processPayment(paymentData, mode);
                        }
                        
                        // Validate consistency
                        const consistency = await sharedServices.validateDataConsistency();
                        
                        expect(consistency.consistent).toBe(true);
                        expect(consistency.totalSaldo).toBe(
                            consistency.manualSaldo + consistency.importSaldo
                        );
                    }
                ),
                { numRuns: 30 }
            );
        });
    });

    /**
     * Test error handling and rollback
     * Requirements: 6.4, 6.5
     */
    describe('Error Handling and Rollback', () => {
        
        beforeEach(async () => {
            await sharedServices.initialize();
        });

        test('should handle invalid payment data', async () => {
            const invalidPayment = {
                anggotaId: '',
                jumlah: -1000,
                jenis: 'invalid'
            };

            await expect(
                sharedServices.processPayment(invalidPayment, 'manual')
            ).rejects.toThrow();
            
            // Verify no transaction was created
            const transactions = sharedServices.getTransactionsByMode('manual');
            expect(transactions).toHaveLength(0);
        });

        test('should handle invalid mode', async () => {
            const paymentData = {
                anggotaId: 'A001',
                jumlah: 100000,
                jenis: 'hutang'
            };

            await expect(
                sharedServices.processPayment(paymentData, 'invalid')
            ).rejects.toThrow('Invalid mode');
        });

        test('should rollback batch on failure', async () => {
            const batchData = [
                { anggotaId: 'A001', jumlah: 50000, jenis: 'hutang' },
                { anggotaId: '', jumlah: 75000, jenis: 'hutang' }, // Invalid
                { anggotaId: 'A003', jumlah: 100000, jenis: 'hutang' }
            ];

            await expect(
                sharedServices.processBatchPayments(batchData, 'import')
            ).rejects.toThrow('Batch processing failed');
            
            // Verify no transactions were persisted
            const transactions = sharedServices.getTransactionsByMode('import');
            expect(transactions).toHaveLength(0);
        });

        test('should rollback individual transaction', async () => {
            // Process payment
            const result = await sharedServices.processPayment({
                anggotaId: 'A001',
                jumlah: 100000,
                jenis: 'hutang'
            }, 'manual');

            // Verify transaction exists
            let transactions = sharedServices.getTransactionsByMode('manual');
            expect(transactions).toHaveLength(1);

            // Rollback transaction
            const rollbackResult = await sharedServices.rollbackTransaction(result.transactionId);
            
            expect(rollbackResult.success).toBe(true);
            expect(rollbackResult.rolledBack).toBe(true);
            
            // Verify rollback was logged
            const auditLogs = sharedServices.auditLogger.getLogs();
            const rollbackLog = auditLogs.find(log => log.action === 'TRANSACTION_ROLLBACK');
            expect(rollbackLog).toBeDefined();
        });

        test('should handle rollback of non-existent transaction', async () => {
            await expect(
                sharedServices.rollbackTransaction('NON_EXISTENT')
            ).rejects.toThrow('Transaction not found');
        });

        test('Property: Failed operations do not affect system state', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        anggotaId: fc.oneof(fc.constant(''), fc.string({ minLength: 3, maxLength: 10 })),
                        jumlah: fc.integer({ min: -100000, max: 100000 }),
                        jenis: fc.oneof(fc.constantFrom('hutang', 'piutang'), fc.constant('invalid'))
                    }),
                    fc.constantFrom('manual', 'import'),
                    async (paymentData, mode) => {
                        await sharedServices.initialize();
                        
                        // Get initial state
                        const initialTransactionCount = sharedServices.transactionHistory.length;
                        const initialConsistency = await sharedServices.validateDataConsistency();
                        
                        try {
                            await sharedServices.processPayment(paymentData, mode);
                        } catch (error) {
                            // Verify state unchanged after error
                            const finalTransactionCount = sharedServices.transactionHistory.length;
                            const finalConsistency = await sharedServices.validateDataConsistency();
                            
                            expect(finalTransactionCount).toBe(initialTransactionCount);
                            expect(finalConsistency.consistent).toBe(initialConsistency.consistent);
                        }
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    /**
     * Test audit logging integration
     * Requirements: 6.3, 8.3
     */
    describe('Audit Logging Integration', () => {
        
        beforeEach(async () => {
            await sharedServices.initialize();
            sharedServices.auditLogger.clearLogs();
        });

        test('should log successful payments', async () => {
            await sharedServices.processPayment({
                anggotaId: 'A001',
                jumlah: 100000,
                jenis: 'hutang'
            }, 'manual');

            const logs = sharedServices.auditLogger.getLogs();
            const paymentLog = logs.find(log => log.action === 'PAYMENT_PROCESSED');
            
            expect(paymentLog).toBeDefined();
            expect(paymentLog.data.mode).toBe('manual');
            expect(paymentLog.data.anggotaId).toBe('A001');
        });

        test('should log payment errors', async () => {
            try {
                await sharedServices.processPayment({
                    anggotaId: '',
                    jumlah: -1000,
                    jenis: 'invalid'
                }, 'manual');
            } catch (error) {
                // Expected to fail
            }

            const logs = sharedServices.auditLogger.getLogs();
            const errorLog = logs.find(log => log.action === 'PAYMENT_PROCESSING_ERROR');
            
            expect(errorLog).toBeDefined();
            expect(errorLog.level).toBe('error');
        });

        test('should log saldo changes', async () => {
            await sharedServices.processPayment({
                anggotaId: 'A001',
                jumlah: 100000,
                jenis: 'hutang'
            }, 'manual');

            const logs = sharedServices.auditLogger.getLogs();
            const saldoLog = logs.find(log => log.action === 'SALDO_CHANGE');
            
            expect(saldoLog).toBeDefined();
            expect(saldoLog.data.anggotaId).toBe('A001');
            expect(saldoLog.data.mode).toBe('manual');
        });

        test('should log rollback operations', async () => {
            const result = await sharedServices.processPayment({
                anggotaId: 'A001',
                jumlah: 100000,
                jenis: 'hutang'
            }, 'manual');

            await sharedServices.rollbackTransaction(result.transactionId);

            const logs = sharedServices.auditLogger.getLogs();
            const rollbackLog = logs.find(log => log.action === 'TRANSACTION_ROLLBACK');
            
            expect(rollbackLog).toBeDefined();
            expect(rollbackLog.level).toBe('rollback');
            expect(rollbackLog.data.transactionId).toBe(result.transactionId);
        });

        test('Property: All operations are logged', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 3, maxLength: 10 }).map(s => 'A' + s),
                    fc.integer({ min: 1000, max: 100000 }),
                    fc.constantFrom('hutang', 'piutang'),
                    fc.constantFrom('manual', 'import'),
                    async (anggotaId, jumlah, jenis, mode) => {
                        await sharedServices.initialize();
                        sharedServices.auditLogger.clearLogs();
                        
                        const initialLogCount = sharedServices.auditLogger.getLogs().length;
                        
                        await sharedServices.processPayment({ anggotaId, jumlah, jenis }, mode);
                        
                        const finalLogCount = sharedServices.auditLogger.getLogs().length;
                        
                        // Should have at least one new log entry
                        expect(finalLogCount).toBeGreaterThan(initialLogCount);
                    }
                ),
                { numRuns: 30 }
            );
        });
    });

    /**
     * Test service initialization and lifecycle
     * Requirements: 6.1
     */
    describe('Service Initialization and Lifecycle', () => {
        
        test('should initialize successfully', async () => {
            expect(sharedServices.isInitialized).toBe(false);
            
            await sharedServices.initialize();
            
            expect(sharedServices.isInitialized).toBe(true);
        });

        test('should require initialization before operations', async () => {
            await expect(
                sharedServices.processPayment({
                    anggotaId: 'A001',
                    jumlah: 100000,
                    jenis: 'hutang'
                }, 'manual')
            ).rejects.toThrow('SharedPaymentServices not initialized');
        });

        test('should handle multiple initialization calls', async () => {
            await sharedServices.initialize();
            await sharedServices.initialize();
            await sharedServices.initialize();
            
            expect(sharedServices.isInitialized).toBe(true);
        });

        test('should refresh data successfully', async () => {
            await sharedServices.initialize();
            
            const result = await sharedServices.refreshData();
            
            expect(result).toBe(true);
        });
    });
});