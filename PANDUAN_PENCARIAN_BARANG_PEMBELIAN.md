# Panduan Pencarian Barang Pembelian

## Daftar Isi
1. [Pengenalan](#pengenalan)
2. [Cara Menggunakan](#cara-menggunakan)
3. [Fitur Pencarian](#fitur-pencarian)
4. [Keyboard Shortcuts](#keyboard-shortcuts)
5. [Tips dan Trik](#tips-dan-trik)
6. [Troubleshooting](#troubleshooting)
7. [FAQ](#faq)

## Pengenalan

Fitur Pencarian Barang Pembelian memungkinkan Anda untuk mencari dan menambahkan barang ke transaksi pembelian dengan mudah, terutama untuk barang yang tidak memiliki barcode atau ketika barcode scanner tidak berfungsi.

### Kapan Menggunakan Fitur Ini?
- Barang tidak memiliki barcode
- Barcode scanner tidak berfungsi atau rusak
- Barcode tidak terbaca dengan baik
- Ingin mencari barang berdasarkan nama atau kategori
- Ingin melihat riwayat pencarian sebelumnya

## Cara Menggunakan

### 1. Membuka Modal Pembelian
1. Login ke aplikasi koperasi
2. Navigasi ke menu **"Pembelian"**
3. Klik tombol **"Input Pembelian"**
4. Modal pembelian akan terbuka

### 2. Menggunakan Pencarian Barang

#### Metode 1: Pencarian Langsung
1. Di bagian **"Item Pembelian"**, temukan kolom pencarian barang
2. Ketik nama barang atau kode barang (minimal 2 karakter)
3. Hasil pencarian akan muncul secara real-time
4. Klik pada barang yang diinginkan untuk menambahkannya

#### Metode 2: Filter Berdasarkan Kategori
1. Pilih kategori dari dropdown **"Filter Kategori"**
2. Ketik nama barang di kolom pencarian
3. Hasil akan difilter berdasarkan kategori yang dipilih
4. Klik pada barang yang diinginkan

#### Metode 3: Menggunakan Riwayat Pencarian
1. Klik pada kolom pencarian (tanpa mengetik)
2. Akan muncul daftar barang yang sering digunakan dan pencarian terakhir
3. Klik pada salah satu item untuk menambahkannya

## Fitur Pencarian

### 🔍 Pencarian Real-time
- Hasil muncul saat Anda mengetik (minimal 2 karakter)
- Pencarian case-insensitive (tidak membedakan huruf besar/kecil)
- Mendukung pencarian partial (sebagian nama)
- Maksimal 10 hasil ditampilkan untuk performa optimal

### 📂 Filter Kategori
- Filter berdasarkan kategori barang
- Kombinasi pencarian nama + kategori
- Opsi "Semua Kategori" untuk pencarian menyeluruh
- Jumlah barang per kategori ditampilkan

### 📊 Informasi Barang Lengkap
Setiap hasil pencarian menampilkan:
- **Nama Barang**: Nama lengkap dengan highlight pencarian
- **Kode Barang**: Kode unik barang
- **Kategori**: Kategori barang
- **Harga**: Harga satuan barang
- **Status Stok**: 
  - ✅ **Stok Normal**: Hijau
  - ⚠️ **Stok Rendah**: Kuning (≤ 10 item)
  - ❌ **Stok Habis**: Merah (0 item)

### 🕒 Riwayat Pencarian
- **Sering Digunakan**: Barang yang paling sering dipilih
- **Pencarian Terakhir**: 5 pencarian terakhir
- Otomatis membersihkan riwayat lama (maksimal 10 item)
- Prioritas barang berdasarkan frekuensi penggunaan

### 📝 Audit Log
Sistem mencatat:
- Setiap pencarian yang dilakukan
- Barang yang dipilih
- Waktu dan user yang melakukan
- Performa pencarian untuk optimasi

## Keyboard Shortcuts

| Shortcut | Fungsi |
|----------|--------|
| `Ctrl + F` | Fokus ke kolom pencarian |
| `↑` `↓` | Navigasi hasil pencarian |
| `Enter` | Pilih barang yang di-highlight |
| `Escape` | Tutup dropdown pencarian |
| `Tab` | Pindah ke field berikutnya |

### Cara Menggunakan Keyboard Navigation:
1. Tekan `Ctrl + F` untuk fokus ke pencarian
2. Ketik nama barang
3. Gunakan `↑` `↓` untuk memilih barang
4. Tekan `Enter` untuk menambahkan barang
5. Tekan `Escape` untuk menutup dropdown

## Tips dan Trik

### 💡 Tips Pencarian Efektif

#### 1. Gunakan Kata Kunci Singkat
```
❌ Buruk: "Laptop Dell Inspiron 15 3000 Series"
✅ Baik: "laptop dell" atau "inspiron"
```

#### 2. Manfaatkan Filter Kategori
- Pilih kategori terlebih dahulu untuk mempersempit hasil
- Berguna saat mencari barang dengan nama umum

#### 3. Gunakan Kode Barang
- Pencarian berdasarkan kode barang lebih akurat
- Cocok untuk barang dengan nama yang mirip

#### 4. Manfaatkan Riwayat
- Barang yang sering dibeli akan muncul di "Sering Digunakan"
- Lebih cepat daripada mengetik ulang

### ⚡ Tips Performa

#### 1. Ketik Minimal 2 Karakter
- Sistem tidak akan mencari jika kurang dari 2 karakter
- Ini untuk menjaga performa aplikasi

#### 2. Gunakan Debouncing
- Sistem menunggu 300ms setelah Anda berhenti mengetik
- Tidak perlu menunggu selesai mengetik untuk melihat hasil

#### 3. Batasan Hasil
- Maksimal 10 hasil ditampilkan
- Jika tidak menemukan barang, coba kata kunci yang lebih spesifik

### 🎯 Tips Workflow

#### 1. Workflow Cepat untuk Barang Favorit
1. Klik kolom pencarian
2. Pilih dari "Sering Digunakan"
3. Langsung ditambahkan ke pembelian

#### 2. Workflow untuk Barang Baru
1. Pilih kategori yang sesuai
2. Ketik sebagian nama barang
3. Pilih dari hasil pencarian

#### 3. Workflow untuk Stok Rendah
- Perhatikan indikator stok (warna kuning/merah)
- Barang stok habis tetap bisa dipilih untuk pembelian

## Troubleshooting

### ❓ Masalah Umum dan Solusi

#### 1. Pencarian Tidak Muncul
**Gejala**: Tidak ada hasil saat mengetik
**Solusi**:
- Pastikan mengetik minimal 2 karakter
- Cek ejaan kata kunci
- Coba kata kunci yang lebih umum
- Pastikan barang ada di inventory

#### 2. Barang Tidak Ditemukan
**Gejala**: Hasil pencarian kosong
**Solusi**:
- Coba pencarian tanpa filter kategori
- Gunakan kata kunci yang lebih pendek
- Cek apakah barang sudah terdaftar di master barang
- Coba cari berdasarkan kode barang

#### 3. Dropdown Tidak Muncul
**Gejala**: Kolom pencarian tidak menampilkan dropdown
**Solusi**:
- Refresh halaman (F5)
- Pastikan JavaScript aktif di browser
- Coba logout dan login kembali
- Bersihkan cache browser

#### 4. Keyboard Shortcut Tidak Berfungsi
**Gejala**: Ctrl+F tidak fokus ke pencarian
**Solusi**:
- Pastikan tidak ada modal lain yang terbuka
- Coba klik di area kosong dulu
- Refresh halaman jika perlu

#### 5. Performa Lambat
**Gejala**: Pencarian membutuhkan waktu lama
**Solusi**:
- Gunakan kata kunci yang lebih spesifik
- Pilih kategori untuk mempersempit pencarian
- Tutup tab browser lain yang tidak perlu
- Restart browser jika perlu

### 🔧 Troubleshooting Lanjutan

#### Jika Masalah Masih Berlanjut:
1. **Cek Console Browser**:
   - Tekan F12 → Console
   - Lihat apakah ada error merah
   - Screenshot error untuk dilaporkan

2. **Cek Data Inventory**:
   - Pastikan barang sudah terdaftar di Master Barang
   - Cek kategori barang sudah benar
   - Pastikan kode barang unik

3. **Hubungi Administrator**:
   - Laporkan error dengan detail
   - Sertakan screenshot jika ada
   - Sebutkan langkah yang sudah dicoba

## FAQ

### ❓ Pertanyaan yang Sering Diajukan

#### Q: Apakah pencarian case-sensitive?
**A**: Tidak, pencarian tidak membedakan huruf besar dan kecil. "laptop" sama dengan "LAPTOP" atau "Laptop".

#### Q: Berapa karakter minimal untuk pencarian?
**A**: Minimal 2 karakter. Ini untuk menjaga performa sistem.

#### Q: Apakah bisa mencari berdasarkan kode barang?
**A**: Ya, sistem akan mencari di nama barang dan kode barang secara bersamaan.

#### Q: Bagaimana jika barang stok habis?
**A**: Barang stok habis tetap bisa dipilih untuk pembelian. Akan ada indikator "Stok Habis" berwarna merah.

#### Q: Apakah riwayat pencarian tersimpan permanen?
**A**: Riwayat tersimpan di browser lokal. Akan hilang jika cache browser dibersihkan atau menggunakan browser/komputer lain.

#### Q: Berapa maksimal hasil pencarian yang ditampilkan?
**A**: Maksimal 10 hasil untuk menjaga performa. Jika tidak menemukan barang, gunakan kata kunci yang lebih spesifik.

#### Q: Apakah bisa mencari dengan spasi atau karakter khusus?
**A**: Ya, sistem mendukung pencarian dengan spasi dan karakter khusus. Contoh: "mouse wireless" atau "printer A4".

#### Q: Bagaimana cara menghapus riwayat pencarian?
**A**: Riwayat akan otomatis terhapus jika melebihi 10 item. Atau bisa dihapus dengan membersihkan cache browser.

#### Q: Apakah pencarian bekerja offline?
**A**: Ya, pencarian bekerja dengan data yang sudah tersimpan di browser. Tidak memerlukan koneksi internet.

#### Q: Bagaimana jika ada barang dengan nama yang sama?
**A**: Sistem akan menampilkan semua barang dengan nama serupa. Gunakan kode barang atau kategori untuk membedakan.

#### Q: Apakah ada batasan jumlah barang yang bisa dicari?
**A**: Tidak ada batasan khusus, tapi performa optimal untuk inventory hingga 1000 barang.

---

## 📞 Bantuan Lebih Lanjut

Jika mengalami masalah yang tidak tercakup dalam panduan ini:

1. **Hubungi Administrator Sistem**
2. **Laporkan Bug** melalui menu bantuan
3. **Dokumentasikan Error** dengan screenshot
4. **Coba Solusi Dasar** (refresh, logout-login) terlebih dahulu

---

**Versi Panduan**: 1.0  
**Terakhir Diperbarui**: Desember 2024  
**Berlaku untuk**: Aplikasi Koperasi v1.0+