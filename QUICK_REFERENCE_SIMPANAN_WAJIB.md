# Quick Reference: Simpanan Wajib Per Periode

## 🚀 Cara Cepat Input Simpanan Wajib

### Input Manual (1 Anggota)
1. Simpanan → Tab "Simpanan Wajib"
2. Klik "Setor Simpanan Wajib"
3. Pilih Anggota, Isi Jumlah, Pilih Periode, Pilih Tanggal
4. Simpan ✅

### Upload CSV (Banyak Anggota)
1. Simpanan → Tab "Simpanan Wajib"
2. Klik "Upload Data CSV/Excel"
3. Upload file atau Paste data
4. Preview → Proses Upload ✅

---

## 📋 Format CSV

```csv
NIK,Nama,Jumlah,Periode,Tanggal
3201010101010001,Budi Santoso,100000,2024-10,2024-10-18
```

**Kolom:**
- NIK: Nomor Induk Kependudukan
- Nama: Nama anggota
- Jumlah: Nominal (angka saja, tanpa Rp atau titik)
- Periode: Format YYYY-MM (contoh: 2024-10)
- Tanggal: Format YYYY-MM-DD (contoh: 2024-10-18)

---

## 📅 Contoh Periode

| Bulan | Format Periode |
|-------|----------------|
| Oktober 2024 | `2024-10` |
| November 2024 | `2024-11` |
| Desember 2024 | `2024-12` |
| Januari 2025 | `2025-01` |

---

## 💡 Tips Input Data Historis (Sejak Okt 2024)

### Untuk 50 Anggota, 3 Bulan (Okt-Des 2024):

1. **Buat 3 File CSV:**
   - `simpanan_oktober_2024.csv` (Periode: 2024-10)
   - `simpanan_november_2024.csv` (Periode: 2024-11)
   - `simpanan_desember_2024.csv` (Periode: 2024-12)

2. **Upload Satu per Satu:**
   - Upload Oktober → Proses
   - Upload November → Proses
   - Upload Desember → Proses

3. **Verifikasi:**
   - Total transaksi: 50 × 3 = 150 ✅
   - Total simpanan: 50 × 100.000 × 3 = Rp 15.000.000 ✅

---

## ⚠️ Validasi Data

### Data Valid ✅
```csv
3201010101010001,Budi Santoso,100000,2024-10,2024-10-18
```

### Data Error ❌
```csv
9999999999999999,Nama Tidak Ada,100000,2024-10,2024-10-18
```
Error: NIK tidak ditemukan

```csv
3201010101010001,Budi Santoso,abc,2024-10,2024-10-18
```
Error: Jumlah tidak valid

```csv
3201010101010001,Budi Santoso,100000,10-2024,2024-10-18
```
Error: Format periode tidak valid

---

## 📊 Cek Total Simpanan

Lihat di footer tabel Simpanan Wajib:
```
Total Simpanan Wajib: Rp 15.000.000
```

---

## 🔗 Link Panduan Lengkap

Lihat: `PANDUAN_SIMPANAN_WAJIB_PER_PERIODE.md`

---

**Update:** 2 Desember 2024
