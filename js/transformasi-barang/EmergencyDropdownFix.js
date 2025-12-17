/**
 * EmergencyDropdownFix - Perbaikan darurat untuk dropdown undefined
 * 
 * Kelas ini mengatasi masalah dropdown yang menampilkan "undefined (undefined) - Stok: undefined"
 * dengan memastikan data yang bersih dan format yang benar.
 */

class EmergencyDropdownFix {
    constructor() {
        this.masterBarang = [];
        this.conversionRatios = [];
        this.initialized = false;
        this.debugMode = true;
    }

    /**
     * Initialize emergency fix
     */
    async initialize() {
        try {
            this.log('🚨 EMERGENCY FIX: Starting dropdown repair...', 'warn');
            
            // Step 1: Clear corrupted data
            this.clearCorruptedData();
            
            // Step 2: Initialize clean data
            this.initializeCleanData();
            
            // Step 3: Wait for DOM elements
            await this.waitForElements();
            
            // Step 4: Populate dropdowns
            this.populateDropdowns();
            
            // Step 5: Setup event listeners
            this.setupEventListeners();
            
            this.initialized = true;
            this.log('✅ EMERGENCY FIX: Dropdown repair completed successfully!', 'success');
            
            return true;
        } catch (error) {
            this.log(`❌ EMERGENCY FIX FAILED: ${error.message}`, 'error');
            console.error('Emergency fix error:', error);
            return false;
        }
    }

    /**
     * Wait for DOM elements to be available
     */
    async waitForElements() {
        return new Promise((resolve) => {
            const checkElements = () => {
                const sourceSelect = document.getElementById('sourceItem');
                const targetSelect = document.getElementById('targetItem');
                
                if (sourceSelect && targetSelect) {
                    this.log('✅ DOM elements found', 'info');
                    resolve();
                } else {
                    this.log('⏳ Waiting for DOM elements...', 'info');
                    setTimeout(checkElements, 100);
                }
            };
            
            checkElements();
        });
    }

    /**
     * Clear corrupted data from localStorage
     */
    clearCorruptedData() {
        this.log('🧹 Clearing corrupted data...', 'info');
        
        const keysToCheck = ['masterBarang', 'barang', 'stokBarang', 'produk', 'conversionRatios'];
        let clearedCount = 0;
        
        keysToCheck.forEach(key => {
            try {
                const data = localStorage.getItem(key);
                if (data) {
                    const parsed = JSON.parse(data);
                    if (Array.isArray(parsed)) {
                        // Check for corruption
                        const hasCorruption = parsed.some(item => 
                            !item || 
                            item.nama === undefined || 
                            item.satuan === undefined || 
                            item.stok === undefined ||
                            item.nama === 'undefined' ||
                            item.satuan === 'undefined' ||
                            typeof item.nama !== 'string' ||
                            typeof item.satuan !== 'string' ||
                            typeof item.stok !== 'number'
                        );
                        
                        if (hasCorruption) {
                            localStorage.removeItem(key);
                            clearedCount++;
                            this.log(`🗑️ Removed corrupted data from ${key}`, 'warn');
                        }
                    }
                }
            } catch (e) {
                localStorage.removeItem(key);
                clearedCount++;
                this.log(`🗑️ Removed invalid data from ${key}`, 'warn');
            }
        });
        
        this.log(`✅ Data cleanup completed: ${clearedCount} corrupted entries removed`, 'success');
    }

    /**
     * Initialize clean, guaranteed data
     */
    initializeCleanData() {
        this.log('📝 Initializing clean data...', 'info');
        
        // Clean, guaranteed data structure - NO undefined values
        this.masterBarang = [
            {
                kode: 'BRG001',
                nama: 'Beras Premium',
                satuan: 'kg',
                stok: 100,
                baseProduct: 'BRG001',
                hargaBeli: 12000,
                hargaJual: 15000
            },
            {
                kode: 'BRG002',
                nama: 'Beras Premium',
                satuan: 'gram',
                stok: 50000,
                baseProduct: 'BRG001',
                hargaBeli: 12,
                hargaJual: 15
            },
            {
                kode: 'BRG003',
                nama: 'Minyak Goreng',
                satuan: 'liter',
                stok: 50,
                baseProduct: 'BRG002',
                hargaBeli: 18000,
                hargaJual: 22000
            },
            {
                kode: 'BRG004',
                nama: 'Minyak Goreng',
                satuan: 'ml',
                stok: 25000,
                baseProduct: 'BRG002',
                hargaBeli: 18,
                hargaJual: 22
            },
            {
                kode: 'BRG005',
                nama: 'Air Mineral',
                satuan: 'dus',
                stok: 20,
                baseProduct: 'BRG003',
                hargaBeli: 48000,
                hargaJual: 60000
            },
            {
                kode: 'BRG006',
                nama: 'Air Mineral',
                satuan: 'botol',
                stok: 480,
                baseProduct: 'BRG003',
                hargaBeli: 2000,
                hargaJual: 2500
            }
        ];

        this.conversionRatios = [
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

        // Validate data before saving
        this.validateData();

        // Save clean data to localStorage
        localStorage.setItem('masterBarang', JSON.stringify(this.masterBarang));
        localStorage.setItem('barang', JSON.stringify(this.masterBarang));
        localStorage.setItem('conversionRatios', JSON.stringify(this.conversionRatios));
        
        this.log(`✅ Clean data initialized: ${this.masterBarang.length} items, ${this.conversionRatios.length} conversion groups`, 'success');
    }

    /**
     * Validate data integrity
     */
    validateData() {
        this.log('🔍 Validating data integrity...', 'info');
        
        let errors = [];
        
        this.masterBarang.forEach((item, index) => {
            if (!item.kode || typeof item.kode !== 'string') {
                errors.push(`Item ${index}: Invalid kode`);
            }
            if (!item.nama || typeof item.nama !== 'string') {
                errors.push(`Item ${index}: Invalid nama`);
            }
            if (!item.satuan || typeof item.satuan !== 'string') {
                errors.push(`Item ${index}: Invalid satuan`);
            }
            if (typeof item.stok !== 'number' || item.stok < 0) {
                errors.push(`Item ${index}: Invalid stok`);
            }
        });
        
        if (errors.length > 0) {
            throw new Error(`Data validation failed: ${errors.join(', ')}`);
        }
        
        this.log('✅ Data validation passed', 'success');
    }

    /**
     * Populate dropdowns with guaranteed clean data
     */
    populateDropdowns() {
        this.log('🔄 Populating dropdowns with clean data...', 'info');
        
        const sourceSelect = document.getElementById('sourceItem');
        const targetSelect = document.getElementById('targetItem');
        
        if (!sourceSelect || !targetSelect) {
            throw new Error('Dropdown elements not found');
        }

        // Clear existing options
        sourceSelect.innerHTML = '<option value="">Pilih barang asal (yang akan dikurangi stoknya)...</option>';
        targetSelect.innerHTML = '<option value="">Pilih barang tujuan (yang akan ditambah stoknya)...</option>';

        // Group by base product
        const baseProducts = {};
        this.masterBarang.forEach(item => {
            const baseProduct = item.baseProduct;
            if (!baseProducts[baseProduct]) {
                baseProducts[baseProduct] = [];
            }
            baseProducts[baseProduct].push(item);
        });

        let sourceCount = 0;
        let targetCount = 0;

        // Populate source dropdown (only items with stock > 0)
        Object.entries(baseProducts).forEach(([baseProduct, items]) => {
            if (items.length > 1) { // Only transformable items
                items.forEach(item => {
                    if (item.stok > 0) { // Only items with stock
                        const option = this.createCleanOption(item);
                        sourceSelect.appendChild(option);
                        sourceCount++;
                    }
                });
            }
        });

        // Populate target dropdown (all transformable items)
        Object.entries(baseProducts).forEach(([baseProduct, items]) => {
            if (items.length > 1) { // Only transformable items
                items.forEach(item => {
                    const option = this.createCleanOption(item);
                    targetSelect.appendChild(option);
                    targetCount++;
                });
            }
        });

        this.log(`✅ Dropdowns populated successfully: ${sourceCount} source options, ${targetCount} target options`, 'success');
        
        // Verify no undefined values
        this.verifyDropdownContent(sourceSelect, 'source');
        this.verifyDropdownContent(targetSelect, 'target');
    }

    /**
     * Create clean option element with guaranteed data
     */
    createCleanOption(item) {
        const option = document.createElement('option');
        option.value = item.kode;
        
        // GUARANTEED format - absolutely no undefined values
        const nama = String(item.nama || 'Unknown');
        const satuan = String(item.satuan || 'unit');
        const stok = Number(item.stok || 0);
        
        option.textContent = `${nama} (${satuan}) - Stok: ${stok}`;
        
        // Set data attributes safely
        option.dataset.baseProduct = String(item.baseProduct || item.kode);
        option.dataset.satuan = satuan;
        option.dataset.stok = stok.toString();
        option.dataset.nama = nama;
        option.dataset.hargaBeli = String(item.hargaBeli || 0);
        option.dataset.hargaJual = String(item.hargaJual || 0);
        
        return option;
    }

    /**
     * Verify dropdown content has no undefined values
     */
    verifyDropdownContent(selectElement, type) {
        let hasUndefined = false;
        
        for (let i = 1; i < selectElement.options.length; i++) {
            const option = selectElement.options[i];
            if (option.textContent.includes('undefined') || 
                option.textContent.includes('NaN') ||
                option.dataset.nama === 'undefined' ||
                option.dataset.satuan === 'undefined') {
                hasUndefined = true;
                this.log(`❌ Found undefined in ${type} dropdown option ${i}: ${option.textContent}`, 'error');
            }
        }
        
        if (!hasUndefined) {
            this.log(`✅ ${type} dropdown verification passed - no undefined values`, 'success');
        } else {
            throw new Error(`${type} dropdown contains undefined values`);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.log('🔗 Setting up event listeners...', 'info');
        
        const sourceSelect = document.getElementById('sourceItem');
        const targetSelect = document.getElementById('targetItem');
        const quantityInput = document.getElementById('quantity');
        
        if (sourceSelect) {
            sourceSelect.addEventListener('change', () => {
                this.log('Source item changed', 'info');
                this.updateConversionInfo();
            });
        }
        
        if (targetSelect) {
            targetSelect.addEventListener('change', () => {
                this.log('Target item changed', 'info');
                this.updateConversionInfo();
            });
        }
        
        if (quantityInput) {
            quantityInput.addEventListener('input', () => {
                this.updateConversionInfo();
            });
        }
        
        this.log('✅ Event listeners setup completed', 'success');
    }

    /**
     * Update conversion info display
     */
    updateConversionInfo() {
        const sourceSelect = document.getElementById('sourceItem');
        const targetSelect = document.getElementById('targetItem');
        const quantityInput = document.getElementById('quantity');
        const conversionInfo = document.getElementById('conversion-info');
        
        if (!conversionInfo) return;
        
        const sourceValue = sourceSelect?.value;
        const targetValue = targetSelect?.value;
        const quantity = parseFloat(quantityInput?.value) || 0;
        
        if (!sourceValue || !targetValue) {
            conversionInfo.innerHTML = '<span class="text-muted">Pilih item untuk melihat rasio konversi</span>';
            return;
        }
        
        try {
            // Get item details safely
            const sourceOption = sourceSelect.options[sourceSelect.selectedIndex];
            const targetOption = targetSelect.options[targetSelect.selectedIndex];
            
            const sourceItem = {
                kode: sourceValue,
                nama: sourceOption.dataset.nama || 'Unknown',
                satuan: sourceOption.dataset.satuan || 'unit',
                stok: parseInt(sourceOption.dataset.stok) || 0,
                baseProduct: sourceOption.dataset.baseProduct || sourceValue
            };
            
            const targetItem = {
                kode: targetValue,
                nama: targetOption.dataset.nama || 'Unknown',
                satuan: targetOption.dataset.satuan || 'unit',
                stok: parseInt(targetOption.dataset.stok) || 0,
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
            const productRatios = this.conversionRatios.find(r => r.baseProduct === sourceItem.baseProduct);
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
            
            // Display conversion info
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
            this.log(`Error updating conversion info: ${error.message}`, 'error');
            conversionInfo.innerHTML = '<span class="text-danger">Error memuat info konversi</span>';
        }
    }

    /**
     * Logging function
     */
    log(message, level = 'info') {
        if (!this.debugMode) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[${timestamp}] [EmergencyFix]`;
        
        switch (level) {
            case 'error':
                console.error(`${prefix} ❌ ${message}`);
                break;
            case 'warn':
                console.warn(`${prefix} ⚠️ ${message}`);
                break;
            case 'success':
                console.log(`${prefix} ✅ ${message}`);
                break;
            default:
                console.log(`${prefix} ℹ️ ${message}`);
        }
    }

    /**
     * Force refresh - clear everything and reinitialize
     */
    async forceRefresh() {
        this.log('🔄 Force refresh initiated...', 'warn');
        
        // Clear localStorage
        localStorage.clear();
        
        // Reset state
        this.initialized = false;
        this.masterBarang = [];
        this.conversionRatios = [];
        
        // Reinitialize
        return await this.initialize();
    }

    /**
     * Get current stock for an item
     */
    getCurrentStock(itemCode) {
        const item = this.masterBarang.find(item => item.kode === itemCode);
        return item ? item.stok : 0;
    }

    /**
     * Validate transformation
     */
    validateTransformation(sourceItemCode, targetItemCode, quantity) {
        const errors = [];
        
        const sourceItem = this.masterBarang.find(item => item.kode === sourceItemCode);
        const targetItem = this.masterBarang.find(item => item.kode === targetItemCode);
        
        if (!sourceItem) {
            errors.push('Item sumber tidak ditemukan');
        }
        
        if (!targetItem) {
            errors.push('Item target tidak ditemukan');
        }
        
        if (sourceItem && targetItem) {
            if (sourceItem.baseProduct !== targetItem.baseProduct) {
                errors.push('Item harus dari produk yang sama');
            }
            
            if (sourceItem.satuan === targetItem.satuan) {
                errors.push('Item harus memiliki satuan yang berbeda');
            }
            
            if (sourceItem.stok < quantity) {
                errors.push(`Stok tidak mencukupi. Tersedia: ${sourceItem.stok}, dibutuhkan: ${quantity}`);
            }
        }
        
        if (!quantity || quantity <= 0) {
            errors.push('Jumlah harus lebih dari 0');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async () => {
        // Only initialize if not already done
        if (!window.emergencyDropdownFix) {
            console.log('🚨 EMERGENCY DROPDOWN FIX: Auto-initializing...');
            window.emergencyDropdownFix = new EmergencyDropdownFix();
            const success = await window.emergencyDropdownFix.initialize();
            
            if (success) {
                console.log('✅ EMERGENCY DROPDOWN FIX: Successfully applied!');
                
                // Show success message to user
                const alertContainer = document.getElementById('alert-container') || document.getElementById('success-container');
                if (alertContainer) {
                    alertContainer.innerHTML = `
                        <div class="alert alert-success alert-dismissible fade show" role="alert">
                            <i class="bi bi-check-circle me-2"></i>
                            <strong>Dropdown Fixed!</strong> Masalah "undefined" telah diperbaiki. Dropdown sekarang menampilkan data yang benar.
                            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                        </div>
                    `;
                }
            } else {
                console.error('❌ EMERGENCY DROPDOWN FIX: Failed to apply fix');
            }
        }
    });
}

// Make available globally
if (typeof window !== 'undefined') {
    window.EmergencyDropdownFix = EmergencyDropdownFix;
}