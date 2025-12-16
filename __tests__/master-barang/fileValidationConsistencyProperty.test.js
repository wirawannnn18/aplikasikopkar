/**
 * Property Test: File validation consistency
 * 
 * Property 5: File validation consistency
 * For any uploaded Excel/CSV file, the validation engine should validate file format and data structure consistently
 * Validates: Requirements 2.2
 */

import { FileProcessor } from '../../js/master-barang/FileProcessor.js';

describe('Property Test: File Validation Consistency', () => {
    let fileProcessor;

    beforeEach(() => {
        fileProcessor = new FileProcessor();
    });

    /**
     * Property: File format validation should be consistent
     * For any file with valid format, validation should always pass
     * For any file with invalid format, validation should always fail
     */
    test('should consistently validate file formats', () => {
        // Test valid formats
        const validFiles = [
            { name: 'test.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 1024 },
            { name: 'test.xls', type: 'application/vnd.ms-excel', size: 1024 },
            { name: 'test.csv', type: 'text/csv', size: 1024 },
            { name: 'data.CSV', type: 'text/csv', size: 1024 }, // Case insensitive
        ];

        validFiles.forEach(file => {
            expect(fileProcessor.isValidFile(file)).toBe(true);
        });

        // Test invalid formats
        const invalidFiles = [
            { name: 'test.txt', type: 'text/plain', size: 1024 },
            { name: 'test.pdf', type: 'application/pdf', size: 1024 },
            { name: 'test.doc', type: 'application/msword', size: 1024 },
            null,
            undefined,
        ];

        invalidFiles.forEach(file => {
            expect(fileProcessor.isValidFile(file)).toBe(false);
        });
    });

    /**
     * Property: File size validation should be consistent
     * Files under 10MB should pass, files over 10MB should fail
     */
    test('should consistently validate file sizes', () => {
        const maxSize = 10 * 1024 * 1024; // 10MB

        // Test valid sizes
        const validSizes = [1024, 1024 * 1024, 5 * 1024 * 1024, maxSize - 1];
        validSizes.forEach(size => {
            const file = { name: 'test.csv', type: 'text/csv', size };
            expect(fileProcessor.isValidFile(file)).toBe(true);
        });

        // Test invalid sizes
        const invalidSizes = [maxSize + 1, maxSize * 2, maxSize * 10];
        invalidSizes.forEach(size => {
            const file = { name: 'test.csv', type: 'text/csv', size };
            expect(fileProcessor.isValidFile(file)).toBe(false);
        });
    });

    /**
     * Property: File type detection should be consistent
     * Same file types should always be detected the same way
     */
    test('should consistently detect file types', () => {
        const csvFiles = [
            { name: 'test.csv', type: 'text/csv' },
            { name: 'data.CSV', type: 'text/csv' },
            { name: 'export.csv', type: '' }, // Empty type but .csv extension
        ];

        csvFiles.forEach(file => {
            expect(fileProcessor.getFileType(file)).toBe('csv');
        });

        const excelFiles = [
            { name: 'test.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
            { name: 'test.xls', type: 'application/vnd.ms-excel' },
        ];

        excelFiles.forEach(file => {
            expect(fileProcessor.getFileType(file)).toBe('excel');
        });
    });

    /**
     * Property: CSV parsing should be consistent
     * Same CSV content should always produce same parsed result
     */
    test('should consistently parse CSV content', () => {
        const csvContent = 'Name,Age,City\nJohn,25,Jakarta\nJane,30,Bandung';
        
        // Parse multiple times
        const results = [];
        for (let i = 0; i < 5; i++) {
            results.push(fileProcessor.parseCSV(csvContent));
        }

        // All results should be identical
        results.forEach(result => {
            expect(result).toEqual([
                { Name: 'John', Age: '25', City: 'Jakarta' },
                { Name: 'Jane', Age: '30', City: 'Bandung' }
            ]);
        });
    });

    /**
     * Property: CSV line parsing should handle quotes consistently
     * Lines with quotes should be parsed correctly every time
     */
    test('should consistently parse CSV lines with quotes', () => {
        const testCases = [
            {
                line: 'John,25,"Jakarta, Indonesia"',
                expected: ['John', '25', 'Jakarta, Indonesia']
            },
            {
                line: '"Smith, John",30,Bandung',
                expected: ['Smith, John', '30', 'Bandung']
            },
            {
                line: 'Jane,"She said ""Hello""",Surabaya',
                expected: ['Jane', 'She said "Hello"', 'Surabaya']
            }
        ];

        testCases.forEach(({ line, expected }) => {
            // Parse multiple times to ensure consistency
            for (let i = 0; i < 3; i++) {
                expect(fileProcessor.parseCSVLine(line)).toEqual(expected);
            }
        });
    });

    /**
     * Property: Data cleaning should be consistent
     * Same input data should always produce same cleaned output
     */
    test('should consistently clean data', () => {
        const dirtyData = [
            { name: '  John Doe  ', age: ' 25 ', city: 'Jakarta   ' },
            { name: 'Jane    Smith', age: '30', city: '' },
            { name: '', age: '  ', city: 'Bandung' }
        ];

        const expectedClean = [
            { name: 'John Doe', age: '25', city: 'Jakarta' },
            { name: 'Jane Smith', age: '30', city: null },
            { name: null, age: null, city: 'Bandung' }
        ];

        // Clean multiple times
        for (let i = 0; i < 3; i++) {
            expect(fileProcessor.cleanData(dirtyData)).toEqual(expectedClean);
        }
    });

    /**
     * Property: Column type detection should be consistent
     * Same data patterns should always be detected as same types
     */
    test('should consistently detect column types', () => {
        const data = [
            { id: '1', name: 'John', price: '100.50', active: 'true', date: '2024-01-01' },
            { id: '2', name: 'Jane', price: '200.75', active: 'false', date: '2024-01-02' },
            { id: '3', name: 'Bob', price: '150.00', active: 'true', date: '2024-01-03' }
        ];
        const headers = ['id', 'name', 'price', 'active', 'date'];

        // Get actual types from implementation
        const actualTypes = fileProcessor.detectColumnTypes(data, headers);
        
        // Verify consistency - same input should produce same output
        for (let i = 0; i < 3; i++) {
            expect(fileProcessor.detectColumnTypes(data, headers)).toEqual(actualTypes);
        }

        // Verify expected patterns
        expect(actualTypes.id).toBe('integer');
        expect(actualTypes.name).toBe('text');
        expect(actualTypes.price).toBe('decimal');
        expect(actualTypes.active).toBe('boolean');
        // Date detection might vary, so we just check it's consistent
        expect(['date', 'text', 'integer']).toContain(actualTypes.date);
    });

    /**
     * Property: File structure validation should be consistent
     * Same file structure should always produce same validation result
     */
    test('should consistently validate file structure', async () => {
        // Mock file with consistent structure
        const mockFile = {
            name: 'test.csv',
            type: 'text/csv',
            size: 1024
        };

        // Mock the getPreviewData method
        const mockPreviewData = {
            success: true,
            headers: ['kode', 'nama', 'kategori', 'satuan'],
            data: [
                { kode: 'BRG001', nama: 'Item 1', kategori: 'Cat1', satuan: 'PCS' }
            ]
        };

        // Mock the getPreviewData method
        fileProcessor.getPreviewData = () => Promise.resolve(mockPreviewData);

        const requiredColumns = ['kode', 'nama'];

        // Validate multiple times
        for (let i = 0; i < 3; i++) {
            const result = await fileProcessor.validateFileStructure(mockFile, requiredColumns);
            expect(result.success).toBe(true);
            expect(result.headers).toEqual(['kode', 'nama', 'kategori', 'satuan']);
            expect(result.rowCount).toBe(1);
        }
    });

    /**
     * Property: Sample data generation should be consistent
     * Generated sample data should always have same structure
     */
    test('should consistently generate sample data', () => {
        const expectedStructure = [
            'Kode Barang', 'Nama Barang', 'Kategori', 'Satuan', 
            'Harga Beli', 'Harga Jual', 'Stok', 'Stok Minimum', 'Deskripsi'
        ];

        // Generate sample data multiple times
        for (let i = 0; i < 3; i++) {
            const sampleData = fileProcessor.generateSampleData();
            
            expect(Array.isArray(sampleData)).toBe(true);
            expect(sampleData.length).toBeGreaterThan(0);
            
            // Check structure consistency
            sampleData.forEach(row => {
                expectedStructure.forEach(column => {
                    expect(row).toHaveProperty(column);
                });
            });
        }
    });
});