# Panduan Pengajuan Modal Kasir

## Daftar Isi
1. [Pengenalan](#pengenalan)
2. [Untuk Kasir](#untuk-kasir)
3. [Untuk Admin](#untuk-admin)
4. [Pengaturan Sistem](#pengaturan-sistem)
5. [FAQ](#faq)
6. [Troubleshooting](#troubleshooting)

---

## Pengenalan

Fitur **Pengajuan Modal Kasir** memungkinkan kasir untuk mengajukan permintaan modal awal kepada admin koperasi sebelum membuka shift kasir. Fitur ini memastikan bahwa kasir memiliki modal yang cukup untuk melakukan transaksi.

### Manfaat:
- ✅ Kasir dapat mengajukan modal sesuai kebutuhan
- ✅ Admin dapat mengontrol distribusi modal
- ✅ Proses approval yang terstruktur
- ✅ Audit trail lengkap untuk setiap pengajuan
- ✅ Notifikasi otomatis untuk kasir dan admin

---

## Untuk Kasir

### 1. Mengajukan Modal Kasir

#### Langkah-langkah:

**Step 1: Buka Halaman POS**
1. Login sebagai kasir
2. Klik menu "Point of Sales"
3. Jika belum buka kas, akan muncul form "Buka Kas"

**Step 2: Klik Tombol "Ajukan Modal"**
1. Di halaman Buka Kas, klik tombol **"Ajukan Modal"**
2. Anda akan diarahkan ke form pengajuan modal

**Step 3: Isi Form Pengajuan**
1. **Jumlah Modal yang Diminta**: Masukkan jumlah dalam Rupiah
   - Contoh: 2000000 (untuk Rp 2.000.000)
   - Maksimum sesuai batas yang ditentukan admin
   
2. **Keterangan** (Opsional): Jelaskan kebutuhan modal Anda
   - Contoh: "Modal untuk shift pagi, estimasi transaksi tinggi"

3. Klik tombol **"Kirim Pengajuan"**

**Step 4: Tunggu Persetujuan**
- Pengajuan Anda akan berstatus **"Pending"**
- Admin akan menerima notifikasi
- Anda akan menerima notifikasi saat pengajuan diproses

#### Catatan Penting:
- ⚠️ Anda hanya dapat memiliki **1 pengajuan pending** pada satu waktu
- ⚠️ Tidak dapat mengajukan modal jika masih memiliki **shift kasir aktif**
- ⚠️ Jumlah modal tidak boleh melebihi **batas maksimum** yang ditentukan

---

### 2. Melihat Status Pengajuan

#### Di Halaman Buka Kas:

**Status Pending**:
```
⏰ Pengajuan Modal Menunggu Persetujuan
Pengajuan modal Anda sebesar Rp 2.000.000 sedang menunggu persetujuan admin.
Diajukan pada: 9 Desember 2024, 10:30
```
- Anda tidak dapat membuka kas atau mengajukan modal baru
- Tunggu hingga admin memproses pengajuan

**Status Disetujui**:
```
✅ Pengajuan Modal Disetujui
Modal Anda sebesar Rp 2.000.000 telah disetujui oleh Admin Koperasi.
Modal akan otomatis terisi saat buka kas.
```
- Modal awal akan otomatis terisi
- Input modal manual akan di-disable
- Klik "Buka Kas" untuk memulai shift

**Status Ditolak**:
```
❌ Pengajuan Modal Ditolak
Pengajuan modal Anda sebesar Rp 2.000.000 ditolak.
Alasan: Jumlah terlalu besar untuk shift siang
```
- Anda dapat mengajukan modal baru
- Atau buka kas dengan modal manual

---

### 3. Menerima Notifikasi

#### Notifikasi Approval:
- 🔔 Badge notifikasi muncul di navbar (angka merah)
- Klik icon bell untuk melihat notifikasi
- Notifikasi: "Pengajuan Modal Disetujui"
- Klik notifikasi untuk ke halaman riwayat

#### Notifikasi Rejection:
- 🔔 Badge notifikasi muncul di navbar
- Notifikasi: "Pengajuan Modal Ditolak"
- Klik untuk melihat alasan penolakan

---

### 4. Membuka Kas dengan Modal yang Disetujui

#### Langkah-langkah:

**Step 1: Buka Halaman POS**
- Setelah pengajuan disetujui, buka menu "Point of Sales"

**Step 2: Lihat Form Buka Kas**
- Modal awal sudah terisi otomatis
- Input modal di-disable (tidak bisa diubah)

**Step 3: Klik "Buka Kas"**
- Shift kasir akan dibuka
- Pengajuan modal akan ditandai sebagai "Sudah Digunakan"
- Anda dapat mulai melakukan transaksi

---

### 5. Melihat Riwayat Pengajuan

#### Langkah-langkah:

**Step 1: Buka Menu Riwayat**
1. Klik menu **"Riwayat Pengajuan Modal"** di sidebar

**Step 2: Filter Riwayat**
- **Filter Status**: Pilih status (Semua, Pending, Disetujui, Ditolak, Sudah Digunakan)
- Klik dropdown untuk memfilter

**Step 3: Lihat Detail**
- Klik tombol **"Detail"** pada setiap pengajuan
- Lihat informasi lengkap:
  - Status pengajuan
  - Jumlah modal
  - Tanggal pengajuan
  - Admin yang memproses
  - Alasan penolakan (jika ditolak)
  - Info shift kasir (jika sudah digunakan)

---

## Untuk Admin

### 1. Melihat Pengajuan Pending

#### Langkah-langkah:

**Step 1: Buka Menu Kelola Pengajuan**
1. Login sebagai admin
2. Klik menu **"Kelola Pengajuan Modal"**

**Step 2: Lihat Daftar Pending**
- Badge menunjukkan jumlah pengajuan pending
- Daftar pengajuan ditampilkan dengan informasi:
  - Nama kasir
  - Jumlah modal yang diminta
  - Tanggal pengajuan
  - Keterangan

**Step 3: Filter dan Search**
- **Filter Status**: Pilih status untuk melihat pengajuan tertentu
- **Filter Tanggal**: Pilih rentang tanggal
- **Search Kasir**: Ketik nama kasir untuk mencari

---

### 2. Menyetujui Pengajuan

#### Langkah-langkah:

**Step 1: Klik Tombol "Setujui"**
- Pada pengajuan yang ingin disetujui, klik tombol **"Setujui"**

**Step 2: Konfirmasi Approval**
- Modal konfirmasi akan muncul dengan detail pengajuan:
  - Kasir: [Nama Kasir]
  - Jumlah: Rp 2.000.000
  - Tanggal: 9 Desember 2024, 10:30
  - Keterangan: [Keterangan dari kasir]

**Step 3: Klik "Ya, Setujui"**
- Pengajuan akan disetujui
- Status berubah menjadi **"Disetujui"**
- Kasir menerima notifikasi approval
- Audit trail dicatat

#### Catatan:
- ✅ Kasir dapat langsung menggunakan modal untuk buka kas
- ✅ Modal akan otomatis terisi saat kasir buka kas
- ✅ Pengajuan akan ditandai "Sudah Digunakan" setelah kasir buka kas

---

### 3. Menolak Pengajuan

#### Langkah-langkah:

**Step 1: Klik Tombol "Tolak"**
- Pada pengajuan yang ingin ditolak, klik tombol **"Tolak"**

**Step 2: Isi Alasan Penolakan**
- Modal penolakan akan muncul
- **Alasan Penolakan** (WAJIB): Jelaskan mengapa ditolak
  - Contoh: "Jumlah terlalu besar untuk shift siang"
  - Contoh: "Modal masih tersedia dari shift sebelumnya"

**Step 3: Klik "Ya, Tolak"**
- Pengajuan akan ditolak
- Status berubah menjadi **"Ditolak"**
- Kasir menerima notifikasi rejection dengan alasan
- Audit trail dicatat

#### Catatan:
- ⚠️ Alasan penolakan **WAJIB** diisi
- ✅ Kasir dapat melihat alasan penolakan
- ✅ Kasir dapat mengajukan modal baru setelah ditolak

---

### 4. Melihat Riwayat Pengajuan

#### Langkah-langkah:

**Step 1: Buka Menu Riwayat**
1. Klik menu **"Riwayat Pengajuan Modal"**

**Step 2: Lihat Statistics**
- **Disetujui**: Total pengajuan yang disetujui
- **Ditolak**: Total pengajuan yang ditolak
- **Sudah Digunakan**: Total pengajuan yang sudah digunakan
- **Total Modal Disetujui**: Total nilai modal yang disetujui

**Step 3: Filter Riwayat**
- **Filter Status**: Pilih status (Semua, Disetujui, Ditolak, Sudah Digunakan)
- **Filter Tanggal**: Pilih rentang tanggal (dari-sampai)
- **Search Kasir**: Ketik nama kasir

**Step 4: Lihat Detail**
- Klik tombol **"Detail"** untuk melihat informasi lengkap
- Informasi yang ditampilkan:
  - Status pengajuan
  - Jumlah modal
  - Kasir
  - Tanggal pengajuan
  - Admin yang memproses
  - Tanggal diproses
  - Keterangan
  - Alasan penolakan (jika ditolak)
  - Info shift kasir (jika sudah digunakan)

---

### 5. Export Riwayat ke CSV

#### Langkah-langkah:

**Step 1: Filter Data (Opsional)**
- Filter berdasarkan status, tanggal, atau kasir
- Hanya data yang terfilter yang akan diekspor

**Step 2: Klik "Export CSV"**
- Klik tombol **"Export CSV"** di pojok kanan atas

**Step 3: Download File**
- File CSV akan otomatis terdownload
- Nama file: `riwayat_pengajuan_modal_YYYY-MM-DD.csv`

**Isi File CSV**:
- Tanggal Pengajuan
- Kasir
- Jumlah Modal
- Status
- Admin
- Tanggal Diproses
- Keterangan
- Alasan Penolakan

---

## Pengaturan Sistem

### Untuk Super Admin

#### Mengatur Konfigurasi Pengajuan Modal:

**Step 1: Buka Pengaturan Sistem**
1. Login sebagai super admin
2. Klik menu **"Pengaturan Sistem"**

**Step 2: Scroll ke Section "Pengajuan Modal Kasir"**

**Step 3: Atur Konfigurasi**

1. **Enable/Disable Fitur**
   - Toggle ON/OFF untuk mengaktifkan/menonaktifkan fitur
   - Jika OFF, kasir tidak dapat mengajukan modal

2. **Batas Maksimum Pengajuan**
   - Masukkan jumlah maksimum dalam Rupiah
   - Contoh: 5000000 (untuk Rp 5.000.000)
   - Kasir tidak dapat mengajukan melebihi batas ini

3. **Require Approval**
   - Toggle ON: Semua pengajuan harus disetujui admin
   - Toggle OFF: Pengajuan otomatis disetujui (tidak direkomendasikan)

4. **Auto-Approve Amount**
   - Masukkan jumlah untuk auto-approve
   - Contoh: 1000000 (untuk Rp 1.000.000)
   - Pengajuan ≤ jumlah ini akan otomatis disetujui
   - Jika "Require Approval" OFF, setting ini diabaikan

**Step 4: Klik "Simpan Pengaturan"**
- Konfigurasi akan disimpan
- Perubahan langsung berlaku

---

## FAQ

### Untuk Kasir:

**Q: Berapa lama pengajuan saya diproses?**
A: Tergantung admin. Anda akan menerima notifikasi segera setelah diproses.

**Q: Apakah saya bisa mengajukan modal lagi jika ditolak?**
A: Ya, Anda dapat mengajukan modal baru setelah pengajuan sebelumnya ditolak.

**Q: Apakah saya bisa membatalkan pengajuan yang pending?**
A: Tidak, Anda harus menunggu admin memproses. Hubungi admin jika ingin membatalkan.

**Q: Apakah saya bisa mengubah jumlah modal setelah diajukan?**
A: Tidak, Anda harus menunggu pengajuan diproses. Jika ditolak, Anda dapat mengajukan dengan jumlah baru.

**Q: Apakah saya bisa buka kas tanpa pengajuan modal?**
A: Ya, Anda dapat buka kas dengan modal manual jika tidak ada pengajuan approved.

**Q: Bagaimana jika saya lupa menggunakan modal yang sudah disetujui?**
A: Modal yang disetujui hanya dapat digunakan untuk 1 shift. Jika tidak digunakan, Anda perlu mengajukan lagi.

### Untuk Admin:

**Q: Apakah saya bisa mengubah keputusan setelah approve/reject?**
A: Tidak, keputusan bersifat final. Kasir harus mengajukan baru jika ditolak.

**Q: Apakah ada batas waktu untuk memproses pengajuan?**
A: Tidak ada batas waktu, tapi sebaiknya diproses segera agar kasir dapat bekerja.

**Q: Apakah saya bisa melihat siapa yang memproses pengajuan?**
A: Ya, di riwayat pengajuan, Anda dapat melihat admin yang memproses setiap pengajuan.

**Q: Apakah data pengajuan bisa dihapus?**
A: Tidak, semua data pengajuan disimpan untuk audit trail dan tidak dapat dihapus.

---

## Troubleshooting

### Masalah Umum:

#### 1. Tombol "Ajukan Modal" Tidak Muncul

**Penyebab**:
- Fitur pengajuan modal di-disable oleh admin
- Anda sudah memiliki pengajuan pending
- Anda sudah memiliki pengajuan approved

**Solusi**:
- Hubungi admin untuk mengaktifkan fitur
- Tunggu pengajuan pending diproses
- Gunakan modal yang sudah approved untuk buka kas

---

#### 2. Error "Jumlah modal melebihi batas maksimum"

**Penyebab**:
- Jumlah yang Anda ajukan melebihi batas maksimum yang ditentukan admin

**Solusi**:
- Kurangi jumlah modal yang diminta
- Lihat batas maksimum di form pengajuan
- Hubungi admin jika memerlukan modal lebih besar

---

#### 3. Error "Tidak dapat mengajukan modal. Anda masih memiliki shift kasir aktif"

**Penyebab**:
- Anda masih memiliki shift kasir yang belum ditutup

**Solusi**:
- Tutup kasir terlebih dahulu
- Setelah tutup kasir, Anda dapat mengajukan modal baru

---

#### 4. Notifikasi Tidak Muncul

**Penyebab**:
- Browser cache
- Notifikasi belum di-refresh

**Solusi**:
- Refresh halaman (F5)
- Logout dan login kembali
- Clear browser cache

---

#### 5. Modal Tidak Auto-Fill Saat Buka Kas

**Penyebab**:
- Pengajuan belum disetujui
- Pengajuan sudah digunakan untuk shift sebelumnya

**Solusi**:
- Cek status pengajuan di riwayat
- Jika sudah digunakan, ajukan modal baru
- Hubungi admin jika pengajuan seharusnya approved

---

## Kontak Support

Jika mengalami masalah yang tidak tercantum di panduan ini, hubungi:

- **Admin Koperasi**: [Kontak Admin]
- **IT Support**: [Kontak IT]

---

**Versi**: 1.0
**Terakhir Diupdate**: 9 Desember 2024
**Dibuat oleh**: Tim Pengembang Aplikasi Koperasi
