/**
 * Comprehensive Error Handler for Tutup Kasir POS System
 * Handles localStorage issues, print failures, network problems, and provides user guidance
 */

class ComprehensiveErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1 second
        
        // Initialize error handling
        this.initializeErrorHandling();
    }

    /**
     * Initialize global error handling
     */
    initializeErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.logError('JavaScript Error', event.error, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.logError('Unhandled Promise Rejection', event.reason);
        });

        // Storage event listener for localStorage issues
        window.addEventListener('storage', (event) => {
            if (event.key === null) {
                this.handleStorageCleared();
            }
        });
    }

    /**
     * Log error with timestamp and context
     */
    logError(type, error, context = {}) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            type: type,
            message: error?.message || error,
            stack: error?.stack,
            context: context,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        this.errorLog.push(errorEntry);
        
        // Keep log size manageable
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }

        // Log to console for debugging
        console.error(`[${type}]`, error, context);
        
        // Store in localStorage if possible
        this.safeLocalStorageSet('errorLog', JSON.stringify(this.errorLog));
    }

    /**
     * Safe localStorage operations with fallback
     */
    safeLocalStorageSet(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                return this.handleStorageQuotaExceeded(key, value);
            } else {
                this.showUserError('Penyimpanan Data Gagal', 
                    'Tidak dapat menyimpan data. Silakan refresh halaman dan coba lagi.');
                return false;
            }
        }
    }

    safeLocalStorageGet(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            this.logError('LocalStorage Get Error', error, { key });
            return null;
        }
    }

    safeLocalStorageRemove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            this.logError('LocalStorage Remove Error', error, { key });
            return false;
        }
    }

    /**
     * Handle localStorage quota exceeded
     */
    handleStorageQuotaExceeded(key, value) {
        this.showUserError('Penyimpanan Penuh', 
            'Penyimpanan browser sudah penuh. Sistem akan membersihkan data lama.');

        try {
            // Try to clear old data
            this.clearOldData();
            
            // Retry saving
            localStorage.setItem(key, value);
            this.showUserSuccess('Data berhasil disimpan setelah pembersihan.');
            return true;
        } catch (retryError) {
            this.showUserError('Penyimpanan Gagal', 
                'Tidak dapat menyimpan data meskipun sudah dibersihkan. Silakan hubungi admin.');
            return false;
        }
    }

    /**
     * Clear old data to free up localStorage space
     */
    clearOldData() {
        const keysToCheck = ['riwayatTutupKas', 'errorLog', 'tempData'];
        
        keysToCheck.forEach(key => {
            try {
                const data = localStorage.getItem(key);
                if (data) {
                    const parsedData = JSON.parse(data);
                    if (Array.isArray(parsedData)) {
                        // Keep only recent 50 items
                        const recentData = parsedData.slice(-50);
                        localStorage.setItem(key, JSON.stringify(recentData));
                    }
                }
            } catch (error) {
                // If parsing fails, remove the item
                localStorage.removeItem(key);
            }
        });
    }

    /**
     * Handle storage cleared event
     */
    handleStorageCleared() {
        this.showUserWarning('Data Terhapus', 
            'Data penyimpanan telah dibersihkan. Silakan buka kas ulang jika diperlukan.');
    }

    /**
     * Handle print failures with fallback options
     */
    async handlePrintFailure(printData, printType = 'laporan') {
        this.logError('Print Failure', new Error('Print operation failed'), { printType });

        const options = await this.showPrintFailureDialog(printType);
        
        switch (options.action) {
            case 'retry':
                return this.retryPrint(printData, printType);
            case 'pdf':
                return this.generatePDF(printData, printType);
            case 'email':
                return this.emailReport(printData, printType);
            case 'save':
                return this.saveReportData(printData, printType);
            default:
                return false;
        }
    }

    /**
     * Show print failure dialog with options
     */
    showPrintFailureDialog(printType) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-warning">
                            <h5 class="modal-title">
                                <i class="bi bi-exclamation-triangle me-2"></i>
                                Gagal Mencetak ${printType}
                            </h5>
                        </div>
                        <div class="modal-body">
                            <p>Printer tidak dapat diakses atau terjadi kesalahan saat mencetak.</p>
                            <p>Pilih alternatif berikut:</p>
                            <div class="d-grid gap-2">
                                <button class="btn btn-primary" data-action="retry">
                                    <i class="bi bi-arrow-clockwise me-2"></i>Coba Lagi
                                </button>
                                <button class="btn btn-info" data-action="pdf">
                                    <i class="bi bi-file-pdf me-2"></i>Download PDF
                                </button>
                                <button class="btn btn-success" data-action="email">
                                    <i class="bi bi-envelope me-2"></i>Kirim Email
                                </button>
                                <button class="btn btn-secondary" data-action="save">
                                    <i class="bi bi-save me-2"></i>Simpan Data
                                </button>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            const modalInstance = new bootstrap.Modal(modal);
            modalInstance.show();

            modal.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                if (action) {
                    modalInstance.hide();
                    resolve({ action });
                }
            });

            modal.addEventListener('hidden.bs.modal', () => {
                document.body.removeChild(modal);
                resolve({ action: 'cancel' });
            });
        });
    }

    /**
     * Retry print operation with exponential backoff
     */
    async retryPrint(printData, printType, attempt = 1) {
        if (attempt > this.retryAttempts) {
            this.showUserError('Gagal Mencetak', 
                `Tidak dapat mencetak setelah ${this.retryAttempts} kali percobaan.`);
            return false;
        }

        try {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
            
            // Attempt to print
            const printWindow = window.open('', '_blank');
            printWindow.document.write(printData);
            printWindow.document.close();
            printWindow.print();
            
            this.showUserSuccess(`Berhasil mencetak ${printType} pada percobaan ke-${attempt}.`);
            return true;
        } catch (error) {
            this.logError('Print Retry Failed', error, { attempt, printType });
            return this.retryPrint(printData, printType, attempt + 1);
        }
    }

    /**
     * Generate PDF as fallback
     */
    generatePDF(printData, printType) {
        try {
            // Create a blob with the print data
            const blob = new Blob([printData], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            // Create download link
            const a = document.createElement('a');
            a.href = url;
            a.download = `${printType}_${new Date().toISOString().split('T')[0]}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            this.showUserSuccess(`File ${printType} berhasil didownload.`);
            return true;
        } catch (error) {
            this.logError('PDF Generation Failed', error, { printType });
            this.showUserError('Gagal Generate PDF', 'Tidak dapat membuat file PDF.');
            return false;
        }
    }

    /**
     * Email report functionality
     */
    emailReport(printData, printType) {
        try {
            const subject = encodeURIComponent(`Laporan ${printType} - ${new Date().toLocaleDateString()}`);
            const body = encodeURIComponent(`Berikut adalah laporan ${printType}:\n\n${printData}`);
            const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
            
            window.location.href = mailtoLink;
            
            this.showUserInfo('Email Terbuka', 'Aplikasi email telah dibuka. Silakan kirim laporan.');
            return true;
        } catch (error) {
            this.logError('Email Failed', error, { printType });
            this.showUserError('Gagal Buka Email', 'Tidak dapat membuka aplikasi email.');
            return false;
        }
    }

    /**
     * Save report data as backup
     */
    saveReportData(printData, printType) {
        const reportKey = `backup_${printType}_${Date.now()}`;
        const success = this.safeLocalStorageSet(reportKey, printData);
        
        if (success) {
            this.showUserSuccess(`Data ${printType} berhasil disimpan sebagai backup.`);
        }
        
        return success;
    }

    /**
     * Handle network connectivity issues
     */
    handleNetworkError(operation, callback) {
        if (!navigator.onLine) {
            this.showUserWarning('Tidak Ada Koneksi', 
                'Koneksi internet terputus. Operasi akan dilanjutkan saat koneksi kembali.');
            
            // Wait for connection to return
            const handleOnline = () => {
                window.removeEventListener('online', handleOnline);
                this.showUserSuccess('Koneksi kembali. Melanjutkan operasi...');
                callback();
            };
            
            window.addEventListener('online', handleOnline);
            return false;
        }
        
        return true;
    }

    /**
     * Validate session data with recovery
     */
    validateSessionWithRecovery(sessionKey) {
        try {
            const sessionData = this.safeLocalStorageGet(sessionKey);
            
            if (!sessionData) {
                return this.handleMissingSession(sessionKey);
            }
            
            const parsed = JSON.parse(sessionData);
            
            // Validate required fields
            const requiredFields = ['id', 'kasir', 'kasirId', 'modalAwal', 'waktuBuka'];
            const missingFields = requiredFields.filter(field => !parsed[field]);
            
            if (missingFields.length > 0) {
                return this.handleCorruptedSession(sessionKey, missingFields);
            }
            
            return { success: true, data: parsed };
        } catch (error) {
            this.logError('Session Validation Error', error, { sessionKey });
            return this.handleCorruptedSession(sessionKey, ['parse_error']);
        }
    }

    /**
     * Handle missing session data
     */
    handleMissingSession(sessionKey) {
        this.showUserWarning('Session Tidak Ditemukan', 
            'Data session tidak ditemukan. Silakan buka kas terlebih dahulu.');
        
        return { 
            success: false, 
            error: 'missing_session',
            action: 'redirect_to_buka_kas'
        };
    }

    /**
     * Handle corrupted session data
     */
    handleCorruptedSession(sessionKey, missingFields) {
        this.logError('Corrupted Session', new Error('Session data corrupted'), { 
            sessionKey, 
            missingFields 
        });
        
        // Try to recover from backup
        const backupKey = `${sessionKey}_backup`;
        const backupData = this.safeLocalStorageGet(backupKey);
        
        if (backupData) {
            try {
                const parsed = JSON.parse(backupData);
                this.safeLocalStorageSet(sessionKey, backupData);
                
                this.showUserSuccess('Session berhasil dipulihkan dari backup.');
                return { success: true, data: parsed };
            } catch (error) {
                this.logError('Backup Recovery Failed', error);
            }
        }
        
        // Clear corrupted data
        this.safeLocalStorageRemove(sessionKey);
        
        this.showUserError('Session Rusak', 
            'Data session rusak dan tidak dapat dipulihkan. Silakan buka kas ulang.');
        
        return { 
            success: false, 
            error: 'corrupted_session',
            action: 'clear_and_restart'
        };
    }

    /**
     * Handle input validation errors
     */
    validateInput(value, type, fieldName) {
        const errors = [];
        
        switch (type) {
            case 'currency':
                if (isNaN(value) || value < 0) {
                    errors.push(`${fieldName} harus berupa angka positif`);
                }
                if (value > 999999999) {
                    errors.push(`${fieldName} terlalu besar`);
                }
                break;
                
            case 'required':
                if (!value || value.toString().trim() === '') {
                    errors.push(`${fieldName} wajib diisi`);
                }
                break;
                
            case 'text':
                if (value && value.length > 500) {
                    errors.push(`${fieldName} terlalu panjang (maksimal 500 karakter)`);
                }
                break;
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Show user-friendly error messages
     */
    showUserError(title, message) {
        this.showAlert(title, message, 'error');
    }

    showUserWarning(title, message) {
        this.showAlert(title, message, 'warning');
    }

    showUserSuccess(title, message) {
        this.showAlert(title, message, 'success');
    }

    showUserInfo(title, message) {
        this.showAlert(title, message, 'info');
    }

    /**
     * Generic alert function
     */
    showAlert(title, message, type = 'info') {
        // Use existing showAlert function if available, otherwise create modal
        if (typeof showAlert === 'function') {
            showAlert(message, type);
        } else {
            this.createAlertModal(title, message, type);
        }
    }

    /**
     * Create alert modal
     */
    createAlertModal(title, message, type) {
        const typeConfig = {
            error: { class: 'danger', icon: 'exclamation-triangle' },
            warning: { class: 'warning', icon: 'exclamation-triangle' },
            success: { class: 'success', icon: 'check-circle' },
            info: { class: 'info', icon: 'info-circle' }
        };
        
        const config = typeConfig[type] || typeConfig.info;
        
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-${config.class}">
                        <h5 class="modal-title text-white">
                            <i class="bi bi-${config.icon} me-2"></i>${title}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">OK</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
        
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    /**
     * Get error statistics for debugging
     */
    getErrorStats() {
        const stats = {
            totalErrors: this.errorLog.length,
            errorTypes: {},
            recentErrors: this.errorLog.slice(-10)
        };
        
        this.errorLog.forEach(error => {
            stats.errorTypes[error.type] = (stats.errorTypes[error.type] || 0) + 1;
        });
        
        return stats;
    }

    /**
     * Export error log for debugging
     */
    exportErrorLog() {
        const logData = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            errors: this.errorLog,
            stats: this.getErrorStats()
        };
        
        const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `error_log_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }
}

// Initialize global error handler
window.errorHandler = new ComprehensiveErrorHandler();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComprehensiveErrorHandler;
}