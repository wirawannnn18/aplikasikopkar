/**
 * Enhanced Accounting Integration Module
 * Handles integration between tutup kasir process and accounting system
 * 
 * Feature: perbaikan-menu-tutup-kasir-pos
 * Task 7: Perbaiki integrasi dengan sistem akuntansi
 */

class EnhancedAccountingIntegration {
    constructor() {
        this.coaMapping = {
            kas: 'Kas',
            pendapatanLainLain: 'Pendapatan Lain-lain',
            bebanLainLain: 'Beban Lain-lain',
            modalKasir: 'Modal Kasir',
            penjualan: 'Penjualan'
        };
        
        this.journalValidationRules = {
            requiredFields: ['id', 'tanggal', 'keterangan', 'entries'],
            entryRequiredFields: ['akun', 'debit', 'kredit'],
            maxDescriptionLength: 500,
            maxAmountDigits: 15
        };
        
        // Bind methods
        this.createSelisihJournal = this.createSelisihJournal.bind(this);
        this.updateKasBalance = this.updateKasBalance.bind(this);
        this.validateJournalEntry = this.validateJournalEntry.bind(this);
    }

    /**
     * Creates journal entry for kas selisih with proper COA mapping
     * @param {Object} tutupKasirData - Tutup kasir data
     * @returns {Promise<Object>} Journal creation result
     */
    async createSelisihJournal(tutupKasirData) {
        try {
            // Skip journal creation if no selisih
            if (Math.abs(tutupKasirData.selisih) <= 0.01) {
                return {
                    success: true,
                    message: 'No journal entry needed - selisih is zero',
                    journalId: null
                };
            }

            // Create journal entry structure
            const journalEntry = {
                id: `journal_selisih_${tutupKasirData.id}`,
                tanggal: tutupKasirData.tanggalTutup,
                keterangan: this.buildJournalDescription(tutupKasirData),
                entries: this.buildJournalEntries(tutupKasirData),
                source: 'tutup_kasir',
                sourceId: tutupKasirData.id,
                createdAt: new Date().toISOString(),
                createdBy: tutupKasirData.kasir
            };

            // Validate journal entry
            const validation = this.validateJournalEntry(journalEntry);
            if (!validation.isValid) {
                throw new Error(`Journal validation failed: ${validation.errors.join(', ')}`);
            }

            // Save journal entry
            const saveResult = await this.saveJournalEntry(journalEntry);
            if (!saveResult.success) {
                throw new Error(`Failed to save journal entry: ${saveResult.error}`);
            }

            return {
                success: true,
                journalId: journalEntry.id,
                message: 'Journal entry created successfully',
                amount: Math.abs(tutupKasirData.selisih)
            };

        } catch (error) {
            console.error('Failed to create selisih journal:', error);
            return {
                success: false,
                error: error.message,
                journalId: null
            };
        }
    }

    /**
     * Builds journal description with kasir and keterangan info
     * @param {Object} tutupKasirData - Tutup kasir data
     * @returns {string} Journal description
     */
    buildJournalDescription(tutupKasirData) {
        const baseDescription = `Selisih Kas - ${tutupKasirData.kasir}`;
        const keterangan = tutupKasirData.keteranganSelisih || 'Tidak ada keterangan';
        const selisihType = tutupKasirData.selisih > 0 ? 'Kas Lebih' : 'Kas Kurang';
        
        return `${baseDescription} - ${selisihType} - ${keterangan}`;
    }

    /**
     * Builds journal entries based on selisih direction
     * @param {Object} tutupKasirData - Tutup kasir data
     * @returns {Array} Journal entries
     */
    buildJournalEntries(tutupKasirData) {
        const entries = [];
        const amount = Math.abs(tutupKasirData.selisih);

        if (tutupKasirData.selisih > 0) {
            // Kas lebih - Debit Kas, Kredit Pendapatan Lain-lain
            entries.push({
                akun: this.coaMapping.kas,
                debit: amount,
                kredit: 0,
                keterangan: 'Kas lebih dari perhitungan'
            });
            entries.push({
                akun: this.coaMapping.pendapatanLainLain,
                debit: 0,
                kredit: amount,
                keterangan: 'Pendapatan dari selisih kas lebih'
            });
        } else {
            // Kas kurang - Debit Beban Lain-lain, Kredit Kas
            entries.push({
                akun: this.coaMapping.bebanLainLain,
                debit: amount,
                kredit: 0,
                keterangan: 'Beban selisih kas kurang'
            });
            entries.push({
                akun: this.coaMapping.kas,
                debit: 0,
                kredit: amount,
                keterangan: 'Pengurangan kas karena selisih'
            });
        }

        return entries;
    }

    /**
     * Validates journal entry structure and business rules
     * @param {Object} journalEntry - Journal entry to validate
     * @returns {Object} Validation result
     */
    validateJournalEntry(journalEntry) {
        const errors = [];

        // Check required fields
        this.journalValidationRules.requiredFields.forEach(field => {
            if (!journalEntry[field]) {
                errors.push(`Missing required field: ${field}`);
            }
        });

        // Validate entries
        if (journalEntry.entries && Array.isArray(journalEntry.entries)) {
            if (journalEntry.entries.length === 0) {
                errors.push('Journal must have at least one entry');
            }

            // Validate each entry
            journalEntry.entries.forEach((entry, index) => {
                this.journalValidationRules.entryRequiredFields.forEach(field => {
                    if (entry[field] === undefined || entry[field] === null) {
                        errors.push(`Entry ${index + 1}: Missing required field ${field}`);
                    }
                });

                // Validate amounts
                if (typeof entry.debit !== 'number' || entry.debit < 0) {
                    errors.push(`Entry ${index + 1}: Debit must be a non-negative number`);
                }
                if (typeof entry.kredit !== 'number' || entry.kredit < 0) {
                    errors.push(`Entry ${index + 1}: Kredit must be a non-negative number`);
                }

                // Validate that entry has either debit or kredit (not both non-zero)
                if (entry.debit > 0 && entry.kredit > 0) {
                    errors.push(`Entry ${index + 1}: Entry cannot have both debit and kredit amounts`);
                }
                if (entry.debit === 0 && entry.kredit === 0) {
                    errors.push(`Entry ${index + 1}: Entry must have either debit or kredit amount`);
                }
            });

            // Validate journal balance
            const totalDebit = journalEntry.entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
            const totalKredit = journalEntry.entries.reduce((sum, entry) => sum + (entry.kredit || 0), 0);
            
            if (Math.abs(totalDebit - totalKredit) > 0.01) {
                errors.push(`Journal is not balanced: Debit ${totalDebit}, Kredit ${totalKredit}`);
            }
        } else {
            errors.push('Journal entries must be an array');
        }

        // Validate description length
        if (journalEntry.keterangan && journalEntry.keterangan.length > this.journalValidationRules.maxDescriptionLength) {
            errors.push(`Description too long (max ${this.journalValidationRules.maxDescriptionLength} characters)`);
        }

        // Validate date format
        try {
            new Date(journalEntry.tanggal);
        } catch (e) {
            errors.push('Invalid date format');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Saves journal entry to localStorage with validation
     * @param {Object} journalEntry - Journal entry to save
     * @returns {Promise<Object>} Save result
     */
    async saveJournalEntry(journalEntry) {
        try {
            // Get existing journal entries
            let journalEntries = [];
            const existingData = localStorage.getItem('journalEntries');
            if (existingData) {
                journalEntries = JSON.parse(existingData);
            }

            // Check for duplicate journal ID
            const existingEntry = journalEntries.find(entry => entry.id === journalEntry.id);
            if (existingEntry) {
                return {
                    success: false,
                    error: `Journal entry with ID ${journalEntry.id} already exists`
                };
            }

            // Add new journal entry
            journalEntries.push(journalEntry);

            // Save to localStorage
            localStorage.setItem('journalEntries', JSON.stringify(journalEntries));

            return {
                success: true,
                journalId: journalEntry.id,
                message: 'Journal entry saved successfully'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Updates kas balance in accounting system
     * @param {Object} tutupKasirData - Tutup kasir data
     * @returns {Promise<Object>} Update result
     */
    async updateKasBalance(tutupKasirData) {
        try {
            // Get current kas balance
            let kasBalance = 0;
            const existingBalance = localStorage.getItem('kasBalance');
            if (existingBalance) {
                kasBalance = parseFloat(existingBalance) || 0;
            }

            // Calculate new balance
            const newBalance = kasBalance + tutupKasirData.selisih;

            // Validate new balance (prevent negative balance if configured)
            const allowNegativeBalance = localStorage.getItem('allowNegativeKasBalance') === 'true';
            if (!allowNegativeBalance && newBalance < 0) {
                return {
                    success: false,
                    error: `Operation would result in negative kas balance: ${newBalance}`,
                    currentBalance: kasBalance,
                    requestedChange: tutupKasirData.selisih
                };
            }

            // Save new balance
            localStorage.setItem('kasBalance', newBalance.toString());

            // Create balance history record
            await this.createBalanceHistoryRecord(tutupKasirData, kasBalance, newBalance);

            return {
                success: true,
                previousBalance: kasBalance,
                newBalance: newBalance,
                change: tutupKasirData.selisih,
                message: 'Kas balance updated successfully'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Creates balance history record for audit trail
     * @param {Object} tutupKasirData - Tutup kasir data
     * @param {number} previousBalance - Previous balance
     * @param {number} newBalance - New balance
     */
    async createBalanceHistoryRecord(tutupKasirData, previousBalance, newBalance) {
        try {
            const historyRecord = {
                id: `balance_history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                tanggal: new Date().toISOString(),
                sourceType: 'tutup_kasir',
                sourceId: tutupKasirData.id,
                kasir: tutupKasirData.kasir,
                previousBalance: previousBalance,
                newBalance: newBalance,
                change: tutupKasirData.selisih,
                keterangan: `Tutup kasir - ${tutupKasirData.kasir} - Selisih: ${tutupKasirData.selisih}`
            };

            // Get existing history
            let balanceHistory = [];
            const existingHistory = localStorage.getItem('kasBalanceHistory');
            if (existingHistory) {
                balanceHistory = JSON.parse(existingHistory);
            }

            // Add new record
            balanceHistory.push(historyRecord);

            // Keep only last 1000 records to prevent storage overflow
            if (balanceHistory.length > 1000) {
                balanceHistory = balanceHistory.slice(-1000);
            }

            // Save history
            localStorage.setItem('kasBalanceHistory', JSON.stringify(balanceHistory));

        } catch (error) {
            console.warn('Failed to create balance history record:', error);
        }
    }

    /**
     * Validates COA mapping and ensures accounts exist
     * @param {Array} accountNames - Account names to validate
     * @returns {Object} Validation result
     */
    validateCOAMapping(accountNames) {
        const errors = [];
        const validAccounts = Object.values(this.coaMapping);

        accountNames.forEach(accountName => {
            if (!validAccounts.includes(accountName)) {
                errors.push(`Account '${accountName}' not found in COA mapping`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors: errors,
            validAccounts: validAccounts
        };
    }

    /**
     * Gets journal entries by source
     * @param {string} sourceType - Source type (e.g., 'tutup_kasir')
     * @param {string} sourceId - Source ID
     * @returns {Array} Journal entries
     */
    getJournalEntriesBySource(sourceType, sourceId = null) {
        try {
            const journalEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
            
            return journalEntries.filter(entry => {
                if (sourceId) {
                    return entry.source === sourceType && entry.sourceId === sourceId;
                } else {
                    return entry.source === sourceType;
                }
            });

        } catch (error) {
            console.error('Failed to get journal entries:', error);
            return [];
        }
    }

    /**
     * Gets kas balance history
     * @param {number} limit - Number of records to return
     * @returns {Array} Balance history records
     */
    getKasBalanceHistory(limit = 100) {
        try {
            const balanceHistory = JSON.parse(localStorage.getItem('kasBalanceHistory') || '[]');
            
            // Sort by date (newest first) and limit results
            return balanceHistory
                .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
                .slice(0, limit);

        } catch (error) {
            console.error('Failed to get balance history:', error);
            return [];
        }
    }

    /**
     * Gets current kas balance
     * @returns {number} Current kas balance
     */
    getCurrentKasBalance() {
        try {
            const balance = localStorage.getItem('kasBalance');
            return balance ? parseFloat(balance) : 0;
        } catch (error) {
            console.error('Failed to get current kas balance:', error);
            return 0;
        }
    }

    /**
     * Processes complete tutup kasir accounting integration
     * @param {Object} tutupKasirData - Tutup kasir data
     * @returns {Promise<Object>} Processing result
     */
    async processTutupKasirAccounting(tutupKasirData) {
        const results = {
            success: true,
            journalResult: null,
            balanceResult: null,
            errors: []
        };

        try {
            // Create journal entry for selisih (if any)
            results.journalResult = await this.createSelisihJournal(tutupKasirData);
            if (!results.journalResult.success) {
                results.errors.push(`Journal creation failed: ${results.journalResult.error}`);
                results.success = false;
            }

            // Update kas balance
            results.balanceResult = await this.updateKasBalance(tutupKasirData);
            if (!results.balanceResult.success) {
                results.errors.push(`Balance update failed: ${results.balanceResult.error}`);
                results.success = false;
            }

            return results;

        } catch (error) {
            results.success = false;
            results.errors.push(`Accounting integration failed: ${error.message}`);
            return results;
        }
    }

    /**
     * Gets accounting integration status and health
     * @returns {Object} Status information
     */
    getAccountingStatus() {
        try {
            const kasBalance = this.getCurrentKasBalance();
            const journalEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
            const balanceHistory = JSON.parse(localStorage.getItem('kasBalanceHistory') || '[]');
            
            const tutupKasirJournals = journalEntries.filter(entry => entry.source === 'tutup_kasir');
            const recentHistory = balanceHistory.filter(record => {
                const recordDate = new Date(record.tanggal);
                const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                return recordDate > dayAgo;
            });

            return {
                kasBalance: kasBalance,
                totalJournalEntries: journalEntries.length,
                tutupKasirJournals: tutupKasirJournals.length,
                balanceHistoryRecords: balanceHistory.length,
                recentBalanceChanges: recentHistory.length,
                coaMapping: this.coaMapping,
                lastUpdated: new Date().toISOString()
            };

        } catch (error) {
            return {
                error: error.message,
                kasBalance: 0,
                totalJournalEntries: 0,
                tutupKasirJournals: 0,
                balanceHistoryRecords: 0,
                recentBalanceChanges: 0
            };
        }
    }
}

// Create global instance
window.enhancedAccountingIntegration = new EnhancedAccountingIntegration();

// Export for module usage
export default EnhancedAccountingIntegration;