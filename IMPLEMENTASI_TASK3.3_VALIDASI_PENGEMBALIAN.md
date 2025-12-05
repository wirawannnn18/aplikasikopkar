# Implementasi Task 3.3: Fungsi Validasi Pengembalian

## Status: ✅ SELESAI

## Ringkasan

Task 3.3 telah berhasil diimplementasikan. Fungsi `validatePengembalian()` telah dibuat dengan validasi lengkap sesuai Requirements 6.1-6.4.

## Fungsi yang Diimplementasikan

### validatePengembalian(anggotaId, metodePembayaran)

**Deskripsi:** Memvalidasi kelayakan pengembalian simpanan sebelum diproses.

**Parameter:**
- `anggotaId` (string, required): ID anggota
- `metodePembayaran` (string, optional): Metode pembayaran ("Kas" atau "Transfer Bank")

**Return:**
```javascript
{
  success: boolean,
  valid: boolean,
  errors: array,      // Array of validation errors
  warnings: array,    // Array of validation warnings
  message: string,
  timestamp: string
}
```

## Validasi yang Diimplementasikan

### 1. ✅ Validasi Pinjaman Aktif (Requirement 6.1)

**Aturan:** Anggota tidak boleh memiliki pinjaman aktif

**Implementasi:**
- Memanggil `getPinjamanAktif(anggotaId)`
- Jika ada pinjaman dengan status != "lunas", validasi gagal
- Menghitung total pinjaman aktif
- Menampilkan jumlah pinjaman dan total nilai

**Error Code:** `ACTIVE_LOAN_EXISTS`

**Error Message:**
```
"Anggota memiliki {count} pinjaman aktif dengan total Rp {total}"
```

**Data yang Dikembalikan:**
```javascript
{
  code: 'ACTIVE_LOAN_EXISTS',
  message: 'Anggota memiliki 2 pinjaman aktif dengan total Rp 5.000.000',
  field: 'pinjaman',
  severity: 'error',
  data: {
    count: 2,
    total: 5000000,
    loans: [...]  // Array pinjaman aktif
  }
}
```

### 2. ✅ Validasi Saldo Kas (Requirement 6.2)

**Aturan:** Saldo kas harus mencukupi untuk pengembalian

**Implementasi:**
- Memanggil `calculatePengembalian(anggotaId)` untuk mendapat total
- Menghitung saldo kas dari jurnal (akun 1-1000)
- Membandingkan saldo kas dengan total pengembalian
- Jika kas < total pengembalian, validasi gagal

**Error Code:** `INSUFFICIENT_BALANCE`

**Error Message:**
```
"Saldo kas tidak mencukupi. Dibutuhkan: Rp {required}, Tersedia: Rp {available}"
```

**Data yang Dikembalikan:**
```javascript
{
  code: 'INSUFFICIENT_BALANCE',
  message: 'Saldo kas tidak mencukupi. Dibutuhkan: Rp 10.000.000, Tersedia: Rp 5.000.000',
  field: 'kas',
  severity: 'error',
  data: {
    required: 10000000,
    available: 5000000,
    shortfall: 5000000
  }
}
```

### 3. ✅ Validasi Metode Pembayaran (Requirement 6.3)

**Aturan:** Metode pembayaran harus dipilih dan valid

**Implementasi:**
- Jika `metodePembayaran` parameter diberikan, lakukan validasi
- Cek apakah null, empty, atau bukan string
- Cek apakah nilai valid ("Kas" atau "Transfer Bank")

**Error Code:** 
- `PAYMENT_METHOD_REQUIRED` - jika kosong
- `INVALID_PAYMENT_METHOD` - jika nilai tidak valid

**Error Message:**
```
"Metode pembayaran harus dipilih"
"Metode pembayaran tidak valid. Pilihan: Kas, Transfer Bank"
```

**Data yang Dikembalikan:**
```javascript
{
  code: 'PAYMENT_METHOD_REQUIRED',
  message: 'Metode pembayaran harus dipilih',
  field: 'metodePembayaran',
  severity: 'error',
  data: null
}
```

### 4. ✅ Peringatan: Total Pengembalian Negatif

**Aturan:** Memberikan warning jika total pengembalian negatif (anggota masih punya hutang)

**Implementasi:**
- Jika totalPengembalian < 0, tambahkan warning
- Ini bukan error, hanya peringatan
- Proses tetap bisa dilanjutkan

**Warning Code:** `NEGATIVE_PENGEMBALIAN`

**Warning Message:**
```
"Total pengembalian negatif (Rp {amount}). Anggota masih memiliki kewajiban."
```

## Format Response

### Success Response (Validasi Berhasil)

```javascript
{
  success: true,
  valid: true,
  errors: [],
  warnings: [],  // atau array warnings jika ada
  message: 'Validasi berhasil, pengembalian dapat diproses',
  timestamp: '2024-12-04T10:30:00.000Z'
}
```

### Error Response (Validasi Gagal)

```javascript
{
  success: false,
  valid: false,
  errors: [
    {
      code: 'ACTIVE_LOAN_EXISTS',
      message: 'Anggota memiliki 1 pinjaman aktif dengan total Rp 2.000.000',
      field: 'pinjaman',
      severity: 'error',
      data: { count: 1, total: 2000000, loans: [...] }
    },
    {
      code: 'INSUFFICIENT_BALANCE',
      message: 'Saldo kas tidak mencukupi. Dibutuhkan: Rp 5.000.000, Tersedia: Rp 3.000.000',
      field: 'kas',
      severity: 'error',
      data: { required: 5000000, available: 3000000, shortfall: 2000000 }
    }
  ],
  warnings: [],
  message: 'Validasi gagal: 2 error ditemukan',
  timestamp: '2024-12-04T10:30:00.000Z'
}
```

## Error Codes

| Code | Severity | Description |
|------|----------|-------------|
| `INVALID_PARAMETER` | error | ID anggota tidak valid |
| `ANGGOTA_NOT_FOUND` | error | Anggota tidak ditemukan |
| `ACTIVE_LOAN_EXISTS` | error | Anggota memiliki pinjaman aktif |
| `INSUFFICIENT_BALANCE` | error | Saldo kas tidak mencukupi |
| `PAYMENT_METHOD_REQUIRED` | error | Metode pembayaran belum dipilih |
| `INVALID_PAYMENT_METHOD` | error | Metode pembayaran tidak valid |
| `NEGATIVE_PENGEMBALIAN` | warning | Total pengembalian negatif |
| `SYSTEM_ERROR` | error | Kesalahan sistem |

## Fitur Utama

### 1. Multiple Validation Errors
- Fungsi mengumpulkan SEMUA error validasi
- Tidak berhenti di error pertama
- User mendapat feedback lengkap tentang semua masalah

### 2. Detailed Error Information
- Setiap error memiliki code, message, field, severity, dan data
- Data tambahan membantu debugging dan UI display
- Format konsisten untuk semua error

### 3. Warnings vs Errors
- **Errors:** Mencegah proses pengembalian
- **Warnings:** Informasi penting tapi tidak blocking
- Contoh: Total negatif adalah warning, bukan error

### 4. Flexible Payment Method Validation
- Parameter `metodePembayaran` optional
- Jika null, validasi metode pembayaran di-skip
- Berguna untuk validasi awal sebelum form submission

## Integrasi dengan Fungsi Lain

Fungsi ini menggunakan:
- ✅ `getAnggotaById()` - Cek anggota exists
- ✅ `getPinjamanAktif()` - Cek pinjaman aktif
- ✅ `calculatePengembalian()` - Hitung total pengembalian
- ✅ `localStorage.getItem('jurnal')` - Hitung saldo kas

## Contoh Penggunaan

### 1. Validasi Awal (Tanpa Metode Pembayaran)

```javascript
// Validasi saat membuka modal pengembalian
const validation = validatePengembalian('anggota-id-123');

if (!validation.valid) {
  // Tampilkan semua error
  validation.errors.forEach(error => {
    console.error(error.message);
  });
  
  // Disable tombol "Proses"
  document.getElementById('btnProses').disabled = true;
} else {
  // Enable tombol "Proses"
  document.getElementById('btnProses').disabled = false;
  
  // Tampilkan warnings jika ada
  validation.warnings.forEach(warning => {
    console.warn(warning.message);
  });
}
```

### 2. Validasi Final (Dengan Metode Pembayaran)

```javascript
// Validasi saat submit form
const metodePembayaran = document.getElementById('metodePembayaran').value;
const validation = validatePengembalian('anggota-id-123', metodePembayaran);

if (!validation.valid) {
  // Tampilkan error dan prevent submission
  showErrorMessages(validation.errors);
  return false;
}

// Lanjutkan proses pengembalian
processPengembalian('anggota-id-123', metodePembayaran, ...);
```

### 3. Display Error Messages di UI

```javascript
function displayValidationErrors(validation) {
  const errorContainer = document.getElementById('validationErrors');
  
  if (!validation.valid) {
    const errorHTML = validation.errors.map(error => `
      <div class="alert alert-danger">
        <strong>${error.code}:</strong> ${error.message}
      </div>
    `).join('');
    
    errorContainer.innerHTML = errorHTML;
  }
  
  // Display warnings
  if (validation.warnings.length > 0) {
    const warningHTML = validation.warnings.map(warning => `
      <div class="alert alert-warning">
        <strong>Peringatan:</strong> ${warning.message}
      </div>
    `).join('');
    
    errorContainer.innerHTML += warningHTML;
  }
}
```

## Testing

Fungsi ini akan ditest dengan property-based testing pada:
- Task 3.4: Property test for active loan validation (Property 4)
- Task 3.5: Property test for payment method validation (Property 12)

## File yang Dimodifikasi

- `js/anggotaKeluarManager.js`: Implementasi lengkap `validatePengembalian()`

## Langkah Selanjutnya

- [ ] Task 3.4: Write property test for active loan validation
- [ ] Task 3.5: Write property test for payment method validation
- [ ] Task 4: Implement pengembalian processing with accounting integration

## Catatan Penting

1. **Comprehensive Validation:** Semua validasi dilakukan sekaligus, tidak berhenti di error pertama
2. **User-Friendly Messages:** Pesan error jelas dan informatif dengan data lengkap
3. **Flexible:** Parameter metodePembayaran optional untuk validasi bertahap
4. **Extensible:** Mudah menambahkan validasi baru dengan format yang sama
5. **Error Handling:** Try-catch untuk menangani error sistem

---

**Tanggal Implementasi:** 4 Desember 2024  
**Developer:** Kiro AI Assistant  
**Status:** ✅ SELESAI - Siap untuk testing (Task 3.4 & 3.5)
