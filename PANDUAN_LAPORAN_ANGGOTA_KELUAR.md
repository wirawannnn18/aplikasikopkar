# Panduan Laporan Anggota Keluar

## Daftar Isi
1. [Pengenalan](#pengenalan)
2. [Mengakses Laporan](#mengakses-laporan)
3. [Filter Berdasarkan Periode](#filter-berdasarkan-periode)
4. [Ekspor ke CSV](#ekspor-ke-csv)
5. [Contoh Laporan](#contoh-laporan)
6. [Tips Penggunaan](#tips-penggunaan)

---

## Pengenalan

Laporan Anggota Keluar adalah fitur untuk memantau dan mengaudit semua anggota yang telah keluar dari koperasi. Laporan ini menyediakan:

- Daftar lengkap anggota yang keluar
- Status pengembalian simpanan
- Total pengembalian untuk setiap anggota
- Filter berdasarkan periode
- Ekspor data ke format CSV

### Manfaat Laporan

1. **Monitoring**: Pantau proses keluar anggota
2. **Audit**: Verifikasi pengembalian simpanan
3. **Analisis**: Analisis tren keluar anggota
4. **Arsip**: Dokumentasi lengkap untuk keperluan administrasi

---

## Mengakses Laporan

### Langkah 1: Buka Menu Laporan

1. Login ke aplikasi koperasi
2. Klik menu "Laporan" di sidebar
3. Pilih "Laporan Anggota Keluar"

**Lokasi Menu**:
```
Dashboard
├── Master Data
├── Transaksi
├── Laporan
│   ├── Laporan Keuangan
│   ├── Laporan Simpanan
│   ├── Laporan Pinjaman
│   └── Laporan Anggota Keluar  ← Di sini
└── Pengaturan
```

### Langkah 2: Tampilan Laporan

Halaman laporan akan menampilkan:

**Header**:
- Judul: "Laporan Anggota Keluar"
- Filter tanggal
- Tombol "Export CSV"
- Tombol "Refresh"

**Tabel Data**:
```
┌────────────────────────────────────────────────────────────────────────────┐
│ NIK      │ Nama         │ Dept │ Tgl Keluar │ Status Pgm │ Total          │
├────────────────────────────────────────────────────────────────────────────┤
│ 12345678 │ Budi Santoso │ IT   │ 01/12/2025 │ Selesai    │ Rp 3.350.000  │
│ 23456789 │ Ani Wijaya   │ HR   │ 15/11/2025 │ Pending    │ Rp 2.500.000  │
│ 34567890 │ Citra Dewi   │ FIN  │ 20/10/2025 │ Selesai    │ Rp 4.100.000  │
└────────────────────────────────────────────────────────────────────────────┘
```

**Footer**:
- Total records: X anggota
- Pagination (jika ada)

### Kolom Laporan

| Kolom | Deskripsi | Format |
|-------|-----------|--------|
| NIK | Nomor Induk Karyawan | 16 digit |
| Nama | Nama lengkap anggota | Text |
| Dept | Departemen anggota | Text |
| Tgl Keluar | Tanggal keluar dari koperasi | DD/MM/YYYY |
| Status Pgm | Status pengembalian | Pending/Selesai |
| Total | Total pengembalian simpanan | Rp X.XXX.XXX |

### Aksi yang Tersedia

Untuk setiap baris, tersedia tombol:

1. **Detail** (ℹ️)
   - Melihat detail lengkap anggota
   - Rincian simpanan
   - Riwayat transaksi

2. **Cetak Bukti** (🖨️)
   - Hanya muncul jika status = "Selesai"
   - Cetak ulang bukti pengembalian

---

## Filter Berdasarkan Periode

### Menggunakan Filter Tanggal

**Tujuan**: Menampilkan hanya anggota yang keluar dalam periode tertentu

### Langkah-Langkah

1. **Pilih Tanggal Mulai**
   - Klik field "Tanggal Mulai"
   - Pilih tanggal dari date picker
   - Contoh: 01/11/2025

2. **Pilih Tanggal Akhir**
   - Klik field "Tanggal Akhir"
   - Pilih tanggal dari date picker
   - Contoh: 30/11/2025

3. **Klik Tombol "Filter"**
   - Sistem akan memfilter data
   - Hanya anggota yang keluar antara tanggal mulai dan akhir yang ditampilkan

**Contoh Filter**:
```
┌─────────────────────────────────────────────────┐
│ Filter Periode:                                 │
│                                                 │
│ Tanggal Mulai: [01/11/2025 📅]                 │
│ Tanggal Akhir: [30/11/2025 📅]                 │
│                                                 │
│ [Filter]  [Reset]                              │
└─────────────────────────────────────────────────┘
```

### Jenis Filter

#### 1. Filter Periode Lengkap

**Contoh**: Anggota yang keluar di bulan November 2025
```
Tanggal Mulai: 01/11/2025
Tanggal Akhir: 30/11/2025
```

**Hasil**: Menampilkan anggota dengan tanggalKeluar antara 01/11/2025 - 30/11/2025 (inklusif)

#### 2. Filter Tanggal Mulai Saja

**Contoh**: Anggota yang keluar sejak 01/11/2025
```
Tanggal Mulai: 01/11/2025
Tanggal Akhir: (kosong)
```

**Hasil**: Menampilkan anggota dengan tanggalKeluar >= 01/11/2025

#### 3. Filter Tanggal Akhir Saja

**Contoh**: Anggota yang keluar sampai 30/11/2025
```
Tanggal Mulai: (kosong)
Tanggal Akhir: 30/11/2025
```

**Hasil**: Menampilkan anggota dengan tanggalKeluar <= 30/11/2025

#### 4. Tanpa Filter

**Contoh**: Semua anggota keluar
```
Tanggal Mulai: (kosong)
Tanggal Akhir: (kosong)
```

**Hasil**: Menampilkan semua anggota dengan status "Keluar"

### Reset Filter

Untuk menghapus filter dan menampilkan semua data:
1. Klik tombol "Reset"
2. Atau kosongkan kedua field tanggal
3. Klik "Filter"

---

## Ekspor ke CSV

### Tujuan

Ekspor data ke format CSV untuk:
- Analisis di Excel/Google Sheets
- Arsip offline
- Integrasi dengan sistem lain
- Backup data

### Langkah Ekspor

1. **Filter Data (Opsional)**
   - Jika ingin ekspor periode tertentu, gunakan filter
   - Jika ingin ekspor semua, skip langkah ini

2. **Klik Tombol "Export CSV"**
   - Tombol berada di pojok kanan atas
   - Icon: 📥 atau 📄

3. **File Akan Diunduh**
   - Nama file: `laporan-anggota-keluar-YYYY-MM-DD-HHMMSS.csv`
   - Contoh: `laporan-anggota-keluar-2025-12-05-143015.csv`
   - Lokasi: Folder Downloads browser

### Format File CSV

**Header (Baris Pertama)**:
```
NIK,Nama,Departemen,Tanggal Keluar,Alasan Keluar,Status Pengembalian,Tanggal Pengembalian,Simpanan Pokok,Simpanan Wajib,Kewajiban Lain,Total Pengembalian,Metode Pembayaran,Referensi Transaksi
```

**Data (Baris Berikutnya)**:
```
1234567890123456,Budi Santoso,IT,2025-12-01,Pindah ke kota lain,Selesai,2025-12-05,1000000,2500000,150000,3350000,Kas,PGM-20251205-001
2345678901234567,Ani Wijaya,HR,2025-11-15,Pensiun,Pending,,,800000,1500000,0,2300000,,
```

### Kolom CSV Lengkap

| No | Kolom | Deskripsi | Contoh |
|----|-------|-----------|--------|
| 1 | NIK | Nomor Induk Karyawan | 1234567890123456 |
| 2 | Nama | Nama lengkap | Budi Santoso |
| 3 | Departemen | Departemen | IT |
| 4 | Tanggal Keluar | Tanggal keluar | 2025-12-01 |
| 5 | Alasan Keluar | Alasan keluar | Pindah ke kota lain |
| 6 | Status Pengembalian | Pending/Selesai | Selesai |
| 7 | Tanggal Pengembalian | Tanggal proses | 2025-12-05 |
| 8 | Simpanan Pokok | Jumlah simpanan pokok | 1000000 |
| 9 | Simpanan Wajib | Jumlah simpanan wajib | 2500000 |
| 10 | Kewajiban Lain | Jumlah kewajiban | 150000 |
| 11 | Total Pengembalian | Total yang dikembalikan | 3350000 |
| 12 | Metode Pembayaran | Kas/Transfer Bank | Kas |
| 13 | Referensi Transaksi | Nomor referensi | PGM-20251205-001 |

### Catatan Format

- **Tanggal**: Format ISO (YYYY-MM-DD)
- **Angka**: Tanpa pemisah ribuan, tanpa "Rp"
- **Text**: Tanpa tanda kutip (kecuali ada koma di dalamnya)
- **Kosong**: Jika belum ada data (untuk status Pending)

### Membuka File CSV

**Di Excel**:
1. Buka Excel
2. File → Open
3. Pilih file CSV
4. Jika format tidak sesuai, gunakan "Text to Columns"

**Di Google Sheets**:
1. Buka Google Sheets
2. File → Import
3. Upload file CSV
4. Pilih separator: Comma
5. Klik "Import data"

---

## Contoh Laporan

### Contoh 1: Laporan Bulanan

**Periode**: November 2025

**Filter**:
```
Tanggal Mulai: 01/11/2025
Tanggal Akhir: 30/11/2025
```

**Hasil**:
```
┌────────────────────────────────────────────────────────────────────────────┐
│                    LAPORAN ANGGOTA KELUAR                                  │
│                         November 2025                                      │
├────────────────────────────────────────────────────────────────────────────┤
│ NIK      │ Nama         │ Dept │ Tgl Keluar │ Status Pgm │ Total          │
├────────────────────────────────────────────────────────────────────────────┤
│ 23456789 │ Ani Wijaya   │ HR   │ 15/11/2025 │ Pending    │ Rp 2.300.000  │
│ 34567890 │ Citra Dewi   │ FIN  │ 20/11/2025 │ Selesai    │ Rp 4.100.000  │
│ 45678901 │ Dedi Kurnia  │ OPS  │ 25/11/2025 │ Selesai    │ Rp 3.800.000  │
├────────────────────────────────────────────────────────────────────────────┤
│ Total: 3 anggota                              │ Total: Rp 10.200.000       │
└────────────────────────────────────────────────────────────────────────────┘
```

**Analisis**:
- 3 anggota keluar di bulan November
- 2 sudah diproses pengembalian (66.67%)
- 1 masih pending (33.33%)
- Total pengembalian: Rp 10.200.000

### Contoh 2: Laporan Tahunan

**Periode**: Tahun 2025

**Filter**:
```
Tanggal Mulai: 01/01/2025
Tanggal Akhir: 31/12/2025
```

**Statistik**:
```
┌─────────────────────────────────────────────┐
│ STATISTIK ANGGOTA KELUAR 2025               │
├─────────────────────────────────────────────┤
│ Total Anggota Keluar:        25 anggota     │
│ Pengembalian Selesai:        22 anggota     │
│ Pengembalian Pending:         3 anggota     │
│                                             │
│ Total Pengembalian:     Rp 85.500.000       │
│ Rata-rata per Anggota:  Rp  3.420.000       │
│                                             │
│ Departemen Terbanyak:                       │
│   1. IT (8 anggota)                         │
│   2. Operations (7 anggota)                 │
│   3. Finance (5 anggota)                    │
│                                             │
│ Alasan Terbanyak:                           │
│   1. Pindah kota (10 anggota)               │
│   2. Pensiun (8 anggota)                    │
│   3. Resign (7 anggota)                     │
└─────────────────────────────────────────────┘
```

### Contoh 3: Laporan Pending

**Filter**: Hanya status Pending

**Cara**:
1. Tampilkan semua data (tanpa filter tanggal)
2. Gunakan fitur search/filter tabel
3. Ketik "Pending" di kolom Status

**Hasil**:
```
┌────────────────────────────────────────────────────────────────────────────┐
│              ANGGOTA KELUAR - PENGEMBALIAN PENDING                         │
├────────────────────────────────────────────────────────────────────────────┤
│ NIK      │ Nama         │ Dept │ Tgl Keluar │ Total          │ Keterangan │
├────────────────────────────────────────────────────────────────────────────┤
│ 23456789 │ Ani Wijaya   │ HR   │ 15/11/2025 │ Rp 2.300.000  │ Pinjaman   │
│ 56789012 │ Eko Prasetyo │ IT   │ 28/11/2025 │ Rp 3.100.000  │ Saldo kurang│
│ 67890123 │ Fitri Amalia │ FIN  │ 30/11/2025 │ Rp 2.800.000  │ Baru ditandai│
└────────────────────────────────────────────────────────────────────────────┘
```

**Tindak Lanjut**:
- Ani Wijaya: Tunggu pinjaman lunas
- Eko Prasetyo: Tambah saldo kas
- Fitri Amalia: Siap diproses

---

## Tips Penggunaan

### 1. Monitoring Rutin

**Rekomendasi**: Cek laporan setiap minggu

**Checklist**:
- [ ] Cek anggota dengan status Pending
- [ ] Identifikasi kendala (pinjaman aktif, saldo kurang)
- [ ] Follow up penyelesaian
- [ ] Proses pengembalian yang sudah siap

### 2. Arsip Bulanan

**Rekomendasi**: Ekspor CSV setiap akhir bulan

**Langkah**:
1. Filter periode bulan tersebut
2. Ekspor ke CSV
3. Simpan di folder: `Arsip/Anggota-Keluar/YYYY/MM/`
4. Backup ke cloud storage

### 3. Analisis Tren

**Gunakan data untuk**:
- Identifikasi pola keluar anggota
- Analisis per departemen
- Evaluasi alasan keluar
- Proyeksi pengembalian simpanan

**Contoh Analisis**:
```
Tren Anggota Keluar per Kuartal:
Q1 2025: 5 anggota
Q2 2025: 8 anggota  ↑ 60%
Q3 2025: 6 anggota  ↓ 25%
Q4 2025: 6 anggota  → Stabil
```

### 4. Verifikasi Akuntansi

**Gunakan laporan untuk**:
- Cross-check dengan jurnal akuntansi
- Verifikasi saldo simpanan
- Audit trail pengembalian

**Langkah Verifikasi**:
1. Ekspor laporan anggota keluar (status Selesai)
2. Buka laporan jurnal akuntansi
3. Filter transaksi "Pengembalian simpanan"
4. Cocokkan:
   - Jumlah transaksi
   - Total pengembalian
   - Referensi transaksi

### 5. Laporan untuk Manajemen

**Format Laporan Eksekutif**:

```
LAPORAN ANGGOTA KELUAR
Periode: November 2025

RINGKASAN:
- Anggota Keluar: 3 orang
- Pengembalian Selesai: 2 orang (Rp 7.900.000)
- Pengembalian Pending: 1 orang (Rp 2.300.000)

DETAIL PENDING:
1. Ani Wijaya (HR)
   - Alasan: Masih ada pinjaman aktif
   - Estimasi selesai: 15/12/2025

REKOMENDASI:
- Follow up pelunasan pinjaman Ani Wijaya
- Siapkan saldo kas untuk pengembalian bulan depan

Dibuat oleh: [Nama Bendahara]
Tanggal: 05/12/2025
```

### 6. Troubleshooting

**Masalah**: Data tidak muncul setelah filter

**Solusi**:
1. Cek format tanggal (DD/MM/YYYY)
2. Pastikan tanggal mulai <= tanggal akhir
3. Klik "Reset" lalu coba lagi
4. Refresh halaman (F5)

**Masalah**: Ekspor CSV gagal

**Solusi**:
1. Cek koneksi internet
2. Cek pop-up blocker browser
3. Coba browser lain
4. Clear cache browser

**Masalah**: Angka di CSV tidak sesuai

**Solusi**:
1. Pastikan Excel/Sheets menggunakan format angka yang benar
2. Jangan edit file CSV di Notepad (gunakan Excel)
3. Jika perlu, gunakan "Text to Columns" di Excel

---

## Integrasi dengan Fitur Lain

### 1. Dengan Master Anggota

- Klik nama anggota di laporan → Buka detail anggota
- Lihat riwayat lengkap transaksi
- Akses tombol "Proses Pengembalian" (jika pending)

### 2. Dengan Laporan Keuangan

- Referensi transaksi di laporan → Cari di jurnal akuntansi
- Verifikasi saldo simpanan
- Cross-check dengan laporan kas

### 3. Dengan Audit Log

- Setiap proses pengembalian tercatat di audit log
- Akses: Menu "Audit" → "Audit Log"
- Filter: Action = "PROCESS_PENGEMBALIAN"

---

## Hak Akses

### Berdasarkan Role

| Role | Akses Laporan | Ekspor CSV | Proses Pengembalian |
|------|---------------|------------|---------------------|
| Admin | ✅ Full | ✅ Ya | ✅ Ya |
| Bendahara | ✅ Full | ✅ Ya | ✅ Ya |
| Kasir | ✅ Read-only | ✅ Ya | ❌ Tidak |
| User | ✅ Read-only | ❌ Tidak | ❌ Tidak |

### Catatan Keamanan

- Laporan hanya menampilkan data anggota keluar
- Data sensitif (password, dll) tidak ditampilkan
- Ekspor CSV mencatat audit log
- Akses dibatasi sesuai role

---

## Kesimpulan

Laporan Anggota Keluar adalah tool penting untuk:
- ✅ Monitoring proses keluar anggota
- ✅ Audit pengembalian simpanan
- ✅ Analisis tren dan pola
- ✅ Dokumentasi dan arsip
- ✅ Verifikasi akuntansi

**Best Practice**:
1. Cek laporan secara rutin
2. Ekspor dan arsip setiap bulan
3. Follow up status Pending
4. Verifikasi dengan laporan keuangan
5. Gunakan untuk analisis manajemen

---

**Versi Dokumen**: 1.0  
**Terakhir Diperbarui**: 5 Desember 2025  
**Dibuat oleh**: Tim Pengembang Aplikasi Koperasi