# Workflow Guide - Pembayaran Manual

## Overview
Panduan lengkap untuk memproses pembayaran hutang/piutang secara manual (satuan) menggunakan tab Pembayaran Manual dalam interface terintegrasi.

## Prasyarat
- ✅ Login sebagai kasir atau admin
- ✅ Akses ke menu Pembayaran Hutang Piutang
- ✅ Koneksi internet stabil
- ✅ Browser modern (Chrome, Firefox, Edge)

## Workflow Pembayaran Hutang

### Skenario: Anggota Membayar Hutang

#### Langkah 1: Akses Menu
1. Buka aplikasi koperasi
2. Klik menu **"Pembayaran Hutang Piutang"** di sidebar
3. Pastikan tab **"Pembayaran Manual"** aktif (tab pertama)

#### Langkah 2: Pilih Jenis Pembayaran
1. Klik radio button **"Hutang"**
2. Interface akan menampilkan form untuk pembayaran hutang

#### Langkah 3: Cari dan Pilih Anggota
1. Klik field **"Cari Anggota"**
2. Ketik minimal 2 karakter (nama/nomor anggota)
3. Tunggu dropdown autocomplete muncul
4. Pilih anggota yang sesuai dari daftar
5. Sistem akan menampilkan:
   - Nama lengkap anggota
   - Nomor anggota
   - Saldo hutang saat ini

#### Langkah 4: Input Jumlah Pembayaran
1. Masukkan jumlah pembayaran di field **"Jumlah"**
2. Sistem akan validasi:
   - ✅ Tidak boleh melebihi saldo hutang
   - ✅ Harus berupa angka positif
   - ✅ Format angka harus valid
3. Lihat preview saldo setelah pembayaran

#### Langkah 5: Tambahkan Keterangan (Opsional)
1. Klik field **"Keterangan"**
2. Masukkan catatan tambahan jika diperlukan
3. Contoh: "Cicilan bulan Desember 2024"

#### Langkah 6: Proses Pembayaran
1. Klik tombol **"Proses Pembayaran"**
2. Dialog konfirmasi akan muncul dengan detail:
   - Nama anggota
   - Jenis pembayaran
   - Jumlah pembayaran
   - Saldo sebelum dan sesudah
3. Klik **"Ya, Proses"** untuk melanjutkan
4. Atau klik **"Batal"** untuk membatalkan

#### Langkah 7: Konfirmasi dan Cetak Bukti
1. Notifikasi sukses akan muncul
2. Dialog cetak bukti akan ditampilkan
3. Pilihan:
   - **"Cetak Bukti"**: Mencetak bukti pembayaran
   - **"Tutup"**: Menutup dialog tanpa cetak
4. Bukti pembayaran berisi:
   - Nomor transaksi
   - Tanggal dan waktu
   - Data anggota
   - Detail pembayaran
   - Tanda tangan kasir

#### Langkah 8: Verifikasi Transaksi
1. Scroll ke bagian **"Riwayat Transaksi"**
2. Transaksi terbaru akan muncul di baris pertama
3. Verifikasi data:
   - ✅ Nama anggota benar
   - ✅ Jumlah pembayaran sesuai
   - ✅ Status "Berhasil"
   - ✅ Mode "Manual"

## Workflow Pembayaran Piutang

### Skenario: Koperasi Membayar Piutang ke Anggota

#### Langkah 1-2: Akses dan Pilih Jenis
1. Akses menu Pembayaran Hutang Piutang
2. Klik radio button **"Piutang"**

#### Langkah 3: Cari dan Pilih Anggota
1. Cari anggota yang memiliki piutang
2. Sistem akan menampilkan saldo piutang

#### Langkah 4: Input Jumlah Pembayaran
1. Masukkan jumlah yang akan dibayarkan
2. Validasi tambahan untuk piutang:
   - ✅ Saldo kas koperasi harus mencukupi
   - ✅ Tidak boleh melebihi saldo piutang

#### Langkah 5-8: Sama dengan Pembayaran Hutang
Ikuti langkah 5-8 dari workflow pembayaran hutang

## Tips dan Best Practices

### Pencarian Anggota Efektif
- 🔍 Gunakan nomor anggota untuk pencarian cepat
- 🔍 Ketik nama lengkap untuk hasil akurat
- 🔍 Tunggu 1-2 detik untuk autocomplete loading
- 🔍 Jika tidak muncul, coba refresh halaman

### Validasi Sebelum Proses
- ✅ Pastikan anggota yang dipilih sudah benar
- ✅ Cek saldo hutang/piutang sebelum input jumlah
- ✅ Verifikasi jumlah pembayaran sesuai kesepakatan
- ✅ Tambahkan keterangan untuk dokumentasi

### Penanganan Error
- ❌ **"Saldo tidak mencukupi"**: Kurangi jumlah pembayaran
- ❌ **"Anggota tidak ditemukan"**: Periksa status anggota
- ❌ **"Koneksi gagal"**: Periksa internet, coba lagi
- ❌ **"Session expired"**: Login ulang

### Cetak Bukti
- 📄 Selalu cetak bukti untuk transaksi besar
- 📄 Simpan bukti sebagai dokumentasi
- 📄 Minta tanda tangan anggota pada bukti
- 📄 Arsipkan bukti sesuai prosedur koperasi

## Skenario Khusus

### Pembayaran Sebagian (Cicilan)
1. Input jumlah cicilan (tidak harus penuh)
2. Tambahkan keterangan: "Cicilan ke-X dari Y"
3. Proses seperti biasa
4. Saldo hutang akan berkurang sesuai cicilan

### Pembayaran Penuh (Lunas)
1. Input jumlah sesuai total saldo hutang
2. Tambahkan keterangan: "Pelunasan hutang"
3. Proses pembayaran
4. Saldo hutang akan menjadi 0

### Pembayaran Multiple Anggota
1. Proses pembayaran anggota pertama
2. Setelah selesai, form akan reset otomatis
3. Langsung proses anggota berikutnya
4. Tidak perlu refresh atau pindah halaman

### Koreksi Kesalahan Input
**Sebelum klik "Proses Pembayaran"**:
- Edit langsung di form
- Ubah anggota, jumlah, atau keterangan

**Setelah klik "Proses Pembayaran"**:
- Klik "Batal" di dialog konfirmasi
- Form akan tetap terisi, bisa diedit

**Setelah transaksi berhasil**:
- Tidak bisa diedit langsung
- Hubungi admin untuk koreksi
- Admin dapat melakukan reversal jika diperlukan

## Integrasi dengan Tab Import

### Kapan Menggunakan Manual vs Import
**Gunakan Pembayaran Manual jika**:
- ✅ Pembayaran satuan/individual
- ✅ Anggota datang langsung ke kasir
- ✅ Jumlah transaksi sedikit (< 10)
- ✅ Perlu interaksi langsung dengan anggota

**Gunakan Import Batch jika**:
- ✅ Pembayaran massal (> 10 anggota)
- ✅ Data sudah tersedia dalam file
- ✅ Pembayaran rutin bulanan
- ✅ Perlu efisiensi waktu

### Beralih ke Tab Import
1. Klik tab **"Import Batch"**
2. Jika ada data belum tersimpan:
   - Dialog konfirmasi akan muncul
   - Pilih "Simpan & Lanjut" atau "Buang & Lanjut"
3. Tab Import akan terbuka
4. Lihat panduan workflow import batch

### Monitoring Transaksi Gabungan
1. Scroll ke **"Riwayat Transaksi"**
2. Lihat transaksi dari kedua mode
3. Gunakan filter **"Mode"** untuk memisahkan:
   - Manual: Transaksi dari tab manual
   - Import: Transaksi dari tab import
   - Semua: Gabungan kedua mode

## Checklist Harian Kasir

### Sebelum Mulai Shift
- [ ] Login ke aplikasi
- [ ] Cek koneksi internet
- [ ] Verifikasi saldo kas awal
- [ ] Buka menu Pembayaran Hutang Piutang
- [ ] Pastikan tab Manual aktif

### Selama Shift
- [ ] Proses setiap pembayaran dengan teliti
- [ ] Cetak bukti untuk transaksi penting
- [ ] Verifikasi setiap transaksi di riwayat
- [ ] Catat transaksi bermasalah (jika ada)
- [ ] Refresh dashboard secara berkala

### Setelah Shift
- [ ] Review semua transaksi hari ini
- [ ] Export laporan harian
- [ ] Verifikasi total pembayaran
- [ ] Serahkan bukti ke admin
- [ ] Logout dari aplikasi

## FAQ

**Q: Apakah bisa membatalkan transaksi yang sudah diproses?**  
A: Tidak bisa langsung. Hubungi admin untuk reversal transaksi.

**Q: Bagaimana jika anggota tidak muncul di autocomplete?**  
A: Pastikan anggota terdaftar dan aktif. Hubungi admin jika masalah berlanjut.

**Q: Apakah bisa memproses pembayaran tanpa koneksi internet?**  
A: Tidak. Aplikasi memerlukan koneksi internet untuk sinkronisasi data.

**Q: Berapa lama transaksi muncul di riwayat?**  
A: Langsung setelah transaksi berhasil (real-time).

**Q: Apakah ada limit jumlah transaksi per hari?**  
A: Tidak ada limit, tapi disarankan gunakan import batch untuk > 10 transaksi.

---

**Versi Dokumen**: 1.0  
**Tanggal Update**: Desember 2024  
**Untuk Pertanyaan**: Hubungi admin atau support koperasi