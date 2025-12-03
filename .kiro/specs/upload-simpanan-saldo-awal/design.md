# Design Document - Upload Simpanan Saldo Awal

## Overview

Fitur upload simpanan saldo awal memungkinkan admin untuk mengimport data simpanan pokok dan simpanan wajib secara massal melalui file CSV atau paste data pada Step 6 wizard saldo awal periode. Fitur ini terintegrasi dengan Chart of Accounts (COA) dan memastikan data simpanan tercatat sebagai kewajiban dalam persamaan akuntansi. Design ini fokus pada kemudahan penggunaan, validasi data yang ketat, dan integrasi yang seamless dengan sistem akuntansi yang sudah ada.

## Architecture

Sistem menggunakan arsitektur client-side dengan pola MVC sederhana yang terintegrasi dengan wizard saldo awal yang sudah ada:

- **Model**: Data simpanan disimpan di `wizardState.data.simpananAnggota` sebagai array objek dengan field `simpananPokok` dan `simpananWajib`
- **View**: Dialog upload dengan tab untuk file upload dan paste data, preview table, dan tombol upload di Step 6 wizard
- **Controller**: Fungsi JavaScript untuk parsing CSV, validasi data, merge dengan data existing, dan update COA

### Komponen Utama

1. **Step 6 Wizard Enhancement (js/saldoAwal.js)**
   - Tambah tombol "Upload Simpanan Pokok CSV" dan "Upload Simpanan Wajib CSV"
   - Render tabel simpanan dengan data dari wizardState
   - Fungsi `renderStep6Simpanan()` yang sudah ada akan dienhance

2. **Upload Dialog Component**
   - Modal dialog dengan 2 tab: File Upload dan Paste Data
   - Preview table untuk menampilkan data sebelum import
   - Validasi dan error display
   - Fungsi `showUploadSimpananDialog(type)` dimana type = 'pokok' atau 'wajib'

3. **CSV Parser Module**
   - Fungsi `parseCSVSimpanan(csvText, type)` untuk parsing CSV
   - Support multiple delimiters (comma, semicolon, tab)
   - Handle BOM, different line endings, whitespace trimming
   - Return array of objects dengan validation errors

4. **Data Validator Module**
   - Fungsi `validateSimpananData(data, type)` untuk validasi
   - Check NIK exists in anggota data
   - Check jumlah is positive number
   - Check required fields
   - Return validation result dengan error details

5. **Data Merger Module**
   - Fungsi `mergeSimpananData(existingData, newData, mode)` untuk merge
   - Mode: 'replace' atau 'merge'
   - Handle duplicate NIK
   - Return merged data

6. **COA Integration Module**
   - Fungsi `updateCOAFromSimpanan()` untuk update COA
   - Update akun 2-1100 (Simpanan Pokok)
   - Update akun 2-1200 (Simpanan Wajib)
   - Maintain consistency between wizardState and COA

## Components and Interfaces

### 1. Data Model

```javascript
// Struktur data simpanan anggota di wizardState
{
  anggotaId: string,        // ID anggota (NIK)
  nama: string,             // Nama anggota
  simpananPokok: number,    // Jumlah simpanan pokok
  simpananWajib: number,    // Jumlah simpanan wajib
  simpananSukarela: number  // Jumlah simpanan sukarela (existing)
}

// Format CSV Simpanan Pokok
// Header: NIK,Nama,Jumlah,Tanggal
// Example: 3201010101010001,Budi Santoso,1000000,2024-01-01

// Format CSV Simpanan Wajib
// Header: NIK,Nama,Jumlah,Periode,Tanggal
// Example: 3201010101010001,Budi Santoso,500000,2024-01,2024-01-15
```

### 2. Function Interfaces

#### showUploadSimpananDialog(type)
```javascript
/**
 * Menampilkan dialog upload simpanan
 * @param {string} type - Tipe simpanan: 'pokok' atau 'wajib'
 * @returns {void}
 */
function showUploadSimpananDialog(type)
```

#### parseCSVSimpanan(csvText, type)
```javascript
/**
 * Parse CSV text menjadi array of objects
 * @param {string} csvText - Text content dari CSV
 * @param {string} type - Tipe simpanan: 'pokok' atau 'wajib'
 * @returns {Object} - {success: boolean, data: Array, errors: Array}
 */
function parseCSVSimpanan(csvText, type)
```

#### validateSimpananData(data, type)
```javascript
/**
 * Validasi data simpanan
 * @param {Array} data - Array of simpanan objects
 * @param {string} type - Tipe simpanan: 'pokok' atau 'wajib'
 * @returns {Object} - {isValid: boolean, validData: Array, errors: Array}
 */
function validateSimpananData(data, type)
```

#### mergeSimpananData(existingData, newData, mode)
```javascript
/**
 * Merge data simpanan baru dengan existing data
 * @param {Array} existingData - Data simpanan yang sudah ada
 * @param {Array} newData - Data simpanan baru dari upload
 * @param {string} mode - Mode merge: 'replace' atau 'merge'
 * @returns {Array} - Merged data
 */
function mergeSimpananData(existingData, newData, mode)
```

#### updateCOAFromSimpanan()
```javascript
/**
 * Update COA berdasarkan data simpanan di wizardState
 * @returns {void}
 */
function updateCOAFromSimpanan()
```

#### downloadTemplateSimpanan(type)
```javascript
/**
 * Download template CSV untuk simpanan
 * @param {string} type - Tipe simpanan: 'pokok' atau 'wajib'
 * @returns {void}
 */
function downloadTemplateSimpanan(type)
```

## Data Models

### WizardState Enhancement
```javascript
wizardState.data.simpananAnggota = [
  {
    anggotaId: '3201010101010001',
    nama: 'Budi Santoso',
    simpananPokok: 1000000,
    simpananWajib: 500000,
    simpananSukarela: 2000000
  },
  // ... more members
]
```

### Upload State
```javascript
uploadState = {
  type: 'pokok' | 'wajib',
  mode: 'file' | 'paste',
  rawData: string,
  parsedData: Array,
  validData: Array,
  errors: Array,
  previewVisible: boolean
}
```

### COA Integration
```javascript
// Akun Simpanan Pokok (2-1100)
{
  kode: '2-1100',
  nama: 'Simpanan Pokok',
  tipe: 'Kewajiban',
  saldo: totalSimpananPokok
}

// Akun Simpanan Wajib (2-1200)
{
  kode: '2-1200',
  nama: 'Simpanan Wajib',
  tipe: 'Kewajiban',
  saldo: totalSimpananWajib
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

Setelah menganalisis semua acceptance criteria, saya mengidentifikasi beberapa redundansi:

1. **Property 1.2 dan 2.2** adalah duplikat - keduanya tentang menampilkan dialog upload
2. **Property 1.3 dan 2.3** adalah duplikat - keduanya tentang parsing dan preview
3. **Property 1.4 dan 2.4** adalah duplikat - keduanya tentang menyimpan ke wizardState
4. **Property 1.5 dan 2.5** adalah duplikat - keduanya tentang update UI
5. **Property 10.2 dan 10.3** bisa digabung - keduanya tentang parsing paste data dengan different delimiters
6. **Property 10.4 dan 10.5** bisa digabung - keduanya tentang consistency paste dengan upload

Saya akan mengkonsolidasikan properties ini untuk menghilangkan redundansi.

### Correctness Properties

Property 1: Dialog upload muncul saat tombol diklik
*For any* tipe simpanan (pokok atau wajib), ketika tombol upload diklik, sistem harus menampilkan dialog upload dengan opsi file dan paste data
**Validates: Requirements 1.2, 2.2**

Property 2: CSV parsing menghasilkan preview
*For any* file CSV yang valid, sistem harus memparse data dan menampilkan preview table dengan semua data yang akan diimport
**Validates: Requirements 1.3, 2.3, 6.1**

Property 3: Data tersimpan ke wizardState setelah konfirmasi
*For any* data simpanan yang valid, setelah admin mengkonfirmasi import, data harus tersimpan di wizardState.data.simpananAnggota dengan field yang sesuai (simpananPokok atau simpananWajib)
**Validates: Requirements 1.4, 2.4**

Property 4: UI update setelah import
*For any* import yang berhasil, sistem harus memperbarui tampilan tabel simpanan dan total simpanan (pokok atau wajib) sesuai dengan data baru
**Validates: Requirements 1.5, 2.5, 9.5**

Property 5: Validasi format CSV
*For any* file yang diupload, sistem harus memvalidasi bahwa format adalah CSV dengan delimiter yang didukung (koma, semicolon, atau tab)
**Validates: Requirements 3.1, 8.1**

Property 6: Validasi header CSV
*For any* CSV yang diparsing, sistem harus memvalidasi bahwa header kolom sesuai dengan format yang ditentukan untuk tipe simpanan tersebut
**Validates: Requirements 3.2**

Property 7: Validasi referential integrity NIK
*For any* NIK dalam data CSV, sistem harus memastikan NIK tersebut ada dalam data anggota yang sudah terdaftar
**Validates: Requirements 3.3**

Property 8: Validasi nilai simpanan positif
*For any* jumlah simpanan dalam data, sistem harus memastikan nilai adalah angka positif atau nol
**Validates: Requirements 3.4**

Property 9: Error reporting yang spesifik
*For any* data CSV yang tidak valid, sistem harus menampilkan pesan error yang spesifik menjelaskan baris dan kolom yang bermasalah
**Validates: Requirements 3.5, 6.4**

Property 10: Integrasi dengan COA
*For any* import simpanan (pokok atau wajib), sistem harus menambahkan nilai ke akun yang sesuai di COA (2-1100 untuk pokok, 2-1200 untuk wajib)
**Validates: Requirements 4.1, 4.2**

Property 11: Perhitungan total kewajiban
*For any* state di Step 7, sistem harus menghitung total kewajiban termasuk simpanan pokok dan simpanan wajib dari data yang diimport
**Validates: Requirements 4.3**

Property 12: Konsistensi data simpanan dengan COA
*For any* perhitungan balance, total simpanan dari wizardState harus sama dengan total di COA
**Validates: Requirements 4.4**

Property 13: Jurnal pembuka mencatat simpanan
*For any* penyimpanan saldo awal dengan data simpanan, sistem harus membuat jurnal pembuka yang mencatat simpanan sebagai kewajiban
**Validates: Requirements 4.5**

Property 14: Merge data upload dengan manual
*For any* upload CSV, sistem harus menggabungkan data upload dengan data manual yang sudah ada di wizardState
**Validates: Requirements 5.1**

Property 15: Handling duplikasi NIK
*For any* NIK yang duplikat dalam upload, sistem harus menimpa data lama dengan data baru dari upload
**Validates: Requirements 5.2**

Property 16: Update data tanpa menghapus data lain
*For any* edit data simpanan setelah upload, sistem harus memperbarui nilai di wizardState tanpa menghapus data anggota lain
**Validates: Requirements 5.3**

Property 17: Delete data dan update total
*For any* penghapusan baris simpanan, sistem harus menghapus data dari wizardState dan memperbarui total simpanan
**Validates: Requirements 5.4**

Property 18: Opsi replace atau merge pada upload kedua
*For any* upload kedua kalinya, sistem harus memberikan opsi untuk replace semua data atau merge dengan data existing
**Validates: Requirements 5.5**

Property 19: Preview menampilkan jumlah record
*For any* preview yang ditampilkan, sistem harus menampilkan jumlah total record yang akan diimport
**Validates: Requirements 6.2**

Property 20: Preview menampilkan total nilai
*For any* preview yang ditampilkan, sistem harus menampilkan total nilai simpanan yang akan diimport
**Validates: Requirements 6.3**

Property 21: Cancel import tidak menyimpan data
*For any* pembatalan import, sistem harus menutup dialog preview tanpa menyimpan data ke wizardState
**Validates: Requirements 6.5**

Property 22: Template CSV dengan header yang benar
*For any* download template, file CSV harus memiliki header yang sesuai dengan tipe simpanan (pokok atau wajib)
**Validates: Requirements 7.2, 7.3**

Property 23: Template menyertakan contoh data
*For any* template yang diunduh, file harus menyertakan contoh data di baris pertama sebagai panduan
**Validates: Requirements 7.4**

Property 24: Parser trim whitespace
*For any* field dalam CSV, sistem harus trim whitespace dari awal dan akhir field
**Validates: Requirements 8.4**

Property 25: Notifikasi sukses dengan jumlah record
*For any* import yang berhasil, sistem harus menampilkan notifikasi sukses dengan jumlah record yang berhasil diimport
**Validates: Requirements 9.1**

Property 26: Notifikasi sukses dengan total nilai
*For any* import yang berhasil, sistem harus menampilkan total nilai simpanan yang berhasil diimport
**Validates: Requirements 9.2**

Property 27: Pesan error untuk import gagal
*For any* import yang gagal, sistem harus menampilkan pesan error yang menjelaskan penyebab kegagalan
**Validates: Requirements 9.3**

Property 28: Feedback untuk partial success
*For any* import yang sebagian berhasil, sistem harus menampilkan jumlah record yang berhasil dan yang gagal
**Validates: Requirements 9.4**

Property 29: Parsing paste data dengan multiple delimiters
*For any* data yang dipaste (dari Excel atau CSV), sistem harus memparse data dengan delimiter yang sesuai (tab, koma, atau semicolon)
**Validates: Requirements 10.2, 10.3**

Property 30: Consistency paste dengan upload
*For any* data yang valid, hasil parsing dan processing dari paste harus sama dengan upload file
**Validates: Requirements 10.4, 10.5**

## Error Handling

### 1. File Upload Errors
- **Scenario**: File tidak valid atau tidak bisa dibaca
- **Handling**: Validasi file type dan size, try-catch untuk file reading
- **User Feedback**: Alert dengan pesan error yang jelas

### 2. CSV Parsing Errors
- **Scenario**: Format CSV tidak valid atau delimiter tidak dikenali
- **Handling**: Try multiple delimiters, detect format automatically
- **User Feedback**: Pesan error dengan contoh format yang benar

### 3. Data Validation Errors
- **Scenario**: NIK tidak ditemukan, jumlah negatif, field kosong
- **Handling**: Validasi setiap row, collect all errors
- **User Feedback**: Preview table dengan highlight error rows dan pesan spesifik

### 4. Duplicate NIK Handling
- **Scenario**: NIK yang sama muncul multiple kali dalam upload
- **Handling**: Keep last occurrence, atau tanya user untuk konfirmasi
- **User Feedback**: Warning message dengan list duplicate NIKs

### 5. COA Integration Errors
- **Scenario**: Akun simpanan tidak ditemukan di COA
- **Handling**: Create akun otomatis jika belum ada
- **User Feedback**: Info message bahwa akun dibuat otomatis

### 6. Balance Calculation Errors
- **Scenario**: Total simpanan tidak match dengan COA
- **Handling**: Recalculate dan sync data
- **User Feedback**: Warning jika ada discrepancy

## Testing Strategy

### Unit Testing

Unit tests akan fokus pada fungsi-fungsi individual:

1. **parseCSVSimpanan()** - Test dengan berbagai format CSV (comma, semicolon, tab, BOM, different line endings)
2. **validateSimpananData()** - Test dengan data valid dan invalid (NIK tidak ada, jumlah negatif, field kosong)
3. **mergeSimpananData()** - Test merge mode dan replace mode, handling duplicates
4. **updateCOAFromSimpanan()** - Test update COA dengan berbagai kondisi data
5. **downloadTemplateSimpanan()** - Test generate template dengan header dan example data yang benar

### Property-Based Testing

Property-based testing akan menggunakan **fast-check** library untuk JavaScript. Setiap property test akan dijalankan minimal 100 iterasi dengan data random.

**Testing Framework**: Jest + fast-check

**Property Test Requirements**:
- Setiap property test harus di-tag dengan format: `**Feature: upload-simpanan-saldo-awal, Property {number}: {property_text}**`
- Setiap correctness property harus diimplementasikan sebagai SATU property-based test
- Minimum 100 iterasi per test

**Generator Strategy**:
- Generate random CSV text dengan berbagai delimiters dan formats
- Generate random simpanan data dengan NIK valid dan invalid
- Generate edge cases (empty CSV, single row, large datasets, special characters)
- Generate random anggota data untuk testing referential integrity

### Integration Testing

1. **End-to-end upload flow**: Test complete user journey dari klik upload sampai data tersimpan
2. **COA integration**: Test bahwa data simpanan terintegrasi dengan COA dengan benar
3. **Balance calculation**: Test bahwa persamaan akuntansi tetap balance setelah upload
4. **Wizard navigation**: Test bahwa data persist ketika navigasi antar steps

### Manual Testing Checklist

1. Test upload file CSV dari berbagai sources (Excel, Google Sheets, text editor)
2. Test paste data dari Excel dan Google Sheets
3. Test dengan data dalam jumlah besar (100+ anggota)
4. Test error handling dengan berbagai jenis error
5. Test UI responsiveness dan user experience
6. Test browser compatibility (Chrome, Firefox, Safari, Edge)

## Implementation Notes

### Security Considerations

1. **Client-Side Only**: Semua processing dilakukan di client-side, tidak ada data yang dikirim ke server
2. **Data Validation**: Strict validation untuk mencegah data corruption
3. **No Code Injection**: Sanitize input untuk mencegah XSS atau code injection

### Performance Considerations

1. **Large File Handling**: Use streaming atau chunking untuk file besar
2. **Efficient Parsing**: Optimize CSV parsing untuk performance
3. **Debounce UI Updates**: Debounce re-render untuk menghindari lag

### Browser Compatibility

- Target: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- File API: Fully supported
- FileReader API: Fully supported
- Clipboard API: Fully supported for paste functionality

### Future Enhancements

1. **Excel File Support**: Support upload file .xlsx langsung tanpa convert ke CSV
2. **Drag and Drop**: Support drag and drop file untuk upload
3. **Bulk Edit**: Allow bulk edit data dalam preview table sebelum import
4. **Import History**: Track history of imports dengan undo functionality
5. **Data Mapping**: Allow user untuk map kolom CSV ke field sistem jika header berbeda
6. **Validation Rules**: Allow custom validation rules per koperasi
7. **Auto-detect Encoding**: Detect file encoding automatically (UTF-8, ISO-8859-1, etc.)
