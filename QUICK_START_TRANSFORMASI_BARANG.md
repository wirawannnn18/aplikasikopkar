# Quick Start: Transformasi Barang

## 🚀 Langkah Cepat Setup

### 1. Jalankan Fix Tool (5 menit)
```
1. Buka: fix_master_barang_transformasi_connection.html
2. Tunggu diagnosis selesai
3. Klik "Mulai Perbaikan" 
4. Klik "Test Koneksi" setelah selesai
```

### 2. Verifikasi dengan Test (2 menit)
```
1. Buka: test_transformasi_barang_connection.html
2. Pastikan semua tests PASSED ✅
3. Coba demo transformasi
```

### 3. Mulai Transformasi (1 menit)
```
1. Buka: transformasi_barang.html
2. Pilih item sumber (contoh: Beras Premium KG)
3. Pilih item target (contoh: Beras Premium Gram)
4. Masukkan jumlah: 1
5. Klik "Lakukan Transformasi"
```

## 📋 Contoh Transformasi Siap Pakai

Setelah setup, Anda bisa langsung coba transformasi ini:

### Transformasi Berat
- **1 KG Beras** → **1000 Gram Beras**
- **1000 Gram Beras** → **1 KG Beras**

### Transformasi Volume  
- **1 Liter Minyak** → **1000 ML Minyak**
- **1000 ML Minyak** → **1 Liter Minyak**

### Transformasi Kemasan
- **1 Dus Pulpen** → **12 Pcs Pulpen**
- **12 Pcs Pulpen** → **1 Dus Pulpen**

## 🔧 Troubleshooting Cepat

### Masalah: "Tidak ada item yang dapat ditransformasi"
**Solusi:**
```
1. Buka fix_master_barang_transformasi_connection.html
2. Klik "Buat Data Contoh"
3. Refresh halaman transformasi_barang.html
```

### Masalah: "Rasio konversi tidak ditemukan"
**Solusi:**
```
1. Pastikan items memiliki baseProduct yang sama
2. Jalankan fix tool untuk auto-create ratios
3. Atau tambah manual di localStorage: conversionRatios
```

### Masalah: "Stok tidak update"
**Solusi:**
```
1. Refresh halaman
2. Cek console untuk error
3. Jalankan: window.stockManager.refreshStockCache()
```

## 📊 Monitoring Status

### Cek Status Sistem
```javascript
// Buka Console (F12) dan jalankan:
console.log(window.masterBarangIntegration.getIntegrationStatus());
```

### Lihat Data Master Barang
```javascript
// Lihat semua master barang:
const masterBarang = JSON.parse(localStorage.getItem('masterBarang'));
console.table(masterBarang);
```

### Lihat History Transformasi
```javascript
// Lihat riwayat transformasi:
const history = JSON.parse(localStorage.getItem('transformationHistory'));
console.table(history);
```

## 🎯 Tips Penggunaan

### 1. Menambah Produk Baru untuk Transformasi
```
Format kode: [BASE]-[UNIT]
Contoh:
- BRG004-KG (Gula Kilogram)
- BRG004-GR (Gula Gram)
- BRG004-KARUNG (Gula Karung)

Pastikan baseProduct sama: BRG004
```

### 2. Menambah Rasio Konversi Custom
```javascript
// Contoh menambah rasio baru:
const ratios = JSON.parse(localStorage.getItem('conversionRatios') || '[]');
ratios.push({
  baseProduct: 'BRG005',
  conversions: [
    { from: 'box', to: 'pcs', ratio: 24 },
    { from: 'pcs', to: 'box', ratio: 0.042 }
  ]
});
localStorage.setItem('conversionRatios', JSON.stringify(ratios));
```

### 3. Backup Data Sebelum Testing
```javascript
// Backup master barang:
const backup = localStorage.getItem('masterBarang');
localStorage.setItem('masterBarang_backup', backup);

// Restore jika perlu:
const restore = localStorage.getItem('masterBarang_backup');
localStorage.setItem('masterBarang', restore);
```

## 🔄 Workflow Transformasi

```
1. User pilih item sumber & target
2. System validasi:
   ✓ Items dari baseProduct sama?
   ✓ Conversion ratio ada?
   ✓ Stok sumber cukup?
3. System hitung target quantity
4. User konfirmasi transformasi
5. System update stok atomically:
   - Kurangi stok sumber
   - Tambah stok target
6. System log ke audit trail
7. System dispatch events untuk sync
```

## 📱 Interface Transformasi

### Form Elements
- **Item Sumber**: Dropdown dengan items yang punya stok
- **Item Target**: Dropdown dengan items dari baseProduct sama
- **Jumlah**: Input number dengan validasi
- **Info Konversi**: Preview rasio dan hasil
- **Preview**: Tampilan before/after stok

### Status Indicators
- 🟢 **Ready**: Semua validasi OK, siap transformasi
- 🟡 **Warning**: Ada peringatan tapi bisa lanjut
- 🔴 **Error**: Ada error, tidak bisa transformasi

## 🎉 Selesai!

Setelah mengikuti quick start ini, sistem transformasi barang sudah siap digunakan dengan fitur:

- ✅ Transformasi antar unit (kg↔gram, liter↔ml, dus↔pcs)
- ✅ Update stok otomatis
- ✅ Validasi lengkap
- ✅ Audit trail
- ✅ Error handling
- ✅ Real-time sync

**Selamat menggunakan sistem transformasi barang! 🚀**