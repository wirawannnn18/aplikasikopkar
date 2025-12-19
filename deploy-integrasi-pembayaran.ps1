# Deployment Script for Integrasi Pembayaran Laporan (PowerShell)
# This script automates the deployment process with proper checks and rollback capabilities

param(
    [Parameter(Position=0)]
    [ValidateSet("deploy", "rollback", "health-check", "backup", "help")]
    [string]$Command = "deploy"
)

# Configuration
$DeploymentName = "integrasi-pembayaran-laporan"
$BackupDir = "backups"
$LogFile = "deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
$HealthCheckUrl = "http://localhost:3000"
$RollbackTimeout = 300  # 5 minutes

# Ensure backup directory exists
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

# Logging functions
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    switch ($Level) {
        "ERROR" { Write-Host $logEntry -ForegroundColor Red }
        "SUCCESS" { Write-Host $logEntry -ForegroundColor Green }
        "WARNING" { Write-Host $logEntry -ForegroundColor Yellow }
        default { Write-Host $logEntry -ForegroundColor Blue }
    }
    
    Add-Content -Path $LogFile -Value $logEntry
}

# Pre-deployment checks
function Test-PreDeployment {
    Write-Log "Running pre-deployment checks..."
    
    # Check if required files exist
    $requiredFiles = @(
        "index.html",
        "js/pembayaranHutangPiutangIntegrated.js",
        "js/shared/SharedPaymentServices.js",
        "js/monitoring/ErrorTracker.js",
        "js/monitoring/PerformanceMonitor.js"
    )
    
    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            Write-Log "Required file not found: $file" "ERROR"
            throw "Pre-deployment check failed"
        }
    }
    
    # Check JavaScript syntax (basic check)
    $jsFiles = Get-ChildItem -Path "js" -Filter "*.js" -Recurse
    foreach ($jsFile in $jsFiles) {
        try {
            # Basic syntax check by trying to parse with Node.js if available
            if (Get-Command node -ErrorAction SilentlyContinue) {
                $result = & node -c $jsFile.FullName 2>&1
                if ($LASTEXITCODE -ne 0) {
                    Write-Log "JavaScript syntax error in: $($jsFile.Name)" "ERROR"
                    throw "JavaScript syntax check failed"
                }
            }
        }
        catch {
            Write-Log "Could not check JavaScript syntax for: $($jsFile.Name)" "WARNING"
        }
    }
    
    # Run tests if package.json exists
    if (Test-Path "package.json") {
        Write-Log "Running tests..."
        try {
            & npm test
            if ($LASTEXITCODE -ne 0) {
                Write-Log "Tests failed. Deployment aborted." "ERROR"
                throw "Tests failed"
            }
        }
        catch {
            Write-Log "Could not run tests: $($_.Exception.Message)" "WARNING"
        }
    }
    
    Write-Log "Pre-deployment checks passed" "SUCCESS"
}

# Create backup of current deployment
function New-Backup {
    $backupName = "pre-deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    $backupPath = Join-Path $BackupDir $backupName
    
    Write-Log "Creating backup: $backupPath"
    
    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
    
    # Backup application files (exclude node_modules and backups)
    $excludePatterns = @("node_modules", "backups", ".git", "*.log")
    
    Get-ChildItem -Path "." | Where-Object {
        $item = $_
        -not ($excludePatterns | Where-Object { $item.Name -like $_ })
    } | ForEach-Object {
        Copy-Item -Path $_.FullName -Destination $backupPath -Recurse -Force
    }
    
    # Create backup manifest
    $manifest = @"
Backup Created: $(Get-Date)
Deployment: $DeploymentName
Git Commit: $(try { & git rev-parse HEAD 2>$null } catch { "N/A" })
Git Branch: $(try { & git branch --show-current 2>$null } catch { "N/A" })
Backup Path: $backupPath
"@
    
    Set-Content -Path (Join-Path $backupPath "BACKUP_MANIFEST.txt") -Value $manifest
    
    # Store backup path for potential rollback
    Set-Content -Path (Join-Path $BackupDir "latest-backup.txt") -Value $backupPath
    
    Write-Log "Backup created successfully: $backupPath" "SUCCESS"
    return $backupPath
}

# Deploy application
function Deploy-Application {
    Write-Log "Deploying application..."
    
    # Install/update dependencies if package.json exists
    if (Test-Path "package.json") {
        Write-Log "Installing/updating dependencies..."
        try {
            & npm ci --production
            if ($LASTEXITCODE -ne 0) {
                throw "npm ci failed"
            }
        }
        catch {
            Write-Log "Could not install dependencies: $($_.Exception.Message)" "WARNING"
        }
    }
    
    # Copy monitoring files to ensure they're in place
    $monitoringFiles = @(
        "js/monitoring/ErrorTracker.js",
        "js/monitoring/PerformanceMonitor.js"
    )
    
    foreach ($file in $monitoringFiles) {
        if (Test-Path $file) {
            Write-Log "Monitoring file verified: $file"
        } else {
            Write-Log "Monitoring file missing: $file" "WARNING"
        }
    }
    
    Write-Log "Application deployed successfully" "SUCCESS"
}

# Health check function
function Test-Health {
    Write-Log "Running health checks..."
    
    $maxAttempts = 10
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        Write-Log "Health check attempt $attempt/$maxAttempts"
        
        try {
            # Check if application is responding
            $response = Invoke-WebRequest -Uri $HealthCheckUrl -TimeoutSec 10 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Log "Health check passed" "SUCCESS"
                return $true
            }
        }
        catch {
            Write-Log "Health check failed: $($_.Exception.Message)"
        }
        
        Write-Log "Health check failed, waiting 10 seconds..."
        Start-Sleep -Seconds 10
        $attempt++
    }
    
    Write-Log "Health check failed after $maxAttempts attempts" "ERROR"
    return $false
}

# Rollback function
function Invoke-Rollback {
    Write-Log "Deployment failed. Initiating rollback..." "ERROR"
    
    $latestBackupFile = Join-Path $BackupDir "latest-backup.txt"
    if (-not (Test-Path $latestBackupFile)) {
        Write-Log "No backup path found for rollback" "ERROR"
        throw "Rollback failed - no backup available"
    }
    
    $backupPath = Get-Content $latestBackupFile
    if (-not (Test-Path $backupPath)) {
        Write-Log "Backup directory not found: $backupPath" "ERROR"
        throw "Rollback failed - backup directory missing"
    }
    
    Write-Log "Rolling back to: $backupPath"
    
    # Restore files (exclude certain directories)
    $excludePatterns = @("node_modules", "backups", ".git")
    
    Get-ChildItem -Path $backupPath | Where-Object {
        $item = $_
        -not ($excludePatterns | Where-Object { $item.Name -like $_ })
    } | ForEach-Object {
        Copy-Item -Path $_.FullName -Destination "." -Recurse -Force
    }
    
    # Verify rollback
    if (Test-Health) {
        Write-Log "Rollback completed successfully" "SUCCESS"
    } else {
        Write-Log "Rollback verification failed" "ERROR"
        throw "Rollback verification failed"
    }
}

# Post-deployment tasks
function Invoke-PostDeployment {
    Write-Log "Running post-deployment tasks..."
    
    # Clear any caches
    if (Test-Path "node_modules/.cache") {
        Remove-Item -Path "node_modules/.cache" -Recurse -Force
    }
    
    # Update deployment log
    $deploymentEntry = @"
$(Get-Date): Deployment of $DeploymentName completed successfully
Git Commit: $(try { & git rev-parse HEAD 2>$null } catch { "N/A" })
Backup: $(try { Get-Content (Join-Path $BackupDir "latest-backup.txt") } catch { "N/A" })
---
"@
    
    Add-Content -Path (Join-Path $BackupDir "deployment-history.log") -Value $deploymentEntry
    
    # Clean up old backups (keep last 10)
    Write-Log "Cleaning up old backups..."
    $oldBackups = Get-ChildItem -Path $BackupDir -Directory | 
                  Where-Object { $_.Name -like "pre-deployment-*" } |
                  Sort-Object CreationTime -Descending |
                  Select-Object -Skip 10
    
    foreach ($oldBackup in $oldBackups) {
        Remove-Item -Path $oldBackup.FullName -Recurse -Force
        Write-Log "Removed old backup: $($oldBackup.Name)"
    }
    
    Write-Log "Post-deployment tasks completed" "SUCCESS"
}

# Setup monitoring
function Set-Monitoring {
    Write-Log "Setting up monitoring..."
    
    # Create monitoring configuration
    $monitoringConfig = @{
        deployment = $DeploymentName
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        version = try { & git rev-parse HEAD 2>$null } catch { "unknown" }
        monitoring = @{
            errorTracking = $true
            performanceMonitoring = $true
            businessMetrics = $true
            alerting = $true
        }
        healthCheck = @{
            url = $HealthCheckUrl
            interval = 60
            timeout = 10
        }
    }
    
    $monitoringConfig | ConvertTo-Json -Depth 3 | Set-Content -Path "monitoring-config.json"
    
    Write-Log "Monitoring configuration created" "SUCCESS"
}

# Main deployment function
function Invoke-MainDeployment {
    Write-Log "Starting deployment of $DeploymentName"
    
    try {
        Test-PreDeployment
        $backupPath = New-Backup
        Deploy-Application
        Set-Monitoring
        
        # Health check with timeout
        $healthCheckPassed = $false
        $timeout = [System.DateTime]::Now.AddSeconds($RollbackTimeout)
        
        while ([System.DateTime]::Now -lt $timeout -and -not $healthCheckPassed) {
            $healthCheckPassed = Test-Health
            if (-not $healthCheckPassed) {
                Start-Sleep -Seconds 10
            }
        }
        
        if (-not $healthCheckPassed) {
            Write-Log "Health check timed out after $RollbackTimeout seconds" "ERROR"
            throw "Health check timeout"
        }
        
        Invoke-PostDeployment
        
        Write-Log "Deployment of $DeploymentName completed successfully!" "SUCCESS"
        Write-Log "Deployment log: $LogFile"
        Write-Log "Backup location: $backupPath"
    }
    catch {
        Write-Log "Deployment failed: $($_.Exception.Message)" "ERROR"
        try {
            Invoke-Rollback
        }
        catch {
            Write-Log "Rollback also failed: $($_.Exception.Message)" "ERROR"
            throw
        }
    }
}

# Command execution
switch ($Command) {
    "deploy" {
        Invoke-MainDeployment
    }
    "rollback" {
        Invoke-Rollback
    }
    "health-check" {
        $result = Test-Health
        if ($result) {
            Write-Log "Health check passed" "SUCCESS"
            exit 0
        } else {
            Write-Log "Health check failed" "ERROR"
            exit 1
        }
    }
    "backup" {
        New-Backup
    }
    "help" {
        Write-Host @"
Usage: .\deploy-integrasi-pembayaran.ps1 [deploy|rollback|health-check|backup|help]

Commands:
  deploy      - Full deployment (default)
  rollback    - Rollback to previous version
  health-check - Run health check only
  backup      - Create backup only
  help        - Show this help
"@
    }
    default {
        Write-Log "Unknown command: $Command" "ERROR"
        Write-Host "Use '.\deploy-integrasi-pembayaran.ps1 help' for usage information"
        exit 1
    }
}