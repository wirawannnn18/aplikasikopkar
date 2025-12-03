# Fitur Upload Data Simpanan Pokok

## 📋 Ringkasan

Fitur baru untuk mempermudah input data simpanan pokok secara batch menggunakan file CSV/Excel. Administrator dapat menginput ratusan data simpanan pokok sekaligus dalam hitungan detik.

## ✨ Fitur yang Ditambahkan

### 1. Tombol Upload Data
- **Lokasi**: Menu Simpanan → Simpanan Pokok
- **Icon**: Upload (hijau)
- **Fungsi**: Membuka modal upload file CSV/Excel

### 2. Tombol Download Template
- **Lokasi**: Menu Simpanan → Simpanan Pokok
- **Icon**: Download (biru)
- **Fungsi**: Download template CSV dengan format yang benar

### 3. Modal Upload dengan 2 Metode Input
- **Tab 1 - Upload File**: Support CSV, XLSX, XLS
- **Tab 2 - Paste Data**: Paste langsung dari Excel/Spreadsheet (LEBIH CEPAT!)
- **Preview Data**: Tampilan tabel dengan status validasi
- **Summary**: Total data, data valid, data error
- **Validasi Real-time**: Setiap baris divalidasi sebelum proses
- **Auto-detect Delimiter**: Otomatis deteksi koma atau tab

### 4. Validasi Otomatis
- ✅ Validasi NIK (harus terdaftar di sistem)
- ✅ Validasi Jumlah (harus angka positif)
- ✅ Validasi Tanggal (format YYYY-MM-DD)
- ✅ Indikator visual (hijau = valid, merah = error)

### 5. Proses Batch
- Import semua data valid sekaligus
- Generate jurnal akuntansi otomatis untuk setiap transaksi
- Update localStorage
- Notifikasi hasil proses

## 🎯 Manfaat

### Untuk Administrator
- ⚡ **Super Cepat**: Input ratusan data dalam sekali klik
- 🎯 **Akurat**: Validasi otomatis mengurangi kesalahan
- 👀 **Transparan**: Preview sebelum proses
- 📊 **Fleksibel**: Upload file ATAU paste langsung dari Excel
- 🚀 **Efisien**: Paste data lebih cepat, tidak perlu save file dulu

### Untuk Koperasi
- 💰 **Efisien**: Hemat waktu input data
- 📈 **Skalabel**: Mudah handle anggota dalam jumlah besar
- 🔒 **Aman**: Validasi mencegah data salah masuk sistem
- 📝 **Audit Trail**: Jurnal otomatis tercatat dengan benar

## 🔧 Implementasi Teknis

### File yang Dimodifikasi
- `js/simpanan.js` - Menambahkan fungsi upload dan validasi

### Fungsi Baru yang Ditambahkan

```javascript
// Modal dan UI
showUploadSimpananPokokModal()      // Tampilkan modal upload dengan 2 tab
downloadTemplateSimpananPokok()     // Download template CSV

// Upload dan Parsing
previewUploadSimpananPokok()        // Preview file yang diupload
previewPastedData()                 // Preview data yang di-paste (NEW!)
parseUploadFile()                   // Parse dan validasi CSV/TSV (support tab delimiter)
isValidDate()                       // Validasi format tanggal

// Proses Data
processUploadSimpananPokok()        // Proses dan simpan data valid
```

### Struktur Data Upload

```javascript
{
    anggotaId: string,    // ID anggota dari database
    nik: string,          // NIK untuk referensi
    nama: string,         // Nama untuk display
    jumlah: number,       // Jumlah simpanan
    tanggal: string       // Tanggal transaksi (YYYY-MM-DD)
}
```

### Integrasi dengan Sistem

1. **localStorage**: Data tersimpan di `simpananPokok` array
2. **Jurnal**: Setiap transaksi generate jurnal via `addJurnal()`
   - Debit: Kas (1-1000)
   - Kredit: Simpanan Pokok (2-1100)
3. **COA**: Saldo akun otomatis terupdate
4. **UI**: Tabel simpanan pokok otomatis refresh

## 📊 Format File CSV

### Header (Wajib)
```
NIK,Nama,Jumlah,Tanggal
```

### Data Row
```
3201010101010001,Budi Santoso,1000000,2024-01-15
```

### Aturan Format
- **NIK**: String, harus terdaftar di sistem
- **Nama**: String, untuk referensi (sistem cocokkan dengan NIK)
- **Jumlah**: Number, tanpa separator (1000000 bukan 1.000.000)
- **Tanggal**: String, format YYYY-MM-DD

## 🧪 Testing

### Test Case 1: Upload File Valid
- ✅ Semua NIK terdaftar
- ✅ Semua jumlah positif
- ✅ Semua tanggal format benar
- **Expected**: Semua data berhasil diproses

### Test Case 2: Upload File dengan Error
- ❌ Beberapa NIK tidak terdaftar
- ❌ Beberapa jumlah negatif/0
- ❌ Beberapa tanggal format salah
- **Expected**: Hanya data valid yang diproses, error ditampilkan

### Test Case 3: Upload File Kosong
- **Expected**: Tombol "Proses Upload" disabled

### Test Case 4: Download Template
- **Expected**: File CSV terdownload dengan format benar

## 🚀 Cara Penggunaan

### Metode 1: Upload File (Tradisional)

#### Langkah 1: Persiapan Data
```bash
1. Klik "Download Template"
2. Buka file CSV di Excel/Spreadsheet
3. Isi data sesuai format
4. Save file
```

#### Langkah 2: Upload
```bash
1. Klik "Upload Data CSV/Excel"
2. Tab "Upload File"
3. Pilih file yang sudah diisi
4. Tunggu preview muncul otomatis
```

### Metode 2: Paste Data (RECOMMENDED - LEBIH CEPAT!)

#### Langkah 1: Siapkan Data di Excel
```bash
1. Buka Excel/Spreadsheet
2. Buat tabel dengan kolom: NIK, Nama, Jumlah, Tanggal
3. Isi data
```

#### Langkah 2: Copy & Paste
```bash
1. Select semua data di Excel (termasuk header)
2. Ctrl+C untuk copy
3. Klik "Upload Data CSV/Excel"
4. Tab "Paste Data"
5. Ctrl+V di text box
6. Klik "Preview Data"
```

### Langkah 3: Validasi
```bash
1. Periksa summary (Total, Valid, Error)
2. Scroll tabel preview
3. Cek baris merah (error) jika ada
4. Perbaiki file jika perlu
```

### Langkah 4: Proses
```bash
1. Klik "Proses Upload"
2. Konfirmasi jumlah data
3. Tunggu notifikasi sukses
4. Data muncul di tabel
```

## 📝 Catatan Penting

### Do's ✅
- Gunakan template yang disediakan
- Periksa NIK sudah terdaftar semua
- Gunakan format tanggal YYYY-MM-DD
- Review preview sebelum proses
- Backup data sebelum upload besar

### Don'ts ❌
- Jangan ubah header kolom
- Jangan gunakan separator di jumlah (titik/koma)
- Jangan gunakan format tanggal lain
- Jangan skip validasi preview
- Jangan upload file corrupt

## 🔮 Pengembangan Selanjutnya

Fitur ini bisa dikembangkan untuk:
- ✨ Upload Simpanan Wajib batch
- ✨ Upload Simpanan Sukarela batch
- ✨ Upload Pinjaman batch
- ✨ Export data simpanan ke Excel
- ✨ Import dengan mapping kolom custom
- ✨ Validasi duplikasi transaksi
- ✨ Rollback batch upload

## 📞 Support

Jika ada pertanyaan atau masalah:
1. Baca `PANDUAN_UPLOAD_SIMPANAN_POKOK.md`
2. Lihat `contoh_upload_simpanan_pokok.csv`
3. Hubungi administrator sistem

---

**Version**: 1.0.0  
**Date**: 2024  
**Author**: Koperasi Management System  
**Status**: ✅ Production Ready
