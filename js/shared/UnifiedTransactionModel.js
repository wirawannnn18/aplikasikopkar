/**
 * Unified Transaction Model
 * Requirements: 4.2, 4.5 - Create unified transaction model
 * 
 * Provides a unified transaction structure for both manual and import payment modes
 * with enhanced fields for mode tracking and batch processing.
 */

/**
 * Unified Transaction Model Class
 * Defines the structure and validation for payment transactions
 */
class UnifiedTransactionModel {
    constructor() {
        this.version = '2.0';
        this.supportedModes = ['manual', 'import'];
        this.supportedJenis = ['hutang', 'piutang'];
        this.supportedStatus = ['pending', 'selesai', 'gagal', 'dibatalkan'];
    }

    /**
     * Create a new transaction record with unified structure
     * Requirements: 4.2, 4.5
     * @param {Object} transactionData - Base transaction data
     * @param {string} mode - Payment mode ('manual' or 'import')
     * @param {string} batchId - Batch ID for import transactions (optional)
     * @returns {Object} Unified transaction record
     */
    createTransaction(transactionData, mode = 'manual', batchId = null) {
        const timestamp = new Date().toISOString();
        const currentUser = this._getCurrentUser();
        
        // Validate required fields
        this._validateTransactionData(transactionData, mode);
        
        const unifiedTransaction = {
            // Core transaction fields
            id: this._generateId(),
            tanggal: timestamp.split('T')[0],
            
            // Member information
            anggotaId: transactionData.anggotaId,
            anggotaNama: transactionData.anggotaNama,
            anggotaNIK: transactionData.anggotaNIK,
            
            // Payment details
            jenis: transactionData.jenis, // 'hutang' or 'piutang'
            jumlah: parseFloat(transactionData.jumlah),
            
            // Balance tracking
            saldoSebelum: parseFloat(transactionData.saldoSebelum || 0),
            saldoSesudah: parseFloat(transactionData.saldoSesudah || 0),
            
            // Additional information
            keterangan: transactionData.keterangan || '',
            
            // User tracking
            kasirId: currentUser?.id || '',
            kasirNama: currentUser?.nama || '',
            
            // System fields
            jurnalId: transactionData.jurnalId || '',
            status: transactionData.status || 'selesai',
            
            // NEW UNIFIED FIELDS
            mode: mode, // 'manual' or 'import'
            batchId: batchId, // For import transactions
            
            // Enhanced tracking fields
            processingInfo: {
                processedAt: timestamp,
                processedBy: currentUser?.id || 'unknown',
                processingMode: mode,
                validationPassed: true,
                retryCount: 0
            },
            
            // Audit trail
            auditTrail: {
                createdAt: timestamp,
                createdBy: currentUser?.id || 'unknown',
                updatedAt: timestamp,
                updatedBy: currentUser?.id || 'unknown',
                version: this.version
            },
            
            // Backward compatibility fields
            createdAt: timestamp,
            updatedAt: timestamp
        };
        
        // Add mode-specific fields
        if (mode === 'import') {
            unifiedTransaction.importInfo = {
                batchId: batchId,
                importedAt: timestamp,
                originalRowIndex: transactionData.originalRowIndex || null,
                validationErrors: transactionData.validationErrors || [],
                importSource: transactionData.importSource || 'csv'
            };
        } else if (mode === 'manual') {
            unifiedTransaction.manualInfo = {
                enteredAt: timestamp,
                enteredBy: currentUser?.id || 'unknown',
                inputMethod: 'form',
                sessionId: this._getSessionId()
            };
        }
        
        return unifiedTransaction;
    }

    /**
     * Update existing transaction to unified model
     * Requirements: 4.2, 4.5
     * @param {Object} existingTransaction - Existing transaction
     * @returns {Object} Updated unified transaction
     */
    upgradeToUnifiedModel(existingTransaction) {
        // Check if already unified
        if (existingTransaction.mode && existingTransaction.auditTrail) {
            return existingTransaction;
        }
        
        const timestamp = new Date().toISOString();
        const currentUser = this._getCurrentUser();
        
        const upgradedTransaction = {
            ...existingTransaction,
            
            // Add missing unified fields
            mode: existingTransaction.mode || 'manual', // Default to manual for existing
            batchId: existingTransaction.batchId || null,
            
            // Enhanced tracking fields
            processingInfo: existingTransaction.processingInfo || {
                processedAt: existingTransaction.createdAt || timestamp,
                processedBy: existingTransaction.kasirId || 'unknown',
                processingMode: existingTransaction.mode || 'manual',
                validationPassed: true,
                retryCount: 0,
                upgraded: true
            },
            
            // Audit trail
            auditTrail: existingTransaction.auditTrail || {
                createdAt: existingTransaction.createdAt || timestamp,
                createdBy: existingTransaction.kasirId || 'unknown',
                updatedAt: timestamp,
                updatedBy: currentUser?.id || 'system',
                version: this.version,
                upgraded: true,
                upgradedAt: timestamp
            }
        };
        
        // Add mode-specific info if missing
        if (upgradedTransaction.mode === 'manual' && !upgradedTransaction.manualInfo) {
            upgradedTransaction.manualInfo = {
                enteredAt: existingTransaction.createdAt || timestamp,
                enteredBy: existingTransaction.kasirId || 'unknown',
                inputMethod: 'form',
                sessionId: 'legacy'
            };
        }
        
        return upgradedTransaction;
    }

    /**
     * Validate transaction data
     * Requirements: 4.2, 4.5
     * @param {Object} transactionData - Transaction data to validate
     * @param {string} mode - Payment mode
     * @throws {Error} If validation fails
     */
    _validateTransactionData(transactionData, mode) {
        const errors = [];
        
        // Required fields validation
        if (!transactionData.anggotaId) {
            errors.push('anggotaId is required');
        }
        
        if (!transactionData.anggotaNama) {
            errors.push('anggotaNama is required');
        }
        
        if (!transactionData.jenis || !this.supportedJenis.includes(transactionData.jenis)) {
            errors.push(`jenis must be one of: ${this.supportedJenis.join(', ')}`);
        }
        
        if (!transactionData.jumlah || isNaN(parseFloat(transactionData.jumlah)) || parseFloat(transactionData.jumlah) <= 0) {
            errors.push('jumlah must be a positive number');
        }
        
        // Mode validation
        if (!this.supportedModes.includes(mode)) {
            errors.push(`mode must be one of: ${this.supportedModes.join(', ')}`);
        }
        
        // Status validation if provided
        if (transactionData.status && !this.supportedStatus.includes(transactionData.status)) {
            errors.push(`status must be one of: ${this.supportedStatus.join(', ')}`);
        }
        
        if (errors.length > 0) {
            throw new Error(`Transaction validation failed: ${errors.join(', ')}`);
        }
    }

    /**
     * Get all transactions with unified model
     * Requirements: 4.1, 4.2
     * @param {boolean} upgradeExisting - Whether to upgrade existing transactions
     * @returns {Array} Array of unified transactions
     */
    getAllTransactions(upgradeExisting = true) {
        try {
            const transactions = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
            
            if (upgradeExisting) {
                return transactions.map(transaction => this.upgradeToUnifiedModel(transaction));
            }
            
            return transactions;
        } catch (error) {
            console.error('Error getting transactions:', error);
            return [];
        }
    }

    /**
     * Save transaction with unified model
     * Requirements: 4.2, 4.5
     * @param {Object} transaction - Unified transaction to save
     */
    saveTransaction(transaction) {
        try {
            const transactions = this.getAllTransactions(true);
            
            // Check if transaction already exists
            const existingIndex = transactions.findIndex(t => t.id === transaction.id);
            
            if (existingIndex >= 0) {
                // Update existing transaction
                transaction.auditTrail.updatedAt = new Date().toISOString();
                transaction.auditTrail.updatedBy = this._getCurrentUser()?.id || 'unknown';
                transaction.updatedAt = new Date().toISOString();
                transactions[existingIndex] = transaction;
            } else {
                // Add new transaction
                transactions.push(transaction);
            }
            
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(transactions));
        } catch (error) {
            console.error('Error saving transaction:', error);
            throw error;
        }
    }

    /**
     * Get transactions by mode
     * Requirements: 4.1, 4.2
     * @param {string} mode - Payment mode ('manual' or 'import')
     * @returns {Array} Filtered transactions
     */
    getTransactionsByMode(mode) {
        const transactions = this.getAllTransactions(true);
        return transactions.filter(transaction => transaction.mode === mode);
    }

    /**
     * Get transactions by batch ID
     * Requirements: 4.2, 4.5
     * @param {string} batchId - Batch ID
     * @returns {Array} Transactions in the batch
     */
    getTransactionsByBatch(batchId) {
        const transactions = this.getAllTransactions(true);
        return transactions.filter(transaction => transaction.batchId === batchId);
    }

    /**
     * Get transaction statistics by mode
     * Requirements: 4.1, 4.2
     * @returns {Object} Statistics breakdown by mode
     */
    getTransactionStatistics() {
        const transactions = this.getAllTransactions(true);
        
        const stats = {
            total: transactions.length,
            byMode: {
                manual: 0,
                import: 0,
                unknown: 0
            },
            byJenis: {
                hutang: 0,
                piutang: 0
            },
            byStatus: {
                selesai: 0,
                pending: 0,
                gagal: 0,
                dibatalkan: 0
            },
            totalAmount: {
                hutang: 0,
                piutang: 0
            }
        };
        
        transactions.forEach(transaction => {
            // Count by mode
            const mode = transaction.mode || 'unknown';
            if (stats.byMode[mode] !== undefined) {
                stats.byMode[mode]++;
            } else {
                stats.byMode.unknown++;
            }
            
            // Count by jenis
            if (stats.byJenis[transaction.jenis] !== undefined) {
                stats.byJenis[transaction.jenis]++;
            }
            
            // Count by status
            const status = transaction.status || 'selesai';
            if (stats.byStatus[status] !== undefined) {
                stats.byStatus[status]++;
            }
            
            // Sum amounts
            if (stats.totalAmount[transaction.jenis] !== undefined) {
                stats.totalAmount[transaction.jenis] += parseFloat(transaction.jumlah || 0);
            }
        });
        
        return stats;
    }

    /**
     * Migrate all existing transactions to unified model
     * Requirements: 4.2, 4.5
     * @returns {Object} Migration result
     */
    migrateAllTransactions() {
        try {
            const originalTransactions = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
            const migratedTransactions = [];
            let migrationCount = 0;
            
            originalTransactions.forEach(transaction => {
                const upgraded = this.upgradeToUnifiedModel(transaction);
                migratedTransactions.push(upgraded);
                
                // Count if actually upgraded
                if (upgraded.auditTrail?.upgraded) {
                    migrationCount++;
                }
            });
            
            // Save migrated transactions
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(migratedTransactions));
            
            // Save migration log
            const migrationLog = {
                migratedAt: new Date().toISOString(),
                totalTransactions: originalTransactions.length,
                migratedCount: migrationCount,
                version: this.version
            };
            
            localStorage.setItem('transactionMigrationLog', JSON.stringify(migrationLog));
            
            return {
                success: true,
                totalTransactions: originalTransactions.length,
                migratedCount: migrationCount,
                message: `Successfully migrated ${migrationCount} transactions to unified model`
            };
            
        } catch (error) {
            console.error('Error migrating transactions:', error);
            return {
                success: false,
                error: error.message,
                message: 'Failed to migrate transactions'
            };
        }
    }

    // ===== PRIVATE HELPER METHODS =====

    /**
     * Get current user context
     * @private
     */
    _getCurrentUser() {
        if (typeof localStorage !== 'undefined') {
            try {
                const currentUser = localStorage.getItem('currentUser');
                if (currentUser) {
                    return JSON.parse(currentUser);
                }
            } catch (error) {
                console.warn('Failed to get current user:', error);
            }
        }
        return null;
    }

    /**
     * Generate unique ID
     * @private
     */
    _generateId() {
        if (typeof window !== 'undefined' && typeof window.generateId === 'function') {
            return window.generateId();
        }
        
        return `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    /**
     * Get session ID
     * @private
     */
    _getSessionId() {
        if (typeof window !== 'undefined' && window._sessionId) {
            return window._sessionId;
        }
        
        return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }
}

/**
 * Transaction creation helper functions
 * Requirements: 4.2, 4.5
 */

/**
 * Create manual payment transaction
 * @param {Object} paymentData - Payment data
 * @returns {Object} Unified transaction
 */
function createManualTransaction(paymentData) {
    const model = new UnifiedTransactionModel();
    return model.createTransaction(paymentData, 'manual');
}

/**
 * Create import batch transaction
 * @param {Object} paymentData - Payment data
 * @param {string} batchId - Batch ID
 * @returns {Object} Unified transaction
 */
function createImportTransaction(paymentData, batchId) {
    const model = new UnifiedTransactionModel();
    return model.createTransaction(paymentData, 'import', batchId);
}

/**
 * Update all transaction creation functions to use unified model
 * Requirements: 4.2, 4.5
 */
function updateTransactionCreationFunctions() {
    // Store original savePembayaran function if it exists
    if (typeof window.savePembayaran === 'function' && !window._originalSavePembayaran) {
        window._originalSavePembayaran = window.savePembayaran;
    }
    
    // Replace with unified version
    window.savePembayaran = function(paymentData, mode = 'manual', batchId = null) {
        const model = new UnifiedTransactionModel();
        const unifiedTransaction = model.createTransaction(paymentData, mode, batchId);
        model.saveTransaction(unifiedTransaction);
        return unifiedTransaction;
    };
    
    // Add helper functions
    window.createManualTransaction = createManualTransaction;
    window.createImportTransaction = createImportTransaction;
}

// Initialize unified transaction model
if (typeof window !== 'undefined') {
    // Export classes and functions
    window.UnifiedTransactionModel = UnifiedTransactionModel;
    window.createManualTransaction = createManualTransaction;
    window.createImportTransaction = createImportTransaction;
    
    // Update existing functions
    updateTransactionCreationFunctions();
    
    // Create global model instance
    window._unifiedTransactionModel = new UnifiedTransactionModel();
    
    // Auto-migrate on first load if needed
    const migrationLog = localStorage.getItem('transactionMigrationLog');
    if (!migrationLog) {
        console.log('Auto-migrating transactions to unified model...');
        const result = window._unifiedTransactionModel.migrateAllTransactions();
        console.log('Migration result:', result);
    }
}

// Browser compatibility - exports handled via window object

// CommonJS export for compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UnifiedTransactionModel, createManualTransaction, createImportTransaction };
}