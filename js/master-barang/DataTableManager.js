/**
 * Master Barang Komprehensif - Data Table Manager
 * Handles table display with pagination and sorting
 */

import { DEFAULTS } from './types.js';

export class DataTableManager {
    constructor(options = {}) {
        this.containerId = options.containerId || 'barang-table-container';
        this.onSort = options.onSort || (() => {});
        this.onPageChange = options.onPageChange || (() => {});
        this.onSelect = options.onSelect || (() => {});
        this.onEdit = options.onEdit || (() => {});
        this.onDelete = options.onDelete || (() => {});
        
        this.currentData = null;
        this.selectedItems = new Set();
        
        this.initialize();
    }

    /**
     * Initialize the data table
     */
    initialize() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            throw new Error(`Container with ID '${this.containerId}' not found`);
        }
        
        this.container = container;
        this.render();
    }

    /**
     * Update table data
     * @param {Object} data - Paginated data result
     */
    async updateData(data) {
        this.currentData = data;
        this.render();
    }

    /**
     * Render the complete table
     */
    render() {
        if (!this.container) return;
        
        const html = `
            <div class="table-wrapper">
                ${this.renderTable()}
                ${this.renderPagination()}
            </div>
        `;
        
        this.container.innerHTML = html;
        this.attachEventListeners();
    }

    /**
     * Render the table
     * @returns {string} Table HTML
     */
    renderTable() {
        if (!this.currentData || !this.currentData.data) {
            return `
                <div class="empty-state">
                    <p>Tidak ada data barang</p>
                </div>
            `;
        }
        
        const items = this.currentData.data;
        
        return `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th width="40">
                                <input type="checkbox" id="select-all" class="form-check-input">
                            </th>
                            <th width="80">
                                ${this.renderSortHeader('kode', 'Kode')}
                            </th>
                            <th>
                                ${this.renderSortHeader('nama', 'Nama Barang')}
                            </th>
                            <th width="120">
                                ${this.renderSortHeader('kategori_nama', 'Kategori')}
                            </th>
                            <th width="80">
                                ${this.renderSortHeader('satuan_nama', 'Satuan')}
                            </th>
                            <th width="100" class="text-end">
                                ${this.renderSortHeader('harga_beli', 'Harga Beli')}
                            </th>
                            <th width="100" class="text-end">
                                ${this.renderSortHeader('harga_jual', 'Harga Jual')}
                            </th>
                            <th width="80" class="text-center">
                                ${this.renderSortHeader('stok', 'Stok')}
                            </th>
                            <th width="80" class="text-center">
                                ${this.renderSortHeader('status', 'Status')}
                            </th>
                            <th width="120" class="text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => this.renderTableRow(item)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Render sortable header
     * @param {string} field - Field name
     * @param {string} label - Display label
     * @returns {string} Header HTML
     */
    renderSortHeader(field, label) {
        const currentSort = this.getCurrentSort();
        const isActive = currentSort.sortBy === field;
        const nextOrder = isActive && currentSort.sortOrder === 'asc' ? 'desc' : 'asc';
        
        let sortIcon = '';
        if (isActive) {
            sortIcon = currentSort.sortOrder === 'asc' 
                ? '<i class="fas fa-sort-up"></i>' 
                : '<i class="fas fa-sort-down"></i>';
        } else {
            sortIcon = '<i class="fas fa-sort text-muted"></i>';
        }
        
        return `
            <a href="#" class="sort-header ${isActive ? 'active' : ''}" 
               data-field="${field}" data-order="${nextOrder}">
                ${label} ${sortIcon}
            </a>
        `;
    }

    /**
     * Render table row
     * @param {Object} item - Barang item
     * @returns {string} Row HTML
     */
    renderTableRow(item) {
        const isSelected = this.selectedItems.has(item.id);
        const stockClass = this.getStockClass(item);
        const statusClass = item.status === 'aktif' ? 'text-success' : 'text-danger';
        
        return `
            <tr class="${isSelected ? 'table-active' : ''}">
                <td>
                    <input type="checkbox" class="form-check-input item-checkbox" 
                           value="${item.id}" ${isSelected ? 'checked' : ''}>
                </td>
                <td>
                    <code class="text-primary">${this.escapeHtml(item.kode)}</code>
                </td>
                <td>
                    <div class="fw-medium">${this.escapeHtml(item.nama)}</div>
                    ${item.deskripsi ? `<small class="text-muted">${this.escapeHtml(item.deskripsi)}</small>` : ''}
                </td>
                <td>
                    <span class="badge bg-secondary">${this.escapeHtml(item.kategori_nama || '-')}</span>
                </td>
                <td>
                    <span class="badge bg-info">${this.escapeHtml(item.satuan_nama || '-')}</span>
                </td>
                <td class="text-end">
                    <span class="text-muted">Rp</span> ${this.formatNumber(item.harga_beli)}
                </td>
                <td class="text-end">
                    <span class="text-muted">Rp</span> ${this.formatNumber(item.harga_jual)}
                </td>
                <td class="text-center">
                    <span class="${stockClass}">${this.formatNumber(item.stok)}</span>
                    ${this.renderStockWarning(item)}
                </td>
                <td class="text-center">
                    <span class="badge ${item.status === 'aktif' ? 'bg-success' : 'bg-danger'}">
                        ${item.status}
                    </span>
                </td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-outline-primary edit-btn" 
                                data-id="${item.id}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger delete-btn" 
                                data-id="${item.id}" title="Hapus">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Get stock CSS class based on stock level
     * @param {Object} item - Barang item
     * @returns {string} CSS class
     */
    getStockClass(item) {
        if (item.stok === 0) {
            return 'text-danger fw-bold';
        } else if (item.stok <= item.stok_minimum) {
            return 'text-warning fw-bold';
        }
        return 'text-success';
    }

    /**
     * Render stock warning icon
     * @param {Object} item - Barang item
     * @returns {string} Warning HTML
     */
    renderStockWarning(item) {
        if (item.stok === 0) {
            return '<br><small class="text-danger"><i class="fas fa-exclamation-triangle"></i> Habis</small>';
        } else if (item.stok <= item.stok_minimum && item.stok > 0) {
            return '<br><small class="text-warning"><i class="fas fa-exclamation-triangle"></i> Rendah</small>';
        }
        return '';
    }

    /**
     * Render pagination
     * @returns {string} Pagination HTML
     */
    renderPagination() {
        if (!this.currentData || this.currentData.totalPages <= 1) {
            return '';
        }
        
        const { page, totalPages, total } = this.currentData;
        const startItem = ((page - 1) * this.currentData.limit) + 1;
        const endItem = Math.min(page * this.currentData.limit, total);
        
        return `
            <div class="d-flex justify-content-between align-items-center mt-3">
                <div class="text-muted">
                    Menampilkan ${startItem}-${endItem} dari ${total} data
                </div>
                <nav aria-label="Table pagination">
                    <ul class="pagination pagination-sm mb-0">
                        ${this.renderPaginationItems(page, totalPages)}
                    </ul>
                </nav>
            </div>
        `;
    }

    /**
     * Render pagination items
     * @param {number} currentPage - Current page
     * @param {number} totalPages - Total pages
     * @returns {string} Pagination items HTML
     */
    renderPaginationItems(currentPage, totalPages) {
        const items = [];
        
        // Previous button
        items.push(`
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPage - 1}">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `);
        
        // Page numbers
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);
        
        if (startPage > 1) {
            items.push(`
                <li class="page-item">
                    <a class="page-link" href="#" data-page="1">1</a>
                </li>
            `);
            if (startPage > 2) {
                items.push('<li class="page-item disabled"><span class="page-link">...</span></li>');
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            items.push(`
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `);
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                items.push('<li class="page-item disabled"><span class="page-link">...</span></li>');
            }
            items.push(`
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>
                </li>
            `);
        }
        
        // Next button
        items.push(`
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPage + 1}">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `);
        
        return items.join('');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        if (!this.container) return;
        
        // Select all checkbox
        const selectAllCheckbox = this.container.querySelector('#select-all');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.handleSelectAll(e.target.checked);
            });
        }
        
        // Individual checkboxes
        const itemCheckboxes = this.container.querySelectorAll('.item-checkbox');
        itemCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.handleItemSelect(e.target.value, e.target.checked);
            });
        });
        
        // Sort headers
        const sortHeaders = this.container.querySelectorAll('.sort-header');
        sortHeaders.forEach(header => {
            header.addEventListener('click', (e) => {
                e.preventDefault();
                const field = header.dataset.field;
                const order = header.dataset.order;
                this.handleSort(field, order);
            });
        });
        
        // Pagination links
        const pageLinks = this.container.querySelectorAll('.page-link[data-page]');
        pageLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(link.dataset.page);
                if (page && page > 0) {
                    this.handlePageChange(page);
                }
            });
        });
        
        // Edit buttons
        const editButtons = this.container.querySelectorAll('.edit-btn');
        editButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = button.dataset.id;
                this.handleEdit(itemId);
            });
        });
        
        // Delete buttons
        const deleteButtons = this.container.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = button.dataset.id;
                this.handleDelete(itemId);
            });
        });
    }

    /**
     * Handle select all
     * @param {boolean} selected - Whether all items are selected
     */
    handleSelectAll(selected) {
        if (!this.currentData || !this.currentData.data) return;
        
        this.currentData.data.forEach(item => {
            if (selected) {
                this.selectedItems.add(item.id);
            } else {
                this.selectedItems.delete(item.id);
            }
            this.onSelect(item.id, selected);
        });
        
        // Update individual checkboxes
        const itemCheckboxes = this.container.querySelectorAll('.item-checkbox');
        itemCheckboxes.forEach(checkbox => {
            checkbox.checked = selected;
        });
        
        this.updateRowSelection();
    }

    /**
     * Handle individual item select
     * @param {string} itemId - Item ID
     * @param {boolean} selected - Whether item is selected
     */
    handleItemSelect(itemId, selected) {
        if (selected) {
            this.selectedItems.add(itemId);
        } else {
            this.selectedItems.delete(itemId);
        }
        
        this.onSelect(itemId, selected);
        this.updateSelectAllCheckbox();
        this.updateRowSelection();
    }

    /**
     * Handle sort
     * @param {string} field - Field to sort by
     * @param {string} order - Sort order
     */
    handleSort(field, order) {
        this.onSort(field, order);
    }

    /**
     * Handle page change
     * @param {number} page - New page number
     */
    handlePageChange(page) {
        this.onPageChange(page);
    }

    /**
     * Handle edit
     * @param {string} itemId - Item ID to edit
     */
    handleEdit(itemId) {
        this.onEdit(itemId);
    }

    /**
     * Handle delete
     * @param {string} itemId - Item ID to delete
     */
    handleDelete(itemId) {
        this.onDelete(itemId);
    }

    /**
     * Update select all checkbox state
     */
    updateSelectAllCheckbox() {
        const selectAllCheckbox = this.container?.querySelector('#select-all');
        if (!selectAllCheckbox || !this.currentData) return;
        
        const totalItems = this.currentData.data.length;
        const selectedCount = this.currentData.data.filter(item => 
            this.selectedItems.has(item.id)
        ).length;
        
        selectAllCheckbox.checked = selectedCount === totalItems && totalItems > 0;
        selectAllCheckbox.indeterminate = selectedCount > 0 && selectedCount < totalItems;
    }

    /**
     * Update row selection visual state
     */
    updateRowSelection() {
        if (!this.container) return;
        
        const rows = this.container.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const checkbox = row.querySelector('.item-checkbox');
            if (checkbox) {
                const isSelected = checkbox.checked;
                row.classList.toggle('table-active', isSelected);
            }
        });
    }

    /**
     * Get current sort settings
     * @returns {Object} Sort settings
     */
    getCurrentSort() {
        // This would typically come from the parent controller
        // For now, return defaults
        return {
            sortBy: DEFAULTS.SORT_BY,
            sortOrder: DEFAULTS.SORT_ORDER
        };
    }

    /**
     * Format number for display
     * @param {number} number - Number to format
     * @returns {string} Formatted number
     */
    formatNumber(number) {
        if (number === null || number === undefined) return '-';
        return new Intl.NumberFormat('id-ID').format(number);
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Clear selection
     */
    clearSelection() {
        this.selectedItems.clear();
        this.updateSelectAllCheckbox();
        this.updateRowSelection();
    }

    /**
     * Get selected items
     * @returns {Array} Array of selected item IDs
     */
    getSelectedItems() {
        return Array.from(this.selectedItems);
    }

    /**
     * Destroy the data table manager
     */
    destroy() {
        this.selectedItems.clear();
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}