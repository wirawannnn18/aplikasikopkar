# Panduan Upload Master Barang

## Deskripsi
Fitur **Upload Master Barang** memungkinkan pengelolaan data barang secara massal melalui file CSV. Sistem ini mendukung upload kategori dan satuan sekaligus, serta menyediakan validasi komprehensif untuk memastikan integritas data.

## Fitur Utama

### 1. Upload Massal CSV
- **Drag & Drop Interface**: Upload file dengan cara drag & drop atau klik untuk browse
- **Format Validation**: Validasi format file dan ukuran (maksimal 5MB)
- **Template Download**: Template CSV siap pakai untuk memudahkan input data
- **Progress Tracking**: Monitor progress upload dengan indikator visual

### 2. Validasi Data Komprehensif
- **Header Validation**: Memastikan semua kolom yang diperlukan ada
- **Data Type Validation**: Validasi tipe data untuk setiap field
- **Business Rules**: Validasi aturan bisnis (harga tidak negatif, kode unik, dll)
- **Duplicate Detection**: Deteksi duplikasi dalam file dan dengan data existing

### 3. Manajemen Kategori & Satuan
- **Auto-Create**: Kategori dan satuan baru dibuat otomatis saat upload
- **Manual Management**: Kelola kategori dan satuan secara manual
- **Validation**: Validasi konsistensi kategori dan satuan

### 4. Preview & Konfirmasi
- **Data Preview**: Preview data sebelum import dengan tabel interaktif
- **Validation Results**: Tampilan hasil validasi dengan error dan warning
- **Import Confirmation**: Konfirmasi sebelum melakukan import final

## Format File CSV

### Header yang Diperlukan
```csv
kode,nama,kategori,satuan,harga_beli,stok,supplier
```

### Deskripsi Field
- **kode**: Kode unik barang (wajib, akan dikonversi ke uppercase)
- **nama**: Nama barang (wajib)
- **kategori**: Kategori barang (wajib, akan dikonversi ke lowercase)
- **satuan**: Satuan barang (wajib, akan dikonversi ke lowercase)
- **harga_beli**: Harga beli dalam rupiah (wajib, harus angka positif)
- **stok**: Jumlah stok (wajib, harus angka positif atau nol)
- **supplier**: Nama supplier (opsional)

### Contoh Data Valid
```csv
kode,nama,kategori,satuan,harga_beli,stok,supplier
BRG001,Beras Premium 5kg,makanan,kg,65000,50,PT Beras Sejahtera
BRG002,Minyak Goreng 1L,makanan,botol,15000,30,CV Minyak Murni
BRG003,Pulpen Pilot Hitam,alat-tulis,pcs,3000,100,Toko ATK Lengkap
```

## Cara Penggunaan

### Step 1: Upload File
1. **Akses Menu Upload**: Buka `upload_master_barang.html`
2. **Upload File**: 
   - Drag & drop file CSV ke area upload, atau
   - Klik area upload untuk browse file
3. **Validasi File**: Sistem akan memvalidasi format dan ukuran file

### Step 2: Preview Data
1. **Review Data**: Periksa data yang akan diupload dalam tabel preview
2. **Check Record Count**: Pastikan jumlah record sesuai ekspektasi
3. **Edit if Needed**: Jika ada kesalahan, upload ulang file yang sudah diperbaiki

### Step 3: Validasi
1. **Run Validation**: Klik "Lanjut ke Validasi" untuk memvalidasi data
2. **Review Results**: 
   - **Errors**: Harus diperbaiki sebelum import
   - **Warnings**: Bisa diabaikan tapi perlu diperhatikan
3. **Fix Errors**: Jika ada error, perbaiki file CSV dan upload ulang

### Step 4: Import
1. **Confirm Import**: Klik "Import Data" jika validasi berhasil
2. **Monitor Progress**: Pantau progress bar selama proses import
3. **Review Results**: Lihat summary hasil import (new, updated, failed)

## Validasi dan Aturan Bisnis

### Validasi Wajib
- ✅ Semua field wajib harus diisi
- ✅ Kode barang harus unik dalam file
- ✅ Harga beli harus angka positif
- ✅ Stok harus angka positif atau nol
- ✅ Format CSV harus sesuai template

### Validasi Bisnis
- ✅ Kode barang maksimal 20 karakter
- ✅ Nama barang maksimal 100 karakter
- ✅ Harga beli maksimal 10 juta (warning jika lebih)
- ✅ Stok maksimal 10,000 (warning jika lebih)

### Handling Duplikasi
- **Dalam File**: Error jika ada kode duplikat dalam satu file
- **Dengan Existing**: Warning jika kode sudah ada, data akan diupdate
- **Update Policy**: Data existing akan diupdate dengan data baru

## Manajemen Kategori & Satuan

### Kategori Default
- makanan
- minuman
- alat-tulis
- elektronik
- kebersihan
- lainnya

### Satuan Default
- pcs (pieces)
- kg (kilogram)
- gram
- liter
- ml (mililiter)
- box
- pack
- botol
- kaleng
- meter

### Menambah Kategori/Satuan Baru
1. **Manual**: Gunakan form "Kelola Kategori" dan "Kelola Satuan"
2. **Auto**: Kategori/satuan baru akan dibuat otomatis saat upload
3. **Validation**: Sistem akan memberikan warning untuk kategori/satuan baru

## Error Handling

### Error Umum dan Solusi

#### 1. "Format file tidak didukung"
**Penyebab**: File bukan format CSV
**Solusi**: 
- Pastikan file berekstensi .csv
- Jika dari Excel, gunakan "Save As" → CSV format

#### 2. "Header yang hilang"
**Penyebab**: Header CSV tidak sesuai template
**Solusi**:
- Download template dan gunakan sebagai referensi
- Pastikan header persis: `kode,nama,kategori,satuan,harga_beli,stok,supplier`

#### 3. "Kode barang wajib diisi"
**Penyebab**: Ada baris dengan kode kosong
**Solusi**:
- Periksa semua baris memiliki kode barang
- Hapus baris kosong atau isi kode yang hilang

#### 4. "Harga beli harus berupa angka valid"
**Penyebab**: Format harga tidak valid
**Solusi**:
- Gunakan angka tanpa titik atau koma sebagai pemisah ribuan
- Contoh: 15000 (bukan 15.000 atau 15,000)

#### 5. "Ukuran file terlalu besar"
**Penyebab**: File lebih dari 5MB
**Solusi**:
- Bagi file menjadi beberapa bagian
- Hapus kolom yang tidak perlu
- Kompres data jika memungkinkan

### Troubleshooting Upload

#### File Tidak Terbaca
1. **Check Encoding**: Pastikan file CSV menggunakan UTF-8 encoding
2. **Check Line Endings**: Gunakan line ending yang standar (LF atau CRLF)
3. **Check Special Characters**: Hindari karakter khusus yang bisa merusak parsing

#### Data Tidak Sesuai Ekspektasi
1. **Check Delimiter**: Pastikan menggunakan koma (,) sebagai delimiter
2. **Check Quotes**: Gunakan double quotes (") untuk data yang mengandung koma
3. **Check Empty Lines**: Hapus baris kosong di tengah data

## Tips dan Best Practices

### 1. Persiapan Data
- **Standardisasi**: Gunakan format yang konsisten untuk semua data
- **Validation**: Validasi data di Excel/spreadsheet sebelum export ke CSV
- **Backup**: Selalu backup data existing sebelum import massal

### 2. Kategori dan Satuan
- **Konsistensi**: Gunakan nama kategori dan satuan yang konsisten
- **Lowercase**: Sistem akan mengkonversi ke lowercase, jadi gunakan format yang seragam
- **Planning**: Rencanakan struktur kategori sebelum upload massal

### 3. Kode Barang
- **Format Konsisten**: Gunakan format kode yang konsisten (contoh: BRG001, BRG002)
- **Unique**: Pastikan setiap kode unik dan tidak akan berubah
- **Meaningful**: Gunakan kode yang bermakna dan mudah diingat

### 4. Harga dan Stok
- **Currency**: Gunakan angka bulat dalam rupiah (tanpa desimal)
- **Realistic**: Pastikan harga dan stok realistis
- **Validation**: Double-check harga yang sangat tinggi atau rendah

## Integrasi dengan Sistem Lain

### 1. Master Barang
- Data yang diupload akan langsung tersedia di master barang
- Update data existing akan mempertahankan tanggal buat original
- Tanggal update akan diset ke waktu import

### 2. Harga Jual
- Setelah upload, gunakan menu "Berikan Harga Jual" untuk set harga jual
- Harga beli dari upload akan digunakan sebagai referensi minimum

### 3. Sistem POS
- Barang yang diupload akan langsung tersedia untuk transaksi POS
- Pastikan kategori dan satuan sesuai dengan kebutuhan POS

### 4. Laporan
- Data upload akan tercatat dalam activity log
- Gunakan untuk audit trail dan monitoring perubahan data

## Monitoring dan Audit

### Activity Logging
Sistem mencatat semua aktivitas upload:
- Timestamp upload
- User yang melakukan upload
- Jumlah data (new, updated, failed)
- Detail error jika ada

### Performance Monitoring
- **File Size**: Monitor ukuran file yang diupload
- **Processing Time**: Waktu yang diperlukan untuk processing
- **Success Rate**: Persentase keberhasilan upload

### Data Quality
- **Validation Rate**: Persentase data yang lolos validasi
- **Error Patterns**: Pola error yang sering terjadi
- **Category Distribution**: Distribusi data per kategori

## Pengembangan Lanjutan

### Fitur yang Bisa Ditambahkan
1. **Excel Support**: Support langsung file Excel (.xlsx)
2. **Batch Processing**: Upload multiple files sekaligus
3. **Data Mapping**: Mapping kolom untuk format CSV yang berbeda
4. **Validation Rules**: Custom validation rules per kategori
5. **Import History**: Riwayat import dengan rollback capability
6. **API Integration**: Sinkronisasi dengan sistem external

### Optimisasi Performance
1. **Chunked Processing**: Process data dalam chunk untuk file besar
2. **Background Processing**: Async processing untuk file sangat besar
3. **Caching**: Cache validation results untuk performance
4. **Compression**: Compress data sebelum storage

## Keamanan

### Data Validation
- Semua input divalidasi dan disanitasi
- Prevent injection attacks melalui CSV
- File size limits untuk prevent DoS

### Access Control
- Log semua aktivitas upload
- User authentication required
- Role-based access untuk upload massal

### Data Integrity
- Backup otomatis sebelum import
- Transaction rollback jika import gagal
- Validation checksum untuk data integrity

## Support dan Troubleshooting

### Kontak Support
- Email: support@koperasi.com
- Dokumentasi: Lihat file README.md
- Test Suite: Gunakan `test_upload_master_barang.html` untuk testing

### Common Issues
1. **CSV Format Issues**: Gunakan template yang disediakan
2. **Large File Issues**: Bagi file menjadi beberapa bagian
3. **Validation Errors**: Periksa format data sesuai panduan
4. **Performance Issues**: Gunakan file yang lebih kecil atau hubungi support

### Debug Mode
Untuk troubleshooting advanced:
1. Buka browser developer tools
2. Check console untuk error messages
3. Monitor network tab untuk upload progress
4. Check localStorage untuk data persistence