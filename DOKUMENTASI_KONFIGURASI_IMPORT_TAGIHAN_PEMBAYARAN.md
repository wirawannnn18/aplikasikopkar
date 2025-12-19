# Dokumentasi Konfigurasi - Import Tagihan Pembayaran

## Daftar Isi
1. [Overview](#overview)
2. [System Configuration](#system-configuration)
3. [Application Configuration](#application-configuration)
4. [Database Configuration](#database-configuration)
5. [Security Configuration](#security-configuration)
6. [Performance Configuration](#performance-configuration)
7. [User Interface Configuration](#user-interface-configuration)
8. [Integration Configuration](#integration-configuration)
9. [Monitoring Configuration](#monitoring-configuration)
10. [Environment-Specific Configuration](#environment-specific-configuration)

## Overview

Sistem Import Tagihan Pembayaran memiliki berbagai opsi konfigurasi yang dapat disesuaikan dengan kebutuhan organisasi. Konfigurasi dibagi menjadi beberapa kategori untuk memudahkan pengelolaan dan maintenance.

### Configuration Hierarchy
1. **System Level**: Konfigurasi server dan infrastruktur
2. **Application Level**: Konfigurasi aplikasi dan fitur
3. **Database Level**: Konfigurasi database dan storage
4. **User Level**: Konfigurasi per user atau role
5. **Runtime Level**: Konfigurasi yang dapat diubah saat runtime

## System Configuration

### File Upload Configuration

#### Maximum File Size
```javascript
// js/import-tagihan/config.js
const fileConfig = {
    maxFileSize: 5 * 1024 * 1024,  // 5MB (default)
    // Alternative values:
    // 10 * 1024 * 1024,  // 10MB for larger organizations
    // 2 * 1024 * 1024,   // 2MB for smaller systems
};
```

**Database Configuration:**
```sql
UPDATE import_config 
SET config_value = '10485760'  -- 10MB in bytes
WHERE config_key = 'max_file_size';
```

**Considerations:**
- Larger files require more memory and processing time
- Consider server memory and timeout limits
- Balance between user convenience and system performance

#### Supported File Formats
```javascript
const fileConfig = {
    supportedFormats: ['csv', 'xlsx'],  // Default
    // Alternative configurations:
    // ['csv'],                         // CSV only for better performance
    // ['csv', 'xlsx', 'xls'],         // Include legacy Excel format
};
```

**Database Configuration:**
```sql
UPDATE import_config 
SET config_value = '["csv","xlsx"]'  -- JSON array
WHERE config_key = 'supported_formats';
```

#### File Storage Configuration
```javascript
const storageConfig = {
    uploadPath: '/uploads/import-temp/',
    reportsPath: '/reports/import-reports/',
    archivePath: '/archive/import-archive/',
    tempFileRetention: 24 * 60 * 60 * 1000,  // 24 hours
    reportRetention: 30 * 24 * 60 * 60 * 1000,  // 30 days
};
```

### Processing Configuration

#### Batch Processing Limits
```javascript
const processingConfig = {
    maxBatchSize: 1000,           // Maximum rows per batch
    batchChunkSize: 50,           // Process in chunks of 50
    maxConcurrentBatches: 3,      // Maximum concurrent processing
    processingTimeout: 30 * 60 * 1000,  // 30 minutes
};
```

**Database Configuration:**
```sql
-- Maximum batch size
UPDATE import_config 
SET config_value = '500' 
WHERE config_key = 'max_batch_size';

-- Processing timeout in minutes
UPDATE import_config 
SET config_value = '45' 
WHERE config_key = 'timeout_minutes';

-- Concurrent batch limit
INSERT INTO import_config (config_key, config_value, updated_by) 
VALUES ('max_concurrent_batches', '2', 'admin')
ON DUPLICATE KEY UPDATE config_value = '2';
```

#### Memory Management
```javascript
const memoryConfig = {
    maxMemoryUsage: 512 * 1024 * 1024,  // 512MB
    garbageCollectionInterval: 1000,     // 1 second
    memoryWarningThreshold: 0.8,         // 80% of max memory
    forceGCThreshold: 0.9,              // 90% of max memory
};
```

## Application Configuration

### Feature Flags
```javascript
// js/feature-flags.js
const importFeatureFlags = {
    enabled: true,                    // Master enable/disable
    fileUpload: true,                // File upload functionality
    preview: true,                   // Preview before processing
    batchProcessing: true,           // Batch processing
    progressTracking: true,          // Progress indicators
    cancellation: true,              // Cancel processing
    rollback: true,                  // Rollback on errors
    auditLogging: true,              // Comprehensive audit logs
    reporting: true,                 // Report generation
    adminConfig: true,               // Admin configuration interface
};
```

**Database Configuration:**
```sql
-- Enable/disable entire feature
UPDATE import_config 
SET config_value = 'true' 
WHERE config_key = 'import_enabled';

-- Individual feature flags
INSERT INTO import_config (config_key, config_value, updated_by) VALUES
('feature_preview', 'true', 'admin'),
('feature_cancellation', 'true', 'admin'),
('feature_rollback', 'true', 'admin'),
('feature_audit_logging', 'true', 'admin')
ON DUPLICATE KEY UPDATE 
config_value = VALUES(config_value),
updated_by = VALUES(updated_by);
```

### Validation Configuration
```javascript
const validationConfig = {
    strictMemberValidation: true,     // Strict member number/name matching
    allowPartialPayments: true,       // Allow payments less than full balance
    validateBalanceRealtime: true,    // Check balance at processing time
    skipInvalidRows: true,            // Skip invalid rows, process valid ones
    maxValidationErrors: 100,         // Stop validation after 100 errors
};
```

**Business Rules Configuration:**
```sql
-- Validation rules
INSERT INTO import_config (config_key, config_value, updated_by) VALUES
('strict_member_validation', 'true', 'admin'),
('allow_partial_payments', 'true', 'admin'),
('realtime_balance_check', 'true', 'admin'),
('max_validation_errors', '100', 'admin')
ON DUPLICATE KEY UPDATE 
config_value = VALUES(config_value);
```

### Error Handling Configuration
```javascript
const errorConfig = {
    maxRetryAttempts: 3,              // Retry failed operations
    retryDelay: 5000,                 // 5 seconds between retries
    rollbackOnCriticalError: true,    // Auto-rollback on critical errors
    continueOnNonCriticalError: true, // Continue processing on minor errors
    detailedErrorLogging: true,       // Log detailed error information
};
```

## Database Configuration

### Connection Configuration
```javascript
const dbConfig = {
    connectionPool: {
        min: 2,                       // Minimum connections
        max: 10,                      // Maximum connections
        acquireTimeoutMillis: 30000,  // 30 seconds
        idleTimeoutMillis: 600000,    // 10 minutes
    },
    queryTimeout: 30000,              // 30 seconds
    transactionTimeout: 300000,       // 5 minutes
};
```

### Table Configuration
```sql
-- Configure auto-increment starting values
ALTER TABLE import_batches AUTO_INCREMENT = 1000;
ALTER TABLE import_audit_log AUTO_INCREMENT = 10000;

-- Configure table storage engine (if MySQL)
ALTER TABLE import_batches ENGINE = InnoDB;
ALTER TABLE import_audit_log ENGINE = InnoDB;

-- Configure character set
ALTER TABLE import_batches CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE import_audit_log CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Index Configuration
```sql
-- Performance indexes
CREATE INDEX idx_import_batches_status_date ON import_batches(status, uploaded_at);
CREATE INDEX idx_import_batches_user_date ON import_batches(uploaded_by, uploaded_at);
CREATE INDEX idx_import_audit_batch_action ON import_audit_log(batch_id, action);
CREATE INDEX idx_import_audit_date_action ON import_audit_log(created_at, action);

-- Composite indexes for common queries
CREATE INDEX idx_import_batches_composite ON import_batches(status, uploaded_by, uploaded_at);
CREATE INDEX idx_import_audit_composite ON import_audit_log(batch_id, action, created_at);
```

### Data Retention Configuration
```sql
-- Configure data retention policies
INSERT INTO import_config (config_key, config_value, updated_by) VALUES
('batch_retention_days', '365', 'admin'),        -- Keep batches for 1 year
('audit_retention_days', '2555', 'admin'),       -- Keep audit logs for 7 years
('temp_file_retention_hours', '24', 'admin'),    -- Keep temp files for 24 hours
('report_retention_days', '90', 'admin')         -- Keep reports for 90 days
ON DUPLICATE KEY UPDATE 
config_value = VALUES(config_value);
```

## Security Configuration

### Access Control Configuration
```javascript
const securityConfig = {
    requireAuthentication: true,      // Require user authentication
    requireAuthorization: true,       // Check user permissions
    allowedRoles: ['kasir', 'admin'], // Roles that can use import
    adminOnlyConfig: true,            // Only admin can change config
    sessionTimeout: 30 * 60 * 1000,  // 30 minutes
};
```

**Database Configuration:**
```sql
-- Role-based permissions
INSERT INTO role_permissions (role_id, permission) VALUES
(1, 'import_tagihan_upload'),     -- kasir can upload
(1, 'import_tagihan_process'),    -- kasir can process
(1, 'import_tagihan_view'),       -- kasir can view results
(2, 'import_tagihan_upload'),     -- admin can upload
(2, 'import_tagihan_process'),    -- admin can process
(2, 'import_tagihan_view'),       -- admin can view results
(2, 'import_tagihan_config'),     -- admin can configure
(2, 'import_tagihan_audit')       -- admin can view audit logs
ON DUPLICATE KEY UPDATE permission = VALUES(permission);
```

### File Security Configuration
```javascript
const fileSecurityConfig = {
    allowedMimeTypes: [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    scanForMalware: false,            // Enable if antivirus available
    quarantineDirectory: '/quarantine/import/',
    maxFilenameLength: 255,
    allowedFilenameChars: /^[a-zA-Z0-9._-]+$/,
};
```

### Data Encryption Configuration
```javascript
const encryptionConfig = {
    encryptSensitiveData: false,      // Encrypt member data in logs
    encryptionAlgorithm: 'AES-256-GCM',
    keyRotationInterval: 90 * 24 * 60 * 60 * 1000,  // 90 days
    hashAuditData: true,              // Hash audit log data
};
```

## Performance Configuration

### Caching Configuration
```javascript
const cacheConfig = {
    enableCaching: true,              // Enable caching
    memberDataCache: {
        enabled: true,
        ttl: 5 * 60 * 1000,          // 5 minutes
        maxSize: 1000,                // Max 1000 entries
    },
    balanceCache: {
        enabled: true,
        ttl: 1 * 60 * 1000,          // 1 minute
        maxSize: 500,                 // Max 500 entries
    },
    configCache: {
        enabled: true,
        ttl: 30 * 60 * 1000,         // 30 minutes
        maxSize: 100,                 // Max 100 entries
    },
};
```

### Database Performance Configuration
```sql
-- Configure MySQL for better performance
SET GLOBAL innodb_buffer_pool_size = 1073741824;  -- 1GB
SET GLOBAL innodb_log_file_size = 268435456;      -- 256MB
SET GLOBAL innodb_flush_log_at_trx_commit = 2;    -- Better performance
SET GLOBAL query_cache_size = 67108864;           -- 64MB
SET GLOBAL query_cache_type = 1;                  -- Enable query cache

-- Configure connection limits
SET GLOBAL max_connections = 200;
SET GLOBAL max_user_connections = 50;
```

### Processing Performance Configuration
```javascript
const performanceConfig = {
    useWebWorkers: true,              // Use web workers for heavy processing
    workerPoolSize: 4,                // Number of web workers
    batchProcessingDelay: 100,        // Delay between batch items (ms)
    progressUpdateInterval: 1000,     // Update progress every 1 second
    memoryOptimization: true,         // Enable memory optimization
    lazyLoading: true,                // Lazy load large datasets
};
```

## User Interface Configuration

### Display Configuration
```javascript
const uiConfig = {
    previewRowLimit: 100,             // Show max 100 rows in preview
    paginationSize: 25,               // 25 rows per page
    autoRefreshInterval: 30000,       // Auto-refresh every 30 seconds
    showProgressDetails: true,        // Show detailed progress info
    enableDarkMode: false,            // Dark mode support
    language: 'id',                   // Indonesian language
};
```

**Database Configuration:**
```sql
-- UI preferences
INSERT INTO import_config (config_key, config_value, updated_by) VALUES
('ui_preview_limit', '100', 'admin'),
('ui_pagination_size', '25', 'admin'),
('ui_auto_refresh', '30000', 'admin'),
('ui_show_progress_details', 'true', 'admin'),
('ui_language', 'id', 'admin')
ON DUPLICATE KEY UPDATE 
config_value = VALUES(config_value);
```

### Notification Configuration
```javascript
const notificationConfig = {
    enableNotifications: true,        // Enable browser notifications
    notifyOnCompletion: true,         // Notify when processing completes
    notifyOnError: true,              // Notify on errors
    notificationTimeout: 5000,        // 5 seconds
    soundNotifications: false,        // Audio notifications
};
```

### Theme Configuration
```css
/* CSS Custom Properties for theming */
:root {
    --import-primary-color: #007bff;
    --import-success-color: #28a745;
    --import-warning-color: #ffc107;
    --import-error-color: #dc3545;
    --import-background-color: #f8f9fa;
    --import-border-color: #dee2e6;
    --import-text-color: #212529;
}
```

## Integration Configuration

### Payment System Integration
```javascript
const paymentIntegrationConfig = {
    useExistingPaymentEngine: true,   // Use existing pembayaranHutangPiutang.js
    validateBeforeProcessing: true,   // Validate with payment system
    createJournalEntries: true,       // Create accounting journal entries
    updateMemberBalances: true,       // Update member balances
    sendNotifications: false,         // Send payment notifications
};
```

### Accounting Integration
```javascript
const accountingIntegrationConfig = {
    useExistingCOA: true,             // Use existing Chart of Accounts
    autoCreateJournals: true,         // Auto-create journal entries
    journalReference: 'IMPORT',       // Journal reference prefix
    validateCOAMapping: true,         // Validate account mappings
    doubleEntryValidation: true,      // Validate double-entry rules
};
```

**Database Configuration:**
```sql
-- Account mapping for import transactions
INSERT INTO import_config (config_key, config_value, updated_by) VALUES
('coa_hutang_account', '2100', 'admin'),      -- Hutang account
('coa_piutang_account', '1200', 'admin'),     -- Piutang account
('coa_kas_account', '1100', 'admin'),         -- Cash account
('journal_reference_prefix', 'IMP', 'admin')  -- Journal reference
ON DUPLICATE KEY UPDATE 
config_value = VALUES(config_value);
```

### Audit Integration
```javascript
const auditIntegrationConfig = {
    useExistingAuditSystem: true,     // Integrate with existing audit
    logAllOperations: true,           // Log all import operations
    logDataChanges: true,             // Log data changes
    logUserActions: true,             // Log user actions
    retainAuditLogs: true,            // Retain audit logs
};
```

## Monitoring Configuration

### Logging Configuration
```javascript
const loggingConfig = {
    logLevel: 'INFO',                 // DEBUG, INFO, WARN, ERROR
    logToFile: true,                  // Log to file
    logToDatabase: true,              // Log to database
    logToConsole: false,              // Log to browser console
    maxLogFileSize: 10 * 1024 * 1024, // 10MB
    maxLogFiles: 5,                   // Keep 5 log files
};
```

**Log4j-style Configuration:**
```properties
# import-logging.properties
log4j.rootLogger=INFO, file, database

# File appender
log4j.appender.file=org.apache.log4j.RollingFileAppender
log4j.appender.file.File=/var/log/koperasi/import.log
log4j.appender.file.MaxFileSize=10MB
log4j.appender.file.MaxBackupIndex=5
log4j.appender.file.layout=org.apache.log4j.PatternLayout
log4j.appender.file.layout.ConversionPattern=%d{yyyy-MM-dd HH:mm:ss} %-5p %c{1}:%L - %m%n

# Database appender
log4j.appender.database=org.apache.log4j.jdbc.JDBCAppender
log4j.appender.database.URL=jdbc:mysql://localhost:3306/koperasi_db
log4j.appender.database.driver=com.mysql.cj.jdbc.Driver
log4j.appender.database.user=logger_user
log4j.appender.database.password=logger_password
log4j.appender.database.sql=INSERT INTO import_audit_log (batch_id, action, details, created_by) VALUES ('SYSTEM', 'LOG', '%m', 'system')
```

### Metrics Configuration
```javascript
const metricsConfig = {
    collectMetrics: true,             // Collect performance metrics
    metricsInterval: 60000,           // Collect every minute
    retainMetrics: 30 * 24 * 60 * 60 * 1000, // 30 days
    exportMetrics: false,             // Export to external system
    metricsEndpoint: '/api/metrics',  // Metrics API endpoint
};
```

### Alerting Configuration
```javascript
const alertingConfig = {
    enableAlerts: true,               // Enable alerting
    errorThreshold: 10,               // Alert after 10 errors
    performanceThreshold: 300000,     // Alert if processing > 5 minutes
    diskSpaceThreshold: 0.9,          // Alert at 90% disk usage
    memoryThreshold: 0.8,             // Alert at 80% memory usage
    alertChannels: ['email', 'log'],  // Alert channels
};
```

## Environment-Specific Configuration

### Development Environment
```javascript
const devConfig = {
    debug: true,                      // Enable debug mode
    mockData: true,                   // Use mock data for testing
    skipValidation: false,            // Don't skip validation even in dev
    logLevel: 'DEBUG',                // Verbose logging
    maxFileSize: 1 * 1024 * 1024,    // 1MB for faster testing
    maxBatchSize: 10,                 // Small batches for testing
};
```

### Staging Environment
```javascript
const stagingConfig = {
    debug: false,                     // Disable debug mode
    mockData: false,                  // Use real data
    skipValidation: false,            // Full validation
    logLevel: 'INFO',                 // Standard logging
    maxFileSize: 5 * 1024 * 1024,    // 5MB
    maxBatchSize: 100,                // Medium batches
};
```

### Production Environment
```javascript
const prodConfig = {
    debug: false,                     // No debug mode
    mockData: false,                  // Real data only
    skipValidation: false,            // Full validation
    logLevel: 'WARN',                 // Minimal logging
    maxFileSize: 10 * 1024 * 1024,   // 10MB
    maxBatchSize: 1000,               // Full batches
    enableCaching: true,              // Enable all caching
    enableCompression: true,          // Enable compression
};
```

## Configuration Management

### Configuration Loading
```javascript
// js/import-tagihan/ConfigManager.js
class ConfigManager {
    constructor() {
        this.config = {};
        this.loadOrder = [
            'default',      // Default configuration
            'environment',  // Environment-specific
            'database',     // Database configuration
            'user',         // User preferences
            'runtime'       // Runtime overrides
        ];
    }

    async loadConfiguration() {
        for (const source of this.loadOrder) {
            const config = await this.loadFromSource(source);
            this.config = { ...this.config, ...config };
        }
        return this.config;
    }

    async loadFromSource(source) {
        switch (source) {
            case 'database':
                return await this.loadFromDatabase();
            case 'environment':
                return this.loadFromEnvironment();
            case 'user':
                return this.loadFromUserPreferences();
            default:
                return this.loadDefaultConfig();
        }
    }

    async loadFromDatabase() {
        const query = 'SELECT config_key, config_value FROM import_config';
        const results = await database.query(query);
        
        const config = {};
        for (const row of results) {
            try {
                config[row.config_key] = JSON.parse(row.config_value);
            } catch (e) {
                config[row.config_key] = row.config_value;
            }
        }
        return config;
    }
}
```

### Configuration Validation
```javascript
class ConfigValidator {
    static validate(config) {
        const errors = [];

        // Validate file size
        if (config.maxFileSize > 50 * 1024 * 1024) {
            errors.push('maxFileSize cannot exceed 50MB');
        }

        // Validate batch size
        if (config.maxBatchSize > 10000) {
            errors.push('maxBatchSize cannot exceed 10000');
        }

        // Validate timeout
        if (config.processingTimeout > 2 * 60 * 60 * 1000) {
            errors.push('processingTimeout cannot exceed 2 hours');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}
```

### Configuration Updates
```sql
-- Stored procedure for safe configuration updates
DELIMITER //
CREATE PROCEDURE UpdateImportConfig(
    IN p_config_key VARCHAR(100),
    IN p_config_value TEXT,
    IN p_updated_by VARCHAR(50)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    
    -- Validate configuration key
    IF p_config_key NOT REGEXP '^[a-z_]+$' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid configuration key format';
    END IF;
    
    -- Update or insert configuration
    INSERT INTO import_config (config_key, config_value, updated_by)
    VALUES (p_config_key, p_config_value, p_updated_by)
    ON DUPLICATE KEY UPDATE
        config_value = VALUES(config_value),
        updated_by = VALUES(updated_by),
        updated_at = CURRENT_TIMESTAMP;
    
    -- Log configuration change
    INSERT INTO import_audit_log (batch_id, action, details, created_by)
    VALUES ('CONFIG', 'CONFIG_UPDATE', 
            JSON_OBJECT('key', p_config_key, 'value', p_config_value),
            p_updated_by);
    
    COMMIT;
END //
DELIMITER ;
```

## Configuration Examples

### Small Organization Setup
```sql
-- Configuration for small organization (< 100 members)
CALL UpdateImportConfig('max_file_size', '2097152', 'admin');        -- 2MB
CALL UpdateImportConfig('max_batch_size', '50', 'admin');            -- 50 transactions
CALL UpdateImportConfig('timeout_minutes', '15', 'admin');           -- 15 minutes
CALL UpdateImportConfig('ui_preview_limit', '50', 'admin');          -- 50 rows preview
CALL UpdateImportConfig('enable_caching', 'false', 'admin');         -- Disable caching
```

### Medium Organization Setup
```sql
-- Configuration for medium organization (100-1000 members)
CALL UpdateImportConfig('max_file_size', '5242880', 'admin');        -- 5MB
CALL UpdateImportConfig('max_batch_size', '200', 'admin');           -- 200 transactions
CALL UpdateImportConfig('timeout_minutes', '30', 'admin');           -- 30 minutes
CALL UpdateImportConfig('ui_preview_limit', '100', 'admin');         -- 100 rows preview
CALL UpdateImportConfig('enable_caching', 'true', 'admin');          -- Enable caching
```

### Large Organization Setup
```sql
-- Configuration for large organization (1000+ members)
CALL UpdateImportConfig('max_file_size', '10485760', 'admin');       -- 10MB
CALL UpdateImportConfig('max_batch_size', '1000', 'admin');          -- 1000 transactions
CALL UpdateImportConfig('timeout_minutes', '60', 'admin');           -- 60 minutes
CALL UpdateImportConfig('ui_preview_limit', '200', 'admin');         -- 200 rows preview
CALL UpdateImportConfig('enable_caching', 'true', 'admin');          -- Enable caching
CALL UpdateImportConfig('max_concurrent_batches', '3', 'admin');     -- 3 concurrent batches
```

---

**Note**: Konfigurasi harus disesuaikan dengan kebutuhan spesifik organisasi dan kapasitas sistem. Selalu test konfigurasi di environment staging sebelum diterapkan di production.