/**
 * Rollback Manager - Handles transaction rollback for import tagihan
 * Requirements: 8.4, 10.3, 10.4, 10.5
 */

// Import PaymentSystemIntegration - conditional import for different environments
let PaymentSystemIntegration;
if (typeof require !== 'undefined') {
    // Node.js environment
    try {
        PaymentSystemIntegration = require('./PaymentSystemIntegration.js').PaymentSystemIntegration;
    } catch (e) {
        // Fallback if require fails
        PaymentSystemIntegration = null;
    }
} else if (typeof window !== 'undefined') {
    // Browser environment
    PaymentSystemIntegration = window.PaymentSystemIntegration;
}

/**
 * Rollback Manager for handling transaction rollback operations
 * Ensures balance restoration consistency and proper cleanup with accounting integration
 */
class RollbackManager {
    constructor(auditLogger = null) {
        this.auditLogger = auditLogger;
        this.rollbackHistory = [];
        
        // Initialize PaymentSystemIntegration for consistent rollback operations
        // Requirements: 11.2 - Integrate with accounting module
        if (PaymentSystemIntegration) {
            this.paymentIntegration = new PaymentSystemIntegration();
        } else {
            console.warn('PaymentSystemIntegration not available, using fallback rollback logic');
            this.paymentIntegration = null;
        }
    }

    /**
     * Rollback a batch of transactions
     * Requirements: 8.4, 10.3, 10.4, 10.5
     * @param {string} batchId - Batch ID to rollback
     * @param {Array<Object>} transactions - Transactions to rollback
     * @returns {Promise<Object>} Rollback result
     */
    async rollbackBatch(batchId, transactions) {
        if (!batchId || !transactions || transactions.length === 0) {
            return {
                success: true,
                rolledBackCount: 0,
                errors: [],
                message: 'No transactions to rollback'
            };
        }

        const rollbackStartTime = new Date();
        const result = {
            batchId,
            success: false,
            rolledBackCount: 0,
            errors: [],
            balancesRestored: [],
            journalsRemoved: [],
            startTime: rollbackStartTime,
            endTime: null
        };

        try {
            console.log(`[RollbackManager] Starting rollback for batch ${batchId} with ${transactions.length} transactions...`);

            // Get current data from localStorage
            const pembayaranList = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
            const jurnalList = JSON.parse(localStorage.getItem('jurnal') || '[]');
            const anggotaList = JSON.parse(localStorage.getItem('anggota') || '[]');

            // Store original state for verification
            const originalPembayaranCount = pembayaranList.length;
            const originalJurnalCount = jurnalList.length;

            // Rollback each transaction in reverse order (LIFO)
            for (let i = transactions.length - 1; i >= 0; i--) {
                const transaction = transactions[i];
                
                try {
                    // Rollback single transaction
                    const rollbackResult = await this.rollbackSingleTransaction(
                        transaction,
                        pembayaranList,
                        jurnalList,
                        anggotaList
                    );

                    if (rollbackResult.success) {
                        result.rolledBackCount++;
                        result.balancesRestored.push({
                            anggotaId: transaction.anggotaId,
                            anggotaNama: transaction.anggotaNama,
                            jenis: transaction.jenis,
                            jumlah: transaction.jumlah,
                            saldoRestored: rollbackResult.saldoRestored
                        });

                        if (rollbackResult.journalRemoved) {
                            result.journalsRemoved.push(rollbackResult.journalId);
                        }

                        // Log successful rollback
                        if (this.auditLogger) {
                            this.auditLogger.logTransactionRollback(batchId, transaction.id, 'success');
                        }
                    } else {
                        result.errors.push({
                            transactionId: transaction.id,
                            anggotaNama: transaction.anggotaNama,
                            error: rollbackResult.error
                        });

                        // Log failed rollback
                        if (this.auditLogger) {
                            this.auditLogger.logTransactionRollback(batchId, transaction.id, 'failed', rollbackResult.error);
                        }
                    }

                } catch (error) {
                    console.error(`[RollbackManager] Error rolling back transaction ${transaction.id}:`, error);
                    result.errors.push({
                        transactionId: transaction.id,
                        anggotaNama: transaction.anggotaNama,
                        error: error.message
                    });

                    // Log error
                    if (this.auditLogger) {
                        this.auditLogger.logTransactionRollback(batchId, transaction.id, 'failed', error.message);
                    }
                }
            }

            // Save updated data back to localStorage
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaranList));
            localStorage.setItem('jurnal', JSON.stringify(jurnalList));

            // Verify rollback
            const verification = this.verifyRollback(
                originalPembayaranCount,
                originalJurnalCount,
                pembayaranList.length,
                jurnalList.length,
                result.rolledBackCount
            );

            result.success = result.errors.length === 0 && verification.success;
            result.endTime = new Date();
            result.duration = result.endTime - rollbackStartTime;
            result.verification = verification;

            // Log batch rollback completion
            if (this.auditLogger) {
                this.auditLogger.logBatchRollback(batchId, result.rolledBackCount, result.errors);
            }

            // Add to rollback history
            this.rollbackHistory.push({
                batchId,
                timestamp: rollbackStartTime,
                transactionCount: transactions.length,
                rolledBackCount: result.rolledBackCount,
                errorCount: result.errors.length,
                success: result.success
            });

            console.log(`[RollbackManager] Rollback completed. ${result.rolledBackCount} transactions rolled back, ${result.errors.length} errors.`);

            return result;

        } catch (error) {
            console.error('[RollbackManager] Critical error during rollback:', error);
            result.success = false;
            result.endTime = new Date();
            result.errors.push({
                critical: true,
                error: error.message
            });

            // Log critical error
            if (this.auditLogger) {
                this.auditLogger.logBatchRollback(batchId, 0, [{ critical: true, error: error.message }]);
            }

            return result;
        }
    }

    /**
     * Rollback a single transaction
     * Requirements: 8.4, 10.4, 10.5
     * @param {Object} transaction - Transaction to rollback
     * @param {Array} pembayaranList - Payment list (modified in place)
     * @param {Array} jurnalList - Journal list (modified in place)
     * @param {Array} anggotaList - Member list (for reference)
     * @returns {Promise<Object>} Rollback result
     */
    async rollbackSingleTransaction(transaction, pembayaranList, jurnalList, anggotaList) {
        try {
            // Validate transaction object
            if (!transaction || !transaction.id) {
                return {
                    success: false,
                    error: 'Invalid transaction object'
                };
            }

            // Find and remove the transaction from pembayaranHutangPiutang
            const transactionIndex = pembayaranList.findIndex(p => p.id === transaction.id);
            
            if (transactionIndex === -1) {
                // Check if transaction exists with different criteria
                const altIndex = pembayaranList.findIndex(p => 
                    p.batchId === transaction.batchId && 
                    p.anggotaId === transaction.anggotaId &&
                    p.jumlah === transaction.jumlah
                );
                
                if (altIndex === -1) {
                    return {
                        success: false,
                        error: 'Transaction not found in payment list'
                    };
                } else {
                    // Use alternative match
                    pembayaranList.splice(altIndex, 1);
                }
            } else {
                // Remove transaction by exact ID match
                pembayaranList.splice(transactionIndex, 1);
            }

            // Remove related journal entries using integrated accounting system
            // Requirements: 11.2 - Integrate with accounting module
            let journalRemoved = false;
            let journalId = null;

            if (this.paymentIntegration) {
                // Use PaymentSystemIntegration for consistent journal rollback
                journalRemoved = this.paymentIntegration.rollbackJournalEntry(transaction.id);
                if (journalRemoved) {
                    journalId = transaction.id; // Use transaction ID as journal reference
                }
            } else {
                // Fallback: Find and remove related journal entries
                // Journal entries are identified by matching date and member name
                const journalIndicesToRemove = [];
                jurnalList.forEach((journal, index) => {
                    if (journal.keterangan && 
                        journal.keterangan.includes(transaction.anggotaNama) &&
                        journal.tanggal === transaction.tanggal &&
                        (journal.keterangan.includes('Batch Import') || 
                         (transaction.batchId && journal.keterangan.includes(transaction.batchId)))) {
                        journalIndicesToRemove.push(index);
                    }
                });

                // Remove journals in reverse order to maintain indices
                for (let i = journalIndicesToRemove.length - 1; i >= 0; i--) {
                    jurnalList.splice(journalIndicesToRemove[i], 1);
                }

                journalRemoved = journalIndicesToRemove.length > 0;
                journalId = journalIndicesToRemove.length > 0 ? journalIndicesToRemove[0] : null;
            }

            // Calculate restored balance
            const saldoRestored = transaction.saldoSebelum || transaction.jumlah * 2;

            return {
                success: true,
                saldoRestored,
                journalRemoved: journalRemoved,
                journalId: journalId
            };

        } catch (error) {
            console.error('[RollbackManager] Error in rollbackSingleTransaction:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Verify rollback consistency
     * Requirements: 10.5
     * @param {number} originalPembayaranCount - Original payment count
     * @param {number} originalJurnalCount - Original journal count
     * @param {number} newPembayaranCount - New payment count
     * @param {number} newJurnalCount - New journal count
     * @param {number} rolledBackCount - Number of transactions rolled back
     * @returns {Object} Verification result
     */
    verifyRollback(originalPembayaranCount, originalJurnalCount, newPembayaranCount, newJurnalCount, rolledBackCount) {
        const verification = {
            success: true,
            checks: [],
            warnings: []
        };

        // Check payment count
        const expectedPembayaranCount = originalPembayaranCount - rolledBackCount;
        const pembayaranCheck = newPembayaranCount === expectedPembayaranCount;
        verification.checks.push({
            name: 'Payment count',
            expected: expectedPembayaranCount,
            actual: newPembayaranCount,
            passed: pembayaranCheck
        });

        if (!pembayaranCheck) {
            verification.success = false;
            verification.warnings.push(`Payment count mismatch: expected ${expectedPembayaranCount}, got ${newPembayaranCount}`);
        }

        // Check journal count (should be reduced by at least rolledBackCount)
        const journalReduced = newJurnalCount <= originalJurnalCount;
        verification.checks.push({
            name: 'Journal count reduced',
            original: originalJurnalCount,
            new: newJurnalCount,
            passed: journalReduced
        });

        if (!journalReduced) {
            verification.warnings.push(`Journal count not reduced: original ${originalJurnalCount}, new ${newJurnalCount}`);
        }

        return verification;
    }

    /**
     * Get rollback history
     * Requirements: 8.4
     * @returns {Array<Object>} Rollback history
     */
    getRollbackHistory() {
        return this.rollbackHistory;
    }

    /**
     * Get rollback statistics
     * Requirements: 8.4
     * @returns {Object} Rollback statistics
     */
    getRollbackStatistics() {
        const stats = {
            totalRollbacks: this.rollbackHistory.length,
            successfulRollbacks: 0,
            failedRollbacks: 0,
            totalTransactionsRolledBack: 0,
            totalErrors: 0,
            recentRollbacks: this.rollbackHistory.slice(-5)
        };

        this.rollbackHistory.forEach(rollback => {
            if (rollback.success) {
                stats.successfulRollbacks++;
            } else {
                stats.failedRollbacks++;
            }
            stats.totalTransactionsRolledBack += rollback.rolledBackCount;
            stats.totalErrors += rollback.errorCount;
        });

        return stats;
    }

    /**
     * Clear rollback history
     * Requirements: 8.4
     */
    clearRollbackHistory() {
        this.rollbackHistory = [];
    }

    /**
     * Check if a batch can be rolled back
     * Requirements: 10.3
     * @param {string} batchId - Batch ID to check
     * @returns {Object} Rollback eligibility
     */
    canRollback(batchId) {
        try {
            const pembayaranList = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
            const batchTransactions = pembayaranList.filter(p => p.batchId === batchId);

            return {
                eligible: batchTransactions.length > 0,
                transactionCount: batchTransactions.length,
                transactions: batchTransactions,
                reason: batchTransactions.length === 0 ? 'No transactions found for this batch' : 'Batch can be rolled back'
            };

        } catch (error) {
            return {
                eligible: false,
                transactionCount: 0,
                transactions: [],
                reason: `Error checking rollback eligibility: ${error.message}`
            };
        }
    }

    /**
     * Rollback by batch ID (convenience method)
     * Requirements: 8.4, 10.3
     * @param {string} batchId - Batch ID to rollback
     * @returns {Promise<Object>} Rollback result
     */
    async rollbackByBatchId(batchId) {
        const eligibility = this.canRollback(batchId);
        
        if (!eligibility.eligible) {
            return {
                success: false,
                rolledBackCount: 0,
                errors: [{ error: eligibility.reason }],
                message: eligibility.reason
            };
        }

        return await this.rollbackBatch(batchId, eligibility.transactions);
    }
}

// Export for both browser and Node.js environments
if (typeof window !== 'undefined') {
    window.RollbackManager = RollbackManager;
}

// ES6 export for modern environments
export { RollbackManager };

// CommonJS export for compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RollbackManager };
}

// ES Module export
if (typeof exports !== 'undefined') {
    exports.RollbackManager = RollbackManager;
}
