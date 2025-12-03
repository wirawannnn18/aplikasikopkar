# Tutorial Step-by-Step: Input Simpanan Wajib Per Periode

## 🎯 Tujuan
Menginput simpanan wajib untuk **50 anggota** sejak **Oktober 2024** hingga **Desember 2024**.

---

## 📊 Skenario
- **Jumlah Anggota:** 50 orang
- **Periode:** Oktober 2024, November 2024, Desember 2024
- **Jumlah per Anggota:** Rp 100.000 per bulan
- **Total Transaksi:** 50 × 3 = 150 transaksi
- **Total Simpanan:** Rp 15.000.000

---

## 🚀 Langkah 1: Persiapan Data

### 1.1 Export Data Anggota

**Tujuan:** Mendapatkan daftar NIK dan Nama anggota yang akurat.

**Cara:**
1. Login ke aplikasi
2. Buka menu **Master Anggota**
3. Klik tombol **"Export Data"**
4. File CSV akan terdownload dengan kolom: NIK, Nama, dll
5. Buka file di Excel

**Hasil:**
```
NIK,Nama,No. Kartu,Departemen,...
3201010101010001,Budi Santoso,K001,IT,...
3201010101010002,Siti Aminah,K002,Finance,...
...
```

### 1.2 Buat File Simpanan Wajib Oktober 2024

**Cara:**
1. Buat file Excel baru
2. Copy kolom NIK dan Nama dari file export anggota
3. Tambahkan kolom: Jumlah, Periode, Tanggal
4. Isi data:
   - **Jumlah:** 100000 (untuk semua anggota)
   - **Periode:** 2024-10 (untuk semua anggota)
   - **Tanggal:** 2024-10-18 (untuk semua anggota)

**Hasil:**
```csv
NIK,Nama,Jumlah,Periode,Tanggal
3201010101010001,Budi Santoso,100000,2024-10,2024-10-18
3201010101010002,Siti Aminah,100000,2024-10,2024-10-18
... (48 anggota lainnya)
```

5. Save as: `simpanan_wajib_oktober_2024.csv`

**Tips Excel:**
- Gunakan formula untuk auto-fill:
  - Kolom Jumlah: Ketik 100000 di cell pertama, drag ke bawah
  - Kolom Periode: Ketik 2024-10 di cell pertama, drag ke bawah
  - Kolom Tanggal: Ketik 2024-10-18 di cell pertama, drag ke bawah

### 1.3 Duplikasi untuk November dan Desember

**Cara:**
1. Duplikasi file `simpanan_wajib_oktober_2024.csv`
2. Rename menjadi `simpanan_wajib_november_2024.csv`
3. Ubah kolom Periode menjadi `2024-11`
4. Ubah kolom Tanggal menjadi `2024-11-18`
5. Save

6. Duplikasi lagi untuk Desember
7. Rename menjadi `simpanan_wajib_desember_2024.csv`
8. Ubah kolom Periode menjadi `2024-12`
9. Ubah kolom Tanggal menjadi `2024-12-02` (atau tanggal setor Desember)
10. Save

**Hasil:**
- ✅ `simpanan_wajib_oktober_2024.csv` (50 baris)
- ✅ `simpanan_wajib_november_2024.csv` (50 baris)
- ✅ `simpanan_wajib_desember_2024.csv` (50 baris)

---

## 🚀 Langkah 2: Upload Data Oktober 2024

### 2.1 Buka Menu Simpanan

1. Login ke aplikasi: http://localhost:3000
2. Klik menu **"Simpanan"** di sidebar
3. Klik tab **"Simpanan Wajib"**

### 2.2 Klik Upload Data

1. Klik tombol **"Upload Data CSV/Excel"**
2. Modal upload akan muncul

### 2.3 Upload File Oktober

**Opsi A: Upload File**
1. Pastikan tab **"Upload File"** aktif
2. Klik **"Pilih File CSV/Excel"**
3. Pilih file `simpanan_wajib_oktober_2024.csv`
4. Klik **"Open"**
5. Sistem akan otomatis preview data

**Opsi B: Paste Data** (Alternatif)
1. Klik tab **"Paste Data"**
2. Buka file CSV di Excel
3. Select semua data (Ctrl+A)
4. Copy (Ctrl+C)
5. Paste di textarea (Ctrl+V)
6. Klik **"Preview Data"**

### 2.4 Verifikasi Preview

Sistem akan menampilkan:

**Tabel Preview:**
```
No | NIK | Nama | Jumlah | Periode | Tanggal | Status
1  | 3201... | Budi Santoso | Rp 100.000 | 2024-10 | 2024-10-18 | ✅ Valid
2  | 3201... | Siti Aminah | Rp 100.000 | 2024-10 | 2024-10-18 | ✅ Valid
...
```

**Summary:**
```
Total Data: 50
Valid: 50 ✅
Error: 0
```

**Cek:**
- ✅ Semua data berstatus "Valid" (hijau)
- ✅ Tidak ada error (merah)
- ✅ Jumlah data sesuai (50)

### 2.5 Proses Upload

1. Klik tombol **"Proses Upload"** (hijau)
2. Konfirmasi: "Proses 50 data simpanan wajib?"
3. Klik **"OK"**
4. Tunggu proses selesai
5. Notifikasi sukses: "Berhasil memproses 50 data simpanan wajib"
6. Modal akan tertutup otomatis

### 2.6 Verifikasi Data Tersimpan

**Cek Tabel:**
- Scroll tabel Simpanan Wajib
- Lihat 50 transaksi baru dengan periode 2024-10

**Cek Total:**
- Lihat footer tabel
- **Total Simpanan Wajib:** Rp 5.000.000 ✅ (50 × 100.000)

---

## 🚀 Langkah 3: Upload Data November 2024

**Ulangi Langkah 2** dengan file `simpanan_wajib_november_2024.csv`

1. Klik **"Upload Data CSV/Excel"**
2. Upload file `simpanan_wajib_november_2024.csv`
3. Verifikasi preview (50 data valid)
4. Klik **"Proses Upload"**
5. Konfirmasi
6. Verifikasi: Total Simpanan Wajib = Rp 10.000.000 ✅ (100 × 100.000)

---

## 🚀 Langkah 4: Upload Data Desember 2024

**Ulangi Langkah 2** dengan file `simpanan_wajib_desember_2024.csv`

1. Klik **"Upload Data CSV/Excel"**
2. Upload file `simpanan_wajib_desember_2024.csv`
3. Verifikasi preview (50 data valid)
4. Klik **"Proses Upload"**
5. Konfirmasi
6. Verifikasi: Total Simpanan Wajib = Rp 15.000.000 ✅ (150 × 100.000)

---

## ✅ Langkah 5: Verifikasi Final

### 5.1 Cek Jumlah Transaksi

**Cara:**
1. Lihat tabel Simpanan Wajib
2. Scroll ke bawah
3. Hitung jumlah baris (atau gunakan filter)

**Hasil yang Diharapkan:**
- Total transaksi: 150 ✅
- Breakdown:
  - Oktober 2024: 50 transaksi
  - November 2024: 50 transaksi
  - Desember 2024: 50 transaksi

### 5.2 Cek Total Simpanan

**Cara:**
1. Lihat footer tabel Simpanan Wajib
2. Lihat angka **"Total Simpanan Wajib"**

**Hasil yang Diharapkan:**
- **Total Simpanan Wajib:** Rp 15.000.000 ✅

**Perhitungan:**
```
50 anggota × Rp 100.000 × 3 bulan = Rp 15.000.000
```

### 5.3 Cek Per Anggota (Sampling)

**Cara:**
1. Pilih 1 anggota (misal: Budi Santoso)
2. Filter tabel berdasarkan nama "Budi Santoso"
3. Lihat riwayat periode

**Hasil yang Diharapkan:**
```
Budi Santoso | Rp 100.000 | 2024-10 | 18/10/2024
Budi Santoso | Rp 100.000 | 2024-11 | 18/11/2024
Budi Santoso | Rp 100.000 | 2024-12 | 02/12/2024
```

Total untuk Budi Santoso: Rp 300.000 ✅

### 5.4 Cek Jurnal Akuntansi

**Cara:**
1. Buka menu **"Keuangan"** → **"Jurnal Umum"**
2. Filter berdasarkan keterangan "Simpanan Wajib"
3. Lihat transaksi

**Hasil yang Diharapkan:**
- 150 transaksi jurnal
- Setiap transaksi:
  ```
  Debit: 1-1000 (Kas) - Rp 100.000
  Kredit: 2-1200 (Simpanan Wajib) - Rp 100.000
  ```

---

## 🎉 Selesai!

**Ringkasan:**
- ✅ 150 transaksi simpanan wajib berhasil diinput
- ✅ Total simpanan: Rp 15.000.000
- ✅ Periode: Oktober - Desember 2024
- ✅ Jurnal akuntansi otomatis tercatat

---

## 🔄 Untuk Bulan Berikutnya (Januari 2025)

**Cara Cepat:**
1. Duplikasi file `simpanan_wajib_desember_2024.csv`
2. Rename menjadi `simpanan_wajib_januari_2025.csv`
3. Ubah Periode menjadi `2025-01`
4. Ubah Tanggal menjadi tanggal setor Januari (misal: `2025-01-18`)
5. Upload dan proses

**Atau Input Manual:**
- Jika hanya beberapa anggota yang bayar
- Gunakan form "Setor Simpanan Wajib"

---

## ⚠️ Troubleshooting

### Problem: "NIK tidak ditemukan"

**Penyebab:**
- NIK di file CSV tidak ada di Master Anggota
- NIK salah ketik
- Ada spasi di awal/akhir NIK

**Solusi:**
1. Cek Master Anggota, pastikan NIK ada
2. Copy-paste NIK langsung dari Master Anggota
3. Trim spasi di Excel: `=TRIM(A2)`

### Problem: "Format periode tidak valid"

**Penyebab:**
- Format periode salah (bukan YYYY-MM)

**Solusi:**
- Gunakan format YYYY-MM (contoh: 2024-10)
- Jangan gunakan format lain

### Problem: Data Terduplikasi

**Penyebab:**
- Upload file yang sama 2 kali

**Solusi:**
1. Cek tabel, cari duplikat
2. Hapus manual dengan tombol "Hapus"
3. Atau export data, filter di Excel, hapus duplikat, upload ulang

---

## 📞 Bantuan

Jika ada masalah, hubungi administrator sistem atau lihat:
- `PANDUAN_SIMPANAN_WAJIB_PER_PERIODE.md` (Panduan lengkap)
- `QUICK_REFERENCE_SIMPANAN_WAJIB.md` (Referensi cepat)

---

**Selamat! Anda berhasil menginput simpanan wajib per periode! 🎉**

---

**Dibuat:** 2 Desember 2024  
**Versi:** 1.0.0
