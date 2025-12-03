/**
 * Error Handler
 * Centralized error handling and user feedback system
 */

class ErrorHandler {
    constructor() {
        this.errorMessages = {
            // Generic errors
            'UNKNOWN_ERROR': 'Terjadi kesalahan yang tidak diketahui',
            'NETWORK_ERROR': 'Kesalahan koneksi jaringan',
            'TIMEOUT_ERROR': 'Operasi melebihi batas waktu',
            
            // Data errors
            'DATA_NOT_FOUND': 'Data tidak ditemukan',
            'DATA_INVALID': 'Data tidak valid',
            'DATA_DUPLICATE': 'Data sudah ada',
            'DATA_CORRUPTED': 'Data rusak atau tidak dapat dibaca',
            
            // Permission errors
            'PERMISSION_DENIED': 'Anda tidak memiliki izin untuk operasi ini',
            'SESSION_EXPIRED': 'Sesi Anda telah berakhir, silakan login kembali',
            'UNAUTHORIZED': 'Akses tidak diizinkan',
            
            // Validation errors
            'VALIDATION_FAILED': 'Validasi data gagal',
            'REQUIRED_FIELD': 'Field wajib tidak boleh kosong',
            'INVALID_FORMAT': 'Format data tidak valid',
            'INVALID_RANGE': 'Nilai di luar rentang yang diizinkan',
            
            // Business logic errors
            'INSUFFICIENT_BALANCE': 'Saldo tidak mencukupi',
            'STOCK_UNAVAILABLE': 'Stok barang tidak tersedia',
            'TRANSACTION_FAILED': 'Transaksi gagal',
            'ACCOUNTING_UNBALANCED': 'Jurnal tidak seimbang',
            
            // Storage errors
            'STORAGE_FULL': 'Penyimpanan penuh',
            'STORAGE_ERROR': 'Kesalahan penyimpanan data',
            'BACKUP_FAILED': 'Backup gagal',
            'RESTORE_FAILED': 'Restore gagal'
        };

        this.notificationContainer = null;
        this.loadingOverlay = null;
        this.init();
    }

    /**
     * Initialize error handler
     */
    init() {
        // Create notification container
        this.createNotificationContainer();
        
        // Create loading overlay
        this.createLoadingOverlay();
        
        // Setup global error handler
        window.addEventListener('error', (event) => {
            this.logError(event.error, 'Global Error');
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.logError(event.reason, 'Unhandled Promise Rejection');
        });
    }

    /**
     * Handle error with user-friendly message
     */
    handleError(error, context = '') {
        // Log to console
        this.logError(error, context);

        // Get user-friendly message
        const message = this.getUserFriendlyMessage(error);

        // Show notification
        this.showError(message, context);

        // Log to audit
        if (typeof auditLogger !== 'undefined') {
            auditLogger.logOperation('ERROR', 'SYSTEM', 'ERROR', {
                error: error.message || error,
                context: context,
                stack: error.stack
            });
        }
    }

    /**
     * Log error for debugging
     */
    logError(error, context = '') {
        const timestamp = new Date().toISOString();
        const errorInfo = {
            timestamp,
            context,
            message: error.message || error,
            stack: error.stack,
            type: error.name || 'Error'
        };

        console.error(`[ERROR] ${context}:`, errorInfo);

        // Store in localStorage for debugging
        try {
            const errorLog = JSON.parse(localStorage.getItem('errorLog') || '[]');
            errorLog.unshift(errorInfo);
            
            // Keep only last 50 errors
            if (errorLog.length > 50) {
                errorLog.length = 50;
            }
            
            localStorage.setItem('errorLog', JSON.stringify(errorLog));
        } catch (e) {
            console.error('Failed to log error to localStorage:', e);
        }
    }

    /**
     * Show success notification
     */
    showSuccess(message, details = null) {
        this.showNotification(message, 'success', details);
    }

    /**
     * Show error notification
     */
    showError(message, details = null) {
        this.showNotification(message, 'error', details);
    }

    /**
     * Show warning notification
     */
    showWarning(message, details = null) {
        this.showNotification(message, 'warning', details);
    }

    /**
     * Show info notification
     */
    showInfo(message, details = null) {
        this.showNotification(message, 'info', details);
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info', details = null) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icon = this.getIconForType(type);
        
        notification.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">
                <div class="notification-message">${AuditUtils.sanitizeHtml(message)}</div>
                ${details ? `<div class="notification-details">${AuditUtils.sanitizeHtml(details)}</div>` : ''}
            </div>
            <button class="notification-close">&times;</button>
        `;

        // Add close handler
        notification.querySelector('.notification-close').addEventListener('click', () => {
            this.removeNotification(notification);
        });

        // Add to container
        this.notificationContainer.appendChild(notification);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            this.removeNotification(notification);
        }, 5000);

        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
    }

    /**
     * Remove notification
     */
    removeNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    /**
     * Show loading indicator
     */
    showLoading(message = 'Memproses...') {
        this.loadingOverlay.querySelector('.loading-message').textContent = message;
        this.loadingOverlay.classList.add('show');

        return {
            hide: () => this.hideLoading(),
            updateMessage: (newMessage) => {
                this.loadingOverlay.querySelector('.loading-message').textContent = newMessage;
            }
        };
    }

    /**
     * Hide loading indicator
     */
    hideLoading() {
        this.loadingOverlay.classList.remove('show');
    }

    /**
     * Show confirmation dialog for destructive actions
     */
    confirmDestructiveAction(message, requireReason = false) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            
            modal.innerHTML = `
                <div class="modal-content confirmation-modal">
                    <div class="modal-header">
                        <h3>Konfirmasi</h3>
                    </div>
                    <div class="modal-body">
                        <p>${AuditUtils.sanitizeHtml(message)}</p>
                        ${requireReason ? `
                            <div class="form-group">
                                <label>Alasan:</label>
                                <textarea id="confirmReason" class="form-control" rows="3" required></textarea>
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="cancelBtn">Batal</button>
                        <button class="btn btn-danger" id="confirmBtn">Ya, Lanjutkan</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Show modal
            setTimeout(() => modal.classList.add('show'), 10);

            // Handle confirm
            modal.querySelector('#confirmBtn').addEventListener('click', () => {
                if (requireReason) {
                    const reason = modal.querySelector('#confirmReason').value.trim();
                    if (!reason) {
                        this.showWarning('Alasan harus diisi');
                        return;
                    }
                    this.removeModal(modal);
                    resolve({ confirmed: true, reason });
                } else {
                    this.removeModal(modal);
                    resolve({ confirmed: true });
                }
            });

            // Handle cancel
            modal.querySelector('#cancelBtn').addEventListener('click', () => {
                this.removeModal(modal);
                resolve({ confirmed: false });
            });

            // Handle click outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.removeModal(modal);
                    resolve({ confirmed: false });
                }
            });
        });
    }

    /**
     * Remove modal
     */
    removeModal(modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }

    /**
     * Get user-friendly error message
     */
    getUserFriendlyMessage(error) {
        if (typeof error === 'string') {
            return this.errorMessages[error] || error;
        }

        if (error.code && this.errorMessages[error.code]) {
            return this.errorMessages[error.code];
        }

        if (error.message) {
            return error.message;
        }

        return this.errorMessages['UNKNOWN_ERROR'];
    }

    /**
     * Get icon for notification type
     */
    getIconForType(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    /**
     * Create notification container
     */
    createNotificationContainer() {
        this.notificationContainer = document.createElement('div');
        this.notificationContainer.id = 'notificationContainer';
        this.notificationContainer.className = 'notification-container';
        document.body.appendChild(this.notificationContainer);
    }

    /**
     * Create loading overlay
     */
    createLoadingOverlay() {
        this.loadingOverlay = document.createElement('div');
        this.loadingOverlay.className = 'loading-overlay';
        this.loadingOverlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <div class="loading-message">Memproses...</div>
            </div>
        `;
        document.body.appendChild(this.loadingOverlay);
    }

    /**
     * Get error log
     */
    getErrorLog() {
        return JSON.parse(localStorage.getItem('errorLog') || '[]');
    }

    /**
     * Clear error log
     */
    clearErrorLog() {
        localStorage.setItem('errorLog', '[]');
    }
}

// Create global instance
const errorHandler = new ErrorHandler();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}
