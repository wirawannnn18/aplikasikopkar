# Design Document

## Overview

Fitur hapus dan edit pembelian barang akan menambahkan kemampuan untuk mengelola transaksi pembelian yang sudah tersimpan dalam sistem. Fitur ini akan mengintegrasikan dengan sistem stok barang dan jurnal akuntansi yang ada, memastikan konsistensi data ketika transaksi diubah atau dihapus.

Implementasi akan menambahkan tombol edit dan hapus pada tabel daftar pembelian, dengan logika untuk:
- Memuat data transaksi existing ke form edit
- Menghitung ulang stok barang berdasarkan perubahan qty
- Menyesuaikan HPP barang dengan perhitungan rata-rata tertimbang
- Membuat jurnal koreksi atau pembalik untuk menjaga akurasi akuntansi

## Architecture

Fitur ini akan mengikuti arsitektur existing aplikasi yang berbasis:
- **Frontend**: Vanilla JavaScript dengan Bootstrap 5 untuk UI
- **Storage**: LocalStorage untuk persistensi data
- **Module Pattern**: Fungsi-fungsi global yang dapat dipanggil dari HTML

### Component Interaction Flow

```
User Action (Edit/Delete Button)
    ↓
Event Handler (editPembelian/deletePembelian)
    ↓
Data Retrieval (LocalStorage)
    ↓
Business Logic (Stock & HPP Calculation)
    ↓
Data Update (LocalStorage)
    ↓
Journal Entry (Accounting)
    ↓
UI Update (Re-render)
```

## Components and Interfaces

### 1. Edit Pembelian Component

**Function**: `editPembelian(id)`
- **Input**: ID transaksi pembelian
- **Process**:
  - Retrieve transaksi dari LocalStorage
  - Populate modal form dengan data existing
  - Load items ke array `itemsPembelian`
  - Show modal dengan mode edit
- **Output**: Modal form terisi dengan data transaksi

**Function**: `savePembelianEdit(id)`
- **Input**: ID transaksi yang diedit
- **Process**:
  - Validate minimal 1 item dalam daftar
  - Calculate selisih qty untuk setiap item (old vs new)
  - Update stok barang berdasarkan selisih
  - Recalculate HPP dengan weighted average
  - Update transaksi di LocalStorage
  - Create jurnal koreksi jika ada perubahan total
- **Output**: Transaksi terupdate, stok dan HPP adjusted

### 2. Delete Pembelian Component

**Function**: `deletePembelian(id)`
- **Input**: ID transaksi pembelian
- **Process**:
  - Show confirmation dialog
  - Jika confirmed:
    - Retrieve transaksi data
    - Reduce stok barang sesuai qty dalam transaksi
    - Recalculate HPP untuk setiap barang
    - Remove transaksi dari LocalStorage
    - Create jurnal pembalik
    - Show success notification
    - Re-render daftar pembelian
- **Output**: Transaksi terhapus, stok dikembalikan

### 3. Stock Adjustment Component

**Function**: `adjustStockForEdit(oldItems, newItems)`
- **Input**: Array item lama dan baru
- **Process**:
  - Compare items by barangId
  - Calculate qty difference untuk setiap item
  - Update stok: `newStok = currentStok - oldQty + newQty`
  - Handle item yang dihapus (reduce stock)
  - Handle item baru (increase stock)
- **Output**: Updated barang array

**Function**: `adjustStockForDelete(items)`
- **Input**: Array items dari transaksi yang dihapus
- **Process**:
  - For each item: `newStok = currentStok - item.qty`
  - Ensure stok tidak negatif (warning jika terjadi)
- **Output**: Updated barang array

### 4. HPP Calculation Component

**Function**: `recalculateHPP(barangId, oldQty, oldHarga, newQty, newHarga)`
- **Input**: ID barang, qty & harga lama dan baru
- **Process**:
  - Get current stok dan HPP
  - Remove old purchase impact: `totalValue = (currentStok * currentHPP) - (oldQty * oldHarga)`
  - Add new purchase impact: `totalValue += (newQty * newHarga)`
  - Calculate new average: `newHPP = totalValue / newStok`
- **Output**: Updated HPP value

### 5. Journal Entry Component

**Function**: `createJurnalKoreksi(oldTotal, newTotal, tanggal, description)`
- **Input**: Total lama, total baru, tanggal, deskripsi
- **Process**:
  - Calculate selisih = newTotal - oldTotal
  - If selisih > 0 (pembelian bertambah):
    - Debit: Persediaan Barang (1-1300) = selisih
    - Kredit: Kas (1-1000) = selisih
  - If selisih < 0 (pembelian berkurang):
    - Debit: Kas (1-1000) = abs(selisih)
    - Kredit: Persediaan Barang (1-1300) = abs(selisih)
- **Output**: Jurnal entry created

**Function**: `createJurnalPembalik(total, tanggal, description)`
- **Input**: Total transaksi, tanggal, deskripsi
- **Process**:
  - Debit: Kas (1-1000) = total
  - Kredit: Persediaan Barang (1-1300) = total
- **Output**: Jurnal pembalik created

## Data Models

### Pembelian Transaction (Existing)
```javascript
{
  id: string,
  noFaktur: string,
  tanggal: string (ISO date),
  supplierId: string | null,
  items: [
    {
      barangId: string,
      nama: string,
      qty: number,
      harga: number,
      subtotal: number
    }
  ],
  total: number,
  status: string ('selesai' | 'pending')
}
```

### Barang (Existing)
```javascript
{
  id: string,
  barcode: string,
  nama: string,
  kategoriId: string,
  satuanId: string,
  stok: number,
  hpp: number,
  hargaJual: number
}
```

### Journal Entry (New/Modified)
```javascript
{
  id: string,
  tanggal: string,
  deskripsi: string,
  entries: [
    {
      akun: string,  // kode akun
      debit: number,
      kredit: number
    }
  ]
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Edit form population completeness
*For any* transaksi pembelian, when loaded into edit mode, all form fields (noFaktur, tanggal, supplier, items) SHALL contain the transaction's data
**Validates: Requirements 1.2**

### Property 2: Empty items validation
*For any* save attempt on edit operation, if the items array is empty, the system SHALL reject the save and display a warning
**Validates: Requirements 1.3, 5.3**

### Property 3: Stock adjustment on edit
*For any* item in any edited transaction, the stock adjustment SHALL equal (newQty - oldQty), ensuring stock consistency
**Validates: Requirements 1.4, 4.5**

### Property 4: HPP weighted average calculation
*For any* barang affected by edit, the new HPP SHALL be calculated using weighted average formula: `newHPP = ((currentStok * currentHPP) - (oldQty * oldHarga) + (newQty * newHarga)) / newStok`
**Validates: Requirements 1.5**

### Property 5: Stock reduction on delete
*For any* transaction deleted, each item's stock SHALL be reduced by its qty value
**Validates: Requirements 2.2**

### Property 6: Transaction removal from storage
*For any* transaction, after successful deletion, it SHALL no longer exist in LocalStorage
**Validates: Requirements 2.3**

### Property 7: Cancel preserves state
*For any* transaction, if delete or edit is cancelled, the transaction and all related data (stock, HPP, journals) SHALL remain unchanged
**Validates: Requirements 2.5, 5.5**

### Property 8: Journal correction on edit
*For any* edit that changes the total value, a correction journal entry SHALL be created with amount equal to (newTotal - oldTotal)
**Validates: Requirements 3.1**

### Property 9: Reversing journal on delete
*For any* deletion, a reversing journal entry SHALL be created that reverses the original purchase journal
**Validates: Requirements 3.2**

### Property 10: Journal account consistency
*For any* journal entry created by edit or delete operations, it SHALL use Persediaan Barang (1-1300) and Kas (1-1000) accounts
**Validates: Requirements 3.3**

### Property 11: Journal balance
*For any* journal entry created, total debit SHALL equal total kredit
**Validates: Requirements 3.4**

### Property 12: Item removal updates total
*For any* item removed from the items array, the total pembelian SHALL be recalculated as the sum of remaining items' subtotals
**Validates: Requirements 4.2**

### Property 13: Item addition updates total
*For any* item added to the items array, the total pembelian SHALL increase by the item's subtotal
**Validates: Requirements 4.3**

### Property 14: Subtotal calculation
*For any* item with qty or harga modified, subtotal SHALL equal (qty * harga), and total SHALL equal sum of all subtotals
**Validates: Requirements 4.4**

### Property 15: Success notification on completion
*For any* successful edit or delete operation, a success notification SHALL be displayed
**Validates: Requirements 2.4, 5.1**

### Property 16: Error notification on failure
*For any* error during edit or delete operation, an error notification SHALL be displayed with descriptive information
**Validates: Requirements 5.2**

### Property 17: UI refresh on completion
*For any* completed operation, the modal SHALL close and the daftar pembelian SHALL be refreshed with current data
**Validates: Requirements 5.4**

## Error Handling

### Validation Errors
- **Empty Items List**: Prevent save and show warning "Tambahkan minimal 1 item pembelian"
- **Invalid Qty**: Reject negative or zero quantities
- **Invalid Harga**: Reject negative prices
- **Missing Required Fields**: Validate noFaktur and tanggal are filled

### Stock Errors
- **Insufficient Stock on Delete**: If deleting would make stock negative, show warning but allow (with confirmation)
- **Stock Calculation Error**: Log error and show notification to user

### Data Integrity Errors
- **Transaction Not Found**: Show error "Transaksi tidak ditemukan"
- **Barang Not Found**: Show error "Barang tidak ditemukan dalam sistem"
- **LocalStorage Error**: Handle quota exceeded or access denied

### Journal Errors
- **Journal Creation Failed**: Log error but don't block the operation (show warning)
- **Unbalanced Journal**: Prevent creation and log error

## Testing Strategy

### Unit Testing
We will use Jest as the testing framework for unit tests. Unit tests will cover:

1. **Stock Calculation Functions**
   - Test `adjustStockForEdit()` with various old/new item combinations
   - Test `adjustStockForDelete()` with multiple items
   - Test edge cases: item removed, item added, qty changed

2. **HPP Calculation Functions**
   - Test `recalculateHPP()` with different scenarios
   - Test weighted average formula accuracy
   - Test edge cases: zero stock, first purchase

3. **Validation Functions**
   - Test empty items validation
   - Test negative qty/harga validation
   - Test required fields validation

4. **Journal Entry Functions**
   - Test `createJurnalKoreksi()` with positive and negative differences
   - Test `createJurnalPembalik()` with various totals
   - Test journal balance validation

### Property-Based Testing
We will use fast-check library for property-based testing in JavaScript. Each property test will run a minimum of 100 iterations.

Property-based tests will verify the correctness properties defined above:

1. **Property 3: Stock adjustment on edit** - Generate random transactions with random edits, verify stock changes match qty differences
2. **Property 4: HPP weighted average** - Generate random purchase scenarios, verify HPP calculation is correct
3. **Property 11: Journal balance** - Generate random edit/delete operations, verify all journals balance
4. **Property 12-14: Total calculations** - Generate random item modifications, verify totals are always correct

Each property-based test MUST be tagged with a comment in this format:
`// Feature: hapus-edit-pembelian, Property X: [property description]`

### Integration Testing
- Test complete edit flow: load → modify → save → verify all side effects
- Test complete delete flow: select → confirm → verify all side effects
- Test cancel operations preserve state
- Test UI updates after operations

## Implementation Notes

### Edit Mode Detection
Add a hidden field or flag to distinguish between "new" and "edit" mode in the modal:
```javascript
let isEditMode = false;
let editingTransactionId = null;
```

### Stock Adjustment Strategy
Instead of directly modifying stock, create a diff-based approach:
1. Calculate old impact on stock
2. Calculate new impact on stock
3. Apply the difference

This prevents double-counting and makes the logic clearer.

### HPP Recalculation
When editing, we need to "undo" the old purchase's impact on HPP before applying the new values:
```javascript
// Remove old purchase impact
totalValue = (currentStok * currentHPP) - (oldQty * oldHarga)
currentStok = currentStok - oldQty

// Add new purchase impact
totalValue += (newQty * newHarga)
currentStok += newQty

// Calculate new average
newHPP = totalValue / currentStok
```

### Journal Entry Approach
- Store reference to original journal entry ID in pembelian transaction (optional)
- For edits: create new correction entry rather than modifying original
- For deletes: create reversing entry with opposite debit/credit
- Maintain audit trail of all journal entries

### UI Considerations
- Disable edit/delete buttons while operation is in progress
- Show loading indicator during save/delete
- Confirm before destructive operations
- Provide clear feedback on success/failure
- Allow undo for recent operations (future enhancement)
