/**
 * Enhanced Import Tagihan Controller for Integration
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.1
 * 
 * This enhanced controller wraps the existing ImportTagihanManager and integrates
 * it with SharedPaymentServices for unified payment processing.
 */

// Import required components
let ImportTagihanManager, SharedPaymentServices, BatchProcessor;

if (typeof require !== 'undefined') {
    // Node.js environment
    try {
        ImportTagihanManager = require('./ImportTagihanManager.js').ImportTagihanManager;
        SharedPaymentServices = require('../shared/SharedPaymentServices.js').SharedPaymentServices;
        BatchProcessor = require('./BatchProcessor.js').BatchProcessor;
    } catch (e) {
        console.warn('Some components not available in Node.js environment');
    }
} else if (typeof window !== 'undefined') {
    // Browser environment
    ImportTagihanManager = window.ImportTagihanManager;
    SharedPaymentServices = window.SharedPaymentServices;
    BatchProcessor = window.BatchProcessor;
}

/**
 * Enhanced Import Tagihan Controller with Shared Services Integration
 * Extends existing ImportTagihanManager with shared payment services
 */
class ImportTagihanEnhanced {
    constructor(sharedServices) {
        // Initialize shared services
        this.sharedServices = sharedServices || (SharedPaymentServices ? new SharedPaymentServices() : null);
        
        if (!this.sharedServices) {
            throw new Error('SharedPaymentServices is required for ImportTagihanEnhanced');
        }
        
        // Initialize the original ImportTagihanManager with enhanced payment engine
        this.importManager = ImportTagihanManager ? new ImportTagihanManager(
            this._createEnhancedPaymentEngine(),
            this.sharedServices.auditLogger
        ) : null;
        
        if (!this.importManager) {
            throw new Error('ImportTagihanManager is required for ImportTagihanEnhanced');
        }
        
        // Initialize enhanced batch processor with shared services
        this.batchProcessor = BatchProcessor ? new BatchProcessorEnhanced(
            this._createEnhancedPaymentEngine(),
            this.sharedServices.auditLogger,
            this.sharedServices
        ) : null;
        
        // Replace the original batch processor with enhanced version
        if (this.batchProcessor) {
            this.importManager.batchProcessor = this.batchProcessor;
        }
        
        // Integration-specific properties
        this.integrationCallbacks = {
            onBatchComplete: null,
            onTransactionUpdate: null
        };
        
        // State management for tab integration
        this.isIntegratedMode = false;
        this.parentController = null;
    }

    /**
     * Set integration mode and parent controller
     * Requirements: 3.4, 3.5, 5.5
     * @param {boolean} isIntegrated - Whether running in integrated mode
     * @param {Object} parentController - Parent integration controller
     */
    setIntegrationMode(isIntegrated, parentController = null) {
        this.isIntegratedMode = isIntegrated;
        this.parentController = parentController;
        
        // Configure callbacks for integration
        if (isIntegrated && parentController) {
            this.integrationCallbacks.onBatchComplete = (results) => {
                if (parentController.onImportBatchComplete) {
                    parentController.onImportBatchComplete(results);
                }
            };
            
            this.integrationCallbacks.onTransactionUpdate = (transaction) => {
                if (parentController.onTransactionUpdate) {
                    parentController.onTransactionUpdate(transaction, 'import');
                }
            };
        }
    }

    /**
     * Add callback for batch completion to update manual tab
     * Requirements: 3.4, 3.5, 5.5
     * @param {Function} callback - Callback function
     */
    onBatchComplete(callback) {
        this.integrationCallbacks.onBatchComplete = callback;
    }

    /**
     * Add method to refresh unified transaction history
     * Requirements: 3.4, 3.5, 5.5
     * @param {Function} callback - Callback function for transaction updates
     */
    onTransactionUpdate(callback) {
        this.integrationCallbacks.onTransactionUpdate = callback;
    }

    /**
     * Upload and parse file (delegated to original manager)
     * Requirements: 3.1
     * @param {File} file - Uploaded file
     * @returns {Promise<ImportBatch>} Parsed batch data
     */
    async uploadFile(file) {
        try {
            const result = await this.importManager.uploadFile(file);
            
            // Log integration-specific audit
            this.sharedServices.logAudit('IMPORT_FILE_UPLOADED', {
                fileName: file.name,
                fileSize: file.size,
                batchId: result.id,
                mode: 'import',
                integrationMode: this.isIntegratedMode
            });
            
            return result;
        } catch (error) {
            this.sharedServices.logAudit('IMPORT_FILE_UPLOAD_ERROR', {
                fileName: file.name,
                error: error.message,
                mode: 'import',
                integrationMode: this.isIntegratedMode
            });
            throw error;
        }
    }

    /**
     * Validate imported data using shared validation
     * Requirements: 3.2, 6.1
     * @param {Array} rawData - Raw imported data
     * @returns {Promise<Array<ImportRow>>} Validated data with status
     */
    async validateData(rawData) {
        try {
            // Use original validation but enhance with shared services validation
            const validatedRows = await this.importManager.validateData(rawData);
            
            // Additional validation using shared services
            const enhancedRows = await this._enhanceValidationWithSharedServices(validatedRows);
            
            // Log validation results with integration context
            this.sharedServices.logAudit('IMPORT_DATA_VALIDATED', {
                totalRows: rawData.length,
                validRows: enhancedRows.filter(r => r.isValid).length,
                invalidRows: enhancedRows.filter(r => !r.isValid).length,
                mode: 'import',
                integrationMode: this.isIntegratedMode,
                batchId: this.importManager.currentBatch?.id
            });
            
            return enhancedRows;
        } catch (error) {
            this.sharedServices.logAudit('IMPORT_VALIDATION_ERROR', {
                error: error.message,
                mode: 'import',
                integrationMode: this.isIntegratedMode
            });
            throw error;
        }
    }

    /**
     * Generate preview for user confirmation (delegated to original manager)
     * Requirements: 3.3
     * @param {Array<ImportRow>} validatedData - Validated import data
     * @returns {Object} Preview data with summary
     */
    async generatePreview(validatedData) {
        return await this.importManager.generatePreview(validatedData);
    }

    /**
     * Process batch payments using shared services
     * Requirements: 3.1, 3.2, 3.3, 6.1
     * @param {Array<ImportRow>} confirmedData - User-confirmed data
     * @returns {Promise<ImportResult>} Processing results
     */
    async processBatch(confirmedData) {
        try {
            // Filter only valid rows for processing
            const validRows = confirmedData.filter(row => row.isValid);
            
            // Convert to payment data format for shared services
            const paymentDataArray = validRows.map(row => ({
                anggotaId: row.anggotaId,
                anggotaNama: row.memberName,
                anggotaNIK: row.memberNumber,
                jenis: row.paymentType,
                jumlah: row.amount,
                keterangan: row.description || `Import batch ${this.importManager.currentBatch?.id}`,
                batchId: this.importManager.currentBatch?.id
            }));
            
            // Process batch using shared services
            const batchResults = await this.sharedServices.processBatchPayments(paymentDataArray, 'import');
            
            // Convert results to expected format
            const results = {
                batchId: this.importManager.currentBatch?.id,
                totalProcessed: batchResults.total,
                successCount: batchResults.successful,
                failureCount: batchResults.failed,
                successTransactions: batchResults.transactions,
                failedTransactions: batchResults.errors.map(error => ({
                    rowNumber: error.index + 1,
                    memberNumber: error.data.anggotaNIK,
                    memberName: error.data.anggotaNama,
                    paymentType: error.data.jenis,
                    amount: error.data.jumlah,
                    error: error.error,
                    errorCode: this._categorizeError(error.error)
                })),
                summary: this._calculateSummary(batchResults.transactions)
            };
            
            // Update batch status
            if (this.importManager.currentBatch) {
                this.importManager.currentBatch.results = results;
                this.importManager.currentBatch.processedAt = new Date();
                this.importManager.currentBatch.status = 'completed';
            }
            
            // Trigger integration callbacks
            if (this.integrationCallbacks.onBatchComplete) {
                this.integrationCallbacks.onBatchComplete(results);
            }
            
            // Notify about transaction updates
            if (this.integrationCallbacks.onTransactionUpdate) {
                batchResults.transactions.forEach(transaction => {
                    this.integrationCallbacks.onTransactionUpdate(transaction);
                });
            }
            
            // Log batch completion
            this.sharedServices.logAudit('IMPORT_BATCH_COMPLETED', {
                batchId: results.batchId,
                totalProcessed: results.totalProcessed,
                successCount: results.successCount,
                failureCount: results.failureCount,
                mode: 'import',
                integrationMode: this.isIntegratedMode
            });
            
            return results;
            
        } catch (error) {
            this.sharedServices.logAudit('IMPORT_BATCH_ERROR', {
                error: error.message,
                mode: 'import',
                integrationMode: this.isIntegratedMode,
                batchId: this.importManager.currentBatch?.id
            });
            throw error;
        }
    }

    /**
     * Generate processing report (delegated to original manager)
     * Requirements: 3.4
     * @param {ImportResult} results - Processing results
     * @returns {Object} Report data
     */
    async generateReport(results) {
        return await this.importManager.generateReport(results);
    }

    /**
     * Generate and download CSV template (delegated to original manager)
     * Requirements: 3.5
     * @returns {Object} Template data with filename and content
     */
    generateTemplate() {
        return this.importManager.generateTemplate();
    }

    /**
     * Download template file (delegated to original manager)
     * Requirements: 3.5
     * @returns {boolean} Download success
     */
    downloadTemplate() {
        return this.importManager.downloadTemplate();
    }

    /**
     * Download CSV report (delegated to original manager)
     * Requirements: 3.4
     * @param {Object} report - Generated report
     * @returns {boolean} Download success
     */
    downloadReport(report) {
        return this.importManager.downloadReport(report);
    }

    /**
     * Execute complete import workflow with integration support
     * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
     * @param {File} file - File to import
     * @returns {Promise<Object>} Complete workflow result
     */
    async executeCompleteWorkflow(file) {
        try {
            const result = await this.importManager.executeCompleteWorkflow(file);
            
            // Add integration-specific enhancements
            if (this.isIntegratedMode) {
                result.integrationMode = true;
                result.parentController = this.parentController;
            }
            
            return result;
        } catch (error) {
            this.sharedServices.logAudit('IMPORT_WORKFLOW_ERROR', {
                error: error.message,
                mode: 'import',
                integrationMode: this.isIntegratedMode
            });
            throw error;
        }
    }

    /**
     * Complete processing after user confirmation with integration support
     * Requirements: 3.1, 3.4, 3.5
     * @param {Array<ImportRow>} confirmedData - User-confirmed data
     * @returns {Promise<Object>} Processing and report result
     */
    async completeProcessing(confirmedData) {
        try {
            // Process the batch using enhanced processing
            const results = await this.processBatch(confirmedData);
            
            // Generate report
            const report = await this.generateReport(results);
            
            return {
                success: true,
                results: results,
                report: report,
                integrationMode: this.isIntegratedMode
            };
        } catch (error) {
            this.sharedServices.logAudit('IMPORT_PROCESSING_COMPLETION_ERROR', {
                error: error.message,
                mode: 'import',
                integrationMode: this.isIntegratedMode
            });
            throw error;
        }
    }

    /**
     * Set progress callback for UI updates (delegated to original manager)
     * Requirements: 5.5
     * @param {Function} callback - Progress callback function
     */
    setProgressCallback(callback) {
        this.importManager.setProgressCallback(callback);
    }

    /**
     * Get current workflow state with integration info
     * @returns {Object} Current state information
     */
    getState() {
        const originalState = this.importManager.getState();
        return {
            ...originalState,
            integrationMode: this.isIntegratedMode,
            hasParentController: !!this.parentController
        };
    }

    /**
     * Reset manager state
     * Requirements: 10.5
     */
    reset() {
        this.importManager.reset();
        this.integrationCallbacks = {
            onBatchComplete: null,
            onTransactionUpdate: null
        };
    }

    /**
     * Cancel ongoing processing (delegated to original manager)
     * Requirements: 10.2, 10.3, 10.4, 10.5
     * @returns {Promise<boolean>} Cancellation success
     */
    async cancelProcessing() {
        return await this.importManager.cancelProcessing();
    }

    /**
     * Refresh unified transaction history
     * Requirements: 3.4, 3.5, 5.5
     * @param {Object} filters - Filter options
     * @returns {Array} Updated transaction history
     */
    refreshTransactionHistory(filters = {}) {
        // Add import mode filter
        const importFilters = {
            ...filters,
            mode: 'import'
        };
        
        return this.sharedServices.getTransactionHistory(importFilters);
    }

    /**
     * Get compatibility status with tab switching
     * Requirements: 3.4, 3.5, 5.5
     * @returns {Object} Compatibility information
     */
    getTabCompatibilityStatus() {
        return {
            canSwitchTabs: !this.importManager.isProcessing,
            hasUnsavedData: this.importManager.currentBatch && 
                           this.importManager.workflowState !== 'idle' && 
                           this.importManager.workflowState !== 'completed',
            currentWorkflowState: this.importManager.workflowState,
            integrationReady: !!this.sharedServices
        };
    }

    // ===== PRIVATE HELPER METHODS =====

    /**
     * Create enhanced payment engine that uses shared services
     * @private
     */
    _createEnhancedPaymentEngine() {
        return {
            processPayment: (paymentData, mode = 'import') => {
                return this.sharedServices.processPayment(paymentData, mode);
            },
            processBatchPayments: (batchData, mode = 'import') => {
                return this.sharedServices.processBatchPayments(batchData, mode);
            },
            validatePayment: (paymentData, mode = 'import') => {
                return this.sharedServices.validatePaymentData(paymentData, mode);
            }
        };
    }

    /**
     * Enhance validation with shared services
     * @private
     */
    async _enhanceValidationWithSharedServices(validatedRows) {
        const enhancedRows = [];
        
        for (const row of validatedRows) {
            if (row.isValid) {
                // Additional validation using shared services
                const paymentData = {
                    anggotaId: row.anggotaId,
                    anggotaNama: row.memberName,
                    jenis: row.paymentType,
                    jumlah: row.amount
                };
                
                const validation = this.sharedServices.validatePaymentData(paymentData, 'import');
                
                if (!validation.valid) {
                    // Mark as invalid if shared services validation fails
                    row.isValid = false;
                    row.errors = row.errors || [];
                    row.errors = row.errors.concat(validation.errors);
                }
                
                if (validation.warnings && validation.warnings.length > 0) {
                    row.warnings = row.warnings || [];
                    row.warnings = row.warnings.concat(validation.warnings);
                }
            }
            
            enhancedRows.push(row);
        }
        
        return enhancedRows;
    }

    /**
     * Calculate summary from transactions
     * @private
     */
    _calculateSummary(transactions) {
        const summary = {
            totalAmount: 0,
            totalHutang: 0,
            totalPiutang: 0
        };
        
        transactions.forEach(transaction => {
            summary.totalAmount += transaction.jumlah;
            
            if (transaction.jenis === 'hutang') {
                summary.totalHutang += transaction.jumlah;
            } else {
                summary.totalPiutang += transaction.jumlah;
            }
        });
        
        return summary;
    }

    /**
     * Categorize error for reporting
     * @private
     */
    _categorizeError(errorMessage) {
        const message = errorMessage.toLowerCase();
        
        if (message.includes('tidak ditemukan')) {
            return 'MEMBER_NOT_FOUND';
        } else if (message.includes('saldo') && message.includes('tidak mencukupi')) {
            return 'INSUFFICIENT_BALANCE';
        } else if (message.includes('validasi')) {
            return 'VALIDATION_ERROR';
        } else {
            return 'SYSTEM_ERROR';
        }
    }
}

/**
 * Enhanced Batch Processor that uses SharedPaymentServices
 */
class BatchProcessorEnhanced extends BatchProcessor {
    constructor(paymentEngine, auditLogger, sharedServices) {
        super(paymentEngine, auditLogger);
        this.sharedServices = sharedServices;
    }

    /**
     * Process single payment using shared services
     * Requirements: 6.1 - Replace direct journal calls with SharedPaymentServices
     * @param {ImportRow} rowData - Single payment data
     * @returns {Promise<Object>} Transaction result
     */
    async processSinglePayment(rowData) {
        if (!rowData.isValid) {
            throw new Error('Cannot process invalid row data');
        }

        try {
            // Get member data
            const anggotaList = JSON.parse(localStorage.getItem('anggota') || '[]');
            const anggota = anggotaList.find(a => a.nik === rowData.memberNumber);
            
            if (!anggota) {
                throw new Error(`Anggota dengan NIK ${rowData.memberNumber} tidak ditemukan`);
            }

            // Prepare payment data for shared services
            const paymentData = {
                anggotaId: anggota.id,
                anggotaNama: anggota.nama,
                anggotaNIK: anggota.nik,
                jenis: rowData.paymentType,
                jumlah: rowData.amount,
                keterangan: rowData.description || `Import batch ${this.currentBatchId}`,
                batchId: this.currentBatchId
            };

            // Use shared services for processing
            const result = await this.sharedServices.processPayment(paymentData, 'import');
            
            return result.transaction;

        } catch (error) {
            console.error('Error processing single payment:', error);
            throw error;
        }
    }

    /**
     * Calculate hutang balance using shared services
     * Requirements: 6.1 - Replace direct saldo calculations with shared functions
     * @param {string} anggotaId - Member ID
     * @returns {number} Current hutang balance
     */
    hitungSaldoHutang(anggotaId) {
        return this.sharedServices.hitungSaldoHutang(anggotaId);
    }

    /**
     * Calculate piutang balance using shared services
     * Requirements: 6.1 - Replace direct saldo calculations with shared functions
     * @param {string} anggotaId - Member ID
     * @returns {number} Current piutang balance
     */
    hitungSaldoPiutang(anggotaId) {
        return this.sharedServices.hitungSaldoPiutang(anggotaId);
    }

    /**
     * Create journal entry using shared services
     * Requirements: 6.1 - Replace direct journal calls with SharedPaymentServices
     * @param {Object} transaction - Transaction data
     */
    createJournalEntry(transaction) {
        // Journal entry is already created by shared services in processSinglePayment
        // This method is kept for compatibility but delegates to shared services
        return this.sharedServices.createJurnalEntry(transaction, 'import');
    }
}

// Export for both browser and Node.js environments
if (typeof window !== 'undefined') {
    window.ImportTagihanEnhanced = ImportTagihanEnhanced;
    window.BatchProcessorEnhanced = BatchProcessorEnhanced;
}

// ES6 export for modern environments
export { ImportTagihanEnhanced, BatchProcessorEnhanced };

// CommonJS export for compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ImportTagihanEnhanced, BatchProcessorEnhanced };
}