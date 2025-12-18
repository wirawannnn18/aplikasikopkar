# Panduan Lengkap Tutup Kasir Point of Sales

## Daftar Isi
1. [Pengenalan](#pengenalan)
2. [Panduan Kasir](#panduan-kasir)
3. [Panduan Supervisor](#panduan-supervisor)
4. [Panduan Admin](#panduan-admin)
5. [Keyboard Shortcuts](#keyboard-shortcuts)
6. [Troubleshooting](#troubleshooting)
7. [FAQ](#faq)

---

## Pengenalan

### Apa itu Tutup Kasir?
Tutup Kasir adalah proses penutupan shift kasir yang mencakup:
- Rekonsiliasi kas (mencocokkan kas fisik dengan catatan sistem)
- Perhitungan selisih kas
- Pencatatan keterangan jika ada selisih
- Pembuatan jurnal akuntansi otomatis
- Pencetakan laporan tutup kasir

### Mengapa Tutup Kasir Penting?
- ✅ Memastikan akuntabilitas kasir
- ✅ Mendeteksi kesalahan atau kehilangan kas
- ✅ Membuat audit trail yang lengkap
- ✅ Integrasi otomatis dengan sistem akuntansi
- ✅ Laporan yang dapat dicetak untuk arsip

### Istilah Penting
- **Modal Kasir**: Uang awal yang diberikan kepada kasir saat buka kas
- **Kas Seharusnya**: Modal awal + Total penjualan cash
- **Kas Aktual**: Jumlah uang fisik yang ada di kasir (hasil hitung manual)
- **Selisih Kas**: Perbedaan antara kas seharusnya dengan kas aktual
- **Shift**: Periode kerja kasir dari buka kas sampai tutup kas

---

## Panduan Kasir

### Langkah 1: Buka Kas (Memulai Shift)

**Sebelum melayani pelanggan pertama:**

1. Masuk ke sistem POS
2. Klik menu **"Keuangan"** → **"Buka Kas"**
3. Masukkan **Modal Awal** (uang yang Anda terima dari supervisor)
   - Contoh: Rp 500.000
4. Klik **"Buka Kas"**
5. Sistem akan menampilkan konfirmasi dan menyimpan data shift Anda

**Tips:**
- Pastikan modal awal yang Anda input sesuai dengan uang fisik yang Anda terima
- Catat nomor shift Anda untuk referensi

### Langkah 2: Melakukan Transaksi

**Selama shift berlangsung:**

1. Lakukan transaksi penjualan seperti biasa
2. Sistem otomatis mencatat semua transaksi dalam shift Anda
3. Perhatikan metode pembayaran (Cash/Kredit) karena akan mempengaruhi perhitungan tutup kasir

**Yang Perlu Diperhatikan:**
- Hanya transaksi **CASH** yang mempengaruhi kas fisik
- Transaksi **KREDIT** tidak mempengaruhi kas fisik
- Sistem otomatis memisahkan kedua jenis transaksi ini

### Langkah 3: Tutup Kasir (Mengakhiri Shift)

**Setelah selesai melayani pelanggan:**

#### 3.1 Akses Fitur Tutup Kasir

**Cara 1: Menggunakan Tombol**
1. Di halaman POS, cari tombol **"Tutup Kasir"** (warna kuning) di header
2. Klik tombol tersebut

**Cara 2: Menggunakan Keyboard Shortcut**
- Tekan **F10** untuk membuka modal tutup kasir langsung

#### 3.2 Periksa Ringkasan Penjualan

Modal tutup kasir akan menampilkan:

**Informasi Shift:**
- Nama kasir: [Nama Anda]
- Waktu buka: [Jam buka kas]
- Modal awal: Rp [Jumlah modal]

**Ringkasan Penjualan:**
- Total penjualan: Rp [Total semua transaksi]
- Penjualan cash: Rp [Total transaksi cash]
- Penjualan kredit: Rp [Total transaksi kredit]
- Jumlah transaksi: [Jumlah]

**Perhitungan Kas:**
- Kas seharusnya: Rp [Modal awal + Penjualan cash]

#### 3.3 Hitung Kas Fisik

**PENTING: Lakukan dengan teliti!**

1. Hitung semua uang fisik di kasir Anda:
   - Uang kertas (semua pecahan)
   - Uang logam (semua pecahan)
   - Jangan lupa cek laci bawah dan tempat tersembunyi

2. Total semua uang = **Kas Aktual**

**Tips Menghitung:**
- Pisahkan per pecahan untuk memudahkan
- Hitung dua kali untuk memastikan
- Minta bantuan rekan jika perlu

#### 3.4 Input Kas Aktual

1. Masukkan jumlah kas aktual di field **"Kas Aktual"**
2. Sistem akan otomatis menghitung **Selisih Kas**

**Interpretasi Selisih:**
- **Selisih = 0** (Hijau): Kas sesuai, sempurna! ✅
- **Selisih > 0** (Kuning): Kas lebih, ada uang berlebih ⚠️
- **Selisih < 0** (Merah): Kas kurang, ada kekurangan ❌

#### 3.5 Isi Keterangan (Jika Ada Selisih)

**Jika ada selisih (lebih atau kurang):**

1. Field **"Keterangan Selisih"** akan muncul otomatis
2. **WAJIB** diisi dengan penjelasan yang jelas

**Contoh Keterangan yang Baik:**
- ✅ "Salah kembalian ke pelanggan Rp 10.000"
- ✅ "Uang pecahan Rp 5.000 sobek, tidak diterima pelanggan"
- ✅ "Lupa input transaksi cash Rp 50.000"

**Contoh Keterangan yang Kurang Baik:**
- ❌ "Tidak tahu"
- ❌ "Lupa"
- ❌ "Salah hitung"

#### 3.6 Proses Tutup Kasir

1. Pastikan semua data sudah benar
2. Klik tombol **"Proses Tutup Kasir"**
3. Sistem akan:
   - Menyimpan data tutup kasir
   - Membuat jurnal akuntansi otomatis (jika ada selisih)
   - Membersihkan data shift
   - Membuka window print untuk laporan

#### 3.7 Cetak Laporan

1. Window print akan terbuka otomatis
2. Periksa laporan di preview
3. Klik **"Print"** atau **Ctrl+P**
4. Serahkan laporan cetak ke supervisor

**Jika Print Gagal:**
- Sistem akan menawarkan alternatif:
  - **Coba Lagi**: Retry print
  - **Download PDF**: Simpan sebagai file
  - **Kirim Email**: Email laporan
  - **Simpan Data**: Simpan untuk print nanti

### Langkah 4: Serah Terima dengan Supervisor

1. Serahkan laporan cetak tutup kasir
2. Serahkan uang kas aktual
3. Jelaskan jika ada selisih
4. Minta tanda tangan supervisor di laporan

---

## Panduan Supervisor

### Monitoring Shift Kasir

#### Memeriksa Status Shift Aktif

1. Masuk ke menu **"Keuangan"** → **"Riwayat Tutup Kasir"**
2. Lihat kasir mana yang belum tutup kasir
3. Ingatkan kasir untuk tutup kasir sebelum logout

#### Menerima Serah Terima

**Saat kasir selesai shift:**

1. Terima laporan cetak tutup kasir
2. Periksa informasi berikut:
   - ✅ Nama kasir dan waktu shift
   - ✅ Total penjualan dan jumlah transaksi
   - ✅ Kas seharusnya vs kas aktual
   - ✅ Selisih kas (jika ada)
   - ✅ Keterangan selisih (jika ada)

3. Hitung ulang kas fisik yang diserahkan
4. Cocokkan dengan kas aktual di laporan

**Jika Sesuai:**
- Tanda tangani laporan
- Terima kas dari kasir
- Simpan laporan untuk arsip

**Jika Tidak Sesuai:**
- Hitung ulang bersama kasir
- Perbaiki data jika perlu
- Dokumentasikan perbedaan

### Mengakses Riwayat Tutup Kasir

1. Masuk ke menu **"Keuangan"** → **"Riwayat Tutup Kasir"**
2. Sistem menampilkan tabel dengan semua riwayat

**Informasi yang Ditampilkan:**
- No. Laporan (TK-xxxxx)
- Tanggal dan jam shift
- Nama kasir
- Durasi shift
- Modal awal
- Total penjualan
- Kas aktual
- Selisih (dengan color coding)

**Color Coding Selisih:**
- 🟢 **Hijau**: Kas sesuai (selisih = 0)
- 🟡 **Kuning**: Kas lebih (selisih > 0)
- 🔴 **Merah**: Kas kurang (selisih < 0)

### Melihat Detail Laporan

1. Klik tombol **"Detail"** pada baris yang ingin dilihat
2. Modal detail akan menampilkan informasi lengkap:
   - Informasi shift
   - Ringkasan penjualan
   - Perhitungan kas
   - Keterangan selisih (jika ada)
   - Jurnal yang dibuat (jika ada)

### Print Ulang Laporan

**Jika perlu print ulang:**

1. Klik tombol **"Print"** pada baris yang ingin dicetak
2. Window print akan terbuka
3. Cetak laporan

### Export Data

**Untuk analisis atau arsip:**

1. Klik tombol **"Export Excel"** di atas tabel
2. File CSV akan terdownload
3. Buka dengan Excel atau Google Sheets

**Data yang Di-export:**
- Semua kolom dari tabel riwayat
- Format CSV untuk kompatibilitas maksimal

### Analisis Selisih Kas

**Monitoring Performa Kasir:**

1. Perhatikan kasir dengan selisih kas berulang
2. Baca keterangan selisih untuk pola
3. Berikan training jika diperlukan

**Tindak Lanjut:**
- Selisih kecil (<Rp 10.000): Peringatan lisan
- Selisih sedang (Rp 10.000-50.000): Peringatan tertulis
- Selisih besar (>Rp 50.000): Investigasi mendalam

---

## Panduan Admin

### Integrasi Akuntansi

#### Jurnal Otomatis untuk Selisih Kas

**Sistem otomatis membuat jurnal saat ada selisih:**

**Kasus 1: Kas Lebih (Selisih Positif)**
```
Tanggal: [Tanggal tutup kasir]
Keterangan: Selisih Kas Tutup Kasir - [Nama Kasir]

Debit:  Kas                      Rp [Selisih]
Kredit: Pendapatan Lain-lain     Rp [Selisih]
```

**Kasus 2: Kas Kurang (Selisih Negatif)**
```
Tanggal: [Tanggal tutup kasir]
Keterangan: Selisih Kas Tutup Kasir - [Nama Kasir]

Debit:  Beban Lain-lain          Rp [Selisih]
Kredit: Kas                      Rp [Selisih]
```

#### Mapping Chart of Accounts (COA)

**Akun yang Digunakan:**
- **1001 - Kas**: Akun kas utama
- **4002 - Pendapatan Lain-lain**: Untuk kas lebih
- **5002 - Beban Lain-lain**: Untuk kas kurang

**Konfigurasi:**
- Mapping COA ada di `js/enhanced-accounting-integration.js`
- Dapat disesuaikan sesuai kebutuhan koperasi

### Data Storage dan Backup

#### LocalStorage Structure

**Key: `riwayatTutupKas`**
```json
[
  {
    "id": "TK1234567890",
    "shiftId": "BK1234567890",
    "kasir": "Nama Kasir",
    "kasirId": "K001",
    "waktuBuka": "2024-01-15T08:00:00Z",
    "waktuTutup": "2024-01-15T16:00:00Z",
    "modalAwal": 500000,
    "totalPenjualan": 2500000,
    "totalCash": 2000000,
    "totalKredit": 500000,
    "kasSeharusnya": 2500000,
    "kasAktual": 2495000,
    "selisih": -5000,
    "keteranganSelisih": "Salah kembalian Rp 5.000",
    "jumlahTransaksi": 45,
    "tanggalTutup": "15/01/2024"
  }
]
```

#### Backup Strategy

**Otomatis:**
- Sistem membuat backup sebelum setiap operasi critical
- Key backup: `riwayatTutupKas_backup`
- Key backup session: `bukaKas_backup`

**Manual:**
- Export data secara berkala
- Simpan file CSV di server/cloud
- Jadwal backup: Harian/Mingguan

### Error Handling dan Recovery

#### Session Recovery

**Jika session corrupted:**
1. Sistem otomatis coba restore dari backup
2. Jika gagal, kasir diminta buka kas ulang
3. Data transaksi tetap aman

#### Print Failure Recovery

**Jika print gagal:**
1. Sistem tawarkan alternatif (PDF, Email, Save)
2. Data tetap tersimpan
3. Bisa print ulang dari riwayat

#### Storage Quota Exceeded

**Jika localStorage penuh:**
1. Sistem otomatis cleanup data lama
2. Keep 50 record terbaru
3. Export data lama sebelum cleanup

### Monitoring dan Audit

#### Error Log

**Akses error log:**
1. Buka browser console (F12)
2. Cari key `errorLog` di localStorage
3. Export untuk analisis

**Atau gunakan:**
```javascript
window.errorHandler.exportErrorLog()
```

#### Audit Trail

**Setiap tutup kasir tercatat:**
- Timestamp lengkap
- User yang melakukan
- Data sebelum dan sesudah
- Jurnal yang dibuat

---

## Keyboard Shortcuts

### Shortcut Utama

| Shortcut | Fungsi | Keterangan |
|----------|--------|------------|
| **F10** | Buka Modal Tutup Kasir | Dari halaman POS |
| **Esc** | Tutup Modal | Dari modal tutup kasir |
| **Tab** | Navigasi Field | Pindah antar input field |
| **Shift+Tab** | Navigasi Mundur | Pindah ke field sebelumnya |
| **Enter** | Submit Form | Dari field terakhir |
| **Ctrl+P** | Print Laporan | Dari window print |

### Tips Keyboard Navigation

1. **Buka Modal**: Tekan **F10**
2. **Input Kas Aktual**: Otomatis focus, langsung ketik
3. **Pindah ke Keterangan**: Tekan **Tab**
4. **Submit**: Tekan **Tab** sampai tombol, lalu **Enter**

---

## Troubleshooting

### Masalah Umum dan Solusi

#### 1. Tombol Tutup Kasir Tidak Muncul

**Gejala:**
- Tombol "Tutup Kasir" tidak terlihat di header POS

**Penyebab Mungkin:**
- Belum buka kas
- Session data hilang
- Browser cache issue

**Solusi:**
1. Pastikan sudah buka kas terlebih dahulu
2. Refresh halaman (F5)
3. Logout dan login kembali
4. Clear browser cache jika masih bermasalah

#### 2. Modal Tutup Kasir Tidak Terbuka

**Gejala:**
- Klik tombol "Tutup Kasir" tidak ada respon
- Atau muncul error

**Solusi:**
1. Buka browser console (F12)
2. Lihat error message
3. Refresh halaman
4. Jika masih error, hubungi admin

**Error Umum:**
- "Session tidak ditemukan": Buka kas ulang
- "Data corrupted": Logout dan login kembali

#### 3. Perhitungan Selisih Salah

**Gejala:**
- Selisih kas tidak sesuai dengan perhitungan manual

**Penyebab:**
- Input kas aktual salah
- Ada transaksi yang belum tercatat
- Bug sistem (jarang)

**Solusi:**
1. Periksa ulang input kas aktual
2. Hitung ulang kas fisik
3. Periksa riwayat transaksi di shift
4. Jika yakin benar, screenshot dan hubungi admin

#### 4. Print Tidak Berfungsi

**Gejala:**
- Window print tidak terbuka
- Print tapi tidak keluar

**Solusi:**
1. **Popup Blocker**: Allow popup dari aplikasi
2. **Printer Offline**: Cek koneksi printer
3. **Gunakan Alternatif**:
   - Download PDF
   - Kirim email
   - Print ulang dari riwayat

#### 5. Data Tidak Tersimpan

**Gejala:**
- Setelah tutup kasir, data tidak muncul di riwayat

**Penyebab:**
- localStorage penuh
- Browser private mode
- Error saat save

**Solusi:**
1. Cek localStorage quota
2. Jangan gunakan private/incognito mode
3. Sistem ada backup, hubungi admin untuk restore

#### 6. Logout Warning Tidak Muncul

**Gejala:**
- Bisa logout meskipun shift masih aktif

**Solusi:**
- Ini adalah bug, segera tutup kasir sebelum logout
- Hubungi admin untuk fix

#### 7. Riwayat Tidak Muncul

**Gejala:**
- Menu riwayat tutup kasir kosong

**Penyebab:**
- Belum ada data tutup kasir
- Filter tanggal terlalu sempit
- Data corrupted

**Solusi:**
1. Pastikan sudah ada tutup kasir sebelumnya
2. Reset filter tanggal
3. Refresh halaman
4. Cek localStorage key `riwayatTutupKas`

### Error Messages dan Artinya

| Error Message | Arti | Solusi |
|---------------|------|--------|
| "Belum ada kas yang dibuka" | Session buka kas tidak ditemukan | Buka kas terlebih dahulu |
| "Kas aktual harus diisi" | Field kas aktual kosong | Input jumlah kas aktual |
| "Keterangan wajib diisi" | Ada selisih tapi keterangan kosong | Isi keterangan selisih |
| "Penyimpanan penuh" | localStorage quota exceeded | Sistem akan cleanup otomatis |
| "Session rusak" | Data session corrupted | Logout dan login kembali |
| "Gagal mencetak" | Print operation failed | Gunakan alternatif (PDF/Email) |

### Kapan Harus Hubungi Admin

**Segera hubungi admin jika:**
- ❌ Data hilang atau corrupted
- ❌ Perhitungan selisih konsisten salah
- ❌ Error berulang meskipun sudah dicoba solusi
- ❌ Fitur tidak berfungsi sama sekali
- ❌ Jurnal akuntansi tidak terbuat

**Informasi yang Perlu Disiapkan:**
- Screenshot error message
- Langkah yang sudah dicoba
- Waktu kejadian
- Browser dan versi yang digunakan

---

## FAQ (Frequently Asked Questions)

### Umum

**Q: Apakah wajib tutup kasir setiap hari?**
A: Ya, setiap kasir wajib tutup kasir di akhir shift untuk akuntabilitas dan audit trail.

**Q: Bisa tutup kasir tanpa ada transaksi?**
A: Ya, bisa. Kas seharusnya = Modal awal, dan kas aktual harus sama dengan modal awal.

**Q: Berapa lama proses tutup kasir?**
A: Sekitar 5-10 menit, tergantung kecepatan menghitung kas fisik.

### Tentang Selisih Kas

**Q: Selisih kas berapa yang masih wajar?**
A: Idealnya 0, tapi selisih <Rp 5.000 masih bisa ditoleransi untuk shift panjang dengan banyak transaksi.

**Q: Apa yang terjadi jika ada selisih kas?**
A: Sistem otomatis membuat jurnal akuntansi. Supervisor akan review dan mungkin ada tindak lanjut.

**Q: Bisa edit data tutup kasir setelah submit?**
A: Tidak bisa. Data sudah final dan tercatat untuk audit. Jika ada kesalahan, hubungi admin.

### Tentang Laporan

**Q: Laporan tutup kasir untuk apa?**
A: Untuk dokumentasi, audit trail, dan serah terima dengan supervisor.

**Q: Harus print atau bisa digital saja?**
A: Sebaiknya print untuk tanda tangan supervisor. Tapi bisa juga digital jika ada kebijakan khusus.

**Q: Bisa print ulang laporan?**
A: Ya, dari menu "Riwayat Tutup Kasir", klik tombol "Print" pada baris yang diinginkan.

### Tentang Teknis

**Q: Data disimpan dimana?**
A: Di localStorage browser. Pastikan tidak clear browser data atau gunakan private mode.

**Q: Aman tidak data di localStorage?**
A: Relatif aman untuk data operasional. Tapi tetap perlu backup berkala ke server.

**Q: Bisa akses dari HP?**
A: Bisa, tapi lebih optimal di desktop/laptop karena ukuran layar dan keyboard.

### Tentang Akuntansi

**Q: Jurnal otomatis langsung masuk ke laporan keuangan?**
A: Ya, jurnal langsung terintegrasi dengan sistem akuntansi.

**Q: Bisa lihat jurnal yang dibuat?**
A: Ya, di menu "Jurnal Umum" atau di detail laporan tutup kasir.

**Q: Akun apa yang dipakai untuk selisih kas?**
A: Kas lebih → Pendapatan Lain-lain, Kas kurang → Beban Lain-lain.

---

## Lampiran

### Checklist Tutup Kasir

**Sebelum Tutup Kasir:**
- [ ] Semua transaksi sudah diinput
- [ ] Tidak ada pelanggan yang menunggu
- [ ] Siap menghitung kas fisik

**Saat Tutup Kasir:**
- [ ] Buka modal tutup kasir (F10)
- [ ] Periksa ringkasan penjualan
- [ ] Hitung kas fisik dengan teliti
- [ ] Input kas aktual
- [ ] Isi keterangan jika ada selisih
- [ ] Klik "Proses Tutup Kasir"
- [ ] Print laporan

**Setelah Tutup Kasir:**
- [ ] Serahkan laporan ke supervisor
- [ ] Serahkan kas fisik
- [ ] Minta tanda tangan supervisor
- [ ] Simpan copy laporan (jika perlu)

### Kontak Support

**Untuk bantuan teknis:**
- Email: support@koperasi.com
- Telp: (021) 1234-5678
- WhatsApp: 0812-3456-7890

**Jam operasional support:**
- Senin-Jumat: 08:00 - 17:00
- Sabtu: 08:00 - 12:00
- Minggu/Libur: Emergency only

---

**Versi Dokumen:** 1.0
**Terakhir Diupdate:** Desember 2024
**Dibuat oleh:** Tim Development Koperasi

---

*Dokumen ini adalah panduan lengkap untuk fitur Tutup Kasir POS. Untuk pertanyaan lebih lanjut, silakan hubungi tim support.*
