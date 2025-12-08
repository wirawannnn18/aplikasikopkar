# Quick Reference: Wizard Anggota Keluar

**Quick guide untuk implementasi wizard anggota keluar**

---

## 📋 Wizard Flow (5 Steps)

```
1. VALIDASI → 2. PENCAIRAN → 3. PRINT → 4. UPDATE → 5. VERIFIKASI
```

---

## 🔧 Core Functions

### Step 1: Validasi
```javascript
validateHutangPiutang(anggotaId)
// Returns: { valid: boolean, error: object }
// Checks: pinjaman aktif, piutang aktif
```

### Step 2: Pencairan
```javascript
hitungTotalSimpanan(anggotaId)
// Returns: { success: boolean, data: { pokok, wajib, sukarela, total } }

prosesPencairanSimpanan(anggotaId, metodePembayaran, tanggalPembayaran, keterangan)
// Creates journals automatically
// Returns: { success: boolean, data: { pengembalianId, jurnalIds } }
```

### Step 3: Print
```javascript
generateDokumenAnggotaKeluar(anggotaId, pengembalianId)
// Generates: Surat Pengunduran Diri + Bukti Pencairan
// Returns: { suratId, buktiId, tanggalPrint }
```

### Step 4: Update
```javascript
updateStatusAnggotaKeluar(anggotaId, tanggalKeluar, alasanKeluar, pengembalianId, dokumenRefs)
// Sets: statusKeanggotaan = 'Keluar', pengembalianStatus = 'Selesai'
// Returns: { success: boolean }
```

### Step 5: Verifikasi
```javascript
verifikasiAccounting(anggotaId, pengembalianId)
// Verifies: journals recorded, debit = credit, no discrepancies
// Returns: { valid: boolean, details: object }
```

---

## 📊 Journal Entries

### Simpanan Pokok
```
Debit:  2-1100 (Simpanan Pokok)
Credit: 1-1000 (Kas) or 1-1100 (Bank)
```

### Simpanan Wajib
```
Debit:  2-1200 (Simpanan Wajib)
Credit: 1-1000 (Kas) or 1-1100 (Bank)
```

### Simpanan Sukarela
```
Debit:  2-1300 (Simpanan Sukarela)
Credit: 1-1000 (Kas) or 1-1100 (Bank)
```

---

## 🎨 UI Components

### Step Indicator
```html
<div class="wizard-steps">
  <div class="step active">1. Validasi</div>
  <div class="step">2. Pencairan</div>
  <div class="step">3. Print</div>
  <div class="step">4. Update</div>
  <div class="step">5. Verifikasi</div>
</div>
```

### Navigation Buttons
```html
<button onclick="wizard.previousStep()">Kembali</button>
<button onclick="wizard.cancel()">Batal</button>
<button onclick="wizard.nextStep()">Lanjut</button>
<button onclick="wizard.complete()">Selesai</button>
```

---

## 🛡️ Error Handling

### Rollback Pattern
```javascript
const snapshot = createSnapshot();
try {
    // Execute operations
    // ...
} catch (error) {
    restoreSnapshot(snapshot);
    throw error;
}
```

### Error Codes
- `OUTSTANDING_DEBT_EXISTS` - Has pinjaman/piutang
- `ANGGOTA_NOT_FOUND` - Anggota doesn't exist
- `INSUFFICIENT_BALANCE` - Kas/bank not enough
- `JOURNAL_IMBALANCE` - Debit ≠ Credit
- `SYSTEM_ERROR` - General error

---

## 📝 Audit Logging

### Log Events
```javascript
saveAuditLog({
    action: 'START_WIZARD_ANGGOTA_KELUAR',
    anggotaId: anggotaId,
    details: { ... }
});
```

### Key Actions
- `START_WIZARD_ANGGOTA_KELUAR`
- `COMPLETE_STEP_1_VALIDATION`
- `COMPLETE_STEP_2_PENCAIRAN`
- `COMPLETE_STEP_3_PRINT`
- `COMPLETE_STEP_4_UPDATE`
- `COMPLETE_STEP_5_VERIFICATION`
- `WIZARD_COMPLETED`
- `WIZARD_CANCELLED`

---

## ✅ Validation Checklist

### Before Step 2
- [ ] No pinjaman aktif (sisaPinjaman = 0)
- [ ] No piutang aktif (sisaPiutang = 0)

### Before Step 3
- [ ] Journals created
- [ ] Debit = Credit
- [ ] Pengembalian record saved

### Before Step 4
- [ ] Documents generated
- [ ] Document refs saved

### Before Step 5
- [ ] Status updated
- [ ] All fields populated

### Before Complete
- [ ] Accounting verified
- [ ] No discrepancies
- [ ] Audit logs complete

---

## 🧪 Testing Commands

### Unit Tests
```bash
npm test -- validateHutangPiutang
npm test -- hitungTotalSimpanan
npm test -- prosesPencairanSimpanan
```

### Integration Tests
```bash
npm test -- wizard-integration
```

### Manual Testing
1. Open wizard with anggota having debts → Should block
2. Open wizard with clean anggota → Should complete
3. Test error scenarios → Should rollback
4. Test print → Should generate documents
5. Check audit logs → Should be complete

---

## 📁 File Locations

### Spec Files
- Requirements: `.kiro/specs/wizard-anggota-keluar/requirements.md`
- Design: `.kiro/specs/wizard-anggota-keluar/design.md`
- Tasks: `.kiro/specs/wizard-anggota-keluar/tasks.md`

### Implementation Files
- Wizard Controller: `js/anggotaKeluarWizard.js` (new)
- Manager Functions: `js/anggotaKeluarManager.js` (modify)
- UI Functions: `js/anggotaKeluarUI.js` (modify)

### Test Files
- Unit Tests: `__tests__/wizardAnggotaKeluar.test.js`
- Integration Tests: `test_wizard_anggota_keluar.html`

---

## 🚀 Quick Start

1. **Read specs** - Understand requirements and design
2. **Start Task 1** - Create wizard controller
3. **Implement steps** - Follow task order 1-14
4. **Test incrementally** - Test each component
5. **Integration test** - Test complete flow
6. **Document** - Update user guide

---

## 💡 Tips

1. **Use snapshot/rollback** - Wrap all critical operations
2. **Log everything** - Audit logs are essential
3. **Validate early** - Check inputs before processing
4. **Test with real data** - Use actual anggota scenarios
5. **Keep UI simple** - Clear instructions at each step
6. **Handle errors gracefully** - Show actionable messages

---

## 📞 Common Issues

### Issue: Validation not blocking
**Solution:** Check `canNavigateNext()` logic

### Issue: Journals not balanced
**Solution:** Verify debit/credit calculation

### Issue: Rollback not working
**Solution:** Check snapshot creation timing

### Issue: Documents not printing
**Solution:** Check print window popup blocker

### Issue: Status not updating
**Solution:** Verify localStorage save

---

**Quick Reference Version:** 1.0  
**Last Updated:** 2024-12-09
