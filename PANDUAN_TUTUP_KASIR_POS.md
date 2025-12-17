# Panduan Tutup Kasir Point of Sales

## Deskripsi
Fitur Tutup Kasir telah ditambahkan ke sistem Point of Sales (POS) untuk memungkinkan kasir melakukan penutupan shift dengan rekonsiliasi kas dan pencetakan laporan.

## Fitur yang Ditambahkan

### 1. Tombol Tutup Kasir di POS
- **Lokasi**: Header POS fullscreen, sebelah tombol "Kembali ke Menu"
- **Warna**: Kuning (btn-warning)
- **Icon**: Calculator (bi-calculator)
- **Fungsi**: Membuka modal tutup kasir

### 2. Modal Tutup Kasir
Modal tutup kasir menampilkan:

#### Informasi Shift
- Nama kasir
- Waktu buka kas
- Modal awal kasir

#### Ringkasan Penjualan
- Total transaksi dalam shift
- Total penjualan cash
- Total penjualan kredit

#### Perhitungan Kas
- Modal awal + Penjualan cash = Kas seharusnya
- Input kas aktual (hasil hitung fisik)
- Perhitungan selisih otomatis

#### Validasi Selisih
- **Kas Sesuai**: Alert hijau, tidak perlu keterangan
- **Kas Lebih**: Alert kuning, wajib isi keterangan
- **Kas Kurang**: Alert merah, wajib isi keterangan

### 3. Proses Tutup Kasir
Ketika kasir klik "Tutup & Print Laporan":

1. **Validasi Input**
   - Kas aktual harus diisi
   - Keterangan selisih wajib jika ada selisih

2. **Penyimpanan Data**
   - Data tutup kasir disimpan ke `localStorage` dengan key `riwayatTutupKas`
   - Format data lengkap dengan semua informasi shift

3. **Jurnal Otomatis**
   - Jika ada selisih kas, sistem otomatis membuat jurnal:
     - **Kas Lebih**: Debit Kas, Kredit Pendapatan Lain-lain
     - **Kas Kurang**: Debit Beban Lain-lain, Kredit Kas

4. **Pembersihan Session**
   - Menghapus data `bukaKas` dan `shiftId` dari sessionStorage
   - Kasir harus buka kas lagi untuk shift berikutnya

5. **Pencetakan Laporan**
   - Otomatis membuka window print dengan laporan lengkap
   - Format laporan profesional dengan logo koperasi

### 4. Menu Riwayat Tutup Kasir
Fungsi `renderRiwayatTutupKas()` telah ditambahkan di `js/keuangan.js`:

#### Fitur Riwayat
- **Tabel Lengkap**: Menampilkan semua riwayat tutup kasir
- **Sorting**: Otomatis diurutkan berdasarkan tanggal terbaru
- **Color Coding**: Selisih kas diberi warna sesuai status
- **Detail View**: Modal detail untuk setiap laporan
- **Print Ulang**: Fungsi cetak ulang laporan
- **Export Excel**: Export data ke format CSV

#### Informasi yang Ditampilkan
- No. Laporan (TK-{id})
- Tanggal dan jam shift
- Nama kasir dan durasi shift
- Modal awal dan total penjualan
- Kas aktual dan selisih
- Aksi (detail dan print ulang)

## Cara Penggunaan

### Untuk Kasir

1. **Buka Kas**
   - Masuk ke menu POS
   - Input modal awal kasir
   - Klik "Buka Kas"

2. **Transaksi Normal**
   - Lakukan transaksi penjualan seperti biasa
   - Sistem otomatis mencatat semua transaksi dalam shift

3. **Tutup Kasir**
   - Klik tombol "Tutup Kasir" di header POS
   - Periksa ringkasan penjualan
   - Hitung kas fisik di kasir
   - Input kas aktual
   - Isi keterangan jika ada selisih
   - Klik "Tutup & Print Laporan"

### Untuk Admin/Supervisor

1. **Lihat Riwayat**
   - Masuk ke menu "Riwayat Tutup Kasir"
   - Lihat semua laporan tutup kasir
   - Klik "Detail" untuk informasi lengkap
   - Export data jika diperlukan

2. **Monitoring Selisih**
   - Perhatikan kolom selisih dengan color coding
   - Baca keterangan selisih untuk investigasi
   - Print ulang laporan jika diperlukan

## Integrasi dengan Sistem

### Data Storage
- **sessionStorage**: Data shift aktif (`bukaKas`, `shiftId`)
- **localStorage**: Riwayat tutup kasir (`riwayatTutupKas`)

### Integrasi Akuntansi
- Otomatis membuat jurnal untuk selisih kas
- Menggunakan COA yang sudah ada:
  - 1001: Kas
  - 4002: Pendapatan Lain-lain
  - 5002: Beban Lain-lain

### Validasi Keamanan
- Hanya kasir yang sudah buka kas yang bisa tutup kasir
- Data shift terisolasi per kasir
- Audit trail lengkap untuk setiap tutup kasir

## File yang Dimodifikasi

1. **js/pos.js**
   - Tambah tombol tutup kasir di header
   - Fungsi `showTutupKasirModal()`
   - Fungsi `prosesTutupKasir()`
   - Fungsi `printLaporanTutupKasir()`
   - Helper functions untuk durasi dan format tanggal

2. **js/keuangan.js**
   - Fungsi `renderRiwayatTutupKas()`
   - Fungsi `viewDetailTutupKas()`
   - Fungsi `printUlangTutupKas()`
   - Fungsi `exportRiwayatTutupKas()`

3. **js/auth.js** (sudah ada)
   - Menu "Riwayat Tutup Kasir" sudah terdaftar
   - Routing ke `renderRiwayatTutupKas()`

## Testing

File `test_tutup_kasir_pos.html` disediakan untuk testing:

1. Setup test data
2. Simulasi buka kas
3. Simulasi transaksi
4. Test tutup kasir
5. Lihat riwayat

## Troubleshooting

### Masalah Umum

1. **Tombol Tutup Kasir tidak muncul**
   - Pastikan sudah buka kas terlebih dahulu
   - Refresh halaman POS

2. **Modal tutup kasir tidak terbuka**
   - Periksa console browser untuk error
   - Pastikan Bootstrap JS sudah loaded

3. **Print tidak berfungsi**
   - Periksa popup blocker browser
   - Pastikan printer sudah terhubung

4. **Riwayat tidak muncul**
   - Pastikan sudah ada data tutup kasir
   - Periksa localStorage untuk key `riwayatTutupKas`

### Error Handling

Sistem sudah dilengkapi dengan:
- Validasi input yang komprehensif
- Error messages yang informatif
- Fallback untuk fungsi yang tidak tersedia
- Rollback otomatis jika terjadi error

## Kesimpulan

Fitur tutup kasir telah berhasil diintegrasikan dengan sistem POS yang ada. Kasir sekarang dapat:

1. ✅ Melakukan tutup kasir dengan rekonsiliasi kas
2. ✅ Mencetak laporan tutup kasir otomatis
3. ✅ Mencatat selisih kas dengan keterangan
4. ✅ Membuat jurnal otomatis untuk selisih
5. ✅ Melihat riwayat tutup kasir lengkap
6. ✅ Export data untuk analisis

Sistem sudah siap untuk digunakan dalam lingkungan produksi.