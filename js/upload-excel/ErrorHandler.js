/**
 * Comprehensive Error Handler for Excel Upload System
 * Handles structured error messages, context information, and actionable guidance
 * 
 * Requirements: 2.3, 4.4
 */

class ErrorHandler {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.errorCodes = {
            // File validation errors
            FILE_FORMAT_INVALID: 'E001',
            FILE_SIZE_EXCEEDED: 'E002',
            FILE_EMPTY: 'E003',
            FILE_CORRUPTED: 'E004',
            
            // Header validation errors
            HEADER_MISSING: 'E101',
            HEADER_INVALID: 'E102',
            REQUIRED_COLUMN_MISSING: 'E103',
            
            // Data validation errors
            REQUIRED_FIELD_EMPTY: 'E201',
            INVALID_DATA_TYPE: 'E202',
            NEGATIVE_VALUE: 'E203',
            DUPLICATE_CODE: 'E204',
            INVALID_FORMAT: 'E205',
            
            // Business rule errors
            EXISTING_CODE_CONFLICT: 'E301',
            CATEGORY_NOT_FOUND: 'E302',
            UNIT_NOT_FOUND: 'E303',
            REFERENTIAL_INTEGRITY: 'E304',
            
            // System errors
            PROCESSING_ERROR: 'E401',
            STORAGE_ERROR: 'E402',
            NETWORK_ERROR: 'E403',
            MEMORY_ERROR: 'E404'
        };
        
        this.errorMessages = {
            [this.errorCodes.FILE_FORMAT_INVALID]: 'Format file tidak valid. Gunakan file CSV atau Excel (.xlsx)',
            [this.errorCodes.FILE_SIZE_EXCEEDED]: 'Ukuran file melebihi batas maksimal 5MB',
            [this.errorCodes.FILE_EMPTY]: 'File kosong atau tidak mengandung data',
            [this.errorCodes.FILE_CORRUPTED]: 'File rusak atau tidak dapat dibaca',
            
            [this.errorCodes.HEADER_MISSING]: 'Header tidak ditemukan dalam file',
            [this.errorCodes.HEADER_INVALID]: 'Format header tidak sesuai template',
            [this.errorCodes.REQUIRED_COLUMN_MISSING]: 'Kolom wajib tidak ditemukan',
            
            [this.errorCodes.REQUIRED_FIELD_EMPTY]: 'Field wajib tidak boleh kosong',
            [this.errorCodes.INVALID_DATA_TYPE]: 'Tipe data tidak sesuai',
            [this.errorCodes.NEGATIVE_VALUE]: 'Nilai tidak boleh negatif',
            [this.errorCodes.DUPLICATE_CODE]: 'Kode barang duplikat ditemukan',
            [this.errorCodes.INVALID_FORMAT]: 'Format data tidak valid',
            
            [this.errorCodes.EXISTING_CODE_CONFLICT]: 'Kode barang sudah ada dalam sistem',
            [this.errorCodes.CATEGORY_NOT_FOUND]: 'Kategori tidak ditemukan',
            [this.errorCodes.UNIT_NOT_FOUND]: 'Satuan tidak ditemukan',
            [this.errorCodes.REFERENTIAL_INTEGRITY]: 'Pelanggaran integritas referensial',
            
            [this.errorCodes.PROCESSING_ERROR]: 'Terjadi kesalahan saat memproses data',
            [this.errorCodes.STORAGE_ERROR]: 'Terjadi kesalahan saat menyimpan data',
            [this.errorCodes.NETWORK_ERROR]: 'Terjadi kesalahan jaringan',
            [this.errorCodes.MEMORY_ERROR]: 'Memori tidak mencukupi untuk memproses file'
        };
        
        this.actionableGuidance = {
            [this.errorCodes.FILE_FORMAT_INVALID]: [
                'Download template CSV yang disediakan',
                'Pastikan file berformat .csv atau .xlsx',
                'Jangan mengubah ekstensi file secara manual'
            ],
            [this.errorCodes.FILE_SIZE_EXCEEDED]: [
                'Bagi file menjadi beberapa bagian yang lebih kecil',
                'Hapus kolom yang tidak diperlukan',
                'Kompres file Excel sebelum upload'
            ],
            [this.errorCodes.REQUIRED_COLUMN_MISSING]: [
                'Pastikan semua kolom wajib ada: kode, nama, kategori, satuan, harga_beli, stok',
                'Download template terbaru untuk referensi',
                'Jangan mengubah nama kolom dalam template'
            ],
            [this.errorCodes.REQUIRED_FIELD_EMPTY]: [
                'Isi semua field yang wajib diisi',
                'Periksa baris yang ditandai dengan error',
                'Gunakan nilai default jika diperlukan'
            ],
            [this.errorCodes.DUPLICATE_CODE]: [
                'Pastikan setiap kode barang unik dalam file',
                'Periksa dan hapus duplikasi kode',
                'Gunakan sistem penomoran yang konsisten'
            ],
            [this.errorCodes.EXISTING_CODE_CONFLICT]: [
                'Gunakan kode barang yang berbeda',
                'Atau pilih opsi update data yang sudah ada',
                'Periksa master data barang yang sudah ada'
            ]
        };
    }

    /**
     * Add error with context information
     * @param {string} code - Error code
     * @param {string} message - Custom error message (optional)
     * @param {Object} context - Context information (row, column, field, value)
     */
    addError(code, message = null, context = {}) {
        const error = {
            id: this.generateErrorId(),
            code: code,
            message: message || this.errorMessages[code] || 'Unknown error',
            context: {
                row: context.row || null,
                column: context.column || null,
                field: context.field || null,
                value: context.value || null,
                timestamp: new Date().toISOString(),
                ...context
            },
            severity: 'error',
            guidance: this.actionableGuidance[code] || []
        };
        
        this.errors.push(error);
        return error;
    }

    /**
     * Add warning with context information
     * @param {string} code - Warning code
     * @param {string} message - Custom warning message (optional)
     * @param {Object} context - Context information
     */
    addWarning(code, message = null, context = {}) {
        const warning = {
            id: this.generateErrorId(),
            code: code,
            message: message || this.errorMessages[code] || 'Unknown warning',
            context: {
                row: context.row || null,
                column: context.column || null,
                field: context.field || null,
                value: context.value || null,
                timestamp: new Date().toISOString(),
                ...context
            },
            severity: 'warning',
            guidance: this.actionableGuidance[code] || []
        };
        
        this.warnings.push(warning);
        return warning;
    }

    /**
     * Generate unique error ID
     */
    generateErrorId() {
        return 'ERR_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get all errors
     */
    getErrors() {
        return this.errors;
    }

    /**
     * Get all warnings
     */
    getWarnings() {
        return this.warnings;
    }

    /**
     * Get errors by row number
     * @param {number} row - Row number
     */
    getErrorsByRow(row) {
        return this.errors.filter(error => error.context.row === row);
    }

    /**
     * Get errors by field name
     * @param {string} field - Field name
     */
    getErrorsByField(field) {
        return this.errors.filter(error => error.context.field === field);
    }

    /**
     * Check if there are any errors
     */
    hasErrors() {
        return this.errors.length > 0;
    }

    /**
     * Check if there are any warnings
     */
    hasWarnings() {
        return this.warnings.length > 0;
    }

    /**
     * Get error count
     */
    getErrorCount() {
        return this.errors.length;
    }

    /**
     * Get warning count
     */
    getWarningCount() {
        return this.warnings.length;
    }

    /**
     * Clear all errors and warnings
     */
    clear() {
        this.errors = [];
        this.warnings = [];
    }

    /**
     * Get formatted error summary
     */
    getErrorSummary() {
        const errorsByCode = {};
        
        this.errors.forEach(error => {
            if (!errorsByCode[error.code]) {
                errorsByCode[error.code] = {
                    code: error.code,
                    message: error.message,
                    count: 0,
                    rows: []
                };
            }
            errorsByCode[error.code].count++;
            if (error.context.row) {
                errorsByCode[error.code].rows.push(error.context.row);
            }
        });

        return {
            totalErrors: this.errors.length,
            totalWarnings: this.warnings.length,
            errorsByCode: Object.values(errorsByCode),
            hasBlockingErrors: this.hasBlockingErrors()
        };
    }

    /**
     * Check if there are blocking errors that prevent import
     */
    hasBlockingErrors() {
        const blockingCodes = [
            this.errorCodes.FILE_FORMAT_INVALID,
            this.errorCodes.FILE_SIZE_EXCEEDED,
            this.errorCodes.FILE_CORRUPTED,
            this.errorCodes.HEADER_MISSING,
            this.errorCodes.REQUIRED_COLUMN_MISSING,
            this.errorCodes.REQUIRED_FIELD_EMPTY,
            this.errorCodes.DUPLICATE_CODE
        ];
        
        return this.errors.some(error => blockingCodes.includes(error.code));
    }

    /**
     * Format error for display
     * @param {Object} error - Error object
     */
    formatErrorForDisplay(error) {
        let displayMessage = `[${error.code}] ${error.message}`;
        
        if (error.context.row) {
            displayMessage += ` (Baris ${error.context.row})`;
        }
        
        if (error.context.field) {
            displayMessage += ` - Field: ${error.context.field}`;
        }
        
        if (error.context.value !== null && error.context.value !== undefined) {
            displayMessage += ` - Nilai: "${error.context.value}"`;
        }
        
        return displayMessage;
    }

    /**
     * Get detailed error report
     */
    getDetailedReport() {
        return {
            summary: this.getErrorSummary(),
            errors: this.errors.map(error => ({
                ...error,
                displayMessage: this.formatErrorForDisplay(error)
            })),
            warnings: this.warnings.map(warning => ({
                ...warning,
                displayMessage: this.formatErrorForDisplay(warning)
            })),
            canProceed: !this.hasBlockingErrors(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Validate file before processing
     * @param {File} file - File object
     */
    validateFile(file) {
        this.clear();
        
        if (!file) {
            this.addError(this.errorCodes.FILE_EMPTY, 'Tidak ada file yang dipilih');
            return false;
        }
        
        // Check file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            this.addError(this.errorCodes.FILE_SIZE_EXCEEDED, 
                `Ukuran file ${(file.size / 1024 / 1024).toFixed(2)}MB melebihi batas maksimal 5MB`);
            return false;
        }
        
        // Check file format
        const allowedTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        
        const allowedExtensions = ['.csv', '.xls', '.xlsx'];
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        
        if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
            this.addError(this.errorCodes.FILE_FORMAT_INVALID, 
                `Format file "${fileExtension}" tidak didukung. Gunakan CSV atau Excel (.xlsx)`);
            return false;
        }
        
        return true;
    }

    /**
     * Validate headers
     * @param {Array} headers - Array of header names
     */
    validateHeaders(headers) {
        const requiredHeaders = ['kode', 'nama', 'kategori', 'satuan', 'harga_beli', 'stok'];
        const missingHeaders = [];
        
        requiredHeaders.forEach(required => {
            if (!headers.some(header => header.toLowerCase().trim() === required.toLowerCase())) {
                missingHeaders.push(required);
            }
        });
        
        if (missingHeaders.length > 0) {
            this.addError(this.errorCodes.REQUIRED_COLUMN_MISSING, 
                `Kolom wajib tidak ditemukan: ${missingHeaders.join(', ')}`, 
                { missingHeaders });
            return false;
        }
        
        return true;
    }

    /**
     * Validate row data
     * @param {Object} rowData - Row data object
     * @param {number} rowIndex - Row index (1-based)
     */
    validateRowData(rowData, rowIndex) {
        const requiredFields = ['kode', 'nama', 'kategori', 'satuan', 'harga_beli', 'stok'];
        let isValid = true;
        
        // Check required fields
        requiredFields.forEach(field => {
            const value = rowData[field];
            if (value === null || value === undefined || value === '') {
                this.addError(this.errorCodes.REQUIRED_FIELD_EMPTY, 
                    `Field "${field}" wajib diisi`, 
                    { row: rowIndex, field, value });
                isValid = false;
            }
        });
        
        // Validate numeric fields
        const numericFields = ['harga_beli', 'stok'];
        numericFields.forEach(field => {
            const value = rowData[field];
            if (value !== null && value !== undefined && value !== '') {
                const numValue = parseFloat(value);
                if (isNaN(numValue)) {
                    this.addError(this.errorCodes.INVALID_DATA_TYPE, 
                        `Field "${field}" harus berupa angka`, 
                        { row: rowIndex, field, value });
                    isValid = false;
                } else if (numValue < 0) {
                    this.addError(this.errorCodes.NEGATIVE_VALUE, 
                        `Field "${field}" tidak boleh bernilai negatif`, 
                        { row: rowIndex, field, value });
                    isValid = false;
                }
            }
        });
        
        return isValid;
    }

    /**
     * Check for duplicate codes in data
     * @param {Array} data - Array of row data
     */
    checkDuplicateCodes(data) {
        const codeMap = new Map();
        let hasDuplicates = false;
        
        data.forEach((row, index) => {
            const code = row.kode;
            if (code) {
                if (codeMap.has(code)) {
                    const firstOccurrence = codeMap.get(code);
                    this.addError(this.errorCodes.DUPLICATE_CODE, 
                        `Kode barang "${code}" duplikat`, 
                        { row: index + 1, field: 'kode', value: code, duplicateOf: firstOccurrence });
                    hasDuplicates = true;
                } else {
                    codeMap.set(code, index + 1);
                }
            }
        });
        
        return !hasDuplicates;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}