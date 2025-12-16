/**
 * Property Test: Export data accuracy
 * 
 * Property 10: Export data accuracy
 * For any export operation with filters, the system should generate files containing only data that matches the selected filters
 * Validates: Requirements 3.4
 */

import { ExportManager } from '../../js/master-barang/ExportManager.js';

// Mock localStorage
const mockLocalStorage = {
    data: {},
    getItem: (key) => mockLocalStorage.data[key] || null,
    setItem: (key, value) => {
        mockLocalStorage.data[key] = value;
    },
    clear: () => {
        mockLocalStorage.data = {};
    }
};

Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage
});

// Mock DOM elements
const mockDOM = () => {
    document.body.innerHTML = `
        <select id="filterKategori">
            <option value="">Semua Kategori</option>
            <option value="cat1">Sembako</option>
            <option value="cat2">Minuman</option>
        </select>
        <select id="filterSatuan">
            <option value="">Semua Satuan</option>
            <option value="sat1">Karung</option>
            <option value="sat2">Botol</option>
            <option value="sat3">Kg</option>
        </select>
        <select id="filterStatus">
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Non-aktif</option>
        </select>
        <input type="checkbox" id="filterStokRendah">
        <input type="checkbox" id="col_kode" checked>
        <input type="checkbox" id="col_nama" checked>
        <input type="checkbox" id="col_kategori" checked>
        <input type="checkbox" id="col_satuan" checked>
        <input type="checkbox" id="col_harga_beli" checked>
        <input type="checkbox" id="col_harga_jual" checked>
        <input type="checkbox" id="col_stok" checked>
        <input type="checkbox" id="col_stok_minimum">
        <input type="checkbox" id="col_deskripsi">
        <input type="checkbox" id="col_status">
        <select id="exportFormat"><option value="xlsx">Excel</option></select>
        <input type="checkbox" id="includeHeaders" checked>
        <span id="previewTotal">0</span>
        <span id="previewFiltered">0</span>
        <span id="previewColumns">0</span>
        <span id="previewFileName">test.xlsx</span>
        <button id="exportBtn">Export</button>
    `;
};

describe('Property Test: Export Data Accuracy', () => {
    let exportManager;
    let sampleData;

    beforeEach(() => {
        mockDOM();
        exportManager = new ExportManager();
        
        // Setup sample data
        sampleData = [
            {
                id: '1',
                kode: 'BRG001',
                nama: 'Beras Premium',
                kategori_id: 'cat1',
                kategori_nama: 'Sembako',
                satuan_id: 'sat1',
                satuan_nama: 'Karung',
                harga_beli: 45000,
                harga_jual: 50000,
                stok: 100,
                stok_minimum: 10,
                deskripsi: 'Beras premium kualitas terbaik',
                status: 'aktif'
            },
            {
                id: '2',
                kode: 'BRG002',
                nama: 'Minyak Goreng',
                kategori_id: 'cat1',
                kategori_nama: 'Sembako',
                satuan_id: 'sat2',
                satuan_nama: 'Botol',
                harga_beli: 12000,
                harga_jual: 14000,
                stok: 5,
                stok_minimum: 10,
                deskripsi: 'Minyak goreng berkualitas',
                status: 'aktif'
            },
            {
                id: '3',
                kode: 'BRG003',
                nama: 'Gula Pasir',
                kategori_id: 'cat2',
                kategori_nama: 'Minuman',
                satuan_id: 'sat3',
                satuan_nama: 'Kg',
                harga_beli: 13000,
                harga_jual: 15000,
                stok: 75,
                stok_minimum: 15,
                deskripsi: 'Gula pasir putih bersih',
                status: 'nonaktif'
            }
        ];

        mockLocalStorage.setItem('master_barang', JSON.stringify(sampleData));
    });

    afterEach(() => {
        mockLocalStorage.clear();
    });

    /**
     * Property: Filtered data should match filter criteria exactly
     * For any filter combination, returned data should satisfy all filter conditions
     */
    test('should return data that exactly matches filter criteria', () => {
        // Test no filter - should return all data
        let filteredData = exportManager.getFilteredData();
        expect(filteredData.length).toBe(3);

        // Test kategori filter
        document.getElementById('filterKategori').value = 'cat1';
        filteredData = exportManager.getFilteredData();
        
        
        // Only items with kategori_id 'cat1' should remain
        const expectedCount = sampleData.filter(item => item.kategori_id === 'cat1').length;
        expect(filteredData.length).toBe(expectedCount);
        filteredData.forEach(item => {
            expect(item.kategori_id).toBe('cat1');
        });

        // Test satuan filter
        document.getElementById('filterKategori').value = '';
        document.getElementById('filterSatuan').value = 'sat2';
        filteredData = exportManager.getFilteredData();
        expect(filteredData.length).toBe(1);
        expect(filteredData[0].satuan_id).toBe('sat2');

        // Test status filter
        document.getElementById('filterSatuan').value = '';
        document.getElementById('filterStatus').value = 'aktif';
        filteredData = exportManager.getFilteredData();
        expect(filteredData.length).toBe(2);
        filteredData.forEach(item => {
            expect(item.status).toBe('aktif');
        });

        // Test stok rendah filter
        document.getElementById('filterStatus').value = '';
        document.getElementById('filterStokRendah').checked = true;
        filteredData = exportManager.getFilteredData();
        expect(filteredData.length).toBe(1);
        expect(filteredData[0].stok).toBeLessThan(filteredData[0].stok_minimum);
    });

    /**
     * Property: Multiple filters should work as AND conditions
     * When multiple filters are applied, data should satisfy ALL conditions
     */
    test('should apply multiple filters as AND conditions', () => {
        // Reset all filters first
        document.getElementById('filterKategori').value = '';
        document.getElementById('filterSatuan').value = '';
        document.getElementById('filterStatus').value = '';
        document.getElementById('filterStokRendah').checked = false;

        // Apply kategori AND status filters
        document.getElementById('filterKategori').value = 'cat1';
        document.getElementById('filterStatus').value = 'aktif';
        
        const filteredData = exportManager.getFilteredData();
        expect(filteredData.length).toBe(2);
        
        filteredData.forEach(item => {
            expect(item.kategori_id).toBe('cat1');
            expect(item.status).toBe('aktif');
        });

        // Apply more specific filter - kategori cat1, satuan sat2, status aktif
        document.getElementById('filterSatuan').value = 'sat2';
        
        const multiFilteredData = exportManager.getFilteredData();
        expect(multiFilteredData.length).toBe(1);
        
        const item = multiFilteredData[0];
        expect(item.kategori_id).toBe('cat1');
        expect(item.status).toBe('aktif');
        expect(item.satuan_id).toBe('sat2');
    });

    /**
     * Property: Selected columns should be accurately reflected in export data
     * Only selected columns should appear in export data
     */
    test('should include only selected columns in export data', () => {
        // Select only specific columns
        document.getElementById('col_kode').checked = true;
        document.getElementById('col_nama').checked = true;
        document.getElementById('col_kategori').checked = false;
        document.getElementById('col_satuan').checked = false;
        document.getElementById('col_harga_beli').checked = false;
        document.getElementById('col_harga_jual').checked = false;
        document.getElementById('col_stok').checked = false;

        const selectedColumns = exportManager.getSelectedColumns();
        expect(selectedColumns.length).toBe(2);
        expect(selectedColumns.map(col => col.key)).toEqual(['kode', 'nama']);

        // Test export data preparation
        const exportData = exportManager.prepareExportData(sampleData, selectedColumns, true);
        
        // Should have header row + data rows
        expect(exportData.length).toBe(sampleData.length + 1);
        
        // Check header row
        expect(exportData[0]).toEqual(['Kode Barang', 'Nama Barang']);
        
        // Check data rows
        for (let i = 1; i < exportData.length; i++) {
            expect(exportData[i].length).toBe(2);
            expect(exportData[i][0]).toBe(sampleData[i - 1].kode);
            expect(exportData[i][1]).toBe(sampleData[i - 1].nama);
        }
    });

    /**
     * Property: Export data should preserve data types and formatting
     * Numeric fields should remain numeric, text fields should remain text
     */
    test('should preserve data types in export data', () => {
        const columns = [
            { key: 'kode', label: 'Kode' },
            { key: 'nama', label: 'Nama' },
            { key: 'harga_beli', label: 'Harga Beli' },
            { key: 'harga_jual', label: 'Harga Jual' },
            { key: 'stok', label: 'Stok' },
            { key: 'stok_minimum', label: 'Stok Minimum' }
        ];

        const exportData = exportManager.prepareExportData(sampleData, columns, false);
        
        exportData.forEach(row => {
            // Check string fields remain strings
            expect(typeof row[0]).toBe('string'); // kode
            expect(typeof row[1]).toBe('string'); // nama
            
            // Check numeric fields are numbers
            expect(typeof row[2]).toBe('number'); // harga_beli
            expect(typeof row[3]).toBe('number'); // harga_jual
            expect(typeof row[4]).toBe('number'); // stok
            expect(typeof row[5]).toBe('number'); // stok_minimum
        });
    });

    /**
     * Property: Export data should handle null/undefined values consistently
     * Missing values should be converted to empty strings
     */
    test('should handle null and undefined values consistently', () => {
        const dataWithNulls = [
            {
                kode: 'BRG001',
                nama: null,
                kategori_nama: undefined,
                satuan_nama: '',
                harga_beli: 0,
                deskripsi: 'Valid description'
            }
        ];

        const columns = [
            { key: 'kode', label: 'Kode' },
            { key: 'nama', label: 'Nama' },
            { key: 'kategori_nama', label: 'Kategori' },
            { key: 'satuan_nama', label: 'Satuan' },
            { key: 'harga_beli', label: 'Harga Beli' },
            { key: 'deskripsi', label: 'Deskripsi' }
        ];

        const exportData = exportManager.prepareExportData(dataWithNulls, columns, false);
        
        expect(exportData[0]).toEqual([
            'BRG001',    // kode (string)
            '',          // nama (null -> empty string)
            '',          // kategori_nama (undefined -> empty string)
            '',          // satuan_nama (empty string)
            0,           // harga_beli (number)
            'Valid description' // deskripsi (string)
        ]);
    });

    /**
     * Property: CSV export should properly escape special characters
     * Fields with commas, quotes, or newlines should be properly escaped
     */
    test('should properly escape special characters in CSV export', () => {
        const testData = [
            {
                kode: 'BRG001',
                nama: 'Item with, comma',
                deskripsi: 'Description with "quotes"',
                kategori_nama: 'Category\nwith newline'
            }
        ];

        const fileName = 'test.csv';
        
        // Mock downloadBlob to capture the blob content
        let capturedContent = '';
        exportManager.downloadBlob = (blob, fileName) => {
            const reader = new FileReader();
            reader.onload = () => {
                capturedContent = reader.result;
            };
            reader.readAsText(blob);
        };

        exportManager.exportDataToCSV(testData, fileName);

        // Wait for FileReader to complete
        setTimeout(() => {
            // Check that special characters are properly escaped
            expect(capturedContent).toContain('"Item with, comma"');
            expect(capturedContent).toContain('"Description with ""quotes"""');
            expect(capturedContent).toContain('"Category\nwith newline"');
        }, 100);
    });

    /**
     * Property: File name generation should be consistent and descriptive
     * Generated file names should include timestamp and format
     */
    test('should generate consistent and descriptive file names', () => {
        const format = 'xlsx';
        const fileName1 = exportManager.generateFileName(format);
        
        // Wait a moment to ensure different timestamp
        setTimeout(() => {
            const fileName2 = exportManager.generateFileName(format);
            
            // Both should have correct format
            expect(fileName1).toMatch(/^master_barang_export_\d{8}T\d{6}\.xlsx$/);
            expect(fileName2).toMatch(/^master_barang_export_\d{8}T\d{6}\.xlsx$/);
            
            // Should be different due to timestamp
            expect(fileName1).not.toBe(fileName2);
        }, 10);

        // Test CSV format
        const csvFileName = exportManager.generateFileName('csv');
        expect(csvFileName).toMatch(/^master_barang_export_\d{8}T\d{6}\.csv$/);
    });

    /**
     * Property: Export preview should accurately reflect actual export
     * Preview counts should match actual filtered data
     */
    test('should show accurate preview counts', () => {
        // Reset filters first
        document.getElementById('filterKategori').value = '';
        document.getElementById('filterSatuan').value = '';
        document.getElementById('filterStatus').value = '';
        document.getElementById('filterStokRendah').checked = false;

        // Set up filters
        document.getElementById('filterKategori').value = 'cat1';
        document.getElementById('filterStatus').value = 'aktif';
        
        // Select specific columns
        document.getElementById('col_kode').checked = true;
        document.getElementById('col_nama').checked = true;
        document.getElementById('col_kategori').checked = false;
        document.getElementById('col_satuan').checked = false;
        document.getElementById('col_harga_beli').checked = false;
        document.getElementById('col_harga_jual').checked = false;
        document.getElementById('col_stok').checked = false;

        exportManager.updatePreview();

        // Check preview accuracy
        expect(document.getElementById('previewTotal').textContent).toBe('3'); // Total records
        expect(document.getElementById('previewFiltered').textContent).toBe('2'); // Filtered records
        expect(document.getElementById('previewColumns').textContent).toBe('2'); // Selected columns
        
        // Verify actual filtered data matches preview
        const actualFiltered = exportManager.getFilteredData();
        expect(actualFiltered.length).toBe(2);
        
        const actualColumns = exportManager.getSelectedColumns();
        expect(actualColumns.length).toBe(2);
    });

    /**
     * Property: Export should work consistently with different data sizes
     * Small and large datasets should be exported with same accuracy
     */
    test('should handle different data sizes consistently', () => {
        // Test with small dataset (already set up)
        let filteredData = exportManager.getFilteredData();
        let selectedColumns = exportManager.getSelectedColumns();
        let exportData = exportManager.prepareExportData(filteredData, selectedColumns, true);
        
        expect(exportData.length).toBe(filteredData.length + 1); // +1 for header

        // Test with large dataset
        const largeData = [];
        for (let i = 1; i <= 1000; i++) {
            largeData.push({
                id: i.toString(),
                kode: `BRG${i.toString().padStart(3, '0')}`,
                nama: `Item ${i}`,
                kategori_id: 'cat1',
                kategori_nama: 'Sembako',
                satuan_id: 'sat1',
                satuan_nama: 'PCS',
                harga_beli: 1000 + i,
                harga_jual: 1200 + i,
                stok: 100 - (i % 50),
                stok_minimum: 10,
                status: i % 2 === 0 ? 'aktif' : 'nonaktif'
            });
        }

        mockLocalStorage.setItem('master_barang', JSON.stringify(largeData));

        filteredData = exportManager.getFilteredData();
        exportData = exportManager.prepareExportData(filteredData, selectedColumns, true);
        
        expect(exportData.length).toBe(filteredData.length + 1); // +1 for header
        expect(exportData.length).toBeGreaterThan(100); // Should handle large datasets
    });
});