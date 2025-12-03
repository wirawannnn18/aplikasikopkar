# Requirements Document

## Introduction

Fitur ini memungkinkan pengguna untuk menghapus data transaksi penjualan POS yang telah tercatat dalam sistem. Fitur ini diperlukan untuk menangani kasus kesalahan input, transaksi yang dibatalkan, atau kebutuhan koreksi data. Penghapusan transaksi harus mempertimbangkan dampaknya terhadap stok barang, jurnal akuntansi, dan integritas data sistem secara keseluruhan.

## Glossary

- **Sistem**: Aplikasi Koperasi Karyawan yang mengelola transaksi POS
- **Pengguna**: User yang memiliki hak akses untuk menghapus transaksi (admin/kasir)
- **Transaksi POS**: Record penjualan yang tersimpan di localStorage dengan key 'penjualan'
- **Transaksi Cash**: Transaksi dengan metode pembayaran tunai (cash)
- **Transaksi Kredit**: Transaksi dengan metode pembayaran bon/kredit
- **Stok Barang**: Jumlah persediaan barang yang tersimpan di localStorage dengan key 'barang'
- **Jurnal Akuntansi**: Catatan pembukuan double-entry yang tersimpan di localStorage dengan key 'jurnal'
- **HPP**: Harga Pokok Penjualan, biaya perolehan barang yang dijual

## Requirements

### Requirement 1

**User Story:** Sebagai admin atau kasir, saya ingin melihat daftar transaksi POS yang dapat dihapus, sehingga saya dapat memilih transaksi yang perlu dikoreksi atau dibatalkan.

#### Acceptance Criteria

1. WHEN pengguna mengakses halaman hapus transaksi THEN Sistem SHALL menampilkan daftar semua transaksi penjualan dengan informasi nomor transaksi, tanggal, kasir, total, metode pembayaran, dan status
2. WHEN daftar transaksi ditampilkan THEN Sistem SHALL menyediakan fitur pencarian berdasarkan nomor transaksi atau nama kasir
3. WHEN daftar transaksi ditampilkan THEN Sistem SHALL menyediakan fitur filter berdasarkan metode pembayaran (cash atau kredit)
4. WHEN daftar transaksi ditampilkan THEN Sistem SHALL menyediakan fitur filter berdasarkan rentang tanggal
5. WHEN daftar transaksi kosong THEN Sistem SHALL menampilkan pesan bahwa tidak ada transaksi yang tersedia

### Requirement 2

**User Story:** Sebagai admin atau kasir, saya ingin menghapus transaksi POS yang salah, sehingga data penjualan menjadi akurat dan tidak menyesatkan.

#### Acceptance Criteria

1. WHEN pengguna memilih transaksi untuk dihapus THEN Sistem SHALL menampilkan dialog konfirmasi dengan detail lengkap transaksi tersebut
2. WHEN pengguna mengkonfirmasi penghapusan THEN Sistem SHALL menghapus record transaksi dari localStorage
3. WHEN transaksi berhasil dihapus THEN Sistem SHALL menampilkan notifikasi sukses kepada pengguna
4. WHEN pengguna membatalkan penghapusan THEN Sistem SHALL menutup dialog konfirmasi tanpa mengubah data
5. WHEN terjadi error saat penghapusan THEN Sistem SHALL menampilkan pesan error yang jelas kepada pengguna

### Requirement 3

**User Story:** Sebagai admin, saya ingin stok barang dikembalikan saat transaksi dihapus, sehingga jumlah persediaan tetap akurat.

#### Acceptance Criteria

1. WHEN transaksi dihapus THEN Sistem SHALL mengembalikan stok barang untuk setiap item dalam transaksi tersebut
2. WHEN stok barang dikembalikan THEN Sistem SHALL menambahkan quantity yang terjual kembali ke stok barang yang sesuai
3. WHEN barang dalam transaksi tidak ditemukan di master barang THEN Sistem SHALL mencatat warning namun tetap melanjutkan proses penghapusan
4. WHEN stok barang berhasil dikembalikan THEN Sistem SHALL menyimpan perubahan stok ke localStorage

### Requirement 4

**User Story:** Sebagai admin, saya ingin jurnal akuntansi dibalik (reversal) saat transaksi dihapus, sehingga laporan keuangan tetap akurat dan seimbang.

#### Acceptance Criteria

1. WHEN transaksi cash dihapus THEN Sistem SHALL membuat jurnal pembalik untuk mengurangi kas dan mengurangi pendapatan penjualan
2. WHEN transaksi kredit dihapus THEN Sistem SHALL membuat jurnal pembalik untuk mengurangi piutang dan mengurangi pendapatan penjualan
3. WHEN transaksi dihapus THEN Sistem SHALL membuat jurnal pembalik untuk mengurangi beban HPP dan menambah persediaan barang
4. WHEN jurnal pembalik dibuat THEN Sistem SHALL menyimpan jurnal dengan deskripsi yang jelas mencantumkan nomor transaksi yang dihapus
5. WHEN jurnal pembalik dibuat THEN Sistem SHALL menggunakan tanggal penghapusan sebagai tanggal jurnal

### Requirement 5

**User Story:** Sebagai admin, saya ingin melihat log atau riwayat penghapusan transaksi, sehingga saya dapat melacak siapa yang menghapus transaksi dan kapan.

#### Acceptance Criteria

1. WHEN transaksi dihapus THEN Sistem SHALL mencatat log penghapusan dengan informasi transaksi yang dihapus, user yang menghapus, dan waktu penghapusan
2. WHEN log penghapusan dicatat THEN Sistem SHALL menyimpan data transaksi lengkap sebelum dihapus untuk keperluan audit
3. WHEN pengguna mengakses halaman riwayat penghapusan THEN Sistem SHALL menampilkan daftar semua transaksi yang pernah dihapus
4. WHEN riwayat penghapusan ditampilkan THEN Sistem SHALL menampilkan informasi nomor transaksi, tanggal transaksi, tanggal penghapusan, user yang menghapus, dan alasan penghapusan
5. WHEN pengguna melihat detail riwayat penghapusan THEN Sistem SHALL menampilkan data lengkap transaksi yang telah dihapus

### Requirement 6

**User Story:** Sebagai admin, saya ingin memberikan alasan saat menghapus transaksi, sehingga ada dokumentasi yang jelas untuk keperluan audit.

#### Acceptance Criteria

1. WHEN pengguna mengkonfirmasi penghapusan transaksi THEN Sistem SHALL meminta pengguna memasukkan alasan penghapusan
2. WHEN alasan penghapusan kosong THEN Sistem SHALL menampilkan peringatan dan tidak melanjutkan proses penghapusan
3. WHEN alasan penghapusan diisi THEN Sistem SHALL menyimpan alasan tersebut bersama dengan log penghapusan
4. WHEN alasan penghapusan memiliki panjang lebih dari 500 karakter THEN Sistem SHALL menampilkan peringatan batas maksimal karakter

### Requirement 7

**User Story:** Sebagai admin, saya ingin sistem mencegah penghapusan transaksi yang sudah masuk dalam laporan tutup kasir, sehingga integritas laporan keuangan terjaga.

#### Acceptance Criteria

1. WHEN pengguna mencoba menghapus transaksi THEN Sistem SHALL memeriksa apakah transaksi tersebut sudah masuk dalam laporan tutup kasir
2. WHEN transaksi sudah masuk dalam laporan tutup kasir yang sudah ditutup THEN Sistem SHALL menampilkan pesan error dan mencegah penghapusan
3. WHEN transaksi belum masuk dalam laporan tutup kasir THEN Sistem SHALL mengizinkan proses penghapusan dilanjutkan
4. WHEN shift kasir masih buka (belum tutup kasir) THEN Sistem SHALL mengizinkan penghapusan transaksi dalam shift tersebut
