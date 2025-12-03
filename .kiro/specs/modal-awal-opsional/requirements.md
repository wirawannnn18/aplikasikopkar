# Requirements Document

## Introduction

Fitur ini memungkinkan administrator untuk mengosongkan atau mengatur modal awal koperasi menjadi 0 (nol) pada saat input saldo awal periode. Saat ini, sistem memaksa modal awal harus lebih besar dari 0, yang tidak sesuai dengan kebutuhan bisnis dimana koperasi mungkin ingin memulai dengan modal 0 atau mengosongkan modal awal yang sudah ada.

## Glossary

- **Sistem Koperasi**: Aplikasi manajemen koperasi berbasis web yang mengelola data keuangan, anggota, dan transaksi
- **Modal Awal**: Nilai modal koperasi pada awal periode akuntansi yang dicatat dalam akun Modal Koperasi (3-1000)
- **Wizard Saldo Awal**: Form multi-step untuk menginput saldo awal periode akuntansi
- **COA (Chart of Accounts)**: Daftar akun-akun dalam sistem akuntansi yang tersimpan di localStorage
- **Jurnal**: Catatan transaksi akuntansi dengan sistem double-entry (debit dan kredit)

## Requirements

### Requirement 1

**User Story:** Sebagai administrator koperasi, saya ingin dapat mengosongkan atau mengatur modal awal menjadi 0, sehingga saya dapat memulai periode akuntansi tanpa modal awal atau mengoreksi modal awal yang salah.

#### Acceptance Criteria

1. WHEN administrator menginput nilai 0 untuk modal awal THEN Sistem Koperasi SHALL menerima nilai tersebut tanpa menampilkan error
2. WHEN administrator mengosongkan field modal awal THEN Sistem Koperasi SHALL memperlakukan nilai tersebut sebagai 0
3. WHEN modal awal bernilai 0 THEN Sistem Koperasi SHALL tetap mencatat jurnal dengan nilai 0 untuk debit Kas (1-1000) dan kredit Modal Koperasi (3-1000)
4. WHEN administrator menyimpan saldo awal dengan modal 0 THEN Sistem Koperasi SHALL memperbarui saldo akun Modal Koperasi (3-1000) menjadi 0 di COA
5. WHEN modal awal bernilai 0 THEN Sistem Koperasi SHALL menampilkan nilai 0 di laporan Laba Rugi dan laporan SHU

### Requirement 2

**User Story:** Sebagai administrator koperasi, saya ingin validasi modal awal hanya memastikan nilai adalah angka valid (tidak negatif), sehingga saya memiliki fleksibilitas dalam mengelola modal awal.

#### Acceptance Criteria

1. WHEN administrator menginput nilai negatif untuk modal awal THEN Sistem Koperasi SHALL menampilkan pesan error "Modal Koperasi tidak boleh negatif"
2. WHEN administrator menginput nilai non-numerik untuk modal awal THEN Sistem Koperasi SHALL menampilkan pesan error "Modal Koperasi harus berupa angka"
3. WHEN administrator menginput nilai 0 atau lebih besar untuk modal awal THEN Sistem Koperasi SHALL menerima nilai tersebut dan melanjutkan ke step berikutnya
4. WHEN field modal awal dikosongkan THEN Sistem Koperasi SHALL mengkonversi nilai kosong menjadi 0 tanpa menampilkan error

### Requirement 3

**User Story:** Sebagai administrator koperasi, saya ingin dapat mengubah modal awal dari nilai tertentu menjadi 0 saat mengedit saldo awal periode, sehingga saya dapat mengoreksi kesalahan input.

#### Acceptance Criteria

1. WHEN administrator mengedit saldo awal periode dan mengubah modal awal menjadi 0 THEN Sistem Koperasi SHALL membuat jurnal koreksi yang mengurangi modal awal ke 0
2. WHEN modal awal diubah dari nilai X menjadi 0 THEN Sistem Koperasi SHALL mencatat jurnal dengan debit Modal Koperasi (3-1000) sebesar X dan kredit Kas (1-1000) sebesar X
3. WHEN modal awal diubah menjadi 0 THEN Sistem Koperasi SHALL memperbarui saldo akun Modal Koperasi (3-1000) menjadi 0 di COA
4. WHEN modal awal diubah menjadi 0 THEN Sistem Koperasi SHALL menampilkan nilai 0 di laporan keuangan
