# Requirements Document

## Introduction

Fitur ini memungkinkan pengguna untuk menghapus data simpanan pokok secara individual atau massal dari menu Simpanan Pokok dalam aplikasi koperasi. Fitur ini penting untuk manajemen data, koreksi kesalahan input, dan pemeliharaan database yang bersih. Penghapusan data harus dilakukan dengan aman, dengan konfirmasi yang jelas, dan harus mempertimbangkan integritas data terkait jurnal akuntansi.

## Glossary

- **Simpanan Pokok**: Setoran awal yang wajib dibayarkan oleh anggota koperasi saat pertama kali mendaftar, bersifat satu kali dan tidak dapat ditarik selama masih menjadi anggota
- **Sistem**: Aplikasi manajemen koperasi berbasis web yang menyimpan data di localStorage browser
- **Anggota**: Individu yang terdaftar sebagai anggota koperasi dengan NIK dan data pribadi
- **LocalStorage**: Mekanisme penyimpanan data di browser untuk menyimpan data simpanan pokok
- **Jurnal**: Catatan akuntansi yang mencatat transaksi keuangan dalam sistem double-entry bookkeeping
- **NIK**: Nomor Induk Kependudukan, identitas unik untuk setiap anggota

## Requirements

### Requirement 1

**User Story:** Sebagai admin koperasi, saya ingin menghapus data simpanan pokok individual, sehingga saya dapat mengoreksi kesalahan input atau menghapus data yang tidak valid.

#### Acceptance Criteria

1. WHEN admin mengklik tombol hapus pada baris data simpanan pokok THEN Sistem SHALL menampilkan dialog konfirmasi penghapusan
2. WHEN admin mengkonfirmasi penghapusan THEN Sistem SHALL menghapus data simpanan pokok dari localStorage dengan key 'simpananPokok'
3. WHEN data simpanan pokok berhasil dihapus THEN Sistem SHALL memperbarui tampilan tabel simpanan pokok tanpa data yang dihapus
4. WHEN data simpanan pokok berhasil dihapus THEN Sistem SHALL menampilkan notifikasi sukses kepada admin
5. WHEN admin membatalkan konfirmasi penghapusan THEN Sistem SHALL membatalkan operasi penghapusan dan mempertahankan data yang ada

### Requirement 2

**User Story:** Sebagai admin koperasi, saya ingin menghapus semua data simpanan pokok sekaligus, sehingga saya dapat mereset data atau membersihkan data testing.

#### Acceptance Criteria

1. WHEN admin mengakses fitur hapus semua data simpanan pokok THEN Sistem SHALL menampilkan jumlah total data simpanan pokok yang akan dihapus
2. WHEN admin meminta penghapusan semua data THEN Sistem SHALL menampilkan konfirmasi pertama dengan peringatan bahwa data tidak dapat dikembalikan
3. WHEN admin mengkonfirmasi penghapusan pertama THEN Sistem SHALL menampilkan konfirmasi kedua untuk keamanan tambahan
4. WHEN admin mengkonfirmasi penghapusan kedua THEN Sistem SHALL menghapus semua data dari localStorage dengan key 'simpananPokok'
5. WHEN semua data berhasil dihapus THEN Sistem SHALL menampilkan pesan sukses dan memperbarui tampilan dengan data kosong

### Requirement 3

**User Story:** Sebagai admin koperasi, saya ingin sistem memberikan peringatan yang jelas sebelum penghapusan data, sehingga saya tidak menghapus data secara tidak sengaja.

#### Acceptance Criteria

1. WHEN dialog konfirmasi ditampilkan THEN Sistem SHALL menampilkan pesan yang jelas tentang konsekuensi penghapusan
2. WHEN konfirmasi penghapusan massal ditampilkan THEN Sistem SHALL menampilkan jumlah data yang akan dihapus
3. WHEN konfirmasi ditampilkan THEN Sistem SHALL menyediakan opsi untuk membatalkan operasi penghapusan
4. WHEN penghapusan massal diminta THEN Sistem SHALL meminta dua kali konfirmasi untuk mencegah penghapusan tidak disengaja
5. WHEN tidak ada data untuk dihapus THEN Sistem SHALL menonaktifkan tombol hapus dan menampilkan pesan informasi

### Requirement 4

**User Story:** Sebagai admin koperasi, saya ingin data yang dihapus benar-benar terhapus dari sistem, sehingga tidak ada data duplikat atau data yang tidak valid tersisa.

#### Acceptance Criteria

1. WHEN data simpanan pokok dihapus THEN Sistem SHALL menghapus data dari array simpananPokok di localStorage
2. WHEN data dihapus THEN Sistem SHALL memperbarui localStorage dengan array yang telah difilter
3. WHEN halaman di-refresh setelah penghapusan THEN Sistem SHALL menampilkan data tanpa item yang telah dihapus
4. WHEN semua data dihapus THEN Sistem SHALL menyimpan array kosong ke localStorage
5. WHEN data dihapus THEN Sistem SHALL mempertahankan data anggota dan jenis simpanan lainnya tetap utuh

### Requirement 5

**User Story:** Sebagai admin koperasi, saya ingin dapat mengakses fitur hapus massal melalui halaman utility terpisah, sehingga fitur berbahaya ini tidak mudah diakses secara tidak sengaja dari menu utama.

#### Acceptance Criteria

1. WHEN admin membuka halaman hapus_simpanan_pokok.html THEN Sistem SHALL menampilkan jumlah data simpanan pokok saat ini
2. WHEN halaman utility dibuka THEN Sistem SHALL menampilkan tombol untuk menghapus semua data simpanan pokok
3. WHEN halaman utility dibuka THEN Sistem SHALL menampilkan tombol untuk refresh jumlah data
4. WHEN halaman utility dibuka THEN Sistem SHALL menampilkan link untuk kembali ke aplikasi utama
5. WHEN tidak ada data simpanan pokok THEN Sistem SHALL menonaktifkan tombol hapus dan menampilkan pesan informasi

### Requirement 6

**User Story:** Sebagai admin koperasi, saya ingin sistem menampilkan informasi yang akurat tentang data yang akan dihapus, sehingga saya dapat membuat keputusan yang tepat.

#### Acceptance Criteria

1. WHEN halaman utility dibuka THEN Sistem SHALL menghitung dan menampilkan jumlah data simpanan pokok dari localStorage
2. WHEN tombol refresh diklik THEN Sistem SHALL memperbarui jumlah data yang ditampilkan
3. WHEN data berhasil dihapus THEN Sistem SHALL memperbarui jumlah data menjadi nol
4. WHEN jumlah data adalah nol THEN Sistem SHALL menampilkan pesan bahwa tidak ada data untuk dihapus
5. WHEN terjadi error saat menghitung data THEN Sistem SHALL menampilkan pesan error yang informatif

### Requirement 7

**User Story:** Sebagai admin koperasi, saya ingin antarmuka penghapusan data yang user-friendly, sehingga saya dapat dengan mudah memahami dan menggunakan fitur ini.

#### Acceptance Criteria

1. WHEN halaman utility ditampilkan THEN Sistem SHALL menggunakan warna dan ikon yang menunjukkan tingkat bahaya operasi
2. WHEN tombol hapus ditampilkan THEN Sistem SHALL menggunakan warna merah untuk menunjukkan operasi berbahaya
3. WHEN pesan sukses ditampilkan THEN Sistem SHALL menggunakan warna hijau dan ikon centang
4. WHEN peringatan ditampilkan THEN Sistem SHALL menggunakan warna kuning dan ikon peringatan
5. WHEN halaman utility ditampilkan THEN Sistem SHALL menampilkan informasi tambahan tentang dampak penghapusan
