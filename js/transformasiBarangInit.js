/**
 * Transformasi Barang Initialization
 * Initialize transformasi barang system when page loads
 */

/**
 * Initialize transformasi barang functionality
 */
function initializeTransformasiBarang() {
    try {
        console.log('Initializing Transformasi Barang system...');
        
        // Load products for dropdowns
        loadProductsForTransformation();
        
        // Setup event listeners
        setupTransformationEventListeners();
        
        // Load recent transformations
        loadRecentTransformations();
        
        console.log('Transformasi Barang system initialized successfully');
    } catch (error) {
        console.error('Error initializing Transformasi Barang:', error);
        showAlert('Terjadi kesalahan saat menginisialisasi sistem transformasi barang', 'warning');
    }
}

/**
 * Load products for transformation dropdowns
 */
function loadProductsForTransformation() {
    try {
        const barang = JSON.parse(localStorage.getItem('barang') || '[]');
        const sourceSelect = document.getElementById('sourceProduct');
        const targetSelect = document.getElementById('targetProduct');
        
        if (!sourceSelect || !targetSelect) {
            console.warn('Product select elements not found');
            return;
        }
        
        // Clear existing options
        sourceSelect.innerHTML = '<option value="">Pilih barang asal...</option>';
        targetSelect.innerHTML = '<option value="">Pilih barang tujuan...</option>';
        
        // Add products to dropdowns
        barang.forEach(item => {
            if (item.stok > 0) { // Only show items with stock for source
                const option = new Option(`${item.nama} (${item.stok} ${item.satuan})`, item.id);
                sourceSelect.add(option.cloneNode(true));
            }
            
            // All products can be targets
            const targetOption = new Option(`${item.nama} (${item.satuan})`, item.id);
            targetSelect.add(targetOption);
        });
        
        console.log(`Loaded ${barang.length} products for transformation`);
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

/**
 * Setup event listeners for transformation form
 */
function setupTransformationEventListeners() {
    try {
        const sourceSelect = document.getElementById('sourceProduct');
        const targetSelect = document.getElementById('targetProduct');
        const quantityInput = document.getElementById('transformationQuantity');
        const ratioInput = document.getElementById('conversionRatio');
        
        if (sourceSelect) {
            sourceSelect.addEventListener('change', function() {
                updateSourceStockInfo();
                updateTransformationPreview();
            });
        }
        
        if (targetSelect) {
            targetSelect.addEventListener('change', function() {
                updateTargetStockInfo();
                updateTransformationPreview();
            });
        }
        
        if (quantityInput) {
            quantityInput.addEventListener('input', updateTransformationPreview);
        }
        
        if (ratioInput) {
            ratioInput.addEventListener('input', updateTransformationPreview);
        }
        
        // Form reset handler
        const form = document.getElementById('transformationForm');
        if (form) {
            form.addEventListener('reset', function() {
                setTimeout(() => {
                    hideStockInfo();
                    hideTransformationPreview();
                }, 100);
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
 * Load recent transformations
 */
function loadRecentTransformations() {
    try {
        const container = document.getElementById('recentTransformations');
        if (!container) return;
        
        const history = JSON.parse(localStorage.getItem('transformationHistory') || '[]');
        const recent = history.slice(0, 5); // Show last 5
        
        if (recent.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted">
                    <i class="bi bi-inbox"></i>
                    <p class="mb-0">Belum ada transformasi</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = recent.map(item => `
            <div class="border-bottom pb-2 mb-2">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <small class="text-muted">${new Date(item.timestamp).toLocaleDateString('id-ID')}</small>
                        <div style="font-size: 0.9rem;">
                            <strong>${item.sourceName}</strong> → <strong>${item.targetName}</strong>
                        </div>
                        <small class="text-muted">${item.quantity} → ${item.resultQuantity} (${item.ratio}x)</small>
                    </div>
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

// Make functions globally available
window.initializeTransformasiBarang = initializeTransformasiBarang;
window.processTransformation = processTransformation;
window.showTransformationHistory = showTransformationHistory;
window.showTransformationHelp = showTransformationHelp;
window.loadTransformationHistory = loadTransformationHistory;