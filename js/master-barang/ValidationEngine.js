/**
 * Master Barang Komprehensif - Validation Engine
 * Comprehensive validation system for all data models
 */

import { VALIDATION_RULES } from './types.js';

export class ValidationEngine {
    constructor() {
        this.rules = VALIDATION_RULES;
    }

    /**
     * Validate barang data
     * @param {Object} data - Barang data to validate
     * @param {boolean} isUpdate - Whether this is an update operation
     * @returns {Object} Validation result
     */
    validateBarang(data, isUpdate = false) {
        const errors = [];
        const warnings = [];

        // Required field validation
        if (!isUpdate || data.hasOwnProperty('kode')) {
            if (!data.kode || typeof data.kode !== 'string') {
                errors.push('Kode barang harus diisi');
            } else if (data.kode.length < this.rules.BARANG.KODE.MIN_LENGTH) {
                errors.push(`Kode barang minimal ${this.rules.BARANG.KODE.MIN_LENGTH} karakter`);
            } else if (data.kode.length > this.rules.BARANG.KODE.MAX_LENGTH) {
                errors.push(`Kode barang maksimal ${this.rules.BARANG.KODE.MAX_LENGTH} karakter`);
            } else if (!this.rules.BARANG.KODE.PATTERN.test(data.kode)) {
                errors.push('Kode barang hanya boleh mengandung huruf, angka, dan tanda hubung');
            }
        }

        if (!isUpdate || data.hasOwnProperty('nama')) {
            if (!data.nama || typeof data.nama !== 'string') {
                errors.push('Nama barang harus diisi');
            } else if (data.nama.length < this.rules.BARANG.NAMA.MIN_LENGTH) {
                errors.push(`Nama barang minimal ${this.rules.BARANG.NAMA.MIN_LENGTH} karakter`);
            } else if (data.nama.length > this.rules.BARANG.NAMA.MAX_LENGTH) {
                errors.push(`Nama barang maksimal ${this.rules.BARANG.NAMA.MAX_LENGTH} karakter`);
            }
        }

        // Price validation
        if (data.hasOwnProperty('harga_beli')) {
            const hargaBeli = Number(data.harga_beli);
            if (isNaN(hargaBeli) || hargaBeli < 0) {
                errors.push('Harga beli harus berupa angka positif');
            } else if (hargaBeli > this.rules.BARANG.HARGA.MAX_VALUE) {
                errors.push(`Harga beli tidak boleh lebih dari ${this.rules.BARANG.HARGA.MAX_VALUE.toLocaleString()}`);
            }
        }

        if (data.hasOwnProperty('harga_jual')) {
            const hargaJual = Number(data.harga_jual);
            if (isNaN(hargaJual) || hargaJual < 0) {
                errors.push('Harga jual harus berupa angka positif');
            } else if (hargaJual > this.rules.BARANG.HARGA.MAX_VALUE) {
                errors.push(`Harga jual tidak boleh lebih dari ${this.rules.BARANG.HARGA.MAX_VALUE.toLocaleString()}`);
            }
        }
        // Price comparison validation
        if (data.hasOwnProperty('harga_beli') && data.hasOwnProperty('harga_jual')) {
            const hargaBeli = Number(data.harga_beli);
            const hargaJual = Number(data.harga_jual);
            if (!isNaN(hargaBeli) && !isNaN(hargaJual) && hargaJual < hargaBeli) {
                warnings.push('Harga jual lebih rendah dari harga beli');
            }
        }

        // Stock validation
        if (data.hasOwnProperty('stok')) {
            const stok = Number(data.stok);
            if (isNaN(stok) || stok < 0) {
                errors.push('Stok harus berupa angka positif atau nol');
            } else if (stok > this.rules.BARANG.STOK.MAX_VALUE) {
                errors.push(`Stok tidak boleh lebih dari ${this.rules.BARANG.STOK.MAX_VALUE.toLocaleString()}`);
            }
        }

        if (data.hasOwnProperty('stok_minimum')) {
            const stokMin = Number(data.stok_minimum);
            if (isNaN(stokMin) || stokMin < 0) {
                errors.push('Stok minimum harus berupa angka positif atau nol');
            }
        }

        // Stock warning validation
        if (data.hasOwnProperty('stok') && data.hasOwnProperty('stok_minimum')) {
            const stok = Number(data.stok);
            const stokMin = Number(data.stok_minimum);
            if (!isNaN(stok) && !isNaN(stokMin) && stok <= stokMin && stok > 0) {
                warnings.push('Stok saat ini sudah mencapai batas minimum');
            }
        }

        // Category and unit validation
        if (!isUpdate || data.hasOwnProperty('kategori_id')) {
            if (!data.kategori_id) {
                errors.push('Kategori harus dipilih');
            }
        }

        if (!isUpdate || data.hasOwnProperty('satuan_id')) {
            if (!data.satuan_id) {
                errors.push('Satuan harus dipilih');
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validate kategori data
     * @param {Object} data - Kategori data to validate
     * @param {boolean} isUpdate - Whether this is an update operation
     * @returns {Object} Validation result
     */
    validateKategori(data, isUpdate = false) {
        const errors = [];
        const warnings = [];

        // Required field validation
        if (!isUpdate || data.hasOwnProperty('nama')) {
            if (!data.nama || typeof data.nama !== 'string') {
                errors.push('Nama kategori harus diisi');
            } else if (data.nama.length < this.rules.KATEGORI.NAMA.MIN_LENGTH) {
                errors.push(`Nama kategori minimal ${this.rules.KATEGORI.NAMA.MIN_LENGTH} karakter`);
            } else if (data.nama.length > this.rules.KATEGORI.NAMA.MAX_LENGTH) {
                errors.push(`Nama kategori maksimal ${this.rules.KATEGORI.NAMA.MAX_LENGTH} karakter`);
            }
        }

        // Optional description validation
        if (data.hasOwnProperty('deskripsi') && data.deskripsi) {
            if (typeof data.deskripsi !== 'string') {
                errors.push('Deskripsi kategori harus berupa teks');
            } else if (data.deskripsi.length > this.rules.KATEGORI.DESKRIPSI.MAX_LENGTH) {
                errors.push(`Deskripsi kategori maksimal ${this.rules.KATEGORI.DESKRIPSI.MAX_LENGTH} karakter`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Validate satuan data
     * @param {Object} data - Satuan data to validate
     * @param {boolean} isUpdate - Whether this is an update operation
     * @returns {Object} Validation result
     */
    validateSatuan(data, isUpdate = false) {
        const errors = [];
        const warnings = [];

        // Required field validation
        if (!isUpdate || data.hasOwnProperty('nama')) {
            if (!data.nama || typeof data.nama !== 'string') {
                errors.push('Nama satuan harus diisi');
            } else if (data.nama.length < this.rules.SATUAN.NAMA.MIN_LENGTH) {
                errors.push(`Nama satuan minimal ${this.rules.SATUAN.NAMA.MIN_LENGTH} karakter`);
            } else if (data.nama.length > this.rules.SATUAN.NAMA.MAX_LENGTH) {
                errors.push(`Nama satuan maksimal ${this.rules.SATUAN.NAMA.MAX_LENGTH} karakter`);
            }
        }

        // Optional description validation
        if (data.hasOwnProperty('deskripsi') && data.deskripsi) {
            if (typeof data.deskripsi !== 'string') {
                errors.push('Deskripsi satuan harus berupa teks');
            } else if (data.deskripsi.length > this.rules.SATUAN.DESKRIPSI.MAX_LENGTH) {
                errors.push(`Deskripsi satuan maksimal ${this.rules.SATUAN.DESKRIPSI.MAX_LENGTH} karakter`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validate import data row
     * @param {Object} row - Data row from import
     * @param {number} rowIndex - Row index for error reporting
     * @returns {Object} Validation result
     */
    validateImportRow(row, rowIndex) {
        const errors = [];
        const warnings = [];

        // Convert row data to proper format
        const barangData = {
            kode: row.kode || row.Kode || '',
            nama: row.nama || row.Nama || '',
            kategori_nama: row.kategori || row.Kategori || '',
            satuan_nama: row.satuan || row.Satuan || '',
            harga_beli: this.parseNumber(row.harga_beli || row['Harga Beli']),
            harga_jual: this.parseNumber(row.harga_jual || row['Harga Jual']),
            stok: this.parseNumber(row.stok || row.Stok),
            stok_minimum: this.parseNumber(row.stok_minimum || row['Stok Minimum'])
        };

        // Validate using barang validation
        const validation = this.validateBarang(barangData, false);
        
        // Add row context to errors
        validation.errors.forEach(error => {
            errors.push(`Baris ${rowIndex + 1}: ${error}`);
        });

        validation.warnings.forEach(warning => {
            warnings.push(`Baris ${rowIndex + 1}: ${warning}`);
        });

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            data: barangData
        };
    }

    /**
     * Validate bulk operation data
     * @param {Array} items - Array of items to validate
     * @param {string} operation - Operation type (delete, update)
     * @returns {Object} Validation result
     */
    validateBulkOperation(items, operation) {
        const errors = [];
        const warnings = [];

        if (!Array.isArray(items) || items.length === 0) {
            errors.push('Tidak ada item yang dipilih untuk operasi bulk');
            return { isValid: false, errors, warnings };
        }

        if (items.length > this.rules.BULK.MAX_ITEMS) {
            errors.push(`Maksimal ${this.rules.BULK.MAX_ITEMS} item dapat diproses sekaligus`);
        }

        // Validate operation type
        const validOperations = ['delete', 'update_kategori', 'update_satuan', 'update_harga'];
        if (!validOperations.includes(operation)) {
            errors.push('Jenis operasi bulk tidak valid');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Business rule validation for barang
     * @param {Object} data - Barang data
     * @param {Object} existingData - Existing barang data (for updates)
     * @returns {Object} Business validation result
     */
    validateBarangBusinessRules(data, existingData = null) {
        const errors = [];
        const warnings = [];

        // Check for duplicate kode (should be handled by manager)
        // This is a placeholder for business rule validation

        // Price margin validation
        if (data.harga_beli && data.harga_jual) {
            const margin = ((data.harga_jual - data.harga_beli) / data.harga_beli) * 100;
            if (margin < this.rules.BUSINESS.MIN_PROFIT_MARGIN) {
                warnings.push(`Margin keuntungan rendah (${margin.toFixed(1)}%), disarankan minimal ${this.rules.BUSINESS.MIN_PROFIT_MARGIN}%`);
            }
        }

        // Stock level validation
        if (data.stok !== undefined && data.stok_minimum !== undefined) {
            if (data.stok === 0) {
                warnings.push('Barang habis (stok = 0)');
            } else if (data.stok <= data.stok_minimum) {
                warnings.push('Stok mencapai batas minimum');
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validate file format for import
     * @param {File} file - File to validate
     * @returns {Object} Validation result
     */
    validateImportFile(file) {
        const errors = [];
        const warnings = [];

        if (!file) {
            errors.push('File harus dipilih');
            return { isValid: false, errors, warnings };
        }

        // Check file size
        if (file.size > this.rules.IMPORT.MAX_FILE_SIZE) {
            errors.push(`Ukuran file terlalu besar. Maksimal ${(this.rules.IMPORT.MAX_FILE_SIZE / 1024 / 1024).toFixed(1)}MB`);
        }

        // Check file type
        const allowedTypes = this.rules.IMPORT.ALLOWED_TYPES;
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(fileExtension)) {
            errors.push(`Format file tidak didukung. Gunakan: ${allowedTypes.join(', ')}`);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Parse number from string with proper validation
     * @param {any} value - Value to parse
     * @returns {number} Parsed number or 0
     */
    parseNumber(value) {
        if (value === null || value === undefined || value === '') {
            return 0;
        }
        
        // Handle string numbers with thousand separators
        if (typeof value === 'string') {
            value = value.replace(/[.,]/g, match => match === ',' ? '.' : '');
        }
        
        const parsed = Number(value);
        return isNaN(parsed) ? 0 : parsed;
    }

    /**
     * Sanitize text input
     * @param {string} text - Text to sanitize
     * @returns {string} Sanitized text
     */
    sanitizeText(text) {
        if (typeof text !== 'string') return '';
        
        return text
            .trim()
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .replace(/[<>]/g, ''); // Remove potential HTML tags
    }

    /**
     * Get validation summary
     * @param {Array} validationResults - Array of validation results
     * @returns {Object} Summary of validation results
     */
    getValidationSummary(validationResults) {
        const summary = {
            total: validationResults.length,
            valid: 0,
            invalid: 0,
            warnings: 0,
            errors: []
        };

        validationResults.forEach(result => {
            if (result.isValid) {
                summary.valid++;
            } else {
                summary.invalid++;
                summary.errors.push(...result.errors);
            }
            
            if (result.warnings && result.warnings.length > 0) {
                summary.warnings += result.warnings.length;
            }
        });

        return summary;
    }
}