# Deployment Guide - Dashboard Analytics & KPI

## System Requirements

### Minimum Requirements
- **CPU**: 2 cores, 2.4 GHz
- **RAM**: 4 GB
- **Storage**: 20 GB SSD
- **Network**: 100 Mbps
- **OS**: Ubuntu 20.04 LTS, CentOS 8, Windows Server 2019

### Recommended Requirements
- **CPU**: 4 cores, 3.0 GHz
- **RAM**: 8 GB
- **Storage**: 50 GB SSD
- **Network**: 1 Gbps
- **Load Balancer**: For high availability

### Software Dependencies
- **Node.js**: v16.x atau higher
- **PostgreSQL**: v13.x atau higher
- **Redis**: v6.x untuk caching
- **Nginx**: v1.18 untuk reverse proxy
- **PM2**: Untuk process management

## Installation Steps

### 1. System Preparation
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install Redis
sudo apt install redis-server

# Install Nginx
sudo apt install nginx
```

### 2. Database Setup
```sql
-- Create database dan user
CREATE DATABASE dashboard_analytics;
CREATE USER dashboard_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE dashboard_analytics TO dashboard_user;

-- Run migrations
npm run migrate:up
```

### 3. Application Deployment
```bash
# Clone repository
git clone https://github.com/koperasi/dashboard-analytics.git
cd dashboard-analytics

# Install dependencies
npm install --production

# Build application
npm run build

# Configure environment
cp .env.example .env
# Edit .env dengan production settings

# Start application dengan PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 4. Nginx Configuration
```nginx
server {
    listen 80;
    server_name dashboard.koperasi.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Configuration

### Environment Variables
```bash
# Application Settings
NODE_ENV=production
PORT=3000
APP_URL=https://dashboard.koperasi.com

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dashboard_analytics
DB_USER=dashboard_user
DB_PASSWORD=secure_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# Security Settings
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret
ENCRYPTION_KEY=your_encryption_key

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@koperasi.com
SMTP_PASSWORD=email_password
```

### Performance Tuning
```javascript
// PM2 Ecosystem Configuration
module.exports = {
  apps: [{
    name: 'dashboard-analytics',
    script: './dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log'
  }]
};
```

## SSL/HTTPS Setup

### Let's Encrypt SSL
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d dashboard.koperasi.com

# Auto-renewal setup
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring dan Logging

### Application Monitoring
```bash
# Install monitoring tools
npm install -g pm2-logrotate
pm2 install pm2-server-monit

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### System Monitoring
```bash
# Install system monitoring
sudo apt install htop iotop nethogs

# Setup log monitoring
sudo apt install logwatch
```

## Backup Strategy

### Database Backup
```bash
#!/bin/bash
# Daily database backup script
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/database"
DB_NAME="dashboard_analytics"

mkdir -p $BACKUP_DIR
pg_dump $DB_NAME > $BACKUP_DIR/dashboard_backup_$DATE.sql
gzip $BACKUP_DIR/dashboard_backup_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
```

### Application Backup
```bash
#!/bin/bash
# Application files backup
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/application"
APP_DIR="/var/www/dashboard-analytics"

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz $APP_DIR

# Keep only last 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```