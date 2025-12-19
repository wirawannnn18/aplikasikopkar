# Troubleshooting Guide - Integrasi Pembayaran Hutang Piutang

## Daftar Isi
1. [Masalah Interface dan Navigasi](#masalah-interface-dan-navigasi)
2. [Masalah Tab Switching](#masalah-tab-switching)
3. [Masalah Pembayaran Manual](#masalah-pembayaran-manual)
4. [Masalah Import Batch](#masalah-import-batch)
5. [Masalah Data dan Sinkronisasi](#masalah-data-dan-sinkronisasi)
6. [Masalah Performance](#masalah-performance)
7. [Masalah Permission dan Akses](#masalah-permission-dan-akses)
8. [Error Codes dan Solusi](#error-codes-dan-solusi)

## Masalah Interface dan Navigasi

### 🚫 Menu Pembayaran Hutang Piutang Tidak Muncul

**Gejala:**
- Menu tidak terlihat di sidebar
- Error 404 saat mengakses langsung

**Penyebab Umum:**
- User tidak memiliki permission
- Session expired
- Role user tidak sesuai

**Solusi:**
1. **Cek Permission User:**
   ```
   - Login sebagai admin
   - Buka User Management
   - Cek role user: harus 'kasir' atau 'admin'
   - Update role jika perlu
   ```

2. **Refresh Session:**
   ```
   - Logout dari aplikasi
   - Clear browser cache (Ctrl+Shift+Del)
   - Login kembali
   - Coba akses menu
   ```

3. **Cek Browser Compatibility:**
   ```
   - Gunakan Chrome/Firefox/Edge terbaru
   - Disable ad-blocker
   - Enable JavaScript
   - Clear cookies aplikasi
   ```

### 🚫 Interface Tidak Loading Sempurna

**Gejala:**
- Tab tidak muncul
- Form kosong atau tidak responsive
- CSS tidak ter-load

**Penyebab Umum:**
- Koneksi internet lambat
- File JavaScript/CSS corrupt
- Browser cache bermasalah

**Solusi:**
1. **Hard Refresh:**
   ```
   - Tekan Ctrl+F5 (Windows) atau Cmd+Shift+R (Mac)
   - Atau Ctrl+Shift+R di Chrome
   ```

2. **Clear Cache Specific:**
   ```
   - Buka Developer Tools (F12)
   - Klik kanan tombol refresh
   - Pilih "Empty Cache and Hard Reload"
   ```

3. **Cek Network Tab:**
   ```
   - Buka Developer Tools (F12)
   - Tab Network
   - Refresh halaman
   - Cek file mana yang gagal load (status 404/500)
   ```

## Masalah Tab Switching

### 🔄 Tab Tidak Bisa Diklik

**Gejala:**
- Tab Import Batch abu-abu/disabled
- Klik tab tidak ada response
- Tab tidak berubah warna saat diklik

**Penyebab Umum:**
- Permission tidak cukup untuk tab tertentu
- JavaScript error
- Tab sedang dalam proses loading

**Solusi:**
1. **Cek Permission Tab:**
   ```javascript
   // Buka Console (F12)
   console.log(window.currentUser.role);
   // Harus 'admin' untuk akses penuh
   // 'kasir' mungkin terbatas untuk import
   ```

2. **Cek JavaScript Errors:**
   ```
   - Buka Console (F12)
   - Refresh halaman
   - Lihat error merah di console
   - Screenshot error untuk dilaporkan
   ```

3. **Force Tab Switch:**
   ```
   - Gunakan keyboard shortcut:
     Ctrl+1 untuk Manual
     Ctrl+2 untuk Import
   ```

### 🔄 Data Hilang Saat Pindah Tab

**Gejala:**
- Form data hilang setelah switch tab
- Dialog konfirmasi tidak muncul
- State tidak tersimpan

**Penyebab Umum:**
- Bug di state management
- Browser memory issue
- JavaScript error saat save state

**Solusi:**
1. **Manual Save Before Switch:**
   ```
   - Selalu simpan data sebelum pindah tab
   - Gunakan draft/temporary save jika tersedia
   - Catat data penting di notepad
   ```

2. **Cek Local Storage:**
   ```javascript
   // Buka Console (F12)
   localStorage.getItem('pembayaran_draft');
   // Cek apakah ada data tersimpan
   ```

3. **Refresh dan Input Ulang:**
   ```
   - Refresh halaman (F5)
   - Input ulang data yang hilang
   - Proses langsung tanpa pindah tab
   ```

## Masalah Pembayaran Manual

### 💳 Autocomplete Anggota Tidak Muncul

**Gejala:**
- Dropdown kosong saat ketik nama
- Loading terus-menerus
- Error "No results found"

**Penyebab Umum:**
- Database connection issue
- Query timeout
- Data anggota corrupt

**Solusi:**
1. **Cek Koneksi Database:**
   ```
   - Coba refresh halaman
   - Cek menu lain (Master Anggota)
   - Jika menu lain juga bermasalah = masalah server
   ```

2. **Gunakan Nomor Anggota:**
   ```
   - Ketik nomor anggota langsung
   - Format: A001, 1001, dll sesuai sistem
   - Lebih cepat dari pencarian nama
   ```

3. **Cek Format Input:**
   ```
   - Minimal 2-3 karakter
   - Tidak ada karakter khusus
   - Tunggu 2-3 detik untuk loading
   ```

### 💳 Validasi Saldo Gagal

**Gejala:**
- Error "Saldo tidak mencukupi" padahal saldo cukup
- Saldo tidak terupdate
- Jumlah pembayaran ditolak

**Penyebab Umum:**
- Data saldo tidak sinkron
- Cache saldo lama
- Transaksi concurrent

**Solusi:**
1. **Refresh Data Anggota:**
   ```
   - Pilih ulang anggota dari dropdown
   - Atau refresh halaman dan coba lagi
   - Cek saldo di Master Anggota
   ```

2. **Cek Transaksi Pending:**
   ```
   - Buka Riwayat Transaksi
   - Cek apakah ada transaksi status "Pending"
   - Tunggu transaksi selesai atau hubungi admin
   ```

3. **Manual Calculation:**
   ```
   - Hitung manual: Saldo - Pembayaran
   - Pastikan hasil tidak negatif
   - Kurangi jumlah pembayaran jika perlu
   ```

### 💳 Transaksi Gagal Diproses

**Gejala:**
- Error saat klik "Proses Pembayaran"
- Loading terus tanpa hasil
- Dialog error muncul

**Penyebab Umum:**
- Server overload
- Database lock
- Network timeout

**Solusi:**
1. **Retry dengan Delay:**
   ```
   - Tunggu 30 detik
   - Coba proses ulang
   - Jangan klik berulang-ulang
   ```

2. **Cek Status Transaksi:**
   ```
   - Scroll ke Riwayat Transaksi
   - Cek apakah transaksi sudah tercatat
   - Jika sudah ada, jangan proses ulang
   ```

3. **Backup Manual:**
   ```
   - Catat detail transaksi di kertas
   - Screenshot form sebelum proses
   - Laporkan ke admin jika gagal terus
   ```

## Masalah Import Batch

### 📁 File Upload Gagal

**Gejala:**
- Error "File format not supported"
- Upload stuck di 0%
- File tidak muncul setelah pilih

**Penyebab Umum:**
- Format file salah
- Ukuran file terlalu besar
- Browser compatibility issue

**Solusi:**
1. **Cek Format File:**
   ```
   Supported: .csv, .xlsx, .xls
   Not supported: .txt, .doc, .pdf
   
   Cara convert:
   - Buka file di Excel
   - Save As > CSV (Comma delimited)
   - Atau Save As > Excel Workbook (.xlsx)
   ```

2. **Cek Ukuran File:**
   ```
   Maksimal: 5MB
   
   Jika terlalu besar:
   - Bagi file menjadi beberapa batch
   - Hapus kolom yang tidak perlu
   - Kompres file jika perlu
   ```

3. **Coba Browser Lain:**
   ```
   - Chrome: Paling kompatibel
   - Firefox: Alternatif baik
   - Edge: Untuk Windows
   - Hindari: Internet Explorer
   ```

### 📁 Validasi Data Gagal

**Gejala:**
- Banyak error di preview
- Data valid tapi ditolak sistem
- Validasi tidak selesai

**Penyebab Umum:**
- Format data tidak sesuai template
- Anggota tidak terdaftar
- Saldo tidak mencukupi

**Solusi:**
1. **Download Error Report:**
   ```
   - Klik "Download Error Report"
   - Buka file Excel error
   - Perbaiki satu per satu sesuai keterangan
   ```

2. **Cek Template Terbaru:**
   ```
   - Download ulang template dari sistem
   - Bandingkan dengan file Anda
   - Pastikan header kolom sama persis
   ```

3. **Validasi Manual:**
   ```
   - Cek nomor anggota di Master Anggota
   - Cek saldo di menu Saldo Anggota
   - Pastikan jenis_pembayaran hanya "hutang"/"piutang"
   ```

### 📁 Import Proses Stuck

**Gejala:**
- Progress bar tidak bergerak
- Estimasi waktu tidak akurat
- Browser hang/freeze

**Penyebab Umum:**
- File terlalu besar
- Server overload
- Memory browser habis

**Solusi:**
1. **Jangan Tutup Browser:**
   ```
   - Biarkan proses berjalan
   - Jangan refresh atau close tab
   - Tunggu maksimal 30 menit
   ```

2. **Monitor di Tab Lain:**
   ```
   - Buka tab baru
   - Login ke aplikasi
   - Cek Riwayat Transaksi
   - Lihat apakah transaksi mulai muncul
   ```

3. **Restart Import:**
   ```
   - Jika stuck > 30 menit:
     - Refresh halaman
     - Cek berapa transaksi yang sudah berhasil
     - Import ulang data yang belum terproses
   ```

## Masalah Data dan Sinkronisasi

### 🔄 Data Tidak Sinkron Antar Tab

**Gejala:**
- Transaksi di tab manual tidak muncul di import
- Dashboard tidak update setelah transaksi
- Saldo tidak konsisten

**Penyebab Umum:**
- Cache browser
- Real-time update gagal
- Database replication lag

**Solusi:**
1. **Manual Refresh:**
   ```
   - Klik tombol "Refresh" di dashboard
   - Atau refresh halaman (F5)
   - Tunggu 10-15 detik untuk sinkronisasi
   ```

2. **Clear Browser Cache:**
   ```
   - Ctrl+Shift+Del
   - Pilih "Cached images and files"
   - Clear data
   - Refresh halaman
   ```

3. **Cek Database Consistency:**
   ```
   - Logout dan login kembali
   - Cek data di menu lain
   - Laporkan ke admin jika masalah berlanjut
   ```

### 🔄 Riwayat Transaksi Tidak Lengkap

**Gejala:**
- Transaksi hilang dari riwayat
- Filter tidak bekerja
- Export data tidak sesuai

**Penyebab Umum:**
- Filter terlalu ketat
- Pagination issue
- Data corruption

**Solusi:**
1. **Reset All Filters:**
   ```
   - Klik "Reset Filter" atau "Clear All"
   - Set tanggal ke rentang yang luas
   - Set mode ke "Semua"
   - Refresh tabel
   ```

2. **Cek Pagination:**
   ```
   - Scroll ke bawah tabel
   - Klik "Load More" atau "Next Page"
   - Atau set "Show All" jika tersedia
   ```

3. **Export untuk Verifikasi:**
   ```
   - Export semua data tanpa filter
   - Buka file Excel
   - Cari transaksi yang hilang
   - Bandingkan dengan catatan manual
   ```

## Masalah Performance

### 🐌 Aplikasi Lambat

**Gejala:**
- Loading lama saat buka menu
- Autocomplete lambat
- Tab switching delay

**Penyebab Umum:**
- Database besar
- Koneksi internet lambat
- Browser overload

**Solusi:**
1. **Optimize Browser:**
   ```
   - Close tab yang tidak perlu
   - Clear cache dan cookies
   - Disable extension yang tidak perlu
   - Restart browser
   ```

2. **Cek Koneksi Internet:**
   ```
   - Test speed: speedtest.net
   - Minimal 1 Mbps untuk smooth operation
   - Gunakan koneksi kabel jika WiFi lambat
   ```

3. **Gunakan Filter:**
   ```
   - Jangan load semua data sekaligus
   - Gunakan filter tanggal
   - Limit hasil pencarian
   - Gunakan pagination
   ```

### 🐌 Import Batch Sangat Lambat

**Gejala:**
- Upload file lama
- Validasi tidak selesai
- Progress sangat lambat

**Penyebab Umum:**
- File terlalu besar
- Server busy
- Network congestion

**Solusi:**
1. **Bagi File Kecil:**
   ```
   Optimal: 100-500 baris per batch
   Maksimal: 1000 baris per batch
   
   Cara bagi:
   - Copy header ke file baru
   - Copy 100-500 baris data
   - Save dengan nama berbeda
   - Import satu per satu
   ```

2. **Import di Jam Sepi:**
   ```
   Waktu optimal:
   - Pagi hari (07:00-09:00)
   - Siang hari (12:00-14:00)
   - Sore hari (16:00-18:00)
   
   Hindari:
   - Jam sibuk (09:00-11:00, 14:00-16:00)
   - Akhir bulan/tahun
   ```

## Masalah Permission dan Akses

### 🔒 Tab Import Tidak Bisa Diakses

**Gejala:**
- Tab Import abu-abu
- Error "Access Denied"
- Menu tidak muncul

**Penyebab Umum:**
- Role user tidak sesuai
- Permission tidak diset
- Policy restriction

**Solusi:**
1. **Cek Role User:**
   ```
   - Login sebagai admin
   - Buka User Management
   - Cek role user saat ini
   - Update ke 'admin' jika perlu akses import
   ```

2. **Request Access:**
   ```
   - Hubungi admin sistem
   - Jelaskan kebutuhan akses import
   - Minta update permission
   - Tunggu konfirmasi admin
   ```

3. **Workaround:**
   ```
   - Gunakan akun admin untuk import
   - Atau minta admin yang import
   - Siapkan file dan berikan ke admin
   ```

### 🔒 Session Expired Saat Import

**Gejala:**
- Redirect ke login saat import
- Error "Session timeout"
- Import terhenti di tengah

**Penyebab Umum:**
- Session timeout terlalu pendek
- Import terlalu lama
- Inactivity detection

**Solusi:**
1. **Extend Session:**
   ```
   - Login ulang sebelum import
   - Bagi file menjadi batch kecil
   - Import satu per satu dengan cepat
   ```

2. **Keep Session Active:**
   ```
   - Buka tab lain dengan aplikasi
   - Klik-klik menu sesekali
   - Jangan idle terlalu lama
   ```

## Error Codes dan Solusi

### ERR_001: Database Connection Failed
**Pesan:** "Tidak dapat terhubung ke database"
**Solusi:**
- Cek koneksi internet
- Tunggu 5 menit dan coba lagi
- Hubungi admin jika berlanjut

### ERR_002: Invalid File Format
**Pesan:** "Format file tidak didukung"
**Solusi:**
- Gunakan format .csv atau .xlsx
- Re-save file dengan format yang benar
- Cek ekstensi file

### ERR_003: Data Validation Failed
**Pesan:** "Data tidak valid"
**Solusi:**
- Download error report
- Perbaiki data sesuai keterangan
- Upload ulang file

### ERR_004: Insufficient Balance
**Pesan:** "Saldo tidak mencukupi"
**Solusi:**
- Cek saldo terkini anggota
- Kurangi jumlah pembayaran
- Proses pembayaran sebagian

### ERR_005: Permission Denied
**Pesan:** "Akses ditolak"
**Solusi:**
- Cek role user
- Hubungi admin untuk permission
- Login dengan akun yang sesuai

### ERR_006: Session Timeout
**Pesan:** "Sesi telah berakhir"
**Solusi:**
- Login ulang
- Simpan data sebelum timeout
- Extend session jika memungkinkan

### ERR_007: File Too Large
**Pesan:** "Ukuran file terlalu besar"
**Solusi:**
- Maksimal 5MB per file
- Bagi file menjadi beberapa batch
- Kompres file jika perlu

### ERR_008: Duplicate Transaction
**Pesan:** "Transaksi duplikat"
**Solusi:**
- Cek riwayat transaksi
- Jangan proses ulang jika sudah ada
- Hubungi admin untuk reversal jika perlu

## Kontak Support

### Level 1: Self-Help
- 📖 Baca dokumentasi lengkap
- 🔍 Cek FAQ di aplikasi
- 🔄 Coba restart browser/aplikasi

### Level 2: Admin Internal
- 👨‍💼 Hubungi admin koperasi
- 📧 Email: admin@koperasi.com
- 📞 Telepon: Ext. 101

### Level 3: Technical Support
- 🛠️ Hubungi developer
- 📧 Email: support@koperasi.com
- 📞 Telepon: (021) 1234-5678
- 💬 Chat: Tombol "Help" di aplikasi

### Informasi yang Perlu Disiapkan
Saat menghubungi support, siapkan:
- 🆔 User ID dan role
- 🕐 Waktu kejadian error
- 📱 Browser dan versi
- 📋 Langkah-langkah yang dilakukan
- 📸 Screenshot error (jika ada)
- 📄 File yang bermasalah (untuk import)

---

**Versi Dokumen**: 1.0  
**Tanggal Update**: Desember 2024  
**Update Terakhir**: Troubleshooting untuk interface terintegrasi