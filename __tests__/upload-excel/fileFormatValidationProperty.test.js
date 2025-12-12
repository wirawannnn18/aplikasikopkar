/**
 * Property Test: File Format Validation Consistency
 * 
 * **Feature: upload-master-barang-excel, Property 1: File Format Validation Consistency**
 * **Validates: Requirements 1.2**
 * 
 * This test verifies that for any uploaded file, the validation engine 
 * correctly identifies valid CSV/Excel formats and rejects invalid formats 
 * with appropriate error messages.
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
    }
    
    readAsText(file) {
        setTimeout(() => {
            if (this.onload) {
                const content = Array.isArray(file.bits) ? file.bits.join('') : file.bits;
                this.onload({ target: { result: content } });
            }
        }, 0);
    }
};

// Import the classes to test
import ValidationEngine from '../../js/upload-excel/ValidationEngine.js';
import ExcelUploadManager from '../../js/upload-excel/ExcelUploadManager.js';

describe('Property Test: File Format Validation Consistency', () => {
    let validator;
    let uploadManager;

    beforeEach(() => {
        validator = new ValidationEngine();
        uploadManager = new ExcelUploadManager();
        
        // Set up the validator in the upload manager
        uploadManager.setComponents({
            validator: validator,
            processor: null,
            categoryManager: null,
            auditLogger: null
        });
    });

    describe('Valid File Format Detection', () => {
        test('should accept valid CSV files', async () => {
            const validCSVFiles = [
                new File(['kode,nama,kategori\nBRG001,Test,makanan'], 'data.csv', { type: 'text/csv' }),
                new File(['kode,nama,kategori\nBRG002,Test2,minuman'], 'DATA.CSV', { type: 'text/csv' }),
                new File(['kode;nama;kategori\nBRG003;Test3;makanan'], 'my-data.csv', { type: 'text/csv' }),
                new File(['kode,nama,kategori\nBRG004,Test4,alat'], 'test_file.csv', { type: 'application/csv' })
            ];

            for (const file of validCSVFiles) {
                const result = await validator.validateFileFormat(file);
                if (!result.isValid) {
                    console.log('Failed validation for file:', file.name, 'Error:', result.error);
                }
                expect(result.isValid).toBe(true);
                expect(result.format).toBe('csv');
                expect(result.size).toBe(file.size);
            }
        });

        test('should accept valid Excel files', async () => {
            const validExcelFiles = [
                new File(['test'], 'data.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 1000 }),
                new File(['test'], 'DATA.XLSX', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 2000 }),
                new File(['test'], 'legacy.xls', { type: 'application/vnd.ms-excel', size: 1500 }),
                new File(['test'], 'LEGACY.XLS', { type: 'application/vnd.ms-excel', size: 1800 })
            ];

            for (const file of validExcelFiles) {
                const result = await validator.validateFileFormat(file);
                expect(result.isValid).toBe(true);
                expect(result.format).toBe('excel');
                expect(result.size).toBe(file.size);
            }
        });
    });

    describe('Invalid File Format Rejection', () => {
        test('should reject invalid file formats with specific error messages', async () => {
            const invalidFiles = [
                { file: new File(['test'], 'data.txt', { type: 'text/plain', size: 100 }), expectedCode: 'INVALID_FILE_FORMAT' },
                { file: new File(['test'], 'data.pdf', { type: 'application/pdf', size: 200 }), expectedCode: 'INVALID_FILE_FORMAT' },
                { file: new File(['test'], 'data.doc', { type: 'application/msword', size: 300 }), expectedCode: 'INVALID_FILE_FORMAT' },
                { file: new File(['test'], 'data.json', { type: 'application/json', size: 400 }), expectedCode: 'INVALID_FILE_FORMAT' },
                { file: new File(['test'], 'noextension', { type: 'application/octet-stream', size: 500 }), expectedCode: 'INVALID_FILE_FORMAT' }
            ];

            for (const { file, expectedCode } of invalidFiles) {
                const result = await validator.validateFileFormat(file);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Invalid file format');
                expect(result.format).toBe('unknown');
            }
        });

        test('should reject files exceeding size limit', async () => {
            const largeFiles = [
                new File(['x'.repeat(6 * 1024 * 1024)], 'large.csv', { type: 'text/csv', size: 6 * 1024 * 1024 }),
                new File(['x'.repeat(10 * 1024 * 1024)], 'huge.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 10 * 1024 * 1024 })
            ];

            for (const file of largeFiles) {
                const result = await validator.validateFileFormat(file);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('exceeds maximum allowed size');
                expect(result.error).toContain('5MB');
            }
        });

        test('should reject empty files', async () => {
            const emptyFiles = [
                new File([''], 'empty.csv', { type: 'text/csv', size: 0 }),
                new File([''], 'empty.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 0 })
            ];

            for (const file of emptyFiles) {
                const result = await validator.validateFileFormat(file);
                if (result.isValid) {
                    console.log('Unexpected success for empty file:', file.name, 'Result:', result);
                }
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('empty');
            }
        });
    });

    describe('File Size Validation', () => {
        test('should validate file size correctly', () => {
            const testCases = [
                { size: 0, expected: false },
                { size: 1024, expected: true }, // 1KB
                { size: 1024 * 1024, expected: true }, // 1MB
                { size: 5 * 1024 * 1024, expected: true }, // 5MB (exactly at limit)
                { size: 5 * 1024 * 1024 + 1, expected: false }, // Just over 5MB
                { size: 10 * 1024 * 1024, expected: false } // 10MB
            ];

            testCases.forEach(({ size, expected }) => {
                const file = new File(['x'.repeat(size)], 'test.csv', { size });
                const result = validator.validateFileSize(file);
                expect(result).toBe(expected);
            });
        });
    });

    describe('Enhanced File Validation with ExcelUploadManager', () => {
        test('should provide detailed error codes for different validation failures', async () => {
            const testCases = [
                {
                    file: new File(['x'.repeat(6 * 1024 * 1024)], 'large.csv', { size: 6 * 1024 * 1024 }),
                    expectedCode: 'FILE_TOO_LARGE'
                },
                {
                    file: new File([], 'empty.csv', { size: 0 }),
                    expectedCode: 'FILE_EMPTY'
                },
                {
                    file: new File(['test'], 'invalid.txt', { size: 100 }),
                    expectedCode: 'INVALID_FILE_FORMAT'
                }
            ];

            for (const { file, expectedCode } of testCases) {
                const result = await uploadManager.validateFileWithFeedback(file);
                expect(result.isValid).toBe(false);
                expect(result.code).toBe(expectedCode);
                expect(result.error).toBeDefined();
            }
        });
    });

    describe('Drag & Drop File Validation', () => {
        test('should validate dropped files correctly', () => {
            const validFiles = [
                new File(['kode,nama,kategori\nBRG001,Test,makanan'], 'data.csv', { type: 'text/csv' })
            ];

            const result = uploadManager.validateDroppedFiles(validFiles);
            expect(result.validFiles).toHaveLength(1);
            expect(result.errors).toHaveLength(0);
        });

        test('should reject multiple files', () => {
            const multipleFiles = [
                new File(['test1'], 'data1.csv', { size: 100 }),
                new File(['test2'], 'data2.csv', { size: 200 })
            ];

            const result = uploadManager.validateDroppedFiles(multipleFiles);
            expect(result.validFiles).toHaveLength(0);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].code).toBe('MULTIPLE_FILES');
        });

        test('should reject invalid file types in drag & drop', () => {
            const invalidFiles = [
                new File(['test'], 'data.txt', { size: 100 })
            ];

            const result = uploadManager.validateDroppedFiles(invalidFiles);
            expect(result.validFiles).toHaveLength(0);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].code).toBe('INVALID_FORMAT');
        });

        test('should handle no files provided', () => {
            const result = uploadManager.validateDroppedFiles([]);
            expect(result.validFiles).toHaveLength(0);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].code).toBe('NO_FILES');
        });
    });

    describe('Property: File Format Validation Consistency', () => {
        test('Property 1: For any uploaded file, validation should be consistent and provide appropriate feedback', async () => {
            // Generate test cases covering various scenarios
            const testFiles = [
                // Valid cases
                { file: new File(['kode,nama,kategori\nBRG001,Test,makanan'], 'valid.csv', { type: 'text/csv' }), shouldBeValid: true },
                { file: new File(['kode,nama,kategori\nBRG002,Test2,minuman'], 'valid.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), shouldBeValid: true },
                { file: new File(['kode,nama,kategori\nBRG003,Test3,makanan'], 'VALID.CSV', { type: 'text/csv' }), shouldBeValid: true },
                
                // Invalid format cases
                { file: new File(['test content'], 'invalid.txt', { type: 'text/plain' }), shouldBeValid: false },
                { file: new File(['test content'], 'invalid.pdf', { type: 'application/pdf' }), shouldBeValid: false },
                
                // Size limit cases
                { file: new File(['x'.repeat(6000000)], 'toolarge.csv', { type: 'text/csv', size: 6000000 }), shouldBeValid: false },
                { file: new File([''], 'empty.csv', { type: 'text/csv', size: 0 }), shouldBeValid: false },
                
                // Edge cases
                { file: new File(['kode,nama,kategori\n' + 'x'.repeat(5 * 1024 * 1024 - 20)], 'exactly5mb.csv', { type: 'text/csv', size: 5 * 1024 * 1024 }), shouldBeValid: true },
                { file: new File(['x'.repeat(5 * 1024 * 1024 + 1)], 'just-over-5mb.csv', { type: 'text/csv', size: 5 * 1024 * 1024 + 1 }), shouldBeValid: false }
            ];

            for (const { file, shouldBeValid } of testFiles) {
                const result = await validator.validateFileFormat(file);
                
                // Property: Validation result should be consistent with expectations
                expect(result.isValid).toBe(shouldBeValid);
                
                // Property: All results should have required fields
                expect(result).toHaveProperty('isValid');
                expect(result).toHaveProperty('format');
                expect(result).toHaveProperty('size');
                
                // Property: Invalid files should have error messages
                if (!shouldBeValid) {
                    expect(result.error).toBeDefined();
                    expect(typeof result.error).toBe('string');
                    expect(result.error.length).toBeGreaterThan(0);
                }
                
                // Property: Valid files should have correct format detection
                if (shouldBeValid) {
                    if (file.name.toLowerCase().endsWith('.csv')) {
                        expect(result.format).toBe('csv');
                    } else if (file.name.toLowerCase().match(/\.(xlsx|xls)$/)) {
                        expect(result.format).toBe('excel');
                    }
                }
                
                // Property: Size should always match file size
                expect(result.size).toBe(file.size);
            }
        });
    });
});