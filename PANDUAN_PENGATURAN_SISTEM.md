# Panduan Pengaturan Sistem

## 📋 Daftar Isi
1. [Pengenalan](#pengenalan)
2. [Akses Menu](#akses-menu)
3. [Fitur yang Tersedia](#fitur-yang-tersedia)
4. [Cara Menggunakan](#cara-menggunakan)
5. [Keamanan](#keamanan)
6. [FAQ](#faq)

---

## Pengenalan

**Pengaturan Sistem** adalah halaman khusus untuk Super Admin yang menyediakan akses ke konfigurasi dan pengaturan tingkat sistem. Halaman ini dirancang untuk memberikan kontrol penuh atas aplikasi kepada administrator tertinggi.

### Siapa yang Dapat Mengakses?
- 🔐 **Super Admin ONLY**
- ❌ Administrator, Keuangan, dan Kasir **TIDAK** dapat mengakses

---

## Akses Menu

### Cara Mengakses:

1. **Login sebagai Super Admin**
   ```
   Username: superadmin
   Password: super123
   ```

2. **Klik menu "Pengaturan Sistem"** di sidebar
   - Posisi: Menu kedua (setelah Dashboard)
   - Icon: ⚙️ (gear icon)
   - Label: "Pengaturan Sistem"

3. **Halaman akan terbuka** dengan badge "Super Admin Only"

### Jika Menu Tidak Terlihat:
- ✅ Pastikan Anda login sebagai **Super Admin**
- ✅ Refresh halaman (F5)
- ✅ Logout dan login kembali
- ✅ Clear cache browser

---

## Fitur yang Tersedia

### 1. 📊 Informasi Aplikasi

#### Nama Aplikasi
- **Nilai**: Aplikasi Koperasi Karyawan
- **Status**: Read-only (tidak dapat diubah)
- **Fungsi**: Menampilkan nama resmi aplikasi

#### Versi Aplikasi
- **Nilai**: 1.0.0
- **Status**: Read-only (tidak dapat diubah)
- **Fungsi**: Menampilkan versi aplikasi saat ini

### 2. 💾 Manajemen Data

#### Tombol Backup & Restore
- **Fungsi**: Akses cepat ke halaman Backup & Restore
- **Aksi**: Klik tombol untuk membuka halaman backup
- **Shortcut**: Langsung ke fitur backup database

---

## Cara Menggunakan

### Mengakses Backup & Restore dari Pengaturan Sistem

1. **Buka Pengaturan Sistem**
   - Login sebagai Super Admin
   - Klik menu "Pengaturan Sistem"

2. **Scroll ke bagian "Manajemen Data"**
   - Lihat tombol biru "Buka Backup & Restore"

3. **Klik tombol tersebut**
   - Halaman akan berpindah ke Backup & Restore
   - Anda dapat membuat backup atau restore database

### Melihat Informasi Sistem

1. **Buka Pengaturan Sistem**
2. **Lihat bagian "Pengaturan Umum"**
3. **Informasi yang ditampilkan:**
   - Nama aplikasi
   - Versi aplikasi saat ini

---

## Keamanan

### 🔐 Kontrol Akses

#### Level Akses:
| Role | Lihat Menu | Akses Halaman | Ubah Setting |
|------|------------|---------------|--------------|
| Super Admin | ✅ | ✅ | ✅ |
| Administrator | ❌ | ❌ | ❌ |
| Keuangan | ❌ | ❌ | ❌ |
| Kasir | ❌ | ❌ | ❌ |

#### Proteksi:
1. **Menu Visibility**
   - Menu hanya muncul untuk Super Admin
   - User lain tidak akan melihat menu ini

2. **Page Access Control**
   - Jika non-Super Admin mencoba akses langsung
   - Akan muncul alert "Akses ditolak"
   - Otomatis redirect ke Dashboard

3. **Function Level Security**
   - Fungsi `isSuperAdmin()` memvalidasi setiap akses
   - Double-check di setiap operasi

### 🛡️ Best Practices

1. **Jangan Share Credentials**
   - Password Super Admin harus rahasia
   - Jangan share dengan user lain

2. **Ganti Password Default**
   - Segera ganti password default
   - Gunakan password yang kuat

3. **Monitor Aktivitas**
   - Periksa siapa yang mengakses
   - Catat perubahan yang dilakukan

4. **Backup Rutin**
   - Gunakan fitur backup sebelum perubahan besar
   - Simpan backup di lokasi aman

---

## FAQ

### ❓ Mengapa menu tidak muncul?

**Jawab:** Menu "Pengaturan Sistem" hanya muncul untuk Super Admin. Pastikan Anda login dengan:
- Username: `superadmin`
- Password: `super123`

Jika sudah login sebagai Super Admin tapi menu tidak muncul, coba:
1. Refresh halaman (F5)
2. Logout dan login kembali
3. Clear cache browser

---

### ❓ Saya Administrator, kenapa tidak bisa akses?

**Jawab:** Halaman ini **khusus untuk Super Admin**. Administrator memiliki akses ke hampir semua fitur, kecuali:
- Pengaturan Sistem
- Audit Log
- Manajemen User (terbatas)

Ini untuk keamanan dan pemisahan tanggung jawab.

---

### ❓ Bagaimana cara mengubah nama aplikasi?

**Jawab:** Saat ini, nama aplikasi bersifat **read-only** dan tidak dapat diubah melalui UI. Jika perlu mengubah:
1. Hubungi developer
2. Atau edit langsung di source code (`js/auth.js`)

Fitur edit nama aplikasi akan ditambahkan di versi mendatang.

---

### ❓ Apa bedanya dengan menu "Data Koperasi"?

**Jawab:**
- **Data Koperasi**: Informasi spesifik koperasi (nama, alamat, logo, modal)
- **Pengaturan Sistem**: Konfigurasi aplikasi secara keseluruhan

Data Koperasi dapat diakses oleh Administrator, sedangkan Pengaturan Sistem hanya Super Admin.

---

### ❓ Fitur apa saja yang akan ditambahkan?

**Jawab:** Rencana pengembangan meliputi:

1. **Tema & Tampilan**
   - Pilihan warna tema
   - Mode gelap/terang
   - Ukuran font

2. **Notifikasi**
   - Email notifications
   - SMS alerts
   - Push notifications

3. **Keamanan**
   - Password policy
   - Session timeout
   - 2FA authentication

4. **Periode Akuntansi**
   - Tutup periode
   - Buka periode baru
   - Lock transactions

5. **Cetak & Export**
   - Template laporan
   - Format export
   - Logo & header

6. **Maintenance**
   - Clear cache
   - Optimize database
   - System health check

---

### ❓ Bagaimana cara menambahkan pengaturan baru?

**Jawab:** Untuk developer:

1. **Edit file `js/auth.js`**
2. **Cari fungsi `renderSystemSettings()`**
3. **Tambahkan HTML untuk pengaturan baru**
4. **Tambahkan event handler jika perlu**
5. **Test dengan Super Admin account**

Contoh menambahkan toggle:
```javascript
<div class="form-check form-switch">
    <input class="form-check-input" type="checkbox" id="enableFeature">
    <label class="form-check-label" for="enableFeature">
        Enable New Feature
    </label>
</div>
```

---

### ❓ Apakah perubahan di sini mempengaruhi semua user?

**Jawab:** Ya, pengaturan di halaman ini bersifat **global** dan mempengaruhi seluruh sistem. Oleh karena itu:
- ⚠️ Hati-hati saat mengubah pengaturan
- 💾 Backup dulu sebelum perubahan besar
- 📝 Catat perubahan yang dilakukan
- 🧪 Test di environment testing jika memungkinkan

---

## Troubleshooting

### ❌ Error "Akses ditolak"

**Penyebab:**
- Bukan Super Admin
- Session expired

**Solusi:**
1. Pastikan login sebagai Super Admin
2. Logout dan login kembali
3. Check role di localStorage: `localStorage.getItem('currentUser')`

---

### ❌ Halaman kosong atau error

**Penyebab:**
- JavaScript error
- File tidak ter-load

**Solusi:**
1. Buka Developer Console (F12)
2. Check error di tab Console
3. Refresh halaman (Ctrl+F5)
4. Clear cache browser

---

### ❌ Tombol tidak berfungsi

**Penyebab:**
- JavaScript error
- Event handler tidak terpasang

**Solusi:**
1. Check console untuk error
2. Pastikan semua script ter-load
3. Refresh halaman
4. Hubungi support jika masalah berlanjut

---

## Kontak Support

Jika mengalami masalah atau butuh bantuan:
- 📧 Email: support@koperasi.com
- 📱 WhatsApp: +62 xxx-xxxx-xxxx
- 🌐 Website: www.koperasi.com/support

---

## Changelog

### Versi 1.0.0 (Current)
- ✅ Halaman Pengaturan Sistem dasar
- ✅ Informasi aplikasi (nama & versi)
- ✅ Akses ke Backup & Restore
- ✅ Kontrol akses Super Admin only
- ✅ UI responsif dan user-friendly

### Rencana Versi 1.1.0
- 🔄 Edit nama aplikasi
- 🔄 Pengaturan tema
- 🔄 Konfigurasi notifikasi
- 🔄 Password policy
- 🔄 Session management

---

**© 2024 Koperasi Karyawan - Sistem Manajemen Terintegrasi**
