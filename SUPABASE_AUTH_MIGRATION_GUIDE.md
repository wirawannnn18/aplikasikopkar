# Panduan Migrasi Sistem Autentikasi ke Supabase

## Ringkasan Perubahan

Sistem autentikasi aplikasi koperasi telah dimigrasi dari localStorage ke Supabase Auth untuk meningkatkan keamanan dan skalabilitas.

## Perubahan Utama

### 1. Sistem Autentikasi Baru
- **Sebelum**: Menggunakan localStorage untuk menyimpan data user dan password
- **Sesudah**: Menggunakan Supabase Auth dengan database PostgreSQL

### 2. Keamanan Password
- **Sebelum**: Password di-hash dengan algoritma sederhana
- **Sesudah**: Password di-hash dengan bcrypt melalui Supabase Auth

### 3. Manajemen Session
- **Sebelum**: Session disimpan di localStorage
- **Sesudah**: Session dikelola oleh Supabase dengan JWT tokens

## Struktur Database Baru

### Tabel `profiles`
```sql
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'administrator', 'keuangan', 'kasir', 'anggota')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabel `password_history`
```sql
CREATE TABLE password_history (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabel `login_attempts`
```sql
CREATE TABLE login_attempts (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    ip_address INET,
    success BOOLEAN DEFAULT false,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## File-File Baru

### 1. `js/supabaseClient.js`
Client sederhana untuk komunikasi dengan Supabase API tanpa dependency eksternal.

### 2. `js/supabaseAuth.js`
Modul autentikasi utama yang menggantikan fungsi-fungsi di `js/auth.js`.

### 3. `js/authMigration.js`
Script untuk migrasi data user dari localStorage ke Supabase.

### 4. `test_supabase_auth.html`
Halaman test untuk memverifikasi fungsi autentikasi Supabase.

## Proses Migrasi

### Langkah 1: Setup Database
Database Supabase sudah dikonfigurasi dengan:
- URL: `https://etjdnbumjdsueqdffsks.supabase.co`
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Langkah 2: Migrasi Otomatis
Saat aplikasi pertama kali dibuka setelah update:
1. Script akan mendeteksi adanya data user di localStorage
2. Modal migrasi akan muncul secara otomatis
3. User dapat memulai proses migrasi dengan klik tombol
4. Semua user akan dimigrasi dengan password sementara: `TempPass123!`

### Langkah 3: Super Admin Default
Jika belum ada super admin, sistem akan membuat akun default:
- **Email**: `admin@koperasi.local`
- **Username**: `admin`
- **Password**: `Admin123!`

## Cara Penggunaan

### Login
```javascript
// Login dengan email/username dan password
const result = await window.supabaseAuth.signInWithPassword(email, password);

if (result.success) {
    console.log('Login berhasil:', result.data.user);
} else {
    console.error('Login gagal:', result.error);
}
```

### Mendapatkan User Saat Ini
```javascript
const currentUser = window.supabaseAuth.getCurrentUser();
if (currentUser) {
    console.log('User:', currentUser.name, 'Role:', currentUser.role);
}
```

### Logout
```javascript
const result = await window.supabaseAuth.signOut();
if (result.success) {
    console.log('Logout berhasil');
}
```

### Membuat User Baru (Admin Only)
```javascript
const userData = {
    email: 'user@example.com',
    username: 'username',
    name: 'Nama Lengkap',
    role: 'kasir',
    password: 'SecurePass123!'
};

const result = await window.supabaseAuth.signUpUser(userData.email, userData.password, userData);
```

## Kompatibilitas

### Backward Compatibility
- File `js/auth.js` lama tetap dimuat untuk kompatibilitas
- Fungsi-fungsi lama masih tersedia selama periode transisi
- Data localStorage tidak dihapus sampai migrasi selesai

### Forward Compatibility
- Semua fungsi baru menggunakan Supabase Auth
- Session management otomatis
- Rate limiting terintegrasi
- Password security yang lebih baik

## Testing

### Manual Testing
1. Buka `test_supabase_auth.html` di browser
2. Test login dengan kredensial default
3. Test pembuatan user baru
4. Test migrasi data
5. Verifikasi semua fungsi bekerja dengan baik

### Automated Testing
```bash
# Jalankan test suite (jika tersedia)
npm test
```

## Troubleshooting

### Error: "Supabase client not found"
- Pastikan `js/supabaseClient.js` dimuat sebelum `js/supabaseAuth.js`
- Periksa console browser untuk error loading script

### Error: "Authentication failed"
- Periksa kredensial login
- Pastikan user sudah dimigrasi atau dibuat di Supabase
- Cek koneksi internet dan akses ke Supabase

### Error: "Migration failed"
- Periksa console untuk detail error
- Pastikan koneksi ke Supabase stabil
- Coba refresh halaman dan ulangi migrasi

### Password Tidak Berfungsi
- User yang dimigrasi menggunakan password sementara: `TempPass123!`
- Super admin default: email `admin@koperasi.local`, password `Admin123!`
- User harus mengganti password setelah login pertama

## Keamanan

### Fitur Keamanan Baru
1. **Rate Limiting**: Maksimal 5 percobaan login dalam 5 menit
2. **Password History**: Mencegah penggunaan 5 password terakhir
3. **Session Management**: Token JWT dengan expiry otomatis
4. **Row Level Security**: Database access terbatas berdasarkan user role

### Best Practices
1. Ganti password default setelah migrasi
2. Gunakan password yang kuat (minimal 8 karakter, kombinasi huruf, angka, simbol)
3. Logout setelah selesai menggunakan aplikasi
4. Jangan share kredensial login

## Rollback Plan

Jika terjadi masalah serius:

1. **Kembalikan ke sistem lama**:
   - Comment out script Supabase di `index.html`
   - Uncomment script auth.js lama
   - Restore data dari `users_backup` di localStorage

2. **Backup data**:
   - Data user lama tersimpan di `users_backup`
   - Migration results tersimpan di `migration_results`

## Support

Untuk bantuan teknis:
- **Developer**: Arya Wirawan
- **WhatsApp**: 0815-2260-0227
- **Email**: support@koperasi-app.com

## Changelog

### Version 2.0.0 (2024-12-13)
- ✅ Migrasi ke Supabase Auth
- ✅ Database PostgreSQL setup
- ✅ Automatic migration script
- ✅ Enhanced security features
- ✅ Rate limiting implementation
- ✅ Password history tracking
- ✅ Row Level Security (RLS)
- ✅ Backward compatibility maintained

### Version 1.0.1 (Previous)
- localStorage-based authentication
- Simple password hashing
- Basic user management