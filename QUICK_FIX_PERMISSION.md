# Quick Fix - Permission Issue

## Masalah: "Akses Ditolak" padahal sudah login sebagai superadmin

### Langkah 1: Cek User di Console

Buka Console (F12) dan paste:

```javascript
// Cek user saat ini
const user = JSON.parse(localStorage.getItem('currentUser'));
console.log('Current User:', user);
console.log('Role:', user.role);
```

### Langkah 2: Lihat Output

Jika role bukan `super_admin` atau `administrator`, lakukan fix di bawah.

### Langkah 3: Quick Fix - Update Role

Paste di console:

```javascript
// Get current user
const user = JSON.parse(localStorage.getItem('currentUser'));

// Update role to super_admin
user.role = 'super_admin';

// Save back
localStorage.setItem('currentUser', JSON.stringify(user));
window.currentUser = user;

console.log('✅ Role updated to:', user.role);

// Refresh page
location.reload();
```

### Langkah 4: Fix Permanent - Update Users Database

Paste di console:

```javascript
// Get all users
const users = JSON.parse(localStorage.getItem('users') || '[]');

// Find superadmin user
const superadmin = users.find(u => u.username === 'superadmin');

if (superadmin) {
    // Update role
    superadmin.role = 'super_admin';
    
    // Save back
    localStorage.setItem('users', JSON.stringify(users));
    
    console.log('✅ Superadmin role updated in database');
    console.log('Superadmin user:', superadmin);
} else {
    console.log('❌ Superadmin user not found');
    console.log('Available users:', users.map(u => u.username));
}
```

### Langkah 5: Jika Masih Belum Bisa

Create new super admin:

```javascript
// Get users
let users = JSON.parse(localStorage.getItem('users') || '[]');

// Create new super admin
const newSuperAdmin = {
    id: Date.now(),
    username: 'superadmin',
    password: 'super123',
    name: 'Super Administrator',
    nama: 'Super Administrator',
    role: 'super_admin',
    active: true
};

// Remove old superadmin if exists
users = users.filter(u => u.username !== 'superadmin');

// Add new
users.push(newSuperAdmin);

// Save
localStorage.setItem('users', JSON.stringify(users));

console.log('✅ New super admin created');
console.log('Login with: superadmin / super123');

// Logout to login again
localStorage.removeItem('currentUser');
location.reload();
```

### Langkah 6: Login Ulang

1. Logout
2. Login dengan: `superadmin` / `super123`
3. Buka Pengaturan Sistem → Reset Data
4. Harus berfungsi!

---

## Kemungkinan Penyebab:

1. **Role salah ketik**: `super admin` (dengan spasi) vs `super_admin` (dengan underscore)
2. **Role berbeda**: `administrator` vs `super_admin`
3. **User data corrupt**: Data user rusak atau tidak lengkap

## Verifikasi Role yang Benar:

Role yang VALID untuk akses reset:
- ✅ `super_admin` (dengan underscore)
- ✅ `administrator`

Role yang TIDAK VALID:
- ❌ `super admin` (dengan spasi)
- ❌ `admin`
- ❌ `keuangan`
- ❌ `kasir`

---

## One-Line Fix

Paste ini di console untuk instant fix:

```javascript
const u=JSON.parse(localStorage.getItem('currentUser'));u.role='super_admin';localStorage.setItem('currentUser',JSON.stringify(u));window.currentUser=u;location.reload();
```

