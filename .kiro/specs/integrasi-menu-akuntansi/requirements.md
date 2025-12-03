# Requirements Document

## Introduction

Aplikasi Koperasi Karyawan saat ini memiliki berbagai menu dan fitur yang sudah diimplementasikan, namun belum sepenuhnya terintegrasi dengan sistem akuntansi double-entry. Fitur ini bertujuan untuk memastikan semua transaksi dari setiap menu (POS, Simpanan, Pinjaman, Inventory, dll) tercatat dengan benar dalam jurnal akuntansi, sehingga laporan keuangan dapat menampilkan data yang akurat dan balance sesuai prinsip akuntansi.

## Glossary

- **System**: Aplikasi Koperasi Karyawan
- **Jurnal**: Catatan transaksi akuntansi dengan metode double-entry (debit dan kredit)
- **COA (Chart of Account)**: Daftar akun-akun keuangan yang digunakan dalam sistem
- **Double-Entry**: Metode pencatatan akuntansi dimana setiap transaksi dicatat minimal dua kali (debit dan kredit) dengan jumlah yang sama
- **HPP (Harga Pokok Penjualan)**: Biaya langsung yang terkait dengan produksi atau pembelian barang yang dijual
- **SHU (Sisa Hasil Usaha)**: Laba bersih koperasi yang akan dibagikan kepada anggota
- **Transaksi POS**: Transaksi penjualan barang melalui Point of Sales
- **Transaksi Simpanan**: Transaksi setoran atau penarikan simpanan anggota (pokok, wajib, sukarela)
- **Transaksi Pinjaman**: Transaksi pencairan pinjaman dan pembayaran angsuran
- **Transaksi Pembelian**: Transaksi pembelian barang dari supplier
- **Modal Awal**: Modal awal koperasi yang diinput di menu Data Koperasi
- **Saldo Awal Periode**: Saldo awal untuk setiap akun COA pada awal periode akuntansi

## Requirements

### Requirement 1

**User Story:** Sebagai administrator koperasi, saya ingin semua transaksi dari menu POS tercatat otomatis dalam jurnal akuntansi, sehingga laporan keuangan mencerminkan kondisi kas dan pendapatan yang akurat.

#### Acceptance Criteria

1. WHEN a user melakukan transaksi penjualan cash di POS THEN the System SHALL create jurnal entry dengan debit Kas dan kredit Pendapatan Penjualan
2. WHEN a user melakukan transaksi penjualan cash di POS THEN the System SHALL create jurnal entry dengan debit HPP dan kredit Persediaan Barang
3. WHEN a user melakukan transaksi penjualan bon di POS THEN the System SHALL create jurnal entry dengan debit Piutang Anggota dan kredit Pendapatan Penjualan
4. WHEN a user melakukan transaksi penjualan bon di POS THEN the System SHALL create jurnal entry dengan debit HPP dan kredit Persediaan Barang
5. WHEN a user melakukan pembayaran bon anggota THEN the System SHALL create jurnal entry dengan debit Kas dan kredit Piutang Anggota

### Requirement 2

**User Story:** Sebagai administrator koperasi, saya ingin semua transaksi simpanan anggota tercatat otomatis dalam jurnal akuntansi, sehingga kewajiban koperasi kepada anggota dapat dilacak dengan akurat.

#### Acceptance Criteria

1. WHEN a user melakukan setoran simpanan pokok THEN the System SHALL create jurnal entry dengan debit Kas dan kredit Simpanan Pokok
2. WHEN a user melakukan setoran simpanan wajib THEN the System SHALL create jurnal entry dengan debit Kas dan kredit Simpanan Wajib
3. WHEN a user melakukan setoran simpanan sukarela THEN the System SHALL create jurnal entry dengan debit Kas dan kredit Simpanan Sukarela
4. WHEN a user melakukan penarikan simpanan sukarela THEN the System SHALL create jurnal entry dengan debit Simpanan Sukarela dan kredit Kas
5. WHEN a user melakukan hapus transaksi simpanan THEN the System SHALL create jurnal reversal entry untuk membatalkan jurnal sebelumnya

### Requirement 3

**User Story:** Sebagai administrator koperasi, saya ingin semua transaksi pinjaman tercatat otomatis dalam jurnal akuntansi, sehingga piutang koperasi kepada anggota dapat dilacak dengan akurat.

#### Acceptance Criteria

1. WHEN a user melakukan pencairan pinjaman baru THEN the System SHALL create jurnal entry dengan debit Piutang Pinjaman dan kredit Kas
2. WHEN a user melakukan pembayaran angsuran pinjaman THEN the System SHALL create jurnal entry dengan debit Kas dan kredit Piutang Pinjaman untuk pokok pinjaman
3. WHEN a user melakukan pembayaran angsuran pinjaman THEN the System SHALL create jurnal entry dengan debit Kas dan kredit Pendapatan Bunga untuk bunga pinjaman
4. WHEN a user melakukan pelunasan pinjaman THEN the System SHALL update status pinjaman menjadi Lunas dan create jurnal entry yang sesuai

### Requirement 4

**User Story:** Sebagai administrator koperasi, saya ingin semua transaksi pembelian barang tercatat otomatis dalam jurnal akuntansi, sehingga persediaan dan hutang dapat dilacak dengan akurat.

#### Acceptance Criteria

1. WHEN a user melakukan pembelian barang cash THEN the System SHALL create jurnal entry dengan debit Persediaan Barang dan kredit Kas
2. WHEN a user melakukan pembelian barang kredit THEN the System SHALL create jurnal entry dengan debit Persediaan Barang dan kredit Hutang Supplier
3. WHEN a user melakukan pembayaran hutang supplier THEN the System SHALL create jurnal entry dengan debit Hutang Supplier dan kredit Kas
4. WHEN a user melakukan pembelian barang THEN the System SHALL update stok barang secara otomatis

### Requirement 5

**User Story:** Sebagai administrator koperasi, saya ingin modal awal koperasi tercatat dalam jurnal akuntansi, sehingga neraca keuangan menampilkan modal yang benar.

#### Acceptance Criteria

1. WHEN a user melakukan input modal awal koperasi THEN the System SHALL create jurnal entry dengan debit Kas dan kredit Modal Koperasi
2. WHEN a user melakukan perubahan modal awal koperasi THEN the System SHALL create jurnal adjustment entry untuk menyesuaikan saldo
3. WHEN a user melakukan input modal awal THEN the System SHALL update saldo akun Kas dan Modal Koperasi di COA

### Requirement 6

**User Story:** Sebagai administrator koperasi, saya ingin dapat mengatur saldo awal periode untuk setiap akun COA, sehingga sistem dapat dimulai dengan data historis yang benar.

#### Acceptance Criteria

1. WHEN a user melakukan input saldo awal periode THEN the System SHALL create jurnal entry untuk setiap akun dengan saldo awal
2. WHEN a user melakukan input saldo awal periode THEN the System SHALL validate bahwa total debit sama dengan total kredit
3. WHEN a user melakukan aktivasi periode THEN the System SHALL lock saldo awal dan prevent perubahan
4. WHEN a user melakukan input saldo awal THEN the System SHALL update saldo setiap akun di COA

### Requirement 7

**User Story:** Sebagai administrator koperasi, saya ingin semua jurnal yang dibuat otomatis memiliki referensi ke transaksi aslinya, sehingga dapat dilakukan audit trail yang jelas.

#### Acceptance Criteria

1. WHEN the System creates jurnal entry otomatis THEN the System SHALL include referensi nomor transaksi sumber
2. WHEN the System creates jurnal entry otomatis THEN the System SHALL include tipe transaksi (POS, Simpanan, Pinjaman, dll)
3. WHEN the System creates jurnal entry otomatis THEN the System SHALL include timestamp yang akurat
4. WHEN a user melakukan view jurnal THEN the System SHALL display referensi transaksi sumber dengan jelas

### Requirement 8

**User Story:** Sebagai administrator koperasi, saya ingin sistem memvalidasi setiap jurnal entry mengikuti prinsip double-entry, sehingga tidak ada transaksi yang tidak balance.

#### Acceptance Criteria

1. WHEN the System creates jurnal entry THEN the System SHALL validate bahwa total debit sama dengan total kredit
2. WHEN the System creates jurnal entry THEN the System SHALL prevent penyimpanan jika tidak balance
3. WHEN the System updates saldo COA THEN the System SHALL validate bahwa persamaan akuntansi tetap terpenuhi (Aset = Kewajiban + Modal)
4. WHEN a user melakukan input jurnal manual THEN the System SHALL validate balance sebelum menyimpan

### Requirement 9

**User Story:** Sebagai administrator koperasi, saya ingin laporan keuangan (Laba Rugi, Neraca, Buku Besar) menampilkan data yang akurat berdasarkan semua transaksi yang tercatat, sehingga dapat membuat keputusan bisnis yang tepat.

#### Acceptance Criteria

1. WHEN a user melakukan view Laporan Laba Rugi THEN the System SHALL calculate total pendapatan dari akun tipe Pendapatan
2. WHEN a user melakukan view Laporan Laba Rugi THEN the System SHALL calculate total beban dari akun tipe Beban
3. WHEN a user melakukan view Laporan Laba Rugi THEN the System SHALL calculate laba bersih sebagai selisih pendapatan dan beban
4. WHEN a user melakukan view Laporan Neraca THEN the System SHALL display total aset, kewajiban, dan modal yang balance
5. WHEN a user melakukan view Buku Besar THEN the System SHALL display semua transaksi per akun dengan saldo berjalan yang akurat

### Requirement 10

**User Story:** Sebagai administrator koperasi, saya ingin dapat menghapus transaksi yang salah dengan aman, sehingga jurnal akuntansi tetap balance dan audit trail tetap terjaga.

#### Acceptance Criteria

1. WHEN a user melakukan hapus transaksi POS THEN the System SHALL create jurnal reversal entry untuk membatalkan jurnal sebelumnya
2. WHEN a user melakukan hapus transaksi simpanan THEN the System SHALL create jurnal reversal entry dan update saldo simpanan anggota
3. WHEN a user melakukan hapus transaksi pinjaman THEN the System SHALL create jurnal reversal entry dan update status pinjaman
4. WHEN a user melakukan hapus transaksi THEN the System SHALL maintain audit trail dengan mencatat siapa dan kapan penghapusan dilakukan
5. WHEN a user melakukan hapus transaksi THEN the System SHALL validate bahwa saldo tidak menjadi negatif setelah penghapusan

### Requirement 11

**User Story:** Sebagai kasir, saya ingin menu POS dapat berfungsi dengan lancar untuk transaksi harian, sehingga pelayanan kepada anggota tidak terganggu.

#### Acceptance Criteria

1. WHEN a user melakukan buka kasir THEN the System SHALL record modal awal kas dan create jurnal entry
2. WHEN a user melakukan tutup kasir THEN the System SHALL calculate selisih kas dan create jurnal adjustment jika diperlukan
3. WHEN a user melakukan scan barcode THEN the System SHALL find barang dengan cepat dan display informasi lengkap
4. WHEN a user melakukan tambah item ke keranjang THEN the System SHALL validate stok tersedia sebelum menambahkan
5. WHEN a user melakukan cetak struk THEN the System SHALL display logo koperasi dan informasi transaksi lengkap

### Requirement 12

**User Story:** Sebagai administrator koperasi, saya ingin semua menu dapat diakses sesuai dengan hak akses user, sehingga keamanan data terjaga.

#### Acceptance Criteria

1. WHEN a user dengan role Super Admin melakukan login THEN the System SHALL display semua menu termasuk hapus transaksi tertutup
2. WHEN a user dengan role Administrator melakukan login THEN the System SHALL display menu sesuai hak akses administrator
3. WHEN a user dengan role Keuangan melakukan login THEN the System SHALL display menu keuangan dan simpanan pinjaman
4. WHEN a user dengan role Kasir melakukan login THEN the System SHALL display menu POS dan transaksi harian
5. WHEN a user melakukan akses menu tanpa hak akses THEN the System SHALL prevent akses dan display pesan error

### Requirement 13

**User Story:** Sebagai administrator koperasi, saya ingin sistem dapat menangani transaksi dalam jumlah besar tanpa error, sehingga operasional harian tidak terganggu.

#### Acceptance Criteria

1. WHEN the System processes transaksi THEN the System SHALL complete dalam waktu kurang dari 2 detik
2. WHEN the System stores data ke localStorage THEN the System SHALL handle error jika storage penuh
3. WHEN the System loads data dari localStorage THEN the System SHALL validate format data sebelum digunakan
4. WHEN the System creates multiple jurnal entries THEN the System SHALL process secara atomic (semua berhasil atau semua gagal)

### Requirement 14

**User Story:** Sebagai administrator koperasi, saya ingin dapat melakukan backup dan restore data, sehingga data koperasi aman dari kehilangan.

#### Acceptance Criteria

1. WHEN a user melakukan backup data THEN the System SHALL export semua data ke file JSON
2. WHEN a user melakukan restore data THEN the System SHALL import data dari file JSON dan validate format
3. WHEN a user melakukan restore data THEN the System SHALL create backup otomatis sebelum restore
4. WHEN a user melakukan backup THEN the System SHALL include timestamp dalam nama file
