// Enhanced Cash Calculation Module - Task 4
// Perbaiki perhitungan kas dan selisih

/**
 * Enhanced Cash Calculation Engine
 * Features:
 * - Validated and improved kas seharusnya formula
 * - Real-time calculation for selisih kas
 * - Validation for input kas aktual (no negative values)
 * - Improved handling for large numbers and edge cases
 * - Precision handling for floating point calculations
 * - Comprehensive error handling and validation
 */

/**
 * Enhanced calculation of kas seharusnya with validation
 * Formula: Modal Awal + Total Penjualan Cash
 * @param {number} modalAwal - Initial cash amount for the shift
 * @param {number} totalCash - Total cash sales during the shift
 * @returns {Object} Calculation result with validation
 */
function calculateKasSeharusnyaEnhanced(modalAwal, totalCash) {
    try {
        // Input validation
        if (typeof modalAwal !== 'number' || typeof totalCash !== 'number') {
            throw new Error('Modal awal dan total cash harus berupa angka');
        }
        
        if (modalAwal < 0) {
            throw new Error('Modal awal tidak boleh negatif');
        }
        
        if (totalCash < 0) {
            throw new Error('Total cash tidak boleh negatif');
        }
        
        // Handle large numbers - check for overflow
        if (modalAwal > Number.MAX_SAFE_INTEGER || totalCash > Number.MAX_SAFE_INTEGER) {
            throw new Error('Nilai terlalu besar untuk dihitung dengan akurat');
        }
        
        // Calculate kas seharusnya with precision handling
        const kasSeharusnya = precisionAdd(modalAwal, totalCash);
        
        // Validate result
        if (!isFinite(kasSeharusnya) || kasSeharusnya < 0) {
            throw new Error('Hasil perhitungan kas seharusnya tidak valid');
        }
        
        return {
            success: true,
            kasSeharusnya: kasSeharusnya,
            modalAwal: modalAwal,
            totalCash: totalCash,
            formula: `${formatRupiah(modalAwal)} + ${formatRupiah(totalCash)} = ${formatRupiah(kasSeharusnya)}`,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message,
            kasSeharusnya: 0,
            modalAwal: modalAwal || 0,
            totalCash: totalCash || 0
        };
    }
}

/**
 * Enhanced real-time selisih calculation with validation
 * @param {number} kasAktual - Actual cash counted
 * @param {number} kasSeharusnya - Expected cash amount
 * @returns {Object} Selisih calculation result with detailed analysis
 */
function calculateSelisihEnhanced(kasAktual, kasSeharusnya) {
    try {
        // Input validation
        if (typeof kasAktual !== 'number' || typeof kasSeharusnya !== 'number') {
            throw new Error('Kas aktual dan kas seharusnya harus berupa angka');
        }
        
        if (kasAktual < 0) {
            throw new Error('Kas aktual tidak boleh negatif');
        }
        
        if (kasSeharusnya < 0) {
            throw new Error('Kas seharusnya tidak boleh negatif');
        }
        
        // Handle large numbers
        if (kasAktual > Number.MAX_SAFE_INTEGER || kasSeharusnya > Number.MAX_SAFE_INTEGER) {
            throw new Error('Nilai terlalu besar untuk dihitung dengan akurat');
        }
        
        // Calculate selisih with precision handling
        const selisih = precisionSubtract(kasAktual, kasSeharusnya);
        
        // Determine status and category
        let status, category, severity, alertType, icon, message;
        
        if (Math.abs(selisih) < 0.01) { // Consider floating point precision
            status = 'sesuai';
            category = 'exact_match';
            severity = 'none';
            alertType = 'success';
            icon = 'bi-check-circle-fill';
            message = 'Kas sesuai! Tidak ada selisih.';
        } else if (selisih > 0) {
            status = 'lebih';
            category = 'excess';
            severity = categorizeSelisihSeverity(selisih, kasSeharusnya);
            alertType = 'warning';
            icon = 'bi-exclamation-triangle-fill';
            message = `Kas lebih ${formatRupiah(selisih)} dari yang seharusnya.`;
        } else {
            status = 'kurang';
            category = 'shortage';
            severity = categorizeSelisihSeverity(Math.abs(selisih), kasSeharusnya);
            alertType = 'danger';
            icon = 'bi-exclamation-triangle-fill';
            message = `Kas kurang ${formatRupiah(Math.abs(selisih))} dari yang seharusnya.`;
        }
        
        // Calculate percentage difference
        const percentageDiff = kasSeharusnya > 0 ? (Math.abs(selisih) / kasSeharusnya) * 100 : 0;
        
        return {
            success: true,
            selisih: selisih,
            selisihAbs: Math.abs(selisih),
            kasAktual: kasAktual,
            kasSeharusnya: kasSeharusnya,
            status: status,
            category: category,
            severity: severity,
            alertType: alertType,
            icon: icon,
            message: message,
            percentageDiff: percentageDiff,
            isKeteranganRequired: Math.abs(selisih) >= 0.01,
            formula: `${formatRupiah(kasAktual)} - ${formatRupiah(kasSeharusnya)} = ${formatRupiah(selisih)}`,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message,
            selisih: 0,
            kasAktual: kasAktual || 0,
            kasSeharusnya: kasSeharusnya || 0,
            status: 'error',
            isKeteranganRequired: false
        };
    }
}

/**
 * Categorize selisih severity based on amount and percentage
 * @param {number} selisihAbs - Absolute selisih amount
 * @param {number} kasSeharusnya - Expected cash amount
 * @returns {string} Severity level
 */
function categorizeSelisihSeverity(selisihAbs, kasSeharusnya) {
    const percentage = kasSeharusnya > 0 ? (selisihAbs / kasSeharusnya) * 100 : 0;
    
    // Define thresholds
    const MINOR_AMOUNT = 10000; // Rp 10,000
    const MODERATE_AMOUNT = 50000; // Rp 50,000
    const MAJOR_AMOUNT = 200000; // Rp 200,000
    
    const MINOR_PERCENTAGE = 1; // 1%
    const MODERATE_PERCENTAGE = 5; // 5%
    const MAJOR_PERCENTAGE = 10; // 10%
    
    if (selisihAbs <= MINOR_AMOUNT && percentage <= MINOR_PERCENTAGE) {
        return 'minor'; // Small difference, likely counting error
    } else if (selisihAbs <= MODERATE_AMOUNT && percentage <= MODERATE_PERCENTAGE) {
        return 'moderate'; // Moderate difference, needs attention
    } else if (selisihAbs <= MAJOR_AMOUNT && percentage <= MAJOR_PERCENTAGE) {
        return 'major'; // Large difference, requires investigation
    } else {
        return 'critical'; // Very large difference, potential fraud or major error
    }
}

/**
 * Enhanced kas aktual input validation
 * @param {any} input - Input value to validate
 * @returns {Object} Validation result
 */
function validateKasAktualEnhanced(input) {
    try {
        // Check if input exists
        if (input === null || input === undefined || input === '') {
            return {
                valid: false,
                error: 'Kas aktual harus diisi',
                code: 'REQUIRED',
                value: 0
            };
        }
        
        // Convert to number
        const value = parseFloat(input);
        
        // Check if conversion was successful
        if (isNaN(value)) {
            return {
                valid: false,
                error: 'Kas aktual harus berupa angka yang valid',
                code: 'INVALID_NUMBER',
                value: 0
            };
        }
        
        // Check for negative values
        if (value < 0) {
            return {
                valid: false,
                error: 'Kas aktual tidak boleh negatif',
                code: 'NEGATIVE_VALUE',
                value: 0
            };
        }
        
        // Check for unreasonably large values
        if (value > Number.MAX_SAFE_INTEGER) {
            return {
                valid: false,
                error: 'Nilai kas aktual terlalu besar',
                code: 'VALUE_TOO_LARGE',
                value: 0
            };
        }
        
        // Check for unreasonably large values in context (more than 1 billion)
        if (value > 1000000000) {
            return {
                valid: false,
                error: 'Nilai kas aktual tidak realistis (lebih dari 1 miliar)',
                code: 'UNREALISTIC_VALUE',
                value: 0
            };
        }
        
        // Check for precision issues (more than 2 decimal places for currency)
        const rounded = Math.round(value);
        if (Math.abs(value - rounded) > 0.01) {
            return {
                valid: true,
                warning: 'Nilai kas aktual akan dibulatkan ke rupiah terdekat',
                code: 'PRECISION_WARNING',
                value: rounded,
                originalValue: value
            };
        }
        
        return {
            valid: true,
            value: value,
            code: 'VALID'
        };
        
    } catch (error) {
        return {
            valid: false,
            error: 'Terjadi kesalahan saat validasi kas aktual',
            code: 'VALIDATION_ERROR',
            value: 0
        };
    }
}

/**
 * Precision arithmetic functions to handle floating point issues
 */

/**
 * Precise addition to avoid floating point errors
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} Precise sum
 */
function precisionAdd(a, b) {
    const factor = Math.pow(10, 2); // 2 decimal places for currency
    return Math.round((a * factor) + (b * factor)) / factor;
}

/**
 * Precise subtraction to avoid floating point errors
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} Precise difference
 */
function precisionSubtract(a, b) {
    const factor = Math.pow(10, 2); // 2 decimal places for currency
    return Math.round((a * factor) - (b * factor)) / factor;
}

/**
 * Precise multiplication to avoid floating point errors
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} Precise product
 */
function precisionMultiply(a, b) {
    const factor = Math.pow(10, 2); // 2 decimal places for currency
    return Math.round((a * factor) * (b * factor)) / (factor * factor);
}

/**
 * Enhanced sales data calculation with improved validation
 * @param {Object} shiftData - Shift information
 * @returns {Object} Enhanced sales calculation result
 */
function calculateSalesDataEnhancedV2(shiftData) {
    try {
        // Validate shift data
        if (!shiftData || typeof shiftData !== 'object') {
            throw new Error('Data shift tidak valid');
        }
        
        if (!shiftData.waktuBuka || !shiftData.modalAwal) {
            throw new Error('Data shift tidak lengkap (waktu buka atau modal awal hilang)');
        }
        
        // Get sales data with validation
        const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
        
        if (!Array.isArray(penjualan)) {
            throw new Error('Data penjualan tidak valid');
        }
        
        // Filter and validate sales for this shift
        const waktuBuka = new Date(shiftData.waktuBuka);
        const sekarang = new Date();
        
        if (isNaN(waktuBuka.getTime())) {
            throw new Error('Waktu buka shift tidak valid');
        }
        
        const penjualanShift = penjualan.filter(p => {
            try {
                // Validate each sales record
                if (!p || typeof p !== 'object') return false;
                if (!p.tanggal || !p.total) return false;
                if (typeof p.total !== 'number' || p.total <= 0) return false;
                
                const tanggalPenjualan = new Date(p.tanggal);
                if (isNaN(tanggalPenjualan.getTime())) return false;
                
                return tanggalPenjualan >= waktuBuka && 
                       tanggalPenjualan <= sekarang;
            } catch (e) {
                console.warn('Invalid penjualan record:', p, e);
                return false;
            }
        });
        
        // Calculate totals with precision handling
        let totalPenjualan = 0;
        let totalCash = 0;
        let totalKredit = 0;
        let jumlahTransaksi = 0;
        
        for (const p of penjualanShift) {
            const amount = p.total || 0;
            totalPenjualan = precisionAdd(totalPenjualan, amount);
            
            if (p.status === 'cash') {
                totalCash = precisionAdd(totalCash, amount);
            } else if (p.status === 'kredit') {
                totalKredit = precisionAdd(totalKredit, amount);
            }
            
            jumlahTransaksi++;
        }
        
        // Validate totals consistency
        const calculatedTotal = precisionAdd(totalCash, totalKredit);
        if (Math.abs(totalPenjualan - calculatedTotal) > 0.01) {
            console.warn('Sales total inconsistency detected, correcting...');
            totalPenjualan = calculatedTotal;
        }
        
        // Calculate kas seharusnya
        const kasCalculation = calculateKasSeharusnyaEnhanced(shiftData.modalAwal, totalCash);
        
        if (!kasCalculation.success) {
            throw new Error('Gagal menghitung kas seharusnya: ' + kasCalculation.error);
        }
        
        return {
            success: true,
            penjualanShift: penjualanShift,
            totalPenjualan: totalPenjualan,
            totalCash: totalCash,
            totalKredit: totalKredit,
            kasSeharusnya: kasCalculation.kasSeharusnya,
            jumlahTransaksi: jumlahTransaksi,
            calculation: kasCalculation,
            validation: {
                shiftDuration: sekarang - waktuBuka,
                recordsProcessed: penjualan.length,
                recordsValid: penjualanShift.length,
                recordsFiltered: penjualan.length - penjualanShift.length
            },
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('Error in enhanced sales calculation:', error);
        return {
            success: false,
            error: error.message,
            penjualanShift: [],
            totalPenjualan: 0,
            totalCash: 0,
            totalKredit: 0,
            kasSeharusnya: 0,
            jumlahTransaksi: 0
        };
    }
}

/**
 * Real-time calculation update for the modal
 * @param {Object} shiftData - Shift information
 * @param {Object} salesData - Sales data
 * @param {number} kasAktual - Current kas aktual input
 * @returns {Object} Real-time calculation result
 */
function updateRealTimeCalculation(shiftData, salesData, kasAktual) {
    try {
        // Validate kas aktual input
        const kasValidation = validateKasAktualEnhanced(kasAktual);
        
        if (!kasValidation.valid) {
            return {
                success: false,
                error: kasValidation.error,
                validation: kasValidation
            };
        }
        
        // Calculate selisih
        const selisihCalculation = calculateSelisihEnhanced(kasValidation.value, salesData.kasSeharusnya);
        
        if (!selisihCalculation.success) {
            return {
                success: false,
                error: selisihCalculation.error,
                validation: kasValidation
            };
        }
        
        return {
            success: true,
            kasAktual: kasValidation.value,
            selisih: selisihCalculation,
            validation: kasValidation,
            recommendations: generateRecommendations(selisihCalculation),
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message,
            kasAktual: 0
        };
    }
}

/**
 * Generate recommendations based on selisih calculation
 * @param {Object} selisihCalculation - Selisih calculation result
 * @returns {Array} Array of recommendations
 */
function generateRecommendations(selisihCalculation) {
    const recommendations = [];
    
    if (selisihCalculation.status === 'sesuai') {
        recommendations.push({
            type: 'success',
            message: 'Kas sudah sesuai, Anda dapat melanjutkan proses tutup kasir.',
            action: 'proceed'
        });
    } else {
        // Add severity-based recommendations
        switch (selisihCalculation.severity) {
            case 'minor':
                recommendations.push({
                    type: 'info',
                    message: 'Selisih kecil, mungkin kesalahan hitung. Periksa kembali uang receh.',
                    action: 'recount_small'
                });
                break;
                
            case 'moderate':
                recommendations.push({
                    type: 'warning',
                    message: 'Selisih cukup besar, periksa kembali perhitungan dan transaksi terakhir.',
                    action: 'recount_moderate'
                });
                break;
                
            case 'major':
                recommendations.push({
                    type: 'danger',
                    message: 'Selisih besar, lakukan perhitungan ulang menyeluruh dan hubungi supervisor.',
                    action: 'supervisor_review'
                });
                break;
                
            case 'critical':
                recommendations.push({
                    type: 'danger',
                    message: 'Selisih sangat besar, WAJIB hubungi supervisor sebelum melanjutkan.',
                    action: 'mandatory_supervisor'
                });
                break;
        }
        
        // Add specific recommendations based on type
        if (selisihCalculation.status === 'lebih') {
            recommendations.push({
                type: 'info',
                message: 'Periksa apakah ada uang kembalian yang belum dikembalikan atau uang dari customer yang tertinggal.',
                action: 'check_change'
            });
        } else if (selisihCalculation.status === 'kurang') {
            recommendations.push({
                type: 'warning',
                message: 'Periksa apakah ada transaksi yang belum tercatat atau uang yang tercecer.',
                action: 'check_missing'
            });
        }
    }
    
    return recommendations;
}

/**
 * Export functions for use in other modules
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateKasSeharusnyaEnhanced,
        calculateSelisihEnhanced,
        validateKasAktualEnhanced,
        calculateSalesDataEnhancedV2,
        updateRealTimeCalculation,
        precisionAdd,
        precisionSubtract,
        precisionMultiply
    };
}