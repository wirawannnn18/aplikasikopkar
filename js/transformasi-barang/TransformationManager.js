/**
 * TransformationManager - Komponen utama untuk mengelola transformasi barang
 * 
 * Kelas ini bertindak sebagai orchestrator untuk seluruh proses transformasi,
 * mengintegrasikan semua komponen lain seperti validation, calculation, dan logging.
 */

class TransformationManager {
    constructor() {
        this.validationEngine = null; // Will be injected
        this.calculator = null; // Will be injected
        this.stockManager = null; // Will be injected
        this.auditLogger = null; // Will be injected
        this.initialized = false;
    }

    /**
     * Initialize TransformationManager dengan dependencies
     * @param {Object} dependencies - Object berisi semua dependencies
     * @param {ValidationEngine} dependencies.validationEngine
     * @param {ConversionCalculator} dependencies.calculator
     * @param {StockManager} dependencies.stockManager
     * @param {AuditLogger} dependencies.auditLogger
     */
    initialize(dependencies) {
        this.validationEngine = dependencies.validationEngine;
        this.calculator = dependencies.calculator;
        this.stockManager = dependencies.stockManager;
        this.auditLogger = dependencies.auditLogger;
        this.initialized = true;
    }

    /**
     * Mendapatkan daftar item yang dapat ditransformasi
     * @returns {Promise<Object[]>} Array item yang memiliki multiple units
     */
    async getTransformableItems() {
        this._ensureInitialized();
        
        try {
            // Ambil semua master barang dari localStorage
            const masterBarang = this._getMasterBarang();
            
            // Group items by base product
            const baseProducts = {};
            masterBarang.forEach(item => {
                const baseProduct = item.baseProduct || item.kode.split('-')[0];
                if (!baseProducts[baseProduct]) {
                    baseProducts[baseProduct] = [];
                }
                baseProducts[baseProduct].push(item);
            });
            
            // Filter hanya base products yang memiliki multiple units
            const transformableItems = [];
            for (const [baseProduct, items] of Object.entries(baseProducts)) {
                if (items.length > 1) {
                    // Check if conversion ratios are defined
                    const hasConversionRatios = await this._hasConversionRatios(baseProduct);
                    if (hasConversionRatios) {
                        transformableItems.push({
                            baseProduct,
                            items: items.map(item => ({
                                id: item.kode,
                                name: item.nama,
                                unit: item.satuan,
                                stock: item.stok || 0,
                                baseProduct
                            }))
                        });
                    }
                }
            }
            
            return transformableItems;
        } catch (error) {
            console.error('Error getting transformable items:', error);
            throw error;
        }
    }

    /**
     * Validasi transformasi sebelum eksekusi
     * @param {string} sourceItemId - ID item sumber
     * @param {string} targetItemId - ID item target
     * @param {number} quantity - Jumlah yang akan ditransformasi
     * @returns {Promise<ValidationResult>} Hasil validasi
     */
    async validateTransformation(sourceItemId, targetItemId, quantity) {
        this._ensureInitialized();
        
        try {
            const validationResult = {
                isValid: false,
                errors: [],
                warnings: []
            };
            
            // Get item details
            const sourceItem = this._getItemById(sourceItemId);
            const targetItem = this._getItemById(targetItemId);
            
            if (!sourceItem) {
                validationResult.errors.push(`Source item ${sourceItemId} tidak ditemukan`);
                return validationResult;
            }
            
            if (!targetItem) {
                validationResult.errors.push(`Target item ${targetItemId} tidak ditemukan`);
                return validationResult;
            }
            
            // Validate product match
            const productMatchResult = await this.validationEngine.validateProductMatch(sourceItem, targetItem);
            if (!productMatchResult.isValid) {
                validationResult.errors.push(...productMatchResult.errors);
            }
            
            // Validate stock availability
            const stockResult = await this.validationEngine.validateStockAvailability(sourceItem, quantity);
            if (!stockResult.isValid) {
                validationResult.errors.push(...stockResult.errors);
            }
            
            // Validate conversion ratio exists
            const ratioResult = await this.validationEngine.validateConversionRatio(sourceItem.satuan, targetItem.satuan);
            if (!ratioResult.isValid) {
                validationResult.errors.push(...ratioResult.errors);
                return validationResult;
            }
            
            // Calculate target quantity and validate whole number result
            const conversionRatio = await this.calculator.getConversionRatio(sourceItem.satuan, targetItem.satuan);
            const targetQuantity = await this.calculator.calculateTargetQuantity(quantity, conversionRatio);
            
            const quantityResult = await this.validationEngine.validateQuantityCalculation(quantity, targetQuantity, conversionRatio);
            if (!quantityResult.isValid) {
                validationResult.errors.push(...quantityResult.errors);
            }
            
            // Check if transformation would result in negative stock
            const newSourceStock = sourceItem.stok - quantity;
            if (newSourceStock < 0) {
                validationResult.errors.push(`Stok ${sourceItem.nama} tidak mencukupi. Stok tersedia: ${sourceItem.stok}, diminta: ${quantity}`);
            }
            
            // If no errors, validation is successful
            validationResult.isValid = validationResult.errors.length === 0;
            
            return validationResult;
        } catch (error) {
            console.error('Error validating transformation:', error);
            throw error;
        }
    }

    /**
     * Eksekusi transformasi barang
     * @param {TransformationRequest} transformationData - Data transformasi
     * @returns {Promise<TransformationRecord>} Record transformasi yang berhasil
     */
    async executeTransformation(transformationData) {
        this._ensureInitialized();
        
        try {
            const { sourceItemId, targetItemId, quantity, user } = transformationData;
            
            // Validate transformation first
            const validationResult = await this.validateTransformation(sourceItemId, targetItemId, quantity);
            if (!validationResult.isValid) {
                throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
            }
            
            // Get item details
            const sourceItem = this._getItemById(sourceItemId);
            const targetItem = this._getItemById(targetItemId);
            
            // Get conversion ratio and calculate target quantity
            const conversionRatio = await this.calculator.getConversionRatio(sourceItem.satuan, targetItem.satuan);
            const targetQuantity = await this.calculator.calculateTargetQuantity(quantity, conversionRatio);
            
            // Create transformation record
            const transformationRecord = {
                id: this._generateTransformationId(),
                timestamp: new Date().toISOString(),
                user: user,
                sourceItem: {
                    id: sourceItem.kode,
                    name: sourceItem.nama,
                    unit: sourceItem.satuan,
                    quantity: quantity,
                    stockBefore: sourceItem.stok,
                    stockAfter: sourceItem.stok - quantity,
                    baseProduct: sourceItem.baseProduct || sourceItem.kode.split('-')[0]
                },
                targetItem: {
                    id: targetItem.kode,
                    name: targetItem.nama,
                    unit: targetItem.satuan,
                    quantity: targetQuantity,
                    stockBefore: targetItem.stok,
                    stockAfter: targetItem.stok + targetQuantity,
                    baseProduct: targetItem.baseProduct || targetItem.kode.split('-')[0]
                },
                conversionRatio: conversionRatio,
                status: 'pending'
            };
            
            try {
                // Update stock atomically
                await this.stockManager.updateStock(sourceItemId, sourceItem.satuan, -quantity);
                await this.stockManager.updateStock(targetItemId, targetItem.satuan, targetQuantity);
                
                // Verify stock consistency
                const consistencyResult = await this.stockManager.validateStockConsistency();
                if (!consistencyResult.isValid) {
                    // Rollback if consistency check fails
                    await this.stockManager.updateStock(sourceItemId, sourceItem.satuan, quantity);
                    await this.stockManager.updateStock(targetItemId, targetItem.satuan, -targetQuantity);
                    throw new Error('Stock consistency validation failed');
                }
                
                // Mark as completed
                transformationRecord.status = 'completed';
                
                // Log the transformation
                await this.auditLogger.logTransformation(transformationRecord);
                
                return transformationRecord;
                
            } catch (error) {
                // Mark as failed and log
                transformationRecord.status = 'failed';
                await this.auditLogger.logTransformation(transformationRecord);
                throw error;
            }
        } catch (error) {
            console.error('Error executing transformation:', error);
            throw error;
        }
    }

    /**
     * Mendapatkan preview transformasi
     * @param {string} sourceItemId - ID item sumber
     * @param {string} targetItemId - ID item target
     * @param {number} quantity - Jumlah yang akan ditransformasi
     * @returns {Promise<TransformationPreview>} Preview transformasi
     */
    async getTransformationPreview(sourceItemId, targetItemId, quantity) {
        this._ensureInitialized();
        
        try {
            // Get item details
            const sourceItem = this._getItemById(sourceItemId);
            const targetItem = this._getItemById(targetItemId);
            
            if (!sourceItem || !targetItem) {
                throw new Error('Source atau target item tidak ditemukan');
            }
            
            // Get conversion ratio and calculate target quantity
            const conversionRatio = await this.calculator.getConversionRatio(sourceItem.satuan, targetItem.satuan);
            const targetQuantity = await this.calculator.calculateTargetQuantity(quantity, conversionRatio);
            
            // Validate transformation
            const validationResult = await this.validateTransformation(sourceItemId, targetItemId, quantity);
            
            const preview = {
                sourceItem: {
                    id: sourceItem.kode,
                    name: sourceItem.nama,
                    unit: sourceItem.satuan,
                    currentStock: sourceItem.stok,
                    transformQuantity: quantity,
                    resultingStock: sourceItem.stok - quantity
                },
                targetItem: {
                    id: targetItem.kode,
                    name: targetItem.nama,
                    unit: targetItem.satuan,
                    currentStock: targetItem.stok,
                    transformQuantity: targetQuantity,
                    resultingStock: targetItem.stok + targetQuantity
                },
                conversionRatio: conversionRatio,
                isValid: validationResult.isValid,
                errors: validationResult.errors,
                warnings: validationResult.warnings
            };
            
            return preview;
        } catch (error) {
            console.error('Error getting transformation preview:', error);
            throw error;
        }
    }

    /**
     * Mendapatkan history transformasi
     * @param {Object} filters - Filter untuk history
     * @param {string} [filters.dateFrom] - Tanggal mulai
     * @param {string} [filters.dateTo] - Tanggal akhir
     * @param {string} [filters.product] - Filter berdasarkan produk
     * @param {string} [filters.user] - Filter berdasarkan user
     * @returns {Promise<TransformationRecord[]>} Array history transformasi
     */
    async getTransformationHistory(filters = {}) {
        this._ensureInitialized();
        
        try {
            // Delegate to audit logger
            const historyResult = await this.auditLogger.getTransformationHistory(filters);
            return historyResult.data;
        } catch (error) {
            console.error('Error getting transformation history:', error);
            throw error;
        }
    }

    /**
     * Mendapatkan opsi konversi untuk base product
     * @param {string} baseProduct - Base product identifier
     * @returns {Promise<ConversionRule[]>} Array opsi konversi
     */
    async getConversionOptions(baseProduct) {
        this._ensureInitialized();
        
        try {
            // Get conversion ratios from localStorage
            const conversionRatios = this._getConversionRatios();
            const productRatios = conversionRatios.find(ratio => ratio.baseProduct === baseProduct);
            
            if (!productRatios) {
                return [];
            }
            
            // Get items for this base product
            const masterBarang = this._getMasterBarang();
            const productItems = masterBarang.filter(item => {
                const itemBaseProduct = item.baseProduct || item.kode.split('-')[0];
                return itemBaseProduct === baseProduct;
            });
            
            // Build conversion options with current stock levels
            const options = [];
            productRatios.conversions.forEach(conversion => {
                const fromItem = productItems.find(item => item.satuan === conversion.from);
                const toItem = productItems.find(item => item.satuan === conversion.to);
                
                if (fromItem && toItem) {
                    options.push({
                        from: {
                            unit: conversion.from,
                            item: fromItem,
                            stock: fromItem.stok || 0
                        },
                        to: {
                            unit: conversion.to,
                            item: toItem,
                            stock: toItem.stok || 0
                        },
                        ratio: conversion.ratio,
                        available: (fromItem.stok || 0) > 0
                    });
                }
            });
            
            return options;
        } catch (error) {
            console.error('Error getting conversion options:', error);
            throw error;
        }
    }

    /**
     * Memastikan TransformationManager sudah diinisialisasi
     * @private
     */
    _ensureInitialized() {
        if (!this.initialized) {
            throw new Error('TransformationManager belum diinisialisasi. Panggil initialize() terlebih dahulu.');
        }
    }

    /**
     * Generate unique ID untuk transformasi
     * @returns {string} Unique transformation ID
     * @private
     */
    _generateTransformationId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `TRF-${timestamp}-${random}`;
    }

    /**
     * Mendapatkan master barang dari localStorage
     * @returns {Object[]} Array master barang
     * @private
     */
    _getMasterBarang() {
        try {
            const masterBarangData = localStorage.getItem('masterBarang');
            return masterBarangData ? JSON.parse(masterBarangData) : [];
        } catch (error) {
            console.error('Error loading master barang:', error);
            return [];
        }
    }

    /**
     * Mendapatkan item berdasarkan ID
     * @param {string} itemId - ID item
     * @returns {Object|null} Item atau null jika tidak ditemukan
     * @private
     */
    _getItemById(itemId) {
        const masterBarang = this._getMasterBarang();
        return masterBarang.find(item => item.kode === itemId) || null;
    }

    /**
     * Mendapatkan conversion ratios dari localStorage
     * @returns {Object[]} Array conversion ratios
     * @private
     */
    _getConversionRatios() {
        try {
            const ratiosData = localStorage.getItem('conversionRatios');
            return ratiosData ? JSON.parse(ratiosData) : [];
        } catch (error) {
            console.error('Error loading conversion ratios:', error);
            return [];
        }
    }

    /**
     * Mengecek apakah base product memiliki conversion ratios
     * @param {string} baseProduct - Base product identifier
     * @returns {Promise<boolean>} True jika memiliki conversion ratios
     * @private
     */
    async _hasConversionRatios(baseProduct) {
        try {
            const conversionRatios = this._getConversionRatios();
            const productRatios = conversionRatios.find(ratio => ratio.baseProduct === baseProduct);
            return productRatios && productRatios.conversions && productRatios.conversions.length > 0;
        } catch (error) {
            console.error('Error checking conversion ratios:', error);
            return false;
        }
    }
}

// Export untuk browser dan Node.js
if (typeof window !== 'undefined') {
    window.TransformationManager = TransformationManager;
}

// ES6 module export
export default TransformationManager;