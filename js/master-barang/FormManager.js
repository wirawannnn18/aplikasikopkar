/**
 * Master Barang Komprehensif - Form Manager
 * Handles add/edit form operations with validation
 */

export class FormManager {
    constructor(options = {}) {
        this.formId = options.formId || 'barang-form';
        this.validationEngine = options.validationEngine;
        this.onSave = options.onSave || (() => {});
        this.onCancel = options.onCancel || (() => {});
        
        this.currentMode = null; // 'add' or 'edit'
        this.currentData = null;
        this.isVisible = false;
        
        this.initialize();
    }

    /**
     * Initialize the form manager
     */
    initialize() {
        this.createFormModal();
        this.attachEventListeners();
    }

    /**
     * Create form modal HTML
     */
    createFormModal() {
        // Check if modal already exists
        let modal = document.getElementById('barang-form-modal');
        if (modal) {
            modal.remove();
        }
        
        const modalHtml = `
            <div class="modal fade" id="barang-form-modal" tabindex="-1" aria-labelledby="barang-form-modal-label" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="barang-form-modal-label">Tambah Barang</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="${this.formId}" novalidate>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="kode" class="form-label">Kode Barang <span class="text-danger">*</span></label>
                                            <input type="text" class="form-control" id="kode" name="kode" required>
                                            <div class="invalid-feedback"></div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="status" class="form-label">Status</label>
                                            <select class="form-select" id="status" name="status">
                                                <option value="aktif">Aktif</option>
                                                <option value="nonaktif">Non-aktif</option>
                                            </select>
                                            <div class="invalid-feedback"></div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="nama" class="form-label">Nama Barang <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control" id="nama" name="nama" required>
                                    <div class="invalid-feedback"></div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="kategori_id" class="form-label">Kategori <span class="text-danger">*</span></label>
                                            <select class="form-select" id="kategori_id" name="kategori_id" required>
                                                <option value="">Pilih Kategori</option>
                                            </select>
                                            <div class="invalid-feedback"></div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="satuan_id" class="form-label">Satuan <span class="text-danger">*</span></label>
                                            <select class="form-select" id="satuan_id" name="satuan_id" required>
                                                <option value="">Pilih Satuan</option>
                                            </select>
                                            <div class="invalid-feedback"></div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="harga_beli" class="form-label">Harga Beli</label>
                                            <div class="input-group">
                                                <span class="input-group-text">Rp</span>
                                                <input type="number" class="form-control" id="harga_beli" name="harga_beli" min="0" step="0.01">
                                            </div>
                                            <div class="invalid-feedback"></div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="harga_jual" class="form-label">Harga Jual</label>
                                            <div class="input-group">
                                                <span class="input-group-text">Rp</span>
                                                <input type="number" class="form-control" id="harga_jual" name="harga_jual" min="0" step="0.01">
                                            </div>
                                            <div class="invalid-feedback"></div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="stok" class="form-label">Stok Saat Ini</label>
                                            <input type="number" class="form-control" id="stok" name="stok" min="0" step="1">
                                            <div class="invalid-feedback"></div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="stok_minimum" class="form-label">Stok Minimum</label>
                                            <input type="number" class="form-control" id="stok_minimum" name="stok_minimum" min="0" step="1">
                                            <div class="invalid-feedback"></div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="deskripsi" class="form-label">Deskripsi</label>
                                    <textarea class="form-control" id="deskripsi" name="deskripsi" rows="3"></textarea>
                                    <div class="invalid-feedback"></div>
                                </div>
                                
                                <input type="hidden" id="barang_id" name="id">
                            </form>
                            
                            <!-- Validation Summary -->
                            <div id="validation-summary" class="alert alert-danger d-none">
                                <h6>Terdapat kesalahan pada form:</h6>
                                <ul id="validation-errors" class="mb-0"></ul>
                            </div>
                            
                            <!-- Warnings -->
                            <div id="validation-warnings" class="alert alert-warning d-none">
                                <h6>Peringatan:</h6>
                                <ul id="warning-list" class="mb-0"></ul>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                            <button type="button" class="btn btn-primary" id="save-btn">
                                <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                                Simpan
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.modal = document.getElementById('barang-form-modal');
        this.form = document.getElementById(this.formId);
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        if (!this.form) return;
        
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSave();
        });
        
        // Save button
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.handleSave();
            });
        }
        
        // Real-time validation
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            
            input.addEventListener('input', () => {
                this.clearFieldError(input);
            });
        });
        
        // Modal events
        if (this.modal) {
            this.modal.addEventListener('hidden.bs.modal', () => {
                this.handleCancel();
            });
        }
    }

    /**
     * Show form in specified mode
     * @param {string} mode - Form mode ('add' or 'edit')
     * @param {Object} data - Data to populate form (for edit mode)
     */
    async showForm(mode, data = null) {
        this.currentMode = mode;
        this.currentData = data;
        
        // Update modal title
        const modalTitle = document.getElementById('barang-form-modal-label');
        if (modalTitle) {
            modalTitle.textContent = mode === 'add' ? 'Tambah Barang' : 'Edit Barang';
        }
        
        // Reset form
        this.resetForm();
        
        // Populate form if editing
        if (mode === 'edit' && data) {
            this.populateForm(data);
        }
        
        // Show modal
        if (this.modal) {
            const bsModal = new bootstrap.Modal(this.modal);
            bsModal.show();
            this.isVisible = true;
        }
    }

    /**
     * Hide form
     */
    hideForm() {
        if (this.modal) {
            const bsModal = bootstrap.Modal.getInstance(this.modal);
            if (bsModal) {
                bsModal.hide();
            }
        }
        this.isVisible = false;
    }

    /**
     * Reset form to initial state
     */
    resetForm() {
        if (!this.form) return;
        
        this.form.reset();
        this.clearAllErrors();
        this.clearWarnings();
        
        // Set default values
        const statusSelect = this.form.querySelector('#status');
        if (statusSelect) {
            statusSelect.value = 'aktif';
        }
    }

    /**
     * Populate form with data
     * @param {Object} data - Data to populate
     */
    populateForm(data) {
        if (!this.form || !data) return;
        
        Object.keys(data).forEach(key => {
            const field = this.form.querySelector(`[name="${key}"]`);
            if (field) {
                field.value = data[key] || '';
            }
        });
    }

    /**
     * Get form data
     * @returns {Object} Form data
     */
    getFormData() {
        if (!this.form) return {};
        
        const formData = new FormData(this.form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            // Convert numeric fields
            if (['harga_beli', 'harga_jual', 'stok', 'stok_minimum'].includes(key)) {
                data[key] = value ? parseFloat(value) : 0;
            } else {
                data[key] = value.trim();
            }
        }
        
        // Remove empty ID for add mode
        if (this.currentMode === 'add' && data.id === '') {
            delete data.id;
        }
        
        return data;
    }

    /**
     * Handle save operation
     */
    async handleSave() {
        try {
            const saveBtn = document.getElementById('save-btn');
            const spinner = saveBtn?.querySelector('.spinner-border');
            
            // Show loading state
            if (saveBtn) {
                saveBtn.disabled = true;
                if (spinner) spinner.classList.remove('d-none');
            }
            
            // Get form data
            const formData = this.getFormData();
            
            // Validate form
            if (!this.validateForm(formData)) {
                return;
            }
            
            // Call save handler
            const result = await this.onSave(formData, this.currentMode);
            
            if (result.success) {
                // Show warnings if any
                if (result.warnings && result.warnings.length > 0) {
                    this.showWarnings(result.warnings);
                }
                
                // Hide form after short delay to show success
                setTimeout(() => {
                    this.hideForm();
                }, result.warnings && result.warnings.length > 0 ? 2000 : 500);
            } else {
                // Show errors
                if (result.errors && result.errors.length > 0) {
                    this.showErrors(result.errors);
                }
                if (result.message) {
                    this.showErrors([result.message]);
                }
            }
        } catch (error) {
            console.error('Save error:', error);
            this.showErrors(['Terjadi kesalahan saat menyimpan data']);
        } finally {
            // Hide loading state
            const saveBtn = document.getElementById('save-btn');
            const spinner = saveBtn?.querySelector('.spinner-border');
            
            if (saveBtn) {
                saveBtn.disabled = false;
                if (spinner) spinner.classList.add('d-none');
            }
        }
    }

    /**
     * Handle cancel operation
     */
    handleCancel() {
        this.resetForm();
        this.currentMode = null;
        this.currentData = null;
        this.isVisible = false;
        this.onCancel();
    }

    /**
     * Validate entire form
     * @param {Object} data - Form data
     * @returns {boolean} Whether form is valid
     */
    validateForm(data) {
        if (!this.validationEngine) return true;
        
        const validation = this.validationEngine.validateBarang(data, this.currentMode === 'edit');
        
        this.clearAllErrors();
        this.clearWarnings();
        
        if (!validation.isValid) {
            this.showErrors(validation.errors);
            return false;
        }
        
        if (validation.warnings && validation.warnings.length > 0) {
            this.showWarnings(validation.warnings);
        }
        
        return true;
    }

    /**
     * Validate individual field
     * @param {HTMLElement} field - Field element
     */
    validateField(field) {
        if (!this.validationEngine || !field) return;
        
        const fieldName = field.name;
        const fieldValue = field.value;
        
        // Create partial data for validation
        const partialData = { [fieldName]: fieldValue };
        
        // Add required fields for context
        if (fieldName === 'harga_jual') {
            const hargaBeliField = this.form.querySelector('[name="harga_beli"]');
            if (hargaBeliField) {
                partialData.harga_beli = hargaBeliField.value;
            }
        }
        
        if (fieldName === 'stok') {
            const stokMinField = this.form.querySelector('[name="stok_minimum"]');
            if (stokMinField) {
                partialData.stok_minimum = stokMinField.value;
            }
        }
        
        const validation = this.validationEngine.validateBarang(partialData, true);
        
        // Show field-specific errors
        const fieldErrors = validation.errors.filter(error => 
            error.toLowerCase().includes(this.getFieldDisplayName(fieldName).toLowerCase())
        );
        
        if (fieldErrors.length > 0) {
            this.showFieldError(field, fieldErrors[0]);
        } else {
            this.clearFieldError(field);
        }
    }

    /**
     * Get field display name for error messages
     * @param {string} fieldName - Field name
     * @returns {string} Display name
     */
    getFieldDisplayName(fieldName) {
        const displayNames = {
            kode: 'kode',
            nama: 'nama',
            kategori_id: 'kategori',
            satuan_id: 'satuan',
            harga_beli: 'harga beli',
            harga_jual: 'harga jual',
            stok: 'stok',
            stok_minimum: 'stok minimum'
        };
        
        return displayNames[fieldName] || fieldName;
    }

    /**
     * Show field error
     * @param {HTMLElement} field - Field element
     * @param {string} message - Error message
     */
    showFieldError(field, message) {
        field.classList.add('is-invalid');
        
        const feedback = field.parentNode.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.textContent = message;
        }
    }

    /**
     * Clear field error
     * @param {HTMLElement} field - Field element
     */
    clearFieldError(field) {
        field.classList.remove('is-invalid');
        
        const feedback = field.parentNode.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.textContent = '';
        }
    }

    /**
     * Clear all field errors
     */
    clearAllErrors() {
        if (!this.form) return;
        
        const invalidFields = this.form.querySelectorAll('.is-invalid');
        invalidFields.forEach(field => {
            this.clearFieldError(field);
        });
        
        // Hide validation summary
        const summary = document.getElementById('validation-summary');
        if (summary) {
            summary.classList.add('d-none');
        }
    }

    /**
     * Show form errors
     * @param {Array} errors - Array of error messages
     */
    showErrors(errors) {
        const summary = document.getElementById('validation-summary');
        const errorsList = document.getElementById('validation-errors');
        
        if (summary && errorsList) {
            errorsList.innerHTML = errors.map(error => `<li>${error}</li>`).join('');
            summary.classList.remove('d-none');
        }
    }

    /**
     * Show form warnings
     * @param {Array} warnings - Array of warning messages
     */
    showWarnings(warnings) {
        const warningsDiv = document.getElementById('validation-warnings');
        const warningsList = document.getElementById('warning-list');
        
        if (warningsDiv && warningsList) {
            warningsList.innerHTML = warnings.map(warning => `<li>${warning}</li>`).join('');
            warningsDiv.classList.remove('d-none');
        }
    }

    /**
     * Clear warnings
     */
    clearWarnings() {
        const warningsDiv = document.getElementById('validation-warnings');
        if (warningsDiv) {
            warningsDiv.classList.add('d-none');
        }
    }

    /**
     * Update dropdown options
     * @param {Object} options - Dropdown options
     */
    async updateDropdowns(options) {
        if (options.kategori) {
            this.updateKategoriDropdown(options.kategori);
        }
        
        if (options.satuan) {
            this.updateSatuanDropdown(options.satuan);
        }
    }

    /**
     * Update kategori dropdown
     * @param {Array} kategoriList - List of kategori
     */
    updateKategoriDropdown(kategoriList) {
        const select = this.form?.querySelector('#kategori_id');
        if (!select) return;
        
        // Keep current selection
        const currentValue = select.value;
        
        // Clear options except first
        select.innerHTML = '<option value="">Pilih Kategori</option>';
        
        // Add options
        kategoriList.forEach(kategori => {
            const option = document.createElement('option');
            option.value = kategori.id;
            option.textContent = kategori.nama;
            select.appendChild(option);
        });
        
        // Restore selection
        if (currentValue) {
            select.value = currentValue;
        }
    }

    /**
     * Update satuan dropdown
     * @param {Array} satuanList - List of satuan
     */
    updateSatuanDropdown(satuanList) {
        const select = this.form?.querySelector('#satuan_id');
        if (!select) return;
        
        // Keep current selection
        const currentValue = select.value;
        
        // Clear options except first
        select.innerHTML = '<option value="">Pilih Satuan</option>';
        
        // Add options
        satuanList.forEach(satuan => {
            const option = document.createElement('option');
            option.value = satuan.id;
            option.textContent = satuan.nama;
            select.appendChild(option);
        });
        
        // Restore selection
        if (currentValue) {
            select.value = currentValue;
        }
    }

    /**
     * Check if form is visible
     * @returns {boolean} Whether form is visible
     */
    isFormVisible() {
        return this.isVisible;
    }

    /**
     * Get current form mode
     * @returns {string|null} Current mode
     */
    getCurrentMode() {
        return this.currentMode;
    }

    /**
     * Destroy the form manager
     */
    destroy() {
        if (this.modal) {
            this.modal.remove();
        }
        
        this.currentMode = null;
        this.currentData = null;
        this.isVisible = false;
    }
}