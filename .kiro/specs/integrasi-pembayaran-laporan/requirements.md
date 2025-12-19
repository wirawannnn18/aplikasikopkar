# Requirements Document

## Introduction

Integrasi fitur import tagihan ke dalam menu Pembayaran Hutang Piutang yang sudah ada untuk memberikan pengalaman yang unified bagi kasir. Kasir dapat memilih antara memproses pembayaran secara manual (satuan) atau menggunakan import batch (massal) dalam satu interface yang terintegrasi.

## Glossary

- **System**: Aplikasi Koperasi
- **Pembayaran Manual**: Proses pembayaran hutang/piutang anggota secara satuan
- **Import Batch**: Proses pembayaran hutang/piutang multiple anggota melalui file import
- **Tab Interface**: Interface dengan tab untuk memilih mode pembayaran (Manual/Import)
- **Unified Menu**: Menu Pembayaran Hutang Piutang yang menggabungkan fitur manual dan import
- **Kasir**: User dengan role kasir yang memproses pembayaran
- **Admin**: User dengan role admin yang dapat mengakses semua fitur

## Requirements

### Requirement 1

**User Story:** Sebagai kasir, saya ingin mengakses pembayaran manual dan import batch dalam satu menu, sehingga saya tidak perlu berpindah-pindah menu untuk memproses pembayaran.

#### Acceptance Criteria

1. WHEN kasir membuka menu Pembayaran Hutang Piutang THEN the System SHALL menampilkan interface dengan dua tab: "Pembayaran Manual" dan "Import Batch"
2. WHEN kasir mengklik tab "Pembayaran Manual" THEN the System SHALL menampilkan form pembayaran satuan yang sudah ada
3. WHEN kasir mengklik tab "Import Batch" THEN the System SHALL menampilkan interface import tagihan
4. WHEN kasir beralih antar tab THEN the System SHALL mempertahankan state data yang belum disimpan dengan konfirmasi
5. WHEN menu dibuka pertama kali THEN the System SHALL menampilkan tab "Pembayaran Manual" sebagai default

### Requirement 2

**User Story:** Sebagai kasir, saya ingin dapat memproses pembayaran satuan dengan interface yang sudah familiar, sehingga workflow yang sudah ada tidak terganggu.

#### Acceptance Criteria

1. WHEN kasir menggunakan tab "Pembayaran Manual" THEN the System SHALL menampilkan semua fitur pembayaran manual yang sudah ada
2. WHEN kasir memproses pembayaran manual THEN the System SHALL menggunakan fungsi dan validasi yang sudah ada
3. WHEN pembayaran manual berhasil THEN the System SHALL menampilkan konfirmasi dan opsi cetak bukti seperti sebelumnya
4. WHEN kasir melihat riwayat pembayaran THEN the System SHALL menampilkan semua transaksi baik manual maupun import dalam satu view
5. WHEN kasir menggunakan fitur manual THEN the System SHALL mempertahankan semua shortcut dan workflow yang sudah ada

### Requirement 3

**User Story:** Sebagai kasir, saya ingin dapat memproses import batch dalam interface yang terintegrasi, sehingga saya dapat memproses banyak pembayaran sekaligus tanpa meninggalkan menu utama.

#### Acceptance Criteria

1. WHEN kasir menggunakan tab "Import Batch" THEN the System SHALL menampilkan semua fitur import tagihan yang sudah ada
2. WHEN kasir mengupload file import THEN the System SHALL menggunakan validasi dan processing yang sudah ada dari spec import tagihan
3. WHEN import batch berhasil THEN the System SHALL menampilkan laporan hasil dan mengupdate riwayat pembayaran
4. WHEN kasir mengunduh template THEN the System SHALL menggunakan template yang sudah ada dari spec import tagihan
5. WHEN import batch selesai THEN the System SHALL memperbarui summary dan statistik pembayaran di tab manual

### Requirement 4

**User Story:** Sebagai kasir, saya ingin melihat riwayat pembayaran yang unified, sehingga saya dapat melihat semua transaksi baik manual maupun import dalam satu tempat.

#### Acceptance Criteria

1. WHEN kasir membuka riwayat pembayaran THEN the System SHALL menampilkan semua transaksi dari kedua mode (manual dan import)
2. WHEN menampilkan riwayat THEN the System SHALL menambahkan kolom "Mode" untuk membedakan transaksi manual dan import
3. WHEN kasir memfilter riwayat THEN the System SHALL menyediakan filter tambahan berdasarkan mode pembayaran
4. WHEN kasir mengekspor riwayat THEN the System SHALL menyertakan semua transaksi dengan informasi mode pembayaran
5. WHEN menampilkan detail transaksi THEN the System SHALL menampilkan informasi spesifik sesuai mode (batch ID untuk import, dll)

### Requirement 5

**User Story:** Sebagai kasir, saya ingin melihat summary dan statistik yang mencakup kedua mode pembayaran, sehingga saya dapat memantau performa pembayaran secara keseluruhan.

#### Acceptance Criteria

1. WHEN kasir membuka dashboard pembayaran THEN the System SHALL menampilkan summary yang mencakup transaksi manual dan import
2. WHEN menampilkan statistik THEN the System SHALL menampilkan breakdown berdasarkan mode pembayaran
3. WHEN menampilkan total pembayaran THEN the System SHALL menggabungkan jumlah dari kedua mode
4. WHEN menampilkan grafik trend THEN the System SHALL membedakan data manual dan import dengan warna berbeda
5. WHEN kasir melihat summary harian THEN the System SHALL menampilkan jumlah transaksi dan total nilai untuk masing-masing mode

### Requirement 6

**User Story:** Sebagai sistem, saya ingin memastikan integritas data antara kedua mode pembayaran, sehingga tidak terjadi inkonsistensi dalam pencatatan.

#### Acceptance Criteria

1. WHEN transaksi diproses dari mode manapun THEN the System SHALL menggunakan fungsi jurnal dan saldo yang sama
2. WHEN saldo anggota diupdate THEN the System SHALL memastikan konsistensi terlepas dari mode pembayaran yang digunakan
3. WHEN audit log dicatat THEN the System SHALL mencatat mode pembayaran sebagai informasi tambahan
4. WHEN terjadi error THEN the System SHALL menggunakan mekanisme rollback yang sama untuk kedua mode
5. WHEN data disinkronisasi THEN the System SHALL memastikan semua komponen terupdate secara konsisten

### Requirement 7

**User Story:** Sebagai kasir, saya ingin navigasi yang intuitif antara kedua mode, sehingga saya dapat beralih dengan mudah sesuai kebutuhan.

#### Acceptance Criteria

1. WHEN kasir beralih tab dengan data belum tersimpan THEN the System SHALL menampilkan konfirmasi untuk menyimpan atau membuang perubahan
2. WHEN kasir menggunakan keyboard shortcut THEN the System SHALL mendukung navigasi cepat antar tab (Ctrl+1 untuk Manual, Ctrl+2 untuk Import)
3. WHEN kasir menyelesaikan transaksi di satu tab THEN the System SHALL menyediakan opsi cepat untuk beralih ke tab lain
4. WHEN kasir membuka menu THEN the System SHALL mengingat tab terakhir yang digunakan dalam session
5. WHEN kasir menggunakan fitur search THEN the System SHALL mencari di kedua mode dan menampilkan hasil dengan indikator mode

### Requirement 8

**User Story:** Sebagai admin, saya ingin dapat mengatur akses dan konfigurasi untuk kedua mode pembayaran, sehingga saya dapat mengontrol fitur yang tersedia untuk setiap kasir.

#### Acceptance Criteria

1. WHEN admin mengatur permission THEN the System SHALL memungkinkan pengaturan akses terpisah untuk mode manual dan import
2. WHEN admin mengatur konfigurasi THEN the System SHALL menyediakan pengaturan yang berlaku untuk kedua mode
3. WHEN admin melihat audit log THEN the System SHALL menampilkan aktivitas dari kedua mode dengan filter yang sesuai
4. WHEN admin mengatur limit transaksi THEN the System SHALL menerapkan limit yang sesuai untuk masing-masing mode
5. WHEN admin mengekspor laporan THEN the System SHALL menyediakan opsi untuk mengekspor data gabungan atau terpisah per mode