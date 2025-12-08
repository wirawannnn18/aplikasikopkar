/**
 * Simpanan Data Model Documentation
 * 
 * This file documents the data structure for simpanan (savings) records
 * after implementing pengembalian (refund) tracking features.
 * 
 * Requirements: 1.3, 1.4, 1.5
 */

/**
 * Simpanan Pokok Data Structure
 * 
 * @typedef {Object} SimpananPokok
 * @property {string} id - Unique identifier for the simpanan record
 * @property {string} anggotaId - ID of the member who owns this simpanan
 * @property {number} jumlah - Current balance amount (will be 0 after pengembalian)
 * @property {string} tanggal - Date when simpanan was created (ISO format YYYY-MM-DD)
 * 
 * NEW FIELDS FOR PENGEMBALIAN TRACKING:
 * @property {number} [saldoSebelumPengembalian] - Original balance before pengembalian (historical data)
 * @property {string} [statusPengembalian] - Status: 'Aktif' | 'Dikembalikan'
 * @property {string} [pengembalianId] - Reference to pengembalian record ID
 * @property {string} [tanggalPengembalian] - Date when pengembalian was processed (ISO format)
 * 
 * @example
 * // Active simpanan (before pengembalian)
 * {
 *   id: "SP-001",
 *   anggotaId: "ANG-001",
 *   jumlah: 500000,
 *   tanggal: "2024-01-15",
 *   statusPengembalian: "Aktif"
 * }
 * 
 * @example
 * // After pengembalian processed
 * {
 *   id: "SP-001",
 *   anggotaId: "ANG-001",
 *   jumlah: 0,  // Zeroed out
 *   tanggal: "2024-01-15",
 *   saldoSebelumPengembalian: 500000,  // Historical data preserved
 *   statusPengembalian: "Dikembalikan",
 *   pengembalianId: "PGM-001",
 *   tanggalPengembalian: "2024-12-05"
 * }
 */

/**
 * Simpanan Wajib Data Structure
 * 
 * @typedef {Object} SimpananWajib
 * @property {string} id - Unique identifier for the simpanan record
 * @property {string} anggotaId - ID of the member who owns this simpanan
 * @property {number} jumlah - Current balance amount (will be 0 after pengembalian)
 * @property {string} tanggal - Date when simpanan was created (ISO format YYYY-MM-DD)
 * @property {string} [periode] - Period for this simpanan wajib (e.g., "2024-01")
 * 
 * NEW FIELDS FOR PENGEMBALIAN TRACKING:
 * @property {number} [saldoSebelumPengembalian] - Original balance before pengembalian
 * @property {string} [statusPengembalian] - Status: 'Aktif' | 'Dikembalikan'
 * @property {string} [pengembalianId] - Reference to pengembalian record ID
 * @property {string} [tanggalPengembalian] - Date when pengembalian was processed
 * 
 * @example
 * // Active simpanan wajib
 * {
 *   id: "SW-001",
 *   anggotaId: "ANG-001",
 *   jumlah: 100000,
 *   tanggal: "2024-01-15",
 *   periode: "2024-01",
 *   statusPengembalian: "Aktif"
 * }
 * 
 * @example
 * // After pengembalian
 * {
 *   id: "SW-001",
 *   anggotaId: "ANG-001",
 *   jumlah: 0,
 *   tanggal: "2024-01-15",
 *   periode: "2024-01",
 *   saldoSebelumPengembalian: 100000,
 *   statusPengembalian: "Dikembalikan",
 *   pengembalianId: "PGM-001",
 *   tanggalPengembalian: "2024-12-05"
 * }
 */

/**
 * Simpanan Sukarela Data Structure
 * 
 * @typedef {Object} SimpananSukarela
 * @property {string} id - Unique identifier for the simpanan record
 * @property {string} anggotaId - ID of the member who owns this simpanan
 * @property {number} jumlah - Current balance amount (will be 0 after pengembalian)
 * @property {string} tanggal - Date when simpanan was created (ISO format YYYY-MM-DD)
 * @property {string} [jenis] - Type: 'Setor' | 'Tarik'
 * 
 * NEW FIELDS FOR PENGEMBALIAN TRACKING:
 * @property {number} [saldoSebelumPengembalian] - Original balance before pengembalian
 * @property {string} [statusPengembalian] - Status: 'Aktif' | 'Dikembalikan'
 * @property {string} [pengembalianId] - Reference to pengembalian record ID
 * @property {string} [tanggalPengembalian] - Date when pengembalian was processed
 * 
 * @example
 * // Active simpanan sukarela
 * {
 *   id: "SS-001",
 *   anggotaId: "ANG-001",
 *   jumlah: 250000,
 *   tanggal: "2024-01-15",
 *   jenis: "Setor",
 *   statusPengembalian: "Aktif"
 * }
 * 
 * @example
 * // After pengembalian
 * {
 *   id: "SS-001",
 *   anggotaId: "ANG-001",
 *   jumlah: 0,
 *   tanggal: "2024-01-15",
 *   jenis: "Setor",
 *   saldoSebelumPengembalian: 250000,
 *   statusPengembalian: "Dikembalikan",
 *   pengembalianId: "PGM-001",
 *   tanggalPengembalian: "2024-12-05"
 * }
 */

/**
 * Helper function to initialize new simpanan with default pengembalian fields
 * 
 * @param {Object} simpananData - Base simpanan data
 * @returns {Object} Simpanan with pengembalian fields initialized
 */
function initializeSimpananWithPengembalianFields(simpananData) {
    return {
        ...simpananData,
        statusPengembalian: 'Aktif',
        saldoSebelumPengembalian: null,
        pengembalianId: null,
        tanggalPengembalian: null
    };
}

/**
 * Helper function to mark simpanan as returned (dikembalikan)
 * 
 * @param {Object} simpanan - Simpanan record to update
 * @param {string} pengembalianId - ID of the pengembalian record
 * @param {string} tanggalPengembalian - Date of pengembalian (ISO format)
 * @returns {Object} Updated simpanan record
 */
function markSimpananAsDikembalikan(simpanan, pengembalianId, tanggalPengembalian) {
    return {
        ...simpanan,
        saldoSebelumPengembalian: simpanan.jumlah, // Preserve original balance
        jumlah: 0, // Zero out current balance
        statusPengembalian: 'Dikembalikan',
        pengembalianId: pengembalianId,
        tanggalPengembalian: tanggalPengembalian
    };
}

/**
 * Helper function to check if simpanan has been returned
 * 
 * @param {Object} simpanan - Simpanan record to check
 * @returns {boolean} True if simpanan has been returned
 */
function isSimpananDikembalikan(simpanan) {
    return simpanan.statusPengembalian === 'Dikembalikan' || simpanan.jumlah === 0;
}

/**
 * Helper function to filter active simpanan (not returned)
 * 
 * @param {Array<Object>} simpananArray - Array of simpanan records
 * @returns {Array<Object>} Filtered array with only active simpanan
 */
function filterActiveSimpanan(simpananArray) {
    return simpananArray.filter(s => s.jumlah > 0 && s.statusPengembalian !== 'Dikembalikan');
}

/**
 * Helper function to get total of active simpanan
 * 
 * @param {Array<Object>} simpananArray - Array of simpanan records
 * @returns {number} Total amount of active simpanan
 */
function getTotalActiveSimpanan(simpananArray) {
    return simpananArray
        .filter(s => s.jumlah > 0)
        .reduce((sum, s) => sum + s.jumlah, 0);
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeSimpananWithPengembalianFields,
        markSimpananAsDikembalikan,
        isSimpananDikembalikan,
        filterActiveSimpanan,
        getTotalActiveSimpanan
    };
}
