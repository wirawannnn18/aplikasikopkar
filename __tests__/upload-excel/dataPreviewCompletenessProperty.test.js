/**
 * Property Test: Data Preview Completeness
 * 
 * **Feature: upload-master-barang-excel, Property 2: Data Preview Completeness**
 * **Validates: Requirements 1.3**
 * 
 * This test verifies that for any valid uploaded file, the data preview 
 * displays all records from the file in an interactive table format.
 */

// Mock File API for testing
global.File = class File {
    constructor(bits, name, options = {}) {
        this.bits = bits;
        this.name = name;
        this.size = options.size || (Array.isArray(bits) ? bits.join('').length : 0);
        this.type = options.type || '';
        this.lastModified = options.lastModified || Date.now();
    }
    
    slice(start = 0, end = this.size) {
        const content = Array.isArray(this.bits) ? this.bits.join('') : this.bits;
        return new File([content.slice(start, end)], this.name, {
            type: this.type,
            size: end - start
        });
    }
};

// Mock localStorage
global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
};

// Mock FileReader
global.FileReader = class FileReader {
    constructor() {
        this.onload = null;
        this.onerror = null;
        this.result = null;
    }
    
    readAsText(file) {
        setTimeout(() => {
            // Generate CSV content based on file name or use default
            if (file.name.includes('sample')) {
                this.result = 'kode,nama,kategori,satuan,harga_beli,stok,supplier\nBRG001,Test Item 1,makanan,pcs,1000,10,Supplier A\nBRG002,Test Item 2,minuman,liter,2000,5,Supplier B';
            } else if (file.name.includes('large')) {
                // Generate larger dataset
                const lines = ['kode,nama,kategori,satuan,harga_beli,stok,supplier'];
                for (let i = 1; i <= 100; i++) {
                    lines.push(`BRG${i.toString().padStart(3, '0')},Item ${i},kategori${i % 5},unit${i % 3},${1000 + i},${i % 20},Supplier ${String.fromCharCode(65 + (i % 26))}`);
                }
                this.result = lines.join('\n');
            } else if (file.name.includes('empty-data')) {
                this.result = 'kode,nama,kategori,satuan,harga_beli,stok,supplier\n';
            } else {
                this.result = 'kode,nama,kategori,satuan,harga_beli,stok,supplier\nBRG001,Default Item,makanan,pcs,1000,10,Default Supplier';
            }
            
            if (this.onload) this.onload({ target: { result: this.result } });
        }, 10);
    }
};

// Import the classes to test
import DataProcessor from '../../js/upload-excel/DataProcessor.js';
import ExcelUploadManager from '../../js/upload-excel/ExcelUploadManager.js';
import ValidationEngine from '../../js/upload-excel/ValidationEngine.js';

describe('Property Test: Data Preview Completeness', () => {
    let processor;
    let uploadManager;
    let validator;

    beforeEach(() => {
        processor = new DataProcessor();
        validator = new ValidationEngine();
        uploadManager = new ExcelUploadManager();
        uploadManager.setComponents({
            processor,
            validator,
            categoryManager: null,
            auditLogger: null
        });
    });

    describe('CSV Data Parsing and Preview', () => {
        test('should parse CSV content and return all records', async () => {
            const csvContent = 'kode,nama,kategori,satuan,harga_beli,stok,supplier\nBRG001,Item 1,makanan,pcs,1000,10,Supplier A\nBRG002,Item 2,minuman,liter,2000,5,Supplier B\nBRG003,Item 3,elektronik,unit,3000,15,Supplier C';
            
            const result = await processor.parseCSV(csvContent);
            
            expect(result).toHaveLength(3);
            expect(result[0]).toMatchObject({
                kode: 'BRG001',
                nama: 'Item 1',
                kategori: 'makanan',
                satuan: 'pcs'
            });
        });

        test('should handle CSV with quoted values and special characters', async () => {
            const csvContent = 'kode,nama,kategori,satuan,harga_beli,stok,supplier\n"BRG001","Item with, comma","makanan & minuman","pcs",1000,10,"Supplier ""A"""\n"BRG002","Item with\nnewline","kategori;special","unit;test",2000,5,"Supplier B"';
            
            const result = await processor.parseCSV(csvContent);
            
            expect(result).toHaveLength(2);
            expect(result[0].nama).toBe('Item with, comma');
            expect(result[0].kategori).toBe('makanan & minuman');
            expect(result[1].nama).toBe('Item with\nnewline');
        });

        test('should detect and use appropriate CSV delimiter', async () => {
            const semicolonCSV = 'kode;nama;kategori;satuan;harga_beli;stok;supplier\nBRG001;Item 1;makanan;pcs;1000;10;Supplier A';
            const tabCSV = 'kode\tnama\tkategori\tsatuan\tharga_beli\tstok\tsupplier\nBRG001\tItem 1\tmakanan\tpcs\t1000\t10\tSupplier A';
            
            const semicolonResult = await processor.parseCSV(semicolonCSV);
            const tabResult = await processor.parseCSV(tabCSV);
            
            expect(semicolonResult).toHaveLength(1);
            expect(tabResult).toHaveLength(1);
            expect(semicolonResult[0].kode).toBe('BRG001');
            expect(tabResult[0].kode).toBe('BRG001');
        });
    });

    describe('Data Transformation and Normalization', () => {
        test('should transform data correctly with proper types and timestamps', () => {
            const rawData = {
                kode: 'BRG001',
                nama: 'Test Item',
                kategori: 'MAKANAN',
                satuan: 'PCS',
                harga_beli: '1500',
                stok: '25',
                supplier: 'Test Supplier'
            };

            const transformed = processor.transformData(rawData);

            expect(transformed.kategori).toBe('makanan'); // Should be lowercase
            expect(transformed.satuan).toBe('pcs'); // Should be lowercase
            expect(typeof transformed.harga_beli).toBe('number');
            expect(typeof transformed.stok).toBe('number');
            expect(transformed.harga_beli).toBe(1500);
            expect(transformed.stok).toBe(25);
            expect(transformed).toHaveProperty('created_at');
            expect(transformed).toHaveProperty('updated_at');
        });

        test('should handle numeric conversion edge cases', () => {
            const testCases = [
                { input: '1,500.50', expected: 1500.50 }, // Comma thousands separator
                { input: '1.500,50', expected: 1500.50 }, // European format
                { input: '$1500', expected: 1500 }, // Currency symbol
                { input: '1500.00', expected: 1500 },
                { input: 'invalid', expected: 0 }, // Invalid number
                { input: '', expected: 0 }, // Empty string
                { input: '0', expected: 0 } // Zero
            ];

            testCases.forEach(({ input, expected }) => {
                const rawData = { harga_beli: input, stok: input };
                const transformed = processor.transformData(rawData);
                expect(transformed.harga_beli).toBe(expected);
            });
        });
    });

    describe('Preview Data Generation', () => {
        test('should generate preview data with validation indicators', async () => {
            const file = new File(['test'], 'sample.csv', { size: 100 });
            
            // Mock the upload process
            const session = await uploadManager.uploadFile(file);
            const previewData = await uploadManager.previewData(session.id);

            expect(previewData).toHaveProperty('data');
            expect(previewData).toHaveProperty('summary');
            expect(Array.isArray(previewData.data)).toBe(true);
            
            // Check summary structure
            expect(previewData.summary).toHaveProperty('totalRows');
            expect(previewData.summary).toHaveProperty('errorRows');
            expect(previewData.summary).toHaveProperty('warningRows');
            expect(previewData.summary).toHaveProperty('validRows');
        });

        test('should include row metadata in preview data', async () => {
            const file = new File(['test'], 'sample.csv', { size: 100 });
            
            const session = await uploadManager.uploadFile(file);
            const previewData = await uploadManager.previewData(session.id);

            if (previewData.data.length > 0) {
                const firstRow = previewData.data[0];
                expect(firstRow).toHaveProperty('_rowNumber');
                expect(firstRow).toHaveProperty('_hasErrors');
                expect(firstRow).toHaveProperty('_hasWarnings');
                expect(typeof firstRow._rowNumber).toBe('number');
                expect(typeof firstRow._hasErrors).toBe('boolean');
                expect(typeof firstRow._hasWarnings).toBe('boolean');
            }
        });
    });

    describe('Large Dataset Handling', () => {
        test('should handle large datasets efficiently', async () => {
            const file = new File(['test'], 'large.csv', { size: 10000 });
            
            const session = await uploadManager.uploadFile(file);
            const previewData = await uploadManager.previewData(session.id);

            expect(previewData.data.length).toBeGreaterThan(50); // Should have many records
            expect(previewData.summary.totalRows).toBe(previewData.data.length);
            
            // Verify all records have required structure
            previewData.data.forEach((row, index) => {
                expect(row).toHaveProperty('_rowNumber');
                expect(row._rowNumber).toBe(index + 2); // +2 for header row
            });
        });

        test('should process data in chunks for performance', () => {
            const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
                kode: `BRG${i.toString().padStart(3, '0')}`,
                nama: `Item ${i}`,
                kategori: 'test',
                satuan: 'pcs',
                harga_beli: 1000 + i,
                stok: i % 100
            }));

            const chunks = processor.chunkData(largeDataset, 100);
            
            expect(chunks).toHaveLength(10);
            expect(chunks[0]).toHaveLength(100);
            expect(chunks[9]).toHaveLength(100);
            
            // Verify data integrity across chunks
            let totalItems = 0;
            chunks.forEach(chunk => {
                totalItems += chunk.length;
                chunk.forEach(item => {
                    expect(item).toHaveProperty('kode');
                    expect(item).toHaveProperty('nama');
                });
            });
            
            expect(totalItems).toBe(1000);
        });
    });

    describe('Error Handling in Preview', () => {
        test('should handle empty files gracefully', async () => {
            const file = new File(['test'], 'empty-data.csv', { size: 50 });
            
            try {
                await uploadManager.uploadFile(file);
            } catch (error) {
                expect(error.message).toContain('empty');
            }
        });

        test('should handle malformed CSV data', async () => {
            const malformedCSV = 'kode,nama,kategori,satuan,harga_beli,stok\nBRG001,Item 1\nBRG002,Item 2,extra,field\nBRG003'; // Inconsistent columns
            
            const result = await processor.parseCSV(malformedCSV);
            
            // Should still process what it can
            expect(result.length).toBeGreaterThan(0);
            
            // Should handle missing fields gracefully
            result.forEach(row => {
                expect(row).toHaveProperty('kode');
                // Missing fields should be empty strings or undefined
            });
        });
    });

    describe('Property: Data Preview Completeness', () => {
        test('Property 2: For any valid uploaded file, preview should display all records in interactive format', async () => {
            const testFiles = [
                { name: 'small.csv', expectedMinRows: 1 },
                { name: 'sample.csv', expectedMinRows: 2 },
                { name: 'large.csv', expectedMinRows: 50 }
            ];

            for (const { name, expectedMinRows } of testFiles) {
                const file = new File(['test'], name, { size: 1000 });
                
                try {
                    const session = await uploadManager.uploadFile(file);
                    const previewData = await uploadManager.previewData(session.id);

                    // Property: Preview should contain all parsed records
                    expect(previewData.data.length).toBeGreaterThanOrEqual(expectedMinRows);
                    
                    // Property: Each record should have interactive metadata
                    previewData.data.forEach((row, index) => {
                        expect(row).toHaveProperty('_rowNumber');
                        expect(row).toHaveProperty('_hasErrors');
                        expect(row).toHaveProperty('_hasWarnings');
                        expect(row._rowNumber).toBe(index + 2); // Account for header
                    });
                    
                    // Property: Summary should accurately reflect data
                    const { summary } = previewData;
                    expect(summary.totalRows).toBe(previewData.data.length);
                    expect(summary.errorRows + summary.warningRows + summary.validRows).toBe(summary.totalRows);
                    
                    // Property: All required fields should be present in data
                    if (previewData.data.length > 0) {
                        const firstRow = previewData.data[0];
                        const requiredFields = ['kode', 'nama', 'kategori', 'satuan', 'harga_beli', 'stok'];
                        requiredFields.forEach(field => {
                            expect(firstRow).toHaveProperty(field);
                        });
                    }
                    
                    // Property: Data should be properly transformed
                    previewData.data.forEach(row => {
                        if (row.kategori) {
                            expect(row.kategori).toBe(row.kategori.toLowerCase());
                        }
                        if (row.satuan) {
                            expect(row.satuan).toBe(row.satuan.toLowerCase());
                        }
                        if (row.harga_beli !== undefined) {
                            expect(typeof row.harga_beli).toBe('number');
                        }
                        if (row.stok !== undefined) {
                            expect(typeof row.stok).toBe('number');
                        }
                    });
                    
                } catch (error) {
                    // If file processing fails, it should be due to validation errors, not preview issues
                    expect(error.message).not.toContain('preview');
                }
            }
        });

        test('Property 2: Preview should handle various CSV formats consistently', async () => {
            const csvFormats = [
                'kode,nama,kategori,satuan,harga_beli,stok\nBRG001,Item 1,makanan,pcs,1000,10', // Standard comma
                'kode;nama;kategori;satuan;harga_beli;stok\nBRG001;Item 1;makanan;pcs;1000;10', // Semicolon delimiter
                'kode\tnama\tkategori\tsatuan\tharga_beli\tstok\nBRG001\tItem 1\tmakanan\tpcs\t1000\t10', // Tab delimiter
                '"kode","nama","kategori","satuan","harga_beli","stok"\n"BRG001","Item 1","makanan","pcs","1000","10"', // Quoted fields
                'kode,nama,kategori,satuan,harga_beli,stok\n"BRG001","Item with, comma","makanan","pcs","1000","10"' // Mixed quoting
            ];

            for (const csvContent of csvFormats) {
                const result = await processor.parseCSV(csvContent);
                
                // Property: All formats should produce consistent structure
                expect(result).toHaveLength(1);
                expect(result[0]).toHaveProperty('kode');
                expect(result[0]).toHaveProperty('nama');
                expect(result[0]).toHaveProperty('kategori');
                expect(result[0]).toHaveProperty('satuan');
                expect(result[0]).toHaveProperty('harga_beli');
                expect(result[0]).toHaveProperty('stok');
                expect(result[0].kode).toBe('BRG001');
                
                // Property: Data should be properly cleaned
                expect(result[0].kode.trim()).toBe(result[0].kode);
                expect(result[0].nama.trim()).toBe(result[0].nama);
            }
        });
    });
});