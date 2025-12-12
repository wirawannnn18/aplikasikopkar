/**
 * Error Display Manager for Excel Upload System
 * Manages the display of errors and warnings in the UI
 * 
 * Requirements: 2.3, 4.4
 */

class ErrorDisplayManager {
    constructor(containerId = 'errorContainer') {
        this.containerId = containerId;
        this.container = null;
        this.init();
    }

    /**
     * Initialize the error display container
     */
    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            // Create container if it doesn't exist
            this.container = document.createElement('div');
            this.container.id = this.containerId;
            this.container.className = 'error-display-container mb-3';
            
            // Find a suitable parent element
            const uploadContainer = document.querySelector('.upload-container') || 
                                  document.querySelector('.container') || 
                                  document.body;
            uploadContainer.insertBefore(this.container, uploadContainer.firstChild);
        }
    }

    /**
     * Display errors and warnings
     * @param {Object} errorReport - Error report from ErrorHandler
     */
    displayErrors(errorReport) {
        this.clear();
        
        if (!errorReport || (!errorReport.errors.length && !errorReport.warnings.length)) {
            return;
        }

        const errorContainer = this.createErrorContainer(errorReport);
        this.container.appendChild(errorContainer);
        
        // Scroll to errors if they exist
        if (errorReport.errors.length > 0) {
            this.container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    /**
     * Create error container with summary and details
     * @param {Object} errorReport - Error report
     */
    createErrorContainer(errorReport) {
        const container = document.createElement('div');
        container.className = 'error-report-container';
        
        // Create summary section
        if (errorReport.summary.totalErrors > 0 || errorReport.summary.totalWarnings > 0) {
            const summary = this.createSummarySection(errorReport.summary);
            container.appendChild(summary);
        }
        
        // Create errors section
        if (errorReport.errors.length > 0) {
            const errorsSection = this.createErrorsSection(errorReport.errors);
            container.appendChild(errorsSection);
        }
        
        // Create warnings section
        if (errorReport.warnings.length > 0) {
            const warningsSection = this.createWarningsSection(errorReport.warnings);
            container.appendChild(warningsSection);
        }
        
        return container;
    }

    /**
     * Create summary section
     * @param {Object} summary - Error summary
     */
    createSummarySection(summary) {
        const section = document.createElement('div');
        section.className = 'alert alert-dismissible fade show mb-3';
        section.className += summary.hasBlockingErrors ? ' alert-danger' : ' alert-warning';
        
        const content = document.createElement('div');
        content.innerHTML = `
            <div class="d-flex align-items-center mb-2">
                <i class="fas ${summary.hasBlockingErrors ? 'fa-exclamation-circle' : 'fa-exclamation-triangle'} me-2"></i>
                <strong>Validasi ${summary.hasBlockingErrors ? 'Gagal' : 'Peringatan'}</strong>
            </div>
            <div class="row">
                ${summary.totalErrors > 0 ? `
                    <div class="col-md-6">
                        <span class="badge bg-danger me-2">${summary.totalErrors}</span>
                        Error${summary.totalErrors > 1 ? 's' : ''} ditemukan
                    </div>
                ` : ''}
                ${summary.totalWarnings > 0 ? `
                    <div class="col-md-6">
                        <span class="badge bg-warning text-dark me-2">${summary.totalWarnings}</span>
                        Warning${summary.totalWarnings > 1 ? 's' : ''} ditemukan
                    </div>
                ` : ''}
            </div>
            ${summary.hasBlockingErrors ? `
                <div class="mt-2">
                    <small class="text-muted">
                        <i class="fas fa-info-circle me-1"></i>
                        Import tidak dapat dilanjutkan sampai semua error diperbaiki.
                    </small>
                </div>
            ` : ''}
        `;
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'btn-close';
        closeButton.setAttribute('data-bs-dismiss', 'alert');
        closeButton.setAttribute('aria-label', 'Close');
        
        section.appendChild(content);
        section.appendChild(closeButton);
        
        return section;
    }

    /**
     * Create errors section
     * @param {Array} errors - Array of errors
     */
    createErrorsSection(errors) {
        const section = document.createElement('div');
        section.className = 'errors-section mb-3';
        
        const header = document.createElement('div');
        header.className = 'card-header bg-danger text-white d-flex justify-content-between align-items-center';
        header.innerHTML = `
            <div>
                <i class="fas fa-exclamation-circle me-2"></i>
                <strong>Errors (${errors.length})</strong>
            </div>
            <button class="btn btn-sm btn-outline-light toggle-details" type="button">
                <i class="fas fa-chevron-down"></i> Detail
            </button>
        `;
        
        const body = document.createElement('div');
        body.className = 'card-body error-details collapse';
        
        const errorList = document.createElement('div');
        errorList.className = 'error-list';
        
        errors.forEach((error, index) => {
            const errorItem = this.createErrorItem(error, index, 'error');
            errorList.appendChild(errorItem);
        });
        
        body.appendChild(errorList);
        
        const card = document.createElement('div');
        card.className = 'card border-danger';
        card.appendChild(header);
        card.appendChild(body);
        
        // Add toggle functionality
        header.querySelector('.toggle-details').addEventListener('click', (e) => {
            const details = body;
            const icon = e.target.querySelector('i') || e.target.parentElement.querySelector('i');
            
            if (details.classList.contains('show')) {
                details.classList.remove('show');
                icon.className = 'fas fa-chevron-down';
            } else {
                details.classList.add('show');
                icon.className = 'fas fa-chevron-up';
            }
        });
        
        section.appendChild(card);
        return section;
    }

    /**
     * Create warnings section
     * @param {Array} warnings - Array of warnings
     */
    createWarningsSection(warnings) {
        const section = document.createElement('div');
        section.className = 'warnings-section mb-3';
        
        const header = document.createElement('div');
        header.className = 'card-header bg-warning text-dark d-flex justify-content-between align-items-center';
        header.innerHTML = `
            <div>
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Warnings (${warnings.length})</strong>
            </div>
            <button class="btn btn-sm btn-outline-dark toggle-details" type="button">
                <i class="fas fa-chevron-down"></i> Detail
            </button>
        `;
        
        const body = document.createElement('div');
        body.className = 'card-body warning-details collapse';
        
        const warningList = document.createElement('div');
        warningList.className = 'warning-list';
        
        warnings.forEach((warning, index) => {
            const warningItem = this.createErrorItem(warning, index, 'warning');
            warningList.appendChild(warningItem);
        });
        
        body.appendChild(warningList);
        
        const card = document.createElement('div');
        card.className = 'card border-warning';
        card.appendChild(header);
        card.appendChild(body);
        
        // Add toggle functionality
        header.querySelector('.toggle-details').addEventListener('click', (e) => {
            const details = body;
            const icon = e.target.querySelector('i') || e.target.parentElement.querySelector('i');
            
            if (details.classList.contains('show')) {
                details.classList.remove('show');
                icon.className = 'fas fa-chevron-down';
            } else {
                details.classList.add('show');
                icon.className = 'fas fa-chevron-up';
            }
        });
        
        section.appendChild(card);
        return section;
    }

    /**
     * Create individual error/warning item
     * @param {Object} item - Error or warning object
     * @param {number} index - Item index
     * @param {string} type - 'error' or 'warning'
     */
    createErrorItem(item, index, type) {
        const itemDiv = document.createElement('div');
        itemDiv.className = `${type}-item border-bottom pb-3 mb-3`;
        
        const iconClass = type === 'error' ? 'fa-times-circle text-danger' : 'fa-exclamation-triangle text-warning';
        
        itemDiv.innerHTML = `
            <div class="d-flex align-items-start">
                <i class="fas ${iconClass} me-2 mt-1"></i>
                <div class="flex-grow-1">
                    <div class="fw-bold">${item.displayMessage}</div>
                    ${item.context.row ? `<small class="text-muted">Baris: ${item.context.row}</small>` : ''}
                    ${item.context.field ? `<small class="text-muted ms-2">Field: ${item.context.field}</small>` : ''}
                    ${item.context.value !== null && item.context.value !== undefined ? 
                        `<small class="text-muted ms-2">Nilai: "${item.context.value}"</small>` : ''}
                    
                    ${item.guidance && item.guidance.length > 0 ? `
                        <div class="mt-2">
                            <small class="text-muted fw-bold">Solusi:</small>
                            <ul class="small text-muted mt-1 mb-0">
                                ${item.guidance.map(guide => `<li>${guide}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
                <small class="text-muted">${item.code}</small>
            </div>
        `;
        
        return itemDiv;
    }

    /**
     * Display success message
     * @param {string} message - Success message
     * @param {Object} stats - Import statistics (optional)
     */
    displaySuccess(message, stats = null) {
        this.clear();
        
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success alert-dismissible fade show';
        
        let content = `
            <div class="d-flex align-items-center">
                <i class="fas fa-check-circle me-2"></i>
                <strong>${message}</strong>
            </div>
        `;
        
        if (stats) {
            content += `
                <div class="mt-2">
                    <div class="row">
                        ${stats.created ? `<div class="col-md-4"><small>Dibuat: <strong>${stats.created}</strong></small></div>` : ''}
                        ${stats.updated ? `<div class="col-md-4"><small>Diupdate: <strong>${stats.updated}</strong></small></div>` : ''}
                        ${stats.failed ? `<div class="col-md-4"><small>Gagal: <strong>${stats.failed}</strong></small></div>` : ''}
                    </div>
                </div>
            `;
        }
        
        successDiv.innerHTML = content;
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'btn-close';
        closeButton.setAttribute('data-bs-dismiss', 'alert');
        closeButton.setAttribute('aria-label', 'Close');
        
        successDiv.appendChild(closeButton);
        this.container.appendChild(successDiv);
    }

    /**
     * Display info message
     * @param {string} message - Info message
     */
    displayInfo(message) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'alert alert-info alert-dismissible fade show';
        infoDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-info-circle me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        this.container.appendChild(infoDiv);
    }

    /**
     * Clear all displayed messages
     */
    clear() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    /**
     * Show loading state
     * @param {string} message - Loading message
     */
    showLoading(message = 'Memproses...') {
        this.clear();
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'alert alert-info';
        loadingDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="spinner-border spinner-border-sm me-2" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                ${message}
            </div>
        `;
        
        this.container.appendChild(loadingDiv);
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        const loadingAlert = this.container.querySelector('.alert-info');
        if (loadingAlert && loadingAlert.querySelector('.spinner-border')) {
            loadingAlert.remove();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorDisplayManager;
}