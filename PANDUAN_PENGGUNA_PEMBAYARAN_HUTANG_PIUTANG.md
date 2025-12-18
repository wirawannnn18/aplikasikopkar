# Panduan Pengguna - Pembayaran Hutang Piutang Anggota

## Daftar Isi
1. [Pengenalan](#pengenalan)
2. [Cara Mengakses Menu](#cara-mengakses-menu)
3. [Memproses Pembayaran Hutang](#memproses-pembayaran-hutang)
4. [Memproses Pembayaran Piutang](#memproses-pembayaran-piutang)
5. [Melihat Riwayat Pembayaran](#melihat-riwayat-pembayaran)
6. [Mencetak Bukti Pembayaran](#mencetak-bukti-pembayaran)
7. [Tips dan Troubleshooting](#tips-dan-troubleshooting)

## Pengenalan

Fitur Pembayaran Hutang Piutang memungkinkan kasir untuk:
- Mencatat pembayaran hutang dari anggota (pelunasan kredit POS)
- Mencatat pembayaran piutang kepada anggota (pengembalian dana)
- Melihat riwayat semua transaksi pembayaran
- Mencetak bukti pembayaran untuk anggota

### Perbedaan Hutang dan Piutang
- **Hutang**: Kewajiban anggota kepada koperasi (contoh: belanja kredit di POS)
- **Piutang**: Hak anggota untuk menerima pembayaran dari koperasi (contoh: pengembalian simpanan)

## Cara Mengakses Menu

1. Login ke aplikasi dengan akun kasir atau admin
2. Di sidebar kiri, klik menu **"Pembayaran Hutang/Piutang"**
3. Halaman utama akan menampilkan:
   - Form pembayaran
   - Tab untuk hutang dan piutang
   - Ringkasan total hutang dan piutang

## Memproses Pembayaran Hutang

### Langkah-langkah:

1. **Pilih Tab Hutang**
   - Klik tab "Pembayaran Hutang" di bagian atas

2. **Cari Anggota**
   - Ketik NIK atau nama anggota di field "Cari Anggota"
   - Sistem akan menampilkan saran anggota yang sesuai
   - Klik nama anggota yang diinginkan

3. **Periksa Saldo Hutang**
   - Setelah anggota dipilih, saldo hutang akan ditampilkan otomatis
   - Pastikan anggota memiliki hutang yang perlu dibayar

4. **Masukkan Jumlah Pembayaran**
   - Ketik jumlah yang akan dibayar anggota
   - Jumlah tidak boleh melebihi saldo hutang
   - Sistem akan memvalidasi input secara otomatis

5. **Tambahkan Keterangan (Opsional)**
   - Masukkan catatan tambahan jika diperlukan

6. **Proses Pembayaran**
   - Klik tombol "Proses Pembayaran"
   - Sistem akan menampilkan konfirmasi
   - Klik "Ya" untuk melanjutkan

7. **Konfirmasi Berhasil**
   - Sistem akan menampilkan pesan sukses
   - Saldo hutang anggota akan berkurang
   - Opsi untuk mencetak bukti akan muncul

### Contoh Skenario:
```
Anggota: Budi Santoso (NIK: 1234567890)
Saldo Hutang: Rp 500,000
Pembayaran: Rp 200,000
Saldo Setelah Bayar: Rp 300,000
```

## Memproses Pembayaran Piutang

### Langkah-langkah:

1. **Pilih Tab Piutang**
   - Klik tab "Pembayaran Piutang" di bagian atas

2. **Cari Anggota**
   - Ketik NIK atau nama anggota di field "Cari Anggota"
   - Pilih anggota dari daftar saran

3. **Periksa Saldo Piutang**
   - Saldo piutang anggota akan ditampilkan
   - Pastikan anggota memiliki piutang yang perlu dibayar

4. **Masukkan Jumlah Pembayaran**
   - Ketik jumlah yang akan dibayarkan kepada anggota
   - Jumlah tidak boleh melebihi saldo piutang

5. **Tambahkan Keterangan**
   - Masukkan alasan pembayaran piutang

6. **Proses Pembayaran**
   - Klik tombol "Proses Pembayaran"
   - Konfirmasi pembayaran
   - Sistem akan mengurangi kas dan saldo piutang

### Contoh Skenario:
```
Anggota: Siti Aminah (NIK: 0987654321)
Saldo Piutang: Rp 1,000,000
Pembayaran: Rp 1,000,000
Keterangan: Pengembalian simpanan pokok
```

## Melihat Riwayat Pembayaran

### Mengakses Riwayat:

1. **Buka Tab Riwayat**
   - Klik tab "Riwayat Pembayaran"

2. **Melihat Semua Transaksi**
   - Tabel akan menampilkan semua transaksi pembayaran
   - Kolom yang ditampilkan:
     - Tanggal transaksi
     - Nama anggota
     - Jenis pembayaran (Hutang/Piutang)
     - Jumlah pembayaran
     - Nama kasir
     - Aksi (cetak bukti)

### Filter Riwayat:

1. **Filter by Jenis Pembayaran**
   - Pilih "Hutang", "Piutang", atau "Semua" di dropdown

2. **Filter by Tanggal**
   - Masukkan tanggal mulai dan tanggal akhir
   - Klik "Filter" untuk menerapkan

3. **Filter by Anggota**
   - Pilih anggota tertentu dari dropdown
   - Hanya transaksi anggota tersebut yang akan ditampilkan

4. **Reset Filter**
   - Klik "Reset" untuk menampilkan semua transaksi

### Contoh Penggunaan Filter:
```
Filter Jenis: Hutang
Tanggal: 01/01/2024 - 31/01/2024
Anggota: Semua
Hasil: Menampilkan semua pembayaran hutang di bulan Januari 2024
```

## Mencetak Bukti Pembayaran

### Cara Mencetak:

1. **Dari Konfirmasi Pembayaran**
   - Setelah pembayaran berhasil, klik "Cetak Bukti"

2. **Dari Riwayat Pembayaran**
   - Buka tab "Riwayat Pembayaran"
   - Cari transaksi yang ingin dicetak
   - Klik tombol "Cetak" di kolom aksi

3. **Proses Pencetakan**
   - Jendela preview akan terbuka
   - Periksa detail bukti pembayaran
   - Klik "Print" di browser untuk mencetak

### Isi Bukti Pembayaran:

Bukti pembayaran akan berisi:
- **Header Koperasi**: Logo dan nama koperasi
- **Nomor Transaksi**: ID unik transaksi
- **Tanggal dan Waktu**: Kapan transaksi dilakukan
- **Data Anggota**: Nama dan NIK anggota
- **Detail Pembayaran**:
  - Jenis pembayaran (Hutang/Piutang)
  - Jumlah pembayaran
  - Saldo sebelum pembayaran
  - Saldo setelah pembayaran
- **Keterangan**: Catatan tambahan
- **Kasir**: Nama kasir yang memproses
- **Footer**: Timestamp pencetakan

### Contoh Bukti Pembayaran:
```
=======================================
        KOPERASI SEJAHTERA
=======================================

BUKTI PEMBAYARAN HUTANG

No. Transaksi: TRX-20240115-001
Tanggal: 15 Januari 2024, 10:30 WIB

Anggota: Budi Santoso
NIK: 1234567890

Jenis: Pembayaran Hutang
Jumlah: Rp 200,000
Saldo Sebelum: Rp 500,000
Saldo Sesudah: Rp 300,000

Keterangan: Cicilan bulanan

Kasir: Siti Kasir
Dicetak: 15 Jan 2024, 10:31 WIB
=======================================
```

## Tips dan Troubleshooting

### Tips Penggunaan:

1. **Validasi Saldo**
   - Selalu periksa saldo sebelum memproses pembayaran
   - Pastikan jumlah pembayaran tidak melebihi saldo

2. **Pencarian Anggota**
   - Gunakan NIK untuk pencarian yang lebih akurat
   - Jika nama tidak ditemukan, coba dengan NIK

3. **Keterangan**
   - Selalu isi keterangan untuk pembayaran piutang
   - Gunakan keterangan yang jelas dan informatif

4. **Backup Data**
   - Cetak bukti pembayaran sebagai backup
   - Simpan bukti pembayaran untuk arsip

### Troubleshooting:

#### Problem: Anggota tidak ditemukan
**Solusi:**
- Periksa ejaan nama atau NIK
- Pastikan anggota sudah terdaftar di sistem
- Hubungi admin jika anggota tidak ada di database

#### Problem: Saldo tidak sesuai
**Solusi:**
- Refresh halaman dan coba lagi
- Periksa riwayat transaksi anggota
- Hubungi admin untuk verifikasi saldo

#### Problem: Pembayaran gagal diproses
**Solusi:**
- Periksa koneksi internet
- Pastikan semua field sudah diisi dengan benar
- Coba refresh halaman dan ulangi proses
- Hubungi admin jika masalah berlanjut

#### Problem: Bukti tidak bisa dicetak
**Solusi:**
- Pastikan printer terhubung dan siap
- Coba gunakan browser yang berbeda
- Periksa pengaturan printer di browser
- Gunakan "Save as PDF" sebagai alternatif

#### Problem: Filter tidak berfungsi
**Solusi:**
- Pastikan format tanggal sudah benar
- Coba reset filter dan atur ulang
- Refresh halaman jika diperlukan

### Pesan Error Umum:

| Error | Penyebab | Solusi |
|-------|----------|---------|
| "Anggota tidak dipilih" | Belum memilih anggota | Pilih anggota dari daftar saran |
| "Jumlah harus lebih dari 0" | Input jumlah kosong/nol | Masukkan jumlah yang valid |
| "Melebihi saldo hutang" | Pembayaran > saldo | Kurangi jumlah pembayaran |
| "Tidak memiliki hutang" | Saldo hutang = 0 | Pilih anggota lain atau cek saldo |
| "Gagal mencatat jurnal" | Error sistem | Hubungi admin |

### Kontak Support:

Jika mengalami masalah yang tidak dapat diselesaikan:
- Hubungi Administrator Sistem
- Catat detail error yang muncul
- Sertakan screenshot jika memungkinkan
- Berikan informasi transaksi yang bermasalah

---

**Catatan Penting:**
- Selalu logout setelah selesai menggunakan sistem
- Jangan tinggalkan komputer dalam keadaan login
- Laporkan segera jika ada ketidaksesuaian data
- Backup bukti pembayaran secara berkala