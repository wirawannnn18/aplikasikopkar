# Perbaikan Validasi Saldo Kas pada Anggota Keluar

## Masalah

Ketika memproses pengembalian simpanan untuk anggota keluar, sistem menampilkan error "saldo kas tidak mencukupi" meskipun sebenarnya ada saldo yang cukup di kas atau bank.

### Penyebab Masalah

Fungsi `validatePengembalian()` di file `js/anggotaKeluarManager.js` hanya memeriksa saldo akun **Kas (1-1000)** saja, tanpa mempertimbangkan:

1. Saldo akun **Bank (1-1100)**
2. Metode pembayaran yang dipilih (Kas atau Transfer Bank)

Kode lama:
```javascript
// Hanya memeriksa akun Kas
const kasBalance = jurnal
    .filter(j => j.akun === '1-1000') // Akun Kas
    .reduce((sum, j) => sum + (j.debit || 0) - (j.kredit || 0), 0);

if (totalPengembalian > 0 && kasBalance < totalPengembalian) {
    // Error: saldo kas tidak mencukupi
}
```

## Solusi yang Diterapkan

Fungsi `validatePengembalian()` telah diperbaiki untuk:

### 1. Menghitung Saldo Kas dan Bank Secara Terpisah

```javascript
// Calculate Kas balance (1-1000)
const kasBalance = jurnal
    .filter(j => j.akun === '1-1000')
    .reduce((sum, j) => sum + (j.debit || 0) - (j.kredit || 0), 0);

// Calculate Bank balance (1-1100)
const bankBalance = jurnal
    .filter(j => j.akun === '1-1100')
    .reduce((sum, j) => sum + (j.debit || 0) - (j.kredit || 0), 0);

// Total available balance
const totalAvailableBalance = kasBalance + bankBalance;
```

### 2. Validasi Berdasarkan Metode Pembayaran

**Jika metode pembayaran = "Kas":**
- Hanya memeriksa saldo Kas (1-1000)
- Error jika saldo Kas tidak mencukupi

**Jika metode pembayaran = "Transfer Bank":**
- Hanya memeriksa saldo Bank (1-1100)
- Error jika saldo Bank tidak mencukupi

**Jika metode pembayaran belum dipilih:**
- Memeriksa total saldo (Kas + Bank)
- Error jika total saldo tidak mencukupi
- Menampilkan rincian saldo Kas dan Bank

### 3. Pesan Error yang Lebih Informatif

Pesan error sekarang menampilkan:
- Jumlah yang dibutuhkan
- Saldo yang tersedia di akun yang relevan
- Rincian saldo Kas dan Bank (jika metode pembayaran belum dipilih)

Contoh pesan error:

**Untuk metode Kas:**
```
Saldo kas tidak mencukupi. 
Dibutuhkan: Rp 5.000.000
Tersedia di Kas: Rp 2.000.000
```

**Untuk metode Transfer Bank:**
```
Saldo bank tidak mencukupi. 
Dibutuhkan: Rp 5.000.000
Tersedia di Bank: Rp 3.000.000
```

**Jika metode belum dipilih:**
```
Saldo kas/bank tidak mencukupi. 
Dibutuhkan: Rp 5.000.000
Tersedia: Rp 4.500.000 (Kas: Rp 2.000.000, Bank: Rp 2.500.000)
```

## Cara Menggunakan

### 1. Cek Saldo Kas dan Bank

Sebelum memproses pengembalian, pastikan Anda memeriksa saldo:

1. Buka menu **Keuangan > Jurnal**
2. Lihat saldo akun:
   - **1-1000 (Kas)**: Saldo kas tunai
   - **1-1100 (Bank)**: Saldo rekening bank

### 2. Pilih Metode Pembayaran yang Sesuai

Saat memproses pengembalian simpanan:

1. Jika saldo Kas mencukupi → Pilih **"Kas"**
2. Jika saldo Bank mencukupi → Pilih **"Transfer Bank"**
3. Jika keduanya tidak mencukupi → Tambah saldo terlebih dahulu

### 3. Menambah Saldo Kas/Bank

Jika saldo tidak mencukupi, Anda bisa:

**Opsi 1: Transfer dari Bank ke Kas**
```
Menu: Keuangan > Jurnal > Tambah Jurnal
Keterangan: Transfer Bank ke Kas
Entry 1: Kas (1-1000) - Debit: [jumlah]
Entry 2: Bank (1-1100) - Kredit: [jumlah]
```

**Opsi 2: Tambah Modal/Setoran**
```
Menu: Keuangan > Jurnal > Tambah Jurnal
Keterangan: Setoran Modal Tambahan
Entry 1: Kas/Bank - Debit: [jumlah]
Entry 2: Modal (3-1000) - Kredit: [jumlah]
```

## Contoh Kasus

### Kasus 1: Saldo Kas Cukup

**Situasi:**
- Total pengembalian: Rp 3.000.000
- Saldo Kas: Rp 5.000.000
- Saldo Bank: Rp 2.000.000

**Solusi:**
- Pilih metode pembayaran: **"Kas"**
- Proses pengembalian akan berhasil ✅

### Kasus 2: Saldo Kas Tidak Cukup, Bank Cukup

**Situasi:**
- Total pengembalian: Rp 4.000.000
- Saldo Kas: Rp 1.000.000
- Saldo Bank: Rp 6.000.000

**Solusi:**
- Pilih metode pembayaran: **"Transfer Bank"**
- Proses pengembalian akan berhasil ✅

### Kasus 3: Total Saldo Cukup, Tapi Terpisah

**Situasi:**
- Total pengembalian: Rp 5.000.000
- Saldo Kas: Rp 2.000.000
- Saldo Bank: Rp 4.000.000

**Solusi Opsi 1 - Transfer dari Bank ke Kas:**
1. Buat jurnal transfer: Bank → Kas sebesar Rp 3.000.000
2. Sekarang Kas: Rp 5.000.000, Bank: Rp 1.000.000
3. Pilih metode: **"Kas"**
4. Proses pengembalian ✅

**Solusi Opsi 2 - Gunakan Bank:**
1. Pilih metode: **"Transfer Bank"**
2. Proses pengembalian akan berhasil ✅

### Kasus 4: Total Saldo Tidak Cukup

**Situasi:**
- Total pengembalian: Rp 10.000.000
- Saldo Kas: Rp 2.000.000
- Saldo Bank: Rp 3.000.000
- Total: Rp 5.000.000 (kurang Rp 5.000.000)

**Solusi:**
1. Tambah modal/setoran sebesar minimal Rp 5.000.000
2. Atau tunda pengembalian sampai saldo mencukupi

## File yang Diubah

- `js/anggotaKeluarManager.js` - Fungsi `validatePengembalian()`

## Testing

Untuk menguji perbaikan ini:

1. Buka halaman **Anggota Keluar**
2. Pilih anggota yang akan diproses pengembaliannya
3. Sistem akan menampilkan:
   - Total pengembalian yang harus dibayar
   - Saldo Kas dan Bank yang tersedia
   - Validasi otomatis berdasarkan metode pembayaran

## Catatan Penting

⚠️ **Perhatian:**
- Pastikan selalu memilih metode pembayaran yang sesuai dengan saldo yang tersedia
- Sistem akan memvalidasi saldo secara real-time berdasarkan metode yang dipilih
- Jika validasi gagal, periksa saldo Kas dan Bank di menu Jurnal

## Tanggal Perbaikan

5 Desember 2025

## Status

✅ **SELESAI** - Perbaikan telah diterapkan dan siap digunakan
