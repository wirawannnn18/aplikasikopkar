/**
 * ValidationEngine - Comprehensive data validation for Excel/CSV uploads
 * 
 * This class provides multi-layer validation including file format,
 * data types, business rules, and integrity checks.
 */

class ValidationEngine {
    constructor() {
        /** @type {string[]} */
        this.requiredFields = ['kode', 'nama', 'kategori', 'satuan', 'harga_beli', 'stok'];
        
        /** @type {Object} */
        this.fieldTypes = {
            kode: 'string',
            nama: 'string',
            kategori: 'string',
            satuan: 'string',
            harga_beli: 'number',
            stok: 'number',
            supplier: 'string'
        };
        
        /** @type {Object} */
        this.fieldConstraints = {
            kode: { maxLength: 20, pattern: /^[A-Za-z0-9_-]+$/ },
            nama: { maxLength: 100 },
            kategori: { maxLength: 50 },
            satuan: { maxLength: 30 },
            harga_beli: { min: 0 },
            stok: { min: 0 },
            supplier: { maxLength: 100 }
        };
        
        /** @type {Set<string>} */
        this.allowedFileTypes = new Set(['text/csv', 'application/vnd.ms-excel', 
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
        
        /** @type {number} */
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
    }

    /**
     * Validate file format and basic properties
     * @param {File} file - File to validate
     * @returns {Promise<FileValidationResult>} Validation result
     */
    async validateFileFormat(file) {
        try {
            // Check for empty files first
            if (file.size === 0) {
                return {
                    isValid: false,
                    error: 'File is empty',
                    format: 'unknown',
                    size: file.size,
                    encoding: 'unknown'
                };
            }

            // Check file size
            if (file.size > this.maxFileSize) {
                return {
                    isValid: false,
                    error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of 5MB`,
                    format: 'unknown',
                    size: file.size,
                    encoding: 'unknown'
                };
            }

            // Check file type by extension and MIME type
            const fileName = file.name.toLowerCase();
            const isCSV = fileName.endsWith('.csv') || file.type === 'text/csv';
            const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || 
                           file.type.includes('spreadsheetml') || file.type.includes('ms-excel');

            if (!isCSV && !isExcel) {
                return {
                    isValid: false,
                    error: 'Invalid file format. Only CSV and Excel files (.csv, .xlsx, .xls) are supported',
                    format: 'unknown',
                    size: file.size,
                    encoding: 'unknown'
                };
            }

            // Detect format
            const format = isCSV ? 'csv' : 'excel';

            // Basic file content validation
            const isValidContent = await this.validateFileContent(file, format);
            if (!isValidContent.isValid) {
                return {
                    isValid: false,
                    error: isValidContent.error,
                    format,
                    size: file.size,
                    encoding: 'utf-8'
                };
            }

            return {
                isValid: true,
                format,
                size: file.size,
                encoding: 'utf-8'
            };

        } catch (error) {
            return {
                isValid: false,
                error: `File validation error: ${error.message}`,
                format: 'unknown',
                size: file.size,
                encoding: 'unknown'
            };
        }
    }

    /**
     * Validate file size constraints
     * @param {File} file - File to validate
     * @returns {boolean} True if size is valid
     */
    validateFileSize(file) {
        return file.size <= this.maxFileSize && file.size > 0;
    }

    /**
     * Validate CSV/Excel headers
     * @param {string[]} headers - Header row from file
     * @returns {ValidationError[]} Header validation errors
     */
    validateHeaders(headers) {
        const errors = [];
        
        // Normalize headers (lowercase, trim)
        const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
        
        // Check for required fields
        for (const required of this.requiredFields) {
            if (!normalizedHeaders.includes(required)) {
                errors.push({
                    type: 'format',
                    field: required,
                    row: 1,
                    message: `Required column '${required}' is missing`,
                    severity: 'error',
                    code: 'MISSING_REQUIRED_COLUMN'
                });
            }
        }
        
        // Check for duplicate headers
        const headerCounts = {};
        normalizedHeaders.forEach(header => {
            headerCounts[header] = (headerCounts[header] || 0) + 1;
        });
        
        Object.entries(headerCounts).forEach(([header, count]) => {
            if (count > 1) {
                errors.push({
                    type: 'format',
                    field: header,
                    row: 1,
                    message: `Duplicate column '${header}' found`,
                    severity: 'error',
                    code: 'DUPLICATE_COLUMN'
                });
            }
        });
        
        return errors;
    }

    /**
     * Validate data types for a single row
     * @param {Object} row - Data row to validate
     * @param {number} rowNumber - Row number for error reporting
     * @returns {ValidationError[]} Type validation errors
     */
    validateDataTypes(row, rowNumber) {
        const errors = [];
        
        Object.entries(this.fieldTypes).forEach(([field, expectedType]) => {
            const value = row[field];
            
            // Skip validation for optional fields that are empty
            if (!this.requiredFields.includes(field) && (value === undefined || value === '')) {
                return;
            }
            
            // Check required fields
            if (this.requiredFields.includes(field) && (value === undefined || value === '' || value === null)) {
                errors.push({
                    type: 'business',
                    field,
                    row: rowNumber,
                    message: `Required field '${field}' is empty`,
                    severity: 'error',
                    code: 'REQUIRED_FIELD_EMPTY'
                });
                return;
            }
            
            // Type validation
            if (expectedType === 'number') {
                const numValue = parseFloat(value);
                if (isNaN(numValue)) {
                    errors.push({
                        type: 'format',
                        field,
                        row: rowNumber,
                        message: `Field '${field}' must be a number, got '${value}'`,
                        severity: 'error',
                        code: 'INVALID_NUMBER_FORMAT'
                    });
                }
            } else if (expectedType === 'string') {
                if (typeof value !== 'string' && value !== undefined) {
                    // Try to convert to string
                    row[field] = String(value);
                }
            }
        });
        
        return errors;
    }

    /**
     * Validate business rules for a single row
     * @param {Object} row - Data row to validate
     * @param {number} rowNumber - Row number for error reporting
     * @returns {ValidationError[]} Business rule validation errors
     */
    validateBusinessRules(row, rowNumber) {
        const errors = [];
        
        Object.entries(this.fieldConstraints).forEach(([field, constraints]) => {
            const value = row[field];
            
            // Skip if field is empty and not required
            if (!this.requiredFields.includes(field) && (value === undefined || value === '')) {
                return;
            }
            
            // String length validation
            if (constraints.maxLength && typeof value === 'string' && value.length > constraints.maxLength) {
                errors.push({
                    type: 'business',
                    field,
                    row: rowNumber,
                    message: `Field '${field}' exceeds maximum length of ${constraints.maxLength} characters`,
                    severity: 'error',
                    code: 'FIELD_TOO_LONG'
                });
            }
            
            // Pattern validation
            if (constraints.pattern && typeof value === 'string' && !constraints.pattern.test(value)) {
                errors.push({
                    type: 'business',
                    field,
                    row: rowNumber,
                    message: `Field '${field}' contains invalid characters. Only letters, numbers, hyphens, and underscores are allowed`,
                    severity: 'error',
                    code: 'INVALID_PATTERN'
                });
            }
            
            // Numeric range validation
            if (constraints.min !== undefined) {
                const numValue = parseFloat(value);
                if (!isNaN(numValue) && numValue < constraints.min) {
                    errors.push({
                        type: 'business',
                        field,
                        row: rowNumber,
                        message: `Field '${field}' must be at least ${constraints.min}, got ${numValue}`,
                        severity: 'error',
                        code: 'VALUE_TOO_SMALL'
                    });
                }
            }
            
            if (constraints.max !== undefined) {
                const numValue = parseFloat(value);
                if (!isNaN(numValue) && numValue > constraints.max) {
                    errors.push({
                        type: 'business',
                        field,
                        row: rowNumber,
                        message: `Field '${field}' must be at most ${constraints.max}, got ${numValue}`,
                        severity: 'error',
                        code: 'VALUE_TOO_LARGE'
                    });
                }
            }
        });
        
        return errors;
    }

    /**
     * Validate for duplicate records within the file
     * @param {Object[]} data - All data rows
     * @returns {ValidationError[]} Duplicate validation errors
     */
    validateDuplicates(data) {
        const errors = [];
        const seenCodes = new Map();
        
        data.forEach((row, index) => {
            const kode = row.kode;
            const rowNumber = index + 2; // Account for header row
            
            if (!kode) return; // Skip if no code (will be caught by required field validation)
            
            if (seenCodes.has(kode)) {
                const firstOccurrence = seenCodes.get(kode);
                errors.push({
                    type: 'integrity',
                    field: 'kode',
                    row: rowNumber,
                    message: `Duplicate product code '${kode}' found. First occurrence at row ${firstOccurrence}`,
                    severity: 'error',
                    code: 'DUPLICATE_PRODUCT_CODE'
                });
            } else {
                seenCodes.set(kode, rowNumber);
            }
        });
        
        return errors;
    }

    /**
     * Validate against existing data in the system
     * @param {Object[]} data - Data rows to validate
     * @returns {Promise<ValidationError[]>} Existing data validation warnings
     */
    async validateExistingData(data) {
        const warnings = [];
        
        // Get existing master barang data
        const existingBarang = this.getExistingBarangData();
        const existingCodes = new Set(existingBarang.map(b => b.kode));
        
        data.forEach((row, index) => {
            const kode = row.kode;
            const rowNumber = index + 2;
            
            if (!kode) return;
            
            if (existingCodes.has(kode)) {
                warnings.push({
                    type: 'integrity',
                    field: 'kode',
                    row: rowNumber,
                    message: `Product code '${kode}' already exists in system. Import will update existing record`,
                    severity: 'warning',
                    code: 'EXISTING_PRODUCT_CODE'
                });
            }
        });
        
        return warnings;
    }

    /**
     * Validate file content structure
     * @param {File} file - File to validate
     * @param {string} format - File format (csv|excel)
     * @returns {Promise<Object>} Content validation result
     * @private
     */
    async validateFileContent(file, format) {
        try {
            if (format === 'csv') {
                // Read first few lines to check CSV structure
                const text = await this.readFileAsText(file, 1000); // Read first 1KB
                const lines = text.split('\n').filter(line => line.trim());
                
                if (lines.length < 2) {
                    return { isValid: false, error: 'File appears to be empty or contains only headers' };
                }
                
                // Check if it looks like CSV
                const headerLine = lines[0];
                if (!headerLine.includes(',') && !headerLine.includes(';')) {
                    return { isValid: false, error: 'File does not appear to be a valid CSV format' };
                }
            }
            
            return { isValid: true };
            
        } catch (error) {
            return { isValid: false, error: `Cannot read file content: ${error.message}` };
        }
    }

    /**
     * Read file as text (partial read for validation)
     * @param {File} file - File to read
     * @param {number} maxBytes - Maximum bytes to read
     * @returns {Promise<string>} File content
     * @private
     */
    readFileAsText(file, maxBytes = 1000) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            const blob = file.slice(0, maxBytes);
            
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            
            reader.readAsText(blob);
        });
    }

    /**
     * Get existing barang data from localStorage
     * @returns {Object[]} Existing barang data
     * @private
     */
    getExistingBarangData() {
        try {
            const data = localStorage.getItem('masterBarang');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading existing barang data:', error);
            return [];
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidationEngine;
} else {
    window.ValidationEngine = ValidationEngine;
}