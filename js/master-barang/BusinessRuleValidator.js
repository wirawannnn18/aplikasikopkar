/**
 * Master Barang Komprehensif - Business Rule Validator
 * Business logic validation for master barang system
 */

export class BusinessRuleValidator {
    constructor(barangManager, kategoriManager, satuanManager) {
        this.barangManager = barangManager;
        this.kategoriManager = kategoriManager;
        this.satuanManager = satuanManager;
    }

    /**
     * Validate barang business rules
     * @param {Object} data - Barang data
     * @param {string} excludeId - ID to exclude from duplicate check (for updates)
     * @returns {Object} Validation result
     */
    validateBarangBusinessRules(data, excludeId = null) {
        const errors = [];
        const warnings = [];

        // Check for duplicate kode
        if (data.kode) {
            const existing = this.barangManager.findByKode(data.kode);
            if (existing && existing.id !== excludeId) {
                errors.push(`Kode barang '${data.kode}' sudah digunakan`);
            }
        }

        // Validate kategori exists and is active
        if (data.kategori_id) {
            const kategori = this.kategoriManager.findById(data.kategori_id);
            if (!kategori) {
                errors.push('Kategori yang dipilih tidak ditemukan');
            } else if (kategori.status !== 'aktif') {
                errors.push('Kategori yang dipilih tidak aktif');
            }
        }

        // Validate satuan exists and is active
        if (data.satuan_id) {
            const satuan = this.satuanManager.findById(data.satuan_id);
            if (!satuan) {
                errors.push('Satuan yang dipilih tidak ditemukan');
            } else if (satuan.status !== 'aktif') {
                errors.push('Satuan yang dipilih tidak aktif');
            }
        }

        // Business logic validations
        if (data.harga_beli && data.harga_jual) {
            const margin = ((data.harga_jual - data.harga_beli) / data.harga_beli) * 100;
            
            if (data.harga_jual < data.harga_beli) {
                warnings.push('Harga jual lebih rendah dari harga beli');
            } else if (margin < 10) {
                warnings.push(`Margin keuntungan rendah (${margin.toFixed(1)}%)`);
            }
        }

        // Stock level warnings
        if (data.stok !== undefined && data.stok_minimum !== undefined) {
            if (data.stok === 0) {
                warnings.push('Barang habis (stok = 0)');
            } else if (data.stok <= data.stok_minimum && data.stok > 0) {
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
     * Validate kategori business rules
     * @param {Object} data - Kategori data
     * @param {string} excludeId - ID to exclude from duplicate check (for updates)
     * @returns {Object} Validation result
     */
    validateKategoriBusinessRules(data, excludeId = null) {
        const errors = [];
        const warnings = [];

        // Check for duplicate nama
        if (data.nama) {
            const existing = this.kategoriManager.findByNama(data.nama);
            if (existing && existing.id !== excludeId) {
                errors.push(`Nama kategori '${data.nama}' sudah digunakan`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validate satuan business rules
     * @param {Object} data - Satuan data
     * @param {string} excludeId - ID to exclude from duplicate check (for updates)
     * @returns {Object} Validation result
     */
    validateSatuanBusinessRules(data, excludeId = null) {
        const errors = [];
        const warnings = [];

        // Check for duplicate nama
        if (data.nama) {
            const existing = this.satuanManager.findByNama(data.nama);
            if (existing && existing.id !== excludeId) {
                errors.push(`Nama satuan '${data.nama}' sudah digunakan`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validate kategori deletion
     * @param {string} kategoriId - Kategori ID to delete
     * @returns {Object} Validation result
     */
    validateKategoriDeletion(kategoriId) {
        const errors = [];
        const warnings = [];

        // Check if kategori is used by any barang
        const barangCount = this.barangManager.countByKategori(kategoriId);
        if (barangCount > 0) {
            errors.push(`Kategori tidak dapat dihapus karena masih digunakan oleh ${barangCount} barang`);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validate satuan deletion
     * @param {string} satuanId - Satuan ID to delete
     * @returns {Object} Validation result
     */
    validateSatuanDeletion(satuanId) {
        const errors = [];
        const warnings = [];

        // Check if satuan is used by any barang
        const barangCount = this.barangManager.countBySatuan(satuanId);
        if (barangCount > 0) {
            errors.push(`Satuan tidak dapat dihapus karena masih digunakan oleh ${barangCount} barang`);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Validate bulk delete operation
     * @param {Array<string>} ids - Array of IDs to delete
     * @param {string} type - Type of items (barang, kategori, satuan)
     * @returns {Object} Validation result
     */
    validateBulkDelete(ids, type) {
        const errors = [];
        const warnings = [];

        if (!Array.isArray(ids) || ids.length === 0) {
            errors.push('Tidak ada item yang dipilih untuk dihapus');
            return { isValid: false, errors, warnings };
        }

        if (ids.length > 100) {
            errors.push('Maksimal 100 item dapat dihapus sekaligus');
        }

        // Type-specific validations
        switch (type) {
            case 'kategori':
                ids.forEach(id => {
                    const validation = this.validateKategoriDeletion(id);
                    errors.push(...validation.errors);
                    warnings.push(...validation.warnings);
                });
                break;

            case 'satuan':
                ids.forEach(id => {
                    const validation = this.validateSatuanDeletion(id);
                    errors.push(...validation.errors);
                    warnings.push(...validation.warnings);
                });
                break;

            case 'barang':
                // No special validation needed for barang deletion
                break;

            default:
                errors.push('Tipe item tidak valid untuk bulk delete');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validate bulk update operation
     * @param {Array<string>} ids - Array of IDs to update
     * @param {Object} updateData - Data to update
     * @param {string} type - Type of items
     * @returns {Object} Validation result
     */
    validateBulkUpdate(ids, updateData, type) {
        const errors = [];
        const warnings = [];

        if (!Array.isArray(ids) || ids.length === 0) {
            errors.push('Tidak ada item yang dipilih untuk diupdate');
            return { isValid: false, errors, warnings };
        }

        if (ids.length > 100) {
            errors.push('Maksimal 100 item dapat diupdate sekaligus');
        }

        // Validate update data based on type
        switch (type) {
            case 'barang_kategori':
                if (!updateData.kategori_id) {
                    errors.push('Kategori harus dipilih');
                } else {
                    const kategori = this.kategoriManager.findById(updateData.kategori_id);
                    if (!kategori) {
                        errors.push('Kategori yang dipilih tidak ditemukan');
                    } else if (kategori.status !== 'aktif') {
                        errors.push('Kategori yang dipilih tidak aktif');
                    }
                }
                break;

            case 'barang_satuan':
                if (!updateData.satuan_id) {
                    errors.push('Satuan harus dipilih');
                } else {
                    const satuan = this.satuanManager.findById(updateData.satuan_id);
                    if (!satuan) {
                        errors.push('Satuan yang dipilih tidak ditemukan');
                    } else if (satuan.status !== 'aktif') {
                        errors.push('Satuan yang dipilih tidak aktif');
                    }
                }
                break;

            case 'barang_harga':
                if (updateData.harga_beli !== undefined) {
                    const hargaBeli = Number(updateData.harga_beli);
                    if (isNaN(hargaBeli) || hargaBeli < 0) {
                        errors.push('Harga beli harus berupa angka positif');
                    }
                }
                
                if (updateData.harga_jual !== undefined) {
                    const hargaJual = Number(updateData.harga_jual);
                    if (isNaN(hargaJual) || hargaJual < 0) {
                        errors.push('Harga jual harus berupa angka positif');
                    }
                }

                // Check margin if both prices are provided
                if (updateData.harga_beli && updateData.harga_jual) {
                    if (updateData.harga_jual < updateData.harga_beli) {
                        warnings.push('Harga jual lebih rendah dari harga beli');
                    }
                }
                break;

            default:
                errors.push('Tipe update tidak valid');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validate import data business rules
     * @param {Array} importData - Array of import data
     * @returns {Object} Validation result
     */
    validateImportBusinessRules(importData) {
        const errors = [];
        const warnings = [];
        const duplicateKodes = new Set();
        const existingKodes = new Set();

        // Get all existing kodes
        const allBarang = this.barangManager.getAll();
        allBarang.forEach(barang => existingKodes.add(barang.kode.toLowerCase()));

        // Check for duplicates within import data
        const importKodes = new Set();
        importData.forEach((row, index) => {
            if (row.kode) {
                const kode = row.kode.toLowerCase();
                if (importKodes.has(kode)) {
                    duplicateKodes.add(kode);
                    errors.push(`Baris ${index + 1}: Kode '${row.kode}' duplikat dalam file import`);
                } else {
                    importKodes.add(kode);
                }

                // Check against existing data
                if (existingKodes.has(kode)) {
                    warnings.push(`Baris ${index + 1}: Kode '${row.kode}' sudah ada, akan diupdate`);
                }
            }
        });

        // Validate categories and units
        const availableKategori = new Set();
        const availableSatuan = new Set();
        
        this.kategoriManager.getActiveKategori().forEach(k => {
            availableKategori.add(k.nama.toLowerCase());
        });
        
        this.satuanManager.getActiveSatuan().forEach(s => {
            availableSatuan.add(s.nama.toLowerCase());
        });

        importData.forEach((row, index) => {
            if (row.kategori_nama && !availableKategori.has(row.kategori_nama.toLowerCase())) {
                warnings.push(`Baris ${index + 1}: Kategori '${row.kategori_nama}' tidak ditemukan, akan dibuat otomatis`);
            }
            
            if (row.satuan_nama && !availableSatuan.has(row.satuan_nama.toLowerCase())) {
                warnings.push(`Baris ${index + 1}: Satuan '${row.satuan_nama}' tidak ditemukan, akan dibuat otomatis`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            duplicateKodes: Array.from(duplicateKodes),
            newKategori: this.getNewCategories(importData, availableKategori),
            newSatuan: this.getNewUnits(importData, availableSatuan)
        };
    }

    /**
     * Get new categories from import data
     * @param {Array} importData - Import data
     * @param {Set} availableKategori - Available categories
     * @returns {Array} New categories
     */
    getNewCategories(importData, availableKategori) {
        const newKategori = new Set();
        
        importData.forEach(row => {
            if (row.kategori_nama && !availableKategori.has(row.kategori_nama.toLowerCase())) {
                newKategori.add(row.kategori_nama);
            }
        });
        
        return Array.from(newKategori);
    }

    /**
     * Get new units from import data
     * @param {Array} importData - Import data
     * @param {Set} availableSatuan - Available units
     * @returns {Array} New units
     */
    getNewUnits(importData, availableSatuan) {
        const newSatuan = new Set();
        
        importData.forEach(row => {
            if (row.satuan_nama && !availableSatuan.has(row.satuan_nama.toLowerCase())) {
                newSatuan.add(row.satuan_nama);
            }
        });
        
        return Array.from(newSatuan);
    }

    /**
     * Validate system constraints
     * @returns {Object} Validation result
     */
    validateSystemConstraints() {
        const errors = [];
        const warnings = [];

        // Check storage usage
        const stats = {
            barang: this.barangManager.getStatistics(),
            kategori: this.kategoriManager.getStatistics(),
            satuan: this.satuanManager.getStatistics()
        };

        // Warn if approaching limits
        if (stats.barang.total_barang > 8000) {
            warnings.push('Jumlah barang mendekati batas maksimal (10,000)');
        }

        if (stats.kategori.total_kategori > 80) {
            warnings.push('Jumlah kategori mendekati batas maksimal (100)');
        }

        if (stats.satuan.total_satuan > 80) {
            warnings.push('Jumlah satuan mendekati batas maksimal (100)');
        }

        // Check for orphaned data
        const orphanedBarang = this.barangManager.findOrphanedBarang();
        if (orphanedBarang.length > 0) {
            warnings.push(`${orphanedBarang.length} barang memiliki kategori/satuan yang tidak valid`);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            stats
        };
    }
}