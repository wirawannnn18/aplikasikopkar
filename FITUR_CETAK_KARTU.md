# Fitur Cetak Kartu Anggota

## Deskripsi

Fitur ini memungkinkan administrator untuk mencetak kartu anggota koperasi dengan desain profesional. Kartu dicetak dalam ukuran standar ID Card (85.6mm x 53.98mm) dengan tampilan depan dan belakang.

---

## Fitur Kartu

### Tampilan Depan Kartu

**Header:**
- Logo koperasi
- Nama koperasi
- Alamat koperasi

**Badge Status:**
- ✓ AKTIF (hijau) - Kartu aktif
- ⚠ NONAKTIF (kuning) - Kartu nonaktif
- ✗ BLOKIR (merah) - Kartu diblokir

**Foto Anggota:**
- Placeholder foto (icon user)
- Ukuran: 80x100px
- Border emas

**Informasi Anggota:**
- Nama lengkap
- NIK
- Departemen
- Tipe keanggotaan

**Nomor Kartu:**
- Nomor kartu anggota (besar, bold)
- Background transparan dengan border emas
- Letter spacing untuk keterbacaan

**Footer:**
- Tanggal berlaku kartu

### Tampilan Belakang Kartu

**Ketentuan Penggunaan:**
- Kartu milik koperasi
- Tidak dapat dipindahtangankan
- Wajib lapor jika hilang
- Berlaku untuk transaksi
- Wajib ditunjukkan saat transaksi

**Kontak Koperasi:**
- Nomor telepon
- Alamat lengkap

**Tanda Tangan:**
- Area untuk tanda tangan pemegang kartu

**Footer:**
- Copyright koperasi

---

## Desain Kartu

### Ukuran
- **Standar ID Card**: 85.6mm x 53.98mm
- **Orientasi**: Landscape
- **Border Radius**: 10px

### Warna
- **Background**: Gradient hijau (#1b4332 → #2d6a4f → #52b788)
- **Accent**: Emas (#ffd60a)
- **Text**: Putih
- **Border**: Emas

### Efek Visual
- Gradient background
- Box shadow
- Shine animation (shimmer effect)
- Rounded corners
- Border emas pada elemen penting

---

## Cara Penggunaan

### Mencetak Kartu

1. **Masuk ke Menu Aktivasi Kartu**
   - Login sebagai Administrator
   - Klik menu "Aktivasi Kartu"

2. **Pilih Anggota**
   - Lihat daftar anggota
   - Cari anggota yang akan dicetak kartunya

3. **Klik Tombol Cetak**
   - Klik tombol "Cetak" (hijau) pada baris anggota
   - Jendela preview akan terbuka

4. **Preview Kartu**
   - Lihat tampilan depan kartu
   - Scroll ke bawah untuk lihat tampilan belakang
   - Cek semua informasi sudah benar

5. **Print Kartu**
   - Klik tombol "🖨️ Print Kartu" di kanan atas
   - Atau tekan Ctrl+P (Windows) / Cmd+P (Mac)
   - Pilih printer
   - Atur setting print:
     - Paper size: Custom (85.6mm x 53.98mm) atau A4
     - Orientation: Landscape
     - Margins: None
     - Scale: 100%
   - Klik Print

---

## Setting Printer

### Untuk Printer ID Card

**Recommended Settings:**
- Paper: CR80 (85.6mm x 53.98mm)
- Orientation: Landscape
- Quality: Best/High
- Color: Full Color
- Duplex: Manual (untuk cetak bolak-balik)

**Steps:**
1. Print halaman depan
2. Balik kertas
3. Print halaman belakang
4. Potong sesuai garis (jika perlu)

### Untuk Printer Biasa (A4)

**Recommended Settings:**
- Paper: A4
- Orientation: Portrait
- Scale: 100%
- Margins: None

**Steps:**
1. Print pada kertas A4
2. Gunakan kertas kartu (card stock) untuk hasil terbaik
3. Potong sesuai ukuran (85.6mm x 53.98mm)
4. Laminating untuk durabilitas

---

## Tips Cetak Kartu

### ✅ DO (Lakukan)

1. **Gunakan Kertas Berkualitas**
   - Card stock (250-300 gsm)
   - PVC card untuk hasil profesional
   - Kertas glossy untuk hasil mengkilap

2. **Cek Preview Sebelum Print**
   - Pastikan semua data benar
   - Cek status kartu (aktif/nonaktif/blokir)
   - Pastikan logo koperasi muncul

3. **Setting Printer yang Tepat**
   - Pilih quality: Best/High
   - Disable margins
   - Scale: 100% (no scaling)

4. **Laminating**
   - Laminating untuk durabilitas
   - Gunakan laminating pouch ukuran ID card
   - Suhu laminating: 120-130°C

5. **Quality Control**
   - Cek hasil print
   - Pastikan warna sesuai
   - Pastikan text terbaca jelas

### ❌ DON'T (Jangan)

1. **Jangan Gunakan Kertas Tipis**
   - Kertas HVS biasa terlalu tipis
   - Mudah rusak dan tidak tahan lama

2. **Jangan Print dengan Quality Rendah**
   - Text akan blur
   - Warna tidak tajam
   - Terlihat tidak profesional

3. **Jangan Lupa Laminating**
   - Kartu mudah kotor
   - Mudah rusak
   - Tidak tahan lama

4. **Jangan Print Kartu Nonaktif/Blokir**
   - Aktifkan kartu terlebih dahulu
   - Atau pastikan anggota tahu status kartunya

---

## Troubleshooting

### Kartu Terpotong Saat Print

**Penyebab**: Margin printer  
**Solusi**:
1. Set margins ke "None" atau "0"
2. Gunakan "Fit to page" jika perlu
3. Coba printer lain

### Warna Tidak Sesuai

**Penyebab**: Setting printer atau tinta  
**Solusi**:
1. Pilih "Color" bukan "Grayscale"
2. Set quality ke "Best"
3. Cek level tinta printer
4. Kalibrasi printer

### Logo Tidak Muncul

**Penyebab**: Logo belum diupload  
**Solusi**:
1. Upload logo di menu "Data Koperasi"
2. Format: JPG, PNG, GIF
3. Ukuran: Max 2MB
4. Refresh dan print ulang

### Text Terlalu Kecil

**Penyebab**: Scale printer  
**Solusi**:
1. Set scale ke 100%
2. Disable "Shrink to fit"
3. Gunakan paper size yang tepat

### Kartu Tidak Bolak-Balik

**Penyebab**: Printer tidak support duplex  
**Solusi**:
1. Print manual duplex:
   - Print halaman 1 (depan)
   - Balik kertas
   - Print halaman 2 (belakang)
2. Atau print terpisah dan tempel

---

## Spesifikasi Teknis

### Ukuran Kartu
```
Width: 85.6mm (3.370 inches)
Height: 53.98mm (2.125 inches)
Aspect Ratio: 1.586:1
Standard: CR80 (ISO/IEC 7810)
```

### Font
```
Header: Arial, 14px, Bold
Body: Arial, 11px, Regular
Card Number: Arial, 18px, Bold
Footer: Arial, 8-9px, Regular
```

### Colors
```
Primary: #1b4332 (Dark Green)
Secondary: #2d6a4f (Green)
Accent: #ffd60a (Gold)
Text: #ffffff (White)
Background: Linear Gradient
```

### Print Settings
```
Resolution: 300 DPI (minimum)
Color Mode: CMYK or RGB
Format: HTML/CSS
Orientation: Landscape
Duplex: Manual or Auto
```

---

## Integrasi dengan Sistem

### Data yang Digunakan
```javascript
{
    nama: "Nama Anggota",
    nik: "123456",
    noKartu: "KTA001",
    departemen: "Produksi",
    tipeAnggota: "Anggota",
    statusKartu: "aktif",
    tanggalUbahKartu: "2024-01-01T10:00:00.000Z"
}
```

### Data Koperasi
```javascript
{
    nama: "Koperasi Karyawan",
    alamat: "Jl. Contoh No. 123",
    telepon: "021-12345678",
    logo: "data:image/png;base64,..."
}
```

---

## Keamanan Kartu

### Fitur Keamanan

1. **Status Badge**
   - Warna berbeda untuk setiap status
   - Mudah diidentifikasi visual

2. **Nomor Kartu Unik**
   - Setiap anggota punya nomor berbeda
   - Format: KTA001, KTA002, dst

3. **Tanggal Berlaku**
   - Tercantum di footer
   - Untuk validasi masa aktif

4. **Logo Koperasi**
   - Sulit dipalsukan
   - Identitas resmi

### Validasi Kartu

Saat transaksi, kasir harus:
1. ✅ Cek nomor kartu di sistem
2. ✅ Cek status kartu (harus aktif)
3. ✅ Cek foto/identitas pemegang
4. ✅ Cek tanggal berlaku

---

## Biaya Produksi

### Estimasi Biaya per Kartu

**Printer Biasa + Laminating:**
- Kertas card stock: Rp 500
- Tinta printer: Rp 1.000
- Laminating pouch: Rp 1.500
- **Total: Rp 3.000/kartu**

**Printer ID Card:**
- PVC card: Rp 2.000
- Ribbon printer: Rp 3.000
- **Total: Rp 5.000/kartu**

**Outsource:**
- Cetak + laminating: Rp 5.000-10.000/kartu
- Cetak PVC: Rp 10.000-15.000/kartu

---

## Best Practices

### Untuk Administrator

1. **Cek Data Sebelum Print**
   - Pastikan data anggota lengkap
   - Pastikan status kartu aktif
   - Pastikan logo sudah diupload

2. **Batch Printing**
   - Print beberapa kartu sekaligus
   - Lebih efisien waktu dan biaya
   - Gunakan kertas A4 untuk multiple cards

3. **Quality Control**
   - Cek setiap kartu setelah print
   - Pastikan tidak ada kesalahan
   - Simpan kartu reject untuk reprint

4. **Dokumentasi**
   - Catat tanggal cetak
   - Catat jumlah kartu dicetak
   - Simpan file backup

### Untuk Anggota

1. **Jaga Kartu dengan Baik**
   - Simpan di dompet/card holder
   - Jangan dilipat atau ditekuk
   - Hindari dari air dan panas

2. **Lapor Jika Hilang**
   - Segera lapor ke administrator
   - Kartu akan diblokir
   - Minta cetak kartu baru

3. **Tunjukkan Saat Transaksi**
   - Wajib ditunjukkan ke kasir
   - Untuk validasi identitas
   - Untuk pencatatan transaksi

---

## FAQ

**Q: Apakah bisa cetak kartu untuk anggota nonaktif?**  
A: Bisa, tapi sebaiknya aktifkan kartu terlebih dahulu.

**Q: Berapa lama proses cetak kartu?**  
A: Instant (langsung print), tergantung printer.

**Q: Apakah bisa custom desain kartu?**  
A: Saat ini belum, desain fixed. Fitur custom akan ditambahkan nanti.

**Q: Apakah bisa cetak batch (banyak kartu sekaligus)?**  
A: Saat ini satu per satu. Fitur batch printing akan ditambahkan.

**Q: Apakah kartu ada masa berlaku?**  
A: Kartu berlaku selama status anggota aktif.

**Q: Bagaimana jika data anggota berubah?**  
A: Cetak kartu baru dengan data terbaru.

---

## Update Log

**v1.6 - Fitur Cetak Kartu**
- ✅ Added tombol cetak di aktivasi kartu
- ✅ Added desain kartu depan
- ✅ Added desain kartu belakang
- ✅ Added status badge (aktif/nonaktif/blokir)
- ✅ Added logo koperasi
- ✅ Added informasi lengkap anggota
- ✅ Added ketentuan penggunaan
- ✅ Added area tanda tangan
- ✅ Added print-friendly CSS
- ✅ Added shine animation effect
- ✅ Responsive untuk berbagai ukuran printer

---

## Kesimpulan

Fitur Cetak Kartu memberikan kemudahan untuk mencetak kartu anggota dengan desain profesional. Dengan fitur ini:

1. ✅ Kartu terlihat profesional
2. ✅ Mudah dicetak kapan saja
3. ✅ Status kartu terlihat jelas
4. ✅ Informasi lengkap tercantum
5. ✅ Hemat biaya produksi

Kartu anggota yang baik meningkatkan kredibilitas koperasi dan memudahkan proses transaksi!
