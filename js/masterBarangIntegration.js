/**
 * Master Barang Integration Module
 * Menghubungkan form master barang dengan sistem transformasi barang
 * dan memastikan update stok otomatis
 */

class MasterBarangIntegration {
    constructor() {
        this.initialized = false;
        this.transformationManager = null;
        this.stockManager = null;
        this.conversionRatios = new Map();
        
        this.init();
    }

    async init() {
        try {
            // Initialize dependencies
            await this.initializeDependencies();
            
            // Load conversion ratios
            await this.loadConversionRatios();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Sync existing data
            await this.syncMasterBarangWithTransformation();
            
            this.initialized = true;
            console.log('Master Barang Integration initialized successfully');
        } catch (error) {
            console.error('Error initializing Master Barang Integration:', error);
        }
    }

    /**
     * Initialize dependencies for transformation system
     */
    async initializeDependencies() {
        // Initialize transformation components if not already done
        if (!window.transformationManager) {
            window.transformationManager = new TransformationManager();
            window.stockManager = new StockManager();
            window.validationEngine = new ValidationEngine();
            window.calculator = new ConversionCalculator();
            window.auditLogger = new AuditLogger();
            
            // Initialize components
            window.stockManager.initialize();
            window.validationEngine.initialize();
            window.calculator.initialize();
            window.auditLogger.initialize();
            
            // Initialize transformation manager with dependencies
            window.transformationManager.initialize({
                validationEngine: window.validationEngine,
                calculator: window.calculator,
                stockManager: window.stockManager,
                auditLogger: window.auditLogger
            });
        }
        
        this.transformationManager = window.transformationManager;
        this.stockManager = window.stockManager;
    }

    /**
     * Load conversion ratios from localStorage or create defaults
     */
    async loadConversionRatios() {
        try {
            const stored = localStorage.getItem('conversionRatios');
            let ratios = stored ? JSON.parse(stored) : [];
            
            // If no ratios exist, create default ones
            if (ratios.length === 0) {
                ratios = this.createDefaultConversionRatios();
                localStorage.setItem('conversionRatios', JSON.stringify(ratios));
            }
            
            // Build conversion map for quick lookup
            this.conversionRatios.clear();
            ratios.forEach(ratio => {
                this.conversionRatios.set(ratio.baseProduct, ratio.conversions);
            });
            
            console.log(`Loaded ${ratios.length} conversion ratio groups`);
        } catch (error) {
            console.error('Error loading conversion ratios:', error);
            // Create empty ratios as fallback
            this.conversionRatios.clear();
        }
    }

    /**
     * Create default conversion ratios for common products
     */
    createDefaultConversionRatios() {
        return [
            {
                baseProduct: 'BRG001', // Beras
                conversions: [
                    { from: 'kg', to: 'gram', ratio: 1000 },
                    { from: 'gram', to: 'kg', ratio: 0.001 },
                    { from: 'karung', to: 'kg', ratio: 50 },
                    { from: 'kg', to: 'karung', ratio: 0.02 }
                ]
            },
            {
                baseProduct: 'BRG002', // Minyak
                conversions: [
                    { from: 'liter', to: 'ml', ratio: 1000 },
                    { from: 'ml', to: 'liter', ratio: 0.001 },
                    { from: 'galon', to: 'liter', ratio: 5 },
                    { from: 'liter', to: 'galon', ratio: 0.2 }
                ]
            },
            {
                baseProduct: 'BRG003', // Gula
                conversions: [
                    { from: 'kg', to: 'gram', ratio: 1000 },
                    { from: 'gram', to: 'kg', ratio: 0.001 },
                    { from: 'karung', to: 'kg', ratio: 50 },
                    { from: 'kg', to: 'karung', ratio: 0.02 }
                ]
            }
        ];
    }

    /**
     * Setup event listeners for master barang forms
     */
    setupEventListeners() {
        // Listen for master barang updates
        document.addEventListener('masterBarangUpdated', (event) => {
            this.handleMasterBarangUpdate(event.detail);
        });

        // Listen for new master barang additions
        document.addEventListener('masterBarangAdded', (event) => {
            this.handleMasterBarangAdd(event.detail);
        });

        // Listen for stock updates from POS or other modules
        document.addEventListener('stockUpdated', (event) => {
            this.handleStockUpdate(event.detail);
        });

        // Listen for transformation completion
        document.addEventListener('transformationCompleted', (event) => {
            this.handleTransformationCompleted(event.detail);
        });
    }

    /**
     * Sync existing master barang data with transformation system
     */
    async syncMasterBarangWithTransformation() {
        try {
            const masterBarang = this.getMasterBarangData();
            
            // Group items by base product to identify transformation opportunities
            const baseProducts = this.groupItemsByBaseProduct(masterBarang);
            
            // Create conversion ratios for products that don't have them
            for (const [baseProduct, items] of baseProducts.entries()) {
                if (items.length > 1 && !this.conversionRatios.has(baseProduct)) {
                    const ratios = this.generateConversionRatiosForProduct(baseProduct, items);
                    if (ratios.length > 0) {
                        this.conversionRatios.set(baseProduct, ratios);
                        await this.saveConversionRatios();
                    }
                }
            }
            
            // Ensure all items have proper baseProduct field
            let updated = false;
            masterBarang.forEach(item => {
                if (!item.baseProduct) {
                    item.baseProduct = this.extractBaseProduct(item.kode);
                    updated = true;
                }
            });
            
            if (updated) {
                localStorage.setItem('masterBarang', JSON.stringify(masterBarang));
            }
            
            console.log(`Synced ${masterBarang.length} master barang items with transformation system`);
        } catch (error) {
            console.error('Error syncing master barang with transformation:', error);
        }
    }

    /**
     * Group items by base product
     */
    groupItemsByBaseProduct(items) {
        const groups = new Map();
        
        items.forEach(item => {
            const baseProduct = item.baseProduct || this.extractBaseProduct(item.kode);
            
            if (!groups.has(baseProduct)) {
                groups.set(baseProduct, []);
            }
            groups.get(baseProduct).push(item);
        });
        
        return groups;
    }

    /**
     * Extract base product from item code
     */
    extractBaseProduct(kode) {
        // Extract base product from code (e.g., BRG001-KG -> BRG001)
        return kode.split('-')[0];
    }

    /**
     * Generate conversion ratios for a product based on its units
     */
    generateConversionRatiosForProduct(baseProduct, items) {
        const ratios = [];
        const units = items.map(item => item.satuan.toLowerCase());
        
        // Common conversion patterns
        const conversionPatterns = [
            // Weight conversions
            { from: 'kg', to: 'gram', ratio: 1000 },
            { from: 'gram', to: 'kg', ratio: 0.001 },
            { from: 'ton', to: 'kg', ratio: 1000 },
            { from: 'kg', to: 'ton', ratio: 0.001 },
            
            // Volume conversions
            { from: 'liter', to: 'ml', ratio: 1000 },
            { from: 'ml', to: 'liter', ratio: 0.001 },
            { from: 'galon', to: 'liter', ratio: 5 },
            { from: 'liter', to: 'galon', ratio: 0.2 },
            
            // Packaging conversions
            { from: 'dus', to: 'pcs', ratio: 12 },
            { from: 'pcs', to: 'dus', ratio: 0.083 },
            { from: 'box', to: 'pcs', ratio: 24 },
            { from: 'pcs', to: 'box', ratio: 0.042 },
            { from: 'karung', to: 'kg', ratio: 50 },
            { from: 'kg', to: 'karung', ratio: 0.02 }
        ];
        
        // Find applicable conversions
        conversionPatterns.forEach(pattern => {
            if (units.includes(pattern.from) && units.includes(pattern.to)) {
                ratios.push(pattern);
            }
        });
        
        return ratios;
    }

    /**
     * Handle master barang update
     */
    async handleMasterBarangUpdate(data) {
        try {
            const { item, oldItem } = data;
            
            // Update stock in transformation system if stock changed
            if (oldItem && item.stok !== oldItem.stok) {
                const stockChange = item.stok - oldItem.stok;
                await this.stockManager.updateStock(item.kode, item.satuan, stockChange);
            }
            
            // Check if new conversion ratios need to be created
            await this.checkAndCreateConversionRatios(item);
            
            // Refresh transformation system cache
            if (this.stockManager.refreshStockCache) {
                this.stockManager.refreshStockCache();
            }
            
            console.log(`Master barang updated: ${item.kode}`);
        } catch (error) {
            console.error('Error handling master barang update:', error);
        }
    }

    /**
     * Handle new master barang addition
     */
    async handleMasterBarangAdd(item) {
        try {
            // Ensure item has baseProduct
            if (!item.baseProduct) {
                item.baseProduct = this.extractBaseProduct(item.kode);
            }
            
            // Check if new conversion ratios need to be created
            await this.checkAndCreateConversionRatios(item);
            
            // Refresh transformation system cache
            if (this.stockManager.refreshStockCache) {
                this.stockManager.refreshStockCache();
            }
            
            console.log(`New master barang added: ${item.kode}`);
        } catch (error) {
            console.error('Error handling master barang addition:', error);
        }
    }

    /**
     * Check and create conversion ratios for new items
     */
    async checkAndCreateConversionRatios(item) {
        const baseProduct = item.baseProduct || this.extractBaseProduct(item.kode);
        const masterBarang = this.getMasterBarangData();
        const relatedItems = masterBarang.filter(i => 
            (i.baseProduct || this.extractBaseProduct(i.kode)) === baseProduct
        );
        
        if (relatedItems.length > 1 && !this.conversionRatios.has(baseProduct)) {
            const ratios = this.generateConversionRatiosForProduct(baseProduct, relatedItems);
            if (ratios.length > 0) {
                this.conversionRatios.set(baseProduct, ratios);
                await this.saveConversionRatios();
                console.log(`Created conversion ratios for ${baseProduct}`);
            }
        }
    }

    /**
     * Handle stock update from external sources
     */
    async handleStockUpdate(data) {
        try {
            const { itemId, newStock, source } = data;
            
            // Update master barang data
            const masterBarang = this.getMasterBarangData();
            const itemIndex = masterBarang.findIndex(item => item.kode === itemId);
            
            if (itemIndex !== -1) {
                const oldStock = masterBarang[itemIndex].stok || 0;
                masterBarang[itemIndex].stok = newStock;
                masterBarang[itemIndex].tanggalUpdate = new Date().toISOString();
                
                localStorage.setItem('masterBarang', JSON.stringify(masterBarang));
                
                // Refresh transformation system cache
                if (this.stockManager.refreshStockCache) {
                    this.stockManager.refreshStockCache();
                }
                
                console.log(`Stock updated for ${itemId}: ${oldStock} -> ${newStock} (source: ${source})`);
            }
        } catch (error) {
            console.error('Error handling stock update:', error);
        }
    }

    /**
     * Handle transformation completion
     */
    async handleTransformationCompleted(transformationRecord) {
        try {
            // Update master barang data with new stock levels
            const masterBarang = this.getMasterBarangData();
            let updated = false;
            
            // Update source item stock
            const sourceIndex = masterBarang.findIndex(item => 
                item.kode === transformationRecord.sourceItem.id
            );
            if (sourceIndex !== -1) {
                masterBarang[sourceIndex].stok = transformationRecord.sourceItem.stockAfter;
                masterBarang[sourceIndex].tanggalUpdate = new Date().toISOString();
                updated = true;
            }
            
            // Update target item stock
            const targetIndex = masterBarang.findIndex(item => 
                item.kode === transformationRecord.targetItem.id
            );
            if (targetIndex !== -1) {
                masterBarang[targetIndex].stok = transformationRecord.targetItem.stockAfter;
                masterBarang[targetIndex].tanggalUpdate = new Date().toISOString();
                updated = true;
            }
            
            if (updated) {
                localStorage.setItem('masterBarang', JSON.stringify(masterBarang));
                
                // Dispatch event for other modules
                document.dispatchEvent(new CustomEvent('masterBarangStockUpdated', {
                    detail: {
                        sourceItem: transformationRecord.sourceItem,
                        targetItem: transformationRecord.targetItem,
                        transformationId: transformationRecord.id
                    }
                }));
            }
            
            console.log(`Master barang updated after transformation: ${transformationRecord.id}`);
        } catch (error) {
            console.error('Error handling transformation completion:', error);
        }
    }

    /**
     * Get transformable items for UI
     */
    async getTransformableItemsForUI() {
        try {
            if (!this.transformationManager) {
                return [];
            }
            
            const transformableItems = await this.transformationManager.getTransformableItems();
            
            // Enrich with current stock data
            const masterBarang = this.getMasterBarangData();
            
            transformableItems.forEach(group => {
                group.items.forEach(item => {
                    const masterItem = masterBarang.find(m => m.kode === item.id);
                    if (masterItem) {
                        item.stock = masterItem.stok || 0;
                        item.name = masterItem.nama;
                        item.supplier = masterItem.supplier;
                        item.hargaBeli = masterItem.hargaBeli;
                    }
                });
            });
            
            return transformableItems;
        } catch (error) {
            console.error('Error getting transformable items for UI:', error);
            return [];
        }
    }

    /**
     * Execute transformation with master barang integration
     */
    async executeTransformation(sourceItemId, targetItemId, quantity, user) {
        try {
            if (!this.transformationManager) {
                throw new Error('Transformation manager not initialized');
            }
            
            // Execute transformation
            const result = await this.transformationManager.executeTransformation({
                sourceItemId,
                targetItemId,
                quantity,
                user
            });
            
            // Dispatch completion event
            document.dispatchEvent(new CustomEvent('transformationCompleted', {
                detail: result
            }));
            
            return result;
        } catch (error) {
            console.error('Error executing transformation:', error);
            throw error;
        }
    }

    /**
     * Add new master barang item with transformation support
     */
    async addMasterBarangItem(itemData) {
        try {
            // Ensure baseProduct is set
            if (!itemData.baseProduct) {
                itemData.baseProduct = this.extractBaseProduct(itemData.kode);
            }
            
            // Add timestamps
            itemData.tanggalBuat = new Date().toISOString();
            itemData.tanggalUpdate = new Date().toISOString();
            
            // Get existing data
            const masterBarang = this.getMasterBarangData();
            
            // Check for duplicates
            const existingIndex = masterBarang.findIndex(item => item.kode === itemData.kode);
            if (existingIndex !== -1) {
                throw new Error(`Item dengan kode ${itemData.kode} sudah ada`);
            }
            
            // Add new item
            masterBarang.push(itemData);
            localStorage.setItem('masterBarang', JSON.stringify(masterBarang));
            
            // Dispatch event
            document.dispatchEvent(new CustomEvent('masterBarangAdded', {
                detail: itemData
            }));
            
            console.log(`Added new master barang item: ${itemData.kode}`);
            return itemData;
        } catch (error) {
            console.error('Error adding master barang item:', error);
            throw error;
        }
    }

    /**
     * Update master barang item with transformation support
     */
    async updateMasterBarangItem(kode, updates) {
        try {
            const masterBarang = this.getMasterBarangData();
            const itemIndex = masterBarang.findIndex(item => item.kode === kode);
            
            if (itemIndex === -1) {
                throw new Error(`Item dengan kode ${kode} tidak ditemukan`);
            }
            
            const oldItem = { ...masterBarang[itemIndex] };
            
            // Apply updates
            masterBarang[itemIndex] = {
                ...masterBarang[itemIndex],
                ...updates,
                tanggalUpdate: new Date().toISOString()
            };
            
            localStorage.setItem('masterBarang', JSON.stringify(masterBarang));
            
            // Dispatch event
            document.dispatchEvent(new CustomEvent('masterBarangUpdated', {
                detail: {
                    item: masterBarang[itemIndex],
                    oldItem: oldItem
                }
            }));
            
            console.log(`Updated master barang item: ${kode}`);
            return masterBarang[itemIndex];
        } catch (error) {
            console.error('Error updating master barang item:', error);
            throw error;
        }
    }

    /**
     * Get master barang data from localStorage
     */
    getMasterBarangData() {
        try {
            const data = localStorage.getItem('masterBarang');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting master barang data:', error);
            return [];
        }
    }

    /**
     * Save conversion ratios to localStorage
     */
    async saveConversionRatios() {
        try {
            const ratios = [];
            for (const [baseProduct, conversions] of this.conversionRatios.entries()) {
                ratios.push({
                    baseProduct,
                    conversions
                });
            }
            localStorage.setItem('conversionRatios', JSON.stringify(ratios));
        } catch (error) {
            console.error('Error saving conversion ratios:', error);
        }
    }

    /**
     * Get conversion options for a base product
     */
    getConversionOptions(baseProduct) {
        return this.conversionRatios.get(baseProduct) || [];
    }

    /**
     * Check if transformation is available for items
     */
    isTransformationAvailable(sourceItemId, targetItemId) {
        try {
            const masterBarang = this.getMasterBarangData();
            const sourceItem = masterBarang.find(item => item.kode === sourceItemId);
            const targetItem = masterBarang.find(item => item.kode === targetItemId);
            
            if (!sourceItem || !targetItem) {
                return false;
            }
            
            const sourceBaseProduct = sourceItem.baseProduct || this.extractBaseProduct(sourceItem.kode);
            const targetBaseProduct = targetItem.baseProduct || this.extractBaseProduct(targetItem.kode);
            
            return sourceBaseProduct === targetBaseProduct && 
                   this.conversionRatios.has(sourceBaseProduct);
        } catch (error) {
            console.error('Error checking transformation availability:', error);
            return false;
        }
    }

    /**
     * Get integration status
     */
    getIntegrationStatus() {
        return {
            initialized: this.initialized,
            transformationManagerReady: !!this.transformationManager,
            stockManagerReady: !!this.stockManager,
            conversionRatiosLoaded: this.conversionRatios.size > 0,
            totalConversionGroups: this.conversionRatios.size
        };
    }
}

// Initialize integration when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (!window.masterBarangIntegration) {
        window.masterBarangIntegration = new MasterBarangIntegration();
    }
});

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.MasterBarangIntegration = MasterBarangIntegration;
}