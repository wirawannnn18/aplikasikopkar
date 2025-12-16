# Panduan Fitur Import/Export Master Barang

## Overview
Fitur Import/Export Master Barang telah ditambahkan untuk mempermudah pencatatan dan pengelolaan data barang dalam sistem koperasi. Fitur ini memungkinkan pengguna untuk:

1. **Download Template** - Mengunduh template Excel/CSV untuk import data
2. **Import Data** - Mengimpor data barang dari file Excel/CSV
3. **Export Data** - Mengekspor data barang ke berbagai format

## Fitur yang Ditambahkan

### 1. Download Template
**Lokasi**: Tombol dropdown "Template" di bagian kanan atas halaman Master Barang

**Fungsi**:
- Download template Excel (.xlsx) dengan format dan contoh data
- Download template CSV (.csv) yang kompatibel dengan Excel
- Template sudah berisi header kolom dan 3 baris contoh data

**Format Template**:
| Kolom | Wajib | Keterangan |
|-------|-------|------------|
| Kode Barang | Ya | Kode unik untuk identifikasi barang |
| Nama Barang | Ya | Nama lengkap barang |
| Kategori | Ya | Kategori barang (akan dibuat otomatis jika belum ada) |
| Satuan | Ya | Satuan barang (PCS, KG, DUS, dll) |
| Harga Beli | Tidak | Harga beli barang (angka) |
| Harga Jual | Tidak | Harga jual barang (angka) |
| Stok | Tidak | Jumlah stok saat ini (angka) |
| Stok Minimum | Tidak | Batas minimum stok (angka) |
| Deskripsi | Tidak | Deskripsi tambahan barang |

### 2. Import Data
**Lokasi**: Tombol "Import Data" di bagian kanan atas halaman Master Barang

**Fungsi**:
- Upload file Excel (.xlsx, .xls) atau CSV (.csv)
- Preview data sebelum import
- Validasi data otomatis
- Mapping kolom yang fleksibel
- Pembuatan kategori dan satuan baru secara otomatis
- Progress tracking selama import
- Audit log untuk semua aktivitas import

**Proses Import**:
1. **Upload File**: Pilih file Excel/CSV yang akan diimport
2. **Preview & Mapping**: Lihat preview data dan mapping kolom
3. **Validasi**: Sistem akan memvalidasi data dan menampilkan error/warning
4. **Konfirmasi**: Konfirmasi pembuatan kategori/satuan baru jika diperlukan
5. **Import**: Proses import dengan progress bar
6. **Hasil**: Laporan hasil import (berhasil, gagal, dilewati)

**Validasi Data**:
- Kode barang harus unik
- Field wajib tidak boleh kosong
- Format angka untuk harga dan stok
- Deteksi kategori dan satuan baru

### 3. Export Data
**Lokasi**: Tombol "Export Data" di bagian kanan atas halaman Master Barang

**Fungsi**:
- Export ke format Excel (.xlsx), CSV (.csv), atau JSON (.json)
- Filter data yang akan diekspor
- Pilihan kolom yang akan disertakan
- Preview jumlah data sebelum export
- Nama file otomatis dengan timestamp

**Opsi Export**:
- **Format**: Excel, CSV, atau JSON
- **Filter**: Berdasarkan kategori, satuan, status, stok rendah
- **Kolom**: Pilih kolom yang akan disertakan dalam export
- **Header**: Opsi untuk menyertakan header kolom

### 4. Menu Import/Export Section
**Lokasi**: Tab "Import/Export" di navigasi utama

**Fungsi**:
- Interface terpadu untuk semua operasi import/export
- Download template langsung dari halaman ini
- Upload dan preview file import
- Konfigurasi export dengan filter lengkap
- Progress tracking untuk operasi yang sedang berjalan

## Cara Penggunaan

### Menggunakan Template
1. Klik dropdown "Template" di halaman Master Barang
2. Pilih "Template Excel" atau "Template CSV"
3. File template akan otomatis terdownload
4. Buka file template dan isi data sesuai format
5. Simpan file setelah selesai mengisi data

### Melakukan Import
1. Klik tombol "Import Data" atau buka tab "Import/Export"
2. Klik "Upload File" dan pilih file yang sudah diisi
3. Sistem akan menampilkan preview data
4. Periksa mapping kolom dan sesuaikan jika diperlukan
5. Klik "Next" untuk validasi data
6. Periksa hasil validasi dan konfirmasi jika ada kategori/satuan baru
7. Klik "Start Import" untuk memulai proses import
8. Tunggu hingga proses selesai dan periksa hasilnya

### Melakukan Export
1. Klik tombol "Export Data" atau buka tab "Import/Export"
2. Pilih format export (Excel, CSV, atau JSON)
3. Atur filter data jika diperlukan
4. Pilih kolom yang akan disertakan
5. Klik "Export Data" untuk memulai download
6. File akan otomatis terdownload dengan nama yang berisi timestamp

## Fitur Keamanan dan Validasi

### Validasi Import
- **Kode Unik**: Sistem memastikan kode barang tidak duplikat
- **Field Wajib**: Validasi field yang harus diisi
- **Format Data**: Validasi format angka untuk harga dan stok
- **Kategori/Satuan**: Deteksi dan konfirmasi pembuatan data baru

### Audit Trail
- Semua aktivitas import/export dicatat dalam audit log
- Informasi yang dicatat: user, waktu, file, jumlah data, hasil operasi
- Dapat diakses melalui menu "Audit Log"

### Error Handling
- Pesan error yang jelas untuk setiap masalah
- Recovery mechanism untuk operasi yang gagal
- Rollback otomatis jika terjadi error kritis

## Troubleshooting

### Masalah Umum Import
1. **File tidak bisa dibaca**: Pastikan format file Excel/CSV dan ukuran < 10MB
2. **Error validasi**: Periksa format data sesuai template
3. **Kode duplikat**: Pastikan kode barang unik
4. **Kategori/Satuan baru**: Konfirmasi pembuatan data baru

### Masalah Umum Export
1. **Tidak ada data**: Pastikan ada data barang yang tersimpan
2. **Filter terlalu ketat**: Periksa pengaturan filter
3. **File tidak terdownload**: Periksa pengaturan browser untuk download

### Masalah Performa
1. **Import lambat**: Untuk file besar, proses import akan memakan waktu
2. **Browser hang**: Refresh halaman jika terjadi masalah
3. **Memory error**: Gunakan file yang lebih kecil (< 1000 baris)

## Catatan Teknis

### Kompatibilitas Browser
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Batasan File
- Ukuran maksimal: 10MB
- Format yang didukung: .xlsx, .xls, .csv
- Maksimal baris: 10,000 (untuk performa optimal)

### Penyimpanan Data
- Data disimpan di localStorage browser
- Backup otomatis setiap operasi import
- Audit log tersimpan terpisah

## Update dan Pengembangan

### Versi Saat Ini
- Import/Export dasar: ✅ Selesai
- Template download: ✅ Selesai
- Validasi data: ✅ Selesai
- Audit logging: ✅ Selesai

### Pengembangan Selanjutnya
- [ ] Import dari Google Sheets
- [ ] Export ke PDF
- [ ] Batch update data
- [ ] Import gambar produk
- [ ] Integrasi dengan barcode scanner

## Dukungan

Jika mengalami masalah atau membutuhkan bantuan:
1. Periksa panduan troubleshooting di atas
2. Gunakan fitur "Bantuan" di menu Master Barang
3. Hubungi administrator sistem
4. Laporkan bug melalui sistem ticketing

---

**Terakhir diperbarui**: Desember 2024  
**Versi**: 1.0.0  
**Penulis**: Sistem Koperasi Development Team