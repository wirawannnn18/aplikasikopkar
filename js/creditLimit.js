/**
 * CreditLimitValidator
 * Module untuk validasi dan perhitungan batas kredit anggota di sistem POS
 * 
 * Fitur:
 * - Menghitung saldo tagihan yang belum dibayar
 * - Validasi transaksi kredit terhadap batas maksimal
 * - Menampilkan informasi kredit anggota
 */

class CreditLimitValidator {
    constructor() {
        this.CREDIT_LIMIT = 2000000; // Rp 2.000.000
    }

    /**
     * Calculate total outstanding balance for a member
     * @param {string} anggotaId - Member ID
     * @returns {number} Total outstanding balance
     */
    calculateOutstandingBalance(anggotaId) {
        // Input validation
        if (!anggotaId || anggotaId === '') {
            return 0;
        }

        try {
            // Get all transactions from localStorage
            const penjualanData = localStorage.getItem('penjualan');
            if (!penjualanData) {
                return 0;
            }

            const penjualan = JSON.parse(penjualanData);
            if (!Array.isArray(penjualan)) {
                return 0;
            }

            // Sum all unpaid credit transactions for this member
            const outstandingBalance = penjualan
                .filter(transaksi => 
                    transaksi.anggotaId === anggotaId &&
                    transaksi.metode === 'bon' &&
                    transaksi.status === 'kredit'
                )
                .reduce((total, transaksi) => total + (transaksi.total || 0), 0);

            // Ensure non-negative result
            return Math.max(0, outstandingBalance);

        } catch (error) {
            console.error('Error calculating outstanding balance:', error);
            return 0;
        }
    }

    /**
     * Get available credit for a member
     * @param {string} anggotaId - Member ID
     * @returns {number} Available credit amount
     */
    getAvailableCredit(anggotaId) {
        const outstandingBalance = this.calculateOutstandingBalance(anggotaId);
        const availableCredit = this.CREDIT_LIMIT - outstandingBalance;
        
        // Ensure non-negative result
        return Math.max(0, availableCredit);
    }

    /**
     * Get list of unpaid credit transactions for a member
     * @param {string} anggotaId - Member ID
     * @returns {Array<Object>} Array of unpaid transactions
     */
    getUnpaidTransactions(anggotaId) {
        // Input validation
        if (!anggotaId || anggotaId === '') {
            return [];
        }

        try {
            // Get all transactions from localStorage
            const penjualanData = localStorage.getItem('penjualan');
            if (!penjualanData) {
                return [];
            }

            const penjualan = JSON.parse(penjualanData);
            if (!Array.isArray(penjualan)) {
                return [];
            }

            // Filter unpaid credit transactions for this member
            const unpaidTransactions = penjualan
                .filter(transaksi => 
                    transaksi.anggotaId === anggotaId &&
                    transaksi.metode === 'bon' &&
                    transaksi.status === 'kredit'
                )
                .map(transaksi => ({
                    id: transaksi.id,
                    noTransaksi: transaksi.noTransaksi,
                    tanggal: transaksi.tanggal,
                    total: transaksi.total,
                    kasir: transaksi.kasir
                }));

            return unpaidTransactions;

        } catch (error) {
            console.error('Error getting unpaid transactions:', error);
            return [];
        }
    }

    /**
     * Validate if a credit transaction can proceed
     * @param {string} anggotaId - Member ID
     * @param {number} transactionAmount - New transaction amount
     * @returns {Object} Validation result
     */
    validateCreditTransaction(anggotaId, transactionAmount) {
        // Input validation - member ID
        if (!anggotaId || anggotaId === '') {
            return {
                valid: false,
                message: 'Pilih anggota untuk transaksi kredit',
                details: {
                    outstandingBalance: 0,
                    transactionAmount: transactionAmount || 0,
                    totalExposure: 0,
                    creditLimit: this.CREDIT_LIMIT
                }
            };
        }

        // Input validation - transaction amount
        if (!transactionAmount || transactionAmount <= 0) {
            return {
                valid: false,
                message: 'Jumlah transaksi tidak valid',
                details: {
                    outstandingBalance: 0,
                    transactionAmount: transactionAmount || 0,
                    totalExposure: 0,
                    creditLimit: this.CREDIT_LIMIT
                }
            };
        }

        // Calculate outstanding balance
        const outstandingBalance = this.calculateOutstandingBalance(anggotaId);
        
        // Calculate total exposure
        const totalExposure = outstandingBalance + transactionAmount;

        // Check if exceeds limit
        if (totalExposure > this.CREDIT_LIMIT) {
            const exceededBy = totalExposure - this.CREDIT_LIMIT;
            return {
                valid: false,
                message: `Transaksi melebihi batas kredit. Tagihan saat ini: Rp ${outstandingBalance.toLocaleString('id-ID')}, Transaksi: Rp ${transactionAmount.toLocaleString('id-ID')}, Total: Rp ${totalExposure.toLocaleString('id-ID')}. Melebihi batas Rp ${exceededBy.toLocaleString('id-ID')}.`,
                details: {
                    outstandingBalance,
                    transactionAmount,
                    totalExposure,
                    creditLimit: this.CREDIT_LIMIT,
                    exceededBy
                }
            };
        }

        // Transaction is valid
        const remainingCredit = this.CREDIT_LIMIT - totalExposure;
        return {
            valid: true,
            message: 'Transaksi dapat diproses',
            details: {
                outstandingBalance,
                transactionAmount,
                totalExposure,
                creditLimit: this.CREDIT_LIMIT,
                remainingCredit
            }
        };
    }

    /**
     * Get credit status with visual indicator
     * @param {string} anggotaId - Member ID
     * @returns {Object} Credit status with color and icon
     */
    getCreditStatus(anggotaId) {
        const outstandingBalance = this.calculateOutstandingBalance(anggotaId);
        const percentage = (outstandingBalance / this.CREDIT_LIMIT) * 100;

        let status, color, bgColor, icon, message;

        if (percentage < 80) {
            status = 'safe';
            color = '#198754'; // Bootstrap success green
            bgColor = '#d1e7dd';
            icon = 'bi-check-circle-fill';
            message = 'Kredit Aman';
        } else if (percentage < 95) {
            status = 'warning';
            color = '#ffc107'; // Bootstrap warning yellow
            bgColor = '#fff3cd';
            icon = 'bi-exclamation-triangle-fill';
            message = 'Mendekati Batas';
        } else {
            status = 'critical';
            color = '#dc3545'; // Bootstrap danger red
            bgColor = '#f8d7da';
            icon = 'bi-x-circle-fill';
            message = 'Batas Kredit Kritis';
        }

        return {
            status,
            color,
            bgColor,
            icon,
            percentage: Math.round(percentage),
            message
        };
    }
}

// Create singleton instance
const creditLimitValidator = new CreditLimitValidator();
