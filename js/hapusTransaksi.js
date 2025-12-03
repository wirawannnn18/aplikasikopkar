/**
 * Hapus Transaksi POS Module
 * 
 * This module provides functionality for deleting POS transactions with proper
 * data integrity management including:
 * - Stock restoration
 * - Journal reversal (accounting)
 * - Audit logging
 * - Validation and authorization
 * 
 * @module hapusTransaksi
 * @author Tim Development Koperasi Karyawan
 * @version 1.0.0
 * 
 * @requires bootstrap - For modal dialogs and UI components
 * @requires localStorage - For data persistence
 * 
 * Architecture:
 * - Repository Layer: Data access and persistence
 * - Service Layer: Business logic and orchestration
 * - UI Layer: User interface components and interactions
 */

// ===== Repository Classes =====

/**
 * Repository for Transaction operations
 */
class TransactionRepository {
    /**
     * Get all transactions from localStorage
     * @returns {Array} Array of transaction objects
     */
    getAll() {
        return JSON.parse(localStorage.getItem('penjualan') || '[]');
    }
    
    /**
     * Get transaction by ID
     * @param {string} id - Transaction ID or noTransaksi
     * @returns {Object|null} Transaction object or null if not found
     */
    getById(id) {
        const transactions = this.getAll();
        return transactions.find(t => t.id === id || t.noTransaksi === id) || null;
    }
    
    /**
     * Delete transaction from localStorage
     * @param {string} id - Transaction ID or noTransaksi
     * @returns {boolean} True if deleted successfully
     */
    delete(id) {
        let transactions = this.getAll();
        const initialLength = transactions.length;
        transactions = transactions.filter(t => t.id !== id && t.noTransaksi !== id);
        
        if (transactions.length < initialLength) {
            localStorage.setItem('penjualan', JSON.stringify(transactions));
            return true;
        }
        
        return false;
    }
    
    /**
     * Filter transactions based on criteria
     * @param {Object} filters - Filter criteria
     * @param {string} filters.search - Search query for transaction number or cashier
     * @param {string} filters.metode - Payment method (cash/bon)
     * @param {string} filters.startDate - Start date (ISO format)
     * @param {string} filters.endDate - End date (ISO format)
     * @returns {Array} Filtered transactions
     */
    filter(filters) {
        let transactions = this.getAll();
        
        // Filter by search query
        if (filters.search) {
            const query = filters.search.toLowerCase();
            transactions = transactions.filter(t => 
                (t.noTransaksi && t.noTransaksi.toLowerCase().includes(query)) ||
                (t.id && t.id.toLowerCase().includes(query)) ||
                (t.kasir && t.kasir.toLowerCase().includes(query))
            );
        }
        
        // Filter by payment method
        if (filters.metode && filters.metode !== 'all') {
            transactions = transactions.filter(t => t.metode === filters.metode);
        }
        
        // Filter by date range
        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            startDate.setHours(0, 0, 0, 0);
            transactions = transactions.filter(t => 
                new Date(t.tanggal) >= startDate
            );
        }
        
        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999);
            transactions = transactions.filter(t => 
                new Date(t.tanggal) <= endDate
            );
        }
        
        return transactions;
    }
}

/**
 * Repository for Stock operations
 */
class StockRepository {
    /**
     * Get all items from localStorage
     * @returns {Array} Array of item objects
     */
    getAll() {
        return JSON.parse(localStorage.getItem('barang') || '[]');
    }
    
    /**
     * Add stock to an item
     * @param {string} itemId - Item ID
     * @param {number} quantity - Quantity to add
     * @returns {boolean} True if stock added successfully
     */
    addStock(itemId, quantity) {
        const items = this.getAll();
        const item = items.find(i => i.id === itemId);
        
        if (item) {
            item.stok = (item.stok || 0) + quantity;
            localStorage.setItem('barang', JSON.stringify(items));
            return true;
        }
        
        return false;
    }
}

/**
 * Repository for Journal operations
 */
class JournalRepository {
    /**
     * Add a new journal entry
     * @param {Object} journal - Journal data
     * @param {string} journal.keterangan - Journal description
     * @param {Array} journal.entries - Journal entries
     * @param {string} journal.tanggal - Journal date (ISO format)
     * @returns {string} Journal ID
     */
    add(journal) {
        const journals = JSON.parse(localStorage.getItem('jurnal') || '[]');
        
        const journalData = {
            id: this._generateId(),
            tanggal: journal.tanggal || new Date().toISOString(),
            keterangan: journal.keterangan,
            entries: journal.entries
        };
        
        journals.push(journalData);
        localStorage.setItem('jurnal', JSON.stringify(journals));
        
        // Update COA saldo
        this.updateCOASaldo(journal.entries);
        
        return journalData.id;
    }
    
    /**
     * Update COA saldo based on journal entries
     * @param {Array} entries - Journal entries
     */
    updateCOASaldo(entries) {
        const coa = JSON.parse(localStorage.getItem('coa') || '[]');
        
        entries.forEach(entry => {
            const akun = coa.find(c => c.kode === entry.akun);
            if (akun) {
                // For Asset and Expense accounts: increase with debit, decrease with credit
                // For Liability, Equity, and Revenue accounts: increase with credit, decrease with debit
                if (akun.tipe === 'Aset' || akun.tipe === 'Beban') {
                    akun.saldo = (akun.saldo || 0) + entry.debit - entry.kredit;
                } else {
                    akun.saldo = (akun.saldo || 0) + entry.kredit - entry.debit;
                }
            }
        });
        
        localStorage.setItem('coa', JSON.stringify(coa));
    }
    
    /**
     * Generate unique ID for journal
     * @private
     * @returns {string} Unique ID
     */
    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
}

/**
 * Repository for Deletion Log operations
 */
class DeletionLogRepository {
    /**
     * Save deletion log
     * @param {Object} log - Deletion log data
     * @returns {string} Log ID
     */
    save(log) {
        const logs = JSON.parse(localStorage.getItem('deletionLog') || '[]');
        
        const logData = {
            id: this._generateId(),
            ...log,
            deletedAt: new Date().toISOString()
        };
        
        logs.push(logData);
        localStorage.setItem('deletionLog', JSON.stringify(logs));
        
        return logData.id;
    }
    
    /**
     * Get all deletion logs
     * @returns {Array} Array of deletion log objects
     */
    getAll() {
        return JSON.parse(localStorage.getItem('deletionLog') || '[]');
    }
    
    /**
     * Get deletion log by transaction ID
     * @param {string} transactionId - Transaction ID
     * @returns {Object|null} Deletion log or null if not found
     */
    getByTransactionId(transactionId) {
        const logs = this.getAll();
        return logs.find(l => l.transactionId === transactionId) || null;
    }
    
    /**
     * Generate unique ID for log
     * @private
     * @returns {string} Unique ID
     */
    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
}

// ===== Business Logic Services =====

/**
 * Service for restoring stock when transactions are deleted
 */
class StockRestorationService {
    constructor() {
        this.stockRepo = new StockRepository();
    }
    
    /**
     * Restore stock for all items in a transaction
     * @param {Array} items - Array of transaction items
     * @returns {Object} { success: boolean, warnings: Array<string> }
     */
    restoreStock(items) {
        const warnings = [];
        
        if (!items || items.length === 0) {
            return {
                success: true,
                warnings: []
            };
        }
        
        // Loop through each item and restore stock
        for (const item of items) {
            const restored = this.stockRepo.addStock(item.id, item.qty);
            
            if (!restored) {
                warnings.push(`Barang ${item.nama} tidak ditemukan, stok tidak dapat dikembalikan`);
            }
        }
        
        return {
            success: true,
            warnings: warnings
        };
    }
}

/**
 * Service for creating journal reversal entries
 */
class JournalReversalService {
    constructor() {
        this.journalRepo = new JournalRepository();
    }
    
    /**
     * Create reversal journals for a deleted transaction
     * @param {Object} transaction - Transaction object
     * @returns {Object} { success: boolean, journalIds: Array<string> }
     */
    createReversalJournals(transaction) {
        const journalIds = [];
        const currentDate = new Date().toISOString();
        
        // Calculate total HPP
        let totalHPP = 0;
        if (transaction.items && transaction.items.length > 0) {
            totalHPP = transaction.items.reduce((sum, item) => {
                return sum + ((item.hpp || 0) * item.qty);
            }, 0);
        }
        
        // Create revenue reversal journal (different for cash vs credit)
        const revenueJournal = {
            tanggal: currentDate,
            keterangan: `Reversal Hapus Transaksi ${transaction.noTransaksi || transaction.id}`,
            entries: []
        };
        
        if (transaction.metode === 'cash') {
            // Cash transaction: Debit Revenue, Credit Cash
            revenueJournal.entries = [
                {
                    akun: '4-1000', // Pendapatan Penjualan
                    debit: transaction.total,
                    kredit: 0
                },
                {
                    akun: '1-1000', // Kas
                    debit: 0,
                    kredit: transaction.total
                }
            ];
        } else {
            // Credit transaction: Debit Revenue, Credit Accounts Receivable
            revenueJournal.entries = [
                {
                    akun: '4-1000', // Pendapatan Penjualan
                    debit: transaction.total,
                    kredit: 0
                },
                {
                    akun: '1-1200', // Piutang Anggota
                    debit: 0,
                    kredit: transaction.total
                }
            ];
        }
        
        const revenueJournalId = this.journalRepo.add(revenueJournal);
        journalIds.push(revenueJournalId);
        
        // Create HPP reversal journal: Debit Inventory, Credit COGS
        if (totalHPP > 0) {
            const hppJournal = {
                tanggal: currentDate,
                keterangan: `Reversal HPP Hapus Transaksi ${transaction.noTransaksi || transaction.id}`,
                entries: [
                    {
                        akun: '1-1300', // Persediaan Barang
                        debit: totalHPP,
                        kredit: 0
                    },
                    {
                        akun: '5-1000', // Harga Pokok Penjualan
                        debit: 0,
                        kredit: totalHPP
                    }
                ]
            };
            
            const hppJournalId = this.journalRepo.add(hppJournal);
            journalIds.push(hppJournalId);
        }
        
        return {
            success: true,
            journalIds: journalIds
        };
    }
}

/**
 * Service for logging audit trail of transaction deletions
 */
class AuditLoggerService {
    constructor() {
        this.deletionLogRepo = new DeletionLogRepository();
    }
    
    /**
     * Log a transaction deletion
     * @param {Object} transaction - Complete transaction data
     * @param {string} reason - Deletion reason
     * @param {string} deletedBy - User who deleted the transaction
     * @returns {Object} { success: boolean, logId: string }
     */
    logDeletion(transaction, reason, deletedBy) {
        const logData = {
            transactionId: transaction.id,
            transactionNo: transaction.noTransaksi || transaction.id,
            transactionData: transaction,
            reason: reason,
            deletedBy: deletedBy,
            stockRestored: true,
            journalReversed: true,
            warnings: []
        };
        
        const logId = this.deletionLogRepo.save(logData);
        
        return {
            success: true,
            logId: logId
        };
    }
    
    /**
     * Get deletion history
     * @returns {Array} Array of deletion logs
     */
    getDeletionHistory() {
        return this.deletionLogRepo.getAll();
    }
}

/**
 * Main service for orchestrating transaction deletion
 */
class TransactionDeletionService {
    constructor() {
        this.transactionRepo = new TransactionRepository();
        this.validationService = new TransactionValidationService();
        this.stockRestorationService = new StockRestorationService();
        this.journalReversalService = new JournalReversalService();
        this.auditLoggerService = new AuditLoggerService();
    }
    
    /**
     * Delete a transaction and perform all related operations
     * @param {string} transactionId - Transaction ID or noTransaksi
     * @param {string} reason - Deletion reason
     * @param {string} deletedBy - User who is deleting the transaction
     * @returns {Object} { success: boolean, message: string, warnings?: Array<string> }
     */
    deleteTransaction(transactionId, reason, deletedBy) {
        try {
            // 1. Validate transaction
            const validationResult = this.validationService.validateDeletion(transactionId);
            if (!validationResult.valid) {
                return {
                    success: false,
                    message: validationResult.message
                };
            }
            
            // 2. Validate reason
            const reasonValidation = this.validationService.validateReason(reason);
            if (!reasonValidation.valid) {
                return {
                    success: false,
                    message: reasonValidation.message
                };
            }
            
            // 3. Get complete transaction data
            const transaction = this.transactionRepo.getById(transactionId);
            if (!transaction) {
                return {
                    success: false,
                    message: 'Transaksi tidak ditemukan'
                };
            }
            
            // 4. Restore stock
            const stockResult = this.stockRestorationService.restoreStock(transaction.items);
            
            // 5. Create journal reversal
            const journalResult = this.journalReversalService.createReversalJournals(transaction);
            
            // 6. Delete transaction from localStorage
            const deleted = this.transactionRepo.delete(transactionId);
            if (!deleted) {
                return {
                    success: false,
                    message: 'Gagal menghapus transaksi dari storage'
                };
            }
            
            // 7. Log audit trail
            const auditResult = this.auditLoggerService.logDeletion(transaction, reason, deletedBy);
            
            // Return success with any warnings
            const result = {
                success: true,
                message: 'Transaksi berhasil dihapus'
            };
            
            if (stockResult.warnings && stockResult.warnings.length > 0) {
                result.warnings = stockResult.warnings;
            }
            
            return result;
            
        } catch (error) {
            return {
                success: false,
                message: `Error saat menghapus transaksi: ${error.message}`
            };
        }
    }
}

// ===== Validation Services =====

/**
 * Service for validating transaction deletion operations
 */
class TransactionValidationService {
    constructor() {
        this.transactionRepo = new TransactionRepository();
    }
    
    /**
     * Validate if a transaction can be deleted
     * @param {string} transactionId - Transaction ID or noTransaksi
     * @returns {Object} { valid: boolean, message: string }
     */
    validateDeletion(transactionId) {
        // Check if transaction exists
        const transaction = this.transactionRepo.getById(transactionId);
        
        if (!transaction) {
            return {
                valid: false,
                message: 'Transaksi tidak ditemukan'
            };
        }
        
        // Check if transaction is in a closed shift
        const isInClosedShift = this._isTransactionInClosedShift(transaction);
        
        if (isInClosedShift) {
            return {
                valid: false,
                message: 'Transaksi sudah masuk dalam laporan tutup kasir yang sudah ditutup dan tidak dapat dihapus'
            };
        }
        
        return {
            valid: true,
            message: 'Transaksi dapat dihapus'
        };
    }
    
    /**
     * Validate deletion reason
     * @param {string} reason - Deletion reason
     * @returns {Object} { valid: boolean, message: string }
     */
    validateReason(reason) {
        // Check if reason is empty
        if (!reason || reason.trim() === '') {
            return {
                valid: false,
                message: 'Alasan penghapusan harus diisi'
            };
        }
        
        // Check if reason exceeds maximum length
        if (reason.length > 500) {
            return {
                valid: false,
                message: 'Alasan maksimal 500 karakter'
            };
        }
        
        return {
            valid: true,
            message: 'Alasan valid'
        };
    }
    
    /**
     * Check if transaction is in a closed shift
     * @private
     * @param {Object} transaction - Transaction object
     * @returns {boolean} True if transaction is in a closed shift
     */
    _isTransactionInClosedShift(transaction) {
        const riwayatTutupKas = JSON.parse(localStorage.getItem('riwayatTutupKas') || '[]');
        
        if (riwayatTutupKas.length === 0) {
            return false;
        }
        
        const transactionDate = new Date(transaction.tanggal);
        
        // Check if transaction falls within any closed shift
        for (const shift of riwayatTutupKas) {
            const shiftStart = new Date(shift.waktuBuka);
            const shiftEnd = new Date(shift.waktuTutup);
            
            if (transactionDate >= shiftStart && transactionDate <= shiftEnd) {
                return true;
            }
        }
        
        return false;
    }
}

// ===== UI Components =====

/**
 * Global state for transaction filters
 * Maintains the current filter state across UI interactions
 * 
 * @type {Object}
 * @property {string} search - Search query for transaction number or cashier name
 * @property {string} metode - Payment method filter ('all', 'cash', or 'bon')
 * @property {string} startDate - Start date for date range filter (ISO format)
 * @property {string} endDate - End date for date range filter (ISO format)
 */
let currentFilters = {
    search: '',
    metode: 'all',
    startDate: '',
    endDate: ''
};

/**
 * Render main Hapus Transaksi page
 * Creates the main UI structure including filter panel and transaction table
 * This is the entry point for the delete transaction feature
 * 
 * @function
 * @returns {void}
 * 
 * @example
 * // Called from navigation menu
 * renderHapusTransaksi();
 */
function renderHapusTransaksi() {
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 style="color: #2d6a4f; font-weight: 700;">
                <i class="bi bi-trash me-2"></i>Hapus Transaksi POS
            </h2>
        </div>
        
        <div class="card mb-4">
            <div class="card-header">
                <i class="bi bi-funnel me-2"></i>Filter & Pencarian
            </div>
            <div class="card-body" id="filterPanel">
                <!-- Filter panel will be rendered here -->
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <i class="bi bi-list-ul me-2"></i>Daftar Transaksi
            </div>
            <div class="card-body" id="transactionTableContainer">
                <!-- Transaction table will be rendered here -->
            </div>
        </div>
    `;
    
    // Render filter panel and transaction table
    renderFilterPanel();
    loadAndRenderTransactions();
}

/**
 * Render filter panel with search and filter controls
 * Creates input fields for searching and filtering transactions
 * Automatically attaches event listeners for real-time filtering
 * 
 * @function
 * @returns {void}
 */
function renderFilterPanel() {
    const filterPanel = document.getElementById('filterPanel');
    
    filterPanel.innerHTML = `
        <div class="row g-3">
            <div class="col-md-3">
                <label class="form-label">
                    <i class="bi bi-search me-1"></i>Pencarian
                </label>
                <input 
                    type="text" 
                    class="form-control" 
                    id="searchInput" 
                    placeholder="No Transaksi atau Kasir"
                    value="${currentFilters.search}"
                >
            </div>
            <div class="col-md-3">
                <label class="form-label">
                    <i class="bi bi-credit-card me-1"></i>Metode Pembayaran
                </label>
                <select class="form-select" id="metodeFilter">
                    <option value="all" ${currentFilters.metode === 'all' ? 'selected' : ''}>Semua</option>
                    <option value="cash" ${currentFilters.metode === 'cash' ? 'selected' : ''}>Cash</option>
                    <option value="bon" ${currentFilters.metode === 'bon' ? 'selected' : ''}>Kredit/Bon</option>
                </select>
            </div>
            <div class="col-md-2">
                <label class="form-label">
                    <i class="bi bi-calendar me-1"></i>Tanggal Mulai
                </label>
                <input 
                    type="date" 
                    class="form-control" 
                    id="startDateFilter"
                    value="${currentFilters.startDate}"
                >
            </div>
            <div class="col-md-2">
                <label class="form-label">
                    <i class="bi bi-calendar me-1"></i>Tanggal Akhir
                </label>
                <input 
                    type="date" 
                    class="form-control" 
                    id="endDateFilter"
                    value="${currentFilters.endDate}"
                >
            </div>
            <div class="col-md-2 d-flex align-items-end">
                <button class="btn btn-secondary w-100" onclick="resetFilters()">
                    <i class="bi bi-arrow-clockwise me-1"></i>Reset
                </button>
            </div>
        </div>
    `;
    
    // Add event listeners for filter changes
    document.getElementById('searchInput').addEventListener('input', handleFilterChange);
    document.getElementById('metodeFilter').addEventListener('change', handleFilterChange);
    document.getElementById('startDateFilter').addEventListener('change', handleFilterChange);
    document.getElementById('endDateFilter').addEventListener('change', handleFilterChange);
}

/**
 * Handle filter change events
 * Updates the global filter state and triggers transaction list refresh
 * Called automatically when any filter input changes
 * 
 * @function
 * @returns {void}
 */
function handleFilterChange() {
    currentFilters.search = document.getElementById('searchInput').value;
    currentFilters.metode = document.getElementById('metodeFilter').value;
    currentFilters.startDate = document.getElementById('startDateFilter').value;
    currentFilters.endDate = document.getElementById('endDateFilter').value;
    
    applyFilters();
}

/**
 * Apply current filters and refresh transaction list
 * Fetches filtered transactions from repository and updates the UI
 * 
 * @function
 * @returns {void}
 */
function applyFilters() {
    const transactionRepo = new TransactionRepository();
    const filteredTransactions = transactionRepo.filter(currentFilters);
    renderTransactionTable(filteredTransactions);
}

/**
 * Reset all filters to default values
 * Clears search query, payment method filter, and date range
 * Refreshes the transaction list to show all transactions
 * 
 * @function
 * @returns {void}
 */
function resetFilters() {
    currentFilters = {
        search: '',
        metode: 'all',
        startDate: '',
        endDate: ''
    };
    
    renderFilterPanel();
    loadAndRenderTransactions();
}

/**
 * Load and render transactions with current filters
 * Fetches transactions from repository and renders them in the table
 * 
 * @function
 * @returns {void}
 */
function loadAndRenderTransactions() {
    const transactionRepo = new TransactionRepository();
    const transactions = transactionRepo.filter(currentFilters);
    renderTransactionTable(transactions);
}

/**
 * Render transaction table with delete buttons
 * Displays transactions in a sortable table with action buttons
 * Shows empty state if no transactions match the filters
 * 
 * @function
 * @param {Array<Object>} transactions - Array of transaction objects
 * @param {string} transactions[].id - Transaction ID
 * @param {string} transactions[].noTransaksi - Transaction number
 * @param {string} transactions[].tanggal - Transaction date (ISO format)
 * @param {string} transactions[].kasir - Cashier name
 * @param {string} transactions[].tipeAnggota - Member type (Anggota/Umum)
 * @param {number} transactions[].total - Transaction total amount
 * @param {string} transactions[].metode - Payment method (cash/bon)
 * @param {string} transactions[].status - Transaction status (lunas/kredit)
 * @returns {void}
 */
function renderTransactionTable(transactions) {
    const container = document.getElementById('transactionTableContainer');
    
    if (!transactions || transactions.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-inbox" style="font-size: 4rem; color: #ccc;"></i>
                <p class="text-muted mt-3 mb-0">Tidak ada transaksi</p>
            </div>
        `;
        return;
    }
    
    // Sort transactions by date (newest first)
    const sortedTransactions = [...transactions].sort((a, b) => {
        return new Date(b.tanggal) - new Date(a.tanggal);
    });
    
    container.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>No Transaksi</th>
                        <th>Tanggal</th>
                        <th>Kasir</th>
                        <th>Anggota/Umum</th>
                        <th class="text-end">Total</th>
                        <th>Metode</th>
                        <th>Status</th>
                        <th class="text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedTransactions.map(t => `
                        <tr>
                            <td>
                                <strong>${t.noTransaksi || t.id}</strong>
                            </td>
                            <td>${formatTanggal(t.tanggal)}</td>
                            <td>
                                <i class="bi bi-person-circle me-1"></i>${t.kasir || '-'}
                            </td>
                            <td>
                                ${t.tipeAnggota === 'Anggota' 
                                    ? `<span class="badge bg-primary">${t.tipeAnggota}</span>` 
                                    : `<span class="badge bg-secondary">${t.tipeAnggota || 'Umum'}</span>`
                                }
                            </td>
                            <td class="text-end">
                                <strong>${formatRupiah(t.total)}</strong>
                            </td>
                            <td>
                                ${t.metode === 'cash' 
                                    ? `<span class="badge bg-success"><i class="bi bi-cash me-1"></i>Cash</span>` 
                                    : `<span class="badge bg-warning"><i class="bi bi-credit-card me-1"></i>Kredit</span>`
                                }
                            </td>
                            <td>
                                ${t.status === 'lunas' 
                                    ? `<span class="badge bg-success">Lunas</span>` 
                                    : `<span class="badge bg-warning">Kredit</span>`
                                }
                            </td>
                            <td class="text-center">
                                <button 
                                    class="btn btn-sm btn-danger" 
                                    onclick="handleDeleteTransaction('${t.noTransaksi || t.id}')"
                                    title="Hapus Transaksi"
                                >
                                    <i class="bi bi-trash"></i> Hapus
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div class="mt-3">
            <small class="text-muted">
                <i class="bi bi-info-circle me-1"></i>
                Menampilkan ${sortedTransactions.length} transaksi
            </small>
        </div>
    `;
}

/**
 * Format tanggal untuk display
 * Converts ISO date string to Indonesian locale format
 * 
 * @param {string} dateString - ISO date string (e.g., "2024-11-24T10:30:00.000Z")
 * @returns {string} Formatted date (e.g., "24 Nov 2024, 10:30")
 * 
 * @example
 * formatTanggal("2024-11-24T10:30:00.000Z")
 * // Returns: "24 Nov 2024, 10:30"
 */
function formatTanggal(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Show delete confirmation dialog with transaction details
 * Displays a Bootstrap modal with complete transaction information
 * and a required reason input field
 * 
 * @function
 * @param {Object} transaction - Complete transaction object to be deleted
 * @param {string} transaction.id - Transaction ID
 * @param {string} transaction.noTransaksi - Transaction number
 * @param {string} transaction.tanggal - Transaction date
 * @param {string} transaction.kasir - Cashier name
 * @param {Array<Object>} transaction.items - Transaction items
 * @param {number} transaction.total - Total amount
 * @param {string} transaction.metode - Payment method
 * @returns {void}
 */
function showDeleteConfirmation(transaction) {
    // Remove existing modal if any
    const existingModal = document.getElementById('deleteConfirmationModal');
    if (existingModal) existingModal.remove();
    
    // Calculate total items
    const totalItems = transaction.items ? transaction.items.reduce((sum, item) => sum + item.qty, 0) : 0;
    
    const modalHTML = `
        <div class="modal fade" id="deleteConfirmationModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-exclamation-triangle me-2"></i>Konfirmasi Hapus Transaksi
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-warning">
                            <i class="bi bi-info-circle me-2"></i>
                            <strong>Perhatian!</strong> Menghapus transaksi akan:
                            <ul class="mb-0 mt-2">
                                <li>Mengembalikan stok barang</li>
                                <li>Membuat jurnal pembalik</li>
                                <li>Mencatat log audit</li>
                            </ul>
                        </div>
                        
                        <h6 class="mb-3"><i class="bi bi-receipt me-2"></i>Detail Transaksi</h6>
                        
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <table class="table table-sm table-borderless">
                                    <tr>
                                        <td><strong>No Transaksi:</strong></td>
                                        <td>${transaction.noTransaksi || transaction.id}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Tanggal:</strong></td>
                                        <td>${formatTanggal(transaction.tanggal)}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Kasir:</strong></td>
                                        <td>${transaction.kasir || '-'}</td>
                                    </tr>
                                </table>
                            </div>
                            <div class="col-md-6">
                                <table class="table table-sm table-borderless">
                                    <tr>
                                        <td><strong>Tipe:</strong></td>
                                        <td>${transaction.tipeAnggota || 'Umum'}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Metode:</strong></td>
                                        <td>
                                            ${transaction.metode === 'cash' 
                                                ? '<span class="badge bg-success">Cash</span>' 
                                                : '<span class="badge bg-warning">Kredit</span>'
                                            }
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><strong>Status:</strong></td>
                                        <td>
                                            ${transaction.status === 'lunas' 
                                                ? '<span class="badge bg-success">Lunas</span>' 
                                                : '<span class="badge bg-warning">Kredit</span>'
                                            }
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                        
                        <h6 class="mb-2"><i class="bi bi-cart me-2"></i>Item Transaksi (${totalItems} item)</h6>
                        <div class="table-responsive mb-3" style="max-height: 200px; overflow-y: auto;">
                            <table class="table table-sm table-bordered">
                                <thead class="table-light">
                                    <tr>
                                        <th>Nama Barang</th>
                                        <th class="text-center">Qty</th>
                                        <th class="text-end">Harga</th>
                                        <th class="text-end">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${transaction.items && transaction.items.length > 0 
                                        ? transaction.items.map(item => `
                                            <tr>
                                                <td>${item.nama}</td>
                                                <td class="text-center">${item.qty}</td>
                                                <td class="text-end">${formatRupiah(item.harga)}</td>
                                                <td class="text-end">${formatRupiah(item.harga * item.qty)}</td>
                                            </tr>
                                        `).join('')
                                        : '<tr><td colspan="4" class="text-center text-muted">Tidak ada item</td></tr>'
                                    }
                                </tbody>
                                <tfoot class="table-light">
                                    <tr>
                                        <th colspan="3" class="text-end">Total:</th>
                                        <th class="text-end">${formatRupiah(transaction.total)}</th>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">
                                <i class="bi bi-pencil-square me-1"></i>
                                <strong>Alasan Penghapusan <span class="text-danger">*</span></strong>
                            </label>
                            <textarea 
                                class="form-control" 
                                id="deleteReason" 
                                rows="3" 
                                placeholder="Masukkan alasan penghapusan transaksi..."
                                maxlength="500"
                                required
                            ></textarea>
                            <div class="d-flex justify-content-between mt-1">
                                <small class="text-muted">Wajib diisi untuk keperluan audit</small>
                                <small class="text-muted">
                                    <span id="charCount">0</span>/500 karakter
                                </small>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="handleCancelDeletion()">
                            <i class="bi bi-x-circle me-1"></i>Batal
                        </button>
                        <button type="button" class="btn btn-danger" onclick="confirmDeletion('${transaction.noTransaksi || transaction.id}')">
                            <i class="bi bi-trash me-1"></i>Konfirmasi Hapus
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmationModal'));
    modal.show();
    
    // Add character counter
    const reasonTextarea = document.getElementById('deleteReason');
    const charCount = document.getElementById('charCount');
    
    reasonTextarea.addEventListener('input', function() {
        charCount.textContent = this.value.length;
        
        if (this.value.length >= 500) {
            charCount.classList.add('text-danger');
        } else {
            charCount.classList.remove('text-danger');
        }
    });
}

/**
 * Handle delete transaction button click
 * Validates the transaction can be deleted before showing confirmation dialog
 * Prevents deletion of transactions in closed shifts
 * 
 * @function
 * @param {string} transactionId - Transaction ID or noTransaksi
 * @returns {void}
 * 
 * @example
 * // Called from delete button in transaction table
 * handleDeleteTransaction('TRX-241124-0001');
 */
function handleDeleteTransaction(transactionId) {
    // Get transaction data first
    const transactionRepo = new TransactionRepository();
    const transaction = transactionRepo.getById(transactionId);
    
    if (!transaction) {
        showAlert('Transaksi tidak ditemukan', 'danger');
        return;
    }
    
    // Check if transaction is in a closed shift
    const validationService = new TransactionValidationService();
    const isInClosedShift = validationService._isTransactionInClosedShift(transaction);
    
    if (isInClosedShift) {
        // Route to closed shift deletion flow
        handleClosedShiftDeletion(transaction);
        return;
    }
    
    // Regular deletion flow - validate transaction can be deleted
    const validationResult = validationService.validateDeletion(transactionId);
    
    if (!validationResult.valid) {
        showAlert(validationResult.message, 'danger');
        return;
    }
    
    // Show confirmation dialog for regular deletion
    showDeleteConfirmation(transaction);
}

/**
 * Handle deletion of closed shift transactions
 * Implements special security flow for transactions in closed shifts
 * 
 * @function
 * @param {Object} transaction - Transaction object
 * @returns {void}
 */
function handleClosedShiftDeletion(transaction) {
    // 1. Check role - must be super admin
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    // Check if user is super admin
    // Support both 'super_admin' and 'administrator' roles
    const isSuperAdmin = currentUser && 
        (currentUser.role === 'super_admin' || currentUser.role === 'administrator');
    
    if (!isSuperAdmin) {
        showAlert('Akses ditolak. Hanya Super Admin yang dapat menghapus transaksi tertutup.', 'danger');
        return;
    }
    
    // Get shift data for warning dialog
    const riwayatTutupKas = JSON.parse(localStorage.getItem('riwayatTutupKas') || '[]');
    const transactionDate = new Date(transaction.tanggal);
    let shiftData = null;
    
    for (const shift of riwayatTutupKas) {
        const shiftStart = new Date(shift.waktuBuka);
        const shiftEnd = new Date(shift.waktuTutup);
        
        if (transactionDate >= shiftStart && transactionDate <= shiftEnd) {
            shiftData = shift;
            break;
        }
    }
    
    // 2. Show warning dialog with checkbox
    showClosedShiftWarning(transaction, shiftData, () => {
        // 3. Show password confirmation dialog
        showPasswordConfirmation((passwordResult) => {
            if (!passwordResult.success) {
                showAlert(passwordResult.message, 'danger');
                return;
            }
            
            // 4. Show category/reason dialog
            showCategoryReasonDialog(transaction, (categoryResult) => {
                if (!categoryResult.success) {
                    showAlert(categoryResult.message, 'warning');
                    return;
                }
                
                // 5. Check rate limit
                const rateLimiterService = new RateLimiterService();
                const rateLimitResult = rateLimiterService.checkRateLimit(currentUser.username);
                
                if (!rateLimitResult.allowed) {
                    showAlert(rateLimitResult.message, 'danger');
                    return;
                }
                
                // Show rate limit warning if approaching limit
                if (rateLimitResult.count >= 5 && rateLimitResult.count < 10) {
                    showAlert(`Peringatan: Anda telah menghapus ${rateLimitResult.count} transaksi tertutup hari ini. Harap berhati-hati.`, 'warning');
                }
                
                // 6. Call ClosedShiftDeletionService
                const deletionService = new ClosedShiftDeletionService();
                const deletionData = {
                    category: categoryResult.category,
                    reason: categoryResult.reason,
                    password: passwordResult.password,
                    user: currentUser.username,
                    deletedBy: currentUser.name || currentUser.username
                };
                
                // Show loading indicator
                showAlert('Memproses penghapusan transaksi tertutup...', 'info');
                
                // Perform deletion
                try {
                    const result = deletionService.deleteClosedTransaction(
                        transaction.noTransaksi || transaction.id,
                        deletionData
                    );
                    
                    // 7. Handle result
                    if (result.success) {
                        // 8. Show success notification with audit ID
                        showAlert(
                            `Transaksi berhasil dihapus. Audit ID: ${result.auditId}`,
                            'success'
                        );
                        
                        // Show warnings if any
                        if (result.warnings && result.warnings.length > 0) {
                            setTimeout(() => {
                                result.warnings.forEach(warning => {
                                    showAlert(warning, 'warning');
                                });
                            }, 500);
                        }
                        
                        // 9. Refresh transaction list
                        loadAndRenderTransactions();
                    } else {
                        // Handle rollback error
                        showAlert(
                            `Gagal menghapus transaksi: ${result.message}. ${result.rollbackPerformed ? 'Rollback telah dilakukan.' : ''}`,
                            'danger'
                        );
                    }
                } catch (error) {
                    // Handle unexpected errors
                    showAlert(
                        `Error saat menghapus transaksi: ${error.message}`,
                        'danger'
                    );
                    console.error('Closed shift deletion error:', error);
                }
            });
        });
    }, () => {
        // User cancelled from warning dialog
        showAlert('Penghapusan dibatalkan', 'info');
    });
}

/**
 * Confirm deletion after user fills in reason
 * Validates the reason, performs the deletion, and shows the result
 * Closes the modal and refreshes the transaction list on success
 * 
 * @function
 * @param {string} transactionId - Transaction ID or noTransaksi
 * @returns {void}
 * 
 * @fires TransactionDeletionService#deleteTransaction
 */
function confirmDeletion(transactionId) {
    const reason = document.getElementById('deleteReason').value;
    
    // Validate reason
    const validationService = new TransactionValidationService();
    const reasonValidation = validationService.validateReason(reason);
    
    if (!reasonValidation.valid) {
        showAlert(reasonValidation.message, 'warning');
        return;
    }
    
    // Get current user
    const deletedBy = currentUser ? currentUser.name : 'Unknown';
    
    // Perform deletion
    const deletionService = new TransactionDeletionService();
    const result = deletionService.deleteTransaction(transactionId, reason, deletedBy);
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmationModal'));
    if (modal) {
        modal.hide();
    }
    
    // Remove modal from DOM
    const modalElement = document.getElementById('deleteConfirmationModal');
    if (modalElement) {
        modalElement.remove();
    }
    
    // Show result
    if (result.success) {
        showAlert(result.message, 'success');
        
        // Show warnings if any
        if (result.warnings && result.warnings.length > 0) {
            setTimeout(() => {
                result.warnings.forEach(warning => {
                    showAlert(warning, 'warning');
                });
            }, 500);
        }
        
        // Refresh transaction list
        loadAndRenderTransactions();
    } else {
        showAlert(result.message, 'danger');
    }
}

/**
 * Handle cancellation of deletion
 * Closes the confirmation dialog without making any changes to data
 * Ensures data integrity by not modifying any transaction data
 * 
 * @function
 * @returns {void}
 */
function handleCancelDeletion() {
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmationModal'));
    if (modal) {
        modal.hide();
    }
    
    // Remove modal from DOM after it's hidden
    setTimeout(() => {
        const modalElement = document.getElementById('deleteConfirmationModal');
        if (modalElement) {
            modalElement.remove();
        }
    }, 300);
    
    // No data changes - transaction data remains unchanged
}

// ===== Deletion History Page =====

/**
 * Render Riwayat Hapus Transaksi (Deletion History) page
 * Displays a list of all deleted transactions with audit information
 * Provides access to detailed deletion logs
 * 
 * @function
 * @returns {void}
 */
function renderRiwayatHapusTransaksi() {
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 style="color: #2d6a4f; font-weight: 700;">
                <i class="bi bi-clock-history me-2"></i>Riwayat Hapus Transaksi
            </h2>
            <button class="btn btn-secondary" onclick="renderHapusTransaksi()">
                <i class="bi bi-arrow-left me-1"></i>Kembali ke Hapus Transaksi
            </button>
        </div>
        
        <div class="card">
            <div class="card-header">
                <i class="bi bi-list-ul me-2"></i>Daftar Riwayat Penghapusan
            </div>
            <div class="card-body" id="deletionHistoryContainer">
                <!-- Deletion history table will be rendered here -->
            </div>
        </div>
    `;
    
    // Load and render deletion history
    loadAndRenderDeletionHistory();
}

/**
 * Load and render deletion history
 * Fetches all deletion logs from the audit logger service
 * and renders them in a table
 * 
 * @function
 * @returns {void}
 */
function loadAndRenderDeletionHistory() {
    const auditLoggerService = new AuditLoggerService();
    const deletionLogs = auditLoggerService.getDeletionHistory();
    
    renderDeletionHistoryTable(deletionLogs);
}

/**
 * Render deletion history table
 * Displays deletion logs in a sortable table with detail buttons
 * Shows empty state if no deletion history exists
 * 
 * @function
 * @param {Array<Object>} deletionLogs - Array of deletion log objects
 * @param {string} deletionLogs[].id - Log ID
 * @param {string} deletionLogs[].transactionNo - Original transaction number
 * @param {string} deletionLogs[].deletedAt - Deletion timestamp
 * @param {string} deletionLogs[].deletedBy - User who deleted the transaction
 * @param {string} deletionLogs[].reason - Deletion reason
 * @param {Object} deletionLogs[].transactionData - Complete original transaction data
 * @returns {void}
 */
function renderDeletionHistoryTable(deletionLogs) {
    const container = document.getElementById('deletionHistoryContainer');
    
    if (!deletionLogs || deletionLogs.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-inbox" style="font-size: 4rem; color: #ccc;"></i>
                <p class="text-muted mt-3 mb-0">Belum ada riwayat penghapusan transaksi</p>
            </div>
        `;
        return;
    }
    
    // Sort deletion logs by deletion date (newest first)
    const sortedLogs = [...deletionLogs].sort((a, b) => {
        return new Date(b.deletedAt) - new Date(a.deletedAt);
    });
    
    container.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>No Transaksi</th>
                        <th>Tanggal Transaksi</th>
                        <th>Tanggal Penghapusan</th>
                        <th>User</th>
                        <th>Alasan</th>
                        <th class="text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedLogs.map(log => `
                        <tr>
                            <td>
                                <strong>${log.transactionNo || log.transactionId}</strong>
                            </td>
                            <td>${formatTanggal(log.transactionData.tanggal)}</td>
                            <td>
                                <i class="bi bi-calendar-x me-1"></i>
                                ${formatTanggal(log.deletedAt)}
                            </td>
                            <td>
                                <i class="bi bi-person-circle me-1"></i>
                                ${log.deletedBy || '-'}
                            </td>
                            <td>
                                <div style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(log.reason)}">
                                    ${escapeHtml(log.reason)}
                                </div>
                            </td>
                            <td class="text-center">
                                <button 
                                    class="btn btn-sm btn-info" 
                                    onclick="showDeletionDetail('${log.id}')"
                                    title="Lihat Detail"
                                >
                                    <i class="bi bi-eye"></i> Detail
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div class="mt-3">
            <small class="text-muted">
                <i class="bi bi-info-circle me-1"></i>
                Menampilkan ${sortedLogs.length} riwayat penghapusan
            </small>
        </div>
    `;
}

/**
 * Show deletion detail modal
 * Displays complete information about a deleted transaction including:
 * - Deletion information (who, when, why)
 * - Stock restoration status
 * - Journal reversal status
 * - Complete original transaction data
 * - Any warnings that occurred during deletion
 * 
 * @function
 * @param {string} logId - Deletion log ID
 * @returns {void}
 */
function showDeletionDetail(logId) {
    // Get deletion log
    const deletionLogRepo = new DeletionLogRepository();
    const logs = deletionLogRepo.getAll();
    const log = logs.find(l => l.id === logId);
    
    if (!log) {
        showAlert('Log penghapusan tidak ditemukan', 'danger');
        return;
    }
    
    // Remove existing modal if any
    const existingModal = document.getElementById('deletionDetailModal');
    if (existingModal) existingModal.remove();
    
    const transaction = log.transactionData;
    const totalItems = transaction.items ? transaction.items.reduce((sum, item) => sum + item.qty, 0) : 0;
    
    const modalHTML = `
        <div class="modal fade" id="deletionDetailModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-info text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-file-text me-2"></i>Detail Riwayat Penghapusan
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <!-- Deletion Information -->
                        <div class="card mb-3">
                            <div class="card-header bg-light">
                                <h6 class="mb-0">
                                    <i class="bi bi-info-circle me-2"></i>Informasi Penghapusan
                                </h6>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <table class="table table-sm table-borderless">
                                            <tr>
                                                <td width="40%"><strong>Dihapus Oleh:</strong></td>
                                                <td>
                                                    <i class="bi bi-person-circle me-1"></i>
                                                    ${log.deletedBy || '-'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td><strong>Waktu Penghapusan:</strong></td>
                                                <td>
                                                    <i class="bi bi-calendar-x me-1"></i>
                                                    ${formatTanggal(log.deletedAt)}
                                                </td>
                                            </tr>
                                        </table>
                                    </div>
                                    <div class="col-md-6">
                                        <table class="table table-sm table-borderless">
                                            <tr>
                                                <td width="40%"><strong>Stok Dikembalikan:</strong></td>
                                                <td>
                                                    ${log.stockRestored 
                                                        ? '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Ya</span>' 
                                                        : '<span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i>Tidak</span>'
                                                    }
                                                </td>
                                            </tr>
                                            <tr>
                                                <td><strong>Jurnal Dibalik:</strong></td>
                                                <td>
                                                    ${log.journalReversed 
                                                        ? '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Ya</span>' 
                                                        : '<span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i>Tidak</span>'
                                                    }
                                                </td>
                                            </tr>
                                        </table>
                                    </div>
                                </div>
                                <div class="row mt-2">
                                    <div class="col-12">
                                        <strong>Alasan Penghapusan:</strong>
                                        <div class="alert alert-warning mt-2 mb-0">
                                            <i class="bi bi-pencil-square me-2"></i>
                                            ${escapeHtml(log.reason)}
                                        </div>
                                    </div>
                                </div>
                                ${log.warnings && log.warnings.length > 0 ? `
                                    <div class="row mt-3">
                                        <div class="col-12">
                                            <strong>Peringatan:</strong>
                                            <div class="alert alert-danger mt-2 mb-0">
                                                <i class="bi bi-exclamation-triangle me-2"></i>
                                                <ul class="mb-0">
                                                    ${log.warnings.map(w => `<li>${escapeHtml(w)}</li>`).join('')}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <!-- Transaction Data -->
                        <div class="card">
                            <div class="card-header bg-light">
                                <h6 class="mb-0">
                                    <i class="bi bi-receipt me-2"></i>Data Transaksi yang Dihapus
                                </h6>
                            </div>
                            <div class="card-body">
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <table class="table table-sm table-borderless">
                                            <tr>
                                                <td width="40%"><strong>No Transaksi:</strong></td>
                                                <td>${transaction.noTransaksi || transaction.id}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Tanggal:</strong></td>
                                                <td>${formatTanggal(transaction.tanggal)}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Kasir:</strong></td>
                                                <td>${transaction.kasir || '-'}</td>
                                            </tr>
                                        </table>
                                    </div>
                                    <div class="col-md-6">
                                        <table class="table table-sm table-borderless">
                                            <tr>
                                                <td width="40%"><strong>Tipe:</strong></td>
                                                <td>${transaction.tipeAnggota || 'Umum'}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Metode:</strong></td>
                                                <td>
                                                    ${transaction.metode === 'cash' 
                                                        ? '<span class="badge bg-success">Cash</span>' 
                                                        : '<span class="badge bg-warning">Kredit</span>'
                                                    }
                                                </td>
                                            </tr>
                                            <tr>
                                                <td><strong>Status:</strong></td>
                                                <td>
                                                    ${transaction.status === 'lunas' 
                                                        ? '<span class="badge bg-success">Lunas</span>' 
                                                        : '<span class="badge bg-warning">Kredit</span>'
                                                    }
                                                </td>
                                            </tr>
                                        </table>
                                    </div>
                                </div>
                                
                                <h6 class="mb-2"><i class="bi bi-cart me-2"></i>Item Transaksi (${totalItems} item)</h6>
                                <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                                    <table class="table table-sm table-bordered">
                                        <thead class="table-light">
                                            <tr>
                                                <th>Nama Barang</th>
                                                <th class="text-center">Qty</th>
                                                <th class="text-end">Harga</th>
                                                <th class="text-end">HPP</th>
                                                <th class="text-end">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${transaction.items && transaction.items.length > 0 
                                                ? transaction.items.map(item => `
                                                    <tr>
                                                        <td>${escapeHtml(item.nama)}</td>
                                                        <td class="text-center">${item.qty}</td>
                                                        <td class="text-end">${formatRupiah(item.harga)}</td>
                                                        <td class="text-end">${formatRupiah(item.hpp || 0)}</td>
                                                        <td class="text-end">${formatRupiah(item.harga * item.qty)}</td>
                                                    </tr>
                                                `).join('')
                                                : '<tr><td colspan="5" class="text-center text-muted">Tidak ada item</td></tr>'
                                            }
                                        </tbody>
                                        <tfoot class="table-light">
                                            <tr>
                                                <th colspan="4" class="text-end">Total:</th>
                                                <th class="text-end">${formatRupiah(transaction.total)}</th>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                                
                                ${transaction.metode === 'cash' ? `
                                    <div class="row mt-3">
                                        <div class="col-md-6 offset-md-6">
                                            <table class="table table-sm table-borderless">
                                                <tr>
                                                    <td><strong>Uang Bayar:</strong></td>
                                                    <td class="text-end">${formatRupiah(transaction.uangBayar || 0)}</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Kembalian:</strong></td>
                                                    <td class="text-end">${formatRupiah(transaction.kembalian || 0)}</td>
                                                </tr>
                                            </table>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-1"></i>Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('deletionDetailModal'));
    modal.show();
    
    // Clean up modal after it's hidden
    document.getElementById('deletionDetailModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

/**
 * Escape HTML to prevent XSS attacks
 * Converts special characters to HTML entities
 * 
 * @function
 * @param {string} text - Text to escape
 * @returns {string} Escaped text safe for HTML insertion
 * 
 * @example
 * escapeHtml('<script>alert("XSS")</script>')
 * // Returns: '&lt;script&gt;alert("XSS")&lt;/script&gt;'
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
