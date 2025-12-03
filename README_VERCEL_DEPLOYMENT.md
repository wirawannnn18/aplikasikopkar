# Panduan Deploy Aplikasi Koperasi ke Vercel

## 📋 Persiapan

Aplikasi ini sudah disiapkan untuk deployment ke Vercel dengan konfigurasi berikut:

### File Konfigurasi yang Sudah Dibuat:
- ✅ `vercel.json` - Konfigurasi Vercel
- ✅ `build.js` - Build script untuk production
- ✅ `.vercelignore` - File yang diabaikan saat deploy
- ✅ `package.json` - Updated dengan build script

## 🚀 Cara Deploy ke Vercel

### Metode 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI** (jika belum):
```bash
npm install -g vercel
```

2. **Login ke Vercel**:
```bash
vercel login
```

3. **Deploy aplikasi**:
```bash
vercel
```

4. **Deploy ke production**:
```bash
vercel --prod
```

### Metode 2: Deploy via Vercel Dashboard

1. **Push ke GitHub** (jika belum):
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

2. **Import di Vercel**:
   - Buka https://vercel.com
   - Klik "Add New Project"
   - Import repository GitHub Anda
   - Vercel akan otomatis detect konfigurasi

3. **Deploy**:
   - Klik "Deploy"
   - Tunggu proses selesai
   - Aplikasi akan live di URL Vercel

## ⚙️ Konfigurasi Vercel

### Build Settings (Otomatis terdeteksi):
- **Framework Preset**: Other
- **Build Command**: (tidak diperlukan - static site)
- **Output Directory**: (root directory)
- **Install Command**: (tidak diperlukan - no dependencies)

### Environment Variables:
Tidak ada environment variables yang diperlukan karena aplikasi menggunakan localStorage.

## 📁 Struktur Deployment

```
aplikasi-koperasi/
├── public/              # Output directory (generated)
│   ├── index.html
│   ├── js/
│   └── css/
├── vercel.json          # Vercel configuration
├── build.js             # Build script
├── .vercelignore        # Files to ignore
└── package.json         # Updated with build script
```

## 🔧 Deployment Process

Vercel akan otomatis:
1. Clone repository Anda
2. Deploy semua file static (HTML, CSS, JS)
3. Setup CDN global
4. Aktifkan HTTPS

## 📝 Catatan Penting

### 1. LocalStorage
Aplikasi ini menggunakan localStorage untuk menyimpan data. Data akan tersimpan di browser user, bukan di server.

### 2. Static Site
Aplikasi ini adalah static site (HTML + CSS + JavaScript), tidak memerlukan server backend.

### 3. HTTPS
Vercel otomatis menyediakan HTTPS untuk semua deployment.

### 4. Custom Domain (Optional)
Anda bisa menambahkan custom domain di Vercel dashboard:
- Settings → Domains → Add Domain

## 🧪 Testing Sebelum Deploy

1. **Test dengan server lokal**:
```bash
npm run dev
```
Buka http://localhost:3000

2. **Cek semua file**:
Pastikan `index.html`, folder `js/`, dan folder `css/` ada di root directory

## 🔄 Update Aplikasi

Setelah deploy pertama, untuk update:

**Via CLI**:
```bash
git add .
git commit -m "Update aplikasi"
git push
vercel --prod
```

**Via GitHub Integration**:
- Push ke GitHub
- Vercel otomatis deploy

## 📊 Monitoring

Setelah deploy, Anda bisa monitor di Vercel Dashboard:
- Analytics
- Logs
- Performance metrics
- Deployment history

## 🆘 Troubleshooting

### Deployment Failed
- Cek logs di Vercel dashboard
- Pastikan semua file static ada (index.html, js/, css/)
- Cek `vercel.json` configuration

### 404 Error
- Cek `vercel.json` routing configuration
- Pastikan `index.html` ada di folder `public/`

### JavaScript Not Loading
- Cek path di `index.html`
- Pastikan folder `js/` ter-copy ke `public/js/`

### CSS Not Loading
- Cek path di `index.html`
- Pastikan folder `css/` ter-copy ke `public/css/`

## 🔗 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Static Site Deployment](https://vercel.com/docs/concepts/deployments/overview)

## ✅ Checklist Deploy

- [ ] Install Vercel CLI
- [ ] Login ke Vercel
- [ ] Test build locally (`npm run build`)
- [ ] Cek folder `public/` berisi semua file
- [ ] Deploy dengan `vercel`
- [ ] Test aplikasi di URL preview
- [ ] Deploy production dengan `vercel --prod`
- [ ] Test aplikasi di URL production
- [ ] (Optional) Setup custom domain

---

**Selamat! Aplikasi Koperasi Anda siap di-deploy ke Vercel! 🎉**
