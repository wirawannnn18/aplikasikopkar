/**
 * Master Barang Komprehensif - Kategori Manager
 * Manages CRUD operations for kategori data
 */

import { BaseManager } from './BaseManager.js';
import { STORAGE_KEYS, ERROR_MESSAGES } from './types.js';

export class KategoriManager extends BaseManager {
    constructor() {
        super(STORAGE_KEYS.KATEGORI);
        this.barangManager = null; // Will be injected to check dependencies
    }

    /**
     * Set barang manager for dependency checking
     * @param {BarangManager} barangManager - Barang manager instance
     */
    setBarangManager(barangManager) {
        this.barangManager = barangManager;
    }

    /**
     * Check if kategori name exists (case-insensitive)
     * @param {string} nama - Kategori name to check
     * @param {string|null} excludeId - ID to exclude from check
     * @returns {boolean} Whether name exists
     */
    existsByNama(nama, excludeId = null) {
        const trimmedNama = nama.trim().toLowerCase();
        return this.data.some(item => 
            item.nama.toLowerCase() === trimmedNama && 
            (excludeId ? item.id !== excludeId : true)
        );
    }

    /**
     * Validate kategori data
     * @param {Object} kategoriData - Kategori data to validate
     * @param {string|null} excludeId - ID to exclude from uniqueness check
     * @returns {Object} Validation result
     */
    validate(kategoriData, excludeId = null) {
        const errors = [];
        const warnings = [];

        // Validate nama (required, unique)
        if (!kategoriData.nama || !kategoriData.nama.trim()) {
            errors.push(ERROR_MESSAGES.REQUIRED_FIELD + ' (Nama Kategori)');
        } else {
            const trimmedNama = kategoriData.nama.trim();
            
            // Check length
            if (trimmedNama.length < 2 || trimmedNama.length > 50) {
                errors.push('Nama kategori harus 2-50 karakter');
            }

            // Check uniqueness (case-insensitive)
            if (this.existsByNama(trimmedNama, excludeId)) {
                errors.push(ERROR_MESSAGES.DUPLICATE_NAME + ' (Kategori)');
            }
        }

        // Validate deskripsi (optional, max length)
        if (kategoriData.deskripsi && kategoriData.deskripsi.length > 200) {
            errors.push('Deskripsi maksimal 200 karakter');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Create new kategori with validation
     * @param {Object} kategoriData - Kategori data
     * @returns {Object} Result with created item or errors
     */
    createKategori(kategoriData) {
        const validation = this.validate(kategoriData);
        
        if (!validation.isValid) {
            return {
                success: false,
                errors: validation.errors,
                warnings: validation.warnings
            };
        }

        // Normalize data
        const normalizedData = {
            ...kategoriData,
            nama: kategoriData.nama ? kategoriData.nama.trim() : '',
            deskripsi: kategoriData.deskripsi ? kategoriData.deskripsi.trim() : ''
        };

        const createdItem = this.create(normalizedData);

        return {
            success: true,
            data: createdItem,
            warnings: validation.warnings
        };
    }

    /**
     * Update existing kategori with validation
     * @param {string} id - Kategori ID
     * @param {Object} updateData - Update data
     * @returns {Object} Result with updated item or errors
     */
    updateKategori(id, updateData) {
        const existingItem = this.findById(id);
        if (!existingItem) {
            return {
                success: false,
                errors: ['Kategori tidak ditemukan']
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
            nama: updateData.nama ? updateData.nama.trim() : existingItem.nama,
            deskripsi: updateData.deskripsi !== undefined ? updateData.deskripsi.trim() : existingItem.deskripsi
        };

        const updatedItem = this.update(id, normalizedData);

        // If kategori name changed, update denormalized data in barang
        if (this.barangManager && updateData.nama && updateData.nama !== existingItem.nama) {
            this.updateBarangKategoriName(id, normalizedData.nama);
        }

        return {
            success: true,
            data: updatedItem,
            warnings: validation.warnings
        };
    }

    /**
     * Delete kategori with dependency check
     * @param {string} id - Kategori ID
     * @returns {Object} Delete result
     */
    deleteKategori(id) {
        const existingItem = this.findById(id);
        if (!existingItem) {
            return {
                success: false,
                errors: ['Kategori tidak ditemukan']
            };
        }

        // Check if kategori is used by any barang
        if (this.barangManager) {
            const barangUsingKategori = this.barangManager.getByKategori(id);
            if (barangUsingKategori.length > 0) {
                return {
                    success: false,
                    errors: [ERROR_MESSAGES.CATEGORY_IN_USE],
                    details: {
                        barang_count: barangUsingKategori.length,
                        barang_list: barangUsingKategori.map(b => ({ id: b.id, nama: b.nama, kode: b.kode }))
                    }
                };
            }
        }

        const deleted = this.delete(id);
        
        return {
            success: deleted,
            errors: deleted ? [] : ['Gagal menghapus kategori']
        };
    }

    /**
     * Update kategori name in barang data (denormalized)
     * @param {string} kategori_id - Kategori ID
     * @param {string} newName - New kategori name
     */
    updateBarangKategoriName(kategori_id, newName) {
        if (!this.barangManager) return;

        const barangItems = this.barangManager.getByKategori(kategori_id);
        barangItems.forEach(barang => {
            this.barangManager.update(barang.id, { kategori_nama: newName });
        });
    }

    /**
     * Get active kategori for dropdown
     * @returns {Array} Array of active kategori
     */
    getActiveKategori() {
        return this.getAll({ status: 'aktif' }).sort((a, b) => a.nama.localeCompare(b.nama));
    }

    /**
     * Get kategori with barang count
     * @returns {Array} Array of kategori with barang count
     */
    getKategoriWithCount() {
        const kategoriList = this.getAll();
        
        return kategoriList.map(kategori => {
            const barangCount = this.barangManager ? 
                this.barangManager.getByKategori(kategori.id).length : 0;
            
            return {
                ...kategori,
                barang_count: barangCount
            };
        });
    }

    /**
     * Search kategori
     * @param {Object} searchOptions - Search options
     * @returns {Object} Paginated search results
     */
    searchKategori(searchOptions = {}) {
        return this.getPaginated(searchOptions);
    }

    /**
     * Get kategori by name
     * @param {string} nama - Kategori name
     * @returns {Object|null} Kategori item or null
     */
    getByNama(nama) {
        return this.data.find(item => item.nama.toLowerCase() === nama.toLowerCase()) || null;
    }

    /**
     * Bulk activate/deactivate kategori
     * @param {Array<string>} ids - Array of kategori IDs
     * @param {'aktif'|'nonaktif'} status - New status
     * @returns {Object} Bulk update result
     */
    bulkUpdateStatus(ids, status) {
        const result = {
            success: 0,
            failed: 0,
            errors: []
        };

        ids.forEach(id => {
            const updateResult = this.updateKategori(id, { status });
            
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
     * Get statistics for kategori
     * @returns {Object} Statistics object
     */
    getStatistics() {
        const allKategori = this.getAll();
        const activeKategori = this.getAll({ status: 'aktif' });
        
        return {
            total_kategori: allKategori.length,
            active_kategori: activeKategori.length,
            inactive_kategori: allKategori.length - activeKategori.length
        };
    }

    /**
     * Import kategori from array with auto-creation
     * @param {Array} kategoriNames - Array of kategori names
     * @returns {Object} Import result with created kategori
     */
    importKategoriNames(kategoriNames) {
        const result = {
            created: [],
            existing: [],
            errors: []
        };

        kategoriNames.forEach(nama => {
            if (!nama || typeof nama !== 'string') {
                result.errors.push(`Invalid kategori name: ${nama}`);
                return;
            }

            const trimmedName = nama.trim();
            const existing = this.getByNama(trimmedName);
            
            if (existing) {
                result.existing.push(existing);
            } else {
                const createResult = this.createKategori({
                    nama: trimmedName,
                    deskripsi: `Auto-created from import`
                });
                
                if (createResult.success) {
                    result.created.push(createResult.data);
                } else {
                    result.errors.push(`Failed to create kategori "${trimmedName}": ${createResult.errors.join(', ')}`);
                }
            }
        });

        return result;
    }
}