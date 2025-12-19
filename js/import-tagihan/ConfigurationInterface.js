/**
 * Configuration Interface for Import Tagihan Pembayaran
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 * 
 * Provides admin interface for configuring import settings including:
 * - Maximum file size limits
 * - Maximum batch size limits  
 * - Enable/disable import feature toggle
 * - Configuration persistence and validation
 * - Admin authentication checks
 */

// Import SecurityValidator - conditional import for different environments
let SecurityValidator;
if (typeof require !== 'undefined') {
    // Node.js environment
    try {
        SecurityValidator = require('./SecurityValidator.js').SecurityValidator;
    } catch (e) {
        SecurityValidator = null;
    }
} else if (typeof window !== 'undefined') {
    // Browser environment
    SecurityValidator = window.SecurityValidator;
}

class ConfigurationInterface {
    constructor(auditLogger) {
        this.auditLogger = auditLogger;
        this.storageKey = 'importTagihanConfig';
        this.defaultConfig = {
            maxFileSize: 5 * 1024 * 1024, // 5MB in bytes
            maxBatchSize: 1000, // Maximum rows per batch
            importEnabled: true, // Feature enabled by default
            allowedFileTypes: ['csv', 'xlsx', 'xls'],
            previewRowLimit: 100 // Maximum rows to show in preview
        };
        
        // Initialize SecurityValidator for admin authentication
        // Requirements: 9.1 - Add authentication checks for admin features
        if (SecurityValidator) {
            this.securityValidator = new SecurityValidator();
        } else {
            console.warn('SecurityValidator not available, admin authentication checks disabled');
            this.securityValidator = null;
        }
        
        this.init();
    }

    /**
     * Initialize configuration interface
     * Requirements: 9.1
     */
    init() {
        // Ensure default configuration exists in localStorage
        const storedConfig = localStorage.getItem(this.storageKey);
        if (!storedConfig) {
            this.saveConfiguration(this.defaultConfig);
        }
    }

    /**
     * Get current configuration from localStorage
     * Requirements: 9.4
     * @returns {Object} Current configuration settings
     */
    getConfiguration() {
        try {
            const config = localStorage.getItem(this.storageKey);
            if (config) {
                const parsed = JSON.parse(config);
                // Merge with defaults to ensure all properties exist
                return { ...this.defaultConfig, ...parsed };
            }
            return this.defaultConfig;
        } catch (error) {
            console.error('Error loading configuration:', error);
            return this.defaultConfig;
        }
    }

    /**
     * Save configuration to localStorage with admin authentication
     * Requirements: 9.1, 9.4, 9.5 - Add authentication checks for admin features
     * @param {Object} config - Configuration object to save
     * @param {Object} currentUser - Current user object for authentication
     * @returns {Object} Save result with success status and any errors
     */
    saveConfiguration(config, currentUser = null) {
        try {
            // Admin authentication check
            // Requirements: 9.1 - Add authentication checks for admin features
            if (this.securityValidator && currentUser) {
                const authResult = this.securityValidator.validateAdminAuthentication(
                    currentUser, 
                    'admin', 
                    'import_config'
                );
                
                if (!authResult.isAuthorized) {
                    return {
                        success: false,
                        error: `Authentication failed: ${authResult.errors.join('; ')}`,
                        requiresAuth: true
                    };
                }
                
                // Log security warnings if any
                if (authResult.warnings.length > 0) {
                    console.warn('Admin authentication warnings:', authResult.warnings);
                }
            }

            // Validate configuration before saving
            const validationResult = this.validateConfiguration(config);
            if (!validationResult.valid) {
                return {
                    success: false,
                    error: `Invalid configuration: ${validationResult.error}`,
                    requiresAuth: false
                };
            }

            // Get old configuration for audit logging
            const oldConfig = this.getConfiguration();

            // Add timestamp and user info to configuration
            const configWithMetadata = {
                ...config,
                lastModified: new Date().toISOString(),
                lastModifiedBy: currentUser?.nama || 'Unknown User',
                lastModifiedById: currentUser?.id || 'unknown'
            };

            // Save to localStorage
            localStorage.setItem(this.storageKey, JSON.stringify(configWithMetadata));

            // Log configuration change with security audit
            if (this.auditLogger) {
                const auditLog = this.securityValidator ? 
                    this.securityValidator.generateSecurityAuditLog(
                        'configuration_change',
                        currentUser,
                        { isSecure: true, riskLevel: 'low', warnings: [] }
                    ) : null;
                    
                this.auditLogger.logConfigurationChange(
                    currentUser?.nama || 'Unknown User', 
                    config, 
                    oldConfig,
                    auditLog
                );
            }

            return {
                success: true,
                message: 'Configuration saved successfully'
            };
        } catch (error) {
            console.error('Error saving configuration:', error);
            return {
                success: false,
                error: `Save failed: ${error.message}`,
                requiresAuth: false
            };
        }
    }

    /**
     * Validate configuration object
     * Requirements: 9.1, 9.2, 9.3
     * @param {Object} config - Configuration to validate
     * @returns {Object} Validation result with valid flag and error message
     */
    validateConfiguration(config) {
        try {
            // Check required properties
            const requiredProps = ['maxFileSize', 'maxBatchSize', 'importEnabled'];
            for (const prop of requiredProps) {
                if (!(prop in config)) {
                    return { valid: false, error: `Missing required property: ${prop}` };
                }
            }

            // Validate maxFileSize (must be positive number, max 50MB)
            if (typeof config.maxFileSize !== 'number' || config.maxFileSize <= 0) {
                return { valid: false, error: 'maxFileSize must be a positive number' };
            }
            if (config.maxFileSize > 50 * 1024 * 1024) {
                return { valid: false, error: 'maxFileSize cannot exceed 50MB' };
            }

            // Validate maxBatchSize (must be positive number, max 10000)
            if (typeof config.maxBatchSize !== 'number' || config.maxBatchSize <= 0) {
                return { valid: false, error: 'maxBatchSize must be a positive number' };
            }
            if (config.maxBatchSize > 10000) {
                return { valid: false, error: 'maxBatchSize cannot exceed 10000 rows' };
            }

            // Validate importEnabled (must be boolean)
            if (typeof config.importEnabled !== 'boolean') {
                return { valid: false, error: 'importEnabled must be a boolean value' };
            }

            // Validate allowedFileTypes if present
            if (config.allowedFileTypes && !Array.isArray(config.allowedFileTypes)) {
                return { valid: false, error: 'allowedFileTypes must be an array' };
            }

            // Validate previewRowLimit if present
            if (config.previewRowLimit && (typeof config.previewRowLimit !== 'number' || config.previewRowLimit <= 0)) {
                return { valid: false, error: 'previewRowLimit must be a positive number' };
            }

            return { valid: true };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    /**
     * Render configuration interface HTML
     * Requirements: 9.1, 9.2, 9.3
     * @returns {string} HTML string for configuration interface
     */
    renderConfigurationInterface() {
        const config = this.getConfiguration();
        const maxFileSizeMB = Math.round(config.maxFileSize / (1024 * 1024));

        return `
            <div class="card mb-4">
                <div class="card-header" style="background: linear-gradient(135deg, #2d6a4f 0%, #52b788 100%); color: white;">
                    <i class="bi bi-upload me-2"></i>Konfigurasi Import Tagihan Pembayaran
                </div>
                <div class="card-body">
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle-fill me-2"></i>
                        <strong>Informasi:</strong> Pengaturan untuk fitur import tagihan pembayaran hutang piutang.
                        Perubahan akan diterapkan pada proses import berikutnya.
                    </div>

                    <form id="importConfigForm">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="importEnabled" class="form-label">
                                        <strong>Status Fitur Import</strong>
                                    </label>
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" id="importEnabled" 
                                               ${config.importEnabled ? 'checked' : ''}>
                                        <label class="form-check-label" for="importEnabled">
                                            ${config.importEnabled ? 'Aktif' : 'Nonaktif'}
                                        </label>
                                    </div>
                                    <small class="text-muted">
                                        Aktifkan atau nonaktifkan fitur import tagihan pembayaran
                                    </small>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="maxFileSize" class="form-label">
                                        <strong>Ukuran File Maksimum (MB)</strong>
                                    </label>
                                    <input type="number" class="form-control" id="maxFileSize" 
                                           value="${maxFileSizeMB}" min="1" max="50" step="1">
                                    <small class="text-muted">
                                        Batas maksimum ukuran file yang dapat diupload (1-50 MB)
                                    </small>
                                </div>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="maxBatchSize" class="form-label">
                                        <strong>Jumlah Maksimum Baris per Batch</strong>
                                    </label>
                                    <input type="number" class="form-control" id="maxBatchSize" 
                                           value="${config.maxBatchSize}" min="10" max="10000" step="10">
                                    <small class="text-muted">
                                        Batas maksimum jumlah baris yang dapat diproses dalam satu batch (10-10000)
                                    </small>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="previewRowLimit" class="form-label">
                                        <strong>Batas Tampilan Preview</strong>
                                    </label>
                                    <input type="number" class="form-control" id="previewRowLimit" 
                                           value="${config.previewRowLimit || 100}" min="10" max="500" step="10">
                                    <small class="text-muted">
                                        Jumlah maksimum baris yang ditampilkan dalam preview (10-500)
                                    </small>
                                </div>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">
                                <strong>Format File yang Didukung</strong>
                            </label>
                            <div class="form-control-plaintext">
                                <span class="badge bg-primary me-2">CSV</span>
                                <span class="badge bg-primary me-2">Excel (.xlsx)</span>
                                <span class="badge bg-primary">Excel (.xls)</span>
                            </div>
                            <small class="text-muted">
                                Format file yang dapat diupload untuk import
                            </small>
                        </div>

                        <hr>

                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <small class="text-muted">
                                    <i class="bi bi-clock me-1"></i>
                                    Terakhir diubah: ${this.getLastModified()}
                                </small>
                            </div>
                            <div>
                                <button type="button" class="btn btn-secondary me-2" id="resetConfigBtn">
                                    <i class="bi bi-arrow-clockwise me-1"></i>Reset ke Default
                                </button>
                                <button type="submit" class="btn btn-primary">
                                    <i class="bi bi-check-lg me-1"></i>Simpan Konfigurasi
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <div class="card">
                <div class="card-header" style="background: linear-gradient(135deg, #6c757d 0%, #adb5bd 100%); color: white;">
                    <i class="bi bi-info-circle me-2"></i>Informasi Konfigurasi
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4">
                            <div class="text-center p-3 border rounded">
                                <h5 class="text-primary">${maxFileSizeMB} MB</h5>
                                <small class="text-muted">Ukuran File Maksimum</small>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="text-center p-3 border rounded">
                                <h5 class="text-success">${config.maxBatchSize.toLocaleString()}</h5>
                                <small class="text-muted">Baris per Batch</small>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="text-center p-3 border rounded">
                                <h5 class="${config.importEnabled ? 'text-success' : 'text-danger'}">
                                    ${config.importEnabled ? 'AKTIF' : 'NONAKTIF'}
                                </h5>
                                <small class="text-muted">Status Import</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners to configuration form
     * Requirements: 9.4, 9.5
     */
    attachEventListeners() {
        const form = document.getElementById('importConfigForm');
        const resetBtn = document.getElementById('resetConfigBtn');
        const importEnabledToggle = document.getElementById('importEnabled');

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleConfigurationSave();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.handleConfigurationReset();
            });
        }

        if (importEnabledToggle) {
            importEnabledToggle.addEventListener('change', (e) => {
                const label = e.target.nextElementSibling;
                if (label) {
                    label.textContent = e.target.checked ? 'Aktif' : 'Nonaktif';
                }
            });
        }
    }

    /**
     * Handle configuration save
     * Requirements: 9.4, 9.5
     */
    handleConfigurationSave() {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            
            // Check admin permissions
            if (!this.isAdmin(currentUser)) {
                this.showAlert('Akses ditolak. Hanya admin yang dapat mengubah konfigurasi.', 'danger');
                return;
            }

            // Get form values
            const formData = {
                importEnabled: document.getElementById('importEnabled').checked,
                maxFileSize: parseInt(document.getElementById('maxFileSize').value) * 1024 * 1024, // Convert MB to bytes
                maxBatchSize: parseInt(document.getElementById('maxBatchSize').value),
                previewRowLimit: parseInt(document.getElementById('previewRowLimit').value),
                allowedFileTypes: this.defaultConfig.allowedFileTypes // Keep default file types
            };

            // Save configuration
            const success = this.saveConfiguration(formData, currentUser.username || currentUser.name);
            
            if (success) {
                this.showAlert('Konfigurasi berhasil disimpan!', 'success');
                // Refresh the interface to show updated values
                setTimeout(() => {
                    this.renderAndAttach();
                }, 1000);
            } else {
                this.showAlert('Gagal menyimpan konfigurasi. Silakan coba lagi.', 'danger');
            }
        } catch (error) {
            console.error('Error saving configuration:', error);
            this.showAlert('Terjadi kesalahan saat menyimpan konfigurasi.', 'danger');
        }
    }

    /**
     * Handle configuration reset to defaults
     * Requirements: 9.4
     */
    handleConfigurationReset() {
        if (confirm('Apakah Anda yakin ingin mereset konfigurasi ke pengaturan default?')) {
            try {
                const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                
                if (!this.isAdmin(currentUser)) {
                    this.showAlert('Akses ditolak. Hanya admin yang dapat mereset konfigurasi.', 'danger');
                    return;
                }

                const success = this.saveConfiguration(this.defaultConfig, currentUser.username || currentUser.name);
                
                if (success) {
                    this.showAlert('Konfigurasi berhasil direset ke pengaturan default!', 'success');
                    // Refresh the interface
                    setTimeout(() => {
                        this.renderAndAttach();
                    }, 1000);
                } else {
                    this.showAlert('Gagal mereset konfigurasi.', 'danger');
                }
            } catch (error) {
                console.error('Error resetting configuration:', error);
                this.showAlert('Terjadi kesalahan saat mereset konfigurasi.', 'danger');
            }
        }
    }

    /**
     * Check if user has admin permissions
     * Requirements: 9.1
     * @param {Object} user - User object
     * @returns {boolean} Whether user is admin
     */
    isAdmin(user) {
        const adminRoles = ['admin', 'super_admin', 'administrator'];
        return user && user.role && adminRoles.includes(user.role.toLowerCase());
    }

    /**
     * Get last modified timestamp
     * @returns {string} Formatted timestamp
     */
    getLastModified() {
        try {
            const config = localStorage.getItem(this.storageKey);
            if (config) {
                const parsed = JSON.parse(config);
                if (parsed.lastModified) {
                    return new Date(parsed.lastModified).toLocaleString('id-ID');
                }
            }
            return 'Belum pernah diubah';
        } catch (error) {
            return 'Tidak diketahui';
        }
    }

    /**
     * Show alert message
     * @param {string} message - Alert message
     * @param {string} type - Alert type (success, danger, warning, info)
     */
    showAlert(message, type = 'info') {
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Insert at top of main content
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.insertBefore(alertDiv, mainContent.firstChild);
            
            // Auto-dismiss after 5 seconds
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 5000);
        }
    }

    /**
     * Render configuration interface and attach event listeners
     * Requirements: 9.1
     */
    renderAndAttach() {
        const container = document.getElementById('importConfigContainer');
        if (container) {
            container.innerHTML = this.renderConfigurationInterface();
            this.attachEventListeners();
        }
    }

    /**
     * Check if import feature is enabled
     * Requirements: 9.3
     * @returns {boolean} Whether import is enabled
     */
    isImportEnabled() {
        const config = this.getConfiguration();
        return config.importEnabled === true;
    }

    /**
     * Get maximum file size in bytes
     * Requirements: 9.1
     * @returns {number} Maximum file size in bytes
     */
    getMaxFileSize() {
        const config = this.getConfiguration();
        return config.maxFileSize;
    }

    /**
     * Get maximum batch size
     * Requirements: 9.2
     * @returns {number} Maximum batch size
     */
    getMaxBatchSize() {
        const config = this.getConfiguration();
        return config.maxBatchSize;
    }
}

// ES6 export for modern environments
export { ConfigurationInterface };

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigurationInterface;
}