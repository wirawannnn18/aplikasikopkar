# Requirements Document

## Introduction

Fitur ini memungkinkan administrator dengan hak akses khusus untuk menghapus transaksi POS yang sudah masuk dalam laporan tutup kasir yang telah ditutup. Fitur ini diperlukan untuk menangani kasus kesalahan kritis yang baru ditemukan setelah tutup kasir, atau kebutuhan koreksi data yang mendesak. Mengingat dampak signifikan terhadap integritas laporan keuangan, fitur ini memerlukan kontrol keamanan dan audit yang sangat ketat.

## Glossary

- **Sistem**: Aplikasi Koperasi Karyawan yang mengelola transaksi POS
- **Super Admin**: User dengan role 'administrator' yang memiliki hak akses khusus untuk menghapus transaksi tertutup
- **Transaksi Tertutup**: Transaksi POS yang sudah masuk dalam laporan tutup kasir yang telah ditutup
- **Laporan Tutup Kasir**: Record penutupan shift kasir yang tersimpan di localStorage dengan key 'riwayatTutupKas'
- **Password Konfirmasi**: Password user yang harus dimasukkan ulang untuk konfirmasi penghapusan transaksi tertutup
- **Audit Trail**: Catatan lengkap semua aktivitas penghapusan transaksi tertutup dengan informasi detail
- **Reversal Jurnal**: Jurnal pembalik yang dibuat untuk membatalkan efek transaksi yang dihapus
- **Adjustment Tutup Kasir**: Penyesuaian yang dibuat pada laporan tutup kasir setelah transaksi dihapus

## Requirements

### Requirement 1

**User Story:** Sebagai super admin, saya ingin dapat mengidentifikasi transaksi yang sudah tutup kasir, sehingga saya tahu transaksi mana yang memerlukan proses khusus untuk dihapus.

#### Acceptance Criteria

1. WHEN super admin mengakses halaman hapus transaksi THEN Sistem SHALL menampilkan indikator visual yang jelas untuk transaksi yang sudah masuk dalam shift tertutup
2. WHEN transaksi sudah masuk dalam shift tertutup THEN Sistem SHALL menampilkan badge atau label "Shift Tertutup" pada baris transaksi tersebut
3. WHEN super admin memfilter transaksi THEN Sistem SHALL menyediakan filter khusus untuk menampilkan hanya transaksi yang sudah tutup kasir
4. WHEN super admin melihat detail transaksi tertutup THEN Sistem SHALL menampilkan informasi shift tutup kasir terkait (tanggal tutup, kasir, nomor laporan)

### Requirement 2

**User Story:** Sebagai super admin, saya ingin sistem memvalidasi hak akses saya sebelum mengizinkan penghapusan transaksi tertutup, sehingga hanya user yang berwenang yang dapat melakukan operasi ini.

#### Acceptance Criteria

1. WHEN user dengan role selain 'administrator' mencoba menghapus transaksi tertutup THEN Sistem SHALL menampilkan pesan error dan mencegah akses
2. WHEN super admin mencoba menghapus transaksi tertutup THEN Sistem SHALL meminta konfirmasi password user yang sedang login
3. WHEN password konfirmasi salah THEN Sistem SHALL menampilkan pesan error dan tidak melanjutkan proses penghapusan
4. WHEN password konfirmasi benar THEN Sistem SHALL mengizinkan proses penghapusan dilanjutkan
5. WHEN super admin memasukkan password salah sebanyak 3 kali berturut-turut THEN Sistem SHALL memblokir akses sementara selama 5 menit

### Requirement 3

**User Story:** Sebagai super admin, saya ingin memberikan alasan detail dan kategori kesalahan saat menghapus transaksi tertutup, sehingga ada dokumentasi yang sangat jelas untuk audit.

#### Acceptance Criteria

1. WHEN super admin mengkonfirmasi penghapusan transaksi tertutup THEN Sistem SHALL meminta kategori kesalahan dari pilihan yang tersedia (Kesalahan Input, Transaksi Duplikat, Fraud, Koreksi Akuntansi, Lainnya)
2. WHEN kategori kesalahan dipilih THEN Sistem SHALL meminta alasan detail penghapusan dengan minimal 20 karakter
3. WHEN alasan penghapusan kurang dari 20 karakter THEN Sistem SHALL menampilkan peringatan dan tidak melanjutkan proses
4. WHEN alasan penghapusan lebih dari 1000 karakter THEN Sistem SHALL menampilkan peringatan batas maksimal karakter
5. WHEN kategori dan alasan sudah diisi THEN Sistem SHALL menampilkan ringkasan lengkap sebelum konfirmasi final

### Requirement 4

**User Story:** Sebagai super admin, saya ingin sistem melakukan adjustment pada laporan tutup kasir saat transaksi dihapus, sehingga laporan tetap akurat dan balanced.

#### Acceptance Criteria

1. WHEN transaksi tertutup dihapus THEN Sistem SHALL mengidentifikasi laporan tutup kasir yang terkait dengan transaksi tersebut
2. WHEN laporan tutup kasir teridentifikasi THEN Sistem SHALL mengurangi total penjualan pada laporan sesuai dengan nilai transaksi yang dihapus
3. WHEN transaksi cash dihapus THEN Sistem SHALL mengurangi total kas pada laporan tutup kasir
4. WHEN transaksi kredit dihapus THEN Sistem SHALL mengurangi total piutang pada laporan tutup kasir
5. WHEN adjustment selesai THEN Sistem SHALL menambahkan catatan adjustment pada laporan tutup kasir dengan referensi ke transaksi yang dihapus

### Requirement 5

**User Story:** Sebagai super admin, saya ingin sistem membuat jurnal reversal dan adjustment jurnal tutup kasir, sehingga pembukuan tetap seimbang dan akurat.

#### Acceptance Criteria

1. WHEN transaksi tertutup dihapus THEN Sistem SHALL membuat jurnal reversal untuk transaksi tersebut dengan deskripsi "Reversal Transaksi Tertutup"
2. WHEN jurnal reversal dibuat THEN Sistem SHALL menggunakan tanggal penghapusan sebagai tanggal jurnal
3. WHEN transaksi cash tertutup dihapus THEN Sistem SHALL membuat jurnal: Debit Pendapatan Penjualan, Kredit Kas
4. WHEN transaksi kredit tertutup dihapus THEN Sistem SHALL membuat jurnal: Debit Pendapatan Penjualan, Kredit Piutang
5. WHEN transaksi tertutup dihapus THEN Sistem SHALL membuat jurnal reversal HPP: Debit Persediaan, Kredit HPP
6. WHEN jurnal reversal dibuat THEN Sistem SHALL menambahkan tag khusus "CLOSED_SHIFT_REVERSAL" pada jurnal untuk identifikasi

### Requirement 6

**User Story:** Sebagai super admin, saya ingin sistem mencatat audit trail yang sangat detail untuk setiap penghapusan transaksi tertutup, sehingga ada jejak lengkap untuk investigasi.

#### Acceptance Criteria

1. WHEN transaksi tertutup dihapus THEN Sistem SHALL mencatat log audit dengan level "CRITICAL"
2. WHEN log audit dibuat THEN Sistem SHALL menyimpan informasi: user yang menghapus, password verification timestamp, kategori kesalahan, alasan detail, IP address (jika tersedia), browser info
3. WHEN log audit dibuat THEN Sistem SHALL menyimpan snapshot lengkap transaksi sebelum dihapus
4. WHEN log audit dibuat THEN Sistem SHALL menyimpan snapshot laporan tutup kasir sebelum dan sesudah adjustment
5. WHEN log audit dibuat THEN Sistem SHALL menyimpan semua jurnal reversal yang dibuat
6. WHEN log audit dibuat THEN Sistem SHALL generate unique audit ID dengan format "AUDIT-CLOSED-YYYYMMDD-NNNN"

### Requirement 7

**User Story:** Sebagai super admin, saya ingin melihat riwayat penghapusan transaksi tertutup secara terpisah, sehingga saya dapat dengan mudah memonitor aktivitas kritis ini.

#### Acceptance Criteria

1. WHEN super admin mengakses halaman riwayat penghapusan THEN Sistem SHALL menyediakan tab terpisah untuk "Transaksi Tertutup"
2. WHEN riwayat transaksi tertutup ditampilkan THEN Sistem SHALL menampilkan badge "CRITICAL" pada setiap entry
3. WHEN riwayat ditampilkan THEN Sistem SHALL menampilkan: Audit ID, No Transaksi, Tanggal Transaksi, Tanggal Tutup Kasir, Tanggal Penghapusan, User, Kategori Kesalahan, Status Adjustment
4. WHEN super admin melihat detail riwayat THEN Sistem SHALL menampilkan semua informasi audit lengkap termasuk snapshot before/after
5. WHEN super admin mengakses riwayat THEN Sistem SHALL menyediakan fitur export ke PDF untuk keperluan audit eksternal

### Requirement 8

**User Story:** Sebagai super admin, saya ingin sistem memberikan warning yang jelas tentang dampak penghapusan transaksi tertutup, sehingga saya memahami konsekuensinya sebelum melanjutkan.

#### Acceptance Criteria

1. WHEN super admin memilih transaksi tertutup untuk dihapus THEN Sistem SHALL menampilkan dialog warning dengan daftar dampak yang akan terjadi
2. WHEN warning ditampilkan THEN Sistem SHALL menampilkan: dampak pada laporan tutup kasir, dampak pada jurnal akuntansi, dampak pada stok barang, dampak pada laporan keuangan
3. WHEN warning ditampilkan THEN Sistem SHALL meminta super admin mencentang checkbox "Saya memahami konsekuensi dari tindakan ini"
4. WHEN checkbox belum dicentang THEN Sistem SHALL menonaktifkan tombol konfirmasi
5. WHEN checkbox sudah dicentang THEN Sistem SHALL mengaktifkan tombol konfirmasi untuk melanjutkan

### Requirement 9

**User Story:** Sebagai super admin, saya ingin sistem melakukan validasi integritas data sebelum dan sesudah penghapusan, sehingga tidak ada data yang corrupt atau tidak konsisten.

#### Acceptance Criteria

1. WHEN super admin mengkonfirmasi penghapusan THEN Sistem SHALL melakukan pre-deletion validation untuk memastikan semua data terkait konsisten
2. WHEN pre-deletion validation gagal THEN Sistem SHALL menampilkan error detail dan membatalkan proses
3. WHEN penghapusan selesai THEN Sistem SHALL melakukan post-deletion validation untuk memastikan integritas data
4. WHEN post-deletion validation gagal THEN Sistem SHALL melakukan rollback otomatis dan menampilkan error
5. WHEN validation berhasil THEN Sistem SHALL menampilkan konfirmasi sukses dengan ringkasan perubahan yang dilakukan

### Requirement 10

**User Story:** Sebagai super admin, saya ingin sistem membatasi frekuensi penghapusan transaksi tertutup, sehingga fitur ini tidak disalahgunakan.

#### Acceptance Criteria

1. WHEN super admin menghapus transaksi tertutup THEN Sistem SHALL mencatat timestamp penghapusan untuk user tersebut
2. WHEN super admin mencoba menghapus transaksi tertutup lagi dalam waktu kurang dari 1 jam THEN Sistem SHALL menampilkan warning tentang frekuensi tinggi
3. WHEN super admin menghapus lebih dari 5 transaksi tertutup dalam 1 hari THEN Sistem SHALL menampilkan peringatan dan meminta justifikasi tambahan
4. WHEN super admin menghapus lebih dari 10 transaksi tertutup dalam 1 hari THEN Sistem SHALL memblokir akses dan mengirim notifikasi ke log sistem
