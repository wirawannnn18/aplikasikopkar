/**
 * Updated Query and Filter Functions
 * Requirements: 4.1, 6.5 - Update transaction retrieval and filtering functions
 * 
 * This file contains updated versions of transaction query and filter functions
 * that support the new 'mode' field and maintain backward compatibility.
 */

/**
 * Enhanced transaction retrieval with mode support
 * Requirements: 4.1, 6.5 - Update transaction retrieval functions
 */
class UpdatedTransactionQueries {
    constructor() {
        this.storageKey = 'pembayaranHutangPiutang';
        this.supportedModes = ['manual', 'import'];
        this.supportedJenis = ['hutang', 'piutang'];
    }

    /**
     * Get all transactions with mode field support
     * Requirements: 4.1 - Enhanced transaction history view
     * @param {Object} filters - Filter options
     * @returns {Array} Filtered transactions
     */
    getAllTransactions(filters = {}) {
        try {
            let transactions = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
            
            // Ensure all transactions have mode field (migration compatibility)
            transactions = this.ensureModeField(transactions);
            
            // Apply filters
            if (Object.keys(filters).length > 0) {
                transactions = this.applyFilters(transactions, filters);
            }
            
            // Sort by date descending (newest first)
            transactions.sort((a, b) => {
                const dateA = new Date(a.createdAt || a.tanggal);
                const dateB = new Date(b.createdAt || b.tanggal);
                return dateB - dateA;
            });
            
            return transactions;
        } catch (error) {
            console.error('Error getting transactions:', error);
            return [];
        }
    }

    /**
     * Get transactions by mode
     * Requirements: 4.1 - Mode filter functionality
     * @param {string} mode - Transaction mode ('manual' or 'import')
     * @param {Object} additionalFilters - Additional filter options
     * @returns {Array} Filtered transactions
     */
    getTransactionsByMode(mode, additionalFilters = {}) {
        if (!this.supportedModes.includes(mode)) {
            console.warn(`Unsupported mode: ${mode}`);
            return [];
        }

        const filters = { ...additionalFilters, mode };
        return this.getAllTransactions(filters);
    }

    /**
     * Get manual transactions only
     * Requirements: 4.1 - Backward compatibility
     * @param {Object} filters - Additional filter options
     * @returns {Array} Manual transactions
     */
    getManualTransactions(filters = {}) {
        return this.getTransactionsByMode('manual', filters);
    }

    /**
     * Get import transactions only
     * Requirements: 4.1 - Import transaction filtering
     * @param {Object} filters - Additional filter options
     * @returns {Array} Import transactions
     */
    getImportTransactions(filters = {}) {
        return this.getTransactionsByMode('import', filters);
    }

    /**
     * Get transactions by anggota with mode support
     * Requirements: 4.1 - Enhanced member transaction history
     * @param {string} anggotaId - Member ID
     * @param {Object} filters - Additional filter options
     * @returns {Array} Member transactions
     */
    getTransactionsByAnggota(anggotaId, filters = {}) {
        if (!anggotaId) {
            return [];
        }

        const memberFilters = { ...filters, anggotaId };
        return this.getAllTransactions(memberFilters);
    }

    /**
     * Get transactions by jenis with mode support
     * Requirements: 4.1 - Enhanced payment type filtering
     * @param {string} jenis - Payment type ('hutang' or 'piutang')
     * @param {Object} filters - Additional filter options
     * @returns {Array} Filtered transactions
     */
    getTransactionsByJenis(jenis, filters = {}) {
        if (!this.supportedJenis.includes(jenis)) {
            console.warn(`Unsupported jenis: ${jenis}`);
            return [];
        }

        const jenisFilters = { ...filters, jenis };
        return this.getAllTransactions(jenisFilters);
    }

    /**
     * Get transactions by batch ID (for import transactions)
     * Requirements: 4.1 - Batch transaction tracking
     * @param {string} batchId - Batch ID
     * @returns {Array} Batch transactions
     */
    getTransactionsByBatch(batchId) {
        if (!batchId) {
            return [];
        }

        return this.getAllTransactions({ batchId });
    }

    /**
     * Apply comprehensive filters to transaction list
     * Requirements: 4.1, 4.3 - Enhanced filtering logic
     * @param {Array} transactions - Transaction list
     * @param {Object} filters - Filter options
     * @returns {Array} Filtered transactions
     */
    applyFilters(transactions, filters) {
        return transactions.filter(transaction => {
            // Mode filter
            if (filters.mode && transaction.mode !== filters.mode) {
                return false;
            }

            // Jenis filter
            if (filters.jenis && transaction.jenis !== filters.jenis) {
                return false;
            }

            // Anggota filter
            if (filters.anggotaId && transaction.anggotaId !== filters.anggotaId) {
                return false;
            }

            // Batch ID filter
            if (filters.batchId && transaction.batchId !== filters.batchId) {
                return false;
            }

            // Date range filters
            if (filters.tanggalDari || filters.tanggalSampai) {
                const transactionDate = transaction.tanggal || transaction.createdAt?.split('T')[0];
                
                if (filters.tanggalDari && transactionDate < filters.tanggalDari) {
                    return false;
                }
                
                if (filters.tanggalSampai && transactionDate > filters.tanggalSampai) {
                    return false;
                }
            }

            // Status filter
            if (filters.status && transaction.status !== filters.status) {
                return false;
            }

            // Kasir filter
            if (filters.kasirId && transaction.kasirId !== filters.kasirId) {
                return false;
            }

            // Amount range filters
            if (filters.jumlahMin && transaction.jumlah < filters.jumlahMin) {
                return false;
            }

            if (filters.jumlahMax && transaction.jumlah > filters.jumlahMax) {
                return false;
            }

            // Text search (anggota name, NIK, or keterangan)
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                const searchableText = [
                    transaction.anggotaNama,
                    transaction.anggotaNIK,
                    transaction.keterangan
                ].join(' ').toLowerCase();
                
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }

            return true;
        });
    }

    /**
     * Ensure all transactions have mode field (migration compatibility)
     * Requirements: 6.5 - Backward compatibility
     * @param {Array} transactions - Transaction list
     * @returns {Array} Transactions with mode field
     */
    ensureModeField(transactions) {
        return transactions.map(transaction => {
            if (!transaction.mode) {
                return {
                    ...transaction,
                    mode: 'manual', // Default to manual for existing transactions
                    batchId: null
                };
            }
            return transaction;
        });
    }

    /**
     * Get transaction statistics by mode
     * Requirements: 4.1 - Enhanced statistics
     * @param {Object} filters - Filter options
     * @returns {Object} Statistics by mode
     */
    getTransactionStatistics(filters = {}) {
        const transactions = this.getAllTransactions(filters);
        
        const stats = {
            total: {
                count: transactions.length,
                amount: transactions.reduce((sum, t) => sum + (t.jumlah || 0), 0)
            },
            manual: {
                count: 0,
                amount: 0
            },
            import: {
                count: 0,
                amount: 0
            },
            hutang: {
                count: 0,
                amount: 0
            },
            piutang: {
                count: 0,
                amount: 0
            }
        };

        transactions.forEach(transaction => {
            // Mode statistics
            if (transaction.mode === 'manual') {
                stats.manual.count++;
                stats.manual.amount += transaction.jumlah || 0;
            } else if (transaction.mode === 'import') {
                stats.import.count++;
                stats.import.amount += transaction.jumlah || 0;
            }

            // Jenis statistics
            if (transaction.jenis === 'hutang') {
                stats.hutang.count++;
                stats.hutang.amount += transaction.jumlah || 0;
            } else if (transaction.jenis === 'piutang') {
                stats.piutang.count++;
                stats.piutang.amount += transaction.jumlah || 0;
            }
        });

        return stats;
    }

    /**
     * Search transactions with enhanced search capabilities
     * Requirements: 4.1 - Enhanced search functionality
     * @param {string} searchTerm - Search term
     * @param {Object} filters - Additional filters
     * @returns {Array} Search results
     */
    searchTransactions(searchTerm, filters = {}) {
        if (!searchTerm || searchTerm.trim() === '') {
            return this.getAllTransactions(filters);
        }

        const searchFilters = { ...filters, search: searchTerm.trim() };
        return this.getAllTransactions(searchFilters);
    }

    /**
     * Get recent transactions with mode information
     * Requirements: 4.1 - Recent transaction display
     * @param {number} limit - Number of transactions to return
     * @param {Object} filters - Additional filters
     * @returns {Array} Recent transactions
     */
    getRecentTransactions(limit = 10, filters = {}) {
        const transactions = this.getAllTransactions(filters);
        return transactions.slice(0, limit);
    }

    /**
     * Export transactions with mode information
     * Requirements: 4.4 - Enhanced export functionality
     * @param {Object} filters - Filter options
     * @param {string} format - Export format ('csv', 'json')
     * @returns {string|Object} Exported data
     */
    exportTransactions(filters = {}, format = 'csv') {
        const transactions = this.getAllTransactions(filters);
        
        if (format === 'json') {
            return {
                data: transactions,
                metadata: {
                    exportedAt: new Date().toISOString(),
                    totalRecords: transactions.length,
                    filters: filters
                }
            };
        }

        // CSV format
        if (transactions.length === 0) {
            return 'No data to export';
        }

        const headers = [
            'Tanggal',
            'Anggota',
            'NIK',
            'Jenis',
            'Mode',
            'Jumlah',
            'Saldo Sebelum',
            'Saldo Sesudah',
            'Kasir',
            'Batch ID',
            'Keterangan',
            'Status'
        ];

        const csvRows = [headers.join(',')];
        
        transactions.forEach(transaction => {
            const row = [
                transaction.tanggal || '',
                `"${transaction.anggotaNama || ''}"`,
                transaction.anggotaNIK || '',
                transaction.jenis || '',
                transaction.mode || 'manual',
                transaction.jumlah || 0,
                transaction.saldoSebelum || 0,
                transaction.saldoSesudah || 0,
                `"${transaction.kasirNama || ''}"`,
                transaction.batchId || '',
                `"${transaction.keterangan || ''}"`,
                transaction.status || ''
            ];
            csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
    }
}

/**
 * Updated utility functions for backward compatibility
 * Requirements: 6.5 - Ensure backward compatibility
 */

/**
 * Updated hitungTotalPembayaranHutang with mode support
 * Requirements: 6.5 - Backward compatibility
 * @param {string} anggotaId - Member ID
 * @param {string} mode - Optional mode filter
 * @returns {number} Total hutang payments
 */
function hitungTotalPembayaranHutangUpdated(anggotaId, mode = null) {
    if (!anggotaId || typeof anggotaId !== 'string') {
        return 0;
    }

    try {
        const queries = new UpdatedTransactionQueries();
        const filters = { anggotaId, jenis: 'hutang', status: 'selesai' };
        
        if (mode) {
            filters.mode = mode;
        }

        const transactions = queries.getAllTransactions(filters);
        return transactions.reduce((sum, t) => sum + (parseFloat(t.jumlah) || 0), 0);
    } catch (error) {
        console.error('Error calculating total pembayaran hutang:', error);
        return 0;
    }
}

/**
 * Updated getPembayaranHutangHistory with mode support
 * Requirements: 6.5 - Backward compatibility
 * @param {string} anggotaId - Member ID
 * @param {string} mode - Optional mode filter
 * @returns {Array} Hutang payment history
 */
function getPembayaranHutangHistoryUpdated(anggotaId, mode = null) {
    if (!anggotaId || typeof anggotaId !== 'string') {
        return [];
    }

    try {
        const queries = new UpdatedTransactionQueries();
        const filters = { anggotaId, jenis: 'hutang' };
        
        if (mode) {
            filters.mode = mode;
        }

        return queries.getAllTransactions(filters);
    } catch (error) {
        console.error('Error getting pembayaran hutang history:', error);
        return [];
    }
}

/**
 * Updated getPembayaranPiutangHistory with mode support
 * Requirements: 6.5 - Backward compatibility
 * @param {string} anggotaId - Member ID
 * @param {string} mode - Optional mode filter
 * @returns {Array} Piutang payment history
 */
function getPembayaranPiutangHistoryUpdated(anggotaId, mode = null) {
    if (!anggotaId || typeof anggotaId !== 'string') {
        return [];
    }

    try {
        const queries = new UpdatedTransactionQueries();
        const filters = { anggotaId, jenis: 'piutang' };
        
        if (mode) {
            filters.mode = mode;
        }

        return queries.getAllTransactions(filters);
    } catch (error) {
        console.error('Error getting pembayaran piutang history:', error);
        return [];
    }
}

/**
 * Updated applyRiwayatFilters function with mode support
 * Requirements: 4.1, 4.3 - Enhanced filtering logic
 * @param {Array} list - Transaction list
 * @returns {Array} Filtered list
 */
function applyRiwayatFiltersUpdated(list) {
    const queries = new UpdatedTransactionQueries();
    
    const filters = {
        jenis: document.getElementById('filterJenis')?.value || '',
        mode: document.getElementById('filterMode')?.value || '',
        tanggalDari: document.getElementById('filterTanggalDari')?.value || '',
        tanggalSampai: document.getElementById('filterTanggalSampai')?.value || '',
        anggotaId: document.getElementById('filterAnggota')?.value || '',
        status: document.getElementById('filterStatus')?.value || '',
        kasirId: document.getElementById('filterKasir')?.value || ''
    };

    // Remove empty filters
    Object.keys(filters).forEach(key => {
        if (!filters[key]) {
            delete filters[key];
        }
    });

    return queries.applyFilters(list, filters);
}

/**
 * Backward compatibility wrapper functions
 * Requirements: 6.5 - Ensure backward compatibility
 */

// Override original functions if they exist
if (typeof window !== 'undefined') {
    // Store original functions for fallback
    if (typeof window.hitungTotalPembayaranHutang === 'function') {
        window._originalHitungTotalPembayaranHutang = window.hitungTotalPembayaranHutang;
    }
    if (typeof window.getPembayaranHutangHistory === 'function') {
        window._originalGetPembayaranHutangHistory = window.getPembayaranHutangHistory;
    }
    if (typeof window.getPembayaranPiutangHistory === 'function') {
        window._originalGetPembayaranPiutangHistory = window.getPembayaranPiutangHistory;
    }
    if (typeof window.applyRiwayatFilters === 'function') {
        window._originalApplyRiwayatFilters = window.applyRiwayatFilters;
    }

    // Replace with updated functions
    window.UpdatedTransactionQueries = UpdatedTransactionQueries;
    window.hitungTotalPembayaranHutang = hitungTotalPembayaranHutangUpdated;
    window.getPembayaranHutangHistory = getPembayaranHutangHistoryUpdated;
    window.getPembayaranPiutangHistory = getPembayaranPiutangHistoryUpdated;
    window.applyRiwayatFilters = applyRiwayatFiltersUpdated;

    // Create global instance for easy access
    window.transactionQueries = new UpdatedTransactionQueries();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        UpdatedTransactionQueries,
        hitungTotalPembayaranHutangUpdated,
        getPembayaranHutangHistoryUpdated,
        getPembayaranPiutangHistoryUpdated,
        applyRiwayatFiltersUpdated
    };
}