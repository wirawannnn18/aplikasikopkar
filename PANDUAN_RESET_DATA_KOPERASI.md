# Panduan Reset Data Koperasi

## Daftar Isi
1. [Pengenalan](#pengenalan)
2. [Kapan Menggunakan Fitur Reset](#kapan-menggunakan-fitur-reset)
3. [Persiapan Sebelum Reset](#persiapan-sebelum-reset)
4. [Cara Menggunakan](#cara-menggunakan)
5. [Jenis Reset](#jenis-reset)
6. [Setelah Reset](#setelah-reset)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)

## Pengenalan

Fitur **Reset Data Koperasi** memungkinkan administrator untuk menghapus seluruh atau sebagian data dari aplikasi koperasi. Fitur ini dirancang untuk mempersiapkan aplikasi agar dapat digunakan kembali untuk koperasi yang berbeda atau untuk keperluan testing dan development.

### Fitur Keamanan

- ✅ **Backup Otomatis**: Sistem secara otomatis membuat backup lengkap sebelum reset
- ✅ **Konfirmasi Berlapis**: Dua tingkat konfirmasi untuk mencegah penghapusan tidak sengaja
- ✅ **Audit Trail**: Semua operasi reset dicatat dalam audit log
- ✅ **Session Protection**: Session login aktif tidak akan dihapus
- ✅ **Test Mode**: Mode simulasi untuk testing tanpa menghapus data sebenarnya

## Kapan Menggunakan Fitur Reset

### Gunakan Fitur Ini Untuk:

1. **Deployment ke Koperasi Baru**
   - Aplikasi sudah digunakan untuk testing/demo
   - Ingin menggunakan aplikasi untuk koperasi yang berbeda
   - Perlu membersihkan data demo sebelum production

2. **Testing dan Development**
   - Menguji fitur dengan data bersih
   - Reset data testing setelah selesai development
   - Membuat environment testing yang konsisten

3. **Migrasi Data**
   - Mempersiapkan sistem untuk import data baru
   - Membersihkan data lama sebelum migrasi

### JANGAN Gunakan Untuk:

- ❌ Menghapus data transaksi tertentu (gunakan fitur hapus transaksi)
- ❌ Membersihkan data secara berkala (tidak diperlukan)
- ❌ Mengatasi masalah performa (gunakan optimasi lain)

## Persiapan Sebelum Reset

### Checklist Persiapan

- [ ] **Pastikan Anda adalah Super Administrator**
  - Hanya super admin yang dapat melakukan reset
  - Verifikasi role Anda di profil pengguna

- [ ] **Backup Manual (Opsional tapi Disarankan)**
  - Buat backup manual melalui menu Backup & Restore
  - Simpan file backup di lokasi yang aman
  - Verifikasi file backup dapat dibuka

- [ ] **Informasikan Tim**
  - Beritahu semua pengguna bahwa sistem akan direset
  - Pastikan tidak ada transaksi yang sedang berjalan
  - Jadwalkan reset di luar jam operasional

- [ ] **Catat Informasi Penting**
  - Nama koperasi
  - Pengaturan sistem yang perlu dikonfigurasi ulang
  - Daftar pengguna yang perlu dibuat ulang

## Cara Menggunakan

### Langkah 1: Akses Halaman Reset

1. Login sebagai Super Administrator
2. Buka menu **Pengaturan Sistem**
3. Scroll ke bagian **Reset Data Koperasi**
4. Klik tombol **"Buka Halaman Reset Data"**

### Langkah 2: Pilih Tipe Reset

#### Reset Semua Data (Full Reset)
- Menghapus **seluruh data** koperasi
- Hanya session login yang dipertahankan
- Cocok untuk deployment ke koperasi baru

#### Reset Selektif (Selective Reset)
- Pilih kategori data tertentu yang akan dihapus
- Data lain tetap dipertahankan
- Cocok untuk membersihkan data testing tertentu

### Langkah 3: Pilih Kategori (Jika Reset Selektif)

Jika memilih reset selektif, pilih kategori data yang ingin dihapus:

**Master Data:**
- Data Anggota
- Departemen
- Pengguna (protected - tidak bisa dihapus)
- Data Barang
- Data Supplier
- Kategori Barang
- Satuan Barang

**Data Transaksi:**
- Simpanan Pokok
- Simpanan Wajib
- Simpanan Sukarela
- Pinjaman
- Transaksi POS/Penjualan
- Pembelian
- Jurnal Akuntansi

**Pengaturan Sistem:**
- Data Koperasi
- Chart of Accounts
- Periode Akuntansi
- Pengaturan Aplikasi

### Langkah 4: Konfirmasi Reset

#### Konfirmasi Pertama
- Sistem menampilkan daftar data yang akan dihapus
- Review dengan teliti
- Klik **"Lanjutkan"** jika yakin

#### Konfirmasi Kedua (Final)
- Baca peringatan dengan seksama
- Ketik **"HAPUS SEMUA DATA"** (huruf besar semua)
- Klik **"Reset Sekarang"**

### Langkah 5: Proses Reset

- Sistem membuat backup otomatis
- File backup akan diunduh ke komputer Anda
- Progress bar menunjukkan proses penghapusan
- **JANGAN tutup browser** selama proses berlangsung

### Langkah 6: Verifikasi Hasil

- Sistem menampilkan ringkasan hasil reset
- Verifikasi jumlah records yang dihapus
- Simpan informasi backup file

## Jenis Reset

### 1. Full Reset (Reset Semua Data)

**Yang Dihapus:**
- ✅ Semua data master (anggota, barang, supplier, dll)
- ✅ Semua data transaksi (simpanan, pinjaman, POS, dll)
- ✅ Semua pengaturan sistem (kecuali session)
- ✅ Chart of Accounts
- ✅ Periode akuntansi

**Yang Dipertahankan:**
- ✅ Session login aktif
- ✅ Audit log reset

**Cocok Untuk:**
- Deployment ke koperasi baru
- Reset total untuk memulai dari awal

### 2. Selective Reset (Reset Selektif)

**Fleksibilitas:**
- Pilih kategori data tertentu
- Data lain tetap utuh
- Kontrol penuh atas apa yang dihapus

**Cocok Untuk:**
- Menghapus data testing tertentu
- Membersihkan kategori data spesifik
- Persiapan import data tertentu

### 3. Test Mode (Mode Simulasi)

**Fitur:**
- Tidak menghapus data sebenarnya
- Menampilkan simulasi hasil reset
- Cocok untuk testing dan training

**Cara Menggunakan:**
1. Klik **"Aktifkan Test Mode"** di halaman reset
2. Lakukan proses reset seperti biasa
3. Lihat hasil simulasi
4. Download laporan simulasi jika diperlukan

## Setelah Reset

### Setup Wizard

Setelah reset berhasil, sistem menampilkan **Setup Wizard** dengan langkah-langkah:

1. **Data Koperasi** (Wajib)
   - Nama koperasi
   - Alamat dan kontak
   - Logo koperasi

2. **Periode Akuntansi** (Wajib)
   - Tentukan periode aktif
   - Set tanggal mulai

3. **Chart of Accounts** (Wajib)
   - Setup akun-akun akuntansi
   - Import COA template atau buat manual

4. **Pengguna** (Wajib)
   - Buat akun administrator
   - Buat akun staff

5. **Departemen** (Opsional)
   - Buat struktur departemen

6. **Data Anggota** (Wajib)
   - Input data anggota
   - Import dari CSV jika ada

### Restore dari Backup

Jika perlu membatalkan reset:

1. Buka menu **Backup & Restore**
2. Pilih file backup yang dibuat sebelum reset
3. Klik **"Restore"**
4. Konfirmasi restore
5. Tunggu proses selesai

## Troubleshooting

### Masalah: Tombol Reset Disabled

**Penyebab:**
- Tidak ada kategori yang dipilih (reset selektif)
- Validasi gagal

**Solusi:**
- Pilih minimal 1 kategori untuk reset selektif
- Atau pilih "Reset Semua Data"

### Masalah: Backup Gagal Dibuat

**Penyebab:**
- Storage browser penuh
- Browser tidak mendukung download

**Solusi:**
- Bersihkan cache browser
- Coba browser lain (Chrome/Firefox)
- Buat backup manual terlebih dahulu

### Masalah: Reset Gagal di Tengah Proses

**Penyebab:**
- Koneksi terputus
- Browser crash
- Error sistem

**Solusi:**
- Restore dari backup otomatis yang sudah dibuat
- Coba reset ulang
- Hubungi administrator sistem

### Masalah: Data Tidak Terhapus Sempurna

**Penyebab:**
- Error saat penghapusan
- Kategori protected

**Solusi:**
- Lihat log error di hasil reset
- Coba hapus kategori yang gagal secara manual
- Lakukan reset ulang

### Masalah: Tidak Bisa Akses Halaman Reset

**Penyebab:**
- Bukan super admin
- Session expired

**Solusi:**
- Verifikasi role pengguna
- Login ulang sebagai super admin
- Hubungi administrator untuk upgrade role

## FAQ

### Q: Apakah data bisa dikembalikan setelah reset?

**A:** Ya, data bisa dikembalikan dari file backup yang dibuat otomatis sebelum reset. Pastikan Anda menyimpan file backup dengan baik.

### Q: Berapa lama proses reset?

**A:** Tergantung jumlah data:
- Data kecil (< 1000 records): 10-30 detik
- Data sedang (1000-10000 records): 30-60 detik
- Data besar (> 10000 records): 1-3 menit

### Q: Apakah reset menghapus audit log?

**A:** Tidak. Audit log reset tetap disimpan untuk keperluan audit dan compliance.

### Q: Bisa reset hanya data transaksi saja?

**A:** Ya, gunakan **Reset Selektif** dan pilih hanya kategori data transaksi yang ingin dihapus.

### Q: Apakah ada batasan berapa kali bisa reset?

**A:** Ada cooldown period 5 menit antara reset untuk mencegah penyalahgunaan. Setelah 5 menit, Anda bisa melakukan reset lagi.

### Q: Bagaimana cara testing fitur reset tanpa menghapus data?

**A:** Gunakan **Test Mode**. Aktifkan test mode sebelum melakukan reset, dan sistem hanya akan menampilkan simulasi tanpa menghapus data sebenarnya.

### Q: Apakah session login akan hilang setelah reset?

**A:** Tidak. Session login aktif dipertahankan sehingga Anda tidak perlu login ulang setelah reset.

### Q: Bisa reset data dari periode tertentu saja?

**A:** Tidak. Reset menghapus seluruh data dalam kategori yang dipilih. Untuk menghapus data periode tertentu, gunakan fitur hapus transaksi.

### Q: Bagaimana jika lupa menyimpan backup?

**A:** Sistem secara otomatis membuat dan mengunduh backup sebelum reset. File backup akan tersimpan di folder download browser Anda. Namun, disarankan untuk membuat backup manual tambahan sebelum reset.

### Q: Apakah reset mempengaruhi performa aplikasi?

**A:** Tidak. Reset justru dapat meningkatkan performa dengan mengurangi jumlah data yang disimpan di localStorage.

---

## Kontak Support

Jika mengalami masalah atau memiliki pertanyaan:

- 📧 Email: support@koperasi-app.com
- 📱 WhatsApp: +62 xxx-xxxx-xxxx
- 📖 Dokumentasi: [Link ke dokumentasi lengkap]

---

**Catatan Penting:** Selalu buat backup sebelum melakukan reset, meskipun sistem sudah membuat backup otomatis. Backup ganda memberikan perlindungan ekstra untuk data Anda.

