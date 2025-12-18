# Requirements Document - Perbaikan Menu Tutup Kasir POS

## Introduction

Fitur tutup kasir di Point of Sales (POS) sudah ada namun tidak terlihat atau tidak dapat diakses oleh kasir setelah selesai melakukan penjualan. Fitur ini penting untuk proses penutupan shift kasir yang mencakup rekonsiliasi kas, pengembalian modal kasir, dan perhitungan uang cash yang ada di kasir.

## Glossary

- **POS**: Point of Sales - sistem kasir untuk transaksi penjualan
- **Tutup Kasir**: Proses penutupan shift kasir dengan rekonsiliasi kas
- **Modal Kasir**: Uang awal yang diberikan kepada kasir saat buka kas
- **Kas Aktual**: Jumlah uang fisik yang ada di kasir saat tutup kasir
- **Selisih Kas**: Perbedaan antara kas seharusnya dengan kas aktual
- **Shift**: Periode kerja kasir dari buka kas sampai tutup kas

## Requirements

### Requirement 1

**User Story:** Sebagai kasir, saya ingin melihat tombol tutup kasir di interface POS, sehingga saya dapat melakukan penutupan shift dengan mudah setelah selesai melayani penjualan.

#### Acceptance Criteria

1. WHEN kasir membuka POS dan sudah melakukan buka kas, THEN sistem SHALL menampilkan tombol "Tutup Kasir" yang terlihat jelas di header POS
2. WHEN kasir berada di mode fullscreen POS, THEN tombol "Tutup Kasir" SHALL tetap terlihat dan dapat diakses
3. WHEN kasir belum melakukan buka kas, THEN tombol "Tutup Kasir" SHALL tidak ditampilkan atau dalam status disabled
4. WHEN tombol "Tutup Kasir" diklik, THEN sistem SHALL membuka modal tutup kasir dengan informasi shift yang lengkap
5. WHEN kasir menggunakan keyboard shortcut, THEN sistem SHALL menyediakan akses cepat ke fungsi tutup kasir

### Requirement 2

**User Story:** Sebagai kasir, saya ingin melakukan proses tutup kasir yang mencakup rekonsiliasi kas dan pengembalian modal, sehingga saya dapat menyelesaikan shift dengan akurat dan tertib.

#### Acceptance Criteria

1. WHEN kasir membuka modal tutup kasir, THEN sistem SHALL menampilkan ringkasan penjualan dalam shift tersebut
2. WHEN kasir memasukkan kas aktual, THEN sistem SHALL menghitung selisih kas secara otomatis
3. WHEN terdapat selisih kas, THEN sistem SHALL meminta keterangan dari kasir
4. WHEN proses tutup kasir selesai, THEN sistem SHALL mencetak laporan tutup kasir
5. WHEN tutup kasir berhasil, THEN sistem SHALL mengembalikan modal kasir dan mencatat uang cash yang tersisa

### Requirement 3

**User Story:** Sebagai supervisor, saya ingin memastikan semua kasir dapat mengakses fitur tutup kasir dengan konsisten, sehingga tidak ada shift yang tertinggal tanpa penutupan yang proper.

#### Acceptance Criteria

1. WHEN supervisor memeriksa interface POS, THEN tombol tutup kasir SHALL selalu terlihat untuk kasir yang sudah buka kas
2. WHEN terjadi error pada proses tutup kasir, THEN sistem SHALL menampilkan pesan error yang jelas dan tidak merusak data
3. WHEN kasir logout tanpa tutup kasir, THEN sistem SHALL memberikan peringatan
4. WHEN supervisor mengakses riwayat tutup kasir, THEN sistem SHALL menampilkan semua data tutup kasir dengan lengkap
5. WHEN ada masalah teknis, THEN sistem SHALL menyediakan mekanisme recovery untuk tutup kasir

### Requirement 4

**User Story:** Sebagai admin sistem, saya ingin memastikan fitur tutup kasir terintegrasi dengan baik dengan sistem akuntansi, sehingga semua transaksi kas tercatat dengan benar.

#### Acceptance Criteria

1. WHEN kasir melakukan tutup kasir, THEN sistem SHALL membuat jurnal otomatis untuk selisih kas jika ada
2. WHEN tutup kasir selesai, THEN sistem SHALL memperbarui saldo kas di sistem akuntansi
3. WHEN ada selisih kas, THEN sistem SHALL mencatat ke akun yang sesuai (Pendapatan Lain-lain atau Beban Lain-lain)
4. WHEN laporan tutup kasir dicetak, THEN sistem SHALL menyimpan riwayat untuk audit trail
5. WHEN data tutup kasir disimpan, THEN sistem SHALL memastikan integritas data dan backup otomatis