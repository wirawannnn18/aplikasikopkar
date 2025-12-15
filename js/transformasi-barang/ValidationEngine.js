/**
 * ValidationEngine - Mesin validasi untuk transformasi barang
 * 
 * Kelas ini bertanggung jawab untuk memvalidasi semua aspek transformasi
 * termasuk validasi produk, stok, dan aturan bisnis.
 */

class ValidationEngine {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize ValidationEngine
     */
    initialize() {
        this.initialized = true;
    }

    /**
     * Validasi bahwa source dan target item adalah produk yang sama
     * @param {Object} sourceItem - Item sumber
     * @param {Object} targetItem - Item target
     * @returns {ValidationResult} Hasil validasi
     */
    validateProductMatch(sourceItem, targetItem) {
        this._ensureInitialized();
        
        try {
            const errors = [];
            const warnings = [];

            // Validasi input parameters
            if (!sourceItem || !targetItem) {
                errors.push('Source item dan target item harus disediakan');
                return { isValid: false, errors, warnings };
            }

            // Cek apakah kedua item memiliki baseProduct
            if (!sourceItem.baseProduct || !targetItem.baseProduct) {
                errors.push('Kedua item harus memiliki base product untuk dapat ditransformasi');
                return { isValid: false, errors, warnings };
            }

            // Cek apakah baseProduct sama
            if (sourceItem.baseProduct !== targetItem.baseProduct) {
                errors.push(`Item tidak dapat ditransformasi: ${sourceItem.baseProduct} ≠ ${targetItem.baseProduct}`);
                return { isValid: false, errors, warnings };
            }

            // Cek apakah unit berbeda (tidak boleh transformasi ke unit yang sama)
            if (sourceItem.satuan === targetItem.satuan) {
                errors.push('Tidak dapat mentransformasi ke unit yang sama');
                return { isValid: false, errors, warnings };
            }

            // Warning jika nama produk sangat berbeda
            const sourceWords = sourceItem.nama.toLowerCase().split(' ');
            const targetWords = targetItem.nama.toLowerCase().split(' ');
            const commonWords = sourceWords.filter(word => targetWords.includes(word));
            
            if (commonWords.length === 0) {
                warnings.push('Nama produk sangat berbeda, pastikan ini adalah produk yang sama');
            }

            return {
                isValid: errors.length === 0,
                errors,
                warnings
            };
        } catch (error) {
            console.error('Error validating product match:', error);
            return {
                isValid: false,
                errors: ['Terjadi error saat validasi produk: ' + error.message],
                warnings: []
            };
        }
    }

    /**
     * Validasi ketersediaan stok untuk transformasi
     * @param {Object} sourceItem - Item sumber
     * @param {number} quantity - Jumlah yang akan ditransformasi
     * @returns {ValidationResult} Hasil validasi
     */
    validateStockAvailability(sourceItem, quantity) {
        this._ensureInitialized();
        
        try {
            const errors = [];
            const warnings = [];

            // Validasi input parameters
            if (!sourceItem) {
                errors.push('Source item harus disediakan');
                return { isValid: false, errors, warnings };
            }

            if (typeof quantity !== 'number' || quantity <= 0) {
                errors.push('Quantity harus berupa angka positif');
                return { isValid: false, errors, warnings };
            }

            // Validasi stok tersedia
            const currentStock = sourceItem.stok || 0;
            
            if (currentStock <= 0) {
                errors.push(`Stok ${sourceItem.nama} (${sourceItem.satuan}) habis`);
                return { isValid: false, errors, warnings };
            }

            if (quantity > currentStock) {
                errors.push(`Stok tidak mencukupi. Tersedia: ${currentStock} ${sourceItem.satuan}, Dibutuhkan: ${quantity} ${sourceItem.satuan}`);
                return { isValid: false, errors, warnings };
            }

            // Warning jika stok akan habis setelah transformasi
            const remainingStock = currentStock - quantity;
            if (remainingStock === 0) {
                warnings.push(`Stok ${sourceItem.nama} akan habis setelah transformasi`);
            } else if (remainingStock < 5) {
                warnings.push(`Stok ${sourceItem.nama} akan tersisa sedikit (${remainingStock} ${sourceItem.satuan})`);
            }

            // Warning jika quantity sangat besar (lebih dari 50% stok)
            if (quantity > currentStock * 0.5) {
                warnings.push('Transformasi jumlah besar, pastikan perhitungan sudah benar');
            }

            return {
                isValid: errors.length === 0,
                errors,
                warnings
            };
        } catch (error) {
            console.error('Error validating stock availability:', error);
            return {
                isValid: false,
                errors: ['Terjadi error saat validasi stok: ' + error.message],
                warnings: []
            };
        }
    }

    /**
     * Validasi rasio konversi antara dua unit
     * @param {string} sourceUnit - Unit sumber
     * @param {string} targetUnit - Unit target
     * @param {string} baseProduct - Base product identifier
     * @returns {ValidationResult} Hasil validasi
     */
    validateConversionRatio(sourceUnit, targetUnit, baseProduct) {
        this._ensureInitialized();
        
        try {
            const errors = [];
            const warnings = [];

            // Validasi input parameters
            if (!sourceUnit || typeof sourceUnit !== 'string') {
                errors.push('Source unit harus berupa string yang valid');
            }

            if (!targetUnit || typeof targetUnit !== 'string') {
                errors.push('Target unit harus berupa string yang valid');
            }

            if (!baseProduct || typeof baseProduct !== 'string') {
                errors.push('Base product harus berupa string yang valid');
            }

            if (errors.length > 0) {
                return { isValid: false, errors, warnings };
            }

            // Cek apakah unit sama
            if (sourceUnit === targetUnit) {
                errors.push('Source unit dan target unit tidak boleh sama');
                return { isValid: false, errors, warnings };
            }

            // Ambil conversion ratios dari localStorage
            const ratiosData = localStorage.getItem('conversionRatios');
            if (!ratiosData) {
                errors.push('Data rasio konversi tidak ditemukan. Silakan konfigurasi terlebih dahulu');
                return { isValid: false, errors, warnings };
            }

            let ratios;
            try {
                ratios = JSON.parse(ratiosData);
            } catch (parseError) {
                errors.push('Data rasio konversi rusak. Silakan konfigurasi ulang');
                return { isValid: false, errors, warnings };
            }

            // Cari rasio untuk base product
            const productRatio = ratios.find(r => r.baseProduct === baseProduct);
            if (!productRatio) {
                errors.push(`Rasio konversi untuk produk ${baseProduct} tidak ditemukan`);
                return { isValid: false, errors, warnings };
            }

            // Cari conversion rule yang sesuai
            const conversionRule = productRatio.conversions.find(c => 
                c.from === sourceUnit && c.to === targetUnit
            );

            if (!conversionRule) {
                errors.push(`Rasio konversi dari ${sourceUnit} ke ${targetUnit} tidak ditemukan untuk produk ${baseProduct}`);
                return { isValid: false, errors, warnings };
            }

            // Validasi rasio value
            if (!conversionRule.ratio || typeof conversionRule.ratio !== 'number' || conversionRule.ratio <= 0) {
                errors.push('Rasio konversi harus berupa angka positif');
                return { isValid: false, errors, warnings };
            }

            // Warning untuk rasio yang tidak umum
            if (conversionRule.ratio > 1000) {
                warnings.push('Rasio konversi sangat besar, pastikan konfigurasi sudah benar');
            } else if (conversionRule.ratio < 0.001) {
                warnings.push('Rasio konversi sangat kecil, pastikan konfigurasi sudah benar');
            }

            return {
                isValid: errors.length === 0,
                errors,
                warnings
            };
        } catch (error) {
            console.error('Error validating conversion ratio:', error);
            return {
                isValid: false,
                errors: ['Terjadi error saat validasi rasio konversi: ' + error.message],
                warnings: []
            };
        }
    }

    /**
     * Validasi hasil kalkulasi quantity
     * @param {number} sourceQty - Quantity sumber
     * @param {number} targetQty - Quantity target hasil kalkulasi
     * @param {number} ratio - Rasio konversi
     * @returns {ValidationResult} Hasil validasi
     */
    validateQuantityCalculation(sourceQty, targetQty, ratio) {
        this._ensureInitialized();
        
        try {
            const errors = [];
            const warnings = [];

            // Validasi input parameters
            if (typeof sourceQty !== 'number' || sourceQty <= 0) {
                errors.push('Source quantity harus berupa angka positif');
            }

            if (typeof targetQty !== 'number' || targetQty <= 0) {
                errors.push('Target quantity harus berupa angka positif');
            }

            if (typeof ratio !== 'number' || ratio <= 0) {
                errors.push('Ratio harus berupa angka positif');
            }

            if (errors.length > 0) {
                return { isValid: false, errors, warnings };
            }

            // Validasi kalkulasi matematika
            const expectedTargetQty = sourceQty * ratio;
            const tolerance = 0.0001; // Toleransi untuk floating point precision

            if (Math.abs(targetQty - expectedTargetQty) > tolerance) {
                errors.push(`Kalkulasi tidak akurat. Expected: ${expectedTargetQty}, Got: ${targetQty}`);
                return { isValid: false, errors, warnings };
            }

            // Validasi bahwa hasil adalah bilangan bulat
            if (!Number.isInteger(targetQty)) {
                errors.push('Hasil transformasi harus berupa bilangan bulat');
                return { isValid: false, errors, warnings };
            }

            // Warning untuk quantity yang sangat besar
            if (targetQty > 10000) {
                warnings.push('Hasil transformasi sangat besar, pastikan perhitungan sudah benar');
            }

            // Warning jika source quantity tidak menghasilkan bilangan bulat yang optimal
            if (sourceQty * ratio !== Math.floor(sourceQty * ratio)) {
                const optimalSourceQty = Math.floor(targetQty / ratio);
                if (optimalSourceQty !== sourceQty) {
                    warnings.push(`Untuk hasil yang optimal, gunakan ${optimalSourceQty} unit sumber`);
                }
            }

            return {
                isValid: errors.length === 0,
                errors,
                warnings
            };
        } catch (error) {
            console.error('Error validating quantity calculation:', error);
            return {
                isValid: false,
                errors: ['Terjadi error saat validasi kalkulasi: ' + error.message],
                warnings: []
            };
        }
    }

    /**
     * Validasi komprehensif untuk transformasi
     * @param {TransformationRequest} request - Request transformasi
     * @returns {Promise<ValidationResult>} Hasil validasi lengkap
     */
    async validateTransformationRequest(request) {
        this._ensureInitialized();
        
        try {
            const allErrors = [];
            const allWarnings = [];

            // 1. Validasi input data dasar
            const inputValidation = this.validateInputData(request);
            allErrors.push(...inputValidation.errors);
            allWarnings.push(...inputValidation.warnings);

            if (!inputValidation.isValid) {
                return {
                    isValid: false,
                    errors: allErrors,
                    warnings: allWarnings
                };
            }

            // 2. Ambil data master barang
            const masterBarangData = this._getMasterBarangData();
            const sourceItem = masterBarangData.find(item => item.kode === request.sourceItemId);
            const targetItem = masterBarangData.find(item => item.kode === request.targetItemId);

            if (!sourceItem) {
                allErrors.push(`Source item dengan ID ${request.sourceItemId} tidak ditemukan`);
            }

            if (!targetItem) {
                allErrors.push(`Target item dengan ID ${request.targetItemId} tidak ditemukan`);
            }

            if (allErrors.length > 0) {
                return {
                    isValid: false,
                    errors: allErrors,
                    warnings: allWarnings
                };
            }

            // 3. Validasi product match
            const productMatchValidation = this.validateProductMatch(sourceItem, targetItem);
            allErrors.push(...productMatchValidation.errors);
            allWarnings.push(...productMatchValidation.warnings);

            if (!productMatchValidation.isValid) {
                return {
                    isValid: false,
                    errors: allErrors,
                    warnings: allWarnings
                };
            }

            // 4. Validasi stock availability
            const stockValidation = this.validateStockAvailability(sourceItem, request.sourceQuantity);
            allErrors.push(...stockValidation.errors);
            allWarnings.push(...stockValidation.warnings);

            if (!stockValidation.isValid) {
                return {
                    isValid: false,
                    errors: allErrors,
                    warnings: allWarnings
                };
            }

            // 5. Validasi conversion ratio
            const ratioValidation = this.validateConversionRatio(
                sourceItem.satuan, 
                targetItem.satuan, 
                sourceItem.baseProduct
            );
            allErrors.push(...ratioValidation.errors);
            allWarnings.push(...ratioValidation.warnings);

            if (!ratioValidation.isValid) {
                return {
                    isValid: false,
                    errors: allErrors,
                    warnings: allWarnings
                };
            }

            // 6. Ambil rasio dan hitung target quantity
            const ratio = this._getConversionRatio(sourceItem.satuan, targetItem.satuan, sourceItem.baseProduct);
            const targetQuantity = request.sourceQuantity * ratio;

            // 7. Validasi quantity calculation
            const calculationValidation = this.validateQuantityCalculation(
                request.sourceQuantity,
                targetQuantity,
                ratio
            );
            allErrors.push(...calculationValidation.errors);
            allWarnings.push(...calculationValidation.warnings);

            // 8. Validasi business rules tambahan
            const businessRulesValidation = this._validateBusinessRules(request, sourceItem, targetItem, ratio);
            allErrors.push(...businessRulesValidation.errors);
            allWarnings.push(...businessRulesValidation.warnings);

            return {
                isValid: allErrors.length === 0,
                errors: allErrors,
                warnings: allWarnings
            };
        } catch (error) {
            console.error('Error validating transformation request:', error);
            return {
                isValid: false,
                errors: ['Terjadi error saat validasi request: ' + error.message],
                warnings: []
            };
        }
    }

    /**
     * Validasi input data transformasi
     * @param {Object} data - Data yang akan divalidasi
     * @returns {ValidationResult} Hasil validasi
     */
    validateInputData(data) {
        this._ensureInitialized();
        
        const errors = [];
        const warnings = [];

        // Basic input validation
        if (!data) {
            errors.push('Data transformasi tidak boleh kosong');
            return { isValid: false, errors, warnings };
        }

        if (!data.sourceItemId || typeof data.sourceItemId !== 'string') {
            errors.push('Source Item ID harus berupa string yang valid');
        }

        if (!data.targetItemId || typeof data.targetItemId !== 'string') {
            errors.push('Target Item ID harus berupa string yang valid');
        }

        if (!data.sourceQuantity || typeof data.sourceQuantity !== 'number' || data.sourceQuantity <= 0) {
            errors.push('Source Quantity harus berupa angka positif');
        }

        if (!data.user || typeof data.user !== 'string') {
            errors.push('User harus berupa string yang valid');
        }

        // Check for decimal quantities (should be whole numbers)
        if (data.sourceQuantity && !Number.isInteger(data.sourceQuantity)) {
            warnings.push('Quantity sebaiknya berupa bilangan bulat');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validasi business rules tambahan
     * @param {Object} request - Request transformasi
     * @param {Object} sourceItem - Source item
     * @param {Object} targetItem - Target item
     * @param {number} ratio - Conversion ratio
     * @returns {ValidationResult} Hasil validasi
     * @private
     */
    _validateBusinessRules(request, sourceItem, targetItem, ratio) {
        const errors = [];
        const warnings = [];

        try {
            // Rule 1: Cek apakah transformasi akan menghasilkan stok negatif
            const newSourceStock = sourceItem.stok - request.sourceQuantity;
            if (newSourceStock < 0) {
                errors.push('Transformasi akan menghasilkan stok negatif');
            }

            // Rule 2: Cek apakah target quantity terlalu besar untuk disimpan
            const targetQuantity = request.sourceQuantity * ratio;
            const newTargetStock = (targetItem.stok || 0) + targetQuantity;
            if (newTargetStock > 999999) {
                warnings.push('Stok target akan menjadi sangat besar setelah transformasi');
            }

            // Rule 3: Validasi waktu operasional (contoh: tidak boleh transformasi di luar jam kerja)
            const currentHour = new Date().getHours();
            if (currentHour < 6 || currentHour > 22) {
                warnings.push('Transformasi dilakukan di luar jam operasional normal (06:00-22:00)');
            }

            // Rule 4: Cek apakah user memiliki permission (basic check)
            if (!request.user || request.user.length < 3) {
                errors.push('User ID tidak valid untuk melakukan transformasi');
            }

            // Rule 5: Validasi kategori produk (harus sama)
            if (sourceItem.kategori !== targetItem.kategori) {
                warnings.push('Kategori produk berbeda antara source dan target');
            }

            return {
                isValid: errors.length === 0,
                errors,
                warnings
            };
        } catch (error) {
            return {
                isValid: false,
                errors: ['Error dalam validasi business rules: ' + error.message],
                warnings: []
            };
        }
    }

    /**
     * Mendapatkan data master barang dari localStorage
     * @returns {Object[]} Array master barang
     * @private
     */
    _getMasterBarangData() {
        try {
            const data = localStorage.getItem('masterBarang');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting master barang data:', error);
            return [];
        }
    }

    /**
     * Mendapatkan rasio konversi dari localStorage
     * @param {string} fromUnit - Unit sumber
     * @param {string} toUnit - Unit target
     * @param {string} baseProduct - Base product
     * @returns {number} Rasio konversi
     * @private
     */
    _getConversionRatio(fromUnit, toUnit, baseProduct) {
        try {
            const ratiosData = localStorage.getItem('conversionRatios');
            if (!ratiosData) return null;

            const ratios = JSON.parse(ratiosData);
            const productRatio = ratios.find(r => r.baseProduct === baseProduct);
            if (!productRatio) return null;

            const conversionRule = productRatio.conversions.find(c => 
                c.from === fromUnit && c.to === toUnit
            );

            return conversionRule ? conversionRule.ratio : null;
        } catch (error) {
            console.error('Error getting conversion ratio:', error);
            return null;
        }
    }

    /**
     * Validasi konfigurasi sistem
     * @returns {ValidationResult} Hasil validasi konfigurasi
     */
    validateSystemConfiguration() {
        this._ensureInitialized();
        
        const errors = [];
        const warnings = [];

        try {
            // Cek ketersediaan master barang
            const masterBarang = this._getMasterBarangData();
            if (masterBarang.length === 0) {
                errors.push('Data master barang kosong');
            }

            // Cek ketersediaan conversion ratios
            const ratiosData = localStorage.getItem('conversionRatios');
            if (!ratiosData) {
                errors.push('Data rasio konversi tidak ditemukan');
            } else {
                try {
                    const ratios = JSON.parse(ratiosData);
                    if (ratios.length === 0) {
                        warnings.push('Belum ada rasio konversi yang dikonfigurasi');
                    }
                } catch (parseError) {
                    errors.push('Data rasio konversi rusak');
                }
            }

            // Cek localStorage availability
            try {
                localStorage.setItem('test', 'test');
                localStorage.removeItem('test');
            } catch (storageError) {
                errors.push('LocalStorage tidak tersedia');
            }

            return {
                isValid: errors.length === 0,
                errors,
                warnings
            };
        } catch (error) {
            return {
                isValid: false,
                errors: ['Error validating system configuration: ' + error.message],
                warnings: []
            };
        }
    }

    /**
     * Memastikan ValidationEngine sudah diinisialisasi
     * @private
     */
    _ensureInitialized() {
        if (!this.initialized) {
            throw new Error('ValidationEngine belum diinisialisasi. Panggil initialize() terlebih dahulu.');
        }
    }
}

// Export untuk browser dan Node.js
if (typeof window !== 'undefined') {
    window.ValidationEngine = ValidationEngine;
}

// ES6 module export (commented out for browser compatibility)
// export { ValidationEngine };
// export default ValidationEngine;