# Panduan Hapus Data Anggota Keluar Permanen

## Deskripsi

Fitur ini memungkinkan admin untuk menghapus permanen data anggota keluar setelah proses pengembalian simpanan selesai dan surat pengunduran diri telah dicetak. Data yang dihapus tidak dapat dipulihkan, namun jurnal akuntansi dan audit log tetap tersimpan untuk keperluan audit.

## ⚠️ PERINGATAN PENTING

- **Data yang dihapus TIDAK DAPAT dipulihkan**
- Pastikan surat pengunduran diri sudah dicetak dan diserahkan kepada anggota
- Pastikan semua proses pengembalian sudah selesai
- Fitur ini hanya untuk membersihkan data yang sudah tidak diperlukan

## Kapan Menggunakan Fitur Ini?

Gunakan fitur ini ketika:
- ✅ Pengembalian simpanan sudah selesai diproses
- ✅ Surat pengunduran diri sudah dicetak dan diserahkan
- ✅ Tidak ada pinjaman aktif yang belum lunas
- ✅ Tidak ada hutang POS yang belum dibayar
- ✅ Anda ingin membersihkan storage dari data yang tidak diperlukan

## Data yang Akan Dihapus

Ketika Anda menghapus data anggota keluar, sistem akan menghapus:

1. **Data Anggota** - Record anggota dari master anggota
2. **Data Simpanan** - Semua record simpanan pokok, wajib, dan sukarela
3. **Transaksi POS** - Semua transaksi POS yang terkait dengan anggota
4. **Data Pinjaman** - Pinjaman yang sudah lunas
5. **Riwayat Pembayaran** - Riwayat pembayaran hutang/piutang

## Data yang TETAP Tersimpan

Data berikut TIDAK akan dihapus untuk keperluan audit:

1. **Jurnal Akuntansi** - Semua jurnal tetap tersimpan
2. **Data Pengembalian** - Record pengembalian simpanan tetap ada
3. **Audit Log** - Semua log aktivitas tetap tersimpan

## Cara Menggunakan

### Metode 1: Dari Surat Pengunduran Diri

1. Buka menu **Anggota Keluar**
2. Pilih anggota yang ingin dihapus datanya
3. Klik tombol **Cetak Surat Pengunduran Diri**
4. Setelah surat terbuka, klik tombol **🗑️ Hapus Data Permanen** (tombol merah di pojok kanan atas)
5. Sistem akan menutup window surat dan menampilkan modal konfirmasi
6. Baca peringatan dengan teliti
7. Ketik **HAPUS** (huruf kapital) di kolom konfirmasi
8. Klik tombol **Hapus Permanen**
9. Data akan dihapus dan Anda akan melihat notifikasi sukses

### Metode 2: Dari Detail Anggota Keluar

1. Buka menu **Anggota Keluar**
2. Pilih anggota yang ingin dihapus datanya
3. Klik tombol **Hapus Data Permanen** (jika tersedia)
4. Sistem akan menampilkan modal konfirmasi
5. Baca peringatan dengan teliti
6. Ketik **HAPUS** (huruf kapital) di kolom konfirmasi
7. Klik tombol **Hapus Permanen**
8. Data akan dihapus dan Anda akan melihat notifikasi sukses

## Validasi Sistem

Sistem akan melakukan validasi sebelum menghapus data:

### ✅ Validasi yang Harus Dipenuhi:

1. **Status Pengembalian = Selesai**
   - Pengembalian simpanan harus sudah diproses
   - Error jika status masih "Pending"

2. **Tidak Ada Pinjaman Aktif**
   - Semua pinjaman harus sudah lunas
   - Error jika masih ada pinjaman yang belum lunas

3. **Tidak Ada Hutang POS**
   - Semua hutang POS harus sudah dibayar
   - Error jika masih ada hutang yang belum lunas

### ❌ Pesan Error yang Mungkin Muncul:

- **"Penghapusan hanya bisa dilakukan setelah pengembalian selesai"**
  - Solusi: Proses pengembalian simpanan terlebih dahulu

- **"Anggota masih memiliki N pinjaman aktif"**
  - Solusi: Lunasi semua pinjaman terlebih dahulu

- **"Anggota masih memiliki hutang POS sebesar Rp X"**
  - Solusi: Bayar semua hutang POS terlebih dahulu

## Konfirmasi Penghapusan

Modal konfirmasi akan menampilkan:

1. **Peringatan** - Data tidak dapat dipulihkan
2. **Identitas Anggota** - Nama dan NIK
3. **Daftar Data yang Akan Dihapus**
4. **Daftar Data yang Tetap Tersimpan**
5. **Kolom Konfirmasi** - Harus ketik "HAPUS"

### Cara Konfirmasi:

1. Baca semua informasi dengan teliti
2. Ketik **HAPUS** (huruf kapital semua) di kolom konfirmasi
3. Klik tombol **Hapus Permanen**
4. Tunggu proses selesai

### Membatalkan Penghapusan:

- Klik tombol **Batal** atau
- Klik di luar modal atau
- Tekan tombol **ESC** atau
- Tutup modal dengan tombol **X**

## Audit Trail

Setiap penghapusan data akan dicatat dalam audit log dengan informasi:

- **User ID** - Siapa yang melakukan penghapusan
- **Timestamp** - Kapan penghapusan dilakukan
- **Anggota ID & Nama** - Anggota yang datanya dihapus
- **Detail Data** - Jumlah record yang dihapus per kategori
- **Severity** - WARNING (karena ini operasi sensitif)

Audit log dapat dilihat di menu **Audit Log** untuk keperluan audit.

## Rollback Otomatis

Jika terjadi error selama proses penghapusan:

1. Sistem akan otomatis melakukan rollback
2. Semua data akan dikembalikan ke kondisi sebelum penghapusan
3. Error akan dicatat di audit log
4. User akan melihat pesan error yang jelas

## Best Practices

### ✅ DO (Lakukan):

1. **Cetak surat terlebih dahulu** - Pastikan surat sudah dicetak dan diserahkan
2. **Verifikasi data** - Pastikan data yang akan dihapus sudah benar
3. **Cek validasi** - Pastikan tidak ada pinjaman atau hutang aktif
4. **Baca peringatan** - Baca semua peringatan dengan teliti
5. **Backup data** - Lakukan backup berkala untuk jaga-jaga

### ❌ DON'T (Jangan):

1. **Jangan terburu-buru** - Baca semua informasi dengan teliti
2. **Jangan hapus sebelum cetak surat** - Cetak surat terlebih dahulu
3. **Jangan hapus jika ada kewajiban** - Lunasi semua kewajiban terlebih dahulu
4. **Jangan hapus tanpa konfirmasi** - Pastikan data yang akan dihapus sudah benar

## Troubleshooting

### Tombol "Hapus Data Permanen" Tidak Muncul

**Penyebab:**
- Status pengembalian belum "Selesai"
- Anggota bukan berstatus "Keluar"

**Solusi:**
- Proses pengembalian simpanan terlebih dahulu
- Pastikan anggota sudah ditandai keluar

### Error "Anggota masih memiliki pinjaman aktif"

**Penyebab:**
- Ada pinjaman yang belum lunas

**Solusi:**
- Buka menu **Pinjaman**
- Cari pinjaman anggota tersebut
- Lunasi semua pinjaman
- Coba hapus data lagi

### Error "Anggota masih memiliki hutang POS"

**Penyebab:**
- Ada hutang POS yang belum dibayar

**Solusi:**
- Buka menu **Pembayaran Hutang/Piutang**
- Cari hutang anggota tersebut
- Bayar semua hutang
- Coba hapus data lagi

### Konfirmasi Tidak Diterima

**Penyebab:**
- Tidak mengetik "HAPUS" dengan benar
- Menggunakan huruf kecil

**Solusi:**
- Ketik **HAPUS** dengan huruf kapital semua
- Jangan ada spasi di awal atau akhir
- Pastikan tidak ada typo

## FAQ (Frequently Asked Questions)

### Q: Apakah data yang dihapus bisa dipulihkan?
**A:** Tidak. Data yang dihapus tidak dapat dipulihkan. Pastikan Anda sudah yakin sebelum menghapus.

### Q: Apakah jurnal akuntansi ikut terhapus?
**A:** Tidak. Jurnal akuntansi tetap tersimpan untuk keperluan audit dan laporan keuangan.

### Q: Apakah data pengembalian ikut terhapus?
**A:** Tidak. Data pengembalian tetap tersimpan sebagai referensi historis.

### Q: Bagaimana jika saya salah hapus data?
**A:** Data tidak dapat dipulihkan. Oleh karena itu, sistem meminta konfirmasi eksplisit dengan mengetik "HAPUS".

### Q: Apakah bisa hapus data tanpa cetak surat?
**A:** Secara teknis bisa, tapi tidak disarankan. Sebaiknya cetak surat terlebih dahulu sebagai bukti.

### Q: Apakah ada log siapa yang menghapus data?
**A:** Ya. Setiap penghapusan dicatat di audit log dengan user ID, timestamp, dan detail data yang dihapus.

### Q: Bagaimana jika ada error saat menghapus?
**A:** Sistem akan otomatis melakukan rollback dan mengembalikan semua data ke kondisi semula.

### Q: Apakah harus hapus data setelah pengembalian?
**A:** Tidak wajib. Fitur ini opsional untuk membersihkan storage. Anda bisa memilih untuk tetap menyimpan data.

## Kontak Support

Jika Anda mengalami masalah atau memiliki pertanyaan:

1. Cek dokumentasi ini terlebih dahulu
2. Cek audit log untuk melihat detail error
3. Hubungi administrator sistem
4. Laporkan bug jika ditemukan masalah teknis

---

**Terakhir diupdate:** Desember 2024  
**Versi:** 1.0.0
