# Requirements Document

## Introduction

Fitur ini menambahkan kemampuan untuk memilih barang menggunakan barcode scanner pada form input pembelian. Saat ini, pengguna hanya dapat memilih barang melalui dropdown manual. Dengan fitur ini, pengguna dapat menggunakan barcode scanner untuk mempercepat proses input pembelian, terutama ketika ada banyak item yang perlu diinput.

## Glossary

- **Barcode Scanner**: Perangkat input yang membaca barcode dan mengirimkan data sebagai keyboard input
- **Input Pembelian**: Form untuk mencatat transaksi pembelian barang dari supplier
- **Barang**: Item/produk yang dijual dalam sistem dengan atribut barcode unik
- **Item Pembelian**: Baris detail barang dalam satu transaksi pembelian
- **System**: Aplikasi koperasi berbasis web yang sedang dikembangkan

## Requirements

### Requirement 1

**User Story:** Sebagai kasir/admin, saya ingin dapat menginput barang pembelian menggunakan barcode scanner, sehingga proses input pembelian menjadi lebih cepat dan akurat.

#### Acceptance Criteria

1. WHEN kasir membuka form input pembelian THEN the System SHALL menyediakan input field khusus untuk barcode scanner
2. WHEN barcode scanner membaca barcode barang THEN the System SHALL mencari barang berdasarkan barcode tersebut
3. WHEN barang ditemukan berdasarkan barcode THEN the System SHALL mengisi otomatis field barang, harga beli (HPP), dan fokus ke field qty
4. WHEN barang tidak ditemukan berdasarkan barcode THEN the System SHALL menampilkan notifikasi error dan mengosongkan input barcode
5. WHEN kasir menekan Enter pada field qty setelah barcode terdeteksi THEN the System SHALL menambahkan item ke daftar pembelian dan kembali fokus ke input barcode

### Requirement 2

**User Story:** Sebagai kasir, saya ingin sistem dapat membedakan input dari barcode scanner dan input manual, sehingga kedua metode dapat digunakan secara bergantian.

#### Acceptance Criteria

1. WHEN kasir menggunakan dropdown pilih barang THEN the System SHALL tetap berfungsi seperti sebelumnya tanpa terpengaruh input barcode
2. WHEN kasir mengetik manual di input barcode THEN the System SHALL mencari barang setelah kasir menekan Enter
3. WHEN input barcode kosong dan kasir menekan Enter THEN the System SHALL tidak melakukan pencarian dan tetap fokus di input barcode
4. WHEN kasir berganti antara input barcode dan dropdown THEN the System SHALL menjaga konsistensi data tanpa konflik

### Requirement 3

**User Story:** Sebagai kasir, saya ingin input barcode dapat menangani barcode duplikat, sehingga qty barang yang sama akan bertambah otomatis.

#### Acceptance Criteria

1. WHEN barcode yang sama di-scan dua kali dengan qty yang sama THEN the System SHALL menambahkan qty pada item yang sudah ada di daftar
2. WHEN item dengan barcode yang sama sudah ada di daftar pembelian THEN the System SHALL mengupdate qty item tersebut bukan membuat item baru
3. WHEN qty item diupdate karena barcode duplikat THEN the System SHALL menghitung ulang subtotal item tersebut
4. WHEN qty item diupdate THEN the System SHALL menampilkan notifikasi bahwa qty item telah ditambahkan

### Requirement 4

**User Story:** Sebagai kasir, saya ingin interface input barcode yang intuitif dan mudah digunakan, sehingga proses input pembelian menjadi efisien.

#### Acceptance Criteria

1. WHEN form pembelian dibuka THEN the System SHALL menempatkan fokus otomatis pada input barcode
2. WHEN item berhasil ditambahkan THEN the System SHALL mengosongkan input barcode dan qty, lalu fokus kembali ke input barcode
3. WHEN terjadi error pencarian barcode THEN the System SHALL menampilkan pesan error yang jelas dan tetap fokus di input barcode
4. WHEN kasir menggunakan keyboard THEN the System SHALL mendukung navigasi dengan Tab dan Enter untuk perpindahan antar field
5. WHEN input barcode aktif THEN the System SHALL menampilkan indikator visual bahwa field siap menerima input scanner

### Requirement 5

**User Story:** Sebagai admin, saya ingin sistem dapat menangani berbagai format barcode, sehingga kompatibel dengan berbagai jenis barcode scanner.

#### Acceptance Criteria

1. WHEN barcode scanner mengirim data dengan format apapun THEN the System SHALL membersihkan whitespace dan karakter khusus sebelum pencarian
2. WHEN barcode mengandung leading zeros THEN the System SHALL mempertahankan leading zeros dalam pencarian
3. WHEN barcode scanner mengirim Enter otomatis setelah scan THEN the System SHALL mendeteksi dan memproses barcode tersebut
4. WHEN barcode tidak valid atau kosong THEN the System SHALL menolak input dan menampilkan pesan error yang sesuai
