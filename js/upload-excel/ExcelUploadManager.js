/**
 * ExcelUploadManager - Main coordinator for Excel/CSV upload functionality
 * 
 * This class serves as the primary interface for managing the upload process,
 * coordinating between validation, processing, and storage components.
 * 
 * @requires ValidationEngine
 * @requires DataProcessor
 * @requires CategoryUnitManager
 * @requires AuditLogger
 */

class ExcelUploadManager {
    /**
     * Initialize the upload manager with required dependencies
     */
    constructor() {
        /** @type {ValidationEngine} */
        this.validator = null;
        
        /** @type {DataProcessor} */
        this.processor = null;
        
        /** @type {CategoryUnitManager} */
        this.categoryManager = null;
        
        /** @type {AuditLogger} */
        this.auditLogger = null;
        
        /** @type {Map<string, UploadSession>} */
        this.activeSessions = new Map();
        
        /** @type {string} */
        this.currentUser = 'admin'; // TODO: Get from auth system
        
        this.initializeComponents();
    }

    /**
     * Initialize required components
     * @private
     */
    initializeComponents() {
        // Initialize components if classes are available
        try {
            if (typeof ValidationEngine !== 'undefined') {
                this.validator = new ValidationEngine();
            }
            if (typeof DataProcessor !== 'undefined') {
                this.processor = new DataProcessor();
            }
            if (typeof CategoryUnitManager !== 'undefined') {
                this.categoryManager = new CategoryUnitManager();
            }
            if (typeof AuditLogger !== 'undefined') {
                this.auditLogger = new AuditLogger();
            }
            console.log('ExcelUploadManager initialized with components');
        } catch (error) {
            console.warn('Some components not available:', error.message);
        }
    }

    /**
     * Set component dependencies (dependency injection)
     * @param {Object} components - Component instances
     * @param {ValidationEngine} components.validator - Validation engine
     * @param {DataProcessor} components.processor - Data processor
     * @param {CategoryUnitManager} components.categoryManager - Category manager
     * @param {AuditLogger} components.auditLogger - Audit logger
     */
    setComponents({ validator, processor, categoryManager, auditLogger }) {
        this.validator = validator;
        this.processor = processor;
        this.categoryManager = categoryManager;
        this.auditLogger = auditLogger;
    }

    /**
     * Upload and process a file with enhanced drag & drop support
     * @param {File} file - The uploaded file
     * @param {Object} options - Upload options
     * @param {Function} options.onProgress - Progress callback function
     * @param {Function} options.onValidation - Validation callback function
     * @returns {Promise<UploadSession>} Upload session with results
     */
    async uploadFile(file, options = {}) {
        // Create new upload session
        const session = this.createUploadSession(file);
        
        try {
            // Log upload start
            this.auditLogger?.logUploadStart(this.currentUser, file.name, 0);
            
            // Report initial progress
            if (options.onProgress) {
                options.onProgress({
                    stage: 'validation',
                    progress: 10,
                    message: 'Validating file format and size...'
                });
            }
            
            // Enhanced file validation with detailed feedback
            const fileValidation = await this.validateFileWithFeedback(file);
            if (!fileValidation.isValid) {
                session.status = 'failed';
                session.validationResults.errors.push({
                    type: 'format',
                    field: 'file',
                    row: 0,
                    message: fileValidation.error,
                    severity: 'error',
                    code: fileValidation.code || 'FILE_VALIDATION_ERROR'
                });
                throw new Error(fileValidation.error);
            }
            
            // Report parsing progress
            if (options.onProgress) {
                options.onProgress({
                    stage: 'parsing',
                    progress: 30,
                    message: 'Parsing file content...'
                });
            }
            
            // Parse file content with progress tracking
            session.status = 'processing';
            const rawData = await this.processor?.parseFile(file, {
                onProgress: (progress) => {
                    if (options.onProgress) {
                        options.onProgress({
                            stage: 'parsing',
                            progress: 30 + (progress * 0.4), // 30-70%
                            message: `Parsing... ${Math.round(progress)}% complete`
                        });
                    }
                }
            });
            
            session.recordCount = rawData?.length || 0;
            
            // Store raw data for later processing
            this.processor?.storeSessionData(session.id, rawData);
            
            // Report validation progress
            if (options.onProgress) {
                options.onProgress({
                    stage: 'validation',
                    progress: 70,
                    message: 'Validating data...'
                });
            }
            
            // Validate data with progress tracking
            const validationResults = await this.validateData(rawData, {
                onProgress: (progress) => {
                    if (options.onProgress) {
                        options.onProgress({
                            stage: 'validation',
                            progress: 70 + (progress * 0.25), // 70-95%
                            message: `Validating... ${Math.round(progress)}% complete`
                        });
                    }
                }
            });
            
            session.validationResults = validationResults;
            
            // Report validation results
            if (options.onValidation) {
                options.onValidation(validationResults);
            }
            
            // Check for blocking errors
            const hasErrors = validationResults.errors.some(e => e.severity === 'error');
            if (hasErrors) {
                session.status = 'failed';
            } else {
                session.status = 'validated';
            }
            
            // Store session
            this.activeSessions.set(session.id, session);
            
            // Report completion
            if (options.onProgress) {
                options.onProgress({
                    stage: 'complete',
                    progress: 100,
                    message: hasErrors ? 'Validation completed with errors' : 'File processed successfully'
                });
            }
            
            return session;
            
        } catch (error) {
            session.status = 'failed';
            this.auditLogger?.logError(error, { sessionId: session.id });
            
            // Report error
            if (options.onProgress) {
                options.onProgress({
                    stage: 'error',
                    progress: 0,
                    message: `Error: ${error.message}`
                });
            }
            
            throw error;
        }
    }

    /**
     * Validate uploaded data
     * @param {Object[]} data - Raw data from file
     * @returns {Promise<ValidationResults>} Validation results
     */
    async validateData(data) {
        if (!this.validator) {
            throw new Error('Validator not initialized');
        }
        
        const errors = [];
        const warnings = [];
        
        // Validate each row
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2; // Account for header row
            
            try {
                // Validate data types
                const typeErrors = this.validator.validateDataTypes(row, rowNumber);
                errors.push(...typeErrors);
                
                // Validate business rules
                const businessErrors = this.validator.validateBusinessRules(row, rowNumber);
                errors.push(...businessErrors);
                
            } catch (error) {
                errors.push({
                    type: 'format',
                    field: 'row',
                    row: rowNumber,
                    message: `Error processing row: ${error.message}`,
                    severity: 'error',
                    code: 'ROW_PROCESSING_ERROR'
                });
            }
        }
        
        // Check for duplicates
        const duplicateErrors = this.validator.validateDuplicates(data);
        errors.push(...duplicateErrors);
        
        // Check existing data conflicts
        const existingDataWarnings = await this.validator.validateExistingData(data);
        warnings.push(...existingDataWarnings);
        
        return { errors, warnings };
    }

    /**
     * Process file content directly (for backward compatibility)
     * @param {File} file - File to process
     * @returns {Promise<Object[]>} Processed data array
     */
    async processFileContent(file) {
        if (!this.processor) {
            throw new Error('DataProcessor not initialized');
        }
        
        try {
            // Parse file using DataProcessor
            const rawData = await this.processor.parseFile(file);
            
            // Transform data if needed
            const processedData = rawData.map(row => this.processor.transformData(row));
            
            return processedData;
        } catch (error) {
            throw new Error(`Failed to process file content: ${error.message}`);
        }
    }

    /**
     * Generate preview data for display (overloaded for backward compatibility)
     * @param {Object[]|string} data - Data array or session ID
     * @returns {Promise<Object>} Preview data with validation indicators
     */
    async previewData(data) {
        // Handle both data array and session ID
        if (typeof data === 'string') {
            // Original method - data is session ID
            return this.previewDataBySession(data);
        } else if (Array.isArray(data)) {
            // New method - data is array
            return this.previewDataFromArray(data);
        } else {
            throw new Error('Invalid data parameter for previewData');
        }
    }

    /**
     * Generate preview data from session ID
     * @param {string} sessionId - Upload session ID
     * @returns {Promise<Object>} Preview data with validation indicators
     */
    async previewDataBySession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        // Get raw data from processor
        const rawData = await this.processor?.getSessionData(sessionId);
        if (!rawData) {
            throw new Error('No data available for preview');
        }
        
        // Add validation indicators to each row
        const previewData = rawData.map((row, index) => {
            const rowNumber = index + 2;
            const rowErrors = session.validationResults.errors.filter(e => e.row === rowNumber);
            const rowWarnings = session.validationResults.warnings.filter(e => e.row === rowNumber);
            
            return {
                ...row,
                _rowNumber: rowNumber,
                _hasErrors: rowErrors.length > 0,
                _hasWarnings: rowWarnings.length > 0,
                _errors: rowErrors,
                _warnings: rowWarnings
            };
        });
        
        return {
            data: previewData,
            summary: {
                totalRows: rawData.length,
                errorRows: previewData.filter(r => r._hasErrors).length,
                warningRows: previewData.filter(r => r._hasWarnings).length,
                validRows: previewData.filter(r => !r._hasErrors && !r._hasWarnings).length
            }
        };
    }

    /**
     * Generate preview data from data array
     * @param {Object[]} dataArray - Data array to preview
     * @returns {Promise<Object>} Preview data with validation indicators
     */
    async previewDataFromArray(dataArray) {
        try {
            // Validate data if validator is available
            let validationResults = { errors: [], warnings: [] };
            if (this.validator) {
                validationResults = await this.validateData(dataArray);
            }
            
            // Add validation indicators to each row
            const previewData = dataArray.map((row, index) => {
                const rowNumber = index + 2; // Account for header row
                const rowErrors = validationResults.errors.filter(e => e.row === rowNumber);
                const rowWarnings = validationResults.warnings.filter(e => e.row === rowNumber);
                
                return {
                    ...row,
                    _rowNumber: rowNumber,
                    _hasErrors: rowErrors.length > 0,
                    _hasWarnings: rowWarnings.length > 0,
                    _errors: rowErrors,
                    _warnings: rowWarnings
                };
            });
            
            return {
                data: previewData,
                summary: {
                    totalRows: dataArray.length,
                    errorRows: previewData.filter(r => r._hasErrors).length,
                    warningRows: previewData.filter(r => r._hasWarnings).length,
                    validRows: previewData.filter(r => !r._hasErrors && !r._hasWarnings).length
                },
                validationResults: validationResults
            };
        } catch (error) {
            // Return data without validation if validation fails
            return {
                data: dataArray.map((row, index) => ({
                    ...row,
                    _rowNumber: index + 2,
                    _hasErrors: false,
                    _hasWarnings: false,
                    _errors: [],
                    _warnings: []
                })),
                summary: {
                    totalRows: dataArray.length,
                    errorRows: 0,
                    warningRows: 0,
                    validRows: dataArray.length
                },
                validationResults: { errors: [], warnings: [] }
            };
        }
    }

    /**
     * Import validated data to system
     * @param {string} sessionId - Upload session ID
     * @param {Object} options - Import options
     * @param {boolean} options.updateExisting - Whether to update existing records
     * @returns {Promise<ImportResults>} Import results
     */
    async importData(sessionId, options = {}) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        if (session.status !== 'processing') {
            throw new Error('Session not ready for import');
        }
        
        try {
            // Get validated data
            const rawData = await this.processor?.getSessionData(sessionId);
            const validData = this.filterValidData(rawData, session.validationResults);
            
            // Process in chunks for better performance
            const results = await this.processor?.processInChunks(validData, {
                chunkSize: 100,
                updateExisting: options.updateExisting,
                onProgress: (progress) => {
                    // Update session progress
                    session.progress = progress;
                }
            });
            
            // Update session with results
            session.importResults = results;
            session.status = 'completed';
            
            // Log completion
            this.auditLogger?.logImportComplete(results);
            
            return results;
            
        } catch (error) {
            session.status = 'failed';
            this.auditLogger?.logError(error, { sessionId });
            throw error;
        }
    }

    /**
     * Get upload history for audit purposes
     * @param {Object} filters - Filter options
     * @returns {Promise<UploadSession[]>} Upload history
     */
    async getUploadHistory(filters = {}) {
        // This would typically query a database
        // For now, return active sessions
        const sessions = Array.from(this.activeSessions.values());
        
        // Apply filters
        let filteredSessions = sessions;
        
        if (filters.user) {
            filteredSessions = filteredSessions.filter(s => s.user === filters.user);
        }
        
        if (filters.status) {
            filteredSessions = filteredSessions.filter(s => s.status === filters.status);
        }
        
        if (filters.dateFrom) {
            filteredSessions = filteredSessions.filter(s => 
                new Date(s.timestamp) >= new Date(filters.dateFrom)
            );
        }
        
        if (filters.dateTo) {
            filteredSessions = filteredSessions.filter(s => 
                new Date(s.timestamp) <= new Date(filters.dateTo)
            );
        }
        
        return filteredSessions.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
    }

    /**
     * Rollback a completed import
     * @param {string} sessionId - Session ID to rollback
     * @returns {Promise<boolean>} Success status
     */
    async rollbackImport(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        if (session.status !== 'completed') {
            throw new Error('Can only rollback completed imports');
        }
        
        try {
            // Get rollback data from audit log
            const rollbackData = await this.auditLogger?.getRollbackData(sessionId);
            if (!rollbackData) {
                throw new Error('No rollback data available');
            }
            
            // Perform rollback operations
            await this.processor?.rollbackImport(rollbackData);
            
            // Log rollback
            this.auditLogger?.logRollback(sessionId, this.currentUser);
            
            return true;
            
        } catch (error) {
            this.auditLogger?.logError(error, { sessionId, action: 'rollback' });
            throw error;
        }
    }

    /**
     * Create a new upload session
     * @param {File} file - Uploaded file
     * @returns {UploadSession} New session
     * @private
     */
    createUploadSession(file) {
        const sessionId = this.generateSessionId();
        
        return {
            id: sessionId,
            timestamp: new Date().toISOString(),
            user: this.currentUser,
            fileName: file.name,
            fileSize: file.size,
            recordCount: 0,
            status: 'pending',
            validationResults: { errors: [], warnings: [] },
            importResults: { created: 0, updated: 0, failed: 0, totalProcessed: 0 },
            auditLog: []
        };
    }

    /**
     * Validate file format and size with detailed feedback
     * @param {File} file - File to validate
     * @returns {Promise<FileValidationResult>} Validation result with detailed feedback
     * @private
     */
    async validateFileWithFeedback(file) {
        if (!this.validator) {
            return { 
                isValid: false, 
                error: 'Validator not initialized',
                code: 'VALIDATOR_NOT_INITIALIZED'
            };
        }
        
        // Enhanced validation with detailed error codes
        const result = await this.validator.validateFileFormat(file);
        
        // Add specific error codes for better user feedback
        if (!result.isValid) {
            if (file.size > 5 * 1024 * 1024) {
                result.code = 'FILE_TOO_LARGE';
            } else if (file.size === 0) {
                result.code = 'FILE_EMPTY';
            } else if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
                result.code = 'INVALID_FILE_FORMAT';
            } else {
                result.code = 'FILE_VALIDATION_ERROR';
            }
        }
        
        return result;
    }

    /**
     * Validate file format and size (legacy method for backward compatibility)
     * @param {File} file - File to validate
     * @returns {Promise<FileValidationResult>} Validation result
     * @private
     */
    async validateFile(file) {
        return this.validateFileWithFeedback(file);
    }

    /**
     * Filter out invalid data based on validation results
     * @param {Object[]} data - Raw data
     * @param {ValidationResults} validationResults - Validation results
     * @returns {Object[]} Valid data only
     * @private
     */
    filterValidData(data, validationResults) {
        const errorRows = new Set(
            validationResults.errors
                .filter(e => e.severity === 'error')
                .map(e => e.row)
        );
        
        return data.filter((_, index) => {
            const rowNumber = index + 2; // Account for header
            return !errorRows.has(rowNumber);
        });
    }

    /**
     * Setup drag & drop functionality for a target element
     * @param {HTMLElement} dropZone - Element to enable drag & drop on
     * @param {Object} options - Configuration options
     * @param {Function} options.onDrop - Callback when files are dropped
     * @param {Function} options.onDragOver - Callback when dragging over
     * @param {Function} options.onDragLeave - Callback when drag leaves
     * @param {string[]} options.acceptedTypes - Accepted file types
     */
    setupDragAndDrop(dropZone, options = {}) {
        const {
            onDrop,
            onDragOver,
            onDragLeave,
            acceptedTypes = ['.csv', '.xlsx', '.xls']
        } = options;

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        // Handle drag over
        dropZone.addEventListener('dragover', (e) => {
            dropZone.classList.add('dragover');
            if (onDragOver) onDragOver(e);
        });

        // Handle drag leave
        dropZone.addEventListener('dragleave', (e) => {
            // Only remove class if we're actually leaving the drop zone
            if (!dropZone.contains(e.relatedTarget)) {
                dropZone.classList.remove('dragover');
                if (onDragLeave) onDragLeave(e);
            }
        });

        // Handle file drop
        dropZone.addEventListener('drop', (e) => {
            dropZone.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files);
            const validFiles = files.filter(file => {
                return acceptedTypes.some(type => 
                    file.name.toLowerCase().endsWith(type.toLowerCase())
                );
            });

            if (validFiles.length === 0) {
                const error = new Error('No valid files found. Please upload CSV or Excel files only.');
                error.code = 'NO_VALID_FILES';
                if (onDrop) onDrop(null, error);
                return;
            }

            if (validFiles.length > 1) {
                const error = new Error('Please upload only one file at a time.');
                error.code = 'MULTIPLE_FILES';
                if (onDrop) onDrop(null, error);
                return;
            }

            if (onDrop) onDrop(validFiles[0]);
        });
    }

    /**
     * Setup file input change handler
     * @param {HTMLInputElement} fileInput - File input element
     * @param {Function} onChange - Callback when file is selected
     */
    setupFileInput(fileInput, onChange) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                onChange(file);
            }
        });
    }

    /**
     * Validate dropped files before processing
     * @param {FileList} files - Files from drag & drop or file input
     * @returns {Object} Validation result with valid files and errors
     */
    validateDroppedFiles(files) {
        const result = {
            validFiles: [],
            errors: []
        };

        if (!files || files.length === 0) {
            result.errors.push({
                type: 'format',
                message: 'No files provided',
                code: 'NO_FILES'
            });
            return result;
        }

        if (files.length > 1) {
            result.errors.push({
                type: 'format',
                message: 'Please upload only one file at a time',
                code: 'MULTIPLE_FILES'
            });
            return result;
        }

        const file = files[0];
        const acceptedExtensions = ['.csv', '.xlsx', '.xls'];
        const hasValidExtension = acceptedExtensions.some(ext => 
            file.name.toLowerCase().endsWith(ext)
        );

        if (!hasValidExtension) {
            result.errors.push({
                type: 'format',
                message: `Invalid file format. Please upload ${acceptedExtensions.join(', ')} files only`,
                code: 'INVALID_FORMAT'
            });
            return result;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            result.errors.push({
                type: 'format',
                message: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds the 5MB limit`,
                code: 'FILE_TOO_LARGE'
            });
            return result;
        }

        if (file.size === 0) {
            result.errors.push({
                type: 'format',
                message: 'File is empty',
                code: 'FILE_EMPTY'
            });
            return result;
        }

        result.validFiles.push(file);
        return result;
    }

    /**
     * Generate unique session ID
     * @returns {string} Session ID
     * @private
     */
    generateSessionId() {
        return 'upload_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// Export for use in other modules
export default ExcelUploadManager;