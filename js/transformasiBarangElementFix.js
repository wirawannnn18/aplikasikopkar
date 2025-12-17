/**
 * Transformasi Barang Element Fix
 * Fixes the "Product select elements not found" error
 */

(function() {
    'use strict';
    
    console.log('🔧 Loading Transformasi Barang Element Fix...');
    
    // Global flag to prevent multiple initializations
    let fixApplied = false;
    
    /**
     * Safe element getter with retry mechanism
     */
    function safeGetElement(id, maxRetries = 20, delay = 250) {
        return new Promise((resolve) => {
            let attempts = 0;
            
            function tryGetElement() {
                const element = document.getElementById(id);
                if (element) {
                    console.log(`✅ Element found: ${id}`);
                    resolve(element);
                    return;
                }
                
                attempts++;
                if (attempts >= maxRetries) {
                    console.warn(`⚠️ Element not found after ${maxRetries} attempts: ${id}`);
                    resolve(null);
                    return;
                }
                
                console.log(`🔍 Attempt ${attempts}/${maxRetries} to find element: ${id}`);
                setTimeout(tryGetElement, delay);
            }
            
            tryGetElement();
        });
    }
    
    /**
     * Initialize master barang data if not exists
     */
    function initializeMasterBarangData() {
        const existingData = localStorage.getItem('masterBarang');
        if (existingData) {
            try {
                const parsed = JSON.parse(existingData);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    console.log(`📦 Master barang data already exists: ${parsed.length} items`);
                    return;
                }
            } catch (e) {
                console.warn('⚠️ Invalid master barang data, reinitializing...');
            }
        }
        
        console.log('🔄 Initializing master barang data...');
        
        const sampleData = [
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
            },
            {
                kode: 'BRG004-KG',
                nama: 'Gula Pasir (Kilogram)',
                satuan: 'kg',
                stok: 75,
                baseProduct: 'BRG004',
                hargaBeli: 14000,
                hargaJual: 17000,
                kategori: 'Sembako'
            },
            {
                kode: 'BRG004-GR',
                nama: 'Gula Pasir (Gram)',
                satuan: 'gram',
                stok: 25000,
                baseProduct: 'BRG004',
                hargaBeli: 14,
                hargaJual: 17,
                kategori: 'Sembako'
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
            },
            {
                baseProduct: 'BRG004',
                conversions: [
                    { from: 'kg', to: 'gram', ratio: 1000 },
                    { from: 'gram', to: 'kg', ratio: 0.001 }
                ]
            }
        ];
        
        // Save to localStorage
        localStorage.setItem('masterBarang', JSON.stringify(sampleData));
        localStorage.setItem('barang', JSON.stringify(sampleData));
        localStorage.setItem('conversionRatios', JSON.stringify(conversionRatios));
        
        console.log(`✅ Master barang data initialized: ${sampleData.length} items, ${conversionRatios.length} conversion groups`);
    }
    
    /**
     * Populate dropdowns with data
     */
    async function populateDropdowns() {
        console.log('🔄 Starting dropdown population...');
        
        // Get elements safely
        const sourceSelect = await safeGetElement('sourceItem');
        const targetSelect = await safeGetElement('targetItem');
        
        if (!sourceSelect || !targetSelect) {
            console.error('❌ Required dropdown elements not found');
            return false;
        }
        
        try {
            // Get master barang data
            const masterBarang = JSON.parse(localStorage.getItem('masterBarang') || '[]');
            
            if (masterBarang.length === 0) {
                console.warn('⚠️ No master barang data found');
                return false;
            }
            
            console.log(`📦 Loading ${masterBarang.length} items into dropdowns...`);
            
            // Clear existing options
            sourceSelect.innerHTML = '<option value="">Pilih barang asal...</option>';
            targetSelect.innerHTML = '<option value="">Pilih barang tujuan...</option>';
            
            // Group items by base product
            const baseProducts = {};
            masterBarang.forEach(item => {
                const baseProduct = item.baseProduct || item.kode.split('-')[0];
                if (!baseProducts[baseProduct]) {
                    baseProducts[baseProduct] = [];
                }
                baseProducts[baseProduct].push(item);
            });
            
            let sourceCount = 0;
            let targetCount = 0;
            
            // Add items to dropdowns
            Object.entries(baseProducts).forEach(([baseProduct, items]) => {
                if (items.length > 1) { // Only transformable products
                    // Create optgroups for better organization
                    const sourceOptgroup = document.createElement('optgroup');
                    sourceOptgroup.label = baseProduct;
                    
                    const targetOptgroup = document.createElement('optgroup');
                    targetOptgroup.label = baseProduct;
                    
                    items.forEach(item => {
                        // Source dropdown - only items with stock > 0
                        if (item.stok > 0) {
                            const sourceOption = document.createElement('option');
                            sourceOption.value = item.kode;
                            sourceOption.textContent = `${item.nama} (Stok: ${item.stok} ${item.satuan})`;
                            sourceOption.dataset.baseProduct = item.baseProduct;
                            sourceOption.dataset.unit = item.satuan;
                            sourceOption.dataset.stock = item.stok;
                            sourceOptgroup.appendChild(sourceOption);
                            sourceCount++;
                        }
                        
                        // Target dropdown - all items
                        const targetOption = document.createElement('option');
                        targetOption.value = item.kode;
                        targetOption.textContent = `${item.nama} (Stok: ${item.stok} ${item.satuan})`;
                        targetOption.dataset.baseProduct = item.baseProduct;
                        targetOption.dataset.unit = item.satuan;
                        targetOption.dataset.stock = item.stok;
                        targetOptgroup.appendChild(targetOption);
                        targetCount++;
                    });
                    
                    if (sourceOptgroup.children.length > 0) {
                        sourceSelect.appendChild(sourceOptgroup);
                    }
                    if (targetOptgroup.children.length > 0) {
                        targetSelect.appendChild(targetOptgroup);
                    }
                }
            });
            
            // Enable target dropdown
            targetSelect.disabled = false;
            
            console.log(`✅ Dropdowns populated: ${sourceCount} source options, ${targetCount} target options`);
            
            // Update statistics if elements exist
            updateStatistics();
            
            return true;
            
        } catch (error) {
            console.error('❌ Error populating dropdowns:', error);
            return false;
        }
    }
    
    /**
     * Setup event listeners
     */
    async function setupEventListeners() {
        console.log('🔄 Setting up event listeners...');
        
        const sourceSelect = await safeGetElement('sourceItem');
        const targetSelect = await safeGetElement('targetItem');
        const quantityInput = await safeGetElement('quantity');
        const submitButton = await safeGetElement('submit-transformation');
        const resetButton = await safeGetElement('reset-form');
        
        if (sourceSelect) {
            sourceSelect.addEventListener('change', function() {
                console.log('🔄 Source item changed:', this.value);
                updateConversionInfo();
            });
        }
        
        if (targetSelect) {
            targetSelect.addEventListener('change', function() {
                console.log('🔄 Target item changed:', this.value);
                updateConversionInfo();
            });
        }
        
        if (quantityInput) {
            quantityInput.addEventListener('input', function() {
                console.log('🔄 Quantity changed:', this.value);
                updateConversionInfo();
            });
        }
        
        if (resetButton) {
            resetButton.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('🔄 Reset form clicked');
                resetForm();
            });
        }
        
        console.log('✅ Event listeners setup completed');
    }
    
    /**
     * Update conversion info
     */
    function updateConversionInfo() {
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
        
        try {
            // Get item details
            const masterBarang = JSON.parse(localStorage.getItem('masterBarang') || '[]');
            const sourceItem = masterBarang.find(item => item.kode === sourceValue);
            const targetItem = masterBarang.find(item => item.kode === targetValue);
            
            if (!sourceItem || !targetItem) {
                conversionInfo.innerHTML = '<span class="text-danger">Item tidak ditemukan</span>';
                if (submitButton) submitButton.disabled = true;
                return;
            }
            
            // Check if same base product
            const sourceBaseProduct = sourceItem.baseProduct || sourceItem.kode.split('-')[0];
            const targetBaseProduct = targetItem.baseProduct || targetItem.kode.split('-')[0];
            
            if (sourceBaseProduct !== targetBaseProduct) {
                conversionInfo.innerHTML = '<span class="text-warning">Item harus dari produk yang sama untuk transformasi</span>';
                if (submitButton) submitButton.disabled = true;
                return;
            }
            
            // Find conversion ratio
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
            console.error('❌ Error updating conversion info:', error);
            conversionInfo.innerHTML = '<span class="text-danger">Error memuat info konversi</span>';
        }
    }
    
    /**
     * Reset form
     */
    function resetForm() {
        const sourceSelect = document.getElementById('sourceItem');
        const targetSelect = document.getElementById('targetItem');
        const quantityInput = document.getElementById('quantity');
        const conversionInfo = document.getElementById('conversion-info');
        const submitButton = document.getElementById('submit-transformation');
        
        if (sourceSelect) sourceSelect.value = '';
        if (targetSelect) targetSelect.value = '';
        if (quantityInput) quantityInput.value = '';
        if (conversionInfo) conversionInfo.innerHTML = '<span class="text-muted">Pilih item untuk melihat rasio konversi</span>';
        if (submitButton) submitButton.disabled = true;
        
        console.log('✅ Form reset completed');
    }
    
    /**
     * Update statistics
     */
    function updateStatistics() {
        try {
            const masterBarang = JSON.parse(localStorage.getItem('masterBarang') || '[]');
            
            // Update available items count
            const availableItemsElement = document.getElementById('available-items');
            if (availableItemsElement) {
                availableItemsElement.textContent = masterBarang.length;
            }
            
            // Update today's transformations count
            const todayElement = document.getElementById('today-transformations');
            if (todayElement) {
                const history = JSON.parse(localStorage.getItem('transformationHistory') || '[]');
                const today = new Date().toDateString();
                const todayCount = history.filter(t => 
                    new Date(t.timestamp).toDateString() === today
                ).length;
                todayElement.textContent = todayCount;
            }
            
        } catch (error) {
            console.error('❌ Error updating statistics:', error);
        }
    }
    
    /**
     * Show success message
     */
    function showSuccessMessage() {
        // Try to show success message using existing alert system
        if (typeof showAlert === 'function') {
            showAlert('Sistem transformasi barang berhasil dimuat!', 'success');
        } else if (typeof showTransformationAlert === 'function') {
            showTransformationAlert('Sistem transformasi barang berhasil dimuat!', 'success');
        } else {
            // Create a simple alert
            const alertContainer = document.getElementById('alert-container') || document.getElementById('success-container');
            if (alertContainer) {
                const alertHtml = `
                    <div class="alert alert-success alert-dismissible fade show" role="alert">
                        <i class="bi bi-check-circle me-2"></i>
                        Sistem transformasi barang berhasil dimuat!
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
    }
    
    /**
     * Main fix function
     */
    async function applyTransformasiBarangFix() {
        if (fixApplied) {
            console.log('🔄 Fix already applied, skipping...');
            return;
        }
        
        console.log('🚀 Starting Transformasi Barang Element Fix...');
        
        try {
            // Step 1: Initialize data
            initializeMasterBarangData();
            
            // Step 2: Wait for DOM to be fully ready
            if (document.readyState !== 'complete') {
                await new Promise(resolve => {
                    if (document.readyState === 'complete') {
                        resolve();
                    } else {
                        window.addEventListener('load', resolve);
                    }
                });
            }
            
            // Step 3: Populate dropdowns
            const populateSuccess = await populateDropdowns();
            
            if (!populateSuccess) {
                console.warn('⚠️ Failed to populate dropdowns, will retry...');
                // Retry after a delay
                setTimeout(() => {
                    populateDropdowns();
                }, 2000);
            }
            
            // Step 4: Setup event listeners
            await setupEventListeners();
            
            // Step 5: Show success message
            showSuccessMessage();
            
            fixApplied = true;
            console.log('✅ Transformasi Barang Element Fix completed successfully!');
            
        } catch (error) {
            console.error('❌ Error applying transformasi barang fix:', error);
        }
    }
    
    // Apply fix when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyTransformasiBarangFix);
    } else {
        applyTransformasiBarangFix();
    }
    
    // Also try after a delay to ensure all elements are loaded
    setTimeout(applyTransformasiBarangFix, 1000);
    setTimeout(applyTransformasiBarangFix, 3000); // Final retry
    
    // Export functions for global access
    window.applyTransformasiBarangFix = applyTransformasiBarangFix;
    window.updateConversionInfo = updateConversionInfo;
    
    console.log('🔧 Transformasi Barang Element Fix loaded and ready!');
    
})();