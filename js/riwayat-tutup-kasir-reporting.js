/**
 * Riwayat Tutup Kasir Reporting System
 * Handles riwayat tutup kasir improvements including data completeness validation,
 * sorting/filtering, export options (CSV, PDF), and search/pagination functionality
 * 
 * Feature: perbaikan-menu-tutup-kasir-pos
 * Task 9: Perbaiki riwayat tutup kasir dan reporting
 */

class RiwayatTutupKasirReporting {
    constructor() {
        this.storageKey = 'riwayatTutupKas';
        this.itemsPerPage = 10;
        this.currentPage = 1;
        this.currentFilter = {};
        this.currentSort = { field: 'waktuTutup', direction: 'desc' };
        
        // Bind methods
        this.loadRiwayatData = this.loadRiwayatData.bind(this);
        this.validateDataCompleteness = this.validateDataCompleteness.bind(this);
        this.renderRiwayatTable = this.renderRiwayatTable.bind(this);
        this.exportToCSV = this.exportToCSV.bind(this);
        this.exportToPDF = this.exportToPDF.bind(this);
        
        // Initialize
        this.initializeReporting();
    }

    /**
     * Initializes the reporting system
     */
    initializeReporting() {
        console.log('Riwayat Tutup Kasir Reporting System initialized');
    }

    /**
     * Loads riwayat tutup kasir data from localStorage
     * @returns {Array} Array of riwayat records
     */
    loadRiwayatData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (!data) return [];
            
            const riwayatData = JSON.parse(data);
            return Array.isArray(riwayatData) ? riwayatData : [];
        } catch (error) {
            console.error('Failed to load riwayat data:', error);
            return [];
        }
    }

    /**
     * Validates completeness of riwayat data
     * Property 8: Riwayat data completeness
     * @param {Array} riwayatData - Array of riwayat records
     * @returns {Object} Validation result
     */
    validateDataCompleteness(riwayatData) {
        const requiredFields = [
            'id', 'shiftId', 'kasir', 'kasirId', 'waktuBuka', 'waktuTutup',
            'modalAwal', 'totalPenjualan', 'totalCash', 'totalKredit',
            'kasSeharusnya', 'kasAktual', 'selisih', 'jumlahTransaksi', 'tanggalTutup'
        ];

        const validationResults = riwayatData.map(record => {
            const missingFields = requiredFields.filter(field => {
                const value = record[field];
                return value === undefined || value === null || value === '';
            });

            const hasValidTimestamps = this.validateTimestamps(record);
            const hasValidNumbers = this.validateNumbers(record);

            return {
                id: record.id || 'unknown',
                isComplete: missingFields.length === 0 && hasValidTimestamps && hasValidNumbers,
                missingFields: missingFields,
                hasValidTimestamps: hasValidTimestamps,
                hasValidNumbers: hasValidNumbers,
                record: record
            };
        });

        const completeRecords = validationResults.filter(r => r.isComplete);
        const incompleteRecords = validationResults.filter(r => !r.isComplete);

        return {
            totalRecords: riwayatData.length,
            completeRecords: completeRecords.length,
            incompleteRecords: incompleteRecords.length,
            completenessPercentage: riwayatData.length > 0 ? 
                (completeRecords.length / riwayatData.length) * 100 : 100,
            validationResults: validationResults,
            completeData: completeRecords.map(r => r.record),
            incompleteData: incompleteRecords
        };
    }

    /**
     * Validates timestamp fields in a record
     * @param {Object} record - Riwayat record
     * @returns {boolean} True if timestamps are valid
     */
    validateTimestamps(record) {
        try {
            const waktuBuka = new Date(record.waktuBuka);
            const waktuTutup = new Date(record.waktuTutup);
            
            return !isNaN(waktuBuka.getTime()) && 
                   !isNaN(waktuTutup.getTime()) && 
                   waktuTutup >= waktuBuka;
        } catch (error) {
            return false;
        }
    }

    /**
     * Validates numeric fields in a record
     * @param {Object} record - Riwayat record
     * @returns {boolean} True if numbers are valid
     */
    validateNumbers(record) {
        const numericFields = [
            'modalAwal', 'totalPenjualan', 'totalCash', 'totalKredit',
            'kasSeharusnya', 'kasAktual', 'selisih', 'jumlahTransaksi'
        ];

        return numericFields.every(field => {
            const value = record[field];
            return typeof value === 'number' && !isNaN(value) && isFinite(value);
        });
    }

    /**
     * Filters riwayat data based on criteria
     * @param {Array} data - Raw riwayat data
     * @param {Object} filters - Filter criteria
     * @returns {Array} Filtered data
     */
    filterData(data, filters = {}) {
        let filteredData = [...data];

        // Filter by kasir
        if (filters.kasir && filters.kasir.trim()) {
            const kasirFilter = filters.kasir.toLowerCase().trim();
            filteredData = filteredData.filter(record => 
                record.kasir && record.kasir.toLowerCase().includes(kasirFilter)
            );
        }

        // Filter by date range
        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            filteredData = filteredData.filter(record => {
                const recordDate = new Date(record.tanggalTutup);
                return recordDate >= startDate;
            });
        }

        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999); // End of day
            filteredData = filteredData.filter(record => {
                const recordDate = new Date(record.tanggalTutup);
                return recordDate <= endDate;
            });
        }

        // Filter by selisih status
        if (filters.selisihStatus) {
            switch (filters.selisihStatus) {
                case 'ada_selisih':
                    filteredData = filteredData.filter(record => record.selisih !== 0);
                    break;
                case 'tidak_ada_selisih':
                    filteredData = filteredData.filter(record => record.selisih === 0);
                    break;
                case 'selisih_positif':
                    filteredData = filteredData.filter(record => record.selisih > 0);
                    break;
                case 'selisih_negatif':
                    filteredData = filteredData.filter(record => record.selisih < 0);
                    break;
            }
        }

        // Filter by minimum transaction amount
        if (filters.minAmount && !isNaN(filters.minAmount)) {
            const minAmount = parseFloat(filters.minAmount);
            filteredData = filteredData.filter(record => record.totalPenjualan >= minAmount);
        }

        // Filter by maximum transaction amount
        if (filters.maxAmount && !isNaN(filters.maxAmount)) {
            const maxAmount = parseFloat(filters.maxAmount);
            filteredData = filteredData.filter(record => record.totalPenjualan <= maxAmount);
        }

        // Search in multiple fields
        if (filters.search && filters.search.trim()) {
            const searchTerm = filters.search.toLowerCase().trim();
            filteredData = filteredData.filter(record => {
                const searchableFields = [
                    record.kasir,
                    record.id,
                    record.shiftId,
                    record.keteranganSelisih
                ];
                
                return searchableFields.some(field => 
                    field && field.toString().toLowerCase().includes(searchTerm)
                );
            });
        }

        return filteredData;
    }

    /**
     * Sorts riwayat data
     * @param {Array} data - Data to sort
     * @param {Object} sortConfig - Sort configuration
     * @returns {Array} Sorted data
     */
    sortData(data, sortConfig = {}) {
        const { field = 'waktuTutup', direction = 'desc' } = sortConfig;
        
        return [...data].sort((a, b) => {
            let valueA = a[field];
            let valueB = b[field];

            // Handle different data types
            if (field.includes('waktu') || field.includes('tanggal')) {
                valueA = new Date(valueA);
                valueB = new Date(valueB);
            } else if (typeof valueA === 'string') {
                valueA = valueA.toLowerCase();
                valueB = valueB.toLowerCase();
            }

            let comparison = 0;
            if (valueA < valueB) {
                comparison = -1;
            } else if (valueA > valueB) {
                comparison = 1;
            }

            return direction === 'desc' ? -comparison : comparison;
        });
    }

    /**
     * Paginates data
     * @param {Array} data - Data to paginate
     * @param {number} page - Current page (1-based)
     * @param {number} itemsPerPage - Items per page
     * @returns {Object} Pagination result
     */
    paginateData(data, page = 1, itemsPerPage = 10) {
        const totalItems = data.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const currentPage = Math.max(1, Math.min(page, totalPages));
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedData = data.slice(startIndex, endIndex);

        return {
            data: paginatedData,
            pagination: {
                currentPage: currentPage,
                totalPages: totalPages,
                totalItems: totalItems,
                itemsPerPage: itemsPerPage,
                startIndex: startIndex + 1,
                endIndex: Math.min(endIndex, totalItems),
                hasNextPage: currentPage < totalPages,
                hasPrevPage: currentPage > 1
            }
        };
    }

    /**
     * Gets processed riwayat data with filtering, sorting, and pagination
     * @param {Object} options - Processing options
     * @returns {Object} Processed data result
     */
    getProcessedRiwayatData(options = {}) {
        const {
            filters = {},
            sort = this.currentSort,
            page = this.currentPage,
            itemsPerPage = this.itemsPerPage
        } = options;

        // Load raw data
        const rawData = this.loadRiwayatData();
        
        // Validate data completeness
        const validation = this.validateDataCompleteness(rawData);
        
        // Use only complete data for display
        let processedData = validation.completeData;
        
        // Apply filters
        processedData = this.filterData(processedData, filters);
        
        // Apply sorting
        processedData = this.sortData(processedData, sort);
        
        // Apply pagination
        const paginatedResult = this.paginateData(processedData, page, itemsPerPage);

        return {
            ...paginatedResult,
            validation: validation,
            filters: filters,
            sort: sort,
            summary: this.generateSummary(processedData)
        };
    }

    /**
     * Generates summary statistics for riwayat data
     * @param {Array} data - Riwayat data
     * @returns {Object} Summary statistics
     */
    generateSummary(data) {
        if (data.length === 0) {
            return {
                totalRecords: 0,
                totalPenjualan: 0,
                totalSelisih: 0,
                averageSelisih: 0,
                recordsWithSelisih: 0,
                recordsWithoutSelisih: 0,
                averageTransactionCount: 0,
                dateRange: null
            };
        }

        const totalPenjualan = data.reduce((sum, record) => sum + (record.totalPenjualan || 0), 0);
        const totalSelisih = data.reduce((sum, record) => sum + (record.selisih || 0), 0);
        const totalTransactions = data.reduce((sum, record) => sum + (record.jumlahTransaksi || 0), 0);
        
        const recordsWithSelisih = data.filter(record => record.selisih !== 0).length;
        const recordsWithoutSelisih = data.length - recordsWithSelisih;

        // Find date range
        const dates = data.map(record => new Date(record.tanggalTutup)).sort((a, b) => a - b);
        const dateRange = dates.length > 0 ? {
            start: dates[0],
            end: dates[dates.length - 1]
        } : null;

        return {
            totalRecords: data.length,
            totalPenjualan: totalPenjualan,
            totalSelisih: totalSelisih,
            averageSelisih: data.length > 0 ? totalSelisih / data.length : 0,
            recordsWithSelisih: recordsWithSelisih,
            recordsWithoutSelisih: recordsWithoutSelisih,
            averageTransactionCount: data.length > 0 ? totalTransactions / data.length : 0,
            dateRange: dateRange
        };
    }

    /**
     * Renders riwayat table HTML
     * @param {Object} processedData - Processed riwayat data
     * @param {string} containerId - Container element ID
     */
    renderRiwayatTable(processedData, containerId = 'riwayatTutupKasirContainer') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        const { data, pagination, validation, summary } = processedData;

        const html = `
            <div class="riwayat-tutup-kasir-reporting">
                <!-- Summary Cards -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card bg-primary text-white">
                            <div class="card-body">
                                <h6 class="card-title">Total Records</h6>
                                <h4>${summary.totalRecords}</h4>
                                <small>Data Completeness: ${validation.completenessPercentage.toFixed(1)}%</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-success text-white">
                            <div class="card-body">
                                <h6 class="card-title">Total Penjualan</h6>
                                <h4>Rp ${summary.totalPenjualan.toLocaleString('id-ID')}</h4>
                                <small>Avg Transaksi: ${summary.averageTransactionCount.toFixed(1)}</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card ${summary.totalSelisih >= 0 ? 'bg-info' : 'bg-warning'} text-white">
                            <div class="card-body">
                                <h6 class="card-title">Total Selisih</h6>
                                <h4>Rp ${summary.totalSelisih.toLocaleString('id-ID')}</h4>
                                <small>Avg: Rp ${summary.averageSelisih.toLocaleString('id-ID')}</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-secondary text-white">
                            <div class="card-body">
                                <h6 class="card-title">Records dengan Selisih</h6>
                                <h4>${summary.recordsWithSelisih}</h4>
                                <small>Tanpa Selisih: ${summary.recordsWithoutSelisih}</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Filters and Controls -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h6 class="mb-0">Filter & Export</h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-3">
                                <label class="form-label">Kasir</label>
                                <input type="text" class="form-control" id="filterKasir" placeholder="Nama kasir...">
                            </div>
                            <div class="col-md-2">
                                <label class="form-label">Tanggal Mulai</label>
                                <input type="date" class="form-control" id="filterStartDate">
                            </div>
                            <div class="col-md-2">
                                <label class="form-label">Tanggal Akhir</label>
                                <input type="date" class="form-control" id="filterEndDate">
                            </div>
                            <div class="col-md-2">
                                <label class="form-label">Status Selisih</label>
                                <select class="form-control" id="filterSelisihStatus">
                                    <option value="">Semua</option>
                                    <option value="tidak_ada_selisih">Tidak Ada Selisih</option>
                                    <option value="ada_selisih">Ada Selisih</option>
                                    <option value="selisih_positif">Selisih Positif</option>
                                    <option value="selisih_negatif">Selisih Negatif</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Search</label>
                                <input type="text" class="form-control" id="filterSearch" placeholder="Search...">
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-md-6">
                                <button class="btn btn-primary btn-sm" onclick="riwayatReporting.applyFilters()">
                                    <i class="bi bi-funnel me-1"></i>Apply Filters
                                </button>
                                <button class="btn btn-secondary btn-sm ms-2" onclick="riwayatReporting.clearFilters()">
                                    <i class="bi bi-x-circle me-1"></i>Clear
                                </button>
                            </div>
                            <div class="col-md-6 text-end">
                                <button class="btn btn-success btn-sm" onclick="riwayatReporting.exportToCSV()">
                                    <i class="bi bi-file-earmark-spreadsheet me-1"></i>Export CSV
                                </button>
                                <button class="btn btn-danger btn-sm ms-2" onclick="riwayatReporting.exportToPDF()">
                                    <i class="bi bi-file-earmark-pdf me-1"></i>Export PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Data Table -->
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">Riwayat Tutup Kasir</h6>
                        <small class="text-muted">
                            Showing ${pagination.startIndex}-${pagination.endIndex} of ${pagination.totalItems} records
                        </small>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-striped table-hover mb-0">
                                <thead class="table-dark">
                                    <tr>
                                        <th onclick="riwayatReporting.sortBy('tanggalTutup')" style="cursor: pointer;">
                                            Tanggal <i class="bi bi-arrow-down-up"></i>
                                        </th>
                                        <th onclick="riwayatReporting.sortBy('kasir')" style="cursor: pointer;">
                                            Kasir <i class="bi bi-arrow-down-up"></i>
                                        </th>
                                        <th onclick="riwayatReporting.sortBy('waktuBuka')" style="cursor: pointer;">
                                            Waktu Buka <i class="bi bi-arrow-down-up"></i>
                                        </th>
                                        <th onclick="riwayatReporting.sortBy('waktuTutup')" style="cursor: pointer;">
                                            Waktu Tutup <i class="bi bi-arrow-down-up"></i>
                                        </th>
                                        <th onclick="riwayatReporting.sortBy('modalAwal')" style="cursor: pointer;" class="text-end">
                                            Modal Awal <i class="bi bi-arrow-down-up"></i>
                                        </th>
                                        <th onclick="riwayatReporting.sortBy('totalPenjualan')" style="cursor: pointer;" class="text-end">
                                            Total Penjualan <i class="bi bi-arrow-down-up"></i>
                                        </th>
                                        <th onclick="riwayatReporting.sortBy('kasAktual')" style="cursor: pointer;" class="text-end">
                                            Kas Aktual <i class="bi bi-arrow-down-up"></i>
                                        </th>
                                        <th onclick="riwayatReporting.sortBy('selisih')" style="cursor: pointer;" class="text-end">
                                            Selisih <i class="bi bi-arrow-down-up"></i>
                                        </th>
                                        <th onclick="riwayatReporting.sortBy('jumlahTransaksi')" style="cursor: pointer;" class="text-center">
                                            Transaksi <i class="bi bi-arrow-down-up"></i>
                                        </th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${this.renderTableRows(data)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="card-footer">
                        ${this.renderPagination(pagination)}
                    </div>
                </div>

                <!-- Data Quality Alert -->
                ${validation.incompleteRecords > 0 ? `
                <div class="alert alert-warning mt-3">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <strong>Data Quality Notice:</strong> 
                    ${validation.incompleteRecords} records have incomplete data and are not displayed. 
                    Data completeness: ${validation.completenessPercentage.toFixed(1)}%
                </div>
                ` : ''}
            </div>
        `;

        container.innerHTML = html;
        this.attachEventListeners();
    }

    /**
     * Renders table rows
     * @param {Array} data - Riwayat data
     * @returns {string} HTML string for table rows
     */
    renderTableRows(data) {
        if (data.length === 0) {
            return `
                <tr>
                    <td colspan="10" class="text-center py-4">
                        <i class="bi bi-inbox text-muted" style="font-size: 2rem;"></i>
                        <p class="text-muted mt-2">Tidak ada data riwayat tutup kasir</p>
                    </td>
                </tr>
            `;
        }

        return data.map(record => `
            <tr>
                <td>${this.formatDate(record.tanggalTutup)}</td>
                <td>
                    <strong>${record.kasir}</strong>
                    <br><small class="text-muted">${record.kasirId}</small>
                </td>
                <td>${this.formatTime(record.waktuBuka)}</td>
                <td>${this.formatTime(record.waktuTutup)}</td>
                <td class="text-end">Rp ${record.modalAwal.toLocaleString('id-ID')}</td>
                <td class="text-end">Rp ${record.totalPenjualan.toLocaleString('id-ID')}</td>
                <td class="text-end">Rp ${record.kasAktual.toLocaleString('id-ID')}</td>
                <td class="text-end">
                    <span class="badge ${this.getSelisihBadgeClass(record.selisih)}">
                        Rp ${record.selisih.toLocaleString('id-ID')}
                    </span>
                </td>
                <td class="text-center">${record.jumlahTransaksi}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="riwayatReporting.viewDetail('${record.id}')">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Renders pagination controls
     * @param {Object} pagination - Pagination info
     * @returns {string} HTML string for pagination
     */
    renderPagination(pagination) {
        if (pagination.totalPages <= 1) return '';

        const { currentPage, totalPages, hasPrevPage, hasNextPage } = pagination;
        
        let paginationHtml = `
            <nav aria-label="Riwayat pagination">
                <ul class="pagination pagination-sm mb-0">
                    <li class="page-item ${!hasPrevPage ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="riwayatReporting.goToPage(${currentPage - 1})">
                            <i class="bi bi-chevron-left"></i>
                        </a>
                    </li>
        `;

        // Show page numbers
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        if (startPage > 1) {
            paginationHtml += `<li class="page-item"><a class="page-link" href="#" onclick="riwayatReporting.goToPage(1)">1</a></li>`;
            if (startPage > 2) {
                paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="riwayatReporting.goToPage(${i})">${i}</a>
                </li>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            paginationHtml += `<li class="page-item"><a class="page-link" href="#" onclick="riwayatReporting.goToPage(${totalPages})">${totalPages}</a></li>`;
        }

        paginationHtml += `
                    <li class="page-item ${!hasNextPage ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="riwayatReporting.goToPage(${currentPage + 1})">
                            <i class="bi bi-chevron-right"></i>
                        </a>
                    </li>
                </ul>
            </nav>
        `;

        return paginationHtml;
    }

    /**
     * Attaches event listeners to filter controls
     */
    attachEventListeners() {
        // Filter inputs
        const filterInputs = ['filterKasir', 'filterStartDate', 'filterEndDate', 'filterSelisihStatus', 'filterSearch'];
        filterInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('keyup', (e) => {
                    if (e.key === 'Enter') {
                        this.applyFilters();
                    }
                });
            }
        });
    }

    /**
     * Applies current filters and refreshes display
     */
    applyFilters() {
        const filters = {
            kasir: document.getElementById('filterKasir')?.value || '',
            startDate: document.getElementById('filterStartDate')?.value || '',
            endDate: document.getElementById('filterEndDate')?.value || '',
            selisihStatus: document.getElementById('filterSelisihStatus')?.value || '',
            search: document.getElementById('filterSearch')?.value || ''
        };

        this.currentFilter = filters;
        this.currentPage = 1; // Reset to first page
        this.refreshDisplay();
    }

    /**
     * Clears all filters
     */
    clearFilters() {
        const filterInputs = ['filterKasir', 'filterStartDate', 'filterEndDate', 'filterSelisihStatus', 'filterSearch'];
        filterInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) input.value = '';
        });

        this.currentFilter = {};
        this.currentPage = 1;
        this.refreshDisplay();
    }

    /**
     * Sorts data by field
     * @param {string} field - Field to sort by
     */
    sortBy(field) {
        if (this.currentSort.field === field) {
            // Toggle direction
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            // New field, default to desc
            this.currentSort = { field: field, direction: 'desc' };
        }

        this.refreshDisplay();
    }

    /**
     * Goes to specific page
     * @param {number} page - Page number
     */
    goToPage(page) {
        this.currentPage = page;
        this.refreshDisplay();
    }

    /**
     * Refreshes the display with current settings
     */
    refreshDisplay() {
        const processedData = this.getProcessedRiwayatData({
            filters: this.currentFilter,
            sort: this.currentSort,
            page: this.currentPage,
            itemsPerPage: this.itemsPerPage
        });

        this.renderRiwayatTable(processedData);
    }

    /**
     * Views detail of a specific record
     * @param {string} recordId - Record ID
     */
    viewDetail(recordId) {
        const allData = this.loadRiwayatData();
        const record = allData.find(r => r.id === recordId);
        
        if (!record) {
            alert('Record tidak ditemukan');
            return;
        }

        // Create detail modal
        this.showDetailModal(record);
    }

    /**
     * Shows detail modal for a record
     * @param {Object} record - Riwayat record
     */
    showDetailModal(record) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'riwayatDetailModal';
        modal.setAttribute('tabindex', '-1');

        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Detail Tutup Kasir</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Informasi Shift</h6>
                                <table class="table table-sm">
                                    <tr><td><strong>ID Shift:</strong></td><td>${record.shiftId}</td></tr>
                                    <tr><td><strong>Kasir:</strong></td><td>${record.kasir} (${record.kasirId})</td></tr>
                                    <tr><td><strong>Tanggal:</strong></td><td>${this.formatDate(record.tanggalTutup)}</td></tr>
                                    <tr><td><strong>Waktu Buka:</strong></td><td>${this.formatDateTime(record.waktuBuka)}</td></tr>
                                    <tr><td><strong>Waktu Tutup:</strong></td><td>${this.formatDateTime(record.waktuTutup)}</td></tr>
                                </table>
                            </div>
                            <div class="col-md-6">
                                <h6>Informasi Keuangan</h6>
                                <table class="table table-sm">
                                    <tr><td><strong>Modal Awal:</strong></td><td>Rp ${record.modalAwal.toLocaleString('id-ID')}</td></tr>
                                    <tr><td><strong>Total Penjualan:</strong></td><td>Rp ${record.totalPenjualan.toLocaleString('id-ID')}</td></tr>
                                    <tr><td><strong>Total Cash:</strong></td><td>Rp ${record.totalCash.toLocaleString('id-ID')}</td></tr>
                                    <tr><td><strong>Total Kredit:</strong></td><td>Rp ${record.totalKredit.toLocaleString('id-ID')}</td></tr>
                                    <tr><td><strong>Kas Seharusnya:</strong></td><td>Rp ${record.kasSeharusnya.toLocaleString('id-ID')}</td></tr>
                                    <tr><td><strong>Kas Aktual:</strong></td><td>Rp ${record.kasAktual.toLocaleString('id-ID')}</td></tr>
                                    <tr><td><strong>Selisih:</strong></td><td><span class="badge ${this.getSelisihBadgeClass(record.selisih)}">Rp ${record.selisih.toLocaleString('id-ID')}</span></td></tr>
                                </table>
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-12">
                                <h6>Informasi Transaksi</h6>
                                <p><strong>Jumlah Transaksi:</strong> ${record.jumlahTransaksi}</p>
                                ${record.keteranganSelisih ? `<p><strong>Keterangan Selisih:</strong> ${record.keteranganSelisih}</p>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        // Remove modal after hide
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    /**
     * Exports data to CSV
     */
    exportToCSV() {
        const processedData = this.getProcessedRiwayatData({
            filters: this.currentFilter,
            sort: this.currentSort,
            page: 1,
            itemsPerPage: 999999 // Get all data for export
        });

        const data = processedData.data;
        if (data.length === 0) {
            alert('Tidak ada data untuk diekspor');
            return;
        }

        const headers = [
            'Tanggal Tutup', 'Kasir', 'Kasir ID', 'Waktu Buka', 'Waktu Tutup',
            'Modal Awal', 'Total Penjualan', 'Total Cash', 'Total Kredit',
            'Kas Seharusnya', 'Kas Aktual', 'Selisih', 'Jumlah Transaksi', 'Keterangan Selisih'
        ];

        const csvContent = [
            headers.join(','),
            ...data.map(record => [
                this.formatDate(record.tanggalTutup),
                `"${record.kasir}"`,
                record.kasirId,
                this.formatDateTime(record.waktuBuka),
                this.formatDateTime(record.waktuTutup),
                record.modalAwal,
                record.totalPenjualan,
                record.totalCash,
                record.totalKredit,
                record.kasSeharusnya,
                record.kasAktual,
                record.selisih,
                record.jumlahTransaksi,
                `"${record.keteranganSelisih || ''}"`
            ].join(','))
        ].join('\n');

        this.downloadFile(csvContent, 'riwayat-tutup-kasir.csv', 'text/csv');
    }

    /**
     * Exports data to PDF (simplified version)
     */
    exportToPDF() {
        const processedData = this.getProcessedRiwayatData({
            filters: this.currentFilter,
            sort: this.currentSort,
            page: 1,
            itemsPerPage: 999999 // Get all data for export
        });

        const data = processedData.data;
        if (data.length === 0) {
            alert('Tidak ada data untuk diekspor');
            return;
        }

        // Create a simple HTML table for PDF export
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Riwayat Tutup Kasir</title>
                <style>
                    body { font-family: Arial, sans-serif; font-size: 12px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                    h1 { text-align: center; color: #333; }
                    .summary { margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <h1>Riwayat Tutup Kasir</h1>
                <div class="summary">
                    <p><strong>Total Records:</strong> ${processedData.summary.totalRecords}</p>
                    <p><strong>Total Penjualan:</strong> Rp ${processedData.summary.totalPenjualan.toLocaleString('id-ID')}</p>
                    <p><strong>Total Selisih:</strong> Rp ${processedData.summary.totalSelisih.toLocaleString('id-ID')}</p>
                    <p><strong>Generated:</strong> ${new Date().toLocaleString('id-ID')}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Tanggal</th>
                            <th>Kasir</th>
                            <th>Waktu Buka</th>
                            <th>Waktu Tutup</th>
                            <th class="text-right">Modal Awal</th>
                            <th class="text-right">Total Penjualan</th>
                            <th class="text-right">Kas Aktual</th>
                            <th class="text-right">Selisih</th>
                            <th class="text-center">Transaksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(record => `
                            <tr>
                                <td>${this.formatDate(record.tanggalTutup)}</td>
                                <td>${record.kasir}</td>
                                <td>${this.formatTime(record.waktuBuka)}</td>
                                <td>${this.formatTime(record.waktuTutup)}</td>
                                <td class="text-right">Rp ${record.modalAwal.toLocaleString('id-ID')}</td>
                                <td class="text-right">Rp ${record.totalPenjualan.toLocaleString('id-ID')}</td>
                                <td class="text-right">Rp ${record.kasAktual.toLocaleString('id-ID')}</td>
                                <td class="text-right">Rp ${record.selisih.toLocaleString('id-ID')}</td>
                                <td class="text-center">${record.jumlahTransaksi}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        // Open in new window for printing/PDF save
        const printWindow = window.open('', '_blank');
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        
        // Trigger print dialog
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }

    /**
     * Downloads a file with given content
     * @param {string} content - File content
     * @param {string} filename - File name
     * @param {string} mimeType - MIME type
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Utility methods for formatting

    /**
     * Formats date for display
     * @param {string} dateString - Date string
     * @returns {string} Formatted date
     */
    formatDate(dateString) {
        try {
            return new Date(dateString).toLocaleDateString('id-ID');
        } catch (error) {
            return dateString;
        }
    }

    /**
     * Formats time for display
     * @param {string} dateString - Date string
     * @returns {string} Formatted time
     */
    formatTime(dateString) {
        try {
            return new Date(dateString).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    }

    /**
     * Formats date time for display
     * @param {string} dateString - Date string
     * @returns {string} Formatted date time
     */
    formatDateTime(dateString) {
        try {
            return new Date(dateString).toLocaleString('id-ID');
        } catch (error) {
            return dateString;
        }
    }

    /**
     * Gets badge class for selisih amount
     * @param {number} selisih - Selisih amount
     * @returns {string} Bootstrap badge class
     */
    getSelisihBadgeClass(selisih) {
        if (selisih === 0) return 'bg-success';
        if (selisih > 0) return 'bg-info';
        return 'bg-warning';
    }
}

// Create global instance
window.riwayatReporting = new RiwayatTutupKasirReporting();

// Export for module usage
export default RiwayatTutupKasirReporting;