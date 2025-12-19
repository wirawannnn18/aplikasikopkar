# Panduan Pengguna - Integrasi Pembayaran Hutang Piutang

## Daftar Isi
1. [Pengenalan Interface Terintegrasi](#pengenalan-interface-terintegrasi)
2. [Workflow Pembayaran Manual](#workflow-pembayaran-manual)
3. [Workflow Import Batch](#workflow-import-batch)
4. [Navigasi Antar Tab](#navigasi-antar-tab)
5. [Riwayat Transaksi Unified](#riwayat-transaksi-unified)
6. [Dashboard dan Statistik](#dashboard-dan-statistik)
7. [Troubleshooting](#troubleshooting)

## Pengenalan Interface Terintegrasi

### Apa yang Baru?
Menu **Pembayaran Hutang Piutang** sekarang menggabungkan dua mode pembayaran dalam satu interface:
- **Tab Pembayaran Manual**: Untuk memproses pembayaran satuan (seperti sebelumnya)
- **Tab Import Batch**: Untuk memproses pembayaran massal melalui file import

### Keuntungan Interface Terintegrasi
- ✅ Tidak perlu berpindah-pindah menu
- ✅ Riwayat transaksi terpusat dalam satu tempat
- ✅ Dashboard statistik yang komprehensif
- ✅ Konsistensi data antara kedua mode
- ✅ Workflow yang lebih efisien

### Akses Menu
1. Login ke aplikasi dengan akun kasir/admin
2. Klik menu **"Pembayaran Hutang Piutang"** di sidebar
3. Interface akan terbuka dengan tab **"Pembayaran Manual"** sebagai default

## Workflow Pembayaran Manual

### Langkah-langkah Pembayaran Manual
1. **Pastikan tab "Pembayaran Manual" aktif** (tab pertama)
2. **Pilih jenis pembayaran**: Hutang atau Piutang
3. **Cari anggota**: Ketik nama/nomor anggota di field pencarian
4. **Pilih anggota** dari dropdown autocomplete
5. **Masukkan jumlah pembayaran**
6. **Tambahkan keterangan** (opsional)
7. **Klik "Proses Pembayaran"**
8. **Konfirmasi** pada dialog yang muncul
9. **Cetak bukti** jika diperlukan

### Fitur Pencarian Anggota
- **Autocomplete**: Ketik minimal 2 karakter untuk melihat saran
- **Pencarian berdasarkan**: Nama lengkap, nomor anggota, atau NIK
- **Filter otomatis**: Hanya menampilkan anggota yang memiliki saldo hutang/piutang

### Validasi Pembayaran
- ✅ Jumlah pembayaran tidak boleh melebihi saldo
- ✅ Anggota harus terdaftar dan aktif
- ✅ Saldo kas harus mencukupi untuk pembayaran piutang
- ✅ Format angka harus valid (tidak boleh negatif)

## Workflow Import Batch

### Persiapan File Import
1. **Download template** dari tab "Import Batch"
2. **Isi data** sesuai format yang ditentukan:
   - `nomor_anggota`: Nomor anggota yang terdaftar
   - `nama_anggota`: Nama lengkap anggota
   - `jenis_pembayaran`: "hutang" atau "piutang"
   - `jumlah_pembayaran`: Angka tanpa titik/koma
   - `keterangan`: Keterangan tambahan (opsional)
3. **Simpan file** dalam format CSV atau Excel

### Langkah-langkah Import Batch
1. **Klik tab "Import Batch"**
2. **Klik "Pilih File"** dan pilih file yang sudah disiapkan
3. **Tunggu proses upload** dan validasi otomatis
4. **Review preview data** yang akan diproses
5. **Periksa error** jika ada data yang tidak valid
6. **Klik "Proses Import"** jika semua data valid
7. **Tunggu proses selesai** dan lihat laporan hasil
8. **Download laporan** untuk dokumentasi

### Validasi Import Batch
- ✅ Format file harus CSV atau Excel
- ✅ Header kolom harus sesuai template
- ✅ Semua anggota harus terdaftar
- ✅ Jumlah pembayaran harus valid
- ✅ Jenis pembayaran harus "hutang" atau "piutang"
- ✅ Tidak boleh ada duplikasi dalam satu batch

## Navigasi Antar Tab

### Cara Berpindah Tab
1. **Klik tab** yang diinginkan di bagian atas interface
2. **Gunakan keyboard shortcut**:
   - `Ctrl + 1`: Pindah ke tab Pembayaran Manual
   - `Ctrl + 2`: Pindah ke tab Import Batch

### Penanganan Data Belum Tersimpan
Jika Anda berpindah tab saat ada data yang belum tersimpan:
1. **Dialog konfirmasi** akan muncul
2. **Pilihan yang tersedia**:
   - **"Simpan & Lanjut"**: Menyimpan data lalu pindah tab
   - **"Buang & Lanjut"**: Membuang data lalu pindah tab
   - **"Batal"**: Tetap di tab saat ini

### Tips Navigasi
- 💡 Tab yang aktif ditandai dengan warna berbeda
- 💡 Indikator "unsaved changes" muncul jika ada data belum tersimpan
- 💡 Session akan mengingat tab terakhir yang digunakan

## Riwayat Transaksi Unified

### Melihat Riwayat Transaksi
1. **Scroll ke bawah** di tab manapun untuk melihat riwayat
2. **Gunakan filter** untuk mempersempit pencarian:
   - **Tanggal**: Pilih rentang tanggal
   - **Jenis**: Hutang atau Piutang
   - **Mode**: Manual, Import, atau Semua
   - **Anggota**: Cari berdasarkan nama anggota
   - **Kasir**: Filter berdasarkan kasir yang memproses

### Kolom Riwayat Transaksi
- **Tanggal**: Tanggal dan waktu transaksi
- **Anggota**: Nama dan nomor anggota
- **Jenis**: Hutang atau Piutang
- **Jumlah**: Nominal pembayaran
- **Mode**: Manual atau Import Batch
- **Batch ID**: ID batch untuk transaksi import
- **Kasir**: Nama kasir yang memproses
- **Status**: Status transaksi (Berhasil/Gagal)

### Export Riwayat
1. **Klik tombol "Export"** di bagian atas tabel riwayat
2. **Pilih format**: CSV atau Excel
3. **Pilih filter**: Semua data atau data yang difilter
4. **Download file** yang dihasilkan

## Dashboard dan Statistik

### Summary Pembayaran
Dashboard menampilkan ringkasan dari kedua mode:
- **Total Pembayaran Hari Ini**: Gabungan manual + import
- **Jumlah Transaksi**: Breakdown per mode
- **Saldo Terkini**: Saldo hutang dan piutang terupdate
- **Trend Pembayaran**: Grafik dengan pembedaan warna per mode

### Statistik Real-time
- 📊 **Grafik Trend**: Menampilkan tren pembayaran harian/mingguan
- 📈 **Perbandingan Mode**: Persentase penggunaan manual vs import
- 💰 **Top Pembayaran**: Anggota dengan pembayaran terbesar
- ⏱️ **Aktivitas Terkini**: 10 transaksi terakhir dari kedua mode

### Refresh Otomatis
- Data dashboard terupdate otomatis setiap 30 detik
- Notifikasi muncul saat ada transaksi baru dari tab lain
- Klik tombol "Refresh" untuk update manual

## Troubleshooting

### Masalah Umum dan Solusi

#### 1. Tab Tidak Bisa Diklik
**Gejala**: Tab Import Batch tidak bisa diklik atau abu-abu
**Penyebab**: User tidak memiliki permission untuk import batch
**Solusi**: 
- Hubungi admin untuk mengatur permission
- Pastikan role user adalah admin atau kasir dengan akses import

#### 2. Data Tidak Sinkron Antar Tab
**Gejala**: Data di tab manual tidak update setelah import batch
**Penyebab**: Masalah koneksi atau cache browser
**Solusi**:
- Refresh halaman (F5)
- Clear cache browser
- Logout dan login kembali

#### 3. File Import Tidak Bisa Diupload
**Gejala**: Error saat upload file CSV/Excel
**Penyebab**: Format file tidak sesuai atau ukuran terlalu besar
**Solusi**:
- Pastikan file berformat CSV atau Excel (.xlsx)
- Maksimal ukuran file 5MB
- Pastikan header kolom sesuai template
- Hapus baris kosong di file

#### 4. Validasi Gagal Saat Import
**Gejala**: Banyak error validasi pada preview import
**Penyebab**: Data tidak sesuai format atau anggota tidak terdaftar
**Solusi**:
- Periksa nomor anggota di sistem
- Pastikan jenis pembayaran hanya "hutang" atau "piutang"
- Pastikan jumlah pembayaran berupa angka positif
- Hapus karakter khusus dari data

#### 5. Pembayaran Manual Lambat
**Gejala**: Autocomplete anggota lambat atau tidak muncul
**Penyebab**: Database besar atau koneksi lambat
**Solusi**:
- Ketik minimal 3 karakter untuk pencarian
- Tunggu beberapa detik untuk loading
- Gunakan nomor anggota untuk pencarian lebih cepat

#### 6. Laporan Export Kosong
**Gejala**: File export tidak berisi data
**Penyebab**: Filter terlalu ketat atau tidak ada data di periode tersebut
**Solusi**:
- Reset semua filter
- Perluas rentang tanggal
- Pastikan ada transaksi di periode yang dipilih

### Kontak Support
Jika masalah masih berlanjut:
- 📧 Email: support@koperasi.com
- 📞 Telepon: (021) 1234-5678
- 💬 Chat: Klik tombol "Help" di pojok kanan bawah aplikasi

### Tips Penggunaan Optimal
1. **Gunakan keyboard shortcut** untuk navigasi cepat
2. **Manfaatkan filter** untuk pencarian data spesifik
3. **Export laporan** secara berkala untuk backup
4. **Periksa dashboard** untuk monitoring performa
5. **Update browser** untuk performa optimal
6. **Logout** setelah selesai menggunakan aplikasi

---

**Versi Dokumen**: 1.0  
**Tanggal Update**: Desember 2024  
**Berlaku untuk**: Aplikasi Koperasi v2.0+