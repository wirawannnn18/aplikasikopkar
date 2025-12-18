/**
 * Enhanced Tutup Kasir Data Persistence Module
 * Handles data persistence, atomic operations, and retry mechanisms for tutup kasir process
 * 
 * Feature: perbaikan-menu-tutup-kasir-pos
 * Task 6: Perbaiki proses tutup kasir dan data persistence
 */

class EnhancedTutupKasirDataPersistence {
    constructor() {
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second
        this.backupPrefix = 'backup_';
        this.transactionTimeout = 30000; // 30 seconds
        
        // Initialize error tracking
        this.errorLog = [];
        this.lastBackupTime = null;
        
        // Bind methods
        this.saveWithRetry = this.saveWithRetry.bind(this);
        this.performAtomicOperation = this.performAtomicOperation.bind(this);
        this.validateDataIntegrity = this.validateDataIntegrity.bind(this);
    }

    /**
     * Validates tutup kasir data structure and integrity
     * @param {Object} tutupKasirData - Data to validate
     * @returns {Object} Validation result with isValid and errors
     */
    validateDataIntegrity(tutupKasirData) {
        const errors = [];
        const requiredFields = [
            'id', 'shiftId', 'kasir', 'kasirId', 'waktuBuka', 'waktuTutup',
            'modalAwal', 'totalPenjualan', 'kasSeharusnya', 'kasAktual', 'selisih'
        ];

        // Check required fields
        requiredFields.forEach(field => {
            if (tutupKasirData[field] === undefined || tutupKasirData[field] === null) {
                errors.push(`Missing required field: ${field}`);
            }
        });

        // Validate data types and ranges
        if (typeof tutupKasirData.modalAwal !== 'number' || tutupKasirData.modalAwal < 0) {
            errors.push('Modal awal must be a non-negative number');
        }

        if (typeof tutupKasirData.totalPenjualan !== 'number' || tutupKasirData.totalPenjualan < 0) {
            errors.push('Total penjualan must be a non-negative number');
        }

        if (typeof tutupKasirData.kasAktual !== 'number' || tutupKasirData.kasAktual < 0) {
            errors.push('Kas aktual must be a non-negative number');
        }

        // Validate calculation consistency
        const expectedKasSeharusnya = tutupKasirData.modalAwal + (tutupKasirData.totalCash || 0);
        const calculatedSelisih = tutupKasirData.kasAktual - tutupKasirData.kasSeharusnya;
        
        if (Math.abs(calculatedSelisih - tutupKasirData.selisih) > 0.01) {
            errors.push('Selisih calculation is inconsistent');
        }

        // Validate dates
        try {
            const waktuBuka = new Date(tutupKasirData.waktuBuka);
            const waktuTutup = new Date(tutupKasirData.waktuTutup);
            
            if (waktuTutup <= waktuBuka) {
                errors.push('Waktu tutup must be after waktu buka');
            }
        } catch (e) {
            errors.push('Invalid date format in waktu buka or waktu tutup');
        }

        // Validate keterangan requirement for non-zero selisih
        if (Math.abs(tutupKasirData.selisih) > 0.01 && !tutupKasirData.keteranganSelisih) {
            errors.push('Keterangan selisih is required when selisih is not zero');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Creates a backup of current data before operations
     * @param {string} key - Storage key
     * @param {*} data - Data to backup
     */
    createBackup(key, data) {
        try {
            const backupKey = this.backupPrefix + key + '_' + Date.now();
            localStorage.setItem(backupKey, JSON.stringify({
                originalKey: key,
                timestamp: new Date().toISOString(),
                data: data
            }));
            
            this.lastBackupTime = Date.now();
            
            // Clean old backups (keep only last 5)
            this.cleanOldBackups(key);
            
        } catch (error) {
            console.warn('Failed to create backup:', error);
            this.logError('backup_creation_failed', error);
        }
    }

    /**
     * Cleans old backup files to prevent storage overflow
     * @param {string} key - Original storage key
     */
    cleanOldBackups(key) {
        try {
            const backupKeys = [];
            const prefix = this.backupPrefix + key + '_';
            
            for (let i = 0; i < localStorage.length; i++) {
                const storageKey = localStorage.key(i);
                if (storageKey && storageKey.startsWith(prefix)) {
                    backupKeys.push(storageKey);
                }
            }
            
            // Sort by timestamp (newest first)
            backupKeys.sort((a, b) => {
                const timestampA = parseInt(a.split('_').pop());
                const timestampB = parseInt(b.split('_').pop());
                return timestampB - timestampA;
            });
            
            // Remove old backups (keep only 5 most recent)
            backupKeys.slice(5).forEach(backupKey => {
                localStorage.removeItem(backupKey);
            });
            
        } catch (error) {
            console.warn('Failed to clean old backups:', error);
        }
    }

    /**
     * Performs atomic operation with rollback capability
     * @param {Function} operation - Operation to perform
     * @param {Object} context - Operation context
     * @returns {Promise<Object>} Operation result
     */
    async performAtomicOperation(operation, context = {}) {
        const operationId = 'op_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const startTime = Date.now();
        
        // Create snapshots of current state
        const snapshots = {};
        const keysToBackup = ['riwayatTutupKas', 'bukaKas', 'kasBalance'];
        
        keysToBackup.forEach(key => {
            const currentData = localStorage.getItem(key);
            if (currentData) {
                snapshots[key] = currentData;
                this.createBackup(key, JSON.parse(currentData));
            }
        });
        
        try {
            // Set operation timeout
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Operation timeout')), this.transactionTimeout);
            });

            // Execute operation with timeout
            const result = await Promise.race([
                operation(context),
                timeoutPromise
            ]);

            // Validate result
            if (!result || result.success === false) {
                throw new Error(result?.error || 'Operation failed');
            }

            // Log successful operation
            this.logOperation(operationId, 'success', Date.now() - startTime);
            
            return {
                success: true,
                operationId: operationId,
                duration: Date.now() - startTime,
                result: result
            };

        } catch (error) {
            // Rollback on error
            try {
                Object.keys(snapshots).forEach(key => {
                    localStorage.setItem(key, snapshots[key]);
                });
                
                this.logError('atomic_operation_failed', error, {
                    operationId: operationId,
                    duration: Date.now() - startTime,
                    context: context
                });
                
            } catch (rollbackError) {
                this.logError('rollback_failed', rollbackError, {
                    originalError: error.message,
                    operationId: operationId
                });
            }

            return {
                success: false,
                error: error.message,
                operationId: operationId,
                duration: Date.now() - startTime
            };
        }
    }

    /**
     * Saves data with retry mechanism
     * @param {string} key - Storage key
     * @param {*} data - Data to save
     * @param {number} attempt - Current attempt number
     * @returns {Promise<Object>} Save result
     */
    async saveWithRetry(key, data, attempt = 1) {
        try {
            // Validate data before saving
            if (key === 'riwayatTutupKas' && Array.isArray(data)) {
                for (const item of data) {
                    const validation = this.validateDataIntegrity(item);
                    if (!validation.isValid) {
                        throw new Error(`Data validation failed: ${validation.errors.join(', ')}`);
                    }
                }
            }

            // Check storage availability
            const testKey = 'storage_test_' + Date.now();
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);

            // Create backup before saving
            const existingData = localStorage.getItem(key);
            if (existingData) {
                this.createBackup(key, JSON.parse(existingData));
            }

            // Save data
            localStorage.setItem(key, JSON.stringify(data));
            
            // Verify save was successful
            const savedData = localStorage.getItem(key);
            if (!savedData || JSON.stringify(JSON.parse(savedData)) !== JSON.stringify(data)) {
                throw new Error('Data verification failed after save');
            }

            return {
                success: true,
                attempt: attempt,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            this.logError('save_attempt_failed', error, {
                key: key,
                attempt: attempt,
                dataSize: JSON.stringify(data).length
            });

            if (attempt < this.maxRetries) {
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
                
                // Try to free up storage space
                if (error.name === 'QuotaExceededError') {
                    this.cleanupStorage();
                }
                
                return this.saveWithRetry(key, data, attempt + 1);
            }

            return {
                success: false,
                error: error.message,
                attempts: attempt,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Cleans up storage to free space
     */
    cleanupStorage() {
        try {
            // Remove old backups
            const keysToClean = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.backupPrefix)) {
                    const timestamp = parseInt(key.split('_').pop());
                    const age = Date.now() - timestamp;
                    // Remove backups older than 24 hours
                    if (age > 24 * 60 * 60 * 1000) {
                        keysToClean.push(key);
                    }
                }
            }
            
            keysToClean.forEach(key => localStorage.removeItem(key));
            
            // Clean error logs older than 7 days
            this.errorLog = this.errorLog.filter(log => {
                const age = Date.now() - new Date(log.timestamp).getTime();
                return age < 7 * 24 * 60 * 60 * 1000;
            });
            
        } catch (error) {
            console.warn('Storage cleanup failed:', error);
        }
    }

    /**
     * Saves tutup kasir data with full validation and atomic operations
     * @param {Object} tutupKasirData - Tutup kasir data to save
     * @returns {Promise<Object>} Save result
     */
    async saveTutupKasirData(tutupKasirData) {
        return this.performAtomicOperation(async (context) => {
            // Validate data integrity
            const validation = this.validateDataIntegrity(tutupKasirData);
            if (!validation.isValid) {
                throw new Error(`Data validation failed: ${validation.errors.join(', ')}`);
            }

            // Get existing riwayat
            let riwayatTutupKas = [];
            try {
                const existingData = localStorage.getItem('riwayatTutupKas');
                if (existingData) {
                    riwayatTutupKas = JSON.parse(existingData);
                }
            } catch (error) {
                console.warn('Failed to load existing riwayat, starting fresh:', error);
                riwayatTutupKas = [];
            }

            // Add new data
            riwayatTutupKas.push(tutupKasirData);

            // Save with retry
            const saveResult = await this.saveWithRetry('riwayatTutupKas', riwayatTutupKas);
            if (!saveResult.success) {
                throw new Error(`Failed to save riwayat: ${saveResult.error}`);
            }

            // Clear session data
            sessionStorage.removeItem('bukaKas');
            
            // Update kas balance if needed
            if (Math.abs(tutupKasirData.selisih) > 0.01) {
                await this.updateKasBalance(tutupKasirData);
            }

            return {
                success: true,
                tutupKasirId: tutupKasirData.id,
                savedAt: new Date().toISOString()
            };
        });
    }

    /**
     * Updates kas balance in accounting system using enhanced integration
     * @param {Object} tutupKasirData - Tutup kasir data
     */
    async updateKasBalance(tutupKasirData) {
        try {
            // Use enhanced accounting integration if available
            if (window.enhancedAccountingIntegration) {
                const result = await window.enhancedAccountingIntegration.processTutupKasirAccounting(tutupKasirData);
                if (!result.success) {
                    throw new Error(`Accounting integration failed: ${result.errors.join(', ')}`);
                }
                return result;
            }

            // Fallback to original implementation
            // Get current kas balance
            let kasBalance = 0;
            const existingBalance = localStorage.getItem('kasBalance');
            if (existingBalance) {
                kasBalance = parseFloat(existingBalance) || 0;
            }

            // Update balance with selisih
            const newBalance = kasBalance + tutupKasirData.selisih;
            
            // Save updated balance
            const saveResult = await this.saveWithRetry('kasBalance', newBalance);
            if (!saveResult.success) {
                throw new Error(`Failed to update kas balance: ${saveResult.error}`);
            }

            // Create journal entry for selisih if needed
            if (Math.abs(tutupKasirData.selisih) > 0.01) {
                await this.createSelisihJournalEntry(tutupKasirData);
            }

            return { 
                success: true, 
                balanceResult: { 
                    previousBalance: kasBalance, 
                    newBalance: newBalance, 
                    change: tutupKasirData.selisih 
                } 
            };

        } catch (error) {
            this.logError('kas_balance_update_failed', error, {
                tutupKasirId: tutupKasirData.id,
                selisih: tutupKasirData.selisih
            });
            throw error;
        }
    }

    /**
     * Creates journal entry for kas selisih using enhanced accounting integration
     * @param {Object} tutupKasirData - Tutup kasir data
     */
    async createSelisihJournalEntry(tutupKasirData) {
        try {
            // Use enhanced accounting integration if available
            if (window.enhancedAccountingIntegration) {
                const result = await window.enhancedAccountingIntegration.createSelisihJournal(tutupKasirData);
                if (!result.success) {
                    throw new Error(result.error);
                }
                return result;
            }

            // Fallback to original implementation
            const journalEntry = {
                id: 'journal_selisih_' + tutupKasirData.id,
                tanggal: tutupKasirData.tanggalTutup,
                keterangan: `Selisih Kas - ${tutupKasirData.kasir} - ${tutupKasirData.keteranganSelisih || 'Tidak ada keterangan'}`,
                entries: []
            };

            if (tutupKasirData.selisih > 0) {
                // Kas lebih - Pendapatan Lain-lain
                journalEntry.entries.push({
                    akun: 'Kas',
                    debit: tutupKasirData.selisih,
                    kredit: 0
                });
                journalEntry.entries.push({
                    akun: 'Pendapatan Lain-lain',
                    debit: 0,
                    kredit: tutupKasirData.selisih
                });
            } else {
                // Kas kurang - Beban Lain-lain
                const absSelisih = Math.abs(tutupKasirData.selisih);
                journalEntry.entries.push({
                    akun: 'Beban Lain-lain',
                    debit: absSelisih,
                    kredit: 0
                });
                journalEntry.entries.push({
                    akun: 'Kas',
                    debit: 0,
                    kredit: absSelisih
                });
            }

            // Save journal entry
            let journalEntries = [];
            const existingJournal = localStorage.getItem('journalEntries');
            if (existingJournal) {
                journalEntries = JSON.parse(existingJournal);
            }

            journalEntries.push(journalEntry);
            
            const saveResult = await this.saveWithRetry('journalEntries', journalEntries);
            if (!saveResult.success) {
                throw new Error(`Failed to save journal entry: ${saveResult.error}`);
            }

            return { success: true, journalId: journalEntry.id };

        } catch (error) {
            this.logError('journal_entry_creation_failed', error, {
                tutupKasirId: tutupKasirData.id,
                selisih: tutupKasirData.selisih
            });
            // Don't throw here - journal creation failure shouldn't stop tutup kasir
            console.warn('Journal entry creation failed, but tutup kasir will continue:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Recovers data from backup
     * @param {string} key - Storage key to recover
     * @returns {Object} Recovery result
     */
    recoverFromBackup(key) {
        try {
            const backupKeys = [];
            const prefix = this.backupPrefix + key + '_';
            
            for (let i = 0; i < localStorage.length; i++) {
                const storageKey = localStorage.key(i);
                if (storageKey && storageKey.startsWith(prefix)) {
                    backupKeys.push(storageKey);
                }
            }
            
            if (backupKeys.length === 0) {
                return { success: false, error: 'No backup found' };
            }
            
            // Get most recent backup
            backupKeys.sort((a, b) => {
                const timestampA = parseInt(a.split('_').pop());
                const timestampB = parseInt(b.split('_').pop());
                return timestampB - timestampA;
            });
            
            const latestBackup = localStorage.getItem(backupKeys[0]);
            const backupData = JSON.parse(latestBackup);
            
            // Restore data
            localStorage.setItem(key, JSON.stringify(backupData.data));
            
            return {
                success: true,
                backupTimestamp: backupData.timestamp,
                recoveredKey: key
            };
            
        } catch (error) {
            this.logError('backup_recovery_failed', error, { key: key });
            return { success: false, error: error.message };
        }
    }

    /**
     * Logs operation for audit trail
     * @param {string} operationId - Operation ID
     * @param {string} status - Operation status
     * @param {number} duration - Operation duration in ms
     */
    logOperation(operationId, status, duration) {
        const logEntry = {
            operationId: operationId,
            status: status,
            duration: duration,
            timestamp: new Date().toISOString(),
            type: 'operation'
        };
        
        console.log('Operation logged:', logEntry);
    }

    /**
     * Logs error for debugging and monitoring
     * @param {string} errorType - Type of error
     * @param {Error} error - Error object
     * @param {Object} context - Additional context
     */
    logError(errorType, error, context = {}) {
        const errorEntry = {
            type: errorType,
            message: error.message,
            stack: error.stack,
            context: context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };
        
        this.errorLog.push(errorEntry);
        
        // Keep only last 100 errors
        if (this.errorLog.length > 100) {
            this.errorLog = this.errorLog.slice(-100);
        }
        
        console.error('Error logged:', errorEntry);
    }

    /**
     * Gets error log for debugging
     * @returns {Array} Error log entries
     */
    getErrorLog() {
        return [...this.errorLog];
    }

    /**
     * Clears error log
     */
    clearErrorLog() {
        this.errorLog = [];
    }

    /**
     * Gets system health status
     * @returns {Object} Health status
     */
    getHealthStatus() {
        const now = Date.now();
        const recentErrors = this.errorLog.filter(error => {
            const errorTime = new Date(error.timestamp).getTime();
            return now - errorTime < 60 * 60 * 1000; // Last hour
        });

        return {
            status: recentErrors.length > 10 ? 'unhealthy' : 'healthy',
            recentErrorCount: recentErrors.length,
            lastBackupTime: this.lastBackupTime,
            storageUsage: this.getStorageUsage(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Gets storage usage information
     * @returns {Object} Storage usage stats
     */
    getStorageUsage() {
        try {
            let totalSize = 0;
            let itemCount = 0;
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                totalSize += key.length + value.length;
                itemCount++;
            }
            
            return {
                totalSize: totalSize,
                itemCount: itemCount,
                estimatedQuota: 5 * 1024 * 1024, // 5MB typical quota
                usagePercentage: (totalSize / (5 * 1024 * 1024)) * 100
            };
            
        } catch (error) {
            return {
                error: error.message,
                totalSize: 0,
                itemCount: 0
            };
        }
    }
}

// Create global instance
window.enhancedTutupKasirDataPersistence = new EnhancedTutupKasirDataPersistence();

// Export for module usage
export default EnhancedTutupKasirDataPersistence;