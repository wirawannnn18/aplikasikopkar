/**
 * Master Barang Komprehensif - Barang Manager
 * Manages CRUD operations for barang data
 */

import { BaseManager } from './BaseManager.js';
import { STORAGE_KEYS, VALIDATION_RULES, ERROR_MESSAGES } from './types.js';
import { ValidationEngine } from './ValidationEngine.js';
import { DataValidator } from './DataValidator.js';

export class BarangManager extends BaseManager {
    constructor() {
        super(STORAGE_KEYS.BARANG);
        this.validationEngine = new ValidationEngine();
        this.businessRuleValidator = null; // Will be set by system
    }

    /**
     * Set business rule validator (called by system)
     * @param {BusinessRuleValidator} validator - Business rule validator
     */
    setBusinessRuleValidator(validator) {
        this.businessRuleValidator = validator;
    }

    /**
     * Validate barang data using comprehensive validation engine
     * @param {Object} barangData - Barang data to validate
     * @param {string|null} excludeId - ID to exclude from uniqueness check
     * @returns {Object} Validation result
     */
    validate(barangData, excludeId = null) {
        // Use validation engine for field validation
        const fieldValidation = this.validationEngine.validateBarang(barangData, excludeId !== null);
        
        // Use business rule validator if available
        let businessValidation = { isValid: true, errors: [], warnings: [] };
        if (this.businessRuleValidator) {
            businessValidation = this.businessRuleValidator.validateBarangBusinessRules(barangData, excludeId);
        } else {
            // Fallback: check for duplicate kode
            if (barangData.kode && this.existsByField('kode', barangData.kode, excludeId)) {
                businessValidation.errors.push(`Kode barang '${barangData.kode}' sudah digunakan`);
                businessValidation.isValid = false;
            }
        }

        // Combine validation results
        const allErrors = [...fieldValidation.errors, ...businessValidation.errors];
        const allWarnings = [...fieldValidation.warnings, ...businessValidation.warnings];

        return {
            isValid: allErrors.length === 0,
            errors: allErrors,
            warnings: allWarnings
        };
    }

    /**
     * Create new barang with validation
     * @param {Object} barangData - Barang data
     * @returns {Object} Result with created item or errors
     */
    createBarang(barangData) {
        const validation = this.validate(barangData);
        
        if (!validation.isValid) {
            return {
                success: false,
                errors: validation.errors,
                warnings: validation.warnings
            };
        }

        // Normalize data
        const normalizedData = {
            ...barangData,
            kode: barangData.kode.toUpperCase(),
            harga_beli: parseFloat(barangData.harga_beli),
            harga_jual: barangData.harga_jual ? parseFloat(barangData.harga_jual) : 0,
            stok: parseFloat(barangData.stok),
            stok_minimum: barangData.stok_minimum ? parseFloat(barangData.stok_minimum) : 0,
            deskripsi: barangData.deskripsi || ''
        };

        const createdItem = this.create(normalizedData);

        return {
            success: true,
            data: createdItem,
            warnings: validation.warnings
        };
    }

    /**
     * Update existing barang with validation
     * @param {string} id - Barang ID
     * @param {Object} updateData - Update data
     * @returns {Object} Result with updated item or errors
     */
    updateBarang(id, updateData) {
        const existingItem = this.findById(id);
        if (!existingItem) {
            return {
                success: false,
                errors: ['Barang tidak ditemukan']
            };
        }

        const validation = this.validate(updateData, id);
        
        if (!validation.isValid) {
            return {
                success: false,
                errors: validation.errors,
                warnings: validation.warnings
            };
        }

        // Normalize data
        const normalizedData = {
            ...updateData,
            kode: updateData.kode ? updateData.kode.toUpperCase() : existingItem.kode,
            harga_beli: updateData.harga_beli !== undefined ? parseFloat(updateData.harga_beli) : existingItem.harga_beli,
            harga_jual: updateData.harga_jual !== undefined ? parseFloat(updateData.harga_jual) : existingItem.harga_jual,
            stok: updateData.stok !== undefined ? parseFloat(updateData.stok) : existingItem.stok,
            stok_minimum: updateData.stok_minimum !== undefined ? parseFloat(updateData.stok_minimum) : existingItem.stok_minimum
        };

        const updatedItem = this.update(id, normalizedData);

        return {
            success: true,
            data: updatedItem,
            warnings: validation.warnings
        };
    }

    /**
     * Search barang with advanced filters
     * @param {Object} searchOptions - Search options
     * @returns {Object} Paginated search results
     */
    searchBarang(searchOptions = {}) {
        const {
            searchTerm,
            kategori_id,
            satuan_id,
            status,
            harga_min,
            harga_max,
            stok_min,
            stok_max,
            low_stock_only,
            ...paginationOptions
        } = searchOptions;

        // Override getAll to include barang-specific filters
        const originalGetAll = this.getAll.bind(this);
        this.getAll = (filters) => {
            let result = originalGetAll(filters);

            // Apply kategori filter
            if (kategori_id) {
                result = result.filter(item => item.kategori_id === kategori_id);
            }

            // Apply satuan filter
            if (satuan_id) {
                result = result.filter(item => item.satuan_id === satuan_id);
            }

            // Apply price range filter
            if (harga_min !== undefined) {
                result = result.filter(item => item.harga_beli >= parseFloat(harga_min));
            }
            if (harga_max !== undefined) {
                result = result.filter(item => item.harga_beli <= parseFloat(harga_max));
            }

            // Apply stock range filter
            if (stok_min !== undefined) {
                result = result.filter(item => item.stok >= parseFloat(stok_min));
            }
            if (stok_max !== undefined) {
                result = result.filter(item => item.stok <= parseFloat(stok_max));
            }

            // Apply low stock filter
            if (low_stock_only) {
                result = result.filter(item => item.stok <= item.stok_minimum);
            }

            return result;
        };

        const paginatedResult = this.getPaginated({
            searchTerm,
            status,
            ...paginationOptions
        });

        // Restore original getAll method
        this.getAll = originalGetAll;

        return paginatedResult;
    }

    /**
     * Get barang by kode
     * @param {string} kode - Barang kode
     * @returns {Object|null} Barang item or null
     */
    getByKode(kode) {
        return this.data.find(item => item.kode === kode.toUpperCase()) || null;
    }

    /**
     * Get barang by kategori
     * @param {string} kategori_id - Kategori ID
     * @returns {Array} Array of barang items
     */
    getByKategori(kategori_id) {
        return this.findByField('kategori_id', kategori_id);
    }

    /**
     * Get barang by satuan
     * @param {string} satuan_id - Satuan ID
     * @returns {Array} Array of barang items
     */
    getBySatuan(satuan_id) {
        return this.findByField('satuan_id', satuan_id);
    }

    /**
     * Get low stock items
     * @returns {Array} Array of low stock items
     */
    getLowStockItems() {
        return this.data.filter(item => 
            item.status === 'aktif' && 
            item.stok <= item.stok_minimum
        );
    }

    /**
     * Update stock for barang
     * @param {string} id - Barang ID
     * @param {number} newStock - New stock value
     * @returns {Object} Update result
     */
    updateStock(id, newStock) {
        const stockValue = parseFloat(newStock);
        
        if (isNaN(stockValue) || stockValue < 0) {
            return {
                success: false,
                errors: ['Stok harus berupa angka positif']
            };
        }

        return this.updateBarang(id, { stok: stockValue });
    }

    /**
     * Bulk update kategori for selected barang
     * @param {Array<string>} ids - Array of barang IDs
     * @param {string} kategori_id - New kategori ID
     * @param {string} kategori_nama - New kategori name
     * @returns {Object} Bulk update result
     */
    bulkUpdateKategori(ids, kategori_id, kategori_nama) {
        const result = {
            success: 0,
            failed: 0,
            errors: []
        };

        ids.forEach(id => {
            const updateResult = this.updateBarang(id, { 
                kategori_id, 
                kategori_nama 
            });
            
            if (updateResult.success) {
                result.success++;
            } else {
                result.failed++;
                result.errors.push(`ID ${id}: ${updateResult.errors.join(', ')}`);
            }
        });

        return result;
    }

    /**
     * Bulk update satuan for selected barang
     * @param {Array<string>} ids - Array of barang IDs
     * @param {string} satuan_id - New satuan ID
     * @param {string} satuan_nama - New satuan name
     * @returns {Object} Bulk update result
     */
    bulkUpdateSatuan(ids, satuan_id, satuan_nama) {
        const result = {
            success: 0,
            failed: 0,
            errors: []
        };

        ids.forEach(id => {
            const updateResult = this.updateBarang(id, { 
                satuan_id, 
                satuan_nama 
            });
            
            if (updateResult.success) {
                result.success++;
            } else {
                result.failed++;
                result.errors.push(`ID ${id}: ${updateResult.errors.join(', ')}`);
            }
        });

        return result;
    }

    /**
     * Get statistics for dashboard
     * @returns {Object} Statistics object
     */
    getStatistics() {
        const allItems = this.getAll({ status: 'aktif' });
        const lowStockItems = this.getLowStockItems();
        
        return {
            total_barang: allItems.length,
            low_stock_count: lowStockItems.length,
            total_value: allItems.reduce((sum, item) => sum + (item.harga_beli * item.stok), 0),
            categories_count: new Set(allItems.map(item => item.kategori_id)).size,
            units_count: new Set(allItems.map(item => item.satuan_id)).size
        };
    }

    /**
     * Find barang by kode (for validation)
     * @param {string} kode - Barang kode
     * @returns {Object|null} Barang item or null
     */
    findByKode(kode) {
        return this.data.find(item => item.kode === kode.toUpperCase()) || null;
    }

    /**
     * Count barang by kategori (for validation)
     * @param {string} kategori_id - Kategori ID
     * @returns {number} Count of barang
     */
    countByKategori(kategori_id) {
        return this.data.filter(item => item.kategori_id === kategori_id).length;
    }

    /**
     * Count barang by satuan (for validation)
     * @param {string} satuan_id - Satuan ID
     * @returns {number} Count of barang
     */
    countBySatuan(satuan_id) {
        return this.data.filter(item => item.satuan_id === satuan_id).length;
    }

    /**
     * Find orphaned barang (with invalid kategori/satuan)
     * @returns {Array} Array of orphaned barang
     */
    findOrphanedBarang() {
        // This would need kategori and satuan managers to check
        // For now, return empty array
        return [];
    }

    /**
     * Validate import data
     * @param {Array} importData - Array of import data
     * @returns {Object} Validation result
     */
    validateImportData(importData) {
        const results = [];
        
        importData.forEach((row, index) => {
            const validation = this.validationEngine.validateImportRow(row, index);
            results.push(validation);
        });

        return this.validationEngine.getValidationSummary(results);
    }
}