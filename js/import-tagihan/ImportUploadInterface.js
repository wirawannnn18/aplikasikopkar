/**
 * Import Upload Interface - File upload component with drag-and-drop
 * Requirements: 1.1, 2.1, 2.5
 */

/**
 * Import upload interface component
 * Handles file upload, template download, and validation feedback
 */
class ImportUploadInterface {
    constructor(importManager, containerId) {
        this.importManager = importManager;
        this.containerId = containerId;
        this.container = null;
        this.currentFile = null;
        this.isDragOver = false;
        
        // Don't initialize immediately if container doesn't exist yet
        if (containerId && document.getElementById(containerId)) {
            this.container = document.getElementById(containerId);
            this.render();
            this.attachEventListeners();
        }
    }
    
    /**
     * Render and attach to a container
     * @param {string} containerId - Container element ID
     */
    renderAndAttach(containerId) {
        this.containerId = containerId || this.containerId;
        this.container = document.getElementById(this.containerId);
        
        if (!this.container) {
            throw new Error(`Container element with ID '${this.containerId}' not found`);
        }
        
        this.render();
        this.attachEventListeners();
    }

    /**
     * Render the upload interface
     * Requirements: 1.1, 2.1
     */
    render() {
        this.container.innerHTML = `
            <div class="import-upload-interface">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">
                            <i class="bi bi-cloud-upload"></i> Import Tagihan Pembayaran
                        </h5>
                        <button type="button" class="btn btn-outline-primary btn-sm" id="downloadTemplate">
                            <i class="bi bi-download"></i> Download Template
                        </button>
                    </div>
                    <div class="card-body">
                        <!-- File Upload Area -->
                        <div class="upload-area" id="uploadArea">
                            <div class="upload-content">
                                <i class="bi bi-cloud-upload upload-icon"></i>
                                <h6>Drag & Drop File Here</h6>
                                <p class="text-muted mb-3">or click to browse files</p>
                                <input type="file" id="fileInput" class="d-none" accept=".csv,.xlsx,.xls">
                                <button type="button" class="btn btn-primary" id="browseButton">
                                    <i class="bi bi-folder2-open"></i> Browse Files
                                </button>
                            </div>
                        </div>

                        <!-- File Information -->
                        <div class="file-info d-none" id="fileInfo">
                            <div class="alert alert-info">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h6 class="alert-heading mb-1">
                                            <i class="bi bi-file-earmark-text"></i> <span id="fileName"></span>
                                        </h6>
                                        <small class="text-muted">
                                            Size: <span id="fileSize"></span> | 
                                            Type: <span id="fileType"></span>
                                        </small>
                                    </div>
                                    <button type="button" class="btn btn-sm btn-outline-danger" id="removeFile">
                                        <i class="bi bi-x"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Validation Feedback -->
                        <div class="validation-feedback" id="validationFeedback"></div>

                        <!-- Upload Instructions -->
                        <div class="upload-instructions">
                            <h6><i class="bi bi-info-circle"></i> Format Requirements:</h6>
                            <ul class="small text-muted">
                                <li>Supported formats: CSV (.csv), Excel (.xlsx, .xls)</li>
                                <li>Maximum file size: 5MB</li>
                                <li>Maximum rows: 1000</li>
                                <li>Required columns: nomor_anggota, nama_anggota, jenis_pembayaran, jumlah_pembayaran, keterangan</li>
                            </ul>
                        </div>

                        <!-- Action Buttons -->
                        <div class="action-buttons mt-3 d-none" id="actionButtons">
                            <button type="button" class="btn btn-success" id="processFile">
                                <i class="bi bi-arrow-right"></i> Process File
                            </button>
                            <button type="button" class="btn btn-secondary ms-2" id="cancelUpload">
                                <i class="bi bi-x-circle"></i> Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add CSS styles
        this.addStyles();
    }

    /**
     * Add CSS styles for the upload interface
     */
    addStyles() {
        if (document.getElementById('importUploadStyles')) return;

        const styles = document.createElement('style');
        styles.id = 'importUploadStyles';
        styles.textContent = `
            .upload-area {
                border: 2px dashed #dee2e6;
                border-radius: 8px;
                padding: 3rem 2rem;
                text-align: center;
                transition: all 0.3s ease;
                cursor: pointer;
                background-color: #f8f9fa;
            }

            .upload-area:hover {
                border-color: #0d6efd;
                background-color: #e7f1ff;
            }

            .upload-area.drag-over {
                border-color: #0d6efd;
                background-color: #e7f1ff;
                transform: scale(1.02);
            }

            .upload-icon {
                font-size: 3rem;
                color: #6c757d;
                margin-bottom: 1rem;
            }

            .upload-area.drag-over .upload-icon {
                color: #0d6efd;
            }

            .validation-feedback .alert {
                margin-bottom: 0.5rem;
            }

            .validation-feedback .alert:last-child {
                margin-bottom: 0;
            }

            .file-info .alert {
                margin-bottom: 0;
            }

            .upload-instructions ul {
                margin-bottom: 0;
            }
        `;
        document.head.appendChild(styles);
    }

    /**
     * Attach event listeners
     * Requirements: 2.1, 2.5
     */
    attachEventListeners() {
        const uploadArea = this.container.querySelector('#uploadArea');
        const fileInput = this.container.querySelector('#fileInput');
        const browseButton = this.container.querySelector('#browseButton');
        const downloadTemplate = this.container.querySelector('#downloadTemplate');
        const removeFile = this.container.querySelector('#removeFile');
        const processFile = this.container.querySelector('#processFile');
        const cancelUpload = this.container.querySelector('#cancelUpload');

        // Drag and drop events
        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        uploadArea.addEventListener('click', () => fileInput.click());

        // File input events
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        browseButton.addEventListener('click', () => fileInput.click());

        // Button events
        downloadTemplate.addEventListener('click', () => this.downloadTemplate());
        removeFile.addEventListener('click', () => this.removeFile());
        processFile.addEventListener('click', () => this.processFile());
        cancelUpload.addEventListener('click', () => this.cancelUpload());
    }

    /**
     * Handle drag over event
     * @param {DragEvent} e - Drag event
     */
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (!this.isDragOver) {
            this.isDragOver = true;
            this.container.querySelector('#uploadArea').classList.add('drag-over');
        }
    }

    /**
     * Handle drag leave event
     * @param {DragEvent} e - Drag event
     */
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Only remove drag-over if leaving the upload area completely
        if (!this.container.querySelector('#uploadArea').contains(e.relatedTarget)) {
            this.isDragOver = false;
            this.container.querySelector('#uploadArea').classList.remove('drag-over');
        }
    }

    /**
     * Handle file drop event
     * @param {DragEvent} e - Drop event
     */
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        this.isDragOver = false;
        this.container.querySelector('#uploadArea').classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.handleFile(files[0]);
        }
    }

    /**
     * Handle file selection from input
     * @param {Event} e - Change event
     */
    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.handleFile(files[0]);
        }
    }

    /**
     * Handle file processing
     * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
     * @param {File} file - Selected file
     */
    async handleFile(file) {
        this.currentFile = file;
        
        // Show file information
        this.showFileInfo(file);
        
        // Validate file
        await this.validateFile(file);
    }

    /**
     * Show file information
     * @param {File} file - Selected file
     */
    showFileInfo(file) {
        const fileInfo = this.container.querySelector('#fileInfo');
        const fileName = this.container.querySelector('#fileName');
        const fileSize = this.container.querySelector('#fileSize');
        const fileType = this.container.querySelector('#fileType');

        fileName.textContent = file.name;
        fileSize.textContent = this.formatFileSize(file.size);
        fileType.textContent = file.type || 'Unknown';

        fileInfo.classList.remove('d-none');
    }

    /**
     * Validate uploaded file
     * Requirements: 2.2, 2.3, 2.4, 2.5
     * @param {File} file - File to validate
     */
    async validateFile(file) {
        const feedbackContainer = this.container.querySelector('#validationFeedback');
        const actionButtons = this.container.querySelector('#actionButtons');
        
        try {
            // Get file parser from import manager
            const fileParser = this.importManager.fileParser || 
                new (await import('./FileParser.js')).FileParser();

            // Validate file format
            const formatResult = fileParser.validateFileFormat(file);
            
            // Validate file size
            const sizeResult = fileParser.validateFileSize(file);

            // Collect validation results
            const validationResults = [];
            
            if (!formatResult.valid) {
                validationResults.push({
                    type: 'error',
                    message: formatResult.error
                });
            }
            
            if (!sizeResult.valid) {
                validationResults.push({
                    type: 'error',
                    message: sizeResult.error
                });
            }

            // Try to parse file for additional validation
            if (formatResult.valid && sizeResult.valid) {
                try {
                    const parseResult = await fileParser.parseFile(file);
                    
                    if (!parseResult.success) {
                        validationResults.push({
                            type: 'error',
                            message: parseResult.error
                        });
                    } else {
                        // Check row count
                        if (parseResult.data.length === 0) {
                            validationResults.push({
                                type: 'warning',
                                message: 'File appears to be empty'
                            });
                        } else if (parseResult.data.length > 1000) {
                            validationResults.push({
                                type: 'error',
                                message: `Too many rows: ${parseResult.data.length} (maximum: 1000)`
                            });
                        } else {
                            validationResults.push({
                                type: 'success',
                                message: `File parsed successfully: ${parseResult.data.length} rows found`
                            });
                        }

                        // Check required columns
                        const requiredColumns = ['nomor_anggota', 'nama_anggota', 'jenis_pembayaran', 'jumlah_pembayaran', 'keterangan'];
                        const missingColumns = requiredColumns.filter(col => 
                            !parseResult.headers.some(header => 
                                header.toLowerCase().trim() === col.toLowerCase()
                            )
                        );

                        if (missingColumns.length > 0) {
                            validationResults.push({
                                type: 'error',
                                message: `Missing required columns: ${missingColumns.join(', ')}`
                            });
                        }
                    }
                } catch (parseError) {
                    validationResults.push({
                        type: 'error',
                        message: `Failed to parse file: ${parseError.message}`
                    });
                }
            }

            // Display validation results
            this.displayValidationResults(validationResults);

            // Show/hide action buttons based on validation
            const hasErrors = validationResults.some(result => result.type === 'error');
            if (hasErrors) {
                actionButtons.classList.add('d-none');
            } else {
                actionButtons.classList.remove('d-none');
            }

        } catch (error) {
            this.displayValidationResults([{
                type: 'error',
                message: `Validation failed: ${error.message}`
            }]);
            actionButtons.classList.add('d-none');
        }
    }

    /**
     * Display validation results
     * Requirements: 2.5
     * @param {Array} results - Validation results
     */
    displayValidationResults(results) {
        const feedbackContainer = this.container.querySelector('#validationFeedback');
        
        if (results.length === 0) {
            feedbackContainer.innerHTML = '';
            return;
        }

        const alertsHtml = results.map(result => {
            const alertClass = result.type === 'error' ? 'alert-danger' : 
                              result.type === 'warning' ? 'alert-warning' : 'alert-success';
            const icon = result.type === 'error' ? 'bi-exclamation-triangle' : 
                        result.type === 'warning' ? 'bi-exclamation-circle' : 'bi-check-circle';
            
            return `
                <div class="alert ${alertClass} py-2">
                    <i class="bi ${icon}"></i> ${result.message}
                </div>
            `;
        }).join('');

        feedbackContainer.innerHTML = alertsHtml;
    }

    /**
     * Download template file
     * Requirements: 1.1, 1.5
     */
    downloadTemplate() {
        try {
            const success = this.importManager.downloadTemplate();
            if (success) {
                this.showTemporaryMessage('Template downloaded successfully!', 'success');
            } else {
                this.showTemporaryMessage('Failed to download template', 'error');
            }
        } catch (error) {
            this.showTemporaryMessage(`Download failed: ${error.message}`, 'error');
        }
    }

    /**
     * Remove selected file
     */
    removeFile() {
        this.currentFile = null;
        
        // Reset file input
        this.container.querySelector('#fileInput').value = '';
        
        // Hide file info and action buttons
        this.container.querySelector('#fileInfo').classList.add('d-none');
        this.container.querySelector('#actionButtons').classList.add('d-none');
        
        // Clear validation feedback
        this.container.querySelector('#validationFeedback').innerHTML = '';
    }

    /**
     * Process uploaded file
     * Requirements: 2.1
     */
    async processFile() {
        if (!this.currentFile) {
            this.showTemporaryMessage('No file selected', 'error');
            return;
        }

        // Emit event for parent component to handle
        const event = new CustomEvent('fileProcessRequested', {
            detail: {
                file: this.currentFile,
                interface: this
            }
        });
        
        this.container.dispatchEvent(event);
    }

    /**
     * Cancel upload
     */
    cancelUpload() {
        this.removeFile();
        
        // Emit event for parent component to handle
        const event = new CustomEvent('uploadCancelled', {
            detail: {
                interface: this
            }
        });
        
        this.container.dispatchEvent(event);
    }

    /**
     * Show temporary message
     * @param {string} message - Message to show
     * @param {string} type - Message type (success, error, warning)
     */
    showTemporaryMessage(message, type = 'info') {
        const alertClass = type === 'error' ? 'alert-danger' : 
                          type === 'warning' ? 'alert-warning' : 
                          type === 'success' ? 'alert-success' : 'alert-info';
        
        const messageHtml = `
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        const feedbackContainer = this.container.querySelector('#validationFeedback');
        feedbackContainer.insertAdjacentHTML('afterbegin', messageHtml);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const alert = feedbackContainer.querySelector('.alert');
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }

    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get current file
     * @returns {File|null} Current selected file
     */
    getCurrentFile() {
        return this.currentFile;
    }

    /**
     * Reset interface to initial state
     */
    reset() {
        this.removeFile();
    }
}

// Export for both browser and Node.js environments
if (typeof window !== 'undefined') {
    window.ImportUploadInterface = ImportUploadInterface;
}

// Browser compatibility - exports handled via window object

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ImportUploadInterface };
}