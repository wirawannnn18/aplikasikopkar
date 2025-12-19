/**
 * Report Generator Tests
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import fc from 'fast-check';

// Import the class to test
let ReportGenerator;

beforeAll(() => {
    // Mock window and document for browser environment tests
    global.window = {
        URL: {
            createObjectURL: jest.fn(() => 'mock-url'),
            revokeObjectURL: jest.fn()
        }
    };
    
    // Mock Blob constructor
    global.Blob = jest.fn((content, options) => ({ content, options }));

    global.document = {
        createElement: jest.fn(() => {
            const mockElement = {
                href: '',
                download: '',
                style: { display: '' },
                click: jest.fn(),
                remove: jest.fn()
            };
            return mockElement;
        }),
        body: {
            appendChild: jest.fn(),
            removeChild: jest.fn()
        }
    };

    // Mock console methods to avoid noise in tests
    global.console = {
        ...console,
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn()
    };

    // Use require for CommonJS compatibility
    const module = require('../../js/import-tagihan/ReportGenerator.js');
    ReportGenerator = module.ReportGenerator;
});

describe('ReportGenerator', () => {
    let reportGenerator;

    beforeEach(() => {
        jest.clearAllMocks();
        reportGenerator = new ReportGenerator();
    });

    describe('Constructor', () => {
        test('should initialize with default settings', () => {
            expect(reportGenerator.reportCounter).toBe(0);
        });
    });

    describe('Processing Report Generation', () => {
        test('generateProcessingReport should create comprehensive report', () => {
            const reportData = {
                batchId: 'batch123',
                fileName: 'test.csv',
                results: {
                    totalProcessed: 100,
                    successCount: 90,
                    failureCount: 10,
                    successTransactions: [
                        {
                            id: 'trans1',
                            anggotaNIK: '001',
                            anggotaNama: 'John Doe',
                            jenis: 'hutang',
                            jumlah: 500000,
                            keterangan: 'Test payment',
                            saldoSebelum: 1000000,
                            saldoSesudah: 500000,
                            createdAt: new Date()
                        }
                    ],
                    failedTransactions: [
                        {
                            rowNumber: 2,
                            memberNumber: '002',
                            memberName: 'Jane Smith',
                            paymentType: 'piutang',
                            amount: 300000,
                            error: 'Insufficient balance',
                            errorCode: 'INSUFFICIENT_BALANCE'
                        }
                    ],
                    summary: {
                        totalAmount: 500000,
                        totalHutang: 500000,
                        totalPiutang: 0
                    }
                },
                kasirId: 'kasir123',
                kasirNama: 'Test Kasir',
                processedAt: new Date()
            };

            const report = reportGenerator.generateProcessingReport(reportData);

            expect(report).toHaveProperty('metadata');
            expect(report).toHaveProperty('summary');
            expect(report).toHaveProperty('successTransactions');
            expect(report).toHaveProperty('failedTransactions');
            expect(report).toHaveProperty('statistics');
            expect(report).toHaveProperty('auditInfo');

            // Verify metadata
            expect(report.metadata.batchId).toBe('batch123');
            expect(report.metadata.kasirNama).toBe('Test Kasir');

            // Verify summary
            expect(report.summary.totalProcessed).toBe(100);
            expect(report.summary.successCount).toBe(90);
            expect(report.summary.failureCount).toBe(10);
            expect(report.summary.successRate).toBe('90.00');

            // Verify success transactions
            expect(report.successTransactions.count).toBe(1);
            expect(report.successTransactions.transactions[0].transactionId).toBe('trans1');

            // Verify failed transactions
            expect(report.failedTransactions.count).toBe(1);
            expect(report.failedTransactions.transactions[0].error).toBe('Insufficient balance');
        });
    });

    describe('CSV Export Generation', () => {
        test('generateCSVExport should create proper CSV content', () => {
            const report = {
                metadata: {
                    batchId: 'batch123',
                    originalFileName: 'test.csv',
                    kasirNama: 'Test Kasir',
                    kasirId: 'kasir123',
                    processedAt: new Date(),
                    generatedAt: new Date()
                },
                summary: {
                    totalProcessed: 100,
                    successCount: 90,
                    failureCount: 10,
                    successRate: '90.00',
                    failureRate: '10.00',
                    formattedTotalAmount: 'Rp 500.000',
                    formattedTotalHutang: 'Rp 500.000',
                    formattedTotalPiutang: 'Rp 0'
                },
                successTransactions: {
                    count: 1,
                    transactions: [{
                        transactionId: 'trans1',
                        memberNumber: '001',
                        memberName: 'John Doe',
                        paymentType: 'hutang',
                        amount: 500000,
                        formattedAmount: 'Rp 500.000',
                        description: 'Test payment',
                        balanceBefore: 1000000,
                        balanceAfter: 500000,
                        processedAt: new Date()
                    }]
                },
                failedTransactions: {
                    count: 1,
                    transactions: [{
                        rowNumber: 2,
                        memberNumber: '002',
                        memberName: 'Jane Smith',
                        paymentType: 'piutang',
                        amount: 300000,
                        formattedAmount: 'Rp 300.000',
                        error: 'Insufficient balance'
                    }]
                },
                statistics: {
                    paymentTypeBreakdown: {
                        hutang: { count: 1, totalAmount: 500000, formattedTotalAmount: 'Rp 500.000', averageAmount: 500000 },
                        piutang: { count: 0, totalAmount: 0, formattedTotalAmount: 'Rp 0', averageAmount: 0 }
                    },
                    amountRanges: {
                        'under_100k': { count: 0 },
                        '100k_500k': { count: 1 },
                        '500k_1m': { count: 0 },
                        '1m_5m': { count: 0 },
                        'over_5m': { count: 0 }
                    }
                }
            };

            const csvExport = reportGenerator.generateCSVExport(report);

            expect(csvExport).toHaveProperty('filename');
            expect(csvExport).toHaveProperty('content');
            expect(csvExport).toHaveProperty('mimeType', 'text/csv');
            expect(csvExport).toHaveProperty('size');
            expect(csvExport).toHaveProperty('timestamp');

            // Verify filename format
            expect(csvExport.filename).toMatch(/^laporan_import_tagihan_batch123_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}_\d+\.csv$/);

            // Verify content includes all sections
            expect(csvExport.content).toContain('LAPORAN IMPORT TAGIHAN PEMBAYARAN HUTANG PIUTANG');
            expect(csvExport.content).toContain('RINGKASAN');
            expect(csvExport.content).toContain('TRANSAKSI BERHASIL');
            expect(csvExport.content).toContain('TRANSAKSI GAGAL');
            expect(csvExport.content).toContain('STATISTIK');

            // Verify specific data
            expect(csvExport.content).toContain('batch123');
            expect(csvExport.content).toContain('Test Kasir');
            expect(csvExport.content).toContain('trans1');
            expect(csvExport.content).toContain('John Doe');
            expect(csvExport.content).toContain('Jane Smith');
            expect(csvExport.content).toContain('Insufficient balance');
        });
    });

    describe('HTML Report Generation', () => {
        test('generateHTMLReport should create proper HTML content', () => {
            const report = {
                metadata: {
                    batchId: 'batch123',
                    originalFileName: 'test.csv',
                    kasirNama: 'Test Kasir',
                    processedAt: new Date()
                },
                summary: {
                    totalProcessed: 100,
                    successCount: 90,
                    failureCount: 10,
                    formattedTotalAmount: 'Rp 500.000'
                },
                successTransactions: {
                    count: 1,
                    transactions: [{
                        transactionId: 'trans1',
                        memberNumber: '001',
                        memberName: 'John Doe',
                        paymentType: 'hutang',
                        formattedAmount: 'Rp 500.000',
                        description: 'Test payment'
                    }]
                },
                failedTransactions: {
                    count: 1,
                    transactions: [{
                        rowNumber: 2,
                        memberNumber: '002',
                        memberName: 'Jane Smith',
                        paymentType: 'piutang',
                        formattedAmount: 'Rp 300.000',
                        error: 'Insufficient balance'
                    }]
                },
                statistics: {
                    paymentTypeBreakdown: {
                        hutang: { count: 1, formattedTotalAmount: 'Rp 500.000' },
                        piutang: { count: 0, formattedTotalAmount: 'Rp 0' }
                    },
                    amountRanges: {
                        'under_100k': { count: 0 },
                        '100k_500k': { count: 1 },
                        '500k_1m': { count: 0 },
                        '1m_5m': { count: 0 },
                        'over_5m': { count: 0 }
                    }
                }
            };

            const htmlReport = reportGenerator.generateHTMLReport(report);

            expect(typeof htmlReport).toBe('string');
            expect(htmlReport).toContain('Laporan Import Tagihan Pembayaran');
            expect(htmlReport).toContain('batch123');
            expect(htmlReport).toContain('Test Kasir');
            expect(htmlReport).toContain('trans1');
            expect(htmlReport).toContain('John Doe');
            expect(htmlReport).toContain('Jane Smith');
            expect(htmlReport).toContain('Insufficient balance');
            expect(htmlReport).toContain('class="import-report"');
        });
    });

    describe('CSV Download', () => {
        test('downloadCSVReport should attempt download in browser environment', () => {
            const report = {
                metadata: {
                    batchId: 'batch123',
                    originalFileName: 'test.csv',
                    kasirNama: 'Test Kasir',
                    processedAt: new Date()
                },
                summary: {
                    totalProcessed: 100,
                    successCount: 90,
                    failureCount: 10,
                    formattedTotalAmount: 'Rp 500.000'
                },
                successTransactions: { count: 0, transactions: [] },
                failedTransactions: { count: 0, transactions: [] },
                statistics: {
                    paymentTypeBreakdown: {
                        hutang: { count: 0, formattedTotalAmount: 'Rp 0' },
                        piutang: { count: 0, formattedTotalAmount: 'Rp 0' }
                    },
                    amountRanges: {
                        'under_100k': { count: 0 },
                        '100k_500k': { count: 0 },
                        '500k_1m': { count: 0 },
                        '1m_5m': { count: 0 },
                        'over_5m': { count: 0 }
                    }
                }
            };

            // The function should not throw an error and should attempt to use browser APIs
            expect(() => reportGenerator.downloadCSVReport(report)).not.toThrow();
            
            // Verify that the CSV export generation works (which is the core functionality)
            const csvExport = reportGenerator.generateCSVExport(report);
            expect(csvExport).toHaveProperty('filename');
            expect(csvExport).toHaveProperty('content');
            expect(csvExport.content).toContain('batch123');
        });
    });

    /**
     * Property 7: Report generation accuracy
     * Feature: import-tagihan-pembayaran, Property 7: Report generation accuracy
     * Validates: Requirements 6.1, 6.2
     */
    describe('Property 7: Report generation accuracy', () => {
        test('Property 7: Generated reports should accurately count successful and failed transactions with complete details', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        batchId: fc.string({ minLength: 1, maxLength: 20 }),
                        fileName: fc.string({ minLength: 1, maxLength: 50 }),
                        kasirId: fc.string({ minLength: 1, maxLength: 20 }),
                        kasirNama: fc.string({ minLength: 1, maxLength: 50 }),
                        successCount: fc.integer({ min: 0, max: 100 }),
                        failureCount: fc.integer({ min: 0, max: 100 }),
                        baseAmount: fc.integer({ min: 10000, max: 1000000 })
                    }),
                    (testData) => {
                        const totalProcessed = testData.successCount + testData.failureCount;
                        
                        // Skip if no transactions to process
                        if (totalProcessed === 0) return true;

                        // Generate success transactions
                        const successTransactions = [];
                        for (let i = 0; i < testData.successCount; i++) {
                            successTransactions.push({
                                id: `trans_success_${i}`,
                                anggotaNIK: `member_${i}`,
                                anggotaNama: `Member ${i}`,
                                jenis: i % 2 === 0 ? 'hutang' : 'piutang',
                                jumlah: testData.baseAmount + (i * 1000),
                                keterangan: `Payment ${i}`,
                                saldoSebelum: testData.baseAmount * 2,
                                saldoSesudah: testData.baseAmount,
                                createdAt: new Date()
                            });
                        }

                        // Generate failed transactions
                        const failedTransactions = [];
                        for (let i = 0; i < testData.failureCount; i++) {
                            failedTransactions.push({
                                rowNumber: testData.successCount + i + 1,
                                memberNumber: `failed_member_${i}`,
                                memberName: `Failed Member ${i}`,
                                paymentType: i % 2 === 0 ? 'hutang' : 'piutang',
                                amount: testData.baseAmount + (i * 500),
                                error: `Error ${i}: Validation failed`,
                                errorCode: 'VALIDATION_ERROR'
                            });
                        }

                        // Calculate totals
                        const totalAmount = successTransactions.reduce((sum, t) => sum + t.jumlah, 0);
                        const totalHutang = successTransactions.filter(t => t.jenis === 'hutang').reduce((sum, t) => sum + t.jumlah, 0);
                        const totalPiutang = successTransactions.filter(t => t.jenis === 'piutang').reduce((sum, t) => sum + t.jumlah, 0);

                        const reportData = {
                            batchId: testData.batchId,
                            fileName: testData.fileName,
                            results: {
                                totalProcessed: totalProcessed,
                                successCount: testData.successCount,
                                failureCount: testData.failureCount,
                                successTransactions: successTransactions,
                                failedTransactions: failedTransactions,
                                summary: {
                                    totalAmount: totalAmount,
                                    totalHutang: totalHutang,
                                    totalPiutang: totalPiutang
                                }
                            },
                            kasirId: testData.kasirId,
                            kasirNama: testData.kasirNama,
                            processedAt: new Date()
                        };

                        // Generate report
                        const report = reportGenerator.generateProcessingReport(reportData);

                        // Verify accurate transaction counts (Requirements 6.1)
                        const countsAccurate = 
                            report.summary.totalProcessed === totalProcessed &&
                            report.summary.successCount === testData.successCount &&
                            report.summary.failureCount === testData.failureCount &&
                            report.successTransactions.count === testData.successCount &&
                            report.failedTransactions.count === testData.failureCount;

                        // Verify success rate calculations are accurate
                        const expectedSuccessRate = totalProcessed > 0 ? ((testData.successCount / totalProcessed) * 100).toFixed(2) : '0.00';
                        const expectedFailureRate = totalProcessed > 0 ? ((testData.failureCount / totalProcessed) * 100).toFixed(2) : '0.00';
                        const ratesAccurate = 
                            report.summary.successRate === expectedSuccessRate &&
                            report.summary.failureRate === expectedFailureRate;

                        // Verify transaction IDs are included for successful payments (Requirements 6.2)
                        const successTransactionIdsComplete = report.successTransactions.transactions.every(t => 
                            t.transactionId && 
                            t.transactionId.startsWith('trans_success_') &&
                            t.memberNumber &&
                            t.memberName &&
                            t.paymentType &&
                            t.amount > 0 &&
                            t.formattedAmount &&
                            t.description
                        );

                        // Verify failure details are included for failed transactions (Requirements 6.2)
                        const failedTransactionDetailsComplete = report.failedTransactions.transactions.every(t => 
                            t.rowNumber > 0 &&
                            t.memberNumber &&
                            t.memberName &&
                            t.paymentType &&
                            t.amount > 0 &&
                            t.formattedAmount &&
                            t.error &&
                            t.errorCode
                        );

                        // Verify amount calculations are accurate
                        const amountsAccurate = 
                            report.summary.totalAmount === totalAmount &&
                            report.summary.totalHutang === totalHutang &&
                            report.summary.totalPiutang === totalPiutang;

                        // Verify metadata completeness
                        const metadataComplete = 
                            report.metadata.batchId === testData.batchId &&
                            report.metadata.originalFileName === testData.fileName &&
                            report.metadata.kasirId === testData.kasirId &&
                            report.metadata.kasirNama === testData.kasirNama &&
                            report.metadata.processedAt &&
                            report.metadata.generatedAt;

                        // Verify statistics are calculated correctly
                        const hutangTransactions = successTransactions.filter(t => t.jenis === 'hutang');
                        const piutangTransactions = successTransactions.filter(t => t.jenis === 'piutang');
                        const statisticsAccurate = 
                            report.statistics.paymentTypeBreakdown.hutang.count === hutangTransactions.length &&
                            report.statistics.paymentTypeBreakdown.piutang.count === piutangTransactions.length &&
                            report.statistics.paymentTypeBreakdown.hutang.totalAmount === totalHutang &&
                            report.statistics.paymentTypeBreakdown.piutang.totalAmount === totalPiutang;

                        // Verify CSV export maintains accuracy
                        const csvExport = reportGenerator.generateCSVExport(report);
                        const csvContentComplete = 
                            csvExport.content.includes(testData.batchId) &&
                            csvExport.content.includes(testData.kasirNama) &&
                            csvExport.content.includes(`Total Diproses,${totalProcessed}`) &&
                            csvExport.content.includes(`Berhasil,${testData.successCount}`) &&
                            csvExport.content.includes(`Gagal,${testData.failureCount}`);

                        // Verify HTML report maintains accuracy
                        const htmlReport = reportGenerator.generateHTMLReport(report);
                        const htmlContentComplete = 
                            htmlReport.includes(testData.batchId) &&
                            htmlReport.includes(testData.kasirNama) &&
                            htmlReport.includes(`${testData.successCount}`) &&
                            htmlReport.includes(`${testData.failureCount}`) &&
                            htmlReport.includes(`${totalProcessed}`);

                        return countsAccurate && 
                               ratesAccurate && 
                               successTransactionIdsComplete && 
                               failedTransactionDetailsComplete && 
                               amountsAccurate && 
                               metadataComplete && 
                               statisticsAccurate && 
                               csvContentComplete && 
                               htmlContentComplete;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Error Handling', () => {
        test('should handle empty transactions gracefully', () => {
            const reportData = {
                batchId: 'batch123',
                fileName: 'empty.csv',
                results: {
                    totalProcessed: 0,
                    successCount: 0,
                    failureCount: 0,
                    successTransactions: [],
                    failedTransactions: [],
                    summary: {
                        totalAmount: 0,
                        totalHutang: 0,
                        totalPiutang: 0
                    }
                },
                kasirId: 'kasir123',
                kasirNama: 'Test Kasir',
                processedAt: new Date()
            };

            const report = reportGenerator.generateProcessingReport(reportData);

            expect(report.summary.totalProcessed).toBe(0);
            expect(report.successTransactions.count).toBe(0);
            expect(report.failedTransactions.count).toBe(0);
            expect(report.summary.successRate).toBe('0.00');
            expect(report.summary.failureRate).toBe('0.00');
        });

        test('should handle missing summary data gracefully', () => {
            const reportData = {
                batchId: 'batch123',
                fileName: 'test.csv',
                results: {
                    totalProcessed: 1,
                    successCount: 1,
                    failureCount: 0,
                    successTransactions: [{
                        id: 'trans1',
                        anggotaNIK: '001',
                        anggotaNama: 'John Doe',
                        jenis: 'hutang',
                        jumlah: 500000,
                        keterangan: 'Test payment',
                        createdAt: new Date()
                    }],
                    failedTransactions: [],
                    summary: null // Missing summary
                },
                kasirId: 'kasir123',
                kasirNama: 'Test Kasir',
                processedAt: new Date()
            };

            const report = reportGenerator.generateProcessingReport(reportData);

            expect(report.summary.totalAmount).toBe(0);
            expect(report.summary.totalHutang).toBe(0);
            expect(report.summary.totalPiutang).toBe(0);
            expect(report.summary.formattedTotalAmount).toContain('0');
        });
    });
});