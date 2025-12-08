# Spec Complete: Filter Anggota Keluar dari Master Anggota

## Status: ✅ READY FOR IMPLEMENTATION

Spec telah dibuat lengkap dengan requirements, design, dan tasks untuk memperbaiki masalah anggota keluar yang masih muncul di Master Anggota.

---

## 📋 Masalah yang Diperbaiki

**Masalah:** Anggota dengan `statusKeanggotaan === 'Keluar'` masih ditampilkan di Master Anggota karena tidak ada filtering yang diterapkan.

**Penyebab:** Inkonsistensi antara berbagai spec:
- Spec "auto-delete-anggota-keluar" menghapus filter dengan asumsi data akan auto-delete
- Spec "fix-pengembalian-simpanan" menambahkan filter
- Kode saat ini tidak memiliki filter sama sekali

**Solusi:** Implementasi filtering konsisten di semua tempat yang menampilkan daftar anggota.

---

## 📁 Lokasi Spec

```
.kiro/specs/filter-anggota-keluar-master/
├── requirements.md  ✅ Complete
├── design.md        ✅ Complete
└── tasks.md         ✅ Complete
```

---

## 🎯 Requirements Summary

### 6 Requirements dengan 30 Acceptance Criteria:

1. **Requirement 1:** Filter anggota keluar dari Master Anggota table (5 criteria)
2. **Requirement 2:** Filter anggota keluar dari dropdown selections (5 criteria)
3. **Requirement 3:** Filter controls work with anggota keluar exclusion (5 criteria)
4. **Requirement 4:** Anggota keluar visible only in dedicated menu (5 criteria)
5. **Requirement 5:** Consistent filtering logic across modules (5 criteria)
6. **Requirement 6:** Sorting works with filtered data (5 criteria)

---

## 🏗️ Design Highlights

### Core Components:

1. **`filterActiveAnggota(anggotaList)`**
   - Central filtering function
   - Returns anggota with statusKeanggotaan !== 'Keluar'
   - Reusable across all modules

2. **`getActiveAnggotaCount()`**
   - Helper function for counting active anggota
   - Used in badges and counters

### Modified Functions:

- `renderAnggota()` - Apply filtering before rendering
- `renderTableAnggota()` - Filter table data
- `filterAnggota()` - Start with active anggota
- `sortAnggotaByDate()` - Sort only active anggota
- `exportAnggota()` - Export only active anggota
- Simpanan dropdowns - Filter dropdown options

### 7 Correctness Properties:

1. Master Anggota Exclusion
2. Count Consistency
3. Dropdown Exclusion
4. Filter Preservation
5. Data Preservation
6. Anggota Keluar Visibility
7. Sort Preservation

---

## ✅ Implementation Tasks

### 10 Main Tasks:

- [ ] 1. Create core filtering function
- [ ]* 1.1 Property test: filtering exclusion
- [ ]* 1.2 Property test: count consistency
- [ ]* 1.3 Property test: data preservation
- [ ] 2. Update Master Anggota rendering
- [ ] 3. Update table rendering function
- [ ] 4. Update filter function
- [ ]* 4.1 Property test: filter preservation
- [ ] 5. Update sort function
- [ ]* 5.1 Property test: sort preservation
- [ ] 6. Update export function
- [ ] 7. Update simpanan dropdowns
- [ ]* 7.1 Property test: dropdown exclusion
- [ ] 8. Checkpoint - Ensure all tests pass
- [ ] 9. Update documentation
- [ ] 10. Integration testing

**Note:** Tasks marked with `*` are optional (property-based tests)

---

## 🚀 How to Start Implementation

### Option 1: Execute Tasks Manually

1. Open `.kiro/specs/filter-anggota-keluar-master/tasks.md`
2. Click "Start task" next to Task 1
3. Follow the implementation plan step by step

### Option 2: Ask Kiro to Implement

```
Tolong implementasikan Task 1 dari spec filter-anggota-keluar-master
```

---

## 📊 Expected Outcomes

### After Implementation:

✅ Master Anggota hanya menampilkan anggota aktif
✅ Dropdown selections tidak menampilkan anggota keluar
✅ Filter dan sort bekerja dengan data yang sudah difilter
✅ Data anggota keluar tetap tersimpan di localStorage
✅ Anggota keluar hanya visible di menu "Anggota Keluar"
✅ Export hanya mengekspor anggota aktif
✅ Consistent filtering logic di semua modul

---

## 🧪 Testing Strategy

### Unit Tests:
- Test `filterActiveAnggota()` function
- Test `getActiveAnggotaCount()` function
- Test dropdown rendering

### Property-Based Tests (Optional):
- 6 property tests using fast-check
- Minimum 100 iterations per test
- Validates universal properties

### Integration Tests:
- Master Anggota rendering
- Dropdown population
- Filter interaction
- Sort interaction
- Export function

---

## 📝 Key Design Decisions

1. **Filtering at Display Time:**
   - Data preserved in localStorage
   - Filtering applied when rendering
   - No data deletion

2. **Reusable Function:**
   - Single `filterActiveAnggota()` function
   - Used across all modules
   - Consistent behavior

3. **Backward Compatible:**
   - No data migration needed
   - statusKeanggotaan field already exists
   - Easy rollback if needed

4. **Performance Optimized:**
   - Filter operation < 10ms for 1000 anggota
   - Rendering < 100ms for 100 anggota
   - Dropdown population < 50ms

---

## 🔄 Migration Strategy

### No Data Migration Required:
- statusKeanggotaan field already exists
- Filter function handles missing field gracefully
- Existing data remains intact

### Code Changes:
- Replace inline filters with `filterActiveAnggota()`
- Update all dropdown renders
- Add filtering to Master Anggota

### Rollback Plan:
- Remove `filterActiveAnggota()` calls
- Revert to previous inline filtering
- No data changes to rollback

---

## 📚 Related Specs

1. **auto-delete-anggota-keluar**
   - Handles automatic deletion after 30 days
   - This spec handles display filtering

2. **fix-pengembalian-simpanan**
   - Handles pengembalian process
   - This spec ensures consistent filtering

3. **fix-status-anggota-keluar**
   - Handles status consistency
   - This spec handles visibility

---

## 🎓 Learning Points

### Why This Spec Was Needed:

1. **Inkonsistensi antar spec** menyebabkan confusion
2. **Komentar di kode** tidak match dengan implementasi
3. **Filtering logic** tersebar di berbagai tempat
4. **Tidak ada single source of truth** untuk filtering

### Best Practices Applied:

1. ✅ Single Responsibility: One function for filtering
2. ✅ DRY Principle: Reusable across modules
3. ✅ Data Preservation: Never delete, only filter
4. ✅ Consistent Behavior: Same logic everywhere
5. ✅ Property-Based Testing: Verify universal properties

---

## 🚦 Next Steps

1. **Review spec documents** untuk memastikan semuanya clear
2. **Start with Task 1** untuk create core filtering function
3. **Run tests** setelah setiap task
4. **Ask questions** jika ada yang tidak jelas
5. **Checkpoint at Task 8** untuk verify semua bekerja

---

## 📞 Support

Jika ada pertanyaan atau butuh klarifikasi:
1. Baca design.md untuk detail teknis
2. Baca requirements.md untuk acceptance criteria
3. Tanya Kiro untuk penjelasan lebih lanjut

---

**Status:** ✅ SPEC COMPLETE - READY FOR IMPLEMENTATION

**Created:** 2024-12-09
**Spec Location:** `.kiro/specs/filter-anggota-keluar-master/`
