# Requirements Document

## Introduction

Fitur ini bertujuan untuk menghapus menu "Backup & Restore" dari sidebar navigasi untuk menghindari duplikasi fungsi dengan fitur backup & restore yang sudah tersedia di halaman "Pengaturan Sistem". Saat ini, terdapat dua akses ke fungsi backup & restore yang membingungkan pengguna dan tidak konsisten dengan struktur navigasi aplikasi.

## Glossary

- **Sidebar**: Menu navigasi vertikal di sisi kiri aplikasi yang menampilkan daftar menu utama
- **Pengaturan Sistem**: Halaman khusus Super Admin yang berisi konfigurasi sistem termasuk fitur backup & restore
- **Menu Item**: Item individual dalam sidebar yang dapat diklik untuk navigasi
- **renderMenu**: Fungsi JavaScript yang menghasilkan daftar menu berdasarkan role pengguna
- **renderPage**: Fungsi JavaScript yang menampilkan konten halaman berdasarkan menu yang dipilih
- **backup-restore page**: Halaman yang menampilkan antarmuka backup & restore database

## Requirements

### Requirement 1

**User Story:** Sebagai administrator atau super admin, saya ingin mengakses fitur backup & restore hanya melalui Pengaturan Sistem, sehingga tidak ada kebingungan dengan menu duplikat

#### Acceptance Criteria

1. WHEN sistem menampilkan sidebar untuk role super_admin THEN sistem SHALL NOT menampilkan menu item "Backup & Restore"
2. WHEN sistem menampilkan sidebar untuk role administrator THEN sistem SHALL NOT menampilkan menu item "Backup & Restore"
3. WHEN pengguna mengakses halaman Pengaturan Sistem THEN sistem SHALL menampilkan tombol akses ke fitur backup & restore
4. WHEN pengguna mencoba mengakses route 'backup-restore' secara langsung THEN sistem SHALL redirect ke halaman Pengaturan Sistem
5. WHEN menu sidebar di-render THEN sistem SHALL tidak menyertakan entry dengan page 'backup-restore' untuk semua role

### Requirement 2

**User Story:** Sebagai developer, saya ingin kode yang bersih tanpa referensi ke menu backup-restore yang sudah dihapus, sehingga kode lebih mudah dipelihara

#### Acceptance Criteria

1. WHEN file auth.js dibaca THEN file SHALL NOT berisi menu item dengan page 'backup-restore' dalam array menus
2. WHEN fungsi renderPage dipanggil dengan parameter 'backup-restore' THEN fungsi SHALL redirect ke 'system-settings'
3. WHEN file index.html dibaca THEN file SHALL tetap memuat script backup.js untuk fungsi backup yang digunakan di Pengaturan Sistem
4. WHEN fungsi renderBackupRestore dipanggil THEN fungsi SHALL tetap tersedia untuk digunakan dari halaman Pengaturan Sistem

### Requirement 3

**User Story:** Sebagai pengguna, saya ingin transisi yang mulus dari menu lama ke struktur baru, sehingga tidak ada gangguan dalam penggunaan aplikasi

#### Acceptance Criteria

1. WHEN pengguna yang terbiasa mengklik menu "Backup & Restore" mencari fitur tersebut THEN pengguna SHALL menemukan fitur di halaman Pengaturan Sistem dengan jelas
2. WHEN halaman Pengaturan Sistem ditampilkan THEN sistem SHALL menampilkan tombol "Backup & Restore" yang menonjol
3. WHEN tombol "Backup & Restore" di Pengaturan Sistem diklik THEN sistem SHALL menampilkan antarmuka backup & restore lengkap
4. WHEN sistem di-upgrade THEN semua fungsi backup & restore SHALL tetap berfungsi normal
