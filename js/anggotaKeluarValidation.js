// Anggota Keluar Validation and UI Feedback Module
// Handles form validation, error display, and user notifications

/**
 * Display validation errors in a form
 * @param {string} formId - ID of the form element
 * @param {array} errors - Array of error objects with field and message
 * @param {string} errorContainerId - ID of the error container (optional)
 */
function displayValidationErrors(formId, errors, errorContainerId = null) {
    // Clear previous errors
    clearValidationErrors(formId);
    
    if (!errors || errors.length === 0) {
        return;
    }
    
    // Get form element
    const form = document.getElementById(formId);
    if (!form) {
        console.error(`Form with ID ${formId} not found`);
        return;
    }
    
    // Display errors for each field
    errors.forEach(error => {
        if (error.field) {
            // Find the input field
            const field = form.querySelector(`#${error.field}, [name="${error.field}"]`);
            
            if (field) {
                // Add is-invalid class to field
                field.classList.add('is-invalid');
                
                // Create or update invalid-feedback div
                let feedbackDiv = field.parentElement.querySelector('.invalid-feedback');
                
                if (!feedbackDiv) {
                    feedbackDiv = document.createElement('div');
                    feedbackDiv.className = 'invalid-feedback';
                    field.parentElement.appendChild(feedbackDiv);
                }
                
                feedbackDiv.textContent = error.message;
                feedbackDiv.style.display = 'block';
            }
        }
    });
    
    // Display summary error message if container provided
    if (errorContainerId) {
        const errorContainer = document.getElementById(errorContainerId);
        
        if (errorContainer) {
            let errorHTML = '<div class="alert alert-danger alert-dismissible fade show" role="alert">';
            errorHTML += '<h6 class="alert-heading"><i class="bi bi-exclamation-triangle me-2"></i>Validasi Gagal</h6>';
            errorHTML += '<ul class="mb-0">';
            
            errors.forEach(error => {
                errorHTML += `<li>${error.message}</li>`;
            });
            
            errorHTML += '</ul>';
            errorHTML += '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
            errorHTML += '</div>';
            
            errorContainer.innerHTML = errorHTML;
            errorContainer.style.display = 'block';
            
            // Scroll to error container
            errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}

/**
 * Clear validation errors from a form
 * @param {string} formId - ID of the form element
 */
function clearValidationErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) {
        return;
    }
    
    // Remove is-invalid class from all fields
    const invalidFields = form.querySelectorAll('.is-invalid');
    invalidFields.forEach(field => {
        field.classList.remove('is-invalid');
    });
    
    // Remove all invalid-feedback divs
    const feedbackDivs = form.querySelectorAll('.invalid-feedback');
    feedbackDivs.forEach(div => {
        div.remove();
    });
    
    // Clear error container if exists
    const errorContainers = form.querySelectorAll('[id$="ErrorContainer"]');
    errorContainers.forEach(container => {
        container.innerHTML = '';
        container.style.display = 'none';
    });
}

/**
 * Validate form before submission
 * @param {string} formId - ID of the form element
 * @param {object} rules - Validation rules object
 * @returns {object} Validation result with valid flag and errors array
 */
function validateForm(formId, rules) {
    const form = document.getElementById(formId);
    if (!form) {
        return {
            valid: false,
            errors: [{
                field: null,
                message: 'Form tidak ditemukan',
                code: 'FORM_NOT_FOUND'
            }]
        };
    }
    
    const errors = [];
    
    // Validate each field according to rules
    Object.keys(rules).forEach(fieldName => {
        const rule = rules[fieldName];
        const field = form.querySelector(`#${fieldName}, [name="${fieldName}"]`);
        
        if (!field) {
            return;
        }
        
        const value = field.value.trim();
        
        // Required validation
        if (rule.required && !value) {
            errors.push({
                field: fieldName,
                message: rule.requiredMessage || `${rule.label || fieldName} harus diisi`,
                code: 'REQUIRED_FIELD'
            });
            return;
        }
        
        // Skip other validations if field is empty and not required
        if (!value && !rule.required) {
            return;
        }
        
        // Min length validation
        if (rule.minLength && value.length < rule.minLength) {
            errors.push({
                field: fieldName,
                message: rule.minLengthMessage || `${rule.label || fieldName} minimal ${rule.minLength} karakter`,
                code: 'MIN_LENGTH'
            });
        }
        
        // Max length validation
        if (rule.maxLength && value.length > rule.maxLength) {
            errors.push({
                field: fieldName,
                message: rule.maxLengthMessage || `${rule.label || fieldName} maksimal ${rule.maxLength} karakter`,
                code: 'MAX_LENGTH'
            });
        }
        
        // Pattern validation
        if (rule.pattern && !rule.pattern.test(value)) {
            errors.push({
                field: fieldName,
                message: rule.patternMessage || `${rule.label || fieldName} format tidak valid`,
                code: 'INVALID_FORMAT'
            });
        }
        
        // Custom validation function
        if (rule.custom && typeof rule.custom === 'function') {
            const customResult = rule.custom(value, form);
            if (customResult !== true) {
                errors.push({
                    field: fieldName,
                    message: customResult || `${rule.label || fieldName} tidak valid`,
                    code: 'CUSTOM_VALIDATION'
                });
            }
        }
    });
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

/**
 * Show toast notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds (default: 5000)
 */
function showToast(message, type = 'success', duration = 5000) {
    // Create toast container if not exists
    let toastContainer = document.getElementById('toastContainer');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }
    
    // Determine icon and color based on type
    let icon = 'bi-check-circle-fill';
    let bgClass = 'bg-success';
    let textClass = 'text-white';
    
    switch (type) {
        case 'error':
            icon = 'bi-x-circle-fill';
            bgClass = 'bg-danger';
            break;
        case 'warning':
            icon = 'bi-exclamation-triangle-fill';
            bgClass = 'bg-warning';
            textClass = 'text-dark';
            break;
        case 'info':
            icon = 'bi-info-circle-fill';
            bgClass = 'bg-info';
            break;
    }
    
    // Create toast element
    const toastId = 'toast-' + Date.now();
    const toastHTML = `
        <div id="${toastId}" class="toast ${bgClass} ${textClass}" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header ${bgClass} ${textClass}">
                <i class="bi ${icon} me-2"></i>
                <strong class="me-auto">${type === 'success' ? 'Berhasil' : type === 'error' ? 'Gagal' : type === 'warning' ? 'Peringatan' : 'Informasi'}</strong>
                <button type="button" class="btn-close ${textClass === 'text-white' ? 'btn-close-white' : ''}" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    // Add toast to container
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    // Initialize and show toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: duration
    });
    
    toast.show();
    
    // Remove toast element after it's hidden
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

/**
 * Show loading state on button
 * @param {HTMLElement} button - Button element
 * @param {string} loadingText - Text to show during loading (default: "Memproses...")
 * @returns {function} Function to restore button state
 */
function showButtonLoading(button, loadingText = 'Memproses...') {
    if (!button) {
        return () => {};
    }
    
    // Store original state
    const originalHTML = button.innerHTML;
    const originalDisabled = button.disabled;
    
    // Set loading state
    button.disabled = true;
    button.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>${loadingText}`;
    
    // Return function to restore state
    return () => {
        button.disabled = originalDisabled;
        button.innerHTML = originalHTML;
    };
}

/**
 * Show loading overlay on element
 * @param {string} elementId - ID of the element to overlay
 * @param {string} message - Loading message (optional)
 */
function showLoadingOverlay(elementId, message = 'Memuat...') {
    const element = document.getElementById(elementId);
    if (!element) {
        return;
    }
    
    // Create overlay
    const overlayId = `${elementId}-loading-overlay`;
    let overlay = document.getElementById(overlayId);
    
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = overlayId;
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div class="mt-2">${message}</div>
            </div>
        `;
        
        // Add overlay styles if not exists
        if (!document.getElementById('loading-overlay-styles')) {
            const style = document.createElement('style');
            style.id = 'loading-overlay-styles';
            style.textContent = `
                .loading-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255, 255, 255, 0.9);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .loading-spinner {
                    text-align: center;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Make element position relative if not already
        const position = window.getComputedStyle(element).position;
        if (position === 'static') {
            element.style.position = 'relative';
        }
        
        element.appendChild(overlay);
    }
    
    overlay.style.display = 'flex';
}

/**
 * Hide loading overlay
 * @param {string} elementId - ID of the element with overlay
 */
function hideLoadingOverlay(elementId) {
    const overlayId = `${elementId}-loading-overlay`;
    const overlay = document.getElementById(overlayId);
    
    if (overlay) {
        overlay.style.display = 'none';
    }
}

/**
 * Confirm action with custom modal
 * @param {string} title - Modal title
 * @param {string} message - Confirmation message
 * @param {function} onConfirm - Callback function on confirm
 * @param {object} options - Additional options (confirmText, cancelText, type)
 */
function confirmAction(title, message, onConfirm, options = {}) {
    const {
        confirmText = 'Ya, Lanjutkan',
        cancelText = 'Batal',
        type = 'warning' // warning, danger, info
    } = options;
    
    // Determine color based on type
    let headerClass = 'bg-warning text-dark';
    let confirmClass = 'btn-warning';
    
    if (type === 'danger') {
        headerClass = 'bg-danger text-white';
        confirmClass = 'btn-danger';
    } else if (type === 'info') {
        headerClass = 'bg-info text-white';
        confirmClass = 'btn-info';
    }
    
    // Create modal HTML
    const modalId = 'confirmActionModal-' + Date.now();
    const modalHTML = `
        <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header ${headerClass}">
                        <h5 class="modal-title">
                            <i class="bi bi-exclamation-triangle me-2"></i>${title}
                        </h5>
                        <button type="button" class="btn-close ${headerClass.includes('text-white') ? 'btn-close-white' : ''}" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        ${message}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            ${cancelText}
                        </button>
                        <button type="button" class="btn ${confirmClass}" id="${modalId}-confirm">
                            ${confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Get modal element
    const modalElement = document.getElementById(modalId);
    const modal = new bootstrap.Modal(modalElement);
    
    // Handle confirm button
    document.getElementById(`${modalId}-confirm`).addEventListener('click', () => {
        modal.hide();
        if (typeof onConfirm === 'function') {
            onConfirm();
        }
    });
    
    // Remove modal from DOM after hidden
    modalElement.addEventListener('hidden.bs.modal', () => {
        modalElement.remove();
    });
    
    // Show modal
    modal.show();
}
