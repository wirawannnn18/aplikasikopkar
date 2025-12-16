# Quick Reference - Master Barang Komprehensif

## Akses Cepat

### Menu Utama
- **Akses**: Menu → Master Data → Master Barang
- **URL**: `/master_barang.html`
- **Shortcut**: `Ctrl + M` (jika dikonfigurasi)

### Tombol Utama
| Tombol | Fungsi | Shortcut |
|--------|--------|----------|
| **Tambah** | Tambah barang baru | `Ctrl + N` |
| **Import** | Import dari Excel/CSV | `Ctrl + I` |
| **Export** | Export ke Excel/CSV | `Ctrl + E` |
| **Search** | Pencarian data | `Ctrl + F` |

## Operasi Dasar

### Tambah Barang Baru
1. Klik **"Tambah Barang"**
2. Isi form:
   - Kode (opsional, auto-generate)
   - Nama barang (wajib)
   - Kategori (pilih/buat baru)
   - Satuan (pilih/buat baru)
   - Harga beli & jual
   - Stok & stok minimum
3. **Simpan**

### Edit Barang
1. Klik **"Edit"** pada baris barang
2. Ubah data yang diperlukan
3. **Simpan**

### Hapus Barang
1. Klik **"Hapus"** pada baris barang
2. Konfirmasi penghapusan
3. Data terhapus dan tercatat di audit

## Import/Export

### Import Data
**Format File**: Excel (.xlsx, .xls) atau CSV
**Template**: Download dari tombol "Download Template"

**Kolom Wajib**:
- Nama Barang
- Kategori
- Satuan

**Kolom Opsional**:
- Kode Barang (auto-generate jika kosong)
- Harga Beli
- Harga Jual
- Stok
- Stok Minimum

**Langkah Import**:
1. **Import** → Upload file
2. Preview & validasi data
3. Konfirmasi import

### Export Data
**Format**: Excel atau CSV
**Opsi Export**:
- Semua data
- Data terfilter
- Data terpilih

## Pencarian & Filter

### Pencarian
- **Real-time search**: Ketik di search box
- **Pencarian di**: Nama barang, kode barang
- **Tips**: Gunakan kata kunci parsial

### Filter
- **Kategori**: Filter berdasarkan kategori
- **Satuan**: Filter berdasarkan satuan
- **Status**: Aktif/Non-aktif
- **Stok**: Berdasarkan level stok

### Kombinasi Filter
- Gunakan multiple filter bersamaan
- Reset filter dengan tombol "Reset"

## Kategori & Satuan

### Kelola Kategori
1. **"Kelola Kategori"**
2. Tambah/Edit/Hapus kategori
3. **Validasi**: Nama harus unik
4. **Pembatasan**: Tidak bisa hapus jika digunakan

### Kelola Satuan
1. **"Kelola Satuan"**
2. Tambah/Edit/Hapus satuan
3. **Validasi**: Nama harus unik
4. **Pembatasan**: Tidak bisa hapus jika digunakan

## Operasi Bulk

### Bulk Delete
1. Pilih barang dengan checkbox
2. **"Hapus Terpilih"**
3. Konfirmasi penghapusan
4. Monitor progress

### Bulk Update
1. Pilih barang dengan checkbox
2. **"Update Terpilih"**
3. Pilih field yang akan diupdate
4. Masukkan nilai baru
5. Preview & konfirmasi

## Audit & Laporan

### Audit Log
- **Akses**: Tombol "Audit Log"
- **Filter**: Tanggal, operasi, user
- **Export**: Download audit log

### Laporan
- **Stok**: Laporan stok saat ini
- **Kategori**: Distribusi per kategori
- **Aktivitas**: Log aktivitas user

## Validasi Data

### Aturan Validasi
- ✅ Kode barang harus unik
- ✅ Nama barang wajib diisi
- ✅ Harga harus angka positif
- ✅ Stok tidak boleh negatif
- ✅ Harga jual ≥ harga beli (warning)

### Pesan Error Umum
| Error | Penyebab | Solusi |
|-------|----------|--------|
| "Kode sudah ada" | Kode duplikat | Gunakan kode lain atau kosongkan |
| "Nama wajib diisi" | Nama kosong | Isi nama barang |
| "Harga tidak valid" | Harga bukan angka | Masukkan angka valid |
| "Kategori tidak ditemukan" | Kategori tidak ada | Pilih kategori yang ada |

## Keyboard Shortcuts

| Shortcut | Fungsi |
|----------|--------|
| `Ctrl + N` | Tambah barang baru |
| `Ctrl + F` | Focus ke search box |
| `Ctrl + E` | Export data |
| `Ctrl + I` | Import data |
| `Escape` | Tutup dialog/form |
| `Enter` | Simpan form (jika dalam form) |
| `Tab` | Navigasi antar field |

## Tips & Trik

### Efisiensi Input
- Gunakan auto-generate untuk kode barang
- Buat kategori/satuan baru langsung dari form
- Gunakan copy-paste untuk data berulang

### Pencarian Efektif
- Gunakan kata kunci parsial: "beras" → "Beras 5kg"
- Kombinasikan search + filter
- Gunakan kode untuk pencarian cepat

### Import Besar
- Bagi file besar menjadi beberapa batch
- Pastikan format konsisten
- Backup data sebelum import

### Performance
- Gunakan pagination untuk data banyak
- Filter data untuk mengurangi tampilan
- Clear cache browser jika lambat

## Troubleshooting Cepat

### Masalah Umum
| Masalah | Solusi Cepat |
|---------|--------------|
| Data tidak tersimpan | Periksa validasi, refresh browser |
| Import gagal | Periksa format file, download template |
| Pencarian lambat | Kurangi data tampilan, gunakan filter |
| Error loading | Refresh browser, clear cache |

### Reset System
**PERINGATAN**: Akan menghapus semua data!
```javascript
// Buka console browser (F12)
localStorage.clear();
location.reload();
```

### Debug Mode
```javascript
// Enable debug mode
localStorage.setItem('master_barang_debug', 'true');
location.reload();
```

## Format Data

### Template Import
```csv
Kode Barang,Nama Barang,Kategori,Satuan,Harga Beli,Harga Jual,Stok,Stok Min
MB001,Beras 5kg,Sembako,Kg,50000,55000,100,10
MB002,Minyak Goreng 1L,Sembako,Botol,15000,17000,50,5
```

### Export Format
- **Excel**: .xlsx dengan formatting
- **CSV**: Comma-separated values
- **Encoding**: UTF-8

## Batasan Sistem

### Kapasitas
- **Max items**: 10,000 (recommended)
- **Max import size**: 5MB
- **Max categories**: 1,000
- **Max units**: 1,000

### Browser Support
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Storage
- **localStorage**: 5MB minimum
- **Audit retention**: 365 hari default

## Kontak Support

### Self-Help
1. Periksa troubleshooting guide
2. Coba refresh browser
3. Clear cache & cookies
4. Coba browser lain

### Hubungi IT
**Info yang diperlukan**:
- Screenshot error
- Langkah reproduksi
- Browser & versi
- Data yang digunakan

---

*Quick reference ini mencakup 80% operasi sehari-hari. Untuk detail lengkap, lihat panduan pengguna.*