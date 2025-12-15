/**
 * Transformasi Barang Initialization
 * Initialize transformasi barang system when page loads
 */

// Global instances untuk sistem transformasi barang
let transformationManager = null;
let uiController = null;
let validationEngine = null;
let stockManager = null;
let auditLoggerInstance = null; // Renamed to avoid conflict
let errorHandler = null;
let calculator = null;

/**
 * Initialize transformasi barang functionality
 */
function initializeTransformasiBarang() {
    try {
        console.log('Initializing Transformasi Barang system...');
        
        // Check if all required classes are available
        if (!window.TransformationManager || !window.UIController || !window.ValidationEngine || 
            !window.StockManager || !window.AuditLogger || !window.ErrorHandler || 
            !window.ConversionCalculator) {
            throw new Error('Tidak semua file JavaScript transformasi barang berhasil dimuat');
        }
        
        // Initialize all components in correct order
        initializeComponents();
        
        // Load products for dropdowns (legacy support)
        loadProductsForTransformation();
        
        // Setup event listeners (legacy support)
        setupTransformationEventListeners();
        
        // Load recent transformations (legacy support)
        loadRecentTransformations();
        
        console.log('Transformasi Barang system initialized successfully');
        
        // Show success message
        showTransformationAlert('Sistem transformasi barang berhasil dimuat', 'success');
        
    } catch (error) {
        console.error('Error initializing Transformasi Barang:', error);
        showTransformationAlert(`Terjadi kesalahan saat menginisialisasi sistem transformasi barang: ${error.message}`, 'danger');
    }
}

/**
 * Initialize all transformasi barang components
 */
function initializeComponents() {
    try {
        // 1. Initialize ErrorHandler first
        errorHandler = new ErrorHandler();
        errorHandler.initialize();
        console.log('✓ ErrorHandler initialized');
        
        // 2. Initialize ValidationEngine
        validationEngine = new ValidationEngine();
        validationEngine.initialize();
        console.log('✓ ValidationEngine initialized');
        
        // 3. Initialize ConversionCalculator
        calculator = new ConversionCalculator();
        calculator.initialize();
        console.log('✓ ConversionCalculator initialized');
        
        // 4. Initialize StockManager
        stockManager = new StockManager();
        stockManager.initialize();
        console.log('✓ StockManager initialized');
        
        // 5. Initialize AuditLogger
        auditLoggerInstance = new AuditLogger();
        auditLoggerInstance.initialize();
        console.log('✓ AuditLogger initialized');
        
        // 6. Initialize TransformationManager with dependencies
        transformationManager = new TransformationManager();
        transformationManager.initialize({
            validationEngine: validationEngine,
            calculator: calculator,
            stockManager: stockManager,
            auditLogger: auditLoggerInstance
        });
        console.log('✓ TransformationManager initialized');
        
        // 7. Initialize UIController with dependencies
        uiController = new UIController();
        uiController.initialize(transformationManager, errorHandler);
        console.log('✓ UIController initialized');
        
        // Make instances globally available
        window.transformationManager = transformationManager;
        window.uiController = uiController;
        window.validationEngine = validationEngine;
        window.stockManager = stockManager;
        window.auditLogger = auditLoggerInstance;
        window.errorHandler = errorHandler;
        window.calculator = calculator;
        
        console.log('All transformasi barang components initialized successfully');
        
    } catch (error) {
        console.error('Error initializing components:', error);
        throw error;
    }
}

/**
 * Check if all required files are loaded
 */
function checkRequiredFiles() {
    const requiredClasses = [
        'TransformationManager',
        'UIController', 
        'ValidationEngine',
        'StockManager',
        'AuditLogger',
        'ErrorHandler',
        'ConversionCalculator'
    ];
    
    const missingClasses = requiredClasses.filter(className => !window[className]);
    
    if (missingClasses.length > 0) {
        throw new Error(`File JavaScript yang diperlukan belum dimuat: ${missingClasses.join(', ')}`);
    }
    
    return true;
}

/**
 * Load products for transformation dropdowns
 */
function loadProductsForTransformation() {
    try {
        // Use the correct element IDs from the HTML
        const sourceSelect = document.getElementById('sourceItem');
        const targetSelect = document.getElementById('targetItem');
        
        if (!sourceSelect || !targetSelect) {
            console.warn('Product select elements not found - checking for correct IDs');
            console.log('Available elements:', {
                sourceItem: !!document.getElementById('sourceItem'),
                targetItem: !!document.getElementById('targetItem'),
                sourceProduct: !!document.getElementById('sourceProduct'),
                targetProduct: !!document.getElementById('targetProduct')
            });
            return;
        }
        
        // Coba ambil data dari berbagai sumber localStorage
        let barang = [];
        
        // Prioritas: masterBarang -> barang -> stokBarang -> produk
        const dataSources = ['masterBarang', 'barang', 'stokBarang', 'produk'];
        
        for (const source of dataSources) {
            try {
                const data = localStorage.getItem(source);
                if (data) {
                    const parsedData = JSON.parse(data);
                    if (Array.isArray(parsedData) && parsedData.length > 0) {
                        barang = parsedData;
                        console.log(`Data barang berhasil dimuat dari ${source}: ${barang.length} items`);
                        break;
                    }
                }
            } catch (e) {
                console.warn(`Error parsing data from ${source}:`, e);
            }
        }
        
        // Jika tidak ada data, buat data sample dan simpan
        if (barang.length === 0) {
            console.log('Tidak ada data barang ditemukan, membuat data sample...');
            barang = createSampleBarangData();
            // Simpan data sample ke localStorage
            localStorage.setItem('masterBarang', JSON.stringify(barang));
            
            // Juga buat conversion ratios sample
            const conversionRatios = createSampleConversionRatios();
            localStorage.setItem('conversionRatios', JSON.stringify(conversionRatios));
        }
        
        // Clear existing options
        sourceSelect.innerHTML = '<option value="">Pilih barang asal...</option>';
        targetSelect.innerHTML = '<option value="">Pilih barang tujuan...</option>';
        
        // Add products to dropdowns
        barang.forEach(item => {
            const itemId = item.kode || item.id || item.barcode;
            const itemName = item.nama || item.name || item.namaBarang;
            const itemUnit = item.satuan || item.unit || 'pcs';
            const itemStock = item.stok || item.stock || item.qty || 0;
            
            if (itemId && itemName) {
                // Source dropdown - hanya item dengan stok > 0
                if (itemStock > 0) {
                    const sourceOption = new Option(
                        `${itemName} (Stok: ${itemStock} ${itemUnit})`, 
                        itemId
                    );
                    sourceSelect.add(sourceOption);
                }
                
                // Target dropdown - semua item
                const targetOption = new Option(
                    `${itemName} (Stok: ${itemStock} ${itemUnit})`, 
                    itemId
                );
                targetSelect.add(targetOption);
            }
        });
        
        console.log(`Berhasil memuat ${barang.length} produk untuk transformasi`);
        
        // Enable the target select initially (will be managed by UIController)
        targetSelect.disabled = false;
        
        // Update statistik
        updateAvailableItemsCount(barang.length);
        
    } catch (error) {
        console.error('Error loading products:', error);
        showTransformationAlert('Gagal memuat data barang. Silakan refresh halaman.', 'warning');
    }
}

/**
 * Buat data sample barang untuk testing
 */
function createSampleBarangData() {
    return [
        {
            kode: 'BRG001-KG',
            nama: 'Beras Premium (Kilogram)',
            satuan: 'kg',
            stok: 100,
            baseProduct: 'BRG001',
            hargaBeli: 12000,
            hargaJual: 15000
        },
        {
            kode: 'BRG001-GR',
            nama: 'Beras Premium (Gram)',
            satuan: 'gram',
            stok: 50000,
            baseProduct: 'BRG001',
            hargaBeli: 12,
            hargaJual: 15
        },
        {
            kode: 'BRG002-LT',
            nama: 'Minyak Goreng (Liter)',
            satuan: 'liter',
            stok: 50,
            baseProduct: 'BRG002',
            hargaBeli: 18000,
            hargaJual: 22000
        },
        {
            kode: 'BRG002-ML',
            nama: 'Minyak Goreng (Mililiter)',
            satuan: 'ml',
            stok: 25000,
            baseProduct: 'BRG002',
            hargaBeli: 18,
            hargaJual: 22
        },
        {
            kode: 'BRG003-DUS',
            nama: 'Air Mineral (Dus)',
            satuan: 'dus',
            stok: 20,
            baseProduct: 'BRG003',
            hargaBeli: 48000,
            hargaJual: 60000
        },
        {
            kode: 'BRG003-BTL',
            nama: 'Air Mineral (Botol)',
            satuan: 'botol',
            stok: 480,
            baseProduct: 'BRG003',
            hargaBeli: 2000,
            hargaJual: 2500
        }
    ];
}

/**
 * Buat conversion ratios sample
 */
function createSampleConversionRatios() {
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
 * Update jumlah item tersedia di statistik
 */
function updateAvailableItemsCount(count) {
    const availableItemsElement = document.getElementById('available-items');
    if (availableItemsElement) {
        availableItemsElement.textContent = count;
    }
}

/**
 * Setup event listeners for transformation form
 */
function setupTransformationEventListeners() {
    try {
        // Use correct element IDs from HTML
        const sourceSelect = document.getElementById('sourceItem');
        const targetSelect = document.getElementById('targetItem');
        const quantityInput = document.getElementById('quantity');
        const submitButton = document.getElementById('submit-transformation');
        const resetButton = document.getElementById('reset-form');
        
        if (sourceSelect) {
            sourceSelect.addEventListener('change', function() {
                console.log('Source item changed:', this.value);
                updateConversionInfo();
                if (window.uiController && window.uiController._onSourceItemChange) {
                    window.uiController._onSourceItemChange(this.value);
                }
            });
        }
        
        if (targetSelect) {
            targetSelect.addEventListener('change', function() {
                console.log('Target item changed:', this.value);
                updateConversionInfo();
                if (window.uiController && window.uiController._onTargetItemChange) {
                    window.uiController._onTargetItemChange(this.value);
                }
            });
        }
        
        if (quantityInput) {
            quantityInput.addEventListener('input', function() {
                console.log('Quantity changed:', this.value);
                updateConversionInfo();
                if (window.uiController && window.uiController._onQuantityChange) {
                    window.uiController._onQuantityChange(this.value);
                }
            });
        }
        
        if (submitButton) {
            submitButton.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Submit transformation clicked');
                if (window.uiController && window.uiController._handleFormSubmission) {
                    window.uiController._handleFormSubmission();
                } else {
                    processTransformationLegacy();
                }
            });
        }
        
        if (resetButton) {
            resetButton.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Reset form clicked');
                resetTransformationForm();
            });
        }
        
        // Form submission handler
        const form = document.getElementById('transformation-form');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                console.log('Form submitted');
                if (window.uiController && window.uiController._handleFormSubmission) {
                    window.uiController._handleFormSubmission();
                } else {
                    processTransformationLegacy();
                }
            });
        }
        
        console.log('Event listeners setup completed');
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

/**
 * Update source stock information
 */
function updateSourceStockInfo() {
    try {
        const sourceSelect = document.getElementById('sourceProduct');
        const sourceStockInfo = document.getElementById('sourceStockInfo');
        const sourceStock = document.getElementById('sourceStock');
        const sourceUnit = document.getElementById('sourceUnit');
        
        if (!sourceSelect || !sourceStockInfo) return;
        
        const selectedId = sourceSelect.value;
        if (!selectedId) {
            sourceStockInfo.style.display = 'none';
            return;
        }
        
        const barang = JSON.parse(localStorage.getItem('barang') || '[]');
        const selectedItem = barang.find(item => item.id == selectedId);
        
        if (selectedItem) {
            sourceStock.textContent = selectedItem.stok || 0;
            sourceUnit.textContent = selectedItem.satuan || '';
            sourceStockInfo.style.display = 'block';
        }
    } catch (error) {
        console.error('Error updating source stock info:', error);
    }
}

/**
 * Update target stock information
 */
function updateTargetStockInfo() {
    try {
        const targetSelect = document.getElementById('targetProduct');
        const targetStockInfo = document.getElementById('targetStockInfo');
        const targetStock = document.getElementById('targetStock');
        const targetUnit = document.getElementById('targetUnit');
        
        if (!targetSelect || !targetStockInfo) return;
        
        const selectedId = targetSelect.value;
        if (!selectedId) {
            targetStockInfo.style.display = 'none';
            return;
        }
        
        const barang = JSON.parse(localStorage.getItem('barang') || '[]');
        const selectedItem = barang.find(item => item.id == selectedId);
        
        if (selectedItem) {
            targetStock.textContent = selectedItem.stok || 0;
            targetUnit.textContent = selectedItem.satuan || '';
            targetStockInfo.style.display = 'block';
        }
    } catch (error) {
        console.error('Error updating target stock info:', error);
    }
}

/**
 * Update transformation preview
 */
function updateTransformationPreview() {
    try {
        const sourceSelect = document.getElementById('sourceProduct');
        const targetSelect = document.getElementById('targetProduct');
        const quantityInput = document.getElementById('transformationQuantity');
        const ratioInput = document.getElementById('conversionRatio');
        const previewSection = document.getElementById('transformationPreview');
        const previewSource = document.getElementById('previewSource');
        const previewTarget = document.getElementById('previewTarget');
        
        if (!sourceSelect || !targetSelect || !quantityInput || !ratioInput || !previewSection) {
            return;
        }
        
        const sourceId = sourceSelect.value;
        const targetId = targetSelect.value;
        const quantity = parseFloat(quantityInput.value) || 0;
        const ratio = parseFloat(ratioInput.value) || 0;
        
        if (!sourceId || !targetId || quantity <= 0 || ratio <= 0) {
            previewSection.style.display = 'none';
            return;
        }
        
        const barang = JSON.parse(localStorage.getItem('barang') || '[]');
        const sourceItem = barang.find(item => item.id == sourceId);
        const targetItem = barang.find(item => item.id == targetId);
        
        if (!sourceItem || !targetItem) {
            previewSection.style.display = 'none';
            return;
        }
        
        const resultQuantity = quantity * ratio;
        
        previewSource.innerHTML = `
            <div class="text-center p-3 bg-light rounded">
                <h6>${sourceItem.nama}</h6>
                <div class="text-danger fs-5">-${quantity} ${sourceItem.satuan}</div>
                <small class="text-muted">Stok: ${sourceItem.stok} → ${sourceItem.stok - quantity}</small>
            </div>
        `;
        
        previewTarget.innerHTML = `
            <div class="text-center p-3 bg-light rounded">
                <h6>${targetItem.nama}</h6>
                <div class="text-success fs-5">+${resultQuantity} ${targetItem.satuan}</div>
                <small class="text-muted">Stok: ${targetItem.stok || 0} → ${(targetItem.stok || 0) + resultQuantity}</small>
            </div>
        `;
        
        previewSection.style.display = 'block';
    } catch (error) {
        console.error('Error updating transformation preview:', error);
    }
}

/**
 * Hide stock information
 */
function hideStockInfo() {
    const sourceStockInfo = document.getElementById('sourceStockInfo');
    const targetStockInfo = document.getElementById('targetStockInfo');
    
    if (sourceStockInfo) sourceStockInfo.style.display = 'none';
    if (targetStockInfo) targetStockInfo.style.display = 'none';
}

/**
 * Hide transformation preview
 */
function hideTransformationPreview() {
    const previewSection = document.getElementById('transformationPreview');
    if (previewSection) previewSection.style.display = 'none';
}

/**
 * Process transformation
 */
function processTransformation() {
    try {
        const sourceSelect = document.getElementById('sourceProduct');
        const targetSelect = document.getElementById('targetProduct');
        const quantityInput = document.getElementById('transformationQuantity');
        const ratioInput = document.getElementById('conversionRatio');
        const notesInput = document.getElementById('transformationNotes');
        
        if (!sourceSelect || !targetSelect || !quantityInput || !ratioInput) {
            showTransformationAlert('Form elements not found', 'danger');
            return;
        }
        
        const sourceId = sourceSelect.value;
        const targetId = targetSelect.value;
        const quantity = parseFloat(quantityInput.value) || 0;
        const ratio = parseFloat(ratioInput.value) || 0;
        const notes = notesInput ? notesInput.value.trim() : '';
        
        // Validation
        if (!sourceId || !targetId) {
            showTransformationAlert('Pilih barang asal dan tujuan', 'warning');
            return;
        }
        
        if (sourceId === targetId) {
            showTransformationAlert('Barang asal dan tujuan tidak boleh sama', 'warning');
            return;
        }
        
        if (quantity <= 0) {
            showTransformationAlert('Jumlah transformasi harus lebih dari 0', 'warning');
            return;
        }
        
        if (ratio <= 0) {
            showTransformationAlert('Rasio konversi harus lebih dari 0', 'warning');
            return;
        }
        
        // Get items
        const barang = JSON.parse(localStorage.getItem('barang') || '[]');
        const sourceItem = barang.find(item => item.id == sourceId);
        const targetItem = barang.find(item => item.id == targetId);
        
        if (!sourceItem || !targetItem) {
            showTransformationAlert('Barang tidak ditemukan', 'danger');
            return;
        }
        
        // Check stock
        if (sourceItem.stok < quantity) {
            showTransformationAlert(`Stok ${sourceItem.nama} tidak mencukupi. Tersedia: ${sourceItem.stok} ${sourceItem.satuan}`, 'warning');
            return;
        }
        
        // Confirm transformation
        if (!confirm(`Konfirmasi transformasi:\n${quantity} ${sourceItem.satuan} ${sourceItem.nama} → ${quantity * ratio} ${targetItem.satuan} ${targetItem.nama}\n\nProses ini tidak dapat dibatalkan. Lanjutkan?`)) {
            return;
        }
        
        // Process transformation
        const resultQuantity = quantity * ratio;
        
        // Update source item stock
        sourceItem.stok -= quantity;
        
        // Update target item stock
        targetItem.stok = (targetItem.stok || 0) + resultQuantity;
        
        // Save updated items
        localStorage.setItem('barang', JSON.stringify(barang));
        
        // Log transformation
        logTransformation({
            sourceId: sourceId,
            sourceName: sourceItem.nama,
            targetId: targetId,
            targetName: targetItem.nama,
            quantity: quantity,
            ratio: ratio,
            resultQuantity: resultQuantity,
            notes: notes,
            timestamp: new Date().toISOString(),
            user: currentUser ? currentUser.name : 'Unknown'
        });
        
        // Reset form
        document.getElementById('transformationForm').reset();
        hideStockInfo();
        hideTransformationPreview();
        
        // Reload products
        loadProductsForTransformation();
        loadRecentTransformations();
        
        showTransformationAlert(`Transformasi berhasil! ${quantity} ${sourceItem.satuan} ${sourceItem.nama} → ${resultQuantity} ${targetItem.satuan} ${targetItem.nama}`, 'success');
        
    } catch (error) {
        console.error('Error processing transformation:', error);
        showTransformationAlert('Terjadi kesalahan saat memproses transformasi', 'danger');
    }
}

/**
 * Log transformation to history
 */
function logTransformation(transformationData) {
    try {
        const history = JSON.parse(localStorage.getItem('transformationHistory') || '[]');
        history.unshift(transformationData);
        
        // Keep only last 100 transformations
        if (history.length > 100) {
            history.splice(100);
        }
        
        localStorage.setItem('transformationHistory', JSON.stringify(history));
        
        // Also log to audit system if available
        if (typeof logAuditEvent === 'function') {
            logAuditEvent('transformation', 'create', {
                action: 'Transformasi Barang',
                details: `${transformationData.quantity} ${transformationData.sourceName} → ${transformationData.resultQuantity} ${transformationData.targetName}`,
                notes: transformationData.notes
            });
        }
    } catch (error) {
        console.error('Error logging transformation:', error);
    }
}

/**
 * Update conversion info display
 */
function updateConversionInfo() {
    try {
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
        
        // Get item details
        const barang = JSON.parse(localStorage.getItem('masterBarang') || localStorage.getItem('barang') || '[]');
        const sourceItem = barang.find(item => (item.kode || item.id) === sourceValue);
        const targetItem = barang.find(item => (item.kode || item.id) === targetValue);
        
        if (!sourceItem || !targetItem) {
            conversionInfo.innerHTML = '<span class="text-danger">Item tidak ditemukan</span>';
            if (submitButton) submitButton.disabled = true;
            return;
        }
        
        // Cek apakah item dari produk yang sama
        const sourceBaseProduct = sourceItem.baseProduct || sourceItem.kode.split('-')[0];
        const targetBaseProduct = targetItem.baseProduct || targetItem.kode.split('-')[0];
        
        if (sourceBaseProduct !== targetBaseProduct) {
            conversionInfo.innerHTML = '<span class="text-warning">Item harus dari produk yang sama untuk transformasi</span>';
            if (submitButton) submitButton.disabled = true;
            return;
        }
        
        // Cari rasio konversi
        let ratio = 1; // Default 1:1 ratio
        const conversionRatios = JSON.parse(localStorage.getItem('conversionRatios') || '[]');
        
        // Cari rasio untuk base product ini
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
        
        // Cek stok mencukupi
        const stockSufficient = sourceItem.stok >= quantity;
        
        conversionInfo.innerHTML = `
            <div class="small">
                <div><strong>Rasio:</strong> 1 ${sourceItem.satuan} = ${ratio} ${targetItem.satuan}</div>
                ${quantity > 0 ? `<div><strong>Hasil:</strong> ${quantity} ${sourceItem.satuan} → ${targetQuantity.toFixed(3)} ${targetItem.satuan}</div>` : ''}
                <div class="mt-1">
                    <span class="badge bg-${stockSufficient ? 'success' : 'danger'}">
                        Stok ${sourceItem.nama}: ${sourceItem.stok} ${sourceItem.satuan}
                    </span>
                </div>
            </div>
        `;
        
        // Enable/disable submit button
        if (submitButton) {
            const canSubmit = sourceValue && targetValue && quantity > 0 && stockSufficient && sourceValue !== targetValue;
            submitButton.disabled = !canSubmit;
        }
        
    } catch (error) {
        console.error('Error updating conversion info:', error);
        const conversionInfo = document.getElementById('conversion-info');
        if (conversionInfo) {
            conversionInfo.innerHTML = '<span class="text-danger">Error memuat info konversi</span>';
        }
    }
}

/**
 * Reset transformation form
 */
function resetTransformationForm() {
    try {
        const sourceSelect = document.getElementById('sourceItem');
        const targetSelect = document.getElementById('targetItem');
        const quantityInput = document.getElementById('quantity');
        const conversionInfo = document.getElementById('conversion-info');
        const previewContainer = document.getElementById('preview-container');
        const submitButton = document.getElementById('submit-transformation');
        
        if (sourceSelect) sourceSelect.value = '';
        if (targetSelect) targetSelect.value = '';
        if (quantityInput) quantityInput.value = '';
        if (conversionInfo) conversionInfo.innerHTML = '<span class="text-muted">Pilih item untuk melihat rasio konversi</span>';
        if (previewContainer) previewContainer.style.display = 'none';
        if (submitButton) submitButton.disabled = true;
        
        console.log('Form reset completed');
    } catch (error) {
        console.error('Error resetting form:', error);
    }
}

/**
 * Process transformation (legacy fallback)
 */
function processTransformationLegacy() {
    try {
        const sourceSelect = document.getElementById('sourceItem');
        const targetSelect = document.getElementById('targetItem');
        const quantityInput = document.getElementById('quantity');
        
        if (!sourceSelect || !targetSelect || !quantityInput) {
            showTransformationAlert('Form elements tidak ditemukan', 'danger');
            return;
        }
        
        const sourceId = sourceSelect.value;
        const targetId = targetSelect.value;
        const quantity = parseFloat(quantityInput.value) || 0;
        
        // Basic validation
        if (!sourceId || !targetId) {
            showTransformationAlert('Pilih item sumber dan target', 'warning');
            return;
        }
        
        if (sourceId === targetId) {
            showTransformationAlert('Item sumber dan target tidak boleh sama', 'warning');
            return;
        }
        
        if (quantity <= 0) {
            showTransformationAlert('Jumlah harus lebih dari 0', 'warning');
            return;
        }
        
        // Get items
        const barang = JSON.parse(localStorage.getItem('masterBarang') || localStorage.getItem('barang') || '[]');
        const sourceItem = barang.find(item => (item.kode || item.id) === sourceId);
        const targetItem = barang.find(item => (item.kode || item.id) === targetId);
        
        if (!sourceItem || !targetItem) {
            showTransformationAlert('Item tidak ditemukan', 'danger');
            return;
        }
        
        // Cek apakah item dari produk yang sama
        const sourceBaseProduct = sourceItem.baseProduct || sourceItem.kode.split('-')[0];
        const targetBaseProduct = targetItem.baseProduct || targetItem.kode.split('-')[0];
        
        if (sourceBaseProduct !== targetBaseProduct) {
            showTransformationAlert('Item harus dari produk yang sama untuk transformasi', 'warning');
            return;
        }
        
        // Check stock
        if (sourceItem.stok < quantity) {
            showTransformationAlert(`Stok ${sourceItem.nama} tidak mencukupi. Tersedia: ${sourceItem.stok} ${sourceItem.satuan}`, 'warning');
            return;
        }
        
        // Cari rasio konversi
        let ratio = 1; // Default 1:1 ratio
        const conversionRatios = JSON.parse(localStorage.getItem('conversionRatios') || '[]');
        
        // Cari rasio untuk base product ini
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
        
        // Confirm transformation
        if (!confirm(`Konfirmasi transformasi:\n${quantity} ${sourceItem.satuan} ${sourceItem.nama} → ${targetQuantity.toFixed(3)} ${targetItem.satuan} ${targetItem.nama}\n\nRasio konversi: 1 ${sourceItem.satuan} = ${ratio} ${targetItem.satuan}\n\nLanjutkan?`)) {
            return;
        }
        
        // Show loading
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
        }
        
        try {
            // Process transformation
            sourceItem.stok -= quantity;
            targetItem.stok = (targetItem.stok || 0) + targetQuantity;
            
            // Save updated items
            localStorage.setItem('masterBarang', JSON.stringify(barang));
            if (localStorage.getItem('barang')) {
                localStorage.setItem('barang', JSON.stringify(barang));
            }
            
            // Log transformation
            logTransformation({
                id: 'TRF-' + Date.now(),
                sourceId: sourceId,
                sourceName: sourceItem.nama,
                targetId: targetId,
                targetName: targetItem.nama,
                quantity: quantity,
                ratio: ratio,
                resultQuantity: targetQuantity,
                timestamp: new Date().toISOString(),
                user: localStorage.getItem('currentUser') || 'Test User',
                sourceUnit: sourceItem.satuan,
                targetUnit: targetItem.satuan
            });
            
            // Reset form and reload data
            resetTransformationForm();
            loadProductsForTransformation();
            loadRecentTransformations();
            updateStats();
            
            showTransformationAlert(`Transformasi berhasil! ${quantity} ${sourceItem.satuan} ${sourceItem.nama} → ${targetQuantity.toFixed(3)} ${targetItem.satuan} ${targetItem.nama}`, 'success');
            
        } finally {
            // Hide loading
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
        }
        
    } catch (error) {
        console.error('Error processing transformation:', error);
        showTransformationAlert('Terjadi kesalahan saat memproses transformasi', 'danger');
        
        // Hide loading on error
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }
}

/**
 * Load recent transformations
 */
function loadRecentTransformations() {
    try {
        const container = document.getElementById('recent-transformations');
        if (!container) return;
        
        const history = JSON.parse(localStorage.getItem('transformationHistory') || '[]');
        const recent = history.slice(0, 5); // Show last 5
        
        if (recent.length === 0) {
            container.innerHTML = `
                <div class="list-group-item text-center text-muted py-4">
                    <i class="bi bi-inbox display-6 d-block mb-2"></i>
                    Belum ada transformasi hari ini
                </div>
            `;
            return;
        }
        
        container.innerHTML = recent.map(item => `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${item.sourceName} → ${item.targetName}</h6>
                        <p class="mb-1 small text-muted">
                            ${item.quantity} → ${item.resultQuantity} (${item.ratio}x)
                        </p>
                        <small class="text-muted">${new Date(item.timestamp).toLocaleTimeString('id-ID')}</small>
                    </div>
                    <span class="badge bg-success">Berhasil</span>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading recent transformations:', error);
    }
}

/**
 * Load transformation history for modal
 */
function loadTransformationHistory() {
    try {
        const tbody = document.getElementById('historyTableBody');
        if (!tbody) return;
        
        const history = JSON.parse(localStorage.getItem('transformationHistory') || '[]');
        
        if (history.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted">
                        <i class="bi bi-inbox"></i> Belum ada riwayat transformasi
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = history.map(item => `
            <tr>
                <td>${new Date(item.timestamp).toLocaleDateString('id-ID', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</td>
                <td>${item.sourceName}</td>
                <td>${item.targetName}</td>
                <td>${item.quantity} → ${item.resultQuantity}</td>
                <td>${item.ratio}x</td>
                <td>${item.user}</td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading transformation history:', error);
    }
}

/**
 * Show alert message (uses global showAlert function from HTML)
 */
function showTransformationAlert(message, type = 'info') {
    // Use the global showAlert function if available, otherwise fallback
    if (typeof window.showAlert === 'function') {
        window.showAlert(message, type);
    } else {
        console.warn('Global showAlert function not found, using fallback');
        alert(message); // Fallback to browser alert
    }
}

/**
 * Main processTransformation function (wrapper)
 */
function processTransformation() {
    try {
        // Try to use advanced system first
        if (window.uiController && window.uiController._handleFormSubmission) {
            window.uiController._handleFormSubmission();
        } else {
            // Fallback to legacy system
            processTransformationLegacy();
        }
    } catch (error) {
        console.error('Error in processTransformation:', error);
        // Fallback to legacy system on error
        processTransformationLegacy();
    }
}

// Make functions globally available
window.initializeTransformasiBarang = initializeTransformasiBarang;
window.processTransformation = processTransformation;
window.processTransformationLegacy = processTransformationLegacy;
window.showTransformationHistory = showTransformationHistory;
window.showTransformationHelp = showTransformationHelp;
window.loadTransformationHistory = loadTransformationHistory;
window.updateConversionInfo = updateConversionInfo;
window.resetTransformationForm = resetTransformationForm;
window.showTransformationAlert = showTransformationAlert;
