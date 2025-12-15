/**
 * ErrorHandler - Sistem penanganan error untuk transformasi barang
 * 
 * Kelas ini bertanggung jawab untuk menangani berbagai kategori error
 * dan memberikan feedback yang user-friendly kepada pengguna.
 */

class ErrorHandler {
    constructor() {
        this.initialized = false;
        this.errorLog = [];
        this.errorCategories = {
            VALIDATION: 'validation',
            CALCULATION: 'calculation', 
            SYSTEM: 'system',
            BUSINESS_LOGIC: 'business_logic'
        };
    }

    /**
     * Initialize ErrorHandler
     */
    initialize() {
        this.initialized = true;
        this._setupGlobalErrorHandling();
    }

    /**
     * Handle validation errors
     * @param {Error|Object} error - Error object atau validation result
     * @param {Object} context - Context informasi tambahan
     * @returns {Object} Formatted error response
     */
    handleValidationError(error, context = {}) {
        this._ensureInitialized();
        
        try {
            const errorInfo = {
                category: this.errorCategories.VALIDATION,
                timestamp: new Date().toISOString(),
                context: context,
                originalError: error
            };

            // Log error untuk debugging
            this._logError(errorInfo);

            // Determine error type dan message
            let userMessage = '';
            let suggestions = [];
            let severity = 'error';

            if (error.errors && Array.isArray(error.errors)) {
                // Validation result object
                userMessage = error.errors[0] || 'Terjadi kesalahan validasi';
                suggestions = this._getValidationSuggestions(error.errors);
            } else if (error.message) {
                // Error object
                userMessage = this._translateValidationError(error.message);
                suggestions = this._getValidationSuggestions([error.message]);
            } else if (typeof error === 'string') {
                // String error
                userMessage = error;
                suggestions = this._getValidationSuggestions([error]);
            } else {
                userMessage = 'Terjadi kesalahan validasi yang tidak diketahui';
            }

            return {
                success: false,
                category: this.errorCategories.VALIDATION,
                message: userMessage,
                suggestions: suggestions,
                severity: severity,
                timestamp: errorInfo.timestamp,
                canRetry: true
            };
        } catch (handlingError) {
            console.error('Error in handleValidationError:', handlingError);
            return this._getFallbackErrorResponse('Terjadi kesalahan saat memproses validasi');
        }
    }

    /**
     * Handle system errors
     * @param {Error} error - System error
     * @param {Object} context - Context informasi tambahan
     * @returns {Object} Formatted error response
     */
    handleSystemError(error, context = {}) {
        this._ensureInitialized();
        
        try {
            const errorInfo = {
                category: this.errorCategories.SYSTEM,
                timestamp: new Date().toISOString(),
                context: context,
                originalError: error,
                stack: error.stack
            };

            // Log error dengan detail lengkap
            this._logError(errorInfo);

            // Rollback perubahan jika perlu
            if (context.rollbackFunction && typeof context.rollbackFunction === 'function') {
                try {
                    context.rollbackFunction();
                } catch (rollbackError) {
                    console.error('Rollback failed:', rollbackError);
                }
            }

            // Determine user message berdasarkan jenis system error
            let userMessage = '';
            let suggestions = [];
            let canRetry = false;

            if (error.message.includes('localStorage')) {
                userMessage = 'Terjadi masalah dengan penyimpanan data. Silakan refresh halaman.';
                suggestions = [
                    'Refresh halaman browser',
                    'Pastikan browser mendukung localStorage',
                    'Coba bersihkan cache browser'
                ];
                canRetry = true;
            } else if (error.message.includes('JSON')) {
                userMessage = 'Data rusak terdeteksi. Sistem akan mencoba memperbaiki otomatis.';
                suggestions = [
                    'Tunggu beberapa saat untuk perbaikan otomatis',
                    'Jika masalah berlanjut, hubungi administrator'
                ];
                canRetry = true;
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                userMessage = 'Terjadi masalah koneksi. Periksa koneksi internet Anda.';
                suggestions = [
                    'Periksa koneksi internet',
                    'Coba lagi dalam beberapa saat',
                    'Hubungi administrator jika masalah berlanjut'
                ];
                canRetry = true;
            } else {
                userMessage = 'Terjadi kesalahan sistem. Tim teknis telah diberitahu.';
                suggestions = [
                    'Coba lagi dalam beberapa saat',
                    'Hubungi administrator jika masalah berlanjut'
                ];
                canRetry = false;
            }

            return {
                success: false,
                category: this.errorCategories.SYSTEM,
                message: userMessage,
                suggestions: suggestions,
                severity: 'error',
                timestamp: errorInfo.timestamp,
                canRetry: canRetry,
                errorId: this._generateErrorId()
            };
        } catch (handlingError) {
            console.error('Error in handleSystemError:', handlingError);
            return this._getFallbackErrorResponse('Terjadi kesalahan sistem yang serius');
        }
    }

    /**
     * Handle business logic errors
     * @param {Error|Object} error - Business logic error
     * @param {Object} context - Context informasi tambahan
     * @returns {Object} Formatted error response
     */
    handleBusinessLogicError(error, context = {}) {
        this._ensureInitialized();
        
        try {
            const errorInfo = {
                category: this.errorCategories.BUSINESS_LOGIC,
                timestamp: new Date().toISOString(),
                context: context,
                originalError: error
            };

            // Log business rule violation
            this._logError(errorInfo);

            let userMessage = '';
            let suggestions = [];
            let alternatives = [];

            // Determine specific business logic error
            const errorMessage = error.message || error.toString();

            if (errorMessage.includes('stok tidak mencukupi') || errorMessage.includes('insufficient stock') || 
                (context.availableStock !== undefined && context.requestedQuantity !== undefined && 
                 context.availableStock < context.requestedQuantity)) {
                userMessage = 'Stok tidak mencukupi untuk transformasi ini.';
                suggestions = [
                    'Periksa stok terkini',
                    'Kurangi jumlah transformasi',
                    'Pilih item lain yang memiliki stok cukup'
                ];
                alternatives = this._getStockAlternatives(context);
            } else if (errorMessage.includes('rasio konversi') || errorMessage.includes('conversion ratio') || 
                       errorMessage.includes('belum dikonfigurasi') || errorMessage.includes('not configured')) {
                userMessage = 'Rasio konversi belum dikonfigurasi untuk produk ini.';
                suggestions = [
                    'Hubungi administrator untuk konfigurasi rasio',
                    'Pilih kombinasi unit yang sudah dikonfigurasi'
                ];
                alternatives = this._getConfiguredRatioAlternatives(context);
            } else if (errorMessage.includes('produk tidak cocok') || errorMessage.includes('product mismatch')) {
                userMessage = 'Produk yang dipilih tidak dapat ditransformasi satu sama lain.';
                suggestions = [
                    'Pilih produk yang sama dengan unit berbeda',
                    'Periksa kembali pilihan produk'
                ];
                alternatives = this._getProductAlternatives(context);
            } else if (errorMessage.includes('negatif') || errorMessage.includes('negative')) {
                userMessage = 'Transformasi akan menghasilkan stok negatif.';
                suggestions = [
                    'Kurangi jumlah transformasi',
                    'Periksa stok terkini sebelum transformasi'
                ];
            } else {
                // Default case - try to infer from context
                if (context.availableStock !== undefined && context.requestedQuantity !== undefined) {
                    if (context.availableStock < context.requestedQuantity || context.availableStock === 0) {
                        userMessage = 'Stok tidak mencukupi untuk transformasi ini.';
                        suggestions = [
                            'Periksa stok terkini',
                            'Kurangi jumlah transformasi',
                            'Pilih item lain yang memiliki stok cukup'
                        ];
                    } else {
                        userMessage = 'Aturan bisnis tidak terpenuhi untuk transformasi ini.';
                        suggestions = [
                            'Periksa kembali parameter transformasi',
                            'Hubungi supervisor jika diperlukan'
                        ];
                    }
                } else {
                    // Check if error message contains stock-related keywords
                    if (errorMessage.toLowerCase().includes('stok') || 
                        errorMessage.toLowerCase().includes('stock') ||
                        errorMessage.toLowerCase().includes('habis') ||
                        errorMessage.toLowerCase().includes('kosong')) {
                        userMessage = 'Stok tidak mencukupi untuk transformasi ini.';
                        suggestions = [
                            'Periksa stok terkini',
                            'Kurangi jumlah transformasi',
                            'Pilih item lain yang memiliki stok cukup'
                        ];
                    } else {
                        userMessage = 'Aturan bisnis tidak terpenuhi untuk transformasi ini.';
                        suggestions = [
                            'Periksa kembali parameter transformasi',
                            'Hubungi supervisor jika diperlukan'
                        ];
                    }
                }
            }

            return {
                success: false,
                category: this.errorCategories.BUSINESS_LOGIC,
                message: userMessage,
                suggestions: suggestions,
                alternatives: alternatives,
                severity: 'warning',
                timestamp: errorInfo.timestamp,
                canRetry: true
            };
        } catch (handlingError) {
            console.error('Error in handleBusinessLogicError:', handlingError);
            return this._getFallbackErrorResponse('Terjadi kesalahan dalam aturan bisnis');
        }
    }

    /**
     * Handle calculation errors
     * @param {Error} error - Calculation error
     * @param {Object} context - Context informasi tambahan
     * @returns {Object} Formatted error response
     */
    handleCalculationError(error, context = {}) {
        this._ensureInitialized();
        
        try {
            const errorInfo = {
                category: this.errorCategories.CALCULATION,
                timestamp: new Date().toISOString(),
                context: context,
                originalError: error
            };

            this._logError(errorInfo);

            let userMessage = '';
            let suggestions = [];
            const errorMessage = error.message || error.toString();

            if (errorMessage.includes('bilangan bulat') || errorMessage.includes('whole number')) {
                userMessage = 'Hasil transformasi harus berupa bilangan bulat.';
                suggestions = [
                    'Sesuaikan jumlah transformasi agar menghasilkan bilangan bulat',
                    'Periksa konfigurasi rasio konversi',
                    'Gunakan jumlah yang dapat dibagi habis'
                ];
            } else if (errorMessage.includes('overflow') || errorMessage.includes('terlalu besar')) {
                userMessage = 'Angka terlalu besar untuk diproses.';
                suggestions = [
                    'Kurangi jumlah transformasi',
                    'Lakukan transformasi dalam beberapa tahap'
                ];
            } else if (errorMessage.includes('pembagian') || errorMessage.includes('division')) {
                userMessage = 'Terjadi kesalahan dalam perhitungan pembagian.';
                suggestions = [
                    'Periksa rasio konversi',
                    'Pastikan tidak ada pembagian dengan nol'
                ];
            } else {
                userMessage = 'Terjadi kesalahan dalam perhitungan transformasi.';
                suggestions = [
                    'Periksa kembali angka yang dimasukkan',
                    'Coba dengan nilai yang lebih sederhana'
                ];
            }

            return {
                success: false,
                category: this.errorCategories.CALCULATION,
                message: userMessage,
                suggestions: suggestions,
                severity: 'error',
                timestamp: errorInfo.timestamp,
                canRetry: true
            };
        } catch (handlingError) {
            console.error('Error in handleCalculationError:', handlingError);
            return this._getFallbackErrorResponse('Terjadi kesalahan dalam perhitungan');
        }
    }

    /**
     * Display error message to user
     * @param {Object} errorResponse - Error response dari handler
     * @param {string} containerId - ID container untuk menampilkan error
     */
    displayErrorMessage(errorResponse, containerId = 'error-container') {
        this._ensureInitialized();
        
        try {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`Error container with ID '${containerId}' not found`);
                // Fallback: show alert
                alert(errorResponse.message);
                return;
            }

            // Clear previous messages
            container.innerHTML = '';

            // Create error message element
            const errorDiv = document.createElement('div');
            errorDiv.className = `alert alert-${errorResponse.severity === 'warning' ? 'warning' : 'danger'} alert-dismissible fade show`;
            
            let html = `
                <div class="d-flex align-items-start">
                    <i class="fas fa-${this._getErrorIcon(errorResponse.category)} me-2 mt-1"></i>
                    <div class="flex-grow-1">
                        <strong>${this._getCategoryDisplayName(errorResponse.category)}</strong>
                        <p class="mb-2">${errorResponse.message}</p>
            `;

            // Add suggestions if available
            if (errorResponse.suggestions && errorResponse.suggestions.length > 0) {
                html += `
                    <div class="mt-2">
                        <small class="text-muted">Saran perbaikan:</small>
                        <ul class="small mb-0 mt-1">
                `;
                errorResponse.suggestions.forEach(suggestion => {
                    html += `<li>${suggestion}</li>`;
                });
                html += `</ul></div>`;
            }

            // Add alternatives if available
            if (errorResponse.alternatives && errorResponse.alternatives.length > 0) {
                html += `
                    <div class="mt-2">
                        <small class="text-muted">Alternatif:</small>
                        <ul class="small mb-0 mt-1">
                `;
                errorResponse.alternatives.forEach(alternative => {
                    html += `<li>${alternative}</li>`;
                });
                html += `</ul></div>`;
            }

            // Add retry button if applicable
            if (errorResponse.canRetry) {
                html += `
                    <div class="mt-3">
                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="window.location.reload()">
                            <i class="fas fa-redo me-1"></i>Coba Lagi
                        </button>
                    </div>
                `;
            }

            html += `
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;

            errorDiv.innerHTML = html;
            container.appendChild(errorDiv);

            // Auto-hide after 10 seconds for warnings
            if (errorResponse.severity === 'warning') {
                setTimeout(() => {
                    if (errorDiv.parentNode) {
                        errorDiv.remove();
                    }
                }, 10000);
            }
        } catch (displayError) {
            console.error('Error displaying error message:', displayError);
            // Ultimate fallback
            alert(errorResponse.message);
        }
    }

    /**
     * Display success message to user
     * @param {string} message - Success message
     * @param {string} containerId - ID container untuk menampilkan message
     * @param {Object} details - Additional details to show
     */
    displaySuccessMessage(message, containerId = 'success-container', details = {}) {
        this._ensureInitialized();
        
        try {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`Success container with ID '${containerId}' not found`);
                return;
            }

            // Clear previous messages
            container.innerHTML = '';

            // Create success message element
            const successDiv = document.createElement('div');
            successDiv.className = 'alert alert-success alert-dismissible fade show';
            
            let html = `
                <div class="d-flex align-items-start">
                    <i class="fas fa-check-circle me-2 mt-1 text-success"></i>
                    <div class="flex-grow-1">
                        <strong>Berhasil!</strong>
                        <p class="mb-2">${message}</p>
            `;

            // Add details if available
            if (details && Object.keys(details).length > 0) {
                html += `<div class="mt-2"><small class="text-muted">Detail:</small><ul class="small mb-0 mt-1">`;
                Object.entries(details).forEach(([key, value]) => {
                    html += `<li><strong>${key}:</strong> ${value}</li>`;
                });
                html += `</ul></div>`;
            }

            html += `
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;

            successDiv.innerHTML = html;
            container.appendChild(successDiv);

            // Auto-hide after 5 seconds
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.remove();
                }
            }, 5000);
        } catch (displayError) {
            console.error('Error displaying success message:', displayError);
        }
    }

    /**
     * Get error log for debugging
     * @param {number} limit - Limit jumlah log yang dikembalikan
     * @returns {Array} Array of error logs
     */
    getErrorLog(limit = 50) {
        this._ensureInitialized();
        return this.errorLog.slice(-limit);
    }

    /**
     * Clear error log
     */
    clearErrorLog() {
        this._ensureInitialized();
        this.errorLog = [];
    }

    /**
     * Get error statistics
     * @returns {Object} Error statistics
     */
    getErrorStatistics() {
        this._ensureInitialized();
        
        const stats = {
            total: this.errorLog.length,
            byCategory: {},
            recent: this.errorLog.filter(log => {
                const logTime = new Date(log.timestamp);
                const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
                return logTime > oneHourAgo;
            }).length
        };

        // Count by category
        Object.values(this.errorCategories).forEach(category => {
            stats.byCategory[category] = this.errorLog.filter(log => log.category === category).length;
        });

        return stats;
    }

    // Private methods

    /**
     * Setup global error handling
     * @private
     */
    _setupGlobalErrorHandling() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleSystemError(new Error(event.reason), { source: 'unhandledrejection' });
        });

        // Handle global errors
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleSystemError(event.error, { source: 'global', filename: event.filename, lineno: event.lineno });
        });
    }

    /**
     * Log error untuk debugging
     * @param {Object} errorInfo - Error information
     * @private
     */
    _logError(errorInfo) {
        this.errorLog.push(errorInfo);
        
        // Keep only last 1000 errors to prevent memory issues
        if (this.errorLog.length > 1000) {
            this.errorLog = this.errorLog.slice(-1000);
        }

        // Log to console for development
        console.error(`[${errorInfo.category.toUpperCase()}] ${errorInfo.timestamp}:`, errorInfo.originalError);
    }

    /**
     * Generate unique error ID
     * @returns {string} Unique error ID
     * @private
     */
    _generateErrorId() {
        return 'ERR-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get fallback error response
     * @param {string} message - Fallback message
     * @returns {Object} Fallback error response
     * @private
     */
    _getFallbackErrorResponse(message) {
        return {
            success: false,
            category: 'unknown',
            message: message,
            suggestions: ['Refresh halaman dan coba lagi', 'Hubungi administrator jika masalah berlanjut'],
            severity: 'error',
            timestamp: new Date().toISOString(),
            canRetry: true
        };
    }

    /**
     * Translate validation error to user-friendly message
     * @param {string} errorMessage - Original error message
     * @returns {string} User-friendly message
     * @private
     */
    _translateValidationError(errorMessage) {
        const translations = {
            'required': 'Field ini wajib diisi',
            'invalid': 'Data tidak valid',
            'not found': 'Data tidak ditemukan',
            'mismatch': 'Data tidak cocok',
            'insufficient': 'Tidak mencukupi',
            'negative': 'Tidak boleh negatif',
            'zero': 'Tidak boleh nol'
        };

        for (const [key, translation] of Object.entries(translations)) {
            if (errorMessage.toLowerCase().includes(key)) {
                return translation;
            }
        }

        return errorMessage;
    }

    /**
     * Get validation suggestions based on error messages
     * @param {Array} errors - Array of error messages
     * @returns {Array} Array of suggestions
     * @private
     */
    _getValidationSuggestions(errors) {
        const suggestions = [];
        
        errors.forEach(error => {
            const lowerError = error.toLowerCase();
            
            if (lowerError.includes('stok')) {
                suggestions.push('Periksa ketersediaan stok terkini');
            }
            if (lowerError.includes('produk') || lowerError.includes('item')) {
                suggestions.push('Pastikan produk yang dipilih sudah benar');
            }
            if (lowerError.includes('quantity') || lowerError.includes('jumlah')) {
                suggestions.push('Masukkan jumlah yang valid (angka positif)');
            }
            if (lowerError.includes('rasio') || lowerError.includes('ratio')) {
                suggestions.push('Hubungi administrator untuk konfigurasi rasio konversi');
            }
        });

        // Remove duplicates
        return [...new Set(suggestions)];
    }

    /**
     * Get stock alternatives
     * @param {Object} context - Context information
     * @returns {Array} Array of alternatives
     * @private
     */
    _getStockAlternatives(context) {
        // This would be implemented based on actual business logic
        return [
            'Coba dengan jumlah yang lebih kecil',
            'Periksa item serupa yang memiliki stok'
        ];
    }

    /**
     * Get configured ratio alternatives
     * @param {Object} context - Context information
     * @returns {Array} Array of alternatives
     * @private
     */
    _getConfiguredRatioAlternatives(context) {
        // This would be implemented based on actual business logic
        return [
            'Pilih kombinasi unit yang sudah dikonfigurasi',
            'Hubungi administrator untuk menambah konfigurasi'
        ];
    }

    /**
     * Get product alternatives
     * @param {Object} context - Context information
     * @returns {Array} Array of alternatives
     * @private
     */
    _getProductAlternatives(context) {
        // This would be implemented based on actual business logic
        return [
            'Pilih produk yang sama dengan unit berbeda',
            'Periksa daftar produk yang dapat ditransformasi'
        ];
    }

    /**
     * Get error icon based on category
     * @param {string} category - Error category
     * @returns {string} Font Awesome icon class
     * @private
     */
    _getErrorIcon(category) {
        const icons = {
            [this.errorCategories.VALIDATION]: 'exclamation-triangle',
            [this.errorCategories.CALCULATION]: 'calculator',
            [this.errorCategories.SYSTEM]: 'cog',
            [this.errorCategories.BUSINESS_LOGIC]: 'business-time'
        };
        return icons[category] || 'exclamation-circle';
    }

    /**
     * Get category display name
     * @param {string} category - Error category
     * @returns {string} Display name
     * @private
     */
    _getCategoryDisplayName(category) {
        const names = {
            [this.errorCategories.VALIDATION]: 'Kesalahan Validasi',
            [this.errorCategories.CALCULATION]: 'Kesalahan Perhitungan',
            [this.errorCategories.SYSTEM]: 'Kesalahan Sistem',
            [this.errorCategories.BUSINESS_LOGIC]: 'Kesalahan Aturan Bisnis'
        };
        return names[category] || 'Kesalahan';
    }

    /**
     * Ensure ErrorHandler is initialized
     * @private
     */
    _ensureInitialized() {
        if (!this.initialized) {
            throw new Error('ErrorHandler belum diinisialisasi. Panggil initialize() terlebih dahulu.');
        }
    }
}

// Export untuk browser dan Node.js
if (typeof window !== 'undefined') {
    window.ErrorHandler = ErrorHandler;
}

// ES6 module export
export default ErrorHandler;
export { ErrorHandler };