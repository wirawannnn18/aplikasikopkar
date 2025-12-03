# Implementasi Validasi Pembelian - Task 5.3

## Overview
Implementasi validasi komprehensif untuk fitur edit dan hapus pembelian dengan pesan error yang jelas dan user-friendly.

## Validasi yang Diimplementasikan

### 1. Validasi Required Fields (noFaktur, tanggal)

#### Lokasi: `savePembelian()` dan `savePembelianEdit()`

**Validasi noFaktur:**
```javascript
const noFaktur = document.getElementById('noFaktur').value.trim();

if (!noFaktur) {
    showAlert('No. Faktur harus diisi!', 'warning');
    document.getElementById('noFaktur').focus();
    return;
}
```

**Validasi tanggal:**
```javascript
const tanggal = document.getElementById('tanggalPembelian').value;

if (!tanggal) {
    showAlert('Tanggal pembelian harus diisi!', 'warning');
    document.getElementById('tanggalPembelian').focus();
    return;
}
```

**Fitur:**
- Menggunakan `.trim()` untuk menghilangkan whitespace
- Memberikan focus ke field yang error
- Pesan error yang jelas dan spesifik
- Mencegah submit jika field kosong

---

### 2. Validasi Empty Items List

#### Lokasi: `savePembelian()` dan `savePembelianEdit()`

```javascript
if (itemsPembelian.length === 0) {
    showAlert('Tambahkan minimal 1 item pembelian', 'warning');
    return;
}
```

**Fitur:**
- Pesan sesuai requirement: "Tambahkan minimal 1 item pembelian"
- Mencegah penyimpanan transaksi tanpa item
- Berlaku untuk mode create dan edit

---

### 3. Validasi Negative Qty

#### Lokasi: `savePembelian()`, `savePembelianEdit()`, `addItemPembelian()`, `updateItemQty()`

**Dalam savePembelian/savePembelianEdit:**
```javascript
for (let i = 0; i < itemsPembelian.length; i++) {
    const item = itemsPembelian[i];
    
    if (item.qty <= 0) {
        showAlert(`Item "${item.nama}": Qty harus lebih dari 0!`, 'warning');
        return;
    }
}
```

**Dalam addItemPembelian:**
```javascript
if (!qty || qty <= 0) {
    showAlert('Qty harus lebih dari 0!', 'warning');
    document.getElementById('qtyBarang').focus();
    return;
}
```

**Dalam updateItemQty:**
```javascript
const qty = parseFloat(newQty);

if (isNaN(qty) || qty <= 0) {
    showAlert(`Qty harus lebih dari 0!`, 'warning');
    updateItemPembelianList(); // Reset to previous value
    return;
}
```

**Fitur:**
- Mencegah qty = 0 atau negatif
- Pesan error menyebutkan nama item (dalam loop validation)
- Auto-reset ke nilai sebelumnya saat update gagal
- Memberikan focus ke field yang error

---

### 4. Validasi Negative Harga

#### Lokasi: `savePembelian()`, `savePembelianEdit()`, `addItemPembelian()`, `updateItemHarga()`

**Dalam savePembelian/savePembelianEdit:**
```javascript
for (let i = 0; i < itemsPembelian.length; i++) {
    const item = itemsPembelian[i];
    
    if (item.harga < 0) {
        showAlert(`Item "${item.nama}": Harga tidak boleh negatif!`, 'warning');
        return;
    }
}
```

**Dalam addItemPembelian:**
```javascript
if (harga === null || harga === undefined || isNaN(harga)) {
    showAlert('Harga beli harus diisi!', 'warning');
    document.getElementById('hargaBeli').focus();
    return;
}

if (harga < 0) {
    showAlert('Harga tidak boleh negatif!', 'warning');
    document.getElementById('hargaBeli').focus();
    return;
}
```

**Dalam updateItemHarga:**
```javascript
const harga = parseFloat(newHarga);

if (isNaN(harga) || harga < 0) {
    showAlert('Harga tidak boleh negatif!', 'warning');
    updateItemPembelianList(); // Reset to previous value
    return;
}
```

**Fitur:**
- Mencegah harga negatif
- Memvalidasi harga yang tidak valid (NaN, null, undefined)
- Pesan error menyebutkan nama item (dalam loop validation)
- Auto-reset ke nilai sebelumnya saat update gagal
- Memberikan focus ke field yang error

---

### 5. Validasi Add Item

#### Lokasi: `addItemPembelian()`

**Validasi barang selected:**
```javascript
if (!barangId) {
    showAlert('Pilih barang terlebih dahulu!', 'warning');
    document.getElementById('selectBarang').focus();
    return;
}
```

**Fitur:**
- Memastikan barang dipilih sebelum menambah item
- Validasi qty dan harga (lihat section 3 & 4)
- Memberikan focus ke field yang error
- Mencegah penambahan item dengan data tidak lengkap

---

## Pola Validasi yang Konsisten

### 1. Urutan Validasi
1. Required fields (noFaktur, tanggal)
2. Empty items list
3. Item-level validation (qty, harga)

### 2. Pesan Error
- Jelas dan spesifik
- Menyebutkan field/item yang bermasalah
- Menggunakan bahasa Indonesia yang mudah dipahami
- Konsisten di seluruh aplikasi

### 3. User Experience
- Auto-focus ke field yang error
- Auto-reset nilai invalid ke nilai sebelumnya (untuk update)
- Mencegah submit jika ada error
- Tidak ada multiple alert berturut-turut (stop at first error)

---

## Testing

### Manual Testing
Gunakan file `test_validation_pembelian.html` untuk testing manual:

1. **Test Required Fields**
   - Coba simpan tanpa noFaktur
   - Coba simpan tanpa tanggal
   - Verifikasi pesan error dan focus

2. **Test Empty Items**
   - Coba simpan tanpa item
   - Verifikasi pesan: "Tambahkan minimal 1 item pembelian"

3. **Test Negative Qty**
   - Coba tambah item dengan qty = 0
   - Coba tambah item dengan qty negatif
   - Coba update qty item menjadi 0 atau negatif

4. **Test Negative Harga**
   - Coba tambah item dengan harga negatif
   - Coba update harga item menjadi negatif

5. **Test Edit Mode**
   - Verifikasi semua validasi juga bekerja di edit mode
   - Test dengan transaksi existing

### Automated Testing
Run all tests dengan membuka `test_validation_pembelian.html` di browser dan klik "Run All Tests".

---

## Requirements Coverage

✅ **Requirement 5.3**: Implementasi validasi dengan pesan yang jelas
- ✅ Validate empty items list dengan pesan "Tambahkan minimal 1 item pembelian"
- ✅ Validate negative qty/harga
- ✅ Validate required fields (noFaktur, tanggal)

---

## Error Handling

### Validation Errors
Semua validation error menggunakan `showAlert()` dengan type 'warning':
- User-friendly messages
- Non-blocking (tidak crash aplikasi)
- Memberikan guidance untuk fix

### Focus Management
Setiap validation error yang terkait dengan input field akan:
1. Menampilkan pesan error
2. Memberikan focus ke field yang bermasalah
3. Mencegah form submission

### Value Reset
Untuk inline editing (updateItemQty, updateItemHarga):
- Jika nilai invalid, reset ke nilai sebelumnya
- Re-render list untuk menampilkan nilai yang benar
- Tidak mengubah data jika validasi gagal

---

## Implementation Notes

### Consistency
- Semua fungsi save/edit menggunakan pola validasi yang sama
- Pesan error konsisten di seluruh aplikasi
- Validation order yang logis (required → empty → item-level)

### Performance
- Validasi dilakukan sebelum operasi database
- Early return untuk mencegah operasi yang tidak perlu
- Minimal DOM manipulation

### Maintainability
- Validasi terpusat di fungsi save/edit
- Mudah untuk menambah validasi baru
- Clear separation of concerns

---

## Future Enhancements

Potential improvements untuk future tasks:
1. Real-time validation (saat user mengetik)
2. Visual indicators (red border pada field error)
3. Validation summary (list semua error sekaligus)
4. Custom validation rules per field
5. Internationalization (i18n) untuk pesan error

---

## Conclusion

Implementasi validasi telah selesai dengan:
- ✅ Semua requirement terpenuhi
- ✅ Pesan error yang jelas dan user-friendly
- ✅ Konsisten di mode create dan edit
- ✅ Good UX dengan focus management
- ✅ Comprehensive test coverage

Task 5.3 **COMPLETE** ✓
