# Panduan Upload Data Simpanan Wajib

## Fitur Baru: Upload CSV/Excel untuk Simpanan Wajib

Fitur ini memungkinkan administrator untuk menginput data simpanan wajib secara batch (banyak anggota sekaligus) menggunakan file CSV atau Excel, atau dengan paste data langsung.

## Cara Menggunakan

Ada **2 cara** untuk upload data simpanan wajib:

### Cara 1: Upload File CSV/Excel

#### 1. Download Template

1. Buka menu **Simpanan** → **Simpanan Wajib**
2. Klik tombol **"Download Template"** (ikon download)
3. File `template_simpanan_wajib.csv` akan terdownload

#### 2. Isi Data di Template

Template memiliki format kolom sebagai berikut:

```csv
NIK,Nama,Jumlah,Periode,Tanggal
3201010101010001,Budi Santoso,100000,2024-10,2024-10-18
3201010101010002,Siti Aminah,100000,2024-10,2024-10-18
```

**Penjelasan Kolom:**
- **NIK**: Nomor Induk Kependudukan anggota (harus sudah terdaftar di sistem)
- **Nama**: Nama anggota (untuk referensi, sistem akan cocokkan dengan NIK)
- **Jumlah**: Jumlah simpanan wajib dalam angka (bisa pakai format apapun, sistem akan bersihkan otomatis)
- **Periode**: Periode simpanan dalam format YYYY-MM (contoh: 2024-10 untuk Oktober 2024)
- **Tanggal**: Tanggal setor - **SISTEM OTOMATIS KONVERSI** berbagai format:
  - ✅ `2024-10-18` (YYYY-MM-DD) - Format standar
  - ✅ `10/18/2024` (MM/DD/YYYY) - Format Excel US
  - ✅ `18/10/2024` (DD/MM/YYYY) - Format Excel Indonesia
  - ✅ `18-10-2024` (DD-MM-YYYY) - Format alternatif
  - ✅ `2024/10/18` (YYYY/MM/DD) - Format alternatif

#### 3. Upload File

1. Klik tombol **"Upload Data CSV/Excel"** (ikon upload)
2. Pilih tab **"Upload File"**
3. Pilih file CSV/Excel yang sudah diisi
4. Sistem akan otomatis menampilkan **Preview Data**

### Cara 2: Paste Data Langsung (LEBIH CEPAT!)

#### 1. Siapkan Data di Excel/Spreadsheet

Buat tabel dengan format:

| NIK | Nama | Jumlah | Periode | Tanggal |
|-----|------|--------|---------|---------|
| 3201010101010001 | Budi Santoso | 100000 | 2024-10 | 2024-10-18 |
| 3201010101010002 | Siti Aminah | 100000 | 2024-10 | 2024-10-18 |

#### 2. Copy Data dari Excel

1. Select semua data (termasuk header)
2. Tekan **Ctrl+C** untuk copy

#### 3. Paste di Sistem

1. Klik tombol **"Upload Data CSV/Excel"**
2. Pilih tab **"Paste Data"**
3. Klik di area text box
4. Tekan **Ctrl+V** untuk paste
5. Klik tombol **"Preview Data"**
6. Sistem akan menampilkan **Preview Data** dengan status validasi

### 4. Review dan Proses (Sama untuk Kedua Cara)

1. Periksa **Summary**:
   - Total Data
   - Data Valid
   - Data Error
2. Jika ada error, perbaiki file dan upload ulang
3. Klik **"Proses Upload"** untuk menyimpan data
4. Konfirmasi jumlah data yang akan diproses

## Validasi Data

Sistem akan memvalidasi setiap baris data:

### ✅ Data Valid Jika:
- NIK ditemukan di database anggota
- Jumlah adalah angka positif (lebih dari 0)
- Periode format YYYY-MM (contoh: 2024-10)
- Format tanggal valid (sistem support banyak format, akan dikonversi otomatis)

### ❌ Data Error Jika:
- **"NIK tidak ditemukan"**: NIK belum terdaftar di sistem
- **"Jumlah tidak valid"**: Jumlah bukan angka atau kurang dari/sama dengan 0
- **"Format periode tidak valid"**: Periode bukan format YYYY-MM
- **"Format tanggal tidak valid"**: Tanggal tidak bisa dikenali (gunakan salah satu format yang didukung)

## Hasil Proses

Setelah proses berhasil:
1. ✅ Data simpanan wajib tersimpan untuk setiap anggota
2. ✅ Jurnal akuntansi otomatis tercatat:
   - Debit: Kas (1-1000)
   - Kredit: Simpanan Wajib (2-1200)
3. ✅ Data muncul di tabel Simpanan Wajib

## Tips

### Tips Umum
1. **Periksa NIK**: Pastikan semua NIK sudah terdaftar di sistem sebelum upload
2. **Format Periode**: Gunakan format YYYY-MM (contoh: 2024-10, bukan 10-2024 atau Oktober 2024)
3. **Preview Dulu**: Selalu periksa preview sebelum klik "Proses Upload"

### Tips Upload File
1. **Gunakan Template**: Selalu mulai dari template yang didownload untuk memastikan format benar
2. **Jumlah Fleksibel**: Bisa pakai format apapun, sistem akan bersihkan otomatis
3. **Tanggal Fleksibel**: Sistem support berbagai format tanggal

### Tips Paste Data (RECOMMENDED!)
1. **Lebih Cepat**: Paste data langsung dari Excel lebih cepat daripada save file dulu
2. **Format Fleksibel**: Sistem otomatis deteksi delimiter (koma atau tab)
3. **Jumlah Fleksibel**: Bisa pakai format apapun (100000 atau 100.000), sistem akan bersihkan otomatis
4. **Tanggal Fleksibel**: Sistem otomatis konversi berbagai format tanggal (MM/DD/YYYY, DD/MM/YYYY, dll)
5. **Copy dari Excel**: Cukup select data di Excel → Ctrl+C → Paste di sistem → Preview
6. **Tidak Perlu Save File**: Langsung dari Excel ke sistem, hemat waktu!
7. **Lihat Konversi**: Preview akan menampilkan "(dikonversi)" jika tanggal diubah formatnya

## Contoh Data

### Contoh 1: Data Standar (10 Anggota)

```
NIK	Nama	Jumlah	Periode	Tanggal
3201010101010001	Budi Santoso	100000	2024-10	2024-10-18
3201010101010002	Siti Aminah	100000	2024-10	2024-10-18
3201010101010003	Ahmad Hidayat	150000	2024-10	2024-10-18
3201010101010004	Dewi Lestari	100000	2024-10	2024-10-18
3201010101010005	Eko Prasetyo	200000	2024-10	2024-10-18
3201010101010006	Rina Wati	100000	2024-10	2024-10-18
3201010101010007	Joko Susilo	120000	2024-10	2024-10-18
3201010101010008	Maya Sari	100000	2024-10	2024-10-18
3201010101010009	Hendra Gunawan	180000	2024-10	2024-10-18
3201010101010010	Fitri Handayani	100000	2024-10	2024-10-18
```

### Contoh 2: Data dengan Format Tanggal Excel (MM/DD/YYYY)

```
NIK	Nama	Jumlah	Periode	Tanggal
3201010101010001	Budi Santoso	100000	2024-10	10/18/2024
3201010101010002	Siti Aminah	100000	2024-10	10/18/2024
3201010101010003	Ahmad Hidayat	150000	2024-10	10/18/2024
```

> **Note**: Sistem akan otomatis konversi `10/18/2024` menjadi `2024-10-18`

### Contoh 3: Data Berbagai Periode

```
NIK	Nama	Jumlah	Periode	Tanggal
3201010101010001	Budi Santoso	100000	2024-09	2024-09-15
3201010101010002	Siti Aminah	100000	2024-10	2024-10-18
3201010101010003	Ahmad Hidayat	150000	2024-11	2024-11-20
```

## Troubleshooting

### Problem: "NIK tidak ditemukan"
**Solusi**: 
- Periksa apakah anggota sudah terdaftar di menu Anggota
- Pastikan NIK di file CSV sama persis dengan NIK di database
- Tidak ada spasi di awal atau akhir NIK

### Problem: "Jumlah tidak valid"
**Solusi**:
- Pastikan kolom Jumlah hanya berisi angka
- Tidak ada titik, koma, atau karakter lain (sistem akan bersihkan otomatis)
- Jumlah harus lebih besar dari 0

### Problem: "Format periode tidak valid"
**Solusi**:
- Gunakan format YYYY-MM
- Contoh benar: 2024-10, 2024-01, 2024-12
- Contoh salah: 10-2024, Oktober 2024, 2024/10

### Problem: "Format tanggal tidak valid"
**Solusi**:
- Sistem support banyak format tanggal dan akan konversi otomatis:
  - ✅ `2024-10-18` (YYYY-MM-DD)
  - ✅ `10/18/2024` (MM/DD/YYYY) - Excel US
  - ✅ `18/10/2024` (DD/MM/YYYY) - Excel Indonesia
  - ✅ `18-10-2024` (DD-MM-YYYY)
  - ✅ `2024/10/18` (YYYY/MM/DD)
- Jika masih error, cek apakah tanggal valid (contoh: 32/01/2024 tidak valid)

### Problem: File tidak bisa diupload
**Solusi**:
- Pastikan file berformat .csv, .xlsx, atau .xls
- Coba save ulang file sebagai CSV (Comma delimited)
- Periksa apakah file tidak corrupt

## Keuntungan Fitur Upload

✅ **Cepat**: Input ratusan anggota dalam hitungan detik
✅ **Akurat**: Validasi otomatis mengurangi kesalahan input
✅ **Efisien**: Tidak perlu input satu per satu
✅ **Terintegrasi**: Jurnal akuntansi otomatis tercatat
✅ **Aman**: Preview sebelum proses, bisa cek dulu sebelum simpan
✅ **Fleksibel**: Support berbagai format tanggal dan periode

---

**Catatan**: Fitur ini sangat berguna saat:
- Setor simpanan wajib bulanan untuk semua anggota
- Migrasi data dari sistem lama
- Input data simpanan wajib periode sebelumnya
- Koreksi data simpanan wajib massal
