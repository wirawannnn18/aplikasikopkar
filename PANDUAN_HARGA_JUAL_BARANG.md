# Panduan Harga Jual Barang

## Deskripsi
Fitur **Harga Jual Barang** memungkinkan pengelolaan harga jual untuk semua barang yang terdaftar dalam master barang. Sistem ini terintegrasi dengan data master barang dan menyediakan tools untuk penetapan harga yang efisien.

## Fitur Utama

### 1. Manajemen Harga Jual
- **Penetapan Harga Individual**: Set harga jual untuk setiap barang secara terpisah
- **Validasi Otomatis**: Sistem memastikan harga jual tidak kurang dari harga beli
- **Perhitungan Margin**: Otomatis menghitung persentase keuntungan
- **Status Tracking**: Monitor barang yang sudah/belum memiliki harga jual

### 2. Filter dan Pencarian
- **Pencarian Real-time**: Cari barang berdasarkan kode atau nama
- **Filter Kategori**: Tampilkan barang berdasarkan kategori tertentu
- **Filter Status**: Lihat barang yang sudah ada harga atau belum

### 3. Bulk Operations
- **Batch Save**: Simpan semua perubahan harga sekaligus
- **Bulk Update by Margin**: Set harga berdasarkan margin tertentu untuk kategori
- **Export Data**: Export daftar harga ke format CSV

## Cara Penggunaan

### Mengakses Menu Harga Jual
1. Buka file `harga_jual_barang.html` di browser
2. Sistem akan otomatis memuat data master barang
3. Jika belum ada data, sistem akan membuat data contoh

### Menetapkan Harga Jual

#### Metode Individual:
1. **Cari Barang**: Gunakan kotak pencarian untuk menemukan barang
2. **Input Harga**: Masukkan harga jual di kolom "Harga Jual"
3. **Validasi Otomatis**: Sistem akan memvalidasi harga dan menghitung margin
4. **Status Update**: Status akan berubah menjadi "Ada Harga"

#### Metode Bulk (via JavaScript Console):
```javascript
// Set margin 20% untuk semua barang kategori makanan
const manager = new HargaJualManager();
manager.bulkUpdateByMargin('makanan', 20);
```

### Menyimpan Perubahan
1. **Review Perubahan**: Lihat ringkasan di bagian summary
2. **Klik "Simpan Semua"**: Tombol di header tabel
3. **Konfirmasi**: Review perubahan di modal konfirmasi
4. **Simpan**: Klik "Ya, Simpan" untuk menyimpan ke localStorage

### Export Data
1. **Klik "Export"**: Tombol di header tabel
2. **File CSV**: Sistem akan download file CSV dengan nama format `harga_jual_barang_YYYY-MM-DD.csv`

## Validasi dan Aturan Bisnis

### Validasi Harga
- ✅ Harga jual harus berupa angka positif
- ✅ Harga jual tidak boleh kurang dari harga beli
- ✅ Margin maksimal 1000% (untuk mencegah kesalahan input)
- ✅ Input kosong akan mengatur status menjadi "Belum Ada Harga"

### Perhitungan Margin
```
Margin (%) = ((Harga Jual - Harga Beli) / Harga Beli) × 100
```

### Status Barang
- **Ada Harga**: Barang sudah memiliki harga jual > 0
- **Belum Ada**: Barang belum memiliki harga jual atau harga = 0

## Data Structure

### Master Barang
```javascript
{
  kode: "BRG001",
  nama: "Beras Premium 5kg",
  kategori: "makanan",
  hargaBeli: 65000,
  satuan: "kg",
  stok: 50,
  supplier: "PT Beras Sejahtera"
}
```

### Harga Jual Data
```javascript
{
  kodeBarang: "BRG001",
  hargaJual: 75000,
  tanggalBuat: "2024-12-11T10:00:00.000Z",
  tanggalUpdate: "2024-12-11T10:00:00.000Z"
}
```

## Statistik dan Monitoring

### Dashboard Summary
- **Total Barang**: Jumlah total barang dalam master
- **Sudah Ada Harga**: Jumlah barang yang sudah memiliki harga jual
- **Belum Ada Harga**: Jumlah barang yang belum memiliki harga jual
- **Rata-rata Margin**: Persentase margin rata-rata dari semua barang

### Tracking Perubahan
Sistem mencatat semua perubahan harga untuk audit trail:
- Timestamp perubahan
- User yang melakukan perubahan
- Harga lama vs harga baru
- Alasan perubahan (jika ada)

## Tips Penggunaan

### 1. Penetapan Harga Strategis
- **Analisis Kompetitor**: Bandingkan dengan harga pasar
- **Margin Kategori**: Gunakan margin berbeda per kategori
  - Makanan: 15-25%
  - Alat Tulis: 30-50%
  - Elektronik: 10-20%

### 2. Bulk Update Efisien
```javascript
// Contoh bulk update dengan margin berbeda per kategori
const manager = new HargaJualManager();

// Makanan - margin 20%
manager.bulkUpdateByMargin('makanan', 20);

// Alat tulis - margin 40%
manager.bulkUpdateByMargin('alat-tulis', 40);

// Elektronik - margin 15%
manager.bulkUpdateByMargin('elektronik', 15);

// Simpan semua perubahan
manager.simpanSemuaPerubahan();
```

### 3. Monitoring Rutin
- **Review Mingguan**: Periksa barang yang belum ada harga
- **Analisis Margin**: Monitor margin per kategori
- **Update Berkala**: Sesuaikan harga berdasarkan perubahan harga beli

## Troubleshooting

### Masalah Umum

#### 1. Data Tidak Tersimpan
**Penyebab**: Browser tidak mendukung localStorage atau storage penuh
**Solusi**: 
- Periksa pengaturan browser
- Clear cache dan cookies
- Gunakan browser yang mendukung HTML5

#### 2. Harga Tidak Bisa Diinput
**Penyebab**: Validasi gagal atau format input salah
**Solusi**:
- Pastikan input berupa angka
- Periksa harga beli barang
- Refresh halaman dan coba lagi

#### 3. Export Tidak Berfungsi
**Penyebab**: Browser memblokir download otomatis
**Solusi**:
- Allow download di pengaturan browser
- Coba browser lain
- Gunakan mode incognito

### Reset Data (Development)
```javascript
// HATI-HATI: Ini akan menghapus semua data harga jual
const manager = new HargaJualManager();
manager.resetAllHarga();
```

## Integrasi dengan Sistem Lain

### 1. Master Barang
- Otomatis sinkron dengan perubahan master barang
- Barang baru akan muncul dengan status "Belum Ada Harga"

### 2. Sistem POS
- Harga jual akan digunakan dalam transaksi penjualan
- Update harga akan langsung berlaku di POS

### 3. Laporan
- Data harga jual digunakan dalam laporan keuntungan
- Analisis margin per kategori/periode

## Keamanan Data

### 1. Validasi Input
- Semua input divalidasi di client-side
- Sanitasi data sebelum disimpan

### 2. Activity Logging
- Semua perubahan dicatat dalam log aktivitas
- Timestamp dan user tracking

### 3. Backup Data
- Data disimpan di localStorage browser
- Disarankan export berkala untuk backup

## Pengembangan Lanjutan

### Fitur yang Bisa Ditambahkan
1. **Harga Bertingkat**: Harga berbeda berdasarkan jumlah pembelian
2. **Harga Promosi**: Sistem diskon dan promosi
3. **Auto-Update**: Sinkronisasi dengan supplier untuk harga beli
4. **Approval Workflow**: Persetujuan untuk perubahan harga signifikan
5. **Price History**: Riwayat perubahan harga
6. **Competitor Analysis**: Integrasi dengan data harga kompetitor

### API Integration
```javascript
// Contoh struktur untuk integrasi API
class HargaJualAPI {
    async syncWithSupplier(supplierId) {
        // Sinkronisasi harga beli dari supplier
    }
    
    async getMarketPrice(productCode) {
        // Ambil harga pasar untuk referensi
    }
    
    async submitPriceChange(changes) {
        // Submit perubahan harga ke server
    }
}
```

## Kontak Support
Jika mengalami masalah atau butuh bantuan:
- Email: support@koperasi.com
- Dokumentasi: Lihat file README.md
- Issue Tracker: Gunakan sistem ticketing internal