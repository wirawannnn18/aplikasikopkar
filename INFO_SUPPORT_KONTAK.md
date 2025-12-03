# Info Team Support & Kontak Person Pengembang

## Deskripsi
Fitur ini menampilkan informasi lengkap tentang aplikasi, team support, dan kontak person pengembang yang dapat dihubungi untuk bantuan teknis atau pertanyaan.

## Lokasi Akses

### 1. **Halaman Login**
- Link "Hubungi Kami" di bagian bawah halaman login
- Klik untuk membuka modal info support

### 2. **Menu Sidebar**
- Menu "Tentang Aplikasi" tersedia untuk semua role (Administrator, Keuangan, Kasir)
- Menampilkan halaman lengkap dengan info aplikasi dan kontak support

### 3. **Navbar (Setelah Login)**
- Tombol "Support" di navbar (desktop)
- Klik untuk membuka modal info support

## Informasi yang Ditampilkan

### Halaman "Tentang Aplikasi"

#### Informasi Aplikasi:
- Logo dan nama aplikasi
- Versi aplikasi (v1.0.0)
- Daftar fitur utama:
  - Manajemen Anggota & Departemen
  - Simpanan (Pokok, Wajib, Sukarela)
  - Pinjaman & Angsuran
  - Point of Sales (POS)
  - Manajemen Inventory
  - Akuntansi Double Entry
  - Laporan Keuangan Lengkap
  - Perhitungan SHU Otomatis
  - Aktivasi & Cetak Kartu Anggota
  - Multi-User & Role Management
- Teknologi yang digunakan

#### Team Support:
- **Perusahaan:** CV Bangun Bina Pratama
- **Contact Person:** Arya Wirawan (Lead Developer)

#### Kontak:
- **Telepon:** 0815-2260-0227
- **WhatsApp:** 0815-2260-0227
- **Email:** support@koperasi-app.com
- **Website:** www.koperasi-app.com

#### Jam Operasional:
- Senin - Jumat: 08:00 - 17:00 WIB
- Sabtu: 08:00 - 12:00 WIB

### Modal Support Info

Modal yang muncul saat klik "Hubungi Kami" atau tombol "Support" menampilkan:
- Info perusahaan dan contact person
- Daftar kontak yang dapat diklik langsung:
  - Telepon (langsung dial)
  - WhatsApp (buka chat)
  - Email (buka email client)
  - Website (buka browser)
- Jam operasional
- Tombol "Chat WhatsApp" untuk langsung chat

## Cara Penggunaan

### Dari Halaman Login:
1. Scroll ke bawah halaman login
2. Klik link "Hubungi Kami" berwarna kuning
3. Modal info support akan muncul
4. Pilih metode kontak yang diinginkan

### Dari Menu Sidebar:
1. Login ke aplikasi
2. Klik menu "Tentang Aplikasi" di sidebar
3. Halaman lengkap akan ditampilkan
4. Lihat info aplikasi dan kontak support
5. Klik tombol "Chat WhatsApp" atau "Kirim Email" untuk kontak langsung

### Dari Navbar:
1. Login ke aplikasi
2. Klik tombol "Support" di navbar (desktop)
3. Modal info support akan muncul
4. Pilih metode kontak yang diinginkan

## Fitur Interaktif

### 1. **Direct Call**
- Klik nomor telepon untuk langsung melakukan panggilan
- Otomatis membuka aplikasi telepon di device

### 2. **WhatsApp Chat**
- Klik link WhatsApp atau tombol "Chat WhatsApp"
- Otomatis membuka WhatsApp dengan pesan template:
  - "Halo, saya butuh bantuan dengan Aplikasi Koperasi"

### 3. **Email**
- Klik email atau tombol "Kirim Email"
- Otomatis membuka email client dengan:
  - To: support@koperasi-app.com
  - Subject: Bantuan Aplikasi Koperasi

### 4. **Website**
- Klik link website
- Membuka website di tab baru

## Customisasi

Untuk mengubah informasi kontak, edit di file `js/auth.js`:

### Fungsi `renderTentangAplikasi()`:
```javascript
// Ubah informasi berikut:
- Nama Perusahaan: CV Bangun Bina Pratama
- Contact Person: Arya Wirawan
- Nomor Telepon/WhatsApp: 0815-2260-0227
- Email: support@koperasi-app.com
- Website: www.koperasi-app.com
- Jam Operasional
```

### Fungsi `showSupportInfo()`:
```javascript
// Ubah informasi yang sama di modal
```

### Template WhatsApp:
```javascript
// URL WhatsApp saat ini:
'https://wa.me/62815226002227?text=Halo,%20saya%20butuh%20bantuan%20dengan%20Aplikasi%20Koperasi'
```

## Contoh Penggunaan

### Skenario 1: User Lupa Password
1. User di halaman login
2. Klik "Hubungi Kami"
3. Klik "Chat WhatsApp" (0815-2260-0227)
4. Kirim pesan: "Halo, saya lupa password untuk akun saya"

### Skenario 2: Admin Butuh Bantuan Fitur
1. Admin login ke aplikasi
2. Klik menu "Tentang Aplikasi"
3. Lihat kontak support
4. Klik "Kirim Email"
5. Tulis pertanyaan di email

### Skenario 3: Kasir Mengalami Error
1. Kasir login ke aplikasi
2. Klik tombol "Support" di navbar
3. Klik nomor telepon untuk langsung call
4. Jelaskan masalah yang dialami

## Manfaat

1. **Akses Mudah**
   - Kontak support tersedia di berbagai lokasi
   - Tidak perlu mencari kontak di tempat lain

2. **Interaktif**
   - Klik langsung untuk call, chat, atau email
   - Tidak perlu copy-paste nomor/email

3. **Informasi Lengkap**
   - Jam operasional jelas
   - Multiple channel komunikasi
   - Info perusahaan dan contact person

4. **Professional**
   - Tampilan menarik dan informatif
   - Branding perusahaan jelas
   - Kredibilitas terjaga

5. **User-Friendly**
   - Modal responsive untuk mobile
   - Icon yang jelas
   - Warna yang konsisten dengan tema aplikasi

## Tips

1. **Simpan Kontak**
   - Simpan nomor WhatsApp support di kontak HP
   - Bookmark halaman "Tentang Aplikasi"

2. **Gunakan WhatsApp**
   - Lebih cepat daripada email
   - Bisa kirim screenshot error
   - Real-time communication

3. **Perhatikan Jam Operasional**
   - Hubungi saat jam kerja untuk respon cepat
   - Di luar jam kerja, kirim email atau WA (akan dibalas saat jam kerja)

4. **Jelaskan Masalah dengan Detail**
   - Sebutkan role user (Admin/Keuangan/Kasir)
   - Screenshot error jika ada
   - Langkah-langkah yang sudah dicoba

## File yang Dimodifikasi

1. **index.html**
   - Tambah link "Hubungi Kami" di halaman login
   - Tambah tombol "Support" di navbar

2. **js/auth.js**
   - Fungsi `renderTentangAplikasi()` - halaman lengkap
   - Fungsi `showSupportInfo()` - modal support
   - Tambah menu "Tentang Aplikasi" di semua role
   - Tambah case 'tentang' di renderPage

## Catatan Penting

- **Kontak Support:**
  - Perusahaan: CV Bangun Bina Pratama
  - Contact Person: Arya Wirawan
  - Telepon/WhatsApp: 0815-2260-0227
- **Website URL** harus disesuaikan dengan domain actual
- **Jam operasional** dapat disesuaikan dengan kebijakan perusahaan
- **Pesan WhatsApp template** dapat diubah sesuai kebutuhan
- **Versi aplikasi** harus diupdate saat ada perubahan major

## Future Enhancement

Fitur yang bisa ditambahkan di masa depan:
1. Live chat integration
2. Ticketing system
3. FAQ section
4. Video tutorial
5. Knowledge base
6. Rating & feedback system
7. Multiple language support
8. Social media links
