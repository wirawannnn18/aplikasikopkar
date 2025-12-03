# Panduan Jurnal Akuntansi Pembelian

## Ringkasan
Sistem sekarang secara otomatis membuat jurnal akuntansi ketika transaksi pembelian diedit atau dihapus. Ini memastikan catatan keuangan tetap akurat dan sesuai dengan prinsip akuntansi double-entry.

## Fitur Jurnal Otomatis

### 1. Jurnal Koreksi (Edit Pembelian)
Ketika Anda mengedit transaksi pembelian dan mengubah total nilai:

**Jika Total Bertambah** (pembelian lebih besar):
- Debit: Persediaan Barang (1-1300)
- Kredit: Kas (1-1000)
- Jumlah: Selisih antara total baru dan lama

**Jika Total Berkurang** (pembelian lebih kecil):
- Debit: Kas (1-1000)
- Kredit: Persediaan Barang (1-1300)
- Jumlah: Selisih antara total lama dan baru

**Jika Total Tidak Berubah**:
- Tidak ada jurnal yang dibuat

### 2. Jurnal Pembalik (Hapus Pembelian)
Ketika Anda menghapus transaksi pembelian:

**Jurnal Pembalik**:
- Debit: Kas (1-1000)
- Kredit: Persediaan Barang (1-1300)
- Jumlah: Total transaksi yang dihapus

Jurnal ini membatalkan jurnal pembelian original.

## Cara Kerja

### Edit Pembelian
1. Klik tombol "Edit" pada transaksi pembelian
2. Ubah data (item, qty, harga, dll)
3. Klik "Simpan"
4. Sistem akan:
   - Menyesuaikan stok barang
   - Menghitung ulang HPP
   - **Membuat jurnal koreksi otomatis** (jika total berubah)
   - Menampilkan notifikasi sukses

### Hapus Pembelian
1. Klik tombol "Hapus" pada transaksi pembelian
2. Konfirmasi penghapusan
3. Sistem akan:
   - Mengurangi stok barang
   - **Membuat jurnal pembalik otomatis**
   - Menghapus transaksi
   - Menampilkan notifikasi sukses

## Contoh Kasus

### Contoh 1: Edit Pembelian (Total Bertambah)
**Transaksi Lama**:
- No. Faktur: PB001
- Total: Rp 1.000.000

**Transaksi Baru**:
- No. Faktur: PB001
- Total: Rp 1.500.000

**Jurnal Koreksi yang Dibuat**:
```
Tanggal: [Tanggal transaksi]
Keterangan: Koreksi Pembelian - PB001

Debit  : Persediaan Barang (1-1300) = Rp 500.000
Kredit : Kas (1-1000)               = Rp 500.000
```

### Contoh 2: Edit Pembelian (Total Berkurang)
**Transaksi Lama**:
- No. Faktur: PB002
- Total: Rp 2.000.000

**Transaksi Baru**:
- No. Faktur: PB002
- Total: Rp 1.800.000

**Jurnal Koreksi yang Dibuat**:
```
Tanggal: [Tanggal transaksi]
Keterangan: Koreksi Pembelian - PB002

Debit  : Kas (1-1000)               = Rp 200.000
Kredit : Persediaan Barang (1-1300) = Rp 200.000
```

### Contoh 3: Hapus Pembelian
**Transaksi yang Dihapus**:
- No. Faktur: PB003
- Total: Rp 3.000.000

**Jurnal Pembalik yang Dibuat**:
```
Tanggal: [Tanggal transaksi]
Keterangan: Pembatalan Pembelian - PB003

Debit  : Kas (1-1000)               = Rp 3.000.000
Kredit : Persediaan Barang (1-1300) = Rp 3.000.000
```

## Melihat Jurnal

Untuk melihat jurnal yang telah dibuat:
1. Buka menu "Keuangan"
2. Pilih "Jurnal Harian"
3. Cari jurnal dengan keterangan "Koreksi Pembelian" atau "Pembatalan Pembelian"

## Validasi Otomatis

Sistem secara otomatis memvalidasi:
- ✓ Total Debit = Total Kredit (jurnal balance)
- ✓ Akun yang digunakan benar (1-1000 dan 1-1300)
- ✓ Jumlah sesuai dengan selisih/total transaksi

## Penanganan Error

Jika terjadi error saat membuat jurnal:
- Operasi edit/hapus tetap dilanjutkan
- Anda akan menerima notifikasi peringatan
- Error dicatat di console browser untuk debugging
- Stok tetap disesuaikan dengan benar

**Catatan**: Jika Anda melihat peringatan tentang jurnal, hubungi administrator untuk memastikan jurnal dibuat secara manual.

## Akun COA yang Digunakan

Pastikan akun-akun berikut ada di Chart of Account (COA):

| Kode   | Nama Akun          | Tipe  |
|--------|-------------------|-------|
| 1-1000 | Kas               | Aset  |
| 1-1300 | Persediaan Barang | Aset  |

Jika akun tidak ada, tambahkan melalui menu "Keuangan" → "Chart of Account (COA)".

## Tips

1. **Selalu Cek Jurnal**: Setelah edit/hapus, cek jurnal untuk memastikan entry dibuat dengan benar
2. **Backup Data**: Lakukan backup LocalStorage secara berkala
3. **Konsistensi Tanggal**: Gunakan tanggal transaksi yang benar untuk audit trail yang akurat
4. **Review Berkala**: Review jurnal secara berkala untuk memastikan tidak ada anomali

## Troubleshooting

### Jurnal Tidak Dibuat
**Kemungkinan Penyebab**:
- Akun COA (1-1000 atau 1-1300) tidak ada
- Error di console browser

**Solusi**:
1. Buka Developer Tools (F12)
2. Cek tab Console untuk error messages
3. Pastikan akun COA ada
4. Refresh halaman dan coba lagi

### Jurnal Tidak Balance
**Kemungkinan Penyebab**:
- Bug dalam perhitungan (seharusnya tidak terjadi karena ada validasi)

**Solusi**:
1. Laporkan ke administrator
2. Jangan edit jurnal secara manual
3. Tunggu perbaikan dari developer

## Dukungan

Jika Anda mengalami masalah atau memiliki pertanyaan:
- Hubungi administrator sistem
- Laporkan error dengan screenshot dan langkah-langkah yang dilakukan
- Sertakan informasi dari console browser jika ada error

---

**Versi**: 1.0  
**Tanggal**: 2024  
**Status**: Aktif
