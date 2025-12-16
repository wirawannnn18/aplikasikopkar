/**
 * Master Barang Komprehensif - Main System Controller
 * Coordinates all managers and provides unified interface
 */

import { BarangManager } from './BarangManager.js';
import { KategoriManager } from './KategoriManager.js';
import { SatuanManager } from './SatuanManager.js';
import { AuditLogger } from './AuditLogger.js';
import { BusinessRuleValidator } from './BusinessRuleValidator.js';

export class MasterBarangSystem {
    constructor() {
        // Initialize managers
        this.barangManager = new BarangManager();
        this.kategoriManager = new KategoriManager();
        this.satuanManager = new SatuanManager();
        this.auditLogger = new AuditLogger();

        // Initialize business rule validator
        this.businessRuleValidator = new BusinessRuleValidator(
            this.barangManager,
            this.kategoriManager,
            this.satuanManager
        );

        // Set up dependencies
        this.kategoriManager.setBarangManager(this.barangManager);
        this.satuanManager.setBarangManager(this.barangManager);
        this.barangManager.setBusinessRuleValidator(this.businessRuleValidator);

        // Initialize system
        this.initialize();
    }

    /**
     * Initialize the system
     */
    initialize() {
        // Initialize default data if needed
        this.satuanManager.initializeDefaultSatuan();
        
        console.log('Master Barang System initialized');
    }

    // ===== BARANG OPERATIONS =====

    /**
     * Create new barang with audit logging
     * @param {Object} barangData - Barang data
     * @returns {Object} Result with created item or errors
     */
    createBarang(barangData) {
        const result = this.barangManager.createBarang(barangData);
        
        if (result.success) {
            this.auditLogger.logCreate('barang', result.data.id, result.data);
        }
        
        return result;
    }

    /**
     * Update barang with audit logging
     * @param {string} id - Barang ID
     * @param {Object} updateData - Update data
     * @returns {Object} Result with updated item or errors
     */
    updateBarang(id, updateData) {
        const oldData = this.barangManager.findById(id);
        const result = this.barangManager.updateBarang(id, updateData);
        
        if (result.success) {
            this.auditLogger.logUpdate('barang', id, oldData, result.data);
        }
        
        return result;
    }

    /**
     * Delete barang with audit logging
     * @param {string} id - Barang ID
     * @returns {Object} Delete result
     */
    deleteBarang(id) {
        const oldData = this.barangManager.findById(id);
        const success = this.barangManager.delete(id);
        
        if (success) {
            this.auditLogger.logDelete('barang', id, oldData);
        }
        
        return {
            success,
            errors: success ? [] : ['Gagal menghapus barang']
        };
    }

    /**
     * Search barang
     * @param {Object} searchOptions - Search options
     * @returns {Object} Paginated search results
     */
    searchBarang(searchOptions = {}) {
        return this.barangManager.searchBarang(searchOptions);
    }

    /**
     * Get barang by ID
     * @param {string} id - Barang ID
     * @returns {Object|null} Barang item or null
     */
    getBarangById(id) {
        return this.barangManager.findById(id);
    }

    // ===== KATEGORI OPERATIONS =====

    /**
     * Create new kategori with audit logging
     * @param {Object} kategoriData - Kategori data
     * @returns {Object} Result with created item or errors
     */
    createKategori(kategoriData) {
        const result = this.kategoriManager.createKategori(kategoriData);
        
        if (result.success) {
            this.auditLogger.logCreate('kategori', result.data.id, result.data);
        }
        
        return result;
    }

    /**
     * Update kategori with audit logging
     * @param {string} id - Kategori ID
     * @param {Object} updateData - Update data
     * @returns {Object} Result with updated item or errors
     */
    updateKategori(id, updateData) {
        const oldData = this.kategoriManager.findById(id);
        const result = this.kategoriManager.updateKategori(id, updateData);
        
        if (result.success) {
            this.auditLogger.logUpdate('kategori', id, oldData, result.data);
        }
        
        return result;
    }

    /**
     * Delete kategori with audit logging
     * @param {string} id - Kategori ID
     * @returns {Object} Delete result
     */
    deleteKategori(id) {
        const oldData = this.kategoriManager.findById(id);
        const result = this.kategoriManager.deleteKategori(id);
        
        if (result.success) {
            this.auditLogger.logDelete('kategori', id, oldData);
        }
        
        return result;
    }

    /**
     * Get active kategori for dropdown
     * @returns {Array} Array of active kategori
     */
    getActiveKategori() {
        return this.kategoriManager.getActiveKategori();
    }

    /**
     * Search kategori
     * @param {Object} searchOptions - Search options
     * @returns {Object} Paginated search results
     */
    searchKategori(searchOptions = {}) {
        return this.kategoriManager.searchKategori(searchOptions);
    }

    // ===== SATUAN OPERATIONS =====

    /**
     * Create new satuan with audit logging
     * @param {Object} satuanData - Satuan data
     * @returns {Object} Result with created item or errors
     */
    createSatuan(satuanData) {
        const result = this.satuanManager.createSatuan(satuanData);
        
        if (result.success) {
            this.auditLogger.logCreate('satuan', result.data.id, result.data);
        }
        
        return result;
    }

    /**
     * Update satuan with audit logging
     * @param {string} id - Satuan ID
     * @param {Object} updateData - Update data
     * @returns {Object} Result with updated item or errors
     */
    updateSatuan(id, updateData) {
        const oldData = this.satuanManager.findById(id);
        const result = this.satuanManager.updateSatuan(id, updateData);
        
        if (result.success) {
            this.auditLogger.logUpdate('satuan', id, oldData, result.data);
        }
        
        return result;
    }

    /**
     * Delete satuan with audit logging
     * @param {string} id - Satuan ID
     * @returns {Object} Delete result
     */
    deleteSatuan(id) {
        const oldData = this.satuanManager.findById(id);
        const result = this.satuanManager.deleteSatuan(id);
        
        if (result.success) {
            this.auditLogger.logDelete('satuan', id, oldData);
        }
        
        return result;
    }

    /**
     * Get active satuan for dropdown
     * @returns {Array} Array of active satuan
     */
    getActiveSatuan() {
        return this.satuanManager.getActiveSatuan();
    }

    /**
     * Search satuan
     * @param {Object} searchOptions - Search options
     * @returns {Object} Paginated search results
     */
    searchSatuan(searchOptions = {}) {
        return this.satuanManager.searchSatuan(searchOptions);
    }

    // ===== BULK OPERATIONS =====

    /**
     * Bulk delete barang with audit logging
     * @param {Array<string>} ids - Array of barang IDs
     * @returns {Object} Bulk delete result
     */
    bulkDeleteBarang(ids) {
        const result = this.barangManager.bulkDelete(ids);
        
        this.auditLogger.logBulkOperation('barang', {
            operationType: 'bulk_delete',
            affectedRecords: ids,
            successCount: result.success,
            failedCount: result.failed,
            errors: result.errors
        });
        
        return result;
    }

    /**
     * Bulk update kategori for barang with audit logging
     * @param {Array<string>} ids - Array of barang IDs
     * @param {string} kategori_id - New kategori ID
     * @param {string} kategori_nama - New kategori name
     * @returns {Object} Bulk update result
     */
    bulkUpdateBarangKategori(ids, kategori_id, kategori_nama) {
        const result = this.barangManager.bulkUpdateKategori(ids, kategori_id, kategori_nama);
        
        this.auditLogger.logBulkOperation('barang', {
            operationType: 'bulk_update_kategori',
            affectedRecords: ids,
            successCount: result.success,
            failedCount: result.failed,
            errors: result.errors,
            updateData: { kategori_id, kategori_nama }
        });
        
        return result;
    }

    /**
     * Bulk update satuan for barang with audit logging
     * @param {Array<string>} ids - Array of barang IDs
     * @param {string} satuan_id - New satuan ID
     * @param {string} satuan_nama - New satuan name
     * @returns {Object} Bulk update result
     */
    bulkUpdateBarangSatuan(ids, satuan_id, satuan_nama) {
        const result = this.barangManager.bulkUpdateSatuan(ids, satuan_id, satuan_nama);
        
        this.auditLogger.logBulkOperation('barang', {
            operationType: 'bulk_update_satuan',
            affectedRecords: ids,
            successCount: result.success,
            failedCount: result.failed,
            errors: result.errors,
            updateData: { satuan_id, satuan_nama }
        });
        
        return result;
    }

    // ===== AUDIT OPERATIONS =====

    /**
     * Get audit logs
     * @param {Object} filters - Filter options
     * @returns {Object} Paginated audit logs
     */
    getAuditLogs(filters = {}) {
        return this.auditLogger.getAuditLogs(filters);
    }

    /**
     * Get record history
     * @param {string} tableName - Table name
     * @param {string} recordId - Record ID
     * @returns {Array} Array of audit logs
     */
    getRecordHistory(tableName, recordId) {
        return this.auditLogger.getRecordHistory(tableName, recordId);
    }

    /**
     * Export audit logs to CSV
     * @param {Object} filters - Filter options
     * @returns {string} CSV content
     */
    exportAuditLogs(filters = {}) {
        return this.auditLogger.exportToCSV(filters);
    }

    // ===== STATISTICS =====

    /**
     * Get comprehensive system statistics
     * @returns {Object} System statistics
     */
    getSystemStatistics() {
        return {
            barang: this.barangManager.getStatistics(),
            kategori: this.kategoriManager.getStatistics(),
            satuan: this.satuanManager.getStatistics(),
            audit: this.auditLogger.getStatistics()
        };
    }

    /**
     * Get dashboard summary
     * @returns {Object} Dashboard summary data
     */
    getDashboardSummary() {
        const barangStats = this.barangManager.getStatistics();
        const lowStockItems = this.barangManager.getLowStockItems();
        const recentActivity = this.auditLogger.getSystemActivitySummary(7);
        
        return {
            total_barang: barangStats.total_barang,
            low_stock_count: barangStats.low_stock_count,
            total_value: barangStats.total_value,
            categories_count: barangStats.categories_count,
            units_count: barangStats.units_count,
            low_stock_items: lowStockItems.slice(0, 5), // Top 5 low stock items
            recent_activities: recentActivity.total_activities,
            activity_by_action: recentActivity.by_action
        };
    }

    // ===== UTILITY METHODS =====

    /**
     * Clear all data (for testing purposes)
     * @returns {Object} Clear result
     */
    clearAllData() {
        const results = {
            barang: this.barangManager.clearAll(),
            kategori: this.kategoriManager.clearAll(),
            satuan: this.satuanManager.clearAll(),
            audit: this.auditLogger.clearAll()
        };
        
        // Re-initialize default data
        this.satuanManager.initializeDefaultSatuan();
        
        return {
            success: Object.values(results).every(result => result),
            results
        };
    }

    /**
     * Get system health status
     * @returns {Object} System health status
     */
    getSystemHealth() {
        try {
            const stats = this.getSystemStatistics();
            
            return {
                status: 'healthy',
                timestamp: Date.now(),
                components: {
                    barang_manager: { status: 'ok', count: stats.barang.total_barang },
                    kategori_manager: { status: 'ok', count: stats.kategori.total_kategori },
                    satuan_manager: { status: 'ok', count: stats.satuan.total_satuan },
                    audit_logger: { status: 'ok', count: stats.audit.total_logs }
                }
            };
        } catch (error) {
            return {
                status: 'error',
                timestamp: Date.now(),
                error: error.message
            };
        }
    }
}

// Create and export singleton instance
export const masterBarangSystem = new MasterBarangSystem();