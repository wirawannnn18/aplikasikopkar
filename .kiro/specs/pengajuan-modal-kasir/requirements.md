# Requirements Document

## Introduction

Fitur pengajuan modal kasir memungkinkan kasir untuk mengajukan permintaan modal awal kepada admin koperasi sebelum membuka shift kasir. Fitur ini memastikan bahwa kasir memiliki modal yang cukup untuk melakukan transaksi dan keuangan dapat berjalan dengan baik. Admin koperasi dapat menyetujui atau menolak pengajuan modal, dan sistem akan mencatat seluruh proses pengajuan untuk keperluan audit.

## Glossary

- **Kasir**: Pengguna dengan role 'kasir' yang bertugas melayani transaksi POS
- **Admin Koperasi**: Pengguna dengan role 'admin' yang memiliki wewenang menyetujui pengajuan modal
- **Modal Awal**: Uang tunai yang diberikan kepada kasir untuk memulai shift kasir
- **Pengajuan Modal**: Permintaan formal dari kasir kepada admin untuk mendapatkan modal awal
- **Shift Kasir**: Periode kerja kasir yang dimulai dengan buka kasir dan diakhiri dengan tutup kasir
- **Sistem**: Aplikasi koperasi yang mengelola transaksi dan keuangan

## Requirements

### Requirement 1

**User Story:** Sebagai kasir, saya ingin mengajukan permintaan modal awal kepada admin koperasi, sehingga saya memiliki modal yang cukup untuk memulai shift kasir.

#### Acceptance Criteria

1. WHEN kasir membuka halaman buka kasir THEN Sistem SHALL menampilkan form pengajuan modal dengan field jumlah modal yang diminta dan keterangan
2. WHEN kasir mengisi jumlah modal yang diminta THEN Sistem SHALL memvalidasi bahwa jumlah modal adalah angka positif lebih besar dari nol
3. WHEN kasir mengirim pengajuan modal THEN Sistem SHALL menyimpan data pengajuan dengan status "pending" dan timestamp pengajuan
4. WHEN pengajuan modal berhasil dikirim THEN Sistem SHALL menampilkan notifikasi konfirmasi kepada kasir dan menonaktifkan tombol buka kasir hingga pengajuan disetujui
5. WHEN kasir memiliki pengajuan modal yang masih pending THEN Sistem SHALL menampilkan status pengajuan dan mencegah pengajuan baru

### Requirement 2

**User Story:** Sebagai admin koperasi, saya ingin melihat dan mengelola pengajuan modal dari kasir, sehingga saya dapat mengontrol distribusi modal dengan baik.

#### Acceptance Criteria

1. WHEN admin membuka halaman kelola pengajuan modal THEN Sistem SHALL menampilkan daftar semua pengajuan modal dengan informasi kasir, jumlah, tanggal, dan status
2. WHEN admin memilih pengajuan modal dengan status pending THEN Sistem SHALL menampilkan detail lengkap pengajuan dan opsi untuk menyetujui atau menolak
3. WHEN admin menyetujui pengajuan modal THEN Sistem SHALL mengubah status pengajuan menjadi "approved", mencatat timestamp persetujuan, dan mencatat admin yang menyetujui
4. WHEN admin menolak pengajuan modal THEN Sistem SHALL mengubah status pengajuan menjadi "rejected", mewajibkan admin mengisi alasan penolakan, dan mencatat timestamp penolakan
5. WHEN admin memfilter pengajuan modal THEN Sistem SHALL menampilkan pengajuan berdasarkan status, tanggal, atau nama kasir yang dipilih

### Requirement 3

**User Story:** Sebagai kasir, saya ingin mendapat notifikasi tentang status pengajuan modal saya, sehingga saya tahu kapan bisa membuka shift kasir.

#### Acceptance Criteria

1. WHEN pengajuan modal kasir disetujui oleh admin THEN Sistem SHALL menampilkan notifikasi persetujuan kepada kasir dengan jumlah modal yang disetujui
2. WHEN pengajuan modal kasir ditolak oleh admin THEN Sistem SHALL menampilkan notifikasi penolakan kepada kasir dengan alasan penolakan
3. WHEN kasir membuka halaman buka kasir dan pengajuan telah disetujui THEN Sistem SHALL mengaktifkan tombol buka kasir dan mengisi otomatis field modal awal dengan jumlah yang disetujui
4. WHEN kasir membuka halaman buka kasir dan pengajuan ditolak THEN Sistem SHALL memungkinkan kasir untuk membuat pengajuan baru
5. WHEN kasir membuka shift kasir setelah pengajuan disetujui THEN Sistem SHALL mencatat penggunaan modal yang disetujui dan mengubah status pengajuan menjadi "used"

### Requirement 4

**User Story:** Sebagai admin koperasi, saya ingin melihat riwayat pengajuan modal, sehingga saya dapat melakukan audit dan analisis distribusi modal.

#### Acceptance Criteria

1. WHEN admin membuka halaman riwayat pengajuan modal THEN Sistem SHALL menampilkan semua pengajuan modal dengan status approved, rejected, dan used
2. WHEN admin memilih periode tanggal THEN Sistem SHALL menampilkan pengajuan modal dalam rentang tanggal yang dipilih
3. WHEN admin melihat detail riwayat pengajuan THEN Sistem SHALL menampilkan informasi lengkap termasuk kasir, jumlah, tanggal pengajuan, admin yang memproses, dan status akhir
4. WHEN admin mengekspor riwayat pengajuan THEN Sistem SHALL menghasilkan file CSV dengan semua data pengajuan dalam periode yang dipilih
5. WHEN Sistem mencatat riwayat pengajuan THEN Sistem SHALL menyimpan audit trail yang tidak dapat diubah atau dihapus

### Requirement 5

**User Story:** Sebagai sistem, saya ingin memvalidasi dan mengamankan proses pengajuan modal, sehingga tidak terjadi penyalahgunaan atau kesalahan data.

#### Acceptance Criteria

1. WHEN kasir mencoba mengajukan modal THEN Sistem SHALL memvalidasi bahwa kasir tidak memiliki shift kasir yang masih aktif
2. WHEN kasir mencoba mengajukan modal dengan jumlah melebihi batas maksimum THEN Sistem SHALL menolak pengajuan dan menampilkan pesan error dengan batas maksimum yang diizinkan
3. WHEN admin mencoba menyetujui pengajuan modal THEN Sistem SHALL memvalidasi bahwa admin memiliki role yang sesuai dan pengajuan masih berstatus pending
4. WHEN pengajuan modal diproses THEN Sistem SHALL mencatat semua perubahan status dengan timestamp dan user yang melakukan perubahan
5. WHEN terjadi error dalam proses pengajuan THEN Sistem SHALL melakukan rollback transaksi dan menampilkan pesan error yang jelas kepada user

### Requirement 6

**User Story:** Sebagai kasir, saya ingin melihat riwayat pengajuan modal saya sendiri, sehingga saya dapat melacak pengajuan yang pernah saya buat.

#### Acceptance Criteria

1. WHEN kasir membuka halaman riwayat pengajuan saya THEN Sistem SHALL menampilkan semua pengajuan modal yang dibuat oleh kasir tersebut
2. WHEN kasir melihat riwayat pengajuan THEN Sistem SHALL menampilkan informasi jumlah, tanggal pengajuan, status, dan keterangan untuk setiap pengajuan
3. WHEN kasir memfilter riwayat berdasarkan status THEN Sistem SHALL menampilkan pengajuan dengan status yang dipilih
4. WHEN kasir melihat detail pengajuan yang ditolak THEN Sistem SHALL menampilkan alasan penolakan dari admin
5. WHEN kasir melihat detail pengajuan yang digunakan THEN Sistem SHALL menampilkan informasi shift kasir terkait dengan pengajuan tersebut
