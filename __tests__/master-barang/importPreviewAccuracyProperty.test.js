/**
 * Property Test: Import preview accuracy
 * 
 * Property 6: Import preview accuracy
 * For any valid uploaded file, the import engine should display accurate preview data with column mapping options
 * Validates: Requirements 2.3
 */

import { ImportManager } from '../../js/master-barang/ImportManager.js';
import { FileProcessor } from '../../js/master-barang/FileProcessor.js';

// Mock DOM elements
const mockDOM = () => {
    document.body.innerHTML = `
        <div id="previewHeader"></div>
        <div id="previewBody"></div>
        <div id="columnMapping"></div>
        <select id="sheetSelect"></select>
        <input id="headerRow" value="1">
    `;
};

describe('Property Test: Import Preview Accuracy', () => {
    let importManager;
    let fileProcessor;

    beforeEach(() => {
        mockDOM();
        importManager = new ImportManager();
        fileProcessor = new FileProcessor();
    });

    /**
     * Property: Preview data should accurately reflect file content
     * For any valid file data, preview should show exact same data
     */
    test('should accurately display preview data from file content', () => {
        const testData = [
            { kode: 'BRG001', nama: 'Item 1', kategori: 'Cat1', satuan: 'PCS' },
            { kode: 'BRG002', nama: 'Item 2', kategori: 'Cat2', satuan: 'KG' },
            { kode: 'BRG003', nama: 'Item 3', kategori: 'Cat1', satuan: 'LITER' }
        ];
        const headers = ['kode', 'nama', 'kategori', 'satuan'];

        importManager.displayPreview(testData, headers);

        // Check header accuracy
        const previewHeader = document.getElementById('previewHeader');
        const headerCells = previewHeader.querySelectorAll('th');
        expect(headerCells.length).toBe(headers.length);
        
        headers.forEach((header, index) => {
            expect(headerCells[index].textContent).toBe(header);
        });

        // Check data accuracy (first 10 rows or all if less)
        const previewBody = document.getElementById('previewBody');
        const dataRows = previewBody.querySelectorAll('tr');
        const displayedRows = Math.min(testData.length, 10);
        
        // Should show data rows plus potential info row
        expect(dataRows.length).toBeGreaterThanOrEqual(displayedRows);

        // Check first few data rows
        for (let i = 0; i < Math.min(displayedRows, 3); i++) {
            const row = dataRows[i];
            const cells = row.querySelectorAll('td');
            
            headers.forEach((header, colIndex) => {
                expect(cells[colIndex].textContent).toBe(testData[i][header] || '');
            });
        }
    });

    /**
     * Property: Column mapping should include all required fields
     * For any preview data, column mapping should provide options for all required fields
     */
    test('should create accurate column mapping options', () => {
        const headers = ['product_code', 'product_name', 'category', 'unit', 'buy_price'];
        
        importManager.createColumnMapping(headers);

        const mappingContainer = document.getElementById('columnMapping');
        const selects = mappingContainer.querySelectorAll('select');

        // Should have selects for all required fields
        const requiredFields = ['kode', 'nama', 'kategori', 'satuan', 'harga_beli', 'harga_jual', 'stok', 'stok_minimum', 'deskripsi'];
        expect(selects.length).toBe(requiredFields.length);

        // Each select should have options for all headers
        selects.forEach(select => {
            const options = select.querySelectorAll('option');
            // Empty option + header options
            expect(options.length).toBe(headers.length + 1);
            
            // Check header options
            headers.forEach((header, index) => {
                expect(options[index + 1].value).toBe(header);
                expect(options[index + 1].textContent).toBe(header);
            });
        });
    });

    /**
     * Property: Auto-mapping should work consistently
     * Similar column names should be auto-mapped consistently
     */
    test('should consistently auto-map similar column names', () => {
        const testCases = [
            {
                headers: ['kode_barang', 'nama_barang', 'kategori', 'satuan'],
                expectedMappings: {
                    'mapping_kode': 'kode_barang',
                    'mapping_nama': 'nama_barang',
                    'mapping_kategori': 'kategori',
                    'mapping_satuan': 'satuan'
                }
            }
        ];

        testCases.forEach(({ headers, expectedMappings }) => {
            // Clear previous mapping
            document.getElementById('columnMapping').innerHTML = '';
            
            importManager.createColumnMapping(headers);

            // Check that auto-mapping logic works for exact matches
            Object.keys(expectedMappings).forEach(selectId => {
                const select = document.getElementById(selectId);
                // Auto-mapping should work for headers that contain the field key
                if (select) {
                    const fieldKey = selectId.replace('mapping_', '');
                    const expectedHeader = expectedMappings[selectId];
                    
                    // Check if the header contains the field key (case insensitive)
                    if (expectedHeader.toLowerCase().includes(fieldKey.toLowerCase()) ||
                        fieldKey.toLowerCase().includes(expectedHeader.toLowerCase())) {
                        expect(select.value).toBe(expectedHeader);
                    }
                }
            });
        });
    });

    /**
     * Property: Preview should handle large datasets consistently
     * Large datasets should be truncated to 10 rows with info message
     */
    test('should consistently handle large datasets in preview', () => {
        // Generate large dataset
        const largeData = [];
        for (let i = 1; i <= 50; i++) {
            largeData.push({
                kode: `BRG${i.toString().padStart(3, '0')}`,
                nama: `Item ${i}`,
                kategori: `Category ${i % 5 + 1}`,
                satuan: 'PCS'
            });
        }
        const headers = ['kode', 'nama', 'kategori', 'satuan'];

        importManager.displayPreview(largeData, headers);

        const previewBody = document.getElementById('previewBody');
        const dataRows = previewBody.querySelectorAll('tr');

        // Should show 10 data rows + 1 info row
        expect(dataRows.length).toBe(11);

        // Check first 10 rows are data rows
        for (let i = 0; i < 10; i++) {
            const row = dataRows[i];
            const cells = row.querySelectorAll('td');
            expect(cells.length).toBe(headers.length);
            expect(cells[0].textContent).toBe(`BRG${(i + 1).toString().padStart(3, '0')}`);
        }

        // Check info row
        const infoRow = dataRows[10];
        const infoCell = infoRow.querySelector('td');
        expect(infoCell.colSpan).toBe(headers.length);
        expect(infoCell.textContent).toContain('40 more rows');
    });

    /**
     * Property: Preview should handle empty data gracefully
     * Empty datasets should display empty table without errors
     */
    test('should handle empty data gracefully in preview', () => {
        const emptyData = [];
        const headers = ['kode', 'nama', 'kategori', 'satuan'];

        expect(() => {
            importManager.displayPreview(emptyData, headers);
        }).not.toThrow();

        const previewHeader = document.getElementById('previewHeader');
        const previewBody = document.getElementById('previewBody');

        // Header should still be displayed
        const headerCells = previewHeader.querySelectorAll('th');
        expect(headerCells.length).toBe(headers.length);

        // Body should be empty
        const dataRows = previewBody.querySelectorAll('tr');
        expect(dataRows.length).toBe(0);
    });

    /**
     * Property: Preview should handle missing data fields consistently
     * Missing fields should be displayed as empty cells
     */
    test('should consistently handle missing data fields', () => {
        const incompleteData = [
            { kode: 'BRG001', nama: 'Item 1' }, // Missing kategori, satuan
            { kode: 'BRG002', kategori: 'Cat1' }, // Missing nama, satuan
            { nama: 'Item 3', satuan: 'PCS' } // Missing kode, kategori
        ];
        const headers = ['kode', 'nama', 'kategori', 'satuan'];

        importManager.displayPreview(incompleteData, headers);

        const previewBody = document.getElementById('previewBody');
        const dataRows = previewBody.querySelectorAll('tr');

        expect(dataRows.length).toBe(3);

        // Check first row
        const row1Cells = dataRows[0].querySelectorAll('td');
        expect(row1Cells[0].textContent).toBe('BRG001'); // kode
        expect(row1Cells[1].textContent).toBe('Item 1'); // nama
        expect(row1Cells[2].textContent).toBe(''); // kategori (missing)
        expect(row1Cells[3].textContent).toBe(''); // satuan (missing)

        // Check second row
        const row2Cells = dataRows[1].querySelectorAll('td');
        expect(row2Cells[0].textContent).toBe('BRG002'); // kode
        expect(row2Cells[1].textContent).toBe(''); // nama (missing)
        expect(row2Cells[2].textContent).toBe('Cat1'); // kategori
        expect(row2Cells[3].textContent).toBe(''); // satuan (missing)

        // Check third row
        const row3Cells = dataRows[2].querySelectorAll('td');
        expect(row3Cells[0].textContent).toBe(''); // kode (missing)
        expect(row3Cells[1].textContent).toBe('Item 3'); // nama
        expect(row3Cells[2].textContent).toBe(''); // kategori (missing)
        expect(row3Cells[3].textContent).toBe('PCS'); // satuan
    });

    /**
     * Property: Column mapping validation should be accurate
     * Required field mappings should be validated correctly
     */
    test('should accurately validate column mapping', () => {
        const headers = ['product_code', 'product_name', 'category', 'unit'];
        importManager.createColumnMapping(headers);

        // Test valid mapping
        document.getElementById('mapping_kode').value = 'product_code';
        document.getElementById('mapping_nama').value = 'product_name';
        document.getElementById('mapping_kategori').value = 'category';
        document.getElementById('mapping_satuan').value = 'unit';

        expect(importManager.validateColumnMapping()).toBe(true);
        expect(importManager.columnMapping).toEqual({
            kode: 'product_code',
            nama: 'product_name',
            kategori: 'category',
            satuan: 'unit'
        });

        // Test invalid mapping (missing required field)
        document.getElementById('mapping_kode').value = '';
        expect(importManager.validateColumnMapping()).toBe(false);
    });

    /**
     * Property: Preview update should be consistent
     * Same file and settings should always produce same preview
     */
    test('should consistently update preview for same file and settings', async () => {
        const mockFile = { name: 'test.csv', type: 'text/csv' };
        const mockPreviewData = {
            success: true,
            data: [
                { kode: 'BRG001', nama: 'Item 1', kategori: 'Cat1', satuan: 'PCS' }
            ],
            headers: ['kode', 'nama', 'kategori', 'satuan']
        };

        // Mock fileProcessor.getPreviewData
        importManager.fileProcessor.getPreviewData = () => Promise.resolve(mockPreviewData);

        importManager.currentFile = mockFile;

        // Update preview multiple times
        for (let i = 0; i < 3; i++) {
            await importManager.updatePreview();

            // Check consistency
            const previewHeader = document.getElementById('previewHeader');
            const headerCells = previewHeader.querySelectorAll('th');
            expect(headerCells.length).toBe(4);

            const previewBody = document.getElementById('previewBody');
            const dataRows = previewBody.querySelectorAll('tr');
            expect(dataRows.length).toBe(1);
        }
    });
});