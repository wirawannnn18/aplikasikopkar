# 🚀 Cara Membuka Aplikasi Koperasi

## 📋 Pilihan Akses Aplikasi

### 1. 🌐 **Akses Online (Recommended)**
Jika sudah di-deploy ke hosting:

#### A. Vercel
- URL: `https://nama-app.vercel.app`
- Login: admin@koperasi.com / admin123

#### B. Netlify  
- URL: `https://nama-app.netlify.app`
- Login: admin@koperasi.com / admin123

#### C. Custom Domain
- URL: `https://yourdomain.com`
- Login: admin@koperasi.com / admin123

---

### 2. 💻 **Akses Lokal (Development)**

#### A. Install Node.js Dulu (Jika Belum Ada)
1. **Download Node.js:**
   - Kunjungi: https://nodejs.org
   - Download versi LTS (Long Term Support)
   - Install dengan default settings

2. **Verifikasi Instalasi:**
   ```bash
   node --version
   npm --version
   ```

#### B. Jalankan Aplikasi Lokal
```bash
# 1. Buka terminal/command prompt di folder aplikasi
cd path/to/aplikasi-koperasi

# 2. Install dependencies (jika belum)
npm install

# 3. Jalankan server development
npm run dev

# 4. Buka browser ke:
# http://localhost:3000
```

---

### 3. 📱 **Akses Langsung File HTML**

Jika tidak ingin install Node.js, bisa buka langsung:

#### A. Buka File HTML
1. Buka Windows Explorer
2. Navigate ke folder aplikasi
3. Double-click file `index.html`
4. Aplikasi akan terbuka di browser

#### B. Atau Drag & Drop
1. Drag file `index.html` ke browser
2. Aplikasi langsung terbuka

**⚠️ Catatan:** Beberapa fitur mungkin tidak berfungsi sempurna karena CORS policy browser.

---

## 🔐 Login Aplikasi

### Kredensial Default:
```
Email: admin@koperasi.com
Password: admin123
```

### User Lain (Jika Ada):
```
Email: kasir@koperasi.com  
Password: admin123
```

**🚨 PENTING: Ganti password setelah login pertama!**

---

## 🛠️ Troubleshooting

### ❌ Problem: "npm not recognized"
**Solution:**
1. Install Node.js dari https://nodejs.org
2. Restart terminal/command prompt
3. Coba lagi: `npm --version`

### ❌ Problem: "Port 3000 already in use"
**Solution:**
```bash
# Gunakan port lain
npm run dev -- --port 3001

# Atau kill process yang menggunakan port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

### ❌ Problem: "Cannot connect to Supabase"
**Solution:**
1. Cek koneksi internet
2. Cek kredensial Supabase di `js/supabaseAuth.js`
3. Pastikan Supabase project masih aktif

### ❌ Problem: "Login failed"
**Solution:**
1. Pastikan database sudah disetup dengan `database-setup.sql`
2. Cek apakah user admin sudah dibuat
3. Cek Supabase dashboard untuk error logs

### ❌ Problem: File HTML tidak bisa akses database
**Solution:**
1. Gunakan server lokal: `npm run dev`
2. Atau deploy ke hosting online
3. Browser block akses database dari file:// protocol

---

## 🌟 Rekomendasi Akses

### Untuk Development/Testing:
```bash
npm run dev
# Akses: http://localhost:3000
```

### Untuk Production:
1. Deploy ke Vercel/Netlify
2. Akses via URL online
3. Setup custom domain (opsional)

### Untuk Demo/Presentasi:
1. Gunakan akses online (lebih stabil)
2. Siapkan data sample
3. Test semua fitur sebelum demo

---

## 📊 Monitoring Akses

### Supabase Dashboard:
- Monitor database connections
- Lihat API usage
- Check error logs

### Browser Developer Tools:
- F12 → Console untuk error JavaScript
- Network tab untuk API calls
- Application tab untuk localStorage

---

## 🔄 Update Aplikasi

### Jika Ada Perubahan Code:
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Restart server
npm run dev
```

### Jika Deploy Online:
```bash
# Re-deploy to Vercel
npm run deploy

# Atau manual
npx vercel --prod
```

---

## 📱 Akses Mobile

### Browser Mobile:
- Buka URL aplikasi di browser mobile
- Aplikasi responsive, bisa diakses di HP/tablet

### PWA (Progressive Web App):
- Buka di browser mobile
- Klik "Add to Home Screen"
- Aplikasi bisa diakses seperti app native

---

## 🎯 Quick Access Commands

```bash
# Start development server
npm run dev

# Setup production config
npm run setup

# Deploy to hosting
npm run deploy

# Run tests
npm test

# Check for errors
npm run lint
```

---

## 📞 Bantuan Lebih Lanjut

### Jika Masih Bermasalah:
1. Cek file `README_HOSTING_SETUP.md`
2. Baca `QUICK_START_HOSTING.md`
3. Lihat `PANDUAN_HOSTING_DATABASE_REAL.md`
4. Buka issue di repository
5. Hubungi tim support

### Useful Links:
- Supabase Dashboard: https://app.supabase.com
- Vercel Dashboard: https://vercel.com/dashboard
- Node.js Download: https://nodejs.org

---

**Happy coding! 🎉**