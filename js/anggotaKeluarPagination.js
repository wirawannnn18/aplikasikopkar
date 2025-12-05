// Anggota Keluar Pagination Module
// Implements client-side pagination for reports
// Task 15.2: Add pagination to reports

/**
 * Pagination Manager for Anggota Keluar Reports
 * Provides client-side pagination with configurable page size
 */
const AnggotaKeluarPagination = (function() {
    'use strict';

    // Pagination state
    const state = {
        currentPage: 1,
        pageSize: 50,
        totalRecords: 0,
        totalPages: 0,
        data: [],
        filteredData: []
    };

    // Configuration
    const config = {
        defaultPageSize: 50,
        pageSizeOptions: [10, 25, 50, 100, 200],
        maxVisiblePages: 5  // Number of page buttons to show
    };

    /**
     * Initialize pagination with data
     * @param {array} data - Array of records to paginate
     * @param {number} pageSize - Optional page size (default: 50)
     */
    function init(data, pageSize = config.defaultPageSize) {
        state.data = data || [];
        state.filteredData = [...state.data];
        state.pageSize = pageSize;
        state.totalRecords = state.filteredData.length;
        state.totalPages = Math.ceil(state.totalRecords / state.pageSize);
        state.currentPage = 1;

        return getState();
    }

    /**
     * Get current pagination state
     * @returns {object} Current state
     */
    function getState() {
        return {
            currentPage: state.currentPage,
            pageSize: state.pageSize,
            totalRecords: state.totalRecords,
            totalPages: state.totalPages,
            hasNextPage: state.currentPage < state.totalPages,
            hasPrevPage: state.currentPage > 1,
            startRecord: (state.currentPage - 1) * state.pageSize + 1,
            endRecord: Math.min(state.currentPage * state.pageSize, state.totalRecords)
        };
    }

    /**
     * Get current page data
     * @returns {array} Records for current page
     */
    function getCurrentPageData() {
        const startIndex = (state.currentPage - 1) * state.pageSize;
        const endIndex = startIndex + state.pageSize;
        return state.filteredData.slice(startIndex, endIndex);
    }

    /**
     * Go to specific page
     * @param {number} pageNumber - Page number (1-based)
     * @returns {object} Updated state and page data
     */
    function goToPage(pageNumber) {
        // Validate page number
        if (pageNumber < 1) pageNumber = 1;
        if (pageNumber > state.totalPages) pageNumber = state.totalPages;

        state.currentPage = pageNumber;

        return {
            state: getState(),
            data: getCurrentPageData()
        };
    }

    /**
     * Go to next page
     * @returns {object} Updated state and page data
     */
    function nextPage() {
        if (state.currentPage < state.totalPages) {
            state.currentPage++;
        }

        return {
            state: getState(),
            data: getCurrentPageData()
        };
    }

    /**
     * Go to previous page
     * @returns {object} Updated state and page data
     */
    function prevPage() {
        if (state.currentPage > 1) {
            state.currentPage--;
        }

        return {
            state: getState(),
            data: getCurrentPageData()
        };
    }

    /**
     * Go to first page
     * @returns {object} Updated state and page data
     */
    function firstPage() {
        state.currentPage = 1;

        return {
            state: getState(),
            data: getCurrentPageData()
        };
    }

    /**
     * Go to last page
     * @returns {object} Updated state and page data
     */
    function lastPage() {
        state.currentPage = state.totalPages;

        return {
            state: getState(),
            data: getCurrentPageData()
        };
    }

    /**
     * Change page size
     * @param {number} newPageSize - New page size
     * @returns {object} Updated state and page data
     */
    function setPageSize(newPageSize) {
        state.pageSize = newPageSize;
        state.totalPages = Math.ceil(state.totalRecords / state.pageSize);

        // Adjust current page if needed
        if (state.currentPage > state.totalPages) {
            state.currentPage = state.totalPages;
        }

        return {
            state: getState(),
            data: getCurrentPageData()
        };
    }

    /**
     * Apply filter to data
     * @param {function} filterFn - Filter function
     * @returns {object} Updated state and page data
     */
    function applyFilter(filterFn) {
        if (typeof filterFn === 'function') {
            state.filteredData = state.data.filter(filterFn);
        } else {
            state.filteredData = [...state.data];
        }

        state.totalRecords = state.filteredData.length;
        state.totalPages = Math.ceil(state.totalRecords / state.pageSize);
        state.currentPage = 1; // Reset to first page after filter

        return {
            state: getState(),
            data: getCurrentPageData()
        };
    }

    /**
     * Clear filter and show all data
     * @returns {object} Updated state and page data
     */
    function clearFilter() {
        state.filteredData = [...state.data];
        state.totalRecords = state.filteredData.length;
        state.totalPages = Math.ceil(state.totalRecords / state.pageSize);
        state.currentPage = 1;

        return {
            state: getState(),
            data: getCurrentPageData()
        };
    }

    /**
     * Get page numbers to display in pagination controls
     * @returns {array} Array of page numbers
     */
    function getVisiblePages() {
        const pages = [];
        const maxVisible = config.maxVisiblePages;
        const totalPages = state.totalPages;
        const currentPage = state.currentPage;

        if (totalPages <= maxVisible) {
            // Show all pages if total is less than max visible
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Calculate range of pages to show
            let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
            let endPage = Math.min(totalPages, startPage + maxVisible - 1);

            // Adjust if we're near the end
            if (endPage - startPage < maxVisible - 1) {
                startPage = Math.max(1, endPage - maxVisible + 1);
            }

            // Add first page and ellipsis if needed
            if (startPage > 1) {
                pages.push(1);
                if (startPage > 2) {
                    pages.push('...');
                }
            }

            // Add visible pages
            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }

            // Add ellipsis and last page if needed
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    pages.push('...');
                }
                pages.push(totalPages);
            }
        }

        return pages;
    }

    /**
     * Generate pagination HTML controls
     * @param {string} containerId - ID of container element
     * @returns {string} HTML string for pagination controls
     */
    function generatePaginationHTML(containerId = 'pagination-controls') {
        const paginationState = getState();
        const visiblePages = getVisiblePages();

        let html = `
        <div class="pagination-container" id="${containerId}">
            <div class="pagination-info">
                <span>Menampilkan ${paginationState.startRecord}-${paginationState.endRecord} dari ${paginationState.totalRecords} data</span>
            </div>
            
            <div class="pagination-controls">
                <button class="pagination-btn" 
                        onclick="AnggotaKeluarPagination.firstPage(); renderCurrentPage();" 
                        ${!paginationState.hasPrevPage ? 'disabled' : ''}>
                    ⏮️ Awal
                </button>
                
                <button class="pagination-btn" 
                        onclick="AnggotaKeluarPagination.prevPage(); renderCurrentPage();" 
                        ${!paginationState.hasPrevPage ? 'disabled' : ''}>
                    ◀️ Prev
                </button>
                
                <div class="pagination-pages">
        `;

        visiblePages.forEach(page => {
            if (page === '...') {
                html += `<span class="pagination-ellipsis">...</span>`;
            } else {
                const isActive = page === paginationState.currentPage;
                html += `
                    <button class="pagination-page ${isActive ? 'active' : ''}" 
                            onclick="AnggotaKeluarPagination.goToPage(${page}); renderCurrentPage();"
                            ${isActive ? 'disabled' : ''}>
                        ${page}
                    </button>
                `;
            }
        });

        html += `
                </div>
                
                <button class="pagination-btn" 
                        onclick="AnggotaKeluarPagination.nextPage(); renderCurrentPage();" 
                        ${!paginationState.hasNextPage ? 'disabled' : ''}>
                    Next ▶️
                </button>
                
                <button class="pagination-btn" 
                        onclick="AnggotaKeluarPagination.lastPage(); renderCurrentPage();" 
                        ${!paginationState.hasNextPage ? 'disabled' : ''}>
                    Akhir ⏭️
                </button>
            </div>
            
            <div class="pagination-size">
                <label for="pageSize">Per halaman:</label>
                <select id="pageSize" onchange="AnggotaKeluarPagination.setPageSize(parseInt(this.value)); renderCurrentPage();">
        `;

        config.pageSizeOptions.forEach(size => {
            const selected = size === paginationState.pageSize ? 'selected' : '';
            html += `<option value="${size}" ${selected}>${size}</option>`;
        });

        html += `
                </select>
            </div>
        </div>
        `;

        return html;
    }

    /**
     * Render pagination controls to DOM
     * @param {string} containerId - ID of container element
     */
    function renderPaginationControls(containerId = 'pagination-controls') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = generatePaginationHTML(containerId);
        }
    }

    /**
     * Get pagination summary text
     * @returns {string} Summary text
     */
    function getSummaryText() {
        const paginationState = getState();
        return `Menampilkan ${paginationState.startRecord}-${paginationState.endRecord} dari ${paginationState.totalRecords} data`;
    }

    /**
     * Export current page data to CSV
     * @param {string} filename - Optional filename
     * @returns {string} CSV content
     */
    function exportCurrentPageToCSV(filename = 'laporan-anggota-keluar-page') {
        const pageData = getCurrentPageData();
        return exportToCSV(pageData, `${filename}-${state.currentPage}`);
    }

    /**
     * Export all data to CSV
     * @param {string} filename - Optional filename
     * @returns {string} CSV content
     */
    function exportAllToCSV(filename = 'laporan-anggota-keluar-all') {
        return exportToCSV(state.filteredData, filename);
    }

    /**
     * Helper function to export data to CSV
     * @param {array} data - Data to export
     * @param {string} filename - Filename
     * @returns {string} CSV content
     */
    function exportToCSV(data, filename) {
        if (!data || data.length === 0) {
            return '';
        }

        // CSV headers
        const headers = [
            'NIK',
            'Nama',
            'Departemen',
            'Tanggal Keluar',
            'Alasan Keluar',
            'Status Pengembalian',
            'Tanggal Pembayaran',
            'Simpanan Pokok',
            'Simpanan Wajib',
            'Kewajiban Lain',
            'Total Pengembalian',
            'Metode Pembayaran',
            'Referensi Transaksi'
        ];

        // CSV rows
        const rows = data.map(item => [
            item.nik || '',
            item.nama || '',
            item.departemen || '',
            item.tanggalKeluar || '',
            item.alasanKeluar || '',
            item.statusPengembalian || 'Pending',
            item.tanggalPembayaran || '',
            item.simpananPokok || 0,
            item.simpananWajib || 0,
            item.kewajibanLain || 0,
            item.totalPengembalian || 0,
            item.metodePembayaran || '',
            item.nomorReferensi || ''
        ]);

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        return csvContent;
    }

    // Public API
    return {
        // Initialization
        init,
        
        // State
        getState,
        getCurrentPageData,
        
        // Navigation
        goToPage,
        nextPage,
        prevPage,
        firstPage,
        lastPage,
        
        // Configuration
        setPageSize,
        
        // Filtering
        applyFilter,
        clearFilter,
        
        // UI Helpers
        getVisiblePages,
        generatePaginationHTML,
        renderPaginationControls,
        getSummaryText,
        
        // Export
        exportCurrentPageToCSV,
        exportAllToCSV,
        
        // Config access
        config
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnggotaKeluarPagination;
}
