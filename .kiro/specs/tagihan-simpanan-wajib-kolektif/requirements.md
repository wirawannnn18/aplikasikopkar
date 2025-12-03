# Requirements Document

## Introduction

Sistem tagihan dan pembayaran simpanan wajib kolektif adalah fitur untuk mengotomatisasi pembuatan tagihan simpanan wajib setiap tanggal 20 dan memfasilitasi pembayaran secara kolektif untuk banyak anggota sekaligus. Fitur ini juga memastikan anggota baru wajib membayar simpanan pokok sebesar 250 ribu saat pertama kali mendaftar.

## Glossary

- **Sistem Simpanan**: Aplikasi koperasi yang mengelola data simpanan anggota
- **Anggota**: Pengguna yang terdaftar dalam koperasi
- **Simpanan Pokok**: Simpanan wajib yang dibayarkan sekali saat anggota pertama kali mendaftar, dengan nominal 250 ribu rupiah
- **Simpanan Wajib**: Simpanan yang harus dibayarkan secara rutin setiap bulan oleh anggota
- **Tagihan Simpanan Wajib**: Catatan kewajiban pembayaran simpanan wajib yang dibuat sistem untuk setiap anggota
- **Pembayaran Kolektif**: Proses pembayaran simpanan wajib untuk banyak anggota sekaligus dalam satu transaksi
- **Tanggal Jatuh Tempo**: Tanggal 20 setiap bulan ketika tagihan simpanan wajib dibuat
- **Admin**: Pengguna dengan hak akses untuk mengelola tagihan dan pembayaran simpanan

## Requirements

### Requirement 1

**User Story:** Sebagai admin koperasi, saya ingin sistem otomatis membuat tagihan simpanan wajib setiap tanggal 20, sehingga saya tidak perlu membuat tagihan manual untuk setiap anggota.

#### Acceptance Criteria

1. WHEN tanggal sistem mencapai tanggal 20 setiap bulan THEN Sistem Simpanan SHALL membuat tagihan simpanan wajib baru untuk semua anggota aktif
2. WHEN tagihan simpanan wajib dibuat THEN Sistem Simpanan SHALL mencatat periode tagihan dengan format bulan dan tahun
3. WHEN tagihan simpanan wajib dibuat THEN Sistem Simpanan SHALL menyimpan status tagihan sebagai "belum dibayar"
4. WHEN tagihan simpanan wajib dibuat THEN Sistem Simpanan SHALL mencatat nominal tagihan sesuai dengan pengaturan simpanan wajib untuk setiap anggota
5. WHEN sistem membuat tagihan untuk anggota yang sudah memiliki tagihan periode yang sama THEN Sistem Simpanan SHALL melewati anggota tersebut dan tidak membuat tagihan duplikat

### Requirement 2

**User Story:** Sebagai admin koperasi, saya ingin melihat daftar tagihan simpanan wajib yang belum dibayar, sehingga saya dapat mengetahui anggota mana yang masih memiliki tunggakan.

#### Acceptance Criteria

1. WHEN admin membuka halaman tagihan simpanan wajib THEN Sistem Simpanan SHALL menampilkan daftar semua tagihan dengan informasi nama anggota, periode, nominal, dan status pembayaran
2. WHEN admin memfilter tagihan berdasarkan status THEN Sistem Simpanan SHALL menampilkan hanya tagihan yang sesuai dengan status yang dipilih
3. WHEN admin memfilter tagihan berdasarkan periode THEN Sistem Simpanan SHALL menampilkan hanya tagihan yang sesuai dengan periode yang dipilih
4. WHEN admin mencari tagihan berdasarkan nama anggota THEN Sistem Simpanan SHALL menampilkan tagihan yang nama anggotanya mengandung kata kunci pencarian
5. WHEN daftar tagihan ditampilkan THEN Sistem Simpanan SHALL mengurutkan tagihan berdasarkan tanggal pembuatan dari yang terbaru

### Requirement 3

**User Story:** Sebagai admin koperasi, saya ingin membayar simpanan wajib untuk banyak anggota sekaligus, sehingga proses pembayaran menjadi lebih efisien.

#### Acceptance Criteria

1. WHEN admin memilih beberapa tagihan yang belum dibayar THEN Sistem Simpanan SHALL menampilkan checkbox untuk setiap tagihan yang dapat dipilih
2. WHEN admin memilih tagihan dan mengklik tombol bayar kolektif THEN Sistem Simpanan SHALL menampilkan konfirmasi dengan total nominal yang akan dibayar dan jumlah anggota
3. WHEN admin mengkonfirmasi pembayaran kolektif THEN Sistem Simpanan SHALL mengubah status semua tagihan yang dipilih menjadi "dibayar"
4. WHEN pembayaran kolektif berhasil THEN Sistem Simpanan SHALL mencatat tanggal pembayaran untuk setiap tagihan
5. WHEN pembayaran kolektif berhasil THEN Sistem Simpanan SHALL menambahkan saldo simpanan wajib untuk setiap anggota sesuai nominal tagihan

### Requirement 4

**User Story:** Sebagai admin koperasi, saya ingin pembayaran kolektif mencatat jurnal akuntansi yang benar, sehingga laporan keuangan tetap akurat.

#### Acceptance Criteria

1. WHEN pembayaran kolektif diproses THEN Sistem Simpanan SHALL membuat jurnal dengan debit pada akun kas dan kredit pada akun simpanan wajib
2. WHEN jurnal pembayaran kolektif dibuat THEN Sistem Simpanan SHALL mencatat total nominal pembayaran sebagai nilai transaksi
3. WHEN jurnal pembayaran kolektif dibuat THEN Sistem Simpanan SHALL menyimpan deskripsi yang mencantumkan jumlah anggota dan periode tagihan
4. WHEN jurnal pembayaran kolektif dibuat THEN Sistem Simpanan SHALL mencatat tanggal transaksi sesuai dengan tanggal pembayaran
5. WHEN pembayaran kolektif gagal THEN Sistem Simpanan SHALL tidak membuat jurnal dan mengembalikan status tagihan ke "belum dibayar"

### Requirement 5

**User Story:** Sebagai admin koperasi, saya ingin anggota baru wajib membayar simpanan pokok 250 ribu saat pertama kali mendaftar, sehingga setiap anggota memenuhi persyaratan keanggotaan.

#### Acceptance Criteria

1. WHEN anggota baru didaftarkan THEN Sistem Simpanan SHALL membuat tagihan simpanan pokok dengan nominal 250000 rupiah
2. WHEN tagihan simpanan pokok dibuat THEN Sistem Simpanan SHALL menyimpan status tagihan sebagai "belum dibayar"
3. WHEN admin membayar simpanan pokok anggota baru THEN Sistem Simpanan SHALL mengubah status tagihan menjadi "dibayar"
4. WHEN pembayaran simpanan pokok berhasil THEN Sistem Simpanan SHALL menambahkan saldo simpanan pokok anggota sebesar 250000 rupiah
5. WHEN pembayaran simpanan pokok berhasil THEN Sistem Simpanan SHALL membuat jurnal dengan debit pada akun kas dan kredit pada akun simpanan pokok

### Requirement 6

**User Story:** Sebagai admin koperasi, saya ingin dapat membatalkan tagihan simpanan wajib yang salah, sehingga data tagihan tetap akurat.

#### Acceptance Criteria

1. WHEN admin memilih tagihan yang belum dibayar dan mengklik tombol hapus THEN Sistem Simpanan SHALL menampilkan konfirmasi penghapusan
2. WHEN admin mengkonfirmasi penghapusan tagihan THEN Sistem Simpanan SHALL menghapus tagihan dari database
3. WHEN tagihan yang sudah dibayar dipilih untuk dihapus THEN Sistem Simpanan SHALL menolak penghapusan dan menampilkan pesan error
4. WHEN tagihan dihapus THEN Sistem Simpanan SHALL mencatat log audit dengan informasi admin yang menghapus dan waktu penghapusan
5. WHEN tagihan dihapus THEN Sistem Simpanan SHALL memperbarui tampilan daftar tagihan tanpa memerlukan refresh halaman

### Requirement 7

**User Story:** Sebagai admin koperasi, saya ingin melihat riwayat pembayaran simpanan wajib setiap anggota, sehingga saya dapat melacak kepatuhan pembayaran.

#### Acceptance Criteria

1. WHEN admin membuka detail anggota THEN Sistem Simpanan SHALL menampilkan riwayat pembayaran simpanan wajib dengan periode dan tanggal pembayaran
2. WHEN riwayat pembayaran ditampilkan THEN Sistem Simpanan SHALL mengurutkan dari periode terbaru ke periode terlama
3. WHEN admin memfilter riwayat berdasarkan rentang tanggal THEN Sistem Simpanan SHALL menampilkan hanya pembayaran dalam rentang tanggal tersebut
4. WHEN riwayat pembayaran ditampilkan THEN Sistem Simpanan SHALL menampilkan total simpanan wajib yang telah dibayar
5. WHEN anggota belum memiliki riwayat pembayaran THEN Sistem Simpanan SHALL menampilkan pesan bahwa belum ada pembayaran

### Requirement 8

**User Story:** Sebagai admin koperasi, saya ingin sistem mencegah pembuatan tagihan untuk anggota yang tidak aktif, sehingga tidak ada tagihan yang tidak perlu.

#### Acceptance Criteria

1. WHEN sistem membuat tagihan otomatis THEN Sistem Simpanan SHALL memeriksa status aktif setiap anggota sebelum membuat tagihan
2. WHEN anggota memiliki status "tidak aktif" THEN Sistem Simpanan SHALL melewati anggota tersebut dan tidak membuat tagihan
3. WHEN anggota memiliki status "aktif" THEN Sistem Simpanan SHALL membuat tagihan simpanan wajib untuk anggota tersebut
4. WHEN admin mengubah status anggota menjadi "tidak aktif" THEN Sistem Simpanan SHALL tidak membuat tagihan baru untuk anggota tersebut pada periode berikutnya
5. WHEN admin mengubah status anggota menjadi "aktif" kembali THEN Sistem Simpanan SHALL melanjutkan pembuatan tagihan untuk anggota tersebut pada periode berikutnya
