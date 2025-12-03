/**
 * Backup and Restore Module
 * Handles backup and restore operations for the koperasi application
 */

// ============================================================================
// Constants
// ============================================================================
const APP_VERSION = '1.0.0';

// ============================================================================
// RoleValidator Class (Shared)
// ============================================================================
class RoleValidator {
    /**
     * Check if user is admin or super admin
     * @param {Object} user - User object
     * @returns {boolean}
     */
    isAdmin(user) {
        return user && (user.role === 'administrator' || user.role === 'super_admin');
    }

    /**
     * Check if user is a super admin
     * @param {Object} user - User object
     * @returns {boolean}
     */
    isSuperAdmin(user) {
        if (!user) {
            return false;
        }
        // Support both 'super_admin' and 'administrator' for backward compatibility
        return user.role === 'super_admin' || user.role === 'administrator';
    }
}

// ============================================================================
// BackupValidationService Class
// ============================================================================
class BackupValidationService {
    /**
     * Get required localStorage keys
     * @returns {Array} List of required keys
     */
    getRequiredKeys() {
        return [
            'users', 'koperasi', 'anggota', 'departemen',
            'simpananPokok', 'simpananWajib', 'simpananSukarela',
            'pinjaman', 'coa', 'jurnal', 'kategori', 'satuan',
            'barang', 'supplier', 'pembelian', 'penjualan'
        ];
    }

    /**
     * Validate backup file structure
     * @param {Object} backupData - Backup data object
     * @returns {Object} { valid: boolean, errors: Array, warnings: Array }
     */
    validateBackupStructure(backupData) {
        const errors = [];
        const warnings = [];

        // Check if backup data exists
        if (!backupData) {
            errors.push('Backup data is null or undefined');
            return { valid: false, errors, warnings };
        }

        // Check metadata exists
        if (!backupData.metadata) {
            errors.push('Metadata tidak ditemukan dalam file backup');
        } else {
            // Check required metadata fields
            if (!backupData.metadata.backupDate) {
                errors.push('Tanggal backup tidak ditemukan dalam metadata');
            }
            if (!backupData.metadata.version) {
                errors.push('Versi aplikasi tidak ditemukan dalam metadata');
            }
            if (!backupData.metadata.koperasiName) {
                errors.push('Nama koperasi tidak ditemukan dalam metadata');
            }
        }

        // Check data object exists
        if (!backupData.data) {
            errors.push('Data tidak ditemukan dalam file backup');
            return { valid: false, errors, warnings };
        }

        // Check required keys exist (only for full backups)
        const isPartial = backupData.metadata && backupData.metadata.backupType === 'partial';

        if (!isPartial) {
            const requiredKeys = this.getRequiredKeys();
            const missingKeys = [];

            for (const key of requiredKeys) {
                if (!(key in backupData.data)) {
                    missingKeys.push(key);
                }
            }

            if (missingKeys.length > 0) {
                errors.push(`Key yang hilang: ${missingKeys.join(', ')}`);
            }
        } else {
            // For partial backups, verify that declared categories exist
            if (backupData.metadata.categories && Array.isArray(backupData.metadata.categories)) {
                const missingDeclaredKeys = [];
                for (const key of backupData.metadata.categories) {
                    if (!(key in backupData.data)) {
                        missingDeclaredKeys.push(key);
                    }
                }
                if (missingDeclaredKeys.length > 0) {
                    errors.push(`Key yang dideklarasikan tetapi hilang: ${missingDeclaredKeys.join(', ')}`);
                }
            }
        }

        // Check data types for each key that exists in backup
        const typeErrors = [];
        const keysToCheck = isPartial
            ? Object.keys(backupData.data)
            : this.getRequiredKeys();

        for (const key of keysToCheck) {
            if (key in backupData.data) {
                const value = backupData.data[key];

                // Check expected types
                if (key === 'koperasi') {
                    if (value !== null && typeof value !== 'object') {
                        typeErrors.push(`${key}: Expected object, got ${typeof value}`);
                    }
                } else if (key === 'saldoAwalPeriode') {
                    if (value !== null && typeof value !== 'object') {
                        typeErrors.push(`${key}: Expected object or null, got ${typeof value}`);
                    }
                } else if (key === 'periodeAktif') {
                    if (typeof value !== 'boolean') {
                        typeErrors.push(`${key}: Expected boolean, got ${typeof value}`);
                    }
                } else {
                    // Most keys should be arrays
                    if (!Array.isArray(value)) {
                        typeErrors.push(`${key}: Expected array, got ${typeof value}`);
                    }
                }
            }
        }

        if (typeErrors.length > 0) {
            errors.push(`Tipe data tidak sesuai: ${typeErrors.join('; ')}`);
        }

        // Check version compatibility
        if (backupData.metadata && backupData.metadata.version) {
            if (backupData.metadata.version !== APP_VERSION) {
                warnings.push(`Backup dari versi berbeda (${backupData.metadata.version} vs ${APP_VERSION}). Mungkin ada masalah kompatibilitas.`);
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validate data integrity
     * @param {Object} backupData - Backup data object
     * @returns {Object} { valid: boolean, errors: Array }
     */
    validateDataIntegrity(backupData) {
        const errors = [];

        if (!backupData || !backupData.data) {
            errors.push('Data backup tidak valid');
            return { valid: false, errors };
        }

        // Check referential integrity and required fields
        // This is a basic implementation - can be expanded based on specific needs

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

// ============================================================================
// BackupService Class
// ============================================================================
class BackupService {
    constructor() {
        this.validationService = new BackupValidationService();
    }

    /**
     * Get available data categories
     * @returns {Array} List of categories with counts
     */
    getCategories() {
        const categories = [
            { key: 'users', label: 'Pengguna', count: 0 },
            { key: 'koperasi', label: 'Data Koperasi', count: 0 },
            { key: 'anggota', label: 'Anggota', count: 0 },
            { key: 'departemen', label: 'Departemen', count: 0 },
            { key: 'simpananPokok', label: 'Simpanan Pokok', count: 0 },
            { key: 'simpananWajib', label: 'Simpanan Wajib', count: 0 },
            { key: 'simpananSukarela', label: 'Simpanan Sukarela', count: 0 },
            { key: 'pinjaman', label: 'Pinjaman', count: 0 },
            { key: 'coa', label: 'Chart of Accounts', count: 0 },
            { key: 'jurnal', label: 'Jurnal', count: 0 },
            { key: 'kategori', label: 'Kategori', count: 0 },
            { key: 'satuan', label: 'Satuan', count: 0 },
            { key: 'barang', label: 'Barang', count: 0 },
            { key: 'supplier', label: 'Supplier', count: 0 },
            { key: 'pembelian', label: 'Pembelian', count: 0 },
            { key: 'penjualan', label: 'Penjualan', count: 0 }
        ];

        // Calculate counts
        categories.forEach(cat => {
            const data = localStorage.getItem(cat.key);
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    if (Array.isArray(parsed)) {
                        cat.count = parsed.length;
                    } else if (typeof parsed === 'object' && parsed !== null) {
                        cat.count = 1;
                    }
                } catch (e) {
                    cat.count = 0;
                }
            }
        });

        return categories;
    }

    /**
     * Calculate estimated backup size
     * @param {Array} categories - Categories to backup (empty = all)
     * @returns {number} Size in bytes
     */
    calculateSize(categories = []) {
        let totalSize = 0;
        const keysToCheck = categories.length > 0
            ? categories
            : this.validationService.getRequiredKeys();

        keysToCheck.forEach(key => {
            const data = localStorage.getItem(key);
            if (data) {
                totalSize += new Blob([data]).size;
            }
        });

        // Add metadata overhead (approximate)
        totalSize += 500; // bytes for metadata

        return totalSize;
    }

    /**
     * Create backup of all or selected data
     * @param {Object} options - Backup options { type: 'full'|'partial', categories: [] }
     * @returns {Object} Backup data object
     */
    createBackup(options = { type: 'full', categories: [] }) {
        const isFull = options.type === 'full' || !options.categories || options.categories.length === 0;
        const categoriesToBackup = isFull
            ? this.validationService.getRequiredKeys()
            : options.categories;

        // Collect metadata
        const koperasiData = localStorage.getItem('koperasi');
        const koperasi = koperasiData ? JSON.parse(koperasiData) : { nama: 'Unknown' };

        const metadata = {
            version: APP_VERSION,
            backupDate: new Date().toISOString(),
            backupType: isFull ? 'full' : 'partial',
            koperasiName: koperasi.nama || 'Unknown',
            koperasiId: koperasi.id || 'unknown',
            categories: categoriesToBackup,
            dataCount: {},
            size: 0
        };

        // Collect data
        const data = {};
        categoriesToBackup.forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
                try {
                    const parsed = JSON.parse(item);
                    data[key] = parsed;

                    // Count records
                    if (Array.isArray(parsed)) {
                        metadata.dataCount[key] = parsed.length;
                    } else if (typeof parsed === 'object' && parsed !== null) {
                        metadata.dataCount[key] = 1;
                    } else {
                        metadata.dataCount[key] = 0;
                    }
                } catch (e) {
                    data[key] = null;
                    metadata.dataCount[key] = 0;
                }
            } else {
                data[key] = null;
                metadata.dataCount[key] = 0;
            }
        });

        // Handle password protection - hash passwords if present
        if (data.users && Array.isArray(data.users)) {
            data.users = data.users.map(user => {
                if (user.password) {
                    // Don't store plain text passwords
                    return { ...user, password: '***PROTECTED***' };
                }
                return user;
            });
        }

        const backupObject = { metadata, data };

        // Calculate actual size
        metadata.size = new Blob([JSON.stringify(backupObject)]).size;

        return backupObject;
    }

    /**
     * Download backup file
     * @param {Object} backupData - Backup data object
     */
    downloadBackup(backupData) {
        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });

        // Generate filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const koperasiName = backupData.metadata.koperasiName.replace(/[^a-zA-Z0-9]/g, '_');
        const backupType = backupData.metadata.backupType === 'partial' ? '_partial' : '';
        const filename = `backup_${koperasiName}_${timestamp}${backupType}.json`;

        // Trigger download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Save backup metadata to history
        this.saveBackupHistory({
            id: Date.now().toString(),
            filename: filename,
            date: backupData.metadata.backupDate,
            type: backupData.metadata.backupType,
            size: backupData.metadata.size,
            koperasiName: backupData.metadata.koperasiName,
            categories: backupData.metadata.categories,
            success: true
        });
    }

    /**
     * Save backup history
     * @param {Object} historyEntry - History entry object
     */
    saveBackupHistory(historyEntry) {
        let history = localStorage.getItem('backupHistory');
        history = history ? JSON.parse(history) : [];
        history.unshift(historyEntry);

        // Keep only last 10 entries
        if (history.length > 10) {
            history = history.slice(0, 10);
        }

        localStorage.setItem('backupHistory', JSON.stringify(history));
        localStorage.setItem('lastBackupDate', historyEntry.date);
    }
}

// ============================================================================
// MigrationService Class
// ============================================================================
class MigrationService {
    constructor() {
        this.migrationLog = [];
    }

    /**
     * Compare version strings
     * @param {string} version1 - First version
     * @param {string} version2 - Second version
     * @returns {number} -1 if v1 < v2, 0 if equal, 1 if v1 > v2
     */
    compareVersions(version1, version2) {
        const v1Parts = version1.split('.').map(Number);
        const v2Parts = version2.split('.').map(Number);

        for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
            const v1Part = v1Parts[i] || 0;
            const v2Part = v2Parts[i] || 0;

            if (v1Part < v2Part) return -1;
            if (v1Part > v2Part) return 1;
        }

        return 0;
    }

    /**
     * Check if migration is needed
     * @param {string} backupVersion - Version from backup
     * @param {string} currentVersion - Current app version
     * @returns {boolean}
     */
    needsMigration(backupVersion, currentVersion) {
        return this.compareVersions(backupVersion, currentVersion) !== 0;
    }

    /**
     * Check if versions are compatible
     * @param {string} backupVersion - Version from backup
     * @param {string} currentVersion - Current app version
     * @returns {boolean}
     */
    isCompatible(backupVersion, currentVersion) {
        const comparison = this.compareVersions(backupVersion, currentVersion);

        // For now, we consider versions compatible if they differ only in patch version
        const backupParts = backupVersion.split('.');
        const currentParts = currentVersion.split('.');

        // Major version must match
        if (backupParts[0] !== currentParts[0]) {
            return false;
        }

        // Minor version differences are acceptable
        return true;
    }

    /**
     * Apply data migrations
     * @param {Object} backupData - Backup data object
     * @param {string} targetVersion - Target version to migrate to
     * @returns {Object} Migrated backup data
     */
    migrateData(backupData, targetVersion) {
        this.migrationLog = [];
        const backupVersion = backupData.metadata.version;

        if (!this.needsMigration(backupVersion, targetVersion)) {
            this.logMigration('No migration needed', backupVersion, targetVersion);
            return backupData;
        }

        this.logMigration('Starting migration', backupVersion, targetVersion);

        // Create a deep copy to avoid mutating original
        const migratedData = JSON.parse(JSON.stringify(backupData));

        // Apply migrations based on version differences
        const comparison = this.compareVersions(backupVersion, targetVersion);

        if (comparison < 0) {
            // Upgrading from older version
            this.applyUpgradeMigrations(migratedData, backupVersion, targetVersion);
        } else {
            // Downgrading from newer version
            this.applyDowngradeMigrations(migratedData, backupVersion, targetVersion);
        }

        // Update version in metadata
        migratedData.metadata.version = targetVersion;
        migratedData.metadata.migratedFrom = backupVersion;

        this.logMigration('Migration completed', backupVersion, targetVersion);

        return migratedData;
    }

    /**
     * Apply upgrade migrations
     * @param {Object} data - Data to migrate
     * @param {string} fromVersion - Source version
     * @param {string} toVersion - Target version
     */
    applyUpgradeMigrations(data, fromVersion, toVersion) {
        // Example migration logic - add more as needed

        // Migration from 0.9.x to 1.0.0
        if (this.compareVersions(fromVersion, '1.0.0') < 0 &&
            this.compareVersions(toVersion, '1.0.0') >= 0) {
            this.logMigration('Applying migration: 0.9.x -> 1.0.0');

            // Add any missing fields that were introduced in 1.0.0
            if (data.data.anggota && Array.isArray(data.data.anggota)) {
                data.data.anggota.forEach(anggota => {
                    if (!anggota.tanggalDaftar) {
                        anggota.tanggalDaftar = new Date().toISOString().split('T')[0];
                        this.logMigration(`Added tanggalDaftar to anggota ${anggota.id}`);
                    }
                });
            }
        }

        // Add more version-specific migrations here as the app evolves
    }

    /**
     * Apply downgrade migrations
     * @param {Object} data - Data to migrate
     * @param {string} fromVersion - Source version
     * @param {string} toVersion - Target version
     */
    applyDowngradeMigrations(data, fromVersion, toVersion) {
        this.logMigration('Downgrade migration - removing newer features');

        // Remove fields that don't exist in older versions
        // This is generally not recommended, but provided for completeness
    }

    /**
     * Log migration action
     * @param {string} action - Action description
     * @param {string} fromVersion - Source version (optional)
     * @param {string} toVersion - Target version (optional)
     */
    logMigration(action, fromVersion = '', toVersion = '') {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action,
            fromVersion,
            toVersion
        };
        this.migrationLog.push(logEntry);
    }

    /**
     * Get migration log
     * @returns {Array} Migration log entries
     */
    getMigrationLog() {
        return this.migrationLog;
    }

    /**
     * Clear migration log
     */
    clearMigrationLog() {
        this.migrationLog = [];
    }
}

// ============================================================================
// RestoreService Class
// ============================================================================
class RestoreService {
    constructor() {
        this.validationService = new BackupValidationService();
        this.migrationService = new MigrationService();
    }

    /**
     * Parse backup file
     * @param {File} file - Uploaded file
     * @returns {Promise<Object>} Parsed backup data
     */
    async parseBackupFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const parsed = JSON.parse(e.target.result);
                    resolve(parsed);
                } catch (error) {
                    reject(new Error('Gagal membaca file backup. File mungkin rusak atau bukan format JSON yang valid.'));
                }
            };

            reader.onerror = () => {
                reject(new Error('Gagal membaca file backup'));
            };

            reader.readAsText(file);
        });
    }

    /**
     * Preview backup data
     * @param {Object} backupData - Parsed backup data
     * @returns {Object} Preview information
     */
    previewBackup(backupData) {
        if (!backupData || !backupData.metadata) {
            return null;
        }

        const preview = {
            koperasiName: backupData.metadata.koperasiName,
            backupDate: backupData.metadata.backupDate,
            version: backupData.metadata.version,
            backupType: backupData.metadata.backupType,
            categories: backupData.metadata.categories,
            dataCount: backupData.metadata.dataCount,
            size: backupData.metadata.size,
            compatibility: {
                isCompatible: true,
                needsMigration: false,
                warnings: []
            }
        };

        // Check version compatibility
        if (backupData.metadata.version) {
            const needsMigration = this.migrationService.needsMigration(
                backupData.metadata.version,
                APP_VERSION
            );
            const isCompatible = this.migrationService.isCompatible(
                backupData.metadata.version,
                APP_VERSION
            );

            preview.compatibility.needsMigration = needsMigration;
            preview.compatibility.isCompatible = isCompatible;

            if (needsMigration) {
                if (!isCompatible) {
                    preview.compatibility.warnings.push(
                        `PERINGATAN: Backup dari versi ${backupData.metadata.version} mungkin tidak kompatibel dengan versi aplikasi saat ini (${APP_VERSION}). ` +
                        `Restore dapat menyebabkan masalah atau kehilangan data. Lanjutkan dengan risiko Anda sendiri.`
                    );
                } else {
                    preview.compatibility.warnings.push(
                        `Info: Backup dari versi ${backupData.metadata.version} akan dimigrasikan ke versi ${APP_VERSION}. ` +
                        `Perubahan akan dicatat dalam log migrasi.`
                    );
                }
            }
        }

        return preview;
    }

    /**
     * Restore data from backup
     * @param {Object} backupData - Parsed backup data
     * @returns {Object} { success: boolean, message: string, errors: Array, warnings: Array }
     */
    restoreBackup(backupData) {
        const result = {
            success: false,
            message: '',
            errors: [],
            warnings: [],
            restored: {
                categories: [],
                recordCount: 0
            },
            autoBackup: {
                created: false,
                filename: ''
            },
            migration: {
                performed: false,
                log: []
            }
        };

        // Validate backup structure
        const validation = this.validationService.validateBackupStructure(backupData);
        if (!validation.valid) {
            result.errors = validation.errors;
            result.message = 'Validasi backup gagal';
            return result;
        }

        result.warnings = validation.warnings;

        // Check if migration is needed
        let dataToRestore = backupData;
        if (backupData.metadata && backupData.metadata.version) {
            if (this.migrationService.needsMigration(backupData.metadata.version, APP_VERSION)) {
                // Check compatibility
                if (!this.migrationService.isCompatible(backupData.metadata.version, APP_VERSION)) {
                    result.warnings.push(`Versi backup (${backupData.metadata.version}) tidak kompatibel dengan versi aplikasi (${APP_VERSION}). Migrasi akan dicoba, tetapi mungkin ada masalah.`);
                }

                // Perform migration
                try {
                    dataToRestore = this.migrationService.migrateData(backupData, APP_VERSION);
                    result.migration.performed = true;
                    result.migration.log = this.migrationService.getMigrationLog();
                    result.warnings.push(`Data dimigrasikan dari versi ${backupData.metadata.version} ke ${APP_VERSION}`);
                } catch (error) {
                    result.errors.push(`Gagal melakukan migrasi data: ${error.message}`);
                    result.message = 'Migrasi gagal';
                    return result;
                }
            }
        }

        try {
            // Create auto backup before restore
            const autoBackupService = new AutoBackupService();
            const autoBackupResult = autoBackupService.createPreRestoreBackup();

            if (!autoBackupResult.success) {
                result.errors.push('Gagal membuat backup otomatis. Restore dibatalkan untuk keamanan.');
                result.message = 'Restore dibatalkan';
                return result;
            }

            result.autoBackup = autoBackupResult;

            // Restore data to localStorage (use migrated data if migration was performed)
            const isPartial = dataToRestore.metadata.backupType === 'partial';
            const categoriesToRestore = dataToRestore.metadata.categories || Object.keys(dataToRestore.data);

            let recordCount = 0;
            categoriesToRestore.forEach(key => {
                if (key in dataToRestore.data) {
                    localStorage.setItem(key, JSON.stringify(dataToRestore.data[key]));
                    result.restored.categories.push(key);

                    if (Array.isArray(dataToRestore.data[key])) {
                        recordCount += dataToRestore.data[key].length;
                    } else if (dataToRestore.data[key] !== null) {
                        recordCount += 1;
                    }
                }
            });

            result.restored.recordCount = recordCount;

            // Verify data integrity after restore
            const integrityCheck = this.validationService.validateDataIntegrity(dataToRestore);
            if (!integrityCheck.valid) {
                result.warnings.push('Peringatan: Beberapa masalah integritas data terdeteksi');
                result.warnings.push(...integrityCheck.errors);
            }

            result.success = true;
            result.message = `Restore berhasil. ${recordCount} record dipulihkan dari ${result.restored.categories.length} kategori.`;

        } catch (error) {
            result.errors.push(`Error saat restore: ${error.message}`);
            result.message = 'Restore gagal';
        }

        return result;
    }
}

// ============================================================================
// AutoBackupService Class
// ============================================================================
class AutoBackupService {
    /**
     * Create pre-restore backup
     * @returns {Object} { success: boolean, filename: string }
     */
    createPreRestoreBackup() {
        try {
            const backupService = new BackupService();
            const backupData = backupService.createBackup({ type: 'full' });

            // Modify metadata to indicate pre-restore backup
            backupData.metadata.backupType = 'pre-restore';

            // Generate filename with pre-restore prefix
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const koperasiName = backupData.metadata.koperasiName.replace(/[^a-zA-Z0-9]/g, '_');
            const filename = `backup_pre-restore_${koperasiName}_${timestamp}.json`;

            // Download file
            const jsonString = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Save to history
            backupService.saveBackupHistory({
                id: Date.now().toString(),
                filename: filename,
                date: backupData.metadata.backupDate,
                type: 'pre-restore',
                size: backupData.metadata.size,
                koperasiName: backupData.metadata.koperasiName,
                categories: backupData.metadata.categories,
                success: true
            });

            return {
                success: true,
                created: true,
                filename: filename
            };
        } catch (error) {
            return {
                success: false,
                created: false,
                filename: '',
                error: error.message
            };
        }
    }
}

// ============================================================================
// UI Functions
// ============================================================================

/**
 * Render Backup/Restore page
 */
function renderBackupRestore() {
    const content = document.getElementById('mainContent');

    try {
        // Check if localStorage is accessible
        if (typeof localStorage === 'undefined') {
            content.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    <strong>Error</strong>
                    <p class="mb-0 mt-2">Browser Anda tidak mendukung localStorage. Fitur Backup/Restore tidak dapat digunakan.</p>
                </div>
            `;
            return;
        }

        // Check user role
        const currentUserData = localStorage.getItem('currentUser');
        if (!currentUserData) {
            content.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    <strong>Sesi Tidak Valid</strong>
                    <p class="mb-0 mt-2">Silakan login kembali untuk mengakses halaman ini.</p>
                </div>
            `;
            return;
        }

        const currentUser = JSON.parse(currentUserData);
        const roleValidator = new RoleValidator();

        if (!roleValidator.isAdmin(currentUser)) {
            content.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    <strong>Akses Ditolak</strong>
                    <p class="mb-0 mt-2">Anda tidak memiliki izin untuk mengakses halaman ini. Fitur Backup/Restore hanya tersedia untuk Administrator dan Super Admin.</p>
                </div>
            `;
            return;
        }
    } catch (error) {
        content.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                <strong>Error</strong>
                <p class="mb-0 mt-2">Gagal memuat halaman: ${error.message}</p>
            </div>
        `;
        console.error('Error rendering backup/restore page:', error);
        return;
    }

    try {
        // Get statistics
        const backupService = new BackupService();
        const categories = backupService.getCategories();
        const estimatedSize = backupService.calculateSize();

        // Get last backup info
        const lastBackupDate = localStorage.getItem('lastBackupDate');
        const backupHistory = JSON.parse(localStorage.getItem('backupHistory') || '[]');
        const lastBackup = backupHistory.length > 0 ? backupHistory[0] : null;

        // Calculate total records
        const totalRecords = categories.reduce((sum, cat) => sum + cat.count, 0);

        // Format size
        const formatSize = (bytes) => {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        };

        // Format date
        const formatDate = (isoDate) => {
            if (!isoDate) return 'Belum pernah';
            const date = new Date(isoDate);
            return date.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 style="color: #2d6a4f; font-weight: 700;">
                <i class="bi bi-database me-2"></i>Backup & Restore Database
            </h2>
        </div>
        
        <!-- Statistics Cards -->
        <div class="row mb-4">
            <div class="col-md-3 mb-3">
                <div class="card border-0 shadow-sm h-100" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <div class="card-body text-white">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-2" style="opacity: 0.9;">Total Records</h6>
                                <h2 class="mb-0" style="font-weight: 700;">${totalRecords.toLocaleString('id-ID')}</h2>
                            </div>
                            <i class="bi bi-database-fill" style="font-size: 3rem; opacity: 0.3;"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3 mb-3">
                <div class="card border-0 shadow-sm h-100" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                    <div class="card-body text-white">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-2" style="opacity: 0.9;">Kategori Data</h6>
                                <h2 class="mb-0" style="font-weight: 700;">${categories.length}</h2>
                            </div>
                            <i class="bi bi-folder-fill" style="font-size: 3rem; opacity: 0.3;"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3 mb-3">
                <div class="card border-0 shadow-sm h-100" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                    <div class="card-body text-white">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-2" style="opacity: 0.9;">Estimasi Ukuran</h6>
                                <h2 class="mb-0" style="font-weight: 700; font-size: 1.5rem;">${formatSize(estimatedSize)}</h2>
                            </div>
                            <i class="bi bi-hdd-fill" style="font-size: 3rem; opacity: 0.3;"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3 mb-3">
                <div class="card border-0 shadow-sm h-100" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                    <div class="card-body text-white">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-2" style="opacity: 0.9;">Backup Terakhir</h6>
                                <p class="mb-0" style="font-size: 0.9rem; font-weight: 600;">
                                    ${lastBackup ? formatDate(lastBackup.date).split(',')[0] : 'Belum pernah'}
                                </p>
                                <small style="opacity: 0.8;">${lastBackup ? formatDate(lastBackup.date).split(',')[1] || '' : ''}</small>
                            </div>
                            <i class="bi bi-clock-history" style="font-size: 3rem; opacity: 0.3;"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="row mb-4">
            <div class="col-md-6 mb-3">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-body">
                        <h5 class="card-title mb-3">
                            <i class="bi bi-download me-2" style="color: #2d6a4f;"></i>Backup Database
                        </h5>
                        <p class="card-text text-muted">
                            Ekspor seluruh data koperasi ke file backup. File akan diunduh dalam format JSON.
                        </p>
                        <button class="btn btn-success w-100" id="btnBackup">
                            <i class="bi bi-download me-2"></i>Buat Backup
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6 mb-3">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-body">
                        <h5 class="card-title mb-3">
                            <i class="bi bi-upload me-2" style="color: #dc3545;"></i>Restore Database
                        </h5>
                        <p class="card-text text-muted">
                            Impor data dari file backup. <strong class="text-danger">Perhatian:</strong> Data saat ini akan diganti!
                        </p>
                        <button class="btn btn-danger w-100" id="btnRestore">
                            <i class="bi bi-upload me-2"></i>Restore dari Backup
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Data Categories -->
        <div class="card border-0 shadow-sm mb-4">
            <div class="card-header bg-white border-0 py-3">
                <h5 class="mb-0">
                    <i class="bi bi-list-ul me-2" style="color: #2d6a4f;"></i>Kategori Data
                </h5>
            </div>
            <div class="card-body">
                <div class="row">
                    ${categories.map(cat => `
                        <div class="col-md-4 mb-3">
                            <div class="d-flex justify-content-between align-items-center p-3 border rounded">
                                <div>
                                    <strong>${cat.label}</strong>
                                    <br>
                                    <small class="text-muted">${cat.key}</small>
                                </div>
                                <span class="badge bg-primary rounded-pill">${cat.count.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <!-- Backup History -->
        <div class="card border-0 shadow-sm">
            <div class="card-header bg-white border-0 py-3">
                <h5 class="mb-0">
                    <i class="bi bi-clock-history me-2" style="color: #2d6a4f;"></i>Riwayat Backup
                </h5>
            </div>
            <div class="card-body">
                ${backupHistory.length === 0 ? `
                    <div class="text-center text-muted py-4">
                        <i class="bi bi-inbox" style="font-size: 3rem; opacity: 0.3;"></i>
                        <p class="mt-3 mb-0">Belum ada riwayat backup</p>
                        <small>Buat backup pertama Anda untuk melindungi data koperasi</small>
                    </div>
                ` : `
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Nama File</th>
                                    <th>Tipe</th>
                                    <th>Ukuran</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${backupHistory.slice(0, 10).map(backup => `
                                    <tr>
                                        <td>${formatDate(backup.date)}</td>
                                        <td>
                                            <small class="font-monospace">${backup.filename}</small>
                                        </td>
                                        <td>
                                            <span class="badge ${backup.type === 'full' ? 'bg-primary' : backup.type === 'partial' ? 'bg-info' : 'bg-warning'}">
                                                ${backup.type === 'full' ? 'Full' : backup.type === 'partial' ? 'Partial' : 'Pre-Restore'}
                                            </span>
                                        </td>
                                        <td>${formatSize(backup.size)}</td>
                                        <td>
                                            ${backup.success
                ? '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Berhasil</span>'
                : '<span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i>Gagal</span>'}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        </div>
    `;

        // Attach event listeners
        document.getElementById('btnBackup').addEventListener('click', handleBackupClick);
        document.getElementById('btnRestore').addEventListener('click', handleRestoreClick);

    } catch (error) {
        content.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                <strong>Error</strong>
                <p class="mb-0 mt-2">Gagal memuat data: ${error.message}</p>
                <p class="mb-0 mt-2"><small>Coba refresh halaman atau hubungi administrator.</small></p>
            </div>
        `;
        console.error('Error loading backup/restore data:', error);
    }
}

/**
 * Show backup options dialog
 */
function showBackupOptions() {
    const backupService = new BackupService();
    const categories = backupService.getCategories();

    // Format size helper
    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    // Calculate initial size (full backup)
    const fullBackupSize = backupService.calculateSize();

    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="backupOptionsModal" tabindex="-1" aria-labelledby="backupOptionsModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                        <h5 class="modal-title" id="backupOptionsModalLabel">
                            <i class="bi bi-download me-2"></i>Opsi Backup
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <!-- Backup Type Selection -->
                        <div class="mb-4">
                            <h6 class="mb-3">Tipe Backup</h6>
                            <div class="form-check mb-2">
                                <input class="form-check-input" type="radio" name="backupType" id="backupTypeFull" value="full" checked>
                                <label class="form-check-label" for="backupTypeFull">
                                    <strong>Full Backup</strong>
                                    <br>
                                    <small class="text-muted">Backup seluruh data koperasi</small>
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="backupType" id="backupTypePartial" value="partial">
                                <label class="form-check-label" for="backupTypePartial">
                                    <strong>Partial Backup</strong>
                                    <br>
                                    <small class="text-muted">Backup kategori data tertentu saja</small>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Category Selection (hidden by default) -->
                        <div id="categorySelectionContainer" style="display: none;">
                            <h6 class="mb-3">Pilih Kategori Data</h6>
                            <div class="row" id="categoryCheckboxes">
                                ${categories.map(cat => `
                                    <div class="col-md-6 mb-2">
                                        <div class="form-check">
                                            <input class="form-check-input category-checkbox" type="checkbox" 
                                                   value="${cat.key}" id="cat_${cat.key}" data-size="${new Blob([localStorage.getItem(cat.key) || '']).size}">
                                            <label class="form-check-label" for="cat_${cat.key}">
                                                ${cat.label}
                                                <span class="badge bg-secondary ms-1">${cat.count}</span>
                                            </label>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            <div class="mt-3">
                                <button type="button" class="btn btn-sm btn-outline-primary" id="btnSelectAll">
                                    <i class="bi bi-check-square me-1"></i>Pilih Semua
                                </button>
                                <button type="button" class="btn btn-sm btn-outline-secondary" id="btnDeselectAll">
                                    <i class="bi bi-square me-1"></i>Hapus Semua
                                </button>
                            </div>
                        </div>
                        
                        <!-- Size Estimation -->
                        <div class="mt-4 p-3 border rounded" style="background-color: #f8f9fa;">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-1">Estimasi Ukuran Backup</h6>
                                    <small class="text-muted">Ukuran file yang akan diunduh</small>
                                </div>
                                <h4 class="mb-0" id="estimatedSize" style="color: #667eea; font-weight: 700;">
                                    ${formatSize(fullBackupSize)}
                                </h4>
                            </div>
                            <div id="sizeWarning" class="mt-2" style="display: none;">
                                <div class="alert alert-warning mb-0 py-2">
                                    <i class="bi bi-exclamation-triangle me-2"></i>
                                    <small>File berukuran besar. Download mungkin memakan waktu.</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-1"></i>Batal
                        </button>
                        <button type="button" class="btn btn-success" id="btnConfirmBackup">
                            <i class="bi bi-download me-1"></i>Buat Backup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('backupOptionsModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Get modal element
    const modalElement = document.getElementById('backupOptionsModal');
    const modal = new bootstrap.Modal(modalElement);

    // Get elements
    const backupTypeFull = document.getElementById('backupTypeFull');
    const backupTypePartial = document.getElementById('backupTypePartial');
    const categoryContainer = document.getElementById('categorySelectionContainer');
    const categoryCheckboxes = document.querySelectorAll('.category-checkbox');
    const estimatedSizeElement = document.getElementById('estimatedSize');
    const sizeWarningElement = document.getElementById('sizeWarning');
    const btnSelectAll = document.getElementById('btnSelectAll');
    const btnDeselectAll = document.getElementById('btnDeselectAll');
    const btnConfirmBackup = document.getElementById('btnConfirmBackup');

    // Size threshold for warning (5MB)
    const SIZE_WARNING_THRESHOLD = 5 * 1024 * 1024;

    // Function to update size estimation
    const updateSizeEstimation = () => {
        let selectedCategories = [];

        if (backupTypePartial.checked) {
            // Get selected categories
            categoryCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    selectedCategories.push(checkbox.value);
                }
            });
        }

        // Calculate size
        const estimatedSize = backupService.calculateSize(selectedCategories);
        estimatedSizeElement.textContent = formatSize(estimatedSize);

        // Show warning if size is large
        if (estimatedSize > SIZE_WARNING_THRESHOLD) {
            sizeWarningElement.style.display = 'block';
        } else {
            sizeWarningElement.style.display = 'none';
        }
    };

    // Event listener for backup type change
    backupTypeFull.addEventListener('change', () => {
        if (backupTypeFull.checked) {
            categoryContainer.style.display = 'none';
            updateSizeEstimation();
        }
    });

    backupTypePartial.addEventListener('change', () => {
        if (backupTypePartial.checked) {
            categoryContainer.style.display = 'block';
            updateSizeEstimation();
        }
    });

    // Event listeners for category checkboxes
    categoryCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateSizeEstimation);
    });

    // Select all button
    btnSelectAll.addEventListener('click', () => {
        categoryCheckboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
        updateSizeEstimation();
    });

    // Deselect all button
    btnDeselectAll.addEventListener('click', () => {
        categoryCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        updateSizeEstimation();
    });

    // Confirm backup button
    btnConfirmBackup.addEventListener('click', () => {
        const backupType = backupTypeFull.checked ? 'full' : 'partial';
        let selectedCategories = [];

        if (backupType === 'partial') {
            categoryCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    selectedCategories.push(checkbox.value);
                }
            });

            if (selectedCategories.length === 0) {
                showAlert('Pilih minimal satu kategori untuk backup parsial', 'warning');
                return;
            }
        }

        // Create backup
        try {
            // Disable button to prevent double-click
            btnConfirmBackup.disabled = true;
            btnConfirmBackup.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Membuat backup...';

            const backupData = backupService.createBackup({
                type: backupType,
                categories: selectedCategories
            });

            if (!backupData || !backupData.metadata || !backupData.data) {
                throw new Error('Gagal membuat struktur backup yang valid');
            }

            backupService.downloadBackup(backupData);

            modal.hide();
            showAlert('Backup berhasil dibuat dan diunduh!', 'success');

            // Refresh the page to update statistics
            setTimeout(() => {
                renderBackupRestore();
            }, 1000);
        } catch (error) {
            // Re-enable button
            btnConfirmBackup.disabled = false;
            btnConfirmBackup.innerHTML = '<i class="bi bi-download me-1"></i>Buat Backup';

            // Show detailed error message
            let errorMessage = 'Gagal membuat backup';
            if (error.message) {
                errorMessage += `: ${error.message}`;
            }

            // Check for specific error types
            if (error.name === 'QuotaExceededError') {
                errorMessage = 'Penyimpanan browser penuh. Hapus data yang tidak diperlukan atau gunakan browser lain.';
            } else if (error.message.includes('localStorage')) {
                errorMessage = 'Gagal mengakses penyimpanan browser. Pastikan browser Anda mendukung localStorage.';
            }

            showAlert(errorMessage, 'danger');
            console.error('Backup error:', error);
        }
    });

    // Clean up modal on hide
    modalElement.addEventListener('hidden.bs.modal', () => {
        modalElement.remove();
    });

    // Show modal
    modal.show();
}

/**
 * Show backup preview dialog
 * @param {Object} backupData - Parsed backup data
 * @param {Function} onProceed - Callback function when user proceeds
 */
function showBackupPreview(backupData, onProceed) {
    const restoreService = new RestoreService();
    const preview = restoreService.previewBackup(backupData);

    if (!preview) {
        showAlert('Gagal membaca informasi backup', 'danger');
        return;
    }

    // Format date helper
    const formatDate = (isoDate) => {
        if (!isoDate) return 'Tidak diketahui';
        const date = new Date(isoDate);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format size helper
    const formatSize = (bytes) => {
        if (!bytes) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    // Calculate total records
    const totalRecords = Object.values(preview.dataCount || {}).reduce((sum, count) => sum + count, 0);

    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="backupPreviewModal" tabindex="-1" aria-labelledby="backupPreviewModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white;">
                        <h5 class="modal-title" id="backupPreviewModalLabel">
                            <i class="bi bi-eye me-2"></i>Preview Backup
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <!-- Backup Metadata -->
                        <div class="mb-4">
                            <h6 class="mb-3">
                                <i class="bi bi-info-circle me-2"></i>Informasi Backup
                            </h6>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <div class="p-3 border rounded">
                                        <small class="text-muted d-block mb-1">Nama Koperasi</small>
                                        <strong>${preview.koperasiName}</strong>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <div class="p-3 border rounded">
                                        <small class="text-muted d-block mb-1">Tanggal Backup</small>
                                        <strong>${formatDate(preview.backupDate)}</strong>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <div class="p-3 border rounded">
                                        <small class="text-muted d-block mb-1">Versi Aplikasi</small>
                                        <strong>${preview.version}</strong>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <div class="p-3 border rounded">
                                        <small class="text-muted d-block mb-1">Tipe Backup</small>
                                        <span class="badge ${preview.backupType === 'full' ? 'bg-primary' : 'bg-info'}">
                                            ${preview.backupType === 'full' ? 'Full Backup' : 'Partial Backup'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Data Statistics -->
                        <div class="mb-4">
                            <h6 class="mb-3">
                                <i class="bi bi-bar-chart me-2"></i>Statistik Data
                            </h6>
                            <div class="p-3 border rounded" style="background-color: #f8f9fa;">
                                <div class="row">
                                    <div class="col-md-6 mb-2">
                                        <div class="d-flex justify-content-between">
                                            <span>Total Records:</span>
                                            <strong>${totalRecords.toLocaleString('id-ID')}</strong>
                                        </div>
                                    </div>
                                    <div class="col-md-6 mb-2">
                                        <div class="d-flex justify-content-between">
                                            <span>Kategori:</span>
                                            <strong>${preview.categories.length}</strong>
                                        </div>
                                    </div>
                                    <div class="col-md-6 mb-2">
                                        <div class="d-flex justify-content-between">
                                            <span>Ukuran File:</span>
                                            <strong>${formatSize(preview.size)}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Category breakdown -->
                            <div class="mt-3">
                                <small class="text-muted d-block mb-2">Rincian per Kategori:</small>
                                <div class="row">
                                    ${Object.entries(preview.dataCount || {}).map(([key, count]) => `
                                        <div class="col-md-6 mb-2">
                                            <div class="d-flex justify-content-between align-items-center p-2 border rounded">
                                                <small>${key}</small>
                                                <span class="badge bg-secondary">${count.toLocaleString('id-ID')}</span>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Compatibility Warnings -->
                        ${preview.compatibility.warnings.length > 0 ? `
                            <div class="mb-3">
                                <h6 class="mb-3">
                                    <i class="bi bi-exclamation-triangle me-2"></i>Peringatan Kompatibilitas
                                </h6>
                                ${preview.compatibility.warnings.map(warning => `
                                    <div class="alert ${preview.compatibility.isCompatible ? 'alert-warning' : 'alert-danger'} mb-2">
                                        <i class="bi bi-exclamation-triangle-fill me-2"></i>
                                        <small>${warning}</small>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        
                        <!-- Info message -->
                        <div class="alert alert-info mb-0">
                            <i class="bi bi-info-circle-fill me-2"></i>
                            <small>
                                Klik "Lanjutkan" untuk melanjutkan ke konfirmasi restore. 
                                Backup otomatis akan dibuat sebelum proses restore dimulai.
                            </small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-1"></i>Batal
                        </button>
                        <button type="button" class="btn btn-primary" id="btnProceedToRestore">
                            <i class="bi bi-arrow-right me-1"></i>Lanjutkan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('backupPreviewModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Get modal element
    const modalElement = document.getElementById('backupPreviewModal');
    const modal = new bootstrap.Modal(modalElement);

    // Proceed button handler
    document.getElementById('btnProceedToRestore').addEventListener('click', () => {
        modal.hide();
        if (onProceed) {
            onProceed();
        }
    });

    // Clean up modal on hide
    modalElement.addEventListener('hidden.bs.modal', () => {
        modalElement.remove();
    });

    // Show modal
    modal.show();
}

/**
 * Show restore confirmation dialog
 * @param {Object} backupData - Parsed backup data
 * @param {Object} preview - Preview information from showBackupPreview
 * @param {Function} onConfirm - Callback function when user confirms
 */
function showRestoreConfirmation(backupData, preview, onConfirm) {
    // Format date helper
    const formatDate = (isoDate) => {
        if (!isoDate) return 'Tidak diketahui';
        const date = new Date(isoDate);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Calculate total records
    const totalRecords = Object.values(preview.dataCount || {}).reduce((sum, count) => sum + count, 0);

    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="restoreConfirmationModal" tabindex="-1" aria-labelledby="restoreConfirmationModalLabel" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title" id="restoreConfirmationModalLabel">
                            <i class="bi bi-exclamation-triangle-fill me-2"></i>Konfirmasi Restore Database
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <!-- Warning Message -->
                        <div class="alert alert-danger border-danger">
                            <h6 class="alert-heading">
                                <i class="bi bi-exclamation-octagon-fill me-2"></i>
                                PERINGATAN: Tindakan Tidak Dapat Dibatalkan!
                            </h6>
                            <hr>
                            <p class="mb-2">
                                <strong>Restore database akan mengganti SELURUH data aplikasi saat ini dengan data dari backup.</strong>
                            </p>
                            <p class="mb-0">
                                Pastikan Anda memahami konsekuensi dari tindakan ini sebelum melanjutkan.
                            </p>
                        </div>
                        
                        <!-- Backup Preview Info -->
                        <div class="mb-4">
                            <h6 class="mb-3">
                                <i class="bi bi-file-earmark-text me-2"></i>Informasi Backup yang Akan Di-restore
                            </h6>
                            <div class="p-3 border rounded" style="background-color: #f8f9fa;">
                                <div class="row">
                                    <div class="col-md-6 mb-2">
                                        <small class="text-muted d-block">Nama Koperasi:</small>
                                        <strong>${preview.koperasiName}</strong>
                                    </div>
                                    <div class="col-md-6 mb-2">
                                        <small class="text-muted d-block">Tanggal Backup:</small>
                                        <strong>${formatDate(preview.backupDate)}</strong>
                                    </div>
                                    <div class="col-md-6 mb-2">
                                        <small class="text-muted d-block">Versi:</small>
                                        <strong>${preview.version}</strong>
                                    </div>
                                    <div class="col-md-6 mb-2">
                                        <small class="text-muted d-block">Total Records:</small>
                                        <strong>${totalRecords.toLocaleString('id-ID')}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Impact List -->
                        <div class="mb-4">
                            <h6 class="mb-3">
                                <i class="bi bi-list-check me-2"></i>Dampak Restore
                            </h6>
                            <ul class="list-group">
                                <li class="list-group-item">
                                    <i class="bi bi-check-circle text-success me-2"></i>
                                    Backup otomatis akan dibuat sebelum restore dimulai
                                </li>
                                <li class="list-group-item">
                                    <i class="bi bi-arrow-repeat text-primary me-2"></i>
                                    ${preview.backupType === 'full'
            ? 'Semua data aplikasi akan diganti dengan data dari backup'
            : `Data dari ${preview.categories.length} kategori akan diganti`}
                                </li>
                                <li class="list-group-item">
                                    <i class="bi bi-exclamation-circle text-warning me-2"></i>
                                    Data yang tidak ada dalam backup akan hilang (untuk full restore)
                                </li>
                                <li class="list-group-item">
                                    <i class="bi bi-arrow-clockwise text-info me-2"></i>
                                    Aplikasi akan di-reload setelah restore selesai
                                </li>
                                ${preview.compatibility.needsMigration ? `
                                    <li class="list-group-item">
                                        <i class="bi bi-gear text-secondary me-2"></i>
                                        Migrasi data akan dilakukan dari versi ${preview.version} ke ${APP_VERSION}
                                    </li>
                                ` : ''}
                            </ul>
                        </div>
                        
                        <!-- Confirmation Checkbox -->
                        <div class="mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="confirmCheckbox">
                                <label class="form-check-label" for="confirmCheckbox">
                                    <strong>Saya memahami bahwa data saat ini akan diganti dan tindakan ini tidak dapat dibatalkan</strong>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Keyword Input -->
                        <div class="mb-3">
                            <label for="confirmKeyword" class="form-label">
                                <strong>Ketik kata <code class="text-danger">RESTORE</code> untuk melanjutkan:</strong>
                            </label>
                            <input type="text" class="form-control" id="confirmKeyword" 
                                   placeholder="Ketik RESTORE (huruf besar)" autocomplete="off">
                            <div class="invalid-feedback" id="keywordError">
                                Kata kunci salah. Ketik 'RESTORE' untuk melanjutkan.
                            </div>
                        </div>
                        
                        <!-- Final Warning -->
                        <div class="alert alert-warning mb-0">
                            <i class="bi bi-shield-exclamation me-2"></i>
                            <small>
                                <strong>Pastikan Anda telah memahami semua konsekuensi sebelum melanjutkan.</strong>
                                Jika ragu, batalkan proses ini dan konsultasikan dengan administrator sistem.
                            </small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-1"></i>Batal
                        </button>
                        <button type="button" class="btn btn-danger" id="btnConfirmRestore" disabled>
                            <i class="bi bi-upload me-1"></i>Restore Sekarang
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('restoreConfirmationModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Get modal element
    const modalElement = document.getElementById('restoreConfirmationModal');
    const modal = new bootstrap.Modal(modalElement);

    // Get form elements
    const confirmCheckbox = document.getElementById('confirmCheckbox');
    const confirmKeyword = document.getElementById('confirmKeyword');
    const keywordError = document.getElementById('keywordError');
    const btnConfirmRestore = document.getElementById('btnConfirmRestore');

    // Function to validate and enable/disable confirm button
    const validateForm = () => {
        const isCheckboxChecked = confirmCheckbox.checked;
        const isKeywordCorrect = confirmKeyword.value === 'RESTORE';

        // Enable button only if both conditions are met
        btnConfirmRestore.disabled = !(isCheckboxChecked && isKeywordCorrect);

        // Show/hide keyword error
        if (confirmKeyword.value.length > 0 && !isKeywordCorrect) {
            confirmKeyword.classList.add('is-invalid');
        } else {
            confirmKeyword.classList.remove('is-invalid');
        }
    };

    // Event listeners for validation
    confirmCheckbox.addEventListener('change', validateForm);
    confirmKeyword.addEventListener('input', validateForm);

    // Confirm restore button handler
    btnConfirmRestore.addEventListener('click', () => {
        // Double-check validation
        if (confirmCheckbox.checked && confirmKeyword.value === 'RESTORE') {
            modal.hide();
            if (onConfirm) {
                onConfirm();
            }
        } else {
            showAlert('Anda harus mencentang checkbox konfirmasi dan mengetik kata kunci yang benar', 'warning');
        }
    });

    // Clean up modal on hide
    modalElement.addEventListener('hidden.bs.modal', () => {
        modalElement.remove();
    });

    // Show modal
    modal.show();
}

/**
 * Handle backup button click
 */
function handleBackupClick() {
    showBackupOptions();
}

/**
 * Handle restore button click
 */
function handleRestoreClick() {
    // Create file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,application/json';

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.name.endsWith('.json')) {
            showAlert('File harus berformat JSON (.json)', 'warning');
            return;
        }

        // Validate file size (max 50MB)
        const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
        if (file.size > MAX_FILE_SIZE) {
            showAlert('File terlalu besar. Maksimal ukuran file adalah 50MB', 'warning');
            return;
        }

        // Validate file is not empty
        if (file.size === 0) {
            showAlert('File kosong. Pilih file backup yang valid', 'warning');
            return;
        }

        try {
            // Show loading indicator
            showAlert('Membaca file backup...', 'info');

            // Parse backup file
            const restoreService = new RestoreService();
            const backupData = await restoreService.parseBackupFile(file);

            // Validate backup structure
            const validationService = new BackupValidationService();
            const validation = validationService.validateBackupStructure(backupData);

            if (!validation.valid) {
                // Show validation errors with details
                let errorMessage = '<strong>File backup tidak valid!</strong><br><br>';
                errorMessage += '<strong>Kesalahan yang ditemukan:</strong><br>';
                errorMessage += validation.errors.map(err => `• ${err}`).join('<br>');
                errorMessage += '<br><br><small><strong>Saran:</strong><br>';
                errorMessage += '- Pastikan file adalah backup yang valid dari aplikasi ini<br>';
                errorMessage += '- Coba download ulang file backup<br>';
                errorMessage += '- Jangan edit file backup secara manual</small>';

                showAlert(errorMessage, 'danger');
                console.error('Validation errors:', validation.errors);
                return;
            }

            // Show warnings if any
            if (validation.warnings.length > 0) {
                console.warn('Backup validation warnings:', validation.warnings);
            }

            // Get preview information
            const preview = restoreService.previewBackup(backupData);

            if (!preview) {
                showAlert('Gagal membaca informasi backup. File mungkin rusak.', 'danger');
                return;
            }

            // Show backup preview
            showBackupPreview(backupData, () => {
                // User clicked "Lanjutkan" - show restore confirmation
                showRestoreConfirmation(backupData, preview, () => {
                    // User confirmed - execute restore
                    executeRestore(backupData);
                });
            });

        } catch (error) {
            // Handle different types of errors
            let errorMessage = 'Gagal membaca file backup';

            if (error.message.includes('JSON')) {
                errorMessage = 'File bukan format JSON yang valid. Pastikan file adalah backup yang benar dari aplikasi ini.';
            } else if (error.message.includes('rusak')) {
                errorMessage = 'File backup rusak atau tidak dapat dibaca. Coba download ulang file backup.';
            } else if (error.message) {
                errorMessage += `: ${error.message}`;
            }

            showAlert(errorMessage, 'danger');
            console.error('File read error:', error);
        }
    });

    // Trigger file picker
    fileInput.click();
}

/**
 * Execute restore operation
 * @param {Object} backupData - Parsed backup data
 */
function executeRestore(backupData) {
    try {
        // Validate backup data before restore
        if (!backupData || !backupData.metadata || !backupData.data) {
            throw new Error('Data backup tidak valid atau rusak');
        }

        // Show loading indicator
        showAlert('Memulai proses restore...', 'info');

        // Execute restore
        const restoreService = new RestoreService();
        const result = restoreService.restoreBackup(backupData);

        if (!result.success) {
            // Show errors with detailed information
            let errorMessage = '<strong>Restore gagal!</strong><br>';

            if (result.errors && result.errors.length > 0) {
                errorMessage += result.errors.join('<br>');
            } else {
                errorMessage += 'Terjadi kesalahan yang tidak diketahui';
            }

            // Add troubleshooting tips
            errorMessage += '<br><br><small><strong>Saran:</strong><br>';
            errorMessage += '- Pastikan file backup tidak rusak<br>';
            errorMessage += '- Coba download ulang file backup<br>';
            errorMessage += '- Hubungi administrator jika masalah berlanjut</small>';

            showAlert(errorMessage, 'danger');
            console.error('Restore failed:', result);
            return;
        }

        // Show success message with details
        let successMessage = `
            <strong>Restore berhasil!</strong><br>
            ${result.message}
        `;

        if (result.autoBackup.created) {
            successMessage += `<br><small class="text-muted">Backup otomatis: ${result.autoBackup.filename}</small>`;
        }

        if (result.migration.performed) {
            successMessage += `<br><small class="text-info">Migrasi data dilakukan dari versi ${backupData.metadata.version}</small>`;
        }

        if (result.warnings.length > 0) {
            successMessage += `<br><br><strong>Peringatan:</strong><br>`;
            successMessage += result.warnings.map(w => `<small class="text-warning">⚠ ${w}</small>`).join('<br>');
        }

        showAlert(successMessage, 'success');

        // Reload application after 3 seconds
        setTimeout(() => {
            window.location.reload();
        }, 3000);

    } catch (error) {
        // Handle different types of errors
        let errorMessage = 'Error saat restore';

        if (error.name === 'QuotaExceededError') {
            errorMessage = 'Penyimpanan browser penuh. Tidak dapat restore data. Hapus data yang tidak diperlukan atau gunakan browser lain.';
        } else if (error.message.includes('localStorage')) {
            errorMessage = 'Gagal mengakses penyimpanan browser. Pastikan browser Anda mendukung localStorage dan tidak dalam mode private/incognito.';
        } else if (error.message) {
            errorMessage += `: ${error.message}`;
        }

        showAlert(errorMessage, 'danger');
        console.error('Restore error:', error);
    }
}

/**
 * Show alert message
 * @param {string} message - Alert message (can include HTML)
 * @param {string} type - Alert type (success, danger, warning, info)
 */
function showAlert(message, type = 'success') {
    try {
        // Remove any existing alerts of the same type to prevent stacking
        const existingAlerts = document.querySelectorAll(`.alert.alert-${type}.position-fixed`);
        existingAlerts.forEach(alert => alert.remove());

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px; max-width: 500px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        document.body.appendChild(alertDiv);

        // Auto-dismiss after timeout (longer for errors and warnings)
        const timeout = (type === 'danger' || type === 'warning') ? 8000 : 4000;
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, timeout);
    } catch (error) {
        // Fallback to console if alert fails
        console.error('Failed to show alert:', error);
        console.log(`Alert [${type}]:`, message);
    }
}

// ============================================================================
// Export services for use in other modules
// ============================================================================
// ============================================================================
// Export services for use in other modules
// ============================================================================

// Expose to global scope for tests and other modules (Node.js & Browser)
if (typeof globalThis !== 'undefined') {
    globalThis.RoleValidator = RoleValidator;
    globalThis.BackupValidationService = BackupValidationService;
    globalThis.BackupService = BackupService;
    globalThis.RestoreService = RestoreService;
    globalThis.AutoBackupService = AutoBackupService;
    globalThis.MigrationService = MigrationService;
    globalThis.APP_VERSION = APP_VERSION;
    globalThis.renderBackupRestore = renderBackupRestore;
}

// CommonJS exports for legacy support or specific test setups
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        RoleValidator,
        BackupValidationService,
        BackupService,
        RestoreService,
        AutoBackupService,
        MigrationService,
        APP_VERSION,
        renderBackupRestore
    };
}
