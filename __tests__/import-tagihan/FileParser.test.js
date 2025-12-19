/**
 * File Parser Tests
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import fc from 'fast-check';

// Import the class to test
let FileParser;

beforeAll(async () => {
    // Dynamic import to handle ES modules
    const module = await import('../../js/import-tagihan/FileParser.js');
    FileParser = module.FileParser;
});

describe('FileParser', () => {
    let parser;

    beforeEach(() => {
        parser = new FileParser();
    });

    describe('Constructor', () => {
        test('should initialize with default configuration', () => {
            expect(parser.maxFileSize).toBe(5 * 1024 * 1024); // 5MB
            expect(parser.supportedFormats).toEqual(['csv', 'xlsx', 'xls']);
            expect(parser.requiredColumns).toEqual([
                'nomor_anggota',
                'nama_anggota', 
                'jenis_pembayaran',
                'jumlah_pembayaran',
                'keterangan'
            ]);
        });
    });

    describe('validateFileFormat', () => {
        test('should accept supported file formats', () => {
            const csvFile = new File(['test'], 'test.csv', { type: 'text/csv' });
            const xlsxFile = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const xlsFile = new File(['test'], 'test.xls', { type: 'application/vnd.ms-excel' });

            expect(parser.validateFileFormat(csvFile)).toEqual({ valid: true });
            expect(parser.validateFileFormat(xlsxFile)).toEqual({ valid: true });
            expect(parser.validateFileFormat(xlsFile)).toEqual({ valid: true });
        });

        test('should reject unsupported file formats', () => {
            const txtFile = new File(['test'], 'test.txt', { type: 'text/plain' });
            const pdfFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });

            const txtResult = parser.validateFileFormat(txtFile);
            const pdfResult = parser.validateFileFormat(pdfFile);

            expect(txtResult.valid).toBe(false);
            expect(txtResult.error).toContain('Format file tidak didukung');
            expect(pdfResult.valid).toBe(false);
            expect(pdfResult.error).toContain('Format file tidak didukung');
        });

        // Property-based test for file format validation
        test('should handle various file extensions correctly', () => {
            fc.assert(
                fc.property(
                    fc.oneof(
                        fc.constant('csv'),
                        fc.constant('xlsx'),
                        fc.constant('xls'),
                        fc.string({ minLength: 1, maxLength: 10 }).filter(s => !['csv', 'xlsx', 'xls'].includes(s))
                    ),
                    (extension) => {
                        const fileName = `test.${extension}`;
                        const file = new File(['test'], fileName, { type: 'text/plain' });
                        const result = parser.validateFileFormat(file);
                        
                        if (['csv', 'xlsx', 'xls'].includes(extension)) {
                            return result.valid === true;
                        } else {
                            return result.valid === false && result.error.includes('Format file tidak didukung');
                        }
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    describe('validateFileSize', () => {
        test('should accept files within size limit', () => {
            const smallFile = new File(['small content'], 'test.csv', { type: 'text/csv' });
            const result = parser.validateFileSize(smallFile);
            expect(result).toEqual({ valid: true });
        });

        test('should reject empty files', () => {
            const emptyFile = new File([], 'empty.csv', { type: 'text/csv' });
            const result = parser.validateFileSize(emptyFile);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('File kosong');
        });

        test('should reject files exceeding size limit', () => {
            // Create a mock file that appears to be over the limit
            const largeFile = {
                name: 'large.csv',
                size: 6 * 1024 * 1024, // 6MB
                type: 'text/csv'
            };
            
            const result = parser.validateFileSize(largeFile);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Ukuran file terlalu besar');
        });

        // Property-based test for file size validation
        test('should validate file sizes correctly', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 10 * 1024 * 1024 }), // 0 to 10MB
                    (size) => {
                        const mockFile = {
                            name: 'test.csv',
                            size: size,
                            type: 'text/csv'
                        };
                        
                        const result = parser.validateFileSize(mockFile);
                        
                        if (size === 0) {
                            return result.valid === false && result.error.includes('File kosong');
                        } else if (size > 5 * 1024 * 1024) {
                            return result.valid === false && result.error.includes('Ukuran file terlalu besar');
                        } else {
                            return result.valid === true;
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('validateColumnStructure', () => {
        test('should accept headers with all required columns', () => {
            const validHeaders = [
                'nomor_anggota',
                'nama_anggota', 
                'jenis_pembayaran',
                'jumlah_pembayaran',
                'keterangan'
            ];
            
            const result = parser.validateColumnStructure(validHeaders);
            expect(result).toEqual({ valid: true });
        });

        test('should accept headers with extra columns', () => {
            const headersWithExtra = [
                'nomor_anggota',
                'nama_anggota', 
                'jenis_pembayaran',
                'jumlah_pembayaran',
                'keterangan',
                'extra_column'
            ];
            
            const result = parser.validateColumnStructure(headersWithExtra);
            expect(result).toEqual({ valid: true });
        });

        test('should reject headers missing required columns', () => {
            const incompleteHeaders = [
                'nomor_anggota',
                'nama_anggota'
            ];
            
            const result = parser.validateColumnStructure(incompleteHeaders);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Kolom yang diperlukan tidak ditemukan');
        });

        // Property-based test for column structure validation
        test('should validate column structures correctly', () => {
            const requiredColumns = parser.requiredColumns;
            
            fc.assert(
                fc.property(
                    fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 10 }),
                    fc.shuffledSubarray(requiredColumns, { minLength: 0, maxLength: requiredColumns.length }),
                    (extraColumns, includedRequired) => {
                        const headers = [...extraColumns, ...includedRequired];
                        const result = parser.validateColumnStructure(headers);
                        
                        const hasAllRequired = requiredColumns.every(col => headers.includes(col));
                        
                        if (hasAllRequired) {
                            return result.valid === true;
                        } else {
                            return result.valid === false && result.error.includes('Kolom yang diperlukan tidak ditemukan');
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Property 2: File upload validation completeness', () => {
        /**
         * **Feature: import-tagihan-pembayaran, Property 2: File upload validation completeness**
         * For any uploaded file, the system should validate file format (CSV/Excel only), 
         * column structure matching template, and file size within limits, rejecting invalid files with specific error messages
         * **Validates: Requirements 2.1, 2.2, 2.4**
         */
        test('should comprehensively validate all file upload aspects', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        name: fc.oneof(
                            fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.csv`),
                            fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.xlsx`),
                            fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.xls`),
                            fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.txt`),
                            fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.pdf`)
                        ),
                        size: fc.integer({ min: 0, max: 10 * 1024 * 1024 }), // 0 to 10MB
                        type: fc.oneof(
                            fc.constant('text/csv'),
                            fc.constant('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
                            fc.constant('application/vnd.ms-excel'),
                            fc.constant('text/plain'),
                            fc.constant('application/pdf')
                        )
                    }),
                    (fileProps) => {
                        const mockFile = {
                            name: fileProps.name,
                            size: fileProps.size,
                            type: fileProps.type
                        };

                        // Test file format validation
                        const formatResult = parser.validateFileFormat(mockFile);
                        const extension = fileProps.name.toLowerCase().split('.').pop();
                        const isValidFormat = ['csv', 'xlsx', 'xls'].includes(extension);

                        // Test file size validation
                        const sizeResult = parser.validateFileSize(mockFile);
                        const isValidSize = fileProps.size > 0 && fileProps.size <= 5 * 1024 * 1024;

                        // Comprehensive validation should match individual validations
                        if (!isValidFormat) {
                            return formatResult.valid === false && 
                                   formatResult.error.includes('Format file tidak didukung');
                        }

                        if (!isValidSize) {
                            if (fileProps.size === 0) {
                                return sizeResult.valid === false && 
                                       sizeResult.error.includes('File kosong');
                            } else {
                                return sizeResult.valid === false && 
                                       sizeResult.error.includes('Ukuran file terlalu besar');
                            }
                        }

                        // If both format and size are valid, both validations should pass
                        return formatResult.valid === true && sizeResult.valid === true;
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    describe('Method Signatures', () => {
        test('should have all required methods', () => {
            expect(typeof parser.parseCSV).toBe('function');
            expect(typeof parser.parseExcel).toBe('function');
            expect(typeof parser.parse).toBe('function');
            expect(typeof parser.validateFileFormat).toBe('function');
            expect(typeof parser.validateFileSize).toBe('function');
            expect(typeof parser.validateColumnStructure).toBe('function');
        });
    });
});