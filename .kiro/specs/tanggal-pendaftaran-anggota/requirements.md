# Requirements Document

## Introduction

Fitur ini menambahkan kemampuan untuk mencatat tanggal pendaftaran pertama kali seorang anggota mendaftar ke dalam sistem koperasi. Tanggal pendaftaran akan mencakup informasi lengkap berupa tanggal, bulan, dan tahun pendaftaran. Informasi ini penting untuk keperluan administrasi, pelaporan, dan analisis keanggotaan koperasi.

## Glossary

- **Sistem**: Aplikasi manajemen koperasi berbasis web
- **Anggota**: Individu yang terdaftar dalam sistem koperasi dengan berbagai tipe keanggotaan (Anggota, Non-Anggota, atau Umum)
- **Tanggal Pendaftaran**: Tanggal lengkap (tanggal, bulan, tahun) ketika anggota pertama kali didaftarkan ke dalam sistem
- **Master Anggota**: Modul dalam sistem yang mengelola data anggota koperasi
- **Form Anggota**: Antarmuka input untuk menambah atau mengubah data anggota

## Requirements

### Requirement 1

**User Story:** Sebagai admin koperasi, saya ingin mencatat tanggal pendaftaran anggota ketika mendaftarkan anggota baru, sehingga saya dapat melacak kapan anggota tersebut bergabung dengan koperasi.

#### Acceptance Criteria

1. WHEN admin membuat anggota baru THEN THE Sistem SHALL menyimpan tanggal pendaftaran secara otomatis dengan tanggal saat ini
2. WHEN admin menyimpan data anggota baru THEN THE Sistem SHALL menyimpan tanggal pendaftaran dalam format ISO 8601 (YYYY-MM-DD)
3. WHEN anggota baru dibuat THEN THE Sistem SHALL memastikan tanggal pendaftaran tidak dapat kosong
4. WHEN admin mengedit data anggota yang sudah ada THEN THE Sistem SHALL mempertahankan tanggal pendaftaran asli tanpa perubahan

### Requirement 2

**User Story:** Sebagai admin koperasi, saya ingin melihat tanggal pendaftaran anggota di form dan detail anggota, sehingga saya dapat mengetahui kapan anggota tersebut terdaftar.

#### Acceptance Criteria

1. WHEN admin membuka form tambah anggota baru THEN THE Sistem SHALL menampilkan field tanggal pendaftaran dengan nilai default tanggal hari ini
2. WHEN admin membuka form edit anggota THEN THE Sistem SHALL menampilkan tanggal pendaftaran yang sudah tersimpan dalam format yang mudah dibaca (DD/MM/YYYY)
3. WHEN admin melihat detail anggota THEN THE Sistem SHALL menampilkan tanggal pendaftaran dalam format yang mudah dibaca (DD/MM/YYYY)
4. WHEN admin membuka form edit anggota THEN THE Sistem SHALL membuat field tanggal pendaftaran dalam mode read-only untuk mencegah perubahan tidak sengaja

### Requirement 3

**User Story:** Sebagai admin koperasi, saya ingin melihat tanggal pendaftaran di tabel daftar anggota, sehingga saya dapat dengan cepat melihat informasi pendaftaran tanpa harus membuka detail.

#### Acceptance Criteria

1. WHEN admin membuka halaman Master Anggota THEN THE Sistem SHALL menampilkan kolom tanggal pendaftaran di tabel daftar anggota
2. WHEN tabel anggota ditampilkan THEN THE Sistem SHALL menampilkan tanggal pendaftaran dalam format DD/MM/YYYY
3. WHEN tabel anggota kosong THEN THE Sistem SHALL tetap menampilkan header kolom tanggal pendaftaran

### Requirement 4

**User Story:** Sebagai admin koperasi, saya ingin data anggota lama yang belum memiliki tanggal pendaftaran dapat ditangani dengan baik, sehingga sistem tetap berfungsi normal untuk data legacy.

#### Acceptance Criteria

1. WHEN sistem menampilkan anggota tanpa tanggal pendaftaran THEN THE Sistem SHALL menampilkan teks placeholder "-" atau "Tidak tercatat"
2. WHEN admin mengedit anggota lama tanpa tanggal pendaftaran THEN THE Sistem SHALL mengisi tanggal pendaftaran dengan tanggal saat ini sebagai default
3. WHEN sistem memproses data anggota THEN THE Sistem SHALL tetap berfungsi normal meskipun tanggal pendaftaran kosong atau tidak ada

### Requirement 5

**User Story:** Sebagai admin koperasi, saya ingin fitur import/export anggota mendukung tanggal pendaftaran, sehingga saya dapat memigrasikan data dengan lengkap.

#### Acceptance Criteria

1. WHEN admin mengimport data anggota dengan kolom tanggal pendaftaran THEN THE Sistem SHALL membaca dan menyimpan tanggal pendaftaran dari file CSV
2. WHEN admin mengimport data anggota tanpa kolom tanggal pendaftaran THEN THE Sistem SHALL menggunakan tanggal import sebagai tanggal pendaftaran default
3. WHEN admin mengexport data anggota THEN THE Sistem SHALL menyertakan kolom tanggal pendaftaran dalam format DD/MM/YYYY
4. WHEN admin mendownload template import THEN THE Sistem SHALL menyertakan kolom tanggal pendaftaran dengan contoh format yang benar
5. WHEN sistem memvalidasi data import THEN THE Sistem SHALL menerima format tanggal DD/MM/YYYY, YYYY-MM-DD, atau DD-MM-YYYY

### Requirement 6

**User Story:** Sebagai admin koperasi, saya ingin dapat memfilter dan mengurutkan anggota berdasarkan tanggal pendaftaran, sehingga saya dapat menganalisis pola pendaftaran anggota.

#### Acceptance Criteria

1. WHEN admin menggunakan fitur filter THEN THE Sistem SHALL menyediakan opsi filter berdasarkan rentang tanggal pendaftaran
2. WHEN admin mengklik header kolom tanggal pendaftaran THEN THE Sistem SHALL mengurutkan data anggota berdasarkan tanggal pendaftaran secara ascending atau descending
3. WHEN filter tanggal diterapkan THEN THE Sistem SHALL menampilkan hanya anggota yang terdaftar dalam rentang tanggal yang dipilih
