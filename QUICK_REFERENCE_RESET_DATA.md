# Quick Reference - Reset Data Koperasi

## 🚀 Quick Start

### Untuk Pengguna

```
1. Login sebagai Super Admin
2. Menu: Pengaturan Sistem → Reset Data Koperasi
3. Pilih: Full Reset atau Selective Reset
4. Konfirmasi 2x
5. Tunggu selesai
6. Ikuti Setup Wizard
```

### Untuk Testing

```
1. Buka: test_reset_data_koperasi.html
2. Klik: "Setup Test Data"
3. Klik: "Run All Tests"
4. Review hasil
```

## 📁 File Structure

```
js/
├── resetDataKoperasi.js    # Core services (41KB)
└── resetDataUI.js           # UI components (54KB)

docs/
├── PANDUAN_RESET_DATA_KOPERASI.md              # User guide
├── IMPLEMENTASI_RESET_DATA_KOPERASI_SUMMARY.md # Dev summary
└── QUICK_REFERENCE_RESET_DATA.md               # This file

tests/
└── test_reset_data_koperasi.html               # Test suite

.kiro/specs/reset-data-koperasi/
├── requirements.md          # 10 user stories, 47 criteria
├── design.md               # Architecture, 23 properties
└── tasks.md                # 17 tasks, 50+ sub-tasks
```

## 🔑 Key Classes

### CategoryManager
```javascript
const cm = new CategoryManager();
cm.getAllCategories()        // Get all categories with counts
cm.getCategoryGroups()       // Get grouped categories
cm.getKeysForCategory(key)   // Get localStorage keys
cm.calculateSize(categories) // Calculate total size
```

### ResetService
```javascript
const rs = new ResetService();
rs.getAvailableCategories()  // Get categories
rs.validateResetRequest(req) // Validate request
rs.executeReset(req, onProgress) // Execute reset
rs.performDryRun(req)        // Test mode simulation
```

### SetupWizardService
```javascript
const sws = new SetupWizardService();
sws.getSetupSteps()          // Get all steps
sws.completeStep(id)         // Mark step complete
sws.getProgress()            // Get progress %
```

## 🎯 Common Tasks

### Akses Halaman Reset
```javascript
renderResetDataPage()
// atau
navigateToResetData()
```

### Toggle Test Mode
```javascript
toggleTestMode()
// atau manual:
sessionStorage.setItem('resetTestMode', 'true')
```

### Show Setup Wizard
```javascript
renderSetupWizardPage()
// atau
showSetupWizard()
```

### Check Post-Reset Flag
```javascript
const resetFlag = localStorage.getItem('systemResetPerformed');
if (resetFlag) {
    // System was reset
}
```

## 📊 Data Categories

### Master Data (7)
- anggota, departemen, users*, barang, supplier, kategori, satuan
- *users = protected

### Transaction Data (7)
- simpananPokok, simpananWajib, simpananSukarela
- pinjaman, penjualan, pembelian, jurnal

### System Settings (4)
- koperasi, coa, periodeAkuntansi, pengaturan

## ⚙️ Configuration

### Constants (in resetDataKoperasi.js)
```javascript
RESET_CONSTANTS = {
    CONFIRMATION_TEXT: 'HAPUS SEMUA DATA',
    SESSION_KEY: 'currentUser',
    RESET_FLAG_KEY: 'systemResetPerformed',
    TEST_MODE_KEY: 'resetTestMode',
    RATE_LIMIT_KEY: 'resetRateLimit',
    COOLDOWN_PERIOD: 5 * 60 * 1000, // 5 minutes
    SETUP_WIZARD_KEY: 'setupWizardState'
}
```

### Modify Cooldown
```javascript
// Change to 10 minutes
COOLDOWN_PERIOD: 10 * 60 * 1000
```

### Modify Confirmation Text
```javascript
CONFIRMATION_TEXT: 'DELETE ALL DATA'
```

## 🧪 Testing Commands

### Setup Test Data
```javascript
setupTestData()
```

### Clear Test Data
```javascript
clearTestData()
```

### Run All Tests
```javascript
runAllTests()
```

### Run Specific Test
```javascript
testCategoryManager()
testResetValidationService()
testResetService()
testSetupWizardService()
testFullResetFlow()
```

## 🔒 Security Checks

### Check Permission
```javascript
const validationService = new ResetValidationService();
const hasPermission = validationService.validatePermissions(user);
// Returns: true for super_admin, false otherwise
```

### Check Rate Limit
```javascript
const resetService = new ResetService();
const rateLimitCheck = resetService._checkRateLimit(user);
// Returns: { allowed: boolean, message: string }
```

## 📝 Audit Logging

### View Reset Logs
```javascript
// In browser console
const logs = auditLogger.getAuditLogs({ 
    operation: 'RESET_STARTED' 
});
console.table(logs);
```

### Export Audit Logs
```javascript
auditLogger.exportLogs({ 
    operation: 'RESET_COMPLETED' 
});
```

## 🐛 Debugging

### Enable Console Logging
```javascript
// In browser console
localStorage.setItem('debugMode', 'true');
```

### Check localStorage Usage
```javascript
// Calculate total size
let total = 0;
for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
    }
}
console.log('Total localStorage:', (total / 1024).toFixed(2), 'KB');
```

### View All Categories with Data
```javascript
const cm = new CategoryManager();
const categories = cm.getAllCategories();
console.table(categories.map(c => ({
    key: c.key,
    label: c.label,
    count: c.count,
    size: (c.size / 1024).toFixed(2) + ' KB'
})));
```

## 🚨 Troubleshooting

### Reset Button Disabled
```javascript
// Check if categories selected (for selective reset)
const checkboxes = document.querySelectorAll('.category-checkbox:checked');
console.log('Selected:', checkboxes.length);
```

### Backup Failed
```javascript
// Check localStorage quota
try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    console.log('localStorage available');
} catch (e) {
    console.error('localStorage full or unavailable');
}
```

### Test Mode Not Working
```javascript
// Check test mode status
const testMode = sessionStorage.getItem('resetTestMode');
console.log('Test Mode:', testMode === 'true' ? 'ON' : 'OFF');
```

## 📞 Quick Help

### User Issues
→ See: `PANDUAN_RESET_DATA_KOPERASI.md`

### Developer Issues
→ See: `IMPLEMENTASI_RESET_DATA_KOPERASI_SUMMARY.md`

### Spec Details
→ See: `.kiro/specs/reset-data-koperasi/`

## 🎨 UI Customization

### Change Warning Colors
```css
/* In your CSS file */
.alert-danger {
    background-color: #your-color;
}
```

### Modify Progress Bar
```javascript
// In resetDataUI.js, updateProgressModal()
progressBar.style.width = progress + '%';
progressBar.className = 'progress-bar bg-success'; // Change color
```

## 🔄 Common Workflows

### Full Reset for New Koperasi
```
1. Backup manual (optional)
2. Reset → Full Reset
3. Confirm 2x
4. Wait for completion
5. Setup Wizard:
   - Data Koperasi ✓
   - Periode Akuntansi ✓
   - COA ✓
   - Users ✓
   - Anggota ✓
6. Done!
```

### Selective Reset for Testing
```
1. Enable Test Mode
2. Reset → Selective
3. Select test categories
4. Confirm 2x
5. View simulation
6. Download report
7. Disable Test Mode
```

### Restore After Reset
```
1. Menu → Backup & Restore
2. Select backup file
3. Preview backup
4. Confirm restore
5. Wait for completion
6. Verify data
```

## 💡 Pro Tips

1. **Always use Test Mode first** untuk familiarisasi
2. **Create manual backup** sebelum reset penting
3. **Schedule reset** di luar jam operasional
4. **Inform users** sebelum reset
5. **Keep backup files** minimal 3 bulan
6. **Test restore** secara berkala
7. **Monitor audit logs** untuk suspicious activity
8. **Document custom settings** sebelum reset

## 📊 Performance Tips

### For Large Data (>10,000 records)
- Reset saat off-peak hours
- Close other browser tabs
- Use modern browser (Chrome/Firefox)
- Ensure stable internet connection

### For Slow Systems
- Enable Test Mode untuk preview
- Reset kategori satu per satu (selective)
- Clear browser cache sebelum reset

## 🔗 Related Features

- **Backup & Restore**: `js/backup.js`
- **Audit Logger**: `js/auditLogger.js`
- **System Settings**: `js/systemSettings.js`

---

**Last Updated**: 2024
**Version**: 1.0.0
**Status**: Production Ready ✅

