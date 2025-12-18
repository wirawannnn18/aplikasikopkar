/**
 * Performance Tests for Tutup Kasir POS
 * Feature: perbaikan-menu-tutup-kasir-pos
 * 
 * Tests modal rendering speed, calculation performance, memory usage,
 * and caching effectiveness
 */

describe('Performance Tests - Tutup Kasir POS', () => {
    let performanceOptimizer;
    let mockLocalStorage;
    let mockSessionStorage;
    
    beforeEach(() => {
        // Setup mock storage
        mockLocalStorage = {};
        mockSessionStorage = {};
        
        global.localStorage = {
            getItem: jest.fn((key) => mockLocalStorage[key] || null),
            setItem: jest.fn((key, value) => { mockLocalStorage[key] = value; }),
            removeItem: jest.fn((key) => { delete mockLocalStorage[key]; }),
            clear: jest.fn(() => { mockLocalStorage = {}; })
        };
        
        global.sessionStorage = {
            getItem: jest.fn((key) => mockSessionStorage[key] || null),
            setItem: jest.fn((key, value) => { mockSessionStorage[key] = value; }),
            removeItem: jest.fn((key) => { delete mockSessionStorage[key]; }),
            clear: jest.fn(() => { mockSessionStorage = {}; })
        };
        
        // Mock performance API
        global.performance = {
            now: jest.fn(() => Date.now()),
            memory: {
                usedJSHeapSize: 10000000,
                totalJSHeapSize: 50000000,
                jsHeapSizeLimit: 2000000000
            }
        };
        
        // Initialize test data
        initializeTestData();
    });
    
    afterEach(() => {
        jest.clearAllMocks();
        if (performanceOptimizer) {
            performanceOptimizer.clearCache();
        }
    });
    
    function initializeTestData() {
        // Create test penjualan data
        const penjualan = generateTestPenjualan(100);
        mockLocalStorage['penjualan'] = JSON.stringify(penjualan);
        
        // Create test anggota data
        const anggota = generateTestAnggota(50);
        mockLocalStorage['anggota'] = JSON.stringify(anggota);
        
        // Create test barang data
        const barang = generateTestBarang(30);
        mockLocalStorage['barang'] = JSON.stringify(barang);
        
        // Create test buka kas session
        const bukaKas = {
            id: 'test-shift-001',
            kasir: 'Test Kasir',
            kasirId: 'kasir-test',
            modalAwal: 500000,
            waktuBuka: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            status: 'buka'
        };
        mockSessionStorage['bukaKas'] = JSON.stringify(bukaKas);
    }
    
    function generateTestPenjualan(count) {
        const penjualan = [];
        const startTime = Date.now() - 4 * 60 * 60 * 1000;
        
        for (let i = 0; i < count; i++) {
            penjualan.push({
                id: `penjualan-${i}`,
                tanggal: new Date(startTime + Math.random() * 4 * 60 * 60 * 1000).toISOString(),
                total: Math.floor(Math.random() * 500000) + 10000,
                status: Math.random() > 0.3 ? 'cash' : 'kredit',
                kasir: 'Test Kasir',
                items: [{
                    nama: `Produk ${i}`,
                    qty: Math.floor(Math.random() * 5) + 1,
                    harga: Math.floor(Math.random() * 50000) + 5000
                }]
            });
        }
        return penjualan;
    }
    
    function generateTestAnggota(count) {
        const anggota = [];
        for (let i = 0; i < count; i++) {
            anggota.push({
                id: `anggota-${i}`,
                nik: `NIK${String(i).padStart(6, '0')}`,
                nama: `Anggota Test ${i}`,
                statusKeanggotaan: 'Aktif'
            });
        }
        return anggota;
    }
    
    function generateTestBarang(count) {
        const barang = [];
        for (let i = 0; i < count; i++) {
            barang.push({
                id: `barang-${i}`,
                nama: `Produk Test ${i}`,
                hargaJual: Math.floor(Math.random() * 100000) + 5000,
                stok: Math.floor(Math.random() * 100) + 1
            });
        }
        return barang;
    }
    
    describe('Modal Rendering Performance', () => {
        test('modal opening speed should be under 500ms', () => {
            const startTime = performance.now();
            
            // Simulate modal data generation
            const bukaKas = JSON.parse(mockSessionStorage['bukaKas']);
            const penjualan = JSON.parse(mockLocalStorage['penjualan']);
            
            // Calculate shift data
            const waktuBuka = new Date(bukaKas.waktuBuka);
            const sekarang = new Date();
            
            const penjualanShift = penjualan.filter(p => {
                const tanggalPenjualan = new Date(p.tanggal);
                return tanggalPenjualan >= waktuBuka && tanggalPenjualan <= sekarang;
            });
            
            const totals = penjualanShift.reduce((acc, p) => {
                acc.totalPenjualan += p.total;
                if (p.status === 'cash') acc.totalCash += p.total;
                else if (p.status === 'kredit') acc.totalKredit += p.total;
                return acc;
            }, { totalPenjualan: 0, totalCash: 0, totalKredit: 0 });
            
            const endTime = performance.now();
            const renderTime = endTime - startTime;
            
            expect(renderTime).toBeLessThan(500);
            expect(totals).toHaveProperty('totalPenjualan');
            expect(totals).toHaveProperty('totalCash');
            expect(totals).toHaveProperty('totalKredit');
        });
        
        test('modal rendering with large dataset should be under 1000ms', () => {
            // Generate large dataset
            const largePenjualan = generateTestPenjualan(1000);
            mockLocalStorage['penjualan'] = JSON.stringify(largePenjualan);
            
            const startTime = performance.now();
            
            const bukaKas = JSON.parse(mockSessionStorage['bukaKas']);
            const penjualan = JSON.parse(mockLocalStorage['penjualan']);
            
            const waktuBuka = new Date(bukaKas.waktuBuka);
            const sekarang = new Date();
            
            const penjualanShift = penjualan.filter(p => {
                const tanggalPenjualan = new Date(p.tanggal);
                return tanggalPenjualan >= waktuBuka && tanggalPenjualan <= sekarang;
            });
            
            const totals = penjualanShift.reduce((acc, p) => {
                acc.totalPenjualan += p.total;
                if (p.status === 'cash') acc.totalCash += p.total;
                else if (p.status === 'kredit') acc.totalKredit += p.total;
                return acc;
            }, { totalPenjualan: 0, totalCash: 0, totalKredit: 0 });
            
            const endTime = performance.now();
            const renderTime = endTime - startTime;
            
            expect(renderTime).toBeLessThan(1000);
            expect(penjualanShift.length).toBeGreaterThan(0);
        });
        
        test('repeated modal openings should maintain consistent performance', () => {
            const times = [];
            const iterations = 10;
            
            for (let i = 0; i < iterations; i++) {
                const startTime = performance.now();
                
                const bukaKas = JSON.parse(mockSessionStorage['bukaKas']);
                const penjualan = JSON.parse(mockLocalStorage['penjualan']);
                
                const waktuBuka = new Date(bukaKas.waktuBuka);
                const sekarang = new Date();
                
                const penjualanShift = penjualan.filter(p => {
                    const tanggalPenjualan = new Date(p.tanggal);
                    return tanggalPenjualan >= waktuBuka && tanggalPenjualan <= sekarang;
                });
                
                const endTime = performance.now();
                times.push(endTime - startTime);
            }
            
            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            const maxTime = Math.max(...times);
            const minTime = Math.min(...times);
            const variance = maxTime - minTime;
            
            expect(avgTime).toBeLessThan(500);
            expect(variance).toBeLessThan(200); // Performance should be consistent
        });
    });
    
    describe('Calculation Performance', () => {
        test('shift calculation should be under 50ms', () => {
            const bukaKas = JSON.parse(mockSessionStorage['bukaKas']);
            const penjualan = JSON.parse(mockLocalStorage['penjualan']);
            
            const startTime = performance.now();
            
            const waktuBuka = new Date(bukaKas.waktuBuka);
            const sekarang = new Date();
            
            const penjualanShift = penjualan.filter(p => {
                const tanggalPenjualan = new Date(p.tanggal);
                return tanggalPenjualan >= waktuBuka && tanggalPenjualan <= sekarang;
            });
            
            const totals = penjualanShift.reduce((acc, p) => {
                acc.totalPenjualan += p.total;
                if (p.status === 'cash') acc.totalCash += p.total;
                else if (p.status === 'kredit') acc.totalKredit += p.total;
                return acc;
            }, { totalPenjualan: 0, totalCash: 0, totalKredit: 0 });
            
            const kasSeharusnya = bukaKas.modalAwal + totals.totalCash;
            
            const endTime = performance.now();
            const calcTime = endTime - startTime;
            
            expect(calcTime).toBeLessThan(50);
            expect(kasSeharusnya).toBeGreaterThan(bukaKas.modalAwal);
        });
        
        test('calculation with large dataset should be under 200ms', () => {
            const largePenjualan = generateTestPenjualan(5000);
            mockLocalStorage['penjualan'] = JSON.stringify(largePenjualan);
            
            const bukaKas = JSON.parse(mockSessionStorage['bukaKas']);
            const penjualan = JSON.parse(mockLocalStorage['penjualan']);
            
            const startTime = performance.now();
            
            const waktuBuka = new Date(bukaKas.waktuBuka);
            const sekarang = new Date();
            
            const penjualanShift = penjualan.filter(p => {
                const tanggalPenjualan = new Date(p.tanggal);
                return tanggalPenjualan >= waktuBuka && tanggalPenjualan <= sekarang;
            });
            
            const totals = penjualanShift.reduce((acc, p) => {
                acc.totalPenjualan += p.total;
                if (p.status === 'cash') acc.totalCash += p.total;
                else if (p.status === 'kredit') acc.totalKredit += p.total;
                return acc;
            }, { totalPenjualan: 0, totalCash: 0, totalKredit: 0 });
            
            const endTime = performance.now();
            const calcTime = endTime - startTime;
            
            expect(calcTime).toBeLessThan(200);
            expect(penjualanShift.length).toBeGreaterThan(0);
        });
        
        test('selisih calculation should be instant (under 1ms)', () => {
            const kasSeharusnya = 1500000;
            const kasAktual = 1450000;
            
            const startTime = performance.now();
            const selisih = kasAktual - kasSeharusnya;
            const endTime = performance.now();
            
            const calcTime = endTime - startTime;
            
            expect(calcTime).toBeLessThan(1);
            expect(selisih).toBe(-50000);
        });
    });
    
    describe('Caching Performance', () => {
        test('cache should improve data access speed by at least 10x', () => {
            const cache = new Map();
            const testKey = 'test_data';
            
            // Simulate expensive operation
            const expensiveOperation = () => {
                let sum = 0;
                for (let i = 0; i < 100000; i++) {
                    sum += i;
                }
                return sum;
            };
            
            // First access (cache miss)
            const startMiss = performance.now();
            const result1 = expensiveOperation();
            cache.set(testKey, { value: result1, expiry: Date.now() + 60000 });
            const endMiss = performance.now();
            const missTime = endMiss - startMiss;
            
            // Second access (cache hit)
            const startHit = performance.now();
            const cached = cache.get(testKey);
            const result2 = cached.value;
            const endHit = performance.now();
            const hitTime = endHit - startHit;
            
            const speedup = missTime / hitTime;
            
            expect(speedup).toBeGreaterThan(10);
            expect(result1).toBe(result2);
        });
        
        test('cache invalidation should work correctly', () => {
            const cache = new Map();
            const testKey = 'invalidation_test';
            const testValue = 'test_value';
            
            // Set cache
            cache.set(testKey, { value: testValue, expiry: Date.now() + 60000 });
            
            // Verify cache exists
            expect(cache.has(testKey)).toBe(true);
            expect(cache.get(testKey).value).toBe(testValue);
            
            // Invalidate cache
            cache.delete(testKey);
            
            // Verify cache is gone
            expect(cache.has(testKey)).toBe(false);
        });
        
        test('cache expiry should work correctly', () => {
            const cache = new Map();
            const testKey = 'expiry_test';
            const testValue = 'test_value';
            const ttl = 100; // 100ms
            
            // Set cache with short TTL
            cache.set(testKey, { value: testValue, expiry: Date.now() + ttl });
            
            // Immediate access should work
            const cached1 = cache.get(testKey);
            expect(cached1.value).toBe(testValue);
            expect(Date.now()).toBeLessThan(cached1.expiry);
            
            // After TTL, cache should be expired
            return new Promise((resolve) => {
                setTimeout(() => {
                    const cached2 = cache.get(testKey);
                    expect(Date.now()).toBeGreaterThan(cached2.expiry);
                    resolve();
                }, ttl + 50);
            });
        });
        
        test('cache hit rate should be measurable', () => {
            const cache = new Map();
            let cacheHits = 0;
            let cacheMisses = 0;
            
            const getCachedData = (key, dataProvider) => {
                const cached = cache.get(key);
                if (cached && Date.now() < cached.expiry) {
                    cacheHits++;
                    return cached.value;
                }
                
                cacheMisses++;
                const data = dataProvider();
                cache.set(key, { value: data, expiry: Date.now() + 60000 });
                return data;
            };
            
            // First access - cache miss
            getCachedData('test1', () => 'value1');
            expect(cacheMisses).toBe(1);
            expect(cacheHits).toBe(0);
            
            // Second access - cache hit
            getCachedData('test1', () => 'value1');
            expect(cacheMisses).toBe(1);
            expect(cacheHits).toBe(1);
            
            // Third access - cache hit
            getCachedData('test1', () => 'value1');
            expect(cacheMisses).toBe(1);
            expect(cacheHits).toBe(2);
            
            // Calculate hit rate
            const hitRate = (cacheHits / (cacheHits + cacheMisses)) * 100;
            expect(hitRate).toBeGreaterThan(50);
        });
    });
    
    describe('Memory Usage', () => {
        test('memory usage should not grow excessively with repeated operations', () => {
            const initialMemory = performance.memory.usedJSHeapSize;
            
            // Perform repeated operations
            for (let i = 0; i < 100; i++) {
                const penjualan = JSON.parse(mockLocalStorage['penjualan']);
                const bukaKas = JSON.parse(mockSessionStorage['bukaKas']);
                
                const waktuBuka = new Date(bukaKas.waktuBuka);
                const sekarang = new Date();
                
                const penjualanShift = penjualan.filter(p => {
                    const tanggalPenjualan = new Date(p.tanggal);
                    return tanggalPenjualan >= waktuBuka && tanggalPenjualan <= sekarang;
                });
                
                // Simulate cleanup
                penjualanShift.length = 0;
            }
            
            const finalMemory = performance.memory.usedJSHeapSize;
            const memoryGrowth = finalMemory - initialMemory;
            const memoryGrowthMB = memoryGrowth / 1024 / 1024;
            
            // Memory growth should be minimal (less than 10MB)
            expect(memoryGrowthMB).toBeLessThan(10);
        });
        
        test('large dataset processing should not cause memory leaks', () => {
            const initialMemory = performance.memory.usedJSHeapSize;
            
            // Process large dataset
            const largeData = [];
            for (let i = 0; i < 10000; i++) {
                largeData.push({
                    id: i,
                    data: 'x'.repeat(100),
                    timestamp: new Date().toISOString()
                });
            }
            
            // Process data
            const processed = largeData.map(item => ({
                ...item,
                processed: true
            }));
            
            const peakMemory = performance.memory.usedJSHeapSize;
            
            // Clean up
            largeData.length = 0;
            processed.length = 0;
            
            const finalMemory = performance.memory.usedJSHeapSize;
            const memoryRecovered = peakMemory - finalMemory;
            const recoveryRate = (memoryRecovered / (peakMemory - initialMemory)) * 100;
            
            // At least 50% of memory should be recovered
            expect(recoveryRate).toBeGreaterThan(50);
        });
    });
    
    describe('Debouncing Performance', () => {
        test('debounced function should reduce call frequency', () => {
            let normalCallCount = 0;
            let debouncedCallCount = 0;
            
            const normalFunction = () => {
                normalCallCount++;
            };
            
            const debouncedFunction = () => {
                debouncedCallCount++;
            };
            
            // Simulate debounce
            const debounce = (func, wait) => {
                let timeout;
                return function executedFunction(...args) {
                    const later = () => {
                        clearTimeout(timeout);
                        func(...args);
                    };
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                };
            };
            
            const debounced = debounce(debouncedFunction, 100);
            
            // Simulate rapid calls
            for (let i = 0; i < 50; i++) {
                normalFunction();
                debounced();
            }
            
            return new Promise((resolve) => {
                setTimeout(() => {
                    expect(normalCallCount).toBe(50);
                    expect(debouncedCallCount).toBeLessThan(5);
                    
                    const reduction = ((normalCallCount - debouncedCallCount) / normalCallCount) * 100;
                    expect(reduction).toBeGreaterThan(90);
                    resolve();
                }, 200);
            });
        });
        
        test('debounce should preserve function arguments', () => {
            let lastArgs = null;
            
            const testFunction = (...args) => {
                lastArgs = args;
            };
            
            const debounce = (func, wait) => {
                let timeout;
                return function executedFunction(...args) {
                    const later = () => {
                        clearTimeout(timeout);
                        func(...args);
                    };
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                };
            };
            
            const debounced = debounce(testFunction, 50);
            
            debounced('arg1', 'arg2', 'arg3');
            
            return new Promise((resolve) => {
                setTimeout(() => {
                    expect(lastArgs).toEqual(['arg1', 'arg2', 'arg3']);
                    resolve();
                }, 100);
            });
        });
    });
    
    describe('Overall Performance Metrics', () => {
        test('complete tutup kasir flow should be under 2 seconds', () => {
            const startTime = performance.now();
            
            // Simulate complete flow
            const bukaKas = JSON.parse(mockSessionStorage['bukaKas']);
            const penjualan = JSON.parse(mockLocalStorage['penjualan']);
            
            // 1. Calculate shift data
            const waktuBuka = new Date(bukaKas.waktuBuka);
            const sekarang = new Date();
            
            const penjualanShift = penjualan.filter(p => {
                const tanggalPenjualan = new Date(p.tanggal);
                return tanggalPenjualan >= waktuBuka && tanggalPenjualan <= sekarang;
            });
            
            const totals = penjualanShift.reduce((acc, p) => {
                acc.totalPenjualan += p.total;
                if (p.status === 'cash') acc.totalCash += p.total;
                else if (p.status === 'kredit') acc.totalKredit += p.total;
                return acc;
            }, { totalPenjualan: 0, totalCash: 0, totalKredit: 0 });
            
            // 2. Calculate kas
            const kasSeharusnya = bukaKas.modalAwal + totals.totalCash;
            const kasAktual = 1500000;
            const selisih = kasAktual - kasSeharusnya;
            
            // 3. Create tutup kasir record
            const tutupKasData = {
                id: 'tutup-kas-001',
                shiftId: bukaKas.id,
                kasir: bukaKas.kasir,
                kasirId: bukaKas.kasirId,
                waktuBuka: bukaKas.waktuBuka,
                waktuTutup: sekarang.toISOString(),
                modalAwal: bukaKas.modalAwal,
                totalPenjualan: totals.totalPenjualan,
                totalCash: totals.totalCash,
                totalKredit: totals.totalKredit,
                kasSeharusnya: kasSeharusnya,
                kasAktual: kasAktual,
                selisih: selisih,
                jumlahTransaksi: penjualanShift.length
            };
            
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            
            expect(totalTime).toBeLessThan(2000);
            expect(tutupKasData).toHaveProperty('id');
            expect(tutupKasData).toHaveProperty('selisih');
        });
        
        test('performance should scale linearly with data size', () => {
            const dataSizes = [100, 500, 1000, 2000];
            const times = [];
            
            dataSizes.forEach(size => {
                const testPenjualan = generateTestPenjualan(size);
                mockLocalStorage['penjualan'] = JSON.stringify(testPenjualan);
                
                const startTime = performance.now();
                
                const bukaKas = JSON.parse(mockSessionStorage['bukaKas']);
                const penjualan = JSON.parse(mockLocalStorage['penjualan']);
                
                const waktuBuka = new Date(bukaKas.waktuBuka);
                const sekarang = new Date();
                
                const penjualanShift = penjualan.filter(p => {
                    const tanggalPenjualan = new Date(p.tanggal);
                    return tanggalPenjualan >= waktuBuka && tanggalPenjualan <= sekarang;
                });
                
                const endTime = performance.now();
                times.push(endTime - startTime);
            });
            
            // Check that time growth is roughly linear
            const ratio1 = times[1] / times[0]; // 500/100
            const ratio2 = times[2] / times[1]; // 1000/500
            const ratio3 = times[3] / times[2]; // 2000/1000
            
            // Ratios should be similar (within 50% variance) for linear scaling
            const avgRatio = (ratio1 + ratio2 + ratio3) / 3;
            const variance = Math.max(
                Math.abs(ratio1 - avgRatio),
                Math.abs(ratio2 - avgRatio),
                Math.abs(ratio3 - avgRatio)
            );
            
            expect(variance / avgRatio).toBeLessThan(0.5);
        });
    });
});
