# Dokumentasi Error Messages dan Troubleshooting - Import Tagihan Pembayaran

## Daftar Isi
1. [Error Categories](#error-categories)
2. [File Upload Errors](#file-upload-errors)
3. [Data Validation Errors](#data-validation-errors)
4. [Processing Errors](#processing-errors)
5. [System Errors](#system-errors)
6. [Troubleshooting Guide](#troubleshooting-guide)
7. [Recovery Procedures](#recovery-procedures)

## Error Categories

Sistem mengkategorikan error menjadi 4 kategori utama:

### 1. File Errors (FE)
Error yang terjadi saat upload dan parsing file

### 2. Validation Errors (VE)
Error yang terjadi saat validasi data import

### 3. Processing Errors (PE)
Error yang terjadi saat pemrosesan transaksi

### 4. System Errors (SE)
Error yang terjadi karena masalah sistem atau infrastruktur

## File Upload Errors

### FE001: File format tidak didukung
**Error Message**: "File format tidak didukung. Hanya file CSV dan Excel (.xlsx) yang diizinkan."

**Penyebab**:
- File yang diupload bukan format CSV atau XLSX
- Ekstensi file tidak sesuai dengan content

**Solusi**:
1. Pastikan file berekstensi .csv atau .xlsx
2. Jika dari Excel, gunakan "Save As" → CSV atau Excel Workbook
3. Jangan mengubah ekstensi file secara manual

**Contoh**:
```
❌ file.txt, file.doc, file.pdf
✅ data.csv, import.xlsx
```

### FE002: Ukuran file melebihi batas maksimum
**Error Message**: "Ukuran file melebihi batas maksimum 5MB. Ukuran file Anda: [size]MB"

**Penyebab**:
- File lebih besar dari 5MB
- File mengandung data yang tidak perlu (gambar, formatting berlebihan)

**Solusi**:
1. Bagi file menjadi beberapa batch kecil
2. Hapus kolom yang tidak diperlukan
3. Untuk Excel: hapus formatting, gambar, dan sheet yang tidak perlu
4. Kompres file jika memungkinkan

**Best Practice**:
- Maksimal 500 transaksi per file
- Gunakan format CSV untuk file besar

### FE003: File kosong atau tidak memiliki data
**Error Message**: "File kosong atau tidak memiliki data. Pastikan file mengandung minimal 1 baris data selain header."

**Penyebab**:
- File hanya berisi header tanpa data
- File benar-benar kosong
- Semua baris data kosong

**Solusi**:
1. Pastikan ada minimal 1 baris data setelah header
2. Cek apakah data tidak terhapus secara tidak sengaja
3. Pastikan tidak ada baris kosong di awal file

### FE004: Struktur kolom tidak sesuai template
**Error Message**: "Struktur kolom tidak sesuai template. Kolom yang hilang: [missing_columns]"

**Penyebab**:
- Header tidak sesuai dengan template
- Ada kolom wajib yang hilang
- Nama kolom tidak persis sama (case-sensitive)

**Solusi**:
1. Download template terbaru dari sistem
2. Copy data ke template yang benar
3. Pastikan nama kolom persis sama:
   - `nomor_anggota`
   - `nama_anggota`
   - `jenis_pembayaran`
   - `jumlah_pembayaran`
   - `keterangan`

### FE005: Error parsing file
**Error Message**: "Gagal membaca file. File mungkin rusak atau format tidak valid."

**Penyebab**:
- File rusak atau corrupt
- Encoding tidak sesuai (untuk CSV)
- Format internal file tidak valid

**Solusi**:
1. Coba buka file di aplikasi lain (Excel, Notepad)
2. Untuk CSV: pastikan encoding UTF-8
3. Buat ulang file dari template baru
4. Cek apakah file tidak terpotong saat transfer

## Data Validation Errors

### VE001: Nomor anggota tidak ditemukan
**Error Message**: "Nomor anggota '[nomor]' tidak ditemukan dalam database pada baris [row]"

**Penyebab**:
- Nomor anggota tidak terdaftar di sistem
- Salah ketik nomor anggota
- Anggota sudah dihapus dari sistem

**Solusi**:
1. Cek master data anggota di sistem
2. Pastikan penulisan nomor anggota benar
3. Pastikan anggota masih aktif
4. Hubungi admin jika anggota seharusnya ada

### VE002: Nama anggota tidak sesuai
**Error Message**: "Nama anggota '[nama]' tidak sesuai dengan nomor anggota '[nomor]' pada baris [row]"

**Penyebab**:
- Nama tidak sesuai dengan yang terdaftar
- Salah ketik nama anggota
- Nomor dan nama tidak cocok

**Solusi**:
1. Cek nama anggota di master data
2. Pastikan nama ditulis lengkap dan benar
3. Perhatikan penggunaan huruf besar/kecil
4. Cek apakah ada karakter khusus yang hilang

### VE003: Jenis pembayaran tidak valid
**Error Message**: "Jenis pembayaran '[jenis]' tidak valid pada baris [row]. Hanya 'hutang' atau 'piutang' yang diizinkan."

**Penyebab**:
- Nilai selain 'hutang' atau 'piutang'
- Penggunaan huruf besar
- Ada spasi di awal/akhir

**Solusi**:
1. Gunakan hanya 'hutang' atau 'piutang'
2. Pastikan huruf kecil semua
3. Hapus spasi di awal dan akhir
4. Jangan gunakan sinonim (kredit, debit, dll)

### VE004: Format jumlah pembayaran tidak valid
**Error Message**: "Format jumlah pembayaran tidak valid pada baris [row]. Gunakan angka positif tanpa separator."

**Penyebab**:
- Menggunakan separator (titik, koma)
- Menggunakan mata uang (Rp, $)
- Nilai negatif atau nol
- Bukan angka

**Solusi**:
1. Gunakan angka saja: 500000
2. Jangan gunakan: 500.000, 500,000, Rp 500000
3. Pastikan nilai positif (> 0)
4. Hapus semua karakter non-angka

### VE005: Jumlah pembayaran melebihi saldo
**Error Message**: "Jumlah pembayaran [jumlah] melebihi saldo [jenis] anggota [nomor] sebesar [saldo] pada baris [row]"

**Penyebab**:
- Jumlah bayar lebih besar dari saldo hutang/piutang
- Saldo anggota sudah berubah sejak data disiapkan
- Salah input jumlah

**Solusi**:
1. Cek saldo terkini anggota di sistem
2. Sesuaikan jumlah pembayaran
3. Pastikan jenis pembayaran benar (hutang/piutang)
4. Lakukan pembayaran parsial jika perlu

### VE006: Data wajib kosong
**Error Message**: "Kolom '[kolom]' tidak boleh kosong pada baris [row]"

**Penyebab**:
- Kolom wajib tidak diisi
- Cell kosong atau hanya berisi spasi

**Solusi**:
1. Isi semua kolom wajib:
   - nomor_anggota
   - nama_anggota
   - jenis_pembayaran
   - jumlah_pembayaran
2. Pastikan tidak ada cell yang hanya berisi spasi
3. Hapus baris yang tidak diperlukan

## Processing Errors

### PE001: Gagal memproses transaksi
**Error Message**: "Gagal memproses transaksi untuk anggota [nomor] pada baris [row]: [detail_error]"

**Penyebab**:
- Error saat membuat jurnal
- Gagal update saldo anggota
- Konflik data saat pemrosesan

**Solusi**:
1. Coba proses ulang dengan file yang lebih kecil
2. Pastikan tidak ada proses lain yang mengubah data anggota
3. Hubungi admin jika error berlanjut

### PE002: Saldo tidak mencukupi saat pemrosesan
**Error Message**: "Saldo [jenis] anggota [nomor] tidak mencukupi saat pemrosesan. Saldo saat ini: [saldo]"

**Penyebab**:
- Saldo berubah antara validasi dan pemrosesan
- Ada transaksi lain yang mempengaruhi saldo
- Proses concurrent dari user lain

**Solusi**:
1. Refresh data dan coba lagi
2. Cek transaksi terbaru anggota
3. Sesuaikan jumlah pembayaran
4. Proses satu per satu jika perlu

### PE003: Error pencatatan jurnal
**Error Message**: "Gagal mencatat jurnal untuk transaksi anggota [nomor]: [detail_error]"

**Penyebab**:
- Masalah dengan chart of accounts
- Error sistem akuntansi
- Konfigurasi jurnal tidak lengkap

**Solusi**:
1. Hubungi admin sistem
2. Cek konfigurasi akuntansi
3. Pastikan COA sudah lengkap
4. Lakukan rollback jika perlu

## System Errors

### SE001: Koneksi database terputus
**Error Message**: "Koneksi ke database terputus. Silakan coba lagi dalam beberapa saat."

**Penyebab**:
- Masalah jaringan
- Database server down
- Timeout koneksi

**Solusi**:
1. Tunggu beberapa menit dan coba lagi
2. Cek koneksi internet
3. Hubungi admin jika masalah berlanjut
4. Simpan file untuk diproses nanti

### SE002: Memori sistem tidak cukup
**Error Message**: "Memori sistem tidak cukup untuk memproses file ini. Coba dengan file yang lebih kecil."

**Penyebab**:
- File terlalu besar
- Sistem sedang sibuk
- Memory leak

**Solusi**:
1. Bagi file menjadi batch kecil (maksimal 100 transaksi)
2. Coba saat sistem tidak sibuk
3. Tutup aplikasi lain yang tidak perlu
4. Hubungi admin untuk optimasi sistem

### SE003: Timeout pemrosesan
**Error Message**: "Timeout saat memproses batch. Proses dihentikan untuk mencegah error sistem."

**Penyebab**:
- File terlalu besar
- Sistem lambat
- Proses terlalu lama

**Solusi**:
1. Bagi file menjadi batch kecil
2. Coba saat jam tidak sibuk
3. Pastikan koneksi internet stabil
4. Hubungi admin untuk konfigurasi timeout

### SE004: Error autentikasi
**Error Message**: "Sesi Anda telah berakhir. Silakan login ulang."

**Penyebab**:
- Session timeout
- Login dari device lain
- Masalah autentikasi

**Solusi**:
1. Login ulang ke sistem
2. Upload file kembali
3. Pastikan tidak login dari multiple device
4. Hubungi admin jika masalah berlanjut

## Troubleshooting Guide

### Langkah Umum Troubleshooting

#### 1. Identifikasi Error
- Catat kode error dan pesan lengkap
- Screenshot error message
- Catat waktu terjadinya error

#### 2. Cek File Input
- Validasi format file (CSV/XLSX)
- Cek ukuran file (< 5MB)
- Pastikan struktur sesuai template
- Validasi data secara manual

#### 3. Cek Sistem
- Pastikan koneksi internet stabil
- Cek apakah sistem tidak sedang maintenance
- Pastikan browser up-to-date
- Clear cache browser jika perlu

#### 4. Cek Data
- Validasi nomor anggota di master data
- Cek saldo anggota terkini
- Pastikan anggota masih aktif
- Verifikasi jenis pembayaran

### Troubleshooting Berdasarkan Gejala

#### File tidak bisa diupload
1. Cek format file (harus CSV atau XLSX)
2. Cek ukuran file (maksimal 5MB)
3. Coba browser lain
4. Disable antivirus sementara
5. Coba koneksi internet lain

#### Validasi gagal untuk banyak baris
1. Download template terbaru
2. Copy data ke template baru
3. Cek master data anggota
4. Validasi format data satu per satu
5. Test dengan data kecil dulu

#### Proses terhenti di tengah jalan
1. Jangan refresh browser
2. Tunggu hingga timeout
3. Cek hasil yang sudah diproses
4. Lanjutkan dengan data yang belum diproses
5. Hubungi admin jika perlu rollback

#### Error sistem berulang
1. Catat detail error dan waktu
2. Coba dengan file kecil
3. Coba di waktu yang berbeda
4. Hubungi admin dengan log error
5. Gunakan proses manual sementara

## Recovery Procedures

### Rollback Transaksi

#### Kapan Perlu Rollback
- Error kritis saat pemrosesan
- Data salah yang sudah diproses
- Permintaan pembatalan dari user

#### Cara Melakukan Rollback
1. **Otomatis**: Sistem akan rollback otomatis jika ada error kritis
2. **Manual**: Hubungi admin dengan batch ID
3. **Parsial**: Rollback transaksi tertentu saja

#### Data yang Di-rollback
- Saldo anggota dikembalikan ke kondisi sebelum import
- Jurnal transaksi dihapus atau di-reverse
- Audit log tetap disimpan untuk tracking

### Recovery Data

#### Backup Data
- Sistem otomatis backup sebelum proses batch
- Backup disimpan selama 30 hari
- Admin dapat restore dari backup jika perlu

#### Manual Recovery
1. Identifikasi transaksi yang bermasalah
2. Hitung dampak ke saldo anggota
3. Buat jurnal koreksi manual
4. Update saldo anggota
5. Dokumentasi untuk audit

### Preventive Measures

#### Sebelum Import
- Selalu test dengan data kecil
- Backup data penting
- Validasi data di Excel
- Koordinasi dengan kasir lain

#### Saat Import
- Monitor progress secara aktif
- Jangan tutup browser
- Siapkan koneksi backup
- Catat waktu mulai proses

#### Setelah Import
- Download dan simpan laporan
- Verifikasi hasil secara sampling
- Follow-up transaksi yang gagal
- Update dokumentasi jika perlu

## Kontak Support

### Level 1: Self-Service
- Gunakan panduan troubleshooting ini
- Cek FAQ di sistem
- Coba solusi yang disarankan

### Level 2: Admin Sistem
- Error teknis yang tidak bisa diatasi
- Masalah konfigurasi sistem
- Permintaan rollback

### Level 3: IT Support
- Error sistem kritis
- Masalah infrastruktur
- Recovery data dari backup

### Level 4: Vendor Support
- Bug sistem yang kompleks
- Update atau patch sistem
- Customization khusus

---

**Catatan**: Dokumentasi ini akan diupdate seiring dengan perkembangan sistem. Selalu gunakan versi terbaru untuk troubleshooting yang akurat.