# Panduan Import Master Barang

## Fitur Import Terintegrasi di Menu Master Barang

Fitur import data master barang kini terintegrasi langsung dengan menu Master Barang di sidebar. Anda dapat mengakses semua fitur import/export tanpa perlu membuka halaman terpisah.

## Cara Menggunakan Fitur Import

### 1. Akses Menu Master Barang
- Login ke sistem koperasi
- Pilih menu "Master Barang" dari sidebar
- Pada halaman Master Barang, Anda akan melihat tombol-tombol baru:
  - **Template** (dropdown): Download template Excel/CSV
  - **Import Data**: Upload dan import file data
  - **Export Data**: Export data yang sudah ada

### 2. Persiapan File Import

1. **Download Template**
   - Klik dropdown "Template" di halaman Master Barang
   - Pilih "Template Excel" atau "Template CSV" untuk mendapatkan format yang benar
   - Template berisi contoh data dan format kolom yang diperlukan

2. **Format File yang Didukung**
   - CSV (.csv) - Direkomendasikan dan fully supported
   - Excel (.xlsx, .xls) - Konversi ke CSV terlebih dahulu

### 3. Mengisi Data di Template

**Kolom Wajib:**
- `Barcode` - Kode barcode unik untuk setiap barang
- `Nama Barang` - Nama lengkap barang

**Kolom Opsional:**
- `Kategori` - Kategori barang (akan dibuat otomatis jika belum ada)
- `Satuan` - Satuan barang (akan dibuat otomatis jika belum ada)
- `Stok Awal` - Stok awal barang (default: 0)
- `HPP` - Harga Pokok Penjualan/Harga Beli (default: 0)
- `Harga Jual` - Harga jual barang (default: 0)

**Fitur Otomatis:**
- Sistem akan membuat kategori baru secara otomatis jika belum ada
- Sistem akan membuat satuan baru secara otomatis jika belum ada
- Mendukung variasi nama kolom (case-insensitive)

### 4. Proses Import

1. **Upload File**
   - Klik tombol "Import Data" di halaman Master Barang
   - Dialog import akan terbuka dengan panduan lengkap
   - Pilih file CSV yang sudah diisi
   - Klik "Proses Import"

2. **Validasi Data**
   - Sistem akan memvalidasi setiap baris data
   - Barcode harus unik (tidak boleh duplikat dengan data yang sudah ada)
   - Kolom wajib (Barcode dan Nama Barang) harus diisi

3. **Hasil Import**
   - Sistem akan menampilkan laporan hasil import
   - Jumlah data berhasil dan gagal
   - Detail error jika ada data yang gagal
   - Data akan langsung muncul di tabel Master Barang

### 5. Tips Import yang Sukses

✅ **DO:**
- Gunakan template yang disediakan dari dropdown "Template"
- Pastikan barcode unik
- Isi kolom wajib (Barcode dan Nama Barang)
- Gunakan format angka yang benar (tanpa titik atau koma)
- Simpan file dalam format CSV UTF-8

❌ **DON'T:**
- Jangan ubah nama kolom di header
- Jangan kosongkan barcode atau nama barang
- Jangan gunakan barcode yang sudah ada
- Jangan gunakan karakter khusus dalam barcode

### 6. Contoh Data yang Benar

```csv
Barcode,Nama Barang,Kategori,Satuan,Stok Awal,HPP,Harga Jual
BRG001,Beras Premium 5kg,Sembako,Karung,100,45000,50000
BRG002,Minyak Goreng 1L,Sembako,Botol,50,12000,14000
BRG003,Gula Pasir 1kg,Sembako,Kg,75,13000,15000
BRG004,Teh Celup 25pcs,Minuman,Dus,30,8000,10000
BRG005,Kopi Sachet 10pcs,Minuman,Dus,25,15000,18000
```

### 7. Troubleshooting

**Error: "Barcode sudah ada"**
- Pastikan barcode unik
- Cek apakah barcode sudah ada di sistem

**Error: "Barcode dan Nama barang wajib diisi"**
- Pastikan kolom Barcode dan Nama Barang tidak kosong

**Error: "Format file tidak didukung"**
- Gunakan file CSV
- Untuk file Excel, save as CSV terlebih dahulu
- Pastikan encoding UTF-8

### 8. Fitur Export Terintegrasi

Selain import, kini tersedia juga fitur export yang terintegrasi:

1. **Akses Export**
   - Klik tombol "Export Data" di halaman Master Barang
   - Pilih format export: Excel (.xlsx), CSV (.csv), atau JSON (.json)

2. **Kegunaan Export**
   - Backup data master barang
   - Template dengan data existing
   - Sharing data dengan sistem lain

### 9. Integrasi dengan Sistem

Fitur import/export ini terintegrasi penuh dengan:
- ✅ Sistem kategori dan satuan yang sudah ada
- ✅ Validasi data yang konsisten
- ✅ Interface yang familiar dengan menu Master Barang
- ✅ Kompatibilitas dengan fitur lain seperti POS dan Pembelian
- ✅ Auto-create kategori dan satuan baru
- ✅ Flexible column name recognition

### 10. Keunggulan Fitur Baru

- **Terintegrasi**: Tidak perlu buka halaman terpisah
- **User-friendly**: Interface yang familiar dan mudah digunakan
- **Flexible**: Mendukung variasi nama kolom
- **Auto-create**: Otomatis membuat kategori/satuan baru
- **Comprehensive**: Import dan export dalam satu tempat