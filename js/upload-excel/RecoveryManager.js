/**
 * Recovery and Rollback Manager for Excel Upload System
 * Handles error recovery strategies and rollback functionality
 * 
 * Requirements: 5.3, 6.5
 */

class RecoveryManager {
    constructor() {
        this.backupKey = 'excel_upload_backup';
        this.sessionKey = 'excel_upload_session';
        this.recoveryStrategies = new Map();
        this.rollbackStack = [];
        this.maxBackups = 10;
        
        this.initializeStrategies();
    }

    /**
     * Initialize recovery strategies
     */
    initializeStrategies() {
        // File parsing recovery
        this.recoveryStrategies.set('FILE_PARSING_ERROR', {
            strategy: 'retry_with_fallback',
            maxRetries: 3,
            fallbackOptions: ['csv_parser', 'manual_delimiter_detection', 'encoding_detection'],
            description: 'Mencoba parsing ulang dengan metode alternatif'
        });

        // Validation error recovery
        this.recoveryStrategies.set('VALIDATION_ERROR', {
            strategy: 'partial_import',
            maxRetries: 1,
            fallbackOptions: ['skip_invalid_rows', 'fix_common_errors', 'interactive_correction'],
            description: 'Import data yang valid, lewati yang error'
        });

        // Storage error recovery
        this.recoveryStrategies.set('STORAGE_ERROR', {
            strategy: 'retry_with_delay',
            maxRetries: 5,
            fallbackOptions: ['localStorage_fallback', 'session_storage', 'memory_only'],
            description: 'Coba simpan ulang dengan delay bertingkat'
        });

        // Memory error recovery
        this.recoveryStrategies.set('MEMORY_ERROR', {
            strategy: 'chunk_processing',
            maxRetries: 2,
            fallbackOptions: ['reduce_chunk_size', 'progressive_loading', 'background_processing'],
            description: 'Proses data dalam chunk yang lebih kecil'
        });

        // Network error recovery
        this.recoveryStrategies.set('NETWORK_ERROR', {
            strategy: 'offline_mode',
            maxRetries: 3,
            fallbackOptions: ['queue_for_retry', 'local_storage', 'export_for_manual_import'],
            description: 'Simpan data untuk diproses saat koneksi pulih'
        });
    }

    /**
     * Create backup before processing
     * @param {Object} data - Data to backup
     * @param {string} operation - Operation being performed
     */
    createBackup(data, operation) {
        try {
            const backup = {
                id: this.generateBackupId(),
                timestamp: new Date().toISOString(),
                operation: operation,
                data: JSON.parse(JSON.stringify(data)), // Deep clone
                metadata: {
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                    sessionId: this.getSessionId()
                }
            };

            // Get existing backups
            const existingBackups = this.getBackups();
            
            // Add new backup
            existingBackups.unshift(backup);
            
            // Keep only max backups
            if (existingBackups.length > this.maxBackups) {
                existingBackups.splice(this.maxBackups);
            }
            
            // Save to localStorage
            localStorage.setItem(this.backupKey, JSON.stringify(existingBackups));
            
            // Add to rollback stack
            this.rollbackStack.push(backup.id);
            
            console.log(`Backup created: ${backup.id} for operation: ${operation}`);
            return backup.id;
            
        } catch (error) {
            console.error('Failed to create backup:', error);
            return null;
        }
    }

    /**
     * Get all backups
     */
    getBackups() {
        try {
            const backups = localStorage.getItem(this.backupKey);
            return backups ? JSON.parse(backups) : [];
        } catch (error) {
            console.error('Failed to get backups:', error);
            return [];
        }
    }

    /**
     * Get specific backup by ID
     * @param {string} backupId - Backup ID
     */
    getBackup(backupId) {
        const backups = this.getBackups();
        return backups.find(backup => backup.id === backupId);
    }

    /**
     * Perform rollback to previous state
     * @param {string} backupId - Backup ID to rollback to (optional, uses latest if not provided)
     */
    async rollback(backupId = null) {
        try {
            let backup;
            
            if (backupId) {
                backup = this.getBackup(backupId);
            } else {
                // Use latest backup
                const backups = this.getBackups();
                backup = backups[0];
            }
            
            if (!backup) {
                throw new Error('No backup found for rollback');
            }
            
            console.log(`Rolling back to backup: ${backup.id}`);
            
            // Restore data based on operation type
            const success = await this.restoreFromBackup(backup);
            
            if (success) {
                // Remove rolled back operations from stack
                const rollbackIndex = this.rollbackStack.indexOf(backup.id);
                if (rollbackIndex !== -1) {
                    this.rollbackStack.splice(0, rollbackIndex + 1);
                }
                
                return {
                    success: true,
                    backupId: backup.id,
                    timestamp: backup.timestamp,
                    operation: backup.operation
                };
            } else {
                throw new Error('Failed to restore from backup');
            }
            
        } catch (error) {
            console.error('Rollback failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Restore data from backup
     * @param {Object} backup - Backup object
     */
    async restoreFromBackup(backup) {
        try {
            switch (backup.operation) {
                case 'file_upload':
                    return this.restoreFileUpload(backup.data);
                    
                case 'data_processing':
                    return this.restoreDataProcessing(backup.data);
                    
                case 'validation':
                    return this.restoreValidation(backup.data);
                    
                case 'import':
                    return this.restoreImport(backup.data);
                    
                default:
                    console.warn(`Unknown operation type for restore: ${backup.operation}`);
                    return false;
            }
        } catch (error) {
            console.error('Failed to restore from backup:', error);
            return false;
        }
    }

    /**
     * Restore file upload state
     * @param {Object} data - Backup data
     */
    restoreFileUpload(data) {
        try {
            // Clear current file input
            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput) {
                fileInput.value = '';
            }
            
            // Clear preview
            const previewContainer = document.getElementById('dataPreview');
            if (previewContainer) {
                previewContainer.innerHTML = '';
            }
            
            // Reset wizard to first step
            this.resetWizardToStep(1);
            
            return true;
        } catch (error) {
            console.error('Failed to restore file upload:', error);
            return false;
        }
    }

    /**
     * Restore data processing state
     * @param {Object} data - Backup data
     */
    restoreDataProcessing(data) {
        try {
            // Restore processed data
            if (data.processedData) {
                window.uploadManager?.setProcessedData(data.processedData);
            }
            
            // Restore validation results
            if (data.validationResults) {
                window.uploadManager?.setValidationResults(data.validationResults);
            }
            
            return true;
        } catch (error) {
            console.error('Failed to restore data processing:', error);
            return false;
        }
    }

    /**
     * Restore validation state
     * @param {Object} data - Backup data
     */
    restoreValidation(data) {
        try {
            // Clear current validation errors
            const errorContainer = document.getElementById('errorContainer');
            if (errorContainer) {
                errorContainer.innerHTML = '';
            }
            
            // Reset validation state
            if (window.validationEngine) {
                window.validationEngine.clear();
            }
            
            return true;
        } catch (error) {
            console.error('Failed to restore validation:', error);
            return false;
        }
    }

    /**
     * Restore import state
     * @param {Object} data - Backup data
     */
    restoreImport(data) {
        try {
            // This would typically involve reversing database changes
            // For localStorage-based system, we can restore previous state
            
            if (data.previousMasterBarang) {
                localStorage.setItem('master_barang', JSON.stringify(data.previousMasterBarang));
            }
            
            if (data.previousCategories) {
                localStorage.setItem('categories', JSON.stringify(data.previousCategories));
            }
            
            if (data.previousUnits) {
                localStorage.setItem('units', JSON.stringify(data.previousUnits));
            }
            
            return true;
        } catch (error) {
            console.error('Failed to restore import:', error);
            return false;
        }
    }

    /**
     * Apply recovery strategy for specific error
     * @param {string} errorType - Type of error
     * @param {Object} context - Error context
     * @param {Function} retryCallback - Function to retry the operation
     */
    async applyRecoveryStrategy(errorType, context, retryCallback) {
        const strategy = this.recoveryStrategies.get(errorType);
        
        if (!strategy) {
            console.warn(`No recovery strategy found for error type: ${errorType}`);
            return { success: false, message: 'No recovery strategy available' };
        }
        
        console.log(`Applying recovery strategy for ${errorType}: ${strategy.description}`);
        
        switch (strategy.strategy) {
            case 'retry_with_fallback':
                return this.retryWithFallback(retryCallback, strategy, context);
                
            case 'partial_import':
                return this.partialImport(context, strategy);
                
            case 'retry_with_delay':
                return this.retryWithDelay(retryCallback, strategy, context);
                
            case 'chunk_processing':
                return this.chunkProcessing(context, strategy);
                
            case 'offline_mode':
                return this.offlineMode(context, strategy);
                
            default:
                return { success: false, message: 'Unknown recovery strategy' };
        }
    }

    /**
     * Retry with fallback options
     */
    async retryWithFallback(retryCallback, strategy, context) {
        for (let attempt = 0; attempt < strategy.maxRetries; attempt++) {
            try {
                const result = await retryCallback(context, strategy.fallbackOptions[attempt]);
                if (result.success) {
                    return { 
                        success: true, 
                        message: `Recovery successful on attempt ${attempt + 1}`,
                        method: strategy.fallbackOptions[attempt]
                    };
                }
            } catch (error) {
                console.warn(`Retry attempt ${attempt + 1} failed:`, error);
            }
        }
        
        return { 
            success: false, 
            message: 'All retry attempts failed',
            attemptsUsed: strategy.maxRetries
        };
    }

    /**
     * Retry with exponential backoff delay
     */
    async retryWithDelay(retryCallback, strategy, context) {
        for (let attempt = 0; attempt < strategy.maxRetries; attempt++) {
            try {
                const result = await retryCallback(context);
                if (result.success) {
                    return { 
                        success: true, 
                        message: `Recovery successful after ${attempt + 1} attempts`
                    };
                }
            } catch (error) {
                console.warn(`Retry attempt ${attempt + 1} failed:`, error);
                
                // Exponential backoff: 1s, 2s, 4s, 8s, 16s
                const delay = Math.pow(2, attempt) * 1000;
                await this.sleep(delay);
            }
        }
        
        return { 
            success: false, 
            message: 'All retry attempts with delay failed'
        };
    }

    /**
     * Handle partial import (skip invalid rows)
     */
    async partialImport(context, strategy) {
        try {
            if (!context.validData || context.validData.length === 0) {
                return { 
                    success: false, 
                    message: 'No valid data available for partial import'
                };
            }
            
            // Process only valid data
            const result = await this.processValidData(context.validData);
            
            return {
                success: true,
                message: `Partial import completed. ${result.processed} records imported, ${result.skipped} skipped.`,
                stats: result
            };
            
        } catch (error) {
            return { 
                success: false, 
                message: `Partial import failed: ${error.message}`
            };
        }
    }

    /**
     * Handle chunk processing for memory errors
     */
    async chunkProcessing(context, strategy) {
        try {
            const data = context.data || [];
            const chunkSize = Math.max(10, Math.floor(data.length / 4)); // Process in 4 chunks minimum
            
            let processed = 0;
            let failed = 0;
            
            for (let i = 0; i < data.length; i += chunkSize) {
                const chunk = data.slice(i, i + chunkSize);
                
                try {
                    const result = await this.processChunk(chunk, i);
                    processed += result.processed;
                    failed += result.failed;
                    
                    // Update progress
                    const progress = Math.round(((i + chunkSize) / data.length) * 100);
                    this.updateProgress(progress, `Processing chunk ${Math.floor(i / chunkSize) + 1}...`);
                    
                    // Small delay to prevent UI blocking
                    await this.sleep(100);
                    
                } catch (chunkError) {
                    console.error(`Chunk processing failed for chunk starting at ${i}:`, chunkError);
                    failed += chunk.length;
                }
            }
            
            return {
                success: processed > 0,
                message: `Chunk processing completed. ${processed} processed, ${failed} failed.`,
                stats: { processed, failed }
            };
            
        } catch (error) {
            return { 
                success: false, 
                message: `Chunk processing failed: ${error.message}`
            };
        }
    }

    /**
     * Handle offline mode
     */
    async offlineMode(context, strategy) {
        try {
            // Save data for later processing
            const offlineData = {
                id: this.generateBackupId(),
                timestamp: new Date().toISOString(),
                data: context.data,
                operation: context.operation || 'import',
                status: 'pending'
            };
            
            const offlineQueue = this.getOfflineQueue();
            offlineQueue.push(offlineData);
            localStorage.setItem('offline_queue', JSON.stringify(offlineQueue));
            
            return {
                success: true,
                message: 'Data saved for offline processing. Will be processed when connection is restored.',
                offlineId: offlineData.id
            };
            
        } catch (error) {
            return { 
                success: false, 
                message: `Offline mode failed: ${error.message}`
            };
        }
    }

    /**
     * Process offline queue when connection is restored
     */
    async processOfflineQueue() {
        const queue = this.getOfflineQueue();
        const results = [];
        
        for (const item of queue) {
            if (item.status === 'pending') {
                try {
                    const result = await this.processOfflineItem(item);
                    item.status = result.success ? 'completed' : 'failed';
                    item.result = result;
                    results.push(result);
                } catch (error) {
                    item.status = 'failed';
                    item.error = error.message;
                    results.push({ success: false, error: error.message });
                }
            }
        }
        
        // Update queue
        localStorage.setItem('offline_queue', JSON.stringify(queue));
        
        return results;
    }

    /**
     * Utility methods
     */
    generateBackupId() {
        return 'backup_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getSessionId() {
        let sessionId = sessionStorage.getItem(this.sessionKey);
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem(this.sessionKey, sessionId);
        }
        return sessionId;
    }

    getOfflineQueue() {
        try {
            const queue = localStorage.getItem('offline_queue');
            return queue ? JSON.parse(queue) : [];
        } catch (error) {
            console.error('Failed to get offline queue:', error);
            return [];
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    resetWizardToStep(step) {
        // Implementation depends on wizard structure
        const wizardSteps = document.querySelectorAll('.wizard-step');
        wizardSteps.forEach((stepEl, index) => {
            if (index + 1 === step) {
                stepEl.classList.add('active');
            } else {
                stepEl.classList.remove('active');
            }
        });
    }

    updateProgress(percentage, message) {
        const progressBar = document.querySelector('.progress-bar');
        const progressMessage = document.querySelector('.progress-message');
        
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
            progressBar.setAttribute('aria-valuenow', percentage);
        }
        
        if (progressMessage) {
            progressMessage.textContent = message;
        }
    }

    async processValidData(validData) {
        // Implementation would depend on the actual import logic
        return { processed: validData.length, skipped: 0 };
    }

    async processChunk(chunk, startIndex) {
        // Implementation would depend on the actual processing logic
        return { processed: chunk.length, failed: 0 };
    }

    async processOfflineItem(item) {
        // Implementation would depend on the actual processing logic
        return { success: true, message: 'Processed offline item' };
    }

    /**
     * Clean up old backups
     */
    cleanupOldBackups(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
        try {
            const backups = this.getBackups();
            const cutoffTime = Date.now() - maxAge;
            
            const validBackups = backups.filter(backup => {
                const backupTime = new Date(backup.timestamp).getTime();
                return backupTime > cutoffTime;
            });
            
            localStorage.setItem(this.backupKey, JSON.stringify(validBackups));
            
            console.log(`Cleaned up ${backups.length - validBackups.length} old backups`);
            
        } catch (error) {
            console.error('Failed to cleanup old backups:', error);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RecoveryManager;
}