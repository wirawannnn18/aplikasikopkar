# Deployment Guide - Master Barang Komprehensif

## Daftar Isi
1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Development Environment](#development-environment)
4. [Staging Environment](#staging-environment)
5. [Production Deployment](#production-deployment)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Rollback Procedures](#rollback-procedures)
8. [Monitoring Setup](#monitoring-setup)

## Prerequisites

### System Requirements
- **Web Server**: Apache 2.4+ atau Nginx 1.18+
- **Browser Support**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Storage**: Minimum 10MB disk space
- **Network**: HTTPS recommended untuk production

### Dependencies
```json
{
  "required": [
    "Modern web browser with JavaScript enabled",
    "localStorage support (5MB minimum)",
    "File API support for import/export"
  ],
  "optional": [
    "Service Worker support for offline functionality",
    "Web Workers for background processing"
  ]
}
```

## Pre-Deployment Checklist

### Code Quality
- [ ] All unit tests passing (100%)
- [ ] All integration tests passing
- [ ] Code coverage > 90%
- [ ] ESLint checks passing
- [ ] No console.error in production code
- [ ] All TODO comments resolved

### Security
- [ ] Input validation implemented
- [ ] XSS protection in place
- [ ] CSRF protection configured
- [ ] Secure headers configured
- [ ] No sensitive data in localStorage
- [ ] Audit logging enabled

### Performance
- [ ] Bundle size optimized
- [ ] Images optimized
- [ ] Lazy loading implemented
- [ ] Caching strategy configured
- [ ] Performance benchmarks met

### Documentation
- [ ] User documentation complete
- [ ] Technical documentation updated
- [ ] API documentation current
- [ ] Troubleshooting guide available
- [ ] Deployment procedures documented

## Development Environment

### Setup
```bash
# 1. Clone repository
git clone <repository-url>
cd master-barang-komprehensif

# 2. Setup local web server
# Option A: Python
python -m http.server 8000

# Option B: Node.js
npx http-server -p 8000

# Option C: PHP
php -S localhost:8000
```

### Configuration
```javascript
// config/development.js
const CONFIG = {
    ENVIRONMENT: 'development',
    DEBUG: true,
    STORAGE_PREFIX: 'dev_master_barang_',
    API_BASE_URL: 'http://localhost:8000',
    AUDIT_RETENTION_DAYS: 30,
    MAX_IMPORT_SIZE: 1024 * 1024, // 1MB for testing
    ENABLE_MOCK_DATA: true
};
```

### Testing
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

## Staging Environment

### Setup
```bash
# 1. Deploy to staging server
rsync -avz --exclude='.git' ./ user@staging-server:/var/www/master-barang/

# 2. Configure web server
sudo cp config/nginx-staging.conf /etc/nginx/sites-available/master-barang
sudo ln -s /etc/nginx/sites-available/master-barang /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Configuration
```javascript
// config/staging.js
const CONFIG = {
    ENVIRONMENT: 'staging',
    DEBUG: false,
    STORAGE_PREFIX: 'staging_master_barang_',
    API_BASE_URL: 'https://staging.example.com',
    AUDIT_RETENTION_DAYS: 90,
    MAX_IMPORT_SIZE: 5 * 1024 * 1024, // 5MB
    ENABLE_MOCK_DATA: false
};
```

### Nginx Configuration
```nginx
# /etc/nginx/sites-available/master-barang
server {
    listen 443 ssl http2;
    server_name staging.example.com;
    
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;
    
    root /var/www/master-barang;
    index index.html;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy (if needed)
    location /api/ {
        proxy_pass http://backend-server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Production Deployment

### Pre-Production Steps
```bash
# 1. Create production build
npm run build:production

# 2. Run final tests
npm run test:production

# 3. Security scan
npm audit --audit-level moderate

# 4. Performance test
npm run test:performance
```

### Deployment Script
```bash
#!/bin/bash
# deploy-production.sh

set -e

echo "Starting production deployment..."

# 1. Backup current version
BACKUP_DIR="/var/backups/master-barang/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r /var/www/master-barang/* "$BACKUP_DIR/"

# 2. Deploy new version
rsync -avz --exclude='.git' --exclude='node_modules' ./ /var/www/master-barang/

# 3. Set permissions
chown -R www-data:www-data /var/www/master-barang
chmod -R 644 /var/www/master-barang
find /var/www/master-barang -type d -exec chmod 755 {} \;

# 4. Update configuration
cp config/production.js /var/www/master-barang/js/config.js

# 5. Test deployment
curl -f https://example.com/master-barang/ || {
    echo "Deployment failed, rolling back..."
    cp -r "$BACKUP_DIR"/* /var/www/master-barang/
    exit 1
}

echo "Production deployment completed successfully!"
```

### Production Configuration
```javascript
// config/production.js
const CONFIG = {
    ENVIRONMENT: 'production',
    DEBUG: false,
    STORAGE_PREFIX: 'master_barang_',
    API_BASE_URL: 'https://api.example.com',
    AUDIT_RETENTION_DAYS: 365,
    MAX_IMPORT_SIZE: 5 * 1024 * 1024, // 5MB
    ENABLE_MOCK_DATA: false,
    ERROR_REPORTING: true,
    PERFORMANCE_MONITORING: true
};
```

### Apache Configuration
```apache
# /etc/apache2/sites-available/master-barang.conf
<VirtualHost *:443>
    ServerName example.com
    DocumentRoot /var/www/master-barang
    
    SSLEngine on
    SSLCertificateFile /path/to/ssl/cert.pem
    SSLCertificateKeyFile /path/to/ssl/key.pem
    
    # Security headers
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    
    # Cache static assets
    <LocationMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
        Header set Cache-Control "public, immutable"
    </LocationMatch>
    
    # SPA routing
    <Directory /var/www/master-barang>
        Options -Indexes
        AllowOverride All
        Require all granted
        
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

## Post-Deployment Verification

### Automated Tests
```bash
#!/bin/bash
# post-deployment-tests.sh

BASE_URL="https://example.com/master-barang"

echo "Running post-deployment verification..."

# 1. Health check
curl -f "$BASE_URL/" || exit 1

# 2. JavaScript loading
curl -f "$BASE_URL/js/master-barang/MasterBarangSystem.js" || exit 1

# 3. CSS loading
curl -f "$BASE_URL/css/master-barang.css" || exit 1

# 4. Functional tests
node test/e2e/production-smoke-test.js

echo "Post-deployment verification completed!"
```

### Manual Verification Checklist
- [ ] Homepage loads correctly
- [ ] All JavaScript files load without errors
- [ ] CSS styles applied correctly
- [ ] localStorage functionality works
- [ ] Import/export functionality works
- [ ] Search and filter work
- [ ] CRUD operations work
- [ ] Audit logging works
- [ ] Error handling works
- [ ] Mobile responsiveness works

### Performance Verification
```javascript
// Performance monitoring script
function performanceCheck() {
    const metrics = {
        loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
        domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
        memoryUsage: performance.memory ? {
            used: Math.round(performance.memory.usedJSHeapSize / 1048576),
            total: Math.round(performance.memory.totalJSHeapSize / 1048576)
        } : null
    };
    
    console.log('Performance metrics:', metrics);
    
    // Alert if performance is poor
    if (metrics.loadTime > 3000) {
        console.warn('Page load time is slow:', metrics.loadTime + 'ms');
    }
    
    return metrics;
}
```

## Rollback Procedures

### Automatic Rollback
```bash
#!/bin/bash
# rollback.sh

BACKUP_DIR="$1"

if [ -z "$BACKUP_DIR" ]; then
    echo "Usage: $0 <backup_directory>"
    exit 1
fi

echo "Rolling back to $BACKUP_DIR..."

# 1. Stop web server
systemctl stop nginx

# 2. Restore files
cp -r "$BACKUP_DIR"/* /var/www/master-barang/

# 3. Set permissions
chown -R www-data:www-data /var/www/master-barang

# 4. Start web server
systemctl start nginx

# 5. Verify rollback
curl -f https://example.com/master-barang/ && echo "Rollback successful!"
```

### Manual Rollback Steps
1. Identify backup version to restore
2. Stop web server
3. Replace current files with backup
4. Restore database if needed
5. Update configuration
6. Start web server
7. Verify functionality
8. Notify stakeholders

## Monitoring Setup

### Error Monitoring
```javascript
// Error tracking
window.addEventListener('error', function(e) {
    const errorData = {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        stack: e.error?.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
    };
    
    // Send to monitoring service
    fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData)
    }).catch(console.error);
});
```

### Performance Monitoring
```javascript
// Performance tracking
function trackPerformance() {
    const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
                const metrics = {
                    loadTime: entry.loadEventEnd - entry.loadEventStart,
                    domReady: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
                    ttfb: entry.responseStart - entry.requestStart
                };
                
                // Send to monitoring service
                fetch('/api/performance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(metrics)
                }).catch(console.error);
            }
        }
    });
    
    observer.observe({ entryTypes: ['navigation'] });
}
```

### Health Check Endpoint
```javascript
// health-check.js
function healthCheck() {
    return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: CONFIG.ENVIRONMENT,
        checks: {
            localStorage: typeof(Storage) !== "undefined",
            javascript: true,
            dataIntegrity: checkDataIntegrity()
        }
    };
}

function checkDataIntegrity() {
    try {
        const data = JSON.parse(localStorage.getItem('master_barang_data') || '{}');
        return {
            barang: Array.isArray(data.barang),
            kategori: Array.isArray(data.kategori),
            satuan: Array.isArray(data.satuan)
        };
    } catch (e) {
        return false;
    }
}
```

## Maintenance

### Regular Tasks
- **Daily**: Monitor error logs and performance metrics
- **Weekly**: Review audit logs and user feedback
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Performance optimization review
- **Annually**: Security audit and penetration testing

### Backup Strategy
```bash
#!/bin/bash
# backup.sh

BACKUP_ROOT="/var/backups/master-barang"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/$DATE"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup application files
tar -czf "$BACKUP_DIR/app.tar.gz" -C /var/www master-barang

# Backup configuration
cp -r /etc/nginx/sites-available/master-barang "$BACKUP_DIR/"

# Clean old backups (keep last 30 days)
find "$BACKUP_ROOT" -type d -mtime +30 -exec rm -rf {} \;

echo "Backup completed: $BACKUP_DIR"
```

---

*Panduan deployment ini harus diikuti dengan ketat untuk memastikan deployment yang aman dan sukses.*