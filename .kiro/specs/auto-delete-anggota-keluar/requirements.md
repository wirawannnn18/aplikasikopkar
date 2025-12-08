# Requirements Document

## Introduction

Sistem saat ini menyimpan data anggota keluar dengan `statusKeanggotaan = 'Keluar'` dan hanya menyembunyikannya dari tampilan master anggota. Namun, ada kebutuhan untuk mengubah desain sistem agar anggota yang keluar **dihapus otomatis** dari database setelah proses pengembalian selesai. Sebelum dihapus, status anggota harus diubah menjadi "Nonaktif" untuk audit trail.

## Glossary

- **Anggota Keluar**: Anggota koperasi yang telah mengajukan keluar dari koperasi
- **Pengembalian Simpanan**: Proses pencairan dan pengembalian simpanan pokok dan wajib kepada anggota keluar
- **Auto-Delete**: Penghapusan otomatis data anggota setelah pengembalian selesai
- **Status Nonaktif**: Status yang diberikan kepada anggota sebelum dihapus untuk keperluan audit trail
- **Jurnal Akuntansi**: Catatan transaksi keuangan dalam sistem akuntansi double-entry
- **Audit Trail**: Catatan historis dari semua transaksi dan perubahan data

## Requirements

### Requirement 1

**User Story:** Sebagai admin koperasi, saya ingin anggota yang keluar dihapus otomatis setelah pengembalian selesai, sehingga data tidak menumpuk di database dan tidak perlu dihapus manual.

#### Acceptance Criteria

1. WHEN sistem memproses pengembalian simpanan THEN sistem SHALL mengubah status anggota menjadi "Nonaktif"
2. WHEN pengembalian selesai diproses THEN sistem SHALL menghapus data anggota secara otomatis
3. WHEN sistem menghapus data anggota THEN sistem SHALL menghapus semua data simpanan terkait
4. WHEN sistem menghapus data anggota THEN sistem SHALL menghapus semua transaksi terkait
5. WHEN sistem menghapus data anggota THEN sistem SHALL mencatat penghapusan ke audit log

### Requirement 2

**User Story:** Sebagai admin koperasi, saya ingin status anggota diubah menjadi "Nonaktif" sebelum dihapus, sehingga ada jejak perubahan status di audit trail.

#### Acceptance Criteria

1. WHEN admin menandai anggota keluar THEN sistem SHALL mengubah status dari "Aktif" menjadi "Nonaktif"
2. WHEN status diubah menjadi "Nonaktif" THEN sistem SHALL mencatat perubahan ke audit log
3. WHEN sistem memproses pengembalian THEN status SHALL tetap "Nonaktif"
4. WHEN pengembalian selesai THEN sistem SHALL menghapus anggota dengan status "Nonaktif"
5. WHEN audit log dilihat THEN perubahan status SHALL terlihat sebelum penghapusan

### Requirement 3

**User Story:** Sebagai admin koperasi, saya ingin jurnal akuntansi tetap tersimpan meskipun data anggota dihapus, sehingga catatan keuangan tetap lengkap untuk keperluan audit.

#### Acceptance Criteria

1. WHEN sistem menghapus data anggota keluar THEN sistem SHALL mempertahankan semua jurnal akuntansi terkait pengembalian simpanan
2. WHEN sistem menghapus data anggota keluar THEN sistem SHALL mempertahankan data pengembalian untuk referensi historis
3. WHEN sistem menghapus data anggota keluar THEN sistem SHALL mempertahankan audit log terkait anggota tersebut
4. WHEN admin melihat jurnal akuntansi THEN sistem SHALL tetap menampilkan jurnal pengembalian dengan nama anggota yang sudah dihapus
5. WHEN admin melihat laporan pengembalian THEN sistem SHALL tetap menampilkan data pengembalian historis

### Requirement 4

**User Story:** Sebagai admin koperasi, saya ingin sistem mencatat penghapusan otomatis ke audit log, sehingga ada jejak kapan data dihapus dan oleh siapa.

#### Acceptance Criteria

1. WHEN sistem menghapus data anggota otomatis THEN sistem SHALL mencatat aksi penghapusan ke audit log
2. WHEN sistem mencatat penghapusan THEN audit log SHALL berisi ID anggota yang dihapus
3. WHEN sistem mencatat penghapusan THEN audit log SHALL berisi nama anggota yang dihapus
4. WHEN sistem mencatat penghapusan THEN audit log SHALL berisi user ID yang memproses pengembalian
5. WHEN sistem mencatat penghapusan THEN audit log SHALL berisi timestamp penghapusan

### Requirement 5

**User Story:** Sebagai admin koperasi, saya ingin penghapusan otomatis hanya terjadi setelah pengembalian selesai, sehingga tidak ada data yang terhapus sebelum proses pengembalian tuntas.

#### Acceptance Criteria

1. WHEN sistem memproses pengembalian THEN sistem SHALL memvalidasi bahwa semua simpanan sudah dikembalikan
2. WHEN pengembalian belum selesai THEN sistem SHALL tidak menghapus data anggota
3. WHEN pengembalian selesai THEN sistem SHALL menghapus data anggota secara otomatis
4. WHEN ada pinjaman yang belum lunas THEN sistem SHALL menolak penghapusan dan menampilkan pesan error
5. WHEN ada hutang POS yang belum lunas THEN sistem SHALL menolak penghapusan dan menampilkan pesan error

### Requirement 6

**User Story:** Sebagai admin koperasi, saya ingin sistem menghapus data transaksi terkait anggota keluar, sehingga tidak ada data transaksi yang menggantung setelah anggota dihapus.

#### Acceptance Criteria

1. WHEN sistem menghapus data anggota keluar THEN sistem SHALL menghapus semua transaksi POS yang terkait anggota tersebut
2. WHEN sistem menghapus data anggota keluar THEN sistem SHALL menghapus semua data pinjaman yang terkait anggota tersebut (jika sudah lunas)
3. WHEN sistem menghapus data anggota keluar THEN sistem SHALL menghapus semua data pembayaran hutang/piutang yang terkait anggota tersebut
4. WHEN ada pinjaman yang belum lunas THEN sistem SHALL menolak penghapusan dan menampilkan pesan error
5. WHEN ada hutang POS yang belum lunas THEN sistem SHALL menolak penghapusan dan menampilkan pesan error

### Requirement 7

**User Story:** Sebagai admin koperasi, saya ingin sistem memberikan notifikasi setelah penghapusan otomatis, sehingga saya tahu data sudah dihapus.

#### Acceptance Criteria

1. WHEN penghapusan otomatis berhasil THEN sistem SHALL menampilkan notifikasi sukses dengan nama anggota yang dihapus
2. WHEN penghapusan otomatis berhasil THEN sistem SHALL me-refresh daftar anggota keluar
3. WHEN penghapusan otomatis gagal THEN sistem SHALL menampilkan pesan error yang jelas
4. WHEN penghapusan otomatis gagal THEN sistem SHALL tidak mengubah data apapun
5. WHEN penghapusan otomatis gagal THEN sistem SHALL mencatat error ke audit log

### Requirement 8

**User Story:** Sebagai admin koperasi, saya ingin field `statusKeanggotaan` dihapus dari sistem, sehingga tidak ada lagi konsep "anggota keluar" yang tersimpan di database.

#### Acceptance Criteria

1. WHEN sistem diupdate THEN field `statusKeanggotaan` SHALL dihapus dari data model anggota
2. WHEN sistem membaca data lama THEN sistem SHALL mengabaikan field `statusKeanggotaan` jika ada
3. WHEN sistem menampilkan master anggota THEN sistem SHALL tidak perlu memfilter berdasarkan `statusKeanggotaan`
4. WHEN sistem menampilkan laporan THEN sistem SHALL tidak perlu memfilter berdasarkan `statusKeanggotaan`
5. WHEN sistem melakukan migrasi data THEN data anggota dengan `statusKeanggotaan = 'Keluar'` SHALL dihapus

### Requirement 9

**User Story:** Sebagai admin koperasi, saya ingin menu "Anggota Keluar" tetap ada untuk melihat riwayat pengembalian, sehingga saya bisa melihat data historis anggota yang sudah keluar.

#### Acceptance Criteria

1. WHEN admin membuka menu "Anggota Keluar" THEN sistem SHALL menampilkan data dari tabel pengembalian
2. WHEN sistem menampilkan anggota keluar THEN data SHALL diambil dari tabel pengembalian, bukan dari tabel anggota
3. WHEN admin melihat detail anggota keluar THEN sistem SHALL menampilkan data dari record pengembalian
4. WHEN admin mencetak surat pengunduran diri THEN sistem SHALL menggunakan data dari record pengembalian
5. WHEN admin mencari anggota keluar THEN sistem SHALL mencari di tabel pengembalian

### Requirement 10

**User Story:** Sebagai developer, saya ingin migrasi data yang aman, sehingga data lama tidak rusak saat sistem diupdate.

#### Acceptance Criteria

1. WHEN sistem diupdate THEN sistem SHALL menjalankan script migrasi otomatis
2. WHEN migrasi berjalan THEN sistem SHALL membuat backup data sebelum migrasi
3. WHEN migrasi menemukan anggota dengan `statusKeanggotaan = 'Keluar'` THEN sistem SHALL menghapus data tersebut
4. WHEN migrasi gagal THEN sistem SHALL melakukan rollback ke backup
5. WHEN migrasi selesai THEN sistem SHALL mencatat hasil migrasi ke audit log
