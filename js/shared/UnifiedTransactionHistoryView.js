/**
 * Unified Transaction History View
 * Enhanced transaction history view with mode column and filtering
 * Requirements: 4.1, 4.2, 4.3
 */

class UnifiedTransactionHistoryView {
    constructor(sharedServices) {
        this.sharedServices = sharedServices;
        this.currentFilters = {};
        this.currentSort = { field: 'createdAt', direction: 'desc' };
        this.currentPage = 1;
        this.pageSize = 20;
        this.totalRecords = 0;
    }

    /**
     * Render the enhanced transaction history view
     * Requirements: 4.1, 4.2, 4.3
     * @param {string} containerId - Container element ID
     */
    render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Container not found:', containerId);
            return;
        }

        container.innerHTML = this._generateHTML();
        this._setupEventListeners();
        this.loadTransactions();
    }

    /**
     * Generate the HTML structure for the transaction history view
     * @private
     * @returns {string} HTML content
     */
    _generateHTML() {
        return `
            <div class="unified-transaction-history">
                <!-- Header -->
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h4 class="mb-0">
                        <i class="bi bi-clock-history me-2"></i>
                        Riwayat Pembayaran Terpadu
                    </h4>
                    <div class="d-flex gap-2">
                        <button class="btn btn-outline-primary btn-sm" onclick="this.refreshTransactions()" id="refreshBtn">
                            <i class="bi bi-arrow-clockwise"></i> Refresh
                        </button>
                        <button class="btn btn-outline-success btn-sm" onclick="this.exportTransactions()" id="exportBtn">
                            <i class="bi bi-download"></i> Export
                        </button>
                    </div>
                </div>

                <!-- Enhanced Filters -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="bi bi-funnel me-2"></i>Filter Transaksi
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <!-- Mode Filter (New) -->
                            <div class="col-md-2">
                                <label class="form-label">Mode Pembayaran</label>
                                <select class="form-select" id="filterMode">
                                    <option value="">Semua Mode</option>
                                    <option value="manual">Manual</option>
                                    <option value="import">Import Batch</option>
                                </select>
                            </div>
                            
                            <!-- Jenis Filter -->
                            <div class="col-md-2">
                                <label class="form-label">Jenis Pembayaran</label>
                                <select class="form-select" id="filterJenis">
                                    <option value="">Semua Jenis</option>
                                    <option value="hutang">Hutang</option>
                                    <option value="piutang">Piutang</option>
                                </select>
                            </div>
                            
                            <!-- Date Range -->
                            <div class="col-md-2">
                                <label class="form-label">Dari Tanggal</label>
                                <input type="date" class="form-control" id="filterTanggalDari">
                            </div>
                            <div class="col-md-2">
                                <label class="form-label">Sampai Tanggal</label>
                                <input type="date" class="form-control" id="filterTanggalSampai">
                            </div>
                            
                            <!-- Anggota Search -->
                            <div class="col-md-3">
                                <label class="form-label">Cari Anggota</label>
                                <input type="text" class="form-control" id="filterAnggota" placeholder="Nama atau NIK anggota">
                            </div>
                            
                            <!-- Actions -->
                            <div class="col-md-1 d-flex align-items-end">
                                <button class="btn btn-primary w-100" onclick="this.applyFilters()" id="applyFiltersBtn">
                                    <i class="bi bi-search"></i>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Quick Filters -->
                        <div class="row mt-3">
                            <div class="col-12">
                                <div class="d-flex gap-2 flex-wrap">
                                    <button class="btn btn-outline-secondary btn-sm" onclick="this.setQuickFilter('today')">
                                        Hari Ini
                                    </button>
                                    <button class="btn btn-outline-secondary btn-sm" onclick="this.setQuickFilter('week')">
                                        Minggu Ini
                                    </button>
                                    <button class="btn btn-outline-secondary btn-sm" onclick="this.setQuickFilter('month')">
                                        Bulan Ini
                                    </button>
                                    <button class="btn btn-outline-secondary btn-sm" onclick="this.setQuickFilter('manual')">
                                        Manual Saja
                                    </button>
                                    <button class="btn btn-outline-secondary btn-sm" onclick="this.setQuickFilter('import')">
                                        Import Saja
                                    </button>
                                    <button class="btn btn-outline-danger btn-sm" onclick="this.clearFilters()">
                                        <i class="bi bi-x-circle"></i> Clear
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Summary Cards -->
                <div class="row mb-4" id="summaryCards">
                    <!-- Summary cards will be rendered here -->
                </div>

                <!-- Transaction Table -->
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">Daftar Transaksi</h6>
                        <div class="d-flex align-items-center gap-2">
                            <small class="text-muted" id="recordCount">0 transaksi</small>
                            <select class="form-select form-select-sm" id="pageSize" style="width: auto;">
                                <option value="10">10 per halaman</option>
                                <option value="20" selected>20 per halaman</option>
                                <option value="50">50 per halaman</option>
                                <option value="100">100 per halaman</option>
                            </select>
                        </div>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-striped table-hover mb-0">
                                <thead class="table-light">
                                    <tr>
                                        <th class="sortable" data-field="tanggal">
                                            <i class="bi bi-calendar3"></i> Tanggal
                                            <i class="bi bi-chevron-expand sort-icon"></i>
                                        </th>
                                        <th class="sortable" data-field="anggotaNama">
                                            <i class="bi bi-person"></i> Anggota
                                            <i class="bi bi-chevron-expand sort-icon"></i>
                                        </th>
                                        <th class="sortable" data-field="jenis">
                                            <i class="bi bi-tag"></i> Jenis
                                            <i class="bi bi-chevron-expand sort-icon"></i>
                                        </th>
                                        <th class="sortable" data-field="mode">
                                            <i class="bi bi-gear"></i> Mode
                                            <i class="bi bi-chevron-expand sort-icon"></i>
                                        </th>
                                        <th class="sortable" data-field="jumlah">
                                            <i class="bi bi-currency-dollar"></i> Jumlah
                                            <i class="bi bi-chevron-expand sort-icon"></i>
                                        </th>
                                        <th>Saldo Sebelum</th>
                                        <th>Saldo Sesudah</th>
                                        <th class="sortable" data-field="kasirNama">
                                            <i class="bi bi-person-badge"></i> Kasir
                                            <i class="bi bi-chevron-expand sort-icon"></i>
                                        </th>
                                        <th>Batch ID</th>
                                        <th width="120">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody id="transactionTableBody">
                                    <tr>
                                        <td colspan="10" class="text-center py-4">
                                            <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                                            Memuat data...
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <!-- Pagination -->
                    <div class="card-footer">
                        <nav aria-label="Transaction pagination">
                            <ul class="pagination pagination-sm mb-0 justify-content-center" id="pagination">
                                <!-- Pagination will be rendered here -->
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners for the transaction history view
     * @private
     */
    _setupEventListeners() {
        // Filter change events
        ['filterMode', 'filterJenis', 'filterTanggalDari', 'filterTanggalSampai', 'filterAnggota'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.applyFilters());
            }
        });

        // Page size change
        const pageSizeSelect = document.getElementById('pageSize');
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', (e) => {
                this.pageSize = parseInt(e.target.value);
                this.currentPage = 1;
                this.loadTransactions();
            });
        }

        // Sortable columns
        document.querySelectorAll('.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const field = th.dataset.field;
                this.sortBy(field);
            });
        });

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshTransactions());
        }

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            refreshBtn.addEventListener('click', () => this.exportTransactions());
        }

        // Apply filters button
        const applyBtn = document.getElementById('applyFiltersBtn');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.applyFilters());
        }

        // Search on enter
        const searchInput = document.getElementById('filterAnggota');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.applyFilters();
                }
            });
        }
    }

    /**
     * Load and display transactions
     * Requirements: 4.1, 4.2
     */
    loadTransactions() {
        try {
            // Get filtered transactions
            const allTransactions = this.sharedServices.getTransactionHistory(this.currentFilters);
            
            // Apply sorting
            const sortedTransactions = this._sortTransactions(allTransactions);
            
            // Calculate pagination
            this.totalRecords = sortedTransactions.length;
            const startIndex = (this.currentPage - 1) * this.pageSize;
            const endIndex = startIndex + this.pageSize;
            const paginatedTransactions = sortedTransactions.slice(startIndex, endIndex);
            
            // Render components
            this._renderSummaryCards(allTransactions);
            this._renderTransactionTable(paginatedTransactions);
            this._renderPagination();
            this._updateRecordCount();
            
        } catch (error) {
            console.error('Error loading transactions:', error);
            this._showError('Gagal memuat data transaksi');
        }
    }

    /**
     * Apply current filters and reload transactions
     * Requirements: 4.2, 4.3
     */
    applyFilters() {
        // Collect filter values
        this.currentFilters = {
            mode: document.getElementById('filterMode')?.value || '',
            jenis: document.getElementById('filterJenis')?.value || '',
            tanggalDari: document.getElementById('filterTanggalDari')?.value || '',
            tanggalSampai: document.getElementById('filterTanggalSampai')?.value || '',
            anggotaSearch: document.getElementById('filterAnggota')?.value || ''
        };

        // Reset to first page
        this.currentPage = 1;
        
        // Reload transactions
        this.loadTransactions();
    }

    /**
     * Set quick filter presets
     * @param {string} filterType - Type of quick filter
     */
    setQuickFilter(filterType) {
        const today = new Date();
        const formatDate = (date) => date.toISOString().split('T')[0];

        switch (filterType) {
            case 'today':
                document.getElementById('filterTanggalDari').value = formatDate(today);
                document.getElementById('filterTanggalSampai').value = formatDate(today);
                break;
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                document.getElementById('filterTanggalDari').value = formatDate(weekStart);
                document.getElementById('filterTanggalSampai').value = formatDate(today);
                break;
            case 'month':
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                document.getElementById('filterTanggalDari').value = formatDate(monthStart);
                document.getElementById('filterTanggalSampai').value = formatDate(today);
                break;
            case 'manual':
                document.getElementById('filterMode').value = 'manual';
                break;
            case 'import':
                document.getElementById('filterMode').value = 'import';
                break;
        }
        
        this.applyFilters();
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        ['filterMode', 'filterJenis', 'filterTanggalDari', 'filterTanggalSampai', 'filterAnggota'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = '';
            }
        });
        
        this.applyFilters();
    }

    /**
     * Sort transactions by field
     * @param {string} field - Field to sort by
     */
    sortBy(field) {
        if (this.currentSort.field === field) {
            // Toggle direction
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            // New field
            this.currentSort.field = field;
            this.currentSort.direction = 'asc';
        }
        
        this._updateSortIcons();
        this.loadTransactions();
    }

    /**
     * Sort transactions array
     * @private
     * @param {Array} transactions - Transactions to sort
     * @returns {Array} Sorted transactions
     */
    _sortTransactions(transactions) {
        return [...transactions].sort((a, b) => {
            const field = this.currentSort.field;
            const direction = this.currentSort.direction;
            
            let aVal = a[field];
            let bVal = b[field];
            
            // Handle different data types
            if (field === 'jumlah') {
                aVal = parseFloat(aVal) || 0;
                bVal = parseFloat(bVal) || 0;
            } else if (field === 'tanggal' || field === 'createdAt') {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            } else {
                aVal = String(aVal || '').toLowerCase();
                bVal = String(bVal || '').toLowerCase();
            }
            
            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    /**
     * Update sort icons in table headers
     * @private
     */
    _updateSortIcons() {
        document.querySelectorAll('.sortable .sort-icon').forEach(icon => {
            icon.className = 'bi bi-chevron-expand sort-icon';
        });
        
        const activeHeader = document.querySelector(`[data-field="${this.currentSort.field}"] .sort-icon`);
        if (activeHeader) {
            const iconClass = this.currentSort.direction === 'asc' ? 'bi-chevron-up' : 'bi-chevron-down';
            activeHeader.className = `bi ${iconClass} sort-icon`;
        }
    }

    /**
     * Render summary cards
     * @private
     * @param {Array} transactions - All transactions (filtered)
     */
    _renderSummaryCards(transactions) {
        const container = document.getElementById('summaryCards');
        if (!container) return;

        // Calculate summaries
        const summary = this._calculateSummary(transactions);
        
        container.innerHTML = `
            <div class="col-md-3">
                <div class="card bg-primary text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">Total Transaksi</h6>
                                <h4 class="mb-0">${summary.totalCount}</h4>
                            </div>
                            <div class="align-self-center">
                                <i class="bi bi-receipt fs-2"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-success text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">Manual (${summary.manualCount})</h6>
                                <h5 class="mb-0">${formatRupiah(summary.manualAmount)}</h5>
                            </div>
                            <div class="align-self-center">
                                <i class="bi bi-person fs-2"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-info text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">Import (${summary.importCount})</h6>
                                <h5 class="mb-0">${formatRupiah(summary.importAmount)}</h5>
                            </div>
                            <div class="align-self-center">
                                <i class="bi bi-upload fs-2"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-warning text-dark">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">Total Nilai</h6>
                                <h5 class="mb-0">${formatRupiah(summary.totalAmount)}</h5>
                            </div>
                            <div class="align-self-center">
                                <i class="bi bi-currency-dollar fs-2"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Calculate summary statistics
     * @private
     * @param {Array} transactions - Transactions to summarize
     * @returns {Object} Summary data
     */
    _calculateSummary(transactions) {
        const summary = {
            totalCount: transactions.length,
            manualCount: 0,
            importCount: 0,
            manualAmount: 0,
            importAmount: 0,
            totalAmount: 0
        };

        transactions.forEach(t => {
            const amount = parseFloat(t.jumlah) || 0;
            summary.totalAmount += amount;
            
            if (t.mode === 'import') {
                summary.importCount++;
                summary.importAmount += amount;
            } else {
                summary.manualCount++;
                summary.manualAmount += amount;
            }
        });

        return summary;
    }

    /**
     * Render transaction table
     * @private
     * @param {Array} transactions - Transactions to display
     */
    _renderTransactionTable(transactions) {
        const tbody = document.getElementById('transactionTableBody');
        if (!tbody) return;

        if (transactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center py-4">
                        <i class="bi bi-inbox fs-1 text-muted"></i>
                        <p class="text-muted mt-2 mb-0">Tidak ada transaksi ditemukan</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = transactions.map(t => this._renderTransactionRow(t)).join('');
    }

    /**
     * Render single transaction row
     * @private
     * @param {Object} transaction - Transaction data
     * @returns {string} HTML for transaction row
     */
    _renderTransactionRow(transaction) {
        const jenisClass = transaction.jenis === 'hutang' ? 'text-danger' : 'text-success';
        const jenisIcon = transaction.jenis === 'hutang' ? 'bi-arrow-up-circle' : 'bi-arrow-down-circle';
        const modeClass = transaction.mode === 'import' ? 'bg-info' : 'bg-secondary';
        const modeIcon = transaction.mode === 'import' ? 'bi-upload' : 'bi-person';
        
        return `
            <tr>
                <td>
                    <div class="d-flex flex-column">
                        <span>${formatTanggal(transaction.tanggal)}</span>
                        <small class="text-muted">${formatWaktu(transaction.createdAt)}</small>
                    </div>
                </td>
                <td>
                    <div class="d-flex flex-column">
                        <strong>${escapeHtml(transaction.anggotaNama)}</strong>
                        <small class="text-muted">${escapeHtml(transaction.anggotaNIK)}</small>
                    </div>
                </td>
                <td>
                    <span class="badge bg-${transaction.jenis === 'hutang' ? 'danger' : 'success'}">
                        <i class="bi ${jenisIcon} me-1"></i>
                        ${transaction.jenis === 'hutang' ? 'Hutang' : 'Piutang'}
                    </span>
                </td>
                <td>
                    <span class="badge ${modeClass}">
                        <i class="bi ${modeIcon} me-1"></i>
                        ${transaction.mode === 'import' ? 'Import' : 'Manual'}
                    </span>
                </td>
                <td class="${jenisClass}">
                    <strong>${formatRupiah(transaction.jumlah)}</strong>
                </td>
                <td>${formatRupiah(transaction.saldoSebelum)}</td>
                <td>${formatRupiah(transaction.saldoSesudah)}</td>
                <td>
                    <div class="d-flex flex-column">
                        <span>${escapeHtml(transaction.kasirNama)}</span>
                        <small class="text-muted">${escapeHtml(transaction.kasirRole || 'kasir')}</small>
                    </div>
                </td>
                <td>
                    ${transaction.batchId ? 
                        `<span class="badge bg-light text-dark" title="Batch ID: ${transaction.batchId}">
                            ${transaction.batchId.substring(0, 8)}...
                        </span>` : 
                        '<span class="text-muted">-</span>'
                    }
                </td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-primary" onclick="this.viewTransactionDetail('${transaction.id}')" title="Lihat Detail">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-success" onclick="this.printReceipt('${transaction.id}')" title="Cetak Bukti">
                            <i class="bi bi-printer"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Render pagination controls
     * @private
     */
    _renderPagination() {
        const container = document.getElementById('pagination');
        if (!container) return;

        const totalPages = Math.ceil(this.totalRecords / this.pageSize);
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="this.goToPage(${this.currentPage - 1}); return false;">
                    <i class="bi bi-chevron-left"></i>
                </a>
            </li>
        `;
        
        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);
        
        if (startPage > 1) {
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="this.goToPage(1); return false;">1</a></li>`;
            if (startPage > 2) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="this.goToPage(${i}); return false;">${i}</a>
                </li>
            `;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="this.goToPage(${totalPages}); return false;">${totalPages}</a></li>`;
        }
        
        // Next button
        paginationHTML += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="this.goToPage(${this.currentPage + 1}); return false;">
                    <i class="bi bi-chevron-right"></i>
                </a>
            </li>
        `;
        
        container.innerHTML = paginationHTML;
    }

    /**
     * Go to specific page
     * @param {number} page - Page number
     */
    goToPage(page) {
        const totalPages = Math.ceil(this.totalRecords / this.pageSize);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.loadTransactions();
        }
    }

    /**
     * Update record count display
     * @private
     */
    _updateRecordCount() {
        const element = document.getElementById('recordCount');
        if (element) {
            const start = (this.currentPage - 1) * this.pageSize + 1;
            const end = Math.min(this.currentPage * this.pageSize, this.totalRecords);
            element.textContent = `${start}-${end} dari ${this.totalRecords} transaksi`;
        }
    }

    /**
     * Refresh transactions
     */
    refreshTransactions() {
        this.loadTransactions();
    }

    /**
     * Export transactions with enhanced options
     * Requirements: 4.4, 8.5
     */
    async exportTransactions() {
        try {
            // Initialize exporter if not already done
            if (!this.exporter) {
                // Load exporter dynamically
                if (typeof UnifiedTransactionExporter !== 'undefined') {
                    this.exporter = new UnifiedTransactionExporter(this.sharedServices);
                } else {
                    throw new Error('UnifiedTransactionExporter not available');
                }
            }
            
            // Show export dialog
            const exportConfig = await this.exporter.showExportDialog(this.currentFilters);
            
            // Perform export
            const result = await this.exporter.exportTransactions(exportConfig);
            
            if (result.success) {
                // Show success notification
                this._showSuccessNotification(
                    `Export berhasil! File ${result.filename} telah diunduh (${result.recordCount} transaksi)`
                );
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error('Export error:', error);
            this._showErrorNotification(`Gagal mengekspor data: ${error.message}`);
        }
    }

    /**
     * View transaction detail
     * @param {string} transactionId - Transaction ID
     */
    viewTransactionDetail(transactionId) {
        // Implementation for viewing transaction details
        console.log('View transaction detail:', transactionId);
    }

    /**
     * Print receipt
     * @param {string} transactionId - Transaction ID
     */
    printReceipt(transactionId) {
        // Use existing receipt printing functionality
        if (typeof cetakBuktiPembayaran === 'function') {
            cetakBuktiPembayaran(transactionId);
        } else {
            console.log('Print receipt:', transactionId);
        }
    }

    /**
     * Show error message
     * @private
     * @param {string} message - Error message
     */
    _showError(message) {
        const tbody = document.getElementById('transactionTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center py-4 text-danger">
                        <i class="bi bi-exclamation-triangle fs-1"></i>
                        <p class="mt-2 mb-0">${message}</p>
                    </td>
                </tr>
            `;
        }
    }

    /**
     * Show success notification
     * @private
     * @param {string} message - Success message
     */
    _showSuccessNotification(message) {
        try {
            // Use existing notification system if available
            if (typeof showNotification === 'function') {
                showNotification(message, 'success');
            } else if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: message,
                    timer: 3000,
                    showConfirmButton: false
                });
            } else {
                // Fallback to alert
                alert(message);
            }
        } catch (error) {
            console.error('Error showing success notification:', error);
        }
    }

    /**
     * Show error notification
     * @private
     * @param {string} message - Error message
     */
    _showErrorNotification(message) {
        try {
            // Use existing notification system if available
            if (typeof showNotification === 'function') {
                showNotification(message, 'error');
            } else if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: message
                });
            } else {
                // Fallback to alert
                alert('Error: ' + message);
            }
        } catch (error) {
            console.error('Error showing error notification:', error);
        }
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UnifiedTransactionHistoryView };
} else if (typeof window !== 'undefined') {
    window.UnifiedTransactionHistoryView = UnifiedTransactionHistoryView;
}