# Panduan Pengguna - Import Tagihan Pembayaran Hutang Piutang

## Daftar Isi
1. [Pengenalan](#pengenalan)
2. [Persiapan File Import](#persiapan-file-import)
3. [Proses Import](#proses-import)
4. [Mengatasi Error](#mengatasi-error)
5. [Tips dan Best Practices](#tips-dan-best-practices)

## Pengenalan

Fitur Import Tagihan Pembayaran memungkinkan Anda memproses pembayaran hutang dan piutang dari banyak anggota sekaligus melalui file CSV atau Excel. Fitur ini sangat berguna untuk:

- Pembayaran cicilan bulanan dalam jumlah besar
- Pengembalian simpanan massal
- Pelunasan hutang kolektif
- Pembayaran rutin lainnya

### Siapa yang Dapat Menggunakan
- **Kasir**: Dapat melakukan import dan memproses pembayaran
- **Admin**: Dapat mengakses semua fitur termasuk konfigurasi sistem

## Persiapan File Import

### 1. Download Template

Sebelum membuat file import, selalu download template terbaru:

1. Buka menu **Import Tagihan Pembayaran**
2. Klik tombol **Download Template**
3. File template akan terdownload dengan nama `template_import_tagihan_[timestamp].csv`

### 2. Format File yang Didukung

- **CSV** (Comma Separated Values) - Direkomendasikan
- **Excel** (.xlsx) - Didukung

### 3. Struktur Template

Template berisi kolom-kolom berikut:

| Kolom | Deskripsi | Wajib | Contoh |
|-------|-----------|-------|--------|
| `nomor_anggota` | Nomor anggota/NIK | Ya | 001 |
| `nama_anggota` | Nama lengkap anggota | Ya | John Doe |
| `jenis_pembayaran` | Jenis pembayaran (hutang/piutang) | Ya | hutang |
| `jumlah_pembayaran` | Jumlah yang dibayar | Ya | 500000 |
| `keterangan` | Catatan tambahan | Tidak | Cicilan bulan Januari |

### 4. Aturan Pengisian Data

#### Nomor Anggota
- Harus sesuai dengan data anggota yang terdaftar di sistem
- Tidak boleh kosong
- Format: angka atau kombinasi huruf-angka

#### Nama Anggota
- Harus sesuai dengan nama di database
- Digunakan untuk validasi silang dengan nomor anggota
- Tidak boleh kosong

#### Jenis Pembayaran
- Hanya boleh diisi: `hutang` atau `piutang`
- Huruf kecil semua
- Tidak boleh kosong

#### Jumlah Pembayaran
- Harus berupa angka positif
- Tidak boleh 0 atau negatif
- Tidak boleh melebihi saldo hutang/piutang anggota
- Format: angka tanpa titik atau koma (contoh: 500000)

#### Keterangan
- Opsional, boleh dikosongkan
- Maksimal 255 karakter
- Hindari karakter khusus yang dapat merusak format CSV

### 5. Contoh Data Valid

```csv
nomor_anggota,nama_anggota,jenis_pembayaran,jumlah_pembayaran,keterangan
001,Ahmad Suryadi,hutang,500000,Cicilan pinjaman bulan Januari
002,Siti Nurhaliza,piutang,300000,Pengembalian simpanan sukarela
003,Budi Santoso,hutang,750000,Pelunasan sebagian pinjaman
004,Maya Sari,piutang,200000,Pencairan simpanan pokok
```

## Proses Import

### Langkah 1: Upload File

1. Buka menu **Import Tagihan Pembayaran**
2. Klik area **"Drag & Drop file di sini atau klik untuk memilih"**
3. Pilih file CSV/Excel yang sudah disiapkan
4. Tunggu proses upload dan validasi awal

### Langkah 2: Validasi Data

Sistem akan melakukan validasi otomatis:

- ✅ **Format file**: Memastikan file adalah CSV atau Excel
- ✅ **Struktur kolom**: Memastikan semua kolom wajib ada
- ✅ **Ukuran file**: Maksimal 5MB
- ✅ **Data anggota**: Memvalidasi nomor dan nama anggota
- ✅ **Jenis pembayaran**: Memastikan hanya hutang/piutang
- ✅ **Jumlah pembayaran**: Memvalidasi format dan batas saldo

### Langkah 3: Preview Data

Setelah validasi, sistem menampilkan preview:

- **Tabel data**: Menampilkan semua baris dengan status validasi
- **Summary**: Total transaksi, jumlah valid/invalid, total amount
- **Error details**: Detail error untuk setiap baris yang bermasalah

#### Status Validasi
- 🟢 **Valid**: Data siap diproses
- 🔴 **Error**: Ada masalah yang harus diperbaiki
- ⚠️ **Warning**: Ada catatan tapi masih bisa diproses

### Langkah 4: Konfirmasi dan Proses

1. Review preview data dengan teliti
2. Jika ada error, perbaiki file dan upload ulang
3. Jika semua data valid, klik **"Proses Pembayaran"**
4. Konfirmasi dengan klik **"Ya, Proses Sekarang"**

### Langkah 5: Monitoring Progress

- Progress bar menunjukkan kemajuan pemrosesan
- Tombol **"Cancel"** tersedia untuk membatalkan proses
- Jangan tutup browser selama proses berlangsung

### Langkah 6: Review Hasil

Setelah selesai, sistem menampilkan:

- **Summary hasil**: Jumlah berhasil/gagal
- **Detail transaksi berhasil**: Dengan nomor transaksi
- **Detail transaksi gagal**: Dengan alasan kegagalan
- **Tombol download laporan**: Untuk menyimpan hasil

## Mengatasi Error

### Error Umum dan Solusi

#### 1. "File format tidak didukung"
**Penyebab**: File bukan CSV atau Excel
**Solusi**: 
- Pastikan file berekstensi .csv atau .xlsx
- Jika dari Excel, save as CSV atau XLSX

#### 2. "Ukuran file melebihi batas maksimum"
**Penyebab**: File lebih dari 5MB
**Solusi**:
- Bagi file menjadi beberapa batch kecil
- Hapus kolom yang tidak perlu
- Kompres file Excel jika memungkinkan

#### 3. "Struktur kolom tidak sesuai template"
**Penyebab**: Nama kolom tidak sesuai atau ada kolom yang hilang
**Solusi**:
- Download template terbaru
- Copy-paste data ke template yang benar
- Pastikan nama kolom persis sama (case-sensitive)

#### 4. "Nomor anggota tidak ditemukan"
**Penyebab**: Nomor anggota tidak ada di database
**Solusi**:
- Cek kembali nomor anggota di master data
- Pastikan anggota sudah terdaftar di sistem
- Periksa format penulisan nomor (ada spasi atau karakter khusus)

#### 5. "Jenis pembayaran tidak valid"
**Penyebab**: Isi selain 'hutang' atau 'piutang'
**Solusi**:
- Pastikan hanya menggunakan kata 'hutang' atau 'piutang'
- Gunakan huruf kecil semua
- Hapus spasi di awal/akhir

#### 6. "Jumlah pembayaran melebihi saldo"
**Penyebab**: Jumlah bayar lebih besar dari hutang/piutang anggota
**Solusi**:
- Cek saldo hutang/piutang anggota di sistem
- Sesuaikan jumlah pembayaran
- Pastikan tidak ada kesalahan input angka

#### 7. "Format jumlah pembayaran tidak valid"
**Penyebab**: Jumlah bukan angka atau menggunakan format yang salah
**Solusi**:
- Gunakan angka saja tanpa titik, koma, atau mata uang
- Contoh benar: 500000
- Contoh salah: 500.000, Rp 500000, 500,000

### Error Sistem

#### "Koneksi database terputus"
- Tunggu beberapa saat dan coba lagi
- Hubungi admin jika masalah berlanjut

#### "Memori sistem tidak cukup"
- Bagi file menjadi batch yang lebih kecil
- Coba saat sistem tidak terlalu sibuk

#### "Timeout saat pemrosesan"
- File terlalu besar atau sistem sibuk
- Bagi menjadi batch kecil (maksimal 100 transaksi per file)

## Tips dan Best Practices

### 1. Persiapan Data
- Selalu gunakan template terbaru
- Validasi data di Excel sebelum import
- Backup data sebelum melakukan import massal
- Test dengan file kecil (5-10 baris) terlebih dahulu

### 2. Ukuran File Optimal
- **Ideal**: 50-100 transaksi per file
- **Maksimal**: 500 transaksi per file
- **Hindari**: File dengan ribuan transaksi sekaligus

### 3. Waktu Import Terbaik
- Lakukan saat sistem tidak sibuk (pagi hari atau sore)
- Hindari saat jam operasional puncak
- Koordinasi dengan kasir lain untuk menghindari konflik

### 4. Validasi Sebelum Import
- Cek saldo anggota di sistem sebelum membuat file
- Pastikan semua anggota masih aktif
- Verifikasi jenis pembayaran sesuai kebutuhan

### 5. Monitoring dan Follow-up
- Selalu download dan simpan laporan hasil import
- Cek transaksi yang gagal dan follow-up manual jika perlu
- Backup laporan untuk audit trail

### 6. Keamanan Data
- Jangan share file import yang berisi data sensitif
- Hapus file dari komputer setelah import selesai
- Gunakan password untuk file Excel jika perlu

### 7. Troubleshooting
- Simpan file asli sebelum melakukan perubahan
- Catat error message untuk dilaporkan ke admin
- Jika ragu, konsultasi dengan admin sebelum import besar

## Batasan Sistem

- **Ukuran file maksimal**: 5MB
- **Format yang didukung**: CSV, XLSX
- **Jumlah transaksi per batch**: Tidak dibatasi, tapi disarankan maksimal 500
- **Timeout pemrosesan**: 30 menit
- **Concurrent import**: Hanya 1 proses per user

## Kontak Support

Jika mengalami masalah yang tidak dapat diatasi:

1. **Admin Sistem**: Untuk masalah teknis dan konfigurasi
2. **Supervisor**: Untuk masalah operasional dan kebijakan
3. **IT Support**: Untuk masalah koneksi dan hardware

---

**Catatan**: Panduan ini berlaku untuk versi sistem terbaru. Jika ada perbedaan tampilan atau fitur, hubungi admin untuk update panduan.