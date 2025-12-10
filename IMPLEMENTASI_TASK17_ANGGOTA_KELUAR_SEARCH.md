# Implementasi Task 17 - Update Anggota Keluar Search and Count

**Status**: ✅ COMPLETE  
**Tanggal**: 2024-12-09  
**Task**: Add search functionality to Anggota Keluar page and ensure accurate counts  
**Phase**: 5 - Laporan (Task 3 of 3)

---

## 📋 Overview

Task 17 requires adding search functionality to the Anggota Keluar page (`renderAnggotaKeluarPage()`) and ensuring that:
1. Search works only within anggota with `statusKeanggotaan === 'Keluar'`
2. Count shows only anggota with `statusKeanggotaan === 'Keluar'`
3. Search updates the displayed count dynamically

---

## 🎯 Objectives

1. ✅ Add search input field to Anggota Keluar tab
2. ✅ Implement search function that filters only within anggota keluar
3. ✅ Update count display to show filtered vs total
4. ✅ Search by NIK or Nama
5. ✅ Maintain correct filtering (statusKeanggotaan === 'Keluar')

---

## 🔧 Implementation

### Changes to `js/anggotaKeluarUI.js`

#### 1. Add Search Input to Anggota Keluar Tab


Added search input field with:
- Search by NIK or Nama
- Real-time filtering on keyup
- Reset button to clear search
- Count display showing "X of Y anggota keluar"

#### 2. Implement Search Function

```javascript
/**
 * Filter Anggota Keluar based on search text
 * Task 17: Search only within anggota with statusKeanggotaan === 'Keluar'
 * Requirements: 7.4, 7.5
 */
function filterAnggotaKeluarPage() {
    const searchText = document.getElementById('searchAnggotaKeluarPage')?.value.toLowerCase() || '';
    
    // Get all anggota keluar (statusKeanggotaan === 'Keluar')
    const anggotaList = JSON.parse(localStorage.getItem('anggota') || '[]');
    const anggotaKeluar = anggotaList.filter(a => a.statusKeanggotaan === 'Keluar');
    
    // Filter by search text (NIK or Nama)
    const filtered = anggotaKeluar.filter(a => {
        if (!searchText) return true;
        
        const nikMatch = a.nik && a.nik.toLowerCase().includes(searchText);
        const namaMatch = a.nama && a.nama.toLowerCase().includes(searchText);
        
        return nikMatch || namaMatch;
    });
    
    // Update count display
    const countFilteredElement = document.getElementById('countFilteredAnggotaKeluar');
    const countTotalElement = document.getElementById('countTotalAnggotaKeluar');
    
    if (countFilteredElement) {
        countFilteredElement.textContent = filtered.length;
    }
    if (countTotalElement) {
        countTotalElement.textContent = anggotaKeluar.length;
    }
    
    // Render filtered table
    renderTableAnggotaKeluarPage(filtered);
}
```

**Key Features**:
1. ✅ Searches only within `statusKeanggotaan === 'Keluar'`
2. ✅ Searches by NIK or Nama (case-insensitive)
3. ✅ Updates count dynamically
4. ✅ Re-renders table with filtered results

#### 3. Implement Reset Function

```javascript
/**
 * Reset search for Anggota Keluar page
 * Task 17: Clear search and show all anggota keluar
 */
function resetSearchAnggotaKeluarPage() {
    // Clear search input
    const searchInput = document.getElementById('searchAnggotaKeluarPage');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Re-filter (will show all)
    filterAnggotaKeluarPage();
}
```

#### 4. Implement Table Rendering Function

```javascript
/**
 * Render table for Anggota Keluar page
 * Task 17: Render filtered anggota keluar
 */
function renderTableAnggotaKeluarPage(anggotaKeluar) {
    const tbody = document.getElementById('tbodyAnggotaKeluarPage');
    
    if (!tbody) return;
    
    if (anggotaKeluar.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <i class="bi bi-inbox me-2"></i>Tidak ada data yang sesuai dengan pencarian
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = anggotaKeluar.map((anggota, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${anggota.nik}</td>
            <td>${anggota.nama}</td>
            <td>${anggota.departemen || '-'}</td>
            <td>${anggota.tanggalKeluar ? formatDateToDisplay(anggota.tanggalKeluar) : '-'}</td>
            <td>
                ${anggota.pengembalianStatus === 'Selesai' 
                    ? '<span class="badge bg-success">Selesai</span>'
                    : anggota.pengembalianStatus === 'Pending'
                    ? '<span class="badge bg-warning">Pending</span>'
                    : '<span class="badge bg-secondary">-</span>'
                }
            </td>
            <td>
                ${anggota.pengembalianStatus === 'Pending' ? `
                    <button class="btn btn-sm btn-primary" 
                            onclick="showWizardAnggotaKeluar('${anggota.id}')"
                            title="Lanjutkan Proses dengan Wizard">
                        <i class="bi bi-play-circle me-1"></i>Lanjutkan
                    </button>
                ` : anggota.pengembalianStatus === 'Selesai' ? `
                    <button class="btn btn-sm btn-info" 
                            onclick="handleCetakBuktiAnggotaKeluar('${anggota.id}')"
                            title="Cetak Bukti">
                        <i class="bi bi-printer me-1"></i>Cetak
                    </button>
                ` : `
                    <button class="btn btn-sm btn-warning" 
                            onclick="showWizardAnggotaKeluar('${anggota.id}')"
                            title="Proses dengan Wizard">
                        <i class="bi bi-magic me-1"></i>Proses
                    </button>
                `}
            </td>
        </tr>
    `).join('');
}
```

---

## 📝 Requirements Validation

### From `requirements.md`:

✅ **Requirement 7.4**: Search works only within anggota with statusKeanggotaan === 'Keluar'
- `filterAnggotaKeluarPage()` first filters by `statusKeanggotaan === 'Keluar'`
- Then applies search within that filtered set
- Never searches outside anggota keluar

✅ **Requirement 7.5**: Count shows only anggota with statusKeanggotaan === 'Keluar'
- Count display shows "X of Y anggota keluar"
- Both X (filtered) and Y (total) are from anggota keluar only
- Never includes aktif anggota in count

---

## 🔄 Data Flow

```
User types in search box
    ↓
filterAnggotaKeluarPage() called (onkeyup)
    ↓
Get all anggota from localStorage
    ↓
Filter by statusKeanggotaan === 'Keluar'
    ↓
Apply search filter (NIK or Nama)
    ↓
Update count display:
    - Filtered count
    - Total keluar count
    ↓
Render filtered table
    ↓
User sees only matching anggota keluar
```

---

## 🎨 UI Features

### Search Box

```html
<div class="card mb-3">
    <div class="card-body">
        <div class="row g-3">
            <div class="col-md-8">
                <label class="form-label">
                    <i class="bi bi-search me-1"></i>Pencarian
                </label>
                <input type="text" class="form-control" id="searchAnggotaKeluarPage" 
                    placeholder="Cari NIK atau Nama..." 
                    onkeyup="filterAnggotaKeluarPage()">
            </div>
            <div class="col-md-4 d-flex align-items-end">
                <button class="btn btn-secondary" onclick="resetSearchAnggotaKeluarPage()">
                    <i class="bi bi-x-circle me-1"></i>Reset
                </button>
            </div>
        </div>
        <div class="mt-2">
            <small class="text-muted">
                <i class="bi bi-info-circle me-1"></i>
                Menampilkan <strong id="countFilteredAnggotaKeluar">5</strong> dari <strong id="countTotalAnggotaKeluar">5</strong> anggota keluar
            </small>
        </div>
    </div>
</div>
```

**Features**:
- Real-time search (onkeyup)
- Reset button to clear search
- Dynamic count display
- User-friendly placeholder

---

## 🔍 Scenarios

### Scenario 1: Empty Search
```
Search: ""
Total Keluar: 5
Filtered: 5

Result: ✅ Shows all 5 anggota keluar
        ✅ Count: "5 dari 5 anggota keluar"
```

### Scenario 2: Search by NIK
```
Search: "1001"
Total Keluar: 5
Filtered: 1 (Budi Santoso, NIK: 1001)

Result: ✅ Shows only matching anggota
        ✅ Count: "1 dari 5 anggota keluar"
```

### Scenario 3: Search by Nama
```
Search: "Budi"
Total Keluar: 5
Filtered: 2 (Budi Santoso, Budi Prasetyo)

Result: ✅ Shows both matching anggota
        ✅ Count: "2 dari 5 anggota keluar"
```

### Scenario 4: No Match
```
Search: "xyz"
Total Keluar: 5
Filtered: 0

Result: ✅ Shows "Tidak ada data yang sesuai dengan pencarian"
        ✅ Count: "0 dari 5 anggota keluar"
```

### Scenario 5: Case Insensitive
```
Search: "SITI" (uppercase)
Total Keluar: 5
Filtered: 1 (Siti Rahayu)

Result: ✅ Case-insensitive search works
        ✅ Count: "1 dari 5 anggota keluar"
```

---

## 🧪 Testing

### Test File: `test_task17_anggota_keluar_search.html`

**Test Coverage:**

1. ✅ **Test 1: Search Scope**
   - Verifies search only within statusKeanggotaan === 'Keluar'
   - Checks total count is correct

2. ✅ **Test 2: Search by NIK**
   - Searches for specific NIK
   - Verifies correct anggota found

3. ✅ **Test 3: Search by Nama**
   - Searches for name
   - Verifies multiple matches work

4. ✅ **Test 4: Count Accuracy**
   - Verifies filtered count vs total count
   - Checks dynamic updates

5. ✅ **Test 5: Empty Search**
   - Verifies empty search shows all keluar
   - Checks count matches total

**Test Data:**
- 5 Anggota Keluar (should appear in search)
- 2 Anggota Aktif (should NOT appear in search)

**How to Run:**
1. Open `test_task17_anggota_keluar_search.html` in browser
2. Click "Setup Test Data"
3. Click "Run All Tests"
4. Click "Show Search Demo" for visual verification

---

## 💡 Key Improvements

### Before (No Search)
- No search functionality
- Static display of all anggota keluar
- No way to find specific anggota quickly

### After (With Search)
```javascript
// ✅ Search only within anggota keluar
const anggotaKeluar = anggotaList.filter(a => a.statusKeanggotaan === 'Keluar');

// ✅ Filter by search text
const filtered = anggotaKeluar.filter(a => {
    const nikMatch = a.nik && a.nik.toLowerCase().includes(searchText);
    const namaMatch = a.nama && a.nama.toLowerCase().includes(searchText);
    return nikMatch || namaMatch;
});

// ✅ Update count dynamically
countFilteredElement.textContent = filtered.length;
countTotalElement.textContent = anggotaKeluar.length;
```

**Benefits**:
1. ✅ Quick search by NIK or Nama
2. ✅ Real-time filtering
3. ✅ Accurate count display
4. ✅ Only searches within keluar anggota
5. ✅ Better UX for large datasets

---

## 📚 Related Tasks

### Phase 5: Laporan (COMPLETE!)

- ✅ Task 15: Update laporan simpanan to filter zero balances
- ✅ Task 16: Update Anggota Keluar page rendering
- ✅ **Task 17: Update Anggota Keluar search and count** ← Current (COMPLETE)

🎉 **PHASE 5 COMPLETE!** 🎉

---

## ✅ Completion Checklist

- [x] Search input field added to Anggota Keluar tab
- [x] Search function filters only statusKeanggotaan === 'Keluar'
- [x] Search by NIK or Nama (case-insensitive)
- [x] Count display shows filtered vs total
- [x] Reset button clears search
- [x] Table rendering function created
- [x] Real-time filtering on keyup
- [x] Test file created with 5 comprehensive tests
- [x] Implementation documented
- [x] Code added to `js/anggotaKeluarUI.js`

---

## 🎯 Success Criteria

✅ **All criteria met**:

1. ✅ Search works only within anggota keluar
2. ✅ Count shows only anggota keluar
3. ✅ Search by NIK or Nama
4. ✅ Real-time filtering
5. ✅ Dynamic count updates
6. ✅ Reset functionality
7. ✅ Comprehensive tests
8. ✅ User-friendly UI

---

## 📖 Usage Example

### User Workflow:

1. User clicks "Anggota Keluar" menu
2. System displays Anggota Keluar page with tabs
3. User clicks "Anggota Keluar" tab
4. User sees search box and all anggota keluar
5. User types "Budi" in search box
6. System filters in real-time:
   - Shows only matching anggota
   - Updates count: "2 dari 5 anggota keluar"
7. User clicks Reset button
8. System shows all anggota keluar again

---

## 🚀 Next Steps

1. ✅ Task 17 complete
2. ✅ **PHASE 5 COMPLETE!**
3. ⏭️ Proceed to Phase 6: Integration (3 tasks)
   - Task 18: Update export functions
   - Task 19: Integrate pencairan with wizard
   - Task 19.1: Property test for data preservation

---

## 📝 Notes

- **Search Scope**: Only searches within `statusKeanggotaan === 'Keluar'`
- **Real-time**: Filters on every keyup for instant feedback
- **Case-insensitive**: User-friendly search
- **Count Accuracy**: Always shows correct filtered vs total
- **Ready for Phase 6**: Integration tasks

---

**Task 17 Status**: ✅ **COMPLETE**  
**Implementation**: Added search functionality to Anggota Keluar page  
**Test File**: `test_task17_anggota_keluar_search.html` (5 tests)  
**Phase 5**: ✅ **COMPLETE** (3 of 3 tasks)  
**Ready for**: Phase 6 - Integration

