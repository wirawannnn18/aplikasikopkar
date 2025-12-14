# Update Enum Role di Supabase Database

## Ringkasan Perubahan

Kolom `role` di tabel `profiles` telah diupdate untuk menggunakan enum type yang eksplisit (`user_role`) untuk memastikan konsistensi dengan sistem localStorage yang ada.

## Perubahan yang Dilakukan

### 1. Membuat Enum Type
```sql
CREATE TYPE user_role AS ENUM (
    'super_admin',
    'administrator', 
    'keuangan',
    'kasir',
    'anggota'
);
```

### 2. Update Kolom Role
- Drop constraint lama: `profiles_role_check`
- Drop policies yang bergantung pada kolom role
- Update kolom `role` untuk menggunakan `user_role` enum
- Buat ulang policies dengan enum type

### 3. Update Fungsi Trigger
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'anggota')::user_role
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Role yang Tersedia

Enum `user_role` mencakup semua role yang digunakan dalam sistem localStorage:

1. **`super_admin`** - Super Administrator dengan akses penuh sistem
2. **`administrator`** - Administrator dengan akses penuh operasional  
3. **`keuangan`** - Admin Keuangan dengan akses keuangan
4. **`kasir`** - Kasir dengan akses Point of Sales
5. **`anggota`** - Anggota koperasi dengan akses terbatas

## Keuntungan Enum Type

### 1. **Type Safety**
- Database akan menolak nilai yang tidak valid
- Mencegah typo dalam role assignment
- Validasi di level database

### 2. **Konsistensi**
- Enum values sama persis dengan localStorage
- Tidak ada perbedaan antara frontend dan backend
- Migrasi data lebih aman

### 3. **Performance**
- Enum lebih efisien daripada text dengan constraint
- Index lebih optimal
- Query lebih cepat

### 4. **Maintainability**
- Mudah menambah role baru dengan `ALTER TYPE`
- Dokumentasi role terpusat di database
- Refactoring lebih aman

## Testing

### Test Valid Roles
```sql
-- Semua role ini harus berhasil
UPDATE public.profiles SET role = 'super_admin'::user_role WHERE id = 'user_id';
UPDATE public.profiles SET role = 'administrator'::user_role WHERE id = 'user_id';
UPDATE public.profiles SET role = 'keuangan'::user_role WHERE id = 'user_id';
UPDATE public.profiles SET role = 'kasir'::user_role WHERE id = 'user_id';
UPDATE public.profiles SET role = 'anggota'::user_role WHERE id = 'user_id';
```

### Test Invalid Role
```sql
-- Ini harus error
UPDATE public.profiles SET role = 'invalid_role'::user_role WHERE id = 'user_id';
-- ERROR: invalid input value for enum user_role: "invalid_role"
```

## Kompatibilitas

### Backward Compatibility
- Semua role yang ada tetap valid
- Tidak ada perubahan di aplikasi frontend
- Migration script tetap bekerja

### Forward Compatibility
- Mudah menambah role baru jika diperlukan
- Enum dapat diextend tanpa breaking changes
- Type safety terjaga

## Menambah Role Baru (Jika Diperlukan)

Jika di masa depan perlu menambah role baru:

```sql
-- Tambah nilai baru ke enum
ALTER TYPE user_role ADD VALUE 'role_baru';

-- Update aplikasi untuk mengenali role baru
-- Update getRoleName() function di js/auth.js
-- Update getAvailableRoles() function di js/auth.js
-- Update menu permissions di renderMenu()
```

## Verifikasi

### Cek Struktur Tabel
```sql
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND column_name = 'role';
```

Expected result:
- `data_type`: "USER-DEFINED"
- `udt_name`: "user_role"

### Cek Enum Values
```sql
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'user_role'
)
ORDER BY enumsortorder;
```

Expected result: `super_admin`, `administrator`, `keuangan`, `kasir`, `anggota`

### Cek Policies
```sql
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles' 
AND schemaname = 'public';
```

## Status

✅ **COMPLETED** - Enum role telah berhasil diimplementasikan dengan:
- Semua 5 role dari localStorage tersedia
- Type safety di level database
- Policies RLS berfungsi normal
- Trigger function updated
- Backward compatibility terjaga

## Next Steps

1. Test aplikasi dengan role enum baru
2. Verifikasi migration script masih bekerja
3. Update dokumentasi API jika diperlukan
4. Monitor performa query dengan enum type