/**
 * StockDropdownFix - Perbaikan untuk dropdown transformasi barang
 * 
 * Kelas ini memperbaiki masalah dropdown yang menampilkan "undefined"
 * dengan memastikan data stok diambil dengan benar dari sistem.
 */

class StockDropdownFix {
    constructor() {
        this.masterBarang = [];
        this.conversionRatios = [];
        this.initialized = false;
    }

    /**
     * Initialize the stock dropdown fix
     */
    async initialize() {
        try {
            console.log('🔧 Initializing StockDropdownFix...');
            
            // Load data from various sources
            await this.loadStockData();
            
            // Validate data integrity
            this.validateData();
            
            // Setup dropdown population
            this.setupDropdownPopulation();
            
            this.initialized = true;
            console.log('✅ StockDropdownFix initialized successfully');
            
            return true;
        } catch (error) {
            console.error('❌ Error initializing StockDropdownFix:', error);
            return false;
        }
    }

    /**
     * Load stock data from localStorage or initialize sample data
     */
    async loadStockData() {
        try {
            // Try to load from localStorage first
            const sources = ['masterBarang', 'barang', 'stokBarang', 'produk'];
            let dataLoaded = false;

            for (const source of sources) {
                try {
                    const data = localStorage.getItem(source);
                    if (data) {
                        const parsedData = JSON.parse(data);
                        if (Array.isArray(parsedData) && parsedData.length > 0) {
                            this.masterBarang = parsedData;
                            dataLoaded = true;
                            console.log(`📦 Data loaded from ${source}: ${parsedData.length} items`);
                            break;
                        }
                    }
                } catch (e) {
                    console.warn(`⚠️ Error loading from ${source}:`, e);
                }
            }

            // Load conversion ratios
            try {
                const ratiosData = localStorage.getItem('conversionRatios');
                if (ratiosData) {
                    this.conversionRatios = JSON.parse(ratiosData);
                }
            } catch (e) {
                console.warn('⚠️ Error loading conversion ratios:', e);
            }

            // If no data found, initialize sample data
            if (!dataLoaded) {
                console.log('📝 No existing data found, initializing sample data...');
                this.initializeSampleData();
            }

            return true;
        } catch (error) {
            console.error('❌ Error loading stock data:', error);
            throw error;
        }
    }

    /**
     * Initialize sample data for testing
     */
    initializeSampleData() {
        this.masterBarang = [
            // Beras Premium - KG ke Gram
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
            // Minyak Goreng - Liter ke ML
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
            // Air Mineral - Dus ke Botol
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

        // Save to localStorage
        localStorage.setItem('masterBarang', JSON.stringify(this.masterBarang));
        localStorage.setItem('barang', JSON.stringify(this.masterBarang));
        localStorage.setItem('conversionRatios', JSON.stringify(this.conversionRatios));

        console.log('✅ Sample data initialized and saved to localStorage');
    }

    /**
     * Validate data integrity
     */
    validateData() {
        if (!Array.isArray(this.masterBarang) || this.masterBarang.length === 0) {
            throw new Error('Master barang data is empty or invalid');
        }

        // Validate each item has required fields
        for (const item of this.masterBarang) {
            if (!item.kode || !item.nama || !item.satuan || typeof item.stok !== 'number') {
                console.warn('⚠️ Invalid item found:', item);
            }
        }

        console.log(`✅ Data validation passed: ${this.masterBarang.length} items`);
    }

    /**
     * Setup dropdown population
     */
    setupDropdownPopulation() {
        // Find dropdown elements
        const sourceSelect = document.getElementById('sourceItem');
        const targetSelect = document.getElementById('targetItem');

        if (!sourceSelect || !targetSelect) {
            console.warn('⚠️ Dropdown elements not found, will retry later');
            return;
        }

        // Populate dropdowns immediately
        this.populateDropdowns();

        // Setup event listeners
        this.setupEventListeners();

        console.log('✅ Dropdown population setup complete');
    }

    /**
     * Populate dropdowns with stock data
     */
    populateDropdowns() {
        const sourceSelect = document.getElementById('sourceItem');
        const targetSelect = document.getElementById('targetItem');

        if (!sourceSelect || !targetSelect) {
            console.warn('⚠️ Dropdown elements not found');
            return;
        }

        try {
            // Clear existing options
            sourceSelect.innerHTML = '<option value="">Pilih barang asal (yang akan dikurangi stoknya)...</option>';
            targetSelect.innerHTML = '<option value="">Pilih barang tujuan (yang akan ditambah stoknya)...</option>';

            // Group items by base product
            const baseProducts = this.groupItemsByBaseProduct();

            // Populate source dropdown (only items with stock > 0)
            Object.entries(baseProducts).forEach(([baseProduct, items]) => {
                if (items.length > 1) { // Only transformable items
                    items.forEach(item => {
                        if (item.stok > 0) { // Only items with stock
                            const option = this.createOptionElement(item, 'source');
                            sourceSelect.appendChild(option);
                        }
                    });
                }
            });

            // Populate target dropdown (all transformable items)
            Object.entries(baseProducts).forEach(([baseProduct, items]) => {
                if (items.length > 1) { // Only transformable items
                    items.forEach(item => {
                        const option = this.createOptionElement(item, 'target');
                        targetSelect.appendChild(option);
                    });
                }
            });

            console.log(`✅ Dropdowns populated: ${sourceSelect.options.length - 1} source, ${targetSelect.options.length - 1} target options`);

        } catch (error) {
            console.error('❌ Error populating dropdowns:', error);
        }
    }

    /**
     * Group items by base product
     */
    groupItemsByBaseProduct() {
        const baseProducts = {};
        
        this.masterBarang.forEach(item => {
            const baseProduct = item.baseProduct || item.kode.split('-')[0];
            if (!baseProducts[baseProduct]) {
                baseProducts[baseProduct] = [];
            }
            baseProducts[baseProduct].push(item);
        });

        return baseProducts;
    }

    /**
     * Create option element with proper data attributes
     */
    createOptionElement(item, type) {
        const option = document.createElement('option');
        option.value = item.kode;
        
        // Format display text based on type
        if (type === 'source') {
            option.textContent = `${item.nama} (${item.satuan}) - Stok: ${item.stok}`;
        } else {
            option.textContent = `${item.nama} (${item.satuan}) - Stok: ${item.stok}`;
        }

        // Add data attributes for easy access
        option.dataset.baseProduct = item.baseProduct || item.kode.split('-')[0];
        option.dataset.satuan = item.satuan;
        option.dataset.stok = item.stok;
        option.dataset.nama = item.nama;
        option.dataset.hargaBeli = item.hargaBeli || 0;
        option.dataset.hargaJual = item.hargaJual || 0;

        return option;
    }

    /**
     * Setup event listeners for dropdowns
     */
    setupEventListeners() {
        const sourceSelect = document.getElementById('sourceItem');
        const targetSelect = document.getElementById('targetItem');
        const quantityInput = document.getElementById('quantity');

        if (sourceSelect) {
            sourceSelect.addEventListener('change', () => {
                this.updateConversionInfo();
                this.filterTargetOptions();
            });
        }

        if (targetSelect) {
            targetSelect.addEventListener('change', () => {
                this.updateConversionInfo();
            });
        }

        if (quantityInput) {
            quantityInput.addEventListener('input', () => {
                this.updateConversionInfo();
            });
        }

        console.log('✅ Event listeners setup complete');
    }

    /**
     * Filter target options based on source selection
     */
    filterTargetOptions() {
        const sourceSelect = document.getElementById('sourceItem');
        const targetSelect = document.getElementById('targetItem');

        if (!sourceSelect || !targetSelect || !sourceSelect.value) {
            return;
        }

        const sourceOption = sourceSelect.options[sourceSelect.selectedIndex];
        const sourceBaseProduct = sourceOption.dataset.baseProduct;
        const sourceSatuan = sourceOption.dataset.satuan;

        // Show only compatible target options
        Array.from(targetSelect.options).forEach(option => {
            if (option.value === '') return; // Keep placeholder

            const isCompatible = option.dataset.baseProduct === sourceBaseProduct && 
                                option.dataset.satuan !== sourceSatuan &&
                                option.value !== sourceSelect.value;
            
            option.style.display = isCompatible ? 'block' : 'none';
        });

        // Reset target selection if current selection is not compatible
        const currentTargetOption = targetSelect.options[targetSelect.selectedIndex];
        if (currentTargetOption && currentTargetOption.style.display === 'none') {
            targetSelect.value = '';
        }
    }

    /**
     * Update conversion info display
     */
    updateConversionInfo() {
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
            // Get item details from dropdown options
            const sourceOption = sourceSelect.options[sourceSelect.selectedIndex];
            const targetOption = targetSelect.options[targetSelect.selectedIndex];

            const sourceItem = {
                kode: sourceValue,
                nama: sourceOption.dataset.nama,
                satuan: sourceOption.dataset.satuan,
                stok: parseInt(sourceOption.dataset.stok),
                baseProduct: sourceOption.dataset.baseProduct
            };

            const targetItem = {
                kode: targetValue,
                nama: targetOption.dataset.nama,
                satuan: targetOption.dataset.satuan,
                stok: parseInt(targetOption.dataset.stok),
                baseProduct: targetOption.dataset.baseProduct
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
            const ratio = this.getConversionRatio(sourceItem.satuan, targetItem.satuan, sourceItem.baseProduct);
            const targetQuantity = quantity * ratio;
            const stockSufficient = sourceItem.stok >= quantity;
            const newSourceStock = sourceItem.stok - quantity;
            const newTargetStock = targetItem.stok + targetQuantity;

            // Update conversion info display
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

            // Update submit button state
            const submitButton = document.getElementById('submit-transformation');
            if (submitButton) {
                const canSubmit = sourceValue && targetValue && quantity > 0 && stockSufficient && sourceValue !== targetValue;
                submitButton.disabled = !canSubmit;
            }

        } catch (error) {
            console.error('❌ Error updating conversion info:', error);
            conversionInfo.innerHTML = '<span class="text-danger">Error memuat info konversi</span>';
        }
    }

    /**
     * Get conversion ratio between two units
     */
    getConversionRatio(fromUnit, toUnit, baseProduct) {
        const productRatios = this.conversionRatios.find(r => r.baseProduct === baseProduct);
        
        if (!productRatios || !productRatios.conversions) {
            return 1; // Default ratio
        }

        const conversion = productRatios.conversions.find(c => 
            c.from === fromUnit && c.to === toUnit
        );

        return conversion ? conversion.ratio : 1;
    }

    /**
     * Get current stock for an item
     */
    getCurrentStock(itemCode) {
        const item = this.masterBarang.find(item => item.kode === itemCode);
        return item ? item.stok : 0;
    }

    /**
     * Update stock for an item
     */
    updateStock(itemCode, newStock) {
        const itemIndex = this.masterBarang.findIndex(item => item.kode === itemCode);
        if (itemIndex !== -1) {
            this.masterBarang[itemIndex].stok = newStock;
            
            // Update localStorage
            localStorage.setItem('masterBarang', JSON.stringify(this.masterBarang));
            localStorage.setItem('barang', JSON.stringify(this.masterBarang));
            
            // Refresh dropdowns to show updated stock
            this.populateDropdowns();
            
            return true;
        }
        return false;
    }

    /**
     * Refresh all dropdown data
     */
    async refresh() {
        try {
            console.log('🔄 Refreshing dropdown data...');
            
            await this.loadStockData();
            this.populateDropdowns();
            this.updateConversionInfo();
            
            console.log('✅ Dropdown data refreshed');
            return true;
        } catch (error) {
            console.error('❌ Error refreshing dropdown data:', error);
            return false;
        }
    }

    /**
     * Get transformable items (items that can be converted)
     */
    getTransformableItems() {
        const baseProducts = this.groupItemsByBaseProduct();
        const transformableItems = [];

        Object.entries(baseProducts).forEach(([baseProduct, items]) => {
            if (items.length > 1) {
                transformableItems.push(...items);
            }
        });

        return transformableItems;
    }

    /**
     * Validate transformation parameters
     */
    validateTransformation(sourceItemCode, targetItemCode, quantity) {
        const errors = [];

        // Check if items exist
        const sourceItem = this.masterBarang.find(item => item.kode === sourceItemCode);
        const targetItem = this.masterBarang.find(item => item.kode === targetItemCode);

        if (!sourceItem) {
            errors.push('Item sumber tidak ditemukan');
        }

        if (!targetItem) {
            errors.push('Item target tidak ditemukan');
        }

        if (sourceItem && targetItem) {
            // Check if same base product
            const sourceBaseProduct = sourceItem.baseProduct || sourceItem.kode.split('-')[0];
            const targetBaseProduct = targetItem.baseProduct || targetItem.kode.split('-')[0];

            if (sourceBaseProduct !== targetBaseProduct) {
                errors.push('Item sumber dan target harus dari produk yang sama');
            }

            // Check if different units
            if (sourceItem.satuan === targetItem.satuan) {
                errors.push('Item sumber dan target harus memiliki satuan yang berbeda');
            }

            // Check stock availability
            if (sourceItem.stok < quantity) {
                errors.push(`Stok tidak mencukupi. Tersedia: ${sourceItem.stok}, dibutuhkan: ${quantity}`);
            }
        }

        // Check quantity
        if (!quantity || quantity <= 0) {
            errors.push('Jumlah harus lebih dari 0');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.StockDropdownFix = StockDropdownFix;
}

// Auto-initialize if DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async () => {
        if (!window.stockDropdownFix) {
            window.stockDropdownFix = new StockDropdownFix();
            await window.stockDropdownFix.initialize();
        }
    });
}