/**
 * Preview and Confirmation Interface - Preview table with validation status
 * Requirements: 4.1, 4.2, 4.3, 4.5
 */

/**
 * Preview and confirmation interface component
 * Displays preview table with validation status, summary statistics, and confirmation controls
 */
class PreviewConfirmationInterface {
    constructor(importManager, containerId) {
        this.importManager = importManager;
        this.container = document.getElementById(containerId);
        this.previewData = null;
        this.selectedRows = new Set();
        this.isSelectAll = false;
        
        if (!this.container) {
            throw new Error(`Container element with ID '${containerId}' not found`);
        }
        
        this.render();
        this.attachEventListeners();
    }

    /**
     * Render the preview interface
     * Requirements: 4.1, 4.2, 4.3
     */
    render() {
        this.container.innerHTML = `
            <div class="preview-confirmation-interface">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-eye"></i> Preview Import Data
                        </h5>
                    </div>
                    <div class="card-body">
                        <!-- Loading State -->
                        <div class="loading-state text-center py-5" id="loadingState">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p class="mt-3 text-muted">Processing file and generating preview...</p>
                        </div>

                        <!-- Preview Content -->
                        <div class="preview-content d-none" id="previewContent">
                            <!-- Summary Statistics -->
                            <div class="row mb-4" id="summaryStats">
                                <!-- Summary cards will be inserted here -->
                            </div>

                            <!-- Error Summary -->
                            <div class="error-summary mb-4" id="errorSummary">
                                <!-- Error summary will be inserted here -->
                            </div>

                            <!-- Selection Controls -->
                            <div class="selection-controls mb-3" id="selectionControls">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="selectAll">
                                            <label class="form-check-label" for="selectAll">
                                                Select All Valid Rows
                                            </label>
                                        </div>
                                        <small class="text-muted">
                                            <span id="selectedCount">0</span> of <span id="validCount">0</span> valid rows selected
                                        </small>
                                    </div>
                                    <div class="btn-group btn-group-sm">
                                        <button type="button" class="btn btn-outline-primary" id="selectValidRows">
                                            <i class="bi bi-check-square"></i> Select Valid
                                        </button>
                                        <button type="button" class="btn btn-outline-secondary" id="clearSelection">
                                            <i class="bi bi-square"></i> Clear All
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Preview Table -->
                            <div class="table-responsive" id="previewTableContainer">
                                <!-- Preview table will be inserted here -->
                            </div>

                            <!-- Confirmation Controls -->
                            <div class="confirmation-controls mt-4" id="confirmationControls">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <small class="text-muted">
                                            Ready to process <span id="processingCount">0</span> transactions
                                        </small>
                                    </div>
                                    <div>
                                        <button type="button" class="btn btn-success" id="confirmProcess" disabled>
                                            <i class="bi bi-play-circle"></i> Confirm & Process
                                        </button>
                                        <button type="button" class="btn btn-secondary ms-2" id="cancelPreview">
                                            <i class="bi bi-x-circle"></i> Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Error State -->
                        <div class="error-state d-none" id="errorState">
                            <div class="alert alert-danger">
                                <h6 class="alert-heading">
                                    <i class="bi bi-exclamation-triangle"></i> Preview Generation Failed
                                </h6>
                                <p class="mb-0" id="errorMessage">An error occurred while generating the preview.</p>
                            </div>
                            <div class="text-center">
                                <button type="button" class="btn btn-primary" id="retryPreview">
                                    <i class="bi bi-arrow-clockwise"></i> Retry
                                </button>
                                <button type="button" class="btn btn-secondary ms-2" id="backToUpload">
                                    <i class="bi bi-arrow-left"></i> Back to Upload
                                </button>
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
     * Add CSS styles for the preview interface
     */
    addStyles() {
        if (document.getElementById('previewConfirmationStyles')) return;

        const styles = document.createElement('style');
        styles.id = 'previewConfirmationStyles';
        styles.textContent = `
            .preview-table {
                font-size: 0.875rem;
            }

            .preview-table th {
                background-color: #f8f9fa;
                border-top: none;
                font-weight: 600;
                position: sticky;
                top: 0;
                z-index: 10;
            }

            .preview-table .row-valid {
                background-color: #f8fff8;
            }

            .preview-table .row-invalid {
                background-color: #fff5f5;
            }

            .preview-table .row-selected {
                background-color: #e7f1ff;
            }

            .status-icon {
                font-size: 1.1em;
            }

            .error-text {
                max-width: 200px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .error-text:hover {
                overflow: visible;
                white-space: normal;
                word-wrap: break-word;
            }

            .summary-card {
                transition: transform 0.2s ease;
            }

            .summary-card:hover {
                transform: translateY(-2px);
            }

            .selection-controls {
                background-color: #f8f9fa;
                padding: 1rem;
                border-radius: 0.375rem;
                border: 1px solid #dee2e6;
            }

            .confirmation-controls {
                background-color: #f8f9fa;
                padding: 1rem;
                border-radius: 0.375rem;
                border: 1px solid #dee2e6;
            }

            .table-responsive {
                max-height: 500px;
                overflow-y: auto;
            }
        `;
        document.head.appendChild(styles);
    }

    /**
     * Attach event listeners
     * Requirements: 4.5
     */
    attachEventListeners() {
        // Selection controls
        this.container.addEventListener('change', (e) => {
            if (e.target.id === 'selectAll') {
                this.handleSelectAll(e.target.checked);
            } else if (e.target.classList.contains('row-checkbox')) {
                this.handleRowSelection(e.target);
            }
        });

        // Button events
        this.container.addEventListener('click', (e) => {
            switch (e.target.id) {
                case 'selectValidRows':
                    this.selectValidRows();
                    break;
                case 'clearSelection':
                    this.clearSelection();
                    break;
                case 'confirmProcess':
                    this.confirmProcess();
                    break;
                case 'cancelPreview':
                    this.cancelPreview();
                    break;
                case 'retryPreview':
                    this.retryPreview();
                    break;
                case 'backToUpload':
                    this.backToUpload();
                    break;
            }
        });
    }

    /**
     * Generate and display preview
     * Requirements: 4.1, 4.2, 4.3
     * @param {Array} validatedData - Validated import data
     */
    async generatePreview(validatedData) {
        try {
            // Show loading state
            this.showLoadingState();

            // Get preview generator
            const previewGenerator = this.importManager.previewGenerator || 
                new (await import('./PreviewGenerator.js')).PreviewGenerator();

            // Generate complete preview
            this.previewData = previewGenerator.generateCompletePreview(validatedData);

            // Display preview
            this.displayPreview();

            // Initialize selection
            this.initializeSelection();

        } catch (error) {
            this.showErrorState(error.message);
        }
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        this.container.querySelector('#loadingState').classList.remove('d-none');
        this.container.querySelector('#previewContent').classList.add('d-none');
        this.container.querySelector('#errorState').classList.add('d-none');
    }

    /**
     * Display preview content
     * Requirements: 4.1, 4.2, 4.3
     */
    displayPreview() {
        // Hide loading state
        this.container.querySelector('#loadingState').classList.add('d-none');
        this.container.querySelector('#previewContent').classList.remove('d-none');
        this.container.querySelector('#errorState').classList.add('d-none');

        // Display summary statistics
        this.displaySummaryStats();

        // Display error summary
        this.displayErrorSummary();

        // Display preview table
        this.displayPreviewTable();

        // Update selection controls
        this.updateSelectionControls();
    }

    /**
     * Display summary statistics
     * Requirements: 4.2
     */
    displaySummaryStats() {
        const summaryContainer = this.container.querySelector('#summaryStats');
        const summary = this.previewData.summary;

        summaryContainer.innerHTML = `
            <div class="col-md-3">
                <div class="card summary-card border-primary">
                    <div class="card-body text-center">
                        <i class="bi bi-file-earmark-text text-primary" style="font-size: 2rem;"></i>
                        <h4 class="mt-2 mb-1">${summary.totalRows}</h4>
                        <small class="text-muted">Total Rows</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card summary-card border-success">
                    <div class="card-body text-center">
                        <i class="bi bi-check-circle text-success" style="font-size: 2rem;"></i>
                        <h4 class="mt-2 mb-1">${summary.validRows}</h4>
                        <small class="text-muted">Valid Rows</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card summary-card border-danger">
                    <div class="card-body text-center">
                        <i class="bi bi-x-circle text-danger" style="font-size: 2rem;"></i>
                        <h4 class="mt-2 mb-1">${summary.invalidRows}</h4>
                        <small class="text-muted">Invalid Rows</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card summary-card border-info">
                    <div class="card-body text-center">
                        <i class="bi bi-currency-dollar text-info" style="font-size: 2rem;"></i>
                        <h4 class="mt-2 mb-1">${summary.formattedTotalAmount}</h4>
                        <small class="text-muted">Total Amount</small>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Display error summary
     * Requirements: 4.3
     */
    displayErrorSummary() {
        const errorContainer = this.container.querySelector('#errorSummary');
        const errors = this.previewData.errors;

        if (errors.errorSummary.length === 0) {
            errorContainer.innerHTML = `
                <div class="alert alert-success">
                    <i class="bi bi-check-circle"></i> No validation errors found. All data is ready for processing.
                </div>
            `;
            return;
        }

        const errorListHtml = errors.errorSummary.map(error => `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <span>
                    <i class="bi bi-exclamation-triangle text-warning"></i>
                    ${error.error}
                </span>
                <span class="badge bg-warning rounded-pill">${error.count}</span>
            </li>
        `).join('');

        errorContainer.innerHTML = `
            <div class="alert alert-warning">
                <h6 class="alert-heading">
                    <i class="bi bi-exclamation-triangle"></i> Validation Issues Found
                </h6>
                <p class="mb-3">The following issues were found in your data:</p>
                <ul class="list-group list-group-flush">
                    ${errorListHtml}
                </ul>
                <hr>
                <p class="mb-0">
                    <small class="text-muted">
                        Only valid rows can be processed. Please review and correct invalid data if needed.
                    </small>
                </p>
            </div>
        `;
    }

    /**
     * Display preview table
     * Requirements: 4.1, 4.3
     */
    displayPreviewTable() {
        const tableContainer = this.container.querySelector('#previewTableContainer');
        const table = this.previewData.table;

        if (table.rows.length === 0) {
            tableContainer.innerHTML = `
                <div class="alert alert-info text-center">
                    <i class="bi bi-info-circle"></i> No data to preview
                </div>
            `;
            return;
        }

        const tableHtml = `
            <table class="table table-hover preview-table">
                <thead>
                    <tr>
                        <th width="50">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="tableSelectAll">
                            </div>
                        </th>
                        <th width="80">Status</th>
                        <th>Member</th>
                        <th width="120">Type</th>
                        <th width="150">Amount</th>
                        <th>Description</th>
                        <th width="200">Errors</th>
                    </tr>
                </thead>
                <tbody>
                    ${table.rows.map((row, index) => `
                        <tr class="${row.statusClass}" data-row-index="${index}">
                            <td>
                                <div class="form-check">
                                    <input class="form-check-input row-checkbox" 
                                           type="checkbox" 
                                           data-row-index="${index}"
                                           ${!row.isValid ? 'disabled' : ''}>
                                </div>
                            </td>
                            <td>
                                <i class="bi ${row.statusIcon} status-icon ${row.statusClass.includes('valid') ? 'text-success' : 'text-danger'}"></i>
                                <small class="d-block">${row.statusText}</small>
                            </td>
                            <td>
                                <strong>${row.memberName}</strong>
                                <br>
                                <small class="text-muted">${row.memberNumber}</small>
                            </td>
                            <td>
                                <span class="badge ${row.paymentType === 'hutang' ? 'bg-warning' : 'bg-info'}">
                                    ${row.paymentType}
                                </span>
                            </td>
                            <td>
                                <strong>${row.formattedAmount}</strong>
                            </td>
                            <td>
                                <small>${row.description || '-'}</small>
                            </td>
                            <td>
                                <small class="error-text text-danger" title="${row.errorText || ''}">
                                    ${row.errorText || '-'}
                                </small>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        tableContainer.innerHTML = tableHtml;

        // Add table select all functionality
        const tableSelectAll = tableContainer.querySelector('#tableSelectAll');
        tableSelectAll.addEventListener('change', (e) => {
            this.handleSelectAll(e.target.checked);
        });
    }

    /**
     * Initialize selection state
     */
    initializeSelection() {
        this.selectedRows.clear();
        this.isSelectAll = false;
        this.updateSelectionControls();
        this.updateConfirmationControls();
    }

    /**
     * Handle select all checkbox
     * @param {boolean} checked - Checkbox state
     */
    handleSelectAll(checked) {
        this.isSelectAll = checked;
        
        const validRows = this.previewData.table.rows
            .map((row, index) => ({ row, index }))
            .filter(({ row }) => row.isValid);

        if (checked) {
            // Select all valid rows
            validRows.forEach(({ index }) => {
                this.selectedRows.add(index);
            });
        } else {
            // Clear all selections
            this.selectedRows.clear();
        }

        // Update checkboxes
        this.updateRowCheckboxes();
        this.updateSelectionControls();
        this.updateConfirmationControls();
    }

    /**
     * Handle individual row selection
     * @param {HTMLInputElement} checkbox - Row checkbox
     */
    handleRowSelection(checkbox) {
        const rowIndex = parseInt(checkbox.dataset.rowIndex);
        
        if (checkbox.checked) {
            this.selectedRows.add(rowIndex);
        } else {
            this.selectedRows.delete(rowIndex);
            this.isSelectAll = false;
        }

        this.updateSelectionControls();
        this.updateConfirmationControls();
    }

    /**
     * Select all valid rows
     */
    selectValidRows() {
        const validRows = this.previewData.table.rows
            .map((row, index) => ({ row, index }))
            .filter(({ row }) => row.isValid);

        validRows.forEach(({ index }) => {
            this.selectedRows.add(index);
        });

        this.isSelectAll = true;
        this.updateRowCheckboxes();
        this.updateSelectionControls();
        this.updateConfirmationControls();
    }

    /**
     * Clear all selections
     */
    clearSelection() {
        this.selectedRows.clear();
        this.isSelectAll = false;
        this.updateRowCheckboxes();
        this.updateSelectionControls();
        this.updateConfirmationControls();
    }

    /**
     * Update row checkboxes to match selection state
     */
    updateRowCheckboxes() {
        const checkboxes = this.container.querySelectorAll('.row-checkbox');
        checkboxes.forEach(checkbox => {
            const rowIndex = parseInt(checkbox.dataset.rowIndex);
            checkbox.checked = this.selectedRows.has(rowIndex);
        });

        // Update select all checkboxes
        const selectAllCheckboxes = this.container.querySelectorAll('#selectAll, #tableSelectAll');
        selectAllCheckboxes.forEach(checkbox => {
            checkbox.checked = this.isSelectAll;
        });
    }

    /**
     * Update selection controls display
     */
    updateSelectionControls() {
        const selectedCount = this.selectedRows.size;
        const validCount = this.previewData.summary.validRows;

        this.container.querySelector('#selectedCount').textContent = selectedCount;
        this.container.querySelector('#validCount').textContent = validCount;
    }

    /**
     * Update confirmation controls
     */
    updateConfirmationControls() {
        const selectedCount = this.selectedRows.size;
        const confirmButton = this.container.querySelector('#confirmProcess');
        const processingCount = this.container.querySelector('#processingCount');

        processingCount.textContent = selectedCount;
        confirmButton.disabled = selectedCount === 0;
    }

    /**
     * Confirm and process selected rows
     * Requirements: 4.5
     */
    confirmProcess() {
        if (this.selectedRows.size === 0) {
            this.showTemporaryMessage('Please select at least one row to process', 'warning');
            return;
        }

        // Get selected data
        const selectedData = Array.from(this.selectedRows).map(index => {
            return this.previewData.originalData[index];
        });

        // Emit event for parent component to handle
        const event = new CustomEvent('processConfirmed', {
            detail: {
                selectedData,
                selectedCount: this.selectedRows.size,
                interface: this
            }
        });

        this.container.dispatchEvent(event);
    }

    /**
     * Cancel preview
     */
    cancelPreview() {
        // Emit event for parent component to handle
        const event = new CustomEvent('previewCancelled', {
            detail: {
                interface: this
            }
        });

        this.container.dispatchEvent(event);
    }

    /**
     * Retry preview generation
     */
    retryPreview() {
        // Emit event for parent component to handle
        const event = new CustomEvent('previewRetryRequested', {
            detail: {
                interface: this
            }
        });

        this.container.dispatchEvent(event);
    }

    /**
     * Back to upload
     */
    backToUpload() {
        // Emit event for parent component to handle
        const event = new CustomEvent('backToUploadRequested', {
            detail: {
                interface: this
            }
        });

        this.container.dispatchEvent(event);
    }

    /**
     * Show error state
     * @param {string} errorMessage - Error message to display
     */
    showErrorState(errorMessage) {
        this.container.querySelector('#loadingState').classList.add('d-none');
        this.container.querySelector('#previewContent').classList.add('d-none');
        this.container.querySelector('#errorState').classList.remove('d-none');
        this.container.querySelector('#errorMessage').textContent = errorMessage;
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
     * Get selected data
     * @returns {Array} Selected row data
     */
    getSelectedData() {
        if (!this.previewData) return [];
        
        return Array.from(this.selectedRows).map(index => {
            return this.previewData.originalData[index];
        });
    }

    /**
     * Reset interface to initial state
     */
    reset() {
        this.previewData = null;
        this.selectedRows.clear();
        this.isSelectAll = false;
        this.showLoadingState();
    }
}

// Export for both browser and Node.js environments
if (typeof window !== 'undefined') {
    window.PreviewConfirmationInterface = PreviewConfirmationInterface;
}

// Browser compatibility - exports handled via window object

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PreviewConfirmationInterface };
}