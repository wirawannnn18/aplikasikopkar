# Panduan Lengkap Upload Master Barang Excel

## Daftar Isi
1. [Pengenalan Fitur](#pengenalan-fitur)
2. [Cara Mengakses](#cara-mengakses)
3. [Persiapan Data](#persiapan-data)
4. [Langkah-langkah Upload](#langkah-langkah-upload)
5. [Validasi dan Error Handling](#validasi-dan-error-handling)
6. [Fitur Lanjutan](#fitur-lanjutan)
7. [Troubleshooting](#troubleshooting)

## Pengenalan Fitur

Fitur Upload Master Barang Excel memungkinkan Anda untuk mengupload data barang secara massal menggunakan file Excel (.xlsx) atau CSV (.csv). Fitur ini dirancang untuk:

- **Efisiensi**: Menghemat waktu input data manual
- **Akurasi**: Mengurangi kesalahan input dengan validasi otomatis
- **Kemudahan**: Interface drag & drop yang user-friendly
- **Fleksibilitas**: Mendukung berbagai format file dan auto-create kategori/satuan

### Fitur Utama
- ✅ Drag & drop interface
- ✅ Validasi data real-time
- ✅ Preview data sebelum import
- ✅ Auto-create kategori dan satuan baru
- ✅ Progress tracking
- ✅ Bulk edit dalam preview mode
- ✅ Error handling dan recovery
- ✅ Audit logging lengkap
- ✅ Template download
- ✅ Responsive design
- ✅ Accessibility support

## Cara Mengakses

### Melalui Menu Utama
1. Login ke aplikasi koperasi
2. Pastikan Anda memiliki role **Administrator** atau **Super Admin**
3. Di sidebar menu, klik **"Upload Master Barang Excel"**
4. Halaman upload akan terbuka

### Akses Langsung
- Buka file `upload_master_barang_excel.html` di browser
- Atau klik tombol "Buka di Tab Baru" dari halaman menu

## Persiapan Data

### Format File yang Didukung
- **Excel**: .xlsx, .xls
- **CSV**: .csv (dengan encoding UTF-8)
- **Ukuran maksimal**: 5MB

### Struktur Data yang Diperlukan

| Kolom | Wajib | Format | Contoh | Keterangan |
|-------|-------|--------|--------|------------|
| `kode` | ✅ Ya | Teks, max 20 karakter, unik | BRG001 | Kode unik untuk setiap barang |
| `nama` | ✅ Ya | Teks, max 100 karakter | Beras Premium 5kg | Nama lengkap barang |
| `kategori` | ✅ Ya | Teks | makanan | Akan dibuat otomatis jika belum ada |
| `satuan` | ✅ Ya | Teks | kg | Akan dibuat otomatis jika belum ada |
| `harga_beli` | ✅ Ya | Angka, harus positif | 65000 | Harga beli dalam rupiah |
| `stok` | ✅ Ya | Angka, tidak boleh negatif | 50 | Jumlah stok awal |
| `supplier` | ❌ Tidak | Teks, max 100 karakter | PT Beras Sejahtera | Nama supplier (opsional) |

### Template CSV
Download template CSV dengan mengklik tombol "Download Template" di halaman upload. Template berisi:

```csv
kode,nama,kategori,satuan,harga_beli,stok,supplier
BRG001,Beras Premium 5kg,makanan,kg,65000,50,PT Beras Sejahtera
BRG002,Minyak Goreng 1L,makanan,botol,15000,30,CV Minyak Murni
BRG003,Pulpen Pilot Hitam,alat-tulis,pcs,3000,100,Toko ATK Lengkap
BRG004,Air Mineral 600ml,minuman,botol,2500,200,PT Air Bersih
```

## Langkah-langkah Upload

### Step 1: Upload File
1. **Drag & Drop**: Seret file ke area upload yang tersedia
2. **Atau klik**: Klik area upload untuk memilih file dari komputer
3. **Validasi**: Sistem akan memvalidasi format dan ukuran file
4. **Konfirmasi**: File yang valid akan ditampilkan dengan informasi ukuran

### Step 2: Preview Data
1. **Tabel Preview**: Data akan ditampilkan dalam tabel interaktif
2. **Status Validasi**: Setiap baris menampilkan status (Valid/Warning/Error)
3. **Statistik**: Lihat jumlah total records, valid, warning, dan error
4. **Bulk Edit** (opsional): Gunakan fitur bulk edit untuk mengubah multiple records

#### Fitur Bulk Edit
- Pilih checkbox pada baris yang ingin diedit
- Klik tombol "Bulk Edit"
- Ubah kategori, satuan, atau supplier secara massal
- Klik "Apply" untuk menerapkan perubahan

### Step 3: Validasi
1. **Review Errors**: Periksa semua error yang ditemukan
2. **Review Warnings**: Periksa warning (biasanya untuk data yang sudah ada)
3. **Perbaikan**: Kembali ke step sebelumnya jika ada error yang perlu diperbaiki
4. **Konfirmasi**: Lanjut ke import jika semua data valid

### Step 4: Import
1. **Mulai Import**: Klik "Mulai Import" untuk memproses data
2. **Progress Tracking**: Pantau progress real-time
3. **Hasil Import**: Lihat statistik hasil import (dibuat, diupdate, gagal)
4. **Selesai**: Klik "Selesai" untuk kembali ke menu utama

## Validasi dan Error Handling

### Jenis Validasi

#### 1. Validasi Format File
- Format file harus .xlsx, .xls, atau .csv
- Ukuran file maksimal 5MB
- File tidak boleh kosong

#### 2. Validasi Struktur Data
- Header kolom harus sesuai format
- Semua kolom wajib harus ada
- Tipe data harus sesuai (angka untuk harga dan stok)

#### 3. Validasi Business Rules
- Kode barang harus unik (tidak boleh duplikat)
- Harga beli harus positif (> 0)
- Stok tidak boleh negatif (>= 0)
- Nama barang tidak boleh kosong

#### 4. Validasi Data Existing
- Warning jika kode barang sudah ada (akan diupdate)
- Konfirmasi untuk kategori/satuan baru

### Penanganan Error

#### Error Types
- **🔴 Error**: Memblokir import, harus diperbaiki
- **🟡 Warning**: Tidak memblokir, tapi perlu perhatian
- **🟢 Valid**: Data siap untuk diimport

#### Pesan Error Umum
- `"Kode barang sudah ada"` → Duplikat dalam file
- `"Harga beli harus positif"` → Nilai harga <= 0
- `"Field wajib tidak boleh kosong"` → Data required kosong
- `"Format file tidak didukung"` → File bukan Excel/CSV

## Fitur Lanjutan

### 1. Auto-Create Kategori dan Satuan
- Sistem otomatis membuat kategori baru jika belum ada
- Sistem otomatis membuat satuan baru jika belum ada
- Normalisasi nama (lowercase, trim whitespace)

### 2. Audit Logging
- Semua aktivitas upload tercatat
- Timestamp dan user tracking
- Before/after data untuk perubahan
- Riwayat dapat diakses untuk audit

### 3. Recovery dan Rollback
- Backup otomatis sebelum import
- Informasi rollback tersimpan
- Recovery mechanism untuk error

### 4. Performance Optimization
- Chunked processing untuk file besar
- Non-blocking UI selama processing
- Memory management yang efisien

## Troubleshooting

### Masalah Umum dan Solusi

#### 1. File Tidak Bisa Diupload
**Gejala**: Error saat upload file
**Solusi**:
- Pastikan format file .xlsx, .xls, atau .csv
- Periksa ukuran file (maksimal 5MB)
- Pastikan file tidak corrupt
- Coba convert ke CSV jika Excel bermasalah

#### 2. Data Tidak Muncul di Preview
**Gejala**: Preview kosong atau error
**Solusi**:
- Periksa header kolom sesuai format
- Pastikan encoding file UTF-8 (untuk CSV)
- Periksa apakah ada karakter khusus yang bermasalah
- Coba buka file di Excel dan save ulang

#### 3. Banyak Error Validasi
**Gejala**: Banyak baris dengan status error
**Solusi**:
- Download template dan bandingkan format
- Periksa tipe data (angka vs teks)
- Pastikan tidak ada kode duplikat
- Periksa nilai negatif di harga/stok

#### 4. Import Gagal atau Lambat
**Gejala**: Proses import stuck atau error
**Solusi**:
- Refresh halaman dan coba lagi
- Kurangi jumlah data (split file besar)
- Periksa koneksi internet
- Tutup aplikasi lain yang berat

#### 5. Kategori/Satuan Tidak Terbuat
**Gejala**: Error "kategori tidak ditemukan"
**Solusi**:
- Pastikan nama kategori/satuan valid (tidak kosong)
- Hindari karakter khusus
- Periksa case sensitivity
- Coba buat manual di master data terlebih dahulu

### Tips Optimasi

#### Untuk File Besar (>1000 records)
1. Split file menjadi beberapa bagian
2. Upload di waktu yang tidak sibuk
3. Pastikan koneksi internet stabil
4. Monitor progress dan jangan tutup browser

#### Untuk Akurasi Data
1. Selalu gunakan template yang disediakan
2. Validasi data di Excel sebelum upload
3. Gunakan fitur bulk edit untuk koreksi massal
4. Review preview dengan teliti sebelum import

#### Untuk Performa
1. Tutup tab browser lain yang tidak perlu
2. Gunakan format CSV untuk file besar
3. Hindari upload bersamaan dengan user lain
4. Backup data sebelum import besar

## Dukungan dan Bantuan

Jika mengalami masalah yang tidak tercakup dalam panduan ini:

1. **Hubungi Support**:
   - WhatsApp: 0815-2260-0227
   - Email: support@koperasi-app.com

2. **Jam Operasional**:
   - Senin - Jumat: 08:00 - 17:00 WIB
   - Sabtu: 08:00 - 12:00 WIB

3. **Informasi yang Perlu Disiapkan**:
   - Screenshot error yang terjadi
   - File yang bermasalah (jika memungkinkan)
   - Langkah-langkah yang sudah dicoba
   - Browser dan versi yang digunakan

---

**© 2024 Aplikasi Koperasi Karyawan - CV Bangun Bina Pratama**