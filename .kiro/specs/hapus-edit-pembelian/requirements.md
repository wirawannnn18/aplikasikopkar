# Requirements Document

## Introduction

Fitur ini memungkinkan pengguna untuk mengelola daftar pembelian barang yang sudah tercatat dalam sistem. Saat ini sistem hanya mendukung penambahan dan melihat detail pembelian, namun tidak ada kemampuan untuk mengedit atau menghapus transaksi pembelian yang sudah tersimpan. Fitur ini akan menambahkan fungsi edit dan hapus untuk memberikan fleksibilitas dalam mengelola data pembelian, termasuk pembaruan stok barang dan jurnal akuntansi yang terkait.

## Glossary

- **Sistem**: Aplikasi koperasi karyawan berbasis web
- **Pengguna**: Operator atau admin yang mengelola data pembelian barang
- **Transaksi Pembelian**: Record pembelian barang yang mencakup nomor faktur, tanggal, supplier, daftar item, dan total harga
- **Item Pembelian**: Barang individual dalam transaksi pembelian dengan qty, harga, dan subtotal
- **Stok Barang**: Jumlah persediaan barang yang tersimpan dalam sistem
- **HPP**: Harga Pokok Penjualan, nilai rata-rata harga beli barang
- **Jurnal Akuntansi**: Catatan debit-kredit untuk transaksi keuangan
- **LocalStorage**: Penyimpanan data di browser untuk menyimpan data aplikasi

## Requirements

### Requirement 1

**User Story:** Sebagai pengguna, saya ingin dapat mengedit transaksi pembelian yang sudah tersimpan, sehingga saya dapat memperbaiki kesalahan input data tanpa harus menghapus dan membuat ulang transaksi.

#### Acceptance Criteria

1. WHEN pengguna mengklik tombol edit pada daftar pembelian THEN Sistem SHALL menampilkan modal form pembelian dengan data transaksi yang dipilih
2. WHEN modal edit pembelian ditampilkan THEN Sistem SHALL mengisi semua field form dengan data transaksi existing termasuk nomor faktur, tanggal, supplier, dan daftar item pembelian
3. WHEN pengguna mengubah data dan menyimpan THEN Sistem SHALL memvalidasi bahwa minimal terdapat 1 item pembelian dalam daftar
4. WHEN pengguna menyimpan perubahan transaksi pembelian THEN Sistem SHALL menghitung ulang stok barang berdasarkan selisih qty lama dan baru untuk setiap item
5. WHEN pengguna menyimpan perubahan transaksi pembelian THEN Sistem SHALL memperbarui HPP barang berdasarkan perhitungan rata-rata tertimbang dengan nilai pembelian yang baru

### Requirement 2

**User Story:** Sebagai pengguna, saya ingin dapat menghapus transaksi pembelian yang salah atau tidak valid, sehingga data pembelian tetap akurat dan tidak mengandung kesalahan.

#### Acceptance Criteria

1. WHEN pengguna mengklik tombol hapus pada daftar pembelian THEN Sistem SHALL menampilkan dialog konfirmasi penghapusan
2. WHEN pengguna mengkonfirmasi penghapusan THEN Sistem SHALL mengurangi stok barang sesuai dengan qty yang tercatat dalam transaksi pembelian yang dihapus
3. WHEN pengguna mengkonfirmasi penghapusan THEN Sistem SHALL menghapus transaksi pembelian dari LocalStorage
4. WHEN transaksi pembelian berhasil dihapus THEN Sistem SHALL menampilkan notifikasi sukses dan memperbarui tampilan daftar pembelian
5. WHEN pengguna membatalkan dialog konfirmasi THEN Sistem SHALL menutup dialog tanpa melakukan perubahan apapun

### Requirement 3

**User Story:** Sebagai pengguna, saya ingin sistem secara otomatis menyesuaikan jurnal akuntansi ketika transaksi pembelian diedit atau dihapus, sehingga catatan keuangan tetap akurat dan sesuai dengan data pembelian aktual.

#### Acceptance Criteria

1. WHEN pengguna mengedit transaksi pembelian THEN Sistem SHALL membuat jurnal koreksi untuk menyesuaikan selisih nilai pembelian lama dan baru
2. WHEN pengguna menghapus transaksi pembelian THEN Sistem SHALL membuat jurnal pembalik untuk membatalkan jurnal pembelian yang sudah tercatat
3. WHEN jurnal koreksi atau pembalik dibuat THEN Sistem SHALL menggunakan akun Persediaan Barang (1-1300) dan Kas (1-1000) dengan nilai yang sesuai
4. WHEN transaksi pembelian diubah atau dihapus THEN Sistem SHALL memastikan total debit dan kredit dalam jurnal tetap balance

### Requirement 4

**User Story:** Sebagai pengguna, saya ingin dapat menambah atau mengurangi item dalam transaksi pembelian saat mengedit, sehingga saya dapat menyesuaikan daftar barang yang dibeli tanpa membuat transaksi baru.

#### Acceptance Criteria

1. WHEN modal edit pembelian ditampilkan THEN Sistem SHALL menampilkan daftar item pembelian existing dengan tombol hapus untuk setiap item
2. WHEN pengguna menghapus item dari daftar THEN Sistem SHALL menghapus item tersebut dari array items dan memperbarui total pembelian
3. WHEN pengguna menambah item baru dalam edit mode THEN Sistem SHALL menambahkan item ke daftar existing dan memperbarui total pembelian
4. WHEN pengguna mengubah qty atau harga item existing THEN Sistem SHALL memperbarui subtotal item dan total pembelian secara otomatis
5. WHEN pengguna menyimpan perubahan THEN Sistem SHALL memproses perubahan stok untuk semua item yang ditambah, diubah, atau dihapus

### Requirement 5

**User Story:** Sebagai pengguna, saya ingin mendapat feedback yang jelas saat melakukan operasi edit atau hapus, sehingga saya tahu apakah operasi berhasil atau gagal dan dapat mengambil tindakan yang sesuai.

#### Acceptance Criteria

1. WHEN operasi edit atau hapus berhasil THEN Sistem SHALL menampilkan notifikasi sukses dengan pesan yang deskriptif
2. WHEN terjadi error dalam proses edit atau hapus THEN Sistem SHALL menampilkan notifikasi error dengan informasi masalah yang terjadi
3. WHEN pengguna mencoba menyimpan edit dengan daftar item kosong THEN Sistem SHALL menampilkan peringatan dan mencegah penyimpanan
4. WHEN operasi selesai THEN Sistem SHALL menutup modal dan memperbarui tampilan daftar pembelian dengan data terbaru
5. WHEN pengguna membatalkan operasi edit THEN Sistem SHALL menutup modal tanpa menyimpan perubahan dan data tetap seperti semula
