# Design Document: Filter Anggota Keluar dari Master Anggota

## Overview

This design implements a consistent filtering mechanism to exclude anggota with `statusKeanggotaan === 'Keluar'` from Master Anggota displays, dropdown selections, and search results, while preserving the data in localStorage for audit and historical reporting purposes. The solution ensures anggota keluar are only visible in the dedicated "Anggota Keluar" menu.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                      │
├─────────────────────────────────────────────────────────────┤
│  Master Anggota  │  Dropdowns  │  Filters  │  Anggota Keluar│
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Filtering Logic Layer                      │
├─────────────────────────────────────────────────────────────┤
│  • filterActiveAnggota()                                     │
│  • filterAnggotaKeluar()                                     │
│  • getActiveAnggotaForDropdown()                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Storage Layer                        │
├─────────────────────────────────────────────────────────────┤
│  localStorage.anggota (includes ALL anggota)                 │
└─────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Data Preservation**: Never delete anggota keluar from localStorage
2. **View Filtering**: Apply filtering at display/render time
3. **Consistent Logic**: Use same filter predicate across all modules
4. **Single Source of Truth**: localStorage contains complete data

## Components and Interfaces

### 1. Core Filtering Functions

#### `filterActiveAnggota(anggotaList)`

Filters out anggota with statusKeanggotaan === 'Keluar'.

**Location:** `js/koperasi.js`

**Signature:**
```javascript
function filterActiveAnggota(anggotaList) {
    return anggotaList.filter(a => a.statusKeanggotaan !== 'Keluar');
}
```

**Parameters:**
- `anggotaList` (Array): Array of anggota objects

**Returns:**
- Array of anggota objects excluding those with statusKeanggotaan === 'Keluar'

**Usage:**
```javascript
const allAnggota = JSON.parse(localStorage.getItem('anggota') || '[]');
const activeAnggota = filterActiveAnggota(allAnggota);
```

---

#### `getActiveAnggotaCount()`

Returns count of active anggota (excluding keluar).

**Location:** `js/koperasi.js`

**Signature:**
```javascript
function getActiveAnggotaCount() {
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    return filterActiveAnggota(anggota).length;
}
```

**Returns:**
- Number: Count of active anggota

---

### 2. Modified Functions

#### `renderAnggota()`

**Location:** `js/koperasi.js`

**Changes:**
- Apply `filterActiveAnggota()` to anggota list before rendering
- Update total count badge to show only active anggota
- Update "Menampilkan X dari Y anggota" to show active count

**Before:**
```javascript
const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
const totalActive = anggota.length;
```

**After:**
```javascript
const allAnggota = JSON.parse(localStorage.getItem('anggota') || '[]');
const anggota = filterActiveAnggota(allAnggota);
const totalActive = anggota.length;
```

---

#### `renderTableAnggota(filteredData)`

**Location:** `js/koperasi.js`

**Changes:**
- Apply `filterActiveAnggota()` when no filteredData provided
- Ensure filtered data also excludes anggota keluar

**Before:**
```javascript
let anggota = filteredData || JSON.parse(localStorage.getItem('anggota') || '[]');
// No need to filter - anggota keluar already auto-deleted (Task 5.2)
```

**After:**
```javascript
let anggota = filteredData || JSON.parse(localStorage.getItem('anggota') || '[]');
// Filter out anggota keluar from display
anggota = filterActiveAnggota(anggota);
```

---

#### `filterAnggota()`

**Location:** `js/koperasi.js`

**Changes:**
- Start with active anggota only
- Apply search, departemen, tipe, status, and date filters on active anggota

**Before:**
```javascript
let anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
```

**After:**
```javascript
const allAnggota = JSON.parse(localStorage.getItem('anggota') || '[]');
let anggota = filterActiveAnggota(allAnggota);
```

---

#### `sortAnggotaByDate()`

**Location:** `js/koperasi.js`

**Changes:**
- Start with active anggota only before sorting

**Before:**
```javascript
let anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
```

**After:**
```javascript
const allAnggota = JSON.parse(localStorage.getItem('anggota') || '[]');
let anggota = filterActiveAnggota(allAnggota);
```

---

### 3. Dropdown Filtering

#### Simpanan Pokok Dropdown

**Location:** `js/simpanan.js` - `renderSimpananPokok()`

**Changes:**
```javascript
// Before
${anggota.filter(a => a.statusKeanggotaan !== 'Keluar').map(...)}

// After (consistent with new function)
${filterActiveAnggota(anggota).map(...)}
```

#### Simpanan Wajib Dropdown

**Location:** `js/simpanan.js` - `renderSimpananWajib()`

**Changes:**
```javascript
// Before
${anggota.filter(a => a.statusKeanggotaan !== 'Keluar').map(...)}

// After
${filterActiveAnggota(anggota).map(...)}
```

#### Simpanan Sukarela Dropdown

**Location:** `js/simpanan.js` - `renderSimpananSukarela()`

**Changes:**
```javascript
// Before
${anggota.filter(a => a.statusKeanggotaan !== 'Keluar').map(...)}

// After
${filterActiveAnggota(anggota).map(...)}
```

---

### 4. Export Function

#### `exportAnggota()`

**Location:** `js/koperasi.js`

**Changes:**
- Export only active anggota by default
- Add comment explaining exclusion

**Before:**
```javascript
const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
```

**After:**
```javascript
const allAnggota = JSON.parse(localStorage.getItem('anggota') || '[]');
const anggota = filterActiveAnggota(allAnggota);
// Export only active anggota (excluding keluar)
```

---

## Data Models

### Anggota Object

```javascript
{
    id: string,
    nik: string,
    nama: string,
    noKartu: string,
    departemen: string,
    tipeAnggota: 'Anggota' | 'Non-Anggota' | 'Umum',
    status: 'Aktif' | 'Nonaktif' | 'Cuti',
    statusKeanggotaan: 'Aktif' | 'Keluar',  // Key field for filtering
    tanggalDaftar: string (ISO),
    tanggalKeluar: string (ISO) | null,
    pengembalianStatus: 'Pending' | 'Selesai' | null,
    // ... other fields
}
```

**Key Field:**
- `statusKeanggotaan`: Used as primary filter criterion
  - `'Aktif'`: Normal active member (shown in Master Anggota)
  - `'Keluar'`: Exited member (hidden from Master Anggota, shown in Anggota Keluar)

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Master Anggota Exclusion

*For any* anggota list retrieved from localStorage, when rendered in Master Anggota table, all anggota with statusKeanggotaan equal to 'Keluar' should be excluded from the display.

**Validates: Requirements 1.1**

---

### Property 2: Count Consistency

*For any* anggota list, the displayed count in Master Anggota should equal the number of anggota with statusKeanggotaan not equal to 'Keluar'.

**Validates: Requirements 1.2, 1.3**

---

### Property 3: Dropdown Exclusion

*For any* dropdown selection component (simpanan, pinjaman, POS), all options should exclude anggota with statusKeanggotaan equal to 'Keluar'.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

---

### Property 4: Filter Preservation

*For any* filter operation (search, departemen, tipe, status, date range), the result should exclude anggota with statusKeanggotaan equal to 'Keluar'.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

---

### Property 5: Data Preservation

*For any* anggota with statusKeanggotaan equal to 'Keluar', the data should remain in localStorage after filtering operations.

**Validates: Requirements 1.4**

---

### Property 6: Anggota Keluar Visibility

*For any* anggota with statusKeanggotaan equal to 'Keluar', it should be visible only in the Anggota Keluar page and not in Master Anggota.

**Validates: Requirements 4.1, 4.2**

---

### Property 7: Sort Preservation

*For any* sort operation on anggota list, the sorted result should exclude anggota with statusKeanggotaan equal to 'Keluar'.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

---

## Error Handling

### Invalid Data Handling

1. **Missing statusKeanggotaan field:**
   - Default to 'Aktif' (show in Master Anggota)
   - Log warning for data migration

2. **Null or undefined anggota list:**
   - Return empty array from filter function
   - Display "Tidak ada data anggota" message

3. **Corrupted localStorage:**
   - Catch JSON parse errors
   - Show error message to user
   - Provide option to reset data

### Edge Cases

1. **All anggota are keluar:**
   - Display "Tidak ada data anggota" in Master Anggota
   - Show all in Anggota Keluar page

2. **Filter results in empty list:**
   - Display "Tidak ada anggota yang sesuai dengan filter"
   - Show reset filter button

3. **Search with no results:**
   - Display "Tidak ada hasil pencarian"
   - Suggest checking spelling or trying different keywords

---

## Testing Strategy

### Unit Tests

1. **Test `filterActiveAnggota()` function:**
   - Input: Array with mixed statusKeanggotaan
   - Expected: Only anggota with statusKeanggotaan !== 'Keluar'

2. **Test `getActiveAnggotaCount()` function:**
   - Input: localStorage with mixed anggota
   - Expected: Count excluding keluar

3. **Test dropdown rendering:**
   - Input: Anggota list with keluar members
   - Expected: Dropdown options exclude keluar

### Property-Based Tests

Property-based tests will use `fast-check` library to generate random test data and verify universal properties hold across all inputs.

#### Test 1: Master Anggota Exclusion Property

**Property 1: Master Anggota Exclusion**

```javascript
// For any anggota list, filtered result should exclude all keluar
fc.assert(
    fc.property(
        fc.array(anggotaArbitrary),
        (anggotaList) => {
            const filtered = filterActiveAnggota(anggotaList);
            return filtered.every(a => a.statusKeanggotaan !== 'Keluar');
        }
    )
);
```

**Validates: Requirements 1.1**

---

#### Test 2: Count Consistency Property

**Property 2: Count Consistency**

```javascript
// For any anggota list, count should match filtered length
fc.assert(
    fc.property(
        fc.array(anggotaArbitrary),
        (anggotaList) => {
            localStorage.setItem('anggota', JSON.stringify(anggotaList));
            const count = getActiveAnggotaCount();
            const expected = anggotaList.filter(a => a.statusKeanggotaan !== 'Keluar').length;
            return count === expected;
        }
    )
);
```

**Validates: Requirements 1.2, 1.3**

---

#### Test 3: Data Preservation Property

**Property 5: Data Preservation**

```javascript
// For any anggota list, localStorage should preserve all data after filtering
fc.assert(
    fc.property(
        fc.array(anggotaArbitrary),
        (anggotaList) => {
            localStorage.setItem('anggota', JSON.stringify(anggotaList));
            filterActiveAnggota(JSON.parse(localStorage.getItem('anggota')));
            const stored = JSON.parse(localStorage.getItem('anggota'));
            return stored.length === anggotaList.length;
        }
    )
);
```

**Validates: Requirements 1.4**

---

#### Test 4: Filter Preservation Property

**Property 4: Filter Preservation**

```javascript
// For any filter operation, result should exclude keluar
fc.assert(
    fc.property(
        fc.array(anggotaArbitrary),
        fc.string(),
        (anggotaList, searchTerm) => {
            const filtered = filterActiveAnggota(anggotaList)
                .filter(a => a.nama.includes(searchTerm));
            return filtered.every(a => a.statusKeanggotaan !== 'Keluar');
        }
    )
);
```

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

---

### Integration Tests

1. **Test Master Anggota rendering:**
   - Setup: Create anggota with mixed statusKeanggotaan
   - Action: Call renderAnggota()
   - Verify: Table shows only active anggota

2. **Test dropdown population:**
   - Setup: Create anggota with mixed statusKeanggotaan
   - Action: Render simpanan modal
   - Verify: Dropdown excludes keluar

3. **Test filter interaction:**
   - Setup: Create anggota with mixed statusKeanggotaan
   - Action: Apply departemen filter
   - Verify: Results exclude keluar

4. **Test sort interaction:**
   - Setup: Create anggota with mixed statusKeanggotaan
   - Action: Sort by tanggal pendaftaran
   - Verify: Sorted results exclude keluar

5. **Test export function:**
   - Setup: Create anggota with mixed statusKeanggotaan
   - Action: Call exportAnggota()
   - Verify: Export excludes keluar

---

## Performance Considerations

### Optimization Strategies

1. **Caching:**
   - Cache filtered anggota list to avoid repeated filtering
   - Invalidate cache when anggota data changes

2. **Lazy Loading:**
   - For large anggota lists, implement pagination
   - Filter on server-side if backend is added

3. **Memoization:**
   - Memoize `filterActiveAnggota()` result
   - Clear memo on localStorage change

### Performance Metrics

- Filter operation should complete in < 10ms for 1000 anggota
- Rendering should complete in < 100ms for 100 visible anggota
- Dropdown population should complete in < 50ms

---

## Migration Strategy

### Backward Compatibility

1. **Existing Data:**
   - No migration needed (statusKeanggotaan field already exists)
   - Filter function handles missing field gracefully

2. **Existing Code:**
   - Replace inline filters with `filterActiveAnggota()` function
   - Update all dropdown renders to use new function

### Rollback Plan

If issues arise:
1. Remove `filterActiveAnggota()` calls
2. Revert to previous inline filtering
3. Keep data intact (no data changes made)

---

## Security Considerations

1. **Data Access:**
   - Filtering is client-side only
   - No sensitive data exposed in filter logic

2. **Data Integrity:**
   - Filter does not modify localStorage
   - Original data preserved for audit

3. **Authorization:**
   - No authorization changes needed
   - Existing role-based access remains

---

## Documentation

### User Documentation

1. **Admin Guide:**
   - Explain anggota keluar are hidden from Master Anggota
   - Show how to access Anggota Keluar menu
   - Explain data is preserved for audit

2. **Developer Guide:**
   - Document `filterActiveAnggota()` function
   - Explain when to use filtering
   - Provide examples of correct usage

### Code Comments

Add comments to clarify filtering logic:
```javascript
// Filter out anggota keluar from Master Anggota display
// Data is preserved in localStorage for audit purposes
const activeAnggota = filterActiveAnggota(allAnggota);
```
