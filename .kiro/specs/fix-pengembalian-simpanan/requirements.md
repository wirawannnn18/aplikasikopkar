# Requirements Document

## Introduction

Sistem saat ini memiliki masalah dalam proses pengembalian simpanan anggota keluar. Ketika anggota keluar dan menerima pengembalian simpanan, data simpanan mereka tidak di-zero-kan dan masih muncul di laporan, meskipun jurnal akuntansi sudah benar. Fitur ini akan memperbaiki proses pengembalian simpanan agar data simpanan anggota keluar di-zero-kan dan tidak muncul di laporan setelah pengembalian diproses.

## Glossary

- **Anggota Keluar**: Anggota koperasi yang telah mengajukan keluar dari koperasi
- **Pengembalian Simpanan**: Proses pencairan dan pengembalian simpanan pokok dan wajib kepada anggota keluar
- **Simpanan Pokok**: Simpanan yang dibayarkan satu kali saat menjadi anggota
- **Simpanan Wajib**: Simpanan yang dibayarkan secara berkala oleh anggota
- **Zero-kan Saldo**: Mengubah saldo simpanan menjadi 0 setelah dikembalikan
- **Jurnal Akuntansi**: Catatan transaksi keuangan dalam sistem akuntansi double-entry
- **Kas**: Akun aset berupa uang tunai (kode akun 1-1000)
- **Bank**: Akun aset berupa rekening bank (kode akun 1-1100)
- **Simpanan Pokok (Kewajiban)**: Akun kewajiban untuk simpanan pokok (kode akun 2-1100)
- **Simpanan Wajib (Kewajiban)**: Akun kewajiban untuk simpanan wajib (kode akun 2-1200)
- **Transaksi**: Aktivitas keuangan seperti pembelian di POS, pembayaran kasbon, simpanan, atau pinjaman
- **Surat Pengunduran Diri**: Dokumen resmi yang menyatakan anggota mengundurkan diri dari koperasi
- **Bukti Pengembalian**: Dokumen yang mencatat detail pengembalian simpanan kepada anggota keluar

## Requirements

### Requirement 1

**User Story:** Sebagai admin koperasi, saya ingin saldo simpanan anggota keluar di-zero-kan setelah pengembalian diproses, sehingga data simpanan mereka tidak muncul di laporan dan mencerminkan bahwa simpanan telah dikembalikan.

#### Acceptance Criteria

1. WHEN sistem memproses pengembalian simpanan THEN sistem SHALL mengupdate saldo simpanan pokok anggota menjadi 0
2. WHEN sistem memproses pengembalian simpanan THEN sistem SHALL mengupdate saldo simpanan wajib anggota menjadi 0
3. WHEN sistem memproses pengembalian simpanan THEN sistem SHALL menyimpan catatan historis simpanan sebelum di-zero-kan
4. WHEN sistem memproses pengembalian simpanan THEN sistem SHALL mencatat timestamp pengembalian pada data simpanan
5. WHEN sistem memproses pengembalian simpanan THEN sistem SHALL mencatat ID pengembalian pada data simpanan

### Requirement 2

**User Story:** Sebagai admin koperasi, saya ingin laporan simpanan otomatis tidak menampilkan anggota keluar karena saldo simpanan mereka sudah 0, sehingga laporan hanya menampilkan anggota dengan saldo simpanan aktif.

#### Acceptance Criteria

1. WHEN sistem menampilkan laporan simpanan pokok THEN sistem SHALL hanya menampilkan anggota dengan saldo simpanan pokok lebih dari 0
2. WHEN sistem menampilkan laporan simpanan wajib THEN sistem SHALL hanya menampilkan anggota dengan saldo simpanan wajib lebih dari 0
3. WHEN sistem menampilkan laporan simpanan sukarela THEN sistem SHALL hanya menampilkan anggota dengan saldo simpanan sukarela lebih dari 0
4. WHEN sistem menghitung total simpanan THEN sistem SHALL hanya menjumlahkan saldo simpanan yang lebih dari 0
5. WHEN anggota keluar sudah menerima pengembalian THEN saldo simpanan anggota tersebut SHALL bernilai 0 sehingga otomatis tidak muncul di laporan

### Requirement 3

**User Story:** Sebagai admin koperasi, saya ingin melihat catatan lengkap pengembalian simpanan di menu anggota keluar, sehingga saya dapat melacak riwayat pengembalian simpanan untuk setiap anggota keluar.

#### Acceptance Criteria

1. WHEN admin membuka menu anggota keluar THEN sistem SHALL menampilkan daftar anggota keluar dengan status pengembalian
2. WHEN admin melihat detail anggota keluar THEN sistem SHALL menampilkan breakdown simpanan yang dikembalikan
3. WHEN admin melihat detail anggota keluar THEN sistem SHALL menampilkan tanggal pengembalian
4. WHEN admin melihat detail anggota keluar THEN sistem SHALL menampilkan metode pembayaran pengembalian
5. WHEN admin melihat detail anggota keluar THEN sistem SHALL menampilkan nomor referensi pengembalian

### Requirement 4

**User Story:** Sebagai admin koperasi, saya ingin jurnal akuntansi tetap konsisten dengan data simpanan, sehingga laporan keuangan akurat dan dapat diaudit.

#### Acceptance Criteria

1. WHEN sistem memproses pengembalian simpanan THEN sistem SHALL membuat jurnal debit pada akun Simpanan Pokok (2-1100)
2. WHEN sistem memproses pengembalian simpanan THEN sistem SHALL membuat jurnal debit pada akun Simpanan Wajib (2-1200)
3. WHEN sistem memproses pengembalian simpanan THEN sistem SHALL membuat jurnal kredit pada akun Kas atau Bank
4. WHEN sistem memproses pengembalian simpanan THEN sistem SHALL memvalidasi bahwa total debit sama dengan total kredit
5. WHEN sistem memproses pengembalian simpanan THEN sistem SHALL mencatat referensi jurnal pada data pengembalian

### Requirement 5

**User Story:** Sebagai admin koperasi, saya ingin anggota yang sudah keluar tidak muncul di master anggota, sehingga daftar master anggota hanya menampilkan anggota aktif dan memudahkan pengelolaan data.

#### Acceptance Criteria

1. WHEN sistem menampilkan master anggota THEN sistem SHALL mengecualikan anggota dengan statusKeanggotaan "Keluar"
2. WHEN admin melakukan pencarian anggota di master anggota THEN sistem SHALL hanya mencari dari anggota yang bukan berstatus keluar
3. WHEN admin melakukan filter anggota di master anggota THEN sistem SHALL hanya memfilter dari anggota yang bukan berstatus keluar
4. WHEN sistem menghitung total anggota di master anggota THEN sistem SHALL hanya menghitung anggota yang bukan berstatus keluar
5. WHEN admin ingin melihat anggota keluar THEN sistem SHALL menyediakan menu khusus "Anggota Keluar" yang terpisah dari master anggota

### Requirement 6

**User Story:** Sebagai kasir koperasi, saya ingin sistem mencegah anggota keluar melakukan transaksi apapun, sehingga tidak ada transaksi yang dilakukan oleh anggota yang sudah tidak aktif.

#### Acceptance Criteria

1. WHEN kasir mencoba melakukan transaksi POS dengan anggota keluar THEN sistem SHALL menolak transaksi dan menampilkan pesan bahwa anggota sudah keluar
2. WHEN kasir mencoba mencatat pembayaran kasbon untuk anggota keluar THEN sistem SHALL menolak transaksi dan menampilkan pesan bahwa anggota sudah keluar
3. WHEN kasir mencoba mencatat simpanan untuk anggota keluar THEN sistem SHALL menolak transaksi dan menampilkan pesan bahwa anggota sudah keluar
4. WHEN kasir mencoba mencatat pinjaman untuk anggota keluar THEN sistem SHALL menolak transaksi dan menampilkan pesan bahwa anggota sudah keluar
5. WHEN sistem melakukan validasi anggota untuk transaksi THEN sistem SHALL mengecek statusKeanggotaan dan menolak jika bernilai "Keluar"

### Requirement 7

**User Story:** Sebagai anggota keluar, saya ingin mendapatkan surat bukti pengunduran diri yang dapat di-print, sehingga saya memiliki dokumen resmi bahwa saya telah mengundurkan diri dan menerima pengembalian simpanan dari koperasi.

#### Acceptance Criteria

1. WHEN admin memproses pengembalian simpanan anggota keluar THEN sistem SHALL menyediakan tombol untuk mencetak surat pengunduran diri
2. WHEN admin mencetak surat pengunduran diri THEN sistem SHALL menampilkan dokumen yang berisi identitas anggota (nama, NIK, nomor kartu)
3. WHEN admin mencetak surat pengunduran diri THEN sistem SHALL menampilkan tanggal keluar dan alasan keluar
4. WHEN admin mencetak surat pengunduran diri THEN sistem SHALL menampilkan rincian pengembalian simpanan (simpanan pokok, simpanan wajib, total)
5. WHEN admin mencetak surat pengunduran diri THEN sistem SHALL menampilkan nomor referensi pengembalian, tanggal pembayaran, dan metode pembayaran
6. WHEN admin mencetak surat pengunduran diri THEN sistem SHALL menampilkan logo koperasi dan nama koperasi
7. WHEN admin mencetak surat pengunduran diri THEN sistem SHALL menyediakan area untuk tanda tangan anggota dan pihak koperasi

### Requirement 8

**User Story:** Sebagai admin koperasi, saya ingin sistem melakukan rollback otomatis jika terjadi error saat proses pengembalian, sehingga data tetap konsisten dan tidak ada data yang corrupt.

#### Acceptance Criteria

1. WHEN terjadi error saat memproses pengembalian THEN sistem SHALL mengembalikan semua perubahan data ke kondisi sebelumnya
2. WHEN terjadi error saat membuat jurnal THEN sistem SHALL membatalkan update saldo simpanan
3. WHEN terjadi error saat update status anggota THEN sistem SHALL membatalkan semua perubahan terkait
4. WHEN rollback berhasil THEN sistem SHALL menampilkan pesan error yang jelas kepada user
5. WHEN rollback berhasil THEN sistem SHALL mencatat error di audit log
