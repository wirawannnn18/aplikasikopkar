/**
 * Fix Transformasi Barang Master Connection
 * Script untuk memperbaiki koneksi antara menu transformasi barang dengan master barang
 */

class TransformasiBarangConnectionFixer {
    constructor() {
        this.initialized = false;
        this.debugMode = true;
    }

    /**
     * Initialize the connection fixer
     */
    initialize() {
        this.log('Initializing Transformasi Barang Connection Fixer...');
        this.initialized = true;
        return this;
    }

    /**
     * Log messages with timestamp
     */
    log(message, type = 'info') {
        if (this.debugMode) {
            const timestamp = new Date().toLocaleTimeString();
            console.log(`[${timestamp}] [TransformasiBarangFixer] ${message}`);
        }
    }

    /**
     * Comprehensive diagnostic of the transformation system
     */
    async runDiagnostic() {
        this.log('Running comprehensive diagnostic...');
        
        const results = {
            localStorage: this.checkLocalStorage(),
            masterBarangData: this.checkMasterBarangData(),
            conversionRatios: this.checkConversionRatios(),
            transformationScripts: this.checkTransformationScripts(),
            dataIntegrity: this.checkDataIntegrity(),
            dropdownElements: this.checkDropdownElements()
        };

        this.log('Diagnostic completed', 'success');
        return results;
    }

    /**
     * Check localStorage availability
     */
    checkLocalStorage() {
        try {
            const testKey = 'test-' + Date.now();
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            this.log('LocalStorage: Available');
            return { available: true, error: null };
        } catch (error) {
            this.log('LocalStorage: Not available - ' + error.message, 'error');
            return { available: false, error: error.message };
        }
    }

    /**
     * Check master barang data in localStorage
     */
    checkMasterBarangData() {
        const dataSources = ['masterBarang', 'barang', 'stokBarang', 'produk'];
        const results = {
            found: false,
            source: null,
            count: 0,
            data: null,
            sources: {}
        };

        for (const source of dataSources) {
            try {
                const data = localStorage.getItem(source);
                if (data) {
                    const parsedData = JSON.parse(data);
                    results.sources[source] = {
                        exists: true,
                        count: Array.isArray(parsedData) ? parsedData.length : 0,
                        isArray: Array.isArray(parsedData)
                    };

                    if (Array.isArray(parsedData) && parsedData.length > 0 && !results.found) {
                        results.found = true;
                        results.source = source;
                        results.count = parsedData.length;
                        results.data = parsedData;
                    }
                } else {
                    results.sources[source] = { exists: false, count: 0, isArray: false };
                }
            } catch (error) {
                results.sources[source] = { exists: false, count: 0, error: error.message };
                this.log(`Error parsing ${source}: ${error.message}`, 'error');
            }
        }

        this.log(`Master Barang Data: ${results.found ? 'Found' : 'Not found'} - ${results.count} items from ${results.source}`);
        return results;
    }

    /**
     * Check conversion ratios data
     */
    checkConversionRatios() {
        try {
            const ratiosData = localStorage.getItem('conversionRatios');
            if (ratiosData) {
                const ratios = JSON.parse(ratiosData);
                const isValid = Array.isArray(ratios) && ratios.length > 0;
                this.log(`Conversion Ratios: ${isValid ? 'Found' : 'Invalid'} - ${Array.isArray(ratios) ? ratios.length : 0} ratios`);
                return {
                    exists: true,
                    valid: isValid,
                    count: Array.isArray(ratios) ? ratios.length : 0,
                    data: ratios
                };
            } else {
                this.log('Conversion Ratios: Not found');
                return { exists: false, valid: false, count: 0, data: null };
            }
        } catch (error) {
            this.log(`Conversion Ratios: Error - ${error.message}`, 'error');
            return { exists: false, valid: false, count: 0, error: error.message };
        }
    }

    /**
     * Check transformation scripts availability
     */
    checkTransformationScripts() {
        const requiredClasses = [
            'TransformationManager',
            'UIController',
            'ValidationEngine',
            'StockManager',
            'TransformasiBarangAuditLogger',
            'ErrorHandler',
            'ConversionCalculator'
        ];

        const results = {
            loaded: [],
            missing: [],
            allLoaded: false
        };

        requiredClasses.forEach(className => {
            if (typeof window[className] === 'function') {
                results.loaded.push(className);
            } else {
                results.missing.push(className);
            }
        });

        results.allLoaded = results.missing.length === 0;
        this.log(`Transformation Scripts: ${results.loaded.length}/${requiredClasses.length} loaded`);
        
        if (results.missing.length > 0) {
            this.log(`Missing scripts: ${results.missing.join(', ')}`, 'warning');
        }

        return results;
    }

    /**
     * Check data integrity
     */
    checkDataIntegrity() {
        const masterBarangCheck = this.checkMasterBarangData();
        const conversionCheck = this.checkConversionRatios();

        const results = {
            valid: false,
            issues: [],
            warnings: []
        };

        if (!masterBarangCheck.found) {
            results.issues.push('Master barang data not found');
        } else {
            // Check data structure
            const requiredFields = ['kode', 'nama', 'satuan', 'stok'];
            const validItems = masterBarangCheck.data.filter(item => 
                requiredFields.every(field => item.hasOwnProperty(field))
            );

            if (validItems.length === 0) {
                results.issues.push('No items with required fields found');
            } else if (validItems.length < masterBarangCheck.count) {
                results.warnings.push(`${masterBarangCheck.count - validItems.length} items missing required fields`);
            }

            // Check for transformable items
            const baseProducts = this.groupItemsByBaseProduct(masterBarangCheck.data);
            const transformableProducts = Object.values(baseProducts).filter(items => items.length > 1);
            
            if (transformableProducts.length === 0) {
                results.warnings.push('No transformable products found (products with multiple units)');
            }
        }

        if (!conversionCheck.exists) {
            results.issues.push('Conversion ratios not found');
        } else if (!conversionCheck.valid) {
            results.issues.push('Conversion ratios data is invalid');
        }

        results.valid = results.issues.length === 0;
        this.log(`Data Integrity: ${results.valid ? 'Valid' : 'Invalid'} - ${results.issues.length} issues, ${results.warnings.length} warnings`);

        return results;
    }

    /**
     * Check dropdown elements in DOM
     */
    checkDropdownElements() {
        const elements = {
            sourceItem: document.getElementById('sourceItem'),
            targetItem: document.getElementById('targetItem'),
            quantity: document.getElementById('quantity'),
            conversionInfo: document.getElementById('conversion-info'),
            submitButton: document.getElementById('submit-transformation')
        };

        const results = {
            found: {},
            missing: [],
            allFound: true
        };

        Object.entries(elements).forEach(([key, element]) => {
            results.found[key] = !!element;
            if (!element) {
                results.missing.push(key);
                results.allFound = false;
            }
        });

        this.log(`Dropdown Elements: ${Object.keys(results.found).length - results.missing.length}/${Object.keys(results.found).length} found`);
        
        if (results.missing.length > 0) {
            this.log(`Missing elements: ${results.missing.join(', ')}`, 'warning');
        }

        return results;
    }

    /**
     * Group items by base product
     */
    groupItemsByBaseProduct(items) {
        return items.reduce((groups, item) => {
            const baseProduct = item.baseProduct || (item.kode ? item.kode.split('-')[0] : 'UNKNOWN');
            if (!groups[baseProduct]) {
                groups[baseProduct] = [];
            }
            groups[baseProduct].push(item);
            return groups;
        }, {});
    }

    /**
     * Fix master barang connection
     */
    async fixMasterBarangConnection() {
        this.log('Starting master barang connection fix...');

        try {
            // Step 1: Check existing data
            const masterBarangCheck = this.checkMasterBarangData();
            let sourceData = null;

            if (masterBarangCheck.found) {
                sourceData = masterBarangCheck.data;
                this.log(`Using existing data from ${masterBarangCheck.source}`);
            } else {
                // Create sample data
                sourceData = this.createSampleMasterBarangData();
                this.log('Created sample data');
            }

            // Step 2: Normalize data structure
            const normalizedData = this.normalizeBarangData(sourceData);
            this.log(`Normalized ${normalizedData.length} items`);

            // Step 3: Save to required localStorage keys
            localStorage.setItem('masterBarang', JSON.stringify(normalizedData));
            localStorage.setItem('barang', JSON.stringify(normalizedData));

            // Step 4: Create conversion ratios
            const conversionRatios = this.createConversionRatios(normalizedData);
            localStorage.setItem('conversionRatios', JSON.stringify(conversionRatios));
            this.log(`Created ${conversionRatios.length} conversion ratio groups`);

            // Step 5: Populate dropdowns if elements exist
            this.populateDropdowns(normalizedData);

            this.log('Master barang connection fix completed successfully', 'success');
            return {
                success: true,
                itemCount: normalizedData.length,
                ratioCount: conversionRatios.length
            };

        } catch (error) {
            this.log(`Error fixing master barang connection: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Create sample master barang data
     */
    createSampleMasterBarangData() {
        return [
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
    }

    /**
     * Normalize barang data structure
     */
    normalizeBarangData(data) {
        return data.map(item => {
            const normalized = {
                kode: item.kode || item.id || item.barcode || `BRG${Date.now()}`,
                nama: item.nama || item.name || item.namaBarang || 'Unnamed Item',
                satuan: item.satuan || item.unit || 'pcs',
                stok: parseInt(item.stok || item.stock || item.qty || 0),
                baseProduct: item.baseProduct || (item.kode ? item.kode.split('-')[0] : 'UNKNOWN'),
                hargaBeli: parseFloat(item.hargaBeli || item.harga_beli || item.buyPrice || 0),
                hargaJual: parseFloat(item.hargaJual || item.harga_jual || item.sellPrice || 0),
                kategori: item.kategori || item.category || 'Lainnya'
            };

            // Copy additional fields
            Object.keys(item).forEach(key => {
                if (!normalized.hasOwnProperty(key)) {
                    normalized[key] = item[key];
                }
            });

            return normalized;
        });
    }

    /**
     * Create conversion ratios from master barang data
     */
    createConversionRatios(masterBarang) {
        const baseProducts = this.groupItemsByBaseProduct(masterBarang);
        const conversionRatios = [];

        // Predefined unit conversions
        const unitConversions = {
            'kg': { 'gram': 1000, 'gr': 1000 },
            'gram': { 'kg': 0.001 },
            'gr': { 'kg': 0.001 },
            'liter': { 'ml': 1000, 'mililiter': 1000 },
            'ml': { 'liter': 0.001 },
            'mililiter': { 'liter': 0.001 },
            'dus': { 'botol': 24, 'pcs': 24, 'buah': 24 },
            'botol': { 'dus': 0.041667 },
            'pcs': { 'dus': 0.041667 },
            'buah': { 'dus': 0.041667 }
        };

        Object.entries(baseProducts).forEach(([baseProduct, items]) => {
            if (items.length > 1) {
                const conversions = [];

                items.forEach(fromItem => {
                    items.forEach(toItem => {
                        if (fromItem.satuan !== toItem.satuan) {
                            let ratio = 1;

                            if (unitConversions[fromItem.satuan] && 
                                unitConversions[fromItem.satuan][toItem.satuan]) {
                                ratio = unitConversions[fromItem.satuan][toItem.satuan];
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
                    conversionRatios.push({
                        baseProduct: baseProduct,
                        conversions: conversions
                    });
                }
            }
        });

        return conversionRatios;
    }

    /**
     * Populate dropdowns with data
     */
    populateDropdowns(masterBarang) {
        const sourceSelect = document.getElementById('sourceItem');
        const targetSelect = document.getElementById('targetItem');

        if (!sourceSelect || !targetSelect) {
            this.log('Dropdown elements not found, skipping population', 'warning');
            return;
        }

        try {
            // Clear existing options
            sourceSelect.innerHTML = '<option value="">Pilih barang asal...</option>';
            targetSelect.innerHTML = '<option value="">Pilih barang tujuan...</option>';

            // Group items by base product for better organization
            const baseProducts = this.groupItemsByBaseProduct(masterBarang);

            Object.entries(baseProducts).forEach(([baseProduct, items]) => {
                // Only show products that have multiple units (transformable)
                if (items.length > 1) {
                    // Create optgroup for source
                    const sourceOptgroup = document.createElement('optgroup');
                    sourceOptgroup.label = baseProduct;

                    // Create optgroup for target
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
                        }

                        // Target dropdown - all items
                        const targetOption = document.createElement('option');
                        targetOption.value = item.kode;
                        targetOption.textContent = `${item.nama} (Stok: ${item.stok} ${item.satuan})`;
                        targetOption.dataset.baseProduct = item.baseProduct;
                        targetOption.dataset.unit = item.satuan;
                        targetOption.dataset.stock = item.stok;
                        targetOptgroup.appendChild(targetOption);
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

            this.log(`Populated dropdowns with ${sourceSelect.options.length - 1} source items and ${targetSelect.options.length - 1} target items`);

        } catch (error) {
            this.log(`Error populating dropdowns: ${error.message}`, 'error');
        }
    }

    /**
     * Refresh transformation system
     */
    async refreshTransformationSystem() {
        this.log('Refreshing transformation system...');

        try {
            // Re-populate dropdowns
            const masterBarangCheck = this.checkMasterBarangData();
            if (masterBarangCheck.found) {
                this.populateDropdowns(masterBarangCheck.data);
            }

            // Trigger change events to update UI
            const sourceSelect = document.getElementById('sourceItem');
            const targetSelect = document.getElementById('targetItem');

            if (sourceSelect) {
                sourceSelect.dispatchEvent(new Event('change'));
            }
            if (targetSelect) {
                targetSelect.dispatchEvent(new Event('change'));
            }

            // Update statistics if elements exist
            this.updateStatistics();

            this.log('Transformation system refreshed successfully', 'success');

        } catch (error) {
            this.log(`Error refreshing transformation system: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Update statistics display
     */
    updateStatistics() {
        try {
            const masterBarangCheck = this.checkMasterBarangData();
            
            // Update available items count
            const availableItemsElement = document.getElementById('available-items');
            if (availableItemsElement && masterBarangCheck.found) {
                availableItemsElement.textContent = masterBarangCheck.count;
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
            this.log(`Error updating statistics: ${error.message}`, 'error');
        }
    }

    /**
     * Test transformation functionality
     */
    async testTransformation() {
        this.log('Testing transformation functionality...');

        try {
            const diagnostic = await this.runDiagnostic();
            const testResults = [];

            // Test 1: Data availability
            testResults.push({
                name: 'Data Availability',
                passed: diagnostic.masterBarangData.found && diagnostic.conversionRatios.exists,
                message: diagnostic.masterBarangData.found ? 
                    `${diagnostic.masterBarangData.count} items available` : 
                    'No master barang data found'
            });

            // Test 2: Dropdown population
            const sourceSelect = document.getElementById('sourceItem');
            const targetSelect = document.getElementById('targetItem');
            const dropdownsPopulated = sourceSelect && targetSelect && 
                sourceSelect.options.length > 1 && targetSelect.options.length > 1;

            testResults.push({
                name: 'Dropdown Population',
                passed: dropdownsPopulated,
                message: dropdownsPopulated ? 
                    `Source: ${sourceSelect.options.length - 1}, Target: ${targetSelect.options.length - 1} options` :
                    'Dropdowns not populated'
            });

            // Test 3: Transformable items
            if (diagnostic.masterBarangData.found) {
                const baseProducts = this.groupItemsByBaseProduct(diagnostic.masterBarangData.data);
                const transformableCount = Object.values(baseProducts).filter(items => items.length > 1).length;
                
                testResults.push({
                    name: 'Transformable Items',
                    passed: transformableCount > 0,
                    message: `${transformableCount} products can be transformed`
                });
            }

            // Test 4: Conversion ratios
            testResults.push({
                name: 'Conversion Ratios',
                passed: diagnostic.conversionRatios.valid,
                message: diagnostic.conversionRatios.valid ? 
                    `${diagnostic.conversionRatios.count} ratio groups available` :
                    'No valid conversion ratios found'
            });

            const allPassed = testResults.every(test => test.passed);
            this.log(`Transformation test completed: ${allPassed ? 'PASSED' : 'FAILED'}`, allPassed ? 'success' : 'error');

            return {
                success: allPassed,
                results: testResults
            };

        } catch (error) {
            this.log(`Error testing transformation: ${error.message}`, 'error');
            throw error;
        }
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.TransformasiBarangConnectionFixer = TransformasiBarangConnectionFixer;
}

// Auto-initialize if in browser
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        window.transformasiBarangFixer = new TransformasiBarangConnectionFixer().initialize();
    });
}