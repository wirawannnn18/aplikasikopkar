/**
 * Shared Payment Services
 * Requirements: 6.1, 6.2, 6.3 - Shared services layer for integration
 * 
 * Provides common functionality for both manual and import payment processing
 * including journal recording, saldo calculation, validation, and audit logging.
 */

/**
 * Shared Payment Services Class
 * Provides common functionality for both manual and import payment modes
 */
class SharedPaymentServices {
    constructor() {
        this.currentUser = this._initializeUserContext();
        this.auditLogger = this._initializeAuditLogger();
        this._sessionId = null;
        
        // Initialize enhanced error handling and validation
        this.errorHandler = null;
        this.consistencyValidator = null;
        this._initializeEnhancedComponents();
        
        // Initialize data query optimizer for performance
        this.dataQueryOptimizer = null;
        this._initializeDataQueryOptimizer();
    }

    /**
     * Set audit logger instance
     * @param {Object} auditLogger - Audit logger instance
     */
    setAuditLogger(auditLogger) {
        this.auditLogger = auditLogger;
    }

    /**
     * Initialize enhanced error handling and validation components
     * Requirements: 6.4, 6.5 - Enhanced error handling and data consistency
     * @private
     */
    _initializeEnhancedComponents() {
        try {
            // Initialize CrossModeErrorHandler if available
            if (typeof window !== 'undefined' && window.CrossModeErrorHandler) {
                this.errorHandler = new window.CrossModeErrorHandler(this);
            }
            
            // Initialize DataConsistencyValidator if available
            if (typeof window !== 'undefined' && window.DataConsistencyValidator) {
                this.consistencyValidator = new window.DataConsistencyValidator(this);
            }
            
            console.log('Enhanced components initialized:', {
                errorHandler: !!this.errorHandler,
                consistencyValidator: !!this.consistencyValidator
            });
        } catch (error) {
            console.warn('Failed to initialize enhanced components:', error);
        }
    }

    /**
     * Initialize data query optimizer for performance
     * Requirements: 4.1, 5.1 - Efficient database queries and caching
     * @private
     */
    _initializeDataQueryOptimizer() {
        try {
            // Initialize DataQueryOptimizer if available
            if (typeof window !== 'undefined' && window.DataQueryOptimizer) {
                this.dataQueryOptimizer = new window.DataQueryOptimizer(this);
                console.log('DataQueryOptimizer initialized in SharedPaymentServices');
            } else {
                console.warn('DataQueryOptimizer not available');
            }
        } catch (error) {
            console.warn('Failed to initialize DataQueryOptimizer:', error);
        }
    }

    /**
     * Get error handler instance
     * Requirements: 6.4 - Cross-mode error handling
     * @returns {CrossModeErrorHandler|null} Error handler instance
     */
    getErrorHandler() {
        return this.errorHandler;
    }

    /**
     * Get consistency validator instance
     * Requirements: 6.1, 6.2, 6.3 - Data consistency validation
     * @returns {DataConsistencyValidator|null} Consistency validator instance
     */
    getConsistencyValidator() {
        return this.consistencyValidator;
    }

    /**
     * Validate system consistency
     * Requirements: 6.1, 6.2, 6.3 - Comprehensive consistency validation
     * @param {Object} options - Validation options
     * @returns {Object} Validation result
     */
    validateSystemConsistency(options = {}) {
        if (!this.consistencyValidator) {
            return {
                valid: false,
                message: 'Consistency validator not available',
                errors: ['DataConsistencyValidator not initialized']
            };
        }
        
        try {
            return this.consistencyValidator.validateCrossModeConsistency();
        } catch (error) {
            console.error('System consistency validation failed:', error);
            return {
                valid: false,
                message: `Validation failed: ${error.message}`,
                errors: [error.message]
            };
        }
    }

    /**
     * Handle error with cross-mode awareness
     * Requirements: 6.4, 6.5 - Enhanced error handling
     * @param {Error} error - Error to handle
     * @param {Object} context - Error context
     * @returns {Object} Error handling result
     */
    handleError(error, context = {}) {
        if (!this.errorHandler) {
            // Fallback error handling
            console.error('Error occurred (no error handler):', error);
            this.logAudit('ERROR_FALLBACK', {
                error: error.message,
                context
            });
            
            return {
                success: false,
                error: error,
                message: error.message,
                requiresManualIntervention: true
            };
        }
        
        try {
            return this.errorHandler.handleError(error, context);
        } catch (handlingError) {
            console.error('Error handler failed:', handlingError);
            return {
                success: false,
                error: error,
                handlingError: handlingError,
                message: 'Critical error in error handling',
                requiresManualIntervention: true
            };
        }
    }

    /**
     * Perform cross-mode rollback
     * Requirements: 6.4, 6.5 - Rollback across modes
     * @param {string} transactionId - Transaction ID to rollback
     * @param {Object} options - Rollback options
     * @returns {Promise<Object>} Rollback result
     */
    async performRollback(transactionId, options = {}) {
        if (!this.errorHandler) {
            return {
                success: false,
                message: 'Error handler not available for rollback',
                requiresManualIntervention: true
            };
        }
        
        try {
            return await this.errorHandler.performCrossModeRollback(transactionId, options);
        } catch (error) {
            console.error('Rollback failed:', error);
            return {
                success: false,
                message: `Rollback failed: ${error.message}`,
                error: error,
                requiresManualIntervention: true
            };
        }
    }

    // ===== JOURNAL RECORDING FUNCTIONS =====

    /**
     * Create journal entry for payment (unified for both modes)
     * Requirements: 6.1 - Shared journal recording functions
     * @param {Object} transactionData - Transaction data
     * @param {string} mode - Payment mode ('manual' or 'import')
     * @returns {string} Journal entry ID
     */
    createJurnalEntry(transactionData, mode = 'manual') {
        try {
            const { jenis, jumlah, anggotaNama, tanggal } = transactionData;
            
            let keterangan, entries;
            
            if (jenis === 'hutang') {
                keterangan = mode === 'import' 
                    ? `Pembayaran Hutang - ${anggotaNama} (Import Batch)`
                    : `Pembayaran Hutang - ${anggotaNama}`;
                entries = [
                    { akun: '1-1000', debit: jumlah, kredit: 0 },  // Kas bertambah
                    { akun: '2-1000', debit: 0, kredit: jumlah }   // Hutang berkurang
                ];
            } else if (jenis === 'piutang') {
                keterangan = mode === 'import' 
                    ? `Pembayaran Piutang - ${anggotaNama} (Import Batch)`
                    : `Pembayaran Piutang - ${anggotaNama}`;
                entries = [
                    { akun: '1-1200', debit: jumlah, kredit: 0 },  // Piutang berkurang
                    { akun: '1-1000', debit: 0, kredit: jumlah }   // Kas berkurang
                ];
            } else {
                throw new Error(`Invalid payment type: ${jenis}`);
            }
            
            // Use existing addJurnal function if available
            if (typeof window.addJurnal === 'function') {
                const jurnalId = window.addJurnal(keterangan, entries, tanggal);
                
                // Log journal creation
                this.logAudit('JOURNAL_CREATED', {
                    jurnalId,
                    transactionId: transactionData.id,
                    mode,
                    jenis,
                    jumlah,
                    anggotaNama
                });
                
                return jurnalId;
            } else {
                // Fallback journal creation
                return this._createJurnalFallback(keterangan, entries, tanggal, mode);
            }
            
        } catch (error) {
            console.error('Failed to create journal entry:', error);
            this.logAudit('JOURNAL_ERROR', {
                error: error.message,
                transactionData,
                mode
            });
            throw error;
        }
    }

    /**
     * Create journal entry for hutang payment
     * Requirements: 6.1 - Shared journal recording functions
     * @param {Object} transactionData - Transaction data
     * @param {string} mode - Payment mode ('manual' or 'import')
     * @returns {string} Journal ID
     */
    createJurnalPembayaranHutang(transactionData, mode = 'manual') {
        try {
            const keterangan = mode === 'import' 
                ? `Pembayaran Hutang - ${transactionData.anggotaNama} (Import Batch)`
                : `Pembayaran Hutang - ${transactionData.anggotaNama}`;
            
            const entries = [
                { akun: '1-1000', debit: transactionData.jumlah, kredit: 0 },  // Kas bertambah
                { akun: '2-1000', debit: 0, kredit: transactionData.jumlah }   // Hutang berkurang
            ];
            
            const jurnalId = this._addJurnal(keterangan, entries, transactionData.tanggal);
            
            // Log journal creation with mode tracking
            this.logAudit('JOURNAL_HUTANG_CREATED', {
                jurnalId: jurnalId,
                transactionId: transactionData.id,
                mode,
                jumlah: transactionData.jumlah,
                anggotaNama: transactionData.anggotaNama
            });
            
            return jurnalId;
        } catch (error) {
            console.error('Failed to create hutang journal:', error);
            throw error;
        }
    }

    /**
     * Create journal entry for piutang payment
     * Requirements: 6.1 - Shared journal recording functions
     * @param {Object} transactionData - Transaction data
     * @param {string} mode - Payment mode ('manual' or 'import')
     * @returns {string} Journal entry ID
     */
    createJurnalPembayaranPiutang(transactionData, mode = 'manual') {
        try {
            const keterangan = mode === 'import' 
                ? `Pembayaran Piutang - ${transactionData.anggotaNama} (Import Batch)`
                : `Pembayaran Piutang - ${transactionData.anggotaNama}`;
            
            const entries = [
                { akun: '1-1200', debit: transactionData.jumlah, kredit: 0 },  // Piutang berkurang
                { akun: '1-1000', debit: 0, kredit: transactionData.jumlah }   // Kas berkurang
            ];
            
            const jurnalId = this._addJurnal(keterangan, entries, transactionData.tanggal);
            
            // Log journal creation with mode tracking
            this.logAudit('JOURNAL_PIUTANG_CREATED', {
                jurnalId: jurnalId,
                transactionId: transactionData.id,
                mode,
                jumlah: transactionData.jumlah,
                anggotaNama: transactionData.anggotaNama
            });
            
            return jurnalId;
        } catch (error) {
            console.error('Failed to create piutang journal:', error);
            throw error;
        }
    }

    // ===== SALDO CALCULATION FUNCTIONS =====

    /**
     * Calculate hutang saldo for anggota
     * Requirements: 6.2 - Shared saldo calculation functions
     * @param {string} anggotaId - Anggota ID
     * @returns {number} Current hutang balance
     */
    hitungSaldoHutang(anggotaId) {
        try {
            // Use existing function if available
            if (typeof window.hitungSaldoHutang === 'function') {
                return window.hitungSaldoHutang(anggotaId);
            }
            
            // Fallback calculation
            return this._calculateSaldoHutangFallback(anggotaId);
        } catch (error) {
            console.error('Error calculating hutang saldo:', error);
            return 0;
        }
    }

    /**
     * Calculate piutang saldo for anggota
     * Requirements: 6.2 - Shared saldo calculation functions
     * @param {string} anggotaId - Anggota ID
     * @returns {number} Current piutang balance
     */
    hitungSaldoPiutang(anggotaId) {
        try {
            // Use existing function if available
            if (typeof window.hitungSaldoPiutang === 'function') {
                return window.hitungSaldoPiutang(anggotaId);
            }
            
            // Fallback calculation
            return this._calculateSaldoPiutangFallback(anggotaId);
        } catch (error) {
            console.error('Error calculating piutang saldo:', error);
            return 0;
        }
    }

    /**
     * Update saldo hutang for anggota
     * Requirements: 6.1, 6.2
     * @param {string} anggotaId - Anggota ID
     * @param {number} amount - Amount to subtract from hutang
     * @param {string} mode - Payment mode
     * @returns {Object} Updated saldo information
     */
    updateSaldoHutang(anggotaId, amount, mode = 'manual') {
        try {
            const saldoSebelum = this.hitungSaldoHutang(anggotaId);
            const saldoSesudah = saldoSebelum - amount;
            
            // Validate saldo
            if (saldoSebelum < amount) {
                throw new Error(`Insufficient hutang balance. Available: ${saldoSebelum}, Required: ${amount}`);
            }
            
            // Log saldo update
            this.logAudit('SALDO_HUTANG_UPDATED', {
                anggotaId,
                amount,
                saldoSebelum,
                saldoSesudah,
                mode
            });
            
            return {
                saldoSebelum,
                saldoSesudah,
                updated: true
            };
            
        } catch (error) {
            console.error('Failed to update saldo hutang:', error);
            this.logAudit('SALDO_UPDATE_ERROR', {
                anggotaId,
                amount,
                mode,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Update saldo piutang for anggota
     * Requirements: 6.1, 6.2
     * @param {string} anggotaId - Anggota ID
     * @param {number} amount - Amount to subtract from piutang
     * @param {string} mode - Payment mode
     * @returns {Object} Updated saldo information
     */
    updateSaldoPiutang(anggotaId, amount, mode = 'manual') {
        try {
            const saldoSebelum = this.hitungSaldoPiutang(anggotaId);
            const saldoSesudah = saldoSebelum - amount;
            
            // Validate saldo
            if (saldoSebelum < amount) {
                throw new Error(`Insufficient piutang balance. Available: ${saldoSebelum}, Required: ${amount}`);
            }
            
            // Log saldo update
            this.logAudit('SALDO_PIUTANG_UPDATED', {
                anggotaId,
                amount,
                saldoSebelum,
                saldoSesudah,
                mode
            });
            
            return {
                saldoSebelum,
                saldoSesudah,
                updated: true
            };
            
        } catch (error) {
            console.error('Failed to update saldo piutang:', error);
            this.logAudit('SALDO_UPDATE_ERROR', {
                anggotaId,
                amount,
                mode,
                error: error.message
            });
            throw error;
        }
    }

    // ===== VALIDATION FUNCTIONS =====

    /**
     * Validate payment amount against saldo
     * Requirements: 6.2, 6.4
     * @param {number} amount - Payment amount
     * @param {number} saldo - Available saldo
     * @param {string} jenis - Payment type ('hutang' or 'piutang')
     * @param {string} mode - Payment mode
     * @returns {Object} Validation result
     */
    validatePaymentAmount(amount, saldo, jenis, mode = 'manual') {
        try {
            const validation = {
                valid: true,
                errors: [],
                warnings: []
            };
            
            // Basic amount validation
            if (!amount || amount <= 0) {
                validation.valid = false;
                validation.errors.push('Jumlah pembayaran harus lebih dari 0');
            }
            
            if (amount < 0) {
                validation.valid = false;
                validation.errors.push('Jumlah pembayaran tidak boleh negatif');
            }
            
            // Saldo validation
            if (saldo === 0) {
                validation.valid = false;
                validation.errors.push(`Tidak ada saldo ${jenis} yang perlu dibayar`);
            } else if (amount > saldo) {
                validation.valid = false;
                validation.errors.push(`Jumlah pembayaran melebihi saldo ${jenis} (${this._formatRupiah(saldo)})`);
            } else if (amount === saldo) {
                validation.warnings.push(`Pembayaran ini akan melunasi seluruh ${jenis}`);
            }
            
            // Mode-specific validation
            if (mode === 'import') {
                // Additional validation for import mode
                if (amount > 10000000) { // 10 million limit for import
                    validation.warnings.push('Jumlah pembayaran sangat besar, pastikan sudah benar');
                }
            }
            
            // Log validation
            this.logAudit('PAYMENT_VALIDATION', {
                amount,
                saldo,
                jenis,
                mode,
                valid: validation.valid,
                errorCount: validation.errors.length,
                warningCount: validation.warnings.length
            });
            
            return validation;
            
        } catch (error) {
            console.error('Failed to validate payment amount:', error);
            return {
                valid: false,
                errors: ['Terjadi kesalahan saat validasi'],
                warnings: []
            };
        }
    }

    /**
     * Validate payment data
     * Requirements: 6.2 - Shared validation functions
     * @param {Object} paymentData - Payment data to validate
     * @param {string} mode - Payment mode
     * @returns {Object} Validation result
     */
    validatePaymentData(paymentData, mode = 'manual') {
        try {
            const validation = {
                valid: true,
                errors: [],
                warnings: []
            };
            
            // Required field validation
            if (!paymentData.anggotaId) {
                validation.valid = false;
                validation.errors.push('ID Anggota tidak boleh kosong');
            }
            
            if (!paymentData.jenis || !['hutang', 'piutang'].includes(paymentData.jenis)) {
                validation.valid = false;
                validation.errors.push('Jenis pembayaran tidak valid');
            }
            
            if (!paymentData.jumlah || paymentData.jumlah <= 0) {
                validation.valid = false;
                validation.errors.push('Jumlah pembayaran harus lebih dari 0');
            }
            
            // Saldo validation if anggota and jenis are valid
            if (paymentData.anggotaId && paymentData.jenis) {
                const saldo = paymentData.jenis === 'hutang' 
                    ? this.hitungSaldoHutang(paymentData.anggotaId)
                    : this.hitungSaldoPiutang(paymentData.anggotaId);
                
                const amountValidation = this.validatePaymentAmount(
                    paymentData.jumlah, 
                    saldo, 
                    paymentData.jenis, 
                    mode
                );
                
                validation.valid = validation.valid && amountValidation.valid;
                validation.errors = validation.errors.concat(amountValidation.errors);
                validation.warnings = validation.warnings.concat(amountValidation.warnings);
            }
            
            return validation;
            
        } catch (error) {
            console.error('Failed to validate payment data:', error);
            return {
                valid: false,
                errors: ['Terjadi kesalahan saat validasi data'],
                warnings: []
            };
        }
    }

    // ===== AUDIT LOGGING FUNCTIONS =====

    /**
     * Enhanced audit logging with mode tracking
     * Requirements: 6.3, 8.3
     * @param {string} action - Action type
     * @param {Object} details - Action details
     */
    logAudit(action, details) {
        try {
            const auditEntry = {
                id: this._generateId(),
                timestamp: new Date().toISOString(),
                userId: this.currentUser?.id || 'unknown',
                userName: this.currentUser?.nama || 'Unknown User',
                action: action,
                details: {
                    ...details,
                    sessionId: this._getSessionId(),
                    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
                },
                module: 'shared-payment-services'
            };
            
            // Use existing audit logging if available
            if (typeof window.saveAuditLog === 'function') {
                window.saveAuditLog(action, auditEntry.details);
            } else {
                // Fallback audit logging
                this._saveAuditLogFallback(auditEntry);
            }
            
        } catch (error) {
            console.error('Failed to log audit entry:', error);
        }
    }

    // ===== UNIFIED TRANSACTION MANAGEMENT =====

    /**
     * Get unified transaction history with enhanced filtering and performance optimization
     * Requirements: 4.1, 4.2, 4.4
     * @param {Object} filters - Filter options
     * @param {Object} options - Query options (pagination, sorting, etc.)
     * @returns {Array|Object} Transaction history with mode information
     */
    getTransactionHistory(filters = {}, options = {}) {
        try {
            // Get all transaction sources
            const allTransactions = this._getAllTransactionSources();
            
            // Apply filters efficiently
            const filteredTransactions = this._applyUnifiedFilters(allTransactions, filters);
            
            // Apply sorting if specified
            const sortedTransactions = options.sort ? 
                this._applySorting(filteredTransactions, options.sort) : 
                filteredTransactions;
            
            // Apply pagination if specified
            if (options.pagination) {
                return this._applyPagination(sortedTransactions, options.pagination);
            }
            
            return sortedTransactions;
            
        } catch (error) {
            console.error('Failed to get transaction history:', error);
            return options.pagination ? { data: [], total: 0, page: 1, pageSize: 10 } : [];
        }
    }

    /**
     * Get all transaction sources and combine them
     * Requirements: 4.1, 4.4 - Combine manual and import transactions
     * @private
     * @returns {Array} Combined transactions from all sources
     */
    _getAllTransactionSources() {
        const sources = [];
        
        try {
            // Get manual payment transactions
            const manualTransactions = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
            sources.push(...manualTransactions.map(t => ({
                ...t,
                mode: t.mode || 'manual',
                batchId: t.batchId || null,
                source: 'manual'
            })));
            
            // Get import batch transactions (if they exist in separate storage)
            const importTransactions = JSON.parse(localStorage.getItem('importBatchTransactions') || '[]');
            sources.push(...importTransactions.map(t => ({
                ...t,
                mode: 'import',
                source: 'import'
            })));
            
            // Get any other transaction sources that might exist
            const otherSources = this._getAdditionalTransactionSources();
            sources.push(...otherSources);
            
        } catch (error) {
            console.error('Error combining transaction sources:', error);
        }
        
        return sources;
    }

    /**
     * Get additional transaction sources (extensible for future sources)
     * @private
     * @returns {Array} Additional transactions
     */
    _getAdditionalTransactionSources() {
        const additional = [];
        
        try {
            // Check for any additional transaction storage keys
            const additionalKeys = [
                'batchPaymentHistory',
                'automatedPayments',
                'scheduledPayments'
            ];
            
            additionalKeys.forEach(key => {
                const data = localStorage.getItem(key);
                if (data) {
                    const transactions = JSON.parse(data);
                    if (Array.isArray(transactions)) {
                        additional.push(...transactions.map(t => ({
                            ...t,
                            mode: t.mode || 'automated',
                            source: key
                        })));
                    }
                }
            });
            
        } catch (error) {
            console.error('Error getting additional transaction sources:', error);
        }
        
        return additional;
    }

    /**
     * Apply unified filters efficiently
     * Requirements: 4.2, 4.4 - Enhanced filtering with performance optimization
     * @private
     * @param {Array} transactions - All transactions
     * @param {Object} filters - Filter criteria
     * @returns {Array} Filtered transactions
     */
    _applyUnifiedFilters(transactions, filters) {
        let filtered = transactions;
        
        // Mode filter (most selective, apply first for performance)
        if (filters.mode) {
            filtered = filtered.filter(t => t.mode === filters.mode);
        }
        
        // Date range filters (also selective)
        if (filters.tanggalDari) {
            const fromDate = new Date(filters.tanggalDari);
            filtered = filtered.filter(t => {
                const transactionDate = new Date(t.tanggal);
                return transactionDate >= fromDate;
            });
        }
        
        if (filters.tanggalSampai) {
            const toDate = new Date(filters.tanggalSampai);
            toDate.setHours(23, 59, 59, 999); // Include full day
            filtered = filtered.filter(t => {
                const transactionDate = new Date(t.tanggal);
                return transactionDate <= toDate;
            });
        }
        
        // Jenis filter
        if (filters.jenis) {
            filtered = filtered.filter(t => t.jenis === filters.jenis);
        }
        
        // Anggota ID filter
        if (filters.anggotaId) {
            filtered = filtered.filter(t => t.anggotaId === filters.anggotaId);
        }
        
        // Anggota search (name or NIK)
        if (filters.anggotaSearch) {
            const searchTerm = filters.anggotaSearch.toLowerCase();
            filtered = filtered.filter(t => {
                const nama = (t.anggotaNama || '').toLowerCase();
                const nik = (t.anggotaNIK || '').toLowerCase();
                return nama.includes(searchTerm) || nik.includes(searchTerm);
            });
        }
        
        // Kasir filter
        if (filters.kasirId) {
            filtered = filtered.filter(t => t.kasirId === filters.kasirId);
        }
        
        // Batch ID filter (for import transactions)
        if (filters.batchId) {
            filtered = filtered.filter(t => t.batchId === filters.batchId);
        }
        
        // Amount range filters
        if (filters.jumlahMin !== undefined) {
            const minAmount = parseFloat(filters.jumlahMin);
            filtered = filtered.filter(t => parseFloat(t.jumlah) >= minAmount);
        }
        
        if (filters.jumlahMax !== undefined) {
            const maxAmount = parseFloat(filters.jumlahMax);
            filtered = filtered.filter(t => parseFloat(t.jumlah) <= maxAmount);
        }
        
        // Status filter
        if (filters.status) {
            filtered = filtered.filter(t => t.status === filters.status);
        }
        
        return filtered;
    }

    /**
     * Apply sorting to transactions
     * Requirements: 4.1, 4.4 - Optimized sorting
     * @private
     * @param {Array} transactions - Transactions to sort
     * @param {Object} sortOptions - Sort configuration
     * @returns {Array} Sorted transactions
     */
    _applySorting(transactions, sortOptions) {
        const { field = 'createdAt', direction = 'desc' } = sortOptions;
        
        return [...transactions].sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];
            
            // Handle different data types for optimal sorting
            switch (field) {
                case 'jumlah':
                case 'saldoSebelum':
                case 'saldoSesudah':
                    aVal = parseFloat(aVal) || 0;
                    bVal = parseFloat(bVal) || 0;
                    break;
                    
                case 'tanggal':
                case 'createdAt':
                case 'updatedAt':
                    aVal = new Date(aVal);
                    bVal = new Date(bVal);
                    break;
                    
                case 'anggotaNama':
                case 'kasirNama':
                case 'jenis':
                case 'mode':
                    aVal = String(aVal || '').toLowerCase();
                    bVal = String(bVal || '').toLowerCase();
                    break;
                    
                default:
                    aVal = String(aVal || '');
                    bVal = String(bVal || '');
            }
            
            let comparison = 0;
            if (aVal < bVal) comparison = -1;
            else if (aVal > bVal) comparison = 1;
            
            return direction === 'desc' ? -comparison : comparison;
        });
    }

    /**
     * Apply pagination to transactions
     * Requirements: 4.4 - Performance optimization for large datasets
     * @private
     * @param {Array} transactions - Sorted transactions
     * @param {Object} paginationOptions - Pagination configuration
     * @returns {Object} Paginated result
     */
    _applyPagination(transactions, paginationOptions) {
        const { page = 1, pageSize = 20 } = paginationOptions;
        const total = transactions.length;
        const totalPages = Math.ceil(total / pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        
        return {
            data: transactions.slice(startIndex, endIndex),
            pagination: {
                page: Math.max(1, Math.min(page, totalPages)),
                pageSize,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
    }

    /**
     * Get transaction statistics by mode
     * Requirements: 4.1, 4.2 - Summary statistics for unified view
     * @param {Object} filters - Filter options
     * @returns {Object} Statistics by mode
     */
    getTransactionStatistics(filters = {}) {
        try {
            const transactions = this.getTransactionHistory(filters);
            
            const stats = {
                total: {
                    count: 0,
                    amount: 0,
                    hutang: { count: 0, amount: 0 },
                    piutang: { count: 0, amount: 0 }
                },
                manual: {
                    count: 0,
                    amount: 0,
                    hutang: { count: 0, amount: 0 },
                    piutang: { count: 0, amount: 0 }
                },
                import: {
                    count: 0,
                    amount: 0,
                    hutang: { count: 0, amount: 0 },
                    piutang: { count: 0, amount: 0 }
                }
            };
            
            transactions.forEach(t => {
                const amount = parseFloat(t.jumlah) || 0;
                const mode = t.mode || 'manual';
                const jenis = t.jenis;
                
                // Total stats
                stats.total.count++;
                stats.total.amount += amount;
                stats.total[jenis].count++;
                stats.total[jenis].amount += amount;
                
                // Mode-specific stats
                if (stats[mode]) {
                    stats[mode].count++;
                    stats[mode].amount += amount;
                    stats[mode][jenis].count++;
                    stats[mode][jenis].amount += amount;
                }
            });
            
            return stats;
            
        } catch (error) {
            console.error('Error calculating transaction statistics:', error);
            return null;
        }
    }

    /**
     * Get transactions by batch ID (for import tracking)
     * Requirements: 4.1, 4.3 - Batch transaction tracking
     * @param {string} batchId - Batch ID to search for
     * @returns {Array} Transactions in the batch
     */
    getTransactionsByBatch(batchId) {
        try {
            return this.getTransactionHistory({ batchId });
        } catch (error) {
            console.error('Error getting transactions by batch:', error);
            return [];
        }
    }

    /**
     * Search transactions with advanced criteria
     * Requirements: 4.2, 4.4 - Advanced search functionality
     * @param {string} searchTerm - Search term
     * @param {Object} searchOptions - Search configuration
     * @returns {Array} Matching transactions
     */
    searchTransactions(searchTerm, searchOptions = {}) {
        try {
            if (!searchTerm || searchTerm.trim() === '') {
                return [];
            }
            
            const { 
                fields = ['anggotaNama', 'anggotaNIK', 'kasirNama', 'keterangan'],
                mode = null,
                limit = 50
            } = searchOptions;
            
            const allTransactions = this._getAllTransactionSources();
            const searchTermLower = searchTerm.toLowerCase();
            
            let results = allTransactions.filter(t => {
                // Mode filter if specified
                if (mode && t.mode !== mode) return false;
                
                // Search in specified fields
                return fields.some(field => {
                    const value = t[field];
                    return value && String(value).toLowerCase().includes(searchTermLower);
                });
            });
            
            // Sort by relevance (exact matches first, then partial matches)
            results.sort((a, b) => {
                const aExact = fields.some(field => {
                    const value = a[field];
                    return value && String(value).toLowerCase() === searchTermLower;
                });
                const bExact = fields.some(field => {
                    const value = b[field];
                    return value && String(value).toLowerCase() === searchTermLower;
                });
                
                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;
                
                // Secondary sort by date
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            
            // Apply limit
            return results.slice(0, limit);
            
        } catch (error) {
            console.error('Error searching transactions:', error);
            return [];
        }
    }

    /**
     * Process payment transaction (unified for both modes)
     * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5 - Enhanced with error handling and rollback
     * @param {Object} paymentData - Payment data
     * @param {string} mode - Payment mode ('manual' or 'import')
     * @returns {Object} Processing result
     */
    async processPayment(paymentData, mode = 'manual') {
        let transaction = null;
        let jurnalId = null;
        
        try {
            const { anggotaId, jenis, jumlah } = paymentData;
            
            // Validate payment data
            const validation = this.validatePaymentData(paymentData, mode);
            if (!validation.valid) {
                const validationError = new Error(`Validation failed: ${validation.errors.join(', ')}`);
                
                // Handle validation error with enhanced error handling
                const errorResult = this.handleError(validationError, {
                    operation: 'processPayment',
                    mode,
                    anggotaId,
                    jenis,
                    validationErrors: validation.errors
                });
                
                throw validationError;
            }
            
            // Get current saldo
            const saldoInfo = jenis === 'hutang' 
                ? this.updateSaldoHutang(anggotaId, jumlah, mode)
                : this.updateSaldoPiutang(anggotaId, jumlah, mode);
            
            // Create transaction record
            transaction = this._createTransactionRecord(paymentData, saldoInfo, mode);
            
            // Create journal entry with error handling
            try {
                jurnalId = this.createJurnalEntry(transaction, mode);
                transaction.jurnalId = jurnalId;
            } catch (journalError) {
                // Handle journal creation error
                const errorResult = this.handleError(journalError, {
                    operation: 'createJournalEntry',
                    mode,
                    transactionId: transaction.id,
                    anggotaId,
                    jenis,
                    affectsSharedData: true,
                    requiresRollback: true
                });
                
                throw new Error(`Journal creation failed: ${journalError.message}`);
            }
            
            // Save transaction with error handling
            try {
                this._saveTransaction(transaction);
            } catch (saveError) {
                // Rollback journal entry if transaction save fails
                if (jurnalId && this.errorHandler) {
                    await this.performRollback(transaction.id, {
                        reason: 'transaction_save_failed',
                        mode
                    });
                }
                
                const errorResult = this.handleError(saveError, {
                    operation: 'saveTransaction',
                    mode,
                    transactionId: transaction.id,
                    jurnalId,
                    requiresRollback: true
                });
                
                throw new Error(`Transaction save failed: ${saveError.message}`);
            }
            
            // Validate consistency after processing
            if (this.consistencyValidator) {
                const consistencyCheck = this.consistencyValidator.validateSaldoConsistency(anggotaId);
                if (!consistencyCheck.valid) {
                    console.warn('Consistency validation failed after payment processing:', consistencyCheck.errors);
                    
                    // Log consistency warning but don't fail the transaction
                    this.logAudit('CONSISTENCY_WARNING', {
                        transactionId: transaction.id,
                        mode,
                        consistencyErrors: consistencyCheck.errors
                    });
                }
            }
            
            // Log successful processing
            this.logAudit('PAYMENT_PROCESSED', {
                transactionId: transaction.id,
                mode,
                jenis,
                jumlah,
                anggotaId
            });
            
            return {
                success: true,
                transaction,
                saldoInfo
            };
            
        } catch (error) {
            console.error('Failed to process payment:', error);
            
            // Enhanced error logging
            this.logAudit('PAYMENT_ERROR', {
                paymentData,
                mode,
                error: error.message,
                transactionId: transaction?.id,
                jurnalId,
                stack: error.stack
            });
            
            // Handle the error with enhanced error handling
            const errorResult = this.handleError(error, {
                operation: 'processPayment',
                mode,
                paymentData,
                transactionId: transaction?.id,
                jurnalId
            });
            
            // Re-throw the error for caller to handle
            throw error;
        }
    }

    /**
     * Process batch payments (for import mode)
     * Requirements: 6.1, 6.2, 6.3
     * @param {Array} batchData - Array of payment data
     * @param {string} mode - Payment mode (should be 'import')
     * @returns {Object} Batch processing result
     */
    async processBatchPayments(batchData, mode = 'import') {
        const results = {
            total: batchData.length,
            successful: 0,
            failed: 0,
            transactions: [],
            errors: []
        };
        
        try {
            for (let i = 0; i < batchData.length; i++) {
                try {
                    const paymentResult = await this.processPayment(batchData[i], mode);
                    results.successful++;
                    results.transactions.push(paymentResult.transaction);
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        index: i,
                        data: batchData[i],
                        error: error.message
                    });
                }
            }
            
            // Log batch processing result
            this.logAudit('BATCH_PROCESSED', {
                mode,
                total: results.total,
                successful: results.successful,
                failed: results.failed
            });
            
            return results;
            
        } catch (error) {
            console.error('Failed to process batch payments:', error);
            this.logAudit('BATCH_ERROR', {
                mode,
                error: error.message,
                batchSize: batchData.length
            });
            throw error;
        }
    }

    // ===== PRIVATE HELPER METHODS =====

    /**
     * Initialize user context
     * @private
     */
    _initializeUserContext() {
        if (typeof localStorage !== 'undefined') {
            try {
                const currentUser = localStorage.getItem('currentUser');
                if (currentUser) {
                    return JSON.parse(currentUser);
                }
            } catch (error) {
                console.warn('Failed to initialize user context:', error);
            }
        }
        return null;
    }

    /**
     * Initialize audit logger
     * @private
     */
    _initializeAuditLogger() {
        // Use existing audit logger if available
        if (typeof window !== 'undefined' && window.AuditLogger) {
            return new window.AuditLogger();
        }
        return null;
    }

    /**
     * Add journal entry using existing or fallback method
     * @private
     */
    _addJurnal(keterangan, entries, tanggal) {
        if (typeof window !== 'undefined' && typeof window.addJurnal === 'function') {
            return window.addJurnal(keterangan, entries, tanggal);
        } else {
            return this._createJurnalFallback(keterangan, entries, tanggal, 'manual');
        }
    }

    /**
     * Create journal entry fallback
     * @private
     */
    _createJurnalFallback(keterangan, entries, tanggal, mode) {
        const jurnalId = this._generateId();
        
        const jurnalEntry = {
            id: jurnalId,
            tanggal,
            keterangan: `${keterangan} [${mode}]`,
            entries,
            createdAt: new Date().toISOString(),
            createdBy: this.currentUser?.id || 'unknown',
            mode
        };
        
        // Save to localStorage
        const jurnalList = JSON.parse(localStorage.getItem('jurnal') || '[]');
        jurnalList.push(jurnalEntry);
        localStorage.setItem('jurnal', JSON.stringify(jurnalList));
        
        return jurnalId;
    }

    /**
     * Calculate saldo hutang fallback
     * @private
     */
    _calculateSaldoHutangFallback(anggotaId) {
        try {
            const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
            const pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
            
            const totalKredit = penjualan
                .filter(p => p.anggotaId === anggotaId && p.metodePembayaran === 'Kredit')
                .reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
            
            const totalBayar = pembayaran
                .filter(p => p.anggotaId === anggotaId && p.jenis === 'hutang' && p.status === 'selesai')
                .reduce((sum, p) => sum + (parseFloat(p.jumlah) || 0), 0);
            
            return totalKredit - totalBayar;
        } catch (error) {
            console.error('Error calculating hutang saldo:', error);
            return 0;
        }
    }

    /**
     * Calculate saldo piutang fallback
     * @private
     */
    _calculateSaldoPiutangFallback(anggotaId) {
        try {
            const simpananList = JSON.parse(localStorage.getItem('simpanan') || '[]');
            const pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
            
            const anggotaSimpanan = simpananList.filter(s => 
                s.anggotaId === anggotaId && 
                s.statusPengembalian === 'pending'
            );
            
            let totalPiutang = 0;
            anggotaSimpanan.forEach(simpanan => {
                totalPiutang += parseFloat(simpanan.saldo || 0);
            });
            
            const totalBayar = pembayaran
                .filter(p => p.anggotaId === anggotaId && p.jenis === 'piutang' && p.status === 'selesai')
                .reduce((sum, p) => sum + (parseFloat(p.jumlah) || 0), 0);
            
            return totalPiutang - totalBayar;
        } catch (error) {
            console.error('Error calculating piutang saldo:', error);
            return 0;
        }
    }

    /**
     * Save audit log fallback
     * @private
     */
    _saveAuditLogFallback(auditEntry) {
        try {
            const auditLog = JSON.parse(localStorage.getItem('auditLog') || '[]');
            auditLog.push(auditEntry);
            localStorage.setItem('auditLog', JSON.stringify(auditLog));
        } catch (error) {
            console.error('Failed to save audit log:', error);
        }
    }

    /**
     * Create transaction record
     * @private
     */
    _createTransactionRecord(paymentData, saldoInfo, mode) {
        const timestamp = new Date().toISOString();
        
        return {
            id: this._generateId(),
            tanggal: timestamp.split('T')[0],
            anggotaId: paymentData.anggotaId,
            anggotaNama: paymentData.anggotaNama,
            anggotaNIK: paymentData.anggotaNIK,
            jenis: paymentData.jenis,
            jumlah: paymentData.jumlah,
            saldoSebelum: saldoInfo.saldoSebelum,
            saldoSesudah: saldoInfo.saldoSesudah,
            keterangan: paymentData.keterangan || '',
            kasirId: this.currentUser?.id || '',
            kasirNama: this.currentUser?.nama || '',
            jurnalId: '',
            status: 'selesai',
            mode: mode,
            batchId: paymentData.batchId || null,
            createdAt: timestamp,
            updatedAt: timestamp
        };
    }

    /**
     * Save transaction to localStorage
     * @private
     */
    _saveTransaction(transaction) {
        try {
            const pembayaranList = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
            pembayaranList.push(transaction);
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaranList));
        } catch (error) {
            console.error('Failed to save transaction:', error);
            throw error;
        }
    }

    /**
     * Format rupiah
     * @private
     */
    _formatRupiah(amount) {
        if (typeof window !== 'undefined' && typeof window.formatRupiah === 'function') {
            return window.formatRupiah(amount);
        }
        
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
        }).format(amount);
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
        if (!this._sessionId) {
            this._sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        }
        return this._sessionId;
    }

    // ===== ENHANCED ERROR HANDLING METHODS =====

    /**
     * Handle error with enhanced error handling
     * Requirements: 6.4, 6.5 - Cross-mode error handling
     * @param {Error} error - Error to handle
     * @param {Object} context - Error context
     * @returns {Object} Error handling result
     */
    handleError(error, context = {}) {
        if (this.errorHandler) {
            return this.errorHandler.handleError(error, context);
        }
        
        // Fallback error handling
        console.error('Error occurred:', error.message, context);
        
        this.logAudit('ERROR_FALLBACK', {
            error: error.message,
            context,
            stack: error.stack
        });
        
        return {
            success: false,
            error: error,
            message: error.message,
            requiresManualIntervention: true
        };
    }

    /**
     * Perform rollback with enhanced rollback mechanism
     * Requirements: 6.4, 6.5 - Cross-mode rollback
     * @param {string} transactionId - Transaction ID to rollback
     * @param {Object} options - Rollback options
     * @returns {Promise<Object>} Rollback result
     */
    async performRollback(transactionId, options = {}) {
        if (this.errorHandler) {
            return await this.errorHandler.performCrossModeRollback(transactionId, options);
        }
        
        // Fallback rollback mechanism
        try {
            console.warn('Using fallback rollback mechanism for transaction:', transactionId);
            
            // Simple rollback: remove transaction and journal
            const transactions = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
            const transaction = transactions.find(t => t.id === transactionId);
            
            if (!transaction) {
                return {
                    success: false,
                    message: `Transaction ${transactionId} not found for rollback`
                };
            }
            
            // Remove transaction
            const filteredTransactions = transactions.filter(t => t.id !== transactionId);
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(filteredTransactions));
            
            // Remove journal if exists
            if (transaction.jurnalId) {
                const journals = JSON.parse(localStorage.getItem('jurnal') || '[]');
                const filteredJournals = journals.filter(j => j.id !== transaction.jurnalId);
                localStorage.setItem('jurnal', JSON.stringify(filteredJournals));
            }
            
            this.logAudit('ROLLBACK_FALLBACK', {
                transactionId,
                jurnalId: transaction.jurnalId,
                options
            });
            
            return {
                success: true,
                message: 'Rollback completed using fallback mechanism'
            };
            
        } catch (error) {
            console.error('Fallback rollback failed:', error);
            
            this.logAudit('ROLLBACK_FALLBACK_FAILED', {
                transactionId,
                error: error.message,
                options
            });
            
            return {
                success: false,
                message: `Rollback failed: ${error.message}`,
                requiresManualIntervention: true
            };
        }
    }
    /**
     * Get optimized transaction history with caching and pagination
     * Requirements: 4.1, 5.1 - Efficient database queries and pagination
     * @param {Object} filters - Query filters
     * @param {Object} options - Query options (pagination, sorting)
     * @returns {Object} Paginated transaction results or Array for backward compatibility
     */
    getTransactionHistoryOptimized(filters, options) {
        // Set default values
        filters = filters || {};
        options = options || {};
        
        // Use data query optimizer if available
        if (this.dataQueryOptimizer) {
            return this.dataQueryOptimizer.getTransactionHistory(filters, options);
        }
        
        // Fallback to original method for backward compatibility
        return this.getTransactionHistory(filters);
    }
}

// Export for both browser and Node.js environments
if (typeof window !== 'undefined') {
    window.SharedPaymentServices = SharedPaymentServices;
}

// ES6 export for modern environments
export { SharedPaymentServices };

// CommonJS export for compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SharedPaymentServices };
}
        // Use data query optimizer if available
