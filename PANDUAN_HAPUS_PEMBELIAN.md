# Panduan Hapus Transaksi Pembelian

## Deskripsi Fitur

Fitur hapus pembelian memungkinkan Anda untuk menghapus transaksi pembelian yang sudah tercatat dalam sistem. Ketika transaksi dihapus, sistem akan secara otomatis:
- Mengurangi stok barang sesuai dengan qty yang tercatat dalam transaksi
- Menghapus transaksi dari daftar pembelian
- Memberikan peringatan jika stok menjadi negatif

## Cara Menggunakan

### Langkah 1: Buka Halaman Pembelian
1. Login ke aplikasi
2. Klik menu "Inventory" atau "Pembelian"
3. Anda akan melihat daftar transaksi pembelian

### Langkah 2: Pilih Transaksi yang Akan Dihapus
1. Cari transaksi yang ingin dihapus dalam tabel
2. Perhatikan informasi transaksi:
   - No. Faktur
   - Tanggal
   - Supplier
   - Total Item
   - Total Harga

### Langkah 3: Klik Tombol Hapus
1. Pada kolom "Aksi", klik tombol **merah dengan icon tempat sampah** (🗑️)
2. Tombol ini berada di sebelah tombol Edit

### Langkah 4: Konfirmasi Penghapusan
1. Dialog konfirmasi akan muncul dengan pesan:
   > "Yakin ingin menghapus transaksi pembelian ini? Stok barang akan dikurangi sesuai dengan qty dalam transaksi."

2. Pilih salah satu:
   - **OK/Ya**: Lanjutkan penghapusan
   - **Batal/Cancel**: Batalkan penghapusan

### Langkah 5: Verifikasi Hasil
1. Jika berhasil, akan muncul notifikasi:
   > "Transaksi pembelian berhasil dihapus, stok telah disesuaikan"

2. Transaksi akan hilang dari daftar
3. Stok barang akan berkurang sesuai qty dalam transaksi

## Peringatan Penting

### ⚠️ Stok Negatif
Jika penghapusan menyebabkan stok menjadi negatif, sistem akan:
- Tetap melakukan penghapusan
- Menampilkan peringatan: "Stok barang [nama barang] menjadi negatif: [jumlah]"
- Anda perlu melakukan penyesuaian stok manual

### ⚠️ Tidak Dapat Dibatalkan
Setelah transaksi dihapus, **tidak dapat dikembalikan**. Pastikan Anda yakin sebelum mengkonfirmasi penghapusan.

### ⚠️ Dampak pada Stok
Penghapusan akan mengurangi stok barang. Contoh:
- Stok saat ini: 100 unit
- Qty dalam transaksi yang dihapus: 10 unit
- Stok setelah dihapus: 90 unit

## Contoh Penggunaan

### Contoh 1: Hapus Transaksi Normal
**Situasi**: Transaksi pembelian salah input, perlu dihapus

**Data Transaksi**:
- No. Faktur: PB001
- Item: Barang A (10 unit), Barang B (5 unit)
- Stok Barang A saat ini: 100 unit
- Stok Barang B saat ini: 50 unit

**Langkah**:
1. Klik tombol hapus pada transaksi PB001
2. Konfirmasi penghapusan
3. Sistem menghapus transaksi
4. Stok Barang A menjadi: 90 unit (100 - 10)
5. Stok Barang B menjadi: 45 unit (50 - 5)

### Contoh 2: Hapus dengan Peringatan Stok Negatif
**Situasi**: Transaksi perlu dihapus, tapi stok sudah berkurang

**Data Transaksi**:
- No. Faktur: PB002
- Item: Barang C (20 unit)
- Stok Barang C saat ini: 15 unit (sudah terjual 5 unit)

**Langkah**:
1. Klik tombol hapus pada transaksi PB002
2. Konfirmasi penghapusan
3. Sistem menampilkan peringatan: "Stok barang Barang C menjadi negatif: -5"
4. Transaksi tetap dihapus
5. Stok Barang C menjadi: -5 unit
6. **Tindakan**: Lakukan penyesuaian stok manual atau input ulang transaksi yang benar

## Troubleshooting

### Masalah: Tombol Hapus Tidak Muncul
**Solusi**:
- Refresh halaman (F5)
- Pastikan Anda memiliki akses untuk menghapus transaksi
- Periksa apakah ada error di console browser (F12)

### Masalah: Konfirmasi Tidak Muncul
**Solusi**:
- Pastikan browser tidak memblokir popup/dialog
- Coba browser lain
- Clear cache browser

### Masalah: Stok Tidak Berkurang
**Solusi**:
- Refresh halaman untuk melihat data terbaru
- Periksa di menu Master Barang untuk verifikasi stok
- Periksa console browser untuk error

### Masalah: Transaksi Tidak Terhapus
**Solusi**:
- Pastikan Anda mengklik "OK" pada dialog konfirmasi
- Refresh halaman
- Periksa apakah ada error di console browser
- Coba hapus transaksi lain untuk test

## Tips dan Best Practices

### ✅ Sebelum Menghapus
1. **Verifikasi Data**: Pastikan transaksi yang akan dihapus memang salah
2. **Cek Stok**: Periksa stok barang saat ini
3. **Backup**: Jika perlu, catat data transaksi sebelum dihapus
4. **Koordinasi**: Informasikan ke tim jika transaksi besar

### ✅ Setelah Menghapus
1. **Verifikasi Stok**: Cek apakah stok sudah sesuai
2. **Cek Laporan**: Pastikan laporan keuangan terupdate
3. **Input Ulang**: Jika perlu, input transaksi yang benar
4. **Dokumentasi**: Catat alasan penghapusan untuk audit

### ✅ Alternatif Penghapusan
Jika ragu untuk menghapus, pertimbangkan:
1. **Edit Transaksi**: Gunakan fitur edit untuk memperbaiki data
2. **Jurnal Koreksi**: Buat jurnal penyesuaian manual
3. **Konsultasi**: Tanyakan ke supervisor atau admin

## FAQ (Frequently Asked Questions)

**Q: Apakah transaksi yang dihapus bisa dikembalikan?**
A: Tidak, penghapusan bersifat permanen. Pastikan Anda yakin sebelum menghapus.

**Q: Bagaimana jika stok menjadi negatif setelah dihapus?**
A: Sistem akan memberikan peringatan. Anda perlu melakukan penyesuaian stok manual atau input ulang transaksi yang benar.

**Q: Apakah jurnal akuntansi otomatis terupdate?**
A: Saat ini jurnal belum otomatis terupdate. Fitur ini akan ditambahkan di update berikutnya.

**Q: Bisakah saya menghapus banyak transaksi sekaligus?**
A: Saat ini hanya bisa menghapus satu per satu. Fitur bulk delete akan dipertimbangkan untuk update mendatang.

**Q: Apakah ada log/riwayat penghapusan?**
A: Saat ini belum ada log penghapusan. Fitur audit trail akan ditambahkan di update berikutnya.

## Kontak Support

Jika mengalami masalah atau memiliki pertanyaan:
- Hubungi admin sistem
- Buka issue di repository GitHub
- Email: support@koperasi.com

## Update Log

**Versi 1.0 (2024-01-15)**
- Fitur hapus pembelian pertama kali dirilis
- Konfirmasi penghapusan
- Pengurangan stok otomatis
- Peringatan stok negatif

---

*Dokumen ini akan diupdate seiring dengan perkembangan fitur.*
