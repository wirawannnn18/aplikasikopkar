# Requirements Document

## Introduction

Sistem pembayaran hutang piutang saat ini tidak terintegrasi dengan laporan hutang anggota. Ketika anggota melakukan pembayaran hutang, saldo hutang di laporan tidak berkurang karena laporan hanya menghitung total transaksi kredit tanpa memperhitungkan pembayaran yang sudah dilakukan. Fitur ini akan mengintegrasikan data pembayaran hutang dengan laporan hutang anggota sehingga saldo hutang yang ditampilkan akurat dan real-time.

## Glossary

- **Sistem**: Aplikasi Manajemen Koperasi
- **Anggota**: Pengguna yang terdaftar dalam koperasi
- **Hutang Anggota**: Saldo yang harus dibayar anggota dari transaksi kredit POS
- **Pembayaran Hutang**: Transaksi pelunasan hutang oleh anggota
- **Laporan Hutang Piutang**: Tampilan daftar anggota dengan saldo hutang dan piutang mereka
- **Saldo Hutang**: Total hutang dikurangi total pembayaran yang sudah dilakukan

## Requirements

### Requirement 1

**User Story:** Sebagai admin, saya ingin melihat saldo hutang anggota yang akurat di laporan, sehingga saya dapat mengetahui hutang yang sebenarnya masih harus dibayar.

#### Acceptance Criteria

1. WHEN sistem menghitung saldo hutang anggota THEN sistem SHALL mengurangi total transaksi kredit dengan total pembayaran hutang yang sudah dilakukan
2. WHEN anggota melakukan pembayaran hutang THEN sistem SHALL memperbarui saldo hutang di laporan secara otomatis
3. WHEN laporan hutang piutang ditampilkan THEN sistem SHALL menampilkan saldo hutang yang sudah dikurangi pembayaran
4. WHEN saldo hutang anggota adalah nol THEN sistem SHALL menampilkan status "Lunas"
5. WHEN saldo hutang anggota lebih dari nol THEN sistem SHALL menampilkan status "Belum Lunas"

### Requirement 2

**User Story:** Sebagai kasir, saya ingin melihat riwayat pembayaran hutang anggota di laporan, sehingga saya dapat melacak pembayaran yang sudah dilakukan.

#### Acceptance Criteria

1. WHEN pengguna membuka detail anggota di laporan THEN sistem SHALL menampilkan daftar pembayaran hutang yang sudah dilakukan
2. WHEN sistem menampilkan riwayat pembayaran THEN sistem SHALL menampilkan tanggal, jumlah, dan kasir yang memproses
3. WHEN tidak ada pembayaran hutang THEN sistem SHALL menampilkan pesan "Belum ada pembayaran"

### Requirement 3

**User Story:** Sebagai admin, saya ingin melihat total pembayaran hutang per anggota, sehingga saya dapat memverifikasi perhitungan saldo hutang.

#### Acceptance Criteria

1. WHEN laporan hutang piutang ditampilkan THEN sistem SHALL menampilkan kolom total pembayaran hutang
2. WHEN sistem menghitung total pembayaran THEN sistem SHALL menjumlahkan semua transaksi pembayaran hutang dengan status "selesai"
3. WHEN anggota belum melakukan pembayaran THEN sistem SHALL menampilkan total pembayaran sebagai Rp 0

### Requirement 4

**User Story:** Sebagai admin, saya ingin export laporan hutang yang sudah terintegrasi dengan pembayaran, sehingga saya dapat menggunakan data untuk analisis eksternal.

#### Acceptance Criteria

1. WHEN pengguna mengunduh CSV laporan hutang THEN sistem SHALL menyertakan kolom total pembayaran hutang
2. WHEN pengguna mengunduh CSV laporan hutang THEN sistem SHALL menyertakan kolom saldo hutang yang sudah dikurangi pembayaran
3. WHEN CSV diunduh THEN sistem SHALL menggunakan format yang kompatibel dengan Excel

### Requirement 5

**User Story:** Sebagai developer, saya ingin fungsi perhitungan saldo hutang yang konsisten, sehingga tidak ada perbedaan perhitungan antara modul pembayaran dan laporan.

#### Acceptance Criteria

1. WHEN sistem menghitung saldo hutang THEN sistem SHALL menggunakan fungsi yang sama di semua modul
2. WHEN fungsi perhitungan dipanggil THEN sistem SHALL mengembalikan hasil yang konsisten untuk anggota yang sama
3. WHEN data pembayaran berubah THEN sistem SHALL memperbarui perhitungan saldo di semua modul yang menggunakannya
