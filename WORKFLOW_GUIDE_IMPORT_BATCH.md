# Workflow Guide - Import Batch

## Overview
Panduan lengkap untuk memproses pembayaran hutang/piutang secara massal menggunakan tab Import Batch dalam interface terintegrasi.

## Prasyarat
- ✅ Login sebagai admin (role kasir mungkin terbatas)
- ✅ Akses ke menu Pembayaran Hutang Piutang
- ✅ File data pembayaran dalam format CSV/Excel
- ✅ Template import yang sudah diisi dengan benar

## Persiapan File Import

### Download Template
1. Buka tab **"Import Batch"**
2. Klik tombol **"Download Template"**
3. Pilih format:
   - **CSV**: Untuk editing dengan text editor
   - **Excel**: Untuk editing dengan Microsoft Excel/LibreOffice
4. Simpan template di komputer

### Format Template

#### Kolom Wajib
| Kolom | Deskripsi | Format | Contoh |
|-------|-----------|--------|---------|
| `nomor_anggota` | Nomor anggota yang terdaftar | Text/Number | "A001" atau 1001 |
| `nama_anggota` | Nama lengkap anggota | Text | "Budi Santoso" |
| `jenis_pembayaran` | Jenis pembayaran | Text | "hutang" atau "piutang" |
| `jumlah_pembayaran` | Nominal pembayaran | Number | 500000 |
| `keterangan` | Catatan tambahan | Text | "Cicilan Desember 2024" |

#### Contoh Data Valid
```csv
nomor_anggota,nama_anggota,jenis_pembayaran,jumlah_pembayaran,keterangan
A001,Budi Santoso,hutang,500000,Cicilan bulan Desember
A002,Siti Aminah,piutang,300000,Pembayaran dividen
A003,Ahmad Yusuf,hutang,750000,Pelunasan hutang
```

### Aturan Pengisian Data

#### Nomor Anggota
- ✅ Harus sesuai dengan data di sistem
- ✅ Bisa berupa angka atau kombinasi huruf-angka
- ❌ Tidak boleh kosong
- ❌ Tidak boleh duplikasi dalam satu batch

#### Nama Anggota
- ✅ Harus sesuai dengan nama di sistem
- ✅ Tidak case-sensitive (besar/kecil huruf)
- ❌ Tidak boleh kosong
- 💡 Digunakan untuk validasi silang dengan nomor anggota

#### Jenis Pembayaran
- ✅ Hanya "hutang" atau "piutang" (huruf kecil)
- ❌ Tidak boleh kosong
- ❌ Tidak boleh nilai lain

#### Jumlah Pembayaran
- ✅ Harus berupa angka positif
- ✅ Tanpa titik, koma, atau simbol mata uang
- ❌ Tidak boleh 0 atau negatif
- ❌ Tidak boleh melebihi saldo anggota

#### Keterangan
- ✅ Boleh kosong
- ✅ Maksimal 255 karakter
- 💡 Disarankan diisi untuk dokumentasi

## Workflow Import Batch

### Langkah 1: Akses Tab Import
1. Buka menu **"Pembayaran Hutang Piutang"**
2. Klik tab **"Import Batch"** (tab kedua)
3. Interface import akan terbuka

### Langkah 2: Upload File
1. Klik tombol **"Pilih File"** atau **"Choose File"**
2. Browse dan pilih file CSV/Excel yang sudah disiapkan
3. Klik **"Open"** untuk memilih file
4. Nama file akan muncul di interface
5. Klik **"Upload"** untuk memulai proses

### Langkah 3: Validasi Otomatis
Sistem akan melakukan validasi otomatis:

#### Validasi Format File
- ✅ Ekstensi file (.csv, .xlsx, .xls)
- ✅ Ukuran file (maksimal 5MB)
- ✅ Struktur header kolom
- ✅ Encoding file (UTF-8)

#### Validasi Data
- ✅ Kelengkapan kolom wajib
- ✅ Format data setiap kolom
- ✅ Keberadaan anggota di sistem
- ✅ Ketersediaan saldo untuk pembayaran
- ✅ Duplikasi data dalam batch

### Langkah 4: Review Preview Data
Setelah validasi, sistem menampilkan:

#### Summary Validasi
```
📊 SUMMARY VALIDASI
Total Baris: 150
✅ Valid: 145
❌ Error: 5
⚠️ Warning: 0
```

#### Tabel Preview
- **Data Valid**: Ditampilkan dengan background hijau
- **Data Error**: Ditampilkan dengan background merah + pesan error
- **Data Warning**: Ditampilkan dengan background kuning + pesan warning

#### Detail Error
Contoh pesan error:
- ❌ "Anggota A999 tidak ditemukan"
- ❌ "Jumlah 1500000 melebihi saldo hutang 1000000"
- ❌ "Jenis pembayaran 'kredit' tidak valid"

### Langkah 5: Perbaikan Data (Jika Ada Error)
Jika ada error:
1. **Download file error** dengan klik "Download Error Report"
2. **Perbaiki data** di file asli berdasarkan laporan error
3. **Upload ulang** file yang sudah diperbaiki
4. **Ulangi validasi** sampai semua data valid

### Langkah 6: Konfirmasi Import
Jika semua data valid:
1. Review sekali lagi summary dan preview
2. Klik tombol **"Proses Import"**
3. Dialog konfirmasi akan muncul:
   ```
   Konfirmasi Import Batch
   
   Total transaksi: 145
   Total nilai: Rp 75,500,000
   
   Apakah Anda yakin ingin memproses import ini?
   Data yang sudah diproses tidak dapat dibatalkan.
   
   [Ya, Proses Import] [Batal]
   ```
4. Klik **"Ya, Proses Import"** untuk melanjutkan

### Langkah 7: Proses Import
Sistem akan memproses import:

#### Progress Indicator
```
🔄 MEMPROSES IMPORT BATCH...
Progress: 45/145 (31%)
Berhasil: 45
Gagal: 0
Estimasi: 2 menit tersisa
```

#### Real-time Updates
- Counter transaksi yang diproses
- Persentase progress
- Jumlah berhasil/gagal
- Estimasi waktu selesai

### Langkah 8: Review Hasil Import
Setelah selesai, sistem menampilkan laporan:

#### Summary Hasil
```
✅ IMPORT BATCH SELESAI
Batch ID: IMP-20241215-001
Total Diproses: 145
✅ Berhasil: 143
❌ Gagal: 2
Waktu Proses: 3 menit 24 detik
```

#### Detail Transaksi Gagal
Jika ada yang gagal:
- Nomor anggota
- Nama anggota
- Alasan kegagalan
- Saran perbaikan

#### Laporan Lengkap
1. Klik **"Download Laporan Lengkap"**
2. File Excel akan berisi:
   - Summary hasil import
   - Detail semua transaksi berhasil
   - Detail transaksi gagal dengan alasan
   - Timestamp dan metadata batch

### Langkah 9: Verifikasi di Riwayat Transaksi
1. Scroll ke bagian **"Riwayat Transaksi"**
2. Filter berdasarkan:
   - **Mode**: "Import"
   - **Batch ID**: ID batch yang baru diproses
3. Verifikasi semua transaksi muncul dengan status "Berhasil"

## Skenario Khusus

### Import Pembayaran Hutang Massal
**Contoh**: Cicilan bulanan 100 anggota

1. **Persiapan**:
   - Export data anggota dengan saldo hutang
   - Hitung jumlah cicilan per anggota
   - Siapkan file import dengan data lengkap

2. **Validasi Khusus**:
   - Pastikan semua anggota memiliki saldo hutang
   - Cek jumlah cicilan tidak melebihi saldo
   - Verifikasi tidak ada anggota yang sudah lunas

3. **Proses**:
   - Upload file dengan 100 baris data
   - Review preview untuk memastikan semua valid
   - Proses import batch
   - Verifikasi 100 transaksi berhasil

### Import Pembayaran Piutang Dividen
**Contoh**: Pembayaran dividen tahunan ke 200 anggota

1. **Persiapan**:
   - Hitung dividen per anggota berdasarkan simpanan
   - Siapkan file dengan jenis_pembayaran = "piutang"
   - Pastikan saldo kas koperasi mencukupi

2. **Validasi Khusus**:
   - Cek total pembayaran tidak melebihi saldo kas
   - Verifikasi perhitungan dividen sudah benar
   - Pastikan semua anggota berhak menerima dividen

3. **Proses**:
   - Upload file dividen
   - Sistem akan validasi saldo kas total
   - Proses import jika saldo mencukupi
   - Cetak laporan dividen untuk dokumentasi

### Import Campuran (Hutang + Piutang)
**Contoh**: Proses bulanan dengan hutang dan piutang

1. **Persiapan**:
   - Gabungkan data hutang dan piutang dalam satu file
   - Pastikan kolom jenis_pembayaran diisi dengan benar
   - Urutkan berdasarkan jenis untuk memudah review

2. **Validasi**:
   - Sistem akan validasi setiap baris sesuai jenisnya
   - Hutang: cek saldo hutang anggota
   - Piutang: cek saldo kas koperasi

3. **Proses**:
   - Import akan memproses sesuai urutan di file
   - Transaksi hutang dan piutang akan tercampur
   - Gunakan filter mode untuk memisahkan di riwayat

## Tips dan Best Practices

### Persiapan File
- 📝 Selalu gunakan template resmi
- 📝 Backup file asli sebelum edit
- 📝 Hapus baris kosong di akhir file
- 📝 Pastikan tidak ada karakter khusus
- 📝 Simpan dalam format UTF-8

### Validasi Data
- ✅ Cek data anggota di sistem sebelum import
- ✅ Verifikasi saldo sebelum buat file
- ✅ Test dengan file kecil (5-10 baris) dulu
- ✅ Gunakan Excel formula untuk validasi lokal

### Proses Import
- ⏰ Lakukan import saat traffic rendah
- ⏰ Jangan tutup browser saat proses berjalan
- ⏰ Siapkan waktu cukup untuk file besar
- ⏰ Informasikan ke kasir lain saat import besar

### Dokumentasi
- 📄 Simpan file asli dan laporan hasil
- 📄 Catat batch ID untuk referensi
- 📄 Arsipkan sesuai prosedur koperasi
- 📄 Buat catatan khusus untuk import besar

## Troubleshooting

### Error Upload File
**"File format not supported"**
- Pastikan ekstensi .csv, .xlsx, atau .xls
- Coba save ulang dari Excel dengan format yang benar

**"File too large"**
- Maksimal 5MB per file
- Bagi file besar menjadi beberapa batch
- Kompres file jika perlu

**"Invalid file encoding"**
- Simpan file dengan encoding UTF-8
- Gunakan "Save As" dan pilih UTF-8

### Error Validasi Data
**"Anggota tidak ditemukan"**
- Cek nomor anggota di master data
- Pastikan anggota masih aktif
- Periksa typo di nomor anggota

**"Saldo tidak mencukupi"**
- Cek saldo terkini anggota
- Kurangi jumlah pembayaran
- Proses pembayaran sebagian dulu

**"Duplikasi data"**
- Hapus baris duplikat di file
- Pastikan satu anggota hanya muncul sekali per batch

### Error Proses Import
**"Import timeout"**
- File terlalu besar, bagi menjadi batch kecil
- Coba lagi saat server tidak sibuk
- Hubungi admin jika masalah berlanjut

**"Connection lost"**
- Periksa koneksi internet
- Refresh halaman dan coba lagi
- Cek apakah sebagian data sudah terproses

## Integrasi dengan Tab Manual

### Kapan Menggunakan Import vs Manual
**Gunakan Import Batch jika**:
- ✅ > 10 transaksi sekaligus
- ✅ Data sudah tersedia dalam file
- ✅ Pembayaran rutin (bulanan/tahunan)
- ✅ Perlu efisiensi waktu dan akurasi

**Gunakan Manual jika**:
- ✅ < 10 transaksi
- ✅ Anggota datang langsung
- ✅ Pembayaran ad-hoc/tidak terjadwal
- ✅ Perlu interaksi langsung

### Beralih ke Tab Manual
1. Klik tab **"Pembayaran Manual"**
2. Jika ada proses import berjalan:
   - Tunggu sampai selesai
   - Atau batal proses import
3. Tab manual akan terbuka
4. Semua transaksi import akan muncul di riwayat

### Monitoring Gabungan
- Dashboard akan menampilkan statistik gabungan
- Riwayat transaksi menampilkan semua mode
- Export laporan bisa pilih mode atau gabungan

## Checklist Import Batch

### Sebelum Import
- [ ] Download template terbaru
- [ ] Siapkan data anggota yang valid
- [ ] Verifikasi saldo anggota di sistem
- [ ] Backup file asli
- [ ] Test dengan sample kecil

### Saat Import
- [ ] Upload file dengan format benar
- [ ] Review semua error validasi
- [ ] Perbaiki data jika ada error
- [ ] Konfirmasi summary sebelum proses
- [ ] Monitor progress import

### Setelah Import
- [ ] Download laporan lengkap
- [ ] Verifikasi di riwayat transaksi
- [ ] Cek dashboard untuk update statistik
- [ ] Arsipkan file dan laporan
- [ ] Informasikan hasil ke pihak terkait

## FAQ

**Q: Berapa maksimal baris yang bisa diimport sekaligus?**  
A: Tidak ada limit baris, tapi disarankan maksimal 1000 baris per batch untuk performa optimal.

**Q: Apakah bisa import file Excel dengan multiple sheet?**  
A: Tidak. Sistem hanya membaca sheet pertama. Pastikan data di sheet pertama.

**Q: Bagaimana jika import gagal di tengah proses?**  
A: Transaksi yang sudah berhasil tidak akan di-rollback. Perbaiki data yang gagal dan import ulang.

**Q: Apakah bisa import dengan kolom tambahan?**  
A: Ya, kolom tambahan akan diabaikan. Pastikan kolom wajib tetap ada dan sesuai urutan.

**Q: Bagaimana cara membatalkan import yang sedang berjalan?**  
A: Klik tombol "Batal Import" jika tersedia, atau refresh halaman. Transaksi yang sudah diproses tidak bisa dibatalkan.

---

**Versi Dokumen**: 1.0  
**Tanggal Update**: Desember 2024  
**Untuk Pertanyaan**: Hubungi admin atau support koperasi