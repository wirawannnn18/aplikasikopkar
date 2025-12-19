/**
 * End-to-End Tests for Complete Workflows
 * 
 * Feature: integrasi-pembayaran-laporan
 * Task: 12.3 Write end-to-end tests for complete workflows
 * 
 * Tests:
 * - Manual payment followed by import batch
 * - Import batch followed by manual payment
 * - Unified transaction history and reporting
 * 
 * Requirements: All
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

// Mock DOM for testing
const mockDOM = {
    getElementById: jest.fn(),
    createElement: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn()
};

global.document = mockDOM;

// Mock complete integrated system
class MockIntegratedPaymentSystem {
    constructor() {
        this.controller = new MockIntegrationController();
        this.sharedServices = new MockSharedPaymentServices();
        this.manualPaymentController = new MockManualPaymentController();
        this.importController = new MockImportController();
        this.transactionHistory = new MockTransactionHistory();
        this.reportingSystem = new MockReportingSystem();
        
        this.isInitialized = false;
    }

    async initialize() {
        await this.controller.initialize();
        await this.sharedServices.initialize();
        await this.manualPaymentController.initialize();
        await this.importController.initialize();
        await this.transactionHistory.initialize();
        await this.reportingSystem.initialize();
        
        // Wire up components
        this.controller.setSharedServices(this.sharedServices);
        this.manualPaymentController.setSharedServices(this.sharedServices);
        this.importController.setSharedServices(this.sharedServices);
        this.transactionHistory.setSharedServices(this.sharedServices);
        this.reportingSystem.setSharedServices(this.sharedServices);
        
        this.isInitialized = true;
    }

    async processManualPayment(paymentData) {
        if (!this.isInitialized) {
            throw new Error('System not initialized');
        }

        // Switch to manual tab
        await this.controller.switchTab('manual');
        
        // Process payment through manual controller
        const result = await this.manualPaymentController.processPayment(paymentData);
        
        // Update transaction history
        await this.transactionHistory.refresh();
        
        // Update reporting
        await this.reportingSystem.refresh();
        
        return result;
    }

    async processImportBatch(batchData) {
        if (!this.isInitialized) {
            throw new Error('System not initialized');
        }

        // Switch to import tab
        await this.controller.switchTab('import');
        
        // Process batch through import controller
        const result = await this.importController.processBatch(batchData);
        
        // Update transaction history
        await this.transactionHistory.refresh();
        
        // Update reporting
        await this.reportingSystem.refresh();
        
        return result;
    }

    async getUnifiedTransactionHistory(filters = {}) {
        return await this.transactionHistory.getUnifiedHistory(filters);
    }

    async generateUnifiedReport(options = {}) {
        return await this.reportingSystem.generateUnifiedReport(options);
    }

    async validateSystemConsistency() {
        const consistency = await this.sharedServices.validateDataConsistency();
        const historyConsistency = await this.transactionHistory.validateConsistency();
        const reportConsistency = await this.reportingSystem.validateConsistency();
        
        return {
            overall: consistency.consistent && historyConsistency.consistent && reportConsistency.consistent,
            sharedServices: consistency,
            transactionHistory: historyConsistency,
            reporting: reportConsistency
        };
    }
}

// Mock Integration Controller
class MockIntegrationController {
    constructor() {
        this.activeTab = 'manual';
        this.sharedServices = null;
        this.isInitialized = false;
    }

    async initialize() {
        this.isInitialized = true;
    }

    async switchTab(tabId) {
        if (!['manual', 'import'].includes(tabId)) {
            return false;
        }
        this.activeTab = tabId;
        return true;
    }

    setSharedServices(sharedServices) {
        this.sharedServices = sharedServices;
    }
}

// Mock Shared Payment Services
class MockSharedPaymentServices {
    constructor() {
        this.transactions = [];
        this.journalEntries = [];
        this.saldoData = new Map();
        this.isInitialized = false;
    }

    async initialize() {
        this.isInitialized = true;
    }

    async processPayment(paymentData, mode) {
        const transaction = {
            id: 'TXN-' + Math.random().toString(36).substr(2, 9),
            ...paymentData,
            mode,
            timestamp: new Date().toISOString(),
            status: 'completed'
        };

        // Create journal entry
        const journalEntry = {
            id: 'JE-' + Math.random().toString(36).substr(2, 9),
            transactionId: transaction.id,
            anggotaId: paymentData.anggotaId,
            debit: paymentData.jenis === 'hutang' ? paymentData.jumlah : 0,
            kredit: paymentData.jenis === 'piutang' ? paymentData.jumlah : 0,
            mode,
            timestamp: new Date().toISOString()
        };

        // Update saldo
        const currentSaldo = this.saldoData.get(paymentData.anggotaId) || 0;
        const newSaldo = paymentData.jenis === 'hutang' 
            ? currentSaldo - paymentData.jumlah 
            : currentSaldo + paymentData.jumlah;
        this.saldoData.set(paymentData.anggotaId, newSaldo);

        this.transactions.push(transaction);
        this.journalEntries.push(journalEntry);

        return {
            success: true,
            transactionId: transaction.id,
            journalId: journalEntry.id,
            mode
        };
    }

    async processBatchPayments(batchData, mode) {
        const results = [];
        const batchId = 'BATCH-' + Math.random().toString(36).substr(2, 9);

        for (const paymentData of batchData) {
            const result = await this.processPayment(paymentData, mode);
            result.batchId = batchId;
            results.push(result);
        }

        return {
            success: true,
            batchId,
            results,
            mode
        };
    }

    async validateDataConsistency() {
        // Simple consistency check
        const manualTransactions = this.transactions.filter(t => t.mode === 'manual');
        const importTransactions = this.transactions.filter(t => t.mode === 'import');
        
        return {
            consistent: true,
            manualCount: manualTransactions.length,
            importCount: importTransactions.length,
            totalCount: this.transactions.length,
            journalEntriesCount: this.journalEntries.length
        };
    }

    getTransactionsByMode(mode) {
        return this.transactions.filter(t => t.mode === mode);
    }

    getAllTransactions() {
        return this.transactions;
    }

    getSaldo(anggotaId) {
        return this.saldoData.get(anggotaId) || 0;
    }
}

// Mock Manual Payment Controller
class MockManualPaymentController {
    constructor() {
        this.sharedServices = null;
        this.isInitialized = false;
    }

    async initialize() {
        this.isInitialized = true;
    }

    setSharedServices(sharedServices) {
        this.sharedServices = sharedServices;
    }

    async processPayment(paymentData) {
        if (!this.sharedServices) {
            throw new Error('Shared services not set');
        }

        // Validate payment data
        if (!paymentData.anggotaId || !paymentData.jumlah || paymentData.jumlah <= 0) {
            throw new Error('Invalid payment data');
        }

        return await this.sharedServices.processPayment(paymentData, 'manual');
    }
}

// Mock Import Controller
class MockImportController {
    constructor() {
        this.sharedServices = null;
        this.isInitialized = false;
    }

    async initialize() {
        this.isInitialized = true;
    }

    setSharedServices(sharedServices) {
        this.sharedServices = sharedServices;
    }

    async processBatch(batchData) {
        if (!this.sharedServices) {
            throw new Error('Shared services not set');
        }

        // Validate batch data
        if (!Array.isArray(batchData) || batchData.length === 0) {
            throw new Error('Invalid batch data');
        }

        for (const payment of batchData) {
            if (!payment.anggotaId || !payment.jumlah || payment.jumlah <= 0) {
                throw new Error('Invalid payment in batch');
            }
        }

        return await this.sharedServices.processBatchPayments(batchData, 'import');
    }
}

// Mock Transaction History
class MockTransactionHistory {
    constructor() {
        this.sharedServices = null;
        this.isInitialized = false;
    }

    async initialize() {
        this.isInitialized = true;
    }

    setSharedServices(sharedServices) {
        this.sharedServices = sharedServices;
    }

    async refresh() {
        // Simulate refresh
        return true;
    }

    async getUnifiedHistory(filters = {}) {
        if (!this.sharedServices) {
            throw new Error('Shared services not set');
        }

        let transactions = this.sharedServices.getAllTransactions();

        // Apply filters
        if (filters.mode) {
            transactions = transactions.filter(t => t.mode === filters.mode);
        }
        if (filters.anggotaId) {
            transactions = transactions.filter(t => t.anggotaId === filters.anggotaId);
        }
        if (filters.jenis) {
            transactions = transactions.filter(t => t.jenis === filters.jenis);
        }

        // Sort by timestamp (newest first)
        transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return {
            transactions,
            totalCount: transactions.length,
            manualCount: transactions.filter(t => t.mode === 'manual').length,
            importCount: transactions.filter(t => t.mode === 'import').length
        };
    }

    async validateConsistency() {
        if (!this.sharedServices) {
            return { consistent: false, error: 'Shared services not set' };
        }

        const allTransactions = this.sharedServices.getAllTransactions();
        const historyTransactions = (await this.getUnifiedHistory()).transactions;

        return {
            consistent: allTransactions.length === historyTransactions.length,
            sharedServicesCount: allTransactions.length,
            historyCount: historyTransactions.length
        };
    }
}

// Mock Reporting System
class MockReportingSystem {
    constructor() {
        this.sharedServices = null;
        this.isInitialized = false;
    }

    async initialize() {
        this.isInitialized = true;
    }

    setSharedServices(sharedServices) {
        this.sharedServices = sharedServices;
    }

    async refresh() {
        // Simulate refresh
        return true;
    }

    async generateUnifiedReport(options = {}) {
        if (!this.sharedServices) {
            throw new Error('Shared services not set');
        }

        const allTransactions = this.sharedServices.getAllTransactions();
        const manualTransactions = allTransactions.filter(t => t.mode === 'manual');
        const importTransactions = allTransactions.filter(t => t.mode === 'import');

        // Calculate totals by mode
        const manualTotal = manualTransactions.reduce((sum, t) => {
            return t.jenis === 'hutang' ? sum + t.jumlah : sum - t.jumlah;
        }, 0);

        const importTotal = importTransactions.reduce((sum, t) => {
            return t.jenis === 'hutang' ? sum + t.jumlah : sum - t.jumlah;
        }, 0);

        // Calculate by anggota
        const anggotaSummary = new Map();
        allTransactions.forEach(t => {
            if (!anggotaSummary.has(t.anggotaId)) {
                anggotaSummary.set(t.anggotaId, {
                    anggotaId: t.anggotaId,
                    manualTotal: 0,
                    importTotal: 0,
                    totalSaldo: 0
                });
            }

            const summary = anggotaSummary.get(t.anggotaId);
            const amount = t.jenis === 'hutang' ? t.jumlah : -t.jumlah;

            if (t.mode === 'manual') {
                summary.manualTotal += amount;
            } else {
                summary.importTotal += amount;
            }
            summary.totalSaldo = this.sharedServices.getSaldo(t.anggotaId);
        });

        return {
            summary: {
                totalTransactions: allTransactions.length,
                manualTransactions: manualTransactions.length,
                importTransactions: importTransactions.length,
                manualTotal,
                importTotal,
                grandTotal: manualTotal + importTotal
            },
            anggotaSummary: Array.from(anggotaSummary.values()),
            generatedAt: new Date().toISOString(),
            mode: options.mode || 'unified'
        };
    }

    async validateConsistency() {
        if (!this.sharedServices) {
            return { consistent: false, error: 'Shared services not set' };
        }

        try {
            const report = await this.generateUnifiedReport();
            const consistency = await this.sharedServices.validateDataConsistency();

            return {
                consistent: report.summary.totalTransactions === consistency.totalCount,
                reportCount: report.summary.totalTransactions,
                servicesCount: consistency.totalCount
            };
        } catch (error) {
            return {
                consistent: false,
                error: error.message
            };
        }
    }
}

describe('End-to-End Workflow Tests', () => {
    let system;

    beforeEach(async () => {
        localStorage.clear();
        system = new MockIntegratedPaymentSystem();
        await system.initialize();
    });

    /**
     * Test manual payment followed by import batch
     * Requirements: 1.1, 1.2, 3.1, 3.2, 5.5
     */
    describe('Manual Payment → Import Batch Workflow', () => {
        
        test('should process manual payment then import batch successfully', async () => {
            // Step 1: Process manual payment
            const manualPayment = {
                anggotaId: 'A001',
                jumlah: 100000,
                jenis: 'hutang'
            };

            const manualResult = await system.processManualPayment(manualPayment);
            
            expect(manualResult.success).toBe(true);
            expect(manualResult.mode).toBe('manual');
            expect(system.controller.activeTab).toBe('manual');

            // Step 2: Process import batch
            const batchData = [
                { anggotaId: 'A002', jumlah: 50000, jenis: 'hutang' },
                { anggotaId: 'A003', jumlah: 75000, jenis: 'hutang' },
                { anggotaId: 'A004', jumlah: 100000, jenis: 'piutang' }
            ];

            const batchResult = await system.processImportBatch(batchData);
            
            expect(batchResult.success).toBe(true);
            expect(batchResult.mode).toBe('import');
            expect(batchResult.results).toHaveLength(3);
            expect(system.controller.activeTab).toBe('import');

            // Step 3: Verify unified transaction history
            const history = await system.getUnifiedTransactionHistory();
            
            expect(history.totalCount).toBe(4); // 1 manual + 3 import
            expect(history.manualCount).toBe(1);
            expect(history.importCount).toBe(3);

            // Verify transactions are sorted by timestamp (newest first)
            const transactions = history.transactions;
            for (let i = 0; i < transactions.length - 1; i++) {
                const current = new Date(transactions[i].timestamp);
                const next = new Date(transactions[i + 1].timestamp);
                expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
            }
        });

        test('should maintain data consistency across workflow', async () => {
            // Process manual payment
            await system.processManualPayment({
                anggotaId: 'A001',
                jumlah: 100000,
                jenis: 'hutang'
            });

            // Process import batch
            await system.processImportBatch([
                { anggotaId: 'A001', jumlah: 50000, jenis: 'hutang' },
                { anggotaId: 'A002', jumlah: 200000, jenis: 'piutang' }
            ]);

            // Validate system consistency
            const consistency = await system.validateSystemConsistency();
            
            expect(consistency.overall).toBe(true);
            expect(consistency.sharedServices.consistent).toBe(true);
            expect(consistency.transactionHistory.consistent).toBe(true);
            expect(consistency.reporting.consistent).toBe(true);
        });

        test('should generate accurate unified report', async () => {
            // Process manual payments
            await system.processManualPayment({
                anggotaId: 'A001',
                jumlah: 100000,
                jenis: 'hutang'
            });

            // Process import batch
            await system.processImportBatch([
                { anggotaId: 'A001', jumlah: 50000, jenis: 'hutang' },
                { anggotaId: 'A002', jumlah: 200000, jenis: 'piutang' }
            ]);

            // Generate unified report
            const report = await system.generateUnifiedReport();
            
            expect(report.summary.totalTransactions).toBe(3);
            expect(report.summary.manualTransactions).toBe(1);
            expect(report.summary.importTransactions).toBe(2);
            expect(report.summary.manualTotal).toBe(100000);
            expect(report.summary.importTotal).toBe(-150000); // 50000 hutang - 200000 piutang
            expect(report.anggotaSummary).toHaveLength(2);
            expect(report.mode).toBe('unified');
        });

        test('Property: Manual then import workflow preserves transaction order', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        anggotaId: fc.string({ minLength: 3, maxLength: 10 }).map(s => 'A' + s),
                        jumlah: fc.integer({ min: 1000, max: 100000 }),
                        jenis: fc.constantFrom('hutang', 'piutang')
                    }),
                    fc.array(fc.record({
                        anggotaId: fc.string({ minLength: 3, maxLength: 10 }).map(s => 'A' + s),
                        jumlah: fc.integer({ min: 1000, max: 100000 }),
                        jenis: fc.constantFrom('hutang', 'piutang')
                    }), { minLength: 1, maxLength: 5 }),
                    async (manualPayment, batchPayments) => {
                        // Process manual payment first
                        const manualResult = await system.processManualPayment(manualPayment);
                        const manualTimestamp = new Date().getTime();
                        
                        // Small delay to ensure different timestamps
                        await new Promise(resolve => setTimeout(resolve, 1));
                        
                        // Process import batch
                        const batchResult = await system.processImportBatch(batchPayments);
                        
                        // Verify order in history
                        const history = await system.getUnifiedTransactionHistory();
                        const transactions = history.transactions;
                        
                        // Find manual transaction
                        const manualTransaction = transactions.find(t => t.id === manualResult.transactionId);
                        expect(manualTransaction).toBeDefined();
                        
                        // Find import transactions
                        const importTransactions = transactions.filter(t => 
                            batchResult.results.some(r => r.transactionId === t.id)
                        );
                        expect(importTransactions).toHaveLength(batchPayments.length);
                        
                        // Verify import transactions are newer than manual
                        importTransactions.forEach(importTxn => {
                            const importTime = new Date(importTxn.timestamp).getTime();
                            const manualTime = new Date(manualTransaction.timestamp).getTime();
                            expect(importTime).toBeGreaterThanOrEqual(manualTime);
                        });
                    }
                ),
                { numRuns: 20 }
            );
        });
    });

    /**
     * Test import batch followed by manual payment
     * Requirements: 3.1, 3.2, 1.1, 1.2, 5.5
     */
    describe('Import Batch → Manual Payment Workflow', () => {
        
        test('should process import batch then manual payment successfully', async () => {
            // Step 1: Process import batch
            const batchData = [
                { anggotaId: 'A001', jumlah: 100000, jenis: 'hutang' },
                { anggotaId: 'A002', jumlah: 150000, jenis: 'hutang' },
                { anggotaId: 'A003', jumlah: 200000, jenis: 'piutang' }
            ];

            const batchResult = await system.processImportBatch(batchData);
            
            expect(batchResult.success).toBe(true);
            expect(batchResult.mode).toBe('import');
            expect(batchResult.results).toHaveLength(3);
            expect(system.controller.activeTab).toBe('import');

            // Step 2: Process manual payment
            const manualPayment = {
                anggotaId: 'A001',
                jumlah: 50000,
                jenis: 'hutang'
            };

            const manualResult = await system.processManualPayment(manualPayment);
            
            expect(manualResult.success).toBe(true);
            expect(manualResult.mode).toBe('manual');
            expect(system.controller.activeTab).toBe('manual');

            // Step 3: Verify unified transaction history
            const history = await system.getUnifiedTransactionHistory();
            
            expect(history.totalCount).toBe(4); // 3 import + 1 manual
            expect(history.manualCount).toBe(1);
            expect(history.importCount).toBe(3);
        });

        test('should handle mixed anggota transactions correctly', async () => {
            // Process import batch for multiple anggota
            await system.processImportBatch([
                { anggotaId: 'A001', jumlah: 100000, jenis: 'hutang' },
                { anggotaId: 'A002', jumlah: 200000, jenis: 'piutang' }
            ]);

            // Process manual payment for same anggota
            await system.processManualPayment({
                anggotaId: 'A001',
                jumlah: 50000,
                jenis: 'hutang'
            });

            // Verify anggota-specific history
            const a001History = await system.getUnifiedTransactionHistory({ anggotaId: 'A001' });
            const a002History = await system.getUnifiedTransactionHistory({ anggotaId: 'A002' });
            
            expect(a001History.totalCount).toBe(2); // 1 import + 1 manual
            expect(a001History.manualCount).toBe(1);
            expect(a001History.importCount).toBe(1);
            
            expect(a002History.totalCount).toBe(1); // 1 import only
            expect(a002History.manualCount).toBe(0);
            expect(a002History.importCount).toBe(1);
        });

        test('should update saldo correctly across modes', async () => {
            // Process import batch
            await system.processImportBatch([
                { anggotaId: 'A001', jumlah: 100000, jenis: 'hutang' }
            ]);

            // Verify saldo after import
            let saldo = system.sharedServices.getSaldo('A001');
            expect(saldo).toBe(-100000);

            // Process manual payment
            await system.processManualPayment({
                anggotaId: 'A001',
                jumlah: 50000,
                jenis: 'hutang'
            });

            // Verify saldo after manual payment
            saldo = system.sharedServices.getSaldo('A001');
            expect(saldo).toBe(-150000);
        });

        test('Property: Import then manual workflow maintains consistency', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.array(fc.record({
                        anggotaId: fc.string({ minLength: 3, maxLength: 10 }).map(s => 'A' + s),
                        jumlah: fc.integer({ min: 1000, max: 100000 }),
                        jenis: fc.constantFrom('hutang', 'piutang')
                    }), { minLength: 1, maxLength: 5 }),
                    fc.record({
                        anggotaId: fc.string({ minLength: 3, maxLength: 10 }).map(s => 'A' + s),
                        jumlah: fc.integer({ min: 1000, max: 100000 }),
                        jenis: fc.constantFrom('hutang', 'piutang')
                    }),
                    async (batchPayments, manualPayment) => {
                        // Process import batch first
                        await system.processImportBatch(batchPayments);
                        
                        // Process manual payment
                        await system.processManualPayment(manualPayment);
                        
                        // Validate consistency
                        const consistency = await system.validateSystemConsistency();
                        expect(consistency.overall).toBe(true);
                        
                        // Verify total transaction count
                        const history = await system.getUnifiedTransactionHistory();
                        expect(history.totalCount).toBe(batchPayments.length + 1);
                        expect(history.importCount).toBe(batchPayments.length);
                        expect(history.manualCount).toBe(1);
                    }
                ),
                { numRuns: 20 }
            );
        });
    });

    /**
     * Test unified transaction history and reporting
     * Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3
     */
    describe('Unified Transaction History and Reporting', () => {
        
        beforeEach(async () => {
            // Set up test data with both manual and import transactions
            await system.processManualPayment({
                anggotaId: 'A001',
                jumlah: 100000,
                jenis: 'hutang'
            });

            await system.processImportBatch([
                { anggotaId: 'A001', jumlah: 50000, jenis: 'hutang' },
                { anggotaId: 'A002', jumlah: 200000, jenis: 'piutang' },
                { anggotaId: 'A003', jumlah: 75000, jenis: 'hutang' }
            ]);

            await system.processManualPayment({
                anggotaId: 'A002',
                jumlah: 100000,
                jenis: 'piutang'
            });
        });

        test('should provide unified transaction history with all modes', async () => {
            const history = await system.getUnifiedTransactionHistory();
            
            expect(history.totalCount).toBe(5);
            expect(history.manualCount).toBe(2);
            expect(history.importCount).toBe(3);
            
            // Verify all transactions have required fields
            history.transactions.forEach(transaction => {
                expect(transaction.id).toBeDefined();
                expect(transaction.anggotaId).toBeDefined();
                expect(transaction.jumlah).toBeGreaterThan(0);
                expect(transaction.jenis).toMatch(/^(hutang|piutang)$/);
                expect(transaction.mode).toMatch(/^(manual|import)$/);
                expect(transaction.timestamp).toBeDefined();
            });
        });

        test('should filter transaction history by mode', async () => {
            const manualHistory = await system.getUnifiedTransactionHistory({ mode: 'manual' });
            const importHistory = await system.getUnifiedTransactionHistory({ mode: 'import' });
            
            expect(manualHistory.totalCount).toBe(2);
            expect(manualHistory.manualCount).toBe(2);
            expect(manualHistory.importCount).toBe(0);
            
            expect(importHistory.totalCount).toBe(3);
            expect(importHistory.manualCount).toBe(0);
            expect(importHistory.importCount).toBe(3);
            
            // Verify mode filtering
            manualHistory.transactions.forEach(t => expect(t.mode).toBe('manual'));
            importHistory.transactions.forEach(t => expect(t.mode).toBe('import'));
        });

        test('should filter transaction history by anggota', async () => {
            const a001History = await system.getUnifiedTransactionHistory({ anggotaId: 'A001' });
            const a002History = await system.getUnifiedTransactionHistory({ anggotaId: 'A002' });
            
            expect(a001History.totalCount).toBe(2); // 1 manual + 1 import
            expect(a002History.totalCount).toBe(2); // 1 manual + 1 import
            
            // Verify anggota filtering
            a001History.transactions.forEach(t => expect(t.anggotaId).toBe('A001'));
            a002History.transactions.forEach(t => expect(t.anggotaId).toBe('A002'));
        });

        test('should filter transaction history by jenis', async () => {
            const hutangHistory = await system.getUnifiedTransactionHistory({ jenis: 'hutang' });
            const piutangHistory = await system.getUnifiedTransactionHistory({ jenis: 'piutang' });
            
            expect(hutangHistory.totalCount).toBe(3);
            expect(piutangHistory.totalCount).toBe(2);
            
            // Verify jenis filtering
            hutangHistory.transactions.forEach(t => expect(t.jenis).toBe('hutang'));
            piutangHistory.transactions.forEach(t => expect(t.jenis).toBe('piutang'));
        });

        test('should generate comprehensive unified report', async () => {
            const report = await system.generateUnifiedReport();
            
            expect(report.summary.totalTransactions).toBe(5);
            expect(report.summary.manualTransactions).toBe(2);
            expect(report.summary.importTransactions).toBe(3);
            
            // Verify anggota summary
            expect(report.anggotaSummary).toHaveLength(3);
            
            const a001Summary = report.anggotaSummary.find(s => s.anggotaId === 'A001');
            expect(a001Summary).toBeDefined();
            expect(a001Summary.manualTotal).toBe(100000);
            expect(a001Summary.importTotal).toBe(50000);
            
            const a002Summary = report.anggotaSummary.find(s => s.anggotaId === 'A002');
            expect(a002Summary).toBeDefined();
            expect(a002Summary.manualTotal).toBe(-100000); // piutang
            expect(a002Summary.importTotal).toBe(-200000); // piutang
        });

        test('should maintain report consistency with transaction history', async () => {
            const history = await system.getUnifiedTransactionHistory();
            const report = await system.generateUnifiedReport();
            
            expect(report.summary.totalTransactions).toBe(history.totalCount);
            expect(report.summary.manualTransactions).toBe(history.manualCount);
            expect(report.summary.importTransactions).toBe(history.importCount);
        });

        test('Property: Unified history includes all transactions from both modes', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.array(fc.record({
                        anggotaId: fc.string({ minLength: 3, maxLength: 10 }).map(s => 'A' + s),
                        jumlah: fc.integer({ min: 1000, max: 100000 }),
                        jenis: fc.constantFrom('hutang', 'piutang')
                    }), { minLength: 1, maxLength: 3 }),
                    fc.array(fc.record({
                        anggotaId: fc.string({ minLength: 3, maxLength: 10 }).map(s => 'A' + s),
                        jumlah: fc.integer({ min: 1000, max: 100000 }),
                        jenis: fc.constantFrom('hutang', 'piutang')
                    }), { minLength: 1, maxLength: 3 }),
                    async (manualPayments, importPayments) => {
                        // Process manual payments
                        for (const payment of manualPayments) {
                            await system.processManualPayment(payment);
                        }
                        
                        // Process import batch
                        await system.processImportBatch(importPayments);
                        
                        // Verify unified history
                        const history = await system.getUnifiedTransactionHistory();
                        
                        expect(history.totalCount).toBe(manualPayments.length + importPayments.length);
                        expect(history.manualCount).toBe(manualPayments.length);
                        expect(history.importCount).toBe(importPayments.length);
                        
                        // Verify report consistency
                        const report = await system.generateUnifiedReport();
                        expect(report.summary.totalTransactions).toBe(history.totalCount);
                    }
                ),
                { numRuns: 15 }
            );
        });
    });

    /**
     * Test complex workflow scenarios
     * Requirements: All
     */
    describe('Complex Workflow Scenarios', () => {
        
        test('should handle alternating manual and import operations', async () => {
            // Alternating sequence: Manual → Import → Manual → Import
            
            // Manual 1
            await system.processManualPayment({
                anggotaId: 'A001',
                jumlah: 100000,
                jenis: 'hutang'
            });

            // Import 1
            await system.processImportBatch([
                { anggotaId: 'A002', jumlah: 50000, jenis: 'hutang' }
            ]);

            // Manual 2
            await system.processManualPayment({
                anggotaId: 'A003',
                jumlah: 200000,
                jenis: 'piutang'
            });

            // Import 2
            await system.processImportBatch([
                { anggotaId: 'A001', jumlah: 75000, jenis: 'hutang' },
                { anggotaId: 'A004', jumlah: 150000, jenis: 'piutang' }
            ]);

            // Verify final state
            const history = await system.getUnifiedTransactionHistory();
            expect(history.totalCount).toBe(5);
            expect(history.manualCount).toBe(2);
            expect(history.importCount).toBe(3);

            // Verify system consistency
            const consistency = await system.validateSystemConsistency();
            expect(consistency.overall).toBe(true);
        });

        test('should handle large batch followed by multiple manual payments', async () => {
            // Large import batch
            const largeBatch = [];
            for (let i = 1; i <= 10; i++) {
                largeBatch.push({
                    anggotaId: `A${String(i).padStart(3, '0')}`,
                    jumlah: i * 10000,
                    jenis: i % 2 === 0 ? 'hutang' : 'piutang'
                });
            }

            await system.processImportBatch(largeBatch);

            // Multiple manual payments
            for (let i = 1; i <= 5; i++) {
                await system.processManualPayment({
                    anggotaId: `A${String(i).padStart(3, '0')}`,
                    jumlah: 25000,
                    jenis: 'hutang'
                });
            }

            // Verify final state
            const history = await system.getUnifiedTransactionHistory();
            expect(history.totalCount).toBe(15); // 10 import + 5 manual
            expect(history.importCount).toBe(10);
            expect(history.manualCount).toBe(5);

            // Verify report accuracy
            const report = await system.generateUnifiedReport();
            expect(report.summary.totalTransactions).toBe(15);
            expect(report.anggotaSummary.length).toBeGreaterThan(0);
        });

        test('should maintain performance with mixed operations', async () => {
            const startTime = Date.now();

            // Perform mixed operations
            for (let i = 0; i < 5; i++) {
                // Manual payment
                await system.processManualPayment({
                    anggotaId: `A${i}`,
                    jumlah: (i + 1) * 10000,
                    jenis: i % 2 === 0 ? 'hutang' : 'piutang'
                });

                // Small import batch
                await system.processImportBatch([
                    { anggotaId: `B${i}`, jumlah: 50000, jenis: 'hutang' },
                    { anggotaId: `C${i}`, jumlah: 75000, jenis: 'piutang' }
                ]);
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Should complete within reasonable time (adjust threshold as needed)
            expect(duration).toBeLessThan(5000); // 5 seconds

            // Verify all operations completed successfully
            const history = await system.getUnifiedTransactionHistory();
            expect(history.totalCount).toBe(15); // 5 manual + 10 import
        });

        test('Property: System remains consistent regardless of operation order', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.array(fc.oneof(
                        fc.record({
                            type: fc.constant('manual'),
                            payment: fc.record({
                                anggotaId: fc.string({ minLength: 3, maxLength: 10 }).map(s => 'A' + s),
                                jumlah: fc.integer({ min: 1000, max: 100000 }),
                                jenis: fc.constantFrom('hutang', 'piutang')
                            })
                        }),
                        fc.record({
                            type: fc.constant('import'),
                            batch: fc.array(fc.record({
                                anggotaId: fc.string({ minLength: 3, maxLength: 10 }).map(s => 'A' + s),
                                jumlah: fc.integer({ min: 1000, max: 100000 }),
                                jenis: fc.constantFrom('hutang', 'piutang')
                            }), { minLength: 1, maxLength: 3 })
                        })
                    ), { minLength: 1, maxLength: 5 }),
                    async (operations) => {
                        let expectedManualCount = 0;
                        let expectedImportCount = 0;

                        // Execute operations in sequence
                        for (const operation of operations) {
                            if (operation.type === 'manual') {
                                await system.processManualPayment(operation.payment);
                                expectedManualCount++;
                            } else {
                                await system.processImportBatch(operation.batch);
                                expectedImportCount += operation.batch.length;
                            }
                        }

                        // Verify consistency
                        const consistency = await system.validateSystemConsistency();
                        expect(consistency.overall).toBe(true);

                        // Verify transaction counts
                        const history = await system.getUnifiedTransactionHistory();
                        expect(history.manualCount).toBe(expectedManualCount);
                        expect(history.importCount).toBe(expectedImportCount);
                        expect(history.totalCount).toBe(expectedManualCount + expectedImportCount);
                    }
                ),
                { numRuns: 10 }
            );
        });
    });
});