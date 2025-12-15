/**
 * Transformasi Barang Initialization
 * Initialize transformasi barang system when page loads
 */

// Global instances untuk sistem transformasi barang
let transformationManager = null;
let uiController = null;
let validationEngine = null;
let stockManager = null;
let auditLogger = null;
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
        showAlert('Sistem transformasi barang berhasil dimuat', 'success');
        
    } catch (error) {
        console.error('Error initializing Transformasi Barang:', error);
        showAlert(`Terjadi kesalahan saat menginisialisasi sistem transformasi barang: ${error.message}`, 'danger');
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
        auditLogger = new AuditLogger();
        auditLogger.initialize();
        console.log('✓ AuditLogger initialized');
        
        // 6. Initialize TransformationManager with dependencies
        transformationManager = new TransformationManager();
        transformationManager.initialize({
            validationEngine: validationEngine,
            calculator: calculator,
            stockManager: stockManager,
            auditLogger: auditLogger
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
        window.auditLogger = auditLogger;
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
        
        // Get master barang data
        const barang = JSON.parse(localStorage.getItem('masterBarang') || localStorage.getItem('barang') || '[]');
        
        // Clear existing options
        sourceSelect.innerHTML = '<option value="">Pilih Item Sumber...</option>';
        targetSelect.innerHTML = '<option value="">Pilih Item Target...</option>';
        
        // Add products to dropdowns
        barang.forEach(item => {
            if (item.stok > 0) { // Only show items with stock for source
                const option = new Option(`${item.nama} (Stok: ${item.stok} ${item.satuan})`, item.kode || item.id);
                sourceSelect.add(option.cloneNode(true));
            }
            
            // All products can be targets
            const targetOption = new Option(`${item.nama} (Stok: ${item.stok || 0} ${item.satuan})`, item.kode || item.id);
            targetSelect.add(targetOption);
        });
        
        console.log(`Loaded ${barang.length} products for transformation`);
        
        // Enable the target select initially (will be managed by UIController)
        targetSelect.disabled = false;
        
    } catch (error) {
        console.error('Error loading products:', error);
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
            showAlert('Form elements not found', 'danger');
            return;
        }
        
        const sourceId = sourceSelect.value;
        const targetId = targetSelect.value;
        const quantity = parseFloat(quantityInput.value) || 0;
        const ratio = parseFloat(ratioInput.value) || 0;
        const notes = notesInput ? notesInput.value.trim() : '';
        
        // Validation
        if (!sourceId || !targetId) {
            showAlert('Pilih barang asal dan tujuan', 'warning');
            return;
        }
        
        if (sourceId === targetId) {
            showAlert('Barang asal dan tujuan tidak boleh sama', 'warning');
            return;
        }
        
        if (quantity <= 0) {
            showAlert('Jumlah transformasi harus lebih dari 0', 'warning');
            return;
        }
        
        if (ratio <= 0) {
            showAlert('Rasio konversi harus lebih dari 0', 'warning');
            return;
        }
        
        // Get items
        const barang = JSON.parse(localStorage.getItem('barang') || '[]');
        const sourceItem = barang.find(item => item.id == sourceId);
        const targetItem = barang.find(item => item.id == targetId);
        
        if (!sourceItem || !targetItem) {
            showAlert('Barang tidak ditemukan', 'danger');
            return;
        }
        
        // Check stock
        if (sourceItem.stok < quantity) {
            showAlert(`Stok ${sourceItem.nama} tidak mencukupi. Tersedia: ${sourceItem.stok} ${sourceItem.satuan}`, 'warning');
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
        
        showAlert(`Transformasi berhasil! ${quantity} ${sourceItem.satuan} ${sourceItem.nama} → ${resultQuantity} ${targetItem.satuan} ${targetItem.nama}`, 'success');
        
    } catch (error) {
        console.error('Error processing transformation:', error);
        showAlert('Terjadi kesalahan saat memproses transformasi', 'danger');
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
        
        // Get item details
        const barang = JSON.parse(localStorage.getItem('masterBarang') || localStorage.getItem('barang') || '[]');
        const sourceItem = barang.find(item => (item.kode || item.id) === sourceValue);
        const targetItem = barang.find(item => (item.kode || item.id) === targetValue);
        
        if (!sourceItem || !targetItem) {
            conversionInfo.innerHTML = '<span class="text-danger">Item tidak ditemukan</span>';
            return;
        }
        
        // Simple conversion ratio (this should be enhanced with proper conversion rules)
        const ratio = 1; // Default 1:1 ratio - should be configurable
        const targetQuantity = quantity * ratio;
        
        conversionInfo.innerHTML = `
            <div class="small">
                <div><strong>Rasio:</strong> 1 ${sourceItem.satuan} = ${ratio} ${targetItem.satuan}</div>
                ${quantity > 0 ? `<div><strong>Hasil:</strong> ${quantity} ${sourceItem.satuan} → ${targetQuantity} ${targetItem.satuan}</div>` : ''}
            </div>
        `;
        
        // Enable/disable submit button
        const submitButton = document.getElementById('submit-transformation');
        if (submitButton) {
            const canSubmit = sourceValue && targetValue && quantity > 0 && sourceItem.stok >= quantity;
            submitButton.disabled = !canSubmit;
        }
        
    } catch (error) {
        console.error('Error updating conversion info:', error);
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
            showAlert('Form elements tidak ditemukan', 'danger');
            return;
        }
        
        const sourceId = sourceSelect.value;
        const targetId = targetSelect.value;
        const quantity = parseFloat(quantityInput.value) || 0;
        
        // Basic validation
        if (!sourceId || !targetId) {
            showAlert('Pilih item sumber dan target', 'warning');
            return;
        }
        
        if (sourceId === targetId) {
            showAlert('Item sumber dan target tidak boleh sama', 'warning');
            return;
        }
        
        if (quantity <= 0) {
            showAlert('Jumlah harus lebih dari 0', 'warning');
            return;
        }
        
        // Get items
        const barang = JSON.parse(localStorage.getItem('masterBarang') || localStorage.getItem('barang') || '[]');
        const sourceItem = barang.find(item => (item.kode || item.id) === sourceId);
        const targetItem = barang.find(item => (item.kode || item.id) === targetId);
        
        if (!sourceItem || !targetItem) {
            showAlert('Item tidak ditemukan', 'danger');
            return;
        }
        
        // Check stock
        if (sourceItem.stok < quantity) {
            showAlert(`Stok ${sourceItem.nama} tidak mencukupi. Tersedia: ${sourceItem.stok} ${sourceItem.satuan}`, 'warning');
            return;
        }
        
        // Confirm transformation
        if (!confirm(`Konfirmasi transformasi:\n${quantity} ${sourceItem.satuan} ${sourceItem.nama} → ${quantity} ${targetItem.satuan} ${targetItem.nama}\n\nLanjutkan?`)) {
            return;
        }
        
        // Process transformation
        sourceItem.stok -= quantity;
        targetItem.stok = (targetItem.stok || 0) + quantity;
        
        // Save updated items
        localStorage.setItem('masterBarang', JSON.stringify(barang));
        if (localStorage.getItem('barang')) {
            localStorage.setItem('barang', JSON.stringify(barang));
        }
        
        // Log transformation
        logTransformation({
            sourceId: sourceId,
            sourceName: sourceItem.nama,
            targetId: targetId,
            targetName: targetItem.nama,
            quantity: quantity,
            ratio: 1,
            resultQuantity: quantity,
            timestamp: new Date().toISOString(),
            user: localStorage.getItem('currentUser') || 'Unknown'
        });
        
        // Reset form and reload data
        resetTransformationForm();
        loadProductsForTransformation();
        loadRecentTransformations();
        
        showAlert(`Transformasi berhasil! ${quantity} ${sourceItem.satuan} ${sourceItem.nama} → ${quantity} ${targetItem.satuan} ${targetItem.nama}`, 'success');
        
    } catch (error) {
        console.error('Error processing transformation:', error);
        showAlert('Terjadi kesalahan saat memproses transformasi', 'danger');
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
 * Show alert message (matches HTML structure)
 */
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) {
        console.warn('Alert container not found');
        alert(message); // Fallback to browser alert
        return;
    }
    
    const alertId = 'alert-' + Date.now();
    const iconClass = type === 'success' ? 'check-circle' : 
                     type === 'danger' ? 'exclamation-triangle' : 
                     type === 'warning' ? 'exclamation-triangle' : 'info-circle';
    
    alertContainer.innerHTML = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
            <i class="bi bi-${iconClass} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            const alertElement = document.getElementById(alertId);
            if (alertElement) {
                alertElement.remove();
            }
        }, 5000);
    }
}

// Make functions globally available
window.initializeTransformasiBarang = initializeTransformasiBarang;
window.processTransformation = processTransformationLegacy;
window.processTransformationLegacy = processTransformationLegacy;
window.showTransformationHistory = showTransformationHistory;
window.showTransformationHelp = showTransformationHelp;
window.loadTransformationHistory = loadTransformationHistory;
window.updateConversionInfo = updateConversionInfo;
window.resetTransformationForm = resetTransformationForm;
window.showAlert = showAlert;