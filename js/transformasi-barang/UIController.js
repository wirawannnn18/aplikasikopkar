/**
 * UIController - Pengendali antarmuka pengguna untuk transformasi barang
 * 
 * Kelas ini bertanggung jawab untuk mengelola semua aspek antarmuka pengguna
 * termasuk form validation, preview functionality, dropdown selections, dan auto-complete.
 */

class UIController {
    constructor() {
        this.initialized = false;
        this.transformationManager = null;
        this.errorHandler = null;
        this.currentPreview = null;
        this.formElements = {};
        this.dropdownData = {
            sourceItems: [],
            targetItems: [],
            baseProducts: []
        };
        this.autoCompleteInstances = {};
    }

    /**
     * Initialize UIController dengan dependencies
     * @param {TransformationManager} transformationManager - Manager untuk transformasi
     * @param {ErrorHandler} errorHandler - Handler untuk error
     */
    initialize(transformationManager, errorHandler) {
        this.transformationManager = transformationManager;
        this.errorHandler = errorHandler;
        this.initialized = true;
        
        this._initializeFormElements();
        this._setupEventListeners();
        this._loadInitialData();
    }

    /**
     * Setup form elements dan validasi
     * @private
     */
    _initializeFormElements() {
        this.formElements = {
            sourceItemSelect: document.getElementById('sourceItem'),
            targetItemSelect: document.getElementById('targetItem'),
            quantityInput: document.getElementById('quantity'),
            previewContainer: document.getElementById('preview-container'),
            submitButton: document.getElementById('submit-transformation'),
            resetButton: document.getElementById('reset-form'),
            loadingIndicator: document.getElementById('loading-indicator')
        };

        // Validate required elements exist
        const requiredElements = ['sourceItemSelect', 'targetItemSelect', 'quantityInput'];
        const missingElements = requiredElements.filter(key => !this.formElements[key]);
        
        if (missingElements.length > 0) {
            console.warn('Missing required form elements:', missingElements);
        }
    }

    /**
     * Setup event listeners untuk form elements
     * @private
     */
    _setupEventListeners() {
        // Source item selection change
        if (this.formElements.sourceItemSelect) {
            this.formElements.sourceItemSelect.addEventListener('change', (e) => {
                this._onSourceItemChange(e.target.value);
            });
        }

        // Target item selection change
        if (this.formElements.targetItemSelect) {
            this.formElements.targetItemSelect.addEventListener('change', (e) => {
                this._onTargetItemChange(e.target.value);
            });
        }

        // Quantity input change
        if (this.formElements.quantityInput) {
            this.formElements.quantityInput.addEventListener('input', (e) => {
                this._onQuantityChange(e.target.value);
            });
            
            // Real-time validation
            this.formElements.quantityInput.addEventListener('blur', (e) => {
                this._validateQuantityInput(e.target.value);
            });
        }

        // Form submission
        if (this.formElements.submitButton) {
            this.formElements.submitButton.addEventListener('click', (e) => {
                e.preventDefault();
                this._handleFormSubmission();
            });
        }

        // Form reset
        if (this.formElements.resetButton) {
            this.formElements.resetButton.addEventListener('click', (e) => {
                e.preventDefault();
                this._resetForm();
            });
        }
    }

    /**
     * Load initial data untuk dropdowns
     * @private
     */
    async _loadInitialData() {
        try {
            this._showLoading(true);
            
            // Load transformable items
            const transformableItems = await this.transformationManager.getTransformableItems();
            this._populateSourceItemDropdown(transformableItems);
            
            this._showLoading(false);
        } catch (error) {
            this._showLoading(false);
            this.errorHandler.handleSystemError(error, { context: 'loadInitialData' });
        }
    }

    /**
     * Populate source item dropdown dengan auto-complete
     * @param {Array} items - Array of transformable items
     * @private
     */
    _populateSourceItemDropdown(items) {
        if (!this.formElements.sourceItemSelect) return;

        // Clear existing options
        this.formElements.sourceItemSelect.innerHTML = '<option value="">Pilih Item Sumber...</option>';
        
        // Group items by base product
        const groupedItems = this._groupItemsByBaseProduct(items);
        
        Object.entries(groupedItems).forEach(([baseProduct, productItems]) => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = baseProduct;
            
            productItems.forEach(item => {
                const option = document.createElement('option');
                option.value = item.kode;
                option.textContent = `${item.nama} (Stok: ${item.stok} ${item.satuan})`;
                option.dataset.baseProduct = item.baseProduct;
                option.dataset.unit = item.satuan;
                option.dataset.stock = item.stok;
                optgroup.appendChild(option);
            });
            
            this.formElements.sourceItemSelect.appendChild(optgroup);
        });

        // Setup auto-complete if available
        this._setupAutoComplete(this.formElements.sourceItemSelect, items);
    }

    /**
     * Group items by base product
     * @param {Array} items - Array of items
     * @returns {Object} Grouped items
     * @private
     */
    _groupItemsByBaseProduct(items) {
        return items.reduce((groups, item) => {
            const baseProduct = item.baseProduct || 'Lainnya';
            if (!groups[baseProduct]) {
                groups[baseProduct] = [];
            }
            groups[baseProduct].push(item);
            return groups;
        }, {});
    }

    /**
     * Setup auto-complete functionality
     * @param {HTMLElement} element - Element untuk auto-complete
     * @param {Array} data - Data untuk auto-complete
     * @private
     */
    _setupAutoComplete(element, data) {
        // Simple auto-complete implementation
        const wrapper = document.createElement('div');
        wrapper.className = 'autocomplete-wrapper';
        element.parentNode.insertBefore(wrapper, element);
        wrapper.appendChild(element);

        const suggestionsList = document.createElement('ul');
        suggestionsList.className = 'autocomplete-suggestions';
        suggestionsList.style.display = 'none';
        wrapper.appendChild(suggestionsList);

        // Add search functionality for select elements
        element.addEventListener('focus', () => {
            this._showAutoCompleteSuggestions(element, data, suggestionsList);
        });

        element.addEventListener('blur', () => {
            setTimeout(() => {
                suggestionsList.style.display = 'none';
            }, 200);
        });
    }

    /**
     * Show auto-complete suggestions
     * @param {HTMLElement} element - Target element
     * @param {Array} data - Data untuk suggestions
     * @param {HTMLElement} suggestionsList - Container untuk suggestions
     * @private
     */
    _showAutoCompleteSuggestions(element, data, suggestionsList) {
        suggestionsList.innerHTML = '';
        
        data.slice(0, 10).forEach(item => {
            const li = document.createElement('li');
            li.className = 'autocomplete-suggestion';
            li.textContent = `${item.nama} (${item.satuan}) - Stok: ${item.stok}`;
            li.addEventListener('click', () => {
                element.value = item.kode;
                element.dispatchEvent(new Event('change'));
                suggestionsList.style.display = 'none';
            });
            suggestionsList.appendChild(li);
        });

        suggestionsList.style.display = data.length > 0 ? 'block' : 'none';
    }

    /**
     * Handle source item selection change
     * @param {string} sourceItemId - ID item yang dipilih
     * @private
     */
    async _onSourceItemChange(sourceItemId) {
        try {
            if (!sourceItemId) {
                this._clearTargetItemDropdown();
                this._clearPreview();
                return;
            }

            // Get source item details
            const sourceItem = await this._getItemDetails(sourceItemId);
            if (!sourceItem) {
                this.errorHandler.handleValidationError('Item sumber tidak ditemukan');
                return;
            }

            // Load compatible target items
            await this._loadTargetItems(sourceItem);
            
            // Update preview if quantity is already entered
            if (this.formElements.quantityInput && this.formElements.quantityInput.value) {
                this._updatePreview();
            }
        } catch (error) {
            this.errorHandler.handleSystemError(error, { context: 'sourceItemChange' });
        }
    }

    /**
     * Handle target item selection change
     * @param {string} targetItemId - ID target item yang dipilih
     * @private
     */
    async _onTargetItemChange(targetItemId) {
        try {
            if (!targetItemId) {
                this._clearPreview();
                return;
            }

            // Update preview
            this._updatePreview();
        } catch (error) {
            this.errorHandler.handleSystemError(error, { context: 'targetItemChange' });
        }
    }

    /**
     * Handle quantity input change
     * @param {string} quantity - Quantity value
     * @private
     */
    _onQuantityChange(quantity) {
        // Real-time preview update
        if (quantity && this._isValidQuantity(quantity)) {
            this._updatePreview();
        } else {
            this._clearPreview();
        }
    }

    /**
     * Load target items berdasarkan source item
     * @param {Object} sourceItem - Source item object
     * @private
     */
    async _loadTargetItems(sourceItem) {
        if (!this.formElements.targetItemSelect) return;

        try {
            // Get all items with same base product but different unit
            const allItems = await this.transformationManager.getTransformableItems();
            const compatibleItems = allItems.filter(item => 
                item.baseProduct === sourceItem.baseProduct && 
                item.satuan !== sourceItem.satuan
            );

            // Clear and populate target dropdown
            this.formElements.targetItemSelect.innerHTML = '<option value="">Pilih Item Target...</option>';
            
            compatibleItems.forEach(item => {
                const option = document.createElement('option');
                option.value = item.kode;
                option.textContent = `${item.nama} (Stok: ${item.stok} ${item.satuan})`;
                option.dataset.baseProduct = item.baseProduct;
                option.dataset.unit = item.satuan;
                option.dataset.stock = item.stok;
                this.formElements.targetItemSelect.appendChild(option);
            });

            // Enable target dropdown
            this.formElements.targetItemSelect.disabled = compatibleItems.length === 0;
            
            if (compatibleItems.length === 0) {
                this.errorHandler.handleValidationError(
                    'Tidak ada item target yang kompatibel untuk transformasi'
                );
            }
        } catch (error) {
            this.errorHandler.handleSystemError(error, { context: 'loadTargetItems' });
        }
    }

    /**
     * Clear target item dropdown
     * @private
     */
    _clearTargetItemDropdown() {
        if (this.formElements.targetItemSelect) {
            this.formElements.targetItemSelect.innerHTML = '<option value="">Pilih Item Target...</option>';
            this.formElements.targetItemSelect.disabled = true;
        }
    }

    /**
     * Update transformation preview
     * @private
     */
    async _updatePreview() {
        if (!this.formElements.previewContainer) return;

        try {
            const formData = this._getFormData();
            if (!this._isFormDataComplete(formData)) {
                this._clearPreview();
                return;
            }

            // Validate transformation
            const validationResult = await this.transformationManager.validateTransformation(
                formData.sourceItem,
                formData.targetItem,
                formData.quantity
            );

            if (!validationResult.isValid) {
                this._clearPreview();
                this.errorHandler.handleValidationError(validationResult);
                return;
            }

            // Calculate preview data
            const previewData = await this._calculatePreviewData(formData);
            this._displayPreview(previewData);
            
            // Store current preview for form submission
            this.currentPreview = previewData;
            
        } catch (error) {
            this._clearPreview();
            this.errorHandler.handleSystemError(error, { context: 'updatePreview' });
        }
    }

    /**
     * Calculate preview data
     * @param {Object} formData - Form data
     * @returns {Object} Preview data
     * @private
     */
    async _calculatePreviewData(formData) {
        const calculator = this.transformationManager.calculator;
        
        // Get conversion ratio
        const ratio = calculator.getConversionRatio(
            formData.sourceItem.satuan,
            formData.targetItem.satuan,
            formData.sourceItem.baseProduct
        );

        // Calculate target quantity
        const targetQuantity = calculator.calculateTargetQuantity(formData.quantity, ratio);

        return {
            sourceItem: {
                ...formData.sourceItem,
                quantity: formData.quantity,
                stockBefore: formData.sourceItem.stok,
                stockAfter: formData.sourceItem.stok - formData.quantity
            },
            targetItem: {
                ...formData.targetItem,
                quantity: targetQuantity,
                stockBefore: formData.targetItem.stok,
                stockAfter: formData.targetItem.stok + targetQuantity
            },
            conversionRatio: ratio,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Display preview information
     * @param {Object} previewData - Preview data to display
     * @private
     */
    _displayPreview(previewData) {
        if (!this.formElements.previewContainer) return;

        const html = `
            <div class="transformation-preview">
                <h5><i class="fas fa-eye me-2"></i>Preview Transformasi</h5>
                
                <div class="row">
                    <div class="col-md-6">
                        <div class="card border-warning">
                            <div class="card-header bg-warning text-dark">
                                <strong>Item Sumber</strong>
                            </div>
                            <div class="card-body">
                                <h6>${previewData.sourceItem.nama}</h6>
                                <p class="mb-1"><strong>Unit:</strong> ${previewData.sourceItem.satuan}</p>
                                <p class="mb-1"><strong>Quantity:</strong> ${previewData.sourceItem.quantity}</p>
                                <p class="mb-1"><strong>Stok Sebelum:</strong> ${previewData.sourceItem.stockBefore}</p>
                                <p class="mb-0"><strong>Stok Sesudah:</strong> 
                                    <span class="${previewData.sourceItem.stockAfter < 0 ? 'text-danger' : 'text-success'}">
                                        ${previewData.sourceItem.stockAfter}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="card border-success">
                            <div class="card-header bg-success text-white">
                                <strong>Item Target</strong>
                            </div>
                            <div class="card-body">
                                <h6>${previewData.targetItem.nama}</h6>
                                <p class="mb-1"><strong>Unit:</strong> ${previewData.targetItem.satuan}</p>
                                <p class="mb-1"><strong>Quantity:</strong> ${previewData.targetItem.quantity}</p>
                                <p class="mb-1"><strong>Stok Sebelum:</strong> ${previewData.targetItem.stockBefore}</p>
                                <p class="mb-0"><strong>Stok Sesudah:</strong> 
                                    <span class="text-success">${previewData.targetItem.stockAfter}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="mt-3 p-3 bg-light rounded">
                    <div class="row">
                        <div class="col-md-6">
                            <p class="mb-1"><strong>Rasio Konversi:</strong> 1 ${previewData.sourceItem.satuan} = ${previewData.conversionRatio} ${previewData.targetItem.satuan}</p>
                        </div>
                        <div class="col-md-6">
                            <p class="mb-1"><strong>Waktu Preview:</strong> ${new Date(previewData.timestamp).toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.formElements.previewContainer.innerHTML = html;
        this.formElements.previewContainer.style.display = 'block';

        // Enable/disable submit button based on validation
        if (this.formElements.submitButton) {
            this.formElements.submitButton.disabled = previewData.sourceItem.stockAfter < 0;
        }
    }

    /**
     * Clear preview display
     * @private
     */
    _clearPreview() {
        if (this.formElements.previewContainer) {
            this.formElements.previewContainer.innerHTML = '';
            this.formElements.previewContainer.style.display = 'none';
        }
        
        this.currentPreview = null;
        
        if (this.formElements.submitButton) {
            this.formElements.submitButton.disabled = true;
        }
    }

    /**
     * Handle form submission
     * @private
     */
    async _handleFormSubmission() {
        try {
            if (!this.currentPreview) {
                this.errorHandler.handleValidationError('Preview tidak tersedia. Silakan lengkapi form terlebih dahulu.');
                return;
            }

            this._showLoading(true);
            this._disableForm(true);

            // Execute transformation
            const result = await this.transformationManager.executeTransformation({
                sourceItemId: this.currentPreview.sourceItem.kode,
                targetItemId: this.currentPreview.targetItem.kode,
                sourceQuantity: this.currentPreview.sourceItem.quantity,
                user: this._getCurrentUser(),
                timestamp: new Date().toISOString()
            });

            this._showLoading(false);
            this._disableForm(false);

            if (result.success) {
                this._displaySuccessConfirmation(result);
                this._resetForm();
            } else {
                this.errorHandler.handleBusinessLogicError(result.error);
            }

        } catch (error) {
            this._showLoading(false);
            this._disableForm(false);
            this.errorHandler.handleSystemError(error, { context: 'formSubmission' });
        }
    }

    /**
     * Display success confirmation
     * @param {Object} result - Transformation result
     * @private
     */
    _displaySuccessConfirmation(result) {
        const details = {
            'ID Transaksi': result.transactionId,
            'Item Sumber': `${result.sourceItem.quantity} ${result.sourceItem.unit} ${result.sourceItem.name}`,
            'Item Target': `${result.targetItem.quantity} ${result.targetItem.unit} ${result.targetItem.name}`,
            'Waktu': new Date(result.timestamp).toLocaleString('id-ID'),
            'User': result.user
        };

        this.errorHandler.displaySuccessMessage(
            'Transformasi berhasil dilakukan!',
            'success-container',
            details
        );
    }

    /**
     * Reset form to initial state
     * @private
     */
    _resetForm() {
        // Reset form elements
        if (this.formElements.sourceItemSelect) {
            this.formElements.sourceItemSelect.value = '';
        }
        
        if (this.formElements.targetItemSelect) {
            this.formElements.targetItemSelect.value = '';
            this.formElements.targetItemSelect.disabled = true;
        }
        
        if (this.formElements.quantityInput) {
            this.formElements.quantityInput.value = '';
        }

        // Clear preview and validation
        this._clearPreview();
        this._clearValidationMessages();
        
        // Reset current preview
        this.currentPreview = null;
    }

    /**
     * Get current form data
     * @returns {Object} Form data
     * @private
     */
    _getFormData() {
        const sourceItemId = this.formElements.sourceItemSelect?.value;
        const targetItemId = this.formElements.targetItemSelect?.value;
        const quantity = parseFloat(this.formElements.quantityInput?.value);

        return {
            sourceItemId,
            targetItemId,
            quantity,
            sourceItem: sourceItemId ? this._getItemFromDropdown(this.formElements.sourceItemSelect) : null,
            targetItem: targetItemId ? this._getItemFromDropdown(this.formElements.targetItemSelect) : null
        };
    }

    /**
     * Get item details from dropdown option
     * @param {HTMLSelectElement} selectElement - Select element
     * @returns {Object} Item details
     * @private
     */
    _getItemFromDropdown(selectElement) {
        const selectedOption = selectElement.options[selectElement.selectedIndex];
        if (!selectedOption || !selectedOption.value) return null;

        return {
            kode: selectedOption.value,
            nama: selectedOption.textContent.split(' (Stok:')[0],
            baseProduct: selectedOption.dataset.baseProduct,
            satuan: selectedOption.dataset.unit,
            stok: parseInt(selectedOption.dataset.stock)
        };
    }

    /**
     * Check if form data is complete
     * @param {Object} formData - Form data to check
     * @returns {boolean} True if complete
     * @private
     */
    _isFormDataComplete(formData) {
        return formData.sourceItem && 
               formData.targetItem && 
               formData.quantity && 
               formData.quantity > 0;
    }

    /**
     * Validate quantity input
     * @param {string} quantity - Quantity value
     * @returns {boolean} True if valid
     * @private
     */
    _isValidQuantity(quantity) {
        const num = parseFloat(quantity);
        return !isNaN(num) && num > 0 && Number.isInteger(num);
    }

    /**
     * Validate quantity input and show feedback
     * @param {string} quantity - Quantity value
     * @private
     */
    _validateQuantityInput(quantity) {
        const input = this.formElements.quantityInput;
        if (!input) return;

        if (!quantity || quantity.trim() === '') {
            this._setInputValidation(input, null);
            return;
        }

        if (!this._isValidQuantity(quantity)) {
            this._setInputValidation(input, false, 'Quantity harus berupa bilangan bulat positif');
            return;
        }

        this._setInputValidation(input, true);
    }

    /**
     * Set input validation state
     * @param {HTMLElement} input - Input element
     * @param {boolean|null} isValid - Validation state
     * @param {string} message - Validation message
     * @private
     */
    _setInputValidation(input, isValid, message = '') {
        // Remove existing validation classes
        input.classList.remove('is-valid', 'is-invalid');
        
        // Remove existing feedback
        const existingFeedback = input.parentNode.querySelector('.invalid-feedback, .valid-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }

        if (isValid === null) return;

        // Add validation class
        input.classList.add(isValid ? 'is-valid' : 'is-invalid');

        // Add feedback message
        if (message) {
            const feedback = document.createElement('div');
            feedback.className = isValid ? 'valid-feedback' : 'invalid-feedback';
            feedback.textContent = message;
            input.parentNode.appendChild(feedback);
        }
    }

    /**
     * Clear validation messages
     * @private
     */
    _clearValidationMessages() {
        const inputs = [this.formElements.quantityInput, this.formElements.sourceItemSelect, this.formElements.targetItemSelect];
        
        inputs.forEach(input => {
            if (input) {
                this._setInputValidation(input, null);
            }
        });
    }

    /**
     * Get item details by ID
     * @param {string} itemId - Item ID
     * @returns {Object} Item details
     * @private
     */
    async _getItemDetails(itemId) {
        try {
            const allItems = await this.transformationManager.getTransformableItems();
            return allItems.find(item => item.kode === itemId);
        } catch (error) {
            console.error('Error getting item details:', error);
            return null;
        }
    }

    /**
     * Show/hide loading indicator
     * @param {boolean} show - Show loading
     * @private
     */
    _showLoading(show) {
        if (this.formElements.loadingIndicator) {
            this.formElements.loadingIndicator.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Enable/disable form elements
     * @param {boolean} disabled - Disable form
     * @private
     */
    _disableForm(disabled) {
        const elements = [
            this.formElements.sourceItemSelect,
            this.formElements.targetItemSelect,
            this.formElements.quantityInput,
            this.formElements.submitButton,
            this.formElements.resetButton
        ];

        elements.forEach(element => {
            if (element) {
                element.disabled = disabled;
            }
        });
    }

    /**
     * Get current user
     * @returns {string} Current user
     * @private
     */
    _getCurrentUser() {
        // Get from session, localStorage, or default
        return localStorage.getItem('currentUser') || 'kasir01';
    }

    /**
     * Ensure UIController is initialized
     * @private
     */
    _ensureInitialized() {
        if (!this.initialized) {
            throw new Error('UIController belum diinisialisasi. Panggil initialize() terlebih dahulu.');
        }
    }

    // Public methods

    /**
     * Refresh dropdown data
     */
    async refreshData() {
        this._ensureInitialized();
        await this._loadInitialData();
    }

    /**
     * Get current preview data
     * @returns {Object|null} Current preview data
     */
    getCurrentPreview() {
        return this.currentPreview;
    }

    /**
     * Set form values programmatically
     * @param {Object} values - Form values
     */
    setFormValues(values) {
        this._ensureInitialized();
        
        if (values.sourceItemId && this.formElements.sourceItemSelect) {
            this.formElements.sourceItemSelect.value = values.sourceItemId;
            this._onSourceItemChange(values.sourceItemId);
        }
        
        if (values.targetItemId && this.formElements.targetItemSelect) {
            setTimeout(() => {
                this.formElements.targetItemSelect.value = values.targetItemId;
                this._onTargetItemChange(values.targetItemId);
            }, 100);
        }
        
        if (values.quantity && this.formElements.quantityInput) {
            this.formElements.quantityInput.value = values.quantity;
            this._onQuantityChange(values.quantity);
        }
    }

    /**
     * Validate current form state
     * @returns {Object} Validation result
     */
    validateForm() {
        this._ensureInitialized();
        
        const formData = this._getFormData();
        const errors = [];

        if (!formData.sourceItem) {
            errors.push('Item sumber harus dipilih');
        }

        if (!formData.targetItem) {
            errors.push('Item target harus dipilih');
        }

        if (!formData.quantity || formData.quantity <= 0) {
            errors.push('Quantity harus berupa angka positif');
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
            formData: formData
        };
    }
}

// Export untuk browser dan Node.js
if (typeof window !== 'undefined') {
    window.UIController = UIController;
}

// ES6 module export
export default UIController;