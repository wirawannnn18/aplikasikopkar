# Migration Procedures - Integrasi Pembayaran Hutang Piutang

## Overview
This document provides detailed procedures for migrating from separate payment systems to the integrated payment interface. The migration includes database schema updates, data migration, and system deployment.

## Table of Contents
1. [Pre-Migration Assessment](#pre-migration-assessment)
2. [Migration Planning](#migration-planning)
3. [Database Migration](#database-migration)
4. [Data Migration](#data-migration)
5. [Application Deployment](#application-deployment)
6. [Post-Migration Validation](#post-migration-validation)
7. [Rollback Procedures](#rollback-procedures)
8. [Troubleshooting](#troubleshooting)

## Pre-Migration Assessment

### 1. System Inventory

#### Current System Components
```bash
# Check current system files
ls -la js/pembayaranHutangPiutang.js
ls -la js/import-tagihan/
ls -la index.html

# Check database schema
mysql -u username -p -e "DESCRIBE transactions;"
mysql -u username -p -e "DESCRIBE audit_log;"

# Check data volume
mysql -u username -p -e "SELECT COUNT(*) FROM transactions;"
mysql -u username -p -e "SELECT MIN(tanggal), MAX(tanggal) FROM transactions;"
```

#### Dependencies Assessment
```bash
# Check browser compatibility requirements
# Minimum requirements:
# - Chrome 60+
# - Firefox 55+
# - Safari 12+
# - Edge 79+

# Check server requirements
# - PHP 7.4+ (if using PHP backend)
# - MySQL 5.7+ or MariaDB 10.2+
# - Apache 2.4+ or Nginx 1.16+
```

### 2. Data Assessment

#### Transaction Data Analysis
```sql
-- Analyze existing transaction data
SELECT 
    COUNT(*) as total_transactions,
    MIN(tanggal) as earliest_transaction,
    MAX(tanggal) as latest_transaction,
    COUNT(DISTINCT anggotaId) as unique_members,
    SUM(CASE WHEN jenisPembayaran = 'hutang' THEN 1 ELSE 0 END) as hutang_count,
    SUM(CASE WHEN jenisPembayaran = 'piutang' THEN 1 ELSE 0 END) as piutang_count
FROM transactions;

-- Check for data quality issues
SELECT 
    COUNT(*) as null_anggota_count
FROM transactions 
WHERE anggotaId IS NULL OR anggotaId = '';

SELECT 
    COUNT(*) as invalid_amounts
FROM transactions 
WHERE jumlah <= 0 OR jumlah IS NULL;

-- Check for orphaned records
SELECT t.id, t.anggotaId 
FROM transactions t 
LEFT JOIN anggota a ON t.anggotaId = a.id 
WHERE a.id IS NULL 
LIMIT 10;
```

#### Storage Requirements
```sql
-- Estimate storage requirements for new fields
SELECT 
    COUNT(*) * 10 as mode_field_bytes,
    COUNT(*) * 50 as batch_id_field_bytes,
    (COUNT(*) * 60) / 1024 / 1024 as estimated_mb_increase
FROM transactions;
```

### 3. Backup Strategy

#### Complete System Backup
```bash
#!/bin/bash
# backup-system.sh

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/integration_migration_$BACKUP_DATE"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u username -p --single-transaction --routines --triggers \
    koperasi_db > $BACKUP_DIR/database_backup.sql

# Backup application files
tar -czf $BACKUP_DIR/application_files.tar.gz \
    --exclude='.git' \
    --exclude='node_modules' \
    /var/www/html/

# Backup configuration files
cp /etc/apache2/sites-available/koperasi.conf $BACKUP_DIR/
cp /etc/nginx/sites-available/koperasi $BACKUP_DIR/

# Create backup manifest
cat > $BACKUP_DIR/backup_manifest.txt << EOF
Backup Date: $BACKUP_DATE
Database: koperasi_db
Application Path: /var/www/html/
Backup Contents:
- database_backup.sql
- application_files.tar.gz
- koperasi.conf (Apache config)
- koperasi (Nginx config)
EOF

echo "Backup completed: $BACKUP_DIR"
```

## Migration Planning

### 1. Migration Timeline

#### Phase 1: Preparation (Day 1-2)
- [ ] Complete system backup
- [ ] Set up staging environment
- [ ] Test migration scripts
- [ ] Prepare rollback procedures
- [ ] Notify users of upcoming changes

#### Phase 2: Database Migration (Day 3)
- [ ] Put system in maintenance mode
- [ ] Run database schema updates
- [ ] Migrate existing transaction data
- [ ] Validate data integrity
- [ ] Test database performance

#### Phase 3: Application Deployment (Day 4)
- [ ] Deploy new application files
- [ ] Update configuration files
- [ ] Test integration functionality
- [ ] Validate user permissions
- [ ] Perform smoke tests

#### Phase 4: Validation and Go-Live (Day 5)
- [ ] Complete end-to-end testing
- [ ] User acceptance testing
- [ ] Performance validation
- [ ] Remove maintenance mode
- [ ] Monitor system stability

### 2. Risk Assessment

#### High Risk Items
- **Data Loss**: Mitigated by comprehensive backups
- **Extended Downtime**: Mitigated by staging environment testing
- **User Confusion**: Mitigated by training and documentation
- **Performance Degradation**: Mitigated by performance testing

#### Mitigation Strategies
```bash
# Staging environment setup
cp -r /var/www/html/ /var/www/staging/
mysql -e "CREATE DATABASE koperasi_staging;"
mysql koperasi_staging < /backup/database_backup.sql

# Performance baseline
ab -n 1000 -c 10 http://localhost/pembayaran-hutang-piutang
```

## Database Migration

### 1. Schema Migration Scripts

#### Migration Script 001: Add Mode and Batch Fields
```sql
-- File: migrations/001_add_mode_batch_fields.sql

-- Start transaction
START TRANSACTION;

-- Add mode field with default value
ALTER TABLE transactions 
ADD COLUMN mode VARCHAR(10) DEFAULT 'manual' NOT NULL
COMMENT 'Payment mode: manual or import';

-- Add batch ID field
ALTER TABLE transactions 
ADD COLUMN batchId VARCHAR(50) NULL
COMMENT 'Batch identifier for import transactions';

-- Create indexes for performance
CREATE INDEX idx_transactions_mode ON transactions(mode);
CREATE INDEX idx_transactions_batch_id ON transactions(batchId);
CREATE INDEX idx_transactions_mode_date ON transactions(mode, tanggal);

-- Add constraints
ALTER TABLE transactions 
ADD CONSTRAINT chk_transactions_mode 
CHECK (mode IN ('manual', 'import'));

-- Update existing records to have mode = 'manual'
UPDATE transactions 
SET mode = 'manual' 
WHERE mode IS NULL OR mode = '';

-- Verify update
SELECT COUNT(*) as updated_records 
FROM transactions 
WHERE mode = 'manual';

-- Commit transaction
COMMIT;
```

#### Migration Script 002: Enhanced Audit Log
```sql
-- File: migrations/002_enhanced_audit_log.sql

START TRANSACTION;

-- Create enhanced audit log table
CREATE TABLE audit_log_enhanced (
    id VARCHAR(50) PRIMARY KEY,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(50) NOT NULL,
    mode VARCHAR(10) NOT NULL DEFAULT 'manual',
    userId VARCHAR(50) NOT NULL,
    sessionId VARCHAR(100) NOT NULL,
    transactionId VARCHAR(50) NULL,
    anggotaId VARCHAR(50) NULL,
    jenis VARCHAR(10) NULL,
    jumlah DECIMAL(15,2) NULL,
    saldoSebelum DECIMAL(15,2) NULL,
    saldoSesudah DECIMAL(15,2) NULL,
    ipAddress VARCHAR(45) NULL,
    userAgent TEXT NULL,
    additionalData JSON NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_audit_timestamp (timestamp),
    INDEX idx_audit_action (action),
    INDEX idx_audit_mode (mode),
    INDEX idx_audit_user (userId),
    INDEX idx_audit_session (sessionId),
    INDEX idx_audit_transaction (transactionId),
    INDEX idx_audit_anggota (anggotaId),
    
    -- Foreign key constraints
    CONSTRAINT fk_audit_user 
        FOREIGN KEY (userId) REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_audit_transaction 
        FOREIGN KEY (transactionId) REFERENCES transactions(id) 
        ON DELETE SET NULL,
    CONSTRAINT fk_audit_anggota 
        FOREIGN KEY (anggotaId) REFERENCES anggota(id) 
        ON DELETE SET NULL,
        
    -- Check constraints
    CONSTRAINT chk_audit_mode 
        CHECK (mode IN ('manual', 'import', 'system')),
    CONSTRAINT chk_audit_jenis 
        CHECK (jenis IS NULL OR jenis IN ('hutang', 'piutang'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrate existing audit logs (if any)
INSERT INTO audit_log_enhanced (
    id, timestamp, action, mode, userId, sessionId, 
    transactionId, anggotaId, additionalData
)
SELECT 
    CONCAT('MIGRATED_', id) as id,
    timestamp,
    action,
    'manual' as mode,
    userId,
    COALESCE(sessionId, 'UNKNOWN') as sessionId,
    transactionId,
    anggotaId,
    JSON_OBJECT('migrated', true, 'original_id', id) as additionalData
FROM audit_log 
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 YEAR);

COMMIT;
```

### 2. Migration Execution

#### Automated Migration Runner
```javascript
// File: scripts/run-migration.js
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

class MigrationRunner {
    constructor(config) {
        this.config = config;
        this.connection = null;
    }
    
    async connect() {
        this.connection = await mysql.createConnection(this.config.database);
        console.log('Connected to database');
    }
    
    async disconnect() {
        if (this.connection) {
            await this.connection.end();
            console.log('Disconnected from database');
        }
    }
    
    async runMigration(migrationFile) {
        console.log(`Running migration: ${migrationFile}`);
        
        try {
            const sql = await fs.readFile(migrationFile, 'utf8');
            const statements = sql.split(';').filter(stmt => stmt.trim());
            
            for (const statement of statements) {
                if (statement.trim()) {
                    await this.connection.execute(statement);
                }
            }
            
            console.log(`Migration completed: ${migrationFile}`);
            
        } catch (error) {
            console.error(`Migration failed: ${migrationFile}`, error);
            throw error;
        }
    }
    
    async runAllMigrations() {
        const migrationsDir = path.join(__dirname, '../migrations');
        const files = await fs.readdir(migrationsDir);
        const migrationFiles = files
            .filter(file => file.endsWith('.sql'))
            .sort();
        
        for (const file of migrationFiles) {
            const filePath = path.join(migrationsDir, file);
            await this.runMigration(filePath);
        }
    }
    
    async validateMigration() {
        console.log('Validating migration...');
        
        // Check if new columns exist
        const [columns] = await this.connection.execute(`
            SHOW COLUMNS FROM transactions 
            WHERE Field IN ('mode', 'batchId')
        `);
        
        if (columns.length !== 2) {
            throw new Error('Migration validation failed: missing columns');
        }
        
        // Check if data was migrated correctly
        const [unmigrated] = await this.connection.execute(`
            SELECT COUNT(*) as count 
            FROM transactions 
            WHERE mode IS NULL OR mode = ''
        `);
        
        if (unmigrated[0].count > 0) {
            throw new Error('Migration validation failed: unmigrated data');
        }
        
        // Check if audit table exists
        const [auditTable] = await this.connection.execute(`
            SHOW TABLES LIKE 'audit_log_enhanced'
        `);
        
        if (auditTable.length === 0) {
            throw new Error('Migration validation failed: audit table not created');
        }
        
        console.log('Migration validation passed');
    }
}

// Usage
async function main() {
    const config = {
        database: {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'koperasi_db'
        }
    };
    
    const runner = new MigrationRunner(config);
    
    try {
        await runner.connect();
        await runner.runAllMigrations();
        await runner.validateMigration();
        console.log('All migrations completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await runner.disconnect();
    }
}

if (require.main === module) {
    main();
}
```

## Data Migration

### 1. Transaction Data Migration

#### Update Existing Transactions
```sql
-- File: data-migration/update_existing_transactions.sql

-- Update all existing transactions to have mode = 'manual'
UPDATE transactions 
SET mode = 'manual' 
WHERE mode IS NULL OR mode = '';

-- Verify the update
SELECT 
    mode,
    COUNT(*) as count,
    MIN(tanggal) as earliest,
    MAX(tanggal) as latest
FROM transactions 
GROUP BY mode;

-- Check for any remaining null values
SELECT COUNT(*) as null_mode_count 
FROM transactions 
WHERE mode IS NULL;
```

#### Data Quality Fixes
```sql
-- File: data-migration/data_quality_fixes.sql

-- Fix any data quality issues found during assessment

-- Remove transactions with invalid amounts
DELETE FROM transactions 
WHERE jumlah <= 0 OR jumlah IS NULL;

-- Fix missing anggota names
UPDATE transactions t
JOIN anggota a ON t.anggotaId = a.id
SET t.anggotaNama = a.nama
WHERE t.anggotaNama IS NULL OR t.anggotaNama = '';

-- Fix invalid payment types
UPDATE transactions 
SET jenisPembayaran = 'hutang' 
WHERE jenisPembayaran NOT IN ('hutang', 'piutang');

-- Add missing timestamps
UPDATE transactions 
SET createdAt = tanggal 
WHERE createdAt IS NULL;
```

### 2. User Data Migration

#### Update User Permissions
```sql
-- File: data-migration/update_user_permissions.sql

-- Ensure all kasir users can access manual payments
UPDATE users 
SET permissions = JSON_SET(
    COALESCE(permissions, '{}'), 
    '$.pembayaran_manual', 
    true
) 
WHERE role = 'kasir';

-- Restrict import batch to admin users only
UPDATE users 
SET permissions = JSON_SET(
    COALESCE(permissions, '{}'), 
    '$.pembayaran_import', 
    CASE WHEN role = 'admin' THEN true ELSE false END
);

-- Add new permission for unified interface
UPDATE users 
SET permissions = JSON_SET(
    COALESCE(permissions, '{}'), 
    '$.pembayaran_integrated', 
    true
) 
WHERE role IN ('kasir', 'admin');
```

### 3. Configuration Migration

#### Update System Configuration
```javascript
// File: data-migration/update_system_config.js
const fs = require('fs').promises;

async function updateSystemConfig() {
    // Read existing config
    const configPath = 'config/app-config.js';
    let config = {};
    
    try {
        const configContent = await fs.readFile(configPath, 'utf8');
        config = JSON.parse(configContent);
    } catch (error) {
        console.log('Creating new config file');
    }
    
    // Add integration-specific configuration
    config.integration = {
        enabled: true,
        defaultTab: 'manual',
        rememberLastTab: true,
        unsavedDataWarning: true,
        tabPermissions: {
            manual: ['kasir', 'admin'],
            import: ['admin']
        },
        performance: {
            lazyLoadImport: true,
            cacheTimeout: 300000,
            maxBatchSize: 1000
        },
        audit: {
            logAllTransactions: true,
            logTabSwitches: true,
            logPermissionDenials: true
        }
    };
    
    // Update existing menu configuration
    if (config.menu) {
        // Remove separate import menu item
        config.menu = config.menu.filter(item => 
            item.id !== 'import-tagihan-pembayaran'
        );
        
        // Update pembayaran menu to point to integrated controller
        const pembayaranMenu = config.menu.find(item => 
            item.id === 'pembayaran-hutang-piutang'
        );
        
        if (pembayaranMenu) {
            pembayaranMenu.controller = 'pembayaranHutangPiutangIntegrated';
            pembayaranMenu.title = 'Pembayaran Hutang Piutang (Terintegrasi)';
        }
    }
    
    // Write updated config
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    console.log('System configuration updated');
}

updateSystemConfig().catch(console.error);
```

## Application Deployment

### 1. File Deployment

#### Deployment Script
```bash
#!/bin/bash
# File: scripts/deploy-integration.sh

set -e  # Exit on any error

DEPLOY_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/pre_integration_$DEPLOY_DATE"
WEB_ROOT="/var/www/html"

echo "Starting integration deployment..."

# Create backup of current files
echo "Creating backup..."
mkdir -p $BACKUP_DIR
cp -r $WEB_ROOT $BACKUP_DIR/

# Deploy new JavaScript files
echo "Deploying JavaScript files..."
cp js/pembayaranHutangPiutangIntegrated.js $WEB_ROOT/js/
cp -r js/shared/ $WEB_ROOT/js/
cp js/import-tagihan/ImportTagihanEnhanced.js $WEB_ROOT/js/import-tagihan/
cp js/pembayaranHutangPiutangEnhanced.js $WEB_ROOT/js/

# Deploy updated HTML
echo "Deploying HTML files..."
cp index.html $WEB_ROOT/

# Deploy CSS updates
echo "Deploying CSS files..."
cp css/integration.css $WEB_ROOT/css/

# Deploy configuration files
echo "Deploying configuration..."
cp config/integration-config.js $WEB_ROOT/config/

# Set proper permissions
echo "Setting permissions..."
chown -R www-data:www-data $WEB_ROOT
chmod -R 644 $WEB_ROOT
chmod -R 755 $WEB_ROOT/js
chmod -R 755 $WEB_ROOT/css

# Restart web server
echo "Restarting web server..."
systemctl restart apache2
# or: systemctl restart nginx

echo "Deployment completed successfully"
echo "Backup created at: $BACKUP_DIR"
```

### 2. Configuration Updates

#### Apache Virtual Host Update
```apache
# File: /etc/apache2/sites-available/koperasi.conf

<VirtualHost *:80>
    ServerName koperasi.local
    DocumentRoot /var/www/html
    
    # Enable mod_rewrite for SPA routing
    RewriteEngine On
    
    # Handle integration routes
    RewriteRule ^/pembayaran-hutang-piutang/?$ /index.html?page=pembayaran-integrated [QSA,L]
    RewriteRule ^/pembayaran-manual/?$ /index.html?page=pembayaran-integrated&tab=manual [QSA,L]
    RewriteRule ^/pembayaran-import/?$ /index.html?page=pembayaran-integrated&tab=import [QSA,L]
    
    # Fallback for other routes
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ /index.html [QSA,L]
    
    # Security headers
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    
    # Cache static assets
    <LocationMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 month"
        Header set Cache-Control "public, immutable"
    </LocationMatch>
    
    # Don't cache HTML files
    <LocationMatch "\.html$">
        ExpiresActive On
        ExpiresDefault "access plus 0 seconds"
        Header set Cache-Control "no-cache, no-store, must-revalidate"
    </LocationMatch>
    
    ErrorLog ${APACHE_LOG_DIR}/koperasi_error.log
    CustomLog ${APACHE_LOG_DIR}/koperasi_access.log combined
</VirtualHost>
```

### 3. Database Connection Updates

#### Updated Database Configuration
```javascript
// File: config/database-config.js
const DatabaseConfig = {
    production: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'koperasi_app',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'koperasi_db',
        connectionLimit: 20,
        acquireTimeout: 60000,
        timeout: 60000,
        reconnect: true,
        
        // Integration-specific settings
        multipleStatements: false,
        charset: 'utf8mb4',
        timezone: 'local',
        
        // Performance optimization
        supportBigNumbers: true,
        bigNumberStrings: true,
        dateStrings: false
    },
    
    staging: {
        host: 'localhost',
        user: 'koperasi_staging',
        password: process.env.STAGING_DB_PASSWORD,
        database: 'koperasi_staging',
        connectionLimit: 10
    },
    
    development: {
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'koperasi_dev',
        connectionLimit: 5,
        debug: true
    }
};

module.exports = DatabaseConfig;
```

## Post-Migration Validation

### 1. Functional Testing

#### Automated Test Suite
```javascript
// File: tests/post-migration-tests.js
const { expect } = require('chai');

describe('Post-Migration Validation', () => {
    let integrationController;
    let sharedServices;
    
    before(async () => {
        // Initialize components
        integrationController = new PembayaranHutangPiutangIntegrated();
        sharedServices = integrationController.sharedServices;
    });
    
    describe('Database Schema', () => {
        it('should have mode field in transactions table', async () => {
            const columns = await sharedServices.database.query(`
                SHOW COLUMNS FROM transactions WHERE Field = 'mode'
            `);
            expect(columns).to.have.length(1);
        });
        
        it('should have batchId field in transactions table', async () => {
            const columns = await sharedServices.database.query(`
                SHOW COLUMNS FROM transactions WHERE Field = 'batchId'
            `);
            expect(columns).to.have.length(1);
        });
        
        it('should have enhanced audit log table', async () => {
            const tables = await sharedServices.database.query(`
                SHOW TABLES LIKE 'audit_log_enhanced'
            `);
            expect(tables).to.have.length(1);
        });
    });
    
    describe('Data Migration', () => {
        it('should have all existing transactions with mode = manual', async () => {
            const [result] = await sharedServices.database.query(`
                SELECT COUNT(*) as count 
                FROM transactions 
                WHERE mode IS NULL OR mode = ''
            `);
            expect(result.count).to.equal(0);
        });
        
        it('should maintain transaction count after migration', async () => {
            const [result] = await sharedServices.database.query(`
                SELECT COUNT(*) as count FROM transactions
            `);
            expect(result.count).to.be.greaterThan(0);
        });
    });
    
    describe('Integration Functionality', () => {
        it('should be able to switch tabs', async () => {
            const result = await integrationController.switchTab('import');
            expect(result).to.be.true;
            expect(integrationController.activeTab).to.equal('import');
        });
        
        it('should process manual payments', async () => {
            const paymentData = {
                anggotaId: 'TEST001',
                anggotaNama: 'Test Member',
                jenisPembayaran: 'hutang',
                jumlah: 100000,
                kasir: 'test_kasir'
            };
            
            const result = await sharedServices.processPayment(paymentData, 'manual');
            expect(result.success).to.be.true;
            expect(result.transaction.mode).to.equal('manual');
        });
        
        it('should get unified transaction history', async () => {
            const history = await sharedServices.getUnifiedTransactionHistory({
                limit: 10
            });
            
            expect(history.transactions).to.be.an('array');
            expect(history.total).to.be.a('number');
        });
    });
    
    describe('Performance', () => {
        it('should load integration interface within acceptable time', async () => {
            const startTime = Date.now();
            await integrationController.render();
            const loadTime = Date.now() - startTime;
            
            expect(loadTime).to.be.lessThan(2000); // 2 seconds
        });
        
        it('should switch tabs within acceptable time', async () => {
            const startTime = Date.now();
            await integrationController.switchTab('manual');
            const switchTime = Date.now() - startTime;
            
            expect(switchTime).to.be.lessThan(500); // 500ms
        });
    });
});
```

### 2. Performance Validation

#### Performance Test Script
```bash
#!/bin/bash
# File: tests/performance-test.sh

echo "Running performance tests..."

# Test page load time
echo "Testing page load performance..."
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost/pembayaran-hutang-piutang"

# Test API response times
echo "Testing API performance..."
ab -n 100 -c 10 http://localhost/api/transactions

# Test database query performance
echo "Testing database performance..."
mysql -u username -p -e "
    SET profiling = 1;
    SELECT * FROM transactions WHERE mode = 'manual' LIMIT 100;
    SELECT * FROM transactions WHERE batchId IS NOT NULL LIMIT 100;
    SHOW PROFILES;
"

# Test memory usage
echo "Testing memory usage..."
ps aux | grep -E "(apache2|nginx|mysql)" | awk '{print $4, $11}' | sort -nr

echo "Performance tests completed"
```

### 3. User Acceptance Testing

#### UAT Checklist
```markdown
# User Acceptance Testing Checklist

## Manual Payment Tab
- [ ] Can access manual payment tab
- [ ] Autocomplete works for member search
- [ ] Can process hutang payment
- [ ] Can process piutang payment
- [ ] Payment validation works correctly
- [ ] Receipt printing works
- [ ] Transaction appears in history

## Import Batch Tab
- [ ] Can access import batch tab (admin only)
- [ ] Can download template file
- [ ] Can upload CSV file
- [ ] File validation works correctly
- [ ] Can preview import data
- [ ] Can process batch import
- [ ] Can download import report
- [ ] Batch transactions appear in history

## Tab Navigation
- [ ] Can switch between tabs
- [ ] Unsaved data warning works
- [ ] Tab state is preserved
- [ ] Keyboard shortcuts work (Ctrl+1, Ctrl+2)

## Unified Features
- [ ] Transaction history shows both modes
- [ ] Mode filter works correctly
- [ ] Export includes all transactions
- [ ] Dashboard shows combined statistics
- [ ] Real-time updates work between tabs

## Performance
- [ ] Page loads within 3 seconds
- [ ] Tab switching is smooth
- [ ] Large imports complete successfully
- [ ] No memory leaks during extended use

## Security
- [ ] Permission restrictions work
- [ ] Audit logging captures all actions
- [ ] Session management works correctly
- [ ] No unauthorized access possible
```

## Rollback Procedures

### 1. Emergency Rollback

#### Quick Rollback Script
```bash
#!/bin/bash
# File: scripts/emergency-rollback.sh

set -e

BACKUP_DIR="$1"
WEB_ROOT="/var/www/html"

if [ -z "$BACKUP_DIR" ]; then
    echo "Usage: $0 <backup_directory>"
    exit 1
fi

echo "Starting emergency rollback..."

# Stop web server
systemctl stop apache2

# Restore application files
echo "Restoring application files..."
rm -rf $WEB_ROOT/*
cp -r $BACKUP_DIR/var/www/html/* $WEB_ROOT/

# Restore database
echo "Restoring database..."
mysql -u username -p koperasi_db < $BACKUP_DIR/database_backup.sql

# Set permissions
chown -R www-data:www-data $WEB_ROOT
chmod -R 644 $WEB_ROOT

# Start web server
systemctl start apache2

echo "Emergency rollback completed"
```

### 2. Selective Rollback

#### Database Schema Rollback
```sql
-- File: rollback/rollback_database_schema.sql

START TRANSACTION;

-- Remove new indexes
DROP INDEX IF EXISTS idx_transactions_mode ON transactions;
DROP INDEX IF EXISTS idx_transactions_batch_id ON transactions;
DROP INDEX IF EXISTS idx_transactions_mode_date ON transactions;

-- Remove new columns
ALTER TABLE transactions DROP COLUMN IF EXISTS batchId;
ALTER TABLE transactions DROP COLUMN IF EXISTS mode;

-- Drop enhanced audit table
DROP TABLE IF EXISTS audit_log_enhanced;

-- Verify rollback
SHOW COLUMNS FROM transactions;

COMMIT;
```

#### Application Files Rollback
```bash
#!/bin/bash
# File: scripts/rollback-application.sh

BACKUP_DIR="$1"
WEB_ROOT="/var/www/html"

# Restore specific files
cp $BACKUP_DIR/index.html $WEB_ROOT/
cp $BACKUP_DIR/js/pembayaranHutangPiutang.js $WEB_ROOT/js/
rm -f $WEB_ROOT/js/pembayaranHutangPiutangIntegrated.js
rm -rf $WEB_ROOT/js/shared/

# Restart web server
systemctl restart apache2

echo "Application rollback completed"
```

## Troubleshooting

### 1. Common Migration Issues

#### Database Connection Issues
```bash
# Check database connectivity
mysql -u username -p -e "SELECT 1;"

# Check database permissions
mysql -u username -p -e "SHOW GRANTS FOR CURRENT_USER();"

# Check table locks
mysql -u username -p -e "SHOW PROCESSLIST;"
```

#### File Permission Issues
```bash
# Fix file permissions
chown -R www-data:www-data /var/www/html/
chmod -R 644 /var/www/html/
chmod -R 755 /var/www/html/js/
chmod -R 755 /var/www/html/css/

# Check SELinux (if applicable)
sestatus
setsebool -P httpd_can_network_connect 1
```

#### JavaScript Loading Issues
```javascript
// Debug script loading
console.log('Available classes:', {
    PembayaranHutangPiutangIntegrated: typeof PembayaranHutangPiutangIntegrated,
    SharedPaymentServices: typeof SharedPaymentServices,
    EnhancedAuditLogger: typeof EnhancedAuditLogger
});

// Check for script errors
window.addEventListener('error', function(e) {
    console.error('Script error:', e.filename, e.lineno, e.message);
});
```

### 2. Performance Issues

#### Database Performance
```sql
-- Check slow queries
SHOW PROCESSLIST;
SHOW FULL PROCESSLIST;

-- Analyze table performance
ANALYZE TABLE transactions;
ANALYZE TABLE audit_log_enhanced;

-- Check index usage
EXPLAIN SELECT * FROM transactions WHERE mode = 'manual';
EXPLAIN SELECT * FROM transactions WHERE batchId = 'BATCH123';
```

#### Memory Usage
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head -10

# Check Apache/Nginx processes
ps aux | grep -E "(apache2|nginx)" | wc -l
```

### 3. Data Integrity Issues

#### Validation Queries
```sql
-- Check for orphaned transactions
SELECT COUNT(*) FROM transactions t
LEFT JOIN anggota a ON t.anggotaId = a.id
WHERE a.id IS NULL;

-- Check for invalid modes
SELECT COUNT(*) FROM transactions
WHERE mode NOT IN ('manual', 'import');

-- Check for inconsistent saldo
SELECT 
    anggotaId,
    COUNT(*) as transaction_count,
    SUM(CASE WHEN jenisPembayaran = 'hutang' THEN jumlah ELSE 0 END) as total_hutang_payments,
    SUM(CASE WHEN jenisPembayaran = 'piutang' THEN jumlah ELSE 0 END) as total_piutang_payments
FROM transactions
GROUP BY anggotaId
HAVING transaction_count > 100;  -- Focus on active members
```

### 4. Recovery Procedures

#### Data Recovery
```bash
#!/bin/bash
# File: scripts/data-recovery.sh

# Recover from point-in-time backup
RECOVERY_TIME="2024-12-15 14:30:00"

# Stop applications
systemctl stop apache2

# Restore database to specific time
mysql -u root -p -e "
    DROP DATABASE koperasi_db;
    CREATE DATABASE koperasi_db;
"

# Restore from backup
mysql -u root -p koperasi_db < /backup/database_backup.sql

# Apply binary logs up to recovery time
mysqlbinlog --stop-datetime="$RECOVERY_TIME" \
    /var/log/mysql/mysql-bin.000001 | \
    mysql -u root -p koperasi_db

# Start applications
systemctl start apache2

echo "Data recovery completed to $RECOVERY_TIME"
```

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Migration Support**: Contact development team for assistance