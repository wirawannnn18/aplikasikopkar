# Quick Reference: Backup & Restore

## 🚀 Quick Start

### Membuat Backup
1. Login sebagai **Admin** atau **Super Admin**
2. Klik menu **"Backup & Restore"**
3. Klik **"Buat Backup"**
4. Pilih **Full** atau **Partial**
5. Klik **"Buat Backup"**
6. File akan terdownload otomatis

### Restore Database
1. Klik **"Restore dari Backup"**
2. Pilih file backup (.json)
3. Review preview
4. Centang checkbox konfirmasi
5. Ketik **"RESTORE"** (huruf besar)
6. Klik **"Restore Sekarang"**
7. Tunggu reload otomatis

---

## 📋 Checklist Backup Rutin

### Harian (Recommended)
- [ ] Backup sebelum tutup kasir
- [ ] Simpan di komputer lokal
- [ ] Upload ke cloud storage

### Mingguan
- [ ] Full backup akhir minggu
- [ ] Verifikasi file tidak rusak
- [ ] Simpan di external drive

### Bulanan
- [ ] Archive backup bulanan
- [ ] Test restore di environment testing
- [ ] Hapus backup lama (>6 bulan)

---

## ⚠️ Hal Penting

### DO ✅
- ✅ Backup rutin (minimal mingguan)
- ✅ Simpan di multiple lokasi
- ✅ Verifikasi file backup
- ✅ Test restore sesekali
- ✅ Baca peringatan dengan teliti

### DON'T ❌
- ❌ Edit file backup manual
- ❌ Share backup sembarangan
- ❌ Hanya simpan di satu lokasi
- ❌ Skip konfirmasi restore
- ❌ Restore tanpa backup dulu

---

## 🔐 Akses

| Role | Akses Menu | Dapat Backup | Dapat Restore |
|------|------------|--------------|---------------|
| Super Admin | ✅ | ✅ | ✅ |
| Administrator | ✅ | ✅ | ✅ |
| Keuangan | ❌ | ❌ | ❌ |
| Kasir | ❌ | ❌ | ❌ |

---

## 📊 Statistik Halaman

Halaman Backup & Restore menampilkan:
- **Total Records**: Jumlah total data
- **Kategori Data**: Jumlah kategori
- **Estimasi Ukuran**: Ukuran backup
- **Backup Terakhir**: Kapan backup terakhir

---

## 🗂️ Kategori Data

Data yang di-backup:
1. Data Koperasi
2. Pengguna
3. Anggota
4. Departemen
5. Simpanan (Pokok, Wajib, Sukarela)
6. Pinjaman
7. Chart of Accounts
8. Jurnal
9. Barang & Kategori
10. Supplier
11. Pembelian & Penjualan
12. Stok Opname
13. Saldo Awal Periode

---

## 📁 Format File

### Nama File Backup:
```
backup_[NamaKoperasi]_[YYYY-MM-DDTHH-MM-SS].json
```

### Nama File Partial:
```
backup_[NamaKoperasi]_[YYYY-MM-DDTHH-MM-SS]_partial.json
```

### Nama File Pre-Restore:
```
backup_pre-restore_[NamaKoperasi]_[YYYY-MM-DDTHH-MM-SS].json
```

---

## 🆘 Troubleshooting Cepat

### File tidak valid?
→ Download ulang, jangan edit manual

### Versi tidak kompatibel?
→ Sistem akan migrasi otomatis

### Penyimpanan penuh?
→ Hapus data lama atau gunakan browser lain

### Restore gagal?
→ Gunakan pre-restore backup untuk rollback

---

## 📞 Butuh Bantuan?

- 📧 Email: support@koperasi.com
- 📱 WhatsApp: +62 xxx-xxxx-xxxx
- 📖 Panduan Lengkap: PANDUAN_BACKUP_RESTORE.md

---

## 🎯 Tips Pro

1. **Backup Sebelum Update**
   - Selalu backup sebelum update aplikasi
   - Simpan dengan label "sebelum_update_vX.X"

2. **Naming Convention**
   - Gunakan nama deskriptif
   - Tambahkan catatan penting
   - Contoh: "backup_akhir_tahun_2024.json"

3. **Multiple Copies**
   - Lokal: Komputer
   - Cloud: Google Drive/Dropbox
   - Physical: External HDD/USB

4. **Test Restore**
   - Test restore di browser lain
   - Verifikasi data lengkap
   - Jangan test di production!

5. **Schedule**
   - Set reminder backup rutin
   - Backup sebelum tutup kasir
   - Archive backup bulanan

---

**© 2024 Koperasi Karyawan**
