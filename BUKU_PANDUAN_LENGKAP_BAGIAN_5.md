# BUKU PANDUAN LENGKAP APLIKASI KOPERASI - BAGIAN 5 (FINAL)

## Lanjutan dari BUKU_PANDUAN_LENGKAP_BAGIAN_4.md

---

# BAGIAN VIII: ADMINISTRASI SISTEM

## 33. Manajemen User

### 33.1 Pengenalan
Menu Manajemen User digunakan untuk mengelola akun pengguna aplikasi.

### 33.2 Akses Menu
**Hak Akses**: Super Admin, Administrator

**Cara Akses:**
1. Login sebagai Super Admin atau Administrator
2. Klik menu **"Manajemen User"** di sidebar

### 33.3 Tambah User Baru

**Langkah-langkah:**
1. Klik tombol **"Tambah User"**
2. Isi form:
   - **Username** (wajib, unik, minimal 4 karakter)
   - **Password** (wajib, minimal 6 karakter)
   - **Nama Lengkap** (wajib)
   - **Role** (pilih: Super Admin, Administrator, Admin Keuangan, Kasir)
   - **Email** (opsional)
   - **Status** (Aktif/Nonaktif)
3. Klik **"Simpan"**

**Validasi:**
- Username harus unik
- Password minimal 6 karakter
- Role harus dipilih

### 33.4 Edit User

**Langkah-langkah:**
1. Klik tombol **"Edit"** pada baris user
2. Ubah data yang diperlukan:
   - Nama lengkap
   - Email
   - Role (hati-hati mengubah role)
   - Status (Aktif/Nonaktif)
3. Klik **"Simpan"**

**Reset Password:**
1. Klik tombol **"Reset Password"**
2. Masukkan password baru
3. Klik **"Simpan"**

**Catatan:**
- Username tidak bisa diubah
- Administrator tidak bisa edit Super Admin
- User default (admin, keuangan, kasir) tidak bisa dihapus

### 33.5 Nonaktifkan User

**Langkah-langkah:**
1. Klik tombol **"Edit"** pada baris user
2. Ubah status menjadi **"Nonaktif"**
3. Klik **"Simpan"**

**Efek:**
- User tidak bisa login
- Data user tetap tersimpan
- Bisa diaktifkan kembali kapan saja

### 33.6 Hapus User

**Langkah-langkah:**
1. Klik tombol **"Hapus"** pada baris user
2. Konfirmasi penghapusan
3. User akan dihapus

**Peringatan:**
- ⚠️ User default tidak bisa dihapus
- ⚠️ Super Admin tidak bisa dihapus oleh Administrator
- ⚠️ User yang sedang login tidak bisa dihapus
- ⚠️ Tindakan ini tidak dapat dibatalkan

---

## 34. Backup & Restore

### 34.1 Pengenalan
Fitur Backup & Restore memungkinkan export dan import seluruh data aplikasi.

### 34.2 Akses Menu
**Hak Akses**: Super Admin, Administrator

**Cara Akses:**
1. Login sebagai Super Admin atau Administrator
2. Klik menu **"Backup & Restore"** di sidebar

### 34.3 Membuat Backup

**Full Backup:**
1. Klik tombol **"Buat Backup"**
2. Pilih **"Full Backup"**
3. Lihat estimasi ukuran file
4. Klik **"Buat Backup"**
5. File JSON akan terdownload

**Partial Backup:**
1. Klik tombol **"Buat Backup"**
2. Pilih **"Partial Backup"**
3. Centang kategori data yang ingin di-backup:
   - Data Koperasi
   - Pengguna
   - Anggota
   - Simpanan
   - Pinjaman
   - COA & Jurnal
   - Barang & Inventory
   - Transaksi POS
4. Klik **"Buat Backup"**

**Format Nama File:**
```
backup_[NamaKoperasi]_[Tanggal-Waktu].json
Contoh: backup_Koperasi_Sejahtera_2024-01-15T10-30-00.json
```

### 34.4 Restore Database

**Langkah-langkah:**
1. Klik tombol **"Restore dari Backup"**
2. Pilih file backup (.json)
3. Preview informasi backup:
   - Nama koperasi
   - Tanggal backup
   - Versi aplikasi
   - Total records
   - Kategori data
4. Klik **"Lanjutkan"**
5. Konfirmasi restore:
   - Centang checkbox konfirmasi
   - Ketik **"RESTORE"** (huruf besar)
6. Klik **"Restore Sekarang"**
7. Tunggu proses selesai
8. Aplikasi akan reload otomatis

**Peringatan:**
- ⚠️ Restore akan mengganti SELURUH data saat ini
- ⚠️ Backup otomatis akan dibuat sebelum restore
- ⚠️ Tindakan ini TIDAK DAPAT DIBATALKAN
- ⚠️ Pastikan file backup valid dan tidak rusak

**Auto Backup Pre-Restore:**
Sebelum restore, sistem otomatis membuat backup dengan nama:
```
backup_pre-restore_[NamaKoperasi]_[Waktu].json
```
File ini bisa digunakan untuk kembali ke kondisi sebelum restore.

### 34.5 Riwayat Backup

**Informasi yang Ditampilkan:**
- Tanggal backup
- Tipe (Full/Partial)
- Ukuran file
- Total records
- Status

**Aksi:**
- Download ulang backup
- Lihat detail backup

---

## 35. Pengaturan Sistem

### 35.1 Pengenalan
Menu Pengaturan Sistem untuk konfigurasi aplikasi tingkat sistem.

### 35.2 Akses Menu
**Hak Akses**: Super Admin ONLY

**Cara Akses:**
1. Login sebagai Super Admin
2. Klik menu **"Pengaturan Sistem"** di sidebar

### 35.3 Pengaturan Umum

**Informasi Aplikasi:**
- Nama Aplikasi (read-only)
- Versi Aplikasi (read-only)

**Manajemen Data:**
- Tombol akses cepat ke Backup & Restore

### 35.4 Pengaturan Fitur

**Pengajuan Modal Kasir:**
- Toggle untuk aktifkan/nonaktifkan fitur
- Jika nonaktif, kasir tidak bisa ajukan modal

**Batas Kredit POS:**
- Setting batas kredit maksimal (default: Rp 2.000.000)
- Bisa diubah sesuai kebijakan koperasi

**Notifikasi:**
- Aktifkan/nonaktifkan notifikasi
- Setting jenis notifikasi yang ditampilkan

---

## 36. Notifikasi

### 36.1 Pengenalan
Sistem notifikasi memberikan informasi real-time tentang aktivitas penting.

### 36.2 Jenis Notifikasi

**Untuk Kasir:**
- Pengajuan modal disetujui
- Pengajuan modal ditolak
- Reminder tutup kasir

**Untuk Admin:**
- Pengajuan modal baru dari kasir
- Stok barang menipis
- Pinjaman jatuh tempo

### 36.3 Cara Menggunakan

**Melihat Notifikasi:**
1. Klik icon bell di navbar
2. Dropdown notifikasi akan muncul
3. Badge merah menunjukkan jumlah unread

**Mark as Read:**
- Klik notifikasi untuk mark as read
- Atau klik **"Tandai Semua Dibaca"**

**Hapus Notifikasi:**
- Klik icon trash pada notifikasi
- Atau hapus semua notifikasi lama

---

# BAGIAN IX: PANDUAN KHUSUS

## 37. Panduan untuk Administrator

### 37.1 Tugas Harian

**Pagi:**
1. Login dan cek dashboard
2. Cek notifikasi pending
3. Review pengajuan modal kasir (approve/reject)
4. Cek stok barang (alert stok menipis)

**Siang:**
5. Monitor transaksi POS
6. Cek laporan penjualan harian
7. Input data jika ada (anggota baru, barang baru)

**Sore:**
8. Review tutup kasir dari kasir
9. Cek selisih kas (jika ada)
10. Backup data (recommended)

### 37.2 Tugas Mingguan

1. Review laporan penjualan mingguan
2. Cek stok barang dan reorder jika perlu
3. Input pembelian barang
4. Review simpanan dan pinjaman anggota
5. Backup data mingguan

### 37.3 Tugas Bulanan

1. Tutup periode bulanan
2. Generate laporan keuangan bulanan
3. Input simpanan wajib anggota
4. Review pinjaman jatuh tempo
5. Stok opname (recommended)
6. Backup data bulanan (PENTING!)

### 37.4 Tips & Best Practices

**Keamanan:**
- Ganti password secara berkala
- Jangan share akun dengan orang lain
- Logout saat meninggalkan komputer

**Data Management:**
- Backup data minimal seminggu sekali
- Simpan backup di multiple lokasi
- Verifikasi backup secara berkala

**Monitoring:**
- Cek dashboard setiap hari
- Monitor transaksi mencurigakan
- Review laporan secara rutin

---

## 38. Panduan untuk Admin Keuangan

### 38.1 Tugas Harian

**Pagi:**
1. Login dan cek dashboard
2. Cek notifikasi
3. Review jurnal otomatis dari transaksi kemarin

**Siang:**
4. Input simpanan anggota (jika ada)
5. Proses pembayaran pinjaman (jika ada)
6. Input jurnal manual (jika ada)

**Sore:**
7. Cek saldo COA
8. Review laporan keuangan harian

### 38.2 Tugas Mingguan

1. Rekonsiliasi kas
2. Review jurnal mingguan
3. Cek piutang pinjaman
4. Generate laporan simpanan

### 38.3 Tugas Bulanan

1. Input simpanan wajib semua anggota
2. Generate laporan laba rugi
3. Generate laporan buku besar
4. Review aging piutang
5. Perhitungan bunga (jika ada)

### 38.4 Tugas Tahunan

1. Tutup periode tahunan
2. Perhitungan SHU
3. Generate laporan keuangan tahunan
4. Audit data keuangan

---

## 39. Panduan untuk Kasir

### 39.1 Tugas Harian

**Pagi (Buka Shift):**
1. Login sebagai Kasir
2. Buka menu Point of Sales
3. Buka kas dengan modal awal
4. Jika tidak ada modal, ajukan ke admin
5. Siapkan uang kembalian

**Siang (Operasional):**
6. Terima pelanggan dengan ramah
7. Scan barcode atau input manual
8. Pilih anggota atau umum
9. Cek batas kredit (untuk transaksi bon)
10. Proses pembayaran
11. Cetak struk
12. Berikan struk dan kembalian

**Sore (Tutup Shift):**
13. Klik tombol "Tutup Kasir"
14. Hitung kas fisik dengan teliti
15. Input kas aktual
16. Cek selisih (PAS/LEBIH/KURANG)
17. Tambahkan catatan jika ada selisih
18. Tutup & print laporan
19. Serahkan laporan ke supervisor

### 39.2 Tips Transaksi

**DO (Lakukan):**
- ✅ Sapa pelanggan dengan ramah
- ✅ Cek barcode sebelum scan
- ✅ Konfirmasi total sebelum bayar
- ✅ Hitung kembalian dengan teliti
- ✅ Berikan struk kepada pelanggan
- ✅ Cek batas kredit untuk transaksi bon

**DON'T (Jangan):**
- ❌ Lupa buka kas di awal shift
- ❌ Lupa tutup kas di akhir shift
- ❌ Asal input kas aktual
- ❌ Berbagi akun dengan kasir lain
- ❌ Meninggalkan POS tanpa logout

### 39.3 Handling Situasi Khusus

**Barang Tidak Ada Barcode:**
- Gunakan pencarian manual
- Ketik nama barang di search box
- Pilih dari hasil pencarian

**Stok Tidak Cukup:**
- Informasikan ke pelanggan
- Tawarkan alternatif barang sejenis
- Atau kurangi quantity

**Anggota Melebihi Batas Kredit:**
- Informasikan dengan sopan
- Sarankan pembayaran cash
- Atau lunasi sebagian tagihan dulu

**Selisih Kas:**
- Hitung ulang dengan teliti
- Cek apakah ada transaksi yang terlewat
- Catat keterangan dengan jelas
- Laporkan ke supervisor

---

## 40. Panduan untuk Super Admin

### 40.1 Tanggung Jawab

**Sistem:**
- Konfigurasi aplikasi
- Manajemen user (semua level)
- Backup & restore
- Troubleshooting

**Data:**
- Audit data
- Hapus data (jika diperlukan)
- Migrasi data
- Integritas data

**Keamanan:**
- Password policy
- Access control
- Monitoring aktivitas
- Security audit

### 40.2 Tugas Rutin

**Harian:**
1. Monitor sistem
2. Cek error log (jika ada)
3. Review aktivitas user

**Mingguan:**
1. Backup data
2. Review user access
3. Cek performa aplikasi

**Bulanan:**
1. Audit data
2. Review security
3. Update dokumentasi
4. Training user (jika perlu)

### 40.3 Troubleshooting

**Masalah Umum:**
- User tidak bisa login → Reset password
- Data hilang → Restore dari backup
- Aplikasi lambat → Clear cache, optimize data
- Error → Cek console, hubungi developer

---

# BAGIAN X: TROUBLESHOOTING & FAQ

## 41. Masalah Umum dan Solusi

### 41.1 Masalah Login

**Problem: Tidak bisa login**
**Penyebab:**
- Username/password salah
- User nonaktif
- Browser cache

**Solusi:**
1. Pastikan username dan password benar (case-sensitive)
2. Cek status user (aktif/nonaktif)
3. Clear browser cache (Ctrl+Shift+Delete)
4. Coba browser lain
5. Hubungi administrator untuk reset password

---

**Problem: Lupa password**
**Solusi:**
1. Hubungi Administrator atau Super Admin
2. Admin akan reset password melalui Manajemen User
3. Login dengan password baru
4. Segera ganti password

---

### 41.2 Masalah POS

**Problem: Tidak bisa transaksi**
**Penyebab:**
- Belum buka kas
- Shift sudah ditutup

**Solusi:**
1. Buka kas terlebih dahulu
2. Jika sudah tutup kas, buka shift baru

---

**Problem: Barcode tidak terbaca**
**Penyebab:**
- Barcode rusak
- Scanner tidak berfungsi
- Barcode tidak terdaftar

**Solusi:**
1. Cek kondisi barcode (bersih, tidak rusak)
2. Cek koneksi scanner
3. Gunakan pencarian manual
4. Daftarkan barcode di Master Barang

---

**Problem: Transaksi bon ditolak**
**Penyebab:**
- Melebihi batas kredit
- Bukan anggota (pilih "Umum")

**Solusi:**
1. Cek info kredit anggota
2. Sarankan pembayaran cash
3. Atau lunasi sebagian tagihan dulu
4. Untuk "Umum", hanya bisa cash

---

### 41.3 Masalah Data

**Problem: Data hilang**
**Penyebab:**
- Browser cache dihapus
- LocalStorage dihapus
- Browser private mode

**Solusi:**
1. Restore dari backup terakhir
2. Jangan gunakan private/incognito mode
3. Backup data secara rutin

---

**Problem: Data tidak sinkron**
**Penyebab:**
- Multiple tab terbuka
- Browser cache

**Solusi:**
1. Tutup semua tab aplikasi
2. Refresh browser (Ctrl+F5)
3. Login kembali
4. Gunakan hanya 1 tab

---

### 41.4 Masalah Laporan

**Problem: Laporan kosong**
**Penyebab:**
- Tidak ada data di periode tersebut
- Filter salah

**Solusi:**
1. Cek periode yang dipilih
2. Cek filter yang digunakan
3. Pastikan ada data di periode tersebut

---

**Problem: Angka tidak sesuai**
**Penyebab:**
- Jurnal tidak balance
- Data corrupt

**Solusi:**
1. Cek jurnal (total debit = total kredit)
2. Recalculate saldo COA
3. Hubungi administrator

---

## 42. FAQ (Pertanyaan yang Sering Diajukan)

### 42.1 Umum

**Q: Apakah aplikasi ini gratis?**
A: Ya, aplikasi ini gratis dan open source.

**Q: Apakah perlu internet?**
A: Tidak, aplikasi berjalan offline setelah dimuat pertama kali.

**Q: Apakah data aman?**
A: Data disimpan di browser (LocalStorage). Backup rutin sangat disarankan.

**Q: Berapa user yang bisa login bersamaan?**
A: Tidak terbatas, tapi setiap user harus punya akun sendiri.

**Q: Apakah bisa diakses dari HP?**
A: Ya, aplikasi responsif dan bisa diakses dari mobile browser.

---

### 42.2 Koperasi

**Q: Bagaimana cara menambah anggota banyak sekaligus?**
A: Gunakan fitur Import Data di menu Master Anggota.

**Q: Apakah simpanan pokok bisa ditarik?**
A: Tidak, simpanan pokok tidak bisa ditarik selama masih menjadi anggota.

**Q: Bagaimana cara menghitung bunga pinjaman?**
A: Sistem menghitung otomatis saat input pinjaman baru.

---

### 42.3 POS

**Q: Apakah bisa transaksi tanpa barcode?**
A: Ya, gunakan pencarian manual atau pilih dari daftar barang.

**Q: Berapa batas kredit anggota?**
A: Default Rp 2.000.000, bisa diubah di Pengaturan Sistem.

**Q: Apakah bisa edit transaksi yang sudah diproses?**
A: Tidak, transaksi yang sudah diproses tidak bisa diedit. Hanya bisa dihapus oleh Super Admin.

---

### 42.4 Keuangan

**Q: Bagaimana cara input saldo awal?**
A: Gunakan menu Saldo Awal Periode, input per akun atau upload massal.

**Q: Apakah jurnal otomatis bisa diedit?**
A: Tidak disarankan. Lebih baik edit transaksi sumbernya.

**Q: Bagaimana cara tutup periode?**
A: Backup data, generate laporan, lalu input saldo awal periode baru.

---

## 43. Tips dan Trik

### 43.1 Produktivitas

**Keyboard Shortcuts:**
- F2: Fokus ke input barcode (di POS)
- Ctrl+F: Search/Filter
- Esc: Tutup modal
- Enter: Submit form

**Quick Actions:**
- Double-click row untuk edit (di beberapa tabel)
- Klik logo untuk kembali ke dashboard
- Gunakan search untuk cari data cepat

### 43.2 Data Management

**Backup Strategy:**
- Harian: Backup otomatis (jika ada)
- Mingguan: Manual backup
- Bulanan: Full backup + simpan di cloud
- Tahunan: Archive backup

**Naming Convention:**
- Gunakan kode yang konsisten (BRG001, SUP001, dll)
- Gunakan nama yang deskriptif
- Hindari karakter spesial

### 43.3 Keamanan

**Password:**
- Minimal 8 karakter
- Kombinasi huruf, angka, simbol
- Ganti setiap 3 bulan
- Jangan share dengan orang lain

**Access Control:**
- Berikan akses sesuai kebutuhan
- Review user access secara berkala
- Nonaktifkan user yang sudah tidak aktif

---

## 44. Kontak Support

### 44.1 Informasi Kontak

**Email:** support@koperasi.com
**WhatsApp:** +62 xxx-xxxx-xxxx
**Website:** www.koperasi.com/support

**Jam Operasional:**
- Senin - Jumat: 08:00 - 17:00 WIB
- Sabtu: 08:00 - 12:00 WIB
- Minggu & Libur: Tutup

### 44.2 Sebelum Menghubungi Support

**Siapkan Informasi:**
1. Versi aplikasi
2. Browser yang digunakan
3. Deskripsi masalah
4. Screenshot error (jika ada)
5. Langkah-langkah yang sudah dicoba

**Cek Dulu:**
1. Baca panduan ini
2. Cek FAQ
3. Coba troubleshooting dasar
4. Tanya ke administrator lokal

### 44.3 Pelaporan Bug

**Format Laporan:**
```
Judul: [Deskripsi singkat masalah]

Deskripsi:
[Jelaskan masalah secara detail]

Langkah Reproduksi:
1. [Langkah 1]
2. [Langkah 2]
3. [Langkah 3]

Expected Result:
[Apa yang seharusnya terjadi]

Actual Result:
[Apa yang sebenarnya terjadi]

Screenshot:
[Lampirkan screenshot jika ada]

Environment:
- Browser: [Chrome/Firefox/Edge]
- OS: [Windows/Mac/Linux]
- Versi Aplikasi: [1.0.0]
```

---

# PENUTUP

## Terima Kasih

Terima kasih telah menggunakan **Aplikasi Koperasi Karyawan**. Kami berharap panduan ini membantu Anda dalam mengoperasikan aplikasi dengan maksimal.

## Feedback

Kami sangat menghargai feedback Anda untuk perbaikan aplikasi dan dokumentasi. Silakan kirim saran dan kritik ke: feedback@koperasi.com

## Update Dokumentasi

Dokumentasi ini akan diupdate secara berkala seiring dengan perkembangan aplikasi. Cek versi terbaru di website kami.

## Lisensi

© 2024 Aplikasi Koperasi Karyawan. All Rights Reserved.

---

**Versi Panduan: 1.0.0**
**Tanggal: Januari 2024**
**Untuk Aplikasi Versi: 1.0.0**

---

**SELAMAT MENGGUNAKAN APLIKASI!** 🎉

