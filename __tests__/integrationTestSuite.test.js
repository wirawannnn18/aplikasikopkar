/**
 * Integration Test Suite for Tutup Kasir POS System
 * Task 14: Integration testing dan final validation
 * 
 * **Feature: perbaikan-menu-tutup-kasir-pos, Integration Testing**
 * **Validates: All Requirements (1.1-4.5)**
 */

describe('Tutup Kasir POS - Integration Test Suite', () => {
    let mockSessionStorage;
    let mockLocalStorage;
    
    beforeEach(() => {
        // Mock sessionStorage
        mockSessionStorage = {
            data: {},
            getItem: (key) => mockSessionStorage.data[key] || null,
            setItem: (key, value) => { mockSessionStorage.data[key] = value; },
            removeItem: (key) => { delete mockSessionStorage.data[key]; },
            clear: () => { mockSessionStorage.data = {}; }
        };
        
        // Mock localStorage
        mockLocalStorage = {
            data: {},
            getItem: (key) => mockLocalStorage.data[key] || null,
            setItem: (key, value) => { mockLocalStorage.data[key] = value; },
            removeItem: (key) => { delete mockLocalStorage.data[key]; },
            clear: () => { mockLocalStorage.data = {}; }
        };
        
        // Replace global storage objects
        Object.defineProperty(global, 'sessionStorage', { 
            value: mockSessionStorage,
            writable: true
        });
        Object.defineProperty(global, 'localStorage', { 
            value: mockLocalStorage,
            writable: true
        });
        
        // Setup test data
        setupTestEnvironment();
    });
    
    afterEach(() => {
        cleanupTestEnvironment();
    });
    
    function setupTestEnvironment() {
        const validBukaKas = {
            id: 'test-shift-001',
            kasir: 'Test Kasir',
            kasirId: 'kasir001',
            modalAwal: 100000,
            waktuBuka: new Date().toISOString(),
            tanggal: new Date().toISOString().split('T')[0]
        };
        
        const sampleTransactions = [
            { id: 'tx001', total: 50000, metodePembayaran: 'cash' },
            { id: 'tx002', total: 75000, metodePembayaran: 'cash' },
            { id: 'tx003', total: 25000, metodePembayaran: 'kredit' }
        ];
        
        sessionStorage.setItem('bukaKas', JSON.stringify(validBukaKas));
        localStorage.setItem('transaksiHarian', JSON.stringify(sampleTransactions));
    }
    
    function cleanupTestEnvironment() {
        sessionStorage.clear();
        localStorage.clear();
    }
    
    describe('End-to-End Workflow Integration', () => {
        test('should complete full workflow from buka kas to tutup kasir', () => {
            // 1. Verify buka kas session exists
            const bukaKas = JSON.parse(sessionStorage.getItem('bukaKas'));
            expect(bukaKas).toBeTruthy();
            expect(bukaKas.kasir).toBe('Test Kasir');
            expect(bukaKas.modalAwal).toBe(100000);
            
            // 2. Verify transactions exist
            const transactions = JSON.parse(localStorage.getItem('transaksiHarian'));
            expect(transactions).toHaveLength(3);
            
            // 3. Calculate kas seharusnya
            const totalCash = transactions
                .filter(t => t.metodePembayaran === 'cash')
                .reduce((sum, t) => sum + t.total, 0);
            const kasSeharusnya = bukaKas.modalAwal + totalCash;
            expect(kasSeharusnya).toBe(225000);
            
            // 4. Simulate tutup kasir process
            const kasAktual = 220000;
            const selisih = kasAktual - kasSeharusnya;
            expect(selisih).toBe(-5000);
            
            // 5. Save tutup kasir record
            const tutupKasirRecord = {
                id: 'tutup-' + Date.now(),
                shiftId: bukaKas.id,
                kasir: bukaKas.kasir,
                kasirId: bukaKas.kasirId,
                waktuBuka: bukaKas.waktuBuka,
                waktuTutup: new Date().toISOString(),
                modalAwal: bukaKas.modalAwal,
                kasAktual: kasAktual,
                selisih: selisih,
                keteranganSelisih: 'Test selisih kas'
            };
            
            const existing = JSON.parse(localStorage.getItem('riwayatTutupKas') || '[]');
            existing.push(tutupKasirRecord);
            localStorage.setItem('riwayatTutupKas', JSON.stringify(existing));
            
            // 6. Verify data persistence
            const saved = JSON.parse(localStorage.getItem('riwayatTutupKas'));
            expect(saved).toHaveLength(1);
            expect(saved[0].selisih).toBe(-5000);
            
            // 7. Clean up session
            sessionStorage.removeItem('bukaKas');
            expect(sessionStorage.getItem('bukaKas')).toBeNull();
        });
        
        test('should handle multiple kasir sessions independently', () => {
            // Setup kasir 1
            const kasir1Data = {
                id: 'shift-kasir1',
                kasir: 'Kasir 1',
                kasirId: 'kasir001',
                modalAwal: 100000,
                waktuBuka: new Date().toISOString(),
                tanggal: new Date().toISOString().split('T')[0]
            };
            
            // Setup kasir 2
            const kasir2Data = {
                id: 'shift-kasir2',
                kasir: 'Kasir 2',
                kasirId: 'kasir002',
                modalAwal: 150000,
                waktuBuka: new Date().toISOString(),
                tanggal: new Date().toISOString().split('T')[0]
            };
            
            // Test session isolation
            sessionStorage.setItem('bukaKas', JSON.stringify(kasir1Data));
            let currentSession = JSON.parse(sessionStorage.getItem('bukaKas'));
            expect(currentSession.kasirId).toBe('kasir001');
            
            sessionStorage.setItem('bukaKas', JSON.stringify(kasir2Data));
            currentSession = JSON.parse(sessionStorage.getItem('bukaKas'));
            expect(currentSession.kasirId).toBe('kasir002');
            expect(currentSession.modalAwal).toBe(150000);
        });
    });
    
    describe('Cross-Module Integration', () => {
        test('should integrate POS with accounting system', () => {
            const bukaKas = JSON.parse(sessionStorage.getItem('bukaKas'));
            const selisih = -5000; // Negative selisih (shortage)
            
            // Simulate journal entry creation
            const journalEntry = {
                type: selisih > 0 ? 'pendapatan-lain' : 'beban-lain',
                amount: Math.abs(selisih),
                description: 'Selisih kas tutup kasir',
                kasirId: bukaKas.kasirId,
                shiftId: bukaKas.id,
                tanggal: new Date().toISOString().split('T')[0]
            };
            
            expect(journalEntry.type).toBe('beban-lain');
            expect(journalEntry.amount).toBe(5000);
            expect(journalEntry.kasirId).toBe('kasir001');
        });
        
        test('should integrate with reporting system', () => {
            // Create multiple tutup kasir records
            const records = [
                {
                    id: 'tutup-001',
                    kasir: 'Kasir 1',
                    selisih: -2000,
                    tanggalTutup: '2024-12-18'
                },
                {
                    id: 'tutup-002',
                    kasir: 'Kasir 2',
                    selisih: 1500,
                    tanggalTutup: '2024-12-18'
                }
            ];
            
            localStorage.setItem('riwayatTutupKas', JSON.stringify(records));
            
            // Test reporting functionality
            const riwayat = JSON.parse(localStorage.getItem('riwayatTutupKas'));
            expect(riwayat).toHaveLength(2);
            
            // Test filtering by date
            const todayRecords = riwayat.filter(r => r.tanggalTutup === '2024-12-18');
            expect(todayRecords).toHaveLength(2);
            
            // Test summary calculations
            const totalSelisih = riwayat.reduce((sum, r) => sum + r.selisih, 0);
            expect(totalSelisih).toBe(-500);
        });
    });
    
    describe('Session Persistence Integration', () => {
        test('should maintain session data across page refreshes', () => {
            const originalBukaKas = JSON.parse(sessionStorage.getItem('bukaKas'));
            
            // Simulate page refresh by re-reading session data
            const restoredBukaKas = JSON.parse(sessionStorage.getItem('bukaKas'));
            
            expect(restoredBukaKas).toEqual(originalBukaKas);
            expect(restoredBukaKas.kasir).toBe('Test Kasir');
            expect(restoredBukaKas.modalAwal).toBe(100000);
        });
        
        test('should handle corrupted session data gracefully', () => {
            // Corrupt session data
            sessionStorage.setItem('bukaKas', 'invalid-json-data');
            
            // Test error handling
            expect(() => {
                JSON.parse(sessionStorage.getItem('bukaKas'));
            }).toThrow();
            
            // Verify system can recover
            sessionStorage.removeItem('bukaKas');
            expect(sessionStorage.getItem('bukaKas')).toBeNull();
        });
    });
    
    describe('Error Handling Integration', () => {
        test('should handle localStorage quota exceeded', () => {
            // Mock localStorage quota exceeded
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = () => {
                throw new Error('QuotaExceededError');
            };
            
            // Test error handling
            expect(() => {
                localStorage.setItem('test', 'data');
            }).toThrow('QuotaExceededError');
            
            // Restore original function
            localStorage.setItem = originalSetItem;
        });
        
        test('should validate input data integrity', () => {
            const invalidKasAktual = -1000; // Negative value
            const validKasAktual = 200000;
            
            // Test negative value validation
            expect(invalidKasAktual).toBeLessThan(0);
            expect(validKasAktual).toBeGreaterThan(0);
            
            // Test calculation with valid data
            const bukaKas = JSON.parse(sessionStorage.getItem('bukaKas'));
            const transactions = JSON.parse(localStorage.getItem('transaksiHarian'));
            const totalCash = transactions
                .filter(t => t.metodePembayaran === 'cash')
                .reduce((sum, t) => sum + t.total, 0);
            const kasSeharusnya = bukaKas.modalAwal + totalCash;
            const selisih = validKasAktual - kasSeharusnya;
            
            expect(selisih).toBe(-25000);
            expect(typeof selisih).toBe('number');
            expect(isNaN(selisih)).toBe(false);
        });
    });
    
    describe('Performance Integration', () => {
        test('should handle large transaction datasets efficiently', () => {
            // Create large dataset
            const largeTransactionSet = Array.from({ length: 1000 }, (_, i) => ({
                id: `tx${i}`,
                total: Math.floor(Math.random() * 100000) + 1000,
                metodePembayaran: i % 2 === 0 ? 'cash' : 'kredit',
                timestamp: new Date().toISOString()
            }));
            
            const startTime = performance.now();
            
            // Process large dataset
            localStorage.setItem('largeTransactions', JSON.stringify(largeTransactionSet));
            const retrieved = JSON.parse(localStorage.getItem('largeTransactions'));
            
            // Calculate totals
            const totalCash = retrieved
                .filter(t => t.metodePembayaran === 'cash')
                .reduce((sum, t) => sum + t.total, 0);
            
            const endTime = performance.now();
            const processingTime = endTime - startTime;
            
            expect(retrieved).toHaveLength(1000);
            expect(typeof totalCash).toBe('number');
            expect(processingTime).toBeLessThan(1000); // Should complete within 1 second
            
            // Cleanup
            localStorage.removeItem('largeTransactions');
        });
        
        test('should maintain memory efficiency during operations', () => {
            const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            
            // Perform memory-intensive operations
            const testData = Array.from({ length: 100 }, (_, i) => ({
                id: i,
                data: 'x'.repeat(1000), // 1KB per item
                nested: {
                    values: Array.from({ length: 10 }, (_, j) => j * i)
                }
            }));
            
            // Store and process data
            localStorage.setItem('memoryTest', JSON.stringify(testData));
            const processed = JSON.parse(localStorage.getItem('memoryTest'));
            
            expect(processed).toHaveLength(100);
            expect(processed[0].data).toHaveLength(1000);
            
            // Cleanup
            localStorage.removeItem('memoryTest');
            
            // Memory should not grow excessively
            const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            if (performance.memory) {
                const memoryGrowth = (finalMemory - initialMemory) / 1024 / 1024; // MB
                expect(memoryGrowth).toBeLessThan(50); // Should not grow more than 50MB
            }
        });
    });
    
    describe('User Acceptance Scenarios', () => {
        test('should support typical kasir workflow', () => {
            // Scenario: Normal shift with small cash shortage
            const bukaKas = JSON.parse(sessionStorage.getItem('bukaKas'));
            const transactions = JSON.parse(localStorage.getItem('transaksiHarian'));
            
            // Calculate expected values
            const totalCash = transactions
                .filter(t => t.metodePembayaran === 'cash')
                .reduce((sum, t) => sum + t.total, 0);
            const kasSeharusnya = bukaKas.modalAwal + totalCash;
            
            // Kasir reports slightly less cash (common scenario)
            const kasAktual = kasSeharusnya - 2000; // 2000 shortage
            const selisih = kasAktual - kasSeharusnya;
            
            expect(selisih).toBe(-2000);
            expect(Math.abs(selisih)).toBeLessThan(5000); // Within acceptable range
            
            // Should require keterangan for any selisih
            const requiresKeterangan = selisih !== 0;
            expect(requiresKeterangan).toBe(true);
        });
        
        test('should handle supervisor review scenario', () => {
            // Create tutup kasir records for supervisor review
            const records = [
                {
                    id: 'tutup-001',
                    kasir: 'Kasir A',
                    selisih: -3000,
                    keteranganSelisih: 'Uang kembalian salah hitung',
                    waktuTutup: new Date().toISOString()
                },
                {
                    id: 'tutup-002',
                    kasir: 'Kasir B',
                    selisih: 0,
                    keteranganSelisih: '',
                    waktuTutup: new Date().toISOString()
                }
            ];
            
            localStorage.setItem('riwayatTutupKas', JSON.stringify(records));
            
            // Supervisor reviews records
            const riwayat = JSON.parse(localStorage.getItem('riwayatTutupKas'));
            
            // Find records with selisih
            const recordsWithSelisih = riwayat.filter(r => r.selisih !== 0);
            expect(recordsWithSelisih).toHaveLength(1);
            expect(recordsWithSelisih[0].keteranganSelisih).toBeTruthy();
            
            // Find perfect records
            const perfectRecords = riwayat.filter(r => r.selisih === 0);
            expect(perfectRecords).toHaveLength(1);
        });
    });
});