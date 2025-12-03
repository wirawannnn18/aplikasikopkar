# Panduan Backup & Restore Database

## Daftar Isi
1. [Pengenalan](#pengenalan)
2. [Akses Fitur](#akses-fitur)
3. [Membuat Backup](#membuat-backup)
4. [Restore Database](#restore-database)
5. [Tips & Best Practices](#tips--best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Pengenalan

Fitur **Backup & Restore** memungkinkan Anda untuk:
- ✅ Mengekspor seluruh data koperasi ke file backup (format JSON)
- ✅ Mengimpor data dari file backup
- ✅ Melindungi data dari kehilangan
- ✅ Memigrasikan data antar instalasi
- ✅ Membuat backup otomatis sebelum restore

### Siapa yang Dapat Mengakses?
Fitur ini **hanya tersedia** untuk:
- 🔐 **Super Admin**
- 🔐 **Administrator**

---

## Akses Fitur

### Langkah-langkah:
1. Login sebagai Super Admin atau Administrator
2. Klik menu **"Backup & Restore"** di sidebar
3. Halaman Backup & Restore akan terbuka

### Tampilan Halaman:
Halaman ini menampilkan:
- 📊 **Statistik Data**: Total records, kategori data, estimasi ukuran, backup terakhir
- 💾 **Tombol Backup**: Untuk membuat backup baru
- 📤 **Tombol Restore**: Untuk restore dari file backup
- 📋 **Daftar Kategori**: Menampilkan semua kategori data dengan jumlah records
- 🕐 **Riwayat Backup**: 10 backup terakhir yang dibuat

---

## Membuat Backup

### Backup Lengkap (Full Backup)

#### Langkah-langkah:
1. Klik tombol **"Buat Backup"**
2. Dialog "Opsi Backup" akan muncul
3. Pilih **"Full Backup"** (sudah dipilih secara default)
4. Lihat estimasi ukuran file
5. Klik **"Buat Backup"**
6. File backup akan otomatis terdownload

#### Format Nama File:
```
backup_[NamaKoperasi]_[Tanggal-Waktu].json
```
Contoh: `backup_Koperasi_Sejahtera_2024-01-15T10-30-00.json`

#### Isi Backup:
Full backup mencakup **semua data**:
- ✅ Data Koperasi
- ✅ Pengguna (password dilindungi)
- ✅ Anggota
- ✅ Departemen
- ✅ Simpanan (Pokok, Wajib, Sukarela)
- ✅ Pinjaman
- ✅ Chart of Accounts (COA)
- ✅ Jurnal
- ✅ Barang & Kategori
- ✅ Supplier
- ✅ Pembelian & Penjualan
- ✅ Stok Opname
- ✅ Saldo Awal Periode

---

### Backup Parsial (Partial Backup)

#### Langkah-langkah:
1. Klik tombol **"Buat Backup"**
2. Pilih **"Partial Backup"**
3. Pilih kategori data yang ingin di-backup:
   - Centang kategori yang diinginkan
   - Atau gunakan tombol "Pilih Semua" / "Hapus Semua"
4. Estimasi ukuran akan update otomatis
5. Klik **"Buat Backup"**

#### Format Nama File:
```
backup_[NamaKoperasi]_[Tanggal-Waktu]_partial.json
```

#### Kapan Menggunakan Partial Backup?
- 📦 Backup data tertentu saja (misal: hanya anggota dan simpanan)
- 💾 Ukuran file lebih kecil
- ⚡ Download lebih cepat
- 🔄 Transfer data spesifik antar koperasi

---

## Restore Database

### ⚠️ PERINGATAN PENTING!
**Restore akan mengganti SELURUH data aplikasi saat ini!**
- Data yang tidak ada dalam backup akan hilang (untuk full restore)
- Tindakan ini **TIDAK DAPAT DIBATALKAN**
- Backup otomatis akan dibuat sebelum restore dimulai

---

### Langkah-langkah Restore:

#### 1. Pilih File Backup
1. Klik tombol **"Restore dari Backup"**
2. Pilih file backup (.json) dari komputer Anda
3. Sistem akan memvalidasi file

#### 2. Preview Backup
Setelah file valid, Anda akan melihat:
- 📋 **Informasi Backup**:
  - Nama Koperasi
  - Tanggal Backup
  - Versi Aplikasi
  - Tipe Backup (Full/Partial)
- 📊 **Statistik Data**:
  - Total Records
  - Jumlah Kategori
  - Ukuran File
  - Rincian per Kategori
- ⚠️ **Peringatan Kompatibilitas** (jika ada)

Klik **"Lanjutkan"** untuk melanjutkan.

#### 3. Konfirmasi Restore
Dialog konfirmasi akan menampilkan:
- ⚠️ **Peringatan**: Tindakan tidak dapat dibatalkan
- 📋 **Informasi Backup**: Detail backup yang akan di-restore
- 📝 **Dampak Restore**: Apa yang akan terjadi
- ☑️ **Checkbox Konfirmasi**: Harus dicentang
- 🔑 **Kata Kunci**: Ketik **"RESTORE"** (huruf besar)

#### 4. Proses Restore
Setelah konfirmasi:
1. ✅ Backup otomatis dibuat (file: `backup_pre-restore_...json`)
2. 🔄 Data di-restore ke aplikasi
3. ✅ Verifikasi integritas data
4. 🔄 Aplikasi akan reload otomatis

---

## Tips & Best Practices

### 📅 Jadwal Backup Rutin
- **Harian**: Untuk koperasi dengan transaksi tinggi
- **Mingguan**: Untuk koperasi dengan transaksi sedang
- **Bulanan**: Minimal backup bulanan untuk semua koperasi

### 💾 Penyimpanan Backup
- Simpan backup di **multiple lokasi**:
  - 💻 Komputer lokal
  - ☁️ Cloud storage (Google Drive, Dropbox, dll)
  - 💿 External hard drive
  - 📧 Email ke diri sendiri
- Jangan hanya mengandalkan satu lokasi!

### 🏷️ Penamaan File
- Gunakan nama yang deskriptif
- Tambahkan catatan jika perlu (misal: "sebelum_upgrade")
- Simpan backup penting dengan label khusus

### ✅ Verifikasi Backup
- Setelah membuat backup, coba buka file dengan text editor
- Pastikan file tidak kosong atau rusak
- Sesekali test restore di environment testing

### 🔐 Keamanan
- Password dalam backup sudah dilindungi
- Jangan share file backup sembarangan
- Simpan backup di lokasi yang aman

---

## Troubleshooting

### ❌ "File backup tidak valid"
**Penyebab:**
- File bukan format JSON yang benar
- File rusak atau tidak lengkap
- File di-edit manual

**Solusi:**
- Download ulang file backup
- Jangan edit file backup secara manual
- Pastikan file tidak rusak saat transfer

---

### ❌ "Versi tidak kompatibel"
**Penyebab:**
- Backup dari versi aplikasi yang berbeda

**Solusi:**
- Sistem akan mencoba migrasi otomatis
- Baca peringatan dengan teliti
- Jika ragu, konsultasikan dengan support

---

### ❌ "Penyimpanan browser penuh"
**Penyebab:**
- localStorage browser sudah penuh
- Data terlalu besar untuk browser

**Solusi:**
- Hapus data yang tidak diperlukan
- Gunakan browser lain
- Clear cache browser (hati-hati, data akan hilang!)

---

### ❌ "Gagal membuat backup otomatis"
**Penyebab:**
- Error saat membuat pre-restore backup

**Solusi:**
- Restore akan dibatalkan untuk keamanan
- Coba lagi beberapa saat
- Pastikan browser tidak dalam mode private/incognito

---

### ❌ File backup terlalu besar
**Penyebab:**
- Data koperasi sangat banyak

**Solusi:**
- Gunakan **Partial Backup** untuk kategori tertentu
- Backup per kategori secara terpisah
- Compress file backup (zip) sebelum upload ke cloud

---

### ❌ "Restore terganggu"
**Penyebab:**
- Browser crash atau ditutup saat restore
- Koneksi terputus

**Solusi:**
- Gunakan backup pre-restore yang otomatis dibuat
- File: `backup_pre-restore_[NamaKoperasi]_[Waktu].json`
- Restore dari file tersebut untuk kembali ke kondisi sebelumnya

---

## Fitur Lanjutan

### 🔄 Migrasi Data Antar Versi
Sistem secara otomatis melakukan migrasi data jika:
- Backup dari versi lama di-restore ke versi baru
- Backup dari versi baru di-restore ke versi lama (tidak disarankan)

Log migrasi akan ditampilkan setelah restore selesai.

### 📊 Estimasi Ukuran Real-time
Saat memilih kategori untuk partial backup, estimasi ukuran akan update secara real-time.

### ⚠️ Peringatan File Besar
Jika ukuran backup > 5MB, sistem akan menampilkan peringatan bahwa download mungkin memakan waktu.

---

## Kontak Support

Jika mengalami masalah atau butuh bantuan:
- 📧 Email: support@koperasi.com
- 📱 WhatsApp: +62 xxx-xxxx-xxxx
- 🌐 Website: www.koperasi.com/support

---

## Changelog

### Versi 1.0.0
- ✅ Full backup & restore
- ✅ Partial backup
- ✅ Auto backup sebelum restore
- ✅ Validasi integritas data
- ✅ Migrasi versi otomatis
- ✅ Riwayat backup
- ✅ Estimasi ukuran real-time

---

**© 2024 Koperasi Karyawan - Sistem Manajemen Terintegrasi**
