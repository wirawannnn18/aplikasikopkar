/**
 * Progress and Results Interface - Progress indicator and results display
 * Requirements: 5.5, 6.1, 6.4, 10.1, 10.2
 */

/**
 * Progress and results interface component
 * Displays progress indicator with cancel option, results summary, and report download functionality
 */
class ProgressResultsInterface {
    constructor(importManager, containerId) {
        this.importManager = importManager;
        this.container = document.getElementById(containerId);
        this.currentBatch = null;
        this.progressData = null;
        this.resultsData = null;
        this.isCancelled = false;
        this.progressInterval = null;
        
        if (!this.container) {
            throw new Error(`Container element with ID '${containerId}' not found`);
        }
        
        this.render();
        this.attachEventListeners();
    }

    /**
     * Render the progress and results interface
     * Requirements: 5.5, 6.1, 10.1
     */
    render() {
        this.container.innerHTML = `
            <div class="progress-results-interface">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-gear"></i> Processing Import
                        </h5>
                    </div>
                    <div class="card-body">
                        <!-- Progress State -->
                        <div class="progress-state" id="progressState">
                            <!-- Progress Header -->
                            <div class="progress-header mb-4">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="mb-1">Processing Batch</h6>
                                        <small class="text-muted" id="batchInfo">Preparing to process...</small>
                                    </div>
                                    <div>
                                        <button type="button" class="btn btn-outline-danger btn-sm" id="cancelProcess">
                                            <i class="bi bi-x-circle"></i> Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Progress Indicators -->
                            <div class="progress-indicators mb-4">
                                <!-- Overall Progress -->
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <label class="form-label mb-0">Overall Progress</label>
                                        <small class="text-muted">
                                            <span id="processedCount">0</span> of <span id="totalCount">0</span> transactions
                                        </small>
                                    </div>
                                    <div class="progress" style="height: 8px;">
                                        <div class="progress-bar progress-bar-striped progress-bar-animated" 
                                             id="overallProgress" 
                                             role="progressbar" 
                                             style="width: 0%"
                                             aria-valuenow="0" 
                                             aria-valuemin="0" 
                                             aria-valuemax="100">
                                        </div>
                                    </div>
                                </div>

                                <!-- Success Progress -->
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <label class="form-label mb-0 text-success">
                                            <i class="bi bi-check-circle"></i> Successful
                                        </label>
                                        <small class="text-success">
                                            <span id="successCount">0</span> transactions
                                        </small>
                                    </div>
                                    <div class="progress" style="height: 6px;">
                                        <div class="progress-bar bg-success" 
                                             id="successProgress" 
                                             role="progressbar" 
                                             style="width: 0%">
                                        </div>
                                    </div>
                                </div>

                                <!-- Error Progress -->
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <label class="form-label mb-0 text-danger">
                                            <i class="bi bi-x-circle"></i> Failed
                                        </label>
                                        <small class="text-danger">
                                            <span id="errorCount">0</span> transactions
                                        </small>
                                    </div>
                                    <div class="progress" style="height: 6px;">
                                        <div class="progress-bar bg-danger" 
                                             id="errorProgress" 
                                             role="progressbar" 
                                             style="width: 0%">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Current Operation -->
                            <div class="current-operation">
                                <div class="alert alert-info">
                                    <div class="d-flex align-items-center">
                                        <div class="spinner-border spinner-border-sm text-info me-3" role="status">
                                            <span class="visually-hidden">Loading...</span>
                                        </div>
                                        <div>
                                            <strong>Current Operation:</strong>
                                            <span id="currentOperation">Initializing...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Live Log -->
                            <div class="live-log">
                                <div class="card">
                                    <div class="card-header py-2">
                                        <small class="text-muted">
                                            <i class="bi bi-list-ul"></i> Processing Log
                                        </small>
                                    </div>
                                    <div class="card-body p-2" style="max-height: 200px; overflow-y: auto;" id="liveLog">
                                        <!-- Log entries will be added here -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add CSS styles
        this.addStyles();
    }

    /**
     * Add CSS styles for the progress and results interface
     */
    addStyles() {
        if (document.getElementById('progressResultsStyles')) return;

        const styles = document.createElement('style');
        styles.id = 'progressResultsStyles';
        styles.textContent = `
            .progress-indicators .progress {
                border-radius: 10px;
            }

            .progress-bar {
                transition: width 0.3s ease;
            }

            .live-log {
                font-family: 'Courier New', monospace;
                font-size: 0.875rem;
            }

            .log-entry {
                padding: 0.25rem 0;
                border-bottom: 1px solid #f0f0f0;
            }

            .log-entry:last-child {
                border-bottom: none;
            }

            .log-timestamp {
                color: #6c757d;
                font-size: 0.75rem;
            }

            .results-summary .metric-card {
                transition: transform 0.2s ease;
            }

            .results-summary .metric-card:hover {
                transform: translateY(-2px);
            }

            .results-table {
                font-size: 0.875rem;
            }

            .results-table .status-badge {
                font-size: 0.75rem;
            }

            .download-section {
                background-color: #f8f9fa;
                border-radius: 0.375rem;
                padding: 1rem;
                border: 1px solid #dee2e6;
            }
        `;
        document.head.appendChild(styles);
    }

    /**
     * Attach event listeners
     * Requirements: 10.2, 6.4
     */
    attachEventListeners() {
        // Button events
        this.container.addEventListener('click', (e) => {
            switch (e.target.id) {
                case 'cancelProcess':
                    this.cancelProcess();
                    break;
                case 'downloadReport':
                    this.downloadReport();
                    break;
                case 'downloadSuccessReport':
                    this.downloadSuccessReport();
                    break;
                case 'downloadErrorReport':
                    this.downloadErrorReport();
                    break;
                case 'startNewImport':
                    this.startNewImport();
                    break;
                case 'backToPreview':
                    this.backToPreview();
                    break;
            }
        });
    }

    /**
     * Start batch processing with progress tracking
     * Requirements: 5.5, 10.1
     * @param {Array} selectedData - Data to process
     * @param {string} batchId - Batch identifier
     */
    async startProcessing(selectedData, batchId) {
        try {
            this.currentBatch = batchId;
            this.isCancelled = false;
            this.progressData = {
                total: selectedData.length,
                processed: 0,
                successful: 0,
                failed: 0,
                currentOperation: 'Initializing batch processing...'
            };

            // Show progress state
            this.showProgressState();

            // Initialize progress display
            this.updateProgressDisplay();

            // Start processing
            await this.processBatchWithProgress(selectedData);

        } catch (error) {
            this.handleProcessingError(error);
        }
    }

    /**
     * Process batch with progress tracking
     * Requirements: 5.5
     * @param {Array} selectedData - Data to process
     */
    async processBatchWithProgress(selectedData) {
        const batchProcessor = this.importManager.batchProcessor;
        
        // Set up progress callback
        const progressCallback = (progress) => {
            this.progressData = { ...this.progressData, ...progress };
            this.updateProgressDisplay();
            this.addLogEntry(progress.message || 'Processing transaction...');
        };

        // Set up cancellation check
        const cancellationCheck = () => this.isCancelled;

        try {
            // Process batch
            this.addLogEntry('Starting batch processing...');
            const results = await batchProcessor.processPayments(
                selectedData, 
                progressCallback, 
                cancellationCheck
            );

            if (this.isCancelled) {
                this.handleCancellation();
            } else {
                this.handleProcessingComplete(results);
            }

        } catch (error) {
            if (this.isCancelled) {
                this.handleCancellation();
            } else {
                this.handleProcessingError(error);
            }
        }
    }

    /**
     * Show progress state
     */
    showProgressState() {
        // Update header
        this.container.querySelector('.card-header h5').innerHTML = `
            <i class="bi bi-gear-fill"></i> Processing Import
        `;

        // Show progress state
        this.container.querySelector('#progressState').classList.remove('d-none');
        
        // Hide other states
        const resultsState = this.container.querySelector('#resultsState');
        if (resultsState) {
            resultsState.classList.add('d-none');
        }
    }

    /**
     * Update progress display
     * Requirements: 5.5, 10.1
     */
    updateProgressDisplay() {
        if (!this.progressData) return;

        const { total, processed, successful, failed, currentOperation } = this.progressData;

        // Update batch info
        this.container.querySelector('#batchInfo').textContent = 
            `Batch ID: ${this.currentBatch} | Started: ${new Date().toLocaleTimeString()}`;

        // Update counts
        this.container.querySelector('#processedCount').textContent = processed;
        this.container.querySelector('#totalCount').textContent = total;
        this.container.querySelector('#successCount').textContent = successful;
        this.container.querySelector('#errorCount').textContent = failed;

        // Update progress bars
        const overallPercent = total > 0 ? (processed / total) * 100 : 0;
        const successPercent = total > 0 ? (successful / total) * 100 : 0;
        const errorPercent = total > 0 ? (failed / total) * 100 : 0;

        this.container.querySelector('#overallProgress').style.width = `${overallPercent}%`;
        this.container.querySelector('#overallProgress').setAttribute('aria-valuenow', overallPercent);

        this.container.querySelector('#successProgress').style.width = `${successPercent}%`;
        this.container.querySelector('#errorProgress').style.width = `${errorPercent}%`;

        // Update current operation
        this.container.querySelector('#currentOperation').textContent = currentOperation;
    }

    /**
     * Add log entry
     * @param {string} message - Log message
     * @param {string} type - Log type (info, success, error)
     */
    addLogEntry(message, type = 'info') {
        const logContainer = this.container.querySelector('#liveLog');
        const timestamp = new Date().toLocaleTimeString();
        
        const iconClass = type === 'success' ? 'bi-check-circle text-success' :
                         type === 'error' ? 'bi-x-circle text-danger' :
                         'bi-info-circle text-info';

        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.innerHTML = `
            <div class="d-flex align-items-start">
                <i class="bi ${iconClass} me-2 mt-1"></i>
                <div class="flex-grow-1">
                    <div>${message}</div>
                    <small class="log-timestamp">${timestamp}</small>
                </div>
            </div>
        `;

        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    /**
     * Handle processing completion
     * Requirements: 6.1
     * @param {Object} results - Processing results
     */
    handleProcessingComplete(results) {
        this.resultsData = results;
        this.addLogEntry('Batch processing completed successfully!', 'success');
        
        // Stop progress updates
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }

        // Show results
        setTimeout(() => {
            this.showResults();
        }, 1000);
    }

    /**
     * Handle processing error
     * @param {Error} error - Processing error
     */
    handleProcessingError(error) {
        this.addLogEntry(`Processing failed: ${error.message}`, 'error');
        
        // Stop progress updates
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }

        // Show error state
        this.showErrorState(error.message);
    }

    /**
     * Handle cancellation
     * Requirements: 10.2
     */
    handleCancellation() {
        this.addLogEntry('Processing cancelled by user', 'error');
        
        // Stop progress updates
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }

        // Show cancellation state
        this.showCancellationState();
    }

    /**
     * Cancel processing
     * Requirements: 10.2
     */
    async cancelProcess() {
        if (this.isCancelled) return;

        const confirmed = confirm('Are you sure you want to cancel the import process? This will rollback any completed transactions.');
        if (!confirmed) return;

        this.isCancelled = true;
        this.addLogEntry('Cancellation requested, stopping process...', 'error');

        // Disable cancel button
        const cancelButton = this.container.querySelector('#cancelProcess');
        cancelButton.disabled = true;
        cancelButton.innerHTML = '<i class="bi bi-hourglass-split"></i> Cancelling...';

        // Emit cancellation event
        const event = new CustomEvent('processingCancelled', {
            detail: {
                batchId: this.currentBatch,
                interface: this
            }
        });

        this.container.dispatchEvent(event);
    }

    /**
     * Show results state
     * Requirements: 6.1, 6.4
     */
    showResults() {
        if (!this.resultsData) return;

        // Update header
        this.container.querySelector('.card-header h5').innerHTML = `
            <i class="bi bi-check-circle-fill text-success"></i> Import Results
        `;

        // Create results content
        const resultsHtml = this.generateResultsHtml();
        
        // Replace progress state with results
        this.container.querySelector('.card-body').innerHTML = resultsHtml;

        // Reattach event listeners for new buttons
        this.attachEventListeners();
    }

    /**
     * Generate results HTML
     * Requirements: 6.1, 6.2, 6.4
     * @returns {string} Results HTML
     */
    generateResultsHtml() {
        const results = this.resultsData;
        
        return `
            <div class="results-state" id="resultsState">
                <!-- Results Summary -->
                <div class="results-summary mb-4">
                    <div class="row">
                        <div class="col-md-3">
                            <div class="card metric-card border-primary">
                                <div class="card-body text-center">
                                    <i class="bi bi-file-earmark-check text-primary" style="font-size: 2rem;"></i>
                                    <h4 class="mt-2 mb-1">${results.totalProcessed}</h4>
                                    <small class="text-muted">Total Processed</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card metric-card border-success">
                                <div class="card-body text-center">
                                    <i class="bi bi-check-circle text-success" style="font-size: 2rem;"></i>
                                    <h4 class="mt-2 mb-1">${results.successCount}</h4>
                                    <small class="text-muted">Successful</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card metric-card border-danger">
                                <div class="card-body text-center">
                                    <i class="bi bi-x-circle text-danger" style="font-size: 2rem;"></i>
                                    <h4 class="mt-2 mb-1">${results.failureCount}</h4>
                                    <small class="text-muted">Failed</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card metric-card border-info">
                                <div class="card-body text-center">
                                    <i class="bi bi-currency-dollar text-info" style="font-size: 2rem;"></i>
                                    <h4 class="mt-2 mb-1">${this.formatCurrency(results.summary?.totalAmount || 0)}</h4>
                                    <small class="text-muted">Total Amount</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Success/Failure Details -->
                ${this.generateTransactionDetails()}

                <!-- Download Section -->
                <div class="download-section mb-4">
                    <h6><i class="bi bi-download"></i> Download Reports</h6>
                    <p class="text-muted mb-3">Download detailed reports of the import process</p>
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-primary" id="downloadReport">
                            <i class="bi bi-file-earmark-arrow-down"></i> Complete Report
                        </button>
                        <button type="button" class="btn btn-success" id="downloadSuccessReport" ${results.successCount === 0 ? 'disabled' : ''}>
                            <i class="bi bi-file-earmark-check"></i> Success Report (${results.successCount})
                        </button>
                        <button type="button" class="btn btn-danger" id="downloadErrorReport" ${results.failureCount === 0 ? 'disabled' : ''}>
                            <i class="bi bi-file-earmark-x"></i> Error Report (${results.failureCount})
                        </button>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="action-buttons">
                    <div class="d-flex justify-content-between">
                        <div>
                            <button type="button" class="btn btn-primary" id="startNewImport">
                                <i class="bi bi-plus-circle"></i> Start New Import
                            </button>
                        </div>
                        <div>
                            <button type="button" class="btn btn-outline-secondary" id="backToPreview">
                                <i class="bi bi-arrow-left"></i> Back to Preview
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate transaction details HTML
     * Requirements: 6.2, 6.3
     * @returns {string} Transaction details HTML
     */
    generateTransactionDetails() {
        const results = this.resultsData;
        
        if (results.successCount === 0 && results.failureCount === 0) {
            return '<div class="alert alert-info">No transactions were processed.</div>';
        }

        let detailsHtml = '';

        // Success details
        if (results.successCount > 0) {
            const successRows = results.successTransactions.slice(0, 10).map(transaction => `
                <tr>
                    <td>
                        <span class="badge bg-success status-badge">Success</span>
                    </td>
                    <td>${transaction.memberNumber}</td>
                    <td>${transaction.memberName}</td>
                    <td>
                        <span class="badge ${transaction.paymentType === 'hutang' ? 'bg-warning' : 'bg-info'}">
                            ${transaction.paymentType}
                        </span>
                    </td>
                    <td>${this.formatCurrency(transaction.amount)}</td>
                    <td><small>${transaction.transactionId}</small></td>
                </tr>
            `).join('');

            detailsHtml += `
                <div class="mb-4">
                    <h6 class="text-success">
                        <i class="bi bi-check-circle"></i> Successful Transactions
                        ${results.successCount > 10 ? `(showing 10 of ${results.successCount})` : ''}
                    </h6>
                    <div class="table-responsive">
                        <table class="table table-sm results-table">
                            <thead>
                                <tr>
                                    <th>Status</th>
                                    <th>Member</th>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Transaction ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${successRows}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        // Failure details
        if (results.failureCount > 0) {
            const failureRows = results.failedTransactions.slice(0, 10).map(transaction => `
                <tr>
                    <td>
                        <span class="badge bg-danger status-badge">Failed</span>
                    </td>
                    <td>${transaction.memberNumber}</td>
                    <td>${transaction.memberName || 'N/A'}</td>
                    <td>
                        <span class="badge ${transaction.paymentType === 'hutang' ? 'bg-warning' : 'bg-info'}">
                            ${transaction.paymentType || 'N/A'}
                        </span>
                    </td>
                    <td>${this.formatCurrency(transaction.amount || 0)}</td>
                    <td><small class="text-danger">${transaction.error}</small></td>
                </tr>
            `).join('');

            detailsHtml += `
                <div class="mb-4">
                    <h6 class="text-danger">
                        <i class="bi bi-x-circle"></i> Failed Transactions
                        ${results.failureCount > 10 ? `(showing 10 of ${results.failureCount})` : ''}
                    </h6>
                    <div class="table-responsive">
                        <table class="table table-sm results-table">
                            <thead>
                                <tr>
                                    <th>Status</th>
                                    <th>Member</th>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Error</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${failureRows}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        return detailsHtml;
    }

    /**
     * Show error state
     * @param {string} errorMessage - Error message
     */
    showErrorState(errorMessage) {
        this.container.querySelector('.card-body').innerHTML = `
            <div class="error-state">
                <div class="alert alert-danger">
                    <h6 class="alert-heading">
                        <i class="bi bi-exclamation-triangle"></i> Processing Failed
                    </h6>
                    <p class="mb-0">${errorMessage}</p>
                </div>
                <div class="text-center">
                    <button type="button" class="btn btn-primary" id="startNewImport">
                        <i class="bi bi-plus-circle"></i> Start New Import
                    </button>
                    <button type="button" class="btn btn-secondary ms-2" id="backToPreview">
                        <i class="bi bi-arrow-left"></i> Back to Preview
                    </button>
                </div>
            </div>
        `;

        // Reattach event listeners
        this.attachEventListeners();
    }

    /**
     * Show cancellation state
     * Requirements: 10.2
     */
    showCancellationState() {
        this.container.querySelector('.card-body').innerHTML = `
            <div class="cancellation-state">
                <div class="alert alert-warning">
                    <h6 class="alert-heading">
                        <i class="bi bi-exclamation-triangle"></i> Import Cancelled
                    </h6>
                    <p class="mb-0">The import process was cancelled and any completed transactions have been rolled back.</p>
                </div>
                <div class="text-center">
                    <button type="button" class="btn btn-primary" id="startNewImport">
                        <i class="bi bi-plus-circle"></i> Start New Import
                    </button>
                    <button type="button" class="btn btn-secondary ms-2" id="backToPreview">
                        <i class="bi bi-arrow-left"></i> Back to Preview
                    </button>
                </div>
            </div>
        `;

        // Reattach event listeners
        this.attachEventListeners();
    }

    /**
     * Download complete report
     * Requirements: 6.4
     */
    downloadReport() {
        try {
            const success = this.importManager.downloadReport(this.resultsData, 'complete');
            if (success) {
                this.showTemporaryMessage('Report downloaded successfully!', 'success');
            } else {
                this.showTemporaryMessage('Failed to download report', 'error');
            }
        } catch (error) {
            this.showTemporaryMessage(`Download failed: ${error.message}`, 'error');
        }
    }

    /**
     * Download success report
     * Requirements: 6.4
     */
    downloadSuccessReport() {
        try {
            const success = this.importManager.downloadReport(this.resultsData, 'success');
            if (success) {
                this.showTemporaryMessage('Success report downloaded successfully!', 'success');
            } else {
                this.showTemporaryMessage('Failed to download success report', 'error');
            }
        } catch (error) {
            this.showTemporaryMessage(`Download failed: ${error.message}`, 'error');
        }
    }

    /**
     * Download error report
     * Requirements: 6.4
     */
    downloadErrorReport() {
        try {
            const success = this.importManager.downloadReport(this.resultsData, 'error');
            if (success) {
                this.showTemporaryMessage('Error report downloaded successfully!', 'success');
            } else {
                this.showTemporaryMessage('Failed to download error report', 'error');
            }
        } catch (error) {
            this.showTemporaryMessage(`Download failed: ${error.message}`, 'error');
        }
    }

    /**
     * Start new import
     */
    startNewImport() {
        // Emit event for parent component to handle
        const event = new CustomEvent('newImportRequested', {
            detail: {
                interface: this
            }
        });

        this.container.dispatchEvent(event);
    }

    /**
     * Back to preview
     */
    backToPreview() {
        // Emit event for parent component to handle
        const event = new CustomEvent('backToPreviewRequested', {
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
        
        this.container.insertAdjacentHTML('afterbegin', messageHtml);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const alert = this.container.querySelector('.alert');
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }

    /**
     * Format currency for display
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    /**
     * Get current results data
     * @returns {Object|null} Current results data
     */
    getResultsData() {
        return this.resultsData;
    }

    /**
     * Reset interface to initial state
     */
    reset() {
        this.currentBatch = null;
        this.progressData = null;
        this.resultsData = null;
        this.isCancelled = false;
        
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
        
        this.render();
    }
}

// Export for both browser and Node.js environments
if (typeof window !== 'undefined') {
    window.ProgressResultsInterface = ProgressResultsInterface;
}

// Browser compatibility - exports handled via window object

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProgressResultsInterface };
}