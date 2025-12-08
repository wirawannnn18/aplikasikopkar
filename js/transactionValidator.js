/**
 * Transaction Validator Module
 * Validates anggota status before allowing transactions
 * 
 * This module ensures that anggota who have left (statusKeanggotaan = 'Keluar')
 * cannot perform any transactions in the system.
 */

/**
 * Validate if anggota can perform transactions
 * @param {string} anggotaId - ID of the anggota
 * @returns {object} Validation result with structure:
 *   - valid: boolean indicating if anggota can transact
 *   - error: string error message if validation fails
 *   - anggota: object anggota data if validation succeeds
 */
function validateAnggotaForTransaction(anggotaId) {
    try {
        // Validate input
        if (!anggotaId) {
            return {
                valid: false,
                error: 'ID anggota tidak boleh kosong'
            };
        }

        // Get anggota data
        const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
        const member = anggota.find(a => a.id === anggotaId);
        
        // Check if anggota exists
        if (!member) {
            return {
                valid: false,
                error: 'Anggota tidak ditemukan'
            };
        }
        
        // Check if anggota has left the koperasi
        if (member.statusKeanggotaan === 'Keluar') {
            return {
                valid: false,
                error: `Anggota ${member.nama} sudah keluar dari koperasi dan tidak dapat melakukan transaksi`
            };
        }
        
        // Validation passed
        return {
            valid: true,
            anggota: member
        };
    } catch (error) {
        console.error('Error validating anggota for transaction:', error);
        return {
            valid: false,
            error: 'Terjadi kesalahan saat validasi anggota'
        };
    }
}

/**
 * Validate anggota for POS transaction
 * @param {string} anggotaId - ID of the anggota
 * @returns {object} Validation result
 */
function validateAnggotaForPOS(anggotaId) {
    const validation = validateAnggotaForTransaction(anggotaId);
    if (!validation.valid) {
        return {
            ...validation,
            error: `Transaksi POS ditolak: ${validation.error}`
        };
    }
    return validation;
}

/**
 * Validate anggota for kasbon payment
 * @param {string} anggotaId - ID of the anggota
 * @returns {object} Validation result
 */
function validateAnggotaForKasbon(anggotaId) {
    const validation = validateAnggotaForTransaction(anggotaId);
    if (!validation.valid) {
        return {
            ...validation,
            error: `Pembayaran kasbon ditolak: ${validation.error}`
        };
    }
    return validation;
}

/**
 * Validate anggota for simpanan transaction
 * @param {string} anggotaId - ID of the anggota
 * @returns {object} Validation result
 */
function validateAnggotaForSimpanan(anggotaId) {
    const validation = validateAnggotaForTransaction(anggotaId);
    if (!validation.valid) {
        return {
            ...validation,
            error: `Transaksi simpanan ditolak: ${validation.error}`
        };
    }
    return validation;
}

/**
 * Validate anggota for pinjaman transaction
 * @param {string} anggotaId - ID of the anggota
 * @returns {object} Validation result
 */
function validateAnggotaForPinjaman(anggotaId) {
    const validation = validateAnggotaForTransaction(anggotaId);
    if (!validation.valid) {
        return {
            ...validation,
            error: `Transaksi pinjaman ditolak: ${validation.error}`
        };
    }
    return validation;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateAnggotaForTransaction,
        validateAnggotaForPOS,
        validateAnggotaForKasbon,
        validateAnggotaForSimpanan,
        validateAnggotaForPinjaman
    };
}
