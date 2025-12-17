/**
 * RealDataIntegration - Integrasi data real untuk transformasi barang
 * 
 * File ini mengganti data dummy dengan data real dari localStorage 'master_barang'
 * dan memastikan transformasi barang menggunakan stok yang sebenarnya dari aplikasi.
 */

(function() {
    'use strict';
    
    console.log('🔄 REAL DATA INTEGRATION: Loading...');
    
    class RealDataIntegration {
        constructor() {
            this.realMasterBarang = [];
            this.transformedData = [];
            this.conversionRatios = [];
            this.initialized = false;
        }

        /**
         * Initialize real data integration
         */
        async initialize() {
            try {
                console.log('🔄 Initializing real data integration...');
                
                // Load real data from master_barang
                await this.loadRealMasterBarang();
                
                // Transform to transformasi barang format
                this.transformRealData();
                
                // Setup conversion ratios
                this.setupConversionRatios();
                
                // Override dropdown functions
                this.overrideDropdownFunctions();
                
                // Override stock functions
                this.overrideStockFunctions();
                
                this.initialized = true;
                console.log('✅ Real data integration completed successfully!');
                
                return true;
            } catch (error) {
                console.error('❌ Real data integration failed:', error);
                return false;
            }
        }

        /**
         * Load real master barang data from localStorage
         */
        async loadRealMasterBarang() {
            try {
                // Load from master_barang (the real data key)
                this.realMasterBarang = JSON.parse(localStorage.getItem('master_barang') || '[]');
                
                console.log(`📦 Loaded ${this.realMasterBarang.length} real master barang items`);
                
                if (this.realMasterBarang.length === 0) {
                    console.warn('⚠️ No real master barang data found, creating sample data...');
                    this.createSampleMasterBarang();
                }
                
            } catch (error) {
                console.error('❌ Error loading real master barang:', error);
                throw error;
            }
        }

        /**
         * Transform real data to transformasi barang format
         */
        transformRealData() {
            console.log('🔄 Transforming real data to transformasi barang format...');
            
            this.transformedData = [];
            const baseProductMap = new Map();
            
            this.realMasterBarang.forEach((item, index) => {
                // Create base product grouping by category
                const kategori = item.kategori_nama || 'Umum';
                const baseProduct = `CAT_${kategori.replace(/\s+/g, '_').toUpperCase()}`;
                
                if (!baseProductMap.has(baseProduct)) {
                    baseProductMap.set(baseProduct, []);
                }
                
                // Main item
                const mainItem = {
                    kode: item.kode || `ITM_${item.id}`,
                    nama: item.nama,
                    satuan: item.satuan_nama || 'pcs',
                    stok: parseInt(item.stok) || 0,
                    baseProduct: baseProduct,
                    hargaBeli: parseInt(item.harga_beli) || 0,
                    hargaJual: parseInt(item.harga_jual) || 0,
                    kategori: kategori,
                    originalId: item.id,
                    isReal: true,
                    realDataKey: 'master_barang'
                };
                
                this.transformedData.push(mainItem);
                baseProductMap.get(baseProduct).push(mainItem);
                
                // Add conversion variants for common units
                this.addConversionVariants(item, baseProduct, baseProductMap);
            });
            
            // Save transformed data to transformasi barang keys
            localStorage.setItem('masterBarang', JSON.stringify(this.transformedData));
            localStorage.setItem('barang', JSON.stringify(this.transformedData)); // Backup
            
            console.log(`✅ Transformed ${this.transformedData.length} items for transformasi barang`);
            
            // Store base product map for conversion ratios
            this.baseProductMap = baseProductMap;
        }

        /**
         * Add conversion variants for common units
         */
        addConversionVariants(item, baseProduct, baseProductMap) {
            const satuan = (item.satuan_nama || 'pcs').toLowerCase();
            
            const conversionMap = {
                'kg': [
                    { unit: 'gram', ratio: 1000, suffix: 'GR' },
                    { unit: 'ons', ratio: 10, suffix: 'ONS' }
                ],
                'kilogram': [
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
                ],
                'botol': [
                    { unit: 'dus', ratio: 0.041667, suffix: 'DUS' }
                ]
            };
            
            const conversions = conversionMap[satuan];
            if (conversions) {
                conversions.forEach(conv => {
                    const convertedStok = Math.floor((parseInt(item.stok) || 0) * conv.ratio);
                    const convertedHargaBeli = Math.round((parseInt(item.harga_beli) || 0) / conv.ratio);
                    const convertedHargaJual = Math.round((parseInt(item.harga_jual) || 0) / conv.ratio);
                    
                    const convertedItem = {
                        kode: `${item.kode || item.id}_${conv.suffix}`,
                        nama: `${item.nama} (${conv.unit})`,
                        satuan: conv.unit,
                        stok: convertedStok,
                        baseProduct: baseProduct,
                        hargaBeli: convertedHargaBeli,
                        hargaJual: convertedHargaJual,
                        kategori: item.kategori_nama || 'Umum',
                        originalId: item.id,
                        isReal: true,
                        isConverted: true,
                        conversionRatio: conv.ratio,
                        parentUnit: item.satuan_nama || 'pcs',
                        realDataKey: 'master_barang'
                    };
                    
                    this.transformedData.push(convertedItem);
                    baseProductMap.get(baseProduct).push(convertedItem);
                });
            }
        }

        /**
         * Setup conversion ratios from transformed data
         */
        setupConversionRatios() {
            console.log('🔄 Setting up conversion ratios...');
            
            this.conversionRatios = [];
            
            this.baseProductMap.forEach((items, baseProduct) => {
                if (items.length > 1) {
                    const conversions = [];
                    
                    // Create conversion pairs
                    items.forEach(fromItem => {
                        items.forEach(toItem => {
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
                        this.conversionRatios.push({
                            baseProduct: baseProduct,
                            conversions: conversions
                        });
                    }
                }
            });
            
            localStorage.setItem('conversionRatios', JSON.stringify(this.conversionRatios));
            console.log(`✅ Setup ${this.conversionRatios.length} conversion ratio groups`);
        }

        /**
         * Override dropdown functions to use real data
         */
        overrideDropdownFunctions() {
            const self = this;
            
            // Override populateDropdowns function
            window.populateDropdownsWithRealData = function() {
                console.log('🔄 Populating dropdowns with REAL data from master_barang...');
                
                const sourceSelect = document.getElementById('sourceItem');
                const targetSelect = document.getElementById('targetItem');
                
                if (!sourceSelect || !targetSelect) {
                    console.warn('Dropdown elements not found');
                    return false;
                }
                
                try {
                    // Get real-time data LANGSUNG dari master_barang (SEMUA ITEM)
                    const realMasterBarang = JSON.parse(localStorage.getItem('master_barang') || '[]');
                    
                    if (realMasterBarang.length === 0) {
                        console.warn('⚠️ No master_barang data found');
                        return false;
                    }
                    
                    console.log(`📦 Loading ${realMasterBarang.length} items from master_barang`);
                    
                    // Clear existing options
                    sourceSelect.innerHTML = '<option value="">Pilih Item Sumber (Semua Barang dari Master)...</option>';
                    targetSelect.innerHTML = '<option value="">Pilih Item Target...</option>';
                    
                    let sourceCount = 0;
                    let targetCount = 0;
                    
                    // POPULATE SEMUA ITEM dari master_barang ke sourceItem
                    realMasterBarang.forEach(item => {
                        // Skip inactive items
                        if (item.status === 'nonaktif') return;
                        
                        // Ensure no undefined values
                        const nama = String(item.nama || 'Unknown');
                        const satuan = String(item.satuan_nama || 'pcs');
                        const stok = Number(item.stok || 0);
                        const kode = String(item.kode || item.id);
                        const kategori = String(item.kategori_nama || 'Umum');
                        
                        // Add to SOURCE dropdown (SEMUA item dengan stok > 0)
                        if (stok > 0) {
                            const sourceOption = new Option(
                                `${nama} (${kategori}) - Stok: ${stok} ${satuan}`, 
                                kode
                            );
                            sourceOption.dataset.id = String(item.id || '');
                            sourceOption.dataset.kode = kode;
                            sourceOption.dataset.nama = nama;
                            sourceOption.dataset.satuan = satuan;
                            sourceOption.dataset.stok = stok.toString();
                            sourceOption.dataset.kategori = kategori;
                            sourceOption.dataset.hargaBeli = String(item.harga_beli || 0);
                            sourceOption.dataset.hargaJual = String(item.harga_jual || 0);
                            sourceOption.dataset.isReal = 'true';
                            sourceOption.dataset.fromMasterBarang = 'true';
                            sourceSelect.add(sourceOption);
                            sourceCount++;
                        }
                        
                        // Add to TARGET dropdown (SEMUA item)
                        const targetOption = new Option(
                            `${nama} (${kategori}) - Stok: ${stok} ${satuan}`, 
                            kode
                        );
                        targetOption.dataset.id = String(item.id || '');
                        targetOption.dataset.kode = kode;
                        targetOption.dataset.nama = nama;
                        targetOption.dataset.satuan = satuan;
                        targetOption.dataset.stok = stok.toString();
                        targetOption.dataset.kategori = kategori;
                        targetOption.dataset.hargaBeli = String(item.harga_beli || 0);
                        targetOption.dataset.hargaJual = String(item.harga_jual || 0);
                        targetOption.dataset.isReal = 'true';
                        targetOption.dataset.fromMasterBarang = 'true';
                        targetSelect.add(targetOption);
                        targetCount++;
                    });
                    
                    targetSelect.disabled = false;
                    console.log(`✅ Dropdowns populated with ALL master_barang items: ${sourceCount} source, ${targetCount} target options`);
                    
                    // Update stats
                    const availableItemsEl = document.getElementById('available-items');
                    if (availableItemsEl) {
                        availableItemsEl.textContent = sourceCount;
                    }
                    
                    // Show success message
                    self.showSuccessMessage();
                    
                    return true;
                } catch (error) {
                    console.error('❌ Error populating dropdowns with real data:', error);
                    return false;
                }
            };
            
            // Override all existing dropdown functions
            window.populateDropdowns = window.populateDropdownsWithRealData;
            window.populateDropdownsSafe = window.populateDropdownsWithRealData;
            window.populateDropdownsFixed = window.populateDropdownsWithRealData;
            window.populateDropdownsWithRealStock = window.populateDropdownsWithRealData;
        }

        /**
         * Override stock functions to use real data
         */
        overrideStockFunctions() {
            const self = this;
            
            // Override updateConversionInfo to use real-time stock
            window.updateConversionInfoWithRealData = function() {
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
                
                if (!sourceValue || !targetValue) {
                    conversionInfo.innerHTML = '<span class="text-muted">Pilih item untuk melihat rasio konversi</span>';
                    if (submitButton) submitButton.disabled = true;
                    return;
                }
                
                if (sourceValue === targetValue) {
                    conversionInfo.innerHTML = '<span class="text-warning">Item sumber dan target tidak boleh sama</span>';
                    if (submitButton) submitButton.disabled = true;
                    return;
                }
                
                try {
                    // Get real-time stock data
                    const realMasterBarang = JSON.parse(localStorage.getItem('master_barang') || '[]');
                    const sourceOption = sourceSelect.options[sourceSelect.selectedIndex];
                    const targetOption = targetSelect.options[targetSelect.selectedIndex];
                    
                    // Get real-time stock from dataset
                    let sourceStock = parseInt(sourceOption.dataset.stok) || 0;
                    let targetStock = parseInt(targetOption.dataset.stok) || 0;
                    
                    // Update with real-time data from master_barang
                    if (sourceOption.dataset.id) {
                        const realSourceItem = realMasterBarang.find(r => r.id === sourceOption.dataset.id);
                        if (realSourceItem) {
                            sourceStock = parseInt(realSourceItem.stok) || 0;
                        }
                    }
                    
                    if (targetOption.dataset.id) {
                        const realTargetItem = realMasterBarang.find(r => r.id === targetOption.dataset.id);
                        if (realTargetItem) {
                            targetStock = parseInt(realTargetItem.stok) || 0;
                        }
                    }
                    
                    const sourceItem = {
                        id: sourceOption.dataset.id || '',
                        kode: sourceValue,
                        nama: sourceOption.dataset.nama || 'Unknown',
                        satuan: sourceOption.dataset.satuan || 'unit',
                        stok: sourceStock,
                        kategori: sourceOption.dataset.kategori || 'Umum'
                    };
                    
                    const targetItem = {
                        id: targetOption.dataset.id || '',
                        kode: targetValue,
                        nama: targetOption.dataset.nama || 'Unknown',
                        satuan: targetOption.dataset.satuan || 'unit',
                        stok: targetStock,
                        kategori: targetOption.dataset.kategori || 'Umum'
                    };
                    
                    // Calculate conversion ratio (default 1:1 untuk transformasi manual)
                    let ratio = 1;
                    let conversionNote = 'Rasio 1:1 (Manual)';
                    
                    // Try to find automatic conversion ratio
                    const conversionRatios = JSON.parse(localStorage.getItem('conversionRatios') || '[]');
                    for (const productRatio of conversionRatios) {
                        if (productRatio.conversions) {
                            const conversion = productRatio.conversions.find(c => 
                                c.from === sourceItem.satuan && c.to === targetItem.satuan
                            );
                            if (conversion) {
                                ratio = conversion.ratio;
                                conversionNote = `Rasio Otomatis: 1 ${sourceItem.satuan} = ${ratio} ${targetItem.satuan}`;
                                break;
                            }
                        }
                    }
                    
                    const targetQuantity = quantity * ratio;
                    const stockSufficient = sourceItem.stok >= quantity;
                    const newSourceStock = sourceItem.stok - quantity;
                    const newTargetStock = targetItem.stok + targetQuantity;
                    
                    // Display conversion info with real-time stock
                    conversionInfo.innerHTML = `
                        <div class="small">
                            <div class="alert alert-success mb-2 py-2">
                                <i class="bi bi-check-circle me-1"></i>
                                <strong>Data Real dari Master Barang</strong>
                            </div>
                            <div class="row mb-2">
                                <div class="col-12">
                                    <strong>${conversionNote}</strong>
                                    <div class="text-muted small">Anda dapat mengubah rasio konversi sesuai kebutuhan</div>
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
                            ${!stockSufficient ? `
                            <div class="alert alert-danger mt-2 mb-0 py-2">
                                <i class="bi bi-exclamation-triangle me-1"></i>
                                Stok tidak mencukupi! Tersedia: ${sourceItem.stok} ${sourceItem.satuan}
                            </div>
                            ` : ''}
                            ` : `
                            <div class="row">
                                <div class="col-6">
                                    <span class="badge bg-success">
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
                    
                    // Enable/disable submit button
                    if (submitButton) {
                        const canSubmit = sourceValue && targetValue && quantity > 0 && stockSufficient && sourceValue !== targetValue;
                        submitButton.disabled = !canSubmit;
                    }
                    
                } catch (error) {
                    console.error('Error updating conversion info with real data:', error);
                    conversionInfo.innerHTML = '<span class="text-danger">Error memuat info konversi real-time</span>';
                }
            };
            
            // Override the existing function
            window.updateConversionInfo = window.updateConversionInfoWithRealData;
        }

        /**
         * Create sample master barang data if none exists
         */
        createSampleMasterBarang() {
            const sampleData = [
                {
                    id: 'sample001',
                    kode: 'BRG001',
                    nama: 'Beras Premium',
                    kategori_nama: 'Sembako',
                    satuan_nama: 'kg',
                    harga_beli: 12000,
                    harga_jual: 15000,
                    stok: 100,
                    stok_minimum: 10,
                    status: 'aktif',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'sample002',
                    kode: 'BRG002',
                    nama: 'Minyak Goreng',
                    kategori_nama: 'Sembako',
                    satuan_nama: 'liter',
                    harga_beli: 18000,
                    harga_jual: 22000,
                    stok: 50,
                    stok_minimum: 5,
                    status: 'aktif',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'sample003',
                    kode: 'BRG003',
                    nama: 'Air Mineral',
                    kategori_nama: 'Minuman',
                    satuan_nama: 'dus',
                    harga_beli: 48000,
                    harga_jual: 60000,
                    stok: 20,
                    stok_minimum: 2,
                    status: 'aktif',
                    created_at: new Date().toISOString()
                }
            ];
            
            localStorage.setItem('master_barang', JSON.stringify(sampleData));
            this.realMasterBarang = sampleData;
            
            console.log('✅ Sample master barang data created');
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
                        <strong>Data Real Terintegrasi!</strong> Transformasi barang sekarang menggunakan data real dari master barang, bukan data dummy.
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                `;
                
                // Auto-hide after 7 seconds
                setTimeout(() => {
                    alertContainer.innerHTML = '';
                }, 7000);
            }
        }

        /**
         * Refresh real data
         */
        async refreshRealData() {
            console.log('🔄 Refreshing real data...');
            
            try {
                await this.loadRealMasterBarang();
                this.transformRealData();
                this.setupConversionRatios();
                
                if (typeof window.populateDropdownsWithRealData === 'function') {
                    window.populateDropdownsWithRealData();
                }
                
                console.log('✅ Real data refreshed');
                return true;
            } catch (error) {
                console.error('❌ Error refreshing real data:', error);
                return false;
            }
        }

        /**
         * Update real stock after transformation
         */
        async updateRealStock(sourceItemId, targetItemId, sourceQuantityChange, targetQuantityChange) {
            try {
                const realMasterBarang = JSON.parse(localStorage.getItem('master_barang') || '[]');
                
                // Find and update source item
                const sourceIndex = realMasterBarang.findIndex(item => item.id === sourceItemId);
                if (sourceIndex !== -1) {
                    const currentSourceStock = parseInt(realMasterBarang[sourceIndex].stok) || 0;
                    realMasterBarang[sourceIndex].stok = Math.max(0, currentSourceStock + sourceQuantityChange);
                }
                
                // Find and update target item (if different from source)
                if (targetItemId !== sourceItemId) {
                    const targetIndex = realMasterBarang.findIndex(item => item.id === targetItemId);
                    if (targetIndex !== -1) {
                        const currentTargetStock = parseInt(realMasterBarang[targetIndex].stok) || 0;
                        realMasterBarang[targetIndex].stok = currentTargetStock + targetQuantityChange;
                    }
                }
                
                // Save updated data
                localStorage.setItem('master_barang', JSON.stringify(realMasterBarang));
                
                console.log('✅ Real stock updated successfully');
                return true;
            } catch (error) {
                console.error('❌ Error updating real stock:', error);
                return false;
            }
        }
    }

    // Initialize real data integration
    const realDataIntegration = new RealDataIntegration();
    
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
    async function applyRealDataIntegration() {
        try {
            await waitForDOM();
            const success = await realDataIntegration.initialize();
            
            if (success) {
                console.log('✅ REAL DATA INTEGRATION: Successfully applied!');
                
                // Make available globally
                window.realDataIntegration = realDataIntegration;
                
                // Setup refresh function
                window.refreshRealData = () => realDataIntegration.refreshRealData();
                
                // Apply dropdowns immediately if elements exist
                const sourceSelect = document.getElementById('sourceItem');
                const targetSelect = document.getElementById('targetItem');
                
                if (sourceSelect && targetSelect) {
                    setTimeout(() => {
                        if (typeof window.populateDropdownsWithRealData === 'function') {
                            window.populateDropdownsWithRealData();
                        }
                    }, 1000);
                }
                
            } else {
                console.error('❌ REAL DATA INTEGRATION: Failed to apply');
            }
        } catch (error) {
            console.error('❌ REAL DATA INTEGRATION: Error during application:', error);
        }
    }
    
    // Apply integration immediately and with delays
    applyRealDataIntegration();
    setTimeout(applyRealDataIntegration, 1000);
    setTimeout(applyRealDataIntegration, 3000);
    
    console.log('🔄 REAL DATA INTEGRATION: Loaded and ready!');
    
})();