/**
 * UI Manager
 * Mengelola antarmuka pengguna untuk upload master barang Excel
 * Task 5.1: Create interactive data preview table
 * Task 5.2: Implement step-by-step wizard interface
 */

class UIManager {
    constructor() {
        this.currentStep = 1;
        this.uploadedData = null;
        this.validationResults = null;
        this.importResults = null;
        
        // Initialize components
        this.initializeEventListeners();
    }

    /**
     * Initialize all event listeners
     */
    initializeEventListeners() {
        // Step navigation
        this.setupStepNavigation();
        
        // Preview table interactions
        this.setupPreviewTableInteractions();
        
        // Filter and search functionality
        this.setupFilterAndSearch();
    }

    /**
     * Setup step navigation
     */
    setupStepNavigation() {
        // Navigation buttons are handled in main HTML file
        // This method can be extended for additional navigation logic
    }

    /**
     * Setup preview table interactions
     * Task 5.1: Interactive data preview table
     */
    setupPreviewTableInteractions() {
        // Add sorting functionality
        this.setupTableSorting();
        
        // Add row selection
        this.setupRowSelection();
        
        // Add validation indicators
        this.setupValidationIndicators();
    }

    /**
     * Setup table sorting functionality
     */
    setupTableSorting() {
        const headers = document.querySelectorAll('#previewTable th');
        headers.forEach((header, index) => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => this.sortTable(index));
            
            // Add sort indicator
            const sortIcon = document.createElement('i');
            sortIcon.className = 'fas fa-sort ms-2 text-muted';
            sortIcon.style.fontSize = '0.8rem';
            header.appendChild(sortIcon);
        });
    }

    /**
     * Sort table by column
     * @param {number} columnIndex - Column index to sort by
     */
    sortTable(columnIndex) {
        if (!this.uploadedData) return;

        const table = document.getElementById('previewTable');
        const tbody = document.getElementById('previewTableBody');
        const header = table.querySelectorAll('th')[columnIndex];
        const sortIcon = header.querySelector('i');
        
        // Determine sort direction
        const isAscending = !header.classList.contains('sort-desc');
        
        // Reset all sort indicators
        table.querySelectorAll('th').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
            const icon = th.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-sort ms-2 text-muted';
            }
        });
        
        // Set current sort indicator
        header.classList.add(isAscending ? 'sort-asc' : 'sort-desc');
        sortIcon.className = `fas fa-sort-${isAscending ? 'up' : 'down'} ms-2 text-primary`;
        
        // Sort data
        const columnNames = ['kode', 'nama', 'kategori', 'satuan', 'harga_beli', 'stok', 'supplier'];
        const columnName = columnNames[columnIndex];
        
        if (columnName) {
            this.uploadedData.sort((a, b) => {
                let aVal = a[columnName] || '';
                let bVal = b[columnName] || '';
                
                // Handle numeric columns
                if (columnName === 'harga_beli' || columnName === 'stok') {
                    aVal = parseFloat(aVal) || 0;
                    bVal = parseFloat(bVal) || 0;
                } else {
                    aVal = aVal.toString().toLowerCase();
                    bVal = bVal.toString().toLowerCase();
                }
                
                if (aVal < bVal) return isAscending ? -1 : 1;
                if (aVal > bVal) return isAscending ? 1 : -1;
                return 0;
            });
            
            // Re-render table
            this.renderPreviewTable(this.uploadedData);
        }
    }

    /**
     * Setup row selection functionality
     */
    setupRowSelection() {
        // Add select all checkbox to header
        const headerRow = document.querySelector('#previewTable thead tr');
        const selectAllCell = document.createElement('th');
        selectAllCell.innerHTML = '<input type="checkbox" id="selectAll" class="form-check-input">';
        headerRow.insertBefore(selectAllCell, headerRow.firstChild);
        
        // Handle select all
        document.getElementById('selectAll').addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('#previewTableBody input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = e.target.checked;
            });
            this.updateSelectionCount();
        });
    }

    /**
     * Setup validation indicators
     */
    setupValidationIndicators() {
        // This will be enhanced when validation results are available
        // For now, we'll add basic structure
    }

    /**
     * Setup filter and search functionality
     */
    setupFilterAndSearch() {
        // Add search and filter controls to preview step
        const previewCard = document.getElementById('previewStep');
        const cardBody = previewCard.querySelector('.card-body');
        
        // Create filter controls container
        const filterContainer = document.createElement('div');
        filterContainer.className = 'row mb-3';
        filterContainer.id = 'filterContainer';
        filterContainer.innerHTML = `
            <div class="col-md-4">
                <div class="input-group">
                    <span class="input-group-text"><i class="fas fa-search"></i></span>
                    <input type="text" class="form-control" id="searchInput" placeholder="Cari data...">
                </div>
            </div>
            <div class="col-md-3">
                <select class="form-select" id="categoryFilter">
                    <option value="">Semua Kategori</option>
                </select>
            </div>
            <div class="col-md-3">
                <select class="form-select" id="unitFilter">
                    <option value="">Semua Satuan</option>
                </select>
            </div>
            <div class="col-md-2">
                <button class="btn btn-outline-secondary w-100" id="clearFiltersBtn">
                    <i class="fas fa-times me-1"></i>Clear
                </button>
            </div>
        `;
        
        // Insert filter container before preview table
        const previewTable = cardBody.querySelector('.preview-table');
        cardBody.insertBefore(filterContainer, previewTable);
        
        // Setup filter event listeners
        document.getElementById('searchInput').addEventListener('input', () => this.applyFilters());
        document.getElementById('categoryFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('unitFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('clearFiltersBtn').addEventListener('click', () => this.clearFilters());
    }

    /**
     * Render preview table with data
     * @param {Array} data - Data to display
     * @param {Object} validationResults - Validation results (optional)
     */
    renderPreviewTable(data, validationResults = null) {
        const tableBody = document.getElementById('previewTableBody');
        tableBody.innerHTML = '';
        
        // Update record count
        document.getElementById('recordCount').textContent = `${data.length} records`;
        
        // Populate filter options
        this.populateFilterOptions(data);
        
        data.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.dataset.index = index;
            
            // Get validation status for this row
            const validationStatus = this.getRowValidationStatus(row, index, validationResults);
            
            tr.innerHTML = `
                <td>
                    <input type="checkbox" class="form-check-input row-select" data-index="${index}">
                </td>
                <td>
                    <span class="fw-bold">${this.escapeHtml(row.kode)}</span>
                    ${validationStatus.kode ? this.renderValidationBadge(validationStatus.kode) : ''}
                </td>
                <td>
                    ${this.escapeHtml(row.nama)}
                    ${validationStatus.nama ? this.renderValidationBadge(validationStatus.nama) : ''}
                </td>
                <td>
                    <span class="badge bg-secondary">${this.escapeHtml(row.kategori)}</span>
                    ${validationStatus.kategori ? this.renderValidationBadge(validationStatus.kategori) : ''}
                </td>
                <td>
                    <span class="badge bg-info">${this.escapeHtml(row.satuan)}</span>
                    ${validationStatus.satuan ? this.renderValidationBadge(validationStatus.satuan) : ''}
                </td>
                <td>
                    ${this.formatCurrency(row.harga_beli)}
                    ${validationStatus.harga_beli ? this.renderValidationBadge(validationStatus.harga_beli) : ''}
                </td>
                <td>
                    ${this.formatNumber(row.stok)}
                    ${validationStatus.stok ? this.renderValidationBadge(validationStatus.stok) : ''}
                </td>
                <td>
                    ${this.escapeHtml(row.supplier || '-')}
                    ${validationStatus.supplier ? this.renderValidationBadge(validationStatus.supplier) : ''}
                </td>
                <td>
                    ${this.renderOverallStatus(validationStatus)}
                </td>
            `;
            
            // Add row click handler for details
            tr.addEventListener('click', (e) => {
                if (e.target.type !== 'checkbox') {
                    this.showRowDetails(row, index, validationStatus);
                }
            });
            
            tableBody.appendChild(tr);
        });
        
        // Setup row selection handlers
        document.querySelectorAll('.row-select').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateSelectionCount());
        });
    }

    /**
     * Get validation status for a row
     * @param {Object} row - Data row
     * @param {number} index - Row index
     * @param {Object} validationResults - Validation results
     * @returns {Object} Validation status for each field
     */
    getRowValidationStatus(row, index, validationResults) {
        if (!validationResults) {
            return { overall: 'valid' };
        }
        
        const status = { overall: 'valid' };
        
        // Check for errors and warnings for this row
        if (validationResults.errors) {
            validationResults.errors.forEach(error => {
                if (error.row === index + 1) { // 1-based row numbering
                    status[error.field] = { type: 'error', message: error.message };
                    status.overall = 'error';
                }
            });
        }
        
        if (validationResults.warnings) {
            validationResults.warnings.forEach(warning => {
                if (warning.row === index + 1) { // 1-based row numbering
                    if (!status[warning.field] || status[warning.field].type !== 'error') {
                        status[warning.field] = { type: 'warning', message: warning.message };
                        if (status.overall === 'valid') {
                            status.overall = 'warning';
                        }
                    }
                }
            });
        }
        
        return status;
    }

    /**
     * Render validation badge
     * @param {Object} validation - Validation info
     * @returns {string} HTML for validation badge
     */
    renderValidationBadge(validation) {
        const badgeClass = validation.type === 'error' ? 'bg-danger' : 'bg-warning';
        const icon = validation.type === 'error' ? 'fa-times' : 'fa-exclamation';
        
        return `<span class="badge ${badgeClass} validation-badge" 
                      title="${this.escapeHtml(validation.message)}">
                    <i class="fas ${icon}"></i>
                </span>`;
    }

    /**
     * Render overall row status
     * @param {Object} validationStatus - Validation status
     * @returns {string} HTML for status badge
     */
    renderOverallStatus(validationStatus) {
        switch (validationStatus.overall) {
            case 'error':
                return '<span class="badge bg-danger"><i class="fas fa-times me-1"></i>Error</span>';
            case 'warning':
                return '<span class="badge bg-warning"><i class="fas fa-exclamation me-1"></i>Warning</span>';
            default:
                return '<span class="badge bg-success"><i class="fas fa-check me-1"></i>Valid</span>';
        }
    }

    /**
     * Show row details in modal
     * @param {Object} row - Data row
     * @param {number} index - Row index
     * @param {Object} validationStatus - Validation status
     */
    showRowDetails(row, index, validationStatus) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('rowDetailsModal');
        if (!modal) {
            modal = this.createRowDetailsModal();
        }
        
        // Populate modal content
        const modalBody = modal.querySelector('.modal-body');
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Data Barang</h6>
                    <table class="table table-sm">
                        <tr><td><strong>Kode:</strong></td><td>${this.escapeHtml(row.kode)}</td></tr>
                        <tr><td><strong>Nama:</strong></td><td>${this.escapeHtml(row.nama)}</td></tr>
                        <tr><td><strong>Kategori:</strong></td><td>${this.escapeHtml(row.kategori)}</td></tr>
                        <tr><td><strong>Satuan:</strong></td><td>${this.escapeHtml(row.satuan)}</td></tr>
                        <tr><td><strong>Harga Beli:</strong></td><td>${this.formatCurrency(row.harga_beli)}</td></tr>
                        <tr><td><strong>Stok:</strong></td><td>${this.formatNumber(row.stok)}</td></tr>
                        <tr><td><strong>Supplier:</strong></td><td>${this.escapeHtml(row.supplier || '-')}</td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6>Status Validasi</h6>
                    <div id="validationDetails">
                        ${this.renderValidationDetails(validationStatus)}
                    </div>
                </div>
            </div>
        `;
        
        // Show modal
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    /**
     * Create row details modal
     * @returns {HTMLElement} Modal element
     */
    createRowDetailsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'rowDetailsModal';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Detail Data Barang</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <!-- Content will be populated dynamically -->
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        return modal;
    }

    /**
     * Render validation details
     * @param {Object} validationStatus - Validation status
     * @returns {string} HTML for validation details
     */
    renderValidationDetails(validationStatus) {
        if (validationStatus.overall === 'valid') {
            return '<div class="alert alert-success"><i class="fas fa-check me-2"></i>Semua data valid</div>';
        }
        
        let html = '';
        Object.keys(validationStatus).forEach(field => {
            if (field !== 'overall' && validationStatus[field]) {
                const validation = validationStatus[field];
                const alertClass = validation.type === 'error' ? 'alert-danger' : 'alert-warning';
                const icon = validation.type === 'error' ? 'fa-times' : 'fa-exclamation';
                
                html += `
                    <div class="alert ${alertClass} py-2">
                        <i class="fas ${icon} me-2"></i>
                        <strong>${field}:</strong> ${this.escapeHtml(validation.message)}
                    </div>
                `;
            }
        });
        
        return html;
    }

    /**
     * Populate filter options
     * @param {Array} data - Data to extract options from
     */
    populateFilterOptions(data) {
        // Get unique categories and units
        const categories = [...new Set(data.map(row => row.kategori).filter(Boolean))];
        const units = [...new Set(data.map(row => row.satuan).filter(Boolean))];
        
        // Populate category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">Semua Kategori</option>';
            categories.sort().forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categoryFilter.appendChild(option);
            });
        }
        
        // Populate unit filter
        const unitFilter = document.getElementById('unitFilter');
        if (unitFilter) {
            unitFilter.innerHTML = '<option value="">Semua Satuan</option>';
            units.sort().forEach(unit => {
                const option = document.createElement('option');
                option.value = unit;
                option.textContent = unit;
                unitFilter.appendChild(option);
            });
        }
    }

    /**
     * Apply filters to table
     */
    applyFilters() {
        if (!this.uploadedData) return;
        
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('categoryFilter')?.value || '';
        const unitFilter = document.getElementById('unitFilter')?.value || '';
        
        const filteredData = this.uploadedData.filter(row => {
            // Search filter
            const searchMatch = !searchTerm || 
                Object.values(row).some(value => 
                    value && value.toString().toLowerCase().includes(searchTerm)
                );
            
            // Category filter
            const categoryMatch = !categoryFilter || row.kategori === categoryFilter;
            
            // Unit filter
            const unitMatch = !unitFilter || row.satuan === unitFilter;
            
            return searchMatch && categoryMatch && unitMatch;
        });
        
        this.renderPreviewTable(filteredData, this.validationResults);
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('unitFilter').value = '';
        
        this.renderPreviewTable(this.uploadedData, this.validationResults);
    }

    /**
     * Update selection count
     */
    updateSelectionCount() {
        const selectedCount = document.querySelectorAll('#previewTableBody input[type="checkbox"]:checked').length;
        const totalCount = document.querySelectorAll('#previewTableBody input[type="checkbox"]').length;
        
        // Update selection indicator (can be added to UI)
        console.log(`Selected: ${selectedCount}/${totalCount}`);
    }

    /**
     * Set uploaded data
     * @param {Array} data - Uploaded data
     */
    setUploadedData(data) {
        this.uploadedData = data;
    }

    /**
     * Set validation results
     * @param {Object} results - Validation results
     */
    setValidationResults(results) {
        this.validationResults = results;
    }

    /**
     * Utility functions
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    }

    formatNumber(number) {
        return new Intl.NumberFormat('id-ID').format(number || 0);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}

// ES module export
export default UIManager;