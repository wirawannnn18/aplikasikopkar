# Panduan Tutup Kasir - Point of Sales

## Fitur Tutup Kasir

Fitur tutup kasir memungkinkan kasir untuk menutup shift dan membuat laporan kas pada akhir shift atau pergantian kasir.

---

## Alur Kerja Kasir

### 1. Buka Kas (Awal Shift)

Saat pertama kali masuk ke Point of Sales, kasir harus **Buka Kas** terlebih dahulu:

1. Masuk ke menu **Point of Sales**
2. Sistem akan menampilkan form **Buka Kas**
3. Masukkan **Modal Awal Kasir** (uang kembalian)
4. Klik **Buka Kas**

**Data yang dicatat:**
- ID Shift
- Nama Kasir
- Modal Awal
- Waktu Buka Kas
- Status: Buka

---

### 2. Transaksi Penjualan

Setelah kas dibuka, kasir dapat melakukan transaksi penjualan seperti biasa:

- Scan barcode atau pilih barang
- Pilih anggota (jika ada)
- Pilih metode pembayaran (Cash/Bon)
- Proses pembayaran
- Print struk

**Info Shift** ditampilkan di sidebar kanan:
- Nama Kasir
- Waktu Buka Kas
- Modal Awal

---

### 3. Tutup Kasir (Akhir Shift)

Pada akhir shift atau pergantian kasir:

1. Klik tombol **Tutup Kasir** (warna kuning)
2. Sistem akan menampilkan **Ringkasan Transaksi**:
   - Jumlah Transaksi
   - Total Penjualan
   - Modal Awal Kasir
   - Penjualan Cash
   - Penjualan Bon
   - Kas yang Seharusnya

3. **Hitung Kas Fisik**:
   - Hitung semua uang di laci kasir
   - Masukkan jumlah kas aktual

4. **Hitung Selisih**:
   - Klik tombol **Hitung Selisih**
   - Sistem akan menampilkan:
     - **PAS** (hijau) - Kas sesuai
     - **LEBIH** (kuning) - Kas lebih dari seharusnya
     - **KURANG** (merah) - Kas kurang dari seharusnya

5. **Catatan** (opsional):
   - Tambahkan catatan jika diperlukan
   - Contoh: "Ada uang rusak Rp 5.000"

6. **Tutup & Print Laporan**:
   - Klik tombol **Tutup & Print Laporan**
   - Sistem akan:
     - Menyimpan data tutup kasir
     - Mencatat selisih ke jurnal (jika ada)
     - Print laporan tutup kasir
     - Menutup shift

---

## Laporan Tutup Kasir

Laporan yang dicetak berisi:

### Informasi Shift
- Kasir
- No. Shift
- Waktu Buka Kas
- Waktu Tutup Kas

### Ringkasan Penjualan
- Modal Awal Kasir
- Jumlah Transaksi
- Penjualan Cash
- Penjualan Bon (Kredit)
- Total Penjualan

### Rekonsiliasi Kas
- Modal Awal
- Penjualan Cash
- **Kas yang Seharusnya**
- **Kas Aktual (Fisik)**
- **Selisih Kas**

### Detail Transaksi
Daftar semua transaksi dalam shift:
- No
- Waktu
- Anggota
- Total
- Metode

### Tanda Tangan
- Kasir
- Mengetahui (Supervisor/Manager)

---

## Riwayat Tutup Kasir

Untuk melihat riwayat tutup kasir:

1. Masuk ke menu **Riwayat Tutup Kasir**
2. Akan ditampilkan daftar semua shift yang sudah ditutup:
   - No. Shift
   - Kasir
   - Waktu Buka
   - Waktu Tutup
   - Total Penjualan
   - Selisih

3. **Aksi yang tersedia**:
   - **Detail** - Lihat detail lengkap shift
   - **Print** - Cetak ulang laporan

---

## Pencatatan Akuntansi

### Selisih Kas Lebih
Jika kas aktual > kas seharusnya:
```
Debit: Kas (1-1000)
Kredit: Pendapatan Penjualan (4-1000)
```

### Selisih Kas Kurang
Jika kas aktual < kas seharusnya:
```
Debit: Beban Operasional (5-2000)
Kredit: Kas (1-1000)
```

---

## Tips untuk Kasir

### ✅ DO (Lakukan)
- Selalu buka kas di awal shift
- Hitung kas fisik dengan teliti
- Catat catatan jika ada kondisi khusus
- Tutup kasir sebelum pulang atau ganti shift
- Simpan laporan tutup kasir

### ❌ DON'T (Jangan)
- Jangan lupa tutup kasir
- Jangan asal input kas aktual
- Jangan tutup kasir jika masih ada transaksi pending
- Jangan berbagi akun kasir dengan orang lain

---

## Troubleshooting

### Tidak bisa transaksi
**Penyebab**: Belum buka kas  
**Solusi**: Buka kas terlebih dahulu

### Selisih kas terlalu besar
**Penyebab**: Kesalahan hitung atau transaksi tidak tercatat  
**Solusi**: 
- Hitung ulang kas fisik
- Cek riwayat transaksi
- Laporkan ke supervisor

### Lupa tutup kasir kemarin
**Penyebab**: Kasir lupa tutup shift  
**Solusi**: 
- Hubungi administrator
- Administrator dapat melihat transaksi dari sessionStorage
- Buat laporan manual jika diperlukan

---

## Hak Akses

### Kasir
- ✅ Buka Kas
- ✅ Transaksi Penjualan
- ✅ Tutup Kasir
- ✅ Lihat Riwayat Tutup Kasir (milik sendiri)

### Administrator
- ✅ Semua akses kasir
- ✅ Lihat semua riwayat tutup kasir
- ✅ Print ulang laporan
- ✅ Lihat detail semua shift

---

## Contoh Skenario

### Skenario 1: Shift Normal (Kas PAS)
1. Buka kas: Rp 500.000
2. Penjualan cash: Rp 2.000.000
3. Penjualan bon: Rp 500.000
4. Kas seharusnya: Rp 2.500.000
5. Kas aktual: Rp 2.500.000
6. **Selisih: Rp 0 (PAS)** ✅

### Skenario 2: Kas Lebih
1. Buka kas: Rp 500.000
2. Penjualan cash: Rp 2.000.000
3. Kas seharusnya: Rp 2.500.000
4. Kas aktual: Rp 2.510.000
5. **Selisih: Rp 10.000 (LEBIH)** ⚠️
6. Catatan: "Ada uang kembalian yang tidak diambil pelanggan"

### Skenario 3: Kas Kurang
1. Buka kas: Rp 500.000
2. Penjualan cash: Rp 2.000.000
3. Kas seharusnya: Rp 2.500.000
4. Kas aktual: Rp 2.490.000
5. **Selisih: Rp 10.000 (KURANG)** ❌
6. Catatan: "Ada uang rusak Rp 10.000 yang tidak diterima"

---

## Keamanan

- Setiap shift memiliki ID unik
- Data shift disimpan di localStorage
- Session shift disimpan di sessionStorage (hilang saat browser ditutup)
- Hanya kasir yang buka kas yang bisa tutup kas tersebut
- Laporan dapat dicetak ulang kapan saja

---

## Integrasi dengan Sistem

Tutup kasir terintegrasi dengan:
- ✅ **Point of Sales** - Transaksi penjualan
- ✅ **Jurnal Akuntansi** - Pencatatan selisih kas
- ✅ **Laporan Keuangan** - Kas masuk/keluar
- ✅ **Riwayat Transaksi** - Detail penjualan per shift

---

## Pertanyaan Umum (FAQ)

**Q: Apakah harus tutup kasir setiap hari?**  
A: Ya, sebaiknya tutup kasir di akhir shift atau akhir hari untuk rekonsiliasi kas.

**Q: Bagaimana jika lupa modal awal?**  
A: Lihat di Info Shift atau hubungi administrator untuk cek riwayat.

**Q: Apakah bisa tutup kasir tanpa transaksi?**  
A: Ya, bisa. Sistem akan mencatat shift dengan 0 transaksi.

**Q: Bagaimana jika ada selisih besar?**  
A: Hitung ulang kas fisik, cek transaksi, dan laporkan ke supervisor.

**Q: Apakah laporan bisa dicetak ulang?**  
A: Ya, dari menu Riwayat Tutup Kasir, klik tombol Print.

---

## Kontak Support

Jika ada masalah atau pertanyaan:
- Hubungi Administrator
- Cek dokumentasi sistem
- Laporkan bug atau saran perbaikan
