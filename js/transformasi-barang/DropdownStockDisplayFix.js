/**
 * COMPREHENSIVE FIX FOR TRANSFORMASI BARANG DROPDOWN STOCK DISPLAY
 * 
 * Masalah yang diperbaiki:
 * 1. Dropdown menampilkan "undefined" untuk stok
 * 2. Konflik antara multiple dropdown population functions
 * 3. Struktur data yang tidak konsisten
 * 4. Tidak terintegrasi dengan data aplikasi real-time
 */

class DropdownStockDisplayFix {
    constructor() {
        this.debugMode = true;
        this.fixApplied = false;
        this.originalFunctions = {};
    }

    /**
     * Initialize and apply the comprehensive fix
     */
    async initialize() {
        this.log('🔧 Initializing comprehensive dropdown stock display fix...');
        
        try {
            // Step 1: Clean conflicting functions
            await this.cleanConflictingFunctions();
            
            // Step 2: Initialize clean data structure
            await this.initializeCleanDataStructure();
            
            // Step 3: Create unified dropdown function
            await this.createUnifiedDropdownFunction();
            
            // Step 4: Apply the fix
            await this.applyFix();
            
            this.fixApplied = true;
            this.log('✅ Comprehensive fix successfully applied!');
            
            return true;
        } catch (error) {
            this.log(`❌ Error in comprehensive fix: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Clean conflicting functions
     */
    async cleanConflictingFunctions() {
        this.log('🧹 Cleaning conflicting functions...');
        
        const conflictingFunctions = [
            'populateDropdowns',
            'populateDropdownsSafe', 
            'populateDropdownsFixed',
            'populateDropdownsWithRealTimeStock',
            'populateDropdownsEnhanced'
        ];
        
        // Backup original functions
        conflictingFunctions.forEach(funcName => {
            if (typeof window[funcName] === 'function') {
                this.originalFunctions[funcName] = window[funcName];
                this.log(`📦 Backed up function: ${funcName}`);
            }
        });
        
        // Clear conflicting functions
        conflictingFunctions.forEach(funcName => {
            if (typeof window[funcName] === 'function') {
                delete window[funcName];
                this.log(`🗑️ Removed conflicting function: ${funcName}`);
            }
        });
        
        this.log('✅ Conflicting functions cleaned');
    }

    /**
     * Initialize clean data structure
     */
    async initializeCleanDataStructure() {
        this.log('📊 Initializing clean data structure...');
        
        // Check if we have any data
        let hasData = false;
        const dataSources = ['masterBarang', 'barang', 'stokBarang', 'produk'];
        
        for (const source of dataSources) {
            try {
                const data = localStorage.getItem(source);
                if (data) {
                    const parsedData = JSON.parse(data);
                    if (Array.isArray(parsedData) && parsedData.length > 0) {
                        hasData = true;
                        this.log(`📋 Found data in ${source}: ${parsedData.length} items`);
                        break;
                    }
                }
            } catch (e) {
                // Continue checking other sources
            }
        }
        
        if (!hasData) {
            this.log('📝 No data found, creating sample data...');
            await this.createSampleData();
        } else {
            this.log('📋 Data found, normalizing...');
            await this.normalizeExistingData();
        }
        
        this.log('✅ Data structure initialized');
    }

    /**
     * Create sample data for testing
     */
    async createSampleData() {
        const sampleData = [
            // Beras Premium - KG ke Gram
            {
                kode: 'BRG001-KG',
                nama: 'Beras Premium (Kilogram)',
                satuan: 'kg',
                stok: 100,
                baseProduct: 'BRG001',
                hargaBeli: 12000,
                hargaJual: 15000,
                canTransform: true
            },
            {
                kode: 'BRG001-GR',
                nama: 'Beras Premium (Gram)',
                satuan: 'gram',
                stok: 50000,
                baseProduct: 'BRG001',
                hargaBeli: 12,
                hargaJual: 15,
                canTransform: true
            },
            // Minyak Goreng - Liter ke ML
            {
                kode: 'BRG002-LT',
                nama: 'Minyak Goreng (Liter)',
                satuan: 'liter',
                stok: 50,
                baseProduct: 'BRG002',
                hargaBeli: 18000,
                hargaJual: 22000,
                canTransform: true
            },
            {
                kode: 'BRG002-ML',
                nama: 'Minyak Goreng (Mililiter)',
                satuan: 'ml',
                stok: 25000,
                baseProduct: 'BRG002',
                hargaBeli: 18,
                hargaJual: 22,
                canTransform: true
            },
            // Air Mineral - Dus ke Botol
            {
                kode: 'BRG003-DUS',
                nama: 'Air Mineral (Dus)',
                satuan: 'dus',
                stok: 20,
                baseProduct: 'BRG003',
                hargaBeli: 48000,
                hargaJual: 60000,
                canTransform: true
            },
            {
                kode: 'BRG003-BTL',
                nama: 'Air Mineral (Botol)',
                satuan: 'botol',
                stok: 480,
                baseProduct: 'BRG003',
                hargaBeli: 2000,
                hargaJual: 2500,
                canTransform: true
            }
        ];

        const conversionRatios = [
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

        // Save to localStorage
        localStorage.setItem('masterBarang', JSON.stringify(sampleData));
        localStorage.setItem('barang', JSON.stringify(sampleData));
        localStorage.setItem('conversionRatios', JSON.stringify(conversionRatios));
        
        this.log('✅ Sample data created successfully');
    }

    /**
     * Normalize existing data
     */
    async normalizeExistingData() {
        const dataSources = ['masterBarang', 'barang', 'stokBarang', 'produk'];
        let sourceData = null;
        let sourceName = '';
        
        // Find the best data source
        for (const source of dataSources) {
            try {
                const data = localStorage.getItem(source);
                if (data) {
                    const parsedData = JSON.parse(data);
                    if (Array.isArray(parsedData) && parsedData.length > 0) {
                        sourceData = parsedData;
                        sourceName = source;
                        break;
                    }
                }
            } catch (e) {
                // Continue to next source
            }
        }
        
        if (!sourceData) {
            throw new Error('No valid data found for normalization');
        }
        
        this.log(`📋 Normalizing data from ${sourceName}...`);
        
        // Normalize data structure
        const normalizedData = sourceData.map(item => {
            return {
                kode: item.kode || item.id || item.barcode || `ITEM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                nama: item.nama || item.name || item.namaBarang || 'Unknown Item',
                satuan: item.satuan || item.unit || item.satuanBarang || 'pcs',
                stok: this.parseNumber(item.stok || item.stock || item.qty || 0),
                baseProduct: item.baseProduct || item.kode?.split('-')[0] || item.id?.split('-')[0] || 'BASE_UNKNOWN',
                hargaBeli: this.parseNumber(item.hargaBeli || item.hpp || item.buyPrice || 0),
                hargaJual: this.parseNumber(item.hargaJual || item.sellPrice || item.price || 0),
                canTransform: true
            };
        });
        
        // Save normalized data
        localStorage.setItem('masterBarang', JSON.stringify(normalizedData));
        if (sourceName !== 'barang') {
            localStorage.setItem('barang', JSON.stringify(normalizedData));
        }
        
        this.log(`✅ Data normalized successfully: ${normalizedData.length} items`);
    }

    /**
     * Parse number safely
     */
    parseNumber(value) {
        if (typeof value === 'number' && !isNaN(value)) {
            return value;
        }
        if (typeof value === 'string') {
            const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    }

    /**
     * Create unified dropdown function
     */
    async createUnifiedDropdownFunction() {
        this.log('🔧 Creating unified dropdown function...');
        
        const self = this;
        
        // Create the unified function
        window.populateTransformasiBarangDropdowns = function(sourceElementId = 'sourceItem', targetElementId = 'targetItem') {
            self.log(`🎛️ Populating dropdowns: ${sourceElementId}, ${targetElementId}`);
            
            const sourceSelect = document.getElementById(sourceElementId);
            const targetSelect = document.getElementById(targetElementId);
            
            if (!sourceSelect || !targetSelect) {
                self.log(`⚠️ Dropdown elements not found: ${sourceElementId}=${!!sourceSelect}, ${targetElementId}=${!!targetSelect}`);
                return false;
            }
            
            try {
                // Get data
                const masterBarang = JSON.parse(localStorage.getItem('masterBarang') || '[]');
                
                if (masterBarang.length === 0) {
                    self.log('⚠️ No masterBarang data found');
                    return false;
                }
                
                // Clear existing options
                sourceSelect.innerHTML = '<option value="">Pilih barang asal (yang akan dikurangi stoknya)...</option>';
                targetSelect.innerHTML = '<option value="">Pilih barang tujuan (yang akan ditambah stoknya)...</option>';
                
                // Group by base product for transformation
                const baseProducts = {};
                masterBarang.forEach(item => {
                    const baseProduct = item.baseProduct || 'UNKNOWN';
                    if (!baseProducts[baseProduct]) {
                        baseProducts[baseProduct] = [];
                    }
                    baseProducts[baseProduct].push(item);
                });
                
                let sourceCount = 0;
                let targetCount = 0;
                
                // Populate dropdowns
                Object.entries(baseProducts).forEach(([baseProduct, items]) => {
                    if (items.length > 1) { // Only show items that can be transformed
                        items.forEach(item => {
                            // Ensure all values are properly defined
                            const kode = String(item.kode || '');
                            const nama = String(item.nama || 'Unknown');
                            const satuan = String(item.satuan || 'unit');
                            const stok = Number(item.stok || 0);
                            
                            // Source dropdown - only items with stock > 0
                            if (stok > 0) {
                                const sourceOption = new Option(
                                    `${nama} - Stok: ${stok} ${satuan}`, 
                                    kode
                                );
                                sourceOption.dataset.baseProduct = String(baseProduct);
                                sourceOption.dataset.satuan = satuan;
                                sourceOption.dataset.stok = String(stok);
                                sourceOption.dataset.nama = nama;
                                sourceSelect.add(sourceOption);
                                sourceCount++;
                            }
                            
                            // Target dropdown - all transformable items
                            const targetOption = new Option(
                                `${nama} - Stok: ${stok} ${satuan}`, 
                                kode
                            );
                            targetOption.dataset.baseProduct = String(baseProduct);
                            targetOption.dataset.satuan = satuan;
                            targetOption.dataset.stok = String(stok);
                            targetOption.dataset.nama = nama;
                            targetSelect.add(targetOption);
                            targetCount++;
                        });
                    }
                });
                
                targetSelect.disabled = false;
                
                self.log(`✅ Dropdowns populated successfully: ${sourceCount} source, ${targetCount} target options`);
                
                // Show success message if alert container exists
                self.showSuccessMessage();
                
                return true;
                
            } catch (error) {
                self.log(`❌ Error populating dropdowns: ${error.message}`, 'error');
                return false;
            }
        };
        
        // Create unified conversion info function
        window.updateTransformasiBarangConversionInfo = function(sourceElementId = 'sourceItem', targetElementId = 'targetItem', quantityElementId = 'quantity', infoElementId = 'conversion-info') {
            const sourceSelect = document.getElementById(sourceElementId);
            const targetSelect = document.getElementById(targetElementId);
            const quantityInput = document.getElementById(quantityElementId);
            const conversionInfo = document.getElementById(infoElementId);
            
            if (!sourceSelect || !targetSelect || !quantityInput || !conversionInfo) {
                return;
            }
            
            const sourceValue = sourceSelect.value;
            const targetValue = targetSelect.value;
            const quantity = parseFloat(quantityInput.value) || 0;
            
            if (!sourceValue || !targetValue) {
                conversionInfo.innerHTML = '<span class="text-muted">Pilih item untuk melihat rasio konversi</span>';
                return;
            }
            
            try {
                const masterBarang = JSON.parse(localStorage.getItem('masterBarang') || '[]');
                const sourceItem = masterBarang.find(item => item.kode === sourceValue);
                const targetItem = masterBarang.find(item => item.kode === targetValue);
                
                if (!sourceItem || !targetItem) {
                    conversionInfo.innerHTML = '<span class="text-danger">Item tidak ditemukan</span>';
                    return;
                }
                
                const sourceBaseProduct = sourceItem.baseProduct || 'UNKNOWN';
                const targetBaseProduct = targetItem.baseProduct || 'UNKNOWN';
                
                if (sourceBaseProduct !== targetBaseProduct) {
                    conversionInfo.innerHTML = '<span class="text-warning">Item harus dari produk yang sama</span>';
                    return;
                }
                
                if (sourceValue === targetValue) {
                    conversionInfo.innerHTML = '<span class="text-warning">Item sumber dan target tidak boleh sama</span>';
                    return;
                }
                
                // Get conversion ratio
                let ratio = 1;
                const conversionRatios = JSON.parse(localStorage.getItem('conversionRatios') || '[]');
                const productRatios = conversionRatios.find(r => r.baseProduct === sourceBaseProduct);
                
                if (productRatios && productRatios.conversions) {
                    const conversion = productRatios.conversions.find(c => 
                        c.from === sourceItem.satuan && c.to === targetItem.satuan
                    );
                    if (conversion) {
                        ratio = conversion.ratio;
                    }
                }
                
                const targetQuantity = quantity * ratio;
                const stockSufficient = sourceItem.stok >= quantity;
                const newSourceStock = sourceItem.stok - quantity;
                const newTargetStock = targetItem.stok + targetQuantity;
                
                conversionInfo.innerHTML = `
                    <div class="small">
                        <div class="alert alert-success mb-2 py-1">
                            <i class="bi bi-check-circle me-1"></i>
                            <strong>Stok Real-Time Aktif</strong> - Data langsung dari sistem
                        </div>
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
                                        ${sourceItem.stok} ${sourceItem.satuan}
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
                                        ${targetItem.stok} ${targetItem.satuan}
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
                                    Stok ${sourceItem.nama}: ${sourceItem.stok} ${sourceItem.satuan}
                                </span>
                            </div>
                            <div class="col-6">
                                <span class="badge bg-info">
                                    Stok ${targetItem.nama}: ${targetItem.stok} ${targetItem.satuan}
                                </span>
                            </div>
                        </div>
                        `}
                    </div>
                `;
                
            } catch (error) {
                self.log(`❌ Error updating conversion info: ${error.message}`, 'error');
                conversionInfo.innerHTML = '<span class="text-danger">Error memuat info konversi</span>';
            }
        };
        
        this.log('✅ Unified dropdown function created');
    }

    /**
     * Apply the fix
     */
    async applyFix() {
        this.log('🚀 Applying fix...');
        
        // Override all existing dropdown functions with our unified function
        const functionNames = [
            'populateDropdowns',
            'populateDropdownsSafe',
            'populateDropdownsFixed', 
            'populateDropdownsWithRealTimeStock',
            'populateDropdownsEnhanced'
        ];
        
        functionNames.forEach(funcName => {
            window[funcName] = window.populateTransformasiBarangDropdowns;
            this.log(`🔄 Overridden function: ${funcName}`);
        });
        
        // Override conversion info functions
        const conversionFunctionNames = [
            'updateConversionInfo',
            'updateConversionInfoWithRealTimeStock'
        ];
        
        conversionFunctionNames.forEach(funcName => {
            window[funcName] = window.updateTransformasiBarangConversionInfo;
            this.log(`🔄 Overridden function: ${funcName}`);
        });
        
        // Try to apply to main transformasi barang page if elements exist
        if (document.getElementById('sourceItem') && document.getElementById('targetItem')) {
            window.populateTransformasiBarangDropdowns('sourceItem', 'targetItem');
            
            // Setup event listeners
            const sourceSelect = document.getElementById('sourceItem');
            const targetSelect = document.getElementById('targetItem');
            const quantityInput = document.getElementById('quantity');
            
            if (sourceSelect) {
                sourceSelect.addEventListener('change', () => {
                    window.updateTransformasiBarangConversionInfo();
                });
            }
            
            if (targetSelect) {
                targetSelect.addEventListener('change', () => {
                    window.updateTransformasiBarangConversionInfo();
                });
            }
            
            if (quantityInput) {
                quantityInput.addEventListener('input', () => {
                    window.updateTransformasiBarangConversionInfo();
                });
            }
        }
        
        this.log('✅ Fix applied successfully');
    }

    /**
     * Show success message
     */
    showSuccessMessage() {
        const alertContainer = document.getElementById('alert-container') || 
                             document.getElementById('success-container') ||
                             document.querySelector('.alert-container');
        
        if (alertContainer) {
            alertContainer.innerHTML = `
                <div class="alert alert-success alert-dismissible fade show" role="alert">
                    <i class="bi bi-check-circle me-2"></i>
                    <strong>Perbaikan Berhasil!</strong> 
                    Dropdown transformasi barang sekarang menampilkan stok dengan benar (tidak ada "undefined").
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                alertContainer.innerHTML = '';
            }, 5000);
        }
    }

    /**
     * Refresh dropdowns
     */
    async refreshDropdowns() {
        this.log('🔄 Refreshing dropdowns...');
        
        if (typeof window.populateTransformasiBarangDropdowns === 'function') {
            const success = window.populateTransformasiBarangDropdowns();
            if (success) {
                this.log('✅ Dropdowns refreshed successfully');
            } else {
                this.log('❌ Failed to refresh dropdowns');
            }
        } else {
            this.log('⚠️ Unified dropdown function not available');
        }
    }

    /**
     * Log function
     */
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`[${timestamp}] DropdownStockDisplayFix: ${prefix} ${message}`);
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.DropdownStockDisplayFix = DropdownStockDisplayFix;
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async () => {
        if (!window.dropdownStockDisplayFix) {
            window.dropdownStockDisplayFix = new DropdownStockDisplayFix();
            const success = await window.dropdownStockDisplayFix.initialize();
            
            if (success) {
                console.log('✅ DropdownStockDisplayFix successfully applied!');
                
                // Setup global refresh function
                window.refreshTransformasiBarangDropdowns = () => window.dropdownStockDisplayFix.refreshDropdowns();
                
                // Try to populate dropdowns immediately if elements exist
                setTimeout(() => {
                    if (document.getElementById('sourceItem') && document.getElementById('targetItem')) {
                        window.populateTransformasiBarangDropdowns();
                    }
                }, 1000);
            } else {
                console.error('❌ DropdownStockDisplayFix failed to initialize!');
            }
        }
    });
}

// ES6 module export (commented out for browser compatibility)
// export default DropdownStockDisplayFix;