# Panduan Transformasi Barang Terintegrasi Stok

## 📋 Deskripsi
Sistem transformasi barang yang terintegrasi langsung dengan stok barang. Memungkinkan konversi barang dari satu unit ke unit lain dengan otomatis mengurangi stok sumber dan menambah stok target.

## 🎯 Fitur Utama

### ✅ Integrasi Stok Otomatis
- **Stok Sumber Berkurang**: Otomatis mengurangi stok barang asal sesuai jumlah transformasi
- **Stok Target Bertambah**: Otomatis menambah stok barang tujuan sesuai hasil konversi
- **Real-time Update**: Perubahan stok langsung tersimpan dan terlihat

### ✅ Contoh Transformasi yang Tersedia
1. **Beras Premium**: 1 kg = 1000 gram
2. **Air Mineral**: 1 dus = 24 botol  
3. **Gula Pasir**: 1 karung = 50 kg

### ✅ Validasi Ketat
- Cek ketersediaan stok sebelum transformasi
- Validasi bahwa item sumber dan target dari produk yang sama
- Validasi rasio konversi yang benar
- Pencegahan stok negatif

## 🚀 Cara Menggunakan

### 1. Akses Halaman Transformasi
Buka file: `transformasi_barang_enhanced.html`

### 2. Pilih Barang Asal
- Dropdown akan menampilkan barang yang memiliki stok > 0
- Format: "Nama Barang (Stok: X unit)"
- Hanya barang yang bisa ditransformasi yang muncul

### 3. Pilih Barang Tujuan
- Setelah memilih barang asal, dropdown target akan difilter
- Hanya menampilkan barang dari produk yang sama
- Tidak bisa memilih barang yang sama dengan sumber

### 4. Masukkan Jumlah
- Input jumlah unit yang akan ditransformasi
- Sistem akan menampilkan preview hasil konversi
- Validasi otomatis untuk memastikan stok mencukupi

### 5. Preview Transformasi
Sistem akan menampilkan:
- **Barang Asal**: Stok saat ini, jumlah yang dikurangi, stok setelah transformasi
- **Barang Tujuan**: Stok saat ini, jumlah yang ditambah, stok setelah transformasi
- **Rasio Konversi**: Perbandingan unit (misal: 1 kg = 1000 gram)

### 6. Lakukan Transformasi
- Klik tombol "Lakukan Transformasi"
- Sistem akan memproses dan update stok otomatis
- Transaksi tersimpan dalam history

## 📊 Contoh Penggunaan

### Contoh 1: Transformasi Beras KG ke Gram
```
Barang Asal: Beras Premium (Kilogram) - Stok: 100 kg
Barang Tujuan: Beras Premium (Gram) - Stok: 50000 gram
Jumlah Transformasi: 5 kg

Hasil:
- Beras KG: 100 kg → 95 kg (berkurang 5 kg)
- Beras Gram: 50000 gram → 55000 gram (bertambah 5000 gram)
- Rasio: 1 kg = 1000 gram
```

### Contoh 2: Transformasi Air Mineral Dus ke Botol
```
Barang Asal: Air Mineral (Dus) - Stok: 20 dus
Barang Tujuan: Air Mineral (Botol) - Stok: 480 botol
Jumlah Transformasi: 2 dus

Hasil:
- Air Mineral Dus: 20 dus → 18 dus (berkurang 2 dus)
- Air Mineral Botol: 480 botol → 528 botol (bertambah 48 botol)
- Rasio: 1 dus = 24 botol
```

### Contoh 3: Transformasi Gula Karung ke KG
```
Barang Asal: Gula Pasir (Karung) - Stok: 10 karung
Barang Tujuan: Gula Pasir (Kilogram) - Stok: 200 kg
Jumlah Transformasi: 1 karung

Hasil:
- Gula Karung: 10 karung → 9 karung (berkurang 1 karung)
- Gula KG: 200 kg → 250 kg (bertambah 50 kg)
- Rasio: 1 karung = 50 kg
```

## 🔧 Konfigurasi Data

### Struktur Master Barang
```javascript
{
    kode: 'BRG001-KG',           // Kode unik item
    nama: 'Beras Premium (Kilogram)', // Nama lengkap
    satuan: 'kg',                // Unit satuan
    stok: 100,                   // Jumlah stok saat ini
    baseProduct: 'BRG001',       // Produk dasar (untuk grouping)
    hargaBeli: 12000,           // Harga beli
    hargaJual: 15000            // Harga jual
}
```

### Struktur Rasio Konversi
```javascript
{
    baseProduct: 'BRG001',      // Produk dasar
    conversions: [
        { 
            from: 'kg',         // Unit asal
            to: 'gram',         // Unit tujuan
            ratio: 1000         // Rasio konversi (1 kg = 1000 gram)
        },
        { 
            from: 'gram', 
            to: 'kg', 
            ratio: 0.001        // Rasio kebalikan (1 gram = 0.001 kg)
        }
    ]
}
```

## 📈 Fitur Monitoring

### Statistik Real-time
- **Transformasi Hari Ini**: Jumlah transformasi yang dilakukan hari ini
- **Item Tersedia**: Total item yang bisa ditransformasi

### History Transformasi
- Daftar transformasi terbaru hari ini
- Detail: item asal → item tujuan, jumlah, waktu
- Status transaksi (berhasil/gagal)

### Audit Trail
Setiap transformasi tercatat dengan:
- ID transaksi unik
- Timestamp
- User yang melakukan
- Detail item asal dan tujuan
- Jumlah dan rasio konversi
- Status transaksi

## ⚠️ Validasi dan Error Handling

### Validasi Input
- ✅ Item asal harus memiliki stok > 0
- ✅ Item asal dan tujuan harus dari produk yang sama
- ✅ Item asal dan tujuan tidak boleh sama
- ✅ Jumlah transformasi harus > 0
- ✅ Stok harus mencukupi untuk transformasi

### Error Messages
- **"Stok tidak mencukupi"**: Ketika jumlah transformasi > stok tersedia
- **"Item harus dari produk yang sama"**: Ketika mencoba transformasi antar produk berbeda
- **"Item asal dan tujuan tidak boleh sama"**: Ketika memilih item yang sama

## 🔄 Integrasi dengan Sistem Lain

### Data Storage
- Menggunakan localStorage untuk penyimpanan data
- Kompatibel dengan sistem master barang yang ada
- Data tersinkronisasi real-time

### API Integration (Future)
Sistem siap untuk integrasi dengan:
- Database server (MySQL, PostgreSQL)
- REST API backend
- Real-time synchronization
- Multi-user support

## 🛠️ Troubleshooting

### Masalah Umum

**Q: Dropdown barang kosong**
A: Pastikan ada data master barang dengan baseProduct yang sama dan rasio konversi yang terdefinisi

**Q: Tombol transformasi disabled**
A: Periksa validasi: pilih item asal & tujuan, masukkan jumlah > 0, pastikan stok mencukupi

**Q: Stok tidak terupdate**
A: Refresh halaman atau klik tombol "Refresh Data"

### Reset Data
Untuk reset ke data sample:
1. Buka Developer Tools (F12)
2. Jalankan: `localStorage.clear()`
3. Refresh halaman

## 📞 Support

Untuk bantuan teknis atau pertanyaan:
- Dokumentasi lengkap tersedia di file ini
- Contoh implementasi di `transformasi_barang_enhanced.html`
- Log error tersedia di browser console (F12)

---

**Catatan**: Sistem ini dirancang untuk kemudahan penggunaan dengan validasi ketat untuk mencegah kesalahan data stok.