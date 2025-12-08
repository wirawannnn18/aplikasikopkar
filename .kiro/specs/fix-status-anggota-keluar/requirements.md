# Requirements Document

## Introduction

Sistem saat ini memiliki bug di mana anggota yang sudah keluar dari koperasi masih menampilkan status "Aktif" di Master Anggota, padahal seharusnya statusnya "Tidak Aktif" (Nonaktif). Masalah ini terjadi karena ada inkonsistensi antara field `statusKeanggotaan` dan field `status` pada data anggota lama.

## Glossary

- **Master Anggota**: Halaman yang menampilkan daftar semua anggota koperasi
- **Status Anggota**: Field `status` yang menunjukkan status operasional anggota (Aktif, Nonaktif, Cuti)
- **Status Keanggotaan**: Field `statusKeanggotaan` yang menunjukkan apakah anggota masih terdaftar atau sudah keluar (legacy field)
- **Anggota Keluar**: Anggota yang telah mengundurkan diri dari koperasi
- **Data Migration**: Proses memperbaiki data lama agar konsisten dengan struktur data baru

## Requirements

### Requirement 1

**User Story:** Sebagai admin koperasi, saya ingin melihat status yang benar untuk anggota yang sudah keluar di Master Anggota, sehingga saya dapat dengan mudah membedakan anggota aktif dan tidak aktif.

#### Acceptance Criteria

1. WHEN sistem menampilkan Master Anggota THEN sistem SHALL menampilkan status "Nonaktif" untuk semua anggota yang memiliki `statusKeanggotaan = 'Keluar'`
2. WHEN sistem menampilkan Master Anggota THEN sistem SHALL menampilkan status "Nonaktif" untuk semua anggota yang memiliki field `tanggalKeluar` yang terisi
3. WHEN sistem menampilkan Master Anggota THEN sistem SHALL menampilkan status "Nonaktif" untuk semua anggota yang memiliki `pengembalianStatus` yang terisi
4. WHEN sistem memuat data anggota THEN sistem SHALL melakukan migrasi otomatis untuk memperbaiki inkonsistensi status
5. WHEN migrasi data dijalankan THEN sistem SHALL mengubah `status` menjadi "Nonaktif" untuk anggota dengan `statusKeanggotaan = 'Keluar'`

### Requirement 2

**User Story:** Sebagai developer, saya ingin memastikan data anggota konsisten, sehingga tidak ada lagi inkonsistensi antara field status yang berbeda.

#### Acceptance Criteria

1. WHEN anggota ditandai keluar THEN sistem SHALL memastikan field `status` diubah menjadi "Nonaktif"
2. WHEN anggota ditandai keluar THEN sistem SHALL menghapus field `statusKeanggotaan` untuk menghindari duplikasi
3. WHEN sistem membaca data anggota THEN sistem SHALL menggunakan field `status` sebagai sumber kebenaran tunggal
4. WHEN terdapat data lama dengan `statusKeanggotaan = 'Keluar'` THEN sistem SHALL otomatis memperbaiki field `status` menjadi "Nonaktif"
5. WHEN migrasi selesai THEN sistem SHALL mencatat jumlah data yang diperbaiki di console log

### Requirement 3

**User Story:** Sebagai admin koperasi, saya ingin filter status di Master Anggota berfungsi dengan benar, sehingga saya dapat menyaring anggota berdasarkan status aktual mereka.

#### Acceptance Criteria

1. WHEN admin memilih filter "Nonaktif" THEN sistem SHALL menampilkan semua anggota dengan `status = 'Nonaktif'` termasuk yang sudah keluar
2. WHEN admin memilih filter "Aktif" THEN sistem SHALL hanya menampilkan anggota dengan `status = 'Aktif'` dan tidak memiliki `tanggalKeluar`
3. WHEN admin memilih filter "Semua Status" THEN sistem SHALL menampilkan semua anggota dengan status yang sudah diperbaiki
4. WHEN sistem menghitung total anggota per status THEN sistem SHALL menggunakan field `status` yang sudah konsisten
5. WHEN sistem menampilkan badge status THEN sistem SHALL menampilkan warna yang sesuai (hijau untuk Aktif, abu-abu untuk Nonaktif, kuning untuk Cuti)
