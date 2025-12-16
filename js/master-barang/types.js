/**
 * Master Barang Komprehensif - Type Definitions
 * Defines all data models and interfaces for the master barang system
 */

// ===== DATA MODELS =====

/**
 * Barang Model
 * @typedef {Object} Barang
 * @property {string} id - Unique identifier
 * @property {string} kode - Unique product code
 * @property {string} nama - Product name
 * @property {string} kategori_id - Reference to kategori
 * @property {string} kategori_nama - Denormalized category name for performance
 * @property {string} satuan_id - Reference to satuan
 * @property {string} satuan_nama - Denormalized unit name for performance
 * @property {number} harga_beli - Purchase price
 * @property {number} harga_jual - Selling price
 * @property {number} stok - Current stock
 * @property {number} stok_minimum - Minimum stock threshold
 * @property {string} deskripsi - Optional description
 * @property {'aktif'|'nonaktif'} status - Status
 * @property {number} created_at - Creation timestamp
 * @property {number} updated_at - Last update timestamp
 * @property {string} created_by - Creator user ID
 * @property {string} updated_by - Last updater user ID
 */

/**
 * Kategori Model
 * @typedef {Object} Kategori
 * @property {string} id - Unique identifier
 * @property {string} nama - Unique category name
 * @property {string} deskripsi - Optional description
 * @property {'aktif'|'nonaktif'} status - Status
 * @property {number} created_at - Creation timestamp
 * @property {number} updated_at - Last update timestamp
 * @property {string} created_by - Creator user ID
 * @property {string} updated_by - Last updater user ID
 */

/**
 * Satuan Model
 * @typedef {Object} Satuan
 * @property {string} id - Unique identifier
 * @property {string} nama - Unique unit name (PCS, DUS, KG, etc.)
 * @property {string} deskripsi - Optional description
 * @property {'aktif'|'nonaktif'} status - Status
 * @property {number} created_at - Creation timestamp
 * @property {number} updated_at - Last update timestamp
 * @property {string} created_by - Creator user ID
 * @property {string} updated_by - Last updater user ID
 */

/**
 * Audit Log Model
 * @typedef {Object} AuditLog
 * @property {string} id - Unique identifier
 * @property {'barang'|'kategori'|'satuan'} table_name - Table name
 * @property {string} record_id - ID of affected record
 * @property {'create'|'update'|'delete'|'import'|'export'|'bulk_operation'} action - Action type
 * @property {Object|null} old_data - Data before change (for update/delete)
 * @property {Object|null} new_data - Data after change (for create/update)
 * @property {string} user_id - User ID
 * @property {string} user_name - User name
 * @property {number} timestamp - Action timestamp
 * @property {string} ip_address - IP address
 * @property {string} user_agent - User agent
 * @property {Object} additional_info - Extra context (file name for import, etc.)
 */

// ===== INTERFACE DEFINITIONS =====

/**
 * Search Filter Options
 * @typedef {Object} SearchFilter
 * @property {string} searchTerm - Search term for kode, nama, or kategori
 * @property {string|null} kategori_id - Filter by category ID
 * @property {string|null} satuan_id - Filter by unit ID
 * @property {'aktif'|'nonaktif'|null} status - Filter by status
 * @property {number} page - Current page number
 * @property {number} limit - Items per page
 * @property {string} sortBy - Sort field
 * @property {'asc'|'desc'} sortOrder - Sort order
 */

/**
 * Pagination Result
 * @typedef {Object} PaginationResult
 * @property {Array} data - Array of items
 * @property {number} total - Total number of items
 * @property {number} page - Current page
 * @property {number} limit - Items per page
 * @property {number} totalPages - Total number of pages
 */

/**
 * Validation Result
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether validation passed
 * @property {Array<string>} errors - Array of error messages
 * @property {Array<string>} warnings - Array of warning messages
 */

/**
 * Import/Export Options
 * @typedef {Object} ImportExportOptions
 * @property {'excel'|'csv'} format - File format
 * @property {boolean} includeHeaders - Include headers in export
 * @property {SearchFilter|null} filters - Filters to apply for export
 * @property {Object} columnMapping - Column mapping for import
 */

/**
 * Bulk Operation Options
 * @typedef {Object} BulkOperationOptions
 * @property {'delete'|'update_category'|'update_unit'|'update_status'} operation - Operation type
 * @property {Array<string>} selectedIds - Array of selected item IDs
 * @property {Object|null} updateData - Data for update operations
 */

/**
 * Progress Tracking
 * @typedef {Object} ProgressTracker
 * @property {number} total - Total items to process
 * @property {number} processed - Items processed so far
 * @property {number} success - Successful operations
 * @property {number} failed - Failed operations
 * @property {Array<string>} errors - Array of error messages
 * @property {'pending'|'processing'|'completed'|'failed'} status - Current status
 */

// ===== CONSTANTS =====

/**
 * LocalStorage Keys
 */
export const STORAGE_KEYS = {
    BARANG: 'master_barang_data',
    KATEGORI: 'master_kategori_data',
    SATUAN: 'master_satuan_data',
    AUDIT_LOGS: 'master_barang_audit_logs',
    SETTINGS: 'master_barang_settings'
};

/**
 * Default Values
 */
export const DEFAULTS = {
    PAGE_SIZE: 20,
    SORT_BY: 'nama',
    SORT_ORDER: 'asc',
    STATUS: 'aktif',
    STOK_MINIMUM: 0
};

/**
 * Validation Rules
 */
export const VALIDATION_RULES = {
    BARANG: {
        KODE: {
            MIN_LENGTH: 2,
            MAX_LENGTH: 20,
            PATTERN: /^[A-Za-z0-9\-]+$/
        },
        NAMA: {
            MIN_LENGTH: 2,
            MAX_LENGTH: 100
        },
        HARGA: {
            MIN_VALUE: 0,
            MAX_VALUE: 999999999
        },
        STOK: {
            MIN_VALUE: 0,
            MAX_VALUE: 999999999
        }
    },
    KATEGORI: {
        NAMA: {
            MIN_LENGTH: 2,
            MAX_LENGTH: 50
        },
        DESKRIPSI: {
            MAX_LENGTH: 200
        }
    },
    SATUAN: {
        NAMA: {
            MIN_LENGTH: 1,
            MAX_LENGTH: 20
        },
        DESKRIPSI: {
            MAX_LENGTH: 100
        }
    },
    BUSINESS: {
        MIN_PROFIT_MARGIN: 10 // Minimum profit margin percentage
    },
    BULK: {
        MAX_ITEMS: 100 // Maximum items for bulk operations
    },
    IMPORT: {
        MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
        ALLOWED_TYPES: ['xlsx', 'xls', 'csv'],
        MAX_ROWS: 1000
    }
};

/**
 * File Upload Limits
 */
export const FILE_LIMITS = {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
    ALLOWED_EXTENSIONS: ['.xlsx', '.xls', '.csv']
};

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
    REQUIRED_FIELD: 'Field ini wajib diisi',
    INVALID_FORMAT: 'Format tidak valid',
    DUPLICATE_CODE: 'Kode barang sudah ada',
    DUPLICATE_NAME: 'Nama sudah ada',
    INVALID_PRICE: 'Harga harus berupa angka positif',
    INVALID_STOCK: 'Stok harus berupa angka positif',
    FILE_TOO_LARGE: 'Ukuran file terlalu besar (maksimal 5MB)',
    INVALID_FILE_TYPE: 'Tipe file tidak didukung',
    CATEGORY_IN_USE: 'Kategori tidak dapat dihapus karena masih digunakan',
    UNIT_IN_USE: 'Satuan tidak dapat dihapus karena masih digunakan'
};

// Export all types for use in other modules
export default {
    STORAGE_KEYS,
    DEFAULTS,
    VALIDATION_RULES,
    FILE_LIMITS,
    ERROR_MESSAGES
};