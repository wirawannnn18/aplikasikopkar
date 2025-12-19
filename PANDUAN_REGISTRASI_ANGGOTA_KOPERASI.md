# Panduan Registrasi Anggota Koperasi

## Pengantar

Panduan ini menjelaskan cara menggunakan fitur registrasi anggota baru di sistem koperasi karyawan. Fitur ini memungkinkan administrator untuk mendaftarkan anggota baru dengan mudah dan aman.

## Akses Menu

### Siapa yang Bisa Mengakses?
- **Super Admin**: Akses penuh
- **Administrator**: Akses penuh

### Cara Mengakses:
1. Login ke sistem dengan akun admin
2. Pilih menu **"Registrasi Anggota"** di sidebar
3. Form registrasi akan terbuka

## Langkah-langkah Registrasi

### 1. Informasi Akun

**Username** (Wajib)
- Minimal 3 karakter
- Harus unik (belum pernah digunakan)
- Akan digunakan untuk login ke sistem

**Email** (Wajib)
- Format email yang valid
- Contoh: nama@perusahaan.com
- Digunakan untuk notifikasi sistem

**Password** (Wajib)
- Minimal 8 karakter
- Harus mengandung:
  - Huruf besar (A-Z)
  - Huruf kecil (a-z)
  - Angka (0-9)
  - Simbol (!@#$%^&*)
- Indikator kekuatan password akan muncul

**Konfirmasi Password** (Wajib)
- Harus sama dengan password di atas

### 2. Informasi Pribadi

**Nama Lengkap** (Wajib)
- Nama lengkap sesuai KTP
- Akan digunakan di seluruh sistem

**NIK** (Wajib)
- 16 digit angka sesuai KTP
- Harus unik (belum terdaftar)
- Contoh: 1234567890123456

**No. Telepon** (Wajib)
- Nomor telepon aktif
- Format: 08xxxxxxxxxx atau +62xxxxxxxxx

**Departemen** (Wajib)
- Pilih departemen dari dropdown
- Jika belum ada, tambahkan di Master Departemen terlebih dahulu

**Alamat** (Wajib)
- Alamat lengkap sesuai KTP
- Minimal 10 karakter

**Tanggal Lahir** (Wajib)
- Format: DD/MM/YYYY
- Gunakan date picker

**Tanggal Bergabung** (Wajib)
- Tanggal mulai menjadi anggota koperasi
- Default: hari ini
- Tidak boleh di masa depan

### 3. Persetujuan

**Syarat dan Ketentuan** (Wajib)
- Centang kotak persetujuan
- Klik link untuk membaca syarat dan ketentuan
- Harus disetujui untuk melanjutkan

## Tips Pengisian Form

### ✅ Do's (Yang Harus Dilakukan)
- Pastikan semua data akurat dan sesuai dokumen resmi
- Gunakan password yang kuat dan mudah diingat
- Pilih departemen yang sesuai dengan posisi anggota
- Periksa kembali NIK sebelum submit (tidak bisa diubah)
- Simpan informasi login untuk diberikan ke anggota

### ❌ Don'ts (Yang Tidak Boleh)
- Jangan gunakan data palsu atau tidak akurat
- Jangan gunakan password yang mudah ditebak
- Jangan mendaftar anggota yang sudah keluar
- Jangan lupa memberikan informasi login ke anggota

## Validasi Otomatis

Sistem akan otomatis memvalidasi:
- **Username**: Keunikan dan format
- **Email**: Format email yang benar
- **Password**: Kekuatan dan keamanan
- **NIK**: Format 16 digit dan keunikan
- **Departemen**: Ketersediaan dan status aktif

## Setelah Registrasi Berhasil

### Yang Terjadi Otomatis:
1. **Akun Supabase**: Dibuat dengan role 'anggota'
2. **Kode Anggota**: Digenerate otomatis (AGT-YYNNNNN)
3. **Data Anggota**: Disimpan di sistem
4. **Status**: Diset sebagai 'Aktif'
5. **Audit Log**: Dicatat untuk tracking

### Yang Harus Dilakukan Admin:
1. **Informasikan ke Anggota**:
   - Username dan password untuk login
   - Kode anggota yang digenerate
   - Cara mengakses sistem

2. **Setup Awal** (Opsional):
   - Atur simpanan pokok jika diperlukan
   - Aktivasi kartu anggota
   - Setup limit kredit

## Troubleshooting

### Masalah Umum dan Solusi

**"Username sudah digunakan"**
- Coba username lain
- Periksa apakah anggota sudah terdaftar sebelumnya

**"NIK sudah terdaftar"**
- Periksa data anggota existing
- Pastikan NIK benar dan belum pernah didaftarkan

**"Password tidak memenuhi persyaratan"**
- Ikuti panduan password yang ditampilkan
- Pastikan ada kombinasi huruf, angka, dan simbol

**"Departemen tidak tersedia"**
- Tambahkan departemen di Master Departemen terlebih dahulu
- Refresh halaman dan coba lagi

**"Form tidak bisa disubmit"**
- Periksa semua field wajib sudah diisi
- Pastikan checkbox persetujuan sudah dicentang
- Periksa koneksi internet

## Keamanan Data

### Perlindungan Data:
- **Password**: Dienkripsi dengan algoritma aman
- **Data Pribadi**: Disimpan dengan enkripsi
- **Akses**: Dibatasi hanya untuk admin
- **Audit**: Semua aktivitas tercatat

### Best Practices:
- Jangan bagikan informasi login anggota
- Gunakan komputer yang aman untuk registrasi
- Logout setelah selesai menggunakan sistem
- Laporkan aktivitas mencurigakan

## FAQ (Frequently Asked Questions)

**Q: Bisakah anggota mendaftar sendiri?**
A: Tidak, registrasi hanya bisa dilakukan oleh admin untuk menjaga keamanan dan validitas data.

**Q: Bagaimana jika ada kesalahan data setelah registrasi?**
A: Data bisa diubah melalui menu Master Anggota, kecuali NIK yang tidak bisa diubah.

**Q: Apakah bisa mendaftar anggota tanpa email?**
A: Tidak, email wajib untuk sistem notifikasi dan keamanan akun.

**Q: Bagaimana cara reset password anggota?**
A: Melalui menu Manajemen User, admin bisa reset password anggota.

**Q: Apakah data anggota aman?**
A: Ya, sistem menggunakan enkripsi dan keamanan tingkat enterprise.

## Kontak Support

Jika mengalami masalah atau butuh bantuan:
- **Email**: support@koperasi.com
- **Telepon**: (021) 1234-5678
- **WhatsApp**: +62 812-3456-7890

---

*Panduan ini berlaku untuk versi sistem terbaru. Untuk update panduan, silakan hubungi tim IT.*