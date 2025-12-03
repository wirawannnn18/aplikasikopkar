# Contoh Paste Data Simpanan Pokok

## Cara Tercepat: Copy dari Excel → Paste ke Sistem

### Langkah-langkah:

1. **Buat tabel di Excel dengan format ini:**

| NIK | Nama | Jumlah | Tanggal |
|-----|------|--------|---------|
| 3201010101010001 | Budi Santoso | 1000000 | 2024-01-15 |
| 3201010101010002 | Siti Aminah | 1000000 | 2024-01-15 |
| 3201010101010003 | Ahmad Hidayat | 1500000 | 2024-01-15 |
| 3201010101010004 | Dewi Lestari | 1000000 | 2024-01-15 |
| 3201010101010005 | Eko Prasetyo | 2000000 | 2024-01-15 |
| 3201010101010006 | Rina Wati | 1000000 | 2024-01-15 |
| 3201010101010007 | Joko Susilo | 1200000 | 2024-01-15 |
| 3201010101010008 | Maya Sari | 1000000 | 2024-01-15 |
| 3201010101010009 | Hendra Gunawan | 1800000 | 2024-01-15 |
| 3201010101010010 | Fitri Handayani | 1000000 | 2024-01-15 |

2. **Select semua data** (termasuk header)
3. **Tekan Ctrl+C** untuk copy
4. **Buka sistem** → Menu Simpanan → Simpanan Pokok
5. **Klik "Upload Data CSV/Excel"**
6. **Pilih tab "Paste Data"**
7. **Klik di text box** dan tekan **Ctrl+V**
8. **Klik "Preview Data"**
9. **Review hasil** dan klik **"Proses Upload"**

## Contoh Data yang Bisa Langsung Di-Copy

### Contoh 1: Data Standar (10 Anggota)

```
NIK	Nama	Jumlah	Tanggal
3201010101010001	Budi Santoso	1000000	2024-01-15
3201010101010002	Siti Aminah	1000000	2024-01-15
3201010101010003	Ahmad Hidayat	1500000	2024-01-15
3201010101010004	Dewi Lestari	1000000	2024-01-15
3201010101010005	Eko Prasetyo	2000000	2024-01-15
3201010101010006	Rina Wati	1000000	2024-01-15
3201010101010007	Joko Susilo	1200000	2024-01-15
3201010101010008	Maya Sari	1000000	2024-01-15
3201010101010009	Hendra Gunawan	1800000	2024-01-15
3201010101010010	Fitri Handayani	1000000	2024-01-15
```

### Contoh 2: Data dengan Jumlah Berbeda

```
NIK	Nama	Jumlah	Tanggal
3201010101010001	Budi Santoso	500000	2024-01-15
3201010101010002	Siti Aminah	750000	2024-01-15
3201010101010003	Ahmad Hidayat	1000000	2024-01-15
3201010101010004	Dewi Lestari	1250000	2024-01-15
3201010101010005	Eko Prasetyo	1500000	2024-01-15
```

### Contoh 3: Data dengan Format Tanggal Excel (MM/DD/YYYY)

```
NIK	Nama	Jumlah	Tanggal
3201010101010001	Budi Santoso	1000000	10/18/2024
3201010101010002	Siti Aminah	1000000	10/18/2024
3201010101010003	Ahmad Hidayat	1500000	10/18/2024
```

> **Note**: Sistem akan otomatis konversi `10/18/2024` menjadi `2024-10-18`

### Contoh 4: Data dengan Format Tanggal Indonesia (DD/MM/YYYY)

```
NIK	Nama	Jumlah	Tanggal
3201010101010001	Budi Santoso	1000000	18/10/2024
3201010101010002	Siti Aminah	1000000	18/10/2024
3201010101010003	Ahmad Hidayat	1500000	18/10/2024
```

> **Note**: Sistem akan otomatis konversi `18/10/2024` menjadi `2024-10-18`

### Contoh 5: Data Format CSV (dengan koma)

```
NIK,Nama,Jumlah,Tanggal
3201010101010001,Budi Santoso,1000000,2024-01-15
3201010101010002,Siti Aminah,1000000,2024-01-15
3201010101010003,Ahmad Hidayat,1500000,2024-01-15
```

### Contoh 6: Data dengan Berbagai Format Tanggal (Mixed)

```
NIK	Nama	Jumlah	Tanggal
3201010101010001	Budi Santoso	1000000	2024-01-15
3201010101010002	Siti Aminah	1000000	10/18/2024
3201010101010003	Ahmad Hidayat	1500000	18/10/2024
3201010101010004	Dewi Lestari	1000000	18-10-2024
3201010101010005	Eko Prasetyo	1500000	2024/10/18
```

> **Note**: Sistem akan otomatis konversi semua format ke YYYY-MM-DD

## Tips Penting

### ✅ DO (Lakukan):
- Copy data **termasuk header** (baris pertama)
- Pastikan NIK sudah terdaftar di sistem
- Gunakan format tanggal apapun yang didukung (sistem akan konversi otomatis)
- Jumlah bisa pakai format apapun (sistem akan bersihkan otomatis)
- Cek preview untuk memastikan tanggal terkonversi dengan benar

### ❌ DON'T (Jangan):
- Jangan skip header
- Jangan paste data yang tidak lengkap (harus 4 kolom)
- Jangan pakai tanggal yang tidak valid (contoh: 32/01/2024)

## Keuntungan Metode Paste

1. ⚡ **Lebih Cepat**: Tidak perlu save file dulu
2. 🎯 **Langsung dari Excel**: Copy → Paste → Done
3. 🔄 **Fleksibel**: Support delimiter koma atau tab
4. 🧹 **Auto Clean**: Sistem otomatis bersihkan format angka
5. 📅 **Auto Convert**: Sistem otomatis konversi berbagai format tanggal
6. 👀 **Preview Instant**: Langsung lihat hasil validasi dan konversi
7. ✅ **Smart Detection**: Sistem deteksi format tanggal otomatis

## Troubleshooting

### Q: Data tidak muncul setelah paste?
**A**: Pastikan Anda sudah klik tombol "Preview Data" setelah paste

### Q: Semua data error "Format tidak lengkap"?
**A**: Pastikan data punya 4 kolom (NIK, Nama, Jumlah, Tanggal) dan ada header

### Q: Error "NIK tidak ditemukan"?
**A**: NIK belum terdaftar di sistem. Daftarkan anggota dulu di menu Anggota

### Q: Bisa paste dari Google Sheets?
**A**: Ya! Cara sama persis dengan Excel

### Q: Maksimal berapa baris yang bisa di-paste?
**A**: Tidak ada limit, tapi disarankan maksimal 1000 baris per batch untuk performa optimal

### Q: Tanggal saya format 10/18/2024, apa akan error?
**A**: TIDAK! Sistem otomatis konversi ke format yang benar (2024-10-18). Preview akan menampilkan "(dikonversi)" untuk konfirmasi

### Q: Bagaimana sistem tahu 10/18/2024 itu MM/DD/YYYY atau DD/MM/YYYY?
**A**: Sistem deteksi otomatis:
- Jika hari > 12 (contoh: 18/10/2024), pasti DD/MM/YYYY
- Jika hari ≤ 12 (contoh: 10/05/2024), sistem asumsikan MM/DD/YYYY (format Excel default)
- Untuk menghindari ambiguitas, gunakan format YYYY-MM-DD

### Q: Format tanggal apa saja yang didukung?
**A**: Sistem support:
- `2024-01-15` (YYYY-MM-DD) ✅
- `10/18/2024` (MM/DD/YYYY) ✅
- `18/10/2024` (DD/MM/YYYY) ✅
- `18-10-2024` (DD-MM-YYYY) ✅
- `2024/10/18` (YYYY/MM/DD) ✅

## Video Tutorial (Coming Soon)

1. Cara copy data dari Excel
2. Cara paste di sistem
3. Cara review preview
4. Cara proses upload

---

**Pro Tip**: Simpan template Excel Anda sendiri dengan NIK anggota yang sudah terdaftar. Setiap kali ada transaksi baru, tinggal copy-paste!
