# Panduan Pengguna: Pengelolaan Anggota Keluar

## Daftar Isi
1. [Pengenalan](#pengenalan)
2. [Proses Anggota Keluar](#proses-anggota-keluar)
3. [Proses Pengembalian Simpanan](#proses-pengembalian-simpanan)
4. [Laporan Anggota Keluar](#laporan-anggota-keluar)
5. [Aturan Validasi](#aturan-validasi)
6. [Pembatalan Status Keluar](#pembatalan-status-keluar)
7. [Troubleshooting](#troubleshooting)

---

## Pengenalan

Fitur Pengelolaan Anggota Keluar memungkinkan administrator untuk menangani proses formal ketika seorang anggota memutuskan untuk keluar dari keanggotaan koperasi. Sistem ini mencakup:

- Pencatatan status keluar anggota
- Perhitungan otomatis pengembalian simpanan
- Proses pengembalian simpanan pokok dan wajib
- Integrasi dengan sistem akuntansi
- Laporan dan audit trail lengkap

### Hak Akses
Fitur ini hanya dapat diakses oleh pengguna dengan role:
- **Admin**: Akses penuh untuk semua fitur
- **Bendahara**: Dapat memproses pengembalian
- **Semua Role**: Dapat melihat laporan (read-only)

---

## Proses Anggota Keluar

### Langkah 1: Menandai Anggota Keluar

1. **Buka Halaman Master Anggota**
   - Klik menu "Master Data" → "Master Anggota"
   - Sistem akan menampilkan daftar semua anggota

2. **Pilih Anggota yang Akan Keluar**
   - Cari anggota menggunakan fitur pencarian atau scroll daftar
   - Pastikan anggota memiliki status "Aktif"
   - Klik tombol "Anggota Keluar" (ikon dengan warna kuning/warning)

3. **Isi Form Anggota Keluar**
   
   Form akan menampilkan:
   - **NIK**: Nomor identitas anggota (otomatis)
   - **Nama**: Nama lengkap anggota (otomatis)
   - **Departemen**: Departemen anggota (otomatis)
   - **Tanggal Keluar**: Pilih tanggal keluar (wajib diisi)
   - **Alasan Keluar**: Masukkan alasan keluar (wajib diisi, minimal 10 karakter)

4. **Simpan Data**
   - Klik tombol "Simpan"
   - Sistem akan memvalidasi data
   - Jika berhasil, status anggota berubah menjadi "Keluar"
   - Notifikasi sukses akan muncul

### Hasil Setelah Menandai Keluar

Setelah anggota ditandai keluar:
- ✅ Status anggota berubah menjadi "Keluar"
- ✅ Semua data historis tetap tersimpan
- ✅ Status pengembalian diset ke "Pending"
- ✅ Anggota tidak dapat melakukan transaksi baru:
  - Simpanan Pokok
  - Simpanan Wajib
  - Pinjaman
  - Transaksi POS
- ✅ Audit log tercatat otomatis

### Indikator Visual

Anggota dengan status "Keluar" akan ditampilkan dengan:
- Badge status "Keluar" berwarna merah
- Baris tabel dengan background berbeda
- Tombol transaksi dinonaktifkan
- Tombol "Proses Pengembalian" muncul

---

## Proses Pengembalian Simpanan

### Langkah 1: Melihat Detail Pengembalian

1. **Buka Detail Anggota Keluar**
   - Dari daftar anggota, klik tombol "Proses Pengembalian" pada anggota dengan status "Keluar"
   - Atau klik nama anggota untuk melihat detail

2. **Review Perhitungan Otomatis**
   
   Sistem akan menampilkan:
   
   ```
   ┌─────────────────────────────────────────┐
   │ RINCIAN PENGEMBALIAN SIMPANAN           │
   ├─────────────────────────────────────────┤
   │ Simpanan Pokok:        Rp 1.000.000     │
   │ Simpanan Wajib:        Rp 2.500.000     │
   │ ─────────────────────────────────────── │
   │ Total Simpanan:        Rp 3.500.000     │
   │                                          │
   │ Kewajiban Lain:        Rp   150.000     │
   │ ─────────────────────────────────────── │
   │ TOTAL PENGEMBALIAN:    Rp 3.350.000     │
   └─────────────────────────────────────────┘
   ```

### Langkah 2: Validasi Otomatis

Sistem akan melakukan validasi:

✅ **Validasi yang Dilakukan:**
1. Tidak ada pinjaman aktif
2. Saldo kas/bank mencukupi
3. Metode pembayaran dipilih

❌ **Jika Validasi Gagal:**
- Pesan error akan ditampilkan dengan jelas
- Tombol "Proses Pengembalian" dinonaktifkan
- Perbaiki masalah sebelum melanjutkan

### Langkah 3: Proses Pengembalian

1. **Isi Form Pengembalian**
   
   - **Metode Pembayaran**: Pilih salah satu
     - Kas
     - Transfer Bank
   
   - **Tanggal Pembayaran**: Pilih tanggal (default: hari ini)
   
   - **Keterangan**: Opsional, catatan tambahan

2. **Konfirmasi Pengembalian**
   - Klik tombol "Proses Pengembalian"
   - Dialog konfirmasi akan muncul
   - Review sekali lagi total pengembalian
   - Klik "Ya, Proses" untuk melanjutkan

3. **Proses Berjalan**
   - Loading indicator akan muncul
   - Sistem memproses:
     - Membuat record pengembalian
     - Membuat jurnal akuntansi (debit & kredit)
     - Mengurangi saldo simpanan menjadi nol
     - Update status pengembalian ke "Selesai"
     - Mencatat audit log

4. **Pengembalian Selesai**
   - Notifikasi sukses muncul
   - Tombol "Cetak Bukti" tersedia
   - Status pengembalian berubah menjadi "Selesai"

### Langkah 4: Cetak Bukti Pengembalian

1. **Klik Tombol "Cetak Bukti Pengembalian"**
   - Bukti akan terbuka di tab/window baru
   - Format siap cetak

2. **Isi Bukti Pengembalian**
   
   Bukti mencakup:
   - Header koperasi
   - Nomor referensi transaksi
   - Data anggota (NIK, Nama, Tanggal Keluar)
   - Rincian simpanan:
     - Simpanan Pokok
     - Simpanan Wajib
     - Kewajiban (jika ada)
     - Total Pengembalian
   - Metode pembayaran
   - Tanggal pembayaran
   - Area tanda tangan:
     - Penerima (Anggota)
     - Pemberi (Bendahara)
     - Mengetahui (Ketua)

3. **Cetak atau Simpan**
   - Gunakan Ctrl+P atau menu Print browser
   - Atau simpan sebagai PDF

---

## Laporan Anggota Keluar

### Mengakses Laporan

1. **Buka Menu Laporan**
   - Klik menu "Laporan" → "Laporan Anggota Keluar"

2. **Tampilan Laporan**
   
   Tabel menampilkan kolom:
   - NIK
   - Nama Anggota
   - Departemen
   - Tanggal Keluar
   - Status Pengembalian (Pending/Selesai)
   - Total Pengembalian
   - Aksi (Detail/Cetak Bukti)

### Filter Berdasarkan Periode

1. **Gunakan Filter Tanggal**
   
   - **Tanggal Mulai**: Pilih tanggal awal periode
   - **Tanggal Akhir**: Pilih tanggal akhir periode
   - Klik "Filter"

2. **Hasil Filter**
   - Hanya anggota yang keluar dalam periode tersebut yang ditampilkan
   - Jumlah record ditampilkan di bawah tabel

### Ekspor ke CSV

1. **Klik Tombol "Export CSV"**
   - File CSV akan diunduh otomatis
   - Nama file: `laporan-anggota-keluar-YYYY-MM-DD-HHMMSS.csv`

2. **Isi File CSV**
   
   Kolom yang diekspor:
   - NIK
   - Nama
   - Departemen
   - Tanggal Keluar
   - Alasan Keluar
   - Status Pengembalian
   - Tanggal Pengembalian
   - Simpanan Pokok
   - Simpanan Wajib
   - Kewajiban Lain
   - Total Pengembalian
   - Metode Pembayaran
   - Referensi Transaksi

3. **Gunakan Data CSV**
   - Buka dengan Excel atau Google Sheets
   - Gunakan untuk analisis atau arsip

---

## Aturan Validasi

### Validasi Saat Menandai Keluar

| Kondisi | Validasi | Pesan Error |
|---------|----------|-------------|
| Anggota tidak ditemukan | ❌ Gagal | "Anggota tidak ditemukan" |
| Status sudah "Keluar" | ❌ Gagal | "Anggota sudah berstatus keluar" |
| Tanggal keluar kosong | ❌ Gagal | "Tanggal keluar wajib diisi" |
| Alasan keluar kosong | ❌ Gagal | "Alasan keluar wajib diisi" |
| Alasan < 10 karakter | ❌ Gagal | "Alasan keluar minimal 10 karakter" |

### Validasi Saat Proses Pengembalian

| Kondisi | Validasi | Pesan Error |
|---------|----------|-------------|
| Ada pinjaman aktif | ❌ Gagal | "Anggota masih memiliki X pinjaman aktif senilai Rp XXX. Lunasi terlebih dahulu." |
| Saldo kas tidak cukup | ❌ Gagal | "Saldo kas tidak mencukupi untuk pengembalian" |
| Metode pembayaran kosong | ❌ Gagal | "Metode pembayaran wajib dipilih" |
| Metode pembayaran invalid | ❌ Gagal | "Metode pembayaran harus 'Kas' atau 'Transfer Bank'" |
| Status pengembalian sudah "Selesai" | ❌ Gagal | "Pengembalian sudah diproses sebelumnya" |

### Perhitungan Otomatis

**Formula Pengembalian:**
```
Total Pengembalian = (Simpanan Pokok + Simpanan Wajib) - Kewajiban Lain
```

**Catatan:**
- Jika kewajiban > simpanan, total bisa negatif (anggota masih berhutang)
- Sistem akan menampilkan peringatan jika total negatif
- Simpanan dihitung dari semua transaksi historis

---

## Pembatalan Status Keluar

### Kapan Bisa Dibatalkan?

✅ **Dapat dibatalkan jika:**
- Status pengembalian masih "Pending"
- Pengembalian belum diproses

❌ **Tidak dapat dibatalkan jika:**
- Status pengembalian sudah "Selesai"
- Pengembalian sudah diproses

### Langkah Pembatalan

1. **Buka Detail Anggota Keluar**
   - Dari daftar anggota, cari anggota dengan status "Keluar"
   - Pastikan status pengembalian masih "Pending"

2. **Klik Tombol "Batalkan Status Keluar"**
   - Tombol berwarna merah
   - Hanya muncul jika pengembalian belum diproses

3. **Konfirmasi Pembatalan**
   - Dialog konfirmasi akan muncul
   - Baca peringatan dengan teliti
   - Klik "Ya, Batalkan" untuk melanjutkan

4. **Hasil Pembatalan**
   - Status anggota kembali ke "Aktif"
   - Field keluar dihapus:
     - tanggalKeluar
     - alasanKeluar
     - pengembalianStatus
     - pengembalianId
   - Anggota dapat melakukan transaksi lagi
   - Audit log pembatalan tercatat

---

## Troubleshooting

### Masalah Umum dan Solusi

#### 1. Tombol "Anggota Keluar" Tidak Muncul

**Penyebab:**
- Anggota sudah berstatus "Keluar"
- User tidak memiliki hak akses
- Anggota berstatus "Nonaktif" atau "Cuti"

**Solusi:**
- Pastikan status anggota "Aktif"
- Login dengan user Admin atau Bendahara
- Refresh halaman

#### 2. Error "Anggota masih memiliki pinjaman aktif"

**Penyebab:**
- Anggota memiliki pinjaman yang belum lunas

**Solusi:**
1. Buka menu "Pinjaman"
2. Cari pinjaman anggota tersebut
3. Proses pelunasan pinjaman terlebih dahulu
4. Kembali ke proses pengembalian

#### 3. Error "Saldo kas tidak mencukupi"

**Penyebab:**
- Saldo kas/bank koperasi kurang dari total pengembalian

**Solusi:**
1. Cek saldo kas di menu "Laporan Keuangan"
2. Tambah saldo kas jika diperlukan
3. Atau gunakan metode "Transfer Bank" jika saldo bank mencukupi

#### 4. Bukti Pengembalian Tidak Bisa Dicetak

**Penyebab:**
- Pop-up blocker browser aktif
- Printer tidak terdeteksi

**Solusi:**
1. Izinkan pop-up dari aplikasi
2. Refresh halaman dan coba lagi
3. Atau simpan sebagai PDF terlebih dahulu

#### 5. Data Simpanan Tidak Sesuai

**Penyebab:**
- Ada transaksi simpanan yang belum tercatat
- Error perhitungan

**Solusi:**
1. Cek riwayat transaksi simpanan anggota
2. Pastikan semua transaksi sudah tercatat
3. Hubungi administrator jika masih tidak sesuai

#### 6. Tidak Bisa Membatalkan Status Keluar

**Penyebab:**
- Pengembalian sudah diproses (status "Selesai")

**Solusi:**
- Pembatalan tidak dapat dilakukan setelah pengembalian diproses
- Jika benar-benar diperlukan, hubungi administrator untuk rollback manual
- Atau buat anggota baru dengan data yang sama

---

## Tips dan Best Practices

### Sebelum Menandai Anggota Keluar

✅ **Checklist:**
- [ ] Pastikan semua pinjaman sudah lunas
- [ ] Cek apakah ada hutang POS yang belum dibayar
- [ ] Verifikasi data anggota sudah lengkap dan benar
- [ ] Konfirmasi tanggal keluar dengan anggota
- [ ] Siapkan alasan keluar yang jelas

### Saat Proses Pengembalian

✅ **Checklist:**
- [ ] Review perhitungan simpanan dengan teliti
- [ ] Pastikan saldo kas/bank mencukupi
- [ ] Pilih metode pembayaran yang sesuai
- [ ] Catat nomor referensi untuk arsip
- [ ] Cetak bukti pengembalian segera

### Untuk Audit dan Arsip

✅ **Rekomendasi:**
- Ekspor laporan anggota keluar setiap bulan
- Simpan bukti pengembalian dalam folder terpisah
- Backup data secara berkala
- Review audit log secara periodik

---

## Integrasi dengan Sistem Akuntansi

### Jurnal Otomatis yang Dibuat

Saat pengembalian diproses, sistem otomatis membuat jurnal:

**Untuk Simpanan Pokok:**
```
Debit:  Simpanan Pokok Anggota    Rp XXX
Kredit: Kas/Bank                  Rp XXX
```

**Untuk Simpanan Wajib:**
```
Debit:  Simpanan Wajib Anggota    Rp XXX
Kredit: Kas/Bank                  Rp XXX
```

### Referensi Transaksi

Setiap jurnal menyimpan:
- ID Pengembalian
- ID Anggota
- Nama Anggota
- Tanggal Transaksi
- Keterangan: "Pengembalian simpanan - [Nama Anggota]"

### Cek Jurnal

Untuk memverifikasi jurnal:
1. Buka menu "Akuntansi" → "Jurnal Umum"
2. Filter berdasarkan tanggal pengembalian
3. Cari transaksi dengan keterangan "Pengembalian simpanan"
4. Pastikan debit = kredit (balanced)

---

## Kontak dan Dukungan

Jika mengalami masalah atau memiliki pertanyaan:

- **Email**: support@koperasi.com
- **Telepon**: (021) 1234-5678
- **Jam Kerja**: Senin - Jumat, 08:00 - 17:00 WIB

---

**Versi Dokumen**: 1.0  
**Terakhir Diperbarui**: 5 Desember 2025  
**Dibuat oleh**: Tim Pengembang Aplikasi Koperasi
