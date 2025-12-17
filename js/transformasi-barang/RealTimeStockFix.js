/**
 * RealTimeStockFix - Perbaikan komprehensif untuk masalah stok real-time
 * pada dropdown transformasi barang
 * 
 * Masalah yang diperbaiki:
 * 1. Dropdown tidak menampilkan stok saat ini
 * 2. Menampilkan "undefined" pada dropdown
 * 3. Data tidak terintegrasi dengan sistem aplikasi
 * 4. Format data tidak konsisten
 */

class RealTimeStockFix {
    constructor() {
        this.masterBarang = [];
        this.kategori = [];
        this.satuan = [];
        this.conversionRatios = [];
        this.initialized = false;
        this.debugMode = true;
    }

    /**
     * Initialize the real-time stock fix
     */
    async initialize() {
        try {
            this.debug('🔧 Initializing RealTimeStockFix...');
            
            // Step 1: Load and validate data
            await this.loadApplicationData();
            
            // Step 2: Create transformation variants
            await this.createTransformationVariants();
            
            // Step 3: Setup conversion ratios
            await this.setupConversionRatios();
            
            // Step 4: Apply the fix to existing functions
            this.applyStockFix();
            
            this.initialized = true;
            this.debug('✅ RealTimeStockFix initialized successfully!');
            
            return true;
        } catch (error) {
            console.error('❌ RealTimeStockFix initialization failed:', error);
            return false;
        }
    }

    /**
     * Load application data from localStorage
     */
    async loadApplicationData() {
        this.debug('📦 Loading application data...');
        
        try {
            // Try to load from multiple sources
            const dataSources = ['barang', 'masterBarang', 'stokBarang', 'produk'];
            let dataLoaded = false;
            
            for (const source of dataSources) {
                try {
                    const data = localStorage.getItem(source);
                    if (data) {
                        const parsedData = JSON.parse(data);
                        if (Array.isArray(parsedData) && parsedData.length > 0) {
                            this.masterBarang = parsedData;
                            dataLoaded = true;
                            this.debug(`✅ Data loaded from ${source}: ${parsedData.length} items`);
                            break;
                        }
                    }
                } catch (e) {
                    this.debug(`⚠️ Error loading from ${source}: ${e.message}`);
                }
            }
            
            // Load supporting data
            try {
                this.kategori = JSON.parse(localStorage.getItem('kategori') || '[]');
                this.satuan = JSON.parse(localStorage.getItem('satuan') || '[]');
                this.debug(`📋 Supporting data: ${this.kategori.length} categories, ${this.satuan.length} units`);
            } catch (e) {
                this.debug(`⚠️ Error loading supporting data: ${e.message}`);
            }
            
            // Initialize sample data if no real data found
            if (!dataLoaded) {
                this.debug('📝 No real data found, initializing sample data...');
                this.initializeSampleData();
            }
            
            // Validate and clean data
            this.validateData();
            
        } catch (error) {
            throw new Error(`Failed to load application data: ${error.message}`);
        }
    }

    /**
     * Initialize sample data for testing
     */
    initializeSampleData() {
        this.kategori = [
            { id: 'KAT001', nama: 'Beras & Padi-padian' },
            { id: 'KAT002', nama: 'Minyak & Lemak' },
            { id: 'KAT003', nama: 'Minuman' },
            { id: 'KAT004', nama: 'Gula & Pemanis' }
        ];
        
        this.satuan = [
            { id: 'SAT001', nama: 'kg' },
            { id: 'SAT002', nama: 'gram' },
            { id: 'SAT003', nama: 'liter' },
            { id: 'SAT004', nama: 'ml' },
            { id: 'SAT005', nama: 'dus' },
            { id: 'SAT006', nama: 'botol' },
            { id: 'SAT007', nama: 'pcs' },
            { id: 'SAT008', nama: 'karung' }
        ];
        
        this.masterBarang = [
            {
                id: 'BRG001',
                barcode: 'BRC001',
                nama: 'Beras Premium',
                kategoriId: 'KAT001',
                satuanId: 'SAT001', // kg
                stok: 150,
                hpp: 12000,
                hargaJual: 15000
            },
            {
                id: 'BRG002',
                barcode: 'BRC002',
                nama: 'Minyak Goreng Tropical',
                kategoriId: 'KAT002',
                satuanId: 'SAT003', // liter
                stok: 75,
                hpp: 18000,
                hargaJual: 22000
            },
            {
                id: 'BRG003',
                barcode: 'BRC003',
                nama: 'Air Mineral Aqua',
                kategoriId: 'KAT003',
                satuanId: 'SAT005', // dus
                stok: 30,
                hpp: 48000,
                hargaJual: 60000
            },
            {
                id: 'BRG004',
                barcode: 'BRC004',
                nama: 'Gula Pasir',
                kategoriId: 'KAT004',
                satuanId: 'SAT008', // karung
                stok: 20,
                hpp: 750000,
                hargaJual: 900000
            }
        ];
        
        // Save sample data
        localStorage.setItem('kategori', JSON.stringify(this.kategori));
        localStorage.setItem('satuan', JSON.stringify(this.satuan));
        localStorage.setItem('barang', JSON.stringify(this.masterBarang));
        
        this.debug('✅ Sample data initialized');
    }

    /**
     * Validate and clean data
     */
    validateData() {
        this.debug('🔍 Validating and cleaning data...');
        
        let validItems = 0;
        let fixedItems = 0;
        
        this.masterBarang = this.masterBarang.map(item => {
            let fixed = false;
            
            // Ensure required fields exist
            if (!item.id) {
                item.id = item.barcode || `BRG${Date.now()}`;
                fixed = true;
            }
            
            if (!item.nama || item.nama.trim() === '') {
                item.nama = `Barang ${item.id}`;
                fixed = true;
            }
            
            if (typeof item.stok !== 'number' || isNaN(item.stok)) {
                item.stok = 0;
                fixed = true;
            }
            
            if (!item.kategoriId) {
                item.kategoriId = 'KAT001';
                fixed = true;
            }
            
            if (!item.satuanId) {
                item.satuanId = 'SAT007'; // pcs
                fixed = true;
            }
            
            if (typeof item.hpp !== 'number' || isNaN(item.hpp)) {
                item.hpp = 0;
                fixed = true;
            }
            
            if (typeof item.hargaJual !== 'number' || isNaN(item.hargaJual)) {
                item.hargaJual = item.hpp * 1.2; // 20% markup
                fixed = true;
            }
            
            if (fixed) fixedItems++;
            validItems++;
            
            return item;
        });
        
        this.debug(`✅ Data validation complete: ${validItems} valid items, ${fixedItems} items fixed`);
    }

    /**
     * Create transformation variants for each item
     */
    async createTransformationVariants() {
        this.debug('🔄 Creating transformation variants...');
        
        const transformedData = [];
        let variantCount = 0;
        
        this.masterBarang.forEach(item => {
            // Get kategori and satuan names
            const kategoriData = this.kategori.find(k => k.id === item.kategoriId);
            const satuanData = this.satuan.find(s => s.id === item.satuanId);
            
            const kategoriNama = kategoriData ? kategoriData.nama : 'Umum';
            const satuanNama = satuanData ? satuanData.nama : 'pcs';
            
            // Create base product code
            const baseProduct = `BASE_${item.kategoriId || 'KAT001'}`;
            
            // Add main item
            transformedData.push({
                kode: item.barcode || item.id,
                nama: item.nama,
                satuan: satuanNama,
                stok: parseFloat(item.stok) || 0,
                baseProduct: baseProduct,
                hargaBeli: parseFloat(item.hpp) || 0,
                hargaJual: parseFloat(item.hargaJual) || 0,
                kategori: kategoriNama,
                originalId: item.id,
                isMain: true
            });
            
            // Add conversion variants
            const variants = this.getConversionVariants(satuanNama);
            variants.forEach(variant => {
                const convertedStok = (parseFloat(item.stok) || 0) * variant.ratio;
                const convertedHargaBeli = (parseFloat(item.hpp) || 0) / variant.ratio;
                const convertedHargaJual = (parseFloat(item.hargaJual) || 0) / variant.ratio;
                
                transformedData.push({
                    kode: `${item.barcode || item.id}-${variant.suffix}`,
                    nama: `${item.nama} (${variant.unit})`,
                    satuan: variant.unit,
                    stok: Math.floor(convertedStok),
                    baseProduct: baseProduct,
                    hargaBeli: Math.round(convertedHargaBeli),
                    hargaJual: Math.round(convertedHargaJual),
                    kategori: kategoriNama,
                    originalId: item.id,
                    isConverted: true,
                    conversionRatio: variant.ratio,
                    parentUnit: satuanNama
                });
                
                variantCount++;
            });
        });
        
        // Update localStorage with transformed data
        localStorage.setItem('masterBarang', JSON.stringify(transformedData));
        
        this.debug(`✅ Transformation variants created: ${variantCount} variants from ${this.masterBarang.length} main items`);
    }

    /**
     * Get conversion variants for a unit
     */
    getConversionVariants(satuanNama) {
        const commonConversions = {
            'kg': [
                { unit: 'gram', ratio: 1000, suffix: 'GR' },
                { unit: 'ons', ratio: 10, suffix: 'ONS' }
            ],
            'liter': [
                { unit: 'ml', ratio: 1000, suffix: 'ML' },
                { unit: 'cc', ratio: 1000, suffix: 'CC' }
            ],
            'dus': [
                { unit: 'pcs', ratio: 24, suffix: 'PCS' },
                { unit: 'botol', ratio: 24, suffix: 'BTL' }
            ],
            'karung': [
                { unit: 'kg', ratio: 50, suffix: 'KG' },
                { unit: 'gram', ratio: 50000, suffix: 'GR' }
            ],
            'sak': [
                { unit: 'kg', ratio: 25, suffix: 'KG' },
                { unit: 'gram', ratio: 25000, suffix: 'GR' }
            ]
        };
        
        return commonConversions[satuanNama.toLowerCase()] || [];
    }

    /**
     * Setup conversion ratios
     */
    async setupConversionRatios() {
        this.debug('⚙️ Setting up conversion ratios...');
        
        const ratios = [];
        const transformedData = JSON.parse(localStorage.getItem('masterBarang') || '[]');
        const processedBaseProducts = new Set();
        
        transformedData.forEach(item => {
            if (!processedBaseProducts.has(item.baseProduct)) {
                processedBaseProducts.add(item.baseProduct);
                
                // Find all items with same base product
                const relatedItems = transformedData.filter(i => i.baseProduct === item.baseProduct);
                
                if (relatedItems.length > 1) {
                    const conversions = [];
                    
                    // Create conversion pairs
                    relatedItems.forEach(fromItem => {
                        relatedItems.forEach(toItem => {
                            if (fromItem.kode !== toItem.kode) {
                                let ratio = 1;
                                
                                // Calculate ratio based on conversion data
                                if (fromItem.isConverted && toItem.isConverted) {
                                    ratio = fromItem.conversionRatio / toItem.conversionRatio;
                                } else if (fromItem.isConverted && !toItem.isConverted) {
                                    ratio = 1 / fromItem.conversionRatio;
                                } else if (!fromItem.isConverted && toItem.isConverted) {
                                    ratio = toItem.conversionRatio;
                                }
                                
                                conversions.push({
                                    from: fromItem.satuan,
                                    to: toItem.satuan,
                                    ratio: ratio
                                });
                            }
                        });
                    });
                    
                    if (conversions.length > 0) {
                        ratios.push({
                            baseProduct: item.baseProduct,
                            conversions: conversions
                        });
                    }
                }
            }
        });
        
        this.conversionRatios = ratios;
        localStorage.setItem('conversionRatios', JSON.stringify(ratios));
        
        this.debug(`✅ Conversion ratios setup: ${ratios.length} conversion groups`);
    }

    /**
     * Apply the stock fix to existing functions
     */
    applyStockFix() {
        this.debug('🔧 Applying stock fix to existing functions...');
        
        const self = this;
        
        // Create enhanced dropdown population function
        window.populateDropdownsWithRealTimeStock = function() {
            self.debug('🎛️ Populating dropdowns with real-time stock...');
            
            const sourceSelect = document.getElementById('sourceItem');
            const targetSelect = document.getElementById('targetItem');
            
            if (!sourceSelect || !targetSelect) {
                self.debug('⚠️ Dropdown elements not found');
                return false;
            }
            
            try {
                // Get real-time data
                const masterBarang = JSON.parse(localStorage.getItem('masterBarang') || '[]');
                const realBarang = JSON.parse(localStorage.getItem('barang') || '[]');
                
                if (masterBarang.length === 0) {
                    self.debug('⚠️ No master barang data found');
                    return false;
                }
                
                // Clear existing options
                sourceSelect.innerHTML = '<option value="">Pilih barang asal (yang akan dikurangi stoknya)...</option>';
                targetSelect.innerHTML = '<option value="">Pilih barang tujuan (yang akan ditambah stoknya)...</option>';
                
                // Group by base product
                const baseProducts = {};
                masterBarang.forEach(item => {
                    const baseProduct = item.baseProduct;
                    if (!baseProducts[baseProduct]) {
                        baseProducts[baseProduct] = [];
                    }
                    baseProducts[baseProduct].push(item);
                });
                
                let sourceCount = 0;
                let targetCount = 0;
                
                // Populate dropdowns with real-time stock
                Object.entries(baseProducts).forEach(([baseProduct, items]) => {
                    if (items.length > 1) { // Only transformable items
                        items.forEach(item => {
                            // Get real-time stock from original barang data
                            let realTimeStock = item.stok;
                            if (item.originalId) {
                                const realItem = realBarang.find(r => r.id === item.originalId);
                                if (realItem) {
                                    realTimeStock = parseFloat(realItem.stok) || 0;
                                    
                                    // Adjust for converted items
                                    if (item.isConverted && item.conversionRatio) {
                                        realTimeStock = Math.floor(realTimeStock * item.conversionRatio);
                                    }
                                }
                            }
                            
                            // Ensure no undefined values
                            const nama = String(item.nama || 'Unknown');
                            const satuan = String(item.satuan || 'unit');
                            const stok = Number(realTimeStock || 0);
                            
                            // Source dropdown - only items with stock > 0
                            if (stok > 0) {
                                const sourceOption = new Option(
                                    `${nama} - Stok: ${stok} ${satuan}`, 
                                    item.kode
                                );
                                sourceOption.dataset.baseProduct = String(item.baseProduct);
                                sourceOption.dataset.satuan = satuan;
                                sourceOption.dataset.stok = stok.toString();
                                sourceOption.dataset.nama = nama;
                                sourceOption.dataset.originalId = item.originalId || '';
                                sourceSelect.add(sourceOption);
                                sourceCount++;
                            }
                            
                            // Target dropdown - all transformable items
                            const targetOption = new Option(
                                `${nama} - Stok: ${stok} ${satuan}`, 
                                item.kode
                            );
                            targetOption.dataset.baseProduct = String(item.baseProduct);
                            targetOption.dataset.satuan = satuan;
                            targetOption.dataset.stok = stok.toString();
                            targetOption.dataset.nama = nama;
                            targetOption.dataset.originalId = item.originalId || '';
                            targetSelect.add(targetOption);
                            targetCount++;
                        });
                    }
                });
                
                targetSelect.disabled = false;
                self.debug(`✅ Dropdowns populated: ${sourceCount} source, ${targetCount} target options`);
                
                // Show success message
                self.showSuccessMessage();
                
                return true;
            } catch (error) {
                self.debug(`❌ Error populating dropdowns: ${error.message}`);
                return false;
            }
        };
        
        // Create enhanced conversion info update function
        window.updateConversionInfoWithRealTimeStock = function() {
            const sourceSelect = document.getElementById('sourceItem');
            const targetSelect = document.getElementById('targetItem');
            const quantityInput = document.getElementById('quantity');
            const conversionInfo = document.getElementById('conversion-info');
            
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
                // Get real-time stock data
                const realBarang = JSON.parse(localStorage.getItem('barang') || '[]');
                const sourceOption = sourceSelect.options[sourceSelect.selectedIndex];
                const targetOption = targetSelect.options[targetSelect.selectedIndex];
                
                // Get real-time stock
                let sourceStock = parseInt(sourceOption.dataset.stok) || 0;
                let targetStock = parseInt(targetOption.dataset.stok) || 0;
                
                // Update with real-time data if available
                if (sourceOption.dataset.originalId) {
                    const realSourceItem = realBarang.find(r => r.id === sourceOption.dataset.originalId);
                    if (realSourceItem) {
                        sourceStock = parseFloat(realSourceItem.stok) || 0;
                    }
                }
                
                if (targetOption.dataset.originalId) {
                    const realTargetItem = realBarang.find(r => r.id === targetOption.dataset.originalId);
                    if (realTargetItem) {
                        targetStock = parseFloat(realTargetItem.stok) || 0;
                    }
                }
                
                const sourceItem = {
                    kode: sourceValue,
                    nama: sourceOption.dataset.nama || 'Unknown',
                    satuan: sourceOption.dataset.satuan || 'unit',
                    stok: sourceStock,
                    baseProduct: sourceOption.dataset.baseProduct || sourceValue
                };
                
                const targetItem = {
                    kode: targetValue,
                    nama: targetOption.dataset.nama || 'Unknown',
                    satuan: targetOption.dataset.satuan || 'unit',
                    stok: targetStock,
                    baseProduct: targetOption.dataset.baseProduct || targetValue
                };
                
                // Validate compatibility
                if (sourceItem.baseProduct !== targetItem.baseProduct) {
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
                const productRatios = conversionRatios.find(r => r.baseProduct === sourceItem.baseProduct);
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
                
                // Display conversion info with real-time stock
                conversionInfo.innerHTML = `
                    <div class="small">
                        <div class="alert alert-success mb-2 py-1">
                            <i class="bi bi-check-circle me-1"></i>
                            <strong>Stok Real-Time Aktif</strong> - Data langsung dari sistem aplikasi
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
                                    <div class="fw-bold text-primary">Stok Sumber (Real-Time)</div>
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
                                    <div class="fw-bold text-success">Stok Target (Real-Time)</div>
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
                                    Stok Real ${sourceItem.nama}: ${sourceItem.stok} ${sourceItem.satuan}
                                </span>
                            </div>
                            <div class="col-6">
                                <span class="badge bg-info">
                                    Stok Real ${targetItem.nama}: ${targetItem.stok} ${targetItem.satuan}
                                </span>
                            </div>
                        </div>
                        `}
                    </div>
                `;
                
            } catch (error) {
                self.debug(`❌ Error updating conversion info: ${error.message}`);
                conversionInfo.innerHTML = '<span class="text-danger">Error memuat info konversi real-time</span>';
            }
        };
        
        // Override existing functions
        window.populateDropdowns = window.populateDropdownsWithRealTimeStock;
        window.populateDropdownsSafe = window.populateDropdownsWithRealTimeStock;
        window.populateDropdownsFixed = window.populateDropdownsWithRealTimeStock;
        window.updateConversionInfo = window.updateConversionInfoWithRealTimeStock;
        
        // Apply immediately if elements exist
        const sourceSelect = document.getElementById('sourceItem');
        const targetSelect = document.getElementById('targetItem');
        
        if (sourceSelect && targetSelect) {
            window.populateDropdownsWithRealTimeStock();
        }
        
        this.debug('✅ Stock fix applied to existing functions');
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
                    <strong>Stok Real-Time Berhasil Diaktifkan!</strong> 
                    Dropdown sekarang menampilkan stok real dari sistem aplikasi dengan akurat.
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
     * Refresh real-time stock data
     */
    async refreshRealTimeStock() {
        this.debug('🔄 Refreshing real-time stock data...');
        
        try {
            await this.loadApplicationData();
            await this.createTransformationVariants();
            await this.setupConversionRatios();
            
            if (typeof window.populateDropdownsWithRealTimeStock === 'function') {
                window.populateDropdownsWithRealTimeStock();
            }
            
            this.debug('✅ Real-time stock data refreshed');
            return true;
        } catch (error) {
            this.debug(`❌ Error refreshing real-time stock: ${error.message}`);
            return false;
        }
    }

    /**
     * Debug logging
     */
    debug(message) {
        if (this.debugMode) {
            const timestamp = new Date().toLocaleTimeString();
            console.log(`[${timestamp}] RealTimeStockFix: ${message}`);
        }
    }

    /**
     * Get current stock for an item
     */
    getCurrentStock(itemCode) {
        const realBarang = JSON.parse(localStorage.getItem('barang') || '[]');
        const masterBarang = JSON.parse(localStorage.getItem('masterBarang') || '[]');
        
        // Find in master barang first
        const masterItem = masterBarang.find(item => item.kode === itemCode);
        if (!masterItem) return 0;
        
        // Get real-time stock if available
        if (masterItem.originalId) {
            const realItem = realBarang.find(r => r.id === masterItem.originalId);
            if (realItem) {
                let realTimeStock = parseFloat(realItem.stok) || 0;
                
                // Adjust for converted items
                if (masterItem.isConverted && masterItem.conversionRatio) {
                    realTimeStock = Math.floor(realTimeStock * masterItem.conversionRatio);
                }
                
                return realTimeStock;
            }
        }
        
        return masterItem.stok || 0;
    }

    /**
     * Update stock for an item
     */
    updateStock(itemCode, newStock) {
        const realBarang = JSON.parse(localStorage.getItem('barang') || '[]');
        const masterBarang = JSON.parse(localStorage.getItem('masterBarang') || '[]');
        
        // Find master item
        const masterItem = masterBarang.find(item => item.kode === itemCode);
        if (!masterItem) return false;
        
        // Update real barang if available
        if (masterItem.originalId) {
            const realItemIndex = realBarang.findIndex(r => r.id === masterItem.originalId);
            if (realItemIndex !== -1) {
                let adjustedStock = newStock;
                
                // Adjust for converted items
                if (masterItem.isConverted && masterItem.conversionRatio) {
                    adjustedStock = newStock / masterItem.conversionRatio;
                }
                
                realBarang[realItemIndex].stok = adjustedStock;
                localStorage.setItem('barang', JSON.stringify(realBarang));
            }
        }
        
        // Update master barang
        const masterItemIndex = masterBarang.findIndex(item => item.kode === itemCode);
        if (masterItemIndex !== -1) {
            masterBarang[masterItemIndex].stok = newStock;
            localStorage.setItem('masterBarang', JSON.stringify(masterBarang));
        }
        
        // Refresh dropdowns
        if (typeof window.populateDropdownsWithRealTimeStock === 'function') {
            window.populateDropdownsWithRealTimeStock();
        }
        
        return true;
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.RealTimeStockFix = RealTimeStockFix;
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async () => {
        if (!window.realTimeStockFix) {
            window.realTimeStockFix = new RealTimeStockFix();
            const success = await window.realTimeStockFix.initialize();
            
            if (success) {
                console.log('✅ RealTimeStockFix successfully applied!');
                
                // Setup global refresh function
                window.refreshRealTimeStock = () => window.realTimeStockFix.refreshRealTimeStock();
            } else {
                console.error('❌ RealTimeStockFix failed to initialize!');
            }
        }
    });
}

// ES6 module export (commented out for browser compatibility)
// export default RealTimeStockFix;