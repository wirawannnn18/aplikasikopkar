# Requirements Document

## Introduction

Fitur ini memungkinkan admin untuk mengupload data simpanan pokok dan simpanan wajib secara massal melalui CSV pada menu pendaftaran saldo awal periode (Step 6). Data simpanan yang diupload akan otomatis terintegrasi dengan Chart of Accounts (COA) dan mempengaruhi perhitungan balance persamaan akuntansi. Fitur ini mempermudah input data simpanan dalam jumlah besar dan memastikan data simpanan tercatat dengan benar sebagai kewajiban koperasi.

## Glossary

- **Simpanan Pokok**: Setoran awal yang wajib dibayarkan oleh anggota koperasi saat pertama kali mendaftar, bersifat satu kali dan tidak dapat ditarik selama masih menjadi anggota
- **Simpanan Wajib**: Simpanan yang wajib dibayarkan oleh anggota secara berkala (biasanya bulanan) dengan jumlah yang telah ditentukan
- **Sistem**: Aplikasi manajemen koperasi berbasis web yang menyimpan data di localStorage browser
- **COA (Chart of Accounts)**: Daftar akun-akun keuangan yang digunakan dalam sistem akuntansi koperasi
- **Saldo Awal Periode**: Nilai awal untuk setiap akun pada awal periode akuntansi
- **Wizard**: Antarmuka multi-step untuk input data saldo awal periode
- **CSV**: Format file Comma-Separated Values untuk import data
- **Balance**: Kondisi dimana persamaan akuntansi terpenuhi (Aset = Kewajiban + Modal)
- **NIK**: Nomor Induk Kependudukan, identitas unik untuk setiap anggota

## Requirements

### Requirement 1

**User Story:** Sebagai admin koperasi, saya ingin mengupload data simpanan pokok secara massal melalui CSV pada Step 6 wizard saldo awal, sehingga saya dapat menginput data simpanan dalam jumlah besar dengan cepat.

#### Acceptance Criteria

1. WHEN admin berada di Step 6 wizard saldo awal THEN Sistem SHALL menampilkan tombol "Upload Simpanan Pokok CSV"
2. WHEN admin mengklik tombol upload simpanan pokok THEN Sistem SHALL menampilkan dialog upload dengan opsi file dan paste data
3. WHEN admin mengupload file CSV simpanan pokok yang valid THEN Sistem SHALL memparse data dan menampilkan preview data yang akan diimport
4. WHEN admin mengkonfirmasi import simpanan pokok THEN Sistem SHALL menyimpan data ke wizardState.data.simpananAnggota dengan field simpananPokok terisi
5. WHEN data simpanan pokok berhasil diimport THEN Sistem SHALL memperbarui tampilan tabel simpanan dan total simpanan pokok

### Requirement 2

**User Story:** Sebagai admin koperasi, saya ingin mengupload data simpanan wajib secara massal melalui CSV pada Step 6 wizard saldo awal, sehingga saya dapat menginput data simpanan wajib untuk semua anggota dengan efisien.

#### Acceptance Criteria

1. WHEN admin berada di Step 6 wizard saldo awal THEN Sistem SHALL menampilkan tombol "Upload Simpanan Wajib CSV"
2. WHEN admin mengklik tombol upload simpanan wajib THEN Sistem SHALL menampilkan dialog upload dengan opsi file dan paste data
3. WHEN admin mengupload file CSV simpanan wajib yang valid THEN Sistem SHALL memparse data dan menampilkan preview data yang akan diimport
4. WHEN admin mengkonfirmasi import simpanan wajib THEN Sistem SHALL menyimpan data ke wizardState.data.simpananAnggota dengan field simpananWajib terisi
5. WHEN data simpanan wajib berhasil diimport THEN Sistem SHALL memperbarui tampilan tabel simpanan dan total simpanan wajib

### Requirement 3

**User Story:** Sebagai admin koperasi, saya ingin sistem memvalidasi data CSV simpanan sebelum import, sehingga saya dapat memastikan data yang diupload valid dan sesuai format.

#### Acceptance Criteria

1. WHEN admin mengupload file CSV simpanan THEN Sistem SHALL memvalidasi format file adalah CSV dengan delimiter koma atau semicolon
2. WHEN sistem memparse CSV simpanan THEN Sistem SHALL memvalidasi bahwa header kolom sesuai dengan format yang ditentukan
3. WHEN sistem memvalidasi data simpanan THEN Sistem SHALL memastikan NIK anggota yang diupload ada dalam data anggota
4. WHEN sistem memvalidasi data simpanan THEN Sistem SHALL memastikan jumlah simpanan adalah angka positif atau nol
5. WHEN data CSV tidak valid THEN Sistem SHALL menampilkan pesan error yang spesifik menjelaskan baris dan kolom yang bermasalah

### Requirement 4

**User Story:** Sebagai admin koperasi, saya ingin data simpanan yang diupload otomatis terintegrasi dengan COA, sehingga perhitungan balance persamaan akuntansi akurat.

#### Acceptance Criteria

1. WHEN data simpanan pokok diimport THEN Sistem SHALL menambahkan nilai ke akun Simpanan Pokok (2-1100) di COA
2. WHEN data simpanan wajib diimport THEN Sistem SHALL menambahkan nilai ke akun Simpanan Wajib (2-1200) di COA
3. WHEN wizard mencapai Step 7 THEN Sistem SHALL menghitung total kewajiban termasuk simpanan pokok dan simpanan wajib
4. WHEN sistem menghitung balance THEN Sistem SHALL memastikan total simpanan dari upload sama dengan total di COA
5. WHEN admin menyimpan saldo awal THEN Sistem SHALL membuat jurnal pembuka yang mencatat simpanan sebagai kewajiban

### Requirement 5

**User Story:** Sebagai admin koperasi, saya ingin dapat menggabungkan data simpanan dari upload CSV dengan input manual, sehingga saya memiliki fleksibilitas dalam menginput data.

#### Acceptance Criteria

1. WHEN admin mengupload CSV simpanan pokok THEN Sistem SHALL menggabungkan data upload dengan data manual yang sudah ada
2. WHEN terdapat duplikasi NIK dalam upload THEN Sistem SHALL menimpa data lama dengan data baru dari upload
3. WHEN admin mengedit data simpanan setelah upload THEN Sistem SHALL memperbarui nilai di wizardState tanpa menghapus data lain
4. WHEN admin menghapus baris simpanan THEN Sistem SHALL menghapus data dari wizardState dan memperbarui total
5. WHEN admin melakukan upload kedua kalinya THEN Sistem SHALL memberikan opsi untuk replace semua data atau merge dengan data existing

### Requirement 6

**User Story:** Sebagai admin koperasi, saya ingin melihat preview data sebelum import, sehingga saya dapat memverifikasi data sebelum disimpan ke sistem.

#### Acceptance Criteria

1. WHEN sistem selesai memparse CSV THEN Sistem SHALL menampilkan tabel preview dengan semua data yang akan diimport
2. WHEN preview ditampilkan THEN Sistem SHALL menampilkan jumlah total record yang akan diimport
3. WHEN preview ditampilkan THEN Sistem SHALL menampilkan total nilai simpanan yang akan diimport
4. WHEN terdapat error dalam data THEN Sistem SHALL menandai baris yang bermasalah dengan warna merah dan pesan error
5. WHEN admin membatalkan import THEN Sistem SHALL menutup dialog preview tanpa menyimpan data

### Requirement 7

**User Story:** Sebagai admin koperasi, saya ingin sistem menyediakan template CSV yang benar, sehingga saya dapat membuat file upload dengan format yang sesuai.

#### Acceptance Criteria

1. WHEN admin mengklik tombol upload simpanan THEN Sistem SHALL menampilkan link download template CSV
2. WHEN admin mengklik download template simpanan pokok THEN Sistem SHALL mengunduh file CSV dengan header: NIK,Nama,Jumlah,Tanggal
3. WHEN admin mengklik download template simpanan wajib THEN Sistem SHALL mengunduh file CSV dengan header: NIK,Nama,Jumlah,Periode,Tanggal
4. WHEN template diunduh THEN Sistem SHALL menyertakan contoh data di baris pertama sebagai panduan
5. WHEN dialog upload ditampilkan THEN Sistem SHALL menampilkan instruksi format CSV yang jelas

### Requirement 8

**User Story:** Sebagai admin koperasi, saya ingin sistem menangani berbagai format CSV, sehingga saya dapat mengupload file dari berbagai sumber.

#### Acceptance Criteria

1. WHEN sistem memparse CSV THEN Sistem SHALL mendukung delimiter koma dan semicolon
2. WHEN sistem memparse CSV THEN Sistem SHALL menangani file dengan atau tanpa BOM (Byte Order Mark)
3. WHEN sistem memparse CSV THEN Sistem SHALL menangani line ending Windows (CRLF) dan Unix (LF)
4. WHEN sistem memparse CSV THEN Sistem SHALL trim whitespace dari setiap field
5. WHEN sistem memparse CSV THEN Sistem SHALL mengabaikan baris kosong dalam file CSV

### Requirement 9

**User Story:** Sebagai admin koperasi, saya ingin sistem memberikan feedback yang jelas setelah import, sehingga saya tahu hasil dari proses upload.

#### Acceptance Criteria

1. WHEN import berhasil THEN Sistem SHALL menampilkan notifikasi sukses dengan jumlah record yang berhasil diimport
2. WHEN import berhasil THEN Sistem SHALL menampilkan total nilai simpanan yang berhasil diimport
3. WHEN import gagal THEN Sistem SHALL menampilkan pesan error yang menjelaskan penyebab kegagalan
4. WHEN import sebagian berhasil THEN Sistem SHALL menampilkan jumlah record yang berhasil dan yang gagal
5. WHEN import selesai THEN Sistem SHALL menutup dialog upload dan memperbarui tampilan Step 6

### Requirement 10

**User Story:** Sebagai admin koperasi, saya ingin dapat mengupload data simpanan dari clipboard (paste), sehingga saya dapat copy-paste langsung dari Excel atau Google Sheets.

#### Acceptance Criteria

1. WHEN dialog upload ditampilkan THEN Sistem SHALL menyediakan textarea untuk paste data CSV
2. WHEN admin paste data dari Excel THEN Sistem SHALL memparse data dengan delimiter tab
3. WHEN admin paste data dari CSV THEN Sistem SHALL memparse data dengan delimiter koma atau semicolon
4. WHEN admin paste data yang valid THEN Sistem SHALL menampilkan preview data yang sama seperti upload file
5. WHEN admin mengkonfirmasi paste data THEN Sistem SHALL memproses data dengan cara yang sama seperti upload file
