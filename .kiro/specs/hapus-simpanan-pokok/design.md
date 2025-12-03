# Design Document - Hapus Data Simpanan Pokok

## Overview

Fitur hapus data simpanan pokok memungkinkan admin untuk menghapus data simpanan pokok baik secara individual maupun massal. Fitur ini terintegrasi dengan sistem simpanan yang sudah ada dan menggunakan localStorage sebagai mekanisme penyimpanan. Design ini fokus pada keamanan, user experience, dan integritas data.

## Architecture

Sistem menggunakan arsitektur client-side dengan pola MVC sederhana:

- **Model**: Data simpanan pokok disimpan di localStorage dengan key `simpananPokok` sebagai array JSON
- **View**: Dua antarmuka - tabel simpanan pokok di menu utama dan halaman utility terpisah untuk penghapusan massal
- **Controller**: Fungsi JavaScript yang mengelola operasi CRUD dan interaksi dengan localStorage

### Komponen Utama

1. **Menu Simpanan Pokok (index.html + js/simpanan.js)**
   - Menampilkan tabel data simpanan pokok
   - Tombol hapus individual per baris
   - Fungsi `deleteSimpananPokok(id)`

2. **Halaman Utility (hapus_simpanan_pokok.html)**
   - Standalone page untuk penghapusan massal
   - Menampilkan jumlah data
   - Konfirmasi ganda
   - Fungsi `hapusSimpananPokok()`

## Components and Interfaces

### 1. Data Model

```javascript
// Struktur data simpanan pokok di localStorage
{
  id: string,           // UUID unik
  anggotaId: string,    // Referensi ke anggota
  jumlah: number,       // Jumlah simpanan dalam rupiah
  tanggal: string       // Format ISO date (YYYY-MM-DD)
}
```

### 2. LocalStorage Interface

```javascript
// Key: 'simpananPokok'
// Value: JSON string dari array simpanan pokok
localStorage.getItem('simpananPokok') // Returns: string | null
localStorage.setItem('simpananPokok', JSON.stringify(array))
localStorage.removeItem('simpananPokok')
```

### 3. Function Interfaces

#### deleteSimpananPokok(id)
```javascript
/**
 * Menghapus satu data simpanan pokok berdasarkan ID
 * @param {string} id - ID unik simpanan pokok
 * @returns {void}
 */
function deleteSimpananPokok(id)
```

#### hapusSimpananPokok()
```javascript
/**
 * Menghapus semua data simpanan pokok dengan konfirmasi ganda
 * @returns {void}
 */
function hapusSimpananPokok()
```

#### hitungData()
```javascript
/**
 * Menghitung jumlah data simpanan pokok
 * @returns {number} Jumlah data
 */
function hitungData()
```

#### refreshCount()
```javascript
/**
 * Memperbarui tampilan jumlah data dan status tombol
 * @returns {void}
 */
function refreshCount()
```

## Data Models

### Simpanan Pokok Array
- Disimpan di localStorage dengan key `'simpananPokok'`
- Format: Array of objects
- Setiap object memiliki: id, anggotaId, jumlah, tanggal

### State Management
- Data state dikelola melalui localStorage
- Setiap perubahan langsung di-persist ke localStorage
- UI di-render ulang setelah setiap operasi

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptance Criteria Testing Prework

1.1 WHEN admin mengklik tombol hapus pada baris data simpanan pokok THEN Sistem SHALL menampilkan dialog konfirmasi penghapusan
  Thoughts: Ini adalah interaksi UI yang spesifik - ketika tombol diklik, dialog harus muncul. Ini bisa ditest sebagai property untuk semua data simpanan pokok yang valid.
  Testable: yes - property

1.2 WHEN admin mengkonfirmasi penghapusan THEN Sistem SHALL menghapus data simpanan pokok dari localStorage dengan key 'simpananPokok'
  Thoughts: Ini adalah rule yang berlaku untuk semua data - setelah konfirmasi, data harus terhapus dari localStorage. Kita bisa generate random data, hapus, lalu verifikasi tidak ada lagi.
  Testable: yes - property

1.3 WHEN data simpanan pokok berhasil dihapus THEN Sistem SHALL memperbarui tampilan tabel simpanan pokok tanpa data yang dihapus
  Thoughts: Ini tentang UI update setelah penghapusan. Kita bisa test bahwa setelah hapus, render ulang tidak menampilkan data yang dihapus.
  Testable: yes - property

1.4 WHEN data simpanan pokok berhasil dihapus THEN Sistem SHALL menampilkan notifikasi sukses kepada admin
  Thoughts: Ini adalah UI feedback yang harus selalu muncul setelah penghapusan sukses. Bisa ditest sebagai property.
  Testable: yes - property

1.5 WHEN admin membatalkan konfirmasi penghapusan THEN Sistem SHALL membatalkan operasi penghapusan dan mempertahankan data yang ada
  Thoughts: Ini adalah invariant - jika dibatalkan, data harus tetap sama. Kita bisa test dengan membandingkan state sebelum dan sesudah pembatalan.
  Testable: yes - property

2.1 WHEN admin mengakses fitur hapus semua data simpanan pokok THEN Sistem SHALL menampilkan jumlah total data simpanan pokok yang akan dihapus
  Thoughts: Ini adalah property tentang display - jumlah yang ditampilkan harus sama dengan jumlah actual data di localStorage.
  Testable: yes - property

2.2 WHEN admin meminta penghapusan semua data THEN Sistem SHALL menampilkan konfirmasi pertama dengan peringatan bahwa data tidak dapat dikembalikan
  Thoughts: Ini adalah UI requirement yang harus selalu terjadi. Bisa ditest sebagai property.
  Testable: yes - property

2.3 WHEN admin mengkonfirmasi penghapusan pertama THEN Sistem SHALL menampilkan konfirmasi kedua untuk keamanan tambahan
  Thoughts: Ini adalah flow requirement - setelah konfirmasi pertama, harus ada konfirmasi kedua. Bisa ditest sebagai property.
  Testable: yes - property

2.4 WHEN admin mengkonfirmasi penghapusan kedua THEN Sistem SHALL menghapus semua data dari localStorage dengan key 'simpananPokok'
  Thoughts: Ini adalah property tentang penghapusan massal - setelah konfirmasi kedua, semua data harus hilang.
  Testable: yes - property

2.5 WHEN semua data berhasil dihapus THEN Sistem SHALL menampilkan pesan sukses dan memperbarui tampilan dengan data kosong
  Thoughts: Ini adalah property tentang UI state setelah penghapusan massal - tampilan harus kosong dan ada pesan sukses.
  Testable: yes - property

3.1 WHEN dialog konfirmasi ditampilkan THEN Sistem SHALL menampilkan pesan yang jelas tentang konsekuensi penghapusan
  Thoughts: Ini tentang konten dialog - harus ada pesan warning. Bisa ditest dengan memeriksa konten dialog.
  Testable: yes - property

3.2 WHEN konfirmasi penghapusan massal ditampilkan THEN Sistem SHALL menampilkan jumlah data yang akan dihapus
  Thoughts: Ini adalah property tentang informasi yang ditampilkan - jumlah harus akurat.
  Testable: yes - property

3.3 WHEN konfirmasi ditampilkan THEN Sistem SHALL menyediakan opsi untuk membatalkan operasi penghapusan
  Thoughts: Ini adalah UI requirement - dialog harus punya opsi cancel. Bisa ditest dengan memeriksa keberadaan tombol/opsi cancel.
  Testable: yes - property

3.4 WHEN penghapusan massal diminta THEN Sistem SHALL meminta dua kali konfirmasi untuk mencegah penghapusan tidak disengaja
  Thoughts: Ini adalah flow requirement - harus ada 2 konfirmasi. Bisa ditest dengan menghitung jumlah konfirmasi.
  Testable: yes - property

3.5 WHEN tidak ada data untuk dihapus THEN Sistem SHALL menonaktifkan tombol hapus dan menampilkan pesan informasi
  Thoughts: Ini adalah edge case - ketika data kosong, tombol harus disabled. Bisa ditest sebagai property.
  Testable: yes - edge case

4.1 WHEN data simpanan pokok dihapus THEN Sistem SHALL menghapus data dari array simpananPokok di localStorage
  Thoughts: Ini adalah core functionality - data harus benar-benar terhapus dari array. Bisa ditest dengan memeriksa array setelah penghapusan.
  Testable: yes - property

4.2 WHEN data dihapus THEN Sistem SHALL memperbarui localStorage dengan array yang telah difilter
  Thoughts: Ini adalah property tentang persistence - localStorage harus diupdate dengan array baru.
  Testable: yes - property

4.3 WHEN halaman di-refresh setelah penghapusan THEN Sistem SHALL menampilkan data tanpa item yang telah dihapus
  Thoughts: Ini adalah persistence test - setelah refresh, data yang dihapus tidak boleh muncul lagi. Ini adalah property penting.
  Testable: yes - property

4.4 WHEN semua data dihapus THEN Sistem SHALL menyimpan array kosong ke localStorage
  Thoughts: Ini adalah edge case untuk penghapusan massal - localStorage harus berisi array kosong, bukan null atau undefined.
  Testable: yes - property

4.5 WHEN data dihapus THEN Sistem SHALL mempertahankan data anggota dan jenis simpanan lainnya tetap utuh
  Thoughts: Ini adalah isolation property - penghapusan simpanan pokok tidak boleh mempengaruhi data lain. Sangat penting untuk integritas data.
  Testable: yes - property

5.1 WHEN admin membuka halaman hapus_simpanan_pokok.html THEN Sistem SHALL menampilkan jumlah data simpanan pokok saat ini
  Thoughts: Ini adalah property tentang initial load - jumlah yang ditampilkan harus akurat saat halaman dibuka.
  Testable: yes - property

5.2 WHEN halaman utility dibuka THEN Sistem SHALL menampilkan tombol untuk menghapus semua data simpanan pokok
  Thoughts: Ini adalah UI requirement - tombol harus ada. Bisa ditest dengan memeriksa keberadaan elemen.
  Testable: yes - example

5.3 WHEN halaman utility dibuka THEN Sistem SHALL menampilkan tombol untuk refresh jumlah data
  Thoughts: Ini adalah UI requirement - tombol refresh harus ada.
  Testable: yes - example

5.4 WHEN halaman utility dibuka THEN Sistem SHALL menampilkan link untuk kembali ke aplikasi utama
  Thoughts: Ini adalah UI requirement - link harus ada.
  Testable: yes - example

5.5 WHEN tidak ada data simpanan pokok THEN Sistem SHALL menonaktifkan tombol hapus dan menampilkan pesan informasi
  Thoughts: Ini adalah edge case yang sama dengan 3.5 - tombol harus disabled ketika tidak ada data.
  Testable: yes - edge case

6.1 WHEN halaman utility dibuka THEN Sistem SHALL menghitung dan menampilkan jumlah data simpanan pokok dari localStorage
  Thoughts: Ini adalah property tentang akurasi perhitungan - jumlah yang ditampilkan harus sama dengan jumlah actual.
  Testable: yes - property

6.2 WHEN tombol refresh diklik THEN Sistem SHALL memperbarui jumlah data yang ditampilkan
  Thoughts: Ini adalah property tentang refresh functionality - setelah refresh, jumlah harus update sesuai data terbaru.
  Testable: yes - property

6.3 WHEN data berhasil dihapus THEN Sistem SHALL memperbarui jumlah data menjadi nol
  Thoughts: Ini adalah property tentang UI update setelah penghapusan massal - counter harus jadi 0.
  Testable: yes - property

6.4 WHEN jumlah data adalah nol THEN Sistem SHALL menampilkan pesan bahwa tidak ada data untuk dihapus
  Thoughts: Ini adalah edge case - ketika data kosong, harus ada pesan informatif.
  Testable: yes - edge case

6.5 WHEN terjadi error saat menghitung data THEN Sistem SHALL menampilkan pesan error yang informatif
  Thoughts: Ini adalah error handling - ketika terjadi error, harus ada feedback yang jelas.
  Testable: yes - property

7.1 WHEN halaman utility ditampilkan THEN Sistem SHALL menggunakan warna dan ikon yang menunjukkan tingkat bahaya operasi
  Thoughts: Ini adalah UI/UX requirement tentang visual design. Sulit untuk ditest secara otomatis karena subjektif.
  Testable: no

7.2 WHEN tombol hapus ditampilkan THEN Sistem SHALL menggunakan warna merah untuk menunjukkan operasi berbahaya
  Thoughts: Ini adalah UI requirement yang spesifik - tombol harus merah. Bisa ditest dengan memeriksa CSS class atau style.
  Testable: yes - example

7.3 WHEN pesan sukses ditampilkan THEN Sistem SHALL menggunakan warna hijau dan ikon centang
  Thoughts: Ini adalah UI requirement - pesan sukses harus hijau dengan ikon. Bisa ditest dengan memeriksa class/style.
  Testable: yes - example

7.4 WHEN peringatan ditampilkan THEN Sistem SHALL menggunakan warna kuning dan ikon peringatan
  Thoughts: Ini adalah UI requirement - peringatan harus kuning. Bisa ditest dengan memeriksa class/style.
  Testable: yes - example

7.5 WHEN halaman utility ditampilkan THEN Sistem SHALL menampilkan informasi tambahan tentang dampak penghapusan
  Thoughts: Ini adalah UI requirement - harus ada informasi tambahan. Bisa ditest dengan memeriksa keberadaan elemen informasi.
  Testable: yes - example

### Property Reflection

Setelah menganalisis semua acceptance criteria, saya mengidentifikasi beberapa redundansi:

1. **Property 3.5 dan 5.5** adalah duplikat - keduanya tentang menonaktifkan tombol ketika tidak ada data
2. **Property 1.2, 4.1, dan 4.2** overlap - semuanya tentang penghapusan data dari localStorage
3. **Property 2.1, 3.2, dan 6.1** overlap - semuanya tentang menampilkan jumlah data yang akurat
4. **Property 1.3, 2.5, dan 6.3** overlap - semuanya tentang update UI setelah penghapusan

Saya akan mengkonsolidasikan properties ini untuk menghilangkan redundansi.

### Correctness Properties

Property 1: Penghapusan individual memerlukan konfirmasi
*For any* data simpanan pokok yang valid, ketika tombol hapus diklik, sistem harus menampilkan dialog konfirmasi sebelum melakukan penghapusan
**Validates: Requirements 1.1**

Property 2: Data terhapus dari localStorage setelah konfirmasi
*For any* data simpanan pokok yang valid, setelah admin mengkonfirmasi penghapusan, data tersebut harus tidak ada lagi dalam array simpananPokok di localStorage
**Validates: Requirements 1.2, 4.1, 4.2**

Property 3: UI diperbarui setelah penghapusan
*For any* data simpanan pokok yang dihapus, tampilan tabel harus diperbarui dan tidak menampilkan data yang telah dihapus
**Validates: Requirements 1.3, 2.5, 6.3**

Property 4: Notifikasi sukses ditampilkan setelah penghapusan
*For any* operasi penghapusan yang berhasil, sistem harus menampilkan notifikasi sukses kepada admin
**Validates: Requirements 1.4**

Property 5: Pembatalan mempertahankan data
*For any* data simpanan pokok, jika admin membatalkan konfirmasi penghapusan, data harus tetap ada di localStorage tanpa perubahan
**Validates: Requirements 1.5**

Property 6: Jumlah data ditampilkan dengan akurat
*For any* state aplikasi, jumlah data simpanan pokok yang ditampilkan harus sama dengan jumlah actual item dalam array simpananPokok di localStorage
**Validates: Requirements 2.1, 3.2, 6.1**

Property 7: Penghapusan massal memerlukan konfirmasi ganda
*For any* operasi penghapusan massal, sistem harus menampilkan dua dialog konfirmasi berturut-turut sebelum menghapus data
**Validates: Requirements 2.2, 2.3, 3.4**

Property 8: Semua data terhapus setelah konfirmasi ganda
*For any* state aplikasi dengan data simpanan pokok, setelah admin mengkonfirmasi kedua dialog penghapusan massal, localStorage harus berisi array kosong untuk key 'simpananPokok'
**Validates: Requirements 2.4, 4.4**

Property 9: Dialog konfirmasi berisi informasi yang jelas
*For any* dialog konfirmasi penghapusan, dialog harus berisi pesan tentang konsekuensi penghapusan dan opsi untuk membatalkan
**Validates: Requirements 3.1, 3.3**

Property 10: Tombol hapus disabled ketika tidak ada data
*For any* state aplikasi dimana array simpananPokok kosong, tombol hapus harus dalam keadaan disabled dan menampilkan pesan informasi
**Validates: Requirements 3.5, 5.5**

Property 11: Persistence setelah refresh
*For any* data simpanan pokok yang dihapus, setelah halaman di-refresh, data tersebut tidak boleh muncul kembali dalam tampilan
**Validates: Requirements 4.3**

Property 12: Isolasi data - data lain tidak terpengaruh
*For any* operasi penghapusan simpanan pokok, data anggota dan jenis simpanan lainnya (simpananWajib, simpananSukarela) harus tetap utuh di localStorage
**Validates: Requirements 4.5**

Property 13: Halaman utility menampilkan jumlah data saat load
*For any* pembukaan halaman hapus_simpanan_pokok.html, sistem harus menghitung dan menampilkan jumlah data simpanan pokok dari localStorage
**Validates: Requirements 5.1**

Property 14: Refresh memperbarui jumlah data
*For any* state aplikasi, ketika tombol refresh diklik, jumlah data yang ditampilkan harus diperbarui sesuai dengan data terbaru di localStorage
**Validates: Requirements 6.2**

Property 15: Error handling menampilkan pesan informatif
*For any* error yang terjadi saat menghitung atau menghapus data, sistem harus menampilkan pesan error yang informatif kepada admin
**Validates: Requirements 6.5**

## Error Handling

### 1. LocalStorage Access Errors
- **Scenario**: localStorage tidak tersedia atau penuh
- **Handling**: Try-catch block dengan pesan error yang jelas
- **User Feedback**: Alert dengan instruksi untuk clear browser cache

### 2. Data Corruption
- **Scenario**: Data di localStorage tidak valid (bukan JSON atau struktur salah)
- **Handling**: Validasi data sebelum operasi, fallback ke array kosong
- **User Feedback**: Warning message dan opsi untuk reset data

### 3. Concurrent Modifications
- **Scenario**: Data diubah di tab lain saat operasi penghapusan
- **Handling**: Refresh data sebelum operasi, konfirmasi ulang jika ada perubahan
- **User Feedback**: Notifikasi bahwa data telah berubah

### 4. Empty Data Operations
- **Scenario**: User mencoba hapus ketika tidak ada data
- **Handling**: Disable tombol hapus, tampilkan pesan informatif
- **User Feedback**: Pesan "Tidak ada data untuk dihapus"

### 5. Confirmation Dialog Errors
- **Scenario**: Dialog tidak muncul atau error saat konfirmasi
- **Handling**: Fallback ke confirm() native browser
- **User Feedback**: Standard browser confirmation dialog

## Testing Strategy

### Unit Testing

Unit tests akan fokus pada fungsi-fungsi individual:

1. **hitungData()** - Test dengan berbagai kondisi localStorage (kosong, ada data, data corrupt)
2. **deleteSimpananPokok(id)** - Test penghapusan dengan ID valid dan invalid
3. **hapusSimpananPokok()** - Test penghapusan massal dengan berbagai kondisi
4. **refreshCount()** - Test update UI dengan berbagai state data

### Property-Based Testing

Property-based testing akan menggunakan **fast-check** library untuk JavaScript. Setiap property test akan dijalankan minimal 100 iterasi dengan data random.

**Testing Framework**: Jest + fast-check

**Property Test Requirements**:
- Setiap property test harus di-tag dengan format: `**Feature: hapus-simpanan-pokok, Property {number}: {property_text}**`
- Setiap correctness property harus diimplementasikan sebagai SATU property-based test
- Minimum 100 iterasi per test

**Generator Strategy**:
- Generate random simpanan pokok data dengan struktur valid
- Generate random IDs untuk test penghapusan
- Generate edge cases (empty arrays, single item, large datasets)

### Integration Testing

1. **End-to-end flow**: Test complete user journey dari klik hapus sampai data terhapus
2. **Cross-tab testing**: Test behavior ketika data diubah di multiple tabs
3. **Persistence testing**: Test data persistence setelah refresh

### Manual Testing Checklist

1. Test konfirmasi dialog muncul dengan benar
2. Test visual feedback (colors, icons, messages)
3. Test responsive design di berbagai ukuran layar
4. Test accessibility (keyboard navigation, screen readers)
5. Test browser compatibility (Chrome, Firefox, Safari, Edge)

## Implementation Notes

### Security Considerations

1. **No Server-Side Impact**: Karena menggunakan localStorage, penghapusan hanya affect client-side
2. **Confirmation Required**: Minimal satu konfirmasi untuk individual, dua untuk massal
3. **No Undo**: Data yang dihapus tidak bisa di-restore (kecuali ada backup)

### Performance Considerations

1. **Array Filtering**: Gunakan `filter()` untuk efisiensi
2. **Batch Operations**: Untuk penghapusan massal, satu operasi write ke localStorage
3. **UI Updates**: Minimize re-renders dengan update targeted

### Browser Compatibility

- Target: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- localStorage API: Fully supported
- Bootstrap 5: Fully supported
- ES6 features: Fully supported

### Future Enhancements

1. **Backup before delete**: Auto-backup data sebelum penghapusan massal
2. **Undo functionality**: Temporary storage untuk undo dalam 5 detik
3. **Audit log**: Track siapa menghapus apa dan kapan
4. **Soft delete**: Mark as deleted instead of permanent deletion
5. **Batch selection**: Select multiple items untuk dihapus sekaligus
