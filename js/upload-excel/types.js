/**
 * Type definitions for Upload Master Barang Excel feature
 * 
 * This file contains all TypeScript-style JSDoc type definitions
 * for data models and interfaces used throughout the upload system.
 */

/**
 * @typedef {Object} UploadSession
 * @property {string} id - Unique session identifier
 * @property {string} timestamp - ISO8601 timestamp
 * @property {string} user - Username who initiated upload
 * @property {string} fileName - Original file name
 * @property {number} fileSize - File size in bytes
 * @property {number} recordCount - Number of records in file
 * @property {'pending'|'processing'|'completed'|'failed'} status - Current session status
 * @property {ValidationResults} validationResults - Validation results
 * @property {ImportResults} importResults - Import results
 * @property {AuditEntry[]} auditLog - Audit log entries
 */

/**
 * @typedef {Object} ValidationResults
 * @property {ValidationError[]} errors - Validation errors
 * @property {ValidationError[]} warnings - Validation warnings
 */

/**
 * @typedef {Object} ImportResults
 * @property {number} created - Number of records created
 * @property {number} updated - Number of records updated
 * @property {number} failed - Number of records failed
 * @property {number} totalProcessed - Total records processed
 */

/**
 * @typedef {Object} ValidationError
 * @property {'format'|'business'|'integrity'} type - Error type
 * @property {string} field - Field name causing error
 * @property {number} row - Row number (1-based)
 * @property {string} message - Human-readable error message
 * @property {'error'|'warning'} severity - Error severity
 * @property {string} code - Error code for programmatic handling
 */

/**
 * @typedef {Object} BarangData
 * @property {string} kode - Product code (required, unique, max 20 chars)
 * @property {string} nama - Product name (required, max 100 chars)
 * @property {string} kategori - Category (required, lowercase)
 * @property {string} satuan - Unit (required, lowercase)
 * @property {number} harga_beli - Purchase price (required, positive)
 * @property {number} stok - Stock quantity (required, non-negative)
 * @property {string} [supplier] - Supplier name (optional, max 100 chars)
 * @property {string} created_at - Creation timestamp (ISO8601)
 * @property {string} updated_at - Last update timestamp (ISO8601)
 */

/**
 * @typedef {Object} AuditEntry
 * @property {string} id - Unique audit entry ID
 * @property {string} timestamp - ISO8601 timestamp
 * @property {string} user - Username who performed action
 * @property {'upload'|'validate'|'import'|'rollback'} action - Action type
 * @property {Object} details - Action-specific details
 * @property {Object} [oldData] - Previous data state (for updates)
 * @property {Object} [newData] - New data state (for updates)
 * @property {string} sessionId - Associated upload session ID
 */

/**
 * @typedef {Object} CategoryData
 * @property {string} name - Category name (lowercase, unique)
 * @property {string} created_at - Creation timestamp
 * @property {number} usage_count - Number of products using this category
 */

/**
 * @typedef {Object} UnitData
 * @property {string} name - Unit name (lowercase, unique)
 * @property {string} created_at - Creation timestamp
 * @property {number} usage_count - Number of products using this unit
 */

/**
 * @typedef {Object} FileValidationResult
 * @property {boolean} isValid - Whether file is valid
 * @property {string} [error] - Error message if invalid
 * @property {string} format - Detected file format (csv|excel)
 * @property {number} size - File size in bytes
 * @property {string} encoding - Detected encoding
 */

/**
 * @typedef {Object} ProcessingProgress
 * @property {number} current - Current progress (0-100)
 * @property {number} total - Total items to process
 * @property {number} processed - Items processed so far
 * @property {string} status - Current status message
 * @property {number} startTime - Processing start timestamp
 * @property {number} [estimatedCompletion] - Estimated completion timestamp
 */

/**
 * @typedef {Object} ChunkProcessingResult
 * @property {BarangData[]} successful - Successfully processed records
 * @property {ValidationError[]} errors - Processing errors
 * @property {number} chunkIndex - Index of processed chunk
 * @property {number} processingTime - Time taken to process chunk (ms)
 */

/**
 * @typedef {Object} RollbackData
 * @property {string} sessionId - Session to rollback
 * @property {BarangData[]} originalData - Original data before import
 * @property {string[]} createdIds - IDs of records created during import
 * @property {Object[]} updatedRecords - Records that were updated
 * @property {string} timestamp - Rollback timestamp
 */

// Export types for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // Type definitions are available through JSDoc comments
        // No runtime exports needed for type-only definitions
    };
}