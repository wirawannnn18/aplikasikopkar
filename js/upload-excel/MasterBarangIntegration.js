/**
 * Master Barang Integration Layer
 * Connects the new Excel upload system with existing master barang data storage
 */

import ExcelUploadManager from './ExcelUploadManager.js';
import AuditLogger from './AuditLogger.js';

class MasterBarangIntegration {
    constructor() {
        this.storageKey = 'masterBarang';
        this.categoriesKey = 'masterBarangCategories';
        this.unitsKey = 'masterBarangUnits';
        this.auditLogger = new AuditLogger();
        
        this.init();
    }

    init() {
        this.ensureDataStructure();
    }

    /**
     * Ensure existing data structure compatibility
     */
    ensureDataStructure() {
        // Migrate old data format if needed
        const existingData = this.getExistingMasterBarang();
        if (existingData.length > 0) {
            const migratedData = existingData.map(item => this.normalizeBarangData(item));
            this.saveMasterBarang(migratedData);
        }
    }

    /**
     * Normalize barang data to ensure consistent structure
     * @param {Object} item - Raw barang item
     * @returns {Object} Normalized barang item
     */
    normalizeBarangData(item) {
        return {
            kode: item.kode || item.id || '',
            nama: item.nama || item.name || '',
            kategori: (item.kategori || item.category || '').toLowerCase(),
            satuan: (item.satuan || item.unit || '').toLowerCase(),
            harga_beli: parseFloat(item.harga_beli || item.hargaBeli || item.buyPrice || 0),
            stok: parseInt(item.stok || item.stock || 0),
            supplier: item.supplier || '',
            created_at: item.created_at || item.tanggalBuat || new Date().toISOString(),
            updated_at: item.updated_at || item.tanggalUpdate || new Date().toISOString()
        };
    }

    /**
     * Get existing master barang data
     * @returns {Array} Array of barang items
     */
    getExistingMasterBarang() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading master barang:', error);
            return [];
        }
    }

    /**
     * Save master barang data
     * @param {Array} data - Array of barang items
     */
    saveMasterBarang(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving master barang:', error);
            throw new Error('Failed to save master barang data');
        }
    }

    /**
     * Get existing categories
     * @returns {Array} Array of category names
     */
    getExistingCategories() {
        try {
            const stored = localStorage.getItem(this.categoriesKey);
            return stored ? JSON.parse(stored) : [
                'makanan', 'minuman', 'alat-tulis', 'elektronik', 'kebersihan', 'lainnya'
            ];
        } catch (error) {
            console.error('Error loading categories:', error);
            return [];
        }
    }

    /**
     * Save categories
     * @param {Array} categories - Array of category names
     */
    saveCategories(categories) {
        try {
            localStorage.setItem(this.categoriesKey, JSON.stringify(categories));
        } catch (error) {
            console.error('Error saving categories:', error);
        }
    }

    /**
     * Get existing units
     * @returns {Array} Array of unit names
     */
    getExistingUnits() {
        try {
            const stored = localStorage.getItem(this.unitsKey);
            return stored ? JSON.parse(stored) : [
                'pcs', 'kg', 'gram', 'liter', 'ml', 'box', 'pack', 'botol', 'kaleng', 'meter'
            ];
        } catch (error) {
            console.error('Error loading units:', error);
            return [];
        }
    }

    /**
     * Save units
     * @param {Array} units - Array of unit names
     */
    saveUnits(units) {
        try {
            localStorage.setItem(this.unitsKey, JSON.stringify(units));
        } catch (error) {
            console.error('Error saving units:', error);
        }
    }

    /**
     * Check if barang code exists
     * @param {string} kode - Barang code to check
     * @returns {boolean} True if exists
     */
    barangExists(kode) {
        const existingData = this.getExistingMasterBarang();
        return existingData.some(item => item.kode === kode);
    }

    /**
     * Get barang by code
     * @param {string} kode - Barang code
     * @returns {Object|null} Barang item or null if not found
     */
    getBarangByCode(kode) {
        const existingData = this.getExistingMasterBarang();
        return existingData.find(item => item.kode === kode) || null;
    }

    /**
     * Add or update barang item
     * @param {Object} barangData - Barang data to add/update
     * @param {string} sessionId - Upload session ID for audit
     * @returns {Object} Result with action taken
     */
    addOrUpdateBarang(barangData, sessionId) {
        const normalizedData = this.normalizeBarangData(barangData);
        const existingData = this.getExistingMasterBarang();
        const existingIndex = existingData.findIndex(item => item.kode === normalizedData.kode);
        
        let action = 'created';
        let oldData = null;

        if (existingIndex >= 0) {
            // Update existing item
            oldData = { ...existingData[existingIndex] };
            existingData[existingIndex] = {
                ...existingData[existingIndex],
                ...normalizedData,
                updated_at: new Date().toISOString()
            };
            action = 'updated';
        } else {
            // Add new item
            normalizedData.created_at = new Date().toISOString();
            normalizedData.updated_at = new Date().toISOString();
            existingData.push(normalizedData);
        }

        // Save updated data
        this.saveMasterBarang(existingData);

        // Log the change
        this.auditLogger.logDataChanges(sessionId, oldData, normalizedData);

        return {
            action,
            data: normalizedData,
            oldData
        };
    }

    /**
     * Bulk import barang data
     * @param {Array} barangList - Array of barang data
     * @param {string} sessionId - Upload session ID for audit
     * @returns {Object} Import results
     */
    bulkImportBarang(barangList, sessionId) {
        const results = {
            created: 0,
            updated: 0,
            failed: 0,
            totalProcessed: 0,
            failedItems: []
        };

        const startTime = Date.now();

        barangList.forEach((barangData, index) => {
            try {
                const result = this.addOrUpdateBarang(barangData, sessionId);
                
                if (result.action === 'created') {
                    results.created++;
                } else if (result.action === 'updated') {
                    results.updated++;
                }
                
                results.totalProcessed++;
            } catch (error) {
                results.failed++;
                results.failedItems.push({
                    index,
                    data: barangData,
                    error: error.message
                });
                
                // Log the error
                this.auditLogger.logError(sessionId, error, {
                    severity: 'error',
                    recoverable: true,
                    rowNumber: index + 1,
                    operation: 'bulk_import',
                    barangCode: barangData.kode
                });
            }
        });

        const duration = Date.now() - startTime;
        results.duration = duration;

        // Log import completion
        this.auditLogger.logImportComplete(sessionId, results);

        return results;
    }

    /**
     * Add category if not exists
     * @param {string} categoryName - Category name to add
     * @returns {boolean} True if added, false if already exists
     */
    addCategoryIfNotExists(categoryName) {
        const normalizedName = categoryName.toLowerCase().trim();
        const categories = this.getExistingCategories();
        
        if (!categories.includes(normalizedName)) {
            categories.push(normalizedName);
            this.saveCategories(categories);
            return true;
        }
        
        return false;
    }

    /**
     * Add unit if not exists
     * @param {string} unitName - Unit name to add
     * @returns {boolean} True if added, false if already exists
     */
    addUnitIfNotExists(unitName) {
        const normalizedName = unitName.toLowerCase().trim();
        const units = this.getExistingUnits();
        
        if (!units.includes(normalizedName)) {
            units.push(normalizedName);
            this.saveUnits(units);
            return true;
        }
        
        return false;
    }

    /**
     * Validate barang data against existing data
     * @param {Array} barangList - Array of barang data to validate
     * @returns {Object} Validation results
     */
    validateAgainstExistingData(barangList) {
        const existingData = this.getExistingMasterBarang();
        const existingCodes = new Set(existingData.map(item => item.kode));
        const categories = this.getExistingCategories();
        const units = this.getExistingUnits();
        
        const validationResults = {
            duplicates: [],
            existingItems: [],
            newCategories: [],
            newUnits: [],
            conflicts: []
        };

        const uploadCodes = new Set();

        barangList.forEach((item, index) => {
            const normalizedItem = this.normalizeBarangData(item);
            
            // Check for duplicates within upload
            if (uploadCodes.has(normalizedItem.kode)) {
                validationResults.duplicates.push({
                    index,
                    kode: normalizedItem.kode,
                    message: 'Duplicate code in upload file'
                });
            } else {
                uploadCodes.add(normalizedItem.kode);
            }
            
            // Check for existing items
            if (existingCodes.has(normalizedItem.kode)) {
                const existingItem = existingData.find(e => e.kode === normalizedItem.kode);
                validationResults.existingItems.push({
                    index,
                    kode: normalizedItem.kode,
                    existingData: existingItem,
                    newData: normalizedItem
                });
            }
            
            // Check for new categories
            if (!categories.includes(normalizedItem.kategori)) {
                if (!validationResults.newCategories.some(c => c.name === normalizedItem.kategori)) {
                    validationResults.newCategories.push({
                        name: normalizedItem.kategori,
                        firstSeenAt: index
                    });
                }
            }
            
            // Check for new units
            if (!units.includes(normalizedItem.satuan)) {
                if (!validationResults.newUnits.some(u => u.name === normalizedItem.satuan)) {
                    validationResults.newUnits.push({
                        name: normalizedItem.satuan,
                        firstSeenAt: index
                    });
                }
            }
        });

        return validationResults;
    }

    /**
     * Get data statistics
     * @returns {Object} Statistics about master barang data
     */
    getDataStatistics() {
        const barangData = this.getExistingMasterBarang();
        const categories = this.getExistingCategories();
        const units = this.getExistingUnits();
        
        const categoryStats = {};
        const unitStats = {};
        let totalValue = 0;
        let totalStock = 0;

        barangData.forEach(item => {
            // Category statistics
            categoryStats[item.kategori] = (categoryStats[item.kategori] || 0) + 1;
            
            // Unit statistics
            unitStats[item.satuan] = (unitStats[item.satuan] || 0) + 1;
            
            // Value and stock totals
            totalValue += (item.harga_beli || 0) * (item.stok || 0);
            totalStock += item.stok || 0;
        });

        return {
            totalItems: barangData.length,
            totalCategories: categories.length,
            totalUnits: units.length,
            totalValue,
            totalStock,
            categoryDistribution: categoryStats,
            unitDistribution: unitStats,
            lastUpdated: barangData.length > 0 ? 
                Math.max(...barangData.map(item => new Date(item.updated_at || item.created_at).getTime())) : 
                null
        };
    }

    /**
     * Export master barang data
     * @param {string} format - Export format (json, csv)
     * @returns {string} Exported data
     */
    exportMasterBarang(format = 'json') {
        const data = this.getExistingMasterBarang();
        
        if (format === 'csv') {
            const headers = ['kode', 'nama', 'kategori', 'satuan', 'harga_beli', 'stok', 'supplier', 'created_at', 'updated_at'];
            const csvRows = [headers.join(',')];
            
            data.forEach(item => {
                const row = headers.map(header => {
                    const value = item[header] || '';
                    // Escape CSV values
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                });
                csvRows.push(row.join(','));
            });
            
            return csvRows.join('\n');
        } else {
            return JSON.stringify(data, null, 2);
        }
    }

    /**
     * Clear all master barang data (use with caution)
     * @param {boolean} confirm - Confirmation flag
     */
    clearAllData(confirm = false) {
        if (!confirm) {
            throw new Error('Data clearing requires explicit confirmation');
        }

        const sessionId = 'system_clear_' + Date.now();
        const existingData = this.getExistingMasterBarang();
        
        // Log the clearing action
        this.auditLogger.logError(sessionId, new Error('Master barang data cleared'), {
            severity: 'warning',
            recoverable: false,
            operation: 'clear_all_data',
            itemsCleared: existingData.length
        });

        // Clear the data
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.categoriesKey);
        localStorage.removeItem(this.unitsKey);
    }

    /**
     * Backup master barang data
     * @returns {Object} Backup data
     */
    createBackup() {
        return {
            timestamp: new Date().toISOString(),
            masterBarang: this.getExistingMasterBarang(),
            categories: this.getExistingCategories(),
            units: this.getExistingUnits(),
            statistics: this.getDataStatistics()
        };
    }

    /**
     * Restore from backup
     * @param {Object} backupData - Backup data to restore
     * @param {string} sessionId - Session ID for audit
     */
    restoreFromBackup(backupData, sessionId) {
        if (!backupData || !backupData.masterBarang) {
            throw new Error('Invalid backup data');
        }

        // Save current data for rollback
        const currentBackup = this.createBackup();
        
        try {
            // Restore data
            this.saveMasterBarang(backupData.masterBarang);
            if (backupData.categories) {
                this.saveCategories(backupData.categories);
            }
            if (backupData.units) {
                this.saveUnits(backupData.units);
            }

            // Log the restore
            this.auditLogger.logDataChanges(sessionId, currentBackup, backupData);
            
        } catch (error) {
            // Rollback on error
            this.saveMasterBarang(currentBackup.masterBarang);
            this.saveCategories(currentBackup.categories);
            this.saveUnits(currentBackup.units);
            
            throw new Error('Restore failed: ' + error.message);
        }
    }
}

export default MasterBarangIntegration;