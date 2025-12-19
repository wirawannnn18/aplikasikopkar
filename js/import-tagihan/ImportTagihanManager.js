/**
 * Import Tagihan Manager - Main orchestrator for import tagihan pembayaran
 * Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1, 10.1
 */

// Import required components - conditional import for different environments
let FileParser, ValidationEngine, PreviewGenerator, BatchProcessor, ReportGenerator, AuditLogger, ErrorHandler;

if (typeof require !== 'undefined') {
    // Node.js environment
    try {
        FileParser = require('./FileParser.js').FileParser;
        ValidationEngine = require('./ValidationEngine.js').ValidationEngine;
        PreviewGenerator = require('./PreviewGenerator.js').PreviewGenerator;
        BatchProcessor = require('./BatchProcessor.js').BatchProcessor;
        ReportGenerator = require('./ReportGenerator.js').ReportGenerator;
        AuditLogger = require('./AuditLogger.js').AuditLogger;
        ErrorHandler = require('./ErrorHandler.js').ErrorHandler;
    } catch (e) {
        // Fallback if require fails
        console.warn('Some components not available in Node.js environment');
    }
} else if (typeof window !== 'undefined') {
    // Browser environment
    FileParser = window.FileParser;
    ValidationEngine = window.ValidationEngine;
    PreviewGenerator = window.PreviewGenerator;
    BatchProcessor = window.BatchProcessor;
    ReportGenerator = window.ReportGenerator;
    AuditLogger = window.AuditLogger;
    ErrorHandler = window.ErrorHandler;
}

/**
 * Main orchestrator class for import tagihan pembayaran workflow
 * Coordinates between all components and handles state management
 * Requirements: All requirements integration
 */
class ImportTagihanManager {
    constructor(paymentEngine, auditLogger) {
        this.paymentEngine = paymentEngine;
        this.auditLogger = auditLogger || (AuditLogger ? new AuditLogger() : null);
        
        // Initialize component instances
        this.fileParser = FileParser ? new FileParser() : null;
        this.validationEngine = ValidationEngine ? new ValidationEngine() : null;
        this.previewGenerator = PreviewGenerator ? new PreviewGenerator() : null;
        this.batchProcessor = BatchProcessor ? new BatchProcessor(paymentEngine, this.auditLogger) : null;
        this.reportGenerator = ReportGenerator ? new ReportGenerator() : null;
        this.errorHandler = ErrorHandler ? new ErrorHandler(this.auditLogger) : null;
        
        // State management
        this.currentBatch = null;
        this.isProcessing = false;
        this.isCancelled = false;
        this.templateCounter = 0; // Counter to ensure filename uniqueness
        this.workflowState = 'idle'; // idle, uploading, validating, previewing, processing, completed, cancelled, error
        this.progressCallback = null;
        
        // User context
        this.currentUser = null;
        
        // Initialize user context if available
        this._initializeUserContext();
    }

    /**
     * Upload and parse file
     * Requirements: 2.1, 2.2, 2.3, 2.4
     * @param {File} file - Uploaded file
     * @returns {Promise<ImportBatch>} Parsed batch data
     */
    async uploadFile(file) {
        if (this.isProcessing) {
            throw new Error('Another import process is already in progress');
        }

        if (!this.fileParser) {
            throw new Error('FileParser component not available');
        }

        try {
            this._updateWorkflowState('uploading');
            this._updateProgress(0, 100, 'Memulai upload file...');

            // Generate batch ID
            const batchId = this._generateBatchId();
            
            // Log file upload
            if (this.auditLogger) {
                this.auditLogger.logFileUpload({
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: file.type,
                    userId: this.currentUser?.id || 'unknown',
                    userName: this.currentUser?.nama || 'Unknown User',
                    batchId: batchId
                });
            }

            this._updateProgress(25, 100, 'Memvalidasi format file...');

            // Parse file using FileParser
            const rawData = await this.fileParser.parse(file);
            
            this._updateProgress(75, 100, 'Membuat batch data...');

            // Create batch object
            const batch = {
                id: batchId,
                fileName: file.name,
                uploadedBy: this.currentUser?.nama || 'Unknown User',
                uploadedAt: new Date(),
                totalRows: rawData.length,
                validRows: 0, // Will be set during validation
                invalidRows: 0, // Will be set during validation
                status: 'uploaded',
                processedAt: null,
                rawData: rawData,
                results: null
            };

            this.currentBatch = batch;
            this._updateProgress(100, 100, 'File berhasil diupload');
            this._updateWorkflowState('uploaded');

            return batch;

        } catch (error) {
            this._updateWorkflowState('error');
            
            if (this.errorHandler) {
                const handledError = this.errorHandler.handleFileUploadError(error, file);
                throw handledError;
            } else {
                throw error;
            }
        }
    }

    /**
     * Validate imported data
     * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
     * @param {Array} rawData - Raw imported data
     * @returns {Promise<Array<ImportRow>>} Validated data with status
     */
    async validateData(rawData) {
        if (!this.validationEngine) {
            throw new Error('ValidationEngine component not available');
        }

        if (!rawData || !Array.isArray(rawData)) {
            throw new Error('Invalid raw data provided for validation');
        }

        try {
            this._updateWorkflowState('validating');
            this._updateProgress(0, rawData.length, 'Memulai validasi data...');

            const validatedRows = [];
            const startTime = new Date();

            // Validate each row
            for (let i = 0; i < rawData.length; i++) {
                if (this.isCancelled) {
                    throw new Error('Validation cancelled by user');
                }

                this._updateProgress(i + 1, rawData.length, `Memvalidasi baris ${i + 1}...`);
                
                const validatedRow = await this.validationEngine.validateRow(rawData[i], i + 1);
                validatedRows.push(validatedRow);
            }

            // Generate validation report
            const validationReport = this.validationEngine.generateValidationReport(validatedRows);
            
            // Update batch with validation results
            if (this.currentBatch) {
                this.currentBatch.validRows = validationReport.validCount;
                this.currentBatch.invalidRows = validationReport.invalidCount;
                this.currentBatch.status = 'validated';
                this.currentBatch.validatedData = validatedRows;
                this.currentBatch.validationReport = validationReport;
            }

            // Log validation results
            if (this.auditLogger) {
                const processingTime = new Date().getTime() - startTime.getTime();
                this.auditLogger.logValidationResults({
                    batchId: this.currentBatch?.id || 'unknown',
                    totalRows: rawData.length,
                    validRows: validationReport.validCount,
                    invalidRows: validationReport.invalidCount,
                    errorSummary: Object.keys(validationReport.errorSummary),
                    userId: this.currentUser?.id || 'unknown',
                    userName: this.currentUser?.nama || 'Unknown User',
                    processingTimeMs: processingTime
                });
            }

            this._updateProgress(rawData.length, rawData.length, 'Validasi selesai');
            this._updateWorkflowState('validated');

            return validatedRows;

        } catch (error) {
            this._updateWorkflowState('error');
            
            if (this.errorHandler) {
                const handledError = this.errorHandler.handleValidationError(error, rawData);
                throw handledError;
            } else {
                throw error;
            }
        }
    }

    /**
     * Generate preview for user confirmation
     * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
     * @param {Array<ImportRow>} validatedData - Validated import data
     * @returns {Object} Preview data with summary
     */
    async generatePreview(validatedData) {
        if (!this.previewGenerator) {
            throw new Error('PreviewGenerator component not available');
        }

        if (!validatedData || !Array.isArray(validatedData)) {
            throw new Error('Invalid validated data provided for preview');
        }

        try {
            this._updateWorkflowState('previewing');
            this._updateProgress(0, 100, 'Membuat preview data...');

            // Generate complete preview using PreviewGenerator
            const preview = this.previewGenerator.generateCompletePreview(validatedData);
            
            // Update batch with preview data
            if (this.currentBatch) {
                this.currentBatch.preview = preview;
                this.currentBatch.status = 'previewed';
            }

            this._updateProgress(100, 100, 'Preview berhasil dibuat');
            this._updateWorkflowState('previewed');

            return preview;

        } catch (error) {
            this._updateWorkflowState('error');
            
            if (this.errorHandler) {
                const handledError = this.errorHandler.handlePreviewError(error, validatedData);
                throw handledError;
            } else {
                throw error;
            }
        }
    }

    /**
     * Process batch payments
     * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
     * @param {Array<ImportRow>} confirmedData - User-confirmed data
     * @returns {Promise<ImportResult>} Processing results
     */
    async processBatch(confirmedData) {
        if (!this.batchProcessor) {
            throw new Error('BatchProcessor component not available');
        }

        if (!confirmedData || !Array.isArray(confirmedData)) {
            throw new Error('Invalid confirmed data provided for processing');
        }

        if (this.isProcessing) {
            throw new Error('Batch processing already in progress');
        }

        try {
            this.isProcessing = true;
            this.isCancelled = false;
            this._updateWorkflowState('processing');

            // Set up progress tracking for batch processor
            this.batchProcessor.trackProgress((progress) => {
                this._updateProgress(progress.current, progress.total, progress.status);
            });

            // Process the batch using BatchProcessor
            const results = await this.batchProcessor.processPayments(confirmedData);
            
            // Update batch with results
            if (this.currentBatch) {
                this.currentBatch.results = results;
                this.currentBatch.processedAt = new Date();
                this.currentBatch.status = this.isCancelled ? 'cancelled' : 'completed';
            }

            this._updateWorkflowState(this.isCancelled ? 'cancelled' : 'completed');

            return results;

        } catch (error) {
            this._updateWorkflowState('error');
            
            if (this.errorHandler) {
                const handledError = this.errorHandler.handleProcessingError(error, confirmedData);
                throw handledError;
            } else {
                throw error;
            }
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Generate processing report
     * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
     * @param {ImportResult} results - Processing results
     * @returns {Object} Report data
     */
    async generateReport(results) {
        if (!this.reportGenerator) {
            throw new Error('ReportGenerator component not available');
        }

        if (!results) {
            throw new Error('Invalid results provided for report generation');
        }

        try {
            this._updateProgress(0, 100, 'Membuat laporan...');

            const reportData = {
                batchId: this.currentBatch?.id || 'unknown',
                fileName: this.currentBatch?.fileName || 'unknown',
                results: results,
                kasirId: this.currentUser?.id || 'unknown',
                kasirNama: this.currentUser?.nama || 'Unknown User',
                processedAt: this.currentBatch?.processedAt || new Date()
            };

            // Generate comprehensive report
            const report = this.reportGenerator.generateProcessingReport(reportData);
            
            // Update batch with report
            if (this.currentBatch) {
                this.currentBatch.report = report;
            }

            this._updateProgress(100, 100, 'Laporan berhasil dibuat');

            return report;

        } catch (error) {
            if (this.errorHandler) {
                const handledError = this.errorHandler.handleReportError(error, results);
                throw handledError;
            } else {
                throw error;
            }
        }
    }

    /**
     * Generate and download CSV template
     * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
     * @returns {Object} Template data with filename and content
     */
    generateTemplate() {
        // Generate timestamp for unique filename with counter for guaranteed uniqueness
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -1); // Keep milliseconds, remove 'Z'
        this.templateCounter++; // Increment counter for uniqueness
        const filename = `template_import_tagihan_${timestamp}_${this.templateCounter}.csv`;

        // Define required columns as per requirements
        const headers = [
            'nomor_anggota',
            'nama_anggota', 
            'jenis_pembayaran',
            'jumlah_pembayaran',
            'keterangan'
        ];

        // Add example data as per requirement 1.3
        const exampleRows = [
            ['001', 'John Doe', 'hutang', '500000', 'Cicilan bulan Januari'],
            ['002', 'Jane Smith', 'piutang', '300000', 'Pengembalian simpanan']
        ];

        // Create CSV content
        const csvContent = this._generateCSVContent(headers, exampleRows);

        // Add instructions as comments (requirement 1.4)
        const instructions = [
            '# INSTRUKSI PENGISIAN TEMPLATE IMPORT TAGIHAN',
            '# 1. nomor_anggota: Nomor anggota/NIK yang terdaftar di sistem',
            '# 2. nama_anggota: Nama lengkap anggota (untuk verifikasi)',
            '# 3. jenis_pembayaran: "hutang" atau "piutang"',
            '# 4. jumlah_pembayaran: Jumlah pembayaran dalam rupiah (tanpa titik/koma)',
            '# 5. keterangan: Keterangan pembayaran',
            '# ',
            '# CATATAN:',
            '# - Hapus baris contoh sebelum mengupload',
            '# - Pastikan nomor anggota sudah terdaftar di sistem',
            '# - Jumlah pembayaran tidak boleh melebihi saldo hutang/piutang',
            '# - File maksimal 5MB dengan maksimal 1000 baris data',
            ''
        ].join('\n');

        const fullContent = instructions + csvContent;

        return {
            filename,
            content: fullContent,
            mimeType: 'text/csv',
            size: fullContent.length,
            timestamp: now,
            headers,
            exampleCount: exampleRows.length
        };
    }

    /**
     * Helper method to generate CSV content from headers and rows
     * @private
     * @param {string[]} headers - CSV headers
     * @param {string[][]} rows - CSV data rows
     * @returns {string} CSV content
     */
    _generateCSVContent(headers, rows) {
        const csvRows = [headers, ...rows];
        return csvRows.map(row => 
            row.map(field => {
                // Escape fields containing commas, quotes, or newlines
                if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
                    return `"${field.replace(/"/g, '""')}"`;
                }
                return field;
            }).join(',')
        ).join('\n');
    }

    /**
     * Download template file (browser environment)
     * Requirements: 1.1, 1.5
     * @returns {boolean} Download success
     */
    downloadTemplate() {
        if (typeof window === 'undefined') {
            throw new Error('Download functionality only available in browser environment');
        }

        try {
            const template = this.generateTemplate();
            
            // Create blob and download link
            const blob = new Blob([template.content], { type: template.mimeType });
            const url = window.URL.createObjectURL(blob);
            
            // Create temporary download link
            const link = document.createElement('a');
            link.href = url;
            link.download = template.filename;
            link.style.display = 'none';
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up object URL
            window.URL.revokeObjectURL(url);
            
            // Log audit trail
            if (this.auditLogger) {
                this.auditLogger.log({
                    action: 'template_download',
                    userId: this.currentUser?.id || 'unknown',
                    userName: this.currentUser?.nama || 'Unknown User',
                    details: {
                        filename: template.filename,
                        size: template.size,
                        timestamp: template.timestamp
                    }
                });
            }
            
            return true;
        } catch (error) {
            console.error('Template download failed:', error);
            return false;
        }
    }

    /**
     * Download CSV report (browser environment)
     * Requirements: 6.4
     * @param {Object} report - Generated report
     * @returns {boolean} Download success
     */
    downloadReport(report) {
        if (!this.reportGenerator) {
            throw new Error('ReportGenerator component not available');
        }

        try {
            return this.reportGenerator.downloadCSVReport(report);
        } catch (error) {
            console.error('Report download failed:', error);
            return false;
        }
    }

    /**
     * Execute complete import workflow
     * Requirements: All requirements integration
     * @param {File} file - File to import
     * @returns {Promise<Object>} Complete workflow result
     */
    async executeCompleteWorkflow(file) {
        try {
            // Step 1: Upload and parse file
            const batch = await this.uploadFile(file);
            
            // Step 2: Validate data
            const validatedData = await this.validateData(batch.rawData);
            
            // Step 3: Generate preview
            const preview = await this.generatePreview(validatedData);
            
            // Return preview for user confirmation
            // User must call processBatch separately after confirming
            return {
                success: true,
                batch: batch,
                validatedData: validatedData,
                preview: preview,
                requiresConfirmation: true
            };

        } catch (error) {
            console.error('Workflow execution failed:', error);
            throw error;
        }
    }

    /**
     * Complete processing after user confirmation
     * Requirements: 5.1, 6.1
     * @param {Array<ImportRow>} confirmedData - User-confirmed data
     * @returns {Promise<Object>} Processing and report result
     */
    async completeProcessing(confirmedData) {
        try {
            // Process the batch
            const results = await this.processBatch(confirmedData);
            
            // Generate report
            const report = await this.generateReport(results);
            
            return {
                success: true,
                results: results,
                report: report
            };

        } catch (error) {
            console.error('Processing completion failed:', error);
            throw error;
        }
    }

    /**
     * Set progress callback for UI updates
     * Requirements: 5.5, 10.1
     * @param {Function} callback - Progress callback function
     */
    setProgressCallback(callback) {
        this.progressCallback = callback;
    }

    /**
     * Get current workflow state
     * @returns {Object} Current state information
     */
    getState() {
        return {
            workflowState: this.workflowState,
            isProcessing: this.isProcessing,
            isCancelled: this.isCancelled,
            currentBatch: this.currentBatch ? {
                id: this.currentBatch.id,
                fileName: this.currentBatch.fileName,
                status: this.currentBatch.status,
                totalRows: this.currentBatch.totalRows,
                validRows: this.currentBatch.validRows,
                invalidRows: this.currentBatch.invalidRows
            } : null
        };
    }

    /**
     * Reset manager state
     * Requirements: 10.5
     */
    reset() {
        this.currentBatch = null;
        this.isProcessing = false;
        this.isCancelled = false;
        this.workflowState = 'idle';
        this.progressCallback = null;
    }

    // Private helper methods

    /**
     * Initialize user context from localStorage
     * @private
     */
    _initializeUserContext() {
        if (typeof localStorage !== 'undefined') {
            try {
                const currentUser = localStorage.getItem('currentUser');
                if (currentUser) {
                    this.currentUser = JSON.parse(currentUser);
                }
            } catch (error) {
                console.warn('Failed to initialize user context:', error);
            }
        }
    }

    /**
     * Update workflow state
     * @private
     * @param {string} newState - New workflow state
     */
    _updateWorkflowState(newState) {
        this.workflowState = newState;
        
        // Log state change
        if (this.auditLogger) {
            this.auditLogger.log({
                action: 'WORKFLOW_STATE_CHANGE',
                userId: this.currentUser?.id || 'unknown',
                userName: this.currentUser?.nama || 'Unknown User',
                batchId: this.currentBatch?.id,
                details: {
                    previousState: this.workflowState,
                    newState: newState
                }
            });
        }
    }

    /**
     * Update progress
     * @private
     * @param {number} current - Current progress
     * @param {number} total - Total items
     * @param {string} status - Current status message
     */
    _updateProgress(current, total, status) {
        if (this.progressCallback) {
            this.progressCallback({
                current,
                total,
                percentage: total > 0 ? (current / total * 100).toFixed(1) : 0,
                status
            });
        }
    }

    /**
     * Generate unique batch ID
     * @private
     * @returns {string} Unique batch ID
     */
    _generateBatchId() {
        return `BATCH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Cancel ongoing processing
     * Requirements: 10.2, 10.3, 10.4, 10.5
     * @returns {Promise<boolean>} Cancellation success
     */
    async cancelProcessing() {
        if (!this.isProcessing) {
            return {
                success: false,
                message: 'No processing in progress to cancel'
            };
        }

        try {
            this.isCancelled = true;
            this._updateProgress(0, 100, 'Membatalkan proses...');

            // Cancel batch processing if available
            if (this.batchProcessor) {
                const cancellationResult = await this.batchProcessor.handleCancellation();
                
                // Update batch status
                if (this.currentBatch) {
                    this.currentBatch.status = 'cancelled';
                    this.currentBatch.cancellationResult = cancellationResult;
                }

                // Log cancellation
                if (this.auditLogger) {
                    this.auditLogger.log({
                        action: 'BATCH_CANCELLED',
                        batchId: this.currentBatch?.id,
                        userId: this.currentUser?.id || 'unknown',
                        userName: this.currentUser?.nama || 'Unknown User',
                        details: {
                            cancellationResult: cancellationResult,
                            workflowState: this.workflowState
                        }
                    });
                }

                this._updateWorkflowState('cancelled');
                this._updateProgress(100, 100, 'Proses berhasil dibatalkan');

                return {
                    success: true,
                    message: 'Processing cancelled successfully',
                    cancellationResult: cancellationResult
                };
            } else {
                // Simple cancellation without batch processor
                
                // Update batch status
                if (this.currentBatch) {
                    this.currentBatch.status = 'cancelled';
                }

                // Log cancellation
                if (this.auditLogger) {
                    this.auditLogger.log({
                        action: 'BATCH_CANCELLED',
                        batchId: this.currentBatch?.id,
                        userId: this.currentUser?.id || 'unknown',
                        userName: this.currentUser?.nama || 'Unknown User',
                        details: {
                            workflowState: this.workflowState,
                            reason: 'No batch processor available'
                        }
                    });
                }

                this._updateWorkflowState('cancelled');
                this._updateProgress(100, 100, 'Proses dibatalkan');

                return {
                    success: true,
                    message: 'Processing cancelled'
                };
            }

        } catch (error) {
            console.error('Error during cancellation:', error);
            
            if (this.errorHandler) {
                const handledError = this.errorHandler.handleCancellationError(error);
                throw handledError;
            } else {
                return {
                    success: false,
                    message: `Cancellation failed: ${error.message}`,
                    error: error
                };
            }
        }
    }
}

// Export for both browser and Node.js environments
if (typeof window !== 'undefined') {
    window.ImportTagihanManager = ImportTagihanManager;
}

// Browser compatibility - exports handled via window object

// CommonJS export for compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ImportTagihanManager };
}