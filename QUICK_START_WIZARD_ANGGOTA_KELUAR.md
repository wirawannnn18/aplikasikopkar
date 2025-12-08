# Quick Start: Wizard Anggota Keluar

**Version:** 1.0  
**Date:** 2024-12-09  
**For:** Super Admin & Administrator

## Overview

Wizard Anggota Keluar adalah fitur 5 langkah untuk memproses anggota yang keluar dari koperasi dengan aman dan terstruktur. Wizard ini memastikan semua aspek keuangan dan administrasi ditangani dengan benar.

## Akses Menu

### Langkah 1: Login
- Login sebagai **Super Admin** atau **Administrator**
- Kasir dan Admin Keuangan tidak memiliki akses

### Langkah 2: Buka Menu
- Klik menu **"Anggota Keluar"** di sidebar
- Icon: 📤 (box-arrow-right)
- Posisi: Setelah "Pinjaman"

## Tampilan Halaman

### Summary Cards (Atas)
```
┌─────────────────┬─────────────────┬─────────────────┐
│ Anggota Aktif   │ Pending         │ Selesai         │
│ 50              │ 5               │ 10              │
└─────────────────┴─────────────────┴─────────────────┘
```

### Tab Navigation
- **Tab 1:** Anggota Aktif - Daftar anggota yang bisa diproses keluar
- **Tab 2:** Anggota Keluar - Daftar anggota yang sudah/sedang diproses

## Cara Menggunakan Wizard

### Skenario 1: Proses Anggota Aktif Keluar

**Langkah-langkah:**

1. **Pilih Anggota**
   - Buka tab "Anggota Aktif"
   - Cari anggota yang akan keluar
   - Klik tombol **"Proses Keluar (Wizard)"**

2. **Step 1: Validasi Hutang/Piutang**
   - Wizard akan otomatis mengecek:
     - Pinjaman aktif
     - Hutang POS
   - **Jika ada hutang:** Wizard akan BLOCK dan tampilkan detail
   - **Jika tidak ada hutang:** Klik "Lanjut"

3. **Step 2: Pencairan Simpanan**
   - Lihat rincian simpanan:
     - Simpanan Pokok
     - Simpanan Wajib
     - Simpanan Sukarela
   - Isi form:
     - Metode Pembayaran (Kas/Transfer Bank)
     - Tanggal Pembayaran
     - Keterangan (opsional)
   - Klik "Proses Pencairan"
   - Wizard akan otomatis:
     - Membuat jurnal untuk setiap jenis simpanan
     - Mengurangi saldo kas/bank
     - Menyimpan record pengembalian

4. **Step 3: Print Dokumen**
   - Klik "Generate Dokumen"
   - Wizard akan membuat:
     - Surat Pengunduran Diri
     - Bukti Pencairan Simpanan
   - Dialog print akan muncul otomatis
   - Cetak dokumen
   - Klik "Lanjut"

5. **Step 4: Update Status**
   - Isi form:
     - Tanggal Keluar
     - Alasan Keluar (minimal 10 karakter)
   - Klik "Update Status"
   - Status anggota berubah menjadi "Keluar"

6. **Step 5: Verifikasi Accounting**
   - Wizard akan otomatis verifikasi:
     - Semua jurnal tercatat
     - Total debit = total kredit
     - Total pencairan = total jurnal
     - Saldo kas/bank mencukupi
   - Lihat hasil verifikasi
   - Klik "Selesai"

7. **Selesai!**
   - Wizard akan menutup
   - Anggota muncul di tab "Anggota Keluar"
   - Status: "Selesai"

### Skenario 2: Lanjutkan Proses Pending

**Jika proses terputus di tengah jalan:**

1. Buka tab "Anggota Keluar"
2. Cari anggota dengan status "Pending"
3. Klik tombol **"Lanjutkan"**
4. Wizard akan membuka di step terakhir yang belum selesai
5. Lanjutkan dari step tersebut

### Skenario 3: Cetak Ulang Dokumen

**Untuk anggota yang sudah selesai:**

1. Buka tab "Anggota Keluar"
2. Cari anggota dengan status "Selesai"
3. Klik tombol **"Cetak"**
4. Pilih dokumen yang ingin dicetak

## 5 Langkah Wizard (Detail)

### 🔍 Step 1: Validasi Hutang/Piutang
**Tujuan:** Memastikan anggota tidak memiliki kewajiban

**Validasi:**
- ✅ Tidak ada pinjaman aktif (sisaPinjaman > 0)
- ✅ Tidak ada hutang POS

**Hasil:**
- **PASS:** Lanjut ke Step 2
- **FAIL:** Wizard BLOCK, tampilkan detail hutang

### 💰 Step 2: Pencairan Simpanan
**Tujuan:** Menghitung dan memproses pengembalian simpanan

**Proses:**
1. Hitung total simpanan (pokok + wajib + sukarela)
2. Kurangi kewajiban lain (jika ada)
3. Buat jurnal untuk setiap jenis simpanan
4. Kurangi saldo kas/bank
5. Simpan record pengembalian

**Jurnal Otomatis:**
```
Debit: 2-1100 (Simpanan Pokok)
Debit: 2-1200 (Simpanan Wajib)
Debit: 2-1300 (Simpanan Sukarela)
Kredit: 1-1000 (Kas) atau 1-1100 (Bank)
```

### 📄 Step 3: Print Dokumen
**Tujuan:** Mencetak dokumen resmi

**Dokumen:**
1. **Surat Pengunduran Diri**
   - Identitas anggota lengkap
   - Tanggal keluar
   - Alasan keluar
   - Tanda tangan

2. **Bukti Pencairan Simpanan**
   - Rincian simpanan
   - Total pencairan
   - Metode pembayaran
   - Nomor referensi

### ✏️ Step 4: Update Status
**Tujuan:** Mengubah status anggota menjadi keluar

**Update:**
- Status: "Aktif" → "Nonaktif"
- Tanggal Keluar: [tanggal yang diinput]
- Alasan Keluar: [alasan yang diinput]
- Pengembalian Status: "Selesai"
- Pengembalian ID: [ID dari Step 2]

### ✔️ Step 5: Verifikasi Accounting
**Tujuan:** Memastikan semua jurnal tercatat dengan benar

**Verifikasi:**
1. ✅ Semua jurnal tercatat (3 jurnal)
2. ✅ Total debit = total kredit
3. ✅ Total pencairan = total jurnal
4. ✅ Saldo kas/bank mencukupi

**Hasil:**
- **PASS:** Proses selesai
- **FAIL:** Tampilkan detail error

## Fitur Keamanan

### Rollback Otomatis
- Jika terjadi error di Step 2, 4, atau 5
- Wizard akan otomatis rollback semua perubahan
- Data kembali ke kondisi sebelum proses dimulai

### Audit Log
Wizard mencatat 15 jenis event:
1. START_WIZARD_ANGGOTA_KELUAR
2. WIZARD_STEP_CHANGED
3. COMPLETE_STEP_1_VALIDATION
4. STEP_1_VALIDATION_FAILED
5. COMPLETE_STEP_2_PENCAIRAN
6. STEP_2_PENCAIRAN_FAILED
7. COMPLETE_STEP_3_PRINT
8. COMPLETE_STEP_4_UPDATE
9. STEP_4_UPDATE_FAILED
10. COMPLETE_STEP_5_VERIFICATION
11. STEP_5_VERIFICATION_FAILED
12. SNAPSHOT_CREATED
13. ROLLBACK_EXECUTED
14. WIZARD_COMPLETED
15. WIZARD_CANCELLED

### Validasi Sequential
- Tidak bisa skip step
- Harus selesaikan step saat ini sebelum lanjut
- Tombol "Lanjut" disabled jika step belum selesai

## Tips & Best Practices

### ✅ DO
- Pastikan data anggota lengkap sebelum proses
- Cek saldo kas/bank sebelum proses
- Cetak dokumen segera setelah generate
- Simpan dokumen fisik untuk arsip
- Verifikasi jurnal di menu "Jurnal" setelah selesai

### ❌ DON'T
- Jangan tutup browser saat proses berjalan
- Jangan refresh halaman saat wizard terbuka
- Jangan proses anggota yang masih punya hutang
- Jangan skip step (tidak bisa)
- Jangan edit data manual setelah wizard selesai

## Troubleshooting

### Problem: Wizard tidak bisa dibuka
**Solution:**
- Pastikan Anda login sebagai Super Admin atau Administrator
- Refresh halaman
- Clear browser cache
- Cek console untuk error

### Problem: Step 1 BLOCK karena ada hutang
**Solution:**
- Lunasi semua pinjaman anggota terlebih dahulu
- Bayar semua hutang POS
- Coba lagi setelah hutang lunas

### Problem: Step 2 gagal (insufficient balance)
**Solution:**
- Cek saldo kas/bank di menu "Jurnal"
- Pastikan saldo mencukupi untuk pengembalian
- Tambah saldo jika perlu
- Coba lagi

### Problem: Dokumen tidak tercetak
**Solution:**
- Pastikan browser tidak block pop-up
- Allow pop-up untuk aplikasi ini
- Coba generate ulang
- Gunakan browser lain jika masih gagal

### Problem: Wizard terputus di tengah jalan
**Solution:**
- Buka tab "Anggota Keluar"
- Cari anggota dengan status "Pending"
- Klik "Lanjutkan"
- Wizard akan resume dari step terakhir

### Problem: Verifikasi gagal di Step 5
**Solution:**
- Cek detail error yang ditampilkan
- Verifikasi jurnal di menu "Jurnal"
- Jika perlu, hubungi Super Admin
- Jangan edit data manual

## FAQ

**Q: Apakah bisa cancel wizard di tengah jalan?**  
A: Ya, klik tombol "Batal". Wizard akan cancel dan data tidak berubah.

**Q: Apakah bisa kembali ke step sebelumnya?**  
A: Ya, klik tombol "Kembali". Tapi tidak bisa edit data yang sudah diproses.

**Q: Apakah bisa proses banyak anggota sekaligus?**  
A: Tidak, wizard hanya bisa proses 1 anggota per sesi.

**Q: Apakah data bisa di-rollback setelah selesai?**  
A: Tidak otomatis. Harus manual rollback oleh Super Admin.

**Q: Apakah wizard bisa digunakan offline?**  
A: Ya, aplikasi ini menggunakan localStorage, bisa offline.

**Q: Berapa lama proses wizard?**  
A: Sekitar 5-10 menit per anggota, tergantung kompleksitas.

**Q: Apakah ada limit jumlah anggota keluar?**  
A: Tidak ada limit.

**Q: Apakah bisa cetak ulang dokumen?**  
A: Ya, klik tombol "Cetak" di tab "Anggota Keluar".

## Kontak Support

Jika mengalami masalah atau butuh bantuan:

1. **Cek dokumentasi lengkap:**
   - `BUKU_PANDUAN_LENGKAP_APLIKASI_KOPERASI.md`
   - `PANDUAN_ANGGOTA_KELUAR.md`

2. **Hubungi Tim Support:**
   - Klik icon "Support" di navbar
   - Atau lihat `INFO_SUPPORT_KONTAK.md`

3. **Cek Audit Log:**
   - Menu "Audit Log" (Super Admin only)
   - Filter by action: "WIZARD"

---

**Happy Processing! 🎉**

