# 📚 BUKU PANDUAN LENGKAP APLIKASI KOPERASI KARYAWAN

## Versi 1.0.0 - 2024

---

## 📑 DAFTAR ISI

### BAGIAN I: PENGENALAN
1. [Tentang Aplikasi](#1-tentang-aplikasi)
2. [Fitur Utama](#2-fitur-utama)
3. [Teknologi yang Digunakan](#3-teknologi-yang-digunakan)
4. [Persyaratan Sistem](#4-persyaratan-sistem)

### BAGIAN II: MEMULAI
5. [Instalasi dan Setup](#5-instalasi-dan-setup)
6. [Login Pertama Kali](#6-login-pertama-kali)
7. [Mengenal Interface](#7-mengenal-interface)
8. [Hak Akses Pengguna](#8-hak-akses-pengguna)

### BAGIAN III: MODUL KOPERASI
9. [Data Koperasi](#9-data-koperasi)
10. [Master Anggota](#10-master-anggota)
11. [Departemen](#11-departemen)
12. [Simpanan Anggota](#12-simpanan-anggota)
13. [Pinjaman Anggota](#13-pinjaman-anggota)

### BAGIAN IV: MODUL KEUANGAN
14. [Chart of Accounts (COA)](#14-chart-of-accounts-coa)
15. [Jurnal Keuangan](#15-jurnal-keuangan)
16. [Saldo Awal Periode](#16-saldo-awal-periode)
17. [Laporan Keuangan](#17-laporan-keuangan)

### BAGIAN V: POINT OF SALES (POS)
18. [Memulai Shift Kasir](#18-memulai-shift-kasir)
19. [Transaksi Penjualan](#19-transaksi-penjualan)
20. [Batas Kredit Anggota](#20-batas-kredit-anggota)
21. [Tutup Kasir](#21-tutup-kasir)
22. [Pengajuan Modal Kasir](#22-pengajuan-modal-kasir)

### BAGIAN VI: MANAJEMEN INVENTORY
23. [Master Barang](#23-master-barang)
24. [Kategori dan Satuan](#24-kategori-dan-satuan)
25. [Supplier](#25-supplier)
26. [Pembelian Barang](#26-pembelian-barang)
27. [Stok Opname](#27-stok-opname)

### BAGIAN VII: LAPORAN
28. [Laporan Simpanan](#28-laporan-simpanan)
29. [Laporan Pinjaman](#29-laporan-pinjaman)
30. [Laporan Penjualan](#30-laporan-penjualan)
31. [Laporan Stok](#31-laporan-stok)
32. [Perhitungan SHU](#32-perhitungan-shu)

### BAGIAN VIII: ADMINISTRASI SISTEM
33. [Manajemen User](#33-manajemen-user)
34. [Backup & Restore](#34-backup--restore)
35. [Pengaturan Sistem](#35-pengaturan-sistem)
36. [Notifikasi](#36-notifikasi)

### BAGIAN IX: PANDUAN KHUSUS
37. [Panduan untuk Administrator](#37-panduan-untuk-administrator)
38. [Panduan untuk Admin Keuangan](#38-panduan-untuk-admin-keuangan)
39. [Panduan untuk Kasir](#39-panduan-untuk-kasir)
40. [Panduan untuk Super Admin](#40-panduan-untuk-super-admin)

### BAGIAN X: TROUBLESHOOTING & FAQ
41. [Masalah Umum dan Solusi](#41-masalah-umum-dan-solusi)
42. [FAQ (Pertanyaan yang Sering Diajukan)](#42-faq-pertanyaan-yang-sering-diajukan)
43. [Tips dan Trik](#43-tips-dan-trik)
44. [Kontak Support](#44-kontak-support)

---


# BAGIAN I: PENGENALAN

## 1. Tentang Aplikasi

### 1.1 Pengenalan
**Aplikasi Koperasi Karyawan** adalah sistem manajemen koperasi terintegrasi yang dirancang khusus untuk memenuhi kebutuhan operasional koperasi karyawan. Aplikasi ini menggabungkan fungsi manajemen koperasi, Point of Sales (POS), dan sistem keuangan dalam satu platform yang mudah digunakan.

### 1.2 Tujuan Aplikasi
- ✅ Mempermudah pengelolaan data anggota dan transaksi koperasi
- ✅ Mengotomatisasi pencatatan keuangan dan jurnal akuntansi
- ✅ Menyediakan sistem POS yang terintegrasi dengan inventory
- ✅ Menghasilkan laporan keuangan yang akurat dan real-time
- ✅ Meningkatkan efisiensi operasional koperasi

### 1.3 Keunggulan
- 🚀 **Mudah Digunakan**: Interface yang intuitif dan user-friendly
- 💾 **Offline-Ready**: Dapat berjalan tanpa koneksi internet setelah dimuat
- 🔐 **Aman**: Sistem autentikasi dan hak akses berbasis role
- 📊 **Terintegrasi**: Semua modul terhubung dan saling update otomatis
- 📱 **Responsif**: Dapat diakses dari desktop, tablet, dan mobile
- 💰 **Gratis**: Tidak ada biaya lisensi atau subscription

---

## 2. Fitur Utama

### 2.1 Sistem Autentikasi & Manajemen User
- Login dengan username dan password
- 4 Level hak akses: Super Admin, Administrator, Admin Keuangan, Kasir
- Manajemen user (Tambah, Edit, Hapus, Aktif/Nonaktif)
- Password terenkripsi dan aman

### 2.2 Modul Koperasi
**Data Koperasi**
- Input data koperasi (nama, alamat, telepon, modal awal)
- Upload dan kelola logo koperasi
- Logo tampil di navbar dan struk pembayaran

**Master Anggota**
- Manajemen data anggota lengkap
- Import data massal dari CSV/Excel
- Export data anggota
- Kartu anggota dengan nomor unik
- Integrasi dengan departemen

**Simpanan Anggota**
- Simpanan Pokok: Setoran awal keanggotaan
- Simpanan Wajib: Setoran rutin bulanan
- Simpanan Sukarela: Setoran dan penarikan kapan saja
- Tracking saldo real-time per anggota
- Jurnal otomatis untuk setiap transaksi

**Pinjaman Anggota**
- Input pinjaman dengan perhitungan bunga otomatis
- Tracking angsuran dan sisa pinjaman
- Status pinjaman (Aktif/Lunas)
- Riwayat pembayaran lengkap
- Jurnal otomatis

### 2.3 Modul Keuangan
**Chart of Accounts (COA)**
- Manajemen akun keuangan lengkap
- 5 Tipe akun: Aset, Kewajiban, Modal, Pendapatan, Beban
- COA default koperasi sudah tersedia
- Update saldo otomatis

**Jurnal Keuangan**
- Input jurnal manual
- Jurnal otomatis dari transaksi
- Multiple entries (debit/kredit)
- Filter dan hapus jurnal
- Integrasi dengan COA

**Saldo Awal Periode**
- Input saldo awal untuk periode baru
- Upload saldo awal massal
- Validasi balance debit-kredit

**Laporan Keuangan**
- Laporan Laba Rugi
- Laporan Buku Besar per Akun
- Laporan Kas Besar
- Export ke CSV

### 2.4 Point of Sales (POS)
**Operasional Kasir**
- Buka kas dengan modal awal
- Scan barcode atau pencarian manual
- Keranjang belanja dengan edit quantity
- Transaksi cash dan bon (kredit)
- Cetak struk otomatis dengan logo
- Tutup kasir dengan rekonsiliasi

**Batas Kredit**
- Batas kredit Rp 2.000.000 per anggota
- Tracking outstanding balance real-time
- Indikator visual (hijau/kuning/merah)
- Validasi otomatis saat transaksi

**Pengajuan Modal**
- Kasir dapat mengajukan modal awal
- Admin approve/reject pengajuan
- Notifikasi real-time
- Tracking status pengajuan

### 2.5 Manajemen Inventory
**Master Barang**
- Input barang dengan barcode
- HPP dan harga jual
- Tracking stok real-time
- Kategori dan satuan barang

**Pembelian**
- Input pembelian dari supplier
- Scan barcode saat pembelian
- Update stok dan HPP otomatis
- Edit dan hapus pembelian
- Jurnal otomatis

**Stok Opname**
- Input stok fisik
- Perhitungan selisih otomatis
- Update stok sistem

### 2.6 Laporan Lengkap
- Laporan Simpanan Anggota
- Laporan Hutang Piutang
- Laporan Penjualan (Cash & Kredit)
- Laporan Stok Barang
- Perhitungan SHU (Sisa Hasil Usaha)
- Export semua laporan ke CSV

### 2.7 Administrasi Sistem
**Backup & Restore**
- Full backup semua data
- Partial backup per kategori
- Restore dengan validasi
- Auto backup sebelum restore

**Pengaturan Sistem**
- Konfigurasi aplikasi (Super Admin only)
- Informasi versi aplikasi
- Akses cepat ke fitur admin

**Notifikasi**
- Notifikasi pengajuan modal
- Badge counter unread
- Mark as read
- Notifikasi real-time

---

## 3. Teknologi yang Digunakan

### 3.1 Frontend
- **HTML5**: Struktur halaman modern
- **CSS3**: Styling dengan gradient dan animasi
- **Bootstrap 5**: Framework UI responsif
- **Bootstrap Icons**: Icon library lengkap
- **JavaScript (Vanilla)**: Logika aplikasi tanpa framework

### 3.2 Backend
- **Node.js**: Server runtime
- **Express.js**: Web server framework
- **LocalStorage**: Penyimpanan data di browser

### 3.3 Data Storage
- **LocalStorage**: Penyimpanan utama (client-side)
- **SessionStorage**: Data temporary per session
- **JSON**: Format data

### 3.4 Testing
- **Jest**: Unit testing framework
- **Manual Testing**: Test cases dan validation

---

## 4. Persyaratan Sistem

### 4.1 Hardware Minimum
- **Processor**: Intel Core i3 atau setara
- **RAM**: 4 GB
- **Storage**: 500 MB free space
- **Display**: 1366 x 768 pixels

### 4.2 Hardware Recommended
- **Processor**: Intel Core i5 atau lebih tinggi
- **RAM**: 8 GB atau lebih
- **Storage**: 1 GB free space
- **Display**: 1920 x 1080 pixels (Full HD)

### 4.3 Software Requirements
- **Operating System**: 
  - Windows 10/11
  - macOS 10.14 atau lebih baru
  - Linux (Ubuntu 20.04 atau setara)
- **Browser**: 
  - Google Chrome 90+ (Recommended)
  - Mozilla Firefox 88+
  - Microsoft Edge 90+
  - Safari 14+ (untuk macOS)
- **Node.js**: Version 14.x atau lebih baru (untuk menjalankan server)

### 4.4 Network Requirements
- **Internet**: Diperlukan untuk download pertama kali
- **Offline**: Aplikasi dapat berjalan offline setelah dimuat
- **Port**: Port 3000 harus tersedia (default server port)

### 4.5 Browser Settings
- **JavaScript**: Harus diaktifkan
- **LocalStorage**: Harus diaktifkan
- **Cookies**: Harus diaktifkan
- **Pop-up Blocker**: Disable untuk domain aplikasi (untuk print struk)

---


# BAGIAN II: MEMULAI

## 5. Instalasi dan Setup

### 5.1 Download Aplikasi
1. Download source code aplikasi dari repository
2. Extract file ke folder yang diinginkan
3. Pastikan struktur folder lengkap

### 5.2 Instalasi Node.js
1. Download Node.js dari https://nodejs.org
2. Install Node.js (pilih versi LTS)
3. Verifikasi instalasi:
   ```bash
   node --version
   npm --version
   ```

### 5.3 Instalasi Dependencies
1. Buka terminal/command prompt
2. Navigate ke folder aplikasi:
   ```bash
   cd path/to/aplikasi-koperasi
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### 5.4 Menjalankan Server
1. Jalankan server:
   ```bash
   node server.js
   ```
   Atau:
   ```bash
   npm start
   ```
2. Server akan berjalan di http://localhost:3000
3. Buka browser dan akses http://localhost:3000

### 5.5 Setup Awal
Setelah aplikasi terbuka pertama kali:
1. Login dengan akun default (lihat bagian 6)
2. Ubah password default
3. Input data koperasi
4. Upload logo koperasi
5. Tambah user sesuai kebutuhan
6. Setup COA (sudah ada default)
7. Tambah anggota
8. Tambah barang untuk POS

---

## 6. Login Pertama Kali

### 6.1 Akun Default
Aplikasi sudah dilengkapi dengan 4 akun default:

| Role | Username | Password | Akses |
|------|----------|----------|-------|
| Super Admin | `superadmin` | `super123` | Semua fitur + Pengaturan Sistem |
| Administrator | `admin` | `admin123` | Hampir semua fitur |
| Admin Keuangan | `keuangan` | `keuangan123` | Koperasi + Keuangan + Laporan |
| Kasir | `kasir` | `kasir123` | POS + Riwayat Transaksi |

### 6.2 Cara Login
1. Buka http://localhost:3000 di browser
2. Masukkan username dan password
3. Klik tombol **"Login"**
4. Jika berhasil, akan masuk ke Dashboard

### 6.3 Lupa Password
Jika lupa password:
1. Hubungi Administrator atau Super Admin
2. Admin dapat reset password melalui menu Manajemen User
3. Atau hapus data localStorage (akan reset semua data!)

### 6.4 Mengganti Password Default
**PENTING**: Segera ganti password default untuk keamanan!

1. Login sebagai Administrator
2. Buka menu **"Manajemen User"**
3. Klik **"Edit"** pada user yang ingin diganti passwordnya
4. Masukkan password baru (minimal 6 karakter)
5. Klik **"Simpan"**

---

## 7. Mengenal Interface

### 7.1 Halaman Login
**Komponen:**
- Logo aplikasi dengan animasi
- Form login (username & password)
- Tombol login
- Link support

**Tips:**
- Gunakan browser modern untuk tampilan optimal
- Pastikan JavaScript diaktifkan

### 7.2 Navbar (Navigation Bar)
**Posisi**: Bagian atas halaman

**Komponen:**
- **Logo & Nama Koperasi**: Klik untuk kembali ke Dashboard
- **Notifikasi Bell**: Menampilkan notifikasi (badge merah jika ada unread)
- **Support Button**: Akses informasi kontak support
- **User Info**: Menampilkan nama user dan role
- **Logout Button**: Keluar dari aplikasi

**Mobile View:**
- Hamburger menu untuk toggle sidebar
- User info disingkat
- Semua fungsi tetap accessible

### 7.3 Sidebar (Menu Samping)
**Posisi**: Sisi kiri halaman

**Komponen:**
- Daftar menu sesuai hak akses user
- Icon untuk setiap menu
- Highlight menu aktif
- Scroll jika menu banyak

**Mobile View:**
- Sidebar tersembunyi secara default
- Klik hamburger menu untuk menampilkan
- Overlay background saat sidebar terbuka
- Klik di luar sidebar untuk menutup

### 7.4 Main Content Area
**Posisi**: Tengah halaman (sebelah kanan sidebar)

**Komponen:**
- Judul halaman
- Breadcrumb (jika ada)
- Konten utama (form, tabel, cards, dll)
- Action buttons
- Pagination (jika ada)

### 7.5 Dashboard
**Komponen:**
- **Cards Statistik**: Total anggota, penjualan hari ini, total barang, transaksi hari ini
- **Tanggal Real-time**: Menampilkan tanggal dan waktu saat ini
- **Quick Actions**: Tombol akses cepat ke fitur utama
- **Grafik** (jika ada): Visualisasi data

### 7.6 Modal Dialog
Digunakan untuk:
- Form input data
- Konfirmasi aksi (hapus, logout, dll)
- Preview data
- Detail informasi

**Komponen:**
- Header dengan judul
- Body dengan konten
- Footer dengan action buttons
- Close button (X)

### 7.7 Notifikasi
**Tipe Notifikasi:**
- ✅ **Success** (hijau): Aksi berhasil
- ⚠️ **Warning** (kuning): Peringatan
- ❌ **Error** (merah): Terjadi kesalahan
- ℹ️ **Info** (biru): Informasi

**Posisi**: Top-right corner (toast notification)

### 7.8 Tabel Data
**Fitur:**
- Sorting kolom (klik header)
- Search/filter
- Pagination
- Action buttons per row (Edit, Hapus, Detail)
- Responsive (scroll horizontal di mobile)

### 7.9 Form Input
**Komponen:**
- Label field
- Input field dengan validasi
- Required indicator (*)
- Help text (jika ada)
- Error message (jika validasi gagal)
- Submit & Cancel buttons

---

## 8. Hak Akses Pengguna

### 8.1 Super Admin
**Akses Penuh ke Semua Fitur**

**Menu Khusus:**
- ⚙️ Pengaturan Sistem
- 🔐 Audit Log (jika ada)
- 👥 Manajemen User (full access)

**Kemampuan:**
- Semua yang bisa dilakukan Administrator
- Akses pengaturan sistem
- Konfigurasi aplikasi
- Hapus data sistem
- Backup & Restore

**Tidak Bisa:**
- (Tidak ada batasan)

### 8.2 Administrator
**Akses Hampir Semua Fitur**

**Menu yang Dapat Diakses:**
- 📊 Dashboard
- 🏢 Data Koperasi
- 👥 Master Anggota
- 🏛️ Departemen
- 💰 Simpanan (Pokok, Wajib, Sukarela)
- 💳 Pinjaman
- 📚 Chart of Accounts
- 📝 Jurnal Keuangan
- 💵 Saldo Awal Periode
- 🛒 Point of Sales
- 📦 Master Barang
- 🏪 Supplier
- 📥 Pembelian
- 📊 Stok Opname
- 📈 Semua Laporan
- 👤 Manajemen User
- 💾 Backup & Restore
- 🔔 Notifikasi

**Kemampuan:**
- Kelola semua data koperasi
- Kelola keuangan
- Akses POS
- Kelola inventory
- Generate laporan
- Kelola user (kecuali Super Admin)
- Backup & Restore data

**Tidak Bisa:**
- Akses Pengaturan Sistem
- Edit/Hapus Super Admin
- Konfigurasi tingkat sistem

### 8.3 Admin Keuangan
**Fokus pada Koperasi dan Keuangan**

**Menu yang Dapat Diakses:**
- 📊 Dashboard
- 👥 Master Anggota (view only)
- 🏛️ Departemen (view only)
- 💰 Simpanan (Pokok, Wajib, Sukarela)
- 💳 Pinjaman
- 📚 Chart of Accounts
- 📝 Jurnal Keuangan
- 💵 Saldo Awal Periode
- 📈 Laporan Koperasi
- 📈 Laporan Keuangan

**Kemampuan:**
- Kelola simpanan anggota
- Kelola pinjaman anggota
- Input jurnal keuangan
- Kelola COA
- Input saldo awal
- Generate laporan koperasi dan keuangan
- View data anggota

**Tidak Bisa:**
- Akses POS
- Kelola inventory
- Kelola user
- Edit data koperasi
- Tambah/Edit/Hapus anggota
- Backup & Restore

### 8.4 Kasir
**Fokus pada Point of Sales**

**Menu yang Dapat Diakses:**
- 📊 Dashboard (terbatas)
- 🛒 Point of Sales
- 📋 Riwayat Transaksi
- 💰 Pengajuan Modal
- 🔔 Notifikasi

**Kemampuan:**
- Buka kas
- Transaksi penjualan (cash & bon)
- Scan barcode
- Cetak struk
- Tutup kasir
- Ajukan modal awal
- View riwayat transaksi sendiri
- View notifikasi

**Tidak Bisa:**
- Akses data koperasi
- Akses keuangan
- Kelola inventory
- Kelola user
- Generate laporan lengkap
- Edit harga barang
- Hapus transaksi (kecuali Super Admin)

### 8.5 Tabel Ringkasan Hak Akses

| Fitur | Super Admin | Administrator | Admin Keuangan | Kasir |
|-------|-------------|---------------|----------------|-------|
| Dashboard | ✅ Full | ✅ Full | ✅ Limited | ✅ Limited |
| Data Koperasi | ✅ | ✅ | ❌ | ❌ |
| Master Anggota | ✅ | ✅ | 👁️ View | ❌ |
| Departemen | ✅ | ✅ | 👁️ View | ❌ |
| Simpanan | ✅ | ✅ | ✅ | ❌ |
| Pinjaman | ✅ | ✅ | ✅ | ❌ |
| COA | ✅ | ✅ | ✅ | ❌ |
| Jurnal | ✅ | ✅ | ✅ | ❌ |
| Saldo Awal | ✅ | ✅ | ✅ | ❌ |
| POS | ✅ | ✅ | ❌ | ✅ |
| Master Barang | ✅ | ✅ | ❌ | ❌ |
| Supplier | ✅ | ✅ | ❌ | ❌ |
| Pembelian | ✅ | ✅ | ❌ | ❌ |
| Stok Opname | ✅ | ✅ | ❌ | ❌ |
| Laporan | ✅ All | ✅ All | ✅ Limited | ❌ |
| Manajemen User | ✅ | ✅ Limited | ❌ | ❌ |
| Backup & Restore | ✅ | ✅ | ❌ | ❌ |
| Pengaturan Sistem | ✅ | ❌ | ❌ | ❌ |
| Pengajuan Modal | ✅ Approve | ✅ Approve | ❌ | ✅ Request |
| Notifikasi | ✅ | ✅ | ✅ | ✅ |

**Keterangan:**
- ✅ = Full Access (Create, Read, Update, Delete)
- 👁️ = View Only (Read)
- ❌ = No Access

---


# BAGIAN III: MODUL KOPERASI

## 9. Data Koperasi

### 9.1 Pengenalan
Menu Data Koperasi digunakan untuk mengelola informasi dasar koperasi seperti nama, alamat, kontak, modal awal, dan logo.

### 9.2 Akses Menu
**Hak Akses**: Super Admin, Administrator

**Cara Akses**:
1. Login sebagai Super Admin atau Administrator
2. Klik menu **"Data Koperasi"** di sidebar

### 9.3 Input Data Koperasi

**Langkah-langkah:**
1. Klik tombol **"Edit Data Koperasi"**
2. Isi form dengan data lengkap:
   - **Nama Koperasi** (wajib)
   - **Alamat** (wajib)
   - **Telepon** (wajib)
   - **Email** (opsional)
   - **Modal Awal** (wajib, dalam Rupiah)
3. Klik **"Simpan"**

**Validasi:**
- Semua field wajib harus diisi
- Modal awal harus berupa angka
- Telepon harus format yang valid

### 9.4 Upload Logo Koperasi

**Langkah-langkah:**
1. Klik tombol **"Upload Logo"**
2. Pilih file gambar (JPG, PNG, GIF)
3. Preview logo akan muncul
4. Klik **"Simpan Logo"**

**Spesifikasi Logo:**
- Format: JPG, PNG, GIF
- Ukuran maksimal: 2 MB
- Resolusi recommended: 200x200 pixels
- Rasio: Square (1:1) untuk hasil terbaik

**Penggunaan Logo:**
- Tampil di navbar (pojok kiri atas)
- Tampil di struk pembayaran POS
- Tampil di laporan (jika ada)

### 9.5 Edit Data Koperasi

**Langkah-langkah:**
1. Klik tombol **"Edit Data Koperasi"**
2. Ubah data yang diperlukan
3. Klik **"Simpan"**

**Catatan:**
- Modal awal hanya bisa diubah sekali saat setup awal
- Setelah ada transaksi, modal awal tidak bisa diubah

### 9.6 Hapus Logo

**Langkah-langkah:**
1. Klik tombol **"Hapus Logo"**
2. Konfirmasi penghapusan
3. Logo akan dihapus dan kembali ke default

---

## 10. Master Anggota

### 10.1 Pengenalan
Menu Master Anggota digunakan untuk mengelola data anggota koperasi, termasuk tambah, edit, hapus, import, dan export data anggota.

### 10.2 Akses Menu
**Hak Akses**: Super Admin, Administrator, Admin Keuangan (view only)

**Cara Akses**:
1. Login dengan akun yang memiliki akses
2. Klik menu **"Master Anggota"** di sidebar

### 10.3 Tambah Anggota Manual

**Langkah-langkah:**
1. Klik tombol **"Tambah Anggota"**
2. Isi form dengan data lengkap:
   - **NIK** (wajib, unik)
   - **Nama** (wajib)
   - **No. Kartu Anggota** (wajib, unik)
   - **Departemen** (pilih dari dropdown)
   - **Telepon** (opsional)
   - **Email** (opsional)
   - **Alamat** (opsional)
   - **Tanggal Pendaftaran** (otomatis hari ini, bisa diubah)
3. Klik **"Simpan"**

**Validasi:**
- NIK harus unik (tidak boleh sama dengan anggota lain)
- No. Kartu harus unik
- Nama minimal 3 karakter
- Format email harus valid (jika diisi)

### 10.4 Import Data Anggota Massal

**Metode 1: Import dari File CSV/Excel**

1. **Download Template**
   - Klik tombol **"Download Template"**
   - File `template_anggota.csv` akan terdownload
   - Buka dengan Excel atau spreadsheet

2. **Isi Data**
   - Isi sesuai kolom: NIK, Nama, No. Kartu, Telepon, Alamat
   - Simpan sebagai CSV atau Excel

3. **Upload File**
   - Klik tombol **"Import Data"**
   - Pilih file yang sudah diisi
   - Atau drag & drop file

4. **Preview & Import**
   - Klik **"Preview"** untuk melihat 5 baris pertama
   - Jika sudah benar, klik **"Import Data"**
   - Data duplikat (NIK sama) akan dilewati

**Metode 2: Paste Data CSV**

1. Siapkan data dalam format CSV:
   ```
   NIK,Nama,No. Kartu,Telepon,Alamat
   123456,John Doe,KTA001,08123456789,Jl. Contoh No. 1
   234567,Jane Smith,KTA002,08234567890,Jl. Contoh No. 2
   ```

2. Klik tombol **"Import Data"**
3. Paste data ke textarea
4. Klik **"Preview"** lalu **"Import Data"**

**Tips Import:**
- Import 100-200 data per batch untuk performa optimal
- Pastikan NIK dan No. Kartu unik
- Gunakan quotes untuk data yang mengandung koma
- Encoding file harus UTF-8

### 10.5 Export Data Anggota

**Langkah-langkah:**
1. Klik tombol **"Export Data"**
2. File CSV akan terdownload
3. Nama file: `data_anggota_YYYY-MM-DD.csv`

**Kegunaan Export:**
- Backup data anggota
- Edit massal di Excel
- Migrasi data ke sistem lain
- Analisis data

### 10.6 Edit Data Anggota

**Langkah-langkah:**
1. Cari anggota yang ingin diedit (gunakan search jika perlu)
2. Klik tombol **"Edit"** pada baris anggota
3. Ubah data yang diperlukan
4. Klik **"Simpan"**

**Catatan:**
- NIK tidak bisa diubah setelah ada transaksi
- No. Kartu harus tetap unik

### 10.7 Hapus Anggota

**Langkah-langkah:**
1. Klik tombol **"Hapus"** pada baris anggota
2. Konfirmasi penghapusan
3. Anggota akan dihapus

**Peringatan:**
- ⚠️ Anggota yang sudah memiliki transaksi **TIDAK BISA DIHAPUS**
- ⚠️ Hapus transaksi terkait terlebih dahulu
- ⚠️ Tindakan ini tidak dapat dibatalkan

### 10.8 Cetak Kartu Anggota

**Langkah-langkah:**
1. Klik tombol **"Cetak Kartu"** pada baris anggota
2. Preview kartu akan muncul
3. Klik **"Print"** untuk mencetak

**Isi Kartu:**
- Logo koperasi
- Nama koperasi
- Foto anggota (jika ada)
- Nama anggota
- NIK
- No. Kartu Anggota
- Tanggal bergabung

### 10.9 Filter dan Pencarian

**Filter Departemen:**
1. Pilih departemen dari dropdown filter
2. Tabel akan menampilkan anggota dari departemen tersebut
3. Pilih "Semua Departemen" untuk reset filter

**Pencarian:**
1. Ketik keyword di search box
2. Sistem akan mencari di: NIK, Nama, No. Kartu, Telepon
3. Hasil akan muncul real-time

---

## 11. Departemen

### 11.1 Pengenalan
Menu Departemen digunakan untuk mengelola data departemen/divisi dalam koperasi. Departemen digunakan untuk mengelompokkan anggota.

### 11.2 Akses Menu
**Hak Akses**: Super Admin, Administrator

**Cara Akses**:
1. Login sebagai Super Admin atau Administrator
2. Klik menu **"Departemen"** di sidebar

### 11.3 Tambah Departemen

**Langkah-langkah:**
1. Klik tombol **"Tambah Departemen"**
2. Isi form:
   - **Kode Departemen** (wajib, unik, contoh: IT, HR, FIN)
   - **Nama Departemen** (wajib, contoh: IT Department)
   - **Deskripsi** (opsional)
3. Klik **"Simpan"**

**Validasi:**
- Kode harus unik
- Kode maksimal 10 karakter
- Nama minimal 3 karakter

### 11.4 Edit Departemen

**Langkah-langkah:**
1. Klik tombol **"Edit"** pada baris departemen
2. Ubah data yang diperlukan
3. Klik **"Simpan"**

**Catatan:**
- Kode departemen tidak bisa diubah jika sudah ada anggota

### 11.5 Hapus Departemen

**Langkah-langkah:**
1. Klik tombol **"Hapus"** pada baris departemen
2. Konfirmasi penghapusan
3. Departemen akan dihapus

**Peringatan:**
- ⚠️ Departemen yang sudah memiliki anggota **TIDAK BISA DIHAPUS**
- ⚠️ Pindahkan anggota ke departemen lain terlebih dahulu

### 11.6 Lihat Anggota Departemen

**Langkah-langkah:**
1. Klik tombol **"Lihat Anggota"** pada baris departemen
2. Daftar anggota dari departemen tersebut akan ditampilkan
3. Bisa langsung edit/hapus anggota dari sini

---

## 12. Simpanan Anggota

### 12.1 Pengenalan
Modul Simpanan mengelola 3 jenis simpanan anggota:
- **Simpanan Pokok**: Setoran awal saat menjadi anggota (sekali)
- **Simpanan Wajib**: Setoran rutin bulanan
- **Simpanan Sukarela**: Setoran dan penarikan kapan saja

### 12.2 Akses Menu
**Hak Akses**: Super Admin, Administrator, Admin Keuangan

### 12.3 Simpanan Pokok

**Pengenalan:**
- Simpanan yang dibayarkan sekali saat menjadi anggota
- Tidak bisa ditarik selama masih menjadi anggota
- Jumlah sama untuk semua anggota (sesuai AD/ART)

**Tambah Simpanan Pokok:**
1. Klik menu **"Simpanan Pokok"**
2. Klik tombol **"Tambah Simpanan Pokok"**
3. Isi form:
   - **Pilih Anggota** (dropdown)
   - **Jumlah** (dalam Rupiah)
   - **Tanggal** (default hari ini)
   - **Keterangan** (opsional)
4. Klik **"Simpan"**

**Validasi:**
- Anggota hanya bisa memiliki 1 simpanan pokok
- Jumlah harus > 0

**Jurnal Otomatis:**
```
Debit: Kas (1-1000) - Rp XXX
Kredit: Simpanan Pokok (2-1000) - Rp XXX
```

**Upload Saldo Awal Simpanan Pokok:**
1. Klik tombol **"Upload Saldo Awal"**
2. Download template CSV
3. Isi data: NIK, Nama, Jumlah
4. Upload file
5. Preview dan Import

**Hapus Simpanan Pokok:**
1. Klik tombol **"Hapus"** pada baris simpanan
2. Konfirmasi penghapusan
3. Jurnal akan di-reverse otomatis

**Peringatan:**
- ⚠️ Hanya Super Admin yang bisa hapus simpanan pokok
- ⚠️ Hati-hati saat menghapus, akan mempengaruhi laporan

### 12.4 Simpanan Wajib

**Pengenalan:**
- Simpanan yang dibayarkan rutin setiap bulan
- Jumlah bisa berbeda tiap bulan
- Tidak bisa ditarik selama masih menjadi anggota

**Tambah Simpanan Wajib:**
1. Klik menu **"Simpanan Wajib"**
2. Klik tombol **"Tambah Simpanan Wajib"**
3. Isi form:
   - **Pilih Anggota** (dropdown)
   - **Periode** (Bulan/Tahun, contoh: Januari 2024)
   - **Jumlah** (dalam Rupiah)
   - **Tanggal Bayar** (default hari ini)
   - **Keterangan** (opsional)
4. Klik **"Simpan"**

**Validasi:**
- Anggota tidak bisa bayar 2x untuk periode yang sama
- Jumlah harus > 0

**Jurnal Otomatis:**
```
Debit: Kas (1-1000) - Rp XXX
Kredit: Simpanan Wajib (2-2000) - Rp XXX
```

**Upload Saldo Awal Simpanan Wajib:**
1. Klik tombol **"Upload Saldo Awal"**
2. Download template CSV
3. Isi data: NIK, Nama, Jumlah
4. Upload file
5. Preview dan Import

**Lihat Riwayat per Anggota:**
1. Klik tombol **"Detail"** pada baris anggota
2. Akan muncul daftar semua setoran simpanan wajib
3. Bisa filter per periode

### 12.5 Simpanan Sukarela

**Pengenalan:**
- Simpanan yang bisa disetor dan ditarik kapan saja
- Tidak ada batasan jumlah setoran
- Penarikan tidak boleh melebihi saldo

**Setor Simpanan Sukarela:**
1. Klik menu **"Simpanan Sukarela"**
2. Klik tombol **"Setor Simpanan"**
3. Isi form:
   - **Pilih Anggota** (dropdown)
   - **Jumlah** (dalam Rupiah)
   - **Tanggal** (default hari ini)
   - **Keterangan** (opsional)
4. Klik **"Simpan"**

**Jurnal Otomatis (Setoran):**
```
Debit: Kas (1-1000) - Rp XXX
Kredit: Simpanan Sukarela (2-3000) - Rp XXX
```

**Tarik Simpanan Sukarela:**
1. Klik tombol **"Tarik Simpanan"**
2. Isi form:
   - **Pilih Anggota** (dropdown)
   - **Jumlah** (dalam Rupiah, max = saldo)
   - **Tanggal** (default hari ini)
   - **Keterangan** (opsional)
3. Klik **"Simpan"**

**Validasi Penarikan:**
- Jumlah penarikan tidak boleh > saldo
- Saldo akan dicek real-time

**Jurnal Otomatis (Penarikan):**
```
Debit: Simpanan Sukarela (2-3000) - Rp XXX
Kredit: Kas (1-1000) - Rp XXX
```

**Lihat Saldo & Riwayat:**
1. Tabel menampilkan saldo per anggota
2. Klik tombol **"Detail"** untuk lihat riwayat
3. Riwayat menampilkan semua setoran dan penarikan
4. Saldo dihitung otomatis

**Upload Saldo Awal Simpanan Sukarela:**
1. Klik tombol **"Upload Saldo Awal"**
2. Download template CSV
3. Isi data: NIK, Nama, Jumlah
4. Upload file
5. Preview dan Import

---

## 13. Pinjaman Anggota

### 13.1 Pengenalan
Modul Pinjaman mengelola pinjaman anggota dengan fitur:
- Input pinjaman dengan bunga
- Perhitungan angsuran otomatis
- Tracking pembayaran
- Status pinjaman (Aktif/Lunas)

### 13.2 Akses Menu
**Hak Akses**: Super Admin, Administrator, Admin Keuangan

**Cara Akses**:
1. Login dengan akun yang memiliki akses
2. Klik menu **"Pinjaman"** di sidebar

### 13.3 Tambah Pinjaman Baru

**Langkah-langkah:**
1. Klik tombol **"Tambah Pinjaman"**
2. Isi form:
   - **Pilih Anggota** (dropdown)
   - **Jumlah Pinjaman** (dalam Rupiah)
   - **Bunga (%)** (contoh: 2 untuk 2% per bulan)
   - **Jangka Waktu** (dalam bulan)
   - **Tanggal Pinjaman** (default hari ini)
   - **Keterangan** (opsional)
3. Sistem akan menghitung otomatis:
   - Total Bunga
   - Total yang Harus Dibayar
   - Angsuran per Bulan
4. Klik **"Simpan"**

**Rumus Perhitungan:**
```
Total Bunga = Jumlah Pinjaman × (Bunga% / 100) × Jangka Waktu
Total Bayar = Jumlah Pinjaman + Total Bunga
Angsuran per Bulan = Total Bayar / Jangka Waktu
```

**Contoh:**
- Pinjaman: Rp 10.000.000
- Bunga: 2% per bulan
- Jangka Waktu: 12 bulan
- Total Bunga: Rp 2.400.000
- Total Bayar: Rp 12.400.000
- Angsuran: Rp 1.033.333/bulan

**Nomor Pinjaman:**
- Otomatis generate: PJM-YYYYMMDD-XXX
- Contoh: PJM-20240115-001

**Jurnal Otomatis (Pencairan):**
```
Debit: Piutang Pinjaman (1-2000) - Rp Total Bayar
Kredit: Kas (1-1000) - Rp Jumlah Pinjaman
Kredit: Pendapatan Bunga (4-2000) - Rp Total Bunga
```

### 13.4 Bayar Angsuran

**Langkah-langkah:**
1. Cari pinjaman yang ingin dibayar (gunakan search jika perlu)
2. Klik tombol **"Bayar"** pada baris pinjaman
3. Isi form:
   - **Jumlah Bayar** (default = angsuran, bisa lebih)
   - **Tanggal Bayar** (default hari ini)
   - **Keterangan** (opsional)
4. Sistem akan menampilkan:
   - Sisa pinjaman sebelum bayar
   - Jumlah yang dibayar
   - Sisa pinjaman setelah bayar
5. Klik **"Simpan"**

**Validasi:**
- Jumlah bayar harus > 0
- Jumlah bayar tidak boleh > sisa pinjaman

**Jurnal Otomatis (Pembayaran):**
```
Debit: Kas (1-1000) - Rp Jumlah Bayar
Kredit: Piutang Pinjaman (1-2000) - Rp Jumlah Bayar
```

**Status Pinjaman:**
- **Aktif**: Masih ada sisa pinjaman
- **Lunas**: Sisa pinjaman = 0

### 13.5 Lihat Detail Pinjaman

**Langkah-langkah:**
1. Klik tombol **"Detail"** pada baris pinjaman
2. Akan muncul informasi lengkap:
   - Data pinjaman (jumlah, bunga, jangka waktu)
   - Total yang harus dibayar
   - Sudah dibayar
   - Sisa pinjaman
   - Status
   - Riwayat pembayaran lengkap

**Riwayat Pembayaran:**
- Tanggal bayar
- Jumlah bayar
- Sisa setelah bayar
- Keterangan

### 13.6 Cetak Kartu Pinjaman

**Langkah-langkah:**
1. Klik tombol **"Cetak"** pada baris pinjaman
2. Preview kartu pinjaman akan muncul
3. Klik **"Print"** untuk mencetak

**Isi Kartu:**
- Logo koperasi
- Nomor pinjaman
- Data anggota
- Detail pinjaman
- Tabel angsuran
- Tanda tangan

### 13.7 Laporan Pinjaman

**Statistik Dashboard:**
- Total pinjaman aktif
- Total pinjaman lunas
- Total piutang (sisa yang belum dibayar)
- Total sudah dibayar

**Filter:**
- Filter by status (Aktif/Lunas/Semua)
- Filter by anggota
- Filter by tanggal

**Export:**
- Export data pinjaman ke CSV
- Export riwayat pembayaran

---

