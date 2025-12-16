# Panduan Pengguna Master Barang Komprehensif

## Daftar Isi
1. [Pengenalan](#pengenalan)
2. [Memulai](#memulai)
3. [Mengelola Data Barang](#mengelola-data-barang)
4. [Kategori dan Satuan](#kategori-dan-satuan)
5. [Import/Export Data](#importexport-data)
6. [Operasi Bulk](#operasi-bulk)
7. [Audit dan Laporan](#audit-dan-laporan)
8. [Tips dan Trik](#tips-dan-trik)

## Pengenalan

Sistem Master Barang Komprehensif adalah solusi lengkap untuk mengelola data barang dalam sistem koperasi. Sistem ini menyediakan:

- ✅ Manajemen data barang lengkap
- ✅ Kategori dan satuan yang fleksibel
- ✅ Import/export data Excel/CSV
- ✅ Operasi bulk untuk efisiensi
- ✅ Audit trail lengkap
- ✅ Search dan filter canggih

## Memulai

### Akses Sistem
1. Buka menu **Master Data** → **Master Barang**
2. Sistem akan memuat data barang yang tersedia
3. Interface utama menampilkan tabel data barang

### Navigasi Interface
- **Toolbar Atas**: Tombol aksi utama (Tambah, Import, Export)
- **Search Bar**: Pencarian real-time
- **Filter Panel**: Filter berdasarkan kategori, satuan, status
- **Data Table**: Tabel data barang dengan pagination
- **Action Buttons**: Edit, Delete, View untuk setiap item

## Mengelola Data Barang

### Menambah Barang Baru
1. Klik tombol **"Tambah Barang"**
2. Isi form dengan data lengkap:
   - **Kode Barang**: Kode unik (otomatis generate jika kosong)
   - **Nama Barang**: Nama lengkap barang
   - **Kategori**: Pilih dari dropdown atau buat baru
   - **Satuan**: Pilih dari dropdown atau buat baru
   - **Harga Beli**: Harga pembelian
   - **Harga Jual**: Harga penjualan
   - **Stok**: Jumlah stok awal
   - **Stok Minimum**: Batas minimum stok
3. Klik **"Simpan"** untuk menyimpan

### Mengedit Barang
1. Klik tombol **"Edit"** pada baris barang
2. Ubah data yang diperlukan
3. Klik **"Simpan"** untuk menyimpan perubahan

### Menghapus Barang
1. Klik tombol **"Hapus"** pada baris barang
2. Konfirmasi penghapusan
3. Data akan dihapus dan dicatat dalam audit log

### Validasi Data
Sistem melakukan validasi otomatis:
- ✅ Kode barang harus unik
- ✅ Nama barang tidak boleh kosong
- ✅ Harga harus berupa angka positif
- ✅ Stok tidak boleh negatif

## Kategori dan Satuan

### Mengelola Kategori
1. Klik **"Kelola Kategori"**
2. Tambah kategori baru atau edit yang ada
3. Sistem akan memvalidasi:
   - Nama kategori harus unik
   - Tidak bisa hapus kategori yang digunakan

### Mengelola Satuan
1. Klik **"Kelola Satuan"**
2. Tambah satuan baru atau edit yang ada
3. Sistem akan memvalidasi:
   - Nama satuan harus unik
   - Tidak bisa hapus satuan yang digunakan

## Import/Export Data

### Import Data dari Excel/CSV
1. Klik tombol **"Import"**
2. Download template jika diperlukan
3. Upload file Excel/CSV
4. Preview data dan mapping kolom
5. Validasi data otomatis
6. Konfirmasi import

**Format File Import:**
```
Kode Barang | Nama Barang | Kategori | Satuan | Harga Beli | Harga Jual | Stok | Stok Min
MB001      | Beras 5kg   | Sembako  | Kg     | 50000      | 55000      | 100  | 10
```

### Export Data
1. Klik tombol **"Export"**
2. Pilih format (Excel/CSV)
3. Pilih data yang akan di-export:
   - Semua data
   - Data terfilter
   - Data terpilih
4. File akan didownload otomatis

## Operasi Bulk

### Bulk Delete
1. Pilih multiple barang dengan checkbox
2. Klik **"Hapus Terpilih"**
3. Konfirmasi penghapusan bulk
4. Progress akan ditampilkan

### Bulk Update
1. Pilih multiple barang
2. Klik **"Update Terpilih"**
3. Pilih field yang akan diupdate
4. Masukkan nilai baru
5. Preview perubahan
6. Konfirmasi update

## Audit dan Laporan

### Melihat Audit Log
1. Klik **"Audit Log"**
2. Filter berdasarkan:
   - Tanggal
   - Jenis operasi
   - User
   - Barang
3. Export audit log jika diperlukan

### Laporan
- **Laporan Stok**: Stok barang saat ini
- **Laporan Kategori**: Distribusi barang per kategori
- **Laporan Aktivitas**: Aktivitas user dalam periode tertentu

## Tips dan Trik

### Pencarian Efektif
- Gunakan kata kunci parsial: "beras" akan menemukan "Beras 5kg"
- Kombinasikan dengan filter untuk hasil lebih spesifik
- Gunakan kode barang untuk pencarian cepat

### Import Data Besar
- Bagi file besar menjadi beberapa batch
- Pastikan format konsisten
- Backup data sebelum import besar

### Maintenance Rutin
- Review stok minimum secara berkala
- Bersihkan kategori/satuan yang tidak terpakai
- Export backup data secara rutin

### Keyboard Shortcuts
- `Ctrl + N`: Tambah barang baru
- `Ctrl + F`: Focus ke search box
- `Ctrl + E`: Export data
- `Ctrl + I`: Import data

## Troubleshooting

### Masalah Umum
1. **Import gagal**: Periksa format file dan data
2. **Pencarian lambat**: Kurangi jumlah data yang ditampilkan
3. **Error validasi**: Periksa data sesuai aturan validasi

### Kontak Support
Jika mengalami masalah, hubungi tim IT dengan informasi:
- Screenshot error
- Langkah yang dilakukan
- Data yang digunakan
- Browser dan versi yang digunakan

---

*Panduan ini akan terus diperbarui sesuai dengan pengembangan sistem.*