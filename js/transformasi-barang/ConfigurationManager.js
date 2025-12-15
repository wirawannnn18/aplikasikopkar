/**
 * ConfigurationManager - Mengelola konfigurasi rasio konversi untuk admin
 * 
 * Fitur:
 * - CRUD operations untuk ratio configuration
 * - Validation dan impact warnings
 * - Immediate application of changes
 * - Error handling untuk corrupted data
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

// import { ValidationEngine } from './ValidationEngine.js';
// import { ErrorHandler } from './ErrorHandler.js';

class ConfigurationManager {
    constructor() {
        this.validationEngine = null; // Will be initialized when ValidationEngine is available
        this.errorHandler = null; // Will be initialized when ErrorHandler is available
        this.storageKey = 'transformasi_conversion_ratios';
        this.backupKey = 'transformasi_conversion_ratios_backup';
        
        // Initialize default ratios if none exist
        this.initializeDefaultRatios();
    }

    /**
     * Initialize dependencies when they become available
     */
    initialize() {
        if (typeof ValidationEngine !== 'undefined') {
            this.validationEngine = new ValidationEngine();
        }
        if (typeof ErrorHandler !== 'undefined') {
            this.errorHandler = new ErrorHandler();
        }
    }

    /**
     * Mendapatkan semua konfigurasi rasio konversi
     * Requirements: 5.1 - Display all products with unit relationships and ratios
     */
    getAllRatioConfigurations() {
        try {
            const ratios = this.loadRatiosFromStorage();
            const masterBarang = this.loadMasterBarang();
            
            // Group products by base product
            const configurations = this.groupProductsByBase(masterBarang, ratios);
            
            return {
                success: true,
                data: configurations,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return this.errorHandler.handleSystemError(error, 'getAllRatioConfigurations');
        }
    }

    /**
     * Menambah atau mengupdate rasio konversi
     * Requirements: 5.2 - Validate mathematical consistency and positive values
     * Requirements: 5.3 - Warn about potential impacts
     */
    setConversionRatio(baseProduct, fromUnit, toUnit, ratio, options = {}) {
        try {
            // Validate input parameters
            const validation = this.validateRatioInput(baseProduct, fromUnit, toUnit, ratio);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: validation.error,
                    type: 'validation'
                };
            }

            // Check for existing ratio and potential impacts
            const impactAnalysis = this.analyzeConfigurationImpact(baseProduct, fromUnit, toUnit, ratio);
            
            // If force flag is not set and there are impacts, return warning
            if (!options.force && impactAnalysis.hasImpacts) {
                return {
                    success: false,
                    requiresConfirmation: true,
                    impacts: impactAnalysis.impacts,
                    warning: 'Perubahan rasio ini akan mempengaruhi perhitungan yang sudah ada. Lanjutkan?'
                };
            }

            // Create backup before making changes
            this.createBackup();

            // Update the ratio configuration
            const ratios = this.loadRatiosFromStorage();
            this.updateRatioInConfiguration(ratios, baseProduct, fromUnit, toUnit, ratio);
            
            // Validate consistency of all ratios
            const consistencyCheck = this.validateRatioConsistency(ratios);
            if (!consistencyCheck.isValid) {
                this.restoreFromBackup();
                return {
                    success: false,
                    error: consistencyCheck.error,
                    type: 'consistency'
                };
            }

            // Save updated ratios
            this.saveRatiosToStorage(ratios);

            // Log the configuration change
            this.logConfigurationChange(baseProduct, fromUnit, toUnit, ratio, options.user);

            return {
                success: true,
                message: 'Rasio konversi berhasil diperbarui',
                impacts: impactAnalysis.impacts,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            this.restoreFromBackup();
            return this.errorHandler.handleSystemError(error, 'setConversionRatio');
        }
    }

    /**
     * Menghapus rasio konversi
     * Requirements: 5.3 - Warn about impacts of removing ratios
     */
    removeConversionRatio(baseProduct, fromUnit, toUnit, options = {}) {
        try {
            const ratios = this.loadRatiosFromStorage();
            
            // Check if ratio exists
            if (!this.ratioExists(ratios, baseProduct, fromUnit, toUnit)) {
                return {
                    success: false,
                    error: 'Rasio konversi tidak ditemukan',
                    type: 'not_found'
                };
            }

            // Analyze impact of removal
            const impactAnalysis = this.analyzeRemovalImpact(baseProduct, fromUnit, toUnit);
            
            if (!options.force && impactAnalysis.hasImpacts) {
                return {
                    success: false,
                    requiresConfirmation: true,
                    impacts: impactAnalysis.impacts,
                    warning: 'Menghapus rasio ini akan menonaktifkan transformasi terkait. Lanjutkan?'
                };
            }

            // Create backup and remove ratio
            this.createBackup();
            this.removeRatioFromConfiguration(ratios, baseProduct, fromUnit, toUnit);
            this.saveRatiosToStorage(ratios);

            // Log the removal
            this.logConfigurationChange(baseProduct, fromUnit, toUnit, null, options.user, 'remove');

            return {
                success: true,
                message: 'Rasio konversi berhasil dihapus',
                impacts: impactAnalysis.impacts
            };

        } catch (error) {
            this.restoreFromBackup();
            return this.errorHandler.handleSystemError(error, 'removeConversionRatio');
        }
    }

    /**
     * Mendapatkan rasio konversi spesifik
     */
    getConversionRatio(baseProduct, fromUnit, toUnit) {
        try {
            const ratios = this.loadRatiosFromStorage();
            const ratio = this.findRatio(ratios, baseProduct, fromUnit, toUnit);
            
            if (ratio) {
                return {
                    success: true,
                    ratio: ratio.ratio,
                    lastUpdated: ratio.lastUpdated,
                    updatedBy: ratio.updatedBy
                };
            }

            return {
                success: false,
                error: 'Rasio konversi tidak ditemukan',
                type: 'not_found'
            };

        } catch (error) {
            return this.errorHandler.handleSystemError(error, 'getConversionRatio');
        }
    }

    /**
     * Validasi data konfigurasi dan perbaikan otomatis
     * Requirements: 5.5 - Handle corrupted data and alert administrators
     */
    validateAndRepairConfiguration() {
        try {
            const ratios = this.loadRatiosFromStorage();
            const issues = [];
            const repairs = [];

            // Check for corrupted data
            if (!ratios || typeof ratios !== 'object') {
                issues.push('Data konfigurasi rusak atau tidak valid');
                this.initializeDefaultRatios();
                repairs.push('Inisialisasi ulang dengan data default');
            }

            // Validate each ratio configuration
            for (const baseProduct in ratios) {
                const productRatios = ratios[baseProduct];
                
                if (!productRatios.conversions || !Array.isArray(productRatios.conversions)) {
                    issues.push(`Data konversi untuk ${baseProduct} rusak`);
                    continue;
                }

                // Check for mathematical consistency
                const consistencyIssues = this.checkMathematicalConsistency(productRatios.conversions);
                issues.push(...consistencyIssues);

                // Check for orphaned ratios (products that no longer exist)
                const orphanedIssues = this.checkOrphanedRatios(baseProduct);
                issues.push(...orphanedIssues);
            }

            // Check for missing ratios for existing products
            const missingRatios = this.checkMissingRatios();
            issues.push(...missingRatios);

            return {
                success: true,
                issues: issues,
                repairs: repairs,
                isHealthy: issues.length === 0,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            return this.errorHandler.handleSystemError(error, 'validateAndRepairConfiguration');
        }
    }

    /**
     * Export konfigurasi untuk backup
     */
    exportConfiguration() {
        try {
            const ratios = this.loadRatiosFromStorage();
            const exportData = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                ratios: ratios,
                metadata: {
                    totalProducts: Object.keys(ratios).length,
                    totalRatios: this.countTotalRatios(ratios)
                }
            };

            return {
                success: true,
                data: exportData,
                filename: `transformasi_ratios_${new Date().toISOString().split('T')[0]}.json`
            };

        } catch (error) {
            return this.errorHandler.handleSystemError(error, 'exportConfiguration');
        }
    }

    /**
     * Import konfigurasi dari backup
     */
    importConfiguration(importData, options = {}) {
        try {
            // Validate import data structure
            const validation = this.validateImportData(importData);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: validation.error,
                    type: 'validation'
                };
            }

            // Create backup before import
            this.createBackup();

            // Import the configuration
            if (options.merge) {
                this.mergeConfiguration(importData.ratios);
            } else {
                this.replaceConfiguration(importData.ratios);
            }

            // Validate the imported configuration
            const validationResult = this.validateAndRepairConfiguration();
            if (!validationResult.isHealthy) {
                this.restoreFromBackup();
                return {
                    success: false,
                    error: 'Konfigurasi yang diimport tidak valid',
                    issues: validationResult.issues
                };
            }

            return {
                success: true,
                message: 'Konfigurasi berhasil diimport',
                imported: {
                    products: Object.keys(importData.ratios).length,
                    ratios: this.countTotalRatios(importData.ratios)
                }
            };

        } catch (error) {
            this.restoreFromBackup();
            return this.errorHandler.handleSystemError(error, 'importConfiguration');
        }
    }

    // ==================== PRIVATE METHODS ====================

    /**
     * Load ratios from localStorage with error handling
     */
    loadRatiosFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) {
                return {};
            }
            return JSON.parse(stored);
        } catch (error) {
            console.error('Error loading ratios from storage:', error);
            // Try to load from backup
            try {
                const backup = localStorage.getItem(this.backupKey);
                if (backup) {
                    return JSON.parse(backup);
                }
            } catch (backupError) {
                console.error('Error loading backup ratios:', backupError);
            }
            return {};
        }
    }

    /**
     * Save ratios to localStorage
     */
    saveRatiosToStorage(ratios) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(ratios));
        } catch (error) {
            throw new Error(`Gagal menyimpan konfigurasi: ${error.message}`);
        }
    }

    /**
     * Load master barang data
     */
    loadMasterBarang() {
        try {
            const stored = localStorage.getItem('masterBarang');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading master barang:', error);
            return [];
        }
    }

    /**
     * Group products by base product for display
     */
    groupProductsByBase(masterBarang, ratios) {
        const grouped = {};
        
        // Create base product groups from master barang
        masterBarang.forEach(item => {
            const baseProduct = item.baseProduct || item.kode.split('-')[0];
            
            if (!grouped[baseProduct]) {
                grouped[baseProduct] = {
                    baseProduct: baseProduct,
                    items: [],
                    ratios: ratios[baseProduct] || { conversions: [] }
                };
            }
            
            grouped[baseProduct].items.push({
                kode: item.kode,
                nama: item.nama,
                satuan: item.satuan,
                stok: item.stok || 0
            });
        });

        return Object.values(grouped);
    }

    /**
     * Validate ratio input parameters
     */
    validateRatioInput(baseProduct, fromUnit, toUnit, ratio) {
        if (!baseProduct || typeof baseProduct !== 'string') {
            return {
                isValid: false,
                error: 'Base product harus berupa string yang valid'
            };
        }

        if (!fromUnit || typeof fromUnit !== 'string') {
            return {
                isValid: false,
                error: 'Unit asal harus berupa string yang valid'
            };
        }

        if (!toUnit || typeof toUnit !== 'string') {
            return {
                isValid: false,
                error: 'Unit tujuan harus berupa string yang valid'
            };
        }

        if (fromUnit === toUnit) {
            return {
                isValid: false,
                error: 'Unit asal dan tujuan tidak boleh sama'
            };
        }

        if (typeof ratio !== 'number' || ratio <= 0 || !isFinite(ratio)) {
            return {
                isValid: false,
                error: 'Rasio harus berupa angka positif yang valid'
            };
        }

        return { isValid: true };
    }

    /**
     * Analyze impact of configuration changes
     */
    analyzeConfigurationImpact(baseProduct, fromUnit, toUnit, newRatio) {
        const impacts = [];
        const ratios = this.loadRatiosFromStorage();
        
        // Check if ratio already exists
        const existingRatio = this.findRatio(ratios, baseProduct, fromUnit, toUnit);
        if (existingRatio) {
            impacts.push({
                type: 'ratio_change',
                description: `Rasio ${fromUnit} ke ${toUnit} akan berubah dari ${existingRatio.ratio} ke ${newRatio}`,
                severity: 'medium'
            });
        }

        // Check for reverse ratio consistency
        const reverseRatio = this.findRatio(ratios, baseProduct, toUnit, fromUnit);
        if (reverseRatio) {
            const expectedReverse = 1 / newRatio;
            const difference = Math.abs(reverseRatio.ratio - expectedReverse);
            if (difference > 0.0001) {
                impacts.push({
                    type: 'consistency_warning',
                    description: `Rasio kebalikan ${toUnit} ke ${fromUnit} (${reverseRatio.ratio}) tidak konsisten dengan rasio baru (seharusnya ${expectedReverse.toFixed(6)})`,
                    severity: 'high'
                });
            }
        }

        return {
            hasImpacts: impacts.length > 0,
            impacts: impacts
        };
    }

    /**
     * Update ratio in configuration object
     */
    updateRatioInConfiguration(ratios, baseProduct, fromUnit, toUnit, ratio) {
        if (!ratios[baseProduct]) {
            ratios[baseProduct] = {
                baseProduct: baseProduct,
                conversions: []
            };
        }

        const conversions = ratios[baseProduct].conversions;
        const existingIndex = conversions.findIndex(c => c.from === fromUnit && c.to === toUnit);
        
        const ratioData = {
            from: fromUnit,
            to: toUnit,
            ratio: ratio,
            lastUpdated: new Date().toISOString(),
            updatedBy: 'admin' // TODO: Get from current user session
        };

        if (existingIndex >= 0) {
            conversions[existingIndex] = ratioData;
        } else {
            conversions.push(ratioData);
        }
    }

    /**
     * Validate consistency of all ratios
     */
    validateRatioConsistency(ratios) {
        for (const baseProduct in ratios) {
            const conversions = ratios[baseProduct].conversions;
            
            // Check for circular consistency
            for (let i = 0; i < conversions.length; i++) {
                for (let j = i + 1; j < conversions.length; j++) {
                    const ratio1 = conversions[i];
                    const ratio2 = conversions[j];
                    
                    // Check if they form a reverse pair
                    if (ratio1.from === ratio2.to && ratio1.to === ratio2.from) {
                        const product = ratio1.ratio * ratio2.ratio;
                        if (Math.abs(product - 1) > 0.0001) {
                            return {
                                isValid: false,
                                error: `Rasio tidak konsisten: ${ratio1.from}->${ratio1.to} (${ratio1.ratio}) dan ${ratio2.from}->${ratio2.to} (${ratio2.ratio})`
                            };
                        }
                    }
                }
            }
        }

        return { isValid: true };
    }

    /**
     * Find specific ratio in configuration
     */
    findRatio(ratios, baseProduct, fromUnit, toUnit) {
        if (!ratios[baseProduct] || !ratios[baseProduct].conversions) {
            return null;
        }

        return ratios[baseProduct].conversions.find(c => 
            c.from === fromUnit && c.to === toUnit
        );
    }

    /**
     * Check if ratio exists
     */
    ratioExists(ratios, baseProduct, fromUnit, toUnit) {
        return this.findRatio(ratios, baseProduct, fromUnit, toUnit) !== null;
    }

    /**
     * Create backup of current configuration
     */
    createBackup() {
        try {
            const current = localStorage.getItem(this.storageKey);
            if (current) {
                localStorage.setItem(this.backupKey, current);
            }
        } catch (error) {
            console.error('Error creating backup:', error);
        }
    }

    /**
     * Restore from backup
     */
    restoreFromBackup() {
        try {
            const backup = localStorage.getItem(this.backupKey);
            if (backup) {
                localStorage.setItem(this.storageKey, backup);
            }
        } catch (error) {
            console.error('Error restoring from backup:', error);
        }
    }

    /**
     * Initialize default ratios for common products
     */
    initializeDefaultRatios() {
        const defaultRatios = {
            'AQUA-1L': {
                baseProduct: 'AQUA-1L',
                conversions: [
                    { from: 'dus', to: 'pcs', ratio: 12, lastUpdated: new Date().toISOString(), updatedBy: 'system' },
                    { from: 'pcs', to: 'dus', ratio: 1/12, lastUpdated: new Date().toISOString(), updatedBy: 'system' }
                ]
            }
        };

        try {
            const existing = this.loadRatiosFromStorage();
            if (Object.keys(existing).length === 0) {
                this.saveRatiosToStorage(defaultRatios);
            }
        } catch (error) {
            console.error('Error initializing default ratios:', error);
        }
    }

    /**
     * Log configuration changes for audit
     */
    logConfigurationChange(baseProduct, fromUnit, toUnit, ratio, user, action = 'update') {
        try {
            const auditLog = {
                timestamp: new Date().toISOString(),
                user: user || 'admin',
                action: action,
                baseProduct: baseProduct,
                fromUnit: fromUnit,
                toUnit: toUnit,
                ratio: ratio,
                type: 'configuration_change'
            };

            // Get existing audit logs
            const logs = JSON.parse(localStorage.getItem('transformasi_audit_logs') || '[]');
            logs.push(auditLog);

            // Keep only last 1000 entries
            if (logs.length > 1000) {
                logs.splice(0, logs.length - 1000);
            }

            localStorage.setItem('transformasi_audit_logs', JSON.stringify(logs));
        } catch (error) {
            console.error('Error logging configuration change:', error);
        }
    }

    /**
     * Remove ratio from configuration
     */
    removeRatioFromConfiguration(ratios, baseProduct, fromUnit, toUnit) {
        if (ratios[baseProduct] && ratios[baseProduct].conversions) {
            ratios[baseProduct].conversions = ratios[baseProduct].conversions.filter(c => 
                !(c.from === fromUnit && c.to === toUnit)
            );

            // Remove base product if no conversions left
            if (ratios[baseProduct].conversions.length === 0) {
                delete ratios[baseProduct];
            }
        }
    }

    /**
     * Analyze impact of removing a ratio
     */
    analyzeRemovalImpact(baseProduct, fromUnit, toUnit) {
        const impacts = [];
        
        impacts.push({
            type: 'transformation_disabled',
            description: `Transformasi dari ${fromUnit} ke ${toUnit} akan dinonaktifkan`,
            severity: 'high'
        });

        // Check if this affects reverse transformations
        const ratios = this.loadRatiosFromStorage();
        const reverseRatio = this.findRatio(ratios, baseProduct, toUnit, fromUnit);
        if (reverseRatio) {
            impacts.push({
                type: 'reverse_affected',
                description: `Rasio kebalikan ${toUnit} ke ${fromUnit} mungkin perlu disesuaikan`,
                severity: 'medium'
            });
        }

        return {
            hasImpacts: impacts.length > 0,
            impacts: impacts
        };
    }

    /**
     * Check mathematical consistency of conversions
     */
    checkMathematicalConsistency(conversions) {
        const issues = [];
        
        for (let i = 0; i < conversions.length; i++) {
            const conv = conversions[i];
            
            // Check for invalid ratios
            if (!conv.ratio || conv.ratio <= 0 || !isFinite(conv.ratio)) {
                issues.push(`Rasio tidak valid: ${conv.from} -> ${conv.to} (${conv.ratio})`);
            }
        }

        return issues;
    }

    /**
     * Check for orphaned ratios
     */
    checkOrphanedRatios(baseProduct) {
        const issues = [];
        const masterBarang = this.loadMasterBarang();
        
        // Check if base product still exists in master barang
        const productExists = masterBarang.some(item => 
            (item.baseProduct || item.kode.split('-')[0]) === baseProduct
        );

        if (!productExists) {
            issues.push(`Produk ${baseProduct} tidak ditemukan di master barang`);
        }

        return issues;
    }

    /**
     * Check for missing ratios
     */
    checkMissingRatios() {
        const issues = [];
        const masterBarang = this.loadMasterBarang();
        const ratios = this.loadRatiosFromStorage();
        
        // Group master barang by base product
        const productGroups = {};
        masterBarang.forEach(item => {
            const baseProduct = item.baseProduct || item.kode.split('-')[0];
            if (!productGroups[baseProduct]) {
                productGroups[baseProduct] = [];
            }
            productGroups[baseProduct].push(item.satuan);
        });

        // Check for products with multiple units but no ratios
        for (const baseProduct in productGroups) {
            const units = [...new Set(productGroups[baseProduct])];
            if (units.length > 1 && !ratios[baseProduct]) {
                issues.push(`Produk ${baseProduct} memiliki multiple unit (${units.join(', ')}) tapi tidak ada rasio konversi`);
            }
        }

        return issues;
    }

    /**
     * Count total ratios in configuration
     */
    countTotalRatios(ratios) {
        let count = 0;
        for (const baseProduct in ratios) {
            if (ratios[baseProduct].conversions) {
                count += ratios[baseProduct].conversions.length;
            }
        }
        return count;
    }

    /**
     * Validate import data structure
     */
    validateImportData(importData) {
        if (!importData || typeof importData !== 'object') {
            return {
                isValid: false,
                error: 'Data import tidak valid'
            };
        }

        if (!importData.ratios || typeof importData.ratios !== 'object') {
            return {
                isValid: false,
                error: 'Data rasio tidak ditemukan dalam import'
            };
        }

        // Validate structure of each ratio
        for (const baseProduct in importData.ratios) {
            const productData = importData.ratios[baseProduct];
            
            if (!productData.conversions || !Array.isArray(productData.conversions)) {
                return {
                    isValid: false,
                    error: `Data konversi untuk ${baseProduct} tidak valid`
                };
            }

            for (const conversion of productData.conversions) {
                if (!conversion.from || !conversion.to || typeof conversion.ratio !== 'number') {
                    return {
                        isValid: false,
                        error: `Konversi tidak valid untuk ${baseProduct}`
                    };
                }
            }
        }

        return { isValid: true };
    }

    /**
     * Merge imported configuration with existing
     */
    mergeConfiguration(importedRatios) {
        const existing = this.loadRatiosFromStorage();
        
        for (const baseProduct in importedRatios) {
            existing[baseProduct] = importedRatios[baseProduct];
        }

        this.saveRatiosToStorage(existing);
    }

    /**
     * Replace entire configuration with imported data
     */
    replaceConfiguration(importedRatios) {
        this.saveRatiosToStorage(importedRatios);
    }
}

// Browser compatibility
if (typeof window !== 'undefined') {
    window.ConfigurationManager = ConfigurationManager;
}

// ES6 module export (commented out for browser compatibility)
// export default ConfigurationManager;