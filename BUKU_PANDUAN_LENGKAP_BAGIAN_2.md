# BUKU PANDUAN LENGKAP APLIKASI KOPERASI - BAGIAN 2

## Lanjutan dari BUKU_PANDUAN_LENGKAP_APLIKASI_KOPERASI.md

---

# BAGIAN IV: MODUL KEUANGAN

## 14. Chart of Accounts (COA)

### 14.1 Pengenalan
Chart of Accounts (COA) atau Bagan Akun adalah daftar sistematis dari semua akun yang digunakan dalam pencatatan transaksi keuangan koperasi.

### 14.2 Tipe Akun
1. **Aset (1-xxxx)**: Harta koperasi (Kas, Bank, Piutang, Persediaan)
2. **Kewajiban (2-xxxx)**: Hutang koperasi (Hutang, Simpanan Anggota)
3. **Modal (3-xxxx)**: Modal koperasi (Modal Awal, SHU)
4. **Pendapatan (4-xxxx)**: Penghasilan koperasi (Penjualan, Bunga)
5. **Beban (5-xxxx)**: Pengeluaran koperasi (Gaji, Listrik, dll)

### 14.3 Akses Menu
**Hak Akses**: Super Admin, Administrator, Admin Keuangan

**Cara Akses**:
1. Login dengan akun yang memiliki akses
2. Klik menu **"Chart of Accounts"** di sidebar

### 14.4 COA Default
Aplikasi sudah dilengkapi dengan COA default:

**Aset:**
- 1-1000: Kas
- 1-1100: Bank
- 1-2000: Piutang Pinjaman
- 1-3000: Persediaan Barang

**Kewajiban:**
- 2-1000: Simpanan Pokok
- 2-2000: Simpanan Wajib
- 2-3000: Simpanan Sukarela
- 2-4000: Hutang Usaha

**Modal:**
- 3-1000: Modal Awal
- 3-2000: SHU Tahun Berjalan

**Pendapatan:**
- 4-1000: Pendapatan Penjualan
- 4-2000: Pendapatan Bunga Pinjaman

**Beban:**
- 5-1000: Beban Pokok Penjualan
- 5-2000: Beban Operasional
- 5-3000: Beban Gaji

### 14.5 Tambah Akun Baru

**Langkah-langkah:**
1. Klik tombol **"Tambah Akun"**
2. Isi form:
   - **Kode Akun** (format: X-XXXX, contoh: 5-4000)
   - **Nama Akun** (contoh: Beban Listrik)
   - **Tipe Akun** (pilih dari dropdown)
   - **Saldo Awal** (default 0)
3. Klik **"Simpan"**

**Aturan Kode Akun:**
- Digit pertama = Tipe akun (1-5)
- Format: X-XXXX
- Harus unik
- Contoh: 5-4000 (Beban - kode 4000)

**Validasi:**
- Kode harus unik
- Kode harus sesuai format
- Digit pertama harus sesuai tipe akun

### 14.6 Edit Akun

**Langkah-langkah:**
1. Klik tombol **"Edit"** pada baris akun
2. Ubah nama akun (kode tidak bisa diubah)
3. Klik **"Simpan"**

**Catatan:**
- Kode akun tidak bisa diubah setelah ada transaksi
- Tipe akun tidak bisa diubah
- Hanya nama yang bisa diubah

### 14.7 Hapus Akun

**Langkah-langkah:**
1. Klik tombol **"Hapus"** pada baris akun
2. Konfirmasi penghapusan
3. Akun akan dihapus

**Peringatan:**
- ⚠️ Akun yang sudah memiliki transaksi **TIDAK BISA DIHAPUS**
- ⚠️ Akun default sistem tidak bisa dihapus
- ⚠️ Hapus jurnal terkait terlebih dahulu

### 14.8 Lihat Saldo Akun

**Informasi yang Ditampilkan:**
- Kode akun
- Nama akun
- Tipe akun
- Saldo (Debit/Kredit)
- Saldo update otomatis dari jurnal

**Filter:**
- Filter by tipe akun
- Search by kode atau nama

---

## 15. Jurnal Keuangan

### 15.1 Pengenalan
Jurnal Keuangan mencatat semua transaksi keuangan koperasi. Setiap transaksi dicatat dengan sistem double-entry (debit-kredit).

### 15.2 Jenis Jurnal
1. **Jurnal Manual**: Input manual oleh user
2. **Jurnal Otomatis**: Generate otomatis dari transaksi (simpanan, pinjaman, POS, dll)

### 15.3 Akses Menu
**Hak Akses**: Super Admin, Administrator, Admin Keuangan

**Cara Akses**:
1. Login dengan akun yang memiliki akses
2. Klik menu **"Jurnal Keuangan"** di sidebar

### 15.4 Input Jurnal Manual

**Langkah-langkah:**
1. Klik tombol **"Tambah Jurnal"**
2. Isi informasi jurnal:
   - **Tanggal** (default hari ini)
   - **Keterangan** (deskripsi transaksi)
3. Tambah entries (minimal 2):
   - **Akun** (pilih dari dropdown COA)
   - **Debit** (isi jika debit, kosongkan jika kredit)
   - **Kredit** (isi jika kredit, kosongkan jika debit)
4. Klik **"Tambah Entry"** untuk menambah baris
5. Pastikan **Total Debit = Total Kredit** (balance)
6. Klik **"Simpan Jurnal"**

**Contoh Jurnal:**
```
Tanggal: 15 Januari 2024
Keterangan: Pembelian perlengkapan kantor

Entry 1:
- Akun: 5-2000 (Beban Operasional)
- Debit: Rp 500.000
- Kredit: -

Entry 2:
- Akun: 1-1000 (Kas)
- Debit: -
- Kredit: Rp 500.000

Total Debit: Rp 500.000
Total Kredit: Rp 500.000
✅ Balance
```

**Validasi:**
- Minimal 2 entries
- Total debit harus = total kredit
- Setiap entry harus memiliki akun
- Setiap entry harus memiliki nilai (debit atau kredit)

### 15.5 Jurnal Otomatis

Jurnal otomatis dibuat saat:

**Simpanan Pokok (Setoran):**
```
Debit: Kas (1-1000)
Kredit: Simpanan Pokok (2-1000)
```

**Simpanan Wajib (Setoran):**
```
Debit: Kas (1-1000)
Kredit: Simpanan Wajib (2-2000)
```

**Simpanan Sukarela (Setoran):**
```
Debit: Kas (1-1000)
Kredit: Simpanan Sukarela (2-3000)
```

**Simpanan Sukarela (Penarikan):**
```
Debit: Simpanan Sukarela (2-3000)
Kredit: Kas (1-1000)
```

**Pinjaman (Pencairan):**
```
Debit: Piutang Pinjaman (1-2000) - Total Bayar
Kredit: Kas (1-1000) - Jumlah Pinjaman
Kredit: Pendapatan Bunga (4-2000) - Total Bunga
```

**Pinjaman (Pembayaran):**
```
Debit: Kas (1-1000)
Kredit: Piutang Pinjaman (1-2000)
```

**POS (Penjualan Cash):**
```
Debit: Kas (1-1000) - Harga Jual
Kredit: Pendapatan Penjualan (4-1000) - Harga Jual

Debit: Beban Pokok Penjualan (5-1000) - HPP
Kredit: Persediaan Barang (1-3000) - HPP
```

**POS (Penjualan Bon/Kredit):**
```
Debit: Piutang Dagang (1-2100) - Harga Jual
Kredit: Pendapatan Penjualan (4-1000) - Harga Jual

Debit: Beban Pokok Penjualan (5-1000) - HPP
Kredit: Persediaan Barang (1-3000) - HPP
```

**Pembelian Barang:**
```
Debit: Persediaan Barang (1-3000)
Kredit: Kas (1-1000)
```

### 15.6 Lihat Jurnal

**Informasi yang Ditampilkan:**
- Tanggal
- Keterangan
- Akun (Debit)
- Jumlah Debit
- Akun (Kredit)
- Jumlah Kredit
- Sumber (Manual/Otomatis)

**Filter:**
- Filter by tanggal (dari - sampai)
- Filter by akun
- Filter by sumber (Manual/Otomatis/Semua)
- Search by keterangan

### 15.7 Hapus Jurnal

**Hak Akses**: Super Admin, Administrator

**Langkah-langkah:**
1. Klik tombol **"Hapus"** pada baris jurnal
2. Konfirmasi penghapusan
3. Jurnal akan dihapus
4. Saldo COA akan di-update otomatis

**Peringatan:**
- ⚠️ Hati-hati saat menghapus jurnal otomatis
- ⚠️ Hapus jurnal akan mempengaruhi saldo akun
- ⚠️ Untuk jurnal otomatis, lebih baik hapus transaksi sumbernya

**Filter Hapus Jurnal:**
- Filter by tanggal
- Filter by sumber
- Hapus multiple jurnal sekaligus (dengan checkbox)

---

## 16. Saldo Awal Periode

### 16.1 Pengenalan
Saldo Awal Periode digunakan untuk input saldo awal akun saat memulai periode akuntansi baru atau saat migrasi dari sistem lain.

### 16.2 Akses Menu
**Hak Akses**: Super Admin, Administrator, Admin Keuangan

**Cara Akses**:
1. Login dengan akun yang memiliki akses
2. Klik menu **"Saldo Awal Periode"** di sidebar

### 16.3 Input Saldo Awal Manual

**Langkah-langkah:**
1. Klik tombol **"Input Saldo Awal"**
2. Pilih **Periode** (Bulan/Tahun)
3. Tambah entries:
   - **Akun** (pilih dari dropdown COA)
   - **Debit** (untuk akun Aset dan Beban)
   - **Kredit** (untuk akun Kewajiban, Modal, dan Pendapatan)
4. Klik **"Tambah Entry"** untuk menambah baris
5. Pastikan **Total Debit = Total Kredit** (balance)
6. Klik **"Simpan Saldo Awal"**

**Aturan Saldo Normal:**
- **Aset**: Saldo normal Debit
- **Beban**: Saldo normal Debit
- **Kewajiban**: Saldo normal Kredit
- **Modal**: Saldo normal Kredit
- **Pendapatan**: Saldo normal Kredit

**Contoh:**
```
Periode: Januari 2024

Entry 1: Kas (1-1000) - Debit: Rp 10.000.000
Entry 2: Bank (1-1100) - Debit: Rp 50.000.000
Entry 3: Persediaan (1-3000) - Debit: Rp 20.000.000
Entry 4: Modal Awal (3-1000) - Kredit: Rp 80.000.000

Total Debit: Rp 80.000.000
Total Kredit: Rp 80.000.000
✅ Balance
```

### 16.4 Upload Saldo Awal Massal

**Langkah-langkah:**
1. Klik tombol **"Upload Saldo Awal"**
2. Download template CSV
3. Isi data:
   - Kode Akun
   - Nama Akun
   - Debit
   - Kredit
4. Upload file
5. Preview data
6. Klik **"Import"**

**Format Template:**
```csv
Kode Akun,Nama Akun,Debit,Kredit
1-1000,Kas,10000000,0
1-1100,Bank,50000000,0
1-3000,Persediaan Barang,20000000,0
3-1000,Modal Awal,0,80000000
```

**Validasi:**
- Total debit harus = total kredit
- Kode akun harus ada di COA
- Nilai harus berupa angka

### 16.5 Edit Saldo Awal

**Langkah-langkah:**
1. Pilih periode yang ingin diedit
2. Klik tombol **"Edit"**
3. Ubah nilai yang diperlukan
4. Pastikan tetap balance
5. Klik **"Simpan"**

**Catatan:**
- Hanya bisa edit saldo awal periode yang belum ditutup
- Perubahan akan mempengaruhi laporan

### 16.6 Hapus Saldo Awal

**Langkah-langkah:**
1. Pilih periode yang ingin dihapus
2. Klik tombol **"Hapus"**
3. Konfirmasi penghapusan
4. Saldo awal akan dihapus

**Peringatan:**
- ⚠️ Hanya Super Admin yang bisa hapus saldo awal
- ⚠️ Hapus saldo awal akan mempengaruhi laporan keuangan

---

## 17. Laporan Keuangan

### 17.1 Pengenalan
Modul Laporan Keuangan menyediakan berbagai laporan untuk analisis keuangan koperasi.

### 17.2 Akses Menu
**Hak Akses**: Super Admin, Administrator, Admin Keuangan

### 17.3 Laporan Laba Rugi

**Pengenalan:**
Laporan Laba Rugi menampilkan pendapatan dan beban koperasi dalam periode tertentu.

**Cara Akses:**
1. Klik menu **"Laporan Laba Rugi"**
2. Pilih periode (dari tanggal - sampai tanggal)
3. Klik **"Tampilkan"**

**Isi Laporan:**
```
LAPORAN LABA RUGI
Periode: 1 Januari 2024 - 31 Januari 2024

PENDAPATAN:
- Pendapatan Penjualan: Rp XXX
- Pendapatan Bunga: Rp XXX
Total Pendapatan: Rp XXX

BEBAN:
- Beban Pokok Penjualan: Rp XXX
- Beban Operasional: Rp XXX
- Beban Gaji: Rp XXX
Total Beban: Rp XXX

LABA KOTOR: Rp XXX
LABA BERSIH: Rp XXX
```

**Export:**
- Export ke CSV
- Export ke PDF (jika ada)
- Print laporan

### 17.4 Laporan Buku Besar

**Pengenalan:**
Laporan Buku Besar menampilkan semua transaksi per akun dalam periode tertentu.

**Cara Akses:**
1. Klik menu **"Laporan Buku Besar"**
2. Pilih akun (dari dropdown COA)
3. Pilih periode (dari tanggal - sampai tanggal)
4. Klik **"Tampilkan"**

**Isi Laporan:**
```
BUKU BESAR
Akun: 1-1000 - Kas
Periode: 1 Januari 2024 - 31 Januari 2024

Saldo Awal: Rp XXX

Tanggal | Keterangan | Debit | Kredit | Saldo
--------|------------|-------|--------|-------
01/01   | Saldo Awal | -     | -      | XXX
05/01   | Setoran... | XXX   | -      | XXX
10/01   | Pembayaran | -     | XXX    | XXX
...

Saldo Akhir: Rp XXX
```

**Export:**
- Export ke CSV
- Print laporan

### 17.5 Laporan Kas Besar

**Pengenalan:**
Laporan Kas Besar menampilkan semua transaksi kas masuk dan kas keluar.

**Cara Akses:**
1. Klik menu **"Laporan Kas Besar"**
2. Pilih periode (dari tanggal - sampai tanggal)
3. Klik **"Tampilkan"**

**Isi Laporan:**
```
LAPORAN KAS BESAR
Periode: 1 Januari 2024 - 31 Januari 2024

Saldo Awal Kas: Rp XXX

KAS MASUK:
- Penjualan Cash: Rp XXX
- Setoran Simpanan: Rp XXX
- Pembayaran Pinjaman: Rp XXX
Total Kas Masuk: Rp XXX

KAS KELUAR:
- Pembelian Barang: Rp XXX
- Pencairan Pinjaman: Rp XXX
- Penarikan Simpanan: Rp XXX
- Beban Operasional: Rp XXX
Total Kas Keluar: Rp XXX

Saldo Akhir Kas: Rp XXX
```

**Export:**
- Export ke CSV
- Print laporan

---

