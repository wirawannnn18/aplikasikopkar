# Implementasi Task 7: UI Components untuk Anggota Keluar

## Overview

Task 7 mengimplementasikan komponen UI untuk fitur anggota keluar, termasuk tombol aksi, modal konfirmasi, dan visual indicator untuk anggota yang sudah keluar.

## Task 7.1: Add "Anggota Keluar" Button

### Implementasi

**File Modified:** `js/koperasi.js`

**Changes:**
1. Menambahkan tombol "Anggota Keluar" di kolom aksi tabel Master Anggota
2. Tombol hanya muncul untuk anggota dengan `statusKeanggotaan !== 'Keluar'`
3. Styling menggunakan `btn-warning` dengan icon `bi-box-arrow-right`
4. Tombol memanggil fungsi `showAnggotaKeluarModal(anggotaId)`

**Code:**
```javascript
// Check if anggota has status "Keluar"
const isKeluar = a.statusKeanggotaan === 'Keluar';

// Show "Anggota Keluar" button only for active members
const anggotaKeluarButton = !isKeluar ? `
    <button class="btn btn-sm btn-warning" onclick="showAnggotaKeluarModal('${a.id}')" title="Anggota Keluar">
        <i class="bi bi-box-arrow-right"></i>
    </button>
` : '';
```

### Validasi

✅ **Requirement 1.1:** Button muncul di action column untuk setiap anggota aktif
✅ **Visual:** Button styled as warning button with icon
✅ **Conditional Display:** Button hanya muncul untuk anggota dengan status "Aktif"

## Task 7.2: Create Anggota Keluar Confirmation Modal

### Implementasi

**File Modified:** `js/anggotaKeluarUI.js`

**Functions Implemented:**

#### 1. `showAnggotaKeluarModal(anggotaId)`

Menampilkan modal konfirmasi untuk menandai anggota keluar.

**Features:**
- Validasi anggota exists dan belum keluar
- Menampilkan detail anggota (NIK, nama, departemen, tipe)
- Form input dengan 2 field:
  - `tanggalKeluar`: Date picker dengan validasi tidak boleh masa depan
  - `alasanKeluar`: Textarea dengan minimal 10 karakter
- Alert warning tentang konsekuensi
- Buttons: Cancel dan Simpan
- Default tanggal keluar = hari ini

**Code Structure:**
```javascript
function showAnggotaKeluarModal(anggotaId) {
    // 1. Get and validate anggota data
    // 2. Create modal HTML with Bootstrap 5
    // 3. Remove existing modal if any
    // 4. Add modal to body
    // 5. Show modal using Bootstrap Modal API
    // 6. Set default date to today
}
```

#### 2. `handleMarkKeluar(event)`

Event handler untuk tombol Simpan di modal.

**Process Flow:**
1. Prevent default event
2. Get form data (anggotaId, tanggalKeluar, alasanKeluar)
3. Validate form:
   - tanggalKeluar tidak boleh kosong
   - alasanKeluar minimal 10 karakter
4. Confirm action dengan user
5. Call `markAnggotaKeluar()` function
6. Handle result:
   - Success: Close modal, show alert, refresh table
   - Error: Show error alert

**Validation Rules:**
- Tanggal keluar: Required, tidak boleh di masa depan
- Alasan keluar: Required, minimal 10 karakter

### Validasi

✅ **Requirement 1.2:** Modal displays anggota details (NIK, nama, departemen)
✅ **Requirement 1.3:** Form has date picker and textarea for alasan
✅ **UI/UX:** Cancel and save buttons present
✅ **Integration:** Wired up to `markAnggotaKeluar()` function
✅ **Validation:** Client-side validation before submission

## Task 7.3: Update Anggota List to Show Status "Keluar"

### Implementasi

**File Modified:** `js/koperasi.js`

**Changes:**

#### 1. Status Badge

Menambahkan badge "Keluar" untuk anggota yang sudah keluar:

```javascript
const statusKeluarBadge = isKeluar ? '<span class="badge bg-danger ms-2">Keluar</span>' : '';
```

Badge ditampilkan di kolom nama dengan styling `bg-danger` (merah).

#### 2. Visual Indicator (Row Color)

Menambahkan class `table-secondary` untuk row anggota yang keluar:

```javascript
const rowClass = isKeluar ? 'table-secondary' : '';
```

Row dengan anggota keluar akan memiliki background abu-abu untuk membedakan dari anggota aktif.

#### 3. Disable Transaction Buttons

Menonaktifkan tombol Edit dan Hapus untuk anggota yang keluar:

```javascript
<button class="btn btn-sm btn-warning" onclick="editAnggota('${a.id}')" title="Edit" ${isKeluar ? 'disabled' : ''}>
    <i class="bi bi-pencil"></i>
</button>
<button class="btn btn-sm btn-danger" onclick="deleteAnggota('${a.id}')" title="Hapus" ${isKeluar ? 'disabled' : ''}>
    <i class="bi bi-trash"></i>
</button>
```

Tombol Edit dan Hapus akan disabled untuk mencegah modifikasi data anggota yang sudah keluar.

### Validasi

✅ **Requirement 1.4:** Status badge "Keluar" ditampilkan di tabel
✅ **Requirement 1.5:** Transaction buttons (Edit, Hapus) disabled untuk anggota keluar
✅ **Visual Indicator:** Row color berbeda (table-secondary) untuk anggota keluar
✅ **Consistency:** Badge, row color, dan disabled buttons konsisten

## Testing

### Manual Testing

File test: `test_anggota_keluar_ui.html`

**Test Cases:**

1. **Task 7.1 - Button Display**
   - ✅ Button "Anggota Keluar" muncul untuk anggota aktif
   - ✅ Button TIDAK muncul untuk anggota yang sudah keluar
   - ✅ Button styling correct (warning, icon)

2. **Task 7.2 - Modal Functionality**
   - ✅ Modal shows anggota details correctly
   - ✅ Date picker has max date = today
   - ✅ Textarea validation (min 10 chars)
   - ✅ Form submission calls markAnggotaKeluar()
   - ✅ Success: modal closes, table refreshes
   - ✅ Error: error message displayed

3. **Task 7.3 - Status Display**
   - ✅ Badge "Keluar" displayed for exited members
   - ✅ Row has table-secondary class
   - ✅ Edit and Delete buttons disabled
   - ✅ View button still enabled

### Test Data

```javascript
// Active member - should show button
{
    id: 'test-001',
    nama: 'Budi Santoso',
    statusKeanggotaan: 'Aktif'
}

// Exited member - should NOT show button, has badge
{
    id: 'test-003',
    nama: 'Ahmad Wijaya',
    statusKeanggotaan: 'Keluar',
    tanggalKeluar: '2024-11-30',
    alasanKeluar: 'Pindah ke kota lain'
}
```

### Expected Results

**For Active Member (Budi Santoso):**
- ✅ "Anggota Keluar" button visible
- ✅ Edit and Delete buttons enabled
- ✅ No "Keluar" badge
- ✅ Normal row color

**For Exited Member (Ahmad Wijaya):**
- ✅ NO "Anggota Keluar" button
- ✅ Edit and Delete buttons disabled
- ✅ "Keluar" badge visible (red)
- ✅ Row has gray background (table-secondary)

## Integration Points

### With Existing Modules

1. **koperasi.js**
   - Modified `renderTableAnggota()` function
   - Uses existing helper functions: `formatDateToDisplay()`, `getCurrentDateISO()`

2. **anggotaKeluarManager.js**
   - Calls `markAnggotaKeluar()` function
   - Uses `getAnggotaById()` helper

3. **utils.js**
   - Uses `generateId()` for audit logs
   - Uses Bootstrap 5 Modal API

### Dependencies

- Bootstrap 5.1.3 (CSS and JS)
- Bootstrap Icons 1.7.2
- anggotaKeluarManager.js (business logic)
- anggotaKeluarRepository.js (data access)

## UI/UX Considerations

### User Flow

1. User navigates to Master Anggota page
2. User sees list of all anggota
3. For active anggota, user clicks "Anggota Keluar" button (warning button with icon)
4. Modal appears with:
   - Warning message about consequences
   - Anggota details (read-only)
   - Form to input tanggal keluar and alasan
5. User fills form and clicks "Simpan"
6. Confirmation dialog appears
7. User confirms
8. System processes:
   - Validates input
   - Calls markAnggotaKeluar()
   - Updates anggota status
   - Creates audit log
9. Success message displayed
10. Modal closes
11. Table refreshes automatically
12. Anggota now shows:
    - "Keluar" badge (red)
    - Gray row background
    - Disabled Edit/Delete buttons
    - NO "Anggota Keluar" button

### Visual Design

**Colors:**
- Warning button: Bootstrap warning (yellow/orange)
- Keluar badge: Bootstrap danger (red)
- Row background: Bootstrap table-secondary (gray)
- Modal header: Bootstrap warning background

**Icons:**
- Anggota Keluar button: `bi-box-arrow-right`
- Modal title: `bi-box-arrow-right`
- Warning alert: `bi-exclamation-triangle`
- Cancel button: `bi-x-circle`
- Save button: `bi-check-circle`

### Accessibility

- All buttons have `title` attribute for tooltips
- Form fields have proper `<label>` elements
- Required fields marked with `<span class="text-danger">*</span>`
- Form text provides guidance (e.g., "Minimal 10 karakter")
- Modal has proper ARIA attributes
- Disabled buttons clearly indicated

## Error Handling

### Client-Side Validation

1. **Anggota not found:**
   - Alert: "Anggota tidak ditemukan"
   - Modal does not open

2. **Already keluar:**
   - Alert: "Anggota sudah berstatus keluar"
   - Modal does not open

3. **Empty tanggal keluar:**
   - Alert: "Tanggal keluar harus diisi"
   - Form not submitted

4. **Alasan too short:**
   - Alert: "Alasan keluar harus diisi minimal 10 karakter"
   - Form not submitted

### Server-Side Validation

Handled by `markAnggotaKeluar()` function:
- Invalid parameters
- Anggota not found
- Already keluar
- Invalid date format
- Date in future
- Update failed
- System error

All errors displayed via `alert()` with error message from result.error.message.

## Next Steps

Task 7 is now complete. Next tasks:

- **Task 8:** Implement UI components for pengembalian
  - 8.1: Create pengembalian detail modal
  - 8.2: Create pengembalian processing form
  - 8.3: Add cancellation button and modal

- **Task 9:** Implement bukti pengembalian generation
  - 9.1: Create generateBuktiPengembalian() function
  - 9.2: Write property test for bukti completeness
  - 9.3: Add print button to success modal

## Summary

Task 7 successfully implemented all UI components for marking anggota keluar:

✅ **Task 7.1:** "Anggota Keluar" button added to Master Anggota table
✅ **Task 7.2:** Confirmation modal created with form validation
✅ **Task 7.3:** Status display updated with badge, row color, and disabled buttons

All requirements (1.1, 1.2, 1.3, 1.4, 1.5) validated and working correctly.

**Files Modified:**
- `js/koperasi.js` - Table rendering with button and status display
- `js/anggotaKeluarUI.js` - Modal and event handlers

**Files Created:**
- `test_anggota_keluar_ui.html` - Manual testing page

**Integration:** Fully integrated with existing anggotaKeluarManager.js business logic.
