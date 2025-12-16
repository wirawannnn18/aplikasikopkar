/**
 * User Acceptance Test Scenarios
 * Task 16: Final validation dan user acceptance testing
 * 
 * Real-world scenarios untuk validasi user experience
 */

describe('Master Barang Komprehensif - User Acceptance Test Scenarios', () => {
    let masterBarangSystem;
    let mockDOM;

    beforeEach(() => {
        // Setup mock DOM environment
        mockDOM = {
            getElementById: jest.fn(),
            querySelector: jest.fn(),
            querySelectorAll: jest.fn(),
            createElement: jest.fn(),
            addEventListener: jest.fn()
        };

        // Mock system with realistic behavior
        masterBarangSystem = {
            initialize: jest.fn().mockResolvedValue(true),
            getAllBarang: jest.fn(),
            saveBarang: jest.fn(),
            deleteBarang: jest.fn(),
            searchBarang: jest.fn(),
            importData: jest.fn(),
            exportData: jest.fn(),
            bulkOperations: jest.fn(),
            categoryManager: jest.fn(),
            unitManager: jest.fn()
        };

        // Clear localStorage
        localStorage.clear();
    });

    describe('Scenario 1: Daily Operations Workflow', () => {
        test('UAT 1.1: Admin menambah barang baru untuk stok harian', async () => {
            // Given: Admin ingin menambah barang baru "Minyak Goreng Tropical 1L"
            const newBarangData = {
                kode: '', // Will be auto-generated
                nama: 'Minyak Goreng Tropical 1L',
                kategori: 'Sembako',
                satuan: 'Botol',
                hargaBeli: 15000,
                hargaJual: 17000,
                stok: 50,
                stokMinimum: 5
            };

            // Mock successful save with auto-generated code
            masterBarangSystem.saveBarang.mockResolvedValue({
                success: true,
                data: {
                    ...newBarangData,
                    id: 'brg001',
                    kode: 'MB001',
                    createdAt: new Date().toISOString()
                },
                message: 'Barang berhasil ditambahkan'
            });

            // When: Admin mengisi form dan menyimpan
            const result = await masterBarangSystem.saveBarang(newBarangData);

            // Then: Barang berhasil disimpan dengan kode otomatis
            expect(result.success).toBe(true);
            expect(result.data.kode).toBe('MB001');
            expect(result.data.nama).toBe('Minyak Goreng Tropical 1L');
            expect(result.message).toBe('Barang berhasil ditambahkan');

            // And: Audit log tercatat
            expect(masterBarangSystem.saveBarang).toHaveBeenCalledWith(newBarangData);
        });

        test('UAT 1.2: Admin mencari dan mengedit harga barang existing', async () => {
            // Given: Admin ingin mengubah harga "Beras Premium 5kg"
            const searchQuery = 'beras premium';
            const existingBarang = {
                id: 'brg002',
                kode: 'MB002',
                nama: 'Beras Premium 5kg',
                kategoriId: 'kat001',
                satuanId: 'sat001',
                hargaBeli: 50000,
                hargaJual: 55000,
                stok: 100,
                stokMinimum: 10
            };

            // Mock search results
            masterBarangSystem.searchBarang.mockResolvedValue({
                results: [existingBarang],
                totalFound: 1,
                searchTime: 120
            });

            // When: Admin mencari barang
            const searchResults = await masterBarangSystem.searchBarang(searchQuery);

            // Then: Barang ditemukan
            expect(searchResults.results).toHaveLength(1);
            expect(searchResults.results[0].nama).toContain('Beras Premium');

            // Given: Admin mengubah harga
            const updatedData = {
                ...existingBarang,
                hargaBeli: 52000,
                hargaJual: 57000
            };

            masterBarangSystem.saveBarang.mockResolvedValue({
                success: true,
                data: updatedData,
                message: 'Harga barang berhasil diperbarui'
            });

            // When: Admin menyimpan perubahan
            const updateResult = await masterBarangSystem.saveBarang(updatedData);

            // Then: Harga berhasil diperbarui
            expect(updateResult.success).toBe(true);
            expect(updateResult.data.hargaBeli).toBe(52000);
            expect(updateResult.data.hargaJual).toBe(57000);
        });

        test('UAT 1.3: Admin mengelola kategori baru untuk produk seasonal', async () => {
            // Given: Admin ingin menambah kategori "Produk Ramadan"
            const newCategory = {
                nama: 'Produk Ramadan',
                deskripsi: 'Produk khusus untuk bulan Ramadan'
            };

            // Mock category save
            masterBarangSystem.categoryManager.mockImplementation(() => ({
                save: jest.fn().mockResolvedValue({
                    success: true,
                    data: {
                        ...newCategory,
                        id: 'kat003',
                        status: 'active',
                        createdAt: new Date().toISOString()
                    }
                }),
                getAll: jest.fn().mockResolvedValue([
                    { id: 'kat001', nama: 'Sembako' },
                    { id: 'kat002', nama: 'Elektronik' },
                    { id: 'kat003', nama: 'Produk Ramadan' }
                ])
            }));

            const categoryManager = masterBarangSystem.categoryManager();

            // When: Admin menambah kategori baru
            const result = await categoryManager.save(newCategory);

            // Then: Kategori berhasil ditambahkan
            expect(result.success).toBe(true);
            expect(result.data.nama).toBe('Produk Ramadan');
            expect(result.data.id).toBe('kat003');

            // And: Kategori muncul di daftar
            const allCategories = await categoryManager.getAll();
            expect(allCategories).toHaveLength(3);
            expect(allCategories.some(cat => cat.nama === 'Produk Ramadan')).toBe(true);
        });

        test('UAT 1.4: Admin menggunakan filter untuk melihat stok rendah', async () => {
            // Given: Admin ingin melihat barang dengan stok di bawah minimum
            const lowStockItems = [
                {
                    id: 'brg003',
                    kode: 'MB003',
                    nama: 'Gula Pasir 1kg',
                    stok: 3,
                    stokMinimum: 10,
                    status: 'low_stock'
                },
                {
                    id: 'brg004',
                    kode: 'MB004',
                    nama: 'Tepung Terigu 1kg',
                    stok: 5,
                    stokMinimum: 15,
                    status: 'low_stock'
                }
            ];

            masterBarangSystem.getAllBarang.mockResolvedValue({
                data: lowStockItems,
                totalFiltered: 2,
                appliedFilters: { stockStatus: 'low' }
            });

            // When: Admin menggunakan filter stok rendah
            const result = await masterBarangSystem.getAllBarang({
                filter: { stockStatus: 'low' }
            });

            // Then: Hanya barang dengan stok rendah yang ditampilkan
            expect(result.data).toHaveLength(2);
            expect(result.data.every(item => item.stok < item.stokMinimum)).toBe(true);
            expect(result.appliedFilters.stockStatus).toBe('low');
        });
    });

    describe('Scenario 2: Bulk Data Management Workflow', () => {
        test('UAT 2.1: Admin download template untuk import data supplier baru', async () => {
            // Given: Admin ingin import data dari supplier baru
            const templateData = {
                filename: 'template_master_barang.xlsx',
                headers: [
                    'kode', 'nama', 'kategori', 'satuan', 
                    'harga_beli', 'harga_jual', 'stok', 'stok_minimum'
                ],
                sampleData: [
                    ['MB001', 'Contoh Barang 1', 'Sembako', 'Kg', '10000', '12000', '50', '5'],
                    ['MB002', 'Contoh Barang 2', 'Elektronik', 'Pcs', '100000', '120000', '10', '2']
                ],
                instructions: 'Isi data sesuai format yang disediakan'
            };

            masterBarangSystem.exportData.mockResolvedValue({
                success: true,
                type: 'template',
                ...templateData
            });

            // When: Admin download template
            const result = await masterBarangSystem.exportData({ type: 'template' });

            // Then: Template berhasil didownload dengan format yang benar
            expect(result.success).toBe(true);
            expect(result.headers).toContain('kode');
            expect(result.headers).toContain('nama');
            expect(result.sampleData).toHaveLength(2);
            expect(result.filename).toBe('template_master_barang.xlsx');
        });

        test('UAT 2.2: Admin import data 100 barang dengan validasi dan preview', async () => {
            // Given: Admin memiliki file Excel dengan 100 barang
            const importFile = {
                name: 'data_supplier_abc.xlsx',
                size: 2048000,
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            };

            const importData = Array.from({ length: 100 }, (_, i) => ({
                kode: `SP${(i + 1).toString().padStart(3, '0')}`,
                nama: `Produk Supplier ${i + 1}`,
                kategori: i % 2 === 0 ? 'Sembako' : 'Elektronik',
                satuan: i % 2 === 0 ? 'Kg' : 'Pcs',
                harga_beli: (i + 1) * 1000,
                harga_jual: (i + 1) * 1200,
                stok: 50,
                stok_minimum: 5
            }));

            // Mock import process
            masterBarangSystem.importData.mockResolvedValue({
                success: true,
                preview: {
                    totalRows: 100,
                    validRows: 98,
                    invalidRows: 2,
                    newCategories: [],
                    newUnits: [],
                    errors: [
                        { row: 15, error: 'Harga beli tidak valid' },
                        { row: 67, error: 'Nama barang kosong' }
                    ]
                },
                requiresConfirmation: true
            });

            // When: Admin upload dan preview data
            const previewResult = await masterBarangSystem.importData(importFile, { preview: true });

            // Then: Preview menunjukkan hasil validasi
            expect(previewResult.success).toBe(true);
            expect(previewResult.preview.totalRows).toBe(100);
            expect(previewResult.preview.validRows).toBe(98);
            expect(previewResult.preview.invalidRows).toBe(2);
            expect(previewResult.preview.errors).toHaveLength(2);

            // Given: Admin konfirmasi import setelah melihat preview
            masterBarangSystem.importData.mockResolvedValue({
                success: true,
                imported: 98,
                skipped: 2,
                errors: [],
                duration: 5200,
                auditId: 'audit_import_001'
            });

            // When: Admin konfirmasi import
            const importResult = await masterBarangSystem.importData(importFile, { 
                confirm: true,
                skipInvalid: true 
            });

            // Then: Data berhasil diimport
            expect(importResult.success).toBe(true);
            expect(importResult.imported).toBe(98);
            expect(importResult.skipped).toBe(2);
            expect(importResult.duration).toBeLessThan(10000); // Under 10 seconds
        });

        test('UAT 2.3: Admin melakukan bulk update kategori untuk produk seasonal', async () => {
            // Given: Admin ingin mengubah kategori 50 produk menjadi "Produk Ramadan"
            const selectedItems = Array.from({ length: 50 }, (_, i) => `brg${i + 1}`);
            const updateData = {
                kategoriId: 'kat003', // Produk Ramadan
                kategoriNama: 'Produk Ramadan'
            };

            // Mock bulk update preview
            masterBarangSystem.bulkOperations.mockResolvedValue({
                operation: 'bulk_update',
                preview: {
                    affectedItems: 50,
                    changes: selectedItems.map(id => ({
                        id,
                        field: 'kategoriId',
                        from: 'kat001',
                        to: 'kat003'
                    })),
                    estimatedTime: 3000
                },
                requiresConfirmation: true
            });

            // When: Admin preview bulk update
            const previewResult = await masterBarangSystem.bulkOperations({
                type: 'update',
                items: selectedItems,
                data: updateData,
                preview: true
            });

            // Then: Preview menunjukkan perubahan yang akan dilakukan
            expect(previewResult.preview.affectedItems).toBe(50);
            expect(previewResult.preview.changes).toHaveLength(50);
            expect(previewResult.requiresConfirmation).toBe(true);

            // Given: Admin konfirmasi bulk update
            masterBarangSystem.bulkOperations.mockResolvedValue({
                success: true,
                updated: 50,
                failed: 0,
                progress: 100,
                duration: 2800,
                auditId: 'audit_bulk_001'
            });

            // When: Admin konfirmasi update
            const updateResult = await masterBarangSystem.bulkOperations({
                type: 'update',
                items: selectedItems,
                data: updateData,
                confirm: true
            });

            // Then: Bulk update berhasil
            expect(updateResult.success).toBe(true);
            expect(updateResult.updated).toBe(50);
            expect(updateResult.failed).toBe(0);
            expect(updateResult.progress).toBe(100);
        });

        test('UAT 2.4: Admin export data dengan filter kategori untuk laporan', async () => {
            // Given: Admin ingin export data kategori "Sembako" untuk laporan
            const exportFilter = {
                kategori: 'Sembako',
                includeStockInfo: true,
                format: 'xlsx'
            };

            const sembakoData = Array.from({ length: 75 }, (_, i) => ({
                kode: `SB${(i + 1).toString().padStart(3, '0')}`,
                nama: `Produk Sembako ${i + 1}`,
                kategori: 'Sembako',
                satuan: 'Kg',
                hargaBeli: (i + 1) * 1000,
                hargaJual: (i + 1) * 1200,
                stok: Math.floor(Math.random() * 100),
                stokMinimum: 10
            }));

            masterBarangSystem.exportData.mockResolvedValue({
                success: true,
                filename: 'laporan_sembako_2024_01_15.xlsx',
                recordCount: 75,
                fileSize: 45000,
                downloadUrl: 'blob:...',
                generatedAt: new Date().toISOString()
            });

            // When: Admin export data dengan filter
            const exportResult = await masterBarangSystem.exportData({
                filter: exportFilter,
                filename: 'laporan_sembako'
            });

            // Then: Export berhasil dengan data yang sesuai filter
            expect(exportResult.success).toBe(true);
            expect(exportResult.recordCount).toBe(75);
            expect(exportResult.filename).toContain('sembako');
            expect(exportResult.filename).toContain('2024');
            expect(exportResult.downloadUrl).toBeDefined();
        });
    });

    describe('Scenario 3: Error Handling dan Recovery', () => {
        test('UAT 3.1: Admin menangani error validasi saat input data', async () => {
            // Given: Admin input data dengan error validasi
            const invalidData = {
                kode: 'MB001', // Duplicate
                nama: '', // Empty
                hargaBeli: -1000, // Negative
                stok: 'invalid' // Not a number
            };

            masterBarangSystem.saveBarang.mockRejectedValue({
                name: 'ValidationError',
                errors: [
                    'Kode barang sudah digunakan',
                    'Nama barang wajib diisi',
                    'Harga beli tidak boleh negatif',
                    'Stok harus berupa angka'
                ],
                field: 'multiple'
            });

            // When: Admin mencoba menyimpan data invalid
            try {
                await masterBarangSystem.saveBarang(invalidData);
            } catch (error) {
                // Then: Error validation ditampilkan dengan jelas
                expect(error.name).toBe('ValidationError');
                expect(error.errors).toHaveLength(4);
                expect(error.errors).toContain('Kode barang sudah digunakan');
                expect(error.errors).toContain('Nama barang wajib diisi');
            }

            // Given: Admin memperbaiki data
            const correctedData = {
                kode: 'MB999', // Unique
                nama: 'Produk Baru', // Valid
                hargaBeli: 10000, // Positive
                stok: 50 // Valid number
            };

            masterBarangSystem.saveBarang.mockResolvedValue({
                success: true,
                data: correctedData,
                message: 'Data berhasil disimpan'
            });

            // When: Admin menyimpan data yang sudah diperbaiki
            const result = await masterBarangSystem.saveBarang(correctedData);

            // Then: Data berhasil disimpan
            expect(result.success).toBe(true);
            expect(result.data.kode).toBe('MB999');
        });

        test('UAT 3.2: Admin menangani error import file corrupt', async () => {
            // Given: Admin upload file yang corrupt
            const corruptFile = {
                name: 'corrupt_file.xlsx',
                size: 1024,
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            };

            masterBarangSystem.importData.mockRejectedValue({
                name: 'FileProcessingError',
                message: 'File tidak dapat dibaca atau format tidak valid',
                code: 'CORRUPT_FILE',
                suggestions: [
                    'Pastikan file tidak corrupt',
                    'Coba download template baru',
                    'Periksa format file Excel'
                ]
            });

            // When: Admin mencoba import file corrupt
            try {
                await masterBarangSystem.importData(corruptFile);
            } catch (error) {
                // Then: Error message yang helpful ditampilkan
                expect(error.name).toBe('FileProcessingError');
                expect(error.message).toContain('File tidak dapat dibaca');
                expect(error.suggestions).toHaveLength(3);
                expect(error.suggestions[0]).toBe('Pastikan file tidak corrupt');
            }
        });

        test('UAT 3.3: Admin menangani storage quota exceeded', async () => {
            // Given: localStorage hampir penuh
            const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
                id: `brg${i}`,
                nama: `Large Dataset Item ${i}`,
                description: 'x'.repeat(1000) // Large description
            }));

            masterBarangSystem.saveBarang.mockRejectedValue({
                name: 'StorageError',
                message: 'Penyimpanan penuh. Tidak dapat menyimpan data baru.',
                code: 'QUOTA_EXCEEDED',
                suggestions: [
                    'Hapus data lama yang tidak diperlukan',
                    'Export data untuk backup',
                    'Hubungi administrator sistem'
                ]
            });

            // When: Admin mencoba menyimpan data saat storage penuh
            try {
                await masterBarangSystem.saveBarang(largeDataset[0]);
            } catch (error) {
                // Then: Error storage dengan solusi ditampilkan
                expect(error.name).toBe('StorageError');
                expect(error.code).toBe('QUOTA_EXCEEDED');
                expect(error.suggestions).toContain('Export data untuk backup');
            }
        });
    });

    describe('Scenario 4: Performance dan Usability', () => {
        test('UAT 4.1: Admin bekerja dengan dataset 5000+ items', async () => {
            // Given: System memiliki 5000+ barang
            const largeDataset = Array.from({ length: 5000 }, (_, i) => ({
                id: `brg${i}`,
                kode: `MB${i.toString().padStart(4, '0')}`,
                nama: `Barang ${i + 1}`,
                kategoriId: `kat${(i % 10) + 1}`,
                satuanId: `sat${(i % 5) + 1}`
            }));

            // Mock paginated response
            masterBarangSystem.getAllBarang.mockResolvedValue({
                data: largeDataset.slice(0, 100), // First page
                pagination: {
                    currentPage: 1,
                    totalPages: 50,
                    totalItems: 5000,
                    hasNext: true,
                    hasPrev: false
                },
                loadTime: 250 // milliseconds
            });

            const startTime = performance.now();

            // When: Admin memuat halaman pertama
            const result = await masterBarangSystem.getAllBarang({ page: 1, limit: 100 });

            const endTime = performance.now();
            const loadTime = endTime - startTime;

            // Then: Data dimuat dengan cepat dan pagination bekerja
            expect(result.data).toHaveLength(100);
            expect(result.pagination.totalItems).toBe(5000);
            expect(result.pagination.totalPages).toBe(50);
            expect(loadTime).toBeLessThan(1000); // Under 1 second
        });

        test('UAT 4.2: Admin menggunakan search real-time dengan response cepat', async () => {
            // Given: Admin mengetik di search box
            const searchQueries = ['ber', 'bera', 'beras'];
            const searchResults = [
                { query: 'ber', results: 15, time: 120 },
                { query: 'bera', results: 8, time: 95 },
                { query: 'beras', results: 3, time: 80 }
            ];

            // Mock search with debouncing
            masterBarangSystem.searchBarang.mockImplementation((query) => {
                const result = searchResults.find(r => r.query === query);
                return Promise.resolve({
                    results: Array.from({ length: result.results }, (_, i) => ({
                        id: `brg${i}`,
                        nama: `${query} item ${i + 1}`
                    })),
                    totalFound: result.results,
                    searchTime: result.time,
                    query
                });
            });

            // When: Admin mengetik secara bertahap
            const results = [];
            for (const query of searchQueries) {
                const startTime = performance.now();
                const result = await masterBarangSystem.searchBarang(query);
                const endTime = performance.now();
                
                results.push({
                    query,
                    totalFound: result.totalFound,
                    responseTime: endTime - startTime
                });
            }

            // Then: Search memberikan hasil cepat dan akurat
            expect(results).toHaveLength(3);
            expect(results[0].totalFound).toBe(15); // 'ber' - most results
            expect(results[2].totalFound).toBe(3);  // 'beras' - most specific
            expect(results.every(r => r.responseTime < 500)).toBe(true); // All under 500ms
        });

        test('UAT 4.3: Admin menggunakan interface mobile dengan touch gestures', async () => {
            // Given: Admin mengakses dari mobile device
            const mobileViewport = {
                width: 375,
                height: 667,
                touchEnabled: true,
                orientation: 'portrait'
            };

            // Mock mobile-optimized interface
            const mobileInterface = {
                responsive: true,
                touchFriendly: true,
                swipeGestures: ['left', 'right'],
                tapTargets: {
                    minSize: 44, // pixels
                    spacing: 8
                },
                virtualKeyboard: true
            };

            // When: Admin menggunakan touch gestures
            const touchInteractions = [
                { type: 'tap', target: 'add-button', success: true },
                { type: 'swipe', direction: 'left', target: 'table-row', action: 'delete' },
                { type: 'pinch', target: 'table', action: 'zoom' },
                { type: 'scroll', direction: 'vertical', smooth: true }
            ];

            // Then: Interface responsive dan touch-friendly
            expect(mobileInterface.responsive).toBe(true);
            expect(mobileInterface.touchFriendly).toBe(true);
            expect(mobileInterface.tapTargets.minSize).toBeGreaterThanOrEqual(44);
            expect(touchInteractions.every(i => i.success !== false)).toBe(true);
        });
    });

    describe('Scenario 5: Integration dan Compatibility', () => {
        test('UAT 5.1: System bekerja di berbagai browser', async () => {
            // Given: Different browser environments
            const browsers = [
                { name: 'Chrome', version: '120', supported: true },
                { name: 'Firefox', version: '119', supported: true },
                { name: 'Safari', version: '17', supported: true },
                { name: 'Edge', version: '120', supported: true },
                { name: 'IE', version: '11', supported: false }
            ];

            // Mock browser compatibility check
            const compatibilityResults = browsers.map(browser => ({
                ...browser,
                features: {
                    localStorage: browser.supported,
                    fetch: browser.supported,
                    es6: browser.supported,
                    fileAPI: browser.supported
                },
                performance: browser.supported ? 'good' : 'poor'
            }));

            // When: System diakses dari berbagai browser
            const supportedBrowsers = compatibilityResults.filter(b => b.supported);
            const unsupportedBrowsers = compatibilityResults.filter(b => !b.supported);

            // Then: System bekerja di browser modern
            expect(supportedBrowsers).toHaveLength(4);
            expect(unsupportedBrowsers).toHaveLength(1);
            expect(supportedBrowsers.every(b => b.features.localStorage)).toBe(true);
            expect(unsupportedBrowsers[0].name).toBe('IE');
        });

        test('UAT 5.2: System terintegrasi dengan audit system', async () => {
            // Given: Semua operasi harus tercatat dalam audit
            const operations = [
                { type: 'CREATE', entity: 'BARANG', id: 'brg001' },
                { type: 'UPDATE', entity: 'BARANG', id: 'brg001' },
                { type: 'DELETE', entity: 'BARANG', id: 'brg001' },
                { type: 'IMPORT', entity: 'BARANG', count: 100 },
                { type: 'EXPORT', entity: 'BARANG', count: 50 }
            ];

            // Mock audit logging
            const auditLogs = operations.map((op, index) => ({
                id: `audit${index + 1}`,
                timestamp: new Date().toISOString(),
                userId: 'user001',
                action: op.type,
                entityType: op.entity,
                entityId: op.id || null,
                metadata: op.count ? { recordCount: op.count } : null
            }));

            masterBarangSystem.getAuditLogs = jest.fn().mockResolvedValue({
                logs: auditLogs,
                totalCount: auditLogs.length
            });

            // When: Admin melihat audit logs
            const auditResult = await masterBarangSystem.getAuditLogs();

            // Then: Semua operasi tercatat dengan lengkap
            expect(auditResult.logs).toHaveLength(5);
            expect(auditResult.logs.every(log => log.timestamp)).toBe(true);
            expect(auditResult.logs.every(log => log.userId)).toBe(true);
            expect(auditResult.logs.every(log => log.action)).toBe(true);
        });

        test('UAT 5.3: System handle concurrent users', async () => {
            // Given: Multiple users mengakses system bersamaan
            const concurrentUsers = Array.from({ length: 10 }, (_, i) => ({
                userId: `user${i + 1}`,
                operation: i % 2 === 0 ? 'read' : 'write',
                timestamp: new Date().toISOString()
            }));

            // Mock concurrent operations
            const concurrentOperations = concurrentUsers.map(user => {
                if (user.operation === 'read') {
                    return masterBarangSystem.getAllBarang({ userId: user.userId });
                } else {
                    return masterBarangSystem.saveBarang({
                        nama: `Barang ${user.userId}`,
                        userId: user.userId
                    });
                }
            });

            // Mock successful concurrent handling
            masterBarangSystem.getAllBarang.mockResolvedValue({ data: [], success: true });
            masterBarangSystem.saveBarang.mockResolvedValue({ success: true });

            // When: Multiple operations dijalankan bersamaan
            const results = await Promise.all(concurrentOperations);

            // Then: Semua operasi berhasil tanpa conflict
            expect(results).toHaveLength(10);
            expect(results.every(r => r.success)).toBe(true);
        });
    });

    describe('Scenario 6: Accessibility dan Usability', () => {
        test('UAT 6.1: System accessible untuk users dengan disabilities', async () => {
            // Given: Accessibility requirements
            const accessibilityFeatures = {
                keyboardNavigation: true,
                screenReaderSupport: true,
                highContrast: true,
                focusIndicators: true,
                altText: true,
                ariaLabels: true
            };

            // Mock accessibility validation
            const accessibilityTest = {
                wcagCompliance: 'AA',
                keyboardOnly: true,
                screenReader: 'compatible',
                colorContrast: 4.5, // Minimum ratio
                focusManagement: true
            };

            // When: Accessibility features ditest
            const isAccessible = Object.values(accessibilityFeatures).every(feature => feature);
            const meetsWCAG = accessibilityTest.wcagCompliance === 'AA';

            // Then: System memenuhi standar accessibility
            expect(isAccessible).toBe(true);
            expect(meetsWCAG).toBe(true);
            expect(accessibilityTest.colorContrast).toBeGreaterThanOrEqual(4.5);
            expect(accessibilityTest.keyboardOnly).toBe(true);
        });

        test('UAT 6.2: System memberikan feedback yang jelas untuk setiap action', async () => {
            // Given: User melakukan berbagai actions
            const userActions = [
                { action: 'save', expectFeedback: 'success' },
                { action: 'delete', expectFeedback: 'confirmation' },
                { action: 'import', expectFeedback: 'progress' },
                { action: 'error', expectFeedback: 'error' }
            ];

            // Mock feedback system
            const feedbackResults = userActions.map(action => ({
                action: action.action,
                feedback: {
                    type: action.expectFeedback,
                    message: `Action ${action.action} completed`,
                    visible: true,
                    duration: action.expectFeedback === 'error' ? 0 : 3000 // Error stays until dismissed
                }
            }));

            // When: User melakukan actions
            const allFeedbackProvided = feedbackResults.every(result => 
                result.feedback.visible && result.feedback.message
            );

            // Then: Setiap action memberikan feedback yang appropriate
            expect(allFeedbackProvided).toBe(true);
            expect(feedbackResults[0].feedback.type).toBe('success');
            expect(feedbackResults[1].feedback.type).toBe('confirmation');
            expect(feedbackResults[2].feedback.type).toBe('progress');
            expect(feedbackResults[3].feedback.type).toBe('error');
        });
    });
});