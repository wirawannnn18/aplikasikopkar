/**
 * DropdownUndefinedFix - Perbaikan khusus untuk masalah "undefined (undefined) - Stok: undefined"
 * 
 * File ini mengatasi masalah dropdown yang menampilkan nilai undefined
 * dengan membersihkan data dan memastikan semua nilai valid.
 */

class DropdownUndefinedFix {
    constructor() {
        this.initialized = false;
        this.fixApplied = false;
    }

    /**
     * Inisialisasi dan terapkan perbaikan
     */
    initialize() {
        if (this.initialized) return;
        
        console.log('🔧 Initializing DropdownUndefinedFix...');
        
        // Terapkan perbaikan segera
        this.applyFix();
        
        // Setup monitoring untuk mencegah masalah berulang
        this.setupMonitoring();
        
        this.initialized = true;
        console.log('✅ DropdownUndefinedFix initialized successfully');
    }

    /**
     * Terapkan perbaikan untuk masalah undefined
     */
    applyFix() {
        try {
            // 1. Bersihkan data localStorage yang rusak
            this.cleanCorruptedData();
            
            // 2. Inisialisasi data default jika diperlukan
            this.ensureValidData();
            
            // 3. Override fungsi dropdown yang bermasalah
            this.overrideDropdownFunctions();
            
            // 4. Perbaiki dropdown yang sudah ada
            this.fixExistingDropdowns();
            
            this.fixApplied = true;
            console.log('✅ Dropdown undefined fix applied successfully');
        } catch (error) {
            console.error('❌ Error applying dropdown fix:', error);
        }
    }

    /**
     * Bersihkan data localStorage yang rusak
     */
    cleanCorruptedData() {
        const keysToCheck = ['masterBarang', 'barang', 'stokBarang', 'produk', 'conversionRatios'];
        let cleanedCount = 0;
        
        keysToCheck.forEach(key => {
            try {
                const data = localStorage.getItem(key);
                if (data) {
                    const parsed = JSON.parse(data);
                    if (Array.isArray(parsed)) {
                        // Filter data yang rusak
                        const cleanData = parsed.filter(item => {
                            return item && 
                                   typeof item === 'object' &&
                                   item.nama !== undefined && 
                                   item.nama !== 'undefined' &&
                                   item.satuan !== undefined && 
                                   item.satuan !== 'undefined' &&
                                   typeof item.nama === 'string' &&
                                   typeof item.satuan === 'string' &&
                                   item.nama.trim() !== '' &&
                                   item.satuan.trim() !== '';
                        });
                        
                        if (cleanData.length !== parsed.length) {
                            localStorage.setItem(key, JSON.stringify(cleanData));
                            cleanedCount++;
                            console.log(`🧹 Cleaned ${parsed.length - cleanData.length} corrupted items from ${key}`);
                        }
                    }
                }
            } catch (e) {
                console.warn(`Error cleaning ${key}:`, e);
                localStorage.removeItem(key);
                cleanedCount++;
            }
        });
        
        if (cleanedCount > 0) {
            console.log(`🧹 Cleaned ${cleanedCount} corrupted data sources`);
        }
    }

    /**
     * Pastikan ada data valid di localStorage
     */
    ensureValidData() {
        const masterBarang = this.getValidMasterBarang();
        if (masterBarang.length === 0) {
            console.log('📦 Initializing default master barang data...');
            this.initializeDefaultData();
        }
    }

    /**
     * Dapatkan data master barang yang valid
     */
    getValidMasterBarang() {
        try {
            const data = localStorage.getItem('masterBarang');
            if (!data) return [];
            
            const parsed = JSON.parse(data);
            if (!Array.isArray(parsed)) return [];
            
            return parsed.filter(item => {
                return item && 
                       typeof item.kode === 'string' && item.kode.trim() !== '' &&
                       typeof item.nama === 'string' && item.nama.trim() !== '' && item.nama !== 'undefined' &&
                       typeof item.satuan === 'string' && item.satuan.trim() !== '' && item.satuan !== 'undefined' &&
                       typeof item.stok === 'number' && !isNaN(item.stok) && item.stok >= 0;
            });
        } catch (error) {
            console.error('Error getting valid master barang:', error);
            return [];
        }
    }

    /**
     * Inisialisasi data default
     */
    initializeDefaultData() {
        const defaultMasterBarang = [
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

        const defaultConversionRatios = [
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

        localStorage.setItem('masterBarang', JSON.stringify(defaultMasterBarang));
        localStorage.setItem('conversionRatios', JSON.stringify(defaultConversionRatios));
        
        console.log('✅ Default data initialized successfully');
    }

    /**
     * Override fungsi dropdown yang bermasalah
     */
    overrideDropdownFunctions() {
        // Override populateDropdowns function jika ada
        if (typeof window.populateDropdowns === 'function') {
            const originalFunction = window.populateDropdowns;
            window.populateDropdowns = (...args) => {
                try {
                    return this.safePopulateDropdowns(...args);
                } catch (error) {
                    console.warn('Error in overridden populateDropdowns, falling back to original:', error);
                    return originalFunction.apply(this, args);
                }
            };
        }

        // Override populateDropdownsSafe function jika ada
        if (typeof window.populateDropdownsSafe === 'function') {
            window.populateDropdownsSafe = () => this.safePopulateDropdowns();
        }

        // Buat fungsi global baru
        window.populateDropdownsFixed = () => this.safePopulateDropdowns();
    }

    /**
     * Fungsi populasi dropdown yang aman
     */
    safePopulateDropdowns() {
        console.log('🔧 Using safe dropdown population...');
        
        const sourceSelect = document.getElementById('sourceItem');
        const targetSelect = document.getElementById('targetItem');
        
        if (!sourceSelect || !targetSelect) {
            console.warn('Dropdown elements not found');
            return false;
        }
        
        try {
            const masterBarang = this.getValidMasterBarang();
            
            if (masterBarang.length === 0) {
                console.warn('No valid master barang data found');
                return false;
            }
            
            // Clear existing options
            sourceSelect.innerHTML = '<option value="">Pilih barang asal (yang akan dikurangi stoknya)...</option>';
            targetSelect.innerHTML = '<option value="">Pilih barang tujuan (yang akan ditambah stoknya)...</option>';
            
            // Group by base product
            const baseProducts = {};
            masterBarang.forEach(item => {
                const baseProduct = item.baseProduct || item.kode.split('-')[0] || 'UNKNOWN';
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
                        const nama = String(item.nama || 'Unknown').trim();
                        const satuan = String(item.satuan || 'unit').trim();
                        const stok = Number(item.stok) || 0;
                        
                        if (stok > 0) {
                            const sourceOption = new Option(
                                `${nama} (${satuan}) - Stok: ${stok}`, 
                                item.kode
                            );
                            sourceOption.dataset.baseProduct = String(item.baseProduct || baseProduct);
                            sourceOption.dataset.satuan = satuan;
                            sourceOption.dataset.unit = satuan;
                            sourceOption.dataset.stock = stok.toString();
                            sourceOption.dataset.nama = nama;
                            sourceSelect.add(sourceOption);
                            sourceCount++;
                        }
                        
                        const targetOption = new Option(
                            `${nama} (${satuan}) - Stok: ${stok}`, 
                            item.kode
                        );
                        targetOption.dataset.baseProduct = String(item.baseProduct || baseProduct);
                        targetOption.dataset.satuan = satuan;
                        targetOption.dataset.unit = satuan;
                        targetOption.dataset.stock = stok.toString();
                        targetOption.dataset.nama = nama;
                        targetSelect.add(targetOption);
                        targetCount++;
                    });
                }
            });
            
            targetSelect.disabled = false;
            console.log(`✅ Dropdowns populated safely: ${sourceCount} source, ${targetCount} target options`);
            
            return true;
        } catch (error) {
            console.error('❌ Error in safe dropdown population:', error);
            return false;
        }
    }

    /**
     * Perbaiki dropdown yang sudah ada di halaman
     */
    fixExistingDropdowns() {
        const sourceSelect = document.getElementById('sourceItem');
        const targetSelect = document.getElementById('targetItem');
        
        if (sourceSelect || targetSelect) {
            // Tunggu sebentar untuk memastikan DOM siap
            setTimeout(() => {
                this.safePopulateDropdowns();
            }, 100);
        }
    }

    /**
     * Setup monitoring untuk mencegah masalah berulang
     */
    setupMonitoring() {
        // Monitor perubahan pada dropdown
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    const target = mutation.target;
                    if (target.id === 'sourceItem' || target.id === 'targetItem') {
                        // Periksa apakah ada option dengan undefined
                        this.checkAndFixUndefinedOptions(target);
                    }
                }
            });
        });

        // Mulai monitoring
        const sourceSelect = document.getElementById('sourceItem');
        const targetSelect = document.getElementById('targetItem');
        
        if (sourceSelect) {
            observer.observe(sourceSelect, { childList: true, subtree: true });
        }
        if (targetSelect) {
            observer.observe(targetSelect, { childList: true, subtree: true });
        }
    }

    /**
     * Periksa dan perbaiki option yang mengandung undefined
     */
    checkAndFixUndefinedOptions(selectElement) {
        if (!selectElement) return;
        
        let hasUndefined = false;
        const options = Array.from(selectElement.options);
        
        options.forEach(option => {
            if (option.textContent.includes('undefined')) {
                hasUndefined = true;
            }
        });
        
        if (hasUndefined) {
            console.warn('Detected undefined in dropdown options, fixing...');
            setTimeout(() => {
                this.safePopulateDropdowns();
            }, 50);
        }
    }

    /**
     * Periksa apakah perbaikan sudah diterapkan
     */
    isFixApplied() {
        return this.fixApplied;
    }

    /**
     * Reset dan terapkan ulang perbaikan
     */
    reapplyFix() {
        this.fixApplied = false;
        this.applyFix();
    }
}

// Inisialisasi otomatis
const dropdownUndefinedFix = new DropdownUndefinedFix();

// Export untuk penggunaan global
window.DropdownUndefinedFix = DropdownUndefinedFix;
window.dropdownUndefinedFix = dropdownUndefinedFix;

// Auto-initialize ketika DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        dropdownUndefinedFix.initialize();
    });
} else {
    // DOM sudah ready
    dropdownUndefinedFix.initialize();
}

// Juga initialize dengan delay untuk memastikan
setTimeout(() => {
    if (!dropdownUndefinedFix.isFixApplied()) {
        dropdownUndefinedFix.initialize();
    }
}, 1000);

console.log('📦 DropdownUndefinedFix module loaded');