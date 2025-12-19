/**
 * Data Consistency Validator
 * Requirements: 6.1, 6.2, 6.3 - Validate saldo consistency across modes
 * 
 * Provides comprehensive data consistency validation for integrated payment system
 * including saldo consistency, journal entry integrity, and automatic data repair.
 */

/**
 * Data Consistency Validator Class
 * Validates data consistency across manual and import payment modes
 */
class DataConsistencyValidator {
    constructor(sharedServices) {
        this.sharedServices = sharedServices;
        this.validationRules = new Map();
        this.repairStrategies = new Map();
        this.validationHistory = [];
        
        // Initialize validation rules and repair strategies
        this._initializeValidationRules();
        this._initializeRepairStrategies();
    }

    /**
     * Validate saldo consistency across modes
     * Requirements: 6.1, 6.2 - Validate saldo consistency across modes
     * @param {string} anggotaId - Anggota ID to validate (optional, validates all if not provided)
     * @returns {Object} Validation result
     */
    validateSaldoConsistency(anggotaId = null) {
        try {
            const validationResult = {
                valid: true,
                errors: [],
                warnings: [],
                details: {},
                timestamp: new Date().toISOString()
            };
            
            // Get anggota list
            const anggotaList = JSON.parse(localStorage.getItem('anggota') || '[]');
            const targetAnggota = anggotaId 
                ? anggotaList.filter(a => a.id === anggotaId)
                : anggotaList;
            
            if (targetAnggota.length === 0) {
                validationResult.valid = false;
                validationResult.errors.push(`Anggota ${anggotaId || 'tidak ada'} tidak ditemukan`);
                return validationResult;
            }
            
            // Validate each anggota
            for (const anggota of targetAnggota) {
                const anggotaValidation = this._validateAnggotaSaldoConsistency(anggota);
                validationResult.details[anggota.id] = anggotaValidation;
                
                if (!anggotaValidation.valid) {
                    validationResult.valid = false;
                    validationResult.errors.push(
                        `Anggota ${anggota.nama} (${anggota.nik}): ${anggotaValidation.errors.join(', ')}`
                    );
                }
                
                if (anggotaValidation.warnings.length > 0) {
                    validationResult.warnings.push(
                        `Anggota ${anggota.nama} (${anggota.nik}): ${anggotaValidation.warnings.join(', ')}`
                    );
                }
            }
            
            // Log validation result
            this.sharedServices.logAudit('SALDO_CONSISTENCY_VALIDATION', {
                anggotaId,
                valid: validationResult.valid,
                errorCount: validationResult.errors.length,
                warningCount: validationResult.warnings.length
            });
            
            // Store validation history
            this.validationHistory.push({
                type: 'saldo_consistency',
                anggotaId,
                result: validationResult,
                timestamp: validationResult.timestamp
            });
            
            return validationResult;
            
        } catch (error) {
            console.error('Error validating saldo consistency:', error);
            return {
                valid: false,
                errors: [`Validation error: ${error.message}`],
                warnings: [],
                details: {},
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Check journal entry integrity
     * Requirements: 6.1, 6.3 - Check journal entry integrity
     * @param {string} transactionId - Transaction ID to validate (optional)
     * @returns {Object} Validation result
     */
    validateJournalIntegrity(transactionId = null) {
        try {
            const validationResult = {
                valid: true,
                errors: [],
                warnings: [],
                details: {},
                timestamp: new Date().toISOString()
            };
            
            // Get all transactions
            const manualTransactions = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
            const importTransactions = JSON.parse(localStorage.getItem('importBatchTransactions') || '[]');
            const allTransactions = [...manualTransactions, ...importTransactions];
            
            // Filter by transaction ID if provided
            const targetTransactions = transactionId 
                ? allTransactions.filter(t => t.id === transactionId)
                : allTransactions;
            
            if (targetTransactions.length === 0) {
                validationResult.warnings.push('Tidak ada transaksi untuk divalidasi');
                return validationResult;
            }
            
            // Get journals
            const journals = JSON.parse(localStorage.getItem('journals') || '[]');
            
            // Validate each transaction
            for (const transaction of targetTransactions) {
                const journalValidation = this._validateTransactionJournalIntegrity(transaction, journals);
                validationResult.details[transaction.id] = journalValidation;
                
                if (!journalValidation.valid) {
                    validationResult.valid = false;
                    validationResult.errors.push(
                        `Transaksi ${transaction.id}: ${journalValidation.errors.join(', ')}`
                    );
                }
                
                if (journalValidation.warnings.length > 0) {
                    validationResult.warnings.push(
                        `Transaksi ${transaction.id}: ${journalValidation.warnings.join(', ')}`
                    );
                }
            }
            
            // Log validation result
            this.sharedServices.logAudit('JOURNAL_INTEGRITY_VALIDATION', {
                transactionId,
                valid: validationResult.valid,
                errorCount: validationResult.errors.length,
                warningCount: validationResult.warnings.length
            });
            
            // Store validation history
            this.validationHistory.push({
                type: 'journal_integrity',
                transactionId,
                result: validationResult,
                timestamp: validationResult.timestamp
            });
            
            return validationResult;
            
        } catch (error) {
            console.error('Error validating journal integrity:', error);
            return {
                valid: false,
                errors: [`Validation error: ${error.message}`],
                warnings: [],
                details: {},
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Validate cross-mode data consistency
     * Requirements: 6.1, 6.2, 6.3 - Comprehensive cross-mode validation
     * @returns {Object} Validation result
     */
    validateCrossModeConsistency() {
        try {
            const validationResult = {
                valid: true,
                errors: [],
                warnings: [],
                details: {
                    saldoConsistency: null,
                    journalIntegrity: null,
                    transactionConsistency: null,
                    modeConsistency: null
                },
                timestamp: new Date().toISOString()
            };
            
            // 1. Validate saldo consistency
            const saldoValidation = this.validateSaldoConsistency();
            validationResult.details.saldoConsistency = saldoValidation;
            if (!saldoValidation.valid) {
                validationResult.valid = false;
                validationResult.errors.push('Saldo consistency validation failed');
            }
            
            // 2. Validate journal integrity
            const journalValidation = this.validateJournalIntegrity();
            validationResult.details.journalIntegrity = journalValidation;
            if (!journalValidation.valid) {
                validationResult.valid = false;
                validationResult.errors.push('Journal integrity validation failed');
            }
            
            // 3. Validate transaction consistency
            const transactionValidation = this._validateTransactionConsistency();
            validationResult.details.transactionConsistency = transactionValidation;
            if (!transactionValidation.valid) {
                validationResult.valid = false;
                validationResult.errors.push('Transaction consistency validation failed');
            }
            
            // 4. Validate mode consistency
            const modeValidation = this._validateModeConsistency();
            validationResult.details.modeConsistency = modeValidation;
            if (!modeValidation.valid) {
                validationResult.valid = false;
                validationResult.errors.push('Mode consistency validation failed');
            }
            
            // Combine all errors and warnings
            const allValidations = [saldoValidation, journalValidation, transactionValidation, modeValidation];
            allValidations.forEach(validation => {
                validationResult.errors.push(...validation.errors);
                validationResult.warnings.push(...validation.warnings);
            });
            
            // Log comprehensive validation
            this.sharedServices.logAudit('CROSS_MODE_CONSISTENCY_VALIDATION', {
                valid: validationResult.valid,
                errorCount: validationResult.errors.length,
                warningCount: validationResult.warnings.length,
                details: Object.keys(validationResult.details).reduce((acc, key) => {
                    acc[key] = validationResult.details[key].valid;
                    return acc;
                }, {})
            });
            
            // Store validation history
            this.validationHistory.push({
                type: 'cross_mode_consistency',
                result: validationResult,
                timestamp: validationResult.timestamp
            });
            
            return validationResult;
            
        } catch (error) {
            console.error('Error validating cross-mode consistency:', error);
            return {
                valid: false,
                errors: [`Validation error: ${error.message}`],
                warnings: [],
                details: {},
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Implement automatic data repair if possible
     * Requirements: 6.3 - Implement automatic data repair if possible
     * @param {Object} validationResult - Result from validation
     * @returns {Object} Repair result
     */
    async attemptDataRepair(validationResult) {
        try {
            const repairResult = {
                success: true,
                repaired: [],
                failed: [],
                warnings: [],
                timestamp: new Date().toISOString()
            };
            
            if (validationResult.valid) {
                return {
                    success: true,
                    message: 'Tidak ada data yang perlu diperbaiki',
                    repaired: [],
                    failed: [],
                    warnings: []
                };
            }
            
            // Attempt to repair each error
            for (const error of validationResult.errors) {
                const repairAttempt = await this._attemptErrorRepair(error, validationResult);
                
                if (repairAttempt.success) {
                    repairResult.repaired.push({
                        error: error,
                        repair: repairAttempt.repair,
                        method: repairAttempt.method
                    });
                } else {
                    repairResult.failed.push({
                        error: error,
                        reason: repairAttempt.reason
                    });
                    repairResult.success = false;
                }
            }
            
            // Log repair attempt
            this.sharedServices.logAudit('DATA_REPAIR_ATTEMPTED', {
                success: repairResult.success,
                repairedCount: repairResult.repaired.length,
                failedCount: repairResult.failed.length
            });
            
            return repairResult;
            
        } catch (error) {
            console.error('Error attempting data repair:', error);
            return {
                success: false,
                message: `Repair error: ${error.message}`,
                repaired: [],
                failed: [],
                warnings: []
            };
        }
    }

    /**
     * Get validation history
     * @param {Object} filters - Filter options
     * @returns {Array} Filtered validation history
     */
    getValidationHistory(filters = {}) {
        let filtered = this.validationHistory;
        
        if (filters.type) {
            filtered = filtered.filter(v => v.type === filters.type);
        }
        
        if (filters.fromDate) {
            const fromDate = new Date(filters.fromDate);
            filtered = filtered.filter(v => new Date(v.timestamp) >= fromDate);
        }
        
        if (filters.validOnly !== undefined) {
            filtered = filtered.filter(v => v.result.valid === filters.validOnly);
        }
        
        return filtered;
    }

    /**
     * Clear validation history
     * @param {Object} options - Clear options
     */
    clearValidationHistory(options = {}) {
        if (options.olderThan) {
            const cutoffDate = new Date(options.olderThan);
            this.validationHistory = this.validationHistory.filter(v => 
                new Date(v.timestamp) > cutoffDate
            );
        } else {
            this.validationHistory = [];
        }
    }

    // ===== PRIVATE METHODS =====

    /**
     * Initialize validation rules
     * @private
     */
    _initializeValidationRules() {
        // Saldo consistency rules
        this.validationRules.set('saldo_balance', (anggota) => {
            const calculatedHutang = this.sharedServices.hitungSaldoHutang(anggota.id);
            const calculatedPiutang = this.sharedServices.hitungSaldoPiutang(anggota.id);
            
            return {
                valid: calculatedHutang >= 0 && calculatedPiutang >= 0,
                calculatedHutang,
                calculatedPiutang,
                errors: [
                    ...(calculatedHutang < 0 ? ['Saldo hutang negatif'] : []),
                    ...(calculatedPiutang < 0 ? ['Saldo piutang negatif'] : [])
                ]
            };
        });
        
        // Journal balance rules
        this.validationRules.set('journal_balance', (transaction, journal) => {
            if (!journal) {
                return {
                    valid: false,
                    errors: ['Journal entry tidak ditemukan']
                };
            }
            
            const totalDebit = journal.entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
            const totalKredit = journal.entries.reduce((sum, entry) => sum + (entry.kredit || 0), 0);
            
            return {
                valid: Math.abs(totalDebit - totalKredit) < 0.01, // Allow for floating point precision
                totalDebit,
                totalKredit,
                difference: totalDebit - totalKredit,
                errors: Math.abs(totalDebit - totalKredit) >= 0.01 ? ['Journal tidak balance'] : []
            };
        });
        
        // Transaction amount consistency
        this.validationRules.set('transaction_amount', (transaction, journal) => {
            if (!journal) {
                return {
                    valid: false,
                    errors: ['Journal entry tidak ditemukan untuk validasi amount']
                };
            }
            
            const journalAmount = journal.entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
            const transactionAmount = parseFloat(transaction.jumlah) || 0;
            
            return {
                valid: Math.abs(journalAmount - transactionAmount) < 0.01,
                journalAmount,
                transactionAmount,
                difference: journalAmount - transactionAmount,
                errors: Math.abs(journalAmount - transactionAmount) >= 0.01 ? 
                    ['Jumlah transaksi tidak sesuai dengan journal'] : []
            };
        });
    }

    /**
     * Initialize repair strategies
     * @private
     */
    _initializeRepairStrategies() {
        // Repair negative saldo
        this.repairStrategies.set('negative_saldo', async (error, context) => {
            // Cannot automatically repair negative saldo - requires manual intervention
            return {
                success: false,
                reason: 'Saldo negatif memerlukan intervensi manual',
                requiresManualIntervention: true
            };
        });
        
        // Repair missing journal
        this.repairStrategies.set('missing_journal', async (error, context) => {
            try {
                const transaction = context.transaction;
                if (!transaction) {
                    return {
                        success: false,
                        reason: 'Transaction data tidak tersedia'
                    };
                }
                
                // Recreate journal entry
                const jurnalId = this.sharedServices.createJurnalEntry(transaction, transaction.mode || 'manual');
                
                // Update transaction with journal ID
                const storageKey = transaction.mode === 'import' 
                    ? 'importBatchTransactions'
                    : 'pembayaranHutangPiutang';
                
                const transactions = JSON.parse(localStorage.getItem(storageKey) || '[]');
                const transactionIndex = transactions.findIndex(t => t.id === transaction.id);
                
                if (transactionIndex >= 0) {
                    transactions[transactionIndex].jurnalId = jurnalId;
                    localStorage.setItem(storageKey, JSON.stringify(transactions));
                }
                
                return {
                    success: true,
                    repair: `Journal entry recreated with ID: ${jurnalId}`,
                    method: 'recreate_journal'
                };
                
            } catch (repairError) {
                return {
                    success: false,
                    reason: `Gagal membuat ulang journal: ${repairError.message}`
                };
            }
        });
        
        // Repair unbalanced journal
        this.repairStrategies.set('unbalanced_journal', async (error, context) => {
            try {
                const journal = context.journal;
                if (!journal) {
                    return {
                        success: false,
                        reason: 'Journal data tidak tersedia'
                    };
                }
                
                // Calculate difference
                const totalDebit = journal.entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
                const totalKredit = journal.entries.reduce((sum, entry) => sum + (entry.kredit || 0), 0);
                const difference = totalDebit - totalKredit;
                
                if (Math.abs(difference) < 0.01) {
                    return {
                        success: true,
                        repair: 'Journal sudah balance',
                        method: 'no_action_needed'
                    };
                }
                
                // Add balancing entry
                const balancingEntry = {
                    akun: '9-9999', // Suspense account
                    debit: difference < 0 ? Math.abs(difference) : 0,
                    kredit: difference > 0 ? difference : 0,
                    keterangan: 'Balancing entry - auto repair'
                };
                
                journal.entries.push(balancingEntry);
                
                // Update journal in storage
                const journals = JSON.parse(localStorage.getItem('journals') || '[]');
                const journalIndex = journals.findIndex(j => j.id === journal.id);
                
                if (journalIndex >= 0) {
                    journals[journalIndex] = journal;
                    localStorage.setItem('journals', JSON.stringify(journals));
                }
                
                return {
                    success: true,
                    repair: `Balancing entry added: ${Math.abs(difference)}`,
                    method: 'add_balancing_entry'
                };
                
            } catch (repairError) {
                return {
                    success: false,
                    reason: `Gagal memperbaiki journal balance: ${repairError.message}`
                };
            }
        });
    }

    /**
     * Validate anggota saldo consistency
     * @private
     */
    _validateAnggotaSaldoConsistency(anggota) {
        const validation = {
            valid: true,
            errors: [],
            warnings: [],
            details: {}
        };
        
        try {
            // Apply saldo balance rule
            const saldoRule = this.validationRules.get('saldo_balance');
            const saldoValidation = saldoRule(anggota);
            
            validation.details.saldoBalance = saldoValidation;
            
            if (!saldoValidation.valid) {
                validation.valid = false;
                validation.errors.push(...saldoValidation.errors);
            }
            
            // Check for unusual saldo patterns
            if (saldoValidation.calculatedHutang > 100000000) { // 100 million
                validation.warnings.push('Saldo hutang sangat besar');
            }
            
            if (saldoValidation.calculatedPiutang > 100000000) { // 100 million
                validation.warnings.push('Saldo piutang sangat besar');
            }
            
        } catch (error) {
            validation.valid = false;
            validation.errors.push(`Validation error: ${error.message}`);
        }
        
        return validation;
    }

    /**
     * Validate transaction journal integrity
     * @private
     */
    _validateTransactionJournalIntegrity(transaction, journals) {
        const validation = {
            valid: true,
            errors: [],
            warnings: [],
            details: {}
        };
        
        try {
            // Find corresponding journal
            const journal = journals.find(j => j.id === transaction.jurnalId);
            
            if (!journal) {
                validation.valid = false;
                validation.errors.push('Journal entry tidak ditemukan');
                return validation;
            }
            
            // Apply journal balance rule
            const balanceRule = this.validationRules.get('journal_balance');
            const balanceValidation = balanceRule(transaction, journal);
            
            validation.details.journalBalance = balanceValidation;
            
            if (!balanceValidation.valid) {
                validation.valid = false;
                validation.errors.push(...balanceValidation.errors);
            }
            
            // Apply transaction amount rule
            const amountRule = this.validationRules.get('transaction_amount');
            const amountValidation = amountRule(transaction, journal);
            
            validation.details.transactionAmount = amountValidation;
            
            if (!amountValidation.valid) {
                validation.valid = false;
                validation.errors.push(...amountValidation.errors);
            }
            
        } catch (error) {
            validation.valid = false;
            validation.errors.push(`Validation error: ${error.message}`);
        }
        
        return validation;
    }

    /**
     * Validate transaction consistency
     * @private
     */
    _validateTransactionConsistency() {
        const validation = {
            valid: true,
            errors: [],
            warnings: [],
            details: {}
        };
        
        try {
            // Get all transactions
            const manualTransactions = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
            const importTransactions = JSON.parse(localStorage.getItem('importBatchTransactions') || '[]');
            
            // Check for duplicate transaction IDs
            const allIds = [
                ...manualTransactions.map(t => t.id),
                ...importTransactions.map(t => t.id)
            ];
            
            const duplicateIds = allIds.filter((id, index) => allIds.indexOf(id) !== index);
            
            if (duplicateIds.length > 0) {
                validation.valid = false;
                validation.errors.push(`Duplicate transaction IDs found: ${duplicateIds.join(', ')}`);
            }
            
            // Check transaction data completeness
            const allTransactions = [...manualTransactions, ...importTransactions];
            const incompleteTransactions = allTransactions.filter(t => 
                !t.id || !t.anggotaId || !t.jenis || !t.jumlah
            );
            
            if (incompleteTransactions.length > 0) {
                validation.valid = false;
                validation.errors.push(`${incompleteTransactions.length} transactions with incomplete data`);
            }
            
            validation.details.totalTransactions = allTransactions.length;
            validation.details.manualCount = manualTransactions.length;
            validation.details.importCount = importTransactions.length;
            validation.details.duplicateIds = duplicateIds;
            validation.details.incompleteCount = incompleteTransactions.length;
            
        } catch (error) {
            validation.valid = false;
            validation.errors.push(`Transaction consistency validation error: ${error.message}`);
        }
        
        return validation;
    }

    /**
     * Validate mode consistency
     * @private
     */
    _validateModeConsistency() {
        const validation = {
            valid: true,
            errors: [],
            warnings: [],
            details: {}
        };
        
        try {
            // Get all transactions
            const manualTransactions = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
            const importTransactions = JSON.parse(localStorage.getItem('importBatchTransactions') || '[]');
            
            // Check mode field consistency
            const manualWithWrongMode = manualTransactions.filter(t => 
                t.mode && t.mode !== 'manual'
            );
            
            const importWithWrongMode = importTransactions.filter(t => 
                t.mode && t.mode !== 'import'
            );
            
            if (manualWithWrongMode.length > 0) {
                validation.valid = false;
                validation.errors.push(`${manualWithWrongMode.length} manual transactions with wrong mode`);
            }
            
            if (importWithWrongMode.length > 0) {
                validation.valid = false;
                validation.errors.push(`${importWithWrongMode.length} import transactions with wrong mode`);
            }
            
            // Check for transactions without mode field
            const manualWithoutMode = manualTransactions.filter(t => !t.mode);
            const importWithoutMode = importTransactions.filter(t => !t.mode);
            
            if (manualWithoutMode.length > 0) {
                validation.warnings.push(`${manualWithoutMode.length} manual transactions without mode field`);
            }
            
            if (importWithoutMode.length > 0) {
                validation.warnings.push(`${importWithoutMode.length} import transactions without mode field`);
            }
            
            validation.details.manualWithWrongMode = manualWithWrongMode.length;
            validation.details.importWithWrongMode = importWithWrongMode.length;
            validation.details.manualWithoutMode = manualWithoutMode.length;
            validation.details.importWithoutMode = importWithoutMode.length;
            
        } catch (error) {
            validation.valid = false;
            validation.errors.push(`Mode consistency validation error: ${error.message}`);
        }
        
        return validation;
    }

    /**
     * Attempt to repair specific error
     * @private
     */
    async _attemptErrorRepair(error, validationResult) {
        try {
            // Determine repair strategy based on error type
            let strategy = null;
            let context = {};
            
            if (error.includes('Journal entry tidak ditemukan')) {
                strategy = this.repairStrategies.get('missing_journal');
                // Find transaction context from validation details
                for (const [transactionId, details] of Object.entries(validationResult.details)) {
                    if (details.errors && details.errors.includes(error)) {
                        // Get transaction data
                        const manualTransactions = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
                        const importTransactions = JSON.parse(localStorage.getItem('importBatchTransactions') || '[]');
                        const transaction = [...manualTransactions, ...importTransactions]
                            .find(t => t.id === transactionId);
                        
                        context.transaction = transaction;
                        break;
                    }
                }
            } else if (error.includes('Journal tidak balance')) {
                strategy = this.repairStrategies.get('unbalanced_journal');
                // Find journal context
                const journals = JSON.parse(localStorage.getItem('journals') || '[]');
                context.journal = journals.find(j => 
                    validationResult.details[j.id] && 
                    validationResult.details[j.id].errors.includes(error)
                );
            } else if (error.includes('Saldo') && error.includes('negatif')) {
                strategy = this.repairStrategies.get('negative_saldo');
            }
            
            if (!strategy) {
                return {
                    success: false,
                    reason: 'Tidak ada strategi repair untuk error ini'
                };
            }
            
            return await strategy(error, context);
            
        } catch (error) {
            return {
                success: false,
                reason: `Repair attempt failed: ${error.message}`
            };
        }
    }
}

// Export for both browser and Node.js environments
if (typeof window !== 'undefined') {
    window.DataConsistencyValidator = DataConsistencyValidator;
}

// ES6 export
export { DataConsistencyValidator };

// CommonJS export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataConsistencyValidator };
}