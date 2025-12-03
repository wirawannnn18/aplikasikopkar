# Troubleshooting - Reset Data Koperasi

## Masalah: Halaman Reset Tidak Bisa Dibuka

### Langkah Debugging:

#### 1. Test Sederhana
Buka: **http://localhost:3000/test_reset_simple.html**

Klik tombol:
1. **"Run Diagnostics"** - Cek apakah semua script ter-load
2. **"Setup & Render"** - Setup user dan render halaman

**Yang Harus Dicek:**
- ✅ Semua item harus menunjukkan "Loaded"
- ✅ Current User harus "Set"
- ✅ Tidak ada error di console (F12)

#### 2. Cek Browser Console
1. Buka aplikasi: http://localhost:3000
2. Tekan **F12** untuk buka Developer Tools
3. Pilih tab **Console**
4. Login sebagai admin
5. Buka Pengaturan Sistem → Reset Data
6. Lihat apakah ada error merah di console

**Error Umum:**
- `ReferenceError: CategoryManager is not defined` → Script belum ter-load
- `Cannot read property 'innerHTML' of null` → Element mainContent tidak ada
- `Permission denied` → User bukan super_admin

#### 3. Verifikasi File Ter-load
Di browser console, ketik:
```javascript
// Cek apakah fungsi tersedia
console.log('CategoryManager:', typeof CategoryManager);
console.log('ResetService:', typeof ResetService);
console.log('renderResetDataPage:', typeof renderResetDataPage);

// Cek user
console.log('Current User:', localStorage.getItem('currentUser'));
```

**Hasil yang Benar:**
```
CategoryManager: function
ResetService: function
renderResetDataPage: function
Current User: {"username":"superadmin",...}
```

#### 4. Cek Script Tags di index.html
Pastikan di `index.html` ada:
```html
<script src="js/backup.js"></script>
<script src="js/auditLogger.js"></script>
<script src="js/resetDataKoperasi.js"></script>
<script src="js/resetDataUI.js"></script>
```

**Urutan penting!** resetDataKoperasi.js harus sebelum resetDataUI.js

#### 5. Clear Cache Browser
1. Tekan **Ctrl + Shift + Delete**
2. Pilih "Cached images and files"
3. Klik "Clear data"
4. Refresh halaman dengan **Ctrl + F5**

#### 6. Cek Role User
Di console:
```javascript
const user = JSON.parse(localStorage.getItem('currentUser'));
console.log('Role:', user.role);
```

**Role yang Valid:**
- `super_admin` ✅
- `administrator` ✅
- `keuangan` ❌
- `kasir` ❌

#### 7. Test Manual Render
Di console:
```javascript
// Setup test user
localStorage.setItem('currentUser', JSON.stringify({
    username: 'superadmin',
    name: 'Super Admin',
    role: 'super_admin'
}));

// Try render
renderResetDataPage();
```

### Solusi Berdasarkan Error:

#### Error: "renderResetDataPage is not defined"
**Penyebab:** File js/resetDataUI.js belum ter-load

**Solusi:**
1. Cek file ada di folder js/
2. Cek script tag di index.html
3. Clear cache dan refresh

#### Error: "CategoryManager is not defined"
**Penyebab:** File js/resetDataKoperasi.js belum ter-load

**Solusi:**
1. Cek file ada di folder js/
2. Cek script tag di index.html
3. Pastikan urutan loading benar

#### Error: "Akses Ditolak"
**Penyebab:** User bukan super_admin atau administrator

**Solusi:**
1. Login dengan user yang benar:
   - Username: `superadmin`, Password: `super123`
   - Username: `admin`, Password: `admin123`
2. Atau upgrade role user di console:
```javascript
const users = JSON.parse(localStorage.getItem('users'));
const user = users.find(u => u.username === 'your_username');
user.role = 'super_admin';
localStorage.setItem('users', JSON.stringify(users));
localStorage.setItem('currentUser', JSON.stringify(user));
```

#### Error: "Cannot read property 'innerHTML' of null"
**Penyebab:** Element mainContent tidak ditemukan

**Solusi:**
1. Pastikan sudah login dan di halaman utama aplikasi
2. Cek di HTML ada element dengan id="mainContent"
3. Jangan buka langsung file HTML, harus melalui server

#### Halaman Blank / Tidak Ada Konten
**Penyebab:** JavaScript error yang tidak tertangkap

**Solusi:**
1. Buka console (F12) dan lihat error
2. Cek semua file JavaScript ter-load
3. Test dengan test_reset_simple.html

### Quick Fix Commands

Jalankan di browser console:

```javascript
// 1. Setup super admin user
localStorage.setItem('currentUser', JSON.stringify({
    id: 1,
    username: 'superadmin',
    password: 'super123',
    name: 'Super Administrator',
    nama: 'Super Administrator',
    role: 'super_admin',
    active: true
}));

// 2. Setup koperasi
localStorage.setItem('koperasi', JSON.stringify({
    id: 'KOP001',
    nama: 'Koperasi Test',
    alamat: 'Jl. Test',
    telepon: '021-123456',
    modalAwal: 10000000
}));

// 3. Reload page
location.reload();

// 4. After reload, navigate to reset
navigateTo('reset-data');
```

### Test Files untuk Debugging

1. **test_reset_simple.html** - Test paling sederhana
   - Cek script loading
   - Setup user
   - Render page

2. **test_reset_integration.html** - Test integrasi
   - Verifikasi semua class
   - Test instantiation
   - Auto-run tests

3. **test_reset_data_koperasi.html** - Test suite lengkap
   - Unit tests
   - Integration tests
   - Full flow test

### Jika Masih Belum Bisa

1. **Restart Server**
   ```
   Ctrl+C di terminal
   node server.js
   ```

2. **Cek File Permissions**
   ```
   ls -la js/reset*.js
   ```
   Pastikan file readable

3. **Cek Syntax Error**
   Buka file di editor dan cek ada error merah

4. **Test di Browser Lain**
   - Chrome
   - Firefox
   - Edge

5. **Lihat Network Tab**
   - F12 → Network tab
   - Refresh page
   - Cek apakah resetDataKoperasi.js dan resetDataUI.js ter-load
   - Status harus 200 (bukan 404)

### Contact Support

Jika semua langkah sudah dicoba dan masih error:

1. Screenshot error di console
2. Screenshot network tab
3. Copy-paste error message
4. Kirim ke support

---

## Quick Test Checklist

- [ ] Server running di http://localhost:3000
- [ ] File js/resetDataKoperasi.js ada
- [ ] File js/resetDataUI.js ada
- [ ] Script tags di index.html benar
- [ ] Login sebagai super_admin
- [ ] Browser console tidak ada error
- [ ] test_reset_simple.html berfungsi
- [ ] Cache browser sudah di-clear

Jika semua ✅, fitur reset harus berfungsi!

