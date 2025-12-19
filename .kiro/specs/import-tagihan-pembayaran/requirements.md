# Requirements Document

## Introduction

Fitur import tagihan pembayaran hutang piutang memungkinkan kasir untuk memproses pembayaran dari banyak anggota sekaligus melalui file import (CSV/Excel). Fitur ini akan mempercepat proses pembayaran massal dan mengurangi waktu input manual, terutama untuk pembayaran rutin seperti cicilan pinjaman atau pengembalian simpanan dalam jumlah besar.

## Glossary

- **System**: Aplikasi Koperasi
- **Import Tagihan**: Proses upload file berisi data pembayaran multiple anggota
- **File Template**: Format standar CSV/Excel untuk import data pembayaran
- **Batch Processing**: Pemrosesan transaksi pembayaran secara berkelompok
- **Validation Engine**: Sistem validasi data import sebelum pemrosesan
- **Preview Mode**: Mode tampilan data import sebelum konfirmasi pemrosesan
- **Error Log**: Catatan kesalahan yang terjadi selama proses import
- **Success Report**: Laporan transaksi yang berhasil diproses
- **Rollback**: Pembatalan seluruh batch jika terjadi error kritis
- **Kasir**: User dengan role kasir yang memproses import pembayaran
- **Admin**: User dengan role admin yang dapat mengakses semua fitur import

## Requirements

### Requirement 1

**User Story:** Sebagai kasir, saya ingin mengunduh template file import, sehingga saya dapat menyiapkan data pembayaran dengan format yang benar.

#### Acceptance Criteria

1. WHEN kasir membuka menu import tagihan THEN the System SHALL menampilkan tombol download template
2. WHEN kasir mengklik download template THEN the System SHALL mengunduh file CSV dengan kolom: nomor_anggota, nama_anggota, jenis_pembayaran, jumlah_pembayaran, keterangan
3. WHEN template diunduh THEN the System SHALL menyertakan contoh data pada baris pertama sebagai panduan
4. WHEN template diunduh THEN the System SHALL menyertakan instruksi pengisian dalam file terpisah atau komentar header
5. WHEN template diunduh THEN the System SHALL menggunakan nama file dengan timestamp untuk menghindari duplikasi

### Requirement 2

**User Story:** Sebagai kasir, saya ingin mengupload file import tagihan, sehingga sistem dapat memvalidasi dan memproses data pembayaran secara batch.

#### Acceptance Criteria

1. WHEN kasir memilih file untuk diupload THEN the System SHALL memvalidasi format file adalah CSV atau Excel
2. WHEN file diupload THEN the System SHALL memvalidasi struktur kolom sesuai dengan template
3. WHEN file diupload THEN the System SHALL memvalidasi bahwa file tidak kosong dan memiliki minimal satu baris data
4. WHEN file diupload THEN the System SHALL memvalidasi ukuran file tidak melebihi batas maksimum 5MB
5. WHEN file tidak valid THEN the System SHALL menampilkan pesan error spesifik dan menolak upload

### Requirement 3

**User Story:** Sebagai kasir, saya ingin sistem memvalidasi setiap baris data import, sehingga hanya data yang valid yang akan diproses.

#### Acceptance Criteria

1. WHEN data import divalidasi THEN the System SHALL memvalidasi bahwa nomor anggota ada dalam database
2. WHEN data import divalidasi THEN the System SHALL memvalidasi bahwa jenis pembayaran adalah hutang atau piutang
3. WHEN data import divalidasi THEN the System SHALL memvalidasi bahwa jumlah pembayaran adalah angka positif
4. WHEN data import divalidasi THEN the System SHALL memvalidasi bahwa jumlah pembayaran tidak melebihi saldo hutang atau piutang anggota
5. WHEN validasi gagal THEN the System SHALL menandai baris error dan melanjutkan validasi baris berikutnya

### Requirement 4

**User Story:** Sebagai kasir, saya ingin melihat preview data import sebelum pemrosesan, sehingga saya dapat memverifikasi kebenaran data sebelum transaksi dieksekusi.

#### Acceptance Criteria

1. WHEN file berhasil diupload dan divalidasi THEN the System SHALL menampilkan preview data dalam bentuk tabel
2. WHEN preview ditampilkan THEN the System SHALL menampilkan status validasi untuk setiap baris (valid/error)
3. WHEN preview ditampilkan THEN the System SHALL menampilkan total jumlah pembayaran dan jumlah transaksi yang akan diproses
4. WHEN ada data error THEN the System SHALL menampilkan detail error untuk setiap baris yang bermasalah
5. WHEN preview ditampilkan THEN the System SHALL menyediakan opsi untuk melanjutkan pemrosesan atau membatalkan

### Requirement 5

**User Story:** Sebagai kasir, saya ingin memproses batch pembayaran dari data import, sehingga semua transaksi valid dapat dieksekusi sekaligus.

#### Acceptance Criteria

1. WHEN kasir mengkonfirmasi pemrosesan batch THEN the System SHALL memproses hanya baris data yang valid
2. WHEN batch diproses THEN the System SHALL mencatat setiap transaksi pembayaran dengan jurnal yang sesuai
3. WHEN batch diproses THEN the System SHALL memperbarui saldo hutang atau piutang anggota untuk setiap transaksi
4. WHEN terjadi error pada satu transaksi THEN the System SHALL melanjutkan pemrosesan transaksi lainnya
5. WHEN batch selesai diproses THEN the System SHALL menampilkan summary hasil pemrosesan

### Requirement 6

**User Story:** Sebagai kasir, saya ingin melihat laporan hasil import, sehingga saya dapat mengetahui transaksi mana yang berhasil dan mana yang gagal.

#### Acceptance Criteria

1. WHEN batch pemrosesan selesai THEN the System SHALL menampilkan laporan dengan jumlah transaksi berhasil dan gagal
2. WHEN laporan ditampilkan THEN the System SHALL menampilkan detail setiap transaksi yang berhasil dengan nomor transaksi
3. WHEN laporan ditampilkan THEN the System SHALL menampilkan detail setiap transaksi yang gagal dengan alasan kegagalan
4. WHEN laporan ditampilkan THEN the System SHALL menyediakan opsi untuk mengunduh laporan dalam format CSV
5. WHEN laporan diunduh THEN the System SHALL menyertakan timestamp dan nama kasir yang memproses

### Requirement 7

**User Story:** Sebagai sistem, saya ingin mencatat audit trail untuk setiap proses import, sehingga semua aktivitas import dapat dilacak dan diaudit.

#### Acceptance Criteria

1. WHEN file diupload THEN the System SHALL mencatat audit log dengan nama file, ukuran, dan kasir yang mengupload
2. WHEN validasi dilakukan THEN the System SHALL mencatat jumlah data valid dan invalid dalam audit log
3. WHEN batch diproses THEN the System SHALL mencatat setiap transaksi individual dalam audit log
4. WHEN proses import selesai THEN the System SHALL mencatat summary hasil import dalam audit log
5. WHEN terjadi error sistem THEN the System SHALL mencatat detail error dalam audit log untuk troubleshooting

### Requirement 8

**User Story:** Sebagai kasir, saya ingin sistem menangani error dengan graceful, sehingga proses import tidak mengganggu operasional sistem lainnya.

#### Acceptance Criteria

1. WHEN terjadi error parsing file THEN the System SHALL menampilkan pesan error yang jelas dan tidak memproses data
2. WHEN terjadi error validasi data THEN the System SHALL menandai baris bermasalah dan melanjutkan validasi lainnya
3. WHEN terjadi error koneksi database THEN the System SHALL menghentikan proses dan menampilkan pesan error
4. WHEN terjadi error sistem kritis THEN the System SHALL melakukan rollback untuk transaksi yang sudah diproses dalam batch tersebut
5. WHEN error ditangani THEN the System SHALL menyimpan log error untuk analisis dan perbaikan

### Requirement 9

**User Story:** Sebagai admin, saya ingin mengatur konfigurasi import, sehingga saya dapat mengontrol parameter dan batasan proses import.

#### Acceptance Criteria

1. WHEN admin mengakses pengaturan import THEN the System SHALL menampilkan opsi untuk mengatur ukuran file maksimum
2. WHEN admin mengakses pengaturan import THEN the System SHALL menampilkan opsi untuk mengatur jumlah maksimum baris per batch
3. WHEN admin mengakses pengaturan import THEN the System SHALL menampilkan opsi untuk mengaktifkan atau menonaktifkan fitur import
4. WHEN admin mengubah konfigurasi THEN the System SHALL menyimpan pengaturan dan menerapkannya pada proses import berikutnya
5. WHEN konfigurasi disimpan THEN the System SHALL mencatat perubahan dalam audit log dengan timestamp dan admin yang mengubah

### Requirement 10

**User Story:** Sebagai kasir, saya ingin dapat membatalkan proses import yang sedang berjalan, sehingga saya dapat menghentikan proses jika diperlukan.

#### Acceptance Criteria

1. WHEN proses import sedang berjalan THEN the System SHALL menampilkan tombol cancel dan progress indicator
2. WHEN kasir mengklik cancel THEN the System SHALL menghentikan pemrosesan batch yang sedang berjalan
3. WHEN proses dibatalkan THEN the System SHALL melakukan rollback untuk transaksi yang sudah diproses dalam batch tersebut
4. WHEN rollback dilakukan THEN the System SHALL mengembalikan saldo anggota ke kondisi sebelum import
5. WHEN pembatalan selesai THEN the System SHALL menampilkan konfirmasi pembatalan dan mencatat dalam audit log