# Deployment Guide - Upload Master Barang Excel

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation Steps](#installation-steps)
3. [Configuration](#configuration)
4. [Testing Deployment](#testing-deployment)
5. [Production Deployment](#production-deployment)
6. [Monitoring Setup](#monitoring-setup)
7. [Backup and Recovery](#backup-and-recovery)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

#### Minimum Requirements
- **Web Server**: Apache 2.4+ atau Nginx 1.18+
- **Browser Support**: Chrome 80+, Firefox 75+, Edge 80+, Safari 13+
- **Storage**: 100MB disk space untuk aplikasi
- **Memory**: 2GB RAM untuk server
- **Network**: Bandwidth minimum 1Mbps

#### Recommended Requirements
- **Web Server**: Nginx 1.20+ dengan HTTP/2
- **CDN**: CloudFlare atau AWS CloudFront
- **Storage**: 1GB disk space dengan SSD
- **Memory**: 4GB+ RAM
- **Network**: Bandwidth 10Mbps+

### Dependencies

#### Required Files
```
upload-master-barang-excel/
├── upload_master_barang_excel.html     # Main HTML file
├── js/upload-excel/                    # JavaScript modules
│   ├── ExcelUploadManager.js
│   ├── ValidationEngine.js
│   ├── DataProcessor.js
│   └── ... (other modules)
├── css/                                # Stylesheets
├── templates/                          # CSV templates
└── docs/                              # Documentation
```

#### External Libraries (CDN)
```html
<!-- Bootstrap 5.3 -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

<!-- Papa Parse for CSV -->
<script src="https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"></script>

<!-- SheetJS for Excel -->
<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
```

## Installation Steps

### Step 1: Download and Extract Files

```bash
# Download from repository
git clone https://github.com/koperasi/upload-master-barang-excel.git
cd upload-master-barang-excel

# Or download ZIP and extract
wget https://github.com/koperasi/upload-master-barang-excel/archive/main.zip
unzip main.zip
cd upload-master-barang-excel-main
```

### Step 2: File Structure Setup

```bash
# Create directory structure
mkdir -p /var/www/html/koperasi/upload-excel
mkdir -p /var/www/html/koperasi/upload-excel/js/upload-excel
mkdir -p /var/www/html/koperasi/upload-excel/css
mkdir -p /var/www/html/koperasi/upload-excel/templates
mkdir -p /var/www/html/koperasi/upload-excel/docs

# Copy files
cp upload_master_barang_excel.html /var/www/html/koperasi/upload-excel/
cp -r js/upload-excel/* /var/www/html/koperasi/upload-excel/js/upload-excel/
cp -r css/* /var/www/html/koperasi/upload-excel/css/
cp -r templates/* /var/www/html/koperasi/upload-excel/templates/
cp -r docs/* /var/www/html/koperasi/upload-excel/docs/
```

### Step 3: Web Server Configuration

#### Apache Configuration
```apache
# /etc/apache2/sites-available/koperasi-upload.conf
<VirtualHost *:80>
    ServerName upload.koperasi.com
    DocumentRoot /var/www/html/koperasi/upload-excel
    
    # Enable compression
    LoadModule deflate_module modules/mod_deflate.so
    <Location />
        SetOutputFilter DEFLATE
        SetEnvIfNoCase Request_URI \
            \.(?:gif|jpe?g|png)$ no-gzip dont-vary
        SetEnvIfNoCase Request_URI \
            \.(?:exe|t?gz|zip|bz2|sit|rar)$ no-gzip dont-vary
    </Location>
    
    # Cache static files
    <LocationMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 month"
    </LocationMatch>
    
    # Security headers
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    
    ErrorLog ${APACHE_LOG_DIR}/koperasi-upload_error.log
    CustomLog ${APACHE_LOG_DIR}/koperasi-upload_access.log combined
</VirtualHost>
```

#### Nginx Configuration
```nginx
# /etc/nginx/sites-available/koperasi-upload
server {
    listen 80;
    server_name upload.koperasi.com;
    root /var/www/html/koperasi/upload-excel;
    index upload_master_barang_excel.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/javascript application/xml+rss 
               application/json;
    
    # Cache static files
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1M;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    
    # File upload size
    client_max_body_size 10M;
    
    # Logging
    access_log /var/log/nginx/koperasi-upload_access.log;
    error_log /var/log/nginx/koperasi-upload_error.log;
}
```

### Step 4: SSL Configuration (Production)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d upload.koperasi.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```
## Configuration

### Application Configuration

Create configuration file:
```javascript
// js/upload-excel/config.js
window.UploadConfig = {
    // Environment
    environment: 'production', // 'development' | 'staging' | 'production'
    
    // API Endpoints (if needed)
    apiBaseUrl: 'https://api.koperasi.com',
    
    // File Upload Settings
    upload: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedFormats: ['.csv', '.xlsx'],
        chunkSize: 100,
        timeout: 300000 // 5 minutes
    },
    
    // Feature Flags
    features: {
        enableAuditLog: true,
        enableAutoCategories: true,
        enableBatchProcessing: true,
        enableErrorRecovery: true
    },
    
    // UI Settings
    ui: {
        language: 'id',
        theme: 'bootstrap',
        showDebugInfo: false
    }
};
```

### Environment-Specific Configuration

#### Development
```javascript
// config/development.js
window.UploadConfig = {
    ...window.UploadConfig,
    environment: 'development',
    ui: {
        ...window.UploadConfig.ui,
        showDebugInfo: true
    },
    upload: {
        ...window.UploadConfig.upload,
        maxFileSize: 1 * 1024 * 1024 // 1MB for testing
    }
};
```

#### Production
```javascript
// config/production.js
window.UploadConfig = {
    ...window.UploadConfig,
    environment: 'production',
    ui: {
        ...window.UploadConfig.ui,
        showDebugInfo: false
    },
    features: {
        ...window.UploadConfig.features,
        enableErrorReporting: true
    }
};
```

## Testing Deployment

### Pre-Deployment Testing

#### 1. File Upload Test
```bash
# Create test CSV file
cat > test_upload.csv << EOF
kode,nama,kategori,satuan,harga_beli,stok,supplier
TEST001,Test Product 1,test,pcs,1000,10,Test Supplier
TEST002,Test Product 2,test,kg,2000,5,
EOF

# Test file size (should be < 5MB)
ls -lh test_upload.csv
```

#### 2. Browser Compatibility Test
```javascript
// Browser feature detection
function checkBrowserSupport() {
    const features = {
        fileAPI: typeof File !== 'undefined',
        dragDrop: 'draggable' in document.createElement('div'),
        localStorage: typeof Storage !== 'undefined',
        fetch: typeof fetch !== 'undefined',
        promises: typeof Promise !== 'undefined'
    };
    
    console.log('Browser Support:', features);
    return Object.values(features).every(Boolean);
}

// Run in browser console
checkBrowserSupport();
```

#### 3. Performance Test
```javascript
// Performance monitoring
function performanceTest() {
    const start = performance.now();
    
    // Simulate large file processing
    const testData = Array(1000).fill().map((_, i) => ({
        kode: `TEST${String(i).padStart(3, '0')}`,
        nama: `Test Product ${i}`,
        kategori: 'test',
        satuan: 'pcs',
        harga_beli: 1000 + i,
        stok: 10,
        supplier: 'Test Supplier'
    }));
    
    // Process data
    const processor = new DataProcessor();
    processor.normalizeData(testData);
    
    const end = performance.now();
    console.log(`Processing 1000 records took ${end - start} milliseconds`);
}
```

### Automated Testing

#### Unit Tests
```bash
# Install Jest (if not already installed)
npm install --save-dev jest

# Run tests
npm test

# Run specific test suite
npm test -- --testPathPattern=upload-excel
```

#### Integration Tests
```javascript
// tests/integration/upload-workflow.test.js
describe('Upload Workflow Integration', () => {
    test('Complete upload process', async () => {
        const uploadManager = new ExcelUploadManager();
        
        // Mock file
        const mockFile = new File(['kode,nama,kategori,satuan,harga_beli,stok\nTEST001,Test,test,pcs,1000,10'], 'test.csv', {
            type: 'text/csv'
        });
        
        // Test upload
        const uploadResult = await uploadManager.uploadFile(mockFile);
        expect(uploadResult.success).toBe(true);
        
        // Test validation
        const validationResult = await uploadManager.validateData(uploadResult.data);
        expect(validationResult.isValid).toBe(true);
        
        // Test import
        const importResult = await uploadManager.importData(uploadResult.data);
        expect(importResult.success).toBe(true);
    });
});
```

## Production Deployment

### Deployment Checklist

#### Pre-Deployment
- [ ] Code review completed
- [ ] All tests passing
- [ ] Performance testing completed
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Backup created

#### Deployment Steps
```bash
#!/bin/bash
# deploy.sh

set -e

echo "Starting deployment..."

# 1. Backup current version
sudo cp -r /var/www/html/koperasi/upload-excel /var/www/html/koperasi/upload-excel.backup.$(date +%Y%m%d_%H%M%S)

# 2. Deploy new version
sudo cp -r ./upload-excel/* /var/www/html/koperasi/upload-excel/

# 3. Set permissions
sudo chown -R www-data:www-data /var/www/html/koperasi/upload-excel
sudo chmod -R 644 /var/www/html/koperasi/upload-excel
sudo chmod -R 755 /var/www/html/koperasi/upload-excel/js

# 4. Restart web server
sudo systemctl reload nginx

# 5. Test deployment
curl -f http://localhost/koperasi/upload-excel/upload_master_barang_excel.html > /dev/null

echo "Deployment completed successfully!"
```

#### Post-Deployment
- [ ] Smoke tests passed
- [ ] Performance monitoring active
- [ ] Error monitoring active
- [ ] User acceptance testing
- [ ] Documentation deployment

### Rollback Procedure

```bash
#!/bin/bash
# rollback.sh

BACKUP_DIR="/var/www/html/koperasi/upload-excel.backup.$1"

if [ ! -d "$BACKUP_DIR" ]; then
    echo "Backup directory not found: $BACKUP_DIR"
    exit 1
fi

echo "Rolling back to backup: $1"

# Stop web server
sudo systemctl stop nginx

# Restore backup
sudo rm -rf /var/www/html/koperasi/upload-excel
sudo cp -r "$BACKUP_DIR" /var/www/html/koperasi/upload-excel

# Set permissions
sudo chown -R www-data:www-data /var/www/html/koperasi/upload-excel

# Start web server
sudo systemctl start nginx

echo "Rollback completed!"
```