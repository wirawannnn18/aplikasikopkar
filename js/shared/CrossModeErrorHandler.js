/**
 * Cross-Mode Error Handler
 * Requirements: 6.4, 6.5 - Handle errors that affect both modes
 * 
 * Provides comprehensive error handling for integrated payment system
 * including rollback across modes and error recovery mechanisms.
 */

/**
 * Cross-Mode Error Handler Class
 * Handles errors that affect both manual and import payment modes
 */
class CrossModeErrorHandler {
    constructor(sharedServices) {
        this.sharedServices = sharedServices;
        this.errorLog = [];
        this.rollbackStack = [];
        this.maxRollbackDepth = 10;
        this.errorRecoveryStrategies = new Map();
        
        // Initialize error recovery strategies
        this._initializeRecoveryStrategies();
    }

    /**
     * Handle error with cross-mode awareness
     * Requirements: 6.4 - Handle errors that affect both modes
     * @param {Error} error - Error object
     * @param {Object} context - Error context
     * @returns {Object} Error handling result
     */
    handleError(error, context = {}) {
        try {
            // Log error with full context
            const errorEntry = this._createErrorEntry(error, context);
            this.errorLog.push(errorEntry);
            
            // Determine error severity and scope
            const errorAnalysis = this._analyzeError(error, context);
            
            // Check if error affects both modes
            if (errorAnalysis.affectsBothModes) {
                return this._handleCrossModeError(error, context, errorAnalysis);
            }
            
            // Handle single-mode error
            return this._handleSingleModeError(error, context, errorAnalysis);
            
        } catch (handlingError) {
            console.error('Critical: Error handler failed:', handlingError);
            return {
                success: false,
                error: error,
                handlingError: handlingError,
                message: 'Terjadi kesalahan kritis dalam penanganan error',
                requiresManualIntervention: true
            };
        }
    }

    /**
     * Perform rollback across modes if needed
     * Requirements: 6.4, 6.5 - Implement rollback across modes
     * @param {string} transactionId - Transaction ID to rollback
     * @param {Object} options - Rollback options
     * @returns {Promise<Object>} Rollback result
     */
    async performCrossModeRollback(transactionId, options = {}) {
        const rollbackContext = {
            transactionId,
            timestamp: new Date().toISOString(),
            initiatedBy: options.initiatedBy || 'system',
            reason: options.reason || 'error',
            mode: options.mode || 'both'
        };
        
        try {
            // Get transaction data from both modes
            const transactionData = await this._getTransactionData(transactionId);
            
            if (!transactionData) {
                return {
                    success: false,
                    message: `Transaksi ${transactionId} tidak ditemukan`,
                    rollbackContext
                };
            }
            
            // Create rollback snapshot
            const snapshot = await this._createRollbackSnapshot(transactionData);
            this._pushRollbackSnapshot(snapshot);
            
            // Perform rollback based on mode
            const rollbackResult = await this._executeRollback(transactionData, options.mode);
            
            // Verify rollback success
            const verification = await this._verifyRollback(transactionData, rollbackResult);
            
            if (!verification.success) {
                // Attempt recovery
                const recovery = await this._attemptRollbackRecovery(transactionData, verification);
                return {
                    success: recovery.success,
                    message: recovery.message,
                    rollbackContext,
                    verification,
                    recovery
                };
            }
            
            // Log successful rollback
            this.sharedServices.logAudit('CROSS_MODE_ROLLBACK_SUCCESS', {
                transactionId,
                mode: options.mode,
                rollbackContext,
                verification
            });
            
            return {
                success: true,
                message: 'Rollback berhasil dilakukan',
                rollbackContext,
                verification
            };
            
        } catch (error) {
            console.error('Rollback failed:', error);
            
            // Log rollback failure
            this.sharedServices.logAudit('CROSS_MODE_ROLLBACK_FAILED', {
                transactionId,
                error: error.message,
                rollbackContext
            });
            
            return {
                success: false,
                message: `Rollback gagal: ${error.message}`,
                error: error,
                rollbackContext,
                requiresManualIntervention: true
            };
        }
    }

    /**
     * Add error recovery mechanism
     * Requirements: 6.4 - Add error recovery mechanisms
     * @param {string} errorType - Type of error
     * @param {Function} recoveryFunction - Recovery function
     */
    addRecoveryStrategy(errorType, recoveryFunction) {
        this.errorRecoveryStrategies.set(errorType, recoveryFunction);
    }

    /**
     * Attempt automatic error recovery
     * Requirements: 6.4 - Add error recovery mechanisms
     * @param {Error} error - Error to recover from
     * @param {Object} context - Error context
     * @returns {Promise<Object>} Recovery result
     */
    async attemptRecovery(error, context = {}) {
        try {
            const errorType = this._categorizeError(error);
            const strategy = this.errorRecoveryStrategies.get(errorType);
            
            if (!strategy) {
                return {
                    success: false,
                    message: `Tidak ada strategi recovery untuk error type: ${errorType}`,
                    requiresManualIntervention: true
                };
            }
            
            // Attempt recovery
            const recoveryResult = await strategy(error, context, this.sharedServices);
            
            // Log recovery attempt
            this.sharedServices.logAudit('ERROR_RECOVERY_ATTEMPTED', {
                errorType,
                success: recoveryResult.success,
                context
            });
            
            return recoveryResult;
            
        } catch (recoveryError) {
            console.error('Recovery attempt failed:', recoveryError);
            return {
                success: false,
                message: `Recovery gagal: ${recoveryError.message}`,
                error: recoveryError,
                requiresManualIntervention: true
            };
        }
    }

    /**
     * Get error log with filtering
     * @param {Object} filters - Filter options
     * @returns {Array} Filtered error log
     */
    getErrorLog(filters = {}) {
        let filtered = this.errorLog;
        
        if (filters.mode) {
            filtered = filtered.filter(e => e.context.mode === filters.mode);
        }
        
        if (filters.severity) {
            filtered = filtered.filter(e => e.severity === filters.severity);
        }
        
        if (filters.affectsBothModes !== undefined) {
            filtered = filtered.filter(e => e.affectsBothModes === filters.affectsBothModes);
        }
        
        if (filters.fromDate) {
            const fromDate = new Date(filters.fromDate);
            filtered = filtered.filter(e => new Date(e.timestamp) >= fromDate);
        }
        
        return filtered;
    }

    /**
     * Clear error log
     * @param {Object} options - Clear options
     */
    clearErrorLog(options = {}) {
        if (options.olderThan) {
            const cutoffDate = new Date(options.olderThan);
            this.errorLog = this.errorLog.filter(e => new Date(e.timestamp) > cutoffDate);
        } else {
            this.errorLog = [];
        }
    }

    /**
     * Get rollback history
     * @returns {Array} Rollback history
     */
    getRollbackHistory() {
        return this.rollbackStack.slice();
    }

    // ===== PRIVATE METHODS =====

    /**
     * Initialize error recovery strategies
     * @private
     */
    _initializeRecoveryStrategies() {
        // Insufficient balance recovery
        this.addRecoveryStrategy('INSUFFICIENT_BALANCE', async (error, context, services) => {
            // Recalculate balance and retry
            const anggotaId = context.anggotaId;
            const jenis = context.jenis;
            
            if (!anggotaId || !jenis) {
                return { success: false, message: 'Context tidak lengkap untuk recovery' };
            }
            
            const currentBalance = jenis === 'hutang' 
                ? services.hitungSaldoHutang(anggotaId)
                : services.hitungSaldoPiutang(anggotaId);
            
            return {
                success: false,
                message: `Saldo tidak mencukupi. Saldo saat ini: ${currentBalance}`,
                currentBalance,
                requiresUserAction: true
            };
        });
        
        // Data not found recovery
        this.addRecoveryStrategy('DATA_NOT_FOUND', async (error, context, services) => {
            // Attempt to refresh data and retry
            try {
                if (context.dataType === 'anggota') {
                    // Refresh anggota data
                    const anggotaList = JSON.parse(localStorage.getItem('anggota') || '[]');
                    const anggota = anggotaList.find(a => a.id === context.anggotaId);
                    
                    if (anggota) {
                        return {
                            success: true,
                            message: 'Data ditemukan setelah refresh',
                            data: anggota
                        };
                    }
                }
                
                return {
                    success: false,
                    message: 'Data tidak ditemukan setelah refresh',
                    requiresUserAction: true
                };
            } catch (refreshError) {
                return {
                    success: false,
                    message: `Refresh gagal: ${refreshError.message}`,
                    requiresManualIntervention: true
                };
            }
        });
        
        // Journal entry failure recovery
        this.addRecoveryStrategy('JOURNAL_ENTRY_FAILED', async (error, context, services) => {
            // Attempt to rollback transaction and retry journal entry
            if (context.transactionId) {
                try {
                    // Rollback the transaction
                    const rollbackResult = await this.performCrossModeRollback(
                        context.transactionId,
                        { reason: 'journal_entry_failed', mode: context.mode }
                    );
                    
                    return {
                        success: rollbackResult.success,
                        message: rollbackResult.success 
                            ? 'Transaksi dibatalkan karena gagal mencatat jurnal'
                            : 'Gagal membatalkan transaksi',
                        rollbackResult,
                        requiresUserAction: true
                    };
                } catch (rollbackError) {
                    return {
                        success: false,
                        message: `Rollback gagal: ${rollbackError.message}`,
                        requiresManualIntervention: true
                    };
                }
            }
            
            return {
                success: false,
                message: 'Tidak dapat melakukan recovery tanpa transaction ID',
                requiresManualIntervention: true
            };
        });
        
        // Validation error recovery
        this.addRecoveryStrategy('VALIDATION_ERROR', async (error, context, services) => {
            // Provide detailed validation feedback
            return {
                success: false,
                message: 'Validasi gagal. Periksa kembali data yang dimasukkan.',
                validationErrors: context.validationErrors || [],
                requiresUserAction: true
            };
        });
    }

    /**
     * Create error entry
     * @private
     */
    _createErrorEntry(error, context) {
        return {
            id: this._generateId(),
            timestamp: new Date().toISOString(),
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            },
            context: {
                ...context,
                mode: context.mode || 'unknown',
                operation: context.operation || 'unknown'
            },
            severity: this._determineSeverity(error, context),
            affectsBothModes: this._checkIfAffectsBothModes(error, context)
        };
    }

    /**
     * Analyze error
     * @private
     */
    _analyzeError(error, context) {
        const errorType = this._categorizeError(error);
        const severity = this._determineSeverity(error, context);
        const affectsBothModes = this._checkIfAffectsBothModes(error, context);
        const requiresRollback = this._checkIfRequiresRollback(error, context);
        
        return {
            errorType,
            severity,
            affectsBothModes,
            requiresRollback,
            isRecoverable: this.errorRecoveryStrategies.has(errorType)
        };
    }

    /**
     * Handle cross-mode error
     * @private
     */
    async _handleCrossModeError(error, context, analysis) {
        console.warn('Cross-mode error detected:', error.message);
        
        // Log cross-mode error
        this.sharedServices.logAudit('CROSS_MODE_ERROR', {
            error: error.message,
            context,
            analysis
        });
        
        // Perform rollback if needed
        if (analysis.requiresRollback && context.transactionId) {
            const rollbackResult = await this.performCrossModeRollback(
                context.transactionId,
                { reason: 'cross_mode_error', mode: 'both' }
            );
            
            return {
                success: false,
                error: error,
                message: `Error mempengaruhi kedua mode. ${rollbackResult.message}`,
                analysis,
                rollbackResult,
                requiresUserNotification: true
            };
        }
        
        // Attempt recovery if possible
        if (analysis.isRecoverable) {
            const recoveryResult = await this.attemptRecovery(error, context);
            return {
                success: recoveryResult.success,
                error: error,
                message: recoveryResult.message,
                analysis,
                recoveryResult,
                requiresUserNotification: !recoveryResult.success
            };
        }
        
        return {
            success: false,
            error: error,
            message: `Error mempengaruhi kedua mode: ${error.message}`,
            analysis,
            requiresManualIntervention: true
        };
    }

    /**
     * Handle single-mode error
     * @private
     */
    async _handleSingleModeError(error, context, analysis) {
        // Log single-mode error
        this.sharedServices.logAudit('SINGLE_MODE_ERROR', {
            error: error.message,
            mode: context.mode,
            context,
            analysis
        });
        
        // Perform rollback if needed
        if (analysis.requiresRollback && context.transactionId) {
            const rollbackResult = await this.performCrossModeRollback(
                context.transactionId,
                { reason: 'single_mode_error', mode: context.mode }
            );
            
            return {
                success: false,
                error: error,
                message: rollbackResult.message,
                analysis,
                rollbackResult
            };
        }
        
        // Attempt recovery if possible
        if (analysis.isRecoverable) {
            const recoveryResult = await this.attemptRecovery(error, context);
            return {
                success: recoveryResult.success,
                error: error,
                message: recoveryResult.message,
                analysis,
                recoveryResult
            };
        }
        
        return {
            success: false,
            error: error,
            message: error.message,
            analysis
        };
    }

    /**
     * Get transaction data from both modes
     * @private
     */
    async _getTransactionData(transactionId) {
        try {
            // Check manual transactions
            const manualTransactions = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
            const manualTransaction = manualTransactions.find(t => t.id === transactionId);
            
            if (manualTransaction) {
                return {
                    ...manualTransaction,
                    source: 'manual'
                };
            }
            
            // Check import transactions
            const importTransactions = JSON.parse(localStorage.getItem('importBatchTransactions') || '[]');
            const importTransaction = importTransactions.find(t => t.id === transactionId);
            
            if (importTransaction) {
                return {
                    ...importTransaction,
                    source: 'import'
                };
            }
            
            return null;
        } catch (error) {
            console.error('Error getting transaction data:', error);
            return null;
        }
    }

    /**
     * Create rollback snapshot
     * @private
     */
    async _createRollbackSnapshot(transactionData) {
        return {
            id: this._generateId(),
            timestamp: new Date().toISOString(),
            transaction: JSON.parse(JSON.stringify(transactionData)),
            localStorage: {
                pembayaranHutangPiutang: localStorage.getItem('pembayaranHutangPiutang'),
                importBatchTransactions: localStorage.getItem('importBatchTransactions'),
                journals: localStorage.getItem('journals'),
                coa: localStorage.getItem('coa')
            }
        };
    }

    /**
     * Push rollback snapshot to stack
     * @private
     */
    _pushRollbackSnapshot(snapshot) {
        this.rollbackStack.push(snapshot);
        
        // Maintain max depth
        if (this.rollbackStack.length > this.maxRollbackDepth) {
            this.rollbackStack.shift();
        }
    }

    /**
     * Execute rollback
     * @private
     */
    async _executeRollback(transactionData, mode) {
        const results = {
            transactionRemoved: false,
            journalReverted: false,
            saldoRestored: false
        };
        
        try {
            // Remove transaction from storage
            if (mode === 'both' || mode === transactionData.source) {
                const storageKey = transactionData.source === 'manual' 
                    ? 'pembayaranHutangPiutang'
                    : 'importBatchTransactions';
                
                const transactions = JSON.parse(localStorage.getItem(storageKey) || '[]');
                const filtered = transactions.filter(t => t.id !== transactionData.id);
                localStorage.setItem(storageKey, JSON.stringify(filtered));
                
                results.transactionRemoved = true;
            }
            
            // Revert journal entries
            if (transactionData.jurnalId) {
                const journals = JSON.parse(localStorage.getItem('journals') || '[]');
                const filtered = journals.filter(j => j.id !== transactionData.jurnalId);
                localStorage.setItem('journals', JSON.stringify(filtered));
                
                results.journalReverted = true;
            }
            
            // Note: Saldo is calculated dynamically, so no need to restore
            results.saldoRestored = true;
            
            return results;
            
        } catch (error) {
            console.error('Error executing rollback:', error);
            throw error;
        }
    }

    /**
     * Verify rollback success
     * @private
     */
    async _verifyRollback(transactionData, rollbackResult) {
        const verification = {
            success: true,
            checks: []
        };
        
        try {
            // Verify transaction removed
            const transactionExists = await this._getTransactionData(transactionData.id);
            verification.checks.push({
                name: 'transaction_removed',
                passed: !transactionExists,
                message: transactionExists ? 'Transaksi masih ada' : 'Transaksi berhasil dihapus'
            });
            
            if (transactionExists) {
                verification.success = false;
            }
            
            // Verify journal reverted
            if (transactionData.jurnalId) {
                const journals = JSON.parse(localStorage.getItem('journals') || '[]');
                const journalExists = journals.some(j => j.id === transactionData.jurnalId);
                verification.checks.push({
                    name: 'journal_reverted',
                    passed: !journalExists,
                    message: journalExists ? 'Jurnal masih ada' : 'Jurnal berhasil dihapus'
                });
                
                if (journalExists) {
                    verification.success = false;
                }
            }
            
            return verification;
            
        } catch (error) {
            console.error('Error verifying rollback:', error);
            return {
                success: false,
                error: error.message,
                checks: []
            };
        }
    }

    /**
     * Attempt rollback recovery
     * @private
     */
    async _attemptRollbackRecovery(transactionData, verification) {
        // If rollback verification failed, attempt manual cleanup
        try {
            const failedChecks = verification.checks.filter(c => !c.passed);
            
            for (const check of failedChecks) {
                if (check.name === 'transaction_removed') {
                    // Force remove transaction
                    const storageKey = transactionData.source === 'manual' 
                        ? 'pembayaranHutangPiutang'
                        : 'importBatchTransactions';
                    
                    const transactions = JSON.parse(localStorage.getItem(storageKey) || '[]');
                    const filtered = transactions.filter(t => t.id !== transactionData.id);
                    localStorage.setItem(storageKey, JSON.stringify(filtered));
                }
                
                if (check.name === 'journal_reverted' && transactionData.jurnalId) {
                    // Force remove journal
                    const journals = JSON.parse(localStorage.getItem('journals') || '[]');
                    const filtered = journals.filter(j => j.id !== transactionData.jurnalId);
                    localStorage.setItem('journals', JSON.stringify(filtered));
                }
            }
            
            return {
                success: true,
                message: 'Recovery berhasil dilakukan'
            };
            
        } catch (error) {
            return {
                success: false,
                message: `Recovery gagal: ${error.message}`,
                requiresManualIntervention: true
            };
        }
    }

    /**
     * Categorize error
     * @private
     */
    _categorizeError(error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('insufficient') || message.includes('tidak mencukupi')) {
            return 'INSUFFICIENT_BALANCE';
        } else if (message.includes('not found') || message.includes('tidak ditemukan')) {
            return 'DATA_NOT_FOUND';
        } else if (message.includes('journal') || message.includes('jurnal')) {
            return 'JOURNAL_ENTRY_FAILED';
        } else if (message.includes('validation') || message.includes('validasi')) {
            return 'VALIDATION_ERROR';
        } else if (message.includes('network') || message.includes('connection')) {
            return 'NETWORK_ERROR';
        } else {
            return 'UNKNOWN_ERROR';
        }
    }

    /**
     * Determine error severity
     * @private
     */
    _determineSeverity(error, context) {
        const errorType = this._categorizeError(error);
        
        if (errorType === 'JOURNAL_ENTRY_FAILED' || errorType === 'DATA_NOT_FOUND') {
            return 'high';
        } else if (errorType === 'INSUFFICIENT_BALANCE' || errorType === 'VALIDATION_ERROR') {
            return 'medium';
        } else {
            return 'low';
        }
    }

    /**
     * Check if error affects both modes
     * @private
     */
    _checkIfAffectsBothModes(error, context) {
        // Errors that affect shared resources affect both modes
        const errorType = this._categorizeError(error);
        
        if (errorType === 'JOURNAL_ENTRY_FAILED') {
            return true; // Journal affects both modes
        }
        
        if (context.affectsSharedData) {
            return true;
        }
        
        return false;
    }

    /**
     * Check if error requires rollback
     * @private
     */
    _checkIfRequiresRollback(error, context) {
        const errorType = this._categorizeError(error);
        
        // These errors require rollback
        const rollbackErrors = [
            'JOURNAL_ENTRY_FAILED',
            'DATA_NOT_FOUND'
        ];
        
        return rollbackErrors.includes(errorType) || context.requiresRollback;
    }

    /**
     * Generate unique ID
     * @private
     */
    _generateId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Export for both browser and Node.js environments
if (typeof window !== 'undefined') {
    window.CrossModeErrorHandler = CrossModeErrorHandler;
}

// ES6 export
export { CrossModeErrorHandler };

// CommonJS export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CrossModeErrorHandler };
}
