# Troubleshooting Guide - Upload Master Barang Excel

## Daftar Isi
1. [Error Codes dan Solusi](#error-codes-dan-solusi)
2. [Masalah File Upload](#masalah-file-upload)
3. [Error Validasi Data](#error-validasi-data)
4. [Masalah Performance](#masalah-performance)
5. [Masalah Browser](#masalah-browser)
6. [Recovery dan Rollback](#recovery-dan-rollback)

## Error Codes dan Solusi

### File Upload Errors

#### ERR_FILE_001: Invalid File Format
```
❌ Error: Format file tidak didukung
📁 File: document.pdf
💡 Solusi: Gunakan file CSV (.csv) atau Excel (.xlsx)
```

**Langkah Perbaikan:**
1. Konversi file ke format CSV atau Excel
2. Pastikan ekstensi file benar (.csv atau .xlsx)
3. Jangan gunakan format lama Excel (.xls)

#### ERR_FILE_002: File Too Large
```
❌ Error: Ukuran file melebihi batas maksimal (5MB)
📁 File: data_barang_besar.xlsx (8.2MB)
💡 Solusi: Kompres file atau bagi menjadi beberapa file
```

**Langkah Perbaikan:**
1. Bagi data menjadi beberapa file (maksimal 1000 record per file)
2. Hapus kolom yang tidak perlu
3. Kompres gambar jika ada dalam Excel
4. Save as CSV untuk ukuran lebih kecil

#### ERR_FILE_003: File Corrupted
```
❌ Error: File rusak atau tidak bisa dibaca
📁 File: data_corrupt.xlsx
💡 Solusi: Perbaiki file atau buat ulang dari template
```

**Langkah Perbaikan:**
1. Buka file dengan Excel dan save ulang
2. Copy data ke template baru
3. Periksa encoding file (gunakan UTF-8)
4. Scan file dengan antivirus

#### ERR_FILE_004: Empty File
```
❌ Error: File kosong atau tidak ada data
📁 File: template_kosong.csv
💡 Solusi: Pastikan file berisi data dan header yang benar
```

**Langkah Perbaikan:**
1. Periksa file berisi data (minimal 1 record)
2. Pastikan header ada di baris pertama
3. Jangan upload file template kosong

### Validation Errors

#### ERR_VAL_001: Missing Required Field
```
❌ Error: Field wajib kosong
📍 Baris: 15
📝 Field: nama
💡 Solusi: Isi semua field yang wajib (kode, nama, kategori, satuan, harga_beli, stok)
```

**Langkah Perbaikan:**
1. Buka file Excel dan cari baris yang error
2. Isi field yang kosong
3. Gunakan filter untuk menemukan cell kosong
4. Pastikan tidak ada spasi kosong yang tidak terlihat

#### ERR_VAL_002: Duplicate Code
```
❌ Error: Kode barang duplikat
📍 Baris: 25, 47
📝 Kode: BRG001
💡 Solusi: Pastikan setiap kode barang unik
```

**Langkah Perbaikan:**
1. Gunakan fitur "Conditional Formatting" di Excel untuk highlight duplikat
2. Buat kode unik dengan pola sistematis (BRG001, BRG002, dst)
3. Gunakan formula Excel untuk generate kode otomatis
4. Sort data berdasarkan kode untuk mudah menemukan duplikat

#### ERR_VAL_003: Invalid Data Type
```
❌ Error: Tipe data tidak valid
📍 Baris: 33
📝 Field: harga_beli
📝 Value: "lima ribu"
💡 Solusi: Gunakan angka untuk field harga dan stok
```

**Langkah Perbaikan:**
1. Format kolom harga_beli dan stok sebagai "Number"
2. Hapus teks atau karakter non-numerik
3. Gunakan titik (.) untuk desimal, bukan koma
4. Jangan gunakan separator ribuan

#### ERR_VAL_004: Negative Value
```
❌ Error: Nilai negatif tidak diperbolehkan
📍 Baris: 18
📝 Field: harga_beli
📝 Value: -15000
💡 Solusi: Harga beli harus positif (> 0)
```

**Langkah Perbaikan:**
1. Periksa semua nilai harga_beli > 0
2. Untuk stok, boleh 0 tapi tidak boleh negatif
3. Gunakan formula Excel untuk validasi: `=IF(B2<=0,"ERROR","OK")`

#### ERR_VAL_005: Text Too Long
```
❌ Error: Teks terlalu panjang
📍 Baris: 42
📝 Field: nama
📝 Length: 150 (max: 100)
💡 Solusi: Persingkat nama barang maksimal 100 karakter
```

**Langkah Perbaikan:**
1. Gunakan formula Excel: `=LEN(B2)` untuk cek panjang teks
2. Persingkat nama yang terlalu panjang
3. Gunakan singkatan yang umum dipahami
4. Pindahkan detail ke kolom supplier jika perlu

### Business Rule Errors

#### ERR_BIZ_001: Invalid Category Format
```
❌ Error: Format kategori tidak valid
📍 Baris: 28
📝 Kategori: "MAKANAN & MINUMAN"
💡 Solusi: Gunakan format lowercase tanpa karakter khusus
```

**Langkah Perbaikan:**
1. Konversi semua kategori ke lowercase
2. Ganti spasi dengan underscore atau hapus
3. Hindari karakter khusus (&, %, @, dll)
4. Contoh yang benar: "makanan_minuman" atau "makanan"

#### ERR_BIZ_002: Invalid Unit Format
```
❌ Error: Format satuan tidak valid
📍 Baris: 35
📝 Satuan: "Kg."
💡 Solusi: Gunakan format lowercase tanpa titik
```

**Langkah Perbaikan:**
1. Hapus titik dan karakter khusus
2. Gunakan format lowercase
3. Contoh yang benar: "kg", "pcs", "liter"

## Masalah File Upload

### Upload Stuck atau Hang

**Gejala**: Progress upload berhenti di tengah jalan
**Penyebab Umum**:
- Koneksi internet tidak stabil
- File terlalu besar
- Browser kehabisan memory

**Solusi Step-by-Step**:
1. **Periksa Koneksi**:
   - Test koneksi internet
   - Gunakan koneksi yang stabil
   - Hindari upload saat jam sibuk

2. **Optimasi File**:
   - Bagi file besar (>1000 record) menjadi beberapa file
   - Hapus kolom yang tidak perlu
   - Gunakan format CSV untuk file lebih kecil

3. **Optimasi Browser**:
   - Tutup tab browser lain
   - Clear cache dan cookies
   - Restart browser
   - Gunakan mode incognito

### Drag & Drop Tidak Berfungsi

**Gejala**: File tidak bisa di-drag ke area upload
**Penyebab**: Browser tidak mendukung atau JavaScript disabled

**Solusi**:
1. **Enable JavaScript**:
   - Chrome: Settings → Privacy and Security → Site Settings → JavaScript
   - Firefox: about:config → javascript.enabled = true

2. **Update Browser**:
   - Gunakan versi terbaru Chrome, Firefox, atau Edge
   - Hindari Internet Explorer

3. **Alternative Upload**:
   - Gunakan tombol "Browse" jika drag & drop tidak berfungsi
   - Coba browser lain

### File Preview Tidak Muncul

**Gejala**: Setelah upload, preview data kosong
**Penyebab**: Error parsing file atau format tidak sesuai

**Solusi**:
1. **Periksa Format File**:
   - Pastikan header di baris pertama
   - Periksa delimiter CSV (harus koma)
   - Pastikan encoding UTF-8

2. **Periksa Data**:
   - Minimal ada 1 record data
   - Tidak ada baris kosong di tengah
   - Format data konsisten

## Error Validasi Data

### Banyak Record Error

**Gejala**: Sebagian besar record menunjukkan error
**Analisis Penyebab**:

1. **Template Tidak Sesuai**:
   ```
   ❌ Header tidak sesuai template
   💡 Download template terbaru dan copy data ke template
   ```

2. **Format Data Salah**:
   ```
   ❌ Banyak field dengan tipe data salah
   💡 Periksa format kolom di Excel (Text, Number, dll)
   ```

3. **Encoding Problem**:
   ```
   ❌ Karakter aneh atau tidak terbaca
   💡 Save file dengan encoding UTF-8
   ```

**Solusi Sistematis**:
1. Download template terbaru
2. Copy data ke template baru
3. Periksa format setiap kolom
4. Validasi data dengan formula Excel
5. Test dengan sample kecil (10 record) dulu

### Kategori/Satuan Tidak Dikenali

**Gejala**: Warning "kategori baru akan dibuat"
**Penyebab**: Kategori/satuan belum ada di sistem

**Solusi**:
1. **Review Kategori Existing**:
   - Buka Master Kategori untuk lihat yang sudah ada
   - Sesuaikan dengan kategori yang sudah ada

2. **Standardisasi Nama**:
   - Gunakan nama kategori yang konsisten
   - Hindari variasi nama (contoh: "makanan" vs "food")

3. **Approve Kategori Baru**:
   - Review daftar kategori baru
   - Approve jika memang diperlukan
   - Reject dan edit file jika tidak perlu

## Masalah Performance

### Import Sangat Lambat

**Gejala**: Progress import sangat lambat (>5 menit untuk 100 record)

**Diagnosis**:
1. **Periksa Ukuran File**:
   ```bash
   File Size: 2.5MB
   Record Count: 500
   Estimated Time: 2-3 menit (normal)
   ```

2. **Periksa System Resources**:
   - CPU Usage: <80%
   - Memory Usage: <4GB
   - Network: Stabil

**Optimasi Performance**:
1. **Bagi File Besar**:
   - Maksimal 1000 record per file
   - Upload secara bertahap

2. **Tutup Aplikasi Lain**:
   - Tutup aplikasi yang tidak perlu
   - Tutup tab browser lain

3. **Gunakan Waktu Optimal**:
   - Upload saat traffic rendah
   - Hindari jam kerja sibuk

### Memory Error

**Gejala**: Browser crash atau "Out of Memory"
**Penyebab**: File terlalu besar atau browser limitation

**Solusi**:
1. **Reduce File Size**:
   - Maksimal 500 record per batch
   - Hapus kolom yang tidak perlu
   - Gunakan format CSV

2. **Browser Optimization**:
   - Restart browser
   - Clear cache
   - Gunakan browser 64-bit
   - Increase browser memory limit

## Masalah Browser

### Browser Compatibility Issues

**Supported Browsers**:
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Edge 80+
- ✅ Safari 13+
- ❌ Internet Explorer (tidak didukung)

**Common Issues**:

#### Chrome Issues
```
Problem: Upload tidak berfungsi di Chrome
Solution: 
1. Clear cache dan cookies
2. Disable extensions
3. Update ke versi terbaru
```

#### Firefox Issues
```
Problem: Drag & drop tidak berfungsi
Solution:
1. Check JavaScript enabled
2. Disable strict privacy mode
3. Allow file access
```

#### Safari Issues
```
Problem: File preview tidak muncul
Solution:
1. Enable JavaScript
2. Allow pop-ups
3. Update Safari
```

### JavaScript Errors

**Common JavaScript Errors**:

#### Error: "Cannot read property of undefined"
```javascript
// Error di console browser
Uncaught TypeError: Cannot read property 'length' of undefined
at ExcelUploadManager.js:45

// Solusi: Refresh halaman dan coba lagi
```

#### Error: "File API not supported"
```javascript
// Error: Browser tidak mendukung File API
// Solusi: Update browser atau gunakan browser modern
```

## Recovery dan Rollback

### Import Gagal di Tengah Jalan

**Gejala**: Import berhenti dengan error
**Penyebab**: Network error, server error, atau data corruption

**Recovery Steps**:
1. **Check Import Status**:
   - Lihat di audit log berapa record yang berhasil
   - Identifikasi record yang gagal

2. **Partial Recovery**:
   - Export record yang gagal
   - Perbaiki data yang bermasalah
   - Upload ulang record yang gagal saja

3. **Full Rollback** (jika diperlukan):
   - Hubungi administrator
   - Request rollback berdasarkan audit log
   - Backup data akan direstore

### Data Salah Setelah Import

**Gejala**: Data yang diimport tidak sesuai harapan
**Penyebab**: Error mapping atau validasi tidak sempurna

**Rollback Process**:
1. **Immediate Action**:
   - Jangan lakukan import lain
   - Catat timestamp import yang bermasalah

2. **Contact Administrator**:
   - Berikan detail: timestamp, user, file name
   - Jelaskan data yang salah
   - Request rollback

3. **Prevention**:
   - Selalu test dengan sample kecil dulu
   - Review preview data dengan teliti
   - Backup data sebelum import besar

### Audit Log untuk Troubleshooting

**Menggunakan Audit Log**:
1. **Access Audit Log**:
   - Menu: Master Data → Audit Log
   - Filter berdasarkan tanggal dan user

2. **Information Available**:
   - Timestamp setiap operasi
   - User yang melakukan
   - Detail perubahan data
   - Error messages

3. **Troubleshooting dengan Log**:
   - Trace error berdasarkan timestamp
   - Identifikasi pattern error
   - Analisis root cause

## Emergency Contacts

### Untuk Masalah Teknis
📧 **Technical Support**: tech-support@koperasi.com  
📞 **Hotline**: (021) 1234-5678 ext. 101  
⏰ **Available**: 24/7 untuk masalah critical

### Untuk Rollback Request
📧 **Database Admin**: dba@koperasi.com  
📞 **Emergency**: +62 812-3456-7890  
⏰ **Response Time**: <2 jam untuk rollback request

### Untuk Training
📧 **Training Team**: training@koperasi.com  
📞 **Schedule**: (021) 1234-5678 ext. 102  
⏰ **Available**: Senin-Jumat, 09:00-16:00 WIB

---

## Quick Reference

### Error Code Summary
- **ERR_FILE_xxx**: File upload issues
- **ERR_VAL_xxx**: Data validation issues  
- **ERR_BIZ_xxx**: Business rule violations
- **ERR_SYS_xxx**: System/server errors

### Performance Guidelines
- **File Size**: Max 5MB
- **Record Count**: Max 1000 per file (recommended)
- **Processing Time**: ~1-2 menit per 100 record
- **Browser Memory**: Min 4GB RAM recommended

### Best Practices
1. Always use latest template
2. Test with small sample first
3. Validate data in Excel before upload
4. Keep backup of original files
5. Monitor audit log regularly

---

*Troubleshooting guide ini akan diupdate secara berkala berdasarkan feedback dan issue yang ditemukan. Selalu check versi terbaru di dokumentasi.*