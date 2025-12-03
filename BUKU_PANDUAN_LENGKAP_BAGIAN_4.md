# BUKU PANDUAN LENGKAP APLIKASI KOPERASI - BAGIAN 4

## Lanjutan dari BUKU_PANDUAN_LENGKAP_BAGIAN_3.md

---

# BAGIAN VI: MANAJEMEN INVENTORY

## 23. Master Barang

### 23.1 Pengenalan
Menu Master Barang digunakan untuk mengelola data barang yang dijual di POS, termasuk barcode, harga, dan stok.

### 23.2 Akses Menu
**Hak Akses**: Super Admin, Administrator

**Cara Akses**:
1. Login sebagai Super Admin atau Administrator
2. Klik menu **"Master Barang"** di sidebar

### 23.3 Tambah Barang

**Langkah-langkah:**
1. Klik tombol **"Tambah Barang"**
2. Isi form:
   - **Kode Barang** (wajib, unik, contoh: BRG001)
   - **Nama Barang** (wajib)
   - **Barcode** (opsional, untuk scan)
   - **Kategori** (pilih dari dropdown)
   - **Satuan** (pilih dari dropdown)
   - **HPP (Harga Pokok)** (wajib, dalam Rupiah)
   - **Harga Jual** (wajib, dalam Rupiah)
   - **Stok Awal** (default 0)
   - **Stok Minimum** (untuk alert stok menipis)
   - **Deskripsi** (opsional)
3. Klik **"Simpan"**

**Validasi:**
- Kode barang harus unik
- Harga jual harus >= HPP
- Stok harus >= 0

**Generate Barcode:**
- Jika tidak punya barcode, sistem bisa generate otomatis
- Klik tombol **"Generate Barcode"**
- Barcode akan dibuat berdasarkan kode barang

### 23.4 Edit Barang

**Langkah-langkah:**
1. Cari barang yang ingin diedit
2. Klik tombol **"Edit"** pada baris barang
3. Ubah data yang diperlukan
4. Klik **"Simpan"**

**Catatan:**
- Kode barang tidak bisa diubah setelah ada transaksi
- Hati-hati mengubah HPP, akan mempengaruhi perhitungan laba

### 23.5 Hapus Barang

**Langkah-langkah:**
1. Klik tombol **"Hapus"** pada baris barang
2. Konfirmasi penghapusan
3. Barang akan dihapus

**Peringatan:**
- ⚠️ Barang yang sudah memiliki transaksi **TIDAK BISA DIHAPUS**
- ⚠️ Hapus transaksi terkait terlebih dahulu

### 23.6 Import Barang Massal

**Langkah-langkah:**
1. Klik tombol **"Import Data"**
2. Download template CSV
3. Isi data barang
4. Upload file
5. Preview dan Import

**Format Template:**
```csv
Kode,Nama,Barcode,Kategori,Satuan,HPP,Harga Jual,Stok
BRG001,Sabun Mandi,8991234567890,Toiletries,Pcs,5000,7000,100
BRG002,Shampoo,8991234567891,Toiletries,Botol,15000,20000,50
```

### 23.7 Export Barang

**Langkah-langkah:**
1. Klik tombol **"Export Data"**
2. File CSV akan terdownload
3. Nama file: `data_barang_YYYY-MM-DD.csv`

### 23.8 Cetak Barcode

**Langkah-langkah:**
1. Klik tombol **"Cetak Barcode"** pada baris barang
2. Preview barcode akan muncul
3. Klik **"Print"** untuk mencetak
4. Tempel barcode di produk

**Isi Label Barcode:**
- Barcode (scannable)
- Nama barang
- Harga jual
- Kode barang

---

## 24. Kategori dan Satuan

### 24.1 Kategori Barang

**Pengenalan:**
Kategori digunakan untuk mengelompokkan barang sejenis.

**Tambah Kategori:**
1. Klik menu **"Kategori Barang"**
2. Klik tombol **"Tambah Kategori"**
3. Isi:
   - **Kode Kategori** (contoh: FOOD, DRINK, TOILETRIES)
   - **Nama Kategori** (contoh: Makanan, Minuman, Toiletries)
   - **Deskripsi** (opsional)
4. Klik **"Simpan"**

**Edit/Hapus Kategori:**
- Edit: Klik tombol "Edit", ubah data, simpan
- Hapus: Klik tombol "Hapus", konfirmasi
- Kategori yang sudah digunakan tidak bisa dihapus

### 24.2 Satuan Barang

**Pengenalan:**
Satuan adalah unit pengukuran barang (Pcs, Box, Kg, Liter, dll).

**Tambah Satuan:**
1. Klik menu **"Satuan Barang"**
2. Klik tombol **"Tambah Satuan"**
3. Isi:
   - **Kode Satuan** (contoh: PCS, BOX, KG)
   - **Nama Satuan** (contoh: Pieces, Box, Kilogram)
4. Klik **"Simpan"**

**Edit/Hapus Satuan:**
- Edit: Klik tombol "Edit", ubah data, simpan
- Hapus: Klik tombol "Hapus", konfirmasi
- Satuan yang sudah digunakan tidak bisa dihapus

---

## 25. Supplier

### 25.1 Pengenalan
Menu Supplier digunakan untuk mengelola data pemasok barang.

### 25.2 Akses Menu
**Hak Akses**: Super Admin, Administrator

**Cara Akses**:
1. Login sebagai Super Admin atau Administrator
2. Klik menu **"Supplier"** di sidebar

### 25.3 Tambah Supplier

**Langkah-langkah:**
1. Klik tombol **"Tambah Supplier"**
2. Isi form:
   - **Kode Supplier** (wajib, unik, contoh: SUP001)
   - **Nama Supplier** (wajib)
   - **Telepon** (wajib)
   - **Email** (opsional)
   - **Alamat** (wajib)
   - **Kontak Person** (opsional)
3. Klik **"Simpan"**

### 25.4 Edit/Hapus Supplier

**Edit:**
1. Klik tombol **"Edit"** pada baris supplier
2. Ubah data yang diperlukan
3. Klik **"Simpan"**

**Hapus:**
1. Klik tombol **"Hapus"** pada baris supplier
2. Konfirmasi penghapusan
3. Supplier akan dihapus

**Peringatan:**
- Supplier yang sudah memiliki transaksi pembelian tidak bisa dihapus

---

## 26. Pembelian Barang

### 26.1 Pengenalan
Menu Pembelian digunakan untuk mencatat pembelian barang dari supplier.

### 26.2 Akses Menu
**Hak Akses**: Super Admin, Administrator

**Cara Akses**:
1. Login sebagai Super Admin atau Administrator
2. Klik menu **"Pembelian"** di sidebar

### 26.3 Tambah Pembelian

**Langkah-langkah:**
1. Klik tombol **"Tambah Pembelian"**
2. Isi informasi pembelian:
   - **Supplier** (pilih dari dropdown)
   - **Tanggal Pembelian** (default hari ini)
   - **No. Faktur** (dari supplier)
3. Tambah item pembelian:
   - **Barang** (pilih dari dropdown atau scan barcode)
   - **Quantity** (jumlah yang dibeli)
   - **Harga Beli** (per unit)
   - Subtotal akan dihitung otomatis
4. Klik **"Tambah Item"** untuk menambah barang lain
5. Total akan dihitung otomatis
6. Klik **"Simpan Pembelian"**

**Efek Pembelian:**
- Stok barang akan bertambah otomatis
- HPP akan di-update (average method)
- Jurnal akan dibuat otomatis

**Jurnal Otomatis:**
```
Debit: Persediaan Barang (1-3000) - Rp Total
Kredit: Kas (1-1000) - Rp Total
Keterangan: Pembelian dari [Nama Supplier] - Faktur [No]
```

### 26.4 Edit Pembelian

**Langkah-langkah:**
1. Cari pembelian yang ingin diedit
2. Klik tombol **"Edit"** pada baris pembelian
3. Ubah data yang diperlukan:
   - Bisa tambah/hapus item
   - Bisa ubah quantity
   - Bisa ubah harga beli
4. Klik **"Simpan"**

**Catatan:**
- Edit pembelian akan mengupdate stok dan HPP
- Jurnal lama akan dihapus dan dibuat jurnal baru

### 26.5 Hapus Pembelian

**Hak Akses**: Super Admin, Administrator

**Langkah-langkah:**
1. Klik tombol **"Hapus"** pada baris pembelian
2. Konfirmasi penghapusan
3. Pembelian akan dihapus

**Efek Hapus:**
- Stok barang akan dikurangi
- HPP akan di-recalculate
- Jurnal akan dihapus

**Peringatan:**
- ⚠️ Hati-hati saat menghapus pembelian
- ⚠️ Pastikan barang belum terjual
- ⚠️ Jika barang sudah terjual, stok bisa minus

### 26.6 Lihat Detail Pembelian

**Langkah-langkah:**
1. Klik tombol **"Detail"** pada baris pembelian
2. Akan muncul informasi lengkap:
   - Data pembelian (supplier, tanggal, no. faktur)
   - Daftar item yang dibeli
   - Quantity, harga, subtotal
   - Total pembelian

### 26.7 Cetak Faktur Pembelian

**Langkah-langkah:**
1. Klik tombol **"Cetak"** pada baris pembelian
2. Preview faktur akan muncul
3. Klik **"Print"** untuk mencetak

---

## 27. Stok Opname

### 27.1 Pengenalan
Stok Opname adalah proses penghitungan fisik stok barang untuk mencocokkan dengan stok di sistem.

### 27.2 Akses Menu
**Hak Akses**: Super Admin, Administrator

**Cara Akses**:
1. Login sebagai Super Admin atau Administrator
2. Klik menu **"Stok Opname"** di sidebar

### 27.3 Proses Stok Opname

**Langkah-langkah:**
1. Klik tombol **"Mulai Stok Opname"**
2. Pilih **Tanggal Opname** (default hari ini)
3. Untuk setiap barang:
   - Sistem menampilkan **Stok Sistem** (stok di database)
   - Hitung fisik barang di gudang
   - Input **Stok Fisik** (hasil hitungan)
   - Sistem akan hitung **Selisih** otomatis
4. Tambahkan **Keterangan** jika ada selisih
5. Klik **"Simpan Opname"**

**Selisih:**
- **Positif** (+): Stok fisik > Stok sistem (ada kelebihan)
- **Negatif** (-): Stok fisik < Stok sistem (ada kekurangan)
- **Nol** (0): Stok fisik = Stok sistem (cocok)

**Efek Stok Opname:**
- Stok sistem akan diupdate sesuai stok fisik
- Selisih akan dicatat
- Jurnal penyesuaian akan dibuat (jika ada selisih)

**Jurnal Penyesuaian (Jika Ada Selisih):**

Jika Stok Lebih:
```
Debit: Persediaan Barang (1-3000) - Rp Selisih
Kredit: Pendapatan Lain-lain (4-3000) - Rp Selisih
```

Jika Stok Kurang:
```
Debit: Beban Operasional (5-2000) - Rp Selisih
Kredit: Persediaan Barang (1-3000) - Rp Selisih
```

### 27.4 Riwayat Stok Opname

**Cara Akses:**
1. Klik tab **"Riwayat Opname"**
2. Akan muncul daftar semua stok opname yang pernah dilakukan

**Informasi:**
- Tanggal opname
- Total barang yang diopname
- Total selisih (nilai)
- Petugas yang melakukan

**Aksi:**
- **Detail**: Lihat detail per barang
- **Print**: Cetak laporan opname

---

# BAGIAN VII: LAPORAN

## 28. Laporan Simpanan

### 28.1 Laporan Simpanan Pokok

**Cara Akses:**
1. Klik menu **"Laporan Simpanan Pokok"**
2. Pilih periode (opsional)
3. Klik **"Tampilkan"**

**Isi Laporan:**
- Daftar semua anggota
- Jumlah simpanan pokok per anggota
- Total simpanan pokok keseluruhan
- Tanggal setoran

**Export:**
- Export ke CSV
- Print laporan

### 28.2 Laporan Simpanan Wajib

**Cara Akses:**
1. Klik menu **"Laporan Simpanan Wajib"**
2. Pilih periode (Bulan/Tahun)
3. Klik **"Tampilkan"**

**Isi Laporan:**
- Daftar anggota
- Simpanan wajib per periode
- Total simpanan wajib per anggota
- Total keseluruhan

**Filter:**
- Filter by periode
- Filter by anggota
- Filter by status (Sudah bayar/Belum bayar)

### 28.3 Laporan Simpanan Sukarela

**Cara Akses:**
1. Klik menu **"Laporan Simpanan Sukarela"**
2. Pilih periode (dari - sampai)
3. Klik **"Tampilkan"**

**Isi Laporan:**
- Daftar anggota
- Saldo simpanan sukarela per anggota
- Riwayat setoran dan penarikan
- Total saldo keseluruhan

---

## 29. Laporan Pinjaman

### 29.1 Laporan Pinjaman Aktif

**Cara Akses:**
1. Klik menu **"Laporan Pinjaman"**
2. Pilih filter **"Aktif"**
3. Klik **"Tampilkan"**

**Isi Laporan:**
- Daftar pinjaman yang masih aktif
- Jumlah pinjaman
- Sudah dibayar
- Sisa pinjaman
- Angsuran per bulan

### 29.2 Laporan Pinjaman Lunas

**Cara Akses:**
1. Klik menu **"Laporan Pinjaman"**
2. Pilih filter **"Lunas"**
3. Klik **"Tampilkan"**

**Isi Laporan:**
- Daftar pinjaman yang sudah lunas
- Tanggal pinjaman
- Tanggal lunas
- Total yang dibayar

### 29.3 Laporan Angsuran

**Cara Akses:**
1. Klik menu **"Laporan Angsuran"**
2. Pilih periode (dari - sampai)
3. Klik **"Tampilkan"**

**Isi Laporan:**
- Daftar pembayaran angsuran dalam periode
- Anggota
- Jumlah bayar
- Tanggal bayar
- Total pembayaran

---

## 30. Laporan Penjualan

### 30.1 Laporan Penjualan Harian

**Cara Akses:**
1. Klik menu **"Laporan Penjualan"**
2. Pilih tanggal
3. Klik **"Tampilkan"**

**Isi Laporan:**
- Daftar transaksi per hari
- No. transaksi
- Waktu
- Kasir
- Anggota/Umum
- Total
- Metode (Cash/Bon)
- Grand total

### 30.2 Laporan Penjualan Periode

**Cara Akses:**
1. Klik menu **"Laporan Penjualan"**
2. Pilih periode (dari - sampai)
3. Klik **"Tampilkan"**

**Isi Laporan:**
- Total penjualan per hari
- Total penjualan cash
- Total penjualan bon
- Grand total
- Grafik penjualan (jika ada)

### 30.3 Laporan Penjualan per Barang

**Cara Akses:**
1. Klik menu **"Laporan Penjualan per Barang"**
2. Pilih periode
3. Klik **"Tampilkan"**

**Isi Laporan:**
- Nama barang
- Quantity terjual
- Total penjualan
- HPP
- Laba kotor
- Ranking barang terlaris

---

## 31. Laporan Stok

### 31.1 Laporan Stok Barang

**Cara Akses:**
1. Klik menu **"Laporan Stok"**
2. Klik **"Tampilkan"**

**Isi Laporan:**
- Kode barang
- Nama barang
- Kategori
- Stok tersedia
- HPP
- Nilai stok (Stok × HPP)
- Total nilai stok

**Alert:**
- Barang dengan stok < stok minimum akan ditandai merah

### 31.2 Laporan Mutasi Stok

**Cara Akses:**
1. Klik menu **"Laporan Mutasi Stok"**
2. Pilih barang
3. Pilih periode
4. Klik **"Tampilkan"**

**Isi Laporan:**
- Tanggal
- Keterangan (Pembelian/Penjualan/Opname)
- Masuk (quantity)
- Keluar (quantity)
- Saldo
- Saldo akhir

---

## 32. Perhitungan SHU

### 32.1 Pengenalan
SHU (Sisa Hasil Usaha) adalah laba bersih koperasi yang akan dibagikan kepada anggota.

### 32.2 Cara Akses
**Hak Akses**: Super Admin, Administrator, Admin Keuangan

**Cara Akses:**
1. Klik menu **"Perhitungan SHU"**
2. Pilih periode (Tahun)
3. Klik **"Hitung SHU"**

### 32.3 Perhitungan

**Rumus:**
```
Total Pendapatan
- Total Beban
= Laba Kotor

Laba Kotor
- Pajak (jika ada)
= SHU (Sisa Hasil Usaha)
```

**Pembagian SHU:**
Sesuai AD/ART koperasi, contoh:
- 40% untuk Cadangan
- 40% untuk Anggota (berdasarkan partisipasi)
- 20% untuk Pengurus dan Karyawan

### 32.4 Laporan SHU

**Isi Laporan:**
```
PERHITUNGAN SHU
Periode: Tahun 2024

PENDAPATAN:
- Pendapatan Penjualan: Rp XXX
- Pendapatan Bunga: Rp XXX
- Pendapatan Lain-lain: Rp XXX
Total Pendapatan: Rp XXX

BEBAN:
- Beban Pokok Penjualan: Rp XXX
- Beban Operasional: Rp XXX
- Beban Gaji: Rp XXX
Total Beban: Rp XXX

LABA KOTOR: Rp XXX
PAJAK: Rp XXX
SHU: Rp XXX

PEMBAGIAN SHU:
- Cadangan (40%): Rp XXX
- Anggota (40%): Rp XXX
- Pengurus (20%): Rp XXX
```

---

