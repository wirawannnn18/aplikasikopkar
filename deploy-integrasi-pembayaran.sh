#!/bin/bash

# Deployment Script for Integrasi Pembayaran Laporan
# This script automates the deployment process with proper checks and rollback capabilities

set -e  # Exit on any error

# Configuration
DEPLOYMENT_NAME="integrasi-pembayaran-laporan"
BACKUP_DIR="/backups"
LOG_FILE="/var/log/deployment-$(date +%Y%m%d-%H%M%S).log"
HEALTH_CHECK_URL="http://localhost:3000"
ROLLBACK_TIMEOUT=300  # 5 minutes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as appropriate user
check_user() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
        exit 1
    fi
}

# Create backup directory if it doesn't exist
setup_backup_dir() {
    if [[ ! -d "$BACKUP_DIR" ]]; then
        log "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Check if required files exist
    local required_files=(
        "index.html"
        "js/pembayaranHutangPiutangIntegrated.js"
        "js/shared/SharedPaymentServices.js"
        "js/monitoring/ErrorTracker.js"
        "js/monitoring/PerformanceMonitor.js"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            error "Required file not found: $file"
            exit 1
        fi
    done
    
    # Check JavaScript syntax
    log "Checking JavaScript syntax..."
    for js_file in js/**/*.js; do
        if [[ -f "$js_file" ]]; then
            if ! node -c "$js_file" 2>/dev/null; then
                error "JavaScript syntax error in: $js_file"
                exit 1
            fi
        fi
    done
    
    # Check if tests pass
    if [[ -f "package.json" ]]; then
        log "Running tests..."
        if ! npm test; then
            error "Tests failed. Deployment aborted."
            exit 1
        fi
    fi
    
    success "Pre-deployment checks passed"
}

# Create backup of current deployment
create_backup() {
    local backup_name="pre-deployment-$(date +%Y%m%d-%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    log "Creating backup: $backup_path"
    
    mkdir -p "$backup_path"
    
    # Backup application files
    cp -r . "$backup_path/" 2>/dev/null || true
    
    # Backup configuration files
    if [[ -f "vercel.json" ]]; then
        cp vercel.json "$backup_path/"
    fi
    
    if [[ -f "package.json" ]]; then
        cp package.json "$backup_path/"
    fi
    
    # Create backup manifest
    cat > "$backup_path/BACKUP_MANIFEST.txt" << EOF
Backup Created: $(date)
Deployment: $DEPLOYMENT_NAME
Git Commit: $(git rev-parse HEAD 2>/dev/null || echo "N/A")
Git Branch: $(git branch --show-current 2>/dev/null || echo "N/A")
Backup Path: $backup_path
EOF
    
    # Store backup path for potential rollback
    echo "$backup_path" > "$BACKUP_DIR/latest-backup.txt"
    
    success "Backup created successfully: $backup_path"
}

# Deploy application
deploy_application() {
    log "Deploying application..."
    
    # Stop any running processes (if applicable)
    if command -v pm2 &> /dev/null; then
        log "Stopping PM2 processes..."
        pm2 stop all || true
    fi
    
    # Update file permissions
    log "Setting file permissions..."
    find . -type f -name "*.js" -exec chmod 644 {} \;
    find . -type f -name "*.html" -exec chmod 644 {} \;
    find . -type f -name "*.css" -exec chmod 644 {} \;
    
    # Install/update dependencies if package.json exists
    if [[ -f "package.json" ]]; then
        log "Installing/updating dependencies..."
        npm ci --production
    fi
    
    # Start application processes (if applicable)
    if command -v pm2 &> /dev/null && [[ -f "server.js" ]]; then
        log "Starting PM2 processes..."
        pm2 start server.js --name "$DEPLOYMENT_NAME" || pm2 restart "$DEPLOYMENT_NAME"
    fi
    
    success "Application deployed successfully"
}

# Health check function
health_check() {
    log "Running health checks..."
    
    local max_attempts=10
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log "Health check attempt $attempt/$max_attempts"
        
        # Check if application is responding
        if curl -f -s "$HEALTH_CHECK_URL" > /dev/null; then
            success "Health check passed"
            return 0
        fi
        
        log "Health check failed, waiting 10 seconds..."
        sleep 10
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts"
    return 1
}

# Rollback function
rollback() {
    error "Deployment failed. Initiating rollback..."
    
    local backup_path
    if [[ -f "$BACKUP_DIR/latest-backup.txt" ]]; then
        backup_path=$(cat "$BACKUP_DIR/latest-backup.txt")
    else
        error "No backup path found for rollback"
        exit 1
    fi
    
    if [[ ! -d "$backup_path" ]]; then
        error "Backup directory not found: $backup_path"
        exit 1
    fi
    
    log "Rolling back to: $backup_path"
    
    # Stop current processes
    if command -v pm2 &> /dev/null; then
        pm2 stop all || true
    fi
    
    # Restore files
    cp -r "$backup_path"/* . 2>/dev/null || true
    
    # Restart processes
    if command -v pm2 &> /dev/null && [[ -f "server.js" ]]; then
        pm2 start server.js --name "$DEPLOYMENT_NAME" || pm2 restart "$DEPLOYMENT_NAME"
    fi
    
    # Verify rollback
    if health_check; then
        success "Rollback completed successfully"
    else
        error "Rollback verification failed"
        exit 1
    fi
}

# Post-deployment tasks
post_deployment() {
    log "Running post-deployment tasks..."
    
    # Clear any caches
    if [[ -d "node_modules/.cache" ]]; then
        rm -rf node_modules/.cache
    fi
    
    # Update deployment log
    cat >> "$BACKUP_DIR/deployment-history.log" << EOF
$(date): Deployment of $DEPLOYMENT_NAME completed successfully
Git Commit: $(git rev-parse HEAD 2>/dev/null || echo "N/A")
Backup: $(cat "$BACKUP_DIR/latest-backup.txt" 2>/dev/null || echo "N/A")
---
EOF
    
    # Clean up old backups (keep last 10)
    log "Cleaning up old backups..."
    cd "$BACKUP_DIR"
    ls -t | grep "pre-deployment-" | tail -n +11 | xargs -r rm -rf
    cd - > /dev/null
    
    success "Post-deployment tasks completed"
}

# Monitoring setup
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Create monitoring configuration
    cat > "monitoring-config.json" << EOF
{
    "deployment": "$DEPLOYMENT_NAME",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "version": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "monitoring": {
        "errorTracking": true,
        "performanceMonitoring": true,
        "businessMetrics": true,
        "alerting": true
    },
    "healthCheck": {
        "url": "$HEALTH_CHECK_URL",
        "interval": 60,
        "timeout": 10
    }
}
EOF
    
    success "Monitoring configuration created"
}

# Main deployment function
main() {
    log "Starting deployment of $DEPLOYMENT_NAME"
    
    # Trap to handle rollback on failure
    trap 'rollback' ERR
    
    check_user
    setup_backup_dir
    pre_deployment_checks
    create_backup
    deploy_application
    setup_monitoring
    
    # Health check with timeout
    if ! timeout $ROLLBACK_TIMEOUT health_check; then
        error "Health check timed out after $ROLLBACK_TIMEOUT seconds"
        exit 1
    fi
    
    post_deployment
    
    success "Deployment of $DEPLOYMENT_NAME completed successfully!"
    log "Deployment log: $LOG_FILE"
    log "Backup location: $(cat "$BACKUP_DIR/latest-backup.txt" 2>/dev/null || echo "N/A")"
}

# Command line options
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback
        ;;
    "health-check")
        health_check
        ;;
    "backup")
        setup_backup_dir
        create_backup
        ;;
    "help")
        echo "Usage: $0 [deploy|rollback|health-check|backup|help]"
        echo ""
        echo "Commands:"
        echo "  deploy      - Full deployment (default)"
        echo "  rollback    - Rollback to previous version"
        echo "  health-check - Run health check only"
        echo "  backup      - Create backup only"
        echo "  help        - Show this help"
        ;;
    *)
        error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac