# Panduan Fitur Batas Kredit POS

## Deskripsi Fitur

Fitur batas kredit POS menambahkan sistem pembatasan kredit untuk transaksi belanja di Point of Sales. Setiap anggota memiliki batas kredit maksimal **Rp 2.000.000** untuk transaksi bon (kredit) yang belum dilunasi.

## Cara Kerja

### 1. Batas Kredit
- Setiap anggota memiliki batas kredit **Rp 2.000.000**
- Batas ini berlaku untuk **total tagihan yang belum dilunasi**
- Transaksi cash **tidak** dibatasi oleh batas kredit

### 2. Perhitungan Outstanding Balance
- Sistem menghitung total semua transaksi bon yang statusnya masih "kredit" (belum lunas)
- Outstanding balance = jumlah semua tagihan bon yang belum dibayar

### 3. Validasi Transaksi
Saat kasir memproses transaksi bon:
1. Sistem menghitung: Outstanding Balance + Transaksi Baru
2. Jika total > Rp 2.000.000 → Transaksi **DITOLAK**
3. Jika total ≤ Rp 2.000.000 → Transaksi **DIIZINKAN**

## Cara Menggunakan

### Di Halaman POS

1. **Pilih Anggota**
   - Pilih anggota dari dropdown "Anggota"
   - Sistem akan otomatis menampilkan info kredit anggota

2. **Info Kredit Ditampilkan**
   - **Tagihan**: Total bon yang belum dibayar
   - **Tersedia**: Sisa kredit yang bisa digunakan
   - **Status Indikator**:
     - 🟢 **Hijau (Safe)**: Kredit terpakai < 80%
     - 🟡 **Kuning (Warning)**: Kredit terpakai 80-94%
     - 🔴 **Merah (Critical)**: Kredit terpakai ≥ 95%

3. **Proses Transaksi**
   - Tambahkan barang ke keranjang
   - Pilih metode pembayaran:
     - **Cash**: Tidak ada batasan kredit
     - **Bon (Kredit)**: Akan divalidasi terhadap batas kredit
   - Klik "Bayar"

4. **Jika Melebihi Batas**
   - Sistem akan menampilkan pesan error
   - Pesan berisi: tagihan saat ini, jumlah transaksi, dan batas kredit
   - Transaksi tidak akan diproses

## Contoh Kasus

### Kasus 1: Transaksi Berhasil
- Outstanding Balance: Rp 1.500.000
- Transaksi Baru: Rp 400.000
- Total: Rp 1.900.000 ✅ (di bawah Rp 2.000.000)
- **Status**: Transaksi DIIZINKAN

### Kasus 2: Transaksi Ditolak
- Outstanding Balance: Rp 1.800.000
- Transaksi Baru: Rp 500.000
- Total: Rp 2.300.000 ❌ (melebihi Rp 2.000.000)
- **Status**: Transaksi DITOLAK

### Kasus 3: Transaksi Cash
- Outstanding Balance: Rp 1.900.000
- Transaksi Baru: Rp 1.000.000 (CASH)
- **Status**: Transaksi DIIZINKAN (cash tidak dibatasi)

## Indikator Visual

### Status Kredit Safe (Hijau)
```
Info Kredit
Tagihan: Rp 500.000
Tersedia: Rp 1.500.000
✅ Kredit tersedia (25.0% terpakai)
```

### Status Kredit Warning (Kuning)
```
Info Kredit
Tagihan: Rp 1.700.000
Tersedia: Rp 300.000
⚠️ Mendekati batas kredit (85.0% terpakai)
```

### Status Kredit Critical (Merah)
```
Info Kredit
Tagihan: Rp 1.950.000
Tersedia: Rp 50.000
⚠️ Batas kredit hampir habis! (97.5% terpakai)
```

## Pesan Error

Jika transaksi melebihi batas kredit, sistem akan menampilkan:

```
Transaksi melebihi batas kredit. 
Tagihan saat ini: Rp 1.800.000
Transaksi: Rp 500.000
Batas: Rp 2.000.000
```

## Tips untuk Kasir

1. **Selalu cek info kredit** sebelum memproses transaksi bon
2. **Perhatikan indikator warna**:
   - Hijau: Aman
   - Kuning: Hati-hati, mendekati batas
   - Merah: Hampir habis, kemungkinan ditolak
3. **Untuk anggota dengan kredit penuh**: Sarankan pembayaran cash atau pelunasan tagihan terlebih dahulu
4. **Transaksi cash selalu diizinkan** tanpa batasan

## Catatan Penting

- ✅ Batas kredit berlaku **per anggota**
- ✅ Hanya transaksi **bon (kredit)** yang dibatasi
- ✅ Transaksi **cash tidak dibatasi**
- ✅ Batas kredit: **Rp 2.000.000**
- ✅ Outstanding balance dihitung **real-time**
- ✅ Anggota tipe "Umum" **tidak bisa bon**, hanya cash

## Troubleshooting

### Transaksi Ditolak Padahal Seharusnya Bisa
1. Refresh halaman POS
2. Pilih ulang anggota dari dropdown
3. Cek apakah ada transaksi bon yang belum tercatat lunas

### Info Kredit Tidak Muncul
1. Pastikan sudah memilih anggota (bukan "Umum")
2. Refresh halaman
3. Cek console browser untuk error

### Batas Kredit Tidak Akurat
1. Cek riwayat transaksi anggota
2. Pastikan semua pembayaran sudah tercatat
3. Pastikan status transaksi yang sudah lunas berubah menjadi "lunas"

## Dukungan

Jika mengalami masalah atau memiliki pertanyaan, hubungi administrator sistem.
