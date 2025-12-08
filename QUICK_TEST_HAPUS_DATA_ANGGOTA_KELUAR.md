# Quick Test Guide: Hapus Data Anggota Keluar

## 🚀 Quick Start (5 Minutes)

### Option 1: Automated Test File
```
1. Open: test_hapus_data_anggota_keluar.html
2. Click: "Setup Test Data"
3. Click: "Run Validation Tests" → Should see 3 PASS
4. Click: "Test Delete" → Confirm → Should see success
5. Click: "View Data" → Verify pengembalian preserved
```

### Option 2: Manual Test in App
```
1. Open: index.html → Login as admin
2. Navigate: Anggota → Mark anggota keluar
3. Navigate: Anggota Keluar → Proses pengembalian
4. Click: "Cetak Surat Pengunduran Diri"
5. In print window: Click "Hapus Data Permanen"
6. Type: "HAPUS" → Confirm
7. Verify: Data deleted, toast success shown
```

## ✅ Critical Tests (Must Pass)

### Test 1: Happy Path
- [ ] Mark anggota keluar
- [ ] Proses pengembalian (status = Selesai)
- [ ] Delete button appears in table
- [ ] Click delete → Modal shows
- [ ] Type "HAPUS" → Data deleted
- [ ] Toast success shown
- [ ] Table refreshed

### Test 2: Validation
- [ ] Pengembalian not completed → Button hidden
- [ ] Active loan exists → Validation fails
- [ ] Outstanding debt → Validation fails
- [ ] Invalid ID → Error shown

### Test 3: Data Integrity
- [ ] Anggota deleted from localStorage
- [ ] Simpanan deleted (pokok, wajib, sukarela)
- [ ] POS transactions deleted
- [ ] Jurnal PRESERVED
- [ ] Pengembalian PRESERVED
- [ ] Audit log CREATED

## 🔍 Quick Verification Commands

### Check Data in Console
```javascript
// Check anggota
JSON.parse(localStorage.getItem('anggota')).filter(a => a.id === 'TEST_ID')

// Check simpanan
JSON.parse(localStorage.getItem('simpananPokok')).filter(s => s.anggotaId === 'TEST_ID')

// Check pengembalian (should be preserved)
JSON.parse(localStorage.getItem('pengembalian')).filter(p => p.anggotaId === 'TEST_ID')

// Check audit log
JSON.parse(localStorage.getItem('auditLog')).filter(a => a.action === 'DELETE_ANGGOTA_KELUAR_PERMANENT')
```

## 🐛 Common Issues

### Issue: Button not showing
**Cause**: pengembalianStatus !== 'Selesai'  
**Fix**: Complete pengembalian first

### Issue: Validation fails
**Cause**: Active loan or outstanding debt  
**Fix**: Clear all debts before deletion

### Issue: Modal not showing
**Cause**: Bootstrap not loaded  
**Fix**: Check Bootstrap JS/CSS loaded

### Issue: Data not deleted
**Cause**: Validation failed or error occurred  
**Fix**: Check console for errors, verify validation

## 📊 Expected Results

### Before Deletion
```
anggota: [{ id: 'X', statusKeanggotaan: 'Keluar', pengembalianStatus: 'Selesai' }]
simpananPokok: [{ anggotaId: 'X', jumlah: 0 }]
simpananWajib: [{ anggotaId: 'X', jumlah: 0 }]
pengembalian: [{ anggotaId: 'X', status: 'Selesai' }]
```

### After Deletion
```
anggota: [] // Deleted
simpananPokok: [] // Deleted
simpananWajib: [] // Deleted
pengembalian: [{ anggotaId: 'X', status: 'Selesai' }] // PRESERVED
auditLog: [{ action: 'DELETE_ANGGOTA_KELUAR_PERMANENT', anggotaId: 'X' }] // CREATED
```

## 🎯 Test Checklist

- [ ] Automated tests pass (test file)
- [ ] Manual happy path works
- [ ] Validation works correctly
- [ ] Data deleted correctly
- [ ] Data preserved correctly
- [ ] Audit log created
- [ ] UI/UX smooth (modal, buttons, toast)
- [ ] Error handling works
- [ ] Rollback works on error
- [ ] Integration with laporan works
- [ ] Integration with surat print works

## 📝 Report Template

```
Date: [DATE]
Tester: [NAME]
Status: ✅ PASS / ❌ FAIL

Tests Executed:
- Automated: [PASS/FAIL]
- Manual Happy Path: [PASS/FAIL]
- Validation: [PASS/FAIL]
- Data Integrity: [PASS/FAIL]

Issues Found:
1. [Issue description]

Notes:
[Additional notes]
```

## 🔗 Related Files

- **Test File**: `test_hapus_data_anggota_keluar.html`
- **User Guide**: `PANDUAN_HAPUS_DATA_ANGGOTA_KELUAR.md`
- **Full Test Plan**: `IMPLEMENTASI_TASK7_INTEGRATION_TESTING_HAPUS_DATA.md`
- **Implementation**: `js/anggotaKeluarManager.js`, `js/anggotaKeluarUI.js`

---

**Quick Test Duration**: ~5-10 minutes  
**Full Test Duration**: ~30-45 minutes
