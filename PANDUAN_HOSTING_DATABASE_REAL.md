# Panduan Hosting Aplikasi Koperasi dengan Database Real

## 1. Setup Database Supabase

### A. Buat Project Supabase Baru
1. Kunjungi [supabase.com](https://supabase.com)
2. Buat akun atau login
3. Klik "New Project"
4. Isi nama project: `koperasi-app`
5. Pilih region terdekat (Singapore untuk Indonesia)
6. Set password database yang kuat
7. Tunggu project selesai dibuat (2-3 menit)

### B. Dapatkan Kredensial Database
Setelah project dibuat, catat:
- **Project URL**: `https://[project-id].supabase.co`
- **Anon Key**: Dari Settings > API > anon public
- **Service Role Key**: Dari Settings > API > service_role (untuk admin)

### C. Setup Tables Database
Buka SQL Editor di Supabase dan jalankan script berikut:

```sql
-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'kasir' CHECK (role IN ('super_admin', 'admin', 'kasir')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create anggota table
CREATE TABLE IF NOT EXISTS anggota (
    id SERIAL PRIMARY KEY,
    kode_anggota VARCHAR(20) UNIQUE NOT NULL,
    nama VARCHAR(255) NOT NULL,
    alamat TEXT,
    telepon VARCHAR(20),
    email VARCHAR(255),
    tanggal_daftar DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'aktif' CHECK (status IN ('aktif', 'keluar', 'non_aktif')),
    departemen VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create master_barang table
CREATE TABLE IF NOT EXISTS master_barang (
    id SERIAL PRIMARY KEY,
    kode_barang VARCHAR(50) UNIQUE NOT NULL,
    nama_barang VARCHAR(255) NOT NULL,
    kategori VARCHAR(100),
    unit VARCHAR(20) DEFAULT 'pcs',
    harga_beli DECIMAL(15,2) DEFAULT 0,
    harga_jual DECIMAL(15,2) DEFAULT 0,
    stok_minimum INTEGER DEFAULT 0,
    stok_current INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create simpanan_pokok table
CREATE TABLE IF NOT EXISTS simpanan_pokok (
    id SERIAL PRIMARY KEY,
    anggota_id INTEGER REFERENCES anggota(id) ON DELETE CASCADE,
    jumlah DECIMAL(15,2) NOT NULL DEFAULT 0,
    tanggal_setor DATE DEFAULT CURRENT_DATE,
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create simpanan_wajib table
CREATE TABLE IF NOT EXISTS simpanan_wajib (
    id SERIAL PRIMARY KEY,
    anggota_id INTEGER REFERENCES anggota(id) ON DELETE CASCADE,
    periode VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    jumlah DECIMAL(15,2) NOT NULL DEFAULT 0,
    tanggal_setor DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'lunas' CHECK (status IN ('lunas', 'belum_lunas')),
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(anggota_id, periode)
);

-- Create simpanan_sukarela table
CREATE TABLE IF NOT EXISTS simpanan_sukarela (
    id SERIAL PRIMARY KEY,
    anggota_id INTEGER REFERENCES anggota(id) ON DELETE CASCADE,
    jenis VARCHAR(20) DEFAULT 'setor' CHECK (jenis IN ('setor', 'tarik')),
    jumlah DECIMAL(15,2) NOT NULL,
    tanggal_transaksi DATE DEFAULT CURRENT_DATE,
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pinjaman table
CREATE TABLE IF NOT EXISTS pinjaman (
    id SERIAL PRIMARY KEY,
    anggota_id INTEGER REFERENCES anggota(id) ON DELETE CASCADE,
    jumlah_pinjaman DECIMAL(15,2) NOT NULL,
    bunga_persen DECIMAL(5,2) DEFAULT 0,
    lama_cicilan INTEGER NOT NULL, -- dalam bulan
    cicilan_per_bulan DECIMAL(15,2) NOT NULL,
    sisa_pinjaman DECIMAL(15,2) NOT NULL,
    tanggal_pinjaman DATE DEFAULT CURRENT_DATE,
    tanggal_jatuh_tempo DATE,
    status VARCHAR(20) DEFAULT 'aktif' CHECK (status IN ('aktif', 'lunas', 'macet')),
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transaksi_pos table
CREATE TABLE IF NOT EXISTS transaksi_pos (
    id SERIAL PRIMARY KEY,
    nomor_transaksi VARCHAR(50) UNIQUE NOT NULL,
    anggota_id INTEGER REFERENCES anggota(id),
    total_belanja DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_bayar DECIMAL(15,2) NOT NULL DEFAULT 0,
    kembalian DECIMAL(15,2) DEFAULT 0,
    metode_bayar VARCHAR(20) DEFAULT 'tunai' CHECK (metode_bayar IN ('tunai', 'kredit')),
    kasir VARCHAR(255) NOT NULL,
    tanggal_transaksi TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'selesai' CHECK (status IN ('draft', 'selesai', 'batal')),
    keterangan TEXT
);

-- Create detail_transaksi_pos table
CREATE TABLE IF NOT EXISTS detail_transaksi_pos (
    id SERIAL PRIMARY KEY,
    transaksi_id INTEGER REFERENCES transaksi_pos(id) ON DELETE CASCADE,
    barang_id INTEGER REFERENCES master_barang(id),
    kode_barang VARCHAR(50) NOT NULL,
    nama_barang VARCHAR(255) NOT NULL,
    harga_satuan DECIMAL(15,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    subtotal DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create jurnal_umum table
CREATE TABLE IF NOT EXISTS jurnal_umum (
    id SERIAL PRIMARY KEY,
    tanggal DATE DEFAULT CURRENT_DATE,
    nomor_jurnal VARCHAR(50) UNIQUE NOT NULL,
    keterangan TEXT NOT NULL,
    referensi VARCHAR(100),
    total_debit DECIMAL(15,2) DEFAULT 0,
    total_kredit DECIMAL(15,2) DEFAULT 0,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create detail_jurnal table
CREATE TABLE IF NOT EXISTS detail_jurnal (
    id SERIAL PRIMARY KEY,
    jurnal_id INTEGER REFERENCES jurnal_umum(id) ON DELETE CASCADE,
    kode_akun VARCHAR(20) NOT NULL,
    nama_akun VARCHAR(255) NOT NULL,
    debit DECIMAL(15,2) DEFAULT 0,
    kredit DECIMAL(15,2) DEFAULT 0,
    keterangan TEXT
);

-- Create chart_of_accounts table
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id SERIAL PRIMARY KEY,
    kode_akun VARCHAR(20) UNIQUE NOT NULL,
    nama_akun VARCHAR(255) NOT NULL,
    jenis_akun VARCHAR(50) NOT NULL CHECK (jenis_akun IN ('ASET', 'KEWAJIBAN', 'MODAL', 'PENDAPATAN', 'BEBAN')),
    parent_id INTEGER REFERENCES chart_of_accounts(id),
    level_akun INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default COA
INSERT INTO chart_of_accounts (kode_akun, nama_akun, jenis_akun, level_akun) VALUES
('1000', 'ASET', 'ASET', 1),
('1100', 'Kas', 'ASET', 2),
('1200', 'Piutang Anggota', 'ASET', 2),
('1300', 'Persediaan Barang', 'ASET', 2),
('2000', 'KEWAJIBAN', 'KEWAJIBAN', 1),
('2100', 'Simpanan Pokok', 'KEWAJIBAN', 2),
('2200', 'Simpanan Wajib', 'KEWAJIBAN', 2),
('2300', 'Simpanan Sukarela', 'KEWAJIBAN', 2),
('3000', 'MODAL', 'MODAL', 1),
('3100', 'Modal Koperasi', 'MODAL', 2),
('4000', 'PENDAPATAN', 'PENDAPATAN', 1),
('4100', 'Pendapatan Penjualan', 'PENDAPATAN', 2),
('4200', 'Pendapatan Bunga', 'PENDAPATAN', 2),
('5000', 'BEBAN', 'BEBAN', 1),
('5100', 'Beban Operasional', 'BEBAN', 2);

-- Create indexes for better performance
CREATE INDEX idx_anggota_kode ON anggota(kode_anggota);
CREATE INDEX idx_anggota_status ON anggota(status);
CREATE INDEX idx_master_barang_kode ON master_barang(kode_barang);
CREATE INDEX idx_transaksi_pos_tanggal ON transaksi_pos(tanggal_transaksi);
CREATE INDEX idx_jurnal_tanggal ON jurnal_umum(tanggal);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE anggota ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_barang ENABLE ROW LEVEL SECURITY;
ALTER TABLE simpanan_pokok ENABLE ROW LEVEL SECURITY;
ALTER TABLE simpanan_wajib ENABLE ROW LEVEL SECURITY;
ALTER TABLE simpanan_sukarela ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinjaman ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaksi_pos ENABLE ROW LEVEL SECURITY;
ALTER TABLE detail_transaksi_pos ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurnal_umum ENABLE ROW LEVEL SECURITY;
ALTER TABLE detail_jurnal ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for authenticated users for now)
CREATE POLICY "Allow all for authenticated users" ON users FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON anggota FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON master_barang FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON simpanan_pokok FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON simpanan_wajib FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON simpanan_sukarela FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON pinjaman FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON transaksi_pos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON detail_transaksi_pos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON jurnal_umum FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON detail_jurnal FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON chart_of_accounts FOR ALL USING (auth.role() = 'authenticated');
```

## 2. Update Konfigurasi Aplikasi

### A. Update Supabase Credentials
Edit file `js/supabaseAuth.js`:

```javascript
// Ganti dengan kredensial Supabase project Anda
const SUPABASE_URL = 'https://YOUR-PROJECT-ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY';
```

### B. Buat User Admin Pertama
Jalankan di SQL Editor Supabase:

```sql
-- Insert admin user (ganti password dengan hash yang benar)
INSERT INTO users (email, password_hash, full_name, role) VALUES 
('admin@koperasi.com', '$2b$10$encrypted-password-hash', 'Super Admin', 'super_admin');
```

## 3. Deploy ke Hosting

### A. Deploy ke Vercel (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login ke Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy aplikasi**:
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables** di Vercel Dashboard:
   - `SUPABASE_URL`: URL project Supabase
   - `SUPABASE_ANON_KEY`: Anon key dari Supabase
   - `SUPABASE_SERVICE_KEY`: Service role key (untuk admin functions)

### B. Deploy ke Netlify

1. **Build aplikasi**:
   ```bash
   npm run build
   ```

2. **Upload ke Netlify**:
   - Drag & drop folder ke netlify.com/drop
   - Atau connect dengan GitHub repository

3. **Set Environment Variables** di Netlify:
   - Site settings > Environment variables
   - Tambahkan SUPABASE_URL dan SUPABASE_ANON_KEY

### C. Deploy ke VPS/Server Sendiri

1. **Setup Server** (Ubuntu/CentOS):
   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2 untuk process management
   sudo npm install -g pm2
   
   # Install Nginx untuk reverse proxy
   sudo apt install nginx
   ```

2. **Upload aplikasi ke server**:
   ```bash
   # Clone atau upload files
   git clone your-repo.git
   cd koperasi-app
   npm install
   ```

3. **Setup PM2**:
   ```bash
   # Start aplikasi dengan PM2
   pm2 start server.js --name "koperasi-app"
   pm2 startup
   pm2 save
   ```

4. **Setup Nginx**:
   ```nginx
   # /etc/nginx/sites-available/koperasi-app
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. **Enable site dan restart Nginx**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/koperasi-app /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. **Setup SSL dengan Let's Encrypt**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## 4. Testing dan Monitoring

### A. Test Koneksi Database
1. Buka aplikasi di browser
2. Coba login dengan user admin
3. Test CRUD operations (tambah anggota, barang, dll)
4. Monitor di Supabase Dashboard > Logs

### B. Performance Monitoring
1. Setup monitoring di Vercel/Netlify dashboard
2. Monitor database performance di Supabase
3. Setup alerts untuk error dan downtime

## 5. Backup dan Security

### A. Database Backup
1. Setup automatic backup di Supabase (Pro plan)
2. Atau setup manual backup script:
   ```bash
   pg_dump "postgresql://user:pass@host:port/db" > backup.sql
   ```

### B. Security Checklist
- [ ] Enable HTTPS/SSL
- [ ] Setup proper RLS policies di Supabase
- [ ] Use environment variables untuk credentials
- [ ] Enable rate limiting
- [ ] Setup monitoring dan alerts
- [ ] Regular security updates

## 6. Domain dan DNS

### A. Setup Custom Domain
1. Beli domain di registrar (Namecheap, GoDaddy, dll)
2. Point DNS ke hosting:
   - **Vercel**: Add CNAME record ke vercel.app
   - **Netlify**: Add CNAME record ke netlify.app
   - **VPS**: Add A record ke IP server

### B. SSL Certificate
- Vercel/Netlify: Otomatis
- VPS: Gunakan Let's Encrypt (gratis)

## 7. Maintenance

### A. Regular Tasks
- Monitor database size dan performance
- Update dependencies secara berkala
- Backup data reguler
- Monitor error logs
- Update security patches

### B. Scaling
- Upgrade Supabase plan jika perlu
- Optimize database queries
- Setup CDN untuk static assets
- Consider database indexing

---

**Estimasi Biaya Bulanan:**
- Supabase: $0-25/bulan (tergantung usage)
- Vercel: $0-20/bulan
- Domain: $10-15/tahun
- Total: ~$25-45/bulan untuk aplikasi production-ready

**Timeline Setup:**
- Database setup: 1-2 jam
- Deployment: 30 menit - 2 jam
- Testing: 2-4 jam
- Total: 4-8 jam untuk setup lengkap