# Design Document

## Overview

Fitur barcode scanner untuk input pembelian akan menambahkan kemampuan untuk memilih barang menggunakan barcode scanner pada form pembelian yang sudah ada. Implementasi ini akan menambahkan input field khusus untuk barcode yang dapat menerima input dari barcode scanner (yang bekerja seperti keyboard input) dan secara otomatis mencari barang, mengisi data, dan menambahkan item ke daftar pembelian.

Fitur ini dirancang untuk:
- Mempercepat proses input pembelian dengan mengurangi waktu pencarian manual
- Mengurangi kesalahan input dengan auto-fill data barang
- Mendukung workflow yang lebih efisien untuk kasir/admin
- Tetap kompatibel dengan metode input manual yang sudah ada (dropdown)

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│           Form Input Pembelian (Modal)                  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │  Barcode Input   │      │  Dropdown Manual │        │
│  │  (New Feature)   │      │  (Existing)      │        │
│  └────────┬─────────┘      └────────┬─────────┘        │
│           │                         │                    │
│           └──────────┬──────────────┘                    │
│                      │                                    │
│           ┌──────────▼──────────┐                       │
│           │  Barcode Lookup     │                       │
│           │  Service            │                       │
│           └──────────┬──────────┘                       │
│                      │                                    │
│           ┌──────────▼──────────┐                       │
│           │  LocalStorage       │                       │
│           │  (barang data)      │                       │
│           └──────────┬──────────┘                       │
│                      │                                    │
│           ┌──────────▼──────────┐                       │
│           │  Auto-fill Fields   │                       │
│           │  & Add to List      │                       │
│           └─────────────────────┘                       │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
User Scans Barcode
       │
       ▼
Barcode Input Field (onkeypress/onchange)
       │
       ▼
Detect Enter Key
       │
       ▼
Extract & Clean Barcode Value
       │
       ▼
Search Barang by Barcode (findBarangByBarcode)
       │
       ├─── Found ──────────┐
       │                     ▼
       │            Auto-fill: selectBarang, hargaBeli
       │                     │
       │                     ▼
       │            Focus to qtyBarang field
       │                     │
       │                     ▼
       │            User enters qty & presses Enter
       │                     │
       │                     ▼
       │            addItemPembelian()
       │                     │
       │                     ▼
       │            Clear barcode & qty fields
       │                     │
       │                     ▼
       │            Focus back to barcode input
       │
       └─── Not Found ──────┐
                            ▼
                   Show error notification
                            │
                            ▼
                   Clear barcode input
                            │
                            ▼
                   Keep focus on barcode input
```

## Components and Interfaces

### 1. UI Components

#### Barcode Input Field
```html
<div class="col-md-6">
    <label class="form-label">
        Scan Barcode
        <span class="badge bg-success ms-2">
            <i class="bi bi-upc-scan"></i> Scanner Ready
        </span>
    </label>
    <input type="text" 
           class="form-control" 
           id="barcodeInput" 
           placeholder="Scan barcode atau ketik manual..."
           autocomplete="off">
    <small class="text-muted">Scan barcode atau tekan Enter untuk mencari</small>
</div>
```

**Properties:**
- `id`: "barcodeInput"
- `type`: "text"
- `autocomplete`: "off" (mencegah browser autocomplete)
- `placeholder`: Instruksi untuk user
- Visual indicator: Badge "Scanner Ready" untuk menunjukkan field aktif

#### Modified Layout Structure
Form pembelian akan dimodifikasi untuk menambahkan barcode input di bagian atas item selection:

```
┌─────────────────────────────────────────────────────┐
│  Item Pembelian Section                             │
├─────────────────────────────────────────────────────┤
│                                                       │
│  [Scan Barcode Input] 🟢 Scanner Ready              │
│                                                       │
│  ─────────── ATAU ───────────                       │
│                                                       │
│  [Pilih Barang Dropdown ▼] [Qty] [Harga] [Tambah]  │
│                                                       │
└─────────────────────────────────────────────────────┘
```

### 2. JavaScript Functions

#### Core Functions

**`findBarangByBarcode(barcode)`**
```javascript
/**
 * Mencari barang berdasarkan barcode
 * @param {string} barcode - Barcode yang akan dicari
 * @returns {Object|null} - Objek barang jika ditemukan, null jika tidak
 */
function findBarangByBarcode(barcode) {
    const barang = JSON.parse(localStorage.getItem('barang') || '[]');
    const cleanBarcode = barcode.trim();
    
    if (!cleanBarcode) return null;
    
    return barang.find(b => b.barcode === cleanBarcode) || null;
}
```

**`handleBarcodeInput(event)`**
```javascript
/**
 * Handler untuk input barcode
 * Mendeteksi Enter key dan memproses barcode
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleBarcodeInput(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const barcode = event.target.value.trim();
        
        if (!barcode) {
            return; // Tidak melakukan apa-apa jika kosong
        }
        
        processBarcodeInput(barcode);
    }
}
```

**`processBarcodeInput(barcode)`**
```javascript
/**
 * Memproses input barcode dan auto-fill form
 * @param {string} barcode - Barcode yang akan diproses
 */
function processBarcodeInput(barcode) {
    const item = findBarangByBarcode(barcode);
    
    if (item) {
        // Auto-fill dropdown
        document.getElementById('selectBarang').value = item.id;
        
        // Auto-fill harga beli dengan HPP
        document.getElementById('hargaBeli').value = item.hpp || 0;
        
        // Clear barcode input
        document.getElementById('barcodeInput').value = '';
        
        // Focus ke qty field
        document.getElementById('qtyBarang').focus();
        document.getElementById('qtyBarang').select();
        
        // Show success feedback
        showBarcodeSuccess(item.nama);
    } else {
        // Show error
        showAlert(`Barang dengan barcode "${barcode}" tidak ditemukan`, 'warning');
        
        // Clear barcode input
        document.getElementById('barcodeInput').value = '';
        
        // Keep focus on barcode input
        document.getElementById('barcodeInput').focus();
    }
}
```

**`showBarcodeSuccess(namaBarang)`**
```javascript
/**
 * Menampilkan feedback visual ketika barcode berhasil di-scan
 * @param {string} namaBarang - Nama barang yang ditemukan
 */
function showBarcodeSuccess(namaBarang) {
    // Optional: Tampilkan toast notification atau visual feedback
    const badge = document.querySelector('#barcodeInput').previousElementSibling.querySelector('.badge');
    if (badge) {
        badge.classList.remove('bg-success');
        badge.classList.add('bg-primary');
        badge.innerHTML = `<i class="bi bi-check-circle"></i> ${namaBarang}`;
        
        setTimeout(() => {
            badge.classList.remove('bg-primary');
            badge.classList.add('bg-success');
            badge.innerHTML = '<i class="bi bi-upc-scan"></i> Scanner Ready';
        }, 2000);
    }
}
```

**`enhanceQtyFieldForBarcode()`**
```javascript
/**
 * Menambahkan event listener pada qty field untuk auto-add item
 * ketika Enter ditekan setelah barcode scan
 */
function enhanceQtyFieldForBarcode() {
    const qtyField = document.getElementById('qtyBarang');
    
    qtyField.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            
            // Cek apakah ada barang yang dipilih
            const selectBarang = document.getElementById('selectBarang');
            if (selectBarang.value) {
                // Tambahkan item
                addItemPembelian();
                
                // Focus kembali ke barcode input
                document.getElementById('barcodeInput').focus();
            }
        }
    });
}
```

#### Modified Existing Functions

**`showPembelianModal()` - Enhancement**
```javascript
// Tambahkan di akhir fungsi showPembelianModal() yang sudah ada:

// Setup barcode input
const barcodeInput = document.getElementById('barcodeInput');
if (barcodeInput) {
    barcodeInput.addEventListener('keypress', handleBarcodeInput);
    
    // Auto-focus ke barcode input saat modal dibuka
    setTimeout(() => {
        barcodeInput.focus();
    }, 500);
}

// Enhance qty field untuk barcode workflow
enhanceQtyFieldForBarcode();
```

**`addItemPembelian()` - Enhancement**
```javascript
// Di akhir fungsi addItemPembelian() yang sudah ada, tambahkan:

// Jika dipanggil dari barcode workflow, focus kembali ke barcode input
const barcodeInput = document.getElementById('barcodeInput');
if (barcodeInput && document.activeElement !== barcodeInput) {
    // Cek apakah qty field yang aktif (indikasi dari barcode workflow)
    if (document.activeElement === document.getElementById('qtyBarang')) {
        setTimeout(() => {
            barcodeInput.focus();
        }, 100);
    }
}
```

### 3. Event Handlers

| Event | Element | Handler | Purpose |
|-------|---------|---------|---------|
| `keypress` | `#barcodeInput` | `handleBarcodeInput()` | Detect Enter key untuk memproses barcode |
| `keypress` | `#qtyBarang` | Enhanced handler | Detect Enter key untuk auto-add item |
| `focus` | `#barcodeInput` | Visual feedback | Update badge indicator |
| `blur` | `#barcodeInput` | Visual feedback | Reset badge indicator |

## Data Models

### Barang Object (Existing)
```javascript
{
    id: string,           // Unique identifier
    barcode: string,      // Barcode barang (USED FOR LOOKUP)
    nama: string,         // Nama barang
    kategoriId: string,   // ID kategori
    satuanId: string,     // ID satuan
    stok: number,         // Stok saat ini
    hpp: number,          // Harga Pokok Pembelian
    hargaJual: number     // Harga jual
}
```

### Item Pembelian Object (Existing)
```javascript
{
    barangId: string,     // ID barang
    nama: string,         // Nama barang
    qty: number,          // Quantity
    harga: number,        // Harga beli
    subtotal: number      // qty * harga
}
```

### Barcode Input State (New)
```javascript
{
    isScanning: boolean,      // Apakah sedang dalam mode scanning
    lastScannedBarcode: string, // Barcode terakhir yang di-scan
    lastScannedTime: timestamp  // Waktu scan terakhir
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Barcode Search Invocation
*For any* barcode string input followed by Enter key, the system should invoke the search function with that barcode value.
**Validates: Requirements 1.2, 2.2**

### Property 2: Auto-fill on Valid Barcode
*For any* barcode that matches a barang in localStorage, entering that barcode should auto-fill the selectBarang dropdown with the matching item's ID and hargaBeli field with the item's HPP value, and focus should move to qtyBarang field.
**Validates: Requirements 1.3**

### Property 3: Error Handling for Invalid Barcode
*For any* barcode that does not match any barang in localStorage, the system should display an error notification, clear the barcode input field, and maintain focus on the barcode input.
**Validates: Requirements 1.4**

### Property 4: Complete Workflow After Barcode Scan
*For any* valid barcode followed by a valid qty value and Enter key on qty field, the system should add the item to itemsPembelian array, clear both barcode and qty inputs, and return focus to the barcode input field.
**Validates: Requirements 1.5**

### Property 5: Dropdown Independence
*For any* state of the barcode input (empty, filled, or previously used), selecting a barang from the dropdown should function correctly and independently without interference from barcode input state.
**Validates: Requirements 2.1**

### Property 6: Input Method Consistency
*For any* sequence of alternating barcode inputs and dropdown selections, the final itemsPembelian list should contain all selected items without duplicates (unless intentionally added) and with correct data.
**Validates: Requirements 2.4**

### Property 7: Duplicate Barcode Handling
*For any* barcode that corresponds to an item already in itemsPembelian, scanning that barcode again should increment the qty of the existing item rather than creating a new item entry.
**Validates: Requirements 3.1, 3.2**

### Property 8: Subtotal Invariant
*For any* item in itemsPembelian, the subtotal should always equal qty multiplied by harga, including after qty updates from duplicate barcode scans.
**Validates: Requirements 3.3**

### Property 9: Duplicate Scan Notification
*For any* barcode scan that results in a qty update (duplicate item), the system should display a notification indicating the qty has been incremented.
**Validates: Requirements 3.4**

### Property 10: Form Reset After Item Addition
*For any* successful item addition via barcode workflow, the barcode input and qty input should be cleared and focus should return to barcode input.
**Validates: Requirements 4.2**

### Property 11: Keyboard Navigation Support
*For any* sequence of Tab and Enter key presses, the focus should move correctly between barcode input, qty input, and the add button, allowing complete keyboard-only operation.
**Validates: Requirements 4.4**

### Property 12: Input Sanitization
*For any* barcode string containing leading/trailing whitespace or special characters, the system should trim whitespace before performing the search while preserving the core barcode value including leading zeros.
**Validates: Requirements 5.1, 5.2**



## Error Handling

### 1. Barcode Not Found
**Scenario:** User scans/enters a barcode that doesn't exist in the system

**Handling:**
- Display user-friendly error message: "Barang dengan barcode '{barcode}' tidak ditemukan"
- Clear the barcode input field
- Keep focus on barcode input for immediate retry
- Do not modify any other form fields
- Log the failed lookup for debugging (console.warn)

**User Recovery:** User can immediately scan/enter another barcode

### 2. Empty Barcode Input
**Scenario:** User presses Enter on empty barcode field

**Handling:**
- No action taken (silent ignore)
- No error message displayed
- Focus remains on barcode input
- Prevents unnecessary error notifications

**User Recovery:** User can scan/enter a barcode

### 3. Duplicate Item Handling
**Scenario:** User scans a barcode for an item already in the list

**Handling:**
- Find existing item in itemsPembelian array
- Increment qty by the current qtyBarang value (default 1)
- Recalculate subtotal
- Display success notification: "Qty untuk '{nama}' ditambahkan"
- Clear inputs and refocus to barcode

**User Recovery:** User can continue scanning other items

### 4. Invalid Qty Value
**Scenario:** User enters invalid qty (0, negative, or non-numeric)

**Handling:**
- Validation occurs in addItemPembelian() function (existing)
- Display error: "Qty harus lebih dari 0!"
- Focus moves to qty field for correction
- Barcode selection is preserved

**User Recovery:** User corrects qty value and presses Enter

### 5. Scanner Hardware Issues
**Scenario:** Barcode scanner sends malformed data or partial scans

**Handling:**
- Input sanitization removes invalid characters
- If resulting barcode is empty after sanitization, treat as empty input (case #2)
- If barcode is malformed but not empty, treat as not found (case #1)
- System remains stable and responsive

**User Recovery:** User can rescan the barcode

### 6. Concurrent Input Methods
**Scenario:** User switches between barcode and dropdown while fields are partially filled

**Handling:**
- Both methods update the same form fields (selectBarang, hargaBeli)
- Last input method wins (overwrites previous selection)
- No data corruption or state conflicts
- Clear visual feedback shows which item is currently selected

**User Recovery:** User can use either method at any time

## Testing Strategy

### Unit Testing

Unit tests will verify individual functions and components work correctly in isolation:

**Test Cases:**

1. **findBarangByBarcode() function**
   - Test with valid barcode returns correct barang object
   - Test with invalid barcode returns null
   - Test with empty string returns null
   - Test with whitespace-padded barcode (should trim and find)
   - Test with barcode containing leading zeros

2. **processBarcodeInput() function**
   - Test auto-fill behavior with valid barcode
   - Test error notification with invalid barcode
   - Test input clearing after processing
   - Test focus management

3. **handleBarcodeInput() event handler**
   - Test Enter key triggers processing
   - Test other keys do not trigger processing
   - Test empty input on Enter does nothing

4. **enhanceQtyFieldForBarcode() function**
   - Test Enter key on qty field calls addItemPembelian
   - Test focus returns to barcode input after add
   - Test behavior when no item is selected

5. **Duplicate item handling in addItemPembelian()**
   - Test qty increment for existing item
   - Test subtotal recalculation
   - Test notification display

### Property-Based Testing

Property-based tests will verify universal properties hold across many randomly generated inputs using a JavaScript PBT library (fast-check).

**Configuration:**
- Library: fast-check (npm package)
- Minimum iterations per property: 100
- Test file location: `__tests__/barcode-pembelian.property.test.js`

**Property Tests:**

Each property test will be tagged with a comment referencing the design document property:

```javascript
// Feature: barcode-pembelian, Property 1: Barcode Search Invocation
```

**Generators Needed:**

1. **Arbitrary Barcode Strings**
   ```javascript
   // Generate valid barcode formats (numeric, alphanumeric)
   fc.string({ minLength: 1, maxLength: 20 })
   ```

2. **Arbitrary Barang Objects**
   ```javascript
   // Generate barang with all required fields including barcode
   fc.record({
       id: fc.uuid(),
       barcode: fc.string({ minLength: 1, maxLength: 20 }),
       nama: fc.string({ minLength: 1, maxLength: 50 }),
       hpp: fc.nat(),
       stok: fc.nat()
   })
   ```

3. **Arbitrary Item Lists**
   ```javascript
   // Generate arrays of items for testing duplicate handling
   fc.array(itemGenerator, { minLength: 0, maxLength: 10 })
   ```

4. **Arbitrary Keyboard Events**
   ```javascript
   // Generate keyboard events with various keys
   fc.record({
       key: fc.constantFrom('Enter', 'Tab', 'a', '1'),
       preventDefault: fc.func(fc.constant(undefined))
   })
   ```

### Integration Testing

Integration tests will verify the complete workflow from user input to UI update:

**Test Scenarios:**

1. **Complete Barcode Scan Workflow**
   - Setup: Modal open with empty form
   - Action: Simulate barcode scan (input value + Enter)
   - Verify: Item added to list, form cleared, focus on barcode input

2. **Mixed Input Methods**
   - Setup: Modal open
   - Action: Add item via barcode, then add item via dropdown
   - Verify: Both items in list, no conflicts

3. **Duplicate Barcode Workflow**
   - Setup: Modal with one item already added
   - Action: Scan same barcode again
   - Verify: Qty incremented, no duplicate item, notification shown

4. **Error Recovery Workflow**
   - Setup: Modal open
   - Action: Scan invalid barcode, then scan valid barcode
   - Verify: Error shown for first, success for second, correct item added

5. **Keyboard Navigation**
   - Setup: Modal open
   - Action: Tab through fields, use Enter to add items
   - Verify: Focus moves correctly, items added successfully

### Manual Testing Checklist

Manual tests for hardware-dependent features and UX validation:

- [ ] Test with actual barcode scanner hardware
- [ ] Verify scanner auto-Enter is detected correctly
- [ ] Test with different barcode formats (EAN-13, Code 128, etc.)
- [ ] Verify visual feedback (badge color changes)
- [ ] Test rapid scanning (multiple items quickly)
- [ ] Verify focus management feels natural
- [ ] Test on different browsers (Chrome, Firefox, Edge)
- [ ] Verify mobile/tablet compatibility (if applicable)
- [ ] Test with keyboard-only navigation (accessibility)
- [ ] Verify error messages are clear and helpful

### Test Data Setup

For testing, we need sample barang data with various barcode formats:

```javascript
const testBarang = [
    { id: '1', barcode: '1234567890123', nama: 'Test Item 1', hpp: 10000, stok: 100 },
    { id: '2', barcode: '0001234567890', nama: 'Test Item 2', hpp: 20000, stok: 50 },
    { id: '3', barcode: 'ABC123', nama: 'Test Item 3', hpp: 15000, stok: 75 },
    { id: '4', barcode: '00000001', nama: 'Test Item 4', hpp: 5000, stok: 200 }
];
```

### Performance Considerations

- Barcode lookup should complete in < 50ms for up to 10,000 items
- UI should remain responsive during rapid scanning (< 100ms between scans)
- No memory leaks from event listeners (cleanup on modal close)
- Efficient array operations for duplicate detection

### Browser Compatibility

Target browsers:
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

All modern browsers support the required APIs (localStorage, keyboard events, DOM manipulation).

## Implementation Notes

### Initialization Sequence

1. Modal opens → `showPembelianModal()` called
2. Barcode input field is rendered in DOM
3. Event listener attached to barcode input
4. Event listener attached to qty field
5. Auto-focus to barcode input (500ms delay for modal animation)
6. System ready to receive barcode scans

### Focus Management Strategy

Focus flow for optimal UX:
```
Modal Open → Barcode Input (auto-focus)
     ↓
Barcode Scanned → Qty Field (auto-focus + select)
     ↓
Enter on Qty → Item Added → Barcode Input (auto-focus)
     ↓
Repeat...
```

### State Management

No additional global state needed. Existing state variables are sufficient:
- `itemsPembelian` array (existing)
- `isEditMode` flag (existing)
- Form field values (DOM state)

### Backward Compatibility

This feature is purely additive:
- No changes to existing data structures
- No changes to existing function signatures
- Dropdown method continues to work unchanged
- No breaking changes to existing workflows

### Accessibility Considerations

- Barcode input has proper label
- Visual indicator (badge) has aria-label
- Keyboard navigation fully supported
- Error messages are announced (via showAlert)
- Focus management follows logical tab order

## Security Considerations

### Input Validation

- Barcode input is sanitized (trim whitespace)
- No SQL injection risk (using localStorage, not database)
- No XSS risk (barcode used for lookup only, not rendered as HTML)
- Qty and harga validation prevents negative values

### Data Integrity

- Duplicate prevention ensures data consistency
- Subtotal calculation is always correct (invariant)
- No race conditions (single-threaded JavaScript)
- LocalStorage operations are atomic

## Future Enhancements

Potential improvements for future iterations:

1. **Barcode Scanner Configuration**
   - Settings page to configure scanner behavior
   - Support for different scanner protocols

2. **Barcode History**
   - Track recently scanned barcodes
   - Quick re-scan from history

3. **Batch Scanning Mode**
   - Scan multiple items without entering qty
   - Bulk add with default qty=1

4. **Barcode Generation**
   - Generate barcodes for items without one
   - Print barcode labels

5. **Advanced Search**
   - Fuzzy matching for partial barcodes
   - Search by product name from barcode input

6. **Analytics**
   - Track scanning speed and accuracy
   - Identify frequently scanned items

7. **Offline Support**
   - Service worker for offline barcode scanning
   - Sync when connection restored
