/**
 * File Parser - Handles CSV/Excel file parsing and validation
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

// Import PerformanceOptimizer and SecurityValidator - conditional import for different environments
let PerformanceOptimizer, SecurityValidator;
if (typeof require !== 'undefined') {
    // Node.js environment
    try {
        PerformanceOptimizer = require('./PerformanceOptimizer.js').PerformanceOptimizer;
        SecurityValidator = require('./SecurityValidator.js').SecurityValidator;
    } catch (e) {
        PerformanceOptimizer = null;
        SecurityValidator = null;
    }
} else if (typeof window !== 'undefined') {
    // Browser environment
    PerformanceOptimizer = window.PerformanceOptimizer;
    SecurityValidator = window.SecurityValidator;
}

/**
 * File parser class for CSV and Excel files
 * Handles file format validation and data extraction with performance optimizations
 */
class FileParser {
    constructor() {
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.supportedFormats = ['csv', 'xlsx', 'xls'];
        this.requiredColumns = [
            'nomor_anggota',
            'nama_anggota', 
            'jenis_pembayaran',
            'jumlah_pembayaran',
            'keterangan'
        ];
        
        // Initialize performance optimizer for large file processing
        // Requirements: 2.3 - Optimize large file processing
        this.performanceOptimizer = PerformanceOptimizer ? new PerformanceOptimizer() : null;
        
        // Initialize security validator for file upload security
        // Requirements: 8.1 - Add file upload security validation
        this.securityValidator = SecurityValidator ? new SecurityValidator() : null;
        
        this.progressCallback = null;
    }

    /**
     * Parse CSV file
     * Requirements: 2.1, 2.2
     * @param {File} file - CSV file to parse
     * @returns {Promise<Array>} Parsed data rows
     */
    async parseCSV(file) {
        return new Promise((resolve, reject) => {
            // Check if Papa Parse is available
            if (typeof Papa === 'undefined') {
                reject(new Error('Papa Parse library tidak tersedia'));
                return;
            }

            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                encoding: 'UTF-8',
                complete: (results) => {
                    if (results.errors && results.errors.length > 0) {
                        const errorMessages = results.errors.map(error => 
                            `Baris ${error.row + 1}: ${error.message}`
                        ).join('; ');
                        reject(new Error(`Error parsing CSV: ${errorMessages}`));
                        return;
                    }

                    // Validate column structure
                    if (results.data.length === 0) {
                        reject(new Error('File CSV kosong atau tidak memiliki data'));
                        return;
                    }

                    const headers = Object.keys(results.data[0]);
                    const columnValidation = this.validateColumnStructure(headers);
                    if (!columnValidation.valid) {
                        reject(new Error(columnValidation.error));
                        return;
                    }

                    resolve(results.data);
                },
                error: (error) => {
                    reject(new Error(`Error membaca file CSV: ${error.message}`));
                }
            });
        });
    }

    /**
     * Parse Excel file
     * Requirements: 2.1, 2.2
     * @param {File} file - Excel file to parse
     * @returns {Promise<Array>} Parsed data rows
     */
    async parseExcel(file) {
        return new Promise((resolve, reject) => {
            // Check if XLSX library is available
            if (typeof XLSX === 'undefined') {
                reject(new Error('SheetJS library tidak tersedia'));
                return;
            }

            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Get the first worksheet
                    const firstSheetName = workbook.SheetNames[0];
                    if (!firstSheetName) {
                        reject(new Error('File Excel tidak memiliki worksheet'));
                        return;
                    }
                    
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    // Convert to JSON with header row
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                        header: 1,
                        defval: '',
                        blankrows: false
                    });
                    
                    if (jsonData.length === 0) {
                        reject(new Error('File Excel kosong atau tidak memiliki data'));
                        return;
                    }
                    
                    // First row should be headers
                    const headers = jsonData[0];
                    const columnValidation = this.validateColumnStructure(headers);
                    if (!columnValidation.valid) {
                        reject(new Error(columnValidation.error));
                        return;
                    }
                    
                    // Convert to object format like CSV parser
                    const dataRows = jsonData.slice(1).map(row => {
                        const obj = {};
                        headers.forEach((header, index) => {
                            obj[header] = row[index] || '';
                        });
                        return obj;
                    }).filter(row => {
                        // Filter out completely empty rows
                        return Object.values(row).some(value => value && value.toString().trim() !== '');
                    });
                    
                    if (dataRows.length === 0) {
                        reject(new Error('File Excel tidak memiliki data setelah header'));
                        return;
                    }
                    
                    resolve(dataRows);
                } catch (error) {
                    reject(new Error(`Error parsing Excel file: ${error.message}`));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Error membaca file Excel'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Validate file format
     * Requirements: 2.1, 2.4
     * @param {File} file - File to validate
     * @returns {Object} Validation result
     */
    validateFileFormat(file) {
        const fileName = file.name.toLowerCase();
        const extension = fileName.split('.').pop();
        
        if (!this.supportedFormats.includes(extension)) {
            return {
                valid: false,
                error: `Format file tidak didukung. Gunakan format: ${this.supportedFormats.join(', ')}`
            };
        }

        return { valid: true };
    }

    /**
     * Validate file size
     * Requirements: 2.4
     * @param {File} file - File to validate
     * @returns {Object} Validation result
     */
    validateFileSize(file) {
        if (file.size > this.maxFileSize) {
            return {
                valid: false,
                error: `Ukuran file terlalu besar. Maksimal ${this.maxFileSize / (1024 * 1024)}MB`
            };
        }

        if (file.size === 0) {
            return {
                valid: false,
                error: 'File kosong atau tidak valid'
            };
        }

        return { valid: true };
    }

    /**
     * Main parse method that determines file type and calls appropriate parser
     * Requirements: 2.1, 2.2, 2.3, 8.1 - Optimize large file processing with security validation
     * @param {File} file - File to parse
     * @param {Function} progressCallback - Progress callback for large files
     * @returns {Promise<Array>} Parsed data rows
     */
    async parse(file, progressCallback = null) {
        this.progressCallback = progressCallback;
        
        // Security validation first
        // Requirements: 8.1 - Add file upload security validation
        if (this.securityValidator) {
            const securityResult = this.securityValidator.validateFileUploadSecurity(file);
            if (!securityResult.isSecure) {
                throw new Error(`Security validation failed: ${securityResult.errors.join('; ')}`);
            }
            
            // Log security warnings if any
            if (securityResult.warnings.length > 0) {
                console.warn('File upload security warnings:', securityResult.warnings);
            }
        }
        
        // Validate file format
        const formatValidation = this.validateFileFormat(file);
        if (!formatValidation.valid) {
            throw new Error(formatValidation.error);
        }

        // Validate file size
        const sizeValidation = this.validateFileSize(file);
        if (!sizeValidation.valid) {
            throw new Error(sizeValidation.error);
        }

        // Determine file type and parse accordingly
        const fileName = file.name.toLowerCase();
        const extension = fileName.split('.').pop();

        // Use performance optimizer for large files (>1MB)
        // Requirements: 2.3 - Optimize large file processing
        if (this.performanceOptimizer && file.size > 1024 * 1024) {
            return await this._parseWithOptimization(file, extension);
        } else {
            // Standard parsing for smaller files
            if (extension === 'csv') {
                return await this.parseCSV(file);
            } else if (extension === 'xlsx' || extension === 'xls') {
                return await this.parseExcel(file);
            } else {
                throw new Error(`Format file tidak didukung: ${extension}`);
            }
        }
    }

    /**
     * Parse large files with performance optimization
     * Requirements: 2.3 - Optimize large file processing
     * @param {File} file - Large file to parse
     * @param {string} extension - File extension
     * @returns {Promise<Array>} Parsed data rows
     * @private
     */
    async _parseWithOptimization(file, extension) {
        const processor = async (fileChunk) => {
            if (extension === 'csv') {
                return await this.parseCSV(fileChunk);
            } else if (extension === 'xlsx' || extension === 'xls') {
                return await this.parseExcel(fileChunk);
            } else {
                throw new Error(`Format file tidak didukung: ${extension}`);
            }
        };

        return await this.performanceOptimizer.optimizeFileProcessing(
            file, 
            processor, 
            this.progressCallback
        );
    }

    /**
     * Validate column structure
     * Requirements: 2.2
     * @param {Array} headers - Column headers from file
     * @returns {Object} Validation result
     */
    validateColumnStructure(headers) {
        const missingColumns = this.requiredColumns.filter(
            col => !headers.includes(col)
        );

        if (missingColumns.length > 0) {
            return {
                valid: false,
                error: `Kolom yang diperlukan tidak ditemukan: ${missingColumns.join(', ')}`
            };
        }

        return { valid: true };
    }
}

// Export for both browser and Node.js environments
if (typeof window !== 'undefined') {
    window.FileParser = FileParser;
}

// ES Module export
export { FileParser };

// CommonJS export for compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FileParser };
}