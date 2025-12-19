# Requirements Document

## Introduction

Fitur pembayaran hutang piutang anggota memungkinkan koperasi untuk mencatat dan memproses pembayaran dari anggota yang memiliki hutang (pinjaman) atau pembayaran kepada anggota yang memiliki piutang (simpanan yang harus dikembalikan). Sistem ini akan terintegrasi dengan modul akuntansi untuk mencatat jurnal otomatis dan memperbarui saldo hutang/piutang anggota secara real-time.

## Implementation Status

**Status:** ✅ **FULLY IMPLEMENTED AND OPERATIONAL**

**Last Updated:** December 19, 2024

**Key Achievements:**
- All 17 implementation tasks completed
- Menu functionality restored (fixed missing utility functions)
- Comprehensive test coverage with property-based testing
- Full integration with import batch functionality
- Production-ready with complete documentation

**Current Version:** v2.0 (Integrated with Import Batch functionality)

## Glossary

- **System**: Aplikasi Koperasi
- **Anggota**: Member koperasi yang terdaftar dalam sistem
- **Hutang**: Kewajiban anggota kepada koperasi (pinjaman yang belum lunas)
- **Piutang**: Hak anggota untuk menerima pembayaran dari koperasi (simpanan yang harus dikembalikan)
- **Pembayaran Hutang**: Transaksi pelunasan sebagian atau seluruh hutang anggota kepada koperasi
- **Pembayaran Piutang**: Transaksi pengembalian dana kepada anggota untuk melunasi piutang
- **Jurnal**: Catatan akuntansi double-entry yang mencatat debit dan kredit
- **Saldo Hutang**: Total kewajiban anggota yang belum dibayar
- **Saldo Piutang**: Total hak anggota yang belum dibayarkan
- **Kasir**: User dengan role kasir yang memproses transaksi pembayaran
- **Admin**: User dengan role admin yang dapat melihat dan mengelola semua transaksi

## Requirements

### Requirement 1

**User Story:** Sebagai kasir, saya ingin mencatat pembayaran hutang dari anggota, sehingga saldo hutang anggota berkurang dan kas koperasi bertambah.

#### Acceptance Criteria

1. WHEN kasir memilih anggota yang memiliki hutang THEN the System SHALL menampilkan total saldo hutang anggota tersebut
2. WHEN kasir memasukkan jumlah pembayaran hutang THEN the System SHALL memvalidasi bahwa jumlah pembayaran tidak melebihi saldo hutang
3. WHEN pembayaran hutang diproses THEN the System SHALL mengurangi saldo hutang anggota sesuai jumlah pembayaran
4. WHEN pembayaran hutang diproses THEN the System SHALL mencatat jurnal dengan debit Kas dan kredit Hutang Anggota
5. WHEN pembayaran hutang berhasil THEN the System SHALL menampilkan konfirmasi dengan detail pembayaran dan saldo hutang terbaru

### Requirement 2

**User Story:** Sebagai kasir, saya ingin mencatat pembayaran piutang kepada anggota, sehingga saldo piutang anggota berkurang dan kas koperasi berkurang.

#### Acceptance Criteria

1. WHEN kasir memilih anggota yang memiliki piutang THEN the System SHALL menampilkan total saldo piutang anggota tersebut
2. WHEN kasir memasukkan jumlah pembayaran piutang THEN the System SHALL memvalidasi bahwa jumlah pembayaran tidak melebihi saldo piutang
3. WHEN pembayaran piutang diproses THEN the System SHALL mengurangi saldo piutang anggota sesuai jumlah pembayaran
4. WHEN pembayaran piutang diproses THEN the System SHALL mencatat jurnal dengan debit Piutang Anggota dan kredit Kas
5. WHEN pembayaran piutang berhasil THEN the System SHALL menampilkan konfirmasi dengan detail pembayaran dan saldo piutang terbaru

### Requirement 3

**User Story:** Sebagai kasir, saya ingin sistem memvalidasi transaksi pembayaran, sehingga tidak terjadi kesalahan pencatatan yang merugikan koperasi atau anggota.

#### Acceptance Criteria

1. WHEN jumlah pembayaran kosong atau nol THEN the System SHALL menolak transaksi dan menampilkan pesan error
2. WHEN jumlah pembayaran negatif THEN the System SHALL menolak transaksi dan menampilkan pesan error
3. WHEN jumlah pembayaran hutang melebihi saldo hutang THEN the System SHALL menolak transaksi dan menampilkan pesan error
4. WHEN jumlah pembayaran piutang melebihi saldo piutang THEN the System SHALL menolak transaksi dan menampilkan pesan error
5. WHEN anggota tidak memiliki hutang atau piutang THEN the System SHALL menampilkan pesan informasi bahwa tidak ada saldo yang perlu dibayar

### Requirement 4

**User Story:** Sebagai admin, saya ingin melihat riwayat pembayaran hutang piutang anggota, sehingga saya dapat melakukan audit dan monitoring transaksi.

#### Acceptance Criteria

1. WHEN admin membuka halaman riwayat pembayaran THEN the System SHALL menampilkan daftar semua transaksi pembayaran hutang dan piutang
2. WHEN menampilkan riwayat pembayaran THEN the System SHALL menampilkan tanggal, nama anggota, jenis pembayaran, jumlah, dan kasir yang memproses
3. WHEN admin memfilter berdasarkan jenis pembayaran THEN the System SHALL menampilkan hanya transaksi sesuai jenis yang dipilih
4. WHEN admin memfilter berdasarkan periode tanggal THEN the System SHALL menampilkan hanya transaksi dalam rentang tanggal tersebut
5. WHEN admin memfilter berdasarkan anggota THEN the System SHALL menampilkan hanya transaksi anggota yang dipilih

### Requirement 5

**User Story:** Sebagai kasir, saya ingin sistem mencatat audit trail untuk setiap pembayaran, sehingga setiap transaksi dapat dilacak dan dipertanggungjawabkan.

#### Acceptance Criteria

1. WHEN pembayaran hutang atau piutang diproses THEN the System SHALL mencatat audit log dengan user, timestamp, dan detail transaksi
2. WHEN audit log dicatat THEN the System SHALL menyimpan informasi anggota, jenis pembayaran, jumlah, dan saldo sebelum dan sesudah
3. WHEN terjadi error dalam pemrosesan THEN the System SHALL mencatat error log dengan detail kesalahan
4. WHEN audit log disimpan THEN the System SHALL memastikan data tersimpan secara permanen di localStorage
5. WHEN admin mengakses audit log THEN the System SHALL menampilkan riwayat lengkap dengan kemampuan pencarian dan filter

### Requirement 6

**User Story:** Sebagai kasir, saya ingin interface pembayaran yang mudah digunakan, sehingga saya dapat memproses transaksi dengan cepat dan akurat.

#### Acceptance Criteria

1. WHEN kasir membuka menu pembayaran hutang piutang THEN the System SHALL menampilkan form dengan field pencarian anggota, jenis pembayaran, dan jumlah
2. WHEN kasir mengetik nama atau nomor anggota THEN the System SHALL menampilkan saran anggota yang sesuai dengan autocomplete
3. WHEN anggota dipilih THEN the System SHALL menampilkan saldo hutang dan piutang anggota secara otomatis
4. WHEN kasir memilih jenis pembayaran THEN the System SHALL menampilkan saldo yang relevan dan mengaktifkan input jumlah
5. WHEN form diisi lengkap THEN the System SHALL mengaktifkan tombol proses pembayaran

### Requirement 7

**User Story:** Sebagai sistem, saya ingin memastikan integritas data akuntansi, sehingga setiap pembayaran tercatat dengan benar dalam jurnal dan saldo.

#### Acceptance Criteria

1. WHEN pembayaran hutang dicatat THEN the System SHALL memastikan total debit sama dengan total kredit dalam jurnal
2. WHEN pembayaran piutang dicatat THEN the System SHALL memastikan total debit sama dengan total kredit dalam jurnal
3. WHEN jurnal dicatat THEN the System SHALL memperbarui saldo akun Kas, Hutang Anggota, atau Piutang Anggota secara konsisten
4. WHEN terjadi error saat pencatatan jurnal THEN the System SHALL membatalkan seluruh transaksi dan mengembalikan saldo ke kondisi awal
5. WHEN transaksi berhasil THEN the System SHALL memastikan saldo anggota dan jurnal tersimpan secara atomik

### Requirement 8

**User Story:** Sebagai kasir, saya ingin dapat mencetak bukti pembayaran, sehingga anggota memiliki bukti transaksi yang sah.

#### Acceptance Criteria

1. WHEN pembayaran berhasil diproses THEN the System SHALL menampilkan opsi untuk mencetak bukti pembayaran
2. WHEN bukti pembayaran dicetak THEN the System SHALL menampilkan nomor transaksi, tanggal, nama anggota, jenis pembayaran, jumlah, dan saldo terbaru
3. WHEN bukti pembayaran dicetak THEN the System SHALL menampilkan nama kasir yang memproses transaksi
4. WHEN bukti pembayaran dicetak THEN the System SHALL menggunakan format yang jelas dan mudah dibaca
5. WHEN bukti pembayaran dicetak THEN the System SHALL menyimpan riwayat pencetakan dalam audit log
