# Quick Reference - Anggota Keluar

## Ringkasan Cepat

### 🚀 Menandai Anggota Keluar
```
Master Data → Master Anggota → Tombol "Anggota Keluar" → Isi Form → Simpan
```

### 💰 Proses Pengembalian
```
Master Anggota → Pilih Anggota Keluar → "Proses Pengembalian" → Pilih Metode → Proses
```

### 📊 Lihat Laporan
```
Laporan → Laporan Anggota Keluar → Filter (opsional) → Export CSV
```

---

## Checklist Proses Anggota Keluar

### Sebelum Menandai Keluar
- [ ] Verifikasi identitas anggota
- [ ] Cek pinjaman aktif (harus lunas)
- [ ] Cek hutang belanja (harus lunas)
- [ ] Siapkan surat pengunduran diri
- [ ] Konfirmasi dengan anggota

### Saat Menandai Keluar
- [ ] Isi tanggal keluar dengan benar
- [ ] Tulis alasan keluar (min. 10 karakter)
- [ ] Simpan dan verifikasi status berubah
- [ ] Pastikan badge "Keluar" muncul

### Sebelum Proses Pengembalian
- [ ] Cek total simpanan pokok
- [ ] Cek total simpanan wajib
- [ ] Cek kewajiban lain
- [ ] Verifikasi saldo kas/bank mencukupi
- [ ] Pastikan tidak ada pinjaman aktif

### Saat Proses Pengembalian
- [ ] Pilih metode pembayaran (Kas/Transfer)
- [ ] Isi tanggal pembayaran
- [ ] Isi keterangan (jika perlu)
- [ ] Proses dan tunggu konfirmasi
- [ ] Cetak bukti pengembalian
- [ ] Minta tanda tangan anggota

### Setelah Proses Selesai
- [ ] Simpan bukti pengembalian fisik
- [ ] Verifikasi jurnal tercatat
- [ ] Cek saldo simpanan = Rp 0
- [ ] Update file anggota
- [ ] Arsipkan dokumen

---

## Rumus Perhitungan

### Total Pengembalian
```
Total Pengembalian = Simpanan Pokok + Simpanan Wajib - Kewajiban Lain
```

### Contoh Perhitungan

**Kasus 1: Tanpa Kewajiban**
```
Simpanan Pokok:  Rp 1.000.000
Simpanan Wajib:  Rp 2.500.000
Kewajiban:       Rp         0
─────────────────────────────
Total:           Rp 3.500.000
```

**Kasus 2: Dengan Kewajiban**
```
Simpanan Pokok:  Rp 1.000.000
Simpanan Wajib:  Rp 2.500.000
Hutang Belanja:  Rp   300.000
─────────────────────────────
Total:           Rp 3.200.000
```

**Kasus 3: Kewajiban Lebih Besar**
```
Simpanan Pokok:  Rp 1.000.000
Simpanan Wajib:  Rp 1.500.000
Hutang Belanja:  Rp 3.000.000
─────────────────────────────
Total:           Rp  -500.000 (Anggota harus bayar)
```

---

## Kode Error Umum

| Kode | Pesan | Solusi |
|------|-------|--------|
| `ANGGOTA_NOT_FOUND` | Anggota tidak ditemukan | Cek ID anggota |
| `ANGGOTA_ALREADY_KELUAR` | Anggota sudah keluar | Tidak perlu proses lagi |
| `INVALID_PARAMETER` | Parameter tidak valid | Cek input form |
| `ACTIVE_LOAN_EXISTS` | Ada pinjaman aktif | Lunasi pinjaman dulu |
| `INSUFFICIENT_BALANCE` | Saldo kas tidak cukup | Tambah modal/tunggu |
| `PAYMENT_METHOD_REQUIRED` | Metode pembayaran wajib | Pilih Kas/Transfer |
| `ALREADY_PROCESSED` | Sudah diproses | Tidak bisa diproses lagi |
| `CANNOT_CANCEL` | Tidak bisa dibatalkan | Pengembalian sudah selesai |

---

## Shortcut Keyboard

| Tombol | Fungsi |
|--------|--------|
| `Ctrl + P` | Print bukti pengembalian |
| `Esc` | Tutup modal |
| `Enter` | Submit form (jika fokus di input) |
| `F5` | Refresh halaman |

---

## Status dan Artinya

| Status | Arti | Aksi yang Bisa Dilakukan |
|--------|------|--------------------------|
| **Aktif** | Anggota aktif normal | Semua transaksi, Tandai keluar |
| **Keluar (Pending)** | Sudah keluar, belum dikembalikan | Proses pengembalian, Batalkan |
| **Keluar (Selesai)** | Sudah keluar dan dikembalikan | Lihat detail, Cetak bukti |

---

## Metode Pembayaran

### Kas
- Pembayaran tunai langsung
- Mengurangi saldo kas
- Jurnal: Kredit Kas

### Transfer Bank
- Pembayaran via transfer
- Mengurangi saldo bank
- Jurnal: Kredit Bank
- Catat nomor referensi

---

## Jurnal Akuntansi Otomatis

### Pengembalian Simpanan Pokok
```
Debit:  Simpanan Pokok Anggota  Rp XXX
Kredit: Kas/Bank                Rp XXX
```

### Pengembalian Simpanan Wajib
```
Debit:  Simpanan Wajib Anggota  Rp XXX
Kredit: Kas/Bank                Rp XXX
```

---

## Tips Cepat

### ⚡ Proses Lebih Cepat
1. Siapkan semua dokumen sebelum mulai
2. Lunasi pinjaman terlebih dahulu
3. Pastikan saldo kas mencukupi
4. Gunakan template alasan keluar

### 🎯 Hindari Kesalahan
1. Jangan tandai keluar jika ada pinjaman aktif
2. Jangan proses jika saldo kas tidak cukup
3. Jangan lupa cetak bukti
4. Jangan batalkan setelah diproses

### 📋 Untuk Audit
1. Export CSV setiap akhir bulan
2. Simpan bukti pengembalian fisik
3. Cek audit log rutin
4. Rekonsiliasi dengan buku besar

---

## Hak Akses

| Role | Tandai Keluar | Proses Pengembalian | Batalkan | Lihat Laporan | Export |
|------|---------------|---------------------|----------|---------------|--------|
| **Super Admin** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Administrator** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Bendahara** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Kasir** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **User** | ❌ | ❌ | ❌ | ✅ | ❌ |

---

## Kontak Cepat

📧 support@koperasi.com  
📞 (021) XXX-XXXX  
💬 +62 XXX-XXXX-XXXX

---

**Versi:** 1.0 | **Update:** 5 Des 2025
