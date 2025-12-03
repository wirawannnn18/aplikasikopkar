# BUKU PANDUAN LENGKAP APLIKASI KOPERASI - BAGIAN 3

## Lanjutan dari BUKU_PANDUAN_LENGKAP_BAGIAN_2.md

---

# BAGIAN V: POINT OF SALES (POS)

## 18. Memulai Shift Kasir

### 18.1 Pengenalan
Sebelum melakukan transaksi penjualan, kasir harus membuka shift terlebih dahulu dengan modal awal.

### 18.2 Akses Menu
**Hak Akses**: Super Admin, Administrator, Kasir

**Cara Akses**:
1. Login sebagai Kasir (atau Administrator/Super Admin)
2. Klik menu **"Point of Sales"** di sidebar

### 18.3 Buka Kas

**Langkah-langkah:**
1. Saat pertama kali masuk POS, akan muncul form **"Buka Kas"**
2. Isi **Modal Awal Kasir** (uang kembalian)
   - Contoh: Rp 500.000
3. Klik tombol **"Buka Kas"**
4. Shift akan dimulai

**Data yang Dicatat:**
- ID Shift (otomatis generate)
- Nama Kasir (dari user login)
- Modal Awal
- Waktu Buka Kas
- Status: Buka

**Info Shift:**
Setelah kas dibuka, info shift akan ditampilkan di sidebar kanan:
- Nama Kasir
- Waktu Buka Kas
- Modal Awal
- Jumlah Transaksi (update real-time)
- Total Penjualan (update real-time)

### 18.4 Pengajuan Modal (Jika Tidak Ada Modal)

Jika kasir tidak memiliki modal awal, bisa mengajukan ke admin:

**Langkah-langkah:**
1. Klik tombol **"Ajukan Modal"** (jika muncul)
2. Isi form pengajuan:
   - **Jumlah Modal** yang diajukan
   - **Keterangan** (alasan pengajuan)
3. Klik **"Kirim Pengajuan"**
4. Tunggu approval dari admin
5. Notifikasi akan muncul saat disetujui/ditolak

**Status Pengajuan:**
- **Pending**: Menunggu approval
- **Approved**: Disetujui, modal bisa diambil
- **Rejected**: Ditolak, buat pengajuan baru

---

## 19. Transaksi Penjualan

### 19.1 Pengenalan
Setelah kas dibuka, kasir dapat melakukan transaksi penjualan dengan scan barcode atau pencarian manual.

### 19.2 Pilih Anggota atau Umum

**Langkah-langkah:**
1. Pilih dari dropdown **"Anggota"**:
   - **Umum**: Untuk pembeli non-anggota (hanya cash)
   - **Nama Anggota**: Untuk anggota (bisa cash atau bon)
2. Jika pilih anggota, info kredit akan muncul (lihat bagian 20)

### 19.3 Tambah Barang ke Keranjang

**Metode 1: Scan Barcode**
1. Fokus ke input barcode (klik atau tekan F2)
2. Scan barcode dengan scanner
3. Barang akan otomatis masuk ke keranjang
4. Quantity default = 1

**Metode 2: Pencarian Manual**
1. Ketik nama barang di search box
2. Pilih barang dari hasil pencarian
3. Klik tombol **"Tambah"**
4. Barang akan masuk ke keranjang

**Metode 3: Pilih dari Daftar**
1. Scroll daftar barang di sebelah kanan
2. Klik tombol **"Tambah"** pada barang yang diinginkan
3. Barang akan masuk ke keranjang

### 19.4 Edit Quantity di Keranjang

**Langkah-langkah:**
1. Lihat keranjang belanja di sebelah kiri
2. Ubah quantity di input box
3. Subtotal akan update otomatis
4. Total akan update otomatis

**Validasi:**
- Quantity harus > 0
- Quantity tidak boleh > stok tersedia
- Jika stok tidak cukup, akan muncul peringatan

### 19.5 Hapus Barang dari Keranjang

**Langkah-langkah:**
1. Klik tombol **"Hapus"** (icon trash) pada baris barang
2. Barang akan dihapus dari keranjang
3. Total akan update otomatis

### 19.6 Proses Pembayaran

**Langkah-langkah:**
1. Pastikan keranjang sudah terisi
2. Pilih **Metode Pembayaran**:
   - **Cash**: Pembayaran tunai
   - **Bon (Kredit)**: Pembayaran kredit (hanya untuk anggota)
3. Untuk Cash:
   - Masukkan **Jumlah Bayar**
   - Sistem akan hitung **Kembalian** otomatis
   - Kembalian harus >= 0
4. Untuk Bon:
   - Sistem akan validasi batas kredit (lihat bagian 20)
   - Jika melebihi batas, transaksi ditolak
5. Klik tombol **"Bayar"**
6. Transaksi akan diproses

**Validasi:**
- Keranjang tidak boleh kosong
- Untuk cash: jumlah bayar harus >= total
- Untuk bon: harus pilih anggota (bukan "Umum")
- Untuk bon: tidak boleh melebihi batas kredit

### 19.7 Cetak Struk

**Otomatis:**
Setelah transaksi berhasil, struk akan otomatis muncul di window baru untuk dicetak.

**Manual:**
1. Buka menu **"Riwayat Transaksi"**
2. Klik tombol **"Cetak Struk"** pada transaksi yang diinginkan

**Isi Struk:**
```
[LOGO KOPERASI]
NAMA KOPERASI
Alamat, Telepon

================================
STRUK PEMBAYARAN
================================

No. Transaksi: TRX-20240115-001
Tanggal: 15/01/2024 10:30:00
Kasir: Nama Kasir
Anggota: Nama Anggota / Umum

--------------------------------
ITEM:
--------------------------------
Nama Barang 1
  2 x Rp 10.000 = Rp 20.000

Nama Barang 2
  1 x Rp 15.000 = Rp 15.000

--------------------------------
TOTAL: Rp 35.000
BAYAR: Rp 50.000 (Cash)
KEMBALI: Rp 15.000

================================
Terima Kasih
Selamat Berbelanja Kembali
================================
```

### 19.8 Setelah Transaksi

Setelah transaksi selesai:
- Keranjang akan dikosongkan otomatis
- Siap untuk transaksi berikutnya
- Info shift akan update (jumlah transaksi & total penjualan)
- Stok barang akan berkurang otomatis
- Jurnal akan dibuat otomatis

---

## 20. Batas Kredit Anggota

### 20.1 Pengenalan
Setiap anggota memiliki batas kredit maksimal **Rp 2.000.000** untuk transaksi bon yang belum dilunasi.

### 20.2 Cara Kerja

**Perhitungan:**
- Outstanding Balance = Total semua bon yang belum lunas
- Kredit Tersedia = Rp 2.000.000 - Outstanding Balance
- Transaksi Baru tidak boleh melebihi Kredit Tersedia

**Contoh:**
- Batas Kredit: Rp 2.000.000
- Outstanding Balance: Rp 1.500.000
- Kredit Tersedia: Rp 500.000
- Transaksi Baru: Rp 400.000 ✅ (diizinkan)
- Transaksi Baru: Rp 600.000 ❌ (ditolak)

### 20.3 Info Kredit di POS

Saat memilih anggota, info kredit akan muncul:

**Tampilan:**
```
Info Kredit
Tagihan: Rp 1.500.000
Tersedia: Rp 500.000
✅ Kredit tersedia (75.0% terpakai)
```

**Indikator Warna:**
- 🟢 **Hijau (Safe)**: Kredit terpakai < 80%
  - Contoh: "✅ Kredit tersedia (75.0% terpakai)"
- 🟡 **Kuning (Warning)**: Kredit terpakai 80-94%
  - Contoh: "⚠️ Mendekati batas kredit (85.0% terpakai)"
- 🔴 **Merah (Critical)**: Kredit terpakai ≥ 95%
  - Contoh: "⚠️ Batas kredit hampir habis! (97.5% terpakai)"

### 20.4 Validasi Transaksi Bon

**Saat Klik "Bayar" dengan metode Bon:**
1. Sistem hitung: Outstanding + Transaksi Baru
2. Jika total > Rp 2.000.000:
   - Transaksi **DITOLAK**
   - Muncul pesan error:
     ```
     Transaksi melebihi batas kredit.
     Tagihan saat ini: Rp 1.800.000
     Transaksi: Rp 500.000
     Batas: Rp 2.000.000
     ```
3. Jika total ≤ Rp 2.000.000:
   - Transaksi **DIIZINKAN**
   - Proses normal

### 20.5 Tips untuk Kasir

**Sebelum Transaksi:**
- Selalu cek info kredit anggota
- Perhatikan indikator warna
- Jika merah, sarankan pembayaran cash atau pelunasan tagihan

**Jika Transaksi Ditolak:**
- Informasikan ke anggota tentang batas kredit
- Sarankan untuk:
  - Bayar cash untuk transaksi ini
  - Lunasi sebagian tagihan dulu
  - Kurangi jumlah belanja

**Catatan:**
- Transaksi cash **TIDAK** dibatasi oleh batas kredit
- Anggota "Umum" **TIDAK BISA** bon, hanya cash

---

## 21. Tutup Kasir

### 21.1 Pengenalan
Tutup Kasir dilakukan di akhir shift untuk rekonsiliasi kas dan membuat laporan shift.

### 21.2 Akses Fitur
**Hak Akses**: Super Admin, Administrator, Kasir (yang buka shift)

**Cara Akses**:
1. Masih di halaman POS
2. Klik tombol **"Tutup Kasir"** (warna kuning)

### 21.3 Proses Tutup Kasir

**Langkah 1: Ringkasan Transaksi**
Sistem akan menampilkan:
- Jumlah Transaksi: XX transaksi
- Total Penjualan: Rp XXX
- Modal Awal Kasir: Rp XXX
- Penjualan Cash: Rp XXX
- Penjualan Bon: Rp XXX
- **Kas yang Seharusnya**: Modal + Penjualan Cash

**Langkah 2: Hitung Kas Fisik**
1. Hitung semua uang di laci kasir
2. Masukkan jumlah di field **"Kas Aktual (Fisik)"**
3. Klik tombol **"Hitung Selisih"**

**Langkah 3: Lihat Selisih**
Sistem akan menampilkan:
- **PAS** (hijau): Kas aktual = Kas seharusnya
  ```
  ✅ Kas PAS
  Selisih: Rp 0
  ```
- **LEBIH** (kuning): Kas aktual > Kas seharusnya
  ```
  ⚠️ Kas LEBIH
  Selisih: Rp 10.000
  ```
- **KURANG** (merah): Kas aktual < Kas seharusnya
  ```
  ❌ Kas KURANG
  Selisih: Rp 10.000
  ```

**Langkah 4: Catatan (Opsional)**
Tambahkan catatan jika ada kondisi khusus:
- Contoh: "Ada uang rusak Rp 5.000"
- Contoh: "Uang kembalian tidak diambil pelanggan Rp 10.000"

**Langkah 5: Tutup & Print**
1. Klik tombol **"Tutup & Print Laporan"**
2. Sistem akan:
   - Menyimpan data tutup kasir
   - Mencatat selisih ke jurnal (jika ada)
   - Print laporan tutup kasir
   - Menutup shift
3. Selesai! Shift ditutup

### 21.4 Laporan Tutup Kasir

**Isi Laporan:**
```
[LOGO KOPERASI]
NAMA KOPERASI
LAPORAN TUTUP KASIR

================================
INFORMASI SHIFT
================================
Kasir: Nama Kasir
No. Shift: SHIFT-20240115-001
Waktu Buka: 15/01/2024 08:00:00
Waktu Tutup: 15/01/2024 17:00:00

================================
RINGKASAN PENJUALAN
================================
Modal Awal Kasir: Rp 500.000
Jumlah Transaksi: 25 transaksi
Penjualan Cash: Rp 2.000.000
Penjualan Bon: Rp 500.000
Total Penjualan: Rp 2.500.000

================================
REKONSILIASI KAS
================================
Modal Awal: Rp 500.000
Penjualan Cash: Rp 2.000.000
Kas yang Seharusnya: Rp 2.500.000
Kas Aktual (Fisik): Rp 2.500.000
Selisih Kas: Rp 0 (PAS)

================================
DETAIL TRANSAKSI
================================
No | Waktu | Anggota | Total | Metode
1  | 08:15 | Umum    | 50000 | Cash
2  | 08:30 | John    | 75000 | Bon
...

================================
TANDA TANGAN
================================
Kasir: _______________

Mengetahui: _______________
```

### 21.5 Jurnal Selisih Kas

**Jika Kas Lebih:**
```
Debit: Kas (1-1000) - Rp Selisih
Kredit: Pendapatan Lain-lain (4-3000) - Rp Selisih
Keterangan: Selisih kas lebih - Shift XXX
```

**Jika Kas Kurang:**
```
Debit: Beban Operasional (5-2000) - Rp Selisih
Kredit: Kas (1-1000) - Rp Selisih
Keterangan: Selisih kas kurang - Shift XXX
```

### 21.6 Riwayat Tutup Kasir

**Cara Akses:**
1. Klik menu **"Riwayat Tutup Kasir"**
2. Akan muncul daftar semua shift yang sudah ditutup

**Informasi yang Ditampilkan:**
- No. Shift
- Kasir
- Waktu Buka
- Waktu Tutup
- Total Penjualan
- Selisih
- Status

**Aksi:**
- **Detail**: Lihat detail lengkap shift
- **Print**: Cetak ulang laporan

---

## 22. Pengajuan Modal Kasir

### 22.1 Pengenalan
Fitur ini memungkinkan kasir mengajukan permintaan modal awal kepada admin sebelum membuka shift.

### 22.2 Untuk Kasir

**Cara Mengajukan Modal:**
1. Login sebagai Kasir
2. Klik menu **"Pengajuan Modal"** di sidebar
3. Klik tombol **"Ajukan Modal Baru"**
4. Isi form:
   - **Jumlah Modal** yang diajukan (contoh: Rp 500.000)
   - **Keterangan** (alasan pengajuan)
5. Klik **"Kirim Pengajuan"**
6. Tunggu approval dari admin

**Status Pengajuan:**
- **Pending** (kuning): Menunggu approval admin
- **Approved** (hijau): Disetujui, modal bisa diambil
- **Rejected** (merah): Ditolak, lihat alasan penolakan

**Notifikasi:**
- Kasir akan menerima notifikasi saat pengajuan disetujui/ditolak
- Badge merah akan muncul di icon notifikasi

**Lihat Riwayat:**
1. Buka menu **"Pengajuan Modal"**
2. Lihat daftar semua pengajuan
3. Filter by status (Pending/Approved/Rejected/Semua)

### 22.3 Untuk Admin

**Cara Approve/Reject Pengajuan:**
1. Login sebagai Administrator atau Super Admin
2. Klik menu **"Pengajuan Modal (Admin)"** di sidebar
3. Akan muncul daftar pengajuan dari kasir
4. Untuk setiap pengajuan:
   - **Approve**: Klik tombol hijau "Setujui"
   - **Reject**: Klik tombol merah "Tolak"
5. Jika reject, masukkan alasan penolakan
6. Kasir akan menerima notifikasi

**Notifikasi:**
- Admin akan menerima notifikasi saat ada pengajuan baru
- Badge merah akan muncul di icon notifikasi

**Filter:**
- Filter by status (Pending/Approved/Rejected/Semua)
- Filter by kasir
- Filter by tanggal

### 22.4 Pengaturan Sistem

**Aktifkan/Nonaktifkan Fitur:**
1. Login sebagai Super Admin atau Administrator
2. Buka menu **"Pengaturan Sistem"**
3. Cari section **"Pengajuan Modal Kasir"**
4. Toggle switch untuk aktifkan/nonaktifkan
5. Jika dinonaktifkan:
   - Kasir tidak bisa ajukan modal
   - Menu pengajuan modal disembunyikan
   - Kasir harus buka kas dengan modal sendiri

---

