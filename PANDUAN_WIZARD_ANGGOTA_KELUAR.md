# Panduan Pengguna: Wizard Anggota Keluar

## 📖 Daftar Isi

1. [Pengenalan](#pengenalan)
2. [Cara Menggunakan Wizard](#cara-menggunakan-wizard)
3. [Tahap-Tahap Wizard](#tahap-tahap-wizard)
4. [Kode Error dan Solusi](#kode-error-dan-solusi)
5. [Tips dan Best Practices](#tips-dan-best-practices)
6. [FAQ](#faq)

---

## Pengenalan

Wizard Anggota Keluar adalah fitur yang memandu admin koperasi melalui proses terstruktur untuk memproses anggota yang keluar dari koperasi. Wizard ini memastikan semua langkah dilakukan dengan benar dan tidak ada yang terlewat.

### Keuntungan Menggunakan Wizard

✅ **Terstruktur** - Proses 5 tahap yang jelas dan berurutan  
✅ **Aman** - Validasi otomatis di setiap tahap  
✅ **Akurat** - Jurnal accounting dibuat otomatis  
✅ **Terlacak** - Semua aksi tercatat dalam audit log  
✅ **Dapat Dibatalkan** - Rollback otomatis jika terjadi error  

---

## Cara Menggunakan Wizard

### Langkah 1: Buka Menu Anggota Keluar

1. Login sebagai admin
2. Klik menu **"Anggota Keluar"** di sidebar
3. Cari anggota yang akan diproses keluar

### Langkah 2: Mulai Wizard

1. Klik tombol **"Proses Keluar (Wizard)"** pada baris anggota
2. Wizard akan terbuka dengan 5 tahap yang harus diselesaikan

### Langkah 3: Ikuti Tahap-Tahap Wizard

Selesaikan setiap tahap secara berurutan:
1. Validasi Hutang/Piutang
2. Pencairan Simpanan
3. Print Dokumen
4. Update Status
5. Verifikasi Accounting

### Langkah 4: Selesaikan Wizard

Setelah semua tahap selesai, klik tombol **"Selesai"** untuk menyelesaikan proses.

---

## Tahap-Tahap Wizard

### Tahap 1: Validasi Hutang/Piutang

**Tujuan:** Memastikan anggota tidak memiliki kewajiban finansial yang belum diselesaikan

**Apa yang Diperiksa:**
- ✅ Pinjaman aktif (sisaPinjaman > 0)
- ✅ Piutang aktif (sisaPiutang > 0)

**Hasil:**
- ✅ **LULUS** - Anggota tidak memiliki kewajiban, dapat lanjut ke tahap berikutnya
- ❌ **GAGAL** - Anggota masih memiliki kewajiban, wizard diblokir

**Jika Gagal:**
1. Catat detail kewajiban yang ditampilkan
2. Selesaikan semua pinjaman dan piutang terlebih dahulu
3. Mulai wizard lagi setelah kewajiban selesai

**Contoh Pesan Error:**
```
Anggota masih memiliki kewajiban finansial yang belum diselesaikan

Detail:
- Pinjaman Aktif: 2 pinjaman, Total: Rp 5.000.000
- Piutang Aktif: 1 piutang, Total: Rp 500.000
```

---

### Tahap 2: Pencairan Simpanan

**Tujuan:** Menghitung dan memproses pengembalian simpanan kepada anggota

**Informasi yang Ditampilkan:**
- Simpanan Pokok
- Simpanan Wajib
- Simpanan Sukarela
- Total Simpanan
- Saldo Kas/Bank saat ini
- Proyeksi saldo setelah pencairan

**Input yang Diperlukan:**
1. **Metode Pembayaran** (wajib)
   - Kas
   - Transfer Bank

2. **Tanggal Pembayaran** (wajib)
   - Format: YYYY-MM-DD
   - Tidak boleh di masa depan

3. **Keterangan** (opsional)
   - Catatan tambahan

**Proses Otomatis:**
- ✅ Jurnal simpanan pokok dibuat (Debit 2-1100, Kredit Kas/Bank)
- ✅ Jurnal simpanan wajib dibuat (Debit 2-1200, Kredit Kas/Bank)
- ✅ Jurnal simpanan sukarela dibuat (Debit 2-1300, Kredit Kas/Bank)
- ✅ Record pengembalian disimpan dengan referensi jurnal
- ✅ Validasi double-entry (Debit = Kredit)

**Tips:**
- Pastikan saldo kas/bank mencukupi sebelum memproses
- Periksa kembali jumlah sebelum melanjutkan
- Catat nomor referensi untuk arsip

---

### Tahap 3: Print Dokumen

**Tujuan:** Mencetak dokumen resmi untuk anggota dan arsip koperasi

**Dokumen yang Digenerate:**

1. **Surat Pengunduran Diri**
   - Identitas lengkap anggota
   - Tanggal keluar
   - Alasan keluar
   - Tanda tangan

2. **Bukti Pencairan Simpanan**
   - Rincian simpanan yang dikembalikan
   - Metode pembayaran
   - Tanggal pembayaran
   - Nomor referensi
   - Total pengembalian

**Cara Mencetak:**
1. Klik tombol **"Cetak Surat Pengunduran Diri"**
2. Dialog print akan terbuka
3. Pilih printer dan cetak
4. Ulangi untuk **"Cetak Bukti Pencairan"**

**Penting:**
- ⚠️ Pastikan kedua dokumen dicetak
- ⚠️ Simpan salinan untuk arsip koperasi
- ⚠️ Berikan dokumen asli kepada anggota

---

### Tahap 4: Update Status

**Tujuan:** Mengupdate status anggota menjadi "Keluar" di sistem

**Input yang Diperlukan:**
1. **Tanggal Keluar** (wajib)
   - Format: YYYY-MM-DD
   - Biasanya sama dengan tanggal pembayaran

2. **Alasan Keluar** (wajib)
   - Minimal 10 karakter
   - Jelaskan alasan dengan jelas

**Perubahan yang Dilakukan:**
- ✅ statusKeanggotaan → "Keluar"
- ✅ tanggalKeluar → diisi
- ✅ alasanKeluar → diisi
- ✅ pengembalianStatus → "Selesai"
- ✅ pengembalianId → referensi ke data pengembalian
- ✅ Referensi dokumen disimpan

**Setelah Update:**
- Anggota tidak dapat melakukan transaksi baru
- Data anggota tetap ada di sistem untuk arsip
- Laporan anggota keluar akan menampilkan anggota ini

---

### Tahap 5: Verifikasi Accounting

**Tujuan:** Memverifikasi bahwa semua jurnal tercatat dengan benar

**Yang Diverifikasi:**
1. ✅ Semua jurnal pencairan tercatat
2. ✅ Total debit = Total kredit (double-entry balance)
3. ✅ Total pencairan = Total jurnal
4. ✅ Saldo kas mencukupi
5. ✅ Tidak ada selisih keuangan

**Hasil Verifikasi:**
- ✅ **LULUS** - Semua verifikasi passed, wizard dapat diselesaikan
- ❌ **GAGAL** - Ada masalah dalam accounting, perlu perbaikan

**Jika Gagal:**
1. Catat detail error yang ditampilkan
2. Hubungi administrator sistem
3. Jangan lanjutkan proses
4. Data akan di-rollback otomatis

---

## Kode Error dan Solusi

### Error Validasi (Tahap 1)

#### OUTSTANDING_DEBT_EXISTS
**Pesan:** "Anggota masih memiliki kewajiban finansial yang belum diselesaikan"

**Penyebab:**
- Anggota memiliki pinjaman aktif (sisaPinjaman > 0)
- Anggota memiliki piutang aktif (sisaPiutang > 0)

**Solusi:**
1. Selesaikan semua pinjaman aktif
2. Bayar semua hutang POS
3. Coba lagi setelah kewajiban selesai

---

### Error Pencairan (Tahap 2)

#### INSUFFICIENT_BALANCE
**Pesan:** "Saldo kas/bank tidak mencukupi untuk pencairan"

**Penyebab:**
- Saldo kas < total pencairan (jika metode = Kas)
- Saldo bank < total pencairan (jika metode = Transfer Bank)

**Solusi:**
1. Periksa saldo kas dan bank
2. Tambah saldo jika diperlukan
3. Gunakan metode pembayaran yang berbeda
4. Tunda pencairan sampai saldo mencukupi

#### JOURNAL_IMBALANCE
**Pesan:** "Jurnal tidak seimbang. Terjadi kesalahan dalam pencatatan"

**Penyebab:**
- Total debit ≠ Total kredit
- Error dalam perhitungan jurnal

**Solusi:**
1. Hubungi administrator sistem
2. Jangan lanjutkan proses
3. Data akan di-rollback otomatis
4. Laporkan error untuk diperbaiki

---

### Error Sistem

#### ANGGOTA_NOT_FOUND
**Pesan:** "Anggota tidak ditemukan"

**Penyebab:**
- ID anggota tidak valid
- Data anggota sudah dihapus

**Solusi:**
1. Refresh halaman
2. Cari anggota lagi
3. Hubungi administrator jika masalah berlanjut

#### SYSTEM_ERROR
**Pesan:** "Terjadi kesalahan sistem"

**Penyebab:**
- Error tidak terduga dalam sistem
- Masalah koneksi atau storage

**Solusi:**
1. Coba lagi
2. Refresh halaman
3. Clear cache browser
4. Hubungi administrator jika masalah berlanjut

#### SNAPSHOT_FAILED
**Pesan:** "Gagal membuat backup data"

**Penyebab:**
- Kapasitas penyimpanan browser penuh
- Error dalam localStorage

**Solusi:**
1. Periksa kapasitas penyimpanan browser
2. Clear cache jika diperlukan
3. Coba refresh halaman
4. Hubungi administrator jika masalah berlanjut

#### ROLLBACK_FAILED
**Pesan:** "Gagal melakukan rollback. Data mungkin tidak konsisten"

**Penyebab:**
- Error critical dalam proses rollback
- Data corruption

**Solusi:**
1. **SEGERA** hubungi administrator
2. **JANGAN** lakukan transaksi lain
3. Backup data manual jika memungkinkan
4. Tunggu instruksi dari administrator

---

## Tips dan Best Practices

### Sebelum Memulai Wizard

✅ **Pastikan Data Lengkap**
- Verifikasi identitas anggota
- Pastikan semua simpanan tercatat
- Cek kewajiban yang belum diselesaikan

✅ **Siapkan Dokumen**
- Surat permohonan keluar dari anggota
- Dokumen pendukung lainnya

✅ **Cek Saldo**
- Pastikan saldo kas/bank mencukupi
- Rencanakan metode pembayaran

### Selama Proses Wizard

✅ **Baca Setiap Tahap dengan Teliti**
- Jangan skip informasi penting
- Periksa angka dan perhitungan

✅ **Simpan Nomor Referensi**
- Catat nomor referensi pengembalian
- Simpan untuk arsip dan tracking

✅ **Cetak Dokumen Segera**
- Jangan tunda pencetakan dokumen
- Pastikan kedua dokumen tercetak

### Setelah Wizard Selesai

✅ **Verifikasi Data**
- Cek status anggota sudah "Keluar"
- Verifikasi jurnal tercatat
- Pastikan saldo kas/bank berkurang

✅ **Arsipkan Dokumen**
- Simpan dokumen fisik dengan rapi
- Scan untuk backup digital

✅ **Informasikan Anggota**
- Berikan dokumen kepada anggota
- Jelaskan proses yang sudah dilakukan

---

## FAQ

### Q: Apakah wizard bisa dibatalkan di tengah proses?

**A:** Ya, klik tombol "Batal" kapan saja. Sistem akan menampilkan konfirmasi sebelum membatalkan. Perubahan yang sudah dilakukan akan di-rollback.

### Q: Bagaimana jika terjadi error di tengah proses?

**A:** Sistem memiliki mekanisme rollback otomatis. Jika terjadi error, semua perubahan akan dibatalkan dan data dikembalikan ke state sebelum wizard dimulai.

### Q: Apakah bisa kembali ke tahap sebelumnya?

**A:** Ya, gunakan tombol "Kembali" untuk navigasi ke tahap sebelumnya. Anda hanya bisa kembali ke tahap yang sudah diselesaikan.

### Q: Apakah bisa skip tahap tertentu?

**A:** Tidak. Semua tahap harus diselesaikan secara berurutan. Ini memastikan proses dilakukan dengan benar dan lengkap.

### Q: Bagaimana jika lupa mencetak dokumen?

**A:** Setelah wizard selesai, Anda masih bisa mencetak dokumen dari menu "Laporan Anggota Keluar". Cari anggota yang bersangkutan dan klik tombol cetak.

### Q: Apakah data anggota dihapus setelah keluar?

**A:** Tidak. Data anggota tetap ada di sistem untuk keperluan arsip dan pelaporan. Status anggota berubah menjadi "Keluar" tetapi data historis tetap tersimpan.

### Q: Bagaimana cara melihat riwayat proses?

**A:** Semua aksi tercatat dalam audit log. Admin dapat melihat riwayat lengkap dari menu "Audit Log" dengan filter anggota yang bersangkutan.

### Q: Apakah wizard bisa digunakan untuk banyak anggota sekaligus?

**A:** Tidak. Wizard memproses satu anggota per sesi. Ini memastikan setiap anggota diproses dengan teliti dan akurat.

### Q: Bagaimana jika anggota ingin kembali aktif?

**A:** Hubungi administrator untuk proses reaktivasi. Ini memerlukan persetujuan khusus dan proses manual.

### Q: Apakah ada batasan waktu untuk menyelesaikan wizard?

**A:** Tidak ada batasan waktu. Namun disarankan untuk menyelesaikan dalam satu sesi untuk menghindari data yang tidak konsisten.

---

## Kontak Support

Jika mengalami masalah atau memerlukan bantuan:

📧 **Email:** support@koperasi.com  
📞 **Telepon:** (021) 1234-5678  
💬 **Chat:** Tersedia di aplikasi (jam kerja)

---

**Versi Dokumen:** 1.0  
**Terakhir Diupdate:** 2024-12-09  
**Dibuat oleh:** Tim Pengembangan Koperasi

