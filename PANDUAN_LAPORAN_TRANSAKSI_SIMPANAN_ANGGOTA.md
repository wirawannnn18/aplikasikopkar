# Panduan Pengguna: Laporan Transaksi & Simpanan Anggota

## Daftar Isi
1. [Pengenalan](#pengenalan)
2. [Cara Mengakses](#cara-mengakses)
3. [Tampilan Utama](#tampilan-utama)
4. [Fitur-Fitur](#fitur-fitur)
5. [Panduan Penggunaan](#panduan-penggunaan)
6. [Tips & Trik](#tips--trik)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)

---

## Pengenalan

### Apa itu Laporan Transaksi & Simpanan Anggota?

Laporan Transaksi & Simpanan Anggota adalah menu yang menampilkan ringkasan lengkap aktivitas keuangan setiap anggota koperasi, meliputi:
- **Transaksi POS** (pembelian barang)
- **Simpanan** (pokok, wajib, dan sukarela)
- **Outstanding Balance** (tagihan yang belum dibayar)

### Siapa yang Dapat Mengakses?

| Role | Akses |
|------|-------|
| **Super Admin** | Melihat semua data anggota |
| **Administrator** | Melihat semua data anggota |
| **Kasir** | Melihat semua data anggota |
| **Anggota** | Hanya melihat data sendiri |

### Manfaat

✅ Memantau aktivitas keuangan anggota dengan mudah  
✅ Melihat ringkasan transaksi dan simpanan dalam satu tempat  
✅ Mengekspor data untuk analisis lebih lanjut  
✅ Mencetak laporan untuk dokumentasi  
✅ Mencari dan memfilter data dengan cepat  

---

## Cara Mengakses

### Langkah 1: Login ke Sistem
1. Buka aplikasi koperasi di browser
2. Login dengan username dan password Anda
3. Pastikan Anda memiliki role yang sesuai (Admin/Kasir/Anggota)

### Langkah 2: Buka Menu Laporan
1. Klik menu **"Laporan"** di sidebar kiri
2. Pilih **"Laporan Transaksi & Simpanan Anggota"**
3. Halaman laporan akan terbuka

**Catatan:** Jika menu tidak muncul, hubungi administrator untuk memverifikasi hak akses Anda.

---

## Tampilan Utama

### 1. Kartu Statistik (Bagian Atas)

Menampilkan ringkasan keseluruhan:

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Total Anggota   │ Total Transaksi │ Total Simpanan  │ Outstanding     │
│     150         │  Rp 50.000.000  │  Rp 75.000.000  │  Rp 5.000.000   │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

**Keterangan:**
- **Total Anggota:** Jumlah anggota aktif (tidak termasuk anggota keluar)
- **Total Transaksi:** Total nilai transaksi cash + bon
- **Total Simpanan:** Total simpanan pokok + wajib + sukarela
- **Outstanding:** Total tagihan bon yang belum dibayar

### 2. Filter & Pencarian

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔍 Cari (NIK/Nama/No.Kartu)  [Departemen ▼]  [Tipe Anggota ▼] │
│                                                    [Reset Filter]│
└─────────────────────────────────────────────────────────────────┘
```

### 3. Tabel Data Anggota

| NIK | Nama | Departemen | Transaksi Cash | Transaksi Bon | Simpanan | Outstanding | Aksi |
|-----|------|------------|----------------|---------------|----------|-------------|------|
| 001 | Ahmad | IT | Rp 500.000 | Rp 200.000 | Rp 1.000.000 | Rp 50.000 | 👁️ 💰 |

**Kolom:**
- **NIK:** Nomor Induk Karyawan
- **Nama:** Nama lengkap anggota
- **Departemen:** Departemen/divisi anggota
- **Transaksi Cash:** Total transaksi tunai
- **Transaksi Bon:** Total transaksi kredit
- **Simpanan:** Total semua jenis simpanan
- **Outstanding:** Tagihan bon yang belum dibayar
- **Aksi:** Tombol untuk melihat detail

### 4. Tombol Aksi

```
[📥 Export CSV]  [🖨️ Print]
```

---

## Fitur-Fitur

### 1. Pencarian 🔍

**Cara Menggunakan:**
1. Ketik kata kunci di kolom pencarian
2. Sistem akan mencari di:
   - NIK
   - Nama anggota
   - Nomor kartu
3. Hasil akan muncul secara otomatis (debounce 300ms)

**Contoh:**
- Ketik "Ahmad" → Menampilkan semua anggota dengan nama Ahmad
- Ketik "001" → Menampilkan anggota dengan NIK atau no.kartu 001

### 2. Filter Departemen 🏢

**Cara Menggunakan:**
1. Klik dropdown **"Departemen"**
2. Pilih departemen yang diinginkan
3. Tabel akan menampilkan hanya anggota dari departemen tersebut

**Pilihan:**
- Semua Departemen (default)
- IT
- Finance
- HR
- Marketing
- Operations
- dll.

### 3. Filter Tipe Anggota 👥

**Cara Menggunakan:**
1. Klik dropdown **"Tipe Anggota"**
2. Pilih tipe yang diinginkan
3. Tabel akan menampilkan hanya anggota dengan tipe tersebut

**Pilihan:**
- Semua Tipe (default)
- Anggota
- Non-Anggota
- Umum

### 4. Reset Filter 🔄

**Cara Menggunakan:**
1. Klik tombol **"Reset Filter"**
2. Semua filter akan dikembalikan ke default
3. Semua data akan ditampilkan kembali

### 5. Sorting (Pengurutan) ⬆️⬇️

**Cara Menggunakan:**
1. Klik pada header kolom yang ingin diurutkan
2. Klik pertama: Urut ascending (A-Z, kecil-besar)
3. Klik kedua: Urut descending (Z-A, besar-kecil)
4. Indikator panah akan muncul di header

**Kolom yang Dapat Diurutkan:**
- NIK (alfabetis)
- Nama (alfabetis)
- Departemen (alfabetis)
- Transaksi Cash (numerik)
- Transaksi Bon (numerik)
- Simpanan (numerik)
- Outstanding (numerik)

### 6. Detail Transaksi 👁️

**Cara Menggunakan:**
1. Klik ikon **mata (👁️)** di kolom Aksi
2. Modal akan muncul menampilkan:
   - Daftar transaksi cash
   - Daftar transaksi bon
   - Total masing-masing
3. Klik **"Tutup"** atau **X** untuk menutup

**Informasi yang Ditampilkan:**
- No. Transaksi
- Tanggal
- Kasir
- Metode Pembayaran
- Total
- Status

### 7. Detail Simpanan 💰

**Cara Menggunakan:**
1. Klik ikon **uang (💰)** di kolom Aksi
2. Modal akan muncul menampilkan:
   - Simpanan Pokok (jumlah, tanggal)
   - Simpanan Wajib (jumlah, periode, tanggal)
   - Simpanan Sukarela (jumlah, tanggal)
   - Total masing-masing
3. Klik **"Tutup"** atau **X** untuk menutup

### 8. Export CSV 📥

**Cara Menggunakan:**
1. (Opsional) Terapkan filter untuk data yang ingin diekspor
2. Klik tombol **"Export CSV"**
3. File CSV akan otomatis terdownload
4. Nama file: `laporan_transaksi_simpanan_YYYY-MM-DD.csv`

**Kolom yang Diekspor:**
- NIK
- Nama
- No. Kartu
- Departemen
- Tipe Anggota
- Total Transaksi Cash
- Total Transaksi Bon
- Total Simpanan Pokok
- Total Simpanan Wajib
- Total Simpanan Sukarela
- Total Simpanan
- Outstanding Balance

**Catatan:**
- File kompatibel dengan Excel dan Google Sheets
- Baris terakhir berisi total keseluruhan
- Data yang diekspor sesuai dengan filter yang diterapkan

### 9. Print 🖨️

**Cara Menggunakan:**
1. (Opsional) Terapkan filter untuk data yang ingin dicetak
2. Klik tombol **"Print"**
3. Dialog cetak browser akan muncul
4. Pilih printer atau "Save as PDF"
5. Klik **"Print"**

**Format Cetak:**
- Header: Nama koperasi dan tanggal cetak
- Tabel data dengan semua kolom
- Footer: Total keseluruhan
- Layout rapi untuk media cetak

---

## Panduan Penggunaan

### Skenario 1: Mencari Data Anggota Tertentu

**Tujuan:** Menemukan data transaksi dan simpanan anggota bernama "Ahmad"

**Langkah:**
1. Buka menu Laporan Transaksi & Simpanan Anggota
2. Ketik "Ahmad" di kolom pencarian
3. Sistem akan menampilkan semua anggota dengan nama Ahmad
4. Klik ikon mata (👁️) untuk melihat detail transaksi
5. Klik ikon uang (💰) untuk melihat detail simpanan

### Skenario 2: Melihat Data Departemen Tertentu

**Tujuan:** Melihat semua anggota dari departemen IT

**Langkah:**
1. Buka menu Laporan Transaksi & Simpanan Anggota
2. Klik dropdown "Departemen"
3. Pilih "IT"
4. Tabel akan menampilkan hanya anggota IT
5. Statistik di atas akan diupdate sesuai filter

### Skenario 3: Mengekspor Data untuk Analisis

**Tujuan:** Mengekspor data semua anggota ke Excel

**Langkah:**
1. Buka menu Laporan Transaksi & Simpanan Anggota
2. (Opsional) Terapkan filter jika hanya ingin data tertentu
3. Klik tombol "Export CSV"
4. File akan terdownload otomatis
5. Buka file dengan Excel atau Google Sheets
6. Lakukan analisis sesuai kebutuhan

### Skenario 4: Mencetak Laporan untuk Rapat

**Tujuan:** Mencetak laporan untuk presentasi

**Langkah:**
1. Buka menu Laporan Transaksi & Simpanan Anggota
2. (Opsional) Terapkan filter untuk data yang relevan
3. Klik tombol "Print"
4. Di dialog cetak, pilih:
   - Printer: Pilih printer yang tersedia
   - Layout: Portrait atau Landscape
   - Pages: All
5. Klik "Print"

### Skenario 5: Melihat Anggota dengan Outstanding Terbesar

**Tujuan:** Identifikasi anggota dengan tagihan terbesar

**Langkah:**
1. Buka menu Laporan Transaksi & Simpanan Anggota
2. Klik header kolom "Outstanding"
3. Klik lagi untuk urut descending (terbesar ke terkecil)
4. Anggota dengan outstanding terbesar akan muncul di atas
5. Klik ikon mata untuk melihat detail transaksi bon

---

## Tips & Trik

### 💡 Tip 1: Gunakan Kombinasi Filter

Anda dapat menggunakan pencarian dan filter secara bersamaan:
- Pilih departemen "IT"
- Ketik "Ahmad" di pencarian
- Hasil: Semua anggota bernama Ahmad di departemen IT

### 💡 Tip 2: Refresh Data

Jika data tidak update:
1. Klik tombol "Reset Filter"
2. Atau refresh halaman (F5)
3. Data akan dimuat ulang dari server

### 💡 Tip 3: Pagination untuk Data Besar

Jika anggota lebih dari 25:
- Gunakan tombol navigasi halaman di bawah tabel
- Atau gunakan filter untuk mempersempit hasil

### 💡 Tip 4: Keyboard Shortcuts

- **Ctrl + F:** Fokus ke kolom pencarian
- **Esc:** Tutup modal detail
- **Ctrl + P:** Print (setelah klik tombol print)

### 💡 Tip 5: Export Data Terfilter

Untuk analisis spesifik:
1. Terapkan filter sesuai kebutuhan
2. Export CSV
3. Data yang diekspor hanya yang ditampilkan

### 💡 Tip 6: Responsive Design

Aplikasi dapat diakses dari:
- **Desktop:** Tampilan tabel lengkap
- **Tablet:** Tabel dengan scroll horizontal
- **Mobile:** Tampilan card yang mudah di-scroll

---

## Troubleshooting

### ❌ Masalah: Menu Tidak Muncul

**Penyebab:** Hak akses tidak sesuai

**Solusi:**
1. Pastikan Anda sudah login
2. Periksa role Anda (harus Admin/Kasir/Anggota)
3. Hubungi administrator jika masih tidak muncul

### ❌ Masalah: Data Tidak Muncul

**Penyebab:** Tidak ada data atau filter terlalu ketat

**Solusi:**
1. Klik tombol "Reset Filter"
2. Periksa apakah ada data anggota di sistem
3. Refresh halaman (F5)

### ❌ Masalah: Pencarian Tidak Bekerja

**Penyebab:** Kata kunci tidak cocok

**Solusi:**
1. Periksa ejaan kata kunci
2. Coba kata kunci yang lebih pendek
3. Gunakan filter departemen/tipe sebagai alternatif

### ❌ Masalah: Export CSV Gagal

**Penyebab:** Tidak ada data untuk diekspor

**Solusi:**
1. Pastikan ada data yang ditampilkan
2. Reset filter jika perlu
3. Coba lagi setelah beberapa saat

### ❌ Masalah: Print Tidak Muncul

**Penyebab:** Popup diblokir browser

**Solusi:**
1. Izinkan popup dari aplikasi ini
2. Klik tombol print lagi
3. Atau gunakan Ctrl + P setelah klik tombol

### ❌ Masalah: Modal Detail Tidak Terbuka

**Penyebab:** JavaScript error atau data tidak valid

**Solusi:**
1. Refresh halaman
2. Clear cache browser (Ctrl + Shift + Del)
3. Coba browser lain (Chrome/Firefox)

### ❌ Masalah: Statistik Tidak Update

**Penyebab:** Cache atau filter tidak diterapkan

**Solusi:**
1. Klik "Reset Filter" lalu terapkan filter lagi
2. Refresh halaman
3. Tunggu beberapa detik (debounce)

### ❌ Masalah: Sorting Tidak Bekerja

**Penyebab:** Data tidak valid atau JavaScript error

**Solusi:**
1. Refresh halaman
2. Coba kolom lain
3. Reset filter dan coba lagi

---

## FAQ

### Q1: Apakah anggota yang sudah keluar ditampilkan?

**A:** Tidak. Sistem otomatis mengecualikan anggota dengan status "Keluar" dari laporan.

### Q2: Berapa lama data di-cache?

**A:** Data di-cache selama 5 menit untuk performa optimal. Setelah itu, data akan dimuat ulang.

### Q3: Apakah bisa export ke format Excel langsung?

**A:** Saat ini hanya support CSV. Namun file CSV dapat dibuka langsung di Excel.

### Q4: Berapa maksimal data yang bisa ditampilkan?

**A:** Tidak ada batasan. Sistem menggunakan pagination (25 item per halaman) untuk performa optimal.

### Q5: Apakah data real-time?

**A:** Data dimuat saat halaman dibuka. Untuk data terbaru, refresh halaman atau klik "Reset Filter".

### Q6: Bisa filter berdasarkan tanggal?

**A:** Fitur filter tanggal belum tersedia di versi ini. Gunakan export CSV lalu filter di Excel.

### Q7: Apakah bisa melihat detail per periode?

**A:** Detail simpanan wajib menampilkan periode. Untuk detail lebih lanjut, gunakan menu simpanan.

### Q8: Bagaimana cara melihat transaksi yang sudah dibayar?

**A:** Klik ikon mata (👁️) di kolom Aksi, lalu lihat status transaksi (Lunas/Kredit).

### Q9: Apakah anggota bisa melihat data anggota lain?

**A:** Tidak. Anggota hanya bisa melihat data transaksi dan simpanan mereka sendiri.

### Q10: Bagaimana cara menghubungi support?

**A:** Hubungi administrator sistem atau IT support koperasi Anda.

---

## Informasi Tambahan

### Versi Aplikasi
- **Versi:** 1.0.0
- **Tanggal Rilis:** Desember 2024
- **Terakhir Diupdate:** Desember 2024

### Browser yang Didukung
- ✅ Google Chrome (Recommended)
- ✅ Mozilla Firefox
- ✅ Microsoft Edge
- ✅ Safari
- ❌ Internet Explorer (Tidak didukung)

### Perangkat yang Didukung
- ✅ Desktop (Windows, Mac, Linux)
- ✅ Tablet (iPad, Android Tablet)
- ✅ Mobile (iPhone, Android Phone)

### Kontak Support
- **Email:** support@koperasi.com
- **Telepon:** (021) 1234-5678
- **WhatsApp:** 0812-3456-7890

---

## Catatan Penting

⚠️ **Keamanan Data**
- Jangan share username dan password Anda
- Logout setelah selesai menggunakan aplikasi
- Laporkan aktivitas mencurigakan ke administrator

⚠️ **Backup Data**
- Export data secara berkala untuk backup
- Simpan file export di tempat yang aman
- Jangan edit data langsung di sistem tanpa izin

⚠️ **Performa**
- Gunakan browser terbaru untuk performa optimal
- Clear cache jika aplikasi lambat
- Tutup tab yang tidak digunakan

---

**Terima kasih telah menggunakan Aplikasi Koperasi!**

Jika ada pertanyaan atau masalah, jangan ragu untuk menghubungi tim support kami.

---

*Dokumen ini dibuat untuk membantu pengguna memaksimalkan penggunaan fitur Laporan Transaksi & Simpanan Anggota.*
