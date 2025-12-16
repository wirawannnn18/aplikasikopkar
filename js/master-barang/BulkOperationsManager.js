/**
 * BulkOperationsManager - Handles bulk operations for master barang
 * Supports bulk delete, bulk update, and progress tracking
 */

import { BaseManager } from './BaseManager.js';
import { AuditLogger } from './AuditLogger.js';
import { ValidationEngine } from './ValidationEngine.js';

export class BulkOperationsManager extends BaseManager {
    constructor() {
        super();
        this.auditLogger = new AuditLogger();
        this.validationEngine = new ValidationEngine();
        this.selectedItems = new Set();
        this.operationInProgress = false;
    }

    /**
     * Initialize bulk operations UI
     */
    initialize() {
        this.createBulkOperationsUI();
        this.setupEventHandlers();
    }

    /**
     * Create bulk operations UI elements
     */
    createBulkOperationsUI() {
        // Create bulk operations toolbar
        const bulkToolbar = document.createElement('div');
        bulkToolbar.id = 'bulkOperationsToolbar';
        bulkToolbar.className = 'bulk-operations-toolbar d-none';
        bulkToolbar.innerHTML = `
            <div class="d-flex align-items-center gap-2 p-2 bg-light border rounded">
                <span id="selectedCount" class="badge bg-primary">0 selected</span>
                <div class="btn-group" role="group">
                    <button type="button" id="bulkDeleteBtn" class="btn btn-sm btn-danger">
                        <i class="fas fa-trash"></i> Delete Selected
                    </button>
                    <button type="button" id="bulkUpdateBtn" class="btn btn-sm btn-warning">
                        <i class="fas fa-edit"></i> Update Selected
                    </button>
                </div>
                <button type="button" id="clearSelectionBtn" class="btn btn-sm btn-secondary">
                    <i class="fas fa-times"></i> Clear Selection
                </button>
            </div>
        `;

        // Insert toolbar after the main controls
        const mainControls = document.querySelector('.main-controls');
        if (mainControls) {
            mainControls.insertAdjacentElement('afterend', bulkToolbar);
        }

        // Create bulk delete confirmation modal
        this.createBulkDeleteModal();
        
        // Create bulk update modal
        this.createBulkUpdateModal();
        
        // Create progress modal
        this.createProgressModal();
    }

    /**
     * Create bulk delete confirmation modal
     */
    createBulkDeleteModal() {
        const modalHTML = `
            <div id="bulkDeleteModal" class="modal fade" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Konfirmasi Hapus Massal</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-warning">
                                <i class="fas fa-exclamation-triangle"></i>
                                <strong>Peringatan!</strong> Operasi ini akan menghapus data secara permanen dan tidak dapat dibatalkan.
                            </div>
                            <p>Anda akan menghapus <strong id="deleteCount">0</strong> barang berikut:</p>
                            <div id="deletePreview" class="border rounded p-3 bg-light" style="max-height: 300px; overflow-y: auto;">
                                <!-- Preview items will be inserted here -->
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                            <button type="button" id="confirmBulkDelete" class="btn btn-danger">
                                <i class="fas fa-trash"></i> Hapus Semua
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Create bulk update modal
     */
    createBulkUpdateModal() {
        const modalHTML = `
            <div id="bulkUpdateModal" class="modal fade" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Update Massal</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>Update <strong id="updateCount">0</strong> barang yang dipilih:</p>
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Update Kategori:</label>
                                        <select id="bulkUpdateKategori" class="form-select">
                                            <option value="">-- Tidak diubah --</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Update Satuan:</label>
                                        <select id="bulkUpdateSatuan" class="form-select">
                                            <option value="">-- Tidak diubah --</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Update Status:</label>
                                        <select id="bulkUpdateStatus" class="form-select">
                                            <option value="">-- Tidak diubah --</option>
                                            <option value="aktif">Aktif</option>
                                            <option value="nonaktif">Non-aktif</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Update Stok Minimum:</label>
                                        <input type="number" id="bulkUpdateStokMin" class="form-control" placeholder="Tidak diubah" min="0">
                                    </div>
                                </div>
                            </div>

                            <div id="updatePreview" class="mt-3">
                                <h6>Preview Perubahan:</h6>
                                <div id="updatePreviewContent" class="border rounded p-3 bg-light" style="max-height: 200px; overflow-y: auto;">
                                    <!-- Preview will be shown here -->
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                            <button type="button" id="previewUpdateBtn" class="btn btn-info">
                                <i class="fas fa-eye"></i> Preview
                            </button>
                            <button type="button" id="confirmBulkUpdate" class="btn btn-warning">
                                <i class="fas fa-save"></i> Update Semua
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Create progress modal
     */
    createProgressModal() {
        const modalHTML = `
            <div id="bulkProgressModal" class="modal fade" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Memproses Operasi Massal</h5>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <div id="progressText" class="text-center mb-2">Memulai operasi...</div>
                                <div class="progress">
                                    <div id="progressBar" class="progress-bar" role="progressbar" style="width: 0%"></div>
                                </div>
                                <div id="progressDetails" class="small text-muted mt-2 text-center">0 / 0 selesai</div>
                            </div>
                            <div id="progressResults" class="d-none">
                                <h6>Hasil Operasi:</h6>
                                <div id="progressResultsContent"></div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" id="closeProgressBtn" class="btn btn-primary d-none" data-bs-dismiss="modal">
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Bulk operation buttons
        document.getElementById('bulkDeleteBtn')?.addEventListener('click', () => this.showBulkDeleteConfirmation());
        document.getElementById('bulkUpdateBtn')?.addEventListener('click', () => this.showBulkUpdateDialog());
        document.getElementById('clearSelectionBtn')?.addEventListener('click', () => this.clearSelection());

        // Modal buttons
        document.getElementById('confirmBulkDelete')?.addEventListener('click', () => this.executeBulkDelete());
        document.getElementById('confirmBulkUpdate')?.addEventListener('click', () => this.executeBulkUpdate());
        document.getElementById('previewUpdateBtn')?.addEventListener('click', () => this.previewBulkUpdate());

        // Selection change handlers
        document.addEventListener('change', (e) => {
            if (e.target.matches('.item-checkbox')) {
                this.handleSelectionChange(e.target);
            }
        });

        // Select all checkbox
        document.addEventListener('change', (e) => {
            if (e.target.matches('#selectAllCheckbox')) {
                this.handleSelectAll(e.target.checked);
            }
        });
    }

    /**
     * Handle individual item selection
     */
    handleSelectionChange(checkbox) {
        const itemId = checkbox.value;
        
        if (checkbox.checked) {
            this.selectedItems.add(itemId);
        } else {
            this.selectedItems.delete(itemId);
        }

        this.updateBulkOperationsUI();
    }

    /**
     * Handle select all checkbox
     */
    handleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.item-checkbox');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            const itemId = checkbox.value;
            
            if (checked) {
                this.selectedItems.add(itemId);
            } else {
                this.selectedItems.delete(itemId);
            }
        });

        this.updateBulkOperationsUI();
    }

    /**
     * Update bulk operations UI based on selection
     */
    updateBulkOperationsUI() {
        const toolbar = document.getElementById('bulkOperationsToolbar');
        const selectedCount = document.getElementById('selectedCount');
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');

        if (this.selectedItems.size > 0) {
            toolbar?.classList.remove('d-none');
            selectedCount.textContent = `${this.selectedItems.size} selected`;
            
            // Update select all checkbox state
            const totalCheckboxes = document.querySelectorAll('.item-checkbox').length;
            if (selectAllCheckbox) {
                selectAllCheckbox.indeterminate = this.selectedItems.size > 0 && this.selectedItems.size < totalCheckboxes;
                selectAllCheckbox.checked = this.selectedItems.size === totalCheckboxes;
            }
        } else {
            toolbar?.classList.add('d-none');
            if (selectAllCheckbox) {
                selectAllCheckbox.indeterminate = false;
                selectAllCheckbox.checked = false;
            }
        }
    }

    /**
     * Clear all selections
     */
    clearSelection() {
        this.selectedItems.clear();
        document.querySelectorAll('.item-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        this.updateBulkOperationsUI();
    }

    /**
     * Show bulk delete confirmation
     */
    showBulkDeleteConfirmation() {
        if (this.selectedItems.size === 0) return;

        const barangs = this.getSelectedBarangs();
        const deleteCount = document.getElementById('deleteCount');
        const deletePreview = document.getElementById('deletePreview');

        deleteCount.textContent = barangs.length;

        // Generate preview
        let previewHTML = '<div class="list-group list-group-flush">';
        barangs.forEach(barang => {
            previewHTML += `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${barang.kode}</strong> - ${barang.nama}
                        <br><small class="text-muted">${barang.kategori_nama} | ${barang.satuan_nama}</small>
                    </div>
                    <span class="badge bg-secondary">${barang.status}</span>
                </div>
            `;
        });
        previewHTML += '</div>';

        deletePreview.innerHTML = previewHTML;

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('bulkDeleteModal'));
        modal.show();
    }

    /**
     * Show bulk update dialog
     */
    showBulkUpdateDialog() {
        if (this.selectedItems.size === 0) return;

        const barangs = this.getSelectedBarangs();
        const updateCount = document.getElementById('updateCount');
        updateCount.textContent = barangs.length;

        // Populate kategori and satuan options
        this.populateUpdateOptions();

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('bulkUpdateModal'));
        modal.show();
    }

    /**
     * Populate update options (kategori and satuan)
     */
    populateUpdateOptions() {
        const kategoriSelect = document.getElementById('bulkUpdateKategori');
        const satuanSelect = document.getElementById('bulkUpdateSatuan');

        // Clear existing options (except first)
        kategoriSelect.innerHTML = '<option value="">-- Tidak diubah --</option>';
        satuanSelect.innerHTML = '<option value="">-- Tidak diubah --</option>';

        // Get data from localStorage
        const kategoris = JSON.parse(localStorage.getItem('kategori_barang') || '[]');
        const satuans = JSON.parse(localStorage.getItem('satuan_barang') || '[]');

        // Populate kategori options
        kategoris.forEach(kategori => {
            if (kategori.status === 'aktif') {
                const option = document.createElement('option');
                option.value = kategori.id;
                option.textContent = kategori.nama;
                kategoriSelect.appendChild(option);
            }
        });

        // Populate satuan options
        satuans.forEach(satuan => {
            if (satuan.status === 'aktif') {
                const option = document.createElement('option');
                option.value = satuan.id;
                option.textContent = satuan.nama;
                satuanSelect.appendChild(option);
            }
        });
    }

    /**
     * Preview bulk update changes
     */
    previewBulkUpdate() {
        const updates = this.getBulkUpdateData();
        const barangs = this.getSelectedBarangs();
        const previewContent = document.getElementById('updatePreviewContent');

        if (Object.keys(updates).length === 0) {
            previewContent.innerHTML = '<p class="text-muted">Tidak ada perubahan yang akan dilakukan.</p>';
            return;
        }

        let previewHTML = '<div class="list-group list-group-flush">';
        barangs.forEach(barang => {
            const changes = [];
            
            if (updates.kategori_id) {
                const kategori = this.getKategoriById(updates.kategori_id);
                changes.push(`Kategori: ${barang.kategori_nama} → ${kategori?.nama || 'Unknown'}`);
            }
            
            if (updates.satuan_id) {
                const satuan = this.getSatuanById(updates.satuan_id);
                changes.push(`Satuan: ${barang.satuan_nama} → ${satuan?.nama || 'Unknown'}`);
            }
            
            if (updates.status) {
                changes.push(`Status: ${barang.status} → ${updates.status}`);
            }
            
            if (updates.stok_minimum !== undefined) {
                changes.push(`Stok Min: ${barang.stok_minimum} → ${updates.stok_minimum}`);
            }

            if (changes.length > 0) {
                previewHTML += `
                    <div class="list-group-item">
                        <strong>${barang.kode}</strong> - ${barang.nama}
                        <ul class="small mt-1 mb-0">
                            ${changes.map(change => `<li>${change}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
        });
        previewHTML += '</div>';

        previewContent.innerHTML = previewHTML;
    }

    /**
     * Get bulk update data from form
     */
    getBulkUpdateData() {
        const updates = {};
        
        const kategoriId = document.getElementById('bulkUpdateKategori').value;
        const satuanId = document.getElementById('bulkUpdateSatuan').value;
        const status = document.getElementById('bulkUpdateStatus').value;
        const stokMin = document.getElementById('bulkUpdateStokMin').value;

        if (kategoriId) {
            updates.kategori_id = kategoriId;
            const kategori = this.getKategoriById(kategoriId);
            updates.kategori_nama = kategori?.nama || '';
        }

        if (satuanId) {
            updates.satuan_id = satuanId;
            const satuan = this.getSatuanById(satuanId);
            updates.satuan_nama = satuan?.nama || '';
        }

        if (status) {
            updates.status = status;
        }

        if (stokMin !== '') {
            updates.stok_minimum = parseInt(stokMin);
        }

        return updates;
    }

    /**
     * Execute bulk delete operation
     */
    async executeBulkDelete() {
        if (this.operationInProgress) return;

        this.operationInProgress = true;
        const barangs = this.getSelectedBarangs();
        
        // Hide confirmation modal
        const confirmModal = bootstrap.Modal.getInstance(document.getElementById('bulkDeleteModal'));
        confirmModal.hide();

        // Show progress modal
        this.showProgressModal('Menghapus barang...', barangs.length);

        try {
            const results = {
                success: 0,
                failed: 0,
                errors: []
            };

            for (let i = 0; i < barangs.length; i++) {
                const barang = barangs[i];
                
                try {
                    // Update progress
                    this.updateProgress(i + 1, barangs.length, `Menghapus ${barang.kode}...`);

                    // Delete barang
                    await this.deleteBarang(barang.id);
                    results.success++;

                    // Log audit
                    await this.auditLogger.log({
                        table_name: 'barang',
                        record_id: barang.id,
                        action: 'bulk_delete',
                        old_data: barang,
                        additional_info: {
                            bulk_operation: true,
                            total_items: barangs.length
                        }
                    });

                } catch (error) {
                    results.failed++;
                    results.errors.push(`${barang.kode}: ${error.message}`);
                }

                // Small delay to show progress
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Show results
            this.showOperationResults('Hapus Massal', results);

            // Refresh data table
            if (window.masterBarangController) {
                window.masterBarangController.loadData();
            }

            // Clear selection
            this.clearSelection();

        } catch (error) {
            this.showError('Terjadi kesalahan saat menghapus data: ' + error.message);
        } finally {
            this.operationInProgress = false;
        }
    }

    /**
     * Execute bulk update operation
     */
    async executeBulkUpdate() {
        if (this.operationInProgress) return;

        const updates = this.getBulkUpdateData();
        if (Object.keys(updates).length === 0) {
            alert('Tidak ada perubahan yang akan dilakukan.');
            return;
        }

        this.operationInProgress = true;
        const barangs = this.getSelectedBarangs();
        
        // Hide update modal
        const updateModal = bootstrap.Modal.getInstance(document.getElementById('bulkUpdateModal'));
        updateModal.hide();

        // Show progress modal
        this.showProgressModal('Mengupdate barang...', barangs.length);

        try {
            const results = {
                success: 0,
                failed: 0,
                errors: []
            };

            for (let i = 0; i < barangs.length; i++) {
                const barang = barangs[i];
                
                try {
                    // Update progress
                    this.updateProgress(i + 1, barangs.length, `Mengupdate ${barang.kode}...`);

                    // Prepare updated data
                    const oldData = { ...barang };
                    const updatedBarang = { ...barang, ...updates };
                    updatedBarang.updated_at = new Date().toISOString();
                    updatedBarang.updated_by = this.getCurrentUser();

                    // Update barang
                    await this.updateBarang(updatedBarang);
                    results.success++;

                    // Log audit
                    await this.auditLogger.log({
                        table_name: 'barang',
                        record_id: barang.id,
                        action: 'bulk_update',
                        old_data: oldData,
                        new_data: updatedBarang,
                        additional_info: {
                            bulk_operation: true,
                            total_items: barangs.length,
                            updated_fields: Object.keys(updates)
                        }
                    });

                } catch (error) {
                    results.failed++;
                    results.errors.push(`${barang.kode}: ${error.message}`);
                }

                // Small delay to show progress
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Show results
            this.showOperationResults('Update Massal', results);

            // Refresh data table
            if (window.masterBarangController) {
                window.masterBarangController.loadData();
            }

            // Clear selection
            this.clearSelection();

        } catch (error) {
            this.showError('Terjadi kesalahan saat mengupdate data: ' + error.message);
        } finally {
            this.operationInProgress = false;
        }
    }

    /**
     * Show progress modal
     */
    showProgressModal(title, total) {
        const modal = new bootstrap.Modal(document.getElementById('bulkProgressModal'));
        const progressText = document.getElementById('progressText');
        const progressBar = document.getElementById('progressBar');
        const progressDetails = document.getElementById('progressDetails');
        const progressResults = document.getElementById('progressResults');
        const closeBtn = document.getElementById('closeProgressBtn');

        progressText.textContent = title;
        progressBar.style.width = '0%';
        progressDetails.textContent = `0 / ${total} selesai`;
        progressResults.classList.add('d-none');
        closeBtn.classList.add('d-none');

        modal.show();
    }

    /**
     * Update progress
     */
    updateProgress(current, total, message) {
        const progressText = document.getElementById('progressText');
        const progressBar = document.getElementById('progressBar');
        const progressDetails = document.getElementById('progressDetails');

        const percentage = Math.round((current / total) * 100);
        
        progressText.textContent = message;
        progressBar.style.width = `${percentage}%`;
        progressDetails.textContent = `${current} / ${total} selesai`;
    }

    /**
     * Show operation results
     */
    showOperationResults(operationType, results) {
        const progressText = document.getElementById('progressText');
        const progressResults = document.getElementById('progressResults');
        const progressResultsContent = document.getElementById('progressResultsContent');
        const closeBtn = document.getElementById('closeProgressBtn');

        progressText.textContent = `${operationType} Selesai`;
        
        let resultsHTML = `
            <div class="alert alert-${results.failed > 0 ? 'warning' : 'success'}">
                <strong>Hasil Operasi:</strong><br>
                ✓ Berhasil: ${results.success}<br>
                ${results.failed > 0 ? `✗ Gagal: ${results.failed}` : ''}
            </div>
        `;

        if (results.errors.length > 0) {
            resultsHTML += `
                <div class="mt-2">
                    <strong>Error Details:</strong>
                    <ul class="small mb-0">
                        ${results.errors.map(error => `<li>${error}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        progressResultsContent.innerHTML = resultsHTML;
        progressResults.classList.remove('d-none');
        closeBtn.classList.remove('d-none');
    }

    /**
     * Get selected barangs data
     */
    getSelectedBarangs() {
        const barangs = JSON.parse(localStorage.getItem('master_barang') || '[]');
        return barangs.filter(barang => this.selectedItems.has(barang.id));
    }

    /**
     * Delete barang by ID
     */
    async deleteBarang(id) {
        const barangs = JSON.parse(localStorage.getItem('master_barang') || '[]');
        const filteredBarangs = barangs.filter(barang => barang.id !== id);
        localStorage.setItem('master_barang', JSON.stringify(filteredBarangs));
    }

    /**
     * Update barang data
     */
    async updateBarang(updatedBarang) {
        const barangs = JSON.parse(localStorage.getItem('master_barang') || '[]');
        const index = barangs.findIndex(barang => barang.id === updatedBarang.id);
        
        if (index !== -1) {
            barangs[index] = updatedBarang;
            localStorage.setItem('master_barang', JSON.stringify(barangs));
        } else {
            throw new Error('Barang tidak ditemukan');
        }
    }

    /**
     * Get kategori by ID
     */
    getKategoriById(id) {
        const kategoris = JSON.parse(localStorage.getItem('kategori_barang') || '[]');
        return kategoris.find(kategori => kategori.id === id);
    }

    /**
     * Get satuan by ID
     */
    getSatuanById(id) {
        const satuans = JSON.parse(localStorage.getItem('satuan_barang') || '[]');
        return satuans.find(satuan => satuan.id === id);
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return localStorage.getItem('current_user') || 'system';
    }

    /**
     * Show error message
     */
    showError(message) {
        alert(message);
    }

    /**
     * Check if bulk operations are available for selection
     */
    isBulkOperationAvailable() {
        return this.selectedItems.size > 0;
    }

    /**
     * Get bulk operation options for selected items
     */
    getBulkOperationOptions() {
        if (this.selectedItems.size === 0) {
            return [];
        }

        return [
            {
                id: 'bulk_delete',
                label: 'Hapus Massal',
                icon: 'fas fa-trash',
                class: 'btn-danger',
                available: true
            },
            {
                id: 'bulk_update_category',
                label: 'Update Kategori',
                icon: 'fas fa-tag',
                class: 'btn-warning',
                available: true
            },
            {
                id: 'bulk_update_unit',
                label: 'Update Satuan',
                icon: 'fas fa-balance-scale',
                class: 'btn-warning',
                available: true
            }
        ];
    }

    /**
     * Validate bulk update data
     */
    validateBulkUpdate(updates) {
        const errors = [];

        // Validate kategori
        if (updates.kategori_id) {
            const kategori = this.getKategoriById(updates.kategori_id);
            if (!kategori || kategori.status !== 'aktif') {
                errors.push('Kategori yang dipilih tidak valid atau tidak aktif');
            }
        }

        // Validate satuan
        if (updates.satuan_id) {
            const satuan = this.getSatuanById(updates.satuan_id);
            if (!satuan || satuan.status !== 'aktif') {
                errors.push('Satuan yang dipilih tidak valid atau tidak aktif');
            }
        }

        // Validate stok minimum
        if (updates.stok_minimum !== undefined) {
            if (updates.stok_minimum < 0) {
                errors.push('Stok minimum tidak boleh negatif');
            }
        }

        return errors;
    }

    /**
     * Get progress tracking info
     */
    getProgressInfo() {
        return {
            operationInProgress: this.operationInProgress,
            selectedCount: this.selectedItems.size,
            hasSelection: this.selectedItems.size > 0
        };
    }
}

// Make BulkOperationsManager available globally
window.bulkOperationsManager = new BulkOperationsManager();