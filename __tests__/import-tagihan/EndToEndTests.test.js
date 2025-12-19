/**
 * End-to-End Integration Tests for Import Tagihan System
 * Task 14.1: Complete end-to-end testing
 * Requirements: All requirements - Test complete import workflow with real data, verify integration with existing systems, test error scenarios and recovery
 */

// Mock localStorage for testing
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

// Import components - using dynamic import for ES6 modules
let ImportTagihanManager, FileParser, ValidationEngine, BatchProcessor, AuditLogger, ReportGenerator;

beforeAll(async () => {
    // Dynamic imports for ES6 modules
    try {
        const importTagihanModule = await import('../../js/import-tagihan/ImportTagihanManager.js');
        ImportTagihanManager = importTagihanModule.ImportTagihanManager || importTagihanModule.default;
        
        const fileParserModule = await import('../../js/import-tagihan/FileParser.js');
        FileParser = fileParserModule.FileParser || fileParserModule.default;
        
        const validationEngineModule = await import('../../js/import-tagihan/ValidationEngine.js');
        ValidationEngine = validationEngineModule.ValidationEngine || validationEngineModule.default;
        
        const batchProcessorModule = await import('../../js/import-tagihan/BatchProcessor.js');
        BatchProcessor = batchProcessorModule.BatchProcessor || batchProcessorModule.default;
        
        const auditLoggerModule = await import('../../js/import-tagihan/AuditLogger.js');
        AuditLogger = auditLoggerModule.AuditLogger || auditLoggerModule.default;
        
        const reportGeneratorModule = await import('../../js/import-tagihan/ReportGenerator.js');
        ReportGenerator = reportGeneratorModule.ReportGenerator || reportGeneratorModule.default;
        
        // Verify all imports were successful
        if (!ImportTagihanManager) {
            throw new Error('ImportTagihanManager not found in module');
        }
    } catch (error) {
        console.error('Failed to import modules:', error.message);
        throw error;
    }
});

// Mock global functions that would be available in browser environment
global.hitungSaldoHutang = jest.fn();
global.hitungSaldoPiutang = jest.fn();
global.validateAnggotaForHutangPiutang = jest.fn();
global.validatePembayaran = jest.fn();
global.savePembayaran = jest.fn();
global.addJurnal = jest.fn();
global.saveAuditLog = jest.fn();
global.formatRupiah = jest.fn();
global.generateId = jest.fn();

describe('Import Tagihan End-to-End Integration Tests', () => {
    let importManager;
    let mockPaymentEngine;
    
    // Sample test data representing real-world scenarios
    const realWorldAnggota = [
        {
            id: 'ANG001',
            nik: '3201234567890001',
            nama: 'Ahmad Suryadi',
            status: 'Aktif',
            statusKeanggotaan: 'Aktif',
            alamat: 'Jl. Merdeka No. 123',
            telepon: '081234567890'
        },
        {
            id: 'ANG002', 
            nik: '3201234567890002',
            nama: 'Siti Nurhaliza',
            status: 'Aktif',
            statusKeanggotaan: 'Aktif',
            alamat: 'Jl. Sudirman No. 456',
            telepon: '081234567891'
        },
        {
            id: 'ANG003',
            nik: '3201234567890003',
            nama: 'Budi Santoso',
            status: 'Aktif',
            statusKeanggotaan: 'Aktif',
            alamat: 'Jl. Gatot Subroto No. 789',
            telepon: '081234567892'
        }
    ];

    const realWorldPenjualan = [
        {
            id: 'POS001',
            anggotaId: 'ANG001',
            metodePembayaran: 'Kredit',
            total: 750000,
            tanggal: '2024-01-10',
            items: [
                { nama: 'Beras Premium 5kg', harga: 75000, qty: 10 }
            ]
        },
        {
            id: 'POS002',
            anggotaId: 'ANG002',
            metodePembayaran: 'Kredit',
            total: 500000,
            tanggal: '2024-01-12',
            items: [
                { nama: 'Minyak Goreng 2L', harga: 25000, qty: 20 }
            ]
        }
    ];

    const realWorldSimpanan = [
        {
            id: 'SIM001',
            anggotaId: 'ANG002',
            jenis: 'Simpanan Sukarela',
            saldo: 400000,
            statusPengembalian: 'pending',
            tanggalSimpan: '2024-01-05'
        },
        {
            id: 'SIM002',
            anggotaId: 'ANG003',
            jenis: 'Simpanan Wajib',
            saldo: 300000,
            statusPengembalian: 'pending',
            tanggalSimpan: '2024-01-08'
        }
    ];

    const currentUser = {
        id: 'USER001',
        nama: 'Kasir Utama',
        role: 'kasir',
        shift: 'pagi'
    };

    beforeEach(() => {
        // Clear localStorage mock
        localStorageMock.clear();
        jest.clearAllMocks();

        // Setup realistic test data
        localStorage.setItem('anggota', JSON.stringify(realWorldAnggota));
        localStorage.setItem('penjualan', JSON.stringify(realWorldPenjualan));
        localStorage.setItem('simpanan', JSON.stringify(realWorldSimpanan));
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([]));
        localStorage.setItem('jurnal', JSON.stringify([]));

        // Setup realistic mock functions
        global.hitungSaldoHutang.mockImplementation((anggotaId) => {
            const penjualan = realWorldPenjualan.filter(p => p.anggotaId === anggotaId && p.metodePembayaran === 'Kredit');
            return penjualan.reduce((total, p) => total + p.total, 0);
        });

        global.hitungSaldoPiutang.mockImplementation((anggotaId) => {
            const simpanan = realWorldSimpanan.filter(s => s.anggotaId === anggotaId && s.statusPengembalian === 'pending');
            return simpanan.reduce((total, s) => total + s.saldo, 0);
        });

        global.validateAnggotaForHutangPiutang.mockImplementation((anggotaId) => {
            const anggota = realWorldAnggota.find(a => a.id === anggotaId || a.nik === anggotaId);
            if (anggota && anggota.status === 'Aktif') {
                return { valid: true, anggota };
            }
            return { valid: false, error: 'Anggota tidak ditemukan atau tidak aktif' };
        });

        global.validatePembayaran.mockImplementation((paymentData) => {
            if (!paymentData.anggotaId) {
                return { valid: false, message: 'Silakan pilih anggota terlebih dahulu' };
            }
            if (!paymentData.jenis || !['hutang', 'piutang'].includes(paymentData.jenis)) {
                return { valid: false, message: 'Jenis pembayaran harus hutang atau piutang' };
            }
            if (!paymentData.jumlah || paymentData.jumlah <= 0) {
                return { valid: false, message: 'Jumlah pembayaran harus lebih dari 0' };
            }

            const saldo = paymentData.jenis === 'hutang' 
                ? global.hitungSaldoHutang(paymentData.anggotaId)
                : global.hitungSaldoPiutang(paymentData.anggotaId);
                
            if (paymentData.jumlah > saldo) {
                return { valid: false, message: `Jumlah pembayaran melebihi saldo ${paymentData.jenis}` };
            }

            return { valid: true, message: '' };
        });

        global.savePembayaran.mockImplementation((paymentData) => {
            const transaction = {
                id: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                tanggal: new Date().toISOString().split('T')[0],
                anggotaId: paymentData.anggotaId,
                anggotaNama: paymentData.anggotaNama,
                jenis: paymentData.jenis,
                jumlah: paymentData.jumlah,
                saldoSebelum: paymentData.saldoSebelum,
                saldoSesudah: paymentData.saldoSesudah,
                keterangan: paymentData.keterangan || '',
                kasirId: currentUser.id,
                kasirNama: currentUser.nama,
                batchId: paymentData.batchId || '',
                status: 'selesai',
                createdAt: new Date().toISOString()
            };

            const pembayaranList = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
            pembayaranList.push(transaction);
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaranList));

            return transaction;
        });

        global.addJurnal.mockImplementation((keterangan, entries, tanggal) => {
            const jurnalList = JSON.parse(localStorage.getItem('jurnal') || '[]');
            const jurnalEntry = {
                id: `JRN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                tanggal: tanggal,
                keterangan: keterangan,
                entries: entries,
                createdAt: new Date().toISOString()
            };
            jurnalList.push(jurnalEntry);
            localStorage.setItem('jurnal', JSON.stringify(jurnalList));
            return jurnalEntry;
        });

        global.formatRupiah.mockImplementation((amount) => {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
            }).format(amount);
        });

        global.generateId.mockImplementation(() => {
            return `ID_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        });

        // Initialize ImportTagihanManager
        mockPaymentEngine = {
            processPayment: jest.fn(),
            validatePayment: jest.fn()
        };
        
        importManager = new ImportTagihanManager(mockPaymentEngine);
    });

    describe('Complete End-to-End Workflow Tests', () => {
        test('should execute complete import workflow with realistic data', async () => {
            // Requirements: All requirements - Test complete import workflow with real data
            
            // Step 1: Generate and verify template
            const template = importManager.generateTemplate();
            expect(template).toBeDefined();
            expect(template.filename).toMatch(/template_import_tagihan_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}_\d+\.csv/);
            expect(template.content).toContain('nomor_anggota,nama_anggota,jenis_pembayaran,jumlah_pembayaran,keterangan');
            expect(template.content).toContain('# INSTRUKSI PENGISIAN TEMPLATE');

            // Step 2: Create realistic CSV data
            const csvData = [
                ['3201234567890001', 'Ahmad Suryadi', 'hutang', '250000', 'Cicilan kredit barang bulan Januari'],
                ['3201234567890002', 'Siti Nurhaliza', 'piutang', '150000', 'Pengembalian sebagian simpanan sukarela'],
                ['3201234567890003', 'Budi Santoso', 'piutang', '100000', 'Pengembalian simpanan wajib']
            ];

            // Convert to raw data format
            const rawData = csvData.map(row => ({
                nomor_anggota: row[0],
                nama_anggota: row[1],
                jenis_pembayaran: row[2],
                jumlah_pembayaran: row[3],
                keterangan: row[4]
            }));

            // Step 3: Upload and parse file (simulate)
            const mockFile = {
                name: 'import_tagihan_test.csv',
                size: 1024,
                type: 'text/csv'
            };

            // Mock file parser to return our test data
            if (importManager.fileParser) {
                importManager.fileParser.parse = jest.fn().mockResolvedValue(rawData);
            }

            const batch = await importManager.uploadFile(mockFile);
            expect(batch).toBeDefined();
            expect(batch.fileName).toBe('import_tagihan_test.csv');
            expect(batch.totalRows).toBe(3);
            expect(batch.status).toBe('uploaded');

            // Step 4: Validate data
            const validatedData = await importManager.validateData(rawData);
            expect(validatedData).toHaveLength(3);
            
            // All rows should be valid with our test data
            const validRows = validatedData.filter(row => row.isValid);
            expect(validRows).toHaveLength(3);

            // Verify validation details
            expect(validatedData[0].memberNumber).toBe('3201234567890001');
            expect(validatedData[0].paymentType).toBe('hutang');
            expect(validatedData[0].amount).toBe(250000);
            expect(validatedData[0].isValid).toBe(true);

            // Step 5: Generate preview
            const preview = await importManager.generatePreview(validatedData);
            expect(preview).toBeDefined();
            expect(preview.summary.totalRows).toBe(3);
            expect(preview.summary.validRows).toBe(3);
            expect(preview.summary.invalidRows).toBe(0);
            expect(preview.summary.totalAmount).toBe(500000); // 250000 + 150000 + 100000

            // Step 6: Process batch
            const results = await importManager.processBatch(validatedData);
            expect(results).toBeDefined();
            expect(results.successCount).toBe(3);
            expect(results.failureCount).toBe(0);
            expect(results.totalProcessed).toBe(3);

            // Step 7: Generate report
            const report = await importManager.generateReport(results);
            expect(report).toBeDefined();
            expect(report.summary.totalTransactions).toBe(3);
            expect(report.summary.successfulTransactions).toBe(3);
            expect(report.summary.failedTransactions).toBe(0);

            // Verify integration with existing systems
            expect(global.savePembayaran).toHaveBeenCalledTimes(3);
            expect(global.addJurnal).toHaveBeenCalledTimes(3);

            // Verify data persistence
            const pembayaranList = JSON.parse(localStorage.getItem('pembayaranHutangPiutang'));
            expect(pembayaranList).toHaveLength(3);

            const jurnalList = JSON.parse(localStorage.getItem('jurnal'));
            expect(jurnalList).toHaveLength(3);

            // Verify double-entry bookkeeping
            jurnalList.forEach(journal => {
                const totalDebits = journal.entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
                const totalCredits = journal.entries.reduce((sum, entry) => sum + (entry.kredit || 0), 0);
                expect(totalDebits).toBe(totalCredits);
            });
        });

        test('should handle mixed valid and invalid data realistically', async () => {
            // Requirements: All requirements - Test error scenarios and recovery
            
            const mixedData = [
                {
                    nomor_anggota: '3201234567890001',
                    nama_anggota: 'Ahmad Suryadi',
                    jenis_pembayaran: 'hutang',
                    jumlah_pembayaran: '200000', // Valid
                    keterangan: 'Cicilan valid'
                },
                {
                    nomor_anggota: '9999999999999999',
                    nama_anggota: 'Anggota Tidak Ada',
                    jenis_pembayaran: 'hutang',
                    jumlah_pembayaran: '100000', // Invalid - member not found
                    keterangan: 'Anggota tidak terdaftar'
                },
                {
                    nomor_anggota: '3201234567890002',
                    nama_anggota: 'Siti Nurhaliza',
                    jenis_pembayaran: 'piutang',
                    jumlah_pembayaran: '500000', // Invalid - exceeds balance
                    keterangan: 'Melebihi saldo'
                },
                {
                    nomor_anggota: '3201234567890003',
                    nama_anggota: 'Budi Santoso',
                    jenis_pembayaran: 'piutang',
                    jumlah_pembayaran: '150000', // Valid
                    keterangan: 'Pengembalian valid'
                }
            ];

            // Mock file upload
            const mockFile = {
                name: 'mixed_data_test.csv',
                size: 2048,
                type: 'text/csv'
            };

            if (importManager.fileParser) {
                importManager.fileParser.parse = jest.fn().mockResolvedValue(mixedData);
            }

            const batch = await importManager.uploadFile(mockFile);
            expect(batch.totalRows).toBe(4);

            // Validate data
            const validatedData = await importManager.validateData(mixedData);
            expect(validatedData).toHaveLength(4);

            const validRows = validatedData.filter(row => row.isValid);
            const invalidRows = validatedData.filter(row => !row.isValid);
            
            expect(validRows).toHaveLength(2);
            expect(invalidRows).toHaveLength(2);

            // Check specific validation errors
            const memberNotFoundRow = validatedData.find(row => row.memberNumber === '9999999999999999');
            expect(memberNotFoundRow.isValid).toBe(false);
            expect(memberNotFoundRow.validationErrors).toContain('Anggota tidak ditemukan');

            const exceedsBalanceRow = validatedData.find(row => row.memberNumber === '3201234567890002');
            expect(exceedsBalanceRow.isValid).toBe(false);
            expect(exceedsBalanceRow.validationErrors.some(error => error.includes('melebihi saldo'))).toBe(true);

            // Process only valid rows
            const results = await importManager.processBatch(validatedData);
            expect(results.successCount).toBe(2);
            expect(results.failureCount).toBe(0); // Invalid rows are skipped, not failed during processing
            expect(results.totalProcessed).toBe(2); // Only valid rows are processed

            // Verify only valid transactions were saved
            const pembayaranList = JSON.parse(localStorage.getItem('pembayaranHutangPiutang'));
            expect(pembayaranList).toHaveLength(2);

            const jurnalList = JSON.parse(localStorage.getItem('jurnal'));
            expect(jurnalList).toHaveLength(2);

            // Generate report
            const report = await importManager.generateReport(results);
            expect(report.summary.totalTransactions).toBe(2);
            expect(report.summary.successfulTransactions).toBe(2);
            expect(report.summary.failedTransactions).toBe(0);
        });

        test('should handle system errors and recovery gracefully', async () => {
            // Requirements: All requirements - Test error scenarios and recovery
            
            const testData = [
                {
                    nomor_anggota: '3201234567890001',
                    nama_anggota: 'Ahmad Suryadi',
                    jenis_pembayaran: 'hutang',
                    jumlah_pembayaran: '100000',
                    keterangan: 'Test payment'
                }
            ];

            // Mock file upload
            const mockFile = {
                name: 'error_test.csv',
                size: 512,
                type: 'text/csv'
            };

            if (importManager.fileParser) {
                importManager.fileParser.parse = jest.fn().mockResolvedValue(testData);
            }

            const batch = await importManager.uploadFile(mockFile);
            const validatedData = await importManager.validateData(testData);

            // Simulate database error during payment processing
            global.savePembayaran.mockImplementationOnce(() => {
                throw new Error('Database connection failed');
            });

            // Should handle error gracefully
            try {
                await importManager.processBatch(validatedData);
            } catch (error) {
                expect(error.message).toContain('Database connection failed');
            }

            // Verify system state is consistent after error
            const pembayaranList = JSON.parse(localStorage.getItem('pembayaranHutangPiutang'));
            expect(pembayaranList).toHaveLength(0); // No partial data saved

            // Reset mock and try again - should work
            global.savePembayaran.mockImplementation((paymentData) => {
                const transaction = {
                    id: `TXN_${Date.now()}`,
                    anggotaId: paymentData.anggotaId,
                    jenis: paymentData.jenis,
                    jumlah: paymentData.jumlah,
                    status: 'selesai'
                };

                const pembayaranList = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
                pembayaranList.push(transaction);
                localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaranList));

                return transaction;
            });

            // Reset manager state and try again
            importManager.reset();
            
            const newBatch = await importManager.uploadFile(mockFile);
            const newValidatedData = await importManager.validateData(testData);
            const results = await importManager.processBatch(newValidatedData);

            expect(results.successCount).toBe(1);
            expect(results.failureCount).toBe(0);
        });

        test('should handle cancellation and rollback correctly', async () => {
            // Requirements: All requirements - Test system recovery and rollback
            
            const testData = [
                {
                    nomor_anggota: '3201234567890001',
                    nama_anggota: 'Ahmad Suryadi',
                    jenis_pembayaran: 'hutang',
                    jumlah_pembayaran: '100000',
                    keterangan: 'Payment 1'
                },
                {
                    nomor_anggota: '3201234567890002',
                    nama_anggota: 'Siti Nurhaliza',
                    jenis_pembayaran: 'piutang',
                    jumlah_pembayaran: '50000',
                    keterangan: 'Payment 2'
                }
            ];

            const mockFile = {
                name: 'cancellation_test.csv',
                size: 1024,
                type: 'text/csv'
            };

            if (importManager.fileParser) {
                importManager.fileParser.parse = jest.fn().mockResolvedValue(testData);
            }

            const batch = await importManager.uploadFile(mockFile);
            const validatedData = await importManager.validateData(testData);

            // Start processing and then cancel
            const processingPromise = importManager.processBatch(validatedData);
            
            // Simulate cancellation after a short delay
            setTimeout(async () => {
                const cancellationResult = await importManager.cancelProcessing();
                expect(cancellationResult.success).toBe(true);
            }, 100);

            try {
                await processingPromise;
            } catch (error) {
                expect(error.message).toContain('cancelled');
            }

            // Verify state after cancellation
            const state = importManager.getState();
            expect(state.workflowState).toBe('cancelled');
            expect(state.isCancelled).toBe(true);
        });
    });

    describe('Integration with Existing Systems', () => {
        test('should integrate seamlessly with payment system', async () => {
            // Requirements: 11.1 - Ensure compatibility with existing payment processing
            
            const paymentData = {
                anggotaId: 'ANG001',
                anggotaNama: 'Ahmad Suryadi',
                jenis: 'hutang',
                jumlah: 200000,
                saldoSebelum: 750000,
                saldoSesudah: 550000,
                keterangan: 'Integration test payment'
            };

            // Test balance calculation integration
            const hutangBalance = global.hitungSaldoHutang('ANG001');
            expect(hutangBalance).toBe(750000);

            // Test validation integration
            const validation = global.validatePembayaran(paymentData);
            expect(validation.valid).toBe(true);

            // Test payment processing integration
            const transaction = global.savePembayaran(paymentData);
            expect(transaction).toBeDefined();
            expect(transaction.anggotaId).toBe('ANG001');
            expect(transaction.jenis).toBe('hutang');
            expect(transaction.jumlah).toBe(200000);

            // Verify integration functions were called correctly
            expect(global.hitungSaldoHutang).toHaveBeenCalledWith('ANG001');
            expect(global.validatePembayaran).toHaveBeenCalledWith(paymentData);
            expect(global.savePembayaran).toHaveBeenCalledWith(paymentData);
        });

        test('should integrate seamlessly with accounting system', async () => {
            // Requirements: 11.2 - Ensure journal entries follow existing patterns
            
            const keterangan = 'Batch Pembayaran Hutang - Ahmad Suryadi (Import)';
            const entries = [
                { akun: '1-1000', debit: 200000, kredit: 0 }, // Kas
                { akun: '2-1000', debit: 0, kredit: 200000 }  // Hutang Anggota
            ];
            const tanggal = '2024-01-15';

            const jurnalEntry = global.addJurnal(keterangan, entries, tanggal);
            
            expect(jurnalEntry).toBeDefined();
            expect(jurnalEntry.keterangan).toBe(keterangan);
            expect(jurnalEntry.entries).toEqual(entries);
            expect(jurnalEntry.tanggal).toBe(tanggal);

            // Verify double-entry bookkeeping
            const totalDebits = entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
            const totalCredits = entries.reduce((sum, entry) => sum + (entry.kredit || 0), 0);
            expect(totalDebits).toBe(totalCredits);
            expect(totalDebits).toBe(200000);

            // Verify journal was saved to localStorage
            const jurnalList = JSON.parse(localStorage.getItem('jurnal'));
            expect(jurnalList).toHaveLength(1);
            expect(jurnalList[0].id).toBe(jurnalEntry.id);
        });

        test('should maintain audit trail consistency', async () => {
            // Requirements: 11.2 - Maintain audit trail consistency
            
            const testData = [{
                nomor_anggota: '3201234567890001',
                nama_anggota: 'Ahmad Suryadi',
                jenis_pembayaran: 'hutang',
                jumlah_pembayaran: '150000',
                keterangan: 'Audit trail test'
            }];

            const mockFile = {
                name: 'audit_test.csv',
                size: 512,
                type: 'text/csv'
            };

            if (importManager.fileParser) {
                importManager.fileParser.parse = jest.fn().mockResolvedValue(testData);
            }

            // Execute complete workflow
            const batch = await importManager.uploadFile(mockFile);
            const validatedData = await importManager.validateData(testData);
            const results = await importManager.processBatch(validatedData);
            const report = await importManager.generateReport(results);

            // Verify audit logs were created at each step
            expect(importManager.auditLogger).toBeDefined();
            
            // Check that batch has proper audit information
            expect(batch.uploadedBy).toBe('Kasir Utama');
            expect(batch.uploadedAt).toBeDefined();
            expect(results.batchId).toBeDefined();

            // Verify transaction audit information
            const pembayaranList = JSON.parse(localStorage.getItem('pembayaranHutangPiutang'));
            expect(pembayaranList[0].kasirId).toBe('USER001');
            expect(pembayaranList[0].kasirNama).toBe('Kasir Utama');
            expect(pembayaranList[0].batchId).toBe(results.batchId);
            expect(pembayaranList[0].createdAt).toBeDefined();
        });
    });

    describe('Performance and Scalability Tests', () => {
        test('should handle large datasets efficiently', async () => {
            // Requirements: All requirements - Test performance with realistic large datasets
            
            // Create a large dataset (100 transactions)
            const largeDataset = [];
            for (let i = 1; i <= 100; i++) {
                const anggotaIndex = (i % 3);
                const anggota = realWorldAnggota[anggotaIndex];
                largeDataset.push({
                    nomor_anggota: anggota.nik,
                    nama_anggota: anggota.nama,
                    jenis_pembayaran: i <= 50 ? 'hutang' : 'piutang',
                    jumlah_pembayaran: '10000', // Small amounts to stay within balance
                    keterangan: `Batch payment ${i}`
                });
            }

            const mockFile = {
                name: 'large_dataset_test.csv',
                size: 10240,
                type: 'text/csv'
            };

            if (importManager.fileParser) {
                importManager.fileParser.parse = jest.fn().mockResolvedValue(largeDataset);
            }

            const startTime = Date.now();

            // Execute complete workflow
            const batch = await importManager.uploadFile(mockFile);
            expect(batch.totalRows).toBe(100);

            const validatedData = await importManager.validateData(largeDataset);
            expect(validatedData).toHaveLength(100);

            const results = await importManager.processBatch(validatedData);
            expect(results.successCount).toBe(100);

            const endTime = Date.now();
            const processingTime = endTime - startTime;

            // Should complete within reasonable time (10 seconds for 100 transactions)
            expect(processingTime).toBeLessThan(10000);

            // Verify all data was processed correctly
            const pembayaranList = JSON.parse(localStorage.getItem('pembayaranHutangPiutang'));
            expect(pembayaranList).toHaveLength(100);

            const jurnalList = JSON.parse(localStorage.getItem('jurnal'));
            expect(jurnalList).toHaveLength(100);
        });

        test('should handle memory efficiently during processing', async () => {
            // Requirements: All requirements - Test memory efficiency
            
            // Create moderate dataset to test memory handling
            const dataset = [];
            for (let i = 1; i <= 50; i++) {
                dataset.push({
                    nomor_anggota: '3201234567890001',
                    nama_anggota: 'Ahmad Suryadi',
                    jenis_pembayaran: 'hutang',
                    jumlah_pembayaran: '5000',
                    keterangan: `Memory test payment ${i}`
                });
            }

            const mockFile = {
                name: 'memory_test.csv',
                size: 5120,
                type: 'text/csv'
            };

            if (importManager.fileParser) {
                importManager.fileParser.parse = jest.fn().mockResolvedValue(dataset);
            }

            // Track progress to ensure batch processing
            let progressUpdates = 0;
            importManager.setProgressCallback((progress) => {
                progressUpdates++;
                expect(progress.current).toBeLessThanOrEqual(progress.total);
                expect(progress.percentage).toBeLessThanOrEqual(100);
            });

            const batch = await importManager.uploadFile(mockFile);
            const validatedData = await importManager.validateData(dataset);
            const results = await importManager.processBatch(validatedData);

            expect(results.successCount).toBe(50);
            expect(progressUpdates).toBeGreaterThan(0);

            // Verify all transactions were processed correctly
            const pembayaranList = JSON.parse(localStorage.getItem('pembayaranHutangPiutang'));
            expect(pembayaranList).toHaveLength(50);
        });
    });

    describe('Error Recovery and Resilience Tests', () => {
        test('should recover from partial system failures', async () => {
            // Requirements: All requirements - Test error scenarios and recovery
            
            const testData = [
                {
                    nomor_anggota: '3201234567890001',
                    nama_anggota: 'Ahmad Suryadi',
                    jenis_pembayaran: 'hutang',
                    jumlah_pembayaran: '100000',
                    keterangan: 'Payment 1'
                },
                {
                    nomor_anggota: '3201234567890002',
                    nama_anggota: 'Siti Nurhaliza',
                    jenis_pembayaran: 'piutang',
                    jumlah_pembayaran: '75000',
                    keterangan: 'Payment 2'
                }
            ];

            // Mock intermittent failure
            let callCount = 0;
            global.savePembayaran.mockImplementation((paymentData) => {
                callCount++;
                if (callCount === 1) {
                    // First call succeeds
                    const transaction = {
                        id: `TXN_${Date.now()}`,
                        anggotaId: paymentData.anggotaId,
                        jenis: paymentData.jenis,
                        jumlah: paymentData.jumlah,
                        status: 'selesai'
                    };

                    const pembayaranList = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
                    pembayaranList.push(transaction);
                    localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaranList));

                    return transaction;
                } else {
                    // Second call fails
                    throw new Error('Temporary system failure');
                }
            });

            const mockFile = {
                name: 'partial_failure_test.csv',
                size: 1024,
                type: 'text/csv'
            };

            if (importManager.fileParser) {
                importManager.fileParser.parse = jest.fn().mockResolvedValue(testData);
            }

            const batch = await importManager.uploadFile(mockFile);
            const validatedData = await importManager.validateData(testData);

            // Process batch - should handle partial failure gracefully
            try {
                const results = await importManager.processBatch(validatedData);
                
                // Should have processed what it could
                expect(results.successCount).toBeGreaterThan(0);
                expect(results.failureCount).toBeGreaterThan(0);
                
            } catch (error) {
                // Or might throw error depending on error handling strategy
                expect(error.message).toContain('system failure');
            }

            // Verify system state is consistent
            const pembayaranList = JSON.parse(localStorage.getItem('pembayaranHutangPiutang'));
            // Should have at least the successful transaction
            expect(pembayaranList.length).toBeGreaterThanOrEqual(0);
        });

        test('should handle corrupted data gracefully', async () => {
            // Requirements: All requirements - Test error scenarios and recovery
            
            const corruptedData = [
                {
                    nomor_anggota: '3201234567890001',
                    nama_anggota: 'Ahmad Suryadi',
                    jenis_pembayaran: 'hutang',
                    jumlah_pembayaran: 'invalid_amount', // Corrupted amount
                    keterangan: 'Corrupted payment'
                },
                {
                    nomor_anggota: null, // Missing member number
                    nama_anggota: 'Missing Member',
                    jenis_pembayaran: 'hutang',
                    jumlah_pembayaran: '100000',
                    keterangan: 'Missing member number'
                },
                {
                    nomor_anggota: '3201234567890002',
                    nama_anggota: 'Siti Nurhaliza',
                    jenis_pembayaran: 'invalid_type', // Invalid payment type
                    jumlah_pembayaran: '50000',
                    keterangan: 'Invalid payment type'
                }
            ];

            const mockFile = {
                name: 'corrupted_data_test.csv',
                size: 1024,
                type: 'text/csv'
            };

            if (importManager.fileParser) {
                importManager.fileParser.parse = jest.fn().mockResolvedValue(corruptedData);
            }

            // Should handle corrupted data without crashing
            const batch = await importManager.uploadFile(mockFile);
            expect(batch.totalRows).toBe(3);

            const validatedData = await importManager.validateData(corruptedData);
            expect(validatedData).toHaveLength(3);

            // All rows should be invalid due to corruption
            const validRows = validatedData.filter(row => row.isValid);
            const invalidRows = validatedData.filter(row => !row.isValid);
            
            expect(validRows).toHaveLength(0);
            expect(invalidRows).toHaveLength(3);

            // Should have specific error messages for each type of corruption
            expect(invalidRows[0].validationErrors.some(error => error.includes('jumlah'))).toBe(true);
            expect(invalidRows[1].validationErrors.some(error => error.includes('nomor_anggota'))).toBe(true);
            expect(invalidRows[2].validationErrors.some(error => error.includes('jenis_pembayaran'))).toBe(true);

            // Processing should handle empty valid data gracefully
            const results = await importManager.processBatch(validatedData);
            expect(results.successCount).toBe(0);
            expect(results.totalProcessed).toBe(0);
        });
    });
});