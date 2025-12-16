/**
 * Master Barang Komprehensif - Main Controller
 * Handles main page logic and coordinates all components
 */

import { ValidationEngine } from './ValidationEngine.js';
import { DataTableManager } from './DataTableManager.js';
import { FormManager } from './FormManager.js';
import { BarangManager } from './BarangManager.js';
import { KategoriManager } from './KategoriManager.js';
import { SatuanManager } from './SatuanManager.js';
import { AuditLogger } from './AuditLogger.js';
import { STORAGE_KEYS, DEFAULTS } from './types.js';

export class MasterBarangController {
    constructor() {
        this.validationEngine = new ValidationEngine();
        this.barangManager = new BarangManager();
        this.kategoriManager = new KategoriManager();
        this.satuanManager = new SatuanManager();
        this.auditLogger = new AuditLogger();
        
        this.dataTableManager = null;
        this.formManager = null;
        
        this.currentPage = 1;
        this.pageSize = DEFAULTS.PAGE_SIZE;
        this.sortBy = DEFAULTS.SORT_BY;
        this.sortOrder = DEFAULTS.SORT_ORDER;
        this.searchTerm = '';
        this.filters = {
            kategori_id: null,
            satuan_id: null,
            status: null
        };
        
        this.selectedItems = new Set();
        this.isInitialized = false;
    }

    /**
     * Initialize the controller and all components
     * @param {Object} options - Initialization options
     */
    async initialize(options = {}) {
        try {
            // Initialize managers
            await this.barangManager.initialize();
            await this.kategoriManager.initialize();
            await this.satuanManager.initialize();
            
            // Initialize UI components
            this.dataTableManager = new DataTableManager({
                containerId: options.tableContainerId || 'barang-table-container',
                onSort: this.handleSort.bind(this),
                onPageChange: this.handlePageChange.bind(this),
                onSelect: this.handleItemSelect.bind(this),
                onEdit: this.handleEdit.bind(this),
                onDelete: this.handleDelete.bind(this)
            });
            
            this.formManager = new FormManager({
                formId: options.formId || 'barang-form',
                validationEngine: this.validationEngine,
                onSave: this.handleSave.bind(this),
                onCancel: this.handleCancel.bind(this)
            });
            
            // Load initial data
            await this.loadData();
            
            // Setup event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            
            return {
                success: true,
                message: 'Master Barang Controller initialized successfully'
            };
        } catch (error) {
            console.error('Failed to initialize MasterBarangController:', error);
            return {
                success: false,
                message: 'Failed to initialize controller',
                error: error.message
            };
        }
    }

    /**
     * Load data and refresh the interface
     */
    async loadData() {
        try {
            // Get filtered and paginated data
            const searchFilter = {
                searchTerm: this.searchTerm,
                kategori_id: this.filters.kategori_id,
                satuan_id: this.filters.satuan_id,
                status: this.filters.status,
                page: this.currentPage,
                limit: this.pageSize,
                sortBy: this.sortBy,
                sortOrder: this.sortOrder
            };
            
            const result = await this.barangManager.getBarangList(searchFilter);
            
            // Update data table
            if (this.dataTableManager) {
                await this.dataTableManager.updateData(result);
            }
            
            // Update form dropdowns
            if (this.formManager) {
                const kategoriList = await this.kategoriManager.getKategoriList({ status: 'aktif' });
                const satuanList = await this.satuanManager.getSatuanList({ status: 'aktif' });
                
                await this.formManager.updateDropdowns({
                    kategori: kategoriList.data,
                    satuan: satuanList.data
                });
            }
            
            return result;
        } catch (error) {
            console.error('Failed to load data:', error);
            throw error;
        }
    }

    /**
     * Setup event listeners for UI interactions
     */
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.handleSearch(e.target.value);
                }, 300);
            });
        }
        
        // Filter dropdowns
        const kategoriFilter = document.getElementById('kategori-filter');
        if (kategoriFilter) {
            kategoriFilter.addEventListener('change', (e) => {
                this.handleFilter('kategori_id', e.target.value || null);
            });
        }
        
        const satuanFilter = document.getElementById('satuan-filter');
        if (satuanFilter) {
            satuanFilter.addEventListener('change', (e) => {
                this.handleFilter('satuan_id', e.target.value || null);
            });
        }
        
        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.handleFilter('status', e.target.value || null);
            });
        }
        
        // Add new item button
        const addButton = document.getElementById('add-barang-btn');
        if (addButton) {
            addButton.addEventListener('click', () => {
                this.handleAdd();
            });
        }
        
        // Bulk operation buttons
        const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', () => {
                this.handleBulkDelete();
            });
        }
    }

    /**
     * Handle search input
     * @param {string} searchTerm - Search term
     */
    async handleSearch(searchTerm) {
        this.searchTerm = searchTerm;
        this.currentPage = 1; // Reset to first page
        await this.loadData();
    }

    /**
     * Handle filter changes
     * @param {string} filterType - Type of filter
     * @param {any} value - Filter value
     */
    async handleFilter(filterType, value) {
        this.filters[filterType] = value;
        this.currentPage = 1; // Reset to first page
        await this.loadData();
    }

    /**
     * Handle sorting
     * @param {string} sortBy - Field to sort by
     * @param {string} sortOrder - Sort order (asc/desc)
     */
    async handleSort(sortBy, sortOrder) {
        this.sortBy = sortBy;
        this.sortOrder = sortOrder;
        await this.loadData();
    }

    /**
     * Handle page change
     * @param {number} page - New page number
     */
    async handlePageChange(page) {
        this.currentPage = page;
        await this.loadData();
    }

    /**
     * Handle item selection
     * @param {string} itemId - Item ID
     * @param {boolean} selected - Whether item is selected
     */
    handleItemSelect(itemId, selected) {
        if (selected) {
            this.selectedItems.add(itemId);
        } else {
            this.selectedItems.delete(itemId);
        }
        
        // Update bulk operation buttons
        this.updateBulkOperationButtons();
    }

    /**
     * Handle add new item
     */
    async handleAdd() {
        try {
            if (this.formManager) {
                await this.formManager.showForm('add');
            }
        } catch (error) {
            console.error('Failed to show add form:', error);
            this.showError('Gagal menampilkan form tambah barang');
        }
    }

    /**
     * Handle edit item
     * @param {string} itemId - Item ID to edit
     */
    async handleEdit(itemId) {
        try {
            const barang = await this.barangManager.getBarangById(itemId);
            if (barang && this.formManager) {
                await this.formManager.showForm('edit', barang);
            }
        } catch (error) {
            console.error('Failed to show edit form:', error);
            this.showError('Gagal menampilkan form edit barang');
        }
    }

    /**
     * Handle delete item
     * @param {string} itemId - Item ID to delete
     */
    async handleDelete(itemId) {
        try {
            const barang = await this.barangManager.getBarangById(itemId);
            if (!barang) {
                this.showError('Barang tidak ditemukan');
                return;
            }
            
            const confirmed = await this.showConfirmDialog(
                'Konfirmasi Hapus',
                `Apakah Anda yakin ingin menghapus barang "${barang.nama}"?`
            );
            
            if (confirmed) {
                const result = await this.barangManager.deleteBarang(itemId);
                if (result.success) {
                    // Log audit
                    await this.auditLogger.log({
                        table_name: 'barang',
                        record_id: itemId,
                        action: 'delete',
                        old_data: barang,
                        new_data: null
                    });
                    
                    this.showSuccess('Barang berhasil dihapus');
                    await this.loadData();
                } else {
                    this.showError(result.message || 'Gagal menghapus barang');
                }
            }
        } catch (error) {
            console.error('Failed to delete item:', error);
            this.showError('Gagal menghapus barang');
        }
    }

    /**
     * Handle save operation
     * @param {Object} data - Form data
     * @param {string} mode - Form mode (add/edit)
     */
    async handleSave(data, mode) {
        try {
            // Validate data
            const validation = this.validationEngine.validateBarang(data, mode === 'edit');
            if (!validation.isValid) {
                return {
                    success: false,
                    errors: validation.errors,
                    warnings: validation.warnings
                };
            }
            
            let result;
            let auditAction;
            let oldData = null;
            
            if (mode === 'add') {
                result = await this.barangManager.createBarang(data);
                auditAction = 'create';
            } else {
                oldData = await this.barangManager.getBarangById(data.id);
                result = await this.barangManager.updateBarang(data.id, data);
                auditAction = 'update';
            }
            
            if (result.success) {
                // Log audit
                await this.auditLogger.log({
                    table_name: 'barang',
                    record_id: result.data.id,
                    action: auditAction,
                    old_data: oldData,
                    new_data: result.data
                });
                
                // Show success message
                const message = mode === 'add' ? 'Barang berhasil ditambahkan' : 'Barang berhasil diperbarui';
                this.showSuccess(message);
                
                // Reload data
                await this.loadData();
                
                return {
                    success: true,
                    message: message,
                    data: result.data,
                    warnings: validation.warnings
                };
            } else {
                return {
                    success: false,
                    message: result.message || 'Gagal menyimpan barang',
                    errors: result.errors || []
                };
            }
        } catch (error) {
            console.error('Failed to save item:', error);
            return {
                success: false,
                message: 'Gagal menyimpan barang',
                errors: [error.message]
            };
        }
    }

    /**
     * Handle form cancel
     */
    handleCancel() {
        // Form manager will handle hiding the form
        // No additional action needed
    }

    /**
     * Handle bulk delete operation
     */
    async handleBulkDelete() {
        if (this.selectedItems.size === 0) {
            this.showError('Pilih item yang akan dihapus');
            return;
        }
        
        try {
            const confirmed = await this.showConfirmDialog(
                'Konfirmasi Hapus Massal',
                `Apakah Anda yakin ingin menghapus ${this.selectedItems.size} barang yang dipilih?`
            );
            
            if (confirmed) {
                const results = [];
                const selectedIds = Array.from(this.selectedItems);
                
                for (const itemId of selectedIds) {
                    const barang = await this.barangManager.getBarangById(itemId);
                    const result = await this.barangManager.deleteBarang(itemId);
                    
                    if (result.success) {
                        // Log audit
                        await this.auditLogger.log({
                            table_name: 'barang',
                            record_id: itemId,
                            action: 'delete',
                            old_data: barang,
                            new_data: null,
                            additional_info: { bulk_operation: true }
                        });
                    }
                    
                    results.push({ id: itemId, success: result.success, message: result.message });
                }
                
                const successCount = results.filter(r => r.success).length;
                const failCount = results.length - successCount;
                
                if (successCount > 0) {
                    this.showSuccess(`${successCount} barang berhasil dihapus${failCount > 0 ? `, ${failCount} gagal` : ''}`);
                } else {
                    this.showError('Gagal menghapus barang');
                }
                
                // Clear selection and reload data
                this.selectedItems.clear();
                await this.loadData();
                this.updateBulkOperationButtons();
            }
        } catch (error) {
            console.error('Failed to bulk delete:', error);
            this.showError('Gagal menghapus barang');
        }
    }

    /**
     * Update bulk operation buttons state
     */
    updateBulkOperationButtons() {
        const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
        if (bulkDeleteBtn) {
            bulkDeleteBtn.disabled = this.selectedItems.size === 0;
        }
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        // Implementation depends on UI framework
        console.log('Success:', message);
        // Could use toast notifications, alerts, etc.
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        // Implementation depends on UI framework
        console.error('Error:', message);
        // Could use toast notifications, alerts, etc.
    }

    /**
     * Show confirmation dialog
     * @param {string} title - Dialog title
     * @param {string} message - Dialog message
     * @returns {Promise<boolean>} User confirmation
     */
    async showConfirmDialog(title, message) {
        // Implementation depends on UI framework
        return confirm(`${title}\n\n${message}`);
    }

    /**
     * Get current state
     * @returns {Object} Current controller state
     */
    getState() {
        return {
            isInitialized: this.isInitialized,
            currentPage: this.currentPage,
            pageSize: this.pageSize,
            sortBy: this.sortBy,
            sortOrder: this.sortOrder,
            searchTerm: this.searchTerm,
            filters: { ...this.filters },
            selectedItems: Array.from(this.selectedItems)
        };
    }

    /**
     * Cleanup resources
     */
    destroy() {
        if (this.dataTableManager) {
            this.dataTableManager.destroy();
        }
        if (this.formManager) {
            this.formManager.destroy();
        }
        
        this.selectedItems.clear();
        this.isInitialized = false;
    }
}