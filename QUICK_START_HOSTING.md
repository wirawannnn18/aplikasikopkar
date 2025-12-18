# 🚀 Quick Start: Hosting Aplikasi Koperasi

## Langkah Cepat (15 menit)

### 1. Setup Database Supabase
1. Buka [supabase.com](https://supabase.com) → Sign up/Login
2. Klik **"New Project"**
3. Isi nama: `koperasi-app`, pilih region: **Singapore**
4. Tunggu 2-3 menit sampai selesai
5. Buka **SQL Editor** → Copy paste isi file `database-setup.sql` → Run

### 2. Setup Aplikasi
```bash
# Jalankan setup script
npm run setup

# Masukkan kredensial Supabase:
# - URL: https://xxx.supabase.co
# - Anon Key: (dari Settings > API)
```

### 3. Deploy ke Vercel
```bash
# Deploy otomatis
npm run deploy

# Atau manual:
npx vercel --prod
```

### 4. Akses Aplikasi
- **URL**: Akan muncul setelah deploy
- **Login**: admin@koperasi.com / admin123
- **Ganti password** setelah login pertama!

---

## Opsi Hosting Lain

### A. Netlify (Gratis)
1. Drag & drop folder ke [netlify.com/drop](https://netlify.com/drop)
2. Set environment variables di Site Settings

### B. VPS/Server Sendiri
```bash
# Install dependencies
sudo apt update
sudo apt install nodejs npm nginx

# Upload aplikasi
git clone your-repo.git
cd koperasi-app
npm install

# Start dengan PM2
npm install -g pm2
pm2 start server.js --name koperasi-app
pm2 startup
pm2 save

# Setup Nginx reverse proxy
sudo nano /etc/nginx/sites-available/koperasi-app
# (lihat config di PANDUAN_HOSTING_DATABASE_REAL.md)
```

---

## Troubleshooting

### ❌ Error: Supabase connection failed
- Cek URL dan Anon Key di `js/supabaseAuth.js`
- Pastikan RLS policies sudah diset

### ❌ Error: Login tidak bisa
- Jalankan script `database-setup.sql` di Supabase
- Cek apakah user admin sudah dibuat

### ❌ Error: Deploy gagal
- Pastikan file `.env.production` ada
- Cek apakah Vercel CLI sudah terinstall

---

## Estimasi Biaya

| Service | Free Tier | Paid |
|---------|-----------|------|
| Supabase | 500MB DB, 2GB bandwidth | $25/bulan |
| Vercel | 100GB bandwidth | $20/bulan |
| Domain | - | $10-15/tahun |
| **Total** | **Gratis** | **$45-50/bulan** |

---

## Keamanan Penting

✅ **Wajib dilakukan:**
- [ ] Ganti password default admin
- [ ] Setup HTTPS (otomatis di Vercel/Netlify)
- [ ] Backup database berkala
- [ ] Monitor error logs
- [ ] Update dependencies rutin

---

## Support

📚 **Dokumentasi Lengkap**: `PANDUAN_HOSTING_DATABASE_REAL.md`
🔧 **Setup Database**: `database-setup.sql`
⚙️ **Konfigurasi**: `setup-production.js`

**Butuh bantuan?** Buka issue di repository atau hubungi tim support.