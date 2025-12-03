# Panduan Super Admin: Hapus Transaksi Tertutup

## Daftar Isi
1. [Pendahuluan](#pendahuluan)
2. [Persyaratan Akses](#persyaratan-akses)
3. [Langkah-Langkah Penghapusan](#langkah-langkah-penghapusan)
4. [Kategori Kesalahan](#kategori-kesalahan)
5. [Dampak Penghapusan](#dampak-penghapusan)
6. [Rate Limiting](#rate-limiting)
7. [Audit Trail](#audit-trail)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Pendahuluan

Fitur hapus transaksi tertutup memungkinkan Super Admin untuk menghapus transaksi POS yang sudah masuk dalam laporan tutup kasir yang telah ditutup. Fitur ini dirancang untuk menangani kasus kesalahan kritis yang baru ditemukan setelah tutup kasir.

**⚠️ PERINGATAN PENTING:**
- Fitur ini memiliki dampak signifikan terhadap integritas laporan keuangan
- Hanya gunakan untuk kasus yang benar-benar mendesak
- Semua aktivitas akan dicatat dalam audit trail level CRITICAL
- Terdapat batasan jumlah penghapusan per hari

---

## Persyaratan Akses

### 1. Role Super Admin
- Hanya user dengan role `administrator` yang dapat mengakses fitur ini
- User dengan role lain akan ditolak secara otomatis

### 2. Verifikasi Password
- Setiap penghapusan memerlukan konfirmasi password
- Password harus dimasukkan ulang untuk setiap transaksi
- Maksimal 3 kali percobaan salah
- Setelah 3 kali gagal, akses akan diblokir selama 5 menit

### 3. Rate Limiting
- **Peringatan:** Setelah 5 penghapusan dalam 1 hari
- **Blokir:** Setelah 10 penghapusan dalam 1 hari
- Counter direset setiap hari pada pukul 00:00

---

## Langkah-Langkah Penghapusan

### Langkah 1: Identifikasi Transaksi Tertutup

1. Buka halaman **Hapus Transaksi**
2. Cari transaksi yang ingin dihapus
3. Perhatikan badge **"Shift Tertutup"** berwarna merah
4. Gunakan filter "Transaksi Tertutup" untuk mempermudah pencarian

### Langkah 2: Lihat Detail Transaksi

1. Klik pada transaksi untuk melihat detail
2. Periksa informasi shift:
   - Nomor Laporan
   - Tanggal Tutup
   - Kasir
   - Total Penjualan
3. Pastikan ini adalah transaksi yang benar-benar perlu dihapus

### Langkah 3: Inisiasi Penghapusan

1. Klik tombol **"Hapus"** pada transaksi tertutup
2. Dialog peringatan akan muncul secara otomatis

### Langkah 4: Pahami Dampak

Dialog peringatan akan menampilkan:
- Informasi transaksi lengkap
- Daftar dampak yang akan terjadi:
  - Adjustment laporan tutup kasir
  - Pembuatan jurnal pembalik
  - Pengembalian stok
  - Perubahan laporan keuangan
  - Pencatatan audit trail CRITICAL

**Centang checkbox:** "Saya memahami konsekuensi dari tindakan ini"

### Langkah 5: Verifikasi Password

1. Masukkan password Anda saat ini
2. Sistem akan memverifikasi password
3. Jika salah, Anda memiliki 2 percobaan lagi
4. Setelah 3 kali gagal, akses diblokir 5 menit

### Langkah 6: Pilih Kategori dan Alasan

1. **Pilih Kategori Kesalahan:**
   - Kesalahan Input
   - Transaksi Duplikat
   - Fraud
   - Koreksi Akuntansi
   - Lainnya

2. **Masukkan Alasan Detail:**
   - Minimal 20 karakter
   - Maksimal 1000 karakter
   - Jelaskan secara spesifik mengapa transaksi perlu dihapus
   - Sertakan informasi yang relevan untuk audit

3. **Review Ringkasan:**
   - Periksa kembali semua informasi
   - Pastikan kategori dan alasan sudah benar

### Langkah 7: Konfirmasi Final

1. Klik tombol **"Konfirmasi Penghapusan"**
2. Sistem akan:
   - Melakukan validasi pre-deletion
   - Menghapus transaksi
   - Mengembalikan stok
   - Membuat jurnal pembalik
   - Menyesuaikan laporan tutup kasir
   - Membuat audit log CRITICAL
   - Melakukan validasi post-deletion

3. Jika berhasil, Anda akan menerima:
   - Notifikasi sukses
   - **Audit ID** (simpan untuk referensi)
   - Peringatan jika mendekati rate limit

### Langkah 8: Verifikasi Hasil

1. Periksa transaksi sudah terhapus dari daftar
2. Cek laporan tutup kasir sudah disesuaikan
3. Verifikasi jurnal pembalik sudah dibuat
4. Pastikan stok sudah dikembalikan

---

## Kategori Kesalahan

### 1. Kesalahan Input
**Gunakan untuk:**
- Salah input harga
- Salah input jumlah barang
- Salah pilih barang
- Kesalahan data pelanggan

**Contoh Alasan:**
> "Transaksi ini salah input harga. Seharusnya Rp 50.000 tetapi tercatat Rp 500.000. Kesalahan baru ditemukan setelah tutup kasir karena pelanggan komplain."

### 2. Transaksi Duplikat
**Gunakan untuk:**
- Transaksi tercatat dua kali
- Double entry karena error sistem
- Transaksi yang sudah dibatalkan tetapi masih tercatat

**Contoh Alasan:**
> "Transaksi ini adalah duplikat dari transaksi #POS-20240115-001. Terjadi double entry karena koneksi terputus saat proses penyimpanan pertama."

### 3. Fraud
**Gunakan untuk:**
- Transaksi mencurigakan
- Transaksi tidak sah
- Manipulasi data

**Contoh Alasan:**
> "Transaksi ini terindikasi fraud. Setelah investigasi, ditemukan bahwa transaksi ini dibuat tanpa sepengetahuan manajemen dan tidak ada barang yang benar-benar keluar."

### 4. Koreksi Akuntansi
**Gunakan untuk:**
- Kesalahan pencatatan akuntansi
- Penyesuaian periode
- Koreksi klasifikasi akun

**Contoh Alasan:**
> "Transaksi ini perlu dikoreksi karena salah periode pencatatan. Seharusnya masuk periode Januari tetapi tercatat di Desember. Diperlukan untuk penyesuaian laporan keuangan tahunan."

### 5. Lainnya
**Gunakan untuk:**
- Kasus yang tidak masuk kategori di atas
- Situasi khusus yang memerlukan penjelasan detail

**Contoh Alasan:**
> "Transaksi ini perlu dihapus karena sistem error yang menyebabkan data corrupt. Transaksi tidak dapat diproses dengan benar dan menyebabkan ketidaksesuaian data inventory."

---

## Dampak Penghapusan

### 1. Laporan Tutup Kasir
**Yang Terjadi:**
- Total penjualan dikurangi sesuai nilai transaksi
- Total kas dikurangi (untuk transaksi cash)
- Total piutang dikurangi (untuk transaksi kredit)
- Catatan adjustment ditambahkan

**Contoh:**
```
Sebelum:
- Total Penjualan: Rp 5.000.000
- Total Kas: Rp 3.000.000

Setelah (hapus transaksi Rp 100.000 cash):
- Total Penjualan: Rp 4.900.000
- Total Kas: Rp 2.900.000
- Adjustment: -Rp 100.000 (Penghapusan #POS-001)
```

### 2. Jurnal Akuntansi
**Jurnal Pembalik Dibuat:**

**Untuk Transaksi Cash:**
```
Debit: Pendapatan Penjualan (4-1000)  Rp 100.000
Kredit: Kas (1-1000)                  Rp 100.000
Tag: CLOSED_SHIFT_REVERSAL
```

**Untuk Transaksi Kredit:**
```
Debit: Pendapatan Penjualan (4-1000)  Rp 100.000
Kredit: Piutang Anggota (1-1200)      Rp 100.000
Tag: CLOSED_SHIFT_REVERSAL
```

**Reversal HPP:**
```
Debit: Persediaan Barang (1-1300)     Rp 70.000
Kredit: HPP (5-1000)                  Rp 70.000
Tag: CLOSED_SHIFT_REVERSAL
```

### 3. Stok Barang
**Yang Terjadi:**
- Stok setiap item dikembalikan sesuai qty transaksi
- Perubahan stok tercatat dalam sistem

**Contoh:**
```
Item: Beras 5kg
Stok Sebelum: 50
Qty Transaksi: 2
Stok Setelah: 52
```

### 4. Laporan Keuangan
**Laporan yang Terpengaruh:**
- Laporan Laba Rugi (pendapatan berkurang)
- Neraca (kas/piutang berkurang)
- Laporan Arus Kas
- Laporan Persediaan

---

## Rate Limiting

### Threshold dan Konsekuensi

#### Level 1: Normal (0-4 penghapusan/hari)
- ✅ Tidak ada peringatan
- ✅ Proses berjalan normal

#### Level 2: Warning (5-9 penghapusan/hari)
- ⚠️ Peringatan ditampilkan
- ⚠️ Diminta justifikasi tambahan
- ✅ Masih dapat melanjutkan

**Pesan:**
> "Peringatan: Anda telah menghapus 5 transaksi tertutup hari ini. Harap berhati-hati."

#### Level 3: Blocked (10+ penghapusan/hari)
- ❌ Akses diblokir
- ❌ Tidak dapat menghapus lagi hari ini
- 📝 Notifikasi dikirim ke log sistem

**Pesan:**
> "Batas maksimal penghapusan transaksi tertutup tercapai (10 per hari). Akses diblokir."

### Reset Counter
- Counter direset otomatis setiap hari pukul 00:00
- Tidak ada cara manual untuk reset counter
- Hubungi administrator sistem jika ada kebutuhan mendesak

---

## Audit Trail

### Informasi yang Dicatat

Setiap penghapusan transaksi tertutup dicatat dengan level **CRITICAL** dan mencakup:

#### 1. Audit ID
Format: `AUDIT-CLOSED-YYYYMMDD-NNNN`
- Contoh: `AUDIT-CLOSED-20240115-0001`
- Unik untuk setiap penghapusan
- Gunakan untuk referensi dan tracking

#### 2. Informasi Transaksi
- ID dan nomor transaksi
- Tanggal transaksi
- Total dan metode pembayaran
- Kasir
- Detail item (snapshot lengkap)

#### 3. Informasi Shift
- Snapshot BEFORE adjustment
- Snapshot AFTER adjustment
- Perubahan yang terjadi

#### 4. Informasi Penghapusan
- Kategori kesalahan
- Alasan detail
- User yang menghapus
- Timestamp penghapusan
- Timestamp verifikasi password

#### 5. Informasi Sistem
- User agent (browser)
- Platform
- Language
- Timestamp

#### 6. Jurnal dan Adjustment
- Semua jurnal pembalik yang dibuat
- Data adjustment tutup kasir
- Hasil validasi pre dan post deletion

#### 7. Status
- Stock restored: Ya/Tidak
- Warnings (jika ada)

### Mengakses Audit Trail

1. Buka halaman **Riwayat Penghapusan**
2. Pilih tab **"Transaksi Tertutup"**
3. Semua entry akan memiliki badge **CRITICAL**
4. Klik pada entry untuk melihat detail lengkap

### Export Audit Trail

1. Buka detail audit log
2. Klik tombol **"Export to PDF"**
3. PDF akan berisi semua informasi audit lengkap
4. Simpan untuk keperluan audit eksternal

---

## Troubleshooting

### Problem 1: Akses Ditolak
**Gejala:** Pesan "Akses ditolak. Hanya Super Admin..."

**Solusi:**
1. Pastikan Anda login sebagai administrator
2. Logout dan login kembali
3. Hubungi administrator sistem jika masih bermasalah

### Problem 2: Password Salah Terus
**Gejala:** Password selalu ditolak meskipun yakin benar

**Solusi:**
1. Periksa Caps Lock
2. Pastikan tidak ada spasi di awal/akhir
3. Reset password jika perlu
4. Tunggu 5 menit jika sudah diblokir

### Problem 3: Akses Diblokir
**Gejala:** "Akses diblokir sementara selama 5 menit..."

**Solusi:**
1. Tunggu 5 menit
2. Jangan mencoba login lagi selama periode blokir
3. Setelah 5 menit, coba lagi dengan password yang benar

### Problem 4: Rate Limit Tercapai
**Gejala:** "Batas maksimal penghapusan... tercapai"

**Solusi:**
1. Tunggu hingga hari berikutnya (reset pukul 00:00)
2. Evaluasi apakah penghapusan benar-benar diperlukan
3. Hubungi administrator sistem untuk kasus mendesak

### Problem 5: Validasi Gagal
**Gejala:** "Validasi gagal: [detail error]"

**Solusi:**
1. Baca pesan error dengan teliti
2. Periksa integritas data transaksi
3. Pastikan shift masih ada di sistem
4. Hubungi tim teknis jika error persisten

### Problem 6: Rollback Terjadi
**Gejala:** "Validasi integritas data gagal. Melakukan rollback..."

**Solusi:**
1. Ini adalah mekanisme keamanan otomatis
2. Periksa log error untuk detail
3. Verifikasi data tidak corrupt
4. Coba lagi setelah memastikan data konsisten
5. Hubungi tim teknis jika masalah berlanjut

---

## Best Practices

### 1. Sebelum Menghapus

✅ **DO:**
- Verifikasi transaksi benar-benar salah
- Dokumentasikan alasan dengan detail
- Konsultasi dengan tim keuangan jika perlu
- Backup data sebelum penghapusan massal
- Periksa dampak terhadap laporan keuangan

❌ **DON'T:**
- Menghapus tanpa investigasi menyeluruh
- Menggunakan alasan yang tidak jelas
- Menghapus banyak transaksi sekaligus tanpa review
- Menghapus untuk menutupi kesalahan lain

### 2. Saat Menghapus

✅ **DO:**
- Baca semua peringatan dengan teliti
- Pilih kategori yang tepat
- Tulis alasan minimal 50 karakter (lebih detail lebih baik)
- Simpan Audit ID untuk referensi
- Verifikasi hasil setelah penghapusan

❌ **DON'T:**
- Skip membaca peringatan
- Menggunakan alasan generic
- Menghapus terburu-buru
- Lupa mencatat Audit ID

### 3. Setelah Menghapus

✅ **DO:**
- Verifikasi laporan tutup kasir sudah disesuaikan
- Cek jurnal pembalik sudah dibuat
- Pastikan stok sudah dikembalikan
- Dokumentasikan dalam catatan internal
- Informasikan ke tim terkait jika perlu

❌ **DON'T:**
- Asumsikan semuanya otomatis benar
- Lupa verifikasi hasil
- Tidak mendokumentasikan

### 4. Monitoring

✅ **DO:**
- Review audit trail secara berkala
- Monitor jumlah penghapusan per hari
- Identifikasi pola kesalahan
- Lakukan perbaikan proses jika perlu

❌ **DON'T:**
- Mengabaikan audit trail
- Tidak melakukan review berkala
- Membiarkan kesalahan berulang

### 5. Keamanan

✅ **DO:**
- Jaga kerahasiaan password
- Logout setelah selesai
- Gunakan fitur ini hanya saat diperlukan
- Laporkan aktivitas mencurigakan

❌ **DON'T:**
- Share password dengan orang lain
- Biarkan komputer unlocked
- Menggunakan fitur untuk tujuan tidak sah

---

## Kontak dan Dukungan

Jika Anda mengalami masalah atau memiliki pertanyaan:

1. **Tim Teknis:** Untuk masalah sistem dan error
2. **Tim Keuangan:** Untuk konsultasi dampak keuangan
3. **Administrator Sistem:** Untuk masalah akses dan keamanan

**Catatan Penting:**
- Simpan Audit ID untuk setiap penghapusan
- Dokumentasikan semua aktivitas
- Laporkan anomali segera
- Ikuti prosedur yang telah ditetapkan

---

**Versi Dokumen:** 1.0.0  
**Terakhir Diperbarui:** 2024  
**Status:** Final
