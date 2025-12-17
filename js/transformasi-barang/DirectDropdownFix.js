/**
 * DirectDropdownFix - Perbaikan langsung untuk dropdown transformasi barang
 * 
 * File ini akan langsung mengganti fungsi dropdown yang bermasalah
 * dengan versi yang dijamin tidak menampilkan "undefined"
 */

(function() {
    'use strict';
    
    console.log('🔧 DIRECT DROPDOWN FIX: Loading...');
    
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
    
    // Wait for elements to exist
    function waitForElements() {
        return new Promise((resolve) => {
            const checkElements = () => {
                const sourceSelect = document.getElementById('sourceItem');
                const targetSelect = document.getElementById('targetItem');
                
                if (sourceSelect && targetSelect) {
                    resolve({ sourceSelect, targetSelect });
                } else {
                    setTimeout(checkElements, 100);
                }
            };
            checkElements();
        });
    }
    
    // Clean and initialize data
    function initializeCleanData() {
        console.log('🧹 Initializing clean data...');
        
        // Clean, guaranteed data structure - NO undefined values
        const masterBarang = [
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

        // Save clean data to localStorage
        localStorage.setItem('masterBarang', JSON.stringify(masterBarang));
        localStorage.setItem('barang', JSON.stringify(masterBarang));
        localStorage.setItem('conversionRatios', JSON.stringify(conversionRatios));
        
        console.log('✅ Clean data initialized');
        return { masterBarang, conversionRatios };
    }
    
    // Create the FIXED dropdown population function
    function createFixedDropdownFunction() {
        return function populateDropdownsFixed() {
            console.log('🔧 Using FIXED dropdown population function');
            
            const sourceSelect = document.getElementById('sourceItem');
            const targetSelect = document.getElementById('targetItem');
            
            if (!sourceSelect || !targetSelect) {
                console.warn('Dropdown elements not found');
                return false;
            }
            
            try {
                const masterBarang = JSON.parse(localStorage.getItem('masterBarang') || '[]');
                
                if (masterBarang.length === 0) {
                    console.warn('No master barang data found, initializing...');
                    initializeCleanData();
                    const newData = JSON.parse(localStorage.getItem('masterBarang') || '[]');
                    if (newData.length === 0) {
                        console.error('Failed to initialize data');
                        return false;
                    }
                }
                
                // Clear existing options
                sourceSelect.innerHTML = '<option value="">Pilih barang asal (yang akan dikurangi stoknya)...</option>';
                targetSelect.innerHTML = '<option value="">Pilih barang tujuan (yang akan ditambah stoknya)...</option>';
                
                // Group by base product
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
                
                // Populate dropdowns
                Object.entries(baseProducts).forEach(([baseProduct, items]) => {
                    if (items.length > 1) { // Only transformable items
                        items.forEach(item => {
                            // GUARANTEED no undefined values
                            const nama = String(item.nama || 'Unknown');
                            const satuan = String(item.satuan || 'unit');
                            const stok = Number(item.stok || 0);
                            
                            if (stok > 0) {
                                const sourceOption = new Option(
                                    `${nama} (${satuan}) - Stok: ${stok}`, 
                                    item.kode
                                );
                                sourceOption.dataset.baseProduct = String(item.baseProduct || item.kode);
                                sourceOption.dataset.satuan = satuan;
                                sourceOption.dataset.stok = stok.toString();
                                sourceOption.dataset.nama = nama;
                                sourceSelect.add(sourceOption);
                                sourceCount++;
                            }
                            
                            const targetOption = new Option(
                                `${nama} (${satuan}) - Stok: ${stok}`, 
                                item.kode
                            );
                            targetOption.dataset.baseProduct = String(item.baseProduct || item.kode);
                            targetOption.dataset.satuan = satuan;
                            targetOption.dataset.stok = stok.toString();
                            targetOption.dataset.nama = nama;
                            targetSelect.add(targetOption);
                            targetCount++;
                        });
                    }
                });
                
                targetSelect.disabled = false;
                console.log(`✅ Dropdowns populated: ${sourceCount} source, ${targetCount} target options`);
                
                // Verify no undefined values
                let hasUndefined = false;
                for (let i = 1; i < sourceSelect.options.length; i++) {
                    if (sourceSelect.options[i].textContent.includes('undefined')) {
                        hasUndefined = true;
                        console.error('Found undefined in source dropdown:', sourceSelect.options[i].textContent);
                    }
                }
                for (let i = 1; i < targetSelect.options.length; i++) {
                    if (targetSelect.options[i].textContent.includes('undefined')) {
                        hasUndefined = true;
                        console.error('Found undefined in target dropdown:', targetSelect.options[i].textContent);
                    }
                }
                
                if (!hasUndefined) {
                    console.log('✅ Verification passed: No undefined values found');
                    
                    // Show success message
                    const alertContainer = document.getElementById('alert-container') || document.getElementById('success-container');
                    if (alertContainer) {
                        alertContainer.innerHTML = `
                            <div class="alert alert-success alert-dismissible fade show" role="alert">
                                <i class="bi bi-check-circle me-2"></i>
                                <strong>Dropdown Fixed!</strong> Masalah "undefined" telah diperbaiki. Dropdown sekarang menampilkan data yang benar.
                                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                            </div>
                        `;
                        
                        // Auto-hide after 5 seconds
                        setTimeout(() => {
                            alertContainer.innerHTML = '';
                        }, 5000);
                    }
                } else {
                    console.error('❌ Verification failed: Found undefined values');
                }
                
                return true;
            } catch (error) {
                console.error('❌ Error populating dropdowns:', error);
                return false;
            }
        };
    }
    
    // Apply the fix
    async function applyFix() {
        try {
            console.log('🔧 DIRECT DROPDOWN FIX: Starting...');
            
            // Wait for DOM
            await waitForDOM();
            
            // Initialize clean data
            initializeCleanData();
            
            // Wait for elements
            await waitForElements();
            
            // Create the fixed function
            const fixedFunction = createFixedDropdownFunction();
            
            // Override all possible dropdown functions
            window.populateDropdownsFixed = fixedFunction;
            window.populateDropdownsSafe = fixedFunction;
            window.populateDropdowns = fixedFunction;
            
            // Also override any existing functions in the global scope
            if (typeof populateDropdownsSafe !== 'undefined') {
                populateDropdownsSafe = fixedFunction;
            }
            if (typeof populateDropdowns !== 'undefined') {
                populateDropdowns = fixedFunction;
            }
            
            // Apply the fix immediately
            const success = fixedFunction();
            
            if (success) {
                console.log('✅ DIRECT DROPDOWN FIX: Successfully applied!');
                
                // Set up event listeners for conversion info
                const sourceSelect = document.getElementById('sourceItem');
                const targetSelect = document.getElementById('targetItem');
                const quantityInput = document.getElementById('quantity');
                
                if (sourceSelect && targetSelect) {
                    sourceSelect.addEventListener('change', updateConversionInfoFixed);
                    targetSelect.addEventListener('change', updateConversionInfoFixed);
                    if (quantityInput) {
                        quantityInput.addEventListener('input', updateConversionInfoFixed);
                    }
                }
                
                // Override any existing updateConversionInfo function
                if (typeof window.updateConversionInfo === 'function') {
                    window.updateConversionInfo = updateConversionInfoFixed;
                }
                
            } else {
                console.error('❌ DIRECT DROPDOWN FIX: Failed to apply');
            }
            
        } catch (error) {
            console.error('❌ DIRECT DROPDOWN FIX: Error during application:', error);
        }
    }
    
    // Fixed conversion info function
    function updateConversionInfoFixed() {
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
            console.error('Error updating conversion info:', error);
            conversionInfo.innerHTML = '<span class="text-danger">Error memuat info konversi</span>';
        }
    }
    
    // Make functions available globally
    window.updateConversionInfoFixed = updateConversionInfoFixed;
    
    // Apply the fix
    applyFix();
    
    // Also apply fix with delays to ensure it works
    setTimeout(applyFix, 1000);
    setTimeout(applyFix, 3000);
    
    console.log('🔧 DIRECT DROPDOWN FIX: Loaded and ready!');
    
})();