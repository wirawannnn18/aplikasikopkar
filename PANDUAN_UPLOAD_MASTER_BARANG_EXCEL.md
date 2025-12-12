# Panduan Upload Master Barang Excel

## Daftar Isi
1. [Pengenalan](#pengenalan)
2. [Persiapan File](#persiapan-file)
3. [Langkah-langkah Upload](#langkah-langkah-upload)
4. [Format File yang Didukung](#format-file-yang-didukung)
5. [Validasi Data](#validasi-data)
6. [Troubleshooting](#troubleshooting)
7. [FAQ](#faq)

## Pengenalan

Fitur Upload Master Barang Excel memungkinkan Anda untuk mengelola data barang secara massal menggunakan file Excel (.xlsx) atau CSV (.csv). Fitur ini dirancang untuk:

- **Menghemat Waktu**: Upload ratusan data barang sekaligus
- **Mengurangi Kesalahan**: Validasi otomatis untuk memastikan data yang benar
- **Manajemen Kategori**: Otomatis membuat kategori dan satuan baru
- **Audit Trail**: Pencatatan lengkap semua aktivitas upload

## Persiapan File

### 1. Download Template

Sebelum memulai upload, download template CSV yang telah disediakan:

1. Buka halaman **Upload Master Barang Excel**
2. Klik tombol **"Download Template CSV"**
3. Buka file template dengan Excel atau aplikasi spreadsheet lainnya

### 2. Format Kolom yang Diperlukan

Template CSV berisi kolom-kolom berikut:

| Kolom | Wajib | Deskripsi | Contoh |
|-------|-------|-----------|---------|
| **kode** | ✅ | Kode unik barang (max 20 karakter) | `BRG001` |
| **nama** | ✅ | Nama barang (max 100 karakter) | `Beras Premium 5kg` |
| **kategori** | ✅ | Kategori barang | `makanan` |
| **satuan** | ✅ | Satuan barang | `kg` |
| **harga_beli** | ✅ | Harga beli (harus positif) | `45000` |
| **stok** | ✅ | Stok awal (tidak boleh negatif) | `100` |
| **supplier** | ❌ | Nama supplier (opsional) | `PT Beras Sejahtera` |

### 3. Aturan Penting

⚠️ **Perhatikan aturan berikut:**

- **Kode barang harus unik** - tidak boleh ada duplikasi
- **Semua kolom wajib harus diisi** - tidak boleh kosong
- **Harga beli harus positif** - tidak boleh 0 atau negatif
- **Stok tidak boleh negatif** - boleh 0 untuk barang habis
- **Kategori dan satuan** akan dibuat otomatis jika belum ada

## Langkah-langkah Upload

### Langkah 1: Akses Halaman Upload

1. Login ke sistem koperasi
2. Buka menu **Master Data** → **Upload Master Barang Excel**
3. Anda akan melihat interface upload dengan 4 tahap:
   - 📁 **Upload** - Pilih dan upload file
   - 👁️ **Preview** - Lihat pratinjau data
   - ✅ **Validate** - Validasi data
   - 📥 **Import** - Import data ke sistem

### Langkah 2: Upload File

![Upload Interface](screenshots/upload-step1.png)

1. **Drag & Drop**: Seret file ke area upload, atau
2. **Klik Browse**: Klik tombol "Pilih File" untuk memilih file
3. **Format yang didukung**: CSV (.csv) atau Excel (.xlsx)
4. **Ukuran maksimal**: 5MB per file

**Indikator Visual:**
- ✅ **Hijau**: File valid dan siap diproses
- ❌ **Merah**: File tidak valid (format salah/terlalu besar)
- ⏳ **Biru**: Sedang memproses file

### Langkah 3: Preview Data

![Preview Interface](screenshots/upload-step2.png)

Setelah file berhasil diupload, Anda akan melihat:

1. **Tabel Preview**: Menampilkan semua data dari file
2. **Statistik**: Jumlah total record yang akan diproses
3. **Status Indikator**:
   - 🟢 **Hijau**: Data valid
   - 🟡 **Kuning**: Warning (data akan diupdate)
   - 🔴 **Merah**: Error (harus diperbaiki)

**Fitur Preview:**
- **Filter**: Filter data berdasarkan status validasi
- **Search**: Cari data spesifik
- **Sort**: Urutkan berdasarkan kolom tertentu

### Langkah 4: Validasi Data

![Validation Interface](screenshots/upload-step3.png)

Sistem akan melakukan validasi otomatis:

#### Validasi Format
- ✅ Format file (CSV/Excel)
- ✅ Ukuran file (max 5MB)
- ✅ Encoding karakter

#### Validasi Struktur
- ✅ Header kolom sesuai template
- ✅ Jumlah kolom yang benar
- ✅ Tipe data setiap kolom

#### Validasi Business Rules
- ✅ Semua field wajib terisi
- ✅ Kode barang unik (tidak duplikat)
- ✅ Harga beli positif
- ✅ Stok tidak negatif
- ✅ Panjang karakter sesuai batas

#### Validasi Integritas
- ✅ Kode barang yang sudah ada (warning untuk update)
- ✅ Kategori dan satuan baru (akan dibuat otomatis)

### Langkah 5: Review Kategori & Satuan Baru

![Category Management](screenshots/upload-step3b.png)

Jika ada kategori atau satuan baru:

1. **Review Kategori Baru**: Sistem akan menampilkan daftar kategori yang akan dibuat
2. **Review Satuan Baru**: Sistem akan menampilkan daftar satuan yang akan dibuat
3. **Konfirmasi**: Klik "Setuju" untuk membuat kategori/satuan baru

**Contoh:**
```
Kategori Baru yang Akan Dibuat:
- elektronik
- peralatan rumah tangga

Satuan Baru yang Akan Dibuat:
- unit
- set
```

### Langkah 6: Import Data

![Import Process](screenshots/upload-step4.png)

1. **Klik "Mulai Import"** setelah semua validasi berhasil
2. **Progress Bar**: Menampilkan progress real-time
3. **Status Update**: Informasi detail proses yang sedang berjalan

**Proses Import:**
- 📊 **Chunked Processing**: Data diproses dalam batch untuk performa optimal
- 🔄 **Real-time Progress**: Update progress setiap detik
- 🛡️ **Error Recovery**: Otomatis recovery jika ada error minor
- 📝 **Audit Logging**: Semua aktivitas tercatat untuk audit

### Langkah 7: Review Hasil

![Import Results](screenshots/upload-step5.png)

Setelah import selesai, Anda akan melihat:

#### Summary Hasil
```
✅ Import Berhasil Diselesaikan

📊 Statistik Import:
- Total Record: 150
- Berhasil Dibuat: 120
- Berhasil Diupdate: 25  
- Gagal: 5

⏱️ Waktu Proses: 2 menit 30 detik
📅 Tanggal: 12 Desember 2024, 14:30 WIB
👤 User: admin@koperasi.com
```

#### Detail Record Gagal
Jika ada record yang gagal, sistem akan menampilkan:
- **Nomor Baris**: Baris ke berapa dalam file
- **Kode Barang**: Kode yang bermasalah
- **Error**: Deskripsi error spesifik
- **Solusi**: Saran perbaikan

#### Opsi Setelah Import
- **📥 Download Laporan**: Download laporan hasil import (Excel)
- **🔄 Upload Ulang**: Upload file baru untuk record yang gagal
- **📋 Lihat Audit Log**: Lihat riwayat lengkap aktivitas

## Format File yang Didukung

### CSV Format

**Encoding**: UTF-8 (recommended) atau Windows-1252
**Delimiter**: Koma (,)
**Text Qualifier**: Tanda kutip ganda (")

**Contoh CSV:**
```csv
kode,nama,kategori,satuan,harga_beli,stok,supplier
BRG001,"Beras Premium 5kg",makanan,kg,45000,100,"PT Beras Sejahtera"
BRG002,"Minyak Goreng 1L",makanan,liter,15000,50,"CV Minyak Jaya"
BRG003,"Sabun Mandi",kebersihan,pcs,3500,200,"PT Sabun Bersih"
```

### Excel Format

**Format**: .xlsx (Excel 2007 atau lebih baru)
**Sheet**: Data harus ada di sheet pertama
**Header**: Baris pertama harus berisi nama kolom

**Tips Excel:**
- Gunakan format "Text" untuk kolom kode barang
- Gunakan format "Number" untuk harga dan stok
- Hindari formula, gunakan nilai langsung

## Validasi Data

### Error yang Sering Terjadi

#### 1. Kode Barang Duplikat
```
❌ Error: Kode barang 'BRG001' duplikat pada baris 15 dan 28
💡 Solusi: Pastikan setiap kode barang unik
```

#### 2. Field Wajib Kosong
```
❌ Error: Field 'nama' kosong pada baris 12
💡 Solusi: Isi semua field yang wajib diisi
```

#### 3. Harga Negatif
```
❌ Error: Harga beli '-5000' tidak valid pada baris 8
💡 Solusi: Harga beli harus positif (> 0)
```

#### 4. Format Data Salah
```
❌ Error: Stok 'abc' bukan angka pada baris 20
💡 Solusi: Stok harus berupa angka
```

### Warning yang Perlu Diperhatikan

#### 1. Data Akan Diupdate
```
⚠️ Warning: Kode barang 'BRG001' sudah ada, data akan diupdate
💡 Info: Data lama akan diganti dengan data baru
```

#### 2. Kategori Baru
```
⚠️ Warning: Kategori 'elektronik' belum ada, akan dibuat otomatis
💡 Info: Kategori baru akan ditambahkan ke sistem
```

## Troubleshooting

### Masalah Upload File

#### File Tidak Bisa Diupload
**Gejala**: File tidak bisa di-drag atau browse
**Penyebab Umum**:
- Format file tidak didukung
- Ukuran file terlalu besar (>5MB)
- Browser tidak mendukung drag & drop

**Solusi**:
1. Pastikan file berformat CSV atau Excel (.xlsx)
2. Kompres file jika terlalu besar
3. Gunakan browser modern (Chrome, Firefox, Edge)
4. Refresh halaman dan coba lagi

#### File Corrupt atau Error Parsing
**Gejala**: Error "File tidak bisa dibaca" atau "Format tidak valid"
**Penyebab Umum**:
- File rusak atau corrupt
- Encoding karakter tidak sesuai
- Format CSV tidak standar

**Solusi**:
1. Buka file dengan Excel dan save ulang
2. Pastikan encoding UTF-8
3. Gunakan template yang disediakan
4. Periksa delimiter dan text qualifier

### Masalah Validasi Data

#### Banyak Error Validasi
**Gejala**: Banyak record dengan status error
**Penyebab Umum**:
- Data tidak sesuai format template
- Field wajib tidak diisi
- Tipe data salah

**Solusi**:
1. Download dan gunakan template terbaru
2. Periksa semua field wajib terisi
3. Pastikan format data sesuai (angka untuk harga/stok)
4. Hapus karakter khusus yang tidak perlu

#### Kode Barang Duplikat
**Gejala**: Error "Kode barang duplikat"
**Penyebab**: Ada kode yang sama dalam file

**Solusi**:
1. Gunakan fitur "Find & Replace" di Excel
2. Buat kode unik dengan pola tertentu (contoh: BRG001, BRG002)
3. Periksa data dengan filter/sort berdasarkan kode

### Masalah Performance

#### Upload Lambat
**Gejala**: Proses upload atau import sangat lambat
**Penyebab Umum**:
- File terlalu besar
- Koneksi internet lambat
- Browser kehabisan memory

**Solusi**:
1. Bagi file besar menjadi beberapa file kecil
2. Tutup tab browser lain
3. Gunakan koneksi internet yang stabil
4. Refresh browser jika perlu

#### Browser Hang atau Crash
**Gejala**: Browser tidak responsif saat import
**Penyebab**: File terlalu besar atau memory habis

**Solusi**:
1. Tutup aplikasi lain
2. Gunakan file dengan maksimal 1000 record
3. Restart browser
4. Gunakan komputer dengan RAM yang cukup

### Masalah Kategori & Satuan

#### Kategori Tidak Muncul
**Gejala**: Kategori baru tidak muncul di dropdown
**Penyebab**: Kategori belum di-approve atau error saat pembuatan

**Solusi**:
1. Refresh halaman
2. Periksa di menu Master Kategori
3. Buat kategori manual jika perlu
4. Hubungi administrator

## FAQ

### Q: Apakah bisa upload file Excel dengan multiple sheet?
**A**: Tidak, sistem hanya membaca sheet pertama. Pastikan data ada di sheet pertama.

### Q: Bagaimana jika ada data yang sama dengan yang sudah ada di sistem?
**A**: Sistem akan menampilkan warning dan menawarkan opsi untuk update data yang sudah ada.

### Q: Apakah bisa rollback jika ada kesalahan setelah import?
**A**: Ya, sistem menyimpan audit log lengkap. Hubungi administrator untuk rollback.

### Q: Berapa maksimal record yang bisa diupload sekaligus?
**A**: Tidak ada batas record, tapi file maksimal 5MB. Disarankan maksimal 1000 record per file.

### Q: Apakah bisa upload data dengan kategori yang belum ada?
**A**: Ya, sistem akan otomatis membuat kategori baru setelah konfirmasi dari user.

### Q: Format tanggal seperti apa yang didukung?
**A**: Sistem otomatis menggunakan tanggal upload. Tidak perlu input tanggal manual.

### Q: Bagaimana cara mengetahui riwayat upload?
**A**: Buka menu "Audit Log" atau "Riwayat Upload" untuk melihat semua aktivitas upload.

### Q: Apakah data yang diupload langsung masuk ke sistem?
**A**: Ya, setelah proses import selesai, data langsung tersedia di sistem.

### Q: Bagaimana jika koneksi terputus saat upload?
**A**: Sistem akan mencoba recovery otomatis. Jika gagal, ulangi proses upload.

### Q: Apakah bisa edit data setelah upload?
**A**: Ya, data bisa diedit melalui menu Master Barang seperti biasa.

---

## Kontak Support

Jika mengalami masalah yang tidak tercakup dalam panduan ini:

📧 **Email**: support@koperasi.com  
📞 **Telepon**: (021) 1234-5678  
💬 **WhatsApp**: +62 812-3456-7890  
🕒 **Jam Kerja**: Senin-Jumat, 08:00-17:00 WIB

---

*Panduan ini dibuat untuk membantu pengguna menggunakan fitur Upload Master Barang Excel dengan optimal. Selalu gunakan template terbaru dan ikuti panduan validasi untuk hasil terbaik.*