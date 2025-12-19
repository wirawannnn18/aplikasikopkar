/**
 * Accounting Integration - Ensures journal entries follow existing patterns
 * Requirements: 5.2, 7.1, 11.2
 */

/**
 * Integration layer for accounting system
 * Ensures journal entries follow existing patterns and maintain chart of accounts consistency
 */
class AccountingIntegration {
    constructor() {
        this.chartOfAccounts = this._loadChartOfAccounts();
        this.journalEntryPatterns = this._defineJournalPatterns();
    }

    /**
     * Load chart of accounts from system
     * Requirements: 11.2 - Maintain chart of accounts consistency
     * @private
     * @returns {Object} Chart of accounts
     */
    _loadChartOfAccounts() {
        try {
            // Try to load from existing system settings
            const systemSettings = JSON.parse(localStorage.getItem('systemSettings') || '{}');
            if (systemSettings.chartOfAccounts) {
                return systemSettings.chartOfAccounts;
            }

            // Default chart of accounts structure for cooperative system
            return {
                '1-1000': { name: 'Kas', type: 'Aset', category: 'Aset Lancar' },
                '1-1200': { name: 'Piutang Anggota', type: 'Aset', category: 'Aset Lancar' },
                '2-1000': { name: 'Hutang Anggota', type: 'Kewajiban', category: 'Kewajiban Lancar' },
                '3-1000': { name: 'Modal Koperasi', type: 'Modal', category: 'Modal' },
                '4-1000': { name: 'Pendapatan Usaha', type: 'Pendapatan', category: 'Pendapatan' },
                '5-1000': { name: 'Beban Operasional', type: 'Beban', category: 'Beban' }
            };
        } catch (error) {
            console.error('Error loading chart of accounts:', error);
            return {};
        }
    }

    /**
     * Define journal entry patterns for different transaction types
     * Requirements: 11.2 - Ensure journal entries follow existing patterns
     * @private
     * @returns {Object} Journal patterns
     */
    _defineJournalPatterns() {
        return {
            'pembayaran_hutang': {
                description: 'Pembayaran Hutang Anggota',
                entries: [
                    { account: '1-1000', side: 'debit', description: 'Kas bertambah dari pembayaran hutang' },
                    { account: '2-1000', side: 'credit', description: 'Hutang anggota berkurang' }
                ]
            },
            'pembayaran_piutang': {
                description: 'Pembayaran Piutang kepada Anggota',
                entries: [
                    { account: '1-1200', side: 'debit', description: 'Piutang anggota berkurang' },
                    { account: '1-1000', side: 'credit', description: 'Kas berkurang untuk pembayaran piutang' }
                ]
            },
            'batch_pembayaran_hutang': {
                description: 'Batch Pembayaran Hutang Anggota (Import)',
                entries: [
                    { account: '1-1000', side: 'debit', description: 'Kas bertambah dari batch pembayaran hutang' },
                    { account: '2-1000', side: 'credit', description: 'Hutang anggota berkurang (batch)' }
                ]
            },
            'batch_pembayaran_piutang': {
                description: 'Batch Pembayaran Piutang kepada Anggota (Import)',
                entries: [
                    { account: '1-1200', side: 'debit', description: 'Piutang anggota berkurang (batch)' },
                    { account: '1-1000', side: 'credit', description: 'Kas berkurang untuk batch pembayaran piutang' }
                ]
            }
        };
    }

    /**
     * Create journal entry following existing patterns
     * Requirements: 5.2, 7.1, 11.2
     * @param {Object} transaction - Transaction data
     * @param {boolean} isBatch - Whether this is a batch transaction
     * @returns {Object} Journal entry
     */
    createJournalEntry(transaction, isBatch = false) {
        try {
            // Determine transaction type
            const transactionType = this._determineTransactionType(transaction, isBatch);
            const pattern = this.journalEntryPatterns[transactionType];

            if (!pattern) {
                throw new Error(`Unknown transaction type: ${transactionType}`);
            }

            // Create journal entry based on pattern
            const journalEntry = {
                id: this._generateJournalId(),
                tanggal: transaction.tanggal,
                keterangan: this._buildJournalDescription(transaction, pattern.description, isBatch),
                entries: this._buildJournalEntries(transaction, pattern.entries),
                transactionId: transaction.id,
                batchId: transaction.batchId || null,
                module: 'import-tagihan-pembayaran',
                createdAt: new Date().toISOString(),
                createdBy: transaction.kasirId || 'system'
            };

            // Validate journal entry
            this._validateJournalEntry(journalEntry);

            // Save journal entry
            this._saveJournalEntry(journalEntry);

            return journalEntry;

        } catch (error) {
            console.error('Error creating journal entry:', error);
            throw new Error(`Gagal mencatat jurnal: ${error.message}`);
        }
    }

    /**
     * Determine transaction type for journal pattern
     * Requirements: 11.2
     * @private
     * @param {Object} transaction - Transaction data
     * @param {boolean} isBatch - Whether this is a batch transaction
     * @returns {string} Transaction type
     */
    _determineTransactionType(transaction, isBatch) {
        const baseType = transaction.jenis === 'hutang' ? 'pembayaran_hutang' : 'pembayaran_piutang';
        return isBatch ? `batch_${baseType}` : baseType;
    }

    /**
     * Build journal description
     * Requirements: 11.2
     * @private
     * @param {Object} transaction - Transaction data
     * @param {string} baseDescription - Base description from pattern
     * @param {boolean} isBatch - Whether this is a batch transaction
     * @returns {string} Journal description
     */
    _buildJournalDescription(transaction, baseDescription, isBatch) {
        let description = baseDescription;
        
        if (isBatch) {
            description += ` - ${transaction.anggotaNama} (Batch: ${transaction.batchId})`;
        } else {
            description += ` - ${transaction.anggotaNama}`;
        }

        if (transaction.keterangan) {
            description += ` - ${transaction.keterangan}`;
        }

        return description;
    }

    /**
     * Build journal entries from pattern
     * Requirements: 11.2 - Preserve double-entry bookkeeping rules
     * @private
     * @param {Object} transaction - Transaction data
     * @param {Array} entryPatterns - Entry patterns
     * @returns {Array} Journal entries
     */
    _buildJournalEntries(transaction, entryPatterns) {
        return entryPatterns.map(pattern => {
            const entry = {
                akun: pattern.account,
                debit: pattern.side === 'debit' ? transaction.jumlah : 0,
                kredit: pattern.side === 'credit' ? transaction.jumlah : 0,
                keterangan: pattern.description
            };

            // Validate account exists in chart of accounts
            if (!this.chartOfAccounts[pattern.account]) {
                console.warn(`Account ${pattern.account} not found in chart of accounts`);
            }

            return entry;
        });
    }

    /**
     * Validate journal entry follows double-entry bookkeeping rules
     * Requirements: 11.2 - Preserve double-entry bookkeeping rules
     * @private
     * @param {Object} journalEntry - Journal entry to validate
     */
    _validateJournalEntry(journalEntry) {
        if (!journalEntry.entries || journalEntry.entries.length === 0) {
            throw new Error('Journal entry must have at least one entry');
        }

        // Calculate total debits and credits
        const totalDebits = journalEntry.entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
        const totalCredits = journalEntry.entries.reduce((sum, entry) => sum + (entry.kredit || 0), 0);

        // Validate double-entry rule: debits must equal credits
        if (Math.abs(totalDebits - totalCredits) > 0.01) { // Allow for small rounding differences
            throw new Error(`Journal entry not balanced: Debits (${totalDebits}) != Credits (${totalCredits})`);
        }

        // Validate each entry
        journalEntry.entries.forEach((entry, index) => {
            if (!entry.akun) {
                throw new Error(`Entry ${index + 1}: Account code is required`);
            }

            if ((entry.debit || 0) < 0 || (entry.kredit || 0) < 0) {
                throw new Error(`Entry ${index + 1}: Debit and credit amounts cannot be negative`);
            }

            if ((entry.debit || 0) > 0 && (entry.kredit || 0) > 0) {
                throw new Error(`Entry ${index + 1}: Entry cannot have both debit and credit amounts`);
            }

            if ((entry.debit || 0) === 0 && (entry.kredit || 0) === 0) {
                throw new Error(`Entry ${index + 1}: Entry must have either debit or credit amount`);
            }
        });
    }

    /**
     * Save journal entry to storage
     * Requirements: 7.1, 11.2
     * @private
     * @param {Object} journalEntry - Journal entry to save
     */
    _saveJournalEntry(journalEntry) {
        try {
            // Use existing addJurnal function if available
            if (typeof addJurnal === 'function') {
                addJurnal(journalEntry.keterangan, journalEntry.entries, journalEntry.tanggal);
                return;
            }

            // Fallback: save directly to localStorage
            const jurnalList = JSON.parse(localStorage.getItem('jurnal') || '[]');
            jurnalList.push(journalEntry);
            localStorage.setItem('jurnal', JSON.stringify(jurnalList));

        } catch (error) {
            console.error('Error saving journal entry:', error);
            throw new Error('Gagal menyimpan jurnal ke database');
        }
    }

    /**
     * Rollback journal entry
     * Requirements: 8.4, 11.2
     * @param {string} transactionId - Transaction ID to rollback
     * @returns {boolean} Rollback success
     */
    rollbackJournalEntry(transactionId) {
        try {
            const jurnalList = JSON.parse(localStorage.getItem('jurnal') || '[]');
            const filteredJurnal = jurnalList.filter(j => j.transactionId !== transactionId);
            
            if (filteredJurnal.length < jurnalList.length) {
                localStorage.setItem('jurnal', JSON.stringify(filteredJurnal));
                console.log(`Journal entry for transaction ${transactionId} rolled back`);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error rolling back journal entry:', error);
            return false;
        }
    }

    /**
     * Rollback batch journal entries
     * Requirements: 8.4, 11.2
     * @param {string} batchId - Batch ID to rollback
     * @returns {Object} Rollback result
     */
    rollbackBatchJournalEntries(batchId) {
        try {
            const jurnalList = JSON.parse(localStorage.getItem('jurnal') || '[]');
            const batchEntries = jurnalList.filter(j => j.batchId === batchId);
            const filteredJurnal = jurnalList.filter(j => j.batchId !== batchId);
            
            if (batchEntries.length > 0) {
                localStorage.setItem('jurnal', JSON.stringify(filteredJurnal));
                console.log(`${batchEntries.length} journal entries for batch ${batchId} rolled back`);
                
                return {
                    success: true,
                    rolledBackCount: batchEntries.length,
                    rolledBackEntries: batchEntries.map(e => e.id)
                };
            }

            return {
                success: true,
                rolledBackCount: 0,
                message: 'No journal entries found for batch'
            };

        } catch (error) {
            console.error('Error rolling back batch journal entries:', error);
            return {
                success: false,
                error: error.message,
                rolledBackCount: 0
            };
        }
    }

    /**
     * Validate chart of accounts consistency
     * Requirements: 11.2 - Maintain chart of accounts consistency
     * @returns {Object} Validation result
     */
    validateChartOfAccountsConsistency() {
        const issues = [];
        const requiredAccounts = ['1-1000', '1-1200', '2-1000'];

        // Check required accounts exist
        requiredAccounts.forEach(accountCode => {
            if (!this.chartOfAccounts[accountCode]) {
                issues.push(`Required account ${accountCode} not found in chart of accounts`);
            }
        });

        // Check account structure
        Object.keys(this.chartOfAccounts).forEach(accountCode => {
            const account = this.chartOfAccounts[accountCode];
            
            if (!account.name) {
                issues.push(`Account ${accountCode} missing name`);
            }
            
            if (!account.type) {
                issues.push(`Account ${accountCode} missing type`);
            }
            
            if (!account.category) {
                issues.push(`Account ${accountCode} missing category`);
            }
        });

        return {
            valid: issues.length === 0,
            issues: issues,
            accountCount: Object.keys(this.chartOfAccounts).length
        };
    }

    /**
     * Get journal entry statistics
     * Requirements: 7.1
     * @param {string} batchId - Optional batch ID filter
     * @returns {Object} Statistics
     */
    getJournalStatistics(batchId = null) {
        try {
            const jurnalList = JSON.parse(localStorage.getItem('jurnal') || '[]');
            let filteredJurnal = jurnalList;

            if (batchId) {
                filteredJurnal = jurnalList.filter(j => j.batchId === batchId);
            }

            const stats = {
                totalEntries: filteredJurnal.length,
                totalDebitAmount: 0,
                totalCreditAmount: 0,
                accountsUsed: new Set(),
                dateRange: {
                    earliest: null,
                    latest: null
                }
            };

            filteredJurnal.forEach(journal => {
                if (journal.entries) {
                    journal.entries.forEach(entry => {
                        stats.totalDebitAmount += entry.debit || 0;
                        stats.totalCreditAmount += entry.kredit || 0;
                        stats.accountsUsed.add(entry.akun);
                    });
                }

                // Track date range
                if (journal.tanggal) {
                    const entryDate = new Date(journal.tanggal);
                    if (!stats.dateRange.earliest || entryDate < stats.dateRange.earliest) {
                        stats.dateRange.earliest = entryDate;
                    }
                    if (!stats.dateRange.latest || entryDate > stats.dateRange.latest) {
                        stats.dateRange.latest = entryDate;
                    }
                }
            });

            stats.accountsUsed = Array.from(stats.accountsUsed);
            stats.isBalanced = Math.abs(stats.totalDebitAmount - stats.totalCreditAmount) < 0.01;

            return stats;

        } catch (error) {
            console.error('Error getting journal statistics:', error);
            return {
                totalEntries: 0,
                totalDebitAmount: 0,
                totalCreditAmount: 0,
                accountsUsed: [],
                dateRange: { earliest: null, latest: null },
                isBalanced: true,
                error: error.message
            };
        }
    }

    /**
     * Generate unique journal ID
     * @private
     * @returns {string} Unique journal ID
     */
    _generateJournalId() {
        return `JRN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get integration status
     * @returns {Object} Integration status
     */
    getIntegrationStatus() {
        const chartValidation = this.validateChartOfAccountsConsistency();
        
        return {
            chartOfAccountsLoaded: Object.keys(this.chartOfAccounts).length > 0,
            chartOfAccountsValid: chartValidation.valid,
            chartOfAccountsIssues: chartValidation.issues,
            journalPatternsLoaded: Object.keys(this.journalEntryPatterns).length > 0,
            addJurnalFunctionAvailable: typeof addJurnal === 'function',
            storageAvailable: typeof localStorage !== 'undefined'
        };
    }
}

// Export for both browser and Node.js environments
if (typeof window !== 'undefined') {
    window.AccountingIntegration = AccountingIntegration;
}

// ES Module export
export { AccountingIntegration };

// CommonJS export for compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AccountingIntegration };
}