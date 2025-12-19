/**
 * Transaction Migration Script
 * Requirements: 6.2, 6.5 - Add mode field to existing transaction data
 * 
 * This script migrates existing transaction data to include the new 'mode' field
 * and updates localStorage structure for integration compatibility.
 */

class TransactionMigration {
    constructor() {
        this.version = '1.0.0';
        this.migrationKey = 'transactionMigration_v1';
        this.backupKey = 'pembayaranHutangPiutang_backup_pre_migration';
        this.storageKey = 'pembayaranHutangPiutang';
    }

    /**
     * Check if migration has already been performed
     * @returns {boolean} True if migration already completed
     */
    isMigrationCompleted() {
        try {
            const migrationStatus = localStorage.getItem(this.migrationKey);
            return migrationStatus === 'completed';
        } catch (error) {
            console.error('Error checking migration status:', error);
            return false;
        }
    }

    /**
     * Create backup of existing transaction data
     * Requirements: 6.5 - Ensure backward compatibility
     * @returns {boolean} True if backup successful
     */
    createBackup() {
        try {
            const existingData = localStorage.getItem(this.storageKey);
            if (existingData) {
                const backupData = {
                    data: existingData,
                    timestamp: new Date().toISOString(),
                    version: this.version
                };
                localStorage.setItem(this.backupKey, JSON.stringify(backupData));
                console.log('Transaction data backup created successfully');
                return true;
            }
            return true; // No data to backup
        } catch (error) {
            console.error('Error creating backup:', error);
            return false;
        }
    }

    /**
     * Restore from backup if migration fails
     * @returns {boolean} True if restore successful
     */
    restoreFromBackup() {
        try {
            const backupData = localStorage.getItem(this.backupKey);
            if (backupData) {
                const backup = JSON.parse(backupData);
                localStorage.setItem(this.storageKey, backup.data);
                console.log('Transaction data restored from backup');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error restoring from backup:', error);
            return false;
        }
    }

    /**
     * Add mode field to existing transaction data
     * Requirements: 6.2 - Set existing transactions to 'manual' mode
     * @param {Array} transactions - Array of existing transactions
     * @returns {Array} Migrated transactions with mode field
     */
    addModeField(transactions) {
        return transactions.map(transaction => {
            // Skip if mode field already exists
            if (transaction.mode) {
                return transaction;
            }

            // Add mode field with default value 'manual'
            const migratedTransaction = {
                ...transaction,
                mode: 'manual', // Default to manual for existing transactions
                batchId: null,   // No batch ID for manual transactions
                
                // Add enhanced tracking fields if not present
                processingInfo: transaction.processingInfo || {
                    processedAt: transaction.createdAt || transaction.tanggal || new Date().toISOString(),
                    processedBy: transaction.kasirId || 'unknown',
                    processingMode: 'manual',
                    validationPassed: true,
                    retryCount: 0
                },
                
                // Add audit trail if not present
                auditTrail: transaction.auditTrail || {
                    createdAt: transaction.createdAt || transaction.tanggal || new Date().toISOString(),
                    createdBy: transaction.kasirId || 'unknown',
                    updatedAt: new Date().toISOString(),
                    updatedBy: 'migration_script',
                    version: '2.0'
                },
                
                // Ensure backward compatibility fields exist
                createdAt: transaction.createdAt || transaction.tanggal || new Date().toISOString(),
                updatedAt: transaction.updatedAt || new Date().toISOString()
            };

            return migratedTransaction;
        });
    }

    /**
     * Update localStorage structure
     * Requirements: 6.2, 6.5 - Update localStorage structure
     * @param {Array} migratedTransactions - Migrated transaction data
     * @returns {boolean} True if update successful
     */
    updateLocalStorageStructure(migratedTransactions) {
        try {
            // Save migrated data
            localStorage.setItem(this.storageKey, JSON.stringify(migratedTransactions));
            
            // Mark migration as completed
            localStorage.setItem(this.migrationKey, 'completed');
            localStorage.setItem(this.migrationKey + '_timestamp', new Date().toISOString());
            localStorage.setItem(this.migrationKey + '_version', this.version);
            
            console.log('localStorage structure updated successfully');
            return true;
        } catch (error) {
            console.error('Error updating localStorage structure:', error);
            return false;
        }
    }

    /**
     * Validate migrated data
     * @param {Array} originalTransactions - Original transaction data
     * @param {Array} migratedTransactions - Migrated transaction data
     * @returns {Object} Validation result
     */
    validateMigration(originalTransactions, migratedTransactions) {
        const validation = {
            valid: true,
            errors: [],
            warnings: [],
            statistics: {
                originalCount: originalTransactions.length,
                migratedCount: migratedTransactions.length,
                addedModeFields: 0,
                preservedData: 0
            }
        };

        try {
            // Check count consistency
            if (originalTransactions.length !== migratedTransactions.length) {
                validation.valid = false;
                validation.errors.push('Transaction count mismatch after migration');
            }

            // Validate each migrated transaction
            migratedTransactions.forEach((migrated, index) => {
                const original = originalTransactions[index];
                
                if (!original) {
                    validation.errors.push(`Missing original transaction at index ${index}`);
                    return;
                }

                // Check if mode field was added
                if (!original.mode && migrated.mode === 'manual') {
                    validation.statistics.addedModeFields++;
                }

                // Check data preservation
                const coreFields = ['id', 'anggotaId', 'jenis', 'jumlah', 'tanggal'];
                const dataPreserved = coreFields.every(field => 
                    original[field] === migrated[field]
                );
                
                if (dataPreserved) {
                    validation.statistics.preservedData++;
                } else {
                    validation.errors.push(`Data corruption detected in transaction ${original.id || index}`);
                }

                // Check required new fields
                if (!migrated.mode) {
                    validation.errors.push(`Missing mode field in transaction ${migrated.id || index}`);
                }

                if (!migrated.auditTrail) {
                    validation.warnings.push(`Missing audit trail in transaction ${migrated.id || index}`);
                }
            });

            // Final validation
            if (validation.errors.length > 0) {
                validation.valid = false;
            }

        } catch (error) {
            validation.valid = false;
            validation.errors.push(`Validation error: ${error.message}`);
        }

        return validation;
    }

    /**
     * Perform the complete migration process
     * Requirements: 6.2, 6.5 - Complete migration with error handling
     * @returns {Object} Migration result
     */
    async performMigration() {
        const result = {
            success: false,
            message: '',
            statistics: {},
            errors: [],
            warnings: []
        };

        try {
            // Check if migration already completed
            if (this.isMigrationCompleted()) {
                result.success = true;
                result.message = 'Migration already completed';
                return result;
            }

            console.log('Starting transaction migration...');

            // Step 1: Create backup
            if (!this.createBackup()) {
                result.errors.push('Failed to create backup');
                result.message = 'Migration aborted: backup failed';
                return result;
            }

            // Step 2: Load existing data
            const existingDataStr = localStorage.getItem(this.storageKey);
            const existingTransactions = existingDataStr ? JSON.parse(existingDataStr) : [];
            
            console.log(`Found ${existingTransactions.length} existing transactions`);

            // Step 3: Migrate data
            const migratedTransactions = this.addModeField(existingTransactions);
            
            // Step 4: Validate migration
            const validation = this.validateMigration(existingTransactions, migratedTransactions);
            
            if (!validation.valid) {
                result.errors = validation.errors;
                result.warnings = validation.warnings;
                result.message = 'Migration validation failed';
                
                // Restore from backup
                this.restoreFromBackup();
                return result;
            }

            // Step 5: Update localStorage
            if (!this.updateLocalStorageStructure(migratedTransactions)) {
                result.errors.push('Failed to update localStorage structure');
                result.message = 'Migration failed during localStorage update';
                
                // Restore from backup
                this.restoreFromBackup();
                return result;
            }

            // Success
            result.success = true;
            result.message = 'Migration completed successfully';
            result.statistics = validation.statistics;
            result.warnings = validation.warnings;

            console.log('Transaction migration completed successfully');
            console.log('Statistics:', validation.statistics);

        } catch (error) {
            console.error('Migration error:', error);
            result.errors.push(error.message);
            result.message = 'Migration failed with error';
            
            // Attempt to restore from backup
            this.restoreFromBackup();
        }

        return result;
    }

    /**
     * Get migration status and statistics
     * @returns {Object} Migration status information
     */
    getMigrationStatus() {
        try {
            const isCompleted = this.isMigrationCompleted();
            const timestamp = localStorage.getItem(this.migrationKey + '_timestamp');
            const version = localStorage.getItem(this.migrationKey + '_version');
            
            const currentData = localStorage.getItem(this.storageKey);
            const transactions = currentData ? JSON.parse(currentData) : [];
            
            const modeFieldCount = transactions.filter(t => t.mode).length;
            const manualCount = transactions.filter(t => t.mode === 'manual').length;
            const importCount = transactions.filter(t => t.mode === 'import').length;

            return {
                completed: isCompleted,
                timestamp: timestamp,
                version: version,
                statistics: {
                    totalTransactions: transactions.length,
                    withModeField: modeFieldCount,
                    manualTransactions: manualCount,
                    importTransactions: importCount,
                    needsMigration: transactions.length - modeFieldCount
                }
            };
        } catch (error) {
            console.error('Error getting migration status:', error);
            return {
                completed: false,
                error: error.message
            };
        }
    }

    /**
     * Clean up migration artifacts (backup files, etc.)
     * Call this after confirming migration success
     */
    cleanupMigration() {
        try {
            // Remove backup (optional - keep for safety)
            // localStorage.removeItem(this.backupKey);
            
            console.log('Migration cleanup completed');
            return true;
        } catch (error) {
            console.error('Error during cleanup:', error);
            return false;
        }
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.TransactionMigration = TransactionMigration;
}

// ES Module export
export default TransactionMigration;

// Auto-run migration on load if needed
if (typeof window !== 'undefined') {
    window.addEventListener('load', async () => {
        const migration = new TransactionMigration();
        const status = migration.getMigrationStatus();
        
        if (!status.completed && status.statistics && status.statistics.needsMigration > 0) {
            console.log('Auto-running transaction migration...');
            const result = await migration.performMigration();
            
            if (result.success) {
                console.log('Auto-migration completed successfully');
            } else {
                console.warn('Auto-migration failed:', result.errors);
            }
        }
    });
}