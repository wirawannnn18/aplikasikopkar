# Panduan Fitur Hapus Transaksi POS

## Daftar Isi
1. [Pengenalan](#pengenalan)
2. [Akses Fitur](#akses-fitur)
3. [Cara Menggunakan](#cara-menggunakan)
4. [Filter dan Pencarian](#filter-dan-pencarian)
5. [Proses Penghapusan](#proses-penghapusan)
6. [Riwayat Penghapusan](#riwayat-penghapusan)
7. [Dampak Penghapusan](#dampak-penghapusan)
8. [Batasan dan Validasi](#batasan-dan-validasi)
9. [FAQ](#faq)

---

## Pengenalan

Fitur **Hapus Transaksi POS** memungkinkan admin dan kasir untuk menghapus transaksi penjualan yang salah atau perlu dibatalkan. Fitur ini dirancang dengan mempertimbangkan integritas data sistem, sehingga setiap penghapusan akan:

- ✅ Mengembalikan stok barang secara otomatis
- ✅ Membuat jurnal pembalik (reversal) untuk akuntansi
- ✅ Mencatat log audit lengkap untuk keperluan pelacakan
- ✅ Memvalidasi apakah transaksi dapat dihapus

---

## Akses Fitur

### Hak Akses
Fitur ini hanya dapat diakses oleh pengguna dengan role:
- **Administrator**
- **Kasir**

### Cara Mengakses
1. Login ke sistem dengan akun yang memiliki hak akses
2. Buka menu sidebar
3. Klik **"Hapus Transaksi"** di bagian menu POS

---

## Cara Menggunakan

### Langkah-langkah Dasar

#### 1. Membuka Halaman Hapus Transaksi
- Klik menu **"Hapus Transaksi"** di sidebar
- Sistem akan menampilkan daftar semua transaksi penjualan

#### 2. Mencari Transaksi
Gunakan panel filter untuk menemukan transaksi yang ingin dihapus:
- **Pencarian**: Ketik nomor transaksi atau nama kasir
- **Filter Metode**: Pilih Cash atau Kredit/Bon
- **Filter Tanggal**: Tentukan rentang tanggal transaksi

#### 3. Menghapus Transaksi
- Klik tombol **"Hapus"** (ikon 🗑️) pada baris transaksi yang ingin dihapus
- Sistem akan melakukan validasi otomatis
- Jika valid, dialog konfirmasi akan muncul

#### 4. Konfirmasi Penghapusan
Di dialog konfirmasi, Anda akan melihat:
- Detail lengkap transaksi (nomor, tanggal, kasir, items, total)
- Informasi dampak penghapusan
- **Field alasan penghapusan (WAJIB diisi)**

Isi alasan penghapusan dengan jelas, kemudian klik **"Konfirmasi Hapus"**

#### 5. Hasil Penghapusan
- Jika berhasil: Notifikasi sukses akan muncul
- Jika ada warning: Pesan peringatan akan ditampilkan (misalnya barang tidak ditemukan)
- Daftar transaksi akan di-refresh otomatis

---

## Filter dan Pencarian

### Panel Filter

#### 🔍 Pencarian
- **Fungsi**: Mencari berdasarkan nomor transaksi atau nama kasir
- **Cara**: Ketik kata kunci di field "Pencarian"
- **Contoh**: 
  - Ketik "TRX-241124" untuk mencari nomor transaksi
  - Ketik "Budi" untuk mencari transaksi kasir Budi

#### 💳 Filter Metode Pembayaran
- **Pilihan**:
  - **Semua**: Tampilkan semua transaksi
  - **Cash**: Hanya transaksi tunai
  - **Kredit/Bon**: Hanya transaksi kredit

#### 📅 Filter Tanggal
- **Tanggal Mulai**: Transaksi dari tanggal ini dan sesudahnya
- **Tanggal Akhir**: Transaksi sampai tanggal ini
- **Catatan**: Bisa digunakan salah satu atau keduanya

#### 🔄 Reset Filter
Klik tombol **"Reset"** untuk menghapus semua filter dan menampilkan semua transaksi

---

## Proses Penghapusan

### Dialog Konfirmasi

Saat Anda mengklik tombol "Hapus", sistem akan menampilkan dialog konfirmasi yang berisi:

#### 1. Informasi Peringatan
Menjelaskan dampak penghapusan:
- Stok barang akan dikembalikan
- Jurnal pembalik akan dibuat
- Log audit akan dicatat

#### 2. Detail Transaksi
Informasi lengkap transaksi yang akan dihapus:
- **No Transaksi**: Nomor unik transaksi
- **Tanggal**: Waktu transaksi dilakukan
- **Kasir**: Nama kasir yang melakukan transaksi
- **Tipe**: Anggota atau Umum
- **Metode**: Cash atau Kredit
- **Status**: Lunas atau Kredit

#### 3. Daftar Item
Tabel lengkap berisi:
- Nama barang
- Quantity (jumlah)
- Harga satuan
- Subtotal per item
- **Total keseluruhan**

#### 4. Alasan Penghapusan ⚠️
- **WAJIB diisi** untuk keperluan audit
- Maksimal 500 karakter
- Jelaskan dengan jelas mengapa transaksi dihapus
- Contoh alasan yang baik:
  - ✅ "Transaksi duplikat, sudah diinput 2 kali"
  - ✅ "Kesalahan input harga, seharusnya Rp 50.000 bukan Rp 500.000"
  - ✅ "Pembeli membatalkan pembelian setelah transaksi diinput"
  - ❌ "Salah" (terlalu singkat, tidak informatif)

### Tombol Aksi
- **Batal**: Menutup dialog tanpa mengubah data
- **Konfirmasi Hapus**: Melanjutkan proses penghapusan

---

## Riwayat Penghapusan

### Mengakses Riwayat
1. Dari halaman Hapus Transaksi, klik menu **"Riwayat Hapus Transaksi"** di sidebar
2. Atau klik tombol **"Kembali ke Hapus Transaksi"** untuk kembali

### Informasi yang Ditampilkan
Tabel riwayat menampilkan:
- **No Transaksi**: Nomor transaksi yang dihapus
- **Tanggal Transaksi**: Kapan transaksi dilakukan
- **Tanggal Penghapusan**: Kapan transaksi dihapus
- **User**: Siapa yang menghapus
- **Alasan**: Alasan penghapusan (dipotong jika terlalu panjang)
- **Aksi**: Tombol "Detail" untuk melihat informasi lengkap

### Melihat Detail Riwayat
Klik tombol **"Detail"** (ikon 👁️) untuk melihat:

#### Informasi Penghapusan
- Dihapus oleh siapa
- Waktu penghapusan
- Status pengembalian stok
- Status pembalikan jurnal
- Alasan lengkap
- Peringatan (jika ada)

#### Data Transaksi Lengkap
- Semua detail transaksi yang dihapus
- Daftar item dengan HPP
- Informasi pembayaran (untuk transaksi cash)

---

## Dampak Penghapusan

### 1. Pengembalian Stok Barang 📦
**Apa yang Terjadi:**
- Setiap item dalam transaksi akan dikembalikan ke stok
- Quantity yang terjual akan ditambahkan kembali ke stok barang

**Contoh:**
- Transaksi: Jual 5 unit Pensil
- Stok sebelum hapus: 20 unit
- Stok setelah hapus: 25 unit (20 + 5)

**Catatan:**
- Jika barang tidak ditemukan di master data, sistem akan mencatat warning
- Warning tidak menghentikan proses penghapusan
- Warning akan ditampilkan di notifikasi dan log audit

### 2. Jurnal Pembalik (Reversal) 📒

#### Untuk Transaksi Cash
**Jurnal yang Dibuat:**
```
Tanggal: Tanggal penghapusan (bukan tanggal transaksi)
Keterangan: Reversal Hapus Transaksi [No Transaksi]

Debit:  Pendapatan Penjualan (4-1000)  Rp XXX
Kredit: Kas (1-1000)                   Rp XXX

Debit:  Persediaan Barang (1-1300)     Rp YYY
Kredit: Harga Pokok Penjualan (5-1000) Rp YYY
```

#### Untuk Transaksi Kredit
**Jurnal yang Dibuat:**
```
Tanggal: Tanggal penghapusan
Keterangan: Reversal Hapus Transaksi [No Transaksi]

Debit:  Pendapatan Penjualan (4-1000)  Rp XXX
Kredit: Piutang Anggota (1-1200)       Rp XXX

Debit:  Persediaan Barang (1-1300)     Rp YYY
Kredit: Harga Pokok Penjualan (5-1000) Rp YYY
```

**Penjelasan:**
- Jurnal pembalik menghapus efek transaksi dari laporan keuangan
- Menggunakan tanggal penghapusan, bukan tanggal transaksi asli
- Membalik pendapatan dan HPP

### 3. Log Audit 📝
**Informasi yang Dicatat:**
- ID transaksi dan nomor transaksi
- Data transaksi lengkap (sebelum dihapus)
- Alasan penghapusan
- User yang menghapus
- Timestamp penghapusan
- Status pengembalian stok
- Status pembalikan jurnal
- Warning (jika ada)

**Tujuan:**
- Pelacakan untuk audit
- Transparansi operasional
- Investigasi jika diperlukan

---

## Batasan dan Validasi

### ❌ Transaksi Tidak Dapat Dihapus Jika:

#### 1. Transaksi Sudah Masuk Shift Tertutup
**Kondisi:**
- Transaksi sudah masuk dalam laporan tutup kasir yang sudah ditutup

**Alasan:**
- Menjaga integritas laporan keuangan
- Laporan tutup kasir sudah final dan tidak boleh diubah

**Pesan Error:**
> "Transaksi sudah masuk dalam laporan tutup kasir yang sudah ditutup dan tidak dapat dihapus"

**Solusi:**
- Jika benar-benar perlu dihapus, hubungi administrator
- Pertimbangkan membuat jurnal koreksi manual

#### 2. Transaksi Tidak Ditemukan
**Kondisi:**
- ID atau nomor transaksi tidak ada di sistem

**Pesan Error:**
> "Transaksi tidak ditemukan"

**Solusi:**
- Periksa kembali nomor transaksi
- Refresh halaman dan coba lagi

### ⚠️ Validasi Alasan Penghapusan

#### Alasan Kosong
**Kondisi:**
- Field alasan tidak diisi atau hanya berisi spasi

**Pesan Error:**
> "Alasan penghapusan harus diisi"

**Solusi:**
- Isi alasan dengan jelas dan informatif

#### Alasan Terlalu Panjang
**Kondisi:**
- Alasan lebih dari 500 karakter

**Pesan Error:**
> "Alasan maksimal 500 karakter"

**Solusi:**
- Persingkat alasan namun tetap informatif
- Counter karakter ditampilkan di bawah field

---

## FAQ

### ❓ Apakah transaksi yang sudah dihapus bisa dikembalikan?
**Jawab:** Tidak. Transaksi yang sudah dihapus tidak bisa dikembalikan. Namun, data lengkap transaksi tersimpan di log audit dan dapat dilihat di halaman Riwayat Hapus Transaksi.

### ❓ Bagaimana jika barang dalam transaksi sudah tidak ada di master data?
**Jawab:** Sistem akan mencatat warning "Barang [nama] tidak ditemukan, stok tidak dapat dikembalikan" namun proses penghapusan tetap dilanjutkan. Warning akan ditampilkan di notifikasi dan tersimpan di log audit.

### ❓ Apakah saya bisa menghapus transaksi dari shift yang masih buka?
**Jawab:** Ya, transaksi dari shift yang masih buka (belum tutup kasir) dapat dihapus.

### ❓ Bagaimana cara melihat transaksi yang sudah dihapus?
**Jawab:** Buka menu "Riwayat Hapus Transaksi" di sidebar, kemudian klik tombol "Detail" pada transaksi yang ingin dilihat.

### ❓ Apakah penghapusan mempengaruhi laporan keuangan?
**Jawab:** Ya. Sistem akan membuat jurnal pembalik otomatis yang akan membalik efek transaksi dari laporan keuangan. Jurnal pembalik menggunakan tanggal penghapusan.

### ❓ Siapa saja yang bisa menghapus transaksi?
**Jawab:** Hanya pengguna dengan role Administrator atau Kasir yang dapat mengakses dan menggunakan fitur ini.

### ❓ Apakah ada batasan jumlah transaksi yang bisa dihapus?
**Jawab:** Tidak ada batasan jumlah. Namun setiap penghapusan harus dilakukan satu per satu dengan alasan yang jelas.

### ❓ Bagaimana jika saya salah menghapus transaksi?
**Jawab:** Transaksi yang sudah dihapus tidak bisa dikembalikan. Jika terjadi kesalahan, Anda perlu membuat transaksi baru dengan data yang sama. Pastikan untuk memeriksa detail transaksi dengan teliti sebelum mengkonfirmasi penghapusan.

### ❓ Apakah alasan penghapusan bisa diedit setelah transaksi dihapus?
**Jawab:** Tidak. Alasan penghapusan bersifat final dan tidak dapat diubah setelah transaksi dihapus. Ini untuk menjaga integritas audit trail.

### ❓ Bagaimana cara membatalkan proses penghapusan?
**Jawab:** Klik tombol "Batal" di dialog konfirmasi. Tidak ada perubahan data yang akan terjadi.

---

## Tips dan Best Practices

### ✅ DO (Lakukan)
1. **Periksa detail transaksi dengan teliti** sebelum menghapus
2. **Tulis alasan yang jelas dan informatif** untuk keperluan audit
3. **Gunakan filter** untuk mempermudah pencarian transaksi
4. **Cek riwayat penghapusan** secara berkala untuk monitoring
5. **Koordinasi dengan tim** jika menghapus transaksi penting

### ❌ DON'T (Jangan)
1. **Jangan menghapus transaksi** tanpa alasan yang jelas
2. **Jangan menggunakan alasan generik** seperti "salah" atau "hapus"
3. **Jangan menghapus transaksi** dari shift yang sudah ditutup
4. **Jangan terburu-buru** saat mengkonfirmasi penghapusan
5. **Jangan lupa dokumentasi** jika penghapusan terkait kasus khusus

---

## Troubleshooting

### Masalah: Tombol "Hapus" tidak muncul
**Solusi:**
- Pastikan Anda login dengan role Administrator atau Kasir
- Refresh halaman dan coba lagi
- Periksa koneksi internet

### Masalah: Filter tidak bekerja
**Solusi:**
- Klik tombol "Reset" untuk menghapus filter
- Refresh halaman
- Periksa format tanggal yang diinput

### Masalah: Notifikasi sukses muncul tapi transaksi masih ada
**Solusi:**
- Refresh halaman untuk memperbarui daftar
- Periksa apakah filter masih aktif
- Cek di Riwayat Hapus Transaksi untuk memastikan transaksi sudah dihapus

### Masalah: Error "Transaksi tidak ditemukan"
**Solusi:**
- Pastikan nomor transaksi benar
- Refresh halaman dan coba lagi
- Transaksi mungkin sudah dihapus sebelumnya

---

## Kontak Support

Jika mengalami masalah atau memiliki pertanyaan lebih lanjut, silakan hubungi:
- **Email**: support@koperasi.com
- **Telepon**: (021) XXX-XXXX
- **WhatsApp**: 08XX-XXXX-XXXX

---

**Versi Dokumen**: 1.0  
**Terakhir Diperbarui**: November 2024  
**Dibuat oleh**: Tim Development Koperasi Karyawan
