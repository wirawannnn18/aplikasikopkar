# Panduan Deployment - Import Tagihan Pembayaran

## Daftar Isi
1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Deployment Steps](#deployment-steps)
4. [Post-Deployment Verification](#post-deployment-verification)
5. [Configuration](#configuration)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Procedures](#rollback-procedures)

## Prerequisites

### System Requirements

#### Server Requirements
- **OS**: Linux (Ubuntu 18.04+ recommended) or Windows Server 2016+
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 10GB free space for file processing
- **CPU**: 2+ cores recommended for batch processing

#### Software Dependencies
- **Node.js**: Version 14.x or higher
- **Database**: PostgreSQL 12+ or MySQL 8.0+
- **Web Server**: Apache 2.4+ or Nginx 1.18+
- **Browser Support**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+

#### JavaScript Libraries
```json
{
  "dependencies": {
    "papaparse": "^5.3.0",
    "xlsx": "^0.18.0",
    "fast-check": "^3.0.0",
    "jest": "^29.0.0"
  }
}
```

### Database Requirements

#### Tables Required
- `anggota` (members table)
- `hutang_piutang` (debt/credit table)
- `transaksi` (transactions table)
- `jurnal` (journal entries table)
- `audit_log` (audit logging table)

#### New Tables for Import Feature
```sql
-- Import batch tracking
CREATE TABLE import_batches (
    id VARCHAR(50) PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    uploaded_by VARCHAR(50) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_rows INT NOT NULL,
    valid_rows INT DEFAULT 0,
    invalid_rows INT DEFAULT 0,
    status ENUM('uploaded', 'validated', 'processing', 'completed', 'cancelled') DEFAULT 'uploaded',
    processed_at TIMESTAMP NULL,
    results JSON NULL
);

-- Import audit log
CREATE TABLE import_audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    details JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL,
    FOREIGN KEY (batch_id) REFERENCES import_batches(id)
);

-- Import configuration
CREATE TABLE import_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(50) NOT NULL
);
```

### File System Requirements

#### Directory Structure
```
/var/www/html/koperasi/
├── js/
│   └── import-tagihan/          # Import module files
├── __tests__/
│   └── import-tagihan/          # Test files
├── uploads/
│   └── import-temp/             # Temporary upload directory
├── reports/
│   └── import-reports/          # Generated reports
└── logs/
    └── import-logs/             # Import logs
```

#### Permissions
```bash
# Set proper permissions
chmod 755 /var/www/html/koperasi/js/import-tagihan/
chmod 777 /var/www/html/koperasi/uploads/import-temp/
chmod 777 /var/www/html/koperasi/reports/import-reports/
chmod 777 /var/www/html/koperasi/logs/import-logs/

# Set ownership
chown -R www-data:www-data /var/www/html/koperasi/
```

## Pre-Deployment Checklist

### Code Preparation
- [ ] All tests passing (unit, integration, property-based)
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Version tagged in git
- [ ] Build artifacts prepared

### Database Preparation
- [ ] Database backup completed
- [ ] Migration scripts prepared
- [ ] New tables created
- [ ] Indexes optimized
- [ ] Permissions configured

### Environment Preparation
- [ ] Server resources verified
- [ ] Dependencies installed
- [ ] File permissions set
- [ ] Monitoring configured
- [ ] Backup procedures tested

### Security Preparation
- [ ] Security scan completed
- [ ] Access controls configured
- [ ] SSL certificates valid
- [ ] Firewall rules updated
- [ ] Audit logging enabled

## Deployment Steps

### Step 1: Backup Current System

#### Database Backup
```bash
# PostgreSQL
pg_dump -U username -h localhost koperasi_db > backup_$(date +%Y%m%d_%H%M%S).sql

# MySQL
mysqldump -u username -p koperasi_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### File System Backup
```bash
# Backup current application
tar -czf koperasi_backup_$(date +%Y%m%d_%H%M%S).tar.gz /var/www/html/koperasi/

# Backup configuration files
cp -r /etc/apache2/sites-available/ /backup/apache_config_$(date +%Y%m%d_%H%M%S)/
```

### Step 2: Deploy Database Changes

#### Run Migration Scripts
```sql
-- Create new tables
SOURCE migration_001_create_import_tables.sql;

-- Insert default configuration
INSERT INTO import_config (config_key, config_value, updated_by) VALUES
('max_file_size', '5242880', 'system'),
('max_batch_size', '1000', 'system'),
('import_enabled', 'true', 'system'),
('timeout_minutes', '30', 'system');

-- Create indexes for performance
CREATE INDEX idx_import_batches_status ON import_batches(status);
CREATE INDEX idx_import_batches_uploaded_by ON import_batches(uploaded_by);
CREATE INDEX idx_import_audit_log_batch_id ON import_audit_log(batch_id);
CREATE INDEX idx_import_audit_log_created_at ON import_audit_log(created_at);
```

#### Verify Database Changes
```sql
-- Verify tables created
SHOW TABLES LIKE 'import_%';

-- Verify configuration
SELECT * FROM import_config;

-- Test basic operations
INSERT INTO import_batches (id, file_name, uploaded_by, total_rows) 
VALUES ('test-batch', 'test.csv', 'admin', 10);

SELECT * FROM import_batches WHERE id = 'test-batch';

DELETE FROM import_batches WHERE id = 'test-batch';
```

### Step 3: Deploy Application Files

#### Copy Module Files
```bash
# Copy import module
cp -r js/import-tagihan/ /var/www/html/koperasi/js/

# Copy test files
cp -r __tests__/import-tagihan/ /var/www/html/koperasi/__tests__/

# Set permissions
chmod -R 755 /var/www/html/koperasi/js/import-tagihan/
chown -R www-data:www-data /var/www/html/koperasi/js/import-tagihan/
```

#### Update Main Application Files
```bash
# Update index.html to include import menu
# Update app.js to initialize import module
# Update auth.js if needed for new permissions
```

#### Create Required Directories
```bash
# Create upload directory
mkdir -p /var/www/html/koperasi/uploads/import-temp/
chmod 777 /var/www/html/koperasi/uploads/import-temp/

# Create reports directory
mkdir -p /var/www/html/koperasi/reports/import-reports/
chmod 777 /var/www/html/koperasi/reports/import-reports/

# Create logs directory
mkdir -p /var/www/html/koperasi/logs/import-logs/
chmod 777 /var/www/html/koperasi/logs/import-logs/
```

### Step 4: Update Configuration

#### Web Server Configuration

##### Apache Configuration
```apache
# Add to virtual host configuration
<VirtualHost *:80>
    # ... existing configuration ...
    
    # Import file upload limits
    LimitRequestBody 10485760  # 10MB
    
    # Import upload directory
    <Directory "/var/www/html/koperasi/uploads/import-temp">
        Options -Indexes
        AllowOverride None
        Require all denied
        <Files "*.csv">
            Require valid-user
        </Files>
        <Files "*.xlsx">
            Require valid-user
        </Files>
    </Directory>
    
    # Import reports directory
    <Directory "/var/www/html/koperasi/reports/import-reports">
        Options -Indexes
        AllowOverride None
        Require valid-user
    </Directory>
</VirtualHost>
```

##### Nginx Configuration
```nginx
server {
    # ... existing configuration ...
    
    # Import file upload limits
    client_max_body_size 10M;
    
    # Import upload directory
    location /uploads/import-temp/ {
        deny all;
        return 403;
    }
    
    # Import reports directory
    location /reports/import-reports/ {
        auth_basic "Restricted";
        auth_basic_user_file /etc/nginx/.htpasswd;
    }
}
```

#### PHP Configuration (if applicable)
```ini
# php.ini updates
upload_max_filesize = 10M
post_max_size = 10M
max_execution_time = 1800  # 30 minutes
memory_limit = 512M
```

### Step 5: Install Dependencies

#### Node.js Dependencies
```bash
cd /var/www/html/koperasi/
npm install papaparse xlsx fast-check jest
```

#### System Dependencies
```bash
# Ubuntu/Debian
apt-get update
apt-get install -y nodejs npm

# CentOS/RHEL
yum install -y nodejs npm
```

### Step 6: Configure Application

#### Update Application Configuration
```javascript
// js/config.js - Add import configuration
const importConfig = {
    maxFileSize: 5 * 1024 * 1024,  // 5MB
    supportedFormats: ['csv', 'xlsx'],
    uploadPath: '/uploads/import-temp/',
    reportsPath: '/reports/import-reports/',
    batchTimeout: 30 * 60 * 1000,  // 30 minutes
    maxBatchSize: 1000
};

// Export configuration
window.importConfig = importConfig;
```

#### Update Menu Configuration
```javascript
// Add to menu configuration
const importMenu = {
    id: 'import-tagihan',
    title: 'Import Tagihan Pembayaran',
    icon: 'fas fa-file-import',
    url: '#import-tagihan',
    permissions: ['kasir', 'admin'],
    submenu: [
        {
            id: 'import-upload',
            title: 'Upload File',
            url: '#import-upload'
        },
        {
            id: 'import-history',
            title: 'Riwayat Import',
            url: '#import-history'
        },
        {
            id: 'import-config',
            title: 'Konfigurasi',
            url: '#import-config',
            permissions: ['admin']
        }
    ]
};
```

## Post-Deployment Verification

### Step 1: Basic Functionality Test

#### Test File Upload
```bash
# Create test CSV file
cat > test_import.csv << EOF
nomor_anggota,nama_anggota,jenis_pembayaran,jumlah_pembayaran,keterangan
001,Test User,hutang,100000,Test payment
EOF

# Test upload via curl
curl -X POST \
  -F "file=@test_import.csv" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost/koperasi/api/import-tagihan/upload
```

#### Test Database Operations
```sql
-- Test import batch creation
SELECT * FROM import_batches ORDER BY uploaded_at DESC LIMIT 5;

-- Test audit logging
SELECT * FROM import_audit_log ORDER BY created_at DESC LIMIT 10;

-- Test configuration
SELECT * FROM import_config;
```

### Step 2: Integration Test

#### Run Automated Tests
```bash
cd /var/www/html/koperasi/

# Run unit tests
npm test __tests__/import-tagihan/

# Run integration tests
npm test __tests__/import-tagihan/IntegrationTests.test.js

# Run property-based tests
npm test __tests__/import-tagihan/ --testNamePattern="Property"
```

#### Manual Integration Test
1. Login as kasir user
2. Navigate to Import Tagihan menu
3. Download template
4. Upload test file
5. Verify preview generation
6. Process small batch
7. Verify results and reports

### Step 3: Performance Test

#### Load Testing
```bash
# Test with larger file (100 records)
# Monitor memory usage
# Monitor processing time
# Test concurrent uploads
```

#### Database Performance
```sql
-- Check query performance
EXPLAIN SELECT * FROM import_batches WHERE status = 'processing';

-- Check index usage
SHOW INDEX FROM import_batches;

-- Monitor slow queries
SHOW PROCESSLIST;
```

### Step 4: Security Verification

#### File Upload Security
- Test malicious file uploads
- Verify file type restrictions
- Test file size limits
- Verify access controls

#### Data Security
- Test SQL injection attempts
- Verify input sanitization
- Test authentication bypass
- Verify audit logging

## Configuration

### System Configuration

#### Environment Variables
```bash
# Add to .env or system environment
IMPORT_MAX_FILE_SIZE=5242880
IMPORT_UPLOAD_PATH=/var/www/html/koperasi/uploads/import-temp/
IMPORT_REPORTS_PATH=/var/www/html/koperasi/reports/import-reports/
IMPORT_LOG_PATH=/var/www/html/koperasi/logs/import-logs/
IMPORT_BATCH_TIMEOUT=1800
```

#### Database Configuration
```sql
-- Update configuration as needed
UPDATE import_config SET config_value = '10485760' WHERE config_key = 'max_file_size';  -- 10MB
UPDATE import_config SET config_value = '500' WHERE config_key = 'max_batch_size';
UPDATE import_config SET config_value = '45' WHERE config_key = 'timeout_minutes';
```

### Application Configuration

#### Feature Flags
```javascript
// js/feature-flags.js
const featureFlags = {
    importTagihan: {
        enabled: true,
        maxFileSize: 5 * 1024 * 1024,
        supportedFormats: ['csv', 'xlsx'],
        batchProcessing: true,
        progressTracking: true,
        cancellation: true,
        rollback: true
    }
};
```

#### User Permissions
```sql
-- Add import permissions to roles
INSERT INTO role_permissions (role_id, permission) VALUES
(1, 'import_tagihan_upload'),    -- kasir
(1, 'import_tagihan_process'),   -- kasir
(2, 'import_tagihan_upload'),    -- admin
(2, 'import_tagihan_process'),   -- admin
(2, 'import_tagihan_config');    -- admin only
```

## Monitoring

### Application Monitoring

#### Log Files
```bash
# Import operation logs
tail -f /var/www/html/koperasi/logs/import-logs/import.log

# Error logs
tail -f /var/www/html/koperasi/logs/import-logs/error.log

# Performance logs
tail -f /var/www/html/koperasi/logs/import-logs/performance.log
```

#### Metrics to Monitor
- File upload success/failure rates
- Processing time per batch
- Memory usage during processing
- Database query performance
- Error rates by type
- User activity patterns

### Database Monitoring

#### Key Queries
```sql
-- Monitor active imports
SELECT id, file_name, status, uploaded_at, 
       TIMESTAMPDIFF(MINUTE, uploaded_at, NOW()) as minutes_ago
FROM import_batches 
WHERE status IN ('processing', 'uploaded', 'validated')
ORDER BY uploaded_at DESC;

-- Monitor error rates
SELECT DATE(created_at) as date, 
       COUNT(*) as total_operations,
       SUM(CASE WHEN action LIKE '%ERROR%' THEN 1 ELSE 0 END) as errors
FROM import_audit_log 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Monitor performance
SELECT AVG(JSON_EXTRACT(details, '$.processingTime')) as avg_processing_time,
       MAX(JSON_EXTRACT(details, '$.processingTime')) as max_processing_time
FROM import_audit_log 
WHERE action = 'BATCH_COMPLETED'
AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

### System Monitoring

#### Resource Usage
```bash
# Monitor disk space
df -h /var/www/html/koperasi/uploads/
df -h /var/www/html/koperasi/reports/

# Monitor memory usage
free -h

# Monitor CPU usage
top -p $(pgrep -f "import-tagihan")
```

#### Automated Monitoring Script
```bash
#!/bin/bash
# monitor_import.sh

# Check disk space
UPLOAD_USAGE=$(df /var/www/html/koperasi/uploads/ | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $UPLOAD_USAGE -gt 80 ]; then
    echo "WARNING: Upload directory usage is ${UPLOAD_USAGE}%"
fi

# Check for stuck processes
STUCK_BATCHES=$(mysql -u user -p password -e "SELECT COUNT(*) FROM koperasi_db.import_batches WHERE status='processing' AND uploaded_at < DATE_SUB(NOW(), INTERVAL 1 HOUR);" | tail -1)
if [ $STUCK_BATCHES -gt 0 ]; then
    echo "WARNING: $STUCK_BATCHES stuck import batches found"
fi

# Check error rates
ERROR_RATE=$(mysql -u user -p password -e "SELECT COUNT(*) FROM koperasi_db.import_audit_log WHERE action LIKE '%ERROR%' AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR);" | tail -1)
if [ $ERROR_RATE -gt 10 ]; then
    echo "WARNING: High error rate: $ERROR_RATE errors in last hour"
fi
```

## Troubleshooting

### Common Issues

#### File Upload Issues
```bash
# Check upload directory permissions
ls -la /var/www/html/koperasi/uploads/import-temp/

# Check web server error logs
tail -f /var/log/apache2/error.log
tail -f /var/log/nginx/error.log

# Check PHP error logs
tail -f /var/log/php/error.log
```

#### Database Issues
```sql
-- Check for locked tables
SHOW PROCESSLIST;

-- Check for deadlocks
SHOW ENGINE INNODB STATUS;

-- Check table sizes
SELECT table_name, 
       ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = 'koperasi_db' 
AND table_name LIKE 'import_%';
```

#### Performance Issues
```bash
# Check system resources
htop
iotop
nethogs

# Check database performance
mysqladmin -u root -p processlist
mysqladmin -u root -p extended-status | grep -i slow
```

### Recovery Procedures

#### Stuck Import Recovery
```sql
-- Identify stuck imports
SELECT * FROM import_batches 
WHERE status = 'processing' 
AND uploaded_at < DATE_SUB(NOW(), INTERVAL 1 HOUR);

-- Reset stuck imports
UPDATE import_batches 
SET status = 'cancelled' 
WHERE status = 'processing' 
AND uploaded_at < DATE_SUB(NOW(), INTERVAL 1 HOUR);

-- Log recovery action
INSERT INTO import_audit_log (batch_id, action, details, created_by) 
SELECT id, 'RECOVERY_RESET', '{"reason": "stuck_process"}', 'system'
FROM import_batches 
WHERE status = 'cancelled' 
AND uploaded_at < DATE_SUB(NOW(), INTERVAL 1 HOUR);
```

#### Disk Space Recovery
```bash
# Clean old temporary files
find /var/www/html/koperasi/uploads/import-temp/ -type f -mtime +1 -delete

# Clean old reports
find /var/www/html/koperasi/reports/import-reports/ -type f -mtime +30 -delete

# Clean old logs
find /var/www/html/koperasi/logs/import-logs/ -type f -mtime +90 -delete

# Archive old audit logs
mysqldump -u user -p password koperasi_db import_audit_log \
  --where="created_at < DATE_SUB(NOW(), INTERVAL 6 MONTH)" > \
  import_audit_archive_$(date +%Y%m%d).sql

DELETE FROM import_audit_log WHERE created_at < DATE_SUB(NOW(), INTERVAL 6 MONTH);
```

## Rollback Procedures

### Emergency Rollback

#### Step 1: Stop Import Processing
```sql
-- Mark all processing batches as cancelled
UPDATE import_batches SET status = 'cancelled' WHERE status = 'processing';

-- Log rollback action
INSERT INTO import_audit_log (batch_id, action, details, created_by) 
VALUES ('SYSTEM', 'EMERGENCY_ROLLBACK', '{"reason": "deployment_rollback"}', 'admin');
```

#### Step 2: Restore Database
```bash
# Restore from backup
mysql -u username -p koperasi_db < backup_YYYYMMDD_HHMMSS.sql

# Or restore specific tables
mysql -u username -p koperasi_db < import_tables_backup.sql
```

#### Step 3: Restore Application Files
```bash
# Restore from backup
tar -xzf koperasi_backup_YYYYMMDD_HHMMSS.tar.gz -C /

# Or restore specific files
rm -rf /var/www/html/koperasi/js/import-tagihan/
git checkout previous_version -- js/import-tagihan/
```

#### Step 4: Restart Services
```bash
# Restart web server
systemctl restart apache2
# or
systemctl restart nginx

# Restart database if needed
systemctl restart mysql
# or
systemctl restart postgresql

# Clear application cache
rm -rf /var/www/html/koperasi/cache/*
```

### Partial Rollback

#### Rollback Specific Feature
```javascript
// Disable import feature
const featureFlags = {
    importTagihan: {
        enabled: false,  // Disable feature
        // ... other settings
    }
};
```

#### Rollback Database Changes Only
```sql
-- Drop new tables
DROP TABLE IF EXISTS import_audit_log;
DROP TABLE IF EXISTS import_batches;
DROP TABLE IF EXISTS import_config;

-- Remove permissions
DELETE FROM role_permissions WHERE permission LIKE 'import_tagihan_%';
```

## Maintenance

### Regular Maintenance Tasks

#### Daily
- Monitor error logs
- Check disk space usage
- Verify backup completion
- Review performance metrics

#### Weekly
- Clean temporary files
- Archive old reports
- Update system packages
- Review security logs

#### Monthly
- Archive old audit logs
- Optimize database tables
- Review and update documentation
- Performance tuning review

### Maintenance Scripts

#### Cleanup Script
```bash
#!/bin/bash
# cleanup_import.sh

# Clean temporary files older than 1 day
find /var/www/html/koperasi/uploads/import-temp/ -type f -mtime +1 -delete

# Clean reports older than 30 days
find /var/www/html/koperasi/reports/import-reports/ -type f -mtime +30 -delete

# Clean logs older than 90 days
find /var/www/html/koperasi/logs/import-logs/ -type f -mtime +90 -delete

# Optimize database tables
mysql -u user -p password -e "OPTIMIZE TABLE koperasi_db.import_batches, koperasi_db.import_audit_log;"

echo "Cleanup completed at $(date)"
```

#### Health Check Script
```bash
#!/bin/bash
# health_check_import.sh

# Check if import feature is accessible
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/koperasi/#import-tagihan)
if [ $HTTP_STATUS -ne 200 ]; then
    echo "ERROR: Import feature not accessible (HTTP $HTTP_STATUS)"
    exit 1
fi

# Check database connectivity
mysql -u user -p password -e "SELECT 1 FROM import_config LIMIT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "ERROR: Database connectivity issue"
    exit 1
fi

# Check disk space
DISK_USAGE=$(df /var/www/html/koperasi/uploads/ | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 90 ]; then
    echo "WARNING: Disk usage is ${DISK_USAGE}%"
fi

echo "Health check passed at $(date)"
```

---

**Note**: This deployment guide should be customized based on your specific environment and requirements. Always test deployment procedures in a staging environment before applying to production.