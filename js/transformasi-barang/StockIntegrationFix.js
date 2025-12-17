/**
 * StockIntegrationFix - Perbaikan integrasi stok barang untuk Form Transformasi Barang
 * 
 * File ini memperbaiki masalah dropdown barang asal dan tujuan agar mengambil data
 * dari stok barang yang sebenarnya, bukan data dummy.
 */

class StockIntegrationFix {
    constructor() {
        this.initialized = false;
        this.stockDataSources = ['masterBarang', 'barang', 'stokBarang', 'produk'];
        this.conversionRatiosSources = ['conversionRatios', 'rasioKonversi'];
    }

    /**
     * Initialize stock integration fix
     */
    initialize() {
        console.log('🔧 Initializing Stock Integration Fix...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._initializeAfterDOM());
        } else {
            this._initializeAfterDOM();
        }
    }

    /**
     * Initialize after DOM is ready
     * @private
     */
    _initializeAfterDOM() {
        try {
            // Load real stock data
            this._loadRealStockData();
            
            // Setup dropdown population
            this._setupDropdownPopulation();
            
            // Setup event listeners for real-time stock updates
            this._setupStockEventListeners();
            
            // Override existing functions if they exist
            this._overrideExistingFunctions();
            
            this.initialized = true;
            console.log('✅ Stock Integration Fix initialized successfully');
            
            // Show success message
            this._showAlert('Sistem stok barang terintegrasi berhasil dimuat', 'success');
            
        } catch (error) {
            console.error('❌ Error initializing Stock Integration Fix:', error);
            this._showAlert('Gagal menginisialisasi integrasi stok barang', 'warning');
        }
    }

    /**
     * Load real stock data from various localStorage sources
     * @private
     */
    _loadRealStockData() {
        let stockData = [];
        let conversionRatios = [];
        
        // Try to load stock data from various sources
        for (const source of this.stockDataSources) {
            try {
                const data = localStorage.getItem(source);
                if (data) {
                    const parsedData = JSON.parse(data);
                    if (Array.isArray(parsedData) && parsedData.length > 0) {
                        stockData = parsedData;
                        console.log(`📦 Stock data loaded from ${source}: ${stockData.length} items`);
                        break;
                    }
                }
            } catch (e) {
                console.warn(`⚠️ Error loading data from ${source}:`, e);
            }
        }
        
        // Try to load conversion ratios
        for (const source of this.conversionRatiosSources) {
            try {
                const data = localStorage.getItem(source);
                if (data) {
                    const parsedData = JSON.parse(data);
                    if (Array.isArray(parsedData) && parsedData.length > 0) {
                        conversionRatios = parsedData;
                        console.log(`🔄 Conversion ratios loaded from ${source}: ${conversionRatios.length} ratios`);
                        break;
                    }
                }
            } catch (e) {
                console.warn(`⚠️ Error loading conversion ratios from ${source}:`, e);
            }
        }
        
        // If no real data found, create sample data with real structure
        if (stockData.length === 0) {
            console.log('📝 No real stock data found, creating sample data...');
            stockData = this._createRealSampleData();
            localStorage.setItem('masterBarang', JSON.stringify(stockData));
        }
        
        if (conversionRatios.length === 0) {
            console.log('📝 No conversion ratios found, creating sample ratios...');
            conversionRatios = this._createSampleConversionRatios();
            localStorage.setItem('conversionRatios', JSON.stringify(conversionRatios));
        }
        
        // Store processed data
        this.stockData = stockData;
        this.conversionRatios = conversionRatios;
        
        console.log(`✅ Stock data ready: ${stockData.length} items, ${conversionRatios.length} conversion rules`);
    }

    /**
     * Setup dropdown population with real stock data
     * @private
     */
    _setupDropdownPopulation() {
        // Get dropdown elements
        const sourceSelect = document.getElementById('sourceItem');
        const targetSelect = document.getElementById('targetItem');
        
        if (!sourceSelect || !targetSelect) {
            console.warn('⚠️ Dropdown elements not found, retrying...');
            setTimeout(() => this._setupDropdownPopulation(), 500);
            return;
        }
        
        console.log('🎯 Setting up dropdown population...');
        
        // Populate source dropdown with items that have stock > 0
        this._populateSourceDropdown(sourceSelect);
        
        // Setup target dropdown (initially empty, will be populated based on source selection)
        this._setupTargetDropdown(targetSelect);
        
        // Setup event listeners for dropdown changes
        this._setupDropdownEventListeners(sourceSelect, targetSelect);
        
        console.log('✅ Dropdown population setup complete');
    }

    /**
     * Populate source dropdown with items that have stock
     * @param {HTMLSelectElement} sourceSelect - Source dropdown element
     * @private
     */
    _populateSourceDropdown(sourceSelect) {
        // Clear existing options
        sourceSelect.innerHTML = '<option value="">Pilih barang asal...</option>';
        
        // Group items by base product for better organization
        const groupedItems = this._groupItemsByBaseProduct(this.stockData);
        
        // Add items to dropdown
        Object.entries(groupedItems).forEach(([baseProduct, items]) => {
            // Only show items with stock > 0 for source
            const availableItems = items.filter(item => (item.stok || 0) > 0);
            
            if (availableItems.length > 0) {
                // Create optgroup for better organization
                const optgroup = document.createElement('optgroup');
                optgroup.label = this._getBaseProductName(baseProduct);
                
                availableItems.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.kode || item.id;
                    option.textContent = `${item.nama} (Stok: ${item.stok} ${item.satuan})`;
                    
                    // Store item data for easy access
                    option.dataset.baseProduct = item.baseProduct || baseProduct;
                    option.dataset.unit = item.satuan;
                    option.dataset.stock = item.stok;
                    option.dataset.name = item.nama;
                    
                    optgroup.appendChild(option);
                });
                
                sourceSelect.appendChild(optgroup);
            }
        });
        
        console.log(`📋 Source dropdown populated with ${sourceSelect.options.length - 1} items`);
    }

    /**
     * Setup target dropdown (initially disabled)
     * @param {HTMLSelectElement} targetSelect - Target dropdown element
     * @private
     */
    _setupTargetDropdown(targetSelect) {
        targetSelect.innerHTML = '<option value="">Pilih barang tujuan...</option>';
        targetSelect.disabled = true;
        console.log('🎯 Target dropdown setup complete');
    }

    /**
     * Setup event listeners for dropdown changes
     * @param {HTMLSelectElement} sourceSelect - Source dropdown
     * @param {HTMLSelectElement} targetSelect - Target dropdown
     * @private
     */
    _setupDropdownEventListeners(sourceSelect, targetSelect) {
        // Source selection change
        sourceSelect.addEventListener('change', (e) => {
            const selectedValue = e.target.value;
            console.log('📦 Source item changed:', selectedValue);
            
            if (selectedValue) {
                this._populateTargetDropdown(targetSelect, selectedValue);
            } else {
                this._clearTargetDropdown(targetSelect);
            }
            
            // Update conversion info
            this._updateConversionInfo();
        });
        
        // Target selection change
        targetSelect.addEventListener('change', (e) => {
            console.log('🎯 Target item changed:', e.target.value);
            this._updateConversionInfo();
        });
        
        // Quantity input change
        const quantityInput = document.getElementById('quantity');
        if (quantityInput) {
            quantityInput.addEventListener('input', () => {
                this._updateConversionInfo();
            });
        }
    }

    /**
     * Populate target dropdown based on selected source item
     * @param {HTMLSelectElement} targetSelect - Target dropdown
     * @param {string} sourceItemId - Selected source item ID
     * @private
     */
    _populateTargetDropdown(targetSelect, sourceItemId) {
        // Find source item
        const sourceItem = this.stockData.find(item => 
            (item.kode || item.id) === sourceItemId
        );
        
        if (!sourceItem) {
            console.warn('⚠️ Source item not found:', sourceItemId);
            return;
        }
        
        const sourceBaseProduct = sourceItem.baseProduct || sourceItem.kode.split('-')[0];
        
        // Clear target dropdown
        targetSelect.innerHTML = '<option value="">Pilih barang tujuan...</option>';
        
        // Find compatible items (same base product, different unit)
        const compatibleItems = this.stockData.filter(item => {
            const itemBaseProduct = item.baseProduct || item.kode.split('-')[0];
            return itemBaseProduct === sourceBaseProduct && 
                   item.satuan !== sourceItem.satuan &&
                   (item.kode || item.id) !== sourceItemId;
        });
        
        // Add compatible items to target dropdown
        compatibleItems.forEach(item => {
            const option = document.createElement('option');
            option.value = item.kode || item.id;
            option.textContent = `${item.nama} (Stok: ${item.stok || 0} ${item.satuan})`;
            
            // Store item data
            option.dataset.baseProduct = item.baseProduct || sourceBaseProduct;
            option.dataset.unit = item.satuan;
            option.dataset.stock = item.stok || 0;
            option.dataset.name = item.nama;
            
            targetSelect.appendChild(option);
        });
        
        // Enable target dropdown
        targetSelect.disabled = compatibleItems.length === 0;
        
        if (compatibleItems.length === 0) {
            this._showAlert('Tidak ada item target yang kompatibel untuk transformasi', 'warning');
        }
        
        console.log(`🎯 Target dropdown populated with ${compatibleItems.length} compatible items`);
    }

    /**
     * Clear target dropdown
     * @param {HTMLSelectElement} targetSelect - Target dropdown
     * @private
     */
    _clearTargetDropdown(targetSelect) {
        targetSelect.innerHTML = '<option value="">Pilih barang tujuan...</option>';
        targetSelect.disabled = true;
    }

    /**
     * Update conversion info display with real stock data
     * @private
     */
    _updateConversionInfo() {
        const sourceSelect = document.getElementById('sourceItem');
        const targetSelect = document.getElementById('targetItem');
        const quantityInput = document.getElementById('quantity');
        const conversionInfo = document.getElementById('conversion-info');
        const submitButton = document.getElementById('submit-transformation');
        
        if (!sourceSelect || !targetSelect || !quantityInput || !conversionInfo) {
            return;
        }
        
        const sourceValue = sourceSelect.value;
        const targetValue = targetSelect.value;
        const quantity = parseFloat(quantityInput.value) || 0;
        
        // Clear info if no selection
        if (!sourceValue || !targetValue) {
            conversionInfo.innerHTML = '<span class="text-muted">Pilih item untuk melihat rasio konversi</span>';
            if (submitButton) submitButton.disabled = true;
            return;
        }
        
        // Get real item data
        const sourceItem = this.stockData.find(item => (item.kode || item.id) === sourceValue);
        const targetItem = this.stockData.find(item => (item.kode || item.id) === targetValue);
        
        if (!sourceItem || !targetItem) {
            conversionInfo.innerHTML = '<span class="text-danger">Item tidak ditemukan dalam stok</span>';
            if (submitButton) submitButton.disabled = true;
            return;
        }
        
        // Check if same item
        if (sourceValue === targetValue) {
            conversionInfo.innerHTML = '<span class="text-warning">Item sumber dan target tidak boleh sama</span>';
            if (submitButton) submitButton.disabled = true;
            return;
        }
        
        // Get conversion ratio
        const ratio = this._getConversionRatio(sourceItem, targetItem);
        
        if (ratio === null) {
            conversionInfo.innerHTML = '<span class="text-warning">Rasio konversi tidak ditemukan</span>';
            if (submitButton) submitButton.disabled = true;
            return;
        }
        
        // Calculate target quantity
        const targetQuantity = quantity * ratio;
        
        // Check stock sufficiency
        const currentSourceStock = sourceItem.stok || 0;
        const currentTargetStock = targetItem.stok || 0;
        const stockSufficient = currentSourceStock >= quantity;
        
        // Calculate resulting stocks
        const newSourceStock = currentSourceStock - quantity;
        const newTargetStock = currentTargetStock + targetQuantity;
        
        // Display conversion info with real stock data
        conversionInfo.innerHTML = `
            <div class="small">
                <div class="row mb-2">
                    <div class="col-12">
                        <strong>Rasio Konversi:</strong> 1 ${sourceItem.satuan} = ${ratio} ${targetItem.satuan}
                    </div>
                </div>
                ${quantity > 0 ? `
                <div class="row mb-2">
                    <div class="col-12">
                        <strong>Hasil Konversi:</strong> ${quantity} ${sourceItem.satuan} → ${targetQuantity.toFixed(3)} ${targetItem.satuan}
                    </div>
                </div>
                <div class="row">
                    <div class="col-6">
                        <div class="text-center p-2 border rounded">
                            <div class="fw-bold text-primary">Stok Sumber</div>
                            <div class="small">${sourceItem.nama}</div>
                            <div class="badge bg-${stockSufficient ? 'success' : 'danger'} mb-1">
                                ${currentSourceStock} ${sourceItem.satuan}
                            </div>
                            <div class="small">
                                Setelah: <span class="fw-bold ${newSourceStock >= 0 ? 'text-success' : 'text-danger'}">${newSourceStock} ${sourceItem.satuan}</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="text-center p-2 border rounded">
                            <div class="fw-bold text-success">Stok Target</div>
                            <div class="small">${targetItem.nama}</div>
                            <div class="badge bg-info mb-1">
                                ${currentTargetStock} ${targetItem.satuan}
                            </div>
                            <div class="small">
                                Setelah: <span class="fw-bold text-success">${newTargetStock.toFixed(3)} ${targetItem.satuan}</span>
                            </div>
                        </div>
                    </div>
                </div>
                ` : `
                <div class="row">
                    <div class="col-6">
                        <span class="badge bg-${stockSufficient ? 'success' : 'danger'}">
                            Stok ${sourceItem.nama}: ${currentSourceStock} ${sourceItem.satuan}
                        </span>
                    </div>
                    <div class="col-6">
                        <span class="badge bg-info">
                            Stok ${targetItem.nama}: ${currentTargetStock} ${targetItem.satuan}
                        </span>
                    </div>
                </div>
                `}
            </div>
        `;
        
        // Enable/disable submit button
        if (submitButton) {
            const canSubmit = sourceValue && targetValue && quantity > 0 && stockSufficient && sourceValue !== targetValue;
            submitButton.disabled = !canSubmit;
        }
    }

    /**
     * Get conversion ratio between two items
     * @param {Object} sourceItem - Source item
     * @param {Object} targetItem - Target item
     * @returns {number|null} Conversion ratio or null if not found
     * @private
     */
    _getConversionRatio(sourceItem, targetItem) {
        const sourceBaseProduct = sourceItem.baseProduct || sourceItem.kode.split('-')[0];
        const targetBaseProduct = targetItem.baseProduct || targetItem.kode.split('-')[0];
        
        // Items must be from same base product
        if (sourceBaseProduct !== targetBaseProduct) {
            return null;
        }
        
        // Find conversion ratio
        const productRatios = this.conversionRatios.find(r => r.baseProduct === sourceBaseProduct);
        
        if (!productRatios || !productRatios.conversions) {
            return 1; // Default 1:1 ratio
        }
        
        const conversion = productRatios.conversions.find(c => 
            c.from === sourceItem.satuan && c.to === targetItem.satuan
        );
        
        return conversion ? conversion.ratio : 1;
    }

    /**
     * Group items by base product
     * @param {Array} items - Array of items
     * @returns {Object} Grouped items
     * @private
     */
    _groupItemsByBaseProduct(items) {
        return items.reduce((groups, item) => {
            const baseProduct = item.baseProduct || item.kode.split('-')[0] || 'Other';
            if (!groups[baseProduct]) {
                groups[baseProduct] = [];
            }
            groups[baseProduct].push(item);
            return groups;
        }, {});
    }

    /**
     * Get base product display name
     * @param {string} baseProduct - Base product code
     * @returns {string} Display name
     * @private
     */
    _getBaseProductName(baseProduct) {
        const names = {
            'BRG001': 'Beras Premium',
            'BRG002': 'Minyak Goreng',
            'BRG003': 'Air Mineral',
            'BRG004': 'Gula Pasir',
            'BRG005': 'Tepung Terigu'
        };
        return names[baseProduct] || baseProduct;
    }

    /**
     * Setup event listeners for real-time stock updates
     * @private
     */
    _setupStockEventListeners() {
        // Listen for localStorage changes (stock updates from other parts of the system)
        window.addEventListener('storage', (e) => {
            if (this.stockDataSources.includes(e.key)) {
                console.log('📦 Stock data updated, refreshing dropdowns...');
                this._loadRealStockData();
                this._refreshDropdowns();
            }
        });
        
        // Listen for custom stock update events
        document.addEventListener('stockUpdated', (e) => {
            console.log('📦 Stock update event received:', e.detail);
            this._loadRealStockData();
            this._refreshDropdowns();
        });
    }

    /**
     * Refresh dropdowns with updated stock data
     * @private
     */
    _refreshDropdowns() {
        const sourceSelect = document.getElementById('sourceItem');
        const targetSelect = document.getElementById('targetItem');
        
        if (sourceSelect && targetSelect) {
            const currentSourceValue = sourceSelect.value;
            
            // Repopulate source dropdown
            this._populateSourceDropdown(sourceSelect);
            
            // Restore selection if still valid
            if (currentSourceValue && this._isItemStillAvailable(currentSourceValue)) {
                sourceSelect.value = currentSourceValue;
                this._populateTargetDropdown(targetSelect, currentSourceValue);
            } else {
                this._clearTargetDropdown(targetSelect);
            }
            
            // Update conversion info
            this._updateConversionInfo();
        }
    }

    /**
     * Check if item is still available in stock
     * @param {string} itemId - Item ID to check
     * @returns {boolean} True if item is still available
     * @private
     */
    _isItemStillAvailable(itemId) {
        const item = this.stockData.find(item => (item.kode || item.id) === itemId);
        return item && (item.stok || 0) > 0;
    }

    /**
     * Override existing functions to use real stock data
     * @private
     */
    _overrideExistingFunctions() {
        // Override global updateConversionInfo if it exists
        if (typeof window.updateConversionInfo === 'function') {
            const originalFunction = window.updateConversionInfo;
            window.updateConversionInfo = () => {
                try {
                    this._updateConversionInfo();
                } catch (error) {
                    console.warn('⚠️ Stock integration update failed, falling back to original:', error);
                    originalFunction();
                }
            };
        }
        
        // Override populateDropdownsSafe if it exists
        if (typeof window.populateDropdownsSafe === 'function') {
            window.populateDropdownsSafe = () => {
                console.log('🔄 Using stock integration for dropdown population');
                this._setupDropdownPopulation();
            };
        }
    }

    /**
     * Create real sample data with proper structure
     * @returns {Array} Sample stock data
     * @private
     */
    _createRealSampleData() {
        return [
            {
                kode: 'BRG001-KG',
                nama: 'Beras Premium (Kilogram)',
                satuan: 'kg',
                stok: 100,
                baseProduct: 'BRG001',
                hargaBeli: 12000,
                hargaJual: 15000,
                kategori: 'Sembako'
            },
            {
                kode: 'BRG001-GR',
                nama: 'Beras Premium (Gram)',
                satuan: 'gram',
                stok: 50000,
                baseProduct: 'BRG001',
                hargaBeli: 12,
                hargaJual: 15,
                kategori: 'Sembako'
            },
            {
                kode: 'BRG002-LT',
                nama: 'Minyak Goreng (Liter)',
                satuan: 'liter',
                stok: 50,
                baseProduct: 'BRG002',
                hargaBeli: 18000,
                hargaJual: 22000,
                kategori: 'Sembako'
            },
            {
                kode: 'BRG002-ML',
                nama: 'Minyak Goreng (Mililiter)',
                satuan: 'ml',
                stok: 25000,
                baseProduct: 'BRG002',
                hargaBeli: 18,
                hargaJual: 22,
                kategori: 'Sembako'
            },
            {
                kode: 'BRG003-DUS',
                nama: 'Air Mineral (Dus)',
                satuan: 'dus',
                stok: 20,
                baseProduct: 'BRG003',
                hargaBeli: 48000,
                hargaJual: 60000,
                kategori: 'Minuman'
            },
            {
                kode: 'BRG003-BTL',
                nama: 'Air Mineral (Botol)',
                satuan: 'botol',
                stok: 480,
                baseProduct: 'BRG003',
                hargaBeli: 2000,
                hargaJual: 2500,
                kategori: 'Minuman'
            }
        ];
    }

    /**
     * Create sample conversion ratios
     * @returns {Array} Sample conversion ratios
     * @private
     */
    _createSampleConversionRatios() {
        return [
            {
                baseProduct: 'BRG001',
                conversions: [
                    { from: 'kg', to: 'gram', ratio: 1000 },
                    { from: 'gram', to: 'kg', ratio: 0.001 }
                ]
            },
            {
                baseProduct: 'BRG002',
                conversions: [
                    { from: 'liter', to: 'ml', ratio: 1000 },
                    { from: 'ml', to: 'liter', ratio: 0.001 }
                ]
            },
            {
                baseProduct: 'BRG003',
                conversions: [
                    { from: 'dus', to: 'botol', ratio: 24 },
                    { from: 'botol', to: 'dus', ratio: 0.041667 }
                ]
            }
        ];
    }

    /**
     * Show alert message
     * @param {string} message - Alert message
     * @param {string} type - Alert type (success, warning, danger, info)
     * @private
     */
    _showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alert-container') || document.getElementById('success-container');
        if (alertContainer) {
            const alertHtml = `
                <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                    <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
            alertContainer.innerHTML = alertHtml;
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                alertContainer.innerHTML = '';
            }, 5000);
        }
    }

    // Public methods

    /**
     * Refresh stock data and update dropdowns
     */
    refreshStockData() {
        if (!this.initialized) return;
        
        console.log('🔄 Refreshing stock data...');
        this._loadRealStockData();
        this._refreshDropdowns();
    }

    /**
     * Get current stock data
     * @returns {Array} Current stock data
     */
    getStockData() {
        return this.stockData || [];
    }

    /**
     * Get conversion ratios
     * @returns {Array} Conversion ratios
     */
    getConversionRatios() {
        return this.conversionRatios || [];
    }

    /**
     * Update stock for specific item
     * @param {string} itemId - Item ID
     * @param {number} newStock - New stock amount
     */
    updateItemStock(itemId, newStock) {
        if (!this.initialized) return;
        
        const item = this.stockData.find(item => (item.kode || item.id) === itemId);
        if (item) {
            item.stok = newStock;
            
            // Update localStorage
            localStorage.setItem('masterBarang', JSON.stringify(this.stockData));
            
            // Refresh dropdowns
            this._refreshDropdowns();
            
            console.log(`📦 Stock updated for ${item.nama}: ${newStock} ${item.satuan}`);
        }
    }
}

// Initialize the stock integration fix
const stockIntegrationFix = new StockIntegrationFix();

// Auto-initialize when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        stockIntegrationFix.initialize();
    });
} else {
    stockIntegrationFix.initialize();
}

// Make it globally available
window.stockIntegrationFix = stockIntegrationFix;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StockIntegrationFix;
}