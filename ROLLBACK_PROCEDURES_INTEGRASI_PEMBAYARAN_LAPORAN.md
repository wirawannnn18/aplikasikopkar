# Rollback Procedures - Integrasi Pembayaran Laporan

## Overview

This document outlines the comprehensive rollback procedures for the Integrasi Pembayaran Laporan feature. These procedures ensure that the system can be safely reverted to the previous stable state in case of deployment issues or critical bugs.

## Rollback Decision Criteria

### Immediate Rollback Required
- [ ] Critical security vulnerability discovered
- [ ] Data corruption or loss detected
- [ ] System completely inaccessible
- [ ] Core payment functionality broken
- [ ] Error rate > 25% for core operations

### Consider Rollback
- [ ] Performance degradation > 50%
- [ ] Error rate 10-25% for core operations
- [ ] Major feature not working as expected
- [ ] User complaints about critical functionality
- [ ] Data inconsistency issues

### Monitor Before Decision
- [ ] Minor UI issues
- [ ] Performance degradation < 10%
- [ ] Error rate < 10%
- [ ] Non-critical feature issues

## Rollback Types

### 1. Application-Level Rollback (Recommended)
Revert only the application code while preserving data.

### 2. Full System Rollback
Revert both application and data (use only if data corruption detected).

### 3. Partial Feature Rollback
Disable specific features while keeping others active.

## Pre-Rollback Checklist

### ✅ Assessment
- [ ] Identify the specific issue causing the rollback
- [ ] Determine rollback type needed
- [ ] Assess impact on users and data
- [ ] Verify rollback artifacts are available
- [ ] Notify stakeholders of rollback decision

### ✅ Preparation
- [ ] Create current state backup (before rollback)
- [ ] Prepare rollback scripts and procedures
- [ ] Coordinate with team members
- [ ] Set up monitoring for rollback process
- [ ] Prepare communication for users

## Application-Level Rollback Procedure

### Step 1: Immediate Response
```bash
# 1. Create emergency backup of current state
cp -r /current/app /backups/emergency-$(date +%Y%m%d-%H%M%S)

# 2. Stop current application (if using process manager)
pm2 stop koperasi-app

# 3. Switch to previous version
git checkout [PREVIOUS_STABLE_TAG]
# OR restore from backup
cp -r /backups/pre-deployment/* /current/app/
```

### Step 2: Verify Previous Version
```bash
# 1. Check file integrity
ls -la /current/app/js/
ls -la /current/app/css/
ls -la /current/app/index.html

# 2. Verify configuration files
cat /current/app/vercel.json
cat /current/app/package.json
```

### Step 3: Data Compatibility Check
```javascript
// Run this in browser console to check data compatibility
function checkDataCompatibility() {
    try {
        // Check if new mode field exists in transactions
        const transactions = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
        const hasNewFields = transactions.some(t => t.mode !== undefined);
        
        if (hasNewFields) {
            console.log('⚠️ New data fields detected - may need data rollback');
            return false;
        }
        
        console.log('✅ Data compatible with previous version');
        return true;
    } catch (error) {
        console.error('❌ Data compatibility check failed:', error);
        return false;
    }
}

checkDataCompatibility();
```

### Step 4: Restart Application
```bash
# 1. Start application with previous version
pm2 start koperasi-app
# OR for static hosting
# Simply ensure files are served from rollback location

# 2. Verify application starts successfully
curl -I http://localhost:3000/
```

### Step 5: Verification
- [ ] Application loads successfully
- [ ] Login functionality works
- [ ] Manual payment processing works
- [ ] Transaction history displays correctly
- [ ] No JavaScript errors in console
- [ ] Core functionality verified

## Data Rollback Procedure (If Required)

### ⚠️ WARNING: Only use if data corruption is confirmed

### Step 1: Backup Current Data
```javascript
// Run in browser console to backup current data
function backupCurrentData() {
    const backup = {
        timestamp: new Date().toISOString(),
        pembayaranHutangPiutang: localStorage.getItem('pembayaranHutangPiutang'),
        anggota: localStorage.getItem('anggota'),
        jurnal: localStorage.getItem('jurnal'),
        auditLog: localStorage.getItem('auditLog')
    };
    
    console.log('Current data backup:', JSON.stringify(backup));
    // Save this output to a file for recovery
}

backupCurrentData();
```

### Step 2: Restore Previous Data
```javascript
// Run in browser console to restore previous data
function restorePreviousData(backupData) {
    try {
        // Restore each data store
        if (backupData.pembayaranHutangPiutang) {
            localStorage.setItem('pembayaranHutangPiutang', backupData.pembayaranHutangPiutang);
        }
        if (backupData.anggota) {
            localStorage.setItem('anggota', backupData.anggota);
        }
        if (backupData.jurnal) {
            localStorage.setItem('jurnal', backupData.jurnal);
        }
        if (backupData.auditLog) {
            localStorage.setItem('auditLog', backupData.auditLog);
        }
        
        console.log('✅ Data restored successfully');
        location.reload(); // Reload to apply changes
    } catch (error) {
        console.error('❌ Data restore failed:', error);
    }
}

// Use with backup data from pre-deployment
// restorePreviousData(PRE_DEPLOYMENT_BACKUP);
```

### Step 3: Data Migration Rollback
```javascript
// Remove new fields added by integration
function rollbackDataMigration() {
    try {
        // Remove mode field from transactions
        const transactions = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
        const cleanedTransactions = transactions.map(transaction => {
            const { mode, batchId, ...cleanTransaction } = transaction;
            return cleanTransaction;
        });
        
        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(cleanedTransactions));
        
        // Remove enhanced audit log entries
        const auditLog = JSON.parse(localStorage.getItem('auditLog') || '[]');
        const cleanedAuditLog = auditLog.filter(entry => !entry.mode);
        localStorage.setItem('auditLog', JSON.stringify(cleanedAuditLog));
        
        console.log('✅ Data migration rolled back successfully');
    } catch (error) {
        console.error('❌ Data migration rollback failed:', error);
    }
}

rollbackDataMigration();
```

## Partial Feature Rollback

### Disable Integration Features
```javascript
// Add this to disable integration features temporarily
window.FEATURE_FLAGS = {
    INTEGRATION_ENABLED: false,
    IMPORT_BATCH_ENABLED: false,
    UNIFIED_HISTORY_ENABLED: false
};

// Modify main controller to check feature flags
if (!window.FEATURE_FLAGS?.INTEGRATION_ENABLED) {
    // Redirect to original pembayaran hutang piutang
    window.location.href = '/pembayaran-hutang-piutang-original.html';
}
```

### Create Feature Toggle
```html
<!-- Add to index.html for emergency feature disable -->
<script>
// Emergency feature disable
if (localStorage.getItem('EMERGENCY_DISABLE_INTEGRATION') === 'true') {
    document.body.innerHTML = `
        <div style="padding: 20px; text-align: center;">
            <h2>Sistem dalam Pemeliharaan</h2>
            <p>Fitur integrasi sementara dinonaktifkan.</p>
            <a href="/pembayaran-hutang-piutang-original.html">
                Gunakan Menu Pembayaran Lama
            </a>
        </div>
    `;
}
</script>
```

## Post-Rollback Procedures

### Step 1: Verification
- [ ] All core functionality working
- [ ] No data loss confirmed
- [ ] Performance back to normal
- [ ] Error rates back to acceptable levels
- [ ] User access restored

### Step 2: Monitoring
- [ ] Monitor error logs for 2 hours post-rollback
- [ ] Check user activity and complaints
- [ ] Verify system stability
- [ ] Monitor performance metrics

### Step 3: Communication
- [ ] Notify stakeholders of rollback completion
- [ ] Update users about service restoration
- [ ] Document rollback reason and process
- [ ] Schedule post-mortem meeting

### Step 4: Investigation
- [ ] Analyze root cause of the issue
- [ ] Document lessons learned
- [ ] Update deployment procedures
- [ ] Plan fix for the original issue

## Rollback Scripts

### Emergency Rollback Script
```bash
#!/bin/bash
# emergency-rollback.sh

echo "🚨 EMERGENCY ROLLBACK INITIATED"
echo "Timestamp: $(date)"

# Create emergency backup
BACKUP_DIR="/backups/emergency-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR
cp -r /current/app/* $BACKUP_DIR/

# Restore previous version
if [ -d "/backups/pre-deployment" ]; then
    echo "📦 Restoring previous version..."
    cp -r /backups/pre-deployment/* /current/app/
    echo "✅ Application files restored"
else
    echo "❌ Pre-deployment backup not found!"
    exit 1
fi

# Restart services (if applicable)
if command -v pm2 &> /dev/null; then
    pm2 restart koperasi-app
    echo "🔄 Application restarted"
fi

echo "✅ ROLLBACK COMPLETED"
echo "Please verify system functionality"
```

### Data Rollback Script
```javascript
// data-rollback.js - Run in browser console
(function() {
    const ROLLBACK_CONFIRMATION = prompt('Type "CONFIRM ROLLBACK" to proceed with data rollback:');
    
    if (ROLLBACK_CONFIRMATION !== 'CONFIRM ROLLBACK') {
        console.log('❌ Rollback cancelled');
        return;
    }
    
    try {
        // Backup current state first
        const currentBackup = {
            timestamp: new Date().toISOString(),
            data: {
                pembayaranHutangPiutang: localStorage.getItem('pembayaranHutangPiutang'),
                anggota: localStorage.getItem('anggota'),
                jurnal: localStorage.getItem('jurnal'),
                auditLog: localStorage.getItem('auditLog')
            }
        };
        
        console.log('📦 Current state backed up:', currentBackup);
        
        // Restore from pre-deployment backup
        const preDeploymentBackup = JSON.parse(localStorage.getItem('PRE_DEPLOYMENT_BACKUP') || '{}');
        
        if (preDeploymentBackup.data) {
            Object.keys(preDeploymentBackup.data).forEach(key => {
                if (preDeploymentBackup.data[key]) {
                    localStorage.setItem(key, preDeploymentBackup.data[key]);
                }
            });
            
            console.log('✅ Data rollback completed');
            console.log('🔄 Reloading page...');
            location.reload();
        } else {
            console.error('❌ Pre-deployment backup not found');
        }
    } catch (error) {
        console.error('❌ Data rollback failed:', error);
    }
})();
```

## Emergency Contacts

| Role | Primary | Backup | Escalation |
|------|---------|--------|------------|
| Technical Lead | | | |
| System Admin | | | |
| Product Owner | | | |
| DevOps Engineer | | | |

## Rollback Log Template

```
ROLLBACK EXECUTION LOG
=====================

Date/Time: _______________
Initiated By: _______________
Rollback Type: _______________
Reason: _______________

Pre-Rollback State:
- Application Version: _______________
- Data State: _______________
- Error Rate: _______________

Rollback Steps Executed:
[ ] Step 1: _______________
[ ] Step 2: _______________
[ ] Step 3: _______________
[ ] Step 4: _______________

Post-Rollback Verification:
[ ] Application functional: _______________
[ ] Data integrity: _______________
[ ] Performance: _______________
[ ] User access: _______________

Issues Encountered: _______________

Lessons Learned: _______________

Next Steps: _______________
```

---

**Remember:** Always test rollback procedures in a staging environment before production deployment. Keep this document updated with any changes to the system architecture or deployment process.