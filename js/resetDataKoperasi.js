/**
 * Reset Data Koperasi Module
 * Handles complete data reset functionality for reusing the application with different cooperatives
 */

// ============================================================================
// Type Definitions (JSDoc)
// ============================================================================

/**
 * @typedef {Object} ResetRequest
 * @property {'full'|'selective'} type - Reset type
 * @property {string[]} categories - Categories to reset (empty for full)
 * @property {boolean} createBackup - Create backup before reset
 * @property {boolean} testMode - Dry-run mode
 * @property {string} userId - User performing reset
 * @property {string} timestamp - ISO 8601 timestamp
 * @property {string} [reason] - Optional reason for reset
 */

/**
 * @typedef {Object} CategoryInfo
 * @property {string} key - localStorage key prefix
 * @property {string} label - Display name
 * @property {string} group - Category group
 * @property {number} count - Number of records
 * @property {number} size - Size in bytes
 * @property {string[]} dependencies - Dependent categories
 * @property {boolean} protected - Cannot be deleted
 */

/**
 * @typedef {Object} ResetResult
 * @property {boolean} success - Operation success status
 * @property {string} message - Result message
 * @property {Object} deleted - Deletion details
 * @property {string[]} deleted.categories - Deleted categories
 * @property {number} deleted.recordCount - Total records deleted
 * @property {number} deleted.totalSize - Total size deleted
 * @property {Object} backup - Backup details
 * @property {boolean} backup.created - Backup creation status
 * @property {string} backup.filename - Backup filename
 * @property {number} backup.size - Backup size
 * @property {string[]} errors - Error messages
 * @property {string[]} warnings - Warning messages
 * @property {number} duration - Duration in milliseconds
 * @property {string} timestamp - ISO 8601 timestamp
 */

/**
 * @typedef {Object} SetupStep
 * @property {string} id - Step identifier
 * @property {string} title - Step title
 * @property {string} description - Step description
 * @property {string} route - Navigation route
 * @property {boolean} required - Is required step
 * @property {boolean} completed - Is completed
 * @property {number} order - Display order
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Validation status
 * @property {string[]} errors - Error messages
 * @property {string[]} warnings - Warning messages
 */

/**
 * @typedef {Object} DryRunResult
 * @property {boolean} success - Simulation success
 * @property {string} message - Result message
 * @property {Object} simulation - Simulation details
 * @property {string[]} simulation.categories - Categories that would be deleted
 * @property {number} simulation.recordCount - Records that would be deleted
 * @property {number} simulation.totalSize - Size that would be freed
 * @property {string[]} simulation.keysToDelete - Specific keys that would be deleted
 * @property {string[]} simulation.log - Detailed operation log
 */

/**
 * @callback ProgressCallback
 * @param {number} progress - Progress percentage (0-100)
 * @param {string} currentCategory - Current category being processed
 * @param {number} processedCount - Number of categories processed
 * @param {number} totalCount - Total categories to process
 */

// ============================================================================
// Constants
// ============================================================================

const RESET_CONSTANTS = {
    CONFIRMATION_TEXT: 'HAPUS SEMUA DATA',
    SESSION_KEY: 'currentUser',
    RESET_FLAG_KEY: 'systemResetPerformed',
    TEST_MODE_KEY: 'resetTestMode',
    RATE_LIMIT_KEY: 'resetRateLimit',
    COOLDOWN_PERIOD: 5 * 60 * 1000, // 5 minutes in milliseconds
    SETUP_WIZARD_KEY: 'setupWizardState'
};

// ============================================================================
// CategoryManager Class
// ============================================================================

class CategoryManager {
    constructor() {
        this.categoryDefinitions = this._initializeCategoryDefinitions();
    }

    /**
     * Initialize category definitions with groups and keys
     * @private
     * @returns {Object} Category definitions
     */
    _initializeCategoryDefinitions() {
        return {
            // Master Data Group
            masterData: {
                label: 'Master Data',
                categories: [
                    {
                        key: 'anggota',
                        label: 'Data Anggota',
                        keys: ['anggota'],
                        dependencies: []
                    },
                    {
                        key: 'departemen',
                        label: 'Departemen',
                        keys: ['departemen'],
                        dependencies: []
                    },
                    {
                        key: 'users',
                        label: 'Pengguna',
                        keys: ['users'],
                        dependencies: [],
                        protected: true // Don't delete current session
                    },
                    {
                        key: 'barang',
                        label: 'Data Barang',
                        keys: ['barang'],
                        dependencies: []
                    },
                    {
                        key: 'supplier',
                        label: 'Data Supplier',
                        keys: ['supplier'],
                        dependencies: []
                    },
                    {
                        key: 'kategori',
                        label: 'Kategori Barang',
                        keys: ['kategori'],
                        dependencies: []
                    },
                    {
                        key: 'satuan',
                        label: 'Satuan Barang',
                        keys: ['satuan'],
                        dependencies: []
                    }
                ]
            },
            // Transaction Data Group
            transactionData: {
                label: 'Data Transaksi',
                categories: [
                    {
                        key: 'simpananPokok',
                        label: 'Simpanan Pokok',
                        keys: ['simpananPokok'],
                        dependencies: ['anggota']
                    },
                    {
                        key: 'simpananWajib',
                        label: 'Simpanan Wajib',
                        keys: ['simpananWajib'],
                        dependencies: ['anggota']
                    },
                    {
                        key: 'simpananSukarela',
                        label: 'Simpanan Sukarela',
                        keys: ['simpananSukarela'],
                        dependencies: ['anggota']
                    },
                    {
                        key: 'pinjaman',
                        label: 'Pinjaman',
                        keys: ['pinjaman'],
                        dependencies: ['anggota']
                    },
                    {
                        key: 'penjualan',
                        label: 'Transaksi POS/Penjualan',
                        keys: ['penjualan', 'tutupKasir', 'pengajuanModal'],
                        dependencies: ['barang']
                    },
                    {
                        key: 'pembelian',
                        label: 'Pembelian',
                        keys: ['pembelian'],
                        dependencies: ['barang', 'supplier']
                    },
                    {
                        key: 'jurnal',
                        label: 'Jurnal Akuntansi',
                        keys: ['jurnal'],
                        dependencies: ['coa']
                    }
                ]
            },
            // System Settings Group
            systemSettings: {
                label: 'Pengaturan Sistem',
                categories: [
                    {
                        key: 'koperasi',
                        label: 'Data Koperasi',
                        keys: ['koperasi'],
                        dependencies: []
                    },
                    {
                        key: 'coa',
                        label: 'Chart of Accounts',
                        keys: ['coa'],
                        dependencies: []
                    },
                    {
                        key: 'periodeAkuntansi',
                        label: 'Periode Akuntansi',
                        keys: ['periodeAktif', 'saldoAwalPeriode'],
                        dependencies: []
                    },
                    {
                        key: 'pengaturan',
                        label: 'Pengaturan Aplikasi',
                        keys: ['pengajuanModalSettings', 'batasKreditSettings'],
                        dependencies: []
                    }
                ]
            }
        };
    }

    /**
     * Get all categories with current counts and sizes
     * @returns {CategoryInfo[]} Array of category information
     */
    getAllCategories() {
        const categories = [];

        Object.entries(this.categoryDefinitions).forEach(([groupKey, group]) => {
            group.categories.forEach(cat => {
                const count = this._getRecordCount(cat.keys);
                const size = this._calculateSize(cat.keys);

                categories.push({
                    key: cat.key,
                    label: cat.label,
                    group: group.label,
                    count: count,
                    size: size,
                    dependencies: cat.dependencies || [],
                    protected: cat.protected || false
                });
            });
        });

        return categories;
    }

    /**
     * Get categories grouped by type
     * @returns {Object} Grouped categories
     */
    getCategoryGroups() {
        const groups = {};

        Object.entries(this.categoryDefinitions).forEach(([groupKey, group]) => {
            groups[groupKey] = {
                label: group.label,
                categories: group.categories.map(cat => {
                    const count = this._getRecordCount(cat.keys);
                    const size = this._calculateSize(cat.keys);

                    return {
                        key: cat.key,
                        label: cat.label,
                        count: count,
                        size: size,
                        dependencies: cat.dependencies || [],
                        protected: cat.protected || false
                    };
                })
            };
        });

        return groups;
    }

    /**
     * Get localStorage keys for a category
     * @param {string} categoryKey - Category key
     * @returns {string[]} Array of localStorage keys
     */
    getKeysForCategory(categoryKey) {
        for (const group of Object.values(this.categoryDefinitions)) {
            const category = group.categories.find(cat => cat.key === categoryKey);
            if (category) {
                return category.keys;
            }
        }
        return [];
    }

    /**
     * Calculate total size for categories
     * @param {string[]} categoryKeys - Array of category keys
     * @returns {number} Total size in bytes
     */
    calculateSize(categoryKeys) {
        let totalSize = 0;

        categoryKeys.forEach(catKey => {
            const keys = this.getKeysForCategory(catKey);
            totalSize += this._calculateSize(keys);
        });

        return totalSize;
    }

    /**
     * Get dependencies for a category
     * @param {string} categoryKey - Category key
     * @returns {string[]} Array of dependent category keys
     */
    getDependencies(categoryKey) {
        for (const group of Object.values(this.categoryDefinitions)) {
            const category = group.categories.find(cat => cat.key === categoryKey);
            if (category) {
                return category.dependencies || [];
            }
        }
        return [];
    }

    /**
     * Get record count for localStorage keys
     * @private
     * @param {string[]} keys - Array of localStorage keys
     * @returns {number} Total record count
     */
    _getRecordCount(keys) {
        let count = 0;

        keys.forEach(key => {
            try {
                const data = localStorage.getItem(key);
                if (data) {
                    const parsed = JSON.parse(data);
                    if (Array.isArray(parsed)) {
                        count += parsed.length;
                    } else if (typeof parsed === 'object' && parsed !== null) {
                        count += 1;
                    }
                }
            } catch (e) {
                // Ignore parse errors
            }
        });

        return count;
    }

    /**
     * Calculate size for localStorage keys
     * @private
     * @param {string[]} keys - Array of localStorage keys
     * @returns {number} Total size in bytes
     */
    _calculateSize(keys) {
        let size = 0;

        keys.forEach(key => {
            const data = localStorage.getItem(key);
            if (data) {
                size += new Blob([data]).size;
            }
        });

        return size;
    }
}


// ============================================================================
// ResetValidationService Class
// ============================================================================

class ResetValidationService {
    /**
     * Validate user permissions
     * @param {Object} user - Current user object
     * @returns {boolean} Has permission
     */
    validatePermissions(user) {
        if (!user) {
            return false;
        }
        // Only super_admin can perform reset
        return user.role === 'super_admin' || user.role === 'administrator';
    }

    /**
     * Validate category selection
     * @param {string[]} categories - Selected categories
     * @returns {ValidationResult} Validation result
     */
    validateCategorySelection(categories) {
        const errors = [];
        const warnings = [];

        if (!categories || categories.length === 0) {
            errors.push('Pilih minimal satu kategori untuk direset');
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Check for data dependencies
     * @param {string[]} categories - Categories to reset
     * @param {CategoryManager} categoryManager - Category manager instance
     * @returns {ValidationResult} Dependency check result
     */
    checkDependencies(categories, categoryManager) {
        const errors = [];
        const warnings = [];

        // Get all categories
        const allCategories = categoryManager.getAllCategories();

        // Check if any non-selected category depends on selected categories
        allCategories.forEach(cat => {
            if (!categories.includes(cat.key)) {
                // This category is NOT being deleted
                // Check if it depends on any category that IS being deleted
                const dependsOnDeleted = cat.dependencies.some(dep => categories.includes(dep));
                if (dependsOnDeleted) {
                    warnings.push(
                        `Kategori "${cat.label}" bergantung pada data yang akan dihapus. ` +
                        `Pertimbangkan untuk menghapus kategori ini juga.`
                    );
                }
            }
        });

        return {
            valid: true, // Dependencies are warnings, not errors
            errors,
            warnings
        };
    }

    /**
     * Validate confirmation input
     * @param {string} input - User input
     * @param {string} expected - Expected confirmation text
     * @returns {boolean} Is valid
     */
    validateConfirmation(input, expected) {
        return input === expected;
    }
}

// ============================================================================
// ResetService Class
// ============================================================================

class ResetService {
    constructor() {
        this.categoryManager = new CategoryManager();
        this.backupService = new BackupService();
        this.auditLogger = typeof auditLogger !== 'undefined' ? auditLogger : null;
        this.validationService = new ResetValidationService();
    }

    /**
     * Get available categories for reset
     * @returns {CategoryInfo[]} Array of categories
     */
    getAvailableCategories() {
        return this.categoryManager.getAllCategories();
    }

    /**
     * Validate reset request
     * @param {ResetRequest} request - Reset request object
     * @returns {ValidationResult} Validation result
     */
    validateResetRequest(request) {
        const errors = [];
        const warnings = [];

        // Validate user permissions
        const currentUser = this._getCurrentUser();
        if (!this.validationService.validatePermissions(currentUser)) {
            errors.push('Anda tidak memiliki izin untuk melakukan reset data');
        }

        // Validate category selection for selective reset
        if (request.type === 'selective') {
            const categoryValidation = this.validationService.validateCategorySelection(request.categories);
            errors.push(...categoryValidation.errors);
            warnings.push(...categoryValidation.warnings);

            // Check dependencies
            if (request.categories && request.categories.length > 0) {
                const depCheck = this.validationService.checkDependencies(
                    request.categories,
                    this.categoryManager
                );
                warnings.push(...depCheck.warnings);
            }
        }

        // Check rate limiting
        const rateLimitCheck = this._checkRateLimit(currentUser);
        if (!rateLimitCheck.allowed) {
            errors.push(rateLimitCheck.message);
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Execute reset operation
     * @param {ResetRequest} request - Reset request object
     * @param {ProgressCallback} onProgress - Progress callback function
     * @returns {Promise<ResetResult>} Reset result
     */
    async executeReset(request, onProgress) {
        const startTime = Date.now();
        const result = {
            success: false,
            message: '',
            deleted: {
                categories: [],
                recordCount: 0,
                totalSize: 0
            },
            backup: {
                created: false,
                filename: '',
                size: 0
            },
            errors: [],
            warnings: [],
            duration: 0,
            timestamp: new Date().toISOString()
        };

        try {
            // Validate request
            const validation = this.validateResetRequest(request);
            if (!validation.valid) {
                result.errors = validation.errors;
                result.message = 'Validasi gagal: ' + validation.errors.join(', ');
                return result;
            }
            result.warnings = validation.warnings;

            // Log reset start
            this._logAuditStart(request);

            // Step 1: Create backup
            if (onProgress) onProgress(10, 'Membuat backup...', 0, 1);

            const backupResult = await this._createBackup();
            if (!backupResult.success) {
                result.errors.push('Gagal membuat backup: ' + backupResult.error);
                result.message = 'Reset dibatalkan karena backup gagal';
                this._logAuditEnd(request, result, Date.now() - startTime);
                return result;
            }

            result.backup = backupResult;

            // Step 2: Determine categories to delete
            const categoriesToDelete = request.type === 'full'
                ? this.categoryManager.getAllCategories().map(c => c.key)
                : request.categories;

            // Step 3: Delete data
            const deleteResult = await this._deleteCategories(
                categoriesToDelete,
                onProgress,
                request.testMode
            );

            result.deleted = deleteResult;
            result.success = deleteResult.success;

            if (deleteResult.success) {
                result.message = `Reset berhasil. ${deleteResult.recordCount} record dihapus dari ${deleteResult.categories.length} kategori.`;

                // Mark system as reset
                this._markSystemReset();

                // Update rate limit
                this._updateRateLimit();
            } else {
                result.message = 'Reset gagal: ' + deleteResult.errors.join(', ');
                result.errors = deleteResult.errors;
            }

        } catch (error) {
            result.success = false;
            result.errors.push('Error tidak terduga: ' + error.message);
            result.message = 'Reset gagal karena error';
            console.error('Reset error:', error);
        }

        // Calculate duration
        result.duration = Date.now() - startTime;

        // Log completion
        this._logAuditEnd(request, result, result.duration);

        if (onProgress) onProgress(100, 'Selesai', 1, 1);

        return result;
    }

    /**
     * Perform dry-run reset (test mode)
     * @param {ResetRequest} request - Reset request object
     * @returns {DryRunResult} Simulation result
     */
    performDryRun(request) {
        const result = {
            success: true,
            message: '',
            simulation: {
                categories: [],
                recordCount: 0,
                totalSize: 0,
                keysToDelete: [],
                log: []
            }
        };

        try {
            // Determine categories
            const categoriesToDelete = request.type === 'full'
                ? this.categoryManager.getAllCategories().map(c => c.key)
                : request.categories;

            result.simulation.categories = categoriesToDelete;
            result.simulation.log.push(`[DRY RUN] Simulasi reset untuk ${categoriesToDelete.length} kategori`);

            // Calculate what would be deleted
            categoriesToDelete.forEach(catKey => {
                const keys = this.categoryManager.getKeysForCategory(catKey);
                const category = this.categoryManager.getAllCategories().find(c => c.key === catKey);

                if (category) {
                    result.simulation.recordCount += category.count;
                    result.simulation.totalSize += category.size;
                    result.simulation.keysToDelete.push(...keys);

                    result.simulation.log.push(
                        `[DRY RUN] Kategori: ${category.label} - ${category.count} records, ${this._formatSize(category.size)}`
                    );
                }
            });

            result.message = `Simulasi selesai. ${result.simulation.recordCount} records akan dihapus.`;
            result.simulation.log.push(`[DRY RUN] Total: ${result.simulation.recordCount} records, ${this._formatSize(result.simulation.totalSize)}`);
            result.simulation.log.push('[DRY RUN] Tidak ada data yang benar-benar dihapus dalam mode test');

        } catch (error) {
            result.success = false;
            result.message = 'Simulasi gagal: ' + error.message;
            console.error('Dry run error:', error);
        }

        return result;
    }

    /**
     * Verify reset completion
     * @param {string[]} categories - Categories that were reset
     * @returns {ValidationResult} Verification result
     */
    verifyResetCompletion(categories) {
        const errors = [];
        const warnings = [];

        categories.forEach(catKey => {
            const keys = this.categoryManager.getKeysForCategory(catKey);

            keys.forEach(key => {
                // Skip session key
                if (key === RESET_CONSTANTS.SESSION_KEY) {
                    return;
                }

                const data = localStorage.getItem(key);
                if (data !== null) {
                    errors.push(`Key "${key}" masih ada setelah reset`);
                }
            });
        });

        // Verify session still exists
        const session = localStorage.getItem(RESET_CONSTANTS.SESSION_KEY);
        if (!session) {
            warnings.push('Session user hilang setelah reset');
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    /**
     * Create backup before reset
     * @private
     * @returns {Promise<Object>} Backup result
     */
    async _createBackup() {
        try {
            const backupData = this.backupService.createBackup({ type: 'full' });

            if (!backupData || !backupData.metadata) {
                throw new Error('Gagal membuat struktur backup');
            }

            // Add reset metadata
            backupData.metadata.backupType = 'pre-reset';
            backupData.metadata.resetTimestamp = new Date().toISOString();

            // Download backup
            this.backupService.downloadBackup(backupData);

            // Log backup creation
            if (this.auditLogger) {
                this.auditLogger.logOperation(
                    'BACKUP_CREATED',
                    'reset',
                    'pre-reset',
                    {
                        filename: `backup_pre-reset_${backupData.metadata.koperasiName}_${new Date().toISOString()}`,
                        size: backupData.metadata.size
                    }
                );
            }

            return {
                success: true,
                created: true,
                filename: `backup_pre-reset_${backupData.metadata.koperasiName}`,
                size: backupData.metadata.size
            };

        } catch (error) {
            console.error('Backup creation error:', error);
            return {
                success: false,
                created: false,
                filename: '',
                size: 0,
                error: error.message
            };
        }
    }

    /**
     * Delete categories
     * @private
     * @param {string[]} categories - Categories to delete
     * @param {ProgressCallback} onProgress - Progress callback
     * @param {boolean} testMode - Test mode flag
     * @returns {Promise<Object>} Delete result
     */
    async _deleteCategories(categories, onProgress, testMode = false) {
        const result = {
            success: true,
            categories: [],
            recordCount: 0,
            totalSize: 0,
            errors: []
        };

        const totalCategories = categories.length;
        let processedCategories = 0;

        for (const catKey of categories) {
            try {
                const category = this.categoryManager.getAllCategories().find(c => c.key === catKey);
                if (!category) {
                    result.errors.push(`Kategori "${catKey}" tidak ditemukan`);
                    continue;
                }

                // Update progress
                if (onProgress) {
                    const progress = 10 + Math.floor((processedCategories / totalCategories) * 80);
                    onProgress(progress, `Menghapus ${category.label}...`, processedCategories, totalCategories);
                }

                // Get keys for this category
                const keys = this.categoryManager.getKeysForCategory(catKey);

                // Delete keys (skip in test mode)
                if (!testMode) {
                    keys.forEach(key => {
                        // Never delete current session
                        if (key === RESET_CONSTANTS.SESSION_KEY) {
                            return;
                        }

                        try {
                            localStorage.removeItem(key);
                        } catch (e) {
                            result.errors.push(`Gagal menghapus key "${key}": ${e.message}`);
                        }
                    });
                }

                // Log deletion
                if (this.auditLogger && !testMode) {
                    this.auditLogger.logOperation(
                        'CATEGORY_DELETED',
                        'reset',
                        catKey,
                        {
                            label: category.label,
                            recordCount: category.count,
                            size: category.size
                        }
                    );
                }

                result.categories.push(catKey);
                result.recordCount += category.count;
                result.totalSize += category.size;

                processedCategories++;

                // Small delay to allow UI updates
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                result.success = false;
                result.errors.push(`Error menghapus kategori "${catKey}": ${error.message}`);
                console.error(`Delete category error (${catKey}):`, error);
                break; // Stop on first error
            }
        }

        // Verify deletion (skip in test mode)
        if (!testMode && result.success) {
            const verification = this.verifyResetCompletion(result.categories);
            if (!verification.valid) {
                result.errors.push(...verification.errors);
                result.success = false;
            }
        }

        return result;
    }

    /**
     * Get current user
     * @private
     * @returns {Object|null} Current user
     */
    _getCurrentUser() {
        try {
            const userData = localStorage.getItem(RESET_CONSTANTS.SESSION_KEY);
            return userData ? JSON.parse(userData) : null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Check rate limiting
     * @private
     * @param {Object} user - Current user
     * @returns {Object} Rate limit check result
     */
    _checkRateLimit(user) {
        if (!user) {
            return { allowed: false, message: 'User tidak valid' };
        }

        try {
            const rateLimitData = localStorage.getItem(RESET_CONSTANTS.RATE_LIMIT_KEY);
            if (!rateLimitData) {
                return { allowed: true };
            }

            const rateLimit = JSON.parse(rateLimitData);
            const lastReset = rateLimit[user.username];

            if (lastReset) {
                const timeSinceLastReset = Date.now() - lastReset;
                if (timeSinceLastReset < RESET_CONSTANTS.COOLDOWN_PERIOD) {
                    const remainingTime = Math.ceil((RESET_CONSTANTS.COOLDOWN_PERIOD - timeSinceLastReset) / 1000 / 60);
                    return {
                        allowed: false,
                        message: `Tunggu ${remainingTime} menit sebelum melakukan reset lagi`
                    };
                }
            }

            return { allowed: true };

        } catch (e) {
            console.error('Rate limit check error:', e);
            return { allowed: true }; // Allow on error
        }
    }

    /**
     * Update rate limit
     * @private
     */
    _updateRateLimit() {
        const user = this._getCurrentUser();
        if (!user) return;

        try {
            let rateLimit = {};
            const rateLimitData = localStorage.getItem(RESET_CONSTANTS.RATE_LIMIT_KEY);
            if (rateLimitData) {
                rateLimit = JSON.parse(rateLimitData);
            }

            rateLimit[user.username] = Date.now();
            localStorage.setItem(RESET_CONSTANTS.RATE_LIMIT_KEY, JSON.stringify(rateLimit));

        } catch (e) {
            console.error('Update rate limit error:', e);
        }
    }

    /**
     * Mark system as reset
     * @private
     */
    _markSystemReset() {
        try {
            localStorage.setItem(RESET_CONSTANTS.RESET_FLAG_KEY, new Date().toISOString());
        } catch (e) {
            console.error('Mark system reset error:', e);
        }
    }

    /**
     * Log audit start
     * @private
     * @param {ResetRequest} request - Reset request
     */
    _logAuditStart(request) {
        if (!this.auditLogger) return;

        try {
            this.auditLogger.logOperation(
                'RESET_STARTED',
                'reset',
                request.type,
                {
                    type: request.type,
                    categories: request.categories || [],
                    testMode: request.testMode || false,
                    timestamp: request.timestamp
                }
            );
        } catch (e) {
            console.error('Audit log start error:', e);
        }
    }

    /**
     * Log audit end
     * @private
     * @param {ResetRequest} request - Reset request
     * @param {ResetResult} result - Reset result
     * @param {number} duration - Duration in ms
     */
    _logAuditEnd(request, result, duration) {
        if (!this.auditLogger) return;

        try {
            this.auditLogger.logOperation(
                result.success ? 'RESET_COMPLETED' : 'RESET_FAILED',
                'reset',
                request.type,
                {
                    success: result.success,
                    categoriesDeleted: result.deleted.categories,
                    recordCount: result.deleted.recordCount,
                    totalSize: result.deleted.totalSize,
                    backupCreated: result.backup.created,
                    backupFilename: result.backup.filename,
                    duration: duration,
                    errors: result.errors,
                    warnings: result.warnings
                }
            );
        } catch (e) {
            console.error('Audit log end error:', e);
        }
    }

    /**
     * Format size in bytes to human readable
     * @private
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size
     */
    _formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
}


// ============================================================================
// SetupWizardService Class
// ============================================================================

class SetupWizardService {
    constructor() {
        this.setupSteps = this._initializeSetupSteps();
    }

    /**
     * Initialize setup steps
     * @private
     * @returns {SetupStep[]} Array of setup steps
     */
    _initializeSetupSteps() {
        return [
            {
                id: 'koperasi',
                title: 'Data Koperasi',
                description: 'Atur nama, alamat, dan informasi dasar koperasi',
                route: '#',
                required: true,
                completed: false,
                order: 1
            },
            {
                id: 'periodeAkuntansi',
                title: 'Periode Akuntansi',
                description: 'Tentukan periode akuntansi aktif',
                route: '#',
                required: true,
                completed: false,
                order: 2
            },
            {
                id: 'coa',
                title: 'Chart of Accounts',
                description: 'Setup akun-akun akuntansi dasar',
                route: '#',
                required: true,
                completed: false,
                order: 3
            },
            {
                id: 'users',
                title: 'Pengguna',
                description: 'Buat akun pengguna untuk administrator dan staff',
                route: '#',
                required: true,
                completed: false,
                order: 4
            },
            {
                id: 'departemen',
                title: 'Departemen',
                description: 'Buat departemen untuk organisasi koperasi',
                route: '#',
                required: false,
                completed: false,
                order: 5
            },
            {
                id: 'anggota',
                title: 'Data Anggota',
                description: 'Input data anggota koperasi',
                route: '#',
                required: true,
                completed: false,
                order: 6
            }
        ];
    }

    /**
     * Get setup steps with current completion status
     * @returns {SetupStep[]} Array of setup steps
     */
    getSetupSteps() {
        const state = this._loadState();

        return this.setupSteps.map(step => ({
            ...step,
            completed: state.completedSteps.includes(step.id)
        }));
    }

    /**
     * Check if a step is completed
     * @param {string} stepId - Step identifier
     * @returns {boolean} Is completed
     */
    isStepCompleted(stepId) {
        const state = this._loadState();
        return state.completedSteps.includes(stepId);
    }

    /**
     * Mark step as completed
     * @param {string} stepId - Step identifier
     */
    completeStep(stepId) {
        const state = this._loadState();

        if (!state.completedSteps.includes(stepId)) {
            state.completedSteps.push(stepId);
            this._saveState(state);
        }
    }

    /**
     * Get setup progress
     * @returns {Object} Progress information
     */
    getProgress() {
        const steps = this.getSetupSteps();
        const requiredSteps = steps.filter(s => s.required);
        const completedRequired = requiredSteps.filter(s => s.completed);

        return {
            totalSteps: steps.length,
            completedSteps: steps.filter(s => s.completed).length,
            requiredSteps: requiredSteps.length,
            completedRequired: completedRequired.length,
            percentage: Math.floor((completedRequired.length / requiredSteps.length) * 100),
            isComplete: completedRequired.length === requiredSteps.length
        };
    }

    /**
     * Reset setup wizard
     */
    resetWizard() {
        localStorage.removeItem(RESET_CONSTANTS.SETUP_WIZARD_KEY);
    }

    /**
     * Load wizard state
     * @private
     * @returns {Object} Wizard state
     */
    _loadState() {
        try {
            const stateData = localStorage.getItem(RESET_CONSTANTS.SETUP_WIZARD_KEY);
            if (stateData) {
                return JSON.parse(stateData);
            }
        } catch (e) {
            console.error('Load wizard state error:', e);
        }

        return {
            completedSteps: [],
            startedAt: new Date().toISOString()
        };
    }

    /**
     * Save wizard state
     * @private
     * @param {Object} state - Wizard state
     */
    _saveState(state) {
        try {
            localStorage.setItem(RESET_CONSTANTS.SETUP_WIZARD_KEY, JSON.stringify(state));
        } catch (e) {
            console.error('Save wizard state error:', e);
        }
    }
}

// ============================================================================
// Global Instances
// ============================================================================

// Create global instances for use in UI
if (typeof globalThis !== 'undefined') {
    globalThis.CategoryManager = CategoryManager;
    globalThis.ResetValidationService = ResetValidationService;
    globalThis.ResetService = ResetService;
    globalThis.SetupWizardService = SetupWizardService;
    globalThis.RESET_CONSTANTS = RESET_CONSTANTS;
}

// CommonJS exports
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CategoryManager,
        ResetValidationService,
        ResetService,
        SetupWizardService,
        RESET_CONSTANTS
    };
}

