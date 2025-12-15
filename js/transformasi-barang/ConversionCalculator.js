/**
 * ConversionCalculator - Kalkulator untuk konversi antar unit
 * 
 * Kelas ini bertanggung jawab untuk menghitung konversi quantity
 * antar unit berdasarkan rasio yang telah ditentukan.
 */

class ConversionCalculator {
    constructor() {
        this.initialized = false;
        this.conversionRatios = new Map(); // Cache untuk rasio konversi
    }

    /**
     * Initialize ConversionCalculator
     */
    initialize() {
        this.initialized = true;
        this._loadConversionRatios();
    }

    /**
     * Menghitung target quantity berdasarkan source quantity dan rasio
     * @param {number} sourceQty - Quantity sumber
     * @param {number} conversionRatio - Rasio konversi
     * @returns {number} Target quantity hasil kalkulasi
     */
    calculateTargetQuantity(sourceQty, conversionRatio) {
        this._ensureInitialized();
        
        // Validasi input
        if (typeof sourceQty !== 'number' || sourceQty < 0 || isNaN(sourceQty)) {
            throw new Error('Source quantity harus berupa angka non-negatif');
        }
        
        if (typeof conversionRatio !== 'number' || conversionRatio <= 0 || isNaN(conversionRatio)) {
            throw new Error('Conversion ratio harus berupa angka positif');
        }
        
        try {
            const targetQty = sourceQty * conversionRatio;
            
            if (isNaN(targetQty) || !isFinite(targetQty)) {
                throw new Error('Hasil perhitungan tidak valid');
            }
            
            // Round to avoid floating point precision issues
            const roundedQty = Math.round(targetQty * 1000000) / 1000000;
            
            return roundedQty;
        } catch (error) {
            console.error('Error calculating target quantity:', error);
            throw error;
        }
    }

    /**
     * Mendapatkan rasio konversi antara dua unit
     * @param {string} sourceUnit - Unit sumber
     * @param {string} targetUnit - Unit target
     * @param {string} baseProduct - Base product identifier
     * @returns {number} Rasio konversi
     */
    getConversionRatio(sourceUnit, targetUnit, baseProduct) {
        this._ensureInitialized();
        
        // Validasi input
        if (!sourceUnit || typeof sourceUnit !== 'string') {
            throw new Error('Source unit harus berupa string yang valid');
        }
        
        if (!targetUnit || typeof targetUnit !== 'string') {
            throw new Error('Target unit harus berupa string yang valid');
        }
        
        if (!baseProduct || typeof baseProduct !== 'string') {
            throw new Error('Base product harus berupa string yang valid');
        }
        
        try {
            // Cari rasio konversi untuk base product
            const ratioConfig = this.conversionRatios.get(baseProduct);
            
            if (!ratioConfig) {
                throw new Error(`Rasio konversi tidak ditemukan untuk produk: ${baseProduct}`);
            }
            
            // Cari konversi dari sourceUnit ke targetUnit
            const conversion = ratioConfig.conversions.find(conv => 
                conv.from === sourceUnit && conv.to === targetUnit
            );
            
            if (!conversion) {
                throw new Error(`Rasio konversi tidak ditemukan dari ${sourceUnit} ke ${targetUnit} untuk produk ${baseProduct}`);
            }
            
            return conversion.ratio;
        } catch (error) {
            console.error('Error getting conversion ratio:', error);
            throw error;
        }
    }

    /**
     * Validasi bahwa hasil kalkulasi menghasilkan bilangan bulat
     * @param {number} calculatedQty - Quantity hasil kalkulasi
     * @returns {boolean} True jika bilangan bulat
     */
    validateWholeNumberResult(calculatedQty) {
        this._ensureInitialized();
        
        if (typeof calculatedQty !== 'number') {
            throw new Error('Calculated quantity harus berupa angka');
        }
        
        try {
            // Toleransi untuk floating point precision issues
            const tolerance = 0.000001;
            const rounded = Math.round(calculatedQty);
            const difference = Math.abs(calculatedQty - rounded);
            
            return difference < tolerance;
        } catch (error) {
            console.error('Error validating whole number result:', error);
            throw error;
        }
    }

    /**
     * Menghitung reverse conversion (dari target ke source)
     * @param {number} targetQty - Target quantity
     * @param {number} conversionRatio - Rasio konversi original
     * @returns {number} Source quantity yang dibutuhkan
     */
    calculateSourceQuantity(targetQty, conversionRatio) {
        this._ensureInitialized();
        
        if (!conversionRatio || conversionRatio <= 0 || isNaN(conversionRatio)) {
            throw new Error('Rasio konversi harus berupa angka positif');
        }

        if (!targetQty || targetQty <= 0 || isNaN(targetQty)) {
            throw new Error('Target quantity harus berupa angka positif');
        }

        try {
            const sourceQty = targetQty / conversionRatio;
            
            if (isNaN(sourceQty) || !isFinite(sourceQty)) {
                throw new Error('Hasil perhitungan tidak valid');
            }
            
            // Round to avoid floating point precision issues
            return Math.round(sourceQty * 1000000) / 1000000;
        } catch (error) {
            console.error('Error calculating source quantity:', error);
            throw error;
        }
    }

    /**
     * Memuat rasio konversi dari localStorage
     * @private
     */
    _loadConversionRatios() {
        try {
            const ratiosData = localStorage.getItem('conversionRatios');
            if (ratiosData) {
                const ratios = JSON.parse(ratiosData);
                this.conversionRatios.clear();
                
                // Convert array to Map for faster lookup
                ratios.forEach(ratio => {
                    const key = `${ratio.baseProduct}`;
                    this.conversionRatios.set(key, ratio);
                });
            }
        } catch (error) {
            console.error('Error loading conversion ratios:', error);
            // Initialize with empty Map if loading fails
            this.conversionRatios.clear();
        }
    }

    /**
     * Menyimpan rasio konversi ke localStorage
     * @param {ConversionRatio[]} ratios - Array rasio konversi
     */
    saveConversionRatios(ratios) {
        this._ensureInitialized();
        
        try {
            localStorage.setItem('conversionRatios', JSON.stringify(ratios));
            this._loadConversionRatios(); // Reload cache
        } catch (error) {
            console.error('Error saving conversion ratios:', error);
            throw error;
        }
    }

    /**
     * Mendapatkan semua rasio konversi yang tersimpan
     * @returns {ConversionRatio[]} Array semua rasio konversi
     */
    getAllConversionRatios() {
        this._ensureInitialized();
        
        return Array.from(this.conversionRatios.values());
    }

    /**
     * Memastikan ConversionCalculator sudah diinisialisasi
     * @private
     */
    _ensureInitialized() {
        if (!this.initialized) {
            throw new Error('ConversionCalculator belum diinisialisasi. Panggil initialize() terlebih dahulu.');
        }
    }
}

// Export untuk browser dan Node.js
if (typeof window !== 'undefined') {
    window.ConversionCalculator = ConversionCalculator;
}

// ES6 module export
export default ConversionCalculator;