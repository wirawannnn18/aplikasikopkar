# Requirements Document

## Introduction

Fitur pengelolaan anggota keluar dari koperasi adalah sistem untuk menangani proses formal ketika seorang anggota memutuskan untuk keluar dari keanggotaan koperasi. Sistem ini mencakup pencatatan status keluar anggota, perhitungan dan pengembalian simpanan pokok dan simpanan wajib, serta integrasi penuh dengan sistem akuntansi untuk memastikan transparansi dan akurasi laporan keuangan.

## Glossary

- **Sistem**: Aplikasi koperasi berbasis web
- **Anggota**: Individu yang terdaftar sebagai anggota koperasi
- **Anggota Keluar**: Anggota yang telah mengajukan dan disetujui untuk keluar dari koperasi
- **Simpanan Pokok**: Dana yang disetor anggota saat pertama kali mendaftar sebagai anggota koperasi
- **Simpanan Wajib**: Dana yang disetor anggota secara berkala sesuai ketentuan koperasi
- **Pengembalian Simpanan**: Proses pengembalian dana simpanan pokok dan simpanan wajib kepada anggota yang keluar
- **Jurnal Akuntansi**: Catatan transaksi keuangan dalam sistem pembukuan double-entry
- **Administrator**: Pengguna dengan hak akses untuk mengelola data anggota dan menyetujui pengembalian simpanan
- **Laporan Keuangan**: Dokumen yang menampilkan posisi keuangan dan transaksi koperasi

## Requirements

### Requirement 1

**User Story:** Sebagai administrator, saya ingin mencatat status anggota yang keluar dari koperasi, sehingga data keanggotaan tetap akurat dan historis.

#### Acceptance Criteria

1. WHEN administrator mengakses halaman daftar anggota THEN the Sistem SHALL menampilkan opsi untuk menandai anggota sebagai keluar
2. WHEN administrator memilih anggota dan mengklik tombol "Anggota Keluar" THEN the Sistem SHALL menampilkan form konfirmasi dengan detail anggota
3. WHEN administrator mengisi tanggal keluar dan alasan keluar THEN the Sistem SHALL menyimpan informasi tersebut ke dalam record anggota
4. WHEN status anggota diubah menjadi keluar THEN the Sistem SHALL mempertahankan semua data historis anggota tersebut
5. WHEN anggota sudah berstatus keluar THEN the Sistem SHALL mencegah anggota tersebut melakukan transaksi baru

### Requirement 2

**User Story:** Sebagai administrator, saya ingin menghitung total simpanan yang harus dikembalikan kepada anggota keluar, sehingga proses pengembalian akurat dan transparan.

#### Acceptance Criteria

1. WHEN administrator membuka detail anggota keluar THEN the Sistem SHALL menampilkan total simpanan pokok anggota tersebut
2. WHEN administrator membuka detail anggota keluar THEN the Sistem SHALL menampilkan total simpanan wajib anggota tersebut
3. WHEN Sistem menghitung total pengembalian THEN the Sistem SHALL menjumlahkan simpanan pokok dan simpanan wajib
4. WHEN terdapat pinjaman yang belum lunas THEN the Sistem SHALL menampilkan peringatan bahwa pengembalian tidak dapat diproses
5. WHEN terdapat kewajiban lain yang belum diselesaikan THEN the Sistem SHALL mengurangi total pengembalian dengan jumlah kewajiban tersebut

### Requirement 3

**User Story:** Sebagai administrator, saya ingin memproses pengembalian simpanan kepada anggota keluar, sehingga anggota menerima haknya sesuai ketentuan koperasi.

#### Acceptance Criteria

1. WHEN administrator mengklik tombol "Proses Pengembalian" THEN the Sistem SHALL menampilkan form konfirmasi dengan rincian pengembalian
2. WHEN administrator mengkonfirmasi pengembalian THEN the Sistem SHALL mencatat transaksi pengembalian dengan tanggal, jumlah, dan metode pembayaran
3. WHEN pengembalian diproses THEN the Sistem SHALL mengubah status pengembalian menjadi "Selesai"
4. WHEN pengembalian diproses THEN the Sistem SHALL mengurangi saldo simpanan pokok anggota menjadi nol
5. WHEN pengembalian diproses THEN the Sistem SHALL mengurangi saldo simpanan wajib anggota menjadi nol

### Requirement 4

**User Story:** Sebagai administrator, saya ingin sistem mencatat jurnal akuntansi untuk pengembalian simpanan, sehingga laporan keuangan tetap akurat dan seimbang.

#### Acceptance Criteria

1. WHEN pengembalian simpanan pokok diproses THEN the Sistem SHALL membuat jurnal debit pada akun "Simpanan Pokok Anggota"
2. WHEN pengembalian simpanan pokok diproses THEN the Sistem SHALL membuat jurnal kredit pada akun "Kas" atau "Bank"
3. WHEN pengembalian simpanan wajib diproses THEN the Sistem SHALL membuat jurnal debit pada akun "Simpanan Wajib Anggota"
4. WHEN pengembalian simpanan wajib diproses THEN the Sistem SHALL membuat jurnal kredit pada akun "Kas" atau "Bank"
5. WHEN jurnal dibuat THEN the Sistem SHALL menyimpan referensi ke transaksi pengembalian dan ID anggota

### Requirement 5

**User Story:** Sebagai administrator, saya ingin melihat laporan anggota keluar dan pengembalian simpanan, sehingga dapat memantau dan mengaudit proses keluar anggota.

#### Acceptance Criteria

1. WHEN administrator mengakses menu laporan THEN the Sistem SHALL menampilkan opsi "Laporan Anggota Keluar"
2. WHEN administrator membuka laporan anggota keluar THEN the Sistem SHALL menampilkan daftar semua anggota yang keluar dengan tanggal keluar
3. WHEN administrator membuka laporan anggota keluar THEN the Sistem SHALL menampilkan status pengembalian untuk setiap anggota
4. WHEN administrator memfilter berdasarkan periode THEN the Sistem SHALL menampilkan anggota yang keluar dalam periode tersebut
5. WHEN administrator mengekspor laporan THEN the Sistem SHALL menghasilkan file CSV dengan data lengkap anggota keluar dan pengembalian

### Requirement 6

**User Story:** Sebagai administrator, saya ingin sistem memvalidasi kelengkapan data sebelum memproses pengembalian, sehingga tidak terjadi kesalahan dalam proses pengembalian.

#### Acceptance Criteria

1. WHEN administrator memproses pengembalian THEN the Sistem SHALL memvalidasi bahwa anggota tidak memiliki pinjaman aktif
2. WHEN administrator memproses pengembalian THEN the Sistem SHALL memvalidasi bahwa saldo kas mencukupi untuk pengembalian
3. WHEN administrator memproses pengembalian THEN the Sistem SHALL memvalidasi bahwa metode pembayaran telah dipilih
4. WHEN validasi gagal THEN the Sistem SHALL menampilkan pesan error yang jelas dan mencegah proses pengembalian
5. WHEN validasi berhasil THEN the Sistem SHALL mengizinkan administrator melanjutkan proses pengembalian

### Requirement 7

**User Story:** Sebagai administrator, saya ingin mencetak bukti pengembalian simpanan, sehingga anggota memiliki dokumen resmi sebagai tanda terima.

#### Acceptance Criteria

1. WHEN pengembalian selesai diproses THEN the Sistem SHALL menampilkan tombol "Cetak Bukti Pengembalian"
2. WHEN administrator mengklik tombol cetak THEN the Sistem SHALL menghasilkan dokumen bukti pengembalian dalam format yang dapat dicetak
3. WHEN dokumen dibuat THEN the Sistem SHALL mencantumkan nama anggota, nomor anggota, tanggal keluar, dan rincian pengembalian
4. WHEN dokumen dibuat THEN the Sistem SHALL mencantumkan tanda tangan digital atau ruang untuk tanda tangan manual
5. WHEN dokumen dibuat THEN the Sistem SHALL mencantumkan nomor referensi transaksi untuk audit trail

### Requirement 8

**User Story:** Sebagai administrator, saya ingin dapat membatalkan status anggota keluar jika terjadi kesalahan, sehingga data dapat diperbaiki tanpa merusak integritas sistem.

#### Acceptance Criteria

1. WHEN administrator membuka detail anggota keluar yang belum diproses pengembaliannya THEN the Sistem SHALL menampilkan tombol "Batalkan Status Keluar"
2. WHEN administrator mengklik batalkan THEN the Sistem SHALL menampilkan konfirmasi pembatalan
3. WHEN pembatalan dikonfirmasi THEN the Sistem SHALL mengembalikan status anggota menjadi aktif
4. WHEN anggota sudah diproses pengembaliannya THEN the Sistem SHALL mencegah pembatalan status keluar
5. WHEN pembatalan berhasil THEN the Sistem SHALL mencatat log audit untuk pembatalan tersebut
