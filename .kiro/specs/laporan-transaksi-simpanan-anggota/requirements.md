# Requirements Document

## Introduction

Fitur ini akan menambahkan menu baru yang menampilkan laporan lengkap transaksi dan simpanan per anggota. Menu ini akan memberikan visibilitas penuh terhadap aktivitas keuangan setiap anggota, termasuk transaksi POS (cash dan bon) serta status simpanan (pokok, wajib, dan sukarela).

## Glossary

- **System**: Aplikasi Koperasi
- **Anggota**: Member koperasi yang terdaftar dalam sistem
- **Transaksi POS**: Transaksi pembelian barang melalui Point of Sales
- **Transaksi Cash**: Transaksi yang dibayar tunai
- **Transaksi Bon**: Transaksi kredit yang belum dibayar
- **Simpanan Pokok**: Simpanan wajib satu kali saat pendaftaran anggota
- **Simpanan Wajib**: Simpanan rutin per periode (bulanan)
- **Simpanan Sukarela**: Simpanan tambahan yang bersifat opsional
- **Saldo Simpanan**: Total akumulasi simpanan anggota
- **Outstanding Balance**: Total tagihan bon yang belum dibayar

## Requirements

### Requirement 1

**User Story:** Sebagai admin atau kasir, saya ingin melihat daftar semua anggota dengan ringkasan transaksi dan simpanan mereka, sehingga saya dapat memantau aktivitas keuangan setiap anggota dengan mudah.

#### Acceptance Criteria

1. WHEN pengguna membuka menu laporan transaksi simpanan anggota THEN THE System SHALL menampilkan daftar semua anggota aktif dengan ringkasan transaksi dan simpanan
2. WHEN menampilkan daftar anggota THEN THE System SHALL menampilkan NIK, nama, departemen, total transaksi, total simpanan, dan outstanding balance untuk setiap anggota
3. WHEN anggota memiliki statusKeanggotaan 'Keluar' THEN THE System SHALL mengecualikan anggota tersebut dari daftar
4. WHEN tidak ada data anggota THEN THE System SHALL menampilkan pesan bahwa belum ada data anggota
5. WHEN data ditampilkan THEN THE System SHALL menghitung total keseluruhan transaksi, simpanan, dan outstanding balance

### Requirement 2

**User Story:** Sebagai pengguna, saya ingin dapat mencari dan memfilter anggota berdasarkan kriteria tertentu, sehingga saya dapat menemukan informasi anggota dengan cepat.

#### Acceptance Criteria

1. WHEN pengguna mengetik di kolom pencarian THEN THE System SHALL memfilter daftar anggota berdasarkan NIK, nama, atau nomor kartu
2. WHEN pengguna memilih filter departemen THEN THE System SHALL menampilkan hanya anggota dari departemen yang dipilih
3. WHEN pengguna memilih filter tipe anggota THEN THE System SHALL menampilkan hanya anggota dengan tipe yang dipilih
4. WHEN pengguna mengklik tombol reset filter THEN THE System SHALL mengembalikan tampilan ke semua anggota tanpa filter
5. WHEN filter diterapkan THEN THE System SHALL menampilkan jumlah anggota yang ditampilkan dari total anggota

### Requirement 3

**User Story:** Sebagai pengguna, saya ingin melihat detail transaksi POS dari anggota tertentu, sehingga saya dapat mengetahui riwayat pembelian anggota tersebut.

#### Acceptance Criteria

1. WHEN pengguna mengklik tombol detail transaksi pada anggota THEN THE System SHALL menampilkan modal dengan daftar semua transaksi POS anggota tersebut
2. WHEN menampilkan detail transaksi THEN THE System SHALL menampilkan nomor transaksi, tanggal, kasir, metode pembayaran, total, dan status untuk setiap transaksi
3. WHEN menampilkan detail transaksi THEN THE System SHALL memisahkan transaksi cash dan transaksi bon
4. WHEN menampilkan detail transaksi THEN THE System SHALL menampilkan total transaksi cash dan total transaksi bon
5. WHEN tidak ada transaksi untuk anggota THEN THE System SHALL menampilkan pesan bahwa belum ada transaksi

### Requirement 4

**User Story:** Sebagai pengguna, saya ingin melihat detail simpanan dari anggota tertentu, sehingga saya dapat mengetahui status simpanan pokok, wajib, dan sukarela anggota tersebut.

#### Acceptance Criteria

1. WHEN pengguna mengklik tombol detail simpanan pada anggota THEN THE System SHALL menampilkan modal dengan ringkasan dan detail simpanan anggota
2. WHEN menampilkan detail simpanan THEN THE System SHALL menampilkan total simpanan pokok, simpanan wajib, dan simpanan sukarela
3. WHEN menampilkan detail simpanan pokok THEN THE System SHALL menampilkan jumlah dan tanggal untuk setiap transaksi simpanan pokok
4. WHEN menampilkan detail simpanan wajib THEN THE System SHALL menampilkan jumlah, periode, dan tanggal untuk setiap transaksi simpanan wajib
5. WHEN menampilkan detail simpanan sukarela THEN THE System SHALL menampilkan jumlah dan tanggal untuk setiap transaksi simpanan sukarela
6. WHEN tidak ada simpanan untuk anggota THEN THE System SHALL menampilkan nilai nol untuk setiap jenis simpanan

### Requirement 5

**User Story:** Sebagai pengguna, saya ingin dapat mengekspor data laporan ke format CSV, sehingga saya dapat menganalisis data lebih lanjut menggunakan aplikasi spreadsheet.

#### Acceptance Criteria

1. WHEN pengguna mengklik tombol ekspor CSV THEN THE System SHALL menghasilkan file CSV dengan data semua anggota yang ditampilkan
2. WHEN mengekspor data THEN THE System SHALL menyertakan kolom NIK, Nama, Departemen, Tipe Anggota, Total Transaksi Cash, Total Transaksi Bon, Total Simpanan Pokok, Total Simpanan Wajib, Total Simpanan Sukarela, dan Outstanding Balance
3. WHEN file CSV dihasilkan THEN THE System SHALL menggunakan format yang kompatibel dengan Excel dan Google Sheets
4. WHEN ekspor berhasil THEN THE System SHALL mendownload file dengan nama yang mencantumkan tanggal ekspor
5. WHEN tidak ada data untuk diekspor THEN THE System SHALL menampilkan pesan peringatan

### Requirement 6

**User Story:** Sebagai pengguna, saya ingin dapat mencetak laporan, sehingga saya dapat memiliki salinan fisik untuk dokumentasi atau presentasi.

#### Acceptance Criteria

1. WHEN pengguna mengklik tombol cetak THEN THE System SHALL membuka dialog cetak browser
2. WHEN mencetak laporan THEN THE System SHALL memformat tampilan untuk media cetak dengan layout yang rapi
3. WHEN mencetak laporan THEN THE System SHALL menyertakan header dengan nama koperasi dan tanggal cetak
4. WHEN mencetak laporan THEN THE System SHALL menyertakan semua data anggota yang sedang ditampilkan
5. WHEN mencetak laporan THEN THE System SHALL menyertakan total keseluruhan di bagian bawah

### Requirement 7

**User Story:** Sebagai pengguna, saya ingin melihat statistik ringkasan di bagian atas halaman, sehingga saya dapat memahami gambaran umum aktivitas keuangan anggota dengan cepat.

#### Acceptance Criteria

1. WHEN halaman dimuat THEN THE System SHALL menampilkan card statistik dengan total anggota aktif
2. WHEN halaman dimuat THEN THE System SHALL menampilkan card statistik dengan total transaksi keseluruhan
3. WHEN halaman dimuat THEN THE System SHALL menampilkan card statistik dengan total simpanan keseluruhan
4. WHEN halaman dimuat THEN THE System SHALL menampilkan card statistik dengan total outstanding balance keseluruhan
5. WHEN filter diterapkan THEN THE System SHALL memperbarui statistik sesuai dengan data yang difilter

### Requirement 8

**User Story:** Sebagai pengguna, saya ingin dapat mengurutkan data anggota berdasarkan kolom tertentu, sehingga saya dapat melihat anggota dengan transaksi atau simpanan terbesar/terkecil.

#### Acceptance Criteria

1. WHEN pengguna mengklik header kolom yang dapat diurutkan THEN THE System SHALL mengurutkan data berdasarkan kolom tersebut secara ascending
2. WHEN pengguna mengklik header kolom yang sama lagi THEN THE System SHALL mengurutkan data secara descending
3. WHEN data diurutkan THEN THE System SHALL menampilkan indikator arah pengurutan pada header kolom
4. WHEN pengguna mengurutkan kolom numerik THEN THE System SHALL mengurutkan berdasarkan nilai numerik bukan string
5. WHEN pengguna mengurutkan kolom teks THEN THE System SHALL mengurutkan secara alfabetis

### Requirement 9

**User Story:** Sebagai pengguna dengan role tertentu, saya ingin akses ke menu ini dibatasi sesuai dengan hak akses saya, sehingga data keuangan anggota tetap aman.

#### Acceptance Criteria

1. WHEN pengguna dengan role admin mengakses menu THEN THE System SHALL menampilkan semua fitur dan data
2. WHEN pengguna dengan role kasir mengakses menu THEN THE System SHALL menampilkan semua fitur dan data
3. WHEN pengguna dengan role anggota mengakses menu THEN THE System SHALL hanya menampilkan data transaksi dan simpanan pengguna tersebut
4. WHEN pengguna tanpa hak akses mencoba mengakses menu THEN THE System SHALL menampilkan pesan akses ditolak
5. WHEN validasi hak akses gagal THEN THE System SHALL mengarahkan pengguna kembali ke halaman dashboard

### Requirement 10

**User Story:** Sebagai pengguna, saya ingin tampilan responsif yang dapat diakses dari berbagai perangkat, sehingga saya dapat melihat laporan dari desktop, tablet, atau smartphone.

#### Acceptance Criteria

1. WHEN halaman diakses dari desktop THEN THE System SHALL menampilkan tabel dengan semua kolom
2. WHEN halaman diakses dari tablet THEN THE System SHALL menyesuaikan layout dengan scroll horizontal untuk tabel
3. WHEN halaman diakses dari smartphone THEN THE System SHALL menampilkan data dalam format card yang dapat di-scroll
4. WHEN ukuran layar berubah THEN THE System SHALL menyesuaikan tampilan secara dinamis
5. WHEN tombol aksi ditampilkan THEN THE System SHALL memastikan tombol tetap dapat diakses di semua ukuran layar
