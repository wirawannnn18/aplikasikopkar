# Requirements Document

## Introduction

Sistem saat ini menyimpan data anggota keluar dan simpanannya untuk keperluan audit trail. Namun, ada kebutuhan untuk menghapus permanen semua data anggota keluar (termasuk data simpanan pokok dan wajib) setelah surat pengunduran diri di-print. Fitur ini akan menambahkan opsi untuk menghapus permanen data anggota keluar dari sistem setelah proses pengembalian selesai dan surat telah dicetak.

## Glossary

- **Anggota Keluar**: Anggota koperasi yang telah mengajukan keluar dari koperasi
- **Pengembalian Simpanan**: Proses pencairan dan pengembalian simpanan pokok dan wajib kepada anggota keluar
- **Simpanan Pokok**: Simpanan yang dibayarkan satu kali saat menjadi anggota
- **Simpanan Wajib**: Simpanan yang dibayarkan secara berkala oleh anggota
- **Surat Pengunduran Diri**: Dokumen resmi yang menyatakan anggota mengundurkan diri dari koperasi
- **Hapus Permanen**: Menghapus data dari localStorage sehingga tidak dapat dipulihkan
- **Jurnal Akuntansi**: Catatan transaksi keuangan dalam sistem akuntansi double-entry
- **Audit Trail**: Catatan historis dari semua transaksi dan perubahan data

## Requirements

### Requirement 1

**User Story:** Sebagai admin koperasi, saya ingin menghapus permanen data anggota keluar setelah print surat pengunduran diri, sehingga data anggota tersebut benar-benar terhapus dari sistem dan tidak memenuhi storage.

#### Acceptance Criteria

1. WHEN admin mencetak surat pengunduran diri THEN sistem SHALL menampilkan konfirmasi untuk menghapus permanen data anggota
2. WHEN admin mengkonfirmasi penghapusan THEN sistem SHALL menghapus data anggota dari localStorage anggota
3. WHEN admin mengkonfirmasi penghapusan THEN sistem SHALL menghapus semua data simpanan pokok anggota tersebut
4. WHEN admin mengkonfirmasi penghapusan THEN sistem SHALL menghapus semua data simpanan wajib anggota tersebut
5. WHEN admin mengkonfirmasi penghapusan THEN sistem SHALL menghapus semua data simpanan sukarela anggota tersebut (jika ada)

### Requirement 2

**User Story:** Sebagai admin koperasi, saya ingin jurnal akuntansi tetap tersimpan meskipun data anggota dihapus, sehingga catatan keuangan tetap lengkap untuk keperluan audit.

#### Acceptance Criteria

1. WHEN sistem menghapus data anggota keluar THEN sistem SHALL mempertahankan semua jurnal akuntansi terkait pengembalian simpanan
2. WHEN sistem menghapus data anggota keluar THEN sistem SHALL mempertahankan data pengembalian untuk referensi historis
3. WHEN sistem menghapus data anggota keluar THEN sistem SHALL mempertahankan audit log terkait anggota tersebut
4. WHEN admin melihat jurnal akuntansi THEN sistem SHALL tetap menampilkan jurnal pengembalian dengan nama anggota yang sudah dihapus
5. WHEN admin melihat laporan pengembalian THEN sistem SHALL tetap menampilkan data pengembalian historis

### Requirement 3

**User Story:** Sebagai admin koperasi, saya ingin sistem mencatat penghapusan data anggota ke audit log, sehingga ada jejak siapa dan kapan data dihapus.

#### Acceptance Criteria

1. WHEN admin menghapus data anggota keluar THEN sistem SHALL mencatat aksi penghapusan ke audit log
2. WHEN sistem mencatat penghapusan THEN audit log SHALL berisi ID anggota yang dihapus
3. WHEN sistem mencatat penghapusan THEN audit log SHALL berisi nama anggota yang dihapus
4. WHEN sistem mencatat penghapusan THEN audit log SHALL berisi user ID yang melakukan penghapusan
5. WHEN sistem mencatat penghapusan THEN audit log SHALL berisi timestamp penghapusan

### Requirement 4

**User Story:** Sebagai admin koperasi, saya ingin penghapusan data hanya bisa dilakukan setelah pengembalian selesai, sehingga tidak ada data yang terhapus sebelum proses pengembalian tuntas.

#### Acceptance Criteria

1. WHEN admin mencoba menghapus data anggota THEN sistem SHALL memvalidasi bahwa pengembalianStatus = 'Selesai'
2. WHEN pengembalianStatus bukan 'Selesai' THEN sistem SHALL menolak penghapusan dan menampilkan pesan error
3. WHEN admin mencoba menghapus data anggota THEN sistem SHALL memvalidasi bahwa surat sudah pernah di-print
4. WHEN surat belum pernah di-print THEN sistem SHALL menolak penghapusan dan menampilkan pesan error
5. WHEN validasi berhasil THEN sistem SHALL menampilkan konfirmasi penghapusan dengan detail anggota

### Requirement 5

**User Story:** Sebagai admin koperasi, saya ingin konfirmasi penghapusan yang jelas dan aman, sehingga tidak ada penghapusan data yang tidak disengaja.

#### Acceptance Criteria

1. WHEN sistem menampilkan konfirmasi penghapusan THEN sistem SHALL menampilkan nama lengkap anggota
2. WHEN sistem menampilkan konfirmasi penghapusan THEN sistem SHALL menampilkan NIK anggota
3. WHEN sistem menampilkan konfirmasi penghapusan THEN sistem SHALL menampilkan peringatan bahwa data tidak dapat dipulihkan
4. WHEN sistem menampilkan konfirmasi penghapusan THEN sistem SHALL meminta admin mengetik "HAPUS" untuk konfirmasi
5. WHEN admin membatalkan penghapusan THEN sistem SHALL tidak menghapus data apapun

### Requirement 6

**User Story:** Sebagai admin koperasi, saya ingin sistem menghapus data transaksi terkait anggota keluar, sehingga tidak ada data transaksi yang menggantung setelah anggota dihapus.

#### Acceptance Criteria

1. WHEN sistem menghapus data anggota keluar THEN sistem SHALL menghapus semua transaksi POS yang terkait anggota tersebut
2. WHEN sistem menghapus data anggota keluar THEN sistem SHALL menghapus semua data pinjaman yang terkait anggota tersebut (jika sudah lunas)
3. WHEN sistem menghapus data anggota keluar THEN sistem SHALL menghapus semua data pembayaran hutang/piutang yang terkait anggota tersebut
4. WHEN ada pinjaman yang belum lunas THEN sistem SHALL menolak penghapusan dan menampilkan pesan error
5. WHEN ada hutang POS yang belum lunas THEN sistem SHALL menolak penghapusan dan menampilkan pesan error

### Requirement 7

**User Story:** Sebagai admin koperasi, saya ingin sistem memberikan feedback yang jelas setelah penghapusan, sehingga saya tahu penghapusan berhasil atau gagal.

#### Acceptance Criteria

1. WHEN penghapusan berhasil THEN sistem SHALL menampilkan notifikasi sukses dengan nama anggota yang dihapus
2. WHEN penghapusan berhasil THEN sistem SHALL menutup modal detail anggota keluar
3. WHEN penghapusan berhasil THEN sistem SHALL me-refresh daftar anggota keluar
4. WHEN penghapusan gagal THEN sistem SHALL menampilkan pesan error yang jelas
5. WHEN penghapusan gagal THEN sistem SHALL tidak mengubah data apapun

### Requirement 8

**User Story:** Sebagai admin koperasi, saya ingin opsi penghapusan bersifat opsional, sehingga saya bisa memilih untuk tetap menyimpan data untuk audit trail jika diperlukan.

#### Acceptance Criteria

1. WHEN admin mencetak surat pengunduran diri THEN sistem SHALL menampilkan tombol "Hapus Data Permanen" sebagai opsi
2. WHEN admin tidak ingin menghapus data THEN admin SHALL bisa menutup modal tanpa menghapus data
3. WHEN admin memilih untuk tidak menghapus THEN data anggota keluar SHALL tetap tersimpan dengan saldo simpanan 0
4. WHEN admin memilih untuk menghapus THEN sistem SHALL menjalankan proses penghapusan permanen
5. WHEN sistem menampilkan tombol hapus THEN tombol SHALL hanya muncul jika pengembalianStatus = 'Selesai'
