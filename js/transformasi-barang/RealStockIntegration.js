/**
 * RealStockIntegration - Integrasi dengan stok real dari aplikasi
 * 
 * File ini mengganti data demo dengan data stok real dari localStorage 'barang'
 * dan memastikan transformasi barang menggunakan stok yang sebenarnya.
 */

(function() {
    'use strict';
    
    console.log('🔄 REAL STOCK INTEGRATION: Loading...');
    
    class RealStockIntegration {
        constructor() {
            this.realBarang = [];
            this.kategori = [];
            this.satuan = [];
            this.conversionRatios = [];
            this.initialized = false;
        }

        /**
         * Initialize real stock integration
         */
        async initialize() {
            try {
                console.log('🔄 Initializing real stock integration...');
                
                // Load real data from application
                await this.loadRealData();
                
                // Setup conversion ratios for real data
                this.setupConversionRatios();
                
                // Create fixed dropdown function with real data
                this.createRealStockDropdownFunction();
                
                // Apply the integration
                this.applyIntegration();
                
                this.initialized = true;
                console.log('✅ Real stock integration completed successfully!');
                
                return true;
            } catch (error) {
                console.error('❌ Real stock integration failed:', error);
                return false;
            }
        }

        /**
         * Load real data from localStorage
         */
        async loadRealData() {
            try {
                // Load real barang data (not demo data)
                this.realBarang = JSON.parse(localStorage.getItem('barang') || '[]');
                this.kategori = JSON.parse(localStorage.getItem('kategori') || '[]');
                this.satuan = JSON.parse(localStorage.getItem('satuan') || '[]');
                
                console.log(`📦 Loaded real data: ${this.realBarang.length} items, ${this.kategori.length} categories, ${this.satuan.length} units`);
                
                if (this.realBarang.length === 0) {
                    console.warn('⚠️ No real barang data found, initializing sample data...');
                    this.initializeSampleData();
                }
                
                // Transform real data to transformasi barang format
                this.transformRealDataFormat();
                
            } catch (error) {
                console.error('❌ Error loading real data:', error);
                throw error;
            }
        }

        /**
         * Transform real data format to match transformasi barang requirements
         */
        transformRealDataFormat() {
            const transformedData = [];
            
            this.realBarang.forEach(item => {
                // Get kategori and satuan names
                const kategoriData = this.kategori.find(k => k.id === item.kategoriId);
                const satuanData = this.satuan.find(s => s.id === item.satuanId);
                
                const kategoriNama = kategoriData ? kategoriData.nama : 'Umum';
                const satuanNama = satuanData ? satuanData.nama : 'pcs';
                
                // Create base product code from kategori
                const baseProduct = kategoriData ? `KAT${kategoriData.id}` : 'KAT001';
                
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
                    originalId: item.id
                });
                
                // Add conversion variants if applicable
                this.addConversionVariants(item, kategoriNama, satuanNama, baseProduct, transformedData);
            });
            
            // Update masterBarang with real data
            localStorage.setItem('masterBarang', JSON.stringify(transformedData));
            localStorage.setItem('barang', JSON.stringify(this.realBarang)); // Keep original format
            
            console.log(`✅ Transformed ${transformedData.length} items for transformasi barang`);
        }

        /**
         * Add conversion variants for common units
         */
        addConversionVariants(item, kategoriNama, satuanNama, baseProduct, transformedData) {
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
                    { unit: 'kg', ratio: 50, suffix: 'KG' }
                ],
                'sak': [
                    { unit: 'kg', ratio: 25, suffix: 'KG' }
                ]
            };
            
            const conversions = commonConversions[satuanNama.toLowerCase()];
            if (conversions) {
                conversions.forEach(conv => {
                    const convertedStok = (parseFloat(item.stok) || 0) * conv.ratio;
                    const convertedHargaBeli = (parseFloat(item.hpp) || 0) / conv.ratio;
                    const convertedHargaJual = (parseFloat(item.hargaJual) || 0) / conv.ratio;
                    
                    transformedData.push({
                        kode: `${item.barcode || item.id}-${conv.suffix}`,
                        nama: `${item.nama} (${conv.unit})`,
                        satuan: conv.unit,
                        stok: Math.floor(convertedStok),
                        baseProduct: baseProduct,
                        hargaBeli: Math.round(convertedHargaBeli),
                        hargaJual: Math.round(convertedHargaJual),
                        kategori: kategoriNama,
                        originalId: item.id,
                        isConverted: true,
                        conversionRatio: conv.ratio,
                        parentUnit: satuanNama
                    });
                });
            }
        }

        /**
         * Setup conversion ratios based on real data
         */
        setupConversionRatios() {
            const ratios = [];
            const processedBaseProducts = new Set();
            
            // Get unique base products
            const transformedData = JSON.parse(localStorage.getItem('masterBarang') || '[]');
            
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
            
            console.log(`✅ Setup ${ratios.length} conversion ratio groups`);
        }

        /**
         * Initialize sample data if no real data exists
         */
        initializeSampleData() {
            const sampleKategori = [
                { id: 'KAT001', nama: 'Beras & Padi-padian' },
                { id: 'KAT002', nama: 'Minyak & Lemak' },
                { id: 'KAT003', nama: 'Minuman' }
            ];
            
            const sampleSatuan = [
                { id: 'SAT001', nama: 'kg' },
                { id: 'SAT002', nama: 'gram' },
                { id: 'SAT003', nama: 'liter' },
                { id: 'SAT004', nama: 'ml' },
                { id: 'SAT005', nama: 'dus' },
                { id: 'SAT006', nama: 'botol' }
            ];
            
            const sampleBarang = [
                {
                    id: 'BRG001',
                    barcode: 'BRC001',
                    nama: 'Beras Premium',
                    kategoriId: 'KAT001',
                    satuanId: 'SAT001',
                    stok: 100,
                    hpp: 12000,
                    hargaJual: 15000
                },
                {
                    id: 'BRG002',
                    barcode: 'BRC002',
                    nama: 'Minyak Goreng',
                    kategoriId: 'KAT002',
                    satuanId: 'SAT003',
                    stok: 50,
                    hpp: 18000,
                    hargaJual: 22000
                },
                {
                    id: 'BRG003',
                    barcode: 'BRC003',
                    nama: 'Air Mineral',
                    kategoriId: 'KAT003',
                    satuanId: 'SAT005',
                    stok: 20,
                    hpp: 48000,
                    hargaJual: 60000
                }
            ];
            
            // Save sample data
            localStorage.setItem('kategori', JSON.stringify(sampleKategori));
            localStorage.setItem('satuan', JSON.stringify(sampleSatuan));
            localStorage.setItem('barang', JSON.stringify(sampleBarang));
            
            // Update instance data
            this.kategori = sampleKategori;
            this.satuan = sampleSatuan;
            this.realBarang = sampleBarang;
            
            console.log('✅ Sample data initialized');
        }

        /**
         * Create dropdown function with real stock data
         */
        createRealStockDropdownFunction() {
            const self = this;
            
            window.populateDropdownsWithRealStock = function() {
                console.log('🔄 Populating dropdowns with REAL stock data...');
                
                const sourceSelect = document.getElementById('sourceItem');
                const targetSelect = document.getElementById('targetItem');
                
                if (!sourceSelect || !targetSelect) {
                    console.warn('Dropdown elements not found');
                    return false;
                }
                
                try {
                    // Get real-time data
                    const masterBarang = JSON.parse(localStorage.getItem('masterBarang') || '[]');
                    const realBarang = JSON.parse(localStorage.getItem('barang') || '[]');
                    
                    if (masterBarang.length === 0) {
                        console.warn('No master barang data found');
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
                    
                    // Populate dropdowns with real stock
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
                                
                                // GUARANTEED no undefined values
                                const nama = String(item.nama || 'Unknown');
                                const satuan = String(item.satuan || 'unit');
                                const stok = Number(realTimeStock || 0);
                                
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
                    console.log(`✅ Dropdowns populated with REAL stock: ${sourceCount} source, ${targetCount} target options`);
                    
                    // Show success message
                    self.showSuccessMessage();
                    
                    return true;
                } catch (error) {
                    console.error('❌ Error populating dropdowns with real stock:', error);
                    return false;
                }
            };
        }

        /**
         * Apply the integration
         */
        applyIntegration() {
            // Override all dropdown functions with real stock version
            window.populateDropdownsFixed = window.populateDropdownsWithRealStock;
            window.populateDropdownsSafe = window.populateDropdownsWithRealStock;
            window.populateDropdowns = window.populateDropdownsWithRealStock;
            
            // Apply immediately if elements exist
            const sourceSelect = document.getElementById('sourceItem');
            const targetSelect = document.getElementById('targetItem');
            
            if (sourceSelect && targetSelect) {
                window.populateDropdownsWithRealStock();
            }
            
            // Setup real-time stock update function
            this.setupRealTimeStockUpdate();
            
            console.log('✅ Real stock integration applied');
        }

        /**
         * Setup real-time stock update
         */
        setupRealTimeStockUpdate() {
            const self = this;
            
            // Override updateConversionInfo to use real-time stock
            window.updateConversionInfoWithRealStock = function() {
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
                            <div class="alert alert-info mb-2">
                                <i class="bi bi-info-circle me-1"></i>
                                <strong>Menggunakan Stok Real-Time</strong> dari sistem aplikasi
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
                    console.error('Error updating conversion info with real stock:', error);
                    conversionInfo.innerHTML = '<span class="text-danger">Error memuat info konversi real-time</span>';
                }
            };
            
            // Override the existing function
            if (typeof window.updateConversionInfo === 'function') {
                window.updateConversionInfo = window.updateConversionInfoWithRealStock;
            }
        }

        /**
         * Show success message
         */
        showSuccessMessage() {
            const alertContainer = document.getElementById('alert-container') || document.getElementById('success-container');
            if (alertContainer) {
                alertContainer.innerHTML = `
                    <div class="alert alert-success alert-dismissible fade show" role="alert">
                        <i class="bi bi-check-circle me-2"></i>
                        <strong>Stok Real-Time Terintegrasi!</strong> Dropdown sekarang menampilkan stok real dari aplikasi, bukan data demo.
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
         * Refresh real stock data
         */
        async refreshRealStock() {
            console.log('🔄 Refreshing real stock data...');
            
            try {
                await this.loadRealData();
                this.setupConversionRatios();
                
                if (typeof window.populateDropdownsWithRealStock === 'function') {
                    window.populateDropdownsWithRealStock();
                }
                
                console.log('✅ Real stock data refreshed');
                return true;
            } catch (error) {
                console.error('❌ Error refreshing real stock:', error);
                return false;
            }
        }
    }

    // Initialize real stock integration
    const realStockIntegration = new RealStockIntegration();
    
    // Wait for DOM to be ready
    function waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }
    
    // Apply integration
    async function applyRealStockIntegration() {
        try {
            await waitForDOM();
            const success = await realStockIntegration.initialize();
            
            if (success) {
                console.log('✅ REAL STOCK INTEGRATION: Successfully applied!');
                
                // Make available globally
                window.realStockIntegration = realStockIntegration;
                
                // Setup refresh function
                window.refreshRealStock = () => realStockIntegration.refreshRealStock();
                
            } else {
                console.error('❌ REAL STOCK INTEGRATION: Failed to apply');
            }
        } catch (error) {
            console.error('❌ REAL STOCK INTEGRATION: Error during application:', error);
        }
    }
    
    // Apply integration immediately and with delays
    applyRealStockIntegration();
    setTimeout(applyRealStockIntegration, 1000);
    setTimeout(applyRealStockIntegration, 3000);
    
    console.log('🔄 REAL STOCK INTEGRATION: Loaded and ready!');
    
})();