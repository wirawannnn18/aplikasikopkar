/**
 * Performance Tests for Integrasi Pembayaran Laporan
 * Tests system performance with large datasets and concurrent operations
 */

describe('Performance Tests - Integrasi Pembayaran Laporan', () => {
    let integrated, sharedServices;

    beforeEach(() => {
        localStorage.clear();
        
        if (typeof PembayaranHutangPiutangIntegrated !== 'undefined') {
            integrated = new PembayaranHutangPiutangIntegrated();
            sharedServices = integrated.sharedServices;
        }
    });

    describe('Large Dataset Performance', () => {
        test('Handles 10,000 transactions efficiently', () => {
            if (!sharedServices) {
                console.log('Shared services not available, skipping test');
                return;
            }

            // Generate 10,000 test transactions
            const largeDataset = [];
            for (let i = 0; i < 10000; i++) {
                largeDataset.push({
                    id: `T${i}`,
                    anggotaId: `A${i % 1000}`,
                    anggotaNama: `Anggota ${i % 1000}`,
                    jumlah: Math.floor(Math.random() * 1000000) + 10000,
                    mode: i % 3 === 0 ? 'manual' : 'import',
                    jenis: i % 2 === 0 ? 'hutang' : 'piutang',
                    tanggal: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
                    kasir: `kasir${i % 5}`,
                    status: 'success'
                });
            }

            localStorage.setItem('pembayaran_transactions', JSON.stringify(largeDataset));

            // Test transaction history retrieval
            const startTime = performance.now();
            const history = sharedServices.getTransactionHistory({});
            const endTime = performance.now();

            const loadTime = endTime - startTime;
            expect(loadTime).toBeLessThan(2000); // Should load in less than 2 seconds
            expect(history.length).toBe(10000);
        });

        test('Complex filtering on large dataset performs well', () => {
            if (!sharedServices) {
                console.log('Shared services not available, skipping test');
                return;
            }

            const largeDataset = [];
            for (let i = 0; i < 5000; i++) {
                largeDataset.push({
                    id: `T${i}`,
                    anggotaId: `A${i % 500}`,
                    jumlah: Math.floor(Math.random() * 1000000),
                    mode: i % 2 === 0 ? 'manual' : 'import',
                    jenis: i % 3 === 0 ? 'hutang' : 'piutang',
                    tanggal: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                    kasir: `kasir${i % 3}`
                });
            }

            localStorage.setItem('pembayaran_transactions', JSON.stringify(largeDataset));

            const startTime = performance.now();
            const filtered = sharedServices.getTransactionHistory({
                mode: 'manual',
                jenis: 'hutang',
                kasir: 'kasir1',
                dateFrom: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
                dateTo: new Date().toISOString()
            });
            const endTime = performance.now();

            const filterTime = endTime - startTime;
            expect(filterTime).toBeLessThan(1000); // Should filter in less than 1 second
            expect(filtered.every(t => 
                t.mode === 'manual' && 
                t.jenis === 'hutang' && 
                t.kasir === 'kasir1'
            )).toBe(true);
        });

        test('Summary calculation with large dataset', () => {
            if (!sharedServices) {
                console.log('Shared services not available, skipping test');
                return;
            }

            const largeDataset = [];
            let expectedManualTotal = 0;
            let expectedImportTotal = 0;

            for (let i = 0; i < 5000; i++) {
                const amount = 100000;
                const mode = i % 2 === 0 ? 'manual' : 'import';
                
                if (mode === 'manual') {
                    expectedManualTotal += amount;
                } else {
                    expectedImportTotal += amount;
                }

                largeDataset.push({
                    id: `T${i}`,
                    jumlah: amount,
                    mode: mode,
                    jenis: 'hutang'
                });
            }

            localStorage.setItem('pembayaran_transactions', JSON.stringify(largeDataset));

            const startTime = performance.now();
            const summary = sharedServices.getUnifiedSummary();
            const endTime = performance.now();

            const calcTime = endTime - startTime;
            expect(calcTime).toBeLessThan(1000); // Should calculate in less than 1 second
            expect(summary.totalManual).toBe(expectedManualTotal);
            expect(summary.totalImport).toBe(expectedImportTotal);
            expect(summary.grandTotal).toBe(expectedManualTotal + expectedImportTotal);
        });

        test('Export functionality with large dataset', () => {
            if (!sharedServices) {
                console.log('Shared services not available, skipping test');
                return;
            }

            const largeDataset = [];
            for (let i = 0; i < 2000; i++) {
                largeDataset.push({
                    id: `T${i}`,
                    anggotaId: `A${i % 200}`,
                    anggotaNama: `Anggota ${i % 200}`,
                    jumlah: 50000,
                    mode: i % 2 === 0 ? 'manual' : 'import',
                    jenis: 'hutang',
                    tanggal: new Date().toISOString()
                });
            }

            localStorage.setItem('pembayaran_transactions', JSON.stringify(largeDataset));

            const startTime = performance.now();
            const exportData = sharedServices.exportTransactionHistory({});
            const endTime = performance.now();

            const exportTime = endTime - startTime;
            expect(exportTime).toBeLessThan(2000); // Should export in less than 2 seconds
            expect(exportData.length).toBe(2000);
        });
    });

    describe('Concurrent Operations Performance', () => {
        test('Multiple tab switches perform well', () => {
            if (!integrated) {
                console.log('Integrated controller not available, skipping test');
                return;
            }

            const startTime = performance.now();
            
            // Simulate rapid tab switching
            for (let i = 0; i < 100; i++) {
                integrated.switchTab(i % 2 === 0 ? 'manual' : 'import');
            }
            
            const endTime = performance.now();
            const switchTime = endTime - startTime;
            
            expect(switchTime).toBeLessThan(1000); // Should handle 100 switches in less than 1 second
            expect(integrated.activeTab).toBe('manual'); // Should end on manual (even number)
        });

        test('Simultaneous data operations', () => {
            if (!sharedServices) {
                console.log('Shared services not available, skipping test');
                return;
            }

            const operations = [];
            const startTime = performance.now();

            // Simulate multiple concurrent operations
            for (let i = 0; i < 50; i++) {
                operations.push(
                    sharedServices.validatePaymentAmount(100000, 200000, 'hutang')
                );
            }

            const endTime = performance.now();
            const operationTime = endTime - startTime;

            expect(operationTime).toBeLessThan(500); // Should complete 50 operations in less than 500ms
            expect(operations.every(op => op === true)).toBe(true);
        });

        test('Batch processing performance', () => {
            if (!integrated || !integrated.importController) {
                console.log('Import controller not available, skipping test');
                return;
            }

            const largeBatch = [];
            for (let i = 0; i < 500; i++) {
                largeBatch.push({
                    anggotaId: `A${i}`,
                    anggotaNama: `Anggota ${i}`,
                    jumlah: 50000,
                    jenis: 'hutang'
                });
            }

            const startTime = performance.now();
            const result = integrated.importController.validateBatch(largeBatch);
            const endTime = performance.now();

            const processTime = endTime - startTime;
            expect(processTime).toBeLessThan(3000); // Should process 500 items in less than 3 seconds
            expect(result.validRows).toBe(500);
        });
    });

    describe('Memory Usage Tests', () => {
        test('Memory usage remains stable with large datasets', () => {
            if (!sharedServices) {
                console.log('Shared services not available, skipping test');
                return;
            }

            const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

            // Create and process large dataset
            const largeDataset = [];
            for (let i = 0; i < 1000; i++) {
                largeDataset.push({
                    id: `T${i}`,
                    anggotaId: `A${i}`,
                    jumlah: 100000,
                    mode: 'manual',
                    data: new Array(100).fill('test') // Add some bulk
                });
            }

            localStorage.setItem('pembayaran_transactions', JSON.stringify(largeDataset));

            // Perform multiple operations
            for (let i = 0; i < 10; i++) {
                sharedServices.getTransactionHistory({});
                sharedServices.getUnifiedSummary();
            }

            const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            
            if (performance.memory) {
                const memoryIncrease = finalMemory - initialMemory;
                expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
            }
        });

        test('Cleanup after operations', () => {
            if (!integrated) {
                console.log('Integrated controller not available, skipping test');
                return;
            }

            // Create temporary data
            integrated.tempData = new Array(1000).fill('temporary');
            
            // Simulate cleanup
            integrated.cleanup();
            
            expect(integrated.tempData).toBeUndefined();
        });
    });

    describe('Real-time Update Performance', () => {
        test('Real-time updates perform efficiently', () => {
            if (!sharedServices) {
                console.log('Shared services not available, skipping test');
                return;
            }

            const startTime = performance.now();

            // Simulate 100 real-time updates
            for (let i = 0; i < 100; i++) {
                sharedServices.triggerRealTimeUpdate({
                    type: 'transaction_added',
                    data: { id: `T${i}`, amount: 10000 }
                });
            }

            const endTime = performance.now();
            const updateTime = endTime - startTime;

            expect(updateTime).toBeLessThan(1000); // Should handle 100 updates in less than 1 second
        });

        test('Cross-tab communication performance', () => {
            if (!integrated) {
                console.log('Integrated controller not available, skipping test');
                return;
            }

            const startTime = performance.now();

            // Simulate cross-tab updates
            for (let i = 0; i < 50; i++) {
                integrated.notifyOtherTab('data_updated', { count: i });
            }

            const endTime = performance.now();
            const notifyTime = endTime - startTime;

            expect(notifyTime).toBeLessThan(500); // Should handle 50 notifications in less than 500ms
        });
    });
});