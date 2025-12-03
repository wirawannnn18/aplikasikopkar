# Requirements Document

## Introduction

Fitur ini memungkinkan pengguna dengan level akses yang sesuai untuk menghapus data jurnal akuntansi (jurnal umum, jurnal kas, jurnal pembelian) dari sistem. Penghapusan data jurnal diperlukan untuk koreksi kesalahan input atau pembersihan data testing. Fitur ini harus memastikan integritas data akuntansi tetap terjaga dengan melakukan validasi dan pencatatan audit trail.

## Glossary

- **Sistem**: Aplikasi koperasi berbasis web yang mengelola data keuangan dan akuntansi
- **Jurnal Umum**: Catatan transaksi akuntansi yang tidak termasuk dalam jurnal khusus
- **Jurnal Kas**: Catatan transaksi penerimaan dan pengeluaran kas
- **Jurnal Pembelian**: Catatan transaksi pembelian barang atau jasa
- **Audit Trail**: Catatan riwayat perubahan data untuk keperluan audit
- **Super Admin**: Pengguna dengan level akses tertinggi yang dapat menghapus data jurnal
- **Periode Akuntansi**: Rentang waktu tertentu untuk pelaporan keuangan (biasanya bulanan)
- **Saldo**: Nilai akumulasi dari transaksi-transaksi yang tercatat

## Requirements

### Requirement 1

**User Story:** Sebagai super admin, saya ingin menghapus data jurnal umum, sehingga saya dapat mengoreksi kesalahan input atau membersihkan data testing.

#### Acceptance Criteria

1. WHEN super admin mengakses fitur hapus jurnal umum THEN the Sistem SHALL menampilkan daftar jurnal umum dengan informasi tanggal, nomor jurnal, keterangan, dan total debit/kredit
2. WHEN super admin memilih jurnal umum untuk dihapus THEN the Sistem SHALL menampilkan detail lengkap jurnal tersebut termasuk semua baris debit dan kredit
3. WHEN super admin mengkonfirmasi penghapusan jurnal umum THEN the Sistem SHALL menghapus jurnal tersebut dari database dan mencatat audit trail
4. WHEN jurnal umum berhasil dihapus THEN the Sistem SHALL menampilkan notifikasi sukses dan memperbarui daftar jurnal
5. WHERE jurnal umum memiliki referensi ke transaksi lain THEN the Sistem SHALL mencegah penghapusan dan menampilkan pesan peringatan

### Requirement 2

**User Story:** Sebagai super admin, saya ingin menghapus data jurnal kas, sehingga saya dapat mengoreksi kesalahan pencatatan kas atau membersihkan data testing.

#### Acceptance Criteria

1. WHEN super admin mengakses fitur hapus jurnal kas THEN the Sistem SHALL menampilkan daftar jurnal kas dengan informasi tanggal, tipe (masuk/keluar), keterangan, dan jumlah
2. WHEN super admin memilih jurnal kas untuk dihapus THEN the Sistem SHALL menampilkan detail lengkap jurnal kas tersebut
3. WHEN super admin mengkonfirmasi penghapusan jurnal kas THEN the Sistem SHALL menghapus jurnal tersebut dan menyesuaikan saldo kas
4. WHEN jurnal kas berhasil dihapus THEN the Sistem SHALL memperbarui saldo kas dan mencatat audit trail
5. IF penghapusan jurnal kas menyebabkan saldo kas menjadi negatif THEN the Sistem SHALL mencegah penghapusan dan menampilkan pesan peringatan

### Requirement 3

**User Story:** Sebagai super admin, saya ingin menghapus data jurnal pembelian, sehingga saya dapat mengoreksi kesalahan pencatatan pembelian atau membersihkan data testing.

#### Acceptance Criteria

1. WHEN super admin mengakses fitur hapus jurnal pembelian THEN the Sistem SHALL menampilkan daftar jurnal pembelian dengan informasi tanggal, nomor faktur, supplier, dan total pembelian
2. WHEN super admin memilih jurnal pembelian untuk dihapus THEN the Sistem SHALL menampilkan detail lengkap jurnal pembelian termasuk item-item yang dibeli
3. WHEN super admin mengkonfirmasi penghapusan jurnal pembelian THEN the Sistem SHALL menghapus jurnal tersebut dan menyesuaikan stok barang jika terkait
4. WHEN jurnal pembelian berhasil dihapus THEN the Sistem SHALL memperbarui data terkait dan mencatat audit trail
5. WHERE jurnal pembelian terkait dengan pembayaran yang sudah dilakukan THEN the Sistem SHALL mencegah penghapusan dan menampilkan pesan peringatan

### Requirement 4

**User Story:** Sebagai super admin, saya ingin sistem mencatat audit trail setiap penghapusan jurnal, sehingga ada jejak yang jelas untuk keperluan audit dan investigasi.

#### Acceptance Criteria

1. WHEN jurnal dihapus THEN the Sistem SHALL mencatat timestamp penghapusan dalam audit trail
2. WHEN jurnal dihapus THEN the Sistem SHALL mencatat user ID dan nama pengguna yang menghapus dalam audit trail
3. WHEN jurnal dihapus THEN the Sistem SHALL mencatat detail lengkap jurnal yang dihapus dalam audit trail
4. WHEN jurnal dihapus THEN the Sistem SHALL mencatat alasan penghapusan jika disediakan oleh pengguna dalam audit trail
5. WHEN super admin mengakses riwayat audit trail THEN the Sistem SHALL menampilkan semua penghapusan jurnal dengan informasi lengkap

### Requirement 5

**User Story:** Sebagai super admin, saya ingin validasi ketat sebelum penghapusan jurnal, sehingga integritas data akuntansi tetap terjaga.

#### Acceptance Criteria

1. WHEN super admin mencoba menghapus jurnal THEN the Sistem SHALL memvalidasi bahwa pengguna memiliki level akses super admin
2. WHEN jurnal akan dihapus THEN the Sistem SHALL memeriksa apakah jurnal memiliki referensi ke transaksi lain
3. WHEN jurnal akan dihapus THEN the Sistem SHALL memeriksa apakah periode akuntansi masih terbuka
4. IF periode akuntansi sudah ditutup THEN the Sistem SHALL mencegah penghapusan dan menampilkan pesan peringatan
5. WHEN validasi gagal THEN the Sistem SHALL menampilkan pesan error yang jelas dan spesifik

### Requirement 6

**User Story:** Sebagai super admin, saya ingin konfirmasi ganda sebelum menghapus jurnal, sehingga penghapusan tidak terjadi secara tidak sengaja.

#### Acceptance Criteria

1. WHEN super admin memilih jurnal untuk dihapus THEN the Sistem SHALL menampilkan dialog konfirmasi pertama dengan detail jurnal
2. WHEN super admin mengkonfirmasi dialog pertama THEN the Sistem SHALL menampilkan dialog konfirmasi kedua dengan peringatan dampak penghapusan
3. WHEN super admin mengkonfirmasi dialog kedua THEN the Sistem SHALL memproses penghapusan jurnal
4. WHEN super admin membatalkan konfirmasi THEN the Sistem SHALL membatalkan proses penghapusan dan kembali ke daftar jurnal
5. WHEN dialog konfirmasi ditampilkan THEN the Sistem SHALL menampilkan informasi dampak penghapusan terhadap saldo dan data terkait

### Requirement 7

**User Story:** Sebagai super admin, saya ingin filter dan pencarian jurnal yang akan dihapus, sehingga saya dapat menemukan jurnal yang tepat dengan mudah.

#### Acceptance Criteria

1. WHEN super admin mengakses daftar jurnal THEN the Sistem SHALL menyediakan filter berdasarkan tanggal
2. WHEN super admin mengakses daftar jurnal THEN the Sistem SHALL menyediakan filter berdasarkan tipe jurnal
3. WHEN super admin mengakses daftar jurnal THEN the Sistem SHALL menyediakan pencarian berdasarkan nomor jurnal atau keterangan
4. WHEN super admin menerapkan filter THEN the Sistem SHALL menampilkan hasil yang sesuai dengan kriteria filter
5. WHEN super admin menggunakan pencarian THEN the Sistem SHALL menampilkan hasil yang relevan dengan kata kunci pencarian

### Requirement 8

**User Story:** Sebagai super admin, saya ingin melihat dampak penghapusan jurnal sebelum menghapus, sehingga saya dapat memahami konsekuensi dari penghapusan tersebut.

#### Acceptance Criteria

1. WHEN super admin memilih jurnal untuk dihapus THEN the Sistem SHALL menampilkan saldo sebelum dan sesudah penghapusan
2. WHEN super admin memilih jurnal untuk dihapus THEN the Sistem SHALL menampilkan daftar akun yang terpengaruh
3. WHEN super admin memilih jurnal untuk dihapus THEN the Sistem SHALL menampilkan transaksi terkait yang mungkin terpengaruh
4. WHEN jurnal kas akan dihapus THEN the Sistem SHALL menampilkan perubahan saldo kas
5. WHEN jurnal pembelian akan dihapus THEN the Sistem SHALL menampilkan perubahan stok barang jika terkait

### Requirement 9

**User Story:** Sebagai sistem, saya ingin memastikan konsistensi data setelah penghapusan jurnal, sehingga tidak ada data yang rusak atau tidak konsisten.

#### Acceptance Criteria

1. WHEN jurnal dihapus THEN the Sistem SHALL memperbarui semua saldo akun yang terpengaruh secara atomik
2. WHEN jurnal kas dihapus THEN the Sistem SHALL memperbarui saldo kas secara konsisten
3. WHEN jurnal pembelian dihapus THEN the Sistem SHALL memperbarui stok barang jika terkait secara konsisten
4. IF terjadi error saat penghapusan THEN the Sistem SHALL melakukan rollback semua perubahan
5. WHEN penghapusan selesai THEN the Sistem SHALL memvalidasi konsistensi data akuntansi

### Requirement 10

**User Story:** Sebagai super admin, saya ingin notifikasi yang jelas setelah penghapusan jurnal, sehingga saya tahu status operasi yang dilakukan.

#### Acceptance Criteria

1. WHEN jurnal berhasil dihapus THEN the Sistem SHALL menampilkan notifikasi sukses dengan detail jurnal yang dihapus
2. WHEN penghapusan jurnal gagal THEN the Sistem SHALL menampilkan notifikasi error dengan penjelasan penyebab kegagalan
3. WHEN validasi gagal THEN the Sistem SHALL menampilkan notifikasi peringatan dengan informasi yang perlu diperbaiki
4. WHEN notifikasi ditampilkan THEN the Sistem SHALL menampilkan notifikasi selama durasi yang cukup untuk dibaca
5. WHEN notifikasi ditampilkan THEN the Sistem SHALL menyediakan opsi untuk menutup notifikasi secara manual
