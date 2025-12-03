# 📥 Panduan Import Data Anggota

## Fitur Import Data Anggota

Fitur ini memungkinkan Anda untuk mengimpor banyak data anggota sekaligus menggunakan file CSV atau Excel, sehingga tidak perlu input satu per satu.

---

## 🎯 Cara Menggunakan

### Metode 1: Import dari File CSV/Excel

1. **Download Template**
   - Klik tombol "Download Template"
   - File `template_anggota.csv` akan terdownload
   - Buka file dengan Excel atau aplikasi spreadsheet

2. **Isi Data Anggota**
   - Isi data sesuai kolom yang tersedia:
     - **NIK**: Nomor Induk Karyawan (wajib, unik)
     - **Nama**: Nama lengkap anggota (wajib)
     - **No. Kartu**: Nomor kartu anggota (wajib, unik)
     - **Telepon**: Nomor telepon (opsional)
     - **Alamat**: Alamat lengkap (opsional)

3. **Simpan File**
   - Simpan sebagai CSV (Comma Separated Values)
   - Atau tetap dalam format Excel (.xlsx, .xls)

4. **Upload File**
   - Klik tombol "Import Data"
   - Pilih file yang sudah diisi
   - Atau drag & drop file ke area upload

5. **Preview Data**
   - Klik tombol "Preview"
   - Sistem akan menampilkan 5 baris pertama
   - Cek apakah data sudah benar

6. **Import**
   - Klik tombol "Import Data"
   - Sistem akan memproses dan menyimpan data
   - Data duplikat (NIK sama) akan dilewati

---

### Metode 2: Paste Data CSV

1. **Siapkan Data CSV**
   - Format: `NIK,Nama,No. Kartu,Telepon,Alamat`
   - Contoh:
     ```
     123456,John Doe,KTA001,08123456789,Jl. Contoh No. 1
     234567,Jane Smith,KTA002,08234567890,Jl. Contoh No. 2
     ```

2. **Paste ke Textarea**
   - Klik tombol "Import Data"
   - Paste data CSV ke textarea
   - Bisa dengan atau tanpa header

3. **Preview & Import**
   - Klik "Preview" untuk melihat data
   - Klik "Import Data" untuk menyimpan

---

## 📋 Format Template

### Struktur CSV:
```csv
NIK,Nama,No. Kartu,Telepon,Alamat
123456,John Doe,KTA001,08123456789,Jl. Contoh No. 1
234567,Jane Smith,KTA002,08234567890,Jl. Contoh No. 2
345678,Bob Johnson,KTA003,08345678901,Jl. Contoh No. 3
```

### Aturan Format:
- **Separator**: Koma (,)
- **Header**: Baris pertama (opsional)
- **Encoding**: UTF-8
- **Quotes**: Gunakan untuk data yang mengandung koma

---

## ✅ Validasi Data

Sistem akan melakukan validasi:

1. **NIK Unik**
   - NIK yang sudah ada akan dilewati
   - Tidak akan menimpa data lama

2. **Data Wajib**
   - NIK harus diisi
   - Nama harus diisi
   - No. Kartu harus diisi

3. **Format Data**
   - Minimal 3 kolom (NIK, Nama, No. Kartu)
   - Kolom tambahan (Telepon, Alamat) opsional

---

## 📤 Export Data

### Cara Export:
1. Klik tombol "Export Data"
2. File CSV akan terdownload
3. Nama file: `data_anggota_YYYY-MM-DD.csv`

### Kegunaan Export:
- Backup data anggota
- Edit massal di Excel
- Import ulang setelah diedit
- Migrasi data ke sistem lain

---

## 💡 Tips & Trik

### 1. Persiapan Data di Excel
```
A          B              C        D            E
NIK        Nama           No.Kartu Telepon      Alamat
123456     John Doe       KTA001   08123456789  Jl. Contoh 1
234567     Jane Smith     KTA002   08234567890  Jl. Contoh 2
```

### 2. Menghindari Error
- ✅ Pastikan NIK unik
- ✅ Jangan ada baris kosong di tengah
- ✅ Gunakan quotes untuk alamat yang panjang
- ✅ Hapus spasi berlebih

### 3. Data dengan Koma
Jika data mengandung koma, gunakan quotes:
```csv
123456,"Doe, John",KTA001,08123456789,"Jl. Contoh No. 1, RT 01"
```

### 4. Import Bertahap
- Import 100-200 data per batch
- Cek hasil setelah setiap import
- Lebih mudah troubleshooting jika ada error

---

## 🔍 Troubleshooting

### Problem: Data tidak muncul setelah import
**Solusi:**
- Cek format CSV (separator koma)
- Pastikan minimal 3 kolom terisi
- Lihat console browser untuk error

### Problem: Beberapa data dilewati
**Solusi:**
- Data dilewati karena NIK duplikat
- Cek NIK yang sudah ada di sistem
- Gunakan NIK yang berbeda

### Problem: Karakter aneh muncul
**Solusi:**
- Simpan file dengan encoding UTF-8
- Gunakan Excel "Save As" → CSV UTF-8

### Problem: Preview tidak muncul
**Solusi:**
- Pastikan format CSV benar
- Cek separator (harus koma)
- Minimal 1 baris data valid

---

## 📊 Contoh Kasus Penggunaan

### Kasus 1: Import 50 Karyawan Baru
1. Download template
2. Isi data 50 karyawan di Excel
3. Save as CSV
4. Import → Preview → Import Data
5. Selesai! 50 anggota tersimpan

### Kasus 2: Update Data Massal
1. Export data existing
2. Edit di Excel (tambah/ubah)
3. Import kembali
4. Data baru akan ditambahkan
5. Data lama tetap aman (tidak ditimpa)

### Kasus 3: Migrasi dari Sistem Lain
1. Export data dari sistem lama (format CSV)
2. Sesuaikan format dengan template
3. Import ke sistem baru
4. Validasi data hasil import

---

## 🎓 Best Practices

1. **Selalu Backup**
   - Export data sebelum import besar
   - Simpan file backup di tempat aman

2. **Test dengan Sample**
   - Import 5-10 data dulu
   - Cek hasilnya
   - Baru import semua data

3. **Dokumentasi**
   - Catat tanggal import
   - Simpan file sumber
   - Buat log perubahan

4. **Validasi Manual**
   - Cek beberapa data random
   - Pastikan format benar
   - Verifikasi data penting

---

## 📞 Bantuan

Jika mengalami kesulitan:
1. Cek panduan ini kembali
2. Download template dan ikuti format
3. Hubungi administrator sistem
4. Gunakan fitur export untuk referensi format

---

**© 2024 Aplikasi Koperasi Karyawan**
