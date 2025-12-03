# Dokumen Requirements - Saldo Awal Periode Akuntansi Koperasi

## Pendahuluan

Fitur Saldo Awal Periode Akuntansi memungkinkan administrator koperasi untuk menginput data keuangan awal pada permulaan periode akuntansi baru (biasanya awal tahun buku). Fitur ini penting untuk memastikan kontinuitas pencatatan akuntansi dan memberikan titik awal yang akurat untuk periode berjalan sesuai dengan standar akuntansi koperasi Indonesia.

## Glosarium

- **Sistem Koperasi**: Aplikasi manajemen koperasi berbasis web yang mengelola keuangan, anggota, simpanan, pinjaman, dan transaksi
- **Administrator**: Pengguna dengan hak akses penuh untuk mengelola data koperasi termasuk pengaturan periode akuntansi
- **Periode Akuntansi**: Rentang waktu pencatatan keuangan, biasanya satu tahun buku (12 bulan)
- **Saldo Awal**: Nilai awal akun pada permulaan periode akuntansi baru
- **COA (Chart of Accounts)**: Daftar akun-akun keuangan yang digunakan dalam sistem akuntansi
- **Modal Koperasi**: Kekayaan bersih koperasi yang berasal dari simpanan anggota dan laba ditahan
- **Aset**: Sumber daya ekonomi yang dimiliki koperasi (kas, bank, piutang, persediaan)
- **Kewajiban**: Utang atau kewajiban koperasi kepada pihak lain (hutang supplier, simpanan anggota)
- **Piutang**: Tagihan koperasi kepada anggota atau pihak lain
- **Hutang**: Kewajiban koperasi kepada supplier atau pihak lain
- **Persediaan**: Barang dagangan yang tersedia untuk dijual
- **Simpanan Anggota**: Dana yang disetor anggota ke koperasi (pokok, wajib, sukarela)
- **Neraca Saldo**: Daftar saldo semua akun pada tanggal tertentu
- **Double-Entry Bookkeeping**: Sistem pencatatan akuntansi dimana setiap transaksi dicatat minimal dua kali (debit dan kredit)

## Requirements

### Requirement 1

**User Story:** Sebagai administrator koperasi, saya ingin menginput saldo awal periode akuntansi, sehingga sistem dapat memulai pencatatan keuangan periode baru dengan data yang akurat.

#### Acceptance Criteria

1. WHEN administrator mengakses menu saldo awal periode THEN Sistem Koperasi SHALL menampilkan form input saldo awal dengan tanggal periode dan daftar akun dari COA yang sudah ada di localStorage
2. WHEN administrator menginput tanggal mulai periode THEN Sistem Koperasi SHALL memvalidasi bahwa tanggal tersebut belum digunakan untuk periode sebelumnya
3. WHEN administrator menyimpan saldo awal periode THEN Sistem Koperasi SHALL mencatat jurnal pembuka ke dalam array jurnal yang sudah ada dengan keterangan "Saldo Awal Periode"
4. WHEN saldo awal periode disimpan THEN Sistem Koperasi SHALL memperbarui field saldo pada setiap akun di array COA localStorage sesuai dengan nilai yang diinput
5. WHEN administrator melihat laporan keuangan THEN Sistem Koperasi SHALL menampilkan data yang dimulai dari saldo awal periode yang telah diinput dengan mengambil data dari COA dan jurnal yang terintegrasi

### Requirement 2

**User Story:** Sebagai administrator koperasi, saya ingin menginput modal awal koperasi pada awal periode, sehingga neraca keuangan menunjukkan posisi modal yang benar.

#### Acceptance Criteria

1. WHEN administrator menginput modal awal koperasi THEN Sistem Koperasi SHALL mencatat jurnal menggunakan fungsi addJurnal() dengan entries debit pada akun Kas (1-1000) dan kredit pada akun Modal Koperasi (3-1000)
2. WHEN modal awal diinput THEN Sistem Koperasi SHALL memvalidasi bahwa nilai modal adalah angka positif lebih besar dari nol
3. WHEN modal awal disimpan THEN Sistem Koperasi SHALL memperbarui field saldo pada akun Kas dan Modal Koperasi di array COA localStorage
4. WHEN modal awal disimpan THEN Sistem Koperasi SHALL menampilkan modal tersebut di laporan Laba Rugi dan laporan SHU yang mengambil data dari COA
5. WHEN administrator mengubah modal awal THEN Sistem Koperasi SHALL membuat jurnal koreksi menggunakan addJurnal() untuk menyesuaikan saldo

### Requirement 3

**User Story:** Sebagai administrator koperasi, saya ingin menginput saldo kas dan bank awal periode, sehingga pencatatan arus kas dimulai dari posisi yang akurat.

#### Acceptance Criteria

1. WHEN administrator menginput saldo kas awal THEN Sistem Koperasi SHALL memperbarui field saldo pada akun dengan kode 1-1000 di array COA localStorage
2. WHEN administrator menginput saldo bank awal THEN Sistem Koperasi SHALL memperbarui field saldo pada akun dengan kode 1-1100 di array COA localStorage
3. WHEN saldo kas atau bank diinput THEN Sistem Koperasi SHALL memvalidasi bahwa nilai adalah angka positif atau nol
4. WHEN saldo kas dan bank disimpan THEN Sistem Koperasi SHALL mencatat jurnal pembuka menggunakan addJurnal() dengan entries untuk akun Kas dan Bank
5. WHEN saldo kas dan bank disimpan THEN Sistem Koperasi SHALL menampilkan total aset lancar yang benar di neraca dengan menjumlahkan saldo akun tipe Aset dari COA

### Requirement 4

**User Story:** Sebagai administrator koperasi, saya ingin menginput saldo piutang anggota awal periode, sehingga sistem dapat melacak tagihan yang belum tertagih dari periode sebelumnya.

#### Acceptance Criteria

1. WHEN administrator menginput saldo piutang awal THEN Sistem Koperasi SHALL menampilkan daftar anggota dari localStorage untuk memilih debitur
2. WHEN administrator menambah piutang per anggota THEN Sistem Koperasi SHALL mencatat detail piutang dengan NIK anggota, nama, dan jumlah piutang ke array piutangAwal di localStorage
3. WHEN total piutang anggota diinput THEN Sistem Koperasi SHALL memperbarui field saldo pada akun dengan kode 1-1200 di array COA localStorage
4. WHEN piutang awal disimpan THEN Sistem Koperasi SHALL mencatat jurnal menggunakan addJurnal() dengan debit Piutang Anggota dan kredit Modal atau akun lawan yang sesuai
5. WHEN piutang awal disimpan THEN Sistem Koperasi SHALL menampilkan daftar piutang per anggota di laporan piutang
6. WHEN administrator melihat detail anggota THEN Sistem Koperasi SHALL menampilkan saldo piutang awal anggota tersebut dari array piutangAwal

### Requirement 5

**User Story:** Sebagai administrator koperasi, saya ingin menginput saldo hutang supplier awal periode, sehingga sistem dapat melacak kewajiban yang belum dibayar dari periode sebelumnya.

#### Acceptance Criteria

1. WHEN administrator menginput saldo hutang awal THEN Sistem Koperasi SHALL menampilkan form untuk menambah hutang per supplier
2. WHEN administrator menambah hutang supplier THEN Sistem Koperasi SHALL mencatat detail hutang dengan nama supplier dan jumlah hutang ke array hutangAwal di localStorage
3. WHEN total hutang supplier diinput THEN Sistem Koperasi SHALL memperbarui field saldo pada akun dengan kode 2-1000 di array COA localStorage
4. WHEN hutang awal disimpan THEN Sistem Koperasi SHALL mencatat jurnal menggunakan addJurnal() dengan debit Modal atau akun lawan yang sesuai dan kredit Hutang Supplier
5. WHEN hutang awal disimpan THEN Sistem Koperasi SHALL menampilkan daftar hutang per supplier di laporan kewajiban
6. WHEN administrator melakukan pembayaran hutang THEN Sistem Koperasi SHALL mengurangi saldo hutang supplier yang bersangkutan dan mencatat jurnal pembayaran

### Requirement 6

**User Story:** Sebagai administrator koperasi, saya ingin menginput saldo persediaan barang awal periode, sehingga sistem dapat melacak stok dan nilai persediaan dengan benar.

#### Acceptance Criteria

1. WHEN administrator menginput saldo persediaan awal THEN Sistem Koperasi SHALL menampilkan daftar barang dari array produk di localStorage
2. WHEN administrator menginput stok awal per barang THEN Sistem Koperasi SHALL memperbarui field stok pada setiap produk di array produk localStorage
3. WHEN stok awal barang diinput THEN Sistem Koperasi SHALL menghitung total nilai persediaan dengan mengalikan stok dengan harga beli per barang
4. WHEN total nilai persediaan dihitung THEN Sistem Koperasi SHALL memperbarui field saldo pada akun dengan kode 1-1300 di array COA localStorage
5. WHEN persediaan awal disimpan THEN Sistem Koperasi SHALL mencatat jurnal menggunakan addJurnal() dengan debit Persediaan Barang dan kredit Modal atau akun lawan yang sesuai
6. WHEN persediaan awal disimpan THEN Sistem Koperasi SHALL menampilkan nilai persediaan di neraca sebagai aset dengan mengambil saldo dari COA

### Requirement 7

**User Story:** Sebagai administrator koperasi, saya ingin menginput saldo simpanan anggota awal periode, sehingga sistem dapat melacak kewajiban koperasi kepada anggota dengan akurat.

#### Acceptance Criteria

1. WHEN administrator menginput saldo simpanan awal THEN Sistem Koperasi SHALL menampilkan daftar anggota dari localStorage dengan kolom simpanan pokok, wajib, dan sukarela
2. WHEN administrator menginput simpanan pokok per anggota THEN Sistem Koperasi SHALL memperbarui field simpananPokok pada objek anggota di array anggota localStorage
3. WHEN administrator menginput simpanan wajib per anggota THEN Sistem Koperasi SHALL memperbarui field simpananWajib pada objek anggota di array anggota localStorage
4. WHEN administrator menginput simpanan sukarela per anggota THEN Sistem Koperasi SHALL memperbarui field simpananSukarela pada objek anggota di array anggota localStorage
5. WHEN total simpanan dihitung THEN Sistem Koperasi SHALL memperbarui field saldo pada akun dengan kode 2-1100, 2-1200, dan 2-1300 di array COA localStorage
6. WHEN simpanan awal disimpan THEN Sistem Koperasi SHALL mencatat jurnal menggunakan addJurnal() dengan debit Modal atau akun lawan yang sesuai dan kredit Simpanan Pokok, Simpanan Wajib, dan Simpanan Sukarela
7. WHEN simpanan awal disimpan THEN Sistem Koperasi SHALL menampilkan total simpanan sebagai kewajiban di neraca dengan mengambil saldo dari COA

### Requirement 8

**User Story:** Sebagai administrator koperasi, saya ingin menginput saldo pinjaman anggota awal periode, sehingga sistem dapat melacak piutang pinjaman yang belum lunas dari periode sebelumnya.

#### Acceptance Criteria

1. WHEN administrator menginput saldo pinjaman awal THEN Sistem Koperasi SHALL menampilkan form untuk menambah pinjaman per anggota dari daftar anggota di localStorage
2. WHEN administrator menambah pinjaman anggota THEN Sistem Koperasi SHALL mencatat detail pinjaman dengan NIK anggota, jumlah pokok, bunga, tenor, dan tanggal jatuh tempo ke array pinjaman di localStorage
3. WHEN pinjaman awal diinput THEN Sistem Koperasi SHALL membuat atau memperbarui akun Piutang Pinjaman di array COA localStorage
4. WHEN total pinjaman dihitung THEN Sistem Koperasi SHALL memperbarui field saldo pada akun Piutang Pinjaman di array COA localStorage
5. WHEN pinjaman awal disimpan THEN Sistem Koperasi SHALL mencatat jurnal menggunakan addJurnal() dengan debit Piutang Pinjaman dan kredit Modal atau akun lawan yang sesuai
6. WHEN pinjaman awal disimpan THEN Sistem Koperasi SHALL menampilkan daftar pinjaman aktif per anggota dengan status "Aktif" dan sisa pokok yang belum dibayar

### Requirement 9

**User Story:** Sebagai administrator koperasi, saya ingin sistem memvalidasi keseimbangan neraca saldo awal, sehingga data yang diinput sesuai dengan prinsip akuntansi double-entry.

#### Acceptance Criteria

1. WHEN administrator menyimpan saldo awal periode THEN Sistem Koperasi SHALL menghitung total debit dan total kredit dari entries jurnal pembuka yang akan dicatat
2. WHEN total debit tidak sama dengan total kredit THEN Sistem Koperasi SHALL menampilkan pesan error dan mencegah pemanggilan fungsi addJurnal()
3. WHEN total debit sama dengan total kredit THEN Sistem Koperasi SHALL mengizinkan penyimpanan saldo awal periode dengan memanggil addJurnal()
4. WHEN validasi balance dilakukan THEN Sistem Koperasi SHALL menampilkan selisih antara total debit dan total kredit jika tidak balance
5. WHEN neraca balance THEN Sistem Koperasi SHALL menghitung total saldo akun tipe Aset, Kewajiban, dan Modal dari array COA dan menampilkan konfirmasi bahwa persamaan akuntansi terpenuhi (Aset = Kewajiban + Modal)

### Requirement 10

**User Story:** Sebagai administrator koperasi, saya ingin melihat ringkasan saldo awal periode yang telah diinput, sehingga saya dapat memverifikasi kebenaran data sebelum memulai transaksi periode baru.

#### Acceptance Criteria

1. WHEN administrator mengakses halaman ringkasan saldo awal THEN Sistem Koperasi SHALL menampilkan tanggal periode dari localStorage dan status periode (aktif/tutup)
2. WHEN ringkasan ditampilkan THEN Sistem Koperasi SHALL menghitung dan menampilkan total aset, total kewajiban, dan total modal dengan menjumlahkan saldo akun per tipe dari array COA
3. WHEN ringkasan ditampilkan THEN Sistem Koperasi SHALL menampilkan rincian per kategori akun dengan membaca saldo dari akun-akun spesifik di COA (1-1000 untuk kas, 1-1100 untuk bank, 1-1200 untuk piutang, 2-1000 untuk hutang, 1-1300 untuk persediaan, 2-1100/2-1200/2-1300 untuk simpanan)
4. WHEN administrator mencetak ringkasan THEN Sistem Koperasi SHALL menghasilkan laporan neraca saldo awal dalam format CSV dengan membaca data dari array COA
5. WHEN periode sudah aktif THEN Sistem Koperasi SHALL membaca flag periodeAktif dari localStorage dan mencegah perubahan saldo awal kecuali dengan jurnal koreksi menggunakan addJurnal()

### Requirement 11

**User Story:** Sebagai administrator koperasi, saya ingin dapat mengedit atau mengoreksi saldo awal periode, sehingga kesalahan input dapat diperbaiki sebelum periode ditutup.

#### Acceptance Criteria

1. WHEN administrator mengedit saldo awal periode yang belum dikunci THEN Sistem Koperasi SHALL membaca flag periodeAktif dari localStorage dan mengizinkan perubahan nilai saldo di array COA
2. WHEN administrator menyimpan perubahan saldo awal THEN Sistem Koperasi SHALL menghitung selisih antara saldo lama dan baru kemudian membuat jurnal koreksi menggunakan addJurnal() dengan keterangan "Koreksi Saldo Awal"
3. WHEN periode sudah dikunci THEN Sistem Koperasi SHALL membaca flag periodeAktif dari localStorage dan menampilkan peringatan serta meminta konfirmasi administrator untuk membuka kunci
4. WHEN jurnal koreksi dibuat THEN Sistem Koperasi SHALL memanggil addJurnal() dengan parameter tanggal koreksi dan keterangan alasan koreksi yang dicatat ke array jurnal
5. WHEN koreksi disimpan THEN Sistem Koperasi SHALL memperbarui field saldo pada akun yang terpengaruh di array COA localStorage melalui mekanisme addJurnal() yang sudah ada

### Requirement 12

**User Story:** Sebagai administrator koperasi, saya ingin sistem dapat mengimpor saldo awal dari file Excel, sehingga proses input data lebih cepat dan efisien.

#### Acceptance Criteria

1. WHEN administrator memilih menu import saldo awal THEN Sistem Koperasi SHALL menampilkan tombol upload file Excel atau CSV
2. WHEN administrator mengupload file Excel atau CSV THEN Sistem Koperasi SHALL memvalidasi format file dan struktur kolom yang diperlukan (kode akun, nama akun, tipe, saldo)
3. WHEN file valid THEN Sistem Koperasi SHALL membaca data menggunakan FileReader API dan menampilkan preview data dalam bentuk tabel sebelum import
4. WHEN administrator konfirmasi import THEN Sistem Koperasi SHALL memproses setiap baris data dan memperbarui field saldo pada akun yang sesuai di array COA localStorage
5. WHEN administrator konfirmasi import THEN Sistem Koperasi SHALL mencatat jurnal pembuka menggunakan addJurnal() dengan entries dari semua akun yang diimport
6. WHEN import selesai THEN Sistem Koperasi SHALL menampilkan ringkasan jumlah data yang berhasil diimport dan yang gagal
7. WHEN terdapat error saat import THEN Sistem Koperasi SHALL menampilkan daftar baris yang error beserta alasan kegagalan (misalnya kode akun tidak ditemukan di COA)

### Requirement 13

**User Story:** Sebagai administrator koperasi, saya ingin sistem saldo awal terintegrasi penuh dengan COA dan jurnal yang sudah ada, sehingga semua transaksi tercatat dengan konsisten dan laporan keuangan akurat.

#### Acceptance Criteria

1. WHEN saldo awal periode disimpan THEN Sistem Koperasi SHALL menggunakan fungsi addJurnal() yang sudah ada di keuangan.js untuk mencatat semua jurnal pembuka
2. WHEN jurnal pembuka dicatat THEN Sistem Koperasi SHALL otomatis memperbarui field saldo pada setiap akun di array COA localStorage melalui mekanisme yang sudah ada di addJurnal()
3. WHEN administrator melihat menu Jurnal Harian THEN Sistem Koperasi SHALL menampilkan jurnal pembuka saldo awal bersama dengan jurnal transaksi lainnya dari array jurnal localStorage
4. WHEN administrator melihat Buku Besar THEN Sistem Koperasi SHALL menampilkan transaksi saldo awal sebagai baris pertama untuk setiap akun yang memiliki saldo awal
5. WHEN administrator melihat Laporan Laba Rugi THEN Sistem Koperasi SHALL menghitung pendapatan dan beban dengan memperhitungkan saldo awal dari COA
6. WHEN administrator melihat Laporan SHU THEN Sistem Koperasi SHALL menggunakan modal awal dari saldo awal periode yang tersimpan di localStorage
7. WHEN saldo awal periode diubah atau dikoreksi THEN Sistem Koperasi SHALL menggunakan addJurnal() untuk mencatat jurnal koreksi sehingga audit trail tetap terjaga

