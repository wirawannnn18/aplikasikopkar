# Fitur Uang Bayar dan Kembalian - Point of Sales

## Deskripsi Fitur

Fitur ini menambahkan input uang bayar dan perhitungan kembalian otomatis pada Point of Sales untuk transaksi cash.

---

## Fitur yang Ditambahkan

### 1. Input Uang Bayar
- Input field untuk memasukkan jumlah uang yang dibayarkan pelanggan
- Hanya muncul untuk metode pembayaran **Cash**
- Otomatis tersembunyi untuk metode **Bon (Kredit)**

### 2. Tombol Quick Input
Tombol cepat untuk mempermudah input:
- **Uang Pas** - Set uang bayar sama dengan total belanja
- **50K** - Tambah Rp 50.000 dari total
- **100K** - Tambah Rp 100.000 dari total

### 3. Perhitungan Kembalian Otomatis
- Kembalian dihitung otomatis saat input uang bayar
- Update real-time saat total berubah (tambah/kurang item)
- Indikator visual:
  - **Hijau** - Uang cukup, kembalian normal
  - **Merah** - Uang kurang dari total

### 4. Validasi Pembayaran
- Tidak bisa proses pembayaran jika uang bayar kosong
- Tidak bisa proses jika uang bayar kurang dari total
- Alert otomatis untuk validasi

### 5. Struk Pembayaran
Struk otomatis menampilkan:
- Total belanja
- Uang bayar (untuk cash)
- Kembalian (untuk cash)
- Label "KREDIT / BON" (untuk bon)

---

## Cara Penggunaan

### Transaksi Cash

1. **Pilih Barang**
   - Scan barcode atau klik barang
   - Barang masuk ke keranjang

2. **Pilih Metode Pembayaran**
   - Pilih "Cash" (default)
   - Section uang bayar akan muncul

3. **Input Uang Bayar**
   - **Cara 1**: Ketik manual jumlah uang
   - **Cara 2**: Klik "Uang Pas" untuk pas
   - **Cara 3**: Klik "50K" atau "100K" untuk tambah

4. **Lihat Kembalian**
   - Kembalian otomatis terhitung
   - Warna hijau = OK
   - Warna merah = Uang kurang

5. **Proses Pembayaran**
   - Klik tombol "Bayar"
   - Struk otomatis tercetak
   - Keranjang otomatis kosong

### Transaksi Bon (Kredit)

1. **Pilih Anggota**
   - Pilih anggota dari dropdown
   - Hanya anggota tipe "Anggota" atau "Non-Anggota"

2. **Pilih Metode Pembayaran**
   - Pilih "Bon (Kredit)"
   - Section uang bayar otomatis tersembunyi

3. **Proses Pembayaran**
   - Klik tombol "Bayar"
   - Struk tercetak dengan label "KREDIT / BON"
   - Tagihan masuk ke piutang anggota

---

## Contoh Skenario

### Skenario 1: Uang Pas
```
Total Belanja: Rp 50.000
Klik "Uang Pas"
Uang Bayar: Rp 50.000
Kembalian: Rp 0
Status: ✅ OK
```

### Skenario 2: Uang Lebih
```
Total Belanja: Rp 47.500
Input Uang Bayar: Rp 50.000
Kembalian: Rp 2.500
Status: ✅ OK
```

### Skenario 3: Uang Kurang
```
Total Belanja: Rp 50.000
Input Uang Bayar: Rp 45.000
Kembalian: Uang kurang!
Status: ❌ Tidak bisa bayar
```

### Skenario 4: Quick Button 50K
```
Total Belanja: Rp 47.500
Klik "50K"
Uang Bayar: Rp 97.500 (47.500 + 50.000)
Kembalian: Rp 50.000
Status: ✅ OK
```

### Skenario 5: Quick Button 100K
```
Total Belanja: Rp 87.500
Klik "100K"
Uang Bayar: Rp 187.500 (87.500 + 100.000)
Kembalian: Rp 100.000
Status: ✅ OK
```

---

## Validasi

### Validasi Input
- ✅ Uang bayar harus diisi untuk cash
- ✅ Uang bayar harus >= total belanja
- ✅ Hanya angka yang diterima
- ✅ Tidak bisa negatif

### Validasi Metode
- ✅ Cash: Wajib input uang bayar
- ✅ Bon: Tidak perlu uang bayar
- ✅ Bon: Harus pilih anggota
- ✅ Bon: Anggota harus tipe "Anggota" atau "Non-Anggota"

---

## Integrasi dengan Sistem

### Data Transaksi
Setiap transaksi menyimpan:
```javascript
{
  id: "...",
  tanggal: "...",
  kasir: "...",
  anggotaId: "...",
  metode: "cash" / "bon",
  items: [...],
  total: 50000,
  uangBayar: 100000,      // Untuk cash
  kembalian: 50000,       // Untuk cash
  status: "lunas" / "kredit"
}
```

### Struk Pembayaran
Struk otomatis menampilkan:
- Informasi koperasi
- Detail transaksi
- Item belanja
- **Total**
- **Uang Bayar** (cash)
- **Kembalian** (cash)
- Label "KREDIT / BON" (bon)

### Laporan
Data uang bayar dan kembalian tersimpan untuk:
- Riwayat transaksi
- Laporan penjualan
- Rekonsiliasi kas
- Audit trail

---

## Tips untuk Kasir

### ✅ DO (Lakukan)
- Selalu cek kembalian sebelum bayar
- Gunakan tombol "Uang Pas" untuk transaksi pas
- Gunakan tombol "50K" atau "100K" untuk mempercepat
- Pastikan uang bayar sudah benar sebelum klik "Bayar"
- Cek struk sebelum berikan ke pelanggan

### ❌ DON'T (Jangan)
- Jangan klik "Bayar" jika kembalian merah
- Jangan lupa input uang bayar
- Jangan asal klik tombol quick tanpa cek
- Jangan proses jika pelanggan belum bayar

---

## Keyboard Shortcuts

Untuk mempercepat transaksi:
- **Tab** - Pindah ke field uang bayar
- **Enter** - Proses pembayaran (jika sudah valid)
- **Esc** - Batal transaksi

---

## Troubleshooting

### Kembalian Tidak Muncul
**Penyebab**: Input uang bayar kosong  
**Solusi**: Masukkan jumlah uang bayar

### Kembalian Salah
**Penyebab**: Total berubah setelah input  
**Solusi**: Kembalian otomatis update, cek lagi

### Tidak Bisa Bayar
**Penyebab**: Uang bayar kurang atau kosong  
**Solusi**: 
- Cek input uang bayar
- Pastikan >= total
- Lihat alert error

### Section Bayar Tidak Muncul
**Penyebab**: Metode pembayaran "Bon"  
**Solusi**: Ganti ke "Cash"

### Tombol Quick Tidak Bekerja
**Penyebab**: JavaScript error  
**Solusi**: 
- Refresh browser
- Cek console untuk error
- Hubungi administrator

---

## Update Log

**v1.2 - Fitur Bayar & Kembalian**
- ✅ Added input uang bayar
- ✅ Added perhitungan kembalian otomatis
- ✅ Added tombol quick input (Uang Pas, 50K, 100K)
- ✅ Added validasi uang bayar
- ✅ Added indikator visual (hijau/merah)
- ✅ Updated struk dengan info bayar & kembalian
- ✅ Added toggle show/hide berdasarkan metode
- ✅ Added real-time update saat cart berubah

**v1.1 - Perbaikan Tutup Kasir**
- ✅ Fixed parameter inline di modal
- ✅ Added validation untuk data buka kas

**v1.0 - Initial Release**
- ✅ Fitur POS dasar
- ✅ Transaksi cash & bon
- ✅ Print struk

---

## Fitur Mendatang

Rencana pengembangan:
- [ ] Shortcut keyboard untuk quick input
- [ ] History uang bayar terakhir
- [ ] Suggest uang bayar berdasarkan nominal umum
- [ ] Split payment (sebagian cash, sebagian bon)
- [ ] Multi currency
- [ ] Diskon per item atau total
- [ ] Voucher / kupon

---

## Feedback

Jika ada saran atau masalah:
- Hubungi administrator
- Laporkan bug dengan screenshot
- Berikan feedback untuk perbaikan
