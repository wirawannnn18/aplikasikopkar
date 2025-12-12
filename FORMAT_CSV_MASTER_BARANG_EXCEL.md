# Format CSV Master Barang Excel

## Daftar Isi
1. [Spesifikasi Format CSV](#spesifikasi-format-csv)
2. [Struktur Header](#struktur-header)
3. [Aturan Data](#aturan-data)
4. [Contoh File CSV](#contoh-file-csv)
5. [Validasi Format](#validasi-format)
6. [Tips dan Best Practices](#tips-dan-best-practices)

## Spesifikasi Format CSV

### File Requirements
- **Format**: CSV (Comma Separated Values)
- **Encoding**: UTF-8 (recommended) atau Windows-1252
- **Delimiter**: Koma (,)
- **Text Qualifier**: Tanda kutip ganda (")
- **Line Ending**: CRLF (Windows) atau LF (Unix)
- **Ukuran Maksimal**: 5MB
- **Ekstensi**: .csv

### Character Encoding
```
Recommended: UTF-8
Alternative: Windows-1252 (untuk kompatibilitas Excel lama)
Avoid: ASCII (tidak mendukung karakter Indonesia)
```

## Struktur Header

### Header Wajib (Urutan Harus Sesuai)
```csv
kode,nama,kategori,satuan,harga_beli,stok,supplier
```

### Deskripsi Kolom

| No | Kolom | Wajib | Tipe Data | Max Length | Deskripsi |
|----|-------|-------|-----------|------------|-----------|
| 1 | `kode` | ✅ | String | 20 | Kode unik barang |
| 2 | `nama` | ✅ | String | 100 | Nama barang |
| 3 | `kategori` | ✅ | String | 50 | Kategori barang (lowercase) |
| 4 | `satuan` | ✅ | String | 20 | Satuan barang (lowercase) |
| 5 | `harga_beli` | ✅ | Number | - | Harga beli (positif) |
| 6 | `stok` | ✅ | Number | - | Stok awal (≥ 0) |
| 7 | `supplier` | ❌ | String | 100 | Nama supplier (opsional) |

## Aturan Data

### 1. Kode Barang (`kode`)
```
✅ Valid:
- BRG001
- MAKANAN-001
- F001
- ELEKTRONIK_TV_001

❌ Invalid:
- (kosong)
- BRG 001 (ada spasi)
- BRG@001 (karakter khusus)
- 1234567890123456789012345 (terlalu panjang)
```

**Aturan**:
- Wajib diisi
- Maksimal 20 karakter
- Harus unik (tidak boleh duplikat)
- Boleh huruf, angka, dash (-), underscore (_)
- Tidak boleh spasi atau karakter khusus lain

### 2. Nama Barang (`nama`)
```
✅ Valid:
- Beras Premium 5kg
- Minyak Goreng Tropical 1 Liter
- Sabun Mandi Lifebuoy 85gr
- TV LED Samsung 32 inch

❌ Invalid:
- (kosong)
- Nama yang sangat panjang lebih dari 100 karakter akan ditolak sistem
```

**Aturan**:
- Wajib diisi
- Maksimal 100 karakter
- Boleh semua karakter termasuk spasi dan tanda baca
- Hindari karakter khusus yang bisa merusak CSV (", \n, \r)

### 3. Kategori (`kategori`)
```
✅ Valid:
- makanan
- minuman
- elektronik
- peralatan_rumah_tangga
- kesehatan

❌ Invalid:
- MAKANAN (uppercase)
- Makanan & Minuman (karakter &)
- makanan-minuman (dash tidak disarankan)
- (kosong)
```

**Aturan**:
- Wajib diisi
- Maksimal 50 karakter
- Harus lowercase
- Gunakan underscore (_) untuk pemisah kata
- Hindari karakter khusus
- Jika kategori belum ada, akan dibuat otomatis

### 4. Satuan (`satuan`)
```
✅ Valid:
- kg
- liter
- pcs
- box
- meter
- gram

❌ Invalid:
- Kg (uppercase)
- kg. (dengan titik)
- pcs/box (dengan slash)
- (kosong)
```

**Aturan**:
- Wajib diisi
- Maksimal 20 karakter
- Harus lowercase
- Tidak boleh ada titik atau karakter khusus
- Gunakan singkatan standar
- Jika satuan belum ada, akan dibuat otomatis

### 5. Harga Beli (`harga_beli`)
```
✅ Valid:
- 15000
- 25000.50
- 100000
- 5500.75

❌ Invalid:
- -15000 (negatif)
- 0 (nol)
- 15,000 (dengan koma sebagai separator)
- 15.000,50 (format Indonesia)
- lima ribu (teks)
- (kosong)
```

**Aturan**:
- Wajib diisi
- Harus angka positif (> 0)
- Gunakan titik (.) untuk desimal
- Tidak boleh menggunakan separator ribuan
- Maksimal 2 digit desimal

### 6. Stok (`stok`)
```
✅ Valid:
- 0 (boleh nol untuk barang habis)
- 100
- 50.5
- 1000

❌ Invalid:
- -10 (negatif)
- seratus (teks)
- 100,5 (koma sebagai desimal)
- (kosong)
```

**Aturan**:
- Wajib diisi
- Harus angka non-negatif (≥ 0)
- Boleh desimal untuk satuan yang mendukung
- Gunakan titik (.) untuk desimal

### 7. Supplier (`supplier`)
```
✅ Valid:
- PT Sumber Rejeki
- CV Maju Jaya
- Toko Berkah
- (kosong - opsional)

❌ Invalid:
- Nama supplier yang sangat panjang lebih dari 100 karakter
```

**Aturan**:
- Opsional (boleh kosong)
- Maksimal 100 karakter
- Boleh semua karakter

## Contoh File CSV

### Contoh 1: File CSV Sederhana
```csv
kode,nama,kategori,satuan,harga_beli,stok,supplier
BRG001,Beras Premium 5kg,makanan,kg,45000,100,PT Beras Sejahtera
BRG002,Minyak Goreng 1L,makanan,liter,15000,50,CV Minyak Jaya
BRG003,Sabun Mandi,kebersihan,pcs,3500,200,PT Sabun Bersih
BRG004,TV LED 32 inch,elektronik,unit,2500000,5,Samsung Indonesia
BRG005,Kopi Bubuk 200gr,minuman,gram,25000,75,
```

### Contoh 2: File dengan Karakter Khusus
```csv
kode,nama,kategori,satuan,harga_beli,stok,supplier
BRG006,"Susu ""Ultra"" 1L",minuman,liter,12000,30,PT Ultra Jaya
BRG007,"Roti Tawar, Gandum",makanan,pcs,8500,25,"Toko Roti ""Enak"""
BRG008,Deterjen Rinso 1kg,kebersihan,kg,18000,40,Unilever Indonesia
```

### Contoh 3: File dengan Kategori dan Satuan Baru
```csv
kode,nama,kategori,satuan,harga_beli,stok,supplier
BRG009,Laptop Gaming,komputer,unit,15000000,2,Asus Indonesia
BRG010,Mouse Wireless,aksesoris_komputer,pcs,150000,20,Logitech
BRG011,Kabel HDMI 2m,elektronik,meter,75000,15,
BRG012,Powerbank 10000mAh,aksesoris_hp,pcs,200000,10,Xiaomi
```

## Validasi Format

### Pre-Upload Validation Checklist

#### ✅ File Structure
- [ ] File berekstensi .csv
- [ ] Encoding UTF-8 atau Windows-1252
- [ ] Header sesuai template
- [ ] Tidak ada baris kosong di tengah data
- [ ] Delimiter menggunakan koma (,)

#### ✅ Data Content
- [ ] Semua field wajib terisi
- [ ] Kode barang unik (tidak ada duplikat)
- [ ] Format kategori dan satuan lowercase
- [ ] Harga beli positif
- [ ] Stok non-negatif
- [ ] Panjang karakter sesuai batas

#### ✅ Data Quality
- [ ] Nama barang deskriptif dan jelas
- [ ] Kategori konsisten dan terstandar
- [ ] Satuan menggunakan singkatan standar
- [ ] Harga realistis dan masuk akal
- [ ] Supplier name (jika ada) lengkap

### Validation Tools

#### Excel Formula untuk Validasi

**1. Cek Panjang Kode Barang:**
```excel
=IF(LEN(A2)>20,"ERROR: Kode terlalu panjang","OK")
```

**2. Cek Harga Positif:**
```excel
=IF(E2<=0,"ERROR: Harga harus positif","OK")
```

**3. Cek Stok Non-Negatif:**
```excel
=IF(F2<0,"ERROR: Stok tidak boleh negatif","OK")
```

**4. Cek Kategori Lowercase:**
```excel
=IF(C2=LOWER(C2),"OK","ERROR: Kategori harus lowercase")
```

**5. Cek Duplikat Kode:**
```excel
=IF(COUNTIF($A$2:$A$100,A2)>1,"ERROR: Kode duplikat","OK")
```

#### Python Script untuk Validasi
```python
import pandas as pd

def validate_csv(file_path):
    df = pd.read_csv(file_path)
    errors = []
    
    # Check required columns
    required_cols = ['kode', 'nama', 'kategori', 'satuan', 'harga_beli', 'stok']
    for col in required_cols:
        if col not in df.columns:
            errors.append(f"Missing column: {col}")
    
    # Check for empty required fields
    for idx, row in df.iterrows():
        for col in required_cols:
            if pd.isna(row[col]) or row[col] == '':
                errors.append(f"Row {idx+2}: {col} is empty")
    
    # Check duplicates
    duplicates = df[df.duplicated(['kode'], keep=False)]
    if not duplicates.empty:
        for kode in duplicates['kode'].unique():
            rows = df[df['kode'] == kode].index + 2
            errors.append(f"Duplicate kode '{kode}' in rows: {list(rows)}")
    
    # Check positive prices
    negative_prices = df[df['harga_beli'] <= 0]
    for idx in negative_prices.index:
        errors.append(f"Row {idx+2}: harga_beli must be positive")
    
    # Check non-negative stock
    negative_stock = df[df['stok'] < 0]
    for idx in negative_stock.index:
        errors.append(f"Row {idx+2}: stok cannot be negative")
    
    return errors

# Usage
errors = validate_csv('master_barang.csv')
if errors:
    for error in errors:
        print(error)
else:
    print("File validation passed!")
```

## Tips dan Best Practices

### 1. Persiapan Data di Excel

#### Setup Excel untuk CSV Export
1. **Format Kolom**:
   - Kode: Format as Text
   - Nama: Format as Text  
   - Kategori: Format as Text
   - Satuan: Format as Text
   - Harga Beli: Format as Number (no thousand separator)
   - Stok: Format as Number
   - Supplier: Format as Text

2. **Data Validation di Excel**:
   ```excel
   // Dropdown untuk kategori
   Data → Data Validation → List
   Source: makanan,minuman,elektronik,kebersihan
   
   // Validation untuk harga positif
   Data → Data Validation → Custom
   Formula: =E2>0
   ```

3. **Conditional Formatting untuk Error Detection**:
   ```excel
   // Highlight duplikat kode
   Home → Conditional Formatting → Highlight Cells Rules → Duplicate Values
   
   // Highlight harga negatif
   Home → Conditional Formatting → New Rule
   Formula: =$E2<=0
   ```

### 2. Export ke CSV

#### Dari Excel ke CSV
1. File → Save As
2. Pilih format "CSV (Comma delimited) (*.csv)"
3. Pilih encoding UTF-8 jika tersedia
4. Klik Save

#### Dari Google Sheets ke CSV
1. File → Download → Comma-separated values (.csv)
2. File otomatis dalam format UTF-8

### 3. Testing dan Quality Assurance

#### Test dengan Sample Kecil
```csv
kode,nama,kategori,satuan,harga_beli,stok,supplier
TEST001,Test Product 1,test,pcs,1000,10,Test Supplier
TEST002,Test Product 2,test,kg,2000,5,
```

#### Incremental Upload Strategy
1. **Phase 1**: Upload 10-20 record untuk test
2. **Phase 2**: Upload 100-200 record jika test berhasil
3. **Phase 3**: Upload semua data dalam batch 500-1000 record

### 4. Common Mistakes dan Cara Menghindari

#### ❌ Mistake 1: Mixed Case Categories
```csv
// Wrong
BRG001,Product 1,MAKANAN,kg,1000,10,
BRG002,Product 2,Minuman,liter,2000,5,

// Correct  
BRG001,Product 1,makanan,kg,1000,10,
BRG002,Product 2,minuman,liter,2000,5,
```

#### ❌ Mistake 2: Number Formatting
```csv
// Wrong
BRG001,Product 1,makanan,kg,"15,000",10,
BRG002,Product 2,makanan,kg,20.000,5,

// Correct
BRG001,Product 1,makanan,kg,15000,10,
BRG002,Product 2,makanan,kg,20000,5,
```

#### ❌ Mistake 3: Special Characters in CSV
```csv
// Wrong (unescaped quotes)
BRG001,Product "Premium",makanan,kg,15000,10,

// Correct (escaped quotes)
BRG001,"Product ""Premium""",makanan,kg,15000,10,
```

### 5. Performance Optimization

#### File Size Guidelines
- **Small**: <100 records, <1MB → Upload time: <30 detik
- **Medium**: 100-500 records, 1-3MB → Upload time: 1-2 menit  
- **Large**: 500-1000 records, 3-5MB → Upload time: 2-5 menit
- **Too Large**: >1000 records, >5MB → Split into multiple files

#### Batch Processing Strategy
```
Total Records: 2500
Recommended Batches:
- Batch 1: Records 1-1000
- Batch 2: Records 1001-2000  
- Batch 3: Records 2001-2500
```

---

## Template Download

### Standard Template
Download template CSV standar: [template_master_barang.csv](template_master_barang.csv)

### Template dengan Contoh Data
Download template dengan sample data: [template_master_barang_sample.csv](template_master_barang_sample.csv)

### Template Excel
Download template Excel untuk yang lebih familiar: [template_master_barang.xlsx](template_master_barang.xlsx)

---

## Referensi

### CSV Standards
- [RFC 4180 - Common Format and MIME Type for CSV Files](https://tools.ietf.org/html/rfc4180)
- [CSV Format Specification](https://www.iana.org/assignments/media-types/text/csv)

### Character Encoding
- [UTF-8 Encoding Guide](https://en.wikipedia.org/wiki/UTF-8)
- [Windows-1252 Character Set](https://en.wikipedia.org/wiki/Windows-1252)

---

*Format CSV ini dirancang untuk kompatibilitas maksimal dengan sistem upload master barang. Selalu gunakan template terbaru dan ikuti panduan validasi untuk hasil optimal.*