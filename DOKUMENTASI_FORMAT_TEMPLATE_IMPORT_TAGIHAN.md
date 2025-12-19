# Dokumentasi Format Template Import Tagihan Pembayaran

## Overview

Dokumen ini menjelaskan secara detail format template yang digunakan untuk import tagihan pembayaran hutang piutang. Template ini harus diikuti dengan ketat untuk memastikan proses import berjalan lancar.

## Struktur File Template

### Format File yang Didukung
- **CSV (Comma Separated Values)** - Format utama dan direkomendasikan
- **Excel (.xlsx)** - Format alternatif yang didukung

### Encoding
- **CSV**: UTF-8 (untuk mendukung karakter Indonesia)
- **Excel**: Unicode (otomatis)

### Separator
- **CSV**: Koma (,) sebagai delimiter
- **Decimal**: Titik (.) untuk angka desimal (jika ada)

## Definisi Kolom

### 1. nomor_anggota
- **Tipe Data**: String/Text
- **Wajib**: Ya
- **Panjang Maksimal**: 20 karakter
- **Format**: Alphanumeric (huruf dan angka)
- **Contoh**: `001`, `A001`, `12345`, `NIK001`

**Validasi**:
- Tidak boleh kosong
- Harus ada di database anggota
- Case-sensitive
- Tidak boleh mengandung spasi di awal/akhir

**Contoh Valid**:
```
001
A001
12345
NIK001
```

**Contoh Invalid**:
```
(kosong)
 001 (ada spasi)
001A-B (karakter khusus)
```

### 2. nama_anggota
- **Tipe Data**: String/Text
- **Wajib**: Ya
- **Panjang Maksimal**: 100 karakter
- **Format**: Nama lengkap sesuai database
- **Contoh**: `Ahmad Suryadi`, `Siti Nurhaliza`

**Validasi**:
- Tidak boleh kosong
- Harus sesuai dengan nama di database (case-insensitive)
- Digunakan untuk validasi silang dengan nomor_anggota
- Karakter yang diizinkan: huruf, spasi, titik, koma, apostrof

**Contoh Valid**:
```
Ahmad Suryadi
Siti Nur'aini
Dr. Budi Santoso, M.Pd
```

**Contoh Invalid**:
```
(kosong)
Ahmad123 (mengandung angka)
@Ahmad (karakter khusus)
```

### 3. jenis_pembayaran
- **Tipe Data**: String/Text
- **Wajib**: Ya
- **Nilai yang Diizinkan**: `hutang` atau `piutang`
- **Format**: Huruf kecil semua
- **Contoh**: `hutang`, `piutang`

**Validasi**:
- Tidak boleh kosong
- Hanya menerima nilai `hutang` atau `piutang`
- Case-sensitive (harus huruf kecil)
- Tidak boleh ada spasi di awal/akhir

**Definisi**:
- **hutang**: Pembayaran cicilan pinjaman atau hutang anggota
- **piutang**: Pengembalian simpanan atau piutang koperasi ke anggota

**Contoh Valid**:
```
hutang
piutang
```

**Contoh Invalid**:
```
Hutang (huruf besar)
PIUTANG (huruf besar)
kredit (nilai tidak diizinkan)
debit (nilai tidak diizinkan)
(kosong)
```

### 4. jumlah_pembayaran
- **Tipe Data**: Numeric (Integer)
- **Wajib**: Ya
- **Format**: Angka bulat positif tanpa separator
- **Minimum**: 1
- **Maksimum**: Sesuai saldo hutang/piutang anggota
- **Contoh**: `500000`, `1000000`, `250000`

**Validasi**:
- Tidak boleh kosong
- Harus berupa angka positif (> 0)
- Tidak boleh mengandung separator (titik, koma, spasi)
- Tidak boleh mengandung mata uang (Rp, $, dll)
- Untuk hutang: tidak boleh melebihi saldo hutang anggota
- Untuk piutang: tidak boleh melebihi saldo piutang anggota

**Contoh Valid**:
```
500000
1000000
250000
75000
```

**Contoh Invalid**:
```
500.000 (ada titik)
500,000 (ada koma)
Rp 500000 (ada mata uang)
-500000 (negatif)
0 (nol)
(kosong)
```

### 5. keterangan
- **Tipe Data**: String/Text
- **Wajib**: Tidak
- **Panjang Maksimal**: 255 karakter
- **Format**: Teks bebas
- **Contoh**: `Cicilan bulan Januari`, `Pengembalian simpanan sukarela`

**Validasi**:
- Boleh kosong
- Maksimal 255 karakter
- Hindari karakter yang dapat merusak format CSV: koma, tanda kutip ganda
- Jika menggunakan koma dalam keterangan, bungkus dengan tanda kutip ganda

**Contoh Valid**:
```
Cicilan bulan Januari
Pengembalian simpanan sukarela
"Pembayaran cicilan, bulan Januari 2024"
(kosong)
```

**Contoh Invalid**:
```
Keterangan yang sangat panjang... (lebih dari 255 karakter)
```

## Template Header

Template harus dimulai dengan baris header yang berisi nama kolom:

```csv
nomor_anggota,nama_anggota,jenis_pembayaran,jumlah_pembayaran,keterangan
```

**Penting**:
- Nama kolom harus persis sama (case-sensitive)
- Urutan kolom harus sesuai
- Tidak boleh ada kolom tambahan di antara kolom wajib
- Boleh ada kolom tambahan di akhir (akan diabaikan)

## Contoh Template Lengkap

### Format CSV
```csv
nomor_anggota,nama_anggota,jenis_pembayaran,jumlah_pembayaran,keterangan
001,Ahmad Suryadi,hutang,500000,Cicilan pinjaman bulan Januari
002,Siti Nurhaliza,piutang,300000,Pengembalian simpanan sukarela
003,Budi Santoso,hutang,750000,Pelunasan sebagian pinjaman
004,Maya Sari,piutang,200000,Pencairan simpanan pokok
005,Andi Wijaya,hutang,1000000,"Pelunasan pinjaman, cicilan terakhir"
```

### Format Excel
| nomor_anggota | nama_anggota | jenis_pembayaran | jumlah_pembayaran | keterangan |
|---------------|--------------|------------------|-------------------|------------|
| 001 | Ahmad Suryadi | hutang | 500000 | Cicilan pinjaman bulan Januari |
| 002 | Siti Nurhaliza | piutang | 300000 | Pengembalian simpanan sukarela |
| 003 | Budi Santoso | hutang | 750000 | Pelunasan sebagian pinjaman |

## Validasi Data

### Validasi Level File
1. **Format file**: Harus CSV atau XLSX
2. **Ukuran file**: Maksimal 5MB
3. **Encoding**: UTF-8 untuk CSV
4. **Header**: Harus sesuai template

### Validasi Level Baris
1. **Kelengkapan**: Semua kolom wajib harus diisi
2. **Format data**: Sesuai tipe data yang ditentukan
3. **Referential integrity**: nomor_anggota dan nama_anggota harus cocok
4. **Business rules**: jumlah tidak melebihi saldo

### Validasi Level Bisnis
1. **Saldo anggota**: Jumlah pembayaran tidak melebihi saldo
2. **Status anggota**: Anggota harus aktif
3. **Jenis pembayaran**: Sesuai dengan saldo yang ada

## Error Handling

### Tipe Error dan Penanganan

#### 1. File Format Error
- **Error**: "File format tidak didukung"
- **Penyebab**: File bukan CSV atau XLSX
- **Solusi**: Konversi ke format yang didukung

#### 2. Structure Error
- **Error**: "Struktur kolom tidak sesuai template"
- **Penyebab**: Header tidak sesuai atau kolom hilang
- **Solusi**: Gunakan template terbaru

#### 3. Data Type Error
- **Error**: "Format data tidak valid pada baris X kolom Y"
- **Penyebab**: Tipe data tidak sesuai
- **Solusi**: Perbaiki format data sesuai spesifikasi

#### 4. Business Rule Error
- **Error**: "Jumlah pembayaran melebihi saldo pada baris X"
- **Penyebab**: Validasi bisnis gagal
- **Solusi**: Sesuaikan jumlah dengan saldo anggota

## Best Practices

### 1. Persiapan Data
- Selalu download template terbaru
- Validasi data di Excel sebelum save ke CSV
- Test dengan data kecil terlebih dahulu

### 2. Format CSV
- Gunakan UTF-8 encoding
- Pastikan tidak ada BOM (Byte Order Mark)
- Gunakan CRLF untuk line ending

### 3. Handling Special Characters
- Untuk keterangan yang mengandung koma, gunakan tanda kutip ganda
- Hindari karakter control (tab, newline) dalam data
- Escape tanda kutip ganda dengan double quote ("")

### 4. Data Validation
- Cek saldo anggota sebelum membuat file
- Pastikan semua anggota masih aktif
- Verifikasi jenis pembayaran sesuai kebutuhan

## Troubleshooting

### Masalah Umum dan Solusi

#### CSV tidak terbaca dengan benar
- Pastikan encoding UTF-8
- Cek separator (harus koma)
- Pastikan tidak ada karakter tersembunyi

#### Data terpotong atau bergeser
- Cek apakah ada koma dalam data yang tidak di-escape
- Pastikan tidak ada line break dalam cell
- Gunakan tanda kutip ganda untuk data yang mengandung separator

#### Error "Anggota tidak ditemukan"
- Cek penulisan nomor anggota (case-sensitive)
- Pastikan tidak ada spasi di awal/akhir
- Verifikasi anggota ada di database

## Changelog

### Version 1.0 (Initial)
- Definisi format template dasar
- Validasi data standar
- Error handling dasar

---

**Catatan**: Template ini dapat berubah sesuai kebutuhan sistem. Selalu gunakan template terbaru yang dapat didownload dari sistem.