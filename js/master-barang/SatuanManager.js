/**
 * Master Barang Komprehensif - Satuan Manager
 * Manages CRUD operations for satuan data
 */

import { BaseManager } from './BaseManager.js';
import { STORAGE_KEYS, ERROR_MESSAGES } from './types.js';

export class SatuanManager extends BaseManager {
    constructor() {
        super(STORAGE_KEYS.SATUAN);
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
     * Validate satuan data
     * @param {Object} satuanData - Satuan data to validate
     * @param {string|null} excludeId - ID to exclude from uniqueness check
     * @param {boolean} isUpdate - Whether this is an update operation
     * @returns {Object} Validation result
     */
    validate(satuanData, excludeId = null, isUpdate = false) {
        const errors = [];
        const warnings = [];

        // Validate nama (required for create, optional for update)
        if (satuanData.hasOwnProperty('nama')) {
            if (!satuanData.nama) {
                errors.push(ERROR_MESSAGES.REQUIRED_FIELD + ' (Nama Satuan)');
            } else {
                const trimmedNama = satuanData.nama.trim();
                
                // Check length
                if (trimmedNama.length < 1 || trimmedNama.length > 20) {
                    errors.push('Nama satuan harus 1-20 karakter');
                }

                // Check uniqueness (normalize to uppercase for comparison)
                const normalizedNama = trimmedNama.toUpperCase();
                const existingUnit = this.data.find(item => 
                    item.nama.toUpperCase() === normalizedNama && 
                    (excludeId ? item.id !== excludeId : true)
                );
                
                if (existingUnit) {
                    errors.push(ERROR_MESSAGES.DUPLICATE_NAME + ' (Satuan)');
                }
            }
        } else if (!isUpdate) {
            // nama is required for create operations
            errors.push(ERROR_MESSAGES.REQUIRED_FIELD + ' (Nama Satuan)');
        }

        // Validate deskripsi (optional, max length)
        if (satuanData.deskripsi && satuanData.deskripsi.length > 100) {
            errors.push('Deskripsi maksimal 100 karakter');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Create new satuan with validation
     * @param {Object} satuanData - Satuan data
     * @returns {Object} Result with created item or errors
     */
    createSatuan(satuanData) {
        const validation = this.validate(satuanData);
        
        if (!validation.isValid) {
            return {
                success: false,
                errors: validation.errors,
                warnings: validation.warnings
            };
        }

        // Normalize data
        const normalizedData = {
            ...satuanData,
            nama: satuanData.nama.trim().toUpperCase(), // Satuan usually in uppercase (PCS, KG, etc.)
            deskripsi: satuanData.deskripsi ? satuanData.deskripsi.trim() : ''
        };

        const createdItem = this.create(normalizedData);

        return {
            success: true,
            data: createdItem,
            warnings: validation.warnings
        };
    }

    /**
     * Update existing satuan with validation
     * @param {string} id - Satuan ID
     * @param {Object} updateData - Update data
     * @returns {Object} Result with updated item or errors
     */
    updateSatuan(id, updateData) {
        const existingItem = this.findById(id);
        if (!existingItem) {
            return {
                success: false,
                errors: ['Satuan tidak ditemukan']
            };
        }

        const validation = this.validate(updateData, id, true);
        
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
            nama: updateData.nama ? updateData.nama.trim().toUpperCase() : existingItem.nama,
            deskripsi: updateData.deskripsi !== undefined ? updateData.deskripsi.trim() : existingItem.deskripsi
        };

        const updatedItem = this.update(id, normalizedData);

        // If satuan name changed, update denormalized data in barang
        if (this.barangManager && updateData.nama && updateData.nama !== existingItem.nama) {
            this.updateBarangSatuanName(id, normalizedData.nama);
        }

        return {
            success: true,
            data: updatedItem,
            warnings: validation.warnings
        };
    }

    /**
     * Delete satuan with dependency check
     * @param {string} id - Satuan ID
     * @returns {Object} Delete result
     */
    deleteSatuan(id) {
        const existingItem = this.findById(id);
        if (!existingItem) {
            return {
                success: false,
                errors: ['Satuan tidak ditemukan']
            };
        }

        // Check if satuan is used by any barang
        if (this.barangManager) {
            const barangUsingSatuan = this.barangManager.getBySatuan(id);
            if (barangUsingSatuan.length > 0) {
                return {
                    success: false,
                    errors: [ERROR_MESSAGES.UNIT_IN_USE],
                    details: {
                        barang_count: barangUsingSatuan.length,
                        barang_list: barangUsingSatuan.map(b => ({ id: b.id, nama: b.nama, kode: b.kode }))
                    }
                };
            }
        }

        const deleted = this.delete(id);
        
        return {
            success: deleted,
            errors: deleted ? [] : ['Gagal menghapus satuan']
        };
    }

    /**
     * Update satuan name in barang data (denormalized)
     * @param {string} satuan_id - Satuan ID
     * @param {string} newName - New satuan name
     */
    updateBarangSatuanName(satuan_id, newName) {
        if (!this.barangManager) return;

        const barangItems = this.barangManager.getBySatuan(satuan_id);
        barangItems.forEach(barang => {
            this.barangManager.update(barang.id, { satuan_nama: newName });
        });
    }

    /**
     * Get active satuan for dropdown
     * @returns {Array} Array of active satuan
     */
    getActiveSatuan() {
        return this.getAll({ status: 'aktif' }).sort((a, b) => a.nama.localeCompare(b.nama));
    }

    /**
     * Get satuan with barang count
     * @returns {Array} Array of satuan with barang count
     */
    getSatuanWithCount() {
        const satuanList = this.getAll();
        
        return satuanList.map(satuan => {
            const barangCount = this.barangManager ? 
                this.barangManager.getBySatuan(satuan.id).length : 0;
            
            return {
                ...satuan,
                barang_count: barangCount
            };
        });
    }

    /**
     * Search satuan
     * @param {Object} searchOptions - Search options
     * @returns {Object} Paginated search results
     */
    searchSatuan(searchOptions = {}) {
        return this.getPaginated(searchOptions);
    }

    /**
     * Get satuan by name
     * @param {string} nama - Satuan name
     * @returns {Object|null} Satuan item or null
     */
    getByNama(nama) {
        return this.data.find(item => item.nama.toLowerCase() === nama.toLowerCase()) || null;
    }

    /**
     * Bulk activate/deactivate satuan
     * @param {Array<string>} ids - Array of satuan IDs
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
            const updateResult = this.updateSatuan(id, { status });
            
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
     * Get statistics for satuan
     * @returns {Object} Statistics object
     */
    getStatistics() {
        const allSatuan = this.getAll();
        const activeSatuan = this.getAll({ status: 'aktif' });
        
        return {
            total_satuan: allSatuan.length,
            active_satuan: activeSatuan.length,
            inactive_satuan: allSatuan.length - activeSatuan.length
        };
    }

    /**
     * Import satuan from array with auto-creation
     * @param {Array} satuanNames - Array of satuan names
     * @returns {Object} Import result with created satuan
     */
    importSatuanNames(satuanNames) {
        const result = {
            created: [],
            existing: [],
            errors: []
        };

        satuanNames.forEach(nama => {
            if (!nama || typeof nama !== 'string') {
                result.errors.push(`Invalid satuan name: ${nama}`);
                return;
            }

            const trimmedName = nama.trim().toUpperCase();
            const existing = this.getByNama(trimmedName);
            
            if (existing) {
                result.existing.push(existing);
            } else {
                const createResult = this.createSatuan({
                    nama: trimmedName,
                    deskripsi: `Auto-created from import`
                });
                
                if (createResult.success) {
                    result.created.push(createResult.data);
                } else {
                    result.errors.push(`Failed to create satuan "${trimmedName}": ${createResult.errors.join(', ')}`);
                }
            }
        });

        return result;
    }

    /**
     * Get common satuan suggestions
     * @returns {Array} Array of common satuan names
     */
    getCommonSatuanSuggestions() {
        return [
            'PCS', 'UNIT', 'BUAH', 'BIJI',
            'DUS', 'BOX', 'KARTON', 'PACK',
            'KG', 'GRAM', 'TON', 'OUNCE',
            'LITER', 'ML', 'GALLON',
            'METER', 'CM', 'MM', 'INCH',
            'SET', 'PASANG', 'LUSIN', 'GROSS'
        ];
    }

    /**
     * Initialize default satuan if empty
     * @returns {Object} Initialization result
     */
    initializeDefaultSatuan() {
        if (this.getCount() > 0) {
            return { success: true, message: 'Satuan already exists' };
        }

        const defaultSatuan = [
            { nama: 'PCS', deskripsi: 'Pieces - Satuan per buah' },
            { nama: 'DUS', deskripsi: 'Dus - Satuan per dus/kotak' },
            { nama: 'KG', deskripsi: 'Kilogram - Satuan berat' },
            { nama: 'LITER', deskripsi: 'Liter - Satuan volume' },
            { nama: 'METER', deskripsi: 'Meter - Satuan panjang' }
        ];

        const result = {
            created: 0,
            errors: []
        };

        defaultSatuan.forEach(satuan => {
            const createResult = this.createSatuan(satuan);
            if (createResult.success) {
                result.created++;
            } else {
                result.errors.push(`Failed to create ${satuan.nama}: ${createResult.errors.join(', ')}`);
            }
        });

        return {
            success: result.errors.length === 0,
            created: result.created,
            errors: result.errors
        };
    }
}