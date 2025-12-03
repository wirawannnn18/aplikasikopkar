// Utility Functions Module
// Shared functions for hutang piutang calculations

/**
 * Calculate hutang balance for an anggota
 * This function calculates the current outstanding debt by subtracting
 * all completed payments from the total credit transactions
 * 
 * @param {string} anggotaId - ID of the anggota
 * @returns {number} Current hutang balance (total credit - total payments)
 */
function hitungSaldoHutang(anggotaId) {
    // Handle invalid or missing anggotaId
    if (!anggotaId || typeof anggotaId !== 'string') {
        return 0;
    }
    
    try {
        const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
        const pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
        
        // Total kredit dari POS
        const totalKredit = penjualan
            .filter(p => p.anggotaId === anggotaId && p.status === 'kredit')
            .reduce((sum, p) => sum + (p.total || 0), 0);
        
        // Total pembayaran hutang (only completed payments)
        const totalBayar = pembayaran
            .filter(p => p.anggotaId === anggotaId && p.jenis === 'hutang' && p.status === 'selesai')
            .reduce((sum, p) => sum + (p.jumlah || 0), 0);
        
        return totalKredit - totalBayar;
    } catch (error) {
        console.error('Error calculating saldo hutang:', error);
        return 0;
    }
}

/**
 * Calculate total pembayaran hutang for an anggota
 * This function sums all completed hutang payments
 * 
 * @param {string} anggotaId - ID of the anggota
 * @returns {number} Total pembayaran hutang
 */
function hitungTotalPembayaranHutang(anggotaId) {
    // Handle invalid or missing anggotaId
    if (!anggotaId || typeof anggotaId !== 'string') {
        return 0;
    }
    
    try {
        const pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
        
        // Sum all completed hutang payments
        const totalPembayaran = pembayaran
            .filter(p => p.anggotaId === anggotaId && p.jenis === 'hutang' && p.status === 'selesai')
            .reduce((sum, p) => sum + (p.jumlah || 0), 0);
        
        return totalPembayaran;
    } catch (error) {
        console.error('Error calculating total pembayaran hutang:', error);
        return 0;
    }
}

/**
 * Calculate total kredit transactions for an anggota
 * This function sums all credit POS transactions
 * 
 * @param {string} anggotaId - ID of the anggota
 * @returns {number} Total kredit transactions
 */
function hitungTotalKredit(anggotaId) {
    // Handle invalid or missing anggotaId
    if (!anggotaId || typeof anggotaId !== 'string') {
        return 0;
    }
    
    try {
        const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
        
        // Total kredit dari POS
        const totalKredit = penjualan
            .filter(p => p.anggotaId === anggotaId && p.status === 'kredit')
            .reduce((sum, p) => sum + (p.total || 0), 0);
        
        return totalKredit;
    } catch (error) {
        console.error('Error calculating total kredit:', error);
        return 0;
    }
}

/**
 * Get pembayaran hutang history for an anggota
 * Returns all completed hutang payment transactions sorted by date (newest first)
 * 
 * @param {string} anggotaId - ID of the anggota
 * @returns {Array} List of pembayaran transactions
 */
function getPembayaranHutangHistory(anggotaId) {
    // Handle invalid or missing anggotaId
    if (!anggotaId || typeof anggotaId !== 'string') {
        return [];
    }
    
    try {
        const pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
        
        // Filter hutang payments for this anggota
        const history = pembayaran
            .filter(p => p.anggotaId === anggotaId && p.jenis === 'hutang' && p.status === 'selesai')
            .sort((a, b) => {
                // Sort by date descending (newest first)
                const dateA = new Date(a.tanggal || 0);
                const dateB = new Date(b.tanggal || 0);
                return dateB - dateA;
            });
        
        return history;
    } catch (error) {
        console.error('Error getting pembayaran hutang history:', error);
        return [];
    }
}

/**
 * Calculate piutang balance for an anggota
 * This function calculates the current piutang balance
 * 
 * @param {string} anggotaId - ID of the anggota
 * @returns {number} Current piutang balance
 */
function hitungSaldoPiutang(anggotaId) {
    // Handle invalid or missing anggotaId
    if (!anggotaId || typeof anggotaId !== 'string') {
        return 0;
    }
    
    try {
        const pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
        
        // For phase 1: piutang manual entry
        // Phase 2: can integrate with simpanan withdrawal
        const totalPiutang = pembayaran
            .filter(p => p.anggotaId === anggotaId && p.jenis === 'piutang' && p.status === 'selesai')
            .reduce((sum, p) => sum + (p.jumlah || 0), 0);
        
        return totalPiutang;
    } catch (error) {
        console.error('Error calculating saldo piutang:', error);
        return 0;
    }
}

/**
 * Get pembayaran piutang history for an anggota
 * Returns all completed piutang payment transactions sorted by date (newest first)
 * 
 * @param {string} anggotaId - ID of the anggota
 * @returns {Array} List of pembayaran transactions
 */
function getPembayaranPiutangHistory(anggotaId) {
    // Handle invalid or missing anggotaId
    if (!anggotaId || typeof anggotaId !== 'string') {
        return [];
    }
    
    try {
        const pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
        
        // Filter piutang payments for this anggota
        const history = pembayaran
            .filter(p => p.anggotaId === anggotaId && p.jenis === 'piutang' && p.status === 'selesai')
            .sort((a, b) => {
                // Sort by date descending (newest first)
                const dateA = new Date(a.tanggal || 0);
                const dateB = new Date(b.tanggal || 0);
                return dateB - dateA;
            });
        
        return history;
    } catch (error) {
        console.error('Error getting pembayaran piutang history:', error);
        return [];
    }
}
